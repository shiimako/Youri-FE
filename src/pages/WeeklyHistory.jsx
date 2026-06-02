import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import { FiCalendar, FiCheckCircle, FiGift, FiArrowLeft } from "react-icons/fi";
import ImageWithFallback from "../components/ImageWithFallback";

const WeeklyHistory = () => {
  const [historyData, setHistoryData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [claimData, setClaimData] = useState(null);
  const navigate = useNavigate();

  const fetchHistory = useCallback(async () => {
    try {
      const res = await api.get("/user/weekly-history");
      setHistoryData(res.data.data);
    } catch (error) {
      toast.error("Gagal memuat arsip masak");
      console.error("Error fetching weekly history:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleClaim = async () => {
    const toastId = toast.loading("Mengklaim XP...");
    try {
      const res = await api.post("/user/weekly-history/claim");
      toast.success("Klaim berhasil!", { id: toastId });

      // Tampilkan Modal Selebrasi
      setClaimData(res.data.data);

      // Update UI latar belakang agar tombol klaim menghilang
      fetchHistory();
    } catch (error) {
      toast.error("Gagal mengklaim XP", { id: toastId });
      console.error("Error claiming weekly XP:", error);
    }
  };

  const handleCloseCongrats = async () => {
    if (claimData?.gamification?.is_level_up) {
      try {
        await api.patch("/user/acknowledge-levelup");
        console.log("Level Up Acknowledged by Backend!");
      } catch (error) {
        console.error("Gagal melakukan acknowledge level up:", error);
      }
    }

    setClaimData(null);
  };

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-[#C18A5E] animate-pulse">
        Memuat Arsip...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#fbf9f7] pb-32 pt-6 px-6 md:px-12 font-sans animate-fadeIn">
      
      {/* 🌸 HEADER CONTAINER (Relatif untuk mengunci posisi tombol) */}
      <div className="max-w-2xl mx-auto mb-8 relative flex items-center justify-center min-h-[80px]">
        
        {/* Tombol Back (Menempel di Kiri) */}
        <button
          onClick={() => navigate("/dashboard")}
          className="absolute left-0 p-2.5 bg-white border border-gray-200 hover:bg-[#E3CBB8]/30 rounded-xl transition-colors text-gray-600 hover:text-[#C18A5E] shadow-sm z-10"
        >
          <FiArrowLeft size={22} />
        </button>

        {/* Teks Judul (Tetap Sempurna di Tengah) */}
        <div className="text-center px-16">
          <h1 className="text-3xl font-black text-gray-800 mb-2">
            Arsip Mingguan
          </h1>
          <p className="text-gray-500 font-medium text-sm">
            Rekam jejak mahakaryamu dan bahan yang berhasil diselamatkan minggu
            ini.
          </p>
        </div>
      </div>

      {/* 🌸 YUKI'S FIX: Banner Peringatan Jangan Lupa Klaim */}
      <div className="max-w-2xl mx-auto mb-8 bg-red-50 border border-red-100 p-4 rounded-2xl flex gap-3 items-start shadow-sm">
        <span className="text-red-500 mt-0.5 text-lg">⚠️</span>
        <p className="text-xs md:text-sm text-red-600 font-bold leading-relaxed">
          <span className="font-black uppercase tracking-wide">Peringatan:</span> Jangan sampai terlewat! Bahan yang kamu selamatkan minggu ini harus segera diklaim sebelum berganti minggu agar EXP-nya tidak hangus.
        </p>
      </div>

      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        {historyData?.histories?.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-gray-400 font-bold">
              Belum ada riwayat masak minggu ini. Yuk mulai masak!
            </p>
          </div>
        ) : (
          historyData.histories.map((dayGroup, i) => (
            <div key={i} className="flex flex-col gap-4">
              {/* Header Tanggal */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#E3CBB8] text-[#C18A5E] flex items-center justify-center">
                  <FiCalendar size={16} />
                </div>
                <h3 className="font-black text-gray-700 text-lg">
                  {dayGroup.day},{" "}
                  <span className="font-medium text-gray-500 text-sm">
                    {dayGroup.date}
                  </span>
                </h3>
              </div>

              {/* List Kartu Resep Per Hari */}
              <div className="flex flex-col gap-4 pl-4 border-l-2 border-gray-200 ml-4">
                {dayGroup.records.map((record) => (
                  <div
                    key={record.history_id}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 relative overflow-hidden"
                  >
                    {/* Status Klaim Mengambang */}
                    {record.saved_ingredients.length > 0 && (
                      <div
                        className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-black uppercase rounded-bl-xl ${record.is_claimed ? "bg-gray-100 text-gray-400" : "bg-yellow-100 text-yellow-600"}`}
                      >
                        {record.is_claimed ? "Terklaim" : "Bisa Diklaim"}
                      </div>
                    )}

                    {/* Foto Bukti Masak */}
                    <div className="w-full md:w-32 h-32 shrink-0 rounded-xl overflow-hidden bg-gray-100">
                      <ImageWithFallback
                        src={record.proof_image_url}
                        fallbackText={record.recipe_title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info Resep & Bahan */}
                    <div className="flex flex-col justify-center w-full">
                      <span className="text-xs text-gray-400 font-bold mb-1">
                        {record.cooked_time}
                      </span>
                      <h4 className="font-black text-gray-800 text-lg mb-3 leading-tight">
                        {record.recipe_title}
                      </h4>

                      <div className="mt-auto">
                        <p className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-wider mb-2">
                          Bahan terselamatkan pada resep ini:
                        </p>
                      <div className="flex flex-wrap gap-2">
                        {record.saved_ingredients.length > 0 ? (
                          record.saved_ingredients.map((ing, idx) => (
                            <span
                              key={idx}
                              className="bg-emerald-50 text-emerald-600 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1 border border-emerald-100"
                            >
                              <FiCheckCircle size={12} /> {ing}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            Tidak ada bahan substitusi yang dipakai.
                          </span>
                        )}
                      </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* STICKY BOTTOM BUTTON (Hanya muncul jika ada XP yang bisa diklaim) */}
      {historyData?.can_claim && (
        <div className="fixed bottom-0 left-0 w-full p-4 md:p-6 z-40 pb-safe animate-slideUp">
          <div className="max-w-md mx-auto">
            <button
              onClick={handleClaim}
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-yellow-950 py-4 rounded-2xl font-black text-lg shadow-[0_10px_25px_rgba(234,179,8,0.3)] transition-all active:scale-95 flex justify-center items-center gap-3 border border-yellow-300"
            >
              <FiGift size={24} /> Klaim {historyData.potential_xp} XP Sekarang!
            </button>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL SELEBRASI KLAIM (CONGRATS)
          ========================================== */}
      {claimData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-md animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl relative flex flex-col items-center text-center overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-yellow-300/30 to-transparent pointer-events-none"></div>

            <div className="w-32 h-32 mb-2 relative z-10 animate-bounce">
              <ImageWithFallback
                src={claimData.happy_sprite || "/fallback_happy.svg"}
                fallbackText="Youri Happy"
                className="w-full h-full object-contain drop-shadow-2xl"
              />
            </div>

            {claimData.gamification?.is_level_up ? (
              <div className="mb-2">
                <span className="text-yellow-500 font-black tracking-widest text-sm uppercase animate-pulse">
                  🎉 Selamat! 🎉
                </span>
                <h2 className="text-3xl font-black text-gray-800">LEVEL UP!</h2>
              </div>
            ) : (
              <h2 className="text-2xl font-black text-gray-800 mb-2">
                Bahan Terselamatkan!
              </h2>
            )}

            <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6">
              Kamu berhasil menyelamatkan{" "}
              <span className="font-bold text-[#C18A5E]">
                {claimData.saved_count} bahan
              </span>{" "}
              minggu ini!
            </p>

            <div className="w-full bg-gray-50 border border-gray-100 rounded-3xl p-5 mb-8 shadow-sm">
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-black text-gray-400 uppercase tracking-wider">
                  Level {claimData.gamification?.level}
                </span>
                <span className="text-lg font-black text-[#10b981]">
                  +{claimData.gamification?.exp_earned} XP
                </span>
              </div>
              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner relative">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-[#10b981] rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${(claimData.gamification?.current_xp / claimData.gamification?.next_xp) * 100}%`,
                  }}
                ></div>
              </div>
              <div className="text-right mt-1.5">
                <span className="text-[10px] font-bold text-gray-400">
                  {claimData.gamification?.current_xp} /{" "}
                  {claimData.gamification?.next_xp} XP
                </span>
              </div>
            </div>

            <button
              onClick={handleCloseCongrats}
              className="w-full py-4 rounded-2xl font-black text-white bg-[#C18A5E] hover:bg-[#a6744d] shadow-[0_8px_20px_rgba(193,138,94,0.3)] transition-all active:scale-95 text-lg"
            >
              Lanjutkan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyHistory;
