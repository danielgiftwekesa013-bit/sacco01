import { useState } from "react";
import { Button } from "@/components/ui/button";
import { User, Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import LoginModal from "@/components/modals/LoginModal";
import SignUpModal from "@/components/modals/SignUpModal";
import ForgotPasswordModal from "@/components/modals/ForgotPasswordModal";
import ProfileModal from "@/components/modals/ProfileModal";
import SettingsModal from "@/components/modals/SettingsModal";

interface HeaderProps {
  isLoggedIn?: boolean;
  onLogout?: () => void;
  onMenuClick?: () => void;
}

const Header = ({ isLoggedIn = false, onLogout, onMenuClick }: HeaderProps) => {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <header
        className="
          sticky top-0 z-50 w-full 
          flex items-center justify-between 
          px-4 bg-black shadow-sm text-white
        "
        style={{ height: "80px" }}
      >
        {/* === LEFT SIDE: LOGO + MOBILE MENU === */}
        <div className="flex items-center gap-3">

          {isLoggedIn && onMenuClick && (
            <button
              onClick={onMenuClick}
              className="md:hidden p-2 rounded hover:bg-gray-800 transition"
            >
              <Menu className="h-6 w-6 text-white" />
            </button>
          )}

          {/* LOGO */}
          <img
            src="/transpiaggio-logo.png"
            alt="Trans-Piaggio SACCO Logo"
            className="h-12 w-auto object-contain"
          />
        </div>

        {/* === RIGHT SIDE AUTH / MENU === */}
        {!isLoggedIn ? (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSignUp(true)}
              className="hidden sm:inline-flex text-white hover:bg-gray-800"
            >
              Create Account
            </Button>

            <Button
              size="sm"
              onClick={() => setShowLogin(true)}
              className="bg-gradient-primary hover:opacity-90 text-white"
            >
              Sign In
            </Button>
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full text-white hover:bg-gray-800">
                <User className="h-5 w-5 text-white" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setShowProfile(true)}>
                Profile
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setShowSettings(true)}>
                Settings
              </DropdownMenuItem>

              <DropdownMenuItem onClick={onLogout}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </header>

      {/* ---- MODALS ---- */}
      <ProfileModal open={showProfile} onOpenChange={setShowProfile} />
      <SettingsModal open={showSettings} onOpenChange={setShowSettings} />

      <LoginModal
        open={showLogin}
        onOpenChange={setShowLogin}
        onForgotPassword={() => {
          setShowLogin(false);
          setShowForgotPassword(true);
        }}
        onSignUp={() => {
          setShowLogin(false);
          setShowSignUp(true);
        }}
      />

      <SignUpModal
        open={showSignUp}
        onOpenChange={setShowSignUp}
        onLogin={() => {
          setShowSignUp(false);
          setShowLogin(true);
        }}
      />

      <ForgotPasswordModal
        open={showForgotPassword}
        onOpenChange={setShowForgotPassword}
        onBackToLogin={() => {
          setShowForgotPassword(false);
          setShowLogin(true);
        }}
      />
    </>
  );
};

export default Header;
