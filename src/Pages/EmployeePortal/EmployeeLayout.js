import React, { useState, useEffect, useRef } from "react";
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faTachometerAlt,
    faFaceSmile,
    faCalendarCheck,
    faCalendarMinus,
    faFileInvoiceDollar,
    faBullhorn,
    faSignOutAlt,
    faUser,
    faBars,
    faBell,
} from "@fortawesome/free-solid-svg-icons";
import EmployeeDashboard from "./EmployeeDashboard";
import EmployeeFaceAttendance from "./EmployeeFaceAttendance";
import EmployeeMyAttendance from "./EmployeeMyAttendance";
import EmployeeMyLeave from "./EmployeeMyLeave";
import EmployeeMyPayslips from "./EmployeeMyPayslips";
import EmployeeViewPayslip from "./EmployeeViewPayslip";
import EmployeeNotices from "./EmployeeNotices";

const menuItems = [
    { path: "/employee/dashboard", label: "Dashboard", icon: faTachometerAlt },
    { path: "/employee/face-attendance", label: "Face Attendance", icon: faFaceSmile },
    { path: "/employee/my-attendance", label: "My Attendance", icon: faCalendarCheck },
    { path: "/employee/my-leave", label: "My Leave", icon: faCalendarMinus },
    { path: "/employee/my-payslips", label: "My Payslips", icon: faFileInvoiceDollar },
    { path: "/employee/notices", label: "Notices", icon: faBullhorn },
];

