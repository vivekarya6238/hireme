import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import { getCategoryIcon } from "../utils/categoryicons";

function CategoryPreview() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/categories")
      .then((res) => setCategories(res.data.categories || []))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="max-w-6xl mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <h2 className="font-display font-bold text-3xl text-ink">{t("categories.title")}</h2>
        <p className="font-body text-muted mt-2">Pick what fits, we'll show what's nearby</p>
      </div>

      {loading && <p className="text-center text-muted font-body">{t("categories.loading")}</p>}
      {!loading && categories.length === 0 && (
        <p className="text-center text-muted font-body">{t("categories.empty")}</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {categories.map((c) => {
          const Icon = getCategoryIcon(c.namekey);
          return (
            <div
              key={c._id}
              className="group bg-white border border-border rounded-xl p-5 text-center hover:border-primary hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-lg bg-bg flex items-center justify-center mx-auto group-hover:bg-primary/10 transition-colors">
                <Icon size={22} className="text-primary" strokeWidth={1.75} />
              </div>
              <p className="font-body text-sm font-semibold mt-3 text-ink">
                {t(`categories.${c.namekey}`)}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default CategoryPreview;