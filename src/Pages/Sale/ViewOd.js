import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function ViewOd() {
  const { id } = useParams();
  const [currentStocks, setCurrentStocks] = useState({});
  const [vendor, setVendor] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [addedBy, setAddedBy] = useState("");
  const [orderDate, setOrderDate] = useState(new Date());
  const [deliveryDate, setDeliveryDate] = useState(new Date());
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
  const [totalUnits, setTotalUnits] = useState(0); // New state for total units

  useEffect(() => {
    const fetchCurrentStocks = async () => {
      const stockData = {};

      for (const product of productsData) {
        try {
          let response;
          if (product.productVariationId) {
            // Fetch stock for variation
            response = await fetch(
              `${process.env.REACT_APP_BASE_URL}/stock-transactions/current-stock-byvariation/${product.productVariationId}`
            );
          } else {
            // Fetch stock for base product
            response = await fetch(
              `${process.env.REACT_APP_BASE_URL}/stock-transactions/current-stock/${product.id}`
            );
          }

          const stock = await response.json();
          stockData[product.productVariationId || product.id] = stock;
        } catch (error) {
          console.error("Error fetching stock:", error);
          stockData[product.productVariationId || product.id] = 0;
        }
      }

      setCurrentStocks(stockData);
    };

    if (productsData.length > 0) {
      fetchCurrentStocks();
    }
  }, [productsData]);
  useEffect(() => {
    const fetchPurchaseData = async () => {
      try {
        const response = await fetch(
          `https://fusionmastertech.com:8443/franchisepurchaseorder/get/${id}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch purchase data");
        }

        const purchase = await response.json();

        // Setting state based on the fetched data
        setVendor(purchase.franchiseName);
        setDeliveryDate(purchase.deliveryDate);
        setReferenceNumber(purchase.referenceNumber);
        setAddedBy(purchase.addedBy);
        setOrderDate(new Date(purchase.orderDate));
        setLocation(purchase.location);
        setAdditionalNotes(purchase.additionalNotes);

        // Pre-select products and variations
        const selectedProducts = purchase.franchiseOrderItems.map((item) => ({
          id: item.id,
          productName: item.productName,
          sku: item.productSku,
          quantity: item.quantity,
          updatedQuantity: item.updatedQuantity,
          productVariationName: item.productVariationName,
          productVariationId: item.productVariationId,
        }));

        const selectedVariations = {};
        purchase.franchiseOrderItems.forEach((item) => {
          selectedVariations[item.productVariationId] = true;
        });

        setSelectedProducts(selectedProducts);
        setSelectedVariations(selectedVariations);

        setProductsData(purchase.franchiseOrderItems);
        setTotalUnits(purchase.totalItems);
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
  const handleAddProduct = (product) => {
    const variationsToAdd = product.productVariations.filter(
      (variation) => selectedVariations[variation.id] // Only add selected variations
    );

    if (variationsToAdd.length === 0) {
      alert("Please select at least one variation to add.");
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
  const handleQuantityChange = (id, value) => {
    setSelectedProducts((prev) =>
      prev.map((product) =>
        product.id === id ? { ...product, quantity: parseInt(value) } : product
      )
    );
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
    e.preventDefault(); // Prevent default form submission

    // Convert the OrderDate to ISO string if valid
    const formattedOrderDate = orderDate
      ? orderDate.toISOString().split("T")[0]
      : null;

    // Prepare the purchase items
    const franchiseOrderItems = selectedProducts.map((product) => ({
      productId: product.id,
      productName: product.productName,
      productSku: product.sku,
      productVariationId: product.id, // Adjust according to your data
      productVariationName: product.variationName, // Assuming 'variationName' exists
      quantity: product.quantity,
    }));

    // Prepare the payload
    const payload = {
      id: id, // Include purchase ID
      vendor,
      referenceNumber,
      addedBy,
      orderDate: formattedOrderDate, // Adjusted to include date only
      location,
      file,
      totalItems: totalUnits, // Total number of items
      additionalNotes,
      franchiseOrderItems,
    };
    // console.log("Payload:", payload); // Debug payload before submitting
    try {
      const response = await fetch(
        `https://fusionmastertech.com:8443/franchisepurchaseorder/update/${id}`,
        {
          method: "PUT", // Change method to PUT
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        // console.log("Purchase updated successfully");
        // Optionally reset form or navigate to another page
      } else {
        const errorText = await response.text();
        console.error("Error updating purchase:", errorText);
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
                  <h1 className="all-heading">View Order</h1>
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
                            Franchise Name<span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control rounded"
                            id="vendor"
                            name="vendor"
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
                        <div className="form-group d-flex flex-row  flex-md-column ">
                          <label htmlFor="transaction_date">Order Date</label>
                          <DatePicker
                            selected={orderDate}
                            onChange={(date) => setOrderDate(date)}
                            className="form-control w-100 ms-1 ms-md-0 py-3 rounded-1"
                            dateFormat="MM/dd/yyyy"
                            required
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
                      <div className="col-md-4">
                        <div className="form-group d-flex flex-row  flex-md-column ">
                          <label htmlFor="transaction_date">
                            Delivery Date
                          </label>
                          <DatePicker
                            selected={deliveryDate}
                            onChange={(date) => setDeliveryDate(date)}
                            className="form-control w-100 ms-1 ms-md-0 py-3 rounded-1"
                            dateFormat="MM/dd/yyyy"
                            required
                            disabled
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
                                  <th>Current Stock</th>
                                  <th>Order Quantity</th>
                                  <th>Accepted Quantity</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedProducts.map((product, index) => {
                                  const stockKey =
                                    product.productVariationId || product.id;
                                  return (
                                    <tr key={product.id}>
                                      <td>{index + 1}</td>
                                      <td>
                                        {product.productName} ({product.sku}){" "}
                                        {product.productVariationName &&
                                          `- ${product.productVariationName}`}
                                      </td>
                                      <td>
                                        {currentStocks[stockKey] !==
                                        undefined ? (
                                          <span className="badge bg-primary">
                                            {currentStocks[stockKey]}
                                          </span>
                                        ) : (
                                          <span className="text-muted">
                                            Loading...
                                          </span>
                                        )}
                                      </td>
                                      <td>
                                        <input
                                          type="number"
                                          value={product.quantity}
                                          min="1"
                                          className="form-control text-secondary"
                                          readOnly
                                        />
                                      </td>
                                      <td>
                                        <input
                                          type="number"
                                          className="form-control text-secondary"
                                          value={product.updatedQuantity}
                                          min="1"
                                          readOnly
                                        />
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
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* <div className="container-fluid text-center mt-3">
                  <button
                    type="submit"
                    className="btn btn-save btn-lg px-4 py-2 m-2 "
                    disabled
                  >
                    Save
                  </button>
                </div> */}
              </form>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

export default ViewOd;
