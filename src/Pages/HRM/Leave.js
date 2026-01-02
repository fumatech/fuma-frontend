import React, { useState, useEffect } from "react";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import "bootstrap/dist/css/bootstrap.min.css";
import { Link } from "react-router-dom";
import axios from "axios";
import moment from "moment";
import { toast } from "react-toastify";

function Leave({ userRoles }) {
  const [leaveData, setLeaveData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentLeave, setCurrentLeave] = useState({
    id: null,
    employee: "",
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
    status: 0, // 0 for Pending, 1 for Approved, 2 for Rejected
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);

  const [columnsVisibility, setColumnsVisibility] = useState({
    referenceNo: true,
    leaveType: true,
    employee: true,
    date: true,
    reason: true,
    status: true,
  });

  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch all required data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch leaves data
        const leavesResponse = await axios.get(
          `${process.env.REACT_APP_BASE_URL}/add-leave/getall`
        );

        // Fetch employees data
        const employeesResponse = await axios.get(
          `${process.env.REACT_APP_BASE_URL}/user/getall`
        );
        setEmployees(employeesResponse.data);

        // Fetch leave types data
        const leaveTypesResponse = await axios.get(
          `${process.env.REACT_APP_BASE_URL}/leave/getall`
        );
        setLeaveTypes(leaveTypesResponse.data);

        // Process leaves data
        setLeaveData(
          leavesResponse.data.map((leave) => ({
            ...leave,
            referenceNo: `REF${leave.id.toString().padStart(3, "0")}`,
            date: `${moment(leave.startDate).format("YYYY-MM-DD")} to ${moment(
              leave.endDate
            ).format("YYYY-MM-DD")}`,
            statusText: getStatusText(leave.status),
            employeeName: getEmployeeName(
              leave.employee,
              employeesResponse.data
            ),
            leaveTypeName: getLeaveTypeName(
              leave.leaveType,
              leaveTypesResponse.data
            ),
          }))
        );
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getEmployeeName = (employeeId, employees) => {
    const employee = employees.find((e) => e.id === employeeId);
    return employee ? `${employee.firstname} ${employee.lastname}` : "Unknown";
  };

  const getLeaveTypeName = (leaveTypeId, leaveTypes) => {
    const leaveType = leaveTypes.find((lt) => lt.id === leaveTypeId);
    return leaveType ? leaveType.type : "Unknown";
  };

  const getStatusText = (status) => {
    switch (status) {
      case 0:
        return "Pending";
      case 1:
        return "Approved";
      case 2:
        return "Rejected";
      default:
        return "Unknown";
    }
  };
  const getStatusColorClass = (status) => {
    switch (status) {
      case 0:
        return "text-warning"; // Pending → Yellow
      case 1:
        return "text-success"; // Approved → Green
      case 2:
        return "text-danger"; // Rejected → Red
      default:
        return "text-secondary";
    }
  };

  // Handle entries per page change
  const handleEntriesChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // Handle input changes for the form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentLeave((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle date changes
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setCurrentLeave((prev) => ({
      ...prev,
      [name]: value ? `${value}T09:00:00` : "", // Add default time
    }));
  };

  // Handle adding/updating leave
  const handleSaveLeave = async (e) => {
    e.preventDefault();
    if (
      !currentLeave.employee ||
      !currentLeave.leaveType ||
      !currentLeave.startDate
    ) {
      toast.warning("Please fill all required fields");
      return;
    }

    try {
      if (isEditMode) {
        // Update existing leave
        const response = await axios.put(
          `${process.env.REACT_APP_BASE_URL}/add-leave/update/${currentLeave.id}`,
          currentLeave
        );
        setLeaveData(
          leaveData.map((leave) =>
            leave.id === currentLeave.id
              ? {
                  ...response.data,
                  referenceNo: `REF${response.data.id
                    .toString()
                    .padStart(3, "0")}`,
                  date: `${moment(response.data.startDate).format(
                    "YYYY-MM-DD"
                  )} to ${moment(response.data.endDate).format("YYYY-MM-DD")}`,
                  statusText: getStatusText(response.data.status),
                  employeeName: getEmployeeName(
                    response.data.employee,
                    employees
                  ),
                  leaveTypeName: getLeaveTypeName(
                    response.data.leaveType,
                    leaveTypes
                  ),
                }
              : leave
          )
        );
      } else {
        // Add new leave
        const response = await axios.post(
          `${process.env.REACT_APP_BASE_URL}/add-leave/add`,
          currentLeave
        );
        setLeaveData([
          ...leaveData,
          {
            ...response.data,
            referenceNo: `REF${response.data.id.toString().padStart(3, "0")}`,
            date: `${moment(response.data.startDate).format(
              "YYYY-MM-DD"
            )} to ${moment(response.data.endDate).format("YYYY-MM-DD")}`,
            statusText: getStatusText(response.data.status),
            employeeName: getEmployeeName(response.data.employee, employees),
            leaveTypeName: getLeaveTypeName(
              response.data.leaveType,
              leaveTypes
            ),
          },
        ]);
      }

      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setCurrentLeave({
      id: null,
      employee: "",
      leaveType: "",
      startDate: "",
      endDate: "",
      reason: "",
      status: 0,
    });
    setIsEditMode(false);
  };

  // Export functions
  const exportCSV = () => {
    const visibleColumns = Object.keys(columnsVisibility).filter(
      (col) => columnsVisibility[col]
    );
    const headers = visibleColumns.map((col) =>
      col.replace(/([A-Z])/g, " $1").toUpperCase()
    );

    const csvData = leaveData.map((leave) =>
      visibleColumns.map((col) => {
        if (col === "leaveType") {
          return leave.leaveTypeName;
        } else if (col === "status") {
          return leave.statusText;
        } else if (col === "employee") {
          return leave.employeeName;
        }
        return leave[col];
      })
    );

    const csv = [headers, ...csvData].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, "leaves.csv");
  };

  const exportExcel = () => {
    const formattedData = leaveData.map((leave) => ({
      "Reference No": `REF${leave.id.toString().padStart(3, "0")}`,
      "Leave Type": leave.leaveTypeName,
      Employee: leave.employeeName,
      Date: `${moment(leave.startDate).format("YYYY-MM-DD")} to ${moment(
        leave.endDate
      ).format("YYYY-MM-DD")}`,
      Reason: leave.reason,
      Status: leave.statusText,
    }));

    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leaves");
    XLSX.writeFile(wb, "leaves.xlsx");
  };

  const printData = () => {
    const printWindow = window.open("", "", "height=800,width=1200");
    printWindow.document.write("<html><head><title>Print Leaves</title>");
    printWindow.document.write(
      '<link rel="stylesheet" href="httpss://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">'
    );
    printWindow.document.write("</head><body>");
    printWindow.document.write(
      document.getElementById("table-container").innerHTML
    );
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const visibleColumns = Object.keys(columnsVisibility).filter(
      (col) => columnsVisibility[col]
    );

    doc.autoTable({
      head: [
        visibleColumns.map((col) =>
          col.replace(/([A-Z])/g, " $1").toUpperCase()
        ),
      ],
      body: leaveData.map((leave) =>
        visibleColumns.map((col) => {
          if (col === "leaveType") {
            return leave.leaveTypeName;
          } else if (col === "status") {
            return leave.statusText;
          } else if (col === "employee") {
            return leave.employeeName;
          }
          return leave[col];
        })
      ),
    });
    doc.save("leaves.pdf");
  };

  // Toggle column visibility
  const toggleColumn = (column) => {
    setColumnsVisibility((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  // Handle delete leave record
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this leave record?")) {
      try {
        await axios.delete(
          `${process.env.REACT_APP_BASE_URL}/add-leave/delete/${id}`
        );
        setLeaveData(leaveData.filter((leave) => leave.id !== id));
      } catch (err) {
        setError(err.message);
      }
    }
  };

  // Handle edit leave record
  const handleEdit = (leave) => {
    setCurrentLeave({
      id: leave.id,
      employee: leave.employee,
      leaveType: leave.leaveType,
      startDate: leave.startDate,
      endDate: leave.endDate,
      reason: leave.reason,
      status: leave.status,
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  // Handle dropdown item click
  const handleDropdownItemClick = (col, e) => {
    e.stopPropagation();
    toggleColumn(col);
  };

  // Pagination calculations
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const displayedLeaves = leaveData.slice(startIndex, endIndex);

  // if (loading) return <div>Loading...</div>;
  // if (error) return <div>Error: {error}</div>;

  return (
    <div className="wrapper">
      <div>
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6">
                <h1 className="all-heading m-0">Leaves</h1>
              </div>
            </div>
          </div>
        </section>

        <section className="content">
          <div className="box-solid tw-mb-4 tw-transition-all lg:tw-col-span-2 tw-duration-200 tw-bg-white tw-shadow-sm tw-rounded-xl tw-ring-1 hover:tw-shadow-md tw-ring-gray-200">
            <div className="tw-p-2 sm:tw-p-3">
              <div className="row mb-3 d-flex align-items-center">
                <div className="text-right">
                  <button
                    onClick={() => {
                      resetForm();
                      setIsModalOpen(true);
                    }}
                    className="btn btn-add"
                  >
                    <i className="fas fa-plus"></i> Add
                  </button>
                </div>

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

              <div className="tw-flow-root tw-border-gray-200">
                <div className="">
                  <div className="tw-py-2 tw-align-middle sm:tw-px-5">
                    <div className="table-responsive">
                      <div id="table-container">
                        <table className="table table-bordered table-striped">
                          <thead>
                            <tr>
                              {columnsVisibility.referenceNo && (
                                <th>Reference No</th>
                              )}
                              {columnsVisibility.leaveType && (
                                <th>Leave Type</th>
                              )}
                              {columnsVisibility.employee && <th>Employee</th>}
                              {columnsVisibility.date && <th>Date</th>}
                              {columnsVisibility.reason && <th>Reason</th>}
                              {columnsVisibility.status && <th>Status</th>}
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {displayedLeaves.map((leave) => (
                              <tr key={leave.id}>
                                {columnsVisibility.referenceNo && (
                                  <td>{leave.referenceNo}</td>
                                )}
                                {columnsVisibility.leaveType && (
                                  <td>{leave.leaveTypeName}</td>
                                )}
                                {columnsVisibility.employee && (
                                  <td>{leave.employeeName}</td>
                                )}

                                {columnsVisibility.date && (
                                  <td>{leave.date}</td>
                                )}
                                {columnsVisibility.reason && (
                                  <td>{leave.reason}</td>
                                )}
                                {columnsVisibility.status && (
                                  <td>
                                    <button
                                      type="button"
                                      className={`btn btn-link p-0 ${getStatusColorClass(
                                        leave.status
                                      )}`}
                                      onClick={() => handleEdit(leave)}
                                    >
                                      {getStatusText(leave.status)}
                                    </button>
                                  </td>
                                )}

                                <td>
                                  <button
                                    onClick={() => handleEdit(leave)}
                                    className="btn btn-edit"
                                  >
                                    <i className="fas fa-edit btn-icon"></i>{" "}
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDelete(leave.id)}
                                    className="btn btn-delete ml-2"
                                  >
                                    <i className="fas fa-trash btn-icon"></i>{" "}
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Add/Edit Leave Modal */}
      {isModalOpen && (
        <>
          <div
            className="modal fade show"
            style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
            onClick={() => {
              setIsModalOpen(false);
              resetForm();
            }}
          ></div>
          <div
            className="modal fade show"
            style={{ display: "block", overflowX: "hidden", overflowY: "auto" }}
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
            aria-labelledby="addLeaveModalTitle"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsModalOpen(false);
                resetForm();
              }
            }}
          >
            <div
              className="modal-dialog modal-lg modal-dialog-centered"
              role="document"
            >
              <div className="modal-content">
                <form onSubmit={handleSaveLeave}>
                  <div className="modal-header bg-primary text-white">
                    <h5 className="modal-title" id="addLeaveModalTitle">
                      {isEditMode ? "Edit Leave" : "Add Leave"}
                    </h5>
                    <button
                      type="button"
                      className="close text-white"
                      aria-label="Close"
                      onClick={() => {
                        setIsModalOpen(false);
                        resetForm();
                      }}
                    >
                      <span aria-hidden="true">&times;</span>
                    </button>
                  </div>
                  <div className="modal-body">
                    {/* Employee Selection */}
                    <div className="form-group row">
                      <label
                        htmlFor="employee"
                        className="col-sm-3 col-form-label font-weight-bold"
                      >
                        Select Employee:*
                      </label>
                      <div className="col-sm-9">
                        <select
                          className="form-control"
                          id="employee"
                          name="employee"
                          value={currentLeave.employee}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select Employee</option>
                          {employees.map((employee) => (
                            <option key={employee.id} value={employee.id}>
                              {employee.firstname} {employee.lastname}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Leave Type Selection */}
                    <div className="form-group row">
                      <label
                        htmlFor="leaveType"
                        className="col-sm-3 col-form-label font-weight-bold"
                      >
                        Leave Type:*
                      </label>
                      <div className="col-sm-9">
                        <select
                          className="form-control"
                          id="leaveType"
                          name="leaveType"
                          value={currentLeave.leaveType}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select Leave Type</option>
                          {leaveTypes.map((type) => (
                            <option key={type.id} value={type.id}>
                              {type.type}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Date Range */}
                    <div className="form-group row">
                      <label
                        htmlFor="startDate"
                        className="col-sm-3 col-form-label font-weight-bold"
                      >
                        Start Date:*
                      </label>
                      <div className="col-sm-4">
                        <input
                          type="date"
                          className="form-control"
                          id="startDate"
                          name="startDate"
                          value={currentLeave.startDate.split("T")[0]}
                          onChange={handleDateChange}
                          required
                        />
                      </div>
                      <label
                        htmlFor="endDate"
                        className="col-sm-1 col-form-label font-weight-bold text-center"
                      >
                        To
                      </label>
                      <div className="col-sm-4">
                        <input
                          type="date"
                          className="form-control"
                          id="endDate"
                          name="endDate"
                          value={currentLeave.endDate.split("T")[0]}
                          onChange={handleDateChange}
                          min={currentLeave.startDate.split("T")[0]}
                        />
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="form-group">
                      <label htmlFor="reason" className="font-weight-bold">
                        Reason:
                      </label>
                      <textarea
                        className="form-control"
                        id="reason"
                        name="reason"
                        rows="3"
                        value={currentLeave.reason}
                        onChange={handleInputChange}
                        placeholder="Enter reason for leave"
                      />
                    </div>

                    {/* Status (only visible in edit mode) */}
                    {isEditMode && (
                      <div className="form-group row">
                        <label
                          htmlFor="status"
                          className="col-sm-3 col-form-label font-weight-bold"
                        >
                          Status:
                        </label>
                        <div className="col-sm-9">
                          <select
                            className="form-control"
                            id="status"
                            name="status"
                            value={currentLeave.status}
                            onChange={handleInputChange}
                          >
                            <option value={0}>Pending</option>
                            <option value={1}>Approved</option>
                            <option value={2}>Rejected</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setIsModalOpen(false);
                        resetForm();
                      }}
                    >
                      Close
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {isEditMode ? "Update" : "Save"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Leave;
