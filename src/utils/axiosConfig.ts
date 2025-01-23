// axiosInstance.ts
import axios from 'axios';

// Create an Axios instance
const axiosInstance = axios.create({
  baseURL: 'https://05dd-2001-ee0-50c6-6480-5c92-6ea7-92bc-a4d.ngrok-free.app',  // Replace with your base API URL
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000,  // Set a timeout (optional)
});

export default axiosInstance;
