/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

import { 
  UserProfile, 
  Job, 
  Bid, 
  Contract, 
  ChatMessage, 
  UserRole,
  Review
} from "./src/types";

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Google Gen AI
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
  console.log("Gemini AI Client initialized successfully.");
} else {
  console.warn("WARNING: GEMINI_API_KEY is not defined. AI features will run in fallback simulation mode.");
}

// ------------------------------------------------------------------
// LOCAL DATA STORAGE & IN-MEMORY STATE (With File Backup)
// ------------------------------------------------------------------
const DB_FILE = path.join(process.cwd(), "data-store.json");

interface DatabaseSchema {
  users: UserProfile[];
  jobs: Job[];
  bids: Bid[];
  contracts: Contract[];
  messages: ChatMessage[];
}

// Initial Seed Data
const initialUsers: UserProfile[] = [
  {
    id: "user-client-1",
    name: "Anamika Mahor",
    email: "anamikamahor5@gmail.com",
    phone: "+91 98765 43210",
    role: "client",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    balance: 15000,
  },
  {
    id: "user-provider-1",
    name: "Rajesh Kumar",
    email: "rajesh.kumar@kaamwala.in",
    phone: "+91 91234 56789",
    role: "provider",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    balance: 2450,
    skills: ["Plumbing", "Fittings Installation", "Bathroom Renovation", "Emergency Leak Repair"],
    bio: "Certified plumber with 8+ years of experience in residential renovations, leak detection, and appliance fittings. Committed to fast response times and 100% customer satisfaction.",
    rating: 4.8,
    completedJobsCount: 42,
    hourlyRate: 350,
    isVerified: true,
    verificationStatus: "verified",
    portfolioUrl: "https://example.com/rajesh-plumbing",
    reviews: [
      { id: "rev-1", reviewerName: "Sanjay Gupta", rating: 5, comment: "Fixed my kitchen sink leakage in 15 minutes. Very professional!", createdAt: "2026-05-15T10:00:00Z" },
      { id: "rev-2", reviewerName: "Meera Sen", rating: 4, comment: "Polite and did a neat job with the bathroom pipe layout.", createdAt: "2026-05-20T14:30:00Z" }
    ]
  },
  {
    id: "user-provider-2",
    name: "Aman Preet",
    email: "aman.preet@kaamwala.in",
    phone: "+91 99887 76655",
    role: "provider",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    balance: 0,
    skills: ["Electrical Repairs", "Home Wiring", "Inverter Setup", "Smart Home Installation"],
    bio: "Licensed electrician specializing in diagnostic testing, custom smart-home automation setups, and full residential high-voltage re-wiring.",
    rating: 4.9,
    completedJobsCount: 18,
    hourlyRate: 400,
    isVerified: true,
    verificationStatus: "verified",
    portfolioUrl: "https://example.com/aman-electrical",
    reviews: [
      { id: "rev-3", reviewerName: "Rakesh Verma", rating: 5, comment: "Installed a multi-zone smart lighting panel perfectly. High-quality work.", createdAt: "2026-05-22T08:00:00Z" }
    ]
  },
  {
    id: "user-provider-3",
    name: "Siddharth Mehta",
    email: "sid.mehta@kaamwala.in",
    phone: "+91 95432 10987",
    role: "provider",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150",
    balance: 100,
    skills: ["Full Stack Development", "React/Node.js", "WordPress Design", "Mobile App Development"],
    bio: "Full-stack engineer with 5+ years of freelance experience building SaaS dashboards, elegant corporate websites, and interactive portals.",
    rating: 4.7,
    completedJobsCount: 29,
    hourlyRate: 800,
    isVerified: false,
    verificationStatus: "pending",
    portfolioUrl: "https://github.com/sidmehta",
    idDocumentUrl: "https://example.com/docs/aadhar_mock.pdf",
    certificateUrl: "https://example.com/docs/degree_mock.pdf",
    reviews: [
      { id: "rev-4", reviewerName: "Startup Inc", rating: 4, comment: "Delivered our landing page on time. Code was clean and extensible.", createdAt: "2026-05-18T18:00:00Z" }
    ]
  },
  {
    id: "user-provider-4",
    name: "Vikram Contractor",
    email: "vikram@creativebuild.in",
    phone: "+91 98888 77777",
    role: "provider",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    balance: 0,
    skills: ["Interior Architecture", "3D Blueprints", "False Ceiling Design", "Space Optimization"],
    bio: "Professional spatial designer and luxury interior renovator. I supply complete 3D renders, architectural blueprints, and oversee execution on-site.",
    rating: 4.5,
    completedJobsCount: 5,
    hourlyRate: 1200,
    isVerified: false,
    verificationStatus: "unverified",
    reviews: []
  },
  {
    id: "user-admin-1",
    name: "System Administrator",
    email: "admin@kaamwala.in",
    phone: "+91 99999 11111",
    role: "admin",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150",
    balance: 50000,
  }
];

