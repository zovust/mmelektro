import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  RefreshCw,
  Settings,
  LogOut,
  Fan,
  Clock,
  CheckCircle,
  XCircle,
  Printer,
  UserX,
  AlertTriangleIcon
} from 'lucide-react';

interface DiagnosisResult {
  code: string;
  name: string;
  solution: string;
  likelihood: number;
  posterior: number;
  percentage: number;
}

interface UserInfo {
  name?: string;
  email?: string;
  timestamp?: string;
}

interface DiagnosisReport {
  id: number;
  symptoms: string[];
  results: DiagnosisResult[];
  diagnosis_date: string;
  user_info: UserInfo;
  notes?: string;
}

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('all');
  const [selectedReports, setSelectedReports] = useState<number[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<number | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [reports, setReports] = useState<DiagnosisReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch reports from API
  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        setReports([]);
        setLoading(false);
        return;
      }
      const data = await response.json();
      setReports(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      setReports([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Statistik dashboard
  const stats = {
    totalReports: Array.isArray(reports) ? reports.length : 0,
    avgConfidence: Array.isArray(reports) && reports.length > 0
      ? reports.reduce((sum, r) => sum + (r.results[0]?.percentage || 0), 0) / reports.length
      : 0
  };

  // Data untuk chart kerusakan
  const damageStats: Record<string, number> = Array.isArray(reports)
    ? reports.reduce((acc, report) => {
        const topResult = report.results[0];
        if (topResult) {
          acc[topResult.name] = (acc[topResult.name] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>)
    : {};

  // Filter reports
  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      (report.user_info?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.user_info?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.id.toString().includes(searchTerm);
    
    const matchesDate = filterDate === 'all' || (() => {
      const reportDate = new Date(report.diagnosis_date);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      switch(filterDate) {
        case 'today':
          return reportDate.toDateString() === today.toDateString();
        case 'yesterday':
          return reportDate.toDateString() === yesterday.toDateString();
        case 'week':
          return reportDate >= weekAgo;
        default:
          return true;
      }
    })();
    
    return matchesSearch && matchesDate;
  });

  const handleDeleteReport = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/history/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok || response.status === 404) {
        setShowDeleteModal(false);
        setActiveTab('reports');
        setSuccessMessage('Laporan berhasil dihapus');
        fetchReports();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        alert('Gagal menghapus laporan');
      }
    } catch (error) {
      alert('Gagal menghapus laporan');
    }
  };

  const bulkDeleteReports = async () => {
    if (selectedReports.length === 0) {
      alert('Pilih laporan yang ingin dihapus terlebih dahulu!');
      return;
    }
    try {
      await fetch('http://localhost:3001/api/history/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: selectedReports })
      });
      setReports(reports.filter(r => !selectedReports.includes(r.id)));
      setSelectedReports([]);
      setShowBulkDeleteModal(false);
    } catch (error) {
      console.error('Error deleting reports:', error);
      alert('Failed to delete reports');
    }
  };

  const printReport = (report: DiagnosisReport | null = null) => {
    const printContent = report ? generateSingleReportHTML(report) : generateAllReportsHTML();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const generateSingleReportHTML = (report: DiagnosisReport) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Diagnosa #${report.id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .section { margin: 15px 0; }
          .label { font-weight: bold; color: #666; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>LAPORAN DIAGNOSA KIPAS ANGIN</h1>
          <h3>Sistem Expert - Metode Naive Bayes</h3>
        </div>
        <div class="content">
          <div class="section">
            <h3>INFORMASI PELANGGAN</h3>
            <div class="section">
              <span class="label">Nama Pelanggan:</span> ${report.user_info?.name || 'Anonim'}
            </div>
            <div class="section">
              <span class="label">Email:</span> ${report.user_info?.email || '-'}
            </div>
            <div class="section">
              <span class="label">Tanggal & Waktu:</span> ${new Date(report.diagnosis_date).toLocaleDateString('id-ID')} ${new Date(report.diagnosis_date).toLocaleTimeString('id-ID')}
            </div>
          </div>
          <div class="section">
            <h3>GEJALA YANG DIPILIH</h3>
            ${report.symptoms.map(s => `
              <div class="section">
                <span class="label">Gejala:</span> ${s}
              </div>
            `).join('')}
          </div>
          <div class="section">
            <h3>HASIL DIAGNOSA</h3>
            <div class="section">
              <span class="label">Jenis Kerusakan:</span> ${report.results[0]?.name}
            </div>
            <div class="section">
              <span class="label">Tingkat Keyakinan:</span> ${report.results[0]?.percentage.toFixed(1)}%
            </div>
            <div class="section">
              <span class="label">Solusi:</span> ${report.results[0]?.solution}
            </div>
          </div>
        </div>
        <div class="footer">
          <p>Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
          <p>Sistem Diagnosa Kipas Angin - Admin Dashboard</p>
        </div>
      </body>
      </html>
    `;
  };

  const generateAllReportsHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Semua Diagnosa</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; }
          .stats { display: flex; justify-content: space-around; margin: 20px 0; }
          .stat-item { text-align: center; padding: 10px; background: #f5f5f5; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>LAPORAN SEMUA DIAGNOSA KIPAS ANGIN</h1>
          <h3>Sistem Expert - Metode Naive Bayes</h3>
        </div>
        <div class="stats">
          <div class="stat-item">
            <strong>Total Laporan</strong><br>
            ${stats.totalReports}
          </div>
          <div class="stat-item">
            <strong>Rata-rata Akurasi</strong><br>
            ${stats.avgConfidence.toFixed(1)}%
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Pelanggan</th>
              <th>Email</th>
              <th>Tanggal</th>
              <th>Diagnosa</th>
              <th>Akurasi</th>
            </tr>
          </thead>
          <tbody>
            ${filteredReports.map(report => `
              <tr>
                <td>${report.id}</td>
                <td>${report.user_info?.name || 'Anonim'}</td>
                <td>${report.user_info?.email || '-'}</td>
                <td>${new Date(report.diagnosis_date).toLocaleDateString('id-ID')}</td>
                <td>${report.results[0]?.name}</td>
                <td>${report.results[0]?.percentage.toFixed(1)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          <p>Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
          <p>Total ${filteredReports.length} laporan ditampilkan</p>
          <p>Sistem Diagnosa Kipas Angin - Admin Dashboard</p>
        </div>
      </body>
      </html>
    `;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Fan className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">Sistem Diagnosa Kipas Angin</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={fetchReports}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Settings className="w-5 h-5" />
              </button>
              <button className="flex items-center gap-2 text-gray-700 hover:text-gray-900" onClick={handleLogout}>
                <LogOut className="w-5 h-5" />
                <span className="text-sm">Keluar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'dashboard'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reports'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Laporan Diagnosa
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'analytics'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Analitik
              </button>
            </nav>
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BarChart3 className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Laporan</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalReports}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Rata-rata Akurasi</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.avgConfidence.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Reports */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Laporan Terbaru</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pelanggan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Diagnosa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Akurasi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tanggal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reports.slice(0, 5).map((report) => (
                      <tr key={report.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{report.user_info?.name || 'Anonim'}</div>
                            <div className="text-sm text-gray-500">{report.user_info?.email || '-'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{report.results[0]?.name}</div>
                          <div className="text-sm text-gray-500">{report.results[0]?.solution}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">
                            {report.results && Array.isArray(report.results) && report.results[0] &&
                              (typeof report.results[0].percentage === 'number'
                                ? report.results[0].percentage.toFixed(1) + '%'
                                : (typeof (report.results[0] as any).probability === 'number'
                                  ? (report.results[0] as any).probability.toFixed(1) + '%'
                                  : '-'))}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(report.diagnosis_date).toLocaleDateString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Cari berdasarkan nama, email, atau ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <select
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Semua Tanggal</option>
                    <option value="today">Hari Ini</option>
                    <option value="yesterday">Kemarin</option>
                    <option value="week">7 Hari Terakhir</option>
                  </select>
                  <button
                    onClick={() => printReport(null)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                  {selectedReports.length > 0 && (
                    <button
                      onClick={() => setShowBulkDeleteModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <UserX className="w-4 h-4" />
                      Hapus ({selectedReports.length})
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Reports Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Laporan Diagnosa ({filteredReports.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                {successMessage && (
                  <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg text-sm">
                    {successMessage}
                  </div>
                )}
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedReports.length === filteredReports.length && filteredReports.length > 0}
                          onChange={() => {
                            if (selectedReports.length === filteredReports.length) {
                              setSelectedReports([]);
                            } else {
                              setSelectedReports(filteredReports.map(r => r.id));
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID & Pelanggan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gejala
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Diagnosa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tanggal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredReports.map((report) => (
                      <tr key={report.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedReports.includes(report.id)}
                            onChange={() => {
                              setSelectedReports(prev => 
                                prev.includes(report.id)
                                  ? prev.filter(id => id !== report.id)
                                  : [...prev, report.id]
                              );
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-blue-600">#{report.id}</div>
                            <div className="text-sm font-medium text-gray-900">{report.user_info?.name || report.user?.username || '-'}</div>
                            <div className="text-sm text-gray-500">{report.user_info?.email || report.user?.email || '-'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {Array.isArray(report.symptoms) && report.symptoms.length > 0
                              ? report.symptoms.map(s => (
                                  <div key={s} className="mb-1">
                                    <span className="font-medium text-blue-600">{s}</span>
                                  </div>
                                ))
                              : <span>-</span>
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{report.results[0]?.name}</div>
                            <div className="text-sm text-gray-500">{report.results[0]?.solution}</div>
                            <div className="text-sm font-medium text-green-600">
                              <span className="text-sm font-medium text-gray-900">
                                {report.results && Array.isArray(report.results) && report.results[0] &&
                                  (typeof report.results[0].percentage === 'number'
                                    ? report.results[0].percentage.toFixed(1) + '%'
                                    : (typeof (report.results[0] as any).probability === 'number'
                                      ? (report.results[0] as any).probability.toFixed(1) + '%'
                                      : '-'))}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>{report.diagnosis_date ? new Date(report.diagnosis_date).toLocaleDateString('id-ID') : (report.created_at ? new Date(report.created_at).toLocaleDateString('id-ID') : '-')}</div>
                          <div>{report.diagnosis_date ? new Date(report.diagnosis_date).toLocaleTimeString('id-ID') : (report.created_at ? new Date(report.created_at).toLocaleTimeString('id-ID') : '-')}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setReportToDelete(report.id);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-800 ml-2"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Damage Distribution */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Distribusi Jenis Kerusakan</h3>
              <div className="space-y-4">
                {Object.entries(damageStats).map(([damage, count]) => {
                  const percentage = (count / reports.length * 100).toFixed(1);
                  return (
                    <div key={damage} className="flex items-center">
                      <div className="w-32 text-sm font-medium text-gray-700">{damage}</div>
                      <div className="flex-1 mx-4">
                        <div className="w-full bg-gray-200 rounded-full h-4">
                          <div 
                            className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="w-16 text-sm text-gray-600 text-right">
                        {count} ({percentage}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Akurasi Tertinggi</h4>
                <p className="text-2xl font-semibold text-green-600">
                  {Math.max(...reports.map(r => r.results[0]?.percentage || 0)).toFixed(1)}%
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Akurasi Terendah</h4>
                <p className="text-2xl font-semibold text-red-600">
                  {Math.min(...reports.map(r => r.results[0]?.percentage || 0)).toFixed(1)}%
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Rata-rata Akurasi</h4>
                <p className="text-2xl font-semibold text-blue-600">
                  {stats.avgConfidence.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && reportToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <AlertTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Konfirmasi Hapus</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Apakah Anda yakin ingin menghapus laporan ini? 
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleDeleteReport(reportToDelete)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <UserX className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Konfirmasi Hapus Massal</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Apakah Anda yakin ingin menghapus {selectedReports.length} laporan yang dipilih? 
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                <button
                  onClick={() => setShowBulkDeleteModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                >
                  Batal
                </button>
                <button
                  onClick={bulkDeleteReports}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Hapus {selectedReports.length} Laporan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;