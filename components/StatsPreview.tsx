import { Link } from "@/navigation";
import { FaUsers, FaGlobeAmericas, FaMusic, FaChartBar } from "react-icons/fa";
import WorldMap from "./WorldMap";
import { getMessages, getTranslation } from "@/lib/i18n";

interface StatsPreviewProps {
  stats: {
    totalDancers: number;
    totalCountries: number;
    totalCities: number;
    topDanceStyle: { name: string; count: number; emoji: string };
    leaderFollowerRatio: { leaders: number; followers: number; both: number };
  };
  countryData?: Array<{
    _id: string;
    name: string;
    code: string;
    dancerCount: number;
  }>;
}

export default async function StatsPreview({
  stats,
  countryData = [],
}: StatsPreviewProps) {
  const messages = await getMessages();
  const t = (key: string) => getTranslation(messages, key);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const getPercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  const totalRoles =
    stats.leaderFollowerRatio.leaders +
    stats.leaderFollowerRatio.followers +
    stats.leaderFollowerRatio.both;

  return (
    <section className="text-neutral-content">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="max-w-3xl font-extrabold text-xl md:text-2xl tracking-tight">
            {t('dashboard.communityStats')}
          </h2>
          {/* <p className="text-base-content/60">
            See how our dance community is growing worldwide
          </p> */}
        </div>
        <Link href="/stats" className="btn btn-outline btn-sm gap-2">
          <FaChartBar />
          {t('common.viewAll')}
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="stat bg-base-200 rounded-lg p-4">
          <div className="stat-figure text-primary">
            <FaUsers className="text-2xl" />
          </div>
          <div className="stat-title text-xs">{t('dashboard.totalDancers')}</div>
          <div className="stat-value text-primary text-xl">
            {formatNumber(stats.totalDancers)}
          </div>
        </div>

        <div className="stat bg-base-200 rounded-lg p-4">
          <div className="stat-figure text-secondary">
            <FaGlobeAmericas className="text-2xl" />
          </div>
          <div className="stat-title text-xs">{t('common.countries')}</div>
          <div className="stat-value text-secondary text-xl">
            {stats.totalCountries}
          </div>
        </div>

        <div className="stat bg-base-200 rounded-lg p-4">
          <div className="stat-figure text-accent">
            <FaMusic className="text-2xl" />
          </div>
          <div className="stat-title text-xs">{t('dashboard.topStyle')}</div>
          <div className="stat-value text-accent text-lg leading-tight !whitespace-normal break-words max-w-full">
            {stats.topDanceStyle.emoji} {stats.topDanceStyle.name}
          </div>
          <div className="stat-desc text-xs">
            {formatNumber(stats.topDanceStyle.count)} {t('common.dancers').toLowerCase()}
          </div>
        </div>

        <div className="stat bg-base-200 rounded-lg p-4">
          <div className="stat-figure text-info">
            <span className="text-2xl">💃🕺</span>
          </div>
          <div className="stat-title text-xs">Role Split</div>
          {totalRoles > 0 ? (
            <>
              <div className="stat-value text-info text-sm">
                {getPercentage(stats.leaderFollowerRatio.leaders, totalRoles)}%
                Leaders
              </div>
              <div className="stat-desc text-xs">
                {getPercentage(stats.leaderFollowerRatio.followers, totalRoles)}
                % Followers
              </div>
            </>
          ) : (
            <>
              <div className="stat-value text-info text-sm">No Data</div>
              <div className="stat-desc text-xs">
                Users haven&apos;t set roles yet
              </div>
            </>
          )}
        </div>
      </div>

      {/* World Map */}
      {countryData.length > 0 && (
        <div className="mt-8">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Dancers Worldwide</h3>
          </div>
          <WorldMap countryData={countryData} />
        </div>
      )}

    </section>
  );
}
