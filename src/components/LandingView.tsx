/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  Building2, 
  Lightbulb, 
  ShieldCheck, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  HelpCircle,
  Gem,
  Award,
  TrendingUp,
  MessageSquareDiff
} from "lucide-react";

interface LandingViewProps {
  onStartAsClient: () => void;
  onStartAsProvider: () => void;
}

const steps = [
  {
    title: "1. Smart Category Scope",
    desc: "Post a service requirement. Use Gemini to structure your description and receive customized pricing range predictions.",
    icon: Lightbulb,
    color: "bg-blue-50 text-blue-600 border-blue-105",
  },
  {
    title: "2. Sealed Escrow Deposit",
    desc: "Select an expert and deposit funds secure in our virtual vault. Professional can review in-escrow funds before working.",
    icon: ShieldCheck,
    color: "bg-emerald-50 text-emerald-600 border-emerald-105",
  },
  {
    title: "3. Milestone-Based Release",
    desc: "Work is done through phased steps on interactive dashboard logs. Release payments bit-by-bit upon completion approval.",
    icon: Clock,
    color: "bg-amber-50 text-amber-600 border-amber-105",
  },
  {
    title: "4. Review & Build Trust",
    desc: "Release remaining money, leave performance ratings, and help elite gig professionals build verified reputation badges.",
    icon: CheckCircle2,
    color: "bg-blue-100/60 text-blue-700 border-blue-200",
  }
];

const features = [
  {
    title: "Gemini-Engineered Job Postings",
    desc: "Click 'Ask AI to Enhance' while creating jobs: structures layout with pro markdown requirements, auto-generates category tags, and estimates cost ranges.",
    icon: Sparkles,
  },
  {
    title: "Dual Role Simulator",
    desc: "Easily simulation-test as Employer (Anamika), Plumber (Rajesh), Electrician (Aman), or Safety Moderator (System Admin) directly from the persistent switcher.",
    icon: TrendingUp,
  },
  {
    title: "Escrow State & Milestones",
    desc: "Protect payment workflow. Funds can be locked, disputed in bad scenarios, or resolved via live Admin Arbitration logic.",
    icon: Award,
  },
  {
    title: "Simulated Live Chat",
    desc: "Message with service providers. Features 'Simulate Expert Response' which invokes Gemini to talk on behalf of the provider based on their bio & skills!",
    icon: MessageSquareDiff,
  }
];

export default function LandingView({ onStartAsClient, onStartAsProvider }: LandingViewProps) {
  return (
    <div className="py-8" id="landing-main-view">
      {/* Hero Section */}
      <div className="relative text-center px-4 sm:px-6 mb-16 max-w-4xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 mb-4">
          <Sparkles className="h-3.5 w-3.5 text-blue-500 animate-pulse" />
          Powered by Gemini AI Studio Integration
        </span>
        <h1 className="text-4xl sm:text-5xl font-sans font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
          Reliable Freelance Service Marketplace with <span className="text-blue-600 bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">Locked payment release</span>
        </h1>
        <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto mb-8 font-sans leading-relaxed">
          KaamWala resolves the trust barrier in home and technical services. Post jobs, get tailored bids, collaborate in active chats, and protect transactions using pre-funded milestones.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4 sm:px-0">
          <button
            onClick={onStartAsClient}
            className="w-full sm:w-auto px-7 py-3.5 bg-blue-600 text-white font-bold text-sm rounded-full cursor-pointer hover:bg-blue-700 shadow-md shadow-blue-100 transition-all flex items-center justify-center gap-2"
            id="start-as-client-btn"
          >
            Post a Job & Find Experts
          </button>
          
          <button
            onClick={onStartAsProvider}
            className="w-full sm:w-auto px-7 py-3.5 bg-slate-900 text-white font-bold text-sm rounded-full cursor-pointer hover:bg-slate-800 transition flex items-center justify-center gap-2"
            id="start-as-provider-btn"
          >
            Browse Listings & Submit Quotes
          </button>
        </div>
      </div>

      {/* Escrow visual roadmap */}
      <div className="mb-20 px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">How Escrow Payments Guarantee Quality Work</h2>
          <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto mt-2 leading-relaxed">Zero upfront deposit risk for the client; zero unpaid task risk for the service provider.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:border-blue-300 transition-all duration-300">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center border mb-4 shrink-0 ${s.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm mb-1.5">{s.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Features Grid */}
      <div className="bg-white border-y border-slate-200/60 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500 animate-pulse" />
              Advanced AI Assisted Modules & Simulated Flow
            </h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto mt-2 leading-relaxed">Discover how our platform utilizes AI to optimize the task lifecycle.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="flex p-6 bg-slate-50 border border-slate-205 rounded-3xl gap-4 transition-all duration-300 hover:border-blue-200 hover:bg-white shadow-sm">
                  <div className="h-10 w-10 shrink-0 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm mb-1.5">{f.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="py-16 px-4 sm:px-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-extrabold text-center text-slate-900 mb-10 tracking-tight">Frequently Answered Safety Topics</h2>

        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2 leading-snug">
              <HelpCircle className="text-blue-600 h-4.5 w-4.5 shrink-0" />
              What happens if the service completed is not up to the standard or delayed?
            </h4>
            <p className="text-xs text-slate-500 mt-2.5 leading-relaxed font-medium">
              If a disagreement cannot be solved directly, the Client or the Provider can toggle the <b>"Dispute"</b> status in their dashboard. This locks the held funds securely, preventing release or refund. The <b>System Moderator</b> then reviews the records, checks the logs, and arbitrates.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2 leading-snug">
              <HelpCircle className="text-amber-500 h-4.5 w-4.5 shrink-0" />
              How do the Verified Badges work?
            </h4>
            <p className="text-xs text-slate-500 mt-2.5 leading-relaxed font-medium">
              Service professionals submit their state identity documents or vocational certificates in their profile. The admin reviews these uploads from the <b>Admin Panel</b> to grant a verified checkmark badge, dramatically improving the professional's bidding conversion rate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
