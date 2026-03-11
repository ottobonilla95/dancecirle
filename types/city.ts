export type City = {
  _id?: string;
  id: string;
  name: string;
  slug?: string;
  country: {
    name: string;
    code: string;
  };
  continent: {
    name: string;
  };
  population?: number;
  totalDancers: number;
  image?: string;
  description?: string;
  rank: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
  danceStyles?: { style: string }[];
};
