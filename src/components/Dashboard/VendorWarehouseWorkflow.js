// ══════════════════════════════════════════════════════════════════════════
//  FUMA ERP — VENDOR TO WAREHOUSE WORKFLOW
//  File: VendorWarehouseWorkflow.js
//  Drop-in component for Dashboard.js
//  Brand: #78B833 | #0C4461 | #D5691F | #66C3D0 | #FECC00 | #0B7636
// ══════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef } from "react";

// ══════════════════════════════════════════════════════════════════════════
//  MOCK DATA
// ══════════════════════════════════════════════════════════════════════════
const WORKFLOW_MOCK = {
    // Live PO tracker rows
    poTracker: [
        { id: "PO#9012", dept: "Warehouse", vendor: "Havells India Ltd", item: "Cables & Wires", qty: 2400, value: "₹14.2 L", stage: 2, eta: "03 Jun", priority: "high" },
        { id: "PO#9018", dept: "Sales", vendor: "Schneider Electric", item: "MCB Switchgear", qty: 800, value: "₹8.6 L", stage: 4, eta: "05 Jun", priority: "medium" },
        { id: "PO#9024", dept: "Operations", vendor: "Polycab Wires", item: "LT Cables", qty: 1200, value: "₹6.8 L", stage: 3, eta: "07 Jun", priority: "medium" },
        { id: "PO#9031", dept: "Service", vendor: "ABB India", item: "Circuit Breakers", qty: 400, value: "₹22.4 L", stage: 5, eta: "02 Jun", priority: "high" },
        { id: "PO#9044", dept: "Warehouse", vendor: "Finolex Cables", item: "FR Wires", qty: 3200, value: "₹4.1 L", stage: 6, eta: "Today", priority: "low" },
        { id: "PO#9047", dept: "Finance", vendor: "Legrand India", item: "MCB Distribution", qty: 600, value: "₹11.8 L", stage: 1, eta: "10 Jun", priority: "medium" },
        { id: "PO#9052", dept: "Warehouse", vendor: "Crompton Greaves", item: "Fans & Motors", qty: 240, value: "₹3.2 L", stage: 7, eta: "Done", priority: "low" },
    ],

    // Vendor performance
    vendors: [
        { name: "Havells India Ltd", rating: 4.8, onTime: 96, defect: 0.4, orders: 28, color: "#0C4461" },
        { name: "Schneider Electric", rating: 4.6, onTime: 92, defect: 0.8, orders: 18, color: "#78B833" },
        { name: "Polycab Wires", rating: 4.4, onTime: 88, defect: 1.2, orders: 22, color: "#D5691F" },
        { name: "ABB India", rating: 4.7, onTime: 94, defect: 0.6, orders: 14, color: "#66C3D0" },
        { name: "Finolex Cables", rating: 4.2, onTime: 84, defect: 1.8, orders: 16, color: "#FECC00" },
    ],

    // Warehouse inward trend (last 12 months)
    inwardTrend: [
        { m: "May", grn: 84, rej: 4 }, { m: "Jun", grn: 96, rej: 6 },
        { m: "Jul", grn: 108, rej: 8 }, { m: "Aug", grn: 102, rej: 5 },
        { m: "Sep", grn: 118, rej: 9 }, { m: "Oct", grn: 132, rej: 7 },
        { m: "Nov", grn: 124, rej: 11 }, { m: "Dec", grn: 148, rej: 8 },
        { m: "Jan", grn: 156, rej: 10 }, { m: "Feb", grn: 142, rej: 6 },
        { m: "Mar", grn: 168, rej: 12 }, { m: "Apr", grn: 184, rej: 14 },
    ],

    // KPIs
    kpis: [
        { label: "Open POs", value: "62", delta: "↑ 8 new", type: "warn", icon: "bi-clipboard-check", color: "#D5691F" },
        { label: "POs Awaiting GRN", value: "18", delta: "5 overdue", type: "down", icon: "bi-truck", color: "#dc3545" },
        { label: "Avg Lead Time", value: "6.2 days", delta: "↓ 0.8d", type: "up", icon: "bi-clock-history", color: "#0C4461" },
        { label: "Stock Auto-Updated", value: "184", delta: "Today", type: "up", icon: "bi-arrow-repeat", color: "#78B833" },
    ],

    // Recent activity feed
    activity: [
        { icon: "bi-box-arrow-in-down", color: "#78B833", bg: "rgba(120,184,51,0.1)", text: "GRN#2241 received — <strong>Polycab Wires</strong> · 1,200 units logged to Bin B-04", time: "8 min ago" },
        { icon: "bi-check-circle", color: "#0B7636", bg: "rgba(11,118,54,0.1)", text: "QC Passed — PO#9018 <strong>Schneider MCB</strong> · 798/800 units cleared", time: "42 min ago" },
        { icon: "bi-exclamation-circle", color: "#D5691F", bg: "rgba(213,105,31,0.1)", text: "QC Rejected — <strong>14 units</strong> defective from Finolex batch FR-2024", time: "1 hr ago" },
        { icon: "bi-stack", color: "#0C4461", bg: "rgba(12,68,97,0.1)", text: "Inventory updated — <strong>SKU-EL4821</strong> stock: 12 → 1,212 units", time: "2 hr ago" },
        { icon: "bi-lightning-charge", color: "#FECC00", bg: "rgba(254,204,0,0.1)", text: "Dashboard synced — <strong>All modules</strong> reflecting latest stock data", time: "2 hr ago" },
        { icon: "bi-file-earmark-plus", color: "#66C3D0", bg: "rgba(102,195,208,0.1)", text: "PO#9052 created by <strong>Warehouse Dept</strong> · ₹3.2L · Crompton Greaves", time: "3 hr ago" },
    ],
};

