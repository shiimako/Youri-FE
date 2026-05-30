// src/pages/Register.jsx - TOTAL RESPONSIVE OVERHAUL WITH ICONS
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import YouriMascot from '../components/YouriMascot';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi'; 

const InputIconWrapper = ({ children }) => (
  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg group-focus-within:text-[#C18A5E]">
    {children}
  </div>
);

const Register = () => {
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.email.trim() || !formData.password || !formData.confirmPassword) {
      toast.error('Semua kolom wajib diisi ya, Chef!');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Password dan Konfirmasi Password tidak cocok!');
      return;
    }
    
    setIsLoading(true);
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: 'Mendaftarkan koki baru ke Youri...',
        success: 'Akun berhasil dibuat! Silakan Login.',
        error: 'Pendaftaran gagal.',
      }
    ).then(() => {
      setIsLoading(false);
      navigate('/login');
    });
  };

  const handleNotAvailable = () => {
    toast('Fitur Google sedang diracik!', { icon: '🚧' });
  };

  return (
    <div className="w-full min-h-screen flex justify-center bg-white md:bg-[#1e1e1e]">
      
      <div className="w-full max-w-[450px] md:max-w-none min-h-screen bg-white shadow-2xl overflow-x-hidden md:grid md:grid-cols-2">
        
        {/* =======================================================
            [md:LEFT PANEL] - PC only (Coklat, Maskot Besar)
            ======================================================= */}
        <div className="hidden md:flex flex-col items-center justify-center bg-[#C18A5E] p-16">
          <YouriMascot isXD={true} className="w-60 h-60 drop-shadow-2xl mb-10" />
          <h2 className="text-5xl font-bold text-white tracking-widest drop-shadow-lg">Youri</h2>
          <p className="text-xl text-[#E3CBB8] mt-4 font-medium text-center">Your new partner in creating delicious and planned home meals</p>
        </div>

        {/* =======================================================
            [md:RIGHT PANEL] / [DEFAULT Mobile Panel]
            ======================================================= */}
        <div className="flex flex-col bg-white p-8 pt-16 md:pt-8 md:justify-center">
          
          {/* Header Mobile Only */}
          <div className="w-full flex flex-col items-center mb-8 md:hidden">
            <YouriMascot isXD={true} className="w-16 h-16 drop-shadow-md" />
            <h2 className="text-2xl font-bold text-gray-800 mt-2 tracking-wide">Youri</h2>
          </div>

          <div className="w-full max-w-md mx-auto">
            
            {/* Teks Welcome PC */}
            <div className="hidden md:block mb-8">
              <h3 className="text-3xl font-bold text-gray-800 tracking-wide">Daftar Akun Koki Baru! 🍳</h3>
              <p className="text-base text-gray-500 mt-2">Gabung dengan Youri untuk perencanaan masak yang lebih mudah.</p>
            </div>

            <form onSubmit={handleRegister} className="w-full flex flex-col gap-4">
              
              {/* Kolom 1: Username (+FiUser Icon) */}
              <div className="flex flex-col gap-1 group">
                <label className="text-xs font-semibold text-gray-700 ml-1">Nama Panggilan (Chef Name)</label>
                <div className="relative">
                  <InputIconWrapper><FiUser /></InputIconWrapper>
                  <input type="text" name="username" placeholder="Nama Chef..." onChange={handleChange} required disabled={isLoading}
                    className="w-full pl-12 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm border-2 border-transparent focus:border-[#C18A5E] focus:bg-white outline-none transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>
              
              {/* Kolom 2: Email (+FiMail Icon) */}
              <div className="flex flex-col gap-1 group">
                <label className="text-xs font-semibold text-gray-700 ml-1">Email</label>
                <div className="relative">
                  <InputIconWrapper><FiMail /></InputIconWrapper>
                  <input type="string" name="email" placeholder="bumbu@youri.com..." onChange={handleChange} required disabled={isLoading}
                    className="w-full pl-12 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm border-2 border-transparent focus:border-[#C18A5E] focus:bg-white outline-none transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Kolom 3: Password (+FiLock Icon + Eye Toggle) */}
              <div className="flex flex-col gap-1 group relative">
                <label className="text-xs font-semibold text-gray-700 ml-1">Password</label>
                <div className="relative">
                  <InputIconWrapper><FiLock /></InputIconWrapper>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    name="password" 
                    placeholder="••••••••" 
                    onChange={handleChange} 
                    required 
                    disabled={isLoading}
                    className="w-full pl-12 pr-12 py-2.5 bg-gray-100 rounded-xl text-sm border-2 border-transparent focus:border-[#C18A5E] focus:bg-white outline-none transition-all placeholder:text-gray-400"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg hover:text-gray-600">
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              {/* Kolom 4: Confirm Password (+FiLock Icon + Eye Toggle) */}
              <div className="flex flex-col gap-1 group relative">
                <label className="text-xs font-semibold text-gray-700 ml-1">Konfirmasi Password</label>
                <div className="relative">
                  <InputIconWrapper><FiLock /></InputIconWrapper>
                  <input 
                    type={showConfirmPassword ? 'text' : 'password'} 
                    name="confirmPassword" 
                    placeholder="••••••••" 
                    onChange={handleChange} 
                    required 
                    disabled={isLoading}
                    className="w-full pl-12 pr-12 py-2.5 bg-gray-100 rounded-xl text-sm border-2 border-transparent focus:border-[#C18A5E] focus:bg-white outline-none transition-all placeholder:text-gray-400"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg hover:text-gray-600">
                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="w-full bg-[#C18A5E] text-white font-bold py-3.5 rounded-xl mt-3 shadow-md hover:bg-[#a6754d] transition-all disabled:opacity-70 disabled:cursor-not-allowed tracking-wide">
                {isLoading ? 'Sedang Memproses...' : 'Daftar Sekarang'}
              </button>
            </form>

            <div className="w-full flex justify-center mt-4">
              <Link to="/login" className="text-xs text-gray-500 hover:text-gray-800 underline">
                Already have an account? Login
              </Link>
            </div>

            <div className="w-full flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-xs text-gray-400 font-medium whitespace-nowrap">Atau Daftar Dengan</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            {/* Aksi Google Button */}
            <button 
              onClick={handleNotAvailable} 
              type="button" 
              className="w-full bg-white border-2 border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm flex items-center justify-center gap-3 shadow-sm"
            >
              {/* SVG Google Logo */}
              <svg width="20" height="20" viewBox="0 0 48 48">
                <defs>
                  <path id="a" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/>
                </defs>
                <clipPath id="b">
                  <use xlinkHref="#a" overflow="visible"/>
                </clipPath>
                <path clipPath="url(#b)" fill="#FBBC05" d="M0 37V11l17 13z"/>
                <path clipPath="url(#b)" fill="#EA4335" d="M0 11l17 13 7-6.1L48 14V0H0z"/>
                <path clipPath="url(#b)" fill="#34A853" d="M0 37l30-23 7.9 1L48 0v48H0z"/>
                <path clipPath="url(#b)" fill="#4285F4" d="M48 48L17 24l-4-3 35-10z"/>
              </svg>
              Daftar dengan Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;