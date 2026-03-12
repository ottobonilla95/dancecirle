import { Link } from "@/navigation";
import { FaMapMarkerAlt, FaUsers, FaPlane } from "react-icons/fa";
import { getMessages, getTranslation } from "@/lib/i18n";

interface CityStats {
  cityId: string;
  cityName: string;
  cityImage: string | null;
  countryCode: string;
  countryName: string;
  totalDancers: number;
  travelers: number;
  topStyles: Array<{
    name: string;
    count: number;
  }>;
}

interface YourCityPreviewProps {
  cityStats: CityStats | null;
}

// Generate flag emoji from country code
function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return "🌍";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 0x1f1e6 + char.charCodeAt(0) - "A".charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export default async function YourCityPreview({ cityStats }: YourCityPreviewProps) {
  const messages = await getMessages();
  const t = (key: string) => getTranslation(messages, key);

  if (!cityStats) return null;

  const flagEmoji = getFlagEmoji(cityStats.countryCode);

  return (
    <Link 
      href={`/city/${cityStats.cityId}`}
      className="block bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg overflow-hidden border border-primary/20 shadow-lg hover:shadow-xl hover:border-primary/40 transition-all duration-300 cursor-pointer group"
    >
      {/* Header with City Image */}
      <div className="relative h-32 overflow-hidden">
        {cityStats.cityImage ? (
          <img
            src={cityStats.cityImage}
            alt={cityStats.cityName}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary to-secondary group-hover:scale-110 transition-transform duration-300" />
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* City Info */}
        <div className="absolute bottom-2 left-4 right-4">
          <div className="flex items-center gap-2 mb-1">
            <FaMapMarkerAlt className="text-white text-sm" />
            <span className="text-xs text-white/80">{t('dashboard.yourCity')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{flagEmoji}</span>
            <h4 className="text-xl font-bold text-white">{cityStats.cityName}</h4>
          </div>
        </div>
      </div>

      {/* Compact Stats & Styles */}
      <div className="p-4 space-y-3">
        {/* Stats Row */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <FaUsers className="text-primary text-xs" />
            <span className="font-bold">{cityStats.totalDancers}</span>
            <span className="text-base-content/60">{t('dashboard.dancersInCity')}</span>
          </div>
          {cityStats.travelers > 0 && (
            <div className="flex items-center gap-1.5">
              <FaPlane className="text-secondary text-xs" />
              <span className="font-bold">{cityStats.travelers}</span>
              <span className="text-base-content/60">{t('dashboard.travelers')}</span>
            </div>
          )}
        </div>

        {/* Top Styles */}
        {cityStats.topStyles.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {cityStats.topStyles.map((style) => (
              <div key={style.name} className="badge badge-sm badge-primary gap-1">
                {style.name} <span className="text-xs opacity-70">({style.count})</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

