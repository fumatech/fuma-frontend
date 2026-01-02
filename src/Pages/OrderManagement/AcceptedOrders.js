import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../assets/dist/css/adminlte.min.css";
import "../../assets/plugins/fontawesome-free/css/all.min.css";
import "../../assets/plugins/datatables-bs4/css/dataTables.bootstrap4.min.css";
import "../../assets/plugins/datatables-responsive/css/responsive.bootstrap4.min.css";
import "../../assets/plugins/datatables-buttons/css/buttons.bootstrap4.min.css";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import $ from "jquery";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const AcceptedOrders = () => {
  const [acceptedOrders, setAcceptedOrders] = useState([]);
  const [columnsVisibility, setColumnsVisibility] = useState({
    vendorAction: true, // New vendor action column
    orderDate: true,
    orderId: true,
    referenceNumber: true,
    location: true,
    customer: true,
    totalItems: true,
    additionalNotes: true,
    orderedBy: true,
    manufacturingStatus: true,
    dispatchStatus: true,
    actions: true, // Added for the Actions column visibility
  });
  const [modalType, setModalType] = useState(null); // "accept", "reject", "view"
  const [currentOrder, setCurrentOrder] = useState(null); // For viewing/editing
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [dropdown, setDropdown] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderStatuses, setOrderStatuses] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAcceptedOrders = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/purchaseorder/getAcceptedOrders`
        );
        if (!response.ok) throw new Error("Network response was not ok");

        const data = await response.json();
        if (Array.isArray(data)) {
          setAcceptedOrders(data); // Only accepted orders will be shown in this view
        } else {
          console.error("Fetched data is not an array");
          setAcceptedOrders([]);
        }
      } catch (error) {
        console.error("Error fetching accepted orders:", error);
        setAcceptedOrders([]);
      }

      // Add external script directly without setTimeout
      const script = document.createElement("script");
      script.src = "js/JqueryContent.js";
      script.async = true;

      document.body.appendChild(script);

      // Cleanup function to remove the script element when the component is unmounted
      return () => {
        document.body.removeChild(script);
      };
    };

    fetchAcceptedOrders();
  }, []);

  const exportCSV = () => {
    const csvData = acceptedOrders.map((order) => ({
      "Order ID": order.orderId,
      "Reference Number": order.referenceNumber,
      Location: order.location,
      Customer: order.customerName,
      "Total Items": order.totalItems,
      "Additional Notes": order.additionalNotes,
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
      acceptedOrders.map((order) => ({
        "Order ID": order.orderId,
        "Reference Number": order.referenceNumber,
        Location: order.location,
        Customer: order.customerName,
        "Total Items": order.totalItems,
        "Additional Notes": order.additionalNotes,
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
      body: acceptedOrders.map((order) => [
        order.orderId,
        order.referenceNumber,
        order.location,
        order.customerName,
        order.totalItems,
        order.additionalNotes,
        order.orderedBy,
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
      '<link rel="stylesheet" href="httpss://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">'
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
    setCurrentPage(1); // Reset to the first page when entries per page changes
  };

  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;

  const handleDropdownItemClick = (col, e) => {
    e.stopPropagation(); // Prevent the event from bubbling up and affecting the dropdown toggle
    toggleColumn(col); // Toggle column visibility
  };

  const handleView = (id) => {
    const orderToView = acceptedOrders.find((order) => order.id === id);
    if (orderToView) {
      setCurrentOrder(orderToView);
      setModalType("view");
    }
  };

  // Open modal function
  const openModal = (order) => {
    setCurrentOrder(order);
    setDropdown(orderStatuses[order.id] || "");
    setIsModalOpen(true);
  };

  // Update button click
  const updateStatus = () => {
    const updatedStatuses = {
      ...orderStatuses,
      [currentOrder.id]: dropdown,
    };
    setOrderStatuses(updatedStatuses);
    setDropdown(""); // Reset dropdown after update
    setIsModalOpen(false); // Close the modal
  };

  const handleManufacturingStatus = (action, order) => {
    setCurrentOrder(order);
    setModalType(action); // "accept", "inProgress", or "view"
  };

  const handleVendorAction = (action, order) => {
    setCurrentOrder(order);
    setModalType(action); // "accept", "reject", or "view"
  };

  const handleRejectBack = async (order) => {
    // Log the order to inspect its structure
    const status = 2; // 2 for reject (as per the original code)

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/purchaseorder/updateStatus/${order.id}`,
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
          `${process.env.REACT_APP_BASE_URL}/purchaseorder/getAcceptedOrders`
        );
        const data = await updatedOrders.json();
        if (Array.isArray(data)) {
          setAcceptedOrders(data);
        } else {
          console.error("Failed to fetch updated orders");
        }
        toast.success("Order rejected back successfully.");
      } else {
        toast.error("Failed to reject the order back.");
      }
    } catch (error) {
      // console.error("Error rejecting the order back:", error);
      toast.error("An error occurred while rejecting the order back.");
    }
  };

  const handleViewOdBack = async (order) => {
    // Log the order to inspect its structure
    const status = 0; // 2 for View (as per the original code)

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/purchaseorder/updateStatus/${order.id}`,
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
          `${process.env.REACT_APP_BASE_URL}/purchaseorder/getAcceptedOrders`
        );
        const data = await updatedOrders.json();
        if (Array.isArray(data)) {
          setAcceptedOrders(data);
        } else {
          console.error("Failed to fetch updated orders");
        }
        toast.success("Order Viewed back successfully.");
      } else {
        toast.error("Failed to View the order back.");
      }
    } catch (error) {
      //console.error("Error Viewing the order back:", error);
      toast.error("An error occurred while Viewing the order back.");
    }
  };

  const handleVendorActions = (e, order) => {
    if (e.target.value === "ShipOrders") {
      // Redirect to the EditOrder page with the order ID as a parameter
      navigate(`/EditAcceptedOrder/${order.id}`);
    }
  };

  const handleViewClick = (id) => {
    navigate(`/ViewOd/${id}`);
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
                              onChange={() => toggleColumn(col)} // Toggle column visibility on checkbox change
                              className="mr-2"
                            />
                            <span
                              className="btn border-0 bg-transparent p-0 m-0"
                              onClick={(e) => handleDropdownItemClick(col, e)} // Handle click on dropdown item
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
                        )}{" "}
                        {/* New Vendor Action Column */}
                        {columnsVisibility.orderDate && (
                          <th>
                            &nbsp;&nbsp;&nbsp;&nbsp;Date&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                          </th>
                        )}
                        {columnsVisibility.orderId && <th>Order ID</th>}
                        {columnsVisibility.referenceNumber && (
                          <th>Reference Number</th>
                        )}
                        {columnsVisibility.location && <th>Location</th>}
                        {columnsVisibility.customer && <th>Customer</th>}
                        {columnsVisibility.totalItems && <th>Total Items</th>}
                        {columnsVisibility.additionalNotes && (
                          <th>Additional Notes</th>
                        )}
                        {columnsVisibility.orderedBy && <th>Ordered By</th>}
                        {columnsVisibility.manufacturingStatus && (
                          <th>Manufacturing Status</th>
                        )}
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
                      {acceptedOrders
                        .sort(
                          (a, b) =>
                            new Date(b.orderDate) - new Date(a.orderDate)
                        ) // Sort by date (latest first)
                        .slice(startIndex, endIndex)
                        .map((order) => (
                          <tr key={order.orderId}>
                            {columnsVisibility.vendorAction && (
                              <td>
                                <select
                                  className="form-control form-control-sm"
                                  onChange={(e) =>
                                    handleVendorActions(e, order)
                                  }
                                >
                                  <option value="">Accepted</option>
                                  <option value="ShipOrders">ShipOrders</option>
                                </select>
                              </td>
                            )}
                            {columnsVisibility.orderDate && (
                              <td>{order.orderDate}</td>
                            )}
                            {columnsVisibility.orderId && (
                              <td>{order.purchaseOrderId}</td>
                            )}
                            {columnsVisibility.referenceNumber && (
                              <td>{order.referenceNumber}</td>
                            )}
                            {columnsVisibility.location && (
                              <td>{order.location}</td>
                            )}
                            {columnsVisibility.customer && (
                              <td>{order.customerName}</td>
                            )}
                            {columnsVisibility.totalItems && (
                              <td>{order.totalItems}</td>
                            )}
                            {columnsVisibility.additionalNotes && (
                              <td>{order.additionalNotes}</td>
                            )}
                            {columnsVisibility.orderedBy && (
                              <td>{order.addedBy}</td>
                            )}
                            {columnsVisibility.manufacturingStatus && (
                              <td>
                                <select
                                  className="form-control form-control-sm mt-3"
                                  onChange={(e) =>
                                    handleManufacturingStatus(
                                      e.target.value,
                                      order
                                    )
                                  }
                                >
                                  <option value="">Select Status</option>
                                  <option value="complete">Complete</option>
                                  <option value="inProgress">InProgress</option>
                                </select>
                              </td>
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
                                  {orderStatuses[order.id] === "ready"
                                    ? "Ready"
                                    : orderStatuses[order.id] === "pending"
                                    ? "Pending"
                                    : "Select State"}
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
                                  ViewOrder back{" "}
                                </button>
                                <button
                                  className="btn btn-RejectB btn-success btn-sm mr-2"
                                  onClick={() => handleRejectBack(order)}
                                >
                                  <i className="fa-solid fa-arrow-rotate-left me-1"></i>{" "}
                                  Reject Back
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
                                <option value="ready">Ready</option>
                                <option value="pending">Pending</option>
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

                  {/* Modals for manufacturing Status */}
                  {modalType && (
                    <div
                      className="modal fade show"
                      style={{ display: "block" }}
                    >
                      <div className="modal-dialog">
                        <div className="modal-content">
                          <div className="modal-header">
                            <h5 className="modal-title">
                              {modalType === "view"
                                ? "View Order"
                                : modalType === "complete"
                                ? "complete Order"
                                : "inProgress Order"}
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
                            {/* Content for viewing or confirming complete/inProgress */}
                            {modalType === "view" && (
                              <div>
                                <h5>Order Details:</h5>
                                <p>Order ID: {currentOrder?.orderId}</p>
                                <p>
                                  Reference Number:{" "}
                                  {currentOrder?.referenceNumber}
                                </p>
                                <p>Order Date: {currentOrder?.purchaseDate}</p>
                                <p>Customer: {currentOrder?.customer}</p>
                                <p>Total Items: {currentOrder?.totalItems}</p>
                                <p>Location: {currentOrder?.location}</p>
                                <p>Ordered By: {currentOrder?.orderedBy}</p>
                                <p>
                                  Additional Notes:{" "}
                                  {currentOrder?.additionalNotes}
                                </p>
                              </div>
                            )}
                            {modalType === "complete" && (
                              <div>
                                Are you sure you want to complete this order?
                              </div>
                            )}
                            {modalType === "inProgress" && (
                              <div>
                                Are you sure you want to inProgress this order?
                              </div>
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
                            {modalType === "complete" ||
                            modalType === "inProgress" ? (
                              <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => setModalType(null)}
                              >
                                Confirm
                              </button>
                            ) : null}
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
