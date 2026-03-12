import { Link } from "@/navigation";
import { getMessages, getTranslation } from "@/lib/i18n";
import Flag from "./Flag";

interface TrendyCountriesProps {
  countries: Array<{
    _id: string;
    name: string;
    slug?: string;
    code: string;
    totalDancers: number;
    recentlyActive?: number;
    trendingScore?: number;
    continent?: {
      _id: string;
      name: string;
    } | null;
  }>;
}

export default async function TrendyCountries({ countries }: TrendyCountriesProps) {
  const messages = await getMessages();
  const t = (key: string) => getTranslation(messages, key);

  return (
    <section className="text-neutral-content">
      <div className="mb-4">
        <h2 className="max-w-3xl font-extrabold text-xl md:text-2xl tracking-tight">
          {t('dashboard.trendyCountries')} 🌍
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
        {countries.map((country, index) => {
          // Show only top 4 on mobile, top 6 on desktop
          const isHidden = index >= 4 && index < 6;
          
          return (
            <Link
              href={`/country/${country.slug || country._id}`}
              key={country._id}
              className={`block bg-base-200 hover:bg-base-300 transition-all duration-200 hover:shadow-lg group overflow-hidden rounded-xl md:rounded-2xl ${isHidden ? 'hidden md:block' : ''}`}
            >
              <div className="flex items-stretch">
                {/* Left side - Content */}
                <div className="flex-1 p-2 md:p-3 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
                    <span className="text-xs md:text-sm font-bold opacity-50">#{index + 1}</span>
                    <h3 className="font-bold text-base md:text-lg group-hover:text-primary transition-colors truncate">
                      {country.name}
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs md:text-sm opacity-70">
                    <span className="font-semibold">{country.totalDancers}</span>
                    <span className="text-[10px] md:text-xs">{t('common.dancers')}</span>
                  </div>
                </div>
                
                {/* Right side - Flag (Full Height from edge to edge) */}
                <div className="flex items-center justify-center bg-base-300/50 min-w-[70px] md:min-w-[100px] -my-[1px] -mr-[1px]">
                  <Flag countryCode={country.code} size="xl" className="md:hidden" />
                  <Flag countryCode={country.code} size="2xl" className="hidden md:block" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {countries.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🌍</div>
          <p className="text-lg opacity-75">
            {t('dashboard.noTrendyCountries')}
          </p>
        </div>
      )}
    </section>
  );
}

