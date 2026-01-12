import React, { useState, useEffect } from "react";
import axios from "axios";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";

const AllAttendance = () => {
  const [columnsVisibility, setColumnsVisibility] = useState({
    name: true,
    shiftType: true,
    startTime: true,
    endTime: true,
    holiday: true,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentAttendanceId, setCurrentAttendanceId] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([
    { id: "morning", name: "Morning Shift" },
    { id: "evening", name: "Evening Shift" },
    { id: "night", name: "Night Shift" },
  ]);
  const [attendances, setAttendances] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    attendanceDate: "",
    records: [
      {
        employeeId: "",
        shiftId: "",
        inTime: "",
        outTime: "",
        ipAddress: "",
        inNote: "",
        outNote: "",
      },
    ],
  });

  useEffect(() => {
    const fetchData = async () => {
      const [empRes, attRes, shiftRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_BASE_URL}/user/getall`),
        axios.get(`${process.env.REACT_APP_BASE_URL}/attendance/getall`),
        axios.get(`https://fusionmastertech.com:8443/shift/getall`),
      ]);

      setEmployees(empRes.data);
      setAttendances(attRes.data);
      setShifts(shiftRes.data);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const openAddModal = () => {
    setIsEditMode(false);
    setCurrentAttendanceId(null);

    setFormData({
      attendanceDate: "",
      records: [
        {
          employeeId: "",
          shiftId: "",
          inTime: "",
          outTime: "",
          ipAddress: "",
          inNote: "",
          outNote: "",
        },
      ],
    });

    setIsModalOpen(true);
  };

  const openEditModal = (attendance) => {
    setIsEditMode(true);
    setCurrentAttendanceId(attendance.id);

    setFormData({
      attendanceDate: attendance.attendanceDate || "",
      records: [
        {
          employeeId: attendance.employeeId,
          shiftId: attendance.shiftId,
          inTime: attendance.inTime || "",
          outTime: attendance.outTime || "",
          ipAddress: attendance.ipAddress || "",
          inNote: attendance.inNote || "",
          outNote: attendance.outNote || "",
        },
      ],
    });

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };
  const handleInputChange = (index, e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updatedRecords = [...prev.records];
      updatedRecords[index] = {
        ...updatedRecords[index],
        [name]: value,
      };

      return {
        ...prev,
        records: updatedRecords,
      };
    });
  };

  const addNewAttendanceRow = () => {
    setFormData((prev) => ({
      ...prev,
      records: [
        ...prev.records,
        {
          employeeId: "",
          shiftId: "",
          inTime: "",
          outTime: "",
          ipAddress: "",
          inNote: "",
          outNote: "",
        },
      ],
    }));
  };
  const removeAttendanceRow = (index) => {
    setFormData((prev) => {
      if (prev.records.length === 1) return prev;

      return {
        ...prev,
        records: prev.records.filter((_, i) => i !== index),
      };
    });
  };

  const getShiftName = (shiftId) => {
    const shift = shifts.find((s) => s.id === shiftId);
    return shift ? shift.name : "Unknown";
  };

  const saveAttendance = async () => {
    try {
      if (isEditMode) {
        await axios.put(
          `${process.env.REACT_APP_BASE_URL}/attendance/update/${currentAttendanceId}`,
          formData.records[0]
        );
        toast.success("Attendance updated successfully");
      } else {
        const payload = {
          attendanceDate: formData.attendanceDate,
          records: formData.records.map((r) => ({
            employeeId: Number(r.employeeId),
            shiftId: r.shiftId,
            inTime: r.inTime,
            outTime: r.outTime,
            ipAddress: r.ipAddress,
            inNote: r.inNote,
            outNote: r.outNote,
          })),
        };
        await axios.post(
          `${process.env.REACT_APP_BASE_URL}/attendance/bulk`,
          payload
        );
        toast.success("Attendance saved successfully");
      }
      closeModal();

      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/attendance/getall`
      );
      setAttendances(response.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save attendance");
    }
  };

  const deleteAttendance = async (id) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_BASE_URL}/attendance/delete/${id}`
      );

      setAttendances((prev) => prev.filter((att) => att.id !== id));

      toast.success("Attendance deleted successfully!");
    } catch (error) {
      console.error("Error deleting attendance:", error);
      toast.error("Failed to delete attendance.");
    }
  };

  const exportCSV = () => {
    const csvData = attendances.map((att) => ({
      ID: att.id,
      Employee: getEmployeeName(att.employeeId),
      "Clock In Time": att.inTime,
      "Clock Out Time": att.outTime,
      Shift: getShiftName(att.shiftId),
      "IP Address": att.ipAddress,
      "Clock In Note": att.inNote,
      "Clock Out Note": att.outNote,
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
        "Clock In Time": att.inTime.join(", "),
        "Clock Out Time": att.outTime.join(", "),
        Employee: getEmployeeName(att.employeeId),
        Shift: getShiftName(att.shiftId),
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

  const getEmployeeName = (employeeId) => {
    const employee = employees.find((e) => e.id === employeeId);
    return employee
      ? `${employee.prefix} ${employee.firstname} ${employee.lastname}`
      : "Unknown";
  };

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
                            <td>{getEmployeeName(attendance.employeeId)}</td>
                          )}
                          {columnsVisibility.shiftType && (
                            <td>{getShiftName(attendance.shiftId)}</td>
                          )}
                          {columnsVisibility.startTime && (
                            <td>
                              {attendance.inTime
                                ? new Date(attendance.inTime).toLocaleString()
                                : "-"}
                            </td>
                          )}
                          {columnsVisibility.endTime && (
                            <td>
                              {attendance.outTime
                                ? new Date(attendance.outTime).toLocaleString()
                                : "-"}
                            </td>
                          )}
                          {columnsVisibility.holiday && (
                            <td>{attendance.ipAddress || "-"}</td>
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
                  {formData.records.map((record, index) => (
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
                              name="employeeId"
                              value={record.employeeId}
                              onChange={(e) => handleInputChange(index, e)}
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
                              value={record.inTime}
                              onChange={(e) => handleInputChange(index, e)}
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
                              value={record.outTime}
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
                              name="shiftId"
                              value={record.shiftId}
                              onChange={(e) => handleInputChange(index, e)}
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
                              value={record.ipAddress}
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
                              value={record.inNote}
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
                              value={record.outNote}
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
    </div>
  );
};

export default AllAttendance;
