import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const LoyaltyWallet = () => {
    const [userId, setUserId] = useState(null);
    const [wallet, setWallet] = useState(null);
    const [transactions, setTransactions] = useState([]);

    const loadWalletData = async (id) => {
        try {
            const [walletRes, txRes] = await Promise.all([
                axios.get(`${process.env.REACT_APP_BASE_URL}/wallet`, { params: { userId: id } }),
                axios.get(`${process.env.REACT_APP_BASE_URL}/wallet/transactions`, { params: { userId: id } }),
            ]);
            setWallet(walletRes.data);
            setTransactions(txRes.data || []);
        } catch (error) {
            toast.error("Unable to load wallet data");
        }
    };

    useEffect(() => {
        const loadUser = async () => {
            try {
                const email = sessionStorage.getItem("userEmail");
                if (!email) return;
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/user/email/${email}`);
                const id = response.data?.id;
                setUserId(id);
                if (id) {
                    loadWalletData(id);
                }
            } catch (error) {
                toast.error("Unable to identify user");
            }
        };

        loadUser();
    }, []);

    return (
        <div className="content-wrapper p-3">
            <section className="content-header d-flex justify-content-between align-items-center">
                <h3>Wallet Dashboard</h3>
                <button className="btn btn-outline-primary btn-sm" onClick={() => userId && loadWalletData(userId)}>
                    Refresh
                </button>
            </section>

            <section className="content">
                <div className="card card-info">
                    <div className="card-body">
                        <h4 className="mb-0">Current Balance</h4>
                        <h2 className="mt-2 text-primary">Rs. {wallet?.balance || 0}</h2>
                    </div>
                </div>

                <div className="card mt-3">
                    <div className="card-header">
                        <h5 className="card-title mb-0">Transaction History</h5>
                    </div>
                    <div className="card-body table-responsive p-0">
                        <table className="table table-striped mb-0">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Type</th>
                                    <th>Source</th>
                                    <th>Amount</th>
                                    <th>Reference</th>
                                    <th>Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="text-center text-muted">No transactions found.</td>
                                    </tr>
                                )}
                                {transactions.map((txn, index) => (
                                    <tr key={txn.id}>
                                        <td>{index + 1}</td>
                                        <td>{txn.transactionType}</td>
                                        <td>{txn.source}</td>
                                        <td>Rs. {txn.amount}</td>
                                        <td>{txn.referenceCode || "-"}</td>
                                        <td>{txn.createdAt ? new Date(txn.createdAt).toLocaleString() : "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LoyaltyWallet;
