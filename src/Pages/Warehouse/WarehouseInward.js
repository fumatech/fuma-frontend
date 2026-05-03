import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "bootstrap/dist/css/bootstrap.min.css";

function WarehouseInward() {
  const navigate = useNavigate();
  const [warehouseAuth, setWarehouseAuth] = useState(null);
  const [transfers, setTransfers] = useState([]);
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
    const fetchIncomingTransfers = async () => {
      if (!warehouseAuth?.id) return;
      setLoading(true);
      try {
        // Fetching transfers where target is this warehouse
        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/stock-transfer/getall?warehouseId=${warehouseAuth.id}`);
        if (response.ok) {
          const data = await response.json();
          // Filter for pending/in_transit
          setTransfers(data.filter(t => t.status === "pending" || t.status === "in_transit"));
        }
      } catch (error) {
        console.error("Error fetching transfers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchIncomingTransfers();
  }, [warehouseAuth]);

  const handleReceive = async (transferId) => {
    if (!window.confirm("Are you sure you want to receive this stock?")) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/warehouse-action/receive-transfer/${transferId}?warehouseId=${warehouseAuth.id}`, {
        method: "POST"
      });

      if (response.ok) {
        toast.success("Stock received successfully!");
        setTransfers(prev => prev.filter(t => t.id !== transferId));
      } else {
        const err = await response.text();
        toast.error(err || "Failed to receive stock");
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
          <h2 className="fw-bold text-dark mb-0">Incoming Stock (Inward)</h2>
          <p className="text-muted">Process transfers from FUMA or other locations</p>
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
                  <th className="ps-4">Reference No</th>
                  <th>Date</th>
                  <th>From</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th className="text-end pe-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="text-center py-5"><div className="spinner-border text-primary"></div></td></tr>
                ) : transfers.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-5 text-muted">No pending inward transfers.</td></tr>
                ) : (
                  transfers.map((t) => (
                    <tr key={t.id}>
                      <td className="ps-4 fw-bold">{t.referenceNumber || `#TRF-${t.id}`}</td>
                      <td>{new Date(t.date).toLocaleDateString()}</td>
                      <td>{t.locationFrom || "Main Office"}</td>
                      <td>{t.stockTransferItems?.length || 0} Products</td>
                      <td>
                        <span className={`badge rounded-pill ${t.status === 'in_transit' ? 'bg-info' : 'bg-warning text-dark'}`}>
                          {t.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="text-end pe-4">
                        <button className="btn btn-success btn-sm rounded-pill px-3" onClick={() => handleReceive(t.id)}>
                          <i className="fa fa-check me-2" /> Receive
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

export default WarehouseInward;