// Workflow step definitions
const WORKFLOW_STEPS = [
    { id: 1, icon: "bi-buildings", label: "Dept. Requisition", short: "PR Raised", desc: "Department raises purchase requirement with quantity & specs", color: "#0C4461", bgColor: "rgba(12,68,97,0.08)" },
    { id: 2, icon: "bi-file-earmark-text", label: "PO Created", short: "PO Created", desc: "Purchase Order generated, sent for manager approval workflow", color: "#1a6a9a", bgColor: "rgba(26,106,154,0.08)" },
    { id: 3, icon: "bi-person-check", label: "Vendor Confirmation", short: "Vendor Conf.", desc: "Vendor acknowledges PO, confirms quantity, price & dispatch ETA", color: "#78B833", bgColor: "rgba(120,184,51,0.08)" },
    { id: 4, icon: "bi-truck", label: "Goods Dispatched", short: "Dispatched", desc: "Vendor dispatches goods with challan; logistics tracking active", color: "#D5691F", bgColor: "rgba(213,105,31,0.08)" },
    { id: 5, icon: "bi-box-arrow-in-down", label: "WH Receiving", short: "WH Inward", desc: "Warehouse team physically receives and counts incoming goods", color: "#66C3D0", bgColor: "rgba(102,195,208,0.08)" },
    { id: 6, icon: "bi-search", label: "QC Verification", short: "QC Check", desc: "Quality team inspects batch — pass/reject/partial acceptance", color: "#FECC00", bgColor: "rgba(254,204,0,0.08)" },
    { id: 7, icon: "bi-arrow-repeat", label: "Inventory Updated", short: "Stock Update", desc: "Accepted stock auto-updated in WMS; SKU-level bin allocation done", color: "#0B7636", bgColor: "rgba(11,118,54,0.08)" },
    { id: 8, icon: "bi-speedometer2", label: "Dashboard Synced", short: "Synced", desc: "All modules — Finance, CRM, Operations — reflect updated data", color: "#78B833", bgColor: "rgba(120,184,51,0.12)" },
];

const STAGE_LABELS = ["", "PR Raised", "PO Created", "Vendor Conf.", "Dispatched", "WH Inward", "QC Done", "Stock Updated", "Synced"];

