import React, { useState } from "react";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import "bootstrap/dist/css/bootstrap.min.css";
import { Link } from "react-router-dom";

function Designations({ userRoles }) {
  const [designations, setDesignations] = useState([
    {
      id: 1,
      designation: "Software Engineer",
      description: "Annual Leave for vacation",
    },
    {
      id: 2,
      designation: "Project Manager",
      description: "Sick leave due to illness",
    },
    {
      id: 3,
      designation: "HR Specialist",
      description: "Personal leave for family matter",
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDesignation, setNewDesignation] = useState({
    designation: "",
    description: "",
  });

  const [columnsVisibility, setColumnsVisibility] = useState({
    designation: true,
    description: true,
  });

  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Handle entries per page change
  const handleEntriesChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // Handle input changes for the form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewDesignation((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle adding new designation
  const handleAddDesignation = (e) => {
    e.preventDefault();
    if (!newDesignation.designation.trim()) {
      alert("Designation is required");
      return;
    }

    const newDesignationItem = {
      id: designations.length + 1,
      designation: newDesignation.designation,
      description: newDesignation.description,
    };

    setDesignations([...designations, newDesignationItem]);
    setIsModalOpen(false);
    setNewDesignation({
      designation: "",
      description: "",
    });
  };

  // Export functions
  const exportCSV = () => {
    const csvData = designations.map((item) => ({
      Designation: item.designation,
      Description: item.description,
    }));

    const csv = [
      ["Designation", "Description"],
      ...csvData.map((row) => Object.values(row)),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, "designations.csv");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(designations);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Designations");
    XLSX.writeFile(wb, "designations.xlsx");
  };

  const printData = () => {
    const printWindow = window.open("", "", "height=800,width=1200");
    printWindow.document.write("<html><head><title>Print Designations</title>");
    printWindow.document.write(
      '<link rel="stylesheet" href="httpss://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">'
    );
    printWindow.document.write("</head><body>");
    printWindow.document.write(
      document.getElementById("table-container").innerHTML
    );
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [["Designation", "Description"]],
      body: designations.map((item) => [item.designation, item.description]),
    });
    doc.save("designations.pdf");
  };

  // Toggle column visibility
  const toggleColumn = (column) => {
    setColumnsVisibility((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  // Handle delete designation
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this designation?")) {
      setDesignations(designations.filter((item) => item.id !== id));
    }
  };

  // Pagination calculations
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const displayedDesignations = designations.slice(startIndex, endIndex);

  return (
    <div className="wrapper">
      <div className="">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6">
                <h1 className="all-heading m-0">Designations</h1>
                <span className="display-inline sub-heading">
                  Manage designations
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="content">
          <div className="container-fluid">
            <div className="card cardHover rounded-4 border-0">
              <div className="text-right">
                <button
                  className="btn btn-add"
                  onClick={() => setIsModalOpen(true)}
                >
                  Add
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
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
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
                        className="dropdown-menu"
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
                            <span className="btn border-0 bg-transparent p-0 m-0">
                              {col.replace(/([A-Z])/g, " $1").toUpperCase()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="tw-flow-root tw-border-gray-200">
                  <div className="">
                    <div className="tw-py-2 tw-align-middle sm:tw-px-5">
                      <div className="table-responsive">
                        <div id="table-container">
                          <table className="table table-bordered table-striped">
                            <thead>
                              <tr>
                                {columnsVisibility.designation && (
                                  <th>Designation</th>
                                )}
                                {columnsVisibility.description && (
                                  <th>Description</th>
                                )}
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {displayedDesignations.map((item) => (
                                <tr key={item.id}>
                                  {columnsVisibility.designation && (
                                    <td>{item.designation}</td>
                                  )}
                                  {columnsVisibility.description && (
                                    <td>{item.description}</td>
                                  )}
                                  <td>
                                    <Link
                                      to={`/EditCustomer/${item.id}`}
                                      className="btn btn-edit"
                                    >
                                      <i className="fas fa-edit btn-icon"></i>{" "}
                                      Edit
                                    </Link>
                                    <button
                                      onClick={() => handleDelete(item.id)}
                                      className="btn btn-delete ml-2"
                                    >
                                      <i className="fas fa-trash btn-icon"></i>{" "}
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Add Designation Modal */}
      {isModalOpen && (
        <>
          <div
            className="modal fade show"
            style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
            onClick={() => setIsModalOpen(false)}
          ></div>
          <div
            className="modal fade show"
            style={{ display: "block", overflowX: "hidden", overflowY: "auto" }}
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
            aria-labelledby="addDesignationModalTitle"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsModalOpen(false);
              }
            }}
          >
            <div
              className="modal-dialog modal-lg modal-dialog-centered"
              role="document"
            >
              <div className="modal-content">
                <form onSubmit={handleAddDesignation}>
                  <div className="modal-header bg-primary text-white">
                    <h5 className="modal-title" id="addDesignationModalTitle">
                      Add Designation
                    </h5>
                    <button
                      type="button"
                      className="close text-white"
                      aria-label="Close"
                      onClick={() => setIsModalOpen(false)}
                    >
                      <span aria-hidden="true">&times;</span>
                    </button>
                  </div>
                  <div className="modal-body">
                    {/* Designation Input */}
                    <div className="form-group">
                      <label htmlFor="designation" className="font-weight-bold">
                        Designation:*
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="designation"
                        name="designation"
                        value={newDesignation.designation}
                        onChange={handleInputChange}
                        placeholder="Enter designation"
                        required
                      />
                    </div>

                    {/* Description Input */}
                    <div className="form-group">
                      <label htmlFor="description" className="font-weight-bold">
                        Description:
                      </label>
                      <textarea
                        className="form-control"
                        id="description"
                        name="description"
                        rows="3"
                        value={newDesignation.description}
                        onChange={handleInputChange}
                        placeholder="Enter description"
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Close
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Designations;
