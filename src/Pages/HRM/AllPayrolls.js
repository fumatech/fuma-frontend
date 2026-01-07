import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const AllPayrolls = () => {
  const [columnsVisibility, setColumnsVisibility] = useState({
    employee: true,
    department: true,
    designation: true,
    monthYear: true,
    referenceNo: true,
    totalAmount: true,
    paymentStatus: true,
    actions: true,
  });
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  const [locations, setLocations] = useState([
    { id: "none", name: "None" },
    { id: "fuma", name: "FUMA" },
  ]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectAllEmployees, setSelectAllEmployees] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [payrollData, setPayrollData] = useState([]);
  const [formData, setFormData] = useState({
    id: null,
    location: "none",
    monthYear: "",
    employee: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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
      setFormData({
        id: payroll.id,
        location: payroll.location || "none",
        monthYear: payroll.monthYear,
        employee: payroll.employee || [],
      });
      setSelectedEmployees(payroll.employee || []);
    } else {
      setFormData({
        id: null,
        location: "none",
        monthYear: "",
        employee: [],
      });
      setSelectedEmployees([]);
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

  // Handle search term change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  // Filter employees based on search term
  const filteredEmployees = allEmployees.filter((emp) =>
    `${emp.firstname} ${emp.lastname}`.toLowerCase().includes(searchTerm)
  );

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
      setSelectedEmployees(filteredEmployees.map((emp) => emp.id));
    }
    setSelectAllEmployees(!selectAllEmployees);
  };

  // Fetch all employees from API
  const fetchEmployees = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/user/getall`
      );
      setAllEmployees(response.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  // Fetch all payrolls from API
  const fetchPayrolls = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/payroll/employee-wise`
      );
      console.log(response);

      setPayrollData(response.data);
    } catch (error) {
      console.error("Error fetching payrolls:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Get the selected employees' details
    const selectedEmployeesDetails = allEmployees
      .filter((emp) => selectedEmployees.includes(emp.id))
      .map((emp) => ({
        id: emp.id,
        name: `${emp.firstname} ${emp.lastname}`,
        // Add any other employee details you need
      }));

    // Prepare the data to pass to AddPayroll
    const payrollData = {
      location: formData.location,
      employees: selectedEmployeesDetails, // Now includes employee details
      monthYear: formData.monthYear,
      payrollGroupName: `Payroll for ${new Date(
        formData.monthYear
      ).toLocaleString("default", {
        month: "long",
        year: "numeric",
      })}`,
      locationName:
        locations.find((loc) => loc.id === formData.location)?.name ||
        "Unknown",
    };

    // Navigate to AddPayroll with state
    navigate("/AddPayroll", { state: payrollData });
  };

  // Handle delete payroll
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this payroll?")) {
      try {
        await axios.delete(
          `${process.env.REACT_APP_BASE_URL}/payroll/delete/${id}`
        );
        fetchPayrolls();
      } catch (error) {
        console.error("Error deleting payroll:", error);
      }
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchPayrolls();
    fetchDepartments();
    fetchDesignations();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(
        "https://fusionmastertech.com:8443/department/getall"
      );
      setDepartments(response.data);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchDesignations = async () => {
    try {
      const response = await axios.get(
        "https://fusionmastertech.com:8443/designation/getall"
      );
      setDesignations(response.data);
    } catch (error) {
      console.error("Error fetching designations:", error);
    }
  };

  // Update select all state when employees or filtered list changes
  useEffect(() => {
    if (
      filteredEmployees.length > 0 &&
      selectedEmployees.length === filteredEmployees.length
    ) {
      setSelectAllEmployees(true);
    } else {
      setSelectAllEmployees(false);
    }
  }, [selectedEmployees, filteredEmployees]);

  // Get employee name by ID
  const getEmployeeName = (id) => {
    const employee = allEmployees.find((emp) => emp.id === id);
    return employee ? `${employee.firstname} ${employee.lastname}` : "Unknown";
  };
  const getDepartmentName = (departmentId) => {
    const dept = departments.find((d) => d.id === departmentId);
    return dept ? dept.department : "-";
  };

  const getDesignationName = (designationId) => {
    const desig = designations.find((d) => d.id === designationId);
    return desig ? desig.name : "-";
  };
  const getReferenceNo = (payroll) => {
    const month = String(payroll.month).padStart(2, "0");
    const payrollId = String(payroll.payrollId).padStart(4, "0");
    return `PR-${payroll.year}${month}${payrollId}`;
  };

  return (
    <>
      <section className="content">
        <div className="container-fluid">
          <div className="card cardHover rounded-4 border-0">
            <div className="text-right p-3">
              <button className="btn btn-add" onClick={() => openModal()}>
                <i className="fas fa-plus"></i> Add
              </button>
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
                      {columnsVisibility.employee && (
                        <th className="sorting_asc">Employee</th>
                      )}
                      {columnsVisibility.department && (
                        <th className="sorting">Department</th>
                      )}
                      {columnsVisibility.designation && (
                        <th className="sorting">Designation</th>
                      )}
                      {columnsVisibility.monthYear && (
                        <th className="sorting">Month/Year</th>
                      )}
                      {columnsVisibility.referenceNo && (
                        <th className="sorting">Reference No</th>
                      )}
                      {columnsVisibility.totalAmount && (
                        <th className="sorting">Total Amount</th>
                      )}
                      {columnsVisibility.paymentStatus && (
                        <th className="sorting_disabled">Payment Status</th>
                      )}
                      {columnsVisibility.actions && (
                        <th className="sorting">Action</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {payrollData.length > 0 ? (
                      payrollData.map((payroll, index) => (
                        <tr key={`${payroll.payrollId}-${payroll.employeeId}`}>
                          {columnsVisibility.employee && (
                            <td>{getEmployeeName(payroll.employeeId)}</td>
                          )}
                          {columnsVisibility.department && (
                            <td>
                              {getDepartmentName(
                                allEmployees.find(
                                  (emp) => emp.id === payroll.employeeId
                                )?.departmentId
                              )}
                            </td>
                          )}
                          {columnsVisibility.designation && (
                            <td>
                              {getDesignationName(
                                allEmployees.find(
                                  (emp) => emp.id === payroll.employeeId
                                )?.designationId
                              )}
                            </td>
                          )}

                          {columnsVisibility.monthYear && (
                            <td>
                              {new Date(
                                payroll.year,
                                payroll.month - 1
                              ).toLocaleString("default", {
                                month: "long",
                                year: "numeric",
                              })}
                            </td>
                          )}
                          {columnsVisibility.referenceNo && (
                            <td>{getReferenceNo(payroll)}</td>
                          )}

                          {columnsVisibility.totalAmount && (
                            <td>{payroll.total.toFixed(2)}</td>
                          )}
                          {columnsVisibility.paymentStatus && (
                            <td>
                              <span
                                className={`badge ${
                                  payroll.paymentStatus === 1
                                    ? "bg-success"
                                    : "bg-warning text-dark"
                                }`}
                              >
                                {payroll.paymentStatus === 1 ? "Paid" : "Due"}
                              </span>
                            </td>
                          )}
                          {columnsVisibility.actions && (
                            <td className="text-center">
                              <button
                                type="button"
                                className="btn btn-sm btn-info"
                                onClick={() =>
                                  navigate("/payroll/view", {
                                    state: {
                                      payroll,
                                      employee: allEmployees.find(
                                        (emp) => emp.id === payroll.employeeId
                                      ),
                                    },
                                  })
                                }
                              >
                                View
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={Object.keys(columnsVisibility).length}
                          className="text-center"
                        >
                          No payroll data found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

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
                        <div>
                          <input
                            type="text"
                            placeholder="Search employees..."
                            className="form-control form-control-sm mr-2"
                            style={{ display: "inline-block", width: "auto" }}
                            value={searchTerm}
                            onChange={handleSearchChange}
                          />
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={toggleSelectAllEmployees}
                          >
                            {selectAllEmployees ? "Deselect All" : "Select All"}
                          </button>
                        </div>
                      </div>
                      <div
                        className="employee-select-container border rounded p-2"
                        style={{ maxHeight: "200px", overflowY: "auto" }}
                      >
                        {filteredEmployees.length > 0 ? (
                          filteredEmployees.map((employee) => (
                            <div key={employee.id} className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`emp-${employee.id}`}
                                checked={selectedEmployees.includes(
                                  employee.id
                                )}
                                onChange={() =>
                                  handleEmployeeSelect(employee.id)
                                }
                              />
                              <label
                                className="form-check-label"
                                htmlFor={`emp-${employee.id}`}
                              >
                                {employee.prefix} {employee.firstname}{" "}
                                {employee.lastname}
                              </label>
                            </div>
                          ))
                        ) : (
                          <div className="text-muted">No employees found</div>
                        )}
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
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm mr-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            Processing...
                          </>
                        ) : formData.id ? (
                          "Update Payroll"
                        ) : (
                          "Generate Payroll"
                        )}
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

export default AllPayrolls;
