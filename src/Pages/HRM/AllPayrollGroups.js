import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AllPayrollGroups = () => {
  const navigate = useNavigate();
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
  const [locations, setLocations] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectAllEmployees, setSelectAllEmployees] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [payrollData, setPayrollData] = useState([]);
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
  useEffect(() => {
    fetchPayrolls();
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/business-locations/getall`
      );
      setLocations(res.data || []);
    } catch (error) {
      toast.error("Failed to load locations");
      console.error(error);
    }
  };
  const getLocationName = (locationId) => {
    const loc = locations.find((l) => l.id === Number(locationId));
    return loc ? loc.name : "-";
  };

  const fetchPayrolls = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/payroll/all-full`
      );

      const formatted = res.data.map((p) => {
        const totalGrossAmount = p.employees.reduce(
          (sum, e) => sum + (e.total || 0),
          0
        );

        return {
          id: p.id,
          name: p.payrollName,
          referenceNo: `PAY-${p.id}-${p.month}${p.year}`,
          month: p.month,
          year: p.year,
          status: p.status,
          paymentStatus: p.paymentStatus === 1 ? "Paid" : "Due",
          totalGrossAmount,
          location: `${p.location}`,
          addedBy: p.addedBy,
          createdAt: p.createdAt,
          raw: p,
        };
      });

      setPayrollData(formatted);
    } catch (error) {
      toast.error("Failed to fetch payrolls");
      console.error(error);
    }
  };

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

  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen);
  };

  const openModal = (payroll = null) => {
    if (payroll) {
      setFormData(payroll);
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
      });
    }
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.id) {
      setPayrollData((prev) =>
        prev.map((payroll) =>
          payroll.id === formData.id ? { ...payroll, ...formData } : payroll
        )
      );
    } else {
      setPayrollData((prev) => [...prev, { ...formData, id: Date.now() }]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this payroll?"
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(`${process.env.REACT_APP_BASE_URL}/payroll/${id}`);

      setPayrollData((prev) => prev.filter((payroll) => payroll.id !== id));

      toast.success("Payroll deleted successfully");
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete payroll");
    }
  };
  const EditPayroll = (payroll) => {
    navigate(`/EditPayroll/${payroll.id}`);
  };
  useEffect(() => {
    setLocations([]);

    setAllEmployees([]);
  }, []);

  const handleEmployeeSelect = (employeeId) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const toggleSelectAllEmployees = () => {
    if (selectAllEmployees) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(allEmployees.map((emp) => emp.id));
    }
    setSelectAllEmployees(!selectAllEmployees);
  };

  return (
    <>
      <section className="content">
        <div className="container-fluid">
          <div className="card cardHover rounded-4 border-0">
            <div className="text-right p-3">
              <div className="card-body">
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
                          {columnsVisibility.name && (
                            <td>
                              <strong>{payroll.name}</strong>
                              <br />
                              <small className="text-muted">
                                {payroll.referenceNo}
                              </small>
                            </td>
                          )}
                          {columnsVisibility.status && (
                            <td>
                              {payroll.status === 1 ? (
                                <span className="badge bg-success">Final</span>
                              ) : (
                                <span className="badge bg-secondary">
                                  Draft
                                </span>
                              )}
                            </td>
                          )}
                          {columnsVisibility.paymentStatus && (
                            <td>
                              <span
                                className={`badge ${
                                  payroll.paymentStatus === "Paid"
                                    ? "bg-success"
                                    : "bg-warning text-dark"
                                }`}
                              >
                                {payroll.paymentStatus}
                              </span>
                            </td>
                          )}

                          {columnsVisibility.totalGrossAmount && (
                            <td>₹{payroll.totalGrossAmount.toFixed(2)}</td>
                          )}

                          {columnsVisibility.addedBy && (
                            <td>{payroll.addedBy}</td>
                          )}
                          {columnsVisibility.location && (
                            <td>{getLocationName(payroll.location)}</td>
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
                                  onClick={() => EditPayroll(payroll)}
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
                                  <i className="fas fa-trash btn-icon"></i>{" "}
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
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* {isModalOpen && (
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
      )} */}
    </>
  );
};

export default AllPayrollGroups;
