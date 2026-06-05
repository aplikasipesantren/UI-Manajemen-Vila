/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Calendar, FileSignature, Receipt, RefreshCw, Layers, ShieldCheck, HelpCircle, Sparkles, Send } from 'lucide-react';

interface SidebarProps {
  activeTab: 'kalender' | 'booking' | 'kuitansi' | 'brosur' | 'konfirmasi';
  setActiveTab: (tab: 'kalender' | 'booking' | 'kuitansi' | 'brosur' | 'konfirmasi') => void;
  onReset: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, onReset }: SidebarProps) {
  const menuItems = [
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
  ];

  return (
    <aside
      id="sidebar-menu"
      className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-950 flex-shrink-0"
    >
      {/* 1. Brand Logo section */}
      <div className="p-6 border-b border-slate-950/60 flex items-center gap-3">
        <div className="p-2.5 bg-blue-900 text-white rounded-xl shadow-inner font-serif font-black text-xl leading-none">
          VIH
        </div>
        <div>
          <h2 className="font-extrabold text-sm text-white tracking-widest uppercase">INDAH HARMONI</h2>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">MANAGEMENT SYSTEM</span>
        </div>
      </div>

      {/* 2. Interactive Menu Tabs */}
      <nav className="flex-1 p-4 space-y-2.5">
        <span className="block text-[10px] text-slate-550 font-bold tracking-widest uppercase px-3.5 mb-2.5">
          MENU UTAMA
        </span>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`tab-btn-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`cursor-pointer w-full text-left px-3.5 py-3 rounded-xl flex items-center gap-3.5 transition-all group relative ${
                isActive
                  ? 'bg-blue-900 text-white font-bold shadow-md shadow-blue-900/10'
                  : 'hover:bg-slate-800 text-slate-400 font-medium hover:text-slate-205'
              }`}
            >
              <div
                className={`p-1.5 rounded-lg transition-colors ${
                  isActive ? 'bg-blue-800 text-blue-200' : 'bg-slate-800 text-slate-500 group-hover:text-slate-305'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-xs truncate tracking-wide">{item.label}</span>
                <span
                  className={`block text-[9px] truncate transition-colors ${
                    isActive ? 'text-blue-200 font-normal' : 'text-slate-600 font-light'
                  }`}
                >
                  {item.sublabel}
                </span>
              </div>
              
              {/* Highlight sidebar pill marker */}
              {isActive && (
                <div className="absolute right-0 top-1/4 bottom-1/4 w-1 bg-white rounded-l-md"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* 3. Sidebar Footer actions (System actions & reset states) */}
      <div className="p-4 border-t border-slate-950/45 space-y-4 text-xs font-medium">
        <span className="block text-[10px] text-slate-550 font-bold tracking-widest uppercase px-3.5">
          ADMIN ACTIONS
        </span>

        {/* Demo reset database action */}
        <button
          onClick={onReset}
          id="btn-sidebar-reset"
          className="cursor-pointer w-full px-3.5 py-2.5 bg-slate-850 hover:bg-slate-800 border border-slate-950 hover:border-slate-800 hover:text-slate-200 text-slate-400 rounded-lg flex items-center justify-center gap-2 transition-all font-semibold outline-none"
          title="Reset database data to original seeds"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-505" />
          Reset Demo Data
        </button>

        {/* System Ledger verification info */}
        <div className="bg-slate-950/30 p-3 rounded-lg border border-slate-950/10 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            OFFLINE DATABASE
          </div>
          <p className="text-[9px] text-slate-505 leading-relaxed font-light">
            Sistem berjalan lurus pada browser local. Tiada data terkirim keluar demi privasi & kecepatan penuh.
          </p>
        </div>
      </div>
    </aside>
  );
}
