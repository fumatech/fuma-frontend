import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "../LoginPage/LoginPage.css";
import { getLoyaltyUser, isLoyaltyLoggedIn } from "./authStorage";
import FumaLogo from "../../assets/Fuma1.jpeg";

const LoyaltyCustomerReferral = () => {
    const navigate = useNavigate();

    const [referralCode, setReferralCode] = useState("");
    const [applyCode, setApplyCode] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isLoyaltyLoggedIn()) {
            navigate("/reward/auth?next=referral", { replace: true });
            return;
        }

        const user = getLoyaltyUser();
        if (!user?.userId) {
            navigate("/reward/auth?next=referral", { replace: true });
            return;
        }

        const fetchCode = async () => {
            try {
                setError("");
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/referral/code`, {
                    params: { userId: user.userId },
                });
                setReferralCode(response.data?.referralCode || "");
            } catch (apiError) {
                setError(apiError.response?.data?.message || "Unable to load referral code");
            }
        };

        fetchCode();
    }, [navigate]);

    const applyReferral = async (event) => {
        event.preventDefault();
        if (!applyCode.trim()) return;

        const user = getLoyaltyUser();
        if (!user?.userId) {
            navigate("/reward/auth?next=referral", { replace: true });
            return;
        }

        setMessage("");
        setError("");
        setLoading(true);
        try {
            const response = await axios.post(
                `${process.env.REACT_APP_BASE_URL}/referral/apply`,
                { userId: user.userId, referralCode: applyCode.trim() }
            );
            setMessage(response.data?.message || "Referral applied");
            setApplyCode("");
        } catch (apiError) {
            setError(apiError.response?.data?.message || "Unable to apply referral");
        } finally {
            setLoading(false);
        }
    };

    const copyCode = async () => {
        if (!referralCode) return;
        await navigator.clipboard.writeText(referralCode);
        setMessage("Referral code copied");
    };

    const referralLink = referralCode
        ? `${window.location.origin}/reward/auth?ref=${encodeURIComponent(referralCode)}`
        : "";

    const copyReferralLink = async () => {
        if (!referralLink) return;
        await navigator.clipboard.writeText(referralLink);
        setMessage("Referral link copied");
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
                        Refer Friends<br />
                        <em>Earn Cashback</em>
                    </h1>
                    <p className="flp-subtext">
                        Share your code and earn bonus cashback when new users join and apply referral.
                    </p>
                </div>
            </div>

            <div className="fuma-right-panel">
                <div className="fuma-card">
                    <div className="fc-header">
                        <p className="fc-eyebrow">FUMA Referral</p>
                        <h2 className="fc-title">Refer and earn</h2>
                        <p className="fc-subtitle">Your personal referral tools</p>
                        <div className="fc-divider" />
                    </div>

                    <div className="fc-status" style={{ background: "#f8fafc", color: "#0C4461", border: "1px solid #e4e8f0" }}>
                        <strong>Your code:</strong>&nbsp;{referralCode || "Loading..."}
                    </div>

                    <div style={{ display: "grid", gap: 10 }}>
                        <button className="fc-submit-btn" onClick={copyCode} disabled={!referralCode}>
                            Copy code
                        </button>
                        <button className="fc-sso-btn" onClick={copyReferralLink} disabled={!referralCode}>
                            Copy link
                        </button>
                    </div>

                    {referralLink && (
                        <p className="fc-subtitle" style={{ marginTop: 10, wordBreak: "break-all" }}>
                            Share link: {referralLink}
                        </p>
                    )}

                    <div className="fc-header" style={{ marginTop: 18 }}>
                        <h2 className="fc-title" style={{ fontSize: "1.35rem" }}>Apply referral code</h2>
                    </div>

                    <form className="fc-form" onSubmit={applyReferral}>
                        <div className="fc-field" style={{ marginBottom: 12 }}>
                            <div className="fc-input-wrap">
                                <input
                                    className="fc-input"
                                    type="text"
                                    value={applyCode}
                                    onChange={(event) => setApplyCode(event.target.value)}
                                    placeholder="Enter referral code"
                                />
                            </div>
                        </div>
                        <button className="fc-submit-btn" type="submit" disabled={loading}>
                            {loading ? "Applying..." : "Apply code"}
                        </button>
                    </form>

                    {message && <div className="fc-status fc-status--success" style={{ marginTop: 10 }}>{message}</div>}
                    {error && <div className="fc-status fc-status--error" style={{ marginTop: 10 }}>{error}</div>}

                    <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                        <Link className="fc-sso-btn" to="/reward/wallet" style={{ textDecoration: "none" }}>
                            Back to wallet
                        </Link>
                        <Link className="fc-submit-btn" to="/reward" style={{ textDecoration: "none" }}>
                            Claim another QR
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoyaltyCustomerReferral;
