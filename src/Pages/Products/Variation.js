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
import { toast } from "react-toastify";

const Variation = () => {
  const [variations, setVariations] = useState([]);
  const [filteredVariations, setFilteredVariations] = useState([]);
  const [columnsVisibility, setColumnsVisibility] = useState({
    variationName: true,
    Value: true,
    Action: true,
  });
  const [modalType, setModalType] = useState(null); // "add", "edit", or "view"
  const [currentVariation, setCurrentVariation] = useState(null); // For viewing/editing
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [formData, setFormData] = useState({
    variationName: "",
    values: [""], // Changed to an array of values
  });

  // State variables for filters
  const [filterValues, setFilterValues] = useState({
    variationNames: [],
  });

  const [activeFilters, setActiveFilters] = useState({
    variationName: "",
  });

  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    const fetchVariations = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/variations/getall`
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          setVariations(
            data.map((variation) => ({
              ...variation,
              values: Array.isArray(variation.values) ? variation.values : [], // Ensure values is always an array
            }))
          );
          setFilteredVariations(
            data.map((variation) => ({
              ...variation,
              values: Array.isArray(variation.values) ? variation.values : [],
            }))
          );
        } else {
          console.error("Fetched data is not an array");
          setVariations([]);
          setFilteredVariations([]);
        }
      } catch (error) {
        console.error("Error fetching variations:", error);
        setVariations([]);
        setFilteredVariations([]);
      }

      const script = document.createElement("script");
      script.src = "js/JqueryContent.js";
      script.async = true;

      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    };

    fetchVariations();
  }, []);

  // Extract filter values when variations data changes
  useEffect(() => {
    if (variations.length > 0) {
      const variationNames = [
        ...new Set(variations.map((item) => item.variationName)),
      ].filter(Boolean);

      setFilterValues({
        variationNames,
      });
    }
  }, [variations]);

  // Apply filters whenever activeFilters or variations changes
  useEffect(() => {
    const filteredData = variations.filter((variation) => {
      const variationNameMatch =
        activeFilters.variationName === "" ||
        variation.variationName === activeFilters.variationName;

      return variationNameMatch;
    });

    setFilteredVariations(filteredData);
  }, [activeFilters, variations]);

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
      variationName: "",
    });
  };

  const exportCSV = () => {
    const csvData = filteredVariations.map((variation) => ({
      variationName: variation.variationName,
      Value: variation.values.join(", "),
    }));

    const csv = [
      ["Variation Name", "Value"],
      ...csvData.map((row) => Object.values(row)),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, "variations.csv");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredVariations.map((variation) => ({
        variationName: variation.variationName,
        Value: variation.values.join(", "),
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Variations");
    XLSX.writeFile(wb, "variations.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [["Variation Name", "Value"]],
      body: filteredVariations.map((variation) => [
        variation.variationName,
        variation.values.join(", "),
      ]),
    });
    doc.save("variations.pdf");
  };

  const toggleColumn = (column) => {
    setColumnsVisibility((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  const printData = () => {
    const tableContainer = document.getElementById("table-container");
    const clonedContainer = tableContainer.cloneNode(true);
    const $clonedContainer = $(clonedContainer);

    $clonedContainer.find(".dataTables_filter").remove();
    $clonedContainer.find(".dataTables_paginate").remove();
    $clonedContainer.find(".dataTables_info").remove();
    $clonedContainer.find("td button").remove();

    const printWindow = window.open("", "", "height=800,width=1200");

    printWindow.document.write("<html><head><title>Print</title>");
    printWindow.document.write(
      '<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">'
    );
    printWindow.document.write("</head><body>");
    printWindow.document.write($clonedContainer.html());
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleValueChange = (index, newValue) => {
    setFormData((prevFormData) => {
      const updatedValues = [...prevFormData.values];
      updatedValues[index] = newValue; // Update the specific index with the new value
      return { ...prevFormData, values: updatedValues };
    });
  };

  const addValueField = () => {
    setFormData({ ...formData, values: [...formData.values, ""] });
  };

  const removeValueField = (index) => {
    const values = formData.values.filter((_, i) => i !== index);
    setFormData({ ...formData, values: values });
  };

  const handleEntriesChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;

  const handleEdit = (id) => {
    const variationToEdit = filteredVariations.find(
      (variation) => variation.id === id
    );
    if (variationToEdit) {
      setCurrentVariation(variationToEdit);
      setFormData({
        variationName: variationToEdit.variationName,
        values: variationToEdit.values || [], // Corrected to ensure it's an array
      });
      setModalType("edit");
    }
  };

  const handleSaveVariation = async () => {
    try {
      if (modalType === "edit" && currentVariation) {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/variations/update/${currentVariation.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ ...formData, id: currentVariation.id }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update variation");
        }

        const updatedVariation = await response.json();
        setVariations((prevVariations) =>
          prevVariations.map((variation) =>
            variation.id === updatedVariation.id ? updatedVariation : variation
          )
        );
        closeModal();
        toast.success("Variation updated successfully!");
      } else if (modalType === "add") {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/variations/save`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formData), // Ensure formData is structured correctly
          }
        );

        if (response.status !== 201) {
          throw new Error("Failed to add variation");
        }

        const newVariation = await response.json();
        setVariations((prevVariations) => [...prevVariations, newVariation]);
        closeModal();
        toast.success("Variation added successfully!");
      }
    } catch (error) {
      // console.error("Error saving variation:", error);
      toast.error("Error saving variation");
    }
  };

  const closeModal = () => {
    setModalType(null);
    setCurrentVariation(null);
  };

  const handleView = (id) => {
    const variationToView = filteredVariations.find(
      (variation) => variation.id === id
    );
    if (variationToView) {
      setCurrentVariation(variationToView);
      setModalType("view");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this variation?")) {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/variations/delete/${id}`,
          {
            method: "DELETE",
          }
        );

        if (response.status === 204) {
          setVariations((prevVariations) =>
            prevVariations.filter((variation) => variation.id !== id)
          );
          toast.success("Variation deleted successfully!");
        } else {
          toast.error("Failed to delete variation.");
        }
      } catch (error) {
        //console.error("Error deleting variation:", error);
        toast.error("Error deleting variation");
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
                <h1>Variation</h1>
                <span className="d-inline d-md-block">Manage Variation</span>
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
                      {/* Variation Name Dropdown */}
                      <div className="col-md-6">
                        <div className="form-group">
                          <label className="me-2">Variation Name:</label>
                          <select
                            className="form-select"
                            name="variationName"
                            value={activeFilters.variationName}
                            onChange={handleFilterChange}
                          >
                            <option value="">All Variations</option>
                            {filterValues.variationNames.map((name, index) => (
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
                        {columnsVisibility.variationName && (
                          <th>Variation Name</th>
                        )}
                        {columnsVisibility.Value && <th>Value</th>}
                        {columnsVisibility.Action && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVariations
                        .slice(startIndex, endIndex)
                        .map((variation) => (
                          <tr key={variation.id}>
                            {columnsVisibility.variationName && (
                              <td>{variation.variationName}</td>
                            )}
                            {columnsVisibility.Value && (
                              <td>{(variation.values || []).join(", ")}</td>
                            )}
                            {columnsVisibility.Action && (
                              <td>
                                <button
                                  className="btn btn-edit btn-sm mr-2"
                                  onClick={() => handleEdit(variation.id)}
                                >
                                  <i className="fas fa-edit"></i> Edit
                                </button>
                                <button
                                  className="btn btn-view btn-sm mr-2"
                                  onClick={() => handleView(variation.id)}
                                >
                                  <i className="fas fa-eye"></i> View
                                </button>
                                <button
                                  className="btn btn-delete btn-sm"
                                  onClick={() => handleDelete(variation.id)}
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
            id="variationModal"
            tabIndex="-1"
            role="dialog"
            aria-labelledby="variationModalLabel"
            aria-hidden={!modalType}
            style={{ display: modalType ? "block" : "none" }}
          >
            <div className="modal-dialog" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title" id="variationModalLabel">
                    {modalType === "add"
                      ? "Add Variation"
                      : modalType === "edit"
                      ? "Edit Variation"
                      : "View Variation"}
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
                      handleSaveVariation();
                    }}
                  >
                    {(modalType === "add" || modalType === "edit") && (
                      <div>
                        <div className="form-group">
                          <label htmlFor="variationName">Variation Name</label>
                          <input
                            type="text"
                            className="form-control"
                            id="variationName"
                            value={formData.variationName}
                            onChange={handleFormChange}
                            placeholder="Enter variation name"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="Value">Add variation Value</label>
                          {formData.values.map((value, index) => (
                            <div className="input-group mb-3" key={index}>
                              <input
                                type="text"
                                className="form-control"
                                value={value}
                                onChange={(e) =>
                                  handleValueChange(index, e.target.value)
                                }
                                placeholder="Enter value"
                                required
                              />
                              <div className="input-group-append">
                                {/* Show the plus icon only for the first field */}
                                {index === 0 && (
                                  <button
                                    type="button"
                                    className="btn btn-success btn-sm mx-3"
                                    onClick={addValueField}
                                  >
                                    <i className="fas fa-plus"></i>
                                  </button>
                                )}
                                {/* Show the minus icon only for fields other than the first one */}
                                {index > 0 && (
                                  <button
                                    type="button"
                                    className="btn btn-danger btn-sm mx-3"
                                    onClick={() => removeValueField(index)}
                                  >
                                    <i className="fas fa-minus"></i>
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {modalType === "view" && currentVariation && (
                      <div>
                        <p>
                          <strong>Variation Name:</strong>{" "}
                          {currentVariation.variationName}
                        </p>
                        <p>
                          <strong>Value:</strong>{" "}
                          {(currentVariation.values || []).join(", ")}
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

export default Variation;
