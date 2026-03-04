import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import {
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faBullseye,
    faStar,
    faChartBar,
    faPlus,
    faEdit,
    faTrash,
    faEye,
    faComment,
    faDownload,
    faFilter,
    faSearch,
    faTrophy,
    faArrowUp,
    faArrowDown,
    faMinus,
    faChevronDown,
    faChevronUp,
    faTimes,
    faCheck,
} from "@fortawesome/free-solid-svg-icons";

const COLORS = {
    primary: "#4361ee",
    secondary: "#3f37c9",
    success: "#06d6a0",
    warning: "#fb8500",
    danger: "#e63946",
    info: "#4895ef",
    purple: "#7209b7",
    teal: "#06d6a0",
    chart: ["#4361ee", "#06d6a0", "#fb8500", "#e63946", "#7209b7", "#4895ef"],
};

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const QUARTERS = ["Q1 (Jan-Mar)", "Q2 (Apr-Jun)", "Q3 (Jul-Sep)", "Q4 (Oct-Dec)"];

const KPI_CATEGORIES = [
    "Productivity",
    "Quality",
    "Attendance",
    "Communication",
    "Leadership",
    "Teamwork",
    "Innovation",
    "Customer Service",
];

function EmployeePerformance() {
    // ── State ──
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [loading, setLoading] = useState(true);

    // Performance records from backend
    const [kpiRecords, setKpiRecords] = useState([]);
    const [feedbackRecords, setFeedbackRecords] = useState([]);

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [filterDepartment, setFilterDepartment] = useState("");
    const [filterPeriod, setFilterPeriod] = useState("monthly");
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedQuarter, setSelectedQuarter] = useState(
        Math.floor(new Date().getMonth() / 3)
    );

    // Tabs within the section
    const [activeView, setActiveView] = useState("overview"); // overview | kpi | feedback | reports

    // Modals
    const [showKPIModal, setShowKPIModal] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Selected employee for detail / modals
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    // KPI form
    const [kpiForm, setKpiForm] = useState({
        employeeId: "",
        category: KPI_CATEGORIES[0],
        goal: "",
        targetValue: 100,
        achievedValue: 0,
        month: new Date().getMonth(),
        year: new Date().getFullYear(),
        notes: "",
    });

    // Feedback form
    const [feedbackForm, setFeedbackForm] = useState({
        employeeId: "",
        rating: 3,
        strengths: "",
        improvements: "",
        comments: "",
        month: new Date().getMonth(),
        year: new Date().getFullYear(),
    });

    // Pagination
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // ── Fetch base data ──
    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [empRes, deptRes, desigRes, kpiRes, fbRes] = await Promise.all([
                axios.get(`${process.env.REACT_APP_BASE_URL}/user/getall`),
                axios.get(`${process.env.REACT_APP_BASE_URL}/department/getall`),
                axios.get(`${process.env.REACT_APP_BASE_URL}/designation/getall`),
                axios.get(`${process.env.REACT_APP_BASE_URL}/performance-kpi/getall`),
                axios.get(`${process.env.REACT_APP_BASE_URL}/performance-feedback/getall`),
            ]);
            setEmployees(empRes.data || []);
            setDepartments(deptRes.data || []);
            setDesignations(desigRes.data || []);
            setKpiRecords(kpiRes.data || []);
            setFeedbackRecords(fbRes.data || []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load performance data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    // ── Helpers ──
    const getEmployeeName = (id) => {
        const e = employees.find((emp) => emp.id === id);
        return e ? `${e.firstname || ""} ${e.lastname || ""}`.trim() : "Unknown";
    };

    const getDepartmentName = (id) => {
        const d = departments.find((dep) => dep.id === id);
        return d ? d.department : "—";
    };

    const getDesignationName = (id) => {
        const d = designations.find((des) => des.id === id);
        return d ? d.designation : "—";
    };

    // Filtered KPI records
    const filteredKPIs = useMemo(() => {
        return kpiRecords.filter((r) => {
            if (filterPeriod === "monthly" && (r.month !== selectedMonth || r.year !== selectedYear))
                return false;
            if (filterPeriod === "quarterly") {
                const qStart = selectedQuarter * 3;
                const qEnd = qStart + 2;
                if (r.month < qStart || r.month > qEnd || r.year !== selectedYear) return false;
            }
            if (filterDepartment) {
                const emp = employees.find((e) => e.id === r.employeeId);
                if (!emp || String(emp.departmentId) !== String(filterDepartment)) return false;
            }
            return true;
        });
    }, [kpiRecords, filterPeriod, selectedMonth, selectedYear, selectedQuarter, filterDepartment, employees]);

    // Filtered feedback records
    const filteredFeedbacks = useMemo(() => {
        return feedbackRecords.filter((r) => {
            if (filterPeriod === "monthly" && (r.month !== selectedMonth || r.year !== selectedYear))
                return false;
            if (filterPeriod === "quarterly") {
                const qStart = selectedQuarter * 3;
                const qEnd = qStart + 2;
                if (r.month < qStart || r.month > qEnd || r.year !== selectedYear) return false;
            }
            if (filterDepartment) {
                const emp = employees.find((e) => e.id === r.employeeId);
                if (!emp || String(emp.departmentId) !== String(filterDepartment)) return false;
            }
            return true;
        });
    }, [feedbackRecords, filterPeriod, selectedMonth, selectedYear, selectedQuarter, filterDepartment, employees]);

    // Per-employee aggregated scores
    const employeeScores = useMemo(() => {
        const map = {};
        filteredKPIs.forEach((k) => {
            if (!map[k.employeeId]) map[k.employeeId] = { total: 0, count: 0 };
            map[k.employeeId].total += (k.achievedValue / k.targetValue) * 100;
            map[k.employeeId].count += 1;
        });
        return Object.entries(map)
            .map(([id, v]) => ({
                employeeId: Number(id),
                avgScore: v.count ? Math.round(v.total / v.count) : 0,
            }))
            .sort((a, b) => b.avgScore - a.avgScore);
    }, [filteredKPIs]);

    // Filtered + searched employee list
    const displayedEmployees = useMemo(() => {
        let list = employeeScores.map((s) => {
            const emp = employees.find((e) => e.id === s.employeeId);
            const fb = filteredFeedbacks.filter((f) => f.employeeId === s.employeeId);
            const avgRating = fb.length
                ? (fb.reduce((sum, f) => sum + f.rating, 0) / fb.length).toFixed(1)
                : "—";
            return {
                ...s,
                name: getEmployeeName(s.employeeId),
                department: getDepartmentName(emp?.departmentId),
                designation: getDesignationName(emp?.designationId),
                avgRating,
            };
        });
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            list = list.filter(
                (e) =>
                    e.name.toLowerCase().includes(lower) ||
                    e.department.toLowerCase().includes(lower)
            );
        }
        return list;
    }, [employeeScores, employees, filteredFeedbacks, searchTerm]);

    // Pagination helpers
    const totalPages = Math.ceil(displayedEmployees.length / entriesPerPage);
    const paginatedEmployees = displayedEmployees.slice(
        (currentPage - 1) * entriesPerPage,
        currentPage * entriesPerPage
    );

    // ── Chart data builders ──
    const radarDataForEmployee = (empId) => {
        const kpis = filteredKPIs.filter((k) => k.employeeId === empId);
        return KPI_CATEGORIES.map((cat) => {
            const items = kpis.filter((k) => k.category === cat);
            const avg = items.length
                ? Math.round(items.reduce((s, k) => s + (k.achievedValue / k.targetValue) * 100, 0) / items.length)
                : 0;
            return { category: cat, score: avg, fullMark: 100 };
        });
    };

    const monthlyTrendData = () => {
        return MONTHS.map((month, idx) => {
            const kpis = kpiRecords.filter(
                (r) => r.month === idx && r.year === selectedYear
            );
            const avg = kpis.length
                ? Math.round(kpis.reduce((s, k) => s + (k.achievedValue / k.targetValue) * 100, 0) / kpis.length)
                : 0;
            return { month: month.substring(0, 3), score: avg };
        });
    };

    const departmentAvgData = () => {
        const map = {};
        filteredKPIs.forEach((k) => {
            const emp = employees.find((e) => e.id === k.employeeId);
            const dept = getDepartmentName(emp?.departmentId);
            if (!map[dept]) map[dept] = { total: 0, count: 0 };
            map[dept].total += (k.achievedValue / k.targetValue) * 100;
            map[dept].count += 1;
        });
        return Object.entries(map).map(([name, v]) => ({
            name,
            score: Math.round(v.total / v.count),
        }));
    };

    const ratingDistribution = () => {
        const counts = [0, 0, 0, 0, 0];
        filteredFeedbacks.forEach((f) => {
            if (f.rating >= 1 && f.rating <= 5) counts[f.rating - 1]++;
        });
        return counts.map((c, i) => ({ rating: `${i + 1} Star`, count: c }));
    };

    // ── CRUD actions (real API calls) ──
    const handleSaveKPI = async () => {
        if (!kpiForm.employeeId || !kpiForm.goal) {
            toast.warning("Please fill employee and goal fields");
            return;
        }
        try {
            const payload = {
                ...kpiForm,
                employeeId: Number(kpiForm.employeeId),
            };
            await axios.post(`${process.env.REACT_APP_BASE_URL}/performance-kpi/add`, payload);
            toast.success("KPI added successfully");
            setShowKPIModal(false);
            setKpiForm({
                employeeId: "",
                category: KPI_CATEGORIES[0],
                goal: "",
                targetValue: 100,
                achievedValue: 0,
                month: new Date().getMonth(),
                year: new Date().getFullYear(),
                notes: "",
            });
            fetchAllData();
        } catch (err) {
            console.error(err);
            toast.error("Failed to add KPI");
        }
    };

    const handleSaveFeedback = async () => {
        if (!feedbackForm.employeeId) {
            toast.warning("Please select an employee");
            return;
        }
        try {
            const payload = {
                ...feedbackForm,
                employeeId: Number(feedbackForm.employeeId),
            };
            await axios.post(`${process.env.REACT_APP_BASE_URL}/performance-feedback/add`, payload);
            toast.success("Feedback submitted successfully");
            setShowFeedbackModal(false);
            setFeedbackForm({
                employeeId: "",
                rating: 3,
                strengths: "",
                improvements: "",
                comments: "",
                month: new Date().getMonth(),
                year: new Date().getFullYear(),
            });
            fetchAllData();
        } catch (err) {
            console.error(err);
            toast.error("Failed to submit feedback");
        }
    };

    const handleDeleteKPI = async (id) => {
        if (window.confirm("Delete this KPI record?")) {
            try {
                await axios.delete(`${process.env.REACT_APP_BASE_URL}/performance-kpi/delete/${id}`);
                toast.success("KPI deleted");
                fetchAllData();
            } catch (err) {
                console.error(err);
                toast.error("Failed to delete KPI");
            }
        }
    };

    // ── Export helpers ──
    const exportPDF = () => {
        const doc = new jsPDF();
        doc.text("Employee Performance Report", 14, 16);
        doc.autoTable({
            startY: 22,
            head: [["#", "Employee", "Department", "Avg Score (%)", "Avg Rating"]],
            body: displayedEmployees.map((e, i) => [
                i + 1,
                e.name,
                e.department,
                e.avgScore,
                e.avgRating,
            ]),
        });
        doc.save("performance_report.pdf");
    };

    const exportExcel = () => {
        const ws = XLSX.utils.json_to_sheet(
            displayedEmployees.map((e, i) => ({
                "#": i + 1,
                Employee: e.name,
                Department: e.department,
                "Avg Score (%)": e.avgScore,
                "Avg Rating": e.avgRating,
            }))
        );
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Performance");
        XLSX.writeFile(wb, "performance_report.xlsx");
    };

    // star renderer
    const renderStars = (rating) => {
        const r = Math.round(Number(rating));
        return (
            <span>
                {[1, 2, 3, 4, 5].map((s) => (
                    <FontAwesomeIcon
                        key={s}
                        icon={faStar}
                        style={{ color: s <= r ? "#ffc107" : "#e0e0e0", marginRight: 2 }}
                    />
                ))}
            </span>
        );
    };

    const scoreBadge = (score) => {
        let bg = COLORS.danger;
        let label = "Needs Improvement";
        if (score >= 90) { bg = COLORS.success; label = "Excellent"; }
        else if (score >= 75) { bg = COLORS.primary; label = "Good"; }
        else if (score >= 60) { bg = COLORS.warning; label = "Average"; }
        return (
            <span
                className="badge"
                style={{ backgroundColor: bg, color: "#fff", padding: "5px 10px", borderRadius: 6 }}
            >
                {score}% — {label}
            </span>
        );
    };

    // ── Loading state ──
    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="sr-only">Loading...</span>
                </div>
                <p className="mt-2">Loading performance data...</p>
            </div>
        );
    }

    // RENDER

    return (
        <div>
            {/* ── Header Bar ── */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
                <h4 className="mb-0">
                    <FontAwesomeIcon icon={faTrophy} className="mr-2 text-warning" />
                    Employee Performance Tracker
                </h4>
                <div className="d-flex flex-wrap gap-2" style={{ gap: "8px" }}>
                    <button className="btn btn-sm btn-primary" onClick={() => setShowKPIModal(true)}>
                        <FontAwesomeIcon icon={faPlus} className="mr-1" /> Add KPI
                    </button>
                    <button className="btn btn-sm btn-success" onClick={() => setShowFeedbackModal(true)}>
                        <FontAwesomeIcon icon={faComment} className="mr-1" /> Give Feedback
                    </button>
                    <button className="btn btn-sm btn-outline-secondary" onClick={exportPDF}>
                        <FontAwesomeIcon icon={faDownload} className="mr-1" /> PDF
                    </button>
                    <button className="btn btn-sm btn-outline-secondary" onClick={exportExcel}>
                        <FontAwesomeIcon icon={faDownload} className="mr-1" /> Excel
                    </button>
                </div>
            </div>

            {/* ── Sub-tabs ── */}
            <ul className="nav nav-pills mb-3" style={{ gap: 4 }}>
                {[
                    { key: "overview", label: "Overview", icon: faChartBar },
                    { key: "kpi", label: "KPIs & Goals", icon: faBullseye },
                    { key: "feedback", label: "Feedback & Ratings", icon: faStar },
                    { key: "reports", label: "Reports", icon: faChartBar },
                ].map((t) => (
                    <li className="nav-item" key={t.key}>
                        <button
                            className={`nav-link ${activeView === t.key ? "active" : ""}`}
                            onClick={() => setActiveView(t.key)}
                            style={{
                                cursor: "pointer",
                                backgroundColor: activeView === t.key ? COLORS.primary : "transparent",
                                color: activeView === t.key ? "#fff" : "#6c757d",
                                border: "none",
                                borderRadius: 8,
                                padding: "6px 14px",
                                fontSize: 13,
                            }}
                        >
                            <FontAwesomeIcon icon={t.icon} className="mr-1" />
                            {t.label}
                        </button>
                    </li>
                ))}
            </ul>

            {/* ── Filters Row ── */}
            <div className="card border-0 shadow-sm mb-3">
                <div className="card-body py-2 d-flex flex-wrap align-items-center" style={{ gap: 10 }}>
                    <FontAwesomeIcon icon={faFilter} className="text-muted" />

                    <select
                        className="form-control form-control-sm"
                        style={{ width: 140 }}
                        value={filterPeriod}
                        onChange={(e) => setFilterPeriod(e.target.value)}
                    >
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                    </select>

                    {filterPeriod === "monthly" && (
                        <select
                            className="form-control form-control-sm"
                            style={{ width: 130 }}
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        >
                            {MONTHS.map((m, i) => (
                                <option key={i} value={i}>{m}</option>
                            ))}
                        </select>
                    )}

                    {filterPeriod === "quarterly" && (
                        <select
                            className="form-control form-control-sm"
                            style={{ width: 150 }}
                            value={selectedQuarter}
                            onChange={(e) => setSelectedQuarter(Number(e.target.value))}
                        >
                            {QUARTERS.map((q, i) => (
                                <option key={i} value={i}>{q}</option>
                            ))}
                        </select>
                    )}

                    <select
                        className="form-control form-control-sm"
                        style={{ width: 130 }}
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                    >
                        {[2024, 2025, 2026, 2027].map((y) => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>

                    <select
                        className="form-control form-control-sm"
                        style={{ width: 160 }}
                        value={filterDepartment}
                        onChange={(e) => setFilterDepartment(e.target.value)}
                    >
                        <option value="">All Departments</option>
                        {departments.map((d) => (
                            <option key={d.id} value={d.id}>{d.department}</option>
                        ))}
                    </select>

                    <div className="ml-auto" style={{ position: "relative" }}>
                        <FontAwesomeIcon
                            icon={faSearch}
                            style={{ position: "absolute", left: 8, top: 8, color: "#adb5bd" }}
                        />
                        <input
                            className="form-control form-control-sm"
                            style={{ paddingLeft: 28, width: 200 }}
                            placeholder="Search employee..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                </div>
            </div>

            {/* 
          OVERVIEW TAB
  */}
            {activeView === "overview" && (
                <>
                    {/* Summary cards */}
                    <div className="row mb-3">
                        {[
                            { label: "Total Employees", value: employees.length, color: COLORS.primary, icon: faTrophy },
                            { label: "Avg Score", value: `${employeeScores.length ? Math.round(employeeScores.reduce((s, e) => s + e.avgScore, 0) / employeeScores.length) : 0}%`, color: COLORS.success, icon: faChartBar },
                            { label: "Top Performer", value: employeeScores.length ? getEmployeeName(employeeScores[0]?.employeeId) : "—", color: COLORS.warning, icon: faTrophy },
                            { label: "Feedbacks Given", value: filteredFeedbacks.length, color: COLORS.purple, icon: faComment },
                        ].map((c, i) => (
                            <div className="col-lg-3 col-md-6 col-sm-6 mb-3" key={i}>
                                <div
                                    className="card border-0 shadow-sm h-100"
                                    style={{ background: `linear-gradient(135deg, ${c.color}22 0%, ${c.color}11 100%)`, borderLeft: `4px solid ${c.color}`, borderRadius: 12 }}
                                >
                                    <div className="card-body py-3">
                                        <div className="d-flex align-items-center justify-content-between">
                                            <div>
                                                <small className="text-muted text-uppercase">{c.label}</small>
                                                <h4 className="mb-0 mt-1" style={{ color: c.color }}>{c.value}</h4>
                                            </div>
                                            <FontAwesomeIcon icon={c.icon} size="2x" style={{ color: c.color, opacity: 0.3 }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Employee ranking table */}
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Employee Performance Ranking</h5>
                            <select
                                className="form-control form-control-sm"
                                style={{ width: 80 }}
                                value={entriesPerPage}
                                onChange={(e) => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }}
                            >
                                {[5, 10, 25, 50].map((n) => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </div>
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover mb-0">
                                    <thead style={{ backgroundColor: "#f8f9fa" }}>
                                        <tr>
                                            <th>#</th>
                                            <th>Employee</th>
                                            <th>Department</th>
                                            <th>Designation</th>
                                            <th>Avg Score</th>
                                            <th>Rating</th>
                                            <th style={{ width: 100 }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedEmployees.length === 0 ? (
                                            <tr><td colSpan="7" className="text-center py-4 text-muted">No data found</td></tr>
                                        ) : (
                                            paginatedEmployees.map((emp, idx) => (
                                                <tr key={emp.employeeId}>
                                                    <td>{(currentPage - 1) * entriesPerPage + idx + 1}</td>
                                                    <td>
                                                        <strong>{emp.name}</strong>
                                                        {idx === 0 && <FontAwesomeIcon icon={faTrophy} className="ml-2 text-warning" title="Top Performer" />}
                                                    </td>
                                                    <td>{emp.department}</td>
                                                    <td>{emp.designation}</td>
                                                    <td>{scoreBadge(emp.avgScore)}</td>
                                                    <td>{emp.avgRating !== "—" ? renderStars(emp.avgRating) : "—"}</td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-outline-primary mr-1"
                                                            title="View Details"
                                                            onClick={() => { setSelectedEmployee(emp); setShowDetailModal(true); }}
                                                        >
                                                            <FontAwesomeIcon icon={faEye} />
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-outline-success"
                                                            title="Give Feedback"
                                                            onClick={() => {
                                                                setFeedbackForm((f) => ({ ...f, employeeId: emp.employeeId }));
                                                                setShowFeedbackModal(true);
                                                            }}
                                                        >
                                                            <FontAwesomeIcon icon={faComment} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="d-flex justify-content-between align-items-center px-3 py-2">
                                    <small className="text-muted">
                                        Showing {(currentPage - 1) * entriesPerPage + 1}–
                                        {Math.min(currentPage * entriesPerPage, displayedEmployees.length)} of{" "}
                                        {displayedEmployees.length}
                                    </small>
                                    <ul className="pagination pagination-sm mb-0">
                                        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                                            <button className="page-link" onClick={() => setCurrentPage((p) => p - 1)}>Prev</button>
                                        </li>
                                        {Array.from({ length: totalPages }, (_, i) => (
                                            <li key={i} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
                                                <button className="page-link" onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                                            </li>
                                        ))}
                                        <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                                            <button className="page-link" onClick={() => setCurrentPage((p) => p + 1)}>Next</button>
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* 
          KPI & GOALS TAB
     */}
            {activeView === "kpi" && (
                <>
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                            <h5 className="mb-0"><FontAwesomeIcon icon={faBullseye} className="mr-2 text-danger" />KPI Records</h5>
                            <button className="btn btn-sm btn-primary" onClick={() => setShowKPIModal(true)}>
                                <FontAwesomeIcon icon={faPlus} className="mr-1" /> Add KPI
                            </button>
                        </div>
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover mb-0">
                                    <thead style={{ backgroundColor: "#f8f9fa" }}>
                                        <tr>
                                            <th>#</th>
                                            <th>Employee</th>
                                            <th>Category</th>
                                            <th>Goal</th>
                                            <th>Target</th>
                                            <th>Achieved</th>
                                            <th>Progress</th>
                                            <th>Month</th>
                                            <th style={{ width: 80 }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredKPIs.length === 0 ? (
                                            <tr><td colSpan="9" className="text-center py-4 text-muted">No KPI records for this period</td></tr>
                                        ) : (
                                            filteredKPIs.slice(0, 50).map((k, idx) => {
                                                const pct = Math.round((k.achievedValue / k.targetValue) * 100);
                                                return (
                                                    <tr key={k.id}>
                                                        <td>{idx + 1}</td>
                                                        <td>{getEmployeeName(k.employeeId)}</td>
                                                        <td><span className="badge badge-info">{k.category}</span></td>
                                                        <td>{k.goal}</td>
                                                        <td>{k.targetValue}</td>
                                                        <td>{k.achievedValue}</td>
                                                        <td>
                                                            <div className="progress" style={{ height: 8, borderRadius: 4 }}>
                                                                <div
                                                                    className="progress-bar"
                                                                    style={{
                                                                        width: `${Math.min(pct, 100)}%`,
                                                                        backgroundColor: pct >= 90 ? COLORS.success : pct >= 60 ? COLORS.warning : COLORS.danger,
                                                                    }}
                                                                />
                                                            </div>
                                                            <small className="text-muted">{pct}%</small>
                                                        </td>
                                                        <td>{MONTHS[k.month]?.substring(0, 3)} {k.year}</td>
                                                        <td>
                                                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteKPI(k.id)}>
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
                </>
            )}

            {/* 
          FEEDBACK & RATINGS TAB
   */}
            {activeView === "feedback" && (
                <>
                    <div className="row mb-3">
                        <div className="col-lg-4 col-md-6 mb-3">
                            <div className="card border-0 shadow-sm h-100">
                                <div className="card-header bg-white border-0">
                                    <h6 className="mb-0">Rating Distribution</h6>
                                </div>
                                <div className="card-body">
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart data={ratingDistribution()}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="rating" />
                                            <YAxis allowDecimals={false} />
                                            <Tooltip />
                                            <Bar dataKey="count" fill={COLORS.primary}>
                                                {ratingDistribution().map((_, i) => (
                                                    <Cell key={i} fill={COLORS.chart[i % COLORS.chart.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-8 col-md-6 mb-3">
                            <div className="card border-0 shadow-sm h-100">
                                <div className="card-header bg-white border-0 d-flex justify-content-between">
                                    <h6 className="mb-0">Recent Feedbacks</h6>
                                    <button className="btn btn-sm btn-success" onClick={() => setShowFeedbackModal(true)}>
                                        <FontAwesomeIcon icon={faPlus} className="mr-1" /> New Feedback
                                    </button>
                                </div>
                                <div className="card-body p-0">
                                    <div className="table-responsive">
                                        <table className="table table-hover mb-0">
                                            <thead style={{ backgroundColor: "#f8f9fa" }}>
                                                <tr>
                                                    <th>Employee</th>
                                                    <th>Rating</th>
                                                    <th>Strengths</th>
                                                    <th>Improvements</th>
                                                    <th>Period</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredFeedbacks.length === 0 ? (
                                                    <tr><td colSpan="5" className="text-center py-4 text-muted">No feedback for this period</td></tr>
                                                ) : (
                                                    filteredFeedbacks.slice(0, 20).map((f) => (
                                                        <tr key={f.id}>
                                                            <td><strong>{getEmployeeName(f.employeeId)}</strong></td>
                                                            <td>{renderStars(f.rating)}</td>
                                                            <td style={{ maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.strengths}</td>
                                                            <td style={{ maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.improvements}</td>
                                                            <td>{MONTHS[f.month]?.substring(0, 3)} {f.year}</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* 
          REPORTS TAB
       */}
            {activeView === "reports" && (
                <>
                    <div className="row mb-3">
                        {/* Monthly Trend */}
                        <div className="col-lg-8 col-md-12 mb-3">
                            <div className="card border-0 shadow-sm h-100">
                                <div className="card-header bg-white border-0">
                                    <h6 className="mb-0">
                                        <FontAwesomeIcon icon={faChartBar} className="mr-2 text-primary" />
                                        Monthly Performance Trend ({selectedYear})
                                    </h6>
                                </div>
                                <div className="card-body">
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={monthlyTrendData()}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="month" />
                                            <YAxis domain={[0, 100]} />
                                            <Tooltip formatter={(v) => `${v}%`} />
                                            <Legend />
                                            <Line type="monotone" dataKey="score" stroke={COLORS.primary} strokeWidth={2} name="Avg Score (%)" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Dept avg */}
                        <div className="col-lg-4 col-md-12 mb-3">
                            <div className="card border-0 shadow-sm h-100">
                                <div className="card-header bg-white border-0">
                                    <h6 className="mb-0">Department Averages</h6>
                                </div>
                                <div className="card-body">
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={departmentAvgData()} layout="vertical" margin={{ left: 30 }}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" domain={[0, 100]} />
                                            <YAxis type="category" dataKey="name" width={90} />
                                            <Tooltip formatter={(v) => `${v}%`} />
                                            <Bar dataKey="score" fill={COLORS.info}>
                                                {departmentAvgData().map((_, i) => (
                                                    <Cell key={i} fill={COLORS.chart[i % COLORS.chart.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Top / Bottom performers */}
                    <div className="row">
                        <div className="col-lg-6 mb-3">
                            <div className="card border-0 shadow-sm">
                                <div className="card-header bg-white border-0">
                                    <h6 className="mb-0">
                                        <FontAwesomeIcon icon={faArrowUp} className="mr-2 text-success" />Top 5 Performers
                                    </h6>
                                </div>
                                <ul className="list-group list-group-flush">
                                    {employeeScores.slice(0, 5).map((e, i) => (
                                        <li key={e.employeeId} className="list-group-item d-flex justify-content-between align-items-center">
                                            <span>
                                                <strong className="mr-2">#{i + 1}</strong>
                                                {getEmployeeName(e.employeeId)}
                                            </span>
                                            {scoreBadge(e.avgScore)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <div className="col-lg-6 mb-3">
                            <div className="card border-0 shadow-sm">
                                <div className="card-header bg-white border-0">
                                    <h6 className="mb-0">
                                        <FontAwesomeIcon icon={faArrowDown} className="mr-2 text-danger" />Bottom 5 Performers
                                    </h6>
                                </div>
                                <ul className="list-group list-group-flush">
                                    {[...employeeScores].reverse().slice(0, 5).map((e, i) => (
                                        <li key={e.employeeId} className="list-group-item d-flex justify-content-between align-items-center">
                                            <span>
                                                <strong className="mr-2">#{i + 1}</strong>
                                                {getEmployeeName(e.employeeId)}
                                            </span>
                                            {scoreBadge(e.avgScore)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/*
          ADD KPI MODAL
    */}
            {showKPIModal && (
                <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content" style={{ borderRadius: 12 }}>
                            <div className="modal-header border-0">
                                <h5 className="modal-title">
                                    <FontAwesomeIcon icon={faBullseye} className="mr-2 text-danger" /> Add KPI
                                </h5>
                                <button className="close" onClick={() => setShowKPIModal(false)}>
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Employee <span className="text-danger">*</span></label>
                                    <select
                                        className="form-control"
                                        value={kpiForm.employeeId}
                                        onChange={(e) => setKpiForm({ ...kpiForm, employeeId: e.target.value })}
                                    >
                                        <option value="">Select Employee</option>
                                        {employees.map((emp) => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.firstname} {emp.lastname}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Category</label>
                                    <select
                                        className="form-control"
                                        value={kpiForm.category}
                                        onChange={(e) => setKpiForm({ ...kpiForm, category: e.target.value })}
                                    >
                                        {KPI_CATEGORIES.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Goal <span className="text-danger">*</span></label>
                                    <input
                                        className="form-control"
                                        placeholder="e.g. Close 50 tickets this month"
                                        value={kpiForm.goal}
                                        onChange={(e) => setKpiForm({ ...kpiForm, goal: e.target.value })}
                                    />
                                </div>
                                <div className="row">
                                    <div className="col-6">
                                        <div className="form-group">
                                            <label>Target Value</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={kpiForm.targetValue}
                                                onChange={(e) => setKpiForm({ ...kpiForm, targetValue: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="form-group">
                                            <label>Achieved Value</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={kpiForm.achievedValue}
                                                onChange={(e) => setKpiForm({ ...kpiForm, achievedValue: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-6">
                                        <div className="form-group">
                                            <label>Month</label>
                                            <select className="form-control" value={kpiForm.month} onChange={(e) => setKpiForm({ ...kpiForm, month: Number(e.target.value) })}>
                                                {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="form-group">
                                            <label>Year</label>
                                            <select className="form-control" value={kpiForm.year} onChange={(e) => setKpiForm({ ...kpiForm, year: Number(e.target.value) })}>
                                                {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Notes</label>
                                    <textarea className="form-control" rows="2" value={kpiForm.notes} onChange={(e) => setKpiForm({ ...kpiForm, notes: e.target.value })} />
                                </div>
                            </div>
                            <div className="modal-footer border-0">
                                <button className="btn btn-secondary" onClick={() => setShowKPIModal(false)}>Cancel</button>
                                <button className="btn btn-primary" onClick={handleSaveKPI}>
                                    <FontAwesomeIcon icon={faCheck} className="mr-1" /> Save KPI
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════
          FEEDBACK MODAL
      ════════════════════════════════════════ */}
            {showFeedbackModal && (
                <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content" style={{ borderRadius: 12 }}>
                            <div className="modal-header border-0">
                                <h5 className="modal-title">
                                    <FontAwesomeIcon icon={faComment} className="mr-2 text-success" /> Give Feedback
                                </h5>
                                <button className="close" onClick={() => setShowFeedbackModal(false)}>
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Employee <span className="text-danger">*</span></label>
                                    <select
                                        className="form-control"
                                        value={feedbackForm.employeeId}
                                        onChange={(e) => setFeedbackForm({ ...feedbackForm, employeeId: e.target.value })}
                                    >
                                        <option value="">Select Employee</option>
                                        {employees.map((emp) => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.firstname} {emp.lastname}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Rating</label>
                                    <div className="d-flex align-items-center" style={{ gap: 6 }}>
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <FontAwesomeIcon
                                                key={s}
                                                icon={faStar}
                                                size="lg"
                                                style={{
                                                    cursor: "pointer",
                                                    color: s <= feedbackForm.rating ? "#ffc107" : "#e0e0e0",
                                                    transition: "color .2s",
                                                }}
                                                onClick={() => setFeedbackForm({ ...feedbackForm, rating: s })}
                                            />
                                        ))}
                                        <span className="ml-2 text-muted">({feedbackForm.rating}/5)</span>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Strengths</label>
                                    <textarea className="form-control" rows="2" value={feedbackForm.strengths} onChange={(e) => setFeedbackForm({ ...feedbackForm, strengths: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Areas of Improvement</label>
                                    <textarea className="form-control" rows="2" value={feedbackForm.improvements} onChange={(e) => setFeedbackForm({ ...feedbackForm, improvements: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Additional Comments</label>
                                    <textarea className="form-control" rows="2" value={feedbackForm.comments} onChange={(e) => setFeedbackForm({ ...feedbackForm, comments: e.target.value })} />
                                </div>
                                <div className="row">
                                    <div className="col-6">
                                        <div className="form-group">
                                            <label>Month</label>
                                            <select className="form-control" value={feedbackForm.month} onChange={(e) => setFeedbackForm({ ...feedbackForm, month: Number(e.target.value) })}>
                                                {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="form-group">
                                            <label>Year</label>
                                            <select className="form-control" value={feedbackForm.year} onChange={(e) => setFeedbackForm({ ...feedbackForm, year: Number(e.target.value) })}>
                                                {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer border-0">
                                <button className="btn btn-secondary" onClick={() => setShowFeedbackModal(false)}>Cancel</button>
                                <button className="btn btn-success" onClick={handleSaveFeedback}>
                                    <FontAwesomeIcon icon={faCheck} className="mr-1" /> Submit Feedback
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════
          DETAIL MODAL (Radar chart per employee)
      ════════════════════════════════════════ */}
            {showDetailModal && selectedEmployee && (
                <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content" style={{ borderRadius: 12 }}>
                            <div className="modal-header border-0">
                                <h5 className="modal-title">
                                    <FontAwesomeIcon icon={faEye} className="mr-2 text-primary" />
                                    {selectedEmployee.name} — Performance Detail
                                </h5>
                                <button className="close" onClick={() => setShowDetailModal(false)}>
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="row mb-3">
                                    <div className="col-md-4 text-center">
                                        <h6>Overall Score</h6>
                                        <h2 style={{ color: COLORS.primary }}>{selectedEmployee.avgScore}%</h2>
                                        {scoreBadge(selectedEmployee.avgScore)}
                                    </div>
                                    <div className="col-md-4 text-center">
                                        <h6>Avg Rating</h6>
                                        <h2 style={{ color: "#ffc107" }}>{selectedEmployee.avgRating}</h2>
                                        {selectedEmployee.avgRating !== "—" && renderStars(selectedEmployee.avgRating)}
                                    </div>
                                    <div className="col-md-4 text-center">
                                        <h6>Department</h6>
                                        <h5>{selectedEmployee.department}</h5>
                                        <small className="text-muted">{selectedEmployee.designation}</small>
                                    </div>
                                </div>
                                <hr />
                                <h6 className="mb-3">KPI Radar</h6>
                                <ResponsiveContainer width="100%" height={300}>
                                    <RadarChart data={radarDataForEmployee(selectedEmployee.employeeId)}>
                                        <PolarGrid />
                                        <PolarAngleAxis dataKey="category" tick={{ fontSize: 11 }} />
                                        <PolarRadiusAxis domain={[0, 100]} />
                                        <Radar name="Score" dataKey="score" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.4} />
                                        <Tooltip formatter={(v) => `${v}%`} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="modal-footer border-0">
                                <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default EmployeePerformance;
