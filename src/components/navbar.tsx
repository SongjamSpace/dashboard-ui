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

export default function Navbar({ inverse }: { inverse?: boolean }) {
  const { user, authenticated, loading, login, logout } = useAuth();
  return (
    <div className="flex justify-between items-center rounded-[12px] max-w-7xl mx-auto">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex items-center space-x-2">
            <img src="/images/logo1.png" alt="Logo" className="h-8 w-8" />
            <span
              className={`hidden md:block text-xl font-black ${
                inverse ? "text-[#48333D]" : "text-white"
              }`}
              style={{
                fontFamily: "Audiowide, cursive",
                textShadow: inverse
                  ? "none"
                  : "0 0 20px rgba(255, 255, 255, 0.4), 0 0 40px rgba(255, 255, 255, 0.2)",
                letterSpacing: "0.1em",
                fontWeight: 400,
              }}
            >
              SONGJAM
            </span>
          </div>
        </Link>
      </div>
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
      <div className="hidden md:block">
        {loading ? (
          <button
            className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
              inverse
                ? "bg-[#48333D]/50 text-white/50"
                : "bg-black/50 text-white/50 border border-white/20"
            }`}
            style={{ fontFamily: "Inter, sans-serif" }}
            disabled
          >
            Loading...
          </button>
        ) : authenticated && user ? (
          <div className="flex items-center gap-3">
            <span
              className={`text-sm font-medium ${
                inverse ? "text-[#48333D]" : "text-white"
              }`}
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {user.displayName || user.email || "User"}
            </span>
            <button
              onClick={logout}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                inverse
                  ? "bg-[#48333D] text-white hover:bg-[#48333D]/90 shadow-lg hover:shadow-xl"
                  : "bg-black text-white border border-white/30 hover:bg-black/90 shadow-lg hover:shadow-xl hover:border-white/50"
              }`}
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={login}
            className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 ${
              inverse
                ? "bg-[#48333D] text-white hover:bg-[#48333D]/90 shadow-lg hover:shadow-xl"
                : "bg-black text-white border border-white/30 hover:bg-black/90 shadow-lg hover:shadow-xl hover:border-white/50"
            }`}
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Login with X
          </button>
        )}
      </div>
      <div className="md:hidden">
        {/* <MobileMenu inverse={inverse}>
          <Menu size={24} className={inverse ? "text-[#48333D]" : ""} />
        </MobileMenu> */}
      </div>
    </div>
  );
}
