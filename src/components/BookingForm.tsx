/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import { Booking, RoomType, PaymentStatus, BankAccount } from '../types';
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
  // Load active bank list from settings for payment method configuration
  const [banksList] = useState<BankAccount[]>(() => {
    const raw = localStorage.getItem('villa_settings');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.banks && parsed.banks.length > 0) {
          return parsed.banks;
        }
        if (parsed.bankName) {
          return [{
            id: 'bank-1',
            bankName: parsed.bankName,
            bankNoRek: parsed.bankNoRek || '',
            bankOwner: parsed.bankOwner || ''
          }];
        }
      } catch (e) {}
    }
    return [
      {
        id: 'bank-1',
        bankName: 'BCA (Bank Central Asia)',
        bankNoRek: '123-4567-890',
        bankOwner: 'VILLA INDAH HARMONI AGUNG'
      },
      {
        id: 'bank-2',
        bankName: 'Bank Mandiri',
        bankNoRek: '144-00-112233-4',
        bankOwner: 'VILLA INDAH HARMONI AGUNG'
      }
    ];
  });

  // Form States
  const [guestName, setGuestName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [checkInDate, setCheckInDate] = useState('2026-06-01');
  const [checkOutDate, setCheckOutDate] = useState('2026-06-02');
  const [checkInTime, setCheckInTime] = useState('14:00');
  const [checkOutTime, setCheckOutTime] = useState('12:00');
  const [timeZone, setTimeZone] = useState('WIB');
  const [roomId, setRoomId] = useState(roomTypes[0]?.id || '');
  const [roomCount, setRoomCount] = useState(1);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Belum Bayar');
  const [paymentMethod, setPaymentMethod] = useState('Tunai');
  const [amountPaid, setAmountPaid] = useState(0);
  const [notes, setNotes] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);
  const [nights, setNights] = useState(1);
  const [errorMessage, setErrorMessage] = useState('');
  const [successToast, setSuccessToast] = useState(false);

  // Weekend and weekday night breakdown states
  const [weekdayNightsCount, setWeekdayNightsCount] = useState(0);
  const [weekendNightsCount, setWeekendNightsCount] = useState(0);

  // Load initial values if editing or clicking empty cell
  useEffect(() => {
    if (initialValues) {
      setGuestName(initialValues.guestName || '');
      setWhatsappNumber(initialValues.whatsappNumber || '');
      if (initialValues.checkInDate) setCheckInDate(initialValues.checkInDate);
      if (initialValues.checkOutDate) setCheckOutDate(initialValues.checkOutDate);
      setCheckInTime(initialValues.checkInTime || '14:00');
      setCheckOutTime(initialValues.checkOutTime || '12:00');
      setTimeZone(initialValues.timeZone || 'WIB');
      if (initialValues.roomId) setRoomId(initialValues.roomId);
      if (initialValues.paymentStatus) setPaymentStatus(initialValues.paymentStatus);
      if (initialValues.paymentMethod) {
        setPaymentMethod(initialValues.paymentMethod);
      } else {
        setPaymentMethod('Tunai');
      }
      if (initialValues.amountPaid !== undefined) setAmountPaid(initialValues.amountPaid);
      if (initialValues.notes !== undefined) setNotes(initialValues.notes || '');
    } else {
      // Clear for new booking
      setGuestName('');
      setWhatsappNumber('');
      setCheckInDate('2026-06-01');
      setCheckOutDate('2026-06-02');
      setCheckInTime('14:00');
      setCheckOutTime('12:00');
      setTimeZone('WIB');
      setRoomId(roomTypes[0]?.id || '');
      setRoomCount(1);
      setPaymentStatus('Belum Bayar');
      setPaymentMethod('Tunai');
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
      
      let weekdayCount = 0;
      let weekendCount = 0;
      let tempDate = new Date(start);
      
      for (let i = 0; i < calculatedNights; i++) {
        const day = tempDate.getDay();
        const isWeekend = day === 0 || day === 6; // Sunday (0) or Saturday (6)
        if (isWeekend) {
          weekendCount++;
        } else {
          weekdayCount++;
        }
        tempDate.setDate(tempDate.getDate() + 1);
      }
      
      setWeekdayNightsCount(weekdayCount);
      setWeekendNightsCount(weekendCount);

      const wdRate = selectedRoom.rateWeekday ?? selectedRoom.ratePerNight;
      const weRate = selectedRoom.rateWeekend ?? selectedRoom.ratePerNight;
      const calculatedTotal = ((weekdayCount * wdRate) + (weekendCount * weRate)) * roomCount;
      
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
      checkInTime,
      checkOutTime,
      timeZone,
      roomId,
      paymentStatus,
      amountPaid: paymentStatus === 'Lunas' ? totalPrice : paymentStatus === 'Belum Bayar' ? 0 : amountPaid,
      totalPrice,
      paymentMethod,
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
                    {room.name} — Wd: Rp {(room.rateWeekday ?? room.ratePerNight).toLocaleString('id-ID')} | We: Rp {(room.rateWeekend ?? room.ratePerNight).toLocaleString('id-ID')} /malam
                  </option>
                ))}
              </select>
              {selectedRoom && (
                <p className="text-[11px] text-gray-500 mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  💡 Max Kapasitas: <span className="font-semibold text-slate-700">{selectedRoom.capacity} Orang</span>. {selectedRoom.description}
                </p>
              )}
            </div>

            {/* Check-in & Check-out Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="checkin-date" className="block text-xs font-bold text-gray-700 mb-1.5">
                  Check-in <span className="text-[10px] text-gray-400 font-semibold">(Tanggal & Jam)</span> <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
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
                  <input
                    type="time"
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    className="w-24 text-xs px-2 py-2.5 border border-gray-200 outline-none rounded-xl focus:border-blue-900 focus:ring-1 focus:ring-blue-900/10 bg-white font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="checkout-date" className="block text-xs font-bold text-gray-700 mb-1.5">
                  Check-out <span className="text-[10px] text-gray-400 font-semibold">(Tanggal & Jam)</span> <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
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
                  <input
                    type="time"
                    value={checkOutTime}
                    onChange={(e) => setCheckOutTime(e.target.value)}
                    className="w-24 text-xs px-2 py-2.5 border border-gray-200 outline-none rounded-xl focus:border-blue-900 focus:ring-1 focus:ring-blue-900/10 bg-white font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Zona Waktu Selector inside regular form */}
            <div className="bg-slate-50 border border-gray-150 p-2.5 rounded-xl flex items-center justify-between text-xs">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Zona Waktu Kuitansi:</span>
              <div className="flex gap-2 bg-gray-200/50 p-1 rounded-lg">
                {['WIB', 'WITA', 'WIT'].map((tz) => (
                  <button
                    key={tz}
                    type="button"
                    onClick={() => setTimeZone(tz)}
                    className={`px-3 py-1 text-[10px] font-black rounded-md transition-colors ${
                      timeZone === tz
                        ? 'bg-blue-900 text-white shadow-3xs'
                        : 'bg-white text-gray-600 hover:text-black border border-gray-150 shadow-3xs'
                    }`}
                  >
                    {tz}
                  </button>
                ))}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
            {/* Total price indicator (Readonly) */}
            <div className="bg-white p-3.5 rounded-xl border border-gray-150 shadow-2xs flex flex-col justify-between">
              <div>
                <span className="block text-[10px] uppercase font-bold text-gray-400">Total Tagihan</span>
                <span id="label-total-price" className="block text-base font-bold text-gray-900 mt-1 font-mono">
                  Rp {totalPrice.toLocaleString('id-ID')}
                </span>
              </div>
              <span className="block text-[9px] text-gray-400 mt-1 leading-normal">
                Detail: {weekdayNightsCount > 0 ? `${weekdayNightsCount}x Weekday (Rp ${(selectedRoom?.rateWeekday ?? selectedRoom?.ratePerNight ?? 0).toLocaleString('id-ID')})` : ''} {weekendNightsCount > 0 ? `${weekdayNightsCount > 0 ? ' + ' : ''}${weekendNightsCount}x Weekend (Rp ${(selectedRoom?.rateWeekend ?? selectedRoom?.ratePerNight ?? 0).toLocaleString('id-ID')})` : ''} {roomCount > 1 ? `× ${roomCount} Unit` : ''}
              </span>
            </div>

            {/* Status Pembayaran */}
            <div className="bg-white p-3 border border-gray-150 rounded-xl shadow-2xs flex flex-col justify-between">
              <div>
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
              <span className="text-[9px] text-gray-400 block mt-1">
                Pilih kondisi penagihan saat ini.
              </span>
            </div>

            {/* Metode Pembayaran */}
            <div className="bg-white p-3 border border-gray-150 rounded-xl shadow-2xs flex flex-col justify-between">
              <div>
                <label htmlFor="payment-method" className="block text-[10px] uppercase font-bold text-gray-550 mb-1 block">
                  Metode Pembayaran <span className="text-rose-500">*</span>
                </label>
                <select
                  id="payment-method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-gray-200 outline-none rounded-lg focus:border-blue-905 bg-slate-50/50 font-bold text-slate-800"
                >
                  <option value="Tunai">💵 Tunai (Cash)</option>
                  {banksList.map((b) => (
                    <option key={b.id} value={`Transfer ${b.bankName}`}>
                      🏦 {b.bankName}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-[9px] text-gray-400 block mt-1">
                {paymentMethod === 'Tunai' 
                  ? 'Bayar tunai langsung.' 
                  : `Rekening: ${banksList.find(b => `Transfer ${b.bankName}` === paymentMethod)?.bankNoRek || 'Transfer Bank'}`}
              </span>
            </div>

            {/* Nominal Terbayar */}
            <div className="bg-white p-3 border border-gray-150 rounded-xl shadow-2xs flex flex-col justify-between">
              <div>
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
              </div>
              <span className="text-[9px] text-gray-400 block mt-1">
                {paymentStatus === 'Lunas'
                  ? 'Otomatis lunas penuh.'
                  : paymentStatus === 'Belum Bayar'
                  ? 'Otomatis Rp 0.'
                  : 'Ketik nominal DP.'}
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
