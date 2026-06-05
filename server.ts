/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK lazily to avoid crashing if key is not defined during startup
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  // If no API key is specified, we'll return a stub or throw an error when actually calling.
  // Note: For preview safety, we can handle missing key gracefully.
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing. Please add it to your Settings > Secrets.');
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// ==================== API ROUTES ====================

/**
 * API to generate villa brochure using Gemini AI
 */
app.post('/api/generate-brochure', async (req, res) => {
  try {
    const { roomName, ratePerNight, capacity, description, audience, accent, discount } = req.body;

    if (!roomName) {
      res.status(400).json({ error: 'Data kamar (roomName) tidak lengkap.' });
      return;
    }

    const ai = getAiClient();
    
    // Construct rich promo prompt
    const prompt = `
      Buatkan teks brosur promosi pemasaran iklan yang sangat menarik, estetik, dan persuasif untuk villa kami:
      Nama Tipe Kamar/Villa: ${roomName}
      Tarif Sewa: Rp ${ratePerNight?.toLocaleString('id-ID')} per malam
      Kapasitas Maksimal: ${capacity} tamu
      Deskripsi Kamar: ${description}
      
      Spesifikasi brosur khusus:
      1. Target Audiens Utama: ${audience || 'Umum'} (misal: Keluarga, Pasangan Romantis, Rekan Kerja, dll)
      2. Warna Gaya Bahasa/Aksen Penyampaian: ${accent || 'Elegant & Eksklusif'} (misal: Hangat & Cozy, Diskon Heboh, dll)
      3. Penawaran Spesial Tambahan: ${discount || 'Tidak ada'}
      
      Format output wajib menggunakan bahasa Indonesia yang indah, kaya akan detail sensori (pemandangan sejuk, udara asri, ketenangan), dan terstruktur rapi dengan Markdown/Emoji:
      - **Judul Utama/Headline**: Sesuatu yang sangat menggugah selera liburan, eye-catching.
      - **Hook/Pembuka**: Membayangkan sensasi berada di villa tersebut.
      - **Ulasan Fasilitas & Kemewahan**: Jabarkan secara puitis dan berkelas fasilitas dari deskripsi dasar yang diberikan.
      - **Mengapa Harus Memilih Tipe Ini**: Hubungkan ke target audiens (${audience}).
      - **Skema Harga & Promo Menarik**: Cantumkan harga sewa Rp ${ratePerNight?.toLocaleString('id-ID')} dan sebutkan promo tambahan jika ada (${discount}).
      - **Call-to-Action (CTA) Desakan**: Kalimat persuasif untuk segera memesan sebelum kehabisan slot.
      - Lengkap dengan pembatas visual yang elegan di atas dan di bawah brosur menggunakan karakter bintang (*) atau dekorasi teks.
      
      Jangan berikan cuplikan penjelasan tambahan (seperti "Ini hasil teks brosur Anda"), melainkan langsung saja mulai dari judul brosur promosi di dalam teks Markdown agar langsung bisa dicopy.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        temperature: 0.85,
        systemInstruction: 'Anda adalah Copywriter Pemasaran Villa Mewah dan Akomodasi Eksklusif profesional. Anda pandai membuat calon tamu terhipnotis dengan keindahan diksi Anda.',
      },
    });

    const brochureText = response.text || '';
    res.json({ success: true, brochure: brochureText });

  } catch (error: any) {
    console.error('Error generating brochure with Gemini API:', error);
    
    // Seamless fallback for offline / dev demo without keys, so user experience is perfect!
    const roomName = req.body.roomName || 'Villa Kamar';
    const ratePerNight = req.body.ratePerNight || 1200000;
    const discount = req.body.discount || 'Tidak ada';
    
    const demoBrochure = `
🌟 **SEBUAH RETREAT SURGAWI MENANTI ANDA DI ${roomName.toUpperCase()}!** 🌟

🌿 *Bayangkan terbangun pagi dengan sapuan kabut tipis pegunungan, ditemani secangkir teh panas hangat di balkon pribadi Anda, memandang hamparan hijau yang menyejukkan jiwa...*

🏡 **${roomName}** hadir sebagai jawaban atas kerinduan Anda akan ketenangan hakiki. Tempat perlindungan istimewa yang memadukan arsitektur elegan modern dengan pelukan alam pegunungan asri yang tiada duanya.

✨ **Fasilitas Premium & Keistimewaan:**
• 🛏️ Kasur ukuran King-Size super nyaman untuk tidur berkualitas tinggi.
• 🚿 Kamar mandi mewah semi-outdoor dilengkapi dengan bathtub hangat.
• 🌅 Balkon/Teras privat dengan arah pemandangan taman tropis & sunset spektakuler.
• 🛋️ Ruang keluarga eksklusif dengan akses Wi-Fi kencang dan Smart TV.

👪 **Sempurna Untuk Kebahagiaan Anda:**
Sangat direkomendasikan untuk Anda yang ingin menghabiskan momen berkualitas sejenak bersama orang terkasih. Keintiman, privasi penuh, dan kenangan indah akan tercipta secara natural di setiap sudut ruangan kami.

💰 **Penawaran Spesial Musim Ini:**
• Hanya **Rp ${ratePerNight.toLocaleString('id-ID')}/malam** (Nett)
• 🎁 **Promo Tambahan:** ${discount !== 'None' && discount !== 'Tidak ada' ? `✨ **Dapatkan Benefit: ${discount}!**` : 'Bebas penalti cancelation & Free teh botol dingin saat check-in.'}

⌛ *Grup slot Juni 2026 sangat terbatas! Hubungi Admin Villa sekarang juga sebelum tipe kamar impian ini sepenuhnya terpesan oleh keluarga lainnya.*

📲 **BOOKING DIRECT VIA WHATSAPP:**
Ketik: "Pesan ${roomName} - [Nama Anda]" kirim ke nomor admin di profil.
    `;

    // If key is missing, respond with success but include a warning + the beautiful simulated brochure
    if (error.message && error.message.includes('GEMINI_API_KEY')) {
      res.json({
        success: true,
        brochure: `⚠️ **[MODE ASISTEN DEMO - GEMINI_API_KEY belum terkonfigurasi di Secrets. Menampilkan Teks Brosur Standar Kreatif]**\n\n${demoBrochure}`,
        isDemo: true
      });
    } else {
      res.status(500).json({ error: error.message || 'Terjadi kesalahan internal server.' });
    }
  }
});

// ==================== VITE DEVELOPMENT MIDDLEWARE ====================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express server running on http://localhost:${PORT}`);
  });
}

startServer();
