import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import api from "../services/api";
import Navbar from "../components/Navbar";
import { getCategoryIcon } from "../utils/categoryicons";
import { Star, Calendar, MapPin, TrendingUp, Clock, GraduationCap, MessageSquare } from "lucide-react";

export default function PublicProfile() {
  const { id } = useParams();
  const { t } = useTranslation();

  const [profile, setProfile] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.get(`/users/${id}`), api.get(`/ratings/user/${id}`)])
      .then(([userRes, ratingRes]) => {
        setProfile(userRes.data.user);
        setRatings(ratingRes.data.ratings || []);
      })
      .catch(() => setError(t("publicProfile.notFound")))
      .finally(() => setLoading(false));
  }, [id, t]);

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

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-10 text-center">
          <p className="font-body text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  const initial = profile.name?.trim()?.[0]?.toUpperCase() || "?";
  const isWorker = profile.role === "worker";
  const wp = profile.workerprofile || {};
  const memberSince = new Date(profile.createdAt).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const relevantAvg = isWorker ? profile.ratingsummary?.avgasworker : profile.ratingsummary?.avgashirer;
  const relevantCount = isWorker ? profile.ratingsummary?.countasworker : profile.ratingsummary?.countashirer;

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
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

            <h1 className="font-display text-xl font-bold text-[var(--color-ink)] mt-3">
              {profile.name}
            </h1>
            <span className="inline-block mt-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2.5 py-1 rounded-full capitalize">
              {profile.role}
            </span>

            <div className="mt-5 space-y-3 pt-5 border-t border-[var(--color-border)]">
              <div className="flex items-center gap-2.5">
                <Star
                  size={16}
                  className={relevantCount > 0 ? "text-amber-500 fill-amber-500 shrink-0" : "text-[var(--color-muted)] shrink-0"}
                />
                <span className="font-body text-sm text-[var(--color-ink)]">
                  {relevantCount > 0
                    ? t("profile.ratingValue", { rating: relevantAvg.toFixed(1), count: relevantCount })
                    : t("profile.noRatingsYet")}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <Calendar size={16} className="text-[var(--color-muted)] shrink-0" />
                <span className="font-body text-sm text-[var(--color-ink)]">
                  {t("profile.memberSince", { date: memberSince })}
                </span>
              </div>

              {profile.addresstext && (
                <div className="flex items-center gap-2.5">
                  <MapPin size={16} className="text-[var(--color-muted)] shrink-0" />
                  <span className="font-body text-sm text-[var(--color-ink)]">{profile.addresstext}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {isWorker && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-3xl border border-[var(--color-border)] p-6"
          >
            {wp.bio && (
              <p className="font-body text-sm text-[var(--color-ink)] mb-5 pb-5 border-b border-[var(--color-border)] leading-relaxed">
                {wp.bio}
              </p>
            )}

            {(wp.skills?.length > 0 || wp.othercategorytext) && (
              <div className="flex flex-wrap gap-2 mb-5">
                {wp.skills?.map((s) => {
                  const Icon = getCategoryIcon(s.namekey);
                  return (
                    <span
                      key={s._id}
                      className="inline-flex items-center gap-1.5 bg-[var(--color-bg)] rounded-xl px-3 py-1.5 text-sm font-body font-medium text-[var(--color-ink)]"
                    >
                      <Icon size={14} strokeWidth={1.75} className="text-[var(--color-primary)]" />
                      {t(`categories.${s.namekey}`)}
                    </span>
                  );
                })}
                {wp.othercategorytext && (
                  <span className="inline-flex items-center bg-[var(--color-bg)] rounded-xl px-3 py-1.5 text-sm font-body font-medium text-[var(--color-ink)]">
                    {wp.othercategorytext}
                  </span>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-[var(--color-primary)]" />
                <span className="font-body text-sm text-[var(--color-ink)]">
                  {wp.experienceyears !== undefined
                    ? t("profile.yearsValue", { years: wp.experienceyears })
                    : "—"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-[var(--color-primary)]" />
                <span className="font-body text-sm text-[var(--color-ink)]">
                  {wp.availability ? t(`profile.availability.${wp.availability}`) : "—"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap size={16} className="text-[var(--color-primary)]" />
                <span className="font-body text-sm text-[var(--color-ink)]">
                  {wp.education ? t(`profile.education.${wp.education}`) : "—"}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {!isWorker && profile.hirerprofile?.businessname && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-3xl border border-[var(--color-border)] p-6"
          >
            <p className="font-body text-xs text-[var(--color-muted)] mb-1">{t("publicProfile.business")}</p>
            <p className="font-body text-sm font-semibold text-[var(--color-ink)]">
              {profile.hirerprofile.businessname}
            </p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl border border-[var(--color-border)] p-6"
        >
          <h2 className="font-display font-bold text-lg text-[var(--color-ink)] mb-5 flex items-center gap-2">
            <MessageSquare size={18} className="text-[var(--color-primary)]" />
            {t("publicProfile.reviews", { count: ratings.length })}
          </h2>

          {ratings.length === 0 ? (
            <p className="font-body text-sm text-[var(--color-muted)] text-center py-6">
              {t("publicProfile.noReviews")}
            </p>
          ) : (
            <div className="space-y-4">
              {ratings.map((r) => (
                <div key={r._id} className="pb-4 border-b border-[var(--color-border)] last:border-0 last:pb-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    {r.rater?.photo?.url ? (
                      <img src={r.rater.photo.url} alt={r.rater.name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <span className="w-8 h-8 rounded-full bg-[var(--color-bg)] text-[var(--color-ink)] font-display font-bold text-xs flex items-center justify-center">
                        {r.rater?.name?.[0]?.toUpperCase()}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm font-semibold text-[var(--color-ink)] truncate">
                        {r.rater?.name}
                      </p>
                      {r.job?.title && (
                        <p className="font-body text-xs text-[var(--color-muted)] truncate">{r.job.title}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          size={12}
                          className={n <= r.stars ? "text-amber-500 fill-amber-500" : "text-[var(--color-border)]"}
                        />
                      ))}
                    </div>
                  </div>
                  {r.comment && (
                    <p className="font-body text-sm text-[var(--color-ink)] mt-1.5">{r.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}