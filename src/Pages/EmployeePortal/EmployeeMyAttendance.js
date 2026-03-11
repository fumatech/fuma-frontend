import React, { useState, useEffect } from "react";
import axios from "axios";

const EmployeeMyAttendance = ({ employee }) => {
    const [attendance, setAttendance] = useState([]);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [summary, setSummary] = useState(null);
    const BASE_URL = process.env.REACT_APP_BASE_URL;

    useEffect(() => {
        if (employee?.id) {
            fetchAttendance();
            fetchSummary();
        }
    }, [employee, month, year]);

    const fetchAttendance = async () => {
        try {
            const res = await axios.get(
                `${BASE_URL}/attendance/monthly/${employee.id}/${month}/${year}`
            );
            setAttendance(res.data || []);
        } catch (err) {
            console.error("Error fetching attendance:", err);
            setAttendance([]);
        }
    };

    const fetchSummary = async () => {
        try {
            const res = await axios.get(
                `${BASE_URL}/attendance/working-summary/${employee.id}/${month}/${year}`
            );
            setSummary(res.data);
        } catch (err) {
            console.error("Error fetching summary:", err);
            setSummary(null);
        }
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return "-";
        try {
            // Truncate nanoseconds to milliseconds for safe JS parsing
            const cleaned = String(timeStr).replace(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})\.\d+/, "$1");
            const date = new Date(cleaned);
            if (isNaN(date.getTime())) return "-";
            return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
        } catch {
            return "-";
        }
    };

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    ];

    return (
        <div>
            {/* Filters */}
            <div className="card card-primary card-outline mb-3">
                <div className="card-body">
                    <div className="row align-items-end">
                        <div className="col-md-4">
                            <label>Month</label>
                            <select
                                className="form-control"
                                value={month}
                                onChange={(e) => setMonth(parseInt(e.target.value))}
                            >
                                {monthNames.map((name, idx) => (
                                    <option key={idx} value={idx + 1}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-4">
                            <label>Year</label>
                            <select
                                className="form-control"
                                value={year}
                                onChange={(e) => setYear(parseInt(e.target.value))}
                            >
                                {[2024, 2025, 2026, 2027].map((y) => (
                                    <option key={y} value={y}>
                                        {y}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Card */}
            {summary && (
                <div className="row mb-3">
                    <div className="col-md-3">
                        <div className="small-box bg-success">
                            <div className="inner">
                                <h3>{summary.presentDays || 0}</h3>
                                <p>Present</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="small-box bg-danger">
                            <div className="inner">
                                <h3>{summary.absentDays || 0}</h3>
                                <p>Absent</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="small-box bg-warning">
                            <div className="inner">
                                <h3>{summary.halfDays || 0}</h3>
                                <p>Half Day</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="small-box bg-info">
                            <div className="inner">
                                <h3>{summary.totalWorkingHours || 0}h</h3>
                                <p>Total Hours</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Attendance Table */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">
                        Attendance for {monthNames[month - 1]} {year}
                    </h3>
                </div>
                <div className="card-body table-responsive p-0">
                    <table className="table table-hover table-striped">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Clock In</th>
                                <th>Clock Out</th>
                                <th>Working Hours</th>
                                <th>Method</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendance.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center text-muted py-4">
                                        No attendance records found for this period.
                                    </td>
                                </tr>
                            ) : (
                                attendance.map((record, idx) => (
                                    <tr key={idx}>
                                        <td>{record.attendanceDate}</td>
                                        <td>{formatTime(record.inTime)}</td>
                                        <td>{formatTime(record.outTime)}</td>
                                        <td>{record.totalWorkingHours ? `${record.totalWorkingHours}h` : "-"}</td>
                                        <td>
                                            <span className={`badge ${record.loginMethod === "FACE_SCAN" ? "badge-info" : "badge-secondary"}`}>
                                                {record.loginMethod || "N/A"}
                                            </span>
                                        </td>
                                        <td>
                                            <span
                                                className={`badge ${record.status === "PRESENT"
                                                    ? "badge-success"
                                                    : record.status === "HALF_DAY"
                                                        ? "badge-warning"
                                                        : "badge-danger"
                                                    }`}
                                            >
                                                {record.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default EmployeeMyAttendance;
