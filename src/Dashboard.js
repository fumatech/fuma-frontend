import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Pages/Dashboard.css";
import VendorWarehouseWorkflow from "./components/Dashboard/VendorWarehouseWorkflow";
import InventoryManagement from "./components/Dashboard/InventoryManagement";
// ══════════════════════════════════════════════════════════════
//  MOCK DATA  (replace each block with real API calls later)
// ══════════════════════════════════════════════════════════════
const MOCK = {
  // Operations
  ops: {
    pendingPOs: 48,
    dispatchToday: 380,
    stockMoves: 1240,
    grn: 142,
    pipeline: [
      { icon: "bi-box-arrow-in-down", stage: "GRN Inward", count: "142 units", warn: false },
      { icon: "bi-search", stage: "QC Check", count: "48 pending", warn: true },
      { icon: "bi-archive", stage: "Putaway", count: "94 done", warn: false },
      { icon: "bi-clipboard-data", stage: "Stock Mgmt", count: "6,240 SKU", warn: false },
      { icon: "bi-basket", stage: "Pick & Pack", count: "420 orders", warn: false },
      { icon: "bi-truck", stage: "Dispatch", count: "380 shipped", warn: false },
      { icon: "bi-receipt", stage: "Billing", count: "₹2.1 Cr", warn: false },
    ],
    inventory: [
      { label: "Fast Moving (A)", pct: 78, cls: "pb-green" },
      { label: "Slow Moving (B)", pct: 15, cls: "pb-orange" },
      { label: "Dead Stock (C)", pct: 7, cls: "pb-red" },
      { label: "Stock Turnover", pct: 84, cls: "pb-navy" },
      { label: "Below Reorder", pct: 3, cls: "pb-yellow" },
    ],
    alerts: [
      { type: "critical", msg: "SKU-EL4821 below reorder — 12 units at Pune WH", time: "4 min ago", src: "Warehouse" },
      { type: "critical", msg: "GRN mismatch PO#8847 — 62 units short vs invoice", time: "22 min ago", src: "Receiving" },
      { type: "warning", msg: "PO#9012 approval pending 72+ hours — escalated", time: "5 hr ago", src: "Purchase" },
      { type: "warning", msg: "18 dispatch orders unassigned — SLA at risk", time: "6 hr ago", src: "Logistics" },
      { type: "info", msg: "Monthly stock audit done — 97.3% accuracy all WH", time: "9:00 AM", src: "WMS" },
    ],
    poTable: [
      { code: "PO#9012", vendor: "Havells India Ltd", item: "Cables & Wires", amt: "₹14.2 L", status: "pending" },
      { code: "PO#9018", vendor: "Schneider Electric", item: "Switchgear", amt: "₹8.6 L", status: "active" },
      { code: "PO#9024", vendor: "Polycab Wires", item: "LT Cables", amt: "₹6.8 L", status: "pending" },
      { code: "PO#9031", vendor: "ABB India", item: "Circuit Breakers", amt: "₹22.4 L", status: "orange" },
      { code: "PO#9044", vendor: "Finolex Cables", item: "FR Wires", amt: "₹4.1 L", status: "active" },
    ],
  },

  // Sales
  sales: {
    revenue: "₹6.84 Cr",
    orders: 18472,
    target: "₹8 Cr",
    avgDeal: "₹3.1 L",
    chartMonths: ["May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr"],
    chartData: [32, 38, 44, 41, 48, 55, 52, 60, 64, 58, 68, 75],
    topProducts: [
      { name: "MCB & Switchgear", rev: "₹1.8 Cr", pct: 82, cls: "pb-green" },
      { name: "Cables & Wires", rev: "₹1.4 Cr", pct: 68, cls: "pb-navy" },
      { name: "Fans & Appliances", rev: "₹1.1 Cr", pct: 54, cls: "pb-orange" },
      { name: "Lighting Solutions", rev: "₹0.9 Cr", pct: 44, cls: "pb-teal" },
      { name: "Distribution Boards", rev: "₹0.6 Cr", pct: 30, cls: "pb-yellow" },
    ],
    dealerOrders: [
      { dealer: "Raj Electricals, Pune", orders: 214, amt: "₹18.4 L", status: "active" },
      { dealer: "Shree Power Hub, Mumbai", orders: 186, amt: "₹22.1 L", status: "active" },
      { dealer: "BrightLine Store, Aurangabad", orders: 142, amt: "₹14.6 L", status: "active" },
      { dealer: "Voltex Solutions, Nashik", orders: 98, amt: "₹9.2 L", status: "pending" },
      { dealer: "Spark Electric, Nashik", orders: 64, amt: "₹7.4 L", status: "orange" },
    ],
  },

  // CRM
  crm: {
    leads: 1840,
    converted: 220,
    followUps: 342,
    funnel: [
      { label: "Leads", count: 1840, pct: 100, color: "#0C4461" },
      { label: "Qualified", count: 1122, pct: 61, color: "#1a6a9a" },
      { label: "Proposal", count: 680, pct: 37, color: "#78B833" },
      { label: "Negotiation", count: 384, pct: 21, color: "#D5691F" },
      { label: "Won", count: 220, pct: 12, color: "#0B7636" },
    ],
    recentLeads: [
      { name: "Arun Electricals, Nagpur", source: "Website", value: "₹2.4 L", status: "active", assigned: "Rahul K." },
      { name: "Metro Wires Pvt Ltd", source: "Referral", value: "₹5.8 L", status: "active", assigned: "Priya S." },
      { name: "Sunlight Infra, Aurangabad", source: "Cold Call", value: "₹1.1 L", status: "pending", assigned: "Amit D." },
      { name: "Bright Future Elect.", source: "LinkedIn", value: "₹3.2 L", status: "active", assigned: "Neha M." },
      { name: "Ravi Power Depot", source: "Walk-in", value: "₹0.8 L", status: "orange", assigned: "Vikram P." },
    ],
    complaints: [
      { id: "CMP-441", customer: "Raj Electricals", issue: "Wrong SKU delivered", priority: "high", status: "pending" },
      { id: "CMP-438", customer: "Metro Wires", issue: "Invoice discrepancy", priority: "medium", status: "active" },
      { id: "CMP-435", customer: "BrightLine Store", issue: "Delayed dispatch 4 days", priority: "low", status: "active" },
    ],
  },

  // HR
  hr: {
    totalStaff: 312,
    attendance: 94.2,
    payroll: "₹48 L",
    openPos: 14,
    depts: [
      { name: "Sales Team", count: 86, pct: 72, cls: "pb-green" },
      { name: "Operations", count: 68, pct: 55, cls: "pb-navy" },
      { name: "Warehouse", count: 54, pct: 44, cls: "pb-orange" },
      { name: "Finance/Admin", count: 42, pct: 35, cls: "pb-teal" },
      { name: "Field Service", count: 38, pct: 30, cls: "pb-yellow" },
      { name: "IT & Support", count: 24, pct: 20, cls: "pb-red" },
    ],
    recentActivity: [
      { initials: "RK", bg: "#0C4461", text: "Rahul Kumar joined as <strong>Sales Executive</strong> — Pune branch", time: "2 hr ago" },
      { initials: "PS", bg: "#78B833", text: "Priya Shah <strong>payroll processed</strong> for April cycle", time: "Today 11am" },
      { initials: "AM", bg: "#D5691F", text: "Amit More marked <strong>absent</strong> without prior leave application", time: "Today 9am" },
      { initials: "NJ", bg: "#66C3D0", text: "New position <strong>Warehouse Supervisor</strong> posted for Mumbai branch", time: "Yesterday" },
      { initials: "VR", bg: "#0B7636", text: "Vikram Rao completed <strong>appraisal cycle</strong> — promoted to Sr. Exec", time: "2 days ago" },
    ],
    leaveToday: [
      { name: "Sunita Patil", dept: "Finance", type: "Sick Leave", status: "approved" },
      { name: "Rajan Mishra", dept: "Warehouse", type: "Casual Leave", status: "pending" },
      { name: "Kavita Sharma", dept: "Sales", type: "Annual Leave", status: "approved" },
    ],
  },

  // Finance
  finance: {
    revenue: "₹6.84 Cr",
    expenses: "₹4.22 Cr",
    gp: "38.4%",
    outstanding: "₹2.1 Cr",
    monthly: [
      { month: "May", rev: 32, exp: 22 }, { month: "Jun", rev: 38, exp: 26 },
      { month: "Jul", rev: 44, exp: 29 }, { month: "Aug", rev: 41, exp: 28 },
      { month: "Sep", rev: 48, exp: 31 }, { month: "Oct", rev: 55, exp: 34 },
      { month: "Nov", rev: 52, exp: 33 }, { month: "Dec", rev: 60, exp: 38 },
      { month: "Jan", rev: 64, exp: 40 }, { month: "Feb", rev: 58, exp: 36 },
      { month: "Mar", rev: 68, exp: 42 }, { month: "Apr", rev: 75, exp: 46 },
    ],
    outstanding_invoices: [
      { inv: "INV-4421", customer: "Rahul Electricals", amt: "₹8.4 L", days: 12, status: "critical" },
      { inv: "INV-4380", customer: "Sunpower Infra", amt: "₹3.2 L", days: 8, status: "warning" },
      { inv: "INV-4291", customer: "Metro Cables", amt: "₹14.8 L", days: 32, status: "critical" },
      { inv: "INV-4240", customer: "Spark Depot", amt: "₹2.1 L", days: 5, status: "info" },
    ],
    gst: [
      { period: "Apr 2026", sales_gst: "₹18.4 L", purchase_gst: "₹11.2 L", net: "₹7.2 L", status: "active" },
      { period: "Mar 2026", sales_gst: "₹21.6 L", purchase_gst: "₹13.8 L", net: "₹7.8 L", status: "active" },
      { period: "Feb 2026", sales_gst: "₹16.2 L", purchase_gst: "₹10.4 L", net: "₹5.8 L", status: "pending" },
    ],
  },
};

// ══════════════════════════════════════════════════════════════
//  HELPER COMPONENTS
// ══════════════════════════════════════════════════════════════
const StatusPill = ({ status }) => {
  const map = {
    active: ["sp-active", "bi-check-circle-fill", "Active"],
    pending: ["sp-pending", "bi-clock", "Pending"],
    critical: ["sp-danger", "bi-exclamation-circle", "Critical"],
    warning: ["sp-orange", "bi-exclamation-triangle", "Warning"],
    orange: ["sp-orange", "bi-dash-circle", "On Hold"],
    info: ["sp-info", "bi-info-circle", "Info"],
    high: ["sp-danger", "bi-arrow-up", "High"],
    medium: ["sp-orange", "bi-dash", "Medium"],
    low: ["sp-info", "bi-arrow-down", "Low"],
  };
  const [cls, icon, label] = map[status] || map.info;
  return (
    <span className={`status-pill ${cls}`}>
      <i className={`bi ${icon}`} style={{ fontSize: 9 }} /> {label}
    </span>
  );
};

