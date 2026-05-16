import React from 'react';

const TransferDetailsPage = ({ transfer }) => {
    if (!transfer) return <div>Select a transfer to view details.</div>;
    return (
        <div className="details-page">
            <h2>Transfer Details</h2>
            <div>Transfer #: {transfer.transferNumber}</div>
            <div>Status: {transfer.status}</div>
            <div>Source: {transfer.sourceWarehouseId}</div>
            <div>Destination: {transfer.destinationWarehouseId}</div>
            <div>Expected Date: {transfer.expectedTransferDate}</div>
            <div>Remarks: {transfer.remarks}</div>
            <div>Products:
                <ul>
                    {transfer.items && transfer.items.map(item => (
                        <li key={item.id}>{item.productId} - Requested: {item.requestedQuantity}, Dispatched: {item.dispatchedQuantity}, Received: {item.receivedQuantity}, Damaged: {item.damagedQuantity}</li>
                    ))}
                </ul>
            </div>
            <div>Status Timeline:
                <ul>
                    {transfer.statusLogs && transfer.statusLogs.map(log => (
                        <li key={log.id}>{log.status} by {log.changedByUserId} at {log.changedAt} {log.remarks && `- ${log.remarks}`}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default TransferDetailsPage;
