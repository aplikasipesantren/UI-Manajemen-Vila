/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, Lock, User, Eye, EyeOff, AlertCircle, Sparkles, Building } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (adminName: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Silakan masukkan username dan password Anda.');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Simulate luxury credential check with brief elegant loading
    setTimeout(() => {
      const lowerUser = username.trim().toLowerCase();
      const pass = password;

      if ((lowerUser === 'admin' && pass === 'admin123') || (lowerUser === 'admin' && pass === 'password')) {
        // Successful login
        setIsLoading(false);
        onLoginSuccess('Irwan Setiawan');
      } else {
        setIsLoading(false);
        setError('Unggal Sandi/Username Salah! Silakan coba lagi atau gunakan petunjuk di bawah.');
      }
    }, 850);
  };

  const handleUseDemoCredentials = () => {
    setUsername('admin');
    setPassword('admin123');
    setError(null);
  };

  return (
    <div id="login-module-container" className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      
      {/* Aesthetic glowing background patterns */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-yellow-600/10 blur-[120px] pointer-events-none"></div>
      
      {/* Decorative refined thin gird lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none"></div>

      <div className="w-full max-w-5xl relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch bg-slate-900/50 backdrop-blur-md rounded-3xl border border-slate-800 p-6 sm:p-8 md:p-10 shadow-2xl">
        
        {/* LEFT COLUMN: Luxurious Brand Display & System Modules (6/12 columns on large screen) */}
        <div className="md:col-span-6 flex flex-col justify-between space-y-8 pr-0 md:pr-6 border-b md:border-b-0 md:border-r border-slate-850 pb-8 md:pb-0">
          
          <div className="space-y-4">
            {/* Logo Badge */}
            <div className="inline-flex items-center justify-center p-3 px-4 bg-blue-950 text-yellow-400 rounded-2xl shadow-xl border border-blue-900/50 font-serif font-black text-xl tracking-wider select-none">
              VIH
            </div>
            
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-white tracking-widest uppercase sm:text-4xl">
                Naira Villa
              </h1>
              <span className="text-xs text-yellow-500 font-extrabold uppercase tracking-widest block font-mono">
                RESORT & PRIVATE VILLAS
              </span>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed max-w-md">
              Sistem backend ERP dan pencatatan kasir terintegrasi untuk menyederhanakan siklus check-in, check-out, sewa unit kamar, serta pelaporan kas digital harian vila Anda.
            </p>
          </div>

          {/* List of Key Fully-Functional System Modules */}
          <div className="space-y-4 pt-1">
            <span className="block text-[10px] font-black text-slate-500 tracking-widest uppercase">
              MODUL OPERASIONAL AKTIF
            </span>

            <ul className="space-y-3.5">
              <li className="flex gap-3">
                <span className="p-1.5 h-8 w-8 bg-blue-900/40 text-yellow-405 border border-blue-800/40 rounded-lg flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-yellow-500" />
                </span>
                <div>
                  <span className="block text-xs font-bold text-slate-100">POS Kasir Cepat (Baru!)</span>
                  <span className="block text-[11px] text-yellow-400/95 leading-normal">Pencatatan reservasi tamu, input addons instan, & mesin penghitung uang kembalian.</span>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="p-1.5 h-8 w-8 bg-blue-900/40 text-yellow-450 border border-blue-800/40 rounded-lg flex items-center justify-center shrink-0">
                  <Building className="w-4 h-4 text-blue-400" />
                </span>
                <div>
                  <span className="block text-xs font-bold text-slate-100">Kalender & Reservasi</span>
                  <span className="block text-[11px] text-yellow-400/95 leading-normal">Manajemen ketersediaan visual dinamis anti double-booking dengan matrix warna.</span>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="p-1.5 h-8 w-8 bg-blue-900/40 text-yellow-450 border border-blue-800/40 rounded-lg flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-emerald-450" />
                </span>
                <div>
                  <span className="block text-xs font-bold text-slate-100">Promosi Brosur AI</span>
                  <span className="block text-[11px] text-yellow-400/95 leading-normal">Melakukan generator tagline marketing instan otomatis dengan kecerdasan buatan.</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Safe lock legal badge */}
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-semibold uppercase tracking-wider pt-2 select-none">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Sistem Pencatatan Enkripsi Lokal Pasif</span>
          </div>

        </div>

        {/* RIGHT COLUMN: Formal Credentials Form (6/12 columns on large screen) */}
        <div className="md:col-span-6 flex flex-col justify-center space-y-6 md:pl-6">
          
          <div className="space-y-1.5">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-yellow-500" />
              Autentikasi Admin
            </h2>
            <p className="text-xs text-slate-400">Masukkan kredensial keamanan Anda untuk mengelola akomodasi.</p>
          </div>

          {error && (
            <div className="p-3.5 bg-red-950/50 border border-red-900/60 rounded-xl flex items-start gap-2.5 text-xs text-red-200 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-405 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label htmlFor="login-username" className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="login-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username admin"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-200 text-sm outline-none focus:border-yellow-600 focus:ring-1 focus:ring-yellow-600/30 transition-all font-semibold"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-200 text-sm outline-none focus:border-yellow-600 focus:ring-1 focus:ring-yellow-600/30 transition-all font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 pointer-events-auto cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 mt-2 bg-gradient-to-r from-yellow-600 to-amber-500 hover:from-yellow-500 hover:to-amber-400 text-slate-950 font-extrabold text-xs tracking-widest uppercase rounded-xl shadow-lg shadow-yellow-600/10 cursor-pointer flex items-center justify-center gap-2 transition-all outline-none ${
                isLoading ? 'opacity-80 cursor-wait' : 'active:scale-[0.98]'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>Memverifikasi Sandi...</span>
                </>
              ) : (
                <>
                  <Building className="w-4 h-4" />
                  <span>MASUK SISTEM</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Assist Block */}
          <div className="pt-4 border-t border-slate-800/80 flex flex-col items-center justify-center text-center gap-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">LOGIN COBA-COBA (DEMO HINTS)</span>
            <button
              type="button"
              onClick={handleUseDemoCredentials}
              className="cursor-pointer text-[11px] font-bold text-yellow-500/90 hover:text-yellow-400 bg-yellow-500/5 hover:bg-yellow-500/10 border border-yellow-500/20 hover:border-yellow-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all outline-none"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />
              Gunakan Akun Demo Admin (`admin` / `admin123`)
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
