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

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [columnsVisibility, setColumnsVisibility] = useState({
    orderName: true,
    orderShortCode: true,
    productName: true,
    productCode: true,
    orderTitle: true,
    action: true,
  });
  const [modalType, setModalType] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [formData, setFormData] = useState({
    orderName: "",
    orderShortCode: "",
    productName: "",
    productCode: "",
    orderTitle: "",
  });

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/orderList/getall`
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          setOrders(data);
        } else {
          console.error("Fetched data is not an array");
          setOrders([]);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
        setOrders([]);
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

    fetchOrders();
  }, []);

  const exportCSV = () => {
    const csvData = orders.map((order) => ({
      OrderName: order.orderName,
      OrderShortCode: order.orderShortCode,
      ProductName: order.productName,
      ProductCode: order.productCode,
      OrderTitle: order.orderTitle,
    }));

    const csv = [
      [
        "Order Name",
        "Order Short Code",
        "Product Name",
        "Product Code",
        "Order Title",
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
      orders.map((order) => ({
        OrderName: order.orderName,
        OrderShortCode: order.orderShortCode,
        ProductName: order.productName,
        ProductCode: order.productCode,
        OrderTitle: order.orderTitle,
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
          "Order Name",
          "Order Short Code",
          "Product Name",
          "Product Code",
          "Order Title",
        ],
      ],
      body: orders.map((order) => [
        order.orderName,
        order.orderShortCode,
        order.productName,
        order.productCode,
        order.orderTitle,
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
      '<link rel="stylesheet" href="httpss://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">'
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
      if (modalType === "edit" && currentOrder) {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/orders/update/${currentOrder.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ ...formData, id: currentOrder.id }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update order");
        }

        const updatedOrder = await response.json();
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === updatedOrder.id ? updatedOrder : order
          )
        );
        closeModal();
        alert("Order updated successfully!");
      } else if (modalType === "add") {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/orders/save`,
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
        setOrders((prevOrders) => [...prevOrders, newOrder]);
        closeModal();
        alert("Order added successfully!");
      }
    } catch (error) {
      console.error("Error saving order:", error);
      alert("Error saving order");
    }
  };

  const closeModal = () => {
    setModalType(null);
    setCurrentOrder(null);
    setFormData({
      orderName: "",
      orderShortCode: "",
      productName: "",
      productCode: "",
      orderTitle: "",
    });
  };

  const handleEdit = (id) => {
    const orderToEdit = orders.find((order) => order.id === id);
    if (orderToEdit) {
      setCurrentOrder(orderToEdit);
      setFormData({
        orderName: orderToEdit.orderName,
        orderShortCode: orderToEdit.orderShortCode,
        productName: orderToEdit.productName,
        productCode: orderToEdit.productCode,
        orderTitle: orderToEdit.orderTitle,
      });
      setModalType("edit");
    }
  };

  const handleView = (id) => {
    const orderToView = orders.find((order) => order.id === id);
    if (orderToView) {
      setCurrentOrder(orderToView);
      setModalType("view");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/orders/delete/${id}`,
          {
            method: "DELETE",
          }
        );

        if (response.status === 204) {
          setOrders((prevOrders) =>
            prevOrders.filter((order) => order.id !== id)
          );
          alert("Order deleted successfully!");
        } else {
          alert("Failed to delete order.");
        }
      } catch (error) {
        console.error("Error deleting order:", error);
        alert("Error deleting order");
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
                <h1 className="all-heading ">Order List</h1>
                <span className="d-inline d-md-block sub-heading">
                  Manage Orders
                </span>
              </div>
            </div>
          </div>
        </section>
        <section className="content">
          <div className="container-fluid">
            <div className="card cardHover rounded-4 border-0 ">
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
                        {columnsVisibility.orderName && <th>Order Name</th>}
                        {columnsVisibility.orderShortCode && (
                          <th>Order Short Code</th>
                        )}
                        {columnsVisibility.productName && <th>Product Name</th>}
                        {columnsVisibility.productCode && <th>Product Code</th>}
                        {columnsVisibility.orderTitle && <th>Order Title</th>}
                        {columnsVisibility.action && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(startIndex, endIndex).map((order) => (
                        <tr key={order.id}>
                          {columnsVisibility.orderName && (
                            <td>{order.orderName}</td>
                          )}
                          {columnsVisibility.orderShortCode && (
                            <td>{order.orderShortCode}</td>
                          )}
                          {columnsVisibility.productName && (
                            <td>{order.productName}</td>
                          )}
                          {columnsVisibility.productCode && (
                            <td>{order.productCode}</td>
                          )}
                          {columnsVisibility.orderTitle && (
                            <td>{order.orderTitle}</td>
                          )}
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

        {/* Modal */}
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
                          <label htmlFor="orderName">Order Name</label>
                          <input
                            type="text"
                            className="form-control"
                            id="orderName"
                            value={formData.orderName}
                            onChange={handleFormChange}
                            placeholder="Enter order name"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="orderShortCode">
                            Order Short Code
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="orderShortCode"
                            value={formData.orderShortCode}
                            onChange={handleFormChange}
                            placeholder="Enter order short code"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="productName">Product Name</label>
                          <input
                            type="text"
                            className="form-control"
                            id="productName"
                            value={formData.productName}
                            onChange={handleFormChange}
                            placeholder="Enter product name"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="productCode">Product Code</label>
                          <input
                            type="text"
                            className="form-control"
                            id="productCode"
                            value={formData.productCode}
                            onChange={handleFormChange}
                            placeholder="Enter product code"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="orderTitle">Order Title</label>
                          <input
                            type="text"
                            className="form-control"
                            id="orderTitle"
                            value={formData.orderTitle}
                            onChange={handleFormChange}
                            placeholder="Enter order title"
                            required
                          />
                        </div>
                      </div>
                    )}

                    {modalType === "view" && currentOrder && (
                      <div>
                        <p>
                          <strong>Order Name:</strong> {currentOrder.orderName}
                        </p>
                        <p>
                          <strong>Order Short Code:</strong>{" "}
                          {currentOrder.orderShortCode}
                        </p>
                        <p>
                          <strong>Product Name:</strong>{" "}
                          {currentOrder.productName}
                        </p>
                        <p>
                          <strong>Product Code:</strong>{" "}
                          {currentOrder.productCode}
                        </p>
                        <p>
                          <strong>Order Title:</strong>{" "}
                          {currentOrder.orderTitle}
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

export default OrderList;
