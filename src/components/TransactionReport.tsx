/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Booking, RoomType } from '../types';
import { Coins, CreditCard, AlertCircle, Calendar, Search, Download, TrendingUp, BarChart, Percent, CheckCircle, HelpCircle } from 'lucide-react';
import StatsDashboard from './StatsDashboard';

interface TransactionReportProps {
  bookings: Booking[];
  roomTypes: RoomType[];
}

export default function TransactionReport({ bookings, roomTypes }: TransactionReportProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Lunas' | 'DP' | 'Belum Bayar'>('Semua');
  const [activeChartTab, setActiveChartTab] = useState<'pendapatan' | 'kamar'>('pendapatan');

  // Filter and compute transactions list
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchSearch = 
        b.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchStatus = statusFilter === 'Semua' || b.paymentStatus === statusFilter;
      
      return matchSearch && matchStatus;
    });
  }, [bookings, searchTerm, statusFilter]);

  // Financial Statistics computations
  const stats = useMemo(() => {
    let totalRevenue = 0; // Total contract price
    let totalPaid = 0; // Total cash actually collected
    let totalOutstanding = 0; // Remaining unpaid balances
    let countLunas = 0;
    let countDP = 0;
    let countBelumBayar = 0;

    bookings.forEach(b => {
      totalRevenue += b.totalPrice;
      totalPaid += b.amountPaid;
      
      const unpaid = Math.max(0, b.totalPrice - b.amountPaid);
      totalOutstanding += unpaid;

      if (b.paymentStatus === 'Lunas') countLunas++;
      else if (b.paymentStatus === 'DP') countDP++;
      else countBelumBayar++;
    });

    const averageTransactionSize = bookings.length > 0 ? totalRevenue / bookings.length : 0;

    return {
      totalRevenue,
      totalPaid,
      totalOutstanding,
      countLunas,
      countDP,
      countBelumBayar,
      averageTransactionSize
    };
  }, [bookings]);

  // Aggregate revenue by room type
  const roomData = useMemo(() => {
    const data: Record<string, { name: string, revenue: number, bookingsCount: number }> = {};
    
    // Seed with all room types
    roomTypes.forEach(rt => {
      data[rt.id] = {
        name: rt.name,
        revenue: 0,
        bookingsCount: 0
      };
    });

    // Populate from real bookings
    bookings.forEach(b => {
      if (data[b.roomId]) {
        data[b.roomId].revenue += b.totalPrice;
        data[b.roomId].bookingsCount += 1;
      }
    });

    return Object.values(data);
  }, [bookings, roomTypes]);

  // Get trend data (chronological list of bookings - last 31 days)
  const lineChartPoints = useMemo(() => {
    const dates: string[] = [];
    let latestDate = new Date("2026-06-06");
    
    // Find the latest check-in date or anchor to today
    bookings.forEach(b => {
      const d = new Date(b.checkInDate);
      if (!isNaN(d.getTime()) && d > latestDate) {
        latestDate = d;
      }
    });

    for (let i = 30; i >= 0; i--) {
      const d = new Date(latestDate);
      d.setDate(latestDate.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      dates.push(dateStr);
    }

    // Map each date to revenue
    const dailyData: Record<string, { total: number; count: number; nameStr: string }> = {};
    dates.forEach(dateStr => {
      dailyData[dateStr] = { total: 0, count: 0, nameStr: '' };
    });

    bookings.forEach(b => {
      if (dailyData[b.checkInDate]) {
        dailyData[b.checkInDate].total += b.totalPrice;
        dailyData[b.checkInDate].count += 1;
        if (dailyData[b.checkInDate].nameStr) {
          dailyData[b.checkInDate].nameStr += `, ${b.guestName}`;
        } else {
          dailyData[b.checkInDate].nameStr = b.guestName;
        }
      }
    });

    const maxVal = Math.max(...dates.map(d => dailyData[d].total), 1000000);

    const marginL = 50;
    const marginR = 30;
    const chartW = 540; // 620 - 50 - 30 = 540
    const step = chartW / 30;

    return dates.map((dateStr, index) => {
      const x = marginL + (index * step);
      const dayInfo = dailyData[dateStr];
      const y = 140 - ((dayInfo.total / maxVal) * 110);
      
      const parts = dateStr.split('-');
      const dayLabel = `${parts[2]}/${parts[1]}`; // DD/MM

      return {
        x,
        y,
        dateStr,
        label: dayLabel,
        value: dayInfo.total,
        count: dayInfo.count,
        name: dayInfo.nameStr || 'Tidak ada booking',
      };
    });
  }, [bookings]);

  // CSV Exporter
  const handleExportCSV = () => {
    if (filteredBookings.length === 0) {
      alert('Tidak ada data transaksi untuk diekspor.');
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "No Invoice,Pelanggan,WhatsApp,Check In,Check Out,Nama Kamar,Status Bayar,Jumlah Terbayar (Rp),Total Tagihan (Rp),Tanggal Pembuatan\n";
    
    filteredBookings.forEach(b => {
      const room = roomTypes.find(r => r.id === b.roomId);
      const roomName = room ? room.name : b.roomId;
      const row = `${b.invoiceNumber},${b.guestName},${b.whatsappNumber},${b.checkInDate},${b.checkOutDate},${roomName},${b.paymentStatus},${b.amountPaid},${b.totalPrice},${b.createdAt}`;
      csvContent += row + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `laporan-transaksi-villa-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link); // Required for FF
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="transaction-report-panel" className="space-y-6">
      
      {/* 1. Top Accounting Metrics Cards */}
      <StatsDashboard bookings={bookings} roomTypes={roomTypes} />

      {/* 2. Middle Grid: Graph distribution & Booking breakdown statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Analytics Interactive SVG charts box */}
        <div className="lg:col-span-2 bg-slate-900 text-white p-5 rounded-3xl border border-slate-950 flex flex-col justify-between h-[340px] shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider">Visualisasi Grafik Keuangan</h3>
              <p className="text-[10px] text-slate-400">Analisis metrik pendapatan & performa secara visual</p>
            </div>
            
            <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-[10px] font-bold">
              <button
                onClick={() => setActiveChartTab('pendapatan')}
                className={`px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                  activeChartTab === 'pendapatan' ? 'bg-blue-900 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Omset Harian
              </button>
              <button
                onClick={() => setActiveChartTab('kamar')}
                className={`px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                  activeChartTab === 'kamar' ? 'bg-blue-900 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Kamar Terlaris
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center py-4 relative">
            
            {activeChartTab === 'pendapatan' ? (
              /* Chronological Line/Area Chart constructed strictly with native secure SVG elements */
              lineChartPoints.length < 2 ? (
                <div className="text-center text-xs text-slate-500 py-10">
                  Butuh minimal 2 data pesanan untuk menyusun grafik tren omset.
                </div>
              ) : (
                <div className="w-full flex justify-center items-center h-full">
                  <svg className="w-full h-36" viewBox="0 0 620 180">
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1e40af" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#1e40af" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    
                    {/* Horizontal grid guide lines */}
                    <line x1="30" y1="20" x2="600" y2="20" stroke="#1e293b" strokeDasharray="4 4" />
                    <line x1="30" y1="90" x2="600" y2="90" stroke="#1e293b" strokeDasharray="4 4" />
                    <line x1="30" y1="160" x2="600" y2="160" stroke="#1e293b" />

                    {/* Area polygon beneath graph */}
                    <polygon
                      points={`${lineChartPoints[0].x},160 ${lineChartPoints.map(p => `${p.x},${p.y}`).join(' ')} ${lineChartPoints[lineChartPoints.length - 1].x},160`}
                      fill="url(#areaGrad)"
                    />

                    {/* Bold stroke Line graph */}
                    <polyline
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="2.5"
                      points={lineChartPoints.map(p => `${p.x},${p.y}`).join(' ')}
                    />

                    {/* Draw dynamic nodes */}
                    {lineChartPoints.map((pt, idx) => (
                      <g key={idx} className="group cursor-help">
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={pt.value > 0 ? "3.5" : "1.5"}
                          className="fill-blue-900 stroke-amber-400 stroke-[1.5] hover:r-5 transition-all text-slate-800"
                        />
                        {/* Dynamic Tooltip on Hover inside SVG */}
                        <text
                          x={pt.x}
                          y={pt.y - 12}
                          textAnchor="middle"
                          className="fill-slate-200 text-[8px] font-mono font-bold bg-slate-950 p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                        >
                          {pt.dateStr} • Rp {pt.value.toLocaleString('id-ID')} ({pt.count} Booking)
                        </text>
                        {/* Bottom Label under X line (staggered to prevent overlaps) */}
                        {(idx % 5 === 0 || idx === 30) && (
                          <text
                            x={pt.x}
                            y="174"
                            textAnchor="middle"
                            className="fill-slate-400 text-[8px] font-mono font-semibold"
                          >
                            {pt.label}
                          </text>
                        )}
                      </g>
                    ))}
                  </svg>
                </div>
              )
            ) : (
              /* Custom Horizontal Bar representation of Room Popularity */
              <div className="w-full max-w-lg space-y-3.5 px-4">
                {roomData.map((rd, rdIdx) => {
                  const maxRevenue = Math.max(...roomData.map(r => r.revenue), 1);
                  const percentage = Math.round((rd.revenue / maxRevenue) * 100);
                  const barColors = ['bg-blue-600', 'bg-amber-500', 'bg-emerald-600', 'bg-purple-600'];
                  
                  return (
                    <div key={rdIdx} className="space-y-1">
                      <div className="flex justify-between text-[10px] uppercase font-bold text-slate-300">
                        <span className="truncate">{rd.name} ({rd.bookingsCount}x Booked)</span>
                        <span className="font-mono text-emerald-450">Rp {rd.revenue.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800/60 p-0.5">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${barColors[rdIdx % barColors.length]}`}
                          style={{ width: `${Math.max(4, percentage)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
          </div>

          <div className="bg-slate-950 p-2 rounded-xl text-center text-[9px] text-slate-500 font-bold uppercase tracking-wider border border-slate-850">
            {activeChartTab === 'pendapatan' ? '▲ SUMBU Y: Estimasi total tagihan rupiah  │  SUMBU X: Tanggal Laporan (31 Hari Terakhir)' : '🗂 Total kotor sewa terakumulasi per tipe kamar'}
          </div>
        </div>

        {/* Payment Status proportions Card */}
        <div className="bg-white rounded-3xl border border-gray-150 p-5 shadow-sm flex flex-col justify-between h-[340px]">
          <div>
            <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">Rasio Pembayaran</h3>
            <p className="text-[10px] text-gray-400">Porsi realisasi status bayar pesanan</p>
          </div>

          {/* Semi Donut circle display */}
          <div className="flex-1 flex flex-col items-center justify-center relative space-y-3">
            
            {bookings.length === 0 ? (
              <div className="text-center text-xs text-gray-400">Belum ada transaksi</div>
            ) : (
              <>
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                    
                    {/* Ring calculations */}
                    {(() => {
                      const totalCount = bookings.length;
                      const pctLunas = (stats.countLunas / totalCount) * 100;
                      const pctDP = (stats.countDP / totalCount) * 100;
                      const pctBelum = (stats.countBelumBayar / totalCount) * 100;

                      const circ = 100;
                      const strokeLunas = pctLunas;
                      const strokeDP = pctDP;
                      const strokeBelum = pctBelum;

                      const offsetLunas = 0;
                      const offsetDP = strokeLunas;
                      const offsetBelum = strokeLunas + strokeDP;

                      return (
                        <>
                          {/* Lunas emerald ring */}
                          <circle
                            cx="18"
                            cy="18"
                            r="15.915"
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="3.5"
                            strokeDasharray={`${strokeLunas} ${circ - strokeLunas}`}
                            strokeDashoffset={-offsetLunas}
                          />
                          {/* DP amber ring */}
                          <circle
                            cx="18"
                            cy="18"
                            r="15.915"
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="3.5"
                            strokeDasharray={`${strokeDP} ${circ - strokeDP}`}
                            strokeDashoffset={-offsetDP}
                          />
                          {/* Belum Bayar red ring */}
                          <circle
                            cx="18"
                            cy="18"
                            r="15.915"
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="3.5"
                            strokeDasharray={`${strokeBelum} ${circ - strokeBelum}`}
                            strokeDashoffset={-offsetBelum}
                          />
                        </>
                      );
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-sm font-black text-slate-800 font-mono leading-none">{bookings.length}</span>
                    <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider block mt-0.5">Booking</span>
                  </div>
                </div>

                {/* Legend list indicators */}
                <div className="w-full grid grid-cols-3 gap-1.5 text-center text-[10px] font-bold">
                  <div className="p-1 px-1.5 bg-emerald-50 text-emerald-850 rounded-lg border border-emerald-150">
                    <span className="block text-[8px] text-emerald-600 block uppercase">Lunas</span>
                    {stats.countLunas} resi
                  </div>
                  <div className="p-1 px-1.5 bg-amber-50 text-amber-850 rounded-lg border border-amber-150">
                    <span className="block text-[8px] text-amber-600 block uppercase">DP</span>
                    {stats.countDP} resi
                  </div>
                  <div className="p-1 px-1.5 bg-red-50 text-red-850 rounded-lg border border-red-150">
                    <span className="block text-[8px] text-red-650 block uppercase">Belum Bayar</span>
                    {stats.countBelumBayar} resi
                  </div>
                </div>
              </>
            )}

          </div>
        </div>

      </div>

      {/* 3. Bottom Table Ledger audit report list */}
      <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm space-y-4">
        
        {/* Sub-Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider">Jurnal Transaksi Detail</h3>
            <p className="text-[11px] text-gray-400">Total {filteredBookings.length} dari total {bookings.length} baris audit masuk anggaran</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search keywords Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-450">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                placeholder="Cari invoice/pelanggan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-xs px-3.5 py-2.5 pl-8 bg-slate-50 border border-gray-200 outline-none rounded-xl focus:border-blue-900 focus:ring-1 focus:ring-blue-900/10 font-medium text-gray-800"
              />
            </div>

            {/* Filter by status combo select */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs px-3.5 py-2.5 bg-white border border-gray-200 outline-none rounded-xl focus:border-blue-900 focus:ring-1 focus:ring-blue-900/10 font-bold select-none text-gray-700 cursor-pointer"
            >
              <option value="Semua">Semua Pembayaran</option>
              <option value="Lunas">Lunas</option>
              <option value="DP">DP (Uang Muka)</option>
              <option value="Belum Bayar">Belum Bayar</option>
            </select>

            {/* Download Excel CSV Button */}
            <button
              onClick={handleExportCSV}
              className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold px-3.5 py-2.5 flex items-center justify-center gap-1.5 transition-all outline-none"
            >
              <Download className="w-3.5 h-3.5" />
              Ekspor .CSV
            </button>
          </div>
        </div>

        {/* Ledger Transaction Audit Table */}
        <div className="border border-gray-150 rounded-2xl overflow-hidden divide-y divide-gray-150">
          <div className="overflow-x-auto min-w-full">
            <table className="min-w-full text-xs text-left text-gray-700">
              <thead className="bg-slate-50 text-slate-550 border-b border-gray-150 uppercase text-[9px] font-black tracking-wider">
                <tr>
                  <th className="p-3.5 px-4 font-bold">No Invoice</th>
                  <th className="p-3.5 font-bold">Pelanggan / Guest</th>
                  <th className="p-3.5 font-bold">In / Out Stay</th>
                  <th className="p-3.5 font-bold">Kamar Model</th>
                  <th className="p-3.5 font-bold">Status Bayar</th>
                  <th className="p-3.5 text-right font-bold">Kas Terbayar</th>
                  <th className="p-3.5 text-right font-bold pr-4">Total Tarif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-xs text-gray-450 font-semibold bg-white">
                      Tidak ada catatan transaksi audit yang memenuhi syarat filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => {
                    const room = roomTypes.find(r => r.id === b.roomId);
                    
                    return (
                      <tr key={b.id} className="hover:bg-slate-50-50/50 bg-white transition-colors">
                        <td className="p-3.5 px-4 font-mono font-bold text-blue-900">{b.invoiceNumber}</td>
                        <td className="p-3.5">
                          <span className="block font-bold text-slate-850 leading-none">{b.guestName}</span>
                          <span className="block text-[9px] text-gray-400 font-mono mt-0.5">{b.whatsappNumber}</span>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="block text-slate-700 font-semibold">{b.checkInDate}</span>
                          <span className="block text-[9px] text-slate-400">s/d {b.checkOutDate}</span>
                        </td>
                        <td className="p-3.5 text-slate-600">{room ? room.name : b.roomId}</td>
                        <td className="p-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase border tracking-wider ${
                            b.paymentStatus === 'Lunas'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-250/50'
                              : b.paymentStatus === 'DP'
                              ? 'bg-amber-50 text-amber-800 border-amber-250/50'
                              : 'bg-red-50 text-red-800 border-red-250/50'
                          }`}>
                            <span className={`w-1 h-1 rounded-full ${
                              b.paymentStatus === 'Lunas' ? 'bg-emerald-505' : b.paymentStatus === 'DP' ? 'bg-amber-505' : 'bg-red-505'
                            }`}></span>
                            {b.paymentStatus}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-mono text-slate-700 font-bold">
                          Rp {b.amountPaid.toLocaleString('id-ID')}
                        </td>
                        <td className="p-3.5 text-right font-mono font-black text-slate-900 pr-4">
                          Rp {b.totalPrice.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Small tips footer */}
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] text-gray-500 font-medium flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-blue-900 shrink-0" />
          <span><b>Petunjuk Audit:</b> Seluruh perhitungan omset ditarik secara otomatis berdasarkan data sewa kamar serta status bayar kuitansi digital instan.</span>
        </div>

      </div>

    </div>
  );
}
