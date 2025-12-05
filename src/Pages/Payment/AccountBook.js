import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import $ from "jquery";
function AccountBook() {
  const [data, setData] = useState([]);
  const [formData, setFormData] = useState({
    date: "",
    description: "",
    note: "",
    addedBy: "",
    debit: "",
    credit: "",
    balance: "",
  });
  const [editModal, setEditModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const { id } = useParams();
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [columnsVisibility, setColumnsVisibility] = useState({
    date: true,
    description: true,
    note: true,
    type: true,
    addedBy: true,
    debit: true,
    credit: true,
    balance: true,
    action: true,
  });

  const handleEntriesChange = (e) => {
    setEntriesPerPage(e.target.value);
  };

  const toggleColumn = (col) => {
    setColumnsVisibility({
      ...columnsVisibility,
      [col]: !columnsVisibility[col],
    });
  };

  const startIndex = 0;
  const endIndex = entriesPerPage;

  const [account, setAccount] = useState({
    name: "",
    type: "",
    number: "",
    balance: "",
  });

  const exportCSV = () => {
    const headers = [
      "Date",
      "Description",
      "Payment Method",
      "Payment Details",
      "Added By",
      "Debit",
      "type",
      "Credit",
      "Balance",
    ];

    const csvRows = [
      headers.join(","),
      ...data.transactions.map((entry) =>
        [
          entry.date,
          entry.description,
          entry.addedBy,
          entry.type,
          entry.debit,
          entry.credit,
          entry.balance,
        ].join(",")
      ),
    ];

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });

    saveAs(blob, "account_book.csv");
  };

  const exportExcel = () => {
    if (!Array.isArray(data.transactions)) {
      console.error("Data is not in the expected format.");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(data.transactions);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Account Book");
    XLSX.writeFile(wb, "account_book.xlsx");
  };

  const printTable = () => {
    if (!Array.isArray(data.transactions)) {
      console.error("Transactions data is not in the expected format.");
      return;
    }

    const printWindow = window.open("", "_blank", "width=800,height=600");
    const tableContent = `
      <html>
        <head>
          <title>Print Entries</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; }
            th { background-color: #f2f2f2; }
            th, td { text-align: left; }
          </style>
        </head>
        <body>
          <h2>Entries Report</h2>
          <table>
            <thead>
              <tr>
                ${columnsVisibility.date ? "<th>Date</th>" : ""}
                                ${columnsVisibility.type ? "<th>Type</th>" : ""}
                ${columnsVisibility.description ? "<th>Description</th>" : ""}
                ${columnsVisibility.addedBy ? "<th>Added By</th>" : ""}
                ${columnsVisibility.debit ? "<th>Debit</th>" : ""}
                ${columnsVisibility.credit ? "<th>Credit</th>" : ""}
                ${columnsVisibility.balance ? "<th>Balance</th>" : ""}
                ${columnsVisibility.action ? "<th>Action</th>" : ""}
              </tr>
            </thead>
            <tbody>
              ${data.transactions
                .map(
                  (entry) => `
                    <tr>
                      ${columnsVisibility.date ? `<td>${entry.date}</td>` : ""}
                                            ${
                                              columnsVisibility.type
                                                ? `<td>${entry.type}</td>`
                                                : ""
                                            }

                      ${
                        columnsVisibility.description
                          ? `<td>${entry.description}</td>`
                          : ""
                      }
                      ${
                        columnsVisibility.addedBy
                          ? `<td>${entry.addedBy}</td>`
                          : ""
                      }
                      ${
                        columnsVisibility.debit ? `<td>${entry.debit}</td>` : ""
                      }
                      ${
                        columnsVisibility.credit
                          ? `<td>${entry.credit}</td>`
                          : ""
                      }
                      ${
                        columnsVisibility.balance
                          ? `<td>${entry.balance}</td>`
                          : ""
                      }
                      ${
                        columnsVisibility.action
                          ? `<td><button disabled>View</button><button disabled>Edit</button><button disabled>Delete</button></td>`
                          : ""
                      }
                    </tr>`
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

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [
        [
          "Date",
          "Description",
          "type",
          "Payment Method",
          "Payment Details",
          "Added By",
          "Debit",
          "Credit",
          "Balance",
        ],
      ],
      body: data.transactions.map((entry) => [
        entry.date,
        entry.description,
        entry.addedBy,
        entry.type,
        entry.debit,
        entry.credit,
        entry.balance,
      ]),
    });
    doc.save("account_book.pdf");
  };

  useEffect(() => {
    fetchAccountDataById(id);
  }, [id]);

  const fetchAccountDataById = async (id) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/payment-account/get/${id}`
      );
      if (!response.ok) throw new Error("Failed to fetch account data");
      const result = await response.json();
      setData(result);

      const script = document.createElement("script");
      script.src = "/js/JqueryContent.js";
      script.async = true;

      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  const handleEdit = (transaction) => {
    setSelectedTransaction(transaction);
    setFormData({
      amount: transaction.amount,
      paymentMethod: transaction.paymentMethod,
      transactionType: transaction.transactionType,
      addedBy: transaction.addedBy,
      addedBy: transaction.type,
      note: transaction.note,
      date: transaction.date,
    });
    setEditModal(true);
  };
  const handleFormChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };
  const handleUpdateTransaction = async () => {
    if (!selectedTransaction) return;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/payment-account/transaction/update/${selectedTransaction.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: formData.amount,
            paymentMethod: formData.paymentMethod,
            transactionType: formData.transactionType,
            addedBy: formData.addedBy,
            note: formData.note,
            date: formData.date,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to update transaction");

      setEditModal(false);
      fetchAccountDataById(id); // Refresh data after update
    } catch (error) {
      console.error("Error updating transaction:", error);
    }
  };

  return (
    <>
      <div className="wrapper">
        <div className="content-wrapper">
          <section className="content-header">
            <div className="container-fluid">
              <div className="row mb-2">
                <div className="col-12 col-md-6">
                  <h1 className="all-heading">Account Book</h1>
                </div>
              </div>
            </div>
          </section>

          <section className="content">
            <div className="container-fluid">
              <div className="card cardHover rounded-4 border-0">
                <div className="card-body">
                  <div className="d-flex justify-content-end mb-3">
                    <button className="btn btn-add">
                      <i className="fas fa-plus"></i> Add
                    </button>
                  </div>

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
                        onClick={printTable}
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
                          {columnsVisibility.description && <th>Note</th>}
                          {columnsVisibility.type && <th>Transaction Type</th>}
                          {columnsVisibility.debit && <th>Debit</th>}
                          {columnsVisibility.credit && <th>Credit</th>}
                          {columnsVisibility.balance && <th>Balance</th>}
                          {columnsVisibility.addedBy && <th>Added By</th>}
                          {columnsVisibility.action && <th>Action</th>}
                        </tr>
                      </thead>

                      <tbody>
                        {(() => {
                          let runningBalance = 0;
                          let totalCredit = 0;
                          let totalDebit = 0;

                          const sortedTransactions = data.transactions
                            ?.slice()
                            .sort((a, b) => a.id - b.id);

                          return sortedTransactions &&
                            sortedTransactions.length > 0 ? (
                            <>
                              {sortedTransactions.map((transaction) => {
                                const t = transaction.transactionType;
                                const amt = Number(transaction.amount);

                                // Running balance update
                                if (
                                  [
                                    "deposit",
                                    "opening_balance",
                                    "sale",
                                  ].includes(t)
                                ) {
                                  runningBalance += amt;
                                  totalCredit += amt;
                                } else if (
                                  ["purchase", "expense", "payment"].includes(t)
                                ) {
                                  runningBalance -= amt;
                                  totalDebit += amt;
                                }

                                return (
                                  <tr key={transaction.id}>
                                    {columnsVisibility.date && (
                                      <td>{transaction.date}</td>
                                    )}

                                    {columnsVisibility.description && (
                                      <td>
                                        {transaction.transactionType}-
                                        {transaction.vendor}-
                                        {transaction.franchiseName}
                                        {transaction.note}
                                      </td>
                                    )}

                                    {columnsVisibility.type && <td>{t}</td>}

                                    {columnsVisibility.debit && (
                                      <td>
                                        {[
                                          "purchase",
                                          "expense",
                                          "payment",
                                        ].includes(t)
                                          ? amt
                                          : "-"}
                                      </td>
                                    )}

                                    {columnsVisibility.credit && (
                                      <td>
                                        {[
                                          "deposit",
                                          "opening_balance",
                                          "sale",
                                        ].includes(t)
                                          ? amt
                                          : "-"}
                                      </td>
                                    )}

                                    {columnsVisibility.balance && (
                                      <td>{runningBalance.toFixed(2)}</td>
                                    )}

                                    {columnsVisibility.addedBy && (
                                      <td>{transaction.addedBy}</td>
                                    )}

                                    {columnsVisibility.action && (
                                      <td>
                                        <button
                                          className="btn btn-edit btn-sm"
                                          onClick={() =>
                                            handleEdit(transaction)
                                          }
                                        >
                                          Edit
                                        </button>
                                      </td>
                                    )}
                                  </tr>
                                );
                              })}

                              {/* SUMMARY ROW */}
                              <tr
                                style={{
                                  backgroundColor: "#f1f1f1",
                                  fontWeight: "bold",
                                }}
                              >
                                <td colSpan="3" className="text-end">
                                  Totals:
                                </td>

                                {/* Total Debit */}
                                {columnsVisibility.debit && (
                                  <td>{totalDebit.toFixed(2)}</td>
                                )}

                                {/* Total Credit */}
                                {columnsVisibility.credit && (
                                  <td>{totalCredit.toFixed(2)}</td>
                                )}

                                {/* Final Balance */}
                                {columnsVisibility.balance && (
                                  <td>
                                    {(totalCredit - totalDebit).toFixed(2)}
                                  </td>
                                )}

                                {/* Empty AddedBy + Action columns if visible */}
                                {columnsVisibility.addedBy && <td></td>}
                                {columnsVisibility.action && <td></td>}
                              </tr>
                            </>
                          ) : (
                            <tr>
                              <td colSpan="8">No transactions available.</td>
                            </tr>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
      {editModal && (
        <div
          className="modal show"
          style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Transaction</h5>
                <button
                  type="button"
                  className="close"
                  onClick={() => setEditModal(false)}
                >
                  &times;
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Amount</label>
                  <input
                    type="number"
                    id="amount"
                    value={formData.amount}
                    onChange={handleFormChange}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Payment Method</label>
                  <input
                    type="text"
                    id="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleFormChange}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Transaction Type</label>
                  <select
                    id="transactionType"
                    value={formData.transactionType}
                    onChange={handleFormChange}
                    className="form-control"
                  >
                    <option value="deposit">Deposit</option>
                    <option value="sale">Sale</option>
                    <option value="purchase">Purchase</option>
                    <option value="expense">Expense</option>
                    <option value="opening_balance">Opening Balance</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Added By</label>
                  <input
                    type="text"
                    id="addedBy"
                    value={formData.addedBy}
                    onChange={handleFormChange}
                    className="form-control"
                    readOnly
                  />
                </div>
                <div className="form-group">
                  <label>Note</label>
                  <input
                    type="text"
                    id="note"
                    value={formData.note}
                    onChange={handleFormChange}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    id="date"
                    value={formData.date}
                    onChange={handleFormChange}
                    className="form-control"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleUpdateTransaction}
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AccountBook;
