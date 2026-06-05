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
    <div id="login-module-container" className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Aesthetic glowing background patterns */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-yellow-600/10 blur-[120px] pointer-events-none"></div>
      
      {/* Decorative refined thin gird lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Brand visual header inside elegant fade-in wrapper */}
        <div className="text-center mb-8 space-y-3">
          <div className="inline-flex items-center justify-center p-3.5 bg-blue-900 text-yellow-400 rounded-2xl shadow-xl shadow-blue-950/50 border border-blue-950 font-serif font-black text-2xl tracking-wide">
            VIH
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-widest uppercase">INDAH HARMONI</h1>
            <span className="text-[10px] text-yellow-500 font-bold uppercase tracking-widest block mt-0.5">RESORT & PRIVATE VILLAS</span>
          </div>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Sistem Manajemen Internal & Pembuat Brosur Pemasaran Digital Canggih
          </p>
        </div>

        {/* Credentials Form Box */}
        <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-800 shadow-2xl p-8 space-y-6">
          <div className="space-y-1.5 border-b border-slate-800/80 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-yellow-500" />
              Autentikasi Admin
            </h2>
            <p className="text-xs text-slate-405">Masukkan kredensial keamanan Anda untuk mengelola akomodasi.</p>
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
              <label htmlFor="login-username" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
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
                <label htmlFor="login-password" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
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
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 pointer-events-auto"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 mt-2 bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-extrabold text-xs tracking-widest uppercase rounded-xl shadow-lg shadow-yellow-600/10 cursor-pointer flex items-center justify-center gap-2 transition-all outline-none ${
                isLoading ? 'opacity-80 cursor-wait' : ''
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
              <Sparkles className="w-3 h-3 text-yellow-500" />
              Gunakan Akun Demo Admin (`admin` / `admin123`)
            </button>
          </div>
        </div>

        {/* Safe lock legal badge */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Sistem Pencatatan Enkripsi Lokal Pasif</span>
        </div>

      </div>
    </div>
  );
}
