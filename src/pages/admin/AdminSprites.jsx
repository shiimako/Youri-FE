import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";

import { 
  FiPackage, FiPlus, FiEdit2, FiTrash2, 
  FiImage, FiStar, FiToggleLeft, FiToggleRight, FiArrowLeft
} from "react-icons/fi";

const AdminSprites = () => {
  const navigate = useNavigate();

  // 🌸 STATE DATA
  const [packages, setPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🌸 STATE MODAL CREATE / EDIT
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' | 'edit'
  const [selectedId, setSelectedId] = useState(null);
  
  // 🌸 STATE FORM
  const [formData, setFormData] = useState({
    package_name: "",
    unlock_at: 1,
    is_active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ==========================================
  // FETCH DATA: GET ALL SPRITE PACKAGES
  // ==========================================
  const fetchPackages = async () => {
    setIsLoading(true);
    try {
      // Memanggil API get all packages dari controller
      const response = await api.get("/admin/sprites/packages");
      setPackages(response.data.data);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat katalog kosmetik.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  // ==========================================
  // HANDLER: BUKA MODAL
  // ==========================================
  const handleOpenModal = (mode, pkg = null) => {
    setModalMode(mode);
    if (mode === "edit" && pkg) {
      setSelectedId(pkg.package_id);
      setFormData({
        package_name: pkg.package_name,
        unlock_at: pkg.unlock_at, 
        is_active: pkg.is_active
      });
    } else {
      setSelectedId(null);
      setFormData({ package_name: "", unlock_at: 1, is_active: true });
    }
    setIsModalOpen(true);
  };

  // ==========================================
  // HANDLER: SUBMIT CREATE / UPDATE
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.package_name.trim()) return toast.error("Nama paket wajib diisi!");
    if (formData.unlock_at < 0) return toast.error("Level minimal adalah 0");

    setIsSubmitting(true);
    const toastId = toast.loading(modalMode === "create" ? "Membuat paket..." : "Menyimpan perubahan...");

    try {
      if (modalMode === "create") {
        // Tembak API Create sesuai payload controller[cite: 9]
        await api.post("/admin/sprites/packages", formData);
        toast.success("Paket Kosmetik Baru berhasil dibuat!", { id: toastId });
      } else {
        // Tembak API Update (Partial Update)[cite: 9]
        await api.patch(`/admin/sprites/packages/${selectedId}`, formData);
        toast.success("Metadata paket diperbarui!", { id: toastId });
      }
      
      setIsModalOpen(false);
      fetchPackages(); // Refresh data
    } catch (error) {
      toast.error("Terjadi kesalahan saat menyimpan data.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // HANDLER: DELETE PACKAGE
  // ==========================================
  const handleDelete = async (pkgId, pkgName) => {
    if (!window.confirm(`YAKIN MAU HAPUS PAKET "${pkgName}"?\nSemua aset di dalamnya akan hilang dari database![cite: 9]`)) return;

    const toastId = toast.loading("Menghapus paket...");
    try {
      // Tembak API Delete[cite: 9]
      await api.delete(`/admin/sprites/packages/${pkgId}`);
      toast.success("Paket berhasil dimusnahkan!", { id: toastId });
      fetchPackages();
    } catch (error) {
      toast.error("Gagal menghapus paket.", { id: toastId });
    }
  };

  return (
    <div className="flex-1 w-full bg-[#fbf9f7] min-h-screen font-sans flex flex-col relative pb-32">
      
      {/* HEADER ADMIN */}
      <div className="sticky top-0 z-30 bg-gray-900 px-6 py-5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/admin")}
            className="p-2 -ml-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors text-gray-300 border border-gray-700"
          >
            <FiArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3 text-white">
            <FiPackage size={24} className="text-yellow-400" />
            <h1 className="text-xl font-black tracking-widest uppercase">Katalog Kosmetik</h1>
          </div>
        </div>
        <button 
          onClick={() => handleOpenModal("create")}
          className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-4 py-2 rounded-xl font-black text-sm flex items-center gap-2 transition-transform active:scale-95 shadow-sm"
        >
          <FiPlus size={18} strokeWidth={3} /> <span className="hidden md:inline">Paket Baru</span>
        </button>
      </div>

      <div className="px-6 py-8 max-w-7xl mx-auto w-full">
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-yellow-400 rounded-full animate-spin"></div>
            <p className="mt-4 font-bold text-gray-400">Memuat lemari pakaian Youri...</p>
          </div>
        ) : packages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-gray-100 border-dashed">
            <FiPackage size={48} className="text-gray-300 mb-4" />
            <h2 className="text-lg font-black text-gray-800">Lemari Masih Kosong!</h2>
            <p className="text-sm font-medium text-gray-500 mb-6">Belum ada paket kosmetik yang ditambahkan.</p>
            <button onClick={() => handleOpenModal("create")} className="bg-yellow-400 text-gray-900 px-6 py-3 rounded-xl font-black flex items-center gap-2 shadow-sm hover:scale-105 transition-transform">
              <FiPlus size={20} /> Buat Paket Pertamamu
            </button>
          </div>
        ) : (
          /* GRID LAYOUT INVENTORY ITEM */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {packages.map((pkg) => (
              <div 
                key={pkg.package_id} 
                className={`bg-white rounded-[24px] p-5 shadow-sm border-2 transition-all flex flex-col group ${
                  pkg.is_active ? 'border-gray-100 hover:border-yellow-400' : 'border-gray-200 opacity-75 grayscale-[30%]'
                }`}
              >
                {/* Badge Status & Level */}
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1.5 border ${
                    pkg.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-100 text-gray-500 border-gray-200'
                  }`}>
                    {pkg.is_active ? <FiToggleRight size={14} /> : <FiToggleLeft size={14} />}
                    {pkg.is_active ? 'Aktif' : 'Draft'}
                  </div>
                  
                  <div className="flex items-center gap-1 bg-yellow-50 text-yellow-600 px-2.5 py-1 rounded-lg text-xs font-black border border-yellow-100">
                    <FiStar size={12} /> Lvl {pkg.unlock_at}
                  </div>
                </div>

                {/* Info Utama */}
                <h3 className="font-black text-lg text-gray-800 mb-1">{pkg.package_name}</h3>
                <p className="text-xs font-bold text-gray-400 font-mono mb-4">{pkg.package_id}</p>

                {/* Info Aset[cite: 9] */}
                <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3 mb-5 border border-gray-100">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-gray-400 shadow-sm">
                    <FiImage size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500">Jumlah Aset</p>
                    <p className="text-sm font-black text-gray-800">{pkg.assets_count} <span className="text-xs font-medium text-gray-400">Sprite</span></p>
                  </div>
                </div>

                {/* Tombol Aksi */}
                <div className="mt-auto grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => navigate(`/admin/sprites/${pkg.package_id}`)}
                    className="col-span-2 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold text-sm transition-colors flex justify-center items-center gap-2"
                  >
                    <FiImage size={16} /> Kelola Aset
                  </button>
                  <button 
                    onClick={() => handleOpenModal("edit", pkg)}
                    className="py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-xl font-bold text-sm transition-colors flex justify-center items-center gap-2"
                  >
                    <FiEdit2 size={16} /> Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(pkg.package_id, pkg.package_name)}
                    className="py-2.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl font-bold text-sm transition-colors flex justify-center items-center gap-2"
                  >
                    <FiTrash2 size={16} /> Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ==========================================
          MODAL FORM (CREATE / EDIT METADATA)
          ========================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl relative">
            <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-2">
              {modalMode === "create" ? <><FiPlus className="text-yellow-500" /> Buat Paket Baru</> : <><FiEdit2 className="text-amber-500" /> Edit Metadata</>}
            </h2>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider">Nama Kosmetik</label>
                <input 
                  type="text" 
                  value={formData.package_name}
                  onChange={(e) => setFormData({...formData, package_name: e.target.value})}
                  placeholder="Misal: Baju Lebaran 2026"
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-gray-500 uppercase tracking-wider">Syarat Level (Unlock At)</label>
                <div className="flex items-center relative">
                  <FiStar className="absolute left-4 text-yellow-500" size={18} />
                  <input 
                    type="number" 
                    min="0"
                    value={formData.unlock_at}
                    onChange={(e) => setFormData({...formData, unlock_at: parseInt(e.target.value) || 0})}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-yellow-400 transition-all"
                    required
                  />
                </div>
                <p className="text-[10px] font-bold text-gray-400 mt-1">Set ke 1 jika ingin langsung tersedia dari awal main.</p>
              </div>

              <label className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="flex flex-col">
                  <span className="text-sm font-black text-gray-700">Status Aktif</span>
                  <span className="text-xs font-bold text-gray-400">Tampilkan di inventory user</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="w-5 h-5 rounded text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                />
              </label>

              <div className="flex gap-3 mt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold text-sm transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="flex-[1.5] py-3.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-xl font-black text-sm shadow-[0_8px_20px_rgba(250,204,21,0.3)] transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Paket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminSprites;