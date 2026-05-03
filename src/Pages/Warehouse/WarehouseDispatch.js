import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "bootstrap/dist/css/bootstrap.min.css";

function WarehouseDispatch() {
  const navigate = useNavigate();
  const [warehouseAuth, setWarehouseAuth] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = sessionStorage.getItem("warehouseAuth");
    if (!raw) {
      navigate("/warehouse/login");
      return;
    }
    const parsed = JSON.parse(raw);
    setWarehouseAuth(parsed);
  }, [navigate]);

  useEffect(() => {
    const fetchPendingOrders = async () => {
      if (!warehouseAuth?.id) return;
      setLoading(true);
      try {
        // Fetching franchise orders
        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/sale-so-order/getall`);
        if (response.ok) {
          const data = await response.json();
          // Filter for pending orders (In a real system, you'd filter by status 'pending' and location/warehouse)
          setOrders(data.slice(0, 20)); // Just showing some for demo
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingOrders();
  }, [warehouseAuth]);

  const handleDispatch = async (orderId) => {
    if (!window.confirm("Confirm dispatch of this order? Stock will be deducted.")) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/warehouse-action/dispatch-order/${orderId}?warehouseId=${warehouseAuth.id}`, {
        method: "POST"
      });

      if (response.ok) {
        toast.success("Order dispatched successfully!");
        setOrders(prev => prev.filter(o => o.id !== orderId));
      } else {
        const err = await response.text();
        toast.error(err || "Failed to dispatch order");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  if (!warehouseAuth) return null;

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-0">Order Dispatch</h2>
          <p className="text-muted">Pick, Pack, and Dispatch Franchise Orders</p>
        </div>
        <button className="btn btn-outline-secondary" onClick={() => navigate("/warehouse/dashboard")}>
          <i className="fa fa-arrow-left me-2" /> Back to Dashboard
        </button>
      </div>

      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-4">Order ID</th>
                  <th>Franchise</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total Amount</th>
                  <th className="text-end pe-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="text-center py-5"><div className="spinner-border text-primary"></div></td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-5 text-muted">No pending orders to dispatch.</td></tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.id}>
                      <td className="ps-4 fw-bold text-primary">{o.orderId || `#ORD-${o.id}`}</td>
                      <td>{o.franchise || "Franchise"}</td>
                      <td>{new Date(o.orderDate).toLocaleDateString()}</td>
                      <td>{o.saleSoItem?.length || 0} Products</td>
                      <td>₹{o.netTotalAmount?.toLocaleString() || "0"}</td>
                      <td className="text-end pe-4">
                        <button className="btn btn-primary btn-sm rounded-pill px-3" onClick={() => handleDispatch(o.id)}>
                          <i className="fa fa-truck me-2" /> Dispatch
                        </button>
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
  );
}

export default WarehouseDispatch;
