import React, { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faSignInAlt,
    faSignOutAlt,
    faCalendarCheck,
    faClock,
    faTasks,
    faExclamationTriangle,
    faCheckCircle,
    faSpinner,
    faHourglassHalf,
    faEye,
    faBell,
    faBook,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";

const TRAINING_MODULES_KEY = "hrm_training_modules_v1";

const EmployeeDashboard = ({ employee }) => {
    const [todayAttendance, setTodayAttendance] = useState(null);
    const [monthlyStats, setMonthlyStats] = useState({ present: 0, absent: 0, halfDay: 0 });
    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [completingTask, setCompletingTask] = useState(null);
    const [completionReport, setCompletionReport] = useState("");
    const [completionBlockers, setCompletionBlockers] = useState("");
    const [taskProgressDraft, setTaskProgressDraft] = useState(0);
    const [taskBlockerDraft, setTaskBlockerDraft] = useState("");
    const [myTrainings, setMyTrainings] = useState([]);
    const BASE_URL = process.env.REACT_APP_BASE_URL;

    const getProgressPercent = (task) => {
        if (typeof task.progressPercent === "number") return Math.min(100, Math.max(0, task.progressPercent));
        if (task.status === "COMPLETED") return 100;
        if (task.status === "IN_PROGRESS") return 50;
        return 10;
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return null;
        try {
            const cleaned = String(timeStr).replace(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})\.\d+/, "$1");
            const date = new Date(cleaned);
            if (isNaN(date.getTime())) return null;
            return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
        } catch {
            return null;
        }
    };

    useEffect(() => {
        if (employee?.id) {
            fetchTodayStatus();
            fetchMonthlyStats();
            fetchTasks();
            loadMyTrainings(employee.id);
        }
    }, [employee]);

    useEffect(() => {
        const onStorage = () => {
            if (employee?.id) loadMyTrainings(employee.id);
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, [employee]);

    const fetchTodayStatus = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/attendance/current-status/${employee.id}`);
            setTodayAttendance(res.data);
        } catch (err) {
            console.error("Error fetching today status:", err);
        }
    };

    const fetchMonthlyStats = async () => {
        try {
            const now = new Date();
            const month = now.getMonth() + 1;
            const year = now.getFullYear();
            const res = await axios.get(`${BASE_URL}/attendance/working-summary/${employee.id}/${month}/${year}`);
            const summary = res.data;
            setMonthlyStats({
                present: summary.presentDays || 0,
                absent: summary.absentDays || 0,
                halfDay: summary.halfDays || 0,
            });
        } catch (err) {
            console.error("Error fetching monthly stats:", err);
        }
    };

    const fetchTasks = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/task/employee/${employee.id}`);
            setTasks(res.data);
        } catch (err) {
            console.error("Error fetching tasks:", err);
        }
    };

    const loadMyTrainings = (employeeId) => {
        try {
            const stored = localStorage.getItem(TRAINING_MODULES_KEY);
            const modules = stored ? JSON.parse(stored) : [];
            const mine = [];
            modules.forEach((mod) => {
                const assignee = (mod.assignees || []).find((a) => Number(a.employeeId) === Number(employeeId));
                if (assignee) {
                    mine.push({
                        moduleId: mod.id,
                        title: mod.title,
                        category: mod.category,
                        mandatory: !!mod.mandatory,
                        dueDate: mod.dueDate || null,
                        videoLessonUrl: mod.videoLessonUrl || "",
                        status: assignee.status || "NOT_STARTED",
                        progress: typeof assignee.progress === "number" ? assignee.progress : 0,
                    });
                }
            });
            setMyTrainings(mine);
        } catch (err) {
            console.error("Error loading trainings from local storage:", err);
            setMyTrainings([]);
        }
    };

    const updateTrainingProgress = (moduleId, progress) => {
        try {
            const stored = localStorage.getItem(TRAINING_MODULES_KEY);
            const modules = stored ? JSON.parse(stored) : [];
            const updatedModules = modules.map((mod) => {
                if (Number(mod.id) !== Number(moduleId)) return mod;
                return {
                    ...mod,
                    assignees: (mod.assignees || []).map((a) => {
                        if (Number(a.employeeId) !== Number(employee.id)) return a;
                        const p = Math.min(100, Math.max(0, Number(progress)));
                        return {
                            ...a,
                            progress: p,
                            status: p >= 100 ? "COMPLETED" : p > 0 ? "IN_PROGRESS" : "NOT_STARTED",
                            completedAt: p >= 100 ? new Date().toISOString() : null,
                            lastUpdated: new Date().toISOString(),
                        };
                    }),
                };
            });
            localStorage.setItem(TRAINING_MODULES_KEY, JSON.stringify(updatedModules));
            loadMyTrainings(employee.id);
            toast.success("Training progress updated");
        } catch (err) {
            console.error("Error updating training progress:", err);
            toast.error("Failed to update training progress");
        }
    };

    const updateTaskStatus = async (taskId, newStatus, extra = {}) => {
        try {
            const body = { status: newStatus };
            if (extra.completionReport) body.completionReport = extra.completionReport;
            if (typeof extra.progressPercent === "number") body.progressPercent = extra.progressPercent;
            if (extra.blockerNote !== undefined) body.blockerNote = extra.blockerNote;
            await axios.put(`${BASE_URL}/task/update-status/${taskId}`, body);
            toast.success("Task status updated!");
            fetchTasks();
        } catch (err) {
            toast.error("Failed to update task status");
        }
    };

    const openReportModal = (task) => {
        setCompletingTask(task);
        setCompletionReport("");
        setCompletionBlockers(task.blockerNote || "");
        setShowReportModal(true);
    };

    const handleSubmitReport = () => {
        if (!completionReport.trim()) {
            toast.warning("Please write your task completion report before submitting");
            return;
        }
        updateTaskStatus(completingTask.id, "COMPLETED", {
            completionReport,
            progressPercent: 100,
            blockerNote: completionBlockers,
        });
        setShowReportModal(false);
        setCompletingTask(null);
        setCompletionReport("");
        setCompletionBlockers("");
    };

    const isOverdue = (deadline, status) => {
        return status !== "COMPLETED" && new Date(deadline) < new Date();
    };

    const isDueSoon = (deadline, status) => {
        if (status === "COMPLETED") return false;
        const diff = new Date(deadline) - new Date();
        return diff > 0 && diff < 2 * 60 * 60 * 1000;
    };

    const priorityBadge = (p) => {
        const map = { LOW: "badge-success", MEDIUM: "badge-warning", HIGH: "badge-danger", URGENT: "badge-danger" };
        return map[p] || "badge-secondary";
    };

    const statusBadge = (s) => {
        const map = { PENDING: "badge-warning", IN_PROGRESS: "badge-info", COMPLETED: "badge-success" };
        return map[s] || "badge-secondary";
    };

    const pendingTasks = tasks.filter((t) => t.status === "PENDING");
    const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS");
    const overdueTasks = tasks.filter((t) => isOverdue(t.deadline, t.status));

    return (
        <div>
            <div className="row">
                <div className="col-12 mb-4">
                    <div className="card">
                        <div className="card-body">
                            <h4>Welcome, {employee.firstname} {employee.lastname}!</h4>
                            <p className="text-muted mb-0">
                                Employee ID: {employee.id} | Email: {employee.email}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Today's Status */}
            <div className="row">
                <div className="col-lg-6 col-md-12 mb-4">
                    <div className="card card-primary card-outline">
                        <div className="card-header">
                            <h3 className="card-title">
                                <FontAwesomeIcon icon={faClock} className="mr-2" />
                                Today's Status
                            </h3>
                        </div>
                        <div className="card-body">
                            {todayAttendance ? (
                                <div>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span>
                                            <FontAwesomeIcon icon={faSignInAlt} className="text-success mr-2" />
                                            Clock In:
                                        </span>
                                        <strong>
                                            {formatTime(todayAttendance.inTime) || "Not clocked in"}
                                        </strong>
                                    </div>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span>
                                            <FontAwesomeIcon icon={faSignOutAlt} className="text-danger mr-2" />
                                            Clock Out:
                                        </span>
                                        <strong>
                                            {formatTime(todayAttendance.outTime) || "Not clocked out"}
                                        </strong>
                                    </div>
                                    {todayAttendance.totalWorkingHours > 0 && (
                                        <div className="d-flex justify-content-between">
                                            <span>Working Hours:</span>
                                            <strong>{todayAttendance.totalWorkingHours}h</strong>
                                        </div>
                                    )}
                                    <div className="mt-2">
                                        <span
                                            className={`badge ${todayAttendance.status === "PRESENT"
                                                ? "badge-success"
                                                : todayAttendance.status === "HALF_DAY"
                                                    ? "badge-warning"
                                                    : "badge-danger"
                                                }`}
                                        >
                                            {todayAttendance.status}
                                        </span>
                                        {todayAttendance.loginMethod && (
                                            <span className="badge badge-info ml-2">
                                                {todayAttendance.loginMethod}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-muted py-3">
                                    <FontAwesomeIcon icon={faCalendarCheck} size="2x" className="mb-2" />
                                    <p>No attendance record for today yet.</p>
                                    <p className="small">Go to Face Attendance to clock in.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Monthly Summary */}
                <div className="col-lg-6 col-md-12 mb-4">
                    <div className="card card-info card-outline">
                        <div className="card-header">
                            <h3 className="card-title">
                                <FontAwesomeIcon icon={faCalendarCheck} className="mr-2" />
                                This Month's Summary
                            </h3>
                        </div>
                        <div className="card-body">
                            <div className="row text-center">
                                <div className="col-4">
                                    <div
                                        className="rounded p-3"
                                        style={{ background: "#d4edda" }}
                                    >
                                        <h3 className="text-success mb-0">{monthlyStats.present}</h3>
                                        <small className="text-muted">Present</small>
                                    </div>
                                </div>
                                <div className="col-4">
                                    <div
                                        className="rounded p-3"
                                        style={{ background: "#f8d7da" }}
                                    >
                                        <h3 className="text-danger mb-0">{monthlyStats.absent}</h3>
                                        <small className="text-muted">Absent</small>
                                    </div>
                                </div>
                                <div className="col-4">
                                    <div
                                        className="rounded p-3"
                                        style={{ background: "#fff3cd" }}
                                    >
                                        <h3 className="text-warning mb-0">{monthlyStats.halfDay}</h3>
                                        <small className="text-muted">Half Day</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* My Learning */}
            <div className="row">
                <div className="col-12 mb-4">
                    <div className="card card-success card-outline">
                        <div className="card-header">
                            <h3 className="card-title">
                                <FontAwesomeIcon icon={faBook} className="mr-2" />
                                My Learning & Training
                            </h3>
                        </div>
                        <div className="card-body p-0">
                            {myTrainings.length === 0 ? (
                                <div className="text-center text-muted py-4">
                                    <FontAwesomeIcon icon={faBook} size="2x" className="mb-2" />
                                    <p>No training modules assigned yet.</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-sm table-hover mb-0">
                                        <thead>
                                            <tr>
                                                <th>Module</th>
                                                <th>Category</th>
                                                <th>Mandatory</th>
                                                <th>Due</th>
                                                <th>Lesson</th>
                                                <th>Status</th>
                                                <th>Progress</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {myTrainings.map((t) => (
                                                <tr key={t.moduleId}>
                                                    <td>{t.title}</td>
                                                    <td>{t.category || "-"}</td>
                                                    <td>{t.mandatory ? <span className="badge badge-danger">Yes</span> : <span className="badge badge-secondary">No</span>}</td>
                                                    <td>{t.dueDate || "-"}</td>
                                                    <td>
                                                        {t.videoLessonUrl ? (
                                                            <a href={t.videoLessonUrl} target="_blank" rel="noreferrer">
                                                                <FontAwesomeIcon icon={faBook} className="mr-1 text-primary" />
                                                                Watch
                                                            </a>
                                                        ) : "-"}
                                                    </td>
                                                    <td><span className={`badge ${t.status === "COMPLETED" ? "badge-success" : t.status === "IN_PROGRESS" ? "badge-info" : "badge-warning"}`}>{t.status.replace("_", " ")}</span></td>
                                                    <td style={{ minWidth: 130 }}>
                                                        <div className="d-flex align-items-center">
                                                            <div className="progress" style={{ height: 6, width: 80 }}>
                                                                <div className="progress-bar" style={{ width: `${t.progress}%` }} />
                                                            </div>
                                                            <small className="ml-2">{t.progress}%</small>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <button className="btn btn-xs btn-outline-success" onClick={() => updateTrainingProgress(t.moduleId, Math.min(100, t.progress + 25))}>
                                                            +25%
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Task Stats */}
            <div className="row">
                <div className="col-md-3 col-6 mb-3">
                    <div className="small-box bg-info">
                        <div className="inner">
                            <h3>{tasks.length}</h3>
                            <p>Total Tasks</p>
                        </div>
                        <div className="icon"><FontAwesomeIcon icon={faTasks} /></div>
                    </div>
                </div>
                <div className="col-md-3 col-6 mb-3">
                    <div className="small-box bg-warning">
                        <div className="inner">
                            <h3>{pendingTasks.length}</h3>
                            <p>Pending</p>
                        </div>
                        <div className="icon"><FontAwesomeIcon icon={faHourglassHalf} /></div>
                    </div>
                </div>
                <div className="col-md-3 col-6 mb-3">
                    <div className="small-box bg-primary">
                        <div className="inner">
                            <h3>{inProgressTasks.length}</h3>
                            <p>In Progress</p>
                        </div>
                        <div className="icon"><FontAwesomeIcon icon={faSpinner} /></div>
                    </div>
                </div>
                <div className="col-md-3 col-6 mb-3">
                    <div className="small-box bg-danger">
                        <div className="inner">
                            <h3>{overdueTasks.length}</h3>
                            <p>Overdue</p>
                        </div>
                        <div className="icon"><FontAwesomeIcon icon={faExclamationTriangle} /></div>
                    </div>
                </div>
            </div>

            {/* My Tasks */}
            <div className="row">
                <div className="col-12 mb-4">
                    <div className="card card-primary card-outline">
                        <div className="card-header">
                            <h3 className="card-title">
                                <FontAwesomeIcon icon={faTasks} className="mr-2" />
                                My Tasks
                            </h3>
                        </div>
                        <div className="card-body p-0">
                            {tasks.length === 0 ? (
                                <div className="text-center text-muted py-4">
                                    <FontAwesomeIcon icon={faTasks} size="2x" className="mb-2" />
                                    <p>No tasks assigned to you.</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover table-striped mb-0">
                                        <thead>
                                            <tr>
                                                <th>Title</th>
                                                <th>Project</th>
                                                <th>Priority</th>
                                                <th>Deadline</th>
                                                <th>Reminder</th>
                                                <th>Progress</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tasks.map((task) => (
                                                <tr
                                                    key={task.id}
                                                    style={
                                                        isOverdue(task.deadline, task.status)
                                                            ? { backgroundColor: "#f8d7da" }
                                                            : isDueSoon(task.deadline, task.status)
                                                                ? { backgroundColor: "#fff3cd" }
                                                                : {}
                                                    }
                                                >
                                                    <td>
                                                        {task.title}
                                                        {isOverdue(task.deadline, task.status) && (
                                                            <span className="badge badge-danger ml-2">Overdue</span>
                                                        )}
                                                        {isDueSoon(task.deadline, task.status) && (
                                                            <span className="badge badge-warning ml-2">Due Soon</span>
                                                        )}
                                                    </td>
                                                    <td>{task.projectName || task.project || "-"}</td>
                                                    <td>
                                                        <span className={`badge ${priorityBadge(task.priority)}`}>
                                                            {task.priority}
                                                        </span>
                                                    </td>
                                                    <td>{new Date(task.deadline).toLocaleString("en-IN")}</td>
                                                    <td>
                                                        {task.reminderMinutes ? (
                                                            <span className="badge badge-light border">
                                                                <FontAwesomeIcon icon={faBell} className="mr-1 text-warning" />
                                                                {task.reminderMinutes}m before
                                                            </span>
                                                        ) : "-"}
                                                    </td>
                                                    <td style={{ minWidth: 130 }}>
                                                        <div className="d-flex align-items-center">
                                                            <div className="progress" style={{ height: 6, width: 80 }}>
                                                                <div
                                                                    className="progress-bar"
                                                                    style={{ width: `${getProgressPercent(task)}%` }}
                                                                />
                                                            </div>
                                                            <small className="ml-2">{getProgressPercent(task)}%</small>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${statusBadge(task.status)}`}>
                                                            {task.status?.replace("_", " ")}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn btn-xs btn-outline-info mr-1"
                                                            title="View Details"
                                                            onClick={() => {
                                                                setTaskProgressDraft(getProgressPercent(task));
                                                                setTaskBlockerDraft(task.blockerNote || "");
                                                                setSelectedTask(task);
                                                            }}
                                                        >
                                                            <FontAwesomeIcon icon={faEye} />
                                                        </button>
                                                        {task.status === "PENDING" && (
                                                            <button
                                                                className="btn btn-xs btn-primary"
                                                                onClick={() => updateTaskStatus(task.id, "IN_PROGRESS", { progressPercent: 15 })}
                                                            >
                                                                Start
                                                            </button>
                                                        )}
                                                        {task.status === "IN_PROGRESS" && (
                                                            <button
                                                                className="btn btn-xs btn-success"
                                                                onClick={() => openReportModal(task)}
                                                            >
                                                                <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                                                                Complete
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Task Detail Modal */}
            {selectedTask && (
                <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Task Details</h5>
                                <button className="close" onClick={() => setSelectedTask(null)}>
                                    <span>&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">
                                <h5>{selectedTask.title}</h5>
                                <p className="text-muted">{selectedTask.description || "No description provided."}</p>
                                <div className="row">
                                    <div className="col-6 mb-2">
                                        <strong>Project:</strong><br />
                                        {selectedTask.projectName || selectedTask.project || "-"}
                                    </div>
                                    <div className="col-6 mb-2">
                                        <strong>Priority:</strong>{" "}
                                        <span className={`badge ${priorityBadge(selectedTask.priority)}`}>
                                            {selectedTask.priority}
                                        </span>
                                    </div>
                                    <div className="col-6 mb-2">
                                        <strong>Status:</strong>{" "}
                                        <span className={`badge ${statusBadge(selectedTask.status)}`}>
                                            {selectedTask.status?.replace("_", " ")}
                                        </span>
                                    </div>
                                    <div className="col-6 mb-2">
                                        <strong>Start:</strong><br />
                                        {selectedTask.startTime
                                            ? new Date(selectedTask.startTime).toLocaleString("en-IN")
                                            : "N/A"}
                                    </div>
                                    <div className="col-6 mb-2">
                                        <strong>Deadline:</strong><br />
                                        <span className={isOverdue(selectedTask.deadline, selectedTask.status) ? "text-danger font-weight-bold" : ""}>
                                            {new Date(selectedTask.deadline).toLocaleString("en-IN")}
                                        </span>
                                    </div>
                                    <div className="col-12 mb-2">
                                        <strong>Progress:</strong>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            className="custom-range"
                                            value={taskProgressDraft}
                                            onChange={(e) => setTaskProgressDraft(Number(e.target.value))}
                                        />
                                        <small>{taskProgressDraft}%</small>
                                    </div>
                                    <div className="col-12 mb-2">
                                        <strong>Blockers / Notes:</strong>
                                        <textarea
                                            className="form-control"
                                            rows="2"
                                            value={taskBlockerDraft}
                                            onChange={(e) => setTaskBlockerDraft(e.target.value)}
                                            placeholder="Optional blocker update for manager"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    className="btn btn-outline-info"
                                    onClick={() => updateTaskStatus(selectedTask.id, selectedTask.status, {
                                        progressPercent: taskProgressDraft,
                                        blockerNote: taskBlockerDraft,
                                    })}
                                >
                                    Save Progress
                                </button>
                                {selectedTask.status === "PENDING" && (
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => {
                                            updateTaskStatus(selectedTask.id, "IN_PROGRESS", {
                                                progressPercent: Math.max(15, taskProgressDraft),
                                                blockerNote: taskBlockerDraft,
                                            });
                                            setSelectedTask(null);
                                        }}
                                    >
                                        Start Task
                                    </button>
                                )}
                                {selectedTask.status === "IN_PROGRESS" && (
                                    <button
                                        className="btn btn-success"
                                        onClick={() => {
                                            setSelectedTask(null);
                                            openReportModal(selectedTask);
                                        }}
                                    >
                                        Mark Complete
                                    </button>
                                )}
                                <button className="btn btn-secondary" onClick={() => setSelectedTask(null)}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Completion Report Modal */}
            {showReportModal && completingTask && (
                <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header bg-success text-white">
                                <h5 className="modal-title">
                                    <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                                    Task Completion Report
                                </h5>
                                <button className="close text-white" onClick={() => { setShowReportModal(false); setCompletingTask(null); setCompletionBlockers(""); }}>
                                    <span>&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <strong>Task:</strong> {completingTask.title}
                                </div>
                                <div className="form-group">
                                    <label className="font-weight-bold">
                                        What did you accomplish today? <span className="text-danger">*</span>
                                    </label>
                                    <textarea
                                        className="form-control"
                                        rows="5"
                                        placeholder="Write your completion report here... (What was done, key outcomes, any issues faced, etc.)"
                                        value={completionReport}
                                        onChange={(e) => setCompletionReport(e.target.value)}
                                    ></textarea>
                                    <small className="text-muted">This report will be shared with your manager.</small>
                                </div>
                                <div className="form-group mb-0">
                                    <label className="font-weight-bold">
                                        Any blocker/escalation notes?
                                    </label>
                                    <textarea
                                        className="form-control"
                                        rows="2"
                                        placeholder="Optional"
                                        value={completionBlockers}
                                        onChange={(e) => setCompletionBlockers(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => { setShowReportModal(false); setCompletingTask(null); setCompletionBlockers(""); }}>
                                    Cancel
                                </button>
                                <button className="btn btn-success" onClick={handleSubmitReport}>
                                    <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                                    Submit & Complete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeDashboard;
