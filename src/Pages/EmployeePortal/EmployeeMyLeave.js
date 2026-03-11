import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const EmployeeMyLeave = ({ employee }) => {
    const [leaves, setLeaves] = useState([]);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        leaveType: "",
        startDate: "",
        endDate: "",
        reason: "",
    });
    const BASE_URL = process.env.REACT_APP_BASE_URL;

    useEffect(() => {
        if (employee?.id) {
            fetchLeaves();
            fetchLeaveTypes();
        }
    }, [employee]);

    const fetchLeaves = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/add-leave/getall`);
            const allLeaves = res.data || [];
            const myLeaves = allLeaves.filter(
                (l) => l.employee === employee.id || l.employee === String(employee.id)
            );
            setLeaves(myLeaves);
        } catch (err) {
            console.error("Error fetching leaves:", err);
            setLeaves([]);
        }
    };

    const fetchLeaveTypes = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/leave/getall`);
            setLeaveTypes(res.data || []);
        } catch (err) {
            console.error("Error fetching leave types:", err);
        }
    };

    const getLeaveTypeName = (typeId) => {
        const lt = leaveTypes.find((t) => t.id === typeId || t.id === Number(typeId));
        return lt ? lt.type || lt.name || lt.leaveType || `Type #${typeId}` : `Type #${typeId}`;
    };

    const getStatusLabel = (status) => {
        switch (Number(status)) {
            case 0: return { text: "Pending", cls: "badge-warning" };
            case 1: return { text: "Approved", cls: "badge-success" };
            case 2: return { text: "Rejected", cls: "badge-danger" };
            default: return { text: "Unknown", cls: "badge-secondary" };
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.leaveType || !formData.startDate || !formData.endDate || !formData.reason) {
            toast.error("Please fill all fields");
            return;
        }

        try {
            await axios.post(`${BASE_URL}/add-leave/add`, {
                employee: employee.id,
                leaveType: Number(formData.leaveType),
                startDate: formData.startDate + "T00:00:00",
                endDate: formData.endDate + "T00:00:00",
                reason: formData.reason,
                status: 0,
            });
            toast.success("Leave request submitted successfully");
            setShowForm(false);
            setFormData({ leaveType: "", startDate: "", endDate: "", reason: "" });
            fetchLeaves();
        } catch (err) {
            console.error("Error submitting leave:", err);
            toast.error("Failed to submit leave request");
        }
    };

    return (
        <div>
            {/* Apply Leave Button */}
            <div className="mb-3">
                <button
                    className="btn btn-primary"
                    onClick={() => setShowForm(!showForm)}
                >
                    <i className={`fas ${showForm ? "fa-times" : "fa-plus"} mr-2`}></i>
                    {showForm ? "Cancel" : "Apply for Leave"}
                </button>
            </div>

            {/* Leave Application Form */}
            {showForm && (
                <div className="card card-primary card-outline mb-3">
                    <div className="card-header">
                        <h3 className="card-title">Apply for Leave</h3>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label>Leave Type</label>
                                        <select
                                            className="form-control"
                                            value={formData.leaveType}
                                            onChange={(e) =>
                                                setFormData({ ...formData, leaveType: e.target.value })
                                            }
                                        >
                                            <option value="">Select Leave Type</option>
                                            {leaveTypes.map((lt) => (
                                                <option key={lt.id} value={lt.id}>
                                                    {lt.type || lt.name || lt.leaveType || `Type #${lt.id}`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="form-group">
                                        <label>Start Date</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={formData.startDate}
                                            onChange={(e) =>
                                                setFormData({ ...formData, startDate: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="form-group">
                                        <label>End Date</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={formData.endDate}
                                            onChange={(e) =>
                                                setFormData({ ...formData, endDate: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="col-12">
                                    <div className="form-group">
                                        <label>Reason</label>
                                        <textarea
                                            className="form-control"
                                            rows="3"
                                            value={formData.reason}
                                            onChange={(e) =>
                                                setFormData({ ...formData, reason: e.target.value })
                                            }
                                            placeholder="Enter reason for leave"
                                        />
                                    </div>
                                </div>
                            </div>
                            <button type="submit" className="btn btn-success">
                                <i className="fas fa-paper-plane mr-2"></i>
                                Submit
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Leave History Table */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">My Leave History</h3>
                </div>
                <div className="card-body table-responsive p-0">
                    <table className="table table-hover table-striped">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Leave Type</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Reason</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaves.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center text-muted py-4">
                                        No leave records found.
                                    </td>
                                </tr>
                            ) : (
                                leaves.map((leave, idx) => {
                                    const status = getStatusLabel(leave.status);
                                    return (
                                        <tr key={leave.id || idx}>
                                            <td>{idx + 1}</td>
                                            <td>{getLeaveTypeName(leave.leaveType)}</td>
                                            <td>
                                                {leave.startDate
                                                    ? new Date(leave.startDate).toLocaleDateString()
                                                    : "-"}
                                            </td>
                                            <td>
                                                {leave.endDate
                                                    ? new Date(leave.endDate).toLocaleDateString()
                                                    : "-"}
                                            </td>
                                            <td>{leave.reason || "-"}</td>
                                            <td>
                                                <span className={`badge ${status.cls}`}>{status.text}</span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default EmployeeMyLeave;
