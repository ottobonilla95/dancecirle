import { MetadataRoute } from 'next';
import connectMongo from '@/libs/mongoose';
import User from '@/models/User';
import City from '@/models/City';
import Country from '@/models/Country';
import Continent from '@/models/Continent';
import DanceStyle from '@/models/DanceStyle';
import Release from '@/models/Release';
import DJEvent from '@/models/DJEvent';
import OrganizerEvent from '@/models/OrganizerEvent';
import BlogPost from '@/models/BlogPost';

const baseUrl = 'https://www.dancecircle.co';
const LOCALES = ['en', 'es'] as const;

function localizedEntries(path: string, opts: { lastModified: Date; changeFrequency: 'daily' | 'weekly' | 'monthly'; priority: number }) {
  return LOCALES.map(locale => ({
    url: `${baseUrl}/${locale}${path}`,
    lastModified: opts.lastModified,
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
    alternates: {
      languages: Object.fromEntries(LOCALES.map(l => [l, `${baseUrl}/${l}${path}`])),
    },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    await connectMongo();

    // Fetch all users with complete profiles for public profile pages
    const users = await User.find({
      isProfileComplete: true,
      username: { $exists: true, $ne: null }
    })
      .select('username updatedAt')
      .lean();

    // Fetch all cities with dancers
    const cities = await City.find({ totalDancers: { $gt: 0 } })
      .select('_id slug updatedAt')
      .lean();

    // Get IDs of cities that have dancers, to filter countries/continents
    const cityIdsWithDancers = cities.map((c: any) => c._id);

    // Fetch countries that have at least one city with dancers
    const countriesWithDancers = await City.distinct('country', {
      _id: { $in: cityIdsWithDancers },
    });
    const countries = await Country.find({
      isActive: true,
      _id: { $in: countriesWithDancers },
    })
      .select('_id slug updatedAt')
      .lean();

    // Fetch continents that have at least one country with dancers
    const continentIdsWithDancers = await Country.distinct('continent', {
      _id: { $in: countriesWithDancers },
    });
    const continents = await Continent.find({
      isActive: true,
      _id: { $in: continentIdsWithDancers },
    })
      .select('_id slug updatedAt')
      .lean();

    // Fetch dance styles that have at least one dancer
    const styleIdsWithDancers = await User.distinct('danceStyles.danceStyle', {
      isProfileComplete: true,
    });
    const danceStyles = await DanceStyle.find({
      isActive: true,
      _id: { $in: styleIdsWithDancers },
    })
      .select('_id slug updatedAt')
      .lean();

    // Fetch releases that have an existing producer
    const activeProducerIds = await User.distinct('_id', { isProfileComplete: true, isProducer: true });
    const releases = await Release.find({ producer: { $in: activeProducerIds } })
      .select('_id createdAt')
      .lean();

    // Fetch DJ events that have an existing DJ
    const activeDjIds = await User.distinct('_id', { isProfileComplete: true, isDJ: true });
    const djEvents = await DJEvent.find({ djId: { $in: activeDjIds } })
      .select('_id updatedAt')
      .lean();

    // Fetch all published organizer events
    const organizerEvents = await OrganizerEvent.find({ isPublished: true })
      .select('_id updatedAt')
      .lean();

    // Fetch all published blog posts
    const blogPosts = await BlogPost.find({ isPublished: true })
      .select('slug locale publishedAt updatedAt')
      .lean();

    // Static pages (public pages only)
    const staticPages = [
      ...localizedEntries('', { lastModified: new Date(), changeFrequency: 'daily', priority: 1 }),
      ...localizedEntries('/cities', { lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 }),
      ...localizedEntries('/countries', { lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 }),
      ...localizedEntries('/dance-style', { lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 }),
      ...localizedEntries('/blog', { lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 }),
      ...localizedEntries('/privacy-policy', { lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 }),
      ...localizedEntries('/tos', { lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 }),
    ];

    // User profile pages (public)
    const userPages = users.flatMap((user: any) =>
      localizedEntries(`/${user.username}`, {
        lastModified: user.updatedAt || new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    );

    // City pages (public) - use slug for SEO-friendly URLs
    const cityPages = cities.flatMap((city: any) =>
      localizedEntries(`/city/${city.slug || city._id.toString()}`, {
        lastModified: city.updatedAt || new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      })
    );

    // Country pages (public) - only countries with dancers
    const countryPages = countries.flatMap((country: any) =>
      localizedEntries(`/country/${country.slug || country._id.toString()}`, {
        lastModified: country.updatedAt || new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      })
    );

    // Continent pages (public) - only continents with dancers
    const continentPages = continents.flatMap((continent: any) =>
      localizedEntries(`/continent/${continent.slug || continent._id.toString()}`, {
        lastModified: continent.updatedAt || new Date(),
        changeFrequency: 'weekly',
        priority: 0.5,
      })
    );

    // Dance style pages (public) - only styles with dancers
    const danceStylePages = danceStyles.flatMap((style: any) =>
      localizedEntries(`/dance-style/${style.slug || style._id.toString()}`, {
        lastModified: style.updatedAt || new Date(),
        changeFrequency: 'monthly',
        priority: 0.5,
      })
    );

    // Release pages (public - only releases with active producers)
    const releasePages = releases.flatMap((release: any) =>
      localizedEntries(`/release/${release._id.toString()}`, {
        lastModified: release.createdAt || new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    );

    // DJ event pages (public - only events with active DJs)
    const eventPages = djEvents.flatMap((event: any) =>
      localizedEntries(`/events/${event._id.toString()}`, {
        lastModified: event.updatedAt || new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    );

    // Organizer event pages (public)
    const organizerEventPages = organizerEvents.flatMap((event: any) =>
      localizedEntries(`/organizer-events/${event._id.toString()}`, {
        lastModified: event.updatedAt || new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      })
    );

    // Blog post pages (locale-specific, not localized pairs)
    const blogPages = blogPosts.map((post: any) => ({
      url: `${baseUrl}/${post.locale}/blog/${post.slug}`,
      lastModified: post.updatedAt || post.publishedAt || new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));

    return [
      ...staticPages,
      ...userPages,
      ...cityPages,
      ...countryPages,
      ...continentPages,
      ...releasePages,
      ...eventPages,
      ...danceStylePages,
      ...organizerEventPages,
      ...blogPages,
    ];
  } catch (error) {
    console.error('Error generating sitemap:', error);

    // Return at least static pages if database fails
    return [
      ...localizedEntries('', { lastModified: new Date(), changeFrequency: 'daily', priority: 1 }),
    ];
  }
}
