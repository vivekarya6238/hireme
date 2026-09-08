import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { getCategoryIcon } from "../utils/categoryicons";
import { MapPin } from "lucide-react";

export default function JobCard({ job }) {
  const { t } = useTranslation();
  const Icon = getCategoryIcon(job.category?.namekey);
  const distanceKm = job.distanceKm;

  return (
    <motion.div whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
      <Link
        to={`/jobs/${job._id}`}
        className="group block bg-white border border-[var(--color-border)] rounded-3xl p-6 relative overflow-hidden hover:border-[var(--color-primary)]/30 hover:shadow-lg transition-all"
      >
        {/* decorative blobs - same language as the trust card */}
        <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-[var(--color-primary)]/5" />
        <div className="absolute -bottom-6 -right-2 w-16 h-16 rounded-full bg-[var(--color-accent)]/8" />

        <div className="relative flex items-start justify-between mb-4">
          <span className="inline-flex w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary)]/80 items-center justify-center shadow-sm">
            <Icon size={18} className="text-white" strokeWidth={1.75} />
          </span>
          <span className="font-mono text-[10px] text-[var(--color-muted)] mt-1.5">
            {t("dashboard.jobId", { id: job._id.slice(-5).toUpperCase() })}
          </span>
        </div>

        <h3 className="relative font-display font-bold text-[15px] text-[var(--color-ink)] leading-snug mb-1.5">
          {job.title}
        </h3>

        <div className="relative flex flex-wrap items-center gap-1.5 mb-5">
          <span className="text-[11px] font-body font-medium text-[var(--color-primary)] bg-[var(--color-primary)]/8 px-2 py-1 rounded-lg">
            {t(`categories.${job.category?.namekey}`)}
          </span>
          {job.workplacetype && (
            <span className="text-[11px] font-body text-[var(--color-muted)]">
              {t(`workplacetypes.${job.workplacetype.namekey}`)}
            </span>
          )}
          {distanceKm !== undefined && (
            <span className="flex items-center gap-0.5 text-[11px] font-body text-[var(--color-muted)] ml-auto">
              <MapPin size={11} />
              {distanceKm.toFixed(1)} km
            </span>
          )}
        </div>

        <div className="relative flex items-end justify-between pt-4 border-t border-dashed border-[var(--color-border)]">
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
          <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1.5 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            {t("dashboard.openStatus")}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}