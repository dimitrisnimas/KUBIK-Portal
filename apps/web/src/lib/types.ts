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
  clientCount: number;
  monthlyTotal: number;
  recentAssets: Asset[];
};