const MiniKpi = ({ label, value, delta, deltaType, period, icon, sparkData, color }) => (
  <div className="mini-kpi-card" style={{ "--mk-color": color }}>
    <div className="mk-header">
      <span className="mk-label">{label}</span>
      <div className="mk-icon"><i className={`bi ${icon}`} /></div>
    </div>
    <div className="mk-value">{value}</div>
    {sparkData && (
      <div className="sparkline">
        {sparkData.map((h, i) => (
          <div key={i} className={`sp-bar ${i === sparkData.length - 1 ? "hi" : ""}`}
            style={{ height: `${h}%` }} />
        ))}
      </div>
    )}
    <div className={`mk-delta ${deltaType || "up"}`}>
      <i className={`bi bi-arrow-${deltaType === "down" ? "down" : deltaType === "warn" ? "dash" : "up"}`} />
      {delta} <span className="mk-period">{period}</span>
    </div>
  </div>
);

// ── Sales SVG Chart ──
const SalesAreaChart = ({ data, months }) => {
  const W = 600, H = 120, PAD = 20;
  const max = Math.max(...data);
  const pts = data.map((v, i) => ({
    x: PAD + (i / (data.length - 1)) * (W - PAD * 2),
    y: H - PAD - (v / max) * (H - PAD * 2),
  }));
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${line} L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z`;
  return (
    <div className="chart-svg-wrap">
      <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#78B833" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#78B833" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="navyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0C4461" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#0C4461" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map(r => (
          <line key={r} x1={PAD} y1={PAD + (1 - r) * (H - PAD * 2)}
            x2={W - PAD} y2={PAD + (1 - r) * (H - PAD * 2)}
            stroke="var(--border-color)" strokeWidth="1" />
        ))}
        <path d={area} fill="url(#salesGrad)" />
        <path d={line} fill="none" stroke="#78B833" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 5 : 3.5}
            fill="#78B833" stroke="var(--bg-card)" strokeWidth="2" />
        ))}
        {/* Latest value annotation */}
        <rect x={pts[pts.length - 1].x - 22} y={pts[pts.length - 1].y - 20}
          width={44} height={16} rx={4}
          fill="rgba(120,184,51,0.15)" stroke="rgba(120,184,51,0.4)" strokeWidth={1} />
        <text x={pts[pts.length - 1].x} y={pts[pts.length - 1].y - 9}
          fill="#5d9228" fontSize="8" fontFamily="Roboto" textAnchor="middle" fontWeight="700">
          ₹75L ▲
        </text>
      </svg>
      {/* X labels */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0 0", marginTop: 4 }}>
        {months.map(m => (
          <span key={m} style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "Roboto" }}>{m}</span>
        ))}
      </div>
    </div>
  );
};

// ── Finance Grouped Bar Chart ──
const FinanceBarChart = ({ data }) => {
  const W = 600, H = 120, PAD = 20;
  const maxVal = Math.max(...data.flatMap(d => [d.rev, d.exp]));
  const bw = (W - PAD * 2) / data.length;
  return (
    <div className="chart-svg-wrap">
      <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {[0.25, 0.5, 0.75].map(r => (
          <line key={r} x1={PAD} y1={PAD + (1 - r) * (H - PAD * 2)}
            x2={W - PAD} y2={PAD + (1 - r) * (H - PAD * 2)}
            stroke="var(--border-color)" strokeWidth="1" />
        ))}
        {data.map((d, i) => {
          const x = PAD + i * bw;
          const rh = (d.rev / maxVal) * (H - PAD * 2);
          const eh = (d.exp / maxVal) * (H - PAD * 2);
          return (
            <g key={i}>
              <rect x={x + 2} y={H - PAD - rh} width={bw * 0.4 - 2} height={rh}
                fill="#78B833" opacity="0.75" rx="2" />
              <rect x={x + bw * 0.45} y={H - PAD - eh} width={bw * 0.4 - 2} height={eh}
                fill="#0C4461" opacity="0.55" rx="2" />
            </g>
          );
        })}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        {data.map(d => (
          <span key={d.month} style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "Roboto" }}>{d.month}</span>
        ))}
      </div>
      <div className="chart-legend">
        <div className="legend-item"><div className="legend-dot" style={{ background: "#78B833" }} /> Revenue</div>
        <div className="legend-item"><div className="legend-dot" style={{ background: "#0C4461" }} /> Expenses</div>
      </div>
    </div>
  );
};

// ── Donut Chart (SVG) ──
const DonutChart = ({ segments, size = 110 }) => {
  const r = 38, cx = size / 2, cy = size / 2, total = segments.reduce((s, d) => s + d.value, 0);
  let angle = -90;
  const arcs = segments.map(seg => {
    const a = (seg.value / total) * 360;
    const rad = (v) => (v * Math.PI) / 180;
    const x1 = cx + r * Math.cos(rad(angle));
    const y1 = cy + r * Math.sin(rad(angle));
    const x2 = cx + r * Math.cos(rad(angle + a));
    const y2 = cy + r * Math.sin(rad(angle + a));
    const large = a > 180 ? 1 : 0;
    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
    angle += a;
    return { ...seg, d };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="var(--bg-card-alt)" />
      {arcs.map((a, i) => <path key={i} d={a.d} fill={a.color} />)}
      <circle cx={cx} cy={cy} r={r * 0.6} fill="var(--bg-card)" />
    </svg>
  );
};

// ══════════════════════════════════════════════════════════════
//  MAIN DASHBOARD COMPONENT
// ══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════
//  FUMA ERP — CRM & HRM GRAPHICAL ADDITIONS
//  Drop these components into your existing Dashboard.js
//  Brand: #78B833 (green) | #0C4461 (navy) | #D5691F | #66C3D0 | #FECC00
// ══════════════════════════════════════════════════════════════════════

// ─── ADD THESE IMPORTS AT TOP OF Dashboard.js ───
// (already available in React, no extra packages needed)


// ══════════════════════════════════════════════════════════════════════
//  SECTION A — CRM GRAPHICAL COMPONENTS
// ══════════════════════════════════════════════════════════════════════

// ── A1. Lead Source Donut + Heatmap Calendar (combined card) ──────────
const CRMLeadSourceChart = () => {
  const sources = [
    { label: "Website", value: 524, color: "#0C4461", pct: 28 },
    { label: "Referral", value: 386, color: "#78B833", pct: 21 },
    { label: "Cold Call", value: 312, color: "#D5691F", pct: 17 },
    { label: "LinkedIn", value: 294, color: "#66C3D0", pct: 16 },
    { label: "Walk-in", value: 184, color: "#FECC00", pct: 10 },
    { label: "Event", value: 140, color: "#0B7636", pct: 8 },
  ];

  // SVG Donut
  const size = 130, r = 46, cx = 65, cy = 65;
  let angle = -90;
  const arcs = sources.map(s => {
    const sweep = (s.pct / 100) * 360;
    const toRad = v => (v * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(angle));
    const y1 = cy + r * Math.sin(toRad(angle));
    angle += sweep;
    const x2 = cx + r * Math.cos(toRad(angle));
    const y2 = cy + r * Math.sin(toRad(angle));
    const large = sweep > 180 ? 1 : 0;
    return { ...s, d: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z` };
  });

  // Mini activity heatmap (last 10 weeks × 7 days mock data)
  const weeks = 10, days = 7;
  const heatData = Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: days }, (_, d) => {
      const v = Math.floor(Math.random() * 5);
      return { w, d, v };
    })
  );
  const heatColors = ["#e9f5d6", "#b8dfa0", "#78B833", "#5d9228", "#0C4461"];

  return (
    <div className="fuma-panel" style={{ gridColumn: "span 1" }}>
      <div className="panel-header">
        <div className="panel-title">
          <i className="bi bi-pie-chart-fill" /> Lead Sources
        </div>
        <span className="tag-pill tag-navy">1,840 total</span>
      </div>

      {/* Donut + Legend */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 18px" }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
          {arcs.map((a, i) => (
            <path key={i} d={a.d} fill={a.color}
              style={{ transition: "opacity 0.2s", cursor: "pointer" }}
              onMouseEnter={e => e.target.style.opacity = "0.75"}
              onMouseLeave={e => e.target.style.opacity = "1"}
            />
          ))}
          {/* Inner hole */}
          <circle cx={cx} cy={cy} r={r * 0.55} fill="var(--bg-card)" />
          {/* Center text */}
          <text x={cx} y={cy - 6} textAnchor="middle"
            fill="var(--text-primary)" fontSize="16" fontWeight="900" fontFamily="Roboto">1,840</text>
          <text x={cx} y={cy + 10} textAnchor="middle"
            fill="var(--text-muted)" fontSize="9" fontFamily="Roboto">LEADS</text>
        </svg>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          {sources.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: "var(--text-secondary)", flex: 1, fontWeight: 600 }}>{s.label}</span>
              <span style={{ fontFamily: "Roboto", fontSize: 11, fontWeight: 700, color: "var(--text-primary)" }}>{s.value}</span>
              <div style={{ width: 48, height: 4, background: "var(--border-color)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: `${s.pct}%`, height: "100%", background: s.color, borderRadius: 2 }} />
              </div>
              <span style={{ fontFamily: "Roboto", fontSize: 10, color: "var(--text-muted)", width: 26, textAlign: "right" }}>{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Heatmap */}
      <div style={{ padding: "0 18px 14px", borderTop: "1px solid var(--border-soft)" }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase",
          letterSpacing: "0.1em", fontFamily: "Roboto", marginBottom: 8, marginTop: 10
        }}>
          Lead Activity — Last 10 Weeks
        </div>
        <div style={{ display: "flex", gap: 3 }}>
          {heatData.map((week, wi) => (
            <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {week.map((cell, di) => (
                <div key={di}
                  title={`${cell.v * 8} leads`}
                  style={{
                    width: 12, height: 12,
                    borderRadius: 2,
                    background: heatColors[cell.v] || heatColors[0],
                    cursor: "pointer",
                    transition: "transform 0.15s",
                  }}
                  onMouseEnter={e => e.target.style.transform = "scale(1.3)"}
                  onMouseLeave={e => e.target.style.transform = "scale(1)"}
                />
              ))}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6 }}>
          <span style={{ fontSize: 9, color: "var(--text-muted)" }}>Less</span>
          {heatColors.map((c, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
          ))}
          <span style={{ fontSize: 9, color: "var(--text-muted)" }}>More</span>
        </div>
      </div>
    </div>
  );
};


// ── A2. Conversion Rate Gauge + Stage Velocity Chart ─────────────────
const CRMConversionGauge = () => {
  // Full-circle gauge
  const winRate = 62;
  const gaugeR = 45;
  const gCx = 90;
  const gCy = 60;
  const circumference = 2 * Math.PI * gaugeR;
  const progress = Math.max(0, Math.min(100, winRate));
  const fillLen = (progress / 100) * circumference;

  // Stage velocity bars (avg days per stage)
  const stages = [
    { stage: "Lead → Qualified", days: 2.4, max: 7, color: "#0C4461" },
    { stage: "Qualified → Proposal", days: 4.8, max: 7, color: "#78B833" },
    { stage: "Proposal → Negotiation", days: 6.2, max: 7, color: "#D5691F" },
    { stage: "Negotiation → Won", days: 3.1, max: 7, color: "#66C3D0" },
  ];

  return (
    <div className="fuma-panel">
      <div className="panel-header">
        <div className="panel-title">
          <i className="bi bi-speedometer" /> Conversion & Velocity
        </div>
        <span className="tag-pill tag-green">Avg 24d cycle</span>
      </div>

      <div style={{ display: "flex", gap: 0 }}>
        {/* Gauge */}
        <div
          style={{
            padding: "14px 18px",
            borderRight: "1px solid var(--border-soft)",
            flex: "0 0 220px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center"
          }}
        >
          <svg width={180} height={130} viewBox="0 0 180 130">
            {/* Track */}
            <circle
              cx={gCx}
              cy={gCy}
              r={gaugeR}
              fill="none"
              stroke="var(--border-color)"
              strokeWidth="10"
            />
            {/* Fill */}
            <circle
              cx={gCx}
              cy={gCy}
              r={gaugeR}
              fill="none"
              stroke="url(#gaugeGrad)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${fillLen} ${circumference - fillLen}`}
              transform={`rotate(90 ${gCx} ${gCy})`}
            />
            <defs>
              <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#0C4461" />
                <stop offset="100%" stopColor="#78B833" />
              </linearGradient>
            </defs>
            {/* Labels */}
            <text x={gCx - gaugeR - 6} y={gCy + gaugeR + 16} fill="var(--text-muted)" fontSize="9" fontFamily="Roboto">0%</text>
            <text x={gCx + gaugeR - 12} y={gCy + gaugeR + 16} fill="var(--text-muted)" fontSize="9" fontFamily="Roboto">100%</text>
            {/* Center */}
            <text x={gCx} y={gCy - 2} textAnchor="middle" fill="var(--text-primary)"
              fontSize="22" fontWeight="900" fontFamily="Roboto">{winRate}%</text>
            <text x={gCx} y={gCy + 14} textAnchor="middle" fill="var(--text-muted)"
              fontSize="9" fontFamily="Roboto">WIN RATE</text>
          </svg>
          {/* Benchmarks */}
          {[["Industry", "48%", "#8fa3b8"], ["Last Q", "58%", "#D5691F"], ["Target", "70%", "#78B833"]].map(([l, v, c]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{l}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: c, fontFamily: "Roboto" }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Stage Velocity */}
        <div style={{ flex: 1, padding: "14px 18px" }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase",
            letterSpacing: "0.1em", fontFamily: "Roboto", marginBottom: 12
          }}>
            Avg Days per Stage
          </div>
          {stages.map((s, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600 }}>{s.stage}</span>
                <span style={{ fontFamily: "Roboto", fontSize: 12, fontWeight: 700, color: s.color }}>{s.days}d</span>
              </div>
              <div style={{ height: 8, background: "var(--border-color)", borderRadius: 4, overflow: "hidden", position: "relative" }}>
                <div style={{
                  width: `${(s.days / s.max) * 100}%`, height: "100%",
                  background: s.color, borderRadius: 4,
                  transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)",
                }} />
                {/* Target marker at 3d */}
                <div style={{
                  position: "absolute", left: `${(3 / s.max) * 100}%`,
                  top: 0, bottom: 0, width: 2,
                  background: "rgba(0,0,0,0.3)", borderRadius: 1,
                }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                <span style={{ fontSize: 9, color: "var(--text-muted)" }}>Target: 3d</span>
                <span style={{ fontSize: 9, color: s.days > 5 ? "#D5691F" : "#78B833", fontWeight: 600 }}>
                  {s.days > 5 ? "Slow ⚠" : "On track ✓"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


// ── A3. Monthly CRM Performance — Multi-line trend chart ──────────────
const CRMTrendChart = () => {
  const months = ["May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];
  const series = {
    leads: [120, 145, 138, 162, 158, 184, 172, 196, 210, 188, 224, 240],
    meetings: [48, 56, 52, 64, 60, 72, 68, 80, 88, 76, 92, 98],
    closed: [12, 16, 14, 18, 16, 22, 20, 26, 28, 22, 30, 32],
  };
  const colors = { leads: "#0C4461", meetings: "#78B833", closed: "#D5691F" };
  const labels = { leads: "Leads", meetings: "Meetings", closed: "Closed Deals" };

  const W = 540, H = 110, PX = 24, PY = 12;
  const maxVal = Math.max(...Object.values(series).flat());

  const getPath = (data) => {
    const pts = data.map((v, i) => ({
      x: PX + (i / (data.length - 1)) * (W - PX * 2),
      y: H - PY - (v / maxVal) * (H - PY * 2),
    }));
    // Smooth bezier
    return pts.map((p, i) => {
      if (i === 0) return `M${p.x},${p.y}`;
      const prev = pts[i - 1];
      const cpx = (prev.x + p.x) / 2;
      return `C${cpx},${prev.y} ${cpx},${p.y} ${p.x},${p.y}`;
    }).join(" ");
  };

  return (
    <div className="fuma-panel">
      <div className="panel-header">
        <div className="panel-title">
          <i className="bi bi-graph-up" /> CRM Monthly Performance
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {Object.entries(labels).map(([k, v]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-secondary)" }}>
              <div style={{ width: 20, height: 3, borderRadius: 2, background: colors[k] }} />
              {v}
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "14px 18px 10px" }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
          <defs>
            {Object.entries(colors).map(([k, c]) => (
              <linearGradient key={k} id={`crmGrad_${k}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={c} stopOpacity="0.15" />
                <stop offset="100%" stopColor={c} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>
          {/* Grid */}
          {[0.25, 0.5, 0.75].map(r => (
            <line key={r} x1={PX} y1={PY + (1 - r) * (H - PY * 2)}
              x2={W - PX} y2={PY + (1 - r) * (H - PY * 2)}
              stroke="var(--border-color)" strokeWidth="1" />
          ))}
          {/* Lines */}
          {Object.entries(series).map(([key, data]) => (
            <React.Fragment key={key}>
              {/* Area fill */}
              <path
                d={getPath(data) + ` L${PX + (data.length - 1) / (data.length - 1) * (W - PX * 2)},${H - PY} L${PX},${H - PY} Z`}
                fill={`url(#crmGrad_${key})`}
              />
              {/* Line */}
              <path d={getPath(data)} fill="none" stroke={colors[key]}
                strokeWidth="2" strokeLinecap="round" />
              {/* Last dot */}
              {(() => {
                const last = data[data.length - 1];
                const lx = PX + (W - PX * 2);
                const ly = H - PY - (last / maxVal) * (H - PY * 2);
                return (
                  <>
                    <circle cx={lx} cy={ly} r={4} fill={colors[key]} stroke="var(--bg-card)" strokeWidth={2} />
                    <rect x={lx - 14} y={ly - 18} width={28} height={13} rx={3}
                      fill={colors[key] + "22"} stroke={colors[key] + "55"} strokeWidth={1} />
                    <text x={lx} y={ly - 9} fill={colors[key]} fontSize={8}
                      fontFamily="Roboto" textAnchor="middle" fontWeight="700">{last}</text>
                  </>
                );
              })()}
            </React.Fragment>
          ))}
        </svg>
        {/* X labels */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, paddingLeft: PX, paddingRight: PX }}>
          {months.map(m => (
            <span key={m} style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "Roboto" }}>{m}</span>
          ))}
        </div>
      </div>

      {/* Summary row */}
      <div style={{ display: "flex", borderTop: "1px solid var(--border-soft)" }}>
        {[
          { label: "Total Leads", val: "1,840", delta: "+18.2%", icon: "bi-funnel", color: "#0C4461" },
          { label: "Meetings Held", val: "832", delta: "+12.4%", icon: "bi-calendar-check", color: "#78B833" },
          { label: "Deals Closed", val: "220", delta: "+8.8%", icon: "bi-trophy", color: "#D5691F" },
        ].map((item, i) => (
          <div key={i} style={{
            flex: 1, padding: "10px 14px",
            borderRight: i < 2 ? "1px solid var(--border-soft)" : "none",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              <i className={`bi ${item.icon}`} style={{ color: item.color, fontSize: 13 }} />
              <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "Roboto" }}>{item.label}</span>
            </div>
            <div style={{ fontFamily: "Roboto", fontSize: 20, fontWeight: 900, color: "var(--text-primary)" }}>{item.val}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#78B833", marginTop: 2 }}>
              <i className="bi bi-arrow-up" /> {item.delta} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>vs last month</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


// ── A4. CRM Rep Leaderboard ───────────────────────────────────────────
const CRMLeaderboard = () => {
  const reps = [
    { name: "Rahul Kumar", deals: 42, rev: "₹18.4 L", rate: 72, trend: +8, avatar: "RK", rank: 1 },
    { name: "Priya Shah", deals: 38, rev: "₹16.2 L", rate: 68, trend: +5, avatar: "PS", rank: 2 },
    { name: "Amit Desai", deals: 31, rev: "₹12.8 L", rate: 61, trend: -2, avatar: "AD", rank: 3 },
    { name: "Neha Mehta", deals: 28, rev: "₹11.0 L", rate: 58, trend: +12, avatar: "NM", rank: 4 },
    { name: "Vikram Pawar", deals: 22, rev: "₹8.4 L", rate: 44, trend: -4, avatar: "VP", rank: 5 },
  ];
  const rankColors = ["#FECC00", "#8fa3b8", "#D5691F", "var(--text-muted)", "var(--text-muted)"];
  const rankIcons = ["bi-trophy-fill", "bi-award-fill", "bi-patch-check-fill", "", ""];
  const avatarBg = ["#0C4461", "#78B833", "#D5691F", "#66C3D0", "#0B7636"];

  return (
    <div className="fuma-panel">
      <div className="panel-header">
        <div className="panel-title">
          <i className="bi bi-bar-chart-steps" /> Sales Rep Leaderboard
        </div>
        <span className="tag-pill tag-yellow">This Month</span>
      </div>
      <div style={{ padding: "8px 14px" }}>
        {reps.map((rep, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "10px 10px",
            borderRadius: 8,
            marginBottom: 4,
            background: i === 0 ? "rgba(254,204,0,0.06)" : "transparent",
            border: `1px solid ${i === 0 ? "rgba(254,204,0,0.2)" : "transparent"}`,
            transition: "all 0.15s",
            cursor: "pointer",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-card-alt)"}
            onMouseLeave={e => e.currentTarget.style.background = i === 0 ? "rgba(254,204,0,0.06)" : "transparent"}
          >
            {/* Rank */}
            <div style={{ width: 22, textAlign: "center", flexShrink: 0 }}>
              {rankIcons[i] ? (
                <i className={`bi ${rankIcons[i]}`} style={{ color: rankColors[i], fontSize: 14 }} />
              ) : (
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", fontFamily: "Roboto" }}>#{rep.rank}</span>
              )}
            </div>
            {/* Avatar */}
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: avatarBg[i],
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, color: "white", flexShrink: 0,
              fontFamily: "Roboto",
            }}>{rep.avatar}</div>
            {/* Name */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{rep.name}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{rep.deals} deals · {rep.rev}</div>
            </div>
            {/* Progress bar */}
            <div style={{ width: 80 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 9, color: "var(--text-muted)" }}>Win rate</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-primary)", fontFamily: "Roboto" }}>{rep.rate}%</span>
              </div>
              <div style={{ height: 5, background: "var(--border-color)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{
                  width: `${rep.rate}%`, height: "100%", borderRadius: 3,
                  background: i === 0
                    ? "linear-gradient(90deg, #D5691F, #FECC00)"
                    : i === 1
                      ? "linear-gradient(90deg, #0B7636, #78B833)"
                      : "linear-gradient(90deg, #082f44, #0C4461)",
                }} />
              </div>
            </div>
            {/* Trend */}
            <div style={{
              display: "flex", alignItems: "center", gap: 2,
              fontSize: 11, fontWeight: 700, fontFamily: "Roboto",
              color: rep.trend > 0 ? "#78B833" : "#dc3545",
              width: 36, textAlign: "right",
            }}>
              <i className={`bi bi-arrow-${rep.trend > 0 ? "up" : "down"}-short`} style={{ fontSize: 14 }} />
              {Math.abs(rep.trend)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


// ══════════════════════════════════════════════════════════════════════
//  SECTION B — HRM GRAPHICAL COMPONENTS
// ══════════════════════════════════════════════════════════════════════

// ── B1. Attendance Heatmap (Monthly) ──────────────────────────────────
const HRAttendanceHeatmap = () => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeks = ["Wk1", "Wk2", "Wk3", "Wk4"];
  // Mock pct per cell
  const data = [
    [98, 96, 97, 95, 94, 72],
    [97, 98, 95, 96, 93, 68],
    [96, 94, 98, 97, 95, 70],
    [99, 97, 96, 94, 92, 65],
  ];
  const getColor = pct => {
    if (pct >= 98) return "#0B7636";
    if (pct >= 95) return "#78B833";
    if (pct >= 90) return "#a3d463";
    if (pct >= 80) return "#FECC00";
    if (pct >= 70) return "#D5691F";
    return "#dc3545";
  };

  return (
    <div className="fuma-panel">
      <div className="panel-header">
        <div className="panel-title">
          <i className="bi bi-calendar-week" /> Attendance Heatmap — April 2026
        </div>
        <span className="tag-pill tag-green">94.2% avg</span>
      </div>
      <div style={{ padding: "14px 18px" }}>
        {/* Day labels */}
        <div style={{ display: "flex", gap: 0, marginLeft: 36, marginBottom: 6 }}>
          {days.map(d => (
            <div key={d} style={{
              flex: 1, textAlign: "center", fontSize: 10, fontWeight: 700,
              color: "var(--text-muted)", fontFamily: "Roboto"
            }}>{d}</div>
          ))}
        </div>
        {/* Grid */}
        {data.map((row, wi) => (
          <div key={wi} style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 6 }}>
            <div style={{ width: 30, fontSize: 10, color: "var(--text-muted)", fontFamily: "Roboto", flexShrink: 0 }}>
              {weeks[wi]}
            </div>
            {row.map((pct, di) => (
              <div key={di} style={{ flex: 1, margin: "0 2px" }}>
                <div
                  title={`${days[di]} ${weeks[wi]}: ${pct}% attendance`}
                  style={{
                    height: 36, borderRadius: 6,
                    background: getColor(pct),
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 700, color: "white", fontFamily: "Roboto",
                    cursor: "pointer", transition: "all 0.15s",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                    opacity: di === 5 ? 0.7 : 1,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.08)"; e.currentTarget.style.zIndex = 10; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.zIndex = 1; }}
                >
                  {pct}%
                </div>
              </div>
            ))}
          </div>
        ))}
        {/* Legend */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
          {[["≥98%", "#0B7636"], ["≥95%", "#78B833"], ["≥90%", "#a3d463"], ["≥80%", "#FECC00"], ["≥70%", "#D5691F"], ["<70%", "#dc3545"]].map(([l, c]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
              <span style={{ fontSize: 9, color: "var(--text-muted)" }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


// ── B2. Payroll Cost Waterfall Chart ──────────────────────────────────
const HRPayrollWaterfall = () => {
  const items = [
    { label: "Basic Salary", val: 3200, type: "base", color: "#0C4461" },
    { label: "HRA", val: 480, type: "add", color: "#78B833" },
    { label: "DA", val: 240, type: "add", color: "#66C3D0" },
    { label: "Allowances", val: 180, type: "add", color: "#FECC00" },
    { label: "PF Dedn.", val: -384, type: "deduct", color: "#dc3545" },
    { label: "PT Dedn.", val: -48, type: "deduct", color: "#D5691F" },
    { label: "Net Payroll", val: 3668, type: "total", color: "#0B7636" },
  ];

  const W = 560, H = 100, PAD = 20, barW = 54, gap = 8;
  const maxVal = 4000;
  const baseline = H - PAD;
  let running = 0;

  const bars = items.map((item, i) => {
    const isTotal = item.type === "total";
    const barH = Math.abs(item.val) / maxVal * (H - PAD * 2);
    const x = PAD + i * (barW + gap);
    let y;
    if (isTotal) {
      y = H - PAD - (item.val / maxVal) * (H - PAD * 2);
    } else if (item.type === "base") {
      y = baseline - barH;
      running = item.val;
    } else {
      if (item.val > 0) {
        y = baseline - (running + item.val) / maxVal * (H - PAD * 2);
        running += item.val;
      } else {
        y = baseline - running / maxVal * (H - PAD * 2);
        running += item.val;
      }
    }
    return { ...item, x, y, barH };
  });

  return (
    <div className="fuma-panel">
      <div className="panel-header">
        <div className="panel-title">
          <i className="bi bi-wallet2" /> Payroll Breakdown — April 2026
        </div>
        <span className="tag-pill tag-navy">₹48 L total · 312 employees</span>
      </div>
      <div style={{ padding: "14px 18px 0" }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ overflow: "visible" }}>
          {/* Baseline */}
          <line x1={PAD} y1={baseline} x2={W - PAD} y2={baseline}
            stroke="var(--border-color)" strokeWidth="1" />
          {/* Bars */}
          {bars.map((b, i) => (
            <g key={i}>
              {/* Connector line to next bar */}
              {i < bars.length - 1 && b.type !== "total" && (
                <line
                  x1={b.x + barW} y1={b.type === "deduct" ? b.y : b.y}
                  x2={bars[i + 1].x} y2={b.type === "deduct" ? b.y : b.y}
                  stroke="var(--border-color)" strokeWidth="1" strokeDasharray="3,3"
                />
              )}
              <rect
                x={b.x} y={b.y} width={barW} height={b.barH}
                fill={b.color}
                rx={4}
                opacity={b.type === "total" ? 1 : 0.82}
                style={{ cursor: "pointer", transition: "opacity 0.15s" }}
                onMouseEnter={e => e.target.style.opacity = "1"}
                onMouseLeave={e => e.target.style.opacity = b.type === "total" ? "1" : "0.82"}
              />
              {/* Value label on bar */}
              <text x={b.x + barW / 2} y={b.y - 5}
                fill="var(--text-secondary)" fontSize="8" fontFamily="Roboto"
                textAnchor="middle" fontWeight="700">
                {b.val > 0 ? `+${b.val}` : b.val}L
              </text>
            </g>
          ))}
        </svg>
        {/* X labels */}
        <div style={{ display: "flex", paddingLeft: PAD, gap: gap }}>
          {bars.map(b => (
            <div key={b.label} style={{
              width: barW, textAlign: "center", fontSize: 9,
              color: b.type === "total" ? "#0B7636" : "var(--text-muted)",
              fontFamily: "Roboto", fontWeight: b.type === "total" ? 700 : 400,
              flexShrink: 0
            }}>
              {b.label}
            </div>
          ))}
        </div>
      </div>
      {/* Summary chips */}
      <div style={{ display: "flex", gap: 10, padding: "12px 18px", borderTop: "1px solid var(--border-soft)", marginTop: 8 }}>
        {[["Gross Payroll", "₹48 L", "#0C4461"], ["Total Deductions", "₹6.3 L", "#dc3545"], ["Net Disbursed", "₹41.7 L", "#0B7636"]].map(([l, v, c]) => (
          <div key={l} style={{
            flex: 1, background: "var(--bg-card-alt)", border: "1px solid var(--border-color)",
            borderRadius: 8, padding: "8px 12px"
          }}>
            <div style={{
              fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase",
              letterSpacing: "0.1em", fontFamily: "Roboto", marginBottom: 3
            }}>{l}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: c, fontFamily: "Roboto" }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
};


// ── B3. Employee Lifecycle Funnel (Hiring Pipeline) ───────────────────
const HRHiringPipeline = () => {
  const stages = [
    { label: "Applications", count: 284, color: "#0C4461", pct: 100 },
    { label: "Screened", count: 186, color: "#1a6a9a", pct: 65 },
    { label: "Interviewed", count: 94, color: "#78B833", pct: 33 },
    { label: "Assessment", count: 48, color: "#66C3D0", pct: 17 },
    { label: "Offer Sent", count: 22, color: "#FECC00", pct: 8 },
    { label: "Joined", count: 14, color: "#0B7636", pct: 5 },
  ];

  return (
    <div className="fuma-panel">
      <div className="panel-header">
        <div className="panel-title">
          <i className="bi bi-person-check" /> Hiring Pipeline
        </div>
        <span className="tag-pill tag-teal">14 positions open</span>
      </div>
      <div style={{ padding: "14px 18px" }}>
        {stages.map((s, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Trapezoid-effect via width narrowing */}
              <div style={{
                width: `${s.pct}%`, minWidth: 80,
                background: s.color,
                height: 32,
                borderRadius: 5,
                display: "flex", alignItems: "center",
                padding: "0 12px",
                transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)",
                position: "relative",
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "white", fontFamily: "Roboto", flex: 1 }}>{s.label}</span>
                <span style={{ fontSize: 13, fontWeight: 900, color: "white", fontFamily: "Roboto" }}>{s.count}</span>
              </div>
              {/* Drop rate */}
              {i < stages.length - 1 && (
                <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                  <i className="bi bi-arrow-down" style={{ fontSize: 9 }} />
                  {Math.round(((stages[i].count - stages[i + 1].count) / stages[i].count) * 100)}% drop
                </span>
              )}
            </div>
          </div>
        ))}
        {/* Offer acceptance rate */}
        <div style={{
          marginTop: 12, padding: "10px 14px",
          background: "rgba(120,184,51,0.06)", border: "1px solid rgba(120,184,51,0.2)",
          borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>Offer Acceptance Rate</span>
          <span style={{ fontFamily: "Roboto", fontSize: 20, fontWeight: 900, color: "#78B833" }}>63.6%</span>
        </div>
      </div>
    </div>
  );
};


// ── B4. Workforce Productivity Radar Chart ────────────────────────────
const HRProductivityRadar = () => {
  const metrics = [
    { label: "Attendance", score: 94, benchmark: 90 },
    { label: "Productivity", score: 82, benchmark: 80 },
    { label: "Training", score: 74, benchmark: 75 },
    { label: "Appraisal", score: 88, benchmark: 85 },
    { label: "Retention", score: 91, benchmark: 88 },
    { label: "Satisfaction", score: 79, benchmark: 80 },
  ];

  const cx = 100, cy = 100, maxR = 75, n = metrics.length;
  const toRad = deg => (deg * Math.PI) / 180;
  const getPoint = (idx, r) => {
    const angle = toRad(-90 + (360 / n) * idx);
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1].map(r =>
    metrics.map((_, i) => getPoint(i, maxR * r))
  );

  const dataPath = metrics.map((m, i) => {
    const p = getPoint(i, (m.score / 100) * maxR);
    return `${i === 0 ? "M" : "L"}${p.x},${p.y}`;
  }).join(" ") + " Z";

  const benchPath = metrics.map((m, i) => {
    const p = getPoint(i, (m.benchmark / 100) * maxR);
    return `${i === 0 ? "M" : "L"}${p.x},${p.y}`;
  }).join(" ") + " Z";

  return (
    <div className="fuma-panel">
      <div className="panel-header">
        <div className="panel-title">
          <i className="bi bi-radar" /> Workforce Productivity Radar
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-secondary)" }}>
            <div style={{ width: 14, height: 3, borderRadius: 2, background: "#0C4461" }} /> Team Score
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-secondary)" }}>
            <div style={{ width: 14, height: 3, borderRadius: 2, background: "#D5691F", borderStyle: "dashed", borderWidth: 1, borderColor: "#D5691F", background: "none" }} /> Benchmark
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        {/* Radar */}
        <div style={{ padding: "14px 10px 14px 18px", flexShrink: 0 }}>
          <svg width={200} height={200} viewBox="0 0 200 200">
            <defs>
              <linearGradient id="radarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0C4461" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#78B833" stopOpacity="0.15" />
              </linearGradient>
            </defs>
            {/* Grid rings */}
            {rings.map((ring, ri) => (
              <polygon key={ri}
                points={ring.map(p => `${p.x},${p.y}`).join(" ")}
                fill="none" stroke="var(--border-color)" strokeWidth="1" />
            ))}
            {/* Axis lines */}
            {metrics.map((_, i) => {
              const p = getPoint(i, maxR);
              return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y}
                stroke="var(--border-color)" strokeWidth="1" />;
            })}
            {/* Benchmark area */}
            <polygon points={metrics.map((m, i) => {
              const p = getPoint(i, (m.benchmark / 100) * maxR);
              return `${p.x},${p.y}`;
            }).join(" ")}
              fill="none" stroke="#D5691F" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.7" />
            {/* Data area */}
            <path d={dataPath} fill="url(#radarGrad)" stroke="#0C4461" strokeWidth="2" />
            {/* Data points */}
            {metrics.map((m, i) => {
              const p = getPoint(i, (m.score / 100) * maxR);
              return (
                <circle key={i} cx={p.x} cy={p.y} r={4}
                  fill={m.score >= m.benchmark ? "#78B833" : "#D5691F"}
                  stroke="var(--bg-card)" strokeWidth={2} />
              );
            })}
            {/* Labels */}
            {metrics.map((m, i) => {
              const p = getPoint(i, maxR + 14);
              return (
                <text key={i} x={p.x} y={p.y}
                  textAnchor="middle" dominantBaseline="middle"
                  fill="var(--text-secondary)" fontSize="9" fontFamily="Roboto" fontWeight="600">
                  {m.label}
                </text>
              );
            })}
          </svg>
        </div>

        {/* Metric list */}
        <div style={{ flex: 1, padding: "14px 18px 14px 8px" }}>
          {metrics.map((m, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600 }}>{m.label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{
                    fontFamily: "Roboto", fontSize: 11, fontWeight: 700,
                    color: m.score >= m.benchmark ? "#78B833" : "#D5691F"
                  }}>{m.score}%</span>
                  {m.score >= m.benchmark
                    ? <i className="bi bi-check-circle-fill" style={{ color: "#78B833", fontSize: 11 }} />
                    : <i className="bi bi-exclamation-circle-fill" style={{ color: "#D5691F", fontSize: 11 }} />}
                </div>
              </div>
              <div style={{ height: 5, background: "var(--border-color)", borderRadius: 3, position: "relative", overflow: "hidden" }}>
                <div style={{
                  width: `${m.score}%`, height: "100%", borderRadius: 3,
                  background: m.score >= m.benchmark
                    ? "linear-gradient(90deg,#0B7636,#78B833)"
                    : "linear-gradient(90deg,#b84a10,#D5691F)",
                  transition: "width 1.2s",
                }} />
              </div>
              <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 2 }}>Benchmark: {m.benchmark}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [userEmail, setUserEmail] = useState(null);
  const [userCount, setUserCount] = useState(0);
  const [vendorCount, setVendorCount] = useState(0);
  const [franchiseCount, setFranchiseCount] = useState(0);
  const [notices, setNotices] = useState([]);
  const [activeTab, setActiveTab] = useState("operations");
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  // ── Existing API calls (preserved from original) ──
  useEffect(() => {
    const email = sessionStorage.getItem("userEmail");
    if (email) setUserEmail(email);
  }, []);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_BASE_URL}/user/count`)
      .then(r => r.json()).then(setUserCount)
      .catch(e => console.error("User fetch error:", e));

    fetch(`${process.env.REACT_APP_BASE_URL}/vendor/count`)
      .then(r => r.json()).then(setVendorCount)
      .catch(e => console.error("Vendor fetch error:", e));

    fetch(`${process.env.REACT_APP_BASE_URL}/customer/count`)
      .then(r => r.json()).then(setFranchiseCount)
      .catch(e => console.error("Franchise fetch error:", e));

    axios.get(`${process.env.REACT_APP_BASE_URL}/notice-board/active`)
      .then(r => setNotices(r.data || []))
      .catch(e => console.error("Notice fetch error:", e));
  }, []);

  // ── Dark mode ──
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // ── Animate bars on mount ──
  useEffect(() => {
    const bars = document.querySelectorAll(".prog-bar-fill");
    bars.forEach(b => {
      const w = b.getAttribute("data-width");
      b.style.width = "0%";
      setTimeout(() => { b.style.width = w; }, 400);
    });
  }, [activeTab]);

  // ── Tab config ──
  const TABS = [
    { id: "operations", icon: "bi-gear-wide-connected", label: "Operations", count: MOCK.ops.alerts.filter(a => a.type === "critical").length },
    { id: "sales", icon: "bi-graph-up-arrow", label: "Sales", count: null },
    { id: "crm", icon: "bi-people", label: "CRM", count: MOCK.crm.complaints.length },
    { id: "hr", icon: "bi-person-badge", label: "HR & Payroll", count: null },
    { id: "finance", icon: "bi-currency-rupee", label: "Finance", count: MOCK.finance.outstanding_invoices.filter(i => i.status === "critical").length },
    {
      id: "vendorWorkflow",
      icon: "bi-diagram-3",
      label: "Vendor Workflow"
    },
    {
      id: "inventory",
      icon: "bi-box-seam",
      label: "Inventory"
    }
  ];

  // ── Notice helpers ──
  const catColors = { Announcement: "#0C4461", Achievement: "#78B833", Alert: "#dc3545", Event: "#66C3D0", Policy: "#D5691F", General: "#8fa3b8" };
  const catIcons = { Announcement: "bi-megaphone", Achievement: "bi-trophy", Alert: "bi-exclamation-triangle", Event: "bi-calendar3", Policy: "bi-file-text", General: "bi-info-circle" };
  const timeAgo = (d) => {
    if (!d) return "";
    const s = Math.floor((new Date() - new Date(d)) / 1000);
    if (s < 60) return "Just now";
    const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24); if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  // ── Alert type → style map ──
  const alertCls = { critical: "ali-critical", warning: "ali-warning", info: "ali-info", success: "ali-success" };

  return (
    <div className="fuma-wrapper">


      {/* <aside className="fuma-sidebar">
        <div className="sidebar-logo-area">
          <div className="sidebar-logo-icon">FM</div>
          <div className="sidebar-logo-text">
            <div className="brand-name">FUMA</div>
            <div className="brand-tagline">Manager ERP</div>
            <div className="sidebar-live-pill">
              <div className="live-blink" /> LIVE · FY 26
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Overview</div>
          <div className={`sidebar-nav-item ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}>
            <i className="bi bi-speedometer2 nav-icon" />
            <span className="nav-label">Command Center</span>
          </div>
          <div className="sidebar-nav-item">
            <i className="bi bi-bar-chart-line nav-icon" />
            <span className="nav-label">Analytics</span>
          </div>

          <div className="sidebar-section-label">Modules</div>
          {[
            { id: "finance", icon: "bi-currency-rupee", label: "Finance" },
            { id: "operations", icon: "bi-gear-wide-connected", label: "Operations", badge: 48, badgeCls: "badge-warn-soft" },
            { id: "sales", icon: "bi-graph-up-arrow", label: "Sales & CRM" },
            { id: "hr", icon: "bi-person-badge", label: "HR & Payroll" },
          ].map(item => (
            <div key={item.id}
              className={`sidebar-nav-item ${activeTab === item.id ? "active" : ""}`}
              onClick={() => setActiveTab(item.id)}>
              <i className={`bi ${item.icon} nav-icon`} />
              <span className="nav-label">{item.label}</span>
              {item.badge && <span className={`sidebar-nav-badge ${item.badgeCls}`}>{item.badge}</span>}
            </div>
          ))}

          {[
            { icon: "bi-shop", label: "Vendors" },
            { icon: "bi-building", label: "Franchise", badge: 24, badgeCls: "badge-green-soft" },
            { icon: "bi-truck", label: "Logistics", badge: 7, badgeCls: "badge-danger-soft" },
            { icon: "bi-tools", label: "Service" },
          ].map((item, i) => (
            <div key={i} className="sidebar-nav-item">
              <i className={`bi ${item.icon} nav-icon`} />
              <span className="nav-label">{item.label}</span>
              {item.badge && <span className={`sidebar-nav-badge ${item.badgeCls}`}>{item.badge}</span>}
            </div>
          ))}

          <div className="sidebar-section-label">Governance</div>
          {["bi-shield-check|Compliance", "bi-file-earmark-bar-graph|Reports", "bi-gear|Settings"].map((s, i) => {
            const [icon, label] = s.split("|");
            return (
              <div key={i} className="sidebar-nav-item">
                <i className={`bi ${icon} nav-icon`} />
                <span className="nav-label">{label}</span>
              </div>
            );
          })}
        </nav>

        <div className="sidebar-user-footer">
          <div className="sidebar-user-chip">
            <div className="user-avatar-circle">SK</div>
            <div>
              <div className="user-info-name">Suresh Kumar</div>
              <div className="user-info-role">CEO · All Access</div>
            </div>
          </div>
        </div>
      </aside> */}

      {/* ══════════ MAIN ══════════ */}
      <main className="fuma-main">

        {/* ── TOPBAR ── */}
        <div className="fuma-topbar">
          <div className="topbar-left">
            <div>
              <div className="topbar-page-title">
                <i className="bi bi-lightning-charge-fill" style={{ color: "var(--fuma-green)", marginRight: 6 }} />
                FUMA ERP Dashboard
              </div>
              <div className="topbar-breadcrumb">
                Welcome, <span>{userEmail || "Manager"}</span>
              </div>
            </div>
          </div>
          <div className="topbar-right">
            <div className="topbar-chip">
              <i className="bi bi-calendar3" />
              <select>
                <option>FY 2025–26</option>
                <option>FY 2024–25</option>
              </select>
            </div>
            <div className="topbar-chip">
              <i className="bi bi-building" />
              <select>
                <option>All Branches</option>
                <option>Pune HQ</option>
                <option>Mumbai</option>
                <option>Nashik</option>
              </select>
            </div>
            <div className="topbar-icon-btn" title="Notifications">
              <i className="bi bi-bell" />
              <div className="topbar-notif-dot" />
            </div>
            <div className="topbar-theme-toggle" onClick={() => setDarkMode(d => !d)}
              title="Toggle dark mode">
              <i className={`bi bi-${darkMode ? "sun" : "moon-stars"}`} />
            </div>
            <button className="btn-fuma-primary" onClick={() => { }}>
              <i className="bi bi-download" /> Export
            </button>
          </div>
        </div>

        {/* ── PAGE BODY ── */}
        <div className="fuma-page-body">

          {/* ─── TOP 3 STAT CARDS (API-driven) ─── */}
          <div className="fuma-kpi-strip anim-1">
            {/* Users */}
            <div className="fuma-stat-card stat-card-users">
              <div className="stat-card-body">
                <div>
                  <div className="stat-card-value">{userCount}</div>
                  <div className="stat-card-label">User Registrations</div>
                  <div className="stat-card-trend">
                    <i className="bi bi-arrow-up-circle-fill" /> Live from system
                  </div>
                </div>
                <div className="stat-card-icon-wrap" onClick={() => navigate("/Users")}>
                  <i className="bi bi-person-plus-fill" />
                </div>
              </div>
              <div className="stat-card-footer" onClick={() => navigate("/Users")}>
                More info <i className="bi bi-arrow-right" />
              </div>
            </div>

            {/* Vendors */}
            <div className="fuma-stat-card stat-card-vendors">
              <div className="stat-card-body">
                <div>
                  <div className="stat-card-value">{vendorCount}</div>
                  <div className="stat-card-label">Vendor Registrations</div>
                  <div className="stat-card-trend">
                    <i className="bi bi-check2-circle" /> All active vendors
                  </div>
                </div>
                <div className="stat-card-icon-wrap" onClick={() => navigate("/Vendor")}>
                  <i className="bi bi-shop" />
                </div>
              </div>
              <div className="stat-card-footer" onClick={() => navigate("/Vendor")}>
                More info <i className="bi bi-arrow-right" />
              </div>
            </div>

            {/* Franchise */}
            <div className="fuma-stat-card stat-card-franchise">
              <div className="stat-card-body">
                <div>
                  <div className="stat-card-value">{franchiseCount}</div>
                  <div className="stat-card-label">Franchise Registrations</div>
                  <div className="stat-card-trend">
                    <i className="bi bi-geo-alt-fill" /> Multi-city network
                  </div>
                </div>
                <div className="stat-card-icon-wrap" onClick={() => navigate("/Customer")}>
                  <i className="bi bi-building" />
                </div>
              </div>
              <div className="stat-card-footer" onClick={() => navigate("/Customer")}>
                More info <i className="bi bi-arrow-right" />
              </div>
            </div>
          </div>

          {/* ─── DASHBOARD TAB NAV ─── */}
          <div className="fuma-dash-tabs anim-2">
            {TABS.map(tab => (
              <button key={tab.id}
                className={`dash-tab-btn ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}>
                <i className={`bi ${tab.icon} tab-icon`} />
                {tab.label}
                {tab.count > 0 && <span className="dash-tab-count">{tab.count}</span>}
              </button>
            ))}
          </div>

          {/* ════════════════════════════════════
              OPERATIONS DASHBOARD
          ════════════════════════════════════ */}
          <div className={`dash-section ${activeTab === "operations" ? "active" : ""}`}>
            {/* Mini KPIs */}
            <div className="grid-4 anim-3" style={{ marginBottom: 16 }}>
              <MiniKpi label="Pending POs" value={MOCK.ops.pendingPOs} delta="5 new today" deltaType="warn" period="" icon="bi-clipboard-check" color="#D5691F"
                sparkData={[40, 55, 48, 62, 58, 70, 65, 80]} />
              <MiniKpi label="Dispatched Today" value={MOCK.ops.dispatchToday} delta="↑ 12%" deltaType="up" period="vs yesterday" icon="bi-truck" color="#78B833"
                sparkData={[30, 45, 38, 55, 60, 70, 65, 90]} />
              <MiniKpi label="Stock Movements" value="1,240" delta="↑ 8.4%" deltaType="up" period="this week" icon="bi-arrow-left-right" color="#0C4461"
                sparkData={[50, 60, 55, 65, 58, 72, 68, 85]} />
              <MiniKpi label="GRN Today" value={MOCK.ops.grn} delta="48 in QC" deltaType="warn" period="" icon="bi-box-arrow-in-down" color="#FECC00"
                sparkData={[30, 40, 35, 45, 50, 48, 55, 60]} />
            </div>



            {/* Pipeline */}
            <div className="fuma-panel anim-3" style={{ marginBottom: 16 }}>
              <div className="panel-header">
                <div>
                  <div className="panel-title">
                    <i className="bi bi-diagram-3" /> Warehouse Operations Pipeline — Today
                  </div>
                  <div className="panel-subtitle">Real-time flow from GRN to collection</div>
                </div>
                <span className="tag-pill tag-teal">
                  <i className="bi bi-circle-fill" style={{ fontSize: 6 }} /> Live Flow
                </span>
              </div>
              <div className="fuma-pipeline">
                {MOCK.ops.pipeline.map((step, i) => (
                  <React.Fragment key={i}>
                    <div className="pipe-node">
                      <div className={`pipe-box ${step.warn ? "alert-node" : ""}`}>
                        <i className={`bi ${step.icon} pipe-icon`} />
                        <span className="pipe-stage">{step.stage}</span>
                        <span className={`pipe-num ${step.warn ? "warn" : ""}`}>{step.count}</span>
                      </div>
                    </div>
                    {i < MOCK.ops.pipeline.length - 1 && (
                      <span className="pipe-arrow">
                        <i className="bi bi-chevron-right" />
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Inventory + Alerts */}
            <div className="grid-2 anim-4" style={{ marginBottom: 16 }}>
              <div className="fuma-panel">
                <div className="panel-header">
                  <div className="panel-title"><i className="bi bi-boxes" /> Inventory Health</div>
                  <span className="tag-pill tag-green">97.3% accuracy</span>
                </div>
                <div style={{ padding: "14px 18px" }}>
                  {MOCK.ops.inventory.map((item, i) => (
                    <div className="prog-bar-item" key={i}>
                      <div className="prog-bar-meta">
                        <span className="prog-bar-label">{item.label}</span>
                        <span className="prog-bar-val" style={item.pct <= 5 ? { color: "#dc3545" } : {}}>{item.pct}%</span>
                      </div>
                      <div className="prog-bar-track">
                        <div className={`prog-bar-fill ${item.cls}`}
                          data-width={`${item.pct}%`} style={{ width: `${item.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="fuma-panel">
                <div className="panel-header">
                  <div>
                    <div className="panel-title"><i className="bi bi-bell" /> Live Alerts</div>
                    <div className="panel-subtitle">Critical items needing action</div>
                  </div>
                  <span className="tag-pill tag-red">
                    {MOCK.ops.alerts.filter(a => a.type === "critical").length} critical
                  </span>
                </div>
                <div style={{ padding: "8px 12px" }}>
                  {MOCK.ops.alerts.map((alert, i) => (
                    <div key={i} className={`alert-list-item ${alertCls[alert.type] || "ali-info"}`}>
                      <div className="ali-dot" />
                      <div>
                        <div className="ali-msg">{alert.msg}</div>
                        <div className="ali-meta">{alert.time} · <em>{alert.src}</em></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* PO Table */}
            <div className="fuma-panel anim-5">
              <div className="panel-header">
                <div className="panel-title"><i className="bi bi-clipboard-check" /> Open Purchase Orders</div>
                <span className="tag-pill tag-yellow">
                  {MOCK.ops.poTable.filter(p => p.status === "pending").length} need approval
                </span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="fuma-table">
                  <thead>
                    <tr>
                      <th>PO Code</th><th>Vendor</th><th>Item Category</th>
                      <th>Amount</th><th>Status</th><th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK.ops.poTable.map((po, i) => (
                      <tr key={i}>
                        <td className="td-code">{po.code}</td>
                        <td className="td-bold">{po.vendor}</td>
                        <td>{po.item}</td>
                        <td className="td-bold">{po.amt}</td>
                        <td><StatusPill status={po.status} /></td>
                        <td>
                          <button style={{
                            background: "none", border: "1px solid var(--border-color)",
                            borderRadius: 6, padding: "3px 10px", fontSize: 11,
                            color: "var(--text-secondary)", cursor: "pointer"
                          }}>
                            <i className="bi bi-eye" /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════
              SALES DASHBOARD
          ════════════════════════════════════ */}
          <div className={`dash-section ${activeTab === "sales" ? "active" : ""}`}>
            <div className="grid-4 anim-3" style={{ marginBottom: 16 }}>
              <MiniKpi label="Total Revenue" value={MOCK.sales.revenue} delta="↑ 22.3%" deltaType="up" period="vs LQ" icon="bi-currency-rupee" color="#78B833"
                sparkData={[30, 38, 44, 41, 48, 55, 52, 65]} />
              <MiniKpi label="Orders Processed" value={MOCK.sales.orders} delta="↑ 14.7%" deltaType="up" period="this month" icon="bi-bag-check" color="#0C4461"
                sparkData={[40, 55, 48, 62, 58, 75, 68, 90]} />
              <MiniKpi label="Sales Target" value={MOCK.sales.target} delta="85.5% achieved" deltaType="warn" period="" icon="bi-bullseye" color="#D5691F"
                sparkData={[60, 65, 70, 68, 72, 78, 80, 85]} />
              <MiniKpi label="Avg Deal Size" value={MOCK.sales.avgDeal} delta="↑ 8.2%" deltaType="up" period="vs LQ" icon="bi-receipt" color="#66C3D0"
                sparkData={[50, 55, 52, 58, 60, 65, 62, 70]} />
            </div>

            <div className="grid-3-2 anim-4" style={{ marginBottom: 16 }}>
              <div className="fuma-panel">
                <div className="panel-header">
                  <div className="panel-title"><i className="bi bi-graph-up" /> Monthly Revenue Trend</div>
                  <div className="panel-actions">
                    <span className="tag-pill tag-green">↑ 22.3% YoY</span>
                  </div>
                </div>
                <SalesAreaChart data={MOCK.sales.chartData} months={MOCK.sales.chartMonths} />
                <div style={{ display: "flex", gap: 16, padding: "8px 18px 14px", borderTop: "1px solid var(--border-soft)" }}>
                  {[["Peak", "₹75 L", "#78B833"], ["Avg", "₹57 L", ""], ["Forecast", "₹80 L", "#78B833"]].map(([l, v, c]) => (
                    <div key={l}>
                      <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "Roboto" }}>
                        {l}
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: c || "var(--text-primary)", fontFamily: "Roboto" }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="fuma-panel">
                <div className="panel-header">
                  <div className="panel-title"><i className="bi bi-bar-chart" /> Top Products</div>
                  <span className="tag-pill tag-navy">by Revenue</span>
                </div>
                <div style={{ padding: "14px 18px" }}>
                  {MOCK.sales.topProducts.map((p, i) => (
                    <div className="prog-bar-item" key={i}>
                      <div className="prog-bar-meta">
                        <span className="prog-bar-label">{p.name}</span>
                        <span className="prog-bar-val">{p.rev}</span>
                      </div>
                      <div className="prog-bar-track">
                        <div className={`prog-bar-fill ${p.cls}`}
                          data-width={`${p.pct}%`} style={{ width: `${p.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="fuma-panel anim-5">
              <div className="panel-header">
                <div className="panel-title"><i className="bi bi-shop-window" /> Dealer / Franchise Orders</div>
                <span className="tag-pill tag-green">{MOCK.sales.dealerOrders.length} active dealers</span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="fuma-table">
                  <thead>
                    <tr><th>Dealer Name</th><th>Orders (Month)</th><th>Revenue</th><th>Status</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {MOCK.sales.dealerOrders.map((d, i) => (
                      <tr key={i}>
                        <td className="td-bold">{d.dealer}</td>
                        <td>{d.orders}</td>
                        <td className="td-green">{d.amt}</td>
                        <td><StatusPill status={d.status} /></td>
                        <td>
                          <button style={{ background: "none", border: "1px solid var(--border-color)", borderRadius: 6, padding: "3px 10px", fontSize: 11, color: "var(--text-secondary)", cursor: "pointer" }}>
                            <i className="bi bi-eye" /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════
              CRM DASHBOARD
          ════════════════════════════════════ */}
          <div className={`dash-section ${activeTab === "crm" ? "active" : ""}`}>
            <div className="grid-4 anim-3" style={{ marginBottom: 16 }}>
              <MiniKpi label="Total Leads" value={MOCK.crm.leads} delta="↑ 18.2%" deltaType="up" period="this month" icon="bi-funnel" color="#0C4461"
                sparkData={[40, 55, 48, 62, 58, 70, 65, 85]} />
              <MiniKpi label="Converted" value={MOCK.crm.converted} delta="12% win rate" deltaType="up" period="" icon="bi-trophy" color="#78B833"
                sparkData={[20, 25, 22, 28, 24, 30, 28, 35]} />
              <MiniKpi label="Follow-ups" value={MOCK.crm.followUps} delta="42 due today" deltaType="warn" period="" icon="bi-telephone-forward" color="#D5691F"
                sparkData={[50, 60, 55, 65, 58, 72, 68, 80]} />
              <MiniKpi label="Complaints" value={MOCK.crm.complaints.length} delta="↑ 3 new" deltaType="down" period="this week" icon="bi-chat-left-dots" color="#dc3545"
                sparkData={[8, 10, 7, 12, 9, 14, 11, 18]} />
            </div>
            <div className="grid-2" style={{ marginBottom: 16 }}>
              <CRMLeadSourceChart />
              <CRMConversionGauge />
            </div>
            <div style={{ marginBottom: 16 }}>
              <CRMTrendChart />
            </div>
            <div style={{ marginBottom: 16 }}>
              <CRMLeaderboard />
            </div>


            <div className="grid-2 anim-4" style={{ marginBottom: 16 }}>
              {/* Funnel */}
              <div className="fuma-panel">
                <div className="panel-header">
                  <div className="panel-title"><i className="bi bi-funnel-fill" /> Sales Pipeline Funnel</div>
                  <span className="tag-pill tag-navy">₹3.4 Cr pipeline</span>
                </div>
                <div style={{ padding: "16px 18px" }}>
                  {MOCK.crm.funnel.map((f, i) => (
                    <div className="funnel-row" key={i}>
                      <span className="funnel-label">{f.label}</span>
                      <div className="funnel-bar-wrap" style={{ flex: 1 }}>
                        <div className="funnel-bar-inner"
                          style={{ width: `${f.pct}%`, background: f.color, minWidth: 80 }}>
                          {f.count}
                          <span className="funnel-count">({f.pct}%)</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 10, padding: "10px 18px 14px", borderTop: "1px solid var(--border-soft)" }}>
                  {[["Win Rate", "62%", "#78B833"], ["Avg Days", "24 d", "var(--fuma-orange)"], ["Forecast", "₹1.2 Cr", "#0C4461"]].map(([l, v, c]) => (
                    <div key={l} style={{ flex: 1, background: "var(--bg-card-alt)", border: "1px solid var(--border-color)", borderRadius: 8, padding: "8px 10px" }}>
                      <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "Roboto" }}>{l}</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: c, fontFamily: "Roboto" }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Complaints */}
              <div className="fuma-panel">
                <div className="panel-header">
                  <div className="panel-title"><i className="bi bi-chat-left-text" /> Active Complaints</div>
                  <span className="tag-pill tag-red">{MOCK.crm.complaints.length} open</span>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table className="fuma-table">
                    <thead>
                      <tr><th>ID</th><th>Customer</th><th>Issue</th><th>Priority</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {MOCK.crm.complaints.map((c, i) => (
                        <tr key={i}>
                          <td className="td-code">{c.id}</td>
                          <td className="td-bold">{c.customer}</td>
                          <td style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.issue}</td>
                          <td><StatusPill status={c.priority} /></td>
                          <td><StatusPill status={c.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Recent Leads */}
            <div className="fuma-panel anim-5">
              <div className="panel-header">
                <div className="panel-title"><i className="bi bi-people" /> Recent Leads</div>
                <span className="tag-pill tag-green">{MOCK.crm.recentLeads.length} this week</span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="fuma-table">
                  <thead>
                    <tr><th>Lead Name</th><th>Source</th><th>Est. Value</th><th>Assigned To</th><th>Status</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {MOCK.crm.recentLeads.map((l, i) => (
                      <tr key={i}>
                        <td className="td-bold">{l.name}</td>
                        <td>
                          <span className="tag-pill tag-teal" style={{ fontSize: 10 }}>{l.source}</span>
                        </td>
                        <td className="td-green">{l.value}</td>
                        <td>{l.assigned}</td>
                        <td><StatusPill status={l.status} /></td>
                        <td>
                          <button style={{ background: "none", border: "1px solid var(--border-color)", borderRadius: 6, padding: "3px 10px", fontSize: 11, color: "var(--text-secondary)", cursor: "pointer" }}>
                            <i className="bi bi-arrow-right-circle" /> Follow-up
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════
              HR DASHBOARD
          ════════════════════════════════════ */}
          <div className={`dash-section ${activeTab === "hr" ? "active" : ""}`}>
            <div className="grid-4 anim-3" style={{ marginBottom: 16 }}>
              <MiniKpi label="Total Employees" value={MOCK.hr.totalStaff} delta="+8 joining" deltaType="up" period="this month" icon="bi-people" color="#0C4461"
                sparkData={[60, 65, 70, 68, 72, 78, 80, 90]} />
              <MiniKpi label="Attendance Today" value={`${MOCK.hr.attendance}%`} delta="294 present" deltaType="up" period="" icon="bi-calendar-check" color="#78B833"
                sparkData={[85, 88, 90, 87, 92, 91, 94, 94]} />
              <MiniKpi label="Monthly Payroll" value={MOCK.hr.payroll} delta="Processed 1st" deltaType="up" period="" icon="bi-wallet2" color="#D5691F"
                sparkData={[40, 42, 44, 43, 45, 46, 47, 48]} />
              <MiniKpi label="Open Positions" value={MOCK.hr.openPos} delta="6 final round" deltaType="warn" period="" icon="bi-person-plus" color="#FECC00"
                sparkData={[8, 10, 12, 11, 13, 14, 13, 14]} />
            </div>


            {/* HR Charts */}
            <div style={{ marginBottom: 16 }}>
              <HRAttendanceHeatmap />
            </div>

            <div className="grid-2" style={{ marginBottom: 16 }}>
              <HRHiringPipeline />
              <HRProductivityRadar />
            </div>

            <div style={{ marginBottom: 16 }}>
              <HRPayrollWaterfall />
            </div>

            <div className="grid-2 anim-4" style={{ marginBottom: 16 }}>
              {/* Dept Breakdown */}
              <div className="fuma-panel">
                <div className="panel-header">
                  <div className="panel-title"><i className="bi bi-diagram-2" /> Department Headcount</div>
                  <span className="tag-pill tag-navy">312 total</span>
                </div>
                <div style={{ padding: "14px 18px" }}>
                  {MOCK.hr.depts.map((d, i) => (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }} key={i}>
                      <span style={{ width: 110, fontSize: 12, color: "var(--text-secondary)", fontWeight: 600, flexShrink: 0 }}>{d.name}</span>
                      <div style={{ flex: 1 }}>
                        <div className="prog-bar-track">
                          <div className={`prog-bar-fill ${d.cls}`}
                            data-width={`${d.pct}%`} style={{ width: `${d.pct}%` }} />
                        </div>
                      </div>
                      <span style={{ fontFamily: "Roboto", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", width: 28, textAlign: "right" }}>{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Leave Today */}
              <div className="fuma-panel">
                <div className="panel-header">
                  <div className="panel-title"><i className="bi bi-calendar3" /> Leave Requests — Today</div>
                  <span className="tag-pill tag-orange">{MOCK.hr.leaveToday.length} requests</span>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table className="fuma-table">
                    <thead>
                      <tr><th>Employee</th><th>Department</th><th>Type</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {MOCK.hr.leaveToday.map((l, i) => (
                        <tr key={i}>
                          <td className="td-bold">{l.name}</td>
                          <td>{l.dept}</td>
                          <td>{l.type}</td>
                          <td><StatusPill status={l.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Donut summary */}
                <div className="donut-wrap">
                  <DonutChart size={110} segments={[
                    { value: 86, color: "#78B833" }, { value: 68, color: "#0C4461" },
                    { value: 54, color: "#D5691F" }, { value: 42, color: "#66C3D0" },
                    { value: 38, color: "#FECC00" }, { value: 24, color: "#dc3545" },
                  ]} />
                  <div className="donut-legend-list">
                    {MOCK.hr.depts.map((d, i) => (
                      <div className="donut-legend-item" key={i}>
                        <div className="donut-legend-swatch"
                          style={{ background: ["#78B833", "#0C4461", "#D5691F", "#66C3D0", "#FECC00", "#dc3545"][i] }} />
                        {d.name}
                        <span className="donut-legend-val">{d.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="fuma-panel anim-5">
              <div className="panel-header">
                <div className="panel-title"><i className="bi bi-activity" /> Recent HR Activity</div>
                <span className="tag-pill tag-teal">Live Feed</span>
              </div>
              <div style={{ padding: "10px 18px" }}>
                {MOCK.hr.recentActivity.map((a, i) => (
                  <div className="activity-item" key={i}>
                    <div className="activity-avatar" style={{ background: a.bg }}>{a.initials}</div>
                    <div>
                      <div className="activity-text"
                        dangerouslySetInnerHTML={{ __html: a.text }} />
                      <div className="activity-time">
                        <i className="bi bi-clock" style={{ marginRight: 4 }} />{a.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════
              FINANCE DASHBOARD
          ════════════════════════════════════ */}
          <div className={`dash-section ${activeTab === "finance" ? "active" : ""}`}>
            <div className="grid-4 anim-3" style={{ marginBottom: 16 }}>
              <MiniKpi label="Total Revenue" value={MOCK.finance.revenue} delta="↑ 22.3%" deltaType="up" period="vs LQ" icon="bi-graph-up-arrow" color="#78B833"
                sparkData={[30, 38, 44, 48, 55, 52, 60, 68]} />
              <MiniKpi label="Total Expenses" value={MOCK.finance.expenses} delta="↑ 8.1%" deltaType="warn" period="vs LQ" icon="bi-cash-stack" color="#D5691F"
                sparkData={[22, 26, 29, 28, 31, 34, 33, 40]} />
              <MiniKpi label="Gross Profit" value={MOCK.finance.gp} delta="↑ 3.2%" deltaType="up" period="margin" icon="bi-pie-chart-fill" color="#0C4461"
                sparkData={[32, 34, 36, 35, 37, 38, 37, 39]} />
              <MiniKpi label="Outstanding AR" value={MOCK.finance.outstanding} delta="42 invoices" deltaType="warn" period="" icon="bi-hourglass-split" color="#FECC00"
                sparkData={[40, 45, 48, 42, 50, 55, 52, 58]} />
            </div>

            <div className="grid-3-2 anim-4" style={{ marginBottom: 16 }}>
              <div className="fuma-panel">
                <div className="panel-header">
                  <div className="panel-title"><i className="bi bi-bar-chart-line" /> Revenue vs Expenses — Monthly</div>
                  <span className="tag-pill tag-green">38.4% GP</span>
                </div>
                <FinanceBarChart data={MOCK.finance.monthly} />
              </div>

              {/* Finance Snapshot */}
              <div className="fuma-panel">
                <div className="panel-header">
                  <div className="panel-title"><i className="bi bi-wallet2" /> Finance Snapshot</div>
                  <span className="tag-pill tag-yellow">Month-end pending</span>
                </div>
                <div style={{ padding: "12px 18px" }}>
                  {[
                    ["Accounts Receivable", "₹2.1 Cr", "42 invoices", "td-orange"],
                    ["Accounts Payable", "₹1.1 Cr", "18 bills due", ""],
                    ["Gross Profit Margin", "38.4%", "↑ vs 35.2% LY", "td-green"],
                    ["Budget Utilisation", "72%", "4 months left", ""],
                    ["Overdue Invoices", "₹48 L", "3 critical > 30d", "td-red"],
                  ].map(([l, v, s, c]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border-soft)" }}>
                      <div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>{l}</div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{s}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontFamily: "Roboto", fontSize: 13, fontWeight: 700 }}
                          className={c}>{v}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Outstanding + GST */}
            <div className="grid-2 anim-5">
              <div className="fuma-panel">
                <div className="panel-header">
                  <div className="panel-title"><i className="bi bi-receipt" /> Outstanding Invoices</div>
                  <span className="tag-pill tag-red">
                    {MOCK.finance.outstanding_invoices.filter(i => i.status === "critical").length} critical
                  </span>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table className="fuma-table">
                    <thead>
                      <tr><th>Invoice</th><th>Customer</th><th>Amount</th><th>Overdue Days</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {MOCK.finance.outstanding_invoices.map((inv, i) => (
                        <tr key={i}>
                          <td className="td-code">{inv.inv}</td>
                          <td className="td-bold">{inv.customer}</td>
                          <td className={inv.status === "critical" ? "td-red" : "td-orange"}>{inv.amt}</td>
                          <td>
                            <span style={{ fontFamily: "Roboto", fontWeight: 700, color: inv.days > 14 ? "#dc3545" : inv.days > 7 ? "var(--fuma-orange)" : "var(--text-primary)" }}>
                              {inv.days} days
                            </span>
                          </td>
                          <td><StatusPill status={inv.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="fuma-panel">
                <div className="panel-header">
                  <div className="panel-title"><i className="bi bi-file-earmark-text" /> GST Summary</div>
                  <span className="tag-pill tag-teal">GSTIN Compliant</span>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table className="fuma-table">
                    <thead>
                      <tr><th>Period</th><th>Output GST</th><th>Input GST</th><th>Net Payable</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {MOCK.finance.gst.map((g, i) => (
                        <tr key={i}>
                          <td className="td-bold">{g.period}</td>
                          <td>{g.sales_gst}</td>
                          <td>{g.purchase_gst}</td>
                          <td className="td-green">{g.net}</td>
                          <td><StatusPill status={g.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* VENDOR WORKFLOW DASHBOARD */}
          <div
            className={`dash-section ${activeTab === "vendorWorkflow" ? "active" : ""
              }`}
          >
            <VendorWarehouseWorkflow />
          </div>
          {/* Inventory  DASHBOARD */}
          <div
            className={`dash-section ${activeTab === "inventory" ? "active" : ""
              }`}
          >
            <InventoryManagement />
          </div>


          {/* ─── ANNOUNCEMENTS (always visible, bottom) ─── */}
          <div className="fuma-panel anim-5">
            <div className="panel-header">
              <div className="panel-title">
                <i className="bi bi-megaphone" /> Company Announcements
              </div>
              <span className="tag-pill tag-navy">
                {notices.filter(n => n.active).length || 0} Active
              </span>
            </div>
            <div style={{ maxHeight: 280, overflowY: "auto" }}>
              {notices.length === 0 ? (
                <div className="empty-state">
                  <i className="bi bi-clipboard" />
                  <p>No announcements at this time</p>
                </div>
              ) : (
                notices.slice(0, 6).map(notice => (
                  <div key={notice.id} className="announcement-item"
                    style={{ borderLeftColor: catColors[notice.category] || "#8fa3b8" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {notice.pinned && <i className="bi bi-pin-angle-fill" style={{ color: "var(--fuma-yellow)", fontSize: 11 }} />}
                        <span className="tag-pill"
                          style={{
                            background: catColors[notice.category] + "22", color: catColors[notice.category],
                            border: `1px solid ${catColors[notice.category]}44`, fontSize: 10
                          }}>
                          <i className={`bi ${catIcons[notice.category] || "bi-info-circle"}`} style={{ marginRight: 3 }} />
                          {notice.category}
                        </span>
                      </div>
                      <small style={{ fontSize: 10, color: "var(--text-muted)" }}>{timeAgo(notice.createdAt)}</small>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>{notice.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", overflow: "hidden", maxHeight: 36 }}>{notice.content}</div>
                  </div>
                ))
              )}
            </div>
            {notices.length > 6 && (
              <div style={{ padding: "10px 16px", borderTop: "1px solid var(--border-soft)", textAlign: "center" }}>
                <button className="btn-fuma-primary" style={{ fontSize: 11, padding: "5px 14px" }}
                  onClick={() => navigate("/HRMDashboard")}>
                  View All Announcements <i className="bi bi-arrow-right" />
                </button>
              </div>
            )}
          </div>

        </div>{/* /page-body */}
      </main>
    </div>
  );
};

export default Dashboard;
