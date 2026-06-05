import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";

import {
  FiArrowLeft,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiClock,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import ImageWithFallback from "../../components/ImageWithFallback";

const MyRecipes = () => {
  const navigate = useNavigate();

  // State Data
  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    recipeId: null,
  });

  // State Search & Pagination
  const [searchInput, setSearchInput] = useState(""); // Untuk form input
  const [activeSearch, setActiveSearch] = useState(""); // Pencarian yang sedang aktif
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Bungkus fetch dengan useCallback agar aman dari Linter
  useEffect(() => {
    const fetchMyRecipes = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(
          `/user/recipes?search=${activeSearch}&page=${page}&limit=12`,
        );
        setRecipes(response.data.data);
        setTotalPages(response.data.pagination.total_pages || 1);
      } catch (error) {
        toast.error("Gagal memuat daftar resepmu.");
        console.error("Fetch My Recipes Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Langsung eksekusi fungsinya
    fetchMyRecipes();
  }, [activeSearch, page]); // 👈 Linter sangat menyukai array dependencies yang bersih seperti ini!

  // Handler Pencarian
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1); // Reset ke halaman 1 setiap kali mencari kata baru
    setActiveSearch(searchInput);
  };

  // ==========================================
  // HANDLER HAPUS RESEP
  // ==========================================
  const handleDeleteClick = (id) => {
    // 1. Buka modal dan simpan ID target
    setDeleteModal({ isOpen: true, recipeId: id });
  };

  const confirmDelete = async () => {
    if (!deleteModal.recipeId) return;

    const toastId = toast.loading("Menghapus resep ke dimensi lain...");

    try {
      // 2. Tembak API Delete!
      await api.delete(`/user/recipes/${deleteModal.recipeId}`);

      toast.success("Resep berhasil musnah!", { id: toastId });

      // 3. Tutup modal lalu refresh daftar resep
      setDeleteModal({ isOpen: false, recipeId: null });
      // Optimasi: Hapus resep dari state tanpa perlu refetch seluruh daftar
      setRecipes((prev) =>
        prev.filter((r) => r.recipe_id !== deleteModal.recipeId),
      );
    } catch (error) {
      console.error("Delete Recipe Error:", error);
      toast.error(error.response?.data?.message || "Gagal menghapus resep.", {
        id: toastId,
      });
    }
  };

  return (
    <div className="flex-1 w-full bg-transparent text-gray-800 font-sans flex flex-col relative h-full">
      {/* HEADER STICKY */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md px-6 md:px-10 py-5 flex items-center justify-between border-b border-gray-100 shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 -ml-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-gray-600 border border-gray-100"
          >
            <FiArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-black text-gray-800 tracking-tight">
            Koleksi Resepmu
          </h1>
        </div>
      </div>

      {/* TOOLBAR: SEARCH BAR */}
      <div className="px-6 md:px-10 pt-6 pb-2 shrink-0">
        <form onSubmit={handleSearchSubmit} className="relative max-w-lg">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari resep buatanmu..."
            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:bg-white focus:border-[#C18A5E] focus:ring-2 focus:ring-[#C18A5E]/20 transition-all"
          />
          <FiSearch
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <button type="submit" className="hidden">
            Cari
          </button>
        </form>
      </div>

      {/* KONTEN UTAMA (SCROLLABLE AREA) */}
      <div className="px-6 md:px-10 py-6 flex-1 overflow-y-auto">
        {isLoading ? (
          // LOADING STATE
          <div className="px-6 md:px-10 pt-6 pb-32 flex-1 overflow-y-auto">
            <div className="w-10 h-10 border-4 border-[#E3CBB8] border-t-[#C18A5E] rounded-full animate-spin"></div>
          </div>
        ) : recipes.length === 0 ? (
          // EMPTY STATE
          <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50 rounded-3xl border border-gray-100 border-dashed">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-gray-400 mb-4 shadow-sm">
              <FiClock size={28} />
            </div>
            <h3 className="text-lg font-black text-gray-800 mb-2">
              Resep Tidak Ditemukan
            </h3>
            <p className="text-sm text-gray-500 font-medium">
              {activeSearch
                ? "Coba gunakan kata kunci pencarian yang lain."
                : "Kamu belum membuat resep satupun. Yuk mulai berkreasi!"}
            </p>
          </div>
        ) : (
          // COMPACT GRID LAYOUT (Super Rapi & Bersih!)
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            {recipes.map((recipe) => (
              <div
                key={recipe.recipe_id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3 hover:shadow-md hover:border-[#E3CBB8] transition-all group"
              >
                {/* 🌸 BAGIAN ATAS: Info Utama & Tombol (Rata Atas) */}
                <div className="flex items-start gap-4 w-full">
                  
                  {/* Thumbnail Kecil */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0 relative border border-gray-50">
                    <ImageWithFallback
                      src={recipe.image_url}
                      fallbackText={recipe.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Info Utama */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <h3
                      className="font-black text-base text-gray-800 truncate mb-1"
                      title={recipe.title}
                    >
                      {recipe.title}
                    </h3>
                    <p className="text-[10px] text-gray-400 font-bold tracking-wide mb-2.5">
                      {recipe.created_at}
                    </p>

                    <span
                      className={`text-[9px] font-black uppercase px-2.5 py-1 rounded border inline-block ${
                        recipe.status === "published"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : "bg-red-50 text-red-500 border-red-100"
                      }`}
                    >
                      {recipe.status === "published" ? "Published" : "Taken Down"}
                    </span>
                  </div>

                  {/* Action Buttons Horizontal (Pojok Kanan Atas) */}
                  <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                    <button
                      onClick={() => navigate(`/my-recipes/edit/${recipe.recipe_id}`)}
                      className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white shadow-sm transition-all duration-200 flex items-center justify-center"
                      title="Edit Resep"
                    >
                      <FiEdit2 size={14} strokeWidth={2.5} />
                    </button>

                    <button
                      onClick={() => handleDeleteClick(recipe.recipe_id)}
                      className="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-500 hover:text-white shadow-sm transition-all duration-200 flex items-center justify-center"
                      title="Hapus Resep"
                    >
                      <FiTrash2 size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>

                {/* 🌸 BAGIAN BAWAH: HINT TAKEDOWN DARI SENPAI */}
                {recipe.status === "taken_down" && (
                  <div className="mt-1 bg-red-50 p-3 rounded-xl border border-red-100 text-xs text-red-600 font-medium leading-relaxed w-full flex gap-2">
                    <span className="shrink-0 mt-0.5">⚠️</span>
                    <p>
                      <strong className="font-black">Resep Ditangguhkan.</strong> Silakan klik tombol <strong className="text-amber-600 bg-amber-100/50 px-1.5 py-0.5 rounded">Edit</strong> untuk melihat detail pelanggaran resep ini.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* PAGINATION CONTROLS */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8 pb-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:bg-gray-100 transition-all shadow-sm"
            >
              <FiChevronLeft size={20} />
            </button>
            <span className="text-sm font-bold text-gray-600">
              Halaman {page} dari {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:bg-gray-100 transition-all shadow-sm"
            >
              <FiChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      {/* FLOATING ACTION BUTTON (FAB) */}
      <Link
        to="/my-recipes/create"
        className="fixed bottom-24 right-6 md:bottom-10 md:right-12 w-14 h-14 md:w-16 md:h-16 bg-[#C18A5E] rounded-full flex justify-center items-center text-white shadow-[0_8px_20px_rgba(193,138,94,0.4)] hover:bg-[#a6744d] hover:scale-110 transition-all z-40 border-2 border-white"
      >
        <FiPlus size={28} />
      </Link>

      {/* ==========================================
          MODAL KONFIRMASI HAPUS
          ========================================== */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative flex flex-col items-center text-center">
            {/* Ikon Tempat Sampah Merah */}
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-inner border border-red-100">
              <FiTrash2 size={40} />
            </div>

            <h2 className="text-2xl font-black text-gray-800 mb-2">
              Hapus Resep?
            </h2>
            <p className="text-sm text-gray-500 font-medium leading-relaxed mb-8">
              Resep ini akan dihapus secara permanen dari buku resepmu. Kamu
              yakin ingin membuangnya?
            </p>

            <div className="flex gap-3 w-full">
              <button
                onClick={() =>
                  setDeleteModal({ isOpen: false, recipeId: null })
                }
                className="flex-1 py-4 rounded-2xl font-black text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all active:scale-95"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-4 rounded-2xl font-black text-white bg-red-500 hover:bg-red-600 shadow-[0_8px_20px_rgba(239,68,68,0.3)] transition-all active:scale-95"
              >
                Ya, Hapus!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRecipes;
