/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Booking, RoomType, Customer, AppSettings } from './types';
import { ROOM_TYPES, INITIAL_BOOKINGS } from './data';
import Sidebar from './components/Sidebar';
import CalendarView from './components/CalendarView';
import BookingForm from './components/BookingForm';
import ReceiptView from './components/ReceiptView';
import BrochureGenerator from './components/BrochureGenerator';
import BillingConfirmation from './components/BillingConfirmation';
import CustomerManagement from './components/CustomerManagement';
import AppSettingsView from './components/AppSettingsView';
import TransactionReport from './components/TransactionReport';
import RoomManagement from './components/RoomManagement';
import DashboardView from './components/DashboardView';
import Login from './components/Login';
import POSKasirView from './components/POSKasirView';
import { ShieldAlert, RefreshCw, Calendar as CalendarIcon, User, Layers, Clock } from 'lucide-react';

const THEME_COLORS: Record<string, Record<string, string>> = {
  blue: {
    '50': '#eff6ff',
    '100': '#dbeafe',
    '150': '#cbdfec',
    '200': '#bfdbfe',
    '300': '#93c5fd',
    '400': '#60a5fa',
    '600': '#2563eb',
    '800': '#1e40af',
    '850': '#172554',
    '900': '#1e3a8a',
    '950': '#172554',
  },
  emerald: {
    '50': '#f0fdf4',
    '105': '#f0fdf4', // customized opacity fallbacks
    '100': '#dcfce7',
    '150': '#d1fbf0',
    '200': '#bbf7d0',
    '300': '#86efac',
    '400': '#4ade80',
    '600': '#16a34a',
    '800': '#15803d',
    '850': '#166534',
    '900': '#064e3b',
    '950': '#022c22',
  },
  violet: {
    '50': '#f5f3ff',
    '105': '#f5f3ff',
    '100': '#ede9fe',
    '150': '#eceafb',
    '200': '#ddd6fe',
    '300': '#c084fc',
    '400': '#a855f7',
    '600': '#7c3aed',
    '800': '#5b21b6',
    '850': '#4c1d95',
    '900': '#3b0764',
    '950': '#2e1065',
  },
  rose: {
    '50': '#fff1f2',
    '105': '#fff1f2',
    '100': '#ffe4e6',
    '150': '#fde2e4',
    '200': '#fecdd3',
    '300': '#fda4af',
    '400': '#fb7185',
    '600': '#e11d48',
    '800': '#9f1239',
    '850': '#881337',
    '900': '#4c0519',
    '950': '#27000b',
  },
  amber: {
    '50': '#fffbeb',
    '105': '#fffbeb',
    '100': '#fef3c7',
    '150': '#fdf0cd',
    '200': '#fde68a',
    '300': '#fcd34d',
    '400': '#fbbf24',
    '600': '#d97706',
    '800': '#b45309',
    '850': '#78350f',
    '900': '#a16207',
    '950': '#451a03',
  },
  teal: {
    '50': '#f0fdfa',
    '105': '#f0fdfa',
    '100': '#ccfbf1',
    '150': '#d5f5f0',
    '200': '#99f6e4',
    '300': '#5eead4',
    '400': '#2dd4bf',
    '600': '#0d9488',
    '800': '#115e59',
    '850': '#134e4a',
    '900': '#0f766e',
    '950': '#042f2e',
  },
  slate: {
    '50': '#f8fafc',
    '105': '#f8fafc',
    '100': '#f1f5f9',
    '150': '#e2e8f0',
    '200': '#cbd5e1',
    '300': '#94a3b8',
    '400': '#64748b',
    '600': '#475569',
    '800': '#334155',
    '850': '#1e293b',
    '900': '#1e293b',
    '950': '#0f172a',
  }
};

