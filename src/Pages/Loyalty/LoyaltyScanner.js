import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Html5QrcodeScanner } from "html5-qrcode";
import { toast } from "react-toastify";

const LoyaltyScanner = () => {
    const [userId, setUserId] = useState(null);
    const [lastScanResult, setLastScanResult] = useState(null);
    const [manualCode, setManualCode] = useState("");
    const [loading, setLoading] = useState(false);
    const scannerRef = useRef(null);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const email = sessionStorage.getItem("userEmail");
                if (!email) return;
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/user/email/${email}`);
                setUserId(response.data?.id || null);
            } catch (error) {
                console.error("Failed to load user", error);
            }
        };

        loadUser();
    }, []);

    useEffect(() => {
        if (scannerRef.current) return;

        const scanner = new Html5QrcodeScanner(
            "fuma-qr-reader",
            {
                fps: 10,
                qrbox: { width: 220, height: 220 },
            },
            false
        );

        const onSuccess = async (decodedText) => {
            await handleScan(decodedText);
        };

        const onError = () => {
            // Silent to avoid noisy UI spam.
        };

        scanner.render(onSuccess, onError);
        scannerRef.current = scanner;

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(() => { });
                scannerRef.current = null;
            }
        };
    }, [userId]);

    const handleScan = async (qrCodeValue) => {
        if (!userId) {
            toast.error("User not identified. Please relogin.");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/qr/scan`, {
                qrCodeValue,
                userId,
            });
            setLastScanResult(response.data);
            toast.success("Cashback credited successfully");
        } catch (error) {
            const message =
                error.response?.data?.message ||
                (typeof error.response?.data === "string" ? error.response.data : "Scan failed");
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        if (!manualCode.trim()) return;
        await handleScan(manualCode.trim());
        setManualCode("");
    };

    return (
        <div className="content-wrapper p-3">
            <section className="content-header">
                <h3>Loyalty QR Scanner</h3>
            </section>

            <section className="content">
                <div className="row">
                    <div className="col-md-6">
                        <div className="card card-primary">
                            <div className="card-header">
                                <h5 className="card-title mb-0">Scan QR</h5>
                            </div>
                            <div className="card-body">
                                <div id="fuma-qr-reader" />
                                <form onSubmit={handleManualSubmit} className="mt-3">
                                    <label className="form-label">Manual QR Value</label>
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={manualCode}
                                            onChange={(e) => setManualCode(e.target.value)}
                                            placeholder="Paste QR value"
                                        />
                                        <button className="btn btn-primary" type="submit" disabled={loading}>
                                            Submit
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-6">
                        <div className="card card-success">
                            <div className="card-header">
                                <h5 className="card-title mb-0">Cashback Result</h5>
                            </div>
                            <div className="card-body">
                                {!lastScanResult && <p className="text-muted mb-0">Scan a QR code to view cashback result.</p>}
                                {lastScanResult && (
                                    <>
                                        <p><strong>Status:</strong> {lastScanResult.message}</p>
                                        <p><strong>QR:</strong> {lastScanResult.qrCode}</p>
                                        <p><strong>Cashback:</strong> Rs. {lastScanResult.cashbackAmount}</p>
                                        <p><strong>Updated Wallet:</strong> Rs. {lastScanResult.walletBalance}</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LoyaltyScanner;
