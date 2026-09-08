import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import Navbar from "../components/Navbar";

const PAYTYPE_OPTIONS = ["perday", "permonth", "perhour"];

export default function EditJob() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payType, setPayType] = useState("perday");
  const [openings, setOpenings] = useState("1");
  const [selectedCount, setSelectedCount] = useState(0);

  useEffect(() => {
    api
      .get(`/jobs/${id}`)
      .then((res) => {
        const job = res.data.job;
        setTitle(job.title);
        setDescription(job.description || "");
        setPayAmount(job.pay.amount);
        setPayType(job.pay.type);
        setOpenings(job.openings);
        setSelectedCount(job.selectedcount || 0);
      })
      .catch(() => setError(t("auth.genericError")))
      .finally(() => setLoading(false));
  }, [id, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) return setError(t("postJob.titleRequired"));
    if (!payAmount) return setError(t("postJob.payRequired"));

    const openingsNum = Number(openings);
    if (!openingsNum || openingsNum < 1) return setError(t("editJob.openingsInvalid"));
    if (openingsNum < selectedCount) {
      return setError(t("editJob.openingsBelowSelected", { count: selectedCount }));
    }

    setSaving(true);
    try {
      await api.patch(`/jobs/${id}`, {
        title: title.trim(),
        description: description.trim(),
        pay: { amount: Number(payAmount), type: payType },
        openings: openingsNum,
      });
      navigate(`/jobs/${id}`);
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
        <h1 className="font-display text-2xl font-bold text-[var(--color-ink)] mb-2">
          {t("editJob.title")}
        </h1>
        <p className="font-body text-sm text-[var(--color-muted)] mb-8">
          {t("editJob.subtitle")}
        </p>

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
                className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] font-body text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)] transition-colors resize-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-body text-sm font-semibold text-[var(--color-ink)]">
                  {t("postJob.openingsLabel")}
                </label>
                {selectedCount > 0 && (
                  <span className="font-body text-xs text-[var(--color-muted)]">
                    {t("editJob.alreadySelected", { count: selectedCount })}
                  </span>
                )}
              </div>
              <input
                type="number"
                min={selectedCount || 1}
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

            <p className="font-body text-xs text-[var(--color-muted)]">
              {t("editJob.lockedFieldsNote")}
            </p>
          </div>

          {error && <p className="text-sm text-red-600 font-body">{error}</p>}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(`/jobs/${id}`)}
              className="h-12 px-6 rounded-xl border border-[var(--color-border)] bg-white font-body text-sm font-semibold text-[var(--color-ink)]"
            >
              {t("editProfile.cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-12 rounded-xl bg-[var(--color-primary)] text-white font-display font-semibold disabled:opacity-60 hover:bg-[var(--color-primary-dark)] transition-colors"
            >
              {saving ? t("editProfile.saving") : t("editProfile.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}