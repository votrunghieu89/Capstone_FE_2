import { Menu, Bell, Settings, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuthStore from '@/store/authStore';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
    const { user, logout } = useAuthStore();
    const userName = user?.fullName || 'Khách Hàng';

    return (
        <header className="h-16 border-b border-white/5 bg-[#050b18]/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-30">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="p-2 hover:bg-white/10 rounded-lg md:hidden text-white"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-semibold text-white hidden md:block">
                    Xin chào, {userName.split(' ')[0] || userName} 👋
                </h2>
            </div>

            <div className="flex items-center gap-4">
                <button className="p-2 hover:bg-white/10 rounded-lg relative text-zinc-400 hover:text-white transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                </button>

                <div className="flex items-center gap-2 pl-4 border-l border-white/10">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 pl-2 hover:bg-white/5 py-1 px-2 rounded-lg transition-colors outline-none">
                                <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                                    <AvatarImage src={user?.avatarUrl || ''} alt={userName} />
                                    <AvatarFallback className="bg-primary/20 text-primary-light font-bold">
                                        {userName.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium hidden sm:inline text-white">{userName}</span>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{userName}</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {user?.email}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link to="/customer/profile" className="cursor-pointer">
                                    <span>Hồ sơ cá nhân</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link to="/customer/orders" className="cursor-pointer">
                                    <span>Đơn sửa chữa</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => logout()}
                                className="text-red-500 focus:text-red-500 cursor-pointer"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Đăng xuất</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
