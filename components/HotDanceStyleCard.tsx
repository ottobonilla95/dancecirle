import { Link } from "@/navigation";
import { DanceStyle } from "@/types/dance-style";

interface HotDanceStyleCardProps {
  danceStyle: DanceStyle & { userCount: number };
  index: number;
}

export default function HotDanceStyleCard({ danceStyle, index }: HotDanceStyleCardProps) {
  // Get unique styling based on index for visual variety
  const getCardColor = (idx: number) => {
    const colors = [
      'from-red-500/20 to-orange-500/20 border-red-500/30',
      'from-blue-500/20 to-purple-500/20 border-blue-500/30',
      'from-green-500/20 to-emerald-500/20 border-green-500/30',
      'from-pink-500/20 to-rose-500/20 border-pink-500/30',
      'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
      'from-amber-500/20 to-yellow-500/20 border-amber-500/30',
      'from-purple-500/20 to-fuchsia-500/20 border-purple-500/30',
      'from-teal-500/20 to-cyan-500/20 border-teal-500/30',
    ];
    return colors[(idx - 1) % colors.length];
  };

  // Get unique emoji based on index for visual variety
  const getCardEmoji = (idx: number) => {
    const emojis = ['🌶️', '💃', '🔥', '⭐', '💫', '✨', '🎵', '💥'];
    return emojis[(idx - 1) % emojis.length];
  };

  return (
    <Link
      href={`/dance-style/${danceStyle.slug || danceStyle._id}`}
      className={`card bg-gradient-to-br ${getCardColor(index)} border hover:scale-105 transition-all duration-300 p-4 relative overflow-hidden`}
    >
      {/* Rank Badge */}
      <div className="absolute top-2 left-2 bg-primary text-primary-content text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center z-10">
        {index}
      </div>

      {/* Mobile: Horizontal layout, Desktop: Vertical layout */}
      <div className="flex md:flex-col items-center gap-4 md:gap-2 md:text-center">
        {/* Emoji based on ranking */}
        <div className="text-4xl md:text-3xl flex-shrink-0">
          {getCardEmoji(index)}
        </div>

        <div className="flex-1 md:flex-none space-y-1 md:space-y-2">
          {/* Dance Style Name */}
          <h3 className="font-bold text-base md:text-lg line-clamp-1 md:line-clamp-2">
            {danceStyle.name}
          </h3>

          {/* User Count */}
          <div className="text-sm text-base-content/70">
            <span className="font-medium">{danceStyle.userCount}</span> dancers
          </div>

          {/* Category Badge */}
          <div>
            <span className="badge badge-outline badge-xs capitalize">
              {danceStyle.category}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
} 