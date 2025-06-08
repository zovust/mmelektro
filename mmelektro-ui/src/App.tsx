import React, { useState, useEffect } from 'react';
import { Calculator, Fan, AlertTriangle, CheckCircle, Database, History, Settings, LogOut } from 'lucide-react';
import unpamLogo from './assets/unpam.png';

// Tambahkan tipe data
interface Symptom {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

interface Damage {
  id: number;
  name: string;
  solution: string;
  created_at?: string;
  updated_at?: string;
}

// New result type for diagnosis display
interface DiagnosisDisplayResult {
  code: string;
  name: string;
  solution: string;
  likelihood: number;
  posterior: number;
  percentage: number;
}

interface DiagnosisCalculation {
  selectedSymptoms: number[];
  priorProbability: number;
  totalEvidence: number;
  // Add other fields as needed
}

interface DiagnosisDisplay {
  results: DiagnosisDisplayResult[];
  calculation: DiagnosisCalculation;
}

interface HistoryItem {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
    full_name: string;
  };
  results: DiagnosisDisplayResult[];
  created_at: string;
}

const App = () => {
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [damages, setDamages] = useState<Damage[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<number[]>([]);
  const [results, setResults] = useState<DiagnosisDisplay | null>(null);
  const [showCalculation, setShowCalculation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState('');

  const API_BASE_URL = 'http://localhost:3001/api';

  // Load initial data
  useEffect(() => {
    loadSymptoms();
    loadDamages();
    loadHistory();
  }, []);

  const loadSymptoms = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/symptoms`);
      if (response.ok) {
        const data = await response.json();
        setSymptoms(data);
      } else {
        setError('Gagal memuat data gejala');
      }
    } catch (err) {
      setError('Koneksi ke server gagal');
      console.error('Error loading symptoms:', err);
    }
  };

  const loadDamages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/damages`);
      if (response.ok) {
        const data = await response.json();
        setDamages(data);
      } else {
        setError('Gagal memuat data kerusakan');
      }
    } catch (err) {
      setError('Koneksi ke server gagal');
      console.error('Error loading damages:', err);
    }
  };

  const loadHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setHistory(Array.isArray(data) ? data : []);
      } else {
        setHistory([]);
        if (response.status === 401) setError('Sesi login Anda telah habis. Silakan login ulang.');
      }
    } catch (err) {
      setHistory([]);
      setError('Koneksi ke server gagal');
      console.error('Error loading history:', err);
    }
  };

  const handleSymptomToggle = (symptomId: number) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptomId) 
        ? prev.filter(s => s !== symptomId)
        : [...prev, symptomId]
    );
    setResults(null);
    setShowCalculation(false);
    setError('');
  };

  const performDiagnosis = async () => {
    if (selectedSymptoms.length === 0) {
      setError('Pilih minimal satu gejala terlebih dahulu!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/diagnose`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          symptoms: selectedSymptoms
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Expecting data to have { results: [], calculation: {} }
        setResults(data && data.results && data.calculation ? data : null);
        setShowCalculation(true);
        loadHistory(); // Refresh history
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Gagal melakukan diagnosa');
      }
    } catch (err) {
      setError('Koneksi ke server gagal');
      console.error('Error performing diagnosis:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetDiagnosis = () => {
    setSelectedSymptoms([]);
    setResults(null);
    setShowCalculation(false);
    setError('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID');
  };

  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar?')) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={unpamLogo} alt="Logo UNPAM" className="w-10 h-10 rounded-full shadow-lg border-4 border-yellow-400 bg-white" />
              <div>
                <h1 className="text-2xl font-bold">Sistem Diagnosa Kipas Angin</h1>
                <p className="text-blue-100 flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Metode Naive Bayes Classifier - Database MySQL
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 px-4 py-2 rounded-lg transition-colors"
              >
                <History className="w-4 h-4" />
                Riwayat
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-lg shadow hover:from-red-600 hover:to-pink-600 transition-all duration-200"
                title="Keluar"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Keluar</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Connection Status */}
          <div className="mb-6 p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Database Status: Terhubung ({symptoms.length} gejala, {damages.length} kerusakan dimuat)
            </div>
          </div>

          {/* History Panel */}
          {showHistory && (
            <div className="mb-8 bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <History className="w-5 h-5" />
                Riwayat Diagnosa
              </h3>
              <div className="max-h-64 overflow-y-auto space-y-3">
                {history.length > 0 ? (
                  history.map((item, index) => (
                    <div key={item.id} className="bg-white p-4 rounded border">
                      <div className="text-sm text-gray-600 mb-2">
                        {formatDate(item.created_at)}
                      </div>
                      <div className="text-sm">
                        <strong>Gejala:</strong> {item.results.map(r => r.name).join(', ')}
                      </div>
                      <div className="text-sm mt-1">
                        <strong>Hasil:</strong> {item.results[0]?.name} ({item.results[0]?.percentage.toFixed(1)}%)
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">Belum ada riwayat diagnosa</p>
                )}
              </div>
            </div>
          )}

          {/* Pilihan Gejala */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Pilih Gejala yang Dialami
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {symptoms
                .slice()
                .sort((a, b) => a.id - b.id)
                .map((symptom) => (
                  <label key={symptom.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedSymptoms.includes(symptom.id)}
                      onChange={() => handleSymptomToggle(symptom.id)}
                      className="mr-3 w-4 h-4 text-blue-600"
                      disabled={
                        !selectedSymptoms.includes(symptom.id) && selectedSymptoms.length >= 2
                      }
                    />
                    <div>
                      <span className="font-medium text-blue-600">G{symptom.id}:</span>
                      <span className="ml-2">{symptom.name}</span>
                      {symptom.description && (
                        <div className="text-sm text-gray-500 mt-1">{symptom.description}</div>
                      )}
                    </div>
                  </label>
                ))}
            </div>
          </div>

          {/* Tombol Aksi */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={performDiagnosis}
              disabled={selectedSymptoms.length === 0 || loading}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Calculator className="w-5 h-5" />
              {loading ? 'Memproses...' : 'Diagnosa Kerusakan'}
            </button>
            <button
              onClick={resetDiagnosis}
              disabled={loading}
              className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors disabled:bg-gray-400"
            >
              Reset
            </button>
          </div>

          {/* Hasil Diagnosa */}
          {results && (
            <div className="space-y-6">
              {/* Hasil Utama */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  Hasil Diagnosa
                </h3>
                <div className="space-y-3">
                  {results.results.map((result, index) => (
                    <div key={result.code} className={`p-4 rounded-lg border mb-2 ${result.percentage > 0 ? 'bg-white border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-bold text-blue-600">{result.code}</span>
                          <span className="mx-2">-</span>
                          <span className="font-medium">{result.name}</span>
                          {result.percentage > 0 && (
                            <div className="text-sm text-gray-600 mt-1">
                              Solusi: {result.solution}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${result.percentage > 0 ? 'text-green-600' : 'text-gray-400'}`}>{result.percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                      {result.percentage > 0 && (
                        <div className="mt-2 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full transition-all duration-500" style={{ width: `${result.percentage}%` }}></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Detail Perhitungan */}
              {results.calculation && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 text-blue-800">Detail Perhitungan Naive Bayes</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-700">Gejala yang Dipilih:</h4>
                      <p className="text-gray-600">
                        {results.calculation.selectedSymptoms.map(s => {
                          const symptom = symptoms.find(sym => sym.id === s);
                          return `${s} (${symptom?.name || 'Unknown'})`;
                        }).join(', ')}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700">Langkah 1: Prior Probability</h4>
                      <p className="text-gray-600">P(Kerusakan) = {results.calculation.priorProbability.toFixed(3)} untuk setiap kerusakan</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700">Langkah 2: Likelihood Calculation</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                        {results.results.map(result => (
                          <div key={result.code} className="bg-white p-3 rounded border">
                            <div className="font-medium">{result.code}: {result.likelihood ? result.likelihood.toFixed(6) : '-'}</div>
                            <div className="text-xs text-gray-500">Prior × Probabilitas gejala</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700">Langkah 3: Total Evidence</h4>
                      <p className="text-gray-600">Total = {results.calculation.totalEvidence.toFixed(6)}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700">Langkah 4: Posterior Probability</h4>
                      <p className="text-gray-600 text-sm">Setiap likelihood dibagi dengan total evidence, kemudian dikalikan 100% untuk mendapatkan persentase.</p>
                    </div>
                    <div className="bg-white p-4 rounded border">
                      <h4 className="font-semibold text-gray-700 mb-2">Kesimpulan:</h4>
                      <p className="text-gray-600">
                        Berdasarkan gejala yang dipilih, kemungkinan terbesar kerusakan adalah{' '}
                        <span className="font-bold text-green-600">{results.results[0].name} ({results.results[0].percentage.toFixed(1)}%)</span>
                        {results.results[0].percentage > 0 && (
                          <>
                            {' '}dengan solusi: <span className="font-medium">{results.results[0].solution}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-500 text-center">
              <p>Sistem Diagnosa Kipas Angin menggunakan algoritma Naive Bayes Classifier</p>
              <p className="mt-1">Data disimpan dalam database MySQL untuk analisis dan pembelajaran</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;