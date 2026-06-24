import React, { useEffect, useState } from "react";
import "../LoginPage/LoginPage.css";
import axios from "axios";
import { toast } from "react-toastify";
import FumaLogo from "../../assets/fuma-logo-lockup.svg";

const WarehouseLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedUsername = localStorage.getItem("warehouseUsername");
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      toast.warning("Please enter both username and password");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BASE_URL}/warehouse/login`,
        { username, password },
        { withCredentials: true }
      );

      const payload = response?.data;
      const loginSuccess =
        payload === "Login successful" ||
        payload?.success === true ||
        payload?.status === "success" ||
        !!payload?.warehouse;

      if (!loginSuccess) {
        throw new Error("Invalid warehouse credentials");
      }

      if (rememberMe) {
        localStorage.setItem("warehouseUsername", username);
      } else {
        localStorage.removeItem("warehouseUsername");
      }

      const warehouseInfo = payload?.warehouse || payload?.data || payload;
      sessionStorage.setItem(
        "warehouseAuth",
        JSON.stringify({
          id: warehouseInfo?.id || warehouseInfo?.warehouseId || null,
          name: warehouseInfo?.name || warehouseInfo?.warehouseName || "Warehouse",
          username,
          location: warehouseInfo?.location || "",
        })
      );

      toast.success("Warehouse login successful");
      setTimeout(() => {
        window.location.href = "/fumamain/warehouse/dashboard";
      }, 700);
    } catch (error) {
      const msg = error.response?.data?.message || error.message || "Login failed";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fuma-login-page">
      <div className="fuma-left-panel">
        <span className="flp-circle flp-circle--tl" />
        <span className="flp-circle flp-circle--br" />
        <span className="flp-circle flp-circle--mid" />

        <div className="flp-inner">
          <div className="flp-logo-wrap">
            <div className="flp-logo-glow" />
            <img src={FumaLogo} alt="FUMA" className="flp-logo-img" />
          </div>

          <div className="flp-divider-line" />

          <h1 className="flp-heading">
            Warehouse<br />
            <em>Operations Portal</em>
          </h1>
          <p className="flp-subtext">
            Secure access for warehouse-specific stock visibility and distribution tracking.
          </p>

          <ul className="flp-features">
            <li className="flp-feat-item"><span className="flp-dot" />View assigned products only</li>
            <li className="flp-feat-item"><span className="flp-dot" />Track warehouse allocations</li>
            <li className="flp-feat-item"><span className="flp-dot" />Isolated warehouse access</li>
            <li className="flp-feat-item"><span className="flp-dot" />Simple username/password login</li>
          </ul>
        </div>
      </div>

      <div className="fuma-right-panel">
        <div className="fuma-card">
          <div className="fc-header">
            <p className="fc-eyebrow">Warehouse Portal</p>
            <h2 className="fc-title">Welcome back</h2>
            <p className="fc-subtitle">Login to view your assigned stock</p>
            <div className="fc-divider" />
          </div>

          <form onSubmit={handleSubmit} className="fc-form" noValidate>
            <div className="fc-field">
              <label className="fc-label" htmlFor="warehouse-username">Username</label>
              <div className="fc-input-wrap">
                <i className="fa fa-user input-icon" />
                <input
                  id="warehouse-username"
                  type="text"
                  className="fc-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  placeholder="warehouse username"
                />
              </div>
            </div>

            <div className="fc-field">
              <label className="fc-label" htmlFor="warehouse-password">Password</label>
              <div className="fc-input-wrap">
                <i className="fa fa-lock input-icon" />
                <input
                  id="warehouse-password"
                  type={showPassword ? "text" : "password"}
                  className="fc-input fc-input--has-eye"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  className="fc-eye-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <i className={`fa ${showPassword ? "fa-eye-slash" : "fa-eye"}`} />
                </button>
              </div>
            </div>

            <div className="fc-row-options">
              <label className="fc-remember" htmlFor="warehouse-remember-toggle">
                <input
                  id="warehouse-remember-toggle"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="fc-toggle-track">
                  <span className="fc-toggle-thumb" />
                </span>
                <span className="fc-remember-label">Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              className={`fc-submit-btn${isLoading ? " fc-submit-btn--loading" : ""}`}
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WarehouseLogin;
