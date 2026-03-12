import { Link } from "@/navigation";

interface DanceStyle {
  id?: string;
  slug?: string;
  name: string;
  level: string;
  levelLabel: string;
  levelEmoji: string;
  description?: string;
}

interface DanceStyleCardProps {
  danceStyles: DanceStyle[];
  title?: string;
}

export default function DanceStyleCard({ danceStyles, title = "Dance Styles & Levels" }: DanceStyleCardProps) {
  return (
    <div className="mb-4">
      <div className="text-sm font-medium text-base-content/60 mb-3">
        {title}
      </div>
      <div className="space-y-4">
        {danceStyles.map((style: DanceStyle, index: number) => {
          // Convert level to number (1-4)
          const levelMap: { [key: string]: number } = {
            'beginner': 1,
            'intermediate': 2, 
            'advanced': 3,
            'expert': 4
          };
          const levelNum = levelMap[style.level] || 1;
          
          const content = (
            <div className="bg-base-300 rounded-lg p-3 hover:bg-base-200 transition-colors cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span>{style.levelEmoji}</span>
                  <span className="font-medium hover:text-primary transition-colors">{style.name}</span>
                </div>
                <span className="text-xs text-base-content/70 capitalize">
                  {style.levelLabel}
                </span>
              </div>
              {/* Level Progress Bar */}
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((bar) => (
                  <div
                    key={bar}
                    className={`h-2 flex-1 rounded-full ${
                      bar <= levelNum 
                        ? 'bg-primary' 
                        : 'bg-base-content/20'
                    }`}
                  />
                ))}
              </div>
            </div>
          );

          return style.id ? (
            <Link key={index} href={`/dance-style/${style.slug || style.id}`} className="block">
              {content}
            </Link>
          ) : (
            <div key={index}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
} 