// ══════════════════════════════════════════════════════════════════════════
//  SUB COMPONENT: Animated Workflow Stepper
// ══════════════════════════════════════════════════════════════════════════
const WorkflowStepper = ({ activeStep, onStepClick }) => {
    return (
        <div style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "var(--shadow-sm)",
            marginBottom: 16,
        }}>
            <div style={{
                padding: "14px 18px",
                borderBottom: "1px solid var(--border-soft)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
                <div>
                    <div style={{
                        fontFamily: "Roboto", fontSize: 13, fontWeight: 700, color: "var(--text-primary)",
                        display: "flex", alignItems: "center", gap: 7
                    }}>
                        <i className="bi bi-diagram-3-fill" style={{ color: "#78B833" }} />
                        Vendor → Warehouse Workflow
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                        Click any step to explore. Currently: <strong style={{ color: WORKFLOW_STEPS[activeStep - 1]?.color }}>{WORKFLOW_STEPS[activeStep - 1]?.label}</strong>
                    </div>
                </div>
                <span style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "3px 9px", borderRadius: 20,
                    background: "rgba(120,184,51,0.12)", color: "#5d9228",
                    border: "1px solid rgba(120,184,51,0.25)",
                    fontSize: 10, fontWeight: 700, fontFamily: "Roboto",
                }}>
                    <span style={{
                        width: 5, height: 5, borderRadius: "50%", background: "#78B833",
                        animation: "liveBlink 1.8s infinite", display: "inline-block"
                    }} />
                    8 Stages · Live
                </span>
            </div>

            {/* Steps row */}
            <div style={{
                display: "flex", alignItems: "stretch",
                overflowX: "auto", padding: "0",
                scrollbarWidth: "none",
            }}>
                {WORKFLOW_STEPS.map((step, i) => {
                    const isActive = activeStep === step.id;
                    const isComplete = activeStep > step.id;
                    const isNext = activeStep === step.id - 1;

                    return (
                        <React.Fragment key={step.id}>
                            <div
                                onClick={() => onStepClick(step.id)}
                                style={{
                                    flex: "0 0 120px",
                                    padding: "16px 10px 14px",
                                    textAlign: "center",
                                    cursor: "pointer",
                                    background: isActive
                                        ? step.bgColor
                                        : isComplete
                                            ? "rgba(120,184,51,0.04)"
                                            : "var(--bg-card)",
                                    borderBottom: isActive ? `3px solid ${step.color}` : "3px solid transparent",
                                    transition: "all 0.2s",
                                    position: "relative",
                                }}
                                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--bg-card-alt)"; }}
                                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = isComplete ? "rgba(120,184,51,0.04)" : "var(--bg-card)"; }}
                            >
                                {/* Step number badge */}
                                <div style={{
                                    position: "absolute", top: 8, right: 8,
                                    width: 16, height: 16, borderRadius: "50%",
                                    background: isComplete ? "#78B833" : isActive ? step.color : "var(--border-color)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 8, fontWeight: 700, color: "white",
                                    fontFamily: "Roboto",
                                    transition: "background 0.3s",
                                }}>
                                    {isComplete ? <i className="bi bi-check" style={{ fontSize: 9 }} /> : step.id}
                                </div>

                                {/* Icon circle */}
                                <div style={{
                                    width: 44, height: 44, borderRadius: "50%",
                                    background: isActive
                                        ? step.color
                                        : isComplete
                                            ? "rgba(120,184,51,0.15)"
                                            : "var(--bg-card-alt)",
                                    border: `2px solid ${isActive ? step.color : isComplete ? "#78B833" : "var(--border-color)"}`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    margin: "0 auto 8px",
                                    transition: "all 0.3s",
                                    boxShadow: isActive ? `0 4px 12px ${step.color}44` : "none",
                                }}>
                                    <i className={`bi ${step.icon}`} style={{
                                        fontSize: 18,
                                        color: isActive ? "white" : isComplete ? "#78B833" : "var(--text-muted)",
                                        transition: "color 0.3s",
                                    }} />
                                </div>

                                <div style={{
                                    fontSize: 10, fontWeight: 700, fontFamily: "Roboto",
                                    color: isActive ? step.color : isComplete ? "#78B833" : "var(--text-secondary)",
                                    lineHeight: 1.3, transition: "color 0.3s",
                                }}>{step.short}</div>
                            </div>

                            {/* Connector arrow */}
                            {i < WORKFLOW_STEPS.length - 1 && (
                                <div style={{
                                    display: "flex", alignItems: "center", flexShrink: 0,
                                    padding: "0 2px",
                                }}>
                                    <div style={{
                                        width: 20, height: 2,
                                        background: activeStep > step.id
                                            ? "linear-gradient(90deg, #78B833, #0B7636)"
                                            : "var(--border-color)",
                                        transition: "background 0.4s",
                                        borderRadius: 1,
                                    }} />
                                    <i className="bi bi-caret-right-fill" style={{
                                        fontSize: 8,
                                        color: activeStep > step.id ? "#78B833" : "var(--border-color)",
                                        marginLeft: -2,
                                        transition: "color 0.4s",
                                    }} />
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Active step detail panel */}
            {(() => {
                const step = WORKFLOW_STEPS[activeStep - 1];
                return (
                    <div style={{
                        padding: "14px 20px",
                        background: step.bgColor,
                        borderTop: "1px solid var(--border-soft)",
                        display: "flex", alignItems: "flex-start", gap: 14,
                        transition: "background 0.3s",
                    }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 10,
                            background: step.color,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0, boxShadow: `0 4px 12px ${step.color}44`,
                        }}>
                            <i className={`bi ${step.icon}`} style={{ fontSize: 18, color: "white" }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: "Roboto", fontSize: 13, fontWeight: 700, color: step.color, marginBottom: 3 }}>
                                Stage {step.id} — {step.label}
                            </div>
                            <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                                {step.desc}
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                            <button
                                onClick={() => onStepClick(Math.max(1, activeStep - 1))}
                                disabled={activeStep === 1}
                                style={{
                                    padding: "5px 12px", borderRadius: 6, border: "1px solid var(--border-color)",
                                    background: "var(--bg-card)", color: "var(--text-secondary)", cursor: "pointer",
                                    fontSize: 11, fontFamily: "Roboto", fontWeight: 600,
                                    opacity: activeStep === 1 ? 0.4 : 1,
                                }}>
                                <i className="bi bi-chevron-left" /> Prev
                            </button>
                            <button
                                onClick={() => onStepClick(Math.min(8, activeStep + 1))}
                                disabled={activeStep === 8}
                                style={{
                                    padding: "5px 12px", borderRadius: 6, border: "1px solid #78B833",
                                    background: activeStep === 8 ? "var(--bg-card)" : "#78B833",
                                    color: activeStep === 8 ? "var(--text-muted)" : "white",
                                    cursor: "pointer", fontSize: 11, fontFamily: "Roboto", fontWeight: 600,
                                    opacity: activeStep === 8 ? 0.4 : 1,
                                }}>
                                Next <i className="bi bi-chevron-right" />
                            </button>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════
//  SUB COMPONENT: PO Live Tracker Table with Stage Progress
// ══════════════════════════════════════════════════════════════════════════
const POLiveTracker = () => {
    const [filter, setFilter] = useState("all");
    const [selectedPO, setSelectedPO] = useState(null);

    const priorityMap = {
        high: { cls: "sp-danger", label: "High" },
        medium: { cls: "sp-orange", label: "Medium" },
        low: { cls: "sp-info", label: "Low" },
    };

    const filtered = filter === "all"
        ? WORKFLOW_MOCK.poTracker
        : WORKFLOW_MOCK.poTracker.filter(p => p.priority === filter);

    return (
        <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border-color)",
            borderRadius: 12, overflow: "hidden", boxShadow: "var(--shadow-sm)",
            marginBottom: 16,
        }}>
            <div style={{
                padding: "14px 18px", borderBottom: "1px solid var(--border-soft)",
                display: "flex", alignItems: "center", justifyContent: "space-between"
            }}>
                <div style={{
                    fontFamily: "Roboto", fontSize: 13, fontWeight: 700,
                    color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 7
                }}>
                    <i className="bi bi-table" style={{ color: "#0C4461" }} />
                    Live PO Tracker
                    <span style={{
                        fontFamily: "Roboto", fontSize: 10, fontWeight: 400,
                        color: "var(--text-muted)", marginLeft: 4
                    }}>— Click row to inspect stage</span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                    {["all", "high", "medium", "low"].map(f => (
                        <button key={f} onClick={() => setFilter(f)} style={{
                            padding: "4px 10px", borderRadius: 5, border: "1px solid",
                            borderColor: filter === f ? "#0C4461" : "var(--border-color)",
                            background: filter === f ? "#0C4461" : "var(--bg-card-alt)",
                            color: filter === f ? "white" : "var(--text-secondary)",
                            fontSize: 10, fontWeight: 700, fontFamily: "Roboto", cursor: "pointer",
                            textTransform: "capitalize", transition: "all 0.15s",
                        }}>{f === "all" ? "All POs" : f}</button>
                    ))}
                </div>
            </div>

            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                        <tr style={{ background: "var(--bg-card-alt)", borderBottom: "2px solid var(--border-color)" }}>
                            {["PO Code", "Department", "Vendor", "Item", "Value", "Workflow Stage", "ETA", "Priority"].map(h => (
                                <th key={h} style={{
                                    padding: "10px 14px", textAlign: "left",
                                    fontFamily: "Roboto", fontSize: 9, fontWeight: 700,
                                    letterSpacing: "0.12em", textTransform: "uppercase",
                                    color: "var(--text-muted)", whiteSpace: "nowrap"
                                }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((po, i) => (
                            <React.Fragment key={i}>
                                <tr
                                    onClick={() => setSelectedPO(selectedPO === po.id ? null : po.id)}
                                    style={{
                                        cursor: "pointer",
                                        borderBottom: "1px solid var(--border-soft)",
                                        background: selectedPO === po.id ? "rgba(12,68,97,0.04)" : "transparent",
                                        transition: "background 0.15s",
                                    }}
                                    onMouseEnter={e => { if (selectedPO !== po.id) e.currentTarget.style.background = "var(--bg-card-alt)"; }}
                                    onMouseLeave={e => { if (selectedPO !== po.id) e.currentTarget.style.background = "transparent"; }}
                                >
                                    <td style={{
                                        padding: "11px 14px", fontFamily: "Roboto", fontSize: 11,
                                        color: "#0C4461", fontWeight: 700
                                    }}>{po.id}</td>
                                    <td style={{ padding: "11px 14px", color: "var(--text-secondary)", fontSize: 12 }}>
                                        <span style={{
                                            display: "inline-flex", alignItems: "center", gap: 5,
                                            padding: "2px 8px", borderRadius: 12,
                                            background: "rgba(12,68,97,0.08)", color: "#0C4461",
                                            fontSize: 10, fontWeight: 700, fontFamily: "Roboto"
                                        }}>
                                            <i className="bi bi-buildings" style={{ fontSize: 9 }} /> {po.dept}
                                        </span>
                                    </td>
                                    <td style={{
                                        padding: "11px 14px", color: "var(--text-primary)",
                                        fontWeight: 700, fontSize: 12
                                    }}>{po.vendor}</td>
                                    <td style={{ padding: "11px 14px", color: "var(--text-secondary)", fontSize: 12 }}>{po.item}</td>
                                    <td style={{
                                        padding: "11px 14px", fontFamily: "Roboto", fontSize: 12,
                                        fontWeight: 700, color: "#0B7636"
                                    }}>{po.value}</td>
                                    <td style={{ padding: "11px 14px", minWidth: 200 }}>
                                        {/* Mini stage progress */}
                                        <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 4 }}>
                                            {WORKFLOW_STEPS.map((step, si) => (
                                                <div key={si} style={{
                                                    flex: 1, height: 5, borderRadius: 3,
                                                    background: po.stage > step.id
                                                        ? "#78B833"
                                                        : po.stage === step.id
                                                            ? step.color
                                                            : "var(--border-color)",
                                                    transition: "background 0.3s",
                                                }} />
                                            ))}
                                        </div>
                                        <div style={{
                                            fontSize: 10, color: WORKFLOW_STEPS[po.stage - 1]?.color,
                                            fontWeight: 700, fontFamily: "Roboto"
                                        }}>
                                            <i className={`bi ${WORKFLOW_STEPS[po.stage - 1]?.icon}`} style={{ marginRight: 4, fontSize: 9 }} />
                                            {STAGE_LABELS[po.stage]} ({po.stage}/8)
                                        </div>
                                    </td>
                                    <td style={{ padding: "11px 14px" }}>
                                        <span style={{
                                            fontFamily: "Roboto", fontSize: 11, fontWeight: 700,
                                            color: po.eta === "Today" ? "#D5691F" : po.eta === "Done" ? "#78B833" : "var(--text-secondary)"
                                        }}>
                                            {po.eta === "Today" && <i className="bi bi-alarm" style={{ marginRight: 4 }} />}
                                            {po.eta === "Done" && <i className="bi bi-check-circle-fill" style={{ marginRight: 4 }} />}
                                            {po.eta}
                                        </span>
                                    </td>
                                    <td style={{ padding: "11px 14px" }}>
                                        <span className={`status-pill ${priorityMap[po.priority].cls}`}>
                                            {priorityMap[po.priority].label}
                                        </span>
                                    </td>
                                </tr>

                                {/* Expandable stage detail row */}
                                {selectedPO === po.id && (
                                    <tr>
                                        <td colSpan={8} style={{ padding: 0 }}>
                                            <div style={{
                                                background: "rgba(12,68,97,0.03)",
                                                borderTop: "1px dashed var(--border-color)",
                                                borderBottom: "2px solid #0C4461",
                                                padding: "14px 18px",
                                            }}>
                                                <div style={{
                                                    fontSize: 11, fontWeight: 700, color: "var(--text-muted)",
                                                    textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "Roboto",
                                                    marginBottom: 12
                                                }}>
                                                    {po.id} — Stage-by-Stage Journey
                                                </div>
                                                <div style={{ display: "flex", gap: 8 }}>
                                                    {WORKFLOW_STEPS.map((step, si) => (
                                                        <div key={si} style={{
                                                            flex: 1, textAlign: "center",
                                                            padding: "10px 6px", borderRadius: 8,
                                                            background: po.stage > step.id
                                                                ? "rgba(120,184,51,0.08)"
                                                                : po.stage === step.id
                                                                    ? step.bgColor
                                                                    : "var(--bg-card)",
                                                            border: `1px solid ${po.stage > step.id ? "rgba(120,184,51,0.25)"
                                                                    : po.stage === step.id ? step.color + "55"
                                                                        : "var(--border-soft)"}`,
                                                            transition: "all 0.2s",
                                                        }}>
                                                            <i className={`bi ${step.icon}`} style={{
                                                                fontSize: 16, display: "block", marginBottom: 4,
                                                                color: po.stage > step.id ? "#78B833"
                                                                    : po.stage === step.id ? step.color
                                                                        : "var(--text-muted)",
                                                            }} />
                                                            <div style={{
                                                                fontSize: 8, fontWeight: 700, fontFamily: "Roboto",
                                                                color: po.stage > step.id ? "#78B833"
                                                                    : po.stage === step.id ? step.color
                                                                        : "var(--text-muted)",
                                                                lineHeight: 1.3
                                                            }}>{step.short}</div>
                                                            {po.stage > step.id && (
                                                                <i className="bi bi-check-circle-fill" style={{ color: "#78B833", fontSize: 10, marginTop: 3, display: "block" }} />
                                                            )}
                                                            {po.stage === step.id && (
                                                                <div style={{
                                                                    marginTop: 3, width: 6, height: 6, borderRadius: "50%",
                                                                    background: step.color, margin: "3px auto 0",
                                                                    animation: "liveBlink 1.5s infinite"
                                                                }} />
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════
//  SUB COMPONENT: Vendor Performance Scorecard
// ══════════════════════════════════════════════════════════════════════════
const VendorScorecard = () => {
    const [sortBy, setSortBy] = useState("rating");

    const sorted = [...WORKFLOW_MOCK.vendors].sort((a, b) => b[sortBy] - a[sortBy]);

    const StarRating = ({ val }) => (
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {[1, 2, 3, 4, 5].map(i => (
                <i key={i} className={`bi bi-star${val >= i ? "-fill" : val >= i - 0.5 ? "-half" : ""}`}
                    style={{ fontSize: 10, color: val >= i - 0.4 ? "#FECC00" : "var(--border-color)" }} />
            ))}
            <span style={{
                fontSize: 10, fontWeight: 700, color: "var(--text-primary)",
                fontFamily: "Roboto", marginLeft: 3
            }}>{val}</span>
        </div>
    );

    return (
        <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border-color)",
            borderRadius: 12, overflow: "hidden", boxShadow: "var(--shadow-sm)",
        }}>
            <div style={{
                padding: "14px 18px", borderBottom: "1px solid var(--border-soft)",
                display: "flex", alignItems: "center", justifyContent: "space-between"
            }}>
                <div style={{
                    fontFamily: "Roboto", fontSize: 13, fontWeight: 700,
                    color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 7
                }}>
                    <i className="bi bi-award-fill" style={{ color: "#FECC00" }} />
                    Vendor Performance Scorecard
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                    {[["rating", "⭐ Rating"], ["onTime", "⏱ On-Time"], ["orders", "📦 Orders"]].map(([k, l]) => (
                        <button key={k} onClick={() => setSortBy(k)} style={{
                            padding: "4px 10px", borderRadius: 5, border: "1px solid",
                            borderColor: sortBy === k ? "#78B833" : "var(--border-color)",
                            background: sortBy === k ? "rgba(120,184,51,0.1)" : "var(--bg-card-alt)",
                            color: sortBy === k ? "#5d9228" : "var(--text-secondary)",
                            fontSize: 10, fontWeight: 700, fontFamily: "Roboto", cursor: "pointer",
                            transition: "all 0.15s",
                        }}>{l}</button>
                    ))}
                </div>
            </div>

            <div style={{ padding: "10px 14px" }}>
                {sorted.map((v, i) => (
                    <div key={i} style={{
                        padding: "12px 10px", borderRadius: 8, marginBottom: 6,
                        background: i === 0 ? "rgba(254,204,0,0.04)" : "transparent",
                        border: `1px solid ${i === 0 ? "rgba(254,204,0,0.2)" : "transparent"}`,
                        transition: "all 0.15s", cursor: "pointer",
                    }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--bg-card-alt)"}
                        onMouseLeave={e => e.currentTarget.style.background = i === 0 ? "rgba(254,204,0,0.04)" : "transparent"}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            {/* Rank */}
                            <div style={{
                                width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                                background: i === 0 ? "#FECC00" : i === 1 ? "rgba(143,163,184,0.3)" : "rgba(213,105,31,0.15)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 10, fontWeight: 900, color: i === 0 ? "#7a6000" : "var(--text-muted)",
                                fontFamily: "Roboto",
                            }}>
                                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                            </div>

                            {/* Color bar */}
                            <div style={{
                                width: 4, height: 36, borderRadius: 2,
                                background: v.color, flexShrink: 0,
                            }} />

                            {/* Vendor info */}
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 3 }}>{v.name}</div>
                                <StarRating val={v.rating} />
                            </div>

                            {/* Metrics */}
                            <div style={{ display: "flex", gap: 16 }}>
                                {/* On-time */}
                                <div style={{ textAlign: "center" }}>
                                    <div style={{
                                        fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase",
                                        letterSpacing: "0.08em", fontFamily: "Roboto", marginBottom: 3
                                    }}>On-Time</div>
                                    <div style={{ position: "relative", width: 40, height: 40, margin: "0 auto" }}>
                                        <svg width={40} height={40} viewBox="0 0 40 40">
                                            <circle cx={20} cy={20} r={14} fill="none"
                                                stroke="var(--border-color)" strokeWidth={5} />
                                            <circle cx={20} cy={20} r={14} fill="none"
                                                stroke={v.onTime >= 92 ? "#78B833" : v.onTime >= 85 ? "#D5691F" : "#dc3545"}
                                                strokeWidth={5} strokeLinecap="round"
                                                strokeDasharray={`${(v.onTime / 100) * 88} 88`}
                                                strokeDashoffset="22"
                                                style={{ transition: "stroke-dasharray 1.2s" }}
                                            />
                                        </svg>
                                        <div style={{
                                            position: "absolute", inset: 0, display: "flex",
                                            alignItems: "center", justifyContent: "center",
                                            fontSize: 8, fontWeight: 900, fontFamily: "Roboto",
                                            color: "var(--text-primary)"
                                        }}>{v.onTime}%</div>
                                    </div>
                                </div>

                                {/* Defect rate */}
                                <div style={{ textAlign: "center" }}>
                                    <div style={{
                                        fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase",
                                        letterSpacing: "0.08em", fontFamily: "Roboto", marginBottom: 6
                                    }}>Defect</div>
                                    <div style={{
                                        fontFamily: "Roboto", fontSize: 14, fontWeight: 900,
                                        color: v.defect <= 0.5 ? "#78B833" : v.defect <= 1.0 ? "#D5691F" : "#dc3545",
                                    }}>{v.defect}%</div>
                                    <div style={{ fontSize: 8, color: "var(--text-muted)" }}>
                                        {v.defect <= 0.5 ? "✓ Excellent" : v.defect <= 1.0 ? "⚠ Average" : "✕ High"}
                                    </div>
                                </div>

                                {/* Orders */}
                                <div style={{ textAlign: "center" }}>
                                    <div style={{
                                        fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase",
                                        letterSpacing: "0.08em", fontFamily: "Roboto", marginBottom: 6
                                    }}>Orders</div>
                                    <div style={{
                                        fontFamily: "Roboto", fontSize: 14, fontWeight: 900,
                                        color: "var(--text-primary)"
                                    }}>{v.orders}</div>
                                    <div style={{ fontSize: 8, color: "var(--text-muted)" }}>This FY</div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════
//  SUB COMPONENT: GRN Inward Trend Chart + Activity Feed
// ══════════════════════════════════════════════════════════════════════════
const WarehouseInwardChart = () => {
    const W = 520, H = 100, PX = 20, PY = 10;
    const data = WORKFLOW_MOCK.inwardTrend;
    const maxGRN = Math.max(...data.map(d => d.grn));

    const grnPts = data.map((d, i) => ({
        x: PX + (i / (data.length - 1)) * (W - PX * 2),
        y: H - PY - (d.grn / maxGRN) * (H - PY * 2),
    }));

    const grnLine = grnPts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
    const grnArea = `${grnLine} L${grnPts[grnPts.length - 1].x},${H} L${grnPts[0].x},${H} Z`;

    return (
        <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border-color)",
            borderRadius: 12, overflow: "hidden", boxShadow: "var(--shadow-sm)",
        }}>
            <div style={{
                padding: "14px 18px", borderBottom: "1px solid var(--border-soft)",
                display: "flex", alignItems: "center", justifyContent: "space-between"
            }}>
                <div style={{
                    fontFamily: "Roboto", fontSize: 13, fontWeight: 700,
                    color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 7
                }}>
                    <i className="bi bi-graph-up-arrow" style={{ color: "#78B833" }} />
                    Warehouse Inward — Monthly GRN Trend
                </div>
                <span style={{
                    padding: "3px 9px", borderRadius: 20,
                    background: "rgba(11,118,54,0.1)", color: "#0B7636",
                    border: "1px solid rgba(11,118,54,0.25)",
                    fontSize: 10, fontWeight: 700, fontFamily: "Roboto",
                }}>
                    184 GRNs this month ↑ 9.5%
                </span>
            </div>

            <div style={{ display: "flex" }}>
                {/* Chart */}
                <div style={{ flex: 1, padding: "14px 18px 10px", borderRight: "1px solid var(--border-soft)" }}>
                    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
                        <defs>
                            <linearGradient id="grnGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#78B833" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="#78B833" stopOpacity="0" />
                            </linearGradient>
                            <linearGradient id="rejGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#dc3545" stopOpacity="0.2" />
                                <stop offset="100%" stopColor="#dc3545" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        {[0.3, 0.6, 0.9].map(r => (
                            <line key={r} x1={PX} y1={PY + (1 - r) * (H - PY * 2)}
                                x2={W - PX} y2={PY + (1 - r) * (H - PY * 2)}
                                stroke="var(--border-color)" strokeWidth="1" />
                        ))}
                        <path d={grnArea} fill="url(#grnGrad)" />
                        <path d={grnLine} fill="none" stroke="#78B833" strokeWidth="2.5" strokeLinecap="round" />
                        {/* Rejection line */}
                        {(() => {
                            const rejPts = data.map((d, i) => ({
                                x: PX + (i / (data.length - 1)) * (W - PX * 2),
                                y: H - PY - (d.rej / maxGRN) * (H - PY * 2),
                            }));
                            const rejLine = rejPts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
                            return (
                                <>
                                    <path d={rejLine} fill="none" stroke="#dc3545" strokeWidth="1.5"
                                        strokeDasharray="4,3" strokeLinecap="round" />
                                </>
                            );
                        })()}
                        {/* Last dot */}
                        <circle cx={grnPts[grnPts.length - 1].x} cy={grnPts[grnPts.length - 1].y}
                            r={5} fill="#78B833" stroke="var(--bg-card)" strokeWidth={2} />
                    </svg>
                    <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: PX, paddingRight: PX, marginTop: 3 }}>
                        {data.map(d => (
                            <span key={d.m} style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "Roboto" }}>{d.m}</span>
                        ))}
                    </div>
                    <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <div style={{ width: 16, height: 3, background: "#78B833", borderRadius: 2 }} />
                            <span style={{ fontSize: 10, color: "var(--text-secondary)" }}>GRN Accepted</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <div style={{
                                width: 16, height: 3, background: "#dc3545", borderRadius: 2,
                                borderStyle: "dashed", borderWidth: 1, borderColor: "#dc3545", background: "none"
                            }} />
                            <span style={{ fontSize: 10, color: "var(--text-secondary)" }}>QC Rejected</span>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div style={{ width: 140, padding: "14px", display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                        { label: "Total GRN", val: "1,848", icon: "bi-inbox-fill", color: "#0C4461" },
                        { label: "Accepted", val: "1,716", icon: "bi-check-circle", color: "#78B833" },
                        { label: "Rejected", val: "132", icon: "bi-x-circle", color: "#dc3545" },
                        { label: "Rej. Rate", val: "7.1%", icon: "bi-exclamation-tri", color: "#D5691F" },
                    ].map((s, i) => (
                        <div key={i} style={{
                            background: "var(--bg-card-alt)", border: "1px solid var(--border-color)",
                            borderRadius: 8, padding: "8px 10px",
                            borderLeft: `3px solid ${s.color}`,
                        }}>
                            <div style={{
                                fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase",
                                letterSpacing: "0.08em", fontFamily: "Roboto", marginBottom: 2
                            }}>{s.label}</div>
                            <div style={{ fontFamily: "Roboto", fontSize: 16, fontWeight: 900, color: s.color }}>{s.val}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════
//  SUB COMPONENT: Real-time Activity Feed + Dashboard Sync Status
// ══════════════════════════════════════════════════════════════════════════
const WorkflowActivityFeed = () => {
    const [pulse, setPulse] = useState(0);

    useEffect(() => {
        const t = setInterval(() => setPulse(p => (p + 1) % 3), 2000);
        return () => clearInterval(t);
    }, []);

    const syncModules = [
        { name: "Finance", status: "synced", time: "2 min ago", icon: "bi-currency-rupee", color: "#0B7636" },
        { name: "CRM", status: "synced", time: "2 min ago", icon: "bi-people", color: "#78B833" },
        { name: "Operations", status: "synced", time: "2 min ago", icon: "bi-gear", color: "#0C4461" },
        { name: "Sales", status: "syncing", time: "Now...", icon: "bi-graph-up", color: "#D5691F" },
        { name: "HR", status: "synced", time: "5 min ago", icon: "bi-person-badge", color: "#66C3D0" },
    ];

    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 16 }}>
            {/* Activity Feed */}
            <div style={{
                background: "var(--bg-card)", border: "1px solid var(--border-color)",
                borderRadius: 12, overflow: "hidden", boxShadow: "var(--shadow-sm)",
            }}>
                <div style={{
                    padding: "14px 18px", borderBottom: "1px solid var(--border-soft)",
                    display: "flex", alignItems: "center", justifyContent: "space-between"
                }}>
                    <div style={{
                        fontFamily: "Roboto", fontSize: 13, fontWeight: 700,
                        color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 7
                    }}>
                        <i className="bi bi-activity" style={{ color: "#78B833" }} />
                        Workflow Activity Feed
                    </div>
                    <div style={{
                        display: "flex", alignItems: "center", gap: 5, fontSize: 10,
                        color: "#78B833", fontWeight: 700, fontFamily: "Roboto"
                    }}>
                        <span style={{
                            width: 6, height: 6, borderRadius: "50%", background: "#78B833",
                            animation: "liveBlink 1.8s infinite", display: "inline-block"
                        }} />
                        Live Updates
                    </div>
                </div>
                <div style={{ padding: "8px 14px" }}>
                    {WORKFLOW_MOCK.activity.map((a, i) => (
                        <div key={i} style={{
                            display: "flex", gap: 12, padding: "10px 8px",
                            borderBottom: i < WORKFLOW_MOCK.activity.length - 1 ? "1px solid var(--border-soft)" : "none",
                            transition: "background 0.15s", borderRadius: 6, cursor: "pointer",
                        }}
                            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-card-alt)"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                            <div style={{
                                width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                                background: a.bg,
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <i className={`bi ${a.icon}`} style={{ fontSize: 15, color: a.color }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5,
                                    marginBottom: 3
                                }} dangerouslySetInnerHTML={{ __html: a.text }} />
                                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                                    <i className="bi bi-clock" style={{ marginRight: 3 }} />{a.time}
                                </div>
                            </div>
                            {i === 0 && (
                                <span style={{
                                    alignSelf: "flex-start", padding: "2px 7px", borderRadius: 10,
                                    background: "rgba(120,184,51,0.12)", color: "#5d9228",
                                    fontSize: 9, fontWeight: 700, fontFamily: "Roboto",
                                    border: "1px solid rgba(120,184,51,0.25)", whiteSpace: "nowrap",
                                }}>New</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Dashboard Sync Status */}
            <div style={{
                background: "var(--bg-card)", border: "1px solid var(--border-color)",
                borderRadius: 12, overflow: "hidden", boxShadow: "var(--shadow-sm)",
            }}>
                <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border-soft)" }}>
                    <div style={{
                        fontFamily: "Roboto", fontSize: 13, fontWeight: 700,
                        color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 7
                    }}>
                        <i className="bi bi-arrow-repeat" style={{ color: "#66C3D0" }} />
                        Dashboard Sync
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                        Stock data → All modules
                    </div>
                </div>

                {/* Animated sync graphic */}
                <div style={{ padding: "16px 18px", textAlign: "center" }}>
                    <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 14px" }}>
                        {/* Pulse rings */}
                        {[0, 1, 2].map(i => (
                            <div key={i} style={{
                                position: "absolute", inset: 0,
                                borderRadius: "50%",
                                border: `2px solid rgba(120,184,51,${0.6 - i * 0.2})`,
                                transform: `scale(${1 + i * 0.25})`,
                                opacity: pulse === i ? 0.8 : 0.2,
                                transition: "opacity 0.5s",
                            }} />
                        ))}
                        <div style={{
                            position: "absolute", inset: 0,
                            background: "linear-gradient(135deg, #0C4461, #78B833)",
                            borderRadius: "50%",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <i className="bi bi-arrow-repeat" style={{
                                fontSize: 28, color: "white",
                                animation: "spin 3s linear infinite"
                            }} />
                        </div>
                    </div>

                    {/* Module sync list */}
                    {syncModules.map((m, i) => (
                        <div key={i} style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "6px 0",
                            borderBottom: i < syncModules.length - 1 ? "1px solid var(--border-soft)" : "none",
                        }}>
                            <i className={`bi ${m.icon}`} style={{ color: m.color, fontSize: 13, width: 16 }} />
                            <span style={{ flex: 1, fontSize: 11, color: "var(--text-secondary)", fontWeight: 600 }}>{m.name}</span>
                            {m.status === "syncing" ? (
                                <span style={{
                                    fontSize: 9, fontWeight: 700, color: "#D5691F",
                                    fontFamily: "Roboto", display: "flex", alignItems: "center", gap: 3
                                }}>
                                    <span style={{
                                        width: 5, height: 5, borderRadius: "50%", background: "#D5691F",
                                        animation: "liveBlink 1s infinite", display: "inline-block"
                                    }} />
                                    Syncing...
                                </span>
                            ) : (
                                <span style={{
                                    fontSize: 9, color: "#78B833", fontWeight: 700, fontFamily: "Roboto",
                                    display: "flex", alignItems: "center", gap: 3
                                }}>
                                    <i className="bi bi-check2" style={{ fontSize: 11 }} />
                                    {m.time}
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                {/* Last full sync */}
                <div style={{
                    padding: "10px 18px", borderTop: "1px solid var(--border-soft)",
                    background: "rgba(120,184,51,0.04)",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Last full sync</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#78B833", fontFamily: "Roboto" }}>
                        <i className="bi bi-clock" style={{ marginRight: 3 }} />2 min ago
                    </span>
                </div>
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════
//  MAIN EXPORT: VendorWarehouseWorkflow (full section)
// ══════════════════════════════════════════════════════════════════════════
const VendorWarehouseWorkflow = () => {
    const [activeStep, setActiveStep] = useState(5); // Start at WH Receiving

    return (
        <div>
            {/* KPI Strip */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 16 }}>
                {WORKFLOW_MOCK.kpis.map((k, i) => (
                    <div key={i} style={{
                        background: "var(--bg-card)", border: "1px solid var(--border-color)",
                        borderRadius: 12, padding: "16px 18px", cursor: "pointer",
                        borderBottom: `3px solid ${k.color}`,
                        boxShadow: "var(--shadow-sm)", transition: "all 0.22s",
                        position: "relative", overflow: "hidden",
                    }}
                        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                            <span style={{
                                fontSize: 10, fontWeight: 700, fontFamily: "Roboto",
                                letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)"
                            }}>{k.label}</span>
                            <div style={{
                                width: 34, height: 34, borderRadius: 8,
                                background: k.color + "15",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 16, color: k.color,
                            }}>
                                <i className={`bi ${k.icon}`} />
                            </div>
                        </div>
                        <div style={{
                            fontFamily: "Roboto", fontSize: 26, fontWeight: 900,
                            color: "var(--text-primary)", lineHeight: 1, letterSpacing: "-0.5px", marginBottom: 5
                        }}>{k.value}</div>
                        <div style={{
                            fontSize: 11, fontWeight: 600, fontFamily: "Roboto",
                            color: k.type === "up" ? "#78B833" : k.type === "down" ? "#dc3545" : "#D5691F",
                            display: "flex", alignItems: "center", gap: 3
                        }}>
                            <i className={`bi bi-arrow-${k.type === "up" ? "up" : k.type === "down" ? "down" : "dash"}`} />
                            {k.delta}
                        </div>
                    </div>
                ))}
            </div>

            {/* Interactive Workflow Stepper */}
            <WorkflowStepper activeStep={activeStep} onStepClick={setActiveStep} />

            {/* PO Live Tracker */}
            <POLiveTracker />

            {/* Inward Chart + Vendor Scorecard */}
            <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16, marginBottom: 16 }}>
                <WarehouseInwardChart />
                <VendorScorecard />
            </div>

            {/* Activity Feed + Sync Status */}
            <WorkflowActivityFeed />

            {/* CSS for spin animation */}
            <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
        </div>
    );
};

export default VendorWarehouseWorkflow;