import axios from 'axios';

const BASE_URL = process.env.REACT_APP_BASE_URL;

const serviceTicketService = {
    createTicket: async (ticket) => {
        const response = await axios.post(`${BASE_URL}/service-tickets/save`, ticket);
        return response.data;
    },
    getAllTickets: async () => {
        const response = await axios.get(`${BASE_URL}/service-tickets/getall`);
        return response.data;
    },
    getTicketById: async (id) => {
        const response = await axios.get(`${BASE_URL}/service-tickets/${id}`);
        return response.data;
    },
    updateTicket: async (id, ticket) => {
        const response = await axios.put(`${BASE_URL}/service-tickets/update/${id}`, ticket);
        return response.data;
    },
    deleteTicket: async (id) => {
        await axios.delete(`${BASE_URL}/service-tickets/delete/${id}`);
    },
    assignTicket: async (id, employeeId) => {
        const response = await axios.put(`${BASE_URL}/service-tickets/${id}/assign`, { employeeId });
        return response.data;
    },
    updateStatus: async (id, status, comment, changedBy) => {
        const response = await axios.put(`${BASE_URL}/service-tickets/${id}/status`, { status, comment, changedBy });
        return response.data;
    },
    addComment: async (id, comment) => {
        const response = await axios.post(`${BASE_URL}/service-tickets/${id}/comments`, comment);
        return response.data;
    },
    getTicketsByCustomer: async (customerId) => {
        const response = await axios.get(`${BASE_URL}/service-tickets/customer/${customerId}`);
        return response.data;
    },
    getTicketsByEmployee: async (employeeId) => {
        const response = await axios.get(`${BASE_URL}/service-tickets/employee/${employeeId}`);
        return response.data;
    }
};

export default serviceTicketService;
