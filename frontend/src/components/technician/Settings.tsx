import { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Bell, 
  Shield, 
  Save,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import useAuthStore from '@/store/authStore';
import { motion, AnimatePresence } from 'framer-motion';

export function Settings() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Hồ sơ cá nhân', icon: User, color: 'bg-blue-500' },
    { id: 'security', label: 'Bảo mật', icon: Lock, color: 'bg-amber-500' },
    { id: 'notifications', label: 'Thông báo', icon: Bell, color: 'bg-purple-500' },
    { id: 'preferences', label: 'Tùy chỉnh', icon: Shield, color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cài Đặt</h1>
          <p className="text-muted-foreground mt-1 text-lg">Quản lý tài khoản và tùy chỉnh hệ thống của bạn</p>
        </div>
        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-full px-4 py-2 border border-zinc-200 dark:border-zinc-700">
          <UserCheck className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-medium">Tài khoản đã xác thực</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Navigation Tabs */}
        <aside className="w-full md:w-72 space-y-2 sticky top-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? 'bg-zinc-900 text-white shadow-xl shadow-zinc-200 dark:shadow-none translate-x-1'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl ${isActive ? 'bg-zinc-800' : 'bg-transparent'}`}>
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                  </div>
                  {tab.label}
                </div>
                {isActive && <ChevronRight className="w-4 h-4" />}
              </motion.button>
            );
          })}
        </aside>

        {/* Content Area */}
        <main className="flex-1 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <Card className="overflow-hidden border-zinc-200 dark:border-zinc-800 shadow-sm rounded-3xl">
                {activeTab === 'profile' && (
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    <div className="p-8">
                      <h3 className="text-xl font-bold mb-6">Thông tin cá nhân</h3>
                      <div className="space-y-6">
                        <div className="flex flex-col md:flex-row gap-6 items-center mb-8">
                          <div className="relative group">
                            <div className="w-24 h-24 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border-4 border-white dark:border-zinc-900 shadow-lg group-hover:bg-zinc-200 transition-colors">
                              <User className="w-10 h-10 text-zinc-400 group-hover:text-zinc-600" />
                            </div>
                            <button className="absolute bottom-0 right-0 p-2 bg-zinc-900 text-white rounded-full shadow-lg border-2 border-white dark:border-zinc-900 hover:scale-110 transition-transform">
                              <Save className="w-3 h-3" />
                            </button>
                          </div>
                          <div>
                            <p className="font-bold text-lg">{user?.fullName || 'Tham Khách Hàng'}</p>
                            <p className="text-zinc-500">Kỹ thuật viên chuyên nghiệp</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Họ và tên</label>
                            <div className="relative">
                              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                              <input
                                type="text"
                                defaultValue={user?.fullName || ''}
                                className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Email</label>
                            <div className="relative">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                              <input
                                type="email"
                                defaultValue={user?.email || ''}
                                className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Số điện thoại</label>
                            <div className="relative">
                              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                              <input
                                type="text"
                                defaultValue="0987 654 321"
                                className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-8 bg-zinc-50/50 dark:bg-zinc-900/50 flex justify-end gap-3">
                      <Button variant="outline" className="rounded-xl px-6">Hủy</Button>
                      <Button className="rounded-xl px-8 bg-zinc-900 hover:bg-zinc-800">
                        Lưu thay đổi
                      </Button>
                    </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="p-8 space-y-8">
                    <div>
                      <h3 className="text-xl font-bold mb-2">Bảo mật tài khoản</h3>
                      <p className="text-zinc-500 mb-8 text-sm">Cập nhật mật khẩu và các tùy chọn bảo mật khác</p>
                      
                      <div className="space-y-6 max-w-md">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Mật khẩu hiện tại</label>
                          <input
                            type="password"
                            placeholder="••••••••"
                            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Mật khẩu mới</label>
                          <input
                            type="password"
                            placeholder="Tối thiểu 8 ký tự"
                            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <Button className="rounded-xl px-8 bg-zinc-900 hover:bg-zinc-800">
                      Cập nhật mật khẩu
                    </Button>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div className="p-8 space-y-8">
                     <div>
                      <h3 className="text-xl font-bold mb-2">Thông báo</h3>
                      <p className="text-zinc-500 mb-8 text-sm">Quản lý cách bạn nhận thông tin từ hệ thống</p>
                      
                      <div className="space-y-4">
                        {[
                          { title: 'Yêu cầu mới', desc: 'Nhận thông báo khi có khách hàng đặt lịch mới' },
                          { title: 'Tin nhắn khách hàng', desc: 'Thông báo khi có phản hồi trong phần Giao tiếp' },
                          { title: 'Báo cáo hàng tuần', desc: 'Tổng kết hiệu suất và thu nhập cuối tuần' },
                          { title: 'Cập nhật hệ thống', desc: 'Các tính năng mới và thông tin quan trọng' }
                        ].map((item, idx) => (
                          <motion.div 
                            key={idx} 
                            whileHover={{ scale: 1.01 }}
                            className="flex items-center justify-between p-5 border border-zinc-100 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/50"
                          >
                            <div className="space-y-1">
                              <p className="font-bold">{item.title}</p>
                              <p className="text-xs text-zinc-500">{item.desc}</p>
                            </div>
                            <div className="w-12 h-6 bg-zinc-900 rounded-full relative cursor-pointer">
                               <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition-all" />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
