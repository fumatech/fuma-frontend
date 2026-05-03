import React, { useEffect, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Barcode from "react-barcode";
import { jsPDF } from "jspdf";
import bwipjs from "bwip-js";
import { toast } from "react-toastify";
import BackButton from "../../components/BackButton";
import "./ListProducts.css";
import "./ProductAdminTheme.css";

function PrintLabel() {
  const searchResultsRef = useRef(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVariations, setSelectedVariations] = useState({});
  const [selectedInfo, setSelectedInfo] = useState({
    productName: false,
    price: false,
    packingDate: false,
  });

  useEffect(() => {
    fetchAllProducts();
  }, []);

  const fetchAllProducts = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/product/getall`);
      const data = await response.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (error) {
      setSearchResults([]);
      toast.error("Error fetching products");
    }
  };

  const searchProducts = async (query) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/product/search?query=${query}`,
      );
      const data = await response.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (error) {
      setSearchResults([]);
    }
  };

  const handleSearch = async (event) => {
    const value = event.target.value;
    setSearchTerm(value);

    if (!value.trim()) {
      await fetchAllProducts();
      return;
    }

    await searchProducts(value);
    setFocusedIndex(-1);
  };

  const scrollToFocusedItem = () => {
    if (!searchResultsRef.current || focusedIndex < 0) return;
    const items = searchResultsRef.current.querySelectorAll(".erp-search-item");
    if (items[focusedIndex]) {
      items[focusedIndex].scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  const handleKeyPress = async (event) => {
    if (event.key === "Enter" && searchTerm) {
      event.preventDefault();
      if (focusedIndex >= 0 && searchResults[focusedIndex]) {
        handleProductSelect(searchResults[focusedIndex]);
      } else {
        await searchProducts(searchTerm);
      }
      return;
    }

    if (!searchResults.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setFocusedIndex((prev) => Math.min(searchResults.length - 1, prev + 1));
      scrollToFocusedItem();
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setFocusedIndex((prev) => Math.max(0, prev - 1));
      scrollToFocusedItem();
    }
  };

  const handleProductSelect = (product) => {
    const baseProduct = {
      id: product.id,
      productName: product.productName,
      sku: product.sku,
      quantity: 1,
      packingDate: new Date(),
      priceGroupId: "",
      price: product.defaultSellingPrice || "",
    };

    if (Array.isArray(product.productVariations) && product.productVariations.length > 0) {
      const variation = product.productVariations[0];
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

    setSelectedVariations({});
    setSearchTerm("");
    setFocusedIndex(-1);
  };

  const handleVariationSelect = (product, variation, event) => {
    event.stopPropagation();
    setSelectedVariations((prev) => ({
      ...prev,
      [variation.id]: !prev[variation.id],
    }));
  };

  const handleAddSelectedProducts = () => {
    const productsToAdd = [];

    searchResults.forEach((product) => {
      if (Array.isArray(product.productVariations) && product.productVariations.length > 0) {
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
              price: variation.defaultSellingPrice,
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
          price: product.defaultSellingPrice,
        });
      }
    });

    if (!productsToAdd.length) {
      toast.warning("Please select at least one product or variation.");
      return;
    }

    setSelectedProducts((prev) => [...prev, ...productsToAdd]);
    setSelectedVariations({});
    setSearchTerm("");
  };

  const handleRemoveProduct = (productId, variationId) => {
    setSelectedProducts((prev) =>
      prev.filter(
        (product) =>
          !(product.id === productId && (product.variationId || null) === (variationId || null)),
      ),
    );
  };

  const handleQuantityChange = (productId, variationId, value) => {
    setSelectedProducts((prev) =>
      prev.map((product) =>
        product.id === productId && (product.variationId || null) === (variationId || null)
          ? { ...product, quantity: Math.max(1, Number(value) || 1) }
          : product,
      ),
    );
  };

  const handlePackingDateChange = (variationIdOrProductId, value) => {
    setSelectedProducts((prev) =>
      prev.map((product) =>
        (product.variationId || product.id) === variationIdOrProductId
          ? { ...product, packingDate: value }
          : product,
      ),
    );
  };

  const handlePriceGroupChange = (variationIdOrProductId, value) => {
    setSelectedProducts((prev) =>
      prev.map((product) =>
        (product.variationId || product.id) === variationIdOrProductId
          ? { ...product, priceGroupId: value }
          : product,
      ),
    );
  };

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    setSelectedInfo((prev) => ({ ...prev, [name]: checked }));
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const margin = 13;
    const labelWidth = 60;
    const labelHeight = 35;
    const pageWidth = 210;
    const pageHeight = 297;
    const horizontalSpacing = 10;
    const verticalSpacing = 10;

    let xPosition = margin;
    let yPosition = margin;

    selectedProducts.forEach((product) => {
      for (let index = 0; index < product.quantity; index += 1) {
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
          const title = product.productName || "";
          doc.setFontSize(10);
          doc.text(title, centerX - doc.getTextWidth(title) / 2, yPosition + 10);
        }

        if (selectedInfo.price && product.price) {
          const priceText = `Price: $${product.price}`;
          doc.setFontSize(8);
          doc.text(priceText, centerX - doc.getTextWidth(priceText) / 2, yPosition + 15);
        }

        if (selectedInfo.packingDate && product.packingDate) {
          const packingDateText = `Packing Date: ${new Date(product.packingDate).toLocaleDateString()}`;
          doc.setFontSize(8);
          doc.text(
            packingDateText,
            centerX - doc.getTextWidth(packingDateText) / 2,
            yPosition + 19,
          );
        }

        doc.addImage(barcodeImageUrl, "PNG", centerX - 18, yPosition + 21, 36, 9);
        doc.setFontSize(8);
        doc.text(product.sku, centerX - doc.getTextWidth(product.sku) / 2, yPosition + 33);

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
      <div className="erp-label-preview-item" key={`${product.id}-${product.variationId || "base"}`}>
        {selectedInfo.productName && <div>{product.productName}</div>}
        {product.variationValue && <div>{product.variationValue}</div>}
        {selectedInfo.packingDate && (
          <div>Packing Date: {new Date(product.packingDate).toLocaleDateString()}</div>
        )}
        {selectedInfo.price && product.price && <div>Price: ${product.price}</div>}
        <div>SKU: {product.sku}</div>
        <Barcode value={product.sku} width={1.8} height={35} displayValue={false} />
      </div>
    ));
  };

  return (
    <div className="wrapper">
      <div className="content-wrapper erp-product-page erp-master-page">
        <section className="content pt-3">
          <div className="container-fluid">
            <div className="erp-page-header rounded-4 p-3 mb-3">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <BackButton />
                    <h1 className="erp-page-title mb-0">Print Label</h1>
                  </div>
                </div>
              </div>
            </div>

            <div className="erp-form-card rounded-4 p-3 mb-3">
              <div className="row g-3">
                <div className="col-12">
                  <label className="erp-label">Search Products</label>
                  <div className="erp-search-box">
                    <i className="fa fa-search"></i>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by product name, SKU, or barcode"
                      value={searchTerm}
                      onChange={handleSearch}
                      onKeyDown={handleKeyPress}
                    />
                  </div>
                </div>

                {searchResults.length > 0 && (
                  <div className="col-12">
                    <div className="erp-search-list" ref={searchResultsRef}>
                      {searchResults.map((product, index) => (
                        <div
                          key={product.id}
                          className={`erp-search-item ${focusedIndex === index ? "focused" : ""}`}
                          onClick={() => handleProductSelect(product)}
                        >
                          <div className="d-flex justify-content-between gap-3 flex-wrap">
                            <div>
                              <strong>{product.productName}</strong>
                              <small className="d-block text-muted">
                                SKU: {product.sku} | Type: {product.productType}
                              </small>
                            </div>
                            {product.productType === "VARIABLE" &&
                              Array.isArray(product.productVariations) && (
                                <div className="erp-pill-wrap">
                                  {product.productVariations.map((variation) => (
                                    <button
                                      key={variation.id}
                                      type="button"
                                      className={`erp-tax-pill erp-variation-chip ${
                                        selectedVariations[variation.id] ? "active" : ""
                                      }`}
                                      onClick={(event) =>
                                        handleVariationSelect(product, variation, event)
                                      }
                                    >
                                      {variation.variationValue}
                                    </button>
                                  ))}
                                </div>
                              )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-center mt-3">
                      <button
                        type="button"
                        className="erp-btn erp-btn-primary"
                        onClick={handleAddSelectedProducts}
                      >
                        Add Selected Products
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="erp-table-card rounded-4 p-3 mb-3">
              <h5 className="erp-section-title">Selected Products</h5>
              <div className="erp-table-wrap">
                <table className="table table-hover align-middle erp-product-table erp-master-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>No. of Labels</th>
                      <th>Packing Date</th>
                      <th>Selling Price Group</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProducts.length === 0 && (
                      <tr>
                        <td colSpan={5}>
                          <div className="erp-empty-state">
                            <i className="fa fa-barcode"></i>
                            <h6>No products selected</h6>
                            <p>Add products above to prepare labels.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                    {selectedProducts.map((product) => (
                      <tr key={`${product.id}-${product.variationId || "base"}`}>
                        <td>
                          {product.productName} ({product.sku}){" "}
                          {product.variationValue && <strong>- {product.variationValue}</strong>}
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            min="1"
                            value={product.quantity}
                            onChange={(event) =>
                              handleQuantityChange(
                                product.id,
                                product.variationId || null,
                                event.target.value,
                              )
                            }
                          />
                        </td>
                        <td>
                          <DatePicker
                            selected={
                              product.packingDate ? new Date(product.packingDate) : new Date()
                            }
                            onChange={(date) =>
                              handlePackingDateChange(product.variationId || product.id, date)
                            }
                            className="form-control"
                            dateFormat="yyyy-MM-dd"
                          />
                        </td>
                        <td>
                          <select
                            className="form-select"
                            value={product.priceGroupId || ""}
                            onChange={(event) =>
                              handlePriceGroupChange(
                                product.variationId || product.id,
                                event.target.value,
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
                            className="erp-btn erp-btn-danger btn-sm"
                            onClick={() =>
                              handleRemoveProduct(product.id, product.variationId || null)
                            }
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedProducts.length > 0 && (
              <>
                <div className="erp-form-card rounded-4 p-3 mb-3">
                  <h5 className="erp-section-title">Information to Show in Labels</h5>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="erp-checkbox-line">
                        <input
                          type="checkbox"
                          name="productName"
                          checked={selectedInfo.productName}
                          onChange={handleCheckboxChange}
                        />
                        <span>Product Name</span>
                      </label>
                    </div>
                    <div className="col-md-4">
                      <label className="erp-checkbox-line">
                        <input
                          type="checkbox"
                          name="price"
                          checked={selectedInfo.price}
                          onChange={handleCheckboxChange}
                        />
                        <span>Product Price</span>
                      </label>
                    </div>
                    <div className="col-md-4">
                      <label className="erp-checkbox-line">
                        <input
                          type="checkbox"
                          name="packingDate"
                          checked={selectedInfo.packingDate}
                          onChange={handleCheckboxChange}
                        />
                        <span>Packing Date</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="erp-form-card rounded-4 p-3 mb-3">
                  <h5 className="erp-section-title">Preview Labels</h5>
                  <div className="erp-label-preview-grid">{renderBarcodeLabels()}</div>
                  <div className="text-center mt-3">
                    <button type="button" className="erp-btn erp-btn-primary" onClick={downloadPDF}>
                      Download PDF
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default PrintLabel;
