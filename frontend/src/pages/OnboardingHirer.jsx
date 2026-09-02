import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import Logo from "../components/Logo";

export default function OnboardingHirer() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState("location");

  const [coords, setCoords] = useState(null);
  const [locationStatus, setLocationStatus] = useState("idle");
  const [locationError, setLocationError] = useState("");

  const [businessName, setBusinessName] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

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
      const payload = {};
      if (coords) {
        payload.location = { type: "Point", coordinates: coords };
      }
      if (businessName.trim()) {
        payload.hirerprofile = { businessname: businessName.trim() };
      }

      if (Object.keys(payload).length > 0) {
        await api.patch("/users/me", payload);
      }
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
            {step === "location" ? 1 : 2}
          </span>
          <span className="font-body text-xs text-[var(--color-muted)]">
            {t("onboarding.stepOf", { current: step === "location" ? 1 : 2, total: 2 })}
          </span>
        </div>

        <AnimatePresence mode="wait">
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
                {t("onboarding.hirerLocationSubtitle")}
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
                    {t("onboarding.hirerLocationHelp")}
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

              <div className="flex items-center justify-between mt-10">
                <button
                  onClick={handleSkipAll}
                  className="font-body text-sm text-[var(--color-muted)] underline"
                >
                  {t("onboarding.skip")}
                </button>
                <button
                  onClick={() => setStep("business")}
                  className="h-12 px-8 rounded-xl bg-[var(--color-primary)] text-white font-display font-semibold hover:bg-[var(--color-primary-dark)] transition-colors"
                >
                  {t("onboarding.continue")}
                </button>
              </div>
            </motion.div>
          )}

          {step === "business" && (
            <motion.div
              key="business-step"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h1 className="font-display text-2xl font-bold text-[var(--color-ink)] mb-1">
                {t("onboarding.businessTitle")}
              </h1>
              <p className="font-body text-sm text-[var(--color-muted)] mb-8">
                {t("onboarding.businessSubtitle")}
              </p>

              <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6">
                <label className="font-body text-sm text-[var(--color-ink)] mb-1.5 block">
                  {t("onboarding.businessNameLabel")}
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder={t("onboarding.businessNamePlaceholder")}
                  className="w-full h-12 px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] font-body text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)] transition-colors"
                />
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