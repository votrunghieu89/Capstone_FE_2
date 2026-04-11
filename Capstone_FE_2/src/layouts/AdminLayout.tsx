import { Outlet } from "react-router-dom"
import { AppSidebar } from "@/components/admin/app-sidebar"
import { useEffect, useState } from "react"

export default function AdminLayout() {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('fastfix_token');
    if (!token) {
      window.location.href = '/?login=admin';
    } else {
      setIsAuthorized(true);
    }
  }, []);

  if (isAuthorized === null) return null;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
