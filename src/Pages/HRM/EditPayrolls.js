import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaMinus,
  FaPercent,
  FaInfoCircle,
  FaSave,
  FaArrowLeft,
} from "react-icons/fa";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const EditPayrolls = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState("");
  const [businessLocations, setBusinessLocations] = useState([]);
  const [payrollData, setPayrollData] = useState({
    payroll_group_name: "",
    payroll_group_status: "",
    location_id: "",
    location_name: "",
    monthYear: "",
    payrolls: {},
    status: "", // draft or final
    paymentStatus: "", // due or paid
  });

  useEffect(() => {
    const email = sessionStorage.getItem("userEmail");
    if (email) {
      fetch(`${process.env.REACT_APP_BASE_URL}/user/username?email=${email}`)
        .then((response) => response.json())
        .then((data) => setUserName(data))
        .catch((error) => console.error("Error fetching username:", error));
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchPayrollDetails();
      fetchBusinessLocations();
    }
  }, [id]);
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
  const fetchPayrollDetails = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/payroll/full/${id}`,
      );

      const payroll = response.data;

      // Format the monthYear for input[type="month"]
      const monthYear =
        payroll.month && payroll.year
          ? `${payroll.year}-${String(payroll.month).padStart(2, "0")}`
          : "";

      // Format payrolls data for the form
      const formattedPayrolls = {};

      if (payroll.employees && payroll.employees.length > 0) {
        payroll.employees.forEach((employee, index) => {
          // Parse earnings/allowances
          const allowances = employee.earnings?.map((earning) => ({
            name: earning.description || "",
            type:
              earning.amountType?.toLowerCase() === "percentage"
                ? "percent"
                : "fixed",
            percent:
              earning.amountType?.toLowerCase() === "percentage"
                ? String(earning.amount || "0.00")
                : "0.00",
            amount: String(earning.amount || "0"),
          })) || [
            { name: "", type: "fixed", percent: "0.00", amount: "0" },
            { name: "", type: "fixed", percent: "0.00", amount: "0" },
            { name: "", type: "fixed", percent: "0.00", amount: "0" },
          ];

          // Parse deductions
          const deductions = employee.deductions?.map((deduction) => ({
            name: deduction.description || "",
            type:
              deduction.amountType?.toLowerCase() === "percentage"
                ? "percent"
                : "fixed",
            percent:
              deduction.amountType?.toLowerCase() === "percentage"
                ? String(deduction.amount || "0.00")
                : "0.00",
            amount: String(deduction.amount || "0"),
          })) || [
            { name: "", type: "fixed", percent: "0.00", amount: "0" },
            { name: "", type: "fixed", percent: "0.00", amount: "0" },
            { name: "", type: "fixed", percent: "0.00", amount: "0" },
          ];

          formattedPayrolls[index] = {
            employeeId: employee.employeeId || employee.id,
            employeeName: employee.employeeName || employee.name,
            expense_for: employee.employeeId || employee.id,
            essentials_duration: String(employee.workDuration || "1"),
            essentials_duration_unit: employee.unit === 1 ? "Day" : "Month",
            essentials_amount_per_unit_duration: String(
              employee.amountPerUnit || "0",
            ),
            total: String(employee.basic || "0"),
            allowances: allowances,
            deductions: deductions,
            staff_note: employee.note || "",
          };
        });
      }

      setPayrollData({
        payroll_group_name: payroll.payrollName || "Payroll",
        payroll_group_status: payroll.status === 1 ? "final" : "draft",
        location_id: String(payroll.location || ""),
        location_name: payroll.locationName || "",
        monthYear: monthYear,
        payrolls: formattedPayrolls,
        status: payroll.status === 1 ? "final" : "draft",
        paymentStatus: payroll.paymentStatus === 1 ? "Paid" : "Due",
      });

      // If location_id is present but location_name is empty, fetch location name
      if (payroll.location && !payroll.locationName) {
        fetchLocationName(payroll.location);
      }
    } catch (error) {
      console.error("Error fetching payroll details:", error);
      toast.error("Failed to load payroll details");
      //setError("Failed to load payroll details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLocationName = async (locationId) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/business-locations/${locationId}`,
      );
      setPayrollData((prev) => ({
        ...prev,
        location_name: response.data.name || "",
      }));
    } catch (error) {
      console.error("Error fetching location name:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPayrollData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePayrollInputChange = (id, field, value) => {
    setPayrollData((prev) => ({
      ...prev,
      payrolls: {
        ...prev.payrolls,
        [id]: {
          ...prev.payrolls[id],
          [field]: value,
        },
      },
    }));
  };

  const handleAllowanceChange = (id, index, field, value) => {
    const updatedAllowances = [...payrollData.payrolls[id].allowances];
    updatedAllowances[index] = {
      ...updatedAllowances[index],
      [field]: value,
    };

    setPayrollData((prev) => ({
      ...prev,
      payrolls: {
        ...prev.payrolls,
        [id]: {
          ...prev.payrolls[id],
          allowances: updatedAllowances,
        },
      },
    }));
  };

  const handleDeductionChange = (id, index, field, value) => {
    const updatedDeductions = [...payrollData.payrolls[id].deductions];
    updatedDeductions[index] = {
      ...updatedDeductions[index],
      [field]: value,
    };

    setPayrollData((prev) => ({
      ...prev,
      payrolls: {
        ...prev.payrolls,
        [id]: {
          ...prev.payrolls[id],
          deductions: updatedDeductions,
        },
      },
    }));
  };

  const addAllowanceRow = (id) => {
    setPayrollData((prev) => ({
      ...prev,
      payrolls: {
        ...prev.payrolls,
        [id]: {
          ...prev.payrolls[id],
          allowances: [
            ...prev.payrolls[id].allowances,
            { name: "", type: "fixed", percent: "0.00", amount: "0" },
          ],
        },
      },
    }));
  };

  const addDeductionRow = (id) => {
    setPayrollData((prev) => ({
      ...prev,
      payrolls: {
        ...prev.payrolls,
        [id]: {
          ...prev.payrolls[id],
          deductions: [
            ...prev.payrolls[id].deductions,
            { name: "", type: "fixed", percent: "0.00", amount: "0" },
          ],
        },
      },
    }));
  };

  const removeRow = (id, type, index) => {
    if (type === "allowance") {
      const updatedAllowances = [...payrollData.payrolls[id].allowances];
      updatedAllowances.splice(index, 1);

      setPayrollData((prev) => ({
        ...prev,
        payrolls: {
          ...prev.payrolls,
          [id]: {
            ...prev.payrolls[id],
            allowances: updatedAllowances,
          },
        },
      }));
    } else {
      const updatedDeductions = [...payrollData.payrolls[id].deductions];
      updatedDeductions.splice(index, 1);

      setPayrollData((prev) => ({
        ...prev,
        payrolls: {
          ...prev.payrolls,
          [id]: {
            ...prev.payrolls[id],
            deductions: updatedDeductions,
          },
        },
      }));
    }
  };

  const calculateTotalAllowances = (id) => {
    if (!payrollData.payrolls[id]?.allowances) return 0;
    return payrollData.payrolls[id].allowances.reduce((total, allowance) => {
      return total + parseFloat(allowance.amount || 0);
    }, 0);
  };

  const calculateTotalDeductions = (id) => {
    if (!payrollData.payrolls[id]?.deductions) return 0;
    return payrollData.payrolls[id].deductions.reduce((total, deduction) => {
      return total + parseFloat(deduction.amount || 0);
    }, 0);
  };

  const calculateGrossAmount = (id) => {
    const basicSalary = parseFloat(payrollData.payrolls[id]?.total || 0);
    const totalAllowances = calculateTotalAllowances(id);
    const totalDeductions = calculateTotalDeductions(id);
    return (basicSalary + totalAllowances - totalDeductions).toFixed(2);
  };

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!payrollData.payroll_group_status) {
      toast.warning("Please select a payroll status");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const employeePayrolls = Object.entries(payrollData.payrolls).map(
        ([id, payroll]) => ({
          employeeId: payroll.employeeId,
          workDuration: Number(payroll.essentials_duration || 0),
          unit: 1,
          amountPerUnit: Number(
            payroll.essentials_amount_per_unit_duration || 0,
          ),
          basic: Number(payroll.total || 0),
          total: Number(calculateGrossAmount(id)),
          note: payroll.staff_note || "",
          earnings: payroll.allowances
            .filter((a) => a.name && Number(a.amount) > 0)
            .map((a) => ({
              description: a.name,
              amountType: a.type === "fixed" ? "Fixed" : "Percentage",
              amount: Number(a.amount),
            })),
          deductions: payroll.deductions
            .filter((d) => d.name && Number(d.amount) > 0)
            .map((d) => ({
              description: d.name,
              amountType: d.type === "fixed" ? "Fixed" : "Percentage",
              amount: Number(d.amount),
            })),
        }),
      );

      const formatMonthYearForBackend = (monthYear) => {
        if (!monthYear) return "";
        const [year, month] = monthYear.split("-");
        return `${month}/${year}`;
      };

      const payload = {
        payrollId: Number(id),
        payrollName: payrollData.payroll_group_name,
        location: String(payrollData.location_id),
        monthYear: formatMonthYearForBackend(payrollData.monthYear),
        status: payrollData.payroll_group_status === "final" ? 1 : 0,
        addedBy: userName,
        createdAt: new Date().toISOString(),
        employeePayrolls,
      };

      console.log("UPDATE PAYROLL PAYLOAD 👉", payload);

      await axios.post(
        `${process.env.REACT_APP_BASE_URL}/payroll/save`,
        payload,
      );

      toast.success("Payroll updated successfully!");
      navigate("/AllPayrolls", {
        state: { success: "Payroll updated successfully!" },
      });
    } catch (err) {
      console.error("Error updating payroll:", err);
      setError(
        err.response?.data?.message ||
          "Failed to update payroll. Please try again.",
      );
      toast.error("Failed to update payroll");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    navigate("/AllPayrolls");
  };

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <div className="content">
          <section className="content-header">
            <div className="container-fluid">
              <div className="row mb-2">
                <div className="col-sm-6">
                  <h1 className="all-heading">Edit Payroll</h1>
                  {/* <p className="text-muted">Payroll ID: {id}</p> */}
                </div>
                <div className="col-sm-6 text-right">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleBack}
                  >
                    <FaArrowLeft className="mr-2" />
                    Back to Payrolls
                  </button>
                </div>
              </div>
            </div>
          </section>
          <section className="content">
            <div className="container-fluid">
              <form onSubmit={handleSubmit}>
                <div className="card card-default rounded-4 border-0 cardHover">
                  <div className="card-header bg-primary text-white">
                    <h3 className="card-title">
                      Edit Payroll Details
                      {payrollData.status === "final" && (
                        <span className="badge bg-warning ml-2">Final</span>
                      )}
                      {payrollData.paymentStatus === "Paid" && (
                        <span className="badge bg-success ml-2">Paid</span>
                      )}
                    </h3>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-12">
                        <div className="box box-solid">
                          <div className="box-body">
                            <div className="row">
                              <div className="col-md-4">
                                <h3>
                                  Payroll for{" "}
                                  <strong>
                                    {payrollData.monthYear
                                      ? new Date(
                                          payrollData.monthYear + "-01",
                                        ).toLocaleString("default", {
                                          month: "long",
                                          year: "numeric",
                                        })
                                      : "Select Month/Year"}
                                  </strong>
                                </h3>
                                <small>
                                  <small>
                                    <b>Location</b>:{" "}
                                    {getLocationName(payrollData.location_id)}
                                  </small>
                                  <input
                                    name="location_id"
                                    type="hidden"
                                    value={payrollData.location_id}
                                  />
                                </small>
                              </div>
                              <div className="col-md-4">
                                <div className="form-group">
                                  <label htmlFor="payroll_group_name">
                                    Payroll group name:*
                                  </label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Payroll group name"
                                    required
                                    name="payroll_group_name"
                                    value={payrollData.payroll_group_name}
                                    onChange={handleInputChange}
                                    id="payroll_group_name"
                                  />
                                </div>
                              </div>
                              <div className="col-md-4">
                                <div className="form-group">
                                  <label htmlFor="payroll_group_status">
                                    Status:*
                                    <FaInfoCircle
                                      className="text-info ml-1"
                                      data-toggle="tooltip"
                                      title="If status is final then payment can be added otherwise not"
                                    />
                                  </label>
                                  <select
                                    className="form-control"
                                    required
                                    name="payroll_group_status"
                                    value={payrollData.payroll_group_status}
                                    onChange={handleInputChange}
                                    disabled={
                                      payrollData.paymentStatus === "Paid"
                                    }
                                  >
                                    <option value="">Please Select</option>
                                    <option value="draft">Draft</option>
                                    <option value="final">Final</option>
                                  </select>
                                  <small className="text-muted">
                                    {payrollData.paymentStatus === "Paid"
                                      ? "Cannot change status because payment is already made"
                                      : "Payroll cannot be deleted if status is final"}
                                  </small>
                                </div>
                              </div>
                            </div>
                            <div className="row mt-3">
                              <div className="col-md-6">
                                <div className="form-group">
                                  <label htmlFor="monthYear">
                                    Month/Year:*
                                  </label>
                                  <input
                                    type="month"
                                    className="form-control"
                                    name="monthYear"
                                    value={payrollData.monthYear}
                                    onChange={handleInputChange}
                                    required
                                  />
                                </div>
                              </div>
                            </div>
                            <br />
                            <br />
                            {Object.keys(payrollData.payrolls).length === 0 ? (
                              <div className="alert alert-warning text-center">
                                No employees found in this payroll.
                              </div>
                            ) : (
                              <table className="table" id="payroll_table">
                                <thead>
                                  <tr>
                                    <th>Employee</th>
                                    <th>Basic salary</th>
                                    <th>Earnings</th>
                                    <th>Deductions</th>
                                    <th>Gross Amount</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {Object.keys(payrollData.payrolls).map(
                                    (id) => {
                                      const payroll = payrollData.payrolls[id];
                                      return (
                                        <React.Fragment key={id}>
                                          <tr data-id={id}>
                                            <input
                                              type="hidden"
                                              name={`payrolls[${id}][expense_for]`}
                                              value={payroll.expense_for}
                                            />
                                            <td>
                                              {payroll.employeeName}
                                              <br />
                                              <br />
                                              <b>Leaves :</b> 0 days
                                              <br />
                                              <br />
                                              <b>Work Duration :</b> 0.00 hour
                                              <br />
                                              <br />
                                              <b>Attendance:</b> 0 Days
                                            </td>
                                            <td>
                                              <div className="form-group">
                                                <label
                                                  htmlFor={`essentials_duration_${id}`}
                                                >
                                                  Total work duration:*
                                                </label>
                                                <input
                                                  type="text"
                                                  className="form-control input_number essentials_duration"
                                                  placeholder="Total work duration"
                                                  required
                                                  data-id={id}
                                                  id={`essentials_duration_${id}`}
                                                  name={`payrolls[${id}][essentials_duration]`}
                                                  value={
                                                    payroll.essentials_duration
                                                  }
                                                  onChange={(e) =>
                                                    handlePayrollInputChange(
                                                      id,
                                                      "essentials_duration",
                                                      e.target.value,
                                                    )
                                                  }
                                                />
                                              </div>

                                              <div className="form-group">
                                                <label
                                                  htmlFor={`essentials_duration_unit_${id}`}
                                                >
                                                  Duration Unit:
                                                </label>
                                                <input
                                                  type="text"
                                                  className="form-control"
                                                  data-id={id}
                                                  id={`essentials_duration_unit_${id}`}
                                                  name={`payrolls[${id}][essentials_duration_unit]`}
                                                  value={
                                                    payroll.essentials_duration_unit
                                                  }
                                                  onChange={(e) =>
                                                    handlePayrollInputChange(
                                                      id,
                                                      "essentials_duration_unit",
                                                      e.target.value,
                                                    )
                                                  }
                                                />
                                              </div>

                                              <div className="form-group">
                                                <label
                                                  htmlFor={`essentials_amount_per_unit_duration_${id}`}
                                                >
                                                  Amount per unit duration:*
                                                </label>
                                                <input
                                                  type="text"
                                                  className="form-control input_number essentials_amount_per_unit_duration"
                                                  placeholder="Amount per unit duration"
                                                  required
                                                  data-id={id}
                                                  id={`essentials_amount_per_unit_duration_${id}`}
                                                  name={`payrolls[${id}][essentials_amount_per_unit_duration]`}
                                                  value={
                                                    payroll.essentials_amount_per_unit_duration
                                                  }
                                                  onChange={(e) =>
                                                    handlePayrollInputChange(
                                                      id,
                                                      "essentials_amount_per_unit_duration",
                                                      e.target.value,
                                                    )
                                                  }
                                                />
                                              </div>

                                              <div className="form-group">
                                                <label htmlFor={`total_${id}`}>
                                                  Total:
                                                </label>
                                                <input
                                                  type="text"
                                                  className="form-control input_number total"
                                                  placeholder="Total"
                                                  data-id={id}
                                                  id={`total_${id}`}
                                                  name={`payrolls[${id}][total]`}
                                                  value={payroll.total}
                                                  onChange={(e) =>
                                                    handlePayrollInputChange(
                                                      id,
                                                      "total",
                                                      e.target.value,
                                                    )
                                                  }
                                                />
                                              </div>
                                            </td>
                                            <td>
                                              <div className="mb-4 bg-white shadow-sm rounded-xl ring-1 hover:shadow-md ring-gray-200">
                                                <div className="p-2 sm:p-3">
                                                  <div className="border-gray-200">
                                                    <div className="py-2 align-middle sm:px-5">
                                                      <table
                                                        className="table table-condenced allowance_table"
                                                        id={`allowance_table_${id}`}
                                                        data-id={id}
                                                      >
                                                        <thead>
                                                          <tr>
                                                            <th className="col-md-5">
                                                              Description
                                                            </th>
                                                            <th className="col-md-3">
                                                              Amount Type
                                                            </th>
                                                            <th className="col-md-3">
                                                              Amount
                                                            </th>
                                                            <th className="col-md-1">
                                                              &nbsp;
                                                            </th>
                                                          </tr>
                                                        </thead>
                                                        <tbody>
                                                          {payroll.allowances.map(
                                                            (
                                                              allowance,
                                                              index,
                                                            ) => (
                                                              <tr key={index}>
                                                                <td>
                                                                  <input
                                                                    className="form-control input-sm"
                                                                    name={`payrolls[${id}][allowance_names][]`}
                                                                    value={
                                                                      allowance.name
                                                                    }
                                                                    onChange={(
                                                                      e,
                                                                    ) =>
                                                                      handleAllowanceChange(
                                                                        id,
                                                                        index,
                                                                        "name",
                                                                        e.target
                                                                          .value,
                                                                      )
                                                                    }
                                                                  />
                                                                </td>
                                                                <td>
                                                                  <select
                                                                    className="form-control input-sm amount_type"
                                                                    name={`payrolls[${id}][allowance_types][]`}
                                                                    value={
                                                                      allowance.type
                                                                    }
                                                                    onChange={(
                                                                      e,
                                                                    ) =>
                                                                      handleAllowanceChange(
                                                                        id,
                                                                        index,
                                                                        "type",
                                                                        e.target
                                                                          .value,
                                                                      )
                                                                    }
                                                                  >
                                                                    <option value="fixed">
                                                                      Fixed
                                                                    </option>
                                                                    <option value="percent">
                                                                      Percentage
                                                                    </option>
                                                                  </select>
                                                                  {allowance.type ===
                                                                    "percent" && (
                                                                    <div className="input-group percent_field">
                                                                      <input
                                                                        type="text"
                                                                        className="form-control input-sm input_number percent"
                                                                        name={`payrolls[${id}][allowance_percent][]`}
                                                                        value={
                                                                          allowance.percent
                                                                        }
                                                                        onChange={(
                                                                          e,
                                                                        ) =>
                                                                          handleAllowanceChange(
                                                                            id,
                                                                            index,
                                                                            "percent",
                                                                            e
                                                                              .target
                                                                              .value,
                                                                          )
                                                                        }
                                                                      />
                                                                      <span className="input-group-addon">
                                                                        <FaPercent />
                                                                      </span>
                                                                    </div>
                                                                  )}
                                                                </td>
                                                                <td>
                                                                  <input
                                                                    className="form-control input-sm value_field input_number allowance"
                                                                    name={`payrolls[${id}][allowance_amounts][]`}
                                                                    value={
                                                                      allowance.amount
                                                                    }
                                                                    onChange={(
                                                                      e,
                                                                    ) =>
                                                                      handleAllowanceChange(
                                                                        id,
                                                                        index,
                                                                        "amount",
                                                                        e.target
                                                                          .value,
                                                                      )
                                                                    }
                                                                  />
                                                                </td>
                                                                <td>
                                                                  {index ===
                                                                  0 ? (
                                                                    <button
                                                                      type="button"
                                                                      className="btn btn-outline-primary btn-xs add_allowance"
                                                                      onClick={() =>
                                                                        addAllowanceRow(
                                                                          id,
                                                                        )
                                                                      }
                                                                    >
                                                                      <FaPlus />
                                                                    </button>
                                                                  ) : (
                                                                    <button
                                                                      type="button"
                                                                      className="btn btn-outline-danger btn-xs remove_tr"
                                                                      onClick={() =>
                                                                        removeRow(
                                                                          id,
                                                                          "allowance",
                                                                          index,
                                                                        )
                                                                      }
                                                                    >
                                                                      <FaMinus />
                                                                    </button>
                                                                  )}
                                                                </td>
                                                              </tr>
                                                            ),
                                                          )}
                                                        </tbody>
                                                        <tfoot>
                                                          <tr>
                                                            <th colSpan="2">
                                                              Total
                                                            </th>
                                                            <td>
                                                              <span
                                                                id={`total_allowances_${id}`}
                                                                data-currency_symbol="true"
                                                              >
                                                                {formatCurrency(
                                                                  calculateTotalAllowances(
                                                                    id,
                                                                  ),
                                                                )}
                                                              </span>
                                                            </td>
                                                            <td>&nbsp;</td>
                                                          </tr>
                                                        </tfoot>
                                                      </table>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </td>
                                            <td>
                                              <div className="mb-4 bg-white shadow-sm rounded-xl ring-1 hover:shadow-md ring-gray-200">
                                                <div className="p-2 sm:p-3">
                                                  <div className="border-gray-200">
                                                    <div className="py-2 align-middle sm:px-5">
                                                      <table
                                                        className="table table-condenced deductions_table"
                                                        id={`deductions_table_${id}`}
                                                        data-id={id}
                                                      >
                                                        <thead>
                                                          <tr>
                                                            <th className="col-md-5">
                                                              Description
                                                            </th>
                                                            <th className="col-md-3">
                                                              Amount Type
                                                            </th>
                                                            <th className="col-md-3">
                                                              Amount
                                                            </th>
                                                            <th className="col-md-1">
                                                              &nbsp;
                                                            </th>
                                                          </tr>
                                                        </thead>
                                                        <tbody>
                                                          {payroll.deductions.map(
                                                            (
                                                              deduction,
                                                              index,
                                                            ) => (
                                                              <tr key={index}>
                                                                <td>
                                                                  <input
                                                                    className="form-control input-sm"
                                                                    name={`payrolls[${id}][deduction_names][]`}
                                                                    value={
                                                                      deduction.name
                                                                    }
                                                                    onChange={(
                                                                      e,
                                                                    ) =>
                                                                      handleDeductionChange(
                                                                        id,
                                                                        index,
                                                                        "name",
                                                                        e.target
                                                                          .value,
                                                                      )
                                                                    }
                                                                  />
                                                                </td>
                                                                <td>
                                                                  <select
                                                                    className="form-control input-sm amount_type"
                                                                    name={`payrolls[${id}][deduction_types][]`}
                                                                    value={
                                                                      deduction.type
                                                                    }
                                                                    onChange={(
                                                                      e,
                                                                    ) =>
                                                                      handleDeductionChange(
                                                                        id,
                                                                        index,
                                                                        "type",
                                                                        e.target
                                                                          .value,
                                                                      )
                                                                    }
                                                                  >
                                                                    <option value="fixed">
                                                                      Fixed
                                                                    </option>
                                                                    <option value="percent">
                                                                      Percentage
                                                                    </option>
                                                                  </select>
                                                                  {deduction.type ===
                                                                    "percent" && (
                                                                    <div className="input-group percent_field">
                                                                      <input
                                                                        type="text"
                                                                        className="form-control input-sm input_number percent"
                                                                        name={`payrolls[${id}][deduction_percent][]`}
                                                                        value={
                                                                          deduction.percent
                                                                        }
                                                                        onChange={(
                                                                          e,
                                                                        ) =>
                                                                          handleDeductionChange(
                                                                            id,
                                                                            index,
                                                                            "percent",
                                                                            e
                                                                              .target
                                                                              .value,
                                                                          )
                                                                        }
                                                                      />
                                                                      <span className="input-group-addon">
                                                                        <FaPercent />
                                                                      </span>
                                                                    </div>
                                                                  )}
                                                                </td>
                                                                <td>
                                                                  <input
                                                                    className="form-control input-sm value_field input_number deduction"
                                                                    name={`payrolls[${id}][deduction_amounts][]`}
                                                                    value={
                                                                      deduction.amount
                                                                    }
                                                                    onChange={(
                                                                      e,
                                                                    ) =>
                                                                      handleDeductionChange(
                                                                        id,
                                                                        index,
                                                                        "amount",
                                                                        e.target
                                                                          .value,
                                                                      )
                                                                    }
                                                                  />
                                                                </td>
                                                                <td>
                                                                  {index ===
                                                                  0 ? (
                                                                    <button
                                                                      type="button"
                                                                      className="btn btn-outline-primary btn-xs add_deduction"
                                                                      onClick={() =>
                                                                        addDeductionRow(
                                                                          id,
                                                                        )
                                                                      }
                                                                    >
                                                                      <FaPlus />
                                                                    </button>
                                                                  ) : (
                                                                    <button
                                                                      type="button"
                                                                      className="btn btn-outline-danger btn-xs remove_tr"
                                                                      onClick={() =>
                                                                        removeRow(
                                                                          id,
                                                                          "deduction",
                                                                          index,
                                                                        )
                                                                      }
                                                                    >
                                                                      <FaMinus />
                                                                    </button>
                                                                  )}
                                                                </td>
                                                              </tr>
                                                            ),
                                                          )}
                                                        </tbody>
                                                        <tfoot>
                                                          <tr>
                                                            <th colSpan="2">
                                                              Total
                                                            </th>
                                                            <td>
                                                              <span
                                                                id={`total_deductions_${id}`}
                                                                data-currency_symbol="true"
                                                              >
                                                                {formatCurrency(
                                                                  calculateTotalDeductions(
                                                                    id,
                                                                  ),
                                                                )}
                                                              </span>
                                                            </td>
                                                            <td>&nbsp;</td>
                                                          </tr>
                                                        </tfoot>
                                                      </table>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </td>
                                            <td>
                                              <strong>
                                                <span
                                                  id={`gross_amount_text_${id}`}
                                                >
                                                  {formatCurrency(
                                                    calculateGrossAmount(id),
                                                  )}
                                                </span>
                                              </strong>
                                              <br />
                                              <input
                                                id={`gross_amount_${id}`}
                                                className="gross_amount"
                                                name={`payrolls[${id}][final_total]`}
                                                type="hidden"
                                                value={calculateGrossAmount(id)}
                                              />
                                            </td>
                                          </tr>
                                          <tr>
                                            <td colSpan="5">
                                              <div className="form-group">
                                                <label htmlFor={`note_${id}`}>
                                                  Note:
                                                </label>
                                                <textarea
                                                  className="form-control"
                                                  placeholder="Total"
                                                  id={`note_${id}`}
                                                  rows={3}
                                                  name={`payrolls[${id}][staff_note]`}
                                                  value={payroll.staff_note}
                                                  onChange={(e) =>
                                                    handlePayrollInputChange(
                                                      id,
                                                      "staff_note",
                                                      e.target.value,
                                                    )
                                                  }
                                                ></textarea>
                                              </div>
                                            </td>
                                          </tr>
                                        </React.Fragment>
                                      );
                                    },
                                  )}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="card-footer text-center">
                      {error && (
                        <div className="alert alert-danger mb-3">{error}</div>
                      )}

                      <div className="d-flex justify-content-center gap-3">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={handleBack}
                          disabled={isSaving}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={
                            isSaving || payrollData.paymentStatus === "Paid"
                          }
                        >
                          {isSaving ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm mr-2"
                                role="status"
                                aria-hidden="true"
                              ></span>
                              Updating...
                            </>
                          ) : (
                            <>
                              <FaSave className="mr-2" />
                              Update Payroll
                            </>
                          )}
                        </button>
                      </div>
                      {payrollData.paymentStatus === "Paid" && (
                        <div className="alert alert-warning mt-3">
                          <FaInfoCircle className="mr-2" />
                          This payroll has been paid. You cannot change the
                          status.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default EditPayrolls;
