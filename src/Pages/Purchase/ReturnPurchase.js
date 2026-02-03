import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../assets/dist/css/adminlte.min.css";
import "../../assets/plugins/fontawesome-free/css/all.min.css";
import "../../assets/plugins/datatables-bs4/css/dataTables.bootstrap4.min.css";
import "../../assets/plugins/datatables-responsive/css/responsive.bootstrap4.min.css";
import "../../assets/plugins/datatables-buttons/css/buttons.bootstrap4.min.css";
import { Dropdown, DropdownButton } from "react-bootstrap";
import axios from "axios";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import $ from "jquery";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const ReturnPurchase = () => {
  const [purchases, setPurchases] = useState([]);
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
  const [entriesPerPage, setEntriesPerPage] = useState(25);
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

  const fetchPurchases = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/purchase-return/getall`
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
  
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
  
    // Add jQuery script at the bottom
    const script = document.createElement("script");
    script.src = "js/JqueryContent.js";
    script.async = true;
    document.body.appendChild(script);
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

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
    if (
      window.confirm("Are you sure you want to delete this purchase return?")
    ) {
      fetch(`${process.env.REACT_APP_BASE_URL}/purchase-return/delete/${id}`, {
        method: "DELETE",
      })
        .then((response) => {
          if (response.status === 204) {
            setPurchases((prevPurchases) =>
              prevPurchases.filter((purchase) => purchase.id !== id)
            );
            toast.success("Purchase return deleted successfully!");
          } else {
            toast.error("Failed to delete purchase return.");
          }
        })
        .catch((error) =>
          toast.error("Error deleting purchase return:", error)
        );
    }
  };

  const handleCancelClick = async (purchaseId) => {
    if (
      window.confirm("Are you sure you want to cancel this purchase return?")
    ) {
      try {
        const apiUrl = `${process.env.REACT_APP_BASE_URL}/purchase-return/updateStatus/${purchaseId}`;
        const payload = {
          status: 2, // Cancel status
        };

        const response = await axios.put(apiUrl, payload, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.status === 200) {
          fetchPurchases();
          toast.success("Purchase return canceled successfully!");
        } else {
          toast.error("Failed to cancel purchase return", response);
        }
      } catch (error) {
        // console.error("Error while canceling purchase return:", error);
        toast.error("Failed to cancel the purchase return. Please try again.");
      }
    }
  };

  const downloadReceipt = (purchaseReturn) => {
    const doc = new jsPDF();

    // Add company logo and header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("FUMA PANEL", 105, 20, { align: "center" });

    doc.setFontSize(16);
    doc.setTextColor(100, 100, 100);
    doc.text("PURCHASE RETURN RECEIPT", 105, 30, { align: "center" });

    // Add receipt details
    doc.setFontSize(12);
    doc.text(`Return No: ${purchaseReturn.purchaseReturnId}`, 20, 50);
    doc.text(`Invoice No: ${purchaseReturn.invoiceNumber || "N/A"}`, 20, 60);
    doc.text(`Date: ${purchaseReturn.orderDate}`, 20, 70);
    doc.text(`Vendor: ${purchaseReturn.vendor}`, 20, 80);

    // Add status and amount information
    doc.text(`Status: ${getStatusText(purchaseReturn.status)}`, 20, 90);
    doc.text(`Total Amount: ₹${purchaseReturn.totalAmount || 0}`, 20, 100);
    doc.text(`Amount Due: ₹${calculateAmountDue(purchaseReturn)}`, 20, 110);

    // Add footer
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("Thank you for your business", 105, 150, { align: "center" });
    doc.text("Generated on: " + new Date().toLocaleDateString(), 105, 160, {
      align: "center",
    });

    // Save the PDF
    doc.save(`PurchaseReturnReceipt_${purchaseReturn.purchaseReturnId}.pdf`);
  };

  const getStatusText = (status) => {
    switch (status) {
      case 0:
        return "Pending";
      case 1:
        return "Accepted";
      case 2:
        return "Rejected";
      case 3:
        return "Refunded";
      case 4:
        return "Credit Note Issued";
      default:
        return "Unknown";
    }
  };

  const calculateAmountDue = (purchaseReturn) => {
    const totalAmount = purchaseReturn.totalAmount || 0;

    if (purchaseReturn.status === 3 || purchaseReturn.status === 4) {
      return 0; // Refunded or Credit Note Issued
    }

    return totalAmount; // Pending, Accepted, or Rejected
  };

  const exportCSV = () => {
    const csvData = purchases.map((purchase) => ({
      Date: purchase.orderDate,
      "Return No": purchase.purchaseReturnId,
      "Invoice No": purchase.invoiceNumber,
      "Reference No": purchase.referenceNumber,
      Vendor: purchase.vendor,
      "Total Items": purchase.totalItems,
      "Total Amount": purchase.totalAmount || 0,
      "Payment Status": getStatusText(purchase.status),
      "Amount Due": calculateAmountDue(purchase),
      "Additional Notes": purchase.additionalNotes,
      "Added By": purchase.addedBy,
    }));

    const csv = [
      Object.keys(csvData[0]),
      ...csvData.map((row) => Object.values(row)),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, "purchase_returns.csv");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      purchases.map((purchase) => ({
        Date: purchase.orderDate,
        "Return No": purchase.purchaseReturnId,
        "Invoice No": purchase.invoiceNumber,
        "Reference No": purchase.referenceNumber,
        Vendor: purchase.vendor,
        "Total Items": purchase.totalItems,
        "Total Amount": purchase.totalAmount || 0,
        "Payment Status": getStatusText(purchase.status),
        "Amount Due": calculateAmountDue(purchase),
        "Additional Notes": purchase.additionalNotes,
        "Added By": purchase.addedBy,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Purchase Returns");
    XLSX.writeFile(wb, "purchase_returns.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Purchase Returns Report", 14, 15);
    doc.setFontSize(12);
    doc.text("Generated on: " + new Date().toLocaleDateString(), 14, 22);

    const headers = [
      "Return No",
      "Date",
      "Invoice No",
      "Vendor",
      "Total Items",
      "Total Amount",
      "Status",
      "Amount Due",
    ];

    const body = purchases.map((p) => [
      p.purchaseReturnId,
      p.orderDate,
      p.invoiceNumber || "N/A",
      p.vendor,
      p.totalItems,
      `₹${p.totalAmount || 0}`,
      getStatusText(p.status),
      `₹${calculateAmountDue(p)}`,
    ]);

    doc.autoTable({
      head: [headers],
      body: body,
      startY: 30,
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
    });

    doc.save("PurchaseReturnsReport.pdf");
  };

  const printData = () => {
    const printWindow = window.open("", "_blank", "width=1000,height=600");

    const tableContent = `
      <html>
        <head>
          <title>Print Purchase Returns</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; }
            th { background-color: #f2f2f2; }
            th, td { text-align: left; }
            .header { text-align: center; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Purchase Return Report</h2>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                ${
                  columnsVisibility.purchaseReturnId ? "<th>Return No</th>" : ""
                }
                ${columnsVisibility.date ? "<th>Date</th>" : ""}
                ${
                  columnsVisibility.referenceNumber ? "<th>Invoice No</th>" : ""
                }
                ${
                  columnsVisibility.referenceNumber
                    ? "<th>Reference No</th>"
                    : ""
                }
                ${columnsVisibility.vendor ? "<th>Vendor</th>" : ""}
                ${columnsVisibility.totalItems ? "<th>Total Items</th>" : ""}
                <th>Total Amount</th>
                <th>Payment Status</th>
                <th>Amount Due</th>
                ${
                  columnsVisibility.additionalNotes
                    ? "<th>Additional Notes</th>"
                    : ""
                }
                ${columnsVisibility.addedBy ? "<th>Added By</th>" : ""}
              </tr>
            </thead>
            <tbody>
              ${purchases
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
                      ? `<td>${purchase.invoiceNumber || "N/A"}</td>`
                      : ""
                  }
                  ${
                    columnsVisibility.referenceNumber
                      ? `<td>${purchase.referenceNumber}</td>`
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
                  <td>₹${purchase.totalAmount || 0}</td>
                  <td>${getStatusText(purchase.status)}</td>
                  <td>₹${calculateAmountDue(purchase)}</td>
                  ${
                    columnsVisibility.additionalNotes
                      ? `<td>${purchase.additionalNotes || ""}</td>`
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
  const currentPurchases = purchases.slice(startIndex, endIndex);

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-12 col-md-6">
                <h1 className="all-heading">List Purchase Return</h1>
                <span className="d-inline d-md-block sub-heading">
                  Manage Purchase Returns
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="content">
          <div className="container-fluid">
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
                        {columnsVisibility.date && <th>Date</th>}
                        {columnsVisibility.purchaseReturnId && (
                          <th>Return No</th>
                        )}
                        {columnsVisibility.status && <th>Status</th>}
                        {columnsVisibility.referenceNumber && (
                          <th>Invoice No</th>
                        )}
                        {columnsVisibility.referenceNumber && (
                          <th>Reference No</th>
                        )}
                        {columnsVisibility.vendor && <th>Vendor</th>}
                        {columnsVisibility.totalItems && <th>Total Items</th>}
                        <th>Total Amount</th>
                        <th>Payment Status</th>
                        <th>Amount Due</th>
                        {columnsVisibility.additionalNotes && (
                          <th>Additional Notes</th>
                        )}
                        {columnsVisibility.addedBy && <th>Added By</th>}
                        {columnsVisibility.addedBy && <th>View Invoice</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {currentPurchases.map((purchase) => (
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
                                  <div className="d-inline-block w-100 btn-view justify-content-center text-secondary">
                                    <i className="dropdown_hover fa fa-eye me-3"></i>
                                    <span>View</span>
                                  </div>
                                </Dropdown.Item>

                                {purchase.status === 0 && (
                                  <>
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
                                        <i className="fa-solid fa-x me-3"></i>
                                        <span>Cancel</span>
                                      </div>
                                    </Dropdown.Item>
                                  </>
                                )}

                                {(purchase.status === 3 ||
                                  purchase.status === 4) && (
                                  <Dropdown.Item
                                    as="button"
                                    onClick={() => downloadReceipt(purchase)}
                                  >
                                    <div className="d-inline-block w-100 btn-download justify-content-center text-secondary">
                                      <i className="fa fa-download me-3"></i>
                                      <span>Download Receipt</span>
                                    </div>
                                  </Dropdown.Item>
                                )}
                              </DropdownButton>
                            </td>
                          )}
                          {columnsVisibility.date && (
                            <td>{purchase.orderDate}</td>
                          )}
                          {columnsVisibility.purchaseReturnId && (
                            <td>{purchase.purchaseReturnId}</td>
                          )}
                          {columnsVisibility.status && (
                            <td>
                              {purchase.status === 0
                                ? "Pending"
                                : purchase.status === 1
                                ? "Accepted"
                                : purchase.status === 2
                                ? "Rejected"
                                : purchase.status === 3
                                ? "Refunded"
                                : purchase.status === 4
                                ? "Credit Note Issued"
                                : "Unknown"}
                            </td>
                          )}
                          {columnsVisibility.referenceNumber && (
                            <td>{purchase.invoiceNumber || "N/A"}</td>
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
                          <td>₹{purchase.totalAmount || 0}</td>
                          <td>{getStatusText(purchase.status)}</td>
                          <td>₹{calculateAmountDue(purchase)}</td>
                          {columnsVisibility.additionalNotes && (
                            <td>{purchase.additionalNotes || ""}</td>
                          )}
                          {columnsVisibility.addedBy && (
                            <td>{purchase.addedBy}</td>
                          )}
                          {columnsVisibility.addedBy && (
                            <td>
                              {purchase.receipt ? (
                                <a
                                  href={`${
                                    process.env.REACT_APP_BASE_URL
                                  }/files/download/${purchase.receipt
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

export default ReturnPurchase;
