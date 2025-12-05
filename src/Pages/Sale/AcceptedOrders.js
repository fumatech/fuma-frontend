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
import { useNavigate } from "react-router-dom";

const AcceptedOrders = () => {
  const [acceptedOrders, setAcceptedOrders] = useState([]);
  const [filteredAcceptedOrders, setFilteredAcceptedOrders] = useState([]);
  const [columnsVisibility, setColumnsVisibility] = useState({
    vendorAction: true,
    orderDate: true,
    deliveryDate: true,
    franchiseName: true,
    orderId: true,
    referenceNumber: true,
    location: true,
    customer: true,
    totalItems: true,
    totalShippedItems: true,
    orderedBy: true,
    manufacturingStatus: true,
    dispatchStatus: true,
    actions: true,
  });
  const [modalType, setModalType] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [dropdown, setDropdown] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderStatuses, setOrderStatuses] = useState({});
  const navigate = useNavigate();

  // State variables for filters
  const [filterValues, setFilterValues] = useState({
    franchiseNames: [],
    locations: [],
  });
  
  const [activeFilters, setActiveFilters] = useState({
    startDate: "",
    endDate: "",
    franchiseName: "",
    location: "",
  });
  
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    const fetchAcceptedOrders = async () => {
      try {
        const response = await fetch(
          `https://fusionmastertech.com:8443/franchisepurchaseorder/getAcceptedOrders`
        );
        if (!response.ok) throw new Error("Network response was not ok");

        const data = await response.json();
        if (Array.isArray(data)) {
          setAcceptedOrders(data);
          setFilteredAcceptedOrders(data);
        } else {
          console.error("Fetched data is not an array");
          setAcceptedOrders([]);
          setFilteredAcceptedOrders([]);
        }
      } catch (error) {
        console.error("Error fetching accepted orders:", error);
        setAcceptedOrders([]);
        setFilteredAcceptedOrders([]);
      }

      const script = document.createElement("script");
      script.src = "js/JqueryContent.js";
      script.async = true;
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    };

    fetchAcceptedOrders();
  }, []);

  // Extract filter values when acceptedOrders data changes
  useEffect(() => {
    if (acceptedOrders.length > 0) {
      const franchiseNames = [...new Set(acceptedOrders.map(item => item.franchiseName))].filter(Boolean);
      const locations = [...new Set(acceptedOrders.map(item => item.location))].filter(Boolean);
      
      setFilterValues({
        franchiseNames,
        locations,
      });
    }
  }, [acceptedOrders]);

  // Apply filters whenever activeFilters or acceptedOrders changes
  useEffect(() => {
    const filteredData = acceptedOrders.filter((order) => {
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
      
      // Franchise Name filter
      const franchiseNameMatch = activeFilters.franchiseName === "" || 
        order.franchiseName === activeFilters.franchiseName;
      
      // Location filter
      const locationMatch = activeFilters.location === "" || 
        order.location === activeFilters.location;
      
      return dateMatch && franchiseNameMatch && locationMatch;
    });
    
    setFilteredAcceptedOrders(filteredData);
  }, [activeFilters, acceptedOrders]);

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
      franchiseName: "",
      location: "",
    });
  };

  const exportCSV = () => {
    const csvData = filteredAcceptedOrders.map((order) => ({
      "Order ID": order.orderId,
      "Reference Number": order.referenceNumber,
      Location: order.location,
      Customer: order.customerName,
      "Total Items": order.totalItems,
      "Additional Notes": order.totalShippedItems,
      "Ordered By": order.orderedBy,
      "Manufacturing Status": order.manufacturingStatus,
      "Dispatch Status": order.dispatchStatus,
    }));

    const csv = [
      [
        "Order ID",
        "Reference Number",
        "Location",
        "Customer",
        "Total Items",
        "Additional Notes",
        "Ordered By",
        "Manufacturing Status",
        "Dispatch Status",
      ],
      ...csvData.map((row) => Object.values(row)),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, "accepted_orders.csv");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredAcceptedOrders.map((order) => ({
        "Order ID": order.orderId,
        "Reference Number": order.referenceNumber,
        Location: order.location,
        Customer: order.customerName,
        "Total Items": order.totalItems,
        "Additional Notes": order.totalShippedItems,
        "Ordered By": order.orderedBy,
        "Manufacturing Status": order.manufacturingStatus,
        "Dispatch Status": order.dispatchStatus,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Accepted Orders");
    XLSX.writeFile(wb, "accepted_orders.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [
        [
          "Order ID",
          "Reference Number",
          "Location",
          "Customer",
          "Total Items",
          "Additional Notes",
          "Ordered By",
          "Manufacturing Status",
          "Dispatch Status",
        ],
      ],
      body: filteredAcceptedOrders.map((order) => [
        order.franchisePurchaseOrderId,
        order.referenceNumber,
        order.location,
        order.customerName,
        order.totalItems,
        order.totalShippedItems,
        order.addedBy,
        order.manufacturingStatus,
        order.dispatchStatus,
      ]),
    });
    doc.save("accepted_orders.pdf");
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

  const handleView = (id) => {
    const orderToView = filteredAcceptedOrders.find((order) => order.id === id);
    if (orderToView) {
      setCurrentOrder(orderToView);
      setModalType("view");
    }
  };

  const openModal = (order) => {
    setCurrentOrder(order);
    setDropdown(orderStatuses[order.id] || "");
    setIsModalOpen(true);
  };

  const updateStatus = async () => {
    if (!dropdown) {
      alert("Please select a status");
      return;
    }

    try {
      const response = await fetch(
        `https://fusionmastertech.com:8443/franchisepurchaseorder/updateDispatchStatus/${currentOrder.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dispatchStatus: dropdown.toLowerCase(),
          }),
        }
      );

      if (response.ok) {
        const updatedOrders = filteredAcceptedOrders.map((order) =>
          order.id === currentOrder.id
            ? { ...order, dispatchStatus: dropdown.toLowerCase() }
            : order
        );

        setFilteredAcceptedOrders(updatedOrders);
        setIsModalOpen(false);
        alert("Status updated successfully");
      } else {
        throw new Error("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Error updating status");
    }
  };

  const handleManufacturingStatus = (action, order) => {
    setCurrentOrder(order);
    setModalType(action);
  };

  const handleVendorAction = (action, order) => {
    setCurrentOrder(order);
    setModalType(action);
  };

  const handleRejectBack = async (order) => {
    const status = 2;

    try {
      const response = await fetch(
        `https://fusionmastertech.com:8443/franchisepurchaseorder/updateStatus/${order.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      if (response.ok) {
        const updatedOrders = await fetch(
          `https://fusionmastertech.com:8443/franchisepurchaseorder/getAcceptedOrders`
        );
        const data = await updatedOrders.json();
        if (Array.isArray(data)) {
          setAcceptedOrders(data);
          setFilteredAcceptedOrders(data);
        } else {
          console.error("Failed to fetch updated orders");
        }
        alert("Order rejected back successfully.");
      } else {
        alert("Failed to reject the order back.");
      }
    } catch (error) {
      console.error("Error rejecting the order back:", error);
      alert("An error occurred while rejecting the order back.");
    }
  };

  const handleViewOdBack = async (order) => {
    const status = 0;

    try {
      const response = await fetch(
        `https://fusionmastertech.com:8443/franchisepurchaseorder/updateStatus/${order.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      if (response.ok) {
        const updatedOrders = await fetch(
          `https://fusionmastertech.com:8443/franchisepurchaseorder/getAcceptedOrders`
        );
        const data = await updatedOrders.json();
        if (Array.isArray(data)) {
          setAcceptedOrders(data);
          setFilteredAcceptedOrders(data);
        } else {
          console.error("Failed to fetch updated orders");
        }
        alert("Order Viewed back successfully.");
      } else {
        alert("Failed to View the order back.");
      }
    } catch (error) {
      console.error("Error Viewing the order back:", error);
      alert("An error occurred while Viewing the order back.");
    }
  };

  const handleVendorActions = (e, order) => {
    if (e.target.value === "AddSale") {
      navigate(`/AddSoSale/${order.id}`);
    } else if (e.target.value === "ShipOrder") {
      alert("are you want to ship this order?");
      navigate(`/EditAcceptedOrder/${order.id}`);
    }
  };

  const handleViewClick = (id) => {
    navigate(`/ViewOrders/${id}`);
  };

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-12 col-md-6">
                <h1 className="all-heading">Accepted Orders</h1>
                <span className="d-inline d-md-block sub-heading">
                  Manage Accepted Orders
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

                      {/* Franchise Name Dropdown */}
                      <div className="col-md-3">
                        <div className="form-group">
                          <label className="me-2">Franchise Name:</label>
                          <select
                            className="form-select"
                            name="franchiseName"
                            value={activeFilters.franchiseName}
                            onChange={handleFilterChange}
                          >
                            <option value="">All Franchises</option>
                            {filterValues.franchiseNames.map((franchiseName, index) => (
                              <option key={`franchise-${index}`} value={franchiseName}>
                                {franchiseName}
                              </option>
                            ))}
                          </select>
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
                {/* <button className="btn btn-add" onClick={() => setModalType("add")}>
                  <i className="fas fa-plus"></i> Add Order
                </button> */}
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
                          <th>Vendor Action</th>
                        )}
                        {columnsVisibility.orderId && <th>Order ID</th>}
                        {columnsVisibility.orderDate && <th>Order Date</th>}
                        {columnsVisibility.franchiseName && (
                          <th>Franchise Id</th>
                        )}
                        {columnsVisibility.franchiseName && (
                          <th>Franchise Name</th>
                        )}
                        {columnsVisibility.referenceNumber && (
                          <th>Reference Number</th>
                        )}
                        {columnsVisibility.deliveryDate && (
                          <th>Exp Delivery Date</th>
                        )}
                        {columnsVisibility.totalItems && (
                          <th>Total Quantity</th>
                        )}
                        {columnsVisibility.location && <th>Location</th>}
                        {columnsVisibility.orderedBy && <th>Ordered By</th>}
                        {columnsVisibility.dispatchStatus && (
                          <th>Dispatch Status</th>
                        )}
                        {columnsVisibility.actions && (
                          <th>
                            &nbsp;&nbsp;&nbsp;&nbsp;Actions&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAcceptedOrders
                        .sort(
                          (a, b) =>
                            new Date(b.orderDate) - new Date(a.orderDate)
                        )
                        .slice(startIndex, endIndex)
                        .map((order) => (
                          <tr key={order.franchisePurchaseOrderId}>
                            {columnsVisibility.vendorAction && (
                              <td>
                                <select
                                  className="form-control form-control-sm"
                                  onChange={(e) =>
                                    handleVendorActions(e, order)
                                  }
                                >
                                  <option value="">Accepted</option>
                                  <option value="ShipOrder">Ship Order</option>
                                </select>
                              </td>
                            )}
                            {columnsVisibility.orderId && (
                              <td>{order.franchisePurchaseOrderId}</td>
                            )}
                            {columnsVisibility.orderDate && (
                              <td>{order.orderDate}</td>
                            )}
                            {columnsVisibility.franchiseName && (
                              <td>{order.franchiseId}</td>
                            )}
                            {columnsVisibility.franchiseName && (
                              <td>{order.franchiseName}</td>
                            )}
                            {columnsVisibility.referenceNumber && (
                              <td>{order.referenceNumber}</td>
                            )}
                            {columnsVisibility.deliveryDate && (
                              <td>{order.deliveryDate}</td>
                            )}
                            {columnsVisibility.totalItems && (
                              <td>{order.totalItems}</td>
                            )}
                            {columnsVisibility.location && (
                              <td>{order.location}</td>
                            )}
                            {columnsVisibility.orderedBy && (
                              <td>{order.addedBy}</td>
                            )}
                            {columnsVisibility.dispatchStatus && (
                              <td>
                                <button
                                  className={`btn-sm p-0 px-2 mt-3 border-0 ${
                                    orderStatuses[order.id] === "ready"
                                      ? "btn-success"
                                      : orderStatuses[order.id] === "pending"
                                      ? "btn-warning"
                                      : "btn-default"
                                  }`}
                                  onClick={() => openModal(order)}
                                >
                                  {orderStatuses[order.id] === "stock"
                                    ? "Not In Stock"
                                    : orderStatuses[order.id] ===
                                      "manufacturing"
                                    ? "Manufacturing"
                                    : orderStatuses[order.id] === "dispatch"
                                    ? "Ready To Dispatch"
                                    : "Select Status"}
                                </button>
                              </td>
                            )}
                            {columnsVisibility.actions && (
                              <td>
                                <button
                                  className="btn btn-edit btn-sm mr-2"
                                  onClick={printData}
                                >
                                  <i className="fas fa-edit"></i> Print
                                </button>
                                <button
                                  className="btn btn-view btn-sm mr-2"
                                  onClick={() => handleViewClick(order.id)}
                                >
                                  <i className="fas fa-eye"></i> View
                                </button>
                                <button
                                  className="btn btn-ViewB btn-success btn-sm mr-2"
                                  onClick={() => handleViewOdBack(order)}
                                >
                                  <i className="fa-solid fa-arrow-rotate-left me-1"></i>{" "}
                                  Un Accept Order{" "}
                                </button>
                                <button
                                  className="btn btn-RejectB btn-success btn-sm mr-2"
                                  onClick={() => handleRejectBack(order)}
                                >
                                  <i className="fa-solid fa-arrow-rotate-left me-1"></i>{" "}
                                  Reject Order
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                    </tbody>
                  </table>

                  {/* modal for ready and pending  */}
                  {isModalOpen && (
                    <div
                      className="modal fade show"
                      style={{ display: "block" }}
                    >
                      <div className="modal-dialog">
                        <div className="modal-content">
                          <div className="modal-header">
                            <h4 className="modal-title">Update Status</h4>
                            <button
                              type="button"
                              className="close"
                              onClick={() => setIsModalOpen(false)}
                            >
                              <span aria-hidden="true">×</span>
                            </button>
                          </div>
                          <div className="modal-body">
                            <div className="dropdown">
                              <label className="me-2 d-md-inline">
                                Dispatch Status:
                              </label>
                              <select
                                className="form-select"
                                value={dropdown}
                                onChange={(e) => setDropdown(e.target.value)}
                                required
                              >
                                <option value="">Please Select</option>
                                <option value="not in stock">
                                  Not In Stock
                                </option>
                                <option value="manufacturing">
                                  Manufacturing
                                </option>
                                <option value="ready to dispatch">
                                  Ready To Dispatch
                                </option>
                              </select>
                            </div>
                          </div>
                          <div className="modal-footer align-items-end">
                            <button
                              type="button"
                              className="btn btn-default"
                              onClick={updateStatus}
                            >
                              Update
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => setIsModalOpen(false)}
                            >
                              Close
                            </button>
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
};

export default AcceptedOrders;