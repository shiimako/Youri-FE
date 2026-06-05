import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";

import { FiArrowLeft, FiPlus, FiX, FiSearch } from "react-icons/fi";

const InputSubstituteIngredients = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  //  State untuk Autocomplete Bahan dari Database
  const [ingredientOptions, setIngredientOptions] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [userIngredients, setUserIngredients] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  useEffect(() => {
    const fetchInitialMetadata = async () => {
      try {
        const ingRes = await api.get("/ingredients");
        setIngredientOptions(ingRes.data.data);
      } catch (error) {
        console.error("Fetch Metadata Error:", error);
      } 
    };
    fetchInitialMetadata();
  }, []);

  // 🌸 YUKI'S MAGIC 2: Debounced Server-Side Search!
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (inputValue.trim() !== "") {
        try {
          const res = await api.get(`/ingredients?search=${inputValue}`);
          setIngredientOptions(res.data.data);
        } catch (error) { 
          console.error(error); 
        }
      }
    }, 300); // Tunggu 300ms setelah Senpai ngetik baru tembak API
    return () => clearTimeout(delayDebounce); // Bersihkan timer
  }, [inputValue]);

  const exactIngMatch = ingredientOptions.some(opt => opt.name.toLowerCase() === inputValue.toLowerCase());

  const handleSelectIngredient = (ingredientItem, isCustom = false) => {
  if (userIngredients.some(ing => ing.name.toLowerCase() === ingredientItem.name.toLowerCase())) {
    toast.error("Bahan ini sudah ada di keranjangmu!");
  } else {
    // Kita buat is_valid menjadi dinamis seperti fungsi pertama!
    setUserIngredients([...userIngredients, { 
       ...ingredientItem, // Ambil semua data dari API (termasuk ID jika ada)
       name: ingredientItem.name, 
       is_valid: !isCustom 
    }]);
  }
  setInputValue("");
  setShowDropdown(false);
};

  const handleAddIngredient = (e) => {
    e.preventDefault();
    const typedValue = inputValue.trim();
    if (!typedValue) return;

    // 1. Cek apakah ketikan Senpai cocok dengan salah satu data dari API
    const matchedOption = ingredientOptions.find(
      opt => opt.name.toLowerCase() === typedValue.toLowerCase()
    );

    if (matchedOption) {
      handleSelectIngredient(matchedOption, false);
    } else {
      handleSelectIngredient({ name: typedValue }, true);
    }
  };

  const handleRemoveIngredient = (indexToRemove) => {
    setUserIngredients(userIngredients.filter((_, index) => index !== indexToRemove));
  };

  // ==========================================
  // HANDLER TEMBAK API AI (COMBO: MATCH -> PREPARE)
  // ==========================================
  const handleSubmitToAI = async () => {
    if (userIngredients.length === 0) {
      return toast.error("Masukkan minimal satu bahan yang kamu punya, Chef!");
    }

    setIsLoadingAI(true);
    const toastId = toast.loading("Menganalisis kecocokan bahanmu...");

    try {
      // 💥 HIT 1: Tembak endpoint MATCH untuk dapatkan Match Percentage
      const matchResponse = await api.post("/cooking/match", {
        recipe_id: id, // Parameter khusus mode "Compare"
        ingredients: userIngredients
      });

      // Ekstrak persentase (Cari data yang ID-nya sama dengan resep saat ini)
      // Jika AI Golang tidak mengembalikan persentase, kita set default ke 100 atau 0
      const matchDataArray = matchResponse.data.data;
      const matchedRecipe = matchDataArray.find(r => r.id === id);
      const matchPercentage = matchedRecipe ? matchedRecipe.match_percentage : 0;

      // Update loading text biar user tahu prosesnya jalan terus
      toast.loading("Youri sedang menyiapkan resep...", { id: toastId });

      // 💥 HIT 2: Tembak endpoint PREPARE dengan membawa match_percentage
      const prepareResponse = await api.post("/cooking/preparing", {
        recipe_id: id,
        ingredients: userIngredients,
        match_percentage: matchPercentage //  Persentase hasil Hit 1 dimasukkan ke sini!
      });

      toast.success("Youri mencoba mencari pengggantian bahan...", { id: toastId });
      
      // 🚀 REDIRECT: Bawa ransel data AI kembali ke halaman Detail Resep!
      navigate(`/cooking/recipe/${id}`, { 
        state: { aiData: prepareResponse.data.data }, 
        replace: true 
      });

    } catch (error) {
      console.error("AI Combo Error:", error);
      toast.error(
        error.response?.data?.message || "Waduh, otak Youri nge-blank! Coba lagi ya.", 
        { id: toastId }
      );
      setIsLoadingAI(false); // Matikan loading hanya jika error (karena kalau sukses, layarnya pindah)
    }
  };

  return (
    <div className="flex-1 w-full bg-[#fbf9f7] min-h-screen font-sans flex flex-col relative animate-fadeIn pb-32">
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md px-6 py-5 flex items-center gap-4 border-b border-gray-100 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-gray-600">
          <FiArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-black text-gray-800 tracking-tight">Sihir Bahan Sisa</h1>
      </div>

      <div className="px-6 py-8 max-w-2xl mx-auto w-full flex flex-col gap-8">
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-black text-[#C18A5E] mb-2">Punya Bahan Apa Saja?</h2>
          <p className="text-sm text-gray-500 font-medium">
            Masukkan bahan-bahan nganggur di dapurmu. Youri akan mencarikan cara agar bahan itu bisa menggantikan bahan resep yang kurang!
          </p>
        </div>

        <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4">
          
          <div className="relative">
            <form onSubmit={handleAddIngredient} className="relative flex items-center">
              <FiSearch className="absolute left-4 text-gray-400" size={20} />
              <input 
                type="text" value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                placeholder="Cari atau ketik bahan..." 
                className="w-full pl-12 pr-14 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-[#C18A5E] focus:ring-4 focus:ring-[#C18A5E]/10 transition-all"
              />
              <button type="submit" disabled={!inputValue.trim()} className="absolute right-2 p-2.5 bg-[#C18A5E] text-white rounded-xl hover:bg-[#a6744d] disabled:opacity-50 transition-colors shadow-sm">
                <FiPlus size={20} />
              </button>
            </form>

            {/* Dropdown Autocomplete */}
            {showDropdown && inputValue && (
              <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-50 flex flex-col max-h-60 overflow-y-auto">
                {ingredientOptions.map(opt => (
                  <div key={opt.ingredient_id} onClick={() => handleSelectIngredient(opt.name)} className="px-5 py-3 hover:bg-gray-50 cursor-pointer text-sm font-medium border-b border-gray-50">
                    {opt.name}
                  </div>
                ))}
                {!exactIngMatch && (
                  <div onClick={() => handleSelectIngredient(inputValue)} className="px-5 py-3 bg-[#E3CBB8]/10 hover:bg-[#E3CBB8]/30 cursor-pointer text-sm font-black text-[#C18A5E] flex items-center justify-between mt-auto">
                    <span>Gunakan bahan kustom: "{inputValue}"</span>
                    <span className="bg-[#C18A5E] text-white text-[10px] px-2 py-1 rounded-md">Pilih</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 min-h-[60px] p-4 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            {userIngredients.length > 0 ? (
              userIngredients.map((ing, idx) => (
                <div key={idx} className="bg-white border border-[#E3CBB8] text-[#C18A5E] px-4 py-2 rounded-full text-xs font-black flex items-center gap-2 shadow-sm animate-fadeIn">
                  {ing.name}
                  <button type="button" onClick={() => handleRemoveIngredient(idx)} className="text-gray-400 hover:text-red-500 transition-colors ml-1"><FiX size={14} /></button>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 font-bold italic w-full text-center mt-2">Keranjang sihir masih kosong...</p>
            )}
          </div>
        </div>

        <button 
          onClick={handleSubmitToAI}
          disabled={userIngredients.length === 0 || isLoadingAI}
          className="w-full py-4 rounded-2xl font-black text-white bg-gray-800 hover:bg-gray-700 shadow-lg transition-all active:scale-95 disabled:opacity-50 mt-4"
        >
          {isLoadingAI ? "Menghubungi Youri..." : "Tanya Youri Sekarang!"}
        </button>

      </div>
    </div>
  );
};

export default InputSubstituteIngredients;