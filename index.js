require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express();

// Konfigurasi CORS untuk keamanan
app.use(cors({
  origin: [
    'https://upload-shp.netlify.app',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));
app.use(express.json());

// Inisialisasi Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Middleware untuk logging request
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
  console.log(`[${timestamp}] ${req.method} ${req.url} - Body:`, req.body);
  next();
});

app.post('/validate-shapefile', async (req, res) => {
  const { zip_path, bucket } = req.body;
  console.log('Menerima request:', { zip_path, bucket });

  // Validasi input
  if (!zip_path || !bucket) {
    console.error('Parameter hilang:', { zip_path, bucket });
    return res.status(400).json({ error: 'zip_path dan bucket wajib diisi!' });
  }

  // Validasi bucket
  const validBuckets = ['kbr', 'persemaian', 'bitpro', 'mataair'];
  if (!validBuckets.includes(bucket)) {
    console.error('Bucket tidak valid:', bucket);
    return res.status(400).json({ error: `Bucket tidak valid! Harus salah satu dari: ${validBuckets.join(', ')}.` });
  }

  // Validasi format zip_path
  if (!zip_path.startsWith('shapefiles/') || !zip_path.toLowerCase().endsWith('.zip')) {
    console.error('Format zip_path tidak valid:', zip_path);
    return res.status(400).json({ error: 'zip_path harus dalam format shapefiles/<nama_file>.zip' });
  }

  try {
    const fileName = zip_path.split('/').pop();
    console.log('Mencari file:', fileName, 'di bucket:', bucket, 'path:', zip_path);

    // List files di shapefiles
    const { data: shapefilesData, error: shapefilesError } = await supabase.storage
      .from(bucket)
      .list('shapefiles', {
        limit: 100,
        offset: 0
      });

    console.log(`Isi folder shapefiles di bucket ${bucket}:`, shapefilesData ? shapefilesData.map(f => f.name) : 'Kosong', 'Error:', shapefilesError);
    if (shapefilesError) {
      console.error('Error list shapefiles:', shapefilesError);
      throw new Error(`Gagal mengakses shapefiles: ${shapefilesError.message}`);
    }

    const fileExists = shapefilesData.some(file => file.name === fileName);
    if (!fileExists) {
      // Cek root bucket untuk debugging
      const { data: rootData, error: rootError } = await supabase.storage
        .from(bucket)
        .list('', { limit: 100, offset: 0 });
      console.log(`Isi root bucket ${bucket}:`, rootData ? rootData.map(f => f.name) : 'Kosong', 'Error:', rootError);
      return res.status(404).json({ 
        error: `File ${fileName} tidak ditemukan di bucket ${bucket}/shapefiles`,
        rootContents: rootData ? rootData.map(f => f.name) : []
      });
    }

    console.log('Validasi berhasil:', { fileName, bucket });
    res.status(200).json({ 
      message: 'Validasi berhasil',
      fileName,
      bucket 
    });
  } catch (error) {
    console.error('Error validasi:', error);
    res.status(500).json({ 
      error: 'Gagal memvalidasi file',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server berjalan di port ${port}`);
});