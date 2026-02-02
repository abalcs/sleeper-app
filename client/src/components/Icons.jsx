import { Trophy, Crown, Medal, Star, Users, Calendar, BarChart3, Target, TrendingUp, ArrowUpDown } from 'lucide-react';

// Custom Football SVG Icon
export function FootballIcon({ className = "w-6 h-6", ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...props}
    >
      <ellipse cx="12" cy="12" rx="10" ry="6" fill="currentColor" />
      <path
        d="M6 12c0-1.5 2.7-3 6-3s6 1.5 6 3"
        stroke="white"
        strokeWidth="0.5"
        fill="none"
      />
      <line x1="12" y1="7" x2="12" y2="17" stroke="white" strokeWidth="0.5" />
      <line x1="10" y1="9" x2="10" y2="15" stroke="white" strokeWidth="0.3" />
      <line x1="14" y1="9" x2="14" y2="15" stroke="white" strokeWidth="0.3" />
    </svg>
  );
}

// Position Badge Component
const positionColors = {
  QB: 'pos-qb',
  RB: 'pos-rb',
  WR: 'pos-wr',
  TE: 'pos-te',
  K: 'pos-k',
  DEF: 'pos-def',
  FLEX: 'bg-gradient-to-r from-blue-600 to-green-600 text-white',
};

export function PositionBadge({ position, className = "" }) {
  const colorClass = positionColors[position] || 'bg-gray-600 text-white';
  return (
    <span className={`inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold rounded ${colorClass} ${className}`}>
      {position}
    </span>
  );
}

// Rank Badge Component with Crown/Medal icons
export function RankBadge({ rank, className = "" }) {
  if (rank === 1) {
    return (
      <span className={`inline-flex items-center gap-1 rank-gold ${className}`}>
        <Crown className="w-4 h-4 fill-gold" />
        <span className="font-display font-bold">1</span>
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className={`inline-flex items-center gap-1 rank-silver ${className}`}>
        <Medal className="w-4 h-4" />
        <span className="font-display font-bold">2</span>
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className={`inline-flex items-center gap-1 rank-bronze ${className}`}>
        <Medal className="w-4 h-4" />
        <span className="font-display font-bold">3</span>
      </span>
    );
  }
  return (
    <span className={`font-display font-bold text-muted ${className}`}>
      {rank}
    </span>
  );
}

// Winner Badge with animated trophy
export function WinnerBadge({ className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1 text-gold animate-touchdown ${className}`}>
      <Trophy className="w-5 h-5 fill-gold" />
    </span>
  );
}

// VS Badge for matchups
export function VSBadge({ className = "" }) {
  return (
    <div className={`vs-divider ${className}`}>
      <span className="vs-badge">VS</span>
    </div>
  );
}

// Re-export Lucide icons for convenience
export {
  Trophy,
  Crown,
  Medal,
  Star,
  Users,
  Calendar,
  BarChart3,
  Target,
  TrendingUp,
  ArrowUpDown,
};
