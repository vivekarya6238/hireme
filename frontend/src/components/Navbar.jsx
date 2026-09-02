import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "./Logo";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/");
  };

  const initial = user?.name?.trim()?.[0]?.toUpperCase() || "?";

  return (
    <nav className="border-b border-border bg-bg/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-18 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <Logo />
          <span className="font-display font-extrabold text-xl text-ink tracking-tight">
            Hire<span className="text-primary">Me</span>
          </span>
        </Link>

        {loading ? (
          <div className="w-9 h-9 rounded-full bg-border animate-pulse" />
        ) : user ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full border border-border hover:border-primary transition-colors"
            >
              <span className="w-8 h-8 rounded-full bg-primary text-bg font-display font-bold text-sm flex items-center justify-center">
                {initial}
              </span>
              <span className="font-body text-sm font-medium text-ink hidden sm:block max-w-[100px] truncate">
                {user.name}
              </span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`text-muted transition-transform ${
                  menuOpen ? "rotate-180" : ""
                }`}
              >
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-border shadow-lg overflow-hidden origin-top-right"
                >
                  <div className="px-4 py-3 border-b border-border">
                    <p className="font-body text-sm font-semibold text-ink truncate">
                      {user.name}
                    </p>
                    <p className="font-mono text-xs text-muted capitalize mt-0.5">
                      {user.role}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 font-body text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    {t("nav.logout")}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="font-body text-sm font-medium text-ink hover:text-primary transition-colors px-3 py-2"
            >
              {t("nav.login")}
            </Link>
            <Link
              to="/login"
              className="font-body text-sm font-semibold bg-primary text-bg px-5 py-2.5 rounded-lg hover:bg-primary-dark hover:shadow-md transition-all"
            >
              {t("nav.getStarted")}
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;