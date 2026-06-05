/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Booking, RoomType } from '../types';
import { Printer, Calendar, ShieldCheck, Mail, Phone, MapPin, Sparkles, Receipt, FileSignature, Edit, RefreshCw, Check, Clipboard } from 'lucide-react';

interface ReceiptViewProps {
  bookings: Booking[];
  roomTypes: RoomType[];
  selectedBookingId: string | null;
  onSelectBooking: (id: string) => void;
  onEditBooking: (booking: Booking) => void;
}

// Indonesian "Terbilang" helper function for spelled out rupiah currency
function getTerbilang(n: number): string {
  if (n === 0) return 'Nol Rupiah';
  
  const units = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  
  function helper(num: number): string {
    if (num < 12) {
      return units[num];
    } else if (num < 20) {
      return units[num - 10] + ' Belas';
    } else if (num < 100) {
      const remainder = num % 10;
      return units[Math.floor(num / 10)] + ' Puluh ' + (remainder ? ' ' + helper(remainder) : '');
    } else if (num < 200) {
      return 'Seratus' + (num - 100 ? ' ' + helper(num - 100) : '');
    } else if (num < 1000) {
      const remainder = num % 100;
      return units[Math.floor(num / 100)] + ' Ratus' + (remainder ? ' ' + helper(remainder) : '');
    } else if (num < 2000) {
      return 'Seribu' + (num - 1000 ? ' ' + helper(num - 1000) : '');
    } else if (num < 1000000) {
      const remainder = num % 1000;
      return helper(Math.floor(num / 1000)) + ' Ribu' + (remainder ? ' ' + helper(remainder) : '');
    } else if (num < 1000000000) {
      const remainder = num % 1000000;
      return helper(Math.floor(num / 1000000)) + ' Juta' + (remainder ? ' ' + helper(remainder) : '');
    }
    return '';
  }

  const result = helper(n).trim();
  return result.charAt(0).toUpperCase() + result.slice(1) + ' Rupiah';
}

