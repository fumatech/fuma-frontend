import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import DatePicker from "react-datepicker";
import Select from "react-select";
import "react-datepicker/dist/react-datepicker.css";
import "./AddPurchase.css"; // Ensure this file contains the appropriate styles
import axios from "axios";
import { toast } from "react-toastify";

function AddPurchaseReturn() {
  const navigate = useNavigate();
  const searchResultsRef = useRef(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [file, setFile] = useState(null);
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
  const [showDropdown, setShowDropdown] = useState(false);
  const [vendorSearchTerm, setVendorSearchTerm] = useState(""); // for vendor search
  const [totalUnits, setTotalUnits] = useState(0); // New state for total units
  const [userEmail, setUserEmail] = useState(null);
  const [userName, setUserName] = useState("");
  const [productStocks, setProductStocks] = useState({}); // Store stocks by variationId
  const [taxRates, setTaxRates] = useState([]);
  const [taxOptions, setTaxOptions] = useState([]);
  const [purchaseTax, setPurchaseTax] = useState("");
  const [taxAmount, setTaxAmount] = useState(0);
  const [subTotal, setSubTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    const email = sessionStorage.getItem("userEmail");
    if (email) {
      setUserEmail(email);
      fetch(`https://fusionmastertech.com:8443/user/username?email=${email}`)
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
    // Fetch tax rates
    axios
      .get(`${process.env.REACT_APP_BASE_URL}/tax/getall`)
      .then((response) => {
        setTaxRates(response.data);
      })
      .catch((error) => console.error("Error fetching tax rates:", error));
  }, []);

  useEffect(() => {
    const rateOptions = [
      { value: "", label: "None", rate: 0 }, // Default "None" option, value is an empty string
      ...taxRates.map((rate) => ({
        value: rate.id,
        label: `${rate.taxName} (${rate.taxValue}%)`,
        rate: rate.taxValue,
      })),
    ];
    setTaxOptions(rateOptions);
  }, [taxRates]);

  useEffect(() => {
    const calculatedTotalUnits = selectedProducts.reduce((total, product) => {
      return total + product.quantity;
    }, 0);
    setTotalUnits(calculatedTotalUnits); // Set the total units amount
  }, [selectedProducts]);

  useEffect(() => {
    // Calculate subtotal and total amount whenever selectedProducts changes
    let subTotalCalc = 0;

    selectedProducts.forEach((product) => {
      const price = product.defaultSellingPrice || 0;
      subTotalCalc += price * product.quantity;
    });

    setSubTotal(subTotalCalc);

    // Calculate tax amount
    const taxAmountCalc = (subTotalCalc * taxAmount) / 100;
    setTotalAmount(subTotalCalc + taxAmountCalc);
  }, [selectedProducts, taxAmount]);

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

  const fetchCurrentStock = async (productId, variationId) => {
    try {
      let url = "";
      if (variationId) {
        url = `${process.env.REACT_APP_BASE_URL}/stock-transactions/current-stock-byvariation/${variationId}`;
      } else {
        url = `${process.env.REACT_APP_BASE_URL}/stock-transactions/current-stock/${productId}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const stock = await response.json();
        return stock;
      }
      return 0;
    } catch (error) {
      console.error("Error fetching current stock:", error);
      return 0;
    }
  };

  const handleProductSelect = async (product) => {
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
      await updateSelectedProducts(product, newSelectedVariations);
    } else {
      // For single products
      const isSelected = selectedVariations[product.id];
      const newSelectedVariations = {
        ...selectedVariations,
        [product.id]: !isSelected,
      };
      setSelectedVariations(newSelectedVariations);
      await updateSelectedProducts(product, newSelectedVariations);
    }
  };

  const handleVariationSelect = async (product, variation, e) => {
    e.stopPropagation();
    const newSelectedVariations = {
      ...selectedVariations,
      [variation.id]: !selectedVariations[variation.id],
    };
    setSelectedVariations(newSelectedVariations);
    await updateSelectedProducts(product, newSelectedVariations);
  };

  const updateSelectedProducts = async (product, variations) => {
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
        const newProducts = await Promise.all(
          selectedVars.map(async (variation) => {
            const stock = await fetchCurrentStock(product.id, variation.id);
            return {
              id: product.id,
              productName: product.productName,
              sku: product.sku,
              variationId: variation.id,
              variationValue: variation.variationValue,
              quantity: 1,
              defaultSellingPrice: variation.defaultSellingPrice,
              stock: stock,
            };
          })
        );

        setSelectedProducts((prev) => [...prev, ...newProducts]);
      }
    } else {
      // For single products
      if (variations[product.id]) {
        // Add product if selected
        if (
          !selectedProducts.some((p) => p.id === product.id && !p.variationId)
        ) {
          const stock = await fetchCurrentStock(product.id, null);
          setSelectedProducts((prev) => [
            ...prev,
            {
              id: product.id,
              productName: product.productName,
              sku: product.sku,
              quantity: 1,
              defaultSellingPrice: product.defaultSellingPrice,
              stock: stock,
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

  const handleQuantityChange = (productId, variationId, newQuantity) => {
    setSelectedProducts((prevProducts) =>
      prevProducts.map((product) => {
        if (product.id === productId && product.variationId === variationId) {
          if (parseInt(newQuantity, 10) > product.stock) {
            toast.warning("Quantity cannot exceed available stock!");
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

  // Handle tax selection change
  const handleTaxIdChange = (selectedOption) => {
    if (selectedOption === null || selectedOption.value === "") {
      // If the user selects "None", reset the tax
      setPurchaseTax(""); // Reset to "None"
      setTaxAmount(0); // Reset tax amount to 0
    } else {
      const selectedTaxId = selectedOption.value;
      const selectedTaxRate = selectedOption.rate;

      // Update the state with the selected tax details
      setPurchaseTax(selectedTaxId); // Set the selected tax ID
      setTaxAmount(selectedTaxRate); // Set the tax amount (rate)
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission

    const formattedOrderDate = orderDate
      ? orderDate.toISOString().split("T")[0]
      : null;

    const orderItems = selectedProducts.map((product) => ({
      productId: product.id,
      productName: product.productName,
      productSku: product.sku,
      productVariationId: product.variationId, // Adjust according to your data
      productVariationName: product.variationValue, // Assuming 'variationName' exists
      quantity: product.quantity,
      updatedQuantity: 0,
      unitPrice: product.defaultSellingPrice,
      //subtotal: product.defaultSellingPrice * product.quantity,
    }));

    const productStocks = orderItems.map((item) => ({
      productId: item.productId,
      variationId: item.productVariationId || null,
      price: parseFloat(item.unitPrice), // ✅ CORRECT VALUE
      quantity: item.quantity,
      transactionType: "purchase_return",
      date: new Date().toISOString().split("T")[0],
      note: "Stock updated after purchase return", // Optional note
    }));

    const payload = {
      vendor,
      status: 0,
      referenceNumber,
      addedBy: userName,
      orderDate: formattedOrderDate, // Adjusted to include date only
      totalItems: totalUnits, // Total number of items
      purchaseTax,
      additionalNotes,
      purchaseReturnItems: orderItems,
      stockTransactions: productStocks,
      totalAmount: parseFloat(totalAmount) || 0,
    };

    console.log("Payload:", payload); // Debug payload before submitting

    try {
      const formData = new FormData();
      formData.append("purchaseReturn", JSON.stringify(payload)); // JSON as string
      if (file) {
        formData.append("receipt", file); // matches backend param name
      }
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/purchase-return/save`,
        {
          method: "POST",
          body: formData, // Don't set Content-Type, browser will handle it
        }
      );

      if (response.ok) {
        toast.success("Purchase returned successfully");
        navigate("/ReturnPurchase");
      } else {
        toast.error("Purchase Return Not Saved");
      }
    } catch (error) {
      toast.error("Purchase Return Not Saved:", error);
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
    <>
      <div className="wrapper">
        <div className="content-wrapper">
          <section className="content-header">
            <div className="container-fluid">
              <div className="row mb-2">
                <div className="col-sm-6">
                  <h1 className="all-heading"> Add Purchase Return</h1>
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
                            value={userName}
                            onChange={(e) => setAddedBy(e.target.value)}
                            required
                            readOnly
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group d-flex flex-row flex-md-column">
                          <label htmlFor="transaction_date"> Date</label>
                          <DatePicker
                            selected={orderDate}
                            onChange={(date) => setOrderDate(date)}
                            className="form-control w-100 ms-1 ms-md-0 py-3 rounded-1"
                            dateFormat="MM/dd/yyyy"
                            required
                            minDate={new Date()} // Prevent past dates
                            popperPlacement="top" // Display the calendar above
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label>Purchase Tax</label>
                          <Select
                            options={taxOptions}
                            onChange={handleTaxIdChange}
                            placeholder="Select Tax"
                            isClearable
                            styles={{
                              menu: (provided) => ({
                                ...provided,
                                zIndex: 9999,
                              }),
                              container: (provided) => ({
                                ...provided,
                                zIndex: 1,
                              }),
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card card-default rounded-4 border-0 cardHover mt-4">
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
                                    <span
                                      className={`stock ${
                                        product.stock > 0
                                          ? "in-stock"
                                          : "out-of-stock"
                                      }`}
                                    >
                                      {product.stock > 0
                                        ? `Stock: ${product.stock}`
                                        : ""}
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
                              <th>Current Stock</th>
                              <th>Unit Price</th>
                              <th>Qty</th>
                              <th>Line Total</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedProducts.map((product, index) => {
                              const productSubTotal =
                                (product.defaultSellingPrice || 0) *
                                product.quantity;
                              return (
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
                                  <td>{product.stock || 0}</td>
                                  <td>
                                    ₹
                                    {(product.defaultSellingPrice || 0).toFixed(
                                      2
                                    )}
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      className="form-control qty-input"
                                      value={product.quantity}
                                      min="1"
                                      max={product.stock}
                                      onChange={(e) =>
                                        handleQuantityChange(
                                          product.id,
                                          product.variationId,
                                          e.target.value
                                        )
                                      }
                                    />
                                  </td>
                                  <td>₹{productSubTotal.toFixed(2)}</td>

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
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td colSpan="5" className="text-right">
                                <strong>Sub Total:</strong>
                              </td>
                              <td>
                                <strong>₹{subTotal.toFixed(2)}</strong>
                              </td>
                              <td colSpan="2"></td>
                            </tr>
                            <tr>
                              <td colSpan="5" className="text-right">
                                <strong>Tax ({taxAmount}%):</strong>
                              </td>
                              <td>
                                <strong>
                                  ₹{((subTotal * taxAmount) / 100).toFixed(2)}
                                </strong>
                              </td>
                              <td colSpan="2"></td>
                            </tr>
                            <tr>
                              <td colSpan="5" className="text-right">
                                <strong>Total Amount:</strong>
                              </td>
                              <td>
                                <strong>₹{totalAmount.toFixed(2)}</strong>
                              </td>
                              <td colSpan="2"></td>
                            </tr>
                          </tfoot>
                        </table>
                        <div className="total-units">
                          <strong>Total Units: {totalUnits}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card card-default rounded-4 border-0 cardHover mt-4">
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

export default AddPurchaseReturn;
