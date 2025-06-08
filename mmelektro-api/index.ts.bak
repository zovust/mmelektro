import express from "express";
import type { Request, Response, NextFunction } from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user: {
        id: number;
        username: string;
        email: string;
        role: string;
      };
    }
  }
}

// Middleware untuk verifikasi token
const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    res.status(401).json({ error: 'Token tidak ditemukan' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number;
      username: string;
      email: string;
      role: string;
    };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token tidak valid' });
  }
};

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sistem_diagnosa_kipas',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Test database connection
async function testConnection(): Promise<void> {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('Database connection failed:', error);
  }
}

testConnection();

// Routes

// Register user
app.post('/api/auth/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, email, nama_lengkap } = req.body;

    // Validasi input
    if (!username || !password || !email || !nama_lengkap) {
      res.status(400).json({ error: 'Semua field harus diisi' });
      return;
    }

    // Cek username dan email sudah ada atau belum
    const [existingUsers] = await pool.execute(
      'SELECT * FROM user WHERE username = ? OR email = ?',
      [username, email]
    );

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      res.status(400).json({ error: 'Username atau email sudah terdaftar' });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user baru
    await pool.execute(
      'INSERT INTO user (username, password, email, nama_lengkap) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, email, nama_lengkap]
    );

    res.json({ message: 'Registrasi berhasil' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Gagal mendaftarkan user' });
  }
});

// Login user
app.post('/api/auth/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    // Validasi input
    if (!username || !password) {
      res.status(400).json({ error: 'Username dan password harus diisi' });
      return;
    }

    // Cari user
    const [users] = await pool.execute(
      'SELECT * FROM user WHERE username = ?',
      [username]
    );

    if (!Array.isArray(users) || users.length === 0) {
      res.status(401).json({ error: 'Username atau password salah' });
      return;
    }

    const user = users[0] as {
      id: number;
      username: string;
      password: string;
      email: string;
      nama_lengkap: string;
      role: string;
    };

    // Verifikasi password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(401).json({ error: 'Username atau password salah' });
      return;
    }

    // Generate token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username,
        email: user.email,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        nama_lengkap: user.nama_lengkap,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Gagal login' });
  }
});

// Get user profile
app.get('/api/auth/profile', verifyToken, async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'User tidak terautentikasi' });
    return;
  }

  try {
    const [users] = await pool.execute<mysql.RowDataPacket[]>(
      'SELECT id, username, email, nama_lengkap, role FROM user WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      res.status(404).json({ error: 'User tidak ditemukan' });
      return;
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Gagal mengambil profil user' });
  }
});

// Get all symptoms (gejala)
app.get('/api/symptoms', async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.execute<mysql.RowDataPacket[]>('SELECT * FROM gejala ORDER BY CAST(SUBSTRING(id, 2) AS UNSIGNED) ASC');
    const symptoms = rows.map((row) => ({
      id: row.id,
      name: row.nama_gejala,
      description: row.deskripsi,
      created_at: row.tanggal_dibuat,
      updated_at: row.tanggal_diperbarui
    }));
    res.json(symptoms);
  } catch (error) {
    console.error('Error fetching symptoms:', error);
    res.status(500).json({ error: 'Failed to fetch symptoms' });
  }
});

// Get all damages (kerusakan)
app.get('/api/damages', async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.execute<mysql.RowDataPacket[]>('SELECT * FROM kerusakan ORDER BY id');
    const damages = rows.map((row) => ({
      id: row.id,
      name: row.nama_kerusakan,
      solution: row.solusi,
      created_at: row.tanggal_dibuat,
      updated_at: row.tanggal_diperbarui
    }));
    res.json(damages);
  } catch (error) {
    console.error('Error fetching damages:', error);
    res.status(500).json({ error: 'Failed to fetch damages' });
  }
});

// Get diagnosis rules (aturan_diagnosa)
app.get('/api/diagnosis-rules', async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.execute<mysql.RowDataPacket[]>(`
      SELECT ad.*, g.nama_gejala as symptom_name, k.nama_kerusakan as damage_name 
      FROM aturan_diagnosa ad
      JOIN gejala g ON ad.id_gejala = g.id
      JOIN kerusakan k ON ad.id_kerusakan = k.id
      ORDER BY ad.id_gejala, ad.id_kerusakan
    `);
    const rules = rows.map((row) => ({
      id: row.id,
      symptom_id: row.id_gejala,
      damage_id: row.id_kerusakan,
      probability: row.probabilitas,
      symptom_name: row.symptom_name,
      damage_name: row.damage_name,
      created_at: row.tanggal_dibuat,
      updated_at: row.tanggal_diperbarui
    }));
    res.json(rules);
  } catch (error) {
    console.error('Error fetching diagnosis rules:', error);
    res.status(500).json({ error: 'Failed to fetch diagnosis rules' });
  }
});

