import React, { useState, useEffect } from "react";
import axios from "axios";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

const AllAttendance = () => {
  // State for columns visibility
  const [columnsVisibility, setColumnsVisibility] = useState({
    name: true,
    shiftType: true,
    startTime: true,
    endTime: true,
    holiday: true,
  });

  // State to handle modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentAttendanceId, setCurrentAttendanceId] = useState(null);

  // State for data
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([
    { id: "morning", name: "Morning Shift" },
    { id: "evening", name: "Evening Shift" },
    { id: "night", name: "Night Shift" },
  ]);
  const [attendances, setAttendances] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // State for handling the form data
  const [formData, setFormData] = useState({
    employee: [],
    inTime: [],
    outTime: [],
    shift: [],
    ipAddress: [],
    inNote: [],
    outNote: [],
  });

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [employeesRes, attendancesRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_BASE_URL}/user/getall`),
          axios.get(`${process.env.REACT_APP_BASE_URL}/attendance/getall`),
        ]);

        setEmployees(employeesRes.data);
        setAttendances(attendancesRes.data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Function to open the modal for adding new attendance
  const openAddModal = () => {
    setIsEditMode(false);
    setCurrentAttendanceId(null);
    setFormData({
      employee: [],
      inTime: [],
      outTime: [],
      shift: [],
      ipAddress: [],
      inNote: [],
      outNote: [],
    });
    setIsModalOpen(true);
  };

  // Function to open the modal for editing attendance
  const openEditModal = (attendance) => {
    setIsEditMode(true);
    setCurrentAttendanceId(attendance.id);
    setFormData({
      employee: attendance.employee || [],
      inTime: attendance.inTime || [],
      outTime: attendance.outTime || [],
      shift: attendance.shift || [],
      ipAddress: attendance.ipAddress || [],
      inNote: attendance.inNote || [],
      outNote: attendance.outNote || [],
    });
    setIsModalOpen(true);
  };

  // Function to close the modal
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (index, e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData };

    // Ensure the array exists and has enough elements
    if (!newFormData[name]) newFormData[name] = [];
    if (index >= newFormData[name].length) {
      // Fill the array up to the index with empty values if needed
      while (newFormData[name].length <= index) {
        newFormData[name].push("");
      }
    }

    newFormData[name][index] = value;
    setFormData(newFormData);
  };

  // Add new attendance row in the modal
  const addNewAttendanceRow = () => {
    setFormData((prev) => ({
      ...prev,
      employee: [...prev.employee, ""],
      inTime: [...prev.inTime, ""],
      outTime: [...prev.outTime, ""],
      shift: [...prev.shift, ""],
      ipAddress: [...prev.ipAddress, ""],
      inNote: [...prev.inNote, ""],
      outNote: [...prev.outNote, ""],
    }));
  };

  // Remove attendance row from the modal
  const removeAttendanceRow = (index) => {
    if (formData.employee.length <= 1) return;

    setFormData((prev) => {
      const newData = { ...prev };
      Object.keys(newData).forEach((key) => {
        if (Array.isArray(newData[key])) {
          // Added missing parenthesis here
          newData[key] = newData[key].filter((_, i) => i !== index);
        }
      });
      return newData;
    });
  };

  // Save attendance (both add and edit)
  const saveAttendance = async () => {
    try {
      const attendanceData = {
        employee: formData.employee.map((id) => Number(id)),
        inTime: formData.inTime,
        outTime: formData.outTime,
        shift: formData.shift,
        ipAddress: formData.ipAddress,
        inNote: formData.inNote,
        outNote: formData.outNote,
      };

      if (isEditMode) {
        await axios.put(
          `${process.env.REACT_APP_BASE_URL}/attendance/update/${currentAttendanceId}`,
          attendanceData
        );
      } else {
        await axios.post(
          `${process.env.REACT_APP_BASE_URL}/attendance/add`,
          attendanceData
        );
      }

      // Refresh data
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/attendance/getall`
      );
      setAttendances(response.data);
      closeModal();
    } catch (error) {
      console.error("Error saving attendance:", error);
    }
  };

  // Delete attendance
  const deleteAttendance = async (id) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_BASE_URL}/attendance/delete/${id}`
      );
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/attendance/getall`
      );
      setAttendances(response.data);
    } catch (error) {
      console.error("Error deleting attendance:", error);
    }
  };

  // Export functions
  const exportCSV = () => {
    const csvData = attendances.map((att) => ({
      ID: att.id,
      Employee: att.employee.join(", "),
      "Clock In Time": att.inTime.join(", "),
      "Clock Out Time": att.outTime.join(", "),
      Shift: att.shift.join(", "),
      "IP Address": att.ipAddress.join(", "),
      "Clock In Note": att.inNote.join(", "),
      "Clock Out Note": att.outNote.join(", "),
    }));

    const csv = [
      Object.keys(csvData[0]),
      ...csvData.map((row) => Object.values(row)),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, "attendances.csv");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      attendances.map((att) => ({
        ID: att.id,
        Employee: att.employee.join(", "),
        "Clock In Time": att.inTime.join(", "),
        "Clock Out Time": att.outTime.join(", "),
        Shift: att.shift.join(", "),
        "IP Address": att.ipAddress.join(", "),
        "Clock In Note": att.inNote.join(", "),
        "Clock Out Note": att.outNote.join(", "),
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendances");
    XLSX.writeFile(wb, "attendances.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [["ID", "Employee", "Clock In", "Clock Out", "Shift"]],
      body: attendances.map((att) => [
        att.id,
        att.employee.join(", "),
        att.inTime.join(", "),
        att.outTime.join(", "),
        att.shift.join(", "),
      ]),
    });
    doc.save("attendances.pdf");
  };

  // Helper function to get employee name by ID
  const getEmployeeName = (employeeId) => {
    const employee = employees.find((e) => e.id === employeeId);
    return employee
      ? `${employee.prefix} ${employee.firstname} ${employee.lastname}`
      : "Unknown";
  };

  if (isLoading) {
    return <div className="text-center py-5">Loading...</div>;
  }

  return (
    <div className="content">
      <div className="container-fluid">
        <div className="card cardHover rounded-4 border-0">
          <div className="text-right p-3">
            <button className="btn btn-add" onClick={openAddModal}>
              <i className="fas fa-plus"></i> Add Attendance
            </button>
            <div className="table-responsive">
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
                </div>
                <div className="col d-flex flex-wrap align-items-center">
                  <button
                    className="btn Export-Btn mt-2 mb-2 mr-2"
                    onClick={exportCSV}
                  >
                    <i className="fa fa-file-csv"></i> Export CSV
                  </button>
                  <button
                    className="btn Export-Btn mt-2 mb-2 mr-2"
                    onClick={exportExcel}
                  >
                    <i className="fa fa-file-excel"></i> Export Excel
                  </button>
                  <button className="btn Export-Btn mt-2 mb-2 mr-2">
                    <i className="fa fa-print"></i> Print
                  </button>
                  <button
                    className="btn Export-Btn mt-2 mb-2 mr-2"
                    onClick={exportPDF}
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
                            onChange={() => {
                              setColumnsVisibility((prev) => ({
                                ...prev,
                                [col]: !prev[col],
                              }));
                            }}
                            className="mr-2"
                          />
                          <span className="btn border-0 bg-transparent p-0 m-0">
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
                      <th>ID</th>
                      {columnsVisibility.name && <th>Employee</th>}
                      {columnsVisibility.shiftType && <th>Shift Type</th>}
                      {columnsVisibility.startTime && <th>Clock In </th>}
                      {columnsVisibility.endTime && <th>Clock Out</th>}
                      {columnsVisibility.holiday && <th>IP Address</th>}
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendances.map((attendance) => (
                      <tr key={attendance.id}>
                        <td>{attendance.id}</td>
                        {columnsVisibility.name && (
                          <td>
                            {attendance.employee.map((id) => (
                              <div key={id}>{getEmployeeName(id)}</div>
                            ))}
                          </td>
                        )}
                        {columnsVisibility.shiftType && (
                          <td>{attendance.shift.join(", ")}</td>
                        )}
                        {columnsVisibility.startTime && (
                          <td>
                            {attendance.inTime.map((time, i) => (
                              <div key={i}>
                                {new Date(time).toLocaleString()}
                                <br />
                                {attendance.inNote}
                              </div>
                            ))}
                          </td>
                        )}
                        {columnsVisibility.endTime && (
                          <td>
                            {attendance.outTime.map((time, i) => (
                              <div key={i}>
                                {time
                                  ? new Date(time).toLocaleString()
                                  : "Not clocked out"}
                                <br />
                                {attendance.outNote}
                              </div>
                            ))}
                          </td>
                        )}
                        {columnsVisibility.holiday && (
                          <td>{attendance.ipAddress.join(", ")}</td>
                        )}
                        <td>
                          <button
                            className="btn btn-edit mr-2"
                            onClick={() => openEditModal(attendance)}
                          >
                            <i className="fas fa-edit"></i> Edit
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => deleteAttendance(attendance.id)}
                          >
                            <i className="fas fa-trash"></i> Delete
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

      {/* Modal for Adding/Editing Attendance */}
      {isModalOpen && (
        <div
          className="modal fade show"
          style={{
            display: "block",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1050,
            overflow: "auto",
          }}
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
          aria-labelledby="attendanceModalTitle"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            className="modal-dialog modal-xl"
            role="document"
            style={{
              maxWidth: "1000px",
              width: "90%",
              margin: "30px auto",
            }}
          >
            <div className="modal-content">
              <div
                className="modal-header"
                style={{
                  backgroundColor: "#0c4166",
                  color: "white",
                  padding: "20px",
                }}
              >
                <h5 className="modal-title" id="attendanceModalTitle">
                  {isEditMode ? "Edit Attendance" : "Add New Attendance"}
                </h5>
                <button
                  type="button"
                  className="close text-white"
                  aria-label="Close"
                  onClick={closeModal}
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>

              <div
                className="modal-body"
                style={{
                  padding: "20px",
                  maxHeight: "calc(100vh - 200px)",
                  overflowY: "auto",
                }}
              >
                {formData.employee.map((empId, index) => (
                  <div key={index} className="card mb-3">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <h6 className="mb-0">Attendance Entry #{index + 1}</h6>
                      {index > 0 && (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => removeAttendanceRow(index)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="card-body">
                      <div className="form-group row">
                        <label className="col-sm-3 col-form-label font-weight-bold">
                          Employee:
                        </label>
                        <div className="col-sm-9">
                          <select
                            className="form-control"
                            value={empId || ""}
                            onChange={(e) =>
                              handleInputChange(index, {
                                target: {
                                  name: "employee",
                                  value: e.target.value,
                                },
                              })
                            }
                            required
                          >
                            <option value="">Select Employee</option>
                            {employees.map((employee) => (
                              <option key={employee.id} value={employee.id}>
                                {employee.prefix} {employee.firstname}{" "}
                                {employee.lastname}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="form-group row">
                        <label className="col-sm-3 col-form-label font-weight-bold">
                          Clock In Time:
                        </label>
                        <div className="col-sm-9">
                          <input
                            type="datetime-local"
                            className="form-control"
                            name="inTime"
                            value={formData.inTime[index] || ""}
                            onChange={(e) => handleInputChange(index, e)}
                            required
                          />
                        </div>
                      </div>

                      <div className="form-group row">
                        <label className="col-sm-3 col-form-label font-weight-bold">
                          Clock Out Time:
                        </label>
                        <div className="col-sm-9">
                          <input
                            type="datetime-local"
                            className="form-control"
                            name="outTime"
                            value={formData.outTime[index] || ""}
                            onChange={(e) => handleInputChange(index, e)}
                          />
                        </div>
                      </div>

                      <div className="form-group row">
                        <label className="col-sm-3 col-form-label font-weight-bold">
                          Shift:
                        </label>
                        <div className="col-sm-9">
                          <select
                            className="form-control"
                            name="shift"
                            value={formData.shift[index] || ""}
                            onChange={(e) => handleInputChange(index, e)}
                            required
                          >
                            <option value="">Select Shift</option>
                            {shifts.map((shift) => (
                              <option key={shift.id} value={shift.id}>
                                {shift.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="form-group row">
                        <label className="col-sm-3 col-form-label font-weight-bold">
                          IP Address:
                        </label>
                        <div className="col-sm-9">
                          <input
                            type="text"
                            className="form-control"
                            name="ipAddress"
                            value={formData.ipAddress[index] || ""}
                            onChange={(e) => handleInputChange(index, e)}
                          />
                        </div>
                      </div>

                      <div className="form-group row">
                        <label className="col-sm-3 col-form-label font-weight-bold">
                          Clock In Note:
                        </label>
                        <div className="col-sm-9">
                          <textarea
                            className="form-control"
                            rows="2"
                            name="inNote"
                            value={formData.inNote[index] || ""}
                            onChange={(e) => handleInputChange(index, e)}
                          ></textarea>
                        </div>
                      </div>

                      <div className="form-group row">
                        <label className="col-sm-3 col-form-label font-weight-bold">
                          Clock Out Note:
                        </label>
                        <div className="col-sm-9">
                          <textarea
                            className="form-control"
                            rows="2"
                            name="outNote"
                            value={formData.outNote[index] || ""}
                            onChange={(e) => handleInputChange(index, e)}
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="text-center mt-3">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={addNewAttendanceRow}
                  >
                    <i className="fas fa-plus"></i> Add
                  </button>
                </div>
              </div>

              <div className="modal-footer" style={{ padding: "20px" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                >
                  <i className="fas fa-times mr-2"></i> Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={saveAttendance}
                >
                  <i className="fas fa-save mr-2"></i> Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllAttendance;
