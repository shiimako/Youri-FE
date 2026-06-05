import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";

import { 
  FiShield, FiTrash2, FiX, FiArrowLeft,
  FiExternalLink, FiChevronLeft, FiChevronRight 
} from "react-icons/fi";

const AdminReports = () => {
  const navigate = useNavigate();

  // 🌸 STATE: DATA LAPORAN & PAGINATION
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // 🌸 STATE: MODAL TAKEDOWN
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [customMessage, setCustomMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Data Laporan (Dengan Pagination)
  const fetchReports = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await api.get(`/admin/reports?status=unsolved&page=${page}&limit=10`);
      setReports(res.data.data);
      setTotalPages(res.data.meta.total_pages);
      setCurrentPage(res.data.meta.current_page);
      setTotalItems(res.data.meta.total_items);
    } catch (error) {
      toast.error("Gagal memuat daftar laporan");
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger fetch setiap kali currentPage berubah
  useEffect(() => {
    fetchReports(currentPage);
  }, [currentPage]);

  // ==========================================
  // HANDLERS EKSUSI ADMIN
  // ==========================================
  
  const handleIgnoreReport = async (reportId) => {
    if(!window.confirm("Yakin ingin mengabaikan laporan ini?")) return;
    
    const toastId = toast.loading("Menolak laporan...");
    try {
      await api.post(`/admin/reports/${reportId}/action`, { action: "ignore_report" });
      toast.success("Laporan diabaikan.", { id: toastId });
      
      // Jika data habis di halaman ini (karena di-ignore), pindah ke halaman sebelumnya
      if (reports.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        fetchReports(currentPage); 
      }
    } catch (error) {
      toast.error("Gagal menolak laporan", { id: toastId });
    }
  };

  const handleOpenTakedownModal = (report) => {
    setSelectedReport(report);
    setCustomMessage("");
    setIsModalOpen(true);
  };

  const handleSubmitTakedown = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const toastId = toast.loading("Mengeksekusi hukuman...");
    
    try {
      await api.post(`/admin/reports/${selectedReport.report_id}/action`, { 
        action: "takedown_recipe",
        custom_message: customMessage 
      });
      
      toast.success("Resep berhasil di-takedown!", { id: toastId });
      setIsModalOpen(false);
      
      // Refresh logic sama seperti ignore
      if (reports.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        fetchReports(currentPage);
      }
    } catch (error) {
      toast.error("Eksekusi gagal dilakukan", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 w-full bg-[#fbf9f7] min-h-screen font-sans flex flex-col relative pb-32">
      
      {/* HEADER KHUSUS ADMIN (Dengan Tombol Back) */}
      <div className="sticky top-0 z-30 bg-gray-900 px-6 py-5 flex items-center gap-4 shadow-md">
        <button 
          onClick={() => navigate("/admin")} // Kembali ke Admin Portal
          className="p-2 -ml-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors text-gray-300 border border-gray-700"
        >
          <FiArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3 text-white">
          <FiShield size={24} className="text-red-400" />
          <h1 className="text-xl font-black tracking-widest uppercase">Moderasi Resep</h1>
        </div>
      </div>

      <div className="px-6 py-8 max-w-6xl mx-auto w-full flex flex-col gap-6">
        
        {/* === KONTEN: LAPORAN RESEP === */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-fadeIn">
          
          <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
              Menunggu Tinjauan <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">{totalItems}</span>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold border-b border-gray-100">Resep & Pelapor</th>
                  <th className="px-6 py-4 font-bold border-b border-gray-100">Kategori Pelanggaran</th>
                  <th className="px-6 py-4 font-bold border-b border-gray-100">Alasan Spesifik</th>
                  <th className="px-6 py-4 font-bold border-b border-gray-100 text-center">Aksi Admin</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="4" className="text-center py-20 text-gray-400 font-bold">Mengambil data intelijen...</td>
                  </tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-20 text-gray-400 font-bold">Semua resep aman terkendali! ✨</td>
                  </tr>
                ) : (
                  reports.map(report => (
                    <tr key={report.report_id} className="hover:bg-gray-50 transition-colors group">
                      
                      {/* Info Resep & Pelapor */}
                      <td className="px-6 py-5 border-b border-gray-50">
                        {report.recipe_id ? (
                          <Link to={`/cooking/recipe/${report.recipe_id}`} className="text-sm font-black text-gray-800 hover:text-red-500 flex items-center gap-1.5 transition-colors">
                            {report.recipe_name} <FiExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        ) : (
                          <span className="text-sm font-black text-gray-400 line-through">{report.recipe_name}</span>
                        )}
                        <div className="text-xs font-bold text-gray-500 mt-1">Dilaporkan oleh: <span className="text-indigo-500">@{report.reporter_name}</span></div>
                      </td>

                      {/* Kategori */}
                      <td className="px-6 py-5 border-b border-gray-50">
                        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wide">
                          {report.category}
                        </span>
                      </td>

                      {/* Alasan */}
                      <td className="px-6 py-5 border-b border-gray-50 max-w-xs">
                        <p className="text-sm text-gray-600 font-medium truncate" title={report.reason}>
                          "{report.reason}"
                        </p>
                      </td>

                      {/* Aksi */}
                      <td className="px-6 py-5 border-b border-gray-50">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleIgnoreReport(report.report_id)}
                            className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl transition-colors tooltip" title="Abaikan (Tolak Laporan)"
                          >
                            <FiX size={18} strokeWidth={3} />
                          </button>
                          <button 
                            onClick={() => handleOpenTakedownModal(report)}
                            className="p-2.5 bg-red-100 hover:bg-red-500 text-red-600 hover:text-white rounded-xl transition-colors shadow-sm" title="Takedown Resep"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* === KONTROL PAGINATION === */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <button 
                disabled={currentPage === 1 || isLoading}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiChevronLeft /> Prev
              </button>
              
              <span className="text-sm font-bold text-gray-500">
                Halaman {currentPage} dari {totalPages}
              </span>

              <button 
                disabled={currentPage === totalPages || isLoading}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next <FiChevronRight />
              </button>
            </div>
          )}

        </div>
      </div>

      {/* ==========================================
          MODAL ADMIN TAKEDOWN (RESOLVE)
          ========================================== */}
      {isModalOpen && selectedReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl relative border-t-8 border-red-500">
            
            <h2 className="text-2xl font-black text-gray-800 mb-2">Takedown Resep</h2>
            <p className="text-xs text-gray-500 font-medium mb-6 leading-relaxed">
              Resep <strong className="text-gray-800">"{selectedReport.recipe_name}"</strong> akan dihapus, pelapor akan mendapat XP, dan notifikasi pelanggaran akan dikirim ke pemilik resep.
            </p>
            
            <form onSubmit={handleSubmitTakedown} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-700 flex justify-between">
                  Pesan Khusus untuk Author 
                  <span className="text-gray-400 font-medium">(Opsional)</span>
                </label>
                <textarea 
                  rows="3" 
                  placeholder="Kosongkan untuk menggunakan template pesan otomatis..." 
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full px-4 py-3 bg-red-50/50 border border-red-200 rounded-xl text-sm font-medium focus:outline-none focus:border-red-500 resize-none"
                ></textarea>
                <span className="text-[10px] text-gray-400 italic">
                  Template default: "...karena {selectedReport.category === 'spam' ? 'mengandung unsur spam' : 'melanggar panduan komunitas'}."
                </span>
              </div>

              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold text-sm transition-colors">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-[1.5] py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-sm shadow-[0_8px_20px_rgba(220,38,38,0.3)] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSubmitting ? "Mengeksekusi..." : <><FiTrash2 /> Eksekusi Takedown</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminReports;