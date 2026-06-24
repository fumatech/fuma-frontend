import { useLocation, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import fumaLogo from "../../assets/fuma-logo-lockup.svg";

const ViewPayslip = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const { payroll: initialPayroll, employee: passedEmployee } = state || {};
  const [payroll, setPayroll] = useState(initialPayroll);
  const [employee, setEmployee] = useState(passedEmployee || null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentAccounts, setPaymentAccounts] = useState([]);
  const [payingNow, setPayingNow] = useState(false);
  const [payForm, setPayForm] = useState({
    accountId: "",
    amount: "",
    paymentMethod: "Bank Transfer",
    note: "",
  });

  useEffect(() => {
    fetchDepartments();
    fetchDesignations();
    fetchPaymentAccounts();
    if (!passedEmployee && initialPayroll?.employeeId) {
      fetchEmployee(initialPayroll.employeeId);
    }
    // Always fetch fresh payroll data to get latest transactions/status
    if (initialPayroll) {
      refreshPayroll();
    }
  }, []);

  const formatCurrency = (amount) => {
    return `\u20B9${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
    })}`;
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

  const companyNameLine1 = "Fusion Master Tech Innovation And";
  const companyNameLine2 = "Development Private Limited";

  const companyAddress =
    "Office No.6, Sr. No. 23/2 Barne Estate, Opp. Padamji Papermill, Thergaon, Chinchwad, Pune - 411033, Maharashtra, India";

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

  const getDeductionLabel = (description) => {
    const label = (description || "").trim();
    return /^tax$/i.test(label) ? "Profession Tax" : label;
  };

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
  const displayPayrollNote =
    payroll?.note && payroll.note.includes("Type: FULL_TIME")
      ? payroll.note.replace(/\.?\s*Days present:\s*\d+/i, "").trim()
      : payroll?.note;

  const totalPaid = (payroll.transactions || []).reduce(
    (sum, t) => sum + Number(t.amount || 0),
    0,
  );
  let paymentStatus = "Due";
  if (totalPaid >= netPay && netPay > 0) {
    paymentStatus = "Paid";
  } else if (totalPaid > 0) {
    paymentStatus = "Partial";
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
      display: "flex",
      justifyContent: "flex-start",
      alignItems: "center",
      padding: "16px 20px",
      backgroundColor: "#ffffff",
      borderBottom: "2px solid #1e3a5f",
      marginBottom: "20px",
      gap: "12px",
      flexWrap: "nowrap",
    },
    headerLeft: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      flex: "0 0 auto",
    },
    logo: {
      width: "100px",
      maxWidth: "100%",
      height: "auto",
      objectFit: "contain",
      flexShrink: 0,
    },
    companyGroup: {
      display: "flex",
      alignItems: "stretch",
      gap: "10px",
    },
    companyDivider: {
      width: "2px",
      backgroundColor: "#1e3a5f",
      alignSelf: "stretch",
      flexShrink: 0,
    },
    companyBlock: {
      textAlign: "left",
      maxWidth: "420px",
      whiteSpace: "normal",
    },
    companyName: {
      margin: "0 0 2px 0",
      fontWeight: "800",
      fontSize: "19px",
      color: "#1e3a5f",
      textTransform: "uppercase",
      textAlign: "left",
      lineHeight: "1.25",
    },
    companyAddress: {
      margin: 0,
      fontSize: "12px",
      color: "#6b7280",
      lineHeight: "1.4",
      textAlign: "left",
    },
    headerRight: {
      textAlign: "right",
      flex: "0 0 auto",
      marginLeft: "auto",
      minWidth: "120px",
    },
    payslipTitle: {
      margin: 0,
      fontWeight: "800",
      textTransform: "uppercase",
      color: "#1e3a5f",
      letterSpacing: "0.4px",
    },
    payslipMonth: {
      marginTop: "4px",
      fontSize: "12px",
      color: "#4b5563",
    },
    statusBadge: {
      marginTop: "6px",
      display: "inline-block",
      fontSize: "11px",
      fontWeight: "700",
      color: "#ffffff",
      borderRadius: "999px",
      padding: "3px 9px",
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
                      amount: (netPay - totalPaid).toFixed(2).toString(),
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
              <div style={styles.headerLeft}>
                <img src={fumaLogo} alt="Fuma Logo" style={styles.logo} />
                <div style={styles.companyGroup}>
                  <div style={styles.companyDivider}></div>
                  <div style={styles.companyBlock}>
                    <h4 style={styles.companyName}>
                      <span style={{ display: "block" }}>{companyNameLine1}</span>
                      <span style={{ display: "block" }}>{companyNameLine2}</span>
                    </h4>
                    {companyAddress && (
                      <p style={styles.companyAddress}>{companyAddress}</p>
                    )}
                  </div>
                </div>
              </div>
              <div style={styles.headerRight}>
                <h5 style={styles.payslipTitle}>PAYSLIP</h5>
                <div style={styles.payslipMonth}>{monthYear}</div>
                <span
                  style={{
                    ...styles.statusBadge,
                    backgroundColor:
                      paymentStatus === "Paid"
                        ? "#198754"
                        : paymentStatus === "Partial"
                          ? "#fd7e14"
                          : "#dc3545",
                  }}
                >
                  {paymentStatus}
                </span>
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
                    {employee.firstname} {employee.lastname}
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
                        {"Amount (\u20B9)"}
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
                            {earning ? formatCurrency(earning.amount) : ""}
                          </td>
                        </tr>
                      );
                    })}
                    <tr style={{ backgroundColor: "#e8f5e9", fontWeight: "bold" }}>
                      <td style={styles.td}>Total Earnings</td>
                      <td style={{ ...styles.td, textAlign: "right" }}>
                        {formatCurrency(totalEarnings)}
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
                        {"Amount (\u20B9)"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: maxRows }, (_, i) => {
                      const deduction = effectiveDeductions[i];
                      return (
                        <tr key={`ded-${i}`}>
                          <td style={styles.td}>
                            {deduction ? getDeductionLabel(deduction.description) : ""}
                          </td>
                          <td style={{ ...styles.td, textAlign: "right" }}>
                            {deduction
                              ? formatCurrency(deduction.amount)
                              : ""}
                          </td>
                        </tr>
                      );
                    })}
                    <tr style={{ backgroundColor: "#ffebee", fontWeight: "bold" }}>
                      <td style={styles.td}>Total Deductions</td>
                      <td style={{ ...styles.td, textAlign: "right" }}>
                        {formatCurrency(totalDeductions)}
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
                {formatCurrency(netPay)}
              </div>
              <div style={{ fontSize: "12px", opacity: 0.85, marginTop: "4px" }}>
                {numberToWords(netPay)}
              </div>
            </div>

            {/* ===== NOTE ===== */}
            {displayPayrollNote && (
              <div
                className="mt-3 p-2"
                style={{
                  backgroundColor: "#fff8e1",
                  border: "1px solid #ffe082",
                  borderRadius: "4px",
                  fontSize: "12px",
                }}
              >
                <strong>Note:</strong> {displayPayrollNote}
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
                <div style={{ height: "50px" }}></div>
                <div style={{ borderTop: "1px solid #333", width: "200px", paddingTop: "5px", marginLeft: "auto" }}>
                  Authorized Signatory
                </div>
              </div>
            </div>

            <p
              className="text-center mt-4"
              style={{ fontSize: "11px", color: "#999" }}
            >
              This is a system-generated payslip and does not require a physical signature.
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
                      <span><strong>Net Pay:</strong> {formatCurrency(netPay)}</span>
                      <span><strong>Already Paid:</strong> {formatCurrency(totalPaid)}</span>
                    </div>
                    <div className="text-right mt-1">
                      <strong>Balance Due:</strong>{" "}
                      <span className="text-danger font-weight-bold">
                        {formatCurrency(netPay - totalPaid)}
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
                          {acc.accountName} ({acc.accountNumber}) - Balance: {formatCurrency(acc.balance || 0)}
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
