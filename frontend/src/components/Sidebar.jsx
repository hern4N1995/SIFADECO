import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { HiMenu, HiX } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';

export default function Sidebar() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const sidebarRef = useRef(null);

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      setUser(storedUser);
    } catch {
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  const rol = user ? String(user.rol) : null;

  const menuConfig = [
    {
      prefix: '/perfil',
      title: 'Mi Perfil',
      roles: ['1', '2', '3'],
      menu: [{ to: '/perfil', label: 'Ver Perfil', end: true }],
    },

    {
      prefix: '/faena',
      title: 'Gestión de Faena',
      roles: ['1', '2', '3'],
      menu: [
        { to: '/faena', label: 'Tropas a Faenar', end: true },
        { to: '/faena/faenas-realizadas', label: 'Faenas Realizadas' },
      ],
    },
    {
      prefix: '/tropa',
      title: 'Gestión de Tropa',
      roles: ['1', '2', '3'],
      menu: [
        { to: '/tropa', label: 'Ingreso de Tropa', end: true },
        { to: '/tropas-cargadas', label: 'Tropas Cargadas' },
      ],
    },
    {
      prefix: '/decomiso',
      title: 'Gestión de Decomisos',
      roles: ['1', '2', '3'],
      menu: [
        { to: '/decomisos', label: 'Faenas a Decomisar', end: true },
        { to: '/decomisos/cargados', label: 'Decomisos Cargados' },
      ],
    },
    {
      prefix: '/informes',
      title: 'Gestión de Informe',
      roles: ['1', '2', '3'],
      menu: [
        { to: '/informes', label: 'Informe Mensual', end: true },
        { to: '/informes/faena', label: 'Informe de Faena' },
        { to: '/informes/decomisos', label: 'Informe de Decomisos' },
      ],
    },
    {
      prefix: '/admin',
      title: 'Gestión Administrativa',
      roles: ['1', '2'],
      menu: [
        { to: '/admin/usuarios', label: 'Usuarios' },
        { to: '/admin/provincias', label: 'Provincias' },
        { to: '/admin/departamentos', label: 'Departamentos' },
        { to: '/admin/titulares', label: 'Titulares' },
        { to: '/admin/plantas', label: 'Plantas' },
        { to: '/admin/productores', label: 'Productores' },
        { to: '/admin/afecciones', label: 'Afecciones' },
        { to: '/admin/veterinarios', label: 'Veterinarios' },
        { to: '/admin/partes-decomisadas', label: 'Partes Decomisadas' },
        { to: '/admin/tipos-parte-decomisada', label: 'Tipos Decomisada' },
        { to: '/admin/especies', label: 'Especies' },
        { to: '/admin/categorias-especie', label: 'Categorías por Especie' },
      ],
    },
  ];

  const match =
    rol &&
    menuConfig.find(
      ({ prefix, roles }) => pathname.startsWith(prefix) && roles.includes(rol)
    );

  const linkClass = ({ isActive }) =>
    `block px-4 py-3 rounded-xl transition-all duration-200 ` +
    (isActive
      ? 'bg-white/20 text-white font-semibold shadow-lg'
      : 'text-white/80 hover:bg-white/10 hover:text-white');

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  return (
    <>
      {!match ? null : (
        <>
          {!open && (
            <button
              onClick={() => setOpen(true)}
              className="lg:hidden fixed top-24 left-4 z-50 bg-primary/90 backdrop-blur text-white p-3 rounded-full shadow-xl"
            >
              <HiMenu size={22} />
            </button>
          )}

          <AnimatePresence>
            {open && (
              <motion.div
                ref={sidebarRef}
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.3 }}
                className="fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-primary to-secondary flex flex-col shadow-2xl"
              >
                <button
                  onClick={() => setOpen(false)}
                  className="absolute top-6 right-4 text-white/80 hover:text-white transition"
                >
                  <HiX size={24} />
                </button>

                <div className="p-6 pt-20 flex-1 flex flex-col">
                  <h2 className="text-xl font-bold text-white/90 mb-6 tracking-tight">
                    {match.title}
                  </h2>
                  <nav className="space-y-2">
                    {match.menu.map(({ to, label, end }) => (
                      <NavLink
                        key={to}
                        to={to}
                        end={end}
                        className={linkClass}
                        onClick={() => setOpen(false)}
                      >
                        {label}
                      </NavLink>
                    ))}
                  </nav>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <aside className="hidden lg:flex flex-col w-72 min-w-72 max-w-72 bg-gradient-to-b from-primary to-secondary min-h-screen p-6 shadow-xl">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white/90 mb-6">
                {match.title}
              </h2>
              <nav className="space-y-2">
                {match.menu.map(({ to, label, end }) => (
                  <NavLink key={to} to={to} end={end} className={linkClass}>
                    {label}
                  </NavLink>
                ))}
              </nav>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
