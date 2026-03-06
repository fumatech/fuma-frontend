import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
    PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

const BASE_URL = process.env.REACT_APP_BASE_URL || "http://localhost:5000/api/v1";

const CATEGORIES = ["Workplace", "Management", "Compensation", "Harassment", "Safety", "Policy", "Workload", "Other"];
const PRIORITIES = ["Low", "Medium", "High", "Critical"];
const STATUSES = ["Open", "In Review", "Escalated", "Resolved", "Closed"];
const FEEDBACK_TYPES = ["Grievance", "Feedback", "Suggestion"];

const STATUS_COLORS = {
    "Open": "#3498db",
    "In Review": "#f39c12",
    "Escalated": "#e74c3c",
    "Resolved": "#2ecc71",
    "Closed": "#95a5a6"
};

const PRIORITY_COLORS = {
    "Low": "#2ecc71",
    "Medium": "#f39c12",
    "High": "#e67e22",
    "Critical": "#e74c3c"
};

const CHART_COLORS = ["#3498db", "#2ecc71", "#e74c3c", "#f39c12", "#9b59b6", "#1abc9c", "#e67e22", "#95a5a6"];

const EmployeeGrievance = () => {
    const [grievances, setGrievances] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterCategory, setFilterCategory] = useState("all");
    const [filterPriority, setFilterPriority] = useState("all");
    const [filterType, setFilterType] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Modals
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showEscalateModal, setShowEscalateModal] = useState(false);
    const [showResolveModal, setShowResolveModal] = useState(false);
    const [selectedGrievance, setSelectedGrievance] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        employeeId: "",
        anonymous: false,
        category: "",
        priority: "Medium",
        subject: "",
        description: "",
        feedbackType: "Grievance",
    });

    // Escalation form
    const [escalationData, setEscalationData] = useState({
        escalatedTo: "",
        escalationNotes: "",
    });

    // Resolution form
    const [resolutionData, setResolutionData] = useState({
        resolution: "",
        status: "Resolved",
    });

    // Active tab
    const [activeTab, setActiveTab] = useState("overview");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [grievanceRes, employeeRes] = await Promise.all([
                axios.get(`${BASE_URL}/employee-grievance/getall`),
                axios.get(`${BASE_URL}/user/getall-names`),
            ]);
            setGrievances(grievanceRes.data || []);
            setEmployees(employeeRes.data || []);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load grievance data");
        } finally {
            setLoading(false);
        }
    };

    const getEmployeeName = (id) => {
        if (!id) return "Anonymous";
        const emp = employees.find(e => e.id === id);
        return emp ? `${emp.firstname || ""} ${emp.lastname || ""}`.trim() : `Employee #${id}`;
    };

    // Filtered grievances
    const filteredGrievances = useMemo(() => {
        return grievances.filter(g => {
            if (filterStatus !== "all" && g.status !== filterStatus) return false;
            if (filterCategory !== "all" && g.category !== filterCategory) return false;
            if (filterPriority !== "all" && g.priority !== filterPriority) return false;
            if (filterType !== "all" && g.feedbackType !== filterType) return false;
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const empName = getEmployeeName(g.employeeId).toLowerCase();
                return (
                    (g.subject && g.subject.toLowerCase().includes(term)) ||
                    (g.description && g.description.toLowerCase().includes(term)) ||
                    empName.includes(term) ||
                    (g.category && g.category.toLowerCase().includes(term))
                );
            }
            return true;
        });
    }, [grievances, filterStatus, filterCategory, filterPriority, filterType, searchTerm, employees]);

    // Pagination
    const totalPages = Math.ceil(filteredGrievances.length / itemsPerPage);
    const paginatedGrievances = filteredGrievances.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Summary stats
    const stats = useMemo(() => {
        const total = grievances.length;
        const open = grievances.filter(g => g.status === "Open").length;
        const inReview = grievances.filter(g => g.status === "In Review").length;
        const escalated = grievances.filter(g => g.status === "Escalated").length;
        const resolved = grievances.filter(g => g.status === "Resolved" || g.status === "Closed").length;
        const anonymous = grievances.filter(g => g.anonymous).length;
        const avgSatisfaction = grievances.filter(g => g.satisfactionRating > 0).length > 0
            ? (grievances.filter(g => g.satisfactionRating > 0).reduce((s, g) => s + g.satisfactionRating, 0) /
                grievances.filter(g => g.satisfactionRating > 0).length).toFixed(1)
            : "N/A";
        const critical = grievances.filter(g => g.priority === "Critical" && g.status !== "Resolved" && g.status !== "Closed").length;
        return { total, open, inReview, escalated, resolved, anonymous, avgSatisfaction, critical };
    }, [grievances]);

    // Chart data
    const statusChartData = useMemo(() => {
        return STATUSES.map(s => ({
            name: s,
            value: grievances.filter(g => g.status === s).length
        })).filter(d => d.value > 0);
    }, [grievances]);

    const categoryChartData = useMemo(() => {
        return CATEGORIES.map(c => ({
            name: c,
            count: grievances.filter(g => g.category === c).length
        })).filter(d => d.count > 0);
    }, [grievances]);

    const typeChartData = useMemo(() => {
        return FEEDBACK_TYPES.map(t => ({
            name: t,
            count: grievances.filter(g => g.feedbackType === t).length
        })).filter(d => d.count > 0);
    }, [grievances]);

    const monthlyTrendData = useMemo(() => {
        const months = {};
        grievances.forEach(g => {
            if (g.createdAt) {
                const d = new Date(g.createdAt);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                if (!months[key]) months[key] = { month: key, total: 0, resolved: 0 };
                months[key].total++;
                if (g.status === "Resolved" || g.status === "Closed") months[key].resolved++;
            }
        });
        return Object.values(months).sort((a, b) => a.month.localeCompare(b.month)).slice(-12);
    }, [grievances]);

    // Handlers
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.subject || !formData.description || !formData.category) {
            toast.error("Please fill in all required fields");
            return;
        }
        if (!formData.anonymous && !formData.employeeId) {
            toast.error("Please select an employee or choose anonymous submission");
            return;
        }

        try {
            const payload = {
                ...formData,
                employeeId: formData.anonymous ? null : Number(formData.employeeId),
            };

            if (isEditing && selectedGrievance) {
                await axios.put(`${BASE_URL}/employee-grievance/update/${selectedGrievance.id}`, {
                    ...selectedGrievance,
                    ...payload,
                });
                toast.success("Grievance updated successfully");
            } else {
                await axios.post(`${BASE_URL}/employee-grievance/add`, payload);
                toast.success("Grievance submitted successfully");
            }
            setShowSubmitModal(false);
            resetForm();
            fetchData();
        } catch (error) {
            console.error("Error submitting grievance:", error);
            toast.error("Failed to submit grievance");
        }
    };

    const handleEscalate = async () => {
        if (!escalationData.escalatedTo || !escalationData.escalationNotes) {
            toast.error("Please fill in all escalation fields");
            return;
        }
        try {
            await axios.put(`${BASE_URL}/employee-grievance/update/${selectedGrievance.id}`, {
                ...selectedGrievance,
                status: "Escalated",
                escalatedTo: Number(escalationData.escalatedTo),
                escalationNotes: escalationData.escalationNotes,
            });
            toast.success("Grievance escalated successfully");
            setShowEscalateModal(false);
            setEscalationData({ escalatedTo: "", escalationNotes: "" });
            fetchData();
        } catch (error) {
            toast.error("Failed to escalate grievance");
        }
    };

    const handleResolve = async () => {
        if (!resolutionData.resolution) {
            toast.error("Please provide resolution details");
            return;
        }
        try {
            await axios.put(`${BASE_URL}/employee-grievance/update/${selectedGrievance.id}`, {
                ...selectedGrievance,
                status: resolutionData.status,
                resolution: resolutionData.resolution,
            });
            toast.success("Grievance resolved successfully");
            setShowResolveModal(false);
            setResolutionData({ resolution: "", status: "Resolved" });
            fetchData();
        } catch (error) {
            toast.error("Failed to resolve grievance");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this grievance?")) return;
        try {
            await axios.delete(`${BASE_URL}/employee-grievance/delete/${id}`);
            toast.success("Grievance deleted successfully");
            fetchData();
        } catch (error) {
            toast.error("Failed to delete grievance");
        }
    };

    const handleStatusChange = async (grievance, newStatus) => {
        try {
            await axios.put(`${BASE_URL}/employee-grievance/update/${grievance.id}`, {
                ...grievance,
                status: newStatus,
            });
            toast.success(`Status updated to ${newStatus}`);
            fetchData();
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const resetForm = () => {
        setFormData({
            employeeId: "",
            anonymous: false,
            category: "",
            priority: "Medium",
            subject: "",
            description: "",
            feedbackType: "Grievance",
        });
        setIsEditing(false);
        setSelectedGrievance(null);
    };

    const openEditModal = (grievance) => {
        setFormData({
            employeeId: grievance.employeeId || "",
            anonymous: grievance.anonymous || false,
            category: grievance.category || "",
            priority: grievance.priority || "Medium",
            subject: grievance.subject || "",
            description: grievance.description || "",
            feedbackType: grievance.feedbackType || "Grievance",
        });
        setSelectedGrievance(grievance);
        setIsEditing(true);
        setShowSubmitModal(true);
    };

    // Export functions
    const exportPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text("Employee Grievance & Feedback Report", 14, 15);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 22);

        const tableData = filteredGrievances.map(g => [
            g.id,
            g.anonymous ? "Anonymous" : getEmployeeName(g.employeeId),
            g.feedbackType,
            g.category,
            g.subject,
            g.priority,
            g.status,
            g.createdAt ? new Date(g.createdAt).toLocaleDateString() : "",
        ]);

        doc.autoTable({
            head: [["ID", "Employee", "Type", "Category", "Subject", "Priority", "Status", "Date"]],
            body: tableData,
            startY: 28,
            styles: { fontSize: 7 },
            headStyles: { fillColor: [52, 152, 219] },
        });

        doc.save("grievance_report.pdf");
        toast.success("PDF exported successfully");
    };

    const exportExcel = () => {
        const data = filteredGrievances.map(g => ({
            ID: g.id,
            Employee: g.anonymous ? "Anonymous" : getEmployeeName(g.employeeId),
            Type: g.feedbackType,
            Category: g.category,
            Subject: g.subject,
            Priority: g.priority,
            Status: g.status,
            Description: g.description,
            Resolution: g.resolution || "",
            "Created Date": g.createdAt ? new Date(g.createdAt).toLocaleDateString() : "",
            "Resolved Date": g.resolvedAt ? new Date(g.resolvedAt).toLocaleDateString() : "",
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Grievances");
        XLSX.writeFile(wb, "grievance_report.xlsx");
        toast.success("Excel exported successfully");
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "2-digit", month: "short", year: "numeric"
        });
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
                    <i className="fas fa-comments-alt mr-2" style={{ color: "#3498db" }}></i>
                    Grievance & Feedback Portal
                </h4>
                <div>
                    <button className="btn btn-outline-danger btn-sm mr-2" onClick={exportPDF}>
                        <i className="fas fa-file-pdf mr-1"></i> Export PDF
                    </button>
                    <button className="btn btn-outline-success btn-sm mr-2" onClick={exportExcel}>
                        <i className="fas fa-file-excel mr-1"></i> Export Excel
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => { resetForm(); setShowSubmitModal(true); }}>
                        <i className="fas fa-plus mr-1"></i> Submit Feedback
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <ul className="nav nav-tabs mb-3">
                {[
                    { key: "overview", label: "Overview", icon: "fas fa-chart-pie" },
                    { key: "list", label: "All Submissions", icon: "fas fa-list" },
                    { key: "analytics", label: "Analytics", icon: "fas fa-chart-bar" },
                ].map(tab => (
                    <li className="nav-item" key={tab.key}>
                        <button
                            className={`nav-link ${activeTab === tab.key ? "active" : ""}`}
                            onClick={() => setActiveTab(tab.key)}
                            style={activeTab === tab.key ? { fontWeight: "bold", color: "#3498db" } : {}}
                        >
                            <i className={`${tab.icon} mr-1`}></i> {tab.label}
                        </button>
                    </li>
                ))}
            </ul>

            {/* Overview Tab */}
            {activeTab === "overview" && (
                <div>
                    {/* Summary Cards */}
                    <div className="row mb-3">
                        {[
                            { label: "Total Submissions", value: stats.total, color: "#3498db", icon: "fas fa-inbox" },
                            { label: "Open", value: stats.open, color: "#3498db", icon: "fas fa-folder-open" },
                            { label: "In Review", value: stats.inReview, color: "#f39c12", icon: "fas fa-search" },
                            { label: "Escalated", value: stats.escalated, color: "#e74c3c", icon: "fas fa-exclamation-triangle" },
                            { label: "Resolved/Closed", value: stats.resolved, color: "#2ecc71", icon: "fas fa-check-circle" },
                            { label: "Anonymous", value: stats.anonymous, color: "#9b59b6", icon: "fas fa-user-secret" },
                            { label: "Critical Pending", value: stats.critical, color: "#e74c3c", icon: "fas fa-fire" },
                            { label: "Avg Satisfaction", value: stats.avgSatisfaction, color: "#f39c12", icon: "fas fa-star" },
                        ].map((card, idx) => (
                            <div className="col-xl-3 col-md-4 col-sm-6 mb-3" key={idx}>
                                <div className="card shadow-sm h-100" style={{ borderLeft: `4px solid ${card.color}` }}>
                                    <div className="card-body p-3">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div>
                                                <p className="text-muted mb-1" style={{ fontSize: "0.8rem" }}>{card.label}</p>
                                                <h4 className="mb-0 font-weight-bold">{card.value}</h4>
                                            </div>
                                            <i className={card.icon} style={{ fontSize: "1.8rem", color: card.color, opacity: 0.7 }}></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Quick Charts Row */}
                    <div className="row mb-3">
                        <div className="col-md-4">
                            <div className="card shadow-sm">
                                <div className="card-header bg-white"><strong>By Status</strong></div>
                                <div className="card-body" style={{ height: 280 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={statusChartData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                                                {statusChartData.map((entry, i) => (
                                                    <Cell key={i} fill={STATUS_COLORS[entry.name] || CHART_COLORS[i % CHART_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card shadow-sm">
                                <div className="card-header bg-white"><strong>By Category</strong></div>
                                <div className="card-body" style={{ height: 280 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={categoryChartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                                            <YAxis allowDecimals={false} />
                                            <Tooltip />
                                            <Bar dataKey="count" fill="#3498db" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card shadow-sm">
                                <div className="card-header bg-white"><strong>By Type</strong></div>
                                <div className="card-body" style={{ height: 280 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={typeChartData} cx="50%" cy="50%" outerRadius={80} dataKey="count" label={({ name, count }) => `${name}: ${count}`}>
                                                {typeChartData.map((entry, i) => (
                                                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Critical */}
                    <div className="card shadow-sm">
                        <div className="card-header bg-white d-flex justify-content-between align-items-center">
                            <strong><i className="fas fa-fire text-danger mr-2"></i>Recent High Priority Items</strong>
                        </div>
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover table-sm mb-0">
                                    <thead className="thead-light">
                                        <tr>
                                            <th>ID</th><th>Type</th><th>Subject</th><th>Category</th><th>Priority</th><th>Status</th><th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {grievances
                                            .filter(g => (g.priority === "Critical" || g.priority === "High") && g.status !== "Resolved" && g.status !== "Closed")
                                            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                            .slice(0, 5)
                                            .map(g => (
                                                <tr key={g.id} style={{ cursor: "pointer" }} onClick={() => { setSelectedGrievance(g); setShowViewModal(true); }}>
                                                    <td>#{g.id}</td>
                                                    <td><span className="badge badge-info">{g.feedbackType}</span></td>
                                                    <td>{g.subject}</td>
                                                    <td>{g.category}</td>
                                                    <td><span className="badge" style={{ backgroundColor: PRIORITY_COLORS[g.priority], color: "#fff" }}>{g.priority}</span></td>
                                                    <td><span className="badge" style={{ backgroundColor: STATUS_COLORS[g.status], color: "#fff" }}>{g.status}</span></td>
                                                    <td>{formatDate(g.createdAt)}</td>
                                                </tr>
                                            ))}
                                        {grievances.filter(g => (g.priority === "Critical" || g.priority === "High") && g.status !== "Resolved" && g.status !== "Closed").length === 0 && (
                                            <tr><td colSpan="7" className="text-center text-muted py-3">No high priority items pending</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* List Tab */}
            {activeTab === "list" && (
                <div>
                    {/* Filters */}
                    <div className="card shadow-sm mb-3">
                        <div className="card-body py-2">
                            <div className="row align-items-end">
                                <div className="col-md-3 mb-2">
                                    <label className="small text-muted mb-1">Search</label>
                                    <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        placeholder="Search by subject, employee, category..."
                                        value={searchTerm}
                                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    />
                                </div>
                                <div className="col-md-2 mb-2">
                                    <label className="small text-muted mb-1">Status</label>
                                    <select className="form-control form-control-sm" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}>
                                        <option value="all">All Status</option>
                                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-2 mb-2">
                                    <label className="small text-muted mb-1">Category</label>
                                    <select className="form-control form-control-sm" value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}>
                                        <option value="all">All Categories</option>
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-2 mb-2">
                                    <label className="small text-muted mb-1">Priority</label>
                                    <select className="form-control form-control-sm" value={filterPriority} onChange={(e) => { setFilterPriority(e.target.value); setCurrentPage(1); }}>
                                        <option value="all">All Priorities</option>
                                        {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-2 mb-2">
                                    <label className="small text-muted mb-1">Type</label>
                                    <select className="form-control form-control-sm" value={filterType} onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}>
                                        <option value="all">All Types</option>
                                        {FEEDBACK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="col-md-1 mb-2">
                                    <button className="btn btn-outline-secondary btn-sm w-100" onClick={() => { setFilterStatus("all"); setFilterCategory("all"); setFilterPriority("all"); setFilterType("all"); setSearchTerm(""); setCurrentPage(1); }}>
                                        <i className="fas fa-redo"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="card shadow-sm">
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover table-sm mb-0">
                                    <thead className="thead-light">
                                        <tr>
                                            <th>#</th>
                                            <th>Employee</th>
                                            <th>Type</th>
                                            <th>Category</th>
                                            <th>Subject</th>
                                            <th>Priority</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedGrievances.map((g, idx) => (
                                            <tr key={g.id}>
                                                <td>{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                                                <td>
                                                    {g.anonymous ? (
                                                        <span className="text-muted"><i className="fas fa-user-secret mr-1"></i>Anonymous</span>
                                                    ) : (
                                                        getEmployeeName(g.employeeId)
                                                    )}
                                                </td>
                                                <td><span className="badge badge-info">{g.feedbackType}</span></td>
                                                <td>{g.category}</td>
                                                <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.subject}</td>
                                                <td>
                                                    <span className="badge" style={{ backgroundColor: PRIORITY_COLORS[g.priority], color: "#fff" }}>
                                                        {g.priority}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="badge" style={{ backgroundColor: STATUS_COLORS[g.status], color: "#fff" }}>
                                                        {g.status}
                                                    </span>
                                                </td>
                                                <td style={{ whiteSpace: "nowrap" }}>{formatDate(g.createdAt)}</td>
                                                <td>
                                                    <div className="btn-group btn-group-sm">
                                                        <button className="btn btn-outline-info btn-sm" title="View" onClick={() => { setSelectedGrievance(g); setShowViewModal(true); }}>
                                                            <i className="fas fa-eye"></i>
                                                        </button>
                                                        <button className="btn btn-outline-primary btn-sm" title="Edit" onClick={() => openEditModal(g)}>
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                        {g.status !== "Escalated" && g.status !== "Resolved" && g.status !== "Closed" && (
                                                            <button className="btn btn-outline-warning btn-sm" title="Escalate" onClick={() => { setSelectedGrievance(g); setShowEscalateModal(true); }}>
                                                                <i className="fas fa-level-up-alt"></i>
                                                            </button>
                                                        )}
                                                        {g.status !== "Resolved" && g.status !== "Closed" && (
                                                            <button className="btn btn-outline-success btn-sm" title="Resolve" onClick={() => { setSelectedGrievance(g); setShowResolveModal(true); }}>
                                                                <i className="fas fa-check"></i>
                                                            </button>
                                                        )}
                                                        <button className="btn btn-outline-danger btn-sm" title="Delete" onClick={() => handleDelete(g.id)}>
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {paginatedGrievances.length === 0 && (
                                            <tr><td colSpan="9" className="text-center text-muted py-4">
                                                <i className="fas fa-inbox fa-2x mb-2 d-block"></i>No grievances found
                                            </td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="card-footer bg-white d-flex justify-content-between align-items-center py-2">
                                <small className="text-muted">
                                    Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredGrievances.length)} of {filteredGrievances.length}
                                </small>
                                <nav>
                                    <ul className="pagination pagination-sm mb-0">
                                        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                                            <button className="page-link" onClick={() => setCurrentPage(1)}>&laquo;</button>
                                        </li>
                                        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                                            <button className="page-link" onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>&lsaquo;</button>
                                        </li>
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let page;
                                            if (totalPages <= 5) page = i + 1;
                                            else if (currentPage <= 3) page = i + 1;
                                            else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                                            else page = currentPage - 2 + i;
                                            return (
                                                <li key={page} className={`page-item ${currentPage === page ? "active" : ""}`}>
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
                                </nav>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Analytics Tab */}
            {activeTab === "analytics" && (
                <div>
                    <div className="row mb-3">
                        <div className="col-md-8">
                            <div className="card shadow-sm">
                                <div className="card-header bg-white"><strong>Monthly Trend (Submitted vs Resolved)</strong></div>
                                <div className="card-body" style={{ height: 320 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={monthlyTrendData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                            <YAxis allowDecimals={false} />
                                            <Tooltip />
                                            <Legend />
                                            <Line type="monotone" dataKey="total" stroke="#3498db" name="Submitted" strokeWidth={2} dot={{ r: 4 }} />
                                            <Line type="monotone" dataKey="resolved" stroke="#2ecc71" name="Resolved" strokeWidth={2} dot={{ r: 4 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card shadow-sm">
                                <div className="card-header bg-white"><strong>Priority Distribution</strong></div>
                                <div className="card-body" style={{ height: 320 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={PRIORITIES.map(p => ({ name: p, value: grievances.filter(g => g.priority === p).length })).filter(d => d.value > 0)}
                                                cx="50%" cy="50%" outerRadius={80} dataKey="value"
                                                label={({ name, value }) => `${name}: ${value}`}
                                            >
                                                {PRIORITIES.map((p, i) => (
                                                    <Cell key={i} fill={PRIORITY_COLORS[p]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6">
                            <div className="card shadow-sm">
                                <div className="card-header bg-white"><strong>Category Breakdown</strong></div>
                                <div className="card-body" style={{ height: 300 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={categoryChartData} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" allowDecimals={false} />
                                            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                                            <Tooltip />
                                            <Bar dataKey="count" fill="#9b59b6" radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="card shadow-sm">
                                <div className="card-header bg-white"><strong>Resolution Rate & Transparency</strong></div>
                                <div className="card-body">
                                    <div className="row text-center">
                                        <div className="col-6 mb-3">
                                            <h5 className="text-muted">Resolution Rate</h5>
                                            <h2 className="font-weight-bold" style={{ color: "#2ecc71" }}>
                                                {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%
                                            </h2>
                                            <div className="progress" style={{ height: 8 }}>
                                                <div className="progress-bar bg-success" style={{ width: `${stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0}%` }}></div>
                                            </div>
                                        </div>
                                        <div className="col-6 mb-3">
                                            <h5 className="text-muted">Anonymous Rate</h5>
                                            <h2 className="font-weight-bold" style={{ color: "#9b59b6" }}>
                                                {stats.total > 0 ? Math.round((stats.anonymous / stats.total) * 100) : 0}%
                                            </h2>
                                            <div className="progress" style={{ height: 8 }}>
                                                <div className="progress-bar" style={{ width: `${stats.total > 0 ? (stats.anonymous / stats.total) * 100 : 0}%`, backgroundColor: "#9b59b6" }}></div>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <h5 className="text-muted">Escalation Rate</h5>
                                            <h2 className="font-weight-bold" style={{ color: "#e74c3c" }}>
                                                {stats.total > 0 ? Math.round((stats.escalated / stats.total) * 100) : 0}%
                                            </h2>
                                            <div className="progress" style={{ height: 8 }}>
                                                <div className="progress-bar bg-danger" style={{ width: `${stats.total > 0 ? (stats.escalated / stats.total) * 100 : 0}%` }}></div>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <h5 className="text-muted">Avg Satisfaction</h5>
                                            <h2 className="font-weight-bold" style={{ color: "#f39c12" }}>
                                                {stats.avgSatisfaction !== "N/A" ? `${stats.avgSatisfaction}/5` : "N/A"}
                                            </h2>
                                            <div className="progress" style={{ height: 8 }}>
                                                <div className="progress-bar" style={{ width: `${stats.avgSatisfaction !== "N/A" ? (stats.avgSatisfaction / 5) * 100 : 0}%`, backgroundColor: "#f39c12" }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ============= MODALS ============= */}

            {/* Submit/Edit Modal */}
            {showSubmitModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex="-1">
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <i className={`fas ${isEditing ? "fa-edit" : "fa-plus-circle"} mr-2`}></i>
                                    {isEditing ? "Edit Submission" : "Submit Grievance / Feedback"}
                                </h5>
                                <button type="button" className="close" onClick={() => { setShowSubmitModal(false); resetForm(); }}>
                                    <span>&times;</span>
                                </button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="font-weight-bold">Submission Type <span className="text-danger">*</span></label>
                                            <select className="form-control" value={formData.feedbackType} onChange={(e) => setFormData({ ...formData, feedbackType: e.target.value })}>
                                                {FEEDBACK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="font-weight-bold">Category <span className="text-danger">*</span></label>
                                            <select className="form-control" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                                                <option value="">-- Select Category --</option>
                                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <div className="custom-control custom-switch mb-2">
                                                <input
                                                    type="checkbox"
                                                    className="custom-control-input"
                                                    id="anonymousSwitch"
                                                    checked={formData.anonymous}
                                                    onChange={(e) => setFormData({ ...formData, anonymous: e.target.checked, employeeId: e.target.checked ? "" : formData.employeeId })}
                                                />
                                                <label className="custom-control-label font-weight-bold" htmlFor="anonymousSwitch">
                                                    <i className="fas fa-user-secret mr-1"></i> Submit Anonymously
                                                </label>
                                            </div>
                                            {!formData.anonymous && (
                                                <>
                                                    <label className="font-weight-bold">Employee <span className="text-danger">*</span></label>
                                                    <select className="form-control" value={formData.employeeId} onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}>
                                                        <option value="">-- Select Employee --</option>
                                                        {employees.map(emp => (
                                                            <option key={emp.id} value={emp.id}>
                                                                {`${emp.firstname || ""} ${emp.lastname || ""}`.trim()} (#{emp.id})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </>
                                            )}
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="font-weight-bold">Priority</label>
                                            <select className="form-control" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
                                                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="font-weight-bold">Subject <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Brief subject line"
                                            maxLength={200}
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="font-weight-bold">Description <span className="text-danger">*</span></label>
                                        <textarea
                                            className="form-control"
                                            rows="4"
                                            placeholder="Provide detailed description of your grievance, feedback, or suggestion..."
                                            maxLength={3000}
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        ></textarea>
                                        <small className="text-muted">{formData.description.length}/3000</small>
                                    </div>

                                    {formData.anonymous && (
                                        <div className="alert alert-info py-2">
                                            <i className="fas fa-shield-alt mr-1"></i>
                                            Your identity will be kept confidential. The submission will be recorded as anonymous.
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => { setShowSubmitModal(false); resetForm(); }}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">
                                        <i className={`fas ${isEditing ? "fa-save" : "fa-paper-plane"} mr-1`}></i>
                                        {isEditing ? "Update" : "Submit"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* View Detail Modal */}
            {showViewModal && selectedGrievance && (
                <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex="-1">
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <i className="fas fa-file-alt mr-2"></i>
                                    Grievance #{selectedGrievance.id} Details
                                </h5>
                                <button type="button" className="close" onClick={() => setShowViewModal(false)}>
                                    <span>&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <table className="table table-sm table-borderless">
                                            <tbody>
                                                <tr><td className="font-weight-bold text-muted">Employee</td><td>{selectedGrievance.anonymous ? <span><i className="fas fa-user-secret mr-1"></i>Anonymous</span> : getEmployeeName(selectedGrievance.employeeId)}</td></tr>
                                                <tr><td className="font-weight-bold text-muted">Type</td><td><span className="badge badge-info">{selectedGrievance.feedbackType}</span></td></tr>
                                                <tr><td className="font-weight-bold text-muted">Category</td><td>{selectedGrievance.category}</td></tr>
                                                <tr><td className="font-weight-bold text-muted">Priority</td><td><span className="badge" style={{ backgroundColor: PRIORITY_COLORS[selectedGrievance.priority], color: "#fff" }}>{selectedGrievance.priority}</span></td></tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="col-md-6">
                                        <table className="table table-sm table-borderless">
                                            <tbody>
                                                <tr><td className="font-weight-bold text-muted">Status</td><td><span className="badge" style={{ backgroundColor: STATUS_COLORS[selectedGrievance.status], color: "#fff" }}>{selectedGrievance.status}</span></td></tr>
                                                <tr><td className="font-weight-bold text-muted">Submitted</td><td>{formatDate(selectedGrievance.createdAt)}</td></tr>
                                                <tr><td className="font-weight-bold text-muted">Assigned To</td><td>{selectedGrievance.assignedTo ? getEmployeeName(selectedGrievance.assignedTo) : "-"}</td></tr>
                                                <tr><td className="font-weight-bold text-muted">Satisfaction</td><td>{selectedGrievance.satisfactionRating > 0 ? `${selectedGrievance.satisfactionRating}/5 ★` : "-"}</td></tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="font-weight-bold">Subject</label>
                                    <p className="border rounded p-2 bg-light">{selectedGrievance.subject}</p>
                                </div>
                                <div className="mb-3">
                                    <label className="font-weight-bold">Description</label>
                                    <p className="border rounded p-2 bg-light" style={{ whiteSpace: "pre-wrap" }}>{selectedGrievance.description}</p>
                                </div>

                                {selectedGrievance.status === "Escalated" && (
                                    <div className="alert alert-warning py-2 mb-3">
                                        <strong><i className="fas fa-level-up-alt mr-1"></i>Escalation Details</strong>
                                        <p className="mb-1 mt-1"><strong>Escalated To:</strong> {getEmployeeName(selectedGrievance.escalatedTo)}</p>
                                        <p className="mb-1"><strong>Notes:</strong> {selectedGrievance.escalationNotes || "-"}</p>
                                        <p className="mb-0"><strong>Escalated On:</strong> {formatDate(selectedGrievance.escalatedAt)}</p>
                                    </div>
                                )}

                                {(selectedGrievance.status === "Resolved" || selectedGrievance.status === "Closed") && selectedGrievance.resolution && (
                                    <div className="alert alert-success py-2 mb-3">
                                        <strong><i className="fas fa-check-circle mr-1"></i>Resolution</strong>
                                        <p className="mb-1 mt-1" style={{ whiteSpace: "pre-wrap" }}>{selectedGrievance.resolution}</p>
                                        <p className="mb-0"><strong>Resolved On:</strong> {formatDate(selectedGrievance.resolvedAt)}</p>
                                    </div>
                                )}

                                {selectedGrievance.employeeRemarks && (
                                    <div className="mb-3">
                                        <label className="font-weight-bold">Employee Remarks (Post-Resolution)</label>
                                        <p className="border rounded p-2 bg-light">{selectedGrievance.employeeRemarks}</p>
                                    </div>
                                )}

                                {/* Quick Status Change */}
                                {selectedGrievance.status !== "Resolved" && selectedGrievance.status !== "Closed" && (
                                    <div className="border-top pt-3">
                                        <label className="font-weight-bold mr-2">Quick Status Change:</label>
                                        {STATUSES.filter(s => s !== selectedGrievance.status && s !== "Closed").map(s => (
                                            <button
                                                key={s}
                                                className="btn btn-sm mr-1 mb-1"
                                                style={{ backgroundColor: STATUS_COLORS[s], color: "#fff" }}
                                                onClick={() => { handleStatusChange(selectedGrievance, s); setShowViewModal(false); }}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowViewModal(false)}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Escalate Modal */}
            {showEscalateModal && selectedGrievance && (
                <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex="-1">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header bg-warning text-dark">
                                <h5 className="modal-title"><i className="fas fa-level-up-alt mr-2"></i>Escalate Grievance #{selectedGrievance.id}</h5>
                                <button type="button" className="close" onClick={() => setShowEscalateModal(false)}><span>&times;</span></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="font-weight-bold">Escalate To <span className="text-danger">*</span></label>
                                    <select className="form-control" value={escalationData.escalatedTo} onChange={(e) => setEscalationData({ ...escalationData, escalatedTo: e.target.value })}>
                                        <option value="">-- Select Manager/Director --</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>
                                                {`${emp.firstname || ""} ${emp.lastname || ""}`.trim()} (#{emp.id})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="font-weight-bold">Escalation Notes <span className="text-danger">*</span></label>
                                    <textarea
                                        className="form-control"
                                        rows="3"
                                        placeholder="Reason for escalation..."
                                        maxLength={1000}
                                        value={escalationData.escalationNotes}
                                        onChange={(e) => setEscalationData({ ...escalationData, escalationNotes: e.target.value })}
                                    ></textarea>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowEscalateModal(false)}>Cancel</button>
                                <button className="btn btn-warning" onClick={handleEscalate}>
                                    <i className="fas fa-level-up-alt mr-1"></i> Escalate
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Resolve Modal */}
            {showResolveModal && selectedGrievance && (
                <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex="-1">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header bg-success text-white">
                                <h5 className="modal-title"><i className="fas fa-check-circle mr-2"></i>Resolve Grievance #{selectedGrievance.id}</h5>
                                <button type="button" className="close text-white" onClick={() => setShowResolveModal(false)}><span>&times;</span></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="font-weight-bold">Resolution Status</label>
                                    <select className="form-control" value={resolutionData.status} onChange={(e) => setResolutionData({ ...resolutionData, status: e.target.value })}>
                                        <option value="Resolved">Resolved</option>
                                        <option value="Closed">Closed</option>
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="font-weight-bold">Resolution Details <span className="text-danger">*</span></label>
                                    <textarea
                                        className="form-control"
                                        rows="4"
                                        placeholder="Describe the resolution or action taken..."
                                        maxLength={2000}
                                        value={resolutionData.resolution}
                                        onChange={(e) => setResolutionData({ ...resolutionData, resolution: e.target.value })}
                                    ></textarea>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowResolveModal(false)}>Cancel</button>
                                <button className="btn btn-success" onClick={handleResolve}>
                                    <i className="fas fa-check mr-1"></i> Mark as {resolutionData.status}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeGrievance;
