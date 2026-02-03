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

const PaymentReport = () => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [currentDate, setCurrentDate] = useState("");
  // Column visibility
  const [columnsVisibility, setColumnsVisibility] = useState({
    accountName: true,
    paymentMethod: true,
    transactionType: true,
    amount: true,
    date: true,
    addedBy: true,
    note: true,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  // State variables for filters
  const [filterValues, setFilterValues] = useState({
    paymentTypes: [],
    accounts: [],
  });

  const [activeFilters, setActiveFilters] = useState({
    startDate: "",
    endDate: "",
    paymentType: "",
    account: "",
  });
  useEffect(() => {
    const today = new Date();
    setCurrentDate(today.toLocaleDateString());
    fetchPayments();
  }, []);

  // ---------------- Fetch all payments ----------------
  const fetchPayments = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/payment-account/getall`
      );
      if (!response.ok) throw new Error("Network error");
  
      const accounts = await response.json();
  
      // Flatten transactions
      let allPayments = [];
      accounts.forEach((acc) => {
        acc.transactions?.forEach((t) => {
          allPayments.push({
            accountName: acc.accountName,
            accountNumber: acc.accountNumber,
            paymentMethod: t.paymentMethod,
            transactionType: t.transactionType,
            amount: t.amount,
            date: t.date,
            addedBy: t.addedBy,
            note: t.note,
          });
        });
      });
  
      setPayments(allPayments);
      setFilteredPayments(allPayments);
  
      const total = allPayments.reduce((sum, p) => sum + p.amount, 0);
      setTotalAmount(total);
    } catch (error) {
      console.error("Error fetching payment data:", error);
    }
  
    // Add jQuery script at the bottom
    const script = document.createElement("script");
    script.src = "js/JqueryContent.js";
    script.async = true;
    document.body.appendChild(script);
  };
  const [filterOpen, setFilterOpen] = useState(false);
  // Extract filter values when payments data changes
  useEffect(() => {
    if (payments.length > 0) {
      const paymentTypes = [
        ...new Set(payments.map((item) => item.transactionType)),
      ].filter(Boolean);
      const accounts = [
        ...new Set(payments.map((item) => item.accountName)),
      ].filter(Boolean);

      setFilterValues({
        paymentTypes,
        accounts,
      });
    }
  }, [payments]);

  // Apply filters whenever activeFilters or payments changes
  useEffect(() => {
    const filteredData = payments.filter((payment) => {
      const paymentDate = new Date(payment.date);

      // Date range filter
      let dateMatch = true;
      if (activeFilters.startDate && activeFilters.endDate) {
        const startDate = new Date(activeFilters.startDate);
        const endDate = new Date(activeFilters.endDate);
        endDate.setHours(23, 59, 59, 999);

        dateMatch = paymentDate >= startDate && paymentDate <= endDate;
      } else if (activeFilters.startDate) {
        const startDate = new Date(activeFilters.startDate);
        dateMatch = paymentDate >= startDate;
      } else if (activeFilters.endDate) {
        const endDate = new Date(activeFilters.endDate);
        endDate.setHours(23, 59, 59, 999);
        dateMatch = paymentDate <= endDate;
      }

      // Payment Type filter
      const paymentTypeMatch =
        activeFilters.paymentType === "" ||
        payment.transactionType === activeFilters.paymentType;

      // Account filter
      const accountMatch =
        activeFilters.account === "" ||
        payment.accountName === activeFilters.account;

      return dateMatch && paymentTypeMatch && accountMatch;
    });

    setFilteredPayments(filteredData);
  }, [activeFilters, payments]);

  // Filter change handler
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setActiveFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setCurrentPage(1);
  };

  // Reset filters function
  const resetFilters = () => {
    setActiveFilters({
      startDate: "",
      endDate: "",
      paymentType: "",
      account: "",
    });
  };

  // ---------------- CSV Export ----------------
  const exportCSV = () => {
    let csv = "Account Name,Payment Method,Type,Amount,Date,Added By,Note\n";
    filteredPayments.forEach((p) => {
      csv += `${p.accountName},${p.paymentMethod},${p.transactionType},${p.amount},${p.date},${p.addedBy},${p.note}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Payment_Report.csv";
    a.click();
  };

  // ---------------- Excel Export ----------------
  const exportExcel = () => {
    let table =
      "<table><tr><th>Account Name</th><th>Payment Method</th><th>Type</th><th>Amount</th><th>Date</th><th>Added By</th><th>Note</th></tr>";

    filteredPayments.forEach((p) => {
      table += `<tr>
        <td>${p.accountName}</td>
        <td>${p.paymentMethod}</td>
        <td>${p.transactionType}</td>
        <td>${p.amount}</td>
        <td>${p.date}</td>
        <td>${p.addedBy}</td>
        <td>${p.note}</td>
      </tr>`;
    });

    table += "</table>";

    const blob = new Blob([table], {
      type: "application/vnd.ms-excel",
    });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "Payment_Report.xls";
    a.click();
  };

  // ---------------- PDF Export ----------------
  const exportPDF = () => {
    window.print();
  };

  const toggleColumn = (column) => {
    setColumnsVisibility((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  // ---------------- Print Report ----------------
  const printData = () => {
    const printWindow = window.open("", "_blank", "width=800,height=600");

    const rows = filteredPayments
      .map(
        (p) => `
        <tr>
          <td>${p.accountName}</td>
          <td>${p.paymentMethod}</td>
          <td>${p.transactionType}</td>
          <td>${p.amount.toFixed(2)}</td>
          <td>${new Date(p.date).toLocaleDateString()}</td>
          <td>${p.addedBy}</td>
          <td>${p.note || ""}</td>
        </tr>
      `
      )
      .join("");

    const content = `
      <html>
        <head>
          <title>Payment Report</title>
          <style>
            body { font-family: Arial; margin: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f7f7f7; }
          </style>
        </head>
        <body>
          <h2>Payment Report - ${currentDate}</h2>
          <table>
            <thead>
              <tr>
                <th>Account Name</th>
                <th>Payment Method</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Added By</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
            <tfoot>
              <tr>
                <th colspan="3">Total</th>
                <th>${totalAmount.toFixed(2)}</th>
                <th colspan="3"></th>
              </tr>
            </tfoot>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  };

  const handleEntriesChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-12 col-md-6">
                <h1 className=" all-heading">Payment Account report</h1>
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
                style={{
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
                onClick={() => setFilterOpen(!filterOpen)}
              >
                <i className={`fa fa-filter me-3`}></i>
                <span>Filter</span>
              </div>

              <Collapse in={filterOpen}>
                <div className="border-top">
                  <div className="card-body">
                    <div className="row py-2 g-2">
                      {/* Start Date Picker */}
                      <div className="col-md-3">
                        <div className="form-group">
                          <label className="me-2">Start Date:</label>
                          <input
                            type="date"
                            className="form-control"
                            name="startDate"
                            value={activeFilters.startDate}
                            onChange={handleFilterChange}
                          />
                        </div>
                      </div>

                      {/* End Date Picker */}
                      <div className="col-md-3">
                        <div className="form-group">
                          <label className="me-2">End Date:</label>
                          <input
                            type="date"
                            className="form-control"
                            name="endDate"
                            value={activeFilters.endDate}
                            onChange={handleFilterChange}
                          />
                        </div>
                      </div>

                      {/* Payment Type Dropdown */}
                      <div className="col-md-3">
                        <div className="form-group">
                          <label className="me-2">Payment Type:</label>
                          <select
                            className="form-select"
                            name="paymentType"
                            value={activeFilters.paymentType}
                            onChange={handleFilterChange}
                          >
                            <option value="">All Types</option>
                            {filterValues.paymentTypes.map(
                              (paymentType, index) => (
                                <option
                                  key={`type-${index}`}
                                  value={paymentType}
                                >
                                  {paymentType}
                                </option>
                              )
                            )}
                          </select>
                        </div>
                      </div>

                      {/* Account Dropdown */}
                      <div className="col-md-3">
                        <div className="form-group">
                          <label className="me-2">Account:</label>
                          <select
                            className="form-select"
                            name="account"
                            value={activeFilters.account}
                            onChange={handleFilterChange}
                          >
                            <option value="">All Accounts</option>
                            {filterValues.accounts.map((account, index) => (
                              <option key={`account-${index}`} value={account}>
                                {account}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Reset Button */}
                      <div className="col-md-12 d-flex align-items-end">
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
                  {/* TABLE */}
                  <div className="card cardHover rounded-4 shadow border-0">
                    <div className="card-body">
                      <table  id="example1" className="table table-bordered table-striped">
                        <thead>
                          <tr>
                            {columnsVisibility.accountName && (
                              <th>Account Name</th>
                            )}
                            {columnsVisibility.paymentMethod && (
                              <th>Payment Method</th>
                            )}
                            {columnsVisibility.transactionType && (
                              <th>Payment Type</th>
                            )}
                            {columnsVisibility.amount && <th>Amount</th>}
                            {columnsVisibility.date && <th>Date</th>}
                            {columnsVisibility.addedBy && <th>Added By</th>}
                            {columnsVisibility.note && <th>Note</th>}
                          </tr>
                        </thead>

                        <tbody>
                          {filteredPayments.map((p, i) => (
                            <tr key={i}>
                              {columnsVisibility.accountName && (
                                <td>{p.accountName}</td>
                              )}
                              {columnsVisibility.paymentMethod && (
                                <td>{p.paymentMethod}</td>
                              )}
                              {columnsVisibility.transactionType && (
                                <td>{p.transactionType}</td>
                              )}
                              {columnsVisibility.amount && (
                                <td>{p.amount.toFixed(2)}</td>
                              )}
                              {columnsVisibility.date && (
                                <td>{new Date(p.date).toLocaleDateString()}</td>
                              )}
                              {columnsVisibility.addedBy && (
                                <td>{p.addedBy}</td>
                              )}
                              {columnsVisibility.note && <td>{p.note}</td>}
                            </tr>
                          ))}
                        </tbody>

                        <tfoot>
                          <tr>
                            <th colSpan="3">Total</th>
                            <th>{totalAmount.toFixed(2)}</th>
                            <th colSpan="3"></th>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PaymentReport;
