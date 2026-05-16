import React from 'react';

const TransferApprovalScreen = ({ transfer, onApprove, onReject, getWarehouseName, getProductName }) => {
    if (!transfer) return (
        <div className="text-center py-5">
            <i className="fa fa-info-circle fa-3x text-muted mb-3"></i>
            <p className="text-muted">Select a transfer to approve/reject.</p>
        </div>
    );

    return (
        <div className="p-2">
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h4 className="fw-bold text-primary mb-1">Transfer Approval</h4>
                    <p className="text-muted small mb-0">Review and verify the transfer request details below.</p>
                </div>
                <span className={`badge rounded-pill px-3 py-2 ${
                    transfer.status === 'Draft' ? 'bg-warning text-dark' : 
                    transfer.status === 'Approved' ? 'bg-success' : 'bg-danger'
                }`}>
                    {transfer.status}
                </span>
            </div>

            <div className="row g-4 mb-4">
                <div className="col-md-6">
                    <div className="p-3 border rounded-4 bg-light shadow-sm h-100">
                        <label className="small text-uppercase fw-bold text-muted mb-2 d-block">Source Details</label>
                        <div className="d-flex align-items-center">
                            <div className="bg-white p-2 rounded-3 shadow-sm mr-3">
                                <i className="fa fa-warehouse text-primary"></i>
                            </div>
                            <div>
                                <h6 className="mb-0 fw-bold">{getWarehouseName(transfer.sourceWarehouseId)}</h6>
                                <span className="small text-muted">Sending Warehouse</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="p-3 border rounded-4 bg-light shadow-sm h-100">
                        <label className="small text-uppercase fw-bold text-muted mb-2 d-block">Destination Details</label>
                        <div className="d-flex align-items-center">
                            <div className="bg-white p-2 rounded-3 shadow-sm mr-3">
                                <i className="fa fa-truck-loading text-success"></i>
                            </div>
                            <div>
                                <h6 className="mb-0 fw-bold">{getWarehouseName(transfer.destinationWarehouseId)}</h6>
                                <span className="small text-muted">Receiving Warehouse</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
                <div className="card-header bg-white py-3">
                    <h6 className="mb-0 fw-bold"><i className="fa fa-list mr-2 text-primary"></i>Product List</h6>
                </div>
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th className="border-0 px-4">Product Name</th>
                                <th className="border-0">Requested Qty</th>
                                <th className="border-0 text-center px-4">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transfer.items && transfer.items.length > 0 ? (
                                transfer.items.map(item => (
                                    <tr key={item.id}>
                                        <td className="px-4 fw-medium text-dark">{getProductName(item.productId)}</td>
                                        <td>
                                            <span className="badge bg-soft-primary text-primary px-3 rounded-pill">
                                                {item.requestedQuantity} Units
                                            </span>
                                        </td>
                                        <td className="text-center px-4">
                                            <i className="fa fa-check-circle text-success"></i>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" className="text-center py-4 text-muted">No products listed.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {transfer.remarks && (
                <div className="mb-4">
                    <label className="small fw-bold text-muted mb-1 ml-2">Remarks / Notes</label>
                    <div className="p-3 bg-light border rounded-4 italic text-muted">
                        "{transfer.remarks}"
                    </div>
                </div>
            )}

            <div className="d-flex gap-3 justify-content-end pt-3 border-top">
                <button 
                    className="btn btn-outline-danger rounded-pill px-5 shadow-sm" 
                    onClick={() => onReject(transfer.id)}
                >
                    <i className="fa fa-times-circle mr-2"></i> Reject
                </button>
                <button 
                    className="btn btn-success rounded-pill px-5 shadow-sm" 
                    onClick={() => onApprove(transfer.id)}
                >
                    <i className="fa fa-check-circle mr-2"></i> Approve Transfer
                </button>
            </div>
        </div>
    );
};

export default TransferApprovalScreen;
