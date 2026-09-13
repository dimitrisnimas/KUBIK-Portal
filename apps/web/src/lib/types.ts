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
  packageName: string | null;
  monthlyPrice: number | null;
};

export type Dashboard = {
  role: DemoRole;
  assetCount: number;
  activeAssetCount: number;
  clientCount: number;
  monthlyTotal: number;
  recentAssets: Asset[];
};
