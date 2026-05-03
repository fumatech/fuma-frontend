import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import BackButton from "../../components/BackButton";
import "./ListProducts.css";
import "./ViewList.css";

function ViewList() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [stockData, setStockData] = useState({});
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [taxes, setTaxes] = useState([]); // State for taxes
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewImageSrc, setPreviewImageSrc] = useState("");
  const [previewImageAlt, setPreviewImageAlt] = useState("");
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);

  const resolveImageUrl = (rawPath) => {
    if (!rawPath) return "";
    if (/^https?:\/\//i.test(rawPath)) return rawPath;
    const base = (process.env.REACT_APP_BASE_URL || "").replace(/\/$/, "");
    const path = String(rawPath).startsWith("/")
      ? rawPath
      : `/${rawPath}`;
    return `${base}${path}`;
  };

  const parseComboVariations = (comboString) => {
    try {
      return JSON.parse(comboString);
    } catch (e) {
      console.error("Error parsing comboVariations:", e);
      return [];
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all necessary data in parallel
        const [productRes, categoriesRes, brandsRes, unitsRes, taxesRes] =
          await Promise.all([
            axios.get(
              `${process.env.REACT_APP_BASE_URL}/product/get/${productId}`
            ),
            axios.get(`${process.env.REACT_APP_BASE_URL}/categories/getall`),
            axios.get(`${process.env.REACT_APP_BASE_URL}/brands/getall`),
            axios.get(`${process.env.REACT_APP_BASE_URL}/units/getall`),
            axios.get(`${process.env.REACT_APP_BASE_URL}/tax/getall`), // Fetch taxes
          ]);

        setProduct(productRes.data);
        setCategories(categoriesRes.data);
        setBrands(brandsRes.data);
        setUnits(unitsRes.data);
        setTaxes(taxesRes.data);

        // Fetch stock data for each variation
        const stockPromises = productRes.data.productVariations.map(
          (variation) =>
            axios.get(
              `${process.env.REACT_APP_BASE_URL}/stock-transactions/current-stock-byvariation/${variation.id}`
            )
        );

        const stockResults = await Promise.all(stockPromises);
        const stockDataMap = {};
        stockResults.forEach((res, index) => {
          const variationId = productRes.data.productVariations[index].id;
          stockDataMap[variationId] =
            typeof res.data === "number" ? res.data : 0;
        });
        setStockData(stockDataMap);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId]);

  // Helper functions to get names by ID
  const getCategoryName = (id) => {
    const category = categories.find((cat) => cat.id == id);
    return category ? category.categoryName : id;
  };
  const getTaxDetails = (id) => {
    if (!id) return "N/A";
    const tax = taxes.find((t) => t.id == id);
    return tax ? `${tax.taxName} (${tax.taxValue}%)` : id;
  };

  const getBrandName = (id) => {
    const brand = brands.find((b) => b.id == id);
    return brand ? brand.brandName : id;
  };

  const getUnitName = (id) => {
    const unit = units.find((u) => u.id == id);
    return unit ? unit.name : id;
  };

  const escapeHtml = (value) =>
    String(value ?? "N/A")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const buildVariationRows = () => {
    const rows = [];

    (product?.productVariations || []).forEach((variation, index) => {
      if (product.productType === "COMBO" && variation.comboVariations) {
        const comboItems = parseComboVariations(variation.comboVariations);
        comboItems.forEach((item, i) => {
          rows.push({
            sr: `${index + 1}.${i + 1}`,
            name: item.productName || "N/A",
            subSku: item.subSku || "-",
            stock: `1 ${getUnitName(product.unit) || ""}`.trim(),
            ppEx: item.defaultPurchasePriceExcTax || "N/A",
            ppIn: item.defaultPurchasePriceIncTax || "N/A",
            sp: item.defaultSellingPrice || "N/A",
            margin: `${item.margin || "N/A"}%`,
            imageUrl: "",
          });
        });
        return;
      }

      rows.push({
        sr: index + 1,
        name: variation.variationValue || variation.variationName || "N/A",
        subSku: variation.subSku || "-",
        stock:
          stockData[variation.id] !== undefined
            ? `${stockData[variation.id]} ${getUnitName(product.unit) || ""}`.trim()
            : "0",
        ppEx: variation.defaultPurchasePriceExcTax || "N/A",
        ppIn: variation.defaultPurchasePriceIncTax || "N/A",
        sp: variation.defaultSellingPrice || "N/A",
        margin: `${variation.margin || "N/A"}%`,
        imageUrl: variation.variationProductImages
          ? resolveImageUrl(variation.variationProductImages)
          : "",
      });
    });

    return rows;
  };

  const buildStockRows = () => {
    const rows = [];

    (product?.productVariations || []).forEach((variation, index) => {
      if (product.productType === "COMBO" && variation.comboVariations) {
        const comboItems = parseComboVariations(variation.comboVariations);
        comboItems.forEach((item, i) => {
          rows.push({
            sr: `${index + 1}.${i + 1}`,
            subSku: item.subSku || "-",
            productName: item.productName || "N/A",
            location: product.businessLocation || "N/A",
            unitPrice: item.defaultSellingPrice || "N/A",
            currentStock: `1 ${getUnitName(product.unit) || ""}`.trim(),
            stockValue: item.defaultSellingPrice
              ? Number(item.defaultSellingPrice).toFixed(2)
              : "N/A",
          });
        });
        return;
      }

      rows.push({
        sr: index + 1,
        subSku: variation.subSku || "-",
        productName: `${product.productName || "N/A"} - ${
          variation.variationValue || variation.variationName || "N/A"
        }`,
        location: product.businessLocation || "N/A",
        unitPrice: variation.defaultSellingPrice || "N/A",
        currentStock:
          stockData[variation.id] !== undefined
            ? `${stockData[variation.id]} ${getUnitName(product.unit) || ""}`.trim()
            : "0",
        stockValue:
          variation.defaultSellingPrice && stockData[variation.id] !== undefined
            ? (variation.defaultSellingPrice * stockData[variation.id]).toFixed(2)
            : "N/A",
      });
    });

    return rows;
  };

  const handlePrint = () => {
    const printWindow = window.open(
      "",
      "_blank",
      "noopener,noreferrer,width=1280,height=900"
    );

    if (!printWindow) {
      toast.error("Unable to open print preview. Please allow popups.");
      return;
    }

    const variationRows = buildVariationRows();
    const stockRows = buildStockRows();
    const productImageUrl = product.productImage
      ? resolveImageUrl(product.productImage)
      : "";

    const variationRowsHtml = variationRows
      .map(
        (row) => `
          <tr>
            <td>${escapeHtml(row.sr)}</td>
            <td>${escapeHtml(row.name)}</td>
            <td>${escapeHtml(row.subSku)}</td>
            <td>${escapeHtml(row.stock)}</td>
            <td>${escapeHtml(row.ppEx)}</td>
            <td>${escapeHtml(row.ppIn)}</td>
            <td>${escapeHtml(row.sp)}</td>
            <td>${escapeHtml(row.margin)}</td>
            <td>
              ${
                row.imageUrl
                  ? `<img class="thumb" src="${escapeHtml(row.imageUrl)}" alt="Variation" />`
                  : "-"
              }
            </td>
          </tr>
        `
      )
      .join("");

    const stockRowsHtml = stockRows
      .map(
        (row) => `
          <tr>
            <td>${escapeHtml(row.sr)}</td>
            <td>${escapeHtml(row.subSku)}</td>
            <td>${escapeHtml(row.productName)}</td>
            <td>${escapeHtml(row.location)}</td>
            <td>${escapeHtml(row.unitPrice)}</td>
            <td>${escapeHtml(row.currentStock)}</td>
            <td>${escapeHtml(row.stockValue)}</td>
          </tr>
        `
      )
      .join("");

    const detailsBlock = `
      <div class="details-grid">
        <div class="detail-card">
          <h4>Product Basics</h4>
          <div class="kv"><span>Category</span><strong>${escapeHtml(
            getCategoryName(product.category)
          )}</strong></div>
          <div class="kv"><span>Brand</span><strong>${escapeHtml(
            getBrandName(product.brand)
          )}</strong></div>
          <div class="kv"><span>Unit</span><strong>${escapeHtml(
            getUnitName(product.unit)
          )}</strong></div>
          <div class="kv"><span>Product Type</span><strong>${escapeHtml(
            product.productType || "N/A"
          )}</strong></div>
          <div class="kv"><span>Description</span><strong>${escapeHtml(
            product.description || "N/A"
          )}</strong></div>
        </div>
        <div class="detail-card">
          <h4>Inventory Setup</h4>
          <div class="kv"><span>SKU</span><strong>${escapeHtml(
            product.sku || "N/A"
          )}</strong></div>
          <div class="kv"><span>Barcode</span><strong>${escapeHtml(
            product.barcode || "N/A"
          )}</strong></div>
          <div class="kv"><span>Business Location</span><strong>${escapeHtml(
            product.businessLocation || "N/A"
          )}</strong></div>
          <div class="kv"><span>Manage Stock</span><strong>${escapeHtml(
            product.manageStock ? "Yes" : "No"
          )}</strong></div>
          <div class="kv"><span>Alert Quantity</span><strong>${escapeHtml(
            product.alertQuantity || "N/A"
          )}</strong></div>
        </div>
        <div class="detail-card">
          <h4>Tax & Expiry</h4>
          <div class="kv"><span>Expires In</span><strong>${escapeHtml(
            product.expiryPeriod || "Not applicable"
          )}</strong></div>
          <div class="kv"><span>Selling Price Tax Type</span><strong>${escapeHtml(
            product.sellingPriceTaxType || "Exclusive"
          )}</strong></div>
          <div class="kv"><span>Applicable Tax</span><strong>${escapeHtml(
            getTaxDetails(product.applicableTax)
          )}</strong></div>
        </div>
        <div class="detail-card image-card">
          <h4>Product Image</h4>
          ${
            productImageUrl
              ? `<img class="product-image" src="${escapeHtml(
                  productImageUrl
                )}" alt="${escapeHtml(product.productName || "Product")}" />`
              : `<div class="image-empty">No image</div>`
          }
        </div>
      </div>
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Product Report - ${escapeHtml(product.productName || "Product")}</title>
          <style>
            @page { margin: 12mm; size: A4 portrait; }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              font-family: "Segoe UI", Arial, sans-serif;
              color: #163748;
              background: #fff;
            }
            .report {
              width: 100%;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 10px;
              border-bottom: 2px solid #0d4e6d;
              padding-bottom: 8px;
            }
            .title {
              margin: 0;
              font-size: 24px;
              color: #0d4e6d;
              font-weight: 700;
            }
            .subtitle {
              margin: 3px 0 0;
              color: #607d8b;
              font-size: 12px;
            }
            .meta {
              text-align: right;
              font-size: 12px;
              color: #607d8b;
              line-height: 1.5;
            }
            .details-grid {
              display: grid;
              grid-template-columns: repeat(4, minmax(0, 1fr));
              gap: 8px;
              margin: 10px 0 14px;
            }
            .detail-card {
              border: 1px solid #d4e2ea;
              border-radius: 8px;
              padding: 8px;
              background: #f8fbfd;
              min-height: 145px;
            }
            .detail-card h4 {
              margin: 0 0 8px;
              color: #0d4e6d;
              font-size: 13px;
              font-weight: 700;
            }
            .kv {
              display: flex;
              justify-content: space-between;
              gap: 8px;
              padding: 4px 0;
              border-bottom: 1px dashed #d8e5ed;
              font-size: 11px;
            }
            .kv:last-child { border-bottom: none; }
            .kv span { color: #5f7b8b; }
            .kv strong {
              color: #163748;
              text-align: right;
              max-width: 65%;
              word-break: break-word;
            }
            .image-card {
              display: flex;
              flex-direction: column;
            }
            .product-image {
              width: 100%;
              max-height: 110px;
              object-fit: contain;
              border: 1px solid #d4e2ea;
              border-radius: 6px;
              background: #fff;
            }
            .image-empty {
              display: flex;
              align-items: center;
              justify-content: center;
              height: 110px;
              border: 1px solid #d4e2ea;
              border-radius: 6px;
              background: #fff;
              color: #7e97a6;
              font-size: 12px;
            }
            .section {
              margin-top: 12px;
              page-break-inside: avoid;
            }
            .section-title {
              margin: 0 0 6px;
              font-size: 14px;
              color: #0d4e6d;
              font-weight: 700;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
            }
            thead th {
              background: #0d4e6d;
              color: #fff;
              border: 1px solid #b8cfdd;
              padding: 6px 5px;
              font-size: 10px;
              text-align: left;
              word-break: break-word;
            }
            tbody td {
              border: 1px solid #d6e4ec;
              padding: 5px;
              font-size: 10px;
              color: #1f3f50;
              vertical-align: top;
              word-break: break-word;
            }
            tbody tr:nth-child(even) { background: #f7fbfe; }
            .thumb {
              width: 30px;
              height: 30px;
              object-fit: cover;
              border-radius: 4px;
              border: 1px solid #d6e4ec;
              background: #fff;
            }
          </style>
        </head>
        <body>
          <div class="report">
            <div class="header">
              <div>
                <h1 class="title">View Product Report</h1>
                <p class="subtitle">Product profile, pricing variants, and live stock snapshot</p>
              </div>
              <div class="meta">
                <div><strong>Date:</strong> ${escapeHtml(new Date().toLocaleDateString())}</div>
                <div><strong>Product:</strong> ${escapeHtml(product.productName || "N/A")}</div>
                <div><strong>Total Variations:</strong> ${escapeHtml(variationRows.length)}</div>
              </div>
            </div>

            ${detailsBlock}

            <div class="section">
              <h2 class="section-title">Product Variations</h2>
              <table>
                <thead>
                  <tr>
                    <th style="width:5%">#</th>
                    <th style="width:17%">Variation Name</th>
                    <th style="width:11%">Sub SKU</th>
                    <th style="width:12%">Current Stock</th>
                    <th style="width:13%">Purchase Price (Exc. Tax)</th>
                    <th style="width:13%">Purchase Price (Inc. Tax)</th>
                    <th style="width:10%">Selling Price</th>
                    <th style="width:8%">Margin</th>
                    <th style="width:11%">Image</th>
                  </tr>
                </thead>
                <tbody>
                  ${variationRowsHtml || `<tr><td colspan="9">No data found</td></tr>`}
                </tbody>
              </table>
            </div>

            <div class="section">
              <h2 class="section-title">Product Stock Details</h2>
              <table>
                <thead>
                  <tr>
                    <th style="width:6%">#</th>
                    <th style="width:14%">Sub SKU</th>
                    <th style="width:30%">Product Name</th>
                    <th style="width:14%">Location</th>
                    <th style="width:12%">Unit Price</th>
                    <th style="width:12%">Current Stock</th>
                    <th style="width:12%">Stock Value</th>
                  </tr>
                </thead>
                <tbody>
                  ${stockRowsHtml || `<tr><td colspan="7">No data found</td></tr>`}
                </tbody>
              </table>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };

  const openImagePreview = (src, alt = "Product image") => {
    setPreviewImageSrc(src);
    setPreviewImageAlt(alt);
    setIsImagePreviewOpen(true);
  };

  const closeImagePreview = () => {
    setPreviewImageSrc("");
    setPreviewImageAlt("");
    setIsImagePreviewOpen(false);
  };

  if (loading) {
    return (
      <div className="wrapper erp-product-page">
        <div className="content-wrapper bg-transparent">
          <section className="content-header py-3">
            <div className="container-fluid px-3 px-lg-4">
              <div className="card erp-table-card rounded-4 border-0">
                <div className="card-body text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="sr-only">Loading...</span>
                  </div>
                  <p className="mt-2 mb-0">Loading product details...</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="wrapper erp-product-page">
        <div className="content-wrapper bg-transparent">
          <section className="content-header py-3">
            <div className="container-fluid px-3 px-lg-4">
              <div className="alert alert-danger">Product not found</div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="wrapper erp-product-page">
        <div className="content-wrapper bg-transparent">
          <section className="content-header py-3">
            <div className="container-fluid px-3 px-lg-4">
              <div className="erp-page-header rounded-4 p-3 p-lg-4 mb-3">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                  <div className="d-flex align-items-center gap-2">
                    <BackButton />
                    <div>
                      <h1 className="erp-page-title mb-1">View Product</h1>
                    </div>
                  </div>
                  <div className="erp-action-group no-print">
                    <button
                      type="button"
                      className="erp-btn erp-btn-light"
                      onClick={() => window.history.back()}
                    >
                      <i className="fas fa-arrow-left" /> Back
                    </button>
                    <button
                      type="button"
                      className="erp-btn erp-btn-primary"
                      onClick={handlePrint}
                    >
                      <i className="fas fa-print" /> Print
                    </button>
                  </div>
                </div>
              </div>

              <div id="printable-area" className="erp-view-stack">
                <div className="card erp-table-card rounded-4 border-0 mb-3">
                  <div className="card-body p-3 p-lg-4">
                    <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 border-bottom pb-3 mb-3">
                      <div>
                        <h4 className="mb-1 erp-view-title">{product.productName}</h4>
                        <p className="mb-0 text-muted small">SKU: {product.sku || "N/A"}</p>
                      </div>
                      <div className="text-muted small">
                        Date: {new Date().toLocaleDateString()}
                      </div>
                    </div>

                    <div className="erp-view-grid mb-3">
                      <div className="erp-view-card">
                        <h6>Product Basics</h6>
                        <ul>
                          <li>
                            <span>Category</span>
                            <strong>{getCategoryName(product.category)}</strong>
                          </li>
                          <li>
                            <span>Brand</span>
                            <strong>{getBrandName(product.brand)}</strong>
                          </li>
                          <li>
                            <span>Unit</span>
                            <strong>{getUnitName(product.unit)}</strong>
                          </li>
                          <li>
                            <span>Product Type</span>
                            <strong>{product.productType || "N/A"}</strong>
                          </li>
                          <li>
                            <span>Description</span>
                            <strong>{product.description || "N/A"}</strong>
                          </li>
                        </ul>
                      </div>

                      <div className="erp-view-card">
                        <h6>Inventory Setup</h6>
                        <ul>
                          <li>
                            <span>Barcode</span>
                            <strong>{product.barcode || "N/A"}</strong>
                          </li>
                          <li>
                            <span>Business Location</span>
                            <strong>{product.businessLocation || "N/A"}</strong>
                          </li>
                          <li>
                            <span>Manage Stock</span>
                            <strong>{product.manageStock ? "Yes" : "No"}</strong>
                          </li>
                          <li>
                            <span>Alert Quantity</span>
                            <strong>{product.alertQuantity || "N/A"}</strong>
                          </li>
                        </ul>
                      </div>

                      <div className="erp-view-card">
                        <h6>Tax & Expiry</h6>
                        <ul>
                          <li>
                            <span>Expires In</span>
                            <strong>{product.expiryPeriod || "Not applicable"}</strong>
                          </li>
                          <li>
                            <span>Selling Price Tax Type</span>
                            <strong>{product.sellingPriceTaxType || "Exclusive"}</strong>
                          </li>
                          <li>
                            <span>Applicable Tax</span>
                            <strong>{getTaxDetails(product.applicableTax)}</strong>
                          </li>
                        </ul>
                      </div>

                      <div className="erp-view-image-wrap">
                        {product.productImage ? (
                          <button
                            type="button"
                            className="btn p-0 border-0 bg-transparent w-100"
                            onClick={() =>
                              openImagePreview(
                                resolveImageUrl(product.productImage),
                                product.productName
                              )
                            }
                            title="Click to view full size"
                          >
                            <img
                              src={resolveImageUrl(product.productImage)}
                              alt={product.productName}
                              className="erp-view-image"
                            />
                          </button>
                        ) : (
                          <div className="erp-view-no-image">No product image</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card erp-table-card rounded-4 border-0 mb-3">
                  <div className="card-body p-3 p-lg-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h5 className="mb-0 erp-page-title">Product Variations</h5>
                    </div>
                    <div className="erp-table-wrap">
                      <table className="table erp-product-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Variation Name</th>
                            <th>Sub SKU</th>
                            <th>Current Stock</th>
                            <th>Purchase Price (Exc. Tax)</th>
                            <th>Purchase Price (Inc. Tax)</th>
                            <th>Selling Price</th>
                            <th>Margin</th>
                            <th>Image</th>
                          </tr>
                        </thead>
                        <tbody>
                          {product.productVariations.map((variation, index) => {
                            if (
                              product.productType === "COMBO" &&
                              variation.comboVariations
                            ) {
                              const comboItems = parseComboVariations(
                                variation.comboVariations
                              );
                              return comboItems.map((item, i) => (
                                <tr key={`${variation.id}-${i}`}>
                                  <td>{index + 1}.{i + 1}</td>
                                  <td>{item.productName}</td>
                                  <td>{item.subSku || "-"}</td>
                                  <td>{`1 ${getUnitName(product.unit)}`}</td>
                                  <td>{item.defaultPurchasePriceExcTax || "N/A"}</td>
                                  <td>{item.defaultPurchasePriceIncTax || "N/A"}</td>
                                  <td>{item.defaultSellingPrice || "N/A"}</td>
                                  <td>{item.margin || "N/A"}%</td>
                                  <td>-</td>
                                </tr>
                              ));
                            }

                            return (
                              <tr key={variation.id}>
                                <td>{index + 1}</td>
                                <td>
                                  {variation.variationValue || variation.variationName}
                                </td>
                                <td>{variation.subSku}</td>
                                <td>
                                  {stockData[variation.id] !== undefined
                                    ? `${stockData[variation.id]} ${getUnitName(
                                        product.unit
                                      )}`
                                    : 0}
                                </td>
                                <td>{variation.defaultPurchasePriceExcTax || "N/A"}</td>
                                <td>{variation.defaultPurchasePriceIncTax || "N/A"}</td>
                                <td>{variation.defaultSellingPrice || "N/A"}</td>
                                <td>{variation.margin || "N/A"}%</td>
                                <td>
                                  {variation.variationProductImages ? (
                                    <button
                                      type="button"
                                      className="btn p-0 border-0 bg-transparent"
                                      onClick={() =>
                                        openImagePreview(
                                          resolveImageUrl(variation.variationProductImages),
                                          `Variation ${variation.subSku || ""}`.trim()
                                        )
                                      }
                                      title="Click to view full size"
                                    >
                                      <img
                                        src={resolveImageUrl(
                                          variation.variationProductImages
                                        )}
                                        alt="Variation"
                                        className="erp-thumb"
                                      />
                                    </button>
                                  ) : (
                                    "No image"
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="card erp-table-card rounded-4 border-0 mb-4">
                  <div className="card-body p-3 p-lg-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h5 className="mb-0 erp-page-title">Product Stock Details</h5>
                    </div>
                    <div className="erp-table-wrap">
                      <table className="table erp-product-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Sub SKU</th>
                            <th>Product Name</th>
                            <th>Location</th>
                            <th>Unit Price</th>
                            <th>Current Stock</th>
                            <th>Stock Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {product.productVariations.map((variation, index) => {
                            if (
                              product.productType === "COMBO" &&
                              variation.comboVariations
                            ) {
                              const comboItems = parseComboVariations(
                                variation.comboVariations
                              );
                              return comboItems.map((item, i) => (
                                <tr key={`${variation.id}-stock-${i}`}>
                                  <td>{index + 1}.{i + 1}</td>
                                  <td>{item.subSku || "-"}</td>
                                  <td>{item.productName}</td>
                                  <td>{product.businessLocation || "N/A"}</td>
                                  <td>{item.defaultSellingPrice || "N/A"}</td>
                                  <td>{`1 ${getUnitName(product.unit)}`}</td>
                                  <td>
                                    {item.defaultSellingPrice
                                      ? (item.defaultSellingPrice * 1).toFixed(2)
                                      : "N/A"}
                                  </td>
                                </tr>
                              ));
                            }

                            return (
                              <tr key={variation.id}>
                                <td>{index + 1}</td>
                                <td>{variation.subSku}</td>
                                <td>
                                  {product.productName} - {variation.variationValue || variation.variationName}
                                </td>
                                <td>{product.businessLocation || "N/A"}</td>
                                <td>{variation.defaultSellingPrice || "N/A"}</td>
                                <td>
                                  {stockData[variation.id] !== undefined
                                    ? `${stockData[variation.id]} ${getUnitName(
                                        product.unit
                                      )}`
                                    : 0}
                                </td>
                                <td>
                                  {variation.defaultSellingPrice &&
                                  stockData[variation.id] !== undefined
                                    ? (
                                        variation.defaultSellingPrice *
                                        stockData[variation.id]
                                      ).toFixed(2)
                                    : "N/A"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {isImagePreviewOpen && (
        <div
          className="modal fade show"
          style={{
            display: "block",
            backgroundColor: "rgba(0, 0, 0, 0.75)",
          }}
          onClick={closeImagePreview}
        >
          <div
            className="modal-dialog modal-dialog-centered modal-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content bg-transparent border-0 shadow-none">
              <div className="modal-header border-0 pb-0">
                <button
                  type="button"
                  className="btn-close btn-close-white ml-auto"
                  aria-label="Close"
                  onClick={closeImagePreview}
                ></button>
              </div>
              <div className="modal-body text-center">
                <img
                  src={previewImageSrc}
                  alt={previewImageAlt}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "80vh",
                    objectFit: "contain",
                    borderRadius: "8px",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ViewList;