// Perform diagnosis
app.post('/api/diagnose', async (req, res) => {
  try {
    const { symptoms: selectedSymptoms } = req.body;

    if (!selectedSymptoms || selectedSymptoms.length === 0) {
      return res.status(400).json({ error: 'No symptoms selected' });
    }

    // Get all damages
    const [damages] = await pool.execute('SELECT * FROM kerusakan');
    // Get all rules for selected symptoms
    const symptomsPlaceholder = selectedSymptoms.map(() => '?').join(',');
    const [rules] = await pool.execute(`
      SELECT ad.*, k.nama_kerusakan as damage_name, k.solusi as solution
      FROM aturan_diagnosa ad
      JOIN kerusakan k ON ad.id_kerusakan = k.id
      WHERE ad.id_gejala IN (${symptomsPlaceholder})
    `, selectedSymptoms);

    // Map rules to 0/1 only
    const ruleMap = {};
    rules.forEach(rule => {
      if (!ruleMap[rule.id_kerusakan]) ruleMap[rule.id_kerusakan] = {};
      ruleMap[rule.id_kerusakan][rule.id_gejala] = rule.probabilitas >= 1 ? 1 : 0;
    });

    const priorProbability = 1 / damages.length;
    const results = [];

    damages.forEach(damage => {
      let likelihood = priorProbability;
      selectedSymptoms.forEach(symptomId => {
        const prob = ruleMap[damage.id] && ruleMap[damage.id][symptomId] ? 1 : 0;
        likelihood *= prob;
      });
      results.push({
        code: damage.id,
        name: damage.nama_kerusakan,
        solution: damage.solusi,
        likelihood: likelihood
      });
    });

    // Calculate posterior probabilities
    const totalEvidence = results.reduce((sum, result) => sum + result.likelihood, 0);
    const finalResults = results.map(result => ({
      ...result,
      posterior: totalEvidence > 0 ? result.likelihood / totalEvidence : 0,
      percentage: totalEvidence > 0 ? (result.likelihood / totalEvidence) * 100 : 0
    })).sort((a, b) => b.percentage - a.percentage);

    // Save diagnosis history (riwayat_diagnosa)
    try {
      await pool.execute(`
        INSERT INTO riwayat_diagnosa (gejala, hasil, info_pengguna) 
        VALUES (?, ?, ?)
      `, [
        JSON.stringify(selectedSymptoms),
        JSON.stringify(finalResults),
        JSON.stringify({ timestamp: new Date().toISOString() })
      ]);
    } catch (historyError) {
      console.error('Error saving diagnosis history:', historyError);
    }

    res.json({
      results: finalResults,
      calculation: {
        selectedSymptoms,
        priorProbability,
        totalEvidence
      }
    });
  } catch (error) {
    console.error('Error performing diagnosis:', error);
    res.status(500).json({ error: 'Failed to perform diagnosis' });
  }
});

// Get diagnosis history
app.get('/api/history', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as { id: number; username: string; email: string; role: string } | undefined;

    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    let query = `
      SELECT rd.*, u.username, u.email, u.nama_lengkap
      FROM riwayat_diagnosa rd
      JOIN user u ON rd.id_user = u.id
    `;

    // If user is not admin, only show their own history
    if (user.role !== 'admin') {
      query += ' WHERE rd.id_user = ?';
    }

    query += ' ORDER BY rd.tanggal_diagnosa DESC';

    const [rows] = await pool.execute<mysql.RowDataPacket[]>(
      query,
      user.role !== 'admin' ? [user.id] : []
    );

    const history = rows.map((row) => ({
      id: row.id,
      user: {
        id: row.id_user,
        username: row.username,
        email: row.email,
        full_name: row.nama_lengkap
      },
      results: JSON.parse(row.hasil_diagnosa),
      created_at: row.tanggal_diagnosa
    }));

    res.json(history);
  } catch (error) {
    console.error('Error fetching diagnosis history:', error);
    res.status(500).json({ error: 'Failed to fetch diagnosis history' });
  }
});

// Delete diagnosis report
app.delete('/api/history/:id', verifyToken, async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'User tidak terautentikasi' });
    return;
  }

  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const { id } = req.params;

    // Cek apakah user memiliki akses untuk menghapus laporan
    const [reports] = await pool.execute<mysql.RowDataPacket[]>(
      'SELECT id_user FROM riwayat_diagnosa WHERE id = ?',
      [id]
    );

    if (reports.length === 0) {
      res.status(404).json({ error: 'Laporan tidak ditemukan' });
      return;
    }

    // Hanya admin atau pemilik laporan yang bisa menghapus
    if (userRole !== 'admin' && reports[0].id_user !== userId) {
      res.status(403).json({ error: 'Tidak memiliki akses untuk menghapus laporan ini' });
      return;
    }

    await pool.execute('DELETE FROM riwayat_diagnosa WHERE id = ?', [id]);
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

// Delete multiple diagnosis reports
app.post('/api/history/bulk-delete', verifyToken, async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'User tidak terautentikasi' });
    return;
  }

  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const { ids } = req.body as { ids: number[] };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: 'No report IDs provided' });
      return;
    }

    // Jika bukan admin, verifikasi bahwa semua laporan milik user tersebut
    if (userRole !== 'admin') {
      const [reports] = await pool.execute<mysql.RowDataPacket[]>(
        'SELECT id FROM riwayat_diagnosa WHERE id IN (?) AND id_user = ?',
        [ids, userId]
      );

      if (reports.length !== ids.length) {
        res.status(403).json({ error: 'Tidak memiliki akses untuk menghapus beberapa laporan' });
        return;
      }
    }
    
    const placeholders = ids.map(() => '?').join(',');
    await pool.execute(`DELETE FROM riwayat_diagnosa WHERE id IN (${placeholders})`, ids);
    res.json({ message: 'Reports deleted successfully' });
  } catch (error) {
    console.error('Error deleting reports:', error);
    res.status(500).json({ error: 'Failed to delete reports' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;