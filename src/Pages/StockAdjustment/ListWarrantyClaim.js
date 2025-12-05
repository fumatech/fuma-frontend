import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../assets/dist/css/adminlte.min.css";
import "../../assets/plugins/fontawesome-free/css/all.min.css";
import "../../assets/plugins/datatables-bs4/css/dataTables.bootstrap4.min.css";
import "../../assets/plugins/datatables-responsive/css/responsive.bootstrap4.min.css";
import "../../assets/plugins/datatables-buttons/css/buttons.bootstrap4.min.css";
import { Collapse } from "react-bootstrap";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import $ from "jquery";

const ListWarrantyClaim = () => {
  const navigate = useNavigate();

  const [ListStockAdjustment, setListStockAdjustment] = useState([]);
  const [columnsVisibility, setColumnsVisibility] = useState({
    action: true,
    date: true,
    referenceNo: true,
    location: true,
    status: true,
    totalAmount: true,
    reason: true,
    totalUnits: true,
  });
  const [modalType, setModalType] = useState(null);
  const [currentlistStockAdjustment, setCurrentlistStockAdjustment] =
    useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [formData, setFormData] = useState({
    date: "",
    referenceNo: "",
    location: "",
    status: "",
    totalAmount: "",
    reason: "",
    totalUnits: "",
  });

  // Filter states
  const [filterValues, setFilterValues] = useState({
    locations: [],
    statuses: [],
  });
  
  const [activeFilters, setActiveFilters] = useState({
    startDate: "",
    endDate: "",
    location: "",
    status: "",
  });
  
  const [filteredWarrantyClaims, setFilteredWarrantyClaims] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);

  const fetchListStockAdjustment = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/warranty-claim/getall`
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        const sortedData = data.sort((a, b) => b.id - a.id);
        setListStockAdjustment(sortedData);
        setFilteredWarrantyClaims(sortedData);
      } else {
        console.error("Fetched data is not an array");
        setListStockAdjustment([]);
        setFilteredWarrantyClaims([]);
      }
    } catch (error) {
      console.error("Error fetching ListStockAdjustment:", error);
      setListStockAdjustment([]);
      setFilteredWarrantyClaims([]);
    }

    const script = document.createElement("script");
    script.src = "js/JqueryContent.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  };

  useEffect(() => {
    fetchListStockAdjustment();
  }, []);

  // Extract filter values when ListStockAdjustment data changes
  useEffect(() => {
    if (ListStockAdjustment.length > 0) {
      const locations = [...new Set(ListStockAdjustment.map(item => item.businessLocation))].filter(Boolean);
      const statuses = [...new Set(ListStockAdjustment.map(item => item.status))].filter(Boolean);
      
      setFilterValues({
        locations,
        statuses,
      });
    }
  }, [ListStockAdjustment]);

  // Apply filters whenever activeFilters or ListStockAdjustment changes
  useEffect(() => {
    const filteredData = ListStockAdjustment.filter((claim) => {
      const claimDate = new Date(claim.date);
      
      // Date range filter
      let dateMatch = true;
      if (activeFilters.startDate && activeFilters.endDate) {
        const startDate = new Date(activeFilters.startDate);
        const endDate = new Date(activeFilters.endDate);
        endDate.setHours(23, 59, 59, 999);
        
        dateMatch = claimDate >= startDate && claimDate <= endDate;
      } else if (activeFilters.startDate) {
        const startDate = new Date(activeFilters.startDate);
        dateMatch = claimDate >= startDate;
      } else if (activeFilters.endDate) {
        const endDate = new Date(activeFilters.endDate);
        endDate.setHours(23, 59, 59, 999);
        dateMatch = claimDate <= endDate;
      }
      
      // Location filter
      const locationMatch = activeFilters.location === "" || 
        claim.businessLocation === activeFilters.location;
      
      // Status filter
      const statusMatch = activeFilters.status === "" || 
        claim.status.toString() === activeFilters.status;
      
      return dateMatch && locationMatch && statusMatch;
    });
    
    setFilteredWarrantyClaims(filteredData);
  }, [activeFilters, ListStockAdjustment]);

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
      location: "",
      status: "",
    });
  };

  const exportCSV = () => {
    const csvData = filteredWarrantyClaims.map((listStockAdjustment) => ({
      Date: listStockAdjustment.date,
      ReferenceNo: listStockAdjustment.referenceNumber,
      Location: listStockAdjustment.businessLocation,
      Status: listStockAdjustment.status === 0 ? "Pending" : 
               listStockAdjustment.status === 1 ? "Accepted" : 
               listStockAdjustment.status === 2 ? "Rejected" : 
               listStockAdjustment.status === 3 ? "Shipped" : "Unknown",
      TotalAmount: listStockAdjustment.totalAmount,
      Reason: listStockAdjustment.reason,
      TotalUnits: listStockAdjustment.totalUnits,
    }));

    const csv = [
      [
        "Date",
        "Reference No",
        "Location",
        "Status",
        "Total Amount",
        "Reason",
        "Total Units",
      ],
      ...csvData.map((row) => Object.values(row)),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, "WarrantyClaims.csv");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredWarrantyClaims.map((listStockAdjustment) => ({
        Date: listStockAdjustment.date,
        ReferenceNo: listStockAdjustment.referenceNumber,
        Location: listStockAdjustment.businessLocation,
        Status: listStockAdjustment.status === 0 ? "Pending" : 
                listStockAdjustment.status === 1 ? "Accepted" : 
                listStockAdjustment.status === 2 ? "Rejected" : 
                listStockAdjustment.status === 3 ? "Shipped" : "Unknown",
        TotalAmount: listStockAdjustment.totalAmount,
        Reason: listStockAdjustment.reason,
        TotalUnits: listStockAdjustment.totalUnits,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "WarrantyClaims");
    XLSX.writeFile(wb, "WarrantyClaims.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();

    const headers = [
      "Date",
      "Reference No",
      "Location",
      "Status",
      "Total Amount",
      "Reason",
      "Total Units",
    ];

    const body = filteredWarrantyClaims.slice(startIndex, endIndex).map(
      (adjustment) => [
        adjustment.date,
        adjustment.referenceNumber,
        adjustment.businessLocation,
        adjustment.status === 0 ? "Pending" : 
        adjustment.status === 1 ? "Accepted" : 
        adjustment.status === 2 ? "Rejected" : 
        adjustment.status === 3 ? "Shipped" : "Unknown",
        adjustment.totalAmount,
        adjustment.reason,
        adjustment.totalUnits,
      ]
    );

    doc.text("Warranty Claims List", 14, 20);
    doc.setFontSize(12);
    doc.text(
      "Below is the list of warranty claims with their details:",
      14,
      30
    );

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

    doc.save("WarrantyClaimsList.pdf");
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
          <title>Print Warranty Claims</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; }
            th { background-color: #f2f2f2; }
            th, td { text-align: left; }
          </style>
        </head>
        <body>
          <h2>Warranty Claims Report</h2>
          <table>
            <thead>
              <tr>
                ${columnsVisibility.date ? "<th>Date</th>" : ""}
                ${columnsVisibility.referenceNo ? "<th>Reference No</th>" : ""}
                ${columnsVisibility.location ? "<th>Location</th>" : ""}
                ${columnsVisibility.status ? "<th>Status</th>" : ""}
                ${columnsVisibility.totalAmount ? "<th>Total Amount</th>" : ""}
                ${columnsVisibility.reason ? "<th>Reason</th>" : ""}
                ${columnsVisibility.totalUnits ? "<th>Total Units</th>" : ""}
              </tr>
            </thead>
            <tbody>
              ${filteredWarrantyClaims.slice(startIndex, endIndex)
                .map(
                  (listStockAdjustment) => `
                    <tr>
                      ${
                        columnsVisibility.date
                          ? `<td>${listStockAdjustment.date}</td>`
                          : ""
                      }
                      ${
                        columnsVisibility.referenceNo
                          ? `<td>${listStockAdjustment.referenceNumber}</td>`
                          : ""
                      }
                      ${
                        columnsVisibility.location
                          ? `<td>${listStockAdjustment.businessLocation}</td>`
                          : ""
                      }
                      ${
                        columnsVisibility.status
                          ? `<td>${
                              listStockAdjustment.status === 0 ? "Pending" : 
                              listStockAdjustment.status === 1 ? "Accepted" : 
                              listStockAdjustment.status === 2 ? "Rejected" : 
                              listStockAdjustment.status === 3 ? "Shipped" : "Unknown"
                            }</td>`
                          : ""
                      }
                      ${
                        columnsVisibility.totalAmount
                          ? `<td>${listStockAdjustment.totalAmount}</td>`
                          : ""
                      }
                      ${
                        columnsVisibility.reason
                          ? `<td>${listStockAdjustment.reason}</td>`
                          : ""
                      }
                      ${
                        columnsVisibility.totalUnits
                          ? `<td>${listStockAdjustment.totalUnits}</td>`
                          : ""
                      }
                    </tr>`
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

  const handleEdit = (id) => {
    const listStockAdjustmentToEdit = ListStockAdjustment.find(
      (listStockAdjustment) => listStockAdjustment.id === id
    );
    if (listStockAdjustmentToEdit) {
      setCurrentlistStockAdjustment(listStockAdjustmentToEdit);
      setFormData({
        date: listStockAdjustmentToEdit.date,
        referenceNo: listStockAdjustmentToEdit.referenceNumber,
        location: listStockAdjustmentToEdit.businessLocation,
        status: listStockAdjustmentToEdit.status,
        totalAmount: listStockAdjustmentToEdit.totalAmount,
        reason: listStockAdjustmentToEdit.reason,
        totalUnits: listStockAdjustmentToEdit.totalUnits,
      });
      setModalType("edit");
    }
  };

  const handleViewClick = (id) => {
    navigate(`/ViewWarrantyClaim/${id}`);
  };

  function handleActionChange(event, id) {
    const selectedAction = event.target.value;

    let status = 0;
    let actionMessage = "";

    if (selectedAction === "accept") {
      status = 1;
      actionMessage = "Accept";
    } else if (selectedAction === "reject") {
      status = 2;
      actionMessage = "Reject";
    } else if (selectedAction === "shipped") {
      const confirmAction = window.confirm(
        `Are you sure you want to ship this warranty claim?`
      );

      if (confirmAction) {
        navigate(`/ShipWarrantyClaim/${id}`);
      } else {
        event.target.value = "";
      }
      return;
    }

    if (status !== 0) {
      const confirmAction = window.confirm(
        `Are you sure you want to ${actionMessage} this warranty claim?`
      );

      if (confirmAction) {
        fetch(
          `${process.env.REACT_APP_BASE_URL}/warranty-claim/updateStatus/${id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(status),
          }
        )
          .then((response) => response.json())
          .then((data) => {
            console.log(`${actionMessage}ed warranty claim:`, data);
            alert(`${actionMessage}ed successfully!`);
            fetchListStockAdjustment();
          })
          .catch((error) => {
            console.error("Error updating warranty claim:", error);
          });
      } else {
        event.target.value = "";
      }
    }
  }

  function getStatusValue(status) {
    if (status === 0) {
      return "pending";
    } else if (status === 1) {
      return "accept";
    } else if (status === 2) {
      return "reject";
    } else if (status === 3) {
      return "shipped";
    } else {
      return "";
    }
  }

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-12 col-md-6">
                <h1 className="all-heading">List Warranty Claim</h1>
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
                      <div className="col-md-3">
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
                      <div className="col-md-3">
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

                      {/* Location Dropdown */}
                      <div className="col-md-3">
                        <div className="form-group">
                          <label className="me-2">Location:</label>
                          <select
                            className="form-select"
                            name="location"
                            value={activeFilters.location}
                            onChange={handleFilterChange}
                          >
                            <option value="">All Locations</option>
                            {filterValues.locations.map((location, index) => (
                              <option key={`loc-${index}`} value={location}>
                                {location}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Status Dropdown */}
                      <div className="col-md-3">
                        <div className="form-group">
                          <label className="me-2">Status:</label>
                          <select
                            className="form-select"
                            name="status"
                            value={activeFilters.status}
                            onChange={handleFilterChange}
                          >
                            <option value="">All Statuses</option>
                            <option value="0">Pending</option>
                            <option value="1">Accepted</option>
                            <option value="2">Rejected</option>
                            <option value="3">Shipped</option>
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
                <Link to="/AddStockAdjustment" className="btn btn-add">
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
                    className="table table-bordered table-hover shadow"
                  >
                    <thead>
                      <tr>
                        {columnsVisibility.action && <th>Action</th>}
                        {columnsVisibility.action && <th>View</th>}
                        {columnsVisibility.status && <th>Status</th>}
                        {columnsVisibility.date && <th>Date</th>}
                        {columnsVisibility.referenceNo && <th>Reference No</th>}
                        {columnsVisibility.location && <th>Location</th>}
                        {columnsVisibility.totalAmount && <th>Total Amount</th>}
                        {columnsVisibility.reason && <th>Reason</th>}
                        {columnsVisibility.totalUnits && <th>Total Units</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredWarrantyClaims.slice(startIndex, endIndex).map(
                        (listStockAdjustment) => (
                          <tr key={listStockAdjustment.id}>
                            {columnsVisibility.action && (
                              <td>
                                <select
                                  className="form-control form-control-sm"
                                  onChange={(event) =>
                                    handleActionChange(
                                      event,
                                      listStockAdjustment.id
                                    )
                                  }
                                  value={getStatusValue(
                                    listStockAdjustment.status
                                  )}
                                  disabled={listStockAdjustment.status === 3}
                                >
                                  {listStockAdjustment.status === 0 && (
                                    <>
                                      <option value="pending" disabled selected>
                                        Pending
                                      </option>
                                      <option value="accept">Accept</option>
                                      <option value="reject">Reject</option>
                                    </>
                                  )}

                                  {listStockAdjustment.status === 1 && (
                                    <>
                                      <option value="accept" disabled selected>
                                        Accepted
                                      </option>
                                      <option value="shipped">
                                        Ship Order
                                      </option>
                                    </>
                                  )}

                                  {listStockAdjustment.status === 2 && (
                                    <>
                                      <option value="reject" disabled selected>
                                        Rejected
                                      </option>
                                      <option value="accept">Accept</option>
                                    </>
                                  )}

                                  {listStockAdjustment.status === 3 && (
                                    <option value="shipped" disabled selected>
                                      Shipped
                                    </option>
                                  )}
                                </select>
                              </td>
                            )}

                            {columnsVisibility.action &&
                              listStockAdjustment.status !== 4 && (
                                <td>
                                  <button
                                    className="btn btn-sm btn-primary"
                                    onClick={() =>
                                      handleViewClick(listStockAdjustment.id)
                                    }
                                  >
                                    View
                                  </button>
                                </td>
                              )}

                            {columnsVisibility.status && (
                              <td>
                                {listStockAdjustment.status === 0
                                  ? "Pending"
                                  : listStockAdjustment.status === 1
                                  ? "Accepted"
                                  : listStockAdjustment.status === 2
                                  ? "Rejected"
                                  : listStockAdjustment.status === 3
                                  ? "Shipped"
                                  : "Unknown"}
                              </td>
                            )}

                            {columnsVisibility.date && (
                              <td>{listStockAdjustment.date}</td>
                            )}
                            {columnsVisibility.referenceNo && (
                              <td>{listStockAdjustment.referenceNumber}</td>
                            )}
                            {columnsVisibility.location && (
                              <td>{listStockAdjustment.businessLocation}</td>
                            )}
                            {columnsVisibility.totalAmount && (
                              <td>{listStockAdjustment.totalAmount}</td>
                            )}
                            {columnsVisibility.reason && (
                              <td>{listStockAdjustment.reason}</td>
                            )}
                            {columnsVisibility.totalUnits && (
                              <td>{listStockAdjustment.totalUnits}</td>
                            )}
                          </tr>
                        )
                      )}
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

export default ListWarrantyClaim;