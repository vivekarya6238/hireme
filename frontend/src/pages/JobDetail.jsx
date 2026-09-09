import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import api from "../services/api";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { getCategoryIcon } from "../utils/categoryicons";
import { MapPin, Star, Users, Calendar, CheckCircle2, XCircle, ChevronDown, Briefcase, GraduationCap, Clock, ShieldCheck, Copy } from "lucide-react";

const STATUS_TEXT = {
  open: "text-green-700 bg-green-50",
  filled: "text-blue-700 bg-blue-50",
  closed: "text-gray-600 bg-gray-100",
  expired: "text-red-600 bg-red-50",
};

const APP_STATUS_TEXT = {
  applied: "text-blue-700 bg-blue-50",
  waitlist: "text-amber-700 bg-amber-50",
  selected: "text-green-700 bg-green-50",
  rejected: "text-red-600 bg-red-50",
  withdrawn: "text-gray-600 bg-gray-100",
};

function StarPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} className="p-0.5">
          <Star size={22} className={n <= value ? "text-amber-500 fill-amber-500" : "text-[var(--color-border)]"} />
        </button>
      ))}
    </div>
  );
}

function RatingBox({ onSubmit, label, alreadyRated }) {
  const { t } = useTranslation();
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (stars < 1) {
      setError(t("jobDetail.ratingRequired"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit({ stars, comment: comment.trim() });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || t("auth.genericError"));
    } finally {
      setSaving(false);
    }
  };

  if (alreadyRated || done) {
    return (
      <p className="font-body text-sm text-green-700 font-medium flex items-center gap-1.5 mt-3">
        <CheckCircle2 size={15} /> {t("jobDetail.ratingSubmitted")}
      </p>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[var(--color-border)] p-4 mt-3">
      <p className="font-body text-xs font-semibold text-[var(--color-ink)] mb-2">{label}</p>
      <StarPicker value={stars} onChange={setStars} />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        placeholder={t("jobDetail.ratingCommentPlaceholder")}
        className="w-full mt-3 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] font-body text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)] transition-colors resize-none"
      />
      {error && <p className="text-xs text-red-600 font-body mt-2">{error}</p>}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={saving}
        className="mt-3 h-9 px-4 rounded-lg bg-[var(--color-primary)] text-white font-body text-sm font-semibold disabled:opacity-60"
      >
        {saving ? t("jobDetail.ratingSaving") : t("jobDetail.ratingSubmit")}
      </button>
    </div>
  );
}

export default function JobDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [myApplication, setMyApplication] = useState(null);
  const [applying, setApplying] = useState(false);
  const [hirerAlreadyRated, setHirerAlreadyRated] = useState(false);

  const [applicants, setApplicants] = useState([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [ratedWorkerMap, setRatedWorkerMap] = useState({});

  const isOwner = job && user && String(job.hirer?._id) === String(user.id);
  const isWorker = user?.role === "worker";

  useEffect(() => {
    api
      .get(`/jobs/${id}`)
      .then((res) => setJob(res.data.job))
      .catch(() => setError(t("auth.genericError")))
      .finally(() => setLoading(false));
  }, [id, t]);

  useEffect(() => {
    if (job && isWorker && !isOwner) {
      api.get("/applications/mine").then((res) => {
        const mine = res.data.applications.find((a) => a.job?._id === job._id || a.job === job._id);
        setMyApplication(mine || null);
      });
    }
  }, [job, isWorker, isOwner]);

  // check if this worker already rated the hirer for this job
  useEffect(() => {
    if (job && myApplication?.status === "selected" && job.status === "filled" && job.hirer) {
      api.get(`/ratings/user/${job.hirer._id}`).then((res) => {
        const already = res.data.ratings.some(
          (r) => String(r.rater?._id) === String(user.id) && String(r.job?._id) === String(job._id)
        );
        setHirerAlreadyRated(already);
      });
    }
  }, [job, myApplication, user]);

  useEffect(() => {
    if (job && isOwner) {
      setApplicantsLoading(true);
      api
        .get(`/jobs/${job._id}/applicants`)
        .then((res) => setApplicants(res.data.applicants || []))
        .finally(() => setApplicantsLoading(false));
    }
  }, [job, isOwner]);

  // check if hirer already rated a given selected worker for this job - lazy, on expand
  useEffect(() => {
    if (!expandedId || !job || job.status !== "filled") return;
    const app = applicants.find((a) => a._id === expandedId);
    if (!app || app.status !== "selected" || ratedWorkerMap[app.worker?._id] !== undefined) return;

    api.get(`/ratings/user/${app.worker._id}`).then((res) => {
      const already = res.data.ratings.some(
        (r) => String(r.rater?._id) === String(user.id) && String(r.job?._id) === String(job._id)
      );
      setRatedWorkerMap((prev) => ({ ...prev, [app.worker._id]: already }));
    });
  }, [expandedId, job, applicants, user, ratedWorkerMap]);

  const handleApply = async () => {
    setApplying(true);
    setActionError("");
    try {
      const res = await api.post("/applications", { jobid: job._id });
      setMyApplication(res.data.application);
    } catch (err) {
      setActionError(err.response?.data?.message || t("auth.genericError"));
    } finally {
      setApplying(false);
    }
  };

  const handleWithdraw = async () => {
    setApplying(true);
    setActionError("");
    try {
      await api.patch(`/applications/${myApplication._id}/withdraw`);
      setMyApplication({ ...myApplication, status: "withdrawn" });
    } catch (err) {
      setActionError(err.response?.data?.message || t("auth.genericError"));
    } finally {
      setApplying(false);
    }
  };

  const refreshApplicants = () => {
    api.get(`/jobs/${job._id}/applicants`).then((res) => setApplicants(res.data.applicants || []));
    api.get(`/jobs/${job._id}`).then((res) => setJob(res.data.job));
  };

  const handleSelect = async (appId) => {
    setBusyId(appId);
    setActionError("");
    try {
      await api.patch(`/applications/${appId}/select`);
      refreshApplicants();
    } catch (err) {
      setActionError(err.response?.data?.message || t("auth.genericError"));
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (appId) => {
    setBusyId(appId);
    setActionError("");
    try {
      await api.patch(`/applications/${appId}/reject`);
      refreshApplicants();
    } catch (err) {
      setActionError(err.response?.data?.message || t("auth.genericError"));
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmHires = async () => {
    setBusyId("confirm");
    setActionError("");
    try {
      await api.patch(`/jobs/${job._id}/confirmhires`);
      refreshApplicants();
    } catch (err) {
      setActionError(err.response?.data?.message || t("auth.genericError"));
    } finally {
      setBusyId(null);
    }
  };

  const handleClose = async () => {
    setShowCloseConfirm(false);
    setBusyId("close");
    setActionError("");
    try {
      await api.patch(`/jobs/${job._id}/close`);
      const res = await api.get(`/jobs/${job._id}`);
      setJob(res.data.job);
    } catch (err) {
      setActionError(err.response?.data?.message || t("auth.genericError"));
    } finally {
      setBusyId(null);
    }
  };

  const handleReopen = async () => {
    setBusyId("reopen");
    setActionError("");
    try {
      const res = await api.patch(`/jobs/${job._id}/reopen`);
      setJob({ ...job, status: res.data.job.status });
    } catch (err) {
      setActionError(err.response?.data?.message || t("auth.genericError"));
    } finally {
      setBusyId(null);
    }
  };

  const rateWorker = (workerId) => async ({ stars, comment }) => {
    await api.post("/ratings", { jobid: job._id, workerid: workerId, stars, comment });
    setRatedWorkerMap((prev) => ({ ...prev, [workerId]: true }));
  };

  const rateHirer = async ({ stars, comment }) => {
    await api.post("/ratings", { jobid: job._id, stars, comment });
    setHirerAlreadyRated(true);
  };

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

  if (error || !job) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-10 text-center">
          <p className="font-body text-sm text-red-600">{error || t("jobDetail.notFound")}</p>
        </div>
      </div>
    );
  }

  const Icon = getCategoryIcon(job.category?.namekey);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-[var(--color-border)] p-6 relative overflow-hidden"
        >
          <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-[var(--color-primary)]/5" />
          <div className="absolute -bottom-6 -right-2 w-16 h-16 rounded-full bg-[var(--color-accent)]/8" />

          <div className="relative flex items-start justify-between mb-4">
            <span className="inline-flex w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary)]/80 items-center justify-center shadow-sm">
              <Icon size={20} className="text-white" strokeWidth={1.75} />
            </span>
            <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_TEXT[job.status]}`}>
              {job.status}
            </span>
          </div>

          <h1 className="relative font-display text-xl font-bold text-[var(--color-ink)] mb-1.5">
            {job.title}
          </h1>

          <div className="relative flex flex-wrap items-center gap-1.5 mb-5">
            <span className="text-[11px] font-body font-medium text-[var(--color-primary)] bg-[var(--color-primary)]/8 px-2 py-1 rounded-lg">
              {t(`categories.${job.category?.namekey}`)}
            </span>
            {job.othercategorytext && (
              <span className="text-[11px] font-body text-[var(--color-muted)]">({job.othercategorytext})</span>
            )}
            {job.workplacetype && (
              <span className="text-[11px] font-body text-[var(--color-muted)]">
                {t(`workplacetypes.${job.workplacetype.namekey}`)}
              </span>
            )}
          </div>

          {job.description && (
            <p className="relative font-body text-sm text-[var(--color-ink)] mb-5 pb-5 border-b border-[var(--color-border)] leading-relaxed">
              {job.description}
            </p>
          )}

          <div className="relative grid grid-cols-2 gap-4">
            <div>
              <p className="font-body text-[10px] uppercase tracking-wide text-[var(--color-muted)] mb-0.5">
                {t("dashboard.payLabel")}
              </p>
              <p className="font-mono font-bold text-lg text-[var(--color-ink)]">
                ₹{job.pay.amount}
                <span className="font-body font-normal text-xs text-[var(--color-muted)]">
                  /{t(`profile.paytype.${job.pay.type}`)}
                </span>
              </p>
            </div>
            <div>
              <p className="font-body text-[10px] uppercase tracking-wide text-[var(--color-muted)] mb-0.5">
                {t("jobDetail.openings")}
              </p>
              <p className="font-body font-semibold text-sm text-[var(--color-ink)]">
                {job.selectedcount || 0}/{job.openings} {t("jobDetail.filled")}
              </p>
            </div>
          </div>

          {isOwner && ["filled", "closed", "expired"].includes(job.status) && (
            <Link
              to="/jobs/new"
              state={{ duplicateFrom: job }}
              className="relative mt-5 flex items-center justify-center gap-2 h-11 rounded-xl border border-[var(--color-primary)] text-[var(--color-primary)] font-body text-sm font-semibold hover:bg-[var(--color-primary)]/5 transition-colors"
            >
              <Copy size={15} />
              {t("jobDetail.postSimilarJob")}
            </Link>
          )}
        </motion.div>

        {job.hirer && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-3xl border border-[var(--color-border)] p-6 flex items-center gap-4"
          >
            {job.hirer.photo?.url ? (
              <img src={job.hirer.photo.url} alt={job.hirer.name} className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <span className="w-12 h-12 rounded-full bg-[var(--color-primary)] text-white font-display font-bold flex items-center justify-center">
                {job.hirer.name?.[0]?.toUpperCase()}
              </span>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-body font-semibold text-sm text-[var(--color-ink)]">{job.hirer.name}</p>
              <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
                {job.hirer.ratingsummary?.countashirer > 0 ? (
                  <span className="flex items-center gap-1">
                    <Star size={12} className="text-amber-500 fill-amber-500" />
                    {job.hirer.ratingsummary.avgashirer.toFixed(1)} ({job.hirer.ratingsummary.countashirer})
                  </span>
                ) : (
                  <span>{t("profile.noRatingsYet")}</span>
                )}
                {job.addresstext && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} /> {job.addresstext}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {actionError && <p className="text-sm text-red-600 font-body">{actionError}</p>}

        {isWorker && !isOwner && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl border border-[var(--color-border)] p-6"
          >
            {myApplication && myApplication.status !== "withdrawn" ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-body text-xs text-[var(--color-muted)] mb-1">{t("jobDetail.yourStatus")}</p>
                    <span className={`inline-block text-sm font-semibold px-3 py-1 rounded-full capitalize ${APP_STATUS_TEXT[myApplication.status]}`}>
                      {t(`jobDetail.status.${myApplication.status}`)}
                    </span>
                  </div>
                  {["applied", "waitlist", "selected"].includes(myApplication.status) && (
                    <button
                      onClick={handleWithdraw}
                      disabled={applying}
                      className="h-10 px-4 rounded-xl border border-[var(--color-border)] font-body text-sm font-semibold text-[var(--color-ink)] disabled:opacity-60"
                    >
                      {t("jobDetail.withdraw")}
                    </button>
                  )}
                </div>

                {myApplication.status === "selected" && job.status === "filled" && (
                  <RatingBox onSubmit={rateHirer} label={t("jobDetail.rateHirer")} alreadyRated={hirerAlreadyRated} />
                )}
              </>
            ) : job.status === "open" ? (
              <button
                onClick={handleApply}
                disabled={applying}
                className="w-full h-12 rounded-xl bg-[var(--color-primary)] text-white font-display font-semibold disabled:opacity-60 hover:bg-[var(--color-primary-dark)] transition-colors"
              >
                {applying ? t("jobDetail.applying") : t("jobDetail.apply")}
              </button>
            ) : (
              <p className="font-body text-sm text-[var(--color-muted)] text-center">
                {t("jobDetail.notAcceptingApplications")}
              </p>
            )}
          </motion.div>
        )}

        {isOwner && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl border border-[var(--color-border)] p-6"
          >
            <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
              <h2 className="font-display font-bold text-lg text-[var(--color-ink)] flex items-center gap-2">
                <Users size={18} className="text-[var(--color-primary)]" />
                {t("jobDetail.applicants", { count: applicants.length })}
              </h2>
              <div className="flex items-center gap-2">
                {job.status === "open" && (
                  <>
                    <Link
                      to={`/jobs/${job._id}/edit`}
                      className="h-9 px-3.5 rounded-lg border border-[var(--color-border)] font-body text-xs font-semibold text-[var(--color-ink)] flex items-center"
                    >
                      {t("jobDetail.editJob")}
                    </Link>
                    {job.selectedcount > 0 && (
                      <button
                        onClick={handleConfirmHires}
                        disabled={busyId === "confirm"}
                        className="h-9 px-3.5 rounded-lg bg-[var(--color-primary)] text-white font-body text-xs font-semibold disabled:opacity-60"
                      >
                        {t("jobDetail.confirmHires")}
                      </button>
                    )}
                    <button
                      onClick={() => setShowCloseConfirm(true)}
                      disabled={busyId === "close"}
                      className="h-9 px-3.5 rounded-lg border border-[var(--color-border)] font-body text-xs font-semibold text-[var(--color-ink)] disabled:opacity-60"
                    >
                      {t("jobDetail.closeJob")}
                    </button>
                  </>
                )}
                {job.status === "closed" && (
                  <>
                    <Link
                      to={`/jobs/${job._id}/edit`}
                      className="h-9 px-3.5 rounded-lg border border-[var(--color-border)] font-body text-xs font-semibold text-[var(--color-ink)] flex items-center"
                    >
                      {t("jobDetail.editJob")}
                    </Link>
                    <button
                      onClick={handleReopen}
                      disabled={busyId === "reopen"}
                      className="h-9 px-3.5 rounded-lg bg-[var(--color-primary)] text-white font-body text-xs font-semibold disabled:opacity-60"
                    >
                      {t("jobDetail.reopenJob")}
                    </button>
                  </>
                )}
              </div>
            </div>

            {applicantsLoading && (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)] animate-spin" />
              </div>
            )}

            {!applicantsLoading && applicants.length === 0 && (
              <p className="font-body text-sm text-[var(--color-muted)] text-center py-6">
                {t("jobDetail.noApplicants")}
              </p>
            )}

            {!applicantsLoading && applicants.length > 0 && (
              <div className="space-y-3">
                {applicants.map((a) => {
                  const isExpanded = expandedId === a._id;
                  const wp = a.worker?.workerprofile || {};
                  const hasRating = a.worker?.ratingsummary?.countasworker > 0;

                  return (
                    <div key={a._id} className="rounded-xl border border-[var(--color-border)] overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : a._id)}
                        className="w-full flex items-center gap-3 p-3 text-left"
                      >
                        {a.worker?.photo?.url ? (
                          <img src={a.worker.photo.url} alt={a.worker.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                        ) : (
                          <span className="w-10 h-10 rounded-full bg-[var(--color-bg)] text-[var(--color-ink)] font-display font-bold text-sm flex items-center justify-center shrink-0">
                            {a.worker?.name?.[0]?.toUpperCase()}
                          </span>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-body font-semibold text-sm text-[var(--color-ink)] truncate">
                              {a.worker?.name}
                            </p>
                            {hasRating ? (
                              <span className="flex items-center gap-0.5 text-xs text-[var(--color-muted)] shrink-0">
                                <Star size={11} className="text-amber-500 fill-amber-500" />
                                {a.worker.ratingsummary.avgasworker.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-xs text-[var(--color-muted)] shrink-0">{t("profile.noRatingsYet")}</span>
                            )}
                          </div>
                          <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize mt-0.5 ${APP_STATUS_TEXT[a.status]}`}>
                            {t(`jobDetail.status.${a.status}`)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {a.status === "applied" && job.status === "open" && (
                            <>
                              <span
                                role="button"
                                onClick={(e) => { e.stopPropagation(); handleSelect(a._id); }}
                                className="w-8 h-8 rounded-lg bg-green-50 text-green-700 flex items-center justify-center"
                              >
                                <CheckCircle2 size={16} />
                              </span>
                              <span
                                role="button"
                                onClick={(e) => { e.stopPropagation(); handleReject(a._id); }}
                                className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center"
                              >
                                <XCircle size={16} />
                              </span>
                            </>
                          )}
                          <ChevronDown
                            size={16}
                            className={`text-[var(--color-muted)] transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          />
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-[var(--color-border)] bg-[var(--color-bg)]">
                          {wp.bio && (
                            <p className="font-body text-sm text-[var(--color-ink)] mt-3 mb-3 leading-relaxed">{wp.bio}</p>
                          )}

                          {(wp.skills?.length > 0 || wp.othercategorytext) && (
                            <div className="flex flex-wrap gap-1.5 mb-3 mt-3">
                              {wp.skills?.map((s) => {
                                const SkillIcon = getCategoryIcon(s.namekey);
                                return (
                                  <span
                                    key={s._id}
                                    className="inline-flex items-center gap-1 text-[11px] font-body font-medium text-[var(--color-primary)] bg-[var(--color-primary)]/8 px-2 py-1 rounded-lg"
                                  >
                                    <SkillIcon size={12} strokeWidth={1.75} />
                                    {t(`categories.${s.namekey}`)}
                                  </span>
                                );
                              })}
                              {wp.othercategorytext && (
                                <span className="inline-flex items-center text-[11px] font-body font-medium text-[var(--color-ink)] bg-[var(--color-border)]/40 px-2 py-1 rounded-lg">
                                  {wp.othercategorytext}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-3 mt-3">
                            <div className="flex items-center gap-2">
                              <Briefcase size={14} className="text-[var(--color-muted)]" />
                              <span className="font-body text-xs text-[var(--color-ink)]">
                                {wp.experienceyears !== undefined
                                  ? t("profile.yearsValue", { years: wp.experienceyears })
                                  : t("jobDetail.noInfo")}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock size={14} className="text-[var(--color-muted)]" />
                              <span className="font-body text-xs text-[var(--color-ink)]">
                                {wp.availability ? t(`profile.availability.${wp.availability}`) : t("jobDetail.noInfo")}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <GraduationCap size={14} className="text-[var(--color-muted)]" />
                              <span className="font-body text-xs text-[var(--color-ink)]">
                                {wp.education ? t(`profile.education.${wp.education}`) : t("jobDetail.noInfo")}
                              </span>
                            </div>
                            {a.worker?.addresstext && (
                              <div className="flex items-center gap-2">
                                <MapPin size={14} className="text-[var(--color-muted)]" />
                                <span className="font-body text-xs text-[var(--color-ink)]">{a.worker.addresstext}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--color-border)]">
                            <span className="flex items-center gap-1.5 text-xs text-green-700 font-body font-medium">
                              <ShieldCheck size={13} />
                              {t("profile.phoneVerified")}
                            </span>
                            {a.worker?.createdAt && (
                              <span className="flex items-center gap-1.5 text-xs text-[var(--color-muted)] font-body">
                                <Calendar size={13} />
                                {t("profile.memberSince", {
                                  date: new Date(a.worker.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
                                })}
                              </span>
                            )}
                          </div>

                          {a.status === "selected" && a.worker?.phone && (
                            <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                              <p className="font-mono text-sm font-semibold text-[var(--color-primary)]">
                                📞 {a.worker.phone}
                              </p>
                            </div>
                          )}

                          {a.status === "selected" && job.status === "filled" && (
                            <RatingBox
                              onSubmit={rateWorker(a.worker._id)}
                              label={t("jobDetail.rateWorker")}
                              alreadyRated={ratedWorkerMap[a.worker._id]}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {showCloseConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full"
          >
            <h3 className="font-display font-bold text-lg text-[var(--color-ink)] mb-2">
              {t("jobDetail.closeConfirmTitle")}
            </h3>
            <p className="font-body text-sm text-[var(--color-muted)] mb-6">
              {t("jobDetail.closeConfirmBody")}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCloseConfirm(false)}
                className="flex-1 h-11 rounded-xl border border-[var(--color-border)] font-body text-sm font-semibold text-[var(--color-ink)]"
              >
                {t("editProfile.cancel")}
              </button>
              <button
                onClick={handleClose}
                className="flex-1 h-11 rounded-xl bg-red-600 text-white font-display font-semibold text-sm"
              >
                {t("jobDetail.closeJob")}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}