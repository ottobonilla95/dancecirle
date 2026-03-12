"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { Link } from "@/navigation";
import { useSearchParams } from "next/navigation";
import logo from "@/app/icon.png";
import config from "@/config";
import { useTranslation } from "@/components/I18nProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import SupportButton from "@/components/SupportButton";

export default function SignIn() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const callbackUrl = searchParams?.get("callbackUrl") || config.auth.callbackUrl;
  
  // Check for NextAuth errors (expired token, verification error, etc.)
  const error = searchParams?.get("error");

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setEmailSent(false);
    
    try {
      const result = await signIn("email", {
        email,
        callbackUrl,
        redirect: false, // Don't redirect so we can show success message
      });
      
      if (result?.ok) {
        setEmailSent(true);
      }
    } catch (error) {
      console.error("Sign in error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <Link href="/" className="flex items-center gap-2 mb-2">
              <Image
                src={logo}
                alt={`${config.appName} logo`}
                className="w-12 h-12"
                width={48}
                height={48}
              />
              <span className="text-2xl font-bold">{config.appName}</span>
            </Link>
            <p className="text-center text-base-content/70">
              {t('auth.welcomeBack')}
            </p>
          </div>

          {/* Error Messages */}
          {error === "Verification" && (
            <div className="space-y-3 mb-4">
              <div className="alert alert-error">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h3 className="font-bold">{t('auth.linkExpired')}</h3>
                  <div className="text-sm">{t('auth.linkExpiredMessage')}</div>
                </div>
              </div>
              <SupportButton variant="inline" className="w-full" />
            </div>
          )}
          
          {error && error !== "Verification" && (
            <div className="alert alert-error mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{t('auth.signInError')}</span>
            </div>
          )}
          
          {/* Success Message */}
          {emailSent && (
            <div className="alert alert-success mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-bold">Check your email!</h3>
                <div className="text-sm">We sent you a sign-in link. It&apos;s valid for 7 days.</div>
              </div>
            </div>
          )}

          {/* Google Sign In - Official Google Button Style */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg border border-gray-300 flex items-center justify-center gap-3 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-sm font-medium">{t('auth.signInWithGoogle')}</span>
          </button>

          <div className="divider">{t('auth.or')}</div>

          {/* Email Sign In */}
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">{t('auth.email')}</span>
              </label>
              <input
                type="email"
                placeholder={t('auth.emailPlaceholder')}
                className="input input-bordered w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                t('auth.signInWithEmail')
              )}
            </button>
          </form>

          <div className="text-center text-sm text-base-content/70 mt-4">
            {t('auth.bySigningIn')}{" "}
            <Link href="/tos" className="link link-primary">
              {t('auth.terms')}
            </Link>{" "}
            {t('auth.and')}{" "}
            <Link href="/privacy-policy" className="link link-primary">
              {t('auth.privacy')}
            </Link>
          </div>
        </div>
      </div>
      
      {/* Floating Support Button */}
      <SupportButton variant="floating" />
    </div>
  );
}

