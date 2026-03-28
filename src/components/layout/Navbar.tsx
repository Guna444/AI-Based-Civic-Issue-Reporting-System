"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MapPin, LayoutDashboard, Plus, List, BarChart3, Settings } from "lucide-react";

interface NavbarProps {
  role: "CITIZEN" | "ADMIN";
  userName?: string | null;
}

export function Navbar({ role, userName }: NavbarProps) {
  const pathname = usePathname();

  const citizenLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/report", label: "Report Issue", icon: Plus },
    { href: "/issues", label: "All Issues", icon: List },
  ];

  const adminLinks = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/issues", label: "Manage Issues", icon: List },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  ];

  const links = role === "ADMIN" ? adminLinks : citizenLinks;

  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href={role === "ADMIN" ? "/admin" : "/dashboard"} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              UG
            </div>
            <span className="font-bold text-gray-900 hidden sm:block">Urban Governance</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "gap-2",
                    pathname === href || pathname.startsWith(href + "/")
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {role === "ADMIN" && (
            <span className="hidden sm:flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
              <Settings className="h-3 w-3" />
              Admin
            </span>
          )}
          {userName && (
            <span className="hidden sm:block text-sm text-gray-600">
              {userName}
            </span>
          )}
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden border-t bg-gray-50 px-4 py-2 flex gap-2 overflow-x-auto">
        {links.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "gap-1 text-xs whitespace-nowrap",
                pathname === href ? "bg-blue-50 text-blue-600" : "text-gray-600"
              )}
            >
              <Icon className="h-3 w-3" />
              {label}
            </Button>
          </Link>
        ))}
      </div>
    </header>
  );
}
