import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import Logo from "../components/Logo";
import { getCategoryIcon } from "../utils/categoryicons";

export default function OnboardingWorker() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState("category");

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selected, setSelected] = useState([]);
  const [showOther, setShowOther] = useState(false);
  const [otherText, setOtherText] = useState("");

  const [coords, setCoords] = useState(null);
  const [locationStatus, setLocationStatus] = useState("idle"); // idle | detecting | success | error
  const [locationError, setLocationError] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    api
      .get("/categories")
      .then((res) => setCategories(res.data.categories))
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false));
  }, []);

  const toggleCategory = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const canContinueCategory = selected.length > 0 || (showOther && otherText.trim());

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      setLocationError(t("onboarding.geoNotSupported"));
      return;
    }

    setLocationStatus("detecting");
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords([pos.coords.longitude, pos.coords.latitude]);
        setLocationStatus("success");
      },
      () => {
        setLocationStatus("error");
        setLocationError(t("onboarding.geoDenied"));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleFinish = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const payload = {
        workerprofile: {
          skills: selected,
          ...(showOther && otherText.trim() && { othercategorytext: otherText.trim() }),
        },
      };
      if (coords) {
        payload.location = { type: "Point", coordinates: coords };
      }

      await api.patch("/users/me", payload);
      navigate("/");
    } catch (err) {
      setSaveError(err.response?.data?.message || t("auth.genericError"));
    } finally {
      setSaving(false);
    }
  };

  const handleSkipAll = () => navigate("/");

  return (
    <div className="min-h-screen bg-[var(--color-bg)] px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-8">
          <Logo size={32} />
          <span className="font-display text-lg font-bold text-[var(--color-ink)]">
            Hire<span className="text-[var(--color-primary)]">Me</span>
          </span>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <span className="w-6 h-6 rounded-full bg-[var(--color-primary)] text-white text-xs font-bold flex items-center justify-center">
            {step === "category" ? 1 : 2}
          </span>
          <span className="font-body text-xs text-[var(--color-muted)]">
            {t("onboarding.stepOf", { current: step === "category" ? 1 : 2, total: 2 })}
          </span>
        </div>

        <AnimatePresence mode="wait">
          {step === "category" && (
            <motion.div
              key="category-step"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h1 className="font-display text-2xl font-bold text-[var(--color-ink)] mb-1">
                {t("onboarding.categoryTitle")}
              </h1>
              <p className="font-body text-sm text-[var(--color-muted)] mb-8">
                {t("onboarding.categorySubtitle")}
              </p>

              {loadingCategories ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-24 rounded-xl bg-white border border-[var(--color-border)] animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {categories.map((cat) => {
                    const isSelected = selected.includes(cat._id);
                    const Icon = getCategoryIcon(cat.namekey);
                    return (
                      <motion.button
                        key={cat._id}
                        type="button"
                        onClick={() => toggleCategory(cat._id)}
                        whileTap={{ scale: 0.97 }}
                        className={`h-24 rounded-xl border-2 bg-white flex flex-col items-center justify-center gap-2 transition-colors relative ${
                          isSelected ? "border-[var(--color-primary)]" : "border-[var(--color-border)]"
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        )}
                        <span
                          className={`w-9 h-9 rounded-full flex items-center justify-center ${
                            isSelected ? "bg-[var(--color-primary)]/10" : "bg-[var(--color-bg)]"
                          }`}
                        >
                          <Icon
                            size={20}
                            strokeWidth={1.75}
                            className={isSelected ? "text-[var(--color-primary)]" : "text-[var(--color-ink)]"}
                          />
                        </span>
                        <span
                          className={`font-body text-xs text-center px-1 ${
                            isSelected ? "text-[var(--color-primary)] font-semibold" : "text-[var(--color-ink)]"
                          }`}
                        >
                          {t(`categories.${cat.namekey}`)}
                        </span>
                      </motion.button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setShowOther((v) => !v)}
                    className={`h-24 rounded-xl border-2 border-dashed bg-white flex flex-col items-center justify-center gap-2 transition-colors ${
                      showOther ? "border-[var(--color-primary)]" : "border-[var(--color-border)]"
                    }`}
                  >
                    <span className="w-9 h-9 rounded-full bg-[var(--color-bg)] flex items-center justify-center">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="text-[var(--color-ink)]">
                        <path d="M12 20h9" strokeLinecap="round" />
                        <path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="font-body text-xs text-center px-1 text-[var(--color-ink)]">
                      {t("onboarding.otherCategory")}
                    </span>
                  </button>
                </div>
              )}

              {showOther && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4"
                >
                  <input
                    type="text"
                    value={otherText}
                    onChange={(e) => setOtherText(e.target.value)}
                    placeholder={t("onboarding.otherCategoryPlaceholder")}
                    className="w-full h-12 px-4 rounded-xl border border-[var(--color-border)] bg-white font-body text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)] transition-colors"
                  />
                </motion.div>
              )}

              <div className="flex items-center justify-between mt-10">
                <button
                  onClick={handleSkipAll}
                  className="font-body text-sm text-[var(--color-muted)] underline"
                >
                  {t("onboarding.skip")}
                </button>
                <button
                  disabled={!canContinueCategory}
                  onClick={() => setStep("location")}
                  className="h-12 px-8 rounded-xl bg-[var(--color-primary)] text-white font-display font-semibold disabled:opacity-40 hover:bg-[var(--color-primary-dark)] transition-colors"
                >
                  {t("onboarding.continue")}
                </button>
              </div>
            </motion.div>
          )}

          {step === "location" && (
            <motion.div
              key="location-step"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h1 className="font-display text-2xl font-bold text-[var(--color-ink)] mb-1">
                {t("onboarding.locationTitle")}
              </h1>
              <p className="font-body text-sm text-[var(--color-muted)] mb-8">
                {t("onboarding.locationSubtitle")}
              </p>

              <div className="bg-white rounded-2xl border border-[var(--color-border)] p-8 flex flex-col items-center text-center">
                <span
                  className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                    locationStatus === "success" ? "bg-green-100" : "bg-[var(--color-bg)]"
                  }`}
                >
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={locationStatus === "success" ? "#15803d" : "var(--color-primary)"}
                    strokeWidth="1.75"
                  >
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="10" r="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>

                {locationStatus === "success" ? (
                  <p className="font-body text-sm font-semibold text-green-700 mb-1">
                    {t("onboarding.locationDetected")}
                  </p>
                ) : (
                  <p className="font-body text-sm text-[var(--color-muted)] mb-4 max-w-xs">
                    {t("onboarding.locationHelp")}
                  </p>
                )}

                {locationStatus === "error" && (
                  <p className="text-sm text-red-600 font-body mb-4">{locationError}</p>
                )}

                {locationStatus !== "success" && (
                  <button
                    onClick={handleDetectLocation}
                    disabled={locationStatus === "detecting"}
                    className="h-11 px-6 rounded-xl bg-[var(--color-primary)] text-white font-display font-semibold text-sm disabled:opacity-60 hover:bg-[var(--color-primary-dark)] transition-colors"
                  >
                    {locationStatus === "detecting"
                      ? t("onboarding.detecting")
                      : locationStatus === "error"
                      ? t("onboarding.tryAgain")
                      : t("onboarding.detectLocation")}
                  </button>
                )}
              </div>

              {saveError && (
                <p className="text-sm text-red-600 font-body mt-4 text-center">{saveError}</p>
              )}

              <div className="flex items-center justify-between mt-10">
                <button
                  onClick={handleSkipAll}
                  className="font-body text-sm text-[var(--color-muted)] underline"
                >
                  {t("onboarding.skip")}
                </button>
                <button
                  disabled={saving}
                  onClick={handleFinish}
                  className="h-12 px-8 rounded-xl bg-[var(--color-primary)] text-white font-display font-semibold disabled:opacity-60 hover:bg-[var(--color-primary-dark)] transition-colors"
                >
                  {saving ? t("onboarding.saving") : t("onboarding.finish")}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}