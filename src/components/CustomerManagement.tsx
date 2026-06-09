/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Customer, Booking, RoomType } from '../types';
import { Search, Plus, Phone, Mail, MapPin, User, History, DollarSign, Trash2, Edit3, UserCheck, X, FileText } from 'lucide-react';

interface CustomerManagementProps {
  bookings: Booking[];
  roomTypes: RoomType[];
  customers: Customer[];
  onSaveCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
}

export default function CustomerManagement({
  bookings,
  roomTypes,
  customers,
  onSaveCustomer,
  onDeleteCustomer
}: CustomerManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<Partial<Customer> | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Derive static list of unique bookings customers to supplement manual customers
  const inferredCustomers = useMemo(() => {
    const clients: Record<string, Customer> = {};
    
    // Scan all bookings to find guests
    bookings.forEach(b => {
      const key = b.whatsappNumber.trim() || b.guestName.trim().toLowerCase();
      if (!clients[key]) {
        clients[key] = {
          id: `inf-${b.id}`,
          name: b.guestName,
          whatsappNumber: b.whatsappNumber,
          notes: 'Pelanggan terdaftar otomatis melalui riwayat Reservasi.',
          createdAt: b.createdAt || new Date().toISOString()
        };
      }
    });

    return Object.values(clients);
  }, [bookings]);

  // Merge manual customer list and inferred customer list (manual overrides inferred)
  const allCustomers = useMemo(() => {
    const map = new Map<string, Customer>();
    
    // Add inferred first
    inferredCustomers.forEach(c => {
      map.set(c.whatsappNumber.trim(), c);
    });
    
    // Add manual (overriding)
    customers.forEach(c => {
      map.set(c.whatsappNumber.trim(), c);
    });

    return Array.from(map.values());
  }, [inferredCustomers, customers]);

  // Statistics for selected customer or search filters
  const filteredCustomers = useMemo(() => {
    return allCustomers.filter(c => {
      const search = searchTerm.toLowerCase();
      return (
        c.name.toLowerCase().includes(search) ||
        c.whatsappNumber.includes(search) ||
        (c.email && c.email.toLowerCase().includes(search)) ||
        (c.address && c.address.toLowerCase().includes(search))
      );
    });
  }, [allCustomers, searchTerm]);

  // Calculate statistics per customer helper
  const getCustomerStats = (whatsapp: string) => {
    const clientBookings = bookings.filter(
      b => b.whatsappNumber.trim() === whatsapp.trim()
    );
    
    const totalSpent = clientBookings.reduce((sum, b) => {
      // Only count amount actually paid or total price if fully completed
      return sum + (b.amountPaid || 0);
    }, 0);

    const totalReservedPrice = clientBookings.reduce((sum, b) => sum + b.totalPrice, 0);

    return {
      totalBookings: clientBookings.length,
      totalSpent,
      totalReservedPrice,
      history: clientBookings.sort((a, b) => b.checkInDate.localeCompare(a.checkInDate))
    };
  };

  const currentSelectedCustomer = useMemo(() => {
    if (!selectedCustomerId && filteredCustomers.length > 0) {
      return filteredCustomers[0];
    }
    return filteredCustomers.find(c => c.id === selectedCustomerId) || filteredCustomers[0] || null;
  }, [filteredCustomers, selectedCustomerId]);

  const selectedStats = useMemo(() => {
    if (!currentSelectedCustomer) return null;
    return getCustomerStats(currentSelectedCustomer.whatsappNumber);
  }, [currentSelectedCustomer, bookings]);

  // Handle save form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer?.name || !editingCustomer?.whatsappNumber) {
      alert('Nama pelanggan dan nomor WhatsApp wajib diisi.');
      return;
    }

    const newCustomer: Customer = {
      id: editingCustomer.id || `c-${Date.now()}`,
      name: editingCustomer.name.trim(),
      whatsappNumber: editingCustomer.whatsappNumber.trim(),
      email: editingCustomer.email?.trim() || '',
      address: editingCustomer.address?.trim() || '',
      notes: editingCustomer.notes?.trim() || '',
      createdAt: editingCustomer.createdAt || new Date().toISOString()
    };

    onSaveCustomer(newCustomer);
    setSelectedCustomerId(newCustomer.id);
    setIsFormOpen(false);
    setEditingCustomer(null);
  };

  const handleOpenAdd = () => {
    setEditingCustomer({
      name: '',
      whatsappNumber: '',
      email: '',
      address: '',
      notes: ''
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCustomer(customer);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Yakin ingin menghapus data pelanggan ini dari daftar manual? (Data transaksi tidak akan hilang, nama akan tetap terbaca dari riwayat booking)')) {
      onDeleteCustomer(id);
      if (selectedCustomerId === id) {
        setSelectedCustomerId(null);
      }
    }
  };

  return (
    <div id="customer-mgmt-view" className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
      
      {/* 1. Left side list: search & select pelanggan */}
      <div className="md:col-span-1 bg-white rounded-3xl border border-gray-150 p-5 flex flex-col h-[650px] shadow-sm">
        
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">Database Pelanggan</h2>
            <p className="text-[11px] text-gray-400">Total {allCustomers.length} pelanggan terdata</p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="cursor-pointer bg-blue-900 hover:bg-blue-850 text-white rounded-xl text-xs font-bold px-3 py-2 flex items-center gap-1.5 transition-all shadow-md shadow-blue-900/10"
          >
            <Plus className="w-4 h-4" />
            Baru
          </button>
        </div>

        {/* Search bar */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            placeholder="Cari nama, WA, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-8.5 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-xl focus:border-blue-900 focus:ring-1 focus:ring-blue-900/10 outline-none transition-all font-medium text-gray-800"
          />
        </div>

        {/* Customers list scroll area */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 h-full scrollbar-thin">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-10">
              <User className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400 font-semibold">Tidak ada pelanggan cocok</p>
              <p className="text-[10px] text-gray-300">Coba ubah kata kunci pencarian Anda</p>
            </div>
          ) : (
            filteredCustomers.map(c => {
              const stats = getCustomerStats(c.whatsappNumber);
              const isSelected = currentSelectedCustomer?.id === c.id;
              const isVIP = stats.totalBookings >= 3;

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCustomerId(c.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 relative ${
                    isSelected
                      ? 'bg-blue-50/75 border-blue-900 shadow-3xs'
                      : 'bg-white hover:bg-slate-50 border-gray-150'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8.5 h-8.5 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                      isSelected ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="block text-xs font-bold text-slate-900 truncate">{c.name}</span>
                        {isVIP && (
                          <span className="text-[8px] font-extrabold bg-amber-50 text-amber-700 px-1 py-0.5 rounded border border-amber-200 uppercase tracking-widest flex-shrink-0">
                            ★ VIP
                          </span>
                        )}
                      </div>
                      <span className="block text-[10px] text-gray-500 font-mono tracking-wider flex items-center gap-1 mt-0.5">
                        <Phone className="w-2.5 h-2.5 text-gray-400" />
                        {c.whatsappNumber}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-full font-bold">
                      {stats.totalBookings}x Booking
                    </span>
                    <span className="text-[10px] font-extrabold text-blue-900 font-mono">
                      Rp {stats.totalSpent.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* Manual tags action overlay, only show edit/actions if it is manual customer */}
                  {!c.id.startsWith('inf-') && (
                    <div className="absolute right-2 top-2 opacity-0 hover:opacity-100 focus-within:opacity-100 group-hover:opacity-100 flex gap-1">
                      {/* Note: since card hover action is tight, we can let user click detail buttons instead */}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Middle & Right sides combined: Detail profiling and statistics */}
      <div className="md:col-span-2 space-y-6">
        
        {currentSelectedCustomer ? (
          <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm min-h-[480px] flex flex-col justify-between">
            
            <div className="space-y-6">
              {/* Badge Profile header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-900 text-amber-400 rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl shadow-blue-950/10">
                    {currentSelectedCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-slate-900 leading-none">{currentSelectedCustomer.name}</h2>
                      {selectedStats && selectedStats.totalBookings >= 3 ? (
                        <span className="text-[9px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full tracking-wider uppercase">
                          VIP MEMBER
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full tracking-wider uppercase">
                          REGULAR
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 flex items-center gap-1 font-mono tracking-wide">
                      ID: {currentSelectedCustomer.id} • Registered:{' '}
                      {new Date(currentSelectedCustomer.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={(e) => handleOpenEdit(currentSelectedCustomer, e)}
                    className="cursor-pointer bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl text-xs font-bold px-3 py-2 flex items-center gap-1.5 transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-blue-900" />
                    Ubah data
                  </button>
                  {!currentSelectedCustomer.id.startsWith('inf-') && (
                    <button
                      onClick={(e) => handleDelete(currentSelectedCustomer.id, e)}
                      className="cursor-pointer bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold px-3 py-2 flex items-center gap-1.5 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      Hapus
                    </button>
                  )}
                </div>
              </div>

              {/* Direct Details grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Contact detail item */}
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-2">
                  <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">INFORMASI KONTAK</span>
                  <div className="space-y-1.5">
                    <p className="text-xs text-slate-800 font-bold flex items-center gap-1.5 font-mono">
                      <Phone className="w-3.5 h-3.5 text-blue-900 flex-shrink-0" />
                      {currentSelectedCustomer.whatsappNumber}
                    </p>
                    <p className="text-xs text-slate-700 font-semibold flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-blue-900 flex-shrink-0" />
                      {currentSelectedCustomer.email || <span className="text-gray-300 italic font-medium">Bukan email</span>}
                    </p>
                  </div>
                </div>

                {/* Location address item */}
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-2 col-span-1 md:col-span-2">
                  <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">DOMISILI & ALAMAT</span>
                  <p className="text-xs text-slate-700 font-medium flex items-start gap-1.5 leading-relaxed">
                    <MapPin className="w-3.5 h-3.5 text-blue-900 flex-shrink-0 mt-0.5" />
                    {currentSelectedCustomer.address || <span className="text-gray-300 italic">Alamat belum dicatat</span>}
                  </p>
                </div>
              </div>

              {/* Transaction overview widgets */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="bg-blue-900 text-white p-5 rounded-2xl shadow-sm space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-amber-400 tracking-wider">
                    <DollarSign className="w-4 h-4" />
                    TOTAL TRANSAKSI (LUNAS/DP)
                  </div>
                  <h3 className="text-2xl font-black font-mono">
                    Rp {selectedStats?.totalSpent.toLocaleString('id-ID')}
                  </h3>
                  <p className="text-[10px] text-blue-200">
                    Dari estimasi nominal pesanan Rp {selectedStats?.totalReservedPrice.toLocaleString('id-ID')}
                  </p>
                </div>

                <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    <History className="w-4 h-4" />
                    FREKUENSI KUNJUNGAN
                  </div>
                  <h3 className="text-2xl font-black font-mono">
                    {selectedStats?.totalBookings} Kali
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Jumlah booking terdaftar di sistem villa
                  </p>
                </div>
              </div>

              {/* Guest History timeline of stays */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-900" />
                  RIWAYAT STAY / RESERVASI ({selectedStats?.history.length || 0})
                </h3>

                <div className="border border-gray-150 rounded-2xl overflow-hidden divide-y divide-gray-100 max-h-[190px] overflow-y-auto scrollbar-thin">
                  {selectedStats?.history.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-400">
                      Belum memiliki riwayat reservasi.
                    </div>
                  ) : (
                    selectedStats?.history.map((b, bIdx) => {
                      const room = roomTypes.find(r => r.id === b.roomId);
                      const checkIn = new Date(b.checkInDate);
                      const checkOut = new Date(b.checkOutDate);
                      const nights = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
                      
                      return (
                        <div key={b.id} className="p-3 bg-white hover:bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-blue-900">{b.invoiceNumber}</span>
                              <span className="font-semibold text-slate-800">{room ? room.name : b.roomId}</span>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {b.checkInDate} s/d {b.checkOutDate} ({nights} malam)
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-slate-800">
                              Rp {b.totalPrice.toLocaleString('id-ID')}
                            </span>
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 border ${
                              b.paymentStatus === 'Lunas'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : b.paymentStatus === 'DP'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-red-50 text-red-800 border-red-200'
                            }`}>
                              {b.paymentStatus}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

            {currentSelectedCustomer.notes && (
              <div className="mt-4 p-3.5 bg-yellow-50/40 border border-yellow-250 rounded-2xl text-[11px] text-slate-600 flex items-start gap-2">
                <FileText className="w-4 h-4 text-amber-505 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="block font-bold text-slate-700 uppercase text-[9px] tracking-wider mb-0.5">CATATAN KHUSUS PELANGGAN</span>
                  <p className="font-medium">{currentSelectedCustomer.notes}</p>
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-150 p-6 text-center shadow-sm h-full flex flex-col items-center justify-center py-20">
            <User className="w-16 h-16 text-slate-205 mb-3" />
            <h2 className="text-base font-bold text-slate-800">Tidak ada pelanggan terpilih</h2>
            <p className="text-xs text-gray-400">Silakan tambahkan baru atau pilih dari database di sebelah kiri.</p>
          </div>
        )}
      </div>

      {/* 3. Modal Form: Add / Edit customer popup */}
      {isFormOpen && editingCustomer && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-2xs">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up">
            
            {/* Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-amber-400">
                  {editingCustomer.id ? 'EDIT DATA PELANGGAN' : 'REKRAM PELANGGAN BARU'}
                </h3>
                <p className="text-[11px] text-slate-400">Formulir pendaftaran pelanggan internal villa</p>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                onClick={() => setIsFormOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Guest Name */}
                <div className="space-y-1.5">
                  <label htmlFor="form-cust-name" className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    Nama Lengkap Pelanggan *
                  </label>
                  <input
                    id="form-cust-name"
                    type="text"
                    required
                    value={editingCustomer.name || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                    placeholder="Contoh: Aris Setiawan"
                    className="w-full text-xs px-3.5 py-3 border border-gray-200 outline-none rounded-xl focus:border-blue-900 focus:ring-1 focus:ring-blue-900/10 bg-slate-50/50 text-gray-800 font-semibold"
                  />
                </div>

                {/* WhatsApp Number */}
                <div className="space-y-1.5">
                  <label htmlFor="form-cust-wa" className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    No. WhatsApp *
                  </label>
                  <input
                    id="form-cust-wa"
                    type="text"
                    required
                    value={editingCustomer.whatsappNumber || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, whatsappNumber: e.target.value })}
                    placeholder="Contoh: 081234567890"
                    className="w-full text-xs px-3.5 py-3 border border-gray-200 outline-none rounded-xl focus:border-blue-900 focus:ring-1 focus:ring-blue-900/10 bg-slate-50/50 text-gray-800 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="form-cust-email" className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  Alamat Email (Opsional)
                </label>
                <input
                  id="form-cust-email"
                  type="email"
                  value={editingCustomer.email || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                  placeholder="Contoh: aris@mail.com"
                  className="w-full text-xs px-3.5 py-3 border border-gray-200 outline-none rounded-xl focus:border-blue-900 focus:ring-1 focus:ring-blue-900/10 bg-slate-50/50 text-gray-800 font-medium"
                />
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label htmlFor="form-cust-address" className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  Alamat Rumah / Domisili
                </label>
                <textarea
                  id="form-cust-address"
                  rows={2}
                  value={editingCustomer.address || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                  placeholder="Contoh: Jl. Semeru No. 12, Kepanjen, Malang"
                  className="w-full text-xs px-3.5 py-2.5 border border-gray-200 outline-none rounded-xl focus:border-blue-900 focus:ring-1 focus:ring-blue-900/10 bg-slate-50/50 text-gray-800 font-medium resize-none"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label htmlFor="form-cust-notes" className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  Catatan Tambahan Pelanggan
                </label>
                <textarea
                  id="form-cust-notes"
                  rows={2}
                  value={editingCustomer.notes || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, notes: e.target.value })}
                  placeholder="Contoh: Alergi makanan laut, suka view kamar hadap timur"
                  className="w-full text-xs px-3.5 py-2.5 border border-gray-200 outline-none rounded-xl focus:border-blue-900 focus:ring-1 focus:ring-blue-900/10 bg-slate-50/50 text-gray-800 font-medium resize-none"
                />
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="cursor-pointer text-xs font-bold text-gray-500 bg-gray-100 px-4 py-2.5 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="cursor-pointer text-xs font-bold text-white bg-blue-900 px-5 py-2.5 rounded-xl hover:bg-blue-850 transition-colors shadow-md shadow-blue-900/10"
                >
                  Simpan Pelanggan
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
