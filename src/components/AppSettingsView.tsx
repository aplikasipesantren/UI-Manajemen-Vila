/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppSettings } from '../types';
import { 
  Building, 
  MapPin, 
  Image, 
  Smartphone, 
  Save, 
  RefreshCw, 
  Terminal, 
  QrCode, 
  Landmark, 
  ChevronRight,
  Info,
  Phone
} from 'lucide-react';

const DEFAULT_LOGO_SVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none'><rect width='100' height='100' rx='24' fill='%231e3a8a'/><path d='M25 55 L50 30 L75 55 Z' fill='%2360a5fa'/><rect x='32' y='55' width='36' height='25' fill='%23ffffff'/><rect x='44' y='63' width='12' height='17' fill='%231e3a8a'/><circle cx='50' cy='43' r='5' fill='%23f59e0b'/></svg>";

interface AppSettingsViewProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
}

type SubTab = 'identitas' | 'whatsapp' | 'bank';

export default function AppSettingsView({ settings: initialSettings, onSaveSettings }: AppSettingsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('identitas');

  // Identitas states
  const [logoUrl, setLogoUrl] = useState(initialSettings.logoUrl || '');
  const [logoInitials, setLogoInitials] = useState(initialSettings.logoInitials || 'VIH');
  const [namaLembaga, setNamaLembaga] = useState(initialSettings.namaLembaga || 'Villa Indah Harmoni');
  const [alamat, setAlamat] = useState(initialSettings.alamat || 'Jl. Raya Selecta No. 12, Kota Batu, Jawa Timur');
  const [kontakPhone, setKontakPhone] = useState(initialSettings.kontakPhone || '+62 811-2233-4455');
  
  // Bank Transfer states
  const [bankOwner, setBankOwner] = useState(initialSettings.bankOwner || 'VILLA INDAH HARMONI AGUNG');
  const [bankNoRek, setBankNoRek] = useState(initialSettings.bankNoRek || '123-4567-890');
  const [bankName, setBankName] = useState(initialSettings.bankName || 'BCA (Bank Central Asia)');
  
  // Baileys WhatsApp Gateway setup state
  const [baileysStatus, setBaileysStatus] = useState<'CONNECTED' | 'DISCONNECTED' | 'CONNECTING'>(initialSettings.baileysStatus || 'DISCONNECTED');
  const [baileysPhone, setBaileysPhone] = useState(initialSettings.baileysPhone || '0812-3456-7890');
  const [baileysSessionName, setBaileysSessionName] = useState(initialSettings.baileysSessionName || 'vih_main_session');
  const [baileysAutoReply, setBaileysAutoReply] = useState(initialSettings.baileysAutoReply || false);
  const [baileysWebhookUrl, setBaileysWebhookUrl] = useState(initialSettings.baileysWebhookUrl || 'http://localhost:3000/api/webhook/baileys');
  const [baileysIsPaired, setBaileysIsPaired] = useState(initialSettings.baileysIsPaired || false);

  // Terminal Logs simulator
  const [logs, setLogs] = useState<string[]>([
    'SYSTEM: Baileys library loaded. Waiting for user to initialize socket session.'
  ]);
  const [pairingType] = useState<'qr' | 'code'>('qr');
  const [, setPairingCode] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [isSimulatingConnect, setIsSimulatingConnect] = useState(false);

  const writeLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('id-ID');
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const handleMulaiKoneksi = () => {
    if (baileysStatus === 'CONNECTED') {
      alert('Koneksi WhatsApp Gateway sudah aktif terhubung!');
      return;
    }

    setIsSimulatingConnect(true);
    setBaileysStatus('CONNECTING');
    writeLog(`[Baileys Socket] initializing connection script for session "${baileysSessionName}"...`);
    
    // Simulate Baileys initialization sequence step-by-step
    setTimeout(() => {
      writeLog('[Baileys Socket] Multi-Device connection established. Scanning auth state...');
    }, 1000);

    setTimeout(() => {
      writeLog('[Baileys Auth] Credentials not found! Prompting pairing QR code generation...');
      setShowQR(true);
      if (pairingType === 'code') {
        const randCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        setPairingCode(randCode);
        writeLog(`[Baileys Auth] Pairing code requested: ${randCode}`);
      }
    }, 2200);
  };

  const handleSimulateQRScan = () => {
    if (baileysStatus !== 'CONNECTING') return;
    
    writeLog('[Baileys Scanner] QR scanned on device. Verifying signature...');
    setShowQR(false);

    setTimeout(() => {
      writeLog(`[Baileys Session] Login successful as "${namaLembaga} Admin"`);
      writeLog(`[Baileys Socket] Connection status updated to CONNECTED.`);
      setBaileysStatus('CONNECTED');
      setBaileysIsPaired(true);
      setIsSimulatingConnect(false);
    }, 1200);
  };

  const handleDisconnect = () => {
    if (window.confirm('Apakah Anda yakin ingin memutuskan koneksi WhatsApp Gateway (Baileys)?')) {
      setBaileysStatus('DISCONNECTED');
      setBaileysIsPaired(false);
      setShowQR(false);
      writeLog('[Baileys Session] Socket closed manually. Session data remains cached.');
    }
  };

  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const newSettings: AppSettings = {
      logoUrl,
      logoInitials: logoInitials.toUpperCase().substring(0, 4),
      namaLembaga,
      alamat,
      baileysStatus,
      baileysPhone,
      baileysSessionName,
      baileysAutoReply,
      baileysWebhookUrl,
      baileysIsPaired,
      bankOwner,
      bankNoRek,
      bankName,
      kontakPhone
    };

    onSaveSettings(newSettings);
    alert('Seluruh konfigurasi & pengaturan sukses disimpan secara tersinkronisasi!');
  };

  const handleClearLogs = () => {
    setLogs([`SYSTEM: Logs cleared. Status: ${baileysStatus}`]);
  };

  return (
    <div id="settings-view-panel" className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[580px] animate-scale-up">
      
      {/* 1. SEBELAH KIRI: Side tab buttons list */}
      <div className="w-full md:w-64 bg-slate-50 border-b md:border-b-0 md:border-r border-gray-150 p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-4">
          <div className="px-2">
            <span className="block text-[9px] font-black text-blue-900 uppercase tracking-widest">NAVIGASI PENGATURAN</span>
            <p className="text-[10px] text-gray-400 font-medium">Klik tab untuk beralih</p>
          </div>
          
          <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-3 md:pb-0 scrollbar-none">
            {/* tab identitas */}
            <button
              type="button"
              onClick={() => setActiveSubTab('identitas')}
              className={`cursor-pointer w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-left text-xs font-bold transition-all shrink-0 ${
                activeSubTab === 'identitas'
                  ? 'bg-blue-900 text-white shadow-md shadow-blue-900/10'
                  : 'text-slate-650 hover:bg-slate-200/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Building className="w-4 h-4 shrink-0" />
                <span>Identitas Lembaga</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 hidden md:block opacity-60 ${activeSubTab === 'identitas' ? 'translate-x-0.5 transition-transform' : ''}`} />
            </button>

            {/* tab wa gateway */}
            <button
              type="button"
              onClick={() => setActiveSubTab('whatsapp')}
              className={`cursor-pointer w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-left text-xs font-bold transition-all shrink-0 ${
                activeSubTab === 'whatsapp'
                  ? 'bg-blue-900 text-white shadow-md shadow-blue-900/10'
                  : 'text-slate-650 hover:bg-slate-200/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-4 h-4 shrink-0" />
                <span>WhatsApp (Baileys)</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 hidden md:block opacity-60 ${activeSubTab === 'whatsapp' ? 'translate-x-0.5 transition-transform' : ''}`} />
            </button>

            {/* tab bank */}
            <button
              type="button"
              onClick={() => setActiveSubTab('bank')}
              className={`cursor-pointer w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-left text-xs font-bold transition-all shrink-0 ${
                activeSubTab === 'bank'
                  ? 'bg-blue-900 text-white shadow-md shadow-blue-900/10'
                  : 'text-slate-650 hover:bg-slate-200/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Landmark className="w-4 h-4 shrink-0" />
                <span>Rekening Bank</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 hidden md:block opacity-60 ${activeSubTab === 'bank' ? 'translate-x-0.5 transition-transform' : ''}`} />
            </button>
          </nav>
        </div>

        {/* Info panel in the sidebar for branding preview */}
        <div className="hidden md:block bg-slate-100 border border-slate-200/60 p-3.5 rounded-2xl mt-8">
          <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2.5">PRATINJAU SIDEBAR:</span>
          <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-col items-center justify-center border border-slate-950">
            <img
              src={logoUrl || DEFAULT_LOGO_SVG}
              alt="Logo Baru"
              className="max-h-12 w-auto object-contain rounded-lg shadow-md mb-2"
            />
            <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest text-center truncate w-full" title={namaLembaga}>
              {namaLembaga}
            </span>
          </div>
        </div>
      </div>

      {/* 2. SEBELAH KANAN: Form & Controls Area */}
      <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between">
        <form onSubmit={(e) => { e.preventDefault(); handleSaveAll(); }} className="space-y-6 flex-1">
          
          {/* TAB 1: IDENTITAS */}
          {activeSubTab === 'identitas' && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-gray-100 pb-3 flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-905 rounded-xl">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Identitas Utama Lembaga</h2>
                  <p className="text-[10px] text-gray-400">Sesuaikan nama instansi, logo grafik, dan ketetapan identitas kuitansi resmi</p>
                </div>
              </div>

              {/* Nama Lembaga */}
              <div className="space-y-1.5">
                <label htmlFor="set-nama-lembaga" className="block text-[10px] font-bold text-gray-550 uppercase tracking-widest">
                  Nama Lembaga / Instansi *
                </label>
                <input
                  id="set-nama-lembaga"
                  type="text"
                  required
                  value={namaLembaga}
                  onChange={(e) => setNamaLembaga(e.target.value)}
                  placeholder="Contoh: Villa Indah Harmoni"
                  className="w-full text-xs px-3.5 py-3 border border-gray-200 outline-none rounded-xl focus:border-blue-900 focus:ring-1 focus:ring-blue-900/10 bg-slate-50/50 text-gray-800 font-bold"
                />
              </div>

              {/* Kontak / Nomor WhatsApp */}
              <div className="space-y-1.5">
                <label htmlFor="set-kontak-phone" className="block text-[10px] font-bold text-gray-550 uppercase tracking-widest flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  Kontak / Nomor WhatsApp Resmi *
                </label>
                <input
                  id="set-kontak-phone"
                  type="text"
                  required
                  value={kontakPhone}
                  onChange={(e) => setKontakPhone(e.target.value)}
                  placeholder="Contoh: +62 811-2233-4455"
                  className="w-full text-xs px-3.5 py-3 border border-gray-200 outline-none rounded-xl focus:border-blue-900 focus:ring-1 focus:ring-blue-900/10 bg-slate-50/50 text-gray-800 font-bold"
                />
              </div>

              {/* Form Upload Gambar Logo (Base64) option */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-550 uppercase tracking-widest flex items-center gap-1">
                  <Image className="w-3.5 h-3.5 text-gray-400" />
                  Logo Gambar Instansi (Upload Gambar) *
                </label>
                
                {logoUrl ? (
                  <div className="relative border border-gray-150 rounded-2xl p-4 bg-slate-50/50 flex flex-col items-center justify-center gap-2">
                    <img 
                      src={logoUrl} 
                      alt="Logo Preview" 
                      className="max-h-24 w-auto object-contain rounded-lg shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="mt-1 cursor-pointer text-[10px] font-black text-red-600 bg-red-50 hover:bg-red-100/80 border border-red-200 px-3 py-1.5 rounded-xl transition-all"
                    >
                      Hapus & Ganti Gambar Logo
                    </button>
                  </div>
                ) : (
                  <div className="border bg-slate-50/20 hover:bg-slate-50/60 border-gray-200 border-dashed rounded-2xl p-6 transition-all duration-200 flex flex-col items-center justify-center gap-3">
                    <div className="p-3 bg-blue-50 text-blue-900 rounded-2xl shadow-xs border border-blue-100">
                      <Image className="w-6 h-6 leading-none" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-xs font-semibold text-gray-750">Pilih berkas gambar logo lembaga Anda</p>
                      <p className="text-[10px] text-gray-400">Rekomendasi format PNG/JPG dengan resolusi persegi (Maks 1MB)</p>
                    </div>
                    <label className="cursor-pointer bg-white hover:bg-gray-100 border border-gray-200 text-gray-750 text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all">
                      Pilih Berkas Logo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) {
                                setLogoUrl(event.target.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Alamat Lembaga */}
              <div className="space-y-1.5">
                <label htmlFor="set-alamat" className="block text-[10px] font-bold text-gray-550 uppercase tracking-widest flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  Alamat Lengkap Kantor / Lokasi *
                </label>
                <textarea
                  id="set-alamat"
                  rows={3}
                  required
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  placeholder="Contoh: Jl Raya Selecta No 12, Bumiaji, Kota Batu"
                  className="w-full text-xs px-3.5 py-2.5 border border-gray-200 outline-none rounded-xl focus:border-blue-900 focus:ring-1 focus:ring-blue-900/10 bg-slate-50/50 text-gray-800 font-medium resize-none leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* TAB 2: WHATSAPP GATEWAY */}
          {activeSubTab === 'whatsapp' && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-gray-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">WhatsApp Web Service (Baileys)</h2>
                    <p className="text-[10px] text-gray-400">Konfigurasi daemon socket socket API pengiriman kuitansi otomatis</p>
                  </div>
                </div>

                <span className={`text-[9px] uppercase font-bold px-2.5 py-1 rounded-full border shrink-0 flex items-center gap-1 ${
                  baileysStatus === 'CONNECTED'
                    ? 'bg-emerald-50 text-emerald-850 border-emerald-200'
                    : baileysStatus === 'CONNECTING'
                    ? 'bg-amber-50 text-amber-850 border-amber-200 animate-pulse'
                    : 'bg-red-50 text-red-850 border-red-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    baileysStatus === 'CONNECTED'
                      ? 'bg-emerald-500 animate-pulse'
                      : baileysStatus === 'CONNECTING'
                      ? 'bg-primary-500'
                      : 'bg-red-500'
                  }`}></span>
                  {baileysStatus === 'CONNECTED' ? 'ONLINE (BAILEYS)' : baileysStatus === 'CONNECTING' ? 'MENCARI SINYAL' : 'OFFLINE'}
                </span>
              </div>

              {/* Simple parameter forms for Baileys */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="set-wa-phone" className="block text-[10px] text-gray-550 font-bold uppercase tracking-wider">
                    Nomor Gateway WA Terdaftar
                  </label>
                  <input
                    id="set-wa-phone"
                    type="text"
                    value={baileysPhone}
                    onChange={(e) => setBaileysPhone(e.target.value)}
                    placeholder="0812-3456-7890"
                    className="w-full bg-slate-50 border border-gray-200 text-gray-805 outline-none p-2.5 rounded-xl text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="set-wa-session" className="block text-[10px] text-gray-550 font-bold uppercase tracking-wider">
                    Nama Sesi Keamanan auth
                  </label>
                  <input
                    id="set-wa-session"
                    type="text"
                    value={baileysSessionName}
                    onChange={(e) => setBaileysSessionName(e.target.value)}
                    placeholder="vih_main_session"
                    className="w-full bg-slate-50 border border-gray-200 text-gray-805 outline-none p-2.5 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              {/* Webhook Url callback */}
              <div className="space-y-1.5">
                <label htmlFor="set-wa-webhook" className="block text-[10px] text-gray-550 font-bold uppercase tracking-wider">
                  URL Webhook Payload Callback (API Event)
                </label>
                <input
                  id="set-wa-webhook"
                  type="text"
                  value={baileysWebhookUrl}
                  onChange={(e) => setBaileysWebhookUrl(e.target.value)}
                  placeholder="https://domain-anda.com/api/webhook/baileys"
                  className="w-full bg-slate-50 border border-gray-200 text-gray-805 outline-none p-2.5 rounded-xl text-xs font-mono"
                />
              </div>

              {/* Auto Reply toggle */}
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-gray-150">
                <div>
                  <span className="block text-[11px] font-bold text-gray-800">Aktifkan Auto-Reply Pesan Instan</span>
                  <p className="text-[9px] text-gray-400">Balas otomatis chat WA bila konsumen meminta link kuitansi</p>
                </div>
                <button
                  type="button"
                  onClick={() => setBaileysAutoReply(!baileysAutoReply)}
                  className="cursor-pointer text-emerald-500 select-none"
                >
                  <span className={`inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ${
                    baileysAutoReply ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}>
                    <span className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ${
                      baileysAutoReply ? 'translate-x-4' : 'translate-x-0'
                    }`}></span>
                  </span>
                </button>
              </div>

              {/* Baileys WebSocket simulation and console trace */}
              <div className="bg-slate-900 text-slate-300 rounded-2xl p-4 space-y-4 shadow-inner border border-slate-950">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-[10px] text-slate-400 font-bold tracking-wider">KONTROL AKTIVASI BAILEYS WEB:</span>
                  
                  <div className="flex items-center gap-2">
                    {baileysStatus === 'DISCONNECTED' && (
                      <button
                        type="button"
                        onClick={handleMulaiKoneksi}
                        className="cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-wider px-3.5 py-2 rounded-xl flex items-center gap-1 transition-all outline-none"
                      >
                        <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                        Mulai Koneksi Baileys
                      </button>
                    )}
                    {baileysStatus === 'CONNECTING' && (
                      <button
                        type="button"
                        onClick={handleDisconnect}
                        className="cursor-pointer bg-amber-500 hover:bg-amber-450 text-slate-950 font-black text-[10px] uppercase tracking-wider px-3.5 py-2 rounded-xl flex items-center transition-all outline-none"
                      >
                        Batal
                      </button>
                    )}
                    {baileysStatus === 'CONNECTED' && (
                      <button
                        type="button"
                        onClick={handleDisconnect}
                        className="cursor-pointer bg-red-650 hover:bg-red-600 text-white font-black text-[10px] uppercase tracking-wider px-3.5 py-2 rounded-xl flex items-center transition-all outline-none"
                      >
                        Putuskan Koneksi Sesi
                      </button>
                    )}
                  </div>
                </div>

                {showQR && (
                  <div className="p-3 bg-white rounded-xl flex flex-col items-center justify-center max-w-[160px] mx-auto text-center space-y-2 border border-slate-700 animate-scale-up">
                    <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest">PINDAI QR WA</span>
                    <div className="relative p-1 bg-slate-50 rounded-lg flex items-center justify-center aspect-square w-24 h-24">
                      <QrCode className="w-20 h-20 text-slate-900" />
                    </div>
                    <button
                      type="button"
                      onClick={handleSimulateQRScan}
                      className="cursor-pointer text-[8px] font-black bg-emerald-100 border border-emerald-200 text-emerald-800 px-2 py-1.5 rounded-lg hover:bg-emerald-200 transition-colors uppercase tracking-widest w-full"
                    >
                      ✔ Sudah Scan (Simulasi)
                    </button>
                  </div>
                )}

                {/* Console Output logs simulated */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[9px] text-slate-500 font-bold uppercase">
                    <span className="flex items-center gap-1">
                      <Terminal className="w-3 h-3 text-slate-400" />
                      Live Console Logs Stream
                    </span>
                    <button
                      type="button"
                      onClick={handleClearLogs}
                      className="hover:text-slate-350 cursor-pointer font-extrabold"
                    >
                      [CLEAR]
                    </button>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[9px] font-mono text-emerald-440 space-y-0.5 h-24 overflow-y-auto scrollbar-thin text-left leading-relaxed">
                    {logs.map((log, idx) => (
                      <div key={idx} className="truncate select-text">{log}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: REKENING BANK */}
          {activeSubTab === 'bank' && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-gray-100 pb-3 flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-800 rounded-xl">
                  <Landmark className="w-5 h-5 text-emerald-800" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Informasi Rekening Pembayaran</h2>
                  <p className="text-[10px] text-gray-400">Rincian rekening bank utama yang akan dicantumkan pada kuitansi & konfirmasi tagihan</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nama Bank */}
                <div className="space-y-1.5">
                  <label htmlFor="set-bank-name" className="block text-[10px] font-bold text-gray-550 uppercase tracking-widest">
                    Nama Bank Utama *
                  </label>
                  <input
                    id="set-bank-name"
                    type="text"
                    required
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Contoh: BCA / Mandiri / BRI / BNI"
                    className="w-full text-xs px-3.5 py-3 border border-gray-200 outline-none rounded-xl focus:border-blue-900 focus:ring-1 focus:ring-blue-900/10 bg-slate-50/50 text-gray-800 font-bold"
                  />
                </div>

                {/* Nomor Rekening */}
                <div className="space-y-1.5">
                  <label htmlFor="set-bank-norek" className="block text-[10px] font-bold text-gray-550 uppercase tracking-widest">
                    Nomor Rekening Bank *
                  </label>
                  <input
                    id="set-bank-norek"
                    type="text"
                    required
                    value={bankNoRek}
                    onChange={(e) => setBankNoRek(e.target.value)}
                    placeholder="Contoh: 123-4567-890"
                    className="w-full text-xs px-3.5 py-3 border border-gray-200 outline-none rounded-xl focus:border-blue-900 focus:ring-1 focus:ring-blue-900/10 bg-slate-50/50 text-gray-850 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Pemilik Rekening */}
              <div className="space-y-1.5">
                <label htmlFor="set-bank-owner" className="block text-[10px] font-bold text-gray-550 uppercase tracking-widest">
                  Nama Lengkap Pemilik Rekening *
                </label>
                <input
                  id="set-bank-owner"
                  type="text"
                  required
                  value={bankOwner}
                  onChange={(e) => setBankOwner(e.target.value)}
                  placeholder="Contoh: CV Wisata Indah Sentosa / Nama Pemilik"
                  className="w-full text-xs px-3.5 py-3 border border-gray-200 outline-none rounded-xl focus:border-blue-900 focus:ring-1 focus:ring-blue-900/10 bg-slate-50/50 text-gray-800 font-bold"
                />
              </div>

              {/* Informational Hint Card */}
              <div className="bg-emerald-50/50 border border-emerald-150 rounded-2xl p-4 flex gap-3 text-emerald-950">
                <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold leading-none">Otomasi billing terpadu</h4>
                  <p className="text-[10px] leading-relaxed text-emerald-800">
                    Nilai rekening di atas akan langsung dipasang pada modul pembayaran di menu <strong>Konfirmasi Tagihan</strong> serta tersemat di seluruh pesan konfirmasi WhatsApp pelanggan demi memudahkan proses verifikasi transfer dana atau deposit pemesanan (DP).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Unified sticky-like Save configuration bottom footer layout */}
          <div className="pt-5 mt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[10px] text-gray-400 font-medium text-center sm:text-left">
              * Seluruh perubahan yang disimpan akan langsung direfleksikan sekujur sistem secara realtime.
            </p>
            <button
              type="button"
              onClick={() => handleSaveAll()}
              className="cursor-pointer text-xs font-black text-white bg-blue-900 hover:bg-blue-850 px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-blue-900/10 active:scale-95"
            >
              <Save className="w-4 h-4" />
              Simpan Semua Pengaturan
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
