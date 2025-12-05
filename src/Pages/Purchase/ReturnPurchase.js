import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../assets/dist/css/adminlte.min.css";
import "../../assets/plugins/fontawesome-free/css/all.min.css";
import "../../assets/plugins/datatables-bs4/css/dataTables.bootstrap4.min.css";
import "../../assets/plugins/datatables-responsive/css/responsive.bootstrap4.min.css";
import "../../assets/plugins/datatables-buttons/css/buttons.bootstrap4.min.css";
import { Dropdown, DropdownButton, Collapse } from "react-bootstrap";
import axios from "axios";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import $ from "jquery";
import { Link, useNavigate } from "react-router-dom";

const ReturnPurchase = () => {
  const [purchases, setPurchases] = useState([]);
  const [filteredPurchases, setFilteredPurchases] = useState([]);
  const [columnsVisibility, setColumnsVisibility] = useState({
    action: true,
    status: true,
    date: true,
    referenceNumber: true,
    location: true,
    vendor: true,
    totalItems: true,
    shippedItems: true,
    additionalNotes: true,
    addedBy: true,
    purchaseReturnId: true,
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
    purchaseReturnId: "",
  });

  // State variables for filters
  const [filterValues, setFilterValues] = useState({
    locations: [],
    statuses: [],
  });

  const [activeFilters, setActiveFilters] = useState({
    startDate: "",
    endDate: "",
    status: "",
    location: "",
  });

  const [filterOpen, setFilterOpen] = useState(false);

  // Status mapping for display
  const statusMap = {
    0: "Returned",
    1: "Accepted",
    2: "Rejected",
    3: "Shipped",
    null: "Pending",
  };

  // Declare the fetchPurchases function outside of useEffect
  const fetchPurchases = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/purchase-return/getall`
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      // console.log(data);

      // Check if the fetched data is an array and sort by purchaseOrderId in descending order
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
  };

  useEffect(() => {
    // Call fetchPurchases inside useEffect
    fetchPurchases();
  }, []);

  // Extract filter values when purchases data changes
  useEffect(() => {
    if (purchases.length > 0) {
      const locations = [
        ...new Set(purchases.map((item) => item.location)),
      ].filter(Boolean);
      const statuses = [...new Set(purchases.map((item) => item.status))];

      setFilterValues({
        locations,
        statuses,
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

      // Location filter
      const locationMatch =
        activeFilters.location === "" ||
        purchase.location === activeFilters.location;

      // Status filter
      const statusMatch =
        activeFilters.status === "" ||
        (activeFilters.status === "null" && purchase.status === null) ||
        (activeFilters.status !== "null" &&
          purchase.status === parseInt(activeFilters.status));

      return dateMatch && locationMatch && statusMatch;
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
      status: "",
      location: "",
    });
  };

  const handleAdd = () => {
    setModalType("add");
  };

  const handleEditClick = (id) => {
    navigate(`/EditPurchaseReturn/${id}`);
  };

  const handleViewClick = (id) => {
    navigate(`/ViewPurchaseReturn/${id}`);
  };

  const handleDeleteClick = (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      fetch(`${process.env.REACT_APP_BASE_URL}/purchaseorder/delete/${id}`, {
        method: "DELETE",
      })
        .then((response) => {
          if (response.status === 204) {
            // Filter out the deleted product from the state
            setPurchases((prevPurchases) =>
              prevPurchases.filter((purchase) => purchase.id !== id)
            );
            alert("Product deleted successfully!");
          } else {
            alert("Failed to delete product.");
          }
        })
        .catch((error) => console.error("Error deleting product:", error));
    }
  };

  const handleCancelClick = async (purchaseId) => {
    alert("Are You Want To Cancel This Purchase??");
    try {
      // Define the API URL with the purchase ID
      const apiUrl = `${process.env.REACT_APP_BASE_URL}/purchase-return/updateStatus/${purchaseId}`;

      // Prepare the request payload
      const payload = {
        status: 2, // Cancel status
      };

      // Make the PUT request
      const response = await axios.put(apiUrl, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Handle successful response
      if (response.status === 200) {
        fetchPurchases();
        alert("Order canceled successfully!");
      } else {
        console.error("Failed to cancel order", response);
      }
    } catch (error) {
      // Handle errors
      console.error("Error while canceling order:", error);
      alert("Failed to cancel the order. Please try again.");
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
      purchaseReturnId: purchase.purchaseReturnId,
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
        purchaseReturnId: purchase.purchaseReturnId,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Purchases");
    XLSX.writeFile(wb, "purchases.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();

    // Define the column headers
    const headers = ["Date", "Reference No", "Location", "Vendor", "Added By"];

    // Map through the purchase data and prepare the body
    const body = filteredPurchases.map((p) => [
      p.orderDate,
      p.referenceNumber,
      p.location,
      p.vendor,
      p.addedBy,
    ]);

    // Add some space before the table
    doc.text("Purchase List", 14, 20);
    doc.setFontSize(12);
    doc.text("Below is the list of purchases with their details:", 14, 30);

    // Generate the PDF table with custom styles
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

    // Save the PDF
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
                ${
                  columnsVisibility.purchaseReturnId
                    ? "<th>Purchase Return Id</th>"
                    : ""
                }
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
                ${columnsVisibility.addedBy ? "<th>Added By</th>" : ""}
              </tr>
            </thead>
            <tbody>
              ${filteredPurchases
                .map(
                  (purchase) => `
                <tr>
                    ${
                      columnsVisibility.purchaseReturnId
                        ? `<td>${purchase.purchaseReturnId}</td>`
                        : ""
                    }
                  ${
                    columnsVisibility.date
                      ? `<td>${purchase.orderDate}</td>`
                      : ""
                  }
                  ${
                    columnsVisibility.referenceNumber
                      ? `<td>${purchase.referenceNumber}</td>`
                      : ""
                  }
                  ${
                    columnsVisibility.location
                      ? `<td>${purchase.location}</td>`
                      : ""
                  }
                  ${
                    columnsVisibility.vendor
                      ? `<td>${purchase.vendor}</td>`
                      : ""
                  }
                  ${
                    columnsVisibility.totalItems
                      ? `<td>${purchase.totalItems}</td>`
                      : ""
                  }
                  ${
                    columnsVisibility.additionalNotes
                      ? `<td>${purchase.additionalNotes}</td>`
                      : ""
                  }
                  ${
                    columnsVisibility.addedBy
                      ? `<td>${purchase.addedBy}</td>`
                      : ""
                  }
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
                <h1 className=" all-heading">List Purchase Return</h1>
                <span className="d-inline d-md-block sub-heading">
                  Manage Purchase Returns
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
                            <option value="null">Pending</option>
                            <option value="0">Returned</option>
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
                <Link to="/AddPurchaseReturn" className="btn btn-add">
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
                        {columnsVisibility.purchaseReturnId && (
                          <th>Purchase Return Id</th>
                        )}
                        {columnsVisibility.status && <th>Status</th>}

                        {columnsVisibility.date && <th>Date</th>}
                        {columnsVisibility.referenceNumber && (
                          <th>Reference No</th>
                        )}
                        {columnsVisibility.location && <th>Location</th>}
                        {columnsVisibility.vendor && <th>vendor</th>}
                        {columnsVisibility.totalItems && <th>Return Items</th>}
                        {columnsVisibility.shippedItems && (
                          <th>Accepted Return Items</th>
                        )}

                        {columnsVisibility.additionalNotes && (
                          <th>Additional Notes</th>
                        )}

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
                                {/* Check purchase status */}
                                {purchase.status === 0 ? (
                                  <>
                                    <Dropdown.Item
                                      as="button"
                                      onClick={() =>
                                        handleViewClick(purchase.id)
                                      }
                                    >
                                      <div className="d-inline-block w-100 btn-view justify-content-center text-secondary">
                                        <i className="dropdown_hover fa fa-eye me-3"></i>
                                        <span>View</span>
                                      </div>
                                    </Dropdown.Item>

                                    <Dropdown.Item
                                      as="button"
                                      onClick={() =>
                                        handleEditClick(purchase.id)
                                      }
                                    >
                                      <div className="d-inline-block w-100 btn-edit justify-content-center text-secondary">
                                        <i className="dropdown_hover fa-solid fa-pen-to-square me-3"></i>
                                        <span>Edit</span>
                                      </div>
                                    </Dropdown.Item>

                                    <Dropdown.Item
                                      as="button"
                                      onClick={() =>
                                        handleDeleteClick(purchase.id)
                                      }
                                    >
                                      <div className="d-inline-block w-100 btn-delete justify-content-center text-secondary">
                                        <i className="fa fa-trash me-3"></i>
                                        <span>Delete</span>
                                      </div>
                                    </Dropdown.Item>

                                    <Dropdown.Item
                                      as="button"
                                      onClick={() =>
                                        handleCancelClick(purchase.id)
                                      }
                                    >
                                      <div className="d-inline-block w-100 btn-delete justify-content-center text-secondary">
                                        <i className=" fa-solid fa-x me-3"></i>
                                        <span>Cancel</span>
                                      </div>
                                    </Dropdown.Item>
                                  </>
                                ) : (
                                  // If status is not 0, show only the View action
                                  <Dropdown.Item
                                    as="button"
                                    onClick={() => handleViewClick(purchase.id)}
                                  >
                                    <div className="d-inline-block w-100 btn-view justify-content-center text-secondary">
                                      <i className="dropdown_hover fa fa-eye me-3"></i>
                                      <span>View</span>
                                    </div>
                                  </Dropdown.Item>
                                )}
                              </DropdownButton>
                            </td>
                          )}
                          {columnsVisibility.purchaseReturnId && (
                            <td>{purchase.purchaseReturnId}</td>
                          )}
                          {columnsVisibility.status && (
                            <td>
                              {purchase.status === 0
                                ? "Returned"
                                : purchase.status === 1
                                ? "Accepted"
                                : purchase.status === 2
                                ? "Rejected"
                                : purchase.status === 3
                                ? "Shipped"
                                : purchase.status === null
                                ? "Pending"
                                : "Unknown"}
                            </td>
                          )}
                          {columnsVisibility.date && (
                            <td>{purchase.orderDate}</td>
                          )}
                          {columnsVisibility.referenceNumber && (
                            <td>{purchase.referenceNumber}</td>
                          )}
                          {columnsVisibility.location && (
                            <td>{purchase.location}</td>
                          )}
                          {columnsVisibility.vendor && (
                            <td>{purchase.vendor}</td>
                          )}
                          {columnsVisibility.totalItems && (
                            <td>{purchase.totalItems}</td>
                          )}
                          {columnsVisibility.shippedItems && (
                            <td>{purchase.totalShippedItems}</td>
                          )}
                          {columnsVisibility.additionalNotes && (
                            <td>{purchase.additionalNotes}</td>
                          )}
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

export default ReturnPurchase;
