import React, { useState, useRef, useMemo, useCallback, useEffect } from "react";
import html2canvas from "html2canvas";
import { PDFDocument } from "pdf-lib";

import "./InvoiceForm.css";
import logoImg from "./logo.jpeg";

/**
 * InvoiceForm — 1:1 React port of index.html + style.css + script.js
 * -------------------------------------------------------------------
 * Keeps the SAME class names, SAME markup structure, SAME Bootstrap grid,
 * and SAME "Generate Fillable PDF" engine (div-swap + pdf-lib page slicing)
 * that produced the correct SaleBill_GL_236.pdf output.
 *
 * Requires (npm install):
 *   html2canvas
 *   pdf-lib
 *
 * Also requires, in your app's public/index.html <head>:
 *   <link rel="preconnect" href="https://fonts.googleapis.com">
 *   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
 *   <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
 *   <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
 *   <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
 *
 * (Bootstrap's grid classes — row, col-12, col-md-6, g-0, d-flex, etc. — and
 *  Font Awesome icons are used verbatim below, exactly like the original file.
 *  If you don't want a global Bootstrap import, see the note at the bottom
 *  of InvoiceForm.css for a scoped alternative.)
 */

let rowIdCounter = 4; // preset rows use ids 1-3

const createRow = (overrides = {}) => ({
    id: rowIdCounter++,
    name: "",
    subtext: "",
    hsn: "94054090",
    qty: "1",
    rate: "0.00",
    discount: "0.00",
    igst: "18.00",
    ...overrides,
});

const DEFAULT_ROWS = [
    createRow({
        id: 1,
        name: "SG806-12W COB SPOT LIGHT WHITE DIMM+TUNEABLE",
        subtext: "SR NO.3110-3114",
        qty: "5",
        rate: "1015.00",
    }),
    createRow({
        id: 2,
        name: "SG821-3W MOVEBLE COB SPOT LIGHT WHITE NW",
        subtext: "SR NO.109-118",
        qty: "10",
        rate: "330.00",
    }),
    createRow({
        id: 3,
        name: "SG806-12W COB SPOT LIGHT WHITE 3 IN",
        subtext: "SR NO.3080-3109",
        qty: "30",
        rate: "515.00",
    }),
];

// ---- helpers (ported verbatim from script.js) -----------------------------

const toNum = (v) => parseFloat(v) || 0;

function numberToWords(num) {
    if (num === 0) return "Zero";

    let isNegative = false;
    if (num < 0) {
        isNegative = true;
        num = Math.abs(num);
    }

    const ones = [
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
        "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen",
        "Eighteen", "Nineteen",
    ];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    const numString = num.toFixed(2);
    const parts = numString.split(".");
    const wholeNum = parseInt(parts[0], 10);
    const paisaNum = parseInt(parts[1], 10);

    function convertPart(n) {
        if (n < 20) return ones[n];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
        if (n < 1000)
            return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " " + convertPart(n % 100) : "");
        if (n < 100000)
            return convertPart(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + convertPart(n % 1000) : "");
        if (n < 10000000)
            return convertPart(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + convertPart(n % 100000) : "");
        return convertPart(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + convertPart(n % 10000000) : "");
    }

    let wordStr = isNegative ? "Minus " : "";
    wordStr += convertPart(wholeNum) + " Rupees";
    if (paisaNum > 0) {
        wordStr += " And " + convertPart(paisaNum) + " Paise";
    }
    return wordStr;
}

// Auto-resize a textarea to fit its content (matches autoResizeTextarea in script.js)
function autoResizeTextarea(el) {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + 8 + "px";
}

const todayISO = () => new Date().toISOString().split("T")[0];

// ---- component -------------------------------------------------------------

