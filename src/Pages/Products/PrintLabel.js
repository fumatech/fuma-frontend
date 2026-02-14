import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Barcode from "react-barcode";
import { jsPDF } from "jspdf";
import bwipjs from "bwip-js";
import { toast } from "react-toastify";
import BackButton from "../../components/BackButton";

function PrintLabel() {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // New product search states
  const searchResultsRef = useRef(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [price, setPrice] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVariations, setSelectedVariations] = useState({});

  const [selectedInfo, setSelectedInfo] = useState({
    productName: false,
    price: false,
    packingDate: false,
  });

  // Handle product fetching
  useEffect(() => {
    setLoading(false);
  }, []);
  useEffect(() => {
    fetchAllProducts();
  }, []);
  useEffect(() => {
    if (selectedProducts.length === 0) {
      fetchAllProducts();
    }
  }, [selectedProducts]);

  const fetchAllProducts = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/product/getall`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  // New product search handlers
  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim() === "") {
      // If search empty, show all products again
      fetchAllProducts();
      return;
    }

    // Else perform search
    await searchProducts(value);
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
    // 1. Add the product immediately to selectedProducts
    const baseProduct = {
      id: product.id,
      productName: product.productName,
      sku: product.sku,
      quantity: 1,
      packingDate: new Date(),
      price: product.defaultSellingPrice || "",
    };

    // Handle variations
    if (product.productVariations?.length > 0) {
      const variation = product.productVariations[0]; // pick first variation or show modal later

      setSelectedProducts((prev) => [
        ...prev,
        {
          ...baseProduct,
          variationId: variation.id,
          variationValue: variation.variationValue,
          price: variation.defaultSellingPrice,
        },
      ]);
    } else {
      setSelectedProducts((prev) => [...prev, baseProduct]);
    }

    // 2. Clear selection states
    setSelectedVariations({});
    setSearchResults([]);

    // 3. Clear the search input
    setSearchTerm("");
  };

  const handleVariationSelect = (product, variation, e) => {
    e.stopPropagation();
    const newSelectedVariations = {
      ...selectedVariations,
      [variation.id]: !selectedVariations[variation.id],
    };
    setSelectedVariations(newSelectedVariations);
  };

  const handleAddSelectedProducts = () => {
    const productsToAdd = [];

    searchResults.forEach((product) => {
      if (product.productVariations.length > 0) {
        product.productVariations.forEach((variation) => {
          if (selectedVariations[variation.id]) {
            productsToAdd.push({
              id: product.id,
              productName: product.productName,
              sku: product.sku,
              variationId: variation.id,
              variationValue: variation.variationValue,
              quantity: 1,
              packingDate: new Date(),
              priceGroupId: "",
              price: variation.defaultSellingPrice, // Add price here
            });
          }
        });
      } else if (selectedVariations[product.id]) {
        productsToAdd.push({
          id: product.id,
          productName: product.productName,
          sku: product.sku,
          quantity: 1,
          packingDate: new Date(),
          priceGroupId: "",
          price: product.defaultSellingPrice, // Add price here for non-variation products
        });
      }
    });

    if (productsToAdd.length === 0) {
      toast.warning("Please select at least one product/variation to add.");
      return;
    }

    setSelectedProducts((prev) => [...prev, ...productsToAdd]);
    setSelectedVariations({});
    setSearchResults([]);
    setSearchTerm("");
  };

  // Keep all existing handlers exactly the same
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

  const handleQuantityChange = (productId, variationId, value) => {
    setSelectedProducts((prev) =>
      prev.map((product) =>
        product.id === productId && product.variationId === variationId
          ? { ...product, quantity: Math.max(1, parseInt(value) || 1) }
          : product
      )
    );
  };

  const handlePackingDateChange = (variationId, value) => {
    setSelectedProducts((prev) =>
      prev.map((product) =>
        product.variationId === variationId
          ? { ...product, packingDate: value }
          : product
      )
    );
  };

  const handlePriceGroupChange = (variationId, value) => {
    setSelectedProducts((prev) =>
      prev.map((product) =>
        product.variationId === variationId
          ? { ...product, priceGroupId: value }
          : product
      )
    );
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setSelectedInfo((prevState) => ({
      ...prevState,
      [name]: checked,
    }));
  };

  // Keep all barcode-related code exactly the same
  const downloadPDF = () => {
    const doc = new jsPDF();
    const margin = 13;
    const labelWidth = 60;
    const labelHeight = 35;
    const pageWidth = 210;
    const pageHeight = 297;
    const padding = 0;

    const horizontalSpacing = 10;
    const verticalSpacing = 10;

    let xPosition = margin;
    let yPosition = margin;

    selectedProducts.forEach((product) => {
      for (let i = 0; i < product.quantity; i++) {
        const canvas = document.createElement("canvas");
        bwipjs.toCanvas(canvas, {
          bcid: "code128",
          text: product.sku,
          scale: 3,
          height: 10,
          includetext: false,
          textxalign: "center",
        });

        const barcodeImageUrl = canvas.toDataURL("image/png");
        const centerX = xPosition + labelWidth / 2;

        doc.setLineWidth(0.5);
        doc.rect(xPosition, yPosition, labelWidth, labelHeight, "S");

        if (selectedInfo.productName) {
          const productNameWidth = doc.getTextWidth(product.productName);
          doc.setFontSize(10);
          doc.text(
            product.productName,
            centerX - productNameWidth / 3,
            yPosition + 10
          );
        }

        if (selectedInfo.price && product.price) {
          const priceText = `Price: $${product.price}`;
          const priceWidth = doc.getTextWidth(priceText);
          doc.setFontSize(8);
          doc.text(priceText, centerX - priceWidth / 2, yPosition + 15);
        }

        if (selectedInfo.packingDate) {
          const packingDateText = `Packing Date: ${product.packingDate.toLocaleDateString()}`;
          const packingDateWidth = doc.getTextWidth(packingDateText);
          doc.setFontSize(8);
          doc.text(
            packingDateText,
            centerX - packingDateWidth / 2,
            yPosition + 19
          );
        }

        const barcodeWidth = (labelWidth - 2 * padding) * 0.6;
        const barcodeX = centerX - barcodeWidth / 2;
        doc.addImage(
          barcodeImageUrl,
          "PNG",
          barcodeX,
          yPosition + 21,
          barcodeWidth,
          9
        );

        const skuText = product.sku;
        const skuWidth = doc.getTextWidth(skuText);
        doc.setFontSize(8);
        doc.text(skuText, centerX - skuWidth / 2, yPosition + 33);

        xPosition += labelWidth + horizontalSpacing;

        if (xPosition + labelWidth > pageWidth) {
          xPosition = margin;
          yPosition += labelHeight + verticalSpacing;

          if (yPosition + labelHeight > pageHeight) {
            doc.addPage();
            yPosition = margin;
          }
        }
      }
    });

    doc.save("product_labels.pdf");
  };

  const renderBarcodeLabels = () => {
    return selectedProducts.map((product) => (
      <div
        key={product.variationId || product.id}
        style={{
          width: "3in",
          height: "1.7in",
          display: "inline-block",
          textAlign: "center",
          padding: "10px",
          border: "1px solid #000",
          margin: "5px",
          boxSizing: "border-box",
          overflow: "hidden",
          wordWrap: "break-word",
        }}
      >
        {selectedInfo.productName && <div>{product.productName}</div>}
        {product.variationValue && <div>{product.variationValue}</div>}
        {selectedInfo.packingDate && (
          <div>Packing Date - {product.packingDate.toLocaleDateString()}</div>
        )}
        {selectedInfo.price && product.price && (
          <div>Price - ${product.price}</div>
        )}
        <div>SKU: {product.sku}</div>
        <Barcode
          value={product.sku}
          width={2}
          height={35}
          displayValue={false}
        />
      </div>
    ));
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6 d-flex align-items-center">
                <BackButton />
                <h1>Print Labels</h1>
              </div>
            </div>

            <div className="card card-default rounded-4 border-0 cardHover">
              <div className="card-body">
                <div className="row">
                  <p>Add products to generate Labels</p>
                  <div className="col-md-12">
                    {/* Updated search section */}
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
                              fetchAllProducts();
                            }}
                          >
                            <i className="fa fa-times"></i>
                          </button>
                        )}
                      </div>
                    </div>

                    {searchResults.length > 0 && (
                      <div className="search-results" ref={searchResultsRef}>
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

                                {/* Product Variations (only if VARIABLE) */}
                                {product.productType === "VARIABLE" && (
                                  <div className=" col-4 product-variations flex flex-wrap gap-2">
                                    {product.productVariations.map(
                                      (variation) => (
                                        <div
                                          key={variation.id}
                                          className={`variation-item py-0 border rounded px-2 ${selectedVariations[variation.id]
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

                    {searchResults.length > 0 && (
                      <div className="text-center mt-2">
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={handleAddSelectedProducts}
                        >
                          Add Selected Products
                        </button>
                      </div>
                    )}

                    {/* Rest of the component remains exactly the same */}
                    {selectedProducts.length > 0 && (
                      <div className="table-responsive mt-3">
                        <table className="table table-bordered table-striped table-condensed">
                          <thead>
                            <tr>
                              <th>Products</th>
                              <th>No. of labels</th>
                              <th>Packing Date</th>
                              <th>Selling Price Group</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedProducts.map((product, index) => (
                              <tr key={product.variationId || product.id}>
                                <td>
                                  {product.productName} ({product.sku}) -{" "}
                                  {product.variationValue && (
                                    <b>{product.variationValue}</b>
                                  )}
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    className="form-control"
                                    min="1"
                                    value={product.quantity}
                                    onChange={(e) =>
                                      handleQuantityChange(
                                        product.id,
                                        product.variationId,
                                        e.target.value
                                      )
                                    }
                                  />
                                </td>
                                <td>
                                  <DatePicker
                                    selected={
                                      product.packingDate
                                        ? new Date(product.packingDate)
                                        : new Date()
                                    }
                                    onChange={(date) =>
                                      handlePackingDateChange(
                                        product.variationId || product.id,
                                        date
                                      )
                                    }
                                    className="form-control label-date-picker"
                                    dateFormat="yyyy-MM-dd"
                                  />
                                </td>
                                <td>
                                  <select
                                    className="form-control"
                                    value={product.priceGroupId}
                                    onChange={(e) =>
                                      handlePriceGroupChange(
                                        product.variationId || product.id,
                                        e.target.value
                                      )
                                    }
                                  >
                                    <option value="">None</option>
                                    <option value="1">Group 1</option>
                                    <option value="2">Group 2</option>
                                  </select>
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
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Rest of the component remains exactly the same */}
            {selectedProducts.length > 0 && (
              <div className="card card-default rounded-4 border-0 cardHover">
                <div className="card-body">
                  <div className="row">
                    <div className="tw-p-2 sm:tw-p-3">
                      <div className="box-header">
                        <p className="box-title">
                          Information to show in Labels
                        </p>
                      </div>
                      <div className="tw-flow-root tw-border-gray-200">
                        <div>
                          <div className="tw-py-2 tw-align-middle sm:tw-px-5">
                            <div className="row">
                              <div className="col-md-12">
                                <table className="table table-bordered">
                                  <tbody>
                                    <tr>
                                      <td>
                                        <div
                                          className="checkbox"
                                          style={{ paddingBottom: "10px" }}
                                        >
                                          <label>
                                            <input
                                              type="checkbox"
                                              className="me-2"
                                              name="productName"
                                              checked={selectedInfo.productName}
                                              onChange={handleCheckboxChange}
                                            />
                                            <b>Product Name</b>
                                          </label>
                                        </div>
                                        <div
                                          className="input-group"
                                          style={{
                                            display: "flex",
                                            border: "1px solid #ccc",
                                            borderRadius: "4px",
                                          }}
                                        >
                                          <div
                                            className="input-group-addon"
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              padding: "0 10px",
                                              backgroundColor: "#f7f7f7",
                                              borderRight: "1px solid #ccc",
                                            }}
                                          >
                                            <b>Size</b>
                                          </div>
                                          <input
                                            type="text"
                                            className="form-control"
                                            name="print[name_size]"
                                            value="15"
                                            style={{
                                              textAlign: "center",
                                              border: "none",
                                              flex: 1,
                                              padding: "5px 10px",
                                            }}
                                          />
                                        </div>
                                      </td>
                                      <td>
                                        <div
                                          className="checkbox"
                                          style={{ paddingBottom: "10px" }}
                                        >
                                          <label>
                                            <input
                                              type="checkbox"
                                              name="price"
                                              checked={selectedInfo.price}
                                              onChange={handleCheckboxChange}
                                            />
                                            <b>Product price</b>
                                          </label>
                                        </div>
                                        <div
                                          className="input-group"
                                          style={{
                                            display: "flex",
                                            border: "1px solid #ccc",
                                            borderRadius: "4px",
                                          }}
                                        >
                                          <div
                                            className="input-group-addon"
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              padding: "0 10px",
                                              backgroundColor: "#f7f7f7",
                                              borderRight: "1px solid #ccc",
                                            }}
                                          >
                                            <b>Size</b>
                                          </div>
                                          <input
                                            type="text"
                                            className="form-control"
                                            name="print[variations_size]"
                                            value="17"
                                            style={{
                                              textAlign: "center",
                                              border: "none",
                                              flex: 1,
                                              padding: "5px 10px",
                                            }}
                                          />
                                        </div>
                                      </td>
                                      <td>
                                        <div
                                          className="checkbox"
                                          style={{ paddingBottom: "10px" }}
                                        >
                                          <label>
                                            <input
                                              type="checkbox"
                                              name="packingDate"
                                              checked={selectedInfo.packingDate}
                                              onChange={handleCheckboxChange}
                                            />
                                            <b>Print packing date</b>
                                          </label>
                                        </div>
                                        <div
                                          className="input-group"
                                          style={{
                                            display: "flex",
                                            border: "1px solid #ccc",
                                            borderRadius: "4px",
                                          }}
                                        >
                                          <div
                                            className="input-group-addon"
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              padding: "0 10px",
                                              backgroundColor: "#f7f7f7",
                                              borderRight: "1px solid #ccc",
                                            }}
                                          >
                                            <b>Size</b>
                                          </div>
                                          <input
                                            type="text"
                                            className="form-control"
                                            name="print[price_size]"
                                            value="17"
                                            style={{
                                              textAlign: "center",
                                              border: "none",
                                              flex: 1,
                                              padding: "5px 10px",
                                            }}
                                          />
                                        </div>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            <div className="card card-default rounded-4 border-0 cardHover mt-3">
                              <div className="card-body">
                                <h3>Preview Labels</h3>
                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns:
                                      "repeat(auto-fill, minmax(4in, 1fr))",
                                    gridGap: "10px",
                                    width: "100%",
                                    overflow: "hidden",
                                  }}
                                >
                                  {renderBarcodeLabels()}
                                </div>
                              </div>
                            </div>

                            <div className="col-sm-12 text-center mt-3">
                              <button
                                type="button"
                                className="btn btn-primary btn-lg px-4 py-2"
                                onClick={downloadPDF}
                              >
                                Download PDF
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default PrintLabel;
