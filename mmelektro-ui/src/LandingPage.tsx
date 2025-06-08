import { ArrowRightCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import unpamLogo from './assets/unpam.png';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-10 flex flex-col items-center">
        <div className="flex flex-col items-center gap-2 mb-6">
          <img src={unpamLogo} alt="Logo UNPAM" className="w-20 h-20 rounded-full shadow-lg border-4 border-yellow-400 bg-white" />
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Sistem Diagnosa Kipas Angin</h1>
              <p className="text-blue-600 text-center font-medium">Metode Naive Bayes Classifier</p>
            </div>
          </div>
        </div>
        <p className="text-gray-700 text-lg text-center mb-8">
          Temukan solusi kerusakan kipas angin Anda secara cepat dan akurat dengan sistem pakar berbasis web. Dapatkan diagnosa dan rekomendasi perbaikan hanya dengan beberapa klik.
        </p>
        <div className="flex gap-4 mb-8">
          <Link to="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow transition-all">
            <ArrowRightCircle className="w-5 h-5" />
            Masuk
          </Link>
          <Link to="/register" className="bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow transition-all">
            Daftar
          </Link>
        </div>
        <div className="text-gray-400 text-sm mt-4 text-center">
          &copy; {new Date().getFullYear()} MMElektro. All rights reserved.<br />
          <span className="font-semibold text-gray-500">by NIBROS ABROR</span>
        </div>
      </div>
    </div>
  );
};

export default LandingPage; 