const initialJobs: Job[] = [
  {
    id: "job-1",
    clientId: "user-client-1",
    clientName: "Anamika Mahor",
    clientAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    title: "Kitchen Piping Leak Repair & Faucet Install",
    description: "Our kitchen sink line shows a major leakage behind the cabinet board. The tap is also dripping. We need an experienced plumber to inspect, patch the pipe segment, and install a brand new modern sink faucet that we have already purchased.",
    category: "Plumbing & Repairs",
    budget: 1200,
    location: "Malviya Nagar, New Delhi",
    status: "open",
    createdAt: "2026-05-30T10:00:00Z",
    tags: ["Leakage", "Kitchen", "Faucet Installation", "Pipe Patching"]
  },
  {
    id: "job-2",
    clientId: "user-client-1",
    clientName: "Anamika Mahor",
    clientAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    title: "Complete 2BHK Home Wiring & Power Backup Setup",
    description: "We are renovating our 2BHK flat and require a complete wiring overhaul, including setting up circuit breaker panels, custom switchboards, and installing a new 150Ah dual-battery inverter system. Must ensure safe high-voltage grounding segments.",
    category: "Electrical Work",
    budget: 15000,
    location: "Koramangala, Bangalore",
    status: "open",
    createdAt: "2026-05-31T08:30:00Z",
    tags: ["Wiring", "Inverter Backup", "Circuit Panels", "Grounding"]
  }
];

const initialBids: Bid[] = [
  {
    id: "bid-1",
    jobId: "job-1",
    jobTitle: "Kitchen Piping Leak Repair & Faucet Install",
    providerId: "user-provider-1",
    providerName: "Rajesh Kumar",
    providerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    providerRating: 4.8,
    isProviderVerified: true,
    quoteAmount: 1100,
    timeline: "1 Day",
    message: "Hello Anamika! I can complete this kitchen job today. I specialize in kitchen plumbing and have worked on similar faucet installations. I will run a full leakage diagnostics on the pipes to make sure the fix is reliable and leak-proof. Standing by for your shortlisting!",
    status: "pending",
    createdAt: "2026-05-30T14:20:00Z"
  }
];

const initialContracts: Contract[] = [];
const initialMessages: ChatMessage[] = [];

let db: DatabaseSchema = {
  users: initialUsers,
  jobs: initialJobs,
  bids: initialBids,
  contracts: initialContracts,
  messages: initialMessages,
};

// Quick helper to read and write db
function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      // Merge with initial data to ensure baseline data exists
      db = {
        users: parsed.users || initialUsers,
        jobs: parsed.jobs || initialJobs,
        bids: parsed.bids || initialBids,
        contracts: parsed.contracts || initialContracts,
        messages: parsed.messages || initialMessages,
      };
    } else {
      saveDB();
    }
  } catch (err) {
    console.error("Error loading database file:", err);
  }
}

function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing database file:", err);
  }
}

loadDB();

// ------------------------------------------------------------------
// API ENDPOINTS
// ------------------------------------------------------------------

