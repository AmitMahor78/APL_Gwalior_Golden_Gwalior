/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Sparkles, 
  Clock, 
  MapPin, 
  IndianRupee, 
  ShieldCheck, 
  CheckCircle, 
  AlertTriangle, 
  MessageSquare, 
  ChevronRight, 
  X, 
  Briefcase,
  Layers,
  ArrowRight
} from "lucide-react";
import { Job, Bid, Contract, UserProfile } from "../types";
import ChatWindow from "./ChatWindow";

interface ClientDashboardProps {
  currentUser: UserProfile;
  reloadUser: () => void;
  onOpenChat: (receiverId: string, receiverName: string, receiverAvatar: string, jobId: string, jobTitle: string) => void;
}

const CATEGORIES = [
  "Plumbing & Repairs",
  "Electrical Work",
  "Home Architecture & Design",
  "App & Software Development",
  "Digital Marketing & SEO",
  "AC & Appliance Repair",
  "Legal & Financial Consulting"
];

export default function ClientDashboard({ currentUser, reloadUser, onOpenChat }: ClientDashboardProps) {
  // Job listing states
  const [jobs, setJobs] = useState<Job[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [bidsForJob, setBidsForJob] = useState<Bid[]>([]);
  
  // Create Job States
  const [showPostForm, setShowPostForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: CATEGORIES[0],
    budget: "",
    location: "New Delhi, Delhi",
    tags: ""
  });
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);

  // Hire Modal States
  const [selectedBidToHire, setSelectedBidToHire] = useState<Bid | null>(null);
  const [milestonesText, setMilestonesText] = useState(""); // Comma split titles or defaults

  // Form submission alerts
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Loading indicator
  const [loadingDrafts, setLoadingDrafts] = useState(false);

  const fetchClientData = async () => {
    try {
      // 1. Fetch Client Jobs
      const resJobs = await fetch("/api/jobs");
      if (resJobs.ok) {
        const data = await resJobs.json();
        setJobs(data.filter((j: Job) => j.clientId === currentUser.id));
      }

      // 2. Fetch Client Contracts
      const resContracts = await fetch(`/api/contracts?userId=${currentUser.id}&role=client`);
      if (resContracts.ok) {
        const data = await resContracts.json();
        setContracts(data);
      }
    } catch (e) {
      console.error("Error fetching client dashboard list", e);
    }
  };

  useEffect(() => {
    fetchClientData();
  }, [currentUser]);

  // Load bids when selectedJob changes
  const viewBids = async (job: Job) => {
    setSelectedJob(job);
    try {
      const res = await fetch(`/api/bids?jobId=${job.id}`);
      if (res.ok) {
        const data = await res.json();
        setBidsForJob(data);
      }
    } catch (e) {
      console.error("Failed to load bids for selection.", e);
    }
  };

  // AI-powered job enhancer tool call via our server context
  const handleAIEnhance = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      setAlertMsg({ type: "error", text: "Please enter a draft title and description first before asking Gemini!" });
      return;
    }

    setIsEnhancing(true);
    setAlertMsg(null);
    try {
      const res = await fetch("/api/ai/enhance-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description
        })
      });

      if (res.ok) {
        const enhancedRaw = await res.json();
        setFormData({
          title: enhancedRaw.enhancedTitle || formData.title,
          description: enhancedRaw.enhancedDescription || formData.description,
          category: enhancedRaw.suggestedCategory || formData.category,
          budget: String(enhancedRaw.recommendedMinBudget) || formData.budget,
          location: formData.location,
          tags: enhancedRaw.suggestedTags?.join(", ") || formData.tags
        });
        setAiAdvice(`Gemini Advised: ₹${enhancedRaw.recommendedMinBudget} - ₹${enhancedRaw.recommendedMaxBudget}. Reason: ${enhancedRaw.reasoning}`);
        setAlertMsg({ type: "success", text: "Details restructured via Gemini!" });
      } else {
        setAlertMsg({ type: "error", text: "AI limits exceeded. Standard mock details auto-suggested." });
      }
    } catch (err) {
      console.error("Failed AI enhance", err);
      setAlertMsg({ type: "error", text: "Network connection issue during AI enhancement." });
    } finally {
      setIsEnhancing(false);
    }
  };

  // Post a Job
  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.budget) {
      setAlertMsg({ type: "error", text: "Please fill in title, scope details, and budget limits." });
      return;
    }

    setLoadingDrafts(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: currentUser.id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          budget: Number(formData.budget),
          location: formData.location,
          tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean)
        })
      });

      if (res.ok) {
        setAlertMsg({ type: "success", text: "Shortage requirement posted successfully!" });
        setFormData({
          title: "",
          description: "",
          category: CATEGORIES[0],
          budget: "",
          location: "New Delhi, Delhi",
          tags: ""
        });
        setAiAdvice(null);
        setShowPostForm(false);
        fetchClientData();
      } else {
        setAlertMsg({ type: "error", text: "Failed to create the posting." });
      }
    } catch (err) {
      console.error(err);
      setAlertMsg({ type: "error", text: "Failed to post due to connection issues." });
    } finally {
      setLoadingDrafts(false);
    }
  };

  // Open HIRE milestone options
  const startHireProcess = (bid: Bid) => {
    setSelectedBidToHire(bid);
    // Provide nice automatic split milestones suggestions
    setMilestonesText("Phased Kickoff, Intermediate Milestone Review, Final Integration & Polish");
  };

  // Complete the HIRE / escrow deposit
  const handleCompleteHire = async () => {
    if (!selectedBidToHire) return;

    if (currentUser.balance < selectedBidToHire.quoteAmount) {
      setAlertMsg({ 
        type: "error", 
        text: `Your wallet balance (₹${currentUser.balance}) is lower than the quote of ₹${selectedBidToHire.quoteAmount}. Select a lower quote or top up via prototype mode.` 
      });
      setSelectedBidToHire(null);
      return;
    }

    const mTitles = milestonesText.split(",")
      .map(m => m.trim())
      .filter(Boolean);

    try {
      const res = await fetch(`/api/bids/${selectedBidToHire.id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          milestoneTitles: mTitles
        })
      });

      if (res.ok) {
        setAlertMsg({ type: "success", text: `Successfully hired ${selectedBidToHire.providerName}! ₹${selectedBidToHire.quoteAmount} locked in escrow.` });
        setSelectedBidToHire(null);
        setSelectedJob(null);
        reloadUser();
        fetchClientData();
      } else {
        const errorData = await res.json();
        setAlertMsg({ type: "error", text: errorData.error || "Failed to accept bid." });
      }
    } catch (err) {
      console.error(err);
      setAlertMsg({ type: "error", text: "Connection failure while storing escrow lock." });
    }
  };

  // Release a Milestone payment
  const handleReleaseMilestone = async (contractId: string, milestoneId: string, title: string) => {
    try {
      const res = await fetch(`/api/contracts/${contractId}/release-milestone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milestoneId })
      });

      if (res.ok) {
        setAlertMsg({ type: "success", text: `Released payment for milestone: "${title}"` });
        reloadUser();
        fetchClientData();
      } else {
        setAlertMsg({ type: "error", text: "Failed to release milestone payment segment." });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Dispute transaction
  const handleRaiseDispute = async (contractId: string) => {
    const reason = prompt("Describe conflict/issue for the moderator review panel:", "Work was incomplete, provider has been absent for 3 days.");
    if (reason === null) return; // cancelled

    try {
      const res = await fetch(`/api/contracts/${contractId}/dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason })
      });

      if (res.ok) {
        setAlertMsg({ type: "success", text: "Dispute lodged. Safety Escrow lock initiated. Awaiting System Admin moderation!" });
        fetchClientData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="py-2" id="client-dashboard-main">
      {/* Alert Header */}
      {alertMsg && (
        <div 
          className={`mb-6 p-4 rounded-xl text-xs flex items-center justify-between shadow-sm animate-pulse ${
            alertMsg.type === "success" ? "bg-emerald-50 border border-emerald-100 text-emerald-800" : "bg-rose-50 border border-rose-100 text-rose-800"
          }`}
          id="client-dashboard-alert"
        >
          <span className="font-semibold">{alertMsg.text}</span>
          <button onClick={() => setAlertMsg(null)} className="p-1 text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Overview Banner stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" id="client-stats-cards">
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm animate-in fade-in duration-300">
          <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Active Job Listings</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900 leading-none">{jobs.filter(j => j.status === "open").length}</span>
            <span className="text-xs text-slate-400 font-sans">awaiting bids</span>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm animate-in fade-in duration-300">
          <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Running Contracts</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-blue-600 leading-none">
              {contracts.filter(c => c.status === "in_progress" || c.status === "milestone_released" || c.status === "disputed").length}
            </span>
            <span className="text-xs text-slate-400 font-sans">in development</span>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-blue-200 transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold">Wallet Core Balance</span>
            <button 
              onClick={async () => {
                await fetch(`/api/users/${currentUser.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ balance: currentUser.balance + 5000 })
                });
                reloadUser();
              }}
              className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 py-1.5 px-3 rounded-full hover:bg-blue-100/50 cursor-pointer transition"
            >
              + Top Up ₹5k
            </button>
          </div>
          <span className="text-3xl font-extrabold text-emerald-600 font-mono mt-1">₹{currentUser.balance?.toLocaleString()}</span>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Manage jobs & Post jobs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
              Manage Postings
            </h2>
            <button
              onClick={() => setShowPostForm(!showPostForm)}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 font-bold text-xs text-white rounded-full hover:bg-blue-700 cursor-pointer transition shadow-md shadow-blue-100"
              id="btn-post-job"
            >
              <Plus className="h-4 w-4" />
              Post Job
            </button>
          </div>

          {/* New Job Form */}
          {showPostForm && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-md space-y-4 animate-in fade-in slide-in-from-top-4 duration-300" id="post-job-form-container">
              <div className="flex items-center justify-between pb-2 border-b border-gray-50">
                <span className="text-sm font-bold text-gray-800">State Requirements Details</span>
                <span className="text-[11px] text-gray-400">Add drafts below. Use AI to refine parameters.</span>
              </div>

              <form onSubmit={handlePostJob} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Job Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Leaking plumbing fittings repair in Malviya Nagar flat"
                    className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Field Category</label>
                    <select
                       value={formData.category}
                       onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                       className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Rough Budget (₹)</label>
                    <input
                      type="number"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      placeholder="Estimated maximum compensation"
                      className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-sans font-medium"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Location Details</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Detailed Scope Description</label>
                    
                    {/* Gemini AI Enhancer trigger */}
                    <button
                      type="button"
                      onClick={handleAIEnhance}
                      disabled={isEnhancing}
                      className="flex items-center gap-1 px-3 py-1 text-[10px] font-bold bg-blue-50 border border-blue-100 text-blue-700 rounded-full hover:bg-blue-100/45 disabled:opacity-50 cursor-pointer transition"
                      id="ai-enhance-job-btn"
                    >
                      <Sparkles className="h-3 w-3 text-blue-500 animate-pulse" />
                      {isEnhancing ? "Refining with Gemini..." : "Ask Gemini to Format & Advise Range"}
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe specific task specifications, pipes, wires, layout parameters..."
                    className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Category Tags (Comma separated)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="e.g., Leakage, Kitchen, Gaskets, QuickRepair"
                    className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* Advised Range view */}
                {aiAdvice && (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl text-[11px] text-blue-800 leading-relaxed font-sans shadow-sm" id="ai-advice-display">
                    {aiAdvice}
                  </div>
                )}

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPostForm(false)}
                    className="px-4 py-2 border border-gray-200 text-xs font-semibold text-gray-600 rounded-xl cursor-pointer hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loadingDrafts}
                    className="px-5 py-2 bg-slate-900 border text-xs font-semibold text-white rounded-xl cursor-pointer hover:bg-slate-800"
                  >
                    {loadingDrafts ? "Posting..." : "Confirm & Launch Posting"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Job Listings List */}
          <div className="space-y-4" id="client-job-listings">
            {jobs.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
                <p className="text-sm font-semibold text-gray-700">No Job Postings Yet</p>
                <p className="text-xs text-gray-400 mt-1">Click &quot;Post Job&quot; at the top right to start bidding!</p>
              </div>
            ) : (
              jobs.map(job => (
                <div 
                  key={job.id} 
                  className={`bg-white border rounded-3xl p-6 shadow-sm transition-all duration-300 hover:border-blue-200 ${
                    selectedJob?.id === job.id ? "ring-2 ring-blue-600/10 border-blue-500 shadow-md" : "border-slate-200"
                  }`}
                  id={`job-card-${job.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 mb-2">
                        {job.category}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm leading-snug">{job.title}</h3>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" /> {job.location}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="block text-[10px] text-gray-400 uppercase font-semibold">Budget Limit</span>
                      <span className="text-sm font-mono font-extrabold text-slate-800">₹{job.budget?.toLocaleString()}</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 line-clamp-2 mt-3 leading-relaxed mb-4">{job.description}</p>

                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-1 mb-4" id={`tags-${job.id}`}>
                    {job.tags?.map((t, i) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded-md">
                        #{t}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pb-1 border-t border-gray-50 pt-3">
                    <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Status: {job.status === "open" ? "Awaiting Expert Bids" : "Hired / Active"}
                    </span>

                    {job.status === "open" && (
                      <button
                        onClick={() => viewBids(job)}
                        className="text-xs font-bold text-blue-600 flex items-center gap-0.5 hover:text-blue-800 bg-blue-50/50 py-1.5 px-3.5 rounded-full duration-200 transition"
                        id={`view-bids-${job.id}`}
                      >
                        Compare Bids
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Active Job - Bids View */}
          {selectedJob && (
            <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-4 animate-in fade-in border border-slate-850" id="bids-comparator">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Shortlist Professionals</span>
                  <h3 className="font-bold text-sm tracking-tight">{selectedJob.title}</h3>
                </div>
                <button onClick={() => setSelectedJob(null)} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {bidsForJob.length === 0 ? (
                  <div className="text-center py-6 text-slate-400">
                    <p className="text-xs">No proposals submitted for this post yet.</p>
                  </div>
                ) : (
                  bidsForJob.map(bid => (
                    <div key={bid.id} className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/60" id={`bid-panel-${bid.id}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
                        <div className="flex items-center space-x-2.5">
                          <img src={bid.providerAvatar} className="h-9 w-9 rounded-full object-cover" alt="" />
                          <div>
                            <span className="block text-xs font-bold flex items-center gap-1.5">
                              {bid.providerName}
                              {bid.isProviderVerified && (
                                <span className="inline-flex items-center text-[9px] bg-sky-950 text-sky-400 border border-sky-900 px-1.5 py-0.5 rounded-full font-bold">
                                  ✓ VERIFIED
                                </span>
                              )}
                            </span>
                            <span className="block text-[10px] text-slate-400">Rating: ⭐ {bid.providerRating}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <span className="block text-[9px] text-slate-400 uppercase">Quote Amount</span>
                            <span className="text-sm font-bold text-emerald-400 font-mono">₹{bid.quoteAmount?.toLocaleString()}</span>
                          </div>

                          <div className="text-right">
                            <span className="block text-[9px] text-slate-400 uppercase">Timeline</span>
                            <span className="text-xs font-semibold text-blue-400">{bid.timeline}</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 bg-slate-900/35 p-3 rounded-lg leading-relaxed mb-3">{bid.message}</p>

                      <div className="flex items-center justify-end space-x-2 border-t border-slate-800 pt-2.5">
                        <button
                          onClick={() => onOpenChat(bid.providerId, bid.providerName, bid.providerAvatar, bid.jobId, selectedJob.title)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-700 text-[11px] font-semibold text-slate-200 hover:text-white hover:bg-slate-850 cursor-pointer transition"
                        >
                          <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
                          Chat
                        </button>
                        
                        <button
                          onClick={() => startHireProcess(bid)}
                          className="flex items-center gap-1 px-4 py-1.5 rounded-full bg-blue-600 text-[11px] font-bold text-white hover:bg-blue-700 cursor-pointer transition shadow-md shadow-blue-900/10"
                          id={`hire-btn-${bid.id}`}
                        >
                          Hire Pro & Lock Escrow
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Hire Confirmation Modal with Milestones */}
          {selectedBidToHire && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" id="hire-modal">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
                <button 
                  onClick={() => setSelectedBidToHire(null)} 
                  className="absolute right-4 top-4 p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
                
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Lock Escrow and Initiate</h3>
                <h2 className="text-lg font-bold text-gray-950 mt-1">Hire {selectedBidToHire.providerName}</h2>

                <div className="my-4 bg-slate-50 p-3.5 rounded-xl text-xs space-y-1.5 text-gray-600 font-sans">
                  <div className="flex justify-between">
                    <span>Task Name:</span>
                    <strong className="text-gray-900 truncate max-w-[200px]">{selectedBidToHire.jobTitle}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Provider Bid Quote:</span>
                    <strong className="text-emerald-700 font-mono">₹{selectedBidToHire.quoteAmount?.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Proposed Duration:</span>
                    <strong className="text-gray-900">{selectedBidToHire.timeline}</strong>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <label className="block text-xs font-bold text-gray-700">Define Phase Milestones (Comma separated)</label>
                  <input
                    type="text"
                    value={milestonesText}
                    onChange={(e) => setMilestonesText(e.target.value)}
                    placeholder="e.g. Kickoff wiring, Wire layout test, Final Switch panel board installation"
                    className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <p className="text-[10px] text-gray-400">This automatically splits the locked ₹{selectedBidToHire.quoteAmount} across these phases. Payment stays in Escrow vault until released segment-by-segment.</p>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setSelectedBidToHire(null)}
                    className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 rounded-full"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCompleteHire}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 font-bold text-xs text-white rounded-full shadow-md cursor-pointer transition"
                    id="confirm-hire-final-btn"
                  >
                    Confirm Escrow & Start Work
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Running agreements, Milestones control */}
        <div className="space-y-6">
          <div className="pb-3 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-600" />
              Active Milestones Tracking
            </h2>
          </div>

          {contracts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-xs text-slate-400 font-medium">
              No running projects in development. Hire a professional above to start payment escrow tracking.
            </div>
          ) : (
            contracts.map(contract => (
              <div key={contract.id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4" id={`contract-box-${contract.id}`}>
                <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 leading-tight truncate max-w-[140px]" title={contract.jobTitle}>{contract.jobTitle}</h4>
                    <span className="block text-[10px] text-slate-400 mt-0.5">Pro: {contract.providerName}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block pb-0.5">Contract Budget</span>
                    <span className="text-xs font-mono font-extrabold text-blue-700">₹{contract.escrowAmount?.toLocaleString()}</span>
                  </div>
                </div>

                {/* Milestones Flow list */}
                <div className="space-y-2.5">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment Stages</span>
                  {contract.milestones.map((m, index) => (
                    <div key={m.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-150 flex items-center justify-between gap-2" id={`milestone-${m.id}`}>
                      <div>
                        <span className="block text-xs font-bold text-slate-800 leading-snug">{index + 1}. {m.title}</span>
                        <span className="text-[10px] font-mono text-blue-600 mt-1 block font-semibold">Value: ₹{m.amount?.toLocaleString()}</span>
                      </div>

                      <div>
                        {m.status === "released" ? (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> Released
                          </span>
                        ) : m.status === "in_escrow" && contract.status !== "disputed" ? (
                          <div className="flex flex-col gap-1.5 items-end">
                            <span className="text-[9px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full mb-0.5">
                              Locked in Escrow
                            </span>
                            <button
                              onClick={() => handleReleaseMilestone(contract.id, m.id, m.title)}
                              className="text-[9px] font-bold text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1 rounded-full cursor-pointer transition"
                              id={`release-milestone-btn-${m.id}`}
                            >
                              Release Payout
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                            Held/Locked
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Dispute / Actions footer bar */}
                <div className="flex items-center justify-between border-t border-gray-50 pt-3" id={`contract-footer-${contract.id}`}>
                  <div>
                    {contract.status === "completed" && (
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl">
                        ✓ Tasks Closed & Complete
                      </span>
                    )}
                    {contract.status === "in_progress" && (
                      <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-xl">
                        <Clock className="h-3 w-3" /> In Progress
                      </span>
                    )}
                    {contract.status === "disputed" && (
                      <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl space-y-1 w-full" id={`disputed-box-${contract.id}`}>
                        <span className="text-[10px] font-bold flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5 text-rose-600 animate-bounce" /> Locked: Dispute Lodged
                        </span>
                        <p className="text-[9px] text-rose-600 leading-tight">Reason: &quot;{contract.disputeReason}&quot;</p>
                        <p className="text-[8px] text-rose-400">Admin arbitration is currently in progress.</p>
                      </div>
                    )}
                    {contract.status === "refunded" && (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl">
                        Refunded Back to Wallet
                      </span>
                    )}
                  </div>

                  {contract.status === "in_progress" && (
                    <button
                      onClick={() => handleRaiseDispute(contract.id)}
                      className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 py-1 px-2 rounded-lg hover:bg-rose-100 transition cursor-pointer"
                      id={`raise-dispute-${contract.id}`}
                    >
                      File Dispute
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
