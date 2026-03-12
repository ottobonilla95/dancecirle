'use client';

import { useEffect, useRef, useState } from 'react';
import { Link } from '@/navigation';
import { useTranslation } from '@/components/I18nProvider';
import mapboxgl from 'mapbox-gl';

interface Friend {
  _id: string;
  name: string;
  image?: string;
  username?: string;
  city: {
    _id: string;
    name: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
}

interface FriendsMapProps {
  friends: Friend[];
  mapboxToken?: string;
}

export default function FriendsMap({ friends, mapboxToken }: FriendsMapProps) {
  const { t } = useTranslation();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const activePopupRef = useRef<mapboxgl.Popup | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Set your Mapbox access token
    mapboxgl.accessToken = mapboxToken || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

    if (!mapboxgl.accessToken) {
      console.error('Mapbox token is required');
      return;
    }

    // Initialize map
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12', // Colorful streets style
      projection: 'globe' as any, // Globe projection
      center: [0, 20],
      zoom: 1.5,
      attributionControl: false,
    });

    mapRef.current = map;

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.on('load', () => {
      setIsLoaded(true);

      // Set atmosphere for a nice starry effect
      map.setFog({
        color: 'rgb(186, 210, 235)',
        'high-color': 'rgb(36, 92, 223)',
        'horizon-blend': 0.02,
        'space-color': 'rgb(11, 11, 25)',
        'star-intensity': 0.6,
      });

      // Group friends by city
      const friendsByCity = new Map<string, Friend[]>();
      
      friends.forEach((friend) => {
        if (friend.city?.coordinates?.lat && friend.city?.coordinates?.lng) {
          const cityId = friend.city._id;
          if (!friendsByCity.has(cityId)) {
            friendsByCity.set(cityId, []);
          }
          friendsByCity.get(cityId)!.push(friend);
        }
      });

      // Create markers for each city with proper anchoring
      friendsByCity.forEach((cityFriends, cityId) => {
        const firstFriend = cityFriends[0];
        const { lat, lng } = firstFriend.city.coordinates!;

        // Create a custom marker element
        const el = document.createElement('div');
        el.className = 'friend-marker';
        el.style.cursor = 'pointer';

        // Create inner wrapper that will handle the hover effect
        const innerWrapper = document.createElement('div');
        innerWrapper.className = 'friend-marker-inner';
        innerWrapper.style.width = '60px';
        innerWrapper.style.height = '60px';
        innerWrapper.style.position = 'relative';
        innerWrapper.style.transition = 'transform 0.3s ease';

        // Show first friend's avatar or stacked avatars
        if (cityFriends.length === 1) {
          const img = document.createElement('img');
          img.src = firstFriend.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(firstFriend.name)}&background=random`;
          img.style.width = '50px';
          img.style.height = '50px';
          img.style.borderRadius = '50%';
          img.style.border = '3px solid #fff';
          img.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
          img.style.backgroundColor = '#fff';
          img.style.display = 'block';
          innerWrapper.appendChild(img);
        } else {
          // Show stacked avatars for multiple friends
          cityFriends.slice(0, 3).forEach((friend, index) => {
            const img = document.createElement('img');
            img.src = friend.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name)}&background=random`;
            img.style.width = '40px';
            img.style.height = '40px';
            img.style.borderRadius = '50%';
            img.style.border = '2px solid #fff';
            img.style.position = 'absolute';
            img.style.left = `${index * 15}px`;
            img.style.top = `${index * 5}px`;
            img.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)';
            img.style.backgroundColor = '#fff';
            innerWrapper.appendChild(img);
          });

          // Add count badge if more than 3 friends
          if (cityFriends.length > 3) {
            const badge = document.createElement('div');
            badge.textContent = `+${cityFriends.length - 3}`;
            badge.style.position = 'absolute';
            badge.style.right = '0';
            badge.style.top = '0';
            badge.style.backgroundColor = '#ff4444';
            badge.style.color = 'white';
            badge.style.borderRadius = '50%';
            badge.style.width = '20px';
            badge.style.height = '20px';
            badge.style.display = 'flex';
            badge.style.alignItems = 'center';
            badge.style.justifyContent = 'center';
            badge.style.fontSize = '10px';
            badge.style.fontWeight = 'bold';
            badge.style.border = '2px solid white';
            innerWrapper.appendChild(badge);
          }
        }

        el.appendChild(innerWrapper);

        // Hover effect on inner wrapper (doesn't affect positioning)
        el.addEventListener('mouseenter', () => {
          innerWrapper.style.transform = 'scale(1.15)';
        });
        el.addEventListener('mouseleave', () => {
          innerWrapper.style.transform = 'scale(1)';
        });

        // Create popup content with beautiful styling
        const popupContent = document.createElement('div');
        popupContent.style.minWidth = '240px';
        popupContent.style.fontFamily = 'system-ui, -apple-system, sans-serif';
        
        const cityTitle = document.createElement('div');
        cityTitle.innerHTML = `<strong style="font-size: 16px; color: #1a1a1a;">📍 ${firstFriend.city.name}</strong>`;
        cityTitle.style.marginBottom = '12px';
        cityTitle.style.paddingBottom = '12px';
        cityTitle.style.borderBottom = '2px solid #e5e7eb';
        popupContent.appendChild(cityTitle);

        // Add friends count if multiple
        if (cityFriends.length > 1) {
          const countBadge = document.createElement('div');
          countBadge.textContent = `${cityFriends.length} friends here`;
          countBadge.style.fontSize = '12px';
          countBadge.style.color = '#6b7280';
          countBadge.style.marginBottom = '10px';
          popupContent.appendChild(countBadge);
        }

        // Add friends list
        const friendsList = document.createElement('div');
        friendsList.style.maxHeight = '280px';
        friendsList.style.overflowY = 'auto';
        friendsList.style.overflowX = 'hidden';
        
        cityFriends.forEach((friend, index) => {
          const friendDiv = document.createElement('div');
          friendDiv.style.display = 'flex';
          friendDiv.style.alignItems = 'center';
          friendDiv.style.gap = '12px';
          friendDiv.style.padding = '10px';
          friendDiv.style.cursor = 'pointer';
          friendDiv.style.transition = 'all 0.2s ease';
          friendDiv.style.borderRadius = '8px';
          friendDiv.style.marginBottom = '4px';
          
          friendDiv.addEventListener('mouseenter', () => {
            friendDiv.style.backgroundColor = '#f3f4f6';
            friendDiv.style.transform = 'translateX(2px)';
          });
          friendDiv.addEventListener('mouseleave', () => {
            friendDiv.style.backgroundColor = 'transparent';
            friendDiv.style.transform = 'translateX(0)';
          });
          
          const friendImg = document.createElement('img');
          friendImg.src = friend.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name)}&background=random`;
          friendImg.style.width = '40px';
          friendImg.style.height = '40px';
          friendImg.style.borderRadius = '50%';
          friendImg.style.border = '2px solid #e5e7eb';
          friendImg.style.flexShrink = '0';
          
          const friendInfo = document.createElement('div');
          friendInfo.style.flex = '1';
          friendInfo.style.minWidth = '0';
          friendInfo.innerHTML = `
            <div style="font-weight: 600; font-size: 14px; color: #1a1a1a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${friend.name}</div>
            ${friend.username ? `<div style="font-size: 12px; color: #6b7280; margin-top: 2px;">@${friend.username}</div>` : ''}
          `;
          
          const viewIcon = document.createElement('div');
          viewIcon.innerHTML = '→';
          viewIcon.style.fontSize = '18px';
          viewIcon.style.color = '#9ca3af';
          viewIcon.style.transition = 'transform 0.2s ease';
          
          friendDiv.addEventListener('mouseenter', () => {
            viewIcon.style.transform = 'translateX(4px)';
          });
          friendDiv.addEventListener('mouseleave', () => {
            viewIcon.style.transform = 'translateX(0)';
          });
          
          friendDiv.appendChild(friendImg);
          friendDiv.appendChild(friendInfo);
          friendDiv.appendChild(viewIcon);
          
          // Click to view profile
          friendDiv.addEventListener('click', () => {
            window.location.href = `/dancer/${friend._id}`;
          });
          
          friendsList.appendChild(friendDiv);
        });
        
        popupContent.appendChild(friendsList);

        // Create popup
        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: true,
          closeOnClick: false,
          maxWidth: '320px',
          className: 'custom-popup',
        }).setDOMContent(popupContent);

        // Handle popup open - close any previously open popup
        el.addEventListener('click', () => {
          // Close the currently active popup if exists
          if (activePopupRef.current && activePopupRef.current.isOpen()) {
            activePopupRef.current.remove();
          }
          // Set this popup as the active one
          activePopupRef.current = popup;
        });

        // Create marker
        const marker = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(map);

        markersRef.current.push(marker);
      });

      // Auto-rotation disabled - map stays still unless user interacts
    });

    // Cleanup
    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
    };
  }, [friends, mapboxToken]);

  // Filter friends with valid coordinates
  const friendsWithCoordinates = friends.filter(
    f => f.city?.coordinates?.lat && f.city?.coordinates?.lng
  );

  const hasNoFriends = friends.length === 0;
  const hasFriendsButNoCoordinates = friends.length > 0 && friendsWithCoordinates.length === 0;

  return (
    <div className="relative w-full">
      <div
        ref={mapContainerRef}
        className="w-full md:rounded-lg overflow-hidden shadow-2xl"
        style={{ height: '500px' }}
      />
      
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-base-200 md:rounded-lg">
          <div className="text-center">
            <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
            <p className="text-base-content/70">Loading map...</p>
          </div>
        </div>
      )}

      {/* Empty State Overlay - Show when no friends */}
      {hasNoFriends && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm md:rounded-lg">
          <div className="text-center max-w-md px-6 py-8 bg-base-100 rounded-2xl shadow-2xl mx-4">
            <div className="text-6xl mb-4">🌍</div>
            <h3 className="text-2xl font-bold mb-2 text-base-content">
              {t('friendsMap.networkStartsHere')}
            </h3>
            <p className="text-base-content/70 mb-6">
              Connect with dancers around the world and watch them appear on your map!
            </p>
            <Link
              href="/discover"
              className="btn btn-primary btn-lg gap-2"
            >
              <span>🔍</span>
              Discover People
            </Link>
          </div>
        </div>
      )}

      {/* Friends but no coordinates message */}
      {hasFriendsButNoCoordinates && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm md:rounded-lg">
          <div className="text-center max-w-md px-6 py-8 bg-base-100 rounded-2xl shadow-xl mx-4">
            <div className="text-5xl mb-3">📍</div>
            <p className="text-base-content/80">
              {t('friendsMap.friendsWillAppear')}
            </p>
          </div>
        </div>
      )}

      {/* Map Legend - Only show when there are friends with coordinates */}
      {friendsWithCoordinates.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-base-100/90 backdrop-blur-sm rounded-lg p-3 shadow-lg text-xs md:text-sm">
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary"></div>
              <span className="text-base-content/80">
                {friendsWithCoordinates.length} friend{friendsWithCoordinates.length !== 1 ? 's' : ''} in {new Set(friendsWithCoordinates.map(f => f.city._id)).size} {new Set(friendsWithCoordinates.map(f => f.city._id)).size !== 1 ? 'cities' : 'city'}
              </span>
            </div>
            <div className="text-base-content/60 text-xs">
              Click markers to see friends • Drag to explore
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

