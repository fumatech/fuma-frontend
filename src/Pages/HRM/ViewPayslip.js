import { useLocation, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const ViewPayslip = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [companyLogo, setCompanyLogo] = useState(null);
  const [signatureImage, setSignatureImage] = useState(null);

  useEffect(() => {
    fetchDepartments();
    fetchDesignations();
    fetchCompanyLogo();
    fetchSignatureImage();
  }, []);
  const fetchSignatureImage = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/signature-image/get-all`
      );

      if (res.data && res.data.length > 0) {
        const images = res.data.filter(
          (f) => f.image && /\.(jpg|jpeg|png|gif|jfif)$/i.test(f.image)
        );

        if (images.length > 0) {
          const latestSignature = images[images.length - 1];

          const url = `${process.env.REACT_APP_BASE_URL}${latestSignature.image}`;
          //console.log("Signature URL:", url); // 🔴 ADD THIS

          setSignatureImage(url);
        }
      }
    } catch (error) {
      console.error("Failed to load signature image", error);
    }
  };

  const fetchCompanyLogo = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/file/get-all`
      );

      if (res.data && res.data.length > 0) {
        // Take last uploaded image
        const images = res.data.filter(
          (f) => f.image && /\.(jpg|jpeg|png|gif|jfif)$/i.test(f.image)
        );

        if (images.length > 0) {
          const latestImage = images[images.length - 1];
          setCompanyLogo(
            `${process.env.REACT_APP_BASE_URL}${latestImage.image}`
          );
        }
      }
    } catch (error) {
      console.error("Failed to load company logo", error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/department/getall`
      );
      setDepartments(response.data);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchDesignations = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/designation/getall`
      );
      setDesignations(response.data);
    } catch (error) {
      console.error("Error fetching designations:", error);
    }
  };
  if (!state) {
    return <div>No payroll data found</div>;
  }
  const getDepartmentName = (departmentId) => {
    const dept = departments.find((d) => d.id === departmentId);
    return dept ? dept.department : "-";
  };

  const getDesignationName = (designationId) => {
    const desig = designations.find((d) => d.id === designationId);
    return desig ? desig.name : "-";
  };
  const { payroll, employee } = state;

  const monthYear = new Date(payroll.year, payroll.month - 1).toLocaleString(
    "default",
    {
      month: "long",
      year: "numeric",
    }
  );

  const totalEarnings = payroll.earnings.reduce((sum, e) => sum + e.amount, 0);
  const netpay = payroll.total;
  const totalDeductions = payroll.deductions.reduce(
    (sum, d) => sum + d.amount,
    0
  );
  const referenceNo = `PAY-${payroll.payrollId}-${payroll.month}${payroll.year}`;
  const paymentStatus = payroll.status === 1 ? "Paid" : "Due";

  const handlePrint = () => {
    window.print();
  };
  const handleDownloadPDF = async () => {
    const element = document.getElementById("payslip-content");
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${referenceNo}.pdf`);
  };

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <div className="content">
          {/* ACTION BUTTONS */}
          <div className="d-flex justify-content-between mb-3">
            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate(-1)}
            >
              ← Back
            </button>

            <div>
              <button
                className="btn btn-outline-primary me-2"
                onClick={handlePrint}
              >
                🖨️ Print
              </button>
              <button className="btn btn-success" onClick={handleDownloadPDF}>
                📄 Download PDF
              </button>
            </div>
          </div>

          {/* PAYSLIP */}
          <div className="card shadow-lg border-0 p-4" id="payslip-content">
            {/* HEADER */}
            <div className="row align-items-center mb-3">
              <div className="col-md-2 text-center">
                {companyLogo ? (
                  <img
                    src={companyLogo}
                    alt="Company Logo"
                    style={{ width: "80px", objectFit: "contain" }}
                  />
                ) : (
                  <span className="text-muted small">No Logo</span>
                )}
              </div>

              <div className="col-md-8 text-center">
                <h3 className="fw-bold mb-0">
                  Fusion Master Tech Innovation Pvt Ltd
                </h3>
                <small className="text-muted">
                  Dange Chowk, Pimpri Chinchwad, Maharashtra – 411041
                </small>
                <h5 className="fw-bold mt-2">PAYSLIP – {monthYear}</h5>
              </div>

              <div className="col-md-2 text-end">
                <span
                  className={`badge ${
                    paymentStatus === "Paid"
                      ? "bg-success"
                      : "bg-warning text-dark"
                  }`}
                >
                  {paymentStatus}
                </span>
              </div>
            </div>

            <hr />

            {/* PAYROLL META */}
            <div className="row mb-3">
              <div className="col-md-6">
                <strong>Payroll Ref:</strong> {referenceNo}
              </div>
              <div className="col-md-6 text-end">
                <strong>Date:</strong> {new Date().toLocaleDateString()}
              </div>
            </div>

            {/* EMPLOYEE DETAILS */}
            <div className="row mb-3">
              <div className="col-md-6">
                <table className="table table-sm table-borderless">
                  <tbody>
                    <tr>
                      <td className="fw-bold">Employee</td>
                      <td>
                        {employee.prefix} {employee.firstname}{" "}
                        {employee.lastname}
                      </td>
                    </tr>
                    <tr>
                      <td className="fw-bold">Department</td>
                      <td>{getDepartmentName(employee.departmentId)}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold">Designation</td>
                      <td>{getDesignationName(employee.designationId)}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold">Basic</td>
                      <td>{payroll.basic}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="col-md-6">
                <table className="table table-sm table-borderless">
                  <tbody>
                    <tr>
                      <td className="fw-bold">Bank</td>
                      <td>{employee.bankName || "-"}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold">Account No</td>
                      <td>{employee.accountNumber || "-"}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold">IFSC Code</td>
                      <td>{employee.ifsc || "-"}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold">Tax ID</td>
                      <td>{employee.taxPayerId || "-"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* EARNINGS & DEDUCTIONS */}
            <div className="row">
              <div className="col-md-6">
                <div className="card border-success">
                  <div className="card-header bg-success text-white fw-bold">
                    Earnings
                  </div>
                  <table className="table table-bordered mb-0">
                    <tbody>
                      {payroll.earnings.map((e, i) => (
                        <tr key={i}>
                          <td>{e.description}</td>
                          <td className="text-end">₹{e.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                      <tr className="fw-bold bg-light">
                        <td>Total Earnings</td>
                        <td className="text-end">
                          ₹{totalEarnings.toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card border-danger">
                  <div className="card-header bg-danger text-white fw-bold">
                    Deductions
                  </div>
                  <table className="table table-bordered mb-0">
                    <tbody>
                      {payroll.deductions.map((d, i) => (
                        <tr key={i}>
                          <td>{d.description}</td>
                          <td className="text-end">₹{d.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                      <tr className="fw-bold bg-light">
                        <td>Total Deductions</td>
                        <td className="text-end">
                          ₹{totalDeductions.toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* NET PAY */}
            <div className="alert alert-primary text-center fw-bold fs-5 mt-3">
              Net Pay: ₹{netpay.toFixed(2)}
            </div>

            {/* NOTE */}
            <p>
              <strong>Note:</strong> {payroll?.note || "-"}
            </p>

            {/* SIGNATURE */}
            <div className="row mt-4">
              <div className="col-md-6"></div>
              <div className="col-md-6 text-end">
                {signatureImage ? (
                  <img
                    src={signatureImage}
                    alt="Authorized Signature"
                    style={{
                      width: "150px",
                      height: "60px",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <p className="text-muted">No Signature</p>
                )}

                <p className="fw-bold mt-2">Authorized Signature</p>
              </div>
            </div>

            <p className="text-center text-muted small mt-3">
              This is a system-generated payslip and does not require a
              signature.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewPayslip;
