import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import JobCard from "../components/JobCard";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { getCategoryIcon } from "../utils/categoryicons";
import { MapPin, Briefcase, Search, X } from "lucide-react";

export default function WorkerDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [needsLocation, setNeedsLocation] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    api.get("/categories").then((res) => setCategories(res.data.categories || []));

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

  const activeCategoryIds = useMemo(() => {
    const set = new Set();
    jobs.forEach((j) => j.category?._id && set.add(j.category._id));
    return set;
  }, [jobs]);

  const usableCategories = categories.filter((c) => activeCategoryIds.has(c._id));

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesCategory = !activeCategory || job.category?._id === activeCategory;
      const matchesSearch =
        !searchText.trim() || job.title.toLowerCase().includes(searchText.trim().toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [jobs, activeCategory, searchText]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between flex-wrap gap-4 mb-6"
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
                {t("dashboard.jobsFoundCount", { count: filteredJobs.length })}
              </span>
            </span>
          )}
        </motion.div>

        {!loading && !needsLocation && jobs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-8"
          >
            {/* centered search - live-filters the grid below, no overlay */}
            <div className="flex justify-center mb-4">
              <div className="relative w-full max-w-xl">
                <div
                  className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] transition-opacity duration-300 ${
                    searchFocused ? "opacity-100" : "opacity-0"
                  }`}
                />
                <div className="relative">
                  <Search
                    size={18}
                    className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${
                      searchFocused ? "text-[var(--color-primary)]" : "text-[var(--color-muted)]"
                    }`}
                  />
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    placeholder={t("dashboard.searchPlaceholder")}
                    className="w-full h-14 pl-12 pr-11 rounded-2xl border-2 border-[var(--color-border)] bg-white font-body text-[15px] text-[var(--color-ink)] outline-none transition-colors"
                  />
                  {searchText && (
                    <button
                      onClick={() => setSearchText("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[var(--color-bg)] flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* category chips */}
            {usableCategories.length > 0 && (
              <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`shrink-0 h-9 px-4 rounded-full font-body text-sm font-semibold whitespace-nowrap transition-colors ${
                    activeCategory === null
                      ? "bg-[var(--color-primary)] text-white shadow-sm"
                      : "bg-white border border-[var(--color-border)] text-[var(--color-ink)]"
                  }`}
                >
                  {t("dashboard.allCategories")}
                </button>
                {usableCategories.map((cat) => {
                  const Icon = getCategoryIcon(cat.namekey);
                  const isActive = activeCategory === cat._id;
                  return (
                    <button
                      key={cat._id}
                      onClick={() => setActiveCategory(isActive ? null : cat._id)}
                      className={`shrink-0 flex items-center gap-1.5 h-9 px-4 rounded-full font-body text-sm font-semibold whitespace-nowrap transition-colors ${
                        isActive
                          ? "bg-[var(--color-primary)] text-white shadow-sm"
                          : "bg-white border border-[var(--color-border)] text-[var(--color-ink)]"
                      }`}
                    >
                      <Icon size={14} strokeWidth={1.75} />
                      {t(`categories.${cat.namekey}`)}
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

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

        {!loading && jobs.length > 0 && filteredJobs.length === 0 && (
          <div className="bg-white rounded-2xl border border-[var(--color-border)] py-16 text-center">
            <span className="inline-flex w-14 h-14 rounded-full bg-[var(--color-bg)] items-center justify-center mb-4">
              <Search size={22} className="text-[var(--color-muted)]" />
            </span>
            <p className="font-body text-sm text-[var(--color-muted)]">
              {t("dashboard.noSearchResults")}
            </p>
          </div>
        )}

        {!loading && filteredJobs.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            <AnimatePresence>
              {filteredJobs.map((job) => (
                <motion.div
                  key={job._id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                >
                  <JobCard job={job} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}