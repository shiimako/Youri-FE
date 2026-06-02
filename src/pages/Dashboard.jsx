import { useState, useEffect } from "react";
import { Link, useOutletContext, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";

import ImageWithFallback from "../components/ImageWithFallback";
import { FaFire } from "react-icons/fa";
import {
  FiHome,
  FiUser,
  FiBookOpen,
  FiCalendar,
  FiAlertTriangle,
} from "react-icons/fi";

const Dashboard = () => {
  const { userData } = useOutletContext();
  const location = useLocation();

  const [recommendations, setRecommendations] = useState([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [bubbleText, setBubbleText] = useState("Ayo masak!");

  const daysOfWeek = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

  // Fetch Rekomendasi
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const recResponse = await api.get("/user/dashboard/recommendations");
        setRecommendations(recResponse.data.data);
      } catch (error) {
        toast.error("Gagal memuat rekomendasi resep.");
        console.error(error);
      } finally {
        setIsLoadingRecs(false);
      }
    };
    fetchRecommendations();
  }, []);

  // Efek Gelembung Dialog Random (Mobile)
  useEffect(() => {
    const dialogues = [
      "Ready buat masak? Klik aku!",
      "Bahan nganggur? Masak yuk!",
      "Youri laper... Yuk masak yuk?:'>",
      "Pencet aku!",
      "Masak apa ya hari ini?",
      "Cari exp bareng yuk!",
      "Yuk, selametin bahan-bahan di kulkasmu!",
    ];

    const interval = setInterval(() => {
      const randomText =
        dialogues[Math.floor(Math.random() * dialogues.length)];
      setBubbleText(randomText);
    }, 4000); // Ganti teks tiap 4 detik

    return () => clearInterval(interval);
  }, []);

  const info = userData.gamification_info || {};
  const equippedAssets = userData.assets || {};
  const currentXp = info.current_xp || 0;
  const xpPercent =
    Math.min(Math.max((currentXp / info.next_xp) * 100, 0), 100) || 0;
  const isMaxLevel = info.level === 99 && currentXp >= info.next_xp;

  const recommendationTitle = userData.favourite_category
    ? `Spesial buat kamu yang suka ${userData.favourite_category}! 🍲`
    : "Bingung mau masak apa? Rekomendasi nih! 🍳";

  return (
    <div className="w-full flex flex-col p-6 md:p-12 gap-8 animate-fadeIn pb-32 md:pb-12 relative">
      {/* LEVEL CARD KHUSUS MOBILE */}
      <div className="md:hidden shrink-0 bg-[#C18A5E] rounded-3xl p-5 flex items-center justify-between gap-3 text-white shadow-[0_8px_20px_rgba(193,138,94,0.3)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full -mr-8 -mt-8 pointer-events-none" />
        <div className="flex-1 z-10">
          <h3 className="text-sm font-black mb-2 tracking-wide line-clamp-1">
            Lvl {info.level} - {info.title}
          </h3>
          <div className="w-full h-2.5 bg-black/10 rounded-full overflow-hidden mb-1.5 shadow-inner">
            <div
              className="h-full bg-yellow-400 rounded-full transition-all"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
          <p className="text-[10px] font-bold opacity-90">
            {isMaxLevel ? "Max level!" : `${info.next_xp - currentXp} Exp lagi`}
          </p>
        </div>
        <Link
          to="/profile/sprites"
          className="w-14 h-14 shrink-0 z-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 shadow-inner hover:scale-105 transition-transform"
        >
          <ImageWithFallback
            src={equippedAssets.badge}
            className="w-10 h-10 object-contain drop-shadow-lg"
          />
        </Link>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex w-full bg-gray-50 md:bg-gray-100/50 rounded-2xl p-2 shadow-inner border border-gray-200">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex-1 py-3 text-sm md:text-base font-black rounded-xl transition-all ${activeTab === "dashboard" ? "bg-[#C18A5E] text-white shadow-md" : "text-gray-400 hover:text-gray-600"}`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab("about")}
          className={`flex-1 py-3 text-sm md:text-base font-black rounded-xl transition-all ${activeTab === "about" ? "bg-[#C18A5E] text-white shadow-md" : "text-gray-400 hover:text-gray-600"}`}
        >
          About Youri
        </button>
      </div>

      {activeTab === "dashboard" ? (
        <div className="flex flex-col gap-10">
          {/* SECTION: STREAK MASAK */}
          <div className="flex flex-col gap-4 md:gap-5 w-full">
            <p className="text-xl md:text-2xl font-black text-gray-800 tracking-tight">
              Streak masak kamu
            </p>

            {/* 🌸 YUKI'S FIX: Ubah padding (py-4 px-3) dan hapus overflow-x-auto agar tidak muncul scrollbar */}
            <div className="flex justify-between items-center w-full bg-white py-4 px-2.5 sm:px-5 md:p-8 rounded-[28px] md:rounded-[32px] border border-gray-100 shadow-sm gap-1 md:gap-2">
              {daysOfWeek.map((day, index) => {
                const isActive = info.streak_days && info.streak_days[index];
                return (
                  // 🌸 YUKI'S FIX: Gunakan flex-1 agar lebar tiap hari dibagi rata
                  <div
                    key={day}
                    className="flex flex-col items-center gap-1.5 md:gap-3 flex-1"
                  >
                    {/* 🌸 YUKI'S FIX: Ukuran box diperkecil khusus mobile (w-9 h-9) */}
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex justify-center items-center text-base md:text-2xl transition-all duration-300 ${
                        isActive
                          ? "bg-[#C18A5E] shadow-[0_4px_10px_rgba(193,138,94,0.3)] md:shadow-[0_8px_20px_rgba(193,138,94,0.4)] text-white md:scale-110"
                          : "bg-gray-50 border border-gray-100 md:border-2 text-gray-300"
                      }`}
                    >
                      <FaFire className={isActive ? "animate-pulse" : ""} />
                    </div>

                    {/* 🌸 YUKI'S FIX: Teks hari diperkecil jadi text-[9px] di mobile */}
                    <span
                      className={`text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-wider ${
                        isActive ? "text-[#C18A5E]" : "text-gray-400"
                      }`}
                    >
                      {day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION: REKOMENDASI RESEP */}
          <div className="flex flex-col gap-4 mt-2">
            <p className="text-xl md:text-2xl font-black text-gray-800 tracking-tight">
              {recommendationTitle}
            </p>
            {isLoadingRecs ? (
              <div className="w-full py-10 flex justify-center">
                <p className="animate-pulse font-bold text-[#C18A5E]">
                  Mencari resep terbaik...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {recommendations && recommendations.length > 0 ? (
                  recommendations.map((recipe) => (
                    // 1. Bungkus luar harus flex h-full agar mengisi tinggi Grid dengan maksimal
                    <Link
                      to={`/cooking/recipe/${recipe.recipe_id}`}
                      key={recipe.title}
                      className="h-full bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 flex flex-col hover:shadow-xl hover:border-[#E3CBB8] transition-all group cursor-pointer"
                    >
                      {/* Bagian Gambar (Tinggi Tetap) */}
                      <div className="w-full h-32 md:h-44 bg-gray-50 relative overflow-hidden shrink-0">
                        <ImageWithFallback
                          src={recipe.image_url}
                          alt={recipe.title}
                          fallbackText={recipe.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        />
                        {recipe.categories && recipe.categories.length > 0 && (
                          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-gray-800 text-[10px] md:text-xs font-black px-3 py-1.5 rounded-full shadow-sm">
                            {recipe.categories[0]}
                          </div>
                        )}
                      </div>

                      {/* 2. flex-1 akan memaksa div cokelat ini memanjang sampai ke bawah Grid! */}
                      <div className="p-4 md:p-5 bg-[#C18A5E] text-white flex flex-col flex-1 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-transparent to-white/10 pointer-events-none" />

                        {/* 3. Bungkus Judul dan Author agar tetap di atas */}
                        <div className="flex flex-col gap-1 mb-auto relative z-10">
                          <span className="text-xs md:text-sm font-black leading-snug line-clamp-2">
                            {recipe.title}
                          </span>
                          <span className="text-[10px] md:text-xs text-[#E3CBB8] font-bold line-clamp-1">
                            By {recipe.author || "Youri Chef"}
                          </span>
                        </div>

                        {/* 4. Tombol "Lihat Resep" dipaksa selalu di bawah (karena div atasnya ada mb-auto) */}
                        <div className="flex justify-end items-center mt-4 relative z-10">
                          <span className="text-[10px] md:text-xs text-white font-black flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            Lihat Resep{" "}
                            <span className="text-[#E3CBB8]">&gt;</span>
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="col-span-2 lg:col-span-4 text-sm text-gray-500 text-center py-12 bg-gray-50 rounded-3xl border border-gray-100 font-medium">
                    Belum ada rekomendasi. Yuk, isi keranjang bahanmu!
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ========================================================
           SECTION: ABOUT YOURI
           ======================================================== */
        <div className="flex flex-col gap-10 animate-fadeIn max-w-4xl">
          {/* HEADER ABOUT (Dengan Logo) */}
          <div className="flex items-center gap-4 border-b-2 border-gray-100 pb-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center p-1 border-2 border-[#C18A5E] shadow-sm rotate-3 hover:rotate-0 transition-transform">
              <ImageWithFallback
                src={equippedAssets.badge}
                className="w-full h-full object-contain"
                fallbackText="Y"
              />
            </div>
            <h2 className="text-3xl font-black text-gray-800">About Youri</h2>
          </div>

          {/* 1. GAMBARAN UMUM */}
          <div className="flex flex-col gap-3">
            <h3 className="font-black text-gray-800 text-xl text-[#C18A5E]">
              Apa itu Youri?
            </h3>
            <p className="text-sm md:text-base text-gray-600 leading-relaxed bg-white p-6 rounded-3xl border border-gray-100 shadow-sm font-medium">
              <strong className="text-gray-800">
                Youri (Your Personalized Assistant for Easier Cooking Planning)
              </strong>{" "}
              adalah asisten dapur pintarmu! Kami hadir untuk mengubah
              kebingungan "masak apa hari ini dari sisa bahan di kulkas?"
              menjadi sebuah petualangan kuliner yang seru, terencana, dan
              tentunya menghasilkan EXP untuk maskot kesayanganmu! 🍳✨
            </p>
          </div>

          {/* 2. ALUR PENGGUNAAN (Langkah-langkah) */}
          <div className="flex flex-col gap-3">
            <h3 className="font-black text-gray-800 text-xl text-[#C18A5E]">
              Petualangan Koki Youri
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StepCard
                number="1"
                title="Cari & Masak"
                desc="Masukkan bahan sisamu, temukan resep terbaik dari AI, dan selesaikan sesi masak di dapur."
              />
              <StepCard
                number="2"
                title="Klaim Bahan"
                desc="Selamatkan bahan makanan yang hampir kedaluwarsa dan catat di Arsip Mingguan."
              />
              <StepCard
                number="3"
                title="Ciptakan Mahakarya"
                desc="Buat resep buatanmu sendiri dan bagikan agar bisa dinikmati koki lain."
              />
              <StepCard
                number="4"
                title="Moderasi Dapur"
                desc="Temukan resep aneh atau berbahaya? Laporkan ke Admin untuk menjaga kualitas."
              />
              <StepCard
                number="5"
                title="Level Up & Gaya!"
                desc="Kumpulkan EXP dari semua aktivitas di atas, naikkan level, dan ganti baju Youri!"
              />
            </div>
          </div>

          {/* 3. SUMBER EXP (Tabel Hadiah) */}
          <div className="flex flex-col gap-3">
            <h3 className="font-black text-gray-800 text-xl text-[#C18A5E]">
              Cara Mendapatkan EXP
            </h3>
            <div className="bg-[#E3CBB8]/10 p-1 rounded-3xl border border-[#E3CBB8]/30 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-200/50">
                <ExpItem
                  icon="🍳"
                  title="Selesaikan Sesi Masak"
                  exp="+50 EXP"
                />
                <ExpItem
                  icon="📖"
                  title="Menerbitkan Resep Baru"
                  exp="+100 EXP"
                />
                <ExpItem
                  icon="♻️"
                  title="Klaim Bahan Terselamatkan"
                  exp="+10 EXP / bahan"
                  note="(Via Arsip Mingguan)"
                />
                <ExpItem
                  icon="🚨"
                  title="Laporan Resep Valid"
                  exp="+15 EXP"
                  note="(Jika resep berhasil di-Takedown)"
                />
              </div>
            </div>
          </div>

          {/* 4. TIM PENGEMBANG (Diambil dari Dokumen Cohort) */}
          <div className="flex flex-col gap-4 mt-4">
            <h3 className="font-black text-gray-800 text-xl border-b border-gray-100 pb-2">
              Meet The Team!
            </h3>
            {/* Grid 3 kolom untuk 6 orang agar pas dan rapi! */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
              <TeamMember name="Khodimul" role="Backend Developer" />
              <TeamMember
                name="Ian"
                role="Frontend Developer"
              />
              <TeamMember name="Adhityo" role="Data Science" />
              <TeamMember name="Ricky" role="Data Science" />
              <TeamMember name="Aidan" role="AI Engineer" />
              <TeamMember name="Arya" role="AI Engineer" />
            </div>
          </div>
        </div>
      )}
      {/* ========================================================
          FAB MASAK DESKTOP (Pindahan dari MainLayout)
          ======================================================== */}
      <Link
        to="/cooking/start"
        className="hidden md:flex fixed bottom-10 right-12 bg-white text-gray-800 py-4 px-6 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] font-bold items-center gap-4 border-2 border-gray-50 hover:border-[#C18A5E] hover:-translate-y-2 transition-all z-50 group"
      >
        <ImageWithFallback
          src={equippedAssets.start_button}
          className="w-14 h-14 shrink-0 object-contain group-hover:scale-110 transition-transform"
        />
        <span className="text-base leading-tight text-left">
          Ready
          <br />
          Masak? Yuk
          <br />
          Mulai!
        </span>
      </Link>

      {/* ========================================================
          BOTTOM NAVIGATION MOBILE (Pindahan dari MainLayout)
          ======================================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 flex justify-evenly items-end pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.08)] z-30 px-2 pt-2 pb-4">
        <MobileTab
          to="/dashboard"
          icon={<FiHome size={24} />}
          label="Beranda"
          isActive={location.pathname === "/dashboard"}
        />
        <MobileTab
          to="/weekly-history"
          icon={<FiCalendar size={24} />}
          label="Histori"
          isActive={location.pathname === "/weekly-history"}
          badge={
            info.can_claim ? (
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white shadow-sm"></div>
            ) : null
          }
        />

        <Link
          to="/cooking/start"
          className="relative -top-6 flex flex-col items-center mx-2 z-50"
        >
          {/* Bubble Chat Animasi */}
          <div className="absolute -top-12 bg-white text-[#C18A5E] text-[11px] font-black px-3 py-1.5 rounded-xl shadow-[0_4px_10px_rgba(193,138,94,0.3)] border border-[#E3CBB8] whitespace-nowrap animate-bounce">
            {bubbleText}
            {/* Segitiga panah menunjuk ke bawah */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-[#E3CBB8] transform rotate-45"></div>
          </div>

          <div className="w-16 h-16 bg-[#C18A5E] rounded-full flex justify-center items-center shadow-[0_8px_20px_rgba(193,138,94,0.4)] border-4 border-white hover:scale-105 transition-transform relative">
            <ImageWithFallback
              src={equippedAssets.start_button}
              className="w-8 h-8 object-contain"
            />
          </div>
        </Link>

        <MobileTab
          to="/my-recipes"
          icon={<FiBookOpen size={24} />}
          label="Recsepmu"
          isActive={location.pathname === "/my-recipes"}
          badge={
            userData.recipe?.is_taken_down ? (
              <FiAlertTriangle
                className="text-red-500 bg-white rounded-full drop-shadow-sm"
                size={14}
              />
            ) : null
          }
        />
        <MobileTab
          to="/profile"
          icon={<FiUser size={24} />}
          label="Profil"
          isActive={location.pathname === "/profile"}
        />
      </nav>
    </div>
  );
};

// Komponen Pembantu Mobile Tab (Di-embed langsung di sini)
const MobileTab = ({ to, icon, label, isActive, badge }) => {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center gap-1 p-2 w-16 transition-colors ${isActive ? "text-[#C18A5E]" : "text-gray-400 hover:text-gray-600"}`}
    >
      <div className="relative">
        {icon}
        {badge && <div className="absolute -top-1.5 -right-1.5">{badge}</div>}
      </div>
      <span className="text-[10px] font-black tracking-wide mt-1">{label}</span>
    </Link>
  );
};

// ==========================================
// KOMPONEN PEMBANTU (KHUSUS ABOUT TAB)
// ==========================================

const StepCard = ({ number, title, desc }) => (
  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex gap-4 items-start hover:shadow-md transition-shadow">
    <div className="w-8 h-8 shrink-0 bg-[#C18A5E] text-white rounded-full flex items-center justify-center font-black shadow-sm">
      {number}
    </div>
    <div>
      <h4 className="font-black text-gray-800 text-sm mb-1">{title}</h4>
      <p className="text-xs text-gray-500 font-medium leading-relaxed">
        {desc}
      </p>
    </div>
  </div>
);

const ExpItem = ({ icon, title, exp, note }) => (
  <div className="bg-white p-4 flex items-center justify-between gap-4">
    <div className="flex items-center gap-3">
      <span className="text-xl bg-gray-50 p-2 rounded-xl border border-gray-100">
        {icon}
      </span>
      <div className="flex flex-col">
        <span className="font-black text-gray-700 text-sm">{title}</span>
        {note && (
          <span className="text-[10px] font-bold text-gray-400">{note}</span>
        )}
      </div>
    </div>
    <span className="font-black text-emerald-500 text-sm shrink-0 bg-emerald-50 px-2 py-1 rounded-lg">
      {exp}
    </span>
  </div>
);

const TeamMember = ({ name, role, note }) => (
  <div className="flex flex-col items-center p-5 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#C18A5E]/30 transition-all group">
    <div className="w-16 h-16 bg-gradient-to-br from-gray-50 to-[#E3CBB8]/30 rounded-full mb-3 flex items-center justify-center text-[#C18A5E] font-black text-2xl shadow-inner border border-gray-200 group-hover:scale-110 transition-transform">
      {name.charAt(0)}
    </div>
    <span className="font-black text-sm text-gray-800 text-center leading-tight">
      {name}
    </span>
    <span className="text-[10px] text-gray-400 font-bold uppercase mt-1 text-center">
      {role}
    </span>
    {note && (
      <span className="text-[9px] text-amber-500 font-black mt-1 bg-amber-50 px-2 py-0.5 rounded-full">
        {note}
      </span>
    )}
  </div>
);

export default Dashboard;
