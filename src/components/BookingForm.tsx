/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import { Booking, RoomType, PaymentStatus } from '../types';
import { Calendar, User, Phone, CheckCircle, Calculator, FileText, RefreshCw, X } from 'lucide-react';

interface BookingFormProps {
  roomTypes: RoomType[];
  initialValues?: Partial<Booking> | null;
  onSave: (booking: Booking) => void;
  onCancel?: () => void;
}

export default function BookingForm({
  roomTypes,
  initialValues,
  onSave,
  onCancel,
}: BookingFormProps) {
  // Form States
  const [guestName, setGuestName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [checkInDate, setCheckInDate] = useState('2026-06-01');
  const [checkOutDate, setCheckOutDate] = useState('2026-06-02');
  const [roomId, setRoomId] = useState(roomTypes[0]?.id || '');
  const [roomCount, setRoomCount] = useState(1);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Belum Bayar');
  const [amountPaid, setAmountPaid] = useState(0);
  const [notes, setNotes] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);
  const [nights, setNights] = useState(1);
  const [errorMessage, setErrorMessage] = useState('');
  const [successToast, setSuccessToast] = useState(false);

  // Load initial values if editing or clicking empty cell
  useEffect(() => {
    if (initialValues) {
      setGuestName(initialValues.guestName || '');
      setWhatsappNumber(initialValues.whatsappNumber || '');
      if (initialValues.checkInDate) setCheckInDate(initialValues.checkInDate);
      if (initialValues.checkOutDate) setCheckOutDate(initialValues.checkOutDate);
      if (initialValues.roomId) setRoomId(initialValues.roomId);
      if (initialValues.paymentStatus) setPaymentStatus(initialValues.paymentStatus);
      if (initialValues.amountPaid !== undefined) setAmountPaid(initialValues.amountPaid);
      if (initialValues.notes !== undefined) setNotes(initialValues.notes || '');
    } else {
      // Clear for new booking
      setGuestName('');
      setWhatsappNumber('');
      setCheckInDate('2026-06-01');
      setCheckOutDate('2026-06-02');
      setRoomId(roomTypes[0]?.id || '');
      setRoomCount(1);
      setPaymentStatus('Belum Bayar');
      setAmountPaid(0);
      setNotes('');
    }
    setErrorMessage('');
  }, [initialValues, roomTypes]);

  // Recalculate nights and total price
  useEffect(() => {
    if (!checkInDate || !checkOutDate || !roomId) return;

    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    
    // Calculate nights
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const selectedRoom = roomTypes.find((r) => r.id === roomId);
    if (selectedRoom) {
      const calculatedNights = diffDays > 0 ? diffDays : 1;
      setNights(calculatedNights);
      
      const calculatedTotal = calculatedNights * selectedRoom.ratePerNight * roomCount;
      setTotalPrice(calculatedTotal);

      // Auto-set amountPaid if status is Lunas or Belum Bayar
      if (paymentStatus === 'Lunas') {
        setAmountPaid(calculatedTotal);
      } else if (paymentStatus === 'Belum Bayar') {
        setAmountPaid(0);
      }
    }
  }, [checkInDate, checkOutDate, roomId, roomCount, paymentStatus, roomTypes]);

  // Handle manual input of Amount Paid
  const handleAmountPaidChange = (val: number) => {
    if (val < 0) return;
    if (val > totalPrice) {
      setAmountPaid(totalPrice);
    } else {
      setAmountPaid(val);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!guestName.trim()) {
      setErrorMessage('Mohon masukkan Nama Lengkap tamu.');
      return;
    }

    if (!whatsappNumber.trim()) {
      setErrorMessage('Nomor WhatsApp wajib diisi untuk kuitansi.');
      return;
    }

    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    if (end <= start) {
      setErrorMessage('Tanggal Check-out harus setelah tanggal Check-in.');
      return;
    }

    // Prepare booking object
    const finalBooking: Booking = {
      id: initialValues?.id || `b-${Date.now()}`,
      invoiceNumber: initialValues?.invoiceNumber || `INV-202606-${Math.floor(100 + Math.random() * 900)}`,
      guestName: guestName.trim(),
      whatsappNumber: whatsappNumber.trim(),
      checkInDate,
      checkOutDate,
      roomId,
      paymentStatus,
      amountPaid: paymentStatus === 'Lunas' ? totalPrice : paymentStatus === 'Belum Bayar' ? 0 : amountPaid,
      totalPrice,
      notes: notes.trim(),
      createdAt: initialValues?.createdAt || new Date().toISOString(),
    };

    onSave(finalBooking);
    
    // Visual success indicator
    setSuccessToast(true);
    setTimeout(() => {
      setSuccessToast(false);
    }, 3000);
  };

  const selectedRoom = roomTypes.find((r) => r.id === roomId);

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden max-w-3xl mx-auto">
      {/* Banner / Header */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 p-6 text-white flex justify-between items-center relative">
        <div>
          <span className="bg-blue-800 text-blue-200 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
            {initialValues?.id ? 'Mode Edit Booking' : 'Booking Baru'}
          </span>
          <h2 className="text-xl font-bold mt-2 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-300" />
            {initialValues?.id ? 'Formulir Sunting Reservasi' : 'Form Pemesanan Kamar Villa'}
          </h2>
          <p className="text-xs text-blue-200 mt-1">
            {initialValues?.id
              ? `Memodifikasi pesanan nomor invoice ${initialValues.invoiceNumber}`
              : 'Daftarkan pemesanan kamar tamu secara manual dengan kalkulasi instan.'}
          </p>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            id="btn-cancel-top"
            className="cursor-pointer bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors"
            title="Kembali"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {successToast && (
        <div id="booking-success-toast" className="bg-emerald-50 border-y border-emerald-200 text-emerald-800 p-4 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-605" />
          <span>Data pemesanan berhasil disimpan! Database lokal diperbarui.</span>
        </div>
      )}

      {errorMessage && (
        <div id="booking-error-log" className="bg-rose-50 border-y border-rose-200 text-rose-800 p-4 text-xs font-semibold">
          ⚠️ {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Guest Information Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider pb-1 border-b border-gray-100">
              Data Pribadi Tamu
            </h3>

            {/* Guest Name */}
            <div>
              <label htmlFor="guest-name" className="block text-xs font-bold text-gray-700 mb-1.5">
                Nama Lengkap Tamu <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="guest-name"
                  type="text"
                  required
                  placeholder="Aris Setiawan / Shinta Dewi"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2.5 border border-gray-200 outline-none rounded-xl focus:border-blue-900 focus:ring-1 focus:ring-blue-900/10 placeholder:text-gray-400 bg-slate-50/20 shadow-xs"
                />
              </div>
            </div>

            {/* WA Number */}
            <div>
              <label htmlFor="wa-number" className="block text-xs font-bold text-gray-700 mb-1.5">
                No. WhatsApp Tamu <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="wa-number"
                  type="text"
                  required
                  placeholder="Contoh: 081234567890"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2.5 border border-gray-200 outline-none rounded-xl focus:border-blue-900 focus:ring-1 focus:ring-blue-900/10 placeholder:text-gray-400 bg-slate-50/20 shadow-xs"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Gunakan nomor aktif untuk sinkronisasi pengiriman kuitansi digital.</p>
            </div>

            {/* Add Notes */}
            <div>
              <label htmlFor="booking-notes" className="block text-xs font-bold text-gray-700 mb-1.5">
                Catatan khusus Tamu (Opsional)
              </label>
              <textarea
                id="booking-notes"
                rows={3}
                placeholder="Minta ranjang tambahan, kasur king size, arah pemandangan ranjang luar, atau jam check-in awal..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs p-3 border border-gray-200 outline-none rounded-xl focus:border-blue-900 focus:ring-1 focus:ring-blue-900/10 placeholder:text-gray-400 bg-slate-50/20 shadow-xs"
              />
            </div>
          </div>

          {/* Allocation Details Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider pb-1 border-b border-gray-100">
              Alokasi & Kamar Villa
            </h3>

            {/* Tipe Kamar Room Type */}
            <div>
              <label htmlFor="room-type" className="block text-xs font-bold text-gray-700 mb-1.5">
                Pilih Tipe Kamar / Villa <span className="text-rose-500">*</span>
              </label>
              <select
                id="room-type"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full text-xs px-3 py-2.5 border border-gray-200 outline-none rounded-xl focus:border-blue-900 focus:ring-1 focus:ring-blue-900/10 bg-slate-50/20 shadow-xs text-gray-800 font-medium"
              >
                {roomTypes.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} — Rp {room.ratePerNight.toLocaleString('id-ID')} / malam
                  </option>
                ))}
              </select>
              {selectedRoom && (
                <p className="text-[11px] text-gray-500 mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  💡 Max Kapasitas: <span className="font-semibold text-slate-700">{selectedRoom.capacity} Orang</span>. {selectedRoom.description}
                </p>
              )}
            </div>

            {/* Check-in & Check-out Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="checkin-date" className="block text-xs font-bold text-gray-700 mb-1.5">
                  Tanggal Check-in <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    id="checkin-date"
                    type="date"
                    required
                    min="2026-06-01"
                    max="2026-06-30"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full text-xs pl-8 pr-2 py-2.5 border border-gray-200 outline-none rounded-xl focus:border-blue-900 focus:ring-1 focus:ring-blue-900/10 bg-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="checkout-date" className="block text-xs font-bold text-gray-700 mb-1.5">
                  Tanggal Check-out <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    id="checkout-date"
                    type="date"
                    required
                    min="2026-06-02"
                    max="2026-07-05"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    className="w-full text-xs pl-8 pr-2 py-2.5 border border-gray-200 outline-none rounded-xl focus:border-blue-900 focus:ring-1 focus:ring-blue-900/10 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Jumlah Kamar */}
            <div>
              <label htmlFor="room-count" className="block text-xs font-bold text-gray-700 mb-1.5">
                Jumlah Kamar / Unit Disewa <span className="text-rose-500">*</span>
              </label>
              <input
                id="room-count"
                type="number"
                min="1"
                max="5"
                required
                value={roomCount}
                onChange={(e) => setRoomCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full text-xs px-3 py-2.5 border border-gray-200 outline-none rounded-xl focus:border-blue-900 focus:ring-1 focus:ring-blue-900/10 bg-slate-50/20 shadow-xs font-mono font-bold"
              />
            </div>
          </div>
        </div>

        {/* Financial & Status Section */}
        <div className="bg-slate-50/80 p-5 rounded-2xl border border-gray-200/60 mt-6 space-y-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-blue-900" />
            Aspek Keuangan & Nominal Pembayaran
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Total price indicator (Readonly) */}
            <div className="bg-white p-3.5 rounded-xl border border-gray-150 shadow-2xs">
              <span className="block text-[10px] uppercase font-bold text-gray-400">Total Tagihan</span>
              <span id="label-total-price" className="block text-lg font-bold text-gray-900 mt-1 font-mono">
                Rp {totalPrice.toLocaleString('id-ID')}
              </span>
              <span className="block text-[10px] text-gray-400 mt-0.5">
                Kalkulasi: {nights} Malam × Rp {selectedRoom?.ratePerNight.toLocaleString('id-ID')} {roomCount > 1 ? `× ${roomCount} Unit` : ''}
              </span>
            </div>

            {/* Status Pembayaran */}
            <div className="bg-white p-3 border border-gray-150 rounded-xl shadow-2xs">
              <label htmlFor="payment-status" className="block text-[10px] uppercase font-bold text-gray-550 mb-1 block">
                Status Pembayaran <span className="text-rose-500">*</span>
              </label>
              <select
                id="payment-status"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className="w-full text-xs px-2.5 py-1.5 border border-gray-200 outline-none rounded-lg focus:border-blue-905 bg-slate-50/50 font-bold"
              >
                <option value="Lunas">🟢 Lunas (Lunas Selesai)</option>
                <option value="DP">🟡 Uang Muka (DP / Panjar)</option>
                <option value="Belum Bayar">🔴 Belum Bayar (Reservasi)</option>
              </select>
            </div>

            {/* Nominal Terbayar */}
            <div className="bg-white p-3 border border-gray-150 rounded-xl shadow-2xs">
              <label htmlFor="amount-paid" className="block text-[10px] uppercase font-bold text-gray-550 mb-1 block">
                Nominal Terbayar (Rp)
              </label>
              <input
                id="amount-paid"
                type="number"
                disabled={paymentStatus === 'Lunas' || paymentStatus === 'Belum Bayar'}
                value={amountPaid}
                onChange={(e) => handleAmountPaidChange(parseInt(e.target.value) || 0)}
                className="w-full text-xs px-2.5 py-1.5 border border-gray-250 outline-none rounded-lg focus:border-blue-900 bg-disabled font-semibold font-mono disabled:bg-slate-105 disabled:text-gray-450"
              />
              <span className="text-[9px] text-gray-400 block mt-1">
                {paymentStatus === 'Lunas'
                  ? 'Otomatis lunas penuh.'
                  : paymentStatus === 'Belum Bayar'
                  ? 'Otomatis Rp 0.'
                  : 'Ketik nominal DP yang diterima.'}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="pt-2 flex items-center justify-between gap-3 border-t border-gray-100">
          <div className="text-[11px] text-gray-400">
            *Pastikan nomor WhatsApp dan nama lengkap tamu sesuai dengan KTP untuk penerbitan Kuitansi Digital.
          </div>

          <div className="flex items-center gap-2">
            {onCancel && (
              <button
                type="button"
                id="btn-form-back"
                onClick={onCancel}
                className="cursor-pointer px-5 py-2.5 border border-gray-200 rounded-xl font-semibold text-xs text-gray-650 hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
            )}

            <button
              type="submit"
              id="btn-save-booking"
              className="cursor-pointer px-6 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-semibold text-xs rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              {initialValues?.id ? 'Perbarui Booking' : 'Simpan Pemesanan'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
