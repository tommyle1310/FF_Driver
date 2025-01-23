// axiosInstance.ts
import axios from 'axios';

// Create an Axios instance
const axiosInstance = axios.create({
  baseURL: 'https://8c5f-2001-ee0-50c6-6480-5137-b9b6-dfb6-cc9a.ngrok-free.app',  // Replace with your base API URL
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000,  // Set a timeout (optional)
});

export default axiosInstance;
