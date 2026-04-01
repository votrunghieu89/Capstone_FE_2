import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CreditCard,
  Plus,
  History,
  TrendingUp,
  Download,
  ShieldCheck,
  DollarSign
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export function PaymentManager() {
  const stats = [
    { label: 'Số dư khả dụng', value: '12.450.000đ', icon: Wallet, color: 'text-emerald-500' },
    { label: 'Đang chờ xử lý', value: '3.200.000đ', icon: History, color: 'text-amber-500' },
    { label: 'Tổng thu nhập', value: '45.800.000đ', icon: TrendingUp, color: 'text-blue-500' },
  ];

  const upcomingPayouts = [
    { id: 1, date: '15 Th03, 2026', amount: '8.450.000đ', status: 'Sắp tới' },
    { id: 2, date: '30 Th03, 2026', amount: '4.000.000đ', status: 'Sắp tới' },
  ];

  const transactions = [
    {
      id: 1,
      type: 'payout',
      title: 'Rút tiền về Ngân hàng',
      date: '01 Th03, 2026',
      amount: '-5.000.000đ',
      status: 'Thành công',
    },
    {
      id: 2,
      type: 'earning',
      title: 'Sửa chữa Điều hòa - KH Nguyễn Văn A',
      date: '28 Th02, 2026',
      amount: '+1.200.000đ',
      status: 'Thành công',
    },
    {
      id: 3,
      type: 'earning',
      title: 'Bảo trì Hệ thống HVAC - KH Trần Thị B',
      date: '27 Th02, 2026',
      amount: '+2.500.000đ',
      status: 'Thành công',
    },
    {
      id: 4,
      type: 'payout',
      title: 'Rút tiền về Ngân hàng',
      date: '15 Th02, 2026',
      amount: '-10.000.000đ',
      status: 'Thành công',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản Lý Thanh Toán</h1>
          <p className="text-muted-foreground mt-1 text-lg">Theo dõi thu nhập và quản lý dòng tiền của bạn</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="rounded-xl border-white/5 bg-white/5 hover:bg-white/10 gap-2 font-bold transition-all">
              <Download className="w-4 h-4" /> Xuất báo cáo
           </Button>
           <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-6 font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95">
              Rút tiền ngay
           </Button>
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div variants={itemVariants} key={idx}>
              <Card className="p-8 bg-zinc-950/50 border-white/5 rounded-3xl shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full group-hover:scale-125 transition-transform duration-700" />
                <div className="relative z-10">
                  <div className={`p-4 rounded-2xl bg-white/5 w-fit mb-6 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">{stat.label}</p>
                  <h3 className="text-3xl font-black mt-2 tracking-tight italic text-white">{stat.value}</h3>
                  <div className="mt-4 flex items-center gap-2 text-emerald-500 text-[10px] font-black tracking-widest uppercase">
                     <TrendingUp className="w-3 h-3" />
                     <span>+4.5% vs tháng trước</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-8 border-zinc-100 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <History className="w-5 h-5 text-zinc-400" />
                Lịch sử giao dịch
              </h2>
              <Button variant="ghost" className="text-zinc-500 font-bold hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl">
                Xem tất cả
              </Button>
            </div>
            
            <div className="space-y-4">
              {transactions.map((tx, idx) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + (idx * 0.1) }}
                  className="flex items-center justify-between p-5 rounded-2xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5 group shadow-sm hover:shadow-lg"
                >
                  <div className="flex items-center gap-5">
                    <div className={cn(
                      'p-3 rounded-2xl',
                      tx.type === 'earning' 
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' 
                        : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20'
                    )}>
                      {tx.type === 'earning' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">{tx.title}</p>
                      <p className="text-xs font-bold text-zinc-400 mt-1 uppercase tracking-wider">{tx.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      'text-lg font-black tracking-tight',
                      tx.type === 'earning' ? 'text-emerald-600' : 'text-zinc-900 dark:text-zinc-100'
                    )}>
                      {tx.amount}
                    </p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                       <ShieldCheck className="w-3 h-3 text-emerald-500" />
                       <span className="text-[10px] font-black uppercase tracking-tighter text-zinc-400">Verified</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-8 bg-zinc-900 text-white border-none rounded-3xl shadow-xl shadow-zinc-200 dark:shadow-none relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full" />
            <div className="relative z-10">
              <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-zinc-400" />
                Phương thức thanh toán
              </h2>
              
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center font-black italic text-[10px]">VISA</div>
                    <div className="w-3 h-3 border-2 border-zinc-500 rounded-full group-hover:border-white transition-colors" />
                  </div>
                  <p className="font-mono text-lg tracking-[0.2em] mb-4">•••• •••• •••• 1234</p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-zinc-500">Chủ thẻ</p>
                      <p className="text-xs font-bold tracking-wider">NGUYEN VAN A</p>
                    </div>
                    <p className="text-[10px] font-bold">12/28</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-zinc-700 hover:bg-white/5 transition-all text-zinc-500 hover:text-white">
                  <Plus className="w-6 h-6" />
                  <span className="text-xs font-bold uppercase tracking-widest">Thêm phương thức</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-8 border-zinc-100 dark:border-zinc-800 rounded-3xl shadow-sm">
            <h2 className="text-xl font-bold mb-6">Đợt thanh toán sắp tới</h2>
            <div className="space-y-6">
              {upcomingPayouts.map((payout) => (
                <div key={payout.id} className="flex items-center justify-between group pt-4 first:pt-0 border-t first:border-none border-zinc-50">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 rounded-xl group-hover:bg-zinc-100 transition-colors">
                      <Calendar className="w-4 h-4 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">{payout.date}</p>
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">{payout.amount}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md">
                    {payout.status}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