export default function ReceiptView({
  bookings,
  roomTypes,
  selectedBookingId,
  onSelectBooking,
  onEditBooking,
}: ReceiptViewProps) {
  const [copiedLink, setCopiedLink] = useState(false);

  // Get active booking or default to the most recent one
  const activeBooking = bookings.find((b) => b.id === selectedBookingId) || bookings[0];

  const handlePrint = () => {
    // We trigger browser print.
    // We have configured css @media print in index.css to isolate receipt printing cleanly.
    window.print();
  };

  const handleCopyReceiptUrl = () => {
    if (!activeBooking) return;
    const shareText = `*KUITANSI DIGITAL - VILLA INDAH HARMONI*\n` +
      `No. Kuitansi: ${activeBooking.invoiceNumber}\n` +
      `Tamu: ${activeBooking.guestName}\n` +
      `Total Tagihan: Rp ${activeBooking.totalPrice.toLocaleString('id-ID')}\n` +
      `Status: ${activeBooking.paymentStatus} (Terbayar: Rp ${activeBooking.amountPaid.toLocaleString('id-ID')})\n` +
      `Tipe Kamar: ${roomTypes.find(r => r.id === activeBooking.roomId)?.name || 'Kamar Villa'}\n` +
      `Periode: ${activeBooking.checkInDate} s/d ${activeBooking.checkOutDate}\n\n` +
      `Terima kasih telah mempercayakan akomodasi Anda bersama kami!`;
    
    navigator.clipboard.writeText(shareText);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (!activeBooking) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center max-w-xl mx-auto border border-gray-100">
        <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-800">Kuitansi Tidak Ditemukan</h3>
        <p className="text-sm text-gray-500 mt-1">Belum ada booking terdaftar untuk ditarik kuitansinya.</p>
      </div>
    );
  }

  const selectedRoom = roomTypes.find((r) => r.id === activeBooking.roomId);
  const nightsStayed = Math.round(
    (new Date(activeBooking.checkOutDate).getTime() - new Date(activeBooking.checkInDate).getTime()) /
      (1000 * 3600 * 24)
  );

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Control panel for receipt */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        {/* Selector dropdown for bookings */}
        <div className="flex items-center gap-2">
          <label htmlFor="receipt-select" className="text-xs font-bold text-gray-400 uppercase">Pilih Booking:</label>
          <select
            id="receipt-select"
            value={activeBooking.id}
            onChange={(e) => onSelectBooking(e.target.value)}
            className="text-xs font-semibold text-gray-700 bg-slate-50 border border-gray-200 rounded-lg p-2 focus:border-blue-900 outline-none max-w-xs"
          >
            {bookings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.invoiceNumber} — {b.guestName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEditBooking(activeBooking)}
            id="btn-receipt-edit"
            className="cursor-pointer px-3.5 py-2 hover:bg-slate-50 border border-gray-250 text-gray-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
            title="Edit Booking ini"
          >
            <Edit className="w-3.5 h-3.5" />
            Edit Data
          </button>

          <button
            onClick={handleCopyReceiptUrl}
            id="btn-receipt-share"
            className="cursor-pointer px-3.5 py-2 hover:bg-slate-50 border border-gray-250 text-gray-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                Copied!
              </>
            ) : (
              <>
                <Clipboard className="w-3.5 h-3.5" />
                Copy Kuitansi SMS/WA
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            id="btn-receipt-print"
            className="cursor-pointer px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white font-semibold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak Kuitansi
          </button>
        </div>
      </div>

      {/* Printable Receipt Card Container */}
      <div
        id="printable-receipt"
        className="bg-white p-7 md:p-8 rounded-2xl shadow-md border-2 border-dashed border-slate-300 relative overflow-hidden"
      >
        {/* Aesthetic physical aesthetic cut lines */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900"></div>

        {/* Receipt Header */}
        <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center pb-6 border-b-2 border-slate-200/60 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 px-2.5 bg-blue-900 text-white font-serif rounded-lg font-bold text-base tracking-widest">H</span>
              <h1 className="text-lg font-extrabold text-blue-900 tracking-tight">VILLA INDAH HARMONI</h1>
            </div>
            <p className="text-[11px] text-gray-500 font-medium flex items-center gap-1 mt-1.5">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              Kawasan Wisata Puncak, Jl. Raya Ciloto No. 12, Jawa Barat
            </p>
            <p className="text-[11px] text-gray-400 flex items-center gap-3">
              <span className="inline-flex items-center gap-0.5"><Phone className="w-3 h-3" /> +62 811-2233-4455</span>
              <span className="inline-flex items-center gap-0.5"><Mail className="w-3 h-3" /> info@villaindahharmoni.com</span>
            </p>
          </div>

          <div className="md:text-right border-l-2 md:border-l-0 md:border-r-2 border-blue-900/10 pl-3 md:pl-0 md:pr-3">
            <span className="block text-[10px] text-gray-400 uppercase tracking-widest font-extrabold">KUITANSI DIGITAL</span>
            <span className="block font-mono text-base font-bold text-gray-800 mt-0.5">{activeBooking.invoiceNumber}</span>
            <span className="block text-[10px] text-gray-550 mt-1">
              Tanggal: {new Date(activeBooking.createdAt).toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>

        {/* Receipt Main Body (Telah Terima Dari, Nominal, Terbilang) */}
        <div className="py-6 space-y-5">
          {/* Guest Name */}
          <div className="grid grid-cols-1 sm:grid-cols-4 items-baseline pb-3 border-b border-gray-100 gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Telah Terima Dari</span>
            <span className="text-sm font-bold text-gray-800 sm:col-span-3 capitalize">
              : {activeBooking.guestName}
            </span>
          </div>

          {/* Spelled Out Rupiah (Terbilang) */}
          <div className="grid grid-cols-1 sm:grid-cols-4 items-baseline pb-3 border-b border-gray-100 gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Uang Sejumlah</span>
            <span className="text-sm italic font-medium text-slate-700 sm:col-span-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100 block">
              💡 "{getTerbilang(activeBooking.paymentStatus === 'DP' ? activeBooking.amountPaid : activeBooking.totalPrice)}"
            </span>
          </div>

          {/* Keterangan Pembayaran Payment For */}
          <div className="grid grid-cols-1 sm:grid-cols-4 items-baseline pb-3 border-b border-gray-100 gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Untuk Pembayaran</span>
            <span className="text-xs text-gray-700 sm:col-span-3 leading-relaxed">
              : Penyewaan kamar <span className="font-semibold text-gray-900">{selectedRoom ? selectedRoom.name : 'VIP Room'}</span> sebanyak <span className="font-semibold text-gray-900">1 Unit</span> selama <span className="font-semibold text-gray-900">{nightsStayed} malam</span>. Periode menginap tanggal <span className="font-mono text-gray-800 bg-slate-100 px-1 py-0.5 rounded">{activeBooking.checkInDate}</span> s.d. <span className="font-mono text-gray-800 bg-slate-100 px-1 py-0.5 rounded">{activeBooking.checkOutDate}</span>.
              {activeBooking.notes && (
                <span className="block mt-1 text-[11px] text-gray-500 italic bg-amber-50/50 p-1.5 rounded border border-amber-150">
                  Catatan: {activeBooking.notes}
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Absolute Ribbon Badge for paid statuses */}
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 select-none pointer-events-none opacity-[0.04] rotate-12">
          <div className="text-7xl font-sans font-black uppercase tracking-widest text-slate-900 border-8 border-slate-900 p-4 rounded-3xl">
            {activeBooking.paymentStatus}
          </div>
        </div>

        {/* Receipt Footer (Amout in Numbers & Signature Block) */}
        <div className="pt-6 border-t-2 border-slate-200/60 flex flex-col sm:flex-row justify-between items-center gap-6">
          {/* Big Green Box with Amount */}
          <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl flex items-center gap-3 w-full sm:w-auto">
            <div className="p-2 bg-emerald-150 text-emerald-700 rounded-lg">
              <span className="block text-xs uppercase font-extrabold tracking-wider">NOMINAL</span>
            </div>
            <div>
              <span className="block text-[10px] text-emerald-600 font-semibold uppercase leading-none">
                {activeBooking.paymentStatus === 'Lunas' ? 'LUNAS SEPENUHNYA' : activeBooking.paymentStatus === 'DP' ? 'DOWN PAYMENT (DP)' : 'TAGIHAN TERTUNDA'}
              </span>
              <span className="block text-xl font-mono font-extrabold text-emerald-800 mt-1">
                Rp {(activeBooking.paymentStatus === 'DP' ? activeBooking.amountPaid : activeBooking.totalPrice).toLocaleString('id-ID')}
              </span>
              {activeBooking.paymentStatus === 'DP' && (
                <span className="block text-[9px] text-gray-400 mt-0.5">
                  Sisa Pelunasan: Rp {(activeBooking.totalPrice - activeBooking.amountPaid).toLocaleString('id-ID')}
                </span>
              )}
            </div>
          </div>

          {/* Signature Block */}
          <div className="text-center w-full sm:w-44 flex flex-col items-center justify-center self-end">
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Admin Villa</span>
            <div className="my-1.5 relative h-12 w-32 flex items-center justify-center">
              {/* Elegant mockup digital signature lines */}
              <div className="absolute select-none pointer-events-none text-indigo-800 font-serif font-bold italic text-sm border-b border-dashed border-gray-300 pb-1.5 w-full">
                ~ Irwan Setia ~
              </div>
            </div>
            <span className="text-xs font-semibold text-gray-605">Irwan Setiawan</span>
            <span className="text-[9px] text-gray-400 font-mono">Villa Indah Harmoni</span>
          </div>
        </div>

        {/* Security badge footer for authentic physical receipt looks */}
        <div className="mt-8 pt-3 border-t border-gray-100 flex items-center justify-between text-[9px] text-gray-400">
          <span className="flex items-center gap-1 uppercase tracking-wider font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-900" />
            Verified Offline System Ledger
          </span>
          <span>Dibuat pada: {new Date(activeBooking.createdAt).toLocaleString('id-ID')}</span>
        </div>
      </div>
    </div>
  );
}
