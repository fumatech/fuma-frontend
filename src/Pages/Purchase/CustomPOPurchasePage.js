// // src/Pages/Purchase/CustomPOPurchasePage.jsx
// import React, { useState } from "react";
// import { toast } from "react-toastify";
// import { jsPDF } from "jspdf";
// import { Link } from "react-router-dom";

// // ─── FUMA Brand Colors ────────────────────────────────────────────────────────
// const BRAND = {
//     darkTeal: [12, 68, 97],
//     lightTeal: [31, 74, 102],
//     green: [120, 184, 51],
// };

// // ─── Default PO form state ────────────────────────────────────────────────────
// const DEFAULT_PO = {
//     poNumber: "FUMA/PO/2026/001",
//     poDate: new Date().toISOString().split('T')[0],
//     companyName: "Fusion Master Tech Innovation And Development Private Limited",
//     companyAddr1: "Office No.6, Sr. No. 23/2 Barne Estate,",
//     companyAddr2: "Opp. Padamji Papermill, Thergaon,",
//     companyAddr3: "Chinchwad, Pune – 411033, Maharashtra, India",
//     companyGst: "27AAFCF8338N1Z0",  // ← Added company GST
//     vendorName: "OEM Partners",
//     vendorGst: "",
//     vendorPhone: "",
//     vendorEmail: "",
//     shipAddr1: "SY NO 41, PLOT NO 102,",
//     shipAddr2: "Kavuri Hills Phase-1, Guttala Begumpet,",
//     shipAddr3: "Madhapur, Hyderabad,",
//     shipAddr4: "Rangareddy, Telangana – 500081",
//     notes: "All items are subject to quality inspection upon delivery.",
//     contactEmail: "Nanasaheb.k@fuma.co.in",
//     contactPhone: "+91-7249211259 / +91-9011103891",
//     items: [
//         { description: "Demobox BOM", qty: "", unitPrice: "", isGroup: true },
//         { description: "Demobox", qty: "1", unitPrice: "28000.00", isGroup: false },
//         { description: "12V/2A SMPS_Demo Box", qty: "9", unitPrice: "", isGroup: false },
//         { description: "Led Strip 3 in 1", qty: "22", unitPrice: "", isGroup: false },
//         { description: "AC Fan", qty: "1", unitPrice: "", isGroup: false },
//         { description: "1.0 Sqmm Wire", qty: "5", unitPrice: "", isGroup: false },
//         { description: "2 Core Wire", qty: "15", unitPrice: "", isGroup: false },
//         { description: "Full Glass Touch_4S_1F_4M (Ivory with Ivory)", qty: "1", unitPrice: "", isGroup: false },
//         { description: "7M Frinto Base Plates", qty: "1", unitPrice: "", isGroup: false },
//         { description: "7M Frinto Cover Plate Velvet Black", qty: "1", unitPrice: "", isGroup: false },
//         { description: "USB Adapter", qty: "1", unitPrice: "", isGroup: false },
//         { description: "4 Touch V2", qty: "1", unitPrice: "", isGroup: false },
//         { description: "Fan Touch V2", qty: "1", unitPrice: "", isGroup: false },
//         { description: "HD Touch V2", qty: "1", unitPrice: "", isGroup: false },
//         { description: "Full Glass Touch 10 Switch 8M (Black with Black)", qty: "1", unitPrice: "", isGroup: false },
//         { description: "Full Glass Touch 2 Switch 1 Curtain 2M (Grey with Grey)", qty: "1", unitPrice: "", isGroup: false },
//         { description: "Smart COB CCT with Light", qty: "1", unitPrice: "", isGroup: false },
//         { description: "Smart IR", qty: "1", unitPrice: "", isGroup: false },
//         { description: "4 Switch Dummy", qty: "1", unitPrice: "", isGroup: false },
//         { description: "3M Tape Half Roll", qty: "1", unitPrice: "", isGroup: false },
//         { description: "NFC Sticker", qty: "2", unitPrice: "", isGroup: false },
//     ],
//     gstRate: "18",
//     applyGst: true, // ← NEW: toggle to include/exclude GST entirely
// };

// // ─── Helper: compute subtotal from line items ────────────────────────────────
// const calcSubtotal = (items) =>
//     items.reduce((sum, item) => {
//         if (item.isGroup) return sum;
//         const qty = parseFloat(item.qty);
//         const price = parseFloat(item.unitPrice);
//         if (!isNaN(qty) && !isNaN(price)) {
//             return sum + qty * price;
//         }
//         return sum;
//     }, 0);

// // ─── PDF Generator ────────────────────────────────────────────────────────────
// const generateFUMAPdf = (po) => {
//     const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
//     const W = 210;
//     const H = 297;
//     const L = 18;
//     const R = W - 18;
//     const CW = R - L;

//     // ── Top bar
//     doc.setFillColor(...BRAND.darkTeal);
//     doc.rect(0, 0, W, 4, "F");

//     // ── FUMA logo text (top-left)
//     doc.setFont("helvetica", "bold");
//     doc.setFontSize(18);
//     doc.setTextColor(...BRAND.darkTeal);
//     doc.text("FUMA", L, 16);
//     doc.setFontSize(6.5);
//     doc.setFont("helvetica", "normal");
//     doc.setTextColor(80, 80, 80);
//     doc.text("Powering Innovation", L, 20);

//     // ── PURCHASE ORDER title (right)
//     doc.setFont("helvetica", "bold");
//     doc.setFontSize(20);
//     doc.setTextColor(...BRAND.darkTeal);
//     doc.text("PURCHASE ORDER", R, 16, { align: "right" });

//     // Green underline
//     doc.setDrawColor(...BRAND.green);
//     doc.setLineWidth(0.8);
//     doc.line(R - 70, 18, R, 18);

//     // ── Company name & address
//     let y = 26;
//     doc.setFont("helvetica", "bold");
//     doc.setFontSize(8.5);
//     doc.setTextColor(...BRAND.darkTeal);
//     doc.text(po.companyName, L, y);
//     y += 4;
//     doc.setFont("helvetica", "normal");
//     doc.setFontSize(7.5);
//     doc.setTextColor(50, 50, 50);
//     [po.companyAddr1, po.companyAddr2, po.companyAddr3].forEach((line) => {
//         doc.text(line, L, y);
//         y += 3.8;
//     });

