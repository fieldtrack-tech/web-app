"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, User, Receipt } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSearch } from "@/hooks/queries/useEmployees";
import { formatCurrency } from "@/lib/utils";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: results, isLoading } = useSearch(debouncedQuery);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const hasResults =
    (results?.employees?.length ?? 0) > 0 || (results?.expenses?.length ?? 0) > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
        <input
          type="text"
          className="input pl-10 pr-8 h-10 w-full text-sm"
          placeholder="Search employees, expenses…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => query.length > 0 && setIsOpen(true)}
        />
        {query && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
            onClick={() => {
              setQuery("");
              setDebouncedQuery("");
              setIsOpen(false);
            }}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && debouncedQuery.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container rounded-xl shadow-lg border border-outline-variant z-50 max-h-80 overflow-auto">
          {isLoading && (
            <div className="p-4 text-xs text-on-surface-variant text-center">
              Searching…
            </div>
          )}

          {!isLoading && !hasResults && (
            <div className="p-4 text-xs text-on-surface-variant text-center">
              No results for &ldquo;{debouncedQuery}&rdquo;
            </div>
          )}

          {results?.employees && results.employees.length > 0 && (
            <div>
              <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                Employees
              </div>
              {results.employees.map((emp) => (
                <button
                  key={emp.id}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-surface-container-high transition-colors"
                  onClick={() => {
                    router.push(`/admin/employees/${emp.id}`);
                    setIsOpen(false);
                    setQuery("");
                  }}
                >
                  <User className="w-4 h-4 text-on-surface-variant shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-on-surface truncate">
                      {emp.name}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {emp.employee_code ?? "No code"} · {emp.is_active ? "Active" : "Inactive"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {results?.expenses && results.expenses.length > 0 && (
            <div>
              <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant border-t border-outline-variant">
                Expenses
              </div>
              {results.expenses.map((exp) => (
                <button
                  key={exp.id}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-surface-container-high transition-colors"
                  onClick={() => {
                    router.push("/admin/expenses");
                    setIsOpen(false);
                    setQuery("");
                  }}
                >
                  <Receipt className="w-4 h-4 text-on-surface-variant shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-on-surface truncate">
                      {exp.description}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {formatCurrency(exp.amount)} · {exp.status} · {exp.employee_name ?? "Unknown"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
