/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PaymentStatus = 'Lunas' | 'DP' | 'Belum Bayar';

export interface RoomFacility {
  name: string;
  icon: string;
}

export interface RoomType {
  id: string;
  name: string;
  ratePerNight: number; // Fallback / historical rate
  rateWeekday?: number; // Price on weekdays (Monday - Friday)
  rateWeekend?: number; // Price on weekends (Saturday - Sunday)
  capacity: number;
  description: string;
  facilities?: RoomFacility[];
}

export interface Booking {
  id: string;
  invoiceNumber: string;
  guestName: string;
  whatsappNumber: string;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  checkInTime?: string; // e.g. "14:00"
  checkOutTime?: string; // e.g. "12:00"
  timeZone?: string; // e.g. "WIB", "WITA", "WIT"
  roomId: string; // References RoomType.id
  paymentStatus: PaymentStatus;
  amountPaid: number;
  totalPrice: number;
  paymentMethod?: string; // e.g. 'Tunai', 'BCA', or other bank names
  notes?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  whatsappNumber: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  bankNoRek: string;
  bankOwner: string;
}

export interface AppSettings {
  logoUrl: string;
  logoInitials: string;
  namaLembaga: string;
  alamat: string;
  baileysStatus: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING';
  baileysPhone: string;
  baileysSessionName: string;
  baileysAutoReply: boolean;
  baileysWebhookUrl: string;
  baileysIsPaired: boolean;
  bankOwner?: string;
  bankNoRek?: string;
  bankName?: string;
  kontakPhone?: string;
  appColor?: string;
  banks?: BankAccount[];
}

