import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import defaultFumaLogo from "../../assets/fuma-logo-lockup.svg";

const EmployeeViewPayslip = ({ employee }) => {
    const location = useLocation();
    const { state } = location;
    const navigate = useNavigate();
    const isAdminPanel = !location.pathname.startsWith("/employee/");
    const BASE_URL = process.env.REACT_APP_BASE_URL;

    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [companyLogo, setCompanyLogo] = useState(null);
    const [signatureImage, setSignatureImage] = useState(null);
    const [businesses, setBusinesses] = useState([]);
    const [payroll, setPayroll] = useState(null);
    const selectedEmployee = state?.employee || employee;
    const backPath = state?.backPath || (isAdminPanel ? "/MyPayslips" : "/employee/my-payslips");
    const buildMediaUrl = (path) => {
        if (!path) return null;
        if (/^data:image\//i.test(path)) return path;
        if (/^https?:\/\//i.test(path)) return path;
        if (path.startsWith("//")) return `https:${path}`;
        return `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
    };
    const isSupportedImage = (path) =>
        !!path && (/^data:image\//i.test(path) || /\.(jpg|jpeg|png|gif|jfif|webp|svg)$/i.test(path));

    useEffect(() => {
        if (!state?.payroll || !selectedEmployee?.id) return;
        fetchDepartments();
        fetchDesignations();
        fetchCompanyLogo();
        fetchSignatureImage();
        fetchBusinesses();
        refreshPayroll();
    }, [state?.payroll, selectedEmployee?.id]);

    const refreshPayroll = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/payroll/employee-wise`);
            const p = state.payroll;
            const matching = res.data
                .filter(
                    (r) =>
                        (r.employeeId === selectedEmployee.id || r.employeeId === String(selectedEmployee.id)) &&
                        r.month === p.month &&
                        r.year === p.year
                )
                .sort((a, b) => b.payrollId - a.payrollId)[0];
            setPayroll(matching || buildPayrollFromState());
        } catch {
            setPayroll(buildPayrollFromState());
        }
    };

    const buildPayrollFromState = () => {
        const p = state.payroll;
        const entry = p.myEntry || {};
        return {
            payrollId: p.id,
            payrollName: p.payrollName,
            month: p.month,
            year: p.year,
            basic: entry.basic,
            total: entry.total,
            earnings: entry.earnings || [],
            deductions: entry.deductions || [],
            transactions: entry.transactions || [],
            note: p.note,
        };
    };

    const fetchBusinesses = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/business-details/getall`);
            setBusinesses(res.data);
        } catch (e) { /* ignore */ }
    };
    const fetchDepartments = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/department/getall`);
            setDepartments(res.data);
        } catch (e) { /* ignore */ }
    };
    const fetchDesignations = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/designation/getall`);
            setDesignations(res.data);
        } catch (e) { /* ignore */ }
    };
    const toDataUrl = async (url) => {
        const response = await fetch(url);
        const blob = await response.blob();
        return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };
    const getFirstWorkingImage = async (paths = []) => {
        for (const path of paths) {
            const mediaUrl = buildMediaUrl(path);
            if (!mediaUrl) continue;
            try {
                if (/^data:image\//i.test(mediaUrl)) return mediaUrl;
                const dataUrl = await toDataUrl(mediaUrl);
                if (dataUrl) return dataUrl;
            } catch {
                // try next candidate
            }
        }
        return null;
    };
    const fetchCompanyLogo = async () => {
        try {
            const candidates = [];

            try {
                const businessRes = await axios.get(`${BASE_URL}/business-details/getall`);
                const business = Array.isArray(businessRes.data) && businessRes.data.length > 0 ? businessRes.data[0] : null;
                if (business) {
                    ["logo", "logoImage", "image", "businessLogo"].forEach((key) => {
                        if (isSupportedImage(business[key])) candidates.push(business[key]);
                    });
                }
            } catch {
                // ignore and try file list
            }

            const res = await axios.get(`${BASE_URL}/file/get-all`);
            if (res.data?.length > 0) {
                const images = res.data.filter((f) => isSupportedImage(f.image));
                // prefer latest uploads first
                for (let i = images.length - 1; i >= 0; i--) {
                    candidates.push(images[i].image);
                }
            }

            const resolvedLogo = await getFirstWorkingImage(candidates);
            setCompanyLogo(resolvedLogo || null);
        } catch (e) { /* ignore */ }
    };
    const fetchSignatureImage = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/signature-image/get-all`);
            if (res.data?.length > 0) {
                const images = res.data.filter(f => isSupportedImage(f.image));
                if (images.length > 0) {
                    const candidates = [];
                    for (let i = images.length - 1; i >= 0; i--) {
                        candidates.push(images[i].image);
                    }
                    const resolvedSignature = await getFirstWorkingImage(candidates);
                    setSignatureImage(resolvedSignature || null);
                }
            }
        } catch (e) { /* ignore */ }
    };

    if (!state?.payroll) {
        return (
            <div className="text-center py-5">
                <p>No payroll data found.</p>
                <button className="btn btn-primary" onClick={() => navigate(backPath)}>
                    Back to My Payslips
                </button>
            </div>
        );
    }

    if (!selectedEmployee) {
        return (
            <div className="text-center py-5">
                <p>No employee data found.</p>
                <button className="btn btn-primary" onClick={() => navigate(backPath)}>
                    Back
                </button>
            </div>
        );
    }

    if (!payroll) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="sr-only">Loading...</span>
                </div>
            </div>
        );
    }

    const getDepartmentName = (id) => departments.find(d => d.id === id)?.department || "-";
    const getDesignationName = (id) => designations.find(d => d.id === id)?.name || "-";

    const companyName = businesses.length > 0 ? businesses[0].name : "Your Company";
    const companyAddress = businesses.length > 0
        ? `${businesses[0].address || ""}, ${businesses[0].city || ""}, ${businesses[0].state || ""} – ${businesses[0].zipCode || ""}`
        : "";

    const monthYear = new Date(payroll.year, payroll.month - 1).toLocaleString("default", { month: "long", year: "numeric" });

    const effectiveEarnings =
        payroll.earnings?.length > 0
            ? payroll.earnings
            : (payroll.total > 0 || payroll.basic > 0)
                ? [{ description: "Basic Pay", amount: payroll.total || payroll.basic }]
                : [];

    const effectiveDeductions = payroll.deductions?.length > 0 ? payroll.deductions : [];

    const totalEarnings = effectiveEarnings.reduce((s, e) => s + e.amount, 0);
    const totalDeductions = effectiveDeductions.reduce((s, d) => s + d.amount, 0);
    const netPay = payroll.total || totalEarnings - totalDeductions;
    const referenceNo = `PAY-${payroll.payrollId}-${String(payroll.month).padStart(2, "0")}${payroll.year}`;

    const totalPaid = (payroll.transactions || []).reduce((s, t) => s + Number(t.amount || 0), 0);
    let paymentStatus = "Due";
    let paymentBadgeClass = "bg-warning text-dark";
    if (totalPaid >= netPay && netPay > 0) { paymentStatus = "Paid"; paymentBadgeClass = "bg-success"; }
    else if (totalPaid > 0) { paymentStatus = "Partial"; paymentBadgeClass = "bg-info"; }

    const numberToWords = (num) => {
        if (num === 0) return "Zero";
        const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
        const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
        const convert = (n) => {
            if (n < 20) return ones[n];
            if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
            if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " and " + convert(n % 100) : "");
            if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + convert(n % 1000) : "");
            if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + convert(n % 100000) : "");
            return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + convert(n % 10000000) : "");
        };
        const rupees = Math.floor(num);
        const paise = Math.round((num - rupees) * 100);
        let result = "Rupees " + convert(rupees);
        if (paise > 0) result += " and " + convert(paise) + " Paise";
        return result + " Only";
    };

    const maxRows = Math.max(effectiveEarnings.length, effectiveDeductions.length, 1);

    const handlePrint = () => window.print();
    const handleDownloadPDF = async () => {
        const html2canvas = (await import("html2canvas")).default;
        const { jsPDF } = await import("jspdf");
        const element = document.getElementById("payslip-content");
        const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Payslip-${referenceNo}.pdf`);
    };

    const styles = {
        container: { maxWidth: "900px", margin: "0 auto", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", fontSize: "13px", color: "#333" },
        header: { borderBottom: "3px solid #0c4166", paddingBottom: "15px", marginBottom: "20px" },
        sectionTitle: { backgroundColor: "#0c4166", color: "#fff", padding: "6px 12px", fontSize: "13px", fontWeight: "bold", marginBottom: "0" },
        table: { width: "100%", borderCollapse: "collapse", fontSize: "13px" },
        td: { border: "1px solid #dee2e6", padding: "6px 10px" },
        tdLabel: { border: "1px solid #dee2e6", padding: "6px 10px", fontWeight: "600", backgroundColor: "#f8f9fa", width: "35%" },
        netPayBox: { background: "linear-gradient(135deg, #0c4166, #1a6ba3)", color: "#fff", padding: "15px 20px", borderRadius: "8px", textAlign: "center", marginTop: "20px" },
    };

    return (
        <div className="content-wrapper">
            <div className="content">
                <div className="container-fluid pt-3">
                    {/* ACTION BUTTONS */}
                    <div className="d-flex justify-content-between mb-3 no-print">
                        <button className="btn btn-outline-secondary" onClick={() => navigate(backPath)}>
                            <i className="fas fa-arrow-left mr-1"></i> Back
                        </button>
                        <div>
                            <button className="btn btn-outline-primary mr-2" onClick={handlePrint}>
                                <i className="fas fa-print mr-1"></i> Print
                            </button>
                            <button className="btn btn-success" onClick={handleDownloadPDF}>
                                <i className="fas fa-file-pdf mr-1"></i> Download PDF
                            </button>
                        </div>
                    </div>

                    {/* PAYSLIP */}
                    <div className="card shadow border-0 p-4" id="payslip-content" style={styles.container}>
                        {/* HEADER */}
                        <div style={styles.header}>
                            <div className="row align-items-center">
                                <div className="col-2 text-center" style={{ paddingTop: "6px", paddingBottom: "6px" }}>
                                    <img
                                        src={companyLogo || defaultFumaLogo}
                                        alt="Fuma Logo"
                                        crossOrigin="anonymous"
                                        onError={(e) => {
                                            setCompanyLogo(null);
                                            e.currentTarget.src = defaultFumaLogo;
                                        }}
                                        style={{
                                            width: "128px",
                                            maxWidth: "100%",
                                            height: "auto",
                                            objectFit: "contain",
                                            display: "block",
                                            margin: "0 auto",
                                        }}
                                    />
                                </div>
                                <div className="col-7">
                                    <h4 style={{ fontWeight: "bold", color: "#0c4166", marginBottom: "2px" }}>{companyName}</h4>
                                    {companyAddress && <small className="text-muted">{companyAddress}</small>}
                                </div>
                                <div className="col-3 text-right">
                                    <h5 style={{ fontWeight: "bold", color: "#0c4166", marginBottom: "4px" }}>PAYSLIP</h5>
                                    <div style={{ fontSize: "12px", color: "#666" }}>{monthYear}</div>
                                    <span className={`badge mt-1 ${paymentBadgeClass}`} style={{ fontSize: "11px" }}>{paymentStatus}</span>
                                </div>
                            </div>
                        </div>

                        {/* META */}
                        <div className="row mb-3">
                            <div className="col-6"><strong>Payslip No:</strong> {referenceNo}</div>
                            <div className="col-6 text-right"><strong>Pay Period:</strong> {monthYear}</div>
                        </div>

                        {/* EMPLOYEE DETAILS */}
                        <div style={styles.sectionTitle}>Employee Details</div>
                        <table style={styles.table}>
                            <tbody>
                                <tr>
                                    <td style={styles.tdLabel}>Employee Name</td>
                                    <td style={styles.td}>{selectedEmployee.prefix} {selectedEmployee.firstname} {selectedEmployee.lastname}</td>
                                    <td style={styles.tdLabel}>Employee ID</td>
                                    <td style={styles.td}>{selectedEmployee.id}</td>
                                </tr>
                                <tr>
                                    <td style={styles.tdLabel}>Department</td>
                                    <td style={styles.td}>{getDepartmentName(selectedEmployee.departmentId)}</td>
                                    <td style={styles.tdLabel}>Designation</td>
                                    <td style={styles.td}>{getDesignationName(selectedEmployee.designationId)}</td>
                                </tr>
                                <tr>
                                    <td style={styles.tdLabel}>Date of Joining</td>
                                    <td style={styles.td}>{selectedEmployee.dateOfJoining ? new Date(selectedEmployee.dateOfJoining).toLocaleDateString("en-IN") : "-"}</td>
                                    <td style={styles.tdLabel}>Pay Date</td>
                                    <td style={styles.td}>{new Date().toLocaleDateString("en-IN")}</td>
                                </tr>
                                <tr>
                                    <td style={styles.tdLabel}>Bank Name</td>
                                    <td style={styles.td}>{selectedEmployee.bankName || "-"}</td>
                                    <td style={styles.tdLabel}>Account No</td>
                                    <td style={styles.td}>{selectedEmployee.accountNumber || "-"}</td>
                                </tr>
                            </tbody>
                        </table>

                        {/* EARNINGS & DEDUCTIONS */}
                        <div className="row mt-3">
                            <div className="col-6 pr-1">
                                <div style={styles.sectionTitle}>Earnings</div>
                                <table style={styles.table}>
                                    <thead>
                                        <tr>
                                            <th style={{ ...styles.td, backgroundColor: "#f1f3f5", fontWeight: "600" }}>Component</th>
                                            <th style={{ ...styles.td, backgroundColor: "#f1f3f5", fontWeight: "600", textAlign: "right", width: "120px" }}>Amount (₹)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.from({ length: maxRows }, (_, i) => {
                                            const earning = effectiveEarnings[i];
                                            return (
                                                <tr key={`earn-${i}`}>
                                                    <td style={styles.td}>{earning ? earning.description : ""}</td>
                                                    <td style={{ ...styles.td, textAlign: "right" }}>{earning ? `₹${earning.amount.toFixed(2)}` : ""}</td>
                                                </tr>
                                            );
                                        })}
                                        <tr style={{ backgroundColor: "#e8f5e9", fontWeight: "bold" }}>
                                            <td style={styles.td}>Total Earnings</td>
                                            <td style={{ ...styles.td, textAlign: "right" }}>₹{totalEarnings.toFixed(2)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div className="col-6 pl-1">
                                <div style={styles.sectionTitle}>Deductions</div>
                                <table style={styles.table}>
                                    <thead>
                                        <tr>
                                            <th style={{ ...styles.td, backgroundColor: "#f1f3f5", fontWeight: "600" }}>Component</th>
                                            <th style={{ ...styles.td, backgroundColor: "#f1f3f5", fontWeight: "600", textAlign: "right", width: "120px" }}>Amount (₹)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.from({ length: maxRows }, (_, i) => {
                                            const deduction = effectiveDeductions[i];
                                            return (
                                                <tr key={`ded-${i}`}>
                                                    <td style={styles.td}>{deduction ? deduction.description : ""}</td>
                                                    <td style={{ ...styles.td, textAlign: "right" }}>{deduction ? `₹${deduction.amount.toFixed(2)}` : ""}</td>
                                                </tr>
                                            );
                                        })}
                                        <tr style={{ backgroundColor: "#ffebee", fontWeight: "bold" }}>
                                            <td style={styles.td}>Total Deductions</td>
                                            <td style={{ ...styles.td, textAlign: "right" }}>₹{totalDeductions.toFixed(2)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* NET PAY */}
                        <div style={styles.netPayBox}>
                            <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>Net Pay</div>
                            <div style={{ fontSize: "28px", fontWeight: "bold" }}>₹{netPay.toFixed(2)}</div>
                            <div style={{ fontSize: "12px", opacity: 0.85, marginTop: "4px" }}>{numberToWords(netPay)}</div>
                        </div>

                        {/* PAYMENT HISTORY */}
                        {payroll.transactions?.length > 0 && (
                            <div className="mt-3">
                                <div style={styles.sectionTitle}>Payment History</div>
                                <table style={styles.table}>
                                    <thead>
                                        <tr>
                                            <th style={{ ...styles.td, backgroundColor: "#f1f3f5", fontWeight: "600" }}>Date</th>
                                            <th style={{ ...styles.td, backgroundColor: "#f1f3f5", fontWeight: "600" }}>Method</th>
                                            <th style={{ ...styles.td, backgroundColor: "#f1f3f5", fontWeight: "600", textAlign: "right" }}>Amount (₹)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payroll.transactions.map((txn, i) => (
                                            <tr key={i}>
                                                <td style={styles.td}>{txn.date ? new Date(txn.date).toLocaleDateString("en-IN") : "-"}</td>
                                                <td style={styles.td}>{txn.paymentMethod || "-"}</td>
                                                <td style={{ ...styles.td, textAlign: "right" }}>₹{Number(txn.amount).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                        <tr style={{ fontWeight: "bold", backgroundColor: "#f8f9fa" }}>
                                            <td style={styles.td} colSpan="2">Total Paid</td>
                                            <td style={{ ...styles.td, textAlign: "right" }}>₹{totalPaid.toFixed(2)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* SIGNATURE & FOOTER */}
                        <div className="row mt-4 pt-3" style={{ borderTop: "1px dashed #ccc" }}>
                            <div className="col-6">
                                <div style={{ borderTop: "1px solid #333", width: "200px", paddingTop: "5px", marginTop: "50px" }}>
                                    Employee Signature
                                </div>
                            </div>
                            <div className="col-6 text-right">
                                {signatureImage ? (
                                    <img src={signatureImage} alt="Authorized Signature" crossOrigin="anonymous" onError={() => setSignatureImage(null)} style={{ width: "150px", height: "50px", objectFit: "contain" }} />
                                ) : (
                                    <div style={{ height: "50px" }}></div>
                                )}
                                <div style={{ borderTop: "1px solid #333", width: "200px", paddingTop: "5px", marginLeft: "auto" }}>
                                    Authorized Signatory
                                </div>
                            </div>
                        </div>

                        <p className="text-center mt-4" style={{ fontSize: "11px", color: "#999" }}>
                            This is a computer-generated payslip and does not require a physical signature. | {companyName} | Generated on {new Date().toLocaleDateString("en-IN")}
                        </p>
                    </div>

                </div>
            </div>
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .card { box-shadow: none !important; border: none !important; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            `}</style>
        </div>
    );
};

export default EmployeeViewPayslip;
