"use client";

import { useState } from "react";
import { useCreateEmployee } from "@/hooks/queries/useEmployees";
import { Spinner } from "@/components/ui";

function randCode() {
  return `EMP${Date.now().toString(36).toUpperCase()}`;
}

export function TriggerEventCard() {
  const createEmployee = useCreateEmployee();
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function trigger() {
    setMessage(null);
    try {
      await createEmployee.mutateAsync({
        name,
        employee_code: randCode(),
      });
      setMessage("Triggered employee.created event via employee creation.");
      setName("");
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Failed to trigger event");
    }
  }

  return (
    <div className="card space-y-3">
      <h3 className="font-manrope font-bold text-on-surface">Trigger Event</h3>
      <p className="text-xs text-on-surface-variant">Creates an employee to trigger webhook events.</p>
      <input className="input w-full" value={name} onChange={(e) => setName(e.target.value)} placeholder="Employee name" />
      <button className="btn-primary" onClick={trigger} disabled={createEmployee.isPending || !name}>
        {createEmployee.isPending ? <Spinner size="sm" /> : null}
        Trigger employee.created
      </button>
      {message ? <p className="text-xs text-on-surface-variant">{message}</p> : null}
    </div>
  );
}
