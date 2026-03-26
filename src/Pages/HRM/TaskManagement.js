import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus,
    faEdit,
    faTrash,
    faTasks,
    faExclamationTriangle,
    faClock,
    faCheckCircle,
    faSpinner,
    faSearch,
    faFilter,
    faEye,
    faDownload,
    faFileAlt,
    faFolderOpen,
    faBell,
    faChartLine,
} from "@fortawesome/free-solid-svg-icons";

const BASE_URL = process.env.REACT_APP_BASE_URL;

const PRIORITY_COLORS = {
    LOW: { bg: "#d4edda", text: "#155724", label: "Low" },
    MEDIUM: { bg: "#fff3cd", text: "#856404", label: "Medium" },
    HIGH: { bg: "#f8d7da", text: "#721c24", label: "High" },
    URGENT: { bg: "#f5c6cb", text: "#721c24", label: "Urgent" },
};

const STATUS_COLORS = {
    PENDING: { bg: "#ffc107", text: "#fff", label: "Pending", icon: faClock },
    IN_PROGRESS: { bg: "#17a2b8", text: "#fff", label: "In Progress", icon: faSpinner },
    COMPLETED: { bg: "#28a745", text: "#fff", label: "Completed", icon: faCheckCircle },
};

const getProgressPercent = (task) => {
    if (typeof task.progressPercent === "number") return Math.min(100, Math.max(0, task.progressPercent));
    if (task.status === "COMPLETED") return 100;
    if (task.status === "IN_PROGRESS") return 50;
    return 10;
};

const reminderLabel = (minutes) => {
    if (!minutes || Number(minutes) <= 0) return "No reminder";
    const mins = Number(minutes);
    if (mins < 60) return `${mins} min before`;
    if (mins % 60 === 0) return `${mins / 60} hr before`;
    return `${mins} min before`;
};

