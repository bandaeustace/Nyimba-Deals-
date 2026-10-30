import React from 'react';
import {
  Camera,
  Search,
  LogOut,
  MapPin,
  Shield,
  Wifi,
  WifiOff,
  Crown,
  Sparkles
} from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  currentUser: User | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenPostModal: () => void;
  onOpenAdminPortal?: () => void;
  onLogout: () => void;
  isOnline: boolean;
  offlineCount: number;
}

export default function Navbar({
  currentUser,
  searchQuery,
  onSearchChange,
  onOpenPostModal,
  onOpenAdminPortal,
  onLogout,
  isOnline,
  offlineCount,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-6">
          {/* LOGO & LOCATION */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center shadow-md shadow-emerald-950 font-black text-xl text-white">
              ND
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white leading-none">
                  Nyimba Deals
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-sm bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                  Fast 2G
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                <MapPin className="w-3 h-3 text-emerald-400" />
                <span>Nyimba &bull; Eastern Province</span>
              </div>
            </div>
          </div>

          {/* SEARCH BAR */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <input
                type="text"
                placeholder="Search rentals, maize grain, goats, electronics, jobs..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 pl-9 transition-all"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* RIGHT ACTION BUTTONS */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* OFFLINE INDICATOR */}
            {!isOnline ? (
              <div
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-semibold"
                title="Working offline using cached memory. Will sync when reconnected."
              >
                <WifiOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Offline (2G Mode)</span>
              </div>
            ) : offlineCount > 0 ? (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold">
                <Wifi className="w-3.5 h-3.5" />
                <span>{offlineCount} Synced</span>
              </div>
            ) : null}

            {/* HIDDEN ADMIN PORTAL BUTTON (Visible ONLY to Admin Eustace Banda 0773694618) */}
            {currentUser?.isAdmin && onOpenAdminPortal && (
              <button
                onClick={onOpenAdminPortal}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-950 transition-all cursor-pointer"
                title="CEO Command Center"
              >
                <Crown className="w-4 h-4 fill-slate-950" />
                <span className="hidden sm:inline">CEO Portal</span>
              </button>
            )}

            {/* CAPTURE & POST BUTTON */}
            <button
              onClick={onOpenPostModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs shadow-md shadow-emerald-950 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Capture &amp; Post</span>
            </button>

            {/* USER PROFILE INFO & LOGOUT */}
            {currentUser && (
              <div className="flex items-center gap-2 pl-1 border-l border-slate-800">
                <div className="hidden lg:block text-right">
                  <div className="text-xs font-bold text-slate-200 truncate max-w-[100px]">
                    {currentUser.username}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {currentUser.phone}
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Log out of Nyimba Deals"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* MOBILE SEARCH BAR */}
        <div className="pb-3 md:hidden">
          <div className="relative">
            <input
              type="text"
              placeholder="Search maize, plot, electronics, food, jobs..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 pl-9"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          </div>
        </div>
      </div>
    </header>
  );
}
