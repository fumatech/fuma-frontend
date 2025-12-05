import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../assets/dist/css/adminlte.min.css";
import "../../assets/plugins/fontawesome-free/css/all.min.css";
import "../../assets/plugins/datatables-bs4/css/dataTables.bootstrap4.min.css";
import "../../assets/plugins/datatables-responsive/css/responsive.bootstrap4.min.css";
import "../../assets/plugins/datatables-buttons/css/buttons.bootstrap4.min.css";
import { Dropdown, DropdownButton, Collapse } from "react-bootstrap";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import $ from "jquery";
import { Link, useNavigate } from "react-router-dom";

const ListDIPurchaseOrder = () => {
  const [purchases, setPurchases] = useState([]);
  const [filteredPurchases, setFilteredPurchases] = useState([]);
  const [columnsVisibility, setColumnsVisibility] = useState({
    action: true,
    status: true,
    purchaseDIOrderId: true,
    date: true,
    referenceNumber: true,
    location: true,
    vendor: true,
    totalItems: true,
    additionalNotes: true,
    addedBy: true,
  });
  const navigate = useNavigate();

  const [modalType, setModalType] = useState(null);
  const [currentPurchase, setCurrentPurchase] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [formData, setFormData] = useState({
    date: "",
    referenceNumber: "",
    location: "",
    vendor: "",
    totalItems: "",
    additionalNotes: "",
    addedBy: "",
  });

  // State variables for filters
  const [filterValues, setFilterValues] = useState({
    vendors: [],
  });
  
  const [activeFilters, setActiveFilters] = useState({
    startDate: "",
    endDate: "",
    vendor: "",
  });
  
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/purchase-di-order/getall`
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        console.log(data);

        if (Array.isArray(data)) {
          const sortedData = data.sort((a, b) => b.id - a.id);
          setPurchases(sortedData);
          setFilteredPurchases(sortedData);
        } else {
          console.error("Fetched data is not an array");
          setPurchases([]);
          setFilteredPurchases([]);
        }
      } catch (error) {
        console.error("Error fetching purchases:", error);
        setPurchases([]);
        setFilteredPurchases([]);
      }
      
      const script = document.createElement("script");
      script.src = "js/JqueryContent.js";
      script.async = true;
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    };

    fetchPurchases();
  }, []);

  // Extract filter values when purchases data changes
  useEffect(() => {
    if (purchases.length > 0) {
      const vendors = [...new Set(purchases.map(item => item.vendor))].filter(Boolean);
      
      setFilterValues({
        vendors,
      });
    }
  }, [purchases]);

  // Apply filters whenever activeFilters or purchases changes
  useEffect(() => {
    const filteredData = purchases.filter((purchase) => {
      const purchaseDate = new Date(purchase.orderDate);
      
      // Date range filter
      let dateMatch = true;
      if (activeFilters.startDate && activeFilters.endDate) {
        const startDate = new Date(activeFilters.startDate);
        const endDate = new Date(activeFilters.endDate);
        endDate.setHours(23, 59, 59, 999);
        
        dateMatch = purchaseDate >= startDate && purchaseDate <= endDate;
      } else if (activeFilters.startDate) {
        const startDate = new Date(activeFilters.startDate);
        dateMatch = purchaseDate >= startDate;
      } else if (activeFilters.endDate) {
        const endDate = new Date(activeFilters.endDate);
        endDate.setHours(23, 59, 59, 999);
        dateMatch = purchaseDate <= endDate;
      }
      
      // Vendor filter
      const vendorMatch = activeFilters.vendor === "" || purchase.vendor === activeFilters.vendor;
      
      return dateMatch && vendorMatch;
    });
    
    setFilteredPurchases(filteredData);
  }, [activeFilters, purchases]);

  // Filter change handler
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setActiveFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setCurrentPage(1);
  };

  // Reset filters function
  const resetFilters = () => {
    setActiveFilters({
      startDate: "",
      endDate: "",
      vendor: "",
    });
  };

  const handleAdd = () => {
    setModalType("add");
  };

  const handleEditClick = (id) => {
    navigate(`/EditDIPurchase/${id}`);
  };

  const handleViewClick = (id) => {
    navigate(`/ViewDIPurchase/${id}`);
  };

  const handleDeleteClick = (id) => {
    if (window.confirm("Are you sure you want to delete this Purchase?")) {
      fetch(
        `${process.env.REACT_APP_BASE_URL}/purchase-di-order/delete/${id}`,
        {
          method: "DELETE",
        }
      )
        .then((response) => {
          if (response.status === 204) {
            setPurchases((prevPurchases) =>
              prevPurchases.filter((purchase) => purchase.id !== id)
            );
            alert("Purchase deleted successfully!");
          } else {
            alert("Failed to delete Purchase.");
          }
        })
        .catch((error) => console.error("Error deleting Purchase:", error));
    }
  };

  const exportCSV = () => {
    const csvData = filteredPurchases.map((purchase) => ({
      Date: purchase.date,
      ReferenceNumreferenceNumber: purchase.referenceNumber,
      Location: purchase.location,
      vendor: purchase.vendor,
      totalItems: purchase.totalItems,
      additionalNotes: purchase.additionalNotes,
      AddedBy: purchase.addedBy,
    }));

    const csv = [
      ["Date", "Reference No", "Location", "vendor", "Added By"],
      ...csvData.map((row) => Object.values(row)),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, "purchases.csv");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredPurchases.map((purchase) => ({
        Date: purchase.date,
        ReferenceNumreferenceNumber: purchase.referenceNumber,
        Location: purchase.location,
        vendor: purchase.vendor,
        totalItems: purchase.totalItems,
        additionalNotes: purchase.additionalNotes,
        AddedBy: purchase.addedBy,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Purchases");
    XLSX.writeFile(wb, "purchases.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();

    const headers = ["Date", "Reference No", "Location", "Vendor", "Added By"];

    const body = filteredPurchases.map((p) => [
      p.purchaseDate,
      p.referenceNumber,
      p.location,
      p.vendor,
      p.addedBy,
    ]);

    doc.text("Purchase List", 14, 20);
    doc.setFontSize(12);
    doc.text("Below is the list of purchases with their details:", 14, 30);

    doc.autoTable({
      head: [headers],
      body: body,
      theme: "grid",
      styles: {
        fontSize: 10,
        cellPadding: 3,
        valign: "middle",
        halign: "center",
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [22, 160, 133],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240],
      },
      margin: { top: 50 },
    });

    doc.save("PurchaseList.pdf");
  };

  const toggleColumn = (column) => {
    setColumnsVisibility((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  const printData = () => {
    const printWindow = window.open("", "_blank", "width=800,height=600");

    const tableContent = `
      <html>
        <head>
          <title>Print Purchases</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; }
            th { background-color: #f2f2f2; }
            th, td { text-align: left; }
          </style>
        </head>
        <body>
          <h2>Purchase Report</h2>
          <table>
            <thead>
              <tr>
                ${columnsVisibility.date ? "<th> Date</th>" : ""}
                ${
                  columnsVisibility.referenceNumber
                    ? "<th>Reference No</th>"
                    : ""
                }
                ${columnsVisibility.location ? "<th>Location</th>" : ""}
                ${columnsVisibility.vendor ? "<th>Vendor</th>" : ""}
                ${columnsVisibility.totalItems ? "<th>Total Items</th>" : ""}
                ${
                  columnsVisibility.additionalNotes
                    ? "<th>Additional Notes</th>"
                    : ""
                }
                ${
                  columnsVisibility.addedBy
                    ? "<th>Added By</th>"
                    : ""
                }
              </tr>
            </thead>
        <tbody>
  ${filteredPurchases
    .map(
      (purchase) => `
        <tr>
          ${columnsVisibility.date ? `<td>${purchase.orderDate}</td>` : ""}
          ${columnsVisibility.referenceNumber ? `<td>${purchase.referenceNumber}</td>` : ""}
          ${columnsVisibility.location ? `<td>${purchase.location}</td>` : ""}
          ${columnsVisibility.vendor ? `<td>${purchase.vendor}</td>` : ""}
          ${columnsVisibility.totalItems ? `<td>${purchase.totalItems}</td>` : ""}
          ${columnsVisibility.additionalNotes ? `<td>${purchase.additionalNotes}</td>` : ""}
          ${columnsVisibility.addedBy ? `<td>${purchase.addedBy}</td>` : ""}
        </tr>
      `
    )
    .join("")}
</tbody>

          </table>
        </body>
      </html>
    `;

    printWindow.document.write(tableContent);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  const handleFormChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleEntriesChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const purchase = filteredPurchases.slice(startIndex, endIndex);

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-12 col-md-6">
                <h1 className=" all-heading">List DI Purchases Entry</h1>
                <span className="d-inline d-md-block sub-heading">
                  Manage DI Purchases Entries
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="content">
          <div className="container-fluid">
            {/* Filter Card */}
            <div className="card card-default rounded-4 border-0 cardHover mb-3">
              <div
                className="my- p-3 d-flex align-items-center"
                style={{
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
                onClick={() => setFilterOpen(!filterOpen)}
              >
                <i className={`fa fa-filter me-3`}></i>
                <span>Filter</span>
              </div>

              <Collapse in={filterOpen}>
                <div className="border-top">
                  <div className="card-body">
                    <div className="row py-2 g-2">
                      {/* Start Date Picker */}
                      <div className="col-md-4">
                        <div className="form-group">
                          <label className="me-2">Start Date:</label>
                          <input
                            type="date"
                            className="form-control"
                            name="startDate"
                            value={activeFilters.startDate}
                            onChange={handleFilterChange}
                          />
                        </div>
                      </div>

                      {/* End Date Picker */}
                      <div className="col-md-4">
                        <div className="form-group">
                          <label className="me-2">End Date:</label>
                          <input
                            type="date"
                            className="form-control"
                            name="endDate"
                            value={activeFilters.endDate}
                            onChange={handleFilterChange}
                          />
                        </div>
                      </div>

                      {/* Vendor Dropdown */}
                      <div className="col-md-4">
                        <div className="form-group">
                          <label className="me-2">Vendor:</label>
                          <select
                            className="form-select"
                            name="vendor"
                            value={activeFilters.vendor}
                            onChange={handleFilterChange}
                          >
                            <option value="">All Vendors</option>
                            {filterValues.vendors.map((vendor, index) => (
                              <option key={`vendor-${index}`} value={vendor}>
                                {vendor}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Reset Button */}
                      <div className="col-md-12 d-flex align-items-end">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={resetFilters}
                          disabled={!Object.values(activeFilters).some(Boolean)}
                        >
                          <i className="fa fa-times me-1"></i> Reset All Filters
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Collapse>
            </div>

            <div className="card cardHover rounded-4 border-0">
              <div className="d-flex justify-content-end mb-3">
                <Link to="/AddDIPurchaseOrder" className="btn btn-add">
                  <i className="fas fa-plus"></i> Add
                </Link>
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
                        <i className="fa fa-columns"></i> Column Visibility
                      </button>
                      <div
                        className="dropdown-menu pointer-event"
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
                            {col.replace(/([A-Z])/g, " $1").toUpperCase()}
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
                  >
                    <thead>
                      <tr>
                        {columnsVisibility.action && <th>Action</th>}
                        {columnsVisibility.referenceNumber && (
                          <th>Invoice/Reference No</th>
                        )}
                        {columnsVisibility.date && <th>Purchase Date</th>}
                        {columnsVisibility.vendor && <th>vendor</th>}
                        {columnsVisibility.totalItems && (
                          <th> Total Purchased Items</th>
                        )}
                        {columnsVisibility.additionalNotes && <th>Notes</th>}
                        {columnsVisibility.status && <th>View Invoice</th>}
                        {columnsVisibility.addedBy && <th>Added By</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {purchase.map((purchase) => (
                        <tr key={purchase.id}>
                          {columnsVisibility.action && (
                            <td>
                              <DropdownButton
                                id="dropdown-basic-button"
                                title="Actions"
                                variant="outline-success rounded-5 fs-6 fw-light border-1"
                                className="custom-outline-dropdown p-2"
                              >
                                <Dropdown.Item
                                  as="button"
                                  onClick={() => handleViewClick(purchase.id)}
                                >
                                  <div className="d-inline-block w-75 btn-view justify-content-center text-secondary">
                                    <i className="dropdown_hover fa fa-eye me-3"></i>
                                    <span>View</span>
                                  </div>
                                </Dropdown.Item>

                                <Dropdown.Item
                                  as="button"
                                  onClick={() => handleEditClick(purchase.id)}
                                >
                                  <div className="d-inline-block w-75 btn-edit justify-content-center text-secondary">
                                    <i className="dropdown_hover fa-solid fa-pen-to-square me-3"></i>
                                    <span>Edit</span>
                                  </div>
                                </Dropdown.Item>

                                <Dropdown.Item
                                  as="button"
                                  onClick={() => handleDeleteClick(purchase.id)}
                                >
                                  <div className="d-inline-block w-75 btn-delete justify-content-center text-secondary">
                                    <i className=" fa fa-trash me-3"></i>
                                    <span>Delete</span>
                                  </div>
                                </Dropdown.Item>
                              </DropdownButton>
                            </td>
                          )}
                          {columnsVisibility.referenceNumber && (
                            <td>{purchase.referenceNumber}</td>
                          )}
                          {columnsVisibility.date && (
                            <td>{purchase.orderDate}</td>
                          )}

                          {columnsVisibility.vendor && (
                            <td>{purchase.vendor}</td>
                          )}
                          {columnsVisibility.totalItems && (
                            <td>{purchase.totalItems}</td>
                          )}
                          {columnsVisibility.additionalNotes && (
                            <td>{purchase.additionalNotes}</td>
                          )}

                          {columnsVisibility.status && <td>{}</td>}
                          {columnsVisibility.addedBy && (
                            <td>{purchase.addedBy}</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ListDIPurchaseOrder;