//     // ── Company GST (NEW)
//     if (po.companyGst) {
//         doc.setFont("helvetica", "bold");
//         doc.setFontSize(7.5);
//         doc.setTextColor(50, 50, 50);
//         doc.text(`GST Number: ${po.companyGst}`, L, y);
//         y += 3.8;
//     }

//     // ── PO Date & Number (right side)
//     const dateX = R - 55;
//     doc.setFontSize(8);
//     doc.setTextColor(80, 80, 80);
//     doc.text("DATE:", dateX, 26);
//     doc.setFont("helvetica", "bold");
//     doc.setTextColor(30, 30, 30);
//     doc.text(po.poDate, dateX + 18, 26);
//     doc.setFont("helvetica", "normal");
//     doc.setTextColor(80, 80, 80);
//     doc.text("PO #:", dateX, 31);
//     doc.setFont("helvetica", "bold");
//     doc.setTextColor(30, 30, 30);
//     doc.text(po.poNumber, dateX + 18, 31);

//     y += 3;

//     // ── Green divider
//     doc.setDrawColor(...BRAND.green);
//     doc.setLineWidth(0.8);
//     doc.line(L, y, R, y);
//     y += 5;

//     // ── Vendor + Ship To boxes
//     const boxH = 34;
//     const half = CW / 2 - 3;

//     // FIX: text now flows TOP -> DOWN inside each box (was bottom-up before)
//     const drawSection = (x, title, lines) => {
//         doc.setFillColor(...BRAND.lightTeal);
//         doc.rect(x, y, half, 6, "F");
//         doc.setFont("helvetica", "bold");
//         doc.setFontSize(8);
//         doc.setTextColor(255, 255, 255);
//         doc.text(title, x + 3, y + 4.2);

//         doc.setDrawColor(200, 200, 200);
//         doc.setLineWidth(0.4);
//         doc.rect(x, y + 6, half, boxH, "S");

//         let ly = y + 6 + 5; // start near the TOP of the box, not the bottom
//         lines.forEach((line, i) => {
//             doc.setFont("helvetica", i === 0 ? "bold" : "normal");
//             doc.setFontSize(7.5);
//             doc.setTextColor(20, 20, 20);
//             doc.text(line, x + 3, ly);
//             ly += 3.8; // move DOWN for each subsequent line
//         });
//     };

//     // Vendor lines with GST — name first, then GST, then phone
//     const vendorLines = [po.vendorName];
//     if (po.vendorGst) {
//         vendorLines.push(`GST: ${po.vendorGst}`);
//     }
//     if (po.vendorPhone) {
//         vendorLines.push(`Phone: ${po.vendorPhone}`);
//     }

//     drawSection(L, "VENDOR", vendorLines);
//     drawSection(L + half + 6, "SHIP TO", [
//         po.shipAddr1,
//         po.shipAddr2,
//         po.shipAddr3,
//         po.shipAddr4,
//     ]);

//     y += 6 + boxH + 5;

//     // ── Items table
//     const colDesc = CW * 0.58;
//     const colQty = CW * 0.1;
//     const colUP = CW * 0.16;
//     const colTot = CW * 0.16;
//     const cols = [L, L + colDesc, L + colDesc + colQty, L + colDesc + colQty + colUP];
//     const colWs = [colDesc, colQty, colUP, colTot];
//     const hdrH = 6;
//     const rowH = 5.5;

//     // Header
//     doc.setFillColor(...BRAND.lightTeal);
//     doc.rect(L, y, CW, hdrH, "F");
//     doc.setFont("helvetica", "bold");
//     doc.setFontSize(8);
//     doc.setTextColor(255, 255, 255);
//     ["DESCRIPTION", "QTY", "UNIT PRICE", "TOTAL"].forEach((h, i) => {
//         if (i === 0) doc.text(h, cols[i] + 3, y + 4.2);
//         else doc.text(h, cols[i] + colWs[i] / 2, y + 4.2, { align: "center" });
//     });
//     y += hdrH;

//     // Rows
//     po.items.forEach((item, idx) => {
//         const bg = idx % 2 === 0 ? [255, 255, 255] : [245, 246, 248];
//         doc.setFillColor(...bg);
//         doc.rect(L, y, CW, rowH, "F");

//         doc.setDrawColor(220, 220, 220);
//         doc.setLineWidth(0.3);
//         cols.slice(1).forEach((cx) => doc.line(cx, y, cx, y + rowH));
//         doc.line(L, y + rowH, R, y + rowH);

//         doc.setFont("helvetica", item.isGroup ? "bold" : "normal");
//         doc.setFontSize(7.5);
//         doc.setTextColor(
//             ...(item.isGroup ? BRAND.darkTeal : [20, 20, 20])
//         );
//         doc.text(item.description, cols[0] + 3, y + rowH - 1.8);

//         if (item.qty) {
//             doc.setFont("helvetica", "normal");
//             doc.setTextColor(20, 20, 20);
//             doc.text(item.qty, cols[1] + colWs[1] / 2, y + rowH - 1.8, { align: "center" });
//         }
//         if (item.unitPrice) {
//             doc.text(item.unitPrice, cols[2] + colWs[2] - 2, y + rowH - 1.8, { align: "right" });
//         }
//         const total =
//             item.qty && item.unitPrice
//                 ? (parseFloat(item.qty) * parseFloat(item.unitPrice)).toFixed(2)
//                 : "";
//         if (total) {
//             doc.setFont("helvetica", "bold");
//             doc.text(total, cols[3] + colWs[3] - 2, y + rowH - 1.8, { align: "right" });
//         }
//         y += rowH;
//     });

//     // Border around items
//     doc.setDrawColor(...BRAND.lightTeal);
//     doc.setLineWidth(0.6);
//     doc.rect(
//         L,
//         y - rowH * po.items.length - hdrH,
//         CW,
//         rowH * po.items.length + hdrH,
//         "S"
//     );

//     y += 4;

//     // ── Totals block
//     // FIX: subtotal is now ALWAYS derived from the line items (qty × unitPrice),
//     // never from a manually-typed static field.
//     const subtotal = calcSubtotal(po.items);
//     // FIX: GST is only applied when po.applyGst is true.
//     const gst = po.applyGst ? subtotal * (parseFloat(po.gstRate || 0) / 100) : 0;
//     const total = subtotal + gst;
//     const totX = L + CW * 0.6;
//     const totW = CW * 0.4;
//     const totRowH = 6;

