/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  FileSignature, 
  Receipt, 
  RefreshCw, 
  Layers, 
  ShieldCheck, 
  HelpCircle, 
  Sparkles, 
  Send, 
  LogOut, 
  Users, 
  BarChart, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Home,
  LayoutDashboard,
  ShoppingCart
} from 'lucide-react';

interface SidebarProps {
  activeTab: 'dashboard' | 'kalender' | 'booking' | 'kuitansi' | 'brosur' | 'konfirmasi' | 'pelanggan' | 'kamar' | 'laporan' | 'setting' | 'kasir';
  setActiveTab: (tab: 'dashboard' | 'kalender' | 'booking' | 'kuitansi' | 'brosur' | 'konfirmasi' | 'pelanggan' | 'kamar' | 'laporan' | 'setting' | 'kasir') => void;
  onReset: () => void;
  onLogout: () => void;
  logoInitials?: string;
  namaLembaga?: string;
  logoUrl?: string;
}

const DEFAULT_LOGO_SVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none'><rect width='100' height='100' rx='24' fill='%231e3a8a'/><path d='M25 55 L50 30 L75 55 Z' fill='%2360a5fa'/><rect x='32' y='55' width='36' height='25' fill='%23ffffff'/><rect x='44' y='63' width='12' height='17' fill='%231e3a8a'/><circle cx='50' cy='43' r='5' fill='%23f59e0b'/></svg>";

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  onReset, 
  onLogout,
  logoInitials = 'VIH',
  namaLembaga = 'INDAH HARMONI',
  logoUrl
}: SidebarProps) {
  
  // Responsive check for default tablet minimized state
  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    const saved = localStorage.getItem('sidebar_minimized');
    if (saved !== null) {
      return saved === 'true';
    }
    // Default to minimized when first opened on all device sizes
    return true;
  });

  // Save changes to localStorage
  const handleToggleMinimize = () => {
    const nextState = !isMinimized;
    setIsMinimized(nextState);
    localStorage.setItem('sidebar_minimized', String(nextState));
  };

  // Automatically listen to window resize to adapt for tablet viewports
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && window.innerWidth < 1024) {
        // Auto-minimize on tablet as default
        setIsMinimized(true);
      } else if (window.innerWidth >= 1024) {
        // Respect saved state or default to minimized state if not yet configured
        const saved = localStorage.getItem('sidebar_minimized');
        if (saved !== null) {
          setIsMinimized(saved === 'true');
        } else {
          setIsMinimized(true);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard Analitik',
      sublabel: 'Grafik bulanan & okupansi',
      icon: LayoutDashboard,
    },
    {
      id: 'kalender' as const,
      label: 'Kalender Ketersediaan',
      sublabel: 'Status harian & alokasi',
      icon: Calendar,
    },
    {
      id: 'booking' as const,
      label: 'Registrasi Booking',
      sublabel: 'Penerimaan pesanan baru',
      icon: FileSignature,
    },
    {
      id: 'kasir' as const,
      label: 'POS Kasir Booking',
      sublabel: 'Pencatatan kasir cepat',
      icon: ShoppingCart,
    },
    {
      id: 'kuitansi' as const,
      label: 'Kuitansi Digital',
      sublabel: 'Cetak fisik & bukti lunas',
      icon: Receipt,
    },
    {
      id: 'brosur' as const,
      label: 'Brosur AI Promosi',
      sublabel: 'Pemasaran cerdas Gemini',
      icon: Sparkles,
    },
    {
      id: 'konfirmasi' as const,
      label: 'Konfirmasi Tagihan',
      sublabel: 'Rincian billing & WA',
      icon: Send,
    },
    {
      id: 'pelanggan' as const,
      label: 'Database Pelanggan',
      sublabel: 'Kelola profile tamu',
      icon: Users,
    },
    {
      id: 'kamar' as const,
      label: 'Kelola Kamar/Villa',
      sublabel: 'Unit, tarif & kapasitas',
      icon: Home,
    },
    {
      id: 'laporan' as const,
      label: 'Laporan Transaksi',
      sublabel: 'Jurnal, omset & grafik',
      icon: BarChart,
    },
    {
      id: 'setting' as const,
      label: 'Setting Aplikasi',
      sublabel: 'Identitas & WA Baileys',
      icon: Settings,
    },
  ];

  return (
    <aside
      id="sidebar-menu"
      className={`w-full bg-blue-950 text-slate-200 flex flex-col border-r border-blue-950 flex-shrink-0 transition-all duration-300 ease-in-out ${
        isMinimized ? 'md:w-20' : 'md:w-64'
      }`}
    >
      {/* 1. Header & Brand Logo section */}
      <div className={`p-4 md:p-5 border-b border-blue-900/30 flex items-center justify-between transition-all duration-300 ${
        isMinimized ? 'md:justify-center md:flex-col gap-3' : 'gap-2'
      }`}>
        <div className="flex items-center justify-center min-w-0">
          <img
            src={logoUrl || DEFAULT_LOGO_SVG}
            alt="Brand Logo"
            className={`object-contain rounded-xl shadow-md transition-all duration-300 ${
              isMinimized ? 'max-h-10 w-10 md:max-h-12 md:w-12' : 'max-h-11 md:max-h-12 w-auto'
            }`}
          />
          {!isMinimized && (
            <div className="ml-3 min-w-0">
              <span className="block text-xs font-black text-white uppercase tracking-wider truncate">
                {logoInitials} SYSTEM
              </span>
              <span className="block text-[8px] text-slate-500 font-extrabold uppercase tracking-widest truncate">
                {namaLembaga.substring(0, 16)}
              </span>
            </div>
          )}
        </div>

        {/* Manual minimize/expand trigger button (Visible on MD viewports and up) */}
        <button
          type="button"
          onClick={handleToggleMinimize}
          className="cursor-pointer hidden md:flex items-center justify-center p-2 rounded-xl bg-blue-900/50 hover:bg-blue-900/80 text-blue-200 hover:text-white border border-blue-800/30 shadow-inner transition-colors outline-none"
          title={isMinimized ? "Perluas Sidebar" : "Sembunyikan Sidebar"}
        >
          {isMinimized ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* 2. Interactive Menu Tabs */}
      <nav className="flex-1 p-3 space-y-2 overflow-y-auto adaptive-scrollbar">
        {!isMinimized ? (
          <span className="block text-[10px] text-blue-200/50 font-bold tracking-widest uppercase px-3.5 mb-2.5 animate-fade-in">
            MENU UTAMA
          </span>
        ) : (
          <div className="h-4 flex items-center justify-center">
            <div className="w-6 h-px bg-blue-900/30"></div>
          </div>
        )}

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`tab-btn-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              title={isMinimized ? item.label : undefined}
              className={`cursor-pointer w-full text-left rounded-xl flex items-center transition-all group relative ${
                isMinimized ? 'p-2 justify-center' : 'px-3.5 py-2.5 gap-3'
              } ${
                isActive
                  ? 'bg-blue-900 text-white font-bold shadow-md shadow-blue-950/40'
                  : 'hover:bg-blue-900/40 text-blue-200/70 font-medium hover:text-white'
              }`}
            >
              <div
                className={`rounded-lg transition-colors shrink-0 ${
                  isMinimized ? 'p-2.5' : 'p-1.5'
                } ${
                  isActive ? 'bg-blue-850 text-blue-200' : 'bg-blue-900/30 text-blue-300/60 group-hover:text-blue-200'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
              </div>
              
              {!isMinimized && (
                <div className="flex-1 min-w-0 animate-fade-in">
                  <span className="block text-xs truncate tracking-wide font-bold">{item.label}</span>
                  <span
                    className={`block text-[9px] truncate transition-colors ${
                      isActive ? 'text-blue-200 font-normal' : 'text-blue-300/40 font-light'
                    }`}
                  >
                    {item.sublabel}
                  </span>
                </div>
              )}
              
              {/* Highlight sidebar pill marker */}
              {isActive && (
                <div className="absolute right-0 top-1/4 bottom-1/4 w-1 bg-white rounded-l-md"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* 3. Sidebar Footer actions (System actions & reset states) */}
      <div className={`p-3 border-t border-blue-900/30 space-y-2.5 text-xs font-medium ${isMinimized ? 'flex flex-col items-center' : ''}`}>
        {!isMinimized && (
          <span className="block text-[10px] text-blue-200/50 font-bold tracking-widest uppercase px-3.5 animate-fade-in">
            KONTROL UTAMA
          </span>
        )}

        {/* Demo reset database action */}
        <button
          onClick={onReset}
          id="btn-sidebar-reset"
          className={`cursor-pointer bg-blue-900/20 hover:bg-blue-900/50 border border-blue-900/40 hover:text-white text-blue-200/80 rounded-xl flex items-center justify-center transition-all font-bold outline-none ${
            isMinimized ? 'p-3 w-11 h-11' : 'w-full px-3.5 py-2.5 gap-2'
          }`}
          title="Reset Demo Data"
        >
          <RefreshCw className="w-4 h-4 shrink-0 text-blue-300/60" />
          {!isMinimized && <span className="truncate">Reset Demo Data</span>}
        </button>

        {/* Logout action */}
        <button
          onClick={onLogout}
          id="btn-sidebar-logout"
          className={`cursor-pointer bg-red-950/20 hover:bg-red-950/40 border border-red-950 hover:border-red-900 text-red-400 hover:text-red-300 rounded-xl flex items-center justify-center transition-all font-bold outline-none ${
            isMinimized ? 'p-3 w-11 h-11' : 'w-full px-3.5 py-2.5 gap-2'
          }`}
          title="Keluar dari Sistem"
        >
          <LogOut className="w-4 h-4 shrink-0 text-red-500" />
          {!isMinimized && <span className="truncate">Keluar Sistem</span>}
        </button>

        {/* System Ledger verification info (Hide when minimized to maintain clean space) */}
        {!isMinimized && (
          <div className="bg-blue-900/10 p-3 rounded-xl border border-blue-900/20 space-y-1 animate-fade-in">
            <div className="flex items-center gap-1.5 text-blue-200/80 text-[10px] uppercase font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              OFFLINE DATABASE
            </div>
            <p className="text-[9px] text-blue-300/50 leading-relaxed font-normal">
              Sistem beroperasi mandiri pada browser lokal tanpa sinkronisasi internet eksternal.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