const EmployeeLayout = () => {
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const notifRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();
    const BASE_URL = process.env.REACT_APP_BASE_URL;

    useEffect(() => {
        const fetchEmployee = async () => {
            const email = sessionStorage.getItem("employeeEmail");
            if (!email) {
                navigate("/employee/login");
                return;
            }
            try {
                const res = await axios.get(
                    `${process.env.REACT_APP_BASE_URL}/user/email/${email}`
                );
                if (res.data) {
                    setEmployee(res.data);
                } else {
                    navigate("/employee/login");
                }
            } catch (error) {
                console.error("Error fetching employee data:", error);
                navigate("/employee/login");
            }
            setLoading(false);
        };
        fetchEmployee();
    }, [navigate]);

    useEffect(() => {
        if (employee?.id) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 60000); // poll every 60s
            return () => clearInterval(interval);
        }
    }, [employee]);

    // Close notification dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const [unreadRes, countRes] = await Promise.all([
                axios.get(`${BASE_URL}/task-notification/unread/${employee.id}`),
                axios.get(`${BASE_URL}/task-notification/unread-count/${employee.id}`),
            ]);
            setNotifications(unreadRes.data);
            setUnreadCount(countRes.data);
        } catch (err) {
            console.error("Error fetching notifications:", err);
        }
    };

    const markAsRead = async (id) => {
        try {
            await axios.put(`${BASE_URL}/task-notification/mark-read/${id}`);
            fetchNotifications();
        } catch (err) {
            console.error("Error marking notification as read:", err);
        }
    };

    const markAllRead = async () => {
        try {
            await axios.put(`${BASE_URL}/task-notification/mark-all-read/${employee.id}`);
            fetchNotifications();
        } catch (err) {
            console.error("Error marking all notifications read:", err);
        }
    };

    const handleLogout = async () => {
        try {
            await axios.post(
                `${process.env.REACT_APP_BASE_URL}/user/logout`,
                {},
                { withCredentials: true }
            );
        } catch (e) {
            // ignore logout errors
        }
        sessionStorage.removeItem("employeeEmail");
        toast.success("Logged out successfully");
        navigate("/");
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="sr-only">Loading...</span>
                </div>
            </div>
        );
    }

    if (!employee) return null;

    return (
        <div className="d-flex" style={{ minHeight: "100vh" }}>
            {/* Sidebar */}
            <aside
                className="d-flex flex-column text-white"
                style={{
                    width: sidebarOpen ? "260px" : "70px",
                    minHeight: "100vh",
                    background: "#003cb3",
                    transition: "width 0.3s ease",
                    position: "fixed",
                    top: 0,
                    left: 0,
                    zIndex: 1000,
                    overflowX: "hidden",
                }}
            >
                {/* Brand */}
                <div
                    className="d-flex align-items-center px-3"
                    style={{ height: "60px", borderBottom: "1px solid rgba(255,255,255,0.15)" }}
                >
                    {sidebarOpen && (
                        <span className="font-weight-bold" style={{ fontSize: "1.1rem" }}>
                            Employee Portal
                        </span>
                    )}
                    <button
                        className="btn btn-sm text-white ml-auto"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        style={{ background: "transparent", border: "none" }}
                    >
                        <FontAwesomeIcon icon={faBars} />
                    </button>
                </div>

                {/* User Info */}
                {sidebarOpen && (
                    <div className="px-3 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
                        <div className="d-flex align-items-center">
                            <div
                                className="rounded-circle d-flex align-items-center justify-content-center mr-2"
                                style={{ width: "40px", height: "40px", background: "rgba(255,255,255,0.2)" }}
                            >
                                <FontAwesomeIcon icon={faUser} />
                            </div>
                            <div>
                                <div className="font-weight-bold" style={{ fontSize: "0.9rem" }}>
                                    {employee.firstname} {employee.lastname}
                                </div>
                                <small style={{ opacity: 0.8 }}>{employee.email}</small>
                            </div>
                        </div>
                    </div>
                )}

                {/* Menu Items */}
                <nav className="flex-grow-1 py-2">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className="d-flex align-items-center px-3 py-2 text-white text-decoration-none"
                                style={{
                                    background: isActive ? "rgba(255,255,255,0.15)" : "transparent",
                                    borderLeft: isActive ? "3px solid #fff" : "3px solid transparent",
                                    transition: "all 0.2s ease",
                                    fontSize: "0.95rem",
                                }}
                            >
                                <FontAwesomeIcon
                                    icon={item.icon}
                                    style={{ width: "20px", minWidth: "20px", textAlign: "center" }}
                                />
                                {sidebarOpen && <span className="ml-3">{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div className="px-3 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }}>
                    <button
                        className="btn btn-outline-light btn-sm w-100 d-flex align-items-center justify-content-center"
                        onClick={handleLogout}
                    >
                        <FontAwesomeIcon icon={faSignOutAlt} />
                        {sidebarOpen && <span className="ml-2">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main
                className="flex-grow-1"
                style={{
                    marginLeft: sidebarOpen ? "260px" : "70px",
                    transition: "margin-left 0.3s ease",
                    background: "#f4f6f9",
                    minHeight: "100vh",
                }}
            >
                {/* Top Header */}
                <header
                    className="d-flex align-items-center px-4 bg-white shadow-sm"
                    style={{ height: "60px", position: "sticky", top: 0, zIndex: 999, overflow: "visible" }}
                >
                    <h5 className="m-0 text-dark">
                        {menuItems.find((m) => m.path === location.pathname)?.label || "Employee Portal"}
                    </h5>
                    <div className="ml-auto d-flex align-items-center">
                        {/* Notification Bell */}
                        <div className="position-relative mr-3" ref={notifRef}>
                            <button
                                className="btn btn-link text-dark position-relative p-0"
                                onClick={() => setShowNotifications(!showNotifications)}
                                style={{ fontSize: "1.2rem" }}
                            >
                                <FontAwesomeIcon icon={faBell} />
                                {unreadCount > 0 && (
                                    <span
                                        className="badge badge-danger position-absolute"
                                        style={{
                                            top: "-8px",
                                            right: "-10px",
                                            fontSize: "0.65rem",
                                            borderRadius: "50%",
                                            minWidth: "18px",
                                            height: "18px",
                                            lineHeight: "18px",
                                            padding: "0 4px",
                                        }}
                                    >
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {showNotifications && (
                                <div
                                    className="card shadow-lg"
                                    style={{
                                        position: "absolute",
                                        right: "-10px",
                                        top: "calc(100% + 8px)",
                                        width: "360px",
                                        maxHeight: "420px",
                                        overflowY: "auto",
                                        zIndex: 9999,
                                        border: "1px solid rgba(0,0,0,0.15)",
                                        borderRadius: "8px",
                                    }}
                                >
                                    <div className="card-header d-flex justify-content-between align-items-center py-2"
                                        style={{ background: "#f8f9fa", borderBottom: "1px solid #dee2e6" }}>
                                        <strong>
                                            <FontAwesomeIcon icon={faBell} className="mr-2" />
                                            Notifications
                                        </strong>
                                        {unreadCount > 0 && (
                                            <button
                                                className="btn btn-sm btn-outline-primary"
                                                style={{ fontSize: "0.75rem" }}
                                                onClick={markAllRead}
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                    </div>
                                    <div className="list-group list-group-flush">
                                        {notifications.length === 0 ? (
                                            <div className="text-center text-muted py-4">
                                                <FontAwesomeIcon icon={faBell} size="2x" className="mb-2 d-block mx-auto" style={{ opacity: 0.3 }} />
                                                No new notifications
                                            </div>
                                        ) : (
                                            notifications.map((n) => (
                                                <div
                                                    key={n.id}
                                                    className="list-group-item list-group-item-action py-2 px-3"
                                                    style={{ cursor: "pointer", fontSize: "0.85rem", borderLeft: `3px solid ${n.type === "TASK_OVERDUE" ? "#dc3545" : n.type === "TASK_DUE_SOON" ? "#ffc107" : "#17a2b8"}` }}
                                                    onClick={() => markAsRead(n.id)}
                                                >
                                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                                        <span
                                                            className={`badge ${n.type === "TASK_OVERDUE"
                                                                ? "badge-danger"
                                                                : n.type === "TASK_DUE_SOON"
                                                                    ? "badge-warning"
                                                                    : n.type === "TASK_ASSIGNED"
                                                                        ? "badge-info"
                                                                        : "badge-secondary"
                                                                }`}
                                                        >
                                                            {n.type?.replace(/_/g, " ")}
                                                        </span>
                                                        <small className="text-muted">
                                                            {n.createdAt ? new Date(n.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                                                        </small>
                                                    </div>
                                                    <div className="text-dark">{n.message}</div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <span className="text-muted mr-3">
                            Welcome, {employee.firstname}
                        </span>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-4">
                    <Routes>
                        <Route path="dashboard" element={<EmployeeDashboard employee={employee} />} />
                        <Route path="face-attendance" element={<EmployeeFaceAttendance employee={employee} />} />
                        <Route path="my-attendance" element={<EmployeeMyAttendance employee={employee} />} />
                        <Route path="my-leave" element={<EmployeeMyLeave employee={employee} />} />
                        <Route path="my-payslips" element={<EmployeeMyPayslips employee={employee} />} />
                        <Route path="view-payslip" element={<EmployeeViewPayslip employee={employee} />} />
                        <Route path="notices" element={<EmployeeNotices />} />
                        <Route path="*" element={<Navigate to="dashboard" replace />} />
                    </Routes>
                </div>

                {/* Footer */}
                <footer className="text-center py-3 text-muted" style={{ fontSize: "0.85rem" }}>
                    Copyright © 2024-{new Date().getFullYear()} <span className="text-primary">Fuma.co.in</span>. All rights reserved.
                </footer>
            </main>
        </div>
    );
};

export default EmployeeLayout;
