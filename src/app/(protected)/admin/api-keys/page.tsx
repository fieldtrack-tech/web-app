"use client";

import { useMemo, useState } from "react";
import { ErrorBanner } from "@/components/ErrorBanner";
import { LoadingState } from "@/components/ui";
import {
  API_KEY_SCOPE_OPTIONS,
  useApiKeys,
  useCreateApiKey,
  useDeleteApiKey,
  useUpdateApiKey,
} from "@/hooks/queries/useApiKeys";
import { ApiError } from "@/types";
import type { ApiKeyScope } from "@/types";

function formatDate(value: string | null): string {
  if (!value) return "Never";
  return new Date(value).toLocaleString();
}

const SCOPE_LABELS: Record<ApiKeyScope, string> = {
  "read:employees": "Read employees",
  "read:sessions": "Read sessions",
  "write:expenses": "Write expenses",
  "admin:all": "Admin full access",
};

export default function AdminApiKeysPage() {
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<ApiKeyScope[]>(["read:employees"]);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<unknown>(null);

  const { data, isLoading, error } = useApiKeys();
  const createApiKey = useCreateApiKey();
  const updateApiKey = useUpdateApiKey();
  const deleteApiKey = useDeleteApiKey();

  const rows = useMemo(() => data ?? [], [data]);

  const canSubmit = name.trim().length >= 3 && scopes.length > 0 && !createApiKey.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-manrope text-3xl font-bold text-on-surface">API Keys</h2>
        <p className="text-sm text-on-surface-variant">
          Create and manage scoped API keys. Full keys are shown only once on creation.
        </p>
      </div>

      <section className="card space-y-4">
        <h3 className="font-semibold text-lg text-on-surface">Create new API key</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs text-on-surface-variant">Name</span>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Partner integration"
            />
          </label>

          <div className="space-y-1">
            <span className="text-xs text-on-surface-variant">Scopes</span>
            <div className="flex flex-wrap gap-2">
              {API_KEY_SCOPE_OPTIONS.map((scope) => {
                const checked = scopes.includes(scope);
                return (
                  <label key={scope} className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/40 px-3 py-1.5 text-xs">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (scope === "admin:all" && e.target.checked) {
                          setScopes(["admin:all"]);
                          return;
                        }
                        if (scope !== "admin:all" && e.target.checked) {
                          setScopes((prev) => prev.filter((s) => s !== "admin:all").concat(scope));
                          return;
                        }
                        setScopes((prev) => prev.filter((s) => s !== scope));
                      }}
                    />
                    {scope}
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <button
          className="btn-primary"
          disabled={!canSubmit}
          onClick={async () => {
            try {
              setActionError(null);
              const created = await createApiKey.mutateAsync({
                name: name.trim(),
                scopes,
              });
              setRevealedKey(created.key);
              setName("");
              setScopes(["read:employees"]);
            } catch (err) {
              setActionError(err);
            }
          }}
        >
          Create API key
        </button>

        {revealedKey ? (
          <div className="rounded-lg border border-warning/40 bg-warning-container/20 p-3">
            <p className="text-xs font-semibold text-on-surface">Copy this key now. It will not be shown again.</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <code className="block overflow-x-auto text-xs text-on-surface">{revealedKey}</code>
              <button
                className="btn-secondary h-8 px-2 text-xs"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(revealedKey);
                  } catch {
                    setActionError(new ApiError("Unable to copy API key. Please copy it manually.", 0));
                  }
                }}
              >
                Copy key
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {error ? <ErrorBanner error={error} /> : null}
      {actionError ? <ErrorBanner error={actionError} /> : null}
      {isLoading ? <LoadingState message="Loading API keys..." /> : null}

      {!isLoading ? (
        <section className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-on-surface-variant border-b border-outline-variant/20">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Preview</th>
                <th className="py-2 pr-4">Scopes</th>
                <th className="py-2 pr-4">Usage</th>
                <th className="py-2 pr-4">Last Used</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-outline-variant/10 align-top">
                  <td className="py-3 pr-4">{row.name}</td>
                  <td className="py-3 pr-4 font-mono text-xs">{row.key_preview}</td>
                  <td className="py-3 pr-4">
                    <div className="flex flex-wrap gap-1">
                      {row.scopes.map((scope) => (
                        <span key={scope} className="badge-neutral text-[10px]">{SCOPE_LABELS[scope]}</span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="text-xs text-on-surface-variant">
                      <div>Requests: {row.request_count}</div>
                      <div>Errors: {row.error_count}</div>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-xs text-on-surface-variant">{formatDate(row.last_used_at)}</td>
                  <td className="py-3 pr-4 text-xs">{row.active ? "Active" : "Revoked"}</td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <button
                        className="btn-secondary h-8 px-2 text-xs"
                        onClick={async () => {
                          try {
                            setActionError(null);
                            await updateApiKey.mutateAsync({
                              id: row.id,
                              active: !row.active,
                            });
                          } catch (err) {
                            setActionError(err);
                          }
                        }}
                        disabled={updateApiKey.isPending}
                      >
                        {row.active ? "Disable" : "Enable"}
                      </button>
                      <button
                        className="btn-secondary h-8 px-2 text-xs text-error"
                        onClick={async () => {
                          try {
                            setActionError(null);
                            await deleteApiKey.mutateAsync(row.id);
                          } catch (err) {
                            setActionError(err);
                          }
                        }}
                        disabled={deleteApiKey.isPending}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </div>
  );
}
