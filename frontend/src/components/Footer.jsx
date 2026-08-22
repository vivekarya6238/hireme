import { useTranslation } from "react-i18next";

function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-border">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row justify-between items-center gap-3">
        <span className="font-display font-bold text-primary">HireMe</span>
        <p className="font-body text-xs text-muted">© 2026 HireMe. {t("footer.tagline")}</p>
      </div>
    </footer>
  );
}

export default Footer;