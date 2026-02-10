import { Outlet } from 'react-router-dom';
import { Wrench, Search, Bell, User, Menu } from 'lucide-react';
import { useState } from 'react';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: 'var(--header-height)',
      background: 'var(--glass-bg)',
      backdropFilter: 'var(--glass-blur)',
      borderBottom: '1px solid var(--glass-border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px',
    }}>
      <a href="/" style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)',
        textDecoration: 'none',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Wrench size={22} color="white" />
        </div>
        <span>Fast<span style={{ color: 'var(--color-primary-light)' }}>Fix</span></span>
      </a>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
          <Search size={16} /> Tìm thợ
        </button>
        <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
          Đăng nhập
        </button>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer style={{
      background: 'var(--color-bg-secondary)',
      borderTop: '1px solid var(--glass-border)',
      padding: '40px 24px', textAlign: 'center',
      color: 'var(--color-text-secondary)', fontSize: '0.9rem',
    }}>
      <div className="container">
        <p style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: 8 }}>
          ⚡ FastFix - Rapid Household Repair Service Matching
        </p>
        <p>© 2026 FastFix Team. Tất cả quyền được bảo lưu.</p>
      </div>
    </footer>
  );
}

export default function MainLayout() {
  return (
    <>
      <Navbar />
      <main style={{ marginTop: 'var(--header-height)', minHeight: 'calc(100vh - var(--header-height))' }}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
