import React, { useState } from 'react';

const DispatchManagementScreen = ({ transfer, onDispatch, getWarehouseName }) => {
    const [vehicleDetails, setVehicleDetails] = useState('');
    const [driverDetails, setDriverDetails] = useState('');
    const [dispatchQuantity, setDispatchQuantity] = useState('');
    const [dispatchNotes, setDispatchNotes] = useState('');

    if (!transfer) return (
        <div className="text-center py-5">
            <i className="fa fa-info-circle fa-3x text-muted mb-3"></i>
            <p className="text-muted">Select a transfer to dispatch.</p>
        </div>
    );

    const handleSubmit = (e) => {
        e.preventDefault();
        onDispatch({
            transferId: transfer.id,
            vehicleDetails,
            driverDetails,
            dispatchQuantity: Number(dispatchQuantity),
            dispatchNotes,
        });
    };

    return (
        <div className="p-2">
            <div className="d-flex justify-content-between align-items-start mb-4 border-bottom pb-3">
                <div>
                    <h4 className="fw-bold text-info mb-1">Dispatch Management</h4>
                    <p className="text-muted small mb-0">Record vehicle and driver details for the transfer shipment.</p>
                </div>
                <div className="text-right">
                    <span className="badge bg-soft-info text-info px-3 py-2 rounded-pill mb-1">
                        #{transfer.transferNumber}
                    </span>
                </div>
            </div>

            <div className="row g-3 mb-4">
                <div className="col-md-6">
                    <div className="p-3 border rounded-4 bg-light shadow-sm">
                        <label className="small text-uppercase fw-bold text-muted mb-1 d-block">Origin</label>
                        <h6 className="mb-0 fw-bold">{getWarehouseName(transfer.sourceWarehouseId)}</h6>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="p-3 border rounded-4 bg-light shadow-sm">
                        <label className="small text-uppercase fw-bold text-muted mb-1 d-block">Destination</label>
                        <h6 className="mb-0 fw-bold">{getWarehouseName(transfer.destinationWarehouseId)}</h6>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="dispatch-form">
                <div className="row g-3">
                    <div className="col-md-6">
                        <label className="form-label fw-bold">Vehicle Details</label>
                        <div className="input-group">
                            <span className="input-group-text bg-white border-right-0" style={{ borderRadius: '10px 0 0 10px' }}>
                                <i className="fa fa-truck text-muted"></i>
                            </span>
                            <input 
                                className="form-control border-left-0" 
                                style={{ borderRadius: '0 10px 10px 0' }}
                                placeholder="Truck number, type, etc."
                                value={vehicleDetails} 
                                onChange={e => setVehicleDetails(e.target.value)} 
                                required 
                            />
                        </div>
                    </div>
                    <div className="col-md-6">
                        <label className="form-label fw-bold">Driver Details</label>
                        <div className="input-group">
                            <span className="input-group-text bg-white border-right-0" style={{ borderRadius: '10px 0 0 10px' }}>
                                <i className="fa fa-id-card text-muted"></i>
                            </span>
                            <input 
                                className="form-control border-left-0" 
                                style={{ borderRadius: '0 10px 10px 0' }}
                                placeholder="Driver name & contact"
                                value={driverDetails} 
                                onChange={e => setDriverDetails(e.target.value)} 
                                required 
                            />
                        </div>
                    </div>
                    <div className="col-md-6">
                        <label className="form-label fw-bold">Total Dispatch Quantity</label>
                        <div className="input-group">
                            <span className="input-group-text bg-white border-right-0" style={{ borderRadius: '10px 0 0 10px' }}>
                                <i className="fa fa-boxes text-muted"></i>
                            </span>
                            <input 
                                className="form-control border-left-0" 
                                style={{ borderRadius: '0 10px 10px 0' }}
                                type="number" 
                                placeholder="Units being shipped"
                                value={dispatchQuantity} 
                                onChange={e => setDispatchQuantity(e.target.value)} 
                                required 
                            />
                        </div>
                    </div>
                    <div className="col-md-6">
                        <label className="form-label fw-bold">Dispatch Notes</label>
                        <div className="input-group">
                            <span className="input-group-text bg-white border-right-0" style={{ borderRadius: '10px 0 0 10px' }}>
                                <i className="fa fa-sticky-note text-muted"></i>
                            </span>
                            <input 
                                className="form-control border-left-0" 
                                style={{ borderRadius: '0 10px 10px 0' }}
                                placeholder="Any transit instructions"
                                value={dispatchNotes} 
                                onChange={e => setDispatchNotes(e.target.value)} 
                            />
                        </div>
                    </div>
                    <div className="col-12 text-end mt-4">
                        <button type="submit" className="btn btn-info text-white rounded-pill px-5 shadow-sm">
                            <i className="fa fa-shipping-fast mr-2"></i> Confirm Dispatch
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default DispatchManagementScreen;
