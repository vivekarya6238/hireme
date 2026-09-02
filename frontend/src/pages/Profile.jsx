import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import Navbar from "../components/Navbar";
import { getCategoryIcon } from "../utils/categoryicons";

export default function Profile() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => setProfile(res.data.user))
      .catch(() => setError(t("auth.genericError")))
      .finally(() => setLoading(false));
  }, [t]);

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

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6 mb-6 flex items-center gap-4">
          {profile.photo?.url ? (
            <img
              src={profile.photo.url}
              alt={profile.name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <span className="w-16 h-16 rounded-full bg-[var(--color-primary)] text-white font-display font-bold text-2xl flex items-center justify-center">
              {initial}
            </span>
          )}
          <div>
            <h1 className="font-display text-xl font-bold text-[var(--color-ink)]">
              {profile.name}
            </h1>
            <p className="font-mono text-xs text-[var(--color-muted)] mt-0.5 capitalize">
              {profile.role}
            </p>
          </div>
        </div>

        {profile.role === "worker" && profile.workerprofile && (
          <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6 mb-6">
            <h2 className="font-display font-semibold text-[var(--color-ink)] mb-4">
              {t("profile.workDetails")}
            </h2>

            {profile.workerprofile.skills?.length > 0 && (
              <div className="mb-4">
                <p className="font-body text-xs text-[var(--color-muted)] mb-2">
                  {t("profile.skills")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {profile.workerprofile.skills.map((skill) => {
                    const Icon = getCategoryIcon(skill.namekey);
                    return (
                      <span
                        key={skill._id}
                        className="inline-flex items-center gap-1.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-full px-3 py-1.5 text-sm font-body text-[var(--color-ink)]"
                      >
                        <Icon size={14} strokeWidth={1.75} />
                        {t(`categories.${skill.namekey}`)}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {profile.workerprofile.othercategorytext && (
              <p className="font-body text-sm text-[var(--color-ink)] mb-2">
                {t("profile.otherWork")}: {profile.workerprofile.othercategorytext}
              </p>
            )}

            {!profile.workerprofile.skills?.length &&
              !profile.workerprofile.othercategorytext && (
                <p className="font-body text-sm text-[var(--color-muted)]">
                  {t("profile.noCategorySet")}
                </p>
              )}
          </div>
        )}

        {profile.role === "hirer" && profile.hirerprofile && (
          <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6 mb-6">
            <h2 className="font-display font-semibold text-[var(--color-ink)] mb-4">
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
          </div>
        )}

        <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6">
          <h2 className="font-display font-semibold text-[var(--color-ink)] mb-4">
            {t("profile.location")}
          </h2>
          {profile.location ? (
            <p className="font-body text-sm text-green-700">{t("profile.locationSet")}</p>
          ) : (
            <p className="font-body text-sm text-[var(--color-muted)]">
              {t("profile.noLocationSet")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}