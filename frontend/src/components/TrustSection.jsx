import { useTranslation } from "react-i18next";

function TrustSection() {
  const { t } = useTranslation();
  const points = [
    { icon: "🆓", text: t("trust.free") },
    { icon: "📱", text: t("trust.phone") },
    { icon: "⭐", text: t("trust.ratings") },
  ];

  return (
    <section className="bg-primary/5 border-y border-border">
      <div className="max-w-6xl mx-auto px-6 py-14 grid sm:grid-cols-3 gap-6">
        {points.map((p) => (
          <div key={p.text} className="flex items-center gap-3 bg-white rounded-lg p-4 border border-border">
            <span className="text-2xl">{p.icon}</span>
            <span className="font-body text-sm font-medium">{p.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default TrustSection;