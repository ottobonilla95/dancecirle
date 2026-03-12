"use client";

import { Link, useRouter } from "@/navigation";
import { FaArrowLeft } from "react-icons/fa";

interface BackButtonProps {
  href?: string;
  label?: string;
  className?: string;
}

export default function BackButton({ 
  href, 
  label = "Back",
  className = ""
}: BackButtonProps) {
  const router = useRouter();

  // If no href is provided, use browser back navigation
  if (!href) {
    return (
      <button 
        onClick={() => router.back()}
        className={`btn btn-ghost btn-sm gap-2 ${className}`}
      >
        <FaArrowLeft className="w-4 h-4" />
        {label}
      </button>
    );
  }

  // Otherwise use Link for specific navigation
  return (
    <Link 
      href={href} 
      className={`btn btn-ghost btn-sm gap-2 ${className}`}
    >
      <FaArrowLeft className="w-4 h-4" />
      {label}
    </Link>
  );
}

