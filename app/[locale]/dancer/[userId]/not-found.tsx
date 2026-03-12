import { Link } from "@/navigation";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto px-4 py-4 flex items-center justify-center min-h-screen">
        <div className="max-w-sm md:max-w-md mx-auto text-center">
          <div className="card bg-base-100 shadow-2xl">
            <div className="card-body p-4 md:p-6">
              {/* 404 Icon */}
              <div className="text-center mb-4 md:mb-6">
                <div className="text-5xl md:text-6xl mb-3 md:mb-4">🕺💃</div>
                <h1 className="text-xl md:text-3xl font-bold text-base-content mb-2">
                  Dancer Not Found
                </h1>
                <p className="text-sm md:text-base text-base-content/70">
                  This dancer doesn&apos;t exist or the profile is private.
                </p>
              </div>

              {/* Friendly Message */}
              <div className="mb-4 md:mb-6">
                <p className="text-xs md:text-sm text-base-content/70">
                  Don&apos;t worry! There are plenty of amazing dancers in our
                  community waiting to connect.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 md:space-y-3">
                <Link
                  href="/"
                  className="btn btn-sm md:btn-md btn-primary w-full"
                >
                  🏠 Go Home
                </Link>

                <Link
                  href="/api/auth/signin"
                  className="btn btn-sm md:btn-md btn-outline btn-primary w-full"
                >
                  🕺 Join DanceCircle 💃
                </Link>
              </div>

              {/* Additional Help */}
              <div className="mt-3 md:mt-4 text-center">
                <p className="text-xs md:text-sm text-base-content/50">
                  Looking for a specific dancer? Make sure you have the correct
                  profile link.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
