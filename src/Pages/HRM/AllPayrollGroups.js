import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

const AllPayrollGroups = () => {
  const [columnsVisibility, setColumnsVisibility] = useState({
    name: true,
    status: true,
    paymentStatus: true,
    totalGrossAmount: true,
    addedBy: true,
    location: true,
    createdAt: true,
    actions: true,
  });

  // Add new states for location and employee selection
  const [locations, setLocations] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectAllEmployees, setSelectAllEmployees] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [payrollData, setPayrollData] = useState([]); // Changed from shiftData to payrollData
  const [formData, setFormData] = useState({
    id: null,
    employeeName: "",
    department: "",
    designation: "",
    monthYear: "",
    referenceNo: "",
    totalAmount: "",
    paymentStatus: "",
  });

  // Toggle column visibility
  const toggleColumn = (col) => {
    setColumnsVisibility((prev) => ({
      ...prev,
      [col]: !prev[col],
    }));
  };

  const handleDropdownItemClick = (col, e) => {
    e.stopPropagation();
    toggleColumn(col);
  };

  // Handle modal open/close
  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen);
  };

  // Open modal with data (edit or add new)
  const openModal = (payroll = null) => {
    if (payroll) {
      setFormData(payroll); // Edit existing payroll
    } else {
      setFormData({
        id: null,
        employeeName: "",
        department: "",
        designation: "",
        monthYear: "",
        referenceNo: "",
        totalAmount: "",
        paymentStatus: "",
      }); // Add new payroll
    }
    setIsModalOpen(true);
  };

  // Handle form field changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission (save payroll)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.id) {
      // Edit payroll
      setPayrollData((prev) =>
        prev.map((payroll) =>
          payroll.id === formData.id ? { ...payroll, ...formData } : payroll
        )
      );
    } else {
      // Add new payroll
      setPayrollData((prev) => [
        ...prev,
        { ...formData, id: Date.now() }, // Using timestamp as a unique ID
      ]);
    }
    setIsModalOpen(false);
  };

  // Handle delete payroll
  const handleDelete = (id) => {
    const updatedPayrolls = payrollData.filter((payroll) => payroll.id !== id);
    setPayrollData(updatedPayrolls);
  };

  // Fetch locations and employees (example with mock data)
  useEffect(() => {
    // In a real app, you would fetch these from an API
    setLocations([
      { id: 1, name: "New York Office" },
      { id: 2, name: "London Office" },
      { id: 3, name: "Tokyo Office" },
    ]);

    setAllEmployees([
      { id: 1, name: "John Doe" },
      { id: 2, name: "Jane Smith" },
      { id: 3, name: "Robert Johnson" },
      { id: 4, name: "Emily Davis" },
    ]);
  }, []);

  // Handle employee selection
  const handleEmployeeSelect = (employeeId) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  // Toggle select all employees
  const toggleSelectAllEmployees = () => {
    if (selectAllEmployees) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(allEmployees.map((emp) => emp.id));
    }
    setSelectAllEmployees(!selectAllEmployees);
  };

  // ... (keep all existing code until the modal part)

  return (
    <>
      <section className="content">
        <div className="container-fluid">
          <div className="card cardHover rounded-4 border-0">
            <div className="text-right p-3">
              <div className="card-body">
                {/* Table */}
                <div className="row mb-3 d-flex align-items-center">
                  <div className="col-12 col-md-auto form-group mb-2 d-flex align-items-center text-bold mt-2 mb-2 mr-2">
                    <label htmlFor="entriesPerPage" className="mb-0 mr-2">
                      Show
                    </label>
                    <select
                      id="entriesPerPage"
                      className="form-control form-control-sm mr-2"
                    >
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={75}>75</option>
                      <option value={100}>100</option>
                    </select>
                    Entries
                  </div>
                </div>
                <div className="col d-flex flex-wrap align-items-center">
                  <button className="btn Export-Btn mt-2 mb-2 mr-2">
                    <i className="fa fa-file-csv"></i> Export CSV
                  </button>
                  <button className="btn Export-Btn mt-2 mb-2 mr-2">
                    <i className="fa fa-file-excel"></i> Export Excel
                  </button>
                  <button className="btn Export-Btn mt-2 mb-2 mr-2">
                    <i className="fa fa-print"></i> Print
                  </button>
                  <button className="btn Export-Btn mt-2 mb-2 mr-2">
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
                  className="table table-bordered table-hover"
                  id="example1"
                >
                  <thead>
                    <tr role="row">
                      {columnsVisibility.name && (
                        <th className="sorting_asc">Name</th>
                      )}
                      {columnsVisibility.status && (
                        <th className="sorting">Status</th>
                      )}
                      {columnsVisibility.paymentStatus && (
                        <th className="sorting">Payment Status</th>
                      )}
                      {columnsVisibility.totalGrossAmount && (
                        <th className="sorting">Total Gross Amount</th>
                      )}
                      {columnsVisibility.addedBy && (
                        <th className="sorting">Added By</th>
                      )}
                      {columnsVisibility.location && (
                        <th className="sorting">Location</th>
                      )}
                      {columnsVisibility.createdAt && (
                        <th className="sorting">Created At</th>
                      )}
                      {columnsVisibility.actions && (
                        <th className="sorting">Action</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {payrollData.map((payroll) => (
                      <tr key={payroll.id} role="row">
                        {columnsVisibility.name && <td>{payroll.name}</td>}
                        {columnsVisibility.status && <td>{payroll.status}</td>}
                        {columnsVisibility.paymentStatus && (
                          <td>{payroll.paymentStatus}</td>
                        )}
                        {columnsVisibility.totalGrossAmount && (
                          <td>{payroll.totalGrossAmount}</td>
                        )}
                        {columnsVisibility.addedBy && (
                          <td>{payroll.addedBy}</td>
                        )}
                        {columnsVisibility.location && (
                          <td>{payroll.location}</td>
                        )}
                        {columnsVisibility.createdAt && (
                          <td>{payroll.createdAt}</td>
                        )}
                        {columnsVisibility.actions && (
                          <td className="text-right">
                            <div className="btn-group btn-group-sm btn-icon-only">
                              <button
                                type="button"
                                className="btn-edit"
                                onClick={() => openModal(payroll)}
                              >
                                <i className="fas fa-edit btn-icon"></i> Edit
                              </button>
                              <button
                                type="button"
                                className="btn-view"
                                onClick={() => openModal(payroll)}
                              >
                                <i className="fas fa-eye btn-icon"></i> View
                              </button>
                              <button
                                type="button"
                                className="btn-delete"
                                onClick={() => handleDelete(payroll.id)}
                              >
                                <i className="fas fa-trash btn-icon"></i> Delete
                              </button>
                            </div>
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

      {/* Modal */}
      {/* Modal */}
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
            aria-labelledby="addPayrollModalTitle"
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
                <form onSubmit={handleSubmit}>
                  <div className="modal-header bg-primary text-white">
                    <h5 className="modal-title" id="addPayrollModalTitle">
                      {formData.id ? "Edit Payroll" : "Generate Payroll"}
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
                    {/* Location Dropdown */}
                    <div className="form-group">
                      <label htmlFor="location" className="font-weight-bold">
                        Location:*
                      </label>
                      <select
                        className="form-control"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Location</option>
                        {locations.map((location) => (
                          <option key={location.id} value={location.id}>
                            {location.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Employee Selection */}
                    <div className="form-group">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="font-weight-bold mb-0">
                          Employees:*
                        </label>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={toggleSelectAllEmployees}
                        >
                          {selectAllEmployees ? "Deselect All" : "Select All"}
                        </button>
                      </div>
                      <div
                        className="employee-select-container border rounded p-2"
                        style={{ maxHeight: "200px", overflowY: "auto" }}
                      >
                        {allEmployees.map((employee) => (
                          <div key={employee.id} className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`emp-${employee.id}`}
                              checked={selectedEmployees.includes(employee.id)}
                              onChange={() => handleEmployeeSelect(employee.id)}
                            />
                            <label
                              className="form-check-label"
                              htmlFor={`emp-${employee.id}`}
                            >
                              {employee.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Month/Year Selection */}
                    <div className="form-group">
                      <label htmlFor="monthYear" className="font-weight-bold">
                        Month/Year:*
                      </label>
                      <input
                        type="month"
                        className="form-control"
                        id="monthYear"
                        name="monthYear"
                        value={formData.monthYear}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    {/* Generate Button */}
                    <div className="text-center mt-4">
                      <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        style={{ minWidth: "200px" }}
                      >
                        {formData.id ? "Update Payroll" : "Generate Payroll"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default AllPayrollGroups;
