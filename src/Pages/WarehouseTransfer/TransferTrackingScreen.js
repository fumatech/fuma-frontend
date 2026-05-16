import React from 'react';

const TransferTrackingScreen = ({ transfers, onSelect, getWarehouseName }) => {
    return (
        <div className="tracking-screen p-2">
            <div className="mb-4" style={{ maxWidth: 400 }}>
                <div className="input-group shadow-sm" style={{ borderRadius: '10px', overflow: 'hidden' }}>
                    <span className="input-group-text bg-white border-right-0">
                        <i className="fa fa-search text-muted" />
                    </span>
                    <input className="form-control border-left-0" placeholder="Search by transfer # or warehouse..." disabled />
                </div>
            </div>
            <div className="table-responsive border rounded-4 shadow-sm">
                <table className="table table-hover align-middle mb-0">
                    <thead style={{ backgroundColor: '#0d4f73' }}>
                        <tr>
                            <th className="ps-4 text-white py-3 border-0">Transfer #</th>
                            <th className="text-white py-3 border-0">Status</th>
                            <th className="text-white py-3 border-0">Source Warehouse</th>
                            <th className="text-white py-3 border-0">Destination Warehouse</th>
                            <th className="text-white py-3 border-0 text-center">Expected Date</th>
                            <th className="text-end pe-4 text-white py-3 border-0">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!transfers || transfers.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="text-center py-5 text-muted">
                                    <i className="fa fa-folder-open fa-3x mb-3 d-block opacity-25"></i>
                                    No transfers found.
                                </td>
                            </tr>
                        ) : transfers.map((tr) => (
                            <tr key={tr.id}>
                                <td className="ps-4 fw-bold text-dark">{tr.transferNumber || `#TRF-${tr.id}`}</td>
                                <td>
                                    <span className={`badge rounded-pill px-3 py-2 ${
                                        tr.status === 'Draft' ? 'bg-warning text-dark' : 
                                        tr.status === 'Approved' ? 'bg-success' : 
                                        tr.status === 'Dispatched' ? 'bg-info text-white' :
                                        tr.status === 'Received' ? 'bg-primary' : 'bg-secondary'
                                    }`}>
                                        {tr.status || 'N/A'}
                                    </span>
                                </td>
                                <td className="fw-medium text-muted">{getWarehouseName(tr.sourceWarehouseId)}</td>
                                <td className="fw-medium text-muted">{getWarehouseName(tr.destinationWarehouseId)}</td>
                                <td className="text-center text-dark">{tr.expectedTransferDate || '-'}</td>
                                <td className="text-end pe-4">
                                    <button 
                                        className="btn btn-outline-primary btn-sm rounded-pill px-3 shadow-sm" 
                                        onClick={() => onSelect(tr)}
                                    >
                                        <i className="fa fa-eye mr-1"></i> View Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TransferTrackingScreen;
