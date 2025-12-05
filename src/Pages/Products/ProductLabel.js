import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Barcode from "react-barcode"; // Import Barcode component
import { jsPDF } from "jspdf"; // Import jsPDF
import bwipjs from "bwip-js"; // Import bwip-js for barcode generation

function ProductLabel() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVariations, setSelectedVariations] = useState({});
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [price, setPrice] = useState([]);
  const [packingDate, setPackingDate] = useState([]);
  const [totalUnits, setTotalUnits] = useState(0); // New state for total units

  const [showProductName, setShowProductName] = useState(true);
  const [showVariation, setShowVariation] = useState(true);
  const [showPackingDate, setShowPackingDate] = useState(false);

  // Handle product fetching
  useEffect(() => {
    if (!productId) {
      setError(new Error("Product ID is required"));
      setLoading(false);
      return;
    }

    const fetchProduct = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BASE_URL}/product/get/${productId}`
        );
        console.log(response.data);
        setProduct(response.data);

        // Access the defaultSellingPrice from the first product variation
        const sellingPrice =
          response.data.productVariations[0]?.defaultSellingPrice;
        setPrice(sellingPrice);

        // Automatically select the product variations upon fetching
        const initialVariations = response.data.productVariations.reduce(
          (acc, variation) => {
            acc[variation.id] = true; // Auto-select all variations
            return acc;
          },
          {}
        );
        setSelectedVariations(initialVariations);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleVariationSelect = (variationId, isSelected) => {
    setSelectedVariations((prev) => ({
      ...prev,
      [variationId]: isSelected,
    }));
  };

  const handleAddProduct = (product) => {
    const variationsToAdd = product.productVariations.filter(
      (variation) => selectedVariations[variation.id] // Only add selected variations
    );

    if (variationsToAdd.length === 0) {
      alert("Please select at least one variation to add.");
      return;
    }

    let duplicateFound = false;

    const newProducts = variationsToAdd
      .map((variation) => {
        const existingProduct = selectedProducts.find(
          (p) => p.id === product.id && p.variationId === variation.id
        );

        if (existingProduct) {
          duplicateFound = true;
          return null;
        } else {
          return {
            id: product.id,
            productName: product.productName,
            sku: product.sku,
            variationId: variation.id,
            variationName: variation.name,
            variationValue: variation.variationValue,
            quantity: 1, // Set default quantity
            packingDate: new Date(), // Default empty packing date
            priceGroupId: "", // Default empty price group
          };
        }
      })
      .filter(Boolean);

    if (duplicateFound) {
      alert("This product with variation is already added.");
    } else {
      setSelectedProducts((prev) => [...prev, ...newProducts]);
    }

    setSelectedVariations({});
  };

  const handleRemoveProduct = (variationId) => {
    setSelectedProducts((prev) =>
      prev.filter((product) => product.variationId !== variationId)
    );
  };

  const handleQuantityChange = (productId, variationId, value) => {
    setSelectedProducts((prev) =>
      prev.map((product) =>
        product.id === productId && product.variationId === variationId
          ? { ...product, quantity: parseInt(value) }
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

  const [selectedInfo, setSelectedInfo] = useState({
    productName: false,
    price: false,
    packingDate: false,
  });

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setSelectedInfo((prevState) => ({
      ...prevState,
      [name]: checked,
    }));
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const margin = 13; // Margin from the edge of the page
    const labelWidth = 60; // Width of each label in mm
    const labelHeight = 35; // Height of each label in mm
    const pageWidth = 210; // A4 page width in mm
    const pageHeight = 297; // A4 page height in mm
    const padding = 0; // Padding inside the label (define it here)

    // Space between labels
    const horizontalSpacing = 10; // Extra horizontal space between labels
    const verticalSpacing = 10; // Extra vertical space between rows of labels

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

        // Draw the label border
        doc.setLineWidth(0.5);
        doc.rect(xPosition, yPosition, labelWidth, labelHeight, "S");

        // Conditionally add product name
        if (selectedInfo.productName) {
          const productNameWidth = doc.getTextWidth(product.productName);
          doc.setFontSize(10);
          doc.text(
            product.productName,
            centerX - productNameWidth / 3,
            yPosition + 10
          );
        }

        // Conditionally add price
        if (selectedInfo.price) {
          const priceText = `Price: $${price}`;
          const priceWidth = doc.getTextWidth(priceText);
          doc.setFontSize(8);
          doc.text(priceText, centerX - priceWidth / 2, yPosition + 15);
        }

        // Conditionally add packing date
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

        // Add barcode image
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

        // Add SKU
        const skuText = product.sku;
        const skuWidth = doc.getTextWidth(skuText);
        doc.setFontSize(8);
        doc.text(skuText, centerX - skuWidth / 2, yPosition + 33);

        // Move to the next label position
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

  // Handle barcode generation and PDF download
  const renderBarcodeLabels = () => {
    return selectedProducts.map((product, index) => (
      <div
        key={product.variationId}
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
        {/* Conditionally display product name */}
        {selectedInfo.productName && <div>{product.productName}</div>}

        {/* Conditionally display product variation name */}
        {selectedInfo.productVariationName && (
          <div>{product.productVariationName}</div>
        )}

        {/* Conditionally display packing date */}
        {selectedInfo.packingDate && (
          <div>Packing Date - {product.packingDate.toLocaleDateString()}</div>
        )}

        {/* Conditionally display price */}
        {selectedInfo.price && <div>Price - {price}</div>}

        <div>SKU: {product.sku}</div>

        <Barcode
          id={`barcode-${product.variationId}`}
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
  if (!product) return <p>No product data available.</p>;

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6">
                <h1>Print Labels</h1>
              </div>
            </div>

            <div className="card card-default rounded-4 border-0 cardHover">
              <div className="card-body">
                <div className="row">
                  <p>Add products to generate Labels</p>
                  <div className="col-md-12">
                    <div className="product-list">
                      <div key={product.id} className="product-item">
                        <span className="product-name">
                          {product.productName} ({product.sku}) - Stock:{" "}
                          {product.stock}
                        </span>
                        <div className="variations">
                          <ul>
                            {product.productVariations.map((variation) => (
                              <li key={variation.id}>
                                <label>
                                  <input
                                    type="checkbox"
                                    checked={
                                      selectedVariations[variation.id] || false
                                    }
                                    onChange={(e) =>
                                      handleVariationSelect(
                                        variation.id,
                                        e.target.checked
                                      )
                                    }
                                  />
                                  {variation.name} {variation.variationValue}
                                </label>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <button
                          onClick={() => handleAddProduct(product)}
                          className="btn btn-add-variation btn-success"
                        >
                          Add Selected Variations
                        </button>
                      </div>
                    </div>

                    {selectedProducts.length > 0 && (
                      <div className="table-responsive">
                        <table className="table table-bordered table-striped table-condensed">
                          <thead>
                            <tr>
                              <th>Products</th>
                              <th>No. of labels</th>
                              <th>Packing Date</th>
                              <th>Selling Price Group</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedProducts.map((product, index) => (
                              <tr key={product.variationId}>
                                <td>
                                  {product.productName} ({product.sku}) -{" "}
                                  <b>{product.variationValue}</b>
                                  <input
                                    type="hidden"
                                    name={`products[${index}][product_id]`}
                                    value={product.id}
                                  />
                                  <input
                                    type="hidden"
                                    name={`products[${index}][variation_id]`}
                                    value={product.variationId}
                                  />
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
                                    selected={product.packingDate}
                                    onChange={(date) =>
                                      handlePackingDateChange(
                                        product.productVariationId,
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
                                        product.variationId,
                                        e.target.value
                                      )
                                    }
                                  >
                                    <option value="">None</option>
                                    <option value="1">Group 1</option>
                                    <option value="2">Group 2</option>
                                  </select>
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

            <div className="card card-default rounded-4 border-0 cardHover">
              <div className="card-body">
                <div className="row">
                  {selectedProducts.length > 0 && (
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

                                    {/* Add more rows if necessary */}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Render barcode labels */}
                            {selectedProducts.length > 0 && (
                              <div className="card card-default rounded-4 border-0 cardHover">
                                <div className="card-body">
                                  <h3>Preview Labels</h3>
                                  <div
                                    style={{
                                      display: "grid",
                                      gridTemplateColumns:
                                        "repeat(auto-fill, minmax(4in, 1fr))", // Ensures items wrap when needed
                                      gridGap: "10px",
                                      width: "100%", // Ensures container spans full width
                                      overflow: "hidden", // Prevents overflow
                                    }}
                                  >
                                    {renderBarcodeLabels()}
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="col-sm-12 text-center">
                              <button
                                type="button"
                                className="btn btn-save btn-lg px-4 py-2 m-2"
                                onClick={downloadPDF}
                              >
                                Download pdf
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default ProductLabel;
