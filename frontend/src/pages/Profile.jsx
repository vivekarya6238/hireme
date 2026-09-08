import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import api from "../services/api";
import Navbar from "../components/Navbar";
import { getCategoryIcon } from "../utils/categoryicons";
import { Star, ShieldCheck, Calendar, TrendingUp, Clock, GraduationCap, Wallet, Sparkles, Pencil, PartyPopper } from "lucide-react";

// free reverse-geocoding via OpenStreetMap - no api key needed
async function reverseGeocode(lng, lat) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    const addr = data.address || {};
    // prefer city/town, fall back to whatever's available
    const place = addr.city || addr.town || addr.village || addr.suburb || addr.county;
    const state = addr.state;
    return [place, state].filter(Boolean).join(", ");
  } catch {
    return null;
  }
}

function calculateCompletion(profile) {
  if (profile.role !== "worker") return null;
  const wp = profile.workerprofile || {};
  let score = 0;
  if (profile.location) score += 25;
  if (wp.skills?.length > 0 || wp.othercategorytext) score += 25;
  if (wp.experienceyears !== undefined && wp.experienceyears !== null) score += 15;
  if (wp.availability) score += 15;
  if (wp.expectedpay?.amount) score += 10;
  if (wp.education) score += 10;
  return score;
}

function CompletionRing({ percent }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const color =
    percent >= 70 ? "#15803d" : percent >= 40 ? "var(--color-accent)" : "#dc2626";

  return (
    <div className="relative w-28 h-28 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--color-bg)" strokeWidth="8" />
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display text-2xl font-bold text-[var(--color-ink)]">{percent}%</span>
      </div>
    </div>
  );
}

function StatItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/8 flex items-center justify-center shrink-0">
        <Icon size={18} className="text-[var(--color-primary)]" strokeWidth={1.75} />
      </span>
      <div>
        <p className="font-body text-xs text-[var(--color-muted)]">{label}</p>
        <p className="font-body text-sm font-semibold text-[var(--color-ink)]">{value}</p>
      </div>
    </div>
  );
}

