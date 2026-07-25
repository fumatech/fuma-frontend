// src/Pages/Sale/CustomQuotationPage.jsx
import React, { useState } from "react";
import { toast } from "react-toastify";
import { jsPDF } from "jspdf";
import { Link } from "react-router-dom";
import fumaLogo from "../../assets/fuma-logo.jpeg";
// ─── FUMA Brand Colors ────────────────────────────────────────────────────────
const BRAND = {
    darkTeal: [12, 68, 97],
    lightTeal: [31, 74, 102],
    green: [120, 184, 51],
};

// ─── Default QO form state ────────────────────────────────────────────────────
const currentDate = new Date();
const year = currentDate.getFullYear();
const month = String(currentDate.getMonth() + 1).padStart(2, "0");

const DEFAULT_QO = {
    qoNumber: `FUMA/QO/${year}/${month}/001`,
    qoDate: currentDate.toISOString().split("T")[0],
    companyName: "Fusion Master Tech Innovation And Development Private Limited",
    companyAddr1: "Office No.6, Sr. No. 23/2 Barne Estate,",
    companyAddr2: "Opp. Padamji Papermill, Thergaon,",
    companyAddr3: "Chinchwad, Pune – 411033, Maharashtra, India",
    companyGst: "27AAFCF8338N1Z0",
    customerName: "Yogesh Malve",
    customerGst: "",
    customerPhone: "",
    customerEmail: "",
    shipAddr1: "Ravet, 412101, Maharashtra",
    shipAddr2: "",
    shipAddr3: "",
    shipAddr4: "",
    notes: "All items are subject to quality inspection upon delivery.\nPlease confirm order receipt within 2 business days.",
    contactEmail: "Nanasaheb.k@fuma.co.in",
    contactPhone: "+91-7249211259 / +91-9011103891",
    items: [
        { description: "12M TOUCH MATIC PANEL PREMIUM", qty: "01", unitPrice: "12000", isGroup: false },
        { description: "8M TOUCH MATIC PANEL PREMIUM", qty: "03", unitPrice: "9000", isGroup: false },
        { description: "6M TOUCH MATIC PANEL PREMIUM", qty: "02", unitPrice: "9000", isGroup: false },
        { description: "4M TOUCH MATIC PANEL PREMIUM", qty: "01", unitPrice: "6000", isGroup: false },
    ],
    gstRate: "18",
    applyGst: true,
};

// ─── Helper: compute subtotal from line items ────────────────────────────────
const calcSubtotal = (items) =>
    items.reduce((sum, item) => {
        if (item.isGroup) return sum;
        const qty = parseFloat(item.qty);
        const price = parseFloat(item.unitPrice);
        if (!isNaN(qty) && !isNaN(price)) {
            return sum + qty * price;
        }
        return sum;
    }, 0);

