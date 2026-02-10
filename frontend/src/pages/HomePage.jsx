import { Wrench, Zap, Shield, MapPin, Star, MessageCircle, Camera } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: 'easeOut' },
  }),
};

const features = [
  { icon: <Camera size={28} />, title: 'Chẩn đoán AI', desc: 'Chụp ảnh sự cố, AI tự động phân tích mức độ hư hỏng và ước tính chi phí.' },
  { icon: <MapPin size={28} />, title: 'Tìm thợ gần nhất', desc: 'Thuật toán matching thông minh tìm kỹ thuật viên phù hợp nhất trong bán kính gần bạn.' },
  { icon: <Zap size={28} />, title: 'Phản hồi tức thì', desc: 'Kết nối real-time qua chat, nhận thông báo trạng thái mọi lúc mọi nơi.' },
  { icon: <Shield size={28} />, title: 'Thanh toán an toàn', desc: 'Hệ thống Escrow giữ tiền, chỉ giải ngân khi bạn xác nhận hài lòng.' },
  { icon: <Star size={28} />, title: 'Đánh giá minh bạch', desc: 'Hệ thống đánh giá 5 sao công khai, chỉ thợ giỏi mới được ưu tiên.' },
  { icon: <MessageCircle size={28} />, title: 'Hỗ trợ 24/7', desc: 'Chatbot AI hỗ trợ kỹ thuật và hướng dẫn an toàn khẩn cấp ngay lập tức.' },
];

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section style={{
        minHeight: 'calc(100vh - var(--header-height))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '60px 24px',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.15), transparent 60%)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background orbs */}
        <div style={{
          position: 'absolute', width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.08), transparent)',
          top: '-100px', right: '-100px', animation: 'float 6s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(8,145,178,0.08), transparent)',
          bottom: '-50px', left: '-50px', animation: 'float 8s ease-in-out infinite',
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)',
              borderRadius: 50, padding: '8px 20px', marginBottom: 24,
              fontSize: '0.85rem', color: 'var(--color-primary-light)',
            }}>
              <Zap size={14} /> Powered by AI & Gemini
            </div>

            <h1 style={{
              fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 800,
              lineHeight: 1.1, marginBottom: 20,
              background: 'linear-gradient(135deg, #f1f5f9, #3b82f6)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Sửa chữa nhanh<br />An tâm tuyệt đối
            </h1>

            <p style={{
              fontSize: '1.15rem', color: 'var(--color-text-secondary)',
              maxWidth: 600, margin: '0 auto 32px',
            }}>
              Kết nối bạn với kỹ thuật viên sửa chữa đáng tin cậy gần nhất chỉ trong{' '}
              <strong style={{ color: 'var(--color-accent)' }}>60 giây</strong>.
              AI chẩn đoán sự cố, ước tính chi phí minh bạch.
            </p>

            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '1rem' }}>
                <Wrench size={18} /> Gửi yêu cầu sửa chữa
              </button>
              <button className="btn btn-secondary" style={{ padding: '14px 32px', fontSize: '1rem' }}>
                <MapPin size={18} /> Tìm thợ gần tôi
              </button>
            </div>

            {/* Stats */}
            <div style={{
              display: 'flex', gap: 40, justifyContent: 'center', marginTop: 48,
              flexWrap: 'wrap',
            }}>
              {[
                { num: '500+', label: 'Kỹ thuật viên' },
                { num: '10K+', label: 'Yêu cầu xử lý' },
                { num: '4.8★', label: 'Đánh giá TB' },
                { num: '<60s', label: 'Thời gian kết nối' },
              ].map((stat, i) => (
                <div key={i}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-primary-light)' }}>{stat.num}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section" style={{ background: 'var(--color-bg-secondary)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 12 }}>
              Tại sao chọn <span style={{ color: 'var(--color-primary-light)' }}>FastFix</span>?
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', maxWidth: 500, margin: '0 auto' }}>
              Công nghệ AI tiên tiến kết hợp mạng lưới thợ uy tín, mang đến trải nghiệm dịch vụ sửa chữa hoàn hảo.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 24,
          }}>
            {features.map((f, i) => (
              <motion.div
                key={i}
                className="glass-card"
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: 'linear-gradient(135deg, rgba(37,99,235,0.2), rgba(8,145,178,0.2))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16, color: 'var(--color-primary-light)',
                }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{
        textAlign: 'center',
        background: 'radial-gradient(ellipse at 50% 100%, rgba(37,99,235,0.1), transparent 60%)',
      }}>
        <div className="container">
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 16 }}>
            Sẵn sàng sửa chữa ngay hôm nay?
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 32, maxWidth: 500, margin: '0 auto 32px' }}>
            Chỉ cần chụp ảnh → mô tả sự cố → AI kết nối bạn với thợ giỏi nhất.
          </p>
          <button className="btn btn-primary" style={{ padding: '16px 40px', fontSize: '1.05rem' }}>
            <Wrench size={20} /> Bắt đầu ngay - Miễn phí
          </button>
        </div>
      </section>
    </>
  );
}
