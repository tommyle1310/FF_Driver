import { io, Socket } from "socket.io-client";
import { CHAT_SOCKET_URL } from "../utils/constants";

class LocationSocketManager {
  private socket: Socket | null = null;
  private driverId: string | null = null;
  private token: string | null = null;
  private userId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 10000;
  private isConnecting = false;

  initialize(driverId: string, token: string, userId: string) {
    if (!driverId || !token || !userId) {
      console.error(
        "Cannot initialize LocationSocketManager: Missing driverId, token, or userId",
        {
          driverId,
          token,
          userId,
        }
      );
      return;
    }

    if (
      this.socket &&
      this.driverId === driverId &&
      this.token === token &&
      this.userId === userId
    ) {
      console.log(
        "LocationSocketManager already initialized with same driverId and token, skipping"
      );
      return;
    }

    // Allow driverId switch for same userId
    if (this.driverId && this.userId === userId && this.driverId !== driverId) {
      console.log(
        `[LocationSocket] Switching driverId for userId ${userId}: ${this.driverId} to ${driverId}`
      );
    }

    this.cleanup(false); // Preserve auth data

    this.driverId = driverId;
    this.token = token;
    this.userId = userId;
    this.reconnectAttempts = 0;

    console.log(`[LocationSocket] Creating new location socket connection for driverId: ${driverId}`);
    
    // Connect to /location namespace
    this.socket = io(`${CHAT_SOCKET_URL}/location`, {
      auth: { token }, // Keep for compatibility
      extraHeaders: {
        auth: `Bearer ${token}`, // Match backend expectation
        Authorization: `Bearer ${token}`, // Fallback
      },
      query: { driverId, userId },
      reconnection: false,
      transports: ["websocket"],
    });

    this.socket.on("connect", () => {
      console.log("[LocationSocket] Connected to location WebSocket server");
      this.reconnectAttempts = 0;
      this.isConnecting = false;
    });

    this.socket.on("connect_error", (error: any) => {
      console.error("[LocationSocket] WebSocket connection error:", {
        message: error.message,
        description: error.description ?? "No description",
        context: error.context ?? "No context",
      });
      this.handleReconnect();
    });

    this.socket.on("disconnect", (reason) => {
      console.log(`[LocationSocket] Disconnected from WebSocket server, reason: ${reason}`);
      if (reason === "io server disconnect") {
        console.log("[LocationSocket] Server-initiated disconnect, attempting reconnect");
        this.handleReconnect();
      }
    });

    this.socket.connect();
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("[LocationSocket] Max reconnect attempts reached, giving up");
      this.cleanup(true);
      return;
    }

    if (this.isConnecting) {
      console.log("[LocationSocket] Reconnect already in progress, skipping");
      return;
    }

    if (!this.driverId || !this.token || !this.userId) {
      console.error("[LocationSocket] Missing driverId, token, or userId, cannot reconnect", {
        driverId: this.driverId,
        token: this.token ? "Token exists" : "No token",
        userId: this.userId,
      });
      return;
    }

    this.reconnectAttempts++;
    this.isConnecting = true;

    console.log(
      `[LocationSocket] Scheduling reconnect (attempt ${this.reconnectAttempts}) in ${this.reconnectInterval}ms`
    );
    setTimeout(() => {
      console.log("[LocationSocket] Cleaning up existing socket");
      this.cleanup(false);

      console.log(
        `[LocationSocket] Creating new socket connection for driverId: ${this.driverId}`
      );
      this.socket = io(`${CHAT_SOCKET_URL}/location`, {
        auth: { token: this.token },
        extraHeaders: {
          auth: `Bearer ${this.token}`,
          Authorization: `Bearer ${this.token}`,
        },
        query: { driverId: this.driverId, userId: this.userId },
        reconnection: false,
        transports: ["websocket"],
      });

      this.socket.on("connect", () => {
        console.log("[LocationSocket] Connected to location WebSocket server");
        this.reconnectAttempts = 0;
        this.isConnecting = false;
      });

      this.socket.on("connect_error", (error: any) => {
        console.error("[LocationSocket] WebSocket connection error:", {
          message: error.message,
          description: error.description ?? "No description",
          context: error.context ?? "No context",
        });
        this.handleReconnect();
      });

      this.socket.on("disconnect", (reason) => {
        console.log(`[LocationSocket] Disconnected from WebSocket server, reason: ${reason}`);
        if (reason === "io server disconnect") {
          console.log("[LocationSocket] Server-initiated disconnect, attempting reconnect");
          this.handleReconnect();
        }
      });

      this.socket.connect();
    }, this.reconnectInterval);
  }

  isConnected() {
    return this.socket?.connected ?? false;
  }

  emit(event: string, data: any, callback?: (response: any) => void) {
    if (!this.socket) {
      console.error(`[LocationSocket] Cannot emit ${event}: Socket not initialized`);
      return;
    }
    if (callback) {
      this.socket.emit(event, data, callback);
    } else {
      this.socket.emit(event, data);
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.socket) {
      console.error(`[LocationSocket] Cannot listen to ${event}: Socket not initialized`);
      return;
    }
    this.socket.on(event, callback);
  }

  off(event: string, callback?: (data: any) => void) {
    if (!this.socket) {
      console.log(
        `[LocationSocket] Cannot remove listener for ${event}: Socket not initialized`
      );
      return;
    }
    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }

  disconnect() {
    if (this.socket) {
      console.log("[LocationSocket] Disconnecting socket");
      this.socket.disconnect();
      this.socket = null;
    }
  }

  cleanup(clearAuth: boolean = true) {
    console.log("[LocationSocket] Cleaning up LocationSocketManager");
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    if (clearAuth) {
      this.driverId = null;
      this.token = null;
      this.userId = null;
    }
    this.isConnecting = false;
  }
}

export default new LocationSocketManager(); 