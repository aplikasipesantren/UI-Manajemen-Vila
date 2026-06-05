/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { RoomType } from '../types';
import { Sparkles, Copy, Check, Users, MessageSquareCode, ArrowRight, Compass, HelpCircle, Loader2, Image as ImageIcon, Download, Upload, Phone, QrCode } from 'lucide-react';

interface BrochureGeneratorProps {
  roomTypes: RoomType[];
}

const ROOM_IMAGES: Record<string, string> = {
  dahlia: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80',
  melati: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
  cempaka: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80',
  kenanga: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
};

type TemplateId = 'gold' | 'emerald' | 'crimson' | 'oceanic';

interface TemplateConfig {
  id: TemplateId;
  name: string;
  primaryColor: string;
  accentColor: string;
  bgGradient: string;
  textColor: string;
  overlayClass: string;
}

const TEMPLATES: TemplateConfig[] = [
  {
    id: 'gold',
    name: 'Obsidian Gold Exclusive',
    primaryColor: '#D4AF37', // Gold
    accentColor: '#1A1A1A', // Dark Slate
    bgGradient: 'from-amber-500 to-yellow-600',
    textColor: 'text-amber-100',
    overlayClass: 'bg-black/60 border-amber-500/30'
  },
  {
    id: 'emerald',
    name: 'Botanical Emerald Nature',
    primaryColor: '#10B981', // Emerald
    accentColor: '#064E3B', // Deep Green
    bgGradient: 'from-emerald-500 to-teal-600',
    textColor: 'text-emerald-100',
    overlayClass: 'bg-emerald-950/60 border-emerald-500/30'
  },
  {
    id: 'crimson',
    name: 'Warm Orchid Crimson',
    primaryColor: '#EF4444', // Crimson
    accentColor: '#450A0A', // Dark Red
    bgGradient: 'from-rose-500 to-red-600',
    textColor: 'text-rose-100',
    overlayClass: 'bg-rose-950/60 border-rose-500/30'
  },
  {
    id: 'oceanic',
    name: 'Serene Breeze Oceanic',
    primaryColor: '#0EA5E9', // Sky Blue
    accentColor: '#0C4A6E', // Navy Blue
    bgGradient: 'from-sky-500 to-indigo-600',
    textColor: 'text-sky-100',
    overlayClass: 'bg-sky-950/60 border-sky-500/30'
  }
];

export function getCleanPromoBadgeText(value: string): string {
  if (!value || value === 'Tidak ada promo / Biaya Normal') return '';
  
  const lowerValue = value.toLowerCase();
  if (lowerValue.includes('10%')) {
    return 'POTONGAN 10% NETT';
  }
  if (lowerValue.includes('sarapan') || lowerValue.includes('breakfast')) {
    return 'FREE BREAKFAST';
  }
  if (lowerValue.includes('extra bed')) {
    return 'FREE EXTRA BED ACC';
  }
  if (lowerValue.includes('early') || lowerValue.includes('check-in awal')) {
    return 'EARLY CHECK-IN APPR';
  }
  
  // Safe generic cleanup
  return value
    .replace(/[^\w\s%()\-]/gi, '')
    .trim()
    .toUpperCase();
}

export function getWrappedLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = ctx.measureText(testLine).width;
    if (testWidth > maxWidth && i > 0) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

