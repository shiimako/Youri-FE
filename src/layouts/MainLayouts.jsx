import { useState, useEffect, useRef } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";

import YouriMascot from "../components/YouriMascot";
import ImageWithFallback from "../components/ImageWithFallback";
import YouriIdleStatic from "../assets/youri_sprites/loading.svg";

import {
  FiHome,
  FiUser,
  FiBookOpen,
  FiShield,
  FiLogOut,
  FiMenu,
  FiX,
  FiStar,
  FiCalendar,
  FiMail,
  FiAlertTriangle
} from "react-icons/fi";

const MainLayout = () => {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // State Kontrol Menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(true);
  const dropdownRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get("/user/dashboard");
        const data = response.data.data;
        setUserData(data);

        const activeSessionId = data.active_cooking_session;
        const currentPath = location.pathname;

        // Jika user PUNYA sesi masak yang aktif
        if (activeSessionId) {
          const targetPath = `/cooking/recipe/${activeSessionId}`;
          if (currentPath !== targetPath) {
            toast('Kamu tidak bisa kabur! Selesaikan atau batalkan masakanmu dulu!', { icon: '🛑' });
            navigate(targetPath, { replace: true });
          }
        }
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem("youri_token");
          navigate("/login");
        }
        if (location.pathname === '/dashboard') {
           toast.error("Gagal terhubung ke pangkalan data Youri.");
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUser();
  }, [navigate, location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("youri_token");
    toast.success("Berhasil Logout! Sampai jumpa lagi, Chef!");
    navigate("/login");
  };

  if (isLoading || !userData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fbf9f7]">
        <div className="w-24 h-24 mb-4 animate-bounce">
          <div className="w-full h-full bg-[#E3CBB8] rounded-full flex items-center justify-center">
            <img src={YouriIdleStatic} alt="Loading Youri" className="w-12 h-12 object-contain" />
          </div>
        </div>
        <p className="animate-pulse font-bold text-[#C18A5E] tracking-wide mt-2">Menyiapkan Dapur...</p>
      </div>
    );
  }

  const info = userData.gamification_info || {};
  const equippedAssets = userData.assets || {};
  const currentXp = info.current_xp || 0;
  const xpPercent = Math.min(Math.max((currentXp / info.next_xp) * 100, 0), 100) || 0;
  const isMaxLevel = info.level === 99 && currentXp >= info.next_xp;

  return (
    <div className="w-full min-h-screen bg-[#fbf9f7] flex overflow-hidden">
      {/* ========================================================
          1. SIDEBAR DESKTOP
          ======================================================== */}
      <aside className="hidden md:flex w-[320px] lg:w-[360px] shrink-0 p-8 flex-col gap-6 border-r border-gray-200 bg-[#fbf9f7] h-screen overflow-y-visible">
        <header className="flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#E3CBB8] rounded-full flex justify-center items-center shadow-sm border-2 border-white">
              <YouriMascot isXD={false} className="w-10 h-10 mt-2" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-800 tracking-tight">Youri</h1>
              <p className="text-[10px] font-bold text-gray-400">Asisten Masakmu</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Ikon Mailbox PC */}
            <Link to="/notifications" className="relative text-gray-400 hover:text-[#C18A5E] transition-colors p-1">
              <FiMail size={22} />
              {userData.recipe?.is_mailbox && (
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#fbf9f7]"></span>
              )}
            </Link>

            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="focus:outline-none hover:scale-105 transition-transform">
                {userData.avatar_url ? (
                  <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 shadow-sm">
                    <ImageWithFallback
                      src={userData.avatar_url}
                      fallbackText={userData.username.slice(0, 2).toUpperCase()}
                      className={`w-full h-full object-cover transition-all`}
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-[#E3CBB8] rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-white">{userData.username.slice(0, 2).toUpperCase()}</span>
                  </div>
                )}
              </button>

              <div className={`absolute right-0 mt-3 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 transition-all origin-top-right ${isProfileMenuOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"}`}>
                <div className="px-4 py-3 border-b border-gray-50 mb-1">
                  <p className="text-xs text-gray-500 font-medium">Logged in as</p>
                  <p className="text-sm font-bold text-gray-800 line-clamp-1">{userData.username}</p>
                </div>
                <Link to="/profile" onClick={() => setIsProfileMenuOpen(false)} className="px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-[#E3CBB8]/20 hover:text-[#C18A5E] flex items-center gap-3 transition-colors">
                  <FiUser size={16} /> Pengaturan Profil
                </Link>
                <Link to="/profile/sprites" onClick={() => setIsProfileMenuOpen(false)} className="px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-[#E3CBB8]/20 hover:text-[#C18A5E] flex items-center gap-3 transition-colors">
                  <FiStar size={16} /> Pengaturan Maskot
                </Link>
                <div className="h-px bg-gray-100 my-1"></div>
                <button onClick={handleLogout} className="w-full px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 flex items-center gap-3 text-left transition-colors">
                  <FiLogOut size={16} /> Keluar Akun
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="shrink-0 mt-2">
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">Hai, <span className="text-[#C18A5E]">{userData.username}!</span></h2>
        </div>

        <div className="shrink-0 bg-[#C18A5E] rounded-3xl p-5 flex items-center justify-between gap-4 text-white shadow-[0_8px_20px_rgba(193,138,94,0.3)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10 pointer-events-none" />
          <div className="flex-1 z-10">
            <h3 className="text-base font-black mb-2 tracking-wide line-clamp-1">Lvl {info.level} - {info.title}</h3>
            <div className="w-full h-2.5 bg-black/10 rounded-full overflow-hidden mb-2 shadow-inner">
              <div className="h-full bg-yellow-400 rounded-full transition-all duration-1000" style={{ width: `${xpPercent}%` }} />
            </div>
            <p className="text-[10px] font-bold opacity-90">{isMaxLevel ? "Max level reached!" : `${info.next_xp - currentXp} Exp menuju level berikutnya`}</p>
          </div>
          <Link to="/profile/sprites" className="w-16 h-16 shrink-0 z-10 hover:scale-105 transition-transform bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-inner">
            <ImageWithFallback src={equippedAssets.badge} className="w-12 h-12 object-contain drop-shadow-lg" />
          </Link>
        </div>

        {/* 🌸 NAVIGASI DESKTOP (Dengan Accordion) */}
        <div className="flex-1 mt-4 -mb-2 overflow-y-auto pr-2 pb-4 custom-scrollbar">
          <MenuAccordion 
            title="Navigasi Utama" 
            isOpen={isDesktopMenuOpen} 
            setIsOpen={setIsDesktopMenuOpen}
          >
            <MenuLink to="/dashboard" icon={<FiHome />} label="Dashboard" current={location.pathname} />
            <MenuLink 
              to="/weekly-history" 
              icon={<FiCalendar />} 
              label="Histori Masakmu" 
              current={location.pathname} 
              badge={info.can_claim ? <div className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm"></div> : null}
            />
            <MenuLink 
              to="/my-recipes" 
              icon={<FiBookOpen />} 
              label="Resep Buatanmu" 
              current={location.pathname} 
              badge={userData.recipe?.is_taken_down ? <FiAlertTriangle className="text-red-500 drop-shadow-sm" size={16} /> : null}
            />
          </MenuAccordion>

          {/* Admin Panel */}
          {userData.role === "admin" && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Link to="/admin" className="flex items-center justify-between p-4 rounded-2xl transition-all bg-gradient-to-r from-red-50 to-white hover:from-red-100 text-red-600 font-bold border border-red-100 shadow-sm group">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-red-100 rounded-xl group-hover:scale-110 transition-transform"><FiShield size={18} /></div>
                  <span className="text-sm">Admin Panel</span>
                </div>
              </Link>
            </div>
          )}
        </div>

        <div className="shrink-0 flex items-center justify-start mt-2">
          <span className="text-[10px] font-black text-gray-300 tracking-[0.2em]">© 2026 YOURITEAM</span>
        </div>
      </aside>

      {/* ========================================================
          2. MAIN CONTENT AREA
          ======================================================== */}
      <main className="flex-1 bg-white relative h-screen overflow-y-auto md:rounded-l-[40px] md:shadow-[-15px_0_40px_rgba(0,0,0,0.04)] border-l border-gray-100 flex flex-col">
        {/* HEADER MOBILE */}
        <div className="md:hidden sticky top-0 z-40 bg-white/90 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-gray-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#E3CBB8] rounded-full flex justify-center items-center shadow-inner border border-white">
              <YouriMascot isXD={false} className="w-8 h-8 mt-1" />
            </div>
            <h2 className="text-xl font-black text-[#C18A5E] tracking-tight">Youri</h2>
          </div>
          <div className="flex items-center gap-3">
            {/* Ikon Mailbox Mobile */}
            <Link to="/notifications" className="relative p-2 text-gray-400 hover:text-[#C18A5E] transition-colors">
              <FiMail size={22} />
              {userData.recipe?.is_mailbox && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
              )}
            </Link>
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2.5 bg-gray-50 rounded-xl text-gray-600 hover:bg-[#E3CBB8] hover:text-[#C18A5E] transition-all shadow-sm border border-gray-100">
              <FiMenu size={22} />
            </button>
          </div>
        </div>

        <Outlet context={{ userData }} />

        {/* COPYRIGHT MOBILE (Pengganti Bottom Nav yang hilang) */}
        {!userData.active_cooking_session && (
          <div className="md:hidden flex justify-center items-center py-8 mt-auto shrink-0">
            <span className="text-[10px] font-black text-gray-300 tracking-[0.2em]">© 2026 YOURITEAM</span>
          </div>
        )}
      </main>

      {/* ========================================================
          3. DRAWER HAMBURGER MENU (MOBILE)
          ======================================================== */}
      <div className={`md:hidden fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ${isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div className="absolute inset-0" onClick={() => setIsMobileMenuOpen(false)}></div>

        <div className={`absolute top-0 right-0 w-[85%] max-w-sm h-full bg-white shadow-2xl p-6 flex flex-col transition-transform duration-300 ease-out ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div className="flex justify-between items-center mb-8 shrink-0">
            <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 shadow-sm">
              {userData.avatar_url ? (
                  <ImageWithFallback
                    src={userData.avatar_url}
                    fallbackText={userData.username.slice(0, 2).toUpperCase()}
                    className={`w-full h-full object-cover transition-all`}
                  />
                ) : (
                  <div className="w-12 h-12 bg-[#E3CBB8] rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-white">{userData.username.slice(0, 2).toUpperCase()}</span>
                  </div>
                )}
              <span className="font-black text-gray-800 text-lg">{userData.username}</span>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
              <FiX size={20} />
            </button>
          </div>

          <div className="shrink-0 bg-[#C18A5E] rounded-3xl p-5 flex items-center justify-between gap-3 text-white shadow-[0_8px_20px_rgba(193,138,94,0.3)] relative overflow-hidden mb-6">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full -mr-8 -mt-8 pointer-events-none" />
            <div className="flex-1 z-10">
              <h3 className="text-sm font-black mb-2 tracking-wide line-clamp-1">Lvl {info.level} - {info.title}</h3>
              <div className="w-full h-2.5 bg-black/10 rounded-full overflow-hidden mb-1.5 shadow-inner">
                <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${xpPercent}%` }} />
              </div>
              <p className="text-[10px] font-bold opacity-90">{isMaxLevel ? "Max level!" : `${info.next_xp - currentXp} Exp lagi`}</p>
            </div>
            <div className="w-14 h-14 shrink-0 z-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 shadow-inner">
              <ImageWithFallback src={equippedAssets.badge} className="w-10 h-10 object-contain drop-shadow-lg" />
            </div>
          </div>

          <nav className="flex flex-col gap-2 flex-1 overflow-y-auto pr-2 pb-4">
            <MenuLink exact to="/profile" icon={<FiUser />} label="Pengaturan Profil" current={location.pathname} onClick={() => setIsMobileMenuOpen(false)} />
            <MenuLink to="/profile/sprites" icon={<FiStar />} label="Pengaturan Maskot" current={location.pathname} onClick={() => setIsMobileMenuOpen(false)} />
            <MenuLink to="/dashboard" icon={<FiHome />} label="Dashboard" current={location.pathname} onClick={() => setIsMobileMenuOpen(false)} />
            <MenuLink 
              to="/weekly-history" 
              icon={<FiCalendar />} 
              label="Histori Masakmu" 
              current={location.pathname} 
              onClick={() => setIsMobileMenuOpen(false)} 
              badge={info.can_claim ? <div className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm"></div> : null}
            />
            <MenuLink 
              to="/my-recipes" 
              icon={<FiBookOpen />} 
              label="Resep Buatanmu" 
              current={location.pathname} 
              onClick={() => setIsMobileMenuOpen(false)}
              badge={userData.recipe?.is_taken_down ? <FiAlertTriangle className="text-red-500 drop-shadow-sm" size={16} /> : null}
            />

            {userData.role === "admin" && (
              <div className="pt-4 mt-2 border-t border-gray-100">
                <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl transition-all bg-red-50 text-red-600 font-bold border border-red-100">
                  <FiShield size={20} /> <span className="text-sm">Admin Panel</span>
                </Link>
              </div>
            )}
          </nav>

          <div className="mt-auto flex flex-col gap-6 pt-4 shrink-0">
            <button onClick={handleLogout} className="flex items-center justify-center gap-2 p-4 bg-white text-red-500 rounded-2xl font-bold border-2 border-red-100 hover:bg-red-50 transition-colors shadow-sm">
              <FiLogOut size={20} /> Keluar Akun
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// KOMPONEN PEMBANTU
// ==========================================

const MenuLink = ({ to, icon, label, current, onClick, badge, exact }) => {
 const isActive = exact 
    ? current === to 
    : current === to || (to !== "/dashboard" && current.startsWith(to));

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center justify-between p-4 rounded-2xl transition-all ${isActive ? "bg-[#E3CBB8]/30 text-[#C18A5E] font-bold" : "hover:bg-gray-50 text-gray-500 font-bold"}`}
    >
      <div className="flex items-center gap-4">
        <span className={isActive ? "text-[#C18A5E]" : "text-gray-400"}>{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
      {/* Tempat Render Badge Notifikasi */}
      {badge && <div>{badge}</div>}
    </Link>
  );
};

  const MenuAccordion = ({ title, isOpen, setIsOpen, children }) => {
  return (
    <div className="flex flex-col border border-gray-200 bg-white rounded-3xl overflow-hidden shadow-sm transition-all">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between p-5 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="font-black text-gray-700 text-sm tracking-wide uppercase">{title}</span>
        <div className={`w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-500 shadow-sm transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
      </button>
      
      <div 
        className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="p-3 flex flex-col gap-1 bg-white">
          {children}
        </div>
      </div>
    </div>
  );
};
export default MainLayout;