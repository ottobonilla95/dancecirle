'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { FaExpand, FaTimes } from 'react-icons/fa';

interface Dancer {
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

interface DancersMapProps {
  dancers: Dancer[];
  mapboxToken?: string;
  autoSpin?: boolean; // Auto-rotate the globe
  disableMobileDrag?: boolean; // Disable one-finger drag on mobile (allows page scroll)
  hideDancerCount?: boolean; // Hide dancer count in legend (for landing page)
}

export default function DancersMap({ 
  dancers, 
  mapboxToken, 
  autoSpin = false,
  disableMobileDrag = false,
  hideDancerCount = false
}: DancersMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const activePopupRef = useRef<mapboxgl.Popup | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const hintTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
      style: 'mapbox://styles/mapbox/streets-v12',
      projection: 'globe' as any,
      center: [10, 30], // Start centered on Europe/Mediterranean
      zoom: 1.5,
      attributionControl: false,
      // Cooperative gestures - require Ctrl/Cmd for scroll zoom on desktop
      cooperativeGestures: !isMobile,
    });

    mapRef.current = map;

    // Disable one-finger drag on mobile if specified (only allow two-finger pinch zoom)
    if (disableMobileDrag && isMobile && !isFullscreen) {
      map.dragPan.disable();
      map.scrollZoom.disable();
      // Keep two-finger gestures enabled
      map.touchZoomRotate.enable();
      map.doubleClickZoom.enable();
    }

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Show hint when user tries to scroll without Ctrl/Cmd (desktop only)
    if (!isMobile) {
      map.on('wheel', (e) => {
        // Check if Ctrl/Cmd key is NOT pressed
        if (!e.originalEvent.ctrlKey && !e.originalEvent.metaKey) {
          setShowScrollHint(true);
          
          // Clear existing timeout
          if (hintTimeoutRef.current) {
            clearTimeout(hintTimeoutRef.current);
          }
          
          // Hide hint after 2 seconds
          hintTimeoutRef.current = setTimeout(() => {
            setShowScrollHint(false);
          }, 2000);
        }
      });
    }

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

      // Auto-spin the globe if enabled
      if (autoSpin) {
        let userInteracting = false;
        let spinEnabled = true;

        // Disable spin when user interacts
        const onInteractionStart = () => {
          userInteracting = true;
        };

        const onInteractionEnd = () => {
          userInteracting = false;
          // Resume spinning after 3 seconds of no interaction
          setTimeout(() => {
            if (!userInteracting) {
              spinEnabled = true;
            }
          }, 3000);
        };

        map.on('mousedown', onInteractionStart);
        map.on('touchstart', onInteractionStart);
        map.on('mouseup', onInteractionEnd);
        map.on('touchend', onInteractionEnd);
        map.on('wheel', onInteractionStart);

        // Spin the globe
        const spinGlobe = () => {
          if (spinEnabled && !userInteracting) {
            const center = map.getCenter();
            center.lng += 0.4; // Spin eastward from Europe to Asia (positive = east)
            map.easeTo({
              center,
              duration: 100,
              easing: (n) => n,
            });
          }
          requestAnimationFrame(spinGlobe);
        };

        spinGlobe();
      }

      // Group dancers by city
      const dancersByCity = new Map<string, Dancer[]>();
      
      dancers.forEach((dancer) => {
        if (dancer.city?.coordinates?.lat && dancer.city?.coordinates?.lng) {
          const cityId = dancer.city._id;
          if (!dancersByCity.has(cityId)) {
            dancersByCity.set(cityId, []);
          }
          dancersByCity.get(cityId)!.push(dancer);
        }
      });

      // Create markers for each city
      dancersByCity.forEach((cityDancers, cityId) => {
        const firstDancer = cityDancers[0];
        const { lat, lng } = firstDancer.city.coordinates!;

        // Create a custom marker element
        const el = document.createElement('div');
        el.className = 'dancer-marker';
        el.style.cursor = 'pointer';

        // Create inner wrapper for hover effect
        const innerWrapper = document.createElement('div');
        innerWrapper.className = 'dancer-marker-inner';
        innerWrapper.style.width = '60px';
        innerWrapper.style.height = '60px';
        innerWrapper.style.position = 'relative';
        innerWrapper.style.transition = 'transform 0.3s ease';

        // Show first dancer's avatar or stacked avatars
        if (cityDancers.length === 1) {
          const img = document.createElement('img');
          const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(firstDancer.name)}&background=random`;
          img.src = firstDancer.image || fallbackUrl;
          // Don't set crossOrigin for Google images (lh3.googleusercontent.com) - they block CORS
          if (firstDancer.image && !firstDancer.image.includes('googleusercontent.com')) {
            img.crossOrigin = 'anonymous';
          }
          img.style.width = '50px';
          img.style.height = '50px';
          img.style.borderRadius = '50%';
          img.style.border = '3px solid #fff';
          img.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
          img.style.backgroundColor = '#fff';
          img.style.display = 'block';
          img.onerror = () => {
            img.src = fallbackUrl;
          };
          innerWrapper.appendChild(img);
        } else {
          // Show stacked avatars for multiple dancers
          cityDancers.slice(0, 3).forEach((dancer, index) => {
            const img = document.createElement('img');
            const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(dancer.name)}&background=random`;
            img.src = dancer.image || fallbackUrl;
            // Don't set crossOrigin for Google images
            if (dancer.image && !dancer.image.includes('googleusercontent.com')) {
              img.crossOrigin = 'anonymous';
            }
            img.style.width = '40px';
            img.style.height = '40px';
            img.style.borderRadius = '50%';
            img.style.border = '2px solid #fff';
            img.style.position = 'absolute';
            img.style.left = `${index * 15}px`;
            img.style.top = `${index * 5}px`;
            img.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)';
            img.style.backgroundColor = '#fff';
            img.onerror = () => {
              img.src = fallbackUrl;
            };
            innerWrapper.appendChild(img);
          });

          // Add count badge if more than 3 dancers
          if (cityDancers.length > 3) {
            const badge = document.createElement('div');
            badge.textContent = `+${cityDancers.length - 3}`;
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

        // Hover effect
        el.addEventListener('mouseenter', () => {
          innerWrapper.style.transform = 'scale(1.15)';
        });
        el.addEventListener('mouseleave', () => {
          innerWrapper.style.transform = 'scale(1)';
        });

        // Create popup content
        const popupContent = document.createElement('div');
        popupContent.style.minWidth = '240px';
        popupContent.style.fontFamily = 'system-ui, -apple-system, sans-serif';
        
        const cityTitle = document.createElement('div');
        cityTitle.innerHTML = `<strong style="font-size: 16px; color: #1a1a1a;">📍 ${firstDancer.city.name}</strong>`;
        cityTitle.style.marginBottom = '12px';
        cityTitle.style.paddingBottom = '12px';
        cityTitle.style.borderBottom = '2px solid #e5e7eb';
        cityTitle.style.cursor = 'pointer';
        cityTitle.style.transition = 'color 0.2s ease';
        
        // Make city name clickable
        cityTitle.addEventListener('mouseenter', () => {
          cityTitle.style.color = '#667eea';
        });
        cityTitle.addEventListener('mouseleave', () => {
          cityTitle.style.color = 'inherit';
        });
        cityTitle.addEventListener('click', () => {
          window.location.href = `/city/${cityId}`;
        });
        
        popupContent.appendChild(cityTitle);

        // Add dancers count
        const countBadge = document.createElement('div');
        countBadge.textContent = `${cityDancers.length} ${cityDancers.length === 1 ? 'dancer' : 'dancers'} here`;
        countBadge.style.fontSize = '12px';
        countBadge.style.color = '#6b7280';
        countBadge.style.marginBottom = '10px';
        popupContent.appendChild(countBadge);

        // Add dancers list (show up to 5)
        const dancersList = document.createElement('div');
        dancersList.style.maxHeight = '280px';
        dancersList.style.overflowY = 'auto';
        dancersList.style.overflowX = 'hidden';
        
        cityDancers.slice(0, 5).forEach((dancer) => {
          const dancerDiv = document.createElement('div');
          dancerDiv.style.display = 'flex';
          dancerDiv.style.alignItems = 'center';
          dancerDiv.style.gap = '12px';
          dancerDiv.style.padding = '10px';
          dancerDiv.style.cursor = 'pointer';
          dancerDiv.style.transition = 'all 0.2s ease';
          dancerDiv.style.borderRadius = '8px';
          dancerDiv.style.marginBottom = '4px';
          
          dancerDiv.addEventListener('mouseenter', () => {
            dancerDiv.style.backgroundColor = '#f3f4f6';
            dancerDiv.style.transform = 'translateX(2px)';
          });
          dancerDiv.addEventListener('mouseleave', () => {
            dancerDiv.style.backgroundColor = 'transparent';
            dancerDiv.style.transform = 'translateX(0)';
          });
          
          const dancerImg = document.createElement('img');
          const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(dancer.name)}&background=random`;
          dancerImg.src = dancer.image || fallbackUrl;
          // Don't set crossOrigin for Google images (lh3.googleusercontent.com)
          if (dancer.image && !dancer.image.includes('googleusercontent.com')) {
            dancerImg.crossOrigin = 'anonymous';
          }
          dancerImg.style.width = '40px';
          dancerImg.style.height = '40px';
          dancerImg.style.borderRadius = '50%';
          dancerImg.style.border = '2px solid #e5e7eb';
          dancerImg.style.flexShrink = '0';
          dancerImg.onerror = () => {
            dancerImg.src = fallbackUrl;
          };
          
          const dancerInfo = document.createElement('div');
          dancerInfo.style.flex = '1';
          dancerInfo.style.minWidth = '0';
          dancerInfo.innerHTML = `
            <div style="font-weight: 600; font-size: 14px; color: #1a1a1a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${dancer.name}</div>
            ${dancer.username ? `<div style="font-size: 12px; color: #6b7280; margin-top: 2px;">@${dancer.username}</div>` : ''}
          `;
          
          const viewIcon = document.createElement('div');
          viewIcon.innerHTML = '→';
          viewIcon.style.fontSize = '18px';
          viewIcon.style.color = '#9ca3af';
          viewIcon.style.transition = 'transform 0.2s ease';
          
          dancerDiv.addEventListener('mouseenter', () => {
            viewIcon.style.transform = 'translateX(4px)';
          });
          dancerDiv.addEventListener('mouseleave', () => {
            viewIcon.style.transform = 'translateX(0)';
          });
          
          dancerDiv.appendChild(dancerImg);
          dancerDiv.appendChild(dancerInfo);
          dancerDiv.appendChild(viewIcon);
          
          // Click to view profile
          dancerDiv.addEventListener('click', () => {
            window.location.href = `/${dancer.username || `dancer/${dancer._id}`}`;
          });
          
          dancersList.appendChild(dancerDiv);
        });

        // Show "View all" link if more than 5 dancers
        if (cityDancers.length > 5) {
          const viewAllDiv = document.createElement('div');
          viewAllDiv.textContent = `View all ${cityDancers.length} dancers →`;
          viewAllDiv.style.padding = '10px';
          viewAllDiv.style.textAlign = 'center';
          viewAllDiv.style.color = '#667eea';
          viewAllDiv.style.fontWeight = '600';
          viewAllDiv.style.fontSize = '14px';
          viewAllDiv.style.cursor = 'pointer';
          viewAllDiv.style.borderTop = '1px solid #e5e7eb';
          viewAllDiv.style.marginTop = '8px';
          
          viewAllDiv.addEventListener('mouseenter', () => {
            viewAllDiv.style.textDecoration = 'underline';
          });
          viewAllDiv.addEventListener('mouseleave', () => {
            viewAllDiv.style.textDecoration = 'none';
          });
          
          viewAllDiv.addEventListener('click', () => {
            window.location.href = `/city/${cityId}`;
          });
          
          dancersList.appendChild(viewAllDiv);
        }
        
        popupContent.appendChild(dancersList);

        // Create popup
        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: true,
          closeOnClick: false,
          maxWidth: '320px',
          className: 'custom-popup',
        }).setDOMContent(popupContent);

        // Handle popup open
        el.addEventListener('click', () => {
          if (activePopupRef.current && activePopupRef.current.isOpen()) {
            activePopupRef.current.remove();
          }
          activePopupRef.current = popup;
        });

        // Create marker
        const marker = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(map);

        markersRef.current.push(marker);
      });
    });

    // Cleanup
    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      if (hintTimeoutRef.current) {
        clearTimeout(hintTimeoutRef.current);
      }
      mapRef.current?.remove();
    };
  }, [dancers, mapboxToken, isMobile, isFullscreen]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Filter dancers with valid coordinates
  const dancersWithCoordinates = dancers.filter(
    d => d.city?.coordinates?.lat && d.city?.coordinates?.lng
  );

  const hasNoDancers = dancers.length === 0;

  return (
    <>
      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
          {/* Fullscreen Header */}
          <div className="flex items-center justify-between p-4 bg-base-100/10 backdrop-blur-sm">
            <h3 className="text-white text-lg font-semibold">Explore Dancers Worldwide</h3>
            <button
              onClick={toggleFullscreen}
              className="btn btn-sm btn-circle btn-ghost text-white hover:bg-white/20"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
          
          {/* Fullscreen Map Container */}
          <div className="flex-1 relative">
            <div
              ref={mapContainerRef}
              className="w-full h-full"
            />
          </div>
        </div>
      )}

      {/* Normal Map Container */}
      {!isFullscreen && (
        <div className="relative w-full">
          <div
            ref={mapContainerRef}
            className="w-full md:rounded-lg overflow-hidden shadow-2xl"
            style={{ height: '600px' }}
          />
      
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-base-200 md:rounded-lg">
          <div className="text-center">
            <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
            <p className="text-base-content/70">Loading map...</p>
          </div>
        </div>
      )}

      {/* Empty State Overlay */}
      {hasNoDancers && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm md:rounded-lg">
          <div className="text-center max-w-md px-6 py-8 bg-base-100 rounded-2xl shadow-2xl mx-4">
            <div className="text-6xl mb-4">🌍</div>
            <h3 className="text-2xl font-bold mb-2 text-base-content">
              No Dancers Yet
            </h3>
            <p className="text-base-content/70">
              Dancers will appear on the map as they join the community!
            </p>
          </div>
        </div>
      )}

          {/* Desktop Scroll Hint Overlay */}
          {!isMobile && showScrollHint && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="bg-black/80 text-white px-6 py-3 rounded-lg shadow-2xl animate-fade-in">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span>⌨️</span>
                  <span>Use <kbd className="kbd kbd-sm">Ctrl</kbd> + scroll to zoom the map</span>
                </div>
              </div>
            </div>
          )}

          {/* Expand Button */}
          <button
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 btn btn-sm btn-circle bg-base-100/90 hover:bg-base-100 backdrop-blur-sm shadow-lg border-0 z-10"
            title="View fullscreen"
          >
            <FaExpand className="w-4 h-4" />
          </button>

          {/* Map Legend */}
          {dancersWithCoordinates.length > 0 && (
            <div className="absolute bottom-4 left-4 bg-base-100/90 backdrop-blur-sm rounded-lg p-3 shadow-lg text-xs md:text-sm">
              <div className="text-xs space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-purple-700"></div>
                  <span className="text-base-content/80">
                    {hideDancerCount 
                      ? `${new Set(dancersWithCoordinates.map(d => d.city._id)).size} ${new Set(dancersWithCoordinates.map(d => d.city._id)).size !== 1 ? 'cities' : 'city'}`
                      : `${dancersWithCoordinates.length} dancer${dancersWithCoordinates.length !== 1 ? 's' : ''} in ${new Set(dancersWithCoordinates.map(d => d.city._id)).size} ${new Set(dancersWithCoordinates.map(d => d.city._id)).size !== 1 ? 'cities' : 'city'}`
                    }
                  </span>
                </div>
                <div className="text-base-content/60 text-xs">
                  {autoSpin && isMobile ? 'Pinch to zoom • Globe spins automatically' : 
                   !isMobile ? (
                    <>Click markers • <kbd className="kbd kbd-xs">Ctrl</kbd> + scroll to zoom</>
                  ) : 'Drag to explore • Pinch to zoom'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