export default function App() {
  const [adminUser, setAdminUser] = useState<string | null>(() => {
    return localStorage.getItem('villa_admin_user');
  });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'kalender' | 'booking' | 'kuitansi' | 'brosur' | 'konfirmasi' | 'pelanggan' | 'laporan' | 'setting' | 'kamar' | 'kasir'>('dashboard');
  const [roomTypes, setRoomTypes] = useState<RoomType[]>(() => {
    const raw = localStorage.getItem('villa_room_types');
    if (raw) {
      try { return JSON.parse(raw); } catch (e) { }
    }
    return ROOM_TYPES;
  });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [formEditValues, setFormEditValues] = useState<Partial<Booking> | null>(null);
  const [currentDateTime, setCurrentDateTime] = useState('');

  // Pelanggan list manually loaded & synchronized to localStorage
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const raw = localStorage.getItem('villa_customers');
    if (raw) {
      try { return JSON.parse(raw); } catch (e) { }
    }
    return [];
  });

  // App Identity and WhatsApp settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    const raw = localStorage.getItem('villa_settings');
    if (raw) {
      try { return JSON.parse(raw); } catch (e) { }
    }
    return {
      logoUrl: '',
      logoInitials: 'VIH',
      namaLembaga: 'Villa Indah Harmoni',
      alamat: 'Jl. Raya Selecta No. 12, Bumiaji, Kota Batu, Jawa Timur',
      baileysStatus: 'DISCONNECTED',
      baileysPhone: '0812-3456-7890',
      baileysSessionName: 'vih_main_session',
      baileysAutoReply: false,
      baileysWebhookUrl: 'http://localhost:3000/api/webhook/baileys',
      baileysIsPaired: false,
      bankOwner: 'VILLA INDAH HARMONI AGUNG',
      bankNoRek: '123-4567-890',
      bankName: 'BCA (Bank Central Asia)',
      kontakPhone: '+62 811-2233-4455',
      banks: [
        {
          id: 'bank-1',
          bankName: 'BCA (Bank Central Asia)',
          bankNoRek: '123-4567-890',
          bankOwner: 'VILLA INDAH HARMONI AGUNG'
        },
        {
          id: 'bank-2',
          bankName: 'Bank Mandiri',
          bankNoRek: '144-00-112233-4',
          bankOwner: 'VILLA INDAH HARMONI AGUNG'
        }
      ]
    };
  });


  // 1. Load initial data from localStorage or fallback to data.ts seeds
  useEffect(() => {
    const storedBookings = localStorage.getItem('villa_bookings');
    if (storedBookings) {
      try {
        setBookings(JSON.parse(storedBookings));
      } catch (e) {
        console.error('Failed to parse local stored bookings. Fallback to seeds.', e);
        setBookings(INITIAL_BOOKINGS);
        localStorage.setItem('villa_bookings', JSON.stringify(INITIAL_BOOKINGS));
      }
    } else {
      setBookings(INITIAL_BOOKINGS);
      localStorage.setItem('villa_bookings', JSON.stringify(INITIAL_BOOKINGS));
    }

    // Set stable local mock date representation (Indonesian local format)
    const formattedDate = new Date('2026-06-04T23:44:00Z').toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    setCurrentDateTime(formattedDate);
  }, []);

  // Sync and override CSS variables dynamically based on App Color settings
  useEffect(() => {
    const selectedColor = settings.appColor || 'blue';
    const theme = THEME_COLORS[selectedColor] || THEME_COLORS.blue;
    for (const [shade, hex] of Object.entries(theme)) {
      document.documentElement.style.setProperty(`--color-blue-${shade}`, hex);
    }
  }, [settings.appColor]);

  // Save changes to state & localStorage
  const saveBookingsList = (updatedList: Booking[]) => {
    setBookings(updatedList);
    localStorage.setItem('villa_bookings', JSON.stringify(updatedList));
  };

  const handleSaveCustomer = (customer: Customer) => {
    const exists = customers.some((c) => c.id === customer.id);
    let updated: Customer[];
    if (exists) {
      updated = customers.map((c) => (c.id === customer.id ? customer : c));
    } else {
      updated = [customer, ...customers];
    }
    setCustomers(updated);
    localStorage.setItem('villa_customers', JSON.stringify(updated));
  };

  const handleDeleteCustomer = (id: string) => {
    const updated = customers.filter((c) => c.id !== id);
    setCustomers(updated);
    localStorage.setItem('villa_customers', JSON.stringify(updated));
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('villa_settings', JSON.stringify(newSettings));
  };

  const handleSaveRoomType = (savedRoom: RoomType) => {
    const exists = roomTypes.some((r) => r.id === savedRoom.id);
    let updated: RoomType[];
    if (exists) {
      updated = roomTypes.map((r) => (r.id === savedRoom.id ? savedRoom : r));
    } else {
      updated = [...roomTypes, savedRoom];
    }
    setRoomTypes(updated);
    localStorage.setItem('villa_room_types', JSON.stringify(updated));
  };

  const handleDeleteRoomType = (id: string) => {
    const updated = roomTypes.filter((r) => r.id !== id);
    setRoomTypes(updated);
    localStorage.setItem('villa_room_types', JSON.stringify(updated));
  };

  // 2. Action: Save a Booking (New or Edit)
  const handleSaveBooking = (savedBooking: Booking) => {
    const exists = bookings.some((b) => b.id === savedBooking.id);
    let updated: Booking[];

    if (exists) {
      // Update
      updated = bookings.map((b) => (b.id === savedBooking.id ? savedBooking : b));
    } else {
      // Create new
      updated = [savedBooking, ...bookings];
    }

    saveBookingsList(updated);
    setSelectedBookingId(savedBooking.id);
    setFormEditValues(null);
    
    // Smooth transition to Kuitansi View so they can print immediately!
    setTimeout(() => {
      setActiveTab('kuitansi');
    }, 400);
  };

  // 3. Action: Delete/Cancel Reservation from Kuitansi view OR detail panel
  const handleResetData = () => {
    if (window.confirm('Apakah Anda yakin ingin mengatur ulang database ke data demo pabrik? Semua pesanan baru Anda akan terhapus.')) {
      saveBookingsList(INITIAL_BOOKINGS);
      setRoomTypes(ROOM_TYPES);
      localStorage.setItem('villa_room_types', JSON.stringify(ROOM_TYPES));
      setSelectedBookingId(INITIAL_BOOKINGS[0].id);
      setFormEditValues(null);
      setActiveTab('kalender');
    }
  };

  // 4. Action: Clique an occupied Cell on calendar matrix
  const handleSelectBooking = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setActiveTab('kuitansi');
  };

  // 5. Action: Clique an empty Cell to quickly register booking on that date & room
  const handleSelectCell = (roomId: string, dateString: string) => {
    // Generate appropriate check-out date (next day)
    const d = new Date(dateString);
    d.setDate(d.getDate() + 1);
    
    // Check-out date formatted
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const checkOutStr = `${year}-${month}-${day}`;

    setFormEditValues({
      roomId,
      checkInDate: dateString,
      checkOutDate: checkOutStr,
      paymentStatus: 'Belum Bayar', // Default when making quick drafts
    });
    setActiveTab('booking');
  };

  const handleEditBookingClick = (booking: Booking) => {
    setFormEditValues(booking);
    setActiveTab('booking');
  };

  const handleAddNewBookingManual = () => {
    setFormEditValues(null);
    setActiveTab('booking');
  };

  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
      setAdminUser(null);
      localStorage.removeItem('villa_admin_user');
    }
  };

  if (!adminUser) {
    return (
      <Login
        onLoginSuccess={(name) => {
          setAdminUser(name);
          localStorage.setItem('villa_admin_user', name);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row antialiased text-gray-800">
      
      {/* 1. Left Sidebar menu (Menu: Kalender, Booking Baru, Kuitansi + Logo & Branding) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'booking' && formEditValues?.id) {
            // Keep editing draft
          } else if (tab === 'booking') {
            setFormEditValues(null); // Fresh form
          }
        }}
        onReset={handleResetData}
        onLogout={handleLogout}
        logoInitials={settings.logoInitials}
        namaLembaga={settings.namaLembaga}
        logoUrl={settings.logoUrl}
      />

      {/* 2. Main Content Layout panel */}
      <main className="flex-1 flex flex-col min-h-screen p-4 md:p-8 space-y-6 overflow-y-auto">
        
        {/* Main Work Header */}
        <header id="main-container-header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/60 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-blue-900 font-bold uppercase tracking-wider">
              <span>Sistem Manajemen {settings.namaLembaga}</span>
              <span>/</span>
              <span className="text-gray-400 font-medium">
                {activeTab === 'kalender' ? 'Kalender Ketersediaan' : activeTab === 'booking' ? 'Formulir Booking' : activeTab === 'kasir' ? 'POS Kasir Booking' : activeTab === 'kuitansi' ? 'Kuitansi Digital' : activeTab === 'brosur' ? 'Brosur Promosi AI' : activeTab === 'konfirmasi' ? 'Konfirmasi Tagihan' : activeTab === 'pelanggan' ? 'Database Pelanggan' : activeTab === 'laporan' ? 'Laporan Transaksi' : 'Setting Aplikasi'}
              </span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              Panel Kendali Utama
              <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                Sistem Offline Aktif
              </span>
            </h1>
          </div>

          {/* Timing/Admin widget bar */}
          <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl shadow-2xs border border-gray-150">
            <div className="text-right">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">LOGGED IN ADMIN</span>
              <span className="block text-xs font-bold text-gray-700">{adminUser || 'Irwan Setiawan'}</span>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="text-right hidden sm:block">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">TANGGAL SIMULASI</span>
              <span className="block text-xs font-semibold text-gray-600 font-mono flex items-center gap-1 justify-end">
                <Clock className="w-3.5 h-3.5 text-blue-900" />
                {currentDateTime}
              </span>
            </div>
          </div>
        </header>

        {/* 4. Active Tab Workspace section views */}
        <div className="flex-1 mt-2">
          {activeTab === 'dashboard' && (
            <div className="animate-scale-up">
              <DashboardView
                bookings={bookings}
                roomTypes={roomTypes}
                onNavigateToTab={(tab) => {
                  setActiveTab(tab);
                }}
              />
            </div>
          )}

          {activeTab === 'kalender' && (
            <div className="animate-scale-up">
              <CalendarView
                roomTypes={roomTypes}
                bookings={bookings}
                onSelectCell={handleSelectCell}
                onSelectBooking={handleSelectBooking}
                onAddBooking={handleAddNewBookingManual}
              />
            </div>
          )}

          {activeTab === 'booking' && (
            <div className="animate-scale-up">
              <BookingForm
                roomTypes={roomTypes}
                initialValues={formEditValues}
                onSave={handleSaveBooking}
                onCancel={() => {
                  setFormEditValues(null);
                  setActiveTab('kalender');
                }}
              />
            </div>
          )}

          {activeTab === 'kasir' && (
            <div className="animate-scale-up">
              <POSKasirView
                roomTypes={roomTypes}
                bookings={bookings}
                customers={customers}
                onSaveBooking={handleSaveBooking}
                onSaveCustomer={handleSaveCustomer}
              />
            </div>
          )}

          {activeTab === 'kuitansi' && (
            <div className="animate-scale-up">
              <ReceiptView
                bookings={bookings}
                roomTypes={roomTypes}
                selectedBookingId={selectedBookingId}
                onSelectBooking={setSelectedBookingId}
                onEditBooking={handleEditBookingClick}
                settings={settings}
              />
            </div>
          )}

          {activeTab === 'brosur' && (
            <div className="animate-scale-up">
              <BrochureGenerator roomTypes={roomTypes} />
            </div>
          )}

          {activeTab === 'konfirmasi' && (
            <div className="animate-scale-up">
              <BillingConfirmation
                bookings={bookings}
                roomTypes={roomTypes}
                onUpdatePaymentStatus={(updatedBooking) => {
                  const updated = bookings.map((b) => (b.id === updatedBooking.id ? updatedBooking : b));
                  saveBookingsList(updated);
                  setSelectedBookingId(updatedBooking.id);
                }}
                settings={settings}
              />
            </div>
          )}

          {activeTab === 'pelanggan' && (
            <div className="animate-scale-up">
              <CustomerManagement
                bookings={bookings}
                roomTypes={roomTypes}
                customers={customers}
                onSaveCustomer={handleSaveCustomer}
                onDeleteCustomer={handleDeleteCustomer}
              />
            </div>
          )}

          {activeTab === 'kamar' && (
            <div className="animate-scale-up">
              <RoomManagement
                roomTypes={roomTypes}
                bookings={bookings}
                onSaveRoomType={handleSaveRoomType}
                onDeleteRoomType={handleDeleteRoomType}
              />
            </div>
          )}

          {activeTab === 'laporan' && (
            <div className="animate-scale-up">
              <TransactionReport
                bookings={bookings}
                roomTypes={roomTypes}
              />
            </div>
          )}

          {activeTab === 'setting' && (
            <div className="animate-scale-up">
              <AppSettingsView
                settings={settings}
                onSaveSettings={handleSaveSettings}
              />
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <footer className="text-center text-[11px] text-gray-450 border-t border-gray-100 pt-5 mt-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 {settings.namaLembaga} — Booking Ledger system. Semua data tersimpan di browser Anda (LocalStorage).</p>
          <div className="flex gap-4">
            <span className="hover:text-blue-900 transition-colors">Syarat Layanan</span>
            <span>•</span>
            <span className="hover:text-blue-900 transition-colors">Panduan Cetak</span>
          </div>
        </footer>

      </main>
    </div>
  );
}
