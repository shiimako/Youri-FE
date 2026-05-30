import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";

import { 
  FiArrowLeft, FiSearch, FiClock, FiTarget, 
  FiCheckCircle, FiX, FiTag, FiPlus, FiTrash2, FiChevronRight, FiFilter 
} from "react-icons/fi";
import ImageWithFallback from "../../components/ImageWithFallback";
import YouriThinking from "../../assets/youri_sprites/loading.svg"; // Sesuaikan path jika beda

const MatchRecipe = () => {
  const navigate = useNavigate();

  // ==========================================
  // STATE: MASTER METADATA & UI CONTROL
  // ==========================================
  const [ingredientOptions, setIngredientOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [isMetadataLoading, setIsMetadataLoading] = useState(true);
  
  const [step, setStep] = useState(1); // 1: Form, 2: Loading AI, 3: Results

  // ==========================================
  // STATE: FORM PAYLOAD
  // ==========================================
  const [recipeName, setRecipeName] = useState("");
  const [timeOperator, setTimeOperator] = useState("under");
  const [timeValue, setTimeValue] = useState("");
  const [timeUnit, setTimeUnit] = useState("Menit");

  const [ownedIngredients, setOwnedIngredients] = useState([
    { ingredient_id: null, name: "", is_valid: false }
  ]);
  const [avoidedIngredients, setAvoidedIngredients] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const [matchedRecipes, setMatchedRecipes] = useState([]); // Hasil dari AI Match

  // ==========================================
  // STATE: DROPDOWN KONTROL (Dari Part 1)
  // ==========================================
  const [activeOwnedDropdown, setActiveOwnedDropdown] = useState(null);
  const [activeAvoidedDropdown, setActiveAvoidedDropdown] = useState(null);
  const [catSearch, setCatSearch] = useState("");
  const [showCatDropdown, setShowCatDropdown] = useState(false);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [ingRes, catRes] = await Promise.all([
          api.get("/ingredients"),
          api.get("/categories")
        ]);
        setIngredientOptions(ingRes.data.data);
        setCategoryOptions(catRes.data.data);
      } catch (error) {
        console.error("Fetch Metadata Error:", error);
      } finally {
        setIsMetadataLoading(false);
      }
    };
    fetchMetadata();
  }, []);

  // --- LOGIKA FORM (Sama seperti Part 1) ---
  const handleAddOwned = () => setOwnedIngredients([...ownedIngredients, { ingredient_id: null, name: "", is_valid: false }]);
  const handleRemoveOwned = (index) => setOwnedIngredients(ownedIngredients.filter((_, i) => i !== index));
  const handleOwnedChange = (index, value) => {
    const newArr = [...ownedIngredients];
    newArr[index].name = value;
    newArr[index].is_valid = false;
    newArr[index].ingredient_id = null;
    setOwnedIngredients(newArr);
  };
  const handleSelectOwned = (index, opt, isCustom) => {
    const newArr = [...ownedIngredients];
    newArr[index].name = opt.name;
    newArr[index].is_valid = !isCustom;
    newArr[index].ingredient_id = isCustom ? null : opt.ingredient_id;
    setOwnedIngredients(newArr);
    setActiveOwnedDropdown(null);
  };

  const handleAddAvoided = () => setAvoidedIngredients([...avoidedIngredients, { ingredient_id: null, name: "", is_valid: false }]);
  const handleRemoveAvoided = (index) => setAvoidedIngredients(avoidedIngredients.filter((_, i) => i !== index));
  const handleAvoidedChange = (index, value) => {
    const newArr = [...avoidedIngredients];
    newArr[index].name = value;
    newArr[index].ingredient_id = null;
    setAvoidedIngredients(newArr);
  };
  const handleSelectAvoided = (index, opt, isCustom) => {
    const newArr = [...avoidedIngredients];
    newArr[index].name = opt.name;
    newArr[index].ingredient_id = isCustom ? null : opt.ingredient_id;
    setAvoidedIngredients(newArr);
    setActiveAvoidedDropdown(null);
  };

  const filteredCategories = categoryOptions.filter(cat => cat.name.toLowerCase().includes(catSearch.toLowerCase()));
  const exactCatMatch = categoryOptions.some(cat => cat.name.toLowerCase() === catSearch.toLowerCase());

  const handleSelectCategory = (catName) => {
    if (!selectedCategories.includes(catName)) setSelectedCategories([...selectedCategories, catName]);
    setCatSearch(""); setShowCatDropdown(false);
  };
  const handleRemoveCategory = (catName) => setSelectedCategories(selectedCategories.filter(c => c !== catName));

  // ==========================================
  // ACTION: SUBMIT PENCARIAN (HIT MATCH API)
  // ==========================================
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    
    const cleanOwned = ownedIngredients.filter(i => i.name.trim() !== "");
    const cleanAvoided = avoidedIngredients.filter(i => i.name.trim() !== "");

    if (cleanOwned.length === 0 && !recipeName) {
      return toast.error("Masukkan minimal satu bahan atau nama resepnya, Chef!");
    }

    setStep(2); // Pindah ke Layar Loading AI

    try {
      let payloadTime = undefined;
      if (timeValue) {
         let t = parseInt(timeValue);
         if (timeUnit === "Jam") t *= 60;
         payloadTime = { time: t, scope: timeOperator };
      }

      const payload = {
        recipe_name: recipeName || undefined,
        ingredients: cleanOwned.map(i => ({ id: i.ingredient_id, name: i.name, is_valid: i.is_valid })),
        tools: [], // Kosong sesuai kesepakatan
        exclude_ingredients: cleanAvoided.length > 0 ? cleanAvoided.map(i => ({ id: i.ingredient_id, name: i.name })) : undefined,
        time: payloadTime,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined 
      };

      const matchRes = await api.post("/cooking/match", payload);
      setMatchedRecipes(matchRes.data.data || []);
      setStep(3); // Pindah ke Layar Hasil

    } catch (error) {
      console.error("AI Match Error:", error);
      toast.error(error.response?.data?.message || "Youri gagal menerawang resep. Coba lagi ya!");
      setStep(1); // Balik ke form jika error
    }
  };

  // ==========================================
  // ACTION: PILIH RESEP -> PREPARE -> ROUTE
  // ==========================================
  const handleSelectRecipe = async (recipeId, matchPercentage) => {
    const toastId = toast.loading("Mempersiapkan sihir substitusi...");
    
    try {
      // Ambil bahan bersih dari state Form tadi
      const cleanOwned = ownedIngredients.filter(i => i.name.trim() !== "");
      
      const payload = {
        recipe_id: recipeId,
        ingredients: cleanOwned.map(i => ({ id: i.ingredient_id, name: i.name })),
        match_percentage: matchPercentage
      };

      // Tembak Endpoint Prepare!
      const prepareRes = await api.post("/cooking/prepare", payload);

      toast.success("Resep siap dieksekusi!", { id: toastId });
      
      // 🚀 REDIRECT KE DETAIL RESEP DENGAN MEMBAWA RANSEL AI
      navigate(`/cooking/recipe/${recipeId}`, { 
        state: { aiData: prepareRes.data.data } 
      });

    } catch (error) {
      console.error("AI Prepare Error:", error);
      toast.error(error.response?.data?.message || "Gagal menyiapkan resep.", { id: toastId });
    }
  };

  return (
    <div className="flex-1 w-full bg-[#fbf9f7] min-h-screen font-sans flex flex-col relative animate-fadeIn pb-32 overflow-y-auto">
      
      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md px-6 py-5 flex items-center gap-4 border-b border-gray-100 shadow-sm shrink-0">
        <button 
          onClick={() => step === 3 ? setStep(1) : navigate(-1)} 
          className="p-2 -ml-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-gray-600 border border-gray-100"
        >
          <FiArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-black text-gray-800 tracking-tight">
          {step === 3 ? "Hasil Terawangan Youri" : "Cari Resep Pintar"}
        </h1>
      </div>

      <div className="px-6 py-8 max-w-3xl mx-auto w-full flex flex-col gap-8">
        
        {/* ==========================================
            LAYAR 1: FORM PENCARIAN (Dari Part 1)
            ========================================== */}
        {step === 1 && (
          <form onSubmit={handleSearchSubmit} className="flex flex-col gap-6 animate-fadeIn">
            
            {/* NAMA RESEP */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-black text-gray-700 tracking-wide flex items-center gap-2"><FiSearch className="text-[#C18A5E]"/> Nama Resep <span className="text-gray-400 font-medium">(Opsional)</span></label>
              <input type="text" value={recipeName} onChange={(e) => setRecipeName(e.target.value)} placeholder="Contoh: Opor Ayam..." className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-[#C18A5E] focus:ring-4 focus:ring-[#C18A5E]/10 transition-all shadow-sm" />
            </div>

            {/* BAHAN DIMILIKI */}
            <div className="flex flex-col gap-3 p-5 md:p-6 bg-white border border-gray-100 rounded-3xl shadow-sm relative z-30">
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-black text-gray-700 tracking-wide flex items-center gap-2"><FiCheckCircle className="text-emerald-500" /> Bahan yang Dimiliki</label>
                <button type="button" onClick={handleAddOwned} className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg flex items-center gap-1"><FiPlus /> Tambah</button>
              </div>
              {ownedIngredients.map((ing, index) => {
                const filteredOptions = ingredientOptions.filter(opt => opt.name.toLowerCase().includes(ing.name.toLowerCase()));
                return (
                  <div key={index} className="flex gap-3 relative" style={{ zIndex: 50 - index }}>
                    <div className="flex-1 relative">
                      <input 
                        type="text" placeholder="Ketik nama bahan..." value={ing.name}
                        onChange={(e) => handleOwnedChange(index, e.target.value)}
                        onFocus={() => setActiveOwnedDropdown(index)}
                        onBlur={() => setTimeout(() => setActiveOwnedDropdown(null), 200)}
                        className={`w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:bg-white focus:border-[#C18A5E] ${ing.is_valid ? 'border-emerald-300 ring-1 ring-emerald-300 bg-white' : ''}`}
                      />
                      {activeOwnedDropdown === index && ing.name && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-60 overflow-y-auto z-50">
                          {filteredOptions.map(opt => (
                            <div key={opt.ingredient_id} onClick={() => handleSelectOwned(index, opt, false)} className="px-5 py-3 hover:bg-gray-50 cursor-pointer text-sm font-medium border-b border-gray-50">{opt.name}</div>
                          ))}
                          <div onClick={() => handleSelectOwned(index, { name: ing.name }, true)} className="px-5 py-3 bg-[#E3CBB8]/10 hover:bg-[#E3CBB8]/30 cursor-pointer text-sm font-black text-[#C18A5E] flex justify-between">
                            <span>Kustom: "{ing.name}"</span><span className="bg-[#C18A5E] text-white text-[10px] px-2 py-1 rounded-md">Pilih</span>
                          </div>
                        </div>
                      )}
                    </div>
                    {ownedIngredients.length > 1 && (
                      <button type="button" onClick={() => handleRemoveOwned(index)} className="w-12 h-[50px] bg-red-50 text-red-500 rounded-xl flex items-center justify-center shrink-0"><FiTrash2 size={18} /></button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* KATEGORI */}
            <div className="flex flex-col gap-3 p-5 md:p-6 bg-white border border-gray-100 rounded-3xl shadow-sm relative z-20">
              <label className="text-sm font-black text-gray-700 tracking-wide flex items-center gap-2"><FiTag className="text-indigo-500"/> Kategori</label>
              <div className="relative">
                <input 
                  type="text" value={catSearch} disabled={isMetadataLoading}
                  onChange={(e) => setCatSearch(e.target.value)} onFocus={() => setShowCatDropdown(true)} onBlur={() => setTimeout(() => setShowCatDropdown(false), 200)}
                  placeholder="Cari kategori (Goreng, Kuah)..." className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-indigo-400"
                />
                {showCatDropdown && catSearch && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-60 overflow-y-auto z-50">
                    {filteredCategories.map(cat => (
                      <div key={cat.category_id} onClick={() => handleSelectCategory(cat.name)} className="px-5 py-3 hover:bg-gray-50 cursor-pointer text-sm border-b flex justify-between">{cat.name} <span className="text-[10px] text-gray-400 font-bold">Pakai: {cat.usage_count || 0}</span></div>
                    ))}
                    {!exactCatMatch && (
                      <div onClick={() => handleSelectCategory(catSearch)} className="px-5 py-3 bg-indigo-50 text-indigo-600 cursor-pointer text-sm font-black flex justify-between">Kategori baru: "{catSearch}" <span className="bg-indigo-500 text-white text-[10px] px-2 py-1 rounded-md">Tambah</span></div>
                    )}
                  </div>
                )}
              </div>
              {selectedCategories.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedCategories.map((cat, idx) => (
                    <span key={idx} className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-2 border">{cat} <button type="button" onClick={() => handleRemoveCategory(cat)}><FiX size={14} /></button></span>
                  ))}
                </div>
              )}
            </div>

            {/* BAHAN DIHINDARI */}
            <div className="flex flex-col gap-3 p-5 md:p-6 bg-white border border-gray-100 rounded-3xl shadow-sm relative z-10">
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-black text-gray-700 tracking-wide flex items-center gap-2"><FiX className="text-red-500" /> Bahan Dihindari</label>
                <button type="button" onClick={handleAddAvoided} className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-1"><FiPlus /> Tambah</button>
              </div>
              {avoidedIngredients.map((ing, index) => {
                const filteredOptions = ingredientOptions.filter(opt => opt.name.toLowerCase().includes(ing.name.toLowerCase()));
                return (
                  <div key={index} className="flex gap-3 relative" style={{ zIndex: 30 - index }}>
                    <div className="flex-1 relative">
                      <input 
                        type="text" placeholder="Kacang, Udang..." value={ing.name}
                        onChange={(e) => handleAvoidedChange(index, e.target.value)}
                        onFocus={() => setActiveAvoidedDropdown(index)}
                        onBlur={() => setTimeout(() => setActiveAvoidedDropdown(null), 200)}
                        className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:bg-white focus:border-red-400"
                      />
                      {activeAvoidedDropdown === index && ing.name && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-60 overflow-y-auto z-50">
                          {filteredOptions.map(opt => (
                            <div key={opt.ingredient_id} onClick={() => handleSelectAvoided(index, opt, false)} className="px-5 py-3 hover:bg-gray-50 cursor-pointer text-sm border-b">{opt.name}</div>
                          ))}
                          <div onClick={() => handleSelectAvoided(index, { name: ing.name }, true)} className="px-5 py-3 bg-red-50 text-red-600 cursor-pointer text-sm font-black flex justify-between">Pantangan: "{ing.name}" <span className="bg-red-500 text-white text-[10px] px-2 py-1 rounded-md">Kunci</span></div>
                        </div>
                      )}
                    </div>
                    <button type="button" onClick={() => handleRemoveAvoided(index)} className="w-12 h-[50px] bg-red-50 text-red-500 rounded-xl flex items-center justify-center shrink-0"><FiTrash2 size={18} /></button>
                  </div>
                );
              })}
            </div>

            {/* WAKTU MASAK */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-black text-gray-700 tracking-wide flex items-center gap-2"><FiClock className="text-blue-500"/> Waktu Maksimal</label>
              <div className="flex gap-4">
                <input type="number" value={timeValue} onChange={(e) => setTimeValue(e.target.value)} placeholder="Angka..." className="flex-1 px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-[#C18A5E]" />
                <select value={timeUnit} onChange={(e) => setTimeUnit(e.target.value)} className="w-32 px-4 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 focus:outline-none focus:border-[#C18A5E]">
                  <option value="Menit">Menit</option>
                  <option value="Jam">Jam</option>
                </select>
              </div>
            </div>

            <button type="submit" className="w-full bg-gradient-to-r from-[#C18A5E] to-[#a6744d] hover:from-[#a6744d] hover:to-[#8a5a38] text-white py-4 mt-4 rounded-3xl font-black text-lg shadow-[0_10px_20px_rgba(193,138,94,0.3)] transition-all active:scale-95 flex justify-center items-center gap-2">
              <FiTarget size={22} /> Terawang Resep Sekarang!
            </button>
          </form>
        )}

        {/* ==========================================
            LAYAR 2: LOADING AI
            ========================================== */}
        {step === 2 && (
          <div className="flex flex-col justify-center items-center py-32 animate-fadeIn">
            <img src={YouriThinking} alt="Youri Berpikir" className="w-28 h-28 animate-bounce drop-shadow-2xl mb-8" />
            <h3 className="text-2xl font-black text-gray-800 tracking-tight">Mencocokkan Sihir...</h3>
            <p className="text-sm font-medium text-gray-500 mt-2 text-center max-w-xs leading-relaxed">
              Youri sedang mengubek-ubek buku resep dan mencocokkannya dengan bahan di dapurmu!
            </p>
          </div>
        )}

        {/* ==========================================
            LAYAR 3: HASIL PENCARIAN (GRID LIST)
            ========================================== */}
        {step === 3 && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            
            {/* Header Info Hasil */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-3xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
               <div className="flex items-start gap-4">
                 <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center shrink-0">
                   <FiFilter size={24} />
                 </div>
                 <div>
                   <h3 className="text-lg font-black text-gray-800">Ditemukan {matchedRecipes.length} Resep!</h3>
                   <p className="text-sm font-medium text-gray-600 mt-1">
                     Berdasarkan <span className="font-bold text-emerald-600">{ownedIngredients.filter(i => i.name).length} bahan</span> yang kamu miliki.
                   </p>
                 </div>
               </div>
            </div>

            {matchedRecipes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                {matchedRecipes.map((recipe) => (
                  <div 
                    key={recipe.id}
                    onClick={() => handleSelectRecipe(recipe.id, recipe.match_percentage)}
                    className="relative bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer group flex flex-col"
                  >
                    {/* Badge Persentase Gede (Sesuai Wireframe) */}
                    <div className="absolute top-4 right-4 z-20 bg-white/95 backdrop-blur-xl px-4 py-3 rounded-2xl shadow-xl border border-gray-100/50 flex flex-col items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Kecocokan</span>
                      <span className={`text-2xl font-black tracking-tighter ${recipe.match_percentage >= 80 ? 'text-emerald-500' : recipe.match_percentage >= 50 ? 'text-[#C18A5E]' : 'text-red-500'}`}>
                        {recipe.match_percentage}%
                      </span>
                    </div>

                    {/* Gambar Resep */}
                    <div className="w-full h-56 bg-gray-100 relative overflow-hidden shrink-0">
                      <ImageWithFallback src={recipe.image_url} alt={recipe.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10"></div>
                      
                      {/* Waktu Masak Badge (Jika ada dari backend) */}
                      {recipe.cook_time_mins && (
                        <div className="absolute bottom-4 right-4 z-10 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 text-white">
                          <FiClock size={12} />
                          <span className="text-xs font-bold">{recipe.cook_time_mins} menit</span>
                        </div>
                      )}
                    </div>

                    {/* Info Title & Tombol */}
                    <div className="p-6 flex flex-col flex-1 bg-white">
                      <h3 className="text-xl font-black text-gray-800 leading-tight mb-4 group-hover:text-[#C18A5E] transition-colors">
                        {recipe.name}
                      </h3>
                      
                      <div className="mt-auto">
                        <button className="w-full py-3.5 bg-gray-50 group-hover:bg-[#C18A5E] text-gray-500 group-hover:text-white rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all duration-300">
                          Masak Resep Ini <FiChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 border-dashed">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                  <FiSearch size={32} />
                </div>
                <h3 className="text-xl font-black text-gray-800">Tidak ada yang nyangkut...</h3>
                <p className="text-gray-500 font-medium mt-2">Coba kurangi filter atau gunakan bahan yang lebih umum!</p>
                <button onClick={() => setStep(1)} className="mt-6 text-[#C18A5E] font-bold hover:underline">Kembali ke Pencarian</button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default MatchRecipe;