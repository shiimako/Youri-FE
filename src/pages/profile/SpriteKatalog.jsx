import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { FiArrowLeft, FiLock, FiCheck, FiChevronLeft, FiChevronRight, FiXCircle} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import ImageWithFallback from '../../components/ImageWithFallback';

const SpriteKatalog = () => {
  const navigate = useNavigate();
  
  // ⚡ TANGKAP DATA LEVEL USER DARI MAIN LAYOUT (Tanpa Fetch Ulang!)
  const { userData } = useOutletContext(); 
  const userLevel = userData?.gamification_info?.level || 1;

  const [isLoading, setIsLoading] = useState(true);
  const [sprites, setSprites] = useState([]);
  
  // State Modal & Preview Carousel
  const [selectedSprite, setSelectedSprite] = useState(null);
  const [activeAssetIndex, setActiveAssetIndex] = useState(0);

  // Fetch HANYA data katalog maskot
  useEffect(() => {
    const fetchSprites = async () => {
      try {
        const spriteRes = await api.get('/user/sprites');
        setSprites(spriteRes.data.data);
      } catch (error) {
        toast.error("Gagal memuat katalog Youri.");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSprites();
  }, []);

  const handleEquip = async (pkgId) => {
    try {
      const toastId = toast.loading("Memasang kostum baru...");
      await api.post('/user/sprites', { package_id: pkgId });
      
      // Update State Lokal
      setSprites(prev => prev.map(s => ({...s, is_active: s.package_id === pkgId})));
      setSelectedSprite(null);
      toast.success("Tampilan Youri berhasil diubah!", { id: toastId });
      
      // Refresh halaman sedikit agar Layout utama mengupdate foto maskot
      setTimeout(() => window.location.reload(), 1000); 
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal mengganti kostum.");
    }
  };

  if (isLoading) {
    return (
      <div className="w-full py-20 flex justify-center">
        <p className="animate-pulse font-bold text-[#C18A5E]">Membuka Lemari Pakaian Youri...</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col p-6 md:p-12 gap-6 animate-fadeIn">
      
      {/* HEADER SECTION */}
      <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
        <button 
          onClick={() => navigate(-1)} 
          className="p-3 bg-gray-50 hover:bg-[#E3CBB8] hover:text-[#C18A5E] text-gray-400 rounded-2xl transition-all shadow-sm"
        >
          <FiArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tight flex items-center gap-3">
            Katalog Maskot
          </h1>
          <p className="text-xs md:text-sm text-gray-500 font-medium mt-1">Koleksi dan ganti tampilan Youri sesuai seleramu!</p>
        </div>
      </div>

      {/* GRID KATALOG */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {sprites.map((pkg) => {
          const isLocked = userLevel < pkg.unlock_at_level;
          
          return (
            <motion.div 
              key={pkg.package_id}
              whileTap={!isLocked ? { scale: 0.98 } : {}}
              onClick={() => {
  if (!isLocked) {
    setSelectedSprite(pkg);
    setActiveAssetIndex(0); 
  }
}}
              className={`relative p-6 rounded-[32px] border-2 transition-all overflow-hidden ${
                isLocked 
                  ? "bg-gray-50 border-gray-200 cursor-not-allowed opacity-80" 
                  : pkg.is_active 
                    ? "bg-[#C18A5E] border-[#C18A5E] shadow-[0_10px_25px_rgba(193,138,94,0.4)] cursor-pointer text-white" 
                    : "bg-white border-gray-100 shadow-sm hover:border-[#E3CBB8] cursor-pointer hover:shadow-lg"
              }`}
            >
              {/* Background Dekoratif untuk yang Aktif */}
              {pkg.is_active && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10 pointer-events-none" />
              )}

              <div className="flex items-center justify-between z-10 relative">
                <div>
                  <h3 className={`font-black text-lg md:text-xl leading-tight ${isLocked ? "text-gray-400" : pkg.is_active ? "text-white" : "text-gray-800"}`}>
                    {pkg.package_name}
                  </h3>
                  <div className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${
                    isLocked ? "bg-gray-200 text-gray-500" : pkg.is_active ? "bg-white/20 text-white" : "bg-[#E3CBB8]/30 text-[#C18A5E]"
                  }`}>
                    Lvl {pkg.unlock_at_level}
                  </div>
                </div>

                <div className="shrink-0 ml-4">
                  {isLocked ? (
                    <div className="w-14 h-14 rounded-2xl bg-gray-200 flex items-center justify-center shadow-inner">
                      <FiLock className="text-gray-400" size={24} />
                    </div>
                  ) : pkg.is_active ? (
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-inner">
                      <FiCheck className="text-white" size={28} />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center shadow-sm">
                      <ImageWithFallback src={pkg.assets?.badge} className="w-10 h-10 object-contain drop-shadow-sm" />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ==========================================
          MODAL PREVIEW (CAROUSEL 4 GAMBAR)
          ========================================== */}
      <AnimatePresence>
        {selectedSprite && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl relative overflow-hidden flex flex-col"
            >
              {/* Tombol Tutup */}
              <button 
                onClick={() => {setSelectedSprite(null); setActiveAssetIndex(0)}} 
                className="absolute top-6 right-6 p-2 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors z-20"
              >
                <FiXCircle size={24} />
              </button>
              
              <div className="mb-6 pr-10">
                <h2 className="text-2xl font-black text-gray-800 leading-tight">{selectedSprite.package_name}</h2>
                <p className="text-sm font-bold text-[#C18A5E] mt-1">Unlocked at Level {selectedSprite.unlock_at_level}</p>
              </div>

              {/* Showcase / Carousel Container */}
              {(() => {
                const assetEntries = Object.entries(selectedSprite.assets ?? {});
                const assetCount = assetEntries.length;
                const activeAssetKey = assetEntries[activeAssetIndex]?.[0] ?? "";
                const activeAssetSrc = assetEntries[activeAssetIndex]?.[1] ?? "";
                const previewLabel = activeAssetKey ? activeAssetKey.replace(/_/g, " ") : "preview";

                return (
                  <>
                    <div className="relative flex items-center justify-center mb-6 h-56 bg-[#fbf9f7] rounded-[32px] border-2 border-gray-100 shadow-inner">

                      {/* Tombol Kiri */}
                      <button 
                        onClick={() => setActiveAssetIndex(prev => (prev === 0 ? assetCount - 1 : prev - 1))}
                        disabled={assetCount <= 1}
                        className="absolute left-3 p-3 bg-white text-[#C18A5E] hover:bg-[#E3CBB8] hover:text-white rounded-full shadow-md z-10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <FiChevronLeft size={24} />
                      </button>

                      {/* Gambar Maskot */}
                      <div className="w-36 h-36 flex items-center justify-center">
                        <AnimatePresence mode='wait'>
                          <motion.div
                            key={activeAssetIndex}
                            initial={{ x: 30, opacity: 0, scale: 0.8 }}
                            animate={{ x: 0, opacity: 1, scale: 1 }}
                            exit={{ x: -30, opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="w-full h-full flex justify-center items-center"
                          >
                            <ImageWithFallback 
                              src={activeAssetSrc} 
                              className="w-full h-full object-contain drop-shadow-2xl"
                            />
                          </motion.div>
                        </AnimatePresence>
                      </div>

                      {/* Tombol Kanan */}
                      <button 
                        onClick={() => setActiveAssetIndex(prev => (prev === assetCount - 1 ? 0 : prev + 1))}
                        disabled={assetCount <= 1}
                        className="absolute right-3 p-3 bg-white text-[#C18A5E] hover:bg-[#E3CBB8] hover:text-white rounded-full shadow-md z-10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <FiChevronRight size={24} />
                      </button>
                    </div>

                    {/* Indikator Carousel & Label */}
                    <div className="flex flex-col items-center gap-4 mb-8">
                      <div className="flex gap-2">
                        {assetEntries.map(([key], i) => (
                          <div
                            key={key || i}
                            className={`h-2.5 rounded-full transition-all duration-300 ${activeAssetIndex === i ? "w-8 bg-[#C18A5E]" : "w-2.5 bg-gray-200"}`}
                          />
                        ))}
                      </div>
                      <div className="px-4 py-1.5 bg-gray-100 rounded-full">
                        <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">
                          Preview: {previewLabel}
                        </p>
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* Action Button */}
              <button 
                disabled={selectedSprite.is_active}
                onClick={() => handleEquip(selectedSprite.package_id)}
                className={`w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2
                  ${selectedSprite.is_active 
                    ? "bg-emerald-50 text-emerald-500 cursor-default border-2 border-emerald-100" 
                    : "bg-[#C18A5E] text-white hover:bg-[#a6744d] shadow-[0_10px_20px_rgba(193,138,94,0.3)] active:scale-95"}`}
              >
                {selectedSprite.is_active ? <><FiCheck size={20} /> Sedang Dipakai</> : "Gunakan Kostum"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
    </div>
  );
};

export default SpriteKatalog;