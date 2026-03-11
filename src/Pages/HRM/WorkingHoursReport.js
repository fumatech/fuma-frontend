import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const WorkingHoursReport = () => {
    const navigate = useNavigate();
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [summaries, setSummaries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState({});
    const [generatingPayroll, setGeneratingPayroll] = useState(null);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
    const [generatingForEmployee, setGeneratingForEmployee] = useState(null);
    const [payrollMap, setPayrollMap] = useState({});

    useEffect(() => {
        fetchEmployees();
    }, []);

    useEffect(() => {
        fetchSummaries();
        fetchPayrollData();
    }, [month, year]);

    const fetchEmployees = async () => {
        try {
            const res = await axios.get(
                `${process.env.REACT_APP_BASE_URL}/user/getall`
            );
            const empMap = {};
            (res.data || []).forEach((e) => {
                empMap[e.id] = e;
            });
            setEmployees(empMap);
        } catch (err) {
            console.error("Error fetching employees:", err);
        }
    };

    const fetchSummaries = async () => {
        setLoading(true);
        try {
            const res = await axios.get(
                `${process.env.REACT_APP_BASE_URL}/attendance/working-summary-all/${month}/${year}`
            );
            setSummaries(res.data || []);
        } catch (err) {
            console.error("Error fetching summaries:", err);
            setSummaries([]);
        }
        setLoading(false);
    };

    const fetchPayrollData = async () => {
        try {
            const res = await axios.get(
                `${process.env.REACT_APP_BASE_URL}/payroll/employee-wise/${month}/${year}`
            );
            const map = {};
            (res.data || []).forEach((p) => {
                const existing = map[p.employeeId];
                if (!existing || p.payrollId > existing.payrollId) {
                    map[p.employeeId] = p;
                }
            });
            setPayrollMap(map);
        } catch (err) {
            console.error("Error fetching payroll data:", err);
        }
    };

    const getPaymentStatus = (employeeId) => {
        const payroll = payrollMap[employeeId];
        if (!payroll) return { label: "Not Generated", class: "badge-secondary" };
        const netPay = (payroll.total || 0);
        const totalPaid = (payroll.transactions || []).reduce(
            (sum, t) => sum + (t.amount || 0), 0
        );
        if (totalPaid >= netPay && netPay > 0) return { label: "Paid", class: "badge-success" };
        if (totalPaid > 0) return { label: "Partial", class: "badge-info" };
        return { label: "Due", class: "badge-warning" };
    };

    const generatePayroll = async (employeeTypeFilter) => {
        const typeLabel = employeeTypeFilter === "FULL_TIME" ? "Full-Time" : "Freelancer/Hourly";
        if (!window.confirm(`Generate payroll for ${typeLabel} employees for ${getMonthName(month)} ${year}?`)) return;

        setGeneratingPayroll(employeeTypeFilter);
        try {
            const userEmail = localStorage.getItem("email") || "admin";
            const res = await axios.post(
                `${process.env.REACT_APP_BASE_URL}/payroll/generate-from-attendance`,
                {
                    month,
                    year,
                    addedBy: userEmail,
                    location: "1",
                    employeeTypeFilter,
                }
            );
            toast.success(`${typeLabel} payroll generated successfully`);

            // Navigate to payslip view with the first employee's payroll
            if (res.data?.employees?.length > 0) {
                const payrollId = res.data.id;
                const empPayrolls = await axios.get(
                    `${process.env.REACT_APP_BASE_URL}/payroll/employee-wise/${month}/${year}`
                );
                const matching = empPayrolls.data.find(
                    (p) => p.payrollId === payrollId
                );
                if (matching) {
                    const emp = employees[matching.employeeId];
                    navigate("/payroll/view", {
                        state: { payroll: matching, employee: emp },
                    });
                }
            }
        } catch (err) {
            const errorMsg =
                err.response?.data?.message || err.message || "Failed to generate payroll";
            toast.error(errorMsg);
        }
        setGeneratingPayroll(null);
    };

    const generatePayrollForEmployee = async (employeeId) => {
        const empName = getEmployeeName(employeeId);
        if (!window.confirm(`Generate payroll for ${empName} for ${getMonthName(month)} ${year}?`)) return;

        setGeneratingForEmployee(employeeId);
        try {
            const userEmail = localStorage.getItem("email") || "admin";
            const res = await axios.post(
                `${process.env.REACT_APP_BASE_URL}/payroll/generate-for-employee`,
                {
                    month,
                    year,
                    addedBy: userEmail,
                    location: "1",
                    employeeId,
                }
            );
            toast.success(`Payroll generated for ${empName}`);

            // Refresh payroll data and navigate to payslip view
            await fetchPayrollData();
            const empPayrolls = await axios.get(
                `${process.env.REACT_APP_BASE_URL}/payroll/employee-wise/${month}/${year}`
            );
            const matching = empPayrolls.data
                .filter(
                    (p) =>
                        p.employeeId === employeeId &&
                        p.month === month &&
                        p.year === year
                )
                .sort((a, b) => b.payrollId - a.payrollId)[0];
            if (matching) {
                const emp = employees[employeeId];
                navigate("/payroll/view", {
                    state: { payroll: matching, employee: emp },
                });
            }
        } catch (err) {
            const errorMsg =
                err.response?.data?.message || err.message || "Failed to generate payroll";
            toast.error(errorMsg);
        }
        setGeneratingForEmployee(null);
    };

    const getMonthName = (m) => {
        const months = [
            "", "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December",
        ];
        return months[m] || "";
    };

    const getEmployeeName = (empId) => {
        const emp = employees[empId];
        return emp ? `${emp.firstname} ${emp.lastname}` : `Employee #${empId}`;
    };

    const getEmployeeType = (summary) => {
        const type = summary.employeeType;
        if (type === "HOURLY") return { label: "Hourly", class: "badge-info" };
        if (type === "FREELANCER") return { label: "Freelancer", class: "badge-warning" };
        return { label: "Full-Time", class: "badge-primary" };
    };

    const filteredSummaries = selectedEmployeeId
        ? summaries.filter((s) => String(s.employeeId) === String(selectedEmployeeId))
        : summaries;

    const totalPayable = filteredSummaries.reduce(
        (acc, s) => acc + (s.calculatedPay || 0),
        0
    );

    const fullTimeSummaries = filteredSummaries.filter(
        (s) => !s.employeeType || s.employeeType === "FULL_TIME"
    );
    const hourlyFreelancerSummaries = filteredSummaries.filter(
        (s) => s.employeeType === "HOURLY" || s.employeeType === "FREELANCER"
    );

    const fullTimePayable = fullTimeSummaries.reduce((a, s) => a + (s.calculatedPay || 0), 0);
    const hourlyPayable = hourlyFreelancerSummaries.reduce((a, s) => a + (s.calculatedPay || 0), 0);

    const renderTable = (data, title, icon, badgeColor, subtotal, typeFilter) => {
        if (data.length === 0) return null;
        return (
            <div className="card mb-4">
                <div className="card-header d-flex justify-content-between align-items-center">
                    <h3 className="card-title mb-0">
                        <i className={`fas ${icon} mr-2`}></i>
                        {title}
                        <span className={`badge ${badgeColor} ml-2`}>{data.length}</span>
                    </h3>
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-striped table-hover mb-0">
                            <thead className="thead-dark">
                                <tr>
                                    <th>#</th>
                                    <th>Employee</th>
                                    <th>Type</th>
                                    <th>Present Days</th>
                                    <th>Absent Days</th>
                                    <th>Half Days</th>
                                    <th>Total Hours</th>
                                    <th>Rate / Salary</th>
                                    <th>Calculated Pay</th>
                                    <th>Salary Paid</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((s, idx) => {
                                    const empType = getEmployeeType(s);
                                    return (
                                        <tr key={s.employeeId}>
                                            <td>{idx + 1}</td>
                                            <td>
                                                <strong>
                                                    {s.employeeName || getEmployeeName(s.employeeId)}
                                                </strong>
                                                <br />
                                                <small className="text-muted">
                                                    ID: {s.employeeId}
                                                </small>
                                            </td>
                                            <td>
                                                <span className={`badge ${empType.class}`}>
                                                    {empType.label}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="text-success font-weight-bold">
                                                    {s.presentDays || 0}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="text-danger font-weight-bold">
                                                    {s.absentDays || 0}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="text-warning font-weight-bold">
                                                    {s.halfDays || 0}
                                                </span>
                                            </td>
                                            <td>
                                                <strong>{s.totalWorkingHours || 0}h</strong>
                                            </td>
                                            <td>
                                                {empType.label === "Full-Time"
                                                    ? `₹${s.basicSalary || 0}/month`
                                                    : `₹${s.hourlyRate || 0}/hour`}
                                            </td>
                                            <td>
                                                <strong className="text-primary">
                                                    ₹{(s.calculatedPay || 0).toFixed(2)}
                                                </strong>
                                            </td>
                                            <td>
                                                {(() => {
                                                    const status = getPaymentStatus(s.employeeId);
                                                    return <span className={`badge ${status.class}`}>{status.label}</span>;
                                                })()}
                                            </td>
                                            <td>
                                                <div className="d-flex">
                                                    {payrollMap[s.employeeId] && (
                                                        <button
                                                            className="btn btn-sm btn-outline-info mr-1"
                                                            onClick={() => {
                                                                const emp = employees[s.employeeId];
                                                                navigate("/payroll/view", {
                                                                    state: { payroll: payrollMap[s.employeeId], employee: emp },
                                                                });
                                                            }}
                                                        >
                                                            <i className="fas fa-eye mr-1"></i>View
                                                        </button>
                                                    )}
                                                    <button
                                                        className="btn btn-sm btn-outline-success"
                                                        onClick={() => generatePayrollForEmployee(s.employeeId)}
                                                        disabled={generatingForEmployee !== null}
                                                    >
                                                        {generatingForEmployee === s.employeeId ? (
                                                            <><i className="fas fa-spinner fa-spin mr-1"></i>...</>
                                                        ) : payrollMap[s.employeeId] ? (
                                                            <><i className="fas fa-sync-alt mr-1"></i>Regenerate</>
                                                        ) : (
                                                            <><i className="fas fa-file-invoice-dollar mr-1"></i>Payroll</>
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr className="font-weight-bold bg-light">
                                    <td colSpan="7" className="text-right">
                                        Subtotal:
                                    </td>
                                    <td>
                                        {data
                                            .reduce((a, s) => a + (s.totalWorkingHours || 0), 0)
                                            .toFixed(1)}
                                        h
                                    </td>
                                    <td>-</td>
                                    <td className="text-primary">₹{subtotal.toFixed(2)}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div>
            {/* Filters */}
            <div className="row mb-3">
                <div className="col-md-3">
                    <label>Month</label>
                    <select
                        className="form-control"
                        value={month}
                        onChange={(e) => setMonth(parseInt(e.target.value))}
                    >
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                                {getMonthName(i + 1)}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="col-md-3">
                    <label>Year</label>
                    <select
                        className="form-control"
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value))}
                    >
                        {Array.from({ length: 5 }, (_, i) => {
                            const y = new Date().getFullYear() - 2 + i;
                            return (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            );
                        })}
                    </select>
                </div>
                <div className="col-md-3">
                    <label>Employee</label>
                    <select
                        className="form-control"
                        value={selectedEmployeeId}
                        onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    >
                        <option value="">All Employees</option>
                        {summaries.map((s) => (
                            <option key={s.employeeId} value={s.employeeId}>
                                {s.employeeName || getEmployeeName(s.employeeId)}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="col-md-12 mt-2">
                    <button className="btn btn-primary" onClick={fetchSummaries}>
                        <i className="fas fa-search mr-1"></i> Refresh
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="row mb-3">
                <div className="col-md-3">
                    <div className="small-box bg-info">
                        <div className="inner">
                            <h3>{filteredSummaries.length}</h3>
                            <p>Total Employees</p>
                        </div>
                        <div className="icon">
                            <i className="fas fa-users"></i>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="small-box bg-success">
                        <div className="inner">
                            <h3>
                                {filteredSummaries
                                    .reduce((a, s) => a + (s.totalWorkingHours || 0), 0)
                                    .toFixed(1)}
                            </h3>
                            <p>Total Hours Worked</p>
                        </div>
                        <div className="icon">
                            <i className="fas fa-clock"></i>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="small-box bg-warning">
                        <div className="inner">
                            <h3>
                                {filteredSummaries.reduce((a, s) => a + (s.presentDays || 0), 0)}
                            </h3>
                            <p>Total Present Days</p>
                        </div>
                        <div className="icon">
                            <i className="fas fa-calendar-check"></i>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="small-box bg-primary">
                        <div className="inner">
                            <h3>{totalPayable.toFixed(2)}</h3>
                            <p>Total Payable</p>
                        </div>
                        <div className="icon">
                            <i className="fas fa-money-bill-wave"></i>
                        </div>
                    </div>
                </div>
            </div>

            {/* Separated Tables by Employee Type */}
            {loading ? (
                <div className="text-center p-5">
                    <i className="fas fa-spinner fa-spin fa-2x"></i>
                    <p className="mt-2">Loading...</p>
                </div>
            ) : filteredSummaries.length === 0 ? (
                <div className="card">
                    <div className="card-body text-center p-5 text-muted">
                        <i className="fas fa-inbox" style={{ fontSize: "2rem" }}></i>
                        <p className="mt-2">
                            No attendance data for {getMonthName(month)} {year}
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    {renderTable(
                        fullTimeSummaries,
                        "Full-Time Employees",
                        "fa-user-tie",
                        "badge-primary",
                        fullTimePayable,
                        "FULL_TIME"
                    )}
                    {renderTable(
                        hourlyFreelancerSummaries,
                        "Freelancer / Hourly Employees",
                        "fa-user-clock",
                        "badge-info",
                        hourlyPayable,
                        "HOURLY_FREELANCER"
                    )}

                    {/* Grand Total */}
                    <div className="card">
                        <div className="card-body d-flex justify-content-between align-items-center bg-light">
                            <h5 className="mb-0">
                                <i className="fas fa-calculator mr-2"></i>Grand Total
                            </h5>
                            <h4 className="mb-0 text-primary">₹{totalPayable.toFixed(2)}</h4>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default WorkingHoursReport;
