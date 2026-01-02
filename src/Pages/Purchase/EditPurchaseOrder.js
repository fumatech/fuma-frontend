import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./AddPurchase.css"; // Ensure this file contains the appropriate styles
import { toast } from "react-toastify";

function EditPurchaseOrder() {
  const navigate = useNavigate();
  const searchResultsRef = useRef(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const { id } = useParams();
  const [vendor, setVendor] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [addedBy, setAddedBy] = useState("");
  const [orderDate, setOrderDate] = useState();
  const [deliveryDate, setDeliveryDate] = useState();
  const [location, setLocation] = useState("");
  const [file, setFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
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
    const fetchPurchaseData = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/purchaseorder/get/${id}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch purchase data");
        }

        const purchase = await response.json();

        // Setting state based on the fetched data
        setVendor(purchase.vendor);
        setReferenceNumber(purchase.referenceNumber);
        setAddedBy(purchase.addedBy);
        if (purchase?.orderDate && !isNaN(new Date(purchase.orderDate))) {
          setOrderDate(new Date(purchase.orderDate));
        }

        if (purchase?.deliveryDate && !isNaN(new Date(purchase.deliveryDate))) {
          setDeliveryDate(new Date(purchase.deliveryDate));
        }
        setLocation(purchase.location);
        setAdditionalNotes(purchase.additionalNotes);
        if (purchase.file) {
          setFile({ name: purchase.file, isExisting: true }); // only store name
        }

        // Pre-select products and variations
        const selectedProducts = purchase.orderItems.map((item) => ({
          id: item.id,
          productName: item.productName,
          sku: item.productSku,
          quantity: item.quantity,
          variationValue: item.productVariationName,
          productVariationId: item.productVariationId,
        }));

        const selectedVariations = {};
        purchase.orderItems.forEach((item) => {
          selectedVariations[item.productVariationId] = true;
        });

        setSelectedProducts(selectedProducts);
        setSelectedVariations(selectedVariations);

        setProductsData(purchase.orderItems);
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
  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value) await searchProducts(value);
    else setSearchResults([]);
    setFocusedIndex(-1);
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
  const handleQuantityChange = (id, variationId, value) => {
    setSelectedProducts((prev) =>
      prev.map((product) =>
        product.id === id && product.variationId === variationId
          ? { ...product, quantity: parseInt(value) || "" }
          : product
      )
    );
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    if (!selectedFile) {
      setFile(null);
      setErrorMessage("No file selected.");
      return;
    }

    const maxSizeMB = 5;
    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      setFile(null);
      setErrorMessage("File size exceeds 5MB.");
      return;
    }

    // new file replaces old
    setFile(selectedFile);
    setErrorMessage("");
  };

  const handleAdditionalNotesChange = (e) => {
    setAdditionalNotes(e.target.value);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!orderDate || !deliveryDate) {
      toast.warning("Please select order date and delivery date");
      return;
    }

    const formattedOrderDate = orderDate.toISOString().split("T")[0];
    const formattedDeliveryDate = deliveryDate.toISOString().split("T")[0];

    const orderItems = selectedProducts.map((product) => ({
      productId: product.id,
      productName: product.productName,
      productSku: product.sku,
      productVariationId: product.variationId
        ? String(product.variationId)
        : null,
      productVariationName: product.variationValue,
      quantity: product.quantity || 1,
    }));

    const payload = {
      vendor,
      status: 0,
      referenceNumber,
      addedBy,
      orderDate: formattedOrderDate,
      deliveryDate: formattedDeliveryDate,
      location,
      totalItems: totalUnits,
      additionalNotes,
      orderItems,
    };

    try {
      const formData = new FormData();
      formData.append("purchaseOrder", JSON.stringify(payload));
      if (file) {
        formData.append("file", file);
      }

      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/purchaseorder/update/${id}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      if (response.ok) {
        toast.success("Purchase Order updated successfully");
        navigate("/ListPurchaseOrder");
      } else {
        // const errText = await response.text();
        // console.error("Update failed:", errText);
        toast.error("Failed to update Purchase Order");
      }
    } catch (error) {
      //  console.error("Error:", error);
      toast.error("An error occurred while updating the Purchase Order");
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
                  <h1 className="all-heading">Edit Purchase Order</h1>
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
                        <div className="form-group">
                          <label>
                            Order Date<span className="text-danger"></span>
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
                            Delivery Date <span className="text-danger">*</span>
                          </label>
                          <DatePicker
                            selected={deliveryDate}
                            onChange={setDeliveryDate}
                            className="form-control"
                            dateFormat="MM/dd/yyyy"
                            popperPlacement="top" // Display the calendar above
                            minDate={new Date()} // ✅ Prevents selecting past dates
                            required
                          />
                        </div>
                      </div>

                      <div className=" col-md-4">
                        <div className="form-group">
                          <label htmlFor="file">Upload File:</label>
                          <div className="file-input file-input-new">
                            <div className="file-preview">
                              {file ? (
                                <>
                                  <div className="file-preview-thumbnails">
                                    <div>{file.name}</div>
                                  </div>
                                  <div className="file-preview-status text-center text-success">
                                    File ready to upload
                                  </div>
                                </>
                              ) : (
                                <div className="file-drop-disabled">
                                  <div className="file-preview-status text-center text-danger">
                                    {errorMessage}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="input-group">
                              <div className="form-control file-caption kv-fileinput-caption">
                                <div className="file-caption-name">
                                  {file ? file.name : "No file selected"}
                                </div>
                              </div>
                              <div className="input-group-append">
                                <div className="btn btn-primary btn-file rounded-0 py-1 px-2 ms-2">
                                  <i className="glyphicon glyphicon-folder-open"></i>
                                  &nbsp; Browse..
                                  <input
                                    id="upload_file"
                                    accept=".jpg,.jpeg,.png,.gif,.bmp,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                                    className="upload-element"
                                    name="file"
                                    type="file"
                                    onChange={handleFileChange}
                                  />
                                </div>
                              </div>
                            </div>

                            <small className="form-text text-muted">
                              Max File size: 5MB <br />
                              Supported types: Images, PDF, Word, Excel, CSV,
                              Text
                            </small>
                          </div>
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

                    {selectedProducts.length > 0 && (
                      <div className="selected-products">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Product</th>
                              <th>Variant</th>
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
                                <td
                                  style={{
                                    textAlign: "center",
                                    verticalAlign: "middle",
                                  }}
                                >
                                  <input
                                    type="text"
                                    className="form-control qty-input"
                                    style={{
                                      MozAppearance: "textfield",
                                      WebkitAppearance: "none",
                                      margin: "0 auto", // centers the input element itself
                                      width: 100,
                                      textAlign: "center", // centers the text inside the input
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
                                        toast.warning(
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

export default EditPurchaseOrder;
