import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import Select from "react-select";
import "react-datepicker/dist/react-datepicker.css";
import "./AddPurchase.css"; // Ensure this file contains the appropriate styles
import axios from "axios";

function EditPurchaseReturn() {
  const { id } = useParams();
  const navigate = useNavigate();
  const searchResultsRef = useRef(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [file, setFile] = useState(null);
  const [vendor, setVendor] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [addedBy, setAddedBy] = useState("");
  const [orderDate, setOrderDate] = useState(new Date());
  const [location, setLocation] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVariations, setSelectedVariations] = useState({});
  const [vendorlist, setVendorList] = useState([]);
  const [totalUnits, setTotalUnits] = useState(0);
  const [userEmail, setUserEmail] = useState(null);
  const [userName, setUserName] = useState("");
  const [productStocks, setProductStocks] = useState({});
  const [taxRates, setTaxRates] = useState([]);
  const [taxOptions, setTaxOptions] = useState([]);
  const [purchaseTax, setPurchaseTax] = useState("");
  const [taxAmount, setTaxAmount] = useState(0);
  const [subTotal, setSubTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

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
        setInvoiceNumber(purchase.invoiceNumber);
        setAddedBy(purchase.addedBy);
        setOrderDate(new Date(purchase.orderDate));
        setLocation(purchase.location);
        setAdditionalNotes(purchase.additionalNotes);
        setPurchaseTax(purchase.taxId || "");
        setTaxAmount(purchase.taxAmount || 0);
        setSubTotal(purchase.subTotal || 0);
        setTotalAmount(purchase.totalAmount || 0);
        // Compare using loose equality (==) instead of strict equality (===)
        const matchedPurchaseTaxOption = taxOptions.find(
          (opt) => opt.value == purchase.purchaseTax // Loose equality to handle type mismatch
        );

        if (matchedPurchaseTaxOption) {
          // Check if rate is available

          // Set purchaseTax and its rate
          setPurchaseTax(matchedPurchaseTaxOption.value); // Set the selected tax ID
          setTaxAmount(matchedPurchaseTaxOption.rate); // Set the associated tax rate (as taxAmount)
        } else {
          // Default to "None" if no match is found
          setPurchaseTax(taxOptions[0].value); // Default to first option (None)
          setTaxAmount(taxOptions[0].rate); // Default to the rate of "None" (0 rate)
        }
        // Pre-select products and variations
        const selectedProducts = await Promise.all(
          purchase.purchaseReturnItems.map(async (item) => {
            // Fetch current stock for each product
            let stock = 0;
            try {
              if (item.productVariationId) {
                const stockResponse = await fetch(
                  `${process.env.REACT_APP_BASE_URL}/stock-transactions/current-stock-byvariation/${item.productVariationId}`
                );
                if (stockResponse.ok) {
                  stock = await stockResponse.json();
                }
              } else {
                const stockResponse = await fetch(
                  `${process.env.REACT_APP_BASE_URL}/stock-transactions/current-stock/${item.productId}`
                );
                if (stockResponse.ok) {
                  stock = await stockResponse.json();
                }
              }
            } catch (error) {
              console.error("Error fetching stock:", error);
            }

            return {
              id: item.productId,
              productName: item.productName,
              sku: item.productSku,
              quantity: item.quantity,
              variationValue: item.productVariationName,
              variationId: item.productVariationId,
              defaultSellingPrice: item.unitPrice || 0,
              stock: stock,
            };
          })
        );

        const selectedVariations = {};
        purchase.purchaseReturnItems.forEach((item) => {
          if (item.productVariationId) {
            selectedVariations[item.productVariationId] = true;
          } else {
            selectedVariations[item.productId] = true;
          }
        });

        setSelectedProducts(selectedProducts);
        setSelectedVariations(selectedVariations);
        setTotalUnits(purchase.totalItems);
      } catch (error) {
        console.error("Error fetching purchase data:", error);
      }
    };

    fetchPurchaseData();
  }, [id, taxOptions]);

  useEffect(() => {
    const email = sessionStorage.getItem("userEmail");
    if (email) {
      setUserEmail(email);
      fetch(`${process.env.REACT_APP_BASE_URL}/user/username?email=${email}`)
        .then((response) => response.json())
        .then((data) => {
          if (data) {
            setUserName(data);
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
        setVendorList(data);
      } catch (error) {
        console.error("Error fetching vendors:", error);
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
      { value: "", label: "None", rate: 0 },
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
    setTotalUnits(calculatedTotalUnits);
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

    if (value) {
      await searchProducts(value);
    } else {
      setSearchResults([]);
    }
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
      const selectedVars = product.productVariations.filter(
        (variation) => variations[variation.id]
      );

      setSelectedProducts((prev) =>
        prev.filter((p) => p.id !== product.id || !p.variationId)
      );

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
      if (variations[product.id]) {
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
            alert("Quantity cannot exceed available stock!");
            return product;
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

  const handleTaxIdChange = (selectedOption) => {
    if (selectedOption === null || selectedOption.value === "") {
      setPurchaseTax("");
      setTaxAmount(0);
    } else {
      const selectedTaxId = selectedOption.value;
      const selectedTaxRate = selectedOption.rate;

      setPurchaseTax(selectedTaxId);
      setTaxAmount(selectedTaxRate);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formattedOrderDate = orderDate
      ? orderDate.toISOString().split("T")[0]
      : null;

    const orderItems = selectedProducts.map((product) => ({
      productId: product.id,
      productName: product.productName,
      productSku: product.sku,
      productVariationId: product.variationId,
      productVariationName: product.variationValue,
      quantity: product.quantity,
      unitPrice: product.defaultSellingPrice,
      updatedQuantity: 0,

      // unitPrice: product.defaultSellingPrice,
      //  subtotal: product.defaultSellingPrice * product.quantity,
    }));

    const productStocks = selectedProducts.map((item) => ({
      productId: item.id,
      variationId: item.variationId,
      quantity: item.quantity,
      transactionType: "purchase_return",
      date: new Date().toISOString().split("T")[0],
      note: "Stock updated after purchase return",
    }));

    const payload = {
      id,
      vendor,
      status: 0,
      referenceNumber,
      addedBy: userName,
      orderDate: formattedOrderDate, // Adjusted to include date only
      totalItems: totalUnits, // Total number of items
      additionalNotes,
      purchaseTax,
      purchaseReturnItems: orderItems,
      stockTransactions: productStocks,
      totalAmount: parseFloat(totalAmount) || 0,
      totalAmount,
    };

    try {
      const formData = new FormData();
      formData.append("purchaseReturn", JSON.stringify(payload));
      if (file) formData.append("receipt", file); // optional

      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/purchase-return/update/${id}`,
        {
          method: "PUT",
          body: formData, // FormData, do NOT set Content-Type
        }
      );

      if (response.ok) {
        alert("Purchase return updated successfully");
        navigate("/ReturnPurchase");
      } else {
        alert("Purchase return update failed");
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
                  <h1 className="all-heading">Edit Purchase Return</h1>
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
                          <label>
                            Vendor<span className="text-danger">*</span>
                          </label>
                          <select
                            className="form-select"
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
                          />
                        </div>
                      </div>

                      <div className="col-md-4">
                        <div className="form-group">
                          <label>Purchase Tax</label>
                          <Select
                            options={taxOptions}
                            value={
                              taxOptions.find(
                                (option) => option.value === purchaseTax
                              ) || null
                            }
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
                                <div className="col-8 product-info">
                                  <div className="product-main-info">
                                    <span className="product-name">
                                      {product.productName}
                                    </span>
                                    <span className="product-sku">
                                      {product.sku}
                                    </span>
                                    {/* <span
                                      className={`stock ${
                                        product.stock > 0
                                          ? "in-stock"
                                          : "out-of-stock"
                                      }`}
                                    >
                                      {product.stock > 0
                                        ? `Stock: ${product.stock}`
                                        : "Out of stock"}
                                    </span> */}
                                    <span className="product-type">
                                      {product.productType}
                                    </span>
                                  </div>
                                </div>

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
                                    $
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
                                  <td>${productSubTotal.toFixed(2)}</td>
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
                                <strong>${subTotal.toFixed(2)}</strong>
                              </td>
                              <td colSpan="2"></td>
                            </tr>
                            <tr>
                              <td colSpan="5" className="text-right">
                                <strong>Tax ({taxAmount}%):</strong>
                              </td>
                              <td>
                                <strong>
                                  ${((subTotal * taxAmount) / 100).toFixed(2)}
                                </strong>
                              </td>
                              <td colSpan="2"></td>
                            </tr>
                            <tr>
                              <td colSpan="5" className="text-right">
                                <strong>Total Amount:</strong>
                              </td>
                              <td>
                                <strong>${totalAmount.toFixed(2)}</strong>
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
                    Update
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

export default EditPurchaseReturn;
