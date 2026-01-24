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
        `${process.env.REACT_APP_BASE_URL}/business-locations/getall`,
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
        `${process.env.REACT_APP_BASE_URL}/payroll/all-full`,
      );

      const formatted = res.data.map((p) => {
        const totalGrossAmount = p.employees.reduce(
          (sum, e) => sum + (e.total || 0),
          0,
        );

        // Sum all employee transactions
        const totalPaid = p.employees.reduce((sum, e) => {
          const paid = e.transactions?.reduce(
            (tSum, t) => tSum + Number(t.amount || 0),
            0,
          );
          return sum + paid;
        }, 0);

        const paymentStatus = totalPaid >= totalGrossAmount ? "Paid" : "Due";

        return {
          id: p.id,
          name: p.payrollName,
          referenceNo: `PAY-${p.id}-${p.month}${p.year}`,
          month: p.month,
          year: p.year,
          status: p.status,
          paymentStatus,
          totalGrossAmount,
          totalPaid,
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
          payroll.id === formData.id ? { ...payroll, ...formData } : payroll,
        ),
      );
    } else {
      setPayrollData((prev) => [...prev, { ...formData, id: Date.now() }]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this payroll?",
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
    navigate(`/EditPayrolls/${payroll.id}`);
  };
  const ViewPayroll = (payroll) => {
    navigate(`/ViewPayrollGroups/${payroll.id}`);
  };
  const AddPayment = (payroll) => {
    navigate(`/AddPayment/${payroll.id}`);
  };

  useEffect(() => {
    setLocations([]);

    setAllEmployees([]);
  }, []);

  const handleEmployeeSelect = (employeeId) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId],
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
              <table className="table table-bordered table-hover" id="example1">
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
                            <span className="badge bg-secondary">Draft</span>
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
                          {/* Optional: show amount paid vs total */}
                          <small className="d-block">
                            ₹{payroll.totalPaid.toFixed(2)} / ₹
                            {payroll.totalGrossAmount.toFixed(2)}
                          </small>
                        </td>
                      )}

                      {columnsVisibility.totalGrossAmount && (
                        <td>₹{payroll.totalGrossAmount.toFixed(2)}</td>
                      )}

                      {columnsVisibility.addedBy && <td>{payroll.addedBy}</td>}
                      {columnsVisibility.location && (
                        <td>{getLocationName(payroll.location)}</td>
                      )}

                      {columnsVisibility.createdAt && (
                        <td>{payroll.createdAt}</td>
                      )}
                      {columnsVisibility.actions && (
                        <td className="text-left">
                          <div className="dropdown">
                            <button
                              className="btn btn-sm btn-secondary dropdown-toggle"
                              type="button"
                              data-toggle="dropdown"
                              aria-haspopup="true"
                              aria-expanded="false"
                            >
                              Actions
                            </button>

                            <div className="dropdown-menu">
                              <button
                                className="dropdown-item"
                                onClick={() => EditPayroll(payroll)}
                              >
                                <i className="fas fa-edit mr-2"></i> Edit
                              </button>

                              <button
                                className="dropdown-item"
                                onClick={() => ViewPayroll(payroll)}
                              >
                                <i className="fas fa-eye mr-2"></i> View
                              </button>

                              {/* ✅ Only show Add Payment if NOT fully paid */}
                              {payroll.paymentStatus !== "Paid" && (
                                <button
                                  className="dropdown-item"
                                  onClick={() => AddPayment(payroll)}
                                >
                                  <i className="fas fa-money-check mr-2"></i>{" "}
                                  Add Payment
                                </button>
                              )}
                            </div>
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
    </>
  );
};

export default AllPayrollGroups;
