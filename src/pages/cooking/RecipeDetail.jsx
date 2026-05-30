import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useOutletContext, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";
import axios from "axios";

import {
  FiArrowLeft,
  FiClock,
  FiUser,
  FiCheckCircle,
  FiChevronRight,
  FiCamera,
  FiX,
  FiCheck,
  FiArrowRight,
} from "react-icons/fi";
import ImageWithFallback from "../../components/ImageWithFallback";

const RecipeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // 👈 Tangkap lokasi saat ini

  // Ekstrak data AI dari state (jika user datang dari halaman Prepare)
  const [aiState, setAiState] = useState(() => {
    const cachedAi = sessionStorage.getItem(`youri_ai_recipe_${id}`);
    return cachedAi ? JSON.parse(cachedAi) : (location.state?.aiData || null);
  });
  const [isPollingAI, setIsPollingAI] = useState(false);

  const { userData } = useOutletContext();
  const isActiveSession = userData?.active_cooking_session === id;

  const [recipe, setRecipe] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [finishData, setFinishData] = useState(null);

  const [proofImage, setProofImage] = useState(null);
  const wakeLockRef = useRef(null);

  useEffect(() => {
    if (aiState) {
      sessionStorage.setItem(`youri_ai_recipe_${id}`, JSON.stringify(aiState));
    } else {
      //Jika aiState dikosongkan (null), SAPU BERSIH storage-nya!
      sessionStorage.removeItem(`youri_ai_recipe_${id}`);
    }
  }, [aiState, id]);

  useEffect(() => {
    const fetchRecipeDetail = async () => {
      try {
        const response = await api.get(`/cooking/${id}`);
        setRecipe(response.data.data);
      } catch (error) {
        console.error("Fetch Recipe Error:", error);
        toast.error(error.response?.data?.message || "Gagal memuat resep.");
        navigate(-1);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecipeDetail();
  }, [id, navigate]);

  useEffect(() => {
    const requestWakeLock = async () => {
      if (isActiveSession && "wakeLock" in navigator) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request("screen");
          console.log("WakeLock Aktif! Layar aman terkendali.");
        } catch (err) {
          console.warn(`WakeLock Error: ${err.name}, ${err.message}`);
        }
      }
    };
    requestWakeLock();

    return () => {
      if (wakeLockRef.current !== null) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };
  }, [isActiveSession]);

  useEffect(() => {
    // Jika masuk secara normal (bukan dari flow AI compare) dan sedang tidak dalam sesi masak aktif
    if (!location.state?.aiData && !isActiveSession) {
      sessionStorage.removeItem(`youri_ai_recipe_${id}`);
      setAiState(null); // Reset juga state lokalnya biar bersih!
    }
  }, [location.state, isActiveSession, id]);

  // ==========================================
  //  POLLING 
  // ==========================================
  useEffect(() => {
    let interval;
    
    // Jika ada ai_task_id DAN belum ada data substitutions (artinya masih proses)
    if (aiState?.ai_task_id && !aiState.substitutions) {
      setIsPollingAI(true);
      
      interval = setInterval(async () => {
        try {
          const res = await api.get(`/cooking/ai-result/${aiState.ai_task_id}`);
          const taskData = res.data.data;
          
          if (taskData.status === "completed") {
            setIsPollingAI(false);
            clearInterval(interval); // Matikan timer!
            
            // 🌸 Update State dengan jawaban akhir dari AI Golang!
            setAiState(prev => ({
              ...prev,
              character: {
                ...prev.character, // Pertahankan gambar maskot thinking/happy
                dialog: taskData.result.character.dialog,
                status: taskData.result.character.status
              },
              substitutions: taskData.result.substitutions_mapping || []
            }));
          }
        } catch (error) {
          console.error("Polling AI Error:", error);
          setIsPollingAI(false);
          clearInterval(interval); // Matikan timer jika terjadi error (404/503)
        }
      }, 3000); // Polling setiap 3 detik
    }

    // Bersihkan timer saat user pindah halaman sebelum AI selesai
    return () => clearInterval(interval);
  }, [aiState?.ai_task_id, aiState?.substitutions]);

  const handleStartCooking = async () => {
    setIsStartModalOpen(false);
    const toastId = toast.loading("Membuka sesi memasak...");
    try {
      await api.post("/cooking/start", { recipe_id: id });
      toast.success("Sesi dimulai! Semangat masaknya!", { id: toastId });
      window.location.reload();
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal memulai sesi", {
        id: toastId,
      });
    }
  };

  const handleCancelCooking = async () => {
    setIsCancelModalOpen(false);
    const toastId = toast.loading("Membatalkan sesi...");
    try {
      await api.post("/cooking/cancel");
      setAiState(null); 
      sessionStorage.removeItem(`youri_ai_recipe_${id}`);
      toast.success("Sesi dibatalkan. Jangan menyerah di resep lain ya!", {
        id: toastId,
      });
      navigate(location.pathname, { replace: true, state: {} });

      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      toast.error("Gagal membatalkan sesi", { id: toastId });
      console.error("Cancel Cooking Error:", error);
    }
  };

  const handleFinishCooking = async () => {
    if (!proofImage) {
      return toast.error("Foto dulu dong hasil masakanmu buat bukti!");
    }
    const toastId = toast.loading("Merekam mahakaryamu...");
    setIsProcessing(true);

    try {
      const sigResponse = await api.get("/cooking/proof-upload-signature");
      const { signature, timestamp, api_key, cloud_name, folder } =
        sigResponse.data.data;

      const formData = new FormData();
      formData.append("file", proofImage);
      formData.append("api_key", api_key);
      formData.append("timestamp", timestamp);
      formData.append("signature", signature);
      formData.append("folder", folder);

      const uploadRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
        formData,
      );
      const proofImageUrl = uploadRes.data.secure_url;

      const finishRes = await api.post("/cooking/finish", {
        recipe_id: id,
        proof_image_url: proofImageUrl,
      });

      toast.success("Selesai! XP sudah menunggumu!", { id: toastId });
      setFinishData(finishRes.data.data);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Gagal mengakhiri sesi.", {
        id: toastId,
      });
    } finally {
      setIsProcessing(false);
      setIsFinishModalOpen(false);
    }
  };

  const handleCloseCongrats = async () => {
    if (finishData.gamification?.is_level_up) {
      try {
        await api.patch("/user/acknowledge-levelup");
      } catch (error) {
        console.error("Gagal melakukan acknowledge level up:", error);
      }
    }
    navigate("/dashboard");
    setTimeout(() => window.location.reload(), 300);
  };

  if (isLoading || !recipe) {
    return (
      <div className="min-h-screen bg-[#fbf9f7] flex flex-col justify-center items-center">
        <div className="w-16 h-16 border-4 border-[#E3CBB8] border-t-[#C18A5E] rounded-full animate-spin"></div>
        <p className="mt-4 font-bold text-[#C18A5E] animate-pulse">
          Memuat Resep Rahasia...
        </p>
      </div>
    );
  }

  return (
    <div className={`flex-1 w-full flex flex-col animate-fadeIn font-sans ${isActiveSession ? "bg-gray-900 text-gray-100" : "bg-[#fbf9f7] text-gray-800"}`}>
      
      {/* HEADER GAMBAR */}
      <div className="relative w-full h-72 md:h-96 bg-gray-200 shadow-sm overflow-hidden shrink-0">
        <ImageWithFallback src={recipe.image_url} fallbackText={recipe.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70"></div>

        {!isActiveSession && (
          <button 
            onClick={() => {!
              sessionStorage.removeItem(`youri_ai_recipe_${id}`);
              navigate(-1);
            }} 
            className="absolute top-6 left-6 p-3 bg-white/20 backdrop-blur-md hover:bg-white text-white hover:text-[#C18A5E] rounded-2xl transition-all shadow-sm z-10"
          >
            <FiArrowLeft size={24} />
          </button>
        )}

        <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-2.5 z-20">
          <div className="flex flex-wrap items-center gap-2">
            {isActiveSession && (
              <span className="bg-red-500 text-white text-[10px] md:text-xs font-black px-3 py-1.5 rounded-full shadow-md animate-pulse border border-red-300">
                🔥 SESI MASAK AKTIF
              </span>
            )}

            {recipe.categories?.length > 0 ? (
              recipe.categories.map((cat, i) => (
                <span key={i} className="bg-[#C18A5E] text-white text-[10px] md:text-xs font-black px-3 py-1.5 rounded-full shadow-md uppercase">
                  {cat}
                </span>
              ))
            ) : (
              <span className="bg-gray-800/60 backdrop-blur-sm text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-md uppercase">
                Uncategorized
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white leading-tight drop-shadow-lg">
            {recipe.title}
          </h1>
        </div>
      </div>

      {/* KONTEN DETAIL */}
      <div className="px-6 md:px-12 -mt-4 relative z-10 flex-1 pb-10">
        
        {/* Card Info Singkat */}
        <div className={`${isActiveSession ? "bg-gray-800 border-gray-700" : "bg-white border-gray-50"} rounded-3xl p-5 shadow-lg border flex justify-around items-center mb-8`}>
          <div className="flex flex-col items-center gap-1">
            <div className={`w-10 h-10 rounded-full flex justify-center items-center ${isActiveSession ? "bg-orange-500/20 text-orange-400" : "bg-orange-50 text-[#C18A5E]"}`}>
              <FiClock size={20} />
            </div>
            <span className="text-[10px] text-gray-400 font-bold uppercase mt-1">Waktu</span>
            <span className={`text-sm font-black ${isActiveSession ? "text-gray-200" : "text-gray-800"}`}>{recipe.cook_time_mins} Menit</span>
          </div>

          <div className={`w-px h-12 ${isActiveSession ? "bg-gray-700" : "bg-gray-100"}`}></div>

          <div className="flex flex-col items-center gap-1">
            <div className={`w-10 h-10 rounded-full flex justify-center items-center ${isActiveSession ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-50 text-indigo-400"}`}>
              <FiUser size={20} />
            </div>
            <span className="text-[10px] text-gray-400 font-bold uppercase mt-1">Koki</span>
            <span className={`text-sm font-black line-clamp-1 ${isActiveSession ? "text-gray-200" : "text-gray-800"}`}>{recipe.author_name}</span>
          </div>
        </div>

        {recipe.description && (
          <p className={`${isActiveSession ? "bg-gray-800 text-gray-300 border-gray-700" : "bg-white text-gray-600 border-gray-50"} font-medium leading-relaxed mb-8 p-5 rounded-3xl shadow-sm border`}>
            "{recipe.description}"
          </p>
        )}

        {/* ==========================================
            HIGHLIGHT PERSENTASE & CHAT BUBBLE AI
            ========================================== */}

        {aiState && (
          <div className="flex flex-col gap-3 mb-8 animate-fadeIn">
            
            {/* Banner Persentase */}
            {aiState.recipe?.match_percentage && (
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-4 rounded-3xl shadow-[0_8px_20px_rgba(16,185,129,0.2)] flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100">Analisis Kecocokan</span>
                  <span className="font-black text-sm md:text-base tracking-tight">Bahan di dapurmu sangat mendukung!</span>
                </div>
                <div className="text-right">
                  <span className="text-3xl md:text-4xl font-black tracking-tight">{aiState.recipe.match_percentage}%</span>
                </div>
              </div>
            )}

            {/* Bubble Obrolan Youri */}
            {aiState.character && (
              <div className="bg-indigo-50 border border-indigo-100 p-5 md:p-6 rounded-3xl shadow-sm flex gap-4 md:gap-6 items-start transition-all duration-500">
                
                {/* Maskot (Bounce saat polling) */}
                <div className={`w-16 h-16 md:w-20 md:h-20 shrink-0 bg-white rounded-full border-2 border-indigo-200 shadow-md flex items-center justify-center overflow-hidden z-10 ${isPollingAI ? 'animate-bounce' : ''}`}>
                  <ImageWithFallback src={aiState.character.sprite} fallbackText="Youri" className="w-12 h-12 md:w-14 md:h-14 object-contain mt-2" />
                </div>
                
                <div className="relative bg-white border border-gray-100 p-5 md:p-6 rounded-3xl rounded-tl-none shadow-sm flex-1">
                  <div className="absolute top-0 -left-2.5 w-4 h-4 bg-white border-t border-l border-gray-100 transform -skew-x-12"></div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-black text-indigo-500 text-sm">Youri</h4>
                    {isPollingAI && <span className="flex gap-1"><span className="w-1.5 h-1.5 bg-indigo-300 rounded-full animate-ping"></span><span className="w-1.5 h-1.5 bg-indigo-300 rounded-full animate-ping delay-75"></span><span className="w-1.5 h-1.5 bg-indigo-300 rounded-full animate-ping delay-150"></span></span>}
                  </div>
                  
                  <p className="text-sm md:text-base font-bold text-gray-700 leading-relaxed">
                    {aiState.character.dialog}
                  </p>

                  {/* 🌸 Hasil Polling: Daftar Substitusi Bahan */}
                  {aiState.substitutions?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-indigo-50/50 animate-fadeIn">
                      <p className="text-[10px] md:text-xs font-black text-indigo-400 mb-2 uppercase tracking-widest">Ide Substitusi Youri:</p>
                      <ul className="text-xs md:text-sm font-medium text-gray-600 list-none space-y-2">
                        {aiState.substitutions.map((sub, idx) => (
                          <li key={idx} className="flex items-center gap-2 bg-indigo-50/30 p-2 rounded-xl">
                            <FiCheckCircle className="text-emerald-500 shrink-0" />
                            <span className="text-red-400 line-through decoration-2 font-bold">{sub.missing_item.name}</span>
                            <FiArrowRight className="text-gray-400 shrink-0" />
                            <span className="font-bold text-[#10b981]">{sub.replaced_with.name}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Section Bahan */}
          <div className="flex flex-col gap-4">
            <h3 className={`text-xl font-black flex items-center gap-2 ${isActiveSession ? "text-gray-100" : "text-gray-800"}`}>
              <div className="w-2 h-6 bg-[#C18A5E] rounded-full"></div> Bahan-bahan
            </h3>
            <div className={`${isActiveSession ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"} rounded-3xl p-6 shadow-sm border flex flex-col gap-3`}>
              {recipe.ingredients?.length > 0 ? (
                recipe.ingredients.map((ing, index) => (
                  <div key={index} className={`flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0 ${isActiveSession ? "border-gray-700" : "border-gray-50"}`}>
                    <FiCheckCircle className="text-[#C18A5E] mt-0.5 shrink-0" size={18} />
                    <span className={`${isActiveSession ? "text-gray-300" : "text-gray-700"} font-medium leading-snug`}>{ing}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 italic">Bahan tidak tersedia.</p>
              )}
            </div>
          </div>

          {/* Section Langkah-langkah */}
          <div className="flex flex-col gap-4">
            <h3 className={`text-xl font-black flex items-center gap-2 ${isActiveSession ? "text-gray-100" : "text-gray-800"}`}>
              <div className="w-2 h-6 bg-indigo-400 rounded-full"></div> Langkah Masak
            </h3>
            <div className={`${isActiveSession ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"} rounded-3xl p-6 shadow-sm border flex flex-col gap-5`}>
              {recipe.steps?.length > 0 ? (
                recipe.steps.map((step, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <div className={`w-8 h-8 shrink-0 font-black rounded-xl flex items-center justify-center shadow-inner ${isActiveSession ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-50 text-indigo-500"}`}>
                      {index + 1}
                    </div>
                    <p className={`${isActiveSession ? "text-gray-300" : "text-gray-700"} font-medium leading-relaxed pt-1`}>{step}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 italic">Langkah masak belum ditulis.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================
          STICKY BOTTOM NAVIGATION (TRANSFORMER BUTTON)
          ========================================== */}
      <div className={`sticky bottom-0 w-full backdrop-blur-md border-t p-4 md:p-6 z-40 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.15)] ${isActiveSession ? "bg-gray-900/95 border-gray-800" : "bg-white/95 border-gray-100"}`}>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-center gap-3">
          {!isActiveSession ? (
            //  Jika sudah ada aiData, ubah tombolnya agar langsung masak (Bypass modal)
            aiState ? (
              <button
                onClick={handleStartCooking} 
                disabled={isPollingAI || aiState.character?.status === "fail"} // Disable kalau masih loading ATAU kalau AI nyerah (skenario 1)
                className="w-full md:w-96 bg-gradient-to-r from-indigo-500 to-indigo-400 hover:from-indigo-400 hover:to-indigo-300 text-white py-4 rounded-2xl font-black text-lg shadow-[0_10px_20px_rgba(99,102,241,0.3)] hover:shadow-lg transition-all active:scale-95 flex justify-center items-center gap-2 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed"
              >
                {isPollingAI ? "Menunggu Youri..." : "Ayo Mulai Memasak!"} <FiChevronRight size={22} />
              </button>
            ) : (
              // Tombol Default (Buka Modal Tanya Bahan Sisa)
              <button
                onClick={() => setIsStartModalOpen(true)}
                className="w-full md:w-96 bg-[#10b981] hover:bg-[#059669] text-white py-4 rounded-2xl font-black text-lg shadow-[0_10px_20px_rgba(16,185,129,0.3)] hover:shadow-lg transition-all active:scale-95 flex justify-center items-center gap-2"
              >
                Mulai Masak! <FiChevronRight size={22} />
              </button>
            )
          ) : (
            // MODE AKTIF: Tombol Selesai & Batal
            <>
              <button onClick={() => setIsFinishModalOpen(true)} className="w-full md:w-80 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-gray-900 py-4 rounded-2xl font-black text-lg shadow-[0_10px_25px_rgba(16,185,129,0.2)] transition-all active:scale-95 flex justify-center items-center gap-3">
                <FiCheck strokeWidth={3} size={24} /> Selesai Memasak!
              </button>
              <button onClick={() => setIsCancelModalOpen(true)} className="w-full md:w-auto bg-gray-800 text-red-400 hover:bg-red-500/20 hover:text-red-300 border border-gray-700 py-4 px-8 rounded-2xl font-bold transition-all">
                Batalkan Sesi
              </button>
            </>
          )}
        </div>
      </div>

      {/* SISA MODAL (Start, Finish, Cancel, Congrats) TETAP SAMA SEPERTI SEBELUMNYA */}
      {/* ==========================================
          MODAL 1: KONFIRMASI MULAI (AI SUBSTITUSI)
          ========================================== */}
      {isStartModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative flex flex-col">
            <h2 className="text-2xl font-black text-gray-800 mb-3 text-center">Persiapan Memasak</h2>
            <p className="text-sm text-gray-500 font-medium text-center mb-8 leading-relaxed">
              Punya bahan yang kurang? Biar AI Youri bantu carikan <span className="font-bold text-[#C18A5E]">bahan pengganti</span> dari sisa dapurmu!
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={() => { setIsStartModalOpen(false); navigate(`/cooking/recipe/${id}/compare`); }} className="w-full py-4 rounded-2xl font-black text-white bg-[#C18A5E] hover:bg-[#a6744d] shadow-[0_8px_20px_rgba(193,138,94,0.3)] transition-all active:scale-95">
                Cari Bahan Pengganti
              </button>
              <button onClick={handleStartCooking} className="w-full py-4 rounded-2xl font-black text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all">
                Lewati & Langsung Masak
              </button>
              <button onClick={() => setIsStartModalOpen(false)} className="w-full py-2 mt-2 text-sm font-bold text-gray-400 hover:text-gray-600">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {isFinishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-gray-800 w-full max-w-sm rounded-[32px] p-8 shadow-2xl border border-gray-700 relative flex flex-col">
            <button onClick={() => setIsFinishModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white"><FiX size={24} /></button>
            <h2 className="text-2xl font-black text-white mb-2 text-center mt-2">Masakan Selesai!</h2>
            <p className="text-sm text-gray-400 font-medium text-center mb-6 leading-relaxed">
              Satu langkah lagi! Ambil foto mahakaryamu untuk mengklaim <span className="font-bold text-yellow-400">Bonus XP</span> dari bahan yang diselamatkan!
            </p>
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-600 hover:border-[#C18A5E] bg-gray-900 rounded-3xl cursor-pointer transition-colors overflow-hidden relative mb-6">
              {proofImage ? (
                <>
                  <img src={URL.createObjectURL(proofImage)} alt="Bukti" className="w-full h-full object-cover opacity-60" />
                  <div className="absolute flex items-center gap-2 text-white font-bold bg-black/60 px-4 py-2 rounded-full backdrop-blur-sm"><FiCheckCircle className="text-emerald-400" /> Foto Siap!</div>
                </>
              ) : (
                <div className="flex flex-col items-center text-gray-400 px-4 text-center">
                  <div className="w-14 h-14 bg-gray-800 rounded-full flex items-center justify-center mb-3 text-gray-300 shadow-inner"><FiCamera size={24} /></div>
                  <span className="text-sm font-bold text-gray-300">Tap untuk Ambil Foto</span>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setProofImage(e.target.files[0])} />
            </label>
            <button disabled={isProcessing} onClick={handleFinishCooking} className="w-full py-4 rounded-2xl font-black text-gray-900 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 shadow-[0_8px_20px_rgba(16,185,129,0.3)] transition-all active:scale-95 disabled:opacity-50">
              {isProcessing ? "Merekam ke Server..." : "Submit Foto & Selesai!"}
            </button>
          </div>
        </div>
      )}

      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-gray-800 w-full max-w-sm rounded-[32px] p-8 shadow-2xl border border-gray-700 relative flex flex-col">
            <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30 shadow-inner"><FiX size={32} /></div>
            <h2 className="text-2xl font-black text-white mb-2 text-center">Menyerah?</h2>
            <p className="text-sm text-gray-400 font-medium text-center mb-8 leading-relaxed">
              Yakin ingin membatalkan masakan ini? Kamu <span className="font-bold text-red-400">tidak akan</span> mendapatkan reward apapun.
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={handleCancelCooking} className="w-full py-4 rounded-2xl font-black text-white bg-red-500 hover:bg-red-600 shadow-[0_8px_20px_rgba(239,68,68,0.3)] transition-all active:scale-95">Ya, Batalkan Sesi</button>
              <button onClick={() => setIsCancelModalOpen(false)} className="w-full py-4 rounded-2xl font-black text-gray-300 bg-gray-700 hover:bg-gray-600 border border-gray-600 transition-all">Tidak, Lanjut Masak!</button>
            </div>
          </div>
        </div>
      )}

      {finishData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-md animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl relative flex flex-col items-center text-center overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-yellow-300/30 to-transparent pointer-events-none"></div>
            {finishData.happy_sprite && (
              <div className="w-32 h-32 mb-2 relative z-10 animate-bounce">
                <ImageWithFallback src={finishData.happy_sprite} fallbackText="Youri Happy" className="w-full h-full object-contain drop-shadow-2xl" />
              </div>
            )}
            {finishData.gamification?.is_level_up ? (
              <div className="mb-2">
                <span className="text-yellow-500 font-black tracking-widest text-sm uppercase animate-pulse">✨ Selamat! ✨</span>
                <h2 className="text-3xl font-black text-gray-800">LEVEL UP!</h2>
              </div>
            ) : (
              <h2 className="text-2xl font-black text-gray-800 mb-2">Kerja Bagus!</h2>
            )}
            <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6">
              Masakanmu berhasil diselesaikan. Bukti fotomu sudah tercatat di buku resep Youri!
            </p>
            <div className="w-full bg-gray-50 border border-gray-100 rounded-3xl p-5 mb-8 shadow-sm">
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-black text-gray-400 uppercase tracking-wider">Level {finishData.gamification?.level}</span>
                <span className="text-lg font-black text-[#10b981]">+{finishData.gamification?.exp_earned} XP</span>
              </div>
              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner relative">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-[#10b981] rounded-full transition-all duration-1000 ease-out" style={{ width: `${(finishData.gamification?.current_xp / finishData.gamification?.next_xp) * 100}%` }}></div>
              </div>
              <div className="text-right mt-1.5">
                <span className="text-[10px] font-bold text-gray-400">{finishData.gamification?.current_xp} / {finishData.gamification?.next_xp} XP</span>
              </div>
            </div>
            <button onClick={handleCloseCongrats} className="w-full py-4 rounded-2xl font-black text-white bg-[#C18A5E] hover:bg-[#a6744d] shadow-[0_8px_20px_rgba(193,138,94,0.3)] transition-all active:scale-95 text-lg">
              Lanjutkan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeDetail;