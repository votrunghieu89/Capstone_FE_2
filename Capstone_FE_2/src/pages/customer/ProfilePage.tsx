import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Save } from 'lucide-react';
import useAuthStore from '@/store/authStore';

export default function ProfilePage() {
    const { user } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Hồ sơ cá nhân</h1>
                <p className="text-muted-foreground mt-2">
                    Quản lý thông tin liên hệ và địa chỉ của bạn.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Avatar Section */}
                <div className="col-span-1">
                    <div className="bg-[#0a1122] border border-white/5 rounded-2xl p-6 flex flex-col items-center gap-4">
                        <div className="relative group">
                            <Avatar className="w-32 h-32 ring-4 ring-primary/20">
                                <AvatarImage src={user?.avatarUrl || ''} />
                                <AvatarFallback className="text-4xl bg-primary/20 text-primary-light font-bold">
                                    {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <button className="absolute bottom-2 right-2 p-2.5 bg-primary hover:bg-primary-dark text-white rounded-full shadow-lg transition-transform hover:scale-110">
                                <Camera size={18} />
                            </button>
                        </div>
                        <div className="text-center">
                            <h3 className="font-semibold text-lg text-white">{user?.fullName || 'Khách Hàng'}</h3>
                            <p className="text-sm text-zinc-400">Thành viên từ 2026</p>
                        </div>
                    </div>
                </div>

                {/* Info Section */}
                <div className="col-span-1 md:col-span-2">
                    <div className="bg-[#0a1122] border border-white/5 rounded-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-white">Thông tin cơ bản</h2>
                            <Button
                                variant={isEditing ? "default" : "outline"}
                                onClick={() => setIsEditing(!isEditing)}
                                className={!isEditing ? "border-primary/50 text-primary-light hover:bg-primary/10" : "bg-primary text-white"}
                            >
                                {isEditing ? <><Save className="w-4 h-4 mr-2" /> Lưu thay đổi</> : 'Cập nhật'}
                            </Button>
                        </div>

                        <div className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName" className="text-zinc-400">Họ và tên</Label>
                                    <Input
                                        id="fullName"
                                        defaultValue={user?.fullName || ''}
                                        disabled={!isEditing}
                                        className="bg-[#050b18] border-white/10 text-white focus-visible:ring-primary focus-visible:border-primary disabled:opacity-75"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-zinc-400">Số điện thoại</Label>
                                    <Input
                                        id="phone"
                                        defaultValue="0987654321"
                                        disabled={!isEditing}
                                        className="bg-[#050b18] border-white/10 text-white focus-visible:ring-primary focus-visible:border-primary disabled:opacity-75"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-zinc-400">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    defaultValue={user?.email || ''}
                                    disabled
                                    className="bg-[#050b18] border-white/10 text-zinc-500 disabled:opacity-50"
                                    title="Email không thể thay đổi"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address" className="text-zinc-400">Địa chỉ mặc định</Label>
                                <Input
                                    id="address"
                                    defaultValue="123 Nguyễn Văn Linh, Hải Châu, Đà Nẵng"
                                    disabled={!isEditing}
                                    className="bg-[#050b18] border-white/10 text-white focus-visible:ring-primary focus-visible:border-primary disabled:opacity-75"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
