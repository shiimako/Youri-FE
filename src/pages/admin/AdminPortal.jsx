import { useNavigate } from "react-router-dom";
import {
  FiShield,
  FiImage,
  FiChevronRight,
  FiCommand,
  FiArrowLeft,
} from "react-icons/fi";

const AdminPortal = () => {
  const navigate = useNavigate();

  // Daftar Menu Portal Admin
  const adminMenus = [
    {
      id: "reports",
      title: "Moderasi Resep",
      description:
        "Tinjau laporan user, basmi resep spam, dan amankan dapur Youri.",
      icon: <FiShield size={32} />,
      color: "bg-red-50 text-red-500",
      borderHover: "hover:border-red-300 hover:shadow-red-500/10",
      route: "/admin/reports", // Sesuaikan dengan route Senpai nanti
      status: "Aktif",
      statusColor: "bg-red-100 text-red-600",
    },
    {
      id: "sprites",
      title: "Katalog Kosmetik",
      description:
        "Manajemen Sprite maskot, atur syarat level, dan upload aset gambar Youri.",
      icon: <FiImage size={32} />,
      color: "bg-indigo-50 text-indigo-500",
      borderHover: "hover:border-indigo-300 hover:shadow-indigo-500/10",
      route: "/admin/sprites",
      status: "Segera",
      statusColor: "bg-indigo-100 text-indigo-600",
    },
  ];

  return (
    <div className="flex-1 w-full bg-[#fbf9f7] min-h-screen font-sans flex flex-col relative pb-32 animate-fadeIn">
      {/* HEADER HERO ADMIN */}
      <div className="bg-gray-900 px-6 md:px-10 py-12 md:py-16 relative overflow-hidden shrink-0 shadow-lg">
        {/* Dekorasi Background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-[#C18A5E]/20 to-transparent rounded-full translate-y-1/2 -translate-x-1/4 blur-xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col gap-2 max-w-5xl mx-auto">
          <button
            onClick={() => navigate("/dashboard")} 
            className="w-fit p-2.5 mb-4 bg-gray-800/80 backdrop-blur-md hover:bg-gray-700 rounded-xl transition-colors text-gray-300 border border-gray-700 shadow-sm"
          >
            <FiArrowLeft size={20} />
          </button>

          <div className="flex items-center gap-3 text-yellow-400 mb-2">
            <FiCommand size={28} />
            <span className="font-black tracking-widest uppercase text-sm">
              Youri Control Center
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            Selamat Datang, Admin!
          </h1>
          <p className="text-gray-400 font-medium max-w-lg leading-relaxed mt-2">
            Pilih sektor mana yang ingin kamu kelola hari ini. Jaga dapur Youri
            tetap bersih, aman, dan menyenangkan untuk semua koki.
          </p>
        </div>
      </div>

      {/* GRID PORTAL MENU */}
      <div className="px-6 md:px-10 py-10 max-w-5xl mx-auto w-full -mt-8 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminMenus.map((menu) => (
            <div
              key={menu.id}
              onClick={() => menu.status !== "Dikunci" && navigate(menu.route)}
              className={`bg-white rounded-3xl p-6 border-2 border-gray-100 shadow-sm flex flex-col h-full transition-all duration-300 group
                ${menu.status !== "Dikunci" ? `cursor-pointer hover:-translate-y-1 hover:shadow-xl ${menu.borderHover}` : "opacity-60 grayscale-[30%] cursor-not-allowed"}
              `}
            >
              <div className="flex justify-between items-start mb-6">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-300 ${menu.color}`}
                >
                  {menu.icon}
                </div>
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${menu.statusColor}`}
                >
                  {menu.status}
                </span>
              </div>

              <h3 className="text-xl font-black text-gray-800 mb-2 group-hover:text-gray-900">
                {menu.title}
              </h3>
              <p className="text-sm text-gray-500 font-medium leading-relaxed flex-1">
                {menu.description}
              </p>

              <div className="mt-6 flex items-center gap-2 font-bold text-sm transition-colors opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 duration-300">
                {menu.status !== "Dikunci" ? (
                  <span
                    className={`flex items-center gap-1 ${menu.color.split(" ")[1]}`}
                  >
                    Buka Panel <FiChevronRight />
                  </span>
                ) : (
                  <span className="text-gray-400">Dalam Pengembangan</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;