//     const drawTotRow = (label, val, isHighlight) => {
//         if (isHighlight) {
//             doc.setFillColor(...BRAND.darkTeal);
//             doc.setTextColor(255, 255, 255);
//         } else {
//             doc.setFillColor(245, 246, 247);
//             doc.setTextColor(30, 30, 30);
//         }
//         doc.rect(totX, y, totW, totRowH, "F");
//         doc.setDrawColor(200, 200, 200);
//         doc.setLineWidth(0.3);
//         doc.rect(totX, y, totW, totRowH, "S");
//         doc.setFont("helvetica", isHighlight ? "bold" : "normal");
//         doc.setFontSize(8);
//         doc.text(label, totX + 3, y + 4.2);
//         doc.setFont("helvetica", "bold");
//         doc.text(val, totX + totW - 3, y + 4.2, { align: "right" });
//         y += totRowH;
//     };

//     const noteY = y;
//     drawTotRow("SUBTOTAL", `Rs. ${subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`);
//     // FIX: only render the GST row at all when GST is switched on
//     if (po.applyGst) {
//         drawTotRow(`GST @ ${po.gstRate}%`, `Rs. ${gst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`);
//     }
//     drawTotRow("SHIPPING", "—");
//     drawTotRow(
//         "TOTAL",
//         `Rs. ${total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
//         true
//     );

//     // ── Notes box
//     const noteW = CW * 0.58;
//     doc.setFillColor(...BRAND.lightTeal);
//     doc.rect(L, noteY, noteW, 6, "F");
//     doc.setFont("helvetica", "bold");
//     doc.setFontSize(8);
//     doc.setTextColor(255, 255, 255);
//     doc.text("COMMENTS / SPECIAL INSTRUCTIONS", L + 3, noteY + 4.2);

//     doc.setFillColor(245, 246, 247);
//     doc.rect(L, noteY + 6, noteW, 18, "F");
//     doc.setDrawColor(200, 200, 200);
//     doc.setLineWidth(0.4);
//     doc.rect(L, noteY + 6, noteW, 18, "S");
//     doc.setFont("helvetica", "normal");
//     doc.setFontSize(7.5);
//     doc.setTextColor(80, 80, 80);
//     doc.text(po.notes, L + 3, noteY + 12);

//     // ── Footer
//     const footerY = H - 20;
//     doc.setDrawColor(...BRAND.green);
//     doc.setLineWidth(1);
//     doc.line(L, footerY, R, footerY);
//     doc.setFont("helvetica", "normal");
//     doc.setFontSize(7.5);
//     doc.setTextColor(100, 100, 100);
//     doc.text(
//         `For questions about this purchase order: ${po.contactEmail}  |  ${po.contactPhone}`,
//         W / 2,
//         footerY + 5,
//         { align: "center" }
//     );

//     // Bottom bars
//     doc.setFillColor(...BRAND.darkTeal);
//     doc.rect(0, H - 5, W, 5, "F");
//     doc.setFillColor(...BRAND.green);
//     doc.rect(0, H - 7, W, 2, "F");

//     doc.save(`FUMA_PO_${po.poNumber.replace(/\//g, "_")}.pdf`);
// };

// // ─── Main Component ──────────────────────────────────────────────────────────
// const CustomPOPurchasePage = () => {
//     const [po, setPO] = useState(DEFAULT_PO);

//     const handleField = (field, value) =>
//         setPO((prev) => ({ ...prev, [field]: value }));

//     const handleItemChange = (idx, field, value) => {
//         const updated = [...po.items];
//         updated[idx] = { ...updated[idx], [field]: value };
//         setPO((prev) => ({ ...prev, items: updated }));
//     };

//     const addItem = () =>
//         setPO((prev) => ({
//             ...prev,
//             items: [
//                 ...prev.items,
//                 { description: "", qty: "", unitPrice: "", isGroup: false },
//             ],
//         }));

//     const removeItem = (idx) =>
//         setPO((prev) => ({
//             ...prev,
//             items: prev.items.filter((_, i) => i !== idx),
//         }));

//     const toggleGroup = (idx) => {
//         const updated = [...po.items];
//         updated[idx] = { ...updated[idx], isGroup: !updated[idx].isGroup };
//         setPO((prev) => ({ ...prev, items: updated }));
//     };

//     // FIX: derive subtotal live from items, instead of reading a stale/static field
//     const subtotal = calcSubtotal(po.items);
//     const gstAmount = po.applyGst ? subtotal * (parseFloat(po.gstRate || 0) / 100) : 0;
//     const grandTotal = subtotal + gstAmount;

//     const handleGenerate = () => {
//         if (!po.vendorName.trim()) {
//             toast.warning("Please enter vendor name");
//             return;
//         }
//         if (po.items.filter(item => item.description.trim()).length === 0) {
//             toast.warning("Please add at least one item");
//             return;
//         }
//         generateFUMAPdf(po);
//         toast.success("Purchase Order PDF generated!");
//     };

//     const handleReset = () => {
//         setPO(DEFAULT_PO);
//         toast.info("Form reset to default");
//     };

//     return (
//         <div className="content-wrapper" style={{ background: "#f4f6f9", minHeight: "100vh" }}>
//             <section className="content-header">
//                 <div className="container-fluid">
//                     <div className="row mb-2">
//                         <div className="col-sm-6">
//                             <h1 className="all-heading">Custom PO Purchase</h1>
//                             <span className="d-inline d-md-block sub-heading">
//                                 Create custom purchase order and generate PDF
//                             </span>
//                         </div>
//                         <div className="col-sm-6 text-right">
//                             <Link to="/ListPurchaseOrder" className="btn btn-secondary">
//                                 <i className="fa fa-arrow-left me-2"></i> Back to List
//                             </Link>
//                         </div>
//                     </div>
//                 </div>
//             </section>

