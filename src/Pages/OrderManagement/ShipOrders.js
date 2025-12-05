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

const ShipOrders = () => {
  const [shipOrders, setShipOrders] = useState([]);
  const [userEmail, setUserEmail] = useState(null);
  const navigate = useNavigate(); // Initialize navigate
  const [columnsVisibility, setColumnsVisibility] = useState({
    orderStatus: true,
    action: true,
    orderDate: true,
    orderId: true,
    referenceNumber: true,
    location: true,
    customer: true,
    totalItems: true,
    updatedItems: true, // Change 'totalItems' to 'updatedItems'
    additionalNotes: true,
    orderedBy: true,
  });

  const [modalType, setModalType] = useState(null); // "accept", "reject", "view"
  const [currentOrder, setCurrentOrder] = useState(null); // For viewing/editing
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [formData, setFormData] = useState({
    orderId: "",
    orderDate: "",
    customerName: "",
    totalQuantityOrdered: "",
    customerAddress: "",
    contactInformation: "",
    custom1: "",
  });

  useEffect(() => {
    const email = sessionStorage.getItem("userEmail");
    if (email) {
      setUserEmail(email);
    }
    const fetchShipOrders = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/purchaseorder/getShipOrders`
        );
        console.log(response.data);
        if (!response.ok) throw new Error("Network response was not ok");

        const data = await response.json();
        if (Array.isArray(data)) {
          setShipOrders(data); // Only pending orders will be shown in this view
        } else {
          console.error("Fetched data is not an array");
          setShipOrders([]);
        }
      } catch (error) {
        console.error("Error fetching pending orders:", error);
        setShipOrders([]);
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

    fetchShipOrders();
  }, []);

  const exportCSV = () => {
    const csvData = shipOrders.map((order) => ({
      "Vendor Action": order.vendorAction,
      Action: order.action,
      "Order ID": order.orderId,
      "Reference Number": order.referenceNumber,
      Location: order.location,
      Customer: order.customerName,
      "Total Items": order.totalItems,
      "Updated Items": order.updatedItems, // Add Updated Items
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
        "Updated Items", // Add Updated Items in the header
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
      shipOrders.map((order) => ({
        "Vendor Action": order.vendorAction,
        Action: order.action,
        "Order ID": order.orderId,
        "Reference Number": order.referenceNumber,
        Location: order.location,
        Customer: order.customerName,
        "Total Items": order.totalItems,
        "Updated Items": order.updatedItems, // Add Updated Items
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
          "Updated Items", // Add Updated Items in the header
          "Additional Notes",
          "Ordered By",
        ],
      ],
      body: shipOrders.map((order) => [
        order.vendorAction,
        order.action,
        order.orderId,
        order.referenceNumber,
        order.location,
        order.customerName,
        order.totalItems,
        order.updatedItems, // Add Updated Items to the body
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

    // Ensure the new column is included in the print view
    $clonedContainer.find("thead th:nth-child(8)").text("Updated Items"); // Update the header
    $clonedContainer.find("tbody td:nth-child(8)").each((index, td) => {
      const order = shipOrders[index];
      td.innerText = order.updatedItems; // Set the Updated Items data in the body
    });

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

  const handleFormChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
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

  // const handleVendorAction = async (action, order) => {
  //   if (action === "view") {
  //     // For the "view" action, just open the modal and set the current order
  //     setModalType("view");
  //     setCurrentOrder(order); // Set the current order to be viewed
  //   } else {
  //     const purchaseStatus = action === "accept" ? 1 : 2; // 1 for accept, 2 for reject
  //     try {
  //       const response = await fetch(
  //         `${process.env.REACT_APP_BASE_URL}/purchaseorder/updateStatus/${order.id}`,
  //         {
  //           method: "PUT",
  //           headers: {
  //             "Content-Type": "application/json",
  //           },
  //           body: JSON.stringify({ purchaseStatus }),
  //         }
  //       );
  //       if (response.ok) {
  //         // After updating the order, refetch the orders to reflect the changes
  //         fetchShipOrders();
  //         alert(`Order ${action}ed successfully.`);
  //       } else {
  //         alert("Failed to update the order status.");
  //       }
  //     } catch (error) {
  //       console.error("Error updating order status:", error);
  //       alert("An error occurred while updating the order status.");
  //     }
  //   }
  // };

  const fetchShipOrders = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/purchaseorder/getShipOrders`
      );
      if (!response.ok) throw new Error("Network response was not ok");

      const data = await response.json();
      if (Array.isArray(data)) {
        setShipOrders(data); // Update state with fetched data
      } else {
        console.error("Fetched data is not an array");
        setShipOrders([]); // Reset if data is not an array
      }
    } catch (error) {
      console.error("Error fetching pending orders:", error);
      setShipOrders([]); // Reset state in case of error
    }
  };

  const handleViewClick = (id) => {
    navigate(`/ViewShipOrders/${id}`);
  };

  const handleVendorActions = (e, order) => {
    if (e.target.value === "View") {
      navigate(`/EditOd/${order.id}`);
    }
  };

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-12 col-md-6">
                <h1 className="all-heading">Ship Orders</h1>
                <span className="d-inline d-md-block sub-heading">
                  Manage View Orders
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
                        {columnsVisibility.orderStatus && <th>Order Status</th>}
                        {columnsVisibility.orderDate && (
                          <th>
                            &nbsp;&nbsp;Date&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                          </th>
                        )}
                        {columnsVisibility.orderId && <th>Order ID</th>}
                        {columnsVisibility.referenceNumber && (
                          <th>Reference Number</th>
                        )}
                        {columnsVisibility.location && <th>Location</th>}
                        {columnsVisibility.customer && <th>Customer</th>}
                        {columnsVisibility.totalItems && (
                          <th>ordered Quantity</th>
                        )}
                        {columnsVisibility.updatedItems && (
                          <th>Shipped Quantity</th>
                        )}{" "}
                        {/* Change this line */}
                        {columnsVisibility.additionalNotes && (
                          <th>Additional Notes</th>
                        )}
                        {columnsVisibility.orderedBy && <th>Ordered By</th>}
                        {columnsVisibility.action && <th>Action</th>}{" "}
                        {/* Move this to the last position */}
                      </tr>
                    </thead>
                    <tbody>
                      {shipOrders
                        .sort(
                          (a, b) =>
                            new Date(b.orderDate) - new Date(a.orderDate)
                        ) // Sort by date (latest first)
                        .slice(startIndex, endIndex) // Paginate
                        .map((order) => (
                          <tr key={order.orderId}>
                            {columnsVisibility.orderStatus && (
                              <td>
                                <p>Shipped</p>
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
                              <td>{order.customer}</td>
                            )}
                            {columnsVisibility.totalItems && (
                              <td>{order.totalItems}</td>
                            )}
                            {columnsVisibility.updatedItems && (
                              <td>{order.totalShippedItems}</td>
                            )}
                            {columnsVisibility.additionalNotes && (
                              <td>{order.additionalNotes}</td>
                            )}
                            {columnsVisibility.orderedBy && (
                              <td>{order.addedBy}</td>
                            )}
                            {columnsVisibility.action && (
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
      </div>
    </div>
  );
};

export default ShipOrders;