export default function Profile() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [placeName, setPlaceName] = useState(null);

  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => setProfile(res.data.user))
      .catch(() => setError(t("auth.genericError")))
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
  if (profile?.location?.coordinates) {
    const [lng, lat] = profile.location.coordinates;
    reverseGeocode(lng, lat).then(setPlaceName);
  }
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-10 flex justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)] animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-10 text-center">
          <p className="font-body text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  const initial = profile.name?.trim()?.[0]?.toUpperCase() || "?";
  const isWorker = profile.role === "worker";
  const wp = profile.workerprofile || {};
  const completion = calculateCompletion(profile);
  const memberSince = new Date(profile.createdAt).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
  const hasRating = isWorker && profile.ratingsummary?.countasworker > 0;

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
          <div className="lg:sticky lg:top-6 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl border border-[var(--color-border)] overflow-hidden"
            >
              <div className="h-16 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary)]/80" />
              <div className="px-6 pb-6 -mt-10">
                {profile.photo?.url ? (
                  <img
                    src={profile.photo.url}
                    alt={profile.name}
                    className="w-20 h-20 rounded-full object-cover ring-4 ring-white"
                  />
                ) : (
                  <span className="w-20 h-20 rounded-full bg-[var(--color-primary)] text-white font-display font-bold text-2xl flex items-center justify-center ring-4 ring-white">
                    {initial}
                  </span>
                )}

                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="font-display text-xl font-bold text-[var(--color-ink)] mt-3">
                      {profile.name}
                    </h1>
                    <span className="inline-block mt-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2.5 py-1 rounded-full">
                      {profile.role}
                    </span>
                  </div>
                  <Link
                    to="/profile/edit"
                    className="flex items-center gap-1.5 h-9 px-3.5 mt-3 rounded-full border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-colors shrink-0"
                  >
                    <Pencil size={13} className="text-[var(--color-ink)]" />
                    <span className="font-body text-xs font-semibold text-[var(--color-ink)] whitespace-nowrap">
                      {t("profile.editButton")}
                    </span>
                  </Link>
                </div>

                <div className="mt-5 space-y-3 pt-5 border-t border-[var(--color-border)]">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck size={16} className="text-green-600 shrink-0" />
                    <span className="font-body text-sm text-[var(--color-ink)]">
                      {t("profile.phoneVerified")}
                    </span>
                  </div>

                  {isWorker && (
                    <div className="flex items-center gap-2.5">
                      <Star
                        size={16}
                        className={hasRating ? "text-amber-500 fill-amber-500 shrink-0" : "text-[var(--color-muted)] shrink-0"}
                      />
                      <span className="font-body text-sm text-[var(--color-ink)]">
                        {hasRating
                          ? t("profile.ratingValue", {
                              rating: profile.ratingsummary.avgasworker.toFixed(1),
                              count: profile.ratingsummary.countasworker,
                            })
                          : t("profile.noRatingsYet")}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2.5">
                    <Calendar size={16} className="text-[var(--color-muted)] shrink-0" />
                    <span className="font-body text-sm text-[var(--color-ink)]">
                      {t("profile.memberSince", { date: memberSince })}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {isWorker && completion !== null && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-3xl border border-[var(--color-border)] p-6 text-center"
              >
                {completion === 100 ? (
                  <div className="py-2">
                    <span className="inline-flex w-12 h-12 rounded-full bg-green-100 items-center justify-center mb-3">
                      <PartyPopper size={22} className="text-green-600" />
                    </span>
                    <p className="font-body text-sm font-semibold text-[var(--color-ink)]">
                      {t("profile.completionDone")}
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="font-body text-sm font-semibold text-[var(--color-ink)] mb-1">
                      {t("profile.completionTitle")}
                    </p>
                    <p className="font-body text-xs text-[var(--color-muted)] mb-4">
                      {t("profile.completionIncentive")}
                    </p>
                    <CompletionRing percent={completion} />

                    <Link
                      to="/profile/edit"
                      className="block text-center h-11 leading-[2.75rem] rounded-xl bg-[var(--color-primary)] text-white font-display font-semibold text-sm mt-5 hover:bg-[var(--color-primary-dark)] transition-colors"
                    >
                      {t("profile.completeNow")}
                    </Link>
                  </>
                )}
              </motion.div>
            )}

            {isWorker && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-gradient-to-br from-[var(--color-primary)]/8 to-[var(--color-accent)]/8 border border-[var(--color-primary)]/15 rounded-3xl p-6"
              >
                <span className="inline-flex w-9 h-9 rounded-xl bg-white items-center justify-center mb-3 shadow-sm">
                  <Sparkles size={16} className="text-[var(--color-accent)]" />
                </span>
                <h2 className="font-display text-sm font-bold text-[var(--color-ink)] mb-1.5">
                  {t("profile.trustTitle")}
                </h2>
                <p className="font-body text-xs text-[var(--color-muted)] leading-relaxed">
                  {t("profile.trustBody")}
                </p>
              </motion.div>
            )}
          </div>

          <div className="space-y-6">
            {isWorker && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-white rounded-3xl border border-[var(--color-border)] p-6"
              >
                <h2 className="font-display font-bold text-lg text-[var(--color-ink)] mb-5">
                  {t("profile.workDetails")}
                </h2>

                {wp.bio && (
                  <p className="font-body text-sm text-[var(--color-ink)] mb-6 pb-6 border-b border-[var(--color-border)] leading-relaxed">
                    {wp.bio}
                  </p>
                )}

                <div className="mb-6">
                  <p className="font-body text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide mb-3">
                    {t("profile.skills")}
                  </p>
                  {wp.skills?.length > 0 || wp.othercategorytext ? (
                    <div className="flex flex-wrap gap-2">
                      {wp.skills?.map((skill) => {
                        const Icon = getCategoryIcon(skill.namekey);
                        return (
                          <span
                            key={skill._id}
                            className="inline-flex items-center gap-2 bg-[var(--color-bg)] rounded-xl pl-2 pr-3.5 py-2 text-sm font-body font-medium text-[var(--color-ink)]"
                          >
                            <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                              <Icon size={13} strokeWidth={1.75} className="text-[var(--color-primary)]" />
                            </span>
                            {t(`categories.${skill.namekey}`)}
                          </span>
                        );
                      })}
                      {wp.othercategorytext && (
                        <span className="inline-flex items-center gap-2 bg-[var(--color-bg)] rounded-xl px-3.5 py-2 text-sm font-body font-medium text-[var(--color-ink)]">
                          {wp.othercategorytext}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="font-body text-sm text-[var(--color-muted)]">
                      {t("profile.noCategorySet")}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-[var(--color-border)]">
                  <StatItem
                    icon={TrendingUp}
                    label={t("profile.experience")}
                    value={
                      wp.experienceyears !== undefined && wp.experienceyears !== null
                        ? t("profile.yearsValue", { years: wp.experienceyears })
                        : "—"
                    }
                  />
                  <StatItem
                    icon={Clock}
                    label={t("profile.availability")}
                    value={wp.availability ? t(`profile.availability.${wp.availability}`) : "—"}
                  />
                  <StatItem
                    icon={Wallet}
                    label={t("profile.expectedPay")}
                    value={
                      wp.expectedpay?.amount
                        ? `₹${wp.expectedpay.amount} / ${t(`profile.paytype.${wp.expectedpay.type}`)}`
                        : "—"
                    }
                  />
                </div>

                {wp.education && (
                  <div className="flex items-center gap-3 mt-6 pt-6 border-t border-[var(--color-border)]">
                    <span className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/8 flex items-center justify-center">
                      <GraduationCap size={18} className="text-[var(--color-primary)]" strokeWidth={1.75} />
                    </span>
                    <p className="font-body text-sm font-semibold text-[var(--color-ink)]">
                      {t(`profile.education.${wp.education}`)}
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {profile.role === "hirer" && profile.hirerprofile && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-[var(--color-border)] p-6"
              >
                <h2 className="font-display font-bold text-lg text-[var(--color-ink)] mb-4">
                  {t("profile.businessDetails")}
                </h2>
                {profile.hirerprofile.businessname ? (
                  <p className="font-body text-sm text-[var(--color-ink)]">
                    {profile.hirerprofile.businessname}
                  </p>
                ) : (
                  <p className="font-body text-sm text-[var(--color-muted)]">
                    {t("profile.noBusinessSet")}
                  </p>
                )}
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl border border-[var(--color-border)] p-6"
            >
              <h2 className="font-display font-bold text-lg text-[var(--color-ink)] mb-2">
                {t("profile.location")}
              </h2>
              {profile.location ? (
                  <p className="font-body text-sm text-green-700 font-medium">
                    {placeName || t("profile.locationSet")}
                  </p>
                ) : (
                <p className="font-body text-sm text-[var(--color-muted)]">
                  {t("profile.noLocationSet")}
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}