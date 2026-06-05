import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import YouriMascot from '../components/YouriMascot';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); 
  const [formData, setFormData] = useState({ email: '', otp: '', new_password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Langkah 1: Kirim Email Pertama Kali
  const handleRequestOTP = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/user/request-password-reset', { email: formData.email });
      toast.success("Kode OTP sudah meluncur ke email kamu!");
      setStep(2); 
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal mengirim OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  // 🌸 TAMBAHAN YUKI: Fungsi untuk Kirim Ulang OTP
  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      await api.post('/user/request-password-reset', { email: formData.email });
      toast.success("Kode OTP baru sudah dikirim ulang! Cek email ya.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal mengirim ulang OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  // Langkah 2: Cek keaslian OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/user/verify-otp', { email: formData.email, otp: formData.otp });
      toast.success("OTP Cocok! Silakan buat sandi baru.");
      setStep(3); 
    } catch (err) {
      toast.error(err.response?.data?.message || "Kode OTP salah atau kedaluwarsa.");
    } finally {
      setIsLoading(false);
    }
  };

  // Langkah 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/user/reset-password', formData);
      toast.success("Sandi berhasil diperbarui! Silakan login.");
      navigate('/login'); 
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal mengganti sandi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
        <div className="flex flex-col items-center mb-6">
          <YouriMascot isXD={false} className="w-16 h-16 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 text-center">
            {step === 1 && "Lupa Sandi?"}
            {step === 2 && "Verifikasi OTP"}
            {step === 3 && "Buat Sandi Baru"}
          </h2>

          <div className="w-full flex justify-center mb-4">
            <button 
              onClick={() => navigate('/login')} 
              className="text-xs text-gray-400 hover:text-[#C18A5E] underline transition-colors mt-2"
            >
              &larr; Batal & Kembali ke Login
            </button>
          </div>
        </div>
        
        {step === 1 && (
          <form onSubmit={handleRequestOTP} className="space-y-4">
            <p className="text-sm text-gray-500 text-center mb-4">
              Masukkan email yang terdaftar, kami akan mengirimkan 6 digit kode pemulihan.
            </p>
            <input 
              type="email" placeholder="contoh: koki@youri.com" required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-3 rounded-xl bg-gray-100 outline-none focus:ring-2 focus:ring-[#C18A5E]"
            />
            <button disabled={isLoading} className="w-full bg-[#C18A5E] text-white py-3 rounded-xl font-bold hover:bg-[#a6754d] transition-all disabled:opacity-70">
              {isLoading ? "Mengirim..." : "Kirim Kode OTP"}
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <p className="text-sm text-gray-500 text-center mb-4">
                Cek kotak masuk email kamu dan masukkan kode 6 digit di bawah ini.
              </p>
              <input 
                type="text" placeholder="Masukkan OTP..." required
                value={formData.otp}
                onChange={(e) => setFormData({...formData, otp: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-gray-100 outline-none focus:ring-2 focus:ring-[#C18A5E] text-center tracking-[0.5em] font-bold text-lg"
                maxLength="6"
              />
              <button disabled={isLoading} type="submit" className="w-full bg-[#C18A5E] text-white py-3 rounded-xl font-bold hover:bg-[#a6754d] transition-all disabled:opacity-70">
                {isLoading ? "Memverifikasi..." : "Cek Kode OTP"}
              </button>
            </form>

            {/* 🌸 TAMBAHAN YUKI: Tombol resend OTP */}
            <div className="w-full flex justify-center mt-2">
              <p className="text-xs text-gray-500">
                Belum menerima email?{' '}
                <button 
                  onClick={handleResendOTP}
                  disabled={isLoading}
                  className="font-bold text-[#C18A5E] hover:underline disabled:opacity-50"
                >
                  Kirim Ulang
                </button>
              </p>
            </div>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
             <p className="text-sm text-gray-500 text-center mb-4">
              OTP berhasil diverifikasi! Sekarang, silakan racik kata sandi barumu.
            </p>
            <input 
              type="password" placeholder="Sandi Baru (minimal 6 karakter)..." required
              value={formData.new_password}
              onChange={(e) => setFormData({...formData, new_password: e.target.value})}
              className="w-full px-4 py-3 rounded-xl bg-gray-100 outline-none focus:ring-2 focus:ring-[#C18A5E]"
            />
            <button disabled={isLoading} className="w-full bg-[#C18A5E] text-white py-3 rounded-xl font-bold hover:bg-[#a6754d] transition-all disabled:opacity-70">
              {isLoading ? "Menyimpan..." : "Simpan Sandi Baru"}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default ForgotPassword;