// ─── PDF Generator ────────────────────────────────────────────────────────────
const generateFUMAPdf = async (qo) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const W = 210;
    const H = 297;
    const L = 18;
    const R = W - 18;
    const CW = R - L;

    // ── Top bar
    doc.setFillColor(...BRAND.darkTeal);
    doc.rect(0, 0, W, 4, "F");

    // // ── FUMA logo
    // const img = new Image();
    // // img.src = "/images/fuma-logo.jpeg";
    // img.src = fumaLogo;
    // await new Promise((resolve) => {
    //     img.onload = () => {
    //         try {
    //             doc.addImage(img, "JPEG", L, 6, 25, 10);
    //         } catch (e) {
    //             console.error("Failed to add image to PDF:", e);
    //             doc.setFont("helvetica", "bold");
    //             doc.setFontSize(18);
    //             doc.setTextColor(...BRAND.darkTeal);
    //             doc.text("FUMA", L, 16);
    //         }
    //         resolve();
    //     };
    //     img.onerror = (err) => {
    //         console.error("Failed to load image:", img.src, err);
    //         doc.setFont("helvetica", "bold");
    //         doc.setFontSize(18);
    //         doc.setTextColor(...BRAND.darkTeal);
    //         doc.text("FUMA", L, 16);
    //         resolve();
    //     };
    // });
    // ── FUMA logo
    const img = new Image();

    await new Promise((resolve) => {
        img.onload = () => {
            try {
                doc.addImage(img, "JPEG", L, 8, 42, 20);
            } catch (e) {
                console.error("Failed to add image to PDF:", e);

                // Fallback if addImage fails
                doc.setFont("helvetica", "bold");
                doc.setFontSize(18);
                doc.setTextColor(...BRAND.darkTeal);
                doc.text("FUMA", L, 16);
            }
            resolve();
        };

        img.onerror = (err) => {
            console.error("Failed to load image:", err);

            // Fallback if image doesn't load
            doc.setFont("helvetica", "bold");
            doc.setFontSize(18);
            doc.setTextColor(...BRAND.darkTeal);
            doc.text("FUMA", L, 16);

            resolve();
        };

        // Set the image source after assigning handlers
        img.src = fumaLogo;
    });

    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    // doc.text("Powering Innovation.", L, 20);

    // ── QUOTATION title (right)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(...BRAND.darkTeal);
    doc.text("QUOTATION", R, 16, { align: "right" });

    // Green underline
    doc.setDrawColor(...BRAND.green);
    doc.setLineWidth(0.8);
    doc.line(R - 70, 18, R, 18);

    // ── Company name & address
    let y = 26;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...BRAND.darkTeal);
    doc.text(qo.companyName, L, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(50, 50, 50);
    [qo.companyAddr1, qo.companyAddr2, qo.companyAddr3].forEach((line) => {
        if (line && line.trim()) {
            doc.text(line, L, y);
            y += 3.8;
        }
    });

    // ── Company GST
    if (qo.companyGst) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(50, 50, 50);
        doc.text(`GST Number: ${qo.companyGst}`, L, y);
        y += 3.8;
    }

    // ── QO Date & Number (right side)
    const dateX = R - 55;

    // Format date from YYYY-MM-DD to DD/MM/YYYY
    const [yyyy, mm, dd] = qo.qoDate.split('-');
    const formattedDate = dd && mm && yyyy ? `${dd}/${mm}/${yyyy}` : qo.qoDate;

    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text("DATE:", dateX, 26);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(formattedDate, dateX + 18, 26);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text("QO #:", dateX, 31);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(qo.qoNumber, dateX + 18, 31);

    y += 3;

    // ── Green divider
    doc.setDrawColor(...BRAND.green);
    doc.setLineWidth(0.8);
    doc.line(L, y, R, y);
    y += 5;

    // ── Customer + Ship To boxes
    const boxH = 34;
    const half = CW / 2 - 3;

    const drawSection = (x, title, lines) => {
        doc.setFillColor(...BRAND.lightTeal);
        doc.rect(x, y, half, 6, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text(title, x + 3, y + 4.2);

        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.4);
        doc.rect(x, y + 6, half, boxH, "S");

        const filledLines = lines.filter((line) => line && line.trim());

        let ly = y + 6 + 5;
        filledLines.forEach((line, i) => {
            doc.setFont("helvetica", i === 0 ? "bold" : "normal");
            doc.setFontSize(7.5);
            doc.setTextColor(20, 20, 20);

            const splitLines = doc.splitTextToSize(line, half - 6);
            splitLines.forEach((splitLine) => {
                doc.text(splitLine, x + 3, ly);
                ly += 3.8;
            });
        });
    };

    const customerLines = [qo.customerName];
    if (qo.customerGst) {
        customerLines.push(`GST: ${qo.customerGst}`);
    }
    if (qo.customerPhone) {
        customerLines.push(`Phone: ${qo.customerPhone}`);
    }
    if (qo.customerEmail) {
        customerLines.push(`Email: ${qo.customerEmail}`);
    }

    drawSection(L, "CUSTOMER", customerLines);
    drawSection(L + half + 6, "SHIP TO", [
        qo.shipAddr1,
        qo.shipAddr2,
        qo.shipAddr3,
        qo.shipAddr4,
    ]);

    y += 6 + boxH + 5;

    // ── Items table
    const colDesc = CW * 0.58;
    const colQty = CW * 0.1;
    const colUP = CW * 0.16;
    const colTot = CW * 0.16;
    const cols = [L, L + colDesc, L + colDesc + colQty, L + colDesc + colQty + colUP];
    const colWs = [colDesc, colQty, colUP, colTot];
    const hdrH = 6;
    const rowH = 5.5;

    // Header
    doc.setFillColor(...BRAND.lightTeal);
    doc.rect(L, y, CW, hdrH, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    ["DESCRIPTION", "QTY", "UNIT PRICE", "DISCOUNT PRICE"].forEach((h, i) => {
        if (i === 0) doc.text(h, cols[i] + 3, y + 4.2);
        else doc.text(h, cols[i] + colWs[i] / 2, y + 4.2, { align: "center" });
    });
    y += hdrH;

    // Rows
    const MIN_ROWS = 15;
    const itemsCount = qo.items.length;
    const rowsToRender = Math.max(itemsCount, MIN_ROWS);

    for (let idx = 0; idx < rowsToRender; idx++) {
        const item = idx < itemsCount ? qo.items[idx] : {};
        const bg = idx % 2 === 0 ? [255, 255, 255] : [245, 246, 248];
        doc.setFillColor(...bg);
        doc.rect(L, y, CW, rowH, "F");

        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.3);
        cols.slice(1).forEach((cx) => doc.line(cx, y, cx, y + rowH));
        doc.line(L, y + rowH, R, y + rowH);

        if (item.description) {
            doc.setFont("helvetica", item.isGroup ? "bold" : "normal");
            doc.setFontSize(7.5);
            doc.setTextColor(
                ...(item.isGroup ? BRAND.darkTeal : [20, 20, 20])
            );
            doc.text(item.description, cols[0] + 3, y + rowH - 1.8);
        }

        if (item.qty) {
            doc.setFont("helvetica", "normal");
            doc.setTextColor(20, 20, 20);
            doc.text(item.qty, cols[1] + colWs[1] / 2, y + rowH - 1.8, { align: "center" });
        }
        if (item.unitPrice) {
            doc.text(item.unitPrice, cols[2] + colWs[2] - 2, y + rowH - 1.8, { align: "right" });
        }
        const total =
            item.qty && item.unitPrice
                ? (parseFloat(item.qty) * parseFloat(item.unitPrice)).toFixed(0)
                : "";
        if (total) {
            doc.setFont("helvetica", "bold");
            doc.text(total, cols[3] + colWs[3] - 2, y + rowH - 1.8, { align: "right" });
        }
        y += rowH;
    }

    // Border around items
    doc.setDrawColor(...BRAND.lightTeal);
    doc.setLineWidth(0.6);
    doc.rect(
        L,
        y - rowH * rowsToRender - hdrH,
        CW,
        rowH * rowsToRender + hdrH,
        "S"
    );

    y += 4;

    // ── Totals block
    const subtotal = calcSubtotal(qo.items);
    const gst = qo.applyGst ? subtotal * (parseFloat(qo.gstRate || 0) / 100) : 0;
    const total = subtotal + gst;
    const totX = L + CW * 0.6;
    const totW = CW * 0.4;
    const totRowH = 6;

    const drawTotRow = (label, val, isHighlight) => {
        if (isHighlight) {
            doc.setFillColor(...BRAND.darkTeal);
            doc.setTextColor(255, 255, 255);
        } else {
            doc.setFillColor(245, 246, 247);
            doc.setTextColor(30, 30, 30);
        }
        doc.rect(totX, y, totW, totRowH, "F");
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.rect(totX, y, totW, totRowH, "S");
        doc.setFont("helvetica", isHighlight ? "bold" : "normal");
        doc.setFontSize(8);
        doc.text(label, totX + 3, y + 4.2);
        doc.setFont("helvetica", "bold");
        doc.text(val, totX + totW - 3, y + 4.2, { align: "right" });
        y += totRowH;
    };

    const noteY = y;
    drawTotRow("SUBTOTAL", `${subtotal.toFixed(0)}`);
    if (qo.applyGst) {
        drawTotRow(`GST @ ${qo.gstRate}%`, `${gst.toFixed(0)}`);
    }
    drawTotRow("SHIPPING", "—");
    drawTotRow(
        "TOTAL",
        `${total.toFixed(0)}`,
        true
    );

    // ── Notes box
    const noteW = CW * 0.58;
    doc.setFillColor(...BRAND.lightTeal);
    doc.rect(L, noteY, noteW, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text("COMMENTS / SPECIAL INSTRUCTIONS", L + 3, noteY + 4.2);

    doc.setFillColor(245, 246, 247);
    doc.rect(L, noteY + 6, noteW, 18, "F");
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.4);
    doc.rect(L, noteY + 6, noteW, 18, "S");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(80, 80, 80);
    const splitNotes = doc.splitTextToSize(qo.notes, noteW - 6);
    doc.text(splitNotes, L + 3, noteY + 12);

    // ── Footer
    const footerY = H - 20;
    doc.setDrawColor(...BRAND.green);
    doc.setLineWidth(1);
    doc.line(L, footerY, R, footerY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    doc.text(
        `For questions about this quotation order, please contact: ${qo.contactEmail} | ${qo.contactPhone}`,
        W / 2,
        footerY + 5,
        { align: "center" }
    );

    // Bottom bars
    doc.setFillColor(...BRAND.darkTeal);
    doc.rect(0, H - 5, W, 5, "F");
    doc.setFillColor(...BRAND.green);
    doc.rect(0, H - 7, W, 2, "F");

    doc.save(`FUMA_QO_${qo.qoNumber.replace(/\//g, "_")}.pdf`);
};

