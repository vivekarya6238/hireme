import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import Navbar from "../components/Navbar";
import { getCategoryIcon } from "../utils/categoryicons";
import { CheckCircle2, Circle, Check, Pencil } from "lucide-react";

const AVAILABILITY_OPTIONS = ["fulltime", "parttime", "hourly"];
const EDUCATION_OPTIONS = ["none", "primary", "middle", "matric", "plus2", "graduate"];
const PAYTYPE_OPTIONS = ["perday", "permonth", "perhour"];

function FieldStatus({ done }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-body font-medium transition-colors ${
        done
          ? "bg-green-50 text-green-700"
          : "bg-[var(--color-bg)] text-[var(--color-muted)]"
      }`}
    >
      {done ? <CheckCircle2 size={12} /> : <Circle size={12} />}
      {done ? "Added" : "Not added"}
    </span>
  );
}

function BioEditor({ initialBio, onSaved }) {
  const { t } = useTranslation();
  const [value, setValue] = useState(initialBio);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef(null);

  const isDirty = value.trim() !== initialBio.trim();

  const handleSave = async () => {
    if (!isDirty || saving) return;
    setSaving(true);
    setError("");
    try {
      await api.patch("/users/me", { workerprofile: { bio: value.trim() } });
      onSaved(value.trim());
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1800);
    } catch (err) {
      setError(err.response?.data?.message || t("auth.genericError"));
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6">
      <div className="flex items-center justify-between mb-1.5">
        <label className="font-body text-sm font-semibold text-[var(--color-ink)]">
          {t("editProfile.bioLabel")}
        </label>
        <FieldStatus done={value.trim().length > 0} />
      </div>
      <p className="font-body text-xs text-[var(--color-muted)] mb-3">
        {t("editProfile.bioHint")}
      </p>

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, 150))}
          onKeyDown={handleKeyDown}
          placeholder={t("editProfile.bioPlaceholder")}
          rows={3}
          className="w-full px-4 py-3 pr-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] font-body text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)] transition-colors resize-none"
        />

        <AnimatePresence>
          {isDirty && !justSaved && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center disabled:opacity-60 hover:bg-[var(--color-primary-dark)] transition-colors"
            >
              <Check size={15} />
            </motion.button>
          )}

          {justSaved && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center"
            >
              <Check size={15} />
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between mt-1.5">
        <p className="font-body text-xs text-[var(--color-muted)]">
          {isDirty ? t("editProfile.bioUnsaved") : justSaved ? t("editProfile.bioSaved") : ""}
        </p>
        <p className="font-mono text-xs text-[var(--color-muted)]">{value.length}/150</p>
      </div>

      {error && <p className="text-sm text-red-600 font-body mt-2">{error}</p>}
    </div>
  );
}

export default function EditProfile() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [role, setRole] = useState("");
  const [categories, setCategories] = useState([]);
  const [bio, setBio] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [otherText, setOtherText] = useState("");
  // controls visibility independent of saved text - so re-clicking can close it
  const [showOther, setShowOther] = useState(false);
  const [experienceyears, setExperienceyears] = useState("");
  const [availability, setAvailability] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payType, setPayType] = useState("perday");
  const [education, setEducation] = useState("");
  const [businessname, setBusinessname] = useState("");

  useEffect(() => {
    Promise.all([api.get("/auth/me"), api.get("/categories")])
      .then(([meRes, catRes]) => {
        const user = meRes.data.user;
        setRole(user.role);
        setCategories(catRes.data.categories || []);

        const wp = user.workerprofile || {};
        setBio(wp.bio || "");
        setSelectedSkills(wp.skills?.map((s) => s._id) || []);
        setOtherText(wp.othercategorytext || "");
        setShowOther(!!wp.othercategorytext);
        setExperienceyears(wp.experienceyears ?? "");
        setAvailability(wp.availability || "");
        setPayAmount(wp.expectedpay?.amount ?? "");
        setPayType(wp.expectedpay?.type || "perday");
        setEducation(wp.education || "");

        setBusinessname(user.hirerprofile?.businessname || "");
      })
      .catch(() => setError(t("auth.genericError")))
      .finally(() => setLoading(false));
  }, [t]);

  const toggleSkill = (id) => {
    setSelectedSkills((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  // re-clicking "not listed" while it's open closes it and clears whatever was typed
  const handleToggleOther = () => {
    if (showOther) {
      setShowOther(false);
      setOtherText("");
    } else {
      setShowOther(true);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSaveSuccess(false);
    setSaving(true);

    try {
      const payload = {};

      if (role === "worker") {
        payload.workerprofile = {
          skills: selectedSkills,
          othercategorytext: otherText.trim(),
        };
        if (experienceyears !== "") {
          payload.workerprofile.experienceyears = Number(experienceyears);
        }
        if (availability) payload.workerprofile.availability = availability;
        if (payAmount !== "") {
          payload.workerprofile.expectedpay = { amount: Number(payAmount), type: payType };
        }
        if (education) payload.workerprofile.education = education;
      }

      if (role === "hirer") {
        payload.hirerprofile = { businessname: businessname.trim() };
      }

      await api.patch("/users/me", payload);
      setSaveSuccess(true);
      setTimeout(() => navigate("/profile"), 900);
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
          {t("editProfile.title")}
        </h1>

        <div className="space-y-6">
          {role === "worker" && <BioEditor initialBio={bio} onSaved={setBio} />}

          <form onSubmit={handleSave} className="space-y-6">
            {role === "worker" && (
              <>
                <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="font-body text-sm font-semibold text-[var(--color-ink)]">
                      {t("editProfile.categoriesLabel")}
                    </label>
                    <FieldStatus done={selectedSkills.length > 0 || otherText.trim().length > 0} />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {categories.map((cat) => {
                      const isSelected = selectedSkills.includes(cat._id);
                      const Icon = getCategoryIcon(cat.namekey);
                      return (
                        <button
                          key={cat._id}
                          type="button"
                          onClick={() => toggleSkill(cat._id)}
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
                      onClick={handleToggleOther}
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
                        <label className="font-body text-xs text-[var(--color-muted)] mb-1.5 block">
                          {t("editProfile.otherCategoryLabel")}
                        </label>
                        <input
                          type="text"
                          value={otherText}
                          onChange={(e) => setOtherText(e.target.value)}
                          placeholder={t("onboarding.otherCategoryPlaceholder")}
                          className="w-full h-11 px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] font-body text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)] transition-colors"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6 space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-body text-sm font-semibold text-[var(--color-ink)]">
                        {t("profile.experience")}
                      </label>
                      <FieldStatus done={experienceyears !== ""} />
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={experienceyears}
                      onChange={(e) => setExperienceyears(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] font-body text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)] transition-colors"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-body text-sm font-semibold text-[var(--color-ink)]">
                        {t("profile.availability")}
                      </label>
                      <FieldStatus done={!!availability} />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {AVAILABILITY_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setAvailability(opt)}
                          className={`h-10 rounded-xl border-2 font-body text-xs font-medium transition-colors ${
                            availability === opt
                              ? "border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5"
                              : "border-[var(--color-border)] text-[var(--color-ink)] bg-[var(--color-bg)]"
                          }`}
                        >
                          {t(`profile.availability.${opt}`)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-body text-sm font-semibold text-[var(--color-ink)]">
                        {t("profile.expectedPay")}
                      </label>
                      <FieldStatus done={payAmount !== ""} />
                    </div>
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

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-body text-sm font-semibold text-[var(--color-ink)]">
                        {t("profile.education")}
                      </label>
                      <FieldStatus done={!!education} />
                    </div>
                    <select
                      value={education}
                      onChange={(e) => setEducation(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] font-body text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)] transition-colors"
                    >
                      <option value="">—</option>
                      {EDUCATION_OPTIONS.map((ed) => (
                        <option key={ed} value={ed}>
                          {t(`profile.education.${ed}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {role === "hirer" && (
              <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-body text-sm font-semibold text-[var(--color-ink)]">
                    {t("onboarding.businessNameLabel")}
                  </label>
                  <FieldStatus done={businessname.trim().length > 0} />
                </div>
                <input
                  type="text"
                  value={businessname}
                  onChange={(e) => setBusinessname(e.target.value)}
                  placeholder={t("onboarding.businessNamePlaceholder")}
                  className="w-full h-11 px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] font-body text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)] transition-colors"
                />
              </div>
            )}

            {error && <p className="text-sm text-red-600 font-body">{error}</p>}
            {saveSuccess && (
              <p className="text-sm text-green-700 font-body flex items-center gap-1.5">
                <Check size={15} /> {t("editProfile.allSaved")}
              </p>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/profile")}
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
    </div>
  );
}