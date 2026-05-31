/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = "client" | "provider" | "admin";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar: string;
  balance: number; // Simulated escrow/payment wallet balance
  // For Providers
  skills?: string[];
  bio?: string;
  rating?: number;
  completedJobsCount?: number;
  hourlyRate?: number;
  isVerified?: boolean;
  verificationStatus?: "unverified" | "pending" | "verified" | "rejected";
  idDocumentUrl?: string;
  certificateUrl?: string;
  portfolioUrl?: string;
  reviews?: Review[];
}

export interface Review {
  id: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export type JobStatus = "open" | "hired" | "in_progress" | "completed" | "disputed" | "cancelled";

export interface Job {
  id: string;
  clientId: string;
  clientName: string;
  clientAvatar: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  location: string;
  status: JobStatus;
  createdAt: string;
  tags?: string[];
}

export type BidStatus = "pending" | "accepted" | "rejected";

export interface Bid {
  id: string;
  jobId: string;
  jobTitle: string;
  providerId: string;
  providerName: string;
  providerAvatar: string;
  providerRating: number;
  isProviderVerified: boolean;
  quoteAmount: number;
  timeline: string; // e.g., "5 days", "2 weeks"
  message: string;
  status: BidStatus;
  createdAt: string;
}

export type EscrowStatus = "created" | "paid" | "in_progress" | "milestone_released" | "completed" | "disputed" | "refunded";

export interface Milestone {
  id: string;
  title: string;
  amount: number;
  status: "pending" | "in_escrow" | "released";
}

export interface Contract {
  id: string;
  jobId: string;
  jobTitle: string;
  clientId: string;
  clientName: string;
  providerId: string;
  providerName: string;
  escrowAmount: number;
  status: EscrowStatus;
  milestones: Milestone[];
  createdAt: string;
  disputeReason?: string;
  disputeResolvedBy?: string;
}

export interface ChatMessage {
  id: string;
  jobId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  receiverId: string;
  content: string;
  createdAt: string;
}

export interface DashboardStats {
  totalJobsPosted: number;
  totalBidsReceived: number;
  totalTransactions: number;
  escrowLockedAmount: number;
}
