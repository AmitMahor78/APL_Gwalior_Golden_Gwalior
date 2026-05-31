/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  UserX, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  FileText, 
  Ban, 
  UserCheck, 
  Layers, 
  Wallet,
  Coins,
  BadgeAlert,
  ArrowRight
} from "lucide-react";
import { UserProfile, Contract, Job } from "../types";

interface AdminPanelProps {
  currentUser: UserProfile;
  reloadUser: () => void;
}

export default function AdminPanel({ currentUser, reloadUser }: AdminPanelProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [alert, setAlert] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Stats
  const [totalEscrowLent, setTotalEscrowLent] = useState(0);

  const fetchAdminData = async () => {
    try {
      const resUsers = await fetch("/api/users");
      if (resUsers.ok) {
        const uData = await resUsers.json();
        setUsers(uData);
      }

      const resContracts = await fetch("/api/contracts");
      if (resContracts.ok) {
        const cData = await resContracts.json();
        setContracts(cData);

        // Sum escrow held
        const sumHold = cData
          .filter((c: Contract) => c.status === "in_progress" || c.status === "disputed")
          .reduce((sum: number, c: Contract) => {
            const heldAmt = c.milestones
              .filter(m => m.status === "in_escrow")
              .reduce((s, m) => s + m.amount, 0);
            return sum + heldAmt;
          }, 0);
        setTotalEscrowLent(sumHold);
      }

      const resJobs = await fetch("/api/jobs");
      if (resJobs.ok) {
        const jData = await resJobs.json();
        setJobs(jData);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [currentUser]);

  // Approve Provider Verification Badge
  const handleVerifyProvider = async (providerId: string, status: "verified" | "rejected") => {
    try {
      const res = await fetch("/api/admin/verify-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId, status })
      });

      if (res.ok) {
        setAlert({ type: "success", text: `Provider identity status updated to ${status}!` });
        fetchAdminData();
      } else {
        setAlert({ type: "error", text: "Failed to update professional badge." });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Resolve active dispute contract arbitration
  const handleResolveDispute = async (contractId: string, resolution: "refund_client" | "payout_provider") => {
    try {
      const res = await fetch(`/api/contracts/${contractId}/resolve-dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolution })
      });

      if (res.ok) {
        setAlert({ type: "success", text: `Arbitration resolved! Escrow funds distributed via ${resolution === 'refund_client' ? 'refund' : 'provider release'}.` });
        fetchAdminData();
        reloadUser();
      } else {
        setAlert({ type: "error", text: "Failed to resolve conflict arbitration state." });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Moderate Listings - Block scams
  const handleModerateJob = async (jobId: string) => {
    // In-memory or simulation block
    setAlert({ type: "success", text: `Listing ID "${jobId}" suspended & deactivated from open jobs board.` });
    setJobs(prev => prev.filter(j => j.id !== jobId));
  };

  // Get users needing verification badge approval
  const pendingProviders = users.filter(u => u.role === "provider" && u.verificationStatus === "pending");

  // Get active disputed agreements
  const disputedContracts = contracts.filter(c => c.status === "disputed");

  return (
    <div className="py-2" id="admin-panel-main">
      <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100 mb-6">
        <div className="h-9 w-9 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-950">Safety Moderation Panel</h2>
          <p className="text-[10px] text-gray-400">Escrow ledger monitoring, identity badge verification review, and conflict arbitration.</p>
        </div>
      </div>

      {alert && (
        <div className="mb-6 p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-semibold text-emerald-800 flex items-center justify-between" id="admin-panel-alert">
          <span>✓ {alert.text}</span>
          <button onClick={() => setAlert(null)} className="text-emerald-600 hover:text-emerald-900 font-bold">dismiss</button>
        </div>
      )}

      {/* Admin stats dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8" id="admin-numerical-stats">
        <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-md flex flex-col justify-between animate-in fade-in duration-300">
          <span className="block text-[9px] text-slate-400 uppercase tracking-widest font-bold">Total Active Jobs</span>
          <span className="text-3xl font-extrabold font-sans mt-2">{jobs.length}</span>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between animate-in fade-in duration-300">
          <span className="block text-[9px] text-slate-400 uppercase tracking-widest font-bold">Total Enlisted Experts</span>
          <span className="text-3xl font-extrabold text-slate-900 mt-2">{users.filter(u => u.role === "provider").length}</span>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-205 shadow-sm flex flex-col justify-between animate-in fade-in duration-300 animate-delay-100">
          <span className="block text-[9px] text-slate-400 uppercase tracking-widest font-bold font-sans">Active Locked Escrow</span>
          <span className="text-3xl font-extrabold text-emerald-600 mt-2 font-mono">₹{totalEscrowLent?.toLocaleString()}</span>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between animate-in fade-in duration-300 animate-delay-150">
          <span className="block text-[9px] text-slate-400 uppercase tracking-widest font-bold">Flagged / Disputes</span>
          <span className="text-3xl font-extrabold text-rose-600 mt-2">{disputedContracts.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ROW 1 COLUMN 1: Identity/License Badge Approvals */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4" id="pending-providers-approval">
          <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-1.5">
            <UserCheck className="h-4 w-4 text-blue-600" />
            Verification Badge Requests ({pendingProviders.length})
          </h3>

          {pendingProviders.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center font-medium">No pending validation badge requests found in safety queue.</p>
          ) : (
            <div className="space-y-4 max-h-[440px] overflow-y-auto pr-1">
              {pendingProviders.map(prov => (
                <div key={prov.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3" id={`approval-row-${prov.id}`}>
                  <div className="flex items-center space-x-2.5">
                    <img src={prov.avatar} className="h-9 w-9 rounded-full object-cover" alt="" />
                    <div>
                      <span className="block text-xs font-bold">{prov.name}</span>
                      <span className="block text-[10px] text-blue-600 font-bold truncate max-w-[200px]">{prov.skills?.join(", ")}</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-2.5 border border-slate-150 text-[10px] space-y-1 text-slate-500">
                    <div className="flex justify-between">
                      <span>Submitted Identity File:</span>
                      <strong className="text-slate-800 underline font-mono truncate max-w-[140px]">{prov.idDocumentUrl}</strong>
                    </div>
                    {prov.certificateUrl && (
                      <div className="flex justify-between">
                        <span>Submitted Skill License:</span>
                        <strong className="text-slate-800 font-mono truncate max-w-[140px]">{prov.certificateUrl}</strong>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-1">
                    <button
                      onClick={() => handleVerifyProvider(prov.id, "rejected")}
                      className="px-3.5 py-1.5 bg-rose-50 border border-rose-100 text-rose-700 font-extrabold text-[10px] rounded-full cursor-pointer hover:bg-rose-100 transition duration-150"
                      id={`reject-prov-${prov.id}`}
                    >
                      Reject Submission
                    </button>
                    <button
                      onClick={() => handleVerifyProvider(prov.id, "verified")}
                      className="px-4 py-2 bg-blue-600 font-bold text-white text-[10px] rounded-full cursor-pointer hover:bg-blue-700 transition duration-150 shadow-sm"
                      id={`approve-prov-${prov.id}`}
                    >
                      Approve Verification Badge
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ROW 1 COLUMN 2: Conflict & Dispute Moderation Panel */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4" id="disputes-moderation">
          <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-1.5">
            <BadgeAlert className="h-4 w-4 text-rose-600" />
            Locked Dispute Arbitration Cases ({disputedContracts.length})
          </h3>

          {disputedContracts.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center font-medium">No escrow dispute arbitrations logged. Ledger remains clean!</p>
          ) : (
            <div className="space-y-4 max-h-[440px] overflow-y-auto pr-1">
              {disputedContracts.map(con => (
                <div key={con.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3" id={`arbitration-case-${con.id}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-rose-600">Disputed Vault Held</span>
                      <h4 className="font-bold text-xs text-slate-900 leading-snug mt-0.5">{con.jobTitle}</h4>
                    </div>
                    <span className="text-sm font-mono font-extrabold text-emerald-600 shrink-0">₹{con.escrowAmount}</span>
                  </div>

                  <div className="bg-white rounded-xl p-3 border border-slate-150 text-[10px] space-y-1.5 text-slate-500 font-sans">
                    <div>
                      <span>Client Account:</span>
                      <strong className="text-slate-900 ml-1">{con.clientName}</strong>
                    </div>
                    <div>
                      <span>Provider Account:</span>
                      <strong className="text-slate-900 ml-1">{con.providerName}</strong>
                    </div>
                    <div className="p-2.5 bg-rose-50 border border-rose-100/50 rounded-xl text-rose-800 leading-relaxed font-semibold mt-1">
                      Reason: &quot;{con.disputeReason}&quot;
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 justify-end pt-1">
                    <button
                      onClick={() => handleResolveDispute(con.id, "refund_client")}
                      className="px-4 py-2 bg-rose-600 text-white font-bold text-[10px] rounded-full cursor-pointer hover:bg-rose-700 transition"
                      id={`arbitrate-refund-${con.id}`}
                    >
                      Arbitrate Client Refund
                    </button>
                    <button
                      onClick={() => handleResolveDispute(con.id, "payout_provider")}
                      className="px-4 py-2 bg-blue-600 font-bold text-white text-[10px] rounded-full cursor-pointer hover:bg-blue-700 transition"
                      id={`arbitrate-payout-${con.id}`}
                    >
                      Arbitrate Payout
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Moderating job postings category listings */}
      <div className="bg-white border border-slate-205 rounded-3xl p-6 shadow-sm mt-8 animate-in fade-in duration-300" id="moderate-active-listings">
        <h3 className="font-bold text-xs text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-1.5 mb-4">
          <Ban className="h-4 w-4 text-slate-500" />
          Active Marketplace listings moderation
        </h3>

        <div className="space-y-3">
          {jobs.filter(j => j.status === "open").map(job => (
            <div key={job.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/75 flex items-center justify-between text-xs gap-4" id={`mod-job-row-${job.id}`}>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full mb-1 inline-block">{job.category}</span>
                <span className="block font-bold text-slate-900 truncate mt-1">{job.title}</span>
                <span className="block text-[10px] text-slate-400 mt-0.5">Owner: {job.clientName}</span>
              </div>

              <div className="text-right flex items-center space-x-3 shrink-0">
                <span className="font-sans font-bold text-slate-700 mr-2">₹{job.budget}</span>
                <button
                  type="button"
                  onClick={() => handleModerateJob(job.id)}
                  className="px-4.5 py-2 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-transparent font-bold text-[10px] rounded-full transition text-slate-700 cursor-pointer"
                  id={`suspend-btn-${job.id}`}
                >
                  Suspend Listing
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
