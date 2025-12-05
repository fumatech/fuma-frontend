import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

// Create axios instance with base URL and headers
const api = axios.create({
  baseURL: `${process.env.REACT_APP_BASE_URL}`,
  headers: {
    "Content-Type": "application/json",
  },
});

const ExpenseCategories = () => {
  const [showModal, setShowModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addAsSubCat, setAddAsSubCat] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    expenseName: "",
    expenseCode: "",
    parent_id: "",
    description: "",
  });
  const [viewData, setViewData] = useState({
    expenseName: "",
    expenseCode: "",
    parentExpense: "",
    description: "",
  });
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [columnsVisibility, setColumnsVisibility] = useState({
    name: true,
    code: true,
    action: true,
  });

  // Fetch all categories
  const fetchCategories = async () => {
    try {
      const response = await api.get("/expenses/getall");
      setCategories(response.data);
      setLoading(false);
    } catch (error) {
      toast.error("Failed to fetch categories");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleCheckboxChange = (e) => {
    setAddAsSubCat(e.target.checked);
    if (!e.target.checked) {
      setFormData({
        ...formData,
        parent_id: "",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const categoryData = {
        expenseName: formData.expenseName,
        expenseCode: formData.expenseCode,
        description: formData.description,
        parentExpense: formData.parent_id ? { id: formData.parent_id } : null,
      };

      if (formData.id) {
        // Update existing category
        await api.put(`/expenses/update/${formData.id}`, categoryData);
        toast.success("Category updated successfully");
      } else {
        // Create new category
        await api.post("/expenses/save", categoryData);
        toast.success("Category created successfully");
      }
      fetchCategories();
      setShowModal(false);
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error saving category");
    }
  };

  const resetForm = () => {
    setFormData({
      id: "",
      expenseName: "",
      expenseCode: "",
      parent_id: "",
      description: "",
    });
    setAddAsSubCat(false);
  };

  const handleEdit = (category) => {
    setFormData({
      id: category.id,
      expenseName: category.expenseName,
      expenseCode: category.expenseCode,
      parent_id: category.parentExpense?.id || "",
      description: category.description || "",
    });
    setAddAsSubCat(!!category.parentExpense);
    setShowModal(true);
  };

  const handleView = (category) => {
    setViewData({
      expenseName: category.expenseName,
      expenseCode: category.expenseCode,
      parentExpense: category.parentExpense
        ? category.parentExpense.expenseName
        : "None",
      description: category.description || "",
    });
    setViewModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        await api.delete(`/expenses/delete/${id}`);
        toast.success("Category deleted successfully");
        fetchCategories();
      } catch (error) {
        toast.error(error.response?.data?.message || "Error deleting category");
      }
    }
  };

  const handleEntriesChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
  };

  const exportCSV = () => {
    if (categories.length === 0) {
      toast.warning("No data to export");
      return;
    }

    const csvData = categories.map((category) => ({
      "Expense Name": category.expenseName,
      "Expense Code": category.expenseCode,
      "Parent Expense": category.parentExpense
        ? categories.find((c) => c.id === category.parentExpense.id)
            ?.expenseName || ""
        : "None",
      Description: category.description || "",
    }));

    const headers = Object.keys(csvData[0]);
    const csvRows = [
      headers.join(","),
      ...csvData
        .map((row) =>
          headers
            .map(
              (header) =>
                `"${
                  row[header] ? row[header].toString().replace(/"/g, '""') : ""
                }"`
            )
            .join(",")
        )
        .join("\n"),
    ];

    const blob = new Blob([csvRows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "expense_categories.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exported successfully");
  };

  const exportExcel = () => {
    toast.info("Excel export functionality will be implemented soon");
  };

  const printData = () => {
    window.print();
  };

  const exportPDF = () => {
    toast.info("PDF export functionality will be implemented soon");
  };

  const toggleColumn = (column) => {
    setColumnsVisibility({
      ...columnsVisibility,
      [column]: !columnsVisibility[column],
    });
  };

  if (loading) {
    return (
      <div className="wrapper">
        <div className="content-wrapper">
          <section className="content">
            <div className="container-fluid">
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="sr-only">Loading...</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-12 col-md-6">
                <h1 className="all-heading">Expenses categories</h1>
              </div>
            </div>
          </div>
        </section>
        <section className="content">
          <div className="container-fluid">
            <div className="card cardHover rounded-4 border-0">
              <div className="d-flex justify-content-end mb-3">
                <button
                  className="btn btn-add"
                  onClick={() => {
                    resetForm();
                    setShowModal(true);
                  }}
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
                        {columnsVisibility.name && <th>Expense name</th>}
                        {columnsVisibility.code && <th>Expense code</th>}
                        {columnsVisibility.action && <th>Action</th>}
                      </tr>
                    </thead>

                    <tbody>
                      {categories.slice(0, entriesPerPage).map((category) => (
                        <tr
                          key={category.id}
                          role="row"
                          className={category.id % 2 === 0 ? "even" : "odd"}
                        >
                          {columnsVisibility.name && (
                            <td className="sorting_1">
                              {category.expenseName}
                            </td>
                          )}
                          {columnsVisibility.code && (
                            <td>{category.expenseCode}</td>
                          )}
                          {columnsVisibility.action && (
                            <td>
                              <button
                                className="btn btn-view btn-sm mr-2"
                                onClick={() => handleView(category)}
                              >
                                <i className="fas fa-eye"></i> View
                              </button>
                              <button
                                className="btn btn-edit btn-sm mr-2"
                                onClick={() => handleEdit(category)}
                              >
                                <i className="fas fa-edit"></i> Edit
                              </button>
                              <button
                                className="btn btn-delete btn-sm"
                                onClick={() => handleDelete(category.id)}
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

          {/* Add/Edit Modal */}
          {showModal && (
            <div className="modal-overlay">
              <div className="modal" style={{ display: "block" }}>
                <div className="modal-dialog" role="document">
                  <div className="modal-content">
                    <form onSubmit={handleSubmit}>
                      <div className="modal-header">
                        <h4 className="modal-title">
                          {formData.id
                            ? "Edit Expense Category"
                            : "Add Expense Category"}
                        </h4>
                        <button
                          type="button"
                          className="close"
                          onClick={() => {
                            setShowModal(false);
                            resetForm();
                          }}
                          aria-label="Close"
                        >
                          <span aria-hidden="true">×</span>
                        </button>
                      </div>

                      <div className="modal-body">
                        <div className="form-group">
                          <label htmlFor="expenseName">Expense name:*</label>
                          <input
                            className="form-control"
                            required
                            placeholder="Expense name"
                            name="expenseName"
                            type="text"
                            id="expenseName"
                            value={formData.expenseName}
                            onChange={handleInputChange}
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="expenseCode">Expense code:</label>
                          <input
                            className="form-control"
                            placeholder="Expense code"
                            name="expenseCode"
                            type="text"
                            id="expenseCode"
                            value={formData.expenseCode}
                            onChange={handleInputChange}
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="description">Description:</label>
                          <textarea
                            className="form-control"
                            placeholder="Description"
                            name="description"
                            id="description"
                            value={formData.description}
                            onChange={handleInputChange}
                          />
                        </div>

                        <div className="form-group">
                          <div className="checkbox">
                            <label>
                              <input
                                className="toggler"
                                name="add_as_sub_cat"
                                type="checkbox"
                                value="1"
                                checked={addAsSubCat}
                                onChange={handleCheckboxChange}
                              />{" "}
                              Add as sub-category
                            </label>
                          </div>
                        </div>
                        <div
                          className={`form-group ${
                            addAsSubCat ? "" : "d-none"
                          }`}
                          id="parent_cat_div"
                        >
                          <label htmlFor="parent_id">
                            Select parent category:
                          </label>
                          <select
                            className="form-control"
                            id="parent_id"
                            name="parent_id"
                            value={formData.parent_id}
                            onChange={handleInputChange}
                          >
                            <option value="">None</option>
                            {categories
                              .filter((cat) => cat.id !== formData.id)
                              .map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.expenseName}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>

                      <div className="modal-footer">
                        <button type="submit" className="btn btn-primary">
                          Save
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            setShowModal(false);
                            resetForm();
                          }}
                        >
                          Close
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* View Modal */}
          {viewModal && (
            <div className="modal-overlay">
              <div className="modal" style={{ display: "block" }}>
                <div className="modal-dialog" role="document">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h4 className="modal-title">View Expense Category</h4>
                      <button
                        type="button"
                        className="close"
                        onClick={() => setViewModal(false)}
                        aria-label="Close"
                      >
                        <span aria-hidden="true">×</span>
                      </button>
                    </div>

                    <div className="modal-body">
                      <div className="form-group">
                        <label htmlFor="viewExpenseName">Expense name:</label>
                        <input
                          className="form-control"
                          readOnly
                          name="viewExpenseName"
                          type="text"
                          id="viewExpenseName"
                          value={viewData.expenseName}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="viewExpenseCode">Expense code:</label>
                        <input
                          className="form-control"
                          readOnly
                          name="viewExpenseCode"
                          type="text"
                          id="viewExpenseCode"
                          value={viewData.expenseCode}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="viewParentExpense">
                          Parent Expense:
                        </label>
                        <input
                          className="form-control"
                          readOnly
                          name="viewParentExpense"
                          type="text"
                          id="viewParentExpense"
                          value={viewData.parentExpense || "None"}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="viewDescription">Description:</label>
                        <textarea
                          className="form-control"
                          readOnly
                          name="viewDescription"
                          id="viewDescription"
                          value={viewData.description || "No description"}
                        />
                      </div>
                    </div>

                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setViewModal(false)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ExpenseCategories;
