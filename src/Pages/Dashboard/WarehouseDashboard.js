import React, { useEffect, useState } from "react";
import axios from "axios";
import './WarehouseDashboard.css';

// Summary Cards Component
const WarehouseSummaryCards = ({ stats }) => (
    <div className="row mb-4">
        <div className="col-md-3">
            <div className="dashboard-card users">
                <h3>{stats.totalStock}</h3>
                <p>Total Stock</p>
            </div>
        </div>
        <div className="col-md-3">
            <div className="dashboard-card vendors">
                <h3>{stats.activeOrders}</h3>
                <p>Active Orders</p>
            </div>
        </div>
        <div className="col-md-3">
            <div className="dashboard-card warning">
                <h3>{stats.lowStockCount}</h3>
                <p>Low Stock Items</p>
            </div>
        </div>
        <div className="col-md-3">
            <div className="dashboard-card info">
                <h3>{stats.pendingDispatches}</h3>
                <p>Pending Dispatches</p>
            </div>
        </div>
    </div>
);

// Low Stock Alert Component
const LowStockAlert = ({ items }) => (
    <div className="card mb-4">
        <div className="card-header bg-warning text-dark">Low Stock Alerts</div>
        <ul className="list-group list-group-flush">
            {items.length === 0 ? (
                <li className="list-group-item">No low stock items.</li>
            ) : (
                items.map(item => (
                    <li className="list-group-item" key={item.sku}>
                        {item.name} (SKU: {item.sku}) - {item.stock} left
                    </li>
                ))
            )}
        </ul>
    </div>
);

// Live Activity Feed Component
const WarehouseActivityFeed = ({ activities }) => (
    <div className="card mb-4">
        <div className="card-header bg-info text-white">Live Warehouse Activity</div>
        <ul className="list-group list-group-flush">
            {activities.length === 0 ? (
                <li className="list-group-item">No recent activity.</li>
            ) : (
                activities.map((act, idx) => (
                    <li className="list-group-item" key={idx}>
                        <span className="badge bg-secondary me-2">{act.type}</span>
                        {act.description} <span className="text-muted float-end">{act.time}</span>
                    </li>
                ))
            )}
        </ul>
    </div>
);

// Quick Navigation Shortcuts
const QuickShortcuts = () => (
    <div className="mb-4 d-flex flex-wrap gap-2">
        <a href="/StockInward" className="btn btn-outline-primary">Stock Inward</a>
        <a href="/PutAway" className="btn btn-outline-success">Put-Away</a>
        <a href="/InternalTransfer" className="btn btn-outline-warning">Internal Transfer</a>
        <a href="/Picking" className="btn btn-outline-info">Picking</a>
        <a href="/Dispatch" className="btn btn-outline-danger">Dispatch</a>
        <a href="/Returns" className="btn btn-outline-secondary">Returns</a>
    </div>
);

// Advanced Filtering (basic placeholder)
const AdvancedFilter = ({ onFilter }) => (
    <div className="mb-4">
        <input type="text" className="form-control" placeholder="Filter by SKU, product, or status..." onChange={e => onFilter(e.target.value)} />
    </div>
);

const WarehouseDashboard = () => {
    const [stats, setStats] = useState({ totalStock: 0, activeOrders: 0, lowStockCount: 0, pendingDispatches: 0 });
    const [lowStock, setLowStock] = useState([]);
    const [activities, setActivities] = useState([]);
    const [filter, setFilter] = useState("");

    // Example warehouseId, replace with actual logic (e.g., from user/session)
    const warehouseId = 1;
    useEffect(() => {
        axios.get(`/warehouse-dashboard/summary/${warehouseId}`)
            .then(res => {
                setStats({
                    totalStock: res.data.totalStock,
                    activeOrders: res.data.activeOrders || 0, // Placeholder, update as needed
                    lowStockCount: res.data.lowStockCount,
                    pendingDispatches: res.data.pendingDispatches || 0 // Placeholder, update as needed
                });
                setLowStock(res.data.lowStockItems || []);
                setActivities(res.data.recentActivity || []);
            });
        // Optionally, fetch low stock and activity from dedicated endpoints if needed:
        // axios.get(`/warehouse-dashboard/low-stock/${warehouseId}`).then(res => setLowStock(res.data));
        // axios.get(`/warehouse-dashboard/activity/${warehouseId}`).then(res => setActivities(res.data));
    }, [warehouseId]);

    // Filtered activity feed (basic example)
    const filteredActivities = activities.filter(act =>
        act.description.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="container-fluid">
            <h2 className="mb-4">Warehouse Dashboard</h2>
            <WarehouseSummaryCards stats={stats} />
            <QuickShortcuts />
            <AdvancedFilter onFilter={setFilter} />
            <div className="row">
                <div className="col-md-6">
                    <LowStockAlert items={lowStock} />
                </div>
                <div className="col-md-6">
                    <WarehouseActivityFeed activities={filteredActivities} />
                </div>
            </div>
        </div>
    );
};

export default WarehouseDashboard;
