/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Booking, RoomType } from './types';
import { ROOM_TYPES, INITIAL_BOOKINGS } from './data';
import Sidebar from './components/Sidebar';
import CalendarView from './components/CalendarView';
import BookingForm from './components/BookingForm';
import ReceiptView from './components/ReceiptView';
import StatsDashboard from './components/StatsDashboard';
import BrochureGenerator from './components/BrochureGenerator';
import BillingConfirmation from './components/BillingConfirmation';
import { ShieldAlert, RefreshCw, Calendar as CalendarIcon, User, Layers, Clock } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'kalender' | 'booking' | 'kuitansi' | 'brosur' | 'konfirmasi'>('kalender');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [formEditValues, setFormEditValues] = useState<Partial<Booking> | null>(null);
  const [currentDateTime, setCurrentDateTime] = useState('');

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

  // Save changes to state & localStorage
  const saveBookingsList = (updatedList: Booking[]) => {
    setBookings(updatedList);
    localStorage.setItem('villa_bookings', JSON.stringify(updatedList));
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
      />

      {/* 2. Main Content Layout panel */}
      <main className="flex-1 flex flex-col min-h-screen p-4 md:p-8 space-y-6 overflow-y-auto">
        
        {/* Main Work Header */}
        <header id="main-container-header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/60 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-blue-900 font-bold uppercase tracking-wider">
              <span>Sistem Manajemen Villa</span>
              <span>/</span>
              <span className="text-gray-400 font-medium">
                {activeTab === 'kalender' ? 'Kalender Ketersediaan' : activeTab === 'booking' ? 'Formulir Booking' : activeTab === 'kuitansi' ? 'Kuitansi Digital' : activeTab === 'brosur' ? 'Brosur Promosi AI' : 'Konfirmasi Tagihan'}
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
              <span className="block text-xs font-bold text-gray-700">Irwan Setiawan</span>
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

        {/* 3. Top Row Metrics Summary shelf dashboard */}
        <StatsDashboard bookings={bookings} roomTypes={ROOM_TYPES} />

        {/* 4. Active Tab Workspace section views */}
        <div className="flex-1 mt-2">
          {activeTab === 'kalender' && (
            <div className="animate-scale-up">
              <CalendarView
                roomTypes={ROOM_TYPES}
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
                roomTypes={ROOM_TYPES}
                initialValues={formEditValues}
                onSave={handleSaveBooking}
                onCancel={() => {
                  setFormEditValues(null);
                  setActiveTab('kalender');
                }}
              />
            </div>
          )}

          {activeTab === 'kuitansi' && (
            <div className="animate-scale-up">
              <ReceiptView
                bookings={bookings}
                roomTypes={ROOM_TYPES}
                selectedBookingId={selectedBookingId}
                onSelectBooking={setSelectedBookingId}
                onEditBooking={handleEditBookingClick}
              />
            </div>
          )}

          {activeTab === 'brosur' && (
            <div className="animate-scale-up">
              <BrochureGenerator roomTypes={ROOM_TYPES} />
            </div>
          )}

          {activeTab === 'konfirmasi' && (
            <div className="animate-scale-up">
              <BillingConfirmation
                bookings={bookings}
                roomTypes={ROOM_TYPES}
                onUpdatePaymentStatus={(updatedBooking) => {
                  const updated = bookings.map((b) => (b.id === updatedBooking.id ? updatedBooking : b));
                  saveBookingsList(updated);
                  setSelectedBookingId(updatedBooking.id);
                }}
              />
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <footer className="text-center text-[11px] text-gray-450 border-t border-gray-100 pt-5 mt-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Villa Indah Harmoni — Booking Ledger system. Semua data tersimpan di browser Anda (LocalStorage).</p>
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
