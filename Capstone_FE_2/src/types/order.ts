// Types for Order module — matching Capstone_BE_2 DTOs exactly

// Status values matching BE OrderStatusEnum constants
export enum OrderStatus {
  PendingConfirmation = "Pending Confirmation",
  Confirmed = "Confirmed",
  InProgress = "In Progress",
  Completed = "Completed",
  Cancelled = "Cancelled",
  Rejected = "Rejected",
}

// Matches BE: Capstone_2_BE.DTOs.Technician.Orders.ViewOrderDTO
export interface ViewOrderDTO {
  orderId: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  title: string;
  description: string;
  status: string;
  orderDate: string;
  address: string;
  price: number;
}

// Matches BE: Capstone_2_BE.DTOs.Technician.Orders.ViewOrderDetailDTO
export interface ViewOrderDetailDTO {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerAvatar: string;
  serviceName: string;
  title: string;
  description: string;
  address: string;
  cityName: string;
  latitude: string;
  longitude: string;
  status: string;
  orderDate: string;
  completeAt: string;
  attachments?: OrderAttachment[]; // Vẫn giữ để tương thích nếu cần
  videoUrl?: string;               // Thêm để khớp Backend thực tế
  ImageUrls?: string[];            // Thêm để khớp Backend thực tế
}

export interface OrderAttachment {
  id: string;
  fileType: string;
  fileName: string;
}

// Matches BE: Capstone_2_BE.DTOs.Technician.Orders.OrderActionDTO
export interface OrderActionDTO {
  orderId: string;
  technicianId: string;
}

// Matches BE: Capstone_2_BE.DTOs.Customer.Order.CreateOrderDTO
export interface CreateOrderDTO {
  customerId: string;
  technicianId: string;
  serviceId: string;
  title: string;
  description: string;
  address: string;
  city: string;
  latitude: string;
  longitude: string;
  videoFileName?: string;
  imageFileNames?: string[];
}

// Matches BE: Capstone_2_BE.DTOs.Customer.Order.OrderOverviewDTO
export interface OrderOverviewDTO {
  orderId: string;
  technicianName: string;
  serviceName: string;
  title: string;
  status: string;
  orderDate: string;
}

// Matches BE: Capstone_2_BE.DTOs.Customer.Order.OrderDetailDTO
export interface OrderDetailDTO {
  orderId: string;
  technicianName: string;
  technicianPhone: string;
  technicianAvatar: string;
  serviceName: string;
  title: string;
  description: string;
  address: string;
  status: string;
  orderDate: string;
  completeAt: string;
  attachments: OrderAttachment[];
}