// 1. Get current simulated active user profile (Allows toggling role context easily)
app.get("/api/users", (req, res) => {
  res.json(db.users);
});

app.get("/api/users/:id", (req, res) => {
  const user = db.users.find(u => u.id === req.params.id);
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

app.put("/api/users/:id", (req, res) => {
  const index = db.users.findIndex(u => u.id === req.params.id);
  if (index !== -1) {
    db.users[index] = { ...db.users[index], ...req.body };
    saveDB();
    res.json(db.users[index]);
  } else {
    // If not found, lets create one (useful for newly simulated signups)
    const newUser: UserProfile = {
      id: req.params.id,
      name: req.body.name || "Anonymous User",
      email: req.body.email || "user@example.com",
      phone: req.body.phone || "",
      role: req.body.role || "client",
      avatar: req.body.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
      balance: req.body.balance !== undefined ? req.body.balance : 5000,
      skills: req.body.skills || [],
      bio: req.body.bio || "",
      rating: 5.0,
      completedJobsCount: 0,
      isVerified: false,
      verificationStatus: req.body.verificationStatus || "unverified"
    };
    db.users.push(newUser);
    saveDB();
    res.json(newUser);
  }
});

// Admin endpoint: update verification status
app.post("/api/admin/verify-provider", (req, res) => {
  const { providerId, status } = req.body; // status: 'verified' | 'rejected' | 'pending'
  const userIndex = db.users.findIndex(u => u.id === providerId);
  if (userIndex !== -1) {
    db.users[userIndex].verificationStatus = status;
    db.users[userIndex].isVerified = (status === "verified");
    
    // Auto add a verification message in chat or alerts if needed
    saveDB();
    res.json(db.users[userIndex]);
  } else {
    res.status(404).json({ error: "Provider profile not found" });
  }
});

// 2. Job Endpoints
app.get("/api/jobs", (req, res) => {
  res.json(db.jobs);
});

app.get("/api/jobs/:id", (req, res) => {
  const job = db.jobs.find(j => j.id === req.params.id);
  if (job) {
    res.json(job);
  } else {
    res.status(404).json({ error: "Job listing not found" });
  }
});

app.post("/api/jobs", (req, res) => {
  const { clientId, title, description, category, budget, location, tags } = req.body;
  if (!clientId || !title || !description || !category || !budget) {
    return res.status(400).json({ error: "Missing required job parameters" });
  }

  const client = db.users.find(u => u.id === clientId) || db.users[0];
  const newJob: Job = {
    id: `job-${Date.now()}`,
    clientId,
    clientName: client.name,
    clientAvatar: client.avatar,
    title,
    description,
    category,
    budget: Number(budget),
    location: location || "Remote / On-site",
    status: "open",
    createdAt: new Date().toISOString(),
    tags: tags || []
  };

  db.jobs.push(newJob);
  saveDB();
  res.status(201).json(newJob);
});

// 3. Bid Endpoints
app.get("/api/bids", (req, res) => {
  const { jobId, providerId } = req.query;
  let filtered = db.bids;
  if (jobId) {
    filtered = filtered.filter(b => b.jobId === jobId);
  }
  if (providerId) {
    filtered = filtered.filter(b => b.providerId === providerId);
  }
  res.json(filtered);
});

app.post("/api/bids", (req, res) => {
  const { jobId, providerId, quoteAmount, timeline, message } = req.body;
  if (!jobId || !providerId || !quoteAmount || !timeline) {
    return res.status(400).json({ error: "Missing bidding parameters" });
  }

  const job = db.jobs.find(j => j.id === jobId);
  const provider = db.users.find(u => u.id === providerId);
  if (!job || !provider) {
    return res.status(404).json({ error: "Job or Professional profile not found" });
  }

  const newBid: Bid = {
    id: `bid-${Date.now()}`,
    jobId,
    jobTitle: job.title,
    providerId,
    providerName: provider.name,
    providerAvatar: provider.avatar,
    providerRating: provider.rating || 5.0,
    isProviderVerified: !!provider.isVerified,
    quoteAmount: Number(quoteAmount),
    timeline,
    message: message || `Offering $${quoteAmount} over ${timeline}`,
    status: "pending",
    createdAt: new Date().toISOString()
  };

  db.bids.push(newBid);
  saveDB();
  res.status(201).json(newBid);
});

// Reject/Accept Bids and Initiate Contract (HIRE)
app.post("/api/bids/:id/accept", (req, res) => {
  const bidId = req.params.id;
  const { milestoneTitles } = req.body; // Array of proposed milestone titles
  const bid = db.bids.find(b => b.id === bidId);
  if (!bid) {
    return res.status(404).json({ error: "Bid not found" });
  }

  const job = db.jobs.find(j => j.id === bid.jobId);
  const client = db.users.find(u => u.id === job?.clientId);
  const provider = db.users.find(u => u.id === bid.providerId);

  if (!job || !client || !provider) {
    return res.status(404).json({ error: "Related job, client or provider profile not found" });
  }

  // 1. Mark bid accepted, others rejected
  bid.status = "accepted";
  db.bids.forEach(b => {
    if (b.jobId === bid.jobId && b.id !== bid.id) {
      b.status = "rejected";
    }
  });

  // 2. Mark job status as "hired" / "in_progress"
  job.status = "in_progress";

  // 3. Subtract client balance and transfer into Escrow pool
  const totalCost = bid.quoteAmount;
  if (client.balance < totalCost) {
    return res.status(400).json({ error: "Insufficient client wallet balance. Please add virtual funds." });
  }
  client.balance -= totalCost;

  // 4. Generate Milestones
  let milestones: any[] = [];
  if (milestoneTitles && milestoneTitles.length > 0) {
    const splitAmount = Math.floor(totalCost / milestoneTitles.length);
    milestones = milestoneTitles.map((title: string, index: number) => ({
      id: `m-${Date.now()}-${index}`,
      title,
      amount: index === milestoneTitles.length - 1 ? totalCost - (splitAmount * (milestoneTitles.length - 1)) : splitAmount,
      status: "in_escrow" // Paid upfront into escrow
    }));
  } else {
    // Default milestone is 100% completion
    milestones = [
      {
        id: `m-${Date.now()}-0`,
        title: "Project Milestone: Full Final Delivery",
        amount: totalCost,
        status: "in_escrow"
      }
    ];
  }

  // 5. Create Escrow Contract
  const newContract: Contract = {
    id: `contract-${Date.now()}`,
    jobId: job.id,
    jobTitle: job.title,
    clientId: client.id,
    clientName: client.name,
    providerId: provider.id,
    providerName: provider.name,
    escrowAmount: totalCost,
    status: "in_progress",
    milestones,
    createdAt: new Date().toISOString()
  };

  db.contracts.push(newContract);
  saveDB();
  res.json({ success: true, contract: newContract, bid });
});

// 4. Escrow & Contract Management
app.get("/api/contracts", (req, res) => {
  const { userId, role } = req.query;
  let list = db.contracts;
  if (userId && role === "client") {
    list = list.filter(c => c.clientId === userId);
  } else if (userId && role === "provider") {
    list = list.filter(c => c.providerId === userId);
  }
  res.json(list);
});

// Release a milestone (Client releases funds to Provider)
app.post("/api/contracts/:id/release-milestone", (req, res) => {
  const contractId = req.params.id;
  const { milestoneId } = req.body;
  const contract = db.contracts.find(c => c.id === contractId);
  if (!contract) {
    return res.status(404).json({ error: "Contract not found" });
  }

  const milestone = contract.milestones.find(m => m.id === milestoneId);
  if (!milestone) {
    return res.status(404).json({ error: "Milestone not found" });
  }

  if (milestone.status !== "in_escrow") {
    return res.status(400).json({ error: "Milestone is not held in escrow or already released." });
  }

  // 1. Release Milestone
  milestone.status = "released";

  // 2. Add funds to Provider's wallet balance
  const provider = db.users.find(u => u.id === contract.providerId);
  if (provider) {
    provider.balance += milestone.amount;
  }

  // Check if all milestones released to mark contract complete
  const allReleased = contract.milestones.every(m => m.status === "released");
  if (allReleased) {
    contract.status = "completed";
    
    // Mark related job as completed
    const job = db.jobs.find(j => j.id === contract.jobId);
    if (job) {
      job.status = "completed";
    }

    // Increment provider completed task count
    if (provider) {
      provider.completedJobsCount = (provider.completedJobsCount || 0) + 1;
    }
  } else {
    contract.status = "milestone_released";
  }

  saveDB();
  res.json({ success: true, contract });
});

// File a dispute (Can be triggered by either side, locks funds)
app.post("/api/contracts/:id/dispute", (req, res) => {
  const contractId = req.params.id;
  const { reason } = req.body;
  const contract = db.contracts.find(c => c.id === contractId);
  if (!contract) {
    return res.status(404).json({ error: "Contract not found" });
  }

  contract.status = "disputed";
  contract.disputeReason = reason || "Project scope disagreement or delayed milestones.";
  
  const job = db.jobs.find(j => j.id === contract.jobId);
  if (job) {
    job.status = "disputed";
  }

  saveDB();
  res.json({ success: true, contract });
});

// Admin panel action: Resolve a dispute (Refund Client OR Release to Provider)
app.post("/api/contracts/:id/resolve-dispute", (req, res) => {
  const contractId = req.params.id;
  const { resolution } = req.body; // 'refund_client' or 'payout_provider'
  const contract = db.contracts.find(c => c.id === contractId);
  if (!contract) {
    return res.status(404).json({ error: "Contract not found" });
  }

  if (contract.status !== "disputed") {
    return res.status(400).json({ error: "Contract is not in a disputed state." });
  }

  const client = db.users.find(u => u.id === contract.clientId);
  const provider = db.users.find(u => u.id === contract.providerId);

  // Calculate unreleased funds
  const unreleasedAmt = contract.milestones
    .filter(m => m.status === "in_escrow")
    .reduce((sum, m) => sum + m.amount, 0);

  if (resolution === "refund_client") {
    // Return all unreleased money back to client wallet
    if (client) {
      client.balance += unreleasedAmt;
    }
    contract.status = "refunded";
    contract.milestones.forEach(m => {
      if (m.status === "in_escrow") m.status = "pending"; // Released/returned back
    });
    
    const job = db.jobs.find(j => j.id === contract.jobId);
    if (job) {
      job.status = "cancelled";
    }
  } else if (resolution === "payout_provider") {
    // Force release all unreleased money to the provider wallet
    if (provider) {
      provider.balance += unreleasedAmt;
      provider.completedJobsCount = (provider.completedJobsCount || 0) + 1;
    }
    contract.status = "completed";
    contract.milestones.forEach(m => {
      if (m.status === "in_escrow") m.status = "released";
    });

    const job = db.jobs.find(j => j.id === contract.jobId);
    if (job) {
      job.status = "completed";
    }
  }

  contract.disputeResolvedBy = "Admin Decision Done";
  saveDB();
  res.json({ success: true, contract });
});

// 5. In-App Chat Messages
app.get("/api/messages", (req, res) => {
  const { jobId, user1, user2 } = req.query;
  let filtered = db.messages;
  if (jobId) {
    filtered = filtered.filter(m => m.jobId === jobId);
  }
  if (user1 && user2) {
    filtered = filtered.filter(m => 
      (m.senderId === user1 && m.receiverId === user2) || 
      (m.senderId === user2 && m.receiverId === user1)
    );
  }
  res.json(filtered);
});

app.post("/api/messages", (req, res) => {
  const { jobId, senderId, receiverId, content } = req.body;
  if (!jobId || !senderId || !receiverId || !content) {
    return res.status(400).json({ error: "Missing messaging parameters" });
  }

  const sender = db.users.find(u => u.id === senderId);
  if (!sender) {
    return res.status(404).json({ error: "Sender profile not found" });
  }

  const newMessage: ChatMessage = {
    id: `msg-${Date.now()}`,
    jobId,
    senderId,
    senderName: sender.name,
    senderRole: sender.role,
    receiverId,
    content,
    createdAt: new Date().toISOString()
  };

  db.messages.push(newMessage);
  saveDB();
  res.status(201).json(newMessage);
});

// Simulated reply helper: Let provider reply instantly with high-quality AI simulated message, OR generic replies
app.post("/api/messages/simulate-reply", async (req, res) => {
  const { jobId, senderId, receiverId, content } = req.body; // client sending to provider
  
  const clientUser = db.users.find(u => u.id === senderId); // client
  const providerUser = db.users.find(u => u.id === receiverId); // provider
  const job = db.jobs.find(j => j.id === jobId);

  if (!clientUser || !providerUser || !job) {
    return res.status(404).json({ error: "Simulated participant or job not found." });
  }

  // Send client message first
  const clientMsg: ChatMessage = {
    id: `msg-${Date.now()}-c`,
    jobId,
    senderId,
    senderName: clientUser.name,
    senderRole: "client",
    receiverId,
    content,
    createdAt: new Date().toISOString()
  };
  db.messages.push(clientMsg);

  // Draft dynamic response using Gemini, of fallback to mock
  let replyText = "";
  if (aiClient) {
    try {
      const prompt = `
        You are a service professional named "${providerUser.name}" answering a client named "${clientUser.name}" on KaamWala, a trusted home services platform.
        The client sent this message: "${content}"
        Regarding the job: "${job.title}" (Description: ${job.description}).
        My skills listed are: ${providerUser.skills?.join(", ")}. My professional bio is: "${providerUser.bio}".
        
        Write a professional, helpful, polite, and reassuring response to this message.
        Respond as "${providerUser.name}" directly. Maintain a warm and human tone.
        Keep it concise (2-4 sentences max). Do not include any meta placeholder or prefixes.
      `;
      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt
      });
      replyText = response.text?.trim() || "";
    } catch (e) {
      console.error("Gemini failed to simulate reply, using fallback", e);
    }
  }

  if (!replyText) {
    const fallbacks = [
      `Thanks for reaching out, ${clientUser.name}! I would love to perform this task for you and ensure the work is premium. When is a good time to start?`,
      `Hi ${clientUser.name}, absolutely! I have reviewed the job description and have the exact tools needed. Are you available for a quick verification discussion?`,
      `Hello! Yes, that sounds good. I can supply high-quality materials and can complete this well within your estimated timeline. Let me know if we can lock this in!`
    ];
    replyText = fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  // Create simulated provider reply
  const providerMsg: ChatMessage = {
    id: `msg-${Date.now() + 100}-p`,
    jobId,
    senderId: providerUser.id,
    senderName: providerUser.name,
    senderRole: "provider",
    receiverId: clientUser.id,
    content: replyText,
    createdAt: new Date(Date.now() + 2000).toISOString() // 2 seconds later
  };

  db.messages.push(providerMsg);
  saveDB();
  res.status(201).json({ clientMsg, providerMsg });
});

// Review Endpoints
app.post("/api/reviews", (req, res) => {
  const { providerId, reviewerName, rating, comment } = req.body;
  if (!providerId || !reviewerName || !rating || !comment) {
    return res.status(400).json({ error: "Missing review feedback data" });
  }

  const provider = db.users.find(u => u.id === providerId);
  if (!provider) {
    return res.status(404).json({ error: "Provider profile not found" });
  }

  const newReview: Review = {
    id: `rev-${Date.now()}`,
    reviewerName,
    rating: Number(rating),
    comment,
    createdAt: new Date().toISOString()
  };

  if (!provider.reviews) {
    provider.reviews = [];
  }
  provider.reviews.push(newReview);

  // Re-calculate rating
  const totalRatingPoints = provider.reviews.reduce((sum, r) => sum + r.rating, 0);
  provider.rating = Number((totalRatingPoints / provider.reviews.length).toFixed(1));

  saveDB();
  res.status(201).json(newReview);
});

// ------------------------------------------------------------------
// AI ASSISTED ENHANCER ENDPOINTS (Gemini powered)
// ------------------------------------------------------------------

// POST /api/ai/enhance-job
// Uses Gemini responseSchema configuration to auto-tag, improve scope, and advise budgets for a job post.
app.post("/api/ai/enhance-job", async (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: "Missing title or description to enhance" });
  }

  if (!aiClient) {
    // Mock simulation response if API key is not ready yet
    return res.json({
      enhancedTitle: `${title} (Professional Layout)`,
      enhancedDescription: `### Service Requirements\n${description}\n\n### Deliverables & Safe Grounding\n- 100% Quality Assurance Guarantee.\n- Cleanup post-visit completion.\n- Full safety testing of all fixtures.`,
      suggestedCategory: "Plumbing & Repairs",
      suggestedTags: ["Inspected", "Safe Fittings", "Leakage Fix"],
      recommendedMinBudget: 1500,
      recommendedMaxBudget: 2500,
      reasoning: "Suggested based on current service index standard average rates in modern cities."
    });
  }

  try {
    const prompt = `
      You are an AI Professional Operations Assistant for KaamWala, a trusted labor & skilled expert marketplace.
      A user wants to post a task with this tentative Title: "${title}" and Description: "${description}".
      Please analyze this job details and output a nicely-structured, enhanced professional job post.
      - Make the description highly informative, professional, with markdown headers for "Project Scope" and "Required Expert Skills".
      - Classify it into a logical category (e.g. "Plumbing & Repairs", "Electrical Work", "Home Architecture & Design", "App & Software Development", "Digital Marketing & SEO", "AC & Appliance Repair").
      - Provide 3-5 tags.
      - Estimate a fair market budget pricing advice in Indian Rupees (INR) with recommended minimum and maximum cost range.
    `;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            enhancedTitle: { type: Type.STRING, description: "A highly clear professional version with action words." },
            enhancedDescription: { type: Type.STRING, description: "Enhanced detailed description using professional markdown." },
            suggestedCategory: { type: Type.STRING, description: "One of the matched core categories." },
            suggestedTags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of searchable relevant tag strings." },
            recommendedMinBudget: { type: Type.INTEGER, description: "Recommended minimum reasonable pricing index." },
            recommendedMaxBudget: { type: Type.INTEGER, description: "Recommended maximum reasonable pricing index." },
            reasoning: { type: Type.STRING, description: "Why we recommended this range." }
          },
          required: ["enhancedTitle", "enhancedDescription", "suggestedCategory", "suggestedTags", "recommendedMinBudget", "recommendedMaxBudget", "reasoning"]
        }
      }
    });

    const parsedData = JSON.parse(response.text?.trim() || "{}");
    res.json(parsedData);
  } catch (err: any) {
    console.error("Gemini job enhancement error:", err);
    res.status(500).json({ error: "Failed to enhance job details via AI.", details: err.message });
  }
});

