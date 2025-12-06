import { MetadataRoute } from 'next';
import connectMongo from '@/libs/mongoose';
import User from '@/models/User';
import City from '@/models/City';
import Country from '@/models/Country';
import Continent from '@/models/Continent';
import DanceStyle from '@/models/DanceStyle';
import Release from '@/models/Release';
import DJEvent from '@/models/DJEvent';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://dancecircle.co';

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
      .select('_id updatedAt')
      .lean();

    // Fetch all active countries (totalDancers field may not be populated, so just get all active)
    const countries = await Country.find({ isActive: true })
      .select('_id updatedAt')
      .lean();

    // Fetch all active continents (totalDancers field may not be populated, so just get all active)
    const continents = await Continent.find({ isActive: true })
      .select('_id updatedAt')
      .lean();

    // Fetch all dance styles
    const danceStyles = await DanceStyle.find({ isActive: true })
      .select('_id updatedAt')
      .lean();

    // Fetch all releases (public music releases)
    const releases = await Release.find({})
      .select('_id createdAt')
      .lean();

    // Fetch all DJ events (public events)
    const djEvents = await DJEvent.find({})
      .select('_id updatedAt')
      .lean();

    // Static pages (public pages only)
    const staticPages = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1,
      },
      {
        url: `${baseUrl}/blog`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      },
      {
        url: `${baseUrl}/cities`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.7,
      },
      {
        url: `${baseUrl}/countries`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.7,
      },
      {
        url: `${baseUrl}/privacy-policy`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.3,
      },
      {
        url: `${baseUrl}/tos`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.3,
      },
    ];

    // User profile pages (public)
    const userPages = users.map((user: any) => ({
      url: `${baseUrl}/${user.username}`,
      lastModified: user.updatedAt || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    // City pages (public)
    const cityPages = cities.map((city: any) => ({
      url: `${baseUrl}/city/${city._id.toString()}`,
      lastModified: city.updatedAt || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    // Country pages (public)
    const countryPages = countries.map((country: any) => ({
      url: `${baseUrl}/country/${country._id.toString()}`,
      lastModified: country.updatedAt || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    // Continent pages (public)
    const continentPages = continents.map((continent: any) => ({
      url: `${baseUrl}/continent/${continent._id.toString()}`,
      lastModified: continent.updatedAt || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }));

    // Dance style pages (note: these are now private, but keeping for when we make them public)
    // Commenting out for now since they require auth
    /*
    const danceStylePages = danceStyles.map((style: any) => ({
      url: `${baseUrl}/dance-style/${style._id.toString()}`,
      lastModified: style.updatedAt || new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }));
    */

    // Release pages (public - music releases by producers)
    const releasePages = releases.map((release: any) => ({
      url: `${baseUrl}/release/${release._id.toString()}`,
      lastModified: release.createdAt || new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));

    // DJ event pages (public - events played by DJs)
    const eventPages = djEvents.map((event: any) => ({
      url: `${baseUrl}/events/${event._id.toString()}`,
      lastModified: event.updatedAt || new Date(),
      changeFrequency: 'weekly' as const,
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
      // ...danceStylePages, // Uncomment when dance styles are public
    ];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    
    // Return at least static pages if database fails
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1,
      },
      {
        url: `${baseUrl}/blog`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      },
    ];
  }
}

