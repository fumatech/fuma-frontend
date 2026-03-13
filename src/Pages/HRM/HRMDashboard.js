import React, { useState, useEffect } from "react";
import HRDocs from "./HRDocs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faUserCheck,
  faUserClock,
  faCalendarCheck,
  faMoneyBillWave,
  faUmbrellaBeach,
  faBriefcase,
  faUserTie,
  faChartLine,
  faArrowUp,
  faArrowDown,
  faCircleCheck,
  faCircleExclamation,
  faClock,
  faPercent,
  faRupeeSign,
} from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";
import { toast } from "react-toastify";
import Leave from "./Leave";
import LeaveType from "./LeaveType";
import Designations from "./Designations";
import SalesTargets from "./SalesTargets";
import Department from "./Department";
import Holiday from "./Holiday";
import Attendance from "./Attendance";
import Payroll from "./payroll";
import HRMSettings from "./HRMSettings";
import EmployeePerformance from "./EmployeePerformance";
import EmployeeGrievance from "./EmployeeGrievance";
import NoticeBoard from "./NoticeBoard";

const tabsData = [
  { id: "leave-type", label: "Leave Type", component: <LeaveType /> },
  { id: "leave", label: "Leave", component: <Leave /> },
  { id: "attendance", label: "Attendance", component: <Attendance /> },
  { id: "payroll", label: "Payroll", component: <Payroll /> },
  { id: "holiday", label: "Holiday", component: <Holiday /> },
  { id: "departments", label: "Departments", component: <Department /> },
  { id: "designations", label: "Designations", component: <Designations /> },
  { id: "sales-targets", label: "Sales Targets", component: <SalesTargets /> },
  { id: "performance", label: "Performance Tracker", component: <EmployeePerformance /> },
  { id: "grievance", label: "Grievance Portal", component: <EmployeeGrievance /> },
  { id: "notice-board", label: "Notice Board", component: <NoticeBoard /> },
  { id: "hr-docs", label: "HR Docs", component: <HRDocs /> },
  { id: "HRMSettings", label: "Settings", component: <HRMSettings /> },
];

