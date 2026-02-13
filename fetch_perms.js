const axios = require('axios');

async function getPermissions() {
    try {
        const response = await axios.get('http://localhost:8443/permissions/getall');
        console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

getPermissions();

