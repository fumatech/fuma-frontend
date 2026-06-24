// ══════════════════════════════════════════════════════════════════════════
//  FUMA ERP — INVENTORY MANAGEMENT SYSTEM
//  File: InventoryManagement.js
//  Drop-in component — paste into Dashboard.js like VendorWarehouseWorkflow
//  Brand: #78B833 | #0C4461 | #D5691F | #66C3D0 | #FECC00 | #0B7636
// ══════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo } from "react";

// ══════════════════════════════════════════════════════════════════════════
//  MOCK DATA
// ══════════════════════════════════════════════════════════════════════════
const INV_MOCK = {

    // ── 10 product categories with full details ──
    categories: [
        {
            id: "CAT-01", name: "LEDs", icon: "bi-lightbulb-fill",
            color: "#FECC00", bgColor: "rgba(254,204,0,0.1)",
            totalSKUs: 84, inStock: 72, lowStock: 8, outOfStock: 4,
            totalUnits: 18420, totalValue: "₹22.4 L",
            fastMoving: 68, slowMoving: 12, dead: 4,
            turnover: 8.4, trend: +14.2,
        },
        {
            id: "CAT-02", name: "Bulbs", icon: "bi-lightbulb",
            color: "#F5A623", bgColor: "rgba(245,166,35,0.1)",
            totalSKUs: 62, inStock: 55, lowStock: 5, outOfStock: 2,
            totalUnits: 24800, totalValue: "₹8.6 L",
            fastMoving: 50, slowMoving: 9, dead: 3,
            turnover: 9.2, trend: +8.6,
        },
        {
            id: "CAT-03", name: "Dimmers", icon: "bi-sliders",
            color: "#66C3D0", bgColor: "rgba(102,195,208,0.1)",
            totalSKUs: 28, inStock: 22, lowStock: 4, outOfStock: 2,
            totalUnits: 4200, totalValue: "₹14.2 L",
            fastMoving: 18, slowMoving: 7, dead: 3,
            turnover: 5.8, trend: +22.1,
        },
        {
            id: "CAT-04", name: "Fan Regulators", icon: "bi-fan",
            color: "#0C4461", bgColor: "rgba(12,68,97,0.1)",
            totalSKUs: 36, inStock: 30, lowStock: 4, outOfStock: 2,
            totalUnits: 9600, totalValue: "₹11.8 L",
            fastMoving: 28, slowMoving: 6, dead: 2,
            turnover: 7.1, trend: +5.4,
        },
        {
            id: "CAT-05", name: "Smart Switches", icon: "bi-toggles",
            color: "#78B833", bgColor: "rgba(120,184,51,0.1)",
            totalSKUs: 44, inStock: 36, lowStock: 6, outOfStock: 2,
            totalUnits: 6840, totalValue: "₹28.4 L",
            fastMoving: 38, slowMoving: 4, dead: 2,
            turnover: 11.2, trend: +34.8,
        },
        {
            id: "CAT-06", name: "Touch Switches", icon: "bi-hand-index-thumb",
            color: "#9B59B6", bgColor: "rgba(155,89,182,0.1)",
            totalSKUs: 38, inStock: 32, lowStock: 4, outOfStock: 2,
            totalUnits: 8240, totalValue: "₹18.6 L",
            fastMoving: 30, slowMoving: 6, dead: 2,
            turnover: 8.9, trend: +18.4,
        },
        {
            id: "CAT-07", name: "Doorbells", icon: "bi-bell-fill",
            color: "#D5691F", bgColor: "rgba(213,105,31,0.1)",
            totalSKUs: 22, inStock: 18, lowStock: 2, outOfStock: 2,
            totalUnits: 3420, totalValue: "₹6.2 L",
            fastMoving: 14, slowMoving: 5, dead: 3,
            turnover: 4.2, trend: -2.8,
        },
        {
            id: "CAT-08", name: "Panels", icon: "bi-grid-3x3-gap-fill",
            color: "#0B7636", bgColor: "rgba(11,118,54,0.1)",
            totalSKUs: 18, inStock: 15, lowStock: 2, outOfStock: 1,
            totalUnits: 2840, totalValue: "₹42.8 L",
            fastMoving: 12, slowMoving: 4, dead: 2,
            turnover: 6.4, trend: +11.2,
        },
        {
            id: "CAT-09", name: "Fancy Lights", icon: "bi-stars",
            color: "#E91E8C", bgColor: "rgba(233,30,140,0.1)",
            totalSKUs: 56, inStock: 44, lowStock: 8, outOfStock: 4,
            totalUnits: 11200, totalValue: "₹31.4 L",
            fastMoving: 40, slowMoving: 12, dead: 4,
            turnover: 6.8, trend: +28.6,
        },
        {
            id: "CAT-10", name: "Accessories", icon: "bi-tools",
            color: "#8fa3b8", bgColor: "rgba(143,163,184,0.1)",
            totalSKUs: 112, inStock: 98, lowStock: 10, outOfStock: 4,
            totalUnits: 32400, totalValue: "₹9.4 L",
            fastMoving: 82, slowMoving: 22, dead: 8,
            turnover: 10.2, trend: +4.2,
        },
    ],

    // ── SKU-level data (top items per category) ──
    skuList: [
        { sku: "SKU-LED-001", name: "FUMA 9W LED Bulb Cool White", cat: "LEDs", warehouse: "Pune HQ", stock: 1240, reorder: 500, mrp: "₹85", status: "good", velocity: "fast", monthlyOut: 420 },
        { sku: "SKU-LED-042", name: "FUMA 18W LED Panel Light", cat: "LEDs", warehouse: "Mumbai", stock: 84, reorder: 200, mrp: "₹320", status: "low", velocity: "fast", monthlyOut: 180 },
        { sku: "SKU-LED-078", name: "FUMA 5W LED Spotlight", cat: "LEDs", warehouse: "Nashik", stock: 0, reorder: 150, mrp: "₹120", status: "out", velocity: "fast", monthlyOut: 210 },
        { sku: "SKU-BLB-012", name: "FUMA 60W Decorative Bulb", cat: "Bulbs", warehouse: "Pune HQ", stock: 3840, reorder: 800, mrp: "₹45", status: "good", velocity: "fast", monthlyOut: 920 },
        { sku: "SKU-BLB-034", name: "FUMA Smart WiFi Bulb RGB", cat: "Bulbs", warehouse: "Mumbai", stock: 312, reorder: 400, mrp: "₹680", status: "low", velocity: "fast", monthlyOut: 380 },
        { sku: "SKU-DIM-007", name: "FUMA 1000W Leading Edge Dimmer", cat: "Dimmers", warehouse: "Pune HQ", stock: 248, reorder: 100, mrp: "₹1240", "status": "good", velocity: "medium", monthlyOut: 84 },
        { sku: "SKU-DIM-019", name: "FUMA Touch Dimmer Module", cat: "Dimmers", warehouse: "Nashik", stock: 42, reorder: 80, mrp: "₹880", status: "low", velocity: "medium", monthlyOut: 62 },
        { sku: "SKU-FAN-003", name: "FUMA 5-Speed Fan Regulator", cat: "Fan Regulators", warehouse: "Pune HQ", stock: 1680, reorder: 400, mrp: "₹220", status: "good", velocity: "fast", monthlyOut: 540 },
        { sku: "SKU-FAN-021", name: "FUMA Smart BLDC Fan Controller", cat: "Fan Regulators", warehouse: "Mumbai", stock: 128, reorder: 200, mrp: "₹840", status: "low", velocity: "fast", monthlyOut: 180 },
        { sku: "SKU-SSW-004", name: "FUMA 2-Gang Smart Switch WiFi", cat: "Smart Switches", warehouse: "Pune HQ", stock: 924, reorder: 300, mrp: "₹1480", "status": "good", velocity: "fast", monthlyOut: 312 },
        { sku: "SKU-SSW-028", name: "FUMA Scene Controller 4G", cat: "Smart Switches", warehouse: "Mumbai", stock: 64, reorder: 150, mrp: "₹2200", "status": "low", velocity: "fast", monthlyOut: 148 },
        { sku: "SKU-TSW-002", name: "FUMA Luxury Touch Switch 3M", cat: "Touch Switches", warehouse: "Pune HQ", stock: 1120, reorder: 300, mrp: "₹1840", "status": "good", velocity: "fast", monthlyOut: 284 },
        { sku: "SKU-DBL-005", name: "FUMA WiFi Video Doorbell", cat: "Doorbells", warehouse: "Mumbai", stock: 184, reorder: 100, mrp: "₹3200", "status": "good", velocity: "medium", monthlyOut: 62 },
        { sku: "SKU-DBL-018", name: "FUMA Melody Doorbell 24-tone", cat: "Doorbells", warehouse: "Nashik", stock: 0, reorder: 80, mrp: "₹420", status: "out", velocity: "slow", monthlyOut: 24 },
        { sku: "SKU-PNL-001", name: "FUMA 8-Way Distribution Board", cat: "Panels", warehouse: "Pune HQ", stock: 284, reorder: 80, mrp: "₹4800", "status": "good", velocity: "medium", monthlyOut: 42 },
        { sku: "SKU-FNL-007", name: "FUMA Crystal Chandelier 12L", cat: "Fancy Lights", warehouse: "Pune HQ", stock: 84, reorder: 40, mrp: "₹12400", "status": "good", velocity: "slow", monthlyOut: 18 },
        { sku: "SKU-FNL-034", name: "FUMA LED Strip 5M RGB WP", cat: "Fancy Lights", warehouse: "Mumbai", stock: 2840, reorder: 600, mrp: "₹680", status: "good", velocity: "fast", monthlyOut: 820 },
        { sku: "SKU-ACC-012", name: "FUMA 3-Pin Socket Heavy Duty", cat: "Accessories", warehouse: "Pune HQ", stock: 8420, reorder: 2000, mrp: "₹120", status: "good", velocity: "fast", monthlyOut: 2840 },
        { sku: "SKU-ACC-088", name: "FUMA Cable Management Duct 2M", cat: "Accessories", warehouse: "Nashik", stock: 28, reorder: 200, mrp: "₹180", status: "low", velocity: "slow", monthlyOut: 48 },
        { sku: "SKU-ACC-102", name: "FUMA Vintage Switch Plate Gold", cat: "Accessories", warehouse: "Mumbai", stock: 124, reorder: 50, mrp: "₹840", status: "good", velocity: "dead", monthlyOut: 4 },
    ],

    // ── Warehouse-wise stock ──
    warehouses: [
        {
            name: "Pune HQ", code: "WH-PNQ", icon: "bi-building",
            color: "#0C4461",
            capacity: 85, used: 72,
            totalSKUs: 3840, totalValue: "₹94.2 L",
            stockIn: 184, stockOut: 420,
            categories: [
                { name: "LEDs", units: 8200, pct: 72 },
                { name: "Bulbs", units: 12400, pct: 88 },
                { name: "Smart Switches", units: 2840, pct: 64 },
                { name: "Fan Regulators", units: 4200, pct: 58 },
                { name: "Accessories", units: 18400, pct: 82 },
            ],
        },
        {
            name: "Mumbai", code: "WH-MUM", icon: "bi-buildings",
            color: "#78B833",
            capacity: 92, used: 61,
            totalSKUs: 1620, totalValue: "₹48.6 L",
            stockIn: 84, stockOut: 212,
            categories: [
                { name: "LEDs", units: 4800, pct: 58 },
                { name: "Fancy Lights", units: 6400, pct: 74 },
                { name: "Touch Switches", units: 3200, pct: 52 },
                { name: "Doorbells", units: 840, pct: 44 },
                { name: "Accessories", units: 8200, pct: 62 },
            ],
        },
        {
            name: "Nashik", code: "WH-NSK", icon: "bi-shop",
            color: "#D5691F",
            capacity: 78, used: 48,
            totalSKUs: 780, totalValue: "₹22.8 L",
            stockIn: 42, stockOut: 98,
            categories: [
                { name: "LEDs", units: 2400, pct: 42 },
                { name: "Fan Regulators", units: 1800, pct: 38 },
                { name: "Bulbs", units: 4800, pct: 56 },
                { name: "Dimmers", units: 420, pct: 34 },
                { name: "Accessories", units: 3200, pct: 44 },
            ],
        },
    ],

    // ── Stock trend (12 months) ──
    stockTrend: [
        { m: "May", inward: 1240, outward: 980, value: 84 },
        { m: "Jun", inward: 1480, outward: 1120, value: 88 },
        { m: "Jul", inward: 1620, outward: 1280, value: 91 },
        { m: "Aug", inward: 1380, outward: 1180, value: 86 },
        { m: "Sep", inward: 1840, outward: 1420, value: 94 },
        { m: "Oct", inward: 2120, outward: 1680, value: 98 },
        { m: "Nov", inward: 1980, outward: 1840, value: 96 },
        { m: "Dec", inward: 2480, outward: 2020, value: 102 },
        { m: "Jan", inward: 2640, outward: 2180, value: 108 },
        { m: "Feb", inward: 2240, outward: 1960, value: 98 },
        { m: "Mar", inward: 2820, outward: 2240, value: 112 },
        { m: "Apr", inward: 3040, outward: 2480, value: 118 },
    ],

    // ── Reorder suggestions ──
    reorderSuggestions: [
        { sku: "SKU-LED-078", name: "FUMA 5W LED Spotlight", cat: "LEDs", currentStock: 0, reorderQty: 500, estValue: "₹6.0 L", urgency: "critical", vendor: "Havells India", leadDays: 5 },
        { sku: "SKU-DBL-018", name: "FUMA Melody Doorbell 24-tone", cat: "Doorbells", currentStock: 0, reorderQty: 200, estValue: "₹0.84 L", urgency: "critical", vendor: "Crompton Greaves", leadDays: 7 },
        { sku: "SKU-LED-042", name: "FUMA 18W LED Panel Light", cat: "LEDs", currentStock: 84, reorderQty: 400, estValue: "₹12.8 L", urgency: "high", vendor: "Havells India", leadDays: 5 },
        { sku: "SKU-BLB-034", name: "FUMA Smart WiFi Bulb RGB", cat: "Bulbs", currentStock: 312, reorderQty: 600, estValue: "₹40.8 L", urgency: "high", vendor: "Wipro Lighting", leadDays: 8 },
        { sku: "SKU-SSW-028", name: "FUMA Scene Controller 4G", cat: "Smart Switches", currentStock: 64, reorderQty: 300, estValue: "₹66.0 L", urgency: "high", vendor: "Schneider Elec.", leadDays: 10 },
        { sku: "SKU-FAN-021", name: "FUMA Smart BLDC Controller", cat: "Fan Regulators", currentStock: 128, reorderQty: 250, estValue: "₹21.0 L", urgency: "medium", vendor: "Polycab India", leadDays: 7 },
        { sku: "SKU-ACC-088", name: "FUMA Cable Mgmt Duct 2M", cat: "Accessories", currentStock: 28, reorderQty: 500, estValue: "₹0.9 L", urgency: "medium", vendor: "Legrand India", leadDays: 6 },
        { sku: "SKU-DIM-019", name: "FUMA Touch Dimmer Module", cat: "Dimmers", currentStock: 42, reorderQty: 200, estValue: "₹17.6 L", urgency: "medium", vendor: "ABB India", leadDays: 8 },
    ],
};

