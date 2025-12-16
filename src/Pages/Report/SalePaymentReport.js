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

const SalePaymentReport = () => {
  const [purchasePaymentItems, setPurchasePaymentItems] = useState([]);
  const [columnsVisibility, setColumnsVisibility] = useState({
    referenceNo: true,
    paidOn: true,
    amount: true,
    customer: true,
    paymentMethod: true,
    purchase: true,
    addedBy: true,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  useEffect(() => {
    const fetchReportItems = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/transaction/sale`
        );

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();

        if (Array.isArray(data)) {
          setPurchasePaymentItems(data);
        } else {
          console.error("Fetched data is not an array");
          setPurchasePaymentItems([]);
        }
      } catch (error) {
        console.error("Error fetching report items:", error);
        setPurchasePaymentItems([]);
      }

      const script = document.createElement("script");
      script.src = "js/JqueryContent.js";
      script.async = true;
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    };

    fetchReportItems();
  }, []);

  const exportCSV = () => {
    const csvData = purchasePaymentItems.map((item) => ({
      ReferenceNo: item.referenceNo,
      PaidOn: item.paidOn,
      Amount: item.amount,
      customer: item.customer,
      PaymentMethod: item.paymentMethod,
      Purchase: item.purchase,
      addedBy: item.addedBy,
    }));

    const csv = [
      [
        "Reference No",
        "Paid On",
        "Amount",
        "customer",
        "Payment Method",
        "Purchase",
        "addedBy",
      ],
      ...csvData.map((row) => Object.values(row)),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, "purchasePaymentItems.csv");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      purchasePaymentItems.map((item) => ({
        ReferenceNo: item.referenceNo,
        PaidOn: item.paidOn,
        Amount: item.amount,
        customer: item.customer,
        PaymentMethod: item.paymentMethod,
        Purchase: item.purchase,
        addedBy: item.addedBy,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report Items");
    XLSX.writeFile(wb, "purchasePaymentItems.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [
        [
          "Reference No",
          "Paid On",
          "Amount",
          "customer",
          "Payment Method",
          "Purchase",
          "addedBy",
        ],
      ],
      body: purchasePaymentItems.map((item) => [
        item.referenceNo,
        item.paidOn,
        item.amount,
        item.customer,
        item.paymentMethod,
        item.purchase,
        item.addedBy,
      ]),
    });
    doc.save("purchasePaymentItems.pdf");
  };

  const printData = () => {
    const tableContent = `
      <html>
        <head>
          <title>Print Purchase Payment Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; }
            th { background-color: #f2f2f2; }
            th, td { text-align: left; }
            .footer-total { background-color: #e9ecef; font-weight: bold; text-align: center; }
          </style>
        </head>
        <body>
          <h2>Purchase Payment Report</h2>
          <table>
            <thead>
              <tr>
                ${columnsVisibility.referenceNo ? "<th>Reference No</th>" : ""}
                ${columnsVisibility.paidOn ? "<th>Paid On</th>" : ""}
                ${columnsVisibility.amount ? "<th>Amount</th>" : ""}
                ${columnsVisibility.customer ? "<th>Customer</th>" : ""}
                ${
                  columnsVisibility.paymentMethod
                    ? "<th>Payment Method</th>"
                    : ""
                }
                ${columnsVisibility.purchase ? "<th>Purchase</th>" : ""}
                ${columnsVisibility.addedBy ? "<th>Added By</th>" : ""}
              </tr>
            </thead>
            <tbody>
              ${purchasePaymentItems
                .slice(startIndex, endIndex)
                .map(
                  (item) => `
                  <tr>
                    ${
                      columnsVisibility.referenceNo
                        ? `<td>${item.referenceNo}</td>`
                        : ""
                    }
                    ${columnsVisibility.paidOn ? `<td>${item.paidOn}</td>` : ""}
                    ${columnsVisibility.amount ? `<td>${item.amount}</td>` : ""}
                    ${
                      columnsVisibility.customer
                        ? `<td>${item.franchiseName}</td>`
                        : ""
                    }
                    ${
                      columnsVisibility.paymentMethod
                        ? `<td>${item.paymentMethod}</td>`
                        : ""
                    }
                    ${
                      columnsVisibility.purchase
                        ? `<td>${item.purchase}</td>`
                        : ""
                    }
                    ${
                      columnsVisibility.addedBy
                        ? `<td>${item.addedBy}</td>`
                        : ""
                    }
                  </tr>
                `
                )
                .join("")}
            </tbody>
            <tfoot>
              <tr class="footer-total">
                <td colSpan="2"><strong>Total:</strong></td>
                <td id="footer_total_amount" class="display_currency" data-currency_symbol="true">
                  $${totalAmount.toFixed(2)}
                </td>
                <td colSpan="4"></td>
              </tr>
            </tfoot>
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

  const toggleColumn = (col) => {
    setColumnsVisibility((prev) => ({
      ...prev,
      [col]: !prev[col],
    }));
  };

  // Calculate totals dynamically
  const calculateTotals = () => {
    const displayedItems = purchasePaymentItems.slice(startIndex, endIndex);
    const totalAmount = displayedItems.reduce(
      (acc, item) => acc + (parseFloat(item.amount) || 0),
      0
    );

    return {
      totalAmount,
    };
  };

  const { totalAmount } = calculateTotals();

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-12 col-md-6">
                <h1>Sale Payment Report</h1>
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
                        {columnsVisibility.referenceNo && <th>Reference No</th>}
                        {columnsVisibility.paidOn && <th>Paid On</th>}
                        {columnsVisibility.amount && <th>Amount</th>}
                        {columnsVisibility.customer && <th>Customer</th>}
                        {columnsVisibility.paymentMethod && (
                          <th>Payment Method</th>
                        )}
                        {columnsVisibility.purchase && <th>Purchase</th>}
                        {columnsVisibility.addedBy && <th>Added By</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {purchasePaymentItems
                        .slice(startIndex, endIndex)
                        .map((item) => (
                          <tr key={item.id}>
                            {columnsVisibility.referenceNo && (
                              <td>{item.id}</td>
                            )}

                            {columnsVisibility.paidOn && <td>{item.date}</td>}

                            {columnsVisibility.amount && <td>{item.amount}</td>}

                            {columnsVisibility.customer && (
                              <td>{item.franchiseName}</td>
                            )}

                            {columnsVisibility.paymentMethod && (
                              <td>{item.paymentMethod}</td>
                            )}

                            {columnsVisibility.purchase && (
                              <td>{item.transactionType}</td>
                            )}

                            {columnsVisibility.addedBy && (
                              <td>{item.addedBy}</td>
                            )}
                          </tr>
                        ))}
                    </tbody>

                    <tfoot>
                      <tr className="bg-gray font-17 text-center footer-total">
                        <td colSpan="2" rowSpan="1">
                          <strong>Total:</strong>
                        </td>
                        <td
                          id="footer_total_amount"
                          className="display_currency"
                          data-currency_symbol="true"
                          rowSpan="1"
                          colSpan="1"
                        >
                          ${totalAmount.toFixed(2)}
                        </td>
                        <td colSpan="4" rowSpan="1"></td>
                      </tr>
                    </tfoot>
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

export default SalePaymentReport;
