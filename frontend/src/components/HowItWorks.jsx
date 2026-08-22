import { useTranslation } from "react-i18next";

function HowItWorks() {
  const { t } = useTranslation();
  const steps = [
    { icon: "🎯", title: t("howItWorks.step1Title"), desc: t("howItWorks.step1Desc") },
    { icon: "📍", title: t("howItWorks.step2Title"), desc: t("howItWorks.step2Desc") },
    { icon: "🤝", title: t("howItWorks.step3Title"), desc: t("howItWorks.step3Desc") },
  ];

  return (
    <section className="bg-white border-y border-border">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="font-display font-bold text-2xl text-center mb-10">{t("howItWorks.title")}</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s) => (
            <div key={s.title} className="text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-2xl">
                {s.icon}
              </div>
              <h3 className="font-display font-semibold mt-4">{s.title}</h3>
              <p className="font-body text-muted text-sm mt-1">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;