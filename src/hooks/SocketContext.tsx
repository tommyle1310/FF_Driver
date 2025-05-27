import React, { createContext, useContext } from "react";
import { useSocket } from "./useSocket";
import { Type_PushNotification_Order } from "../types/pushNotification";

interface SocketContextType {
  socket: any;
  emitDriverAcceptOrder: (data: {
    driverId: string;
    orderId: string;
    restaurantLocation?: { lat: number; lng: number };
  }) => Promise<any>;
  emitUpdateDriverProgress: (data: any) => Promise<void>;
  isWaitingForResponse: boolean;
  isSocketConnected: boolean;
  handleCompleteOrder: () => void;
  handleRejectOrder: (orderId: string) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider: React.FC<{
  driverId: string;
  setOrders: React.Dispatch<React.SetStateAction<Type_PushNotification_Order[]>>;
  sendPushNotification: (order: Type_PushNotification_Order) => void;
  setLatestOrder: React.Dispatch<
    React.SetStateAction<Type_PushNotification_Order | null>
  >;
  setIsShowToast?: React.Dispatch<React.SetStateAction<boolean>>;
  children: React.ReactNode;
}> = ({
  driverId,
  setOrders,
  sendPushNotification,
  setLatestOrder,
  setIsShowToast,
  children,
}) => {
  const socketData = useSocket(
    driverId,
    setOrders,
    sendPushNotification,
    setLatestOrder,
    setIsShowToast
  );

  return (
    <SocketContext.Provider value={socketData}>{children}</SocketContext.Provider>
  );
};

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocketContext must be used within a SocketProvider");
  }
  return context;
};