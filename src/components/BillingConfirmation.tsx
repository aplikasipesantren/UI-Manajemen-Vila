/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Booking, RoomType, AppSettings } from '../types';
import { Calendar, Phone, CheckCircle, HelpCircle, Loader2, DollarSign, Send, Landmark, Receipt, Eye, Sparkles, Check, Clipboard } from 'lucide-react';

interface BillingConfirmationProps {
  bookings: Booking[];
  roomTypes: RoomType[];
  onUpdatePaymentStatus: (updatedBooking: Booking) => void;
  settings?: AppSettings;
}

export default function BillingConfirmation({
  bookings,
  roomTypes,
  onUpdatePaymentStatus,
  settings,
}: BillingConfirmationProps) {
  const [selectedBookingId, setSelectedBookingId] = useState<string>(bookings[0]?.id || '');
  const [bankName, setBankName] = useState(settings?.bankName || 'BCA (Bank Central Asia)');
  const [bankAccountNumber, setBankAccountNumber] = useState(settings?.bankNoRek || '872-00123-998');
  const [bankAccountHolder, setBankAccountHolder] = useState(settings?.bankOwner || (settings?.namaLembaga ? `${settings.namaLembaga.toUpperCase()} REK` : 'VILLA INDAH HARMONI AGUNG'));
  const [copiedText, setCopiedText] = useState(false);
  const [simulatedView, setSimulatedView] = useState<'admin' | 'guest'>('admin');

  React.useEffect(() => {
    if (settings) {
      if (settings.bankName) setBankName(settings.bankName);
      if (settings.bankNoRek) setBankAccountNumber(settings.bankNoRek);
      if (settings.bankOwner) {
        setBankAccountHolder(settings.bankOwner);
      } else if (settings.namaLembaga) {
        setBankAccountHolder(`${settings.namaLembaga.toUpperCase()} REK`);
      }
    }
  }, [settings]);

  const activeBooking = bookings.find((b) => b.id === selectedBookingId) || bookings[0];

  if (!activeBooking) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center max-w-xl mx-auto border border-gray-100">
        <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-800">Tidak Ada Data Booking</h3>
        <p className="text-sm text-gray-500 mt-1">Buat pesanan baru terlebih dahulu untuk mengakses alat konfirmasi ini.</p>
      </div>
    );
  }

  const selectedRoomDetails = roomTypes.find((r) => r.id === activeBooking.roomId);
  const nightsStayed = Math.round(
    (new Date(activeBooking.checkOutDate).getTime() - new Date(activeBooking.checkInDate).getTime()) /
      (1000 * 3600 * 24)
  );

  const remainingBalance = activeBooking.totalPrice - activeBooking.amountPaid;

  // Generate perfect formatted Indonesian WhatsApp reminder message
  const generateWAConfirmMessage = () => {
    const institutionName = (settings?.namaLembaga || 'VILLA INDAH HARMONI');
    let msg = `*🏡 KONFIRMASI BILLING & RESERVASI - ${institutionName.toUpperCase()}*\n\n`;
    msg += `Yth. Ibu/Bapak *${activeBooking.guestName}*,\n`;
    msg += `Terima kasih atas rencana liburan Anda bersama kami. Berikut rincian pemesanan & tagihan formal Anda:\n\n`;
    
    msg += `📌 *DATA RESERVASI:*\n`;
    msg += `• No. Invoice: *${activeBooking.invoiceNumber}*\n`;
    msg += `• Tipe Kamar: *${selectedRoomDetails?.name || 'Vip Room'}*\n`;
    msg += `• Tanggal Menginap: *${activeBooking.checkInDate}* s.d. *${activeBooking.checkOutDate}* (${nightsStayed} Malam)\n\n`;

    msg += `💸 *RINCIAN PENILAIAN BIAYA (LEDGER):*\n`;
    msg += `• Total Tarif Kamar: Rp ${activeBooking.totalPrice.toLocaleString('id-ID')}\n`;
    msg += `• Jumlah Terbayar: Rp ${activeBooking.amountPaid.toLocaleString('id-ID')} (${activeBooking.paymentStatus === 'DP' ? 'Uang Muka/DP' : activeBooking.paymentStatus === 'Lunas' ? 'Lunas Selesai' : 'Belum Ada Pembayaran'})\n`;
    msg += `• ⚠️ *SISA PELUNASAN: Rp ${remainingBalance.toLocaleString('id-ID')}*\n\n`;

    if (remainingBalance > 0) {
      msg += `🏦 *PROSEDUR TRANSFER PELUNASAN:*\n`;
      msg += `Silakan lakukan transfer pelunasan melalui rekening resmi pengelola:\n`;
      msg += `• Bank: *${bankName}*\n`;
      msg += `• No. Rekening: *${bankAccountNumber}*\n`;
      msg += `• Atas Nama: *${bankAccountHolder}*\n\n`;
      msg += `⏱️ _Mohon kirimkan bukti transfer pelunasan Anda langsung dengan membalas pesan WhatsApp ini._\n\n`;
    } else {
      msg += `🎉 *RESERVASI SELESAI & LUNAS:*\n`;
      msg += `Pembayaran Anda telah kami terima penuh. Kuitansi lunas digital dapat Anda ambil saat melangsungkan check-in atau pada tautan portal admin kami.\n\n`;
    }

    msg += `Sampai jumpa di keindahan alam ${institutionName}! Damai, sejuk, dan aman selalu.\n`;
    msg += `Warm regards, *Irwan Setiawan* (Manager Admin ${institutionName}).`;

    return msg;
  };

  const handleCopyWAConfirm = () => {
    const text = generateWAConfirmMessage();
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => {
      setCopiedText(false);
    }, 2500);
  };

  const handleDirectWAWeb = () => {
    const text = encodeURIComponent(generateWAConfirmMessage());
    let formattedNum = activeBooking.whatsappNumber.replace(/[^0-9]/g, '');
    if (formattedNum.startsWith('0')) {
      formattedNum = '62' + formattedNum.slice(1);
    }
    const url = `https://wa.me/${formattedNum}?text=${text}`;
    window.open(url, '_blank');
  };

  const handleFastUpdateStatus = (newStatus: 'Lunas' | 'DP' | 'Belum Bayar') => {
    const updated: Booking = {
      ...activeBooking,
      paymentStatus: newStatus,
      amountPaid: newStatus === 'Lunas' ? activeBooking.totalPrice : newStatus === 'Belum Bayar' ? 0 : activeBooking.amountPaid || (activeBooking.totalPrice * 0.4) // Pro-rate 40% if DP
    };
    onUpdatePaymentStatus(updated);
  };

  return (
    <div className="space-y-6">
      {/* Selector & Billing setup row */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-blue-900" />
            Generator Konfirmasi Tagihan Tamu (Billing)
          </h2>
          <p className="text-xs text-gray-400 mt-1">Drafkan pesan transfer bank dan skema piutang formal terstandar.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="billing-select" className="text-xs font-bold text-gray-500 uppercase">Tamunya:</label>
          <select
            id="billing-select"
            value={activeBooking.id}
            onChange={(e) => setSelectedBookingId(e.target.value)}
            className="text-xs font-semibold text-gray-700 bg-slate-50 border border-gray-200 rounded-lg p-2 focus:border-blue-900 outline-none max-w-xs"
          >
            {bookings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.invoiceNumber} — {b.guestName}
              </option>
            ))}
          </select>

          {/* Toggle Simulated Views */}
          <div className="flex items-center rounded-lg border border-gray-200 p-0.5 bg-slate-50">
            <button
              onClick={() => setSimulatedView('admin')}
              id="view-admin-tab"
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                simulatedView === 'admin'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Panel Admin
            </button>
            <button
              onClick={() => setSimulatedView('guest')}
              id="view-guest-tab"
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                simulatedView === 'guest'
                  ? 'bg-indigo-950 text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              🎭 Simulator Tamu
            </button>
          </div>
        </div>
      </div>

      {simulatedView === 'admin' ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Form and configs left side */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-gray-100 pb-2">
              Pengaturan Mutasi & Informasi Bank
            </h3>

            {/* Bank Name */}
            <div>
              <label htmlFor="bank-name" className="block text-[10px] uppercase font-bold text-gray-500 mb-1">
                Akun Instansi Bank
              </label>
              <input
                id="bank-name"
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-gray-200 outline-none rounded-lg focus:border-blue-900"
              />
            </div>

            {/* Rekening */}
            <div>
              <label htmlFor="bank-acc-num" className="block text-[10px] uppercase font-bold text-gray-500 mb-1">
                Nomor Rekening Tujuan
              </label>
              <input
                id="bank-acc-num"
                type="text"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-gray-200 outline-none rounded-lg focus:border-blue-905"
              />
            </div>

            {/* Atas Nama */}
            <div>
              <label htmlFor="bank-acc-holder" className="block text-[10px] uppercase font-bold text-gray-500 mb-1">
                Nama Pemilik Rekening (A.N)
              </label>
              <input
                id="bank-acc-holder"
                type="text"
                value={bankAccountHolder}
                onChange={(e) => setBankAccountHolder(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-gray-200 outline-none rounded-lg focus:border-blue-900"
              />
            </div>

            {/* Ledger updates shortcuts */}
            <div className="pt-2">
              <span className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Simulasi Update Cepat Status:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleFastUpdateStatus('Lunas')}
                  id="btn-fast-lunas"
                  className={`text-[10px] px-2.5 py-1.5 rounded-lg border font-bold transition-all ${
                    activeBooking.paymentStatus === 'Lunas'
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                      : 'bg-white hover:bg-emerald-50 border-gray-200 text-gray-600'
                  }`}
                >
                  🟢 Set Lunas
                </button>
                <button
                  onClick={() => handleFastUpdateStatus('DP')}
                  id="btn-fast-dp"
                  className={`text-[10px] px-2.5 py-1.5 rounded-lg border font-bold transition-all ${
                    activeBooking.paymentStatus === 'DP'
                      ? 'bg-amber-100 border-amber-300 text-amber-800'
                      : 'bg-white hover:bg-amber-50 border-gray-200 text-gray-600'
                  }`}
                >
                  🟡 Set DP (40%)
                </button>
                <button
                  onClick={() => handleFastUpdateStatus('Belum Bayar')}
                  id="btn-fast-unpaid"
                  className={`text-[10px] px-2.5 py-1.5 rounded-lg border font-bold transition-all ${
                    activeBooking.paymentStatus === 'Belum Bayar'
                      ? 'bg-rose-100 border-rose-300 text-rose-800'
                      : 'bg-white hover:bg-rose-50 border-gray-200 text-gray-600'
                  }`}
                >
                  🔴 Set Belum Bayar
                </button>
              </div>
            </div>

            {/* Action dispatches */}
            <div className="pt-4 border-t border-gray-105 space-y-2">
              <button
                onClick={handleCopyWAConfirm}
                id="btn-confirm-copy-text"
                className="cursor-pointer w-full py-2.5 px-3 hover:bg-slate-550 border border-gray-250 text-gray-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-2xs"
              >
                {copiedText ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    Teks Konfirmasi Ter-copy!
                  </>
                ) : (
                  <>
                    <Clipboard className="w-4 h-4 text-gray-400" />
                    Salin Teks Billing WA
                  </>
                )}
              </button>

              <button
                onClick={handleDirectWAWeb}
                id="btn-confirm-send-whatsapp"
                className="cursor-pointer w-full py-2.5 px-3 bg-emerald-800 hover:bg-emerald-990 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow"
              >
                <Send className="w-4 h-4 text-emerald-200" />
                Kirim Langsung ke WA Tamu
              </button>
            </div>
          </div>

          {/* Text message draft container right side */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-xs flex flex-col justify-between">
            <h3 className="text-xs font-bold text-gray-550 uppercase tracking-wider border-b border-gray-100 pb-2">
              Draf Teks Notifikasi Tagihan (Saluran WhatsApp)
            </h3>

            <div className="flex-grow min-h-[300px] max-h-[380px] overflow-y-auto adaptive-scrollbar font-mono text-xs text-emerald-850 bg-emerald-50/20 p-4 rounded-xl border border-emerald-100/40 select-all select-text whitespace-pre-wrap leading-relaxed">
              {generateWAConfirmMessage()}
            </div>

            <div className="text-[10px] text-gray-400 italic">
              *Teks di atas diformat dengan tanda Markdown standar WhatsApp seperti bintang (*) untuk cetak tebal dan garis bawah (_) untuk teks miring, sehingga akan tampil sangat teratur saat dikirimkan.
            </div>
          </div>
        </div>
      ) : (
        /* Guest View Boarding Slip View (Majestic simulated Guest Portal) */
        <div className="max-w-xl mx-auto bg-slate-900 rounded-3xl overflow-hidden shadow-xl border border-slate-950 text-slate-350 animate-scale-up">
          {/* Greeting banner */}
          <div className="bg-gradient-to-br from-indigo-950 via-blue-950 to-indigo-900 p-6 text-white text-center space-y-2 border-b border-slate-950">
            <span className="bg-emerald-500 text-slate-950 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
              SECURE GUEST ACCESS PORTAL
            </span>
            <h3 className="text-lg font-serif font-black tracking-wide">VILLA INDAH HARMONI</h3>
            <p className="text-xs text-indigo-200 max-w-xs mx-auto">Selamat datang Bapak/Ibu {activeBooking.guestName}. Terima kasih telah memilih penginapan asri kami.</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Quick Summary Circle */}
            <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800/80 text-center space-y-1">
              <span className="block text-[10px] text-slate-500 uppercase tracking-widest font-bold">TOTAL TAGIHAN ANDA</span>
              <span className="block text-3xl font-mono font-extrabold text-white">
                Rp {activeBooking.totalPrice.toLocaleString('id-ID')}
              </span>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 text-[10px] rounded-full mt-2 font-semibold">
                Status:{' '}
                <span
                  className={`font-black ${
                    activeBooking.paymentStatus === 'Lunas'
                      ? 'text-emerald-400'
                      : activeBooking.paymentStatus === 'DP'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {activeBooking.paymentStatus}
                </span>
              </div>
            </div>

            {/* Allocation Slip Boarding info */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950/20 p-3 rounded-xl border border-slate-850">
                <span className="block text-slate-505 font-bold text-[9px] uppercase tracking-wide mb-1">UNIT & KAMAR</span>
                <span className="block text-slate-200 font-bold">{selectedRoomDetails?.name || 'Vip Suite'}</span>
                <span className="block text-[10px] text-slate-500 mt-0.5">Kapasitas {selectedRoomDetails?.capacity} Tamu</span>
              </div>
              <div className="bg-slate-950/20 p-3 rounded-xl border border-slate-850">
                <span className="block text-slate-505 font-bold text-[9px] uppercase tracking-wide mb-1">DURASI MENGINAP</span>
                <span className="block text-slate-200 font-bold">{nightsStayed} Malam</span>
                <span className="block text-[10px] text-slate-500 mt-0.5">{activeBooking.checkInDate} / {activeBooking.checkOutDate}</span>
              </div>
            </div>

            {/* Financial Ledger balance details */}
            <div className="space-y-2 bg-slate-950/30 p-4 rounded-xl border border-slate-850 text-xs">
              <div className="flex justify-between pb-2 border-b border-slate-800/50">
                <span className="text-slate-500 font-medium">Tarif Unit x {nightsStayed} Malam</span>
                <span className="text-slate-205 font-semibold font-mono">Rp {activeBooking.totalPrice.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-800/50">
                <span className="text-slate-500 font-medium">Uang Muka / Deposit Terbayar</span>
                <span className="text-emerald-450 font-bold font-mono">
                  - Rp {activeBooking.amountPaid.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between pt-1 font-bold text-white text-sm">
                <span>SEBELUM CHEK-IN (SISA PIUTANG):</span>
                <span className="text-amber-400 font-mono">
                  Rp {remainingBalance.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Bank details instruction card */}
            {remainingBalance > 0 && (
              <div className="bg-slate-950 border border-indigo-900/30 p-4 rounded-2xl space-y-3">
                <span className="block text-[10px] text-indigo-400 uppercase font-black tracking-widest flex items-center gap-1">
                  <Landmark className="w-3.5 h-3.5" />
                  INSTRUKSI TRANSFER PELUNASAN RESMI
                </span>
                
                <div className="text-xs space-y-1.5 font-medium">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nama Bank:</span>
                    <span className="text-slate-202 font-bold">{bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nomor Rekening:</span>
                    <span className="text-slate-202 font-bold font-mono text-xs">{bankAccountNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Atas Nama (A.N):</span>
                    <span className="text-slate-202 font-bold">{bankAccountHolder}</span>
                  </div>
                </div>

                <div className="bg-slate-900/50 p-2.5 rounded-lg text-[10px] text-slate-450 text-center italic border border-slate-850">
                  ⚠️ "Kirimkan foto kuitansi/struk transfer bank Anda ke nomor WhatsApp admin kami untuk memvalidasi pelunasan langsung."
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
