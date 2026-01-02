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
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Accounts = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [columnsVisibility, setColumnsVisibility] = useState({
    accountName: true,
    accountNumber: true,
    accountType: true,
    addedBy: true,
    amount: true,
    action: true,
  });
  const [currentAccount, setCurrentAccount] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [isDepositModalOpen, setDepositModalOpen] = useState(false);
  const [depositFormData, setDepositFormData] = useState({
    amount: "",
    date: "",
    note: "",
  });
  const [addedBy, setAddedBy] = useState("");

  // State variables for filters
  const [filterValues, setFilterValues] = useState({
    accountNames: [],
    accountTypes: [],
  });

  const [activeFilters, setActiveFilters] = useState({
    startDate: "",
    endDate: "",
    accountName: "",
    accountType: "",
  });

  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    const email = sessionStorage.getItem("userEmail");
    if (email) {
      setAddedBy(email);
    }
  }, []);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/payment-account/getall`
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const accountsData = await response.json();
        const sortedAccounts = accountsData.sort((a, b) => b.id - a.id);

        const updatedAccounts = await Promise.all(
          sortedAccounts.map(async (account) => {
            try {
              const balanceResponse = await fetch(
                `${process.env.REACT_APP_BASE_URL}/payment-account/balance/${account.id}`
              );
              if (balanceResponse.ok) {
                const balance = await balanceResponse.json();
                return { ...account, amount: balance };
              } else {
                console.error(
                  `Failed to fetch balance for account ID: ${account.id}`
                );
                return account;
              }
            } catch (error) {
              console.error("Error fetching balance:", error);
              return account;
            }
          })
        );

        setAccounts(updatedAccounts);
        setFilteredAccounts(updatedAccounts);
      } catch (error) {
        console.error("Error fetching accounts:", error);
        setAccounts([]);
        setFilteredAccounts([]);
      }
    };

    fetchAccounts();
  }, []);

  // Extract filter values when accounts data changes
  useEffect(() => {
    if (accounts.length > 0) {
      const accountNames = [
        ...new Set(accounts.map((item) => item.accountName)),
      ].filter(Boolean);
      const accountTypes = [
        ...new Set(accounts.map((item) => item.accountType)),
      ].filter(Boolean);

      setFilterValues({
        accountNames,
        accountTypes,
      });
    }
  }, [accounts]);

  // Apply filters whenever activeFilters or accounts changes
  useEffect(() => {
    const filteredData = accounts.filter((account) => {
      // For accounts, we'll filter based on creation date if available
      // If creation date is not available in the API response, we'll use current date logic
      const accountDate = new Date();

      // Date range filter
      let dateMatch = true;
      if (activeFilters.startDate && activeFilters.endDate) {
        const startDate = new Date(activeFilters.startDate);
        const endDate = new Date(activeFilters.endDate);
        endDate.setHours(23, 59, 59, 999);

        dateMatch = accountDate >= startDate && accountDate <= endDate;
      } else if (activeFilters.startDate) {
        const startDate = new Date(activeFilters.startDate);
        dateMatch = accountDate >= startDate;
      } else if (activeFilters.endDate) {
        const endDate = new Date(activeFilters.endDate);
        endDate.setHours(23, 59, 59, 999);
        dateMatch = accountDate <= endDate;
      }

      // Account Name filter
      const accountNameMatch =
        activeFilters.accountName === "" ||
        account.accountName === activeFilters.accountName;

      // Account Type filter
      const accountTypeMatch =
        activeFilters.accountType === "" ||
        account.accountType === activeFilters.accountType;

      return dateMatch && accountNameMatch && accountTypeMatch;
    });

    setFilteredAccounts(filteredData);
  }, [activeFilters, accounts]);

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
      accountName: "",
      accountType: "",
    });
  };

  const toggleColumn = (column) => {
    setColumnsVisibility((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  const handleDeposit = (id) => {
    setCurrentAccount(id);
    setDepositModalOpen(true);
  };

  const handleDepositFormChange = (e) => {
    const { id, value } = e.target;
    setDepositFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleDepositSubmit = async () => {
    const depositData = {
      amount: parseFloat(depositFormData.amount),
      paymentMethod: "cash",
      transactionType: "deposit",
      addedBy,
      note: depositFormData.note,
      date: new Date(depositFormData.date).toISOString(), // FIXED
    };

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/payment-account/transaction/${currentAccount}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(depositData),
        }
      );

      if (response.ok) {
        toast.success("Deposit added successfully!");
        setDepositModalOpen(false);
      } else {
        toast.error("Failed to add deposit (check console)");
      }
    } catch (error) {
      toast.error("Error adding deposit:", error);
    }
  };

  const handleModalClose = () => {
    setDepositModalOpen(false);
  };

  const handleUpdateStatus = async (id, newStatus) => {
    const confirmationMessage =
      newStatus === 0
        ? "Are you sure you want to deactivate this account?"
        : "Are you sure you want to activate this account?";

    if (window.confirm(confirmationMessage)) {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/payment-account/update-status/${id}?status=${newStatus}`,
          {
            method: "PUT",
          }
        );

        if (response.ok) {
          setAccounts((prevAccounts) =>
            prevAccounts.map((account) =>
              account.id === id ? { ...account, status: newStatus } : account
            )
          );
          toast.success(
            `Account ${
              newStatus === 1 ? "activated" : "deactivated"
            } successfully!`
          );
        } else {
          toast.error("Failed to update account status.");
        }
      } catch (error) {
        // console.error("Error updating account status:", error);
        toast.error("Error updating account status.");
      }
    }
  };

  const handleAccountBook = (id) => {
    navigate(`/AccountBook/${id}`);
  };
  const calculateAccountBalance = (transactions) => {
    let balance = 0;

    if (!transactions) return 0;

    transactions.forEach((t) => {
      const amount = Number(t.amount);
      const type = t.transactionType;

      if (["deposit", "opening_balance", "sale"].includes(type)) {
        balance += amount;
      } else if (["purchase", "expense", "payment"].includes(type)) {
        balance -= amount;
      }
    });

    return balance.toFixed(2);
  };

  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;

  const exportCSV = () => {
    const headers = [
      "Account Name",
      "Account Number",
      "Account Type",
      "Added By",
      "Account Balance",
    ];
    const rows = [
      headers.join(","),
      ...filteredAccounts.map((account) =>
        [
          account.accountName,
          account.accountNumber,
          account.accountType,
          account.transactions[0]?.addedBy || "-",
          account.amount,
        ].join(",")
      ),
    ];
    const csvString = rows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "accounts.csv");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredAccounts.map((account) => ({
        AccountName: account.accountName,
        AccountNumber: account.accountNumber,
        AccountType: account.accountType,
        AddedBy: account.transactions[0]?.addedBy || "-",
        AccountBalance: account.amount,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Accounts");
    XLSX.writeFile(wb, "accounts.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [
        [
          "Account Name",
          "Account Number",
          "Account Type",
          "Added By",
          "Account Balance",
        ],
      ],
      body: filteredAccounts.map((account) => [
        account.accountName,
        account.accountNumber,
        account.accountType,
        account.transactions[0]?.addedBy || "-",
        account.amount,
      ]),
    });
    doc.save("accounts.pdf");
  };

  const printTable = () => {
    const printWindow = window.open("", "_blank", "width=800,height=600");
    const tableContent = `
      <html>
        <head>
          <title>Accounts List</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; }
            th { background-color: #f2f2f2; }
            th, td { text-align: left; }
          </style>
        </head>
        <body>
          <h2>Accounts List</h2>
          <table>
            <thead>
              <tr>
                <th>Account Name</th>
                <th>Account Number</th>
                <th>Account Type</th>
                <th>Added By</th>
                <th>Account Balance</th>
              </tr>
            </thead>
            <tbody>
              ${filteredAccounts
                .map(
                  (account) => `
                    <tr>
                      <td>${account.accountName}</td>
                      <td>${account.accountNumber}</td>
                      <td>${account.accountType}</td>
                      <td>${account.transactions[0]?.addedBy || "-"}</td>
                      <td>${account.amount}</td>
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

  const handleEntriesChange = (e) => {
    setEntriesPerPage(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header py-3">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-12 col-md-6">
                <h1 className="all-heading">List Account</h1>
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

                      {/* Account Name Dropdown */}
                      <div className="col-md-3">
                        <div className="form-group">
                          <label className="me-2">Account Name:</label>
                          <select
                            className="form-select"
                            name="accountName"
                            value={activeFilters.accountName}
                            onChange={handleFilterChange}
                          >
                            <option value="">All Accounts</option>
                            {filterValues.accountNames.map(
                              (accountName, index) => (
                                <option
                                  key={`account-${index}`}
                                  value={accountName}
                                >
                                  {accountName}
                                </option>
                              )
                            )}
                          </select>
                        </div>
                      </div>

                      {/* Account Type Dropdown */}
                      <div className="col-md-3">
                        <div className="form-group">
                          <label className="me-2">Account Type:</label>
                          <select
                            className="form-select"
                            name="accountType"
                            value={activeFilters.accountType}
                            onChange={handleFilterChange}
                          >
                            <option value="">All Types</option>
                            {filterValues.accountTypes.map(
                              (accountType, index) => (
                                <option
                                  key={`type-${index}`}
                                  value={accountType}
                                >
                                  {accountType}
                                </option>
                              )
                            )}
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
              <div className="d-flex justify-content-end mb-3">
                <Link to="/AddAccount" className="btn btn-add">
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
                    className="table table-bordered table-hover shadow"
                  >
                    <thead>
                      <tr>
                        {columnsVisibility.accountName && <th>Account Name</th>}
                        {columnsVisibility.accountNumber && (
                          <th>Account Number</th>
                        )}
                        {columnsVisibility.accountType && <th>Account Type</th>}
                        {columnsVisibility.addedBy && <th>Added By</th>}
                        {columnsVisibility.amount && <th>Account Balance</th>}
                        {columnsVisibility.action && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAccounts
                        .slice(startIndex, endIndex)
                        .map((account) => (
                          <tr key={account.id}>
                            {columnsVisibility.accountName && (
                              <td>{account.accountName}</td>
                            )}
                            {columnsVisibility.accountNumber && (
                              <td>{account.accountNumber}</td>
                            )}
                            {columnsVisibility.accountType && (
                              <td>{account.accountType}</td>
                            )}
                            {columnsVisibility.addedBy && (
                              <td>{account.transactions[0]?.addedBy || "-"}</td>
                            )}
                            {columnsVisibility.amount && (
                              <td>
                                {calculateAccountBalance(account.transactions)}
                              </td>
                            )}

                            {columnsVisibility.action && (
                              <td>
                                <button
                                  className="btn btn-edit btn-sm mr-2 m-auto"
                                  onClick={() => handleAccountBook(account.id)}
                                >
                                  <i className="fas fa-book"></i> Account Book
                                </button>
                                <button
                                  className="btn btn-view btn-sm mr-2 m-auto"
                                  onClick={() => handleDeposit(account.id)}
                                >
                                  <i className="fa-solid fa-money-bill-transfer"></i>{" "}
                                  Deposit
                                </button>
                                {account.status === 1 ? (
                                  <button
                                    className="btn btn-delete btn-sm mr-2 m-auto"
                                    onClick={() =>
                                      handleUpdateStatus(account.id, 0)
                                    }
                                  >
                                    <i className="fas fa-trash"></i> Deactivate
                                  </button>
                                ) : (
                                  <button
                                    className="btn btn-edit btn-sm mr-2 m-auto"
                                    onClick={() =>
                                      handleUpdateStatus(account.id, 1)
                                    }
                                  >
                                    <i className="fas fa-check-circle "></i>{" "}
                                    Activate
                                  </button>
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

      {isDepositModalOpen && (
        <div className="modal" style={{ display: "block" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Deposit</h5>
                <button
                  type="button"
                  className="close"
                  onClick={handleModalClose}
                >
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="form-group">
                    <label htmlFor="amount">Amount</label>
                    <input
                      type="number"
                      id="amount"
                      className="form-control"
                      value={depositFormData.amount}
                      onChange={handleDepositFormChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="date">Date</label>
                    <input
                      type="date"
                      id="date"
                      className="form-control"
                      value={depositFormData.date}
                      onChange={handleDepositFormChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="note">Note</label>
                    <textarea
                      id="note"
                      className="form-control"
                      rows="3"
                      value={depositFormData.note}
                      onChange={handleDepositFormChange}
                    />
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleModalClose}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleDepositSubmit}
                >
                  Save Deposit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounts;