export default function BrochureGenerator({ roomTypes }: BrochureGeneratorProps) {
  // Tabs: 'text' (AI Copywriter) vs 'image' (Poster Visual Generator)
  const [activeSubTab, setActiveSubTab] = useState<'text' | 'image'>('text');
  
  // States of Copywriter AI parameters
  const [selectedRoomId, setSelectedRoomId] = useState(roomTypes[0]?.id || '');
  const [audience, setAudience] = useState('Keluarga Besar (Staycation Keluarga)');
  const [accent, setAccent] = useState('Mewah & Elegan (Bahasa Berorientasi Kelas)');
  const [discount, setDiscount] = useState('Diskon Langsung 10% Spesial Bulan Juni');
  const [loading, setLoading] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [copied, setCopied] = useState(false);
  const [isDemoNotification, setIsDemoNotification] = useState(false);

  // States of Poster Visual configuration
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('gold');
  const [customPromoBadge, setCustomPromoBadge] = useState('POTONGAN 10% NETT');
  const [customHeadline, setCustomHeadline] = useState('RETREAT SEJUK SURGAWI DI PUNCAK');
  const [customTagline, setCustomTagline] = useState('Keindahan Alam Mewah Berselimut Kabut Syahdu');
  const [customPerk1, setCustomPerk1] = useState('Pemandangan Lembah & Pegunungan Asri');
  const [customPerk2, setCustomPerk2] = useState('Kamar Mandi Semi-Outdoor dengan Bathtub');
  const [customPerk3, setCustomPerk3] = useState('Balkon Privat & Sunset Spektakuler');
  const [customPerk4, setCustomPerk4] = useState('Layanan Personal Butler Pelayanan Bintang 5');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [contactPhone, setContactPhone] = useState('0812-3456-7890');
  const [renderingImage, setRenderingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const selectedRoomDetails = roomTypes.find((r) => r.id === selectedRoomId) || roomTypes[0];

  // Sync details when Room Type selection shifts
  useEffect(() => {
    if (selectedRoomDetails) {
      // Set headline with AI or beautiful default
      setCustomHeadline(`RETREAT SURGAWI DI ${selectedRoomDetails.name.toUpperCase()}`);
      if (selectedRoomDetails.id === 'dahlia') {
        setCustomTagline('Kemewahan Harmonis dengan Bathtub Air Hangat Temaram');
        setCustomPerk1('Kasur King-Size Premium Kenyamanan Utama');
        setCustomPerk2('Private Bathtub & Semi-Outdoor Garden');
        setCustomPerk3('Pemandangan Taman Tropis Menawan');
        setCustomPerk4('Akses Kolam Renang Resort Utama');
      } else if (selectedRoomDetails.id === 'melati') {
        setCustomTagline('Staycation Keluarga Bahagia Berselimut Balkon Privat');
        setCustomPerk1('Dilengkapi Balkon Santai Luas Eksklusif');
        setCustomPerk2('Sempurna untuk Keluarga Kecil (Kapasitas 4 Tamu)');
        setCustomPerk3('Dapur Kecil Mandiri & Smart TV LED');
        setCustomPerk4('Udara Pegunungan Asri Segar Alami');
      } else if (selectedRoomDetails.id === 'cempaka') {
        setCustomTagline('Keintiman Villa Keluarga Dua Lantai Layaknya Rumah Sendiri');
        setCustomPerk1('Bangunan Luas Elegan 2 Lantai Mewah');
        setCustomPerk2('Ruang Semi-Outdoor Dining Megah');
        setCustomPerk3('Dapur Keluarga Lengkap & Kulkas Besar');
        setCustomPerk4('Kapasitas Longgar hingga 6 Tamu');
      } else if (selectedRoomDetails.id === 'kenanga') {
        setCustomTagline('Istana Privat Bintang Lima dengan Private Pool & Gazebo');
        setCustomPerk1('Kolam Renang Pribadi Luas nan Jernih');
        setCustomPerk2('Gazebo Santai Teduh Klasik di Tepi Kolam');
        setCustomPerk3('Layanan Butler Eksklusif Siaga 24 Jam');
        setCustomPerk4('Keamanan & Privasi Terjaga Penuh');
      }
    }
  }, [selectedRoomId]);

  const handleGenerateAI = async () => {
    if (!selectedRoomDetails) return;
    setLoading(true);
    setGeneratedText('');
    setIsDemoNotification(false);

    try {
      const response = await fetch('/api/generate-brochure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomName: selectedRoomDetails.name,
          ratePerNight: selectedRoomDetails.ratePerNight,
          capacity: selectedRoomDetails.capacity,
          description: selectedRoomDetails.description,
          audience,
          accent,
          discount,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedText(data.brochure);
        if (data.isDemo) {
          setIsDemoNotification(true);
        }
      } else {
        setGeneratedText(`❌ Gagal generate brosur: ${data.error || 'Terjadi kesalahan sistem.'}`);
      }
    } catch (e: any) {
      console.error(e);
      setGeneratedText(`❌ Terjadi kesalahan jaringan saat menghubungi AI server: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = () => {
    if (!generatedText) return;
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const currentTemplate = TEMPLATES.find(t => t.id === selectedTemplate) || TEMPLATES[0];
  const activeImage = uploadedImage || ROOM_IMAGES[selectedRoomDetails?.id] || ROOM_IMAGES.dahlia;

  // Draw Flyer to Canvas and Download
  const handleDownloadFlyerImage = () => {
    if (!canvasRef.current) return;
    setRenderingImage(true);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setRenderingImage(false);
      return;
    }

    // Set canvas dimensions of high-density flyer: 1080px width, 1600px height (Optimal Social Media Ratio 9:16 or post)
    canvas.width = 1080;
    canvas.height = 1520;

    const img = new Image();
    img.crossOrigin = 'anonymous'; // Avoid CORS tainted canvas error
    img.src = activeImage;

    img.onload = () => {
      // 1. Draw Background Image (Cover full canvas with aspect fill)
      const canvasRatio = canvas.width / canvas.height;
      const imgRatio = img.width / img.height;
      let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;

      if (imgRatio > canvasRatio) {
        sWidth = img.height * canvasRatio;
        sx = (img.width - sWidth) / 2;
      } else {
        sHeight = img.width / canvasRatio;
        sy = (img.height - sHeight) / 2;
      }

      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);

      // 2. Draw Vignette Gradient on top of the image to make text pop
      const overlayGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      overlayGrad.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
      overlayGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
      overlayGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.75)');
      overlayGrad.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
      ctx.fillStyle = overlayGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Colors configuration based on template
      const primaryHex = currentTemplate.primaryColor; // e.g. '#D4AF37'
      const accentBgHex = currentTemplate.accentColor; // e.g. '#1A1A1A'

      // 3. Draw Top Luxury Crest or Ribbon Header
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, 110);
      ctx.fillStyle = primaryHex;
      ctx.fillRect(0, 107, canvas.width, 3); // Thin elegant border under header

      // Top Brand Label
      ctx.font = 'bold 24px "Inter", sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.letterSpacing = '8px';
      ctx.textAlign = 'center';
      ctx.fillText('V I L L A   I N D A H   H A R M O N I', canvas.width / 2, 60);

      ctx.font = 'semibold 14px "Inter", sans-serif';
      ctx.fillStyle = '#E5E7EB';
      ctx.letterSpacing = '3px';
      ctx.fillText('PRIVATE RETREAT & EXCLUSIVE STAYCATION', canvas.width / 2, 85);

      // Reset letter spacing
      ctx.letterSpacing = '0px';

      // 4. Draw Discount Promo Sticky Badge (Top Right Corner)
      if (customPromoBadge && customPromoBadge.trim() !== '' && customPromoBadge.toUpperCase() !== 'NORMAL' && customPromoBadge.toUpperCase() !== 'TIDAK ADA PROMO' && customPromoBadge !== 'Tidak ada promo / Biaya Normal') {
        const promoText = `✨  ${customPromoBadge.toUpperCase()}  ✨`;
        
        ctx.font = 'bold 16px "Inter", sans-serif';
        const textMetrics = ctx.measureText(promoText);
        const badgeWidth = Math.max(340, textMetrics.width + 48);
        const badgeHeight = 54;
        const badgeX = canvas.width - badgeWidth - 40;
        const badgeY = 140;

        // Draw beautiful premium pill tag with dual tone styling
        ctx.fillStyle = '#0F172A'; // Dark luxury background
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 27);
        ctx.fill();

        ctx.strokeStyle = primaryHex; // Golden/accent boundary frame
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 27);
        ctx.stroke();

        // Render clean matching colored text perfectly centered
        ctx.font = 'bold 16px "Inter", sans-serif';
        ctx.fillStyle = primaryHex;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(promoText, badgeX + (badgeWidth / 2), badgeY + (badgeHeight / 2) + 1);
        
        ctx.textBaseline = 'alphabetic'; // Reset textBaseline
      }

      // 5. Draw the Main Information Board Card (Bottom Overlay)
      const cardY = 820;
      const cardHeight = 640;
      const cardWidth = canvas.width - 120;
      const cardX = 60;

      // Card Background with fine border styling
      ctx.fillStyle = 'rgba(15, 23, 42, 0.90)'; // Dark graphite backdrop
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 32);
      ctx.fill();

      // Golden or emerald accent outer rim border
      ctx.strokeStyle = primaryHex;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 32);
      ctx.stroke();

      // Card Header Block for the Villa Room name
      let rNameFontSize = 36;
      ctx.font = `bold ${rNameFontSize}px "Inter", sans-serif`;
      const roomNameUpper = selectedRoomDetails.name.toUpperCase();
      let nameWidth = ctx.measureText(roomNameUpper).width;
      
      // Scale down font size if room name is too long to prevent badge collision
      while (nameWidth > 480 && rNameFontSize > 22) {
        rNameFontSize -= 2;
        ctx.font = `bold ${rNameFontSize}px "Inter", sans-serif`;
        nameWidth = ctx.measureText(roomNameUpper).width;
      }
      
      const ribbonWidth = Math.max(340, Math.min(640, nameWidth + 80));

      ctx.fillStyle = primaryHex;
      ctx.beginPath();
      ctx.roundRect(cardX + 40, cardY - 45, ribbonWidth, 90, 20);
      ctx.fill();

      ctx.fillStyle = '#111827';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(roomNameUpper, cardX + 80, cardY);
      ctx.textBaseline = 'alphabetic'; // Reset baseline

      // Price Tag Badge inside the card
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.roundRect(cardX + cardWidth - 365, cardY + 45, 325, 110, 18);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.stroke();

      const priceText = `Rp ${selectedRoomDetails.ratePerNight.toLocaleString('id-ID')}`;
      const perMalamText = '/ malam';

      ctx.font = 'semibold 14px "Inter", sans-serif';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText('Tarif Mulai Dari:', cardX + cardWidth - 335, cardY + 74);

      // Measure & dynamically auto-scale price font size if needed
      let priceFontSize = 28;
      ctx.font = `extrabold ${priceFontSize}px "Inter", sans-serif`;
      let priceWidth = ctx.measureText(priceText).width;
      
      const maxAvailableWidth = 275; // total box width 325 - margin padding 50

      while (priceWidth > maxAvailableWidth && priceFontSize > 16) {
        priceFontSize -= 1;
        ctx.font = `extrabold ${priceFontSize}px "Inter", sans-serif`;
        priceWidth = ctx.measureText(priceText).width;
      }

      // Draw the auto-scaled price text on its own line
      ctx.font = `extrabold ${priceFontSize}px "Inter", sans-serif`;
      ctx.fillStyle = primaryHex;
      ctx.fillText(priceText, cardX + cardWidth - 335, cardY + 108);

      // Draw the '/ malam' directly below the price
      ctx.font = 'medium 14px "Inter", sans-serif';
      ctx.fillStyle = '#E2E8F0';
      ctx.fillText(perMalamText, cardX + cardWidth - 335, cardY + 138);

      // 6. Draw Headline & Tagline Slogan
      // Left space fits between cardX + 50 (110) and the price tag start (660)
      const maxTextWidth = 500;
      
      // Calculate dynamic font-size for wrapped headline
      let headlineFontSize = 26;
      ctx.font = `bold ${headlineFontSize}px "Inter", sans-serif`;
      let headlineLines = getWrappedLines(ctx, customHeadline.toUpperCase(), maxTextWidth);
      while (headlineLines.length > 2 && headlineFontSize > 18) {
        headlineFontSize -= 2;
        ctx.font = `bold ${headlineFontSize}px "Inter", sans-serif`;
        headlineLines = getWrappedLines(ctx, customHeadline.toUpperCase(), maxTextWidth);
      }

      // Calculate dynamic font-size for wrapped tagline
      let taglineFontSize = 17;
      ctx.font = `italic ${taglineFontSize}px "Inter", sans-serif`;
      let taglineLines = getWrappedLines(ctx, `"${customTagline}"`, maxTextWidth);
      while (taglineLines.length > 2 && taglineFontSize > 13) {
        taglineFontSize -= 1;
        ctx.font = `italic ${taglineFontSize}px "Inter", sans-serif`;
        taglineLines = getWrappedLines(ctx, `"${customTagline}"`, maxTextWidth);
      }

      // Render headline lines
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${headlineFontSize}px "Inter", sans-serif`;
      let currentDrawY = cardY + 74;
      headlineLines.forEach((line) => {
        ctx.fillText(line, cardX + 50, currentDrawY);
        currentDrawY += (headlineFontSize + 6);
      });

      // Render tagline lines
      ctx.fillStyle = '#E2E8F0';
      ctx.font = `italic ${taglineFontSize}px "Inter", sans-serif`;
      taglineLines.forEach((line) => {
        ctx.fillText(line, cardX + 50, currentDrawY + 4);
        currentDrawY += (taglineFontSize + 6);
      });

      // Divider Line inside Board Card
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cardX + 40, cardY + 175);
      ctx.lineTo(cardX + cardWidth - 40, cardY + 175);
      ctx.stroke();

      // 7. Write Premium Highlight Amenities/Bullet Points
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 20px "Inter", sans-serif';
      ctx.fillText('🎁 FASILITAS & PENAWARAN UTAMA:', cardX + 50, cardY + 215);

      ctx.font = 'medium 17px "Inter", sans-serif';
      ctx.fillStyle = '#E2E8F0';

      // Draw all 4 bullets in a clean, vertical list instead of tight columns to prevent horizontal overlapping
      const bulletX = cardX + 55;
      const perks = [customPerk1, customPerk2, customPerk3, customPerk4].filter(p => p && p.trim() !== '');
      
      perks.forEach((perk, idx) => {
        const bulletY = cardY + 252 + (idx * 27);
        ctx.fillText(`•  ${perk}`, bulletX, bulletY);
      });

      // 8. Bottom Information Footer Layer (Contact Booking Direct Call out)
      const footerY = cardY + 365;
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.roundRect(cardX + 40, footerY, cardWidth - 80, 210, 20);
      ctx.fill();

      // CTA Header
      ctx.font = 'bold 18px "Inter", sans-serif';
      ctx.fillStyle = primaryHex;
      ctx.fillText('📲 HUBUNGI LAYANAN ADMIN UNTUK RESERVASI SEKARANG:', cardX + 80, footerY + 45);

      // WhatsApp Action instruction
      ctx.font = 'semibold 20px "Inter", sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`Ketik: "Pesan ${selectedRoomDetails.name} - [Nama Anda]"\nKirim via WhatsApp ke:`, cardX + 80, footerY + 90);

      // Phone pill tag
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.roundRect(cardX + 80, footerY + 125, 420, 56, 12);
      ctx.fill();

      ctx.font = 'bold 22px "Inter", sans-serif';
      ctx.fillStyle = '#10B981'; // Green call color
      ctx.fillText(`💬  ${contactPhone} (Admin Villa)`, cardX + 110, footerY + 162);

      // Capacity Tag
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.roundRect(cardX + 520, footerY + 125, 340, 56, 12);
      ctx.fill();

      ctx.font = 'bold 18px "Inter", sans-serif';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText(`👥  Max: ${selectedRoomDetails.capacity} Tamu Dewasa`, cardX + 550, footerY + 160);

      // Download trigger
      const link = document.createElement('a');
      link.download = `Flyer_Villa_${selectedRoomDetails.id}_Brosur.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      setRenderingImage(false);
    };

    img.onerror = (err) => {
      console.error('Error loading image on canvas drawer:', err);
      // Fallback: If external image can't be fetched due to CORS blocking draw without image but with high-end designer pattern!
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw artistic line design pattern
      ctx.strokeStyle = currentTemplate.primaryColor;
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.height; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i + 200);
        ctx.stroke();
      }

      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Redraw standard card items
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 40px "Inter", sans-serif';
      ctx.fillText(selectedRoomDetails.name.toUpperCase(), 100, 200);
      
      const link = document.createElement('a');
      link.download = `Flyer_Villa_${selectedRoomDetails.id}_Brosur.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      setRenderingImage(false);
    };
  };

  return (
    <div className="space-y-6">
      {/* Top Main Mode Selecting Tab Switch */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveSubTab('text')}
          id="btn-subtab-ai-copywriter"
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeSubTab === 'text'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <MessageSquareCode className="w-4 h-4" />
          Teks Salinan Copywriter (Gemini AI)
        </button>
        <button
          onClick={() => setActiveSubTab('image')}
          id="btn-subtab-visual-poster"
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeSubTab === 'image'
              ? 'border-blue-900 text-blue-900'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-amber-500 fill-amber-500" />
          Desain Brosur Gambar (Visual flyer poster)
          <span className="bg-amber-100 text-amber-900 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full">
            BARU
          </span>
        </button>
      </div>

      {activeSubTab === 'text' ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Parameters Selector Config Sheet (Left) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 space-y-5 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-105">
                <div className="p-2 bg-blue-50 text-blue-900 rounded-lg">
                  <Sparkles className="w-5 h-5 animate-pulse text-amber-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-800">Konfigurasi Brosur AI</h3>
                  <p className="text-[10px] text-gray-400">Atur parameter bahasa & sasaran promosi</p>
                </div>
              </div>

              {/* Room Type Selector */}
              <div>
                <label htmlFor="brochure-room" className="block text-xs font-bold text-gray-700 mb-1.5">
                  Pilih Aset Kamar / Villa
                </label>
                <select
                  id="brochure-room"
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="cursor-pointer w-full text-xs px-3 py-2.5 border border-gray-200 outline-none rounded-xl focus:border-blue-900 focus:ring-1 focus:ring-blue-900/10 bg-slate-50/50 text-gray-800 font-bold"
                >
                  {roomTypes.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name} — Rp {room.ratePerNight.toLocaleString('id-ID')}/malam
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Audience */}
              <div>
                <label htmlFor="brochure-audience" className="block text-xs font-bold text-gray-700 mb-1.5">
                  Target Audiens Promosi
                </label>
                <select
                  id="brochure-audience"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="cursor-pointer w-full text-xs px-3 py-2.5 border border-gray-200 outline-none rounded-xl focus:border-blue-900 focus:ring-1 focus:ring-blue-900/10 bg-slate-50/50 text-gray-800"
                >
                  <option value="Keluarga Besar (Staycation Keluarga)">👪 Keluarga Besar & Anak-Anak</option>
                  <option value="Pasangan Bulan Madu (Honeymoon Couples)">💖 Pasangan Romantis / Honeymoon</option>
                  <option value="Rekan Kerja Kantor (Corporate Gathering)">🏢 Rekan Kerja / Outing Kantor</option>
                  <option value="Backpacker & Petualang Muda">🎒 Backpacker & Kaum Travel Milenial</option>
                  <option value="Arisan / Pengajian / Komunitas">🌿 Komunitas / Group Arisan Ibu-Ibu</option>
                </select>
              </div>

              {/* Voice Accent */}
              <div>
                <label htmlFor="brochure-accent" className="block text-xs font-bold text-gray-700 mb-1.5">
                  Aksen / Tonality Gaya Penyampaian
                </label>
                <select
                  id="brochure-accent"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  className="cursor-pointer w-full text-xs px-3 py-2.5 border border-gray-200 outline-none rounded-xl focus:border-blue-900 focus:ring-1 focus:ring-blue-900/10 bg-slate-50/50 text-gray-800"
                >
                  <option value="Mewah & Elegan (Bahasa Berorientasi Kelas)">💎 Mewah, Berkelas & Eksklusif</option>
                  <option value="Hangat, Nyaman & Santai (Cozy Atmosphere)">🏡 Hangat, Ramah, Nyaman & Sanitasi</option>
                  <option value="Diskon Heboh & CTA Mendesak (Urgensi Booking)">🔥 Diskon Heboh & Urgensi Terbatas</option>
                  <option value="Puitis, Santai & Terinspirasi Alam (Nature-centric)">🍃 Puitis, Estetis & Menyatu Dengan Alam</option>
                </select>
              </div>

              {/* Penawaran Promo */}
              <div>
                <label htmlFor="brochure-discount" className="block text-xs font-bold text-gray-700 mb-1.5">
                  Penawaran Promo Khusus
                </label>
                <select
                  id="brochure-discount"
                  value={discount}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDiscount(val);
                    setCustomPromoBadge(getCleanPromoBadgeText(val));
                  }}
                  className="cursor-pointer w-full text-xs px-3 py-2.5 border border-gray-200 outline-none rounded-xl focus:border-blue-900 focus:ring-1 focus:ring-blue-900/10 bg-slate-50/50 text-gray-800 font-semibold"
                >
                  <option value="Diskon Langsung 10% Spesial Bulan Juni">🏷️ Potongan Langsung 10% Nett</option>
                  <option value="Gratis Sarapan Pagi (Breakfast) untuk 4 Orang">☕ Gratis Sarapan Lezat Pagi Hari</option>
                  <option value="Fasilitas Extra Bed Tambahan Tanpa Biaya">🛏️ Gratis Extra Bed Kasur Tambahan</option>
                  <option value="Gratis Check-in Awal (Early Check-in Jam 11 Siang)">🕒 Gratis Early Check-in Tanpa Biaya Tambahan</option>
                  <option value="Tidak ada promo / Biaya Normal">❌ Tanpa Tambahan Promo Khusus</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-105/50 mt-4">
              <button
                onClick={handleGenerateAI}
                disabled={loading}
                id="btn-trigger-ai-generate"
                className="cursor-pointer w-full py-3 px-4 bg-blue-900 hover:bg-blue-950 disabled:bg-slate-300 text-white font-semibold text-xs rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    Menciptakan Brosur via AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                    Generate Brosur dengan AI
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Draft Result View Panel (Right) */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between overflow-hidden">
            {/* Result Header */}
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-blue-900" />
                Hasil Copywriting Brosur Promosi
              </span>

              {generatedText && (
                <button
                  onClick={handleCopyText}
                  id="btn-copy-brochure-text"
                  className="cursor-pointer bg-slate-100 hover:bg-blue-900 hover:text-white px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-gray-600 transition-colors flex items-center gap-1"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 group-hover:text-white" />
                      Berhasil Disalin!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Salin Teks Lengkap
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Generated Text Area */}
            <div className="flex-1 p-6 overflow-y-auto max-h-[460px] adaptive-scrollbar min-h-[300px]">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-16">
                  <Loader2 className="w-12 h-12 text-blue-900 animate-spin" />
                  <div>
                    <p className="text-sm font-bold text-gray-700 animate-pulse">Sedang Menghubungi Penyair Gemini...</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">Kami sedang merangkai diksi pemasaran yang elegan dan persuasif khusus untuk tipe kamar Anda.</p>
                  </div>
                </div>
              ) : generatedText ? (
                <div className="space-y-4">
                  {isDemoNotification && (
                    <div className="p-2.5 bg-blue-50/60 border border-blue-200 text-blue-900 text-[10px] rounded-lg font-medium">
                      💡 *Mode Asisten Demo Aktif:* API Key belum disetup, namun kami menyuguhkan mock-brochure berkelas secara lokal demi demonstrasi langsung yang prima.
                    </div>
                  )}
                  {/* Output Content rendering smoothly */}
                  <div
                    id="brochure-rendered-content"
                    className="whitespace-pre-wrap text-xs md:text-sm text-gray-700 font-sans leading-relaxed tracking-wide bg-slate-50/40 border border-gray-100 p-5 rounded-2xl select-all select-text font-serif"
                  >
                    {generatedText}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-16">
                  <MessageSquareCode className="w-12 h-12 text-slate-200" />
                  <div>
                    <p className="text-sm font-bold text-slate-400">Pamflet Digital Siap Diterbitkan</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                      Silakan pilih konfigurasi di sebelah kiri, kemudian klik tombol <strong className="text-blue-900">"Generate Brosur dengan AI"</strong> untuk memulai penyusunan promosi otomatis berkelas.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Brochure footer info */}
            <div className="p-3 bg-slate-50/80 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500 font-medium">
              <span className="flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                Tips: Bagikan teks ini ke status Whatsapp, Instagram Bio, atau grup Facebook.
              </span>
              <span className="font-semibold text-blue-900 flex items-center gap-0.5">
                Powered by Gemini <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* ================= IMAGE FLYER BROSUR GENERATOR WORKSPACE ================= */
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Controls Sheet Left Side */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-xs flex flex-col justify-between">
            <div className="space-y-4 overflow-y-auto max-h-[500px] pr-1 adaptive-scrollbar">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
                  <ImageIcon className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-800">Desainer Poster Brosur</h3>
                  <p className="text-[10px] text-gray-400">Atur kustomisasi visual & ikon pamflet</p>
                </div>
              </div>

              {/* Selector Asset Kamar */}
              <div>
                <label htmlFor="flyer-room-select" className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Aset Kamar Utama
                </label>
                <select
                  id="flyer-room-select"
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="cursor-pointer w-full text-xs px-3 py-2 border border-gray-200 outline-none rounded-xl focus:border-blue-900 bg-slate-50/50 text-gray-800 font-bold"
                >
                  {roomTypes.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Theme Template */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Tema Visual & Warna Gaya
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => setSelectedTemplate(tpl.id)}
                      className={`text-[11px] font-bold p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                        selectedTemplate === tpl.id
                          ? 'border-blue-900 bg-blue-50/50 text-blue-900 shadow-xs'
                          : 'border-gray-200 text-gray-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full bg-gradient-to-r ${tpl.bgGradient}`} />
                      {tpl.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Photo Options: Presets vs Upload Image */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Foto Latar Brosur
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setUploadedImage(null)}
                    className={`flex-1 text-[11px] py-1.5 px-3 rounded-lg border font-semibold ${
                      !uploadedImage ? 'bg-slate-900 text-white' : 'bg-slate-100 text-gray-600'
                    }`}
                  >
                    Foto Standar Kamar
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex-1 text-[11px] py-1.5 px-3 rounded-lg border font-semibold flex items-center justify-center gap-1 ${
                      uploadedImage ? 'bg-slate-900 text-white' : 'bg-slate-100 text-gray-600'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload Foto Sendiri
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>

              {/* Text Input Fields for customization */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div>
                  <label htmlFor="poster-headline" className="block text-[10px] font-bold text-gray-500 uppercase">
                    Judul Utama Poster
                  </label>
                  <input
                    id="poster-headline"
                    type="text"
                    value={customHeadline}
                    onChange={(e) => setCustomHeadline(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-900 text-gray-800"
                  />
                </div>

                <div>
                  <label htmlFor="poster-tagline" className="block text-[10px] font-bold text-gray-500 uppercase">
                    Slogan / Sub-tagline
                  </label>
                  <input
                    id="poster-tagline"
                    type="text"
                    value={customTagline}
                    onChange={(e) => setCustomTagline(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-900 text-gray-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="poster-perk1" className="block text-[10px] font-bold text-gray-500 uppercase">Poin Kelebihan 1</label>
                    <input id="poster-perk1" type="text" value={customPerk1} onChange={(e) => setCustomPerk1(e.target.value)} className="w-[105%] text-[10px] px-2 py-1.5 border border-gray-200 rounded-md" />
                  </div>
                  <div>
                    <label htmlFor="poster-perk2" className="block text-[10px] font-bold text-gray-500 uppercase">Poin Kelebihan 2</label>
                    <input id="poster-perk2" type="text" value={customPerk2} onChange={(e) => setCustomPerk2(e.target.value)} className="w-[105%] text-[10px] px-2 py-1.5 border border-gray-200 rounded-md" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="poster-perk3" className="block text-[10px] font-bold text-gray-500 uppercase">Poin Kelebihan 3</label>
                    <input id="poster-perk3" type="text" value={customPerk3} onChange={(e) => setCustomPerk3(e.target.value)} className="w-[105%] text-[10px] px-2 py-1.5 border border-gray-200 rounded-md" />
                  </div>
                  <div>
                    <label htmlFor="poster-perk4" className="block text-[10px] font-bold text-gray-500 uppercase">Poin Kelebihan 4</label>
                    <input id="poster-perk4" type="text" value={customPerk4} onChange={(e) => setCustomPerk4(e.target.value)} className="w-[105%] text-[10px] px-2 py-1.5 border border-gray-200 rounded-md" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
                  <div>
                    <label htmlFor="poster-discount" className="block text-[10px] font-bold text-gray-500 uppercase">Badge Promo</label>
                    <input
                      id="poster-discount"
                      type="text"
                      value={customPromoBadge}
                      onChange={(e) => setCustomPromoBadge(e.target.value)}
                      placeholder="Contoh: POTONGAN 10% NETT"
                      className="w-full text-[10px] p-2 bg-white rounded-md text-blue-950 font-bold border border-gray-200 outline-none focus:border-blue-900 focus:ring-1"
                    />
                  </div>
                  <div>
                    <label htmlFor="poster-phone" className="block text-[10px] font-bold text-gray-500 uppercase">No. WhatsApp Hubungi</label>
                    <input id="poster-phone" type="text" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="w-full text-[10px] px-2 py-1.5 border border-gray-200 rounded-md font-bold text-emerald-800" />
                  </div>
                </div>
              </div>
            </div>

            {/* Print canvas trigger button */}
            <div className="pt-3 border-t border-gray-100 mt-4">
              <button
                onClick={handleDownloadFlyerImage}
                disabled={renderingImage}
                className="cursor-pointer w-full py-3 px-4 bg-slate-900 hover:bg-slate-950 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {renderingImage ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    Sedang Merender Gambar Brosur...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-emerald-400" />
                    Download Gambar Brosur (PNG)
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Majestic Real-time Visual Brochure Preview (Right Side) */}
          <div className="lg:col-span-3 flex flex-col justify-center items-center p-4 bg-slate-100 rounded-2xl border border-gray-200 overflow-hidden relative">
            <span className="absolute top-2 left-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">
              Live Mockup Preview (Skala HP)
            </span>
            
            {/* Live mockup card container */}
            <div
              id="live-poster-flyer-document"
              className="w-full max-w-[360px] h-[510px] bg-cover bg-center rounded-2xl shadow-xl relative text-white flex flex-col justify-between overflow-hidden border border-gray-300 animate-scale-up"
              style={{ backgroundImage: `url(${activeImage})` }}
            >
              {/* Dynamic Overlay based on template */}
              <div className={`absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-black/40 z-0`} />

              {/* Top luxury header bar */}
              <div className="relative z-10 w-full bg-black/40 backdrop-blur-xs py-2 text-center text-white border-b border-white/10">
                <span className="block text-[8px] tracking-[4px] font-bold text-white uppercase">VILLA INDAH HARMONI</span>
                <span className="block text-[5px] tracking-[1.5px] text-gray-300 font-semibold mt-0.5">EXCLUSIVE PRIVATE SANCTUARY</span>
              </div>

              {/* Dynamic Sticky Promo Badge on the top portion */}
              {customPromoBadge && customPromoBadge.trim() !== '' && customPromoBadge.toUpperCase() !== 'NORMAL' && customPromoBadge.toUpperCase() !== 'TIDAK ADA PROMO' && customPromoBadge !== 'Tidak ada promo / Biaya Normal' && (
                <div className="relative z-10 self-end mr-3 mt-3">
                  <div className={`text-[8.5px] font-black px-3 py-1.5 rounded-full text-slate-950 shadow-md flex items-center gap-1.5 animate-pulse bg-gradient-to-r ${currentTemplate.bgGradient} max-w-[260px]`}>
                    <span className="text-[10px]">✨</span>
                    <span className="truncate uppercase tracking-wider">{customPromoBadge}</span>
                  </div>
                </div>
              )}

              {/* Bottom Info Board */}
              <div className="relative z-10 mx-3 mb-3 p-3 bg-slate-950/85 backdrop-blur-md rounded-xl border border-white/10 space-y-2.5">
                {/* Float-up title pill */}
                <div className="flex justify-between items-center bg-white/5 p-1 px-2 rounded-lg border border-white/5">
                  <span className="text-[11px] font-black tracking-wide" style={{ color: currentTemplate.primaryColor }}>
                    {selectedRoomDetails?.name || 'VILLA PREMIUM'}
                  </span>
                  <span className="text-[8px] text-gray-300 font-semibold">
                    👥 Max: {selectedRoomDetails?.capacity} Tamu
                  </span>
                </div>

                {/* customized headlines */}
                <div className="space-y-0.5 text-left">
                  <h4 className="text-[11px] font-black leading-tight text-white tracking-tight uppercase">
                    {customHeadline}
                  </h4>
                  <p className="text-[8px] text-gray-300 leading-relaxed font-sans italic opacity-90">
                    "{customTagline}"
                  </p>
                </div>

                <div className="border-t border-white/10 pt-1.5 flex justify-between gap-3 text-left">
                  {/* Custom Highlights */}
                  <div className="flex-1 space-y-1">
                    <span className="block text-[6px] font-extrabold text-slate-400 uppercase tracking-wider">Highlight Fasilitas:</span>
                    <ul className="text-[6.5px] space-y-0.5 text-gray-300 font-medium">
                      <li className="truncate">⭐ {customPerk1}</li>
                      <li className="truncate">⭐ {customPerk2}</li>
                    </ul>
                  </div>

                  {/* Price Label Box */}
                  <div className="bg-white/5 p-1.5 px-2 rounded-lg text-right min-w-[100px] border border-white/5 flex flex-col justify-center">
                    <span className="text-[5px] text-slate-400 block uppercase font-bold">Tarif Mulai Dari:</span>
                    <span className="text-[11px] font-mono font-extrabold text-white" style={{ color: currentTemplate.primaryColor }}>
                      Rp {selectedRoomDetails?.ratePerNight.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[5px] text-slate-300 block font-medium">/ malam</span>
                  </div>
                </div>

                {/* Bottom WhatsApp Contact block */}
                <div className="bg-slate-900 border border-emerald-950/40 p-1.5 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-1 text-left">
                    <Phone className="w-2.5 h-2.5 text-emerald-400 fill-emerald-400" />
                    <div>
                      <span className="block text-[5px] text-slate-400 font-bold uppercase">BOOKING VIA WHATSAPP:</span>
                      <span className="block font-mono text-[9px] text-emerald-400 font-extrabold">{contactPhone}</span>
                    </div>
                  </div>
                  <div className="bg-slate-850 p-1 rounded-sm border border-white/5 flex items-center">
                    <QrCode className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Hidden native canvas to draw the hi-density export images */}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      )}
    </div>
  );
}
