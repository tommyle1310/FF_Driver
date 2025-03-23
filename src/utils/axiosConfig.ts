// axiosInstance.ts
import axios from "axios";
import { BACKEND_URL } from "./constants";

// Create an Axios instance
const axiosInstance = axios.create({
  baseURL: BACKEND_URL, // Replace with your base API URL
  headers: {
    "Content-Type": "application/json",
  },
  // timeout: 20000, // Set a timeout (optional)
});

export default axiosInstance;
