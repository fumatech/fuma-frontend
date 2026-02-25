import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const AddPayment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [users, setUsers] = useState([]);
  const [payroll, setPayroll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [paymentAccounts, setPaymentAccounts] = useState([]);
  const [businessLocations, setBusinessLocations] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  // ✅ SINGLE SOURCE OF TRUTH
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);

  const selectedEmployee = employees.find(
    (e) => e.payrollEmployeeId === selectedEmployeeId,
  );

  const [formData, setFormData] = useState({
    amount: "",
    paidOn: new Date().toISOString().slice(0, 10),
    paymentAccount: "",
    paymentNote: "",
    paymentMethod: "",
  });

  /* ---------------- FETCH INITIAL DATA ---------------- */

  useEffect(() => {
    if (!id) return;

    fetchUsers();
    fetchPaymentAccounts();
    fetchPaymentMethods();
    fetchBusinessLocations();
  }, [id]);

  useEffect(() => {
    if (id && users.length > 0) {
      fetchPayrollDetails(id);
    }
  }, [id, users]);
  useEffect(() => {
    if (selectedEmployee) {
      setFormData((prev) => ({
        ...prev,
        amount: getEmployeeDue(selectedEmployee),
      }));
    }
  }, [selectedEmployee]);

  /* ---------------- API CALLS ---------------- */

  const fetchUsers = async () => {
    const res = await axios.get(
      `${process.env.REACT_APP_BASE_URL}/user/getall`,
    );
    setUsers(res.data || []);
  };

  const fetchPayrollDetails = async (payrollId) => {
    setLoading(true);

    const res = await axios.get(
      `${process.env.REACT_APP_BASE_URL}/payroll/full/${payrollId}`,
    );
    const employeesList =
      res.data.employees?.map((emp) => {
        const user = users.find((u) => Number(u.id) === Number(emp.employeeId));

        return {
          ...emp,
          // payrollEmployeeId: emp.id,   ❌ REMOVE THIS line
          payrollEmployeeId: emp.payrollEmployeeId, // ✅ USE THIS
          employeeId: emp.employeeId,
          name: user
            ? `${user.firstname} ${user.lastname}`
            : "Unknown Employee",
          bankName: user?.bankName || "",
          branch: user?.branch || "",
          bankCode: user?.ifsc || "",
          accountHolderName: user?.accountHolderName || "",
          accountNumber: user?.accountNumber || "",
          taxId: user?.taxPayerId || "",
        };
      }) || [];

    setEmployees(employeesList);
    setPayroll(res.data);

    // ✅ PRESELECT EMPLOYEE
    if (employeesList.length > 0) {
      const preselected = location.state?.employeeId
        ? employeesList.find((e) => e.employeeId === location.state.employeeId)
        : employeesList[0];

      if (preselected) {
        setSelectedEmployeeId(preselected.payrollEmployeeId);
        setFormData((p) => ({ ...p, amount: preselected.total || "" }));
      }
    }

    setLoading(false);
  };

  const fetchPaymentAccounts = async () => {
    const res = await axios.get(
      `${process.env.REACT_APP_BASE_URL}/payment-account/getall`,
    );
    setPaymentAccounts(res.data || []);
  };

  const fetchPaymentMethods = async () => {
    const res = await axios.get(
      `${process.env.REACT_APP_BASE_URL}/payment-method/getall`,
    );
    setPaymentMethods(res.data || []);
  };

  const fetchBusinessLocations = async () => {
    const res = await axios.get(
      "https://fusionmastertech.com:8443/business-locations/getall",
    );
    setBusinessLocations(res.data || []);
  };

  /* ---------------- HANDLERS ---------------- */

  const handleEmployeeChange = (e) => {
    const id = Number(e.target.value);
    setSelectedEmployeeId(id);

    const emp = employees.find((e) => e.payrollEmployeeId === id);
    if (emp) {
      setFormData((p) => ({ ...p, amount: emp.total || "" }));
    }
  };
  const getEmployeeDue = (employee) => {
    // Sum all previous transaction amounts
    const totalPaid = employee.transactions?.reduce(
      (sum, t) => sum + Number(t.amount || 0),
      0,
    );

    // Calculate due
    const due = employee.total - totalPaid;
    return due > 0 ? due : 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };
  const getLocationName = (locationId) => {
    if (!locationId) return "All locations";

    const location = businessLocations.find(
      (loc) => Number(loc.id) === Number(locationId),
    );

    return location ? location.name : "Unknown location";
  };
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedEmployee) {
      toast.error("Invalid employee selection");
      return;
    }

    if (
      !formData.amount ||
      !formData.paymentMethod ||
      !formData.paymentAccount
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    const method = paymentMethods.find(
      (m) => Number(m.id) === Number(formData.paymentMethod),
    );

    if (!method) {
      toast.error("Invalid payment method");
      return;
    }

    const payload = [
      {
        payrollEmployeeId: selectedEmployee.payrollEmployeeId,
        amount: Number(formData.amount),
        paymentMethod: method.name,
        note: formData.paymentNote || "",
        date: new Date(formData.paidOn).toISOString(), // ✅ ISO string
        addedBy: "abc",
      },
    ];
    console.log(payload);

    await axios.post(
      `${process.env.REACT_APP_BASE_URL}/payroll/payroll-employee/bulk-transaction/${formData.paymentAccount}`,
      payload,
    );

    toast.success("Payment added successfully");
    navigate(`/payroll/${id}`);
  };

  if (loading) {
    return (
      <div className="content-wrapper">
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
      </div>
    );
  }

  if (!payroll) {
    return (
      <div className="content-wrapper">
        <section className="content">
          <div className="container-fluid">
            <div className="alert alert-danger">
              Payroll not found. Please go back to the list.
            </div>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/payroll")}
            >
              Back to Payroll List
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="content-wrapper">
      <section className="content-header">
        <div className="container-fluid">
          <div className="row mb-2">
            <div className="col-sm-12">
              <h5 className="mb-1">Add payment for payroll group</h5>
              <p className="text-primary mb-1">{payroll.payrollName}</p>
              <h4 className="text-muted mb-3">
                {getLocationName(payroll.location)}
              </h4>
            </div>
          </div>
        </div>
      </section>

      <section className="content">
        <div className="container-fluid">
          <div className="row">
            {/* COLUMN 1: Employee */}
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <h6 className="font-weight-bold mb-3">Employee</h6>
                  <div className="mb-3">
                    <select
                      className="form-control"
                      value={selectedEmployeeId ?? ""}
                      onChange={handleEmployeeChange}
                    >
                      {employees.map((e) => (
                        <option
                          key={e.payrollEmployeeId}
                          value={e.payrollEmployeeId}
                        >
                          {e.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedEmployee && (
                    <p className="font-weight-bold">{selectedEmployee.name}</p>
                  )}
                </div>
              </div>
            </div>

            {/* COLUMN 2: Gross Amount */}
            <div className="col-md-2">
              <div className="card">
                <div className="card-body">
                  {/* <h6 className="font-weight-bold mb-3">Gross Amount</h6> */}
                  {selectedEmployee && (
                    <p className="font-weight-bold">
                      Total: {formatCurrency(selectedEmployee.total)} <br />
                      Paid:{" "}
                      {formatCurrency(
                        selectedEmployee.transactions?.reduce(
                          (sum, t) => sum + Number(t.amount || 0),
                          0,
                        ) || 0,
                      )}{" "}
                      <br />
                      Due: {formatCurrency(getEmployeeDue(selectedEmployee))}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* COLUMN 3: Bank Details */}
            <div className="col-md-3">
              <div className="card">
                <div className="card-body">
                  <h6 className="font-weight-bold mb-3">Bank Details</h6>
                  {selectedEmployee && (
                    <div className="small">
                      <p className="mb-1">
                        <strong>Bank Name:</strong>{" "}
                        {selectedEmployee.bankName || ""}
                      </p>
                      <p className="mb-1">
                        <strong>Branch:</strong> {selectedEmployee.branch || ""}
                      </p>
                      <p className="mb-1">
                        <strong>Bank Identifier Code:</strong>{" "}
                        {selectedEmployee.bankCode || ""}
                      </p>
                      <p className="mb-1">
                        <strong>Account Holder's Name:</strong>{" "}
                        {selectedEmployee.accountHolderName || ""}
                      </p>
                      <p className="mb-1">
                        <strong>Bank Account No.:</strong>{" "}
                        {selectedEmployee.accountNumber || ""}
                      </p>
                      <p className="mb-0">
                        <strong>Tax Payer ID:</strong>{" "}
                        {selectedEmployee.taxId || ""}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* COLUMN 4: Payments & Add Payment */}
            <div className="col-md-4">
              <div className="card">
                <div className="card-body">
                  <h6 className="font-weight-bold mb-3">Add payment</h6>

                  {/* Amount */}
                  <div className="mb-3">
                    <label className="small font-weight-bold mb-1">
                      Amount:<span className="text-danger">*</span>
                    </label>
                    <div className="input-group input-group-sm">
                      <div className="input-group-prepend">
                        <span className="input-group-text">₹</span>
                      </div>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        name="amount"
                        value={formData.amount}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  {/* Paid On */}
                  <div className="mb-4">
                    <label className="small font-weight-bold mb-1">
                      Paid on:<span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      name="paidOn"
                      value={formData.paidOn}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <hr className="my-3" />
                  {/* Payment Account - Changed to Dropdown */}
                  <div className="mb-3">
                    <label className="small font-weight-bold mb-1">
                      Payment Account:
                    </label>
                    <select
                      className="form-control form-control-sm"
                      name="paymentAccount"
                      value={formData.paymentAccount}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Payment Account</option>
                      {paymentAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.accountName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Payment Note */}
                  <div className="mb-3">
                    <label className="small font-weight-bold mb-1">
                      Payment Note:
                    </label>
                    <div className="p-2 border rounded">
                      <textarea
                        className="form-control border-0 bg-transparent small"
                        rows="2"
                        name="paymentNote"
                        value={formData.paymentNote}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  {/* Payment Method */}

                  <div className="mb-3">
                    <label className="small font-weight-bold mb-1">
                      Payment Method:<span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-control form-control-sm"
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Payment Method</option>
                      {paymentMethods.map((method) => (
                        <option key={method.id} value={method.id}>
                          {method.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Button */}
                  <div className="text-right">
                    <button
                      className="btn btn-primary btn-sm mr-2"
                      onClick={() => navigate(`/payroll/${id}`)}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleSubmit}
                      disabled={getEmployeeDue(selectedEmployee) === 0}
                    >
                      Add Payment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AddPayment;
