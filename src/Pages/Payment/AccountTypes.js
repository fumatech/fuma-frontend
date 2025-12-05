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

const AccountTypes = () => {
  const [accountTypes, setAccountTypes] = useState([]);
  const [columnsVisibility, setColumnsVisibility] = useState({
    name: true,
    action: true,
  });
  const [modalType, setModalType] = useState(null);
  const [currentAccountType, setCurrentAccountType] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [formData, setFormData] = useState({
    name: "",
    shortName: "",
    allowDecimal: "",
  });

  const columns = [
    { key: "name", label: "Name" },
    { key: "action", label: "Action" },
  ];

  useEffect(() => {
    const fetchAccountTypes = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/accountTypes/getall`
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          setAccountTypes(data);
        } else {
          console.error("Fetched data is not an array");
          setAccountTypes([]);
        }
      } catch (error) {
        console.error("Error fetching account types:", error);
        setAccountTypes([]);
      }

      const script = document.createElement("script");
      script.src = "js/JqueryContent.js";
      script.async = true;
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    };

    fetchAccountTypes();
  }, []);

  const exportCSV = () => {
    const csvData = accountTypes.map((type) => ({
      Name: type.name,
      // Add other fields if necessary
    }));

    const csv = [["Name"], ...csvData.map((row) => Object.values(row))]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, "account_types.csv");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      accountTypes.map((type) => ({
        Name: type.name,
        // Add other fields if necessary
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Account Types");
    XLSX.writeFile(wb, "account_types.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();

    // Define the column headers
    const headers = ["Name", "Actions"];

    // Prepare the data
    const body = accountTypes.slice(startIndex, endIndex).map((accountType) => [
      accountType.name,
      "", // Placeholder for actions (can be omitted)
    ]);

    // Add some space before the table
    doc.text("Account Types List", 14, 20); // Title with a slight offset
    doc.setFontSize(12);
    doc.text("Below is the list of account types:", 14, 30);

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
    doc.save("AccountTypesList.pdf");
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
          <title>Print Account Types</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; }
            th { background-color: #f2f2f2; }
            th, td { text-align: left; }
          </style>
        </head>
        <body>
          <h2>Account Types Report</h2>
          <table>
            <thead>
              <tr>
                ${
                  columnsVisibility.name
                    ? `<th>${
                        columns.find((col) => col.key === "name").label
                      }</th>`
                    : ""
                }
                ${
                  columnsVisibility.action
                    ? `<th>${
                        columns.find((col) => col.key === "action").label
                      }</th>`
                    : ""
                }
              </tr>
            </thead>
            <tbody>
              ${accountTypes
                .slice(startIndex, endIndex)
                .map(
                  (accountType) => `
                    <tr>
                      ${
                        columnsVisibility.name
                          ? `<td>${accountType.name}</td>`
                          : ""
                      }
                      ${
                        columnsVisibility.action
                          ? `<td><button disabled>Edit</button><button disabled>View</button><button disabled>Delete</button></td>`
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

  const handleSaveAccountType = async () => {
    try {
      if (modalType === "edit" && currentAccountType) {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/accountTypes/update/${currentAccountType.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ ...formData, id: currentAccountType.id }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update account type");
        }

        const updatedAccountType = await response.json();
        setAccountTypes((prevTypes) =>
          prevTypes.map((type) =>
            type.id === updatedAccountType.id ? updatedAccountType : type
          )
        );
        closeModal();
        alert("Account type updated successfully!");
      } else if (modalType === "add") {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/accountTypes/save`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
          }
        );

        if (response.status !== 201) {
          throw new Error("Failed to add account type");
        }

        const newAccountType = await response.json();
        setAccountTypes((prevTypes) => [...prevTypes, newAccountType]);
        closeModal();
        alert("Account type added successfully!");
      }
    } catch (error) {
      console.error("Error saving account type:", error);
      alert("Error saving account type");
    }
  };

  const closeModal = () => {
    setModalType(null);
    setCurrentAccountType(null);
    setFormData({ name: "", shortName: "", allowDecimal: "" });
  };

  const handleEdit = (id) => {
    const accountTypeToEdit = accountTypes.find((type) => type.id === id);
    if (accountTypeToEdit) {
      setCurrentAccountType(accountTypeToEdit);
      setFormData({
        name: accountTypeToEdit.name,
        shortName: accountTypeToEdit.shortName,
        allowDecimal: accountTypeToEdit.allowDecimal,
      });
      setModalType("edit");
    }
  };

  const handleView = (id) => {
    const accountTypeToView = accountTypes.find((type) => type.id === id);
    if (accountTypeToView) {
      setCurrentAccountType(accountTypeToView);
      setModalType("view");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this account type?")) {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/accountTypes/delete/${id}`,
          {
            method: "DELETE",
          }
        );

        if (response.status === 204) {
          setAccountTypes((prevTypes) =>
            prevTypes.filter((type) => type.id !== id)
          );
          alert("Account type deleted successfully!");
        } else {
          alert("Failed to delete account type.");
        }
      } catch (error) {
        console.error("Error deleting account type:", error);
        alert("Error deleting account type");
      }
    }
  };

  return (
    <div className="wrapper">
      <div className="">
        <section className="content-header py-3">
          <div className="container-fluid"></div>
        </section>
        <section className="content">
          <div className="container-fluid">
            <div className="card cardHover rounded-4 border-0">
              <div className="d-flex justify-content-end mb-3">
                <button
                  className="btn btn-add"
                  onClick={() => setModalType("add")}
                >
                  <i className="fas fa-plus"></i> Add
                </button>
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
                        {columns.map(({ key, label }) => (
                          <div
                            key={key}
                            className="dropdown-item d-flex align-items-center"
                          >
                            <input
                              type="checkbox"
                              checked={columnsVisibility[key]}
                              onChange={() => toggleColumn(key)}
                              className="mr-2"
                            />
                            {label}
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
                        {columnsVisibility.name && (
                          <th>
                            {columns.find((col) => col.key === "name").label}
                          </th>
                        )}
                        {columnsVisibility.action && (
                          <th>
                            {columns.find((col) => col.key === "action").label}
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {accountTypes
                        .slice(startIndex, endIndex)
                        .map((accountType) => (
                          <tr key={accountType.id}>
                            {columnsVisibility.name && (
                              <td>{accountType.name}</td>
                            )}
                            {columnsVisibility.action && (
                              <td>
                                <button
                                  className="btn btn-edit btn-sm mr-2"
                                  onClick={() => handleEdit(accountType.id)}
                                >
                                  <i className="fas fa-edit"></i> Edit
                                </button>
                                <button
                                  className="btn btn-view btn-sm mr-2"
                                  onClick={() => handleView(accountType.id)}
                                >
                                  <i className="fas fa-eye"></i> View
                                </button>
                                <button
                                  className="btn btn-delete btn-sm"
                                  onClick={() => handleDelete(accountType.id)}
                                >
                                  <i className="fas fa-trash"></i> Delete
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

        {/* modal */}
        {modalType && (
          <div
            className="modal fade show"
            id="accountTypeModal"
            tabIndex="-1"
            role="dialog"
            aria-labelledby="accountTypeModalLabel"
            aria-hidden={!modalType}
            style={{ display: modalType ? "block" : "none" }}
          >
            <div className="modal-dialog" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title" id="accountTypeModalLabel">
                    {modalType === "add"
                      ? "Add Account Type"
                      : modalType === "edit"
                      ? "Edit Account Type"
                      : "View Account Type"}
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
                      handleSaveAccountType();
                    }}
                  >
                    {(modalType === "add" || modalType === "edit") && (
                      <div>
                        <div className="form-group">
                          <label htmlFor="name">Name</label>
                          <input
                            type="text"
                            className="form-control"
                            id="name"
                            value={formData.name}
                            onChange={handleFormChange}
                            placeholder="Enter account type name"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="shortName">Short Name</label>
                          <input
                            type="text"
                            className="form-control"
                            id="shortName"
                            value={formData.shortName}
                            onChange={handleFormChange}
                            placeholder="Enter short name"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="allowDecimal">Allow Decimal</label>
                          <select
                            id="allowDecimal"
                            className="form-control"
                            value={formData.allowDecimal}
                            onChange={handleFormChange}
                            required
                          >
                            <option value="">Select...</option>
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {modalType === "view" && currentAccountType && (
                      <div>
                        <p>
                          <strong>Name:</strong> {currentAccountType.name}
                        </p>
                        <p>
                          <strong>Short Name:</strong>{" "}
                          {currentAccountType.shortName}
                        </p>
                        <p>
                          <strong>Allow Decimal:</strong>{" "}
                          {currentAccountType.allowDecimal ? "Yes" : "No"}
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

export default AccountTypes;
