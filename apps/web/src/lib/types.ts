export type DemoRole = "Client" | "Administrator";

export type Session = {
  workspaceId: string;
  role: DemoRole;
  displayName: string;
  email: string;
  expiresAt: string;
  csrfToken: string;
};

export type Asset = {
  id: string;
  name: string;
  type: string;
  typeLabel: string;
  status: string;
  url: string | null;
  servicePackageId: string | null;
  packageName: string | null;
  monthlyPrice: number | null;
  ownerName: string;
};

export type ServicePackage = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  monthlyPrice: number;
  currency: string;
  isActive: boolean;
  features: string[];
};

export type ServiceCategory = {
  id: string;
  name: string;
  color: string;
  displayOrder: number;
  isActive: boolean;
  packages: ServicePackage[];
};

export type Dashboard = {
  role: DemoRole;
  assetCount: number;
  activeAssetCount: number;
  openTicketCount: number;
  clientCount: number;
  monthlyTotal: number;
  recentAssets: Asset[];
};

export type BillingDecision = {
  id: string;
  decision: "Covered" | "Chargeable";
  decisionLabel: string;
  price: number | null;
  currency: string;
  note: string | null;
  reviewerName: string;
  decidedAt: string;
};

export type TicketSummary = {
  id: string;
  number: string;
  title: string;
  kind: string;
  kindLabel: string;
  priority: string;
  priorityLabel: string;
  status: string;
  statusLabel: string;
  assetName: string | null;
  updatedAt: string;
  messageCount: number;
  billingDecision: BillingDecision | null;
};

export type TicketMessage = {
  id: string;
  body: string;
  authorName: string;
  authorRole: DemoRole;
  createdAt: string;
};

export type TicketDetail = Omit<TicketSummary, "updatedAt" | "messageCount" | "billingDecision"> & {
  ownerName: string;
  createdAt: string;
  messages: TicketMessage[];
  billingDecisions: BillingDecision[];
};
