"use client";

import { useCallback, useEffect, useState } from "react";
import { Leaf, ScanBarcode } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import BarcodeScanner from "@/components/BarcodeScanner";
import ProductCard from "@/components/ProductCard";
import NutrientBreakdown from "@/components/NutrientBreakdown";
import AlternativesSection from "@/components/AlternativesSection";
import { ProductSkeleton, EmptyState, NotFoundState, ErrorState } from "@/components/StateViews";
import {
  getProductByBarcode,
  getAlternatives,
  searchProducts,
  prefetchPopularProducts,
  FoodServiceError,
} from "@/lib/foodService";
import type { AppState, ScoredProduct } from "@/lib/types";

// EAN-8 / UPC-A / EAN-13 / ITF-14 all fall in this digit-length range —
// good enough to distinguish "typed a barcode" from "typed a product name".
const BARCODE_PATTERN = /^\d{8,14}$/;

export default function HomePage() {
  const [state, setState] = useState<AppState>({ status: "idle" });
  const [scannerOpen, setScannerOpen] = useState(false);
  const [offlineNotice, setOfflineNotice] = useState(false);

  // Warm the server-side product cache for popular Indian packaged foods
  // as soon as the app loads, so the first real lookup of the session is
  // more likely to already be a cache hit.
  useEffect(() => {
    prefetchPopularProducts();
  }, []);

  const loadProduct = useCallback(async (barcode: string, label: string) => {
    setState({ status: "loading" });
    setOfflineNotice(false);
    try {
      const { product, usedFallback } = await getProductByBarcode(barcode);
      if (!product) {
        setState({ status: "not_found", query: label });
        return;
      }
      setOfflineNotice(usedFallback);
      setState({
        status: "success",
        product,
        alternatives: getAlternatives(product),
      });
    } catch (err) {
      const message =
        err instanceof FoodServiceError
          ? err.message
          : "Unexpected error while looking up this product. Check your connection and try again.";
      setState({ status: "error", message });
    }
  }, []);

  const handleSelectFromSearch = useCallback((product: ScoredProduct) => {
    setOfflineNotice(product.source === "mock");
    setState({
      status: "success",
      product,
      alternatives: getAlternatives(product),
    });
  }, []);

  const handleBarcodeDetected = useCallback(
    (barcode: string) => {
      setScannerOpen(false);
      loadProduct(barcode, barcode);
    },
    [loadProduct]
  );

  // Enter-in-the-search-box handler: a numeric, barcode-length query goes
  // straight to a barcode lookup (same path as a scan); free text runs a
  // full search and jumps to the best match, or NotFoundState if nothing
  // comes back — either way the user never has to click a dropdown item.
  const handleSubmitQuery = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) return;

      if (BARCODE_PATTERN.test(trimmed)) {
        loadProduct(trimmed, trimmed);
        return;
      }

      setState({ status: "loading" });
      setOfflineNotice(false);
      try {
        const { results, usedFallback } = await searchProducts(trimmed);
        if (results.length === 0) {
          setState({ status: "not_found", query: trimmed });
          return;
        }
        setOfflineNotice(usedFallback);
        setState({
          status: "success",
          product: results[0],
          alternatives: getAlternatives(results[0]),
        });
      } catch {
        setState({
          status: "error",
          message: "Unexpected error while searching. Check your connection and try again.",
        });
      }
    },
    [loadProduct]
  );

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-16">
      <header className="flex items-center gap-2 pb-5 pt-8">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-curry text-papad">
          <Leaf size={18} />
        </div>
        <div>
          <h1 className="font-display text-lg leading-tight text-masala">NutriScore IN</h1>
          <p className="text-xs text-masala-300">Know what&apos;s really in your food</p>
        </div>
      </header>

      <SearchBar
        onSelectProduct={handleSelectFromSearch}
        onOpenScanner={() => setScannerOpen(true)}
        onSubmitQuery={handleSubmitQuery}
      />

      <button
        onClick={() => setScannerOpen(true)}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-masala-300/50 py-3 text-sm font-medium text-masala-500 transition hover:border-turmeric hover:text-masala md:hidden"
      >
        <ScanBarcode size={16} />
        Or scan a product barcode
      </button>

      <section className="mt-6 space-y-4">
        {offlineNotice && state.status === "success" && (
          <p className="rounded-xl bg-turmeric-100 px-4 py-2.5 text-xs text-masala-700">
            Showing offline/reference data for this product — live Open Food Facts data wasn&apos;t available.
          </p>
        )}

        {state.status === "idle" && <EmptyState />}
        {state.status === "loading" && <ProductSkeleton />}
        {state.status === "not_found" && <NotFoundState query={state.query} />}
        {state.status === "error" && (
          <ErrorState message={state.message} onRetry={() => setState({ status: "idle" })} />
        )}

        {state.status === "success" && (
          <>
            <ProductCard product={state.product} />
            <NutrientBreakdown product={state.product} />
            <AlternativesSection
              product={state.product}
              alternatives={state.alternatives}
              onSelect={(alt) =>
                setState({ status: "success", product: alt, alternatives: getAlternatives(alt) })
              }
            />
          </>
        )}
      </section>

      {scannerOpen && (
        <BarcodeScanner onDetected={handleBarcodeDetected} onClose={() => setScannerOpen(false)} />
      )}
    </main>
  );
}
