import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'client';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  displayName: string;
  photoURL: string;
  address?: string;
  phone?: string;
  nameHistory?: string[];
}

export interface Review {
  id: string;
  itemId: string;
  userId?: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: any;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  fullDescription?: string;
  price: number;
  imageUrl?: string;
  imageUrls?: string[];
  stock: number;
  category?: string;
  brand?: string;
  reference?: string;
  specifications?: string;
  configurations?: string;
  deliveryPrice?: number;
  warranty?: string;
  allowInstallments?: boolean; // 4 months
  allowTontine?: boolean; // 100 days
}

export interface OrderItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
}

export type PaymentType = 'cash' | 'installment';
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  clientPhone: string;
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
  clientName: string;
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
