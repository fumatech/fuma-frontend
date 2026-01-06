import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Tooltip, OverlayTrigger } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function ViewStockTransfer() {
  const { id } = useParams();
  const searchResultsRef = useRef(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const navigate = useNavigate();

  const [status, setStatus] = useState("");
  const [locations, setLocations] = useState([]);
  const [locationFrom, setLocationFrom] = useState("");
  const [locationTo, setLocationTo] = useState("");
  const [transferDate, setTransferDate] = useState(new Date());
  const [referenceNumber, setReferenceNumber] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedVariations, setSelectedVariations] = useState({});

  const [totalAmount, setTotalAmount] = useState(0);
  const [totalUnits, setTotalUnits] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fetchError, setFetchError] = useState("");

  const [shippingCharges, setShippingCharges] = useState(0);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [totalShippingAmount, setTotalShippingAmount] = useState(0);
  useEffect(() => {
    fetch(`${process.env.REACT_APP_BASE_URL}/business-locations/getall`)
      .then((res) => res.json())
      .then((data) => setLocations(data))
      .catch((err) => console.error("Error fetching locations:", err));
  }, []);
  const handleLocationFromChange = (e) => {
    const selectedFrom = e.target.value;
    setLocationFrom(selectedFrom);

    // If same location is already selected in "To", reset it
    if (locationTo === selectedFrom) {
      setLocationTo("");
    }
  };

  const handleLocationToChange = (e) => {
    setLocationTo(e.target.value);
  };
  useEffect(() => {
    const fetchStockTransfer = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/stock-transfer/get/${id}`
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch stock transfer: ${response.statusText}`
          );
        }

        const data = await response.json();

        // Set form data
        setStatus(data.status);
        setLocationFrom(data.locationFrom);
        setLocationTo(data.locationTo);
        setTransferDate(new Date(data.date));
        setReferenceNumber(data.referenceNumber || "");
        setShippingCharges(data.shippingCharges || 0);
        setAdditionalNotes(data.note || "");
        setTotalAmount(data.totalAmount || 0);
        setTotalUnits(data.totalUnits || 0);

        // Set selected products
        if (data.stockTransferItems && data.stockTransferItems.length > 0) {
          const products = data.stockTransferItems.map((item) => ({
            id: `${item.productId}-${
              item.productVariationId || "no-variation"
            }`,
            itemId: item.id, // ⭐ STORE DB ID
            productId: item.productId,
            productName: item.productName,
            sku: item.productSku,
            variationId: item.productVariationId,
            variationValue: item.productVariationName,
            variationName: item.productVariationName,
            productVariationId: item.productVariationId,
            defaultSellingPrice: item.unitPrice || 0,
            quantity: item.quantity,
          }));
          setSelectedProducts(products);

          // Initialize selected variations
          const variations = {};
          products.forEach((product) => {
            if (product.variationId) {
              variations[product.variationId] = true;
            }
          });
          setSelectedVariations(variations);
        }

        setLoading(false);
      } catch (error) {
        setFetchError("Error loading stock transfer data");
        setLoading(false);
        console.error("Error fetching stock transfer:", error);
      }
    };

    fetchStockTransfer();
  }, [id]);

  // Product search functionality
  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value) await searchProducts(value);
    else setSearchResults([]);
    setFocusedIndex(-1);
  };

  const searchProducts = async (query) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/product/search?query=${query}`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && searchTerm) {
      if (focusedIndex >= 0) {
        e.preventDefault();
        handleProductSelect(searchResults[focusedIndex]);
        setSearchResults([]);
        setSearchTerm("");
      } else {
        searchProducts(searchTerm);
      }
    } else if (searchResults.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        scrollToFocusedItem();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        scrollToFocusedItem();
      }
    }
  };

  const scrollToFocusedItem = () => {
    if (searchResultsRef.current && focusedIndex >= 0) {
      const items = searchResultsRef.current.querySelectorAll(".product-row");
      if (items[focusedIndex]) {
        items[focusedIndex].scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  };

  const handleProductSelect = (product) => {
    if (product.productVariations && product.productVariations.length > 0) {
      const allVariationsSelected = product.productVariations.every(
        (variation) => selectedVariations[variation.id]
      );

      const newSelectedVariations = { ...selectedVariations };

      product.productVariations.forEach((variation) => {
        newSelectedVariations[variation.id] = !allVariationsSelected;
      });

      setSelectedVariations(newSelectedVariations);
      updateSelectedProducts(product, newSelectedVariations);
    } else {
      const isSelected = selectedVariations[product.id];
      const newSelectedVariations = {
        ...selectedVariations,
        [product.id]: !isSelected,
      };
      setSelectedVariations(newSelectedVariations);
      updateSelectedProducts(product, newSelectedVariations);
    }
  };

  const updateSelectedProducts = (product, variations) => {
    if (product.productVariations && product.productVariations.length > 0) {
      const selectedVars = product.productVariations.filter(
        (variation) => variations[variation.id]
      );

      setSelectedProducts((prev) =>
        prev.filter((p) => p.productId !== product.id || !p.variationId)
      );

      if (selectedVars.length > 0) {
        const newProducts = selectedVars.map((variation) => ({
          id: `${product.id}-${variation.id}`,
          productId: product.id,
          productName: product.productName,
          sku: product.sku,
          variationId: variation.id,
          variationValue: variation.variationValue,
          variationName: variation.variationValue,
          productVariationId: variation.id,
          defaultSellingPrice: variation.defaultSellingPrice || 0,
          quantity: 1,
        }));
        setSelectedProducts((prev) => [...prev, ...newProducts]);
      }
    } else {
      if (variations[product.id]) {
        if (
          !selectedProducts.some(
            (p) => p.productId === product.id && !p.variationId
          )
        ) {
          setSelectedProducts((prev) => [
            ...prev,
            {
              id: product.id,
              productId: product.id,
              productName: product.productName,
              sku: product.sku,
              quantity: 1,
              defaultSellingPrice: product.defaultSellingPrice || 0,
            },
          ]);
        }
      } else {
        setSelectedProducts((prev) =>
          prev.filter((p) => !(p.productId === product.id && !p.variationId))
        );
      }
    }
  };

  const handleVariationSelect = (product, variation, e) => {
    e.stopPropagation();
    const newSelectedVariations = {
      ...selectedVariations,
      [variation.id]: !selectedVariations[variation.id],
    };
    setSelectedVariations(newSelectedVariations);
    updateSelectedProducts(product, newSelectedVariations);
  };

  const handleQuantityChange = (id, value) => {
    setSelectedProducts((prev) =>
      prev.map((product) =>
        product.id === id
          ? { ...product, quantity: parseInt(value) || 0 }
          : product
      )
    );
  };

  const handleRemoveProduct = (id) => {
    setSelectedProducts((prev) => prev.filter((product) => product.id !== id));
  };

  // Calculate total units
  useEffect(() => {
    const units = selectedProducts.reduce(
      (sum, product) => sum + product.quantity,
      0
    );
    setTotalUnits(units);
  }, [selectedProducts]);

  // Calculate total amount
  useEffect(() => {
    const amount = selectedProducts.reduce(
      (sum, product) => sum + product.defaultSellingPrice * product.quantity,
      0
    );
    setTotalAmount(amount);
  }, [selectedProducts]);

  // Update total shipping amount
  useEffect(() => {
    const calculatedTotal = totalAmount + parseFloat(shippingCharges || 0);
    setTotalShippingAmount(calculatedTotal.toFixed(2));
  }, [totalAmount, shippingCharges]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (selectedProducts.length === 0) {
      setError("Please add at least one product");
      return;
    }

    if (!locationFrom || !locationTo) {
      setError("Please select both locations");
      return;
    }

    if (locationFrom === locationTo) {
      setError("From and To locations cannot be same");
      return;
    }

    const stockTransferData = {
      id: Number(id),
      status,
      locationFrom: Number(locationFrom),
      locationTo: Number(locationTo),

      // ✅ Backend expects "date"
      date: transferDate.toISOString().split("T")[0],

      referenceNumber,

      shippingCharges: Number(shippingCharges),
      totalAmount: Number(totalShippingAmount),

      // ✅ Backend expects "note"
      note: additionalNotes,

      stockTransferItems: selectedProducts.map((product) => ({
        id: product.itemId || null,
        productId: product.productId,
        productName: product.productName,
        productSku: product.sku,
        productVariationId: product.productVariationId,
        productVariationName: product.variationName,
        quantity: Number(product.quantity),
        unitPrice: Number(product.defaultSellingPrice),
        lineTotal:
          Number(product.defaultSellingPrice) * Number(product.quantity),
      })),
    };

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/stock-transfer/update/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(stockTransferData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update stock transfer");
      }

      alert("Stock transfer updated successfully");
      navigate(`/ListStockTransfer`);
    } catch (error) {
      setError(error.message);
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete this stock transfer? This action cannot be undone."
      )
    ) {
      try {
        setSaving(true);
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/stock-transfer/delete/${id}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to delete stock transfer: ${response.statusText}`
          );
        }

        alert("Stock transfer deleted successfully.");
        navigate("/ListStockTransfer");
      } catch (error) {
        setError(`Error deleting stock transfer: ${error.message}`);
        console.error("Error deleting stock transfer:", error);
      } finally {
        setSaving(false);
      }
    }
  };

  const statusTooltip = (
    <Tooltip id="status-tooltip">
      Stock transfer will not be editable if status is completed
    </Tooltip>
  );

  //   if (loading) {
  //     return (
  //       <div className="wrapper">
  //         <div className="content-wrapper">
  //           <section className="content">
  //             <div className="container-fluid">
  //               <div className="text-center py-5">
  //                 <div className="spinner-border text-primary" role="status">
  //                   <span className="sr-only">Loading...</span>
  //                 </div>
  //                 <p className="mt-2">Loading stock transfer data...</p>
  //               </div>
  //             </div>
  //           </section>
  //         </div>
  //       </div>
  //     );
  //   }

  //   if (fetchError) {
  //     return (
  //       <div className="wrapper">
  //         <div className="content-wrapper">
  //           <section className="content">
  //             <div className="container-fluid">
  //               <div className="alert alert-danger">
  //                 {fetchError}
  //                 <button
  //                   className="btn btn-link"
  //                   onClick={() => navigate("/ListStockTransfer")}
  //                 >
  //                   Go Back
  //                 </button>
  //               </div>
  //             </div>
  //           </section>
  //         </div>
  //       </div>
  //     );
  //   }

  return (
    <>
      <div className="wrapper">
        <div className="content-wrapper">
          <section className="content-header">
            <div className="container-fluid">
              <div className="row mb-2">
                <div className="col-md-6">
                  <h1 className="all-heading">View Stock Transfer</h1>
                </div>
                {/* <div className="col-md-6 text-right">
                  <Link
                    to={`/ViewStockTransfer/${id}`}
                    className="btn btn-secondary mr-2"
                  >
                    <i className="fa fa-eye"></i> View
                  </Link>
                  <Link to="/ListStockTransfer" className="btn btn-secondary">
                    <i className="fa fa-arrow-left"></i> Back to List
                  </Link>
                </div> */}
              </div>
            </div>
          </section>

          <section className="content">
            <div className="container-fluid">
              <form onSubmit={handleSubmit}>
                <div className="card card-default rounded-4 border-0 cardHover">
                  <div className="card-body">
                    <div className="row">
                      {/* Date */}
                      <div className="col-md-4">
                        <div className="form-group d-flex flex-row flex-md-column">
                          <label htmlFor="transfer_date">Transfer Date:*</label>
                          <DatePicker
                            selected={transferDate}
                            onChange={(date) => setTransferDate(date)}
                            disabled
                            dateFormat="MM/dd/yyyy"
                            className="form-control w-100 ms-1 ms-md-0 py-3 rounded-1"
                          />
                        </div>
                      </div>

                      {/* Reference No */}
                      <div className="form-group col-md-4">
                        <label htmlFor="referenceNumber">Reference No:</label>
                        <input
                          type="text"
                          className="form-control"
                          id="referenceNumber"
                          name="referenceNumber"
                          value={referenceNumber}
                          disabled
                          onChange={(e) => setReferenceNumber(e.target.value)}
                        />
                      </div>

                      {/* Status */}
                      <div className="form-group col-md-4">
                        <label htmlFor="status">
                          Status:*
                          <span>
                            <OverlayTrigger
                              placement="bottom"
                              overlay={statusTooltip}
                            >
                              <i className="fa fa-info-circle text-info mr-2" />
                            </OverlayTrigger>
                          </span>
                        </label>
                        <select
                          id="status"
                          name="status"
                          className="form-control"
                          required
                          value={status}
                          disabled
                          onChange={(e) => setStatus(e.target.value)}
                          // disabled={status === "completed"}
                        >
                          <option value="" disabled>
                            Please Select
                          </option>
                          <option value="pending">Pending</option>
                          <option value="in_transit">In Transit</option>
                          <option value="completed">Completed</option>
                        </select>
                        {status === "completed" && (
                          <small className="text-muted">
                            Completed transfers cannot be edited
                          </small>
                        )}
                      </div>

                      {/* Location (From) */}
                      <div className="form-group col-md-6">
                        <label htmlFor="location_id">Location (From):*</label>
                        <select
                          id="location_id"
                          className="form-control"
                          required
                          value={locationFrom}
                          disabled
                          onChange={handleLocationFromChange}
                        >
                          <option value="" disabled>
                            Please Select
                          </option>

                          {locations.map((loc) => (
                            <option key={loc.id} value={loc.id}>
                              {loc.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Location (To) */}
                      <div className="form-group col-md-6">
                        <label htmlFor="transfer_location_id">
                          Location (To):*
                        </label>
                        <select
                          id="transfer_location_id"
                          className="form-control"
                          required
                          value={locationTo}
                          onChange={handleLocationToChange}
                          disabled
                          // disabled={!locationFrom} // optional UX improvement
                        >
                          <option value="" disabled>
                            Please Select
                          </option>

                          {locations
                            .filter((loc) => loc.id.toString() !== locationFrom)
                            .map((loc) => (
                              <option key={loc.id} value={loc.id}>
                                {loc.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product Search Section */}
                <div className="card card-default rounded-4 border-0 cardHover">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-12">
                        {/* <div className="form-group">
                          <label>Search Products</label>
                          <div className="search-container">
                            <input
                              type="text"
                              className="form-control search-input w-100"
                              placeholder="Search by name, SKU or scan barcode"
                              value={searchTerm}
                              onChange={handleSearch}
                              onKeyDown={handleKeyPress}
                              autoComplete="off"
                              disabled={status === "completed"}
                            />
                            {searchTerm && (
                              <button
                                type="button"
                                className="clear-search"
                                onClick={() => {
                                  setSearchTerm("");
                                  setSearchResults([]);
                                }}
                              >
                                <i className="fa fa-times"></i>
                              </button>
                            )}
                          </div>
                        </div> */}

                        <div className="product-list">
                          {searchTerm && searchResults.length > 0 && (
                            <div
                              className="search-results"
                              ref={searchResultsRef}
                            >
                              {searchResults.map((product, index) => (
                                <div
                                  key={product.id}
                                  className={`product-row ${
                                    focusedIndex === index ? "focused" : ""
                                  } ${
                                    (
                                      product.productVariations &&
                                      product.productVariations.length > 0
                                        ? product.productVariations.some(
                                            (v) => selectedVariations[v.id]
                                          )
                                        : selectedVariations[product.id]
                                    )
                                      ? "selected"
                                      : ""
                                  }`}
                                  onClick={() =>
                                    !status === "completed" &&
                                    handleProductSelect(product)
                                  }
                                  style={{
                                    cursor:
                                      status === "completed"
                                        ? "not-allowed"
                                        : "pointer",
                                  }}
                                >
                                  <div className="product-content flex justify-between items-start gap-4">
                                    <div className="row d-flex justify-content-between">
                                      {/* Product Info */}
                                      <div className="col-8 product-info">
                                        <div className="product-main-info">
                                          <span className="product-name">
                                            {product.productName}
                                          </span>
                                          <span className="product-sku">
                                            {product.sku}
                                          </span>
                                          <span
                                            className={`stock ${
                                              product.stock > 0
                                                ? "in-stock"
                                                : "out-of-stock"
                                            }`}
                                          >
                                            {product.stock > 0
                                              ? `Stock: ${product.stock}`
                                              : "Out of stock"}
                                          </span>
                                          <span className="product-type">
                                            {product.productType}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Product Variations (only if VARIABLE) */}
                                      {product.productType === "VARIABLE" &&
                                        product.productVariations && (
                                          <div className="col-4 product-variations flex flex-wrap gap-2">
                                            {product.productVariations.map(
                                              (variation) => (
                                                <div
                                                  key={variation.id}
                                                  className={`variation-item py-0 border rounded px-2 ${
                                                    selectedVariations[
                                                      variation.id
                                                    ]
                                                      ? "selected"
                                                      : ""
                                                  }`}
                                                  onClick={(e) => {
                                                    if (
                                                      status !== "completed"
                                                    ) {
                                                      e.stopPropagation();
                                                      handleVariationSelect(
                                                        product,
                                                        variation,
                                                        e
                                                      );
                                                    }
                                                  }}
                                                  style={{
                                                    cursor:
                                                      status === "completed"
                                                        ? "not-allowed"
                                                        : "pointer",
                                                  }}
                                                >
                                                  <span>
                                                    {variation.variationValue}
                                                  </span>
                                                </div>
                                              )
                                            )}
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {selectedProducts.length > 0 && (
                          <div className="table-responsive mt-4">
                            <table className="table table-bordered">
                              <thead>
                                <tr>
                                  <th>#</th>
                                  <th>Product Name</th>
                                  <th>SKU</th>
                                  <th>Quantity</th>
                                  <th>Unit Price</th>
                                  <th>Line Total</th>
                                  <th>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedProducts.map((product, index) => {
                                  const lineTotal =
                                    product.defaultSellingPrice *
                                    product.quantity;

                                  return (
                                    <tr key={product.id}>
                                      <td>{index + 1}</td>
                                      <td>
                                        {product.productName}
                                        {product.variationValue && (
                                          <span className="text-muted">
                                            {" "}
                                            ({product.variationValue})
                                          </span>
                                        )}
                                      </td>
                                      <td>{product.sku}</td>
                                      <td>
                                        <input
                                          type="number"
                                          className="form-control form-control-sm"
                                          style={{ width: "80px" }}
                                          value={product.quantity}
                                          min="1"
                                          disabled
                                          onChange={(e) =>
                                            handleQuantityChange(
                                              product.id,
                                              e.target.value
                                            )
                                          }
                                          // disabled={status === "completed"}
                                        />
                                      </td>
                                      <td>
                                        $
                                        {product.defaultSellingPrice.toFixed(2)}
                                      </td>
                                      <td>${lineTotal.toFixed(2)}</td>
                                      <td>
                                        <button
                                          type="button"
                                          className="btn btn-danger btn-sm"
                                          onClick={() =>
                                            handleRemoveProduct(product.id)
                                          }
                                          disabled
                                          // disabled={status === "completed"}
                                        >
                                          <i className="fa fa-trash"></i>
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                              <tfoot>
                                <tr>
                                  <td colSpan="3" className="text-right">
                                    <strong>Total:</strong>
                                  </td>
                                  <td>
                                    <strong>{totalUnits} units</strong>
                                  </td>
                                  <td></td>
                                  <td>
                                    <strong>${totalAmount.toFixed(2)}</strong>
                                  </td>
                                  <td></td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card card-default rounded-4 border-0 cardHover">
                  <div className="card-body">
                    <div className="row">
                      {/* Shipping Charges */}
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="shipping_charges">
                            Shipping Charges:
                          </label>
                          <input
                            className="form-control input_number"
                            placeholder="Shipping Charges"
                            name="shipping_charges"
                            type="number"
                            value={shippingCharges}
                            onChange={(e) => setShippingCharges(e.target.value)}
                            id="shipping_charges"
                            disabled
                          />
                        </div>
                      </div>

                      {/* Additional Notes */}
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="additional_notes">
                            Additional Notes:
                          </label>
                          <textarea
                            className="form-control"
                            rows={2}
                            name="additional_notes"
                            id="additional_notes"
                            value={additionalNotes}
                            onChange={(e) => setAdditionalNotes(e.target.value)}
                            disabled
                          />
                        </div>
                      </div>

                      {/* Total Amount */}
                      <div className="col-md-4 pt-md-5 text-right">
                        <b>Total Amount:</b>{" "}
                        <span id="final_total_text">
                          ${totalShippingAmount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                <div className="container-fluid text-center mt-3">
                  {/* <button
                    type="submit"
                    className="btn btn-primary btn-lg px-4 py-2 m-2"
                    disabled
                  >
                    {saving ? "Updating..." : "Update Transfer"}
                  </button> */}

                  {status !== "completed" && (
                    <>
                      <button
                        type="button"
                        className="btn btn-secondary btn-lg px-4 py-2 m-2"
                        onClick={() => navigate(`/ListStockTransfer`)}
                      >
                        Back
                      </button>

                      {/* <button
                        type="button"
                        className="btn btn-danger btn-lg px-4 py-2 m-2"
                        onClick={handleDelete}
                        disabled
                      >
                        {saving ? "Deleting..." : "Delete Transfer"}
                      </button> */}
                    </>
                  )}

                  {/* {status === "completed" && (
                    <div className="alert alert-warning mt-3">
                      This transfer is marked as completed and cannot be edited.
                    </div>
                  )} */}
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

export default ViewStockTransfer;
