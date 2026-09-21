import { AlertTriangle, OctagonAlert } from "lucide-react";
import type { ScoredProduct } from "@/lib/types";

interface Row {
  label: string;
  per100g: string;
  perServing: string;
}

function buildRows(product: ScoredProduct): Row[] {
  const { nutrients, servingSizeGrams } = product;
  const factor = servingSizeGrams ? servingSizeGrams / 100 : null;
  const fmt = (value: number, unit: string, decimals = 1) =>
    factor !== null ? `${(value * factor).toFixed(decimals)}${unit}` : "—";

  return [
    { label: "Calories", per100g: `${Math.round(nutrients.energyKcal)} kcal`, perServing: factor ? `${Math.round(nutrients.energyKcal * factor)} kcal` : "—" },
    { label: "Total fat", per100g: `${nutrients.fat.toFixed(1)}g`, perServing: fmt(nutrients.fat, "g") },
    { label: "Saturated fat", per100g: `${nutrients.saturatedFat.toFixed(1)}g`, perServing: fmt(nutrients.saturatedFat, "g") },
    { label: "Total sugar", per100g: `${nutrients.sugars.toFixed(1)}g`, perServing: fmt(nutrients.sugars, "g") },
    { label: "Sodium", per100g: `${Math.round(nutrients.sodium * 1000)}mg`, perServing: factor ? `${Math.round(nutrients.sodium * 1000 * factor)}mg` : "—" },
    { label: "Protein", per100g: `${nutrients.protein.toFixed(1)}g`, perServing: fmt(nutrients.protein, "g") },
  ];
}

export default function NutrientBreakdown({ product }: { product: ScoredProduct }) {
  const rows = buildRows(product);

  return (
    <div className="rounded-card border border-papad-300 bg-white p-5 shadow-soft">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="font-display text-lg text-masala">Nutrition breakdown</h3>
        <span className="text-xs text-masala-300">
          Per serving: {product.servingSize ?? "not specified"}
        </span>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-masala-300">
            <th className="pb-2 font-medium">Nutrient</th>
            <th className="pb-2 font-medium text-right">Per 100g</th>
            <th className="pb-2 font-medium text-right">Per serving</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t border-papad-200">
              <td className="py-2.5 text-masala-700">{row.label}</td>
              <td className="py-2.5 text-right font-medium text-masala">{row.per100g}</td>
              <td className="py-2.5 text-right text-masala-500">{row.perServing}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {product.redFlags.length > 0 && (
        <div className="mt-5 space-y-2.5">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-masala-300">
            Things to watch
          </h4>
          {product.redFlags.map((flag) => (
            <div
              key={flag.type}
              className={`flex gap-2.5 rounded-xl border px-3.5 py-3 text-sm ${
                flag.severity === "danger"
                  ? "border-grade-e/25 bg-grade-e/5 text-masala-700"
                  : "border-turmeric/25 bg-turmeric-100/60 text-masala-700"
              }`}
            >
              {flag.severity === "danger" ? (
                <OctagonAlert size={18} className="mt-0.5 shrink-0 text-grade-e" />
              ) : (
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-turmeric-600" />
              )}
              <div>
                <p className="font-semibold">{flag.label}</p>
                <p className="text-masala-500">{flag.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
