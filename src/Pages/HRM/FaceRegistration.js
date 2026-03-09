import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import axios from "axios";
import { toast } from "react-toastify";

const FaceRegistration = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState("");
    const [registeredFaces, setRegisteredFaces] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [captureCount, setCaptureCount] = useState(0);
    const [descriptors, setDescriptors] = useState([]);
    const streamRef = useRef(null);

    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = process.env.PUBLIC_URL + "/models";
            try {
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                ]);
                setModelsLoaded(true);
            } catch (err) {
                toast.error("Failed to load face recognition models");
            }
        };
        loadModels();
        fetchEmployees();
        fetchRegisteredFaces();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
            }
        };
    }, []);

    const fetchEmployees = async () => {
        try {
            const res = await axios.get(
                `${process.env.REACT_APP_BASE_URL}/user/getall`
            );
            setEmployees(res.data || []);
        } catch (err) {
            console.error("Error fetching employees:", err);
        }
    };

    const fetchRegisteredFaces = async () => {
        try {
            const res = await axios.get(
                `${process.env.REACT_APP_BASE_URL}/face-encoding/getall`
            );
            setRegisteredFaces(res.data || []);
        } catch (err) {
            console.error("Error fetching registered faces:", err);
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 480, height: 360, facingMode: "user" },
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setCameraActive(true);
        } catch (err) {
            toast.error("Camera access denied");
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setCameraActive(false);
    };

    const captureFace = async () => {
        if (!selectedEmployee) {
            toast.warning("Please select an employee first");
            return;
        }

        if (!videoRef.current || processing) return;
        setProcessing(true);

        try {
            const detection = await faceapi
                .detectSingleFace(
                    videoRef.current,
                    new faceapi.TinyFaceDetectorOptions()
                )
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                toast.warning("No face detected. Please try again.");
                setProcessing(false);
                return;
            }

            // Draw on canvas
            if (canvasRef.current) {
                const dims = faceapi.matchDimensions(
                    canvasRef.current,
                    videoRef.current,
                    true
                );
                const resized = faceapi.resizeResults(detection, dims);
                faceapi.draw.drawDetections(canvasRef.current, resized);
            }

            const desc = Array.from(detection.descriptor);
            setDescriptors((prev) => [...prev, desc]);
            setCaptureCount((prev) => prev + 1);
            toast.info(`Capture ${captureCount + 1} saved. Take multiple for better accuracy.`);
        } catch (err) {
            toast.error("Error capturing face");
        }

        setProcessing(false);
    };

    const registerFace = async () => {
        if (descriptors.length === 0) {
            toast.warning("Please capture at least one face image");
            return;
        }

        if (!selectedEmployee) {
            toast.warning("Please select an employee");
            return;
        }

        setProcessing(true);

        try {
            // Average the descriptors for more robust recognition
            const avgDescriptor = new Array(128).fill(0);
            for (const desc of descriptors) {
                for (let i = 0; i < 128; i++) {
                    avgDescriptor[i] += desc[i];
                }
            }
            for (let i = 0; i < 128; i++) {
                avgDescriptor[i] /= descriptors.length;
            }

            const employee = employees.find(
                (e) => String(e.id) === String(selectedEmployee)
            );
            const employeeName = employee
                ? `${employee.firstname} ${employee.lastname}`
                : "Unknown";

            await axios.post(
                `${process.env.REACT_APP_BASE_URL}/face-encoding/register`,
                {
                    employeeId: parseInt(selectedEmployee),
                    employeeName,
                    faceDescriptor: JSON.stringify(avgDescriptor),
                }
            );

            toast.success(`Face registered for ${employeeName}`);
            setDescriptors([]);
            setCaptureCount(0);
            setSelectedEmployee("");
            fetchRegisteredFaces();
        } catch (err) {
            toast.error("Failed to register face");
        }

        setProcessing(false);
    };

    const deleteFace = async (id) => {
        if (!window.confirm("Are you sure you want to delete this face registration?")) return;
        try {
            await axios.delete(
                `${process.env.REACT_APP_BASE_URL}/face-encoding/delete/${id}`
            );
            toast.success("Face registration deleted");
            fetchRegisteredFaces();
        } catch (err) {
            toast.error("Failed to delete");
        }
    };

    return (
        <div className="row">
            {/* Left: Registration */}
            <div className="col-lg-6 col-md-12">
                <div className="card card-primary card-outline">
                    <div className="card-header">
                        <h3 className="card-title">
                            <i className="fas fa-user-plus mr-2"></i>
                            Register Employee Face
                        </h3>
                    </div>
                    <div className="card-body">
                        {/* Employee Select */}
                        <div className="form-group">
                            <label>Select Employee</label>
                            <select
                                className="form-control"
                                value={selectedEmployee}
                                onChange={(e) => {
                                    setSelectedEmployee(e.target.value);
                                    setDescriptors([]);
                                    setCaptureCount(0);
                                }}
                            >
                                <option value="">-- Select Employee --</option>
                                {employees.map((emp) => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.firstname} {emp.lastname} (ID: {emp.id})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Camera */}
                        <div
                            className="text-center position-relative mb-3"
                            style={{
                                background: "#1a1a2e",
                                borderRadius: "8px",
                                overflow: "hidden",
                                minHeight: "280px",
                            }}
                        >
                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                playsInline
                                style={{
                                    width: "100%",
                                    display: cameraActive ? "block" : "none",
                                }}
                            />
                            <canvas
                                ref={canvasRef}
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: "100%",
                                    display: cameraActive ? "block" : "none",
                                }}
                            />
                            {!cameraActive && (
                                <div
                                    className="d-flex flex-column align-items-center justify-content-center"
                                    style={{ height: "280px", color: "#8892b0" }}
                                >
                                    <i className="fas fa-camera" style={{ fontSize: "3rem" }}></i>
                                    <p className="mt-2">Camera off</p>
                                </div>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="d-flex flex-wrap justify-content-center">
                            {!cameraActive ? (
                                <button
                                    className="btn btn-primary mx-1 mb-2"
                                    onClick={startCamera}
                                    disabled={!modelsLoaded}
                                >
                                    <i className="fas fa-video mr-1"></i> Start Camera
                                </button>
                            ) : (
                                <>
                                    <button
                                        className="btn btn-info mx-1 mb-2"
                                        onClick={captureFace}
                                        disabled={processing || !selectedEmployee}
                                    >
                                        <i className="fas fa-camera mr-1"></i>
                                        Capture ({captureCount})
                                    </button>
                                    <button
                                        className="btn btn-success mx-1 mb-2"
                                        onClick={registerFace}
                                        disabled={processing || descriptors.length === 0}
                                    >
                                        <i className="fas fa-save mr-1"></i>
                                        {processing ? "Saving..." : "Register Face"}
                                    </button>
                                    <button
                                        className="btn btn-secondary mx-1 mb-2"
                                        onClick={stopCamera}
                                    >
                                        <i className="fas fa-stop mr-1"></i> Stop
                                    </button>
                                </>
                            )}
                        </div>

                        {captureCount > 0 && (
                            <div className="alert alert-info mt-2 text-center">
                                {captureCount} capture(s) taken. Click{" "}
                                <strong>Register Face</strong> to save.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right: Registered Faces List */}
            <div className="col-lg-6 col-md-12">
                <div className="card card-success card-outline">
                    <div className="card-header">
                        <h3 className="card-title">
                            <i className="fas fa-users mr-2"></i>
                            Registered Employees ({registeredFaces.length})
                        </h3>
                    </div>
                    <div className="card-body p-0">
                        {registeredFaces.length === 0 ? (
                            <div className="text-center p-4 text-muted">
                                <i className="fas fa-user-slash" style={{ fontSize: "2rem" }}></i>
                                <p className="mt-2">No faces registered yet</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-striped table-hover mb-0">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Employee ID</th>
                                            <th>Name</th>
                                            <th>Registered</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {registeredFaces.map((face, idx) => (
                                            <tr key={face.id}>
                                                <td>{idx + 1}</td>
                                                <td>{face.employeeId}</td>
                                                <td>{face.employeeName}</td>
                                                <td>
                                                    {face.createdAt
                                                        ? new Date(face.createdAt).toLocaleDateString()
                                                        : "N/A"}
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => deleteFace(face.id)}
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FaceRegistration;