const TaskManagement = () => {
    const [tasks, setTasks] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [filterPriority, setFilterPriority] = useState("ALL");
    const [filterEmployee, setFilterEmployee] = useState("ALL");
    const [searchTerm, setSearchTerm] = useState("");

    const [form, setForm] = useState({
        title: "",
        projectName: "",
        description: "",
        assignedTo: "",
        startTime: "",
        deadline: "",
        priority: "MEDIUM",
        status: "PENDING",
        reminderMinutes: 120,
        progressPercent: 0,
        blockerNote: "",
    });

    useEffect(() => {
        fetchTasks();
        fetchEmployees();
    }, []);

    const fetchTasks = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/task/getall`);
            setTasks(res.data || []);
        } catch (err) {
            console.error("Error fetching tasks:", err);
        }
        setLoading(false);
    };

    const fetchEmployees = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/user/getall`);
            setEmployees(res.data || []);
        } catch (err) {
            console.error("Error fetching employees:", err);
        }
    };

    const getEmployeeName = (id) => {
        const emp = employees.find((e) => e.id === id);
        return emp ? `${emp.firstname || ""} ${emp.lastname || ""}`.trim() : `Emp #${id}`;
    };

    const resetForm = () => {
        setForm({
            title: "",
            projectName: "",
            description: "",
            assignedTo: "",
            startTime: "",
            deadline: "",
            priority: "MEDIUM",
            status: "PENDING",
            reminderMinutes: 120,
            progressPercent: 0,
            blockerNote: "",
        });
        setEditingTask(null);
    };

    const openAddModal = () => {
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (task) => {
        setEditingTask(task);
        setForm({
            title: task.title || "",
            projectName: task.projectName || task.project || "",
            description: task.description || "",
            assignedTo: task.assignedTo || "",
            startTime: task.startTime ? task.startTime.slice(0, 16) : "",
            deadline: task.deadline ? task.deadline.slice(0, 16) : "",
            priority: task.priority || "MEDIUM",
            status: task.status || "PENDING",
            reminderMinutes: Number(task.reminderMinutes || 120),
            progressPercent: getProgressPercent(task),
            blockerNote: task.blockerNote || "",
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title || !form.assignedTo || !form.deadline) {
            toast.warning("Please fill in Title, Assigned Employee, and Deadline");
            return;
        }

        const progressPercent = Number(form.progressPercent);
        if (Number.isNaN(progressPercent) || progressPercent < 0 || progressPercent > 100) {
            toast.warning("Progress should be between 0 and 100");
            return;
        }

        const payload = {
            ...form,
            assignedTo: Number(form.assignedTo),
            assignedBy: Number(localStorage.getItem("userId") || 0),
            reminderMinutes: Number(form.reminderMinutes || 0),
            progressPercent,
        };

        try {
            if (editingTask) {
                await axios.put(`${BASE_URL}/task/update/${editingTask.id}`, payload);
                toast.success("Task updated successfully");
            } else {
                await axios.post(`${BASE_URL}/task/add`, payload);
                toast.success("Task created successfully");
            }
            setShowModal(false);
            resetForm();
            fetchTasks();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to save task");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this task?")) return;
        try {
            await axios.delete(`${BASE_URL}/task/delete/${id}`);
            toast.success("Task deleted");
            fetchTasks();
        } catch (err) {
            toast.error("Failed to delete task");
        }
    };

    const formatDateTime = (dt) => {
        if (!dt) return "-";
        return new Date(dt).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const isOverdue = (task) => {
        return task.status !== "COMPLETED" && task.deadline && new Date(task.deadline) < new Date();
    };

    const isNearDeadline = (task) => {
        if (task.status === "COMPLETED" || !task.deadline) return false;
        const diff = new Date(task.deadline) - new Date();
        return diff > 0 && diff <= 2 * 60 * 60 * 1000; // within 2 hours
    };

    const filteredTasks = tasks
        .filter((t) => filterStatus === "ALL" || t.status === filterStatus)
        .filter((t) => filterPriority === "ALL" || t.priority === filterPriority)
        .filter((t) => filterEmployee === "ALL" || String(t.assignedTo) === filterEmployee)
        .filter((t) => {
            if (!searchTerm) return true;
            const token = searchTerm.toLowerCase();
            return `${t.title || ""} ${t.projectName || t.project || ""}`.toLowerCase().includes(token);
        })
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const stats = useMemo(() => {
        const total = tasks.length;
        const avgProgress = total
            ? Math.round(tasks.reduce((sum, t) => sum + getProgressPercent(t), 0) / total)
            : 0;
        const highPriorityOpen = tasks.filter((t) => ["HIGH", "URGENT"].includes(t.priority) && t.status !== "COMPLETED").length;
        return {
            total,
            pending: tasks.filter((t) => t.status === "PENDING").length,
            inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
            completed: tasks.filter((t) => t.status === "COMPLETED").length,
            overdue: tasks.filter((t) => isOverdue(t)).length,
            avgProgress,
            highPriorityOpen,
        };
    }, [tasks]);

    const employeeProductivity = useMemo(() => {
        const byUser = {};
        tasks.forEach((task) => {
            const key = task.assignedTo;
            if (!key) return;
            if (!byUser[key]) byUser[key] = { employeeId: key, total: 0, completed: 0, overdue: 0, avgProgress: 0 };
            byUser[key].total += 1;
            byUser[key].completed += task.status === "COMPLETED" ? 1 : 0;
            byUser[key].overdue += isOverdue(task) ? 1 : 0;
            byUser[key].avgProgress += getProgressPercent(task);
        });
        return Object.values(byUser)
            .map((e) => ({
                ...e,
                avgProgress: e.total ? Math.round(e.avgProgress / e.total) : 0,
                completionRate: e.total ? Math.round((e.completed / e.total) * 100) : 0,
            }))
            .sort((a, b) => b.completionRate - a.completionRate)
            .slice(0, 6);
    }, [tasks]);

    if (loading) {
        return (
            <div className="text-center p-5">
                <FontAwesomeIcon icon={faSpinner} spin size="2x" />
                <p className="mt-2">Loading tasks...</p>
            </div>
        );
    }

    return (
        <div>
            {/* Stats Cards */}
            <div className="row mb-3">
                {[
                    { label: "Total", value: stats.total, color: "#4361ee" },
                    { label: "Pending", value: stats.pending, color: "#ffc107" },
                    { label: "In Progress", value: stats.inProgress, color: "#17a2b8" },
                    { label: "Completed", value: stats.completed, color: "#28a745" },
                    { label: "Overdue", value: stats.overdue, color: "#dc3545" },
                    { label: "Avg Progress", value: `${stats.avgProgress}%`, color: "#6f42c1" },
                    { label: "High Priority Open", value: stats.highPriorityOpen, color: "#fd7e14" },
                ].map((s, i) => (
                    <div className="col" key={i}>
                        <div className="card border-0 shadow-sm" style={{ borderTop: `3px solid ${s.color}` }}>
                            <div className="card-body text-center py-2">
                                <h4 className="mb-0 font-weight-bold" style={{ color: s.color }}>{s.value}</h4>
                                <small className="text-muted">{s.label}</small>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="card border-0 shadow-sm mb-3">
                <div className="card-header bg-white border-0">
                    <h6 className="mb-0">
                        <FontAwesomeIcon icon={faChartLine} className="mr-2 text-primary" />
                        Team Productivity Snapshot
                    </h6>
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-sm table-hover mb-0">
                            <thead className="thead-light">
                                <tr>
                                    <th>Employee</th>
                                    <th>Total Tasks</th>
                                    <th>Completed</th>
                                    <th>Completion %</th>
                                    <th>Avg Progress</th>
                                    <th>Overdue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employeeProductivity.length === 0 ? (
                                    <tr><td colSpan="6" className="text-center text-muted py-3">No productivity data</td></tr>
                                ) : (
                                    employeeProductivity.map((item) => (
                                        <tr key={item.employeeId}>
                                            <td>{getEmployeeName(item.employeeId)}</td>
                                            <td>{item.total}</td>
                                            <td>{item.completed}</td>
                                            <td>{item.completionRate}%</td>
                                            <td>{item.avgProgress}%</td>
                                            <td>{item.overdue}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="card border-0 shadow-sm mb-3">
                <div className="card-body py-2 d-flex flex-wrap align-items-center" style={{ gap: 10 }}>
                    <button className="btn btn-primary btn-sm" onClick={openAddModal}>
                        <FontAwesomeIcon icon={faPlus} className="mr-1" /> Assign Task / Project Work
                    </button>

                    <FontAwesomeIcon icon={faFilter} className="text-muted ml-2" />

                    <select className="form-control form-control-sm" style={{ width: 130 }}
                        value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                        <option value="ALL">All Status</option>
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                    </select>

                    <select className="form-control form-control-sm" style={{ width: 130 }}
                        value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                        <option value="ALL">All Priority</option>
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                    </select>

                    <select className="form-control form-control-sm" style={{ width: 170 }}
                        value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)}>
                        <option value="ALL">All Employees</option>
                        {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                                {emp.firstname} {emp.lastname}
                            </option>
                        ))}
                    </select>

                    <div className="ml-auto position-relative">
                        <FontAwesomeIcon icon={faSearch} className="text-muted"
                            style={{ position: "absolute", left: 10, top: 8 }} />
                        <input type="text" className="form-control form-control-sm" placeholder="Search task/project..."
                            style={{ paddingLeft: 30, width: 230 }}
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Tasks Table */}
            <div className="card border-0 shadow-sm">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0">
                            <thead className="thead-dark">
                                <tr>
                                    <th>#</th>
                                    <th>Title</th>
                                    <th>Project</th>
                                    <th>Assigned To</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Deadline</th>
                                    <th>Reminder</th>
                                    <th>Progress</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTasks.length === 0 ? (
                                    <tr>
                                        <td colSpan="10" className="text-center py-4 text-muted">
                                            <FontAwesomeIcon icon={faTasks} size="2x" className="mb-2 d-block mx-auto" />
                                            No tasks found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTasks.map((task, idx) => {
                                        const priority = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.MEDIUM;
                                        const status = STATUS_COLORS[task.status] || STATUS_COLORS.PENDING;
                                        const overdue = isOverdue(task);
                                        const nearDeadline = isNearDeadline(task);
                                        const progress = getProgressPercent(task);

                                        return (
                                            <tr key={task.id} className={overdue ? "table-danger" : nearDeadline ? "table-warning" : ""}>
                                                <td>{idx + 1}</td>
                                                <td>
                                                    <strong>{task.title}</strong>
                                                    {overdue && (
                                                        <span className="badge badge-danger ml-2">
                                                            <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1" />Overdue
                                                        </span>
                                                    )}
                                                    {nearDeadline && (
                                                        <span className="badge badge-warning ml-2">
                                                            <FontAwesomeIcon icon={faClock} className="mr-1" />Due Soon
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    {task.projectName || task.project ? (
                                                        <span className="badge badge-light border">
                                                            <FontAwesomeIcon icon={faFolderOpen} className="mr-1 text-primary" />
                                                            {task.projectName || task.project}
                                                        </span>
                                                    ) : "-"}
                                                </td>
                                                <td>{getEmployeeName(task.assignedTo)}</td>
                                                <td>
                                                    <span className="badge" style={{ backgroundColor: priority.bg, color: priority.text }}>
                                                        {priority.label}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="badge" style={{ backgroundColor: status.bg, color: status.text }}>
                                                        <FontAwesomeIcon icon={status.icon} className="mr-1" />
                                                        {status.label}
                                                    </span>
                                                    {task.status === "COMPLETED" && task.completionReport && (
                                                        <span className="badge badge-outline-success ml-1" title="Has completion report" style={{ cursor: "pointer", border: "1px solid #28a745", color: "#28a745", fontSize: "10px" }}
                                                            onClick={() => { setSelectedTask(task); setShowDetailModal(true); }}>
                                                            <FontAwesomeIcon icon={faFileAlt} className="mr-1" />Report
                                                        </span>
                                                    )}
                                                </td>
                                                <td>{formatDateTime(task.deadline)}</td>
                                                <td>
                                                    <span className="badge badge-light border">
                                                        <FontAwesomeIcon icon={faBell} className="mr-1 text-warning" />
                                                        {reminderLabel(task.reminderMinutes)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div className="progress" style={{ height: 6, width: 80 }}>
                                                            <div className="progress-bar" style={{
                                                                width: `${progress}%`,
                                                                backgroundColor: progress >= 100 ? "#28a745" : progress >= 60 ? "#17a2b8" : "#ffc107",
                                                            }} />
                                                        </div>
                                                        <small className="text-muted ml-2">{progress}%</small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <button className="btn btn-sm btn-outline-info mr-1" onClick={() => { setSelectedTask(task); setShowDetailModal(true); }}>
                                                        <FontAwesomeIcon icon={faEye} />
                                                    </button>
                                                    <button className="btn btn-sm btn-outline-primary mr-1" onClick={() => openEditModal(task)}>
                                                        <FontAwesomeIcon icon={faEdit} />
                                                    </button>
                                                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(task.id)}>
                                                        <FontAwesomeIcon icon={faTrash} />
                                                    </button>
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

            {/* Add/Edit Modal */}
            {showModal && (
                <>
                    <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1055 }}>
                        <div className="modal-dialog modal-lg modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header bg-primary text-white">
                                    <h5 className="modal-title">
                                        <FontAwesomeIcon icon={editingTask ? faEdit : faPlus} className="mr-2" />
                                        {editingTask ? "Edit Task / Project Assignment" : "Assign New Task / Project Assignment"}
                                    </h5>
                                    <button type="button" className="close text-white" onClick={() => setShowModal(false)}>
                                        <span>&times;</span>
                                    </button>
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div className="modal-body">
                                        <div className="row">
                                            <div className="col-md-7 mb-3">
                                                <label className="font-weight-bold">Task Title *</label>
                                                <input type="text" className="form-control" value={form.title}
                                                    onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                                            </div>
                                            <div className="col-md-5 mb-3">
                                                <label className="font-weight-bold">Project Name</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Optional"
                                                    value={form.projectName}
                                                    onChange={(e) => setForm({ ...form, projectName: e.target.value })}
                                                />
                                            </div>
                                            <div className="col-md-12 mb-3">
                                                <label className="font-weight-bold">Description</label>
                                                <textarea className="form-control" rows="3" value={form.description}
                                                    onChange={(e) => setForm({ ...form, description: e.target.value })} />
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="font-weight-bold">Assigned Employee *</label>
                                                <select className="form-control" value={form.assignedTo}
                                                    onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} required>
                                                    <option value="">Select Employee</option>
                                                    {employees.map((emp) => (
                                                        <option key={emp.id} value={emp.id}>
                                                            {emp.firstname} {emp.lastname} (ID: {emp.id})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="font-weight-bold">Priority</label>
                                                <select className="form-control" value={form.priority}
                                                    onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                                                    <option value="LOW">Low</option>
                                                    <option value="MEDIUM">Medium</option>
                                                    <option value="HIGH">High</option>
                                                    <option value="URGENT">Urgent</option>
                                                </select>
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="font-weight-bold">Start Time</label>
                                                <input type="datetime-local" className="form-control" value={form.startTime}
                                                    onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="font-weight-bold">Deadline *</label>
                                                <input type="datetime-local" className="form-control" value={form.deadline}
                                                    onChange={(e) => setForm({ ...form, deadline: e.target.value })} required />
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="font-weight-bold">Reminder (minutes before deadline)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="form-control"
                                                    value={form.reminderMinutes}
                                                    onChange={(e) => setForm({ ...form, reminderMinutes: e.target.value })}
                                                />
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="font-weight-bold">Progress (%)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    className="form-control"
                                                    value={form.progressPercent}
                                                    onChange={(e) => setForm({ ...form, progressPercent: e.target.value })}
                                                />
                                            </div>
                                            {editingTask && (
                                                <div className="col-md-6 mb-3">
                                                    <label className="font-weight-bold">Status</label>
                                                    <select className="form-control" value={form.status}
                                                        onChange={(e) => setForm({ ...form, status: e.target.value })}>
                                                        <option value="PENDING">Pending</option>
                                                        <option value="IN_PROGRESS">In Progress</option>
                                                        <option value="COMPLETED">Completed</option>
                                                    </select>
                                                </div>
                                            )}
                                            <div className="col-md-12 mb-3">
                                                <label className="font-weight-bold">Blockers / Manager Notes</label>
                                                <textarea
                                                    className="form-control"
                                                    rows="2"
                                                    value={form.blockerNote}
                                                    onChange={(e) => setForm({ ...form, blockerNote: e.target.value })}
                                                    placeholder="Optional notes to improve accountability and tracking"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                        <button type="submit" className="btn btn-primary">
                                            {editingTask ? "Update Assignment" : "Assign Task"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show" style={{ zIndex: 1050 }} />
                </>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedTask && (
                <>
                    <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1055 }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header bg-info text-white">
                                    <h5 className="modal-title">
                                        <FontAwesomeIcon icon={faEye} className="mr-2" />Task Details
                                    </h5>
                                    <button type="button" className="close text-white" onClick={() => setShowDetailModal(false)}>
                                        <span>&times;</span>
                                    </button>
                                </div>
                                <div className="modal-body">
                                    <h5 className="font-weight-bold">{selectedTask.title}</h5>
                                    <p className="text-muted">{selectedTask.description || "No description"}</p>
                                    <hr />
                                    <div className="row">
                                        <div className="col-6 mb-2">
                                            <small className="text-muted">Project</small>
                                            <p className="mb-0 font-weight-bold">{selectedTask.projectName || selectedTask.project || "-"}</p>
                                        </div>
                                        <div className="col-6 mb-2">
                                            <small className="text-muted">Assigned To</small>
                                            <p className="mb-0 font-weight-bold">{getEmployeeName(selectedTask.assignedTo)}</p>
                                        </div>
                                        <div className="col-6 mb-2">
                                            <small className="text-muted">Assigned By</small>
                                            <p className="mb-0 font-weight-bold">{getEmployeeName(selectedTask.assignedBy)}</p>
                                        </div>
                                        <div className="col-6 mb-2">
                                            <small className="text-muted">Reminder</small>
                                            <p className="mb-0">{reminderLabel(selectedTask.reminderMinutes)}</p>
                                        </div>
                                        <div className="col-6 mb-2">
                                            <small className="text-muted">Priority</small>
                                            <p className="mb-0">
                                                <span className="badge" style={{
                                                    backgroundColor: (PRIORITY_COLORS[selectedTask.priority] || PRIORITY_COLORS.MEDIUM).bg,
                                                    color: (PRIORITY_COLORS[selectedTask.priority] || PRIORITY_COLORS.MEDIUM).text,
                                                }}>
                                                    {(PRIORITY_COLORS[selectedTask.priority] || PRIORITY_COLORS.MEDIUM).label}
                                                </span>
                                            </p>
                                        </div>
                                        <div className="col-6 mb-2">
                                            <small className="text-muted">Status</small>
                                            <p className="mb-0">
                                                <span className="badge" style={{
                                                    backgroundColor: (STATUS_COLORS[selectedTask.status] || STATUS_COLORS.PENDING).bg,
                                                    color: (STATUS_COLORS[selectedTask.status] || STATUS_COLORS.PENDING).text,
                                                }}>
                                                    {(STATUS_COLORS[selectedTask.status] || STATUS_COLORS.PENDING).label}
                                                </span>
                                                {isOverdue(selectedTask) && <span className="badge badge-danger ml-2">Overdue</span>}
                                            </p>
                                        </div>
                                        <div className="col-6 mb-2">
                                            <small className="text-muted">Start Time</small>
                                            <p className="mb-0">{formatDateTime(selectedTask.startTime)}</p>
                                        </div>
                                        <div className="col-6 mb-2">
                                            <small className="text-muted">Deadline</small>
                                            <p className="mb-0">{formatDateTime(selectedTask.deadline)}</p>
                                        </div>
                                        <div className="col-12 mb-2">
                                            <small className="text-muted">Progress</small>
                                            <div className="progress" style={{ height: 8 }}>
                                                <div className="progress-bar" style={{ width: `${getProgressPercent(selectedTask)}%` }} />
                                            </div>
                                            <small>{getProgressPercent(selectedTask)}%</small>
                                        </div>
                                        <div className="col-12 mb-2">
                                            <small className="text-muted">Blockers / Notes</small>
                                            <p className="mb-0">{selectedTask.blockerNote || "-"}</p>
                                        </div>
                                        <div className="col-6 mb-2">
                                            <small className="text-muted">Created</small>
                                            <p className="mb-0">{formatDateTime(selectedTask.createdAt)}</p>
                                        </div>
                                        <div className="col-6 mb-2">
                                            <small className="text-muted">Last Updated</small>
                                            <p className="mb-0">{formatDateTime(selectedTask.updatedAt)}</p>
                                        </div>
                                    </div>

                                    {/* Completion Report Section */}
                                    {selectedTask.status === "COMPLETED" && selectedTask.completionReport && (
                                        <>
                                            <hr />
                                            <div className="mb-2">
                                                <h6 className="font-weight-bold text-success">
                                                    <FontAwesomeIcon icon={faFileAlt} className="mr-2" />
                                                    Completion Report
                                                </h6>
                                                {selectedTask.completedAt && (
                                                    <small className="text-muted d-block mb-2">
                                                        Completed on: {formatDateTime(selectedTask.completedAt)}
                                                    </small>
                                                )}
                                                <div className="p-3 rounded" style={{ backgroundColor: "#f8f9fa", whiteSpace: "pre-wrap", fontSize: "14px", lineHeight: "1.6", border: "1px solid #e9ecef" }}>
                                                    {selectedTask.completionReport}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    {selectedTask.status === "COMPLETED" && selectedTask.completionReport && (
                                        <button
                                            className="btn btn-outline-primary"
                                            onClick={() => {
                                                const content = `Task Completion Report\n${"=".repeat(40)}\n\nTask: ${selectedTask.title}\nProject: ${selectedTask.projectName || selectedTask.project || "-"}\nAssigned To: ${getEmployeeName(selectedTask.assignedTo)}\nAssigned By: ${getEmployeeName(selectedTask.assignedBy)}\nPriority: ${selectedTask.priority}\nDeadline: ${formatDateTime(selectedTask.deadline)}\nCompleted: ${formatDateTime(selectedTask.completedAt)}\n\nReport:\n${"-".repeat(40)}\n${selectedTask.completionReport}\n`;
                                                const blob = new Blob([content], { type: "text/plain" });
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement("a");
                                                a.href = url;
                                                a.download = `Task_Report_${selectedTask.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
                                                a.click();
                                                URL.revokeObjectURL(url);
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faDownload} className="mr-1" />
                                            Download Report
                                        </button>
                                    )}
                                    <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>Close</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show" style={{ zIndex: 1050 }} />
                </>
            )}
        </div>
    );
};

export default TaskManagement;
