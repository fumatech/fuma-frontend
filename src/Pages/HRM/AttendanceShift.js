import React, { useState, useEffect } from "react";

const AttendanceShift = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [userData, setUserData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Fetch attendance data
  const fetchAttendanceData = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/attendance/getall`
      );
      const data = await response.json();
      setAttendanceData(data);
    } catch (error) {
      console.error("Error fetching attendance data:", error);
    }
  };

  // Fetch user data
  const fetchUserData = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/user/getall`
      );
      const data = await response.json();
      setUserData(data);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchAttendanceData(), fetchUserData()]);
      setLoading(false);
    };
    fetchData();
  }, [selectedDate]);

  // Process data to get present/absent counts by shift
  const processShiftData = () => {
    const shiftsMap = {};

    // Initialize shifts
    attendanceData.forEach((attendance) => {
      attendance.shift.forEach((shift, index) => {
        if (!shiftsMap[shift]) {
          shiftsMap[shift] = {
            present: [],
            absent: [],
          };
        }
      });
    });

    // Process present employees (those with attendance records)
    attendanceData.forEach((attendance) => {
      attendance.shift.forEach((shift, index) => {
        const employeeId = attendance.employee[index];
        const user = userData.find((u) => u.id === employeeId);
        const attendanceDate = attendance.inTime[index]?.split("T")[0];

        if (attendanceDate === selectedDate) {
          if (user) {
            shiftsMap[shift].present.push({
              id: user.id,
              name: `${user.firstname} ${user.lastname}`,
              inTime: attendance.inTime[index],
              outTime: attendance.outTime[index],
            });
          }
        }
      });
    });

    // Process absent employees (all users not marked present for each shift)
    Object.keys(shiftsMap).forEach((shift) => {
      const presentEmployeeIds = shiftsMap[shift].present.map((e) => e.id);
      shiftsMap[shift].absent = userData
        .filter((user) => !presentEmployeeIds.includes(user.id))
        .map((user) => ({
          id: user.id,
          name: `${user.firstname} ${user.lastname}`,
        }));
    });

    return shiftsMap;
  };

  const shiftData = processShiftData();

  if (loading) return <div>Loading data...</div>;

  return (
    <div className="content">
      <div className="container-fluid">
        <div className="card rounded-4 border-0">
          <div className="p-3">
            <div className="mb-3">
              <label htmlFor="datePicker" className="form-label">
                Select Date:
              </label>
              <input
                type="date"
                id="datePicker"
                className="form-control"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            {Object.keys(shiftData).map((shift) => (
              <div key={shift} className="mb-4">
                <h4>{shift.charAt(0).toUpperCase() + shift.slice(1)} Shift</h4>

                <div className="row">
                  <div className="col-md-6">
                    <div className="card mb-3">
                      <div className="card-header bg-success text-white">
                        Present ({shiftData[shift].present.length})
                      </div>
                      <div className="card-body">
                        {shiftData[shift].present.length > 0 ? (
                          <table className="table table-sm">
                            <thead>
                              <tr>
                                <th>Employee</th>
                                <th>In Time</th>
                                <th>Out Time</th>
                              </tr>
                            </thead>
                            <tbody>
                              {shiftData[shift].present.map((employee) => (
                                <tr key={employee.id}>
                                  <td>{employee.name}</td>
                                  <td>
                                    {new Date(
                                      employee.inTime
                                    ).toLocaleTimeString()}
                                  </td>
                                  <td>
                                    {employee.outTime
                                      ? new Date(
                                          employee.outTime
                                        ).toLocaleTimeString()
                                      : "Not clocked out"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p>No employees present for this shift</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="card mb-3">
                      <div className="card-header bg-danger text-white">
                        Absent ({shiftData[shift].absent.length})
                      </div>
                      <div className="card-body">
                        {shiftData[shift].absent.length > 0 ? (
                          <table className="table table-sm">
                            <thead>
                              <tr>
                                <th>Employee</th>
                              </tr>
                            </thead>
                            <tbody>
                              {shiftData[shift].absent.map((employee) => (
                                <tr key={employee.id}>
                                  <td>{employee.name}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p>All employees present for this shift</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceShift;
