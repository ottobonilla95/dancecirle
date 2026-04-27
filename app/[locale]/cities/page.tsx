import connectMongo from "@/libs/mongoose";
import CityModel from "@/models/City";
import Country from "@/models/Country";
import Continent from "@/models/Continent";
import CitiesPageClient from "@/components/CitiesPageClient";
import { City } from "@/types";

const INITIAL_LIMIT = 12;

async function getInitialCities(): Promise<{
  cities: City[];
  totalCount: number;
  hasMore: boolean;
}> {
  await connectMongo();

  const searchCriteria = {
    isActive: true,
    totalDancers: { $gt: 0 },
  };

  const totalCount = await CityModel.countDocuments(searchCriteria);

  const cities = await CityModel.find(searchCriteria)
    .populate({ path: "country", model: Country, select: "name code" })
    .populate({ path: "continent", model: Continent, select: "name" })
    .sort({ totalDancers: -1, name: 1 })
    .limit(INITIAL_LIMIT)
    .lean();

  const transformedCities = cities.map((city: any) => ({
    ...city,
    _id: city._id.toString(),
    id: city._id.toString(),
    country: {
      name: city.country?.name || "",
      code: city.country?.code || "",
    },
    continent: {
      name: city.continent?.name || "",
    },
  }));

  return {
    cities: transformedCities,
    totalCount,
    hasMore: INITIAL_LIMIT < totalCount,
  };
}

export default async function CitiesPage() {
  const { cities, totalCount, hasMore } = await getInitialCities();

  return (
    <CitiesPageClient
      initialCities={cities}
      initialTotalCount={totalCount}
      initialHasMore={hasMore}
    />
  );
}
