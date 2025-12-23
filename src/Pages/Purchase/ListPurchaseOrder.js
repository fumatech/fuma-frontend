import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../assets/dist/css/adminlte.min.css";
import "../../assets/plugins/fontawesome-free/css/all.min.css";
import "../../assets/plugins/datatables-bs4/css/dataTables.bootstrap4.min.css";
import "../../assets/plugins/datatables-responsive/css/responsive.bootstrap4.min.css";
import "../../assets/plugins/datatables-buttons/css/buttons.bootstrap4.min.css";
import { Dropdown, DropdownButton } from "react-bootstrap"; // Make sure you have react-bootstrap installed
import axios from "axios";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import $ from "jquery";
import { Link, useNavigate } from "react-router-dom";

const ListPurchaseOrder = () => {
  const [purchases, setPurchases] = useState([]);
  const [columnsVisibility, setColumnsVisibility] = useState({
    action: true,
    status: true,
    date: true,
    deliverydate: true,
    referenceNumber: true,
    location: true,
    vendor: true,
    totalItems: true,
    shippedItems: true,
    additionalNotes: true,
    addedBy: true,
    purchaseOrderId: true,
  });
  const navigate = useNavigate(); // Initialize navigate

  const [modalType, setModalType] = useState(null); // "add", "edit", or "view"
  const [currentPurchase, setCurrentPurchase] = useState(null); // For viewing/editing
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [formData, setFormData] = useState({
    date: "",
    deliverydate: "",
    referenceNumber: "",
    location: "",
    vendor: "",
    totalItems: "",
    additionalNotes: "",
    addedBy: "",
    purchaseOrderId: "",
  });
  // Declare the fetchPurchases function outside of useEffect
  const fetchPurchases = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/purchaseorder/getall`
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();

      // Check if the fetched data is an array and sort by purchaseOrderId in descending order
      if (Array.isArray(data)) {
        const sortedData = data.sort((a, b) => b.id - a.id);
        setPurchases(sortedData);
      } else {
        console.error("Fetched data is not an array");
        setPurchases([]);
      }
    } catch (error) {
      console.error("Error fetching purchases:", error);
      setPurchases([]);
    }
  };

  useEffect(() => {
    // Call fetchPurchases inside useEffect
    fetchPurchases();
  }, []);

  const handleAdd = () => {
    setModalType("add");
  };

  const handleEditClick = (id) => {
    navigate(`/EditPurchaseOrder/${id}`);
  };

  const handleViewClick = (id) => {
    navigate(`/ViewPurchaseOrder/${id}`);
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
      const apiUrl = `${process.env.REACT_APP_BASE_URL}/purchaseorder/updateStatus/${purchaseId}`;

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
    const csvData = purchases.map((purchase) => ({
      Date: purchase.date,
      deliverydate: purchase.deliverydate,
      ReferenceNumreferenceNumber: purchase.referenceNumber,
      Location: purchase.location,
      vendor: purchase.vendor,
      totalItems: purchase.totalItems,
      additionalNotes: purchase.additionalNotes,
      AddedBy: purchase.addedBy,
      purchaseOrderId: purchase.purchaseOrderId,
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
      purchases.map((purchase) => ({
        Date: purchase.date,
        deliverydate: purchase.deliverydate,
        ReferenceNumreferenceNumber: purchase.referenceNumber,
        Location: purchase.location,
        vendor: purchase.vendor,
        totalItems: purchase.totalItems,
        additionalNotes: purchase.additionalNotes,

        AddedBy: purchase.addedBy,
        purchaseOrderId: purchase.purchaseOrderId,
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
    const body = purchase.map((p) => [
      p.purchaseDate,
      p.referenceNumber,
      p.location,
      p.vendor,
      p.totalItems,
      p.additionalNotes,
      p.addedBy,
      p.purchaseOrderId,
    ]);

    // Add some space before the table
    doc.text("Purchase List", 14, 20); // Title with a slight offset
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
        fillColor: [22, 160, 133], // Bootstrap success color
        textColor: [255, 255, 255], // White text
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240], // Light gray for alternate rows
      },
      margin: { top: 50 }, // Increase top margin for more space above the table
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
                  columnsVisibility.purchaseOrderId
                    ? "<th>purchase OrderId </th>"
                    : ""
                }
                ${columnsVisibility.date ? "<th> Date</th>" : ""}
                                ${
                                  columnsVisibility.deliverydate
                                    ? "<th> Delivery Date</th>"
                                    : ""
                                }

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
              ${purchase
                .map(
                  (purchase) => `
                <tr>
                    ${
                      columnsVisibility.purchaseOrderId
                        ? `<td>${purchase.purchaseOrderId}</td>`
                        : ""
                    }
                  ${
                    columnsVisibility.date
                      ? `<td>${purchase.orderDate}</td>`
                      : ""
                  }
                      ${
                        columnsVisibility.deliverydate
                          ? `<td>${purchase.deliveryDate}</td>`
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
    setCurrentPage(1); // Reset to the first page when entries per page changes
  };

  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const purchase = purchases.slice(startIndex, endIndex);

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-12 col-md-6">
                <h1 className=" all-heading">List Purchase Order</h1>
                <span className="d-inline d-md-block sub-heading">
                  Manage Purchase Orders
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="content">
          <div className="container-fluid">
            <div className="card cardHover rounded-4 border-0">
              <div className="d-flex justify-content-end mb-3">
                <Link to="/PurchaseOrder" className="btn btn-add">
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
                        {columnsVisibility.purchaseOrderId && <th>Order Id</th>}
                        {columnsVisibility.status && <th>Status</th>}

                        {columnsVisibility.date && <th>Ordered Date</th>}
                        {columnsVisibility.deliverydate && (
                          <th>Exp Delivery Date</th>
                        )}

                        {columnsVisibility.referenceNumber && (
                          <th>Reference No</th>
                        )}
                        {columnsVisibility.vendor && <th>vendor</th>}
                        {columnsVisibility.totalItems && <th> Total Items</th>}
                        {columnsVisibility.shippedItems && (
                          <th> Shipped Items</th>
                        )}

                        {columnsVisibility.additionalNotes && (
                          <th>Additional Notes</th>
                        )}

                        {columnsVisibility.addedBy && <th>Added By</th>}
                        {columnsVisibility.addedBy && <th>View Invoice</th>}
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
                          {columnsVisibility.purchaseOrderId && (
                            <td>{purchase.purchaseOrderId}</td>
                          )}
                          {columnsVisibility.status && (
                            <td>
                              {purchase.status === 0
                                ? "Ordered"
                                : purchase.status === 1
                                ? "Accepted"
                                : purchase.status === 2
                                ? "Rejected"
                                : purchase.status === 3
                                ? "Shipped"
                                : purchase.status === 4
                                ? "Completed"
                                : "Unknown"}
                            </td>
                          )}
                          {columnsVisibility.date && (
                            <td>{purchase.orderDate}</td>
                          )}
                          {columnsVisibility.deliverydate && (
                            <td>{purchase.deliveryDate}</td>
                          )}
                          {columnsVisibility.referenceNumber && (
                            <td>{purchase.referenceNumber}</td>
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
                          {columnsVisibility.addedBy && (
                            <td>
                              {purchase.file ? (
                                <a
                                  href={`${
                                    process.env.REACT_APP_BASE_URL
                                  }/files/download/${purchase.file
                                    .split("/")
                                    .pop()}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <i className="fas fa-download me-1"></i>{" "}
                                  Download
                                </a>
                              ) : (
                                "No Invoice"
                              )}
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

export default ListPurchaseOrder;
