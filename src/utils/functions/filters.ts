import {
  Customer,
  Restaurant,
} from "@/src/store/currentDriverProgressStageSlice";
import { Address } from "@/src/types/Address";
import { Avatar } from "@/src/types/common";

export interface PickupAndDropoffStage {
  id: string;
  type: "PICKUP" | "DROPOFF";
  address: string;
  avatar?: Avatar;
  name?: string;
  location?: { lat: number; lng: number };
  contactNumber: string;
}

export const filterPickupAndDropoffStages = (
  stages: Array<{
    state: string;
    status: "pending" | "completed" | "in_progress" | "failed";
    timestamp: number;
    duration: number;
    address?: Address;
    details?: {
      location?: { lat: number; lng: number };
      customerDetails?: {
        id: string;
        avatar: { key: string; url: string };
        first_name: string;
        last_name: string;
      };
      restaurantDetails?: {
        id: string;
        avatar: { key: string; url: string };
        restaurant_name: string;
        contact_phone: Array<{
          title: string;
          number: string;
          is_default: boolean;
        }>;
      };
    };
  }>
): PickupAndDropoffStage[] => {
  const result: PickupAndDropoffStage[] = [];
  const processedOrders = new Set<string>(); // Để tránh trùng order

  stages?.forEach((stage) => {
    const { details, state, address } = stage;

    // Lấy số order từ state (ví dụ: "restaurant_pickup_order_1" -> "1")
    const orderMatch = state.match(/_order_(\d+)$/);
    const orderNumber = orderMatch ? orderMatch[1] : "1"; // Mặc định là "1" nếu không match

    // Xử lý PICKUP từ restaurantDetails
    if (
      (state.startsWith("waiting_for_pickup_") ||
        state.startsWith("restaurant_pickup_")) &&
      details?.restaurantDetails &&
      !processedOrders.has(`pickup_${orderNumber}`)
    ) {
      result.push({
        id: `${details.restaurantDetails.id}_pickup_${orderNumber}`,
        type: "PICKUP",
        address: address
          ? `${address?.street} ${address?.city} ${address?.nationality}`
          : "Unknown address", // Placeholder, thay bằng logic từ Order nếu cần
        avatar: details.restaurantDetails.avatar,
        name: details.restaurantDetails.restaurant_name,
        location: details.location,
        contactNumber:
          details.restaurantDetails.contact_phone.find(
            (phone) => phone.is_default
          )?.number ||
          details.restaurantDetails.contact_phone[0]?.number ||
          "Unknown",
      });
      processedOrders.add(`pickup_${orderNumber}`);
    }

    // Xử lý DROPOFF từ customerDetails
    if (
      (state.startsWith("en_route_to_customer_") ||
        state.startsWith("delivery_complete_")) &&
      details?.customerDetails &&
      !processedOrders.has(`dropoff_${orderNumber}`)
    ) {
      result.push({
        id: `${details.customerDetails.id}_dropoff_${orderNumber}`,
        type: "DROPOFF",
        address: address
          ? `${address?.street} ${address?.city} ${address?.nationality}`
          : "Unknown address",
        avatar: details.customerDetails.avatar,
        name: `${details.customerDetails.first_name} ${details.customerDetails.last_name}`,
        location: details.location,
        contactNumber: "Unknown", // Customer không có contact_phone, thay bằng logic nếu cần
      });
      processedOrders.add(`dropoff_${orderNumber}`);
    }
  });

  return result;
};
