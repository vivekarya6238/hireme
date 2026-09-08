import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import JobCard from "../components/JobCard";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { MapPin, Briefcase } from "lucide-react";

export default function WorkerDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [needsLocation, setNeedsLocation] = useState(false);

  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => {
        const loc = res.data.user.location;
        if (!loc?.coordinates) {
          setNeedsLocation(true);
          setLoading(false);
          return;
        }
        const [lng, lat] = loc.coordinates;
        return api.get("/jobs", { params: { lat, lng } }).then((jobsRes) => {
          setJobs(jobsRes.data.jobs || []);
        });
      })
      .catch(() => setError(t("auth.genericError")))
      .finally(() => setLoading(false));
  }, [t]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between flex-wrap gap-4 mb-8"
        >
          <div>
            <h1 className="font-display text-2xl font-bold text-[var(--color-ink)] mb-1">
              {t("dashboard.workerGreeting", { name: user?.name?.split(" ")[0] })}
            </h1>
            <p className="font-body text-sm text-[var(--color-muted)]">
              {t("dashboard.workerSubtitle")}
            </p>
          </div>

          {!loading && !needsLocation && (
            <span className="inline-flex items-center gap-2 bg-white border border-[var(--color-border)] rounded-full px-4 py-2">
              <Briefcase size={15} className="text-[var(--color-primary)]" />
              <span className="font-body text-sm font-semibold text-[var(--color-ink)]">
                {t("dashboard.jobsFoundCount", { count: jobs.length })}
              </span>
            </span>
          )}
        </motion.div>

        {needsLocation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6 flex items-start gap-3"
          >
            <MapPin size={20} className="text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-body text-sm font-semibold text-amber-800 mb-1">
                {t("dashboard.needLocationTitle")}
              </p>
              <p className="font-body text-sm text-amber-700">
                {t("dashboard.needLocationBody")}
              </p>
            </div>
          </motion.div>
        )}

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)] animate-spin" />
          </div>
        )}

        {!loading && error && <p className="text-sm text-red-600 font-body">{error}</p>}

        {!loading && !needsLocation && !error && jobs.length === 0 && (
          <div className="bg-white rounded-2xl border border-[var(--color-border)] py-16 text-center">
            <span className="inline-flex w-14 h-14 rounded-full bg-[var(--color-bg)] items-center justify-center mb-4">
              <Briefcase size={22} className="text-[var(--color-muted)]" />
            </span>
            <p className="font-body text-sm text-[var(--color-muted)]">
              {t("dashboard.noJobsNearby")}
            </p>
          </div>
        )}

        {!loading && jobs.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {jobs.map((job) => (
              <JobCard key={job._id} job={job} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}