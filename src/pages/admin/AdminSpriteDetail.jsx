import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";
import axios from "axios";
import ImageWithFallback from "../../components/ImageWithFallback";

import {
  FiArrowLeft,
  FiImage,
  FiUploadCloud,
  FiTrash2,
  FiStar,
  FiToggleRight,
  FiToggleLeft,
} from "react-icons/fi";

const AdminSpritesDetail = () => {
  const { package_id } = useParams();
  const navigate = useNavigate();

  // 🌸 STATE DATA
  const [pkg, setPkg] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fileInputRef = useRef(null);
  const [uploadingAssetKey, setUploadingAssetKey] = useState(null);

  // 🌸 BLUEPRINT ASSET STATIS (Sesuai kebutuhan Maskot Youri)
  const REQUIRED_ASSETS = [
    { key: "badge", label: "Lencana Level (Badge)", type: "icon" },
    { key: "start_button", label: "Tombol Mulai (Start)", type: "ui" },
    { key: "happy", label: "Pose: Senang (Happy)", type: "character" },
    { key: "thinking", label: "Pose: Berpikir (Thinking)", type: "character" },
    { key: "fail", label: "Pose: Gagal (Fail)", type: "character" },
  ];

  // ==========================================
  // FETCH DATA: GET SPECIFIC PACKAGE DETAIL
  // ==========================================
  useEffect(() => {
    const fetchPackageDetail = async () => {
      try {
        const response = await api.get(`/admin/sprites/packages/${package_id}`);
        setPkg(response.data.data);
      } catch (error) {
        console.error("Fetch Package Detail Error:", error);
        toast.error("Gagal memuat detail paket.");
        navigate("/admin/sprites"); // Tendang balik kalau tidak ketemu
      } finally {
        setIsLoading(false);
      }
    };

    fetchPackageDetail();
  }, [package_id, navigate]);

  // ==========================================
  // HANDLERS CUD (CREATE, UPDATE, DELETE) ASET
  // ==========================================

  // 1. Memicu Jendela Pemilihan File
  const handleUploadClick = (assetKey) => {
    setUploadingAssetKey(assetKey); // Ingat slot mana yang mau diisi
    fileInputRef.current.click(); // Buka paksa dialog file
  };

  // 2. Mengeksekusi Upload & Update DB
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !uploadingAssetKey) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran gambar maksimal 2MB ya, Chef!");
      e.target.value = null; // Reset
      return;
    }

    const toastId = toast.loading(`Mengunggah pose ${uploadingAssetKey}...`);

    try {
      // A. Minta Signature ke Backend
      // (Sesuaikan rute '/admin/upload/bulk-signatures' dengan router Express Senpai)
      const sigPayload = {
        files: [
          {
            sprite_name: uploadingAssetKey,
            folder_path: `Youri/youri_sprites/${package_id}`,
          },
        ],
      };
      const sigRes = await api.post("/admin/upload/bulk-signatures", sigPayload);
      const { signature, timestamp, api_key, cloud_name, folder, public_id } =
        sigRes.data.data[0];

      // B. Upload ke Cloudinary (Pastikan overwrite & invalidate ikut dikirim!)
      const formImage = new FormData();
      formImage.append("file", file);
      formImage.append("api_key", api_key);
      formImage.append("timestamp", timestamp);
      formImage.append("signature", signature);
      formImage.append("folder", folder);
      formImage.append("public_id", public_id);
      formImage.append("overwrite", "true");
      formImage.append("invalidate", "true");

      const uploadRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
        formImage,
      );

      const newImageUrl = uploadRes.data.secure_url;

      // C. Simpan URL baru ke Database MongoDB
      const savePayload = {
        assets: [{ sprite_name: uploadingAssetKey, url: newImageUrl }],
      };
      await api.post(
        `/admin/sprites/packages/${package_id}/assets/bulk`,
        savePayload,
      );

      // D. Update UI Lokal (Optimistic Update)
      setPkg((prev) => ({
        ...prev,
        assets: {
          ...prev.assets,
          [uploadingAssetKey]: newImageUrl,
        },
      }));

      toast.success(`Aset ${uploadingAssetKey} berhasil disimpan!`, {
        id: toastId,
      });
    } catch (error) {
      console.error("Upload Asset Error:", error);
      toast.error("Gagal mengunggah aset ke awan.", { id: toastId });
    } finally {
      e.target.value = null; // Bersihkan memori input
      setUploadingAssetKey(null);
    }
  };

  // 3. Menghapus Aset dari Database
  const handleDeleteClick = async (assetKey) => {
    if (
      !window.confirm(
        `Yakin ingin menghapus pose "${assetKey}"? Gambar akan hilang dari sistem.`,
      )
    )
      return;

    const toastId = toast.loading(`Membakar pose ${assetKey}...`);
    try {
      // (Sesuaikan rute delete ini dengan router Express Senpai)
      await api.delete(
        `/admin/sprites/packages/${package_id}/assets/${assetKey}`,
      );

      // Update UI Lokal: Gunting properti tersebut dari object state
      setPkg((prev) => {
        const newAssets = { ...prev.assets };
        delete newAssets[assetKey];
        return { ...prev, assets: newAssets };
      });

      toast.success(`Aset ${assetKey} berhasil dihanguskan!`, { id: toastId });
    } catch (error) {
      console.error("Delete Asset Error:", error);
      toast.error("Gagal menghapus aset.", { id: toastId });
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 w-full bg-[#fbf9f7] min-h-screen flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-yellow-400 rounded-full animate-spin"></div>
        <p className="mt-4 font-bold text-gray-400">
          Membongkar koper Youri...
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full bg-[#fbf9f7] min-h-screen font-sans flex flex-col relative pb-32">
      <input
        type="file"
        accept="image/png, image/jpeg, image/webp, image/svg+xml, .svg"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* HEADER ADMIN */}
      <div className="sticky top-0 z-30 bg-gray-900 px-6 py-5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/sprites")}
            className="p-2 -ml-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors text-gray-300 border border-gray-700"
          >
            <FiArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3 text-white">
            <FiImage size={24} className="text-yellow-400" />
            <div className="flex flex-col">
              <h1 className="text-lg font-black tracking-widest uppercase leading-tight">
                Kelola Aset
              </h1>
              <span className="text-[10px] text-gray-400 font-mono">
                {pkg.package_id}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 max-w-5xl mx-auto w-full flex flex-col gap-8">
        {/* PANEL INFO PAKET */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-black text-gray-800 mb-2">
              {pkg.package_name}
            </h2>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-yellow-50 text-yellow-600 px-3 py-1.5 rounded-lg text-sm font-black border border-yellow-100">
                <FiStar size={16} /> Lvl {pkg.unlock_at}
              </div>
              <div
                className={`px-3 py-1.5 rounded-lg text-sm font-black uppercase flex items-center gap-1.5 border ${
                  pkg.is_active
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                    : "bg-gray-100 text-gray-500 border-gray-200"
                }`}
              >
                {pkg.is_active ? (
                  <FiToggleRight size={18} />
                ) : (
                  <FiToggleLeft size={18} />
                )}
                {pkg.is_active ? "Status Aktif" : "Status Draft"}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center gap-4 shrink-0">
            <div className="text-center">
              <p className="text-3xl font-black text-gray-800">
                {Object.keys(pkg.assets).length}
                <span className="text-lg text-gray-400">/5</span>
              </p>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
                Aset Terisi
              </p>
            </div>
          </div>
        </div>

        {/* GRID SLOT ASSET */}
        <div>
          <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
            <FiImage className="text-yellow-500" /> Slot Aset Kosmetik
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {REQUIRED_ASSETS.map((asset) => {
              const currentAssetUrl = pkg.assets[asset.key];
              const isFilled = !!currentAssetUrl;

              return (
                <div
                  key={asset.key}
                  className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col group hover:shadow-md transition-all"
                >
                  {/* Info Header Slot */}
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-black text-gray-700">
                      {asset.label}
                    </span>
                    {isFilled ? (
                      <span
                        className="w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                        title="Aset Terisi"
                      ></span>
                    ) : (
                      <span
                        className="w-2.5 h-2.5 bg-red-400 rounded-full shadow-[0_0_8px_rgba(248,113,113,0.6)]"
                        title="Aset Kosong"
                      ></span>
                    )}
                  </div>

                  {/* Area Gambar / Placeholder */}
                  <div
                    className={`w-full aspect-square rounded-2xl mb-4 flex items-center justify-center overflow-hidden relative ${
                      isFilled
                        ? "bg-gray-50 border border-gray-100"
                        : "bg-gray-50 border-2 border-dashed border-gray-300"
                    }`}
                  >
                    {isFilled ? (
                      <ImageWithFallback
                        src={currentAssetUrl}
                        className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                        fallbackText={asset.key}
                      />
                    ) : (
                      <div className="flex flex-col items-center text-gray-400">
                        <FiImage size={40} className="mb-2 opacity-50" />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          KOSONG
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-auto flex gap-2">
                    <button
                      onClick={() => handleUploadClick(asset.key)}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
                        isFilled
                          ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                          : "bg-yellow-400 text-gray-900 hover:bg-yellow-500 shadow-sm"
                      }`}
                    >
                      <FiUploadCloud size={16} strokeWidth={2.5} />
                      {isFilled ? "Ganti" : "Upload File"}
                    </button>

                    {isFilled && (
                      <button
                        onClick={() => handleDeleteClick(asset.key)}
                        className="w-12 shrink-0 py-2.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center"
                        title="Hapus Aset"
                      >
                        <FiTrash2 size={16} strokeWidth={2.5} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSpritesDetail;
