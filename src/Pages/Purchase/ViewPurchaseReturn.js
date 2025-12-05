import React, { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./AddPurchase.css"; // Ensure this file contains the appropriate styles
import axios from "axios";
function ViewPurchaseReturn() {
  const { id } = useParams();

  const navigate = useNavigate();
  const [vendor, setVendor] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [addedBy, setAddedBy] = useState("");
  const [orderDate, setOrderDate] = useState(new Date());
  const [location, setLocation] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVariations, setSelectedVariations] = useState({});
  const [vendorlist, setVendorList] = useState([]);
  const [totalUnits, setTotalUnits] = useState(0); // New state for total units
  const [userEmail, setUserEmail] = useState(null);
  const [userName, setUserName] = useState("");
  const [productStocks, setProductStocks] = useState({}); // Store stocks by variationId

  useEffect(() => {
    const fetchPurchaseData = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/purchase-return/get/${id}`
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

        // Pre-select products and variations
        const selectedProducts = purchase.purchaseReturnItems.map((item) => ({
          id: item.id,
          productName: item.productName,
          sku: item.productSku,
          quantity: item.quantity,
          productVariationName: item.productVariationName,
          updatedQuantity: item.updatedQuantity,
          productVariationId: item.productVariationId,
        }));

        const selectedVariations = {};
        purchase.purchaseReturnItems.forEach((item) => {
          selectedVariations[item.productVariationId] = true;
        });

        setSelectedProducts(selectedProducts);
        setSelectedVariations(selectedVariations);

        //  setProductsData(purchase.purchaseReturnItems);
        setTotalUnits(purchase.totalItems);
        //   setTotalShippedItems(purchase.totalShippedItems);
      } catch (error) {
        console.error("Error fetching purchase data:", error);
      }
    };

    fetchPurchaseData();
  }, [id]);
  useEffect(() => {
    const email = sessionStorage.getItem("userEmail");
    if (email) {
      setUserEmail(email);
      fetch(`${process.env.REACT_APP_BASE_URL}/user/username?email=${email}`)
        .then((response) => response.json())
        .then((data) => {
          if (data) {
            setUserName(data); // Set the username in
          }
        })
        .catch((error) => console.error("Error fetching username:", error));
    }
  }, []);
  useEffect(() => {
    const totalUnits = selectedProducts.reduce(
      (total, product) => total + product.quantity,
      0
    );
  }, [selectedProducts]);
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/vendor/getallactive`
        );
        const data = await response.json();
        setVendorList(data); // Set the search results
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchVendors();
  }, []);
  useEffect(() => {
    const calculatedTotalUnits = selectedProducts.reduce((total, product) => {
      return total + product.quantity;
    }, 0);
    setTotalUnits(calculatedTotalUnits); // Set the total units amount
  }, [selectedProducts]);
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
        `${process.env.REACT_APP_BASE_URL}/product/search?query=${query}`
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
  const handleAddProduct = async (product) => {
    const variationsToAdd = product.productVariations.filter(
      (variation) => selectedVariations[variation.id] // Only add selected variations
    );

    if (variationsToAdd.length === 0) {
      alert("Please select at least one variation to add.");
      return;
    }

    let duplicateFound = false;

    // Fetch stock for each selected variation
    const newProducts = await Promise.all(
      variationsToAdd.map(async (variation) => {
        // Check if the product with the same variation already exists in the selected products list
        const existingProduct = selectedProducts.find(
          (p) => p.id === product.id && p.variationId === variation.id
        );

        if (existingProduct) {
          duplicateFound = true; // Set duplicateFound flag to true
          return null; // Don't add a new entry, just modify the existing one
        } else {
          try {
            // Fetch stock for the variation
            const response = await fetch(
              `${process.env.REACT_APP_BASE_URL}/stock-transactions/current-stock/${product.id}/${variation.id}`
            );
            const stockData = await response.json();

            console.log(stockData);

            // Return the new product with variation and stock data
            return {
              id: product.id,
              productName: product.productName,
              sku: product.sku,
              variationId: variation.id,
              variationName: variation.name,
              variationValue: variation.variationValue,
              quantity: 1, // Set default quantity
              stock: stockData, // Set stock from the API response
            };
          } catch (error) {
            console.error(
              `Error fetching stock for variation ${variation.id}:`,
              error
            );
            return null; // Skip adding the product if there's an error fetching stock
          }
        }
      })
    );

    const filteredProducts = newProducts.filter(Boolean); // Remove nulls (errors or duplicates)

    if (duplicateFound) {
      alert(
        "This product with variation is already added. Please increase the quantity."
      );
    } else if (filteredProducts.length > 0) {
      setSelectedProducts((prev) => [...prev, ...filteredProducts]);
    }

    // Reset selected variations, search results, and search term after adding products
    setSelectedVariations({});
    setSearchResults([]);
    setSearchTerm("");
  };
  const handleVariationSelect = (variationId, isSelected) => {
    setSelectedVariations((prev) => ({
      ...prev,
      [variationId]: isSelected,
    }));
  };
  const handleRemoveProduct = (variationId) => {
    setSelectedProducts((prev) =>
      prev.filter((product) => product.variationId !== variationId)
    );
  };
  const handleQuantityChange = (productId, variationId, newQuantity) => {
    setSelectedProducts((prevProducts) =>
      prevProducts.map((product) => {
        if (product.id === productId && product.variationId === variationId) {
          if (parseInt(newQuantity, 10) > product.stock) {
            alert("Quantity cannot exceed available stock!");
            return product; // Return the product without changing the quantity
          }
          return { ...product, quantity: parseInt(newQuantity, 10) || 1 };
        }
        return product;
      })
    );
  };
  const handleAdditionalNotesChange = (e) => {
    setAdditionalNotes(e.target.value);
  };
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    const formattedOrderDate = orderDate
      ? orderDate.toISOString().split("T")[0]
      : null;
    const purchaseReturnItems = selectedProducts.map((product) => ({
      productId: product.id,
      productName: product.productName,
      productSku: product.sku,
      productVariationId: product.variationId, // Adjust according to your data
      productVariationName: product.variationValue, // Assuming 'variationName' exists
      quantity: product.quantity,
    }));
    const productStocks = selectedProducts.map((item) => ({
      productId: item.id,
      variationId: item.variationId,
      quantity: item.quantity,
      transactionType: "purchase_return",
      date: new Date().toISOString().split("T")[0], // Current date
      note: "Stock updated after purchase return", // Optional note
    }));
    const payload = {
      vendor,
      status: 0,
      referenceNumber,
      addedBy: userName,
      orderDate: formattedOrderDate, // Adjusted to include date only
      location,
      totalItems: totalUnits, // Total number of items
      additionalNotes,
      purchaseReturnItems: purchaseReturnItems,
      stockTransactions: productStocks,
    };
    console.log("Payload:", payload); // Debug payload before submitting
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/purchase-return/save`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );
      if (response.ok) {
        alert("Purchase returned  successfully");
        navigate("/ReturnPurchase");
      } else {
        alert("Purchase Order Not Saved");
      }
    } catch (error) {
      console.error("Error:", error);
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
                  <h1 className="all-heading"> View Purchase Return</h1>
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
                        <div className="dropdown">
                          <div className="">
                            <label className="me-2 d-md-inline">Vendor</label>
                            <div className="d-flex align-items-center">
                              <select
                                className="form-select me-2"
                                id="vendor"
                                name="vendor"
                                value={vendor}
                                onChange={(e) => setVendor(e.target.value)}
                                required
                                disabled
                              >
                                <option value="">Please Select</option>
                                {vendorlist.map((vendorItem) => (
                                  <option
                                    key={vendorItem.id}
                                    value={vendorItem.firmName}
                                  >
                                    {vendorItem.firmName}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
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
                            value={userName}
                            onChange={(e) => setAddedBy(e.target.value)}
                            required
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group d-flex flex-row flex-md-column">
                          <label htmlFor="transaction_date">Order Date</label>
                          <DatePicker
                            selected={orderDate}
                            onChange={(date) => setOrderDate(date)}
                            className="form-control w-100 ms-1 ms-md-0 py-3 rounded-1"
                            dateFormat="MM/dd/yyyy"
                            required
                            minDate={new Date()} // Prevent past dates
                            popperPlacement="top" // Display the calendar above
                            disabled
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="location">
                            Location<span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control rounded"
                            id="location"
                            name="location"
                            placeholder="Enter here.."
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            required
                            readOnly
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
                        <div className="search-bar">
                          <div className="search-input w-100">
                            <i className="fa fa-search search-icon"></i>
                            <input
                              type="text"
                              placeholder="Enter Product name / SKU / Scan bar code"
                              value={searchTerm}
                              onChange={handleSearch}
                              onKeyPress={handleKeyPress} // Listen for Enter key press
                              disabled
                            />
                          </div>
                        </div>

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
                                  <th>Purchase Return Quantity</th>
                                  <th>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedProducts.map((product, index) => {
                                  return (
                                    <tr key={product.id}>
                                      <td>{index + 1}</td>
                                      <td>
                                        {product.productName} ({product.sku}){" "}
                                        {product.name} {product.variationValue}
                                      </td>
                                      <td>
                                        <div className="d-flex justify-content-center align-items-center">
                                          <input
                                            type="number"
                                            value={product.quantity}
                                            min="1"
                                            max={product.stock}
                                            readOnly
                                            className="form-control w-50 text-center"
                                            onChange={(e) =>
                                              handleQuantityChange(
                                                product.id,
                                                product.variationId,
                                                e.target.value
                                              )
                                            }
                                          />
                                        </div>
                                      </td>

                                      <td>
                                        <button
                                          type="button"
                                          className="btn btn-danger"
                                          disabled
                                          onClick={() =>
                                            handleRemoveProduct(
                                              product.variationId
                                            )
                                          }
                                        >
                                          <i className="fa fa-trash"></i>
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                            <div>Total units : {totalUnits}</div>
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
                            required
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              
              </form>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

export default ViewPurchaseReturn;
