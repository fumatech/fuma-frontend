import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import "../LoginPage/LoginPage.css";
import { getLoyaltyUser } from "./authStorage";
import FumaLogo from "../../assets/fuma-logo-lockup.svg";

const playSuccessSound = () => {
    try {
        const AudioContextRef = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextRef) return;
        const audioContext = new AudioContextRef();

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        const now = audioContext.currentTime;
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(660, now);
        oscillator.frequency.linearRampToValueAtTime(980, now + 0.08);

        gainNode.gain.setValueAtTime(0.001, now);
        gainNode.gain.linearRampToValueAtTime(0.12, now + 0.02);
        gainNode.gain.linearRampToValueAtTime(0.001, now + 0.14);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start(now);
        oscillator.stop(now + 0.15);
    } catch (error) {
        // Do not block reward flow if audio is unavailable.
    }
};

const LoyaltyCustomerClaim = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const code = searchParams.get("code") || "";
    const hasClaimedRef = useRef(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [result, setResult] = useState(null);

    useEffect(() => {
        const runFlow = async () => {
            if (!code) {
                setError("Missing reward code");
                setLoading(false);
                return;
            }

            const user = getLoyaltyUser();
            if (!user?.userId) {
                navigate(`/reward/auth?code=${encodeURIComponent(code)}&next=claim`, { replace: true });
                return;
            }

            if (hasClaimedRef.current) return;
            hasClaimedRef.current = true;

            try {
                await axios.get(`${process.env.REACT_APP_BASE_URL}/reward/validate`, {
                    params: { code },
                });

                const claimResponse = await axios.post(
                    `${process.env.REACT_APP_BASE_URL}/reward/claim`,
                    { code, userId: user.userId }
                );

                setResult(claimResponse.data);
                playSuccessSound();
            } catch (apiError) {
                setError(apiError.response?.data?.message || "Unable to claim reward");
            } finally {
                setLoading(false);
            }
        };

        runFlow();
    }, [code, navigate]);

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
                        Claim Reward<br />
                        <em>Cashback</em>
                    </h1>
                    <p className="flp-subtext">
                        We validate your QR and instantly credit your reward to your FUMA wallet.
                    </p>
                </div>
            </div>

            <div className="fuma-right-panel">
                <div className="fuma-card">
                    <div className="fc-header">
                        <p className="fc-eyebrow">FUMA Rewards</p>
                        <h2 className="fc-title">Claim cashback</h2>
                        <p className="fc-subtitle">Secure validation in progress</p>
                        <div className="fc-divider" />
                    </div>

                    {loading && (
                        <div className="fc-status" style={{ background: "#f8fafc", color: "#0C4461", border: "1px solid #e4e8f0" }}>
                            Validating and claiming your cashback...
                        </div>
                    )}

                    {!loading && error && (
                        <>
                            <div className="fc-status fc-status--error">{error}</div>
                            <div style={{ display: "grid", gap: 10 }}>
                                <Link className="fc-sso-btn" to="/reward" style={{ textDecoration: "none" }}>
                                    Try another QR
                                </Link>
                                <Link className="fc-submit-btn" to="/reward/wallet" style={{ textDecoration: "none" }}>
                                    Open wallet
                                </Link>
                            </div>
                        </>
                    )}

                    {!loading && !error && result && (
                        <>
                            <div className="fc-status fc-status--success">Congratulations! Cashback credited successfully.</div>
                            <div className="fc-status" style={{ background: "#f8fafc", color: "#0C4461", border: "1px solid #e4e8f0" }}>
                                Cashback: ₹{result.cashbackAmount}
                            </div>
                            <div className="fc-status" style={{ background: "#f8fafc", color: "#0C4461", border: "1px solid #e4e8f0" }}>
                                Wallet Balance: ₹{result.walletBalance}
                            </div>
                            <div style={{ display: "grid", gap: 10 }}>
                                <Link className="fc-sso-btn" to="/reward/referral" style={{ textDecoration: "none" }}>
                                    Refer and earn
                                </Link>
                                <Link className="fc-submit-btn" to="/reward/wallet" style={{ textDecoration: "none" }}>
                                    View wallet
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoyaltyCustomerClaim;
