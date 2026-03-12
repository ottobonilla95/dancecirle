import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import config from "@/config";
import { Link } from "@/navigation";
import { FaDatabase, FaChartLine, FaUsers, FaGlobeAmericas, FaMusic, FaGlobe, FaTrash, FaBell, FaLightbulb, FaEnvelope, FaComments } from "react-icons/fa";
import { ReactNode } from "react";

export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const session = await getServerSession(authOptions);

  // Check if user is logged in
  if (!session) {
    redirect("/api/auth/signin");
  }

  // Check if user is admin
  if (session.user.email !== config.admin.email) {
    redirect(`/${params.locale}/dashboard`);
  }

  const navItems = [
    {
      name: "Cache Settings",
      href: "/admin/cache",
      icon: FaDatabase,
    },
    {
      name: "Weekly Digest",
      href: "/admin/digest",
      icon: FaChartLine,
    },
    {
      name: "Database Cleanup",
      href: "/admin/cleanup",
      icon: FaTrash,
    },
    {
      name: "Test Notifications",
      href: "/admin/test-notifications",
      icon: FaBell,
    },
    {
      name: "Suggestions",
      href: "/admin/suggestions",
      icon: FaLightbulb,
    },
    {
      name: "Newsletter",
      href: "/admin/newsletter",
      icon: FaEnvelope,
    },
    {
      name: "Conversations",
      href: "/admin/conversations",
      icon: FaComments,
    },
    {
      name: "Cities",
      href: "/admin/cities",
      icon: FaGlobeAmericas,
    },
    {
      name: "Countries",
      href: "/admin/countries",
      icon: FaGlobe,
    },
    {
      name: "Dance Styles",
      href: "/admin/dance-styles",
      icon: FaMusic,
    },
    {
      name: "Users (Social Media)",
      href: "/admin/users",
      icon: FaUsers,
    },
    {
      name: "Analytics",
      href: "/admin/analytics",
      icon: FaChartLine,
      badge: "Soon",
    },
  ];

  return (
    <div className="min-h-screen bg-base-200">
      {/* Top Bar */}
      <div className="navbar bg-base-100 shadow-lg">
        <div className="flex-1">
          <Link href="/dashboard" className="btn btn-ghost normal-case text-xl">
            <span className="mr-2">←</span>
            DanceCircle Admin
          </Link>
        </div>
        <div className="flex-none">
          <div className="badge badge-primary badge-sm">Admin Panel</div>
        </div>
      </div>

      <div className="flex">
        {/* Side Navigation */}
        <aside className="w-64 min-h-screen bg-base-100 p-4 shadow-xl">
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-2">
              Management
            </h2>
          </div>

          <ul className="menu menu-compact">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="badge badge-ghost badge-sm">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Admin Info */}
          <div className="mt-8 p-3 bg-base-200 rounded-lg">
            <div className="text-xs text-base-content/60">Logged in as</div>
            <div className="text-sm font-medium truncate">
              {session.user.email}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}

