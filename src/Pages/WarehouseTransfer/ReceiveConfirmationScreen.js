import React, { useState } from 'react';

const ReceiveConfirmationScreen = ({ transfer, onReceive, getWarehouseName }) => {
    const [receivedQuantity, setReceivedQuantity] = useState('');
    const [damagedQuantity, setDamagedQuantity] = useState('0');
    const [receiverDetails, setReceiverDetails] = useState('');
    const [receiveRemarks, setReceiveRemarks] = useState('');

    if (!transfer) return (
        <div className="text-center py-5">
            <i className="fa fa-info-circle fa-3x text-muted mb-3"></i>
            <p className="text-muted">Select a transfer to receive.</p>
        </div>
    );

    const handleSubmit = (e) => {
        e.preventDefault();
        onReceive({
            transferId: transfer.id,
            receivedQuantity: Number(receivedQuantity),
            damagedQuantity: Number(damagedQuantity),
            receiverDetails,
            receiveRemarks,
        });
    };

    return (
        <div className="p-2">
            <div className="d-flex justify-content-between align-items-start mb-4 border-bottom pb-3">
                <div>
                    <h4 className="fw-bold text-success mb-1">Inward Confirmation</h4>
                    <p className="text-muted small mb-0">Verify and record the physical receipt of goods at the destination.</p>
                </div>
                <div className="text-right">
                    <span className="badge bg-soft-success text-success px-3 py-2 rounded-pill mb-1">
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
                    <div className="p-3 border rounded-4 bg-light shadow-sm border-success" style={{ borderWidth: '2px !important' }}>
                        <label className="small text-uppercase fw-bold text-success mb-1 d-block">Receiving At</label>
                        <h6 className="mb-0 fw-bold">{getWarehouseName(transfer.destinationWarehouseId)}</h6>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="receive-form">
                <div className="row g-3">
                    <div className="col-md-6">
                        <label className="form-label fw-bold">Good Received Quantity</label>
                        <div className="input-group">
                            <span className="input-group-text bg-white border-right-0" style={{ borderRadius: '10px 0 0 10px' }}>
                                <i className="fa fa-check-double text-success"></i>
                            </span>
                            <input 
                                className="form-control border-left-0" 
                                style={{ borderRadius: '0 10px 10px 0' }}
                                type="number" 
                                placeholder="Actual units received"
                                value={receivedQuantity} 
                                onChange={e => setReceivedQuantity(e.target.value)} 
                                required 
                            />
                        </div>
                    </div>
                    <div className="col-md-6">
                        <label className="form-label fw-bold">Damaged/Shortage Quantity</label>
                        <div className="input-group">
                            <span className="input-group-text bg-white border-right-0" style={{ borderRadius: '10px 0 0 10px' }}>
                                <i className="fa fa-exclamation-triangle text-danger"></i>
                            </span>
                            <input 
                                className="form-control border-left-0" 
                                style={{ borderRadius: '0 10px 10px 0' }}
                                type="number" 
                                placeholder="Units damaged/missing"
                                value={damagedQuantity} 
                                onChange={e => setDamagedQuantity(e.target.value)} 
                                required 
                            />
                        </div>
                    </div>
                    <div className="col-md-6">
                        <label className="form-label fw-bold">Receiver Name/ID</label>
                        <div className="input-group">
                            <span className="input-group-text bg-white border-right-0" style={{ borderRadius: '10px 0 0 10px' }}>
                                <i className="fa fa-user-check text-muted"></i>
                            </span>
                            <input 
                                className="form-control border-left-0" 
                                style={{ borderRadius: '0 10px 10px 0' }}
                                placeholder="Who is receiving the stock?"
                                value={receiverDetails} 
                                onChange={e => setReceiverDetails(e.target.value)} 
                                required 
                            />
                        </div>
                    </div>
                    <div className="col-md-6">
                        <label className="form-label fw-bold">Receiving Remarks</label>
                        <div className="input-group">
                            <span className="input-group-text bg-white border-right-0" style={{ borderRadius: '10px 0 0 10px' }}>
                                <i className="fa fa-comment-dots text-muted"></i>
                            </span>
                            <input 
                                className="form-control border-left-0" 
                                style={{ borderRadius: '0 10px 10px 0' }}
                                placeholder="Any discrepancies or notes"
                                value={receiveRemarks} 
                                onChange={e => setReceiveRemarks(e.target.value)} 
                            />
                        </div>
                    </div>
                    <div className="col-12 text-end mt-4">
                        <button type="submit" className="btn btn-success rounded-pill px-5 shadow-sm">
                            <i className="fa fa-arrow-down mr-2"></i> Confirm Stock Inward
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default ReceiveConfirmationScreen;
