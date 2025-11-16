"use client";

import Image from "next/image";
import ButtonSignin from "./ButtonSignin";
import { CONTACT } from "@/constants/contact";
import { useEffect, useRef } from "react";
import { useTranslation } from "./I18nProvider";

interface HeroProps {
  featuredUsers?: Array<{
    _id: string;
    image?: string;
    name?: string;
  }>;
  totalDancers?: number;
}

const Hero = ({ featuredUsers = [] }: HeroProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      // Set attributes to ensure autoplay
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.muted = true;
      
      // Try to play immediately
      const playPromise = video.play();
      
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.log("Video autoplay prevented:", error);
          // Auto-play on first user interaction
          const playOnInteraction = () => {
            video.play();
            document.removeEventListener('touchstart', playOnInteraction, { capture: true });
            document.removeEventListener('click', playOnInteraction, { capture: true });
            document.removeEventListener('scroll', playOnInteraction, { capture: true });
          };
          document.addEventListener('touchstart', playOnInteraction, { capture: true });
          document.addEventListener('click', playOnInteraction, { capture: true });
          document.addEventListener('scroll', playOnInteraction, { capture: true });
        });
      }
    }
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden text-white">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/75 to-black/85 z-10"></div>
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          controls={false}
          disablePictureInPicture
          className="absolute inset-0 w-full h-full object-cover [&::-webkit-media-controls]:hidden [&::-webkit-media-controls-enclosure]:hidden"
          style={{ pointerEvents: 'none' }}
        >
          <source 
            src="https://res.cloudinary.com/daenzc7ix/video/upload/q_auto,f_auto/v1760362543/Ya_esta%CC%81_aqui%CC%81_nuestro_nuevo_tema_Bachata_Bolero_Es_un_honor_tener_a_los_increi%CC%81bles_ata_t1kkhl.mp4" 
            type="video/mp4" 
          />
        </video>
      </div>

      {/* Content */}
      <div className="relative z-20 max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 text-center">
        {/* Main Heading */}
        <h1 className="text-[32px] sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-5 sm:mb-6 mt-4 sm:mt-6 leading-tight">
          💃 {t('hero.title')}
        </h1>
        
        <p className="text-[15px] sm:text-xl md:text-2xl mb-6 sm:mb-8 text-white/95 max-w-3xl mx-auto leading-relaxed px-2">
          {t('hero.subtitle')}
        </p>

        {/* Testimonials Avatars with Stars */}
        {featuredUsers.length > 0 && (
          <div className="flex flex-col md:flex-row justify-center items-center md:items-center gap-3 mb-5 sm:mb-7">
            {/* AVATARS */}
            <div className="-space-x-3 sm:-space-x-4 flex justify-center">
              {featuredUsers.slice(0, 8).map((user) => (
                <div
                  key={user._id}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 border-white overflow-hidden bg-base-200"
                  title={user.name}
                >
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name || 'Dancer'}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/50 flex items-center justify-center text-white font-bold text-sm">
                      {user.name?.charAt(0) || 'D'}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* RATING */}
            <div className="flex flex-col justify-center items-center md:items-start gap-1">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400"
                    key={i}
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
                      clipRule="evenodd"
                    />
                  </svg>
                ))}
              </div>

              {/* <div className="text-sm sm:text-base text-white font-semibold">
                {t('hero.globalDanceCommunity')}
              </div> */}
            </div>
          </div>
        )}

        {/* Key Features */}
        <div className="space-y-3 sm:space-y-4 mb-7 sm:mb-9 text-left md:text-center max-w-2xl mx-auto">
          <div className="flex items-start md:items-center gap-2 text-[15px] sm:text-lg md:text-xl">
            <span className="text-2xl sm:text-3xl flex-shrink-0">✨</span>
            <span className="leading-snug"><strong>{t('hero.feature1')}</strong> {t('hero.feature1b')}</span>
          </div>
          <div className="flex items-start md:items-center gap-2 text-[15px] sm:text-lg md:text-xl">
            <span className="text-2xl sm:text-3xl flex-shrink-0">🌍</span>
            <span className="leading-snug"><strong>{t('hero.feature2')}</strong> {t('hero.feature2b')}</span>
          </div>
          <div className="flex items-start md:items-center gap-2 text-[15px] sm:text-lg md:text-xl">
            <span className="text-2xl sm:text-3xl flex-shrink-0">👯</span>
            <span className="leading-snug"><strong>{t('hero.feature3')}</strong></span>
          </div>
          <div className="flex items-start md:items-center gap-2 text-[15px] sm:text-lg md:text-xl">
            <span className="text-2xl sm:text-3xl flex-shrink-0">🔥</span>
            <span className="leading-snug"><strong>{t('hero.feature4')}</strong></span>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3 sm:gap-4">
          <ButtonSignin
            text={t('hero.ctaButton')}
            extraStyle="btn-primary btn-lg text-base sm:text-lg px-8 sm:px-12"
          />
          <p className="text-sm sm:text-base text-white/80">
            {t('hero.alreadyMember')}
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="flex flex-col items-center gap-1 mt-8 sm:mt-10 md:mt-12 animate-bounce pb-2">
          <span className="text-sm sm:text-base text-white font-medium">{t('hero.exploreMore')}</span>
          <svg 
            className="w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow-lg" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            strokeWidth={3}
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M19 14l-7 7m0 0l-7-7m7 7V3" 
            />
          </svg>
        </div>
      </div>
    </section>
  );
};

export default Hero;
