export interface Type_PushNotification_Order {
  id: string;
  customer_id: string;
  total_amount: number;
  driver_earn?: number;
  status: string;
  order_items?: any[]; // Thêm để khớp với dữ liệu server
}
