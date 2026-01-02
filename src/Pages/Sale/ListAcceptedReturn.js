import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../assets/dist/css/adminlte.min.css";
import "../../assets/plugins/fontawesome-free/css/all.min.css";
import "../../assets/plugins/datatables-bs4/css/dataTables.bootstrap4.min.css";
import "../../assets/plugins/datatables-responsive/css/responsive.bootstrap4.min.css";
import "../../assets/plugins/datatables-buttons/css/buttons.bootstrap4.min.css";
import { Collapse } from "react-bootstrap";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import $ from "jquery";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const ListAcceptedReturn = () => {
  const [viewOrders, setViewOrders] = useState([]);
  const [userEmail, setUserEmail] = useState(null);
  const navigate = useNavigate();
  const [columnsVisibility, setColumnsVisibility] = useState({
    vendorAction: true,
    action: true,
    orderDate: true,
    orderId: true,
    referenceNumber: true,
    location: true,
    customer: true,
    totalItems: true,
    totalShippedItems: true,
    additionalNotes: true,
    orderedBy: true,
  });
  const [modalType, setModalType] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [formData, setFormData] = useState({
    orderId: "",
    orderDate: "",
    customerName: "",
    totalQuantityOrdered: "",
    customerAddress: "",
    contactInformation: "",
    custom1: "",
  });

  // Filter states
  const [filterValues, setFilterValues] = useState({
    locations: [],
    addedBy: [],
  });

  const [activeFilters, setActiveFilters] = useState({
    startDate: "",
    endDate: "",
    location: "",
    addedBy: "",
  });

  const [filteredViewOrders, setFilteredViewOrders] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    const email = sessionStorage.getItem("userEmail");
    if (email) {
      setUserEmail(email);
    }
    fetchAcceptedOrders();
  }, []);

  const fetchAcceptedOrders = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/franchise-purchase-return/getAcceptedReturns`
      );
      if (!response.ok) throw new Error("Network response was not ok");

      const data = await response.json();
      if (Array.isArray(data)) {
        setViewOrders(data);
        setFilteredViewOrders(data);
      } else {
        console.error("Fetched data is not an array");
        setViewOrders([]);
        setFilteredViewOrders([]);
      }
    } catch (error) {
      console.error("Error fetching accepted orders:", error);
      setViewOrders([]);
      setFilteredViewOrders([]);
    }

    const script = document.createElement("script");
    script.src = "js/JqueryContent.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  };

  // Extract filter values when viewOrders data changes
  useEffect(() => {
    if (viewOrders.length > 0) {
      const locations = [
        ...new Set(viewOrders.map((item) => item.location)),
      ].filter(Boolean);
      const addedBy = [
        ...new Set(viewOrders.map((item) => item.addedBy)),
      ].filter(Boolean);

      setFilterValues({
        locations,
        addedBy,
      });
    }
  }, [viewOrders]);

  // Apply filters whenever activeFilters or viewOrders changes
  useEffect(() => {
    const filteredData = viewOrders.filter((order) => {
      const orderDate = new Date(order.orderDate);

      // Date range filter
      let dateMatch = true;
      if (activeFilters.startDate && activeFilters.endDate) {
        const startDate = new Date(activeFilters.startDate);
        const endDate = new Date(activeFilters.endDate);
        endDate.setHours(23, 59, 59, 999);

        dateMatch = orderDate >= startDate && orderDate <= endDate;
      } else if (activeFilters.startDate) {
        const startDate = new Date(activeFilters.startDate);
        dateMatch = orderDate >= startDate;
      } else if (activeFilters.endDate) {
        const endDate = new Date(activeFilters.endDate);
        endDate.setHours(23, 59, 59, 999);
        dateMatch = orderDate <= endDate;
      }

      // Location filter
      const locationMatch =
        activeFilters.location === "" ||
        order.location === activeFilters.location;

      // Added By filter
      const addedByMatch =
        activeFilters.addedBy === "" || order.addedBy === activeFilters.addedBy;

      return dateMatch && locationMatch && addedByMatch;
    });

    setFilteredViewOrders(filteredData);
  }, [activeFilters, viewOrders]);

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
      addedBy: "",
    });
  };

  const exportCSV = () => {
    const csvData = filteredViewOrders.map((order) => ({
      "Vendor Action": order.vendorAction,
      Action: order.action,
      "Order ID": order.orderId,
      "Reference Number": order.referenceNumber,
      Location: order.location,
      Customer: order.customerName,
      "Total Items": order.totalItems,
      "Total ShippedItems": order.totalShippedItems,
      "Additional Notes": order.additionalNotes,
      "Ordered By": order.orderedBy,
    }));

    const csv = [
      [
        "Vendor Action",
        "Action",
        "Order ID",
        "Reference Number",
        "Location",
        "Customer",
        "Total Items",
        "Additional Notes",
        "Ordered By",
      ],
      ...csvData.map((row) => Object.values(row)),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, "orders.csv");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredViewOrders.map((order) => ({
        "Vendor Action": order.vendorAction,
        Action: order.action,
        "Order ID": order.orderId,
        "Reference Number": order.referenceNumber,
        Location: order.location,
        Customer: order.customerName,
        "Total Items": order.totalItems,
        "Total ShippedItems": order.totalShippedItems,
        "Additional Notes": order.additionalNotes,
        "Ordered By": order.orderedBy,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, "orders.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [
        [
          "Vendor Action",
          "Action",
          "Order ID",
          "Reference Number",
          "Location",
          "Customer",
          "Total Items",
          "Additional Notes",
          "Ordered By",
        ],
      ],
      body: filteredViewOrders.map((order) => [
        order.vendorAction,
        order.action,
        order.orderId,
        order.referenceNumber,
        order.location,
        order.customerName,
        order.totalItems,
        order.totalShippedItems,
        order.additionalNotes,
        order.orderedBy,
      ]),
    });
    doc.save("orders.pdf");
  };

  const printData = () => {
    const tableContainer = document.getElementById("table-container");
    const clonedContainer = tableContainer.cloneNode(true);
    const $clonedContainer = $(clonedContainer);

    $clonedContainer.find(".dataTables_filter").remove();
    $clonedContainer.find(".dataTables_paginate").remove();
    $clonedContainer.find(".dataTables_info").remove();
    $clonedContainer.find("td button").remove();

    const printWindow = window.open("", "", "height=800,width=1200");
    printWindow.document.write("<html><head><title>Print</title>");
    printWindow.document.write(
      '<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">'
    );
    printWindow.document.write("</head><body>");
    printWindow.document.write($clonedContainer.html());
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const toggleColumn = (column) => {
    setColumnsVisibility((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
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

  const handleDropdownItemClick = (col, e) => {
    e.stopPropagation();
    toggleColumn(col);
  };

  const handleVendorAction = async (action, order) => {
    if (action === "view") {
      setModalType("view");
      setCurrentOrder(order);
    } else {
      const confirmationMessage = `Are you sure you want to ${action} this order?`;

      const userConfirmed = window.confirm(confirmationMessage);

      if (userConfirmed) {
        const status = action === "ship" ? 3 : 4;
        try {
          const response = await fetch(
            `${process.env.REACT_APP_BASE_URL}/franchise-purchase-return/updateStatus/${order.id}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ status }),
            }
          );
          if (response.ok) {
            toast.success(`Order ${action}ed successfully.`);
            fetchAcceptedOrders();
          } else {
            toast.error("Failed to update the order status.");
          }
        } catch (error) {
          // console.error("Error updating order status:", error);
          toast.error("An error occurred while updating the order status.");
        }
      } else {
        toast.error("Order action was canceled.");
      }
    }
  };

  const handleViewClick = (id) => {
    navigate(`/ViewSaleReturn/${id}`);
  };

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-12 col-md-6">
                <h1 className="all-heading">List Accepted Sale Returns</h1>
                <span className="d-inline d-md-block sub-heading">
                  Manage Sale Returns
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

                      {/* Added By Dropdown */}
                      <div className="col-md-3">
                        <div className="form-group">
                          <label className="me-2">Added By:</label>
                          <select
                            className="form-select"
                            name="addedBy"
                            value={activeFilters.addedBy}
                            onChange={handleFilterChange}
                          >
                            <option value="">All Users</option>
                            {filterValues.addedBy.map((user, index) => (
                              <option key={`user-${index}`} value={user}>
                                {user}
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
                              className="btn border-0 bg-transparent p-0 m-0"
                              onClick={(e) => handleDropdownItemClick(col, e)}
                            >
                              {col.replace(/([A-Z])/g, " $1").toUpperCase()}
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
                    className="table table-bordered table-hover shadow"
                  >
                    <thead>
                      <tr>
                        {columnsVisibility.vendorAction && (
                          <th>Action&nbsp;&nbsp;&nbsp;&nbsp;</th>
                        )}
                        {columnsVisibility.action && <th>View</th>}
                        {columnsVisibility.orderDate && (
                          <th>
                            &nbsp;&nbsp;Date&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                          </th>
                        )}
                        {columnsVisibility.referenceNumber && (
                          <th>Reference Number</th>
                        )}
                        {columnsVisibility.location && <th>Location</th>}
                        {columnsVisibility.totalItems && <th>Total Items</th>}
                        {columnsVisibility.totalShippedItems && (
                          <th>Total Shipped Items</th>
                        )}
                        {columnsVisibility.additionalNotes && (
                          <th>Additional Notes</th>
                        )}
                        {columnsVisibility.orderedBy && <th>Ordered By</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredViewOrders
                        .sort(
                          (a, b) =>
                            new Date(b.orderDate) - new Date(a.orderDate)
                        )
                        .slice(startIndex, endIndex)
                        .map((order) => (
                          <tr key={order.orderId}>
                            {columnsVisibility.vendorAction && (
                              <td>
                                <select
                                  className="form-control form-control-sm"
                                  onChange={(e) =>
                                    handleVendorAction(e.target.value, order)
                                  }
                                >
                                  <option value="">Select Action</option>
                                  <option value="ship">Ship Return</option>
                                </select>
                              </td>
                            )}
                            {columnsVisibility.action && (
                              <td>
                                <button
                                  onClick={() => handleViewClick(order.id)}
                                  className="btn btn-sm btn-primary"
                                >
                                  View
                                </button>
                              </td>
                            )}
                            {columnsVisibility.orderDate && (
                              <td>{order.orderDate}</td>
                            )}

                            {columnsVisibility.referenceNumber && (
                              <td>{order.referenceNumber}</td>
                            )}
                            {columnsVisibility.location && (
                              <td>{order.location}</td>
                            )}

                            {columnsVisibility.totalItems && (
                              <td>{order.totalItems}</td>
                            )}
                            {columnsVisibility.totalShippedItems && (
                              <td>{order.totalShippedItems}</td>
                            )}
                            {columnsVisibility.additionalNotes && (
                              <td>{order.additionalNotes}</td>
                            )}
                            {columnsVisibility.orderedBy && (
                              <td>{order.addedBy}</td>
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

        {/* Modals for different actions */}
        {modalType && (
          <div className="modal fade show" style={{ display: "block" }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {modalType === "view"
                      ? "View Order"
                      : modalType === "accept"
                      ? "Accept Order"
                      : "Reject Order"}
                  </h5>
                  <button
                    type="button"
                    className="close"
                    onClick={() => setModalType(null)}
                  >
                    <span>&times;</span>
                  </button>
                </div>
                <div className="modal-body">
                  {modalType === "view" && (
                    <div>
                      <h5>Order Details:</h5>
                      <p>Order ID: {currentOrder?.orderId}</p>
                      <p>Reference Number: {currentOrder?.referenceNumber}</p>
                      <p>Order Date: {currentOrder?.orderDate}</p>
                      <p>Customer: {currentOrder?.customer}</p>
                      <p>Total Items: {currentOrder?.totalItems}</p>
                      <p>
                        Total Shipped Items: {currentOrder?.totalShippedItems}
                      </p>
                      <p>Location: {currentOrder?.location}</p>
                      <p>Ordered By: {currentOrder?.orderedBy}</p>
                      <p>Additional Notes: {currentOrder?.additionalNotes}</p>
                    </div>
                  )}
                  {modalType === "accept" && (
                    <div>Are you sure you want to accept this order?</div>
                  )}
                  {modalType === "reject" && (
                    <div>Are you sure you want to reject this order?</div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setModalType(null)}
                  >
                    Close
                  </button>
                  {(modalType === "accept" || modalType === "reject") && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setModalType(null)}
                    >
                      Confirm
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListAcceptedReturn;
