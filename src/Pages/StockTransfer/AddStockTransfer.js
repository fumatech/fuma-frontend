import React, { useEffect, useState, useRef } from "react";
import BackButton from "../../components/BackButton";
import { useNavigate } from "react-router-dom";
import { Tooltip, OverlayTrigger } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import useBarcodeScanner from "../../hooks/useBarcodeScanner";
import playProductAddedBeep from "../../utils/playProductAddedBeep";

function AddStockTransfer() {
  const searchResultsRef = useRef(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const navigate = useNavigate();

  const [status, setStatus] = useState("");
  const [transferType, setTransferType] = useState("shop");
  const [locations, setLocations] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [locationFrom, setLocationFrom] = useState("");
  const [locationTo, setLocationTo] = useState("");
  const [targetWarehouseId, setTargetWarehouseId] = useState("");
  const [transferDate, setTransferDate] = useState(new Date());
  const [referenceNumber, setReferenceNumber] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedVariations, setSelectedVariations] = useState({});

  const [totalAmount, setTotalAmount] = useState(0);
  const [totalUnits, setTotalUnits] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [shippingCharges, setShippingCharges] = useState(0);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [totalShippingAmount, setTotalShippingAmount] = useState(0);
  const inFlightBarcodeRequests = useRef(new Set());
  useEffect(() => {
    fetch(`${process.env.REACT_APP_BASE_URL}/business-locations/getall`)
      .then((res) => res.json())
      .then((data) => setLocations(data))
      .catch((err) => console.error("Error fetching locations:", err));
  }, []);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_BASE_URL}/warehouse/getall`)
      .then((res) => res.json())
      .then((data) => setWarehouses(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("Error fetching warehouses:", err);
        setWarehouses([]);
      });
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
          defaultPurchasePriceExcTax: variation.defaultPurchasePriceExcTax,
          defaultSellingPrice: variation.defaultSellingPrice || 0,
          quantity: 1,
          profitMargin: variation.profitMargin || 0,
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
              defaultPurchasePriceExcTax:
                product.defaultPurchasePriceExcTax || 0,
              defaultSellingPrice: product.defaultSellingPrice || 0,
              profitMargin: product.profitMargin || 0,
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

  const addOrIncrementScannedProduct = (product, scannedBarcode) => {
    setSelectedProducts((prev) => {
      let matchedVariation = null;
      if (product.productVariations && product.productVariations.length > 0) {
        if (scannedBarcode) {
          matchedVariation = product.productVariations.find(
            (v) =>
              (v.subSku && v.subSku.toLowerCase() === scannedBarcode.toLowerCase()) ||
              (product.barcode && product.barcode.toLowerCase() === scannedBarcode.toLowerCase())
          );
        }
        if (!matchedVariation) {
          matchedVariation = product.productVariations[0];
        }
      }

      // Find matching item (variation or product)
      const existingIndex = prev.findIndex(
        (p) =>
          (p.productId === product.id || p.id === product.id) &&
          (!matchedVariation || p.productVariationId === matchedVariation.id || p.variationId === matchedVariation.id)
      );

      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: (next[existingIndex].quantity || 0) + 1,
        };
        return next;
      }

      // Handle variable products
      if (matchedVariation) {
        const variation = matchedVariation;
        return [
          ...prev,
          {
            id: `${product.id}-${variation.id}`,
            productId: product.id,
            productName: product.productName,
            sku: product.sku || variation.subSku || "",
            variationId: variation.id,
            variationValue: variation.variationValue,
            variationName: variation.variationValue,
            productVariationId: variation.id,
            defaultPurchasePriceExcTax: variation.defaultPurchasePriceExcTax || 0,
            defaultSellingPrice: variation.defaultSellingPrice || product.price || 0,
            quantity: 1,
            profitMargin: variation.profitMargin || 0,
          },
        ];
      }

      // Handle single products
      return [
        ...prev,
        {
          id: product.id,
          productId: product.id,
          productName: product.productName,
          sku: product.sku || "",
          quantity: 1,
          defaultPurchasePriceExcTax: product.defaultPurchasePriceExcTax || 0,
          defaultSellingPrice: product.defaultSellingPrice || product.price || 0,
          profitMargin: product.profitMargin || 0,
        },
      ];
    });
  };

  const handleBarcodeScan = async (barcode) => {
    if (inFlightBarcodeRequests.current.has(barcode)) {
      return;
    }

    inFlightBarcodeRequests.current.add(barcode);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/api/products/barcode/${encodeURIComponent(
          barcode
        )}`
      );

      if (!response.ok) {
        toast.warning("Product not found");
        return;
      }

      const product = await response.json();
      addOrIncrementScannedProduct(product, barcode);
      playProductAddedBeep();
      toast.success(`Scanned: ${product.productName || barcode}`);
    } catch (error) {
      console.error("Error scanning barcode:", error);
      toast.error("Unable to scan product right now");
    } finally {
      inFlightBarcodeRequests.current.delete(barcode);
    }
  };

  useBarcodeScanner(handleBarcodeScan, {
    allowManualInputEnter: false, 
  });

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
    setError("");

    if (!locationFrom) {
      setError("Please select location (From)");
      return;
    }

    if (transferType === "shop" && !locationTo) {
      setError("Please select location (To)");
      return;
    }

    if (transferType === "shop" && String(locationFrom) === String(locationTo)) {
      setError("From and To locations cannot be the same");
      return;
    }

    if (transferType === "warehouse" && !targetWarehouseId) {
      setError("Please select target warehouse");
      return;
    }

    if (selectedProducts.length === 0) {
      setError("Please add at least one product");
      return;
    }

    const stockTransferData = {
      status,
      transferType: transferType === "warehouse" ? "to_warehouse" : "to_shop",
      locationFrom,
      locationTo: transferType === "shop" ? locationTo : null,
      targetWarehouseId:
        transferType === "warehouse" ? Number(targetWarehouseId) : null,
      date: transferDate,
      referenceNumber,
      totalAmount: Number(totalShippingAmount),
      shippingCharges: Number(shippingCharges),
      note: additionalNotes,

      stockTransferItems: selectedProducts.map((product) => ({
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
      setLoading(true);

      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/stock-transfer/save`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(stockTransferData),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to save stock transfer`);
      }

      toast.success("Stock transfer saved successfully.");
      navigate("/ListStockTransfer");
    } catch (error) {
      // console.error("Error saving stock transfer:", error);
      toast.error("Error saving stock transfer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const statusTooltip = (
    <Tooltip id="status-tooltip">
      Stock transfer will not be editable if status is completed
    </Tooltip>
  );

  return (
    <>
      <div className="wrapper">
        <div className="content-wrapper">
          <section className="content-header">
            <div className="container-fluid">
              <div className="row mb-2">
                <div className="col-md-6 d-flex align-items-center flex-wrap gap-2">
                  <BackButton />
                  <h1 className="all-heading mb-0">Add Stock Transfer</h1>
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
                      {/* Date */}
                      <div className="col-md-4">
                        <div className="form-group d-flex flex-row flex-md-column">
                          <label htmlFor="transfer_date">Transfer Date:*</label>
                          <DatePicker
                            selected={transferDate}
                            onChange={(date) => setTransferDate(date)}
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
                          onChange={(e) => setStatus(e.target.value)}
                        >
                          <option value="" disabled>
                            Please Select
                          </option>
                          <option value="pending">Pending</option>
                          <option value="in_transit">In Transit</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>

                      {/* Transfer Type */}
                      <div className="form-group col-md-4">
                        <label htmlFor="transfer_type">Transfer Type:*</label>
                        <select
                          id="transfer_type"
                          name="transfer_type"
                          className="form-control"
                          required
                          value={transferType}
                          onChange={(e) => {
                            const nextType = e.target.value;
                            setTransferType(nextType);
                            if (nextType === "shop") {
                              setTargetWarehouseId("");
                            } else {
                              setLocationTo("");
                            }
                          }}
                        >
                          <option value="shop">To Shop</option>
                          <option value="warehouse">To Warehouse</option>
                        </select>
                      </div>

                      {/* Location (From) */}
                      <div className="form-group col-md-4">
                        <label htmlFor="location_id">Location (From):*</label>
                        <select
                          id="location_id"
                          className="form-control"
                          required
                          value={locationFrom}
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

                      {transferType === "shop" ? (
                        <div className="form-group col-md-4">
                          <label htmlFor="transfer_location_id">
                            Location (To):*
                          </label>
                          <select
                            id="transfer_location_id"
                            className="form-control"
                            required={transferType === "shop"}
                            value={locationTo}
                            onChange={handleLocationToChange}
                            disabled={!locationFrom}
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
                      ) : (
                        <div className="form-group col-md-4">
                          <label htmlFor="target_warehouse_id">
                            Target Warehouse:*
                          </label>
                          <select
                            id="target_warehouse_id"
                            className="form-control"
                            required={transferType === "warehouse"}
                            value={targetWarehouseId}
                            onChange={(e) => setTargetWarehouseId(e.target.value)}
                          >
                            <option value="" disabled>
                              Please Select
                            </option>
                            {warehouses.map((warehouse) => (
                              <option key={warehouse.id} value={warehouse.id}>
                                {warehouse.name}
                              </option>
                            ))}
                          </select>
                          <small className="text-muted d-block mt-1">
                            Warehouse allocation is logical mapping only; main stock remains unchanged.
                          </small>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Product Search Section */}
                <div className="card card-default rounded-4 border-0 cardHover">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-12">
                        <div className="form-group">
                          <label>Search Products</label>
                          <small className="d-block text-muted mb-2">
                            Scanner active: scan barcode and press Enter from anywhere on this page.
                          </small>
                          <div className="search-container">
                            <input
                              type="text"
                              className="form-control search-input w-100"
                              placeholder="Search by name, SKU or scan barcode"
                              value={searchTerm}
                              onChange={handleSearch}
                              onKeyDown={handleKeyPress}
                              autoComplete="off"
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
                        </div>

                        <div className="product-list">
                          {searchTerm && searchResults.length > 0 && (
                            <div
                              className="search-results"
                              ref={searchResultsRef}
                            >
                              {searchResults.map((product, index) => (
                                <div
                                  key={product.id}
                                  className={`product-row ${focusedIndex === index ? "focused" : ""
                                    } ${(
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
                                  onClick={() => handleProductSelect(product)}
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
                                            className={`stock ${product.stock > 0
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
                                                  className={`variation-item py-0 border rounded px-2 ${selectedVariations[
                                                    variation.id
                                                  ]
                                                    ? "selected"
                                                    : ""
                                                    }`}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleVariationSelect(
                                                      product,
                                                      variation,
                                                      e
                                                    );
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
                                          onChange={(e) =>
                                            handleQuantityChange(
                                              product.id,
                                              e.target.value
                                            )
                                          }
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
                  <button
                    type="submit"
                    className="btn btn-save btn-lg px-4 py-2 m-2"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save"}
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

export default AddStockTransfer;
