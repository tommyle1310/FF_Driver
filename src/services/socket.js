// filepath: /path/to/your/project/src/services/socket.js
import io from "socket.io-client";

const socket = io(
  "https://749d-2405-4800-5716-1560-9c63-5a12-7754-c175.ngrok-free.app/driver"
); // Replace with your backend URL

socket.on("connect", () => {
  console.log("Connected to WebSocket server");
});

socket.on("incomingOrderForDriver", (order) => {
  // console.log("New order received:", order);
  // Handle the incoming order notification
});

export default socket;
