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
import { toast } from "react-toastify";

const SoldOrders = () => {
  const [soldOrders, setSoldOrders] = useState([]);
  const [columnsVisibility, setColumnsVisibility] = useState({
    orderID: true,
    totalAmount: true,
    shippingAddress: true,
    billingAddress: true,
    orderStatus: true,
    paymentStatus: true,
    quantity: true,
    discount: true,
    tax: true,
    action: true,
  });
  const [modalType, setModalType] = useState(null); // "add", "edit", or "view"
  const [currentSoldOrder, setCurrentSoldOrder] = useState(null); // For viewing/editing
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [formData, setFormData] = useState({
    orderID: "",
    totalAmount: "",
    shippingAddress: "",
    billingAddress: "",
    orderStatus: "",
    paymentStatus: "",
    quantity: "",
    discount: "",
    tax: "",
  });

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(
          `https://fusionmastertech.com:8444/soldOrders/getall`
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          setSoldOrders(data);
        } else {
          console.error("Fetched data is not an array");
          setSoldOrders([]);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
        setSoldOrders([]);
      }
      const script = document.createElement("script");
      script.src = "js/JqueryContent.js";
      script.async = true;

      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    };

    fetchOrders();
  }, []);

  const exportCSV = () => {
    const csvData = soldOrders.map((order) => ({
      OrderID: order.orderID,
      TotalAmount: order.totalAmount,
      ShippingAddress: order.shippingAddress,
      BillingAddress: order.billingAddress,
      OrderStatus: order.orderStatus,
      PaymentStatus: order.paymentStatus,
      Quantity: order.quantity,
      Discount: order.discount,
      Tax: order.tax,
    }));

    const csv = [
      [
        "Order ID",
        "Total Amount",
        "Shipping Address",
        "Billing Address",
        "Order Status",
        "Payment Status",
        "Quantity",
        "Discount",
        "Tax",
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
      soldOrders.map((order) => ({
        OrderID: order.orderID,
        TotalAmount: order.totalAmount,
        ShippingAddress: order.shippingAddress,
        BillingAddress: order.billingAddress,
        OrderStatus: order.orderStatus,
        PaymentStatus: order.paymentStatus,
        Quantity: order.quantity,
        Discount: order.discount,
        Tax: order.tax,
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
          "Order ID",
          "Total Amount",
          "Shipping Address",
          "Billing Address",
          "Order Status",
          "Payment Status",
          "Quantity",
          "Discount",
          "Tax",
        ],
      ],
      body: soldOrders.map((order) => [
        order.orderID,
        order.totalAmount,
        order.shippingAddress,
        order.billingAddress,
        order.orderStatus,
        order.paymentStatus,
        order.quantity,
        order.discount,
        order.tax,
      ]),
    });
    doc.save("orders.pdf");
  };

  const toggleColumn = (column) => {
    setColumnsVisibility((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
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

  const handleSaveOrder = async () => {
    try {
      if (modalType === "edit" && currentSoldOrder) {
        const response = await fetch(
          `https://fusionmastertech.com:8444/soldOrders/update/${currentSoldOrder.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ ...formData, id: currentSoldOrder.id }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update order");
        }

        const updatedOrder = await response.json();
        setSoldOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === updatedOrder.id ? updatedOrder : order
          )
        );
        closeModal();
        toast.success("Order updated successfully!");
      } else if (modalType === "add") {
        const response = await fetch(
          `https://fusionmastertech.com:8444/soldOrders/save`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
          }
        );

        if (response.status !== 201) {
          throw new Error("Failed to add order");
        }

        const newOrder = await response.json();
        setSoldOrders((prevOrders) => [...prevOrders, newOrder]);
        closeModal();
        toast.success("Order added successfully!");
      }
    } catch (error) {
      //console.error("Error saving order:", error);
      toast.error("Error saving order");
    }
  };

  const closeModal = () => {
    setModalType(null);
    setCurrentSoldOrder(null);
    setFormData({
      orderID: "",
      totalAmount: "",
      shippingAddress: "",
      billingAddress: "",
      orderStatus: "",
      paymentStatus: "",
      quantity: "",
      discount: "",
      tax: "",
    });
  };

  const handleEdit = (id) => {
    const orderToEdit = soldOrders.find((order) => order.id === id);
    if (orderToEdit) {
      setCurrentSoldOrder(orderToEdit);
      setFormData({
        orderID: orderToEdit.orderID,
        totalAmount: orderToEdit.totalAmount,
        shippingAddress: orderToEdit.shippingAddress,
        billingAddress: orderToEdit.billingAddress,
        orderStatus: orderToEdit.orderStatus,
        paymentStatus: orderToEdit.paymentStatus,
        quantity: orderToEdit.quantity,
        discount: orderToEdit.discount,
        tax: orderToEdit.tax,
      });
      setModalType("edit");
    }
  };

  const handleView = (id) => {
    const orderToView = soldOrders.find((order) => order.id === id);
    if (orderToView) {
      setCurrentSoldOrder(orderToView);
      setModalType("view");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        const response = await fetch(
          `https://fusionmastertech.com:8444/soldOrders/delete/${id}`,
          {
            method: "DELETE",
          }
        );

        if (response.status === 204) {
          setSoldOrders((prevOrders) =>
            prevOrders.filter((order) => order.id !== id)
          );
          toast.success("Order deleted successfully!");
        } else {
          toast.error("Failed to delete order.");
        }
      } catch (error) {
        //console.error("Error deleting order:", error);
        toast.error("Error deleting order");
      }
    }
  };

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-12 col-md-6">
                <h1 className="all-heading ">Sold Orders</h1>
                <span className="d-inline d-md-block sub-heading">
                  Manage Sold Orders
                </span>
              </div>
            </div>
          </div>
        </section>
        <section className="content">
          <div className="container-fluid">
            <div className="card cardHover rounded-4 border-0">
              <div className="d-flex justify-content-end mb-3">
                <button
                  className="btn btn-add"
                  onClick={() => setModalType("add")}
                >
                  <i className="fas fa-plus"></i> Add
                </button>
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
                        {columnsVisibility.orderID && <th>Order ID</th>}
                        {columnsVisibility.totalAmount && <th>Total Amount</th>}
                        {columnsVisibility.shippingAddress && (
                          <th>Shipping Address</th>
                        )}
                        {columnsVisibility.billingAddress && (
                          <th>Billing Address</th>
                        )}
                        {columnsVisibility.orderStatus && <th>Order Status</th>}
                        {columnsVisibility.paymentStatus && (
                          <th>Payment Status</th>
                        )}
                        {columnsVisibility.quantity && <th>Quantity</th>}
                        {columnsVisibility.discount && <th>Discount</th>}
                        {columnsVisibility.tax && <th>Tax</th>}
                        {columnsVisibility.action && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {soldOrders.slice(startIndex, endIndex).map((order) => (
                        <tr key={order.id}>
                          {columnsVisibility.orderID && (
                            <td>{order.orderID}</td>
                          )}
                          {columnsVisibility.totalAmount && (
                            <td>{order.totalAmount}</td>
                          )}
                          {columnsVisibility.shippingAddress && (
                            <td>{order.shippingAddress}</td>
                          )}
                          {columnsVisibility.billingAddress && (
                            <td>{order.billingAddress}</td>
                          )}
                          {columnsVisibility.orderStatus && (
                            <td>{order.orderStatus}</td>
                          )}
                          {columnsVisibility.paymentStatus && (
                            <td>{order.paymentStatus}</td>
                          )}
                          {columnsVisibility.quantity && (
                            <td>{order.quantity}</td>
                          )}
                          {columnsVisibility.discount && (
                            <td>{order.discount}</td>
                          )}
                          {columnsVisibility.tax && <td>{order.tax}</td>}

                          {columnsVisibility.action && (
                            <td>
                              <button
                                className="btn btn-edit btn-sm mr-2"
                                onClick={() => handleEdit(order.id)}
                              >
                                <i className="fas fa-edit"></i> Edit
                              </button>
                              <button
                                className="btn btn-view btn-sm mr-2"
                                onClick={() => handleView(order.id)}
                              >
                                <i className="fas fa-eye"></i> View
                              </button>
                              <button
                                className="btn btn-delete btn-sm"
                                onClick={() => handleDelete(order.id)}
                              >
                                <i className="fas fa-trash"></i> Delete
                              </button>
                            </td>
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

        {modalType && (
          <div
            className="modal fade show"
            id="orderModal"
            tabIndex="-1"
            role="dialog"
            aria-labelledby="orderModalLabel"
            aria-hidden={!modalType}
            style={{ display: modalType ? "block" : "none" }}
          >
            <div className="modal-dialog" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title" id="orderModalLabel">
                    {modalType === "add"
                      ? "Add Order"
                      : modalType === "edit"
                      ? "Edit Order"
                      : "View Order"}
                  </h5>
                  <button
                    type="button"
                    className="close"
                    onClick={closeModal}
                    aria-label="Close"
                  >
                    <span aria-hidden="true">&times;</span>
                  </button>
                </div>
                <div className="modal-body">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveOrder();
                    }}
                  >
                    {(modalType === "add" || modalType === "edit") && (
                      <div>
                        <div className="form-group">
                          <label htmlFor="orderID">Order ID</label>
                          <input
                            type="text"
                            className="form-control"
                            id="orderID"
                            value={formData.orderID}
                            onChange={handleFormChange}
                            placeholder="Enter order ID"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="totalAmount">Total Amount</label>
                          <input
                            type="number"
                            className="form-control"
                            id="totalAmount"
                            value={formData.totalAmount}
                            onChange={handleFormChange}
                            placeholder="Enter total amount"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="shippingAddress">
                            Shipping Address
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="shippingAddress"
                            value={formData.shippingAddress}
                            onChange={handleFormChange}
                            placeholder="Enter shipping address"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="billingAddress">
                            Billing Address
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="billingAddress"
                            value={formData.billingAddress}
                            onChange={handleFormChange}
                            placeholder="Enter billing address"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="orderStatus">Order Status</label>
                          <input
                            type="text"
                            className="form-control"
                            id="orderStatus"
                            value={formData.orderStatus}
                            onChange={handleFormChange}
                            placeholder="Enter order status"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="paymentStatus">Payment Status</label>
                          <input
                            type="text"
                            className="form-control"
                            id="paymentStatus"
                            value={formData.paymentStatus}
                            onChange={handleFormChange}
                            placeholder="Enter payment status"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="quantity">Quantity</label>
                          <input
                            type="number"
                            className="form-control"
                            id="quantity"
                            value={formData.quantity}
                            onChange={handleFormChange}
                            placeholder="Enter quantity"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="discount">Discount</label>
                          <input
                            type="number"
                            className="form-control"
                            id="discount"
                            value={formData.discount}
                            onChange={handleFormChange}
                            placeholder="Enter discount"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="tax">Tax</label>
                          <input
                            type="number"
                            className="form-control"
                            id="tax"
                            value={formData.tax}
                            onChange={handleFormChange}
                            placeholder="Enter tax"
                            required
                          />
                        </div>
                      </div>
                    )}

                    {modalType === "view" && currentSoldOrder && (
                      <div>
                        <p>
                          <strong>Order ID:</strong> {currentSoldOrder.orderID}
                        </p>
                        <p>
                          <strong>Total Amount:</strong>{" "}
                          {currentSoldOrder.totalAmount}
                        </p>
                        <p>
                          <strong>Shipping Address:</strong>{" "}
                          {currentSoldOrder.shippingAddress}
                        </p>
                        <p>
                          <strong>Billing Address:</strong>{" "}
                          {currentSoldOrder.billingAddress}
                        </p>
                        <p>
                          <strong>Order Status:</strong>{" "}
                          {currentSoldOrder.orderStatus}
                        </p>
                        <p>
                          <strong>Payment Status:</strong>{" "}
                          {currentSoldOrder.paymentStatus}
                        </p>
                        <p>
                          <strong>Quantity:</strong> {currentSoldOrder.quantity}
                        </p>
                        <p>
                          <strong>Discount:</strong> {currentSoldOrder.discount}
                        </p>
                        <p>
                          <strong>Tax:</strong> {currentSoldOrder.tax}
                        </p>
                      </div>
                    )}
                    <div className="modal-footer">
                      {modalType === "add" || modalType === "edit" ? (
                        <>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={closeModal}
                          >
                            Close
                          </button>
                          <button type="submit" className="btn btn-primary">
                            Save
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={closeModal}
                        >
                          Close
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SoldOrders;
