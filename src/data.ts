/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoomType, Booking } from './types';

export const ROOM_TYPES: RoomType[] = [
  {
    id: 'dahlia',
    name: 'Dahlia Suite',
    ratePerNight: 750000,
    capacity: 2,
    description: 'Suite mewah dengan pemandangan taman, kasur king-size, dan bathtub.',
  },
  {
    id: 'melati',
    name: 'Melati Deluxe',
    ratePerNight: 1200000,
    capacity: 4,
    description: 'Kamar deluxe luas untuk keluarga kecil, dilengkapi balkon privat.',
  },
  {
    id: 'cempaka',
    name: 'Cempaka Family Villa',
    ratePerNight: 1850000,
    capacity: 6,
    description: 'Villa keluarga 2 lantai dengan dapur lengkap dan ruang makan semi-outdoor.',
  },
  {
    id: 'kenanga',
    name: 'Kenanga Executive Pool',
    ratePerNight: 2900000,
    capacity: 8,
    description: 'Villa premium dengan kolam renang pribadi, gazebo, dan layanan butler.',
  }
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'b-1',
    invoiceNumber: 'INV-202606-001',
    guestName: 'Aris Setiawan',
    whatsappNumber: '081234567890',
    checkInDate: '2026-06-01',
    checkOutDate: '2026-06-04',
    roomId: 'melati',
    paymentStatus: 'Lunas',
    amountPaid: 3600000,
    totalPrice: 3600000,
    notes: 'Minta dipersiapkan extra towel.',
    createdAt: '2026-05-20T10:30:00.000Z',
  },
  {
    id: 'b-2',
    invoiceNumber: 'INV-202606-002',
    guestName: 'Budi Cahyono',
    whatsappNumber: '082198765432',
    checkInDate: '2026-06-06',
    checkOutDate: '2026-06-08',
    roomId: 'cempaka',
    paymentStatus: 'DP',
    amountPaid: 1500000,
    totalPrice: 3700000,
    notes: 'DP 1.5 Juta via BCA.',
    createdAt: '2026-05-22T14:15:00.000Z',
  },
  {
    id: 'b-3',
    invoiceNumber: 'INV-202606-003',
    guestName: 'Citra Wardani',
    whatsappNumber: '085744332211',
    checkInDate: '2026-06-11',
    checkOutDate: '2026-06-13',
    roomId: 'kenanga',
    paymentStatus: 'Belum Bayar',
    amountPaid: 0,
    totalPrice: 5800000,
    notes: 'Menginap 2 malam, pembayaran saat check-in.',
    createdAt: '2026-05-25T08:00:00.000Z',
  },
  {
    id: 'b-4',
    invoiceNumber: 'INV-202606-004',
    guestName: 'Dimas Pratama',
    whatsappNumber: '089977665544',
    checkInDate: '2026-06-15',
    checkOutDate: '2026-06-17',
    roomId: 'dahlia',
    paymentStatus: 'Lunas',
    amountPaid: 1500000,
    totalPrice: 1500000,
    notes: 'Ulang tahun pernikahan.',
    createdAt: '2026-05-28T11:45:00.000Z',
  }
];
