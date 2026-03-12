import React, { useState, useEffect } from "react";
import axios from "axios";

const CATEGORY_COLORS = {
    Announcement: "#3498db",
    Achievement: "#2ecc71",
    Alert: "#e74c3c",
    Event: "#9b59b6",
    Policy: "#f39c12",
    General: "#95a5a6",
};

const CATEGORY_ICONS = {
    Announcement: "fas fa-bullhorn",
    Achievement: "fas fa-trophy",
    Alert: "fas fa-exclamation-triangle",
    Event: "fas fa-calendar-alt",
    Policy: "fas fa-file-alt",
    General: "fas fa-info-circle",
};

const PRIORITY_COLORS = {
    Low: "#2ecc71",
    Medium: "#f39c12",
    High: "#e67e22",
    Urgent: "#e74c3c",
};

const EmployeeNotices = () => {
    const [notices, setNotices] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("notices");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Get logged-in employee
            const email = sessionStorage.getItem("employeeEmail");
            let loggedInUser = null;
            if (email) {
                const userRes = await axios.get(`${process.env.REACT_APP_BASE_URL}/user/email/${email}`);
                loggedInUser = userRes.data;
            }

            const requests = [
                axios.get(`${process.env.REACT_APP_BASE_URL}/holiday/getall`),
                axios.get(`${process.env.REACT_APP_BASE_URL}/user/getall`),
            ];

            // Fetch notices for this employee (All + targeted to them)
            if (loggedInUser && loggedInUser.id) {
                requests.push(axios.get(`${process.env.REACT_APP_BASE_URL}/notice-board/for-employee/${loggedInUser.id}`));
            } else {
                requests.push(axios.get(`${process.env.REACT_APP_BASE_URL}/notice-board/active`));
            }

            const [holidayRes, empRes, noticesRes] = await Promise.all(requests);

            setNotices(noticesRes.data || []);
            setEmployees(empRes.data || []);

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const upcoming = (holidayRes.data || [])
                .filter((h) => new Date(h.startDate) >= today)
                .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
            setHolidays(upcoming);
        } catch (error) {
            console.error("Failed to load data:", error);
        }
        setLoading(false);
    };

    const getEmployeeName = (id) => {
        const emp = employees.find(e => e.id === id);
        return emp ? `${emp.firstname || ""} ${emp.lastname || ""}`.trim() || emp.email : "";
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const timeAgo = (dateStr) => {
        if (!dateStr) return "";
        const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
        if (seconds < 60) return "Just now";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 30) return `${days}d ago`;
        return `${Math.floor(days / 30)}mo ago`;
    };

    const getDaysUntil = (dateStr) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(dateStr);
        target.setHours(0, 0, 0, 0);
        const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
        if (diff === 0) return "Today";
        if (diff === 1) return "Tomorrow";
        return `In ${diff} days`;
    };

    if (loading) {
        return (
            <div className="text-center p-5">
                <i className="fas fa-spinner fa-spin fa-2x"></i>
                <p className="mt-2">Loading notices...</p>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            <div className="row mb-3">
                <div className="col-12">
                    <h4 className="font-weight-bold">
                        <i className="fas fa-bullhorn mr-2 text-primary"></i>
                        Notices & Announcements
                    </h4>
                    <hr />
                </div>
            </div>

            {/* Tabs */}
            <ul className="nav nav-tabs mb-3">
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === "notices" ? "active" : ""}`}
                        onClick={() => setActiveTab("notices")}
                        style={{ border: "none", background: "none", cursor: "pointer" }}
                    >
                        <i className="fas fa-clipboard-list mr-1"></i>
                        Company Notices
                        {notices.length > 0 && (
                            <span className="badge badge-primary ml-1">{notices.length}</span>
                        )}
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === "holidays" ? "active" : ""}`}
                        onClick={() => setActiveTab("holidays")}
                        style={{ border: "none", background: "none", cursor: "pointer" }}
                    >
                        <i className="fas fa-calendar-check mr-1"></i>
                        Upcoming Holidays
                        {holidays.length > 0 && (
                            <span className="badge badge-info ml-1">{holidays.length}</span>
                        )}
                    </button>
                </li>
            </ul>

            {/* Company Notices Tab */}
            {activeTab === "notices" && (
                <>
                    {notices.length === 0 ? (
                        <div className="text-center p-5 text-muted">
                            <i className="fas fa-clipboard fa-3x mb-3 d-block" style={{ opacity: 0.3 }}></i>
                            <h5>No company notices at this time</h5>
                        </div>
                    ) : (
                        <div className="row">
                            {notices.map((notice) => (
                                <div className="col-md-6 col-lg-4 mb-3" key={notice.id}>
                                    <div
                                        className="card shadow-sm h-100"
                                        style={{
                                            borderTop: `3px solid ${CATEGORY_COLORS[notice.category] || "#95a5a6"}`,
                                        }}
                                    >
                                        <div className="card-body">
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <div className="d-flex align-items-center">
                                                    {notice.pinned && (
                                                        <i className="fas fa-thumbtack text-warning mr-2" style={{ fontSize: "12px" }} title="Pinned"></i>
                                                    )}
                                                    <span
                                                        className="badge"
                                                        style={{
                                                            backgroundColor: CATEGORY_COLORS[notice.category] || "#95a5a6",
                                                            color: "#fff",
                                                            fontSize: "10px",
                                                        }}
                                                    >
                                                        <i className={`${CATEGORY_ICONS[notice.category] || "fas fa-info-circle"} mr-1`}></i>
                                                        {notice.category}
                                                    </span>
                                                </div>
                                                <span
                                                    className="badge"
                                                    style={{
                                                        backgroundColor: PRIORITY_COLORS[notice.priority] || "#95a5a6",
                                                        color: "#fff",
                                                        fontSize: "10px",
                                                    }}
                                                >
                                                    {notice.priority}
                                                </span>
                                            </div>

                                            <h5 className="card-title font-weight-bold mb-2" style={{ fontSize: "15px" }}>
                                                {notice.title}
                                            </h5>

                                            <p className="text-muted mb-2" style={{ fontSize: "13px", lineHeight: "1.5" }}>
                                                {notice.content}
                                            </p>

                                            <hr className="my-2" />

                                            <div className="d-flex justify-content-between align-items-center" style={{ fontSize: "11px" }}>
                                                <span className="text-muted">
                                                    <i className="fas fa-user mr-1"></i>
                                                    {getEmployeeName(notice.postedBy)}
                                                </span>
                                                <span className="text-muted">
                                                    <i className="fas fa-clock mr-1"></i>
                                                    {timeAgo(notice.createdAt)}
                                                </span>
                                            </div>

                                            {notice.expiresAt && (
                                                <div className="mt-1" style={{ fontSize: "11px" }}>
                                                    <span className={`text-${new Date(notice.expiresAt) < new Date() ? "danger" : "muted"}`}>
                                                        <i className="fas fa-hourglass-half mr-1"></i>
                                                        Expires: {formatDate(notice.expiresAt)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Upcoming Holidays Tab */}
            {activeTab === "holidays" && (
                <>
                    {holidays.length === 0 ? (
                        <div className="text-center p-5 text-muted">
                            <i className="fas fa-calendar-check fa-3x mb-3"></i>
                            <h5>No upcoming holidays</h5>
                        </div>
                    ) : (
                        <div className="row">
                            {holidays.map((holiday, index) => {
                                const daysUntil = getDaysUntil(holiday.startDate);
                                const isToday = daysUntil === "Today";
                                const isTomorrow = daysUntil === "Tomorrow";

                                return (
                                    <div className="col-md-6 col-lg-4 mb-3" key={holiday.id || index}>
                                        <div
                                            className="card shadow-sm h-100"
                                            style={{
                                                borderLeft: `4px solid ${isToday ? "#dc3545" : isTomorrow ? "#ffc107" : "#007bff"}`,
                                            }}
                                        >
                                            <div className="card-body">
                                                <div className="d-flex justify-content-between align-items-start">
                                                    <h5 className="card-title mb-1 font-weight-bold">
                                                        {holiday.name}
                                                    </h5>
                                                    <span
                                                        className={`badge badge-${isToday ? "danger" : isTomorrow ? "warning" : "info"} badge-pill`}
                                                    >
                                                        {daysUntil}
                                                    </span>
                                                </div>
                                                <p className="text-muted mb-1 mt-2">
                                                    <i className="fas fa-calendar-alt mr-2"></i>
                                                    {formatDate(holiday.startDate)}
                                                    {holiday.endDate &&
                                                        holiday.endDate !== holiday.startDate && (
                                                            <span> — {formatDate(holiday.endDate)}</span>
                                                        )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default EmployeeNotices;
