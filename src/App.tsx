/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import LandingView from "./components/LandingView";
import ClientDashboard from "./components/ClientDashboard";
import ProviderDashboard from "./components/ProviderDashboard";
import AdminPanel from "./components/AdminPanel";
import { UserProfile, UserRole } from "./types";
import { Sparkles, MessageSquare, X, Info, Zap } from "lucide-react";
import ChatWindow from "./components/ChatWindow";

export default function App() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activeRole, setActiveRole] = useState<UserRole>("client");
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<string>("landing");

  // Floating Chat overlay config
  const [chatConfig, setChatConfig] = useState<{
    jobId: string;
    jobTitle: string;
    senderId: string;
    senderName: string;
    senderRole: UserRole;
    receiverId: string;
    receiverName: string;
    receiverAvatar: string;
  } | null>(null);

  // Load registered users including simulated seeds
  const loadUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const uList = await response.json();
        setUsers(uList);
        
        // Retain selection or select baseline
        if (currentUser) {
          const matched = uList.find((u: UserProfile) => u.id === currentUser.id);
          if (matched) {
            setCurrentUser(matched);
            return;
          }
        }
        
        // Default to client initially
        const defaultClient = uList.find((u: UserProfile) => u.role === "client");
        if (defaultClient) {
          setCurrentUser(defaultClient);
          setActiveRole("client");
        }
      }
    } catch (e) {
      console.error("Error connecting to server backend:", e);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSelectUser = (id: string) => {
    const selected = users.find(u => u.id === id);
    if (selected) {
      setCurrentUser(selected);
      setActiveRole(selected.role);
    }
  };

  const handleRoleChange = (role: UserRole) => {
    setActiveRole(role);
    // Find the first user in list belonging to that role if mismatch
    const matchingUser = users.find(u => u.role === role);
    if (matchingUser) {
      setCurrentUser(matchingUser);
    }
  };

  const handleOpenChat = (
    receiverId: string, 
    receiverName: string, 
    receiverAvatar: string, 
    jobId: string, 
    jobTitle: string
  ) => {
    if (!currentUser) return;
    setChatConfig({
      jobId,
      jobTitle,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: activeRole,
      receiverId,
      receiverName,
      receiverAvatar
    });
  };

  if (!currentUser) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#F8FAFC]">
        <Sparkles className="h-8 w-8 text-blue-600 animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-700 animate-pulse">Launching KaamWala trust systems ledger...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-850 antialiased" id="app-root-container">
      {/* Dynamic Header Navbar with switcher */}
      <Navbar
        activeRole={activeRole}
        onRoleChange={handleRoleChange}
        currentUser={currentUser}
        allUsers={users}
        onSelectUser={handleSelectUser}
        onViewLanding={() => setActiveTab("landing")}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main page router with fade motion containers */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6" id="main-content-router">
        
        {/* Dynamic tips for testing/reviews */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-900 text-slate-200 text-xs border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md" id="prototype-tip-strip">
          <div className="flex gap-2.5">
            <div className="bg-slate-800 text-yellow-400 p-1.5 rounded-xl shrink-0">
              <Zap className="h-4 w-4 animate-bounce" />
            </div>
            <div>
              <p className="font-bold text-white text-[12px]">Prototype Review Mode Active:</p>
              <p className="text-[11px] text-slate-300">You are acting as <strong>{currentUser.name}</strong>. Toggle roles using the switcher beside your wallet header to test all client job postings, provider bids, milestones releases, and disputes arb contracts!</p>
            </div>
          </div>
          <button 
            onClick={() => setActiveTab("landing")}
            className="px-3.5 py-1.5 bg-blue-600 text-white font-bold rounded-full text-[10px] hover:bg-blue-700 shrink-0 self-end sm:self-auto cursor-pointer transition shadow-sm"
          >
            How it works ?
          </button>
        </div>

        {activeTab === "landing" ? (
          <LandingView
            onStartAsClient={() => {
              const cli = users.find(u => u.role === "client") || currentUser;
              setCurrentUser(cli);
              setActiveRole("client");
              setActiveTab("dashboard");
            }}
            onStartAsProvider={() => {
              const prov = users.find(u => u.role === "provider") || currentUser;
              setCurrentUser(prov);
              setActiveRole("provider");
              setActiveTab("dashboard");
            }}
          />
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {activeRole === "client" && (
              <ClientDashboard
                currentUser={currentUser}
                reloadUser={loadUsers}
                onOpenChat={handleOpenChat}
              />
            )}

            {activeRole === "provider" && (
              <ProviderDashboard
                currentUser={currentUser}
                reloadUser={loadUsers}
                onOpenChat={handleOpenChat}
              />
            )}

            {activeRole === "admin" && (
              <AdminPanel
                currentUser={currentUser}
                reloadUser={loadUsers}
              />
            )}
          </div>
        )}
      </main>

      {/* Floating Chat Overlay Container */}
      {chatConfig && (
        <div className="fixed bottom-4 right-4 z-50 w-[340px] md:w-[380px] animate-in slide-in-from-bottom-6 duration-300" id="floating-chat-container">
          <ChatWindow
            jobId={chatConfig.jobId}
            jobTitle={chatConfig.jobTitle}
            senderId={chatConfig.senderId}
            senderName={chatConfig.senderName}
            senderRole={chatConfig.senderRole}
            receiverId={chatConfig.receiverId}
            receiverName={chatConfig.receiverName}
            receiverAvatar={chatConfig.receiverAvatar}
            onClose={() => setChatConfig(null)}
          />
        </div>
      )}

      {/* Humblest footer */}
      <footer className="py-6 border-t border-gray-100 bg-white" id="main-footer">
        <div className="max-w-7xl mx-auto px-4 text-center text-[11px] text-gray-400">
          <p>© 2026 KaamWala Trust marketplace services. Integrated with Gemini AI & Safe Escrow payment validation segment.</p>
        </div>
      </footer>
    </div>
  );
}
