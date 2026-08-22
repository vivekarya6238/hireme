import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../services/api";

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
    <section className="max-w-6xl mx-auto px-6 py-16">
      <h2 className="font-display font-bold text-2xl text-center mb-10">{t("categories.title")}</h2>

      {loading && <p className="text-center text-muted font-body">{t("categories.loading")}</p>}

      {!loading && categories.length === 0 && (
        <p className="text-center text-muted font-body">{t("categories.empty")}</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {categories.map((c) => (
          <div
            key={c._id}
            className="bg-white border border-border rounded-lg p-4 text-center hover:border-primary hover:shadow-sm transition-all cursor-pointer"
          >
            <span className="text-3xl">{c.icon}</span>
            <p className="font-body text-sm font-medium mt-2">{t(`categories.${c.namekey}`)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default CategoryPreview;