import { motion } from "framer-motion";

// Base skeleton with pulse animation using NFL theme colors
function SkeletonPulse({ className = "" }) {
  return (
    <motion.div
      className={`bg-border/30 rounded ${className}`}
      animate={{ opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

// Skeleton for table rows
export function TableSkeleton({ rows = 5, columns = 6 }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-sm border-collapse">
        <thead>
          <tr className="border-b border-border bg-surface">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="p-2">
                <SkeletonPulse className="h-4 w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx} className="border-b border-border">
              {Array.from({ length: columns }).map((_, colIdx) => (
                <td key={colIdx} className="p-2">
                  <SkeletonPulse
                    className={`h-4 ${colIdx === 1 ? "w-24" : "w-12"}`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Skeleton for cards with stadium styling
export function CardSkeleton() {
  return (
    <div className="stadium-card p-4 space-y-4">
      <SkeletonPulse className="h-6 w-32" />
      <div className="space-y-2">
        <SkeletonPulse className="h-4 w-full" />
        <SkeletonPulse className="h-4 w-3/4" />
        <SkeletonPulse className="h-4 w-1/2" />
      </div>
    </div>
  );
}

// Skeleton for matchups section
export function MatchupsSkeleton({ count = 3 }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="field-card p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
            <TeamCardSkeleton />
            <div className="hidden md:flex justify-center">
              <SkeletonPulse className="h-8 w-12 rounded-full" />
            </div>
            <TeamCardSkeleton />
          </div>
        </div>
      ))}
    </div>
  );
}

// Skeleton for team card
function TeamCardSkeleton() {
  return (
    <div className="bg-surface rounded-lg p-4 space-y-3 border-l-4 border-border">
      <div className="flex items-center justify-between">
        <SkeletonPulse className="h-5 w-24" />
        <SkeletonPulse className="h-8 w-16" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <SkeletonPulse className="h-4 w-20" />
              <SkeletonPulse className="h-5 w-8 rounded" />
            </div>
            <SkeletonPulse className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton for dashboard view
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <section className="stadium-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <SkeletonPulse className="h-5 w-5 rounded" />
          <SkeletonPulse className="h-6 w-24" />
        </div>
        <TableSkeleton rows={8} columns={9} />
      </section>
      <section className="stadium-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <SkeletonPulse className="h-5 w-5 rounded" />
          <SkeletonPulse className="h-6 w-40" />
        </div>
        <MatchupsSkeleton count={3} />
      </section>
    </div>
  );
}

// Loading spinner component with field green accent
export function LoadingSpinner({ size = "md", className = "" }) {
  const sizeClasses = {
    sm: "w-5 h-5 border-2",
    md: "w-8 h-8 border-2",
    lg: "w-12 h-12 border-3",
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizeClasses[size]} border-field border-t-transparent rounded-full animate-spin`}
      />
    </div>
  );
}

export default {
  TableSkeleton,
  CardSkeleton,
  MatchupsSkeleton,
  DashboardSkeleton,
  LoadingSpinner,
};
