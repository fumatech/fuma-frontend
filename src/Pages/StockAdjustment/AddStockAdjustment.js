import React, { useEffect, useState, useRef } from "react";
import BackButton from "../../components/BackButton";
import { useNavigate, Link, useParams } from "react-router-dom";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Tooltip, OverlayTrigger } from "react-bootstrap";
import { toast } from "react-toastify";
import Select from "react-select";

import useBarcodeScanner from "../../hooks/useBarcodeScanner";
import playProductAddedBeep from "../../utils/playProductAddedBeep";

function AddStockAdjustment() {
  const inFlightBarcodeRequests = useRef(new Set());

  const { id } = useParams();
  const searchResultsRef = useRef(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const navigate = useNavigate();
  const [adjustmentDate, setAdjustmentDate] = useState(new Date());
  const [adjustmentType, setAdjustmentType] = useState("");
  const [businessLocation, setBusinessLocation] = useState("");
  const [businessLocations, setBusinessLocations] = useState([]);
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
  const [totalUnits, setTotalUnits] = useState(0); // New state for total units

  const businessLocationOptions = businessLocations.map((location) => ({
    value: location.name,
    label: location.name,
  }));
  const adjustmentTypeOptions = [
    { value: "normal", label: "Normal" },
    { value: "abnormal", label: "Abnormal" },
  ];
  const selectMenuProps = {
    menuPortalTarget: document.body,
    menuPosition: "fixed",
    styles: {
      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
      menu: (base) => ({ ...base, zIndex: 9999 }),
    },
  };
  useEffect(() => {
    const fetchBusinessLocations = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_BASE_URL}/business-locations/getall`
        );

        // Optional: filter only active locations
        const activeLocations = res.data.filter((loc) => loc.isActive === 1);

        setBusinessLocations(activeLocations);
      } catch (error) {
        console.error("Error fetching business locations", error);
      }
    };

    fetchBusinessLocations();
  }, []);
  useEffect(() => {
    // Fetch stock adjustment data when component mounts
    const fetchStockAdjustmentData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${process.env.REACT_APP_BASE_URL}/warranty-claim/get/${id}`
        );
        const data = response.data;

        setAdjustmentDate(data.date);
        // setBusinessLocation(data.businessLocation);
        setAdjustmentType(
          data.adjustmentType ? String(data.adjustmentType).toLowerCase() : ""
        );
        setTotalAmount(data.totalAmount);
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
    if (product.productVariations.length > 0) {
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
          (!matchedVariation || p.productVariationId === matchedVariation.id || p.id === matchedVariation.id)
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
            id: variation.id, // In stock adjustment, we often use variation ID as main ID
            productId: product.id,
            productName: product.productName,
            sku: product.sku || variation.subSku || "",
            quantity: 1,
            defaultSellingPrice: variation.defaultSellingPrice || product.price || 0,
            productVariationId: variation.id,
            variationName: variation.variationValue,
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
          defaultSellingPrice: product.price || 0,
          productVariationId: null,
          variationName: null,
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

  const updateSelectedProducts = (product, variations) => {

    if (product.productVariations.length > 0) {
      const selectedVars = product.productVariations.filter(
        (variation) => variations[variation.id]
      );

      setSelectedProducts((prev) =>
        prev.filter((p) => p.id !== product.id || !p.variationId)
      );

      if (selectedVars.length > 0) {
        const newProducts = selectedVars.map((variation) => ({
          id: product.id,
          productId: product.id,
          productName: product.productName,
          sku: product.sku,
          variationId: variation.id,
          variationValue: variation.variationValue,
          variationName: variation.variationValue,
          productVariationId: variation.id,
          defaultPurchasePriceExcTax: variation.defaultPurchasePriceExcTax,
          defaultSellingPrice: variation.defaultSellingPrice || 0, // Add this line
          quantity: 1,
          discountPercent: 0,
          profitMargin: variation.profitMargin || 0,
        }));
        setSelectedProducts((prev) => [...prev, ...newProducts]);
      }
    } else {
      if (variations[product.id]) {
        if (
          !selectedProducts.some((p) => p.id === product.id && !p.variationId)
        ) {
          setSelectedProducts((prev) => [
            ...prev,
            {
              id: product.id,
              productId: product.id,
              productName: product.productName,
              sku: product.sku,
              quantity: 1,
              discountPercent: 0,
              defaultPurchasePriceExcTax:
                product.defaultPurchasePriceExcTax || 0,
              defaultSellingPrice: product.defaultSellingPrice || 0, // Add this line
              profitMargin: product.profitMargin || 0,
            },
          ]);
        }
      } else {
        setSelectedProducts((prev) =>
          prev.filter((p) => !(p.id === product.id && !p.variationId))
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!businessLocation) {
      toast.warning("Business Location is required.");
      return;
    }
    if (!adjustmentType) {
      toast.warning("Adjustment Type is required.");
      return;
    }

    // Prepare stock adjustment data
    const stockAdjustmentData = {
      businessLocation,
      referenceNumber,
      date: adjustmentDate || adjustmentDate.toISOString(),
      adjustmentType,
      totalAmount,
      totalUnits,
      amountRecovered,
      reason,
      stockAdjustmentItems: selectedProducts.map((product) => ({
        productId: product.productId,
        productName: product.productName,
        productSku: product.productSku,
        productVariationId: product.productVariationId,
        productVariationName: product.variationName,
        quantity: product.quantity,
        lineTotal: product.unitSellingPrice * product.quantity,
        unitSellingPrice: product.defaultSellingPrice,
      })),
      stockTransaction: selectedProducts.map((product) => ({
        productId: product.productId,
        variationId: product.productVariationId,
        quantity: product.quantity,
        transactionType: "adjustment",
        date: adjustmentDate || adjustmentDate.toISOString(),
        note: "Stock added to warehouse as adjustment",
      })),
    };

    try {
      // Save stock adjustment
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/stock-adjustments/save`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(stockAdjustmentData),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to save stock adjustment: ${response.statusText}`
        );
      }

      // Update status if ID is provided
      if (id && id !== 0) {
        const status = 4;
        const updateResponse = await fetch(
          `${process.env.REACT_APP_BASE_URL}/warranty-claim/updateStatus/${id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(status), // `status` should be a plain number, e.g., 4
          }
        );

        if (!updateResponse.ok) {
          throw new Error(
            `Failed to update warranty claim status: ${updateResponse.statusText}`
          );
        }
      }

      // Success message and navigation
      toast.success("Stock adjustment saved successfully.");
      navigate("/ListStockAdjustment");
    } catch (error) {
      // Handle errors
      toast.error("Error saving stock adjustment. Please try again.");
      console.error("Error saving stock adjustment:", error);
    } finally {
      // Hide loading indicator
      setLoading(false);
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
                  <h1 className=" all-heading mb-0">Add Stock Adjustment</h1>
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
                        <Select
                          inputId="businessLocation"
                          options={businessLocationOptions}
                          value={
                            businessLocationOptions.find(
                              (option) =>
                                String(option.value) ===
                                String(businessLocation)
                            ) || null
                          }
                          onChange={(selectedOption) =>
                            setBusinessLocation(selectedOption?.value || "")
                          }
                          placeholder="Please Select"
                          isSearchable
                          {...selectMenuProps}
                        />
                      </div>{" "}
                      <div className="form-group col-md-3">
                        <label htmlFor="referenceNumber">Reference No:</label>
                        <input
                          type="text"
                          className="form-control"
                          id="referenceNumber"
                          name="referenceNumber"
                          required
                          onChange={handleReferenceNumberChange}
                        />
                      </div>
                      <div className="col-md-3">
                        <div className="form-group d-flex flex-row flex-md-column">
                          <label htmlFor="transaction_date">Date:*</label>
                          <DatePicker
                            selected={adjustmentDate}
                            onChange={(date) => setAdjustmentDate(date)}
                            dateFormat="MM/dd/yyyy"
                            className="form-control w-100 ms-1 ms-md-0 py-3 rounded-1"
                          />
                        </div>
                      </div>
                      <div className="form-group col-md-3">
                        <label htmlFor="AdjustmentType">
                          Adjustment Type:*
                          <span>
                            <OverlayTrigger
                              placement="bottom"
                              overlay={
                                <Tooltip id="adjustment-type-tooltip">
                                  <i>Normal</i>: Adjustment for normal reasons
                                  like Leakage, Damage etc. <br />
                                  <br /> <i>Abnormal</i>: Adjustment for reasons
                                  like Fire, Accident etc.
                                </Tooltip>
                              }
                            >
                              <i className="fa fa-info-circle text-info mr-2" />
                            </OverlayTrigger>
                          </span>
                        </label>
                        <Select
                          inputId="AdjustmentType"
                          options={adjustmentTypeOptions}
                          value={
                            adjustmentTypeOptions.find(
                              (option) =>
                                String(option.value).toLowerCase() ===
                                String(adjustmentType).toLowerCase()
                            ) || null
                          }
                          onChange={(selectedOption) =>
                            setAdjustmentType(selectedOption?.value || "")
                          }
                          placeholder="Please Select"
                          isSearchable
                          {...selectMenuProps}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card card-default rounded-4 border-0 cardHover">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-12">
                        <div className="form-group">
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
                                      {product.productType === "VARIABLE" && (
                                        <div className=" col-4 product-variations flex flex-wrap gap-2">
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
                                                  e.stopPropagation(); // Prevents parent onClick
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
                          <div className="table-responsive">
                            <table className="table">
                              <thead>
                                <tr>
                                  <th>#</th>
                                  <th>Product Name</th>
                                  <th>Quantity</th>
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
                                          onChange={(e) =>
                                            handleQuantityChange(
                                              product.id,
                                              e.target.value
                                            )
                                          }
                                        />
                                      </td>
                                      <td>{defaultSellingPrice.toFixed(2)}</td>

                                      <td>{lineTotal.toFixed(2)}</td>

                                      <td>
                                        <button
                                          type="button"
                                          className="btn btn-danger"
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
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="amount_recovered">
                            Amount Recovered:
                          </label>
                          <input
                            className="form-control input_number"
                            placeholder="amount_recovered"
                            name="amount_recovered"
                            type="number"
                            id="amount_recovered"
                            onChange={handleAmountRecovered}
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="reason">Reason:</label>
                          <textarea
                            className="form-control"
                            rows={2}
                            name="reason"
                            id="reason"
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

export default AddStockAdjustment;
