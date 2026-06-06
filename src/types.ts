/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PaymentStatus = 'Lunas' | 'DP' | 'Belum Bayar';

export interface RoomType {
  id: string;
  name: string;
  ratePerNight: number;
  capacity: number;
  description: string;
}

export interface Booking {
  id: string;
  invoiceNumber: string;
  guestName: string;
  whatsappNumber: string;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  roomId: string; // References RoomType.id
  paymentStatus: PaymentStatus;
  amountPaid: number;
  totalPrice: number;
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
}