//             <section className="content">
//                 <div className="container-fluid">
//                     {/* ── PO Meta ── */}
//                     <div className="card mb-3">
//                         <div className="card-header" style={{ background: "linear-gradient(135deg, #0C4461, #1f4a66)", color: "#fff" }}>
//                             <i className="fa fa-file-invoice me-2" /> PO Details
//                         </div>
//                         <div className="card-body">
//                             <div className="row">
//                                 <div className="col-md-4 mb-3">
//                                     <label className="form-label fw-bold text-primary">PO Number</label>
//                                     <input
//                                         className="form-control"
//                                         value={po.poNumber}
//                                         onChange={(e) => handleField("poNumber", e.target.value)}
//                                     />
//                                 </div>
//                                 <div className="col-md-4 mb-3">
//                                     <label className="form-label fw-bold text-primary">PO Date</label>
//                                     <input
//                                         className="form-control"
//                                         type="date"
//                                         value={po.poDate}
//                                         onChange={(e) => handleField("poDate", e.target.value)}
//                                     />
//                                 </div>
//                                 <div className="col-md-4 mb-3">
//                                     <label className="form-label fw-bold text-primary">GST Rate (%)</label>
//                                     <input
//                                         className="form-control"
//                                         type="number"
//                                         value={po.gstRate}
//                                         onChange={(e) => handleField("gstRate", e.target.value)}
//                                         disabled={!po.applyGst}
//                                     />
//                                     {/* NEW: toggle to include/exclude GST entirely */}
//                                     <div className="form-check mt-2">
//                                         <input
//                                             className="form-check-input"
//                                             type="checkbox"
//                                             id="applyGstCheck"
//                                             checked={po.applyGst}
//                                             onChange={(e) => handleField("applyGst", e.target.checked)}
//                                         />
//                                         <label className="form-check-label" htmlFor="applyGstCheck">
//                                             Apply GST to this PO
//                                         </label>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>

//                     {/* ── Company Details ── */}
//                     <div className="card mb-3">
//                         <div className="card-header" style={{ background: "linear-gradient(135deg, #0C4461, #1f4a66)", color: "#fff" }}>
//                             <i className="fa fa-building me-2" /> Company Details
//                         </div>
//                         <div className="card-body">
//                             <div className="row">
//                                 <div className="col-md-12 mb-2">
//                                     <label className="form-label fw-bold text-primary">Company Name</label>
//                                     <input className="form-control" value={po.companyName} onChange={(e) => handleField("companyName", e.target.value)} />
//                                 </div>
//                                 <div className="col-md-6 mb-2">
//                                     <label className="form-label fw-bold text-primary">Address Line 1</label>
//                                     <input className="form-control" value={po.companyAddr1} onChange={(e) => handleField("companyAddr1", e.target.value)} />
//                                 </div>
//                                 <div className="col-md-6 mb-2">
//                                     <label className="form-label fw-bold text-primary">Address Line 2</label>
//                                     <input className="form-control" value={po.companyAddr2} onChange={(e) => handleField("companyAddr2", e.target.value)} />
//                                 </div>
//                                 <div className="col-md-6 mb-2">
//                                     <label className="form-label fw-bold text-primary">Address Line 3</label>
//                                     <input className="form-control" value={po.companyAddr3} onChange={(e) => handleField("companyAddr3", e.target.value)} />
//                                 </div>
//                                 <div className="col-md-6 mb-2">
//                                     <label className="form-label fw-bold text-primary">Company GST Number</label>
//                                     <input className="form-control" value={po.companyGst || ""} onChange={(e) => handleField("companyGst", e.target.value)} placeholder="Enter company GST number" />
//                                 </div>
//                             </div>
//                         </div>
//                     </div>

//                     {/* ── Vendor + Ship To ── */}
//                     <div className="row">
//                         <div className="col-md-6 mb-3">
//                             <div className="card h-100">
//                                 <div className="card-header" style={{ background: "linear-gradient(135deg, #0C4461, #1f4a66)", color: "#fff" }}>
//                                     <i className="fa fa-handshake me-2" /> Vendor
//                                 </div>
//                                 <div className="card-body">
//                                     <div className="mb-2">
//                                         <label className="form-label fw-bold text-primary">Vendor Name *</label>
//                                         <input className="form-control" value={po.vendorName} onChange={(e) => handleField("vendorName", e.target.value)} placeholder="Enter vendor name" />
//                                     </div>
//                                     <div className="mb-2">
//                                         <label className="form-label fw-bold text-primary">Vendor GST</label>
//                                         <input className="form-control" value={po.vendorGst || ""} onChange={(e) => handleField("vendorGst", e.target.value)} placeholder="Enter vendor GST number" />
//                                     </div>
//                                     <div className="mb-2">
//                                         <label className="form-label fw-bold text-primary">Vendor Phone</label>
//                                         <input className="form-control" value={po.vendorPhone || ""} onChange={(e) => handleField("vendorPhone", e.target.value)} placeholder="Enter phone number" />
//                                     </div>
//                                     <div className="mb-2">
//                                         <label className="form-label fw-bold text-primary">Vendor Email</label>
//                                         <input className="form-control" value={po.vendorEmail || ""} onChange={(e) => handleField("vendorEmail", e.target.value)} placeholder="Enter email address" />
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>

//                         <div className="col-md-6 mb-3">
//                             <div className="card h-100">
//                                 <div className="card-header" style={{ background: "linear-gradient(135deg, #0C4461, #1f4a66)", color: "#fff" }}>
//                                     <i className="fa fa-truck me-2" /> Ship To
//                                 </div>
//                                 <div className="card-body">
//                                     <div className="mb-2">
//                                         <label className="form-label fw-bold text-primary">Address Line 1</label>
//                                         <input className="form-control" value={po.shipAddr1} onChange={(e) => handleField("shipAddr1", e.target.value)} />
//                                     </div>
//                                     <div className="mb-2">
//                                         <label className="form-label fw-bold text-primary">Address Line 2</label>
//                                         <input className="form-control" value={po.shipAddr2} onChange={(e) => handleField("shipAddr2", e.target.value)} />
//                                     </div>
//                                     <div className="mb-2">
//                                         <label className="form-label fw-bold text-primary">Address Line 3</label>
//                                         <input className="form-control" value={po.shipAddr3} onChange={(e) => handleField("shipAddr3", e.target.value)} />
//                                     </div>
//                                     <div className="mb-2">
//                                         <label className="form-label fw-bold text-primary">Address Line 4</label>
//                                         <input className="form-control" value={po.shipAddr4} onChange={(e) => handleField("shipAddr4", e.target.value)} />
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>

