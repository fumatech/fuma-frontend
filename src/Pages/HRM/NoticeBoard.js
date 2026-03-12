import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

const BASE_URL = process.env.REACT_APP_BASE_URL || "http://localhost:5000/api/v1";

const CATEGORIES = ["Announcement", "Achievement", "Alert", "Event", "Policy", "General"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

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

const NoticeBoard = () => {
    const [notices, setNotices] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filterCategory, setFilterCategory] = useState("all");
    const [filterPriority, setFilterPriority] = useState("all");
    const [filterStatus, setFilterStatus] = useState("active"); // active, archived, all
    const [searchTerm, setSearchTerm] = useState("");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedNotice, setSelectedNotice] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    // Active tab
    const [activeTab, setActiveTab] = useState("board");

    // Form state
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        category: "Announcement",
        priority: "Medium",
        postedBy: "",
        sendTo: "all",
        pinned: false,
        expiresAt: "",
    });

    // Fetch data
    const fetchData = async () => {
        setLoading(true);
        try {
            const [noticesRes, empRes] = await Promise.all([
                axios.get(`${BASE_URL}/notice-board/getall`),
                axios.get(`${BASE_URL}/user/getall`),
            ]);
            setNotices(noticesRes.data || []);
            setEmployees(empRes.data || []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load notices");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // Helper: get employee name
    const getEmployeeName = (id) => {
        const emp = employees.find(e => e.id === id);
        return emp ? `${emp.firstname || ""} ${emp.lastname || ""}`.trim() || emp.email : "Unknown";
    };

    // Filtered notices
    const filteredNotices = useMemo(() => {
        return notices.filter(n => {
            if (filterCategory !== "all" && n.category !== filterCategory) return false;
            if (filterPriority !== "all" && n.priority !== filterPriority) return false;
            if (filterStatus === "active" && !n.active) return false;
            if (filterStatus === "archived" && n.active) return false;
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                if (!(n.title || "").toLowerCase().includes(term) &&
                    !(n.content || "").toLowerCase().includes(term)) return false;
            }
            return true;
        }).sort((a, b) => {
            // Pinned first, then by date
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
    }, [notices, filterCategory, filterPriority, filterStatus, searchTerm]);

    // Pagination
    const totalPages = Math.ceil(filteredNotices.length / itemsPerPage);
    const paginatedNotices = filteredNotices.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Stats
    const stats = useMemo(() => {
        const activeNotices = notices.filter(n => n.active);
        const pinnedCount = activeNotices.filter(n => n.pinned).length;
        const urgentCount = activeNotices.filter(n => n.priority === "Urgent" || n.priority === "High").length;
        const thisMonth = activeNotices.filter(n => {
            const d = new Date(n.createdAt);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length;
        const categoryBreakdown = CATEGORIES.map(cat => ({
            name: cat,
            count: activeNotices.filter(n => n.category === cat).length,
        }));
        return { total: activeNotices.length, pinned: pinnedCount, urgent: urgentCount, thisMonth, categoryBreakdown };
    }, [notices]);

    // Form handlers
    const resetForm = () => {
        setFormData({ title: "", content: "", category: "Announcement", priority: "Medium", postedBy: "", sendTo: "all", pinned: false, expiresAt: "" });
        setIsEditing(false);
        setSelectedNotice(null);
    };

    const handleSave = async () => {
        if (!formData.title || !formData.content) {
            toast.warning("Please fill in Title and Content");
            return;
        }
        try {
            // Auto-set postedBy from logged-in user
            const email = sessionStorage.getItem("userEmail");
            const loggedInUser = employees.find(e => e.email === email);
            const payload = {
                title: formData.title,
                content: formData.content,
                category: formData.category,
                priority: formData.priority,
                pinned: formData.pinned,
                postedBy: loggedInUser ? loggedInUser.id : null,
                targetEmployee: formData.sendTo === "all" ? null : Number(formData.sendTo),
                expiresAt: formData.expiresAt || null,
                active: true,
            };
            if (isEditing && selectedNotice) {
                await axios.put(`${BASE_URL}/notice-board/update/${selectedNotice.id}`, payload);
                toast.success("Notice updated successfully");
            } else {
                await axios.post(`${BASE_URL}/notice-board/add`, payload);
                toast.success("Notice posted successfully");
            }
            setShowCreateModal(false);
            resetForm();
            fetchData();
        } catch (err) {
            console.error(err);
            toast.error("Failed to save notice");
        }
    };

    const handleEdit = (notice) => {
        setFormData({
            title: notice.title || "",
            content: notice.content || "",
            category: notice.category || "Announcement",
            priority: notice.priority || "Medium",
            postedBy: notice.postedBy || "",
            sendTo: notice.targetEmployee ? String(notice.targetEmployee) : "all",
            pinned: notice.pinned || false,
            expiresAt: notice.expiresAt ? notice.expiresAt.substring(0, 16) : "",
        });
        setSelectedNotice(notice);
        setIsEditing(true);
        setShowCreateModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this notice?")) {
            try {
                await axios.delete(`${BASE_URL}/notice-board/delete/${id}`);
                toast.success("Notice deleted successfully");
                fetchData();
            } catch (err) {
                toast.error("Failed to delete notice");
            }
        }
    };

    const handleTogglePin = async (notice) => {
        try {
            await axios.put(`${BASE_URL}/notice-board/update/${notice.id}`, {
                ...notice,
                pinned: !notice.pinned,
            });
            toast.success(notice.pinned ? "Notice unpinned" : "Notice pinned");
            fetchData();
        } catch (err) {
            toast.error("Failed to update notice");
        }
    };

    const handleArchive = async (notice) => {
        try {
            await axios.put(`${BASE_URL}/notice-board/update/${notice.id}`, {
                ...notice,
                active: !notice.active,
            });
            toast.success(notice.active ? "Notice archived" : "Notice restored");
            fetchData();
        } catch (err) {
            toast.error("Failed to update notice");
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
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
        const months = Math.floor(days / 30);
        return `${months}mo ago`;
    };

    // Export PDF
    const exportPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text("Notice Board Report", 14, 15);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 22);

        const tableData = filteredNotices.map((n, i) => [
            i + 1,
            n.title,
            n.category,
            n.priority,
            getEmployeeName(n.postedBy),
            n.targetEmployee ? getEmployeeName(n.targetEmployee) : "All Employees",
            formatDate(n.createdAt),
            n.active ? "Active" : "Archived",
        ]);

        doc.autoTable({
            head: [["#", "Title", "Category", "Priority", "Posted By", "Sent To", "Date", "Status"]],
            body: tableData,
            startY: 28,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [52, 152, 219] },
        });

        doc.save("notice-board-report.pdf");
        toast.success("PDF exported successfully");
    };

    // Export Excel
    const exportExcel = () => {
        const data = filteredNotices.map((n, i) => ({
            "#": i + 1,
            Title: n.title,
            Content: n.content,
            Category: n.category,
            Priority: n.priority,
            "Posted By": getEmployeeName(n.postedBy),
            "Sent To": n.targetEmployee ? getEmployeeName(n.targetEmployee) : "All Employees",
            Pinned: n.pinned ? "Yes" : "No",
            Status: n.active ? "Active" : "Archived",
            "Created At": formatDateTime(n.createdAt),
            "Expires At": n.expiresAt ? formatDateTime(n.expiresAt) : "N/A",
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Notices");
        XLSX.writeFile(wb, "notice-board-report.xlsx");
        toast.success("Excel exported successfully");
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="sr-only">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid p-3">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="mb-0">
                    <i className="fas fa-clipboard-list mr-2" style={{ color: "#3498db" }}></i>
                    Notice Board & Announcements
                </h4>
                <div>
                    <button className="btn btn-outline-danger btn-sm mr-2" onClick={exportPDF}>
                        <i className="fas fa-file-pdf mr-1"></i> Export PDF
                    </button>
                    <button className="btn btn-outline-success btn-sm mr-2" onClick={exportExcel}>
                        <i className="fas fa-file-excel mr-1"></i> Export Excel
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => { resetForm(); setShowCreateModal(true); }}>
                        <i className="fas fa-plus mr-1"></i> Post Notice
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <ul className="nav nav-tabs mb-3">
                {[
                    { key: "board", label: "Notice Board", icon: "fas fa-th-large" },
                    { key: "list", label: "All Notices", icon: "fas fa-list" },
                ].map(tab => (
                    <li className="nav-item" key={tab.key}>
                        <button
                            className={`nav-link ${activeTab === tab.key ? "active" : ""}`}
                            onClick={() => { setActiveTab(tab.key); setCurrentPage(1); }}
                            style={{ border: "none", background: "none", cursor: "pointer" }}
                        >
                            <i className={`${tab.icon} mr-1`}></i> {tab.label}
                        </button>
                    </li>
                ))}
            </ul>

            {/* Stats Cards */}
            <div className="row mb-3">
                {[
                    { label: "Total Active", value: stats.total, color: "#3498db", icon: "fas fa-clipboard-list" },
                    { label: "Pinned", value: stats.pinned, color: "#f39c12", icon: "fas fa-thumbtack" },
                    { label: "Urgent / High", value: stats.urgent, color: "#e74c3c", icon: "fas fa-exclamation-circle" },
                    { label: "This Month", value: stats.thisMonth, color: "#2ecc71", icon: "fas fa-calendar-check" },
                ].map((s, i) => (
                    <div className="col-md-3 col-sm-6 mb-2" key={i}>
                        <div className="card" style={{ borderLeft: `4px solid ${s.color}` }}>
                            <div className="card-body p-3 d-flex align-items-center justify-content-between">
                                <div>
                                    <div className="text-muted small">{s.label}</div>
                                    <h4 className="mb-0 font-weight-bold">{s.value}</h4>
                                </div>
                                <i className={s.icon} style={{ fontSize: "24px", color: s.color, opacity: 0.5 }}></i>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="card mb-3">
                <div className="card-body p-2">
                    <div className="row align-items-center">
                        <div className="col-md-3 mb-2">
                            <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Search notices..."
                                value={searchTerm}
                                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                        <div className="col-md-2 mb-2">
                            <select className="form-control form-control-sm" value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setCurrentPage(1); }}>
                                <option value="all">All Categories</option>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="col-md-2 mb-2">
                            <select className="form-control form-control-sm" value={filterPriority} onChange={e => { setFilterPriority(e.target.value); setCurrentPage(1); }}>
                                <option value="all">All Priorities</option>
                                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div className="col-md-2 mb-2">
                            <select className="form-control form-control-sm" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}>
                                <option value="active">Active</option>
                                <option value="archived">Archived</option>
                                <option value="all">All</option>
                            </select>
                        </div>
                        <div className="col-md-3 mb-2 text-right">
                            <small className="text-muted">{filteredNotices.length} notice(s) found</small>
                        </div>
                    </div>
                </div>
            </div>

            {/* Board View */}
            {activeTab === "board" && (
                <div className="row">
                    {paginatedNotices.length === 0 ? (
                        <div className="col-12 text-center py-5">
                            <i className="fas fa-clipboard fa-3x text-muted mb-3 d-block"></i>
                            <p className="text-muted">No notices found. Post the first one!</p>
                        </div>
                    ) : (
                        paginatedNotices.map(notice => (
                            <div className="col-md-6 col-lg-4 mb-3" key={notice.id}>
                                <div
                                    className="card h-100"
                                    style={{
                                        borderTop: `3px solid ${CATEGORY_COLORS[notice.category] || "#95a5a6"}`,
                                        opacity: notice.active ? 1 : 0.6,
                                    }}
                                >
                                    <div className="card-body p-3">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <div className="d-flex align-items-center">
                                                <i
                                                    className={`${CATEGORY_ICONS[notice.category] || "fas fa-info-circle"} mr-2`}
                                                    style={{ color: CATEGORY_COLORS[notice.category] || "#95a5a6" }}
                                                ></i>
                                                <span
                                                    className="badge"
                                                    style={{
                                                        backgroundColor: CATEGORY_COLORS[notice.category] || "#95a5a6",
                                                        color: "#fff",
                                                        fontSize: "11px",
                                                    }}
                                                >
                                                    {notice.category}
                                                </span>
                                            </div>
                                            <div className="d-flex align-items-center">
                                                {notice.pinned && (
                                                    <i className="fas fa-thumbtack text-warning mr-2" title="Pinned"></i>
                                                )}
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
                                        </div>

                                        <h6 className="card-title font-weight-bold mb-1" style={{ fontSize: "14px" }}>
                                            {notice.title}
                                        </h6>

                                        <p className="text-muted mb-2" style={{ fontSize: "12px", maxHeight: "60px", overflow: "hidden" }}>
                                            {notice.content}
                                        </p>

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
                                        <div className="mt-1" style={{ fontSize: "11px" }}>
                                            <span className={notice.targetEmployee ? "text-info" : "text-success"}>
                                                <i className={`fas ${notice.targetEmployee ? "fa-user" : "fa-users"} mr-1`}></i>
                                                {notice.targetEmployee ? getEmployeeName(notice.targetEmployee) : "All Employees"}
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

                                    <div className="card-footer bg-white p-2 d-flex justify-content-end" style={{ borderTop: "1px solid #eee" }}>
                                        <button
                                            className="btn btn-sm btn-outline-info mr-1"
                                            title="View"
                                            onClick={() => { setSelectedNotice(notice); setShowViewModal(true); }}
                                        >
                                            <i className="fas fa-eye"></i>
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline-warning mr-1"
                                            title={notice.pinned ? "Unpin" : "Pin"}
                                            onClick={() => handleTogglePin(notice)}
                                        >
                                            <i className="fas fa-thumbtack"></i>
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline-primary mr-1"
                                            title="Edit"
                                            onClick={() => handleEdit(notice)}
                                        >
                                            <i className="fas fa-edit"></i>
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline-secondary mr-1"
                                            title={notice.active ? "Archive" : "Restore"}
                                            onClick={() => handleArchive(notice)}
                                        >
                                            <i className={`fas fa-${notice.active ? "archive" : "undo"}`}></i>
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline-danger"
                                            title="Delete"
                                            onClick={() => handleDelete(notice.id)}
                                        >
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* List View */}
            {activeTab === "list" && (
                <div className="card">
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover table-striped mb-0" style={{ fontSize: "13px" }}>
                                <thead className="thead-light">
                                    <tr>
                                        <th>#</th>
                                        <th>Title</th>
                                        <th>Category</th>
                                        <th>Priority</th>
                                        <th>Posted By</th>
                                        <th>Sent To</th>
                                        <th>Date</th>
                                        <th>Pinned</th>
                                        <th>Status</th>
                                        <th style={{ width: "150px" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedNotices.length === 0 ? (
                                        <tr>
                                            <td colSpan="10" className="text-center py-4 text-muted">No notices found</td>
                                        </tr>
                                    ) : (
                                        paginatedNotices.map((notice, idx) => (
                                            <tr key={notice.id} style={{ opacity: notice.active ? 1 : 0.6 }}>
                                                <td>{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                                                <td className="font-weight-bold">{notice.title}</td>
                                                <td>
                                                    <span className="badge" style={{ backgroundColor: CATEGORY_COLORS[notice.category] || "#95a5a6", color: "#fff" }}>
                                                        {notice.category}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="badge" style={{ backgroundColor: PRIORITY_COLORS[notice.priority] || "#95a5a6", color: "#fff" }}>
                                                        {notice.priority}
                                                    </span>
                                                </td>
                                                <td>{getEmployeeName(notice.postedBy)}</td>
                                                <td>
                                                    <span className={notice.targetEmployee ? "text-info" : "text-success"}>
                                                        <i className={`fas ${notice.targetEmployee ? "fa-user" : "fa-users"} mr-1`}></i>
                                                        {notice.targetEmployee ? getEmployeeName(notice.targetEmployee) : "All"}
                                                    </span>
                                                </td>
                                                <td>{formatDate(notice.createdAt)}</td>
                                                <td>
                                                    {notice.pinned ? (
                                                        <i className="fas fa-thumbtack text-warning"></i>
                                                    ) : (
                                                        <span className="text-muted">-</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className={`badge badge-${notice.active ? "success" : "secondary"}`}>
                                                        {notice.active ? "Active" : "Archived"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button className="btn btn-sm btn-outline-info mr-1" onClick={() => { setSelectedNotice(notice); setShowViewModal(true); }}>
                                                        <i className="fas fa-eye"></i>
                                                    </button>
                                                    <button className="btn btn-sm btn-outline-warning mr-1" onClick={() => handleTogglePin(notice)}>
                                                        <i className="fas fa-thumbtack"></i>
                                                    </button>
                                                    <button className="btn btn-sm btn-outline-primary mr-1" onClick={() => handleEdit(notice)}>
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(notice.id)}>
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                    <small className="text-muted">
                        Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredNotices.length)} of {filteredNotices.length}
                    </small>
                    <ul className="pagination pagination-sm mb-0">
                        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                            <button className="page-link" onClick={() => setCurrentPage(1)}>&laquo;</button>
                        </li>
                        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                            <button className="page-link" onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>&lsaquo;</button>
                        </li>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let page;
                            if (totalPages <= 5) {
                                page = i + 1;
                            } else if (currentPage <= 3) {
                                page = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                page = totalPages - 4 + i;
                            } else {
                                page = currentPage - 2 + i;
                            }
                            return (
                                <li className={`page-item ${currentPage === page ? "active" : ""}`} key={page}>
                                    <button className="page-link" onClick={() => setCurrentPage(page)}>{page}</button>
                                </li>
                            );
                        })}
                        <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                            <button className="page-link" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>&rsaquo;</button>
                        </li>
                        <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                            <button className="page-link" onClick={() => setCurrentPage(totalPages)}>&raquo;</button>
                        </li>
                    </ul>
                </div>
            )}

            {/* Create / Edit Modal */}
            {showCreateModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header" style={{ backgroundColor: "#3498db", color: "#fff" }}>
                                <h5 className="modal-title">
                                    <i className={`fas fa-${isEditing ? "edit" : "plus-circle"} mr-2`}></i>
                                    {isEditing ? "Edit Notice" : "Post New Notice"}
                                </h5>
                                <button className="close text-white" onClick={() => { setShowCreateModal(false); resetForm(); }}>
                                    <span>&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="row">
                                    <div className="col-md-8 mb-3">
                                        <label className="font-weight-bold">Title <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Notice title"
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-md-4 mb-3">
                                        <label className="font-weight-bold">Send To <span className="text-danger">*</span></label>
                                        <select
                                            className="form-control"
                                            value={formData.sendTo}
                                            onChange={e => setFormData({ ...formData, sendTo: e.target.value })}
                                        >
                                            <option value="all">All Employees</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-md-4 mb-3">
                                        <label className="font-weight-bold">Category</label>
                                        <select
                                            className="form-control"
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-md-4 mb-3">
                                        <label className="font-weight-bold">Priority</label>
                                        <select
                                            className="form-control"
                                            value={formData.priority}
                                            onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                        >
                                            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-md-4 mb-3">
                                        <label className="font-weight-bold">Expires At</label>
                                        <input
                                            type="datetime-local"
                                            className="form-control"
                                            value={formData.expiresAt}
                                            onChange={e => setFormData({ ...formData, expiresAt: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="font-weight-bold">Content <span className="text-danger">*</span></label>
                                    <textarea
                                        className="form-control"
                                        rows="5"
                                        placeholder="Write your notice content here..."
                                        value={formData.content}
                                        onChange={e => setFormData({ ...formData, content: e.target.value })}
                                    ></textarea>
                                </div>
                                <div className="form-check">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        id="pinnedCheck"
                                        checked={formData.pinned}
                                        onChange={e => setFormData({ ...formData, pinned: e.target.checked })}
                                    />
                                    <label className="form-check-label" htmlFor="pinnedCheck">
                                        <i className="fas fa-thumbtack mr-1 text-warning"></i> Pin this notice (stays at the top)
                                    </label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => { setShowCreateModal(false); resetForm(); }}>
                                    Cancel
                                </button>
                                <button className="btn btn-primary" onClick={handleSave}>
                                    <i className={`fas fa-${isEditing ? "save" : "paper-plane"} mr-1`}></i>
                                    {isEditing ? "Update Notice" : "Post Notice"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View Modal */}
            {showViewModal && selectedNotice && (
                <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header" style={{ backgroundColor: CATEGORY_COLORS[selectedNotice.category] || "#3498db", color: "#fff" }}>
                                <h5 className="modal-title">
                                    <i className={`${CATEGORY_ICONS[selectedNotice.category] || "fas fa-info-circle"} mr-2`}></i>
                                    {selectedNotice.title}
                                </h5>
                                <button className="close text-white" onClick={() => { setShowViewModal(false); setSelectedNotice(null); }}>
                                    <span>&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="row mb-3">
                                    <div className="col-md-3">
                                        <small className="text-muted d-block">Category</small>
                                        <span className="badge" style={{ backgroundColor: CATEGORY_COLORS[selectedNotice.category] || "#95a5a6", color: "#fff" }}>
                                            {selectedNotice.category}
                                        </span>
                                    </div>
                                    <div className="col-md-3">
                                        <small className="text-muted d-block">Priority</small>
                                        <span className="badge" style={{ backgroundColor: PRIORITY_COLORS[selectedNotice.priority] || "#95a5a6", color: "#fff" }}>
                                            {selectedNotice.priority}
                                        </span>
                                    </div>
                                    <div className="col-md-3">
                                        <small className="text-muted d-block">Posted By</small>
                                        <strong>{getEmployeeName(selectedNotice.postedBy)}</strong>
                                    </div>
                                    <div className="col-md-3">
                                        <small className="text-muted d-block">Sent To</small>
                                        <strong className={selectedNotice.targetEmployee ? "text-info" : "text-success"}>
                                            <i className={`fas ${selectedNotice.targetEmployee ? "fa-user" : "fa-users"} mr-1`}></i>
                                            {selectedNotice.targetEmployee ? getEmployeeName(selectedNotice.targetEmployee) : "All Employees"}
                                        </strong>
                                    </div>
                                </div>
                                <div className="row mt-2 mb-3">
                                    <div className="col-md-3">
                                        <small className="text-muted d-block">Posted On</small>
                                        <strong>{formatDateTime(selectedNotice.createdAt)}</strong>
                                    </div>
                                </div>
                                <hr />
                                <div style={{ whiteSpace: "pre-wrap", fontSize: "14px", lineHeight: "1.6" }}>
                                    {selectedNotice.content}
                                </div>
                                <hr />
                                <div className="row">
                                    <div className="col-md-4">
                                        <small className="text-muted d-block">Status</small>
                                        <span className={`badge badge-${selectedNotice.active ? "success" : "secondary"}`}>
                                            {selectedNotice.active ? "Active" : "Archived"}
                                        </span>
                                        {selectedNotice.pinned && (
                                            <span className="badge badge-warning ml-1">
                                                <i className="fas fa-thumbtack mr-1"></i>Pinned
                                            </span>
                                        )}
                                    </div>
                                    <div className="col-md-4">
                                        <small className="text-muted d-block">Expires At</small>
                                        <strong>{selectedNotice.expiresAt ? formatDateTime(selectedNotice.expiresAt) : "No Expiry"}</strong>
                                    </div>
                                    <div className="col-md-4">
                                        <small className="text-muted d-block">Last Updated</small>
                                        <strong>{formatDateTime(selectedNotice.updatedAt)}</strong>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-primary btn-sm" onClick={() => { setShowViewModal(false); handleEdit(selectedNotice); }}>
                                    <i className="fas fa-edit mr-1"></i> Edit
                                </button>
                                <button className="btn btn-secondary btn-sm" onClick={() => { setShowViewModal(false); setSelectedNotice(null); }}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NoticeBoard;
