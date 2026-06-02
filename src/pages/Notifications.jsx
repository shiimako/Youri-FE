import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api"; // Sesuaikan path

import { 
  FiArrowLeft, FiBell, FiCheckCircle, 
  FiAlertTriangle, FiStar, FiInfo 
} from "react-icons/fi";

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // ==========================================
  // FETCH NOTIFICATIONS
  // ==========================================
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get("/user/notifications"); // Sesuaikan rute API Senpai
        setNotifications(response.data.data);
      } catch (error) {
        console.error("Fetch Notifications Error:", error);
        toast.error("Gagal memuat notifikasi.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  // ==========================================
  // MARK AS READ HANDLER
  // ==========================================
  const handleMarkAsRead = async (id, isRead) => {
    if (isRead) return; // Kalau sudah dibaca, abaikan saja

    // Optimistic Update UI (Biar kerasa secepat kilat)
    setNotifications(prev => 
      prev.map(notif => notif.id === id ? { ...notif, is_read: true } : notif)
    );

    try {
      await api.patch(`/user/notifications/${id}/read`); // Sesuaikan rute API Senpai
    } catch (error) {
      console.error("Mark Read Error:", error);
      // Kalau API gagal, kembalikan UI seperti semula
      setNotifications(prev => 
        prev.map(notif => notif.id === id ? { ...notif, is_read: false } : notif)
      );
      toast.error("Gagal menandai notifikasi.");
    }
  };

  // ==========================================
  // HELPER: FORMAT WAKTU RELATIF
  // ==========================================
  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Baru saja";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // ==========================================
  // HELPER: PILIH IKON BERDASARKAN JUDUL
  // ==========================================
  const getIcon = (title) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes("takedown") || lowerTitle.includes("peringatan")) {
      return <div className="w-10 h-10 rounded-full bg-red-100 text-red-500 flex items-center justify-center shrink-0"><FiAlertTriangle size={20} /></div>;
    }
    if (lowerTitle.includes("xp") || lowerTitle.includes("level")) {
      return <div className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-500 flex items-center justify-center shrink-0"><FiStar size={20} /></div>;
    }
    if (lowerTitle.includes("laporan") || lowerTitle.includes("terverifikasi")) {
      return <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center shrink-0"><FiCheckCircle size={20} /></div>;
    }
    return <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-500 flex items-center justify-center shrink-0"><FiInfo size={20} /></div>;
  };

  return (
    <div className="flex-1 w-full bg-[#fbf9f7] min-h-screen font-sans flex flex-col relative animate-fadeIn pb-32">
      
      {/* HEADER */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md px-6 py-5 flex items-center gap-4 border-b border-gray-100 shadow-sm shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-gray-600 border border-gray-100">
          <FiArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-black text-gray-800 tracking-tight">Kotak Masuk</h1>
      </div>

      <div className="px-6 py-8 max-w-2xl mx-auto w-full flex flex-col gap-4">
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-[#C18A5E] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 font-bold animate-pulse">Mengambil surat...</p>
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((notif) => (
            <div 
              key={notif.id} 
              onClick={() => handleMarkAsRead(notif.id, notif.is_read)}
              className={`relative p-5 rounded-3xl transition-all cursor-pointer border ${
                notif.is_read 
                  ? "bg-white border-gray-100 shadow-sm opacity-70 hover:opacity-100" 
                  : "bg-white border-[#E3CBB8] shadow-md hover:shadow-lg hover:-translate-y-0.5"
              }`}
            >
              {/* Indikator Belum Dibaca */}
              {!notif.is_read && (
                <div className="absolute top-5 right-5 w-3 h-3 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse"></div>
              )}

              <div className="flex items-start gap-4">
                {getIcon(notif.title)}
                <div className="flex flex-col flex-1 pr-6">
                  <h3 className={`text-base ${notif.is_read ? 'font-bold text-gray-700' : 'font-black text-gray-900'} leading-snug`}>
                    {notif.title}
                  </h3>
                  <p className={`text-sm mt-1 ${notif.is_read ? 'text-gray-500 font-medium' : 'text-gray-700 font-bold'} leading-relaxed`}>
                    {notif.message}
                  </p>
                  <span className="text-[11px] font-bold text-gray-400 mt-3 uppercase tracking-wider">
                    {timeAgo(notif.created_at)}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-300 mb-6">
              <FiBell size={40} />
            </div>
            <h3 className="text-xl font-black text-gray-800">Sepi sekali...</h3>
            <p className="text-gray-500 font-medium mt-2 max-w-[250px]">
              Belum ada pesan atau notifikasi masuk untukmu saat ini.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default Notifications;