import React, { useEffect, useState } from "react";
import BackButton from "../../components/BackButton";
import { useNavigate, Link, useParams } from "react-router-dom";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Tooltip, OverlayTrigger } from "react-bootstrap";
import { toast } from "react-toastify";

function ShipWarrantyClaim() {
  const { id } = useParams();

  const navigate = useNavigate();
  const [adjustmentDate, setAdjustmentDate] = useState(new Date());
  const [adjustmentType, setAdjustmentType] = useState("");
  const [businessLocation, setBusinessLocation] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [locations, setLocations] = useState([]);
  const [productList, setProductList] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedVariations, setSelectedVariations] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [reason, setReason] = useState("");
  const [amountRecovered, setAmountRecovered] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [totalUnits, setTotalUnits] = useState(0);
  const [prevTotalUnits, setPrevTotalUnits] = useState(0);
  const [prevTotalAmount, setPrevTotalAmount] = useState(0);

  useEffect(() => {
    // Fetch stock adjustment data when component mounts
    const fetchStockAdjustmentData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:8081/warranty-claim/get/${id}`
        );
        const data = response.data;

        setAdjustmentDate(data.date);
        setBusinessLocation(data.businessLocation);
        setReferenceNumber(data.referenceNumber);
        setTotalAmount(data.totalAmount);
        setPrevTotalAmount(data.totalAmount);
        setPrevTotalUnits(data.totalUnits);
        setTotalUnits(data.totalUnits);
        setReason(data.reason);

        // Pre-select products and variations
        const selectedProducts = data.warrantyClaimItems.map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          sku: item.productSku,
          quantity: item.quantity,
          defaultSellingPrice: item.unitSellingPrice,
          productVariationId: item.productVariationId,
          variationName: item.productVariationName,
        }));

        // Initialize selectedVariations by selecting variations from the fetched items
        const selectedVariations = {};
        data.warrantyClaimItems.forEach((item) => {
          selectedVariations[item.productVariationId] = true; // mark variation as selected
        });

        // Set the selected state variables
        setSelectedProducts(selectedProducts);
        setSelectedVariations(selectedVariations);

        setLoading(false);
      } catch (error) {
        setError("Error fetching stock adjustment data");
        setLoading(false);
      }
    };

    fetchStockAdjustmentData();
  }, []);

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
        `${process.env.REACT_APP_BASE_URL
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
            ...variation,
            productId: product.id,
            productVariationId: variation.id,
            quantity: 1, // Set default quantity
            discountPercent: 0, // Set default discount percent
          };
        }
        return null; // Return null for duplicates
      })
      .filter(Boolean); // Remove nulls from the array
    setSelectedProducts((prev) => [...prev, ...newProducts]);
    setSelectedVariations({}); // Clear selected variations after adding

    // Clear search results and reset the search term
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
  const handleUpadtedQuantityChange = (id, value) => {
    setSelectedProducts((prev) =>
      prev.map((product) =>
        product.id === id ? { ...product, quantity: parseInt(value) } : product
      )
    );
  };
  const handleRemoveProduct = (id) => {
    setSelectedProducts((prev) => prev.filter((product) => product.id !== id));
  };
  const handleReferenceNumberChange = (event) =>
    setReferenceNumber(event.target.value);
  const handleAdjustmentTypeChange = (event) =>
    setAdjustmentType(event.target.value);
  const handleBusinessLocationChange = (event) =>
    setBusinessLocation(event.target.value);
  const handleSearchChange = (event) => setSearchTerm(event.target.value);

  const handleReasonChange = (event) => setReason(event.target.value);

  const handleAmountRecovered = (event) =>
    setAmountRecovered(event.target.value);

  const calculateTotalAmount = (shipping) => {
    const total =
      productList.reduce((acc, item) => acc + item.price * item.quantity, 0) +
      shipping;
    setTotalAmount(total);
  };
  useEffect(() => {
    const units = selectedProducts.reduce(
      (sum, product) => sum + product.quantity,
      0
    );
    setTotalUnits(units);
  }, [selectedProducts]);

  useEffect(() => {
    const amount = selectedProducts.reduce(
      (sum, product) => sum + product.defaultSellingPrice * product.quantity,
      0
    );
    setTotalAmount(amount);
  }, [selectedProducts]);

  const handleProductSelect = (product) => {
    const exists = productList.find((item) => item.id === product.id);
    if (!exists) {
      setProductList([...productList, { ...product, quantity: 1 }]);
    }
    setSearchTerm(""); // Clear search after selection
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true); // Show loading indicator

    const stockAdjustmentData = {
      businessLocation,
      referenceNumber,
      date: adjustmentDate,
      status: 3,
      adjustmentType,
      prevTotalUnits,
      totalAmount,
      prevTotalAmount,
      totalUnits,
      amountRecovered,
      reason,
      warrantyClaimItems: selectedProducts.map((product) => ({
        productId: product.productId,
        productName: product.productName,
        productSku: product.productSku,
        productVariationId: product.productVariationId,
        productVariationName: product.variationName,
        quantity: product.quantity,
        lineTotal: product.defaultSellingPrice * product.quantity,
        unitSellingPrice: product.defaultSellingPrice,
      })),
      stockTransaction: selectedProducts.map((product) => ({
        productId: product.productId,
        variationId: product.productVariationId,
        quantity: product.quantity,
        transactionType: "product_replaced",
        date: adjustmentDate,
        note: "Stock Out from warehouse", // Can be customized if needed
      })),
    };

    // console.log("Submitting stock adjustment data:", stockAdjustmentData);

    try {
      // Save the warranty claim
      const saveResponse = await fetch(
        `${process.env.REACT_APP_BASE_URL}/warranty-claim/save`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(stockAdjustmentData),
        }
      );

      if (!saveResponse.ok) {
        throw new Error("Error saving warranty claim.");
      }

      const savedWarrantyClaim = await saveResponse.json();
      //console.log("Saved warranty claim:", savedWarrantyClaim);

      // Update the warranty claim using the `id` from URL params
      const updateResponse = await fetch(
        `http://localhost:8081/warranty-claim/update/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(stockAdjustmentData),
        }
      );

      if (!updateResponse.ok) {
        throw new Error("Error updating warranty claim.");
      }

      const updatedWarrantyClaim = await updateResponse.json();
      // console.log("Updated warranty claim:", updatedWarrantyClaim);

      // Prepare stock transactions for saving
      const stockTransactions = selectedProducts.map((product) => ({
        productId: product.productId,
        variationId: product.productVariationId,
        quantity: product.quantity,
        transactionType: "product_claimed",
        date: adjustmentDate,
        note: "Stock added to warehouse", // Can be customized if needed
      }));

      // Save stock transactions
      const stockTransactionsResponse = await fetch(
        `${process.env.REACT_APP_BASE_URL}/stock-transactions/add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(stockTransactions),
        }
      );

      if (!stockTransactionsResponse.ok) {
        throw new Error("Error saving stock transactions.");
      }

      const savedStockTransactions = await stockTransactionsResponse.json();
      toast.success("Warranty Claimed process completed successfully.");
      navigate("/ListShippedWarrantyClaim");
    } catch (error) {
      //setError(error.message); // Display error in the UI
      toast.error("Error during stock adjustment process:", error);
    } finally {
      setLoading(false); // Hide loading indicator
    }
  };

  return (
    <>
      <div className="wrapper">
        <div className="content-wrapper">
          <section className="content-header">
            <div className="container-fluid">
              <div className="row mb-2">
                <div className="col-md-6 d-flex align-items-center flex-wrap gap-2">
                  <BackButton />
                  <h1 className=" all-heading mb-0">Ship warranty claim </h1>
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
                      <div className="form-group col-md-3">
                        <label htmlFor="businessLocation">
                          Business Location:*
                        </label>
                        <select
                          id="businessLocation"
                          name="businessLocation"
                          className="form-control"
                          required
                          readOnly
                          value={businessLocation}
                          onChange={handleBusinessLocationChange}
                        >
                          <option value="" disabled>
                            Please Select
                          </option>
                          <option value="FUMA">FUMA</option>
                        </select>
                      </div>{" "}
                      <div className="form-group col-md-3">
                        <label htmlFor="referenceNumber">Reference No:</label>
                        <input
                          type="text"
                          className="form-control"
                          id="referenceNumber"
                          name="referenceNumber"
                          required
                          value={referenceNumber}
                          readOnly
                          onChange={handleReferenceNumberChange}
                        />
                      </div>
                      <div className="col-md-3">
                        <div className="form-group d-flex flex-row flex-md-column">
                          <label htmlFor="transaction_date">Date:*</label>
                          <DatePicker
                            selected={adjustmentDate}
                            disabled
                            onChange={(date) => setAdjustmentDate(date)}
                            dateFormat="MM/dd/yyyy"
                            className="form-control w-100 ms-1 ms-md-0 py-3 rounded-1"
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
                                              {variation.variationValue} -
                                              Price:{" "}
                                              {
                                                variation.defaultPurchasePriceExcTax
                                              }
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
                                  <th>Received Claim</th>
                                  <th>Unit Selling Price (Inc. tax)</th>
                                  <th>Line Total</th>
                                  <th>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedProducts.map((product, index) => {
                                  const unitCostBeforeDiscount =
                                    product.defaultPurchasePriceExcTax || 0;
                                  const unitCostAfterDiscount =
                                    unitCostBeforeDiscount *
                                    (1 - (product.discountPercent || 0) / 100);
                                  const lineTotal =
                                    product.defaultSellingPrice *
                                    product.quantity;

                                  const defaultSellingPrice =
                                    product.defaultSellingPrice;

                                  return (
                                    <tr key={product.id}>
                                      <td>{index + 1}</td>
                                      <td>
                                        {product.productName} ({product.sku}) (
                                        {product.productVariationId})
                                        {product.name} {product.variationValue}
                                      </td>
                                      <td>
                                        <input
                                          type="number"
                                          value={product.quantity}
                                          min="1"
                                          readOnly
                                          onChange={(e) =>
                                            handleQuantityChange(
                                              product.id,
                                              e.target.value
                                            )
                                          }
                                        />
                                      </td>

                                      <td>{defaultSellingPrice}</td>

                                      <td>{lineTotal}</td>

                                      <td>
                                        <button
                                          type="button"
                                          className="btn btn-danger"
                                          disabled
                                          onClick={() =>
                                            handleRemoveProduct(product.id)
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
                            <div>Total Amount: ₹{totalAmount}</div>
                            <div>Total Units : {totalUnits}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card card-default rounded-4 border-0 cardHover">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="reason">Reason:</label>
                          <textarea
                            className="form-control"
                            rows={2}
                            name="reason"
                            id="reason"
                            readOnly
                            value={reason}
                            onChange={handleReasonChange}
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

export default ShipWarrantyClaim;
