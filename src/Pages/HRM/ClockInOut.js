import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const ClockInOut = ({ employeeId, onClose }) => {
  const [ipAddress, setIpAddress] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [clockedIn, setClockedIn] = useState(false);
  const [attendanceId, setAttendanceId] = useState(null);

  // Fetch IP & check clock status
  useEffect(() => {
    axios
      .get("https://api.ipify.org?format=json")
      .then((res) => setIpAddress(res.data.ip))
      .catch(() => setIpAddress("Unavailable"));

    checkClockStatus();
  }, []);

  const checkClockStatus = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/attendance/current-status/${employeeId}`
      );
      if (res.data.clockedIn) {
        setClockedIn(true);
        setAttendanceId(res.data.attendanceId);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleClockIn = async () => {
    // if (!note.trim()) {
    //   toast.warning("Please enter clock-in note");
    //   return;
    // }
    // try {
    //   setLoading(true);
    //   const res = await axios.post(
    //     `${process.env.REACT_APP_BASE_URL}/attendance/clock-in`,
    //     {
    //       employeeId,
    //       ipAddress,
    //       inNote: note,
    //     }
    //   );
    //   setClockedIn(true);
    //   setAttendanceId(res.data.id);
    //   toast.success("Clock In successful");
    // } catch (err) {
    //   toast.error("Clock In failed");
    // } finally {
    //   setLoading(false);
    // }
  };

  const handleClockOut = async () => {
    // try {
    //   setLoading(true);
    //   await axios.post(
    //     `${process.env.REACT_APP_BASE_URL}/attendance/clock-out/${attendanceId}`,
    //     {
    //       note,
    //     }
    //   );
    //   setClockedIn(false);
    //   setAttendanceId(null);
    //   setNote("");
    //   toast.success("Clock Out successful");
    //   onClose();
    // } catch (err) {
    //   toast.error("Clock Out failed");
    // } finally {
    //   setLoading(false);
    // }
  };

  return (
    <div className="row">
      <div className="col-12">
        <div className="form-group">
          <label>IP Address</label>
          <input
            type="text"
            className="form-control"
            value={ipAddress}
            disabled
          />
        </div>

        {!clockedIn && (
          <div className="form-group">
            <label>Note</label>
            <textarea
              className="form-control"
              rows="4"
              placeholder="Enter note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        )}

        <div className="d-flex justify-content-end mt-3">
          {!clockedIn ? (
            <button
              className="btn btn-success mr-2"
              onClick={handleClockIn}
              disabled={loading}
            >
              {loading ? "Submitting..." : "Clock In"}
            </button>
          ) : (
            <button
              className="btn btn-danger mr-2"
              onClick={handleClockOut}
              disabled={loading}
            >
              {loading ? "Submitting..." : "Clock Out"}
            </button>
          )}
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClockInOut;
