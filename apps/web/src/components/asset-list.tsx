import { formatCurrency } from "@/lib/api";
import type { Asset } from "@/lib/types";

export function AssetList({ assets, compact = false, showOwner = false, onEdit }: { assets: Asset[]; compact?: boolean; showOwner?: boolean; onEdit?: (asset: Asset) => void }) {
  if (assets.length === 0) return <div className="empty-state"><strong>Δεν υπάρχουν έργα ακόμη.</strong><p>Το περιεχόμενο αυτού του demo workspace εμφανίζεται εδώ.</p></div>;
  return <div className={`asset-list ${compact ? "compact" : ""}`}>
    {assets.map((asset) => <article className="asset-row" key={asset.id}>
      <div className={`asset-symbol asset-${asset.type.toLowerCase()}`}>{asset.typeLabel.charAt(0)}</div>
      <div className="asset-main"><strong>{asset.name}</strong><span>{showOwner && asset.ownerName ? `${asset.ownerName} · ` : ""}{asset.typeLabel}{asset.url ? ` · ${asset.url.replace(/^https?:\/\//, "")}` : ""}</span></div>
      <div className="asset-package"><span>Πακέτο</span><strong>{asset.packageName ?? "Χωρίς πακέτο"}</strong></div>
      <div className="asset-price"><strong>{asset.monthlyPrice != null ? formatCurrency(asset.monthlyPrice) : "—"}</strong><span>{asset.monthlyPrice != null ? "/ μήνα" : ""}</span></div>
      <span className="status-pill"><i />{asset.status}</span>
      {onEdit && <button className="row-action" onClick={() => onEdit(asset)} aria-label={`Επεξεργασία ${asset.name}`}>•••</button>}
    </article>)}
  </div>;
}
