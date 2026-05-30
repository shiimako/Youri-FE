import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";
import {
  FiArrowLeft,
  FiEdit2,
  FiCheck,
  FiX,
  FiLock,
  FiCamera,
} from "react-icons/fi";
import ImageWithFallback from "../../components/ImageWithFallback";
import axios from "axios";

const Profile = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // State Utama Profil
  const [profile, setProfile] = useState({
    username: "",
    email: "",
    avatar_url: "",
  });

  // State untuk Mode Edit Profil
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ username: "", avatar_url: "" });

  // 🛡️ STATE BARU: Penyelamat dari Kasus Desinkronisasi
  const [selectedFile, setSelectedFile] = useState(null); // Menyimpan file asli mentah
  const [previewUrl, setPreviewUrl] = useState("");      // Menyimpan URL blob lokal untuk preview

  // State untuk Modal Password
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  // 1. Fetch Data Profil saat komponen di-mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/user/profile");
        const userData = response.data.data;
        setProfile({
          username: userData.username,
          email: userData.email,
          avatar_url: userData.avatar_url,
        });
        setEditForm({ 
          username: userData.username, 
          avatar_url: userData.avatar_url 
        });
      } catch (error) {
        toast.error("Gagal memuat data profil.");
        console.error("Fetch Profile Error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // 2. Handler Ganti Gambar (Hanya Preview Lokal, Gak Langsung Upload!)
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validasi ukuran (Maksimal 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return toast.error("Ukuran gambar maksimal 5MB ya, Chef!");
    }

    // Buat URL palsu sementara di memory browser untuk preview
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    toast.success("Pratinjau foto dimuat! Jangan lupa klik Simpan.");
  };

  // 3. Handler Simpan Profil (Proses Upload Cloudinary Dilakukan di Sini)
  const handleSaveProfile = async () => {
    if (editForm.username.length < 3) {
      return toast.error("Username minimal 3 karakter ya!");
    }

    const toastId = toast.loading("Menyimpan perubahan...");
    setIsUploading(true);
    let finalAvatarUrl = editForm.avatar_url;

    try {
      // ⚡ JIKA USER MEMILIH FOTO BARU, EKSEKUSI UPLOAD SEKARANG!
      if (selectedFile) {
        toast.loading("Mengunggah foto baru ke Cloudinary...", { id: toastId });
        
        // A. Minta Signature ke Backend
        const sigResponse = await api.get("/user/profile-upload-signature");
        const { signature, timestamp, api_key, cloud_name, folder, public_id } = sigResponse.data.data;

        // B. Siapkan koper FormData
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("api_key", api_key);
        formData.append("timestamp", timestamp);
        formData.append("signature", signature);
        formData.append("folder", folder);
        formData.append("public_id", public_id);
        formData.append("overwrite", "true");
        formData.append("invalidate", "true");

        // C. Tembak langsung ke Cloudinary
        const uploadRes = await axios.post(
          `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
          formData
        );

        // Ambil URL aman yang baru dari Cloudinary
        finalAvatarUrl = uploadRes.data.secure_url;
      }

      // D. Tembak PATCH ke Backend dengan URL Final (Bisa URL lama atau URL baru hasil upload)
      toast.loading("Memperbarui database...", { id: toastId });
      await api.patch("/user/profile", { 
        username: editForm.username,
        avatar_url: finalAvatarUrl
      });

      // Update state utama jika seluruh proses di atas sukses tanpa interupsi
      setProfile((prev) => ({ 
        ...prev, 
        username: editForm.username,
        avatar_url: finalAvatarUrl
      }));
      
      // Bersihkan memory preview lokal agar tidak bocor
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setSelectedFile(null);
      setPreviewUrl("");
      setIsEditing(false);
      
      toast.success("Profil berhasil diperbarui!", { id: toastId });
    } catch (error) {
      console.error("Save Profile Error:", error);
      const errorMsg = error.response?.data?.errors?.username?.[0] || "Gagal memperbarui profil.";
      toast.error(errorMsg, { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  // 4. Handler Simpan Password Baru
  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      return toast.error("Kata sandi baru dan konfirmasi tidak cocok!");
    }

    const toastId = toast.loading("Mengubah kata sandi...");

    try {
      await api.patch("/user/change-password", {
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
      });

      toast.success("Kata sandi berhasil diubah!", { id: toastId });
      setIsModalOpen(false);
      setPasswordForm({
        old_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (error) {
      let errorMsg = "Gagal mengubah kata sandi.";

      if (axios.isAxiosError(error)) {
        errorMsg =
          error.response?.data?.errors?.old_password?.[0] ||
          error.response?.data?.errors?.new_password?.[0] ||
          errorMsg;
      }

      toast.error(errorMsg, { id: toastId });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fbf9f7] flex justify-center items-center">
        <p className="animate-pulse font-bold text-[#C18A5E]">
          Memuat Profil...
        </p>
      </div>
    );
  }

  // 🔥 LOGIKA PRIORITAS AVATAR: Preview Lokal > Edit Form URL > Database URL
  const currentAvatar = isEditing 
    ? (previewUrl || editForm.avatar_url) 
    : profile.avatar_url;

  return (
    <div className="min-h-screen bg-[#fbf9f7] text-gray-800 font-sans flex flex-col items-center pt-6 px-4 pb-32 overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] overflow-hidden border border-gray-100 shrink-0 mb-8">
        
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between border-b border-gray-50">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
          >
            <FiArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-gray-800">Profile</h1>
          <div className="w-8"></div>
        </div>

        <div className="px-8 py-8 flex flex-col items-center">
          
          {/* Avatar Section */}
          <div className="relative group mb-8">
            <div className={`w-28 h-28 rounded-full border-4 border-white shadow-lg overflow-hidden flex items-center justify-center ${!currentAvatar ? 'bg-[#E3CBB8]' : ''}`}>
              {currentAvatar ? (
                <ImageWithFallback
                  src={currentAvatar}
                  fallbackText={profile.username.slice(0, 2).toUpperCase()}
                  className={`w-full h-full object-cover transition-all ${isUploading ? 'opacity-50 blur-sm' : ''}`}
                />
              ) : (
                <span className="text-3xl font-bold text-white uppercase">
                  {profile.username.slice(0, 2)}
                </span>
              )}
            </div>
            
            {isEditing && (
              <>
                <button 
                  disabled={isUploading}
                  onClick={() => fileInputRef.current.click()}
                  className="absolute bottom-0 right-0 bg-[#C18A5E] p-2.5 rounded-full text-white shadow-md hover:bg-[#a6744d] transition-all disabled:opacity-50"
                >
                  <FiCamera size={18} className={isUploading ? "animate-pulse" : ""} />
                </button>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleImageChange}
                />
              </>
            )}
          </div>

          {/* Form Fields */}
          <div className="w-full space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                Nama
              </label>
              <div className="relative">
                <input
                  type="text"
                  disabled={!isEditing}
                  value={isEditing ? editForm.username : profile.username}
                  onChange={(e) =>
                    setEditForm({ ...editForm, username: e.target.value })
                  }
                  className={`w-full px-4 py-3.5 rounded-xl border transition-all outline-none
                    ${
                      isEditing
                        ? "bg-white border-[#C18A5E] focus:ring-4 focus:ring-[#C18A5E]/20 text-gray-800"
                        : "bg-gray-50 border-transparent text-gray-600"
                    }`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                Email
              </label>
              <input
                type="email"
                disabled
                value={profile.email}
                className="w-full bg-gray-50 text-gray-500 border-transparent px-4 py-3.5 rounded-xl outline-none opacity-80 cursor-not-allowed"
              />
            </div>

            {!isEditing && (
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                  Keamanan
                </label>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 hover:bg-[#E3CBB8]/30 border border-transparent rounded-xl transition-colors text-left group"
                >
                  <span className="text-gray-600 font-medium">••••••••</span>
                  <div className="flex items-center gap-2 text-xs font-bold text-[#C18A5E]">
                    <FiLock size={14} /> Ubah Sandi
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="w-full mt-10">
            {isEditing ? (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    // 🛡️ BERSIHKAN PREVIEW JIKA USER BATAL
                    if (previewUrl) URL.revokeObjectURL(previewUrl);
                    setSelectedFile(null);
                    setPreviewUrl("");
                    setEditForm({ 
                      username: profile.username,
                      avatar_url: profile.avatar_url 
                    });
                  }}
                  className="flex-1 py-3.5 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  <FiX size={18} /> Batal
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isUploading}
                  className="flex-1 py-3.5 rounded-xl font-bold text-white bg-[#C18A5E] shadow-lg shadow-[#C18A5E]/30 hover:bg-[#a6744d] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <FiCheck size={18} /> Simpan
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full py-3.5 rounded-xl font-bold text-[#C18A5E] bg-[#E3CBB8]/30 hover:bg-[#E3CBB8]/50 transition-colors flex items-center justify-center gap-2"
              >
                <FiEdit2 size={18} /> Edit Profil
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal Ubah Sandi */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <FiLock className="text-[#C18A5E]" /> Ubah Kata Sandi
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">Sandi Lama</label>
                <input
                  type="password" required
                  value={passwordForm.old_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value }) }
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#C18A5E] focus:ring-2 focus:ring-[#C18A5E]/20 outline-none transition-all text-sm"
                  placeholder="Masukkan sandi saat ini"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">Sandi Baru</label>
                <input
                  type="password" required minLength="8"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value }) }
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#C18A5E] focus:ring-2 focus:ring-[#C18A5E]/20 outline-none transition-all text-sm"
                  placeholder="Minimal 8 karakter"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">Konfirmasi Sandi Baru</label>
                <input
                  type="password" required minLength="8"
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value }) }
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#C18A5E] focus:ring-2 focus:ring-[#C18A5E]/20 outline-none transition-all text-sm"
                  placeholder="Ketik ulang sandi baru"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-[#C18A5E] shadow-md shadow-[#C18A5E]/30 hover:bg-[#a6744d] transition-all"
                >
                  Ubah Sandi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;