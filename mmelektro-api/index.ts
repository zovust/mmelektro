import express from "express";
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabase } from './supabase';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Konfigurasi CORS dinamis dari environment variable
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
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
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('*')
      .or(`username.eq.${username},email.eq.${email}`);

    if (checkError) throw checkError;

    if (existingUsers && existingUsers.length > 0) {
      res.status(400).json({ error: 'Username atau email sudah terdaftar' });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user baru
    const { error: insertError } = await supabase
      .from('users')
      .insert([{
        username,
        password: hashedPassword,
        email,
        nama_lengkap,
        role: 'user'
      }]);

    if (insertError) throw insertError;

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
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (fetchError) throw fetchError;

    if (!users) {
      res.status(401).json({ error: 'Username atau password salah' });
      return;
    }

    // Verifikasi password
    const validPassword = await bcrypt.compare(password, users.password);
    if (!validPassword) {
      res.status(401).json({ error: 'Username atau password salah' });
      return;
    }

    // Generate token
    const token = jwt.sign(
      { 
        id: users.id, 
        username: users.username,
        email: users.email,
        role: users.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: users.id,
        username: users.username,
        email: users.email,
        nama_lengkap: users.nama_lengkap,
        role: users.role
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
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, nama_lengkap, role')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;

    if (!user) {
      res.status(404).json({ error: 'User tidak ditemukan' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Gagal mengambil profil user' });
  }
});

// Get all symptoms (gejala)
app.get('/api/symptoms', async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: symptoms, error } = await supabase
      .from('gejala')
      .select('*')
      .order('id');

    if (error) throw error;

    const formattedSymptoms = symptoms.map((symptom) => ({
      id: symptom.id,
      name: symptom.nama_gejala,
      description: symptom.deskripsi,
      created_at: symptom.created_at,
      updated_at: symptom.updated_at
    }));

    res.json(formattedSymptoms);
  } catch (error) {
    console.error('Error fetching symptoms:', error);
    res.status(500).json({ error: 'Failed to fetch symptoms' });
  }
});

// Get all damages (kerusakan)
app.get('/api/damages', async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: damages, error } = await supabase
      .from('kerusakan')
      .select('*')
      .order('id');

    if (error) throw error;

    const formattedDamages = damages.map((damage) => ({
      id: damage.id,
      name: damage.nama_kerusakan,
      solution: damage.solusi,
      created_at: damage.created_at,
      updated_at: damage.updated_at
    }));

    res.json(formattedDamages);
  } catch (error) {
    console.error('Error fetching damages:', error);
    res.status(500).json({ error: 'Failed to fetch damages' });
  }
});

// Get diagnosis rules (aturan_diagnosa)
app.get('/api/diagnosis-rules', async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: rules, error } = await supabase
      .from('aturan_diagnosa')
      .select('*, gejala(id, nama_gejala), kerusakan(id, nama_kerusakan)')
      .order('id_gejala');

    if (error) throw error;

    const formattedRules = (rules || []).map((rule: any) => ({
      id: rule.id,
      symptom_id: rule.id_gejala,
      damage_id: rule.id_kerusakan,
      probability: rule.probabilitas,
      symptom_name: rule.gejala?.nama_gejala,
      damage_name: rule.kerusakan?.nama_kerusakan,
      created_at: rule.created_at,
      updated_at: rule.updated_at
    }));

    res.json(formattedRules);
  } catch (error) {
    console.error('Error fetching diagnosis rules:', error);
    res.status(500).json({ error: 'Failed to fetch diagnosis rules' });
  }
});

// Perform diagnosis
app.post('/api/diagnose', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { symptoms: selectedSymptoms } = req.body;

    if (!selectedSymptoms || selectedSymptoms.length === 0) {
      res.status(400).json({ error: 'No symptoms selected' });
      return;
    }

    // Get all damages
    const { data: damages, error: damagesError } = await supabase
      .from('kerusakan')
      .select('*');

    if (damagesError) throw damagesError;

    // Get all rules for selected symptoms
    const { data: rules, error: rulesError } = await supabase
      .from('aturan_diagnosa')
      .select('*, kerusakan(id, nama_kerusakan, solusi)')
      .in('id_gejala', selectedSymptoms);

    if (rulesError) throw rulesError;

    // Map rules to 0/1 only
    const ruleMap: Record<string, Record<string, number>> = {};
    (rules || []).forEach((rule: any) => {
      if (!ruleMap[rule.id_kerusakan]) ruleMap[rule.id_kerusakan] = {};
      ruleMap[rule.id_kerusakan][rule.id_gejala] = rule.probabilitas >= 1 ? 1 : 0;
    });

    const priorProbability = 1 / (damages?.length || 1);
    const results: any[] = [];

    (damages || []).forEach((damage: any) => {
      let likelihood = priorProbability;
      (selectedSymptoms as string[]).forEach((symptomId: string) => {
        const prob = ruleMap[damage.id]?.[symptomId] ? 1 : 0;
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

    // Save diagnosis history
    if (req.user) {
      const { error: historyError } = await supabase
        .from('riwayat_diagnosa')
        .insert([{
          id_user: req.user.id,
          gejala: JSON.stringify(selectedSymptoms),
          hasil: finalResults
        }]);
      if (historyError) {
        console.error('Error saving diagnosis history:', historyError);
      }
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
    const user = req.user;

    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    let query = supabase
      .from('riwayat_diagnosa')
      .select('*, users(id, username, email, nama_lengkap)')
      .order('created_at', { ascending: false });

    // If user is not admin, only show their own history
    if (user.role !== 'admin') {
      query = query.eq('id_user', user.id);
    }

    const { data: history, error } = await query;

    if (error) throw error;

    const formattedHistory = (history || []).map((record: any) => ({
      id: record.id,
      user: {
        id: record.users?.id,
        username: record.users?.username,
        email: record.users?.email,
        full_name: record.users?.nama_lengkap
      },
      symptoms: record.gejala ? JSON.parse(record.gejala) : [],
      results: record.hasil,
      created_at: record.created_at,
      notes: record.catatan
    }));

    res.json(formattedHistory);
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
    const { data: report, error: checkError } = await supabase
      .from('riwayat_diagnosa')
      .select('id_user')
      .eq('id', id)
      .single();

    if (checkError) throw checkError;

    if (!report) {
      res.status(404).json({ error: 'Laporan tidak ditemukan' });
      return;
    }

    // Hanya admin atau pemilik laporan yang bisa menghapus
    if (userRole !== 'admin' && report.id_user !== userId) {
      res.status(403).json({ error: 'Tidak memiliki akses untuk menghapus laporan ini' });
      return;
    }

    const { error: deleteError } = await supabase
      .from('riwayat_diagnosa')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

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
      const { data: reports, error: checkError } = await supabase
        .from('riwayat_diagnosa')
        .select('id')
        .in('id', ids)
        .eq('id_user', userId);

      if (checkError) throw checkError;

      if (reports.length !== ids.length) {
        res.status(403).json({ error: 'Tidak memiliki akses untuk menghapus beberapa laporan' });
        return;
      }
    }

    const { error: deleteError } = await supabase
      .from('riwayat_diagnosa')
      .delete()
      .in('id', ids);

    if (deleteError) throw deleteError;

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