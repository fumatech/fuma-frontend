import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

const AttendanceShift = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [userData, setUserData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [shiftDataList, setShiftDataList] = useState([]);

  const fetchShifts = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/shift/getall`
      );
      const data = await response.json();
      setShiftDataList(data); // save all shift info
    } catch (error) {
      console.error("Error fetching shifts:", error);
    }
  };

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
      await Promise.all([
        fetchAttendanceData(),
        fetchUserData(),
        fetchShifts(),
      ]);
      setLoading(false);
    };
    fetchData();
  }, [selectedDate]);

  const processShiftData = () => {
    const shiftsMap = {};

    // Step 1: Initialize shifts from attendance data
    attendanceData.forEach((attendance) => {
      const shiftId = attendance.shiftId;
      if (!shiftsMap[shiftId]) {
        shiftsMap[shiftId] = { present: [], absent: [] };
      }
    });

    // Step 2: Add present employees
    attendanceData.forEach((attendance) => {
      const shiftId = attendance.shiftId;
      const employee = userData.find((u) => u.id === attendance.employeeId);
      const attendanceDate = attendance.attendanceDate
        ? attendance.attendanceDate.split("T")[0]
        : new Date(attendance.inTime).toISOString().split("T")[0]; // fallback

      if (attendanceDate === selectedDate && employee) {
        shiftsMap[shiftId].present.push({
          id: employee.id,
          name: `${employee.firstname} ${employee.lastname}`,
          inTime: attendance.inTime,
          outTime: attendance.outTime,
        });
      }
    });

    // Step 3: Add absent employees
    Object.keys(shiftsMap).forEach((shiftId) => {
      const presentIds = shiftsMap[shiftId].present.map((e) => e.id);
      shiftsMap[shiftId].absent = userData
        .filter((user) => !presentIds.includes(user.id))
        .map((user) => ({
          id: user.id,
          name: `${user.firstname} ${user.lastname}`,
        }));
    });

    return shiftsMap;
  };

  const shiftData = processShiftData();

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
                <h4>
                  Shift :
                  {shiftDataList.find((s) => s.id === Number(shift))?.name ||
                    `Shift ${shift}`}{" "}
                </h4>

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
