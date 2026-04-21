import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const LoyaltyReferral = () => {
    const [userId, setUserId] = useState(null);
    const [referralCode, setReferralCode] = useState("");
    const [applyCode, setApplyCode] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const email = sessionStorage.getItem("userEmail");
                if (!email) return;
                const userRes = await axios.get(`${process.env.REACT_APP_BASE_URL}/user/email/${email}`);
                const id = userRes.data?.id;
                setUserId(id);
                if (id) {
                    const codeRes = await axios.get(`${process.env.REACT_APP_BASE_URL}/referral/code`, {
                        params: { userId: id },
                    });
                    setReferralCode(codeRes.data?.referralCode || "");
                }
            } catch (error) {
                toast.error("Unable to load referral details");
            }
        };

        loadData();
    }, []);

    const handleApply = async (e) => {
        e.preventDefault();
        if (!applyCode.trim() || !userId) return;

        setLoading(true);
        try {
            const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/referral/apply`, {
                userId,
                referralCode: applyCode.trim(),
            });
            toast.success(response.data?.message || "Referral applied");
            setApplyCode("");
        } catch (error) {
            const msg =
                error.response?.data?.message ||
                (typeof error.response?.data === "string" ? error.response.data : "Failed to apply referral");
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const copyCode = async () => {
        if (!referralCode) return;
        try {
            await navigator.clipboard.writeText(referralCode);
            toast.success("Referral code copied");
        } catch (error) {
            toast.error("Unable to copy referral code");
        }
    };

    return (
        <div className="content-wrapper p-3">
            <section className="content-header">
                <h3>Referral Program</h3>
            </section>

            <section className="content">
                <div className="row">
                    <div className="col-md-6">
                        <div className="card card-primary">
                            <div className="card-header">
                                <h5 className="card-title mb-0">Your Referral Code</h5>
                            </div>
                            <div className="card-body">
                                <div className="input-group">
                                    <input className="form-control" readOnly value={referralCode || "Loading..."} />
                                    <button className="btn btn-outline-primary" onClick={copyCode}>Copy</button>
                                </div>
                                <p className="text-muted mt-2 mb-0">
                                    Share this code with new users to earn referral cashback rewards.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-6">
                        <div className="card card-success">
                            <div className="card-header">
                                <h5 className="card-title mb-0">Apply Referral Code</h5>
                            </div>
                            <div className="card-body">
                                <form onSubmit={handleApply}>
                                    <label className="form-label">Enter referral code</label>
                                    <div className="input-group">
                                        <input
                                            className="form-control"
                                            value={applyCode}
                                            onChange={(e) => setApplyCode(e.target.value)}
                                            placeholder="FUMA..."
                                        />
                                        <button className="btn btn-success" disabled={loading} type="submit">
                                            Apply
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LoyaltyReferral;
