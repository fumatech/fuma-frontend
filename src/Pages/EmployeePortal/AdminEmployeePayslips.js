import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import EmployeeMyPayslips from "./EmployeeMyPayslips";

const AdminEmployeePayslips = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${process.env.REACT_APP_BASE_URL}/user/getall`);
        const list = Array.isArray(res.data) ? res.data : [];
        setEmployees(list);
        if (list.length > 0) {
          setSelectedEmployeeId(String(list[0].id));
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const selectedEmployee = useMemo(
    () => employees.find((e) => String(e.id) === String(selectedEmployeeId)) || null,
    [employees, selectedEmployeeId]
  );

  const employeeLabel = (emp) => {
    const fullName = `${emp.prefix ? `${emp.prefix} ` : ""}${emp.firstname || emp.firstName || ""} ${emp.lastname || emp.lastName || ""}`.trim();
    return fullName || emp.email || emp.username || `Employee #${emp.id}`;
  };

  const content = (
    <div>
      <div className="card card-primary card-outline mb-3">
        <div className="card-body">
          <div className="row align-items-end">
            <div className="col-md-6">
              <label>Select Employee</label>
              <select
                className="form-control"
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                disabled={loading || employees.length === 0}
              >
                {employees.length === 0 ? (
                  <option value="">No employees found</option>
                ) : (
                  employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {employeeLabel(emp)} (ID: {emp.id})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>
      </div>

      {!loading && selectedEmployee ? (
        <EmployeeMyPayslips
          employee={selectedEmployee}
          title="Employee Payslips"
          viewPath="/EmployeeViewPayslipAdmin"
        />
      ) : (
        <div className="card">
          <div className="card-body text-center text-muted py-4">
            {loading ? "Loading employees..." : "Select an employee to view payslips."}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="content-wrapper">
      <section className="content">
        <div className="container-fluid pt-3">{content}</div>
      </section>
    </div>
  );
};

export default AdminEmployeePayslips;
