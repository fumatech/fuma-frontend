import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "../LoginPage/LoginPage.css";
import { clearLoyaltyAuth, getLoyaltyUser, isLoyaltyLoggedIn } from "./authStorage";
import FumaLogo from "../../assets/fuma-logo-lockup.svg";

const LoyaltyCustomerWallet = () => {
    const navigate = useNavigate();
    const [wallet, setWallet] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadWallet = async () => {
        try {
            setError("");
            setLoading(true);

            const user = getLoyaltyUser();
            if (!user?.userId) {
                navigate("/reward/auth?next=wallet", { replace: true });
                return;
            }

            const [walletRes, txnRes] = await Promise.all([
                axios.get(`${process.env.REACT_APP_BASE_URL}/wallet`, { params: { userId: user.userId } }),
                axios.get(`${process.env.REACT_APP_BASE_URL}/wallet/transactions`, { params: { userId: user.userId } }),
            ]);

            setWallet(walletRes.data || null);
            setTransactions(txnRes.data || []);
        } catch (apiError) {
            setError(apiError.response?.data?.message || "Unable to load wallet");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isLoyaltyLoggedIn()) {
            navigate("/reward/auth?next=wallet", { replace: true });
            return;
        }
        loadWallet();
    }, [navigate]);

    const logout = () => {
        clearLoyaltyAuth();
        navigate("/reward");
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
                        <em>Dashboard</em>
                    </h1>
                    <p className="flp-subtext">
                        Check your current balance and reward transaction history.
                    </p>
                </div>
            </div>

            <div className="fuma-right-panel">
                <div className="fuma-card">
                    <div className="fc-header">
                        <p className="fc-eyebrow">FUMA Wallet</p>
                        <h2 className="fc-title">Wallet dashboard</h2>
                        <p className="fc-subtitle">Your reward credits at a glance</p>
                        <div className="fc-divider" />
                    </div>

                    {loading ? (
                        <div className="fc-status" style={{ background: "#f8fafc", color: "#0C4461", border: "1px solid #e4e8f0" }}>
                            Loading your balance...
                        </div>
                    ) : (
                        <div className="fc-status" style={{ background: "#f8fafc", color: "#0C4461", border: "1px solid #e4e8f0" }}>
                            Current Balance: ₹{wallet?.balance || 0}
                        </div>
                    )}

                    {error && <div className="fc-status fc-status--error">{error}</div>}

                    <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                        <button className="fc-sso-btn" onClick={loadWallet} disabled={loading}>
                            Refresh
                        </button>
                        <Link className="fc-submit-btn" to="/reward/referral" style={{ textDecoration: "none" }}>
                            Referral
                        </Link>
                        <button className="fc-sso-btn" onClick={logout}>
                            Logout
                        </button>
                    </div>

                    <div className="fc-header" style={{ marginTop: 22 }}>
                        <h2 className="fc-title" style={{ fontSize: "1.35rem" }}>Transactions</h2>
                    </div>

                    {transactions.length === 0 ? (
                        <p className="fc-subtitle">No transactions yet.</p>
                    ) : (
                        <div style={{ maxHeight: 220, overflowY: "auto", display: "grid", gap: 8 }}>
                            {transactions.map((txn) => (
                                <div
                                    key={txn.id}
                                    className="fc-status"
                                    style={{ background: "#fff", color: "#0C4461", border: "1px solid #e4e8f0", display: "grid", gap: 4 }}
                                >
                                    <strong>{txn.source} - ₹{txn.amount}</strong>
                                    <span>{txn.createdAt ? new Date(txn.createdAt).toLocaleString() : "-"}</span>
                                    {txn.referenceCode && <span>Ref: {txn.referenceCode}</span>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoyaltyCustomerWallet;
