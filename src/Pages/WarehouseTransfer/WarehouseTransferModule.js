import React, { useState, useEffect } from 'react';
import TransferRequestForm from './TransferRequestForm';
import TransferApprovalScreen from './TransferApprovalScreen';
import DispatchManagementScreen from './DispatchManagementScreen';
import ReceiveConfirmationScreen from './ReceiveConfirmationScreen';
import TransferTrackingScreen from './TransferTrackingScreen';
import TransferDetailsPage from './TransferDetailsPage';
import * as api from './warehouseTransferApi';
import { toast } from "react-toastify";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../assets/dist/css/adminlte.min.css";
import "../../assets/plugins/fontawesome-free/css/all.min.css";

const WarehouseTransferModule = () => {
    const [transfers, setTransfers] = useState([]);
    const [selectedTransfer, setSelectedTransfer] = useState(null);
    const [view, setView] = useState('tracking'); // tracking, request, approval, dispatch, receive, details
    const [loading, setLoading] = useState(false);
    
    // Shared data for all screens
    const [warehouses, setWarehouses] = useState([]);
    const [allProducts, setAllProducts] = useState([]);

    // Load initial data
    useEffect(() => {
        fetchTransfers();
        fetchSharedData();
    }, []);

    const fetchSharedData = async () => {
        // Fetch Warehouses
        fetch(`${process.env.REACT_APP_BASE_URL}/warehouse/getall`)
            .then((res) => res.json())
            .then((data) => setWarehouses(Array.isArray(data) ? data : []))
            .catch(() => setWarehouses([]));

        // Fetch All Products
        fetch(`${process.env.REACT_APP_BASE_URL}/product/getall`)
            .then((res) => res.json())
            .then((data) => setAllProducts(Array.isArray(data) ? data : []))
            .catch(() => setAllProducts([]));
    };

    const fetchTransfers = async () => {
        setLoading(true);
        try {
            const data = await api.searchTransfers({});
            setTransfers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching transfers:', error);
            toast.error('Unable to load warehouse transfers');
            setTransfers([]);
        } finally {
            setLoading(false);
        }
    };

    // Handlers for each screen
    const handleCreateRequest = async (formData) => {
        setLoading(true);
        try {
            const profile = JSON.parse(sessionStorage.getItem('userProfileData') || '{}');
            const requestedByUserId = Number(profile?.id) || 1;
            const sourceWarehouseId = Number(formData.sourceWarehouse);
            const destinationWarehouseId = Number(formData.destinationWarehouse);
            const items = (formData.products || [])
                .filter((p) => p.productId && String(p.productId).trim() !== '' && Number(p.quantity) > 0)
                .map((p) => ({
                    productId: Number(p.productId),
                    requestedQuantity: Number(p.quantity),
                }));

            if (!Number.isFinite(sourceWarehouseId) || !Number.isFinite(destinationWarehouseId)) {
                toast.error('Please select valid source and destination warehouses.');
                return;
            }

            if (sourceWarehouseId === destinationWarehouseId) {
                toast.error('Source and destination warehouse cannot be the same.');
                return;
            }

            if (items.some((i) => !Number.isFinite(i.productId) || i.productId <= 0)) {
                toast.error('Product ID must be a valid numeric ID.');
                return;
            }

            if (items.length === 0) {
                toast.error('Please add at least one valid product.');
                return;
            }

            await api.createTransferRequest({
                master: {
                    sourceWarehouseId,
                    destinationWarehouseId,
                    expectedTransferDate: formData.expectedDate,
                    remarks: formData.remarks,
                    status: 'Draft',
                    requestedByUserId
                },
                items
            });
            await fetchTransfers();
            setView('tracking');
            toast.success('Transfer request created');
        } catch (error) {
            console.error('Create transfer request failed:', error);
            const backendMessage =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                (typeof error?.response?.data === 'string' ? error.response.data : '') ||
                error?.message;
            toast.error(backendMessage ? `Failed: ${backendMessage}` : 'Failed to create transfer request');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (transferId) => {
        setLoading(true);
        try {
            await api.approveTransfer({ transferId, userId: 1, remarks: 'Approved', approved: true });
            await fetchTransfers();
            setView('tracking');
            toast.success('Transfer approved');
        } catch (error) {
            console.error('Approve transfer failed:', error);
            toast.error('Failed to approve transfer');
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async (transferId) => {
        setLoading(true);
        try {
            await api.approveTransfer({ transferId, userId: 1, remarks: 'Rejected', approved: false });
            await fetchTransfers();
            setView('tracking');
            toast.success('Transfer rejected');
        } catch (error) {
            console.error('Reject transfer failed:', error);
            toast.error('Failed to reject transfer');
        } finally {
            setLoading(false);
        }
    };

    const handleDispatch = async (dispatchData) => {
        setLoading(true);
        try {
            await api.dispatchTransfer(dispatchData);
            await fetchTransfers();
            setView('tracking');
            toast.success('Transfer dispatched');
        } catch (error) {
            console.error('Dispatch transfer failed:', error);
            toast.error('Failed to dispatch transfer');
        } finally {
            setLoading(false);
        }
    };

    const handleReceive = async (receiveData) => {
        setLoading(true);
        try {
            await api.receiveTransfer(receiveData);
            await fetchTransfers();
            setView('tracking');
            toast.success('Transfer received');
        } catch (error) {
            console.error('Receive transfer failed:', error);
            toast.error('Failed to receive transfer');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectTransfer = async (transfer) => {
        setLoading(true);
        try {
            const details = await api.getTransferDetails(transfer.id);
            setSelectedTransfer(details);
            setView('details');
        } catch (error) {
            console.error('Transfer details load failed:', error);
            toast.error('Failed to load transfer details');
        } finally {
            setLoading(false);
        }
    };

    // Helper to get names
    const getWarehouseName = (id) => {
        const wh = warehouses.find(w => String(w.id) === String(id));
        return wh ? (wh.warehouseName || wh.name) : `ID: ${id}`;
    };

    const getProductName = (id) => {
        const prod = allProducts.find(p => String(p.id) === String(id));
        return prod ? prod.productName : `ID: ${id}`;
    };

    // Main render logic
    return (
        <div className="content-wrapper">
            <div className="container-fluid py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="fw-bold text-dark mb-0">Warehouse Transfer Management</h2>
                </div>

            <div className="card border-0 shadow-sm rounded-4">
                <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 fw-bold">
                        {view === 'tracking' ? 'Warehouse Transfer Tracking' : 'Transfer Workflow'}
                    </h5>
                    <div className="d-flex gap-2">
                        {view !== 'tracking' && (
                            <button className="btn btn-outline-secondary btn-sm rounded-pill px-3" onClick={() => setView('tracking')}>
                                <i className="fa fa-arrow-left mr-1" /> Back
                            </button>
                        )}
                        {view === 'tracking' && (
                            <button className="btn btn-primary btn-sm rounded-pill px-3" onClick={() => setView('request')}>
                                <i className="fa fa-plus mr-1" /> New Transfer Request
                            </button>
                        )}
                    </div>
                </div>
                <div className="card-body">
                    {loading && (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" />
                        </div>
                    )}

                    {!loading && view === 'tracking' && (
                        <TransferTrackingScreen 
                            transfers={transfers} 
                            onSelect={handleSelectTransfer} 
                            getWarehouseName={getWarehouseName}
                        />
                    )}
                    {!loading && view === 'request' && (
                        <TransferRequestForm 
                            onSubmit={handleCreateRequest} 
                            warehouses={warehouses}
                            allProducts={allProducts}
                        />
                    )}
                    {!loading && view === 'approval' && selectedTransfer && (
                        <TransferApprovalScreen
                            transfer={selectedTransfer}
                            onApprove={handleApprove}
                            onReject={handleReject}
                            getWarehouseName={getWarehouseName}
                            getProductName={getProductName}
                        />
                    )}
                    {!loading && view === 'dispatch' && selectedTransfer && (
                        <DispatchManagementScreen 
                            transfer={selectedTransfer} 
                            onDispatch={handleDispatch}
                            getWarehouseName={getWarehouseName}
                            getProductName={getProductName}
                        />
                    )}
                    {!loading && view === 'receive' && selectedTransfer && (
                        <ReceiveConfirmationScreen 
                            transfer={selectedTransfer} 
                            onReceive={handleReceive}
                            getWarehouseName={getWarehouseName}
                            getProductName={getProductName}
                        />
                    )}
                    {!loading && view === 'details' && selectedTransfer && (
                        <>
                            <TransferDetailsPage 
                                transfer={selectedTransfer} 
                                getWarehouseName={getWarehouseName}
                                getProductName={getProductName}
                            />
                            <div className="d-flex flex-wrap gap-2 mt-3">
                                <button className="btn btn-primary btn-sm rounded-pill px-3" onClick={() => setView('approval')}>Approval</button>
                                <button className="btn btn-info btn-sm text-white rounded-pill px-3" onClick={() => setView('dispatch')}>Dispatch</button>
                                <button className="btn btn-success btn-sm rounded-pill px-3" onClick={() => setView('receive')}>Receive</button>
                            </div>
                        </>
                    )}
                </div>
            </div>
            </div>
        </div>
    );
};

export default WarehouseTransferModule;
