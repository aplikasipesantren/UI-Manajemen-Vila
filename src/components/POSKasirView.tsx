/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { RoomType, Booking, Customer, PaymentStatus, BankAccount } from '../types';
import { 
  ShoppingCart, CreditCard, Search, UserPlus, Plus, Minus, Trash2, 
  Percent, Calendar, Receipt, Coffee, Sparkles, CheckCircle, 
  Coins, HelpCircle, Users, Utensils, Check, ArrowRight
} from 'lucide-react';
import { FacilityIcon } from './RoomManagement';

interface POSKasirViewProps {
  roomTypes: RoomType[];
  bookings: Booking[];
  customers: Customer[];
  onSaveBooking: (booking: Booking) => void;
  onSaveCustomer: (customer: Customer) => void;
}

interface CartItemAddon {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export default function POSKasirView({
  roomTypes,
  bookings,
  customers,
  onSaveBooking,
  onSaveCustomer,
}: POSKasirViewProps) {
  
  // Date configuration (defaults to today & tomorrow)
  const [checkInDate, setCheckInDate] = useState('2026-06-06');
  const [checkOutDate, setCheckOutDate] = useState('2026-06-07');
  
  // Indonesian check-in/out time states
  const [checkInTime, setCheckInTime] = useState('14:00');
  const [checkOutTime, setCheckOutTime] = useState('12:00');
  const [timeZone, setTimeZone] = useState<'WIB' | 'WITA' | 'WIT'>('WIB');
  
  // Selected single room in the cashier
  const [selectedRoomId, setSelectedRoomId] = useState<string>(roomTypes[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Customer selection & quick-add states
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [isQuickAddCustomerOpen, setIsQuickAddCustomerOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerWhatsApp, setNewCustomerWhatsApp] = useState('');
  const [newCustomerNotes, setNewCustomerNotes] = useState('');
  
  // Booking status & payment states
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Lunas');
  const [paymentMethod, setPaymentMethod] = useState('Tunai');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [cashReceived, setCashReceived] = useState<string>(''); // For change feedback calculation
  const [notes, setNotes] = useState('');
  const [discountAmount, setDiscountAmount] = useState<number>(0); // static amount

  // Custom Extra Add-ons
  const [addons, setAddons] = useState<CartItemAddon[]>([
    { id: 'extrabed', name: 'Extra Bed (Kasur Tambahan)', price: 150000, qty: 0 },
    { id: 'breakfast', name: 'Paket Sarapan Pagi', price: 50000, qty: 0 },
    { id: 'coffee', name: 'Coffee / Tea Set Unit', price: 25000, qty: 0 },
  ]);

  const [activeTab, setActiveTab2] = useState<'rooms' | 'addons'>('rooms');
  const [successToast, setSuccessToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Auto load first stable dates if there's any today
  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    const formattedToday = today.toISOString().split('T')[0];
    const formattedTomorrow = tomorrow.toISOString().split('T')[0];
    
    // Stable demo fallback
    setCheckInDate('2026-06-06');
    setCheckOutDate('2026-06-07');
  }, []);

  // Calculate day-by-day weekday & weekend night breakdown
  const dateBreakdown = useMemo(() => {
    if (!checkInDate || !checkOutDate) return { nights: 0, weekdays: 0, weekends: 0 };
    
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return { nights: 0, weekdays: 0, weekends: 0 };
    
    let weekdays = 0;
    let weekends = 0;
    let tempDate = new Date(start);
    
    for (let i = 0; i < diffDays; i++) {
      const day = tempDate.getDay();
      const isWeekend = day === 0 || day === 6; // Sunday (0) or Saturday (6)
      if (isWeekend) {
        weekends++;
      } else {
        weekdays++;
      }
      tempDate.setDate(tempDate.getDate() + 1);
    }
    
    return {
      nights: diffDays,
      weekdays,
      weekends
    };
  }, [checkInDate, checkOutDate]);

  // Find the currently selected room
  const selectedRoom = useMemo(() => {
    return roomTypes.find(r => r.id === selectedRoomId);
  }, [roomTypes, selectedRoomId]);

  // Room pricing calculation based on weekday vs weekend
  const roomCostBreakdown = useMemo(() => {
    if (!selectedRoom) return { wdTotal: 0, weTotal: 0, baseTotal: 0 };
    
    const wdRate = selectedRoom.rateWeekday ?? selectedRoom.ratePerNight;
    const weRate = selectedRoom.rateWeekend ?? selectedRoom.ratePerNight;
    
    const wdTotal = dateBreakdown.weekdays * wdRate;
    const weTotal = dateBreakdown.weekends * weRate;
    
    return {
      wdRate,
      weRate,
      wdTotal,
      weTotal,
      baseTotal: wdTotal + weTotal
    };
  }, [selectedRoom, dateBreakdown]);

  // Calculate addons total
  const addonsTotal = useMemo(() => {
    return addons.reduce((sum, item) => sum + (item.price * item.qty), 0);
  }, [addons]);

  // Calculate Grand Total
  const grandTotal = useMemo(() => {
    const total = roomCostBreakdown.baseTotal + addonsTotal - discountAmount;
    return total > 0 ? total : 0;
  }, [roomCostBreakdown, addonsTotal, discountAmount]);

  // Update amountPaid auto-configuration when grandTotal or status changes
  useEffect(() => {
    if (paymentStatus === 'Lunas') {
      setAmountPaid(grandTotal);
    } else if (paymentStatus === 'Belum Bayar') {
      setAmountPaid(0);
    } else {
      // DP: default to half or keep existing within limits
      setAmountPaid(prev => prev > grandTotal ? Math.floor(grandTotal / 2) : prev);
    }
  }, [grandTotal, paymentStatus]);

  // Change logic
  const changeAmount = useMemo(() => {
    const cash = Number(cashReceived) || 0;
    if (cash <= amountPaid) return 0;
    return cash - amountPaid;
  }, [cashReceived, amountPaid]);

  // Filters rooms based on search query
  const filteredRooms = useMemo(() => {
    return roomTypes.filter(room => 
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [roomTypes, searchQuery]);

  // Quick select customer fill-in
  const currentCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  // Handle Quick Add Customer
  const handleQuickAddCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim() || !newCustomerWhatsApp.trim()) {
      alert('Nama dan No. WhatsApp wajib diisi.');
      return;
    }
    
    const newCust: Customer = {
      id: `c-${Date.now()}`,
      name: newCustomerName.trim(),
      whatsappNumber: newCustomerWhatsApp.trim(),
      notes: newCustomerNotes.trim(),
      createdAt: new Date().toISOString(),
    };
    
    onSaveCustomer(newCust);
    setSelectedCustomerId(newCust.id);
    
    // Reset wizard fields
    setNewCustomerName('');
    setNewCustomerWhatsApp('');
    setNewCustomerNotes('');
    setIsQuickAddCustomerOpen(false);
  };

  // Check if room is already occupied during the selected date range
  const isRoomOccupied = (roomIdToCheck: string) => {
    if (!checkInDate || !checkOutDate) return false;
    const startReq = new Date(checkInDate);
    const endReq = new Date(checkOutDate);
    
    return bookings.some(b => {
      if (b.roomId !== roomIdToCheck) return false;
      const bStart = new Date(b.checkInDate);
      const bEnd = new Date(b.checkOutDate);
      
      // Overlap condition
      return (startReq < bEnd && endReq > bStart);
    });
  };

  // Render quick cash suggestions
  const getCashSuggestions = () => {
    const list = [amountPaid];
    const notesArray = [50000, 100000, 200000, 500000, 1000000];
    
    notesArray.forEach(val => {
      if (val > amountPaid && !list.includes(val)) {
        list.push(val);
      }
    });

    // Add round-ups
    const next100k = Math.ceil(amountPaid / 100000) * 100000;
    if (!list.includes(next100k) && next100k > amountPaid) {
      list.push(next100k);
    }
    
    return list.sort((a,b) => a-b).slice(0, 5);
  };

  // Handle transaction complete
  const handleCheckout = () => {
    setErrorMessage('');
    
    if (!selectedCustomerId) {
      setErrorMessage('Pilih atau Tambahkan Tamu terlebih dahulu.');
      return;
    }

    if (!checkInDate || !checkOutDate) {
      setErrorMessage('Tanggal Check-In & Check-Out wajib ditentukan.');
      return;
    }

    if (dateBreakdown.nights <= 0) {
      setErrorMessage('Tanggal Check-out harus setelah tanggal Check-in.');
      return;
    }

    if (!selectedRoomId) {
      setErrorMessage('Pilih kamar / unit yang akan dipesan.');
      return;
    }

    if (isRoomOccupied(selectedRoomId)) {
      setErrorMessage(`Kamar "${selectedRoom?.name}" sudah terisi / terbooking pada tanggal tersebut.`);
      return;
    }

    // Prepare note with addon summaries if any
    const activeAddons = addons.filter(a => a.qty > 0);
    const addonSummary = activeAddons.map(a => `${a.name} (x${a.qty})`).join(', ');
    
    let combinedNotes = notes.trim();
    if (addonSummary) {
      combinedNotes = `Addons: ${addonSummary}. ${combinedNotes}`.trim();
    }
    if (discountAmount > 0) {
      combinedNotes = `Diskon: Rp ${discountAmount.toLocaleString('id-ID')}. ${combinedNotes}`.trim();
    }

    const customer = customers.find(c => c.id === selectedCustomerId);
    const guestName = customer ? customer.name : 'Unknown Guest';
    const whatsappNumber = customer ? customer.whatsappNumber : '';

    const newBooking: Booking = {
      id: `b-${Date.now()}`,
      invoiceNumber: `INV-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(1000 + Math.random() * 9000)}`,
      guestName,
      whatsappNumber,
      checkInDate,
      checkOutDate,
      checkInTime,
      checkOutTime,
      timeZone,
      roomId: selectedRoomId,
      paymentStatus,
      amountPaid: paymentStatus === 'Lunas' ? grandTotal : paymentStatus === 'Belum Bayar' ? 0 : amountPaid,
      totalPrice: grandTotal,
      paymentMethod,
      notes: combinedNotes,
      createdAt: new Date().toISOString()
    };

    onSaveBooking(newBooking);

    // Prompt visual success
    setSuccessToast(true);
    // Reset cashier state values
    setCashReceived('');
    setSelectedCustomerId('');
    setNotes('');
    setDiscountAmount(0);
    setAddons(addons.map(a => ({ ...a, qty: 0 })));
    
    setTimeout(() => {
      setSuccessToast(false);
    }, 4500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* LEFT COLUMN: Checkout Items & Customer Lookup (8 columns) */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-6">
        
        {/* Banner Notification Toast */}
        {successToast && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 shadow-3xs animate-scale-up">
            <div className="p-2 bg-emerald-500 text-white rounded-xl">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-emerald-950">Transaksi POS Berhasil Diproses!</h4>
              <p className="text-[10px] text-emerald-800">Booking kasir tersimpan. Sistem mengalihkan ke mode cetak kuitansi penjualan.</p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="bg-rose-50 border border-rose-205 rounded-xl p-3 text-xs font-bold text-rose-800 animate-pulse">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* SECTION 1: Booking Dates & Customer lookup */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-3xs space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <span className="p-1.5 bg-blue-50 text-blue-900 rounded-lg">
              <Calendar className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider leading-none">Konfigurasi Durasi Booking</h3>
              <span className="text-[9px] text-gray-400 font-bold font-mono">Simulasi ketersediaan & tarif langsung</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-550 uppercase tracking-widest block">Tanggal & Waktu Check-In</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="flex-1 text-xs px-3 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-semibold outline-none focus:border-blue-900 focus:bg-white"
                />
                <input
                  type="time"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="w-24 text-xs px-3 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-mono font-bold outline-none focus:border-blue-900 focus:bg-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-550 uppercase tracking-widest block">Tanggal & Waktu Check-Out</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="flex-1 text-xs px-3 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-semibold outline-none focus:border-blue-900 focus:bg-white"
                />
                <input
                  type="time"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="w-24 text-xs px-3 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-mono font-bold outline-none focus:border-blue-900 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Time Zone Selection Pill Menu */}
          <div className="bg-slate-50/70 border border-slate-200/80 p-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-blue-900 animate-pulse"></span>
              <span className="text-[10px] font-black text-gray-550 uppercase tracking-wider">Zona Waktu Kuitansi (Indonesia)</span>
            </div>
            <div className="flex bg-gray-200/50 p-1 rounded-xl w-full sm:w-auto">
              {(['WIB', 'WITA', 'WIT'] as const).map(tz => (
                <button
                  key={tz}
                  type="button"
                  onClick={() => setTimeZone(tz)}
                  className={`flex-1 sm:flex-initial px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${
                    timeZone === tz 
                      ? 'bg-blue-900 text-white shadow-3xs' 
                      : 'bg-transparent text-gray-500 hover:text-slate-800'
                  }`}
                >
                  {tz} {tz === 'WIB' ? '(WIB)' : tz === 'WITA' ? '(WITA)' : '(WIT)'}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Date Counter pill */}
          {dateBreakdown.nights > 0 && (
            <div className="bg-blue-50/50 border border-blue-100 p-2.5 rounded-xl flex items-center justify-between text-xs font-bold text-blue-950">
              <span>Durasi Sewa:</span>
              <div className="flex gap-2">
                <span className="bg-white shadow-3xs px-2 py-0.5 rounded-md border border-gray-100 text-[10px] text-blue-900">
                  {dateBreakdown.weekdays}x Hari Kerja (Wd)
                </span>
                <span className="bg-white shadow-3xs px-2 py-0.5 rounded-md border border-gray-100 text-[10px] text-amber-600">
                  {dateBreakdown.weekends}x Akhir Pekan (We)
                </span>
                <span className="bg-blue-900 text-white px-2.5 py-0.5 rounded-md text-[10px] font-black">
                  Total {dateBreakdown.nights} Malam
                </span>
              </div>
            </div>
          )}

          {/* Customer Lookup and Wizard */}
          <div className="border-t border-gray-100 pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-gray-550 uppercase tracking-widest flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-900" />
                Daftar Tamu / Pelanggan *
              </label>
              <button
                type="button"
                onClick={() => setIsQuickAddCustomerOpen(!isQuickAddCustomerOpen)}
                className="cursor-pointer text-[10px] font-black text-blue-900 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100"
              >
                <UserPlus className="w-3 h-3" />
                {isQuickAddCustomerOpen ? 'Sembunyikan' : '+ Tamu Baru'}
              </button>
            </div>

            {/* Quick add customer form container */}
            {isQuickAddCustomerOpen && (
              <form onSubmit={handleQuickAddCustomerSubmit} className="bg-slate-50 border border-gray-200 p-4 rounded-xl space-y-3 animate-scale-up">
                <span className="block text-[9px] font-black text-slate-500 uppercase tracking-wider">Registrasi Tamu Baru Cepat</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Nama Tamu Lengkap"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    className="text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg focus:border-blue-900 outline-none font-bold"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="No. WhatsApp (mis. 0812xxx)"
                    value={newCustomerWhatsApp}
                    onChange={(e) => setNewCustomerWhatsApp(e.target.value)}
                    className="text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg focus:border-blue-900 outline-none font-bold font-mono"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Catatan Singkat (Alamat, KTP, dsb) - Opsional"
                  value={newCustomerNotes}
                  onChange={(e) => setNewCustomerNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg focus:border-blue-900 outline-none font-medium"
                />
                <div className="flex justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setIsQuickAddCustomerOpen(false)}
                    className="px-3 py-1.5 border border-gray-205 rounded-lg font-bold hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-900 hover:bg-blue-850 text-white rounded-lg font-bold shadow-3xs"
                  >
                    Simpan & Pilih Tamu
                  </button>
                </div>
              </form>
            )}

            {!isQuickAddCustomerOpen && (
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-bold text-gray-800 outline-none focus:border-blue-900 focus:bg-white"
              >
                <option value="">-- PILIH TAMU TERDAFTAR --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    👤 {c.name} ({c.whatsappNumber})
                  </option>
                ))}
              </select>
            )}

            {currentCustomer && (
              <div className="bg-emerald-50/50 border border-emerald-100 p-2.5 rounded-lg flex items-center justify-between text-[11px] font-bold text-slate-800 animate-fade-in">
                <span>Tamu Terpilih: <strong className="text-emerald-950 font-black">{currentCustomer.name}</strong></span>
                <span className="text-gray-450 font-mono font-bold">{currentCustomer.whatsappNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: Interactive Tabs & Room Grid checkout */}
        <div className="bg-white rounded-2xl border border-gray-150 shadow-3xs overflow-hidden">
          
          {/* Tabs heading header */}
          <div className="flex items-center justify-between bg-slate-50 border-b border-gray-100 p-3 sm:px-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab2('rooms')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-colors ${
                  activeTab === 'rooms' ? 'bg-blue-900 text-white' : 'bg-transparent text-gray-400 hover:text-gray-700'
                }`}
              >
                1. Pilih Unit Kamar
              </button>
              <button
                type="button"
                onClick={() => setActiveTab2('addons')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-colors ${
                  activeTab === 'addons' ? 'bg-blue-900 text-white' : 'bg-transparent text-gray-400 hover:text-gray-700'
                }`}
              >
                2. Sedia Fasilitas Ekstra
              </button>
            </div>

            {/* Quick search input */}
            {activeTab === 'rooms' && (
              <div className="relative w-[180px] sm:w-[240px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari kamar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-[11px] pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg bg-white outline-none focus:border-blue-900 font-bold placeholder:text-gray-450"
                />
              </div>
            )}
          </div>

          <div className="p-4 sm:p-5">
            {activeTab === 'rooms' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredRooms.map(room => {
                  const isSelected = selectedRoomId === room.id;
                  const isOccupiedOnDates = isRoomOccupied(room.id);
                  
                  return (
                    <div
                      key={room.id}
                      onClick={() => {
                        if (!isOccupiedOnDates) setSelectedRoomId(room.id);
                      }}
                      className={`group relative rounded-xl border p-4 transition-all flex flex-col justify-between cursor-pointer shadow-3xs ${
                        isSelected 
                          ? 'border-blue-900 bg-blue-50/25 ring-2 ring-blue-900/10'
                          : isOccupiedOnDates
                            ? 'border-red-151 bg-red-50/20 opacity-70 cursor-not-allowed'
                            : 'border-slate-150 hover:border-blue-300 bg-white'
                      }`}
                    >
                      {/* Selection indicators */}
                      {isSelected && (
                        <span className="absolute right-3 top-3 bg-blue-900 text-white p-1 rounded-full animate-bounce">
                          <Check className="w-3.5 h-3.5 font-bold" />
                        </span>
                      )}

                      {/* Room identity */}
                      <div className="space-y-1">
                        <span className="block text-xs font-black text-slate-900 leading-tight group-hover:text-blue-950 transition-colors">
                          {room.name}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-gray-400 font-bold font-mono tracking-widest uppercase">{room.id}</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-[9px] text-gray-500 font-bold">Kapasitas: {room.capacity} Dewasa</span>
                        </div>
                      </div>

                      {/* Display descriptions */}
                      <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed mt-2.5 mb-3 font-semibold">
                        {room.description || 'Kamar nyaman premium, sangat direkomendasikan.'}
                      </p>

                      {/* Cost metrics */}
                      <div className="border-t border-slate-100 pt-2.5 mt-auto flex items-center justify-between">
                        <div>
                          <span className="block text-[8px] text-gray-400 font-black tracking-widest uppercase">TARIF SEWA</span>
                          <div className="flex gap-2">
                            <span className="text-[10px] font-bold text-slate-700">
                              Wd: <strong className="font-mono text-blue-900">Rp {(room.rateWeekday ?? room.ratePerNight).toLocaleString('id-ID')}</strong>
                            </span>
                            <span className="text-[10px] font-bold text-slate-700">
                              We: <strong className="font-mono text-amber-600">Rp {(room.rateWeekend ?? room.ratePerNight).toLocaleString('id-ID')}</strong>
                            </span>
                          </div>
                        </div>

                        {/* Availability Pill */}
                        {isOccupiedOnDates ? (
                          <span className="text-[8px] font-black bg-red-100 text-red-800 px-2.5 py-1 rounded-full border border-red-200">
                            FULL BOOKED
                          </span>
                        ) : isSelected ? (
                          <span className="text-[8px] font-black bg-blue-900 text-white px-2.5 py-1 rounded-full shadow-3xs flex items-center gap-1">
                            TERPILIH
                          </span>
                        ) : (
                          <span className="text-[8px] font-black bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200 group-hover:bg-blue-50 group-hover:text-blue-900 group-hover:border-blue-250 transition-colors">
                            READY UNIT
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {filteredRooms.length === 0 && (
                  <div className="col-span-2 text-center py-8 text-gray-400 italic text-xs font-semibold">
                    Kamar yang Anda cari tidak ditemukan.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'addons' && (
              <div className="space-y-3">
                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Pilih Tambahan Layanan Tamu</span>
                <div className="divide-y divide-gray-100">
                  {addons.map((add, idx) => (
                    <div key={add.id} className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <span className="block text-xs font-black text-slate-800 leading-tight">{add.name}</span>
                        <span className="block text-[10px] font-mono text-blue-900 font-bold">
                          Rp {add.price.toLocaleString('id-ID')} / pack sewa
                        </span>
                      </div>

                      {/* Quantity Controller */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const copy = [...addons];
                            if (copy[idx].qty > 0) {
                              copy[idx].qty -= 1;
                              setAddons(copy);
                            }
                          }}
                          className="cursor-pointer w-7 h-7 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center font-bold text-gray-700 hover:text-black transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-mono font-black text-slate-900">
                          {add.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const copy = [...addons];
                            copy[idx].qty += 1;
                            setAddons(copy);
                          }}
                          className="cursor-pointer w-7 h-7 bg-blue-900 hover:bg-blue-800 text-white rounded-lg flex items-center justify-center font-bold transition-colors animate-pulse"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* RIGHT COLUMN: CASHIER REGISTER CART (4 columns) */}
      <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-gray-150 shadow-md p-5 space-y-5 flex flex-col relative overflow-hidden">
        
        {/* Visual receipt layout header */}
        <div className="border-b border-dashed border-gray-200 pb-4 space-y-1">
          <div className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-wider">
            <Receipt className="w-4 h-4 text-blue-900" />
            <span>Kertas Kasir Billing</span>
          </div>
          <span className="block text-[9px] text-gray-400 font-bold font-mono">Invoice POS Automatic Ledger</span>
        </div>

        {/* Cart items list summary */}
        <div className="space-y-3.5 text-xs">
          
          {selectedRoom ? (
            <div className="space-y-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
              <div className="flex justify-between items-start">
                <div className="min-w-0">
                  <span className="block font-black text-slate-900 truncate leading-tight">{selectedRoom.name}</span>
                  <span className="text-[9px] text-gray-400 font-bold font-mono leading-none">{selectedRoom.id} (Capacity: {selectedRoom.capacity})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRoomId('')}
                  className="cursor-pointer text-gray-400 hover:text-rose-600 transition-colors"
                  title="Hapus Kamar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Room stay details breakdown */}
              <div className="space-y-1 pt-1.5 border-t border-slate-100/50 text-[10px] text-gray-600">
                {dateBreakdown.weekdays > 0 && (
                  <div className="flex justify-between">
                    <span>{dateBreakdown.weekdays}x Hari Kerja (Weekday)</span>
                    <span className="font-mono text-zinc-700">Rp {roomCostBreakdown.wdTotal.toLocaleString('id-ID')}</span>
                  </div>
                )}
                {dateBreakdown.weekends > 0 && (
                  <div className="flex justify-between">
                    <span>{dateBreakdown.weekends}x Akhir Pekan (Weekend)</span>
                    <span className="font-mono text-amber-600 font-bold">Rp {roomCostBreakdown.weTotal.toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-gray-250 text-gray-400 italic font-semibold text-[11px]">
              Belum ada kamar terpilih. Ketuk kamar pada koleksi grid kartu.
            </div>
          )}

          {/* Addons selected summary */}
          {addons.some(a => a.qty > 0) && (
            <div className="space-y-2 bg-slate-50/40 p-3 rounded-xl border border-slate-100">
              <span className="block text-[8px] font-black text-gray-400 uppercase tracking-wider">Tambahan Ekstra</span>
              <div className="space-y-1 text-[10px] text-gray-600">
                {addons.filter(a => a.qty > 0).map(item => (
                  <div key={item.id} className="flex justify-between">
                    <span>{item.name} (x{item.qty})</span>
                    <span className="font-mono">Rp {(item.price * item.qty).toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Pricing modifiers & inputs (Discount) */}
        <div className="border-t border-gray-100 pt-3.5 space-y-3">
          
          {/* Discount Field */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-550 uppercase tracking-widest block flex items-center justify-between">
              <span>Potongan Harga / Diskon (Rp)</span>
              <span className="text-[9px] text-blue-900 font-bold hover:underline cursor-pointer" onClick={() => setDiscountAmount(50000)}>Set Rp 50.000</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-black text-gray-400">Rp</span>
              <input
                type="number"
                min={0}
                max={roomCostBreakdown.baseTotal + addonsTotal}
                value={discountAmount || ''}
                onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                placeholder="Contoh: 100000"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-gray-200 rounded-xl outline-none focus:border-blue-900 focus:bg-white font-mono font-bold"
              />
            </div>
          </div>

          {/* Calculation Recap panel */}
          <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2 border border-slate-800 shadow-inner">
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold">
              <span>Dasar Sewa Kamar:</span>
              <span className="font-mono">Rp {roomCostBreakdown.baseTotal.toLocaleString('id-ID')}</span>
            </div>
            {addonsTotal > 0 && (
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold">
                <span>Extra & Addons:</span>
                <span className="font-mono">Rp {addonsTotal.toLocaleString('id-ID')}</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-[10px] text-rose-400 font-semibold">
                <span>Diskon Langsung:</span>
                <span className="font-mono">- Rp {discountAmount.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="h-px bg-slate-800 my-1"></div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-blue-300 uppercase tracking-wider">Grand Total Billing</span>
              <span className="text-lg font-mono font-black text-emerald-400">
                Rp {grandTotal.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

        </div>

        {/* Payment and Checkout counters */}
        <div className="border-t border-gray-100 pt-3.5 space-y-4">
          
          {/* Payment Method selector */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-550 uppercase tracking-widest block">Metode Bayar</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full text-xs px-2.5 py-2 border border-gray-200 bg-slate-50 rounded-xl font-bold font-mono outline-none focus:border-blue-900"
              >
                <option value="Tunai">💰 Tunai / Cash</option>
                <option value="BCA Transfer">🏦 BCA Transfer</option>
                <option value="Mandiri Transfer">🏦 Mandiri</option>
                <option value="QRIS Digital">📱 QRIS Instan</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-550 uppercase tracking-widest block">Status Booking</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className="w-full text-xs px-2.5 py-2 border border-gray-200 bg-slate-50 rounded-xl font-bold outline-none focus:border-blue-900"
              >
                <option value="Lunas">🟢 Lunas</option>
                <option value="DP">🟡 Uang Muka (DP)</option>
                <option value="Belum Bayar">🔴 Belum Bayar</option>
              </select>
            </div>
          </div>

          {/* Amount Paid input if DP */}
          {paymentStatus === 'DP' && (
            <div className="space-y-1.5 animate-scale-up">
              <label className="text-[10px] font-black text-gray-550 uppercase tracking-widest block">Uang Muka dibayarkan (Rp)</label>
              <input
                type="number"
                min={1}
                max={grandTotal}
                value={amountPaid || ''}
                onChange={(e) => setAmountPaid(Number(e.target.value) || 0)}
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl font-mono font-bold focus:border-blue-900"
              />
            </div>
          )}

          {/* Cash Change Calculator (Only relevant for cash payment "Tunai") */}
          {paymentMethod === 'Tunai' && paymentStatus !== 'Belum Bayar' && (
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/60 space-y-2 animate-fade-in">
              <div className="flex justify-between items-center text-[10px] font-black text-blue-950 uppercase tracking-wider">
                <span>Mesin Uang Cash (Kembalian)</span>
                <span className="text-blue-900">Rp {amountPaid.toLocaleString('id-ID')}</span>
              </div>
              
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">Cash</span>
                <input
                  type="number"
                  placeholder="Jumlah uang diterima..."
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="w-full text-xs pl-11 pr-3 py-1.5 border border-gray-200 rounded-lg outline-none bg-white font-mono font-black"
                />
              </div>

              {/* Cash shortcut buttons */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {getCashSuggestions().map((sug, sIdx) => (
                  <button
                    key={sIdx}
                    type="button"
                    onClick={() => setCashReceived(String(sug))}
                    className="cursor-pointer text-[9px] font-bold bg-white hover:bg-slate-100 border border-gray-200 px-1.5 py-0.5 rounded transition-colors font-mono"
                  >
                    Rp {sug.toLocaleString('id-ID')}
                  </button>
                ))}
              </div>

              {/* Excess cash refund change visual */}
              {changeAmount > 0 && (
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 border-t border-blue-150 pt-2 animate-scale-up">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Uang Kembali Tamu:</span>
                  <span className="font-mono text-emerald-700 font-black text-sm">
                    Rp {changeAmount.toLocaleString('id-ID')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Custom notes input */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-550 uppercase tracking-widest block">Catatan Opsional POS</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Titip kunci gerbang, sarapan jam 7 pagi"
              className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl outline-none focus:border-blue-900"
            />
          </div>

          {/* Action trigger button */}
          <button
            type="button"
            id="btn-pos-complete-booking"
            onClick={handleCheckout}
            disabled={!selectedRoomId || !selectedCustomerId}
            className={`cursor-pointer w-full py-3.5 px-4 rounded-xl text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all ${
              selectedRoomId && selectedCustomerId
                ? 'bg-gradient-to-r from-blue-900 to-indigo-950 hover:shadow-lg active:scale-98'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Selesaikan & Simpan Transaksi</span>
          </button>

          <p className="text-[9.5px] text-gray-400 text-center font-medium leading-relaxed">
            Menyelesaikan transaksi akan otomatis menambah kuitansi pembayaran tamu yang dapat diprint.
          </p>

        </div>

      </div>

    </div>
  );
}
