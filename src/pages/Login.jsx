import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import YouriMascot from "../components/YouriMascot";
import api from "../services/api";
import { useGoogleLogin } from "@react-oauth/google";
import { FiEye, FiEyeOff } from "react-icons/fi";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Email dan Password wajib diisi ya!");
      return;
    }
    setIsLoading(true);
    try {
      const response = await toast.promise(
        api.post("/user/login", { email, password }),
        {
          loading: "Sedang memetakan pangkalan data...",
          success: "Login Berhasil!! 👨‍🍳",
          error: "Login Gagal!",
        },
      );
      const { access_token } = response.data.data;
      localStorage.setItem("youri_token", access_token);
      navigate("/dashboard");
    } catch (error) {
      if (error.response && error.response.data) {
        const { message, errors } = error.response.data;
        if (errors) {
          const firstErrorKey = Object.keys(errors)[0];
          const firstErrorMessage = errors[firstErrorKey][0];
          toast.error(`${firstErrorMessage}`);
        } else {
          toast.error(message || "Terjadi kesalahan saat login.");
        }
      } else {
        toast.error("Gagal terhubung ke server Youri.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSSO = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      try {
        const response = await toast.promise(
          api.post('/user/google-auth', { google_token: tokenResponse.access_token }),
          {
            loading: 'Memverifikasi jalur VIP Google...',
            success: 'Berhasil masuk dengan Google! ✨',
            error: 'Gagal terhubung dengan Google.',
          }
        );
        
        const { access_token } = response.data.data;
        localStorage.setItem('youri_token', access_token);
        navigate('/dashboard');
        
      } catch (error) {
        toast.error(error.response?.data?.message || 'Gagal terhubung ke server Youri.');
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      toast.error('Login Google dibatalkan.');
    }
  });

  return (
    <div className="w-full min-h-screen flex justify-center bg-white md:bg-[#1e1e1e]">
      <div className="w-full max-w-[450px] md:max-w-none min-h-screen bg-white shadow-2xl overflow-x-hidden md:grid md:grid-cols-2">
        {/* [md:LEFT PANEL] - PC only */}
        <div className="hidden md:flex flex-col items-center justify-center bg-[#C18A5E] p-16">
          <YouriMascot
            isXD={false}
            className="w-60 h-60 drop-shadow-2xl mb-10"
          />
          <h2 className="text-5xl font-bold text-white tracking-widest drop-shadow-lg">
            Youri
          </h2>
          <p className="text-xl text-[#E3CBB8] mt-4 font-medium text-center">
            Your personalized assistant for easier cooking planning
          </p>
        </div>

        {/* [md:RIGHT PANEL] / [DEFAULT Mobile Panel] */}
        <div className="flex flex-col bg-white p-8 pt-16 md:pt-8 md:justify-center">
          <div className="w-full flex flex-col items-center mb-10 md:hidden">
            <YouriMascot isXD={false} className="w-20 h-20 drop-shadow-md" />
            <h2 className="text-2xl font-bold text-gray-800 mt-2 tracking-wide">
              Youri
            </h2>
          </div>

          <div className="w-full max-w-md mx-auto">
            <div className="hidden md:block mb-10">
              <h3 className="text-3xl font-bold text-gray-800 tracking-wide">
                Selamat Datang di Youri! ✨
              </h3>
              <p className="text-base text-gray-500 mt-2">
                Masuk ke akunmu untuk mulai meracik hidangan lezat hari ini.
              </p>
            </div>

            <form onSubmit={handleLogin} className="w-full flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700 ml-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Masukkan email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-gray-100 rounded-xl text-sm border-2 border-transparent focus:border-[#C18A5E] focus:bg-white outline-none transition-all placeholder:text-gray-400"
                />
              </div>

              {/* 🌸 Modifikasi Input Password di sini */}
              <div className="flex flex-col gap-1.5 relative">
                <label className="text-sm font-semibold text-gray-700 ml-1">
                  Password
                </label>
                <div className="relative w-full">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    /* Tambahkan pr-12 agar teks tidak tertutup ikon mata */
                    className="w-full px-4 py-3 pr-12 bg-gray-100 rounded-xl text-sm border-2 border-transparent focus:border-[#C18A5E] focus:bg-white outline-none transition-all placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#C18A5E] focus:outline-none transition-colors"
                  >
                    {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#C18A5E] text-white font-bold py-3.5 rounded-xl mt-5 shadow-md hover:bg-[#a6754d] hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed text-base tracking-wide"
              >
                {isLoading ? "Sedang Memuat Pangkalan Data..." : "Login"}
              </button>
            </form>

            {/* 1. LUPA PASSWORD */}
            <div className="w-full flex justify-center mt-4">
              <Link to="/forgot-password" className="text-xs font-bold text-gray-400 hover:text-[#C18A5E] transition-colors">
                Lupa password kamu?
              </Link>
            </div>

            {/* 2. DIVIDER (GARIS PEMISAH) */}
            <div className="w-full flex items-center gap-3 my-7">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest whitespace-nowrap">
                Atau Masuk Dengan
              </span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            {/* 3. TOMBOL GOOGLE SSO */}
            <button
              onClick={handleGoogleSSO}
              type="button"
              className="w-full bg-white border-2 border-gray-200 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm flex items-center justify-center gap-3 shadow-sm active:scale-95"
            >
              <svg width="20" height="20" viewBox="0 0 48 48">
                <defs>
                  <path
                    id="a"
                    d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"
                  />
                </defs>
                <clipPath id="b">
                  <use xlinkHref="#a" overflow="visible" />
                </clipPath>
                <path clipPath="url(#b)" fill="#FBBC05" d="M0 37V11l17 13z" />
                <path clipPath="url(#b)" fill="#EA4335" d="M0 11l17 13 7-6.1L48 14V0H0z" />
                <path clipPath="url(#b)" fill="#34A853" d="M0 37l30-23 7.9 1L48 0v48H0z" />
                <path clipPath="url(#b)" fill="#4285F4" d="M48 48L17 24l-4-3 35-10z" />
              </svg>
              Masuk dengan Google
            </button>

            {/* 4. LINK REGISTER */}
            <p className="text-center text-sm font-medium text-gray-500 mt-8">
              Belum punya akun?{" "}
              <Link
                to="/register"
                className="text-[#C18A5E] font-black hover:underline transition-all"
              >
                Daftar sekarang
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;