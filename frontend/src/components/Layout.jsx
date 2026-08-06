// components/Layout.jsx
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import Footer from './Footer.jsx';

export default function Layout() {
  const { pathname } = useLocation();

  // Rutas donde no se muestran elementos de navegación
  const cleanPathname = pathname.replace(/\/$/, '');
  const hideSidebar = pathname === '/inicio' || pathname.startsWith('/login');
  const hideHeaderFooter = ['/login'].includes(pathname); // Podés ajustar esto

  return (
    <div className="min-h-screen flex flex-col">
      {!hideHeaderFooter && <Header />}

      <div className="flex flex-1">
        {!hideSidebar && <Sidebar />}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>

      {!hideHeaderFooter && <Footer />}
    </div>
  );
}
