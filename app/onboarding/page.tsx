"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import apiClient from "@/libs/api";
import { User, DanceStyle, City, UserDanceStyle } from "@/types";
import { DANCE_LEVELS } from "@/constants/dance-levels";
import { COUNTRIES } from "@/constants/countries";
import { validateUsername, generateSuggestions } from "@/utils/username";
import CitySelector from "@/components/CitySelector";
import ImageCropPicker from "@/components/ImageCropPicker";
import CurrentLocationPicker from "@/components/CurrentLocationPicker";
import { event as fbEvent } from "@/components/FacebookPixel";
import SupportButton from "@/components/SupportButton";
import { useTranslation } from "@/components/I18nProvider";
import { upload } from "@imagekit/next";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export default function Onboarding() {
  const { t } = useTranslation();
  const { update } = useSession();
  const searchParams = useSearchParams();

  // Check if we're in edit mode
  const isEditMode = searchParams.get("mode") === "edit";
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [user, setUser] = useState<User>(null);
  const [danceStylesOptions, setDanceStylesOptions] = useState<DanceStyle[]>(
    []
  );

  // Form states
  const [danceStyles, setDanceStyles] = useState<UserDanceStyle[]>([]);
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<{
    checking: boolean;
    available: boolean | null;
    error: string;
    suggestions: string[];
  }>({
    checking: false,
    available: null,
    error: "",
    suggestions: [],
  });
  const usernameTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [savingStep, setSavingStep] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [dancingStartYear, setDancingStartYear] = useState("");
  const [currentLocation, setCurrentLocation] = useState<City | null>(null);
  const [citiesVisited, setCitiesVisited] = useState<City[]>([]);
  const [anthem, setAnthem] = useState({
    url: "",
    platform: "spotify" as "spotify" | "youtube",
    title: "",
    artist: "",
  });
  const [socialMedia, setSocialMedia] = useState({
    instagram: "",
    tiktok: "",
    youtube: "",
    spotify: "",
  });
  const [danceRole, setDanceRole] = useState<"follower" | "leader" | "both">(
    "both"
  );
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");
  const [nationality, setNationality] = useState("");
  const [relationshipStatus, setRelationshipStatus] = useState<
    | "single"
    | "in_a_relationship"
    | "married"
    | "its_complicated"
    | "prefer_not_to_say"
    | ""
  >("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [hideAge, setHideAge] = useState(false);
  const [bio, setBio] = useState("");
  const [isTeacher, setIsTeacher] = useState(false);
  const [isDJ, setIsDJ] = useState(false);
  const [isPhotographer, setIsPhotographer] = useState(false);
  const [isEventOrganizer, setIsEventOrganizer] = useState(false);
  const [isProducer, setIsProducer] = useState(false);
  const [teacherBio, setTeacherBio] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [djName, setDjName] = useState("");
  const [djGenres, setDjGenres] = useState("");
  const [djBio, setDjBio] = useState("");
  const [photographerPortfolio, setPhotographerPortfolio] = useState("");
  const [photographerSpecialties, setPhotographerSpecialties] = useState("");
  const [photographerBio, setPhotographerBio] = useState("");
  const [eventOrganizerName, setEventOrganizerName] = useState("");
  const [eventTypes, setEventTypes] = useState("");
  const [eventOrganizerBio, setEventOrganizerBio] = useState("");
  const [producerName, setProducerName] = useState("");
  const [producerGenres, setProducerGenres] = useState("");
  const [producerBio, setProducerBio] = useState("");
  const [professionalContact, setProfessionalContact] = useState({
    whatsapp: "",
    email: "",
  });
  const [userType, setUserType] = useState<"dancer" | "professional" | "">("");
  const [skipDanceSections, setSkipDanceSections] = useState(false);

  const steps: OnboardingStep[] = [
    {
      id: "userType",
      title: t("onboarding.userTypeTitle"),
      description: t("onboarding.userTypeDesc"),
      completed: user?.userType ? true : false,
    },
    {
      id: "nameDetails",
      title: t("onboarding.nameTitle"),
      description: t("onboarding.nameDesc"),
      completed: user?.onboardingSteps?.nameDetails || false,
    },
    {
      id: "username",
      title: t("onboarding.usernameTitle"),
      description: t("onboarding.usernameDesc"),
      completed: user?.onboardingSteps?.username || false,
    },
    {
      id: "profilePic",
      title: t("onboarding.profilePicTitle"),
      description: t("onboarding.profilePicDesc"),
      completed: user?.onboardingSteps?.profilePic || false,
    },
    {
      id: "dateOfBirth",
      title: t("onboarding.birthdayTitle"),
      description: t("onboarding.birthdayDesc"),
      completed: user?.onboardingSteps?.dateOfBirth || false,
    },
    {
      id: "bio",
      title: t("onboarding.bioTitle"),
      description: t("onboarding.bioDesc"),
      completed: user?.onboardingSteps?.bio || false,
    },
    {
      id: "gender",
      title: t("onboarding.genderTitle"),
      description: t("onboarding.genderDesc"),
      completed: user?.onboardingSteps?.gender || false,
    },
    {
      id: "nationality",
      title: t("onboarding.nationalityTitle"),
      description: t("onboarding.nationalityDesc"),
      completed: user?.onboardingSteps?.nationality || false,
    },
    {
      id: "relationshipStatus",
      title: t("onboarding.relationshipTitle"),
      description: t("onboarding.relationshipDesc"),
      completed: user?.onboardingSteps?.relationshipStatus || false,
    },
    {
      id: "dancingStartYear",
      title: t("onboarding.dancingStartTitle"),
      description: t("onboarding.dancingStartDesc"),
      completed: user?.onboardingSteps?.dancingStartYear || false,
    },
    {
      id: "danceStyles",
      title: t("onboarding.danceStylesTitle"),
      description: t("onboarding.danceStylesDesc"),
      completed: user?.onboardingSteps?.danceStyles || false,
    },
    {
      id: "danceRole",
      title: t("onboarding.danceRoleTitle"),
      description: t("onboarding.danceRoleDesc"),
      completed: user?.onboardingSteps?.danceRole || false,
    },
    {
      id: "currentLocation",
      title: t("onboarding.locationTitle"),
      description: t("onboarding.locationDesc"),
      completed: user?.onboardingSteps?.currentLocation || false,
    },
    {
      id: "citiesVisited",
      title: t("onboarding.citiesVisitedTitle"),
      description: t("onboarding.citiesVisitedDesc"),
      completed: user?.onboardingSteps?.citiesVisited || false,
    },
    {
      id: "anthem",
      title: t("onboarding.anthemTitle"),
      description: t("onboarding.anthemDesc"),
      completed: user?.onboardingSteps?.anthem || false,
    },
    {
      id: "socialMedia",
      title: t("onboarding.socialMediaTitle"),
      description: t("onboarding.socialMediaDesc"),
      completed: user?.onboardingSteps?.socialMedia || false,
    },
    {
      id: "teacherInfo",
      title: t("onboarding.professionalTitle"),
      description: t("onboarding.professionalDesc"),
      completed: user?.onboardingSteps?.teacherInfo || false,
    },
  ];

  // Filter out dance-specific steps if user is not a dancer
  const filteredSteps = skipDanceSections
    ? steps.filter(
        (step) =>
          step.id !== "dancingStartYear" &&
          step.id !== "danceStyles" &&
          step.id !== "danceRole" &&
          step.id !== "citiesVisited"
      )
    : steps;

  // Username validation and checking

  const checkUsernameAvailability = async (value: string) => {
    const validationError = validateUsername(value);
    if (validationError) {
      setUsernameStatus({
        checking: false,
        available: false,
        error: validationError,
        suggestions: generateSuggestions(user?.name || ""),
      });
      return;
    }

    setUsernameStatus((prev) => ({ ...prev, checking: true, error: "" }));

    try {
      const response = await fetch("/api/user/check-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: value }),
      });

      const data = await response.json();

      setUsernameStatus({
        checking: false,
        available: data.available,
        error: data.available ? "" : "Username is already taken",
        suggestions: data.available
          ? []
          : generateSuggestions(user?.name || ""),
      });
    } catch (error) {
      setUsernameStatus({
        checking: false,
        available: false,
        error: "Error checking username availability",
        suggestions: generateSuggestions(user?.name || ""),
      });
    }
  };

  const handleUsernameChange = (value: string) => {
    const cleanValue = value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsername(cleanValue);

    // Clear previous timeout
    if (usernameTimeoutRef.current) {
      clearTimeout(usernameTimeoutRef.current);
    }

    // Debounce the availability check
    usernameTimeoutRef.current = setTimeout(() => {
      if (cleanValue) {
        checkUsernameAvailability(cleanValue);
      } else {
        setUsernameStatus({
          checking: false,
          available: null,
          error: "",
          suggestions: [],
        });
      }
    }, 500);
  };

  const fetchUserProfile = async () => {
    try {
      const data = (await apiClient.get("/user/profile")) as { user: User };
      const userData = data.user;
      setUser(userData);

      // Redirect completed users to dashboard (unless in edit mode)
      if (userData.isProfileComplete && !isEditMode) {
        console.log("🚀 Redirecting to dashboard...");
        window.location.href = "/dashboard";
        return;
      }

      // Pre-fill form with existing data
      if (userData.danceStyles?.length > 0) {
        // Normalize dance styles to ensure danceStyle field contains ID, not populated object
        const normalizedDanceStyles = userData.danceStyles.map(
          (userStyle: any) => ({
            danceStyle:
              typeof userStyle.danceStyle === "string"
                ? userStyle.danceStyle
                : userStyle.danceStyle?._id || userStyle.danceStyle?.id,
            level: userStyle.level,
          })
        );
        setDanceStyles(normalizedDanceStyles);
      } else if (
        userData.danceStyles?.length === 0 &&
        (userData.isDJ ||
          userData.isPhotographer ||
          userData.isEventOrganizer ||
          userData.isProducer)
      ) {
        // User has explicitly chosen to skip dance sections
        setSkipDanceSections(true);
      }

      // Load userType
      if (userData.userType) {
        setUserType(userData.userType);
        if (userData.userType === "professional") {
          setSkipDanceSections(true);
        }
      }
      if (userData.username) {
        setUsername(userData.username);
        setUsernameStatus({
          checking: false,
          available: true,
          error: "",
          suggestions: [],
        });
      }
      if (userData.dateOfBirth) {
        setDateOfBirth(
          new Date(userData.dateOfBirth).toISOString().split("T")[0]
        );
      }
      if (userData.hideAge !== undefined) {
        setHideAge(userData.hideAge);
      }
      if (userData.bio) {
        setBio(userData.bio);
      }
      if (userData.dancingStartYear) {
        setDancingStartYear(userData.dancingStartYear.toString());
      }
      // Handle current location - ensure it's a valid city object
      if (
        userData.city &&
        typeof userData.city === "object" &&
        (userData.city._id || (userData.city as any).id)
      ) {
        setCurrentLocation(userData.city as City);
      }

      // Handle cities visited - filter out null/invalid entries
      if (userData.citiesVisited?.length > 0) {
        const validCities = userData.citiesVisited.filter(
          (city): city is City =>
            city !== null &&
            typeof city === "object" &&
            !!(city._id || (city as any).id) &&
            !!city.name
        );
        setCitiesVisited(validCities);
      }
      if (userData.anthem) {
        setAnthem({
          url: userData.anthem.url,
          platform: userData.anthem.platform,
          title: userData.anthem.title || "",
          artist: userData.anthem.artist || "",
        });
      }
      if (userData.socialMedia) {
        setSocialMedia({
          instagram: userData.socialMedia.instagram || "",
          tiktok: userData.socialMedia.tiktok || "",
          youtube: userData.socialMedia.youtube || "",
          spotify: userData.socialMedia.spotify || "",
        });
      }
      if (userData.danceRole) {
        setDanceRole(userData.danceRole);
      }
      if (userData.gender) {
        setGender(userData.gender);
      }
      if (userData.nationality) {
        setNationality(userData.nationality);
      }
      if (userData.relationshipStatus) {
        setRelationshipStatus(userData.relationshipStatus);
      }
      if (userData.firstName) {
        setFirstName(userData.firstName);
      }
      if (userData.lastName) {
        setLastName(userData.lastName);
      }
      if (userData.isTeacher) {
        setIsTeacher(userData.isTeacher);
        if (userData.teacherProfile) {
          setTeacherBio(userData.teacherProfile.bio || "");
          setYearsOfExperience(
            userData.teacherProfile.yearsOfExperience?.toString() || ""
          );
        }
      }
      if (userData.isDJ) {
        setIsDJ(userData.isDJ);
        if (userData.djProfile) {
          setDjName(userData.djProfile.djName || "");
          setDjGenres(userData.djProfile.genres || "");
          setDjBio(userData.djProfile.bio || "");
        }
      }
      if (userData.isPhotographer) {
        setIsPhotographer(userData.isPhotographer);
        if (userData.photographerProfile) {
          setPhotographerPortfolio(
            userData.photographerProfile.portfolioLink || ""
          );
          setPhotographerSpecialties(
            userData.photographerProfile.specialties || ""
          );
          setPhotographerBio(userData.photographerProfile.bio || "");
        }
      }
      if (userData.isEventOrganizer) {
        setIsEventOrganizer(userData.isEventOrganizer);
        if (userData.eventOrganizerProfile) {
          setEventOrganizerName(
            userData.eventOrganizerProfile.organizationName || ""
          );
          setEventTypes(userData.eventOrganizerProfile.eventTypes || "");
          setEventOrganizerBio(userData.eventOrganizerProfile.bio || "");
        }
      }
      if (userData.isProducer) {
        setIsProducer(userData.isProducer);
        if (userData.producerProfile) {
          setProducerName(userData.producerProfile.producerName || "");
          setProducerGenres(userData.producerProfile.genres || "");
          setProducerBio(userData.producerProfile.bio || "");
        }
      }
      if (userData.professionalContact) {
        setProfessionalContact({
          whatsapp: userData.professionalContact.whatsapp || "",
          email: userData.professionalContact.email || "",
        });
      }

      // Find the current step based on completion
      if (isEditMode) {
        // In edit mode, always start from the first step
        setCurrentStep(0);
      } else {
        // In onboarding mode, find the first incomplete step
        try {
          const incompleteStepIndex = steps.findIndex(
            (step) =>
              !userData.onboardingSteps?.[
                step.id as keyof typeof userData.onboardingSteps
              ]
          );
          setCurrentStep(
            incompleteStepIndex !== -1
              ? incompleteStepIndex
              : filteredSteps.length - 1
          );
        } catch (stepError) {
          console.error("Error finding current step:", stepError);
          // Default to first step if there's an error
          setCurrentStep(0);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setLoading(false);
    }
  };

  const fetchDanceStyles = async () => {
    try {
      const data = (await apiClient.get("/dance-styles")) as {
        danceStyles: DanceStyle[];
      };
      setDanceStylesOptions(data.danceStyles);
    } catch (error) {
      console.error("Error fetching dance styles:", error);
    }
  };

  const handleNext = async () => {
    const step = filteredSteps[currentStep];

    // Note: Dance-related steps are now filtered out when skipDanceSections is true

    let stepData: any = {};

    switch (step.id) {
      case "userType":
        if (!userType) {
          alert("Please select an option");
          return;
        }
        // Set skipDanceSections based on userType
        setSkipDanceSections(userType === "professional");
        stepData = { userType };
        break;
      case "nameDetails":
        if (!firstName.trim()) {
          alert("Please enter your first name");
          return;
        }
        if (!lastName.trim()) {
          alert("Please enter your last name");
          return;
        }
        stepData = { firstName: firstName.trim(), lastName: lastName.trim() };
        break;
      case "danceStyles":
        if (danceStyles.length === 0) {
          alert("Please select at least one dance style");
          return;
        }
        stepData = { danceStyles };
        break;
      case "username":
        if (!username) {
          alert("Please choose a username");
          return;
        }
        if (!usernameStatus.available) {
          alert("Please choose an available username");
          return;
        }
        stepData = { username };
        break;
      case "profilePic":
        // Profile pic is optional, but if they selected one, upload it
        if (profilePic) {
          try {
            const imageUrl = await uploadProfilePic(profilePic);
            stepData = { image: imageUrl };
          } catch (error) {
            console.error("Error uploading profile pic:", error);
            alert("Error uploading your profile picture. Please try again.");
            return;
          }
        } else {
          // No photo selected, that's okay - just continue
          stepData = { image: user?.image || null };
        }
        break;
      case "dateOfBirth":
        if (!dateOfBirth) {
          alert("Please enter your date of birth");
          return;
        }
        stepData = { dateOfBirth, hideAge };
        break;
      case "bio":
        // Bio is optional, no validation needed
        stepData = { bio };
        break;
      case "dancingStartYear": {
        if (!dancingStartYear) {
          alert("Please enter the year you started dancing");
          return;
        }
        const yearNum = parseInt(dancingStartYear);
        const currentYear = new Date().getFullYear();
        if (yearNum < 1900 || yearNum > currentYear) {
          alert(`Please enter a valid year between 1900 and ${currentYear}`);
          return;
        }
        stepData = { dancingStartYear: yearNum };
        break;
      }
      case "currentLocation": {
        if (!currentLocation) {
          alert("Please select your current city");
          return;
        }
        // Handle both populated objects and ID strings
        const cityId =
          typeof currentLocation === "string"
            ? currentLocation
            : currentLocation._id || (currentLocation as any).id;
        stepData = { city: cityId };
        break;
      }
      case "citiesVisited": {
        // Handle both populated objects and ID strings
        const cityIds = citiesVisited.map((city) =>
          typeof city === "string" ? city : city._id || (city as any).id
        );
        stepData = { citiesVisited: cityIds };
        break;
      }
      case "anthem": {
        // Anthem is now optional - only validate if URL is provided
        if (anthem.url) {
          const parsedMedia = parseMediaUrl(anthem.url);
          if (!parsedMedia) {
            alert("Please enter a valid Spotify URL");
            return;
          }
          stepData = { anthem };
        } else {
          stepData = { anthem: null };
        }
        break;
      }
      case "socialMedia":
        stepData = { socialMedia };
        break;
      case "danceRole":
        stepData = { danceRole };
        break;
      case "gender":
        if (!gender) {
          alert("Please select your gender");
          return;
        }
        stepData = { gender };
        break;
      case "nationality":
        if (!nationality) {
          alert("Please select your nationality");
          return;
        }
        stepData = { nationality };
        break;
      case "relationshipStatus":
        // Relationship status is optional
        stepData = { relationshipStatus: relationshipStatus || undefined };
        break;
      case "teacherInfo": {
        // Validate at least one contact method if any professional role is selected
        const hasAnyProfessionalRole =
          isTeacher || isDJ || isPhotographer || isEventOrganizer || isProducer;
        if (
          hasAnyProfessionalRole &&
          !professionalContact.whatsapp &&
          !professionalContact.email
        ) {
          alert(
            "Please provide at least one contact method (WhatsApp or Email)"
          );
          return;
        }
        stepData = {
          isTeacher,
          isDJ,
          isPhotographer,
          isEventOrganizer,
          isProducer,
          teacherProfile: isTeacher
            ? {
                bio: teacherBio,
                yearsOfExperience: yearsOfExperience
                  ? parseInt(yearsOfExperience)
                  : undefined,
              }
            : undefined,
          djProfile: isDJ
            ? {
                djName: djName,
                genres: djGenres,
                bio: djBio,
              }
            : undefined,
          photographerProfile: isPhotographer
            ? {
                portfolioLink: photographerPortfolio,
                specialties: photographerSpecialties,
                bio: photographerBio,
              }
            : undefined,
          eventOrganizerProfile: isEventOrganizer
            ? {
                organizationName: eventOrganizerName,
                eventTypes: eventTypes,
                bio: eventOrganizerBio,
              }
            : undefined,
          producerProfile: isProducer
            ? {
                producerName: producerName,
                genres: producerGenres,
                bio: producerBio,
              }
            : undefined,
          professionalContact: hasAnyProfessionalRole
            ? {
                whatsapp: professionalContact.whatsapp || undefined,
                email: professionalContact.email || undefined,
              }
            : undefined,
        };
        break;
      }
      default:
        console.error("Unknown step:", step.id);
        return;
    }

    try {
      // Set saving state
      setSavingStep(true);

      // Set completing state if this is the last step
      if (currentStep === filteredSteps.length - 1) {
        setCompleting(true);
      }

      const response = await apiClient.put("/user/profile", {
        step: step.id,
        data: stepData,
      });

      // Check if profile was just completed
      if (response.data?.profileCompleted) {
        console.log(
          "🎉 Profile completed! Updating session and redirecting..."
        );

        // Track profile completion with Facebook Pixel
        fbEvent("CompleteRegistration", {
          content_name: "Profile Completed",
          status: true,
        });

        try {
          // Update the session to reflect profile completion
          const updatedSession = await update();
          console.log("✅ Session updated successfully:", updatedSession);

          // Wait a moment to ensure session is propagated
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (sessionError) {
          console.error("❌ Failed to update session:", sessionError);
        }

        // Redirect to profile with welcome modal
        window.location.href = "/profile?welcome=true";
        return;
      }

      // Move to next step or complete onboarding
      if (currentStep < filteredSteps.length - 1) {
        console.log("📍 Moving to next step:", currentStep + 1);
        setCurrentStep(currentStep + 1);
      } else {
        if (isEditMode) {
          console.log("🎉 Profile updated! Redirecting to profile...");
          window.location.href = "/profile";
        } else {
          console.log("🎉 Onboarding complete! Showing welcome modal...");
          // Track successful registration completion with Facebook Pixel
          fbEvent("CompleteRegistration", {
            content_name: "Onboarding Complete",
            status: "completed",
          });
          window.location.href = "/profile?welcome=true";
        }
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error saving your information. Please try again.");
    } finally {
      // Always reset states in finally block
      setSavingStep(false);
      setCompleting(false);
    }
  };

  // Helper functions for dance styles with levels
  const addDanceStyle = (styleId: string) => {
    const existingStyle = danceStyles.find((ds) => ds.danceStyle === styleId);
    if (!existingStyle) {
      setDanceStyles((prev) => [
        ...prev,
        { danceStyle: styleId, level: "beginner" as UserDanceStyle["level"] },
      ]);
    }
  };

  const removeDanceStyle = (styleId: string) => {
    setDanceStyles((prev) => prev.filter((ds) => ds.danceStyle !== styleId));
  };

  const updateDanceStyleLevel = (styleId: string, level: string) => {
    setDanceStyles((prev) =>
      prev.map((ds) =>
        ds.danceStyle === styleId
          ? { ...ds, level: level as UserDanceStyle["level"] }
          : ds
      )
    );
  };

  const isDanceStyleSelected = (styleId: string) => {
    return danceStyles.some((ds) => ds.danceStyle === styleId);
  };

  const getStyleNameById = (styleId: string) => {
    const style = danceStylesOptions.find((s) => (s._id || s.id) === styleId);
    return style?.name || "Unknown Style";
  };

  const uploadProfilePic = async (file: File): Promise<string> => {
    setUploadingProfilePic(true);
    try {
      // Get authentication parameters from server
      const authResponse = await fetch("/api/imagekit-auth");
      if (!authResponse.ok) {
        throw new Error("Failed to authenticate upload");
      }

      const { token, signature, expire, publicKey } = await authResponse.json();

      // Upload using ImageKit SDK
      const uploadResponse = await upload({
        file,
        fileName: `profile-${Date.now()}.${file.name.split('.').pop()}`,
        token,
        signature,
        expire,
        publicKey,
        folder: "/dancecircle/profile-pics",
        useUniqueFileName: false,
        transformation: {
          pre: "w-800,h-800,c-at_max,fo-face",
        },
      });

      return uploadResponse.url;
    } finally {
      setUploadingProfilePic(false);
    }
  };

  // Function to extract platform and IDs from URL
  const parseMediaUrl = (url: string) => {
    if (!url) return null;

    // Spotify track URL pattern
    const trackMatch = url.match(
      /(?:spotify\.com\/track\/|spotify:track:)([a-zA-Z0-9]+)/
    );
    if (trackMatch) {
      return {
        platform: "spotify" as const,
        id: trackMatch[1],
        embedUrl: `https://open.spotify.com/embed/track/${trackMatch[1]}`,
      };
    }

    // Spotify playlist URL pattern
    const playlistMatch = url.match(
      /(?:spotify\.com\/playlist\/|spotify:playlist:)([a-zA-Z0-9]+)/
    );
    if (playlistMatch) {
      return {
        platform: "spotify" as const,
        id: playlistMatch[1],
        embedUrl: `https://open.spotify.com/embed/playlist/${playlistMatch[1]}`,
      };
    }

    // Spotify album URL pattern
    const albumMatch = url.match(
      /(?:spotify\.com\/album\/|spotify:album:)([a-zA-Z0-9]+)/
    );
    if (albumMatch) {
      return {
        platform: "spotify" as const,
        id: albumMatch[1],
        embedUrl: `https://open.spotify.com/embed/album/${albumMatch[1]}`,
      };
    }

    return null;
  };

  const mediaInfo = parseMediaUrl(anthem.url);

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchDanceStyles();
  }, []);

  useEffect(() => {
    return () => {
      if (usernameTimeoutRef.current) {
        clearTimeout(usernameTimeoutRef.current);
      }
    };
  }, []);

  // Auto-add current location to visited cities when they reach that step
  useEffect(() => {
    const currentStepId = filteredSteps[currentStep]?.id;

    if (currentStepId === "citiesVisited" && currentLocation) {
      // Check if current location is already in visited cities
      const cityId = currentLocation._id || (currentLocation as any).id;
      const isAlreadyAdded = citiesVisited.some(
        (city) => (city._id || (city as any).id) === cityId
      );

      // If not already added, add it to the beginning of the array
      if (!isAlreadyAdded) {
        setCitiesVisited((prev) => [currentLocation, ...prev]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, currentLocation]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">
              {isEditMode
                ? t("onboarding.editProfile")
                : t("onboarding.completeProfile")}
            </h1>
            <span className="text-sm text-base-content/70">
              {currentStep + 1} {t("onboarding.of")} {filteredSteps.length}
            </span>
          </div>
          <progress
            className="progress progress-primary w-full"
            value={currentStep + 1}
            max={filteredSteps.length}
          ></progress>
        </div>

        {/* Step Content */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-xl mb-2">
              {filteredSteps[currentStep].title}
            </h2>
            <p className="text-base-content/70 mb-6">
              {filteredSteps[currentStep].description}
            </p>

            {/* User Type Selection */}
            {filteredSteps[currentStep].id === "userType" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {/* Option 1: I'm a Dancer */}
                  <button
                    type="button"
                    onClick={() => {
                      setUserType("dancer");
                      setSkipDanceSections(false);
                    }}
                    className={`btn btn-lg h-auto py-6 flex-col items-start text-left ${
                      userType === "dancer" ? "btn-primary" : "btn-outline"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">💃</span>
                      <span className="text-xl font-bold">
                        {t("onboarding.userTypeDancer")}
                      </span>
                    </div>
                    <span className="text-sm opacity-80 normal-case">
                      {t("onboarding.userTypeDancerDesc")}
                    </span>
                  </button>

                  {/* Option 2: Professional Only */}
                  <button
                    type="button"
                    onClick={() => {
                      setUserType("professional");
                      setSkipDanceSections(true);
                    }}
                    className={`btn btn-lg h-auto py-6 flex-col items-start text-left ${
                      userType === "professional"
                        ? "btn-primary"
                        : "btn-outline"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">🎵</span>
                      <span className="text-xl font-bold">
                        {t("onboarding.userTypeProfessional")}
                      </span>
                    </div>
                    <span className="text-sm opacity-80 normal-case">
                      {t("onboarding.userTypeProfessionalDesc")}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Name Details */}
            {filteredSteps[currentStep].id === "nameDetails" && (
              <div className="form-control space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">
                      {t("onboarding.firstName")}
                    </span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder={t("onboarding.firstNamePlaceholder")}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">
                      {t("onboarding.lastName")}
                    </span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder={t("onboarding.lastNamePlaceholder")}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Dance Styles */}
            {filteredSteps[currentStep].id === "danceStyles" && (
              <div className="form-control space-y-6">
                {/* Show dance styles only if not skipping */}
                {!skipDanceSections && (
                  <>
                    {/* Partner Dance Styles */}
                    <div>
                      <h3 className="font-semibold text-base-content mb-3">
                        {t("onboarding.partnerDances")}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {danceStylesOptions
                          .filter((style) => style.isPartnerDance)
                          .map((style) => (
                            <div
                              key={style._id}
                              className={`cursor-pointer flex-col gap-2 rounded-lg p-4 border transition-colors text-center ${
                                isDanceStyleSelected(style._id || style.id)
                                  ? "bg-primary text-primary-content border-primary shadow-lg"
                                  : "bg-base-100 border-base-300 hover:bg-base-200"
                              }`}
                              onClick={() => {
                                if (
                                  isDanceStyleSelected(style._id || style.id)
                                ) {
                                  removeDanceStyle(style._id || style.id);
                                } else {
                                  addDanceStyle(style._id || style.id);
                                }
                              }}
                            >
                              <span className="font-medium">{style.name}</span>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Solo/Non-Partner Dance Styles */}
                    <div>
                      <h3 className="font-semibold text-base-content mb-3">
                        {t("onboarding.soloDances")}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {danceStylesOptions
                          .filter((style) => !style.isPartnerDance)
                          .map((style) => (
                            <div
                              key={style._id}
                              className={`cursor-pointer flex-col gap-2 rounded-lg p-4 border transition-colors text-center ${
                                isDanceStyleSelected(style._id || style.id)
                                  ? "bg-primary text-primary-content border-primary shadow-lg"
                                  : "bg-base-100 border-base-300 hover:bg-base-200"
                              }`}
                              onClick={() => {
                                if (
                                  isDanceStyleSelected(style._id || style.id)
                                ) {
                                  removeDanceStyle(style._id || style.id);
                                } else {
                                  addDanceStyle(style._id || style.id);
                                }
                              }}
                            >
                              <span className="font-medium">{style.name}</span>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Level Selection for Selected Styles */}
                    {danceStyles.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="font-medium text-base-content">
                          {t("onboarding.setSkillLevels")}
                        </h3>
                        {danceStyles.map((userStyle) => (
                          <div
                            key={userStyle.danceStyle}
                            className="bg-base-200 rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-medium">
                                {getStyleNameById(userStyle.danceStyle)}
                              </span>
                              <button
                                type="button"
                                className="btn btn-ghost btn-xs text-error"
                                onClick={() =>
                                  removeDanceStyle(userStyle.danceStyle)
                                }
                              >
                                {t("onboarding.remove")}
                              </button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {DANCE_LEVELS.map((level) => (
                                <label
                                  key={level.value}
                                  className={`label cursor-pointer flex-col gap-1 rounded-lg p-2 border transition-colors ${
                                    userStyle.level === level.value
                                      ? "bg-primary text-primary-content border-primary"
                                      : "bg-base-100 border-base-300 hover:bg-base-200"
                                  }`}
                                >
                                  <span className="text-lg">{level.emoji}</span>
                                  <span className="text-xs text-center">
                                    {level.label}
                                  </span>
                                  <input
                                    type="radio"
                                    name={`level-${userStyle.danceStyle}`}
                                    className="radio radio-primary radio-xs"
                                    checked={userStyle.level === level.value}
                                    onChange={() =>
                                      updateDanceStyleLevel(
                                        userStyle.danceStyle,
                                        level.value
                                      )
                                    }
                                  />
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {danceStyles.length === 0 && (
                      <div className="text-center text-base-content/60 py-4">
                        Select at least one dance style to continue
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Username */}
            {filteredSteps[currentStep].id === "username" && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text">
                    {t("onboarding.usernameLabel")}
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className={`input input-bordered w-full ${
                      usernameStatus.error
                        ? "input-error"
                        : usernameStatus.available === true
                          ? "input-success"
                          : ""
                    }`}
                    placeholder={t("onboarding.usernamePlaceholder")}
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {usernameStatus.checking && (
                      <span className="loading loading-spinner loading-sm"></span>
                    )}
                    {!usernameStatus.checking &&
                      usernameStatus.available === true && (
                        <span className="text-success">✓</span>
                      )}
                    {!usernameStatus.checking &&
                      usernameStatus.available === false && (
                        <span className="text-error">✗</span>
                      )}
                  </div>
                </div>

                {/* Error message */}
                {usernameStatus.error && (
                  <div className="label">
                    <span className="label-text-alt text-error">
                      {usernameStatus.error}
                    </span>
                  </div>
                )}

                {/* Success message */}
                {usernameStatus.available === true && !usernameStatus.error && (
                  <div className="label">
                    <span className="label-text-alt text-success">
                      {t("onboarding.usernameAvailable")}
                    </span>
                  </div>
                )}

                {/* Suggestions */}
                {usernameStatus.suggestions.length > 0 && (
                  <div className="mt-3">
                    <span className="text-sm text-base-content/70">
                      {t("onboarding.suggestions")}:
                    </span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {usernameStatus.suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          className="btn btn-outline btn-sm"
                          onClick={() => {
                            setUsername(suggestion);
                            checkUsernameAvailability(suggestion);
                          }}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="label">
                  <span className="label-text-alt">
                    {t("onboarding.profileUrl")}: DanceCircle.co/
                    {username || "username"}
                  </span>
                </div>
              </div>
            )}

            {/* Profile Picture */}
            {filteredSteps[currentStep].id === "profilePic" && (
              <ImageCropPicker
                onImageSelect={setProfilePic}
                currentImage={user?.image}
                uploading={uploadingProfilePic}
              />
            )}

            {filteredSteps[currentStep].id === "dateOfBirth" && (
              <div className="form-control space-y-4">
                <div>
                  <label className="label">
                    <span className="label-text">
                      {t("onboarding.dateOfBirth")}
                    </span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={hideAge}
                      onChange={(e) => setHideAge(e.target.checked)}
                    />
                    <div>
                      <span className="label-text font-medium">
                        {t("onboarding.hideAgeLabel")}
                      </span>
                      <p className="text-sm text-base-content/60 mt-1">
                        {t("onboarding.hideAgeDesc")}
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Bio */}
            {filteredSteps[currentStep].id === "bio" && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text">{t("onboarding.bioLabel")}</span>
                  <span className="label-text-alt text-base-content/50">
                    {bio.length}/80
                  </span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-24"
                  placeholder={t("onboarding.bioPlaceholder")}
                  value={bio}
                  onChange={(e) => {
                    if (e.target.value.length <= 80) {
                      setBio(e.target.value);
                    }
                  }}
                  maxLength={80}
                />
              </div>
            )}

            {filteredSteps[currentStep].id === "dancingStartYear" && (
              <div className="form-control space-y-6">
                {/* Show form only if not skipping */}
                {!skipDanceSections && (
                  <>
                    <label className="label">
                      <span className="label-text">
                        {t("onboarding.yearStartedDancing")}
                      </span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered"
                      placeholder={`${t("onboarding.example")} ${new Date().getFullYear() - 5}`}
                      value={dancingStartYear}
                      onChange={(e) => setDancingStartYear(e.target.value)}
                      min="1900"
                      max={new Date().getFullYear()}
                    />
                    {dancingStartYear && (
                      <label className="label">
                        <span className="label-text-alt text-base-content/60">
                          {t("onboarding.yearsOfDancing").replace(
                            "{years}",
                            String(
                              new Date().getFullYear() -
                                parseInt(dancingStartYear)
                            )
                          )}{" "}
                          🎉
                        </span>
                      </label>
                    )}
                  </>
                )}
              </div>
            )}

            {filteredSteps[currentStep].id === "currentLocation" && (
              <CurrentLocationPicker
                selectedCity={currentLocation}
                onCitySelect={setCurrentLocation}
                label={t("onboarding.currentLocationLabel")}
                placeholder={t("onboarding.currentLocationPlaceholder")}
              />
            )}

            {!skipDanceSections &&
              filteredSteps[currentStep].id === "citiesVisited" && (
                <div className="space-y-3">
                  {currentLocation &&
                    citiesVisited.some(
                      (city) =>
                        (city._id || (city as any).id) ===
                        (currentLocation._id || (currentLocation as any).id)
                    ) && (
                      <div className="alert alert-info">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          className="stroke-current shrink-0 w-6 h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          ></path>
                        </svg>
                        <span className="text-sm">
                          {t("onboarding.cityAdded").replace(
                            "{city}",
                            currentLocation.name
                          )}
                        </span>
                      </div>
                    )}
                  <CitySelector
                    selectedCities={citiesVisited}
                    onCitiesChange={setCitiesVisited}
                    placeholder={t("onboarding.searchCitiesPlaceholder")}
                    label={
                      skipDanceSections
                        ? "Cities you've visited or worked in (optional)"
                        : t("onboarding.citiesYouDanced")
                    }
                  />
                </div>
              )}

            {/* Rest of the existing form steps remain the same... */}
            {/* I'll continue with the rest but keeping it shorter for readability */}

            {filteredSteps[currentStep].id === "anthem" && (
                <div className="space-y-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">
                        {t("onboarding.spotifySongUrl")}
                      </span>
                    </label>
                    <input
                      type="url"
                      className="input input-bordered"
                      placeholder={t("onboarding.pasteSpotifyLink")}
                      value={anthem.url}
                      onChange={(e) => {
                        const url = e.target.value;
                        const parsedInfo = parseMediaUrl(url);

                        setAnthem((prev) => ({
                          ...prev,
                          url,
                          platform: "spotify",
                          title: prev.title,
                          artist: prev.artist,
                        }));
                      }}
                    />
                    <label className="label">
                      <span className="label-text-alt text-base-content/60">
                        {t("onboarding.spotifyExample")}
                      </span>
                    </label>
                  </div>

                  {!mediaInfo && anthem.url && (
                    <div className="alert alert-warning">
                      <span>{t("onboarding.validSpotifyUrl")}</span>
                    </div>
                  )}

                  {mediaInfo && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="badge badge-primary">Spotify</span>
                        <span className="text-sm text-base-content/70">
                          {t("onboarding.previewSong")}
                        </span>
                      </div>
                      <div className="flex justify-center mt-4">
                        <iframe
                          src={mediaInfo.embedUrl}
                          width="100%"
                          height={mediaInfo.embedUrl.includes('/playlist/') || mediaInfo.embedUrl.includes('/album/') ? "380" : "152"}
                          frameBorder="0"
                          className="rounded-2xl"
                          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                          loading="lazy"
                        ></iframe>
                      </div>
                    </div>
                  )}
                </div>
              )}

            {filteredSteps[currentStep].id === "socialMedia" && (
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Instagram (optional)</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    placeholder="@username or profile URL"
                    value={socialMedia.instagram}
                    onChange={(e) =>
                      setSocialMedia((prev) => ({
                        ...prev,
                        instagram: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">TikTok (optional)</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    placeholder="@username or profile URL"
                    value={socialMedia.tiktok}
                    onChange={(e) =>
                      setSocialMedia((prev) => ({
                        ...prev,
                        tiktok: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">YouTube (optional)</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    placeholder="Channel URL"
                    value={socialMedia.youtube}
                    onChange={(e) =>
                      setSocialMedia((prev) => ({
                        ...prev,
                        youtube: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Spotify (optional)</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    placeholder="Profile URL"
                    value={socialMedia.spotify}
                    onChange={(e) =>
                      setSocialMedia((prev) => ({
                        ...prev,
                        spotify: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            )}

            {filteredSteps[currentStep].id === "danceRole" && (
              <div className="form-control">
                {!skipDanceSections && (
                  <>
                    <label className="label">
                      <span className="label-text">
                        {t("onboarding.danceRoleQuestion")}
                      </span>
                    </label>
                    <div className="flex flex-col gap-3">
                      {[
                        { value: "both", label: t("common.both") },
                        { value: "leader", label: t("profile.leader") },
                        { value: "follower", label: t("profile.follower") },
                      ].map((role) => (
                        <label
                          key={role.value}
                          className="label cursor-pointer"
                        >
                          <span className="label-text">{role.label}</span>
                          <input
                            type="radio"
                            name="danceRole"
                            className="radio radio-primary"
                            checked={danceRole === role.value}
                            onChange={() =>
                              setDanceRole(
                                role.value as "follower" | "leader" | "both"
                              )
                            }
                          />
                        </label>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Gender */}
            {filteredSteps[currentStep].id === "gender" && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text">
                    {t("onboarding.genderQuestion")}
                  </span>
                </label>
                <div className="flex flex-col gap-3">
                  {[
                    { value: "male", label: t("onboarding.male") },
                    { value: "female", label: t("onboarding.female") },
                    { value: "other", label: t("onboarding.other") },
                  ].map((option) => (
                    <label key={option.value} className="label cursor-pointer">
                      <span className="label-text">{option.label}</span>
                      <input
                        type="radio"
                        name="gender"
                        className="radio radio-primary"
                        checked={gender === option.value}
                        onChange={() =>
                          setGender(option.value as "male" | "female" | "other")
                        }
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Nationality */}
            {filteredSteps[currentStep].id === "nationality" && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text">
                    {t("onboarding.nationalityQuestion")}
                  </span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                >
                  <option value="">{t("onboarding.selectCountry")}</option>
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Relationship Status */}
            {filteredSteps[currentStep].id === "relationshipStatus" && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text">
                    {t("onboarding.relationshipQuestion")}
                  </span>
                </label>
                <div className="flex flex-col gap-3">
                  {[
                    { value: "", label: t("onboarding.preferNotToSay") },
                    { value: "single", label: `${t("profile.single")} 💙` },
                    {
                      value: "in_a_relationship",
                      label: `${t("profile.inRelationship")} 💕`,
                    },
                    { value: "married", label: `${t("profile.married")} 💍` },
                    {
                      value: "its_complicated",
                      label: `${t("profile.itsComplicated")} 🤷`,
                    },
                  ].map((option) => (
                    <label key={option.value} className="label cursor-pointer">
                      <span className="label-text">{option.label}</span>
                      <input
                        type="radio"
                        name="relationshipStatus"
                        className="radio radio-primary"
                        checked={relationshipStatus === option.value}
                        onChange={() =>
                          setRelationshipStatus(
                            option.value as typeof relationshipStatus
                          )
                        }
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Professional Roles (Teacher/DJ/Photographer) */}
            {filteredSteps[currentStep].id === "teacherInfo" && (
              <div className="space-y-6">
                <div className="text-sm text-base-content/70 mb-4">
                  {t("onboarding.selectAllThatApply")}
                </div>

                {/* Dance Teacher */}
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-4">
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={isTeacher}
                      onChange={(e) => setIsTeacher(e.target.checked)}
                    />
                    <div>
                      <span className="label-text font-semibold">
                        🎓 {t("onboarding.danceTeacher")}
                      </span>
                      <p className="text-sm text-base-content/60">
                        {t("onboarding.danceTeacherDesc")}
                      </p>
                    </div>
                  </label>
                </div>

                {isTeacher && (
                  <div className="space-y-4 border-l-4 border-primary pl-4 ml-2">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Teaching Bio</span>
                      </label>
                      <textarea
                        className="textarea textarea-bordered h-24"
                        placeholder="Tell students about your teaching style, experience, and what makes your classes special..."
                        value={teacherBio}
                        onChange={(e) => setTeacherBio(e.target.value)}
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">
                          Years of Teaching Experience
                        </span>
                      </label>
                      <input
                        type="number"
                        className="input input-bordered"
                        placeholder="e.g., 5"
                        min="0"
                        max="50"
                        value={yearsOfExperience}
                        onChange={(e) => setYearsOfExperience(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* DJ */}
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-4">
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={isDJ}
                      onChange={(e) => setIsDJ(e.target.checked)}
                    />
                    <div>
                      <span className="label-text font-semibold">
                        🎵 {t("onboarding.dj")}
                      </span>
                      <p className="text-sm text-base-content/60">
                        {t("onboarding.djDesc")}
                      </p>
                    </div>
                  </label>
                </div>

                {isDJ && (
                  <div className="space-y-4 border-l-4 border-primary pl-4 ml-2">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">
                          DJ Name/Alias (optional)
                        </span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered"
                        placeholder="e.g., DJ Salsa King"
                        value={djName}
                        onChange={(e) => setDjName(e.target.value)}
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">
                          Music Genres (optional)
                        </span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered"
                        placeholder="e.g., Bachata, Salsa, Kizomba"
                        value={djGenres}
                        onChange={(e) => setDjGenres(e.target.value)}
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">DJ Bio (optional)</span>
                      </label>
                      <textarea
                        className="textarea textarea-bordered h-20"
                        placeholder="Tell us about your DJ experience, style, and what makes your sets special..."
                        value={djBio}
                        onChange={(e) => setDjBio(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Photographer */}
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-4">
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={isPhotographer}
                      onChange={(e) => setIsPhotographer(e.target.checked)}
                    />
                    <div>
                      <span className="label-text font-semibold">
                        📷 {t("onboarding.photographer")}
                      </span>
                      <p className="text-sm text-base-content/60">
                        {t("onboarding.photographerDesc")}
                      </p>
                    </div>
                  </label>
                </div>

                {isPhotographer && (
                  <div className="space-y-4 border-l-4 border-primary pl-4 ml-2">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">
                          Portfolio Link (optional)
                        </span>
                      </label>
                      <input
                        type="url"
                        className="input input-bordered"
                        placeholder="Instagram, website, or portfolio link"
                        value={photographerPortfolio}
                        onChange={(e) =>
                          setPhotographerPortfolio(e.target.value)
                        }
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">
                          Specialties (optional)
                        </span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered"
                        placeholder="e.g., Events, Portraits, Social Dancing"
                        value={photographerSpecialties}
                        onChange={(e) =>
                          setPhotographerSpecialties(e.target.value)
                        }
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Bio (optional)</span>
                      </label>
                      <textarea
                        className="textarea textarea-bordered h-20"
                        placeholder="Tell us about your photography/videography style and experience..."
                        value={photographerBio}
                        onChange={(e) => setPhotographerBio(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Event Organizer */}
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-4">
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={isEventOrganizer}
                      onChange={(e) => setIsEventOrganizer(e.target.checked)}
                    />
                    <div>
                      <span className="label-text font-semibold">
                        🎪 Event Organizer
                      </span>
                      <p className="text-sm text-base-content/60">
                        I organize dance events, socials, workshops, or
                        festivals
                      </p>
                    </div>
                  </label>
                </div>

                {isEventOrganizer && (
                  <div className="space-y-4 border-l-4 border-primary pl-4 ml-2">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">
                          Organization/Event Name (optional)
                        </span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered"
                        placeholder="e.g., Bachata Nights Dublin, Salsa Festival"
                        value={eventOrganizerName}
                        onChange={(e) => setEventOrganizerName(e.target.value)}
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">
                          Event Types (optional)
                        </span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered"
                        placeholder="e.g., Socials, Workshops, Festivals, Congresses"
                        value={eventTypes}
                        onChange={(e) => setEventTypes(e.target.value)}
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Bio (optional)</span>
                      </label>
                      <textarea
                        className="textarea textarea-bordered h-20"
                        placeholder="Tell us about the events you organize and your experience..."
                        value={eventOrganizerBio}
                        onChange={(e) => setEventOrganizerBio(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Producer */}
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-4">
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={isProducer}
                      onChange={(e) => setIsProducer(e.target.checked)}
                    />
                    <div>
                      <span className="label-text font-semibold">
                        🎹 Music Producer
                      </span>
                      <p className="text-sm text-base-content/60">
                        I produce music for dance events, social dancing, or
                        competitions
                      </p>
                    </div>
                  </label>
                </div>

                {isProducer && (
                  <div className="space-y-4 border-l-4 border-primary pl-4 ml-2">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">
                          Producer/Artist Name (optional)
                        </span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered"
                        placeholder="e.g., DJ Producer, Artist Name"
                        value={producerName}
                        onChange={(e) => setProducerName(e.target.value)}
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">
                          Music Genres (optional)
                        </span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered"
                        placeholder="e.g., Bachata, Salsa, Kizomba"
                        value={producerGenres}
                        onChange={(e) => setProducerGenres(e.target.value)}
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">
                          Producer Bio (optional)
                        </span>
                      </label>
                      <textarea
                        className="textarea textarea-bordered h-20"
                        placeholder="Tell us about your music production style, releases, and what inspires your work..."
                        value={producerBio}
                        onChange={(e) => setProducerBio(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Shared Professional Contact */}
                {(isTeacher ||
                  isDJ ||
                  isPhotographer ||
                  isEventOrganizer ||
                  isProducer) && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="text-center text-sm font-medium text-base-content/70 py-2">
                      Professional Contact (at least one required)
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">
                          WhatsApp Number (optional)
                        </span>
                      </label>
                      <input
                        type="tel"
                        className="input input-bordered"
                        placeholder="+1234567890"
                        value={professionalContact.whatsapp}
                        onChange={(e) =>
                          setProfessionalContact((prev) => ({
                            ...prev,
                            whatsapp: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Email (optional)</span>
                      </label>
                      <input
                        type="email"
                        className="input input-bordered"
                        placeholder="professional@example.com"
                        value={professionalContact.email}
                        onChange={(e) =>
                          setProfessionalContact((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="alert alert-info">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        className="stroke-current shrink-0 w-6 h-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        ></path>
                      </svg>
                      <span className="text-sm">
                        Provide at least one contact method so people can reach
                        you for bookings and inquiries
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="card-actions justify-between mt-8">
              <button
                className="btn btn-outline"
                onClick={handleBack}
                disabled={currentStep === 0}
              >
                {t("onboarding.back")}
              </button>
              <div className="flex gap-2">
                <button
                  className="btn btn-primary"
                  onClick={handleNext}
                  disabled={
                    uploadingProfilePic ||
                    completing ||
                    savingStep ||
                    (filteredSteps[currentStep].id === "username" &&
                      usernameStatus.checking)
                  }
                >
                  {uploadingProfilePic ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      {t("onboarding.uploading")}
                    </>
                  ) : savingStep ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      {t("onboarding.saving")}
                    </>
                  ) : completing ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      {t("onboarding.completing")}
                    </>
                  ) : currentStep === filteredSteps.length - 1 ? (
                    isEditMode ? (
                      t("onboarding.saveChanges")
                    ) : (
                      t("onboarding.complete")
                    )
                  ) : (
                    t("onboarding.next")
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Support Button */}
      <SupportButton />
    </div>
  );
}
