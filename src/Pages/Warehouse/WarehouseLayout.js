import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faTachometerAlt,
    faArrowDown,
    faPeopleCarry,
    faTruck,
    faExchangeAlt,
    faBars,
    faUser,
    faSignOutAlt,
    faSyncAlt,
    faBell
} from "@fortawesome/free-solid-svg-icons";

import WarehouseDashboard from "./WarehouseDashboard";
import WarehouseInward from "./WarehouseInward";
import WarehouseDispatch from "./WarehouseDispatch";
import WarehouseTransferModule from "./WarehouseTransferModule";

const menuItems = [
    { path: "/warehouse/dashboard", label: "Dashboard", icon: faTachometerAlt },
    { path: "/warehouse/inward", label: "Stock Inward", icon: faArrowDown },
    { path: "/warehouse/put-away", label: "Put Away", icon: faPeopleCarry },
    { path: "/warehouse/dispatch", label: "Dispatch", icon: faTruck },
    { path: "/warehouse/transfer", label: "Internal Transfer", icon: faExchangeAlt },
];

const WarehouseLayout = () => {
    const [warehouseAuth, setWarehouseAuth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const raw = sessionStorage.getItem("warehouseAuth");
        if (!raw) {
            navigate("/warehouse/login");
            return;
        }
        try {
            const parsed = JSON.parse(raw);
            if (!parsed?.id) {
                navigate("/warehouse/login");
                return;
            }
            setWarehouseAuth(parsed);
        } catch (error) {
            navigate("/warehouse/login");
        }
        setLoading(false);
    }, [navigate]);

    const handleLogout = () => {
        sessionStorage.removeItem("warehouseAuth");
        toast.success("Logged out successfully");
        navigate("/warehouse/login");
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

    if (!warehouseAuth) return null;

    return (
        <div className="d-flex" style={{ minHeight: "100vh" }}>
            {/* Sidebar */}
            <aside
                className="d-flex flex-column text-white"
                style={{
                    width: sidebarOpen ? "260px" : "70px",
                    height: "100vh",
                    background: "#0C4461",
                    transition: "width 0.3s ease",
                    position: "fixed",
                    top: 0,
                    left: 0,
                    zIndex: 1000,
                    overflowY: "auto",
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
                            Warehouse Panel
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

                {/* Warehouse Info */}
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
                                    {warehouseAuth.name || "Warehouse"}
                                </div>
                                <small style={{ opacity: 0.8 }}>{warehouseAuth.location || "Location"}</small>
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

                    {/* Quick Navigation Section */}
                    {sidebarOpen && (
                        <div className="mt-4 px-3">
                            <h6 className="text-uppercase mb-3" style={{ fontSize: "0.7rem", opacity: 0.6, letterSpacing: "1px" }}>
                                Quick Navigation
                            </h6>
                            <div className="d-flex flex-column gap-2">
                                <Link to="/warehouse/inward" className="btn btn-sm btn-dark text-left d-flex align-items-center py-2 border-0" style={{ background: "rgba(255,255,255,0.05)", fontSize: "0.85rem" }}>
                                    <FontAwesomeIcon icon={faArrowDown} className="text-success mr-2" style={{ width: "15px" }} />
                                    <span>Inward</span>
                                </Link>
                                <Link to="/warehouse/dispatch" className="btn btn-sm btn-dark text-left d-flex align-items-center py-2 border-0" style={{ background: "rgba(255,255,255,0.05)", fontSize: "0.85rem" }}>
                                    <FontAwesomeIcon icon={faTruck} className="text-info mr-2" style={{ width: "15px" }} />
                                    <span>Dispatch</span>
                                </Link>
                                <button onClick={() => navigate("/warehouse/dashboard?filter=low_stock")} className="btn btn-sm btn-dark text-left d-flex align-items-center py-2 border-0" style={{ background: "rgba(255,255,255,0.05)", fontSize: "0.85rem" }}>
                                    <FontAwesomeIcon icon={faBell} className="text-warning mr-2" style={{ width: "15px" }} />
                                    <span>Low Stock</span>
                                </button>
                                <button onClick={() => window.location.reload()} className="btn btn-sm btn-dark text-left d-flex align-items-center py-2 border-0" style={{ background: "rgba(255,255,255,0.05)", fontSize: "0.85rem" }}>
                                    <FontAwesomeIcon icon={faSyncAlt} className="text-primary mr-2" style={{ width: "15px" }} />
                                    <span>Refresh</span>
                                </button>
                            </div>
                        </div>
                    )}
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
                    maxWidth: sidebarOpen ? "calc(100vw - 260px)" : "calc(100vw - 70px)",
                    overflowX: "hidden"
                }}
            >
                {/* Top Header */}
                <header
                    className="d-flex align-items-center px-4 bg-white shadow-sm"
                    style={{ height: "60px", position: "sticky", top: 0, zIndex: 999 }}
                >
                    <div className="d-flex align-items-center">
                        <button 
                            className="btn btn-link text-dark p-0 mr-3" 
                            onClick={() => navigate(-1)}
                            style={{ fontSize: "1.2rem", border: "none" }}
                        >
                            <i className="fa fa-arrow-left" />
                        </button>
                        <h5 className="m-0 text-dark font-weight-bold">
                            {menuItems.find((m) => m.path === location.pathname)?.label || "Warehouse Dashboard"}
                        </h5>
                    </div>
                    <div className="ml-auto d-flex align-items-center">
                        <span className="text-muted">
                            {warehouseAuth.name} ({warehouseAuth.location})
                        </span>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-0">
                    <Routes>
                        <Route path="dashboard" element={<WarehouseDashboard />} />
                        <Route path="inward" element={<WarehouseInward />} />
                        <Route path="put-away" element={<WarehouseInward />} />
                        <Route path="dispatch" element={<WarehouseDispatch />} />
                        <Route path="transfer" element={<WarehouseTransferModule />} />
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

export default WarehouseLayout;
