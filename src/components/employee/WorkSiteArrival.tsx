"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fieldApi, formatPay } from "@/lib/api/field-operations";
import { COMPANY_TIMEZONE } from "@/lib/attendance-selfie";
import { capturePreciseLocation } from "@/lib/browser-location";

export function WorkSiteArrival() {
  const [siteId, setSiteId] = useState("");
  const mounted = useRef(false);
  const queryClient = useQueryClient();
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const sites = useQuery({ queryKey: ["field", "sites"], queryFn: fieldApi.sites });
  const activeSites = (sites.data ?? []).filter((site) => site.is_active);
  const arrival = useMutation({
    mutationFn: async (id: string) => {
      const fix = await capturePreciseLocation();
      if (!mounted.current) throw new Error("The active shift changed. Confirm arrival again.");
      return fieldApi.reach(id, fix);
    },
    retry: false,
    meta: { suppressGlobalError: true },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["field", "my-report"] }),
  });
  const arrivedSite = activeSites.find((site) => site.id === arrival.data?.site_id);
  const selectedSite = activeSites.find((site) => site.id === siteId);

  return (
    <section className="card space-y-3">
      <h2 className="font-semibold text-on-surface">Confirm arrival at a work site</h2>
      {sites.isLoading && <p>Loading work sites…</p>}
      {sites.error && <p className="text-error" role="alert">{sites.error.message}</p>}
      {sites.data && !activeSites.length && <p className="text-sm text-on-surface-variant">Your company has no active work sites.</p>}
      {activeSites.length > 0 && (
        <form className="flex flex-wrap items-end gap-3" onSubmit={(event) => {
          event.preventDefault();
          if (selectedSite) arrival.mutate(selectedSite.id);
        }}>
          <label className="grow">
            Work site
            <select className="input block w-full" value={siteId} required disabled={arrival.isPending} onChange={(event) => {
              setSiteId(event.target.value);
              arrival.reset();
            }}>
              <option value="">Select a site</option>
              {activeSites.map((site) => <option value={site.id} key={site.id}>{site.name}</option>)}
            </select>
          </label>
          <button className="btn-primary" disabled={!selectedSite || arrival.isPending}>
            {arrival.isPending ? "Checking GPS…" : "I reached this site"}
          </button>
        </form>
      )}
      {arrival.error && <p className="text-error" role="alert">{arrival.error.message}</p>}
      {arrival.data && (
        <p role="status" className="text-sm text-on-surface">
          Arrival verified at {arrivedSite?.name ?? "the selected site"} at {new Date(arrival.data.arrived_at).toLocaleTimeString(undefined, { timeZone: COMPANY_TIMEZONE })}.
          {arrival.data.payable === false
            ? " A payable repeat visit requires a new distant departure and return."
            : ` Visit pay ${formatPay(arrival.data.amount_minor, arrival.data.currency)}.`}
        </p>
      )}
    </section>
  );
}
