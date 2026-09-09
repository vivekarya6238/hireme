import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import api from "../services/api";
import Navbar from "../components/Navbar";
import { getCategoryIcon } from "../utils/categoryicons";
import { FileText, Star } from "lucide-react";

const APP_STATUS_TEXT = {
  applied: "text-blue-700 bg-blue-50",
  waitlist: "text-amber-700 bg-amber-50",
  selected: "text-green-700 bg-green-50",
  rejected: "text-red-600 bg-red-50",
  withdrawn: "text-gray-600 bg-gray-100",
};

export default function MyApplications() {
  const { t } = useTranslation();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [withdrawing, setWithdrawing] = useState(null);

  useEffect(() => {
    api
      .get("/applications/mine")
      .then((res) => setApplications(res.data.applications || []))
      .catch(() => setError(t("auth.genericError")))
      .finally(() => setLoading(false));
  }, [t]);

  const handleWithdraw = async (appId) => {
    setWithdrawing(appId);
    try {
      await api.patch(`/applications/${appId}/withdraw`);
      setApplications((prev) =>
        prev.map((a) => (a._id === appId ? { ...a, status: "withdrawn" } : a))
      );
    } catch {
      // silent fail - status just won't update, user can retry
    } finally {
      setWithdrawing(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="font-display text-2xl font-bold text-[var(--color-ink)] mb-1">
          {t("myApplications.title")}
        </h1>
        <p className="font-body text-sm text-[var(--color-muted)] mb-8">
          {t("myApplications.subtitle")}
        </p>

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)] animate-spin" />
          </div>
        )}

        {!loading && error && <p className="text-sm text-red-600 font-body">{error}</p>}

        {!loading && !error && applications.length === 0 && (
          <div className="bg-white rounded-3xl border border-[var(--color-border)] py-16 text-center">
            <span className="inline-flex w-14 h-14 rounded-full bg-[var(--color-bg)] items-center justify-center mb-4">
              <FileText size={22} className="text-[var(--color-muted)]" />
            </span>
            <p className="font-body text-sm text-[var(--color-muted)] mb-5">
              {t("myApplications.empty")}
            </p>
            <Link
              to="/"
              className="inline-block h-11 px-6 leading-[2.75rem] rounded-xl bg-[var(--color-primary)] text-white font-display font-semibold text-sm hover:bg-[var(--color-primary-dark)] transition-colors"
            >
              {t("myApplications.browseJobs")}
            </Link>
          </div>
        )}

        {!loading && applications.length > 0 && (
          <div className="space-y-3">
            {applications.map((app, i) => {
              const job = app.job;
              if (!job) return null;
              const Icon = getCategoryIcon(job.category?.namekey);
              const canWithdraw = ["applied", "waitlist", "selected"].includes(app.status);

              return (
                <motion.div
                  key={app._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i }}
                  className="bg-white rounded-2xl border border-[var(--color-border)] p-5"
                >
                  <div className="flex items-start gap-4">
                    <span className="w-11 h-11 rounded-xl bg-[var(--color-primary)]/8 flex items-center justify-center shrink-0">
                      <Icon size={18} className="text-[var(--color-primary)]" strokeWidth={1.75} />
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Link
                          to={`/jobs/${job._id}`}
                          className="font-display font-bold text-[15px] text-[var(--color-ink)] hover:text-[var(--color-primary)] transition-colors"
                        >
                          {job.title}
                        </Link>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${APP_STATUS_TEXT[app.status]}`}>
                          {t(`jobDetail.status.${app.status}`)}
                        </span>
                      </div>

                      {job.hirer && (
                        <div className="flex items-center gap-2 text-xs text-[var(--color-muted)] mb-2">
                          <Link to={`/users/${job.hirer._id}`} className="hover:text-[var(--color-primary)] hover:underline">
                            {job.hirer.name}
                          </Link>
                          {job.hirer.ratingsummary?.countashirer > 0 && (
                            <span className="flex items-center gap-1">
                              <Star size={11} className="text-amber-500 fill-amber-500" />
                              {job.hirer.ratingsummary.avgashirer.toFixed(1)}
                            </span>
                          )}
                        </div>
                      )}

                      <p className="font-mono text-sm font-semibold text-[var(--color-ink)]">
                        ₹{job.pay.amount}/{t(`profile.paytype.${job.pay.type}`)}
                      </p>
                    </div>

                    {canWithdraw && (
                      <button
                        onClick={() => handleWithdraw(app._id)}
                        disabled={withdrawing === app._id}
                        className="h-9 px-3.5 rounded-lg border border-[var(--color-border)] font-body text-xs font-semibold text-[var(--color-ink)] disabled:opacity-60 shrink-0"
                      >
                        {t("jobDetail.withdraw")}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}