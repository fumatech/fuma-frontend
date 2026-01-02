import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { toast } from "react-toastify";

const Department = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [entriesPerPage, setEntriesPerPage] = useState(25);

  const [columnsVisibility, setColumnsVisibility] = useState({
    Department: true,
    DepartmentId: true,
    Description: true,
    Action: true,
  });

  const [formData, setFormData] = useState({
    id: null,
    department: "",
    departmentId: "",
    description: "",
  });

  // Fetch departments from API
  const fetchDepartments = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/department/getall`
      );
      setDepartments(response.data);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEntriesChange = (e) => {
    setEntriesPerPage(parseInt(e.target.value));
  };

  const toggleColumn = (col) => {
    setColumnsVisibility((prev) => ({
      ...prev,
      [col]: !prev[col],
    }));
  };

  const exportCSV = () => toast.warning("Export CSV functionality");
  const exportExcel = () => toast.warning("Export Excel functionality");
  const printData = () => toast.warning("Print functionality");
  const exportPDF = () => toast.warning("Export PDF functionality");

  const handleDropdownItemClick = (col, e) => {
    e.stopPropagation();
    toggleColumn(col);
  };

  const openModal = (department = null) => {
    if (department) {
      setFormData({
        id: department.id,
        department: department.department,
        departmentId: department.departmentId,
        description: department.description || "",
      });
      setEditMode(true);
    } else {
      setFormData({
        id: null,
        department: "",
        departmentId: "",
        description: "",
      });
      setEditMode(false);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        department: formData.department,
        departmentId: formData.departmentId,
        description: formData.description,
      };

      if (editMode) {
        await axios.put(
          `${process.env.REACT_APP_BASE_URL}/department/update/${formData.id}`,
          payload
        );
      } else {
        await axios.post(
          `${process.env.REACT_APP_BASE_URL}/department/add`,
          payload
        );
      }

      fetchDepartments();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving department:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this department?")) {
      try {
        await axios.delete(
          `${process.env.REACT_APP_BASE_URL}/department/delete/${id}`
        );
        fetchDepartments();
      } catch (error) {
        console.error("Error deleting department:", error);
      }
    }
  };

  return (
    <div className="wrapper" style={{ overflowY: "auto" }}>
      <div className="">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6">
                <h1 className="all-heading m-0 ">Department</h1>
                <span className="display-inline sub-heading">
                  Manage department
                </span>
              </div>
            </div>
          </div>
        </section>
        <section className="content">
          <div className="container-fluid">
            <div className="card cardHover rounded-4 border-0">
              <div className="text-right">
                <button className="btn btn-add" onClick={() => openModal()}>
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
                            <span
                              className="btn border-0 bg-transparent p-0 m-0"
                              onClick={(e) => handleDropdownItemClick(col, e)}
                            >
                              {col.replace(/([A-Z])/g, " $1").toUpperCase()}
                            </span>
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
                    style={{ minWidth: "1000px" }}
                  >
                    <thead>
                      <tr role="row">
                        {columnsVisibility.Department && (
                          <th
                            className="sorting_asc"
                            tabIndex="0"
                            aria-controls="category_table"
                            aria-sort="ascending"
                            aria-label="Department: activate to sort column descending"
                          >
                            Department
                          </th>
                        )}
                        {columnsVisibility.DepartmentId && (
                          <th
                            className="sorting"
                            tabIndex="0"
                            aria-controls="category_table"
                            aria-label="Department ID: activate to sort column ascending"
                          >
                            Department ID
                          </th>
                        )}
                        {columnsVisibility.Description && (
                          <th
                            className="sorting"
                            tabIndex="0"
                            aria-controls="category_table"
                            aria-label="Description: activate to sort column ascending"
                          >
                            Description
                          </th>
                        )}
                        {columnsVisibility.Action && (
                          <th className="sorting_disabled" aria-label="Action">
                            Action
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {departments.length === 0 ? (
                        <tr className="odd">
                          <td
                            valign="top"
                            colSpan={
                              Object.values(columnsVisibility).filter(Boolean)
                                .length
                            }
                            className="dataTables_empty"
                          >
                            No data available in table
                          </td>
                        </tr>
                      ) : (
                        departments.map((dept) => (
                          <tr key={dept.id}>
                            {columnsVisibility.Department && (
                              <td>{dept.department}</td>
                            )}
                            {columnsVisibility.DepartmentId && (
                              <td>{dept.departmentId}</td>
                            )}
                            {columnsVisibility.Description && (
                              <td>{dept.description || "-"}</td>
                            )}
                            {columnsVisibility.Action && (
                              <td>
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => openModal(dept)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="btn btn-sm btn-danger ml-2"
                                  onClick={() => handleDelete(dept.id)}
                                >
                                  Delete
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Modal */}
          {isModalOpen && (
            <div
              className="modal fade show"
              style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
            >
              <div className="modal-dialog">
                <div className="modal-content">
                  <form onSubmit={handleSubmit}>
                    <div className="modal-header bg-primary text-white">
                      <h4 className="modal-title">
                        {editMode ? "Edit Department" : "Add Department"}
                      </h4>
                      <button
                        type="button"
                        className="close text-white"
                        onClick={() => setIsModalOpen(false)}
                        aria-label="Close"
                      >
                        <span aria-hidden="true">&times;</span>
                      </button>
                    </div>

                    <div className="modal-body">
                      <div className="row">
                        <div className="form-group col-md-12">
                          <label htmlFor="department">Department:*</label>
                          <input
                            className="form-control"
                            placeholder="Department"
                            required
                            name="department"
                            type="text"
                            id="department"
                            value={formData.department}
                            onChange={handleInputChange}
                          />
                        </div>

                        <div className="form-group col-md-12">
                          <label htmlFor="departmentId">Department ID:*</label>
                          <input
                            className="form-control"
                            placeholder="Department ID"
                            required
                            name="departmentId"
                            type="text"
                            id="departmentId"
                            value={formData.departmentId}
                            onChange={handleInputChange}
                          />
                        </div>

                        <div className="form-group col-md-12">
                          <label htmlFor="description">Description:</label>
                          <textarea
                            className="form-control"
                            placeholder="Description"
                            rows="3"
                            name="description"
                            id="description"
                            value={formData.description}
                            onChange={handleInputChange}
                          ></textarea>
                        </div>
                      </div>
                    </div>

                    <div className="modal-footer">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm mr-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            Saving...
                          </>
                        ) : (
                          "Save"
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setIsModalOpen(false)}
                        disabled={isLoading}
                      >
                        Close
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Department;
