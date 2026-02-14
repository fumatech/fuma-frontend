import axios from 'axios';

const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:5000/api/v1';

const apiService = {
    getSales: async () => {
        try {
            const response = await axios.get(`${BASE_URL}/sale-so-order/getall`);
            return response.data;
        } catch (error) {
            console.error("Error fetching sales:", error);
            return [];
        }
    },

    getPurchases: async () => {
        try {
            const response = await axios.get(`${BASE_URL}/purchase/getall`);
            return response.data;
        } catch (error) {
            console.error("Error fetching purchases:", error);
            return [];
        }
    },

    getExpenses: async () => {
        try {
            const response = await axios.get(`${BASE_URL}/add-expenses/getall`);
            return response.data;
        } catch (error) {
            console.error("Error fetching expenses:", error);
            return [];
        }
    },

    getProducts: async () => {
        try {
            const response = await axios.get(`${BASE_URL}/product/getallactive`);
            return response.data;
        } catch (error) {
            console.error("Error fetching products:", error);
            return [];
        }
    },

    getUsers: async () => {
        try {
            const response = await axios.get(`${BASE_URL}/user/getall`);
            return response.data;
        } catch (error) {
            console.error("Error fetching users:", error);
            return [];
        }
    }
};

export default apiService;
