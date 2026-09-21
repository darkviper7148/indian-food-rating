import Image from "next/image";
import { Info, Package2 } from "lucide-react";
import ScoreBadge from "./ScoreBadge";
import { GRADE_LABEL } from "@/lib/calculateNutriScore";
import type { ScoredProduct } from "@/lib/types";

export default function ProductCard({ product }: { product: ScoredProduct }) {
  return (
    <div className="rounded-card border border-papad-300 bg-white p-5 shadow-soft">
      <div className="flex items-start gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-papad-100">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="80px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-masala-300">
              <Package2 size={28} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-turmeric-600">
            {product.brand}
          </p>
          <h2 className="mt-0.5 font-display text-xl leading-snug text-masala">
            {product.name}
          </h2>
          <p className="mt-1 text-sm text-masala-300">
            {product.quantity ?? "Quantity not listed"}
          </p>
        </div>

        <ScoreBadge grade={product.grade} size="md" />
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl bg-papad-100 px-3.5 py-3 text-sm text-masala-500">
        <Info size={16} className="mt-0.5 shrink-0 text-masala-300" />
        <p>
          <span className="font-semibold text-masala">{GRADE_LABEL[product.grade]}.</span>{" "}
          {product.gradeSource === "provided"
            ? "Grade supplied directly by Open Food Facts."
            : "Grade calculated from this product's nutrient values (Open Food Facts had no official score)."}
        </p>
      </div>
    </div>
  );
}
