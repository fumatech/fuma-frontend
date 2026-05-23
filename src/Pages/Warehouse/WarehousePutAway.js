import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "bootstrap/dist/css/bootstrap.min.css";

function WarehousePutAway() {
  const navigate = useNavigate();
  const [warehouseAuth, setWarehouseAuth] = useState(null);
  const [activeTab, setActiveTab] = useState("config"); // "config" | "execute" | "map"

  // Config State
  const [racks, setRacks] = useState([]);
  const [bins, setBins] = useState({}); // rackId -> list of bins
  const [selectedRackId, setSelectedRackId] = useState("");
  const [newRackCode, setNewRackCode] = useState("");
  const [newBinCode, setNewBinCode] = useState("");
  const [newBinCapacity, setNewBinCapacity] = useState("");
  const [loadingLayout, setLoadingLayout] = useState(false);

  // Put-Away State
  const [unallocatedStock, setUnallocatedStock] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null); // Product selected for put away
  const [targetRackId, setTargetRackId] = useState("");
  const [targetBinId, setTargetBinId] = useState("");
  const [targetBins, setTargetBins] = useState([]);
  const [putAwayQty, setPutAwayQty] = useState("");
  const [loadingUnallocated, setLoadingUnallocated] = useState(false);
  const [executingPutAway, setExecutingPutAway] = useState(false);

  // Inventory Map State
  const [inventoryMap, setInventoryMap] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRack, setFilterRack] = useState("");
  const [loadingMap, setLoadingMap] = useState(false);

  // Initialize Auth
  useEffect(() => {
    const raw = sessionStorage.getItem("warehouseAuth");
    if (!raw) {
      navigate("/warehouse/login");
      return;
    }
    const parsed = JSON.parse(raw);
    setWarehouseAuth(parsed);
  }, [navigate]);

  // Fetch Racks and Bins
  const fetchRacksAndBins = async (warehouseId) => {
    if (!warehouseId) return;
    setLoadingLayout(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/putaway/racks/${warehouseId}`);
      if (response.ok) {
        const racksData = await response.json();
        setRacks(racksData);
        
        // Fetch bins for each rack
        const binMap = {};
        for (let rack of racksData) {
          const res = await fetch(`${process.env.REACT_APP_BASE_URL}/api/putaway/bins/${rack.id}`);
          if (res.ok) {
            binMap[rack.id] = await res.json();
          }
        }
        setBins(binMap);
      }
    } catch (error) {
      console.error("Error fetching racks/bins:", error);
    } finally {
      setLoadingLayout(false);
    }
  };

  // Fetch Unallocated Stock
  const fetchUnallocatedStock = async (warehouseId) => {
    if (!warehouseId) return;
    setLoadingUnallocated(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/putaway/unallocated/${warehouseId}`);
      if (response.ok) {
        setUnallocatedStock(await response.json());
      }
    } catch (error) {
      console.error("Error fetching unallocated stock:", error);
    } finally {
      setLoadingUnallocated(false);
    }
  };

  // Fetch Inventory Locations Map
  const fetchInventoryMap = async (warehouseId) => {
    if (!warehouseId) return;
    setLoadingMap(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/putaway/locations/${warehouseId}`);
      if (response.ok) {
        setInventoryMap(await response.json());
      }
    } catch (error) {
      console.error("Error fetching inventory map:", error);
    } finally {
      setLoadingMap(false);
    }
  };

  // Triggers on warehouseAuth loaded or tab change
  useEffect(() => {
    if (!warehouseAuth?.id) return;
    if (activeTab === "config") {
      fetchRacksAndBins(warehouseAuth.id);
    } else if (activeTab === "execute") {
      fetchUnallocatedStock(warehouseAuth.id);
      fetchRacksAndBins(warehouseAuth.id);
    } else if (activeTab === "map") {
      fetchInventoryMap(warehouseAuth.id);
    }
  }, [warehouseAuth, activeTab]);

  // Load target bins when rack changes in Put-Away
  useEffect(() => {
    if (!targetRackId) {
      setTargetBins([]);
      return;
    }
    const fetchTargetBins = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/putaway/bins/${targetRackId}`);
        if (response.ok) {
          const data = await response.json();
          setTargetBins(data.filter(b => b.status === "ACTIVE"));
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchTargetBins();
  }, [targetRackId]);

  // Create Rack
  const handleCreateRack = async (e) => {
    e.preventDefault();
    if (!newRackCode.trim()) return;
    try {
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/putaway/racks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouseId: warehouseAuth.id,
          rackCode: newRackCode.trim().toUpperCase(),
          status: "ACTIVE"
        })
      });
      if (response.ok) {
        toast.success("Rack created successfully!");
        setNewRackCode("");
        fetchRacksAndBins(warehouseAuth.id);
      } else {
        const err = await response.json();
        toast.error(err.message || "Failed to create rack");
      }
    } catch (error) {
      toast.error("Error creating rack");
    }
  };

  // Create Bin
  const handleCreateBin = async (e) => {
    e.preventDefault();
    if (!selectedRackId || !newBinCode.trim() || !newBinCapacity) {
      toast.error("Please fill in all bin details");
      return;
    }
    try {
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/putaway/bins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rackId: Number(selectedRackId),
          binCode: newBinCode.trim().toUpperCase(),
          capacity: Number(newBinCapacity),
          status: "ACTIVE"
        })
      });
      if (response.ok) {
        toast.success("Bin created successfully!");
        setNewBinCode("");
        setNewBinCapacity("");
        fetchRacksAndBins(warehouseAuth.id);
      } else {
        const err = await response.json();
        toast.error(err.message || "Failed to create bin");
      }
    } catch (error) {
      toast.error("Error creating bin");
    }
  };

  // Perform Put-Away
  const handlePerformPutAway = async (e) => {
    e.preventDefault();
    if (!selectedStock || !targetRackId || !targetBinId || !putAwayQty) {
      toast.error("All allocation fields are required");
      return;
    }
    const qty = Number(putAwayQty);
    if (qty <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }
    if (qty > selectedStock.unallocatedQuantity) {
      toast.error(`Quantity cannot exceed unallocated stock (${selectedStock.unallocatedQuantity})`);
      return;
    }

    setExecutingPutAway(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/putaway/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouseId: warehouseAuth.id,
          productId: selectedStock.productId,
          productVariationId: selectedStock.productVariationId,
          rackId: Number(targetRackId),
          binId: Number(targetBinId),
          quantity: qty,
          userId: warehouseAuth.id
        })
      });

      if (response.ok) {
        toast.success("Stock put-away successfully completed!");
        setSelectedStock(null);
        setTargetRackId("");
        setTargetBinId("");
        setPutAwayQty("");
        fetchUnallocatedStock(warehouseAuth.id);
      } else {
        const err = await response.json();
        toast.error(err.message || "Put-away failed");
      }
    } catch (error) {
      toast.error("Error executing put-away");
    } finally {
      setExecutingPutAway(false);
    }
  };

  if (!warehouseAuth) return null;

  return (
    <div className="container-fluid py-4" style={{ minHeight: "90vh" }}>
      {/* Title */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">Warehouse Put-Away Management</h2>
          <p className="text-muted">Physically organize stock allocations inside racks & storage bins.</p>
        </div>
        <button className="btn btn-outline-secondary rounded-pill px-4 shadow-sm" onClick={() => navigate("/warehouse/dashboard")}>
          <i className="fa fa-arrow-left me-2" /> Back to Dashboard
        </button>
      </div>

      {/* Tabs */}
      <div className="nav nav-pills mb-4 gap-2 bg-white p-2 rounded-4 shadow-sm">
        <button
          className={`nav-link rounded-3 px-4 py-2 fw-semibold ${activeTab === "config" ? "active" : "text-dark"}`}
          onClick={() => setActiveTab("config")}
          style={{ background: activeTab === "config" ? "#0C4461" : "transparent" }}
        >
          <i className="fa fa-cogs me-2" /> Layout Configurator
        </button>
        <button
          className={`nav-link rounded-3 px-4 py-2 fw-semibold ${activeTab === "execute" ? "active" : "text-dark"}`}
          onClick={() => setActiveTab("execute")}
          style={{ background: activeTab === "execute" ? "#0C4461" : "transparent" }}
        >
          <i className="fa fa-people-carry me-2" /> Put-Away Execution
        </button>
        <button
          className={`nav-link rounded-3 px-4 py-2 fw-semibold ${activeTab === "map" ? "active" : "text-dark"}`}
          onClick={() => setActiveTab("map")}
          style={{ background: activeTab === "map" ? "#0C4461" : "transparent" }}
        >
          <i className="fa fa-map me-2" /> Inventory Map
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* TAB 1: Layout Configurator */}
        {activeTab === "config" && (
          <div className="row g-4">
            {/* Create Rack Card */}
            <div className="col-lg-4">
              <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-header bg-white border-0 pt-4 px-4">
                  <h5 className="fw-bold text-dark mb-0">Create Rack</h5>
                </div>
                <div className="card-body px-4 pb-4">
                  <form onSubmit={handleCreateRack}>
                    <div className="mb-3">
                      <label className="form-label text-muted small fw-bold">RACK CODE</label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        placeholder="E.G. RACK-A"
                        value={newRackCode}
                        onChange={(e) => setNewRackCode(e.target.value)}
                        required
                      />
                    </div>
                    <button type="submit" className="btn text-white w-100 rounded-3 py-2 fw-bold" style={{ background: "#0C4461" }}>
                      <i className="fa fa-plus me-2" /> Add Rack
                    </button>
                  </form>
                </div>
              </div>

              {/* Create Bin Card */}
              <div className="card border-0 shadow-sm rounded-4">
                <div className="card-header bg-white border-0 pt-4 px-4">
                  <h5 className="fw-bold text-dark mb-0">Create Storage Bin</h5>
                </div>
                <div className="card-body px-4 pb-4">
                  <form onSubmit={handleCreateBin}>
                    <div className="mb-3">
                      <label className="form-label text-muted small fw-bold">SELECT RACK</label>
                      <select
                        className="form-select rounded-3"
                        value={selectedRackId}
                        onChange={(e) => setSelectedRackId(e.target.value)}
                        required
                      >
                        <option value="">-- Choose Rack --</option>
                        {racks.map(r => (
                          <option key={r.id} value={r.id}>{r.rackCode} ({r.status})</option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted small fw-bold">BIN CODE</label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        placeholder="E.G. A-01"
                        value={newBinCode}
                        onChange={(e) => setNewBinCode(e.target.value)}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted small fw-bold">BIN CAPACITY (UNITS)</label>
                      <input
                        type="number"
                        className="form-control rounded-3"
                        placeholder="E.G. 100"
                        value={newBinCapacity}
                        onChange={(e) => setNewBinCapacity(e.target.value)}
                        required
                      />
                    </div>
                    <button type="submit" className="btn text-white w-100 rounded-3 py-2 fw-bold" style={{ background: "#0C4461" }}>
                      <i className="fa fa-plus me-2" /> Add Storage Bin
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Layout Overview Visualizer */}
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm rounded-4" style={{ minHeight: "500px" }}>
                <div className="card-header bg-white border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                  <h5 className="fw-bold text-dark mb-0">Warehouse Floor Layout & Bins</h5>
                  <button className="btn btn-sm btn-outline-secondary rounded-pill" onClick={() => fetchRacksAndBins(warehouseAuth.id)}>
                    <i className="fa fa-sync-alt" /> Refresh
                  </button>
                </div>
                <div className="card-body px-4 pb-4">
                  {loadingLayout ? (
                    <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
                  ) : racks.length === 0 ? (
                    <div className="text-center py-5 text-muted">No racks configured yet. Add your first rack on the left!</div>
                  ) : (
                    <div className="row g-3">
                      {racks.map(rack => (
                        <div key={rack.id} className="col-md-6">
                          <div className="p-3 rounded-4 border" style={{ background: "#f8f9fa" }}>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <span className="fw-bold text-dark fs-5"><i className="fa fa-server me-2 text-primary" /> {rack.rackCode}</span>
                              <span className={`badge rounded-pill ${rack.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}`}>{rack.status}</span>
                            </div>
                            
                            {/* Bins List */}
                            <div className="d-flex flex-column gap-2">
                              {!bins[rack.id] || bins[rack.id].length === 0 ? (
                                <small className="text-muted italic">No bins configured inside this rack.</small>
                              ) : (
                                bins[rack.id].map(bin => {
                                  // Simplified capacity checker logic
                                  const pct = 0;
                                  return (
                                    <div key={bin.id} className="bg-white p-3 rounded-3 shadow-sm border-0">
                                      <div className="d-flex justify-content-between align-items-center mb-1">
                                        <span className="fw-bold text-secondary">{bin.binCode}</span>
                                        <small className="text-muted">Capacity: {bin.capacity} units</small>
                                      </div>
                                      <div className="progress rounded-pill" style={{ height: "10px" }}>
                                        <div 
                                          className={`progress-bar bg-success rounded-pill`} 
                                          role="progressbar" 
                                          style={{ width: `${pct}%` }}
                                        />
                                      </div>
                                      <div className="d-flex justify-content-between align-items-center mt-1">
                                        <small className="text-muted small">{pct}% occupied</small>
                                        <span className="badge bg-light text-success fw-semibold small">ACTIVE</span>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Put-Away Execution */}
        {activeTab === "execute" && (
          <div className="row g-4">
            {/* Unallocated Stock Cards List */}
            <div className="col-lg-7">
              <div className="card border-0 shadow-sm rounded-4" style={{ minHeight: "500px" }}>
                <div className="card-header bg-white border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="fw-bold text-dark mb-0">Receiving Bay (Unallocated Stock)</h5>
                    <small className="text-muted">Newly arrived items awaiting physical bin placements</small>
                  </div>
                  <button className="btn btn-sm btn-outline-secondary rounded-pill" onClick={() => fetchUnallocatedStock(warehouseAuth.id)}>
                    <i className="fa fa-sync" /> Refresh
                  </button>
                </div>
                <div className="card-body p-0">
                  {loadingUnallocated ? (
                    <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
                  ) : unallocatedStock.length === 0 ? (
                    <div className="text-center py-5 text-muted px-4">
                      <i className="fa fa-check-circle text-success fs-1 mb-3 d-block" />
                      All stock has been successfully put away! No unallocated inventory in the receiving bay.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th className="ps-4">Product Info</th>
                            <th>Total Stock</th>
                            <th>Unallocated</th>
                            <th className="text-end pe-4">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {unallocatedStock.map((item, idx) => (
                            <tr key={idx} className={selectedStock?.productId === item.productId && selectedStock?.productVariationId === item.productVariationId ? "table-active" : ""}>
                              <td className="ps-4">
                                <div className="fw-bold text-dark">{item.productName}</div>
                                {item.productVariationName && <small className="badge bg-secondary me-2">{item.productVariationName}</small>}
                                <small className="text-muted">SKU: {item.productSku}</small>
                              </td>
                              <td><span className="fw-semibold text-secondary">{item.totalQuantity}</span></td>
                              <td><span className="badge bg-warning text-dark px-3 py-2 rounded-pill fw-bold">{item.unallocatedQuantity} units</span></td>
                              <td className="text-end pe-4">
                                <button className="btn text-white btn-sm rounded-pill px-3 fw-bold" style={{ background: "#0C4461" }} onClick={() => {
                                  setSelectedStock(item);
                                  setTargetRackId("");
                                  setTargetBinId("");
                                  setPutAwayQty(item.unallocatedQuantity.toString());
                                }}>
                                  Allocate <i className="fa fa-arrow-right ms-1" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Put-Away Allocation Form Panel */}
            <div className="col-lg-5">
              <div className="card border-0 shadow-sm rounded-4 position-sticky" style={{ top: "80px" }}>
                <div className="card-header bg-white border-0 pt-4 px-4">
                  <h5 className="fw-bold text-dark mb-0">Allocation Panel</h5>
                </div>
                <div className="card-body px-4 pb-4">
                  {selectedStock ? (
                    <form onSubmit={handlePerformPutAway}>
                      {/* Product Header */}
                      <div className="p-3 rounded-4 mb-4 text-white d-flex flex-column" style={{ background: "linear-gradient(135deg, #0C4461 0%, #15628A 100%)" }}>
                        <span className="small opacity-75">SELECTED PRODUCT</span>
                        <span className="fw-bold fs-5 mt-1">{selectedStock.productName}</span>
                        {selectedStock.productVariationName && <span className="small badge bg-white text-dark align-self-start mt-2">{selectedStock.productVariationName}</span>}
                        <div className="d-flex justify-content-between mt-3 pt-3 border-top border-light">
                          <div>
                            <small className="d-block opacity-75">Sku</small>
                            <span className="fw-bold small">{selectedStock.productSku}</span>
                          </div>
                          <div className="text-end">
                            <small className="d-block opacity-75">Unallocated Stock</small>
                            <span className="fw-bold fs-5">{selectedStock.unallocatedQuantity}</span>
                          </div>
                        </div>
                      </div>

                      {/* Rack Choice */}
                      <div className="mb-3">
                        <label className="form-label text-muted small fw-bold">SELECT TARGET RACK</label>
                        <select
                          className="form-select rounded-3"
                          value={targetRackId}
                          onChange={(e) => {
                            setTargetRackId(e.target.value);
                            setTargetBinId("");
                          }}
                          required
                        >
                          <option value="">-- Choose Rack --</option>
                          {racks.map(r => (
                            <option key={r.id} value={r.id}>{r.rackCode}</option>
                          ))}
                        </select>
                      </div>

                      {/* Bin Choice */}
                      <div className="mb-3">
                        <label className="form-label text-muted small fw-bold">SELECT TARGET BIN</label>
                        <select
                          className="form-select rounded-3"
                          value={targetBinId}
                          onChange={(e) => setTargetBinId(e.target.value)}
                          required
                          disabled={!targetRackId}
                        >
                          <option value="">-- Choose Bin --</option>
                          {targetBins.map(b => (
                            <option key={b.id} value={b.id}>{b.binCode} (Cap: {b.capacity})</option>
                          ))}
                        </select>
                      </div>

                      {/* Qty */}
                      <div className="mb-4">
                        <label className="form-label text-muted small fw-bold">PUT-AWAY QUANTITY</label>
                        <input
                          type="number"
                          className="form-control rounded-3"
                          max={selectedStock.unallocatedQuantity}
                          min="1"
                          value={putAwayQty}
                          onChange={(e) => setPutAwayQty(e.target.value)}
                          required
                        />
                      </div>

                      <div className="d-flex gap-2">
                        <button type="button" className="btn btn-outline-secondary w-50 rounded-3 py-2 fw-semibold" onClick={() => setSelectedStock(null)}>
                          Cancel
                        </button>
                        <button type="submit" className="btn text-white w-50 rounded-3 py-2 fw-bold" style={{ background: "#0C4461" }} disabled={executingPutAway}>
                          {executingPutAway ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="fa fa-check me-2" />} Complete Put-Away
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="text-center py-5 text-muted">
                      <i className="fa fa-hand-pointer fs-1 text-secondary mb-3 d-block" />
                      Select a product variation from the Receiving Bay to configure its physical rack & bin allocation.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Inventory Map */}
        {activeTab === "map" && (
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-header bg-white border-0 pt-4 px-4">
              <h5 className="fw-bold text-dark mb-0">Active Stock Floor Placements</h5>
            </div>
            <div className="card-body px-4 pb-4">
              {/* Search & Filter Bar */}
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 rounded-start-3"><i className="fa fa-search text-muted" /></span>
                    <input
                      type="text"
                      className="form-control border-start-0 rounded-end-3"
                      placeholder="Search product name or SKU..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <select
                    className="form-select rounded-3"
                    value={filterRack}
                    onChange={(e) => setFilterRack(e.target.value)}
                  >
                    <option value="">All Racks</option>
                    {racks.map(r => (
                      <option key={r.id} value={r.rackCode}>{r.rackCode}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <button className="btn btn-outline-secondary w-100 rounded-3" onClick={() => fetchInventoryMap(warehouseAuth.id)}>
                    <i className="fa fa-sync" /> Refresh
                  </button>
                </div>
              </div>

              {/* Table */}
              {loadingMap ? (
                <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
              ) : inventoryMap.length === 0 ? (
                <div className="text-center py-5 text-muted">No floor stock mapping registered in this warehouse yet.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="ps-4">Product</th>
                        <th>SKU</th>
                        <th>Rack Location</th>
                        <th>Bin Location</th>
                        <th className="text-end pe-4">Stowed Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryMap
                        .filter(item => {
                          const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase()) || item.productSku.toLowerCase().includes(searchTerm.toLowerCase());
                          const matchesRack = !filterRack || item.rackCode === filterRack;
                          return matchesSearch && matchesRack;
                        })
                        .map((item, idx) => (
                          <tr key={idx}>
                            <td className="ps-4 fw-bold">
                              <div className="text-dark">{item.productName}</div>
                              {item.productVariationName && <small className="badge bg-secondary">{item.productVariationName}</small>}
                            </td>
                            <td><span className="text-muted small">{item.productSku}</span></td>
                            <td><span className="badge bg-primary px-3 py-2 rounded-3 fw-bold">{item.rackCode}</span></td>
                            <td><span className="badge bg-info text-dark px-3 py-2 rounded-3 fw-bold">{item.binCode}</span></td>
                            <td className="text-end pe-4 fw-bold text-dark fs-5">{item.quantity} units</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default WarehousePutAway;
