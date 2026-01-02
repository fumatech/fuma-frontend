import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import { Link, useNavigate } from "react-router-dom";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";

function EditSaleReturnOrder() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vendor, setVendor] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [addedBy, setAddedBy] = useState("");
  const [orderDate, setOrderDate] = useState();
  const [location, setLocation] = useState("");
  const [file, setFile] = useState(null);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [productsData, setProductsData] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVariations, setSelectedVariations] = useState({});
  const [vendorlist, setVendorList] = useState([]);
  const [totalUnits, setTotalUnits] = useState(0);
  const [initialQuantities, setInitialQuantities] = useState({});
  const [updatedTotalUnits, setUpdatedTotalUnits] = useState(0);
  const [franchiseId, setFranchiseId] = useState();
  useEffect(() => {
    const fetchPurchaseData = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/franchise-purchase-return/get/${id}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch purchase data");
        }

        const purchase = await response.json();

        // Setting state based on the fetched data
        setVendor(purchase.vendor);
        setReferenceNumber(purchase.referenceNumber);
        setAddedBy(purchase.addedBy);
        setOrderDate(new Date(purchase.orderDate));
        setLocation(purchase.location);
        setAdditionalNotes(purchase.additionalNotes);
        setFranchiseId(purchase.franchiseId);
        const selectedProducts = purchase.franchisePurchaseReturnItems.map(
          (item) => ({
            id: item.id,
            productName: item.productName,
            sku: item.productSku,
            quantity: item.quantity, // Order quantity
            updatedQuantity: item.quantity, // Default shipping quantity
            variationValue: item.productVariationName,
            productId: item.productId,
            productVariationId: item.productVariationId,
          })
        );

        // Store the initial quantities
        const initialQuantities = purchase.franchisePurchaseReturnItems.reduce(
          (acc, item) => {
            acc[item.productVariationId] = item.quantity;
            return acc;
          },
          {}
        );

        setInitialQuantities(initialQuantities); // Set initial quantities

        setSelectedProducts(selectedProducts);
        setProductsData(purchase.franchisePurchaseReturnItems);
        setTotalUnits(purchase.totalItems);

        // Set the initial total units (before edit)
        const totalBeforeEdit = purchase.orderItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        setTotalUnits(totalBeforeEdit); // Set total items before edit
      } catch (error) {
        console.error("Error fetching purchase data:", error);
      }
    };

    fetchPurchaseData();
  }, [id]);

  useEffect(() => {
    const totalUnits = selectedProducts.reduce(
      (total, product) => total + product.quantity,
      0
    );
  }, [selectedProducts]);

  useEffect(() => {
    const calculatedTotalUnits = selectedProducts.reduce((total, product) => {
      return total + product.quantity;
    }, 0);
    setTotalUnits(calculatedTotalUnits); // Set the total units amount
  }, [selectedProducts]);

  useEffect(() => {
    const calculatedTotalShippedUnits = selectedProducts.reduce(
      (shiptotal, product) => {
        return shiptotal + (product.updatedQuantity || 0);
      },
      0
    );
    setUpdatedTotalUnits(calculatedTotalShippedUnits);
  }, [selectedProducts]);

  const handleUpdatedQuantityChange = (productId, newQuantity) => {
    setSelectedProducts((prevProducts) =>
      prevProducts.map((product) =>
        product.id === productId
          ? { ...product, updatedQuantity: parseInt(newQuantity) || 0 }
          : product
      )
    );
  };

  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value) {
      await searchProducts(value);
    } else {
      setSearchResults([]); // Clear results if the search term is empty
    }
  };
  const searchProducts = async (query) => {
    try {
      const response = await fetch(
        `${
          process.env.REACT_APP_BASE_URL
        }/product/search/active?query=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      setSearchResults(data); // Set the search results
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      searchProducts(searchTerm);
    }
  };
  const handleAddProduct = (product) => {
    const variationsToAdd = product.productVariations.filter(
      (variation) => selectedVariations[variation.id] // Only add selected variations
    );

    if (variationsToAdd.length === 0) {
      toast.warning("Please select at least one variation to add.");
      return;
    }
    const newProducts = variationsToAdd
      .map((variation) => {
        const isDuplicate = selectedProducts.some(
          (p) => p.id === product.id && p.variationId === variation.id
        );
        if (!isDuplicate) {
          return {
            ...product,
            ...variation, // Spread variation properties into product object
            quantity: 1, // Set default quantity
            discountPercent: 0, // Set default discount percent
          };
        }
        return null; // Return null for duplicates
      })
      .filter(Boolean); // Remove nulls from the array
    setSelectedProducts((prev) => [...prev, ...newProducts]);
    setSelectedVariations({}); // Clear selected variations after adding
    setSearchResults([]);
    setSearchTerm("");
  };
  const handleVariationSelect = (variationId, isSelected) => {
    setSelectedVariations((prev) => ({
      ...prev,
      [variationId]: isSelected,
    }));
  };

  const handleRemoveProduct = (id) => {
    setSelectedProducts((prev) => prev.filter((product) => product.id !== id));
  };
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };
  const handleAdditionalNotesChange = (e) => {
    setAdditionalNotes(e.target.value);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prepare the order items with both orderQuantity and updatedShipQuantity
    const franchisePurchaseReturnItems = selectedProducts.map((product) => ({
      productName: product.productName,
      productSku: product.sku,
      productVariationId: product.productVariationId,
      productId: product.productId,
      productVariationName: product.variationValue,
      quantity: product.quantity, // This is the order quantity
      updatedQuantity: product.updatedQuantity, // Shipping quantity (editable)
    }));

    const productStocks = selectedProducts.map((item) => ({
      productId: item.productId,
      variationId: item.productVariationId,
      quantity: item.updatedQuantity,
      transactionType: "sale_return",
      date: new Date().toISOString().split("T")[0], // Current date
      note: "Stock updated after Sale return received", // Optional note
    }));

    const payload = {
      id,
      vendor,
      status: 1,
      referenceNumber,
      addedBy,
      franchiseId,
      orderDate: orderDate ? orderDate.toISOString().split("T")[0] : null,
      location,
      totalItems: totalUnits,
      totalShippedItems: updatedTotalUnits,
      additionalNotes,
      franchisePurchaseReturnItems,
    };

    // console.log(payload);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/franchise-purchase-return/update/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        // const errorText = await response.text();
        // console.error("Error updating purchase:", errorText);
        toast.error("Failed to update order. Please check your inputs.");
      } else {
        const stockTransactions = productStocks;

        const statusResponse = await fetch(
          `${process.env.REACT_APP_BASE_URL}/stock-transactions/add`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(stockTransactions),
          }
        );

        if (statusResponse.ok) {
          const prodStocks = selectedProducts.map((item) => ({
            productId: item.productId,
            variationId: item.productVariationId,
            quantity: item.updatedQuantity,
            transactionType: "product_replaced",
            date: new Date().toISOString().split("T")[0], // Current date
            note: "Stock updated after Sale return replaced", // Optional note
          }));

          const franchisePurchaseReturn = {
            vendor,
            status: 3,
            referenceNumber,
            addedBy,
            franchiseId,
            orderDate: orderDate ? orderDate.toISOString().split("T")[0] : null,
            location,
            totalItems: totalUnits,
            totalShippedItems: updatedTotalUnits,
            additionalNotes,
            franchisePurchaseReturnItems,
            stockTransactions: prodStocks,
          };

          const saveresponse = await fetch(
            `${process.env.REACT_APP_BASE_URL}/franchise-purchase-return/save`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(franchisePurchaseReturn),
            }
          );
          if (saveresponse.ok) {
            toast.success("Sales Return Accepted successfully");
            navigate(`/SaleReturn`);
          } else {
            toast.error("Error updating");
          }
        } else {
          // const errorText = await statusResponse.text();
          // console.error("Error updating purchase status:", errorText);
          toast.error("Error updating status. Check logs.");
        }
      }
    } catch (error) {
      // console.error("Error:", error);
      toast.error("An unexpected error occurred.");
    }
  };

  return (
    <>
      <div className="wrapper">
        <div className="content-wrapper">
          <section className="content-header">
            <div className="container-fluid">
              <div className="row mb-2">
                <div className="col-sm-6">
                  <h1 className="all-heading"> Accept Sale Return</h1>
                </div>
              </div>
            </div>
          </section>
          <section className="content">
            <div className="container-fluid">
              <form onSubmit={handleSubmit}>
                <div className="card card-default rounded-4 border-0 cardHover">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="vendor">
                            Vendor<span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control rounded"
                            id="vendor"
                            name="vendor"
                            placeholder="Enter here..."
                            value={vendor}
                            required
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="referenceNumber">
                            Reference No<span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control rounded"
                            id="referenceNumber"
                            name="referenceNumber"
                            placeholder="Enter here.."
                            value={referenceNumber}
                            onChange={(e) => setReferenceNumber(e.target.value)}
                            required
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="addedBy">
                            Added By<span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control rounded"
                            id="addedBy"
                            name="addedBy"
                            placeholder="Enter here..."
                            value={addedBy}
                            onChange={(e) => setAddedBy(e.target.value)}
                            required
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group d-flex flex-row flex-md-column">
                          <label htmlFor="transaction_date">Return Date</label>
                          <DatePicker
                            selected={orderDate}
                            onChange={(date) => setOrderDate(date)}
                            className="form-control w-100 ms-1 ms-md-0 py-3 rounded-1"
                            dateFormat="MM/dd/yyyy"
                            required
                            readOnly
                            minDate={new Date()} // Prevent past dates
                            popperPlacement="top" // Display the calendar above
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card card-default rounded-4 border-0 cardHover">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-12">
                        {/* <div className="search-bar">
                          <div className="search-input">
                            <i className="fa fa-search search-icon"></i>
                            <input
                              type="text"
                              placeholder="Enter Product name / SKU / Scan bar code"
                              value={searchTerm}
                              onChange={handleSearch}
                              onKeyPress={handleKeyPress} // Listen for Enter key press
                            />
                          </div>
                        </div> */}

                        <div className="product-list">
                          {searchTerm && searchResults.length > 0 ? (
                            searchResults.map((product) => (
                              <div key={product.id} className="product-item">
                                <span className="product-name">
                                  {product.productName} ({product.sku}) - Stock:{" "}
                                  {product.stock}
                                </span>
                                {product.productVariations.length > 0 && (
                                  <div className="variations">
                                    <ul>
                                      {product.productVariations.map(
                                        (variation) => (
                                          <li key={variation.id}>
                                            <label>
                                              <input
                                                type="checkbox"
                                                checked={
                                                  selectedVariations[
                                                    variation.id
                                                  ] || false
                                                }
                                                onChange={(e) =>
                                                  handleVariationSelect(
                                                    variation.id,
                                                    e.target.checked
                                                  )
                                                }
                                              />
                                              {variation.name}{" "}
                                              {variation.variationValue}
                                            </label>
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                )}
                                <button
                                  onClick={() => handleAddProduct(product)}
                                  className="btn btn-add-variation btn-success"
                                >
                                  Add Selected Variations
                                </button>
                              </div>
                            ))
                          ) : searchTerm && searchResults.length === 0 ? (
                            <div className="no-results highlight-message">
                              No products found or the search term is invalid.
                            </div>
                          ) : null}
                        </div>

                        {selectedProducts.length > 0 && (
                          <div className="table-responsive">
                            <table className="table">
                              <thead>
                                <tr>
                                  <th>#</th>
                                  <th>Product Name</th>
                                  <th>Return Quantity</th>
                                  <th>Acepted Return Quantity</th>
                                  {/* <th>Actions</th> */}
                                </tr>
                              </thead>
                              <tbody>
                                {selectedProducts.map((product, index) => (
                                  <tr key={product.id}>
                                    <td>{index + 1}</td>
                                    <td>
                                      {product.productName} ({product.sku}){" "}
                                      {product.name} {product.variationValue}
                                    </td>
                                    {/* Order Quantity: Non-editable */}
                                    <td>
                                      <input
                                        type="number"
                                        value={product.quantity} // Initial order quantity
                                        readOnly // Make it non-editable
                                        className="form-control"
                                      />
                                    </td>
                                    {/* Shipping Quantity: Editable */}
                                    <td>
                                      <input
                                        type="number"
                                        min="1"
                                        value={product.updatedQuantity} // Display the current shipping quantity
                                        onChange={(e) =>
                                          handleUpdatedQuantityChange(
                                            product.id,
                                            e.target.value
                                          )
                                        } // Handle changes
                                        className="form-control"
                                      />
                                    </td>

                                    {/* <td>
                                      <button
                                        type="button"
                                        className="btn btn-danger"
                                        onClick={() =>
                                          handleRemoveProduct(product.id)
                                        }
                                      >
                                        <i className="fa fa-trash"></i>
                                      </button>
                                    </td> */}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <div>Total units : {totalUnits}</div>
                            <div>
                              Total Accpeted units : {updatedTotalUnits}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card card-default rounded-4 border-0 cardHover">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-12">
                        <div className="form-group">
                          <label>Additional Notes</label>
                          <textarea
                            className="form-control"
                            rows="3"
                            name="additional_notes"
                            cols="50"
                            id="additional_notes"
                            value={additionalNotes}
                            onChange={handleAdditionalNotesChange}
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="container-fluid text-center mt-3">
                  <button
                    type="submit"
                    className="btn btn-save btn-lg px-4 py-2 m-2 "
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

export default EditSaleReturnOrder;
