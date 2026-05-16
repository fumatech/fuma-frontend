// API utility for Warehouse Transfer Management
import axios from 'axios';

const BASE_URL = `${process.env.REACT_APP_BASE_URL}/warehouse-transfer`;

const unwrapData = (res) => {
    const data = res?.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (data?.data && typeof data.data === 'object') return data.data;
    return data ?? [];
};

export const createTransferRequest = async (data) => {
    try {
        const response = await axios.post(`${BASE_URL}/request`, data);
        return unwrapData(response);
    } catch (error) {
        const fallbackPayload = {
            sourceWarehouseId: data?.master?.sourceWarehouseId,
            destinationWarehouseId: data?.master?.destinationWarehouseId,
            expectedTransferDate: data?.master?.expectedTransferDate,
            remarks: data?.master?.remarks,
            status: data?.master?.status,
            requestedByUserId: data?.master?.requestedByUserId,
            items: data?.items || [],
        };

        const response = await axios.post(`${BASE_URL}/request`, fallbackPayload);
        return unwrapData(response);
    }
};

export const approveTransfer = ({ transferId, userId, remarks, approved }) =>
    axios.post(`${BASE_URL}/approve`, null, { params: { transferId, userId, remarks, approved } }).then(unwrapData);

export const dispatchTransfer = ({ transferId, vehicleDetails, driverDetails, dispatchQuantity, dispatchNotes }) =>
    axios.post(`${BASE_URL}/dispatch`, null, { params: { transferId, vehicleDetails, driverDetails, dispatchQuantity, dispatchNotes } }).then(unwrapData);

export const receiveTransfer = ({ transferId, receivedQuantity, damagedQuantity, receiverDetails, receiveRemarks }) =>
    axios.post(`${BASE_URL}/receive`, null, { params: { transferId, receivedQuantity, damagedQuantity, receiverDetails, receiveRemarks } }).then(unwrapData);

export const getTransferDetails = (id) =>
    axios.get(`${BASE_URL}/details/${id}`).then(unwrapData);

export const searchTransfers = (filters) =>
    axios.get(`${BASE_URL}/search`, { params: filters }).then(unwrapData);