export default function InvoiceForm() {
    const invoiceRef = useRef(null);

    const [docTypeLabel, setDocTypeLabel] = useState("TAX INVOICE");

    const [logoImage, setLogoImage] = useState(logoImg); // data URL, or null => default bars/logo text
    const [logoText, setLogoText] = useState("GRIQ");

    const [companyName, setCompanyName] = useState(
        "FUSION MASTER TECH INNOVATION AND DEVELOPMENT PVT. LTD."
    );
    const [companyAddress, setCompanyAddress] = useState(
        "Ground Floor,Office No.06,No.23/2 Barne Estate,Shri Ram Sukh Hospital Marg,Shri Vishnu Bhavan, Thergon,Pimpri Chinchwad, PUNE - 411033"
    );

    const [buyerName, setBuyerName] = useState("FUSION MASTER TECH INNOVATION AND DEVELOPMENT PVT LTD");
    const [buyerAddress, setBuyerAddress] = useState(
        "Ground Floor,Office No.06,No.23/2 Barne Estate,Shri Ram Sukh Hospital Marg,Shri Vishnu Bhavan, Thergon,Pimpri Chinchwad, PUNE - 411033"
    );
    const [placeOfSupply, setPlaceOfSupply] = useState("27-Maharashtra");
    const [buyerGstin, setBuyerGstin] = useState("27AAFCF8338N1Z0");
    const [buyerMobile, setBuyerMobile] = useState("7249211259");

    const [invoiceNo, setInvoiceNo] = useState("GL/236");
    const [invoiceDate, setInvoiceDate] = useState(todayISO());
    const [transport, setTransport] = useState("TIRUPATI COURIER");
    const [ewayNo, setEwayNo] = useState("");
    const [orderNo, setOrderNo] = useState("");
    const [paymentTerms, setPaymentTerms] = useState("15 DAYS");

    const [rows, setRows] = useState(DEFAULT_ROWS);

    const [gstinNo, setGstinNo] = useState("24AMQPR7103R1ZA");
    const [udyamNo, setUdyamNo] = useState("UDYAM-GJ-20-0016960");
    const [enterpriseType, setEnterpriseType] = useState("MICRO");

    const [bankName, setBankName] = useState("BANK OF MAHARASTRA");
    const [bankAccount, setBankAccount] = useState("60324068691");
    const [ifsc, setIfsc] = useState("MAHB0001542");

    const [freight, setFreight] = useState("660.00");
    const [roundOff, setRoundOff] = useState("-0.31");

    const [note, setNote] = useState("");

    const [downloading, setDownloading] = useState(false);

    // ---- row management (addProductRow / removeProductRow ports) ----

    const updateRow = useCallback((id, field, value) => {
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
    }, []);

    const addProductRow = useCallback(() => {
        setRows((prev) => [...prev, createRow()]);
    }, []);

    const removeProductRow = useCallback((id) => {
        setRows((prev) => {
            if (prev.length <= 1) {
                alert("At least one item row must remain in the invoice.");
                return prev;
            }
            return prev.filter((r) => r.id !== id);
        });
    }, []);

    // ---- auto-resize textareas on every render (mirrors DOMContentLoaded + input listeners) ----

    const autoResizeRef = useCallback((el) => {
        if (el) autoResizeTextarea(el);
    }, []);

    useEffect(() => {
        if (!invoiceRef.current) return;
        invoiceRef.current.querySelectorAll("textarea").forEach(autoResizeTextarea);
    });

    const calc = useMemo(() => {
        let subTotal = 0;
        const lineAmounts = rows.map((row) => {
            const qty = toNum(row.qty);
            const rate = toNum(row.rate);
            const discPercent = toNum(row.discount);

            let lineTotal = qty * rate;
            if (discPercent > 0) {
                lineTotal -= lineTotal * (discPercent / 100);
            }
            subTotal += lineTotal;
            return lineTotal;
        });

        const freightVal = toNum(freight);
        const roundOffVal = toNum(roundOff);

        // Group by IGST slab rate
        const slabsMap = {};
        rows.forEach((row, idx) => {
            const igstRate = toNum(row.igst);
            const lineAmt = lineAmounts[idx];
            if (!slabsMap[igstRate]) {
                slabsMap[igstRate] = 0;
            }
            slabsMap[igstRate] += lineAmt;
        });

        // Compute values for each slab
        const slabs = Object.keys(slabsMap).map((rateStr) => {
            const rate = parseFloat(rateStr);
            const slabSubTotal = slabsMap[rateStr];
            const slabFreightShare = subTotal > 0 ? freightVal * (slabSubTotal / subTotal) : 0;
            const taxableValue = slabSubTotal + slabFreightShare;
            const taxAmount = taxableValue * (rate / 100);
            return {
                rate,
                taxableValue,
                taxAmount,
            };
        }).sort((a, b) => a.rate - b.rate);

        // Totals
        const taxableAmount = slabs.reduce((acc, s) => acc + s.taxableValue, 0);
        const integratedTax = slabs.reduce((acc, s) => acc + s.taxAmount, 0);
        const grandTotal = taxableAmount + integratedTax + roundOffVal;

        // Fallback or default first IGST rate
        const currentIgstRate = rows.length > 0 ? toNum(rows[0].igst) : 18.0;

        return {
            lineAmounts,
            subTotal,
            currentIgstRate,
            taxableAmount,
            integratedTax,
            grandTotal,
            slabs,
            totalGstWords: numberToWords(integratedTax) + " Only",
            billAmountWords: numberToWords(grandTotal) + " Only",
        };
    }, [rows, freight, roundOff]);

    // Keep closingBalance in sync with grandTotal, same as script.js's
    // "Sync Closing Balance" step inside calculateInvoiceTotals.
    const [closingBalance, setClosingBalance] = useState(calc.grandTotal.toFixed(2));
    useEffect(() => {
        setClosingBalance(calc.grandTotal.toFixed(2));
    }, [calc.grandTotal]);

    // ---- print ----

    const handlePrint = () => window.print();

    // ---- Generate Fillable PDF (1:1 port of runFillablePdfGeneration in script.js) ----
    //
    // This is the function that produced your GOOD PDF (SaleBill_GL_236.pdf).
    // It works by:
    //   1. Hiding .no-print elements
    //   2. Swapping every live <input>/<textarea>/<select> for a plain <div>
    //      that mirrors its computed style + value (this is what avoids the
    //      font clipping / rendering glitches that raw form controls get in
    //      html2canvas)
    //   3. Rasterizing the container with html2canvas
    //   4. Slicing that raster into A4-sized pages and embedding each as a
    //      background image in a pdf-lib document (with a clean margin)
    //   5. Re-creating each form field as a real, position-matched AcroForm
    //      field on top of the background image, so the exported PDF is
    //      still fillable/editable in a PDF reader

    const generateFillablePdf = useCallback(async () => {
        const container = invoiceRef.current;
        if (!container) return;

        setDownloading(true);

        // 1. Hide non-printable UI (Action column, Add-row bar, logo upload controls)
        const noPrintEls = Array.from(container.querySelectorAll(".no-print"));
        const prevDisplay = noPrintEls.map((el) => el.style.display);
        noPrintEls.forEach((el) => el.style.setProperty("display", "none", "important"));

        // 2. Swap every live form control for a static, style-matched <div>
        const controls = Array.from(container.querySelectorAll("input, textarea, select"));
        const swapped = [];

        controls.forEach((el) => {
            if (el.type === "file" || el.type === "submit" || el.type === "button" || el.type === "checkbox") return;
            if (el.offsetWidth === 0 || el.offsetHeight === 0) return;

            const cs = window.getComputedStyle(el);
            const tempEl = document.createElement("div");

            tempEl.className = el.className;
            tempEl.style.width = cs.width;
            tempEl.style.height = cs.height;
            tempEl.style.fontFamily = cs.fontFamily;
            tempEl.style.fontSize = cs.fontSize;
            tempEl.style.fontWeight = cs.fontWeight;
            tempEl.style.letterSpacing = cs.letterSpacing;
            tempEl.style.lineHeight = cs.lineHeight;
            tempEl.style.color = cs.color;
            tempEl.style.textAlign = cs.textAlign;
            tempEl.style.padding = cs.padding;
            tempEl.style.margin = cs.margin;
            tempEl.style.border = cs.border;
            tempEl.style.borderBottom = cs.borderBottom;
            tempEl.style.backgroundColor = cs.backgroundColor;
            tempEl.style.boxSizing = cs.boxSizing;
            tempEl.style.display = cs.display;
            tempEl.style.alignItems = cs.alignItems;
            tempEl.style.justifyContent = cs.justifyContent;
            tempEl.style.flexDirection = cs.flexDirection;
            tempEl.style.wordBreak = "break-word";
            tempEl.style.whiteSpace = "pre-wrap";
            tempEl.style.textTransform = cs.textTransform;

            tempEl.textContent =
                el.tagName === "SELECT" ? el.options[el.selectedIndex]?.text || "" : el.value || "";

            const originalDisplay = el.style.display;
            el.style.setProperty("display", "none", "important");
            el.parentNode.insertBefore(tempEl, el);

            swapped.push({ el, tempEl, originalDisplay });
        });

        const restoreAll = () => {
            swapped.forEach(({ el, tempEl, originalDisplay }) => {
                if (tempEl.parentNode) tempEl.parentNode.removeChild(tempEl);
                el.style.display = originalDisplay;
            });
            noPrintEls.forEach((el, i) => (el.style.display = prevDisplay[i]));
        };

        try {
            if (document.fonts?.ready) await document.fonts.ready;

            // 3. Rasterize
            const canvas = await html2canvas(container, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#ffffff",
                logging: false,
                allowTaint: true,
            });

            // Restore the live DOM immediately — we don't need it anymore
            restoreAll();

            const pdfDoc = await PDFDocument.create();

            // A4 in points
            const pdfPageW = 595.28;
            const pdfPageH = 841.89;
            const margin = 24;

            const printableW = pdfPageW - 2 * margin;
            const printableH = pdfPageH - 2 * margin;
            const printableRatio = printableW / printableH;

            const canvasW = canvas.width;
            const canvasH = canvas.height;

            const canvasSliceH = canvasW / printableRatio;
            const scaleFactor = printableW / canvasW;

            const totalPages = Math.ceil(canvasH / canvasSliceH);
            const pdfPageRefs = [];
            const pdfPageHeights = []; // actual height used per page — needed for field placement below

            // 4. Slice into pages, sized to the actual content (no forced full-page gap)
            for (let i = 0; i < totalPages; i++) {
                const startY = i * canvasSliceH;
                const cropH = Math.min(canvasSliceH, canvasH - startY); // real content height, no padding

                const sliceCanvas = document.createElement("canvas");
                sliceCanvas.width = canvasW;
                sliceCanvas.height = cropH;

                const ctx = sliceCanvas.getContext("2d");
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, canvasW, cropH);
                ctx.drawImage(canvas, 0, startY, canvasW, cropH, 0, 0, canvasW, cropH);

                // PNG instead of JPEG — lossless, so 1px black borders/gridlines
                // don't get compressed away.
                const imgData = sliceCanvas.toDataURL("image/png");
                const embeddedImg = await pdfDoc.embedPng(imgData);

                // Page height = actual content height (+ margins), capped at a full
                // A4 page. A short invoice gets a short page — no leftover gap.
                const contentHeightPt = cropH * scaleFactor;
                const thisPageH = Math.min(pdfPageH, contentHeightPt + margin * 2);

                const page = pdfDoc.addPage([pdfPageW, thisPageH]);
                page.drawImage(embeddedImg, {
                    x: margin,
                    y: thisPageH - margin - contentHeightPt,
                    width: printableW,
                    height: contentHeightPt,
                });

                pdfPageRefs.push(page);
                pdfPageHeights.push(thisPageH);
            }

            // 5. Rebuild interactive form fields, position-matched over the image
            const form = pdfDoc.getForm();
            const containerRect = container.getBoundingClientRect();

            controls.forEach((el, index) => {
                if (el.type === "file" || el.type === "submit" || el.type === "button") return;
                if (el.offsetWidth === 0 || el.offsetHeight === 0) return;

                const rect = el.getBoundingClientRect();
                const relX = rect.left - containerRect.left;
                const relY = rect.top - containerRect.top;
                const relW = rect.width;
                const relH = rect.height;

                const clientToCanvasX = canvasW / containerRect.width;
                const clientToCanvasY = canvasH / containerRect.height;

                const canvasX = relX * clientToCanvasX;
                const canvasY = relY * clientToCanvasY;
                const canvasW_pt = relW * clientToCanvasX;
                const canvasH_pt = relH * clientToCanvasY;

                const pageIdx = Math.floor(canvasY / canvasSliceH);
                if (pageIdx < 0 || pageIdx >= totalPages) return;

                const page = pdfPageRefs[pageIdx];
                const thisPageH = pdfPageHeights[pageIdx];
                const relativeSliceY = canvasY % canvasSliceH;

                const pdfX = margin + canvasX * scaleFactor;
                const pdfW = canvasW_pt * scaleFactor;
                const pdfH = canvasH_pt * scaleFactor;
                const pdfY = (thisPageH - margin) - (relativeSliceY + canvasH_pt) * scaleFactor;

                if (pdfW < 5 || pdfH < 5) return;

                const baseKey = el.name || el.id || "field";
                const uniqueFieldKey = `${baseKey.replace(/[^a-zA-Z0-9_]/g, "_")}_p${pageIdx}_i${index}`;

                try {
                    if (el.type === "checkbox") {
                        const cbField = form.createCheckBox(uniqueFieldKey);
                        if (el.checked) cbField.check();
                        cbField.addToPage(page, { x: pdfX, y: pdfY, width: pdfW, height: pdfH });
                    } else if (el.tagName === "SELECT") {
                        const listOptions = Array.from(el.options)
                            .map((opt) => (opt.text || opt.value || "").trim())
                            .filter((t) => t.length > 0);

                        if (listOptions.length > 0) {
                            const selectField = form.createDropdown(uniqueFieldKey);
                            selectField.setOptions(listOptions);
                            const curText = el.options[el.selectedIndex]?.text;
                            if (curText) selectField.select(curText);
                            selectField.addToPage(page, { x: pdfX, y: pdfY, width: pdfW, height: pdfH });
                        }
                    } else {
                        const textField = form.createTextField(uniqueFieldKey);
                        textField.setText(el.value || "");
                        if (el.tagName === "TEXTAREA" || (pdfW > 150 && pdfH > 35)) {
                            textField.enableMultiline();
                        }
                        const fitFontSize = Math.max(7, Math.min(10, pdfH * 0.55));
                        textField.setFontSize(fitFontSize);
                        textField.addToPage(page, { x: pdfX, y: pdfY, width: pdfW, height: pdfH });
                    }
                } catch (fieldError) {
                    console.error(`Field generation failure for ${uniqueFieldKey}:`, fieldError);
                }
            });

            const finalPdfBytes = await pdfDoc.save();
            const pdfBlob = new Blob([finalPdfBytes], { type: "application/pdf" });
            const downloadUrl = URL.createObjectURL(pdfBlob);

            const anchor = document.createElement("a");
            anchor.href = downloadUrl;
            const safeInvoiceNo = (invoiceNo || "GL_236").trim().replace(/[/\\?%*:|"<>\s]+/g, "_");
            anchor.download = `SaleBill_${safeInvoiceNo}.pdf`;
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            URL.revokeObjectURL(downloadUrl);
        } catch (err) {
            console.error("Error generating fillable PDF:", err);
            alert("An error occurred during PDF generation: " + err.message);
            restoreAll();
        } finally {
            setDownloading(false);
        }
    }, [invoiceNo]);
    // ---- render ----

    return (
        <div className="content-wrapper invoice-form-page">
            <section className="content py-4">
                <div className="form-container invoice-form-container">
                    {/* Action Bar */}
                    <div className="action-bar no-print mb-3 d-flex gap-2 justify-content-end">
                        <button type="button" className="btn btn-primary btn-sm" onClick={handlePrint}>
                            <i className="fas fa-print" /> Print
                        </button>
                        <button
                            type="button"
                            className="btn btn-success btn-sm"
                            onClick={generateFillablePdf}
                            disabled={downloading}
                            style={{ fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}
                        >
                            <i className={downloading ? "fas fa-spinner fa-spin" : "fas fa-file-pdf"} />{" "}
                            {downloading ? "Making PDF..." : "Generate Fillable PDF"}
                        </button>
                    </div>

                    <div className="card invoice-box" ref={invoiceRef}>
                        {/* Header: logo + company name/address */}
                        <div className="row g-0 align-items-center invoice-border-bottom">
                            <div
                                className="col-3 text-center d-flex flex-column align-items-center justify-content-center py-2"
                                style={{ minHeight: 110 }}
                            >
                                <div className="logo-container" style={{ width: "110%" }}>
                                    {!logoImage ? (
                                        <div className="d-flex flex-column align-items-center">
                                            <div className="logo-bars-top">
                                                <div className="logo-bar" style={{ height: 6 }} />
                                                <div className="logo-bar" style={{ height: 10 }} />
                                                <div className="logo-bar" style={{ height: 14 }} />
                                                <div className="logo-bar" style={{ height: 10 }} />
                                                <div className="logo-bar" style={{ height: 6 }} />
                                            </div>
                                            <input
                                                type="text"
                                                className="header-input fw-extrabold text-uppercase text-center m-0 p-0"
                                                style={{ fontSize: "1.15rem", letterSpacing: 2, fontWeight: 800, width: "100%" }}
                                                value={logoText}
                                                onChange={(e) => setLogoText(e.target.value)}
                                            />
                                            <div className="logo-bars-bottom">
                                                <div className="logo-bar" style={{ height: 6 }} />
                                                <div className="logo-bar" style={{ height: 10 }} />
                                                <div className="logo-bar" style={{ height: 14 }} />
                                                <div className="logo-bar" style={{ height: 10 }} />
                                                <div className="logo-bar" style={{ height: 6 }} />
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            className="w-100"
                                            style={{
                                                maxHeight: 120,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                overflow: "hidden",
                                            }}
                                        >
                                            <img
                                                src={logoImage}
                                                alt="Company logo"
                                                style={{ maxHeight: 120, maxWidth: "125%", objectFit: "contain" }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="col-9 py-2 px-3 text-center d-flex flex-column justify-content-center">
                                <textarea
                                    className="header-input fw-extrabold text-uppercase m-0 auto-resize"
                                    rows={1}
                                    style={{
                                        fontFamily: "'Verdana', sans-serif",
                                        fontSize: "1.7rem",
                                        letterSpacing: 2,
                                        fontWeight: 800,
                                        lineHeight: 1.4,
                                        padding: "6px 0",
                                        resize: "none",
                                        overflow: "hidden",
                                    }}
                                    required
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    ref={autoResizeRef}
                                    onInput={(e) => autoResizeTextarea(e.target)}
                                />
                                <textarea
                                    className="header-input fw-semibold mt-1 auto-resize"
                                    rows={2}
                                    style={{
                                        fontFamily: "'Verdana', sans-serif",
                                        fontSize: "0.72rem",
                                        lineHeight: 1.5,
                                        padding: "4px 0",
                                        resize: "none",
                                        overflow: "hidden",
                                    }}
                                    required
                                    value={companyAddress}
                                    onChange={(e) => setCompanyAddress(e.target.value)}
                                    ref={autoResizeRef}
                                    onInput={(e) => autoResizeTextarea(e.target)}
                                />
                            </div>
                        </div>

                        {/* Debit Memo / TAX INVOICE / Original row */}
                        <div className="row g-0 invoice-border-bottom" style={{ fontSize: "0.85rem", background: "#fafafa" }}>
                            <div className="col-4 py-1 text-start ps-2">Debit Memo</div>
                            <div className="col-4 py-1 text-center text-uppercase" style={{ letterSpacing: 1.5 }}>
                                <input
                                    type="text"
                                    className="header-input text-uppercase fw-semibold"
                                    style={{ letterSpacing: 1.5, fontSize: "0.85rem" }}
                                    value={docTypeLabel}
                                    onChange={(e) => setDocTypeLabel(e.target.value)}
                                />
                            </div>
                            <div className="col-4 py-1 text-end pe-2">Original</div>
                        </div>

                        {/* Buyer + invoice metadata */}
                        <div className="row g-0 invoice-border-bottom">
                            <div className="col-12 col-md-6 invoice-border-right p-3">
                                <div className="field-row">
                                    <span className="field-label" style={{ minWidth: 50 }}>
                                        M/s. :
                                    </span>
                                    <textarea
                                        className="invoice-input fw-bold flex-grow-1 text-uppercase auto-resize"
                                        rows={1}
                                        style={{ color: "#000", fontSize: "0.85rem", lineHeight: 1.4, padding: "2px 4px", resize: "none", overflow: "hidden" }}
                                        required
                                        value={buyerName}
                                        onChange={(e) => setBuyerName(e.target.value)}
                                        ref={autoResizeRef}
                                        onInput={(e) => autoResizeTextarea(e.target)}
                                    />
                                </div>
                                <div className="mb-2">
                                    <textarea
                                        className="invoice-input flex-grow-1 auto-resize"
                                        rows={2}
                                        style={{ lineHeight: 1.4, padding: "2px 4px", resize: "none", overflow: "hidden" }}
                                        required
                                        value={buyerAddress}
                                        onChange={(e) => setBuyerAddress(e.target.value)}
                                        ref={autoResizeRef}
                                        onInput={(e) => autoResizeTextarea(e.target)}
                                    />
                                </div>
                                <div className="row g-2">
                                    <div className="col-12">
                                        <div className="field-row">
                                            <span className="field-label" style={{ minWidth: 110 }}>Place of Supply :</span>
                                            <input
                                                type="text"
                                                className="invoice-input flex-grow-1"
                                                value={placeOfSupply}
                                                onChange={(e) => setPlaceOfSupply(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-12">
                                        <div className="field-row">
                                            <span className="field-label" style={{ minWidth: 110 }}>GSTIN No. :</span>
                                            <input
                                                type="text"
                                                className="invoice-input flex-grow-1 number-font text-uppercase fw-bold"
                                                value={buyerGstin}
                                                onChange={(e) => setBuyerGstin(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-12">
                                        <div className="field-row">
                                            <span className="field-label" style={{ minWidth: 110 }}>Mobile / Tel :</span>
                                            <input
                                                type="text"
                                                className="invoice-input flex-grow-1 number-font fw-bold"
                                                value={buyerMobile}
                                                onChange={(e) => setBuyerMobile(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="col-12 col-md-6 p-3">
                                <div className="row g-2">
                                    <div className="col-12">
                                        <div className="field-row">
                                            <span className="field-label" style={{ minWidth: 110 }}>Invoice No. :</span>
                                            <input
                                                type="text"
                                                className="invoice-input flex-grow-1 fw-bold number-font"
                                                value={invoiceNo}
                                                onChange={(e) => setInvoiceNo(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="col-12">
                                        <div className="field-row">
                                            <span className="field-label" style={{ minWidth: 110 }}>Date :</span>
                                            <input
                                                type="date"
                                                className="invoice-input flex-grow-1"
                                                value={invoiceDate}
                                                onChange={(e) => setInvoiceDate(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="col-12">
                                        <div className="field-row">
                                            <span className="field-label" style={{ minWidth: 110 }}>TRANSPORT :</span>
                                            <input
                                                type="text"
                                                className="invoice-input flex-grow-1 text-uppercase"
                                                value={transport}
                                                onChange={(e) => setTransport(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-12">
                                        <div className="field-row">
                                            <span className="field-label" style={{ minWidth: 110 }}>E-WAY NO. :</span>
                                            <input
                                                type="text"
                                                className="invoice-input flex-grow-1 number-font text-uppercase"
                                                value={ewayNo}
                                                placeholder="Enter E-Way No. if any..."
                                                onChange={(e) => setEwayNo(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-12">
                                        <div className="field-row">
                                            <span className="field-label" style={{ minWidth: 110 }}>ORDER NO. :</span>
                                            <input
                                                type="text"
                                                className="invoice-input flex-grow-1 text-uppercase"
                                                value={orderNo}
                                                placeholder="PO / Order number..."
                                                onChange={(e) => setOrderNo(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-12">
                                        <div className="field-row">
                                            <span className="field-label" style={{ minWidth: 110 }}>Payment Terms :</span>
                                            <input
                                                type="text"
                                                className="invoice-input flex-grow-1 text-uppercase"
                                                value={paymentTerms}
                                                onChange={(e) => setPaymentTerms(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Products table */}
                        <div className="table-responsive">
                            <table className="invoice-table text-start">
                                <thead>
                                    <tr style={{ backgroundColor: "#e9ecef", borderBottom: "2px solid #000" }}>
                                        <th style={{ width: "5%", textAlign: "center", fontSize: "0.82rem", padding: "6px 4px" }}>SrNo</th>
                                        <th style={{ width: "38%", textAlign: "center", fontSize: "0.82rem", padding: "6px 4px" }}>Product Name</th>
                                        <th style={{ width: "9%", textAlign: "center", fontSize: "0.82rem", padding: "6px 4px" }}>HSN/SAC</th>
                                        <th style={{ width: "7%", textAlign: "center", fontSize: "0.82rem", padding: "6px 4px" }}>Qty</th>
                                        <th style={{ width: "11%", textAlign: "center", fontSize: "0.82rem", padding: "6px 4px" }}>Rate (₹)</th>
                                        <th style={{ width: "7%", textAlign: "center", fontSize: "0.82rem", padding: "6px 4px" }}>Dis %</th>
                                        <th style={{ width: "8%", textAlign: "center", fontSize: "0.82rem", padding: "6px 4px" }}>IGST %</th>
                                        <th style={{ width: "13%", textAlign: "center", fontSize: "0.82rem", padding: "6px 4px" }}>Amount (₹)</th>
                                        <th className="no-print" style={{ width: "4%", textAlign: "center" }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, idx) => (
                                        <tr className="product-row" key={row.id}>
                                            <td className="text-center fw-bold number-font sr-no" style={{ verticalAlign: "middle" }}>
                                                {idx + 1}
                                            </td>
                                            <td style={{ verticalAlign: "middle" }}>
                                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center" }}>
                                                    <textarea
                                                        className="invoice-input fw-bold text-uppercase auto-resize"
                                                        rows={1}
                                                        style={{ lineHeight: 1.4, padding: "2px 4px", resize: "none", overflow: "hidden", textAlign: "left", width: "100%" }}
                                                        required
                                                        placeholder="Product name..."
                                                        value={row.name}
                                                        onChange={(e) => updateRow(row.id, "name", e.target.value)}
                                                        ref={autoResizeRef}
                                                        onInput={(e) => autoResizeTextarea(e.target)}
                                                    />
                                                    <textarea
                                                        className="invoice-input text-muted text-uppercase auto-resize"
                                                        rows={1}
                                                        style={{ fontSize: "0.72rem", lineHeight: 1.4, padding: "2px 4px", resize: "none", overflow: "hidden", textAlign: "left", width: "100%" }}
                                                        placeholder="Serial numbers/subtext..."
                                                        value={row.subtext}
                                                        onChange={(e) => updateRow(row.id, "subtext", e.target.value)}
                                                        ref={autoResizeRef}
                                                        onInput={(e) => autoResizeTextarea(e.target)}
                                                    />
                                                </div>
                                            </td>
                                            <td style={{ verticalAlign: "middle", textAlign: "center" }}>
                                                <input
                                                    type="text"
                                                    className="invoice-input text-center number-font hsn-field"
                                                    maxLength={8}
                                                    placeholder="HSN..."
                                                    style={{ textAlign: "center", width: "100%" }}
                                                    value={row.hsn}
                                                    onChange={(e) => updateRow(row.id, "hsn", e.target.value)}
                                                />
                                            </td>
                                            <td style={{ verticalAlign: "middle", textAlign: "center" }}>
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    className="invoice-input text-center number-font calc-trigger qty-field"
                                                    required
                                                    style={{ textAlign: "center", width: "100%" }}
                                                    value={row.qty}
                                                    onChange={(e) => updateRow(row.id, "qty", e.target.value)}
                                                />
                                            </td>
                                            <td style={{ verticalAlign: "middle", textAlign: "center" }}>
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    className="invoice-input text-center number-font calc-trigger rate-field"
                                                    required
                                                    style={{ textAlign: "center", width: "100%" }}
                                                    value={row.rate}
                                                    onChange={(e) => updateRow(row.id, "rate", e.target.value)}
                                                />
                                            </td>
                                            <td style={{ verticalAlign: "middle", textAlign: "center" }}>
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    className="invoice-input text-center number-font calc-trigger discount-field"
                                                    placeholder="0"
                                                    style={{ textAlign: "center", width: "100%" }}
                                                    value={row.discount}
                                                    onChange={(e) => updateRow(row.id, "discount", e.target.value)}
                                                />
                                            </td>
                                            <td style={{ verticalAlign: "middle", textAlign: "center" }}>
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    className="invoice-input text-center number-font calc-trigger igst-field"
                                                    style={{ textAlign: "center", width: "100%" }}
                                                    value={row.igst}
                                                    onChange={(e) => updateRow(row.id, "igst", e.target.value)}
                                                />
                                            </td>
                                            <td
                                                className="text-center number-font fw-bold amount-display"
                                                style={{ verticalAlign: "middle", padding: "6px 4px", fontSize: "0.9rem" }}
                                            >
                                                {calc.lineAmounts[idx].toFixed(2)}
                                            </td>
                                            <td className="text-center no-print align-middle" style={{ verticalAlign: "middle" }}>
                                                <button
                                                    type="button"
                                                    className="btn-xs btn-outline-danger"
                                                    style={{ padding: "0px 4px", fontSize: "0.7rem" }}
                                                    onClick={() => removeProductRow(row.id)}
                                                >
                                                    <i className="fas fa-trash" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}

                                    {/* Merged Footer Row 1: GSTIN & UDYAM */}
                                    <tr style={{ borderTop: "2px solid #000" }}>
                                        <td colSpan={8} className="merged-footer-cell border-left-black border-right-black" style={{ padding: "6px 12px" }}>
                                            <div className="d-flex flex-wrap gap-3 align-items-center">
                                                <div className="d-flex align-items-center gap-1">
                                                    <span className="fw-bold">GSTIN No.:</span>
                                                    <input
                                                        type="text"
                                                        className="invoice-input number-font text-uppercase fw-bold"
                                                        style={{ width: 140 }}
                                                        value={gstinNo}
                                                        onChange={(e) => setGstinNo(e.target.value)}
                                                    />
                                                </div>
                                                <div className="d-flex align-items-center gap-1">
                                                    <span className="fw-bold">UDYAM NO.:</span>
                                                    <input
                                                        type="text"
                                                        className="invoice-input number-font text-uppercase udyam-input fw-bold"
                                                        value={udyamNo}
                                                        onChange={(e) => setUdyamNo(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="no-print merged-footer-cell border-right-black" />
                                    </tr>

                                    {/* Merged Footer Row 2: Type of Enterprise & Subtotal */}
                                    <tr style={{ borderBottom: "2px solid #000" }}>
                                        <td colSpan={6} className="merged-footer-cell border-left-black border-right-black" style={{ padding: "6px 12px" }}>
                                            <div className="d-flex align-items-center gap-1">
                                                <span className="fw-bold">TYPE OF ENTERPRISE :</span>
                                                <input
                                                    type="text"
                                                    className="invoice-input text-uppercase fw-bold"
                                                    style={{ width: 80 }}
                                                    value={enterpriseType}
                                                    onChange={(e) => setEnterpriseType(e.target.value)}
                                                />
                                            </div>
                                        </td>
                                        <td colSpan={2} className="merged-footer-cell border-left-black border-right-black text-end" style={{ padding: "6px 12px" }}>
                                            <div className="d-flex justify-content-end align-items-center fw-bold">
                                                <span className="me-2 text-uppercase" style={{ letterSpacing: 0.5 }}>Sub Total (₹):</span>
                                                <span className="number-font fw-bold fs-6">{calc.subTotal.toFixed(2)}</span>
                                            </div>
                                        </td>
                                        <td className="no-print merged-footer-cell border-right-black" />
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="p-2 invoice-border-bottom text-start no-print bg-light">
                            <button type="button" className="btn-xs btn-outline-dark fw-bold" onClick={addProductRow}>
                                <i className="fas fa-plus" /> Add Invoice Item
                            </button>
                        </div>

                        {/* Financial split */}
                        <div className="row g-0 invoice-border-bottom">
                            <div className="col-12 col-md-7 invoice-border-right p-3 d-flex flex-column justify-content-between">
                                <div className="p-2 mb-3" style={{ border: "1px solid #000", fontSize: "0.75rem" }}>
                                    <div className="row g-1">
                                        <div className="col-12 d-flex">
                                            <span className="fw-bold" style={{ width: 110 }}>Bank Name</span>
                                            <span>
                                                :{" "}
                                                <input
                                                    type="text"
                                                    className="invoice-input fw-semibold"
                                                    style={{ width: 200 }}
                                                    value={bankName}
                                                    onChange={(e) => setBankName(e.target.value)}
                                                />
                                            </span>
                                        </div>
                                        <div className="col-12 d-flex">
                                            <span className="fw-bold" style={{ width: 110 }}>Bank A/c. No.</span>
                                            <span>
                                                :{" "}
                                                <input
                                                    type="text"
                                                    className="invoice-input number-font fw-semibold"
                                                    style={{ width: 200 }}
                                                    value={bankAccount}
                                                    onChange={(e) => setBankAccount(e.target.value)}
                                                />
                                            </span>
                                        </div>
                                        <div className="col-12 d-flex">
                                            <span className="fw-bold" style={{ width: 110 }}>RTGS/IFSC Code</span>
                                            <span>
                                                :{" "}
                                                <input
                                                    type="text"
                                                    className="invoice-input number-font text-uppercase fw-semibold"
                                                    style={{ width: 200 }}
                                                    value={ifsc}
                                                    onChange={(e) => setIfsc(e.target.value)}
                                                />
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-3" style={{ fontSize: "0.75rem" }}>
                                    <div className="mb-1">
                                        <span className="fw-bold">Total GST (in words):</span>{" "}
                                        <span className="text-capitalize fst-italic text-secondary">{calc.totalGstWords}</span>
                                    </div>
                                    <div>
                                        <span className="fw-bold">Bill Amount (in words):</span>{" "}
                                        <span className="text-capitalize fst-italic text-dark">{calc.billAmountWords}</span>
                                    </div>
                                </div>

                                <div className="mt-2">
                                    <span className="fw-bold d-block mb-1 text-uppercase" style={{ fontSize: "0.72rem", letterSpacing: 0.5 }}>
                                        Ratewise Summary :
                                    </span>
                                    <table className="table table-bordered m-0 p-0 text-center" style={{ fontSize: "0.7rem", border: "1px solid #000", backgroundColor: "#fff" }}>
                                        <thead>
                                            <tr>
                                                <th className="ratewise-header">SLAB</th>
                                                <th className="ratewise-header">TAXABLE VALUE (₹)</th>
                                                <th className="ratewise-header">RATE</th>
                                                <th className="ratewise-header">INTEGRATED TAX (₹)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {calc.slabs.map((slab) => (
                                                <tr key={slab.rate}>
                                                    <td className="number-font" style={{ color: "#000", textAlign: "center" }}>{slab.rate.toFixed(2)}%</td>
                                                    <td className="number-font" style={{ color: "#000", textAlign: "center" }}>{slab.taxableValue.toFixed(2)}</td>
                                                    <td className="number-font" style={{ color: "#000", textAlign: "center" }}>{slab.rate.toFixed(2)}%</td>
                                                    <td className="number-font fw-bold" style={{ color: "#000", textAlign: "center" }}>{slab.taxAmount.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="col-12 col-md-5 p-3" style={{ fontSize: "0.8rem", backgroundColor: "#fafafa" }}>
                                <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom">
                                    <span>Freight / Courier (₹):</span>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        className="invoice-input text-end number-font calc-trigger"
                                        style={{ width: 100, fontWeight: "bold" }}
                                        value={freight}
                                        onChange={(e) => setFreight(e.target.value)}
                                    />
                                </div>
                                <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom">
                                    <span className="fw-bold">Taxable Amount (₹):</span>
                                    <span className="number-font fw-bold">{calc.taxableAmount.toFixed(2)}</span>
                                </div>
                                <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom">
                                    <span>Integrated Tax / GST (₹):</span>
                                    <span className="number-font">{calc.integratedTax.toFixed(2)}</span>
                                </div>
                                <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom">
                                    <span>Round Off (₹):</span>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        className="invoice-input text-end number-font calc-trigger"
                                        style={{ width: 100 }}
                                        value={roundOff}
                                        onChange={(e) => setRoundOff(e.target.value)}
                                    />
                                </div>
                                <div className="d-flex justify-content-between align-items-center py-2 bg-dark text-white px-2 mt-3">
                                    <span className="fw-bold text-uppercase" style={{ fontSize: "0.85rem", letterSpacing: 0.5 }}>Grand Total (₹):</span>
                                    <span className="number-font fw-bold fs-5">{calc.grandTotal.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Closing balance footer */}
                        <div className="row g-0 fw-bold invoice-border-bottom align-items-center bg-light text-dark py-2 px-3" style={{ fontSize: "0.85rem" }}>
                            <div className="col-12 col-md-7 d-flex align-items-center gap-1">
                                <span>CLOSING BALANCE AS ON DATE :</span>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    className="invoice-input number-font fw-bold text-dark"
                                    style={{ width: 150, fontSize: "0.9rem" }}
                                    value={closingBalance}
                                    onChange={(e) => setClosingBalance(e.target.value)}
                                />
                            </div>
                            <div className="col-12 col-md-5 text-end d-flex justify-content-end align-items-center mt-1 mt-md-0">
                                <span>Grand Total (₹):</span>
                                <span className="number-font fw-bold text-dark ms-2">{calc.grandTotal.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Note, terms, signatures */}
                        <div className="p-3">
                            <div className="row g-3">
                                <div className="col-12 col-md-7">
                                    <div className="mb-2">
                                        <span className="fw-bold d-block mb-1">NOTE :</span>
                                        <textarea
                                            className="invoice-input"
                                            rows={2}
                                            style={{ resize: "none" }}
                                            placeholder="Add private / public invoice note here..."
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                        />
                                    </div>
                                    <div style={{ fontSize: "0.72rem", lineHeight: 1.4, color: "#333" }}>
                                        <span className="fw-bold d-block mb-1 text-uppercase text-secondary" style={{ fontSize: "0.65rem", letterSpacing: 0.5 }}>
                                            Terms &amp; Conditions :
                                        </span>
                                        <ol className="ps-3 m-0">
                                            <li>Goods once sold will not be taken back.</li>
                                            <li>Interest @18% p.a. will be charged if payment is not made within due date.</li>
                                            <li>Our risk and responsibility ceases as soon as the goods leave our premises.</li>
                                            <li>&quot;Subject to &apos;PUNE&apos; Jurisdiction only. E.&amp;.O.E&quot;</li>
                                        </ol>
                                    </div>
                                </div>

                                <div className="col-12 col-md-5 text-center d-flex flex-column justify-content-between align-items-center">
                                    <div className="w-100 mt-2" style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>
                                        For, FUMA
                                    </div>

                                    <div className="stamp-box">
                                        <div className="stamp-inner">FUSION MASTER TECH INNOVATION AND DEVELOPMENT PVT. LTD.</div>
                                        <div className="stamp-center">PROPRIETOR</div>
                                        <div className="stamp-location">* Pune *</div>
                                    </div>

                                    <div className="w-100 d-flex justify-content-around mt-2">
                                        <div className="text-center">
                                            <div style={{ width: 100, height: 35, borderBottom: "1px solid #000", margin: "0 auto" }} />
                                            <div className="pt-1 px-2" style={{ fontSize: "0.72rem", fontWeight: "bold" }}>(Receiver Signatory)</div>
                                        </div>
                                        <div className="text-center">
                                            <div style={{ width: 100, height: 35, borderBottom: "1px solid #000", margin: "0 auto" }} />
                                            <div className="pt-1 px-2" style={{ fontSize: "0.72rem", fontWeight: "bold" }}>(Authorised Signatory)</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