// POST /api/ai/suggest-bid
// Generates custom expert bid tailored to provider spec and job requirements
app.post("/api/ai/suggest-bid", async (req, res) => {
  const { jobId, providerId } = req.body;
  const job = db.jobs.find(j => j.id === jobId);
  const provider = db.users.find(u => u.id === providerId);

  if (!job || !provider) {
    return res.status(404).json({ error: "Job or Professional profile not found to suggest bid." });
  }

  if (!aiClient) {
    return res.json({
      amount: Math.round(job.budget * 0.95),
      timeline: "3 Days",
      message: `Dear ${job.clientName},\n\nI reviewed your task "${job.title}" and would love to help. With my skills in ${provider.skills?.slice(0,2).join(", ") || 'General repairs'}, I am highly confident I can complete this efficiently. Let's discuss details!`
    });
  }

  try {
    const prompt = `
      You are an elite bidding assistant for service providers on KaamWala.
      A provider named "${provider.name}" with skills: ${provider.skills?.join(", ")} and bio: "${provider.bio}" wants to bid on this job:
      - Title: "${job.title}"
      - Description: "${job.description}"
      - Budget limits: ₹${job.budget}
      
      Generate a professional proposal payload.
      Suggest a quote amount close to or slightly optimized compared to the client's budget ₹${job.budget} (e.g. ₹${Math.round(job.budget * 0.9)} to ₹${job.budget}).
      Suggest a realistic timeline (e.g. "2 Days", "1 Week").
      Write a compelling, respectful, and highly persuasive proposal bid message (1-2 short paragraphs) that outlines why "${provider.name}" is a great fit for "${job.title}".
    `;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.INTEGER, description: "Optimized specific Indian Rupee price recommendation." },
            timeline: { type: Type.STRING, description: "A standard duration period like '3 Days' or '5 Days' or '1 Week'." },
            message: { type: Type.STRING, description: "A tailored introduction, description of how the provider can execute, the tools they will bring, and a professional call to action." }
          },
          required: ["amount", "timeline", "message"]
        }
      }
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    res.json(parsed);
  } catch (err: any) {
    console.error("Gemini bid generation error:", err);
    res.status(500).json({ error: "Failed to generate proposal bid message via AI.", details: err.message });
  }
});