//                     {/* ── Items Table ── */}
//                     <div className="card mb-3">
//                         <div className="card-header" style={{ background: "linear-gradient(135deg, #0C4461, #1f4a66)", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//                             <span><i className="fa fa-list me-2" /> Line Items</span>
//                             <button
//                                 onClick={addItem}
//                                 className="btn btn-success btn-sm"
//                                 style={{ background: "#78B833", border: "none" }}
//                             >
//                                 <i className="fa fa-plus me-1" /> Add Row
//                             </button>
//                         </div>
//                         <div className="card-body p-0">
//                             <div className="table-responsive">
//                                 <table className="table table-bordered table-hover mb-0">
//                                     <thead style={{ background: "#0C4461", color: "#fff" }}>
//                                         <tr>
//                                             <th style={{ width: "38%" }}>Description</th>
//                                             <th style={{ width: "10%", textAlign: "center" }}>Qty</th>
//                                             <th style={{ width: "15%", textAlign: "right" }}>Unit Price</th>
//                                             <th style={{ width: "15%", textAlign: "right" }}>Total</th>
//                                             <th style={{ width: "10%", textAlign: "center" }}>Group</th>
//                                             <th style={{ width: "12%", textAlign: "center" }}>Action</th>
//                                         </tr>
//                                     </thead>
//                                     <tbody>
//                                         {po.items.map((item, idx) => {
//                                             const lineTotal =
//                                                 item.qty && item.unitPrice && !item.isGroup
//                                                     ? (parseFloat(item.qty) * parseFloat(item.unitPrice)).toFixed(2)
//                                                     : "";
//                                             return (
//                                                 <tr
//                                                     key={idx}
//                                                     style={{
//                                                         background: item.isGroup
//                                                             ? "#eaf4fb"
//                                                             : idx % 2 === 0
//                                                                 ? "#fff"
//                                                                 : "#f8f9fa",
//                                                     }}
//                                                 >
//                                                     <td>
//                                                         <input
//                                                             className="form-control form-control-sm"
//                                                             style={{ fontWeight: item.isGroup ? "700" : "400", color: item.isGroup ? "#0C4461" : "#222" }}
//                                                             value={item.description}
//                                                             onChange={(e) => handleItemChange(idx, "description", e.target.value)}
//                                                             placeholder="Item description"
//                                                         />
//                                                     </td>
//                                                     <td>
//                                                         <input
//                                                             className="form-control form-control-sm text-center"
//                                                             value={item.qty}
//                                                             onChange={(e) => handleItemChange(idx, "qty", e.target.value)}
//                                                             placeholder="—"
//                                                             disabled={item.isGroup}
//                                                         />
//                                                     </td>
//                                                     <td>
//                                                         <input
//                                                             className="form-control form-control-sm text-end"
//                                                             value={item.unitPrice}
//                                                             onChange={(e) => handleItemChange(idx, "unitPrice", e.target.value)}
//                                                             placeholder="—"
//                                                             disabled={item.isGroup}
//                                                         />
//                                                     </td>
//                                                     <td className="text-end fw-bold text-primary">
//                                                         {lineTotal ? `₹${parseFloat(lineTotal).toLocaleString("en-IN")}` : "—"}
//                                                     </td>
//                                                     <td className="text-center">
//                                                         <input
//                                                             type="checkbox"
//                                                             checked={item.isGroup}
//                                                             onChange={() => toggleGroup(idx)}
//                                                             title="Mark as group header"
//                                                             style={{ width: "18px", height: "18px", cursor: "pointer" }}
//                                                         />
//                                                     </td>
//                                                     <td className="text-center">
//                                                         <button
//                                                             onClick={() => removeItem(idx)}
//                                                             className="btn btn-sm btn-danger"
//                                                             title="Remove row"
//                                                         >
//                                                             <i className="fa fa-trash"></i>
//                                                         </button>
//                                                     </td>
//                                                 </tr>
//                                             );
//                                         })}
//                                     </tbody>
//                                 </table>
//                             </div>
//                         </div>
//                     </div>

//                     {/* ── Subtotal and Summary ── */}
//                     <div className="row">
//                         <div className="col-md-6 mb-3">
//                             <div className="card h-100">
//                                 <div className="card-header" style={{ background: "linear-gradient(135deg, #0C4461, #1f4a66)", color: "#fff" }}>
//                                     <i className="fa fa-comment me-2" /> Footer Details
//                                 </div>
//                                 <div className="card-body">
//                                     <div className="mb-2">
//                                         <label className="form-label fw-bold text-primary">Notes / Special Instructions</label>
//                                         <textarea
//                                             className="form-control"
//                                             rows="3"
//                                             value={po.notes}
//                                             onChange={(e) => handleField("notes", e.target.value)}
//                                             placeholder="Enter any special instructions or comments..."
//                                         />
//                                     </div>
//                                     <div className="row">
//                                         <div className="col-6">
//                                             <label className="form-label fw-bold text-primary">Contact Email</label>
//                                             <input className="form-control" value={po.contactEmail} onChange={(e) => handleField("contactEmail", e.target.value)} />
//                                         </div>
//                                         <div className="col-6">
//                                             <label className="form-label fw-bold text-primary">Contact Phone</label>
//                                             <input className="form-control" value={po.contactPhone} onChange={(e) => handleField("contactPhone", e.target.value)} />
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>

//                         <div className="col-md-6 mb-3">
//                             <div className="card h-100">
//                                 <div className="card-header" style={{ background: "linear-gradient(135deg, #0C4461, #1f4a66)", color: "#fff" }}>
//                                     <i className="fa fa-calculator me-2" /> Summary
//                                 </div>
//                                 <div className="card-body">
//                                     {/* FIX: Subtotal is now a read-only, live-computed value from the
//                                         items table (qty × unitPrice), not a manually typed field that
//                                         could drift out of sync with the line items. */}
//                                     <div className="mb-3">
//                                         <label className="form-label fw-bold text-primary">Subtotal (auto-calculated)</label>
//                                         <input
//                                             className="form-control form-control-lg fw-bold text-primary"
//                                             value={`₹${subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
//                                             readOnly
//                                             disabled
//                                         />
//                                     </div>
//                                     <div className="bg-light p-3 rounded">
//                                         {po.applyGst ? (
//                                             <>
//                                                 <div className="d-flex justify-content-between mb-2">
//                                                     <span className="fw-bold">GST ({po.gstRate}%)</span>
//                                                     <span className="text-primary fw-bold">
//                                                         ₹{gstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
//                                                     </span>
//                                                 </div>
//                                                 <hr />
//                                             </>
//                                         ) : (
//                                             <div className="d-flex justify-content-between mb-2">
//                                                 <span className="fw-bold text-muted">GST not applied</span>
//                                             </div>
//                                         )}
//                                         <div className="d-flex justify-content-between" style={{ background: "#0C4461", color: "#fff", padding: "10px", borderRadius: "4px" }}>
//                                             <span className="fw-bold">Total Amount</span>
//                                             <span className="fw-bold">
//                                                 ₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
//                                             </span>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>

