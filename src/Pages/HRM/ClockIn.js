import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const ClockIn = ({ onClose }) => {
  const [ipAddress, setIpAddress] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch public IP
  useEffect(() => {
    axios
      .get("https://api.ipify.org?format=json")
      .then((res) => setIpAddress(res.data.ip))
      .catch(() => setIpAddress("Unavailable"));
  }, []);

  const handleClockIn = async () => {
    if (!note.trim()) {
      toast.warning("Please enter clock-in note");
      return;
    }

    const payload = {
      clockInTime: new Date().toISOString(),
      ipAddress,
      note,
    };

    try {
      setLoading(true);

      // await axios.post(`${process.env.REACT_APP_BASE_URL}/attendance/clock-in`, payload);

      console.log("Clock In:", payload);
      toast.success("Clock In successful");
      onClose();
    } catch (error) {
      toast.error("Clock In failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row">
      {/* ✅ FULL WIDTH */}
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

        <div className="form-group">
          <label>Clock In Note</label>
          <textarea
            className="form-control"
            rows="4"
            placeholder="Enter clock-in note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="d-flex justify-content-end mt-3">
          <button
            className="btn btn-success mr-2"
            onClick={handleClockIn}
            disabled={loading}
          >
            {loading ? "Submitting..." : "Clock In"}
          </button>

          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClockIn;
