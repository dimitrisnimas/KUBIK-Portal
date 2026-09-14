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

export type PaymentDeclaration = {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  invoiceTotal: number;
  clientName: string;
  reference: string;
  submittedNote: string | null;
  submittedAt: string;
  status: "PendingReview" | "Approved" | "Rejected";
  statusLabel: string;
  reviewedAt: string | null;
  reviewerName: string | null;
  reviewNote: string | null;
};

export type InvoiceSummary = {
  id: string;
  number: string;
  issueDate: string;
  dueDate: string;
  status: "Unpaid" | "Paid";
  statusLabel: string;
  total: number;
  currency: string;
  isOverdue: boolean;
  paymentStatus: PaymentDeclaration["status"] | null;
};

export type InvoiceLine = {
  id: string;
  position: number;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type InvoiceDetail = Omit<InvoiceSummary, "isOverdue" | "paymentStatus"> & {
  paidAt: string | null;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  notes: string | null;
  clientName: string;
  lines: InvoiceLine[];
  paymentDeclarations: PaymentDeclaration[];
};
