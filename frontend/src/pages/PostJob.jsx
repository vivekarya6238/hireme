import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import Navbar from "../components/Navbar";
import { getCategoryIcon } from "../utils/categoryicons";
import { Pencil } from "lucide-react";

const PAYTYPE_OPTIONS = ["perday", "permonth", "perhour"];

export default function PostJob() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [workplacetypes, setWorkplacetypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [showOther, setShowOther] = useState(false);
  const [otherText, setOtherText] = useState("");
  const [workplacetypeId, setWorkplacetypeId] = useState("");
  const [openings, setOpenings] = useState("1");
  const [payAmount, setPayAmount] = useState("");
  const [payType, setPayType] = useState("perday");

  useEffect(() => {
    Promise.all([api.get("/categories"), api.get("/workplacetypes")])
      .then(([catRes, wpRes]) => {
        setCategories(catRes.data.categories || []);
        setWorkplacetypes(wpRes.data.workplacetypes || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const otherCategory = categories.find((c) => c.namekey === "cat.other");

  const handleSelectOther = () => {
    setShowOther((v) => {
      const next = !v;
      setCategoryId(next && otherCategory ? otherCategory._id : "");
      if (!next) setOtherText("");
      return next;
    });
  };

  const handleSelectNormal = (id) => {
    setShowOther(false);
    setOtherText("");
    setCategoryId(id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) return setError(t("postJob.titleRequired"));
    if (!categoryId) return setError(t("postJob.categoryRequired"));
    if (showOther && !otherText.trim()) return setError(t("postJob.otherCategoryRequired"));
    if (!workplacetypeId) return setError(t("postJob.workplaceRequired"));
    if (!payAmount) return setError(t("postJob.payRequired"));

    setSaving(true);
    try {
      const meRes = await api.get("/auth/me");
      const loc = meRes.data.user.location;
      if (!loc?.coordinates) {
        setError(t("postJob.noLocation"));
        setSaving(false);
        return;
      }

      const payload = {
        title: title.trim(),
        description: description.trim(),
        category: categoryId,
        workplacetype: workplacetypeId,
        openings: Number(openings),
        pay: { amount: Number(payAmount), type: payType },
        location: { type: "Point", coordinates: loc.coordinates },
      };
      if (showOther && otherText.trim()) {
        payload.othercategorytext = otherText.trim();
      }

      await api.post("/jobs", payload);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || t("auth.genericError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-10 flex justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)] animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="font-display text-2xl font-bold text-[var(--color-ink)] mb-8">
          {t("postJob.title")}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6 space-y-5">
            <div>
              <label className="font-body text-sm font-semibold text-[var(--color-ink)] mb-1.5 block">
                {t("postJob.jobTitleLabel")}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("postJob.jobTitlePlaceholder")}
                className="w-full h-11 px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] font-body text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)] transition-colors"
              />
            </div>

            <div>
              <label className="font-body text-sm font-semibold text-[var(--color-ink)] mb-1.5 block">
                {t("postJob.descriptionLabel")}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder={t("postJob.descriptionPlaceholder")}
                className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] font-body text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)] transition-colors resize-none"
              />
            </div>

            <div>
              <label className="font-body text-sm font-semibold text-[var(--color-ink)] mb-2 block">
                {t("postJob.categoryLabel")}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {categories
                  .filter((cat) => cat.namekey !== "cat.other")
                  .map((cat) => {
                    const isSelected = categoryId === cat._id && !showOther;
                    const Icon = getCategoryIcon(cat.namekey);
                    return (
                      <button
                        key={cat._id}
                        type="button"
                        onClick={() => handleSelectNormal(cat._id)}
                        className={`h-16 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-colors ${
                          isSelected
                            ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                            : "border-[var(--color-border)] bg-[var(--color-bg)]"
                        }`}
                      >
                        <Icon
                          size={16}
                          strokeWidth={1.75}
                          className={isSelected ? "text-[var(--color-primary)]" : "text-[var(--color-ink)]"}
                        />
                        <span
                          className={`font-body text-xs ${
                            isSelected ? "text-[var(--color-primary)] font-semibold" : "text-[var(--color-ink)]"
                          }`}
                        >
                          {t(`categories.${cat.namekey}`)}
                        </span>
                      </button>
                    );
                  })}

                <button
                  type="button"
                  onClick={handleSelectOther}
                  className={`h-16 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors ${
                    showOther
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                      : "border-[var(--color-border)] bg-[var(--color-bg)]"
                  }`}
                >
                  <Pencil
                    size={16}
                    strokeWidth={1.75}
                    className={showOther ? "text-[var(--color-primary)]" : "text-[var(--color-ink)]"}
                  />
                  <span
                    className={`font-body text-xs ${
                      showOther ? "text-[var(--color-primary)] font-semibold" : "text-[var(--color-ink)]"
                    }`}
                  >
                    {t("onboarding.otherCategory")}
                  </span>
                </button>
              </div>

              <AnimatePresence>
                {showOther && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3"
                  >
                    <input
                      type="text"
                      value={otherText}
                      onChange={(e) => setOtherText(e.target.value)}
                      placeholder={t("postJob.otherCategoryPlaceholder")}
                      className="w-full h-11 px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] font-body text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)] transition-colors"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div>
              <label className="font-body text-sm font-semibold text-[var(--color-ink)] mb-2 block">
                {t("postJob.workplaceLabel")}
              </label>
              <select
                value={workplacetypeId}
                onChange={(e) => setWorkplacetypeId(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] font-body text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)] transition-colors"
              >
                <option value="">—</option>
                {workplacetypes.map((wp) => (
                  <option key={wp._id} value={wp._id}>
                    {t(`workplacetypes.${wp.namekey}`)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-body text-sm font-semibold text-[var(--color-ink)] mb-1.5 block">
                {t("postJob.openingsLabel")}
              </label>
              <input
                type="number"
                min="1"
                value={openings}
                onChange={(e) => setOpenings(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] font-body text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)] transition-colors"
              />
            </div>

            <div>
              <label className="font-body text-sm font-semibold text-[var(--color-ink)] mb-1.5 block">
                {t("postJob.payLabel")}
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="₹"
                  className="flex-1 h-11 px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] font-mono text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)] transition-colors"
                />
                <select
                  value={payType}
                  onChange={(e) => setPayType(e.target.value)}
                  className="h-11 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] font-body text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)] transition-colors"
                >
                  {PAYTYPE_OPTIONS.map((pt) => (
                    <option key={pt} value={pt}>
                      {t(`profile.paytype.${pt}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 font-body">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full h-12 rounded-xl bg-[var(--color-primary)] text-white font-display font-semibold disabled:opacity-60 hover:bg-[var(--color-primary-dark)] transition-colors"
          >
            {saving ? t("postJob.posting") : t("postJob.submit")}
          </button>
        </form>
      </div>
    </div>
  );
}