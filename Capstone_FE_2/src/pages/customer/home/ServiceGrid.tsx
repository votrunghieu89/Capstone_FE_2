import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, Droplets, Thermometer, Hammer, 
  Settings, ShieldCheck, ArrowRight 
} from 'lucide-react';
import customerService, { ServiceCategory } from '@/services/customerService';
import { Link } from 'react-router-dom';

const iconMap: Record<string, any> = {
  'Sửa điện': Zap,
  'Sửa nước': Droplets,
  'Điện lạnh': Thermometer,
  'Xây dựng': Hammer,
  'Sửa máy tính': Settings,
  'Mặc định': ShieldCheck
};

export function ServiceGrid() {
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await customerService.getAllServices();
        setServices(data);
      } catch (err) {
        console.error('Error fetching services:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  if (loading && services.length === 0) return null;

  return (
    <section className="py-20 bg-[#02050b] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
            Dịch vụ <span className="text-ff-cta-orange">Phổ Biến</span>
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto font-medium">
            Chúng tôi cung cấp đa dạng các dịch vụ sửa chữa gia đình với đội ngũ thợ được tuyển chọn kỹ lưỡng.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {services.map((service, index) => {
            const Icon = iconMap[service.serviceName] || iconMap['Mặc định'];
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                viewport={{ once: true }}
              >
                <Link 
                  to={`/customer/technicians?service=${service.serviceName}`}
                  className="group block p-8 rounded-[32px] bg-white/5 border border-white/5 hover:border-ff-accent-blue/30 hover:bg-ff-accent-blue/5 transition-all duration-500 text-center relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-4 h-4 text-ff-accent-blue" />
                  </div>
                  
                  <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:scale-110 group-hover:text-ff-accent-blue transition-all duration-500 shadow-xl">
                    <Icon size={32} />
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-200 mb-2 group-hover:text-white transition-colors">
                    {service.serviceName}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
                    {service.description || 'Chạm để tìm thợ uy tín nhất'}
                  </p>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
      
      {/* Background glow */}
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-ff-cta-orange/5 blur-[150px] -z-0" />
    </section>
  );
}
