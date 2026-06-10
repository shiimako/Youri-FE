import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";

import { 
  FiArrowLeft, FiSearch, FiClock, FiTarget, 
  FiCheckCircle, FiX, FiTag, FiPlus, FiChevronRight, FiFilter 
} from "react-icons/fi";
 import ImageWithFallback from "../../components/ImageWithFallback";
import YouriThinking from "../../assets/youri_sprites/loading.svg";

const MatchRecipe = () => {
  const navigate = useNavigate();

  // ==========================================
  // STATE: UI CONTROL & FORM PAYLOAD
  // ==========================================
  const [isMetadataLoading, setIsMetadataLoading] = useState(true);
  const [step, setStep] = useState(1); 

  const [recipeName, setRecipeName] = useState("");
  const [timeOperator, setTimeOperator] = useState("under");
  const [timeValue, setTimeValue] = useState("");
  const [timeUnit, setTimeUnit] = useState("Menit");

  const [ownedIngredients, setOwnedIngredients] = useState([]);
  const [avoidedIngredients, setAvoidedIngredients] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  // ==========================================
  // STATE: SEARCH INPUTS & DYNAMIC OPTIONS 
  // ==========================================
  const [ownedSearch, setOwnedSearch] = useState("");
  const [showOwnedDropdown, setShowOwnedDropdown] = useState(false);
  const [ownedOptions, setOwnedOptions] = useState([]); 

  const [avoidedSearch, setAvoidedSearch] = useState("");
  const [showAvoidedDropdown, setShowAvoidedDropdown] = useState(false);
  const [avoidedOptions, setAvoidedOptions] = useState([]); 

  const [catSearch, setCatSearch] = useState("");
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [catOptions, setCatOptions] = useState([]); 

  const [matchedRecipes, setMatchedRecipes] = useState([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [ingRes, catRes] = await Promise.all([
          api.get("/ingredients"),
          api.get("/categories")
        ]);
        setOwnedOptions(ingRes.data.data);
        setAvoidedOptions(ingRes.data.data);
        setCatOptions(catRes.data.data);
      } catch (error) {
        console.error("Fetch Default Error:", error);
      } finally {
        setIsMetadataLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (ownedSearch.trim() !== "") {
        try {
          const res = await api.get(`/ingredients?search=${ownedSearch}`);
          setOwnedOptions(res.data.data);
        } catch (error) { console.error(error); }
      }
    }, 300); 
    return () => clearTimeout(delayDebounce); 
  }, [ownedSearch]);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (avoidedSearch.trim() !== "") {
        try {
          const res = await api.get(`/ingredients?search=${avoidedSearch}`);
          setAvoidedOptions(res.data.data);
        } catch (error) { console.error(error); }
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [avoidedSearch]);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (catSearch.trim() !== "") {
        try {
          const res = await api.get(`/categories?search=${catSearch}`);
          setCatOptions(res.data.data);
        } catch (error) { console.error(error); }
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [catSearch]);


  const exactOwnedMatch = ownedOptions.some(opt => opt.name.toLowerCase() === ownedSearch.toLowerCase());
  const exactAvoidedMatch = avoidedOptions.some(opt => opt.name.toLowerCase() === avoidedSearch.toLowerCase());
  const exactCatMatch = catOptions.some(cat => cat.name.toLowerCase() === catSearch.toLowerCase());

  const handleAddItem = (type, item, isCustom = false) => {
    if (type === 'owned') {
      if (ownedIngredients.some(i => i.name.toLowerCase() === item.name.toLowerCase())) return toast.error("Bahan sudah ditambahkan!");
      setOwnedIngredients([...ownedIngredients, { ...item, is_valid: !isCustom }]);
      setOwnedSearch(""); setShowOwnedDropdown(false);
    } 
    else if (type === 'avoided') {
      if (avoidedIngredients.some(i => i.name.toLowerCase() === item.name.toLowerCase())) return toast.error("Bahan sudah dihindari!");
      setAvoidedIngredients([...avoidedIngredients, { ...item, is_valid: !isCustom }]);
      setAvoidedSearch(""); setShowAvoidedDropdown(false);
    } 
    else if (type === 'category') {
      if (selectedCategories.includes(item.name)) return toast.error("Kategori sudah dipilih!");
      setSelectedCategories([...selectedCategories, item.name]);
      setCatSearch(""); setShowCatDropdown(false);
    }
  };

  const handleRemoveItem = (type, index) => {
    if (type === 'owned') setOwnedIngredients(ownedIngredients.filter((_, i) => i !== index));
    if (type === 'avoided') setAvoidedIngredients(avoidedIngredients.filter((_, i) => i !== index));
    if (type === 'category') setSelectedCategories(selectedCategories.filter((_, i) => i !== index));
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (ownedIngredients.length === 0 && !recipeName) return toast.error("Isi bahan atau nama resep dulu ya!");

    setStep(2);
    try {
      let payloadTime = undefined;
      if (timeValue) {
        let t = parseInt(timeValue);
        if (timeUnit === "Jam") t *= 60;
        payloadTime = { time: t, scope: timeOperator };
      }

      const payload = {
        recipe_name: recipeName || undefined,
        ingredients: ownedIngredients.map(i => ({ id: i.ingredient_id || i.id, name: i.name, is_valid: i.is_valid })),
        exclude_ingredients: avoidedIngredients.length > 0 ? avoidedIngredients.map(i => ({ id: i.ingredient_id || i.id, name: i.name })) : undefined,
        time: payloadTime,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined 
      };

      const res = await api.post("/cooking/match", payload);
      setMatchedRecipes(res.data.data || []);
      setStep(3);
    } catch (error) {
      toast.error("Gagal mencari resep.");
      console.error("Search Error:", error);
      setStep(1);
    }
  };

  const handleSelectRecipe = async (recipe) => {
    if (recipe.with_ingredients) {
      const toastId = toast.loading("Mempersiapkan sihir substitusi...");
      try {
        const res = await api.post("/cooking/preparing", {
          recipe_id: recipe.id,
          ingredients: ownedIngredients.map(i => ({ id: i.ingredient_id || i.id, name: i.name })),
          match_percentage: recipe.match_percentage
        });
        
        toast.success("Resep siap!", { id: toastId });
        navigate(`/cooking/recipe/${recipe.id}`, { state: { aiData: res.data.data } });
      } catch (error) {
        toast.error("Gagal menyiapkan resep.", { id: toastId });
        console.error("Prepare Error:", error);
      }
    } 
    else {
      navigate(`/cooking/recipe/${recipe.id}`);
    }
  };

  return (
    <div className="flex-1 w-full bg-[#fbf9f7] min-h-screen font-sans flex flex-col relative animate-fadeIn pb-24 md:pb-32 overflow-y-auto">
      
      {/* HEADER */}
      <div className="sticky top-0 z-[60] bg-white/90 backdrop-blur-md px-4 md:px-10 py-4 md:py-5 flex items-center gap-3 md:gap-4 border-b border-gray-100 shadow-sm shrink-0">
        <button onClick={() => step === 3 ? setStep(1) : navigate(-1)} className="p-2 -ml-1 md:-ml-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-gray-600 border border-gray-100">
          <FiArrowLeft size={20} />
        </button>
        <h1 className="text-lg md:text-xl font-black text-gray-800 tracking-tight">
          {step === 3 ? "Terawangan Youri" : "Cari Resep Pintar"}
        </h1>
      </div>

      <div className="px-4 md:px-10 py-6 md:py-8 max-w-3xl mx-auto w-full flex flex-col gap-6 md:gap-8">
        
        {step === 1 && (
          <form onSubmit={handleSearchSubmit} className="flex flex-col gap-5 md:gap-6 animate-fadeIn">
            
            {/* 1. NAMA RESEP */}
            <div className="flex flex-col gap-2">
              <label className="text-sm md:text-base font-black text-gray-800 tracking-wide flex items-center gap-2">
                <FiSearch className="text-[#C18A5E]"/> Nama Resep <span className="text-gray-400 font-medium text-xs md:text-sm">(Opsional)</span>
              </label>
              <input type="text" value={recipeName} onChange={(e) => setRecipeName(e.target.value)} placeholder="Contoh: Nasi Goreng..." className="w-full px-4 md:px-5 py-3 md:py-4 bg-white border border-gray-200 rounded-xl text-sm md:text-base font-medium focus:outline-none focus:border-[#C18A5E] focus:ring-2 focus:ring-[#C18A5E]/20 transition-all shadow-sm" />
            </div>

            {/* 2. BAHAN DIMILIKI */}
            <div className="flex flex-col gap-2 p-4 md:p-6 bg-white border border-gray-100 rounded-[20px] md:rounded-[24px] shadow-sm relative z-[50]">
              <label className="text-sm md:text-base font-black text-gray-800 tracking-wide flex items-center gap-2">
                <FiCheckCircle className="text-emerald-500" /> Bahan yang Dimiliki
              </label>
              
              <div className="relative mt-1">
                <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-400/20 transition-all">
                  <FiSearch className="text-gray-400 ml-3 md:ml-4" />
                  <input 
                    type="text" value={ownedSearch} disabled={isMetadataLoading}
                    onChange={(e) => setOwnedSearch(e.target.value)} onFocus={() => setShowOwnedDropdown(true)} onBlur={() => setTimeout(() => setShowOwnedDropdown(false), 200)}
                    placeholder="Cari bahan di kulkasmu..." className="w-full px-3 py-3 md:py-3.5 bg-transparent text-sm font-medium text-gray-700 focus:outline-none"
                  />
                </div>
                {showOwnedDropdown && ownedSearch && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-xl md:rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-52 md:max-h-60 overflow-y-auto z-[70]">
                    {ownedOptions.map(opt => (
                      <div key={opt.ingredient_id || opt.id} onClick={() => handleAddItem('owned', opt)} className="px-4 md:px-5 py-3 hover:bg-gray-50 cursor-pointer text-sm font-medium text-gray-700 border-b border-gray-50 flex justify-between items-center">
                        <span>{opt.name}</span>
                        <span className="text-[9px] md:text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md font-bold tracking-wide">Master</span>
                      </div>
                    ))}
                    {!exactOwnedMatch && (
                      <div onClick={() => handleAddItem('owned', { name: ownedSearch }, true)} className="px-4 md:px-5 py-3 bg-[#fbf7f4] hover:bg-[#E3CBB8]/30 cursor-pointer text-sm font-black text-[#C18A5E] flex items-center justify-between mt-auto">
                        <span>Input kustom: "{ownedSearch}"</span>
                        <FiPlus size={16} />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-2">
                {ownedIngredients.map((ing, idx) => (
                  <span key={idx} className="bg-emerald-50 text-emerald-700 px-2.5 py-1.5 md:px-3 rounded-lg text-xs font-black flex items-center gap-1.5 border border-emerald-200 animate-fadeIn">
                    {ing.name} {!ing.is_valid && "⚠️"} <button type="button" onMouseDown={(e) => { e.preventDefault(); handleRemoveItem('owned', idx); }} className="hover:text-red-500 p-0.5"><FiX size={14} /></button>
                  </span>
                ))}
              </div>
            </div>

            {/* 3. KATEGORI */}
            <div className="flex flex-col gap-2 p-4 md:p-6 bg-white border border-gray-100 rounded-[20px] md:rounded-[24px] shadow-sm relative z-[40]">
              <label className="text-sm md:text-base font-black text-gray-800 tracking-wide flex items-center gap-2">
                Kategori Resep
              </label>
              
              <div className="relative mt-1">
                <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden focus-within:border-[#C18A5E] focus-within:ring-2 focus-within:ring-[#C18A5E]/20 transition-all">
                  <FiSearch className="text-gray-400 ml-3 md:ml-4" />
                  <input 
                    type="text" value={catSearch} disabled={isMetadataLoading}
                    onChange={(e) => setCatSearch(e.target.value)} onFocus={() => setShowCatDropdown(true)} onBlur={() => setTimeout(() => setShowCatDropdown(false), 200)}
                    placeholder="Cari kategori (Goreng, Kuah)..." className="w-full px-3 py-3 md:py-3.5 bg-transparent text-sm font-medium text-gray-700 focus:outline-none"
                  />
                </div>
                {showCatDropdown && catSearch && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-xl md:rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-52 md:max-h-60 overflow-y-auto z-[70]">
                    {catOptions.map(cat => (
                      <div key={cat.category_id || cat.id} onClick={() => handleAddItem('category', cat)} className="px-4 md:px-5 py-3 hover:bg-gray-50 cursor-pointer text-sm font-medium text-gray-700 border-b border-gray-50 flex justify-between items-center">
                        <span>{cat.name}</span>
                        <span className="text-[9px] md:text-[10px] bg-gray-100 text-gray-400 px-2 py-1 rounded-md font-bold tracking-wide">Terpakai: {cat.usage_count || cat.count || 0}</span>
                      </div>
                    ))}
                    {!exactCatMatch && (
                      <div onClick={() => handleAddItem('category', { name: catSearch }, true)} className="px-4 md:px-5 py-3 bg-[#fbf7f4] hover:bg-[#E3CBB8]/30 cursor-pointer text-sm font-black text-[#C18A5E] flex items-center justify-between mt-auto">
                        <span>Kategori baru: "{catSearch}"</span>
                        <span className="bg-[#C18A5E] text-white text-[9px] md:text-[10px] px-2 py-1 rounded-md shadow-sm">Tambah</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-2">
                {selectedCategories.map((cat, idx) => (
                  <span key={idx} className="bg-indigo-50 text-indigo-700 px-2.5 py-1.5 md:px-3 rounded-lg text-xs font-black flex items-center gap-1.5 border border-indigo-200 animate-fadeIn">
                    <FiTag size={12} /> {cat} <button type="button" onMouseDown={(e) => { e.preventDefault(); handleRemoveItem('category', idx); }} className="hover:text-red-500 p-0.5"><FiX size={14} /></button>
                  </span>
                ))}
              </div>
            </div>

            {/* 4. BAHAN DIHINDARI */}
            <div className="flex flex-col gap-2 p-4 md:p-6 bg-white border border-gray-100 rounded-[20px] md:rounded-[24px] shadow-sm relative z-[30]">
              <label className="text-sm md:text-base font-black text-gray-800 tracking-wide flex items-center gap-2">
                <FiX className="text-red-500" /> Bahan Dihindari (Alergi)
              </label>
              
              <div className="relative mt-1">
                <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-400/20 transition-all">
                  <FiSearch className="text-gray-400 ml-3 md:ml-4" />
                  <input 
                    type="text" value={avoidedSearch} disabled={isMetadataLoading}
                    onChange={(e) => setAvoidedSearch(e.target.value)} onFocus={() => setShowAvoidedDropdown(true)} onBlur={() => setTimeout(() => setShowAvoidedDropdown(false), 200)}
                    placeholder="Contoh: Kacang, Udang..." className="w-full px-3 py-3 md:py-3.5 bg-transparent text-sm font-medium text-gray-700 focus:outline-none"
                  />
                </div>
                {showAvoidedDropdown && avoidedSearch && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-xl md:rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-52 md:max-h-60 overflow-y-auto z-[70]">
                    {avoidedOptions.map(opt => (
                      <div key={opt.ingredient_id || opt.id} onClick={() => handleAddItem('avoided', opt)} className="px-4 md:px-5 py-3 hover:bg-gray-50 cursor-pointer text-sm font-medium text-gray-700 border-b border-gray-50 flex justify-between items-center">
                        <span>{opt.name}</span>
                        <span className="text-[9px] md:text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded-md font-bold tracking-wide">Master</span>
                      </div>
                    ))}
                    {!exactAvoidedMatch && (
                      <div onClick={() => handleAddItem('avoided', { name: avoidedSearch }, true)} className="px-4 md:px-5 py-3 bg-red-50 hover:bg-red-100 cursor-pointer text-sm font-black text-red-600 flex items-center justify-between mt-auto">
                        <span>Pantangan kustom: "{avoidedSearch}"</span>
                        <span className="bg-red-500 text-white text-[9px] md:text-[10px] px-2 py-1 rounded-md shadow-sm">Kunci</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-2">
                {avoidedIngredients.map((ing, idx) => (
                  <span key={idx} className="bg-red-50 text-red-700 px-2.5 py-1.5 md:px-3 rounded-lg text-xs font-black flex items-center gap-1.5 border border-red-200 animate-fadeIn">
                    {ing.name} <button type="button" onMouseDown={(e) => { e.preventDefault(); handleRemoveItem('avoided', idx); }} className="hover:text-red-900 p-0.5"><FiX size={14} /></button>
                  </span>
                ))}
              </div>
            </div>

            {/* 5. WAKTU */}
            <div className="flex flex-col gap-2">
              <label className="text-xs md:text-sm font-black text-gray-800 tracking-wide flex items-center gap-2"><FiClock className="text-blue-500"/> Durasi Masak Maksimal</label>
              <div className="flex gap-3 md:gap-4">
                <input type="number" value={timeValue} onChange={(e) => setTimeValue(e.target.value)} placeholder="Angka..." className="flex-1 px-4 py-3 md:py-4 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#C18A5E] focus:ring-2 focus:ring-[#C18A5E]/20 shadow-sm transition-all" />
                <select value={timeUnit} onChange={(e) => setTimeUnit(e.target.value)} className="w-24 md:w-32 px-2 md:px-4 py-3 md:py-4 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:border-[#C18A5E] focus:ring-2 focus:ring-[#C18A5E]/20 transition-all">
                  <option value="Menit">Menit</option>
                  <option value="Jam">Jam</option>
                </select>
              </div>
            </div>

            <button type="submit" className="w-full bg-gradient-to-r from-[#C18A5E] to-[#a6744d] text-white py-3.5 md:py-4 mt-2 md:mt-4 rounded-2xl font-black text-base md:text-lg shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
              <FiTarget size={20} /> Terawang Resep Sekarang!
            </button>
          </form>
        )}

        {/* --- STEP 2: LOADING --- */}
        {step === 2 && (
          <div className="flex flex-col justify-center items-center py-24 md:py-32 animate-fadeIn relative">
            {/* 🌸 Efek Glow Sihir di belakang Youri */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 md:w-48 md:h-48 bg-[#C18A5E]/20 rounded-full blur-3xl animate-pulse"></div>
            
            <img 
              src={YouriThinking} 
              alt="Loading" 
              className="w-28 h-28 md:w-36 md:h-36 animate-bounce relative z-10 drop-shadow-xl" 
            />
            <h3 className="text-xl md:text-2xl font-black text-gray-800 mt-6 md:mt-8 relative z-10 text-center">
              Youri sedang berpikir keras...
            </h3>
            <p className="text-sm font-bold text-[#C18A5E] mt-2 animate-pulse relative z-10 text-center">
              Mencocokkan sihir bahan di kulkasmu ✨
            </p>
          </div>
        )}

        {/* --- STEP 3: RESULTS (Highly Interactive Cards) --- */}
        {step === 3 && (
          <div className="flex flex-col gap-5 md:gap-6 animate-fadeIn pb-10">
            
            {/* Header Hasil */}
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-[20px] md:rounded-3xl p-5 md:p-6 flex justify-between items-center shadow-inner shrink-0">
               <div className="flex-1">
                 <h3 className="text-base md:text-lg font-black text-gray-800 line-clamp-1">
                   {ownedIngredients.length > 0 ? `Kombinasi Kulkas: ${matchedRecipes.length} Resep!` : `Ditemukan ${matchedRecipes.length} Resep!`}
                 </h3>
                 <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                   {ownedIngredients.length > 0 ? `Youri memprioritaskan resep untuk ${ownedIngredients.length} bahanmu.` : "Pilih resep yang paling menggugah seleramu."}
                 </p>
               </div>
               <FiFilter className="text-emerald-500 shrink-0 ml-3" size={24} />
            </div>

            {matchedRecipes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 mt-1 md:mt-2">
                {matchedRecipes.map((recipe) => (
                  <div 
                    key={recipe.id} 
                    onClick={() => handleSelectRecipe(recipe)} 
                    className="
                      bg-white rounded-[24px] md:rounded-[2rem] overflow-hidden 
                      shadow-sm border border-gray-100 
                      flex flex-col relative cursor-pointer group
                      transition-all duration-300 ease-out
                      /* 🌸 Efek kenyal saat disentuh di HP */
                      active:scale-[0.97] active:shadow-inner active:border-gray-200
                      /* Efek terangkat saat di-hover di PC */
                      md:hover:-translate-y-2 md:hover:shadow-2xl md:hover:border-[#C18A5E]/30
                    "
                  >
                    {/* Badge Persentase Mengambang HANYA jika pakai AI */}
                    {recipe.with_ingredients && (
                      <div className="absolute top-3 right-3 md:top-4 md:right-4 z-20 bg-white/95 px-3 py-2 md:px-4 md:py-3 rounded-xl md:rounded-2xl shadow-lg flex flex-col items-center">
                        <span className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest">Cocok</span>
                        <span className={`text-xl md:text-2xl font-black ${recipe.match_percentage >= 80 ? 'text-emerald-500' : 'text-[#C18A5E]'}`}>
                          {recipe.match_percentage}%
                        </span>
                      </div>
                    )}

                    {/* Gambar Resep Besar (Bagian Atas) */}
                    <div className="w-full h-44 md:h-56 bg-gray-100 overflow-hidden relative shrink-0">
                      {/* 🌸 Gambar membesar pelan-pelan saat di-hover atau disentuh */}
                      <ImageWithFallback 
                        src={recipe.image_url} 
                        alt={recipe.name} 
                        className="w-full h-full object-cover group-hover:scale-110 group-active:scale-105 transition-transform duration-700 ease-out" 
                      />
                      
                      {/* 🌸 Overlay gelap transparan yang muncul saat disentuh/hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 group-active:bg-black/20 transition-colors duration-300 pointer-events-none"></div>
                      
                      {/* Badge Waktu Memasak */}
                      {recipe.cook_time_mins && (
                        <div className="absolute bottom-3 right-3 md:bottom-4 md:right-4 bg-black/60 backdrop-blur-md px-2.5 py-1.5 md:px-3 md:py-1.5 rounded-full text-white text-[10px] md:text-xs font-bold flex items-center gap-1.5 z-10 shadow-sm">
                          <FiClock size={12}/>{recipe.cook_time_mins} Menit
                        </div>
                      )}

                      {/* Badge Pencarian Standar */}
                      {!recipe.with_ingredients && (
                        <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4 bg-gray-900/70 backdrop-blur-md px-2.5 py-1.5 md:px-3 md:py-1.5 rounded-full text-white text-[10px] md:text-xs font-black tracking-widest uppercase shadow-md z-10">
                          Standar
                        </div>
                      )}
                    </div>

                    {/* Informasi Resep (Bagian Bawah) */}
                    <div className="p-5 md:p-6 bg-white flex-1 flex flex-col z-10">
                      <h3 className="text-lg md:text-xl font-black text-gray-800 leading-tight group-hover:text-[#C18A5E] group-active:text-[#C18A5E] mb-4 md:mb-5 line-clamp-2 transition-colors duration-300">
                        {recipe.name}
                      </h3>
                      
                      {/* 🌸 Tombol yang langsung merespons sentuhan (group-active) */}
                      <button className="mt-auto w-full py-3.5 md:py-4 bg-gray-50 text-gray-500 group-hover:bg-[#C18A5E] group-hover:text-white group-active:bg-[#a6744d] group-active:text-white rounded-xl text-xs md:text-sm font-black flex items-center justify-center gap-2 transition-all duration-300 shadow-sm group-hover:shadow-md">
                        Masak Resep Ini <FiChevronRight size={18} className="group-hover:translate-x-1.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 md:py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200 shadow-sm">
                <FiSearch size={48} className="mx-auto text-gray-300 mb-4 animate-pulse" />
                <h3 className="text-lg md:text-xl font-black text-gray-800">Tidak ada resep yang cocok...</h3>
                <button onClick={() => setStep(1)} className="mt-4 px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-[#C18A5E] rounded-full font-black text-sm md:text-base transition-colors shadow-sm">Coba ubah filter</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchRecipe;