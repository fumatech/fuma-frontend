import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../assets/dist/css/adminlte.min.css";
import "../../assets/plugins/fontawesome-free/css/all.min.css";
import "../../assets/plugins/datatables-bs4/css/dataTables.bootstrap4.min.css";
import "../../assets/plugins/datatables-responsive/css/responsive.bootstrap4.min.css";
import "../../assets/plugins/datatables-buttons/css/buttons.bootstrap4.min.css";
import { Collapse } from "react-bootstrap";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import $ from "jquery";

const CashFlow = () => {
  const [allTransactions, setAllTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);

  const [columnsVisibility, setColumnsVisibility] = useState({
    date: true,
    account: true,
    description: true,
    paymentMethod: true,
    paymentDetails: true,
    debit: true,
    credit: true,
    accountBalance: true,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  // Filter States
  const [filterOpen, setFilterOpen] = useState(false);

  const [filterValues, setFilterValues] = useState({
    accounts: [],
    paymentMethods: [],
    transactionTypes: [],
  });

  const [activeFilters, setActiveFilters] = useState({
    startDate: "",
    endDate: "",
    account: "",
    paymentMethod: "",
    transactionType: "",
  });

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_BASE_URL}/payment-account/getall`
        );
        const data = await res.json();

        const flattenedRows = [];

        data.forEach((account) => {
          // Step 1: sort transactions by date ASC
          const sortedTx = [...account.transactions].sort((a, b) => {
            return new Date(a.date || 0) - new Date(b.date || 0);
          });

          let runningBalance = 0;

          sortedTx.forEach((tx) => {
            let debit = 0;
            let credit = 0;

            const type = tx.transactionType?.toLowerCase();

            if (
              ["sale", "deposit", "credit note", "opening_balance"].includes(
                type
              )
            ) {
              credit = tx.amount;
              runningBalance += tx.amount;
            } else if (["expense", "payment"].includes(type)) {
              debit = tx.amount;
              runningBalance -= tx.amount;
            }

            flattenedRows.push({
              id: tx.id,
              date: tx.date ? tx.date.split("T")[0] : "",
              account: account.accountName,
              description: tx.transactionType,
              paymentMethod: tx.paymentMethod || "",
              paymentDetails: tx.note || "",
              debit,
              credit,
              accountBalance: tx.balance,
              totalBalance: account.balance,
            });
          });
        });

        flattenedRows.sort((a, b) => new Date(b.date) - new Date(a.date));

        setAllTransactions(flattenedRows);
        setFilteredTransactions(flattenedRows);

        // extract filter values
        const accounts = [
          ...new Set(flattenedRows.map((t) => t.account)),
        ].filter(Boolean);
        const paymentMethods = [
          ...new Set(flattenedRows.map((t) => t.paymentMethod)),
        ].filter(Boolean);
        const transactionTypes = [
          ...new Set(flattenedRows.map((t) => t.description)),
        ].filter(Boolean);

        setFilterValues({
          accounts,
          paymentMethods,
          transactionTypes,
        });
      } catch (err) {
        console.error("Error:", err);
      }
    };

    fetchTransactions();
  }, []);
  // Apply all filters
  useEffect(() => {
    let data = allTransactions;

    // Date Start Filter
    if (activeFilters.startDate) {
      const start = new Date(activeFilters.startDate);
      data = data.filter((t) => new Date(t.date) >= start);
    }

    // Date End Filter
    if (activeFilters.endDate) {
      const end = new Date(activeFilters.endDate);
      end.setHours(23, 59, 59);
      data = data.filter((t) => new Date(t.date) <= end);
    }

    // Account Filter
    if (activeFilters.account) {
      data = data.filter((t) => t.account === activeFilters.account);
    }

    // Payment Method Filter
    if (activeFilters.paymentMethod) {
      data = data.filter(
        (t) => t.paymentMethod === activeFilters.paymentMethod
      );
    }

    // Transaction Type Filter
    if (activeFilters.transactionType) {
      data = data.filter(
        (t) => t.description === activeFilters.transactionType
      );
    }

    setFilteredTransactions(data);
  }, [activeFilters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setActiveFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  // Reset Filters
  const resetFilters = () => {
    setActiveFilters({
      startDate: "",
      endDate: "",
      account: "",
      paymentMethod: "",
      transactionType: "",
    });
  };
  // ---------- Part 3 ----------

  // Export CSV
  const exportCSV = () => {
    const csvData = filteredTransactions.map((t) => ({
      Date: t.date,
      Account: t.account,
      Description: t.description,
      PaymentMethod: t.paymentMethod,
      PaymentDetails: t.paymentDetails,
      Debit: t.debit,
      Credit: t.credit,
      AccountBalance: t.accountBalance,
      TotalBalance: t.totalBalance,
    }));

    const csv = [
      [
        "Date",
        "Account",
        "Description",
        "Payment Method",
        "Payment Details",
        "Debit",
        "Credit",
        "Account Balance",
        "Total Balance",
      ],
      ...csvData.map((row) => Object.values(row)),
    ]
      .map((row) =>
        row
          .map((cell) => {
            if (cell === null || cell === undefined) return "";
            const val = String(cell).replace(/"/g, '""');
            return `"${val}"`;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "cashflow.csv");
  };

  // Export Excel
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredTransactions.map((t) => ({
        Date: t.date,
        Account: t.account,
        Description: t.description,
        PaymentMethod: t.paymentMethod,
        PaymentDetails: t.paymentDetails,
        Debit: t.debit,
        Credit: t.credit,
        AccountBalance: t.accountBalance,
        TotalBalance: t.totalBalance,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CashFlow");
    XLSX.writeFile(wb, "cashflow.xlsx");
  };

  // Export PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    const headers = [
      "Date",
      "Account",
      "Description",
      "Payment Method",
      "Payment Details",
      "Debit",
      "Credit",
      "Account Balance",
      "Total Balance",
    ];

    const body = filteredTransactions
      .slice(startIndex, endIndex)
      .map((t) => [
        t.date,
        t.account,
        t.description,
        t.paymentMethod,
        t.paymentDetails,
        t.debit,
        t.credit,
        t.accountBalance,
        t.totalBalance,
      ]);

    doc.text("Cash Flow Transactions", 14, 20);
    doc.setFontSize(12);
    doc.autoTable({
      head: [headers],
      body,
      startY: 30,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 3, overflow: "linebreak" },
      headStyles: { fillColor: [22, 160, 133], textColor: [255, 255, 255] },
    });

    const totalDebit = filteredTransactions
      .reduce((acc, t) => acc + (t.debit || 0), 0)
      .toFixed(2);
    const totalCredit = filteredTransactions
      .reduce((acc, t) => acc + (t.credit || 0), 0)
      .toFixed(2);

    doc.text(
      `Total Debit: $${totalDebit}`,
      14,
      doc.autoTable.previous.finalY + 10
    );
    doc.text(
      `Total Credit: $${totalCredit}`,
      14,
      doc.autoTable.previous.finalY + 20
    );

    doc.save("CashFlow.pdf");
  };

  // Print
  const printData = () => {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    const html = `
    <html>
      <head>
        <title>Cash Flow Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h2>Cash Flow Report</h2>
        <table>
          <thead>
            <tr>
              ${columnsVisibility.date ? "<th>Date</th>" : ""}
              ${columnsVisibility.account ? "<th>Account</th>" : ""}
              ${columnsVisibility.description ? "<th>Description</th>" : ""}
              ${
                columnsVisibility.paymentMethod ? "<th>Payment Method</th>" : ""
              }
              ${
                columnsVisibility.paymentDetails
                  ? "<th>Payment Details</th>"
                  : ""
              }
              ${columnsVisibility.debit ? "<th>Debit</th>" : ""}
              ${columnsVisibility.credit ? "<th>Credit</th>" : ""}
              ${
                columnsVisibility.accountBalance
                  ? "<th>Account Balance</th>"
                  : ""
              }
            </tr>
          </thead>
          <tbody>
            ${filteredTransactions
              .slice(startIndex, endIndex)
              .map(
                (t) => `
              <tr>
                ${columnsVisibility.date ? `<td>${t.date}</td>` : ""}
                ${columnsVisibility.account ? `<td>${t.account}</td>` : ""}
                ${
                  columnsVisibility.description
                    ? `<td>${t.description}</td>`
                    : ""
                }
                ${
                  columnsVisibility.paymentMethod
                    ? `<td>${t.paymentMethod}</td>`
                    : ""
                }
                ${
                  columnsVisibility.paymentDetails
                    ? `<td>${t.paymentDetails}</td>`
                    : ""
                }
                ${columnsVisibility.debit ? `<td>${t.debit}</td>` : ""}
                ${columnsVisibility.credit ? `<td>${t.credit}</td>` : ""}
                ${
                  columnsVisibility.accountBalance
                    ? `<td>${t.accountBalance}</td>`
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
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  // Column toggle
  const toggleColumn = (column) => {
    setColumnsVisibility((prev) => ({ ...prev, [column]: !prev[column] }));
  };

  // Pagination helpers
  const handleEntriesChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const totalPages =
    Math.ceil(filteredTransactions.length / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const visibleRows = filteredTransactions.slice(startIndex, endIndex);

  // Totals for visible rows
  const totalDebit = visibleRows
    .reduce((acc, t) => acc + (t.debit || 0), 0)
    .toFixed(2);
  const totalCredit = visibleRows
    .reduce((acc, t) => acc + (t.credit || 0), 0)
    .toFixed(2);
  // ---------- Part 4 (JSX) ----------
  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-12 col-md-6">
                <h1 className="all-heading">Cash Flow</h1>
                <span className="d-inline d-md-block sub-heading">
                  Manage Cash Flow Transactions
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="content">
          <div className="container-fluid">
            {/* Filter Card */}
            <div className="card card-default rounded-4 border-0 cardHover mb-3">
              <div
                className="my- p-3 d-flex align-items-center"
                style={{ cursor: "pointer", fontWeight: "bold" }}
                onClick={() => setFilterOpen(!filterOpen)}
              >
                <i className="fa fa-filter me-3"></i>
                <span>Filter</span>
              </div>

              <Collapse in={filterOpen}>
                <div className="border-top">
                  <div className="card-body">
                    <div className="row py-2 g-2">
                      {/* Start Date */}
                      <div className="col-md-3">
                        <label>Start Date:</label>
                        <input
                          type="date"
                          className="form-control"
                          name="startDate"
                          value={activeFilters.startDate}
                          onChange={handleFilterChange}
                        />
                      </div>

                      {/* End Date */}
                      <div className="col-md-3">
                        <label>End Date:</label>
                        <input
                          type="date"
                          className="form-control"
                          name="endDate"
                          value={activeFilters.endDate}
                          onChange={handleFilterChange}
                        />
                      </div>

                      {/* Account */}
                      <div className="col-md-3">
                        <label>Account</label>
                        <select
                          className="form-select"
                          name="account"
                          value={activeFilters.account}
                          onChange={handleFilterChange}
                        >
                          <option value="">All Accounts</option>
                          {filterValues.accounts.map((a, i) => (
                            <option key={i} value={a}>
                              {a}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Payment Method */}
                      <div className="col-md-3">
                        <label>Payment Method</label>
                        <select
                          className="form-select"
                          name="paymentMethod"
                          value={activeFilters.paymentMethod}
                          onChange={handleFilterChange}
                        >
                          <option value="">All Methods</option>
                          {filterValues.paymentMethods.map((m, i) => (
                            <option key={i} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Transaction Type */}
                      <div className="col-md-3 mt-2">
                        <label>Transaction Type</label>
                        <select
                          className="form-select"
                          name="transactionType"
                          value={activeFilters.transactionType}
                          onChange={handleFilterChange}
                        >
                          <option value="">All Types</option>
                          {filterValues.transactionTypes.map((t, i) => (
                            <option key={i} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Reset */}
                      <div className="col-md-12 d-flex align-items-end mt-3">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={resetFilters}
                          disabled={!Object.values(activeFilters).some(Boolean)}
                        >
                          <i className="fa fa-times me-1"></i> Reset All Filters
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Collapse>
            </div>

            {/* Actions + Table Card */}
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
                        {columnsVisibility.date && <th>Date</th>}
                        {columnsVisibility.account && <th>Account</th>}
                        {columnsVisibility.description && <th>Description</th>}
                        {columnsVisibility.paymentMethod && (
                          <th>Payment Method</th>
                        )}
                        {columnsVisibility.paymentDetails && (
                          <th>Payment Details</th>
                        )}
                        {columnsVisibility.debit && <th>Debit</th>}
                        {columnsVisibility.credit && <th>Credit</th>}
                        {columnsVisibility.accountBalance && (
                          <th>Account Balance</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRows.map((t) => (
                        <tr key={t.id}>
                          {columnsVisibility.date && <td>{t.date}</td>}
                          {columnsVisibility.account && <td>{t.account}</td>}
                          {columnsVisibility.description && (
                            <td>{t.description}</td>
                          )}
                          {columnsVisibility.paymentMethod && (
                            <td>{t.paymentMethod}</td>
                          )}
                          {columnsVisibility.paymentDetails && (
                            <td>{t.paymentDetails}</td>
                          )}
                          {columnsVisibility.debit && <td>{t.debit}</td>}
                          {columnsVisibility.credit && <td>{t.credit}</td>}
                          {columnsVisibility.accountBalance && (
                            <td>{t.accountBalance}</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray font-17 footer-total text-center">
                        <td colSpan={columnsVisibility.debit ? 5 : 4}>
                          <strong>Total:</strong>
                        </td>

                        {columnsVisibility.debit && (
                          <td className="footer_total_debit">$ {totalDebit}</td>
                        )}

                        {columnsVisibility.credit && (
                          <td className="footer_total_credit">
                            $ {totalCredit}
                          </td>
                        )}

                        <td colSpan={columnsVisibility.action ? 2 : 1}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Pagination */}
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    Showing {startIndex + 1} to{" "}
                    {Math.min(endIndex, filteredTransactions.length)} of{" "}
                    {filteredTransactions.length} entries
                  </div>
                  <div>
                    <nav>
                      <ul className="pagination mb-0">
                        <li
                          className={`page-item ${
                            currentPage === 1 ? "disabled" : ""
                          }`}
                        >
                          <button
                            className="page-link"
                            onClick={() => setCurrentPage(1)}
                          >
                            First
                          </button>
                        </li>
                        <li
                          className={`page-item ${
                            currentPage === 1 ? "disabled" : ""
                          }`}
                        >
                          <button
                            className="page-link"
                            onClick={() =>
                              setCurrentPage((p) => Math.max(1, p - 1))
                            }
                          >
                            Prev
                          </button>
                        </li>
                        <li className="page-item disabled">
                          <span className="page-link">
                            {currentPage} / {totalPages}
                          </span>
                        </li>
                        <li
                          className={`page-item ${
                            currentPage === totalPages ? "disabled" : ""
                          }`}
                        >
                          <button
                            className="page-link"
                            onClick={() =>
                              setCurrentPage((p) => Math.min(totalPages, p + 1))
                            }
                          >
                            Next
                          </button>
                        </li>
                        <li
                          className={`page-item ${
                            currentPage === totalPages ? "disabled" : ""
                          }`}
                        >
                          <button
                            className="page-link"
                            onClick={() => setCurrentPage(totalPages)}
                          >
                            Last
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );

  // End component
};

export default CashFlow;
