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
  categoryName: "",
  categoryCode: "",
  description: "",
  parentCategory: "",
};

const initialFilters = {
  categoryName: "",
  categoryCode: "",
  parentCategory: "",
};

const flattenCategories = (categories, parentName = "", seen = new Set()) => {
  return (categories || []).flatMap((cat) => {
    if (!cat || seen.has(cat.id)) return [];
    seen.add(cat.id);

    const categoryName = parentName
      ? `${parentName}/${cat.categoryName}`
      : cat.categoryName;

    const row = {
      id: cat.id,
      categoryName,
      categoryCode: cat.categoryCode || "",
      description: cat.description || "",
      parentCategory: parentName || "None",
    };

    const children = Array.isArray(cat.subCategories)
      ? flattenCategories(cat.subCategories, categoryName, seen)
      : [];

    return [row, ...children];
  });
};

function Categories() {
  const [categories, setCategories] = useState([]);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(true);
  const [filters, setFilters] = useState(initialFilters);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [currentCategory, setCurrentCategory] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [columnsVisibility, setColumnsVisibility] = useState({
    categoryName: true,
    categoryCode: true,
    description: true,
    parentCategory: true,
    actions: true,
  });

  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);

  const filterValues = useMemo(() => {
    return {
      categoryNames: [...new Set(flatCategories.map((item) => item.categoryName))].filter(
        Boolean,
      ),
      categoryCodes: [...new Set(flatCategories.map((item) => item.categoryCode))].filter(
        Boolean,
      ),
      parentCategories: [
        ...new Set(flatCategories.map((item) => item.parentCategory)),
      ].filter(Boolean),
    };
  }, [flatCategories]);

  const filteredCategories = useMemo(() => {
    return flatCategories.filter((category) => {
      const byName =
        !filters.categoryName || category.categoryName === filters.categoryName;
      const byCode =
        !filters.categoryCode || category.categoryCode === filters.categoryCode;
      const byParent =
        !filters.parentCategory || category.parentCategory === filters.parentCategory;
      return byName && byCode && byParent;
    });
  }, [filters, flatCategories]);

  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / entriesPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const displayedCategories = filteredCategories.slice(startIndex, endIndex);

  useEffect(() => {
    if (safePage !== currentPage) {
      setCurrentPage(safePage);
    }
  }, [safePage, currentPage]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/categories/getall`);
      const data = await response.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      setCategories([]);
      toast.error("Error fetching categories");
    }
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    setCurrentPage(1);
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const toggleColumn = (column) => {
    setColumnsVisibility((prev) => ({ ...prev, [column]: !prev[column] }));
  };

  const openAddModal = () => {
    setModalMode("add");
    setCurrentCategory(null);
    setFormData(initialForm);
    setModalVisible(true);
  };

  const openEditModal = (category) => {
    const finalCategoryName = category.categoryName.split("/").pop();
    const parentId =
      category.parentCategory === "None"
        ? ""
        : flatCategories.find((row) => row.categoryName === category.parentCategory)?.id ||
          "";

    setModalMode("edit");
    setCurrentCategory(category);
    setFormData({
      categoryName: finalCategoryName,
      categoryCode: category.categoryCode || "",
      description: category.description || "",
      parentCategory: parentId,
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setCurrentCategory(null);
    setFormData(initialForm);
  };

  const handleFormChange = (event) => {
    const { id, value } = event.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSaveCategory = async () => {
    try {
      const payload = {
        categoryName: formData.categoryName,
        categoryCode: formData.categoryCode,
        description: formData.description,
        parentCategory: formData.parentCategory
          ? { id: Number(formData.parentCategory) }
          : null,
      };

      const isEdit = modalMode === "edit" && currentCategory?.id;
      const url = isEdit
        ? `${process.env.REACT_APP_BASE_URL}/categories/update/${currentCategory.id}`
        : `${process.env.REACT_APP_BASE_URL}/categories/save`;

      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Unable to save category");
      }

      await fetchCategories();
      closeModal();
      toast.success(`Category ${isEdit ? "updated" : "added"} successfully`);
    } catch (error) {
      toast.error("Error saving category");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) {
      return;
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/categories/delete/${id}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      await fetchCategories();
      toast.success("Category deleted successfully");
    } catch (error) {
      toast.error("Failed to delete category");
    }
  };

  const exportRows = filteredCategories.map((row) => ({
    "Category Name": row.categoryName,
    "Category Code": row.categoryCode || "-",
    Description: row.description || "-",
    "Parent Category": row.parentCategory || "None",
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
    saveAs(new Blob([csv], { type: "text/csv" }), "Categories.csv");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Categories");
    XLSX.writeFile(wb, "Categories.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [Object.keys(exportRows[0] || {})],
      body: exportRows.map((row) => Object.values(row)),
      headStyles: { fillColor: [12, 68, 97] },
      styles: { fontSize: 8 },
    });
    doc.save("Categories.pdf");
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
                    <h1 className="erp-page-title mb-0">Categories</h1>
                  </div>
                </div>
                <button type="button" className="erp-btn erp-btn-primary" onClick={openAddModal}>
                  <i className="fa fa-plus"></i>
                  Add Category
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
                    <div className="col-md-4">
                      <label className="erp-label">Category Name</label>
                      <select
                        className="form-select"
                        name="categoryName"
                        value={filters.categoryName}
                        onChange={handleFilterChange}
                      >
                        <option value="">All Categories</option>
                        {filterValues.categoryNames.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="erp-label">Category Code</label>
                      <select
                        className="form-select"
                        name="categoryCode"
                        value={filters.categoryCode}
                        onChange={handleFilterChange}
                      >
                        <option value="">All Codes</option>
                        {filterValues.categoryCodes.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="erp-label">Parent Category</label>
                      <select
                        className="form-select"
                        name="parentCategory"
                        value={filters.parentCategory}
                        onChange={handleFilterChange}
                      >
                        <option value="">All Parents</option>
                        {filterValues.parentCategories.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12">
                      <button type="button" className="erp-btn erp-btn-light" onClick={resetFilters}>
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
                      {columnsVisibility.categoryName && <th>Category Name</th>}
                      {columnsVisibility.categoryCode && <th>Category Code</th>}
                      {columnsVisibility.description && <th>Description</th>}
                      {columnsVisibility.parentCategory && <th>Parent Category</th>}
                      {columnsVisibility.actions && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {displayedCategories.length === 0 && (
                      <tr>
                        <td colSpan={5}>
                          <div className="erp-empty-state">
                            <i className="fa fa-folder-open"></i>
                            <h6>No categories found</h6>
                            <p>Try changing filters or add a new category.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                    {displayedCategories.map((row) => (
                      <tr key={row.id}>
                        {columnsVisibility.categoryName && (
                          <td style={{ paddingLeft: `${(row.categoryName.split("/").length - 1) * 18 + 10}px` }}>
                            {row.categoryName}
                          </td>
                        )}
                        {columnsVisibility.categoryCode && <td>{row.categoryCode || "-"}</td>}
                        {columnsVisibility.description && <td>{row.description || "-"}</td>}
                        {columnsVisibility.parentCategory && <td>{row.parentCategory || "-"}</td>}
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
                  Showing {filteredCategories.length === 0 ? 0 : startIndex + 1} to{" "}
                  {Math.min(endIndex, filteredCategories.length)} of {filteredCategories.length} entries
                </div>
                {renderPagination()}
              </div>
            </div>
          </div>
        </section>

        {modalVisible && (
          <>
            <div className="erp-modal-backdrop" onClick={closeModal}></div>
            <div className="erp-modal-wrap" role="dialog" aria-modal="true">
              <div className="erp-modal-card">
                <div className="erp-modal-head">
                  <h5>{modalMode === "edit" ? "Edit Category" : "Add Category"}</h5>
                  <button type="button" className="erp-icon-btn" onClick={closeModal}>
                    <i className="fa fa-times"></i>
                  </button>
                </div>
                <div className="erp-modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="erp-label">Category Name</label>
                      <input
                        type="text"
                        id="categoryName"
                        className="form-control"
                        value={formData.categoryName}
                        onChange={handleFormChange}
                        placeholder="Enter category name"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="erp-label">Category Code</label>
                      <input
                        type="text"
                        id="categoryCode"
                        className="form-control"
                        value={formData.categoryCode}
                        onChange={handleFormChange}
                        placeholder="Enter category code"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="erp-label">Parent Category</label>
                      <select
                        id="parentCategory"
                        className="form-select"
                        value={formData.parentCategory}
                        onChange={handleFormChange}
                      >
                        <option value="">None</option>
                        {flatCategories
                          .filter((item) => item.id !== currentCategory?.id)
                          .map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.categoryName}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="erp-label">Description</label>
                      <textarea
                        id="description"
                        className="form-control"
                        rows={3}
                        value={formData.description}
                        onChange={handleFormChange}
                        placeholder="Enter category description"
                      />
                    </div>
                  </div>
                </div>
                <div className="erp-modal-foot">
                  <button type="button" className="erp-btn erp-btn-light" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="button" className="erp-btn erp-btn-primary" onClick={handleSaveCategory}>
                    Save
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Categories;
