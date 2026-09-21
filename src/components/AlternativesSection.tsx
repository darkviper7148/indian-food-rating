import { ArrowRight, Sparkles } from "lucide-react";
import { GRADE_HEX } from "@/lib/calculateNutriScore";
import type { ScoredProduct } from "@/lib/types";

interface AlternativesSectionProps {
  product: ScoredProduct;
  alternatives: ScoredProduct[];
  onSelect: (product: ScoredProduct) => void;
}

export default function AlternativesSection({
  product,
  alternatives,
  onSelect,
}: AlternativesSectionProps) {
  if (product.grade !== "d" && product.grade !== "e") return null;
  if (alternatives.length === 0) return null;

  return (
    <div className="rounded-card border border-curry/20 bg-curry-100/50 p-5">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles size={18} className="text-curry" />
        <h3 className="font-display text-lg text-masala">Better alternatives</h3>
      </div>
      <p className="mb-4 text-sm text-masala-500">
        These score higher in the same category — worth a look next time you're shopping.
      </p>

      <div className="space-y-2.5">
        {alternatives.map((alt) => (
          <button
            key={alt.id}
            onClick={() => onSelect(alt)}
            className="flex w-full items-center gap-3 rounded-xl border border-papad-300 bg-white px-4 py-3 text-left transition hover:border-curry/40 hover:shadow-soft"
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
              style={{ backgroundColor: GRADE_HEX[alt.grade] }}
            >
              {alt.grade.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-masala">{alt.name}</p>
              <p className="truncate text-xs text-masala-300">{alt.brand}</p>
            </div>
            <ArrowRight size={16} className="shrink-0 text-masala-300" />
          </button>
        ))}
      </div>
    </div>
  );
}
