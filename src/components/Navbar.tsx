/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  BriefcaseBusiness, 
  Wallet, 
  ShieldCheck, 
  UserCircle, 
  Menu,
  ChevronDown,
  Sparkles,
  UsersRound,
  LayoutDashboard
} from "lucide-react";
import { UserProfile, UserRole } from "../types";

interface NavbarProps {
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onSelectUser: (userId: string) => void;
  onViewLanding: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Navbar({
  activeRole,
  onRoleChange,
  currentUser,
  allUsers,
  onSelectUser,
  onViewLanding,
  activeTab,
  setActiveTab
}: NavbarProps) {
  // Group users by role so we can pick from dropdown for demo simulation
  const clients = allUsers.filter(u => u.role === "client");
  const providers = allUsers.filter(u => u.role === "provider");
  const admins = allUsers.filter(u => u.role === "admin");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-205 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo */}
        <div 
          onClick={onViewLanding} 
          className="flex cursor-pointer items-center space-x-2.5 transition hover:opacity-90"
          id="nav-logo"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 shadow-md shadow-blue-100 shrink-0">
            <div className="w-4 h-4 bg-white rounded-sm rotate-45"></div>
          </div>
          <div className="flex flex-col">
            <span className="font-sans text-xl font-bold tracking-tight text-slate-800 leading-none">KaamWala</span>
            <span className="font-sans text-[9px] font-semibold text-blue-600 uppercase tracking-widest mt-0.5">Trust-First Gig Engine</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-2" id="nav-desktop-tabs">
          <button
            onClick={() => setActiveTab("landing")}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
              activeTab === "landing"
                ? "text-blue-600 bg-blue-50"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
            id="tab-landing-btn"
          >
            Features & Info
          </button>
          
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors flex items-center gap-1.5 ${
              activeTab === "dashboard"
                ? "text-blue-600 bg-blue-50"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
            id="tab-dash-btn"
          >
            <LayoutDashboard className="h-4 w-4" />
            {activeRole === "client" ? "My Postings" : activeRole === "provider" ? "Service Dashboard" : "Safety Dashboard"}
          </button>
        </nav>

        {/* Right side controls: Profile, Wallet balance, Simulation Toggle */}
        <div className="flex items-center space-x-3" id="nav-controls">
          {/* Virtual Escrow Wallet indicator */}
          <div className="hidden sm:flex items-center space-x-2 rounded-xl bg-emerald-50 border border-emerald-100 px-3.5 py-1.5" id="user-virtual-wallet">
            <Wallet className="h-4 w-4 text-emerald-600" />
            <div className="text-right">
              <span className="block text-[9px] font-bold text-emerald-700 uppercase tracking-wider leading-none">Sim Wallet</span>
              <span className="text-xs font-bold text-emerald-800 font-mono">₹{currentUser.balance?.toLocaleString()}</span>
            </div>
          </div>

          {/* SIMULATOR TOOLBAR: Extremely valuable for reviewing */}
          <div className="relative group" id="user-role-switcher">
            <div className="flex items-center space-x-2 cursor-pointer bg-slate-900 text-white rounded-full px-4 py-2 hover:bg-slate-800 transition shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-yellow-400 animate-pulse shrink-0" />
              <div className="text-left">
                <span className="block text-[8px] font-bold text-slate-300 uppercase tracking-widest leading-none">Simulating Role</span>
                <span className="text-xs font-bold capitalize flex items-center gap-1">
                  {currentUser.name} ({activeRole})
                  <ChevronDown className="h-3 w-3 text-slate-300" />
                </span>
              </div>
            </div>

            {/* Dropdown for role switcher & profile selection */}
            <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-2xl bg-white p-4 shadow-xl border border-slate-150 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50">
              <div className="mb-3 pb-3 border-b border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Prototype Simulator</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Switch user roles instantly to test all user, bidding, client-escrow feedback, and dispute resolution interactions.</p>
              </div>

              {/* Clients section inside dropdown */}
              <div className="space-y-1 mb-3">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-600 px-2">Act as Employer (Clients)</span>
                {clients.map(u => (
                  <button
                    key={u.id}
                    onClick={() => {
                      onSelectUser(u.id);
                      onRoleChange("client");
                      setActiveTab("dashboard");
                    }}
                    className={`w-full flex items-center space-x-2.5 p-1.5 rounded-xl text-left text-xs transition ${
                      currentUser.id === u.id ? "bg-blue-50 text-blue-700 font-semibold" : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <img src={u.avatar} className="h-6 w-6 rounded-full object-cover" alt="" />
                    <div className="flex-1 overflow-hidden">
                      <span className="block truncate">{u.name} (Client)</span>
                      <span className="block text-[9px] text-slate-400 font-mono">Bal: ₹{u.balance}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Providers section inside dropdown */}
              <div className="space-y-1 mb-3">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-600 px-2">Act as Expert (Providers)</span>
                <div className="max-h-36 overflow-y-auto space-y-1">
                  {providers.map(u => (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSelectUser(u.id);
                        onRoleChange("provider");
                        setActiveTab("dashboard");
                      }}
                      className={`w-full flex items-center space-x-2.5 p-1.5 rounded-xl text-left text-xs transition ${
                        currentUser.id === u.id ? "bg-amber-50 text-amber-800 font-semibold" : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <img src={u.avatar} className="h-6 w-6 rounded-full object-cover" alt="" />
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="block truncate">{u.name}</span>
                          {u.isVerified && <span className="text-[10px] text-blue-500 font-semibold">✓</span>}
                        </div>
                        <span className="block text-[9px] text-slate-400 font-mono truncate">
                          {u.skills?.slice(0, 2).join(", ")} | Bal: ₹{u.balance}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Admins section inside dropdown */}
              <div className="space-y-1">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-600 px-2">Act as Safety/Disputes (Admin)</span>
                {admins.map(u => (
                  <button
                    key={u.id}
                    onClick={() => {
                      onSelectUser(u.id);
                      onRoleChange("admin");
                      setActiveTab("dashboard");
                    }}
                    className={`w-full flex items-center space-x-2.5 p-1.5 rounded-xl text-left text-xs transition ${
                      currentUser.id === u.id ? "bg-rose-50 text-rose-700 font-semibold" : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <img src={u.avatar} className="h-6 w-6 rounded-full object-cover" alt="" />
                    <div className="flex-1 overflow-hidden">
                      <span className="block truncate">{u.name} (Admin)</span>
                      <span className="block text-[9px] text-slate-400 truncate">Moderate issues & approve verification requests</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
