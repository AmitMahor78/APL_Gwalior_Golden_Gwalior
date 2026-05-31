/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Search, 
  MapPin, 
  Sparkles, 
  CheckCircle, 
  FileText, 
  DollarSign, 
  Clock, 
  ArrowRight, 
  ShieldAlert, 
  X,
  Plus,
  Compass,
  Award,
  Layers,
  ThumbsUp,
  SlidersHorizontal,
  ChevronRight,
  Briefcase
} from "lucide-react";
import { Job, Bid, Contract, UserProfile } from "../types";

interface ProviderDashboardProps {
  currentUser: UserProfile;
  reloadUser: () => void;
  onOpenChat: (receiverId: string, receiverName: string, receiverAvatar: string, jobId: string, jobTitle: string) => void;
}

const CATEGORIES = [
  "All Categories",
  "Plumbing & Repairs",
  "Electrical Work",
  "Home Architecture & Design",
  "App & Software Development",
  "Digital Marketing & SEO",
  "AC & Appliance Repair",
  "Legal & Financial Consulting"
];

export default function ProviderDashboard({ currentUser, reloadUser, onOpenChat }: ProviderDashboardProps) {
  // Job Board lists
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);

  // Search & Tag Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");

  // Profile Editor Settings
  const [skills, setSkills] = useState(currentUser.skills?.join(", ") || "");
  const [bio, setBio] = useState(currentUser.bio || "");
  const [hourlyRate, setHourlyRate] = useState(currentUser.hourlyRate || 350);
  const [portfolioUrl, setPortfolioUrl] = useState(currentUser.portfolioUrl || "");

  // Verification document simulation inputs
  const [idDoc, setIdDoc] = useState(currentUser.idDocumentUrl || "");
  const [certDoc, setCertDoc] = useState(currentUser.certificateUrl || "");

  // AI Matching States
  const [aiMatches, setAiMatches] = useState<{ jobId: string; score: number; reason: string }[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // Bidding Modal States
  const [jobToBid, setJobToBid] = useState<Job | null>(null);
  const [bidForm, setBidForm] = useState({
    quoteAmount: "",
    timeline: "2 Days",
    message: ""
  });
  const [draftingBidMsg, setDraftingBidMsg] = useState(false);

  // Alerts
  const [alert, setAlert] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchProviderData = async () => {
    try {
      // 1. Fetch active jobs
      const resJobs = await fetch("/api/jobs");
      if (resJobs.ok) {
        const data = await resJobs.json();
        setAllJobs(data.filter((j: Job) => j.status === "open"));
      }

      // 2. Fetch provider bids
      const resBids = await fetch(`/api/bids?providerId=${currentUser.id}`);
      if (resBids.ok) {
        const data = await resBids.json();
        setBids(data);
      }

      // 3. Fetch running contracts
      const resContracts = await fetch(`/api/contracts?userId=${currentUser.id}&role=provider`);
      if (resContracts.ok) {
        const data = await resContracts.json();
        setContracts(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchProviderData();
  }, [currentUser]);

  // Handle Search & Filter update
  useEffect(() => {
    let list = allJobs;
    if (searchQuery) {
      list = list.filter(j => 
        j.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        j.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedCategory && selectedCategory !== "All Categories") {
      list = list.filter(j => j.category === selectedCategory);
    }
    setFilteredJobs(list);
  }, [allJobs, searchQuery, selectedCategory]);

  // AI Matchmaker call
  const triggerAIMatching = async () => {
    setLoadingMatches(true);
    setAlert(null);
    try {
      const res = await fetch("/api/ai/match-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId: currentUser.id })
      });

      if (res.ok) {
        const matchedData = await res.json();
        setAiMatches(matchedData.matches || []);
        setAlert({ type: "success", text: "Scanned open jobs via Gemini Matchmaker!" });
      } else {
        setAlert({ type: "error", text: "AI matching limits reached." });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMatches(false);
    }
  };

  // Submit profile edit
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/users/${currentUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skills: skills.split(",").map(s => s.trim()).filter(Boolean),
          bio,
          hourlyRate: Number(hourlyRate),
          portfolioUrl
        })
      });

      if (res.ok) {
        setAlert({ type: "success", text: "Professional profile bio updated successfully!" });
        reloadUser();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Badge verification request to safety admins
  const handleRequestVerification = async () => {
    if (!idDoc.trim()) {
      setAlert({ type: "error", text: "Please supply a simulated Government ID/Aadhar Document proof URL first." });
      return;
    }

    try {
      const res = await fetch(`/api/users/${currentUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationStatus: "pending",
          idDocumentUrl: idDoc,
          certificateUrl: certDoc
        })
      });

      if (res.ok) {
        setAlert({ type: "success", text: "Identity verification request submitted. Expect Admin review shortly!" });
        reloadUser();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Bid dialogue
  const openBidModal = (job: Job) => {
    setJobToBid(job);
    setBidForm({
      quoteAmount: String(job.budget),
      timeline: "3 Days",
      message: ""
    });
  };

  // AI proposal text writer call
  const handleDraftAIPerformanceProposal = async () => {
    if (!jobToBid) return;
    setDraftingBidMsg(true);
    setAlert(null);

    try {
      const res = await fetch("/api/ai/suggest-bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: jobToBid.id,
          providerId: currentUser.id
        })
      });

      if (res.ok) {
        const suggestion = await res.json();
        setBidForm({
          quoteAmount: String(suggestion.amount || bidForm.quoteAmount),
          timeline: suggestion.timeline || bidForm.timeline,
          message: suggestion.message || bidForm.message
        });
        setAlert({ type: "success", text: "Proposal bid drafted tailored to your profile skills using Gemini!" });
      } else {
        setAlert({ type: "error", text: "Generative AI writing service busy. Added a standard professional introduction." });
        setBidForm({
          ...bidForm,
          message: `Dear Client,\n\nI reviewed your task details for "${jobToBid.title}". With my core expertise in ${currentUser.skills?.slice(0, 2).join(", ") || 'home repairs'}, I can deliver reliable on-site results. Looking forward to discussing details!`
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDraftingBidMsg(false);
    }
  };

  // Submit Proposal Bid
  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobToBid) return;

    try {
      const res = await fetch("/api/bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: jobToBid.id,
          providerId: currentUser.id,
          quoteAmount: Number(bidForm.quoteAmount),
          timeline: bidForm.timeline,
          message: bidForm.message
        })
      });

      if (res.ok) {
        setAlert({ type: "success", text: `Proposal bid submitted successfully for ₹${bidForm.quoteAmount}!` });
        setJobToBid(null);
        fetchProviderData();
      } else {
        setAlert({ type: "error", text: "Failed to submit quote." });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="py-2" id="provider-dashboard-main">
      {/* Alert Header */}
      {alert && (
        <div 
          className={`mb-6 p-4 rounded-xl text-xs flex items-center justify-between shadow-sm animate-pulse ${
            alert.type === "success" ? "bg-emerald-50 border border-emerald-100 text-emerald-800" : "bg-rose-50 border border-rose-100 text-rose-800"
          }`}
          id="provider-dashboard-alert"
        >
          <span className="font-semibold">{alert.text}</span>
          <button onClick={() => setAlert(null)} className="p-1 text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Provider stats and badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8" id="provider-stats-header">
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm animate-in fade-in duration-300">
          <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">My Performance Rating</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900 leading-none">⭐ {currentUser.rating}</span>
            <span className="text-xs text-slate-400 font-sans">({currentUser.completedJobsCount} jobs completed)</span>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm animate-in fade-in duration-300">
          <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Bids Active</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-amber-600 leading-none">{bids.filter(b => b.status === "pending").length}</span>
            <span className="text-xs text-slate-400 font-sans">proposals pending</span>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm animate-in fade-in duration-300">
          <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Running Contracts</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-blue-600 leading-none">
              {contracts.filter(c => c.status === "in_progress" || c.status === "milestone_released").length}
            </span>
            <span className="text-xs text-slate-400 font-sans">in development</span>
          </div>
        </div>

        {/* Dynamic Verification Badge flow status */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between animate-in fade-in duration-300">
          <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Trust Checkmark Badge</span>
          <div className="flex items-center space-x-2 mt-1">
            {currentUser.verificationStatus === "verified" ? (
              <span className="text-xs font-extrabold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full flex items-center gap-1">
                ✓ Verified Badge Active
              </span>
            ) : currentUser.verificationStatus === "pending" ? (
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full animate-pulse">
                ⏳ Verification Pending Admin Review
              </span>
            ) : (
              <span className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full">
                ⚠️ Unverified Professional
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT TWO-COLUMNS: Browse jobs listing workspace */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-205">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Compass className="h-5 w-5 text-blue-600" />
              Browse Open Work Listings
            </h2>

            {/* AI matching button */}
            <button
              onClick={triggerAIMatching}
              disabled={loadingMatches}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-100 hover:bg-blue-100/50 text-blue-700 font-bold text-[11px] rounded-full transition cursor-pointer self-start sm:self-auto transition duration-300"
              id="btn-ai-match"
            >
              <Sparkles className="h-3.5 w-3.5 text-blue-500 animate-pulse" />
              {loadingMatches ? "Calculating Matches..." : "Gemini Job Matchmaker"}
            </button>
          </div>

          {/* AI Matches Block layout */}
          {aiMatches.length > 0 && (
            <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-xl relative animate-in zoom-in-95 duration-200 border border-slate-800" id="ai-matching-section">
              <button 
                onClick={() => setAiMatches([])} 
                className="absolute top-3.5 right-3.5 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-yellow-400 animate-pulse" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Gemini Match Percentage Predictions</h4>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {aiMatches.map(match => {
                  const jobObj = allJobs.find(j => j.id === match.jobId);
                  if (!jobObj) return null;
                  return (
                    <div key={match.jobId} className="bg-slate-800/80 border border-slate-700/40 rounded-xl p-3 flex items-start gap-3 justify-between">
                      <div className="flex-1">
                        <span className="block text-xs font-bold leading-tight">{jobObj.title}</span>
                        <p className="text-[10px] text-slate-300 mt-1 leading-relaxed">{match.reason}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] block text-slate-400">Match score</span>
                        <span className="text-sm font-mono font-extrabold text-blue-400">{match.score}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search Filters Tray */}
          <div className="bg-white rounded-3xl p-4 flex flex-col sm:flex-row gap-3 items-center border border-slate-200 shadow-sm" id="search-filter-tray">
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search job titles, plumbing, wirings, layouts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-10 pr-4 py-2.5 border border-slate-200 bg-[#F8FAFC] rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="w-full sm:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-205 bg-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Job Listings feed */}
          <div className="space-y-4" id="provider-jobs-list">
            {filteredJobs.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-xs text-slate-400 font-medium">
                No matching open service listings found on the board.
              </div>
            ) : (
              filteredJobs.map(job => (
                <div key={job.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm transition-all duration-300 hover:border-blue-200" id={`job-${job.id}`}>
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 mb-2">
                        {job.category}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm leading-snug">{job.title}</h3>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1 font-sans">
                        <MapPin className="h-3 w-3" /> {job.location} | Posted by: {job.clientName}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 uppercase block font-semibold">Budget Limit</span>
                      <span className="text-sm font-mono font-extrabold text-slate-800">₹{job.budget?.toLocaleString()}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed mt-3 mb-4 line-clamp-3 font-medium">{job.description}</p>

                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-1 mb-4" id={`tags-${job.id}`}>
                    {job.tags?.map((t, i) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md">
                        #{t}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-[10px] text-slate-400 font-sans">Awaiting qualified proposals</span>
                    
                    <button
                      onClick={() => openBidModal(job)}
                      className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition py-1.5 px-4 rounded-full cursor-pointer shadow-md shadow-blue-50 duration-200"
                      id={`quote-btn-${job.id}`}
                    >
                      Submit Quote Proposal
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Submit Quote Modal with Gemini Proposal Helper */}
          {jobToBid && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" id="bid-modal">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
                <button 
                  onClick={() => setJobToBid(null)} 
                  className="absolute right-4 top-4 p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>

                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Submitting Proposal</span>
                <h3 className="font-bold text-sm text-gray-900 mt-1 mb-4">{jobToBid.title}</h3>

                <form onSubmit={handleSubmitBid} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">My Quote Price (₹)</label>
                      <input
                        type="number"
                        value={bidForm.quoteAmount}
                        onChange={(e) => setBidForm({ ...bidForm, quoteAmount: e.target.value })}
                        className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-sans font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Timeline to Complete</label>
                      <input
                        type="text"
                        value={bidForm.timeline}
                        onChange={(e) => setBidForm({ ...bidForm, timeline: e.target.value })}
                        placeholder="e.g. 3 Days, 1 Week"
                        className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Proposal Cover Message</label>
                      
                      {/* Bid Assistant Generative trigger */}
                      <button
                        type="button"
                        onClick={handleDraftAIPerformanceProposal}
                        disabled={draftingBidMsg}
                        className="flex items-center gap-1 px-3 py-1 text-[10px] font-bold bg-blue-50 border border-blue-105 text-blue-700 rounded-full hover:bg-blue-100/40 disabled:opacity-50 cursor-pointer transition"
                        id="ai-suggest-bid-btn"
                      >
                        <Sparkles className="h-3 w-3 text-blue-500 animate-pulse" />
                        {draftingBidMsg ? "Writing Proposal..." : "Draft Proposal with Gemini AI"}
                      </button>
                    </div>
                    <textarea
                      rows={5}
                      value={bidForm.message}
                      onChange={(e) => setBidForm({ ...bidForm, message: e.target.value })}
                      placeholder="Outline why you are the best fit, highlight similar faucet fittings or wiring projects you worked on..."
                      className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-105">
                    <button
                      type="button"
                      onClick={() => setJobToBid(null)}
                      className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 rounded-full"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 font-bold text-xs text-white rounded-full shadow-md cursor-pointer transition"
                      id="submit-proposal-final-btn"
                    >
                      Submit Sealed Quote Proposal
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Professional Bio, Badges, Assigned construction tasks */}
        <div className="space-y-6">
          
          {/* Profile Bio details */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4" id="provider-profile-section">
            <h4 className="font-bold text-xs text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-blue-605" />
              Service Profile Setup
            </h4>

            <form onSubmit={handleUpdateProfile} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">My Verified Skills (Comma separated)</label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Hourly Price (₹)</label>
                  <input
                    type="number"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Portfolio URL</label>
                  <input
                    type="text"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Professional Description Bio</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-202 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 text-white rounded-full font-bold text-xs hover:bg-slate-800 transition shadow-sm cursor-pointer"
                id="save-profile-btn"
              >
                Save Profile Parameters
              </button>
            </form>
          </div>

          {/* Identity validation verification badge mock document upload drawer */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4" id="provider-badge-verification">
            <div>
              <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Award className="h-4 w-4 text-blue-600" />
                Submit Verification Badges
              </h4>
              <p className="text-[10px] text-slate-400 mt-1">Acquire a high-trust verification badge to increase shortlisting rates by 400%.</p>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Simulated identity Document</label>
                <input
                  type="text"
                  placeholder="Paste mock PDF/ID link (e.g. proof_aadhar_card.pdf)"
                  value={idDoc}
                  onChange={(e) => setIdDoc(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Vocational License / Certificate</label>
                <input
                   type="text"
                   placeholder="Solder/Plumbing license cert code (optional)"
                   value={certDoc}
                   onChange={(e) => setCertDoc(e.target.value)}
                   className="w-full text-xs p-2.5 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleRequestVerification}
                className="w-full py-2.5 border border-blue-600 text-blue-600 font-bold text-xs rounded-full hover:bg-blue-50 cursor-pointer text-center duration-250 transition"
                id="request-badge-btn"
              >
                Upload & Request Verified Badge
              </button>
            </div>
          </div>

          {/* Assigned contracts / work items */}
          <div className="space-y-4">
            <h4 className="font-bold text-xs text-slate-800 pb-2 border-b border-slate-200 uppercase tracking-wider flex items-center gap-1">
              <Layers className="h-4 w-4 text-emerald-500" /> Active Gig Progress Logs
            </h4>

            {contracts.length === 0 ? (
              <p className="text-[11px] text-slate-400 font-medium">You do not have any running assigned contracts under progress.</p>
            ) : (
              contracts.map(contract => (
                <div key={contract.id} className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3 shadow-sm" id={`running-contract-${contract.id}`}>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900 leading-tight truncate">{contract.jobTitle}</h5>
                    <span className="block text-[10px] text-slate-400 mt-0.5">Employer: {contract.clientName}</span>
                  </div>

                  <div className="space-y-2">
                    {contract.milestones.map((m, index) => (
                      <div key={m.id} className="bg-slate-50 rounded-2xl p-3 border border-slate-150 flex items-center justify-between text-[11px]">
                        <div>
                          <span className="block font-bold text-slate-800">{index + 1}. {m.title}</span>
                          <span className="text-[9px] text-blue-600 font-mono mt-1 block font-semibold">Price: ₹{m.amount}</span>
                        </div>

                        <div>
                          {m.status === "released" ? (
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                              Paid out
                            </span>
                          ) : m.status === "in_escrow" ? (
                            <span className="text-[9px] font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full animate-pulse">
                              In Escrow Safe
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                              Pending Setup
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <button
                      onClick={() => onOpenChat(contract.clientId, contract.clientName, "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150", contract.jobId, contract.jobTitle)}
                      className="text-[10px] font-extrabold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 py-1.5 px-3 rounded-full"
                    >
                      Chat with Employer
                    </button>

                    <div>
                      {contract.status === "disputed" ? (
                        <span className="text-[9px] font-extrabold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl">
                          ⚠️ Locked: Under Dispute
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-gray-400">
                          Milestones status tracks payout limits
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
