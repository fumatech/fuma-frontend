import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./PurchaseOrder.css";
import { toast } from "react-toastify";

function PurchaseOrder() {
  const [currentStocks, setCurrentStocks] = useState({});
  const navigate = useNavigate();
  const searchResultsRef = useRef(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [vendor, setVendor] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [orderDate, setOrderDate] = useState(new Date());
  const [deliveryDate, setDeliveryDate] = useState(new Date());
  const [location, setLocation] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVariations, setSelectedVariations] = useState({});
  const [vendorlist, setVendorList] = useState([]);
  const [totalUnits, setTotalUnits] = useState(0);
  const [userName, setUserName] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [vendorSearchTerm, setVendorSearchTerm] = useState(""); // for vendor search
  useEffect(() => {
    const fetchCurrentStocks = async () => {
      const stockData = {};

      for (const product of selectedProducts) {
        try {
          let response;
          if (product.variationId) {
            // Fetch stock for variation
            response = await fetch(
              `${process.env.REACT_APP_BASE_URL}/stock-transactions/current-stock-byvariation/${product.variationId}`
            );
          } else {
            // Fetch stock for base product
            response = await fetch(
              `${process.env.REACT_APP_BASE_URL}/stock-transactions/current-stock/${product.id}`
            );
          }

          const stock = await response.json();
          stockData[product.variationId || product.id] = stock;
        } catch (error) {
          console.error("Error fetching stock:", error);
          stockData[product.variationId || product.id] = 0;
        }
      }

      setCurrentStocks(stockData);
    };

    if (selectedProducts.length > 0) {
      fetchCurrentStocks();
    } else {
      setCurrentStocks({});
    }
  }, [selectedProducts]);
  useEffect(() => {
    const email = sessionStorage.getItem("userEmail");
    if (email) {
      fetch(`${process.env.REACT_APP_BASE_URL}/user/username?email=${email}`)
        .then((response) => response.json())
        .then((data) => setUserName(data))
        .catch((error) => console.error("Error fetching username:", error));
    }
  }, []);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/vendor/getallactive`
        );
        const data = await response.json();
        setVendorList(data);
      } catch (error) {
        console.error("Error fetching vendors:", error);
      }
    };
    fetchVendors();
  }, []);

  useEffect(() => {
    const calculatedTotalUnits = selectedProducts.reduce((total, product) => {
      return total + product.quantity;
    }, 0);
    setTotalUnits(calculatedTotalUnits);
  }, [selectedProducts]);

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
        `${
          process.env.REACT_APP_BASE_URL
        }/product/search/active?query=${encodeURIComponent(query)}`
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
    if (product.productVariations.length > 0) {
      // For variable products, toggle selection of all variations
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
      // For single products
      const isSelected = selectedVariations[product.id];
      const newSelectedVariations = {
        ...selectedVariations,
        [product.id]: !isSelected,
      };
      setSelectedVariations(newSelectedVariations);
      updateSelectedProducts(product, newSelectedVariations);
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

  const updateSelectedProducts = (product, variations) => {
    if (product.productVariations.length > 0) {
      // For variable products
      const selectedVars = product.productVariations.filter(
        (variation) => variations[variation.id]
      );

      // Remove all variations of this product first
      setSelectedProducts((prev) =>
        prev.filter((p) => p.id !== product.id || !p.variationId)
      );

      // Add selected variations
      if (selectedVars.length > 0) {
        const newProducts = selectedVars.map((variation) => ({
          id: product.id,
          productName: product.productName,
          sku: product.sku,
          variationId: variation.id,
          variationValue: variation.variationValue,
          quantity: 1,
        }));
        setSelectedProducts((prev) => [...prev, ...newProducts]);
      }
    } else {
      // For single products
      if (variations[product.id]) {
        // Add product if selected
        if (
          !selectedProducts.some((p) => p.id === product.id && !p.variationId)
        ) {
          setSelectedProducts((prev) => [
            ...prev,
            {
              id: product.id,
              productName: product.productName,
              sku: product.sku,
              quantity: 1,
            },
          ]);
        }
      } else {
        // Remove product if deselected
        setSelectedProducts((prev) =>
          prev.filter((p) => !(p.id === product.id && !p.variationId))
        );
      }
    }
  };

  const handleRemoveProduct = (productId, variationId) => {
    setSelectedProducts((prev) =>
      prev.filter(
        (product) =>
          !(product.id === productId && product.variationId === variationId)
      )
    );
    // Also update selectedVariations
    if (variationId) {
      setSelectedVariations((prev) => ({ ...prev, [variationId]: false }));
    } else {
      setSelectedVariations((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleQuantityChange = (productId, variationId, value) => {
    setSelectedProducts((prev) =>
      prev.map((product) =>
        product.id === productId && product.variationId === variationId
          ? { ...product, quantity: Math.max(1, parseInt(value) || 1) }
          : product
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formattedOrderDate = orderDate.toISOString().split("T")[0];
    const formattedDeliveryDate = deliveryDate.toISOString().split("T")[0];

    const orderItems = selectedProducts.map((product) => ({
      productId: product.id,
      productName: product.productName,
      productSku: product.sku,
      productVariationId: product.variationId,
      productVariationName: product.variationValue,
      quantity: product.quantity,
    }));

    const payload = {
      vendor,
      status: 0,
      referenceNumber,
      addedBy: userName,
      orderDate: formattedOrderDate,
      deliveryDate: formattedDeliveryDate,
      location,
      totalItems: totalUnits,
      additionalNotes,
      orderItems,
    };

    try {
      const formData = new FormData();

      // 🔹 JSON as string (required by backend)
      formData.append("purchaseOrder", JSON.stringify(payload));

      const file = "";
      if (file && file instanceof File) {
        formData.append("file", file);
      }

      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/purchaseorder/save`,
        {
          method: "POST",
          body: formData, // ❗ no headers
        }
      );

      if (response.ok) {
        toast.success("Purchase Order created successfully");
        navigate("/ListPurchaseOrder");
      } else {
        // const err = await response.text();
        // console.error(err);
        toast.error("Failed to save Purchase Order");
      }
    } catch (error) {
      // console.error("Error:", error);
      toast.error("Something went wrong");
    }
  };

  // Filter the vendor list based on search
  const filteredVendors = vendorlist.filter((v) =>
    `${v.firmName} ${v.mobileNumber} ${v.city}`
      .toLowerCase()
      .includes(vendorSearchTerm.toLowerCase())
  );

  const handleSelect = (v) => {
    setVendor(v.firmName);
    setVendorSearchTerm(`${v.firmName} - ${v.mobileNumber} - ${v.city}`);
    setShowDropdown(false);
  };

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6">
                <h1 className="all-heading">Purchase Order</h1>
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
                      <div className="form-group position-relative">
                        <label>
                          Vendor<span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Select Vendor"
                          value={vendorSearchTerm}
                          onChange={(e) => {
                            setVendorSearchTerm(e.target.value);
                            setShowDropdown(true);
                          }}
                          onFocus={() => setShowDropdown(true)}
                          required
                        />
                        {showDropdown && (
                          <ul
                            className="list-group position-absolute w-100"
                            style={{
                              zIndex: 1000,
                              maxHeight: "200px",
                              overflowY: "auto",
                            }}
                          >
                            {filteredVendors.length === 0 && (
                              <li className="list-group-item">No results</li>
                            )}
                            {filteredVendors.map((v) => (
                              <li
                                key={v.id}
                                className="list-group-item list-group-item-action"
                                onClick={() => handleSelect(v)}
                                style={{ cursor: "pointer" }}
                              >
                                {v.firmName} - {v.mobileNumber} - {v.city}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label>
                          Reference No<span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={referenceNumber}
                          onChange={(e) => setReferenceNumber(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label>
                          Added By<span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={userName}
                          readOnly
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label>
                          Order Date<span className="text-danger">*</span>
                        </label>
                        <DatePicker
                          selected={orderDate}
                          onChange={setOrderDate}
                          className="form-control"
                          dateFormat="MM/dd/yyyy"
                          popperPlacement="top" // Display the calendar above
                          required
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group">
                        <label>
                          Location<span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label>
                          Delivery Date <span className="text-danger">*</span>
                        </label>
                        <DatePicker
                          selected={deliveryDate}
                          onChange={setDeliveryDate}
                          className="form-control"
                          dateFormat="MM/dd/yyyy"
                          required
                          minDate={new Date()}
                          popperPlacement="top-start" // ✅ Show above input
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card card-default rounded-4 border-0 cardHover">
                <div className="card-body">
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

                  {searchTerm && searchResults.length > 0 && (
                    <div className="search-results" ref={searchResultsRef}>
                      {searchResults.map((product, index) => (
                        <div
                          key={product.id}
                          className={`product-row ${
                            focusedIndex === index ? "focused" : ""
                          } ${
                            (
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
                                        className={`variation-item py-0 border rounded px-2 ${
                                          selectedVariations[variation.id]
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
                                        <span>{variation.variationValue}</span>
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

                  {selectedProducts.length > 0 && (
                    <div className="selected-products">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Product</th>
                            <th>Variant</th>
                            <th>Current Stock</th>
                            <th>Quantity</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedProducts.map((product, index) => (
                            <tr
                              key={`${product.id}-${
                                product.variationId || "base"
                              }`}
                            >
                              <td>{index + 1}</td>
                              <td>
                                {product.productName} ({product.sku})
                              </td>
                              <td>{product.variationValue || "N/A"}</td>
                              <td>
                                {currentStocks[
                                  product.variationId || product.id
                                ] !== undefined
                                  ? currentStocks[
                                      product.variationId || product.id
                                    ]
                                  : "Loading..."}
                              </td>
                              <td>
                                <input
                                  type="text"
                                  className="form-control qty-input"
                                  style={{
                                    MozAppearance: "textfield",
                                    WebkitAppearance: "none",
                                    margin: 0,
                                  }}
                                  value={product.quantity}
                                  onChange={(e) => {
                                    const input = e.target.value.trim();
                                    if (input === "") {
                                      handleQuantityChange(
                                        product.id,
                                        product.variationId,
                                        ""
                                      );
                                      return;
                                    }
                                    const regex = /^[1-9][0-9]*$/;
                                    if (regex.test(input)) {
                                      handleQuantityChange(
                                        product.id,
                                        product.variationId,
                                        input
                                      );
                                    } else {
                                      alert(
                                        "Only numbers greater than 0 are allowed."
                                      );
                                    }
                                  }}
                                />
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm"
                                  onClick={() =>
                                    handleRemoveProduct(
                                      product.id,
                                      product.variationId
                                    )
                                  }
                                >
                                  <i className="fa fa-trash"></i>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="total-units">
                        <strong>Total Units: {totalUnits}</strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="card card-default rounded-4 border-0 cardHover">
                <div className="card-body">
                  <div className="form-group">
                    <label>Additional Notes</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="text-center mt-3">
                <button type="submit" className="btn btn-primary btn-lg">
                  Save Purchase Order
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

export default PurchaseOrder;
