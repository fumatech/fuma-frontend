import React, { useState, useEffect } from "react";
import "../LoginPage/LoginPage.css";
import axios from "axios";
import { toast } from "react-toastify";
import FumaLogo from "../../assets/fuma-logo-lockup.svg";

/* ── Icon Components (same as LoginPage) ── */
const EyeOpenIcon = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <ellipse cx="9" cy="9" rx="8" ry="5" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="9" cy="9" r="2.2" stroke="currentColor" strokeWidth="1.4" />
    </svg>
);

const EyeClosedIcon = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M2 2l14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M7.5 4.2A8.3 8.3 0 019 4c4.4 0 8 5 8 5s-.9 1.4-2.4 2.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M4.7 6.3C3.3 7.5 1 9 1 9s3.6 5 8 5c1.2 0 2.3-.3 3.3-.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M10.5 10.8a2.2 2.2 0 01-3.3-2.9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
);

const EmailIcon = () => (
    <svg className="input-icon" viewBox="0 0 18 18" fill="none">
        <rect x="1.5" y="3.5" width="15" height="11" rx="2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M1.5 6l7.5 5 7.5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
);

const LockIcon = () => (
    <svg className="input-icon" viewBox="0 0 18 18" fill="none">
        <rect x="3" y="8" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M6 8V5.5a3 3 0 016 0V8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
);

const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const AlertIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

/* ── Employee Login Component ── */
const EmployeeLogin = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState({ type: "", message: "" });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const storedEmail = localStorage.getItem("employeeEmail");
        if (storedEmail) {
            setEmail(storedEmail);
            setRememberMe(true);
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: "", message: "" });

        if (!email || !password) {
            setStatus({ type: "error", message: "Please enter both email and password." });
            return;
        }

        setIsLoading(true);

        try {
            const response = await axios.post(
                `${process.env.REACT_APP_BASE_URL}/user/employee-login`,
                { email, password },
                { withCredentials: true }
            );

            if (response.data === "Login successful") {
                if (rememberMe) {
                    localStorage.setItem("employeeEmail", email);
                } else {
                    localStorage.removeItem("employeeEmail");
                }
                sessionStorage.setItem("employeeEmail", email);
                setStatus({ type: "success", message: "Login successful! Redirecting to dashboard…" });
                toast.success("Login successful! Redirecting...");
                setTimeout(() => {
                    window.location.href = "/fumamain/employee/dashboard";
                }, 1500);
            } else {
                setStatus({ type: "error", message: "Invalid email or password." });
                toast.error("Invalid email or password");
            }
        } catch (error) {
            const msg = error.response?.data?.message || "Login failed. Please check your credentials.";
            setStatus({ type: "error", message: msg });
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fuma-login-page">
            {/* ── Left Brand Panel ── */}
            <div className="fuma-left-panel">
                {/* Decorative circles */}
                <span className="flp-circle flp-circle--tl" />
                <span className="flp-circle flp-circle--br" />
                <span className="flp-circle flp-circle--mid" />

                <div className="flp-inner">
                    {/* Actual FUMA logo image with animation */}
                    <div className="flp-logo-wrap">
                        <div className="flp-logo-glow" />
                        <img
                            src={FumaLogo}
                            alt="FUMA - Powering Innovation"
                            className="flp-logo-img"
                        />
                    </div>

                    <div className="flp-divider-line" />

                    <h1 className="flp-heading">
                        Your Work,<br />
                        <em>Simplified</em>
                    </h1>
                    <p className="flp-subtext">
                        Your dedicated employee portal for daily tasks, team updates, attendance tracking, and seamless collaboration.
                    </p>

                    <ul className="flp-features">
                        <li className="flp-feat-item"><span className="flp-dot" />Attendance &amp; leave management</li>
                        <li className="flp-feat-item"><span className="flp-dot" />Task &amp; project tracking</li>
                        <li className="flp-feat-item"><span className="flp-dot" />Team announcements &amp; updates</li>
                        <li className="flp-feat-item"><span className="flp-dot" />Payslip &amp; document access</li>
                    </ul>
                </div>
            </div>

            {/* ── Right Form Panel ── */}
            <div className="fuma-right-panel">
                <div className="fuma-card">
                    {/* Card header */}
                    <div className="fc-header">
                        <p className="fc-eyebrow">Employee Portal</p>
                        <h2 className="fc-title">Welcome back</h2>
                        <p className="fc-subtitle">Sign in to continue to your employee dashboard</p>
                        <div className="fc-divider" />
                    </div>

                    {/* Status message */}
                    {status.message && (
                        <div className={`fc-status fc-status--${status.type}`}>
                            {status.type === "success" ? <CheckIcon /> : <AlertIcon />}
                            <span>{status.message}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="fc-form" noValidate>
                        <div className="fc-field">
                            <label className="fc-label" htmlFor="employee-email">Email Address</label>
                            <div className="fc-input-wrap">
                                <EmailIcon />
                                <input
                                    id="employee-email"
                                    type="email"
                                    className="fc-input"
                                    placeholder="employee@fuma.co.in"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="fc-field">
                            <label className="fc-label" htmlFor="employee-password">Password</label>
                            <div className="fc-input-wrap">
                                <LockIcon />
                                <input
                                    id="employee-password"
                                    type={showPassword ? "text" : "password"}
                                    className="fc-input fc-input--has-eye"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="fc-eye-btn"
                                    onClick={() => setShowPassword((v) => !v)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                                </button>
                            </div>
                        </div>

                        <div className="fc-row-options">
                            <label className="fc-remember" htmlFor="employee-remember-toggle">
                                <input
                                    id="employee-remember-toggle"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <span className="fc-toggle-track">
                                    <span className="fc-toggle-thumb" />
                                </span>
                                <span className="fc-remember-label">Remember me</span>
                            </label>
                            <button type="button" className="fc-forgot">Forgot password?</button>
                        </div>

                        <button
                            type="submit"
                            className={`fc-submit-btn${isLoading ? " fc-submit-btn--loading" : ""}`}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="fc-spinner" />
                                    Signing in…
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <span className="fc-btn-arrow">→</span>
                                </>
                            )}
                        </button>
                    </form>

                    <p className="fc-footer">
                        Having trouble?{" "}
                        <a href="mailto:hr@fuma.co.in" className="fc-footer-link">
                            Contact HR Support
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default EmployeeLogin;