//                     {/* ── Action Buttons ── */}
//                     <div className="card">
//                         <div className="card-body">
//                             <div className="d-flex justify-content-end gap-2" style={{ flexWrap: "wrap" }}>
//                                 <button
//                                     onClick={handleReset}
//                                     className="btn btn-outline-danger"
//                                 >
//                                     <i className="fa fa-undo me-1" /> Reset
//                                 </button>
//                                 <button
//                                     onClick={handleGenerate}
//                                     className="btn"
//                                     style={{
//                                         background: "linear-gradient(135deg, #78B833, #5a9626)",
//                                         border: "none",
//                                         color: "#fff",
//                                         fontWeight: "700",
//                                         padding: "10px 28px",
//                                     }}
//                                 >
//                                     <i className="fa fa-file-pdf me-2" />
//                                     Generate PDF
//                                 </button>
//                             </div>
//                         </div>
//                     </div>

//                     {/* ── Brand Colors Preview ── */}
//                     <div className="d-flex align-items-center gap-3 mt-3" style={{ flexWrap: "wrap" }}>
//                         <span className="fw-bold text-secondary" style={{ fontSize: "12px" }}>Brand Colors:</span>
//                         <div style={{ width: "30px", height: "20px", background: "#0C4461", borderRadius: "4px", border: "1px solid #ddd" }} title="#0C4461" />
//                         <div style={{ width: "30px", height: "20px", background: "#1f4a66", borderRadius: "4px", border: "1px solid #ddd" }} title="#1f4a66" />
//                         <div style={{ width: "30px", height: "20px", background: "#78B833", borderRadius: "4px", border: "1px solid #ddd" }} title="#78B833" />
//                         <span style={{ fontSize: "10px", color: "#aaa" }}>These colors appear in the generated PDF</span>
//                     </div>
//                 </div>
//             </section>
//         </div>
//     );
// };

// export default CustomPOPurchasePage;
// // src/Pages/Purchase/CustomPOPurchasePage.jsx



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

// ─── Default PO form state ────────────────────────────────────────────────────
const currentDate = new Date();
const year = currentDate.getFullYear();
const month = String(currentDate.getMonth() + 1).padStart(2, "0");

