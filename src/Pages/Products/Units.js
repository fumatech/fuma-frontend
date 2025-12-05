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
import { Collapse } from "react-bootstrap";

function Units({ userRoles }) {
  const [units, setUnits] = useState([]);
  const [filteredUnits, setFilteredUnits] = useState([]);
  const [columnsVisibility, setColumnsVisibility] = useState({
    name: true,
    shortName: true,
    allowDecimal: true,
    action: true,
  });
  const [modalType, setModalType] = useState(null);
  const [currentUnit, setCurrentUnit] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [formData, setFormData] = useState({
    name: "",
    shortName: "",
    allowDecimal: "",
  });

  // State variables for filters
  const [filterValues, setFilterValues] = useState({
    unitNames: [],
  });
  
  const [activeFilters, setActiveFilters] = useState({
    unitName: "",
  });
  
  const [filterOpen, setFilterOpen] = useState(false);

  const hasPermission = (permission) => {
    return userRoles.some((role) =>
      role.permissions.some((p) => p.name === permission)
    );
  };

  const fetchUnits = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/units/getall`
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setUnits(data);
        setFilteredUnits(data);
      } else {
        console.error("Fetched data is not an array");
        setUnits([]);
        setFilteredUnits([]);
      }
    } catch (error) {
      console.error("Error fetching units:", error);
      setUnits([]);
      setFilteredUnits([]);
    }
    // Add external script directly without setTimeout
    const script = document.createElement("script");
    script.src = "js/JqueryContent.js";
    script.async = true;

    document.body.appendChild(script);

    // Cleanup function to remove the script element when the component is unmounted
    return () => {
      document.body.removeChild(script);
    };
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  // Extract filter values when units data changes
  useEffect(() => {
    if (units.length > 0) {
      const unitNames = [...new Set(units.map(item => item.name))].filter(Boolean);
      
      setFilterValues({
        unitNames,
      });
    }
  }, [units]);

  // Apply filters whenever activeFilters or units changes
  useEffect(() => {
    const filteredData = units.filter((unit) => {
      const unitNameMatch = activeFilters.unitName === "" || unit.name === activeFilters.unitName;
      
      return unitNameMatch;
    });
    
    setFilteredUnits(filteredData);
  }, [activeFilters, units]);

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
      unitName: "",
    });
  };

  const exportCSV = () => {
    const csvData = filteredUnits.map((unit) => ({
      Name: unit.name,
      ShortName: unit.shortName,
      AllowDecimal: unit.allowDecimal,
    }));

    const csv = [
      ["Name", "Short Name", "Allow Decimal"],
      ...csvData.map((row) => Object.values(row)),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, "units.csv");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredUnits.map((unit) => ({
        Name: unit.name,
        ShortName: unit.shortName,
        AllowDecimal: unit.allowDecimal,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Units");
    XLSX.writeFile(wb, "units.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [["Name", "Short Name", "Allow Decimal"]],
      body: filteredUnits.map((unit) => [unit.name, unit.shortName, unit.allowDecimal]),
    });
    doc.save("units.pdf");
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
          <title>Print Units</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; }
            th { background-color: #f2f2f2; }
            th, td { text-align: left; }
          </style>
        </head>
        <body>
          <h2>Units Report</h2>
          <table>
            <thead>
              <tr>
                ${columnsVisibility.name ? "<th>Name</th>" : ""}
                ${columnsVisibility.shortName ? "<th>Short Name</th>" : ""}
                ${
                  columnsVisibility.allowDecimal ? "<th>Allow Decimal</th>" : ""
                }
              </tr>
            </thead>
            <tbody>
              ${filteredUnits
                .slice(startIndex, endIndex)
                .map(
                  (unit) => `
                  <tr>
                    ${columnsVisibility.name ? `<td>${unit.name}</td>` : ""}
                    ${
                      columnsVisibility.shortName
                        ? `<td>${unit.shortName}</td>`
                        : ""
                    }
                    ${
                      columnsVisibility.allowDecimal
                        ? `<td>${unit.allowDecimal ? "Yes" : "No"}</td>`
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
    setCurrentPage(1); // Reset to the first page when entries per page changes
  };

  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;

  const handleSaveUnit = async () => {
    try {
      if (modalType === "edit" && currentUnit) {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/units/update/${currentUnit.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ ...formData, id: currentUnit.id }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update unit");
        }

        const updatedUnit = await response.json();
        setUnits((prevUnits) =>
          prevUnits.map((unit) =>
            unit.id === updatedUnit.id ? updatedUnit : unit
          )
        );
        closeModal(); // Close the modal
        fetchUnits();
        alert("Unit updated successfully!");
      } else if (modalType === "add") {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/units/save`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
          }
        );

        if (response.status !== 201) {
          throw new Error("Failed to add unit");
        }

        const newUnit = await response.json();
        setUnits((prevUnits) => [...prevUnits, newUnit]);
        closeModal();
        fetchUnits();
        alert("Unit added successfully!");
      }
    } catch (error) {
      console.error("Error saving unit:", error);
      alert("Error saving unit");
    }
  };

  const closeModal = () => {
    setModalType(null);
    setCurrentUnit(null);
    setFormData({ name: "", shortName: "", allowDecimal: "" });
  };

  const handleEdit = (id) => {
    const unitToEdit = filteredUnits.find((unit) => unit.id === id);
    if (unitToEdit) {
      setCurrentUnit(unitToEdit);
      setFormData({
        name: unitToEdit.name,
        shortName: unitToEdit.shortName,
        allowDecimal: unitToEdit.allowDecimal,
      });
      setModalType("edit");
    }
  };

  const handleView = (id) => {
    const unitToView = filteredUnits.find((unit) => unit.id === id);
    if (unitToView) {
      setCurrentUnit(unitToView);
      setModalType("view");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this unit?")) {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/units/delete/${id}`,
          {
            method: "DELETE",
          }
        );

        if (response.status === 204) {
          setUnits((prevUnits) => prevUnits.filter((unit) => unit.id !== id));
          alert("Unit deleted successfully!");
        } else {
          alert("Failed to delete unit.");
        }
      } catch (error) {
        console.error("Error deleting unit:", error);
        alert("Error deleting unit");
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
                <h1 className="all-heading ">Units</h1>
                <span className="d-inline d-md-block sub-heading">
                  Manage Units
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
                      {/* Unit Name Dropdown */}
                      <div className="col-md-6">
                        <div className="form-group">
                          <label className="me-2">Unit Name:</label>
                          <select
                            className="form-select"
                            name="unitName"
                            value={activeFilters.unitName}
                            onChange={handleFilterChange}
                          >
                            <option value="">All Units</option>
                            {filterValues.unitNames.map((name, index) => (
                              <option key={`name-${index}`} value={name}>
                                {name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Reset Button */}
                      <div className="col-md-6 d-flex align-items-end">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            resetFilters();
                          }}
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
                {hasPermission("units.add") && (
                  <button
                    className="btn btn-add"
                    onClick={() => setModalType("add")}
                  >
                    <i className="fas fa-plus"></i> Add
                  </button>
                )}
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
                    className="table table-bordered table-hover shadow"
                  >
                    <thead>
                      <tr>
                        {columnsVisibility.name && <th>Name</th>}
                        {columnsVisibility.shortName && <th>Short Name</th>}
                        {columnsVisibility.allowDecimal && (
                          <th>Allow Decimal</th>
                        )}
                        {columnsVisibility.action && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUnits.slice(startIndex, endIndex).map((unit) => (
                        <tr key={unit.id}>
                          {columnsVisibility.name && <td>{unit.name}</td>}
                          {columnsVisibility.shortName && (
                            <td>{unit.shortName}</td>
                          )}
                          {columnsVisibility.allowDecimal && (
                            <td>{unit.allowDecimal ? "Yes" : "No"}</td>
                          )}

                          {/* action btn */}
                          {columnsVisibility.action && (
                            <td>
                              {" "}
                              {hasPermission("units.edit") && (
                                <button
                                  className="btn btn-edit btn-sm mr-2"
                                  onClick={() => handleEdit(unit.id)}
                                >
                                  <i className="fas fa-edit"></i> Edit
                                </button>
                              )}
                              {hasPermission("units.view") && (
                                <button
                                  className="btn btn-view btn-sm mr-2"
                                  onClick={() => handleView(unit.id)}
                                >
                                  <i className="fas fa-eye"></i> View
                                </button>
                              )}
                              {hasPermission("units.delete") && (
                                <button
                                  className="btn btn-delete btn-sm"
                                  onClick={() => handleDelete(unit.id)}
                                >
                                  <i className="fas fa-trash"></i> Delete
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

        {/* modal */}
        {modalType && (
          <div
            className="modal fade show"
            id="unitModal"
            tabIndex="-1"
            role="dialog"
            aria-labelledby="unitModalLabel"
            aria-hidden={!modalType}
            style={{ display: modalType ? "block" : "none" }}
          >
            <div className="modal-dialog" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title" id="unitModalLabel">
                    {modalType === "add"
                      ? "Add Unit"
                      : modalType === "edit"
                      ? "Edit Unit"
                      : "View Unit"}
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
                      handleSaveUnit();
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
                            placeholder="Enter unit name"
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
                            <option value={true}>Yes</option>
                            <option value={false}>No</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {modalType === "view" && currentUnit && (
                      <div>
                        <p>
                          <strong>Name:</strong> {currentUnit.name}
                        </p>
                        <p>
                          <strong>Short Name:</strong> {currentUnit.shortName}
                        </p>
                        <p>
                          <strong>Allow Decimal:</strong>{" "}
                          {currentUnit.allowDecimal ? "Yes" : "No"}
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
}

export default Units;