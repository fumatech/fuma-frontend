import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const BASE_URL = process.env.REACT_APP_BASE_URL;

const SignatureUpload = () => {
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);

  // 🔹 Fetch uploaded files
  const fetchFiles = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/signature-image/get-all`);
      setFiles(res.data || []);
    } catch (error) {
      console.error("Failed to fetch files", error);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const uploadFile = async () => {
    if (!file) {
      toast.warning("Please select a file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post(`${BASE_URL}/signature-image/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("File uploaded successfully");
      setFile(null);
      fetchFiles();
    } catch (error) {
      //console.error("Upload failed", error);
      toast.error("Failed To Upload File");
    }
  };

  return (
    <div className="container mt-4">
      <h3 className="mb-3">Signature Upload</h3>

      <div className="card p-3 mb-4">
        <input
          type="file"
          className="form-control"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button className="btn btn-primary mt-3" onClick={uploadFile}>
          Upload
        </button>
      </div>

      <h4>Uploaded Signatures</h4>

      <table className="table table-bordered mt-3">
        <thead className="table-dark">
          <tr>
            <th>#</th>
            <th>Uploaded File Name</th>
            <th>Preview</th>
            <th>Download</th>
          </tr>
        </thead>

        <tbody>
          {files.length === 0 && (
            <tr>
              <td colSpan="4" className="text-center">
                No files uploaded
              </td>
            </tr>
          )}

          {files.map((item, index) => {
            if (!item.image) return null;

            const fileName = item.image.split("/").pop();
            const isImage = /\.(jpg|jfif|jpeg|png|gif)$/i.test(fileName);

            return (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>{fileName}</td>

                <td>
                  {isImage ? (
                    <img
                      src={`${BASE_URL}${item.image}`}
                      alt="preview"
                      width="80"
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        setPreviewImage(`${BASE_URL}${item.image}`)
                      }
                    />
                  ) : (
                    "No Image"
                  )}
                </td>

                <td>
                  <a
                    href={`${BASE_URL}/files/download/${fileName}`}
                    className="btn btn-success btn-sm"
                  >
                    Download
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {previewImage && (
        <div
          className="modal show fade"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content p-3">
              <img
                src={previewImage}
                alt="full preview"
                style={{ width: "100%" }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignatureUpload;
