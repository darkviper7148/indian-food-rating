"use client";

import { useMemo, useState } from "react";
import { X, PackagePlus, AlertCircle } from "lucide-react";
import ScoreBadge from "./ScoreBadge";
import { GRADE_LABEL } from "@/lib/calculateNutriScore";
import { previewContribution, saveContribution } from "@/lib/contributions";
import type { ContributionInput, ScoredProduct } from "@/lib/types";

interface ContributeProductModalProps {
    barcode: string;
    onClose: () => void;
    onSaved: (product: ScoredProduct) => void;
}

interface FormState {
    name: string;
    brand: string;
    barcode: string;
    energyKcal: string;
    saturatedFat: string;
    addedSugar: string;
    sodiumMg: string;
    protein: string;
    fiber: string;
    hasPalmOil: boolean;
}

const initialState = (barcode: string): FormState => ({
    name: "",
    brand: "",
    barcode,
    energyKcal: "",
    saturatedFat: "",
    addedSugar: "",
    sodiumMg: "",
    protein: "",
    fiber: "",
    hasPalmOil: false,
});

function toNumber(value: string): number {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? n : 0;
}

function formToInput(form: FormState): ContributionInput {
    return {
        barcode: form.barcode.trim(),
        name: form.name.trim(),
        brand: form.brand.trim(),
        energyKcal: toNumber(form.energyKcal),
        saturatedFat: toNumber(form.saturatedFat),
        addedSugar: toNumber(form.addedSugar),
        sodiumMg: toNumber(form.sodiumMg),
        protein: toNumber(form.protein),
        fiber: toNumber(form.fiber),
        hasPalmOil: form.hasPalmOil,
    };
}

const NUMERIC_FIELDS: { key: keyof FormState; label: string; unit: string; step?: string }[] = [
    { key: "energyKcal", label: "Energy", unit: "kcal" },
    { key: "saturatedFat", label: "Saturated fat", unit: "g", step: "0.1" },
    { key: "addedSugar", label: "Added sugar", unit: "g", step: "0.1" },
    { key: "sodiumMg", label: "Sodium", unit: "mg" },
    { key: "protein", label: "Protein", unit: "g", step: "0.1" },
    { key: "fiber", label: "Fiber", unit: "g", step: "0.1" },
];

export default function ContributeProductModal({
    barcode,
    onClose,
    onSaved,
}: ContributeProductModalProps) {
    const [form, setForm] = useState<FormState>(() => initialState(barcode));
    const [error, setError] = useState<string | null>(null);

    const preview = useMemo(() => previewContribution(formToInput(form)), [form]);

    const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const input = formToInput(form);

        if (!input.name) {
            setError("Product name is required.");
            return;
        }
        if (!input.barcode) {
            setError("Barcode is required.");
            return;
        }
        if (input.energyKcal <= 0) {
            setError("Enter an energy value greater than 0 kcal per 100g.");
            return;
        }

        setError(null);
        const scored = saveContribution(input);
        onSaved(scored);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-masala/60 p-0 sm:items-center sm:p-4">
            <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-card bg-papad shadow-soft sm:rounded-card">
                <header className="flex shrink-0 items-center justify-between border-b border-papad-300 bg-white px-5 py-4">
                    <div className="flex items-center gap-2">
                        <PackagePlus size={20} className="text-curry" />
                        <h2 className="font-display text-lg text-masala">Add this product</h2>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="rounded-full p-2 text-masala-300 transition hover:bg-papad-100 hover:text-masala"
                    >
                        <X size={20} />
                    </button>
                </header>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-5">
                    {/* Live score preview */}
                    <div className="mb-5 flex items-center gap-4 rounded-card border border-papad-300 bg-white p-4">
                        <ScoreBadge grade={preview.grade} size="md" />
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-masala">{GRADE_LABEL[preview.grade]}</p>
                            <p className="text-xs text-masala-300">
                                Updates live as you fill in nutrient values below.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-masala-300">
                                Product name
                            </label>
                            <input
                                value={form.name}
                                onChange={(e) => update("name", e.target.value)}
                                placeholder="e.g. Local Masala Chips"
                                required
                                className="w-full rounded-xl border border-papad-300 bg-white px-3.5 py-2.5 text-sm text-masala focus:border-turmeric focus:outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-masala-300">
                                    Brand
                                </label>
                                <input
                                    value={form.brand}
                                    onChange={(e) => update("brand", e.target.value)}
                                    placeholder="e.g. Local Foods Co."
                                    className="w-full rounded-xl border border-papad-300 bg-white px-3.5 py-2.5 text-sm text-masala focus:border-turmeric focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-masala-300">
                                    Barcode
                                </label>
                                <input
                                    value={form.barcode}
                                    onChange={(e) => update("barcode", e.target.value)}
                                    required
                                    className="w-full rounded-xl border border-papad-300 bg-white px-3.5 py-2.5 text-sm text-masala focus:border-turmeric focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-masala-300">
                                Per 100g nutrition
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                {NUMERIC_FIELDS.map(({ key, label, unit, step }) => (
                                    <div key={key}>
                                        <label className="mb-1 block text-xs text-masala-500">
                                            {label} <span className="text-masala-300">({unit})</span>
                                        </label>
                                        <input
                                            type="number"
                                            inputMode="decimal"
                                            min={0}
                                            step={step ?? "1"}
                                            value={form[key] as string}
                                            onChange={(e) => update(key, e.target.value)}
                                            placeholder="0"
                                            className="w-full rounded-xl border border-papad-300 bg-white px-3.5 py-2.5 text-sm text-masala focus:border-turmeric focus:outline-none"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <label className="flex items-center gap-2.5 rounded-xl border border-papad-300 bg-white px-3.5 py-3 text-sm text-masala-700">
                            <input
                                type="checkbox"
                                checked={form.hasPalmOil}
                                onChange={(e) => update("hasPalmOil", e.target.checked)}
                                className="h-4 w-4 rounded border-papad-300 text-curry focus:ring-turmeric"
                            />
                            Contains palm oil / hydrogenated vegetable oil
                        </label>

                        {error && (
                            <div className="flex items-start gap-2 rounded-xl border border-grade-e/25 bg-grade-e/5 px-3.5 py-3 text-sm text-masala-700">
                                <AlertCircle size={16} className="mt-0.5 shrink-0 text-grade-e" />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>
                </form>

                <footer className="shrink-0 border-t border-papad-300 bg-white px-5 py-4">
                    <button
                        onClick={handleSubmit}
                        className="w-full rounded-full bg-curry py-3 text-sm font-semibold text-papad transition hover:bg-curry-600"
                    >
                        Save &amp; view score
                    </button>
                    <p className="mt-2 text-center text-[11px] text-masala-300">
                        Saved on this device now — queued for community review once the backend is connected.
                    </p>
                </footer>
            </div>
        </div>
    );
}