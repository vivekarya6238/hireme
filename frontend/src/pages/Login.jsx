import { useAuth } from "../context/AuthContext";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import Logo from "../components/Logo";

const isvalidphone = (phone) => /^[6-9]\d{9}$/.test(phone);

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [otpDigits, setOtpDigits] = useState(Array(6).fill(""));
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [isnewuser, setIsnewuser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const otpRefs = useRef([]);

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isvalidphone(phone)) {
      setError(t("auth.invalidPhone"));
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/sendotp", { phone });
      setIsnewuser(res.data.isnewuser);
      setStep("otp");
    } catch (err) {
      setError(err.response?.data?.message || t("auth.genericError"));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setError("");

    const otp = otpDigits.join("");
    if (otp.length !== 6) {
      setError(t("auth.invalidOtp"));
      return;
    }
    if (isnewuser && !name.trim()) {
      setError(t("auth.nameRequired"));
      return;
    }
    if (isnewuser && !role) {
      setError(t("auth.roleRequired"));
      return;
    }

    setLoading(true);
    try {
      const payload = { phone, otp };
      if (isnewuser) {
        payload.name = name.trim();
        payload.role = role;
      }
      const res = await api.post("/auth/verifyotp", payload);
      login(res.data.token, res.data.user);
      if (isnewuser && role === "worker") {
        navigate("/onboarding/worker");
      } else if (isnewuser && role === "hirer") {
        navigate("/onboarding/hirer");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.response?.data?.message || t("auth.genericError"));
    } finally {
      setLoading(false);
    }
  };

  const handleChangeNumber = () => {
    setStep("phone");
    setOtpDigits(Array(6).fill(""));
    setError("");
  };

  return (
    <div className="min-h-screen flex">
      {/* branding side */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary)]/85 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[length:24px_24px]" />
        {/* soft, narrow blend into the form side instead of a hard cut */}
        <div className="absolute top-0 right-0 h-full w-16 bg-gradient-to-r from-transparent to-[var(--color-bg)]" />

        <div className="relative">
          <div className="flex items-center gap-2">
            <Logo size={36} />
            <span className="font-display text-xl font-bold text-white">
              Hire<span className="text-[var(--color-accent)]">Me</span>
            </span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <h2 className="font-display text-3xl font-bold text-white leading-tight mb-5">
            {t("hero.heading1")}
            <br />
            {t("hero.heading2")}
          </h2>

          <div className="bg-white rounded-2xl shadow-xl p-5 max-w-xs relative ring-1 ring-black/5">
            <div className="absolute -top-3 -right-3 w-11 h-11 rounded-full bg-white shadow-md flex items-center justify-center rotate-6 ring-4 ring-[var(--color-accent)]/15">
              <span className="text-lg -rotate-6">📦</span>
            </div>
            <p className="font-mono text-xs tracking-wide text-[var(--color-muted)] mb-2">
              JOB #A24F
            </p>
            <p className="font-display font-semibold text-[var(--color-ink)] mb-4">
              {t("hero.jobCardTitle")}
            </p>
            <div className="border-t border-dashed border-[var(--color-border)] pt-3 flex items-center justify-between">
              <span className="font-mono font-bold text-[var(--color-ink)] text-lg">
                {t("hero.jobCardDistance")}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                {t("hero.jobCardStatus")}
              </span>
            </div>
          </div>
        </motion.div>

        <p className="relative font-body text-sm text-white/60">
          {t("footer.tagline")}
        </p>
      </div>

      {/* form side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-[var(--color-bg)] px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Logo size={32} />
            <span className="font-display text-lg font-bold text-[var(--color-ink)]">
              Hire<span className="text-[var(--color-primary)]">Me</span>
            </span>
          </div>

          <AnimatePresence mode="wait">
            {step === "phone" && (
              <motion.div
                key="phone-step"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h1 className="font-display text-2xl font-bold text-[var(--color-ink)] mb-1">
                  {t("auth.title")}
                </h1>
                <p className="font-body text-sm text-[var(--color-muted)] mb-8">
                  {t("auth.subtitle")}
                </p>

                <form onSubmit={handlePhoneSubmit} className="space-y-5">
                  <div>
                    <label className="font-body text-sm text-[var(--color-ink)] mb-1.5 block">
                      {t("auth.phoneLabel")}
                    </label>
                    <div className="flex items-center border border-[var(--color-border)] rounded-xl overflow-hidden bg-white focus-within:border-[var(--color-primary)] transition-colors">
                      <span className="px-3 font-mono text-[var(--color-muted)] h-12 flex items-center border-r border-[var(--color-border)]">
                        +91
                      </span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        autoFocus
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                        placeholder={t("auth.phonePlaceholder")}
                        className="flex-1 h-12 px-3 font-mono text-[var(--color-ink)] outline-none"
                      />
                    </div>
                  </div>

                  {error && <p className="text-sm text-red-600 font-body">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-[var(--color-primary)] text-white font-display font-semibold disabled:opacity-60 hover:bg-[var(--color-primary-dark)] transition-colors"
                  >
                    {loading ? t("auth.sending") : t("auth.sendOtp")}
                  </button>
                </form>
              </motion.div>
            )}

            {step === "otp" && (
              <motion.div
                key="otp-step"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {!isnewuser && (
                  <>
                    <h1 className="font-display text-2xl font-bold text-[var(--color-ink)] mb-1">
                      {t("auth.verifyOtp")}
                    </h1>
                    <p className="font-body text-sm text-[var(--color-muted)] mb-8">
                      {t("auth.otpSentTo")} +91 {phone}
                    </p>
                  </>
                )}

                {isnewuser && (
                  <div className="mb-6">
                    <span className="inline-block text-xs font-semibold tracking-wide uppercase text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-2.5 py-1 rounded-full mb-2">
                      {t("auth.newAccountBadge")}
                    </span>
                    <h1 className="font-display text-2xl font-bold text-[var(--color-ink)] mb-1">
                      {t("auth.createAccountTitle")}
                    </h1>
                    <p className="font-body text-sm text-[var(--color-muted)]">
                      {t("auth.otpSentTo")} +91 {phone}
                    </p>
                  </div>
                )}

                <form onSubmit={handleVerifySubmit} className="space-y-5">
                  <div
                    className={
                      isnewuser
                        ? "bg-white rounded-2xl border border-[var(--color-border)] p-4"
                        : ""
                    }
                  >
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-body text-sm text-[var(--color-ink)]">
                        {t("auth.otpLabel")}
                      </label>
                      <button
                        type="button"
                        onClick={handleChangeNumber}
                        className="text-xs text-[var(--color-primary)] underline"
                      >
                        {t("auth.changeNumber")}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      {otpDigits.map((digit, i) => (
                        <input
                          key={i}
                          ref={(el) => (otpRefs.current[i] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          autoFocus={i === 0}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          className="w-11 h-12 text-center rounded-xl border border-[var(--color-border)] bg-white font-mono text-lg text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)] transition-colors"
                        />
                      ))}
                    </div>
                  </div>

                  {isnewuser && (
                    <div className="bg-white rounded-2xl border border-[var(--color-border)] p-4 space-y-4">
                      <div>
                        <label className="font-body text-sm text-[var(--color-ink)] mb-1.5 block">
                          {t("auth.nameLabel")}
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder={t("auth.namePlaceholder")}
                          className="w-full h-12 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] font-body text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)] transition-colors"
                        />
                      </div>

                      <div>
                        <label className="font-body text-sm text-[var(--color-ink)] mb-2 block">
                          {t("auth.roleLabel")}
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { key: "worker", icon: "🧰", label: t("auth.roleWorker") },
                            { key: "hirer", icon: "🤝", label: t("auth.roleHirer") },
                          ].map((opt) => (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => setRole(opt.key)}
                              className={`h-24 rounded-xl border-2 bg-[var(--color-bg)] font-body text-sm flex flex-col items-center justify-center gap-2 transition-colors ${
                                role === opt.key
                                  ? "border-[var(--color-primary)]"
                                  : "border-[var(--color-border)]"
                              }`}
                            >
                              <span
                                className={`w-9 h-9 rounded-full flex items-center justify-center rotate-6 ${
                                  role === opt.key
                                    ? "bg-[var(--color-primary)]/10"
                                    : "bg-white"
                                }`}
                              >
                                <span className="-rotate-6 text-lg">{opt.icon}</span>
                              </span>
                              <span
                                className={
                                  role === opt.key
                                    ? "text-[var(--color-primary)] font-semibold"
                                    : "text-[var(--color-ink)]"
                                }
                              >
                                {opt.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {error && <p className="text-sm text-red-600 font-body">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-[var(--color-primary)] text-white font-display font-semibold disabled:opacity-60 hover:bg-[var(--color-primary-dark)] transition-colors"
                  >
                    {loading
                      ? t("auth.verifying")
                      : isnewuser
                      ? t("auth.createAndContinue")
                      : t("auth.verifyOtp")}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}