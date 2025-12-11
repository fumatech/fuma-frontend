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
import { Modal } from "react-bootstrap";

const StockAdjustmentReport = () => {
  const [stockAdjustmentReports, setStockAdjustmentReports] = useState([]);
  const [columnsVisibility, setColumnsVisibility] = useState({
    action: true,
    date: true,
    referenceNo: true,
    location: true,
    adjustmentType: true,
    totalAmount: true,
    totalAmountRecovered: true,
    reason: true,
    addedBy: false,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [showModal, setShowModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch(
          "http://localhost:8443/stock-adjustments/getall"
        );
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        setStockAdjustmentReports(data);
      } catch (error) {
        console.error("Failed to fetch stock adjustment reports:", error);
      }
      const script = document.createElement("script");
      script.src = "js/JqueryContent.js";
      script.async = true;
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
    };

    fetchReports();
  }, []);

  const calculateTotals = () => {
    let totalNormal = 0;
    let totalAbnormal = 0;
    let totalRecovered = 0;

    stockAdjustmentReports.forEach((report) => {
      const amount = Number(report.totalAmount) || 0;
      const recovered = Number(report.amountRecovered) || 0;

      if (report.adjustmentType === "normal") {
        totalNormal += amount;
      } else if (report.adjustmentType === "abnormal") {
        totalAbnormal += amount;
      }

      // add recovered ONLY once
      totalRecovered += recovered;
    });
    console.log(totalRecovered);

    return { totalNormal, totalAbnormal, totalRecovered };
  };

  const exportCSV = () => {
    const csvData = stockAdjustmentReports.map((report) => ({
      Date: report.date,
      ReferenceNo: report.referenceNmber,
      Location: report.businessLocation,
      AdjustmentType: report.adjustmentType,
      TotalAmountRecovered: report.amountRecovered,
      Reason: report.reason,
      AddedBy: report.addedBy,
    }));

    const csv = [
      [
        "Date",
        "Reference No",
        "Location",
        "Adjustment Type",
        "Total Amount Recovered",
        "Reason",
        "Added By",
      ],
      ...csvData.map((row) => Object.values(row)),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, "stock_adjustment_reports.csv");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      stockAdjustmentReports.map((report) => ({
        Date: report.date,
        ReferenceNo: report.referenceNumber,
        Location: report.businesslLocation,
        AdjustmentType: report.adjustmentType,
        TotalAmountRecovered: report.amountRecovered,
        Reason: report.reason,
        AddedBy: report.addedBy,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reports");
    XLSX.writeFile(wb, "stock_adjustment_reports.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [
        [
          "Date",
          "Reference No",
          "Location",
          "Adjustment Type",
          "Total Amount Recovered",
          "Reason",
          "Added By",
        ],
      ],
      body: stockAdjustmentReports.map((report) => [
        report.date,
        report.referenceNumber,
        report.businessLocation,
        report.amountRecovered,
        report.adjustmentType,
        report.reason,
        report.addedBy,
      ]),
    });
    doc.save("stock_adjustment_reports.pdf");
  };

  const printData = () => {
    const tableContent = `
    <html>
      <head>
        <title>Print Stock Adjustment Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h2>Stock Adjustment Report</h2>
        <table>
          <thead>
            <tr>
              ${columnsVisibility.date ? "<th>Date</th>" : ""}
              ${columnsVisibility.referenceNo ? "<th>Reference No</th>" : ""}
              ${columnsVisibility.location ? "<th>Location</th>" : ""}
              ${
                columnsVisibility.adjustmentType
                  ? "<th>Adjustment Type</th>"
                  : ""
              }
              ${
                columnsVisibility.totalAmountRecovered
                  ? "<th>Total Amount Recovered</th>"
                  : ""
              }
              ${columnsVisibility.reason ? "<th>Reason</th>" : ""}
              ${columnsVisibility.addedBy ? "<th>Added By</th>" : ""}
            </tr>
          </thead>
          <tbody>
            ${stockAdjustmentReports
              .slice(startIndex, endIndex)
              .map(
                (report) => `
              <tr>
                ${columnsVisibility.date ? `<td>${report.date}</td>` : ""}
                ${
                  columnsVisibility.referenceNo
                    ? `<td>${report.referenceNumber}</td>`
                    : ""
                }
                ${
                  columnsVisibility.location
                    ? `<td>${report.businessLocation}</td>`
                    : ""
                }
                ${
                  columnsVisibility.adjustmentType
                    ? `<td>${report.adjustmentType}</td>`
                    : ""
                }
                ${
                  columnsVisibility.totalAmountRecovered
                    ? `<td>${report.amountRecovered}</td>`
                    : ""
                }
                ${columnsVisibility.reason ? `<td>${report.reason}</td>` : ""}
                ${columnsVisibility.addedBy ? `<td>${report.addedBy}</td>` : ""}
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </body>
    </html>
  `;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(tableContent);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  const handleEntriesChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;

  const handleView = (report) => {
    setSelectedReport(report);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setSelectedReport(null);
  };

  const toggleColumn = (col) => {
    setColumnsVisibility((prev) => ({
      ...prev,
      [col]: !prev[col],
    }));
  };

  const { totalNormal, totalAbnormal, totalRecovered } = calculateTotals();

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-12 col-md-6">
                <h1 className=" all-heading">Stock Adjustment Report</h1>
              </div>
            </div>
            <div className="row">
              <div className="col-sm-6">
                <div className="card cardHover rounded-4 border-0">
                  <div className="card-body">
                    <table className="table no-border">
                      <tbody>
                        <tr>
                          <th>Total Normal:</th>
                          <td>
                            <span className="total_normal">
                              ${totalNormal.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <th>Total Abnormal:</th>
                          <td>
                            <span className="total_abnormal">
                              ${totalAbnormal.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <th>Total Stock Adjustment:</th>
                          <td>
                            <span className="total_amount">
                              ${(totalNormal + totalAbnormal).toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="col-sm-6">
                <div className="card cardHover rounded-4 border-0">
                  <div className="card-body">
                    <table className="table no-border">
                      <tbody>
                        <tr>
                          <th>Total Amount Recovered:</th>
                          <td>
                            <span className="total_recovered">
                              ${totalRecovered.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Overview */}
        {/* <section className="wrapper">
          <div className="container-fluid">
            <div className="row">
              <div className="col-sm-6">
                <div className="card cardHover rounded-4 border-0">
                  <div className="card-body">
                    <table className="table no-border">
                      <tbody>
                        <tr>
                          <th>Total Normal:</th>
                          <td>
                            <span className="total_normal">
                              ${totalNormal.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <th>Total Abnormal:</th>
                          <td>
                            <span className="total_abnormal">
                              ${totalAbnormal.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <th>Total Stock Adjustment:</th>
                          <td>
                            <span className="total_amount">
                              ${totalRecovered.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="col-sm-6">
                <div className="card cardHover rounded-4 border-0">
                  <div className="card-body">
                    <table className="table no-border">
                      <tbody>
                        <tr>
                          <th>Total Amount Recovered:</th>
                          <td>
                            <span className="total_recovered">
                              ${totalRecovered.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section> */}

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
                        {columnsVisibility.date && <th>Date</th>}
                        {columnsVisibility.referenceNo && <th>Reference No</th>}
                        {columnsVisibility.location && <th>Location</th>}
                        {columnsVisibility.adjustmentType && (
                          <th>Adjustment Type</th>
                        )}
                        {columnsVisibility.totalAmount && (
                          <th>Total Amount </th>
                        )}

                        {columnsVisibility.totalAmountRecovered && (
                          <th>Total Amount Recovered</th>
                        )}
                        {columnsVisibility.reason && <th>Reason</th>}
                        {columnsVisibility.addedBy && <th>Added By</th>}
                        {columnsVisibility.action && <th>Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {stockAdjustmentReports
                        .slice(startIndex, endIndex)
                        .map((report, index) => (
                          <tr key={index}>
                            {columnsVisibility.date && <td>{report.date}</td>}
                            {columnsVisibility.referenceNo && (
                              <td>{report.referenceNumber}</td>
                            )}
                            {columnsVisibility.location && (
                              <td>{report.businessLocation}</td>
                            )}
                            {columnsVisibility.adjustmentType && (
                              <td>{report.adjustmentType}</td>
                            )}
                            {columnsVisibility.totalAmount && (
                              <td>{report.totalAmount}</td>
                            )}
                            {columnsVisibility.totalAmountRecovered && (
                              <td>{report.amountRecovered}</td>
                            )}
                            {columnsVisibility.reason && (
                              <td>{report.reason}</td>
                            )}
                            {columnsVisibility.addedBy && (
                              <td>{report.addedBy}</td>
                            )}
                            {columnsVisibility.action && (
                              <td>
                                <button
                                  className="btn btn-view btn-sm mr-2"
                                  onClick={() => handleView(report)}
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

      {/* Modal for viewing detailed report */}
      <Modal show={showModal} onHide={handleClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Stock Adjustment Report Details</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {selectedReport && (
            <div>
              <h4 className="mb-3">
                Stock adjustment details (<b>Reference No:</b>{" "}
                {selectedReport.referenceNumber})
              </h4>

              {/* Date */}
              <div className="text-end mb-3">
                <b>Date:</b> {selectedReport.date}
              </div>

              {/* Business Info */}
              <div className="row mb-4">
                <div className="col-md-4">
                  <b>Business Location:</b>
                  <address>
                    <strong>{selectedReport.businessLocation}</strong>
                  </address>
                </div>

                <div className="col-md-4">
                  <b>Reference Number:</b> {selectedReport.referenceNumber}{" "}
                  <br />
                  <b>Date:</b> {selectedReport.date} <br />
                  <b>Adjustment Type:</b> {selectedReport.adjustmentType} <br />
                  <b>Reason:</b> {selectedReport.reason || "—"} <br />
                </div>
              </div>

              {/* ITEMS TABLE */}
              <div className="table-responsive mb-4">
                <table className="table table-bordered">
                  <thead className="bg-green text-white">
                    <tr>
                      <th>Product</th>
                      <th>Variation</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>

                  <tbody>
                    {selectedReport.stockAdjustmentItems.map((item) => (
                      <tr key={item.id}>
                        <td>{item.productName}</td>
                        <td>{item.productVariationName || "—"}</td>
                        <td>{item.quantity}</td>
                        <td>₹{Number(item.unitSellingPrice).toFixed(2)}</td>
                        <td>
                          ₹
                          {(
                            item.quantity * Number(item.unitSellingPrice)
                          ).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* TOTALS */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <table className="table table-bordered">
                    <tbody>
                      <tr>
                        <th>Total Amount:</th>
                        <td>
                          ₹{Number(selectedReport.totalAmount).toFixed(2)}
                        </td>
                      </tr>

                      <tr>
                        <th>Total Amount Recovered:</th>
                        <td>
                          ₹{Number(selectedReport.amountRecovered).toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* STOCK ACTIVITIES (stockTransaction) */}
              <div className="row">
                <div className="col-12">
                  <strong>Stock Activities:</strong>

                  <table className="table table-bordered mt-2">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Action</th>
                        <th>Quantity</th>
                        <th>Note</th>
                      </tr>
                    </thead>

                    <tbody>
                      {selectedReport.stockTransaction.length === 0 && (
                        <tr>
                          <td colSpan="4" className="text-center">
                            No activity found
                          </td>
                        </tr>
                      )}

                      {selectedReport.stockTransaction.map((tr) => (
                        <tr key={tr.id}>
                          <td>{tr.date}</td>
                          <td>{tr.transactionType}</td>
                          <td>{tr.quantity}</td>
                          <td>{tr.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <button className="btn btn-secondary" onClick={handleClose}>
            Close
          </button>
          <button className="btn btn-primary" onClick={() => window.print()}>
            <i className="fa fa-print"></i> Print
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default StockAdjustmentReport;
