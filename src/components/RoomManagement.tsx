/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { RoomType, Booking } from '../types';
import { 
  Search, Plus, Home, Tag, Users, FileText, Trash2, Edit3, X, Info, Coins, HelpCircle,
  Wifi, Tv, Wind, Bath, Coffee, Sun, Utensils, Waves, Key, Shield, Sparkles, Check, Trash
} from 'lucide-react';

const IconMap: { [key: string]: React.ComponentType<any> } = {
  Wifi: Wifi,
  Tv: Tv,
  Wind: Wind,
  Bath: Bath,
  Coffee: Coffee,
  Sun: Sun,
  Utensils: Utensils,
  Waves: Waves,
  Key: Key,
  Shield: Shield,
  Sparkles: Sparkles,
  Home: Home
};

export function FacilityIcon({ name, className = "w-4 h-4 text-blue-900" }: { name: string; className?: string }) {
  const IconComponent = IconMap[name] || HelpCircle;
  return <IconComponent className={className} />;
}

interface RoomManagementProps {
  roomTypes: RoomType[];
  bookings: Booking[];
  onSaveRoomType: (roomType: RoomType) => void;
  onDeleteRoomType: (id: string) => void;
}

export default function RoomManagement({
  roomTypes,
  bookings,
  onSaveRoomType,
  onDeleteRoomType
}: RoomManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRoom, setEditingRoom] = useState<Partial<RoomType> | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  // Filter list by search term
  const filteredRooms = useMemo(() => {
    return roomTypes.filter(room => {
      const search = searchTerm.toLowerCase();
      return (
        room.name.toLowerCase().includes(search) ||
        room.description.toLowerCase().includes(search) ||
        room.id.toLowerCase().includes(search)
      );
    });
  }, [roomTypes, searchTerm]);

  // General Statistics
  const stats = useMemo(() => {
    if (roomTypes.length === 0) {
      return { totalRooms: 0, avgRate: 0, maxCapacity: 0, highestRate: 0 };
    }
    const rates = roomTypes.map(r => r.rateWeekday || r.ratePerNight);
    const sumRate = rates.reduce((sum, rate) => sum + rate, 0);
    const maxCapacity = roomTypes.reduce((sum, r) => sum + r.capacity, 0);
    const highestRate = Math.max(...rates);

    return {
      totalRooms: roomTypes.length,
      avgRate: Math.round(sumRate / roomTypes.length),
      maxCapacity,
      highestRate
    };
  }, [roomTypes]);

  // Count active reservations for each room to provide delete guards or labels
  const getRoomReservationCount = (roomId: string) => {
    return bookings.filter(b => b.roomId === roomId).length;
  };

  const handleOpenAdd = () => {
    setEditingRoom({
      id: '',
      name: '',
      ratePerNight: 500000,
      rateWeekday: 500000,
      rateWeekend: 650000,
      capacity: 2,
      description: '',
      facilities: []
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (room: RoomType, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRoom({
      ...room,
      rateWeekday: room.rateWeekday !== undefined ? room.rateWeekday : room.ratePerNight,
      rateWeekend: room.rateWeekend !== undefined ? room.rateWeekend : room.ratePerNight,
      facilities: room.facilities || []
    });
    setIsFormOpen(true);
  };

  const handleDelete = (room: RoomType, e: React.MouseEvent) => {
    e.stopPropagation();
    const count = getRoomReservationCount(room.id);
    
    let warningMsg = `Apakah Anda yakin ingin menghapus Unit ${room.name}?`;
    if (count > 0) {
      warningMsg = `PERINGATAN: Unit '${room.name}' saat ini memiliki ${count} riwayat atau jadwal reservasi aktif!\n\nJika dihapus, relasi unit pada data reservasi tersebut akan kosong. Anda tetap ingin melanjutkan penghapusan?`;
    }

    if (window.confirm(warningMsg)) {
      onDeleteRoomType(room.id);
      if (selectedRoomId === room.id) {
        setSelectedRoomId(null);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom?.name) {
      alert('Nama Unit/Kamar wajib diisi.');
      return;
    }

    let rawId = editingRoom.id?.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!rawId) {
      // Auto generate ID based on name if blank
      rawId = editingRoom.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      if (rawId.startsWith('-')) rawId = rawId.substring(1);
      if (rawId.endsWith('-')) rawId = rawId.substring(0, rawId.length - 1);
      if (!rawId) rawId = `room-${Date.now()}`;
    }

    // Check duplicate ID for newly added rooms
    const isNew = !roomTypes.some(r => r.id === editingRoom.id);
    if (isNew && roomTypes.some(r => r.id === rawId)) {
      alert(`ID Unit ${rawId} sudah digunakan oleh kamar lain. Silakan ubah ID atau nama.`);
      return;
    }

    const weekdayPrice = Number(editingRoom.rateWeekday !== undefined ? editingRoom.rateWeekday : editingRoom.ratePerNight) || 500000;
    const weekendPrice = Number(editingRoom.rateWeekend !== undefined ? editingRoom.rateWeekend : editingRoom.ratePerNight) || 650000;

    const savedRoom: RoomType = {
      id: rawId,
      name: editingRoom.name.trim(),
      ratePerNight: weekdayPrice,
      rateWeekday: weekdayPrice,
      rateWeekend: weekendPrice,
      capacity: Number(editingRoom.capacity) || 1,
      description: editingRoom.description?.trim() || '',
      facilities: editingRoom.facilities || []
    };

    onSaveRoomType(savedRoom);
    setSelectedRoomId(savedRoom.id);
    setIsFormOpen(false);
    setEditingRoom(null);
  };

  const currentSelectedRoom = useMemo(() => {
    if (!selectedRoomId && filteredRooms.length > 0) {
      return filteredRooms[0];
    }
    return filteredRooms.find(r => r.id === selectedRoomId) || filteredRooms[0] || null;
  }, [filteredRooms, selectedRoomId]);

  const selectedRoomBookings = useMemo(() => {
    if (!currentSelectedRoom) return [];
    return bookings
      .filter(b => b.roomId === currentSelectedRoom.id)
      .sort((a, b) => b.checkInDate.localeCompare(a.checkInDate));
  }, [currentSelectedRoom, bookings]);

  return (
    <div id="room-mgmt-panel" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 1. SEBELAH KIRI: List & Search Kamar/Villa */}
      <div className="lg:col-span-1 bg-white rounded-3xl border border-gray-150 p-5 flex flex-col h-[650px] shadow-sm">
        
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">Daftar Kamar / Villa</h2>
            <p className="text-[11px] text-gray-400">Total {roomTypes.length} unit terdaftar</p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="cursor-pointer bg-blue-900 hover:bg-blue-850 text-white rounded-xl text-xs font-bold px-3 py-2 flex items-center gap-1.5 transition-all shadow-md shadow-blue-900/10"
          >
            <Plus className="w-4 h-4" />
            Tambah Unit
          </button>
        </div>

        {/* Search bar widget */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            placeholder="Cari tipe, nama, deskripsi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-8.5 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-xl focus:border-blue-900 focus:ring-1 focus:ring-blue-900/10 outline-none transition-all font-medium text-gray-800"
          />
        </div>

        {/* Room cards/list scroll container */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 h-full scrollbar-thin">
          {filteredRooms.length === 0 ? (
            <div className="text-center py-10">
              <Home className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400 font-semibold">Tidak ada tipe kamar cocok</p>
              <p className="text-[10px] text-gray-300">Buat unit baru melalui tombol Tambah</p>
            </div>
          ) : (
            filteredRooms.map(room => {
              const bookingCount = getRoomReservationCount(room.id);
              const isSelected = currentSelectedRoom?.id === room.id;

              return (
                <div
                  key={room.id}
                  onClick={() => setSelectedRoomId(room.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 relative ${
                    isSelected
                      ? 'bg-blue-50/75 border-blue-900 shadow-3xs'
                      : 'bg-white hover:bg-slate-50 border-gray-150'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 col-span-1">
                      <span className="block text-xs font-black text-slate-900 truncate leading-tight">{room.name}</span>
                      <span className="text-[9px] text-slate-450 font-mono uppercase tracking-widest leading-none">{room.id}</span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="block text-[10px] font-bold text-slate-700 leading-tight">
                        Wd: Rp {(room.rateWeekday ?? room.ratePerNight).toLocaleString('id-ID')}
                      </span>
                      <span className="block text-[9px] font-black text-amber-600 font-mono">
                        We: Rp {(room.rateWeekend ?? room.ratePerNight).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] text-gray-450 line-clamp-2 leading-relaxed">
                    {room.description || 'Tidak ada deskripsi rinci untuk unit kamar ini.'}
                  </p>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] text-gray-500 font-semibold">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      Kapasitas: {room.capacity} Orang
                    </span>
                    <span className={`px-2 py-0.5 rounded-full border text-[8px] font-bold uppercase tracking-wider ${
                      bookingCount > 0 ? 'bg-blue-50 text-blue-805 border-blue-150' : 'bg-slate-50 text-slate-500 border-slate-150'
                    }`}>
                      {bookingCount} Reservasi
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. SEBELAH TENAN & KANAN: Detail & Statistik Ringkasan */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Statistics widget grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-150 p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-900 rounded-xl">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest">UNIT TERSEDIA</span>
              <span className="block text-base font-black font-mono text-slate-800">{stats.totalRooms} Tipe</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-150 p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest">RATA-RATA TARIF</span>
              <span className="block text-sm font-black font-mono text-slate-800">Rp {stats.avgRate.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-150 p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest">TOT. MENAMPUNG</span>
              <span className="block text-base font-black font-mono text-slate-800">{stats.maxCapacity} Orang</span>
            </div>
          </div>
        </div>

        {currentSelectedRoom ? (
          <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm min-h-[480px] flex flex-col justify-between">
            <div className="space-y-6">
              
              {/* Profile Card view */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-900 text-amber-400 rounded-2xl flex items-center justify-center font-black text-xl shadow-xl shadow-blue-950/10">
                    <Home className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-lg font-black text-slate-900 leading-none">{currentSelectedRoom.name}</h2>
                    <p className="text-xs text-gray-400 flex items-center gap-1 font-mono tracking-wide">
                      ID UNIT: {currentSelectedRoom.id} • Kapasitas {currentSelectedRoom.capacity} Tamu
                    </p>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <button
                    onClick={(e) => handleOpenEdit(currentSelectedRoom, e)}
                    className="cursor-pointer bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl text-xs font-bold px-3 py-2 flex items-center gap-1.5 transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-blue-900" />
                    Ubah Unit
                  </button>
                  <button
                    onClick={(e) => handleDelete(currentSelectedRoom, e)}
                    className="cursor-pointer bg-red-50 hover:bg-red-100 text-red-650 border border-red-200 rounded-xl text-xs font-bold px-3 py-2 flex items-center gap-1.5 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    Hapus Unit
                  </button>
                </div>
              </div>

              {/* Specification layout grids */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-1.5">
                  <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">TABEL TARIF SEWA</span>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                      <span>Harga Weekday:</span>
                      <span className="font-mono text-blue-900">Rp {(currentSelectedRoom.rateWeekday ?? currentSelectedRoom.ratePerNight).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                      <span>Harga Weekend:</span>
                      <span className="font-mono text-amber-600">Rp {(currentSelectedRoom.rateWeekend ?? currentSelectedRoom.ratePerNight).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                  <p className="text-[9.5px] text-gray-400">Kalkulator reservasi otomatis mendeteksi hari Check-in/out.</p>
                </div>

                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-1.5">
                  <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">UNIT OCCUPANCY & RESERVASI</span>
                  <p className="text-xl font-mono font-black text-slate-800">
                    {getRoomReservationCount(currentSelectedRoom.id)} Transaksi
                  </p>
                  <p className="text-[10px] text-gray-400">Frekuensi pemesanan unit ini yang terdaftar dalam database ledger.</p>
                </div>
              </div>

              {/* Description Card */}
              <div className="bg-slate-50/20 p-4 rounded-2xl border border-dashed border-gray-200 space-y-2">
                <span className="block text-[9px] font-black text-gray-450 uppercase tracking-widest flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-blue-900" />
                  DESKRIPSI UNIT
                </span>
                <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                  {currentSelectedRoom.description || 'Belum ada catatan deskripsi tertulis untuk unit ini.'}
                </p>
              </div>

              {/* Facilities Badge Container */}
              <div className="bg-slate-50/20 p-4 rounded-2xl border border-dashed border-gray-200 space-y-2.5">
                <span className="block text-[9px] font-black text-gray-450 uppercase tracking-widest flex items-center gap-1 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                  FASILITAS KELENGKAPAN UNIT
                </span>
                
                {(!currentSelectedRoom.facilities || currentSelectedRoom.facilities.length === 0) ? (
                  <p className="text-[10px] text-gray-400 italic">Belum ada fasilitas terpasang pada kamar ini. Klik 'Ubah Unit' untuk menambahkan.</p>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {currentSelectedRoom.facilities.map((fac, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 bg-blue-50/40 border border-blue-100 text-blue-950 px-3 py-1.5 rounded-xl text-[11px] font-bold shadow-3xs hover:scale-[1.02] transition-transform">
                        <FacilityIcon name={fac.icon} className="w-3.5 h-3.5 text-blue-800" />
                        <span>{fac.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sub list: stays for this room */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-900" />
                  DAFTAR RESERVASI DI UNIT INI ({selectedRoomBookings.length})
                </h3>

                <div className="border border-gray-150 rounded-2xl overflow-hidden divide-y divide-gray-100 max-h-[190px] overflow-y-auto scrollbar-thin">
                  {selectedRoomBookings.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-400 italic">
                      Belum ada riwayat booking terdaftar pada unit ini.
                    </div>
                  ) : (
                    selectedRoomBookings.map((b) => {
                      const checkIn = new Date(b.checkInDate);
                      const checkOut = new Date(b.checkOutDate);
                      const nights = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));

                      return (
                        <div key={b.id} className="p-3 bg-white hover:bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-blue-900">{b.invoiceNumber}</span>
                              <span className="font-bold text-slate-800">{b.guestName}</span>
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
                                : 'bg-red-50 text-red-008 border-red-200'
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

            <div className="mt-4 p-3 bg-blue-50/50 rounded-2xl border border-blue-100/65 flex gap-2.5 text-blue-905 text-[10px] leading-relaxed">
              <Info className="w-4.5 h-4.5 text-blue-900 shrink-0 mt-0.5" />
              <div>
                Rincian unit kamar, villa & tipe akomodasi di atas tersimpan dalam database internal browser Anda. Diperbarui otomatis di kalender ketersediaan serta form pemesanan secara langsung.
              </div>
            </div>

          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-150 p-6 text-center shadow-sm h-full flex flex-col items-center justify-center py-20">
            <Home className="w-16 h-16 text-slate-200 mb-3" />
            <h2 className="text-base font-bold text-slate-800">Tidak ada unit terpilih</h2>
            <p className="text-xs text-gray-400">Silakan tambahkan baru atau pilih tipe kamar dari daftar kiri.</p>
          </div>
        )}
      </div>

      {/* 3. POPUP MODAL FORM: Add / Edit Room */}
      {isFormOpen && editingRoom && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-2xs">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up">
            
            {/* Modal Head */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-amber-400">
                  {editingRoom.id ? 'UBAH DATA UNIT / KAMAR' : 'TAMBAH UNIT / AKOMODASI BARU'}
                </h3>
                <p className="text-[11px] text-slate-400">Lengkapi statistik, kapasitas & tarif sewa per malam</p>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                onClick={() => setIsFormOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              <div className="space-y-1.5">
                <label htmlFor="form-room-name" className="block text-[10px] font-bold text-gray-550 uppercase tracking-widest">
                  Nama Unit / Kamar / Villa *
                </label>
                <input
                  id="form-room-name"
                  type="text"
                  required
                  value={editingRoom.name || ''}
                  onChange={(e) => setEditingRoom({ ...editingRoom, name: e.target.value })}
                  placeholder="Contoh: Dahlia Suite / Villa Anggrek"
                  className="w-full text-xs px-3.5 py-3 border border-gray-200 outline-none rounded-xl focus:border-blue-900 focus:ring-1 focus:ring-blue-900/10 bg-slate-50/50 text-gray-800 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* ID Kamar (Slug Key) */}
                <div className="space-y-1.5">
                  <label htmlFor="form-room-id" className="block text-[10px] font-bold text-gray-550 uppercase tracking-widest flex items-center gap-1">
                    Kode ID Unit *
                    <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-help" title="Digunakan sebagai referensi database, tidak boleh ganda (huruf kecil & angka tanpa spasi)" />
                  </label>
                  <input
                    id="form-room-id"
                    type="text"
                    required
                    disabled={!!editingRoom.id} // Lock on editing, free on creating
                    value={editingRoom.id || ''}
                    onChange={(e) => setEditingRoom({ ...editingRoom, id: e.target.value })}
                    placeholder="Contoh: dahlia-suite (Otomatis)"
                    className={`w-full text-xs px-3.5 py-3 border border-gray-200 outline-none rounded-xl focus:border-blue-900 focus:ring-1 focus:ring-blue-900/10 bg-slate-50/50 text-gray-800 font-mono font-bold ${
                      editingRoom.id ? 'opacity-65 cursor-not-allowed bg-slate-100' : ''
                    }`}
                  />
                </div>

                {/* Capacity */}
                <div className="space-y-1.5">
                  <label htmlFor="form-room-capacity" className="block text-[10px] font-bold text-gray-550 uppercase tracking-widest">
                    Kapasitas Tamu Maksimal *
                  </label>
                  <input
                    id="form-room-capacity"
                    type="number"
                    required
                    min={1}
                    value={editingRoom.capacity || 2}
                    onChange={(e) => setEditingRoom({ ...editingRoom, capacity: Number(e.target.value) })}
                    placeholder="Contoh: 2"
                    className="w-full text-xs px-3.5 py-3 border border-gray-200 outline-none rounded-xl focus:border-blue-900 focus:ring-1 focus:ring-blue-900/10 bg-slate-50/50 text-gray-805 font-bold"
                  />
                </div>
              </div>

              {/* Dual Rates pricing structure */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="form-room-rate-weekday" className="block text-[10px] font-bold text-gray-550 uppercase tracking-widest">
                    Tarif Weekday (Senin - Jumat) *
                  </label>
                  <input
                    id="form-room-rate-weekday"
                    type="number"
                    required
                    min={0}
                    value={editingRoom.rateWeekday !== undefined ? editingRoom.rateWeekday : (editingRoom.ratePerNight || 0)}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEditingRoom({ 
                        ...editingRoom, 
                        rateWeekday: val,
                        ratePerNight: val // Keep fallback in sync
                      });
                    }}
                    placeholder="Contoh: 700000"
                    className="w-full text-xs px-3.5 py-3 border border-gray-200 outline-none rounded-xl focus:border-blue-900 focus:ring-1 focus:ring-blue-900/10 bg-slate-50/50 text-gray-850 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="form-room-rate-weekend" className="block text-[10px] font-bold text-gray-550 uppercase tracking-widest">
                    Tarif Weekend (Sabtu - Minggu) *
                  </label>
                  <input
                    id="form-room-rate-weekend"
                    type="number"
                    required
                    min={0}
                    value={editingRoom.rateWeekend !== undefined ? editingRoom.rateWeekend : (editingRoom.ratePerNight || 0)}
                    onChange={(e) => setEditingRoom({ ...editingRoom, rateWeekend: Number(e.target.value) })}
                    placeholder="Contoh: 850000"
                    className="w-full text-xs px-3.5 py-3 border border-gray-200 outline-none rounded-xl focus:border-blue-900 focus:ring-1 focus:ring-blue-900/10 bg-slate-50/50 text-gray-850 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label htmlFor="form-room-desc" className="block text-[10px] font-bold text-gray-550 uppercase tracking-widest">
                  Deskripsi Kamar *
                </label>
                <textarea
                  id="form-room-desc"
                  rows={2}
                  required
                  value={editingRoom.description || ''}
                  onChange={(e) => setEditingRoom({ ...editingRoom, description: e.target.value })}
                  placeholder="Deskripsikan pemandangan kamar, ukuran ranjang, ketetapan kamar mandi, gazebo luar, dsb..."
                  className="w-full text-xs px-3.5 py-2.5 border border-gray-200 outline-none rounded-xl focus:border-blue-900 focus:ring-1 focus:ring-blue-900/10 bg-slate-50/50 text-gray-800 font-medium resize-none leading-relaxed"
                />
              </div>

              {/* Fasilitas Kamar / Unit */}
              <div className="space-y-3 pt-1 border-t border-gray-100">
                <label className="block text-[10px] font-bold text-gray-550 uppercase tracking-widest flex items-center justify-between">
                  <span>Fasilitas Unit ({editingRoom.facilities?.length || 0})</span>
                  <span className="text-[8px] text-gray-400 capitalize">Pilih Preset / Buat Kustom</span>
                </label>
                
                {/* Visual List wrapper of selected facilities */}
                <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto p-2 bg-slate-50 border border-gray-200 rounded-xl">
                  {(!editingRoom.facilities || editingRoom.facilities.length === 0) ? (
                    <span className="text-[10px] text-gray-400 font-semibold italic p-1">Belum ada fasilitas ditambahkan. Ketuk rekomendasi di bawah.</span>
                  ) : (
                    editingRoom.facilities.map((fac, idx) => (
                      <div key={idx} className="flex items-center gap-1 bg-blue-50 text-blue-950 px-2 py-0.5 rounded-lg border border-blue-200 text-[10px] font-bold shadow-3xs">
                        <FacilityIcon name={fac.icon} className="w-3 h-3 text-blue-800" />
                        <span>{fac.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (editingRoom.facilities || []).filter((_, i) => i !== idx);
                            setEditingRoom({ ...editingRoom, facilities: updated });
                          }}
                          className="cursor-pointer text-red-500 hover:text-red-700 ml-1 font-bold focus:outline-none"
                        >
                          &times;
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Quick Add Presets Row */}
                <div className="space-y-1">
                  <span className="block text-[8px] text-slate-400 font-black uppercase tracking-widest">Rekomendasi Cepat:</span>
                  <div className="flex flex-wrap gap-1 max-h-[75px] overflow-y-auto pr-1">
                    {[
                      { name: 'WiFi Gratis', icon: 'Wifi' },
                      { name: 'Smart TV', icon: 'Tv' },
                      { name: 'Air Conditioning (AC)', icon: 'Wind' },
                      { name: 'Bathtub', icon: 'Bath' },
                      { name: 'Dapur Lengkap', icon: 'Utensils' },
                      { name: 'Private Pool', icon: 'Waves' },
                      { name: 'Mesin Kopi / Teh', icon: 'Coffee' },
                      { name: 'Akses Smart Key', icon: 'Key' },
                      { name: 'Brankas / Safebox', icon: 'Shield' },
                      { name: 'Balkon / Sunset View', icon: 'Sun' },
                      { name: 'Pelayanan Butler', icon: 'Sparkles' }
                    ].map((p, pIdx) => {
                      const isAdded = (editingRoom.facilities || []).some(f => f.name === p.name);
                      if (isAdded) return null;
                      return (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => {
                            const current = editingRoom.facilities || [];
                            setEditingRoom({
                              ...editingRoom,
                              facilities: [...current, p]
                            });
                          }}
                          className="cursor-pointer flex items-center gap-1 bg-white hover:bg-slate-100 border border-gray-200 px-1.5 py-0.5 rounded-md text-[9px] font-bold text-gray-700 transition-colors"
                        >
                          <FacilityIcon name={p.icon} className="w-2.5 h-2.5 text-slate-500" />
                          <span>+ {p.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Facility Addition inputs */}
                <div className="bg-slate-50 p-2 rounded-xl border border-gray-200 flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      id="custom-facility-name"
                      placeholder="Fasilitas khusus (mis. Sarapan)"
                      className="w-full text-[10px] px-2 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-blue-900 bg-white placeholder:text-gray-400 font-semibold"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const btn = document.getElementById('btn-add-custom-fac');
                          if (btn) btn.click();
                        }
                      }}
                    />
                  </div>
                  
                  <div className="w-[100px]">
                    <select
                      id="custom-facility-icon"
                      className="w-full text-[10px] px-1 py-1.5 border border-gray-200 rounded-lg bg-white outline-none focus:border-blue-900 font-bold"
                    >
                      <option value="Wifi">📶 Wifi</option>
                      <option value="Tv">📺 Tv</option>
                      <option value="Wind">💨 AC</option>
                      <option value="Bath">🛁 Bathtub</option>
                      <option value="Utensils">🍳 Dapur</option>
                      <option value="Waves">🏊 Kolam</option>
                      <option value="Coffee">☕ Kopi</option>
                      <option value="Key">🔑 Kunci</option>
                      <option value="Shield">🛡️ Brankas</option>
                      <option value="Sun">☀️ Balkon</option>
                      <option value="Sparkles">✨ Mewah</option>
                      <option value="Home">🏠 Vila</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    id="btn-add-custom-fac"
                    onClick={() => {
                      const nameEl = document.getElementById('custom-facility-name') as HTMLInputElement;
                      const iconEl = document.getElementById('custom-facility-icon') as HTMLSelectElement;
                      if (nameEl && nameEl.value.trim()) {
                        const current = editingRoom.facilities || [];
                        setEditingRoom({
                          ...editingRoom,
                          facilities: [...current, { name: nameEl.value.trim(), icon: iconEl.value }]
                        });
                        nameEl.value = '';
                        nameEl.focus();
                      }
                    }}
                    className="cursor-pointer bg-blue-900 hover:bg-blue-850 text-white font-bold text-[9px] h-[30px] px-3 rounded-lg flex items-center justify-center transition-colors"
                  >
                    Tambah
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
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
                  Simpan Unit Kamar
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
