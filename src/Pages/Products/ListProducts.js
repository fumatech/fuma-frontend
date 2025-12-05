import React, { useEffect, useState } from "react";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import "bootstrap/dist/css/bootstrap.min.css";
import { Modal, Button, Form, Table } from "react-bootstrap";
import "./ListProducts.css";
import Dropdown from "react-bootstrap/Dropdown";
import axios from "axios";
import DropdownButton from "react-bootstrap/DropdownButton";
import * as xlsx from "xlsx";
import { Link, useNavigate } from "react-router-dom";
import Collapse from "react-bootstrap/Collapse";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../assets/dist/css/adminlte.min.css";
import "../../assets/plugins/fontawesome-free/css/all.min.css";
import "../../assets/plugins/datatables-bs4/css/dataTables.bootstrap4.min.css";
import "../../assets/plugins/datatables-responsive/css/responsive.bootstrap4.min.css";
import "../../assets/plugins/datatables-buttons/css/buttons.bootstrap4.min.css";

const staticListProducts = [{}];

function ListProducts({ userRoles }) {
  const [ListProducts, setListProducts] = useState(staticListProducts);
  const [filteredProducts, setFilteredProducts] = useState(staticListProducts);
  const [columnsVisibility, setColumnsVisibility] = useState({
    productImage: true,
    productName: true,
    Action: true,
    Products: true,
    BusinessLocation: true,
    UnitPurchasePrice: true,
    SellingPrice: true,
    CurrentStock: true,
    ProductType: true,
    Category: true,
    Brand: true,
    Tax: true,
    sku: true,
    taxNumber: true,
    variation: true,
  });
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [note, setNote] = useState();
  const [selectedDate, setSelectedDate] = useState();
  const [listProduct, setListProduct] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState([]);
  const [currentStock, setCurrentStock] = useState();
  const [categoriesMap, setCategoriesMap] = useState({});
  const [brandsMap, setBrandsMap] = useState({});
  const [activeTab, setActiveTab] = useState("active");
  const [filterValues, setFilterValues] = useState({
    productType: "",
    category: "",
    unit: "",
    businessLocation: "",
  });
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [businessLocations, setBusinessLocations] = useState([]);

  useEffect(() => {
    applyFilters();
  }, [filterValues, ListProducts]);

  const applyFilters = () => {
    const filtered = ListProducts.filter((product) => {
      const matchesProductType =
        filterValues.productType === "" ||
        product.productType === filterValues.productType;

      const matchesCategory =
        filterValues.category === "" ||
        product.category == filterValues.category;

      const matchesUnit =
        filterValues.unit === "" || product.unit === filterValues.unit;

      const matchesLocation =
        filterValues.businessLocation === "" ||
        product.businessLocation === filterValues.businessLocation;

      return (
        matchesProductType && matchesCategory && matchesUnit && matchesLocation
      );
    });

    setFilteredProducts(filtered);
    setCurrentPage(1);
  };

  const fetchProducts = async (status) => {
    try {
      const endpoint =
        status === "active"
          ? `${process.env.REACT_APP_BASE_URL}/product/getallactive`
          : `${process.env.REACT_APP_BASE_URL}/product/getallinactive`;

      const response = await axios.get(endpoint, {
        withCredentials: true,
      });

      if (Array.isArray(response.data)) {
        const sortedData = response.data.sort((a, b) => b.id - a.id);
        const updatedProducts = await Promise.all(
          sortedData.map(async (product) => {
            try {
              const stockResponse = await fetch(
                `${process.env.REACT_APP_BASE_URL}/stock-transactions/current-stock/${product.id}`
              );
              const productStock = stockResponse.ok
                ? await stockResponse.json()
                : "N/A";

              const updatedVariations = await Promise.all(
                product.productVariations.map(async (variation) => {
                  try {
                    const variationStockResponse = await fetch(
                      `${process.env.REACT_APP_BASE_URL}/stock-transactions/current-stock/${product.id}/${variation.id}`
                    );
                    const variationStock = variationStockResponse.ok
                      ? await variationStockResponse.json()
                      : "N/A";

                    return {
                      ...variation,
                      currentStock: variationStock,
                    };
                  } catch (error) {
                    console.error(
                      `Error fetching stock for variation ${variation.id}:`,
                      error
                    );
                    return { ...variation, currentStock: "N/A" };
                  }
                })
              );

              return {
                ...product,
                currentStock: productStock,
                productVariations: updatedVariations,
                isActive: status === "active",
              };
            } catch (error) {
              console.error(
                `Error fetching stock for product ${product.id}:`,
                error
              );
              return {
                ...product,
                currentStock: "N/A",
                productVariations: product.productVariations.map((v) => ({
                  ...v,
                  currentStock: "N/A",
                })),
                isActive: status === "active",
              };
            }
          })
        );

        setListProducts(updatedProducts);
        setListProduct(updatedProducts);

        // Extract unique units and locations
        const uniqueUnits = [
          ...new Set(updatedProducts.map((p) => p.unit)),
        ].filter(Boolean);
        const uniqueLocations = [
          ...new Set(updatedProducts.map((p) => p.businessLocation)),
        ].filter(Boolean);

        setUnits(uniqueUnits);
        setBusinessLocations(uniqueLocations);
      }
    } catch (error) {
      console.error(`Error fetching ${status} products:`, error);
    }
  };

  useEffect(() => {
    fetchProducts(activeTab);

    const fetchCategoriesAndBrands = async () => {
      try {
        const [categoriesResponse, brandsResponse] = await Promise.all([
          axios.get(`${process.env.REACT_APP_BASE_URL}/categories/getall`),
          axios.get(`${process.env.REACT_APP_BASE_URL}/brands/getall`),
        ]);

        const categoryMap = {};
        const flattenCategories = (categories) => {
          categories.forEach((cat) => {
            categoryMap[cat.id] = cat.categoryName;
            if (cat.subCategories && cat.subCategories.length > 0) {
              flattenCategories(cat.subCategories);
            }
          });
        };
        flattenCategories(categoriesResponse.data);

        const brandMap = {};
        brandsResponse.data.forEach((brand) => {
          brandMap[brand.id] = brand.brandName;
        });

        setCategoriesMap(categoryMap);
        setBrandsMap(brandMap);
        setCategories(categoriesResponse.data);
      } catch (error) {
        console.error("Error loading categories or brands:", error);
      }
    };

    fetchCategoriesAndBrands();

    // Load additional script
    const script = document.createElement("script");
    script.src = "js/JqueryContent.js";
    script.async = true;
    document.body.appendChild(script);

    // Optional: cleanup to remove the script if needed
    return () => {
      document.body.removeChild(script);
    };
  }, [activeTab]);

  // Bulk status toggle
  const toggleSelectedStatus = async () => {
    if (selectedRows.size === 0) {
      alert("Please select at least one product");
      return;
    }

    const action = activeTab === "active" ? "deactivate" : "activate";
    if (
      window.confirm(`Are you sure you want to ${action} selected products?`)
    ) {
      try {
        await Promise.all(
          Array.from(selectedRows).map((id) =>
            axios.put(
              `${process.env.REACT_APP_BASE_URL}/product/status/${id}`,
              { status: activeTab === "active" ? 0 : 1 },
              { withCredentials: true }
            )
          )
        );

        fetchProducts(activeTab);
        setSelectedRows(new Set());
        alert(`Products ${action}d successfully!`);
      } catch (error) {
        console.error("Error updating product statuses:", error);
        alert("Failed to update product statuses.");
      }
    }
  };

  // Single product status toggle
  const toggleProductStatus = async (id) => {
    const newStatus = activeTab === "active" ? 0 : 1;
    const action = activeTab === "active" ? "deactivate" : "activate";

    if (window.confirm(`Are you sure you want to ${action} this product?`)) {
      try {
        await axios.put(
          `${process.env.REACT_APP_BASE_URL}/product/status/${id}?status=${newStatus}`,
          null,
          { withCredentials: true }
        );

        fetchProducts(activeTab);
        alert(`Product ${action}d successfully!`);
      } catch (error) {
        console.error("Error updating product status:", error);
        alert("Failed to update product status.");
      }
    }
  };

  const exportCSV = () => {
    const csvData = filteredProducts.map((product) => ({
      Action: product.Action,
      productImage: product.productImage,
      Products: product.Products,
      "Business Location": product.BusinessLocation,
      UnitPurchasePrice: product.UnitPurchasePrice,
      SellingPrice: product.SellingPrice,
      CurrentStock: product.CurrentStock,
      ProductType: product.ProductType,
      Category: product.Category,
      Brand: product.Brand,
      Tax: product.Tax,
      sku: product.sku,
      "Tax Number": product.taxNumber,
    }));

    const csv = [
      Object.keys(csvData[0]),
      ...csvData.map((row) => Object.values(row)),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, "ListProducts.csv");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredProducts);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ListProducts");
    XLSX.writeFile(wb, "ListProducts.xlsx");
  };

  const printData = () => {
    const printWindow = window.open("", "", "height=800,width=1200");
    printWindow.document.write("<html><head><title>Print</title>");
    printWindow.document.write(
      '<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">'
    );
    printWindow.document.write("</head><body >");
    printWindow.document.write(
      document.getElementById("table-container").innerHTML
    );
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [
        [
          "Action",
          "Products",
          "Business Location",
          "UnitPurchasePrice",
          "SellingPrice",
          "CurrentStock",
          "ProductType",
          "Category",
          "Brand",
          "Tax",
          "sku",
          "Tax Number",
        ],
      ],
      body: filteredProducts.map((product) => [
        product.Action,
        product.Products,
        product.BusinessLocation,
        product.UnitPurchasePrice,
        product.SellingPrice,
        product.CurrentStock,
        product.ProductType,
        product.Category,
        product.Brand,
        product.Tax,
        product.sku,
        product.taxNumber,
      ]),
    });
    doc.save("ListProducts.pdf");
  };

  const toggleColumn = (column) => {
    setColumnsVisibility((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  const handleEntriesChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleEditClick = (productId) => {
    navigate(`/EditList/${productId}`);
  };

  const handleViewClick = (productId) => {
    navigate(`/ViewList/${productId}`);
  };

  const handleLabelClick = (productId) => {
    navigate(`/ProductLabel/${productId}`);
  };

  const handleDeleteClick = (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      fetch(`${process.env.REACT_APP_BASE_URL}/product/delete/${id}`, {
        method: "DELETE",
      })
        .then((response) => {
          if (response.status === 204) {
            setListProduct((prevProducts) =>
              prevProducts.filter((product) => product.id !== id)
            );
            alert("Product deleted successfully!");
          } else {
            alert("Failed to delete product.");
          }
        })
        .catch((error) => console.error("Error deleting product:", error));
    }
  };

  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const displayedCustomers = filteredProducts.slice(startIndex, endIndex);

  const hasPermission = (permissionName) => {
    return (role) =>
      role.permissions((permission) => permission.name === permissionName);
  };

  const handleRowSelect = (productId) => {
    setSelectedRows((prevSelectedRows) => {
      const newSelectedRows = new Set(prevSelectedRows);
      if (newSelectedRows.has(productId)) {
        newSelectedRows.delete(productId);
      } else {
        newSelectedRows.add(productId);
      }
      return newSelectedRows;
    });
  };

  const isRowSelected = (productId) => {
    return selectedRows.has(productId);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(new Set(displayedCustomers.map((p) => p.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleDropdownItemClick = (col, e) => {
    e.stopPropagation();
    toggleColumn(col);
  };

  const renderStatusToggleButtons = () => (
    <div className="btn-group ml-auto" role="group">
      <button
        type="button"
        className={`btn ${
          activeTab === "active" ? "btn-primary" : "btn-outline-primary"
        }`}
        onClick={() => setActiveTab("active")}
      >
        Active
      </button>
      <button
        type="button"
        className={`btn ${
          activeTab === "inactive" ? "btn-danger" : "btn-outline-danger"
        }`}
        onClick={() => setActiveTab("inactive")}
      >
        Inactive
      </button>
    </div>
  );

  const renderStatusToggleDropdownItem = (product) => (
    <Dropdown.Item as="button" onClick={() => toggleProductStatus(product.id)}>
      <div
        className={`d-inline-block w-75 justify-content-center ${
          activeTab === "active" ? "text-danger" : "text-success"
        }`}
      >
        <i className={`dropdown_hover fa fa-power-off me-3`}></i>
        <span>{activeTab === "active" ? "Deactivate" : "Activate"}</span>
      </div>
    </Dropdown.Item>
  );

  const renderFooterButtons = () => (
    <div className="container my-2">
      <div className="row">
        <div className="col-12 col-lg-8 float-left d-flex">
          <div className="mx-2">
            <Button
              className="select_btn p-lg-1"
              variant={
                activeTab === "active" ? "outline-danger" : "outline-success"
              }
              onClick={toggleSelectedStatus}
            >
              {activeTab === "active"
                ? "Deactivate Selected"
                : "Activate Selected"}
            </Button>
          </div>
          <div className="mx-2">
            <Button className="select_btn p-lg-1" variant="outline-secondary">
              Add to Location
            </Button>
          </div>
          <div className="mx-2">
            <Button className="select_btn p-lg-1" variant="outline-success">
              Remove From Function
            </Button>
          </div>
          <div className="mx-2">
            <Button className="select_btn p-lg-1" variant="outline-danger">
              WooCommerce Sync
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="wrapper" style={{ maxHeight: "", overflowY: "auto" }}>
      <div className="content-wrapper">
        <section className="content">
          <div className="container-fluid py-2">
            {/* Filter section */}
            <div className="card card-default rounded-4 border-0 cardHover">
              <div className=" mx-4 my-3">
                <a
                  className="btn-icon-only btn-light p-3 mb-4 fw-bold bg-transparent filter_color "
                  onClick={() => setOpen(!open)}
                  aria-controls="example-collapse-text"
                  aria-expanded={open}
                  style={{
                    color: "#78b833",
                    border: "none",
                    transition: "background-color 0.3s ease",
                  }}
                  onMouseOver={(e) => {
                    e.target.style.Color = "#78b833";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.Color = "#78b833";
                  }}
                >
                  <i className="fa fa-filter me-3"></i>
                  filter
                </a>
                <Collapse in={open}>
                  <div id="example-collapse-text">
                    <hr />
                    <div className="card-body">
                      <div className="row py-2 g-2">
                        <div className="col-md-3">
                          <div className="dropdown">
                            <div className="">
                              <label className="me-2 d-md-inline">
                                Product Type:
                              </label>
                              <div className="d-flex align-items-center">
                                <select
                                  className="form-select me-2"
                                  name="productType"
                                  value={filterValues.productType}
                                  onChange={(e) =>
                                    setFilterValues({
                                      ...filterValues,
                                      productType: e.target.value,
                                    })
                                  }
                                >
                                  <option value="">All</option>
                                  <option value="SINGLE">Single</option>
                                  <option value="VARIABLE">Variable</option>
                                  <option value="COMBO">Combo</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="dropdown">
                            <div className="">
                              <label className="me-2 d-md-inline">
                                Category:
                              </label>
                              <div className="d-flex align-items-center">
                                <select
                                  className="form-select me-2"
                                  name="category"
                                  value={filterValues.category}
                                  onChange={(e) =>
                                    setFilterValues({
                                      ...filterValues,
                                      category: e.target.value,
                                    })
                                  }
                                >
                                  <option value="">All</option>
                                  {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                      {cat.categoryName}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="dropdown">
                            <div className="">
                              <label className="me-2 d-md-inline">Unit:</label>
                              <div className="d-flex align-items-center">
                                <select
                                  className="form-select me-2"
                                  name="unit"
                                  value={filterValues.unit}
                                  onChange={(e) =>
                                    setFilterValues({
                                      ...filterValues,
                                      unit: e.target.value,
                                    })
                                  }
                                >
                                  <option value="">All</option>
                                  {units.map((unit, index) => (
                                    <option key={index} value={unit}>
                                      {unit}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="dropdown">
                            <div className="">
                              <label className="me-2 d-md-inline">
                                Business Location:
                              </label>
                              <div className="d-flex align-items-center">
                                <select
                                  className="form-select me-2"
                                  name="businessLocation"
                                  value={filterValues.businessLocation}
                                  onChange={(e) =>
                                    setFilterValues({
                                      ...filterValues,
                                      businessLocation: e.target.value,
                                    })
                                  }
                                >
                                  <option value="">All</option>
                                  {businessLocations.map((location, index) => (
                                    <option key={index} value={location}>
                                      {location}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-md-12 text-right">
                          <button
                            className="btn btn-secondary"
                            onClick={() =>
                              setFilterValues({
                                productType: "",
                                category: "",
                                unit: "",
                                businessLocation: "",
                              })
                            }
                          >
                            Reset Filters
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Collapse>
              </div>
            </div>

            <div className="card cardHover rounded-4 border-0 ">
              <div className="card-body">
                <ul
                  className="nav nav-tabs"
                  id="custom-content-above-tab"
                  role="tablist"
                >
                  <li className="nav-item">
                    <a
                      className="nav-link active"
                      id="custom-content-above-home-tab"
                      data-toggle="pill"
                      href="#custom-content-above-home"
                      role="tab"
                      aria-controls="custom-content-above-home"
                      aria-selected="true"
                    >
                      {" "}
                      <i className="fa fa-cubes"></i> All Products
                    </a>
                  </li>
                  <li className="nav-item">
                    <a
                      className="nav-link"
                      id="custom-content-above-profile-tab"
                      data-toggle="pill"
                      href="#custom-content-above-profile"
                      role="tab"
                      aria-controls="custom-content-above-profile"
                      aria-selected="false"
                    >
                      <i className="fa fa-hourglass-half"></i> Stock Report
                    </a>
                  </li>
                  <li className="nav-item ml-auto">
                    {renderStatusToggleButtons()}
                  </li>
                </ul>
                <div className="tab-custom-content border-0"></div>
                <div
                  className="tab-content"
                  id="custom-content-above-tabContent"
                >
                  <div
                    className="tab-pane fade show active"
                    id="custom-content-above-home"
                    role="tabpanel"
                    aria-labelledby="custom-content-above-home-tab"
                  >
                    <div className="text-right">
                      {hasPermission("ListProducts.add") && (
                        <Link to="/AddProducts" className="btn btn-add">
                          <i className="fas fa-plus"></i> Add
                        </Link>
                      )}
                    </div>
                    <div className="card-body">
                      <div className="row mb-3 d-flex align-items-center">
                        <div className="col-12 col-md-auto form-group mb-2 d-flex align-items-center text-bold mt-2 mb-2 mr-2">
                          <label htmlFor="entriesPerPage" className="mb-0 mr-2">
                            Show
                          </label>
                          <select
                            id="entriesPerPage"
                            className="form-control form-control-sm mr-2"
                            value={entriesPerPage}
                            onChange={handleEntriesChange}
                          >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={75}>75</option>
                            <option value={100}>100</option>
                          </select>
                          Entries
                        </div>
                        <div className="col d-flex flex-wrap align-items-center">
                          <button
                            onClick={exportCSV}
                            className="btn Export-Btn mt-2 mb-2 mr-2"
                          >
                            <i className="fa fa-file-csv"></i> Export CSV
                          </button>
                          <button
                            onClick={exportExcel}
                            className="btn Export-Btn mt-2 mb-2 mr-2"
                          >
                            <i className="fa fa-file-excel"></i> Export Excel
                          </button>
                          <button
                            onClick={printData}
                            className="btn Export-Btn mt-2 mb-2 mr-2"
                          >
                            <i className="fa fa-print"></i> Print
                          </button>
                          <button
                            onClick={exportPDF}
                            className="btn Export-Btn mt-2 mb-2 mr-2"
                          >
                            <i className="fa fa-file-pdf"></i> Export PDF
                          </button>
                          <div className="dropdown mt-lg-2 mb-lg-2">
                            <button
                              className="btn Export-Btn dropdown-toggle"
                              type="button"
                              id="dropdownMenuButton"
                              data-toggle="dropdown"
                              aria-haspopup="true"
                              aria-expanded="false"
                            >
                              <i className="fa fa-columns"></i> Column
                              Visibility
                            </button>
                            <div
                              className="dropdown-menu"
                              aria-labelledby="dropdownMenuButton"
                            >
                              {Object.keys(columnsVisibility).map((col) => (
                                <div
                                  key={col}
                                  className="dropdown-item d-flex align-items-center"
                                >
                                  <input
                                    type="checkbox"
                                    checked={columnsVisibility[col]}
                                    onChange={() => toggleColumn(col)}
                                    className="mr-2"
                                  />
                                  <span
                                    onClick={(e) =>
                                      handleDropdownItemClick(col, e)
                                    }
                                  >
                                    {col
                                      .replace(/([A-Z])/g, " $1")
                                      .toUpperCase()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div id="table-container" style={{ overflowX: "auto" }}>
                        <table
                          id="example1"
                          className="table table-bordered table-hover"
                          style={{ minWidth: "1000px" }}
                        >
                          <thead>
                            <tr>
                              <th>
                                <input
                                  type="checkbox"
                                  checked={
                                    selectedRows.size ===
                                    displayedCustomers.length
                                  }
                                  onChange={handleSelectAll}
                                />
                              </th>
                              {columnsVisibility.productImage && (
                                <th>Product Image</th>
                              )}
                              {columnsVisibility.Action && <th>Action</th>}
                              {columnsVisibility.Products && (
                                <th>Product Name</th>
                              )}
                              {columnsVisibility.BusinessLocation && (
                                <th>Business Location</th>
                              )}
                              {columnsVisibility.UnitPurchasePrice && (
                                <th>Unit Purchase Price</th>
                              )}
                              {columnsVisibility.SellingPrice && (
                                <th>Selling Price</th>
                              )}
                              {columnsVisibility.Products && (
                                <th>Current Stock</th>
                              )}
                              {columnsVisibility.ProductType && (
                                <th>Product Type</th>
                              )}
                              {columnsVisibility.Category && <th>Category</th>}
                              {columnsVisibility.Brand && <th>Brand</th>}
                              {columnsVisibility.sku && <th>sku</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {displayedCustomers.map((product) => (
                              <tr
                                key={product.id}
                                style={{
                                  backgroundColor: isRowSelected(product.id)
                                    ? "#d3d3d3"
                                    : "transparent",
                                }}
                              >
                                <td>
                                  <input
                                    type="checkbox"
                                    checked={selectedRows.has(product.id)}
                                    onChange={() => handleRowSelect(product.id)}
                                  />
                                </td>
                                {columnsVisibility.productImage && (
                                  <td>
                                    <img
                                      src={`${process.env.REACT_APP_BASE_URL}${product.productImage}`}
                                      alt={product.productName}
                                      style={{
                                        maxHeight: "80px",
                                        maxWidth: "80px",
                                        objectFit: "contain",
                                      }}
                                    />
                                  </td>
                                )}
                                {columnsVisibility.Action && (
                                  <td>
                                    <DropdownButton
                                      id="dropdown-basic-button"
                                      title="Custom"
                                      variant="outline-success rounded-5 fs-6 fw-light border-1"
                                      className="custom-outline-dropdown p-2"
                                    >
                                      <Dropdown.Item
                                        as="button"
                                        onClick={() =>
                                          handleViewClick(product.id)
                                        }
                                      >
                                        <div className="d-inline-block w-75 btn-view justify-content-center text-secondary">
                                          <i className="dropdown_hover fa fa-eye me-3"></i>
                                          <span>View</span>
                                        </div>
                                      </Dropdown.Item>
                                      <Dropdown.Item
                                        as="button"
                                        onClick={() =>
                                          handleEditClick(product.id)
                                        }
                                      >
                                        <div className="d-inline-block w-75 btn-edit justify-content-center text-secondary">
                                          <i className="dropdown_hover fa-solid fa-pen-to-square me-3"></i>
                                          <span>Edit</span>
                                        </div>
                                      </Dropdown.Item>
                                      {renderStatusToggleDropdownItem(product)}
                                      <Dropdown.Item
                                        as="button"
                                        onClick={() =>
                                          handleLabelClick(product.id)
                                        }
                                      >
                                        <div className="d-inline-block w-75 btn-view justify-content-center text-secondary">
                                          <i className="fa-solid fa-barcode me-3"></i>
                                          <span>Labels</span>
                                        </div>
                                      </Dropdown.Item>
                                      <Dropdown.Item
                                        as="button"
                                        onClick={() =>
                                          navigate(
                                            `/opening-stock/${product.id}`
                                          )
                                        }
                                        hidden={product.productType === "COMBO"}
                                      >
                                        <div className="d-inline-block w-275 btn-edit justify-content-center text-secondary">
                                          <i className="dropdown_hover fa fa-add me-3"></i>
                                          <span>Manage Opening Stock</span>
                                        </div>
                                      </Dropdown.Item>
                                    </DropdownButton>
                                  </td>
                                )}
                                {columnsVisibility.Products && (
                                  <td>{product.productName}</td>
                                )}
                                {columnsVisibility.BusinessLocation && (
                                  <td>{product.businessLocation}</td>
                                )}
                                {columnsVisibility.UnitPurchasePrice && (
                                  <td>
                                    {product.productVariations &&
                                    product.productVariations.length > 0
                                      ? product.productVariations[0]
                                          .defaultPurchasePriceExcTax
                                      : "N/A"}
                                  </td>
                                )}
                                {columnsVisibility.SellingPrice && (
                                  <td>
                                    {product.productVariations &&
                                    product.productVariations.length > 0
                                      ? product.productVariations[0]
                                          .defaultSellingPrice
                                      : "N/A"}
                                  </td>
                                )}
                                {columnsVisibility.Products && (
                                  <td>
                                    {product.currentStock !== undefined
                                      ? product.currentStock
                                      : "N/A"}
                                  </td>
                                )}
                                {columnsVisibility.ProductType && (
                                  <td>{product.productType}</td>
                                )}
                                {columnsVisibility.Category && (
                                  <td>
                                    {categoriesMap[product.category] ||
                                      product.category}
                                  </td>
                                )}
                                {columnsVisibility.Brand && (
                                  <td>
                                    {brandsMap[product.brand] || product.brand}
                                  </td>
                                )}
                                {columnsVisibility.sku && (
                                  <td>{product.sku}</td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {renderFooterButtons()}
                    </div>
                  </div>

                  <div
                    className="tab-pane fade"
                    id="custom-content-above-profile"
                    role="tabpanel"
                    aria-labelledby="custom-content-above-profile-tab"
                  >
                    <div
                      className="tab-pane fade show active"
                      id="custom-content-above-home"
                      role="tabpanel"
                      aria-labelledby="custom-content-above-home-tab"
                    >
                      <div className="card-body">
                        <div className="row mb-3 d-flex align-items-center">
                          <div className="col-12 col-md-auto form-group mb-2 d-flex align-items-center text-bold mt-2 mb-2 mr-2">
                            <label
                              htmlFor="entriesPerPage"
                              className="mb-0 mr-2"
                            >
                              Show
                            </label>
                            <select
                              id="entriesPerPage"
                              className="form-control form-control-sm mr-2"
                              value={entriesPerPage}
                              onChange={handleEntriesChange}
                            >
                              <option value={10}>10</option>
                              <option value={25}>25</option>
                              <option value={50}>50</option>
                              <option value={75}>75</option>
                              <option value={100}>100</option>
                            </select>
                            Entries
                          </div>
                          <div className="col d-flex flex-wrap align-items-center">
                            <button
                              onClick={exportCSV}
                              className="btn Export-Btn mt-2 mb-2 mr-2"
                            >
                              <i className="fa fa-file-csv"></i> Export CSV
                            </button>
                            <button
                              onClick={exportExcel}
                              className="btn Export-Btn mt-2 mb-2 mr-2"
                            >
                              <i className="fa fa-file-excel"></i> Export Excel
                            </button>
                            <button
                              onClick={printData}
                              className="btn Export-Btn mt-2 mb-2 mr-2"
                            >
                              <i className="fa fa-print"></i> Print
                            </button>
                            <button
                              onClick={exportPDF}
                              className="btn Export-Btn mt-2 mb-2 mr-2"
                            >
                              <i className="fa fa-file-pdf"></i> Export PDF
                            </button>
                            <div className="dropdown mt-lg-2 mb-lg-2">
                              <button
                                className="btn Export-Btn dropdown-toggle"
                                type="button"
                                id="dropdownMenuButton"
                                data-toggle="dropdown"
                                aria-haspopup="true"
                                aria-expanded="false"
                              >
                                <i className="fa fa-columns"></i> Column
                                Visibility
                              </button>
                              <div
                                className="dropdown-menu"
                                aria-labelledby="dropdownMenuButton"
                              >
                                {Object.keys(columnsVisibility).map((col) => (
                                  <div
                                    key={col}
                                    className="dropdown-item d-flex align-items-center"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={columnsVisibility[col]}
                                      onChange={() => toggleColumn(col)}
                                      className="mr-2"
                                    />
                                    {col
                                      .replace(/([A-Z])/g, " $1")
                                      .toUpperCase()}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Stock Report Table */}
                        <div id="table-container" style={{ overflowX: "auto" }}>
                          <table
                            id="variationReport"
                            className="table table-bordered table-hover"
                            style={{ minWidth: "1000px" }}
                          >
                            <thead>
                              <tr>
                                {columnsVisibility.Action && <th>Action</th>}
                                {columnsVisibility.productName && (
                                  <th>Product Name</th>
                                )}
                                {columnsVisibility.sku && <th>SKU</th>}
                                {columnsVisibility.Category && (
                                  <th>Category</th>
                                )}
                                {columnsVisibility.Brand && <th>Brand</th>}
                                {columnsVisibility.Variation && (
                                  <th>Variation</th>
                                )}
                                {columnsVisibility.Location && (
                                  <th>Location</th>
                                )}
                                {columnsVisibility.UnitPurchasePrice && (
                                  <th>Unit Selling Price</th>
                                )}
                                {columnsVisibility.CurrentStock && (
                                  <th>Current Stock</th>
                                )}
                                {columnsVisibility.variation && (
                                  <th>Variation Name</th>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {filteredProducts
                                .filter((product) => product.productVariations) // Filter out products without variations
                                .flatMap((product) =>
                                  (product.productVariations || []).map(
                                    (variation) => (
                                      <tr key={`${product.id}-${variation.id}`}>
                                        <td>
                                          <Link
                                            className="tw-dw-btn tw-dw-btn-xs tw-dw-btn-outline tw-dw-btn-info tw-w-max"
                                            to={`/ProductStockHistory?productId=${product.id}&variationId=${variation.id}`}
                                          >
                                            <i className="fas fa-history"></i>{" "}
                                            Product stock history
                                          </Link>
                                        </td>
                                        <td>{product.productName}</td>
                                        <td>
                                          {variation.subSku || product.sku}
                                        </td>
                                        <td>
                                          {categoriesMap[product.category] ||
                                            product.category}
                                        </td>
                                        <td>
                                          {brandsMap[product.brand] ||
                                            product.brand}
                                        </td>
                                        <td>
                                          {variation.defaultPurchasePriceExcTax ||
                                            "N/A"}
                                        </td>
                                        <td>
                                          {variation.currentStock !== undefined
                                            ? variation.currentStock
                                            : "N/A"}
                                        </td>
                                        <td>
                                          {variation.variationValue || "N/A"}
                                        </td>
                                      </tr>
                                    )
                                  )
                                )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
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
