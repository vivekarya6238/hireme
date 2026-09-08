import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { getCategoryIcon } from "../utils/categoryicons";
import { Plus, Briefcase, Users, Calendar } from "lucide-react";

const STATUS_DOT = {
  open: "bg-green-500",
  filled: "bg-blue-500",
  closed: "bg-gray-400",
  expired: "bg-red-500",
};

const STATUS_TEXT = {
  open: "text-green-700 bg-green-50",
  filled: "text-blue-700 bg-blue-50",
  closed: "text-gray-600 bg-gray-100",
  expired: "text-red-600 bg-red-50",
};

export default function HirerDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("active"); // active | history

  useEffect(() => {
    api
      .get("/jobs/mine")
      .then((res) => setJobs(res.data.jobs || []))
      .finally(() => setLoading(false));
  }, []);

  const activeJobs = jobs.filter((j) => j.status === "open");
  const historyJobs = jobs.filter((j) => j.status !== "open");
  const visibleJobs = tab === "active" ? activeJobs : historyJobs;

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between flex-wrap gap-4 mb-8"
        >
          <div>
            <h1 className="font-display text-2xl font-bold text-[var(--color-ink)] mb-1">
              {t("dashboard.hirerGreeting", { name: user?.name?.split(" ")[0] })}
            </h1>
            <p className="font-body text-sm text-[var(--color-muted)]">
              {t("dashboard.hirerSubtitle")}
            </p>
          </div>
          <Link
            to="/jobs/new"
            className="flex items-center gap-1.5 h-11 px-5 rounded-xl bg-[var(--color-primary)] text-white font-display font-semibold text-sm hover:bg-[var(--color-primary-dark)] hover:shadow-md transition-all shrink-0"
          >
            <Plus size={16} />
            {t("dashboard.postJob")}
          </Link>
        </motion.div>

        {!loading && jobs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="flex bg-white border border-[var(--color-border)] rounded-xl p-1 mb-6 w-fit"
          >
            <button
              onClick={() => setTab("active")}
              className={`h-9 px-4 rounded-lg font-body text-sm font-semibold transition-colors ${
                tab === "active"
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--color-muted)]"
              }`}
            >
              {t("dashboard.tabActive", { count: activeJobs.length })}
            </button>
            <button
              onClick={() => setTab("history")}
              className={`h-9 px-4 rounded-lg font-body text-sm font-semibold transition-colors ${
                tab === "history"
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--color-muted)]"
              }`}
            >
              {t("dashboard.tabHistory", { count: historyJobs.length })}
            </button>
          </motion.div>
        )}

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)] animate-spin" />
          </div>
        )}

        {!loading && jobs.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-[var(--color-border)] py-16 text-center"
          >
            <span className="inline-flex w-14 h-14 rounded-full bg-[var(--color-bg)] items-center justify-center mb-4">
              <Briefcase size={22} className="text-[var(--color-muted)]" />
            </span>
            <p className="font-body text-sm text-[var(--color-muted)] mb-5">
              {t("dashboard.noJobsPosted")}
            </p>
            <Link
              to="/jobs/new"
              className="inline-block h-11 px-6 leading-[2.75rem] rounded-xl bg-[var(--color-primary)] text-white font-display font-semibold text-sm hover:bg-[var(--color-primary-dark)] transition-colors"
            >
              {t("dashboard.postFirstJob")}
            </Link>
          </motion.div>
        )}

        {!loading && jobs.length > 0 && visibleJobs.length === 0 && (
          <p className="font-body text-sm text-[var(--color-muted)] text-center py-10">
            {tab === "active" ? t("dashboard.noActiveJobs") : t("dashboard.noHistoryJobs")}
          </p>
        )}

        {!loading && visibleJobs.length > 0 && (
          <div className="space-y-3">
            {visibleJobs.map((job, i) => {
              const Icon = getCategoryIcon(job.category?.namekey);
              const postedDate = new Date(job.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
              });
              return (
                <motion.div
                  key={job._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  whileHover={{ y: -2 }}
                >
                  <Link
                    to={`/jobs/${job._id}`}
                    className="group flex items-center gap-4 bg-white rounded-2xl border border-[var(--color-border)] p-5 hover:border-[var(--color-primary)]/30 hover:shadow-md transition-all"
                  >
                    <span className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/8 flex items-center justify-center shrink-0 group-hover:bg-[var(--color-primary)]/15 transition-colors">
                      <Icon size={20} className="text-[var(--color-primary)]" strokeWidth={1.75} />
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-display font-bold text-[15px] text-[var(--color-ink)] truncate">
                          {job.title}
                        </p>
                        <span className={`flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize shrink-0 ${STATUS_TEXT[job.status]}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[job.status]}`} />
                          {job.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-body text-[var(--color-muted)]">
                        <span className="font-mono font-semibold text-[var(--color-ink)]">
                          ₹{job.pay.amount}/{t(`profile.paytype.${job.pay.type}`)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={12} />
                          {job.openings} {t("dashboard.openings")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {postedDate}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}