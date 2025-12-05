import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://fusionmastertech.com:8443",
  // baseURL: "http://localhost:8443",

  // You can also add headers or timeout here
});

export default axiosInstance;
