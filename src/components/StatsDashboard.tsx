/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Booking, RoomType } from '../types';
import { KeyRound, TrendingUp, DollarSign, Bed, CheckCircle, Clock, Percent } from 'lucide-react';

interface StatsDashboardProps {
  bookings: Booking[];
  roomTypes: RoomType[];
}

export default function StatsDashboard({ bookings, roomTypes }: StatsDashboardProps) {
  // 1. Total bookings count
  const totalBookings = bookings.length;

  // 2. Financial breakdowns
  const totalRevenuePotential = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const totalRevenueCollected = bookings.reduce((sum, b) => sum + b.amountPaid, 0);
  const outstandingPayments = totalRevenuePotential - totalRevenueCollected;

  // 3. Status counters
  const statusLunasCount = bookings.filter((b) => b.paymentStatus === 'Lunas').length;
  const statusDpCount = bookings.filter((b) => b.paymentStatus === 'DP').length;
  const statusBelumBayarCount = bookings.filter((b) => b.paymentStatus === 'Belum Bayar').length;

  // 4. Occupancy Rate of June (calculated by room-nights sold)
  // There are 4 rooms and 30 days = 120 slot-nights available in June 2026.
  const totalSlotNights = roomTypes.length * 30;
  
  // Calculate total sold nights (limited to June 2026)
  const soldNights = bookings.reduce((sum, b) => {
    const start = new Date(b.checkInDate);
    const end = new Date(b.checkOutDate);
    
    // Constrain dates within June 2026
    const juneStart = new Date('2026-06-01');
    const juneEnd = new Date('2026-06-30');
    
    const actualStart = start < juneStart ? juneStart : start;
    const actualEnd = end > juneEnd ? juneEnd : end;
    
    if (actualEnd > actualStart) {
      const diffDays = Math.ceil((actualEnd.getTime() - actualStart.getTime()) / (1000 * 60 * 60 * 24));
      return sum + diffDays;
    }
    return sum;
  }, 0);

  const occupancyRate = totalSlotNights > 0 
    ? Math.min(100, Math.round((soldNights / totalSlotNights) * 100)) 
    : 0;

  return (
    <div id="widget-summary" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Rooms Sold & Occupancy */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex items-center justify-between group hover:shadow-md transition-shadow">
        <div className="space-y-1">
          <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-none">TINGKAT OKUPANSI</span>
          <span className="block text-2xl font-black text-gray-800 tracking-tight">
            {occupancyRate}%
          </span>
          <span className="block text-[10px] text-gray-500">
            Terisi <span className="font-semibold text-emerald-600">{soldNights}</span> dari {totalSlotNights} malam kamar
          </span>
        </div>
        <div className="p-3 bg-blue-50 text-blue-905 rounded-xl group-hover:bg-blue-900 group-hover:text-white transition-colors duration-350">
          <Percent className="w-5 h-5" />
        </div>
      </div>

      {/* 2. Total Collected Cash */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex items-center justify-between group hover:shadow-md transition-shadow">
        <div className="space-y-1">
          <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-none">KAS DITERIMA (DP/LUNAS)</span>
          <span className="block text-2xl font-black text-emerald-700 tracking-tight font-mono">
            Rp {totalRevenueCollected.toLocaleString('id-ID')}
          </span>
          <span className="block text-[10px] text-gray-500">
            Dari total potensi Rp {totalRevenuePotential.toLocaleString('id-ID')}
          </span>
        </div>
        <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl group-hover:bg-emerald-800 group-hover:text-white transition-colors duration-350">
          <TrendingUp className="w-5 h-5" />
        </div>
      </div>

      {/* 3. Piutang Outstanding (DP/Reservations) */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex items-center justify-between group hover:shadow-md transition-shadow">
        <div className="space-y-1">
          <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-none">PIUTANG (BELUM LUNAS)</span>
          <span className="block text-2xl font-black text-amber-600 tracking-tight font-mono">
            Rp {outstandingPayments.toLocaleString('id-ID')}
          </span>
          <span className="block text-[10px] text-gray-550">
            Sebab DP & Reservasi belum dilunasi
          </span>
        </div>
        <div className="p-3 bg-amber-50 text-amber-800 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors duration-350">
          <Clock className="w-5 h-5" />
        </div>
      </div>

      {/* 4. Total Bookings Count & Status Status */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex items-center justify-between group hover:shadow-md transition-shadow">
        <div className="space-y-1">
          <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-none">TOTAL RESERVASI</span>
          <span className="block text-2xl font-black text-blue-900 tracking-tight">
            {totalBookings} Tamu
          </span>
          <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-1">
            <span className="bg-emerald-50 text-emerald-750 px-1 rounded font-semibold">🟢 {statusLunasCount} L</span>
            <span className="bg-amber-50 text-amber-750 px-1 rounded font-semibold">🟡 {statusDpCount} DP</span>
            <span className="bg-rose-50 text-rose-750 px-1 rounded font-semibold">🔴 {statusBelumBayarCount} B</span>
          </div>
        </div>
        <div className="p-3 bg-indigo-50 text-indigo-900 rounded-xl group-hover:bg-indigo-950 group-hover:text-white transition-colors duration-350">
          <Bed className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