const DEFAULT_PO = {
    poNumber: `FUMA/PO/${year}/${month}/001`,
    poDate: currentDate.toISOString().split("T")[0],
    companyName: "Fusion Master Tech Innovation And Development Private Limited",
    companyAddr1: "Office No.6, Sr. No. 23/2 Barne Estate,",
    companyAddr2: "Opp. Padamji Papermill, Thergaon,",
    companyAddr3: "Chinchwad, Pune – 411033, Maharashtra, India",
    companyGst: "27AAFCF8338N1Z0",
    vendorName: "",
    vendorGst: "",
    vendorPhone: "",
    vendorEmail: "",
    shipAddr1: "",
    shipAddr2: "",
    shipAddr3: "",
    shipAddr4: "",
    notes: "All items are subject to quality inspection upon delivery.",
    contactEmail: "Nanasaheb.k@fuma.co.in",
    contactPhone: "+91-7249211259 / +91-9011103891",
    items: [
        { description: "", qty: "", unitPrice: "", isGroup: false },
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
const generateFUMAPdf = async (po) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const W = 210;
    const H = 297;
    const L = 18;
    const R = W - 18;
    const CW = R - L;

    // ── Top bar
    doc.setFillColor(...BRAND.darkTeal);
    doc.rect(0, 0, W, 4, "F");

    // ── FUMA logo text (top-left)
    // doc.setFont("helvetica", "bold");
    // doc.setFontSize(18);
    // doc.setTextColor(...BRAND.darkTeal);
    // doc.text("FUMA", L, 16);
    // doc.setFontSize(6.5);
    // doc.setFont("helvetica", "normal");
    // doc.setTextColor(80, 80, 80);
    // doc.text("Powering Innovation", L, 20);
    // ── FUMA logo
    const img = new Image();

    await new Promise((resolve) => {
        img.onload = () => {
            try {
                doc.addImage(img, "JPEG", L, 8, 42, 20);
            } catch (e) {
                console.error("Failed to add image to PDF:", e);

                doc.setFont("helvetica", "bold");
                doc.setFontSize(18);
                doc.setTextColor(...BRAND.darkTeal);
                doc.text("FUMA", L, 16);
            }
            resolve();
        };

        img.onerror = () => {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(18);
            doc.setTextColor(...BRAND.darkTeal);
            doc.text("FUMA", L, 16);
            resolve();
        };

        img.src = fumaLogo;
    });

    // ── PURCHASE ORDER title (right)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(...BRAND.darkTeal);
    doc.text("PURCHASE ORDER", R, 16, { align: "right" });

    // Green underline
    doc.setDrawColor(...BRAND.green);
    doc.setLineWidth(0.8);
    doc.line(R - 70, 18, R, 18);

    // ── Company name & address
    let y = 26;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...BRAND.darkTeal);
    doc.text(po.companyName, L, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(50, 50, 50);
    [po.companyAddr1, po.companyAddr2, po.companyAddr3].forEach((line) => {
        doc.text(line, L, y);
        y += 3.8;
    });

    // ── Company GST (NEW)
    if (po.companyGst) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(50, 50, 50);
        doc.text(`GST Number: ${po.companyGst}`, L, y);
        y += 3.8;
    }

    // ── PO Date & Number (right side)
    const dateX = R - 55;
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text("DATE:", dateX, 26);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(po.poDate, dateX + 18, 26);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text("PO #:", dateX, 31);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(po.poNumber, dateX + 18, 31);

    y += 3;

    // ── Green divider
    doc.setDrawColor(...BRAND.green);
    doc.setLineWidth(0.8);
    doc.line(L, y, R, y);
    y += 5;

    // ── Vendor + Ship To boxes
    const boxH = 34;
    const half = CW / 2 - 3;

    // FIX: text now flows TOP -> DOWN inside each box (was bottom-up before)
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

        // Skip any blank/empty lines so missing fields don't leave gaps
        const filledLines = lines.filter((line) => line && line.trim());

        let ly = y + 6 + 5; // start near the TOP of the box, not the bottom
        filledLines.forEach((line, i) => {
            doc.setFont("helvetica", i === 0 ? "bold" : "normal");
            doc.setFontSize(7.5);
            doc.setTextColor(20, 20, 20);

            const splitLines = doc.splitTextToSize(line, half - 6);
            splitLines.forEach((splitLine) => {
                doc.text(splitLine, x + 3, ly);
                ly += 3.8; // move DOWN for each subsequent line
            });
        });
    };

    // Vendor lines with GST — name first, then GST, then phone
    const vendorLines = [po.vendorName];
    if (po.vendorGst) {
        vendorLines.push(`GST: ${po.vendorGst}`);
    }
    if (po.vendorPhone) {
        vendorLines.push(`Phone: ${po.vendorPhone}`);
    }

    drawSection(L, "VENDOR", vendorLines);
    drawSection(L + half + 6, "SHIP TO", [
        po.shipAddr1,
        po.shipAddr2,
        po.shipAddr3,
        po.shipAddr4,
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
    ["DESCRIPTION", "QTY", "UNIT PRICE", "TOTAL"].forEach((h, i) => {
        if (i === 0) doc.text(h, cols[i] + 3, y + 4.2);
        else doc.text(h, cols[i] + colWs[i] / 2, y + 4.2, { align: "center" });
    });
    y += hdrH;

    // Rows
    po.items.forEach((item, idx) => {
        const bg = idx % 2 === 0 ? [255, 255, 255] : [245, 246, 248];
        doc.setFillColor(...bg);
        doc.rect(L, y, CW, rowH, "F");

        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.3);
        cols.slice(1).forEach((cx) => doc.line(cx, y, cx, y + rowH));
        doc.line(L, y + rowH, R, y + rowH);

        doc.setFont("helvetica", item.isGroup ? "bold" : "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(
            ...(item.isGroup ? BRAND.darkTeal : [20, 20, 20])
        );
        doc.text(item.description, cols[0] + 3, y + rowH - 1.8);

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
                ? (parseFloat(item.qty) * parseFloat(item.unitPrice)).toFixed(2)
                : "";
        if (total) {
            doc.setFont("helvetica", "bold");
            doc.text(total, cols[3] + colWs[3] - 2, y + rowH - 1.8, { align: "right" });
        }
        y += rowH;
    });

    // Border around items
    doc.setDrawColor(...BRAND.lightTeal);
    doc.setLineWidth(0.6);
    doc.rect(
        L,
        y - rowH * po.items.length - hdrH,
        CW,
        rowH * po.items.length + hdrH,
        "S"
    );

    y += 4;

    // ── Totals block
    // FIX: subtotal is now ALWAYS derived from the line items (qty × unitPrice),
    // never from a manually-typed static field.
    const subtotal = calcSubtotal(po.items);
    // FIX: GST is only applied when po.applyGst is true.
    const gst = po.applyGst ? subtotal * (parseFloat(po.gstRate || 0) / 100) : 0;
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
    drawTotRow("SUBTOTAL", `Rs. ${subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`);
    // FIX: only render the GST row at all when GST is switched on
    if (po.applyGst) {
        drawTotRow(`GST @ ${po.gstRate}%`, `Rs. ${gst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`);
    }
    drawTotRow("SHIPPING", "—");
    drawTotRow(
        "TOTAL",
        `Rs. ${total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
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
    const splitNotes = doc.splitTextToSize(po.notes, noteW - 6);
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
        `For questions about this purchase order: ${po.contactEmail}  |  ${po.contactPhone}`,
        W / 2,
        footerY + 5,
        { align: "center" }
    );

    // Bottom bars
    doc.setFillColor(...BRAND.darkTeal);
    doc.rect(0, H - 5, W, 5, "F");
    doc.setFillColor(...BRAND.green);
    doc.rect(0, H - 7, W, 2, "F");

    doc.save(`FUMA_PO_${po.poNumber.replace(/\//g, "_")}.pdf`);
};

// ─── Main Component ──────────────────────────────────────────────────────────
const CustomPOPurchasePage = () => {
    const [po, setPO] = useState(DEFAULT_PO);

    const handleField = (field, value) =>
        setPO((prev) => ({ ...prev, [field]: value }));

    const handleItemChange = (idx, field, value) => {
        const updated = [...po.items];
        updated[idx] = { ...updated[idx], [field]: value };
        setPO((prev) => ({ ...prev, items: updated }));
    };

    const addItem = () =>
        setPO((prev) => ({
            ...prev,
            items: [
                ...prev.items,
                { description: "", qty: "", unitPrice: "", isGroup: false },
            ],
        }));

    const removeItem = (idx) =>
        setPO((prev) => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== idx),
        }));

    const toggleGroup = (idx) => {
        const updated = [...po.items];
        updated[idx] = { ...updated[idx], isGroup: !updated[idx].isGroup };
        setPO((prev) => ({ ...prev, items: updated }));
    };

    // FIX: derive subtotal live from items, instead of reading a stale/static field
    const subtotal = calcSubtotal(po.items);
    const gstAmount = po.applyGst ? subtotal * (parseFloat(po.gstRate || 0) / 100) : 0;
    const grandTotal = subtotal + gstAmount;

    const handleGenerate = async () => {
        if (!po.vendorName.trim()) {
            toast.warning("Please enter vendor name");
            return;
        }
        if (po.items.filter(item => item.description.trim()).length === 0) {
            toast.warning("Please add at least one item");
            return;
        }
        await generateFUMAPdf(po);
        toast.success("Purchase Order PDF generated!");
    };

    const handleReset = () => {
        setPO(DEFAULT_PO);
        toast.info("Form reset to default");
    };

    return (
        <div className="content-wrapper" style={{ background: "#f4f6f9", minHeight: "100vh" }}>
            <section className="content-header">
                <div className="container-fluid">
                    <div className="row mb-2">
                        <div className="col-sm-6">
                            <h1 className="all-heading">Custom PO Purchase</h1>
                            <span className="d-inline d-md-block sub-heading">
                                Create custom purchase order and generate PDF
                            </span>
                        </div>
                        <div className="col-sm-6 text-right">
                            <Link to="/ListPurchaseOrder" className="btn btn-secondary">
                                <i className="fa fa-arrow-left me-2"></i> Back to List
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <section className="content">
                <div className="container-fluid">
                    {/* ── PO Meta ── */}
                    <div className="card mb-3">
                        <div className="card-header" style={{ background: "linear-gradient(135deg, #0C4461, #1f4a66)", color: "#fff" }}>
                            <i className="fa fa-file-invoice me-2" /> PO Details
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-4 mb-3">
                                    <label className="form-label fw-bold text-primary">PO Number</label>
                                    <input
                                        className="form-control"
                                        value={po.poNumber}
                                        onChange={(e) => handleField("poNumber", e.target.value)}
                                    />
                                </div>
                                <div className="col-md-4 mb-3">
                                    <label className="form-label fw-bold text-primary">PO Date</label>
                                    <input
                                        className="form-control"
                                        type="date"
                                        value={po.poDate}
                                        onChange={(e) => handleField("poDate", e.target.value)}
                                    />
                                </div>
                                <div className="col-md-4 mb-3">
                                    <label className="form-label fw-bold text-primary">GST Rate (%)</label>
                                    <input
                                        className="form-control"
                                        type="number"
                                        value={po.gstRate}
                                        onChange={(e) => handleField("gstRate", e.target.value)}
                                        disabled={!po.applyGst}
                                    />
                                    {/* NEW: toggle to include/exclude GST entirely */}
                                    <div className="form-check mt-2">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="applyGstCheck"
                                            checked={po.applyGst}
                                            onChange={(e) => handleField("applyGst", e.target.checked)}
                                        />
                                        <label className="form-check-label" htmlFor="applyGstCheck">
                                            Apply GST to this PO
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
                                    <input className="form-control" value={po.companyName} onChange={(e) => handleField("companyName", e.target.value)} />
                                </div>
                                <div className="col-md-6 mb-2">
                                    <label className="form-label fw-bold text-primary">Address Line 1</label>
                                    <input className="form-control" value={po.companyAddr1} onChange={(e) => handleField("companyAddr1", e.target.value)} />
                                </div>
                                <div className="col-md-6 mb-2">
                                    <label className="form-label fw-bold text-primary">Address Line 2</label>
                                    <input className="form-control" value={po.companyAddr2} onChange={(e) => handleField("companyAddr2", e.target.value)} />
                                </div>
                                <div className="col-md-6 mb-2">
                                    <label className="form-label fw-bold text-primary">Address Line 3</label>
                                    <input className="form-control" value={po.companyAddr3} onChange={(e) => handleField("companyAddr3", e.target.value)} />
                                </div>
                                <div className="col-md-6 mb-2">
                                    <label className="form-label fw-bold text-primary">Company GST Number</label>
                                    <input className="form-control" value={po.companyGst || ""} onChange={(e) => handleField("companyGst", e.target.value)} placeholder="Enter company GST number" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Vendor + Ship To ── */}
                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <div className="card h-100">
                                <div className="card-header" style={{ background: "linear-gradient(135deg, #0C4461, #1f4a66)", color: "#fff" }}>
                                    <i className="fa fa-handshake me-2" /> Vendor
                                </div>
                                <div className="card-body">
                                    <div className="mb-2">
                                        <label className="form-label fw-bold text-primary">Vendor Name *</label>
                                        <input className="form-control" value={po.vendorName} onChange={(e) => handleField("vendorName", e.target.value)} placeholder="Enter vendor name" />
                                    </div>
                                    <div className="mb-2">
                                        <label className="form-label fw-bold text-primary">Vendor GST</label>
                                        <input className="form-control" value={po.vendorGst || ""} onChange={(e) => handleField("vendorGst", e.target.value)} placeholder="Enter vendor GST number" />
                                    </div>
                                    <div className="mb-2">
                                        <label className="form-label fw-bold text-primary">Vendor Phone</label>
                                        <input className="form-control" value={po.vendorPhone || ""} onChange={(e) => handleField("vendorPhone", e.target.value)} placeholder="Enter phone number" />
                                    </div>
                                    <div className="mb-2">
                                        <label className="form-label fw-bold text-primary">Vendor Email</label>
                                        <input className="form-control" value={po.vendorEmail || ""} onChange={(e) => handleField("vendorEmail", e.target.value)} placeholder="Enter email address" />
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
                                        <input className="form-control" value={po.shipAddr1} onChange={(e) => handleField("shipAddr1", e.target.value)} />
                                    </div>
                                    <div className="mb-2">
                                        <label className="form-label fw-bold text-primary">Address Line 2</label>
                                        <input className="form-control" value={po.shipAddr2} onChange={(e) => handleField("shipAddr2", e.target.value)} />
                                    </div>
                                    <div className="mb-2">
                                        <label className="form-label fw-bold text-primary">Address Line 3</label>
                                        <input className="form-control" value={po.shipAddr3} onChange={(e) => handleField("shipAddr3", e.target.value)} />
                                    </div>
                                    <div className="mb-2">
                                        <label className="form-label fw-bold text-primary">Address Line 4</label>
                                        <input className="form-control" value={po.shipAddr4} onChange={(e) => handleField("shipAddr4", e.target.value)} />
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
                                        {po.items.map((item, idx) => {
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
                                            value={po.notes}
                                            onChange={(e) => handleField("notes", e.target.value)}
                                            placeholder="Enter any special instructions or comments..."
                                        />
                                    </div>
                                    <div className="row">
                                        <div className="col-6">
                                            <label className="form-label fw-bold text-primary">Contact Email</label>
                                            <input className="form-control" value={po.contactEmail} onChange={(e) => handleField("contactEmail", e.target.value)} />
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label fw-bold text-primary">Contact Phone</label>
                                            <input className="form-control" value={po.contactPhone} onChange={(e) => handleField("contactPhone", e.target.value)} />
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
                                    {/* FIX: Subtotal is now a read-only, live-computed value from the
                                        items table (qty × unitPrice), not a manually typed field that
                                        could drift out of sync with the line items. */}
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
                                        {po.applyGst ? (
                                            <>
                                                <div className="d-flex justify-content-between mb-2">
                                                    <span className="fw-bold">GST ({po.gstRate}%)</span>
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

export default CustomPOPurchasePage;
