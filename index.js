require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express();

app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

app.post('/validate-shapefile', async (req, res) => {
  const { zip_path } = req.body;
  console.log('Validasi file:', zip_path);
  try {
    // Periksa keberadaan file dengan path lengkap
    const { data, error } = await supabase.storage
      .from('shapefileuploads')
      .list('shapefiles', {
        limit: 1,
        offset: 0,
        search: zip_path.split('/').pop() // Ambil nama file saja
      });

    console.log('Hasil list:', data, 'Error:', error);
    if (error) throw error;
    if (!data.length || !data.some(file => file.name === zip_path.split('/').pop())) {
      return res.status(400).json({ error: 'File tidak ditemukan' });
    }

    res.json({ message: 'Validasi berhasil' });
  } catch (error) {
    console.error('Error validasi:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(process.env.PORT || 3001, () => {
  console.log('Server berjalan di port', process.env.PORT || 3001);
});