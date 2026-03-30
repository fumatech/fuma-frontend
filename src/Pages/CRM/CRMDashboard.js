import React, { useState, useEffect, useCallback, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faBullseye,
  faDatabase,
  faChartLine,
  faBirthdayCake,
  faFacebook,
  faTwitter,
  faEnvelope,
  faCalendarAlt,
  faUserPlus,
  faUserCheck,
  faClock,
  faArrowUp,
  faArrowDown,
  faPercent,
  faMoneyBillWave,
  faPhone,
  faEnvelopeOpen,
  faUserTie,
  faUserClock,
  faCalendarCheck,
  faChartPie,
  faChartBar,
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

import Campaigns from "./Campaigns";
import ContactLogin from "./ContactLogin";
import Leads from "./Leads";
import FollowUps from "./FollowUps";
import LeadPipeline from "./LeadPipeline";
import TagManagement from "../Contacts/TagManagement";
import SalesPerformanceReport from "../Report/SalesPerformanceReport";
import QuotationProposalGenerator from "./QuotationProposalGenerator";
import ServiceTickets from "./ServiceTickets";
import interactionService from "../../utils/interactionService";
import { faComments } from "@fortawesome/free-solid-svg-icons";

const CRM_DASHBOARD_REFRESH_EVENT = "crm-dashboard-refresh";

const tabsData = [
  { id: "Leads", label: "Leads", component: <Leads /> },
  { id: "Pipeline", label: "Pipeline", component: <LeadPipeline /> },
  { id: "Follow-Ups", label: "Follow Ups", component: <FollowUps /> },
  { id: "Campaigns", label: "Campaigns", component: <Campaigns /> },
  { id: "Contacts-Login", label: "Contacts Login", component: <ContactLogin /> },
  { id: "Sources", label: "Sources" },
  { id: "Life-Stage", label: "Life Stage" },
  { id: "Customer-Segmentation-Tagging", label: "Customer Segmentation & Tagging", component: <TagManagement /> },
  { id: "Sales-Performance-Reports", label: "Sales Performance Reports", component: <SalesPerformanceReport /> },
  //{ id: "Quotation-Proposal-Generator", label: "Quotation & Proposal Generator", component: <QuotationProposalGenerator /> },
  { id: "Service-Tickets", label: "Service Tickets", component: <ServiceTickets isTab={true} /> },
];

const CRMDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    customers: [],
    leads: [],
    campaigns: [],
    contacts: [],
    sources: [],
    lifeStages: [],
    followUps: [],
    interactions: [],
  });

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
    chart1: ["#4361ee", "#3f37c9", "#4cc9f0", "#f72585", "#7209b7", "#fb8500", "#06d6a0", "#e63946"],
  };

  const fetchDashboardData = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const ts = Date.now();
      const [
        customersRes,
        leadsRes,
        campaignsRes,
        contactsRes,
        followUpsRes,
        interactionsRes,
      ] = await Promise.allSettled([
        axios.get(`${process.env.REACT_APP_BASE_URL}/customer/getall`, { params: { _ts: ts } }),
        axios.get(`${process.env.REACT_APP_BASE_URL}/lead/getall`, { params: { _ts: ts } }),
        axios.get(`${process.env.REACT_APP_BASE_URL}/campaign/getall`, { params: { _ts: ts } }),
        axios.get(`${process.env.REACT_APP_BASE_URL}/contact-login/getall`, { params: { _ts: ts } }),
        axios.get(`${process.env.REACT_APP_BASE_URL}/follow-ups/getall`, { params: { _ts: ts } }),
        interactionService.getAllInteractions(),
      ]);

      const getDataOrEmpty = (result) =>
        result.status === "fulfilled" && Array.isArray(result.value?.data)
          ? result.value.data
          : [];

      const leads = getDataOrEmpty(leadsRes);
      const hadFailure = [customersRes, leadsRes, campaignsRes, contactsRes, followUpsRes].some(
        (res) => res.status === "rejected"
      );

      // Sample sources and life stages data (you can replace with actual API calls)
      const sources = [
        { name: "Facebook", count: 0 },
        { name: "Email", count: 0 },
        { name: "Twitter", count: 0 },
        { name: "Offline", count: 0 },
        { name: "Website", count: 0 },
        { name: "Referral", count: 0 },
      ];

      const lifeStages = [
        { name: "New", count: 0 },
        { name: "Contacted", count: 0 },
        { name: "Prospect", count: 0 },
        { name: "Qualified", count: 0 },
        { name: "Customer", count: 0 },
      ];

      // Calculate source counts from leads
      leads.forEach(lead => {
        const sourceIndex = sources.findIndex(s => s.name.toLowerCase() === lead.source?.toLowerCase());
        if (sourceIndex >= 0) {
          sources[sourceIndex].count++;
        }
      });

      // Calculate life stage counts from leads
      leads.forEach(lead => {
        const stageIndex = lifeStages.findIndex(s => s.name.toLowerCase() === lead.lifeStage?.toLowerCase());
        if (stageIndex >= 0) {
          lifeStages[stageIndex].count++;
        }
      });

      setDashboardData((prev) => ({
        customers: getDataOrEmpty(customersRes).length > 0 || customersRes.status === "fulfilled"
          ? getDataOrEmpty(customersRes)
          : prev.customers,
        leads: leads.length > 0 || leadsRes.status === "fulfilled" ? leads : prev.leads,
        campaigns: getDataOrEmpty(campaignsRes).length > 0 || campaignsRes.status === "fulfilled"
          ? getDataOrEmpty(campaignsRes)
          : prev.campaigns,
        contacts: getDataOrEmpty(contactsRes).length > 0 || contactsRes.status === "fulfilled"
          ? getDataOrEmpty(contactsRes)
          : prev.contacts,
        followUps: getDataOrEmpty(followUpsRes).length > 0 || followUpsRes.status === "fulfilled"
          ? getDataOrEmpty(followUpsRes)
          : prev.followUps,
        interactions: interactionsRes.status === "fulfilled" ? interactionsRes.value : prev.interactions,
        sources: sources,
        lifeStages: lifeStages,
      }));

      if (hadFailure && showLoader) {
        toast.warning("Some dashboard sections failed to refresh. Retrying automatically.");
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      if (showLoader) toast.error("Failed to load dashboard data");
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  // Fetch on mount and poll for near-real-time updates
  useEffect(() => {
    fetchDashboardData(true);
    const intervalId = setInterval(() => {
      fetchDashboardData(false);
    }, 10000);

    const handleWindowFocus = () => fetchDashboardData(false);
    const handleVisibilityChange = () => {
      if (!document.hidden) fetchDashboardData(false);
    };
    const handleCRMDataChanged = () => fetchDashboardData(false);

    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener(CRM_DASHBOARD_REFRESH_EVENT, handleCRMDataChanged);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener(CRM_DASHBOARD_REFRESH_EVENT, handleCRMDataChanged);
    };
  }, [fetchDashboardData]);

  // Calculate statistics
  const stats = {
    totalCustomers: dashboardData.customers.length,
    totalLeads: dashboardData.leads.length,
    totalCampaigns: dashboardData.campaigns.length,
    totalContacts: dashboardData.contacts.length,
    totalFollowUps: dashboardData.followUps.length,
    activeSources: dashboardData.sources.filter(s => s.count > 0).length,
    conversionRate: dashboardData.leads.length > 0
      ? ((dashboardData.customers.length / dashboardData.leads.length) * 100).toFixed(1)
      : 0,
    followUpsToday: dashboardData.followUps.filter(f => {
      const today = new Date().toDateString();
      return new Date(f.startDateAndTime).toDateString() === today;
    }).length,
  };

  // Lead sources data for pie chart
  const leadSourcesData = () => {
    return dashboardData.sources.filter(s => s.count > 0);
  };

  // Life stages distribution
  const lifeStagesData = () => {
    return dashboardData.lifeStages.filter(s => s.count > 0);
  };

  // Campaign performance data (last 6 months)
  const campaignPerformanceData = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });

      // Count campaigns created in this month
      const campaignsThisMonth = dashboardData.campaigns.filter(c => {
        const campaignDate = new Date(c.createdAt);
        return campaignDate.getMonth() === date.getMonth() &&
          campaignDate.getFullYear() === date.getFullYear();
      }).length;

      months.push({
        month: monthName,
        campaigns: campaignsThisMonth,
        leads: Math.floor(Math.random() * 20) + 5, // Replace with actual lead data
        conversions: Math.floor(Math.random() * 10) + 1, // Replace with actual conversion data
      });
    }
    return months;
  };

  // Follow up status data
  const followUpStatusData = () => {
    const scheduled = dashboardData.followUps.filter(f => f.status === "Scheduled").length;
    const completed = dashboardData.followUps.filter(f => f.status === "Completed").length;
    const pending = dashboardData.followUps.filter(f => f.status === "Pending").length;
    const cancelled = dashboardData.followUps.filter(f => f.status === "Cancelled").length;

    return [
      { name: "Scheduled", value: scheduled, color: COLORS.info },
      { name: "Completed", value: completed, color: COLORS.success },
      { name: "Pending", value: pending, color: COLORS.warning },
      { name: "Cancelled", value: cancelled, color: COLORS.danger },
    ];
  };

  const recentActivityItems = useMemo(() => {
    const parseDateValue = (value) => {
      if (!value) return null;

      const raw = String(value).trim();
      if (!raw) return null;

      // Prefer day-first parsing for slash dates: dd/mm/yyyy[ hh:mm[:ss]][ am/pm]
      const match = raw.match(
        /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?)?$/i
      );
      if (match) {
        const day = Number(match[1]);
        const month = Number(match[2]) - 1;
        const year = Number(match[3]);
        let hour = Number(match[4] || 0);
        const minute = Number(match[5] || 0);
        const second = Number(match[6] || 0);
        const meridian = (match[7] || "").toLowerCase();

        if (meridian === "pm" && hour < 12) hour += 12;
        if (meridian === "am" && hour === 12) hour = 0;

        const dayFirstDate = new Date(year, month, day, hour, minute, second);
        if (!Number.isNaN(dayFirstDate.getTime())) return dayFirstDate;
      }

      const parsed = new Date(raw);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const getName = (record, fallback) => {
      const firstName = record?.firstName || record?.firstname || "";
      const lastName = record?.lastName || record?.lastname || "";
      const fullName = `${firstName} ${lastName}`.trim();
      return fullName || record?.name || fallback;
    };

    const pickDate = (record, keys) => {
      for (const key of keys) {
        const value = parseDateValue(record?.[key]);
        if (value) return value;
      }
      return null;
    };

    const leadActivities = (dashboardData.leads || []).map((lead, index) => ({
      id: `lead-${lead.id || lead._id || lead.name || index}`,
      type: "lead",
      title: "New Lead Added",
      description: `${getName(lead, "Lead")} added as a new lead`,
      date: pickDate(lead, ["addedOn", "createdAt", "updatedAt"]),
      icon: faUserPlus,
      color: COLORS.primary,
    }));

    const followUpActivities = (dashboardData.followUps || []).map((followUp, index) => ({
      id: `followup-${followUp.id || followUp._id || followUp.title || index}`,
      type: "followup",
      title: "Follow-up Scheduled",
      description: followUp.title || followUp.description || "Follow-up created",
      date: pickDate(followUp, ["createdAt", "updatedAt", "startDateAndTime"]),
      icon: faClock,
      color: COLORS.warning,
    }));

    const campaignActivities = (dashboardData.campaigns || []).map((campaign, index) => ({
      id: `campaign-${campaign.id || campaign._id || campaign.name || index}`,
      type: "campaign",
      title: "Campaign Created",
      description: campaign.name || campaign.title || "Campaign",
      date: pickDate(campaign, ["createdAt", "updatedAt", "date"]),
      icon: faBullseye,
      color: COLORS.success,
    }));

    const interactionActivities = (dashboardData.interactions || []).map((interaction, index) => ({
      id: `interaction-${interaction.id || index}`,
      type: "interaction",
      title: `${interaction.interactionType || 'Unknown'} Interaction`,
      description: `Outcome: ${(interaction.outcome || 'N/A').replace(/_/g, ' ')} - ${(interaction.notes || '').substring(0, 50)}${(interaction.notes || '').length > 50 ? '...' : ''}`,
      date: parseDateValue(interaction.interactionDate),
      icon: faComments,
      color: COLORS.chart1[index % (COLORS.chart1?.length || 1)],
    }));

    return [...leadActivities, ...followUpActivities, ...campaignActivities, ...interactionActivities]
      .filter((item) => item.date)
      .sort((a, b) => b.date - a.date)
      .slice(0, 5);
  }, [dashboardData.leads, dashboardData.followUps, dashboardData.campaigns, COLORS.primary, COLORS.warning, COLORS.success]);

  // Upcoming follow-ups
  const upcomingFollowUps = () => {
    return dashboardData.followUps
      .filter(f => f.status === "Scheduled" && new Date(f.startDateAndTime) >= new Date())
      .sort((a, b) => new Date(a.startDateAndTime) - new Date(b.startDateAndTime))
      .slice(0, 5);
  };

  const birthdayData = useMemo(() => {
    const getName = (record, fallback) => {
      const firstName = record?.firstName || record?.firstname || "";
      const lastName = record?.lastName || record?.lastname || "";
      const fullName = `${firstName} ${lastName}`.trim();
      return fullName || record?.name || fallback;
    };

    const getBirthdayValue = (record) =>
      record?.dateOfBirth ||
      record?.dateofbirth ||
      record?.dob ||
      record?.birthDate ||
      record?.birthday ||
      record?.date_of_birth ||
      "";

    const parseBirthday = (rawValue) => {
      if (!rawValue) return null;

      const raw = String(rawValue).trim();
      if (!raw) return null;

      const parsedDirect = new Date(raw);
      if (!Number.isNaN(parsedDirect.getTime())) return parsedDirect;

      // Fallback for dd/mm/yyyy or dd-mm-yyyy
      const matched = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (!matched) return null;

      const day = Number(matched[1]);
      const month = Number(matched[2]) - 1;
      const year = Number(matched[3]);
      const parsedFallback = new Date(year, month, day);

      return Number.isNaN(parsedFallback.getTime()) ? null : parsedFallback;
    };

    const getDaysUntilNextBirthday = (birthDate) => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const nextBirthday = new Date(
        today.getFullYear(),
        birthDate.getMonth(),
        birthDate.getDate()
      );
      if (nextBirthday < today) {
        nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
      }

      const oneDay = 1000 * 60 * 60 * 24;
      return Math.floor((nextBirthday - today) / oneDay);
    };

    const mapWithType = (rows, type, fallback) =>
      rows
        .map((row) => {
          const birthDate = parseBirthday(getBirthdayValue(row));
          if (!birthDate) return null;

          const daysUntil = getDaysUntilNextBirthday(birthDate);
          const name = getName(row, fallback);
          return {
            id: `${type}-${row.id || row._id || name}`,
            name,
            type,
            daysUntil,
            date: new Date(
              new Date().getFullYear(),
              birthDate.getMonth(),
              birthDate.getDate()
            ).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          };
        })
        .filter(Boolean);

    const customerBirthdays = mapWithType(
      dashboardData.customers || [],
      "Customer",
      "Customer"
    );
    const leadBirthdays = mapWithType(dashboardData.leads || [], "Lead", "Lead");
    const allBirthdays = [...customerBirthdays, ...leadBirthdays];

    const today = allBirthdays.filter((person) => person.daysUntil === 0);
    const upcoming = allBirthdays
      .filter((person) => person.daysUntil > 0)
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 10);

    return { today, upcoming };
  }, [dashboardData.customers, dashboardData.leads]);

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
                <h1 className="all-heading m-0">CRM Dashboard</h1>
                <span className="text-muted">
                  Manage your customers, leads, and campaigns effectively
                </span>
              </div>
              <div className="col-sm-6">
                <div className="float-sm-right">
                  <div className="btn-group">
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => fetchDashboardData(true)}
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
                  to="/CRMDashboard"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab(null);
                    navigate("/CRMDashboard", { replace: true });
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
              {/* Total Customers Card */}
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
                          Total Customers
                        </h6>
                        <h2 className="text-white mb-0">{stats.totalCustomers}</h2>
                        <small className="text-white-50">
                          Active Customers
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
                        +{stats.conversionRate}% conversion rate
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Leads Card */}
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
                          Total Leads
                        </h6>
                        <h2 className="text-white mb-0">{stats.totalLeads}</h2>
                        <small className="text-white-50">
                          Active Leads
                        </small>
                      </div>
                      <div
                        className="rounded-circle bg-white p-3"
                        style={{ opacity: 0.2 }}
                      >
                        <FontAwesomeIcon icon={faBullseye} size="2x" color="white" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="text-white small">
                        <FontAwesomeIcon icon={faArrowUp} className="mr-1" />
                        New this month
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Campaigns Card */}
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
                          Total Campaigns
                        </h6>
                        <h2 className="text-white mb-0">{stats.totalCampaigns}</h2>
                        <small className="text-white-50">
                          Active Campaigns
                        </small>
                      </div>
                      <div
                        className="rounded-circle bg-white p-3"
                        style={{ opacity: 0.2 }}
                      >
                        <FontAwesomeIcon icon={faChartLine} size="2x" color="white" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="text-white small">
                        <FontAwesomeIcon icon={faArrowUp} className="mr-1" />
                        +{stats.totalCampaigns} campaigns
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Follow-ups Card */}
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
                          Follow-ups
                        </h6>
                        <h2 className="text-white mb-0">{stats.totalFollowUps}</h2>
                        <small className="text-white-50">
                          {stats.followUpsToday} Today
                        </small>
                      </div>
                      <div
                        className="rounded-circle bg-white p-3"
                        style={{ opacity: 0.2 }}
                      >
                        <FontAwesomeIcon icon={faClock} size="2x" color="white" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="text-white small">
                        <FontAwesomeIcon icon={faPercent} className="mr-1" />
                        {stats.totalFollowUps} total
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Row 1 */}
            <div className="row">
              {/* Lead Sources Pie Chart */}
              <div className="col-lg-4 col-md-12 mb-4">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-header bg-white border-0">
                    <h5 className="mb-0">
                      <FontAwesomeIcon icon={faChartPie} className="mr-2 text-primary" />
                      Lead Sources
                    </h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={leadSourcesData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="count"
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {leadSourcesData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS.chart1[index % COLORS.chart1.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="d-flex flex-wrap justify-content-center mt-3">
                      {leadSourcesData().map((item, idx) => (
                        <div key={idx} className="text-center mx-2 mb-2">
                          <div
                            className="rounded-circle mb-1"
                            style={{
                              width: "10px",
                              height: "10px",
                              backgroundColor: COLORS.chart1[idx % COLORS.chart1.length],
                              margin: "0 auto",
                            }}
                          ></div>
                          <small className="d-block">{item.name}</small>
                          <strong>{item.count}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Life Stages Bar Chart */}
              <div className="col-lg-4 col-md-12 mb-4">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-header bg-white border-0">
                    <h5 className="mb-0">
                      <FontAwesomeIcon icon={faChartBar} className="mr-2 text-success" />
                      Life Stages
                    </h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={lifeStagesData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill={COLORS.primary}>
                          {lifeStagesData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS.chart1[index % COLORS.chart1.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Follow-up Status Pie Chart */}
              <div className="col-lg-4 col-md-12 mb-4">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-header bg-white border-0">
                    <h5 className="mb-0">
                      <FontAwesomeIcon icon={faUserClock} className="mr-2 text-warning" />
                      Follow-up Status
                    </h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={followUpStatusData()}
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
                          {followUpStatusData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="d-flex justify-content-around mt-3">
                      {followUpStatusData().map((item, idx) => (
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
              {/* Campaign Performance Line Chart */}
              <div className="col-lg-8 col-md-12 mb-4">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-header bg-white border-0">
                    <h5 className="mb-0">
                      <FontAwesomeIcon icon={faChartLine} className="mr-2 text-info" />
                      Campaign Performance (Last 6 Months)
                    </h5>
                  </div>
                  <div className="card-body">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={campaignPerformanceData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="campaigns"
                          stroke={COLORS.primary}
                          strokeWidth={2}
                          dot={{ fill: COLORS.primary }}
                          name="Campaigns"
                        />
                        <Line
                          type="monotone"
                          dataKey="leads"
                          stroke={COLORS.success}
                          strokeWidth={2}
                          dot={{ fill: COLORS.success }}
                          name="Leads"
                        />
                        <Line
                          type="monotone"
                          dataKey="conversions"
                          stroke={COLORS.warning}
                          strokeWidth={2}
                          dot={{ fill: COLORS.warning }}
                          name="Conversions"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Upcoming Follow-ups */}
              <div className="col-lg-4 col-md-12 mb-4">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-header bg-white border-0">
                    <h5 className="mb-0">
                      <FontAwesomeIcon icon={faCalendarCheck} className="mr-2 text-warning" />
                      Upcoming Follow-ups
                    </h5>
                  </div>
                  <div className="card-body">
                    {upcomingFollowUps().length > 0 ? (
                      <div className="list-group list-group-flush">
                        {upcomingFollowUps().map((followUp, index) => (
                          <div
                            key={index}
                            className="list-group-item d-flex justify-content-between align-items-center border-0 px-0"
                          >
                            <div>
                              <h6 className="mb-1">{followUp.title}</h6>
                              <small className="text-muted">
                                {followUp.type} • Assigned to: {followUp.assigned}
                              </small>
                            </div>
                            <span className="badge badge-info">
                              {new Date(followUp.startDateAndTime).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted text-center py-3">No upcoming follow-ups</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row - Birthdays and Recent Activities */}
            <div className="row">
              {/* Birthdays Section */}
              <div className="col-lg-5 col-md-12 mb-4">
                <div className="card shadow-sm border-0">
                  <div className="card-header bg-white border-0">
                    <h5 className="mb-0">
                      <FontAwesomeIcon icon={faBirthdayCake} className="mr-2 text-danger" />
                      Birthdays
                    </h5>
                  </div>
                  <div className="card-body">
                    <p className="text-muted mb-3">
                      Send birthday wishes to customers & leads
                    </p>

                    <div className="mb-4">
                      <h6 className="font-weight-bold mb-3">Today</h6>
                      {birthdayData.today.length > 0 ? (
                        birthdayData.today.map((person, index) => (
                          <div key={person.id} className="d-flex align-items-center mb-2">
                            <input
                              type="checkbox"
                              className="mr-2"
                              style={{ width: "16px", height: "16px" }}
                            />
                            <span className="text-muted">
                              #{index + 1} {person.name} ({person.type})
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted mb-0">No birthdays today</p>
                      )}
                    </div>

                    <div>
                      <h6 className="font-weight-bold mb-3">Upcoming</h6>
                      {birthdayData.upcoming.length > 0 ? (
                        birthdayData.upcoming.map((person, index) => (
                          <div key={person.id} className="d-flex align-items-center mb-2">
                            <input
                              type="checkbox"
                              className="mr-2"
                              style={{ width: "16px", height: "16px" }}
                            />
                            <span className="text-muted">
                              #{index + 1} {person.name} - {person.date} ({person.type})
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted mb-0">No upcoming birthdays</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activities */}
              <div className="col-lg-7 col-md-12 mb-4">
                <div className="card shadow-sm border-0">
                  <div className="card-header bg-white border-0">
                    <h5 className="mb-0">
                      <FontAwesomeIcon icon={faClock} className="mr-2 text-primary" />
                      Recent Activities
                    </h5>
                  </div>
                  <div className="card-body">
                    {recentActivityItems.length > 0 ? (
                      <div className="timeline">
                        {recentActivityItems.map((activity, index) => (
                          <div key={activity.id || index} className="timeline-item mb-3">
                            <div className="d-flex">
                              <div className="mr-3">
                                <div
                                  className="rounded-circle p-2"
                                  style={{
                                    width: "35px",
                                    height: "35px",
                                    backgroundColor: activity.color + '20',
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <FontAwesomeIcon
                                    icon={activity.icon}
                                    style={{
                                      color: activity.color,
                                      fontSize: "14px",
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="flex-grow-1">
                                <h6 className="mb-1">{activity.title}</h6>
                                <p className="mb-1 small">{activity.description}</p>
                                <small className="text-muted">
                                  {activity.date.toLocaleString()}
                                </small>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted text-center py-3">No recent activities</p>
                    )}
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
                            icon={faUsers}
                            className="text-primary mb-2"
                            size="2x"
                          />
                          <h5 className="mb-1">{stats.totalCustomers}</h5>
                          <small className="text-muted">Customers</small>
                        </div>
                      </div>
                      <div className="col-md-2 col-6 mb-3 mb-md-0">
                        <div className="p-3">
                          <FontAwesomeIcon
                            icon={faBullseye}
                            className="text-success mb-2"
                            size="2x"
                          />
                          <h5 className="mb-1">{stats.totalLeads}</h5>
                          <small className="text-muted">Leads</small>
                        </div>
                      </div>
                      <div className="col-md-2 col-6 mb-3 mb-md-0">
                        <div className="p-3">
                          <FontAwesomeIcon
                            icon={faDatabase}
                            className="text-info mb-2"
                            size="2x"
                          />
                          <h5 className="mb-1">{stats.activeSources}</h5>
                          <small className="text-muted">Active Sources</small>
                        </div>
                      </div>
                      <div className="col-md-2 col-6 mb-3 mb-md-0">
                        <div className="p-3">
                          <FontAwesomeIcon
                            icon={faChartLine}
                            className="text-warning mb-2"
                            size="2x"
                          />
                          <h5 className="mb-1">{stats.totalCampaigns}</h5>
                          <small className="text-muted">Campaigns</small>
                        </div>
                      </div>
                      <div className="col-md-2 col-6">
                        <div className="p-3">
                          <FontAwesomeIcon
                            icon={faUserCheck}
                            className="text-danger mb-2"
                            size="2x"
                          />
                          <h5 className="mb-1">{stats.conversionRate}%</h5>
                          <small className="text-muted">Conversion</small>
                        </div>
                      </div>
                      <div className="col-md-2 col-6">
                        <div className="p-3">
                          <FontAwesomeIcon
                            icon={faClock}
                            className="text-purple mb-2"
                            size="2x"
                          />
                          <h5 className="mb-1">{stats.followUpsToday}</h5>
                          <small className="text-muted">Today's Follow-ups</small>
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
        .text-purple {
          color: #7209b7 !important;
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

export default CRMDashboard;
