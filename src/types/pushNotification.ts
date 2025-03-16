export interface Type_PushNotification_Order {
  _id: string;
  customer_id: string;
  total_amount: number;
  status: string;
  order_items?: any[]; // Thêm để khớp với dữ liệu server
}
