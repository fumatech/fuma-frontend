import axios from 'axios';

const BASE_URL = process.env.REACT_APP_BASE_URL;

const interactionService = {
    saveInteraction: async (interaction) => {
        try {
            const response = await axios.post(`${BASE_URL}/interactions`, interaction);
            return response.data;
        } catch (error) {
            console.error("Error saving interaction:", error);
            throw error;
        }
    },

    getInteractionsByLeadId: async (leadId) => {
        try {
            const response = await axios.get(`${BASE_URL}/interactions/lead/${leadId}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching lead interactions:", error);
            return [];
        }
    },

    getInteractionsByCustomerId: async (customerId) => {
        try {
            const response = await axios.get(`${BASE_URL}/interactions/customer/${customerId}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching customer interactions:", error);
            return [];
        }
    },

    getInteractionsBySalespersonId: async (salespersonId) => {
        try {
            const response = await axios.get(`${BASE_URL}/interactions/salesperson/${salespersonId}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching salesperson interactions:", error);
            return [];
        }
    },

    getAllInteractions: async () => {
        try {
            const response = await axios.get(`${BASE_URL}/interactions/all`);
            return response.data;
        } catch (error) {
            console.error("Error fetching all interactions:", error);
            return [];
        }
    }
};

export default interactionService;
