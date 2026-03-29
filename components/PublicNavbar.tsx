"use client";

import { Link } from "@/navigation";
import Image from "next/image";
import logo from "@/app/icon.png";
import config from "@/config";
import LanguageSwitcher from "./LanguageSwitcher";

export default function PublicNavbar() {
  return (
    <header className="bg-base-100 border-b border-base-300">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0"
          >
            <Image
              src={logo}
              alt={`${config.appName} logo`}
              className="w-8 h-8"
              placeholder="blur"
              priority={true}
              width={32}
              height={32}
            />
            <span className="font-extrabold text-lg">{config.appName}</span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/api/auth/signin" className="btn btn-primary btn-sm">
              Join / Log In
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
