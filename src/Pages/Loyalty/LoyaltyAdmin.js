import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const LoyaltyAdmin = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [report, setReport] = useState(null);
    const [campaignForm, setCampaignForm] = useState({
        name: "",
        cashbackAmount: "",
        validFrom: "",
        validTo: "",
        enabled: true,
    });
    const [qrForm, setQrForm] = useState({
        productId: "",
        campaignId: "",
        cashbackAmount: "",
        expiryDate: "",
        count: 1,
    });
    const [generatedCodes, setGeneratedCodes] = useState([]);

    const loadAll = async () => {
        try {
            const [campaignRes, reportRes] = await Promise.all([
                axios.get(`${process.env.REACT_APP_BASE_URL}/admin/qr-campaign/getall`),
                axios.get(`${process.env.REACT_APP_BASE_URL}/admin/qr-report`),
            ]);
            setCampaigns(campaignRes.data || []);
            setReport(reportRes.data || null);
        } catch (error) {
            toast.error("Failed to load loyalty admin data");
        }
    };

    useEffect(() => {
        loadAll();
    }, []);

    const handleCampaignSave = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${process.env.REACT_APP_BASE_URL}/admin/qr-campaign/save`, {
                ...campaignForm,
                cashbackAmount: Number(campaignForm.cashbackAmount),
            });
            toast.success("Campaign saved");
            setCampaignForm({ name: "", cashbackAmount: "", validFrom: "", validTo: "", enabled: true });
            loadAll();
        } catch (error) {
            toast.error("Failed to save campaign");
        }
    };

    const toggleCampaign = async (campaign) => {
        try {
            await axios.put(`${process.env.REACT_APP_BASE_URL}/admin/qr-campaign/toggle`, null, {
                params: { campaignId: campaign.id, enabled: !campaign.enabled },
            });
            loadAll();
        } catch (error) {
            toast.error("Failed to update campaign status");
        }
    };

    const handleQrGenerate = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/qr/generate`, {
                ...qrForm,
                productId: qrForm.productId ? Number(qrForm.productId) : null,
                campaignId: qrForm.campaignId ? Number(qrForm.campaignId) : null,
                cashbackAmount: qrForm.cashbackAmount ? Number(qrForm.cashbackAmount) : null,
                count: Number(qrForm.count || 1),
            });
            setGeneratedCodes(response.data || []);
            toast.success("QR code(s) generated");
            loadAll();
        } catch (error) {
            const msg = error.response?.data?.message || "Failed to generate QR codes";
            toast.error(msg);
        }
    };

    return (
        <div className="content-wrapper p-3">
            <section className="content-header d-flex justify-content-between align-items-center">
                <h3>Loyalty Admin</h3>
                <button className="btn btn-outline-primary btn-sm" onClick={loadAll}>Refresh</button>
            </section>

            <section className="content">
                <div className="row">
                    <div className="col-lg-4 col-md-6">
                        <div className="small-box bg-info">
                            <div className="inner">
                                <h3>{report?.totalQr || 0}</h3>
                                <p>Total QR</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-4 col-md-6">
                        <div className="small-box bg-success">
                            <div className="inner">
                                <h3>{report?.usedQr || 0}</h3>
                                <p>Used QR</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-4 col-md-6">
                        <div className="small-box bg-warning">
                            <div className="inner">
                                <h3>Rs. {report?.cashbackDistribution || 0}</h3>
                                <p>Cashback Distribution</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-6">
                        <div className="card card-primary">
                            <div className="card-header"><h5 className="card-title mb-0">Create QR Campaign</h5></div>
                            <div className="card-body">
                                <form onSubmit={handleCampaignSave}>
                                    <div className="mb-2">
                                        <input className="form-control" placeholder="Campaign name" value={campaignForm.name} onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })} required />
                                    </div>
                                    <div className="mb-2">
                                        <input className="form-control" type="number" step="0.01" placeholder="Cashback amount" value={campaignForm.cashbackAmount} onChange={(e) => setCampaignForm({ ...campaignForm, cashbackAmount: e.target.value })} required />
                                    </div>
                                    <div className="mb-2">
                                        <label className="form-label">Valid From</label>
                                        <input className="form-control" type="datetime-local" value={campaignForm.validFrom} onChange={(e) => setCampaignForm({ ...campaignForm, validFrom: e.target.value })} />
                                    </div>
                                    <div className="mb-2">
                                        <label className="form-label">Valid To</label>
                                        <input className="form-control" type="datetime-local" value={campaignForm.validTo} onChange={(e) => setCampaignForm({ ...campaignForm, validTo: e.target.value })} />
                                    </div>
                                    <button className="btn btn-primary" type="submit">Save Campaign</button>
                                </form>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header"><h5 className="card-title mb-0">Campaign List</h5></div>
                            <div className="card-body table-responsive p-0">
                                <table className="table table-sm mb-0">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Cashback</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {campaigns.map((campaign) => (
                                            <tr key={campaign.id}>
                                                <td>{campaign.name}</td>
                                                <td>Rs. {campaign.cashbackAmount}</td>
                                                <td>{campaign.enabled ? "Enabled" : "Disabled"}</td>
                                                <td>
                                                    <button className="btn btn-xs btn-outline-secondary" onClick={() => toggleCampaign(campaign)}>
                                                        {campaign.enabled ? "Disable" : "Enable"}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-6">
                        <div className="card card-success">
                            <div className="card-header"><h5 className="card-title mb-0">Generate QR Codes</h5></div>
                            <div className="card-body">
                                <form onSubmit={handleQrGenerate}>
                                    <div className="mb-2">
                                        <input className="form-control" type="number" placeholder="Product ID" value={qrForm.productId} onChange={(e) => setQrForm({ ...qrForm, productId: e.target.value })} />
                                    </div>
                                    <div className="mb-2">
                                        <select className="form-control" value={qrForm.campaignId} onChange={(e) => setQrForm({ ...qrForm, campaignId: e.target.value })}>
                                            <option value="">Select campaign (optional)</option>
                                            {campaigns.map((campaign) => (
                                                <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-2">
                                        <input className="form-control" type="number" step="0.01" placeholder="Cashback amount (optional if campaign selected)" value={qrForm.cashbackAmount} onChange={(e) => setQrForm({ ...qrForm, cashbackAmount: e.target.value })} />
                                    </div>
                                    <div className="mb-2">
                                        <label className="form-label">Expiry date</label>
                                        <input className="form-control" type="datetime-local" value={qrForm.expiryDate} onChange={(e) => setQrForm({ ...qrForm, expiryDate: e.target.value })} />
                                    </div>
                                    <div className="mb-2">
                                        <input className="form-control" type="number" min="1" placeholder="Count" value={qrForm.count} onChange={(e) => setQrForm({ ...qrForm, count: e.target.value })} />
                                    </div>
                                    <button className="btn btn-success" type="submit">Generate</button>
                                </form>
                            </div>
                        </div>

                        <div className="card mt-3">
                            <div className="card-header"><h5 className="card-title mb-0">Generated QR Values</h5></div>
                            <div className="card-body" style={{ maxHeight: 330, overflowY: "auto" }}>
                                {generatedCodes.length === 0 && <p className="text-muted mb-0">No generated codes yet.</p>}
                                {generatedCodes.map((qr) => (
                                    <div key={qr.id} className="border rounded p-2 mb-2">
                                        <div><strong>Code:</strong> {qr.qrCodeValue}</div>
                                        <div><strong>Cashback:</strong> Rs. {qr.cashbackAmount}</div>
                                        <div><strong>Status:</strong> {qr.used ? "Used" : "Unused"}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LoyaltyAdmin;
