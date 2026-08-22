import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

function Navbar() {
  const { t } = useTranslation();

  return (
    <nav className="border-b border-border bg-bg/95 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="font-display font-bold text-xl text-primary">
          HireMe
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="font-body text-sm font-medium text-ink hover:text-primary transition-colors px-3 py-2"
          >
            {t("nav.login")}
          </Link>
          <Link
            to="/login"
            className="font-body text-sm font-semibold bg-primary text-bg px-4 py-2 rounded-md hover:bg-primary-dark transition-colors"
          >
            {t("nav.getStarted")}
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;