// ─── Main Component ──────────────────────────────────────────────────────────
const CustomQuotationPage = () => {
    const [qo, setQO] = useState(DEFAULT_QO);

    const handleField = (field, value) =>
        setQO((prev) => ({ ...prev, [field]: value }));

    const handleItemChange = (idx, field, value) => {
        const updated = [...qo.items];
        updated[idx] = { ...updated[idx], [field]: value };
        setQO((prev) => ({ ...prev, items: updated }));
    };

    const addItem = () =>
        setQO((prev) => ({
            ...prev,
            items: [
                ...prev.items,
                { description: "", qty: "", unitPrice: "", isGroup: false },
            ],
        }));

    const removeItem = (idx) =>
        setQO((prev) => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== idx),
        }));

    const toggleGroup = (idx) => {
        const updated = [...qo.items];
        updated[idx] = { ...updated[idx], isGroup: !updated[idx].isGroup };
        setQO((prev) => ({ ...prev, items: updated }));
    };

    const subtotal = calcSubtotal(qo.items);
    const gstAmount = qo.applyGst ? subtotal * (parseFloat(qo.gstRate || 0) / 100) : 0;
    const grandTotal = subtotal + gstAmount;

    const handleGenerate = async () => {
        if (!qo.customerName.trim()) {
            toast.warning("Please enter customer name");
            return;
        }
        if (qo.items.filter(item => item.description.trim()).length === 0) {
            toast.warning("Please add at least one item");
            return;
        }
        await generateFUMAPdf(qo);
        toast.success("Quotation PDF generated!");
    };

    const handleReset = () => {
        setQO(DEFAULT_QO);
        toast.info("Form reset to default");
    };

    return (
        <div className="content-wrapper" style={{ background: "#f4f6f9", minHeight: "100vh" }}>
            <section className="content-header">
                <div className="container-fluid">
                    <div className="row mb-2">
                        <div className="col-sm-6">
                            <h1 className="all-heading">Custom Quotation</h1>
                            <span className="d-inline d-md-block sub-heading">
                                Create custom quotation and generate PDF
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="content">
                <div className="container-fluid">
                    {/* ── QO Meta ── */}
                    <div className="card mb-3">
                        <div className="card-header" style={{ background: "linear-gradient(135deg, #0C4461, #1f4a66)", color: "#fff" }}>
                            <i className="fa fa-file-invoice me-2" /> Quotation Details
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-4 mb-3">
                                    <label className="form-label fw-bold text-primary">Quotation Number</label>
                                    <input
                                        className="form-control"
                                        value={qo.qoNumber}
                                        onChange={(e) => handleField("qoNumber", e.target.value)}
                                    />
                                </div>
                                <div className="col-md-4 mb-3">
                                    <label className="form-label fw-bold text-primary">Quotation Date</label>
                                    <input
                                        className="form-control"
                                        type="date"
                                        value={qo.qoDate}
                                        onChange={(e) => handleField("qoDate", e.target.value)}
                                    />
                                </div>
                                <div className="col-md-4 mb-3">
                                    <label className="form-label fw-bold text-primary">GST Rate (%)</label>
                                    <input
                                        className="form-control"
                                        type="number"
                                        value={qo.gstRate}
                                        onChange={(e) => handleField("gstRate", e.target.value)}
                                        disabled={!qo.applyGst}
                                    />
                                    <div className="form-check mt-2">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="applyGstCheck"
                                            checked={qo.applyGst}
                                            onChange={(e) => handleField("applyGst", e.target.checked)}
                                        />
                                        <label className="form-check-label" htmlFor="applyGstCheck">
                                            Apply GST to this Quotation
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Company Details ── */}
                    <div className="card mb-3">
                        <div className="card-header" style={{ background: "linear-gradient(135deg, #0C4461, #1f4a66)", color: "#fff" }}>
                            <i className="fa fa-building me-2" /> Company Details
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-12 mb-2">
                                    <label className="form-label fw-bold text-primary">Company Name</label>
                                    <input className="form-control" value={qo.companyName} onChange={(e) => handleField("companyName", e.target.value)} />
                                </div>
                                <div className="col-md-6 mb-2">
                                    <label className="form-label fw-bold text-primary">Address Line 1</label>
                                    <input className="form-control" value={qo.companyAddr1} onChange={(e) => handleField("companyAddr1", e.target.value)} />
                                </div>
                                <div className="col-md-6 mb-2">
                                    <label className="form-label fw-bold text-primary">Address Line 2</label>
                                    <input className="form-control" value={qo.companyAddr2} onChange={(e) => handleField("companyAddr2", e.target.value)} />
                                </div>
                                <div className="col-md-6 mb-2">
                                    <label className="form-label fw-bold text-primary">Address Line 3</label>
                                    <input className="form-control" value={qo.companyAddr3} onChange={(e) => handleField("companyAddr3", e.target.value)} />
                                </div>
                                <div className="col-md-6 mb-2">
                                    <label className="form-label fw-bold text-primary">Company GST Number</label>
                                    <input className="form-control" value={qo.companyGst || ""} onChange={(e) => handleField("companyGst", e.target.value)} placeholder="Enter company GST number" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Customer + Ship To ── */}
                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <div className="card h-100">
                                <div className="card-header" style={{ background: "linear-gradient(135deg, #0C4461, #1f4a66)", color: "#fff" }}>
                                    <i className="fa fa-user me-2" /> Customer
                                </div>
                                <div className="card-body">
                                    <div className="mb-2">
                                        <label className="form-label fw-bold text-primary">Customer Name *</label>
                                        <input className="form-control" value={qo.customerName} onChange={(e) => handleField("customerName", e.target.value)} placeholder="Enter customer name" />
                                    </div>
                                    <div className="mb-2">
                                        <label className="form-label fw-bold text-primary">Customer GST</label>
                                        <input className="form-control" value={qo.customerGst || ""} onChange={(e) => handleField("customerGst", e.target.value)} placeholder="Enter customer GST number" />
                                    </div>
                                    <div className="mb-2">
                                        <label className="form-label fw-bold text-primary">Customer Phone</label>
                                        <input className="form-control" value={qo.customerPhone || ""} onChange={(e) => handleField("customerPhone", e.target.value)} placeholder="Enter phone number" />
                                    </div>
                                    <div className="mb-2">
                                        <label className="form-label fw-bold text-primary">Customer Email</label>
                                        <input className="form-control" value={qo.customerEmail || ""} onChange={(e) => handleField("customerEmail", e.target.value)} placeholder="Enter email address" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-6 mb-3">
                            <div className="card h-100">
                                <div className="card-header" style={{ background: "linear-gradient(135deg, #0C4461, #1f4a66)", color: "#fff" }}>
                                    <i className="fa fa-truck me-2" /> Ship To
                                </div>
                                <div className="card-body">
                                    <div className="mb-2">
                                        <label className="form-label fw-bold text-primary">Address Line 1</label>
                                        <input className="form-control" value={qo.shipAddr1} onChange={(e) => handleField("shipAddr1", e.target.value)} />
                                    </div>
                                    <div className="mb-2">
                                        <label className="form-label fw-bold text-primary">Address Line 2</label>
                                        <input className="form-control" value={qo.shipAddr2} onChange={(e) => handleField("shipAddr2", e.target.value)} />
                                    </div>
                                    <div className="mb-2">
                                        <label className="form-label fw-bold text-primary">Address Line 3</label>
                                        <input className="form-control" value={qo.shipAddr3} onChange={(e) => handleField("shipAddr3", e.target.value)} />
                                    </div>
                                    <div className="mb-2">
                                        <label className="form-label fw-bold text-primary">Address Line 4</label>
                                        <input className="form-control" value={qo.shipAddr4} onChange={(e) => handleField("shipAddr4", e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Items Table ── */}
                    <div className="card mb-3">
                        <div className="card-header" style={{ background: "linear-gradient(135deg, #0C4461, #1f4a66)", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span><i className="fa fa-list me-2" /> Line Items</span>
                            <button
                                onClick={addItem}
                                className="btn btn-success btn-sm"
                                style={{ background: "#78B833", border: "none" }}
                            >
                                <i className="fa fa-plus me-1" /> Add Row
                            </button>
                        </div>
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-bordered table-hover mb-0">
                                    <thead style={{ background: "#0C4461", color: "#fff" }}>
                                        <tr>
                                            <th style={{ width: "38%" }}>Description</th>
                                            <th style={{ width: "10%", textAlign: "center" }}>Qty</th>
                                            <th style={{ width: "15%", textAlign: "right" }}>Unit Price</th>
                                            <th style={{ width: "15%", textAlign: "right" }}>Total</th>
                                            <th style={{ width: "10%", textAlign: "center" }}>Group</th>
                                            <th style={{ width: "12%", textAlign: "center" }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {qo.items.map((item, idx) => {
                                            const lineTotal =
                                                item.qty && item.unitPrice && !item.isGroup
                                                    ? (parseFloat(item.qty) * parseFloat(item.unitPrice)).toFixed(2)
                                                    : "";
                                            return (
                                                <tr
                                                    key={idx}
                                                    style={{
                                                        background: item.isGroup
                                                            ? "#eaf4fb"
                                                            : idx % 2 === 0
                                                                ? "#fff"
                                                                : "#f8f9fa",
                                                    }}
                                                >
                                                    <td>
                                                        <input
                                                            className="form-control form-control-sm"
                                                            style={{ fontWeight: item.isGroup ? "700" : "400", color: item.isGroup ? "#0C4461" : "#222" }}
                                                            value={item.description}
                                                            onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                                                            placeholder="Item description"
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            className="form-control form-control-sm text-center"
                                                            value={item.qty}
                                                            onChange={(e) => handleItemChange(idx, "qty", e.target.value)}
                                                            placeholder="—"
                                                            disabled={item.isGroup}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            className="form-control form-control-sm text-end"
                                                            value={item.unitPrice}
                                                            onChange={(e) => handleItemChange(idx, "unitPrice", e.target.value)}
                                                            placeholder="—"
                                                            disabled={item.isGroup}
                                                        />
                                                    </td>
                                                    <td className="text-end fw-bold text-primary">
                                                        {lineTotal ? `₹${parseFloat(lineTotal).toLocaleString("en-IN")}` : "—"}
                                                    </td>
                                                    <td className="text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={item.isGroup}
                                                            onChange={() => toggleGroup(idx)}
                                                            title="Mark as group header"
                                                            style={{ width: "18px", height: "18px", cursor: "pointer" }}
                                                        />
                                                    </td>
                                                    <td className="text-center">
                                                        <button
                                                            onClick={() => removeItem(idx)}
                                                            className="btn btn-sm btn-danger"
                                                            title="Remove row"
                                                        >
                                                            <i className="fa fa-trash"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* ── Subtotal and Summary ── */}
                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <div className="card h-100">
                                <div className="card-header" style={{ background: "linear-gradient(135deg, #0C4461, #1f4a66)", color: "#fff" }}>
                                    <i className="fa fa-comment me-2" /> Footer Details
                                </div>
                                <div className="card-body">
                                    <div className="mb-2">
                                        <label className="form-label fw-bold text-primary">Notes / Special Instructions</label>
                                        <textarea
                                            className="form-control"
                                            rows="3"
                                            value={qo.notes}
                                            onChange={(e) => handleField("notes", e.target.value)}
                                            placeholder="Enter any special instructions or comments..."
                                        />
                                    </div>
                                    <div className="row">
                                        <div className="col-6">
                                            <label className="form-label fw-bold text-primary">Contact Email</label>
                                            <input className="form-control" value={qo.contactEmail} onChange={(e) => handleField("contactEmail", e.target.value)} />
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label fw-bold text-primary">Contact Phone</label>
                                            <input className="form-control" value={qo.contactPhone} onChange={(e) => handleField("contactPhone", e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-6 mb-3">
                            <div className="card h-100">
                                <div className="card-header" style={{ background: "linear-gradient(135deg, #0C4461, #1f4a66)", color: "#fff" }}>
                                    <i className="fa fa-calculator me-2" /> Summary
                                </div>
                                <div className="card-body">
                                    <div className="mb-3">
                                        <label className="form-label fw-bold text-primary">Subtotal (auto-calculated)</label>
                                        <input
                                            className="form-control form-control-lg fw-bold text-primary"
                                            value={`₹${subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
                                            readOnly
                                            disabled
                                        />
                                    </div>
                                    <div className="bg-light p-3 rounded">
                                        {qo.applyGst ? (
                                            <>
                                                <div className="d-flex justify-content-between mb-2">
                                                    <span className="fw-bold">GST ({qo.gstRate}%)</span>
                                                    <span className="text-primary fw-bold">
                                                        ₹{gstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                                <hr />
                                            </>
                                        ) : (
                                            <div className="d-flex justify-content-between mb-2">
                                                <span className="fw-bold text-muted">GST not applied</span>
                                            </div>
                                        )}
                                        <div className="d-flex justify-content-between" style={{ background: "#0C4461", color: "#fff", padding: "10px", borderRadius: "4px" }}>
                                            <span className="fw-bold">Total Amount</span>
                                            <span className="fw-bold">
                                                ₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Action Buttons ── */}
                    <div className="card">
                        <div className="card-body">
                            <div className="d-flex justify-content-end gap-2" style={{ flexWrap: "wrap" }}>
                                <button
                                    onClick={handleReset}
                                    className="btn btn-outline-danger"
                                >
                                    <i className="fa fa-undo me-1" /> Reset
                                </button>
                                <button
                                    onClick={handleGenerate}
                                    className="btn"
                                    style={{
                                        background: "linear-gradient(135deg, #78B833, #5a9626)",
                                        border: "none",
                                        color: "#fff",
                                        fontWeight: "700",
                                        padding: "10px 28px",
                                    }}
                                >
                                    <i className="fa fa-file-pdf me-2" />
                                    Generate PDF
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── Brand Colors Preview ── */}
                    <div className="d-flex align-items-center gap-3 mt-3" style={{ flexWrap: "wrap" }}>
                        <span className="fw-bold text-secondary" style={{ fontSize: "12px" }}>Brand Colors:</span>
                        <div style={{ width: "30px", height: "20px", background: "#0C4461", borderRadius: "4px", border: "1px solid #ddd" }} title="#0C4461" />
                        <div style={{ width: "30px", height: "20px", background: "#1f4a66", borderRadius: "4px", border: "1px solid #ddd" }} title="#1f4a66" />
                        <div style={{ width: "30px", height: "20px", background: "#78B833", borderRadius: "4px", border: "1px solid #ddd" }} title="#78B833" />
                        <span style={{ fontSize: "10px", color: "#aaa" }}>These colors appear in the generated PDF</span>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default CustomQuotationPage;
