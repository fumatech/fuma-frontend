import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { toast } from "react-toastify";

const DOCUMENT_TYPES = [
    { value: "PHOTO", label: "Photo" },
    { value: "JOINING_LETTER", label: "Joining Letter" },
    { value: "ID_PROOF", label: "ID Proof" },
    { value: "CONTRACT", label: "Contract" },
    { value: "OFFER_LETTER", label: "Offer Letter" },
    { value: "OTHER", label: "Other" },
];


const HRDocs = () => {
    const BASE_URL = process.env.REACT_APP_BASE_URL;

    const [documents, setDocuments] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [filterType, setFilterType] = useState("");

    const [formData, setFormData] = useState({
        employeeId: "",
        documentType: "JOINING_LETTER",
        title: "",
        description: "",
    });
    const [file, setFile] = useState(null);

    const userProfile = useMemo(() => {
        try {
            const raw = sessionStorage.getItem("userProfileData");
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }, []);

    const userId = userProfile?.id;
    const roles = userProfile?.roles || [];

    const hasRoleByName = (name) =>
        roles.some((role) => role?.role?.toLowerCase() === name.toLowerCase());

    const hasPermission = (permissionName) => {
        if (hasRoleByName("admin") || hasRoleByName("super admin")) {
            return true;
        }

        return roles.some(
            (role) =>
                Array.isArray(role.permissions) &&
                role.permissions.some((permission) => permission?.name === permissionName)
        );
    };

    const canManage = hasPermission("hr_docs.manage");
    const canView = canManage || hasPermission("hr_docs.view");

    const fetchEmployees = async () => {
        if (!canManage) {
            return;
        }

        try {
            const response = await axios.get(`${BASE_URL}/user/getall`);
            setEmployees(response.data || []);
        } catch (error) {
            console.error("Error fetching employees", error);
            toast.error("Unable to load employees");
        }
    };

    const fetchDocuments = async () => {
        if (!userId || !canView) {
            return;
        }

        try {
            setIsLoading(true);
            const url = canManage
                ? `${BASE_URL}/hr-docs/getall?requesterUserId=${userId}`
                : `${BASE_URL}/hr-docs/my-docs/${userId}?requesterUserId=${userId}`;

            const response = await axios.get(url);
            setDocuments(response.data || []);
        } catch (error) {
            console.error("Error fetching documents", error);
            toast.error("Unable to load documents");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
        fetchDocuments();

        const script = document.createElement("script");
        script.src = "js/JqueryContent.js";
        script.async = true;
        document.body.appendChild(script);

        return () => {
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, []);

    const filteredDocuments = useMemo(() => {
        if (!filterType) {
            return documents;
        }
        return documents.filter((doc) => doc.documentType === filterType);
    }, [documents, filterType]);

    const resetForm = () => {
        setFormData({
            employeeId: canManage ? "" : String(userId || ""),
            documentType: "JOINING_LETTER",
            title: "",
            description: "",
        });
        setFile(null);
        setEditingId(null);
    };

    useEffect(() => {
        resetForm();
    }, [userId, canManage]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleFileChange = (e) => {
        setFile(e.target.files?.[0] || null);
    };

    const validateForm = () => {
        if (!formData.documentType) {
            toast.error("Document type is required");
            return false;
        }

        if (canManage && !formData.employeeId) {
            toast.error("Employee is required");
            return false;
        }

        if (!editingId && !file) {
            toast.error("Document file is required");
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!canManage) {
            toast.error("You do not have permission to manage documents");
            return;
        }

        if (!userId || !validateForm()) {
            return;
        }

        try {
            setIsLoading(true);
            const payload = new FormData();
            payload.append("requesterUserId", userId);
            payload.append("employeeId", formData.employeeId);
            payload.append("documentType", formData.documentType);
            payload.append("title", formData.title);
            payload.append("description", formData.description);
            if (file) {
                payload.append("file", file);
            }

            if (editingId) {
                await axios.put(`${BASE_URL}/hr-docs/update/${editingId}`, payload, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                toast.success("Document updated successfully");
            } else {
                await axios.post(`${BASE_URL}/hr-docs/add`, payload, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                toast.success("Document uploaded successfully");
            }

            resetForm();
            fetchDocuments();
        } catch (error) {
            console.error("Error saving document", error);
            toast.error(error?.response?.data?.message || "Failed to save document");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (doc) => {
        if (!canManage) {
            return;
        }

        setEditingId(doc.id);
        setFormData({
            employeeId: String(doc.employeeId || ""),
            documentType: doc.documentType || "JOINING_LETTER",
            title: doc.title || "",
            description: doc.description || "",
        });
        setFile(null);
    };

    const handleDelete = async (id) => {
        if (!canManage) {
            toast.error("You do not have permission to delete documents");
            return;
        }

        if (!window.confirm("Are you sure you want to delete this document?")) {
            return;
        }

        try {
            await axios.delete(`${BASE_URL}/hr-docs/delete/${id}?requesterUserId=${userId}`);
            toast.success("Document deleted successfully");
            fetchDocuments();
        } catch (error) {
            console.error("Error deleting document", error);
            toast.error(error?.response?.data?.message || "Failed to delete document");
        }
    };

    const downloadDocument = async (docId, fallbackName) => {
        try {
            const response = await axios.get(
                `${BASE_URL}/hr-docs/download/${docId}?requesterUserId=${userId}`,
                {
                    responseType: "blob",
                }
            );

            const disposition = response.headers["content-disposition"] || "";
            const fileNameMatch = disposition.match(/filename="?([^\"]+)"?/i);
            const fileName = fileNameMatch?.[1] || fallbackName || "document";

            const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = blobUrl;
            link.setAttribute("download", fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("Error downloading document", error);
            toast.error(error?.response?.data?.message || "Failed to download document");
        }
    };

    return (
        <div className="wrapper" style={{ overflowY: "auto" }}>
            <section className="content-header">
                <div className="container-fluid">
                    <div className="row mb-2">
                        <div className="col-sm-6">
                            <h1 className="all-heading m-0">Document Repository</h1>
                            <span className="display-inline sub-heading">
                                Upload and manage HR documents
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="content">
                <div className="container-fluid">
                    {!canView && (
                        <div className="alert alert-warning">
                            You do not have permission to access this module.
                        </div>
                    )}

                    {canView && (
                        <>
                            {canManage && (
                                <div className="card cardHover rounded-4 border-0 mb-3">
                                    <div className="card-body">
                                        <h5 className="mb-3">{editingId ? "Edit Document" : "Upload Document"}</h5>
                                        <form onSubmit={handleSubmit}>
                                            <div className="row">
                                                <div className="col-md-4 mb-3">
                                                    <label className="form-label">Employee</label>
                                                    <select
                                                        className="form-control"
                                                        name="employeeId"
                                                        value={formData.employeeId}
                                                        onChange={handleInputChange}
                                                        required
                                                    >
                                                        <option value="">Select employee</option>
                                                        {employees.map((emp) => (
                                                            <option key={emp.id} value={emp.id}>
                                                                {emp.firstname} {emp.lastname}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="col-md-4 mb-3">
                                                    <label className="form-label">Document Type <span style={{ color: 'red' }}>*</span></label>
                                                    <select
                                                        className="form-control"
                                                        name="documentType"
                                                        value={formData.documentType}
                                                        onChange={handleInputChange}
                                                        required
                                                    >

                                                        {DOCUMENT_TYPES.map((type) => (
                                                            <option key={type.value} value={type.value}>
                                                                {type.label}
                                                            </option>
                                                        ))}
                                                    </select>

                                                </div>

                                                <div className="col-md-4 mb-3">
                                                    <label className="form-label">File</label>
                                                    <input
                                                        type="file"
                                                        className="form-control"
                                                        onChange={handleFileChange}
                                                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                                        required={!editingId}
                                                    />
                                                </div>

                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label">Title</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        name="title"
                                                        value={formData.title}
                                                        onChange={handleInputChange}
                                                        placeholder="Enter document title (not type)"
                                                    />
                                                </div>

                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label">Description</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        name="description"
                                                        value={formData.description}
                                                        onChange={handleInputChange}
                                                        placeholder="Optional description"
                                                    />
                                                </div>
                                            </div>

                                            <button className="btn btn-add me-2" type="submit" disabled={isLoading}>
                                                {editingId ? "Update" : "Upload"}
                                            </button>
                                            {editingId && (
                                                <button
                                                    className="btn btn-secondary"
                                                    type="button"
                                                    onClick={resetForm}
                                                    disabled={isLoading}
                                                >
                                                    Cancel Edit
                                                </button>
                                            )}
                                        </form>
                                    </div>
                                </div>
                            )}

                            <div className="card cardHover rounded-4 border-0">
                                <div className="card-body">
                                    <div className="row mb-3">
                                        <div className="col-md-4">
                                            <label className="form-label">Filter by type</label>
                                            <select
                                                className="form-control"
                                                value={filterType}
                                                onChange={(e) => setFilterType(e.target.value)}
                                            >
                                                <option value="">All types</option>
                                                {DOCUMENT_TYPES.map((type) => (
                                                    <option key={type.value} value={type.value}>
                                                        {type.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div style={{ overflowX: "auto" }}>
                                        <table className="table table-bordered table-hover" style={{ minWidth: "1000px" }}>
                                            <thead>
                                                <tr>
                                                    {canManage && <th>Employee ID</th>}
                                                    {DOCUMENT_TYPES.map((type) => (
                                                        <th key={type.value}>{type.label}</th>
                                                    ))}
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {isLoading ? (
                                                    <tr>
                                                        <td colSpan={canManage ? DOCUMENT_TYPES.length + 2 : DOCUMENT_TYPES.length + 1}>Loading...</td>
                                                    </tr>
                                                ) : filteredDocuments.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={canManage ? DOCUMENT_TYPES.length + 2 : DOCUMENT_TYPES.length + 1}>No documents found</td>
                                                    </tr>
                                                ) : (
                                                    (() => {
                                                        // Group documents by employeeId and documentType
                                                        const grouped = {};
                                                        filteredDocuments.forEach((doc) => {
                                                            const empId = doc.employeeId || "unknown";
                                                            if (!grouped[empId]) grouped[empId] = {};
                                                            if (!grouped[empId][doc.documentType]) grouped[empId][doc.documentType] = [];
                                                            grouped[empId][doc.documentType].push(doc);
                                                        });
                                                        // Track selected document type for action
                                                        let selectedDocType = DOCUMENT_TYPES[0].value;
                                                        return Object.entries(grouped).map(([empId, docsByType]) => (
                                                            <tr key={empId}>
                                                                {canManage && <td>{empId}</td>}
                                                                {DOCUMENT_TYPES.map((type) => {
                                                                    const docs = docsByType[type.value] || [];
                                                                    return (
                                                                        <td key={type.value}>
                                                                            {docs.length > 0 ? (
                                                                                <ul style={{ listStyle: "none", padding: 0 }}>
                                                                                    {docs.map((doc) => {
                                                                                        // Show only title and file extension
                                                                                        const ext = doc.originalFileName ? doc.originalFileName.split('.').pop() : '';
                                                                                        return (
                                                                                            <li key={doc.id} style={{ marginBottom: "8px" }}>
                                                                                                <div>{doc.title || "-"} {ext ? <span style={{ color: '#888' }}>.{ext}</span> : ''}</div>
                                                                                            </li>
                                                                                        );
                                                                                    })}
                                                                                </ul>
                                                                            ) : "-"}
                                                                        </td>
                                                                    );
                                                                })}
                                                                <td>
                                                                    <select
                                                                        className="form-select form-select-sm mb-2"
                                                                        onChange={e => selectedDocType = e.target.value}
                                                                    >
                                                                        {DOCUMENT_TYPES.map(type => (
                                                                            <option key={type.value} value={type.value}>{type.label}</option>
                                                                        ))}
                                                                    </select>
                                                                    <button
                                                                        className="btn btn-sm btn-success me-2"
                                                                        onClick={() => {
                                                                            const docs = docsByType[selectedDocType] || [];
                                                                            if (docs.length > 0) downloadDocument(docs[0].id, docs[0].originalFileName);
                                                                        }}
                                                                    >
                                                                        Download
                                                                    </button>
                                                                    {canManage && (
                                                                        <>
                                                                            <button
                                                                                className="btn btn-sm btn-primary me-2"
                                                                                onClick={() => {
                                                                                    const docs = docsByType[selectedDocType] || [];
                                                                                    if (docs.length > 0) handleEdit(docs[0]);
                                                                                }}
                                                                            >
                                                                                Edit
                                                                            </button>
                                                                            <button
                                                                                className="btn btn-sm btn-danger"
                                                                                onClick={() => {
                                                                                    const docs = docsByType[selectedDocType] || [];
                                                                                    if (docs.length > 0) handleDelete(docs[0].id);
                                                                                }}
                                                                            >
                                                                                Delete
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ));
                                                    })()
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </section>
        </div>
    );
};

export default HRDocs;
