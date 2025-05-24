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
  try {
    const { data, error } = await supabase.storage
      .from('shapefileUploads')
      .list('shapefiles', { search: zip_path });
    if (error) throw error;
    if (!data.length) {
      return res.status(400).json({ error: 'File tidak ditemukan' });
    }
    res.json({ message: 'Validasi berhasil' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(process.env.PORT || 3001, () => {
  console.log('Server berjalan');
});