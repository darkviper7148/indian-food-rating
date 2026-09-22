import { PackageSearch, WifiOff, SearchX, PlusCircle } from "lucide-react";

const OFF_BASE = process.env.NEXT_PUBLIC_OFF_API_BASE ?? "https://world.openfoodfacts.org";

export function ProductSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="rounded-card border border-papad-300 bg-white p-5 shadow-soft">
        <div className="flex items-start gap-4">
          <div className="h-20 w-20 shrink-0 rounded-2xl bg-papad-200" />
          <div className="flex-1 space-y-2.5">
            <div className="h-3 w-20 rounded bg-papad-200" />
            <div className="h-5 w-3/4 rounded bg-papad-200" />
            <div className="h-3 w-16 rounded bg-papad-200" />
          </div>
          <div className="h-14 w-14 shrink-0 rounded-full bg-papad-200" />
        </div>
      </div>
      <div className="rounded-card border border-papad-300 bg-white p-5 shadow-soft">
        <div className="mb-4 h-4 w-40 rounded bg-papad-200" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex justify-between border-t border-papad-100 py-3">
            <div className="h-3 w-24 rounded bg-papad-200" />
            <div className="h-3 w-12 rounded bg-papad-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-papad-300 px-6 py-14 text-center">
      <PackageSearch size={36} className="text-masala-300" />
      <p className="max-w-xs text-sm text-masala-500">
        Search a product or scan a barcode to see its Nutri-Score and ingredient breakdown.
      </p>
    </div>
  );
}

export function NotFoundState({ query }: { query: string }) {
  // A numeric, barcode-length query can prefill Open Food Facts' own "add
  // a product" form with the code; free-text queries can't, so those just
  // land on OFF's contribute entry point instead.
  const isBarcodeLike = /^\d{8,14}$/.test(query.trim());
  const addProductUrl = isBarcodeLike
    ? `${OFF_BASE}/cgi/product.pl?type=add&code=${encodeURIComponent(query.trim())}`
    : `${OFF_BASE}/`;

  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-papad-300 bg-white px-6 py-14 text-center shadow-soft">
      <SearchX size={36} className="text-masala-300" />
      <p className="font-display text-lg text-masala">No match for &ldquo;{query}&rdquo;</p>
      <p className="max-w-xs text-sm text-masala-500">
        This item isn&apos;t in Open Food Facts or our offline dataset yet. Try the brand
        name only, or scan the barcode directly.
      </p>
      <a
        href={addProductUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 flex items-center gap-2 rounded-full bg-curry px-5 py-2 text-sm font-semibold text-papad transition hover:bg-curry-600"
      >
        <PlusCircle size={16} />
        Add this product
      </a>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-grade-e/20 bg-grade-e/5 px-6 py-14 text-center">
      <WifiOff size={36} className="text-grade-e" />
      <p className="font-display text-lg text-masala">Something went wrong</p>
      <p className="max-w-xs text-sm text-masala-500">{message}</p>
      <button
        onClick={onRetry}
        className="mt-2 rounded-full bg-masala px-5 py-2 text-sm font-semibold text-papad hover:bg-masala-700"
      >
        Try again
      </button>
    </div>
  );
}
