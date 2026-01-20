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
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [paymentAccounts, setPaymentAccounts] = useState([]);
  const [businessLocations, setBusinessLocations] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  const [formData, setFormData] = useState({
    amount: "",
    paidOn: new Date()
      .toLocaleString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      .replace(",", ""),
    paymentAccount: "",
    paymentNote: "",
    paymentMethod: "",
    employeeId: "",
  });

  useEffect(() => {
    if (id) {
      fetchPayrollDetails(id);
      fetchPaymentAccounts();
      fetchPaymentMathods();
      fetchUsers();
      fetchBusinessLocations();
    }
  }, [id]);
  const fetchUsers = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/user/getall`
      );
      setUsers(res.data || []);
    } catch (err) {
      toast.error("Failed to fetch users");
    }
  };

  useEffect(() => {
    // Check if employee ID is passed via state
    if (location.state?.employeeId) {
      const employee = employees.find(
        (emp) => emp.id === location.state.employeeId
      );
      if (employee) {
        setSelectedEmployee(employee);
        setFormData((prev) => ({
          ...prev,
          employeeId: employee.id,
          amount: employee.total || "",
        }));
      }
    }
  }, [employees, location]);
  const fetchBusinessLocations = async () => {
    try {
      const res = await axios.get(
        "https://fusionmastertech.com:8443/business-locations/getall"
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
      (loc) => Number(loc.id) === Number(locationId)
    );

    return location ? location.name : "Unknown location";
  };

  const fetchPayrollDetails = async (payrollId) => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/payroll/full/${payrollId}`
      );

      const payrollData = res.data;
      const employeesList =
        payrollData.employees?.map((emp) => {
          const user = users.find((u) => u.id === emp.employeeId);

          return {
            ...emp,
            id: emp.employeeId, // important for dropdown
            name: user
              ? `${user.firstname} ${user.lastname}`
              : `Employee ${emp.employeeId}`,
            bankName: user?.bankName || "",
            branch: user?.branch || "",
            bankCode: user?.ifsc || "",
            accountHolderName: user?.accountHolderName || "",
            accountNumber: user?.accountNumber || "",
            taxId: user?.taxPayerId || "",
          };
        }) || [];

      setPayroll({
        id: payrollData.id,
        name: payrollData.payrollName,
        month: payrollData.month,
        year: payrollData.year,
        status: payrollData.status === 1 ? "Final" : "Draft",
        location: payrollData.location || "All locations",
        employees: employeesList,
      });

      setEmployees(employeesList);

      // If no employee ID is provided, select the first employee
      if (!location.state?.employeeId && employeesList.length > 0) {
        setSelectedEmployee(employeesList[0]);
        setFormData((prev) => ({
          ...prev,
          employeeId: employeesList[0].id,
          amount: employeesList[0].total || "",
        }));
      }

      setLoading(false);
    } catch (error) {
      toast.error("Failed to fetch payroll details");
      console.error(error);
      setLoading(false);
    }
  };

  const fetchPaymentAccounts = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/payment-account/getall`
      );
      setPaymentAccounts(res.data || []);
    } catch (error) {
      console.error("Failed to fetch payment accounts:", error);
      // Set default payment accounts if API fails
      setPaymentAccounts([
        { id: 1, name: "None" },
        { id: 2, name: "Cash Account" },
        { id: 3, name: "Bank Account" },
      ]);
    }
  };
  const fetchPaymentMathods = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/payment-method/getall`
      );
      setPaymentMethods(res.data || []);
    } catch (error) {
      console.error("Failed to fetch payment methods:", error);
      // Set default payment methods if API fails
      setPaymentMethods([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEmployeeChange = (e) => {
    const employeeId = e.target.value;
    const employee = employees.find((emp) => emp.id === parseInt(employeeId));

    setSelectedEmployee(employee);
    setFormData((prev) => ({
      ...prev,
      employeeId: employeeId,
      amount: employee ? employee.total || "" : "",
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.amount || !formData.paidOn || !formData.paymentMethod) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const paymentData = {
        payrollId: id,
        employeeId: formData.employeeId,
        amount: parseFloat(formData.amount),
        paidOn: formData.paidOn,
        paymentAccount: formData.paymentAccount,
        paymentNote: formData.paymentNote,
        paymentMethod: formData.paymentMethod,
        status: "Paid",
      };

      // API call to add payment
      await axios.post(
        `${process.env.REACT_APP_BASE_URL}/payroll/add-payment`,
        paymentData
      );

      toast.success("Payment added successfully!");
      navigate(`/payroll/${id}`);
    } catch (error) {
      toast.error("Failed to add payment");
      console.error(error);
    }
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
              <p className="text-primary mb-1">({payroll.name})</p>
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
                      className="form-control form-control-sm"
                      value={formData.employeeId}
                      onChange={handleEmployeeChange}
                    >
                      <option value="">Select Employee</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name}
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
                  <h6 className="font-weight-bold mb-3">Gross Amount</h6>
                  {selectedEmployee && (
                    <p className="font-weight-bold">
                      {formatCurrency(selectedEmployee.total)}
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
                  <h6 className="font-weight-bold mb-3">Payments</h6>

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
                      type="text"
                      className="form-control form-control-sm"
                      name="paidOn"
                      value={formData.paidOn}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <hr className="my-3" />

                  <h6 className="font-weight-bold mb-3">Add payment</h6>

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
