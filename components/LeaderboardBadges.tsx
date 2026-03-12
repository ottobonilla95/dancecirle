import { LeaderboardBadge } from "@/utils/leaderboard-badges";
import { Link } from "@/navigation";

interface LeaderboardBadgesProps {
  badges: LeaderboardBadge[];
  isCompact?: boolean;
}

export default function LeaderboardBadges({ badges, isCompact = false }: LeaderboardBadgesProps) {
  if (!badges || badges.length === 0) {
    return null;
  }

  if (isCompact) {
    // Compact view - mini badges with rank and medal
    return (
      <div className="flex gap-1.5 items-center flex-wrap">
        {badges.map((badge) => (
          <Link
            key={badge.category}
            href={`/leaderboards?category=${badge.category}`}
            className={`badge ${badge.color} badge-sm gap-1 hover:scale-105 transition-transform cursor-pointer tooltip tooltip-bottom`}
            data-tip={badge.categoryLabel}
          >
            <span className="text-base">{badge.emoji}</span>
            <span className="font-semibold text-xs">#{badge.rank}</span>
          </Link>
        ))}
      </div>
    );
  }

  // Full view - show badges with labels
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => (
        <Link
          key={badge.category}
          href={`/leaderboards?category=${badge.category}`}
          className={`badge ${badge.color} badge-lg gap-2 hover:scale-105 transition-transform cursor-pointer`}
        >
          <span className="text-lg">{badge.emoji}</span>
          <span className="font-semibold">#{badge.rank}</span>
          <span>{badge.categoryLabel}</span>
        </Link>
      ))}
    </div>
  );
}

