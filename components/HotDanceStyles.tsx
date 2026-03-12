import { Link } from "@/navigation";
import { DanceStyle } from "@/types/dance-style";
import HotDanceStyleCard from "./HotDanceStyleCard";
import { getMessages, getTranslation } from "@/lib/i18n";

interface HotDanceStylesProps {
  danceStyles: (DanceStyle & { userCount: number })[];
}

export default async function HotDanceStyles({ danceStyles }: HotDanceStylesProps) {
  const messages = await getMessages();
  const t = (key: string) => getTranslation(messages, key);

  return (
    <section className="text-neutral-content">
      <div className="flex items-center justify-between mb-4">
        <h2 className="max-w-3xl font-extrabold text-xl md:text-2xl tracking-tight">
          {t('dashboard.hotDanceStyles')}
        </h2>
        <Link href="/dance-style" className="btn btn-outline btn-sm">
          {t('common.viewAll')}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
        {danceStyles.map((style, index) => (
          <HotDanceStyleCard 
            key={style._id} 
            danceStyle={style} 
            index={index + 1}
          />
        ))}
      </div>

      {danceStyles.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">💃</div>
          <p className="text-lg opacity-75">
            No dance styles available at the moment.
          </p>
        </div>
      )}
    </section>
  );
} 