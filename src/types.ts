import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'client';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  displayName: string;
  photoURL: string;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
}

export interface OrderItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
}

export type PaymentType = 'cash' | 'installment';
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered';

export interface Order {
  id: string;
  clientId: string;
  items: OrderItem[];
  totalAmount: number;
  paymentType: PaymentType;
  status: OrderStatus;
  createdAt: Timestamp;
}

export type PaymentPlanStatus = 'active' | 'completed';

export interface PaymentPlan {
  id: string;
  orderId: string;
  clientId: string;
  totalAmount: number;
  remainingAmount: number;
  installmentsCount: number;
  status: PaymentPlanStatus;
}

export type PaymentStatus = 'pending' | 'completed';

export interface Payment {
  id: string;
  paymentPlanId: string;
  amount: number;
  date: Timestamp;
  status: PaymentStatus;
}

export interface CartItem extends Item {
  quantity: number;
}

export interface Settings {
  logoUrl?: string;
  faviconUrl?: string;
  siteName?: string;
}
