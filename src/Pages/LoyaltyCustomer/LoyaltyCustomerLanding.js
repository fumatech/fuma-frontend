import React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import "../LoginPage/LoginPage.css";
import { isLoyaltyLoggedIn } from "./authStorage";
import FumaLogo from "../../assets/fuma-logo-lockup.svg";

const LoyaltyCustomerLanding = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const code = searchParams.get("code") || "";

    const continueFlow = () => {
        if (!code) return;

        if (isLoyaltyLoggedIn()) {
            navigate(`/reward/claim?code=${encodeURIComponent(code)}`);
            return;
        }

        navigate(`/reward/auth?code=${encodeURIComponent(code)}&next=claim`);
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
                        Scan complete<br />
                        <em>Claim Cashback</em>
                    </h1>
                    <p className="flp-subtext">
                        Continue to validate your QR and credit cashback directly into your FUMA reward wallet.
                    </p>
                </div>
            </div>

            <div className="fuma-right-panel">
                <div className="fuma-card">
                    <div className="fc-header">
                        <p className="fc-eyebrow">FUMA Rewards</p>
                        <h2 className="fc-title">Ready to claim</h2>
                        <p className="fc-subtitle">Verify this QR and continue securely</p>
                        <div className="fc-divider" />
                    </div>

                    <div className="fc-status" style={{ background: "#f8fafc", color: "#0C4461", border: "1px solid #e4e8f0" }}>
                        <span><strong>QR Code:</strong> {code || "Missing code"}</span>
                    </div>

                    {!code && (
                        <div className="fc-status fc-status--error" role="alert">
                            Invalid reward link. Please scan the product QR again.
                        </div>
                    )}

                    <button className="fc-submit-btn" onClick={continueFlow} disabled={!code}>
                        Continue to claim
                    </button>

                    <Link className="fc-sso-btn" to="/reward/wallet" style={{ textDecoration: "none" }}>
                        Go to wallet dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default LoyaltyCustomerLanding;
