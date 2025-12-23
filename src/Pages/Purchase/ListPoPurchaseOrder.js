import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../assets/dist/css/adminlte.min.css";
import "../../assets/plugins/fontawesome-free/css/all.min.css";
import "../../assets/plugins/datatables-bs4/css/dataTables.bootstrap4.min.css";
import "../../assets/plugins/datatables-responsive/css/responsive.bootstrap4.min.css";
import "../../assets/plugins/datatables-buttons/css/buttons.bootstrap4.min.css";
import { Dropdown, DropdownButton } from "react-bootstrap"; // Make sure you have react-bootstrap installed

import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import $ from "jquery";
import { Link, useNavigate } from "react-router-dom";

const ListPoPurchaseOrder = () => {
  const [purchases, setPurchases] = useState([]);
  const [columnsVisibility, setColumnsVisibility] = useState({
    action: true,
    purchasePoOrderId: true,
    date: true,
    referenceNumber: true,
    location: true,
    vendor: true,
    totalItems: true,
    additionalNotes: true,
    invoice: true,
    addedBy: true,
  });
  const navigate = useNavigate(); // Initialize navigate

  const [modalType, setModalType] = useState(null); // "add", "edit", or "view"
  const [currentPurchase, setCurrentPurchase] = useState(null); // For viewing/editing
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [formData, setFormData] = useState({
    date: "",
    referenceNumber: "",
    location: "",
    vendor: "",
    totalItems: "",
    additionalNotes: "",
    addedBy: "",
  });

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        // Step 1: Fetch all purchases
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/purchase-po-order/getall`
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          const sortedData = data.sort((a, b) => b.id - a.id);

          // Step 2: Fetch totalShippedItems for each purchasePoOrderId
          const updatedPurchases = await Promise.all(
            sortedData.map(async (purchase) => {
              try {
                const shippedResponse = await fetch(
                  `${process.env.REACT_APP_BASE_URL}/purchaseorder/getTotalShippedItems/${purchase.purchasePoOrderId}`
                );
                if (!shippedResponse.ok) {
                  throw new Error("Error fetching totalShippedItems");
                }
                const totalShippedItems = await shippedResponse.json();
                return {
                  ...purchase,
                  totalShippedItems, // Add totalShippedItems to the purchase object
                };
              } catch (error) {
                console.error(
                  `Error fetching totalShippedItems for purchasePoOrderId ${purchase.purchasePoOrderId}:`,
                  error
                );
                return {
                  ...purchase,
                  totalShippedItems: "N/A", // Fallback value in case of error
                };
              }
            })
          );

          setPurchases(updatedPurchases); // Update state with enriched data
        } else {
          console.error("Fetched data is not an array");
          setPurchases([]);
        }
      } catch (error) {
        console.error("Error fetching purchases:", error);
        setPurchases([]);
      }

      // Dynamically load the script
      const script = document.createElement("script");
      script.src = "js/JqueryContent.js";
      script.async = true;
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    };

    fetchPurchases();
  }, []);

  const handleAdd = () => {
    setModalType("add");
  };

  const handleEditClick = (id) => {
    navigate(`/EditPoPurchaseOrder/${id}`);
  };

  const handleViewClick = (id) => {
    navigate(`/ViewPoPurchaseOrder/${id}`);
  };
  const handleDeleteClick = async (orderId, purchasePoOrderId) => {
    if (window.confirm("Are you sure you want to delete this purchase?")) {
      try {
        // ✅ Step 1: Update status using PUT request
        const updateResponse = await fetch(
          `https://fusionmastertech.com:8443/purchaseorder/updateStatusByOrderId/${purchasePoOrderId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: 3 }),
            credentials: "include", // in case you need cookies/sessions
          }
        );

        if (updateResponse.ok) {
          // ✅ Step 2: Proceed with DELETE request
          const deleteResponse = await fetch(
            `${process.env.REACT_APP_BASE_URL}/purchase-po-order/delete/${orderId}`,
            {
              method: "DELETE",
              credentials: "include",
            }
          );

          if (deleteResponse.status === 204) {
            setPurchases((prevPurchases) =>
              prevPurchases.filter(
                (purchase) => purchase.purchasePoOrderId !== orderId
              )
            );
            alert("Purchase deleted successfully!");
          } else {
            alert("Failed to delete purchase.");
          }
        } else {
          alert("Failed to update purchase status.");
        }
      } catch (error) {
        //console.error("Error in delete/update process:", error);
        alert("Error occurred while processing purchase.");
      }
    }
  };

  const exportCSV = () => {
    const csvData = purchases.map((purchase) => ({
      Date: purchase.date,
      referenceNumber: purchase.referenceNumber,
      Location: purchase.location,
      vendor: purchase.vendor,
      totalItems: purchase.totalItems,
      additionalNotes: purchase.additionalNotes,
      AddedBy: purchase.addedBy,
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
        referenceNumber: purchase.referenceNumber,
        Location: purchase.location,
        vendor: purchase.vendor,
        totalItems: purchase.totalItems,
        additionalNotes: purchase.additionalNotes,

        AddedBy: purchase.addedBy,
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
                <h1 className=" all-heading">List Po Purchases Entry</h1>
                <span className="d-inline d-md-block sub-heading">
                  Manage Po Purchase Entries
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="content">
          <div className="container-fluid">
            <div className="card cardHover rounded-4 border-0">
              <div className="d-flex justify-content-end mb-3">
                <Link to="/AddPoPurchaseOrder" className="btn btn-add">
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
                        {/* {columnsVisibility.status && <th>Order Status</th>} */}
                        {columnsVisibility.purchasePoOrderId && (
                          <th>Order Id</th>
                        )}
                        {columnsVisibility.referenceNumber && (
                          <th>Reference No</th>
                        )}
                        {columnsVisibility.date && <th>Purchase Date</th>}
                        {columnsVisibility.vendor && <th>Vendor Name</th>}
                        {columnsVisibility.totalItems && (
                          <th> Total Purchased Items</th>
                        )}
                        {/* {columnsVisibility.totalItems && (
                          <th> Shipped Items</th>
                        )} */}
                        {columnsVisibility.additionalNotes && <th>Notes</th>}
                        {columnsVisibility.invoice && <th>View Invoice</th>}

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
                                <Dropdown.Item
                                  as="button"
                                  onClick={() => handleViewClick(purchase.id)}
                                >
                                  <div className="d-inline-block w-75 btn-view justify-content-center text-secondary">
                                    <i className="dropdown_hover fa fa-eye me-3"></i>
                                    <span>View</span>
                                  </div>
                                </Dropdown.Item>

                                <Dropdown.Item
                                  as="button"
                                  onClick={() => handleEditClick(purchase.id)}
                                >
                                  <div className="d-inline-block w-75 btn-edit justify-content-center text-secondary">
                                    <i className="dropdown_hover fa-solid fa-pen-to-square me-3"></i>
                                    <span>Edit</span>
                                  </div>
                                </Dropdown.Item>

                                <Dropdown.Item
                                  as="button"
                                  onClick={() =>
                                    handleDeleteClick(
                                      purchase.id,
                                      purchase.purchasePoOrderId
                                    )
                                  }
                                >
                                  <div className="d-inline-block w-75 btn-delete justify-content-center text-secondary">
                                    <i className=" fa fa-trash me-3"></i>
                                    <span>Delete</span>
                                  </div>
                                </Dropdown.Item>
                              </DropdownButton>
                            </td>
                          )}
                          {columnsVisibility.status && (
                            <td>
                              {purchase.status === 1
                                ? "Ordered"
                                : purchase.status === 2
                                ? "Pending"
                                : purchase.status === 3
                                ? "Received"
                                : "Unknown"}
                            </td>
                          )}
                          {columnsVisibility.purchasePoOrderId && (
                            <td>{purchase.purchasePoOrderId}</td>
                          )}

                          {columnsVisibility.referenceNumber && (
                            <td>{purchase.referenceNumber}</td>
                          )}
                          {columnsVisibility.date && (
                            <td>{purchase.orderDate}</td>
                          )}

                          {columnsVisibility.vendor && (
                            <td>{purchase.vendor}</td>
                          )}
                          {columnsVisibility.totalItems && (
                            <td>{purchase.totalItems}</td>
                          )}

                          {columnsVisibility.additionalNotes && (
                            <td>{purchase.additionalNotes}</td>
                          )}
                          {columnsVisibility.invoice && (
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

export default ListPoPurchaseOrder;
