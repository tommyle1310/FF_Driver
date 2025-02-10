// axiosInstance.ts
import axios from "axios";

// Create an Axios instance
const axiosInstance = axios.create({
  baseURL: "https://94c1-2001-ee0-50c6-6480-354d-173f-1196-5197.ngrok-free.app", // Replace with your base API URL
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 20000, // Set a timeout (optional)
});

export default axiosInstance;
