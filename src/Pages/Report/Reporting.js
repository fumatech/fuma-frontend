import React, { useState, useEffect } from "react";
import "./Reporting.css";
import { toast } from "react-toastify";
import apiService from "../../utils/apiService";
import { useNavigate } from "react-router-dom";

const Reporting = () => {
    const [activeTab, setActiveTab] = useState("departments");
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalSales: 0,
        totalExpenses: 0,
        totalPurchases: 0,
        netProfit: 0,
        recentTransactions: []
    });
    const navigate = useNavigate();

    const simulateUrgentAlert = () => {
        toast.error("URGENT: Warehouse Stock Low for Item #1234!", {
            position: "top-center",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
        });
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [sales, purchases, expenses] = await Promise.all([
                    apiService.getSales(),
                    apiService.getPurchases(),
                    apiService.getExpenses()
                ]);

                // Calculate Totals
                // Safe check for arrays in case API fails or returns unexpected format
                const safeSales = Array.isArray(sales) ? sales : [];
                const safePurchases = Array.isArray(purchases) ? purchases : [];
                const safeExpenses = Array.isArray(expenses) ? expenses : [];

                const totalSalesVal = safeSales.reduce((acc, curr) => acc + (parseFloat(curr.netTotalAmount) || 0), 0);
                const totalPurchasesVal = safePurchases.reduce((acc, curr) => acc + (parseFloat(curr.netTotalAmount) || 0), 0);
                const totalExpensesVal = safeExpenses.reduce((acc, curr) => acc + (parseFloat(curr.totalAmount) || 0), 0);

                // Prepare Recent Transactions
                const salesTrx = safeSales.map(s => ({
                    id: s.referenceNumber || `#SALE-${s.id}`,
                    type: "Sale",
                    date: s.orderDate || s.date, // normalizing date
                    status: "Completed", // Assuming sales in list are completed or check s.status
                    amount: s.netTotalAmount,
                    rawDate: new Date(s.orderDate || s.date)
                }));

                const purchaseTrx = safePurchases.map(p => ({
                    id: p.referenceNumber || `#PUR-${p.id}`,
                    type: "Purchase",
                    date: p.purchaseDate || p.date,
                    status: p.status || "Pending",
                    amount: p.netTotalAmount,
                    rawDate: new Date(p.purchaseDate || p.date)
                }));

                const expenseTrx = safeExpenses.map(e => ({
                    id: e.referenceNo || `#EXP-${e.id}`,
                    type: "Expense",
                    date: e.date,
                    status: e.paymentStatus || "Paid",
                    amount: e.totalAmount,
                    rawDate: new Date(e.date)
                }));

                const allTrx = [...salesTrx, ...purchaseTrx, ...expenseTrx]
                    .sort((a, b) => b.rawDate - a.rawDate)
                    .slice(0, 10);

                setStats({
                    totalSales: totalSalesVal,
                    totalExpenses: totalExpensesVal,
                    totalPurchases: totalPurchasesVal,
                    netProfit: totalSalesVal - (totalPurchasesVal + totalExpensesVal),
                    recentTransactions: allTrx
                });

            } catch (error) {
                console.error("Failed to fetch reporting data", error);
                toast.error("Failed to load some reporting data.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const departments = [
        { name: "Sales", icon: "fas fa-chart-line", color: "text-primary", route: "/AllSaleOrders" },
        { name: "Warehouse", icon: "fas fa-warehouse", color: "text-warning", route: "/StockReport" },
        { name: "Franchise", icon: "fas fa-store-alt", color: "text-success", route: "/Customer" },
        { name: "Vendor", icon: "fas fa-truck", color: "text-danger", route: "/Vendor" },
        { name: "HR", icon: "fas fa-users", color: "text-info", route: "/HRMDashboard" },
        { name: "Finance", icon: "fas fa-coins", color: "text-secondary", route: "/Accounts" },
        { name: "CRM", icon: "fas fa-handshake", color: "text-primary", route: "/CRMDashboard" },
        { name: "Marketing", icon: "fas fa-bullhorn", color: "text-danger", route: "/Campaigns" },
        { name: "Operations", icon: "fas fa-cogs", color: "text-dark", route: "/ListProducts" },
    ];

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
    };

    const calculateBreakdowns = () => {
        // Sales by Status (Mock logic if status is not standard, assuming 'paymentStatus' or similar)
        const salesByStatus = { Paid: 0, Pending: 0, Partial: 0 };
        stats.recentTransactions.filter(t => t.type === 'Sale').forEach(s => {
            // This is a simplified logic as we are using the 'recentTransactions' slice. 
            // Ideally we should process the full 'sales' array from state, but we didn't save it to state.
            // Let's rely on the small sample or re-fetch/store full data if accurate breakdown is needed.
        });

        // Actually, let's use the totals we already have for a simple summary
        return { salesByStatus };
    };

    const renderContent = () => {
        switch (activeTab) {
            case "departments":
                return (
                    <div className="row">
                        {departments.map((dept, index) => (
                            <div key={index} className="col-lg-3 col-md-4 col-sm-6 mb-4">
                                <div
                                    className="card shadow-sm department-card h-100"
                                    onClick={() => dept.route && navigate(dept.route)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <div className="card-body text-center d-flex flex-column justify-content-center align-items-center">
                                        <i className={`${dept.icon} fa-3x mb-3 ${dept.color}`}></i>
                                        <h5 className="card-title font-weight-bold">{dept.name}</h5>
                                        <p className="card-text text-muted small">View Details</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case "upper":
                return (
                    <div className="hierarchy-view">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h4>Upper Management View</h4>
                            <span className="badge badge-info">{new Date().toLocaleDateString()}</span>
                        </div>
                        <div className="row">
                            <div className="col-md-3">
                                <div className="info-box bg-gradient-primary">
                                    <span className="info-box-icon"><i className="fas fa-chart-line"></i></span>
                                    <div className="info-box-content">
                                        <span className="info-box-text">Total Revenue</span>
                                        <span className="info-box-number">{loading ? "Loading..." : formatCurrency(stats.totalSales)}</span>
                                        <div className="progress">
                                            <div className="progress-bar" style={{ width: '70%' }}></div>
                                        </div>
                                        <span className="progress-description">
                                            Increased by 10% (Est.)
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="info-box bg-gradient-danger">
                                    <span className="info-box-icon"><i className="fas fa-dollar-sign"></i></span>
                                    <div className="info-box-content">
                                        <span className="info-box-text">Total Expenses</span>
                                        <span className="info-box-number">{loading ? "Loading..." : formatCurrency(stats.totalExpenses)}</span>
                                        <div className="progress">
                                            <div className="progress-bar" style={{ width: '40%' }}></div>
                                        </div>
                                        <span className="progress-description">
                                            Within Budget
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="info-box bg-gradient-warning">
                                    <span className="info-box-icon"><i className="fas fa-shopping-cart"></i></span>
                                    <div className="info-box-content">
                                        <span className="info-box-text">Total Purchases</span>
                                        <span className="info-box-number">{loading ? "Loading..." : formatCurrency(stats.totalPurchases)}</span>
                                        <div className="progress">
                                            <div className="progress-bar" style={{ width: '60%' }}></div>
                                        </div>
                                        <span className="progress-description">
                                            Needs Review
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className={`info-box ${stats.netProfit >= 0 ? "bg-gradient-success" : "bg-gradient-secondary"}`}>
                                    <span className="info-box-icon"><i className="fas fa-wallet"></i></span>
                                    <div className="info-box-content">
                                        <span className="info-box-text">Net Profit (Est.)</span>
                                        <span className="info-box-number">{loading ? "Loading..." : formatCurrency(stats.netProfit)}</span>
                                        <div className="progress">
                                            <div className="progress-bar" style={{ width: '50%' }}></div>
                                        </div>
                                        <span className="progress-description">
                                            {stats.netProfit >= 0 ? "Healthy" : "Attention Needed"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case "middle":
                return (
                    <div className="hierarchy-view">
                        <h4>Middle Management View</h4>
                        <p className="text-muted">Operational breakdown and departmental performance.</p>

                        <div className="row">
                            {/* Visual Breakdown of Sales vs Expenses */}
                            <div className="col-md-6">
                                <div className="card">
                                    <div className="card-header border-0">
                                        <h3 className="card-title">Financial Overview</h3>
                                    </div>
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between align-items-center border-bottom mb-3">
                                            <p className="text-success text-xl">
                                                <i className="ion ion-ios-refresh-empty"></i>
                                            </p>
                                            <p className="d-flex flex-column text-right">
                                                <span className="font-weight-bold">
                                                    {formatCurrency(stats.totalSales)}
                                                </span>
                                                <span className="text-muted">TOTAL SALES</span>
                                            </p>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center border-bottom mb-3">
                                            <p className="text-danger text-xl">
                                                <i className="ion ion-ios-refresh-empty"></i>
                                            </p>
                                            <p className="d-flex flex-column text-right">
                                                <span className="font-weight-bold">
                                                    {formatCurrency(stats.totalExpenses)}
                                                </span>
                                                <span className="text-muted">TOTAL EXPENSES</span>
                                            </p>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center mb-0">
                                            <p className="text-warning text-xl">
                                                <i className="ion ion-ios-refresh-empty"></i>
                                            </p>
                                            <p className="d-flex flex-column text-right">
                                                <span className="font-weight-bold">
                                                    {formatCurrency(stats.totalPurchases)}
                                                </span>
                                                <span className="text-muted">TOTAL PURCHASES</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-6">
                                <div className="card">
                                    <div className="card-header">
                                        <h3 className="card-title">Department Quick Links</h3>
                                    </div>
                                    <div className="card-body p-0">
                                        <ul className="nav nav-pills flex-column">
                                            {departments.slice(0, 5).map((d, i) => (
                                                <li className="nav-item" key={i}>
                                                    <a
                                                        href="#"
                                                        className="nav-link"
                                                        onClick={(e) => { e.preventDefault(); navigate(d.route); }}
                                                    >
                                                        <i className={`${d.icon} text-secondary mr-2`}></i> {d.name}
                                                        <span className="float-right text-primary">
                                                            <i className="fas fa-arrow-right text-sm"></i>
                                                        </span>
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="callout callout-info mt-3">
                            <h5><i className="fas fa-info"></i> More Reports</h5>
                            <p>For detailed categorical breakdown, please visit specific department modules.</p>
                        </div>
                    </div>
                );
            case "lower":
                return (
                    <div className="hierarchy-view">
                        <h4>Lower Management View</h4>
                        <p>Detailed transactional data, Entry-level records.</p>
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Recent Transactions (Global)</h3>
                            </div>
                            <div className="card-body p-0 table-responsive">
                                <table className="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Type</th>
                                            <th>Date</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr><td colSpan="5" className="text-center">Loading Data...</td></tr>
                                        ) : stats.recentTransactions.length > 0 ? (
                                            stats.recentTransactions.map((trx, idx) => (
                                                <tr key={idx}>
                                                    <td>{trx.id}</td>
                                                    <td>
                                                        <span className={`badge ${trx.type === 'Sale' ? 'badge-primary' : trx.type === 'Purchase' ? 'badge-warning' : 'badge-danger'}`}>
                                                            {trx.type}
                                                        </span>
                                                    </td>
                                                    <td>{trx.date ? new Date(trx.date).toLocaleDateString() : 'N/A'}</td>
                                                    <td>{formatCurrency(trx.amount)}</td>
                                                    <td>{trx.status}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan="5" className="text-center">No recent transactions found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="content-wrapper">
            <section className="content-header">
                <div className="container-fluid">
                    <div className="row mb-2">
                        <div className="col-sm-6">
                            <h1>Reporting & Analytics</h1>
                        </div>
                        <div className="col-sm-6 text-right">
                            <button className="btn btn-danger btn-sm" onClick={simulateUrgentAlert}>
                                <i className="fas fa-bell mr-1"></i> Simulate Urgent Alert
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <section className="content">
                <div className="container-fluid">
                    {/* Tabs */}
                    <div className="row mb-4">
                        <div className="col-12">
                            <div className="card card-primary card-outline card-outline-tabs">
                                <div className="card-header p-0 border-bottom-0">
                                    <ul className="nav nav-tabs" id="custom-tabs-four-tab" role="tablist">
                                        <li className="nav-item">
                                            <a
                                                className={`nav-link ${activeTab === "departments" ? "active" : ""}`}
                                                onClick={() => setActiveTab("departments")}
                                                role="tab"
                                                href="#"
                                            >
                                                <i className="fas fa-th mr-2"></i>Departments
                                            </a>
                                        </li>
                                        <li className="nav-item">
                                            <a
                                                className={`nav-link ${activeTab === "upper" ? "active" : ""}`}
                                                onClick={() => setActiveTab("upper")}
                                                role="tab"
                                                href="#"
                                            >
                                                <i className="fas fa-user-tie mr-2"></i>Upper Management
                                            </a>
                                        </li>
                                        <li className="nav-item">
                                            <a
                                                className={`nav-link ${activeTab === "middle" ? "active" : ""}`}
                                                onClick={() => setActiveTab("middle")}
                                                role="tab"
                                                href="#"
                                            >
                                                <i className="fas fa-users-cog mr-2"></i>Middle Management
                                            </a>
                                        </li>
                                        <li className="nav-item">
                                            <a
                                                className={`nav-link ${activeTab === "lower" ? "active" : ""}`}
                                                onClick={() => setActiveTab("lower")}
                                                role="tab"
                                                href="#"
                                            >
                                                <i className="fas fa-clipboard-list mr-2"></i>Lower Management
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                                <div className="card-body">
                                    {renderContent()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Reporting;
