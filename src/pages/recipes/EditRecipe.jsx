import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";

import { 
  FiArrowLeft, FiCamera, FiPlus, FiTrash2, 
  FiTag, FiSearch, FiCheck, FiCheckCircle 
} from "react-icons/fi";
import ImageWithFallback from "../../components/ImageWithFallback";
import axios from "axios";

const EditRecipe = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Tangkap ID resep dari URL
  
  const [ingredientOptions, setIngredientOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // STATE GAMBAR
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const fileInputRef = useRef(null);

  // STATE UTAMA FORM
  const [formData, setFormData] = useState({
    title: "",
    time_value: "",
    time_unit: "Menit",
    description: "",
    categories: [], 
    ingredients: [], 
    steps: [], 
  });

  // STATE KONTROL UI
  const [catSearch, setCatSearch] = useState("");
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [activeIngDropdown, setActiveIngDropdown] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false); 

  useEffect(() => {
    const fetchEditData = async () => {
      try {
        const [ingRes, catRes, recipeRes] = await Promise.all([
          api.get("/ingredients"),
          api.get("/categories"),
          api.get(`/user/recipes/${id}`)
        ]);

        setIngredientOptions(ingRes.data.data);
        setCategoryOptions(catRes.data.data);

        // 1. Tangkap data resep
        const recipeData = recipeRes.data.data;

        // 2. Olah data bahan agar punya properti is_valid untuk UI
        const mappedIngredients = recipeData.ingredients.map(ing => ({
          ingredient_id: ing.ingredient_id,
          name: ing.name,
          qty: ing.qty,
          metric: ing.metric,
          is_core: ing.is_core,
          is_valid: ing.ingredient_id !== null // Kalau ID-nya ada, berarti valid dari Master!
        }));

        // 3. Masukkan ke State Form
        setFormData({
          title: recipeData.title,
          time_value: recipeData.time_value || recipeData.cook_time_mins, // Backup antisipasi beda nama field
          time_unit: recipeData.time_unit || "Menit",
          description: recipeData.description,
          categories: recipeData.categories || [],
          ingredients: mappedIngredients.length > 0 ? mappedIngredients : [{ ingredient_id: null, name: "", qty: "", metric: "gram", is_core: false, is_valid: false }],
          steps: recipeData.steps.length > 0 ? recipeData.steps : [""],
        });

        // 4. Tampilkan Gambar Lama
        setPreviewUrl(recipeData.image_url);

      } catch (error) {
        toast.error("Gagal memuat data resep untuk diedit.");
        console.error("Fetch Edit Data Error:", error);
        navigate(-1); // Tendang balik kalau error/bukan miliknya
      } finally {
        setIsLoading(false);
      }
    };

    fetchEditData();
  }, [id, navigate]);

  // ==========================================
  // HANDLER GAMBAR
  // ==========================================
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      return toast.error("Ukuran gambar maksimal 5MB ya, Chef!");
    }
    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  // ==========================================
  // HANDLERS FORM (Sama seperti CreateRecipe)
  // ==========================================
  const filteredCategories = categoryOptions.filter(cat => cat.name.toLowerCase().includes(catSearch.toLowerCase()));
  const exactCatMatch = categoryOptions.some(cat => cat.name.toLowerCase() === catSearch.toLowerCase());

  const handleSelectCategory = (catName) => {
    if (formData.categories.includes(catName)) {
      toast.error("Kategori ini sudah ditambahkan!");
    } else {
      setFormData({ ...formData, categories: [...formData.categories, catName] });
    }
    setCatSearch("");
    setShowCatDropdown(false);
  };
  const handleRemoveCategory = (catToRemove) => {
    setFormData({ ...formData, categories: formData.categories.filter(c => c !== catToRemove) });
  };

  const handleAddIngredient = () => {
    setFormData({ ...formData, ingredients: [...formData.ingredients, { ingredient_id: null, name: "", qty: "", metric: "gram", is_core: false, is_valid: false }] });
  };
  const handleRemoveIngredient = (index) => {
    setFormData({ ...formData, ingredients: formData.ingredients.filter((_, i) => i !== index) });
  };
  const handleChangeIngredient = (index, field, value) => {
    const newIngs = [...formData.ingredients];
    newIngs[index][field] = value;
    if (field === "metric" && value === "secukupnya") newIngs[index].qty = 0;
    setFormData({ ...formData, ingredients: newIngs });
  };
  const handleSelectIngredient = (index, selectedItem) => {
    const newIngs = [...formData.ingredients];
    newIngs[index].name = selectedItem.name;
    if (selectedItem.isCustom) {
      newIngs[index].ingredient_id = null;
      newIngs[index].is_valid = false;
    } else {
      newIngs[index].ingredient_id = selectedItem.ingredient_id;
      newIngs[index].is_valid = true;
    }
    setFormData({ ...formData, ingredients: newIngs });
    setActiveIngDropdown(null);
  };

  const handleAddStep = () => setFormData({ ...formData, steps: [...formData.steps, ""] });
  const handleRemoveStep = (index) => {
    setFormData({ ...formData, steps: formData.steps.filter((_, i) => i !== index) });
  };
  const handleChangeStep = (index, value) => {
    const newSteps = [...formData.steps];
    newSteps[index] = value;
    setFormData({ ...formData, steps: newSteps });
  };

  const metricOptions = ["gram", "ml", "sdm", "sdt", "siung", "buah", "lembar", "batang", "secukupnya"];

  // ==========================================
  // HANDLER SUBMIT EDIT (TANPA EXP)
  // ==========================================
  const handleSubmit = async () => {
    // 1. Validasi Dasar
    if (!formData.title || !formData.time_value || !formData.description) {
      return toast.error("Judul, waktu, dan deskripsi wajib diisi!");
    }
    if (!previewUrl) {
      return toast.error("Foto resep wajib ada!");
    }
    if (formData.ingredients.length === 0 || !formData.ingredients[0].name) {
      return toast.error("Minimal harus ada satu bahan!");
    }
    if (formData.steps.length === 0 || !formData.steps[0]) {
      return toast.error("Minimal harus ada satu langkah masak!");
    }

    const toastId = toast.loading("Menyimpan perubahan...");
    setIsSubmitting(true);

    try {
      let finalImageUrl = previewUrl; // Default pakai gambar lama

      // 2. Jika ada gambar baru, Upload ke Cloudinary dulu!
      if (selectedImage) {
        toast.loading("Mengunggah foto baru ke awan...", { id: toastId });
        // Minta Signature ke Backend
        const sigRes = await api.get("/user/recipe-edit-signature/" + id); 
        const { signature, timestamp, api_key, cloud_name, folder, public_id } = sigRes.data.data;
        // Minta Upload ke Cloudinary
        const formImage = new FormData();
        formImage.append("file", selectedImage);
        formImage.append("api_key", api_key);
        formImage.append("timestamp", timestamp);
        formImage.append("signature", signature);
        formImage.append("folder", folder);
        formImage.append("public_id", public_id);
        formImage.append("overwrite", "true");
        formImage.append("invalidate", "true");

        const uploadRes = await axios.post(
          `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
          formImage
        );

        finalImageUrl = uploadRes.data.secure_url;
      }

      // 3. Siapkan Payload & Tembak Backend pakai PUT!
      toast.loading("Memperbarui buku resep...", { id: toastId });
      
      const payload = {
        ...formData,
        image_url: finalImageUrl
      };

      await api.put(`/user/recipes/${id}`, payload);

      toast.success("Resep berhasil diperbarui!", { id: toastId });
      
      // 4. Buka Modal Sukses
      setIsSuccessModalOpen(true);

    } catch (error) {
      console.error("Edit Recipe Error:", error);
      toast.error(error.response?.data?.message || "Gagal memperbarui resep.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 w-full bg-[#fbf9f7] min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#E3CBB8] border-t-[#C18A5E] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full bg-[#fbf9f7] text-gray-800 font-sans pb-32 flex flex-col relative h-full animate-fadeIn overflow-y-auto">
      
      {/* HEADER STICKY */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md px-6 md:px-10 py-5 flex items-center justify-between border-b border-gray-100 shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-gray-600 border border-gray-100">
            <FiArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-black text-gray-800 tracking-tight">Edit Resep</h1>
        </div>
      </div>

      {/* KONTEN FORM */}
      <div className="px-6 md:px-10 py-8 max-w-3xl mx-auto w-full flex flex-col gap-8">
        
        {/* INFO DASAR */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-black text-gray-700 tracking-wide">Nama Resep <span className="text-red-500">*</span></label>
          <input type="text" placeholder="Contoh: Nasi Goreng Spesial Youri" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-[#C18A5E] focus:ring-4 focus:ring-[#C18A5E]/10 transition-all shadow-sm" />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-black text-gray-700 tracking-wide">Foto Resep <span className="text-red-500">*</span></label>
          <label className="w-full h-48 md:h-64 bg-gray-50 border-2 border-dashed border-gray-300 rounded-3xl flex flex-col items-center justify-center text-gray-400 hover:bg-gray-100 hover:border-[#C18A5E] hover:text-[#C18A5E] transition-all cursor-pointer relative overflow-hidden group">
            {previewUrl ? (
              <>
                <ImageWithFallback src={previewUrl} alt="Preview" fallbackText={formData.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white text-gray-800 px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg">
                    <FiCamera /> Ganti Foto Lama
                  </div>
                </div>
              </>
            ) : (
              <>
                <FiCamera size={32} className="mb-2" />
                <span className="font-bold text-sm">Upload Gambar</span>
              </>
            )}
            <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageChange} />
          </label>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-sm font-black text-gray-700 tracking-wide">Estimasi Waktu <span className="text-red-500">*</span></label>
            <div className="flex gap-4">
              <input type="number" placeholder="Angka" value={formData.time_value} onChange={(e) => setFormData({...formData, time_value: e.target.value})} className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-[#C18A5E] focus:ring-4 focus:ring-[#C18A5E]/10 transition-all shadow-sm" />
              <select value={formData.time_unit} onChange={(e) => setFormData({...formData, time_unit: e.target.value})} className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 focus:outline-none focus:border-[#C18A5E] focus:ring-4 focus:ring-[#C18A5E]/10 transition-all shadow-sm cursor-pointer">
                <option value="Menit">Menit</option>
                <option value="Jam">Jam</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-black text-gray-700 tracking-wide">Deskripsi Singkat <span className="text-red-500">*</span></label>
          <textarea rows="3" placeholder="Ceritakan sedikit tentang resep ini..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-[#C18A5E] focus:ring-4 focus:ring-[#C18A5E]/10 transition-all shadow-sm resize-none"></textarea>
        </div>

        {/* SECTION KATEGORI */}
        <div className="flex flex-col gap-3 p-5 md:p-6 bg-white border border-gray-100 rounded-3xl shadow-sm z-20">
          <label className="text-sm font-black text-gray-700 tracking-wide">Kategori Resep</label>
          <div className="relative">
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:border-[#C18A5E] focus-within:ring-2 focus-within:ring-[#C18A5E]/20 transition-all">
              <FiSearch className="text-gray-400 ml-4" />
              <input type="text" placeholder="Cari atau ketik kategori baru..." value={catSearch} disabled={isLoading} onChange={(e) => setCatSearch(e.target.value)} onFocus={() => setShowCatDropdown(true)} onBlur={() => setTimeout(() => setShowCatDropdown(false), 200)} className="w-full px-3 py-3.5 bg-transparent text-sm font-medium focus:outline-none" />
            </div>
            {showCatDropdown && catSearch && (
              <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-20 flex flex-col max-h-60 overflow-y-auto">
                {filteredCategories.map(cat => (
                  <div key={cat.category_id} onClick={() => handleSelectCategory(cat.name)} className="px-5 py-3 hover:bg-gray-50 cursor-pointer text-sm font-medium border-b border-gray-50 flex justify-between">
                    <span>{cat.name}</span>
                    <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded font-bold">Terpakai: {cat.count || 0}</span>
                  </div>
                ))}
                {!exactCatMatch && (
                  <div onClick={() => handleSelectCategory(catSearch)} className="px-5 py-3 bg-[#E3CBB8]/10 hover:bg-[#E3CBB8]/30 cursor-pointer text-sm font-black text-[#C18A5E] flex items-center justify-between mt-auto border-t border-[#E3CBB8]/30">
                    <span>Input kategori yang belum ada: "{catSearch}"</span>
                    <span className="bg-[#C18A5E] text-white text-[10px] px-2 py-1 rounded-md">Tambah ke List</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {formData.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.categories.map((catName, idx) => (
                <span key={idx} className="bg-[#E3CBB8]/30 text-[#C18A5E] px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-2 border border-[#E3CBB8]/50">
                  <FiTag size={12} /> {catName}
                  <button onClick={() => handleRemoveCategory(catName)} className="hover:text-red-500 transition-colors"><FiX size={14}/></button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* SECTION BAHAN-BAHAN */}
        <div className="flex flex-col gap-3 p-5 md:p-6 bg-white border border-gray-100 rounded-3xl shadow-sm z-10">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-black text-gray-700 tracking-wide">Bahan-Bahan <span className="text-red-500">*</span></label>
            <button onClick={handleAddIngredient} type="button" className="text-xs font-bold text-[#C18A5E] hover:text-[#a6744d] flex items-center gap-1 bg-[#E3CBB8]/20 px-3 py-1.5 rounded-lg transition-colors">
              <FiPlus /> Tambah Bahan
            </button>
          </div>

          {formData.ingredients.map((ing, index) => {
            const filteredIngs = ingredientOptions.filter(opt => opt.name.toLowerCase().includes(ing.name.toLowerCase()));
            const exactIngMatch = ingredientOptions.some(opt => opt.name.toLowerCase() === ing.name.toLowerCase());
            const isDropdownOpen = activeIngDropdown === index;

            return (
              <div key={index} className="flex flex-col gap-2 relative p-4 bg-gray-50/50 rounded-2xl border border-gray-100 group transition-all hover:bg-gray-50">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-[2] relative">
                    <input 
                      type="text" placeholder="Nama Bahan (Cari/Ketik Baru)" value={ing.name} 
                      onChange={(e) => handleChangeIngredient(index, "name", e.target.value)}
                      onFocus={() => setActiveIngDropdown(index)}
                      onBlur={() => setTimeout(() => setActiveIngDropdown(null), 200)}
                      className={`w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#C18A5E] transition-all ${ing.is_valid ? 'border-emerald-300 ring-1 ring-emerald-300' : ''}`}
                    />
                    
                    {ing.name && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {ing.is_valid ? <span title="Bahan Terverifikasi" className="text-emerald-500 text-lg">✅</span> : <span title="Bahan Custom (UGC)" className="text-yellow-500 text-lg">⚠️</span>}
                      </div>
                    )}

                    {isDropdownOpen && ing.name && (
                      <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col max-h-60 overflow-y-auto">
                        {filteredIngs.map(opt => (
                           <div key={opt.ingredient_id} onClick={() => handleSelectIngredient(index, { ...opt, isCustom: false })} className="px-5 py-3 hover:bg-gray-50 cursor-pointer text-sm font-medium border-b border-gray-50">
                             {opt.name}
                           </div>
                        ))}
                        {!exactIngMatch && (
                          <div onClick={() => handleSelectIngredient(index, { name: ing.name, isCustom: true })} className="px-5 py-3 bg-[#E3CBB8]/10 hover:bg-[#E3CBB8]/30 cursor-pointer text-sm font-black text-[#C18A5E] flex items-center justify-between mt-auto border-t border-[#E3CBB8]/30">
                            <span>Input bahan yg belum ada: "{ing.name}"</span>
                            <span className="bg-[#C18A5E] text-white text-[10px] px-2 py-1 rounded-md shadow-sm">Tambah ke list</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <input 
                    type="number" placeholder="Qty" value={ing.qty} 
                    disabled={ing.metric === "secukupnya"}
                    onChange={(e) => handleChangeIngredient(index, "qty", e.target.value)}
                    className="flex-1 min-w-[80px] px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#C18A5E] transition-all disabled:opacity-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />

                  <select 
                    value={ing.metric} 
                    onChange={(e) => handleChangeIngredient(index, "metric", e.target.value)}
                    className="flex-1 min-w-[100px] px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:border-[#C18A5E] transition-all cursor-pointer"
                  >
                    {metricOptions.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>

                  {formData.ingredients.length > 1 && (
                    <button onClick={() => handleRemoveIngredient(index)} type="button" className="md:w-12 py-3.5 md:py-0 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl flex justify-center items-center transition-colors border border-red-100 shrink-0">
                      <FiTrash2 size={18} />
                    </button>
                  )}
                </div>

                <label className="flex items-center gap-2.5 mt-1 ml-1 cursor-pointer w-fit group">
                  <div className={`w-5 h-5 rounded-[6px] border flex items-center justify-center transition-all duration-200 ${ing.is_core ? 'bg-[#C18A5E] border-[#C18A5E] shadow-sm' : 'bg-white border-gray-300 group-hover:border-[#C18A5E]'}`}>
                    <FiCheck strokeWidth={3} className={`transition-transform duration-200 ${ing.is_core ? 'scale-100 text-white' : 'scale-0 text-transparent'}`} size={14} />
                  </div>
                  <input type="checkbox" checked={ing.is_core} onChange={(e) => handleChangeIngredient(index, "is_core", e.target.checked)} className="hidden" />
                  <span className={`text-xs font-bold transition-colors duration-200 ${ing.is_core ? 'text-[#C18A5E]' : 'text-gray-500 group-hover:text-gray-700'}`}>⭐ Tandai sebagai Bahan Utama</span>
                </label>
              </div>
            );
          })}
        </div>

        {/* SECTION LANGKAH MASAK */}
        <div className="flex flex-col gap-3 p-5 md:p-6 bg-white border border-gray-100 rounded-3xl shadow-sm mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-black text-gray-700 tracking-wide">Langkah Memasak <span className="text-red-500">*</span></label>
            <button onClick={handleAddStep} type="button" className="text-xs font-bold text-indigo-500 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
              <FiPlus /> Tambah Langkah
            </button>
          </div>

          {formData.steps.map((step, index) => (
            <div key={index} className="flex gap-3 items-start">
              <div className="w-8 h-8 mt-1.5 shrink-0 bg-indigo-100 text-indigo-500 font-black rounded-xl flex items-center justify-center text-xs shadow-inner">{index + 1}</div>
              <textarea rows="2" placeholder={`Langkah ke-${index + 1}...`} value={step} onChange={(e) => handleChangeStep(index, e.target.value)} className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-400 focus:bg-white transition-all resize-none"></textarea>
              {formData.steps.length > 1 && (
                <button onClick={() => handleRemoveStep(index)} type="button" className="w-10 h-10 mt-1 shrink-0 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl flex justify-center items-center transition-colors border border-red-100">
                  <FiTrash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>

        <button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-[#C18A5E] hover:bg-[#a6744d] text-white py-4 mb-8 rounded-3xl font-black text-lg shadow-[0_10px_20px_rgba(193,138,94,0.3)] transition-all active:scale-95 flex justify-center items-center gap-2 disabled:opacity-50 disabled:active:scale-100"
        >
          {isSubmitting ? (
            <span className="animate-pulse">Menyimpan Perubahan...</span>
          ) : (
            <>
              <FiCheckCircle size={22} /> Simpan Perubahan
            </>
          )}
        </button>

      </div>

          {/* ==========================================
          MODAL SUKSES
          ========================================== */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative flex flex-col items-center text-center">
            
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-inner border border-emerald-100">
              <FiCheckCircle size={40} />
            </div>

            <h2 className="text-2xl font-black text-gray-800 mb-2">Pembaruan Berhasil!</h2>
            <p className="text-sm text-gray-500 font-medium leading-relaxed mb-8">
              Resep <span className="font-bold text-[#C18A5E]">"{formData.title}"</span> telah berhasil diperbarui di buku resepmu.
            </p>

            <button
              onClick={() => {
                if (previewUrl) URL.revokeObjectURL(previewUrl);
                navigate("/my-recipes");
              }}
              className="w-full py-4 rounded-2xl font-black text-white bg-gray-800 hover:bg-gray-700 shadow-md transition-all active:scale-95"
            >
              Kembali ke Daftar Resep
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

const FiX = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

export default EditRecipe;