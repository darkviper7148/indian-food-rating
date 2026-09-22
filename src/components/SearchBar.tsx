"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X, ScanBarcode } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { searchProducts } from "@/lib/foodService";
import { GRADE_HEX } from "@/lib/calculateNutriScore";
import type { ScoredProduct } from "@/lib/types";

interface SearchBarProps {
  onSelectProduct: (product: ScoredProduct) => void;
  onOpenScanner: () => void;
  /**
   * Fired when the user presses Enter in the input — for a numeric barcode
   * this should go straight to a barcode lookup, for free text it should
   * run a full search and surface the best match (or NotFoundState if
   * nothing turns up), without requiring a dropdown click.
   */
  onSubmitQuery: (query: string) => void;
}

export default function SearchBar({ onSelectProduct, onOpenScanner, onSubmitQuery }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ScoredProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 350);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsSearching(true);
    searchProducts(debouncedQuery, controller.signal)
      .then(({ results }) => {
        setSuggestions(results);
        setIsOpen(true);
      })
      .catch((err) => {
        if (err?.name !== "AbortError") setSuggestions([]);
      })
      .finally(() => setIsSearching(false));

    return () => controller.abort();
  }, [debouncedQuery]);

  const handleSubmit = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    abortRef.current?.abort();
    setIsOpen(false);
    onSubmitQuery(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-full border border-papad-300 bg-white px-4 py-3 shadow-soft focus-within:border-turmeric">
        <Search size={18} className="shrink-0 text-masala-300" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder="Search by product or brand — e.g. Maggi, Bhujia…"
          className="w-full bg-transparent text-sm text-masala placeholder:text-masala-300 focus:outline-none"
          aria-label="Search packaged foods"
          inputMode="search"
          enterKeyHint="search"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setSuggestions([]);
              setIsOpen(false);
            }}
            aria-label="Clear search"
            className="shrink-0 text-masala-300 hover:text-masala"
          >
            <X size={16} />
          </button>
        )}
        <button
          onClick={onOpenScanner}
          aria-label="Scan a barcode"
          className="flex shrink-0 items-center justify-center rounded-full bg-masala p-2 text-papad transition hover:bg-masala-700"
        >
          <ScanBarcode size={18} />
        </button>
      </div>

      {isOpen && (query.trim().length >= 2) && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-papad-300 bg-white shadow-soft">
          {isSearching && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-masala-300">
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-papad-300 border-t-turmeric" />
              Searching…
            </div>
          )}

          {!isSearching && suggestions.length === 0 && (
            <button
              onClick={handleSubmit}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-masala-500 hover:bg-papad-100"
            >
              <span>No matches yet — press Enter to search &ldquo;{query.trim()}&rdquo; anyway.</span>
            </button>
          )}

          {!isSearching &&
            suggestions.map((product) => (
              <button
                key={product.id}
                onClick={() => {
                  onSelectProduct(product);
                  setIsOpen(false);
                  setQuery(product.name);
                }}
                className="flex w-full items-center gap-3 border-b border-papad-100 px-4 py-3 text-left last:border-b-0 hover:bg-papad-100"
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: GRADE_HEX[product.grade] }}
                >
                  {product.grade.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-masala">{product.name}</p>
                  <p className="truncate text-xs text-masala-300">{product.brand}</p>
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
