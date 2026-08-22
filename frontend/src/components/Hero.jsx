import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

function Hero() {
  const { t } = useTranslation();

  return (
    <section className="max-w-6xl mx-auto px-6 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
      <div>
        <span className="font-mono text-xs tracking-wider uppercase text-accent bg-accent/10 px-3 py-1 rounded-full">
          {t("hero.eyebrow")}
        </span>
        <h1 className="font-display font-extrabold text-4xl md:text-5xl leading-tight mt-5 text-ink">
          {t("hero.heading1")}
          <br />
          <span className="text-primary">{t("hero.heading2")}</span>
        </h1>
        <p className="font-body text-muted text-lg mt-5 max-w-md">{t("hero.subtitle")}</p>
        <div className="flex flex-wrap gap-3 mt-8">
          <Link
            to="/login?role=worker"
            className="font-body font-semibold bg-primary text-bg px-6 py-3 rounded-md hover:bg-primary-dark transition-colors"
          >
            {t("hero.ctaWorker")}
          </Link>
          <Link
            to="/login?role=hirer"
            className="font-body font-semibold border-2 border-primary text-primary px-6 py-3 rounded-md hover:bg-primary hover:text-bg transition-colors"
          >
            {t("hero.ctaHirer")}
          </Link>
        </div>
      </div>

      <div className="relative">
        <div className="bg-white border border-border rounded-lg p-6 shadow-sm relative overflow-hidden">
          <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-accent/15 flex items-center justify-center rotate-12">
            <span className="text-2xl">📦</span>
          </div>
          <p className="font-mono text-xs text-muted tracking-wide">JOB #A24F</p>
          <h3 className="font-display font-bold text-lg mt-2">{t("hero.jobCardTitle")}</h3>
          <div className="flex items-center gap-2 mt-3 text-sm text-muted font-body">
            <span>📍 {t("hero.jobCardDistance")}</span>
          </div>
          <div className="border-t border-dashed border-border mt-4 pt-4 flex items-center justify-between">
            <span className="font-mono font-semibold text-primary">₹500/day</span>
            <span className="font-body text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
              {t("hero.jobCardStatus")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;