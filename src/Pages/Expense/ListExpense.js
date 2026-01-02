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
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Dropdown, DropdownButton } from "react-bootstrap";
import { toast } from "react-toastify";

const ListExpense = () => {
  const navigate = useNavigate();
  const [expense, setListExpense] = useState([]);
  const [filteredExpense, setFilteredExpense] = useState([]);
  const [columnsVisibility, setColumnsVisibility] = useState({
    action: true,
    date: true,
    referenceNo: true,
    recurringDetails: true,
    expenseCategory: true,
    subCategory: true,
    location: true,
    paymentStatus: true,
    tax: true,
    totalAmount: true,
    paymentDue: true,
    expenseFor: true,
    contact: true,
    expenseNote: true,
    addedBy: true,
  });
  const [modalType, setModalType] = useState(null);
  const [currentListExpense, setCurrentListExpense] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [formData, setFormData] = useState({
    date: "",
    referenceNo: "",
    recurringDetails: "",
    expenseCategory: "",
    subCategory: "",
    location: "",
    paymentStatus: "",
    tax: "",
    totalAmount: "",
    paymentDue: "",
    expenseFor: "",
    contact: "",
    expenseNote: "",
    addedBy: "",
  });
  // State variables for filters
  const [filterValues, setFilterValues] = useState({
    expenseCategories: [],
    locations: [],
    paymentStatuses: [],
  });

  const [activeFilters, setActiveFilters] = useState({
    startDate: "",
    endDate: "",
    expenseCategory: "",
    location: "",
    paymentStatus: "",
  });

  const [filterOpen, setFilterOpen] = useState(false);

  const [expenseCategoryMap, setExpenseCategoryMap] = useState({});
  const flattenCategories = (list, map = {}) => {
    list.forEach((item) => {
      map[item.id] = item.expenseName;

      if (item.subExpenses?.length > 0) {
        flattenCategories(item.subExpenses, map);
      }
    });

    return map;
  };
  const flattenTaxes = (list, map = {}) => {
    list.forEach((item) => {
      map[item.id] = `${item.taxName} (${item.taxValue}%)`;

      if (item.includedTaxes?.length > 0) {
        flattenTaxes(item.includedTaxes, map);
      }
    });

    return map;
  };

  const [taxMap, setTaxMap] = useState({});

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_BASE_URL}/tax/getall`)
      .then((response) => {
        const map = flattenTaxes(response.data);
        setTaxMap(map);
      })
      .catch((error) => console.error("Error fetching tax rates:", error));
  }, []);

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_BASE_URL}/expenses/getall`)
      .then((res) => {
        const map = flattenCategories(res.data);
        setExpenseCategoryMap(map);
      })
      .catch((err) => console.error("Error loading categories:", err));
  }, []);

  useEffect(() => {
    const fetchExpense = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/add-expenses/getall`
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          setListExpense(data);
          setFilteredExpense(data);
        } else {
          console.error("Fetched data is not an array");
          setListExpense([]);
          setFilteredExpense([]);
        }
      } catch (error) {
        console.error("Error fetching expense:", error);
        setListExpense([]);
        setFilteredExpense([]);
      }

      const script = document.createElement("script");
      script.src = "js/JqueryContent.js";
      script.async = true;

      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
    };

    fetchExpense();
  }, []);

  // Extract filter values when expense data changes
  useEffect(() => {
    if (expense.length > 0) {
      const expenseCategories = [
        ...new Set(expense.map((item) => item.expenseCategory)),
      ].filter(Boolean);
      const locations = [
        ...new Set(expense.map((item) => item.location)),
      ].filter(Boolean);
      const paymentStatuses = [
        ...new Set(expense.map((item) => item.paymentStatus)),
      ].filter(Boolean);

      setFilterValues({
        expenseCategories,
        locations,
        paymentStatuses,
      });
    }
  }, [expense]);

  // Apply filters whenever activeFilters or expense changes
  useEffect(() => {
    const filteredData = expense.filter((item) => {
      const itemDate = new Date(item.date);

      // Date range filter
      let dateMatch = true;
      if (activeFilters.startDate && activeFilters.endDate) {
        const startDate = new Date(activeFilters.startDate);
        const endDate = new Date(activeFilters.endDate);
        endDate.setHours(23, 59, 59, 999);

        dateMatch = itemDate >= startDate && itemDate <= endDate;
      } else if (activeFilters.startDate) {
        const startDate = new Date(activeFilters.startDate);
        dateMatch = itemDate >= startDate;
      } else if (activeFilters.endDate) {
        const endDate = new Date(activeFilters.endDate);
        endDate.setHours(23, 59, 59, 999);
        dateMatch = itemDate <= endDate;
      }

      // Expense Category filter
      const expenseCategoryMatch =
        activeFilters.expenseCategory === "" ||
        item.expenseCategory === activeFilters.expenseCategory;

      // Location filter
      const locationMatch =
        activeFilters.location === "" ||
        item.location === activeFilters.location;

      // Payment Status filter
      const paymentStatusMatch =
        activeFilters.paymentStatus === "" ||
        item.paymentStatus === activeFilters.paymentStatus;

      return (
        dateMatch && expenseCategoryMatch && locationMatch && paymentStatusMatch
      );
    });

    setFilteredExpense(filteredData);
  }, [activeFilters, expense]);

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
      expenseCategory: "",
      location: "",
      paymentStatus: "",
    });
  };

  const printData = () => {
    const printWindow = window.open("", "_blank", "width=800,height=600");

    const tableContent = `
      <html>
        <head>
          <title>Print Expense </title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; }
            th { background-color: #f2f2f2; }
            th, td { text-align: left; }
          </style>
        </head>
        <body>
          <h2>Expense </h2>
          <table>
            <thead>
              <tr>
                ${columnsVisibility.action ? "<th>Action</th>" : ""}
                ${columnsVisibility.date ? "<th>Date</th>" : ""}
                ${columnsVisibility.referenceNo ? "<th>Reference No</th>" : ""}
                ${
                  columnsVisibility.recurringDetails
                    ? "<th>Recurring Details</th>"
                    : ""
                }
                ${
                  columnsVisibility.expenseCategory
                    ? "<th>Expense Category</th>"
                    : ""
                }
                ${columnsVisibility.subCategory ? "<th>Sub Category</th>" : ""}
                ${columnsVisibility.location ? "<th>Location</th>" : ""}
                ${
                  columnsVisibility.paymentStatus
                    ? "<th>Payment Status</th>"
                    : ""
                }
                ${columnsVisibility.tax ? "<th>Tax</th>" : ""}
                ${columnsVisibility.totalAmount ? "<th>Total Amount</th>" : ""}
                ${columnsVisibility.paymentDue ? "<th>Payment Due</th>" : ""}
                ${columnsVisibility.expenseFor ? "<th>Expense For</th>" : ""}
                ${columnsVisibility.contact ? "<th>Contact</th>" : ""}
                ${columnsVisibility.expenseNote ? "<th>Expense Note</th>" : ""}
                ${columnsVisibility.addedBy ? "<th>Added By</th>" : ""}
              </tr>
            </thead>
            <tbody>
              ${filteredExpense
                .slice(startIndex, endIndex)
                .map(
                  (expenses) => `
                <tr>
                  ${
                    columnsVisibility.action
                      ? `<td>
                    <button class="btn btn-edit btn-sm mr-2">Edit</button>
                    <button class="btn btn-view btn-sm mr-2">View</button>
                    <button class="btn btn-delete btn-sm">Delete</button>
                  </td>`
                      : ""
                  }
                  ${columnsVisibility.date ? `<td>${expenses.date}</td>` : ""}
                  ${
                    columnsVisibility.referenceNo
                      ? `<td>${expenses.referenceNo}</td>`
                      : ""
                  }
                  ${
                    columnsVisibility.recurringDetails
                      ? `<td>${expenses.recurringDetails}</td>`
                      : ""
                  }
                  ${
                    columnsVisibility.expenseCategory
                      ? `<td>${expenses.expenseCategory}</td>`
                      : ""
                  }
                  ${
                    columnsVisibility.subCategory
                      ? `<td>${expenses.subCategory}</td>`
                      : ""
                  }
                  ${
                    columnsVisibility.location
                      ? `<td>${expenses.location}</td>`
                      : ""
                  }
                  ${
                    columnsVisibility.paymentStatus
                      ? `<td>${expenses.paymentStatus}</td>`
                      : ""
                  }
                  ${columnsVisibility.tax ? `<td>${expenses.tax}</td>` : ""}
                  ${
                    columnsVisibility.totalAmount
                      ? `<td>${expenses.totalAmount}</td>`
                      : ""
                  }
                  ${
                    columnsVisibility.paymentDue
                      ? `<td>${expenses.paymentDue}</td>`
                      : ""
                  }
                  ${
                    columnsVisibility.expenseFor
                      ? `<td>${expenses.expenseFor}</td>`
                      : ""
                  }
                  ${
                    columnsVisibility.contact
                      ? `<td>${expenses.contact}</td>`
                      : ""
                  }
                  ${
                    columnsVisibility.expenseNote
                      ? `<td>${expenses.expenseNote}</td>`
                      : ""
                  }
                  ${
                    columnsVisibility.addedBy
                      ? `<td>${expenses.addedBy}</td>`
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

  const exportCSV = () => {
    const csvData = filteredExpense.map((expenses) => ({
      Action: "", // Placeholder for action buttons
      Date: expenses.date,
      ReferenceNo: expenses.referenceNo,
      RecurringDetails: expenses.recurringDetails,
      ExpenseCategory: expenses.expenseCategory,
      SubCategory: expenses.subCategory,
      Location: expenses.location,
      PaymentStatus: expenses.paymentStatus,
      Tax: expenses.tax,
      TotalAmount: expenses.totalAmount,
      PaymentDue: expenses.paymentDue,
      ExpenseFor: expenses.expenseFor,
      Contact: expenses.contact,
      ExpenseNote: expenses.expenseNote,
      AddedBy: expenses.addedBy,
    }));

    const csv = [
      [
        "Action",
        "Date",
        "Reference No",
        "Recurring Details",
        "Expense Category",
        "Sub Category",
        "Location",
        "Payment Status",
        "Tax",
        "Total Amount",
        "Payment Due",
        "Expense For",
        "Contact",
        "Expense Note",
        "Added By",
      ],
      ...csvData.map((row) => Object.values(row)),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, "expenses.csv");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredExpense.map((expenses) => ({
        Action: "", // Placeholder for action buttons
        Date: expenses.date,
        ReferenceNo: expenses.referenceNo,
        RecurringDetails: expenses.recurringDetails,
        ExpenseCategory: expenses.expenseCategory,
        SubCategory: expenses.subCategory,
        Location: expenses.location,
        PaymentStatus: expenses.paymentStatus,
        Tax: expenses.tax,
        TotalAmount: expenses.totalAmount,
        PaymentDue: expenses.paymentDue,
        ExpenseFor: expenses.expenseFor,
        Contact: expenses.contact,
        ExpenseNote: expenses.expenseNote,
        AddedBy: expenses.addedBy,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "expenses");
    XLSX.writeFile(wb, "expenses.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();

    // Define the column headers
    const headers = [
      "Action",
      "Date",
      "Reference No",
      "Recurring Details",
      "Expense Category",
      "Sub Category",
      "Location",
      "Payment Status",
      "Tax",
      "Total Amount",
      "Payment Due",
      "Expense For",
      "Contact",
      "Expense Note",
      "Added By",
    ];

    // Map through the expense data and prepare the body
    const body = filteredExpense
      .slice(startIndex, endIndex)
      .map((expenseItem) => [
        "", // Placeholder for action buttons
        expenseItem.date,
        expenseItem.referenceNo,
        expenseItem.recurringDetails,
        expenseItem.expenseCategory,
        expenseItem.subCategory,
        expenseItem.location,
        expenseItem.paymentStatus,
        expenseItem.tax,
        expenseItem.totalAmount,
        expenseItem.paymentDue,
        expenseItem.expenseFor,
        expenseItem.contact,
        expenseItem.expenseNote,
        expenseItem.addedBy,
      ]);

    // Add some space before the table
    doc.text("Expense List", 14, 20); // Title with a slight offset
    doc.setFontSize(12);
    doc.text("Below is the list of expenses with their details:", 14, 30);

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
    doc.save("ExpenseList.pdf");
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

  const handleSave = async () => {
    try {
      if (modalType === "edit" && currentListExpense) {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/add-expenses/update/${currentListExpense.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ ...formData, id: currentListExpense.id }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update expense");
        }

        const updatedExpenses = await response.json();
        setListExpense((prevLists) =>
          prevLists.map((expenses) =>
            expenses.id === updatedExpenses.id ? updatedExpenses : expenses
          )
        );
        closeModal();
        toast.success("expense updated successfully!");
      } else if (modalType === "add") {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/add-expenses/save`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
          }
        );

        if (response.status !== 201) {
          throw new Error("Failed to add expense");
        }

        const newExpense = await response.json();
        setListExpense((prevLists) => [...prevLists, newExpense]);
        closeModal();
        toast.success("expense added successfully!");
      }
    } catch (error) {
      // console.error("Error saving expense:", error);
      toast.error("Error saving expense");
    }
  };

  const closeModal = () => {
    setModalType(null);
    setCurrentListExpense(null);
    setFormData({});
  };

  const handleEdit = (id) => {
    navigate(`/EditExpense/${id}`);
  };

  const handleView = (id) => {
    navigate(`/ViewExpense/${id}`);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/add-expenses/delete/${id}`,
          {
            method: "DELETE",
          }
        );

        if (response.status === 204) {
          setListExpense((prevLists) =>
            prevLists.filter((expenses) => expenses.id !== id)
          );
          toast.success("expenses deleted successfully!");
        } else {
          toast.error("Failed to delete expenses.");
        }
      } catch (error) {
        // console.error("Error deleting expenses:", error);
        toast.error("Error deleting expenses");
      }
    }
  };

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-12 col-md-6">
                <h1 className=" all-heading">Manage Expenses</h1>
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

                      {/* Expense Category Dropdown */}
                      <div className="col-md-3">
                        <div className="form-group">
                          <label className="me-2">Expense Category:</label>
                          <select
                            className="form-select"
                            name="expenseCategory"
                            value={activeFilters.expenseCategory}
                            onChange={handleFilterChange}
                          >
                            <option value="">All Categories</option>
                            {filterValues.expenseCategories.map(
                              (expenseCategory, index) => (
                                <option
                                  key={`category-${index}`}
                                  value={expenseCategory}
                                >
                                  {expenseCategory}
                                </option>
                              )
                            )}
                          </select>
                        </div>
                      </div>

                      {/* Location Dropdown */}
                      <div className="col-md-3">
                        <div className="form-group">
                          <label className="me-2">Location:</label>
                          <select
                            className="form-select"
                            name="location"
                            value={activeFilters.location}
                            onChange={handleFilterChange}
                          >
                            <option value="">All Locations</option>
                            {filterValues.locations.map((location, index) => (
                              <option key={`loc-${index}`} value={location}>
                                {location}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Payment Status Dropdown */}
                      <div className="col-md-3">
                        <div className="form-group">
                          <label className="me-2">Payment Status:</label>
                          <select
                            className="form-select"
                            name="paymentStatus"
                            value={activeFilters.paymentStatus}
                            onChange={handleFilterChange}
                          >
                            <option value="">All Statuses</option>
                            {filterValues.paymentStatuses.map(
                              (paymentStatus, index) => (
                                <option
                                  key={`status-${index}`}
                                  value={paymentStatus}
                                >
                                  {paymentStatus}
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
                <Link to="/AddExpense" className="btn btn-add">
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
                        {columnsVisibility.location && (
                          <th>Business Location</th>
                        )}
                        {columnsVisibility.expenseCategory && (
                          <th>Expense Category</th>
                        )}
                        {columnsVisibility.subCategory && <th>Sub Category</th>}
                        {columnsVisibility.tax && <th>Tax</th>}
                        {columnsVisibility.totalAmount && <th>Total Amount</th>}
                        {columnsVisibility.expenseFor && <th>Expense For</th>}
                        {columnsVisibility.contact && <th>Contact</th>}
                        {columnsVisibility.expenseNote && <th>Expense Note</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExpense
                        .slice(startIndex, endIndex)
                        .map((expenses) => (
                          <tr key={expenses.id}>
                            {columnsVisibility.action && (
                              <td>
                                <DropdownButton
                                  id="dropdown-basic-button"
                                  title="Actions"
                                  variant="outline-success rounded-5 fs-6 fw-light border-1"
                                  className="custom-outline-dropdown p-2"
                                >
                                  {/* View */}
                                  <Dropdown.Item
                                    as="button"
                                    onClick={() => handleView(expenses.id)}
                                  >
                                    <div className="d-inline-block w-100 btn-view justify-content-center text-secondary">
                                      <i className="dropdown_hover fa fa-eye me-3"></i>
                                      <span>View</span>
                                    </div>
                                  </Dropdown.Item>

                                  {/* Edit */}
                                  <Dropdown.Item
                                    as="button"
                                    onClick={() => handleEdit(expenses.id)}
                                  >
                                    <div className="d-inline-block w-100 btn-edit justify-content-center text-secondary">
                                      <i className="dropdown_hover fa-solid fa-pen-to-square me-3"></i>
                                      <span>Edit</span>
                                    </div>
                                  </Dropdown.Item>

                                  {/* Delete */}
                                  <Dropdown.Item
                                    as="button"
                                    onClick={() => handleDelete(expenses.id)}
                                  >
                                    <div className="d-inline-block w-100 btn-delete justify-content-center text-secondary">
                                      <i className="fa fa-trash me-3"></i>
                                      <span>Delete</span>
                                    </div>
                                  </Dropdown.Item>
                                </DropdownButton>
                              </td>
                            )}

                            {columnsVisibility.date && <td>{expenses.date}</td>}
                            {columnsVisibility.location && (
                              <td>{expenses.businessLocation}</td>
                            )}

                            {columnsVisibility.expenseCategory && (
                              <td>
                                {expenseCategoryMap[expenses.expenseCategory] ||
                                  "-"}
                              </td>
                            )}

                            {columnsVisibility.subCategory && (
                              <td>
                                {expenseCategoryMap[expenses.subCategory] ||
                                  "-"}
                              </td>
                            )}

                            {columnsVisibility.tax && (
                              <td>{taxMap[expenses.tax] || "-"}</td>
                            )}

                            {columnsVisibility.totalAmount && (
                              <td>{expenses.totalAmount}</td>
                            )}
                            {columnsVisibility.expenseFor && (
                              <td>{expenses.expenseFor}</td>
                            )}
                            {columnsVisibility.contact && (
                              <td>{expenses.expenseForContact}</td>
                            )}
                            {columnsVisibility.expenseNote && (
                              <td>{expenses.note}</td>
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

        {/* modal */}
        {modalType && (
          <div
            className="modal fade show"
            id="expenseModal"
            tabIndex="-1"
            role="dialog"
            aria-labelledby="expenseModalLabel"
            aria-hidden={!modalType}
            style={{ display: modalType ? "block" : "none" }}
          >
            <div className="modal-dialog" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title" id="expenseModalLabel">
                    {modalType === "add"
                      ? "Add expense"
                      : modalType === "edit"
                      ? "Edit expense"
                      : "View expense"}
                  </h5>
                  <button
                    type="button"
                    className="close"
                    onClick={closeModal}
                    aria-label="Close"
                  >
                    <span aria-hidden="true">&times;</span>
                  </button>
                </div>
                <div className="modal-body">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSave();
                    }}
                  >
                    {(modalType === "add" || modalType === "edit") && (
                      <div>
                        {(modalType === "add" || modalType === "edit") && (
                          <div>
                            <div className="form-group">
                              <label htmlFor="actionDate">Date</label>
                              <input
                                type="date"
                                className="form-control"
                                id="actionDate"
                                value={formData.actionDate}
                                onChange={handleFormChange}
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label htmlFor="referenceNo">Reference No</label>
                              <input
                                type="text"
                                className="form-control"
                                id="referenceNo"
                                value={formData.referenceNo}
                                onChange={handleFormChange}
                                placeholder="Enter reference number"
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label htmlFor="locationAdjustmentType">
                                Location
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                id="locationAdjustmentType"
                                value={formData.locationAdjustmentType}
                                onChange={handleFormChange}
                                placeholder="Enter adjustment type"
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label htmlFor="totalAmount">Total Amount</label>
                              <input
                                type="number"
                                className="form-control"
                                id="totalAmount"
                                value={formData.totalAmount}
                                onChange={handleFormChange}
                                placeholder="Enter total amount"
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label htmlFor="totalAmountRecovered">
                                Total Amount Recovered
                              </label>
                              <input
                                type="number"
                                className="form-control"
                                id="totalAmountRecovered"
                                value={formData.totalAmountRecovered}
                                onChange={handleFormChange}
                                placeholder="Enter recovered amount"
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label htmlFor="reason">Reason</label>
                              <input
                                type="text"
                                className="form-control"
                                id="reason"
                                value={formData.reason}
                                onChange={handleFormChange}
                                placeholder="Enter reason"
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label htmlFor="addedBy">Added By</label>
                              <input
                                type="text"
                                className="form-control"
                                id="addedBy"
                                value={formData.addedBy}
                                onChange={handleFormChange}
                                placeholder="Enter added by"
                                required
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {modalType === "view" && currentListExpense && (
                      <div>
                        <p>
                          <strong>Date:</strong> {currentListExpense.date}
                        </p>
                        <p>
                          <strong>Reference No:</strong>{" "}
                          {currentListExpense.referenceNo}
                        </p>
                        <p>
                          <strong>Recurring Details:</strong>{" "}
                          {currentListExpense.recurringDetails}
                        </p>
                        <p>
                          <strong>Expense Category:</strong>{" "}
                          {currentListExpense.expenseCategory}
                        </p>
                        <p>
                          <strong>Sub Category:</strong>{" "}
                          {currentListExpense.subCategory}
                        </p>
                        <p>
                          <strong>Location:</strong>{" "}
                          {currentListExpense.location}
                        </p>
                        <p>
                          <strong>Payment Status:</strong>{" "}
                          {currentListExpense.paymentStatus}
                        </p>
                        <p>
                          <strong>Tax:</strong> {currentListExpense.tax}
                        </p>
                        <p>
                          <strong>Total Amount:</strong>{" "}
                          {currentListExpense.totalAmount}
                        </p>
                        <p>
                          <strong>Payment Due:</strong>{" "}
                          {currentListExpense.paymentDue}
                        </p>
                        <p>
                          <strong>Expense For:</strong>{" "}
                          {currentListExpense.expenseFor}
                        </p>
                        <p>
                          <strong>Contact:</strong> {currentListExpense.contact}
                        </p>
                        <p>
                          <strong>Expense Note:</strong>{" "}
                          {currentListExpense.expenseNote}
                        </p>
                        <p>
                          <strong>Added By:</strong>{" "}
                          {currentListExpense.addedBy}
                        </p>
                      </div>
                    )}
                    <div className="modal-footer">
                      {modalType === "add" || modalType === "edit" ? (
                        <>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={closeModal}
                          >
                            Close
                          </button>
                          <button type="submit" className="btn btn-primary">
                            Save
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={closeModal}
                        >
                          Close
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListExpense;
