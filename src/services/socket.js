// filepath: /path/to/your/project/src/services/socket.js
import io from "socket.io-client";
import { BACKEND_URL } from "../utils/constants";

const socket = io(`${BACKEND_URL}/driver`); // Replace with your backend URL

socket.on("connect", () => {
  console.log("Connected to WebSocket server");
});

socket.on("incomingOrderForDriver", (order) => {
  // console.log("New order received:", order);
  // Handle the incoming order notification
});

export default socket;
