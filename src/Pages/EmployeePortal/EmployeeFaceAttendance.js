import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import axios from "axios";
import { toast } from "react-toastify";

const EmployeeFaceAttendance = ({ employee }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState(null);
    const [mode, setMode] = useState(null);
    const [todayStatus, setTodayStatus] = useState(null);
    const streamRef = useRef(null);
    const BASE_URL = process.env.REACT_APP_BASE_URL;

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
                console.error("Error loading models:", err);
                toast.error("Failed to load face recognition models");
            }
        };
        loadModels();
        fetchTodayStatus();

        return () => {
            stopCamera();
        };
    }, []);

    const fetchTodayStatus = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/attendance/current-status/${employee.id}`);
            setTodayStatus(res.data);
        } catch (err) {
            setTodayStatus(null);
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: "user" },
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
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setCameraActive(false);
    };

    const handleScan = async (scanMode) => {
        if (!modelsLoaded || !videoRef.current || processing) return;

        setMode(scanMode);
        setProcessing(true);
        setResult(null);

        try {
            const detection = await faceapi
                .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                setResult({ success: false, message: "No face detected. Please position your face clearly." });
                setProcessing(false);
                return;
            }

            if (canvasRef.current && videoRef.current) {
                const dims = faceapi.matchDimensions(canvasRef.current, videoRef.current, true);
                const resized = faceapi.resizeResults(detection, dims);
                faceapi.draw.drawDetections(canvasRef.current, resized);
                faceapi.draw.drawFaceLandmarks(canvasRef.current, resized);
            }

            const descriptor = Array.from(detection.descriptor);
            const faceDescriptor = JSON.stringify(descriptor);

            let ipAddress = "Unknown";
            try {
                const ipRes = await axios.get("https://api.ipify.org?format=json");
                ipAddress = ipRes.data.ip;
            } catch {
                // IP fetch failed
            }

            const endpoint =
                scanMode === "clock-in"
                    ? `${BASE_URL}/attendance/face-clock-in`
                    : `${BASE_URL}/attendance/face-clock-out`;

            const res = await axios.post(endpoint, { faceDescriptor, ipAddress, employeeId: String(employee.id) });
            setResult(res.data);

            if (res.data.success) {
                toast.success(res.data.message);
                fetchTodayStatus();
            } else {
                toast.warning(res.data.message);
            }
        } catch (err) {
            console.error("Scan error:", err);
            setResult({ success: false, message: "Error processing face scan" });
            toast.error("Face scan failed");
        }

        setProcessing(false);
    };

    return (
        <div className="row">
            <div className="col-lg-8 col-md-12">
                <div className="card card-primary card-outline">
                    <div className="card-header">
                        <h3 className="card-title">
                            <i className="fas fa-camera mr-2"></i>
                            Face Clock In / Out
                        </h3>
                        <div className="card-tools">
                            {!modelsLoaded && <span className="badge badge-warning">Loading models...</span>}
                            {modelsLoaded && !cameraActive && <span className="badge badge-secondary">Camera off</span>}
                            {modelsLoaded && cameraActive && <span className="badge badge-success">Camera active</span>}
                        </div>
                    </div>

                    <div className="card-body text-center">
                        <div
                            className="position-relative d-inline-block mb-3"
                            style={{
                                width: "100%",
                                maxWidth: "640px",
                                background: "#1a1a2e",
                                borderRadius: "12px",
                                overflow: "hidden",
                                minHeight: "360px",
                            }}
                        >
                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                playsInline
                                style={{ width: "100%", display: cameraActive ? "block" : "none" }}
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
                                    style={{ height: "360px", color: "#8892b0" }}
                                >
                                    <i className="fas fa-video-slash mb-3" style={{ fontSize: "4rem" }}></i>
                                    <p>Camera is not active</p>
                                    <button
                                        className="btn btn-primary btn-lg mt-2"
                                        onClick={startCamera}
                                        disabled={!modelsLoaded}
                                    >
                                        <i className="fas fa-power-off mr-2"></i>
                                        Start Camera
                                    </button>
                                </div>
                            )}
                        </div>

                        {cameraActive && (
                            <div className="d-flex justify-content-center gap-3 mt-3">
                                <button
                                    className="btn btn-success btn-lg mx-2"
                                    onClick={() => handleScan("clock-in")}
                                    disabled={processing}
                                    style={{ minWidth: "180px" }}
                                >
                                    {processing && mode === "clock-in" ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin mr-2"></i>
                                            Scanning...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-sign-in-alt mr-2"></i>
                                            Clock In
                                        </>
                                    )}
                                </button>

                                <button
                                    className="btn btn-danger btn-lg mx-2"
                                    onClick={() => handleScan("clock-out")}
                                    disabled={processing}
                                    style={{ minWidth: "180px" }}
                                >
                                    {processing && mode === "clock-out" ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin mr-2"></i>
                                            Scanning...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-sign-out-alt mr-2"></i>
                                            Clock Out
                                        </>
                                    )}
                                </button>

                                <button className="btn btn-secondary btn-lg mx-2" onClick={stopCamera}>
                                    <i className="fas fa-stop mr-2"></i>
                                    Stop
                                </button>
                            </div>
                        )}

                        {result && (
                            <div
                                className={`alert mt-3 ${result.success ? "alert-success" : "alert-warning"}`}
                                style={{ maxWidth: "640px", margin: "15px auto 0" }}
                            >
                                <i className={`fas ${result.success ? "fa-check-circle" : "fa-exclamation-triangle"} mr-2`}></i>
                                <strong>{result.message}</strong>
                                {result.totalWorkingHours > 0 && (
                                    <span className="ml-2">| Working Hours: {result.totalWorkingHours}h</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Side - Today Status & Instructions */}
            <div className="col-lg-4 col-md-12">
                <div className="card card-info card-outline">
                    <div className="card-header">
                        <h3 className="card-title">
                            <i className="fas fa-info-circle mr-2"></i>
                            Today's Status
                        </h3>
                    </div>
                    <div className="card-body">
                        {todayStatus ? (
                            <div>
                                <p>
                                    <strong>Clock In:</strong>{" "}
                                    {todayStatus.inTime
                                        ? new Date(todayStatus.inTime).toLocaleTimeString()
                                        : "Not yet"}
                                </p>
                                <p>
                                    <strong>Clock Out:</strong>{" "}
                                    {todayStatus.outTime
                                        ? new Date(todayStatus.outTime).toLocaleTimeString()
                                        : "Not yet"}
                                </p>
                                {todayStatus.totalWorkingHours > 0 && (
                                    <p>
                                        <strong>Working Hours:</strong> {todayStatus.totalWorkingHours}h
                                    </p>
                                )}
                                <span
                                    className={`badge ${todayStatus.status === "PRESENT"
                                        ? "badge-success"
                                        : todayStatus.status === "HALF_DAY"
                                            ? "badge-warning"
                                            : "badge-danger"
                                        }`}
                                >
                                    {todayStatus.status}
                                </span>
                            </div>
                        ) : (
                            <p className="text-muted">No attendance record for today.</p>
                        )}
                    </div>
                </div>

                <div className="card card-secondary card-outline">
                    <div className="card-header">
                        <h3 className="card-title">
                            <i className="fas fa-list-ol mr-2"></i>
                            Instructions
                        </h3>
                    </div>
                    <div className="card-body">
                        <ol className="pl-3 mb-0">
                            <li className="mb-2">Click "Start Camera" to begin</li>
                            <li className="mb-2">Position your face clearly in view</li>
                            <li className="mb-2">Click <strong>Clock In</strong> to mark arrival</li>
                            <li className="mb-2">Click <strong>Clock Out</strong> when leaving</li>
                            <li>Working hours are calculated automatically</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeFaceAttendance;