// POST /api/ai/match-jobs
// Scans active jobs and returns an AI matching rate / recommendations for a specific provider
app.post("/api/ai/match-jobs", async (req, res) => {
  const { providerId } = req.body;
  const provider = db.users.find(u => u.id === providerId);
  if (!provider) {
    return res.status(404).json({ error: "Professional profile not found." });
  }

  if (!aiClient) {
    // Simulation fallback matching
    const matches = db.jobs.map(job => {
      const isMatched = provider.skills?.some(s => 
        job.title.toLowerCase().includes(s.toLowerCase()) || 
        job.description.toLowerCase().includes(s.toLowerCase()) ||
        job.category.toLowerCase().includes(s.toLowerCase())
      );
      return {
        jobId: job.id,
        score: isMatched ? 92 : 45,
        reason: isMatched 
          ? `High matching score! Job category or description perfectly overlaps with your verified skills: ${provider.skills?.slice(0, 2).join(", ")}.`
          : "General job post matching index. Moderate skill alignment."
      };
    });
    return res.json({ matches });
  }

  try {
    const jobsSummary = db.jobs.map(j => ({ id: j.id, title: j.title, category: j.category, description: j.description }));
    const prompt = `
      You are an intelligent scheduler and dispatcher on KaamWala.
      We have a professional:
      - Skills: ${provider.skills?.join(", ")}
      - Bio: "${provider.bio}"
      
      We have these available job listings:
      ${JSON.stringify(jobsSummary, null, 2)}
      
      Analyze and find the best jobs matching this professional's expertise.
      For each job in the list, evaluate a matching score (0 to 100) and summarize the exact structural reason for this rating.
    `;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matches: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  jobId: { type: Type.STRING },
                  score: { type: Type.INTEGER, description: "Match percentage rating from 0 to 100." },
                  reason: { type: Type.STRING, description: "A detailed 1-sentence description detailing exact skill matches." }
                },
                required: ["jobId", "score", "reason"]
              }
            }
          },
          required: ["matches"]
        }
      }
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    res.json(parsed);
  } catch (err: any) {
    console.error("Gemini matching error:", err);
    res.status(500).json({ error: "Failed to fetch matches.", details: err.message });
  }
});

// ------------------------------------------------------------------
// VITE DEV SERVER AND PRODUCTION SERVING MIDDLEWARE
// ------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite development middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Setting up production static file serving...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`KaamWala full-stack server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
