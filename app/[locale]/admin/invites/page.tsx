"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Ticket,
  Loader2,
  Plus,
  Copy,
  Check,
  ToggleLeft,
  ToggleRight,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { apiRequest } from "@/lib/api-client";
import { useToast } from "@/contexts/ToastContext";

interface InviteCode {
  id: string;
  code: string;
  grant_tier: string;
  tier_duration_days: number | null;
  max_uses: number;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  note: string | null;
  created_at: string;
}

const TIER_OPTIONS = [
  { value: "FREE", label: "Free" },
  { value: "STARTER", label: "Starter" },
  { value: "PRO", label: "Pro" },
  { value: "ENTERPRISE", label: "Enterprise" },
];

const TIER_COLORS: Record<string, string> = {
  FREE: "bg-muted text-muted-foreground",
  STARTER: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  PRO: "bg-primary/10 text-primary",
  ENTERPRISE: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
};

function InvitesPageContent() {
  const t = useTranslations("admin");
  const { showSuccess, showError } = useToast();
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [requireInvite, setRequireInvite] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Create form state
  const [showForm, setShowForm] = useState(false);
  const [formCode, setFormCode] = useState("");
  const [formTier, setFormTier] = useState("FREE");
  const [formDuration, setFormDuration] = useState(30);
  const [formUnlimitedDuration, setFormUnlimitedDuration] = useState(false);
  const [formMaxUses, setFormMaxUses] = useState(1);
  const [formExpiresAt, setFormExpiresAt] = useState("");
  const [formNoExpiry, setFormNoExpiry] = useState(true);
  const [formNote, setFormNote] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchCodes = useCallback(async () => {
    try {
      const data = await apiRequest<{ codes: InviteCode[] }>("/api/admin/invites");
      setCodes(data.codes || []);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load codes");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const fetchConfig = useCallback(async () => {
    try {
      const data = await apiRequest<{ configs: Array<{ key: string; value: string }> }>(
        "/api/admin/system-config"
      );
      const inviteConfig = data.configs.find((c) => c.key === "require_invite_code");
      if (inviteConfig) {
        setRequireInvite(inviteConfig.value === "true");
      }
    } catch {
      // Ignore - use default
    }
  }, []);

  useEffect(() => {
    fetchCodes();
    fetchConfig();
  }, [fetchCodes, fetchConfig]);

  const toggleRequireInvite = async () => {
    setConfigLoading(true);
    try {
      const newValue = !requireInvite;
      await apiRequest("/api/admin/system-config", {
        method: "PUT",
        body: JSON.stringify({
          key: "require_invite_code",
          value: String(newValue),
        }),
      });
      setRequireInvite(newValue);
      showSuccess(`Invite requirement ${newValue ? "enabled" : "disabled"}`);
    } catch (err) {
      showError("Failed to update config");
    } finally {
      setConfigLoading(false);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const body: Record<string, unknown> = {
        grantTier: formTier,
        maxUses: formMaxUses,
        note: formNote || undefined,
      };
      if (formCode.trim()) body.code = formCode.trim();
      if (!formUnlimitedDuration) body.tierDurationDays = formDuration;
      else body.tierDurationDays = null;
      if (!formNoExpiry && formExpiresAt) body.expiresAt = formExpiresAt;

      await apiRequest("/api/admin/invites", {
        method: "POST",
        body: JSON.stringify(body),
      });

      // Reset form
      setFormCode("");
      setFormTier("FREE");
      setFormDuration(30);
      setFormUnlimitedDuration(false);
      setFormMaxUses(1);
      setFormExpiresAt("");
      setFormNoExpiry(true);
      setFormNote("");
      setShowForm(false);

      await fetchCodes();
      showSuccess("Invite code created");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to create code");
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (invite: InviteCode) => {
    try {
      await apiRequest(`/api/admin/invites/${invite.id}`, {
        method: "PUT",
        body: JSON.stringify({ is_active: !invite.is_active }),
      });
      await fetchCodes();
      showSuccess(`Code ${!invite.is_active ? "activated" : "deactivated"}`);
    } catch (err) {
      showError("Failed to update code");
    }
  };

  const deactivateCode = async (invite: InviteCode) => {
    if (!confirm(`Deactivate code "${invite.code}"?`)) return;
    try {
      await apiRequest(`/api/admin/invites/${invite.id}`, { method: "DELETE" });
      await fetchCodes();
      showSuccess("Code deactivated");
    } catch (err) {
      showError("Failed to deactivate code");
    }
  };

  const copyCode = (invite: InviteCode) => {
    navigator.clipboard.writeText(invite.code);
    setCopiedId(invite.id);
    setTimeout(() => setCopiedId(null), 2000);
    showSuccess("Code copied");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Ticket className="h-7 w-7 text-primary" />
          {t("invites.title", { defaultValue: "Invite Codes" })}
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t("invites.subtitle", { defaultValue: "Manage tier invite codes" })}
        </p>
      </div>

      {/* Require Invite Toggle */}
      <div className="card p-4 flex items-center justify-between">
        <div>
          <p className="font-medium text-foreground">Require Invite Code</p>
          <p className="text-sm text-muted-foreground">
            Force new users to use an invite code during registration
          </p>
        </div>
        <button
          onClick={toggleRequireInvite}
          disabled={configLoading}
          className="btn-primary min-w-[100px]"
        >
          {configLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : requireInvite ? (
            <>
              <ToggleRight className="h-5 w-5" />
              Enabled
            </>
          ) : (
            <>
              <ToggleLeft className="h-5 w-5" />
              Disabled
            </>
          )}
        </button>
      </div>

      {/* Create Button */}
      <button onClick={() => setShowForm(!showForm)} className="btn-primary">
        <Plus className="h-4 w-4" />
        {showForm ? "Cancel" : "Create Invite Code"}
      </button>

      {/* Create Form */}
      {showForm && (
        <div className="card p-6 space-y-4">
          <h3 className="text-lg font-semibold">New Invite Code</h3>
          {/* Code */}
          <div>
            <label className="label">Code (leave empty to auto-generate)</label>
            <input
              type="text"
              value={formCode}
              onChange={(e) => setFormCode(e.target.value)}
              placeholder="STOCK-XXXXXX"
              className="input"
            />
          </div>
          {/* Tier */}
          <div>
            <label className="label">Grant Tier</label>
            <select value={formTier} onChange={(e) => setFormTier(e.target.value)} className="input">
              {TIER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {/* Duration */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formUnlimitedDuration}
                onChange={(e) => setFormUnlimitedDuration(e.target.checked)}
              />
              <span>Unlimited duration</span>
            </label>
            {!formUnlimitedDuration && (
              <input
                type="number"
                value={formDuration}
                onChange={(e) => setFormDuration(Number(e.target.value))}
                placeholder="Duration in days"
                className="input mt-2"
              />
            )}
          </div>
          {/* Max Uses */}
          <div>
            <label className="label">Max Uses</label>
            <input
              type="number"
              value={formMaxUses}
              onChange={(e) => setFormMaxUses(Number(e.target.value))}
              min={1}
              className="input"
            />
          </div>
          {/* Expiry */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formNoExpiry}
                onChange={(e) => setFormNoExpiry(e.target.checked)}
              />
              <span>No expiry date</span>
            </label>
            {!formNoExpiry && (
              <input
                type="datetime-local"
                value={formExpiresAt}
                onChange={(e) => setFormExpiresAt(e.target.value)}
                className="input mt-2"
              />
            )}
          </div>
          {/* Note */}
          <div>
            <label className="label">Note (optional)</label>
            <textarea
              value={formNote}
              onChange={(e) => setFormNote(e.target.value)}
              className="input"
              rows={2}
            />
          </div>
          <button onClick={handleCreate} disabled={creating} className="btn-primary w-full">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Code"}
          </button>
        </div>
      )}

      {/* Codes List */}
      <div className="space-y-3">
        {codes.length === 0 ? (
          <div className="card p-8 text-center text-muted-foreground">No invite codes yet</div>
        ) : (
          codes.map((code) => (
            <div key={code.id} className="card p-4 flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <code className="font-mono font-bold text-lg">{code.code}</code>
                  <span className={`badge ${TIER_COLORS[code.grant_tier]}`}>{code.grant_tier}</span>
                  {!code.is_active && <span className="badge bg-muted">Inactive</span>}
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    Uses: {code.used_count} / {code.max_uses}
                  </p>
                  {code.tier_duration_days && <p>Duration: {code.tier_duration_days} days</p>}
                  {code.expires_at && <p>Expires: {new Date(code.expires_at).toLocaleString()}</p>}
                  {code.note && <p>Note: {code.note}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyCode(code)}
                  className="btn-secondary"
                  title="Copy code"
                >
                  {copiedId === code.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => toggleActive(code)}
                  className="btn-secondary"
                  title={code.is_active ? "Deactivate" : "Activate"}
                >
                  {code.is_active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                </button>
                <button
                  onClick={() => deactivateCode(code)}
                  className="btn-secondary text-destructive hover:bg-destructive/10"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function AdminInvitesPage() {
  return (
    <RequirePermission permission="invites:read">
      <InvitesPageContent />
    </RequirePermission>
  );
}