const HRMTabComponent = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Colors for charts
  const COLORS = {
    primary: "#4361ee",
    secondary: "#3f37c9",
    success: "#4cc9f0",
    warning: "#f72585",
    info: "#4895ef",
    danger: "#e63946",
    light: "#f8f9fa",
    dark: "#212529",
    purple: "#7209b7",
    teal: "#06d6a0",
    orange: "#fb8500",
    chart1: ["#4361ee", "#3f37c9", "#4cc9f0", "#f72585", "#7209b7", "#fb8500"],
  };

  // Fetch dashboard summary in a single API call
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${process.env.REACT_APP_BASE_URL}/hrm/dashboard-summary`);
        setDashboardData(res.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Use pre-computed stats from backend
  const stats = dashboardData ? {
    totalEmployees: dashboardData.totalEmployees || 0,
    activeEmployees: dashboardData.activeEmployees || 0,
    presentToday: dashboardData.presentToday || 0,
    onLeave: dashboardData.onLeave || 0,
    pendingLeaves: dashboardData.pendingLeaves || 0,
    totalDepartments: dashboardData.totalDepartments || 0,
    totalDesignations: dashboardData.totalDesignations || 0,
    upcomingHolidays: dashboardData.upcomingHolidays || 0,
    totalPayrolls: dashboardData.totalPayrolls || 0,
    totalPayrollAmount: dashboardData.totalPayrollAmount || 0,
  } : {};

  // Attendance trend data from backend
  const attendanceTrend = () => {
    return dashboardData?.attendanceTrend || [];
  };

  // Department distribution from backend
  const departmentData = () => {
    return dashboardData?.departmentData || [];
  };

  // Leave status data from backend
  const leaveStatusData = () => {
    const data = dashboardData?.leaveStatusData || [];
    const colorMap = { "Approved": COLORS.success, "Pending": COLORS.warning, "Rejected": COLORS.danger };
    return data.map(item => ({ ...item, color: colorMap[item.name] || COLORS.info }));
  };

  // Monthly payroll data from backend
  const monthlyPayrollData = () => {
    return dashboardData?.monthlyPayrollData || [];
  };

  // Upcoming holidays from backend
  const upcomingHolidays = () => {
    return dashboardData?.upcomingHolidayList || [];
  };

  if (loading) {
    return (
      <div className="wrapper">
        <div className="content-wrapper">
          <div className="content">
            <div className="container-fluid">
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="sr-only">Loading...</span>
                </div>
                <p className="mt-2">Loading dashboard data...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        {/* Header with Tabs */}
        <div className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6">
                <h1 className="all-heading m-0">HRM Dashboard</h1>
                <span className="text-muted">
                  Welcome back! Here's what's happening with your HRM today.
                </span>
              </div>
              <div className="col-sm-6">
                <div className="float-sm-right">
                  <div className="btn-group">
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => {
                        setSelectedMonth(new Date().getMonth());
                        setSelectedYear(new Date().getFullYear());
                      }}
                    >
                      <i className="fas fa-sync-alt mr-1"></i> Refresh
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="container-fluid mb-4">
          <div
            className="card"
            style={{
              borderRadius: "15px",
              border: "none",
              backgroundColor: "#f8f9fa",
              padding: "10px 15px",
            }}
          >
            <ul
              className="nav"
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "5px",
              }}
            >
              <li
                style={{
                  fontWeight: "bold",
                  marginRight: "10px",
                  color: "#6c757d",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <FontAwesomeIcon icon={faUsers} style={{ marginRight: "5px" }} />
                <Link
                  to="/HRMDashboard"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab(null);
                    navigate("/HRMDashboard", { replace: true });
                  }}
                  style={{
                    textDecoration: "none",
                    color: "#6c757d",
                    fontSize: "14px",
                  }}
                >
                  Dashboard
                </Link>
              </li>

              {tabsData.map(({ id, label }) => (
                <li className="nav-item" key={id}>
                  <button
                    className={`nav-link ${activeTab === id ? "active" : ""}`}
                    onClick={() => setActiveTab(activeTab === id ? null : id)}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "13px",
                      padding: "8px 12px",
                      color: activeTab === id ? "#4361ee" : "#6c757d",
                      fontWeight: activeTab === id ? "600" : "400",
                      borderRadius: "8px",
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                      outline: "none",
                    }}
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Content Section */}
        {activeTab ? (
          <div className="container-fluid">
            <div className="card shadow-sm border-0">
              <div className="card-body">{tabsData.find((t) => t.id === activeTab)?.component}</div>
            </div>
          </div>
        ) : (
          <div className="container-fluid">
            {/* Statistics Cards */}
            <div className="row">
              {/* Total Employees Card */}
              <div className="col-lg-3 col-md-6 col-sm-6 mb-4">
                <div
                  className="card h-100 border-0 shadow-sm"
                  style={{
                    background: "linear-gradient(135deg, #4361ee 0%, #3f37c9 100%)",
                    borderRadius: "15px",
                  }}
                >
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-white text-uppercase mb-2" style={{ opacity: 0.9 }}>
                          Total Employees
                        </h6>
                        <h2 className="text-white mb-0">{stats.totalEmployees}</h2>
                        <small className="text-white-50">
                          {stats.activeEmployees} Active
                        </small>
                      </div>
                      <div
                        className="rounded-circle bg-white p-3"
                        style={{ opacity: 0.2 }}
                      >
                        <FontAwesomeIcon icon={faUsers} size="2x" color="white" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="text-white small">
                        <FontAwesomeIcon icon={faArrowUp} className="mr-1" />
                        +12% from last month
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Present Today Card */}
              <div className="col-lg-3 col-md-6 col-sm-6 mb-4">
                <div
                  className="card h-100 border-0 shadow-sm"
                  style={{
                    background: "linear-gradient(135deg, #06d6a0 0%, #05b386 100%)",
                    borderRadius: "15px",
                  }}
                >
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-white text-uppercase mb-2" style={{ opacity: 0.9 }}>
                          Present Today
                        </h6>
                        <h2 className="text-white mb-0">{stats.presentToday}</h2>
                        <small className="text-white-50">
                          {((stats.presentToday / stats.totalEmployees) * 100).toFixed(1)}% Attendance
                        </small>
                      </div>
                      <div
                        className="rounded-circle bg-white p-3"
                        style={{ opacity: 0.2 }}
                      >
                        <FontAwesomeIcon icon={faUserCheck} size="2x" color="white" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="text-white small">
                        <FontAwesomeIcon icon={faArrowUp} className="mr-1" />
                        {stats.totalEmployees - stats.presentToday} absent
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* On Leave Card */}
              <div className="col-lg-3 col-md-6 col-sm-6 mb-4">
                <div
                  className="card h-100 border-0 shadow-sm"
                  style={{
                    background: "linear-gradient(135deg, #fb8500 0%, #f37200 100%)",
                    borderRadius: "15px",
                  }}
                >
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-white text-uppercase mb-2" style={{ opacity: 0.9 }}>
                          On Leave
                        </h6>
                        <h2 className="text-white mb-0">{stats.onLeave}</h2>
                        <small className="text-white-50">
                          {stats.pendingLeaves} Pending
                        </small>
                      </div>
                      <div
                        className="rounded-circle bg-white p-3"
                        style={{ opacity: 0.2 }}
                      >
                        <FontAwesomeIcon icon={faUserClock} size="2x" color="white" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="text-white small">
                        <FontAwesomeIcon icon={faArrowDown} className="mr-1" />
                        -5% from yesterday
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payroll Card */}
              <div className="col-lg-3 col-md-6 col-sm-6 mb-4">
                <div
                  className="card h-100 border-0 shadow-sm"
                  style={{
                    background: "linear-gradient(135deg, #7209b7 0%, #560bad 100%)",
                    borderRadius: "15px",
                  }}
                >
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="text-white text-uppercase mb-2" style={{ opacity: 0.9 }}>
                          Payroll Amount
                        </h6>
                        <h2 className="text-white mb-0">
                          ₹{(stats.totalPayrollAmount / 100000).toFixed(1)}L
                        </h2>
                        <small className="text-white-50">
                          {stats.totalPayrolls} Payrolls
                        </small>
                      </div>
                      <div
                        className="rounded-circle bg-white p-3"
                        style={{ opacity: 0.2 }}
                      >
                        <FontAwesomeIcon icon={faMoneyBillWave} size="2x" color="white" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="text-white small">
                        <FontAwesomeIcon icon={faPercent} className="mr-1" />
                        85% Paid
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Row 1 */}
            <div className="row">
              {/* Attendance Trend Chart */}
              <div className="col-lg-8 col-md-12 mb-4">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-header bg-white border-0">
                    <h5 className="mb-0">
                      <FontAwesomeIcon icon={faChartLine} className="mr-2 text-primary" />
                      Attendance Trend (Last 7 Days)
                    </h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={attendanceTrend()}>
                        <defs>
                          <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8} />
                            <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1} />
                          </linearGradient>
                          <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.danger} stopOpacity={0.8} />
                            <stop offset="95%" stopColor={COLORS.danger} stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="present"
                          stroke={COLORS.primary}
                          fill="url(#colorPresent)"
                          name="Present"
                        />
                        <Area
                          type="monotone"
                          dataKey="absent"
                          stroke={COLORS.danger}
                          fill="url(#colorAbsent)"
                          name="Absent"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Leave Status Pie Chart */}
              <div className="col-lg-4 col-md-12 mb-4">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-header bg-white border-0">
                    <h5 className="mb-0">
                      <FontAwesomeIcon icon={faUserClock} className="mr-2 text-warning" />
                      Leave Status
                    </h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={leaveStatusData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {leaveStatusData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="d-flex justify-content-around mt-3">
                      {leaveStatusData().map((item, idx) => (
                        <div key={idx} className="text-center">
                          <div
                            className="rounded-circle mb-2"
                            style={{
                              width: "12px",
                              height: "12px",
                              backgroundColor: item.color,
                              margin: "0 auto",
                            }}
                          ></div>
                          <small className="d-block">{item.name}</small>
                          <strong>{item.value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="row">
              {/* Department Distribution */}
              <div className="col-lg-5 col-md-12 mb-4">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-header bg-white border-0">
                    <h5 className="mb-0">
                      <FontAwesomeIcon icon={faBriefcase} className="mr-2 text-info" />
                      Department Distribution
                    </h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={departmentData()}
                        layout="vertical"
                        margin={{ left: 50 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={100} />
                        <Tooltip />
                        <Bar dataKey="value" fill={COLORS.primary}>
                          {departmentData().map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS.chart1[index % COLORS.chart1.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Monthly Payroll Trend */}
              <div className="col-lg-7 col-md-12 mb-4">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-header bg-white border-0">
                    <h5 className="mb-0">
                      <FontAwesomeIcon icon={faMoneyBillWave} className="mr-2 text-success" />
                      Monthly Payroll Trend
                    </h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={monthlyPayrollData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="amount"
                          stroke={COLORS.success}
                          strokeWidth={2}
                          dot={{ fill: COLORS.success }}
                          activeDot={{ r: 8 }}
                          name="Payroll Amount (₹)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row - Holidays and Recent Activities */}
            <div className="row">
              {/* Upcoming Holidays */}
              <div className="col-lg-5 col-md-12 mb-4">
                <div className="card shadow-sm border-0">
                  <div className="card-header bg-white border-0">
                    <h5 className="mb-0">
                      <FontAwesomeIcon icon={faUmbrellaBeach} className="mr-2 text-warning" />
                      Upcoming Holidays
                    </h5>
                  </div>
                  <div className="card-body">
                    {upcomingHolidays().length > 0 ? (
                      <div className="list-group list-group-flush">
                        {upcomingHolidays().map((holiday, index) => (
                          <div
                            key={index}
                            className="list-group-item d-flex justify-content-between align-items-center border-0 px-0"
                          >
                            <div>
                              <h6 className="mb-1">{holiday.name}</h6>
                              <small className="text-muted">
                                {new Date(holiday.startDate).toLocaleDateString()}
                                {holiday.endDate &&
                                  holiday.startDate !== holiday.endDate &&
                                  ` - ${new Date(holiday.endDate).toLocaleDateString()}`}
                              </small>
                            </div>
                            <span className="badge badge-info">
                              {Math.ceil(
                                (new Date(holiday.startDate) - new Date()) /
                                (1000 * 60 * 60 * 24)
                              )}{" "}
                              days left
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted text-center py-3">No upcoming holidays</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Activities */}
              <div className="col-lg-7 col-md-12 mb-4">
                <div className="card shadow-sm border-0">
                  <div className="card-header bg-white border-0">
                    <h5 className="mb-0">
                      <FontAwesomeIcon icon={faClock} className="mr-2 text-primary" />
                      Quick Overview
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="row text-center">
                      <div className="col-4">
                        <div className="p-3">
                          <FontAwesomeIcon icon={faUserCheck} className="text-success mb-2" size="2x" />
                          <h4 className="mb-1">{stats.presentToday}</h4>
                          <small className="text-muted">Present Today</small>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="p-3">
                          <FontAwesomeIcon icon={faUserClock} className="text-warning mb-2" size="2x" />
                          <h4 className="mb-1">{stats.onLeave}</h4>
                          <small className="text-muted">On Leave</small>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="p-3">
                          <FontAwesomeIcon icon={faCircleExclamation} className="text-danger mb-2" size="2x" />
                          <h4 className="mb-1">{stats.pendingLeaves}</h4>
                          <small className="text-muted">Pending Leaves</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats Row */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="card shadow-sm border-0">
                  <div className="card-body">
                    <div className="row text-center">
                      <div className="col-md-2 col-6 mb-3 mb-md-0">
                        <div className="p-3">
                          <FontAwesomeIcon
                            icon={faBriefcase}
                            className="text-primary mb-2"
                            size="2x"
                          />
                          <h5 className="mb-1">{stats.totalDepartments}</h5>
                          <small className="text-muted">Departments</small>
                        </div>
                      </div>
                      <div className="col-md-2 col-6 mb-3 mb-md-0">
                        <div className="p-3">
                          <FontAwesomeIcon
                            icon={faUserTie}
                            className="text-success mb-2"
                            size="2x"
                          />
                          <h5 className="mb-1">{stats.totalDesignations}</h5>
                          <small className="text-muted">Designations</small>
                        </div>
                      </div>
                      <div className="col-md-2 col-6 mb-3 mb-md-0">
                        <div className="p-3">
                          <FontAwesomeIcon
                            icon={faCalendarCheck}
                            className="text-info mb-2"
                            size="2x"
                          />
                          <h5 className="mb-1">{stats.upcomingHolidays}</h5>
                          <small className="text-muted">Upcoming Holidays</small>
                        </div>
                      </div>
                      <div className="col-md-2 col-6 mb-3 mb-md-0">
                        <div className="p-3">
                          <FontAwesomeIcon
                            icon={faCircleCheck}
                            className="text-warning mb-2"
                            size="2x"
                          />
                          <h5 className="mb-1">{stats.pendingLeaves}</h5>
                          <small className="text-muted">Pending Leaves</small>
                        </div>
                      </div>
                      <div className="col-md-2 col-6">
                        <div className="p-3">
                          <FontAwesomeIcon
                            icon={faMoneyBillWave}
                            className="text-danger mb-2"
                            size="2x"
                          />
                          <h5 className="mb-1">{stats.totalPayrolls}</h5>
                          <small className="text-muted">Total Payrolls</small>
                        </div>
                      </div>
                      <div className="col-md-2 col-6">
                        <div className="p-3">
                          <FontAwesomeIcon
                            icon={faPercent}
                            className="text-purple mb-2"
                            size="2x"
                          />
                          <h5 className="mb-1">
                            {((stats.activeEmployees / stats.totalEmployees) * 100).toFixed(1)}%
                          </h5>
                          <small className="text-muted">Active Rate</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add custom CSS for timeline and other components */}
      <style jsx>{`
        .timeline-item {
          padding: 10px 0;
          border-bottom: 1px solid #f0f0f0;
        }
        .timeline-item:last-child {
          border-bottom: none;
        }
        .card {
          transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }
        .card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1) !important;
        }
        .btn-outline-secondary:hover {
          background: linear-gradient(135deg, #4361ee 0%, #3f37c9 100%);
          color: white;
          border-color: transparent;
        }
        .nav-link.active {
          background-color: rgba(67, 97, 238, 0.1) !important;
        }
        .badge {
          padding: 8px 12px;
          border-radius: 8px;
        }
        .text-white-50 {
          color: rgba(255, 255, 255, 0.7) !important;
        }
        @media (max-width: 768px) {
          .float-sm-right {
            float: none !important;
            margin-top: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default HRMTabComponent;