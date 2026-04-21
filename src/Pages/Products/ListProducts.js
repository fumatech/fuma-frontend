import React, { useEffect, useMemo, useState } from "react";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import "bootstrap/dist/css/bootstrap.min.css";
import Dropdown from "react-bootstrap/Dropdown";
import Collapse from "react-bootstrap/Collapse";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "../../assets/dist/css/adminlte.min.css";
import "../../assets/plugins/fontawesome-free/css/all.min.css";
import "./ListProducts.css";

function ListProducts() {
    const [listProducts, setListProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("active");
    const [open, setOpen] = useState(true);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRows, setSelectedRows] = useState(new Set());

    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [units, setUnits] = useState([]);
    const [taxes, setTaxes] = useState([]);
    const [businessLocations, setBusinessLocations] = useState([]);

    const [categoryMap, setCategoryMap] = useState({});
    const [brandMap, setBrandMap] = useState({});
    const [unitMap, setUnitMap] = useState({});
    const [taxMap, setTaxMap] = useState({});

    const [columnsVisibility, setColumnsVisibility] = useState({
        select: true,
        action: true,
        image: true,
        product: true,
        sku: true,
        location: true,
        stock: true,
        purchasePrice: true,
        salePrice: true,
        type: true,
        category: true,
        brand: true,
        tax: true,
    });

    const [filterValues, setFilterValues] = useState({
        search: "",
        productType: "",
        category: "",
        unit: "",
        brand: "",
        tax: "",
        businessLocation: "",
        status: "",
    });

    const navigate = useNavigate();

    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const [categoryRes, brandRes, unitRes, taxRes] = await Promise.all([
                    axios.get(`${process.env.REACT_APP_BASE_URL}/categories/getall`),
                    axios.get(`${process.env.REACT_APP_BASE_URL}/brands/getall`),
                    axios.get(`${process.env.REACT_APP_BASE_URL}/units/getall`),
                    axios.get(`${process.env.REACT_APP_BASE_URL}/tax/getall`),
                ]);

                const flattenCategories = (input, map = {}) => {
                    (input || []).forEach((cat) => {
                        map[cat.id] = cat.categoryName;
                        if (Array.isArray(cat.subCategories) && cat.subCategories.length) {
                            flattenCategories(cat.subCategories, map);
                        }
                    });
                    return map;
                };

                const builtBrandMap = (brandRes.data || []).reduce((acc, item) => {
                    acc[item.id] = item.brandName;
                    return acc;
                }, {});

                const builtUnitMap = (unitRes.data || []).reduce((acc, item) => {
                    acc[item.id] = `${item.name} (${item.shortName})`;
                    return acc;
                }, {});

                const builtTaxMap = (taxRes.data || []).reduce((acc, item) => {
                    acc[item.id] = `${item.taxName} (${item.taxValue}%)`;
                    return acc;
                }, {});

                setCategories(categoryRes.data || []);
                setBrands(brandRes.data || []);
                setUnits(unitRes.data || []);
                setTaxes(taxRes.data || []);
                setCategoryMap(flattenCategories(categoryRes.data || []));
                setBrandMap(builtBrandMap);
                setUnitMap(builtUnitMap);
                setTaxMap(builtTaxMap);
            } catch (error) {
                console.error("Error fetching master data:", error);
            }
        };

        fetchMasterData();
    }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const endpoint =
                    activeTab === "active"
                        ? `${process.env.REACT_APP_BASE_URL}/product/getallactive`
                        : `${process.env.REACT_APP_BASE_URL}/product/getallinactive`;

                const response = await axios.get(endpoint, { withCredentials: true });
                const rawProducts = Array.isArray(response.data) ? response.data : [];
                const sortedData = rawProducts.sort((a, b) => b.id - a.id);

                const stockRequests = [];
                sortedData.forEach((product) => {
                    stockRequests.push({ productId: product.id, variationId: null });
                    (product.productVariations || []).forEach((variation) => {
                        stockRequests.push({ productId: product.id, variationId: variation.id });
                    });
                });

                let stockMap = {};
                try {
                    const stockResponse = await fetch(
                        `${process.env.REACT_APP_BASE_URL}/stock-transactions/current-stock/bulk`,
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(stockRequests),
                        },
                    );
                    if (stockResponse.ok) {
                        stockMap = await stockResponse.json();
                    }
                } catch (error) {
                    console.error("Error fetching bulk stock:", error);
                }

                const normalizedProducts = sortedData.map((product) => {
                    const productStockKey = `${product.id}_null`;
                    const productStock =
                        stockMap[productStockKey] !== undefined
                            ? stockMap[productStockKey]
                            : "N/A";

                    const updatedVariations = (product.productVariations || []).map(
                        (variation) => {
                            const variationStockKey = `${product.id}_${variation.id}`;
                            const variationStock =
                                stockMap[variationStockKey] !== undefined
                                    ? stockMap[variationStockKey]
                                    : "N/A";
                            return { ...variation, currentStock: variationStock };
                        },
                    );

                    return {
                        ...product,
                        currentStock: productStock,
                        productVariations: updatedVariations,
                        isActive: activeTab === "active",
                    };
                });

                setListProducts(normalizedProducts);
                setBusinessLocations(
                    [...new Set(normalizedProducts.map((p) => p.businessLocation))].filter(
                        Boolean,
                    ),
                );
                setSelectedRows(new Set());
                setCurrentPage(1);
            } catch (error) {
                console.error(`Error fetching ${activeTab} products:`, error);
                setListProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [activeTab]);

    const filteredProducts = useMemo(() => {
        return listProducts.filter((product) => {
            const text = filterValues.search.trim().toLowerCase();
            const productCategoryName = categoryMap[product.category] || "";
            const productBrandName = brandMap[product.brand] || "";
            const productTaxName = taxMap[product.applicableTax] || "";

            const searchable = [
                product.productName,
                product.sku,
                product.productType,
                product.businessLocation,
                productCategoryName,
                productBrandName,
                productTaxName,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const matchesSearch = !text || searchable.includes(text);
            const matchesProductType =
                !filterValues.productType || product.productType === filterValues.productType;
            const matchesCategory =
                !filterValues.category || String(product.category) === String(filterValues.category);
            const matchesUnit =
                !filterValues.unit || String(product.unit) === String(filterValues.unit);
            const matchesBrand =
                !filterValues.brand || String(product.brand) === String(filterValues.brand);
            const matchesTax =
                !filterValues.tax || String(product.applicableTax) === String(filterValues.tax);
            const matchesLocation =
                !filterValues.businessLocation ||
                product.businessLocation === filterValues.businessLocation;
            const matchesStatus =
                !filterValues.status || String(product.status) === String(filterValues.status);

            return (
                matchesSearch &&
                matchesProductType &&
                matchesCategory &&
                matchesUnit &&
                matchesBrand &&
                matchesTax &&
                matchesLocation &&
                matchesStatus
            );
        });
    }, [filterValues, listProducts, categoryMap, brandMap, taxMap]);

    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / entriesPerPage));
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * entriesPerPage;
    const endIndex = startIndex + entriesPerPage;
    const displayedProducts = filteredProducts.slice(startIndex, endIndex);

    useEffect(() => {
        if (safePage !== currentPage) {
            setCurrentPage(safePage);
        }
    }, [safePage, currentPage]);

    const toggleColumn = (column) => {
        setColumnsVisibility((prev) => ({ ...prev, [column]: !prev[column] }));
    };

    const handleEntriesChange = (event) => {
        setEntriesPerPage(Number(event.target.value));
        setCurrentPage(1);
    };

    const handleFilterChange = (event) => {
        const { name, value } = event.target;
        setFilterValues((prev) => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };

    const resetFilters = () => {
        setFilterValues({
            search: "",
            productType: "",
            category: "",
            unit: "",
            brand: "",
            tax: "",
            businessLocation: "",
            status: "",
        });
    };

    const handleRowSelect = (productId) => {
        setSelectedRows((prevSelectedRows) => {
            const nextRows = new Set(prevSelectedRows);
            if (nextRows.has(productId)) {
                nextRows.delete(productId);
            } else {
                nextRows.add(productId);
            }
            return nextRows;
        });
    };

    const handleSelectAll = (event) => {
        if (event.target.checked) {
            setSelectedRows(new Set(displayedProducts.map((item) => item.id)));
            return;
        }
        setSelectedRows(new Set());
    };

    const toggleSelectedStatus = async () => {
        if (selectedRows.size === 0) {
            toast.warning("Please select at least one product");
            return;
        }

        const action = activeTab === "active" ? "deactivate" : "activate";
        const nextStatus = activeTab === "active" ? 0 : 1;

        if (!window.confirm(`Are you sure you want to ${action} selected products?`)) {
            return;
        }

        try {
            await Promise.all(
                Array.from(selectedRows).map((id) =>
                    axios.put(
                        `${process.env.REACT_APP_BASE_URL}/product/status/${id}`,
                        { status: nextStatus },
                        { withCredentials: true },
                    ),
                ),
            );

            toast.success(`Products ${action}d successfully`);
            setListProducts((prev) => prev.filter((item) => !selectedRows.has(item.id)));
            setSelectedRows(new Set());
        } catch (error) {
            toast.error("Failed to update selected product statuses");
        }
    };

    const toggleProductStatus = async (id) => {
        const nextStatus = activeTab === "active" ? 0 : 1;
        const action = activeTab === "active" ? "deactivate" : "activate";

        if (!window.confirm(`Are you sure you want to ${action} this product?`)) {
            return;
        }

        try {
            await axios.put(
                `${process.env.REACT_APP_BASE_URL}/product/status/${id}?status=${nextStatus}`,
                null,
                { withCredentials: true },
            );
            toast.success(`Product ${action}d successfully`);
            setListProducts((prev) => prev.filter((item) => item.id !== id));
            setSelectedRows((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        } catch (error) {
            toast.error("Failed to update product status");
        }
    };

    const handleDeleteClick = async (id) => {
        if (!window.confirm("Are you sure you want to delete this product?")) {
            return;
        }

        try {
            const response = await fetch(
                `${process.env.REACT_APP_BASE_URL}/product/delete/${id}`,
                { method: "DELETE" },
            );

            if (response.status === 204) {
                setListProducts((prev) => prev.filter((item) => item.id !== id));
                toast.success("Product deleted successfully");
            } else {
                toast.error("Failed to delete product");
            }
        } catch (error) {
            toast.error("Error deleting product");
        }
    };

    const exportRows = filteredProducts.map((product) => ({
        "Product Name": product.productName || "N/A",
        SKU: product.sku || "N/A",
        "Business Location": product.businessLocation || "N/A",
        "Current Stock": product.currentStock ?? "N/A",
        "Unit Purchase Price":
            product.productVariations && product.productVariations.length
                ? product.productVariations[0].defaultPurchasePriceExcTax
                : "N/A",
        "Sale Price":
            product.productVariations && product.productVariations.length
                ? product.productVariations[0].defaultSellingPrice
                : "N/A",
        "Product Type": product.productType || "N/A",
        Category: categoryMap[product.category] || "N/A",
        Brand: brandMap[product.brand] || "N/A",
        Tax: taxMap[product.applicableTax] || "N/A",
        Status: String(product.status) === "1" ? "Active" : "Inactive",
    }));

    const exportCSV = () => {
        const csv = [
            Object.keys(exportRows[0] || {}).join(","),
            ...exportRows.map((row) =>
                Object.values(row)
                    .map((value) => `"${value ?? ""}"`)
                    .join(","),
            ),
        ].join("\n");

        saveAs(new Blob([csv], { type: "text/csv" }), "ListProducts.csv");
    };

    const exportExcel = () => {
        const ws = XLSX.utils.json_to_sheet(exportRows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "ListProducts");
        XLSX.writeFile(wb, "ListProducts.xlsx");
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.autoTable({
            head: [Object.keys(exportRows[0] || {})],
            body: exportRows.map((row) => Object.values(row)),
            headStyles: { fillColor: [12, 68, 97] },
            styles: { fontSize: 8 },
        });
        doc.save("ListProducts.pdf");
    };

    const printData = () => {
        const printWindow = window.open("", "", "height=800,width=1200");
        if (!printWindow) {
            return;
        }

        const escapeHtml = (value) =>
            String(value ?? "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/\"/g, "&quot;")
                .replace(/'/g, "&#39;");

        const headers = Object.keys(exportRows[0] || {});
        const baseUrl = process.env.REACT_APP_BASE_URL || "";
        const appOrigin = window.location.origin;

        const normalizeImagePath = (rawPath) => {
            if (!rawPath) return "";

            const imagePath = String(rawPath).trim().replace(/\\/g, "/");
            if (!imagePath) return "";

            return imagePath;
        };

        const resolveImageUrl = (rawPath) => {
            const imagePath = normalizeImagePath(rawPath);
            if (!imagePath) return "";

            if (/^(https?:)?\/\//i.test(imagePath) || imagePath.startsWith("data:")) {
                return imagePath;
            }

            const normalizedBase = String(baseUrl).replace(/\/+$/, "");
            const normalizedPath = imagePath.startsWith("/")
                ? imagePath
                : `/${imagePath}`;

            return `${normalizedBase}${normalizedPath}`;
        };

        const resolveImageFallbackUrl = (rawPath) => {
            const imagePath = normalizeImagePath(rawPath);
            if (!imagePath) return "";

            if (/^(https?:)?\/\//i.test(imagePath) || imagePath.startsWith("data:")) {
                return imagePath;
            }

            const normalizedPath = imagePath.startsWith("/")
                ? imagePath
                : `/${imagePath}`;

            return `${appOrigin}${normalizedPath}`;
        };

        const rowsHtml = exportRows
            .map(
                (row, rowIndex) => `
          <tr>
            <td class="col-index">${rowIndex + 1}</td>
            <td class="col-image">
                            ${filteredProducts[rowIndex]?.productImage
                                                ? `<img class="product-image" src="${escapeHtml(resolveImageUrl(filteredProducts[rowIndex].productImage))}" alt="${escapeHtml(filteredProducts[rowIndex]?.productName || "Product")}" onerror="if(!this.dataset.fallbackTried){this.dataset.fallbackTried='1';this.src='${escapeHtml(resolveImageFallbackUrl(filteredProducts[rowIndex].productImage))}';}else{this.style.display='none';}" />`
                        : "-"
                    }
            </td>
            ${headers
                        .map((header) => `<td>${escapeHtml(row[header])}</td>`)
                        .join("")}
          </tr>
        `,
            )
            .join("");

        const tableHead = headers
            .map((header) => `<th>${escapeHtml(header)}</th>`)
            .join("");

        const now = new Date().toLocaleString();

        printWindow.document.write(`
      <html>
        <head>
          <title>Product List</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 14mm;
            }

            * {
              box-sizing: border-box;
            }

            body {
              font-family: Arial, sans-serif;
              color: #1e293b;
              margin: 0;
              padding: 0;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
            }

            .print-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 10px;
              border-bottom: 2px solid #0d4e6d;
              padding-bottom: 8px;
            }

            .print-title {
              margin: 0;
              color: #0d4e6d;
              font-size: 20px;
              font-weight: 700;
            }

            .print-subtitle {
              margin: 2px 0 0;
              color: #475569;
              font-size: 12px;
            }

            .print-meta {
              font-size: 12px;
              color: #334155;
              text-align: right;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: auto;
              font-size: 11px;
                            border: 1.2px solid #8ea3b5;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
            }

            th,
            td {
                            border: 1.2px solid #8ea3b5;
              padding: 6px 7px;
              vertical-align: top;
              word-break: break-word;
            }

            thead th {
                            background: #0d4e6d !important;
                            color: #ffffff !important;
              font-weight: 700;
              position: sticky;
              top: 0;
                            border: 1.2px solid #d6e2eb;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
            }

            tbody tr:nth-child(even) {
              background: #f8fafc;
            }

            .col-index {
              width: 40px;
              text-align: center;
              font-weight: 700;
            }

            .col-image {
              width: 62px;
              text-align: center;
            }

            .product-image {
              width: 42px;
              height: 42px;
              object-fit: cover;
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              display: inline-block;
              background: #ffffff;
            }

            .summary {
              margin: 0 0 8px;
              color: #334155;
              font-size: 12px;
            }

            .no-data {
              border: 1px dashed #94a3b8;
              padding: 12px;
              text-align: center;
              color: #64748b;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <div>
              <h1 class="print-title">List Products</h1>
              <p class="print-subtitle">Formatted product report</p>
            </div>
            <div class="print-meta">
              <div><strong>Printed:</strong> ${escapeHtml(now)}</div>
              <div><strong>Total Rows:</strong> ${exportRows.length}</div>
            </div>
          </div>

          ${exportRows.length
                ? `
                <p class="summary">Showing ${exportRows.length} products in print view.</p>
                <table>
                  <thead>
                    <tr>
                      <th class="col-index">#</th>
                      <th class="col-image">Image</th>
                      ${tableHead}
                    </tr>
                  </thead>
                  <tbody>
                    ${rowsHtml}
                  </tbody>
                </table>
              `
                : '<div class="no-data">No products found to print.</div>'
            }
        </body>
      </html>
    `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };

    const renderPagination = () => {
        const pages = [];
        const visibleRange = 2;

        for (let page = 1; page <= totalPages; page += 1) {
            if (
                page === 1 ||
                page === totalPages ||
                (page >= safePage - visibleRange && page <= safePage + visibleRange)
            ) {
                pages.push(page);
            }
        }

        const deduped = [...new Set(pages)].sort((a, b) => a - b);
        const withGaps = [];
        deduped.forEach((page, index) => {
            if (index > 0 && page - deduped[index - 1] > 1) {
                withGaps.push("gap");
            }
            withGaps.push(page);
        });

        return (
            <div className="erp-pagination">
                <button
                    type="button"
                    className="erp-page-btn"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={safePage === 1}
                >
                    <i className="fa fa-chevron-left"></i>
                </button>

                {withGaps.map((item, index) =>
                    item === "gap" ? (
                        <span className="erp-page-gap" key={`gap-${index}`}>
                            ...
                        </span>
                    ) : (
                        <button
                            type="button"
                            className={`erp-page-btn ${item === safePage ? "active" : ""}`}
                            key={`page-${item}`}
                            onClick={() => setCurrentPage(item)}
                        >
                            {item}
                        </button>
                    ),
                )}

                <button
                    type="button"
                    className="erp-page-btn"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={safePage === totalPages}
                >
                    <i className="fa fa-chevron-right"></i>
                </button>
            </div>
        );
    };

    const allCurrentRowsSelected =
        displayedProducts.length > 0 &&
        displayedProducts.every((item) => selectedRows.has(item.id));

    const skeletonRows = Array.from({ length: entriesPerPage }, (_, index) => index);

    return (
        <div className="wrapper erp-product-page">
            <div className="content-wrapper">
                <section className="content">
                    <div className="container-fluid py-3">
                        <div className="erp-page-header card border-0 rounded-4">
                            <div className="card-body d-flex flex-wrap justify-content-between align-items-center gap-3">
                                <div>
                                    <h4 className="erp-page-title mb-1">List Products</h4>
                                </div>

                                <div className="erp-action-group">
                                    <div className="erp-status-toggle">
                                        <button
                                            type="button"
                                            className={`btn erp-btn ${activeTab === "active" ? "erp-btn-primary" : "erp-btn-soft"}`}
                                            onClick={() => setActiveTab("active")}
                                        >
                                            <i className="fa fa-check-circle"></i>
                                            Active
                                        </button>
                                        <button
                                            type="button"
                                            className={`btn erp-btn ${activeTab === "inactive" ? "erp-btn-danger" : "erp-btn-soft"}`}
                                            onClick={() => setActiveTab("inactive")}
                                        >
                                            <i className="fa fa-ban"></i>
                                            Inactive
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        className="btn erp-btn erp-btn-soft"
                                        onClick={toggleSelectedStatus}
                                        disabled={selectedRows.size === 0}
                                    >
                                        <i className="fa fa-exchange-alt"></i>
                                        {activeTab === "active" ? "Deactivate Selected" : "Activate Selected"}
                                    </button>

                                    <Link to="/AddProducts" className="btn erp-btn erp-btn-primary">
                                        <i className="fa fa-plus"></i>
                                        Add Product
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="erp-filter-card card border-0 rounded-4 mt-3">
                            <div
                                className="erp-filter-head"
                                onClick={() => setOpen((prev) => !prev)}
                                role="button"
                                aria-expanded={open}
                            >
                                <div className="d-flex align-items-center gap-2">
                                    <i className="fa fa-filter"></i>
                                    <span>Filters</span>
                                </div>
                                <i className={`fa ${open ? "fa-chevron-up" : "fa-chevron-down"}`}></i>
                            </div>

                            <Collapse in={open}>
                                <div className="card-body border-top erp-filter-body">
                                    <div className="row g-2 align-items-end">
                                        <div className="col-xl-3 col-lg-4 col-md-6">
                                            <label className="erp-label">Search</label>
                                            <div className="erp-search-box">
                                                <i className="fa fa-search"></i>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Search name, SKU, location..."
                                                    name="search"
                                                    value={filterValues.search}
                                                    onChange={handleFilterChange}
                                                />
                                            </div>
                                        </div>

                                        <div className="col-xl-2 col-lg-4 col-md-6">
                                            <label className="erp-label">Product Type</label>
                                            <select
                                                className="form-select"
                                                name="productType"
                                                value={filterValues.productType}
                                                onChange={handleFilterChange}
                                            >
                                                <option value="">All</option>
                                                <option value="SINGLE">Single</option>
                                                <option value="VARIABLE">Variable</option>
                                                <option value="COMBO">Combo</option>
                                            </select>
                                        </div>

                                        <div className="col-xl-2 col-lg-4 col-md-6">
                                            <label className="erp-label">Category</label>
                                            <select
                                                className="form-select"
                                                name="category"
                                                value={filterValues.category}
                                                onChange={handleFilterChange}
                                            >
                                                <option value="">All</option>
                                                {categories.map((cat) => (
                                                    <option key={cat.id} value={cat.id}>
                                                        {cat.categoryName}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-xl-2 col-lg-4 col-md-6">
                                            <label className="erp-label">Brand</label>
                                            <select
                                                className="form-select"
                                                name="brand"
                                                value={filterValues.brand}
                                                onChange={handleFilterChange}
                                            >
                                                <option value="">All</option>
                                                {brands.map((item) => (
                                                    <option key={item.id} value={item.id}>
                                                        {item.brandName}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-xl-1 col-lg-4 col-md-6">
                                            <label className="erp-label">Unit</label>
                                            <select
                                                className="form-select"
                                                name="unit"
                                                value={filterValues.unit}
                                                onChange={handleFilterChange}
                                            >
                                                <option value="">All</option>
                                                {units.map((item) => (
                                                    <option key={item.id} value={item.id}>
                                                        {item.name} ({item.shortName})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-xl-2 col-lg-4 col-md-6">
                                            <label className="erp-label">Tax</label>
                                            <select
                                                className="form-select"
                                                name="tax"
                                                value={filterValues.tax}
                                                onChange={handleFilterChange}
                                            >
                                                <option value="">All</option>
                                                {taxes.map((item) => (
                                                    <option key={item.id} value={item.id}>
                                                        {item.taxName} ({item.taxValue}%)
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-xl-2 col-lg-4 col-md-6">
                                            <label className="erp-label">Location</label>
                                            <select
                                                className="form-select"
                                                name="businessLocation"
                                                value={filterValues.businessLocation}
                                                onChange={handleFilterChange}
                                            >
                                                <option value="">All</option>
                                                {businessLocations.map((location, index) => (
                                                    <option key={`loc-${index}`} value={location}>
                                                        {location}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-xl-2 col-lg-4 col-md-6">
                                            <label className="erp-label">Status</label>
                                            <select
                                                className="form-select"
                                                name="status"
                                                value={filterValues.status}
                                                onChange={handleFilterChange}
                                            >
                                                <option value="">All</option>
                                                <option value="1">Active</option>
                                                <option value="0">Inactive</option>
                                            </select>
                                        </div>

                                        <div className="col-xl-2 col-lg-4 col-md-6 d-flex justify-content-lg-end">
                                            <button
                                                type="button"
                                                className="btn erp-btn erp-btn-light"
                                                onClick={resetFilters}
                                            >
                                                <i className="fa fa-undo"></i>
                                                Reset
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </Collapse>
                        </div>

                        <div className="erp-table-card card border-0 rounded-4 mt-3">
                            <div className="card-body p-3 p-lg-4">
                                <div className="erp-table-toolbar">
                                    <div className="erp-toolbar-left">
                                        <div className="erp-entries">
                                            <label htmlFor="entriesPerPage" className="mb-0">
                                                Show
                                            </label>
                                            <select
                                                id="entriesPerPage"
                                                className="form-select"
                                                value={entriesPerPage}
                                                onChange={handleEntriesChange}
                                            >
                                                <option value={10}>10</option>
                                                <option value={25}>25</option>
                                                <option value={50}>50</option>
                                                <option value={100}>100</option>
                                            </select>
                                        </div>

                                        <div className="erp-export-group">
                                            <button type="button" className="btn erp-btn erp-btn-light" onClick={exportCSV}>
                                                <i className="fa fa-file-csv"></i>
                                                CSV
                                            </button>
                                            <button type="button" className="btn erp-btn erp-btn-light" onClick={exportExcel}>
                                                <i className="fa fa-file-excel"></i>
                                                Excel
                                            </button>
                                            <button type="button" className="btn erp-btn erp-btn-light" onClick={exportPDF}>
                                                <i className="fa fa-file-pdf"></i>
                                                PDF
                                            </button>
                                            <button type="button" className="btn erp-btn erp-btn-light" onClick={printData}>
                                                <i className="fa fa-print"></i>
                                                Print
                                            </button>
                                        </div>

                                        <Dropdown>
                                            <Dropdown.Toggle className="btn erp-btn erp-btn-light erp-column-btn" id="column-visibility-dropdown">
                                                <i className="fa fa-columns"></i>
                                                Columns
                                            </Dropdown.Toggle>
                                            <Dropdown.Menu className="erp-column-menu">
                                                {Object.keys(columnsVisibility).map((column) => (
                                                    <Dropdown.Item
                                                        key={column}
                                                        as="button"
                                                        className="erp-column-item"
                                                        onClick={() => toggleColumn(column)}
                                                    >
                                                        <input type="checkbox" checked={columnsVisibility[column]} readOnly />
                                                        <span>
                                                            {column
                                                                .replace(/([A-Z])/g, " $1")
                                                                .replace(/^./, (char) => char.toUpperCase())}
                                                        </span>
                                                    </Dropdown.Item>
                                                ))}
                                            </Dropdown.Menu>
                                        </Dropdown>
                                    </div>

                                    <div className="erp-toolbar-right">{renderPagination()}</div>
                                </div>

                                <div id="product-table-wrap" className="erp-table-wrap">
                                    <table className="table table-hover align-middle erp-product-table">
                                        <thead>
                                            <tr>
                                                {columnsVisibility.select && (
                                                    <th className="erp-th-select">
                                                        <input
                                                            type="checkbox"
                                                            checked={allCurrentRowsSelected}
                                                            onChange={handleSelectAll}
                                                        />
                                                    </th>
                                                )}
                                                {columnsVisibility.action && <th>Actions</th>}
                                                {columnsVisibility.image && <th>Image</th>}
                                                {columnsVisibility.product && <th>Product</th>}
                                                {columnsVisibility.sku && <th>SKU</th>}
                                                {columnsVisibility.location && <th>Business Location</th>}
                                                {columnsVisibility.stock && <th>Stock</th>}
                                                {columnsVisibility.purchasePrice && <th>Unit Purchase Price</th>}
                                                {columnsVisibility.salePrice && <th>Sale Price</th>}
                                                {columnsVisibility.type && <th>Type</th>}
                                                {columnsVisibility.category && <th>Category</th>}
                                                {columnsVisibility.brand && <th>Brand</th>}
                                                {columnsVisibility.tax && <th>Tax</th>}
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {loading &&
                                                skeletonRows.map((row) => (
                                                    <tr key={`skeleton-${row}`}>
                                                        <td colSpan={13}>
                                                            <div className="erp-skeleton-row">
                                                                <span className="erp-skeleton erp-skeleton-sm"></span>
                                                                <span className="erp-skeleton"></span>
                                                                <span className="erp-skeleton erp-skeleton-lg"></span>
                                                                <span className="erp-skeleton erp-skeleton-sm"></span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}

                                            {!loading && displayedProducts.length === 0 && (
                                                <tr>
                                                    <td colSpan={13}>
                                                        <div className="erp-empty-state">
                                                            <i className="fa fa-box-open"></i>
                                                            <h6>No products found</h6>
                                                            <p>
                                                                Try changing filters or search text to find
                                                                matching items.
                                                            </p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}

                                            {!loading &&
                                                displayedProducts.map((product) => {
                                                    const selected = selectedRows.has(product.id);
                                                    const purchasePrice =
                                                        product.productVariations && product.productVariations.length
                                                            ? product.productVariations[0].defaultPurchasePriceExcTax
                                                            : "N/A";
                                                    const salePrice =
                                                        product.productVariations && product.productVariations.length
                                                            ? product.productVariations[0].defaultSellingPrice
                                                            : "N/A";

                                                    return (
                                                        <tr
                                                            key={product.id}
                                                            className={selected ? "erp-row-selected" : ""}
                                                        >
                                                            {columnsVisibility.select && (
                                                                <td>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selected}
                                                                        onChange={() => handleRowSelect(product.id)}
                                                                    />
                                                                </td>
                                                            )}

                                                            {columnsVisibility.action && (
                                                                <td>
                                                                    <div className="erp-action-icons">
                                                                        <button
                                                                            type="button"
                                                                            className="erp-icon-btn"
                                                                            title="View"
                                                                            onClick={() => navigate(`/ViewList/${product.id}`)}
                                                                        >
                                                                            <i className="fa fa-eye"></i>
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="erp-icon-btn"
                                                                            title="Edit"
                                                                            onClick={() => navigate(`/EditList/${product.id}`)}
                                                                        >
                                                                            <i className="fa fa-pen"></i>
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="erp-icon-btn"
                                                                            title="Labels"
                                                                            onClick={() => navigate(`/ProductLabel/${product.id}`)}
                                                                        >
                                                                            <i className="fa fa-barcode"></i>
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="erp-icon-btn"
                                                                            title={activeTab === "active" ? "Deactivate" : "Activate"}
                                                                            onClick={() => toggleProductStatus(product.id)}
                                                                        >
                                                                            <i className="fa fa-power-off"></i>
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="erp-icon-btn danger"
                                                                            title="Delete"
                                                                            onClick={() => handleDeleteClick(product.id)}
                                                                        >
                                                                            <i className="fa fa-trash"></i>
                                                                        </button>
                                                                        {product.productType !== "COMBO" && (
                                                                            <button
                                                                                type="button"
                                                                                className="erp-icon-btn"
                                                                                title="Manage opening stock"
                                                                                onClick={() => navigate(`/opening-stock/${product.id}`)}
                                                                            >
                                                                                <i className="fa fa-box"></i>
                                                                            </button>
                                                                        )}
                                                                        <Link
                                                                            to={`/ProductStockHistory?productId=${product.id}&variationId=${product.productVariations?.[0]?.id || ""
                                                                                }`}
                                                                            className="erp-icon-btn"
                                                                            title="Stock history"
                                                                        >
                                                                            <i className="fa fa-ellipsis-h"></i>
                                                                        </Link>
                                                                    </div>
                                                                </td>
                                                            )}

                                                            {columnsVisibility.image && (
                                                                <td>
                                                                    <img
                                                                        className="erp-thumb"
                                                                        src={`${process.env.REACT_APP_BASE_URL}${product.productImage}`}
                                                                        alt={product.productName}
                                                                    />
                                                                </td>
                                                            )}

                                                            {columnsVisibility.product && (
                                                                <td>
                                                                    <div className="erp-product-name">
                                                                        <strong>{product.productName || "N/A"}</strong>
                                                                        <small>
                                                                            {product.sku || "-"} | {product.productType || "N/A"}
                                                                        </small>
                                                                    </div>
                                                                </td>
                                                            )}

                                                            {columnsVisibility.sku && <td>{product.sku || "N/A"}</td>}
                                                            {columnsVisibility.location && (
                                                                <td>{product.businessLocation || "N/A"}</td>
                                                            )}
                                                            {columnsVisibility.stock && (
                                                                <td>{product.currentStock ?? "N/A"}</td>
                                                            )}
                                                            {columnsVisibility.purchasePrice && (
                                                                <td>{purchasePrice}</td>
                                                            )}
                                                            {columnsVisibility.salePrice && <td>{salePrice}</td>}
                                                            {columnsVisibility.type && (
                                                                <td>{product.productType || "N/A"}</td>
                                                            )}
                                                            {columnsVisibility.category && (
                                                                <td>{categoryMap[product.category] || "N/A"}</td>
                                                            )}
                                                            {columnsVisibility.brand && (
                                                                <td>{brandMap[product.brand] || "N/A"}</td>
                                                            )}
                                                            {columnsVisibility.tax && (
                                                                <td>
                                                                    <span className="erp-tax-pill">
                                                                        {taxMap[product.applicableTax] || "N/A"}
                                                                    </span>
                                                                </td>
                                                            )}
                                                        </tr>
                                                    );
                                                })}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="erp-table-footer">
                                    <div className="erp-table-info">
                                        Showing {filteredProducts.length === 0 ? 0 : startIndex + 1} to{" "}
                                        {Math.min(endIndex, filteredProducts.length)} of{" "}
                                        {filteredProducts.length} entries
                                    </div>
                                    {renderPagination()}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default ListProducts;