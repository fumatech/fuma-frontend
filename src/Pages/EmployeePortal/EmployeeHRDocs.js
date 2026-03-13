import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const EmployeeHRDocs = ({ employee }) => {
    const BASE_URL = process.env.REACT_APP_BASE_URL;
    const [documents, setDocuments] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!employee?.id) return;
        const fetchDocuments = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get(
                    `${BASE_URL}/hr-docs/my-docs/${employee.id}?requesterUserId=${employee.id}`
                );
                setDocuments(response.data || []);
            } catch (error) {
                toast.error("Unable to load documents");
            } finally {
                setIsLoading(false);
            }
        };
        fetchDocuments();
    }, [employee]);

    if (!employee) return null;

    return (
        <div className="container-fluid pt-3">
            <h2 className="mb-3">My HR Documents</h2>
            {isLoading ? (
                <div>Loading...</div>
            ) : documents.length === 0 ? (
                <div className="alert alert-info">No documents found.</div>
            ) : (
                <table className="table table-bordered table-hover">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Type</th>
                            <th>Description</th>
                            <th>Uploaded By</th>
                            <th>Download</th>
                        </tr>
                    </thead>
                    <tbody>
                        {documents.map((doc) => (
                            <tr key={doc.id}>
                                <td>{doc.title}</td>
                                <td>{doc.documentType}</td>
                                <td>{doc.description}</td>
                                <td>{doc.uploadedByName || "HR/Admin"}</td>
                                <td>
                                    <button
                                        className="btn btn-sm btn-primary"
                                        onClick={async () => {
                                            try {
                                                const response = await axios.get(
                                                    `${BASE_URL}/hr-docs/download/${doc.id}?requesterUserId=${employee.id}`,
                                                    { responseType: "blob" }
                                                );
                                                const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
                                                const link = document.createElement("a");
                                                link.href = blobUrl;
                                                link.setAttribute("download", doc.originalFileName || "document");
                                                document.body.appendChild(link);
                                                link.click();
                                                link.remove();
                                                window.URL.revokeObjectURL(blobUrl);
                                            } catch (error) {
                                                toast.error("Failed to download document");
                                            }
                                        }}
                                    >
                                        Download
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default EmployeeHRDocs;
