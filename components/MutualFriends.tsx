"use client";

import { useState } from "react";
import { Link } from "@/navigation";
import { FaTimes } from "react-icons/fa";
import { useTranslation } from "./I18nProvider";

interface Friend {
  _id?: string;
  id?: string;
  name: string;
  username?: string;
  image?: string;
  city?: {
    name: string;
  };
}

interface MutualFriendsProps {
  mutualFriends: Friend[];
  profileUserName?: string;
}

export default function MutualFriends({
  mutualFriends,
  profileUserName,
}: MutualFriendsProps) {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!mutualFriends || mutualFriends.length === 0) {
    return null;
  }

  const displayedFriends = mutualFriends.slice(0, 6);
  const hasMore = mutualFriends.length > 6;

  return (
    <>
      <div className="card  bg-base-200  shadow-xl  ">
        <div className="card-body">
          <h3 className="card-title text-lg mb-3 flex items-center gap-2">
            <span className="text-2xl">🤝</span>
            <span>
              {mutualFriends.length} {t("profile.mutualFriends") || "Friends in Common"}
              {profileUserName && ` with ${profileUserName}`}
            </span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {displayedFriends.map((friend) => (
              <Link
                key={friend._id || friend.id}
                href={`/dancer/${friend._id || friend.id}`}
                className="group"
              >
                <div className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-base-200/50 transition-colors">
                  <div className="avatar">
                    <div className="w-14 h-14 rounded-full ring-2 ring-primary/30 group-hover:ring-primary transition-all">
                      {friend.image ? (
                        <img
                          src={friend.image}
                          alt={friend.name || friend.username || "Friend"}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <div className="bg-primary text-primary-content rounded-full w-full h-full flex items-center justify-center">
                          <span className="text-xl">
                            {friend.name?.charAt(0)?.toUpperCase() || "?"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-center w-full">
                    <div className="font-semibold text-xs group-hover:text-primary transition-colors line-clamp-1">
                      {friend.name}
                    </div>
                    {friend.city && (
                      <div className="text-xs text-base-content/60 line-clamp-1">
                        {friend.city.name}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {hasMore && (
            <div className="text-center mt-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn btn-primary btn-sm btn-outline gap-2"
              >
                {t("profile.viewAll") || "View All"} {mutualFriends.length}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal for all mutual friends */}
      {isModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-base-100 rounded-lg shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-base-300">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <span className="text-3xl">🤝</span>
                  <span>
                    {mutualFriends.length} {t("profile.mutualFriends") || "Friends in Common"}
                    {profileUserName && ` with ${profileUserName}`}
                  </span>
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-ghost btn-sm btn-circle"
                >
                  <FaTimes className="text-lg" />
                </button>
              </div>

              {/* Friends Grid - Scrollable */}
              <div className="overflow-y-auto p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {mutualFriends.map((friend) => (
                    <Link
                      key={friend._id || friend.id}
                      href={`/dancer/${friend._id || friend.id}`}
                      className="group"
                      onClick={() => setIsModalOpen(false)}
                    >
                      <div className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-base-200 transition-colors">
                        <div className="avatar">
                          <div className="w-16 h-16 rounded-full ring ring-base-300 group-hover:ring-primary transition-all">
                            {friend.image ? (
                              <img
                                src={friend.image}
                                alt={friend.name || friend.username || "Friend"}
                                className="w-full h-full object-cover rounded-full"
                              />
                            ) : (
                              <div className="bg-primary text-primary-content rounded-full w-full h-full flex items-center justify-center">
                                <span className="text-2xl">
                                  {friend.name?.charAt(0)?.toUpperCase() || "?"}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-center w-full">
                          <div className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-1">
                            {friend.name}
                          </div>
                          {friend.city && (
                            <div className="text-xs text-base-content/60 line-clamp-1">
                              {friend.city.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
