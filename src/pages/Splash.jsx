// src/pages/Splash.jsx - Updated Responsive
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import YouriMascot from '../components/YouriMascot';

const Splash = () => {
  const [isXD, setIsXD] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Animasi ganti ekspresi setiap 500ms
    const interval = setInterval(() => {
      setIsXD((prev) => !prev);
    }, 500);

    // Pindah ke halaman login setelah 3 detik
    const timeout = setTimeout(() => {
      navigate('/login');
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    // Wrapper utama: Layar penuh, background coklat
    <div className="w-full min-h-screen bg-[#C18A5E] flex justify-center items-center overflow-hidden">
      
      {/* Container Konten: Kita buat max-width agar di PC maskotnya tidak terlalu besar */}
      <div className="w-full max-w-sm flex flex-col items-center px-8">
        
        {/* PERBAIKAN ANIMASI: Pindahkan animate-bounce ke div pembungkus dan soft duration-2000 */}
        <div className="animate-bounce" style={{ animationDuration: '2s' }}>
          <YouriMascot isXD={isXD} className="w-32 h-32 mb-6 drop-shadow-2xl" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-widest drop-shadow-lg">Youri</h1>
        <p className="text-sm md:text-base text-[#E3CBB8] mt-1.5 font-medium">Your cooking assistant</p>
      </div>
    </div>
  );
};

export default Splash;