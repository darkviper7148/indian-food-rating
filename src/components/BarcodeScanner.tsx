"use client";

import { useEffect, useRef, useState } from "react";
import { X, ScanLine, CameraOff, AlertTriangle } from "lucide-react";

interface BarcodeScannerProps {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}

const SCANNER_ELEMENT_ID = "barcode-scanner-viewport";

type ScannerState = "requesting_permission" | "scanning" | "denied" | "error";

export default function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const [state, setState] = useState<ScannerState>("requesting_permission");
  const [errorMessage, setErrorMessage] = useState<string>("");
  // html5-qrcode instance lives across renders without triggering re-renders itself.
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const hasDetectedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        // Dynamic import: html5-qrcode touches `navigator`/`document` and
        // must never be pulled into a server-rendered bundle.
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;

        const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID, { verbose: false });
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 260, height: 160 },
            aspectRatio: 1.6,
          },
          (decodedText) => {
            if (hasDetectedRef.current) return;
            hasDetectedRef.current = true;
            onDetected(decodedText);
          },
          () => {
            // Per-frame "no code found" callback — expected constantly, ignore.
          }
        );

        if (!cancelled) setState("scanning");
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        const isPermissionIssue = /permission|NotAllowedError|denied/i.test(message);
        setState(isPermissionIssue ? "denied" : "error");
        setErrorMessage(
          isPermissionIssue
            ? "Camera access was denied. Enable camera permission for this site in your browser settings and try again."
            : "Couldn't start the camera. Your device or browser may not support barcode scanning here."
        );
      }
    }

    start();

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      if (scanner) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {
            /* scanner may already be stopped — safe to ignore */
          });
      }
    };
  }, [onDetected]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-masala">
      <header className="flex items-center justify-between px-5 py-4 text-papad">
        <div className="flex items-center gap-2">
          <ScanLine size={20} className="text-turmeric" />
          <h2 className="font-display text-lg">Scan a barcode</h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Close scanner"
          className="rounded-full p-2 text-papad/80 transition hover:bg-white/10 hover:text-papad"
        >
          <X size={22} />
        </button>
      </header>

      <div className="relative mx-5 flex-1 overflow-hidden rounded-card">
        <div id={SCANNER_ELEMENT_ID} className="h-full w-full [&>video]:h-full [&>video]:w-full [&>video]:object-cover" />

        {state === "requesting_permission" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-masala/90 text-papad">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-papad/30 border-t-turmeric" />
            <p className="text-sm text-papad/80">Requesting camera access…</p>
          </div>
        )}

        {(state === "denied" || state === "error") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-masala/95 px-8 text-center text-papad">
            {state === "denied" ? (
              <CameraOff size={36} className="text-turmeric" />
            ) : (
              <AlertTriangle size={36} className="text-turmeric" />
            )}
            <p className="text-sm text-papad/85">{errorMessage}</p>
            <button
              onClick={onClose}
              className="rounded-full bg-turmeric px-5 py-2 text-sm font-semibold text-masala"
            >
              Search by name instead
            </button>
          </div>
        )}

        {state === "scanning" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-40 w-64 rounded-2xl border-2 border-turmeric/90 shadow-[0_0_0_9999px_rgba(36,30,23,0.45)]" />
          </div>
        )}
      </div>

      <p className="px-6 py-5 text-center text-sm text-papad/70">
        Hold steady and center the barcode inside the frame.
      </p>
    </div>
  );
}
