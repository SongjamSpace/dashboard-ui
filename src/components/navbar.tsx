"use client";

import { Button } from "./ui/button";
import PrimaryButton from "./primary-button";
import Link from "next/link";
import { Menu } from "lucide-react";
// import { MobileMenu } from "./mobile-menu";
// import Logo from "./logo";
// import { cn } from "@/lib/utils";
import VirtualsIcon from "./virtuals-icon";
import NavbarDropdown from "./navbar-dropdown";
import { useAuth } from "./providers";

export const APP_BASE_URL = "https://app.songjam.space";

export default function Navbar({ inverse, hideNavigation, title }: { inverse?: boolean; hideNavigation?: boolean; title?: string }) {
  const { user, authenticated, loading, login, logout } = useAuth();
  return (
    <div className="flex justify-between items-center rounded-[12px] max-w-7xl mx-auto">
      <div className="flex items-center gap-2">
        {title ? (
          <h1 className={`text-2xl font-bold ${inverse ? "text-[#48333D]" : "text-white"}`}>
            {title}
          </h1>
        ) : (
          // Fallback or empty if no title and logo is moved
          <div className="flex items-center space-x-2">
            {/* Logo removed as per request, but keeping fallback just in case or empty */}
          </div>
        )}
      </div>
      {!hideNavigation && (
        <div className="hidden md:flex gap-4 items-center">
          <Link href="/shows">
            <Button
              variant="ghost"
              className={inverse ? "text-[#48333D] hover:text-[#48333D]/60" : ""}
            >
              Shows
            </Button>
          </Link>
          <Link href="/hosts">
            <Button
              variant="ghost"
              className={inverse ? "text-[#48333D] hover:text-[#48333D]/60" : ""}
            >
              Hosts
            </Button>
          </Link>
        </div>
      )}
      <div className="hidden md:block">
        {/* Auth buttons moved to Sidebar */}
      </div>
      <div className="md:hidden">
        {/* <MobileMenu inverse={inverse}>
          <Menu size={24} className={inverse ? "text-[#48333D]" : ""} />
        </MobileMenu> */}
      </div>
    </div>
  );
}
