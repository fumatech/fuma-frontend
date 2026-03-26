import { useLocation, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import defaultFumaLogo from "../../assets/fuma-logo-lockup.svg";

const ViewPayslip = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [companyLogo, setCompanyLogo] = useState(null);
  const [signatureImage, setSignatureImage] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const { payroll: initialPayroll, employee: passedEmployee } = state || {};
  const [payroll, setPayroll] = useState(initialPayroll);
  const [employee, setEmployee] = useState(passedEmployee || null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentAccounts, setPaymentAccounts] = useState([]);
  const [payingNow, setPayingNow] = useState(false);
  const buildMediaUrl = (path) => {
    if (!path) return null;
    if (/^data:image\//i.test(path)) return path;
    if (/^https?:\/\//i.test(path)) return path;
    if (path.startsWith("//")) return `https:${path}`;
    return `${process.env.REACT_APP_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  };
  const isSupportedImage = (path) =>
    !!path && (/^data:image\//i.test(path) || /\.(jpg|jpeg|png|gif|jfif|webp|svg)$/i.test(path));
  const [payForm, setPayForm] = useState({
    accountId: "",
    amount: "",
    paymentMethod: "Bank Transfer",
    note: "",
  });

  useEffect(() => {
    fetchDepartments();
    fetchDesignations();
    fetchCompanyLogo();
    fetchSignatureImage();
    fetchBusinesses();
    fetchPaymentAccounts();
    if (!passedEmployee && initialPayroll?.employeeId) {
      fetchEmployee(initialPayroll.employeeId);
    }
    // Always fetch fresh payroll data to get latest transactions/status
    if (initialPayroll) {
      refreshPayroll();
    }
  }, []);

  const fetchBusinesses = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/business-details/getall`,
      );
      setBusinesses(res.data);
    } catch (error) {
      console.error("Failed to load business details", error);
    }
  };

  const fetchEmployee = async (employeeId) => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/user/${employeeId}`,
      );
      setEmployee(res.data);
    } catch (error) {
      console.error("Failed to load employee", error);
    }
  };

  const fetchPaymentAccounts = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/payment-account/getall`,
      );
      setPaymentAccounts(res.data);
    } catch (error) {
      console.error("Failed to load payment accounts", error);
    }
  };

  const refreshPayroll = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/payroll/employee-wise`,
      );
      const empId = initialPayroll?.employeeId;
      const mo = initialPayroll?.month;
      const yr = initialPayroll?.year;
      const matching = res.data
        .filter(
          (p) =>
            p.employeeId === empId &&
            p.month === mo &&
            p.year === yr,
        )
        .sort((a, b) => b.payrollId - a.payrollId)[0];
      if (matching) {
        setPayroll(matching);
      }
    } catch (error) {
      console.error("Failed to refresh payroll", error);
    }
  };

  const handlePayment = async () => {
    if (!payForm.accountId) {
      toast.warning("Please select a payment account");
      return;
    }
    if (!payForm.amount || Number(payForm.amount) <= 0) {
      toast.warning("Please enter a valid amount");
      return;
    }
    if (!payroll.payrollEmployeeId) {
      toast.error("Payroll employee record not found. Please regenerate the payroll.");
      return;
    }

    setPayingNow(true);
    try {
      await axios.post(
        `${process.env.REACT_APP_BASE_URL}/payroll/payroll-employee/bulk-transaction`,
        [
          {
            payrollEmployeeId: payroll.payrollEmployeeId,
            accountId: Number(payForm.accountId),
            paymentMethod: payForm.paymentMethod,
            amount: Number(payForm.amount),
            transactionType: "SALARY",
            addedBy: localStorage.getItem("email") || "admin",
            note: payForm.note || `Salary payment for ${employee?.firstname || ""} ${employee?.lastname || ""}`,
          },
        ],
      );
      toast.success("Payment recorded successfully!");
      setShowPayModal(false);
      setPayForm({ accountId: "", amount: "", paymentMethod: "Bank Transfer", note: "" });
      await refreshPayroll();
      fetchPaymentAccounts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Payment failed");
    } finally {
      setPayingNow(false);
    }
  };

  const fetchSignatureImage = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/signature-image/get-all`,
      );
      if (res.data && res.data.length > 0) {
        const images = res.data.filter(
          (f) => isSupportedImage(f.image),
        );
        if (images.length > 0) {
          const latestSignature = images[images.length - 1];
          const latestSignatureUrl = buildMediaUrl(latestSignature.image);
          if (!latestSignatureUrl) return;
          try {
            const signatureDataUrl = await toDataUrl(latestSignatureUrl);
            setSignatureImage(signatureDataUrl);
          } catch {
            setSignatureImage(latestSignatureUrl);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load signature image", error);
    }
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
        const businessRes = await axios.get(
          `${process.env.REACT_APP_BASE_URL}/business-details/getall`,
        );
        const business =
          Array.isArray(businessRes.data) && businessRes.data.length > 0
            ? businessRes.data[0]
            : null;
        if (business) {
          ["logo", "logoImage", "image", "businessLogo"].forEach((key) => {
            if (isSupportedImage(business[key])) candidates.push(business[key]);
          });
        }
      } catch {
        // ignore and try file list
      }

      const res = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/file/get-all`,
      );
      if (res.data && res.data.length > 0) {
        const images = res.data.filter(
          (f) => isSupportedImage(f.image),
        );
        if (images.length > 0) {
          for (let i = images.length - 1; i >= 0; i--) {
            candidates.push(images[i].image);
          }
        }
      }
      const resolvedLogo = await getFirstWorkingImage(candidates);
      setCompanyLogo(resolvedLogo || null);
    } catch (error) {
      console.error("Failed to load company logo", error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/department/getall`,
      );
      setDepartments(response.data);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchDesignations = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/designation/getall`,
      );
      setDesignations(response.data);
    } catch (error) {
      console.error("Error fetching designations:", error);
    }
  };

  if (!state) {
    return <div>No payroll data found</div>;
  }

  if (!employee) {
    return <div className="text-center p-5">Loading employee data...</div>;
  }

  const getDepartmentName = (departmentId) => {
    const dept = departments.find((d) => d.id === departmentId);
    return dept ? dept.department : "-";
  };

  const getDesignationName = (designationId) => {
    const desig = designations.find((d) => d.id === designationId);
    return desig ? desig.name : "-";
  };

  const companyName =
    businesses.length > 0 ? businesses[0].name : "Your Company Name";
  const companyAddress =
    businesses.length > 0
      ? `${businesses[0].address || ""}, ${businesses[0].city || ""}, ${businesses[0].state || ""} – ${businesses[0].zipCode || ""}`
      : "";

  const monthYear = new Date(payroll.year, payroll.month - 1).toLocaleString(
    "default",
    { month: "long", year: "numeric" },
  );

  // Build effective earnings/deductions — if arrays are empty (auto-generated payroll),
  // use basic/total to create a default "Basic Pay" earning
  const effectiveEarnings =
    payroll.earnings && payroll.earnings.length > 0
      ? payroll.earnings
      : (payroll.total != null && payroll.total > 0) || (payroll.basic != null && payroll.basic > 0)
        ? [{ description: "Basic Pay", amount: payroll.total || payroll.basic }]
        : [];

  const effectiveDeductions =
    payroll.deductions && payroll.deductions.length > 0
      ? payroll.deductions
      : [];

  const totalEarnings = effectiveEarnings.reduce(
    (sum, e) => sum + e.amount,
    0,
  );
  const totalDeductions = effectiveDeductions.reduce(
    (sum, d) => sum + d.amount,
    0,
  );
  const netPay = payroll.total || totalEarnings - totalDeductions;
  const referenceNo = `PAY-${payroll.payrollId}-${String(payroll.month).padStart(2, "0")}${payroll.year}`;

  const totalPaid = (payroll.transactions || []).reduce(
    (sum, t) => sum + Number(t.amount || 0),
    0,
  );
  let paymentStatus = "Due";
  let paymentBadgeClass = "bg-warning text-dark";
  if (totalPaid >= netPay && netPay > 0) {
    paymentStatus = "Paid";
    paymentBadgeClass = "bg-success";
  } else if (totalPaid > 0) {
    paymentStatus = "Partial";
    paymentBadgeClass = "bg-info";
  }

  // Number to words converter for Indian currency
  const numberToWords = (num) => {
    if (num === 0) return "Zero";
    const ones = [
      "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
      "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
      "Seventeen", "Eighteen", "Nineteen",
    ];
    const tens = [
      "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy",
      "Eighty", "Ninety",
    ];
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

  // Max rows to align Earnings & Deductions tables
  const maxRows = Math.max(
    effectiveEarnings.length,
    effectiveDeductions.length,
    1,
  );

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");
    const element = document.getElementById("payslip-content");
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Payslip-${referenceNo}.pdf`);
  };

  const styles = {
    container: {
      maxWidth: "900px",
      margin: "0 auto",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      fontSize: "13px",
      color: "#333",
    },
    header: {
      borderBottom: "3px solid #0c4166",
      paddingBottom: "15px",
      marginBottom: "20px",
    },
    sectionTitle: {
      backgroundColor: "#0c4166",
      color: "#fff",
      padding: "6px 12px",
      fontSize: "13px",
      fontWeight: "bold",
      marginBottom: "0",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "13px",
    },
    td: {
      border: "1px solid #dee2e6",
      padding: "6px 10px",
    },
    tdLabel: {
      border: "1px solid #dee2e6",
      padding: "6px 10px",
      fontWeight: "600",
      backgroundColor: "#f8f9fa",
      width: "35%",
    },
    netPayBox: {
      background: "linear-gradient(135deg, #0c4166, #1a6ba3)",
      color: "#fff",
      padding: "15px 20px",
      borderRadius: "8px",
      textAlign: "center",
      marginTop: "20px",
    },
  };

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <div className="content">
          {/* ACTION BUTTONS - hidden on print */}
          <div className="d-flex justify-content-between mb-3 no-print">
            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate(-1)}
            >
              <i className="fas fa-arrow-left mr-1"></i> Back
            </button>
            <div>
              <button
                className="btn btn-outline-primary mr-2"
                onClick={handlePrint}
              >
                <i className="fas fa-print mr-1"></i> Print
              </button>
              <button className="btn btn-success mr-2" onClick={handleDownloadPDF}>
                <i className="fas fa-file-pdf mr-1"></i> Download PDF
              </button>
              {paymentStatus !== "Paid" && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setPayForm((prev) => ({
                      ...prev,
                      amount: (netPay - totalPaid).toFixed(2),
                    }));
                    setShowPayModal(true);
                  }}
                >
                  <i className="fas fa-money-bill-wave mr-1"></i> Pay Now
                </button>
              )}
            </div>
          </div>

          {/* PAYSLIP */}
          <div
            className="card shadow border-0 p-4"
            id="payslip-content"
            style={styles.container}
          >
            {/* ===== HEADER ===== */}
            <div style={styles.header}>
              <div className="row align-items-center">
                <div
                  className="col-2 text-center"
                  style={{ paddingTop: "6px", paddingBottom: "6px" }}
                >
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
                  <h4 style={{ fontWeight: "bold", color: "#0c4166", marginBottom: "2px" }}>
                    {companyName}
                  </h4>
                  {companyAddress && (
                    <small className="text-muted">{companyAddress}</small>
                  )}
                </div>
                <div className="col-3 text-right">
                  <h5
                    style={{
                      fontWeight: "bold",
                      color: "#0c4166",
                      marginBottom: "4px",
                    }}
                  >
                    PAYSLIP
                  </h5>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    {monthYear}
                  </div>
                  <span
                    className={`badge mt-1 ${paymentBadgeClass}`}
                    style={{ fontSize: "11px" }}
                  >
                    {paymentStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* ===== PAYSLIP META ===== */}
            <div className="row mb-3">
              <div className="col-6">
                <strong>Payslip No:</strong> {referenceNo}
              </div>
              <div className="col-6 text-right">
                <strong>Pay Period:</strong> {monthYear}
              </div>
            </div>

            {/* ===== EMPLOYEE DETAILS ===== */}
            <div style={styles.sectionTitle}>Employee Details</div>
            <table style={styles.table}>
              <tbody>
                <tr>
                  <td style={styles.tdLabel}>Employee Name</td>
                  <td style={styles.td}>
                    {employee.prefix} {employee.firstname} {employee.lastname}
                  </td>
                  <td style={styles.tdLabel}>Employee ID</td>
                  <td style={styles.td}>{employee.id}</td>
                </tr>
                <tr>
                  <td style={styles.tdLabel}>Department</td>
                  <td style={styles.td}>
                    {getDepartmentName(employee.departmentId)}
                  </td>
                  <td style={styles.tdLabel}>Designation</td>
                  <td style={styles.td}>
                    {getDesignationName(employee.designationId)}
                  </td>
                </tr>
                <tr>
                  <td style={styles.tdLabel}>Date of Joining</td>
                  <td style={styles.td}>
                    {employee.dateOfJoining
                      ? new Date(employee.dateOfJoining).toLocaleDateString(
                        "en-IN",
                      )
                      : "-"}
                  </td>
                  <td style={styles.tdLabel}>Pay Date</td>
                  <td style={styles.td}>
                    {new Date().toLocaleDateString("en-IN")}
                  </td>
                </tr>
                <tr>
                  <td style={styles.tdLabel}>Bank Name</td>
                  <td style={styles.td}>{employee.bankName || "-"}</td>
                  <td style={styles.tdLabel}>Account No</td>
                  <td style={styles.td}>{employee.accountNumber || "-"}</td>
                </tr>
                <tr>
                  <td style={styles.tdLabel}>IFSC Code</td>
                  <td style={styles.td}>{employee.ifsc || "-"}</td>
                  <td style={styles.tdLabel}>PAN / Tax ID</td>
                  <td style={styles.td}>{employee.taxPayerId || "-"}</td>
                </tr>
              </tbody>
            </table>

            {/* ===== EARNINGS & DEDUCTIONS ===== */}
            <div className="row mt-3">
              {/* Earnings */}
              <div className="col-6 pr-1">
                <div style={styles.sectionTitle}>Earnings</div>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ ...styles.td, backgroundColor: "#f1f3f5", fontWeight: "600" }}>
                        Component
                      </th>
                      <th
                        style={{
                          ...styles.td,
                          backgroundColor: "#f1f3f5",
                          fontWeight: "600",
                          textAlign: "right",
                          width: "120px",
                        }}
                      >
                        Amount (₹)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: maxRows }, (_, i) => {
                      const earning = effectiveEarnings[i];
                      return (
                        <tr key={`earn-${i}`}>
                          <td style={styles.td}>
                            {earning ? earning.description : ""}
                          </td>
                          <td style={{ ...styles.td, textAlign: "right" }}>
                            {earning ? `₹${earning.amount.toFixed(2)}` : ""}
                          </td>
                        </tr>
                      );
                    })}
                    <tr style={{ backgroundColor: "#e8f5e9", fontWeight: "bold" }}>
                      <td style={styles.td}>Total Earnings</td>
                      <td style={{ ...styles.td, textAlign: "right" }}>
                        ₹{totalEarnings.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Deductions */}
              <div className="col-6 pl-1">
                <div style={styles.sectionTitle}>Deductions</div>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ ...styles.td, backgroundColor: "#f1f3f5", fontWeight: "600" }}>
                        Component
                      </th>
                      <th
                        style={{
                          ...styles.td,
                          backgroundColor: "#f1f3f5",
                          fontWeight: "600",
                          textAlign: "right",
                          width: "120px",
                        }}
                      >
                        Amount (₹)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: maxRows }, (_, i) => {
                      const deduction = effectiveDeductions[i];
                      return (
                        <tr key={`ded-${i}`}>
                          <td style={styles.td}>
                            {deduction ? deduction.description : ""}
                          </td>
                          <td style={{ ...styles.td, textAlign: "right" }}>
                            {deduction
                              ? `₹${deduction.amount.toFixed(2)}`
                              : ""}
                          </td>
                        </tr>
                      );
                    })}
                    <tr style={{ backgroundColor: "#ffebee", fontWeight: "bold" }}>
                      <td style={styles.td}>Total Deductions</td>
                      <td style={{ ...styles.td, textAlign: "right" }}>
                        ₹{totalDeductions.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ===== NET PAY ===== */}
            <div style={styles.netPayBox}>
              <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>
                Net Pay
              </div>
              <div style={{ fontSize: "28px", fontWeight: "bold" }}>
                ₹{netPay.toFixed(2)}
              </div>
              <div style={{ fontSize: "12px", opacity: 0.85, marginTop: "4px" }}>
                {numberToWords(netPay)}
              </div>
            </div>

            {/* ===== PAYMENT SUMMARY ===== */}
            {payroll.transactions && payroll.transactions.length > 0 && (
              <div className="mt-3">
                <div style={styles.sectionTitle}>Payment History</div>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ ...styles.td, backgroundColor: "#f1f3f5", fontWeight: "600" }}>
                        Date
                      </th>
                      <th style={{ ...styles.td, backgroundColor: "#f1f3f5", fontWeight: "600" }}>
                        Transaction ID
                      </th>
                      <th style={{ ...styles.td, backgroundColor: "#f1f3f5", fontWeight: "600" }}>
                        Method
                      </th>
                      <th
                        style={{
                          ...styles.td,
                          backgroundColor: "#f1f3f5",
                          fontWeight: "600",
                          textAlign: "right",
                        }}
                      >
                        Amount (₹)
                      </th>
                      <th style={{ ...styles.td, backgroundColor: "#f1f3f5", fontWeight: "600" }}>
                        Note
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {payroll.transactions.map((txn) => (
                      <tr key={txn.transactionId}>
                        <td style={styles.td}>
                          {txn.date
                            ? new Date(txn.date).toLocaleDateString("en-IN")
                            : "-"}
                        </td>
                        <td style={styles.td}>{txn.transactionId}</td>
                        <td style={styles.td}>{txn.paymentMethod || "-"}</td>
                        <td style={{ ...styles.td, textAlign: "right" }}>
                          ₹{Number(txn.amount).toFixed(2)}
                        </td>
                        <td style={styles.td}>{txn.note || "-"}</td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: "bold", backgroundColor: "#f8f9fa" }}>
                      <td style={styles.td} colSpan="3">
                        Total Paid
                      </td>
                      <td style={{ ...styles.td, textAlign: "right" }}>
                        ₹{totalPaid.toFixed(2)}
                      </td>
                      <td style={styles.td}>
                        Balance: ₹{(netPay - totalPaid).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* ===== NOTE ===== */}
            {payroll.note && (
              <div
                className="mt-3 p-2"
                style={{
                  backgroundColor: "#fff8e1",
                  border: "1px solid #ffe082",
                  borderRadius: "4px",
                  fontSize: "12px",
                }}
              >
                <strong>Note:</strong> {payroll.note}
              </div>
            )}

            {/* ===== SIGNATURE & FOOTER ===== */}
            <div className="row mt-4 pt-3" style={{ borderTop: "1px dashed #ccc" }}>
              <div className="col-6">
                <div style={{ borderTop: "1px solid #333", width: "200px", paddingTop: "5px", marginTop: "50px" }}>
                  Employee Signature
                </div>
              </div>
              <div className="col-6 text-right">
                {signatureImage ? (
                  <img
                    src={signatureImage}
                    alt="Authorized Signature"
                    crossOrigin="anonymous"
                    onError={() => setSignatureImage(null)}
                    style={{
                      width: "150px",
                      height: "50px",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <div style={{ height: "50px" }}></div>
                )}
                <div style={{ borderTop: "1px solid #333", width: "200px", paddingTop: "5px", marginLeft: "auto" }}>
                  Authorized Signatory
                </div>
              </div>
            </div>

            <p
              className="text-center mt-4"
              style={{ fontSize: "11px", color: "#999" }}
            >
              This is a computer-generated payslip and does not require a
              physical signature. |{" "}
              {companyName} | Generated on{" "}
              {new Date().toLocaleDateString("en-IN")}
            </p>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .content-wrapper { margin: 0 !important; padding: 0 !important; }
          .wrapper { margin: 0 !important; padding: 0 !important; }
          .card { box-shadow: none !important; border: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* ===== PAYMENT MODAL ===== */}
      {showPayModal && (
        <>
          <div
            className="modal-backdrop fade show"
            onClick={() => setShowPayModal(false)}
          ></div>
          <div
            className="modal fade show"
            style={{ display: "block" }}
            tabIndex="-1"
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title">
                    <i className="fas fa-money-bill-wave mr-2"></i>
                    Record Payment
                  </h5>
                  <button
                    type="button"
                    className="close text-white"
                    onClick={() => setShowPayModal(false)}
                  >
                    &times;
                  </button>
                </div>
                <div className="modal-body">
                  <div className="mb-3 p-2 bg-light rounded">
                    <div className="d-flex justify-content-between">
                      <span><strong>Net Pay:</strong> ₹{netPay.toFixed(2)}</span>
                      <span><strong>Already Paid:</strong> ₹{totalPaid.toFixed(2)}</span>
                    </div>
                    <div className="text-right mt-1">
                      <strong>Balance Due:</strong>{" "}
                      <span className="text-danger font-weight-bold">
                        ₹{(netPay - totalPaid).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="font-weight-bold">Payment Account *</label>
                    <select
                      className="form-control"
                      value={payForm.accountId}
                      onChange={(e) =>
                        setPayForm((prev) => ({ ...prev, accountId: e.target.value }))
                      }
                    >
                      <option value="">-- Select Account --</option>
                      {paymentAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.accountName} ({acc.accountNumber}) - Balance: ₹
                          {Number(acc.balance || 0).toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="font-weight-bold">Amount *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={payForm.amount}
                      min="0.01"
                      step="0.01"
                      onChange={(e) =>
                        setPayForm((prev) => ({ ...prev, amount: e.target.value }))
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label className="font-weight-bold">Payment Method</label>
                    <select
                      className="form-control"
                      value={payForm.paymentMethod}
                      onChange={(e) =>
                        setPayForm((prev) => ({ ...prev, paymentMethod: e.target.value }))
                      }
                    >
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="font-weight-bold">Note</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Payment note (optional)"
                      value={payForm.note}
                      onChange={(e) =>
                        setPayForm((prev) => ({ ...prev, note: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowPayModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handlePayment}
                    disabled={payingNow}
                  >
                    {payingNow ? (
                      <>
                        <span className="spinner-border spinner-border-sm mr-1"></span>
                        Processing...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check mr-1"></i> Confirm Payment
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ViewPayslip;
