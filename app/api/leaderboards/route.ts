import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectMongo();

    // 1. Most Liked Dancers (Global)
    const mostLikedDancers = await User.aggregate([
      { 
        $match: { 
          isProfileComplete: true
        } 
      },
      {
        $addFields: {
          likesCount: { $size: { $ifNull: ["$likedBy", []] } }
        }
      },
      { $match: { likesCount: { $gt: 0 } } },
      { $sort: { likesCount: -1 } },
      { $limit: 50 },
      {
        $project: {
          name: 1,
          username: 1,
          image: 1,
          likesCount: 1,
          isFeaturedProfessional: 1
        }
      }
    ]);

    // 2. J&J Champions (Most 1st places)
    const jjChampions = await User.aggregate([
      { $match: { 
        isProfileComplete: true, 
        jackAndJillCompetitions: { $exists: true, $ne: [] }
      } },
      {
        $addFields: {
          firstPlaces: {
            $size: {
              $filter: {
                input: "$jackAndJillCompetitions",
                as: "comp",
                cond: { $eq: ["$$comp.placement", "1st"] }
              }
            }
          }
        }
      },
      { $match: { firstPlaces: { $gt: 0 } } },
      { $sort: { firstPlaces: -1 } },
      { $limit: 50 },
      {
        $project: {
          name: 1,
          username: 1,
          image: 1,
          firstPlaces: 1,
          isFeaturedProfessional: 1
        }
      }
    ]);

    // 2b. J&J Podium (Most podium finishes: 1st, 2nd, 3rd)
    const jjPodium = await User.aggregate([
      { $match: { 
        isProfileComplete: true, 
        jackAndJillCompetitions: { $exists: true, $ne: [] }
      } },
      {
        $addFields: {
          podiumFinishes: {
            $size: {
              $filter: {
                input: "$jackAndJillCompetitions",
                as: "comp",
                cond: { $in: ["$$comp.placement", ["1st", "2nd", "3rd"]] }
              }
            }
          }
        }
      },
      { $match: { podiumFinishes: { $gt: 0 } } },
      { $sort: { podiumFinishes: -1 } },
      { $limit: 50 },
      {
        $project: {
          name: 1,
          username: 1,
          image: 1,
          podiumFinishes: 1,
          isFeaturedProfessional: 1
        }
      }
    ]);

    // 2c. J&J Participation (Most competitions participated)
    const jjParticipation = await User.aggregate([
      { $match: { 
        isProfileComplete: true, 
        jackAndJillCompetitions: { $exists: true, $ne: [] }
      } },
      {
        $addFields: {
          competitionsCount: { $size: "$jackAndJillCompetitions" }
        }
      },
      { $match: { competitionsCount: { $gt: 0 } } },
      { $sort: { competitionsCount: -1 } },
      { $limit: 50 },
      {
        $project: {
          name: 1,
          username: 1,
          image: 1,
          competitionsCount: 1,
          isFeaturedProfessional: 1
        }
      }
    ]);

    // 3. Most Liked Teachers
    const mostLikedTeachers = await User.aggregate([
      { 
        $match: { 
          isProfileComplete: true,
          isTeacher: true
        } 
      },
      {
        $addFields: {
          likesCount: { $size: { $ifNull: ["$likedBy", []] } }
        }
      },
      { $match: { likesCount: { $gt: 0 } } },
      { $sort: { likesCount: -1 } },
      { $limit: 50 },
      {
        $project: {
          name: 1,
          username: 1,
          image: 1,
          likesCount: 1,
          isFeaturedProfessional: 1
        }
      }
    ]);

    // 4. Most Liked DJs
    const mostLikedDJs = await User.aggregate([
      { 
        $match: { 
          isProfileComplete: true,
          isDJ: true
        } 
      },
      {
        $addFields: {
          likesCount: { $size: { $ifNull: ["$likedBy", []] } }
        }
      },
      { $match: { likesCount: { $gt: 0 } } },
      { $sort: { likesCount: -1 } },
      { $limit: 50 },
      {
        $project: {
          name: 1,
          username: 1,
          image: 1,
          likesCount: 1,
          isFeaturedProfessional: 1
        }
      }
    ]);

    // 5. Most Liked Photographers
    const mostLikedPhotographers = await User.aggregate([
      { 
        $match: { 
          isProfileComplete: true,
          isPhotographer: true
        } 
      },
      {
        $addFields: {
          likesCount: { $size: { $ifNull: ["$likedBy", []] } }
        }
      },
      { $match: { likesCount: { $gt: 0 } } },
      { $sort: { likesCount: -1 } },
      { $limit: 50 },
      {
        $project: {
          name: 1,
          username: 1,
          image: 1,
          likesCount: 1,
          isFeaturedProfessional: 1
        }
      }
    ]);

    // 6. Most Liked Producers
    const mostLikedProducers = await User.aggregate([
      { 
        $match: { 
          isProfileComplete: true,
          isProducer: true
        } 
      },
      {
        $addFields: {
          likesCount: { $size: { $ifNull: ["$likedBy", []] } }
        }
      },
      { $match: { likesCount: { $gt: 0 } } },
      { $sort: { likesCount: -1 } },
      { $limit: 50 },
      {
        $project: {
          name: 1,
          username: 1,
          image: 1,
          likesCount: 1,
          isFeaturedProfessional: 1
        }
      }
    ]);

    return NextResponse.json({
      mostLiked: mostLikedDancers,
      jjChampions,
      jjPodium,
      jjParticipation,
      mostLikedTeachers,
      mostLikedDJs,
      mostLikedPhotographers,
      mostLikedProducers,
    });
  } catch (error) {
    console.error('Error fetching leaderboards:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboards' }, { status: 500 });
  }
}

