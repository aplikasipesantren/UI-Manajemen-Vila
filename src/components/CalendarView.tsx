/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Booking, RoomType } from '../types';
import { Calendar, CheckCircle2, AlertCircle, Copy, Check, Users, Search, HelpCircle, Eye } from 'lucide-react';

interface CalendarViewProps {
  roomTypes: RoomType[];
  bookings: Booking[];
  onSelectCell: (roomId: string, dateString: string) => void;
  onSelectBooking: (bookingId: string) => void;
  onAddBooking: () => void;
}

export default function CalendarView({
  roomTypes,
  bookings,
  onSelectCell,
  onSelectBooking,
  onAddBooking,
}: CalendarViewProps) {
  const [copied, setCopied] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{ roomId: string; date: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // June 2026 Days Generation (1 to 30)
  const totalDays = 30;
  const daysInJune = Array.from({ length: totalDays }, (_, i) => {
    const dayNum = i + 1;
    const dateString = `2026-06-${dayNum.toString().padStart(2, '0')}`;
    // Get day name
    const dateObj = new Date(2026, 5, dayNum); // Month 5 is June (0-indexed)
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const dayName = dayNames[dateObj.getDay()];
    const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
    return { dayNum, dateString, dayName, isWeekend };
  });

  // Calculate reservation for a specific room and date
  const getBookingForCell = (roomId: string, dateString: string): Booking | undefined => {
    // A booking occupies checkInDate <= date < checkOutDate (nights stayed)
    return bookings.find((b) => {
      if (b.roomId !== roomId) return false;
      const d = new Date(dateString);
      const start = new Date(b.checkInDate);
      const end = new Date(b.checkOutDate);
      return d >= start && d < end;
    });
  };

  // Status counters for display
  const stats = daysInJune.reduce(
    (acc, { dateString }) => {
      let lunasCount = 0;
      let dpCount = 0;
      let belumBayarCount = 0;
      let kosongCount = 0;

      roomTypes.forEach((room) => {
        const booking = getBookingForCell(room.id, dateString);
        if (booking) {
          if (booking.paymentStatus === 'Lunas') lunasCount++;
          else if (booking.paymentStatus === 'DP') dpCount++;
          else belumBayarCount++;
        } else {
          kosongCount++;
        }
      });

      acc.Lunas += lunasCount;
      acc.DP += dpCount;
      acc.BelumBayar += belumBayarCount;
      acc.Kosong += kosongCount;
      return acc;
    },
    { Lunas: 0, DP: 0, BelumBayar: 0, Kosong: 0 }
  );

  // Generate WhatsApp text rekap availability
  const handleCopyWhatsapp = () => {
    let message = `*🏡 REKAP KETERSEDIAAN VILLA - JUNI 2026*\n`;
    message += `_Update Terkini: ${new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}_\n\n`;

    message += `📋 *STATUS KETERSEDIAAN KAMAR per TIPE:*\n\n`;

    roomTypes.forEach((room) => {
      message += `*📍 ${room.name}* (Rp ${room.ratePerNight.toLocaleString('id-ID')}/malam)\n`;
      
      // Group continuous occupied dates or list them
      const occupiedDates: { start: number; end: number; guest: string; status: string }[] = [];
      let tempStart: number | null = null;
      let tempGuest = '';
      let tempStatus = '';

      for (let day = 1; day <= 30; day++) {
        const dateString = `2026-06-${day.toString().padStart(2, '0')}`;
        const b = getBookingForCell(room.id, dateString);

        if (b) {
          const guestName = b.guestName;
          const statusText = b.paymentStatus;
          if (tempStart === null) {
            tempStart = day;
            tempGuest = guestName;
            tempStatus = statusText;
          } else if (tempGuest !== guestName) {
            occupiedDates.push({ start: tempStart, end: day - 1, guest: tempGuest, status: tempStatus });
            tempStart = day;
            tempGuest = guestName;
            tempStatus = statusText;
          }
        } else {
          if (tempStart !== null) {
            occupiedDates.push({ start: tempStart, end: day - 1, guest: tempGuest, status: tempStatus });
            tempStart = null;
            tempGuest = '';
            tempStatus = '';
          }
        }
      }
      if (tempStart !== null) {
        occupiedDates.push({ start: tempStart, end: 30, guest: tempGuest, status: tempStatus });
      }

      if (occupiedDates.length === 0) {
        message += `  🟢 *KOSONG SEPANJANG JUNI*\n\n`;
      } else {
        // Build list of booked & empty periods
        message += `  • Terisi:\n`;
        occupiedDates.forEach((period) => {
          const statusIndicator = period.status === 'Lunas' ? '🟢 Lunas' : period.status === 'DP' ? '🟡 DP' : '🔴 Belum Bayar';
          message += `    - Tanggal ${period.start.toString().padStart(2, '0')}-${(period.end + 1).toString().padStart(2, '0')} Jun: ${period.guest} (${statusIndicator})\n`;
        });

        // Let's also suggest when it is empty
        message += `  • Rekomendasi Slot Kosong:\n`;
        let lastDay = 0;
        let emptyRanges: string[] = [];
        occupiedDates.forEach((period) => {
          if (period.start - 1 > lastDay) {
            emptyRanges.push(`${(lastDay + 1).toString().padStart(2, '0')}-${(period.start).toString().padStart(2, '0')} Jun`);
          }
          lastDay = period.end + 1;
        });
        if (lastDay < 30) {
          emptyRanges.push(`${(lastDay + 1).toString().padStart(2, '0')}-30 Jun`);
        }
        if (emptyRanges.length > 0) {
          message += `    - Kamar Tersedia: ${emptyRanges.join(', ')}\n`;
        }
        message += `\n`;
      }
    });

    message += `📲 _Pemesanan offline diproses langsung oleh Admin Villa. Silakan hubungi nomor ini & sebutkan tipe kamar serta tanggal check-in._`;

    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Filtering bookings for search list
  const filteredBookings = bookings.filter((b) => {
    const room = roomTypes.find((r) => r.id === b.roomId);
    return (
      b.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.whatsappNumber.includes(searchQuery) ||
      b.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (room && room.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-gray-100">
        <div>
          <h2 id="calendar-heading" className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-900" />
            Kalender Ketersediaan Villa
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Dashboard visual alokasi harian real-time untuk periode <span className="font-semibold text-gray-700">Juni 2026</span>. Klik kotak kosong untuk buat booking baru.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            id="btn-copy-wa"
            onClick={handleCopyWhatsapp}
            className={`cursor-pointer px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all duration-200 shadow-sm ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-800 hover:bg-emerald-990 text-white hover:shadow-md'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 animate-scale-up" />
                Rekap Ter-copy!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Rekap ke WhatsApp
              </>
            )}
          </button>

          <button
            id="btn-quick-booking"
            onClick={onAddBooking}
            className="cursor-pointer px-4 py-2.5 rounded-xl font-medium text-sm bg-blue-900 hover:bg-blue-950 text-white transition-all duration-200 hover:shadow-md shadow-sm"
          >
            + Booking Manual
          </button>
        </div>
      </div>

      {/* Visual Color Status Guide */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl shadow-xs border border-gray-100">
        <div className="flex items-center gap-3 p-1">
          <div className="w-4 h-4 rounded-md border border-gray-200 bg-white shadow-xs"></div>
          <div>
            <span className="block text-xs font-semibold text-gray-700">Kosong</span>
            <span className="block text-[10px] text-gray-400">Tersedia untuk disewa</span>
          </div>
        </div>
        <div className="flex items-center gap-3 p-1">
          <div className="w-4 h-4 rounded-md bg-emerald-100 border border-emerald-300"></div>
          <div>
            <span className="block text-xs font-semibold text-emerald-800">Terisi / Lunas</span>
            <span className="block text-[10px] text-gray-400">Pembayaran selesai</span>
          </div>
        </div>
        <div className="flex items-center gap-3 p-1">
          <div className="w-4 h-4 rounded-md bg-amber-100 border border-amber-300"></div>
          <div>
            <span className="block text-xs font-semibold text-amber-800">Belum Lunas / DP</span>
            <span className="block text-[10px] text-gray-400">Panjar sebagian terbayar</span>
          </div>
        </div>
        <div className="flex items-center gap-3 p-1">
          <div className="w-4 h-4 rounded-md bg-rose-100 border border-rose-300"></div>
          <div>
            <span className="block text-xs font-semibold text-rose-800">Belum Bayar</span>
            <span className="block text-[10px] text-gray-400">Reservasi belum dibayar</span>
          </div>
        </div>
      </div>

      {/* PMS Calendar Interactive Matrix */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <h3 className="font-bold text-gray-800 text-sm tracking-wide uppercase">
            Situs Pemetaan Kamar (PMS Matrix Grid)
          </h3>
          <span className="text-xs bg-blue-50 text-blue-900 px-2.5 py-1 rounded-full font-medium">
            30 Hari dalam Juni 2026
          </span>
        </div>

        <div className="overflow-x-auto select-none adaptive-scrollbar">
          <div className="min-w-[1100px] table-layout-fixed w-full">
            {/* Calendar Table Header (Dates) */}
            <div className="flex border-b border-gray-100">
              <div className="w-56 flex-shrink-0 bg-slate-50 border-r border-gray-100 sticky left-0 z-10 p-3 font-semibold text-xs text-gray-500 flex items-center justify-between">
                <span>TIPE KAMAR</span>
                <Users className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <div className="flex flex-1">
                {daysInJune.map(({ dayNum, dayName, isWeekend }) => (
                  <div
                    key={dayNum}
                    className={`flex-1 text-center py-2.5 text-xs border-r border-gray-100/70 flex flex-col justify-center items-center ${
                      isWeekend ? 'bg-rose-50/40 text-rose-600' : 'text-gray-600'
                    } ${dayNum === 4 ? 'bg-blue-50/50 font-bold border-x border-blue-100' : ''}`}
                  >
                    <span className="font-semibold block">{dayNum}</span>
                    <span className="text-[10px] opacity-75">{dayName}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Room Rows Matrix */}
            {roomTypes.map((room) => (
              <div key={room.id} className="flex border-b border-gray-100 hover:bg-slate-50/30 transition-colors">
                {/* Sticky Left Room Column */}
                <div className="w-56 flex-shrink-0 bg-white border-r border-gray-100 sticky left-0 z-10 p-3 flex flex-col justify-center shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                  <span className="font-semibold text-sm text-gray-800">{room.name}</span>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-gray-400">
                    <span>Rp {room.ratePerNight / 1000}k / malam</span>
                    <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                      {room.capacity} Pax
                    </span>
                  </div>
                </div>

                {/* Date Grid Cells */}
                <div className="flex flex-1">
                  {daysInJune.map(({ dayNum, dateString, isWeekend }) => {
                    const booking = getBookingForCell(room.id, dateString);
                    let cellClass = 'bg-white hover:bg-slate-100 border-gray-200/50 text-transparent cursor-pointer';
                    let label = '';

                    if (booking) {
                      if (booking.paymentStatus === 'Lunas') {
                        cellClass = 'bg-emerald-100 hover:bg-emerald-200/90 border-emerald-200 text-emerald-800 font-semibold cursor-zoom-in';
                        label = 'L';
                      } else if (booking.paymentStatus === 'DP') {
                        cellClass = 'bg-amber-100 hover:bg-amber-200/90 border-amber-300 text-amber-800 font-semibold cursor-zoom-in';
                        label = 'DP';
                      } else {
                        cellClass = 'bg-rose-100 hover:bg-rose-200/90 border-rose-300 text-rose-800 font-semibold cursor-zoom-in';
                        label = 'B';
                      }
                    }

                    const isHovered = hoveredCell?.roomId === room.id && hoveredCell?.date === dateString;

                    return (
                      <div
                        key={dayNum}
                        id={`cell-${room.id}-${dayNum}`}
                        className={`flex-1 min-h-[50px] border-r border-gray-100/70 py-1 flex items-center justify-center transition-all duration-150 text-xs text-center border-b relative ${cellClass} ${
                          isWeekend && !booking ? 'bg-orange-50/10' : ''
                        }`}
                        onMouseEnter={() => setHoveredCell({ roomId: room.id, date: dateString })}
                        onMouseLeave={() => setHoveredCell(null)}
                        onClick={() => {
                          if (booking) {
                            onSelectBooking(booking.id);
                          } else {
                            onSelectCell(room.id, dateString);
                          }
                        }}
                      >
                        {/* Display initials or check marks */}
                        {booking ? (
                          <div className="flex flex-col items-center justify-center">
                            <span className="text-[10px] font-bold tracking-tight uppercase">
                              {booking.guestName.split(' ')[0]}
                            </span>
                            <span className="text-[9px] opacity-75 font-mono">
                              ({booking.paymentStatus})
                            </span>
                          </div>
                        ) : (
                          <span className="text-[14px] font-light text-slate-300 opacity-0 hover:opacity-100">
                            +
                          </span>
                        )}

                        {/* Interactive Tooltip on Hover */}
                        {isHovered && booking && (
                          <div id={`tooltip-${room.id}-${dayNum}`} className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-slate-950 text-white text-[11px] rounded-lg p-2.5 shadow-xl z-30 pointer-events-none border border-slate-800 animate-fade-in-up">
                            <p className="font-bold border-b border-white/20 pb-1 mb-1 text-xs">
                              {booking.guestName}
                            </p>
                            <div className="space-y-0.5 font-normal text-slate-300">
                              <p>📞 {booking.whatsappNumber}</p>
                              <p>📅 {booking.checkInDate} s.d {booking.checkOutDate}</p>
                              <p className="flex items-center gap-1">
                                💰 Status:{' '}
                                <span
                                  className={`px-1 rounded text-[9px] font-bold ${
                                    booking.paymentStatus === 'Lunas'
                                      ? 'bg-emerald-500 text-white'
                                      : booking.paymentStatus === 'DP'
                                      ? 'bg-amber-500 text-slate-900'
                                      : 'bg-rose-500 text-white'
                                  }`}
                                >
                                  {booking.paymentStatus}
                                </span>
                              </p>
                              <p className="font-semibold text-white mt-1">
                                Total: Rp {booking.totalPrice.toLocaleString('id-ID')}
                              </p>
                            </div>
                            <div className="mt-1.5 flex items-center justify-center gap-1 text-[9px] text-blue-300 font-medium">
                              <Eye className="w-2.5 h-2.5" />
                              Klik untuk Detail & Kuitansi
                            </div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-950"></div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PMS Footer helper info */}
        <div className="p-3 bg-slate-50 border-t border-gray-100 flex flex-wrap items-center justify-between text-[11px] text-gray-500 gap-2">
          <div className="flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
            <span>*Klik pada sel terisi untuk cetak kuitansi digital atau ubah pemesanan. Klik pada sel kosong untuk cepat buat booking baru.</span>
          </div>
          <div className="font-medium text-gray-600">
            Kamar Terjual (Nights):{' '}
            <span className="text-emerald-700 font-bold">{stats.Lunas + stats.DP}</span> / 120 slot malam
          </div>
        </div>
      </div>

      {/* Bookings Search & Quick List Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-md font-bold text-gray-800">Daftar Bookings Terdaftar</h3>
            <p className="text-xs text-gray-500">Pencarian cepat, pengelolaan status pembayaran, dan link kuitansi printable.</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="search-bookings"
              type="text"
              placeholder="Cari tamu, invoice, nomor WA..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 border border-gray-200 outline-none rounded-xl focus:border-blue-900 focus:ring-1 focus:ring-blue-900/10 placeholder:text-gray-400 bg-slate-50/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100 text-gray-500 font-semibold uppercase tracking-wider">
                <th className="p-3">Kuitansi No.</th>
                <th className="p-3">Nama Tamu</th>
                <th className="p-3">Tipe Kamar</th>
                <th className="p-3">Menginap</th>
                <th className="p-3">Total Harga</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400 font-medium">
                    Tidak ditemukan data booking yang cocok.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const room = roomTypes.find((r) => r.id === b.roomId);
                  return (
                    <tr
                      key={b.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="p-3 font-mono font-semibold text-gray-700">
                        {b.invoiceNumber}
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-gray-800">{b.guestName}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{b.whatsappNumber}</div>
                      </td>
                      <td className="p-3 font-medium text-gray-700">
                        {room ? room.name : b.roomId}
                      </td>
                      <td className="p-3">
                        <span className="text-gray-600">
                          {b.checkInDate} / {b.checkOutDate}
                        </span>
                        <span className="block text-[10px] text-gray-400">
                          {Math.round(
                            (new Date(b.checkOutDate).getTime() - new Date(b.checkInDate).getTime()) /
                              (1000 * 3600 * 24)
                          )}{' '}
                          Malam
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-gray-800">
                        Rp {b.totalPrice.toLocaleString('id-ID')}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                            b.paymentStatus === 'Lunas'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-250'
                              : b.paymentStatus === 'DP'
                              ? 'bg-amber-50 text-amber-700 border border-amber-250'
                              : 'bg-rose-50 text-rose-700 border border-rose-250'
                          }`}
                        >
                          {b.paymentStatus === 'Lunas' ? (
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                          ) : (
                            <AlertCircle className="w-3 h-3 mr-1" />
                          )}
                          {b.paymentStatus}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          id={`btn-view-invoice-${b.id}`}
                          onClick={() => onSelectBooking(b.id)}
                          className="cursor-pointer text-xs bg-slate-100 hover:bg-blue-900 hover:text-white text-gray-600 px-2.5 py-1.5 rounded-lg font-medium transition-colors gap-1 inline-flex items-center"
                        >
                          Lihat Kuitansi
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
