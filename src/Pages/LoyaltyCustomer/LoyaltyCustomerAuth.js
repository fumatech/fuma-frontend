import React, { useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../LoginPage/LoginPage.css";
import { saveLoyaltyAuth } from "./authStorage";
import FumaLogo from "../../assets/fuma-logo-lockup.svg";

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

const LoyaltyCustomerAuth = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const code = searchParams.get("code") || "";
    const next = searchParams.get("next") || "wallet";
    const referralFromLink = searchParams.get("ref") || "";

    const [mode, setMode] = useState("login");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [loginForm, setLoginForm] = useState({ email: "", password: "" });
    const [signupForm, setSignupForm] = useState({
        firstname: "",
        lastname: "",
        email: "",
        password: "",
        referralCode: referralFromLink,
    });

    const continuePath = useMemo(() => {
        if (next === "claim" && code) {
            return `/reward/claim?code=${encodeURIComponent(code)}`;
        }
        return "/reward/wallet";
    }, [next, code]);

    const handleAuthSuccess = (payload) => {
        saveLoyaltyAuth(payload);
        navigate(continuePath, { replace: true });
    };

    const doLogin = async (event) => {
        event.preventDefault();
        setError("");
        setLoading(true);
        try {
            const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/auth/login`, loginForm);
            handleAuthSuccess(response.data);
        } catch (apiError) {
            setError(apiError.response?.data?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    const doSignup = async (event) => {
        event.preventDefault();
        setError("");
        setLoading(true);
        try {
            const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/auth/signup`, signupForm);
            handleAuthSuccess(response.data);
        } catch (apiError) {
            setError(apiError.response?.data?.message || "Signup failed");
        } finally {
            setLoading(false);
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
                        Reward Wallet<br />
                        <em>Customer Access</em>
                    </h1>
                    <p className="flp-subtext">
                        Sign in to claim cashback from scanned QR codes and manage your reward wallet.
                    </p>
                </div>
            </div>

            <div className="fuma-right-panel">
                <div className="fuma-card">
                    <div className="fc-header">
                        <p className="fc-eyebrow">FUMA Rewards</p>
                        <h2 className="fc-title">Welcome back</h2>
                        <p className="fc-subtitle">Login or create account to continue</p>
                        <div className="fc-divider" />
                    </div>

                    {error && <div className="fc-status fc-status--error">{error}</div>}

                    <div className="fc-type-toggle">
                        <button
                            type="button"
                            className={`fc-toggle-btn ${mode === "login" ? "fc-toggle-btn--active" : ""}`}
                            onClick={() => setMode("login")}
                        >
                            Login
                        </button>
                        <button
                            type="button"
                            className={`fc-toggle-btn ${mode === "signup" ? "fc-toggle-btn--active" : ""}`}
                            onClick={() => setMode("signup")}
                        >
                            Signup
                        </button>
                    </div>

                    {mode === "login" ? (
                        <form className="fc-form" onSubmit={doLogin}>
                            <div className="fc-field">
                                <label className="fc-label" htmlFor="reward-login-email">Email Address</label>
                                <div className="fc-input-wrap">
                                    <EmailIcon />
                                    <input
                                        id="reward-login-email"
                                        className="fc-input"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={loginForm.email}
                                        onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="fc-field">
                                <label className="fc-label" htmlFor="reward-login-password">Password</label>
                                <div className="fc-input-wrap">
                                    <LockIcon />
                                    <input
                                        id="reward-login-password"
                                        className="fc-input"
                                        type="password"
                                        placeholder="Enter your password"
                                        value={loginForm.password}
                                        onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <button className={`fc-submit-btn${loading ? " fc-submit-btn--loading" : ""}`} type="submit" disabled={loading}>
                                {loading ? "Signing in..." : "Sign In"}
                            </button>
                        </form>
                    ) : (
                        <form className="fc-form" onSubmit={doSignup}>
                            <div className="fc-field">
                                <label className="fc-label" htmlFor="reward-signup-firstname">First Name</label>
                                <div className="fc-input-wrap">
                                    <input
                                        id="reward-signup-firstname"
                                        className="fc-input"
                                        type="text"
                                        placeholder="First name"
                                        value={signupForm.firstname}
                                        onChange={(event) => setSignupForm({ ...signupForm, firstname: event.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="fc-field">
                                <label className="fc-label" htmlFor="reward-signup-lastname">Last Name</label>
                                <div className="fc-input-wrap">
                                    <input
                                        id="reward-signup-lastname"
                                        className="fc-input"
                                        type="text"
                                        placeholder="Last name"
                                        value={signupForm.lastname}
                                        onChange={(event) => setSignupForm({ ...signupForm, lastname: event.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="fc-field">
                                <label className="fc-label" htmlFor="reward-signup-email">Email Address</label>
                                <div className="fc-input-wrap">
                                    <EmailIcon />
                                    <input
                                        id="reward-signup-email"
                                        className="fc-input"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={signupForm.email}
                                        onChange={(event) => setSignupForm({ ...signupForm, email: event.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="fc-field">
                                <label className="fc-label" htmlFor="reward-signup-password">Password</label>
                                <div className="fc-input-wrap">
                                    <LockIcon />
                                    <input
                                        id="reward-signup-password"
                                        className="fc-input"
                                        type="password"
                                        placeholder="Create password"
                                        value={signupForm.password}
                                        onChange={(event) => setSignupForm({ ...signupForm, password: event.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="fc-field">
                                <label className="fc-label" htmlFor="reward-signup-referral">Referral Code (Optional)</label>
                                <div className="fc-input-wrap">
                                    <input
                                        id="reward-signup-referral"
                                        className="fc-input"
                                        type="text"
                                        placeholder="Referral code"
                                        value={signupForm.referralCode}
                                        onChange={(event) => setSignupForm({ ...signupForm, referralCode: event.target.value })}
                                    />
                                </div>
                            </div>

                            <button className={`fc-submit-btn${loading ? " fc-submit-btn--loading" : ""}`} type="submit" disabled={loading}>
                                {loading ? "Creating account..." : "Create Account"}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoyaltyCustomerAuth;
