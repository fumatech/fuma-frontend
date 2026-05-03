import React, { useEffect, useMemo, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../assets/dist/css/adminlte.min.css";
import "../../assets/plugins/fontawesome-free/css/all.min.css";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import Collapse from "react-bootstrap/Collapse";
import Dropdown from "react-bootstrap/Dropdown";
import { toast } from "react-toastify";
import BackButton from "../../components/BackButton";
import "./ListProducts.css";
import "./ProductAdminTheme.css";

const initialForm = {
  variationName: "",
  values: [""],
};

function Variation() {
  const [variations, setVariations] = useState([]);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(true);
  const [variationFilter, setVariationFilter] = useState("");
  const [columnsVisibility, setColumnsVisibility] = useState({
    variationName: true,
    values: true,
    actions: true,
  });
  const [modalMode, setModalMode] = useState(null);
  const [currentVariation, setCurrentVariation] = useState(null);
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchVariations();
  }, []);

  const fetchVariations = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/variations/getall`);
      const data = await response.json();
      const normalized = Array.isArray(data)
        ? data.map((item) => ({
            ...item,
            values: Array.isArray(item.values) ? item.values : [],
          }))
        : [];
      setVariations(normalized);
    } catch (error) {
      setVariations([]);
      toast.error("Error fetching variations");
    }
  };

  const variationOptions = useMemo(
    () => [...new Set(variations.map((item) => item.variationName))].filter(Boolean),
    [variations],
  );

  const filteredVariations = useMemo(() => {
    if (!variationFilter) return variations;
    return variations.filter((variation) => variation.variationName === variationFilter);
  }, [variationFilter, variations]);

  const totalPages = Math.max(1, Math.ceil(filteredVariations.length / entriesPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const displayedVariations = filteredVariations.slice(startIndex, endIndex);

  useEffect(() => {
    if (safePage !== currentPage) {
      setCurrentPage(safePage);
    }
  }, [safePage, currentPage]);

  const toggleColumn = (column) => {
    setColumnsVisibility((prev) => ({ ...prev, [column]: !prev[column] }));
  };

  const openAddModal = () => {
    setModalMode("add");
    setCurrentVariation(null);
    setFormData(initialForm);
  };

  const openEditModal = (variation) => {
    setModalMode("edit");
    setCurrentVariation(variation);
    setFormData({
      variationName: variation.variationName || "",
      values: Array.isArray(variation.values) && variation.values.length
        ? variation.values
        : [""],
    });
  };

  const openViewModal = (variation) => {
    setCurrentVariation(variation);
    setModalMode("view");
  };

  const closeModal = () => {
    setModalMode(null);
    setCurrentVariation(null);
    setFormData(initialForm);
  };

  const handleVariationNameChange = (event) => {
    setFormData((prev) => ({ ...prev, variationName: event.target.value }));
  };

  const handleValueChange = (index, value) => {
    setFormData((prev) => {
      const next = [...prev.values];
      next[index] = value;
      return { ...prev, values: next };
    });
  };

  const addValueField = () => {
    setFormData((prev) => ({ ...prev, values: [...prev.values, ""] }));
  };

  const removeValueField = (index) => {
    setFormData((prev) => {
      const next = prev.values.filter((_, idx) => idx !== index);
      return { ...prev, values: next.length ? next : [""] };
    });
  };

  const handleSaveVariation = async () => {
    const cleanedValues = formData.values.map((value) => value.trim()).filter(Boolean);

    if (!formData.variationName.trim()) {
      toast.warning("Variation name is required");
      return;
    }

    if (!cleanedValues.length) {
      toast.warning("At least one variation value is required");
      return;
    }

    try {
      const isEdit = modalMode === "edit" && currentVariation?.id;
      const url = isEdit
        ? `${process.env.REACT_APP_BASE_URL}/variations/update/${currentVariation.id}`
        : `${process.env.REACT_APP_BASE_URL}/variations/save`;

      const payload = {
        variationName: formData.variationName.trim(),
        values: cleanedValues,
        ...(isEdit ? { id: currentVariation.id } : {}),
      };

      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Unable to save variation");
      }

      await fetchVariations();
      closeModal();
      toast.success(`Variation ${isEdit ? "updated" : "added"} successfully`);
    } catch (error) {
      toast.error("Error saving variation");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this variation?")) {
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/variations/delete/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      await fetchVariations();
      toast.success("Variation deleted successfully");
    } catch (error) {
      toast.error("Failed to delete variation");
    }
  };

  const exportRows = filteredVariations.map((row) => ({
    "Variation Name": row.variationName || "-",
    Values: (row.values || []).join(", ") || "-",
  }));

  const exportCSV = () => {
    if (!exportRows.length) return;
    const csv = [
      Object.keys(exportRows[0]).join(","),
      ...exportRows.map((row) =>
        Object.values(row)
          .map((value) => `"${value ?? ""}"`)
          .join(","),
      ),
    ].join("\n");
    saveAs(new Blob([csv], { type: "text/csv" }), "Variations.csv");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Variations");
    XLSX.writeFile(wb, "Variations.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [Object.keys(exportRows[0] || {})],
      body: exportRows.map((row) => Object.values(row)),
      headStyles: { fillColor: [12, 68, 97] },
      styles: { fontSize: 8 },
    });
    doc.save("Variations.pdf");
  };

  const printData = () => window.print();

  const renderPagination = () => {
    const pages = [];
    const visibleCount = 5;
    let start = Math.max(1, safePage - Math.floor(visibleCount / 2));
    const end = Math.min(totalPages, start + visibleCount - 1);
    start = Math.max(1, end - visibleCount + 1);

    for (let page = start; page <= end; page += 1) {
      pages.push(
        <button
          key={page}
          type="button"
          className={`erp-page-btn ${page === safePage ? "active" : ""}`}
          onClick={() => setCurrentPage(page)}
        >
          {page}
        </button>,
      );
    }

    return (
      <div className="erp-pagination">
        <button
          type="button"
          className="erp-page-btn"
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          disabled={safePage <= 1}
        >
          <i className="fa fa-chevron-left"></i>
        </button>
        {pages}
        <button
          type="button"
          className="erp-page-btn"
          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={safePage >= totalPages}
        >
          <i className="fa fa-chevron-right"></i>
        </button>
      </div>
    );
  };

  return (
    <div className="wrapper">
      <div className="content-wrapper erp-product-page erp-master-page">
        <section className="content pt-3">
          <div className="container-fluid">
            <div className="erp-page-header rounded-4 p-3 mb-3">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <BackButton />
                    <h1 className="erp-page-title mb-0">Variations</h1>
                  </div>
                </div>
                <button type="button" className="erp-btn erp-btn-primary" onClick={openAddModal}>
                  <i className="fa fa-plus"></i>
                  Add Variation
                </button>
              </div>
            </div>

            <div className="erp-filter-card rounded-4 mb-3">
              <div className="erp-filter-head" onClick={() => setFilterOpen((prev) => !prev)}>
                <span>
                  <i className="fa fa-filter me-2"></i>
                  Filter
                </span>
                <i className={`fa ${filterOpen ? "fa-chevron-up" : "fa-chevron-down"}`}></i>
              </div>
              <Collapse in={filterOpen}>
                <div className="border-top erp-filter-body p-3">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="erp-label">Variation Name</label>
                      <select
                        className="form-select"
                        value={variationFilter}
                        onChange={(event) => {
                          setVariationFilter(event.target.value);
                          setCurrentPage(1);
                        }}
                      >
                        <option value="">All Variations</option>
                        {variationOptions.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 d-flex align-items-end">
                      <button
                        type="button"
                        className="erp-btn erp-btn-light"
                        onClick={() => {
                          setVariationFilter("");
                          setCurrentPage(1);
                        }}
                      >
                        <i className="fa fa-undo"></i>
                        Reset Filters
                      </button>
                    </div>
                  </div>
                </div>
              </Collapse>
            </div>

            <div className="erp-table-card rounded-4 p-3">
              <div className="erp-table-toolbar">
                <div className="erp-toolbar-left">
                  <label className="erp-entries">
                    Show
                    <select
                      className="form-select form-select-sm"
                      value={entriesPerPage}
                      onChange={(event) => {
                        setEntriesPerPage(Number(event.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    Entries
                  </label>

                  <div className="erp-export-group">
                    <button type="button" className="erp-btn erp-btn-light" onClick={exportCSV}>
                      <i className="fa fa-file-csv"></i>
                      CSV
                    </button>
                    <button type="button" className="erp-btn erp-btn-light" onClick={exportExcel}>
                      <i className="fa fa-file-excel"></i>
                      Excel
                    </button>
                    <button type="button" className="erp-btn erp-btn-light" onClick={exportPDF}>
                      <i className="fa fa-file-pdf"></i>
                      PDF
                    </button>
                    <button type="button" className="erp-btn erp-btn-light" onClick={printData}>
                      <i className="fa fa-print"></i>
                      Print
                    </button>
                  </div>

                  <Dropdown>
                    <Dropdown.Toggle className="btn erp-btn erp-btn-light erp-column-btn">
                      <i className="fa fa-columns"></i>
                      Columns
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="erp-column-menu">
                      {Object.keys(columnsVisibility).map((column) => (
                        <Dropdown.Item
                          as="button"
                          key={column}
                          className="erp-column-item"
                          onClick={() => toggleColumn(column)}
                        >
                          <input type="checkbox" checked={columnsVisibility[column]} readOnly />
                          <span>{column.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())}</span>
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
                <div className="erp-toolbar-right">{renderPagination()}</div>
              </div>

              <div className="erp-table-wrap">
                <table className="table table-hover align-middle erp-product-table erp-master-table">
                  <thead>
                    <tr>
                      {columnsVisibility.variationName && <th>Variation Name</th>}
                      {columnsVisibility.values && <th>Values</th>}
                      {columnsVisibility.actions && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {displayedVariations.length === 0 && (
                      <tr>
                        <td colSpan={3}>
                          <div className="erp-empty-state">
                            <i className="fa fa-sliders-h"></i>
                            <h6>No variations found</h6>
                            <p>Try changing filters or add a new variation.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                    {displayedVariations.map((row) => (
                      <tr key={row.id}>
                        {columnsVisibility.variationName && <td>{row.variationName || "-"}</td>}
                        {columnsVisibility.values && (
                          <td>
                            <div className="erp-pill-wrap">
                              {(row.values || []).length ? (
                                row.values.map((value) => (
                                  <span className="erp-tax-pill" key={`${row.id}-${value}`}>
                                    {value}
                                  </span>
                                ))
                              ) : (
                                <span>-</span>
                              )}
                            </div>
                          </td>
                        )}
                        {columnsVisibility.actions && (
                          <td>
                            <div className="erp-row-actions">
                              <button
                                type="button"
                                className="erp-btn erp-btn-light btn-sm"
                                onClick={() => openEditModal(row)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="erp-btn erp-btn-light btn-sm"
                                onClick={() => openViewModal(row)}
                              >
                                View
                              </button>
                              <button
                                type="button"
                                className="erp-btn erp-btn-danger btn-sm"
                                onClick={() => handleDelete(row.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="erp-table-footer">
                <div className="erp-table-info">
                  Showing {filteredVariations.length === 0 ? 0 : startIndex + 1} to{" "}
                  {Math.min(endIndex, filteredVariations.length)} of {filteredVariations.length} entries
                </div>
                {renderPagination()}
              </div>
            </div>
          </div>
        </section>

        {modalMode && (
          <>
            <div className="erp-modal-backdrop" onClick={closeModal}></div>
            <div className="erp-modal-wrap" role="dialog" aria-modal="true">
              <div className="erp-modal-card">
                <div className="erp-modal-head">
                  <h5>
                    {modalMode === "add"
                      ? "Add Variation"
                      : modalMode === "edit"
                        ? "Edit Variation"
                        : "View Variation"}
                  </h5>
                  <button type="button" className="erp-icon-btn" onClick={closeModal}>
                    <i className="fa fa-times"></i>
                  </button>
                </div>

                <div className="erp-modal-body">
                  {(modalMode === "add" || modalMode === "edit") && (
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="erp-label">Variation Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.variationName}
                          onChange={handleVariationNameChange}
                          placeholder="Enter variation name"
                        />
                      </div>
                      <div className="col-12">
                        <label className="erp-label">Variation Values</label>
                        {formData.values.map((value, index) => (
                          <div className="d-flex align-items-center gap-2 mb-2" key={`value-${index}`}>
                            <input
                              type="text"
                              className="form-control"
                              value={value}
                              onChange={(event) => handleValueChange(index, event.target.value)}
                              placeholder="Enter value"
                            />
                            {index === 0 ? (
                              <button
                                type="button"
                                className="erp-btn erp-btn-soft"
                                onClick={addValueField}
                              >
                                <i className="fa fa-plus"></i>
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="erp-btn erp-btn-danger"
                                onClick={() => removeValueField(index)}
                              >
                                <i className="fa fa-minus"></i>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {modalMode === "view" && currentVariation && (
                    <div className="row g-2">
                      <div className="col-12">
                        <label className="erp-label">Variation Name</label>
                        <div className="erp-readonly-box">{currentVariation.variationName || "-"}</div>
                      </div>
                      <div className="col-12">
                        <label className="erp-label">Values</label>
                        <div className="erp-readonly-box">
                          {(currentVariation.values || []).join(", ") || "-"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="erp-modal-foot">
                  <button type="button" className="erp-btn erp-btn-light" onClick={closeModal}>
                    Cancel
                  </button>
                  {(modalMode === "add" || modalMode === "edit") && (
                    <button
                      type="button"
                      className="erp-btn erp-btn-primary"
                      onClick={handleSaveVariation}
                    >
                      Save
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Variation;
