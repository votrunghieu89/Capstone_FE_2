import { 
  Clock, MapPin, CheckCircle, Phone, 
  Navigation, User, ChevronRight 
} from 'lucide-react';
import { motion } from 'framer-motion';

export function InProgress() {
  const currentJob = {
    id: 'JOB-9921',
    title: 'Sửa Điều Hòa Panasonic Inverter',
    customer: 'Nguyễn Văn B',
    customerPhone: '0905 123 456',
    address: '123 Đường Láng, Đống Đa, Hà Nội',
    startTime: '10:30 SA',
    status: 'Đang thi công',
  };

  const completedToday = [
    { id: 'JOB-9918', title: 'Lắp Đặt Vòi Nước Bếp', customer: 'Sarah Martinez', completedTime: '13:30' },
    { id: 'JOB-9917', title: 'Thay Thế Ổ Cắm Điện', customer: 'Michael Chen', completedTime: '09:45' },
  ];

  return (
    <div className="p-2 md:p-6 space-y-6 pb-20 overflow-x-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight uppercase">Công Việc Đang Thực Hiện</h1>
          <p className="text-muted-foreground text-sm mt-1 font-medium">Theo dõi tiến độ và thông tin khách hàng</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Job Card */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0f172a]/50 backdrop-blur-md rounded-[32px] border border-white/5 p-8 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8">
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                Đang Làm Việc
              </span>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-xs font-bold text-blue-500 uppercase tracking-widest">{currentJob.id}</p>
                <h2 className="text-3xl font-black text-foreground tracking-tight uppercase">{currentJob.title}</h2>
              </div>

              <div className="flex flex-wrap gap-6 items-center py-6 border-y border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                    <User className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Khách hàng</p>
                    <p className="text-base font-bold text-slate-200">{currentJob.customer}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                    <MapPin className="w-6 h-6 text-slate-400" />
                  </div>
                  <div className="max-w-[300px]">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Địa điểm</p>
                    <p className="text-sm font-bold text-slate-200">{currentJob.address}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <div className="bg-blue-500/5 rounded-2xl p-6 border border-blue-500/10">
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Trạng thái hệ thống</p>
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-bold text-slate-300">Đã thông báo "Thợ đang đến" cho khách hàng</span>
                    </div>
                </div>
              </div>
            </div>
          </motion.div>

          <h3 className="text-lg font-bold text-foreground pt-4">Tóm Tắt Hôm Nay</h3>
          <div className="space-y-3">
            {completedToday.map((job) => (
              <div key={job.id} className="bg-white/5 rounded-2xl border border-white/5 border-l-4 border-l-emerald-500 p-5 flex justify-between items-center group hover:bg-white/[0.08] transition-all">
                <div>
                  <h4 className="font-bold text-slate-200 group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{job.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 font-medium">{job.customer} • Hoàn thành lúc {job.completedTime}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <CheckCircle size={16} className="text-emerald-500" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          <div className="bg-[#0f172a]/50 backdrop-blur-md rounded-3xl border border-white/5 p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Liên lạc & Bản đồ</h3>
            <div className="flex flex-col gap-3">
              <a 
                href={`tel:${currentJob.customerPhone}`}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-blue-500 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-white group-hover:text-blue-500 transition-all">
                  <Phone size={18} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">Gọi điện</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase group-hover:text-blue-100 transition-colors">Khách hàng</p>
                </div>
              </a>
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentJob.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-purple-500 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:bg-white group-hover:text-purple-500 transition-all">
                  <Navigation size={18} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">Chỉ đường</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase group-hover:text-purple-100 transition-colors">Mở Bản Đồ</p>
                </div>
              </a>
            </div>
          </div>

          <div className="bg-[#0f172a]/50 backdrop-blur-md rounded-3xl border border-white/5 p-8 shadow-xl text-center space-y-6">
            <button className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-blue-600/30 hover:bg-blue-500 transition-all flex items-center justify-center gap-3">
              Hoàn thành công việc
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