// ══════════════════════════════════════════════════════════════════════════
//  HELPER: Stock status badge
// ══════════════════════════════════════════════════════════════════════════
const StockBadge = ({ status }) => {
    const map = {
        good: { bg: "rgba(120,184,51,0.12)", color: "#5d9228", border: "rgba(120,184,51,0.3)", icon: "bi-check-circle-fill", label: "In Stock" },
        low: { bg: "rgba(213,105,31,0.12)", color: "#D5691F", border: "rgba(213,105,31,0.3)", icon: "bi-exclamation-circle", label: "Low Stock" },
        out: { bg: "rgba(220,53,69,0.12)", color: "#dc3545", border: "rgba(220,53,69,0.3)", icon: "bi-x-circle-fill", label: "Out of Stock" },
        critical: { bg: "rgba(220,53,69,0.12)", color: "#dc3545", border: "rgba(220,53,69,0.3)", icon: "bi-alarm-fill", label: "Critical" },
        high: { bg: "rgba(213,105,31,0.12)", color: "#D5691F", border: "rgba(213,105,31,0.3)", icon: "bi-arrow-up-circle", label: "High" },
        medium: { bg: "rgba(254,204,0,0.15)", color: "#8a6e00", border: "rgba(254,204,0,0.35)", icon: "bi-dash-circle", label: "Medium" },
    };
    const s = map[status] || map.good;
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "2px 8px", borderRadius: 20,
            background: s.bg, color: s.color, border: `1px solid ${s.border}`,
            fontSize: 10, fontWeight: 700, fontFamily: "Roboto", whiteSpace: "nowrap",
        }}>
            <i className={`bi ${s.icon}`} style={{ fontSize: 9 }} /> {s.label}
        </span>
    );
};

