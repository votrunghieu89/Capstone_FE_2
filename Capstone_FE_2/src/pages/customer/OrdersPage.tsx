import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Wrench, Calendar, MapPin, Clock, ClipboardList } from 'lucide-react';


export default function OrdersPage() {
    const [activeTab, setActiveTab] = useState("all");

    // Mock data for orders
    const orders = [
        { id: 'ORD-001', service: 'Sửa Điều Hòa', status: 'In Progress', date: '21/10/2026', time: '14:30', tech: 'Nguyễn Văn A' },
        { id: 'ORD-002', service: 'Khoan Tường', status: 'Pending', date: '22/10/2026', time: '09:00', tech: 'Chưa có' },
        { id: 'ORD-003', service: 'Sửa Ống Nước', status: 'Accepted', date: '20/10/2026', time: '16:00', tech: 'Trần B' },
    ];

    const filteredOrders = orders.filter(o =>
        activeTab === 'all' ? true : o.status.toLowerCase().replace(' ', '-') === activeTab
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Quản lý Đơn hàng</h1>
                    <p className="text-muted-foreground mt-2">
                        Theo dõi trạng thái và tiến độ sửa chữa thiết bị của bạn.
                    </p>
                </div>
                <Button className="bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/20 rounded-xl px-5 h-12 flex items-center gap-2 font-semibold">
                    <Plus size={18} /> Đặt Lịch Sửa Chữa
                </Button>
            </div>

            <div className="bg-[#0a1122] border border-white/5 rounded-2xl p-4 sm:p-6">
                <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
                    <TabsList className="bg-[#050b18] mb-6 border border-white/5 p-1">
                        <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-white">Tất cả</TabsTrigger>
                        <TabsTrigger value="pending" className="data-[state=active]:bg-primary data-[state=active]:text-white">Đang chờ</TabsTrigger>
                        <TabsTrigger value="accepted" className="data-[state=active]:bg-primary data-[state=active]:text-white">Đã tiếp nhận</TabsTrigger>
                        <TabsTrigger value="in-progress" className="data-[state=active]:bg-primary data-[state=active]:text-white">Đang thực hiện</TabsTrigger>
                    </TabsList>

                    <TabsContent value={activeTab} className="mt-0">
                        {filteredOrders.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredOrders.map((order) => (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        key={order.id}
                                        className="border border-white/5 bg-[#050b18] rounded-xl p-5 hover:border-primary/30 transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white/5 text-zinc-300">
                                                {order.id}
                                            </div>
                                            <StatusBadge status={order.status} />
                                        </div>

                                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 group-hover:text-primary-light transition-colors">
                                            <Wrench className="w-5 h-5 text-zinc-400 group-hover:text-primary-light" />
                                            {order.service}
                                        </h3>

                                        <div className="space-y-2 text-sm text-zinc-400">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" /> {order.date}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4" /> {order.time}
                                            </div>
                                        </div>

                                        <div className="mt-5 pt-4 border-t border-white/5 flex justify-between items-center">
                                            <span className="text-xs text-zinc-500">Thợ: {order.tech}</span>
                                            <Button variant="link" className="text-primary-light p-0 h-auto font-semibold hover:text-primary">
                                                Xem chi tiết
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                    <ClipboardList className="w-8 h-8 text-zinc-500" />
                                </div>
                                <p className="text-zinc-400 font-medium">Không tìm thấy đơn hàng nào trong mục này.</p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </motion.div>
    );
}

function StatusBadge({ status }: { status: string }) {
    let color = "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    let label = "Đang chờ";

    if (status === 'Accepted') {
        color = "bg-blue-500/10 text-blue-400 border-blue-500/20";
        label = "Đã tiếp nhận";
    } else if (status === 'In Progress') {
        color = "bg-amber-500/10 text-amber-400 border-amber-500/20";
        label = "Đang thực hiện";
    } else if (status === 'Completed') {
        color = "bg-green-500/10 text-green-400 border-green-500/20";
        label = "Hoàn thành";
    }

    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${color}`}>
            {label}
        </span>
    );
}
