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
  name: "",
  shortName: "",
  allowDecimal: "",
};

function Units({ userRoles = [] }) {
  const [units, setUnits] = useState([]);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(true);
  const [unitFilter, setUnitFilter] = useState("");
  const [columnsVisibility, setColumnsVisibility] = useState({
    name: true,
    shortName: true,
    allowDecimal: true,
    actions: true,
  });
  const [modalMode, setModalMode] = useState(null);
  const [currentUnit, setCurrentUnit] = useState(null);
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchUnits();
  }, []);

  const hasPermission = (permission) => {
    if (!permission) return true;
    if (!Array.isArray(userRoles) || userRoles.length === 0) return true;

    const isAdmin = userRoles.some(
      (role) =>
        role.role?.toLowerCase() === "super admin" ||
        role.role?.toLowerCase() === "admin",
    );

    if (isAdmin) return true;

    return userRoles.some((role) =>
      (role.permissions || []).some((entry) => entry.name === permission),
    );
  };

  const fetchUnits = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/units/getall`);
      const data = await response.json();
      setUnits(Array.isArray(data) ? data : []);
    } catch (error) {
      setUnits([]);
      toast.error("Error fetching units");
    }
  };

  const unitOptions = useMemo(
    () => [...new Set(units.map((item) => item.name))].filter(Boolean),
    [units],
  );

  const filteredUnits = useMemo(() => {
    if (!unitFilter) return units;
    return units.filter((item) => item.name === unitFilter);
  }, [unitFilter, units]);

  const totalPages = Math.max(1, Math.ceil(filteredUnits.length / entriesPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const displayedUnits = filteredUnits.slice(startIndex, endIndex);

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
    setCurrentUnit(null);
    setFormData(initialForm);
  };

  const openEditModal = (unit) => {
    setModalMode("edit");
    setCurrentUnit(unit);
    setFormData({
      name: unit.name || "",
      shortName: unit.shortName || "",
      allowDecimal: String(unit.allowDecimal),
    });
  };

  const openViewModal = (unit) => {
    setModalMode("view");
    setCurrentUnit(unit);
  };

  const closeModal = () => {
    setModalMode(null);
    setCurrentUnit(null);
    setFormData(initialForm);
  };

  const handleFormChange = (event) => {
    const { id, value } = event.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSaveUnit = async () => {
    try {
      const payload = {
        name: formData.name.trim(),
        shortName: formData.shortName.trim(),
        allowDecimal: String(formData.allowDecimal) === "true",
      };

      const isEdit = modalMode === "edit" && currentUnit?.id;
      const url = isEdit
        ? `${process.env.REACT_APP_BASE_URL}/units/update/${currentUnit.id}`
        : `${process.env.REACT_APP_BASE_URL}/units/save`;

      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { ...payload, id: currentUnit.id } : payload),
      });

      if (!response.ok) {
        throw new Error("Unable to save unit");
      }

      await fetchUnits();
      closeModal();
      toast.success(`Unit ${isEdit ? "updated" : "added"} successfully`);
    } catch (error) {
      toast.error("Error saving unit");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this unit?")) {
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/units/delete/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      await fetchUnits();
      toast.success("Unit deleted successfully");
    } catch (error) {
      toast.error("Failed to delete unit");
    }
  };

  const exportRows = filteredUnits.map((row) => ({
    Name: row.name || "-",
    "Short Name": row.shortName || "-",
    "Allow Decimal": row.allowDecimal ? "Yes" : "No",
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
    saveAs(new Blob([csv], { type: "text/csv" }), "Units.csv");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Units");
    XLSX.writeFile(wb, "Units.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [Object.keys(exportRows[0] || {})],
      body: exportRows.map((row) => Object.values(row)),
      headStyles: { fillColor: [12, 68, 97] },
      styles: { fontSize: 8 },
    });
    doc.save("Units.pdf");
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
                    <h1 className="erp-page-title mb-0">Units</h1>
                  </div>
                </div>
                {hasPermission("unit.add") && (
                  <button
                    type="button"
                    className="erp-btn erp-btn-primary"
                    onClick={openAddModal}
                  >
                    <i className="fa fa-plus"></i>
                    Add Unit
                  </button>
                )}
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
                      <label className="erp-label">Unit Name</label>
                      <select
                        className="form-select"
                        value={unitFilter}
                        onChange={(event) => {
                          setUnitFilter(event.target.value);
                          setCurrentPage(1);
                        }}
                      >
                        <option value="">All Units</option>
                        {unitOptions.map((value) => (
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
                          setUnitFilter("");
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
                      {columnsVisibility.name && <th>Name</th>}
                      {columnsVisibility.shortName && <th>Short Name</th>}
                      {columnsVisibility.allowDecimal && <th>Allow Decimal</th>}
                      {columnsVisibility.actions && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {displayedUnits.length === 0 && (
                      <tr>
                        <td colSpan={4}>
                          <div className="erp-empty-state">
                            <i className="fa fa-balance-scale"></i>
                            <h6>No units found</h6>
                            <p>Try changing filters or add a new unit.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                    {displayedUnits.map((row) => (
                      <tr key={row.id}>
                        {columnsVisibility.name && <td>{row.name || "-"}</td>}
                        {columnsVisibility.shortName && <td>{row.shortName || "-"}</td>}
                        {columnsVisibility.allowDecimal && (
                          <td>{row.allowDecimal ? "Yes" : "No"}</td>
                        )}
                        {columnsVisibility.actions && (
                          <td>
                            <div className="erp-row-actions">
                              {hasPermission("unit.edit") && (
                                <button
                                  type="button"
                                  className="erp-btn erp-btn-light btn-sm"
                                  onClick={() => openEditModal(row)}
                                >
                                  Edit
                                </button>
                              )}
                              {hasPermission("unit.view") && (
                                <button
                                  type="button"
                                  className="erp-btn erp-btn-light btn-sm"
                                  onClick={() => openViewModal(row)}
                                >
                                  View
                                </button>
                              )}
                              {hasPermission("unit.delete") && (
                                <button
                                  type="button"
                                  className="erp-btn erp-btn-danger btn-sm"
                                  onClick={() => handleDelete(row.id)}
                                >
                                  Delete
                                </button>
                              )}
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
                  Showing {filteredUnits.length === 0 ? 0 : startIndex + 1} to{" "}
                  {Math.min(endIndex, filteredUnits.length)} of {filteredUnits.length} entries
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
                      ? "Add Unit"
                      : modalMode === "edit"
                        ? "Edit Unit"
                        : "View Unit"}
                  </h5>
                  <button type="button" className="erp-icon-btn" onClick={closeModal}>
                    <i className="fa fa-times"></i>
                  </button>
                </div>

                <div className="erp-modal-body">
                  {(modalMode === "add" || modalMode === "edit") && (
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="erp-label">Unit Name</label>
                        <input
                          type="text"
                          id="name"
                          className="form-control"
                          value={formData.name}
                          onChange={handleFormChange}
                          placeholder="Enter unit name"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="erp-label">Short Name</label>
                        <input
                          type="text"
                          id="shortName"
                          className="form-control"
                          value={formData.shortName}
                          onChange={handleFormChange}
                          placeholder="Enter short name"
                        />
                      </div>
                      <div className="col-12">
                        <label className="erp-label">Allow Decimal</label>
                        <select
                          id="allowDecimal"
                          className="form-select"
                          value={formData.allowDecimal}
                          onChange={handleFormChange}
                        >
                          <option value="">Select option</option>
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {modalMode === "view" && currentUnit && (
                    <div className="row g-2">
                      <div className="col-12">
                        <label className="erp-label">Name</label>
                        <div className="erp-readonly-box">{currentUnit.name || "-"}</div>
                      </div>
                      <div className="col-12">
                        <label className="erp-label">Short Name</label>
                        <div className="erp-readonly-box">{currentUnit.shortName || "-"}</div>
                      </div>
                      <div className="col-12">
                        <label className="erp-label">Allow Decimal</label>
                        <div className="erp-readonly-box">
                          {currentUnit.allowDecimal ? "Yes" : "No"}
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
                    <button type="button" className="erp-btn erp-btn-primary" onClick={handleSaveUnit}>
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

export default Units;