const VelocityBadge = ({ v }) => {
    const map = {
        fast: { bg: "rgba(120,184,51,0.1)", color: "#0B7636", icon: "bi-lightning-fill", label: "Fast" },
        medium: { bg: "rgba(12,68,97,0.1)", color: "#0C4461", icon: "bi-activity", label: "Medium" },
        slow: { bg: "rgba(254,204,0,0.12)", color: "#8a6e00", icon: "bi-hourglass-split", label: "Slow" },
        dead: { bg: "rgba(143,163,184,0.15)", color: "#4a6080", icon: "bi-moon-stars", label: "Dead" },
    };
    const s = map[v] || map.medium;
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "2px 8px", borderRadius: 20,
            background: s.bg, color: s.color,
            fontSize: 10, fontWeight: 700, fontFamily: "Roboto",
        }}>
            <i className={`bi ${s.icon}`} style={{ fontSize: 9 }} /> {s.label}
        </span>
    );
};

// ══════════════════════════════════════════════════════════════════════════
//  A. CATEGORY OVERVIEW GRID
// ══════════════════════════════════════════════════════════════════════════
const InvCategoryGrid = ({ onSelectCat, selectedCat }) => {
    return (
        <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border-color)",
            borderRadius: 12, overflow: "hidden", boxShadow: "var(--shadow-sm)", marginBottom: 16,
        }}>
            <div style={{
                padding: "14px 18px", borderBottom: "1px solid var(--border-soft)",
                display: "flex", alignItems: "center", justifyContent: "space-between"
            }}>
                <div style={{
                    fontFamily: "Roboto", fontSize: 13, fontWeight: 700,
                    color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 7
                }}>
                    <i className="bi bi-grid-1x2-fill" style={{ color: "#78B833" }} />
                    Inventory Categories — Real-Time Overview
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {selectedCat ? `Viewing: ${selectedCat}` : "Click category to drill-down"}
                    </span>
                    {selectedCat && (
                        <button onClick={() => onSelectCat(null)} style={{
                            padding: "3px 10px", borderRadius: 5, border: "1px solid var(--border-color)",
                            background: "var(--bg-card-alt)", color: "var(--text-secondary)",
                            fontSize: 10, fontWeight: 700, fontFamily: "Roboto", cursor: "pointer",
                        }}>✕ Clear</button>
                    )}
                </div>
            </div>

            <div style={{
                display: "grid", gridTemplateColumns: "repeat(5, 1fr)",
                gap: 0,
            }}>
                {INV_MOCK.categories.map((cat, i) => {
                    const isSelected = selectedCat === cat.name;
                    const hasAlert = cat.outOfStock > 0 || cat.lowStock > 3;
                    return (
                        <div key={i}
                            onClick={() => onSelectCat(isSelected ? null : cat.name)}
                            style={{
                                padding: "16px 14px",
                                borderRight: i % 5 !== 4 ? "1px solid var(--border-soft)" : "none",
                                borderBottom: i < 5 ? "1px solid var(--border-soft)" : "none",
                                cursor: "pointer",
                                background: isSelected ? cat.bgColor : "transparent",
                                borderLeft: isSelected ? `3px solid ${cat.color}` : "3px solid transparent",
                                transition: "all 0.2s",
                                position: "relative",
                            }}
                            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "var(--bg-card-alt)"; }}
                            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                        >
                            {/* Alert dot */}
                            {hasAlert && (
                                <div style={{
                                    position: "absolute", top: 8, right: 8,
                                    width: 7, height: 7, borderRadius: "50%",
                                    background: cat.outOfStock > 0 ? "#dc3545" : "#D5691F",
                                    boxShadow: `0 0 4px ${cat.outOfStock > 0 ? "#dc3545" : "#D5691F"}`,
                                    animation: "liveBlink 2s infinite",
                                }} />
                            )}

                            {/* Icon */}
                            <div style={{
                                width: 40, height: 40, borderRadius: 10,
                                background: isSelected ? cat.color : cat.bgColor,
                                border: `2px solid ${isSelected ? cat.color : "transparent"}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                marginBottom: 10, transition: "all 0.2s",
                                boxShadow: isSelected ? `0 4px 12px ${cat.color}44` : "none",
                            }}>
                                <i className={`bi ${cat.icon}`} style={{
                                    fontSize: 18,
                                    color: isSelected ? "white" : cat.color,
                                }} />
                            </div>

                            <div style={{
                                fontFamily: "Roboto", fontSize: 12, fontWeight: 700,
                                color: isSelected ? cat.color : "var(--text-primary)",
                                marginBottom: 8, lineHeight: 1.3
                            }}>{cat.name}</div>

                            {/* Mini metrics */}
                            <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>
                                <span style={{
                                    fontWeight: 700, color: "var(--text-primary)", fontFamily: "Roboto",
                                    fontSize: 16
                                }}>{cat.totalSKUs}</span> SKUs
                            </div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "#0B7636", marginBottom: 6 }}>
                                {cat.totalValue}
                            </div>

                            {/* Stock health mini-bar */}
                            <div style={{ height: 4, borderRadius: 2, background: "var(--border-color)", overflow: "hidden", marginBottom: 4 }}>
                                <div style={{
                                    height: "100%",
                                    background: `linear-gradient(90deg, #78B833 ${(cat.inStock / cat.totalSKUs) * 100}%, #D5691F ${(cat.inStock / cat.totalSKUs) * 100}% ${((cat.inStock + cat.lowStock) / cat.totalSKUs) * 100}%, #dc3545 ${((cat.inStock + cat.lowStock) / cat.totalSKUs) * 100}%)`,
                                    borderRadius: 2,
                                }} />
                            </div>

                            {/* Status counts */}
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 9, fontWeight: 700, color: "#78B833" }}>
                                    <i className="bi bi-check2" /> {cat.inStock}
                                </span>
                                {cat.lowStock > 0 && (
                                    <span style={{ fontSize: 9, fontWeight: 700, color: "#D5691F" }}>
                                        <i className="bi bi-exclamation" /> {cat.lowStock}
                                    </span>
                                )}
                                {cat.outOfStock > 0 && (
                                    <span style={{ fontSize: 9, fontWeight: 700, color: "#dc3545" }}>
                                        <i className="bi bi-x" /> {cat.outOfStock}
                                    </span>
                                )}
                            </div>

                            {/* Trend */}
                            <div style={{
                                marginTop: 6, fontSize: 10, fontWeight: 700, fontFamily: "Roboto",
                                color: cat.trend > 0 ? "#78B833" : "#dc3545",
                                display: "flex", alignItems: "center", gap: 2,
                            }}>
                                <i className={`bi bi-arrow-${cat.trend > 0 ? "up" : "down"}-short`} style={{ fontSize: 12 }} />
                                {Math.abs(cat.trend)}% MoM
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════
//  B. REAL-TIME STOCK TRACKING TABLE
// ══════════════════════════════════════════════════════════════════════════
const InvStockTable = ({ selectedCat }) => {
    const [search, setSearch] = useState("");
    const [sortCol, setSortCol] = useState("stock");
    const [sortDir, setSortDir] = useState("asc");
    const [filterWH, setFilterWH] = useState("all");
    const [filterV, setFilterV] = useState("all");

    const filtered = useMemo(() => {
        let d = [...INV_MOCK.skuList];
        if (selectedCat) d = d.filter(x => x.cat === selectedCat);
        if (filterWH !== "all") d = d.filter(x => x.warehouse === filterWH);
        if (filterV !== "all") d = d.filter(x => x.velocity === filterV);
        if (search) d = d.filter(x =>
            x.name.toLowerCase().includes(search.toLowerCase()) ||
            x.sku.toLowerCase().includes(search.toLowerCase()));
        d.sort((a, b) => {
            let av = a[sortCol], bv = b[sortCol];
            if (typeof av === "string") av = av.toLowerCase();
            if (typeof bv === "string") bv = bv.toLowerCase();
            return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
        });
        return d;
    }, [selectedCat, search, sortCol, sortDir, filterWH, filterV]);

    const thStyle = (col) => ({
        padding: "10px 14px", textAlign: "left",
        fontFamily: "Roboto", fontSize: 9, fontWeight: 700,
        letterSpacing: "0.12em", textTransform: "uppercase",
        color: sortCol === col ? "#0C4461" : "var(--text-muted)",
        cursor: "pointer", userSelect: "none", whiteSpace: "nowrap",
        background: sortCol === col ? "rgba(12,68,97,0.05)" : "var(--bg-card-alt)",
    });

    const handleSort = (col) => {
        if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
        else { setSortCol(col); setSortDir("asc"); }
    };

    const stockBarColor = (stock, reorder) => {
        const pct = stock / (reorder * 3);
        if (stock === 0) return "#dc3545";
        if (pct < 0.33) return "#D5691F";
        if (pct < 0.66) return "#FECC00";
        return "#78B833";
    };

    return (
        <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border-color)",
            borderRadius: 12, overflow: "hidden", boxShadow: "var(--shadow-sm)", marginBottom: 16,
        }}>
            <div style={{
                padding: "14px 18px", borderBottom: "1px solid var(--border-soft)",
                display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8
            }}>
                <div style={{
                    fontFamily: "Roboto", fontSize: 13, fontWeight: 700,
                    color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 7
                }}>
                    <i className="bi bi-list-check" style={{ color: "#0C4461" }} />
                    SKU-Level Stock Tracker
                    <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-muted)" }}>
                        — {filtered.length} items
                    </span>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    {/* Search */}
                    <div style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "5px 10px", background: "var(--bg-card-alt)",
                        border: "1px solid var(--border-color)", borderRadius: 6
                    }}>
                        <i className="bi bi-search" style={{ fontSize: 12, color: "var(--text-muted)" }} />
                        <input
                            value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search SKU or name..."
                            style={{
                                border: "none", outline: "none", background: "transparent",
                                fontSize: 11, color: "var(--text-primary)", width: 160,
                                fontFamily: "Lato"
                            }}
                        />
                    </div>
                    {/* WH Filter */}
                    {[["all", "All WH"], ["Pune HQ", "Pune"], ["Mumbai", "Mumbai"], ["Nashik", "Nashik"]].map(([v, l]) => (
                        <button key={v} onClick={() => setFilterWH(v)} style={{
                            padding: "4px 10px", borderRadius: 5,
                            border: `1px solid ${filterWH === v ? "#0C4461" : "var(--border-color)"}`,
                            background: filterWH === v ? "#0C4461" : "var(--bg-card-alt)",
                            color: filterWH === v ? "white" : "var(--text-secondary)",
                            fontSize: 10, fontWeight: 700, fontFamily: "Roboto", cursor: "pointer",
                            transition: "all 0.15s",
                        }}>{l}</button>
                    ))}
                    {/* Velocity Filter */}
                    {[["all", "All"], ["fast", "Fast"], ["slow", "Slow"], ["dead", "Dead"]].map(([v, l]) => (
                        <button key={v} onClick={() => setFilterV(v)} style={{
                            padding: "4px 10px", borderRadius: 5,
                            border: `1px solid ${filterV === v ? "#78B833" : "var(--border-color)"}`,
                            background: filterV === v ? "rgba(120,184,51,0.1)" : "var(--bg-card-alt)",
                            color: filterV === v ? "#5d9228" : "var(--text-secondary)",
                            fontSize: 10, fontWeight: 700, fontFamily: "Roboto", cursor: "pointer",
                            transition: "all 0.15s",
                        }}>{l}</button>
                    ))}
                </div>
            </div>

            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                        <tr style={{ borderBottom: "2px solid var(--border-color)" }}>
                            {[
                                ["sku", "SKU Code"], ["name", "Product Name"], ["cat", "Category"],
                                ["warehouse", "Warehouse"], ["stock", "Stock Level"], ["reorder", "Reorder Pt."],
                                ["mrp", "MRP"], ["velocity", "Velocity"], ["", "Status"],
                            ].map(([col, label]) => (
                                <th key={label} style={thStyle(col)}
                                    onClick={() => col && handleSort(col)}>
                                    {label}
                                    {sortCol === col && (
                                        <i className={`bi bi-arrow-${sortDir === "asc" ? "up" : "down"}`}
                                            style={{ marginLeft: 4, fontSize: 9, color: "#0C4461" }} />
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((item, i) => {
                            const pct = Math.min(100, (item.stock / (item.reorder * 3)) * 100);
                            const barColor = stockBarColor(item.stock, item.reorder);
                            const stockStatus = item.stock === 0 ? "out"
                                : item.stock < item.reorder ? "low" : "good";

                            return (
                                <tr key={i} style={{
                                    borderBottom: "1px solid var(--border-soft)",
                                    transition: "background 0.15s", cursor: "default"
                                }}
                                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-card-alt)"}
                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                >
                                    <td style={{
                                        padding: "10px 14px", fontFamily: "Roboto",
                                        fontSize: 10, color: "#0C4461", fontWeight: 700
                                    }}>{item.sku}</td>
                                    <td style={{
                                        padding: "10px 14px", fontWeight: 700,
                                        color: "var(--text-primary)", maxWidth: 200
                                    }}>
                                        <div style={{
                                            overflow: "hidden", textOverflow: "ellipsis",
                                            whiteSpace: "nowrap", maxWidth: 180,
                                        }}>{item.name}</div>
                                    </td>
                                    <td style={{ padding: "10px 14px" }}>
                                        <span style={{
                                            display: "inline-flex", alignItems: "center", gap: 4,
                                            padding: "2px 8px", borderRadius: 10,
                                            background: INV_MOCK.categories.find(c => c.name === item.cat)?.bgColor || "var(--bg-card-alt)",
                                            color: INV_MOCK.categories.find(c => c.name === item.cat)?.color || "var(--text-muted)",
                                            fontSize: 9, fontWeight: 700, fontFamily: "Roboto",
                                        }}>
                                            <i className={`bi ${INV_MOCK.categories.find(c => c.name === item.cat)?.icon}`} style={{ fontSize: 9 }} />
                                            {item.cat}
                                        </span>
                                    </td>
                                    <td style={{ padding: "10px 14px", color: "var(--text-secondary)", fontSize: 11 }}>
                                        <i className="bi bi-geo-alt" style={{ marginRight: 4, color: "var(--text-muted)" }} />
                                        {item.warehouse}
                                    </td>
                                    <td style={{ padding: "10px 14px", minWidth: 140 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                            <span style={{
                                                fontFamily: "Roboto", fontSize: 13, fontWeight: 900,
                                                color: item.stock === 0 ? "#dc3545"
                                                    : item.stock < item.reorder ? "#D5691F" : "var(--text-primary)",
                                            }}>
                                                {item.stock === 0
                                                    ? <><i className="bi bi-x-circle-fill" style={{ color: "#dc3545", marginRight: 3 }} />0</>
                                                    : item.stock.toLocaleString()}
                                            </span>
                                            <span style={{ fontSize: 9, color: "var(--text-muted)" }}>units</span>
                                        </div>
                                        <div style={{ height: 4, background: "var(--border-color)", borderRadius: 2, overflow: "hidden" }}>
                                            <div style={{
                                                width: `${item.stock === 0 ? 0 : pct}%`, height: "100%",
                                                background: barColor, borderRadius: 2,
                                                transition: "width 1s",
                                            }} />
                                        </div>
                                    </td>
                                    <td style={{
                                        padding: "10px 14px", fontFamily: "Roboto",
                                        fontSize: 11, color: "var(--text-secondary)"
                                    }}>
                                        {item.reorder.toLocaleString()}
                                    </td>
                                    <td style={{
                                        padding: "10px 14px", fontFamily: "Roboto",
                                        fontSize: 11, fontWeight: 700, color: "var(--text-primary)"
                                    }}>{item.mrp}</td>
                                    <td style={{ padding: "10px 14px" }}><VelocityBadge v={item.velocity} /></td>
                                    <td style={{ padding: "10px 14px" }}><StockBadge status={stockStatus} /></td>
                                </tr>
                            );
                        })}
                        {filtered.length === 0 && (
                            <tr><td colSpan={9} style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
                                <i className="bi bi-inbox" style={{ fontSize: 24, display: "block", marginBottom: 8, opacity: 0.3 }} />
                                No items match your filters
                            </td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════
//  C. WAREHOUSE-WISE INVENTORY CARDS
// ══════════════════════════════════════════════════════════════════════════
const InvWarehouseView = () => {
    return (
        <div style={{ marginBottom: 16 }}>
            <div style={{
                fontFamily: "Roboto", fontSize: 12, fontWeight: 700,
                letterSpacing: "0.12em", textTransform: "uppercase",
                color: "var(--text-muted)", marginBottom: 12,
                display: "flex", alignItems: "center", gap: 8,
            }}>
                <i className="bi bi-buildings" style={{ color: "#0C4461", fontSize: 14 }} />
                Warehouse-Wise Inventory
                <div style={{ flex: 1, height: 1, background: "var(--border-color)" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                {INV_MOCK.warehouses.map((wh, i) => (
                    <div key={i} style={{
                        background: "var(--bg-card)", border: "1px solid var(--border-color)",
                        borderRadius: 12, overflow: "hidden", boxShadow: "var(--shadow-sm)",
                        borderTop: `3px solid ${wh.color}`,
                        transition: "all 0.2s", cursor: "pointer",
                    }}
                        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
                    >
                        {/* Header */}
                        <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-soft)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                                <div style={{
                                    width: 38, height: 38, borderRadius: 8,
                                    background: wh.color + "18",
                                    border: `2px solid ${wh.color}44`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    <i className={`bi ${wh.icon}`} style={{ fontSize: 18, color: wh.color }} />
                                </div>
                                <div>
                                    <div style={{
                                        fontFamily: "Roboto", fontSize: 14, fontWeight: 700,
                                        color: "var(--text-primary)"
                                    }}>{wh.name}</div>
                                    <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "Roboto" }}>{wh.code}</div>
                                </div>
                                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                                    <div style={{
                                        fontFamily: "Roboto", fontSize: 16, fontWeight: 900,
                                        color: wh.color
                                    }}>{wh.totalValue}</div>
                                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{wh.totalSKUs.toLocaleString()} SKUs</div>
                                </div>
                            </div>

                            {/* Capacity bar */}
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                    <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>
                                        <i className="bi bi-boxes" style={{ marginRight: 4 }} />Capacity Used
                                    </span>
                                    <span style={{
                                        fontSize: 10, fontWeight: 700, fontFamily: "Roboto",
                                        color: wh.used > 85 ? "#D5691F" : "#78B833"
                                    }}>
                                        {wh.used}% / {wh.capacity}%
                                    </span>
                                </div>
                                <div style={{ height: 8, background: "var(--border-color)", borderRadius: 4, overflow: "hidden" }}>
                                    <div style={{
                                        width: `${(wh.used / wh.capacity) * 100}%`, height: "100%",
                                        background: wh.used > 85
                                            ? "linear-gradient(90deg, #b84a10, #D5691F)"
                                            : `linear-gradient(90deg, ${wh.color}99, ${wh.color})`,
                                        borderRadius: 4, transition: "width 1s",
                                    }} />
                                </div>
                            </div>
                        </div>

                        {/* Today's movement */}
                        <div style={{
                            display: "grid", gridTemplateColumns: "1fr 1fr",
                            padding: "10px 16px", borderBottom: "1px solid var(--border-soft)",
                            gap: 8,
                        }}>
                            <div style={{ textAlign: "center" }}>
                                <div style={{
                                    fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase",
                                    letterSpacing: "0.1em", fontFamily: "Roboto", marginBottom: 3
                                }}>Stock In</div>
                                <div style={{ fontFamily: "Roboto", fontSize: 18, fontWeight: 900, color: "#78B833" }}>
                                    +{wh.stockIn}
                                </div>
                                <div style={{ fontSize: 9, color: "var(--text-muted)" }}>units today</div>
                            </div>
                            <div style={{ textAlign: "center", borderLeft: "1px solid var(--border-soft)" }}>
                                <div style={{
                                    fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase",
                                    letterSpacing: "0.1em", fontFamily: "Roboto", marginBottom: 3
                                }}>Stock Out</div>
                                <div style={{ fontFamily: "Roboto", fontSize: 18, fontWeight: 900, color: "#D5691F" }}>
                                    -{wh.stockOut}
                                </div>
                                <div style={{ fontSize: 9, color: "var(--text-muted)" }}>units today</div>
                            </div>
                        </div>

                        {/* Category breakdown */}
                        <div style={{ padding: "10px 16px" }}>
                            <div style={{
                                fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase",
                                letterSpacing: "0.1em", fontFamily: "Roboto", marginBottom: 8, fontWeight: 700
                            }}>
                                Top Categories
                            </div>
                            {wh.categories.map((c, ci) => (
                                <div key={ci} style={{ marginBottom: 7 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                                        <span style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 600 }}>{c.name}</span>
                                        <span style={{
                                            fontFamily: "Roboto", fontSize: 10, fontWeight: 700,
                                            color: "var(--text-primary)"
                                        }}>{c.units.toLocaleString()}</span>
                                    </div>
                                    <div style={{ height: 4, background: "var(--border-color)", borderRadius: 2, overflow: "hidden" }}>
                                        <div style={{
                                            width: `${c.pct}%`, height: "100%", borderRadius: 2,
                                            background: `linear-gradient(90deg, ${wh.color}88, ${wh.color})`,
                                            transition: "width 1.2s",
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════
//  D. FAST MOVING & DEAD STOCK ANALYSIS
// ══════════════════════════════════════════════════════════════════════════
const InvStockAnalysis = () => {
    const W = 520, H = 100, PX = 20, PY = 10;
    const data = INV_MOCK.stockTrend;
    const maxVal = Math.max(...data.flatMap(d => [d.inward, d.outward]));

    const getLine = (key) => {
        const pts = data.map((d, i) => ({
            x: PX + (i / (data.length - 1)) * (W - PX * 2),
            y: H - PY - (d[key] / maxVal) * (H - PY * 2),
        }));
        const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
        const area = `${line} L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z`;
        return { pts, line, area };
    };

    const inward = getLine("inward");
    const outward = getLine("outward");

    // Velocity distribution across categories
    const velocityData = INV_MOCK.categories.map(c => ({
        name: c.name, fast: c.fastMoving, slow: c.slowMoving, dead: c.dead,
        color: c.color,
    }));

    return (
        <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16, marginBottom: 16 }}>

            {/* Stock trend chart */}
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
                        <i className="bi bi-bar-chart-line" style={{ color: "#78B833" }} />
                        Stock Inward vs Outward — Monthly
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                        {[["#78B833", "Stock In"], ["#0C4461", "Stock Out"]].map(([c, l]) => (
                            <div key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-secondary)" }}>
                                <div style={{ width: 16, height: 3, background: c, borderRadius: 2 }} /> {l}
                            </div>
                        ))}
                    </div>
                </div>
                <div style={{ padding: "14px 18px 10px" }}>
                    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
                        <defs>
                            <linearGradient id="invIn" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#78B833" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#78B833" stopOpacity="0" />
                            </linearGradient>
                            <linearGradient id="invOut" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#0C4461" stopOpacity="0.15" />
                                <stop offset="100%" stopColor="#0C4461" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        {[0.3, 0.6, 0.9].map(r => (
                            <line key={r} x1={PX} y1={PY + (1 - r) * (H - PY * 2)} x2={W - PX} y2={PY + (1 - r) * (H - PY * 2)}
                                stroke="var(--border-color)" strokeWidth="1" />
                        ))}
                        <path d={inward.area} fill="url(#invIn)" />
                        <path d={outward.area} fill="url(#invOut)" />
                        <path d={inward.line} fill="none" stroke="#78B833" strokeWidth="2.5" strokeLinecap="round" />
                        <path d={outward.line} fill="none" stroke="#0C4461" strokeWidth="2" strokeLinecap="round" />
                        <circle cx={inward.pts[inward.pts.length - 1].x} cy={inward.pts[inward.pts.length - 1].y}
                            r={5} fill="#78B833" stroke="var(--bg-card)" strokeWidth={2} />
                        <circle cx={outward.pts[outward.pts.length - 1].x} cy={outward.pts[outward.pts.length - 1].y}
                            r={4} fill="#0C4461" stroke="var(--bg-card)" strokeWidth={2} />
                    </svg>
                    <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: PX, paddingRight: PX, marginTop: 3 }}>
                        {data.map(d => (
                            <span key={d.m} style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "Roboto" }}>{d.m}</span>
                        ))}
                    </div>
                </div>
                {/* Summary */}
                <div style={{ display: "flex", borderTop: "1px solid var(--border-soft)" }}>
                    {[
                        { l: "Total Inward", v: "24,880", c: "#78B833", icon: "bi-arrow-down-circle" },
                        { l: "Total Outward", v: "20,360", c: "#0C4461", icon: "bi-arrow-up-circle" },
                        { l: "Net Stock", v: "+4,520", c: "#0B7636", icon: "bi-stack" },
                        { l: "Turnover Rate", v: "8.2×", c: "#D5691F", icon: "bi-arrow-repeat" },
                    ].map((s, i) => (
                        <div key={i} style={{
                            flex: 1, padding: "10px 12px",
                            borderRight: i < 3 ? "1px solid var(--border-soft)" : "none",
                            textAlign: "center",
                        }}>
                            <i className={`bi ${s.icon}`} style={{ color: s.c, fontSize: 14, display: "block", marginBottom: 3 }} />
                            <div style={{ fontFamily: "Roboto", fontSize: 16, fontWeight: 900, color: s.c }}>{s.v}</div>
                            <div style={{
                                fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase",
                                letterSpacing: "0.08em", fontFamily: "Roboto"
                            }}>{s.l}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Velocity analysis */}
            <div style={{
                background: "var(--bg-card)", border: "1px solid var(--border-color)",
                borderRadius: 12, overflow: "hidden", boxShadow: "var(--shadow-sm)",
            }}>
                <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border-soft)" }}>
                    <div style={{
                        fontFamily: "Roboto", fontSize: 13, fontWeight: 700,
                        color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 7
                    }}>
                        <i className="bi bi-speedometer2" style={{ color: "#D5691F" }} />
                        Fast / Slow / Dead Stock
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>By category</div>
                </div>
                <div style={{ padding: "10px 16px" }}>
                    {velocityData.map((v, i) => {
                        const total = v.fast + v.slow + v.dead;
                        return (
                            <div key={i} style={{ marginBottom: 10 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: 2, background: v.color, flexShrink: 0 }} />
                                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)", flex: 1 }}>{v.name}</span>
                                    <span style={{ fontFamily: "Roboto", fontSize: 10, color: "var(--text-muted)" }}>{total} SKUs</span>
                                </div>
                                {/* Stacked bar */}
                                <div style={{ height: 8, display: "flex", borderRadius: 4, overflow: "hidden" }}>
                                    <div style={{
                                        width: `${(v.fast / total) * 100}%`, background: "#78B833",
                                        transition: "width 1.2s",
                                    }} title={`Fast: ${v.fast}`} />
                                    <div style={{
                                        width: `${(v.slow / total) * 100}%`, background: "#FECC00",
                                        transition: "width 1.2s",
                                    }} title={`Slow: ${v.slow}`} />
                                    <div style={{
                                        width: `${(v.dead / total) * 100}%`, background: "#8fa3b8",
                                        transition: "width 1.2s",
                                    }} title={`Dead: ${v.dead}`} />
                                </div>
                                <div style={{ display: "flex", gap: 8, marginTop: 3 }}>
                                    <span style={{ fontSize: 9, color: "#5d9228" }}>
                                        <i className="bi bi-lightning-fill" /> {v.fast} fast
                                    </span>
                                    <span style={{ fontSize: 9, color: "#8a6e00" }}>
                                        <i className="bi bi-hourglass-split" /> {v.slow} slow
                                    </span>
                                    <span style={{ fontSize: 9, color: "#4a6080" }}>
                                        <i className="bi bi-moon-stars" /> {v.dead} dead
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    {/* Legend */}
                    <div style={{
                        display: "flex", gap: 12, marginTop: 8, padding: "8px 0",
                        borderTop: "1px solid var(--border-soft)"
                    }}>
                        {[["#78B833", "Fast Moving"], ["#FECC00", "Slow Moving"], ["#8fa3b8", "Dead Stock"]].map(([c, l]) => (
                            <div key={l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                                <span style={{ fontSize: 9, color: "var(--text-muted)" }}>{l}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════
//  E. REORDER SUGGESTIONS
// ══════════════════════════════════════════════════════════════════════════
const InvReorderSuggestions = () => {
    const [dismissed, setDismissed] = useState([]);
    const [raisedPO, setRaisedPO] = useState([]);

    const active = INV_MOCK.reorderSuggestions.filter(r => !dismissed.includes(r.sku));

    return (
        <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border-color)",
            borderRadius: 12, overflow: "hidden", boxShadow: "var(--shadow-sm)", marginBottom: 16,
        }}>
            <div style={{
                padding: "14px 18px", borderBottom: "1px solid var(--border-soft)",
                display: "flex", alignItems: "center", justifyContent: "space-between"
            }}>
                <div>
                    <div style={{
                        fontFamily: "Roboto", fontSize: 13, fontWeight: 700,
                        color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 7
                    }}>
                        <i className="bi bi-cart-plus-fill" style={{ color: "#D5691F" }} />
                        Smart Reorder Suggestions
                        {active.filter(r => r.urgency === "critical").length > 0 && (
                            <span style={{
                                padding: "2px 7px", borderRadius: 10,
                                background: "rgba(220,53,69,0.12)", color: "#dc3545",
                                border: "1px solid rgba(220,53,69,0.25)",
                                fontSize: 10, fontWeight: 700,
                            }}>
                                {active.filter(r => r.urgency === "critical").length} Critical
                            </span>
                        )}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                        AI-assisted · Based on velocity, stock level & lead times
                    </div>
                </div>
                <span style={{
                    padding: "3px 9px", borderRadius: 20,
                    background: "rgba(213,105,31,0.1)", color: "#D5691F",
                    border: "1px solid rgba(213,105,31,0.25)",
                    fontSize: 10, fontWeight: 700, fontFamily: "Roboto",
                }}>
                    {active.length} items need reorder
                </span>
            </div>

            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                        <tr style={{ background: "var(--bg-card-alt)", borderBottom: "2px solid var(--border-color)" }}>
                            {["SKU", "Product", "Category", "Current Stock", "Suggest Qty", "Est. Value", "Lead Time", "Preferred Vendor", "Urgency", "Action"].map(h => (
                                <th key={h} style={{
                                    padding: "10px 14px", textAlign: "left",
                                    fontFamily: "Roboto", fontSize: 9, fontWeight: 700,
                                    letterSpacing: "0.1em", textTransform: "uppercase",
                                    color: "var(--text-muted)", whiteSpace: "nowrap"
                                }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {active.map((item, i) => {
                            const isPOed = raisedPO.includes(item.sku);
                            return (
                                <tr key={i} style={{
                                    borderBottom: "1px solid var(--border-soft)",
                                    background: item.urgency === "critical" ? "rgba(220,53,69,0.02)" : "transparent",
                                    transition: "background 0.15s",
                                    opacity: isPOed ? 0.6 : 1,
                                }}
                                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-card-alt)"}
                                    onMouseLeave={e => e.currentTarget.style.background =
                                        item.urgency === "critical" ? "rgba(220,53,69,0.02)" : "transparent"}
                                >
                                    <td style={{
                                        padding: "10px 14px", fontFamily: "Roboto",
                                        fontSize: 10, color: "#0C4461", fontWeight: 700
                                    }}>{item.sku}</td>
                                    <td style={{
                                        padding: "10px 14px", fontWeight: 700,
                                        color: "var(--text-primary)", maxWidth: 180
                                    }}>
                                        <div style={{
                                            overflow: "hidden", textOverflow: "ellipsis",
                                            whiteSpace: "nowrap", maxWidth: 180
                                        }}>{item.name}</div>
                                    </td>
                                    <td style={{ padding: "10px 14px" }}>
                                        <span style={{
                                            padding: "2px 7px", borderRadius: 10,
                                            background: INV_MOCK.categories.find(c => c.name === item.cat)?.bgColor,
                                            color: INV_MOCK.categories.find(c => c.name === item.cat)?.color,
                                            fontSize: 9, fontWeight: 700, fontFamily: "Roboto",
                                        }}>{item.cat}</span>
                                    </td>
                                    <td style={{ padding: "10px 14px" }}>
                                        <span style={{
                                            fontFamily: "Roboto", fontSize: 13, fontWeight: 900,
                                            color: item.currentStock === 0 ? "#dc3545" : "#D5691F",
                                        }}>
                                            {item.currentStock === 0
                                                ? <><i className="bi bi-x-circle-fill" style={{ marginRight: 3 }} />OUT</>
                                                : item.currentStock}
                                        </span>
                                    </td>
                                    <td style={{ padding: "10px 14px" }}>
                                        <span style={{
                                            fontFamily: "Roboto", fontSize: 13, fontWeight: 900,
                                            color: "#0C4461"
                                        }}>{item.reorderQty.toLocaleString()} units</span>
                                    </td>
                                    <td style={{ padding: "10px 14px" }}>
                                        <span style={{
                                            fontFamily: "Roboto", fontSize: 12, fontWeight: 700,
                                            color: "#0B7636"
                                        }}>{item.estValue}</span>
                                    </td>
                                    <td style={{ padding: "10px 14px" }}>
                                        <span style={{
                                            display: "inline-flex", alignItems: "center", gap: 4,
                                            fontSize: 11, color: "var(--text-secondary)", fontWeight: 600,
                                        }}>
                                            <i className="bi bi-clock" style={{ color: "var(--text-muted)" }} />
                                            {item.leadDays} days
                                        </span>
                                    </td>
                                    <td style={{ padding: "10px 14px", fontSize: 11, color: "var(--text-secondary)", fontWeight: 600 }}>
                                        {item.vendor}
                                    </td>
                                    <td style={{ padding: "10px 14px" }}>
                                        <StockBadge status={item.urgency} />
                                    </td>
                                    <td style={{ padding: "10px 14px" }}>
                                        <div style={{ display: "flex", gap: 6 }}>
                                            {isPOed ? (
                                                <span style={{
                                                    display: "inline-flex", alignItems: "center", gap: 4,
                                                    padding: "4px 10px", borderRadius: 5,
                                                    background: "rgba(120,184,51,0.12)", color: "#5d9228",
                                                    fontSize: 10, fontWeight: 700, fontFamily: "Roboto",
                                                    border: "1px solid rgba(120,184,51,0.3)",
                                                }}>
                                                    <i className="bi bi-check2" /> PO Raised
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => setRaisedPO(p => [...p, item.sku])}
                                                    style={{
                                                        padding: "4px 10px", borderRadius: 5,
                                                        background: "#0C4461", color: "white",
                                                        border: "none", fontSize: 10, fontWeight: 700,
                                                        fontFamily: "Roboto", cursor: "pointer",
                                                        transition: "all 0.15s", display: "flex",
                                                        alignItems: "center", gap: 4,
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = "#082f44"}
                                                    onMouseLeave={e => e.currentTarget.style.background = "#0C4461"}
                                                >
                                                    <i className="bi bi-plus-circle" /> Raise PO
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setDismissed(p => [...p, item.sku])}
                                                style={{
                                                    padding: "4px 8px", borderRadius: 5,
                                                    background: "none", color: "var(--text-muted)",
                                                    border: "1px solid var(--border-color)",
                                                    fontSize: 10, cursor: "pointer",
                                                    transition: "all 0.15s",
                                                }}
                                                title="Dismiss"
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = "#dc3545"; e.currentTarget.style.color = "#dc3545"; }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-color)"; e.currentTarget.style.color = "var(--text-muted)"; }}
                                            >
                                                <i className="bi bi-x" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {active.length === 0 && (
                            <tr><td colSpan={10} style={{ padding: "28px", textAlign: "center", color: "#78B833" }}>
                                <i className="bi bi-check-circle-fill" style={{ fontSize: 24, display: "block", marginBottom: 8 }} />
                                <div style={{ fontFamily: "Roboto", fontWeight: 700 }}>All items are sufficiently stocked!</div>
                            </td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════
//  MAIN EXPORT: InventoryManagement
// ══════════════════════════════════════════════════════════════════════════
const InventoryManagement = () => {
    const [selectedCat, setSelectedCat] = useState(null);

    // Top KPIs
    const totalSKUs = INV_MOCK.categories.reduce((s, c) => s + c.totalSKUs, 0);
    const totalLow = INV_MOCK.categories.reduce((s, c) => s + c.lowStock, 0);
    const totalOut = INV_MOCK.categories.reduce((s, c) => s + c.outOfStock, 0);

    return (
        <div>
            {/* ── Top KPI strip ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 16 }}>
                {[
                    { label: "Total SKUs", value: totalSKUs, delta: "10 categories", type: "up", icon: "bi-box-seam", color: "#0C4461" },
                    { label: "Low Stock Alerts", value: totalLow, delta: "Needs reorder", type: "warn", icon: "bi-exclamation-circle", color: "#D5691F" },
                    { label: "Out of Stock", value: totalOut, delta: "Urgent PO needed", type: "down", icon: "bi-x-circle", color: "#dc3545" },
                    { label: "Reorder Pending", value: INV_MOCK.reorderSuggestions.length, delta: "₹1.66 Cr est.", type: "warn", icon: "bi-cart-plus", color: "#FECC00" },
                ].map((k, i) => (
                    <div key={i} style={{
                        background: "var(--bg-card)", border: "1px solid var(--border-color)",
                        borderRadius: 12, padding: "16px 18px",
                        borderBottom: `3px solid ${k.color}`,
                        boxShadow: "var(--shadow-sm)", transition: "all 0.22s", cursor: "pointer",
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
                                background: k.color + "18", display: "flex", alignItems: "center",
                                justifyContent: "center", fontSize: 16, color: k.color
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

            {/* ── Category Grid ── */}
            <InvCategoryGrid onSelectCat={setSelectedCat} selectedCat={selectedCat} />

            {/* ── SKU Stock Table ── */}
            <InvStockTable selectedCat={selectedCat} />

            {/* ── Warehouse View ── */}
            <InvWarehouseView />

            {/* ── Fast/Dead Analysis + Trend ── */}
            <InvStockAnalysis />

            {/* ── Reorder Suggestions ── */}
            <InvReorderSuggestions />
        </div>
    );
};

export default InventoryManagement;