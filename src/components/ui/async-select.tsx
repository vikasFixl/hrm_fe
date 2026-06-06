import React, { useState, useEffect, useRef } from "react";
import clsx from "clsx";
import { Search, Loader2, X } from "lucide-react";

interface AsyncSelectProps {
  value: string;
  onChange: (val: string) => void;
  fetchOptions: (query: string) => Promise<{ _id: string; email: string; name: string }[]>;
  placeholder?: string;
  disabled?: boolean;
}

export function AsyncSelect({ value, onChange, fetchOptions, placeholder = "Search by email...", disabled }: AsyncSelectProps) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<{ _id: string; email: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState("");
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    if (query.trim().length < 2) {
      setOptions([]);
      return;
    }
    
    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await fetchOptions(query);
        setOptions(results || []);
      } catch (err) {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query, fetchOptions, open]);

  const handleSelect = (opt: { _id: string; email: string; name: string }) => {
    onChange(opt._id);
    setSelectedLabel(`${opt.name} (${opt.email})`);
    setOpen(false);
    setQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSelectedLabel("");
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="async-select-wrapper" ref={wrapperRef} style={{ position: "relative" }}>
      <div 
        className={clsx("input", disabled && "disabled")} 
        style={{ display: "flex", alignItems: "center", cursor: disabled ? "not-allowed" : "pointer" }}
        onClick={() => {
          if (!disabled) setOpen(true);
        }}
      >
        {selectedLabel ? (
          <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13 }}>{selectedLabel}</span>
            <X size={14} style={{ color: "#94a3b8", cursor: "pointer" }} onClick={handleClear} />
          </div>
        ) : (
          <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", color: "#94a3b8" }}>
            <span style={{ fontSize: 13 }}>{placeholder}</span>
            <Search size={14} />
          </div>
        )}
      </div>

      {open && !disabled && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          marginTop: 4,
          background: "var(--card-bg)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          zIndex: 50,
          maxHeight: 250,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}>
          <div style={{ padding: 8, borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
            <Search size={14} color="#64748b" />
            <input 
              autoFocus
              placeholder="Type email to search..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 13, color: "var(--text)" }}
            />
            {loading && <Loader2 size={14} className="spin" color="#64748b" />}
          </div>
          
          <div style={{ overflowY: "auto", flex: 1 }}>
            {query.length < 2 ? (
              <div style={{ padding: "12px", textAlign: "center", fontSize: 12, color: "#64748b" }}>
                Type at least 2 characters to search
              </div>
            ) : options.length === 0 && !loading ? (
              <div style={{ padding: "12px", textAlign: "center", fontSize: 12, color: "#64748b" }}>
                No results found
              </div>
            ) : (
              options.map(opt => (
                <div 
                  key={opt._id}
                  onClick={() => handleSelect(opt)}
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    borderBottom: "1px solid var(--border)",
                    transition: "background 0.2s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--hover-bg)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{opt.name}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{opt.email}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
