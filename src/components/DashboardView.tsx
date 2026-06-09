/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Booking, RoomType } from '../types';
import { 
  TrendingUp, 
  Coins, 
  Calendar, 
  Users, 
  Home, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Info, 
  ChevronRight,
  Sparkles,
  Percent,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface DashboardViewProps {
  bookings: Booking[];
  roomTypes: RoomType[];
  onNavigateToTab: (tab: 'kalender' | 'booking' | 'kuitansi' | 'brosur' | 'konfirmasi' | 'pelanggan' | 'kamar' | 'laporan' | 'setting') => void;
}

export default function DashboardView({ bookings, roomTypes, onNavigateToTab }: DashboardViewProps) {
  // Configurable target year for filters
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [activeMetricTab, setActiveMetricTab] = useState<'pendapatan' | 'volume'>('pendapatan');
  const [activeChartTab, setActiveChartTab] = useState<'bulanan' | 'mingguan'>('bulanan');
  const [selectedMonth, setSelectedMonth] = useState<number>(5); // Default to June (index 5)

  const monthList = [
    { value: 0, label: 'Januari' },
    { value: 1, label: 'Februari' },
    { value: 2, label: 'Maret' },
    { value: 3, label: 'April' },
    { value: 4, label: 'Mei' },
    { value: 5, label: 'Juni' },
    { value: 6, label: 'Juli' },
    { value: 7, label: 'Agustus' },
    { value: 8, label: 'September' },
    { value: 9, label: 'Oktober' },
    { value: 10, label: 'November' },
    { value: 11, label: 'Desember' }
  ];

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

  // Weekly breakdown data for charts (Monday to Sunday) based on anchor date
  const weeklyData = useMemo(() => {
    const anchor = new Date("2026-06-06"); // Modern simulation anchor
    const dayOfWeek = anchor.getDay(); // 0 is Sunday, 1 is Monday, etc.
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(anchor);
    monday.setDate(anchor.getDate() + distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const dayNames = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const ids = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeks = [];

    for (let i = 0; i < 7; i++) {
      const currentWDay = new Date(monday);
      currentWDay.setDate(monday.getDate() + i);
      const dateStr = currentWDay.toISOString().split('T')[0];
      const dayNum = currentWDay.getDate();
      const monthLabel = currentWDay.toLocaleString('id-ID', { month: 'short' });

      weeks.push({
        id: ids[i],
        label: `${dayNum} ${monthLabel}`,
        name: dayNames[i],
        dateString: dateStr,
        revenueGoal: 0,
        revenueRealized: 0,
        bookingCount: 0,
      });
    }

    // Populate real statistics matching the specific dates
    bookings.forEach(b => {
      const date = b.checkInDate || b.createdAt;
      if (!date) return;
      const bDateStr = typeof date === 'string' ? date.split('T')[0] : new Date(date).toISOString().split('T')[0];
      const targetDay = weeks.find(w => w.dateString === bDateStr);
      if (targetDay) {
        targetDay.revenueGoal += b.totalPrice;
        targetDay.revenueRealized += b.amountPaid;
        targetDay.bookingCount += 1;
      }
    });

    const maxRevenue = Math.max(...weeks.map(w => w.revenueGoal), 1000000);
    const maxBookingCount = Math.max(...weeks.map(w => w.bookingCount), 5);

    return {
      weeks,
      maxRevenue,
      maxBookingCount
    };
  }, [bookings]);

  // Find unique years in booking data
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>([2026]);
    bookings.forEach(b => {
      const date = b.checkInDate || b.createdAt;
      if (date) {
        const yr = new Date(date).getFullYear();
        if (!isNaN(yr)) yearsSet.add(yr);
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [bookings]);

  // Current Date Helper
  const formattedToday = useMemo(() => {
    const d = new Date();
    return d.toISOString().split('T')[0]; // "YYYY-MM-DD"
  }, []);

  // Main KPI calculations
  const kpis = useMemo(() => {
    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
    const totalReceived = bookings.reduce((sum, b) => sum + b.amountPaid, 0);
    const outstandingPayment = totalRevenue - totalReceived;
    const totalGuests = bookings.length;

    // Today's occupancy rate
    // Count how many rooms are booked for today
    const occupiedRoomIds = new Set<string>();
    bookings.forEach(b => {
      if (b.checkInDate <= formattedToday && b.checkOutDate >= formattedToday) {
        occupiedRoomIds.add(b.roomId);
      }
    });

    const activeRoomsCount = roomTypes.length;
    const occupiedCount = occupiedRoomIds.size;
    const occupancyRate = activeRoomsCount > 0 ? Math.round((occupiedCount / activeRoomsCount) * 100) : 0;

    return {
      totalRevenue,
      totalReceived,
      outstandingPayment,
      totalGuests,
      occupiedCount,
      occupancyRate
    };
  }, [bookings, roomTypes, formattedToday]);

  // Monthly daily data for charts: Days 1 to 30/31 of the selectedMonth & selectedYear
  const monthlyData = useMemo(() => {
    // Number of days in selected month & year
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    
    // Initialize days structure
    const months = Array.from({ length: daysInMonth }, (_, index) => {
      const dayNum = index + 1;
      return {
        index,
        name: `${dayNum}`, // "1", "2", ... "31"
        revenueGoal: 0, // Potential total value
        revenueRealized: 0, // Received money
        bookingCount: 0,
      };
    });

    bookings.forEach(b => {
      const date = b.checkInDate || b.createdAt;
      if (!date) return;
      const d = new Date(date);
      const yr = d.getFullYear();
      const m = d.getMonth();
      const day = d.getDate();

      if (yr === selectedYear && m === selectedMonth && day >= 1 && day <= daysInMonth) {
        months[day - 1].revenueGoal += b.totalPrice;
        months[day - 1].revenueRealized += b.amountPaid;
        months[day - 1].bookingCount += 1;
      }
    });

    // Find maximums for responsive SVG scaling
    const maxRevenue = Math.max(...months.map(m => m.revenueGoal), 1000000);
    const maxBookingCount = Math.max(...months.map(m => m.bookingCount), 5);

    return {
      months,
      maxRevenue,
      maxBookingCount
    };
  }, [bookings, selectedYear, selectedMonth]);

  // Recent 5 activities check-ins
  const recentCheckIns = useMemo(() => {
    return bookings
      .filter(b => b.checkInDate >= formattedToday)
      .sort((a, b) => a.checkInDate.localeCompare(b.checkInDate))
      .slice(0, 5);
  }, [bookings, formattedToday]);

  // Room occupancy map list for today
  const roomsOccupancyList = useMemo(() => {
    return roomTypes.map(room => {
      // Find booking check-in for today
      const currentBooking = bookings.find(b => 
        b.roomId === room.id && 
        b.checkInDate <= formattedToday && 
        b.checkOutDate >= formattedToday
      );

      return {
        ...room,
        isOccupied: !!currentBooking,
        currentGuest: currentBooking ? currentBooking.guestName : null,
        invoiceNumber: currentBooking ? currentBooking.invoiceNumber : null,
        checkOutDate: currentBooking ? currentBooking.checkOutDate : null
      };
    });
  }, [roomTypes, bookings, formattedToday]);

  return (
    <div id="dashboard-container" className="space-y-6">
      
      {/* Welcome Title banner area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 justify-between p-6 rounded-3xl text-white shadow-xl shadow-slate-950/25 relative overflow-hidden">
        {/* Decorative ambient background orb */}
        <div className="absolute -right-20 -top-20 w-56 h-56 rounded-full bg-blue-700/20 blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-48 h-48 rounded-full bg-emerald-700/10 blur-3xl pointer-events-none"></div>

        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-slate-950 text-[9px] font-black uppercase tracking-widest px-2.1 py-0.5 rounded-full">
              LIVE METRICS
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">• Diperbarui otomatis dari database lokal</span>
          </div>
          <h1 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
            Dashboard Pemantauan & Analitik
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Tinjau kinerja finansial, occupancy sewa villa, dan grafik ketersediaan akomodasi hari ini.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10 text-xs shrink-0 bg-slate-800/80 border border-slate-700 p-2 rounded-2xl">
          <span className="font-bold text-slate-350">Tahun Laporan:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-slate-950 text-white font-black px-3 py-1.5 rounded-xl border border-slate-700 outline-none cursor-pointer focus:border-blue-500"
          >
            {availableYears.map(yr => (
              <option key={yr} value={yr}>Tahun {yr}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Stats widgets row container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* KPI 1: Realisasi Keuangan */}
        <div className="bg-white rounded-2xl border border-gray-150 p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow relative">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl">
              <Coins className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50/50 border border-emerald-100 px-2 py-0.5 rounded-full">
              Realized Cash
            </span>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">DANA DITERIMA (DP/LUNAS)</span>
            <span className="block text-lg font-black font-mono text-slate-800 leading-none">
              Rp {kpis.totalReceived.toLocaleString('id-ID')}
            </span>
            <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1.5">
              <span className="text-emerald-700 font-semibold">✔ Sukses terverifikasi</span> 
            </p>
          </div>
        </div>

        {/* KPI 2: Potensi Omzet */}
        <div className="bg-white rounded-2xl border border-gray-150 p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow relative">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-blue-50 text-blue-900 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-blue-900 bg-blue-50/50 border border-blue-150 px-2 py-0.5 rounded-full">
              Contract Value
            </span>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">TOTAL POTENSI OMZET</span>
            <span className="block text-lg font-black font-mono text-slate-800 leading-none">
              Rp {kpis.totalRevenue.toLocaleString('id-ID')}
            </span>
            <p className="text-[10px] text-gray-400 mt-2">
              Sisa piutang: <strong className="text-amber-700 font-mono">Rp {kpis.outstandingPayment.toLocaleString('id-ID')}</strong>
            </p>
          </div>
        </div>

        {/* KPI 3: Jumlah Tamu / Booking */}
        <div className="bg-white rounded-2xl border border-gray-150 p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow relative">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-purple-50 text-purple-700 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-purple-800 bg-purple-50/50 border border-purple-100 px-2 py-0.5 rounded-full">
              Reservations
            </span>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">TOTAL DATA RESERVASI</span>
            <span className="block text-lg font-black font-mono text-slate-800 leading-none">
              {kpis.totalGuests} Transaksi
            </span>
            <p className="text-[10px] text-gray-400 mt-2">
              Tercatat di data ledger lunas/DP
            </p>
          </div>
        </div>

        {/* KPI 4: Tingkat Okupansi Hari Ini */}
        <div className="bg-white rounded-2xl border border-gray-150 p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow relative">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
              <Percent className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-50/50 border border-amber-150 px-2 py-0.5 rounded-full">
              Occupancy Rate
            </span>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">OKUPANSI HARI INI</span>
            <span className="block text-lg font-black font-mono text-slate-800 leading-none">
              {kpis.occupancyRate}% Terisi
            </span>
            <p className="text-[10px] text-gray-400 mt-2">
              Sejumlah <strong className="text-slate-850">{kpis.occupiedCount} dari {roomTypes.length} unit</strong> aktif malam ini
            </p>
          </div>
        </div>

      </div>

      {/* CHARTS CONTAINER GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {/* COLUMN 1 & 2: Interactive SVG Chart of Financial trends */}
        <div className="md:col-span-2 bg-slate-900 text-white p-5 rounded-3xl border border-slate-950 flex flex-col justify-between min-h-[340px] shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-3">
            <div>
              <h3 className="text-xs font-black uppercase text-amber-400 tracking-wider">Visualisasi Grafik Keuangan</h3>
              <p className="text-[10px] text-slate-400">Analisis metrik pendapatan & performa secara harian/mingguan</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {activeChartTab === 'bulanan' && (
                <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-xs text-slate-300">
                  <span className="font-sans font-bold text-slate-450 hidden md:inline">Bulan:</span>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="bg-transparent text-amber-400 font-bold outline-none cursor-pointer focus:text-white"
                  >
                    {monthList.map(m => (
                      <option key={m.value} value={m.value} className="bg-slate-950 text-slate-100">{m.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-xs font-bold text-white font-mono">
                <button
                  type="button"
                  onClick={() => setActiveChartTab('bulanan')}
                  className={`px-3.5 py-1.5 rounded-md cursor-pointer transition-colors ${
                    activeChartTab === 'bulanan' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📅 Bulanan
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChartTab('mingguan')}
                  className={`px-3.5 py-1.5 rounded-md cursor-pointer transition-colors ${
                    activeChartTab === 'mingguan' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📆 Mingguan
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center py-2 relative">
            {/* Legend Indicators with enlarged legibility */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 text-xs md:text-sm font-black text-slate-200 mb-3 font-mono">
              <span className="flex items-center gap-2.5">
                <span className="w-5 h-0.5 bg-blue-500 relative inline-block">
                  <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-blue-900 border border-blue-400 rounded-full inline-block"></span>
                </span>
                Total Omset (Biru)
              </span>
              <span className="flex items-center gap-2.5">
                <span className="w-5 h-0.5 bg-emerald-500 relative inline-block">
                  <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-slate-950 border border-emerald-450 rounded-full inline-block"></span>
                </span>
                Realisasi Pembayaran (Hijau)
              </span>
              <span className="text-amber-400 font-extrabold">
                • {activeChartTab === 'bulanan' ? `${monthList[selectedMonth].label} ${selectedYear}` : `Tahun ${selectedYear}`}
              </span>
            </div>

            {(() => {
              // Dynamic helper to format Y axis beautifully based on size of data
              const formatRevenueYAxis = (val: number) => {
                if (val >= 1000000000) {
                  return `Rp ${(val / 1000000000).toFixed(1)}M`;
                } else if (val >= 1000000) {
                  return `Rp ${(val / 1000000).toFixed(0)} Jt`;
                }
                return `Rp ${val.toLocaleString('id-ID')}`;
              };

              if (activeChartTab === 'bulanan') {
                const maxRev = monthlyData.maxRevenue;
                return (
                  /* MONTHLY REVENUE LINE CHART */
                  <div className="w-full flex justify-center items-center h-full">
                    <svg className="w-full h-52 md:h-56" viewBox="0 0 620 200">
                      {/* Axis & Reference Grid Lines */}
                      <line x1="60" y1="25" x2="590" y2="25" stroke="#1e293b" strokeDasharray="3 3" />
                      <line x1="60" y1="90" x2="590" y2="90" stroke="#1e293b" strokeDasharray="3 3" />
                      <line x1="60" y1="160" x2="590" y2="160" stroke="#475569" strokeWidth="1.5" />

                      {/* Left Y-Axis Labels - Made bigger and highly visible */}
                      <text x="52" y="29" textAnchor="end" className="fill-slate-100 text-[11px] md:text-[12px] font-mono font-black">
                        {formatRevenueYAxis(maxRev)}
                      </text>
                      <text x="52" y="94" textAnchor="end" className="fill-slate-100 text-[11px] md:text-[12px] font-mono font-black">
                        {formatRevenueYAxis(maxRev / 2)}
                      </text>
                      <text x="52" y="164" textAnchor="end" className="fill-slate-100 text-[11px] md:text-[12px] font-mono font-black">
                        Rp 0
                      </text>

                      {/* Line/Area Paths and Points logic */}
                      {(() => {
                        const marginL = 60;
                        const endX = 590;
                        const dX = (endX - marginL) / (monthlyData.months.length - 1);
                        const startY = 160;
                        const maxH = 135;

                        const goalPoints = monthlyData.months.map((m, idx) => {
                          const cX = marginL + (idx * dX);
                          const y = startY - ((m.revenueGoal / maxRev) * maxH);
                          return { x: cX, y };
                        });

                        const realizedPoints = monthlyData.months.map((m, idx) => {
                          const cX = marginL + (idx * dX);
                          const y = startY - ((m.revenueRealized / maxRev) * maxH);
                          return { x: cX, y };
                        });

                        const goalPathD = "M " + goalPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L ");
                        const goalAreaD = `${goalPathD} L ${endX.toFixed(1)},${startY} L ${marginL.toFixed(1)},${startY} Z`;

                        const realizedPathD = "M " + realizedPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L ");
                        const realizedAreaD = `${realizedPathD} L ${endX.toFixed(1)},${startY} L ${marginL.toFixed(1)},${startY} Z`;

                        return (
                          <>
                            <defs>
                              <linearGradient id="areaGradGoal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                              </linearGradient>
                              <linearGradient id="areaGradRealized" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                              </linearGradient>
                            </defs>

                            {/* Goal Area & Line */}
                            <path d={goalAreaD} fill="url(#areaGradGoal)" />
                            <path d={goalPathD} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                            {/* Realized Area & Line */}
                            <path d={realizedAreaD} fill="url(#areaGradRealized)" />
                            <path d={realizedPathD} fill="none" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

                            {/* Interactive Node circles with large responsive labels */}
                            {monthlyData.months.map((m, idx) => {
                              const cX = marginL + (idx * dX);
                              const yGoal = goalPoints[idx].y;
                              const yRealGroup = realizedPoints[idx].y;

                              const toolW = 230;
                              const toolH = 60;
                              const tX = Math.max(10, Math.min(cX - toolW / 2, 620 - toolW - 10));

                              const showLabel = idx % 2 === 0 || idx === (monthlyData.months.length - 1);

                              return (
                                <g key={m.index} className="group cursor-help">
                                  {/* Invisible card hover trigger area */}
                                  <rect
                                    x={cX - dX / 2}
                                    y="10"
                                    width={dX}
                                    height="170"
                                    fill="transparent"
                                  />

                                  {/* Vertical indicator guide */}
                                  <line
                                    x1={cX}
                                    y1="25"
                                    x2={cX}
                                    y2="160"
                                    stroke="#64748b"
                                    strokeDasharray="3 3"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  />

                                  {/* Goal point halo & dot */}
                                  <circle cx={cX} cy={yGoal} r="7" className="fill-blue-500/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  <circle cx={cX} cy={yGoal} r="4" className="fill-blue-900 stroke-blue-400 stroke-[2.5]" />

                                  {/* Realized point halo & dot */}
                                  <circle cx={cX} cy={yRealGroup} r="7" className="fill-emerald-550/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  <circle cx={cX} cy={yRealGroup} r="4" className="fill-slate-950 stroke-emerald-450 stroke-[2.5]" />

                                  {/* Tooltip Overlay popup */}
                                  <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <rect
                                      x={tX}
                                      y="5"
                                      width={toolW}
                                      height={toolH}
                                      rx="10"
                                      fill="#0d1527"
                                      stroke="#1e3a8a"
                                      strokeWidth="2"
                                    />
                                    <text
                                      x={tX + toolW / 2}
                                      y="19"
                                      textAnchor="middle"
                                      className="fill-amber-400 text-[12px] font-black uppercase tracking-wider font-sans"
                                    >
                                      Tanggal {m.name} {monthList[selectedMonth].label} {selectedYear}
                                    </text>
                                    <text
                                      x={tX + toolW / 2}
                                      y="34"
                                      textAnchor="middle"
                                      className="fill-slate-100 text-[11px] font-mono font-black"
                                    >
                                      Sewa: Rp {m.revenueGoal.toLocaleString('id-ID')} ({m.bookingCount} Booking)
                                    </text>
                                    <text
                                      x={tX + toolW / 2}
                                      y="49"
                                      textAnchor="middle"
                                      className="fill-emerald-400 text-[11px] font-mono font-black"
                                    >
                                      Realisasi: Rp {m.revenueRealized.toLocaleString('id-ID')}
                                    </text>
                                  </g>

                                  {/* Legible Bottom X-Axis labels */}
                                  <text
                                    x={cX}
                                    y="180"
                                    textAnchor="middle"
                                    className={`${showLabel ? 'fill-slate-100 text-[11px] font-black' : 'fill-slate-500 text-[10px]'} group-hover:fill-white font-sans transition-colors`}
                                  >
                                    {showLabel ? m.name : '•'}
                                  </text>

                                  {/* Booking badge indicator dot */}
                                  {m.bookingCount > 0 && (
                                    <circle
                                      cx={cX}
                                      cy="192"
                                      r="2.5"
                                      className="fill-amber-400"
                                    />
                                  )}
                                </g>
                              );
                            })}
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                );
              } else {
                const maxRevW = weeklyData.maxRevenue;
                return (
                  /* WEEKLY REVENUE LINE CHART */
                  <div className="w-full flex justify-center items-center h-full">
                    <svg className="w-full h-52 md:h-56" viewBox="0 0 620 200">
                      {/* Axis & Reference Grid Lines */}
                      <line x1="60" y1="25" x2="590" y2="25" stroke="#1e293b" strokeDasharray="3 3" />
                      <line x1="60" y1="90" x2="590" y2="90" stroke="#1e293b" strokeDasharray="3 3" />
                      <line x1="60" y1="160" x2="590" y2="160" stroke="#475569" strokeWidth="1.5" />

                      {/* Left Y-Axis Labels - Made bigger and highly visible */}
                      <text x="52" y="29" textAnchor="end" className="fill-slate-100 text-[11px] md:text-[12px] font-mono font-black">
                        {formatRevenueYAxis(maxRevW)}
                      </text>
                      <text x="52" y="94" textAnchor="end" className="fill-slate-100 text-[11px] md:text-[12px] font-mono font-black">
                        {formatRevenueYAxis(maxRevW / 2)}
                      </text>
                      <text x="52" y="164" textAnchor="end" className="fill-slate-100 text-[11px] md:text-[12px] font-mono font-black">
                        Rp 0
                      </text>

                      {/* Line/Area Paths and Points logic */}
                      {(() => {
                        const marginL = 60;
                        const endX = 590;
                        const dX = (endX - marginL) / 6;
                        const startY = 160;
                        const maxH = 135;

                        const goalPoints = weeklyData.weeks.map((w, idx) => {
                          const cX = marginL + (idx * dX);
                          const y = startY - ((w.revenueGoal / maxRevW) * maxH);
                          return { x: cX, y };
                        });

                        const realizedPoints = weeklyData.weeks.map((w, idx) => {
                          const cX = marginL + (idx * dX);
                          const y = startY - ((w.revenueRealized / maxRevW) * maxH);
                          return { x: cX, y };
                        });

                        const goalPathD = "M " + goalPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L ");
                        const goalAreaD = `${goalPathD} L ${endX.toFixed(1)},${startY} L ${marginL.toFixed(1)},${startY} Z`;

                        const realizedPathD = "M " + realizedPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L ");
                        const realizedAreaD = `${realizedPathD} L ${endX.toFixed(1)},${startY} L ${marginL.toFixed(1)},${startY} Z`;

                        return (
                          <>
                            <defs>
                              <linearGradient id="areaGradGoalW" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                              </linearGradient>
                              <linearGradient id="areaGradRealizedW" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                              </linearGradient>
                            </defs>

                            {/* Goal Area & Line */}
                            <path d={goalAreaD} fill="url(#areaGradGoalW)" />
                            <path d={goalPathD} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                            {/* Realized Area & Line */}
                            <path d={realizedAreaD} fill="url(#areaGradRealizedW)" />
                            <path d={realizedPathD} fill="none" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

                            {/* Interactive Node circles with large responsive labels */}
                            {weeklyData.weeks.map((w, idx) => {
                              const cX = marginL + (idx * dX);
                              const yGoal = goalPoints[idx].y;
                              const yRealGroup = realizedPoints[idx].y;

                              const toolW = 235;
                              const toolH = 60;
                              const tX = Math.max(10, Math.min(cX - toolW / 2, 620 - toolW - 10));

                              return (
                                <g key={w.id} className="group cursor-help">
                                  {/* Invisible card hover trigger area */}
                                  <rect
                                    x={cX - dX / 2}
                                    y="10"
                                    width={dX}
                                    height="170"
                                    fill="transparent"
                                  />

                                  {/* Vertical indicator guide */}
                                  <line
                                    x1={cX}
                                    y1="25"
                                    x2={cX}
                                    y2="160"
                                    stroke="#64748b"
                                    strokeDasharray="3 3"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  />

                                  {/* Goal point halo & dot */}
                                  <circle cx={cX} cy={yGoal} r="7" className="fill-blue-500/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  <circle cx={cX} cy={yGoal} r="4.5" className="fill-blue-900 stroke-blue-400 stroke-[2.5]" />

                                  {/* Realized point halo & dot */}
                                  <circle cx={cX} cy={yRealGroup} r="7" className="fill-emerald-550/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  <circle cx={cX} cy={yRealGroup} r="4.5" className="fill-slate-950 stroke-emerald-450 stroke-[2.5]" />

                                  {/* Tooltip Display on Hover */}
                                  <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <rect
                                      x={tX}
                                      y="5"
                                      width={toolW}
                                      height={toolH}
                                      rx="10"
                                      fill="#0d1527"
                                      stroke="#1e3a8a"
                                      strokeWidth="2"
                                    />
                                    <text
                                      x={tX + toolW / 2}
                                      y="19"
                                      textAnchor="middle"
                                      className="fill-amber-400 text-[12px] font-black uppercase tracking-wider font-sans"
                                    >
                                      Hari {w.name} ({w.label})
                                    </text>
                                    <text
                                      x={tX + toolW / 2}
                                      y="34"
                                      textAnchor="middle"
                                      className="fill-slate-100 text-[11px] font-mono font-black"
                                    >
                                      Omset: Rp {w.revenueGoal.toLocaleString('id-ID')} ({w.bookingCount} Booking)
                                    </text>
                                    <text
                                      x={tX + toolW / 2}
                                      y="49"
                                      textAnchor="middle"
                                      className="fill-emerald-400 text-[11px] font-mono font-black"
                                    >
                                      Realisasi: Rp {w.revenueRealized.toLocaleString('id-ID')}
                                    </text>
                                  </g>

                                  {/* Legible Bottom X-Axis labels */}
                                  <text
                                    x={cX}
                                    y="178"
                                    textAnchor="middle"
                                    className="fill-slate-100 text-[11px] font-black group-hover:fill-white font-sans transition-colors uppercase"
                                  >
                                    {w.name}
                                  </text>

                                  {/* Mini Calendar range label below */}
                                  <text
                                    x={cX}
                                    y="192"
                                    textAnchor="middle"
                                    className="fill-slate-350 text-[9.5px] font-black tracking-tight group-hover:fill-slate-100 transition-colors font-mono"
                                  >
                                    {w.label}
                                  </text>
                                </g>
                              );
                            })}
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                );
              }
            })()}

          </div>

          <div className="bg-slate-950 p-2.5 rounded-xl text-center text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-wider border border-slate-850 font-mono">
            {activeChartTab === 'bulanan' 
              ? `📊 GRAFIK BULANAN (HARIAN) │ Menampilkan total sewa kotor (biru) vs realisasi bayar (hijau) tanggal 1 sampai ${monthlyData.months.length} untuk bulan ${monthList[selectedMonth].label}` 
              : '📊 GRAFIK MINGGUAN (SENIN - MINGGU) │ Menampilkan pencapaian finansial harian dari hari Senin sampai Minggu'}
          </div>
        </div>

        {/* COLUMN 3: Upcoming Check-Ins list and mini stats */}
        <div className="bg-white rounded-3xl border border-gray-150 p-5 shadow-sm h-full flex flex-col justify-between">
          
          <div className="space-y-4">
            <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Reservasi Mendatang</h3>
                <p className="text-[10px] text-gray-400">Tamu akan check-in terhitung hari ini</p>
              </div>
              <span className="bg-blue-50 text-blue-905 border border-blue-150 rounded-full px-2 py-0.5 text-[9px] font-bold font-mono">
                {recentCheckIns.length} Sesi
              </span>
            </div>

            {/* List scrollbar item */}
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto scrollbar-thin pr-1">
              {recentCheckIns.length === 0 ? (
                <div className="text-center py-12 text-slate-400 border border-dashed border-gray-200 rounded-2xl p-5">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-bold leading-normal text-slate-600">Tidak ada check-in baru</p>
                  <p className="text-[10px] text-slate-400">Seluruh jadwal mendatang kosong untuk saat ini.</p>
                </div>
              ) : (
                recentCheckIns.map(b => {
                  const roomName = roomTypes.find(r => r.id === b.roomId)?.name || b.roomId;

                  return (
                    <div 
                      key={b.id}
                      onClick={() => {
                        onNavigateToTab('kuitansi');
                      }}
                      className="p-3 bg-slate-50/50 hover:bg-slate-50 border border-gray-200/80 rounded-2xl transition-all cursor-pointer flex flex-col justify-between gap-1.5 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-black text-slate-800 text-xs block truncate max-w-[120px] group-hover:text-blue-900 leading-tight">
                          {b.guestName}
                        </span>
                        <span className="font-mono text-[9px] text-gray-400 shrink-0">
                          {b.invoiceNumber}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] font-semibold text-gray-500">
                        <Home className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{roomName}</span>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-150/40 pt-2 text-[10px] text-gray-450 font-bold">
                        <span className="flex items-center gap-1 font-mono text-slate-650">
                          Check-In: {b.checkInDate}
                        </span>
                        <span className={`text-[8px] uppercase tracking-wider px-2 py-0.2 rounded-full border ${
                          b.paymentStatus === 'Lunas'
                            ? 'bg-emerald-50 text-emerald-805 border-emerald-150'
                            : b.paymentStatus === 'DP'
                            ? 'bg-amber-50 text-amber-805 border-amber-150'
                            : 'bg-red-50 text-red-008 border-red-150'
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

          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => onNavigateToTab('booking')}
              className="cursor-pointer text-xs font-black w-full bg-slate-100 hover:bg-slate-200/80 text-slate-700 py-3 rounded-2xl flex items-center justify-center gap-1 transition-all border border-slate-200/50"
            >
              Registrasi Booking Baru
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

      {/* FOOTER SECTION: Visual Map Room Status Today */}
      <div id="room-occupancy-radar" className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm">
        
        <div className="border-b border-gray-100 pb-4 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse block"></span>
              Peta Okupansi Unit Kamar/Villa Hari Ini
            </h3>
            <p className="text-[10px] text-gray-400">Data visualisasi hunian yang sedang berlangsung terhitung tanggal <strong>{formattedToday}</strong></p>
          </div>

          {/* Quick filter labels */}
          <div className="flex items-center gap-3.5 text-[10px] font-bold text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-red-100 border border-red-300 rounded-sm inline-block"></span>
              Terisi / Booked
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-slate-50 border border-gray-200 rounded-sm inline-block"></span>
              Kosong / Tersedia
            </span>
          </div>
        </div>

        {/* Real room map cells */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {roomsOccupancyList.length === 0 ? (
            <div className="col-span-full text-center py-10 text-xs italic text-gray-400">
              Belum ada tipe kamar / villa yang dikonfigurasi. Daftarkan lebih dulu di menu Kelola Kamar.
            </div>
          ) : (
            roomsOccupancyList.map(r => {
              return (
                <div 
                  key={r.id}
                  className={`border rounded-2xl p-4.5 transition-all flex flex-col justify-between gap-3 ${
                    r.isOccupied
                      ? 'bg-red-50/20 border-red-200 text-red-950 shadow-xs'
                      : 'bg-slate-50/40 hover:bg-slate-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="min-w-0">
                      <span className="block text-xs font-black text-slate-900 truncate leading-tight">{r.name}</span>
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider font-mono font-bold">{r.id}</span>
                    </div>

                    <span className={`text-[8px] uppercase tracking-widest font-black px-2 py-0.5 rounded-md border shrink-0 ${
                      r.isOccupied 
                        ? 'bg-red-50 text-red-805 border-red-200' 
                        : 'bg-emerald-50 text-emerald-805 border-emerald-150'
                    }`}>
                      {r.isOccupied ? 'Terisi' : 'KOSONG'}
                    </span>
                  </div>

                  {/* Occupancy profile info */}
                  {r.isOccupied ? (
                    <div className="bg-red-50/60 p-2.5 rounded-xl border border-red-100 flex gap-2 text-[10px] leading-relaxed text-red-900">
                      <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                      <div>
                        Tamu: <strong className="font-extrabold text-red-950">{r.currentGuest || 'Tamu Aktif'}</strong>
                        <span className="block text-[9px] text-red-800/85">Checkout s/d {r.checkOutDate || '-'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-100/50 p-2.5 rounded-xl border border-slate-200/50 flex gap-2 text-[10px] leading-relaxed text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        Unit siap disewakan.
                        <span className="block text-[9px] text-gray-400 font-bold font-mono">Tarif: Rp {r.ratePerNight.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200/40 flex justify-between items-center text-[10px] text-gray-400">
                    <span className="font-semibold">Kapasitas: {r.capacity} Tamu</span>
                    <button
                      onClick={() => {
                        if (r.isOccupied) {
                          onNavigateToTab('kuitansi');
                        } else {
                          onNavigateToTab('booking');
                        }
                      }}
                      className="cursor-pointer text-[9px] font-black text-blue-900 hover:underline hover:text-blue-800"
                    >
                      {r.isOccupied ? 'Detail Tagihan' : 'Sewa Sekarang'}
                    </button>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
}
