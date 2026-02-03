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
import { Link, useNavigate } from "react-router-dom";

const ListAcceptedReturn = () => {
  const [viewOrders, setViewOrders] = useState([]);
  const [userEmail, setUserEmail] = useState(null);
  const navigate = useNavigate(); // Initialize navigate
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
  const [modalType, setModalType] = useState(null); // "accept", "reject", "view", "payment"
  const [currentOrder, setCurrentOrder] = useState(null); // For viewing/editing
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(25);

  // payment form state
  const [paymentForm, setPaymentForm] = useState({
    type: "refund", // refund | credit_note
    amount: "",
    date: "",
    method: "",
    account: "",
    note: "",
  });
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentAccounts, setPaymentAccounts] = useState([]);

  useEffect(() => {
    const email = sessionStorage.getItem("userEmail");
    if (email) {
      setUserEmail(email);
    }

    fetchAcceptedOrders();
    fetchPaymentOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Try to fetch payment methods/accounts if your API supports it.
  // If endpoints differ, change the URLs or remove these calls.
  const fetchPaymentOptions = async () => {
    try {
      // Example endpoints — change to actual ones if different
      const methodsResp = await fetch(
        `${process.env.REACT_APP_BASE_URL}/payment-method/active-names`,
      );
      if (methodsResp.ok) {
        const methods = await methodsResp.json();
        setPaymentMethods(Array.isArray(methods) ? methods : []);
      }
    } catch (err) {
      // ignore errors — optional: console.warn(err)
    }

    try {
      const accountsResp = await fetch(
        `${process.env.REACT_APP_BASE_URL}/payment-account/getall`,
      );
      if (accountsResp.ok) {
        const accounts = await accountsResp.json();
        setPaymentAccounts(Array.isArray(accounts) ? accounts : []);
      }
    } catch (err) {
      // ignore errors
    }

    // Add jQuery script at the bottom
    const script = document.createElement("script");
    script.src = "js/JqueryContent.js";
    script.async = true;
    document.body.appendChild(script);
  };

  const exportCSV = () => {
    const csvData = viewOrders.map((order) => ({
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
      viewOrders.map((order) => ({
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
      })),
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
      body: viewOrders.map((order) => [
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
      '<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">',
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
    setPaymentForm((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handlePaymentFormChange = (field, value) => {
    setPaymentForm((prev) => ({ ...prev, [field]: value }));
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

  const handleVendorAction = async (action, order) => {
    if (action === "view") {
      // For the "view" action, just open the modal and set the current order
      setModalType("view");
      setCurrentOrder(order); // Set the current order to be viewed
    } else if (action === "reject") {
      const confirmationMessage = `Are you sure you want to ${action} this order?`;

      // Show a confirmation dialog before proceeding
      const userConfirmed = window.confirm(confirmationMessage);

      if (userConfirmed) {
        const status = 2; // 2 for reject based on your earlier mapping
        try {
          const response = await fetch(
            `${process.env.REACT_APP_BASE_URL}/franchise-purchase-return/updateStatus/${order.id}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ status }),
            },
          );
          if (response.ok) {
            alert(`Order ${action}ed successfully.`);
            fetchAcceptedOrders();
          } else {
            alert("Failed to update the order status.");
          }
        } catch (error) {
          console.error("Error updating order status:", error);
          alert("An error occurred while updating the order status.");
        }
      } else {
        // If user cancels the action
        alert("Order action was canceled.");
      }
    }
  };

  const fetchAcceptedOrders = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/franchise-purchase-return/getAcceptedReturns`,
      );
      if (!response.ok) throw new Error("Network response was not ok");

      const data = await response.json();
      if (Array.isArray(data)) {
        setViewOrders(data); // Update state with fetched data
      } else {
        console.error("Fetched data is not an array");
        setViewOrders([]); // Reset if data is not an array
      }
    } catch (error) {
      console.error("Error fetching accepted orders:", error);
      setViewOrders([]); // Reset state in case of error
    }
  };

  const handleViewClick = (id) => {
    navigate(`/ViewSaleReturn/${id}`);
  };

  // NEW: When user selects Refund/Credit Note from dropdown in list
  const handlePaymentAction = (action, order) => {
    // action is "refund" or "credit_note"
    setCurrentOrder(order);
    setPaymentForm({
      type: action,
      amount: order?.netTotalAmount || "", // default amount - change as per real field
      date: new Date().toISOString().split("T")[0], // today's date default
      method: "",
      account: "",
      note: "",
    });
    setModalType("payment");
  };

  const handleSavePayment = async () => {
    if (!currentOrder) return alert("No order selected");
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0)
      return alert("Please enter a valid amount");
    if (!paymentForm.account) return alert("Please select a payment account");

    // Use selected date but add current time
    const now = new Date();
    const timeString = now.toTimeString().split(" ")[0]; // HH:mm:ss
    const dateString = paymentForm.date + "T" + timeString;

    const payload = {
      paymentMethod: paymentForm.method,
      amount: Number(paymentForm.amount),
      transactionType: paymentForm.type === "refund" ? "Refund" : "credit note",
      note: paymentForm.note,
      date: dateString,
      vendor: currentOrder.vendor || "",
      addedBy: userEmail,
      franchiseName: currentOrder.customer || "",
    };

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/payment-account/transaction/${paymentForm.account}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (response.ok) {
        alert("Payment details saved successfully");
        setModalType(null);
        setCurrentOrder(null);
        fetchAcceptedOrders();
      } else {
        const text = await response.text();
        console.error("Save payment failed:", text);
        alert("Failed to save payment details");
      }
    } catch (error) {
      console.error("Error saving payment details:", error);
      alert("Error while saving payment details");
    }
  };

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-12 col-md-6">
                <h1 className="all-heading">List Accpeted Sale Returns</h1>
                <span className="d-inline d-md-block sub-heading">
                  Manage Sale Returns
                </span>
              </div>
            </div>
          </div>
        </section>
        <section className="content">
          <div className="container-fluid">
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
                        {columnsVisibility.vendorAction && <th>Action</th>}
                        {columnsVisibility.action && <th>View</th>}
                        {columnsVisibility.orderDate && <th>Return Date</th>}
                        {columnsVisibility.orderId && <th>Return No</th>}
                        {columnsVisibility.referenceNumber && (
                          <th>Invoice Number</th>
                        )}
                        {columnsVisibility.customer && <th>Franchise Name</th>}
                        {columnsVisibility.totalItems && <th>Total Items</th>}
                        {columnsVisibility.totalItems && <th>Total Amount</th>}
                        {columnsVisibility.totalItems && (
                          <th>Payment Status</th>
                        )}
                        {columnsVisibility.totalItems && <th>Amount Due</th>}

                        {columnsVisibility.additionalNotes && <th>Notes</th>}
                        {columnsVisibility.orderedBy && <th>Added By</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {viewOrders
                        .sort(
                          (a, b) =>
                            new Date(b.orderDate) - new Date(a.orderDate),
                        ) // Sort by date (latest first)
                        .slice(startIndex, endIndex)
                        .map((order) => (
                          <tr key={order.orderId || order.id}>
                            {columnsVisibility.vendorAction && (
                              <td>
                                <select
                                  className="form-control form-control-sm"
                                  onChange={(e) =>
                                    handleVendorAction(e.target.value, order)
                                  }
                                >
                                  <option value="">Select Action</option>
                                  <option value="reject">Reject</option>
                                </select>
                              </td>
                            )}
                            {columnsVisibility.action && (
                              <td>
                                <button
                                  onClick={() => handleViewClick(order.id)} // Opens the view modal
                                  className="btn btn-sm btn-primary"
                                >
                                  View
                                </button>
                              </td>
                            )}
                            {columnsVisibility.orderDate && (
                              <td>{order.orderDate}</td>
                            )}
                            {columnsVisibility.orderId && (
                              <td>{order.franchisePurchaseReturnId}</td>
                            )}
                            {columnsVisibility.referenceNumber && (
                              <td>{order.invoiceNumber}</td>
                            )}

                            {columnsVisibility.customer && (
                              <td>
                                {order.franchiseId?.replace(/^fuma_/, "")}
                              </td>
                            )}
                            {columnsVisibility.totalItems && (
                              <td>{order.totalItems}</td>
                            )}

                            {/* Total Amount column - you can change the field name if different */}
                            {columnsVisibility.totalItems && (
                              <td>
                                {order.netTotalAmount != null
                                  ? order.netTotalAmount
                                  : ""}
                              </td>
                            )}

                            {columnsVisibility.totalItems && (
                              <td>
                                {(() => {
                                  if (order.paymentStatus === 0) {
                                    // Pending → allow selecting Refund or Credit Note
                                    return (
                                      <select
                                        className="form-control form-control-sm"
                                        onChange={(e) =>
                                          handlePaymentAction(
                                            e.target.value,
                                            order,
                                          )
                                        }
                                        defaultValue=""
                                      >
                                        <option value="">Pending</option>
                                        <option value="1">Refund</option>
                                        <option value="2">Credit Note</option>
                                      </select>
                                    );
                                  } else if (order.paymentStatus === 1) {
                                    // Refund → fixed, disable select
                                    return (
                                      <select
                                        className="form-control form-control-sm"
                                        disabled
                                      >
                                        <option value="1" selected>
                                          Refund
                                        </option>
                                      </select>
                                    );
                                  } else if (order.paymentStatus === 2) {
                                    // Credit Note → fixed, disable select
                                    return (
                                      <select
                                        className="form-control form-control-sm"
                                        disabled
                                      >
                                        <option value="2" selected>
                                          Credit Note
                                        </option>
                                      </select>
                                    );
                                  } else {
                                    // If paymentStatus is null or unknown → default Pending
                                    return (
                                      <select
                                        className="form-control form-control-sm"
                                        onChange={(e) =>
                                          handlePaymentAction(
                                            e.target.value,
                                            order,
                                          )
                                        }
                                        defaultValue=""
                                      >
                                        <option value="">Pending</option>
                                        <option value="1">Refund</option>
                                        <option value="2">Credit Note</option>
                                      </select>
                                    );
                                  }
                                })()}
                              </td>
                            )}

                            {columnsVisibility.totalItems && (
                              <td>
                                {order.paymentStatus === 0
                                  ? order.netTotalAmount
                                  : order.paymentStatus === 1 ||
                                      order.paymentStatus === 2
                                    ? 0
                                    : ""}
                              </td>
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
                        : modalType === "payment"
                          ? "Payment Details"
                          : "Reject Order"}
                  </h5>
                  <button
                    type="button"
                    className="close"
                    onClick={() => {
                      setModalType(null);
                      setCurrentOrder(null);
                    }}
                  >
                    <span>&times;</span>
                  </button>
                </div>
                <div className="modal-body">
                  {/* View modal content */}
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

                  {modalType === "payment" && currentOrder && (
                    <div>
                      <h5>Payment / Credit Note</h5>

                      <div className="mb-2">
                        <strong>Total Amount (With Tax):</strong>{" "}
                        {currentOrder.totalAmountWithTax != null
                          ? currentOrder.totalAmountWithTax
                          : currentOrder.netTotalAmount != null
                            ? currentOrder.netTotalAmount
                            : ""}
                      </div>

                      <div className="mb-3">
                        <strong>Total Amount (Without Tax):</strong>{" "}
                        {currentOrder
                          ? currentOrder.franchisePurchaseReturnItems
                              .reduce(
                                (sum, item) =>
                                  sum +
                                  (item.unitPrice?.toNumber
                                    ? item.unitPrice.toNumber()
                                    : parseFloat(item.unitPrice || 0)) *
                                    (item.quantity || 0),
                                0,
                              )
                              .toFixed(2)
                          : "0.00"}
                      </div>

                      <div className="form-group">
                        <label>Select - Refund / Credit Note</label>
                        <select
                          id="type"
                          className="form-control"
                          value={paymentForm.type}
                          onChange={(e) =>
                            handlePaymentFormChange("type", e.target.value)
                          }
                        >
                          <option value="refund">Refund</option>
                          <option value="credit_note">Credit Note</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Enter amount</label>
                        <input
                          id="amount"
                          type="number"
                          className="form-control"
                          value={paymentForm.amount}
                          onChange={(e) =>
                            handlePaymentFormChange("amount", e.target.value)
                          }
                        />
                      </div>

                      <div className="form-group">
                        <label>Date</label>
                        <input
                          id="date"
                          type="date"
                          className="form-control"
                          value={paymentForm.date}
                          onChange={(e) =>
                            handlePaymentFormChange("date", e.target.value)
                          }
                        />
                      </div>

                      <div className="form-group">
                        <label>Select payment method</label>
                        <select
                          id="method"
                          className="form-control"
                          value={paymentForm.method}
                          onChange={(e) =>
                            handlePaymentFormChange("method", e.target.value)
                          }
                        >
                          <option value="">Select Method</option>
                          {paymentMethods.length > 0 ? (
                            paymentMethods.map((m, idx) => (
                              <option key={idx} value={m}>
                                {m}
                              </option>
                            ))
                          ) : (
                            <>
                              <option value="cash">Cash</option>
                              <option value="bank">Bank</option>
                              <option value="upi">UPI</option>
                            </>
                          )}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Payment account</label>
                        <select
                          id="account"
                          className="form-control"
                          value={paymentForm.account}
                          onChange={(e) =>
                            handlePaymentFormChange("account", e.target.value)
                          }
                        >
                          <option value="">Select Account</option>
                          {paymentAccounts.length > 0 ? (
                            paymentAccounts.map((a, idx) => (
                              <option key={idx} value={a.id}>
                                {a.accountName} ({a.accountNumber})
                              </option>
                            ))
                          ) : (
                            <option value="">--select--</option>
                          )}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Note</label>
                        <textarea
                          id="note"
                          className="form-control"
                          value={paymentForm.note}
                          onChange={(e) =>
                            handlePaymentFormChange("note", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setModalType(null);
                      setCurrentOrder(null);
                    }}
                  >
                    Close
                  </button>

                  {modalType === "payment" && (
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={handleSavePayment}
                    >
                      Save Payment
                    </button>
                  )}

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
