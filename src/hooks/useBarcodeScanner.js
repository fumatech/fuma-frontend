import { useEffect, useRef } from "react";

const DEFAULT_OPTIONS = {
    minLength: 3,
    maxDurationMs: 1000,
    interKeyResetMs: 300,
    pasteEnterWindowMs: 5000,
    duplicateCooldownMs: 200,
    allowManualInputEnter: false,
    manualInputMinLength: 3,
};

const BARCODE_LIKE_PATTERN = /^[A-Za-z0-9_-]+$/;

function useBarcodeScanner(onScan, options = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const bufferRef = useRef("");
    const startedAtRef = useRef(0);
    const lastKeyAtRef = useRef(0);
    const pastedValueRef = useRef("");
    const pastedAtRef = useRef(0);
    const lastScanRef = useRef({ value: "", at: 0 });

    useEffect(() => {
        if (typeof onScan !== "function") {
            return undefined;
        }

        const resetBuffer = () => {
            bufferRef.current = "";
            startedAtRef.current = 0;
            lastKeyAtRef.current = 0;
        };

        const scanIfValid = (value) => {
            const barcode = (value || "").trim();
            if (!barcode) {
                return;
            }

            const now = Date.now();
            const previous = lastScanRef.current;
            const isDuplicateWithinCooldown =
                previous.value === barcode &&
                now - previous.at <= opts.duplicateCooldownMs;

            if (isDuplicateWithinCooldown) {
                return;
            }

            lastScanRef.current = { value: barcode, at: now };
            onScan(barcode);
        };

        const handlePaste = (event) => {
            if (document.visibilityState !== "visible" || !document.hasFocus()) {
                return;
            }

            const pastedText = event?.clipboardData?.getData("text")?.trim() || "";
            if (!pastedText) {
                return;
            }

            pastedValueRef.current = pastedText;
            pastedAtRef.current = Date.now();
        };

        const handleKeydown = (event) => {
            if (document.visibilityState !== "visible" || !document.hasFocus()) {
                return;
            }

            if (event.isComposing || event.ctrlKey || event.altKey || event.metaKey) {
                return;
            }

            const key = event.key;
            const now = Date.now();
            const interval = lastKeyAtRef.current ? now - lastKeyAtRef.current : 0;

            if (key === "Enter") {
                const buffered = bufferRef.current;
                const duration = startedAtRef.current ? now - startedAtRef.current : Infinity;
                const isFast = (buffered.length >= opts.minLength && duration <= opts.maxDurationMs) || (buffered.length >= opts.minLength && duration / buffered.length < 50);

                const target = event.target;
                const isTextLikeInput =
                    target instanceof HTMLInputElement &&
                    (target.type === "text" || target.type === "search" || target.type === "tel" || target.type === "" || target.tagName === "TEXTAREA");

                const manualCandidate =
                    opts.allowManualInputEnter && isTextLikeInput
                        ? (target.value || "").trim()
                        : "";

                const isManualCandidateValid =
                    manualCandidate.length >= opts.manualInputMinLength &&
                    BARCODE_LIKE_PATTERN.test(manualCandidate) &&
                    /\d/.test(manualCandidate);

                const hasRecentPaste =
                    pastedValueRef.current && now - pastedAtRef.current <= opts.pasteEnterWindowMs;

                let scanned = false;

                if (hasRecentPaste) {
                    scanIfValid(pastedValueRef.current);
                    scanned = true;
                } else if (isFast) {
                    scanIfValid(buffered);
                    scanned = true;
                } else if (isManualCandidateValid) {
                    scanIfValid(manualCandidate);
                    scanned = true;
                }

                if (scanned) {
                    event.preventDefault();
                    event.stopPropagation();
                    // If it was a fast scan that leaked into an input, we might want to clear it, 
                    // but we can't safely clear a manual input candidate.
                }

                pastedValueRef.current = "";
                pastedAtRef.current = 0;
                resetBuffer();
                return;
            }

            if (
                key === "Shift" ||
                key === "Tab" ||
                key === "CapsLock" ||
                key === "Escape" ||
                key === "Alt" ||
                key === "Control" ||
                key === "Meta" ||
                key.startsWith("Arrow")
            ) {
                return;
            }

            if (key === "Backspace") {
                bufferRef.current = bufferRef.current.slice(0, -1);
                lastKeyAtRef.current = now;
                return;
            }

            if (key.length !== 1) {
                return;
            }

            // If characters are coming in VERY fast, assume it's a scanner and block from typing into focused inputs
            const isScannerInterval = interval > 0 && interval < 50;

            if (lastKeyAtRef.current && now - lastKeyAtRef.current > opts.interKeyResetMs) {
                resetBuffer();
            }

            if (!startedAtRef.current) {
                startedAtRef.current = now;
            }

            bufferRef.current += key;
            lastKeyAtRef.current = now;

            // If we are reasonably sure it's a scanner (after the second fast key), block the character from propagating
            if (isScannerInterval || bufferRef.current.length > 2) {
                // Check if focused element is a text input
                const target = event.target;
                const isTextLikeInput =
                    target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;

                if (isScannerInterval && isTextLikeInput) {
                    event.preventDefault();
                    event.stopPropagation();
                }
            }
        };

        window.addEventListener("paste", handlePaste, true);
        window.addEventListener("keydown", handleKeydown, true);

        return () => {
            window.removeEventListener("paste", handlePaste, true);
            window.removeEventListener("keydown", handleKeydown, true);
        };
    }, [
        onScan,
        opts.duplicateCooldownMs,
        opts.interKeyResetMs,
        opts.maxDurationMs,
        opts.minLength,
        opts.pasteEnterWindowMs,
        opts.allowManualInputEnter,
        opts.manualInputMinLength,
    ]);
}

export default useBarcodeScanner;
