// filepath: /path/to/your/project/src/services/socket.js
import io from "socket.io-client";

const socket = io(
  "https://4272-2001-ee0-50c6-6480-94a0-432c-b9b3-205e.ngrok-free.app/driver"
); // Replace with your backend URL

socket.on("connect", () => {
  console.log("Connected to WebSocket server");
});

socket.on("incomingOrder", (order) => {
  console.log("New order received:", order);
  // Handle the incoming order notification
});

export default socket;
