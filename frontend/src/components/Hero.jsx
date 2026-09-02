import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

function Hero() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 hero-pattern opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="relative max-w-6xl mx-auto px-6 py-24 md:py-32 grid md:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <span className="font-mono text-xs tracking-wider uppercase text-accent bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-full">
            {t("hero.eyebrow")}
          </span>
          <h1 className="font-display font-extrabold text-4xl md:text-6xl leading-[1.05] mt-6 text-ink tracking-tight">
            {t("hero.heading1")}
            <br />
            <span className="text-primary">{t("hero.heading2")}</span>
          </h1>
          <p className="font-body text-muted text-lg mt-6 max-w-md leading-relaxed">
            {t("hero.subtitle")}
          </p>
          <div className="flex flex-wrap gap-3 mt-9">
            <Link
              to="/login?role=worker"
              className="font-body font-semibold bg-primary text-bg px-6 py-3.5 rounded-lg shadow-sm hover:bg-primary-dark hover:shadow-md transition-all"
            >
              {t("hero.ctaWorker")}
            </Link>
            <Link
              to="/login?role=hirer"
              className="font-body font-semibold border-2 border-primary text-primary px-6 py-3.5 rounded-lg hover:bg-primary hover:text-bg transition-all"
            >
              {t("hero.ctaHirer")}
            </Link>
          </div>
        </motion.div>

        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 16, rotate: -1 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
        >
          <div className="absolute -inset-4 bg-primary/5 rounded-2xl -rotate-2" />
          <div className="relative bg-white border border-border rounded-xl p-6 shadow-lg">
            <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full bg-accent/15 flex items-center justify-center rotate-12 shadow-sm">
              <span className="text-2xl">📦</span>
            </div>
            <p className="font-mono text-xs text-muted tracking-wide">JOB #A24F</p>
            <h3 className="font-display font-bold text-lg mt-2">{t("hero.jobCardTitle")}</h3>
            <div className="flex items-center gap-2 mt-3 text-sm text-muted font-body">
              <span>📍 {t("hero.jobCardDistance")}</span>
            </div>
            <div className="border-t border-dashed border-border mt-4 pt-4 flex items-center justify-between">
              <span className="font-mono font-semibold text-primary">₹500/day</span>
              <span className="font-body text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                {t("hero.jobCardStatus")}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;