import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import api from "../services/api";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { getCategoryIcon } from "../utils/categoryicons";
import { MapPin, Star, Users, Calendar, CheckCircle2, XCircle, Lock } from "lucide-react";

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

  const [applicants, setApplicants] = useState([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

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

  useEffect(() => {
    if (job && isOwner) {
      setApplicantsLoading(true);
      api
        .get(`/jobs/${job._id}/applicants`)
        .then((res) => setApplicants(res.data.applicants || []))
        .finally(() => setApplicantsLoading(false));
    }
  }, [job, isOwner]);

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
        {/* main job info */}
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
              <span className="text-[11px] font-body text-[var(--color-muted)]">
                ({job.othercategorytext})
              </span>
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
        </motion.div>

        {/* hirer info */}
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

        {/* worker: apply / status */}
        {isWorker && !isOwner && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl border border-[var(--color-border)] p-6"
          >
            {myApplication && myApplication.status !== "withdrawn" ? (
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

        {/* hirer: manage applicants */}
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

            {!applicantsLoading && applicants.length > 0 && (
              <div className="space-y-3">
                {applicants.map((a) => (
                  <div
                    key={a._id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)]"
                  >
                    {a.worker?.photo?.url ? (
                      <img src={a.worker.photo.url} alt={a.worker.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                    ) : (
                      <span className="w-9 h-9 rounded-full bg-[var(--color-bg)] text-[var(--color-ink)] font-display font-bold text-sm flex items-center justify-center shrink-0">
                        {a.worker?.name?.[0]?.toUpperCase()}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-body font-semibold text-sm text-[var(--color-ink)] truncate">
                        {a.worker?.name}
                      </p>
                      <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${APP_STATUS_TEXT[a.status]}`}>
                        {t(`jobDetail.status.${a.status}`)}
                      </span>
                    </div>
                    {a.status === "applied" && job.status === "open" && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleSelect(a._id)}
                          disabled={busyId === a._id}
                          className="w-8 h-8 rounded-lg bg-green-50 text-green-700 flex items-center justify-center disabled:opacity-60"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                        <button
                          onClick={() => handleReject(a._id)}
                          disabled={busyId === a._id}
                          className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center disabled:opacity-60"
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}