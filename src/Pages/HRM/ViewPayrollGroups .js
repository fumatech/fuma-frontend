import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const ViewPayrollGroups = () => {
  const { id } = useParams();
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();
  const [payroll, setPayroll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [businessLocations, setBusinessLocations] = useState([]);
  const [columnsVisibility, setColumnsVisibility] = useState({
    employee: true,
    grossAmount: true,
    bankDetails: true,
    paymentStatus: true,
  });

  useEffect(() => {
    if (id && users.length > 0) {
      fetchPayrollDetails(id);
    }
  }, [id, users]);

  useEffect(() => {
    fetchUsers();
    fetchBusinessLocations();
  }, []);
  const fetchBusinessLocations = async () => {
    try {
      const res = await axios.get(
        "https://fusionmastertech.com:8443/business-locations/getall",
      );
      setBusinessLocations(res.data || []);
    } catch (error) {
      toast.error("Failed to fetch business locations");
      console.error(error);
    }
  };
  const getLocationName = (locationId) => {
    if (!locationId) return "All locations";

    const location = businessLocations.find(
      (loc) => Number(loc.id) === Number(locationId),
    );

    return location ? location.name : "Unknown location";
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/user/getall`,
      );
      setUsers(res.data || []);
    } catch (error) {
      toast.error("Failed to fetch users");
      console.error(error);
    }
  };
  // ✅ Helper: calculate total paid amount
  const getPaidAmount = (transactions = []) => {
    return transactions.reduce((sum, txn) => sum + Number(txn.amount || 0), 0);
  };

  // ✅ Helper: payment status
  const getPaymentStatus = (grossAmount, transactions = []) => {
    const paidAmount = getPaidAmount(transactions);
    return paidAmount >= grossAmount ? "PAID" : "DUE";
  };

  const fetchPayrollDetails = async (payrollId) => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/payroll/full/${payrollId}`,
      );

      const payrollData = res.data;

      const totalGrossAmount =
        payrollData.employees?.reduce(
          (sum, employee) => sum + (employee.total || 0),
          0,
        ) || 0;

      // 🔥 JOIN employees with users
      const mergedEmployees = payrollData.employees.map((emp) => {
        const user = users.find((u) => u.id === emp.employeeId);

        return {
          ...emp,
          transactions: emp.transactions || [], // 🔥 important
          fullName: user
            ? `${user.firstname} ${user.lastname}`
            : `Employee ${emp.employeeId}`,
          bankName: user?.bankName || "",
          branch: user?.branch || "",
          bankCode: user?.ifsc || "",
          accountHolderName: user?.accountHolderName || "",
          accountNumber: user?.accountNumber || "",
          taxId: user?.taxPayerId || "",
        };
      });

      setPayroll({
        id: payrollData.id,
        name: payrollData.payrollName,
        month: payrollData.month,
        year: payrollData.year,
        status: payrollData.status === 1 ? "Final" : "Draft",
        location: payrollData.location || "All locations",
        employees: mergedEmployees,
        totalGrossAmount,
      });

      setLoading(false);
    } catch (error) {
      toast.error("Failed to fetch payroll details");
      console.error(error);
      setLoading(false);
    }
  };

  const toggleColumn = (col) => {
    setColumnsVisibility((prev) => ({
      ...prev,
      [col]: !prev[col],
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const getMonthName = (monthNumber) => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return months[monthNumber - 1] || monthNumber;
  };

  if (loading) {
    return (
      <section className="content">
        <div className="container-fluid">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="sr-only">Loading...</span>
            </div>
            <p className="mt-2">Loading payroll details...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!payroll) {
    return (
      <section className="content">
        <div className="container-fluid">
          <div className="alert alert-danger">
            Payroll not found. Please go back to the list.
          </div>
          <button className="btn btn-primary" onClick={() => navigate(-1)}>
            Back to Payroll List
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content">
          <div className="container-fluid">
            <div className="card cardHover rounded-4 border-0">
              <div className="card-header bg-white border-bottom-0">
                <div className="d-flex justify-content-between align-items-center">
                  <h1 className="h3 mb-0 text-primary">View payroll group</h1>
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => navigate(-1)}
                  >
                    <i className="fas fa-arrow-left mr-2"></i> Back to List
                  </button>
                </div>
              </div>

              <div className="card-body">
                {/* Header Information - Exactly like the design */}
                <div className="row mb-4">
                  <div className="col-12">
                    <h3 className="text-primary mb-2">{payroll.name}</h3>
                    {/* <h4 className="font-weight-bold mb-1">Awesome Shop</h4> */}
                    <h4 className="text-muted mb-3">
                      {getLocationName(payroll.location)}
                    </h4>

                    {/* Payroll Details Section */}
                    <div className="mb-4">
                      {/* <h2 className="h4 mb-3">{payroll.name}</h2> */}
                      <div className="d-flex flex-wrap gap-3">
                        <div>
                          <span className="font-weight-bold">
                            Payroll group:
                          </span>{" "}
                          <span>{payroll.name}</span>
                        </div>
                        <div>
                          <span className="font-weight-bold">Status:</span>{" "}
                          <span
                            className={`badge ${
                              payroll.status === "Final"
                                ? "bg-success"
                                : "bg-secondary"
                            }`}
                          >
                            {payroll.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column Visibility Controls */}
                {/* Export Buttons */}
                <div className="row mt-4">
                  <div className="col-12">
                    <div className="d-flex flex-wrap gap-2">
                      <button className="btn Export-Btn">
                        <i className="fa fa-file-csv"></i> Export CSV
                      </button>
                      <button className="btn Export-Btn">
                        <i className="fa fa-file-excel"></i> Export Excel
                      </button>
                      <button className="btn Export-Btn">
                        <i className="fa fa-print"></i> Print
                      </button>
                      <button className="btn Export-Btn">
                        <i className="fa fa-file-pdf"></i> Export PDF
                      </button>
                    </div>
                  </div>
                </div>
                {/* <div className="row mb-3">
                  <div className="col-12">
                    <div className="d-flex justify-content-end">
                      <div className="dropdown">
                        <button
                          className="btn Export-Btn dropdown-toggle"
                          type="button"
                          id="dropdownMenuButton"
                          data-toggle="dropdown"
                          aria-haspopup="true"
                          aria-expanded="false"
                        >
                          <i className="fa fa-columns"></i> Column Visibility
                        </button>
                        <div
                          className="dropdown-menu"
                          aria-labelledby="dropdownMenuButton"
                        >
                          {Object.keys(columnsVisibility).map((col) => (
                            <div
                              key={col}
                              className="dropdown-item d-flex align-items-center"
                            >
                              <input
                                type="checkbox"
                                checked={columnsVisibility[col]}
                                onChange={() => toggleColumn(col)}
                                className="mr-2"
                              />
                              <span className="btn border-0 bg-transparent p-0 m-0">
                                {col.replace(/([A-Z])/g, " $1").toUpperCase()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div> */}

                {/* Employees Table - Exactly like the design */}
                <div className="table-responsive">
                  <table className="table table-bordered table-hover">
                    <thead className="thead-light">
                      <tr>
                        {columnsVisibility.employee && <th>Employee</th>}
                        {columnsVisibility.grossAmount && <th>Gross Amount</th>}
                        {columnsVisibility.bankDetails && <th>Bank Details</th>}
                        {columnsVisibility.paymentStatus && (
                          <th>Payment Status</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {payroll.employees.length > 0 ? (
                        payroll.employees.map((employee, index) => (
                          <tr key={employee.id || index}>
                            {columnsVisibility.employee && (
                              <td>
                                <strong>{employee.fullName}</strong>
                              </td>
                            )}
                            {columnsVisibility.grossAmount && (
                              <td className="font-weight-bold">
                                {formatCurrency(employee.total || 0)}
                              </td>
                            )}
                            {columnsVisibility.bankDetails && (
                              <td>
                                <div className="bank-details">
                                  <p className="mb-1">
                                    <strong>Bank Name:</strong>{" "}
                                    {employee.bankName || ""}
                                  </p>
                                  <p className="mb-1">
                                    <strong>Branch:</strong>{" "}
                                    {employee.branch || ""}
                                  </p>
                                  <p className="mb-1">
                                    <strong>Bank Identifier Code:</strong>{" "}
                                    {employee.bankCode || ""}
                                  </p>
                                  <p className="mb-1">
                                    <strong>Account Holder's Name:</strong>{" "}
                                    {employee.accountHolderName || ""}
                                  </p>
                                  <p className="mb-1">
                                    <strong>Bank Account No.:</strong>{" "}
                                    {employee.accountNumber || ""}
                                  </p>
                                  <p className="mb-1">
                                    <strong>Tax Payer ID:</strong>{" "}
                                    {employee.taxId || ""}
                                  </p>
                                </div>
                              </td>
                            )}
                            {columnsVisibility.paymentStatus && (
                              <td>
                                {(() => {
                                  const paidAmount = getPaidAmount(
                                    employee.transactions,
                                  );
                                  const isPaid =
                                    paidAmount >= (employee.total || 0);

                                  return (
                                    <>
                                      <span
                                        className={`badge ${
                                          isPaid
                                            ? "bg-success"
                                            : "bg-warning text-dark"
                                        }`}
                                      >
                                        {isPaid ? "Paid" : "Due"}
                                      </span>

                                      <div className="small text-muted mt-1">
                                        Paid: {formatCurrency(paidAmount)}{" "}
                                        <br />
                                        Total:{" "}
                                        {formatCurrency(employee.total || 0)}
                                      </div>
                                    </>
                                  );
                                })()}
                              </td>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={
                              Object.values(columnsVisibility).filter(Boolean)
                                .length
                            }
                            className="text-center text-muted py-4"
                          >
                            No employees found in this payroll group
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ViewPayrollGroups;
