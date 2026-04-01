import { motion } from 'framer-motion';
import { ShieldCheck, Star, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HistoryPage() {
    const historyData = [
        { id: 'ORD-982', service: 'Sửa Điều Hòa', date: '15/09/2026', tech: 'Nguyễn Văn A', price: '450.000đ', rating: 5, status: 'Hoàn thành' },
        { id: 'ORD-841', service: 'Khắc phục chập điện', date: '02/08/2026', tech: 'Trần B', price: '1.200.000đ', rating: 4, status: 'Hoàn thành' },
        { id: 'ORD-756', service: 'Vệ sinh máy giặt', date: '12/05/2026', tech: 'Lê C', price: '300.000đ', rating: 5, status: 'Hoàn thành' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                    <ShieldCheck className="w-8 h-8 text-green-500" />
                    Lịch sử Dịch vụ
                </h1>
                <p className="text-muted-foreground mt-2">
                    Các dịch vụ sửa chữa đã được hoàn tất thành công.
                </p>
            </div>

            <div className="bg-[#0a1122] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-[#050b18] border-b border-white/5 text-zinc-400 text-sm tracking-wider uppercase">
                                <th className="px-6 py-4 font-semibold">Mã Đơn</th>
                                <th className="px-6 py-4 font-semibold">Dịch Vụ</th>
                                <th className="px-6 py-4 font-semibold">Thời Gian</th>
                                <th className="px-6 py-4 font-semibold">Thợ</th>
                                <th className="px-6 py-4 font-semibold">Chi Phí</th>
                                <th className="px-6 py-4 font-semibold">Đánh Giá</th>
                                <th className="px-6 py-4 font-semibold"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {historyData.map((item) => (
                                <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <span className="bg-white/5 text-zinc-300 font-medium px-2.5 py-1 rounded text-sm group-hover:bg-primary/10 group-hover:text-primary-light transition-colors">
                                            {item.id}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-white font-medium">{item.service}</td>
                                    <td className="px-6 py-5 text-zinc-400">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="w-4 h-4 text-zinc-500" />
                                            {item.date}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-zinc-400 text-sm">{item.tech}</td>
                                    <td className="px-6 py-5 font-bold text-white tracking-wide">{item.price}</td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`w-3.5 h-3.5 ${i < item.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'}`}
                                                />
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary-light hover:bg-primary/10 transition-colors">
                                            Chi tiết <ArrowRight className="w-4 h-4 ml-1" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
}
