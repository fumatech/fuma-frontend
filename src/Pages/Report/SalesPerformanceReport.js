import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { toast } from "react-toastify";

const formatDateInput = (date) => date.toISOString().slice(0, 10);

const SalesPerformanceReport = () => {
  const today = new Date();
  const monthBack = new Date();
  monthBack.setDate(today.getDate() - 30);

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedMemberKey, setSelectedMemberKey] = useState("");
  const [salesTeamMembers, setSalesTeamMembers] = useState([]);
  const [filters, setFilters] = useState({
    startDate: formatDateInput(monthBack),
    endDate: formatDateInput(today),
  });

  const normalizeText = (text) => String(text || "").trim().toLowerCase();

  const loadSalesTeamMembers = async () => {
    try {
      const [deptRes, usersRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_BASE_URL}/department/getall`),
        axios.get(`${process.env.REACT_APP_BASE_URL}/user/getall`),
      ]);

      const salesDepartmentIds = (deptRes.data || [])
        .filter((dept) => normalizeText(dept.department).includes("sale"))
        .map((dept) => dept.id);

      const members = (usersRes.data || [])
        .filter((user) => salesDepartmentIds.includes(user.departmentId))
        .map((user) => {
          const fullName = `${user.firstname || ""} ${user.lastname || ""}`.trim();
          return {
            id: user.id,
            name: fullName || user.username || user.email || `User ${user.id}`,
            email: user.email || "",
            username: user.username || "",
          };
        });

      setSalesTeamMembers(members);
    } catch (error) {
      console.error("Error loading sales team members:", error);
    }
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = {
        startDate: filters.startDate,
        endDate: filters.endDate,
      };
      if (selectedMemberId && !Number.isNaN(Number(selectedMemberId))) {
        params.salespersonId = Number(selectedMemberId);
      }
      const baseUrl = process.env.REACT_APP_BASE_URL;
      const endpoints = [
        `${baseUrl}/api/reports/sales-performance`,
        `${baseUrl}/reports/sales-performance`,
      ];

      let response = null;
      let lastError;

      for (const endpoint of endpoints) {
        try {
          response = await axios.get(endpoint, { params });
          break;
        } catch (error) {
          lastError = error;
        }
      }

      if (!response) {
        throw lastError;
      }

      setReportData(response.data);
    } catch (error) {
      console.error("Error fetching report:", error);
      const reason = error?.response
        ? `(${error.response.status}) ${error.response.data?.message || "Request failed"}`
        : error?.message || "Network error";
      toast.error(`Failed to load sales performance report ${reason}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSalesTeamMembers();
    fetchReport();
  }, []);

  const selectedTeamMember = useMemo(
    () => salesTeamMembers.find((member) => String(member.id) === String(selectedMemberId)) || null,
    [salesTeamMembers, selectedMemberId]
  );

  useEffect(() => {
    if (!selectedTeamMember) {
      setSelectedMemberKey("");
      return;
    }
    const preferredKey =
      normalizeText(String(selectedTeamMember.id)) ||
      normalizeText(selectedTeamMember.email) ||
      normalizeText(selectedTeamMember.username) ||
      normalizeText(selectedTeamMember.name);
    setSelectedMemberKey(preferredKey);
  }, [selectedTeamMember]);

  const salespersonMatchesMember = (salespersonName, member) => {
    if (!member) return false;
    const raw = String(salespersonName || "").trim();
    if (raw === String(member.id)) return true;
    const normalized = normalizeText(salespersonName);
    const salespersonLocal = normalized.split("@")[0];
    const aliases = [
      normalizeText(String(member?.id)),
      normalizeText(member?.name),
      normalizeText(member?.email),
      normalizeText(member?.username),
    ].filter(Boolean);

    if (aliases.includes(normalized)) return true;

    return aliases.some((alias) => {
      const aliasLocal = alias.split("@")[0];
      return (
        normalized.includes(alias) ||
        alias.includes(normalized) ||
        (salespersonLocal && aliasLocal && salespersonLocal === aliasLocal)
      );
    });
  };

  const salespeopleData = useMemo(
    () =>
      (reportData?.salespersonComparison || []).map((item) => {
        const rawName = String(item?.name || "");
        const member = salesTeamMembers.find(
          (m) => String(m.id) === rawName.trim()
        );
        return {
          ...item,
          rawName,
          name: member ? member.name : rawName,
        };
      }),
    [reportData, salesTeamMembers]
  );

  const totalTeamRevenue = useMemo(
    () =>
      salespeopleData.reduce(
        (sum, item) => sum + Number(item?.revenue || 0),
        0
      ),
    [salespeopleData]
  );

  const filteredSalespeopleData = useMemo(() => {
    if (!selectedTeamMember) return salespeopleData;
    const rows = salespeopleData.filter((item) =>
      salespersonMatchesMember(item.rawName || item.name, selectedTeamMember)
    );
    if (rows.length > 0) return rows;

    if (selectedMemberKey) {
      return salespeopleData.filter((item) =>
        normalizeText(item?.rawName || item?.name).includes(selectedMemberKey)
      );
    }
    return rows;
  }, [salespeopleData, selectedTeamMember, selectedMemberKey]);

  const rankedSalespeople = useMemo(() => {
    return [...salespeopleData]
      .map((item) => ({
        ...item,
        revenue: Number(item?.revenue || 0),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .map((item, idx) => ({
        ...item,
        rank: idx + 1,
        contributionPct:
          totalTeamRevenue > 0 ? (item.revenue / totalTeamRevenue) * 100 : 0,
      }));
  }, [salespeopleData, totalTeamRevenue]);

  const selectedMemberStats = useMemo(() => {
    if (!selectedTeamMember) return null;
    const matchedByAlias = rankedSalespeople.find((item) =>
        salespersonMatchesMember(item.rawName || item.name, selectedTeamMember)
      );
    if (matchedByAlias) return matchedByAlias;
    if (!selectedMemberKey) return null;
    return (
      rankedSalespeople.find((item) =>
        normalizeText(item?.rawName || item?.name).includes(selectedMemberKey)
      ) || null
    );
  }, [rankedSalespeople, selectedTeamMember, selectedMemberKey]);

  const tableRows = useMemo(() => {
    if (!selectedTeamMember) return rankedSalespeople;
    return [...filteredSalespeopleData]
      .map((item) => ({
        ...item,
        revenue: Number(item?.revenue || 0),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .map((item, idx) => ({
        ...item,
        rank: idx + 1,
        contributionPct:
          totalTeamRevenue > 0 ? (item.revenue / totalTeamRevenue) * 100 : 0,
      }));
  }, [selectedTeamMember, filteredSalespeopleData, rankedSalespeople, totalTeamRevenue]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading) return <div className="p-4">Loading report...</div>;
  if (!reportData) return <div className="p-4">No data available</div>;

  return (
    <div className="sales-performance-report">
      <section className="content-header">
        <div className="container-fluid px-0">
          <h1>Sales Performance Dashboard</h1>
        </div>
      </section>

      <section className="content">
        <div className="container-fluid px-0">
            <div className="card cardHover rounded-4 border-0 p-3 mb-3">
              <div className="row g-2 align-items-end">
                <div className="col-md-3">
                  <label className="form-label mb-1">Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label mb-1">End Date</label>
                  <input
                    type="date"
                    className="form-control"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label mb-1">Team Member</label>
                  <select
                    className="form-control"
                    value={selectedMemberId}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedMemberId(value);
                    }}
                  >
                    <option value="">All Team Members</option>
                    {salesTeamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                  {salesTeamMembers.length === 0 && (
                    <small className="text-muted">
                      No users found in Sales department.
                    </small>
                  )}
                </div>
                <div className="col-md-2">
                  <button className="btn btn-primary w-100" onClick={fetchReport}>
                    Apply
                  </button>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-lg-3 col-6">
                <div className="small-box bg-info rounded-4">
                  <div className="inner">
                    <h3>{reportData.totalLeads || 0}</h3>
                    <p>Total Leads</p>
                  </div>
                  <div className="icon">
                    <i className="fas fa-users"></i>
                  </div>
                </div>
              </div>
              <div className="col-lg-3 col-6">
                <div className="small-box bg-success rounded-4">
                  <div className="inner">
                    <h3>{(reportData.conversionRate || 0).toFixed(2)}%</h3>
                    <p>Conversion Rate</p>
                  </div>
                  <div className="icon">
                    <i className="fas fa-chart-line"></i>
                  </div>
                </div>
              </div>
              <div className="col-lg-3 col-6">
                <div className="small-box bg-warning rounded-4">
                  <div className="inner">
                    <h3>{(reportData.averageResponseTimeHours || 0).toFixed(1)}h</h3>
                    <p>Avg Response Time</p>
                    <small className="d-block text-dark" style={{ opacity: 0.8 }}>
                      Lead to first activity
                    </small>
                  </div>
                  <div className="icon">
                    <i className="fas fa-clock"></i>
                  </div>
                </div>
              </div>
              <div className="col-lg-3 col-6">
                <div className="small-box bg-danger rounded-4">
                  <div className="inner">
                    <h3
                      style={{
                        fontSize: "clamp(1.4rem, 3vw, 2.2rem)",
                        lineHeight: 1.1,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={`Rs ${Number(reportData.totalRevenue || 0).toLocaleString()}`}
                    >
                      Rs {Number(reportData.totalRevenue || 0).toLocaleString()}
                    </h3>
                    <p>Total Revenue</p>
                  </div>
                  <div className="icon">
                    <i className="fas fa-money-bill-wave"></i>
                  </div>
                </div>
              </div>
            </div>

            {selectedMemberStats && (
              <div className="card cardHover rounded-4 border-0 p-3 mb-3">
                <h5 className="mb-3">
                  Individual Performance: {selectedTeamMember?.name || selectedMemberStats.name}
                </h5>
                <div className="row">
                  <div className="col-md-4">
                    <div className="border rounded p-3">
                      <small className="text-muted">Rank in Team</small>
                      <h4 className="mb-0">#{selectedMemberStats.rank}</h4>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="border rounded p-3">
                      <small className="text-muted">Revenue</small>
                      <h4 className="mb-0">
                        Rs {Number(selectedMemberStats.revenue || 0).toLocaleString()}
                      </h4>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="border rounded p-3">
                      <small className="text-muted">Team Contribution</small>
                      <h4 className="mb-0">{selectedMemberStats.contributionPct.toFixed(2)}%</h4>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="row">
              <div className="col-md-8">
                <div className="card cardHover rounded-4 border-0 p-4">
                  <h5>Monthly Sales Trend</h5>
                  <div style={{ width: "100%", height: 300 }}>
                    <ResponsiveContainer>
                      <AreaChart data={reportData.monthlySalesTrend || []}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#8884d8"
                          fillOpacity={1}
                          fill="url(#colorRevenue)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="card cardHover rounded-4 border-0 p-4">
                  <h5>Salesperson Revenue</h5>
                  <div style={{ width: "100%", height: 300 }}>
                    <ResponsiveContainer>
                      <BarChart data={filteredSalespeopleData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="revenue" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            <div className="card cardHover rounded-4 border-0 p-4 mt-3">
              <h5>Team Member Performance Table</h5>
              <div className="table-responsive">
                <table className="table table-bordered table-striped">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Team Member</th>
                      <th>Revenue</th>
                      <th>Contribution %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.length > 0 ? (
                      tableRows.map((row) => (
                          <tr key={row.name}>
                            <td>{row.rank}</td>
                            <td>{row.name}</td>
                            <td>Rs {Number(row.revenue || 0).toLocaleString()}</td>
                            <td>{row.contributionPct.toFixed(2)}%</td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-center">
                          No team performance data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
        </div>
      </section>
    </div>
  );
};

export default SalesPerformanceReport;
