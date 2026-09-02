import { useTranslation } from "react-i18next";
import Logo from "./Logo";

function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-border bg-white">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2.5">
          <Logo size={28} />
          <span className="font-display font-bold text-ink">
            Hire<span className="text-primary">Me</span>
          </span>
        </div>
        <p className="font-body text-xs text-muted">© 2026 HireMe. {t("footer.tagline")}</p>
      </div>
    </footer>
  );
}

export default Footer;