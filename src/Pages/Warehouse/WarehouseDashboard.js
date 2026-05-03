import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import "bootstrap/dist/css/bootstrap.min.css";
import "./WarehouseDashboard.css";

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

function WarehouseDashboard() {
  const navigate = useNavigate();
  const [warehouseAuth, setWarehouseAuth] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [summary, setSummary] = useState({
    totalProducts: 0,
    totalStock: 0,
    lowStockCount: 0,
    recentActivity: [],
    lowStockItems: []
  });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, low_stock

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
  }, [navigate]);

  useEffect(() => {
    const fetchWarehouseStock = async () => {
      if (!warehouseAuth?.id) return;

      setLoading(true);
      try {
        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/warehouse-stock/by-warehouse/${warehouseAuth.id}`);
        if (response.ok) {
          const data = await response.json();
          setStocks(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Error fetching stock:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchSummary = async () => {
      if (!warehouseAuth?.id) return;
      setStatsLoading(true);
      try {
        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/warehouse-dashboard/summary/${warehouseAuth.id}`);
        if (response.ok) {
          const data = await response.json();
          setSummary(data);
        }
      } catch (error) {
        console.error("Error fetching summary:", error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchWarehouseStock();
    fetchSummary();
  }, [warehouseAuth]);

  const normalizedStocks = useMemo(() => {
    return stocks.map((item) => ({
      id: item.id || `${item.productId}-${item.productVariationId || "na"}`,
      productName: item.productName || item.product?.productName || "-",
      sku: item.productSku || item.sku || item.product?.sku || "-",
      variationName:
        item.productVariationName ||
        item.variationName ||
        item.productVariation?.variationValue ||
        "",
      quantity: toNumber(item.quantity),
    }));
  }, [stocks]);

  const filteredStocks = useMemo(() => {
    let result = normalizedStocks;

    // Filter by Type
    if (filterType === "low_stock") {
      result = result.filter(s => s.quantity < 10);
    }

    // Filter by Search Text
    const text = searchText.trim().toLowerCase();
    if (text) {
      result = result.filter((item) => {
        const searchable = [item.productName, item.sku, item.variationName]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return searchable.includes(text);
      });
    }

    return result;
  }, [normalizedStocks, searchText, filterType]);

  const handleLogout = () => {
    sessionStorage.removeItem("warehouseAuth");
    toast.success("Logged out successfully");
    navigate("/warehouse/login");
  };

  if (!warehouseAuth) return null;

  return (
    <div className="warehouse-dashboard-wrapper py-4 px-3">
      {/* Header Section */}
      <div className="container-fluid mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="fw-bold text-dark mb-0">{warehouseAuth.name || "Warehouse"} Dashboard</h2>
            <p className="text-muted mb-0">
              <i className="fa fa-map-marker-alt me-2" /> {warehouseAuth.location || "Unknown Location"}
            </p>
          </div>
          <div className="d-flex gap-3">
            <button className="btn btn-white border shadow-sm rounded-pill px-4" onClick={() => window.location.reload()}>
              <i className="fa fa-sync-alt me-2" /> Refresh
            </button>
            <button className="btn btn-danger rounded-pill px-4" onClick={handleLogout}>
              <i className="fa fa-sign-out-alt me-2" /> Logout
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="container-fluid mb-4">
        <div className="row g-4">
          <div className="col-md-3">
            <div className="card warehouse-summary-card bg-products">
              <div className="card-body">
                <div>
                  <p className="stat-label">Unique Products</p>
                  <h3 className="stat-value">{statsLoading ? "..." : summary.totalProducts}</h3>
                </div>
                <div className="icon-box">
                  <i className="fa fa-box-open" />
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card warehouse-summary-card bg-stock">
              <div className="card-body">
                <div>
                  <p className="stat-label">Total Items</p>
                  <h3 className="stat-value">{statsLoading ? "..." : summary.totalStock}</h3>
                </div>
                <div className="icon-box">
                  <i className="fa fa-boxes" />
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card warehouse-summary-card bg-alerts" style={{ cursor: 'pointer' }} onClick={() => setFilterType("low_stock")}>
              <div className="card-body">
                <div>
                  <p className="stat-label">Low Stock Alerts</p>
                  <h3 className="stat-value">{statsLoading ? "..." : summary.lowStockCount}</h3>
                </div>
                <div className="icon-box">
                  <i className="fa fa-exclamation-triangle" />
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card warehouse-summary-card bg-activity">
              <div className="card-body">
                <div>
                  <p className="stat-label">Recent Transfers</p>
                  <h3 className="stat-value">{statsLoading ? "..." : summary.recentActivity.length}</h3>
                </div>
                <div className="icon-box">
                  <i className="fa fa-exchange-alt" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-fluid">
        <div className="row">
          {/* Main Stock Table */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-header bg-white border-0 py-3">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <h5 className="mb-0 fw-bold">Inventory Overview</h5>
                  <div className="d-flex gap-2 align-items-center">
                    <select
                      className="form-select form-select-sm"
                      style={{ width: '150px' }}
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                    >
                      <option value="all">All Items</option>
                      <option value="low_stock">Low Stock Only</option>
                    </select>
                    <div className="input-group input-group-sm" style={{ width: '250px' }}>
                      <span className="input-group-text bg-white border-end-0"><i className="fa fa-search" /></span>
                      <input
                        type="text"
                        className="form-control border-start-0"
                        placeholder="Search SKU or Name..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light text-muted">
                      <tr>
                        <th className="ps-4">Product</th>
                        <th>SKU</th>
                        <th>Variation</th>
                        <th className="text-center">Current Qty</th>
                        <th className="text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan="5" className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></td></tr>
                      ) : filteredStocks.length === 0 ? (
                        <tr><td colSpan="5" className="text-center py-5 text-muted">No stock items found.</td></tr>
                      ) : (
                        filteredStocks.map((item) => (
                          <tr key={item.id}>
                            <td className="ps-4 fw-semibold text-dark">{item.productName}</td>
                            <td><span className="badge bg-light text-dark fw-normal">{item.sku}</span></td>
                            <td>{item.variationName || "-"}</td>
                            <td className="text-center fw-bold">{item.quantity}</td>
                            <td className="text-center">
                              {item.quantity === 0 ? (
                                <span className="badge bg-danger">Out of Stock</span>
                              ) : item.quantity < 10 ? (
                                <span className="badge bg-warning text-dark">Low Stock</span>
                              ) : (
                                <span className="badge bg-success">Healthy</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Activity & Navigation */}
          <div className="col-lg-4">
            {/* Quick Navigation */}
            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-header bg-white border-0 py-3">
                <h5 className="mb-0 fw-bold">Quick Navigation</h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-6">
                    <Link to="/warehouse/inward" className="quick-nav-btn">
                      <i className="fa fa-arrow-down text-success" />
                      <span>Inward</span>
                    </Link>
                  </div>
                  <div className="col-6">
                    <Link to="/warehouse/dispatch" className="quick-nav-btn">
                      <i className="fa fa-truck text-info" />
                      <span>Dispatch</span>
                    </Link>
                  </div>
                  <div className="col-6">
                    <Link to="#" className="quick-nav-btn" onClick={() => window.location.reload()}>
                      <i className="fa fa-sync-alt text-primary" />
                      <span>Refresh</span>
                    </Link>
                  </div>
                  <div className="col-6">
                    <Link to="#" className="quick-nav-btn" onClick={() => setFilterType("low_stock")}>
                      <i className="fa fa-bell text-warning" />
                      <span>Alerts</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-header bg-white border-0 py-3">
                <h5 className="mb-0 fw-bold">Recent Transfers</h5>
              </div>
              <div className="card-body">
                {statsLoading ? (
                  <div className="text-center py-4"><div className="spinner-border spinner-border-sm text-primary"></div></div>
                ) : summary.recentActivity.length === 0 ? (
                  <p className="text-center text-muted py-4 mb-0">No recent activity.</p>
                ) : (
                  summary.recentActivity.map((activity) => (
                    <div key={activity.id} className={`activity-feed-item status-${activity.status}`}>
                      <div className="d-flex justify-content-between">
                        <small className="text-muted fw-bold">{activity.referenceNumber || "#TRF-" + activity.id}</small>
                        <small className="text-muted">{new Date(activity.date).toLocaleDateString()}</small>
                      </div>
                      <p className="mb-1 fw-semibold text-dark">Stock Transfer Received</p>
                      <div className="d-flex justify-content-between align-items-center">
                        <small>{activity.itemCount} Items</small>
                        <span className={`badge rounded-pill ${activity.status === 'completed' ? 'bg-success' :
                            activity.status === 'pending' ? 'bg-warning text-dark' : 'bg-info'
                          } py-1 px-2`} style={{ fontSize: '0.7rem' }}>
                          {activity.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                {summary.recentActivity.length > 0 && (
                  <button className="btn btn-link btn-sm w-100 text-decoration-none mt-2">View All Activity</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WarehouseDashboard;

