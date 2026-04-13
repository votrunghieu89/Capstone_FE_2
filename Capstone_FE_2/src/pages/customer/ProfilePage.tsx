import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Save, Loader2 } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import profileService from '@/services/profileService';
import toast from 'react-hot-toast';

export default function ProfilePage() {
    const { user } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState('');

    // Profile State
    const [formData, setFormData] = useState({
        fullName: user?.fullName || '',
        phoneNumber: '',
        address: '',
        description: ''
    });

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user?.id) return;
            setIsLoading(true);
            try {
                const data = await profileService.getCustomerProfile(user.id);
                // Depending on the backend response structure, map accordingly
                const profile = data.data || data;
                setFormData(prev => ({
                    ...prev,
                    fullName: profile.fullName || profile.FullName || user.fullName || '',
                    phoneNumber: profile.phoneNumber || profile.PhoneNumber || '',
                    address: profile.address || profile.Address || '',
                    description: profile.description || profile.Description || ''
                }));
                setAvatarPreview(profile.avatarUrl || profile.AvatarUrl || user?.avatarUrl || '');
            } catch (error) {
                console.error("Failed to load profile:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSave = async () => {
        if (!user?.id) return;
        setIsSaving(true);
        try {
            await profileService.updateCustomerProfile({
                fullName: formData.fullName,
                phoneNumber: formData.phoneNumber,
                address: formData.address,
                description: formData.description
            }, avatarFile || undefined);
            toast.success("Cập nhật hồ sơ thành công!");
            setIsEditing(false);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Cập nhật hồ sơ thất bại");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

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
                                <AvatarImage src={avatarPreview || user?.avatarUrl || ''} />
                                <AvatarFallback className="text-4xl bg-primary/20 text-primary-light font-bold">
                                    {formData.fullName?.charAt(0).toUpperCase() || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <label className="absolute bottom-2 right-2 p-2.5 bg-primary hover:bg-primary-dark text-white rounded-full shadow-lg transition-transform hover:scale-110 cursor-pointer">
                                <Camera size={18} />
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    disabled={!isEditing}
                                    onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (!f) return;
                                        setAvatarFile(f);
                                        setAvatarPreview(URL.createObjectURL(f));
                                    }}
                                />
                            </label>
                        </div>
                        <div className="text-center">
                            <h3 className="font-semibold text-lg text-white">{formData.fullName || 'Khách Hàng'}</h3>
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
                                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                                disabled={isSaving}
                                className={!isEditing ? "border-primary/50 text-primary-light hover:bg-primary/10" : "bg-primary text-white"}
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : (isEditing ? <Save className="w-4 h-4 mr-2" /> : null)}
                                {isSaving ? 'Đang lưu...' : (isEditing ? 'Lưu thay đổi' : 'Cập nhật')}
                            </Button>
                        </div>

                        <div className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName" className="text-zinc-400">Họ và tên</Label>
                                    <Input
                                        id="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="bg-[#050b18] border-white/10 text-white focus-visible:ring-primary focus-visible:border-primary disabled:opacity-75"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phoneNumber" className="text-zinc-400">Số điện thoại</Label>
                                    <Input
                                        id="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
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
                                    value={formData.address}
                                    onChange={handleChange}
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
