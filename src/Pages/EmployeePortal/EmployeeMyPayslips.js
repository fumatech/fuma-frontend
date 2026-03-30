import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

const EmployeeMyPayslips = ({ employee, title = "My Payslips", viewPath }) => {
    const [payrolls, setPayrolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const BASE_URL = process.env.REACT_APP_BASE_URL;
    const navigate = useNavigate();
    const location = useLocation();
    const isEmployeePortalRoute = /(^|\/)employee(\/|$)/.test(location.pathname);
    const isAdminPanel = !isEmployeePortalRoute;

    useEffect(() => {
        if (employee?.id) {
            fetchPayslips();
        }
    }, [employee]);

    const fetchPayslips = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/payroll/all-full`);
            const allPayrolls = res.data || [];

            // Filter payrolls that contain this employee
            const myPayrolls = allPayrolls
                .map((payroll) => {
                    const myEntry = (payroll.employees || []).find(
                        (pe) => pe.employeeId === employee.id || pe.employeeId === String(employee.id)
                    );
                    if (myEntry) {
                        return {
                            ...payroll,
                            myEntry,
                        };
                    }
                    return null;
                })
                .filter(Boolean);

            // Deduplicate: keep only the latest payroll per month/year
            const uniqueMap = new Map();
            myPayrolls.forEach((p) => {
                const key = `${p.month}-${p.year}`;
                const existing = uniqueMap.get(key);
                if (!existing || (p.id && (!existing.id || p.id > existing.id))) {
                    uniqueMap.set(key, p);
                }
            });

            setPayrolls(Array.from(uniqueMap.values()));
        } catch (err) {
            console.error("Error fetching payslips:", err);
            setPayrolls([]);
        }
        setLoading(false);
    };

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    ];

    const getStatusLabel = (status) => {
        switch (Number(status)) {
            case 0: return { text: "Draft", cls: "badge-secondary" };
            case 1: return { text: "Processed", cls: "badge-primary" };
            case 2: return { text: "Paid", cls: "badge-success" };
            default: return { text: "Unknown", cls: "badge-secondary" };
        }
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="sr-only">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">{title}</h3>
                </div>
                <div className="card-body table-responsive p-0">
                    <table className="table table-hover table-striped">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Payroll</th>
                                <th>Period</th>
                                <th>Basic</th>
                                <th>Total</th>
                                <th>Working Days</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payrolls.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center text-muted py-4">
                                        No payslips found.
                                    </td>
                                </tr>
                            ) : (
                                payrolls.map((payroll, idx) => {
                                    const status = getStatusLabel(payroll.status);
                                    const entry = payroll.myEntry;
                                    return (
                                        <tr key={payroll.id || idx}>
                                            <td>{idx + 1}</td>
                                            <td>{payroll.payrollName || "-"}</td>
                                            <td>
                                                {payroll.month && payroll.year
                                                    ? `${monthNames[payroll.month - 1]} ${payroll.year}`
                                                    : "-"}
                                            </td>
                                            <td>
                                                {entry?.basic != null
                                                    ? `₹${Number(entry.basic).toLocaleString()}`
                                                    : "-"}
                                            </td>
                                            <td>
                                                {entry?.total != null
                                                    ? `₹${Number(entry.total).toLocaleString()}`
                                                    : "-"}
                                            </td>
                                            <td>{entry?.attendance || "-"}</td>
                                            <td>
                                                <span className={`badge ${status.cls}`}>{status.text}</span>
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-sm btn-info"
                                                    onClick={() =>
                                                        navigate(
                                                            viewPath || (isAdminPanel ? "/MyViewPayslip" : "/employee/view-payslip"),
                                                            {
                                                                state: { payroll, employee, backPath: viewPath ? "/EmployeePayslipsAdmin" : undefined },
                                                            }
                                                        )
                                                    }
                                                >
                                                    <i className="fas fa-eye mr-1"></i>
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default EmployeeMyPayslips;
