import React, { useState, useEffect } from "react";
import moment from "moment";
import "react-datepicker/dist/react-datepicker.css";
import $ from "jquery";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../assets/plugins/fontawesome-free/css/all.min.css";
import "../../assets/dist/css/adminlte.min.css";
import "bootstrap-daterangepicker";
import "bootstrap-daterangepicker/daterangepicker.css";
import { toast } from "react-toastify";

const AttendanceDate = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [userData, setUserData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(moment().startOf("month")); // Default to month start
  const [endDate, setEndDate] = useState(moment().endOf("month")); // Default to month end
  const [selectedRange, setSelectedRange] = useState("This Month");
  const [summaryData, setSummaryData] = useState(null);
  const [dateDetails, setDateDetails] = useState(null);

  // Fetch data from APIs
  const fetchData = async () => {
    try {
      setLoading(true);
      const [attendanceRes, usersRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_BASE_URL}/attendance/getall`),
        fetch(`${process.env.REACT_APP_BASE_URL}/user/getall`),
      ]);

      const attendance = await attendanceRes.json();
      const users = await usersRes.json();

      setAttendanceData(attendance);
      setUserData(users);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!loading) {
      initializeDateRangePicker();
      processAttendanceSummary();
    }
  }, [loading]);

  const initializeDateRangePicker = () => {
    $("#daterange-btn").daterangepicker(
      {
        ranges: {
          Today: [moment(), moment()],
          Yesterday: [
            moment().subtract(1, "days"),
            moment().subtract(1, "days"),
          ],
          "Last 7 Days": [moment().subtract(6, "days"), moment()],
          "Last 30 Days": [moment().subtract(29, "days"), moment()],
          "This Month": [moment().startOf("month"), moment().endOf("month")],
          "Last Month": [
            moment().subtract(1, "month").startOf("month"),
            moment().subtract(1, "month").endOf("month"),
          ],
          "This Year": [moment().startOf("year"), moment().endOf("year")],
        },
        startDate: startDate,
        endDate: endDate,
        opens: "right",
        locale: {
          format: "MMM D, YYYY",
          applyLabel: "Apply",
          cancelLabel: "Cancel",
          fromLabel: "From",
          toLabel: "To",
          customRangeLabel: "Custom",
          daysOfWeek: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
          monthNames: [
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
          ],
          firstDay: 1,
        },
      },
      function (start, end, label) {
        setStartDate(start);
        setEndDate(end);
        setSelectedRange(label || "Custom Range");
        processAttendanceSummary(start, end, label);
      }
    );
  };

  // Process attendance summary for the selected range
  const processAttendanceSummary = (
    start = startDate,
    end = endDate,
    label = selectedRange
  ) => {
    const summary = {
      dateRange: label
        ? `${label} (${start.format("MMM D")} - ${end.format("MMM D")})`
        : `${start.format("MMM D, YYYY")} - ${end.format("MMM D, YYYY")}`,
      presentEmployees: new Set(),
      absentEmployees: new Set(userData.map((user) => user.id)),
      presentCount: 0,
      absentCount: 0,
      dailyRecords: [],
    };

    // Initialize daily records
    const currentDate = moment(start);
    while (currentDate.isSameOrBefore(end)) {
      const dateStr = currentDate.format("YYYY-MM-DD");
      summary.dailyRecords.push({
        date: dateStr,
        present: new Set(),
        absent: new Set(userData.map((user) => user.id)),
      });
      currentDate.add(1, "day");
    }

    // Process all attendance records within the date range
    attendanceData.forEach((attendance) => {
      attendance.inTime.forEach((inTime, index) => {
        const date = moment(inTime.split("T")[0]);
        const employeeId = attendance.employee[index];

        if (date.isBetween(start, end, null, "[]")) {
          summary.presentEmployees.add(employeeId);
          summary.absentEmployees.delete(employeeId);
          summary.presentCount++;

          // Update daily records
          const dailyRecord = summary.dailyRecords.find(
            (record) => record.date === date.format("YYYY-MM-DD")
          );
          if (dailyRecord) {
            dailyRecord.present.add(employeeId);
            dailyRecord.absent.delete(employeeId);
          }
        }
      });
    });

    // Calculate absent count
    summary.absentCount =
      userData.length * summary.dailyRecords.length - summary.presentCount;

    // Convert Sets to arrays with user details
    setSummaryData({
      ...summary,
      presentEmployees: Array.from(summary.presentEmployees)
        .map((id) => userData.find((user) => user.id === id))
        .filter((user) => user)
        .map((user) => ({
          id: user.id,
          name: `${user.firstname} ${user.lastname}`,
        })),
      absentEmployees: Array.from(summary.absentEmployees)
        .map((id) => userData.find((user) => user.id === id))
        .filter((user) => user)
        .map((user) => ({
          id: user.id,
          name: `${user.firstname} ${user.lastname}`,
        })),
    });
  };

  // Show details for a specific date
  const showDateDetails = (date) => {
    if (!summaryData) return;

    const dailyRecord = summaryData.dailyRecords.find(
      (record) => record.date === date
    );

    if (dailyRecord) {
      setDateDetails({
        date,
        present: Array.from(dailyRecord.present)
          .map((id) => userData.find((user) => user.id === id))
          .filter((user) => user)
          .map((user) => ({
            id: user.id,
            name: `${user.firstname} ${user.lastname}`,
          })),
        absent: Array.from(dailyRecord.absent)
          .map((id) => userData.find((user) => user.id === id))
          .filter((user) => user)
          .map((user) => ({
            id: user.id,
            name: `${user.firstname} ${user.lastname}`,
          })),
      });
    }
  };

  if (loading) {
    return <div className="text-center py-5">Loading attendance data...</div>;
  }

  return (
    <div className="content">
      <div className="container-fluid">
        <div className="card rounded-4 border-0">
          <div className="p-3">
            <div className="row mb-3">
              <div className="col-md-4">
                <div className="input-group">
                  <button
                    type="button"
                    className="btn btn-default"
                    id="daterange-btn"
                  >
                    <i className="fas fa-calendar mr-2"></i>
                    <span>{selectedRange}</span>
                    <i className="fas fa-caret-down ml-2"></i>
                  </button>
                </div>
              </div>
            </div>

            {summaryData && (
              <>
                <div className="table-responsive mb-4">
                  <table className="table table-bordered table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Date Range</th>
                        <th>Present</th>
                        <th>Absent</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{summaryData.dateRange}</td>
                        <td className="text-success">
                          {summaryData.presentEmployees.length} Employees
                          <br />
                          {summaryData.presentCount} Days
                        </td>
                        <td className="text-danger">
                          {summaryData.absentEmployees.length} Employees
                          <br />
                          {summaryData.absentCount} Days
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {dateDetails ? (
                  <div className="card">
                    <div className="card-header">
                      <h5>
                        Attendance Details for{" "}
                        {moment(dateDetails.date).format("MMM D, YYYY")}
                      </h5>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-6">
                          <div className="card mb-3">
                            <div className="card-header bg-success text-white">
                              Present Employees ({dateDetails.present.length})
                            </div>
                            <div className="card-body">
                              {dateDetails.present.length > 0 ? (
                                <ul className="list-group">
                                  {dateDetails.present.map((employee) => (
                                    <li
                                      key={employee.id}
                                      className="list-group-item"
                                    >
                                      {employee.name}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p>No employees were present on this date</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="card mb-3">
                            <div className="card-header bg-danger text-white">
                              Absent Employees ({dateDetails.absent.length})
                            </div>
                            <div className="card-body">
                              {dateDetails.absent.length > 0 ? (
                                <ul className="list-group">
                                  {dateDetails.absent.map((employee) => (
                                    <li
                                      key={employee.id}
                                      className="list-group-item"
                                    >
                                      {employee.name}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p>All employees were present on this date</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="card">
                    <div className="card-header">
                      <h5>Employee Attendance Summary</h5>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-6">
                          <div className="card mb-3">
                            <div className="card-header bg-success text-white">
                              Present Employees (
                              {summaryData.presentEmployees.length})
                            </div>
                            <div className="card-body">
                              {summaryData.presentEmployees.length > 0 ? (
                                <ul className="list-group">
                                  {summaryData.presentEmployees.map(
                                    (employee) => (
                                      <li
                                        key={employee.id}
                                        className="list-group-item"
                                      >
                                        {employee.name}
                                      </li>
                                    )
                                  )}
                                </ul>
                              ) : (
                                <p>No employees were present in this period</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="card mb-3">
                            <div className="card-header bg-danger text-white">
                              Absent Employees (
                              {summaryData.absentEmployees.length})
                            </div>
                            <div className="card-body">
                              {summaryData.absentEmployees.length > 0 ? (
                                <ul className="list-group">
                                  {summaryData.absentEmployees.map(
                                    (employee) => (
                                      <li
                                        key={employee.id}
                                        className="list-group-item"
                                      >
                                        {employee.name}
                                      </li>
                                    )
                                  )}
                                </ul>
                              ) : (
                                <p>All employees were present in this period</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceDate;
