import { MapPin, CheckCircle, Navigation, Camera, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export function NewRequests() {
  const navigate = useNavigate();

  const requests = [
    { 
      id: 1, 
      title: 'SỬA ĐIỀU HÒA', 
      createdAt: '10 phút trước',
      description: 'Máy lạnh phát ra tiếng lạ, cần sự chú ý ngay lập tức. Có mùi khét nhẹ khi khởi động. Khách hàng báo cáo máy điều hòa Daikin Inverter phát ra tiếng kêu to và có mùi khét. Cần kiểm tra bảng mạch và motor quạt.', 
      location: '123 Đường Láng, Đống Đa, Hà Nội', 
      distance: 2.3, 
      image: 'https://images.unsplash.com/photo-1581094288338-2314dddb7bc3?w=800&auto=format&fit=crop'
    },
    { 
      id: 2, 
      title: 'SỬA BÌNH NÓNG LẠNH', 
      createdAt: '25 phút trước',
      description: 'Cần lắp đặt bình nước nóng 50 gallon mới. Đã có sẵn thiết bị. Yêu cầu thợ có tay nghề lắp đặt bình nóng lạnh Ariston 50L. Vị trí lắp đặt đã có đường ống chờ sẵn.', 
      location: '456 Nguyễn Trãi, Thanh Xuân, Hà Nội', 
      distance: 5.1,
      image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop'
    },
    { 
      id: 3, 
      title: 'KIỂM TRA TỦ ĐIỆN', 
      createdAt: '1 giờ trước',
      description: 'Kiểm tra an toàn hàng năm cần thiết cho tài sản thương mại. Kiểm tra định kỳ hệ thống tủ điện phân phối cho tòa nhà 3 tầng. Cần đo điện trở cách điện, kiểm tra độ chặt của các tiếp điểm.', 
      location: '89 Cầu Giấy, Hà Nội', 
      distance: 8.4,
      image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop'
    },
  ];

  const handleAccept = () => {
    // Giả lập nhận việc thành công
    navigate('/technician/don-hang/da-tiep-nhan');
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="p-2 md:p-6 space-y-8 pb-20 relative overflow-x-hidden">
      <div>
        <h1 className="text-3xl font-black text-foreground uppercase tracking-tighter">Yêu Cầu Mới</h1>
        <p className="text-muted-foreground text-sm mt-1 font-medium">Khám phá các cơ hội việc làm xung quanh bạn</p>
      </div>

      {/* Requests List */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-6"
      >
        {requests.map((request) => (
          <motion.div 
            key={request.id} 
            variants={item}
            className="group bg-[#0f172a]/40 backdrop-blur-xl rounded-[32px] border border-white/5 p-6 md:p-8 transition-all hover:border-blue-500/30 shadow-2xl overflow-hidden relative"
          >
            {/* Request Time - Top Right */}
            <div className="absolute top-6 right-8 md:top-8 md:right-10 flex flex-col items-end">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Clock size={12} />
                <span className="text-[10px] font-black uppercase tracking-widest">Gửi lúc</span>
              </div>
              <span className="text-sm font-black text-blue-400 mt-0.5 tracking-tight">{request.createdAt}</span>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Image Section */}
              <div className="w-full lg:w-48 h-48 rounded-2xl overflow-hidden bg-white/5 border border-white/10 shrink-0">
                <img 
                  src={request.image} 
                  alt={request.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              </div>

              <div className="flex-1 space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded-md">Yêu cầu #{request.id}</span>
                  </div>
                  <h3 className="text-2xl font-black text-foreground group-hover:text-blue-400 transition-colors uppercase tracking-tight pr-24">
                    {request.title}
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-2">
                    <Camera size={16} className="text-slate-500 shrink-0 mt-1" />
                    <p className="text-sm text-slate-400 leading-relaxed font-medium">
                      <span className="text-slate-500 font-black uppercase text-[10px] block mb-1">Chi tiết sự cố:</span>
                      {request.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                      <MapPin size={14} className="text-blue-500" />
                      <span className="text-xs font-bold text-slate-300">{request.distance} km</span>
                    </div>
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(request.location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/20 transition-all text-xs font-bold uppercase tracking-widest"
                    >
                      <Navigation size={14} />
                      Google Maps
                    </a>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={handleAccept}
                    className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 uppercase tracking-widest"
                  >
                    <CheckCircle size={18} />
                    Nhận Công Việc
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

