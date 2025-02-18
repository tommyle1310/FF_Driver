// filepath: /path/to/your/project/src/services/socket.js
import io from "socket.io-client";

const socket = io(
  "https://d03c-2001-ee0-50c6-6480-846-3ef6-1c6d-cf7c.ngrok-free.app/driver"
); // Replace with your backend URL

socket.on("connect", () => {
  console.log("Connected to WebSocket server");
});

socket.on("incomingOrderForDriver", (order) => {
  // console.log("New order received:", order);
  // Handle the incoming order notification
});

export default socket;
