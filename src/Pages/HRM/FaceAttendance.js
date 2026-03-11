import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import axios from "axios";
import { toast } from "react-toastify";

const FaceAttendance = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState(null);
    const [mode, setMode] = useState(null); // "clock-in" or "clock-out"
    const [recentLogs, setRecentLogs] = useState([]);
    const [employees, setEmployees] = useState({});
    const streamRef = useRef(null);

    // Load face-api models and today's scan history
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
        fetchEmployees();
        fetchTodayScans();

        return () => {
            stopCamera();
        };
    }, []);

    const fetchEmployees = async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_BASE_URL}/user/getall`);
            const empMap = {};
            (res.data || []).forEach((e) => {
                empMap[e.id] = e;
            });
            setEmployees(empMap);
        } catch (err) {
            console.error("Error fetching employees:", err);
        }
    };

    const fetchTodayScans = async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_BASE_URL}/attendance/today-face-scans`);
            const records = res.data || [];
            const logs = records.map((r) => {
                const emp = employees[r.employeeId];
                const empName = emp ? `${emp.firstname} ${emp.lastname}` : `Emp #${r.employeeId}`;
                return {
                    time: r.outTime
                        ? new Date(r.outTime).toLocaleTimeString()
                        : new Date(r.inTime).toLocaleTimeString(),
                    action: r.outTime ? "Clock Out" : "Clock In",
                    employeeId: r.employeeId,
                    employeeName: empName,
                    totalWorkingHours: r.totalWorkingHours,
                    success: true,
                };
            }).reverse();
            setRecentLogs(logs);
        } catch (err) {
            console.error("Error fetching today's scans:", err);
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
            // Detect face and get descriptor
            const detection = await faceapi
                .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                setResult({ success: false, message: "No face detected. Please position your face clearly." });
                addLog(scanMode, { message: "No face detected" }, false);
                setProcessing(false);
                return;
            }

            // Draw detection on canvas
            if (canvasRef.current && videoRef.current) {
                const dims = faceapi.matchDimensions(canvasRef.current, videoRef.current, true);
                const resized = faceapi.resizeResults(detection, dims);
                faceapi.draw.drawDetections(canvasRef.current, resized);
                faceapi.draw.drawFaceLandmarks(canvasRef.current, resized);
            }

            const descriptor = Array.from(detection.descriptor);
            const faceDescriptor = JSON.stringify(descriptor);

            // Get IP address
            let ipAddress = "Unknown";
            try {
                const ipRes = await axios.get("https://api.ipify.org?format=json");
                ipAddress = ipRes.data.ip;
            } catch {
                // IP fetch failed, continue with Unknown
            }

            // Call backend
            const endpoint =
                scanMode === "clock-in"
                    ? `${process.env.REACT_APP_BASE_URL}/attendance/face-clock-in`
                    : `${process.env.REACT_APP_BASE_URL}/attendance/face-clock-out`;

            const res = await axios.post(endpoint, { faceDescriptor, ipAddress });
            setResult(res.data);

            if (res.data.success) {
                toast.success(res.data.message);
                addLog(scanMode, res.data, true);
            } else {
                toast.warning(res.data.message);
                addLog(scanMode, res.data, false);
            }
        } catch (err) {
            console.error("Scan error:", err);
            setResult({ success: false, message: "Error processing face scan" });
            toast.error("Face scan failed");
            addLog(scanMode, { message: "Error processing face scan" }, false);
        }

        setProcessing(false);
    };

    const addLog = (action, data, success) => {
        const emp = data.employeeId ? employees[data.employeeId] : null;
        const empName = emp ? `${emp.firstname} ${emp.lastname}` : (data.employeeId ? `Emp #${data.employeeId}` : null);
        const log = {
            time: new Date().toLocaleTimeString(),
            action: action === "clock-in" ? "Clock In" : "Clock Out",
            employeeId: data.employeeId || null,
            employeeName: empName,
            totalWorkingHours: data.totalWorkingHours,
            success: success,
            message: !success ? (data.message || "Unknown error") : null,
        };
        setRecentLogs((prev) => [log, ...prev].slice(0, 20));
    };

    return (
        <div className="row">
            {/* Left: Camera and Controls */}
            <div className="col-lg-8 col-md-12">
                <div className="card card-primary card-outline">
                    <div className="card-header">
                        <h3 className="card-title">
                            <i className="fas fa-camera mr-2"></i>
                            Face Recognition Attendance
                        </h3>
                        <div className="card-tools">
                            {!modelsLoaded && (
                                <span className="badge badge-warning">Loading models...</span>
                            )}
                            {modelsLoaded && !cameraActive && (
                                <span className="badge badge-secondary">Camera off</span>
                            )}
                            {modelsLoaded && cameraActive && (
                                <span className="badge badge-success">Camera active</span>
                            )}
                        </div>
                    </div>

                    <div className="card-body text-center">
                        {/* Camera View */}
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
                                    style={{ height: "360px", color: "#8892b0" }}
                                >
                                    <i
                                        className="fas fa-video-slash mb-3"
                                        style={{ fontSize: "4rem" }}
                                    ></i>
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

                        {/* Action Buttons */}
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

                                <button
                                    className="btn btn-secondary btn-lg mx-2"
                                    onClick={stopCamera}
                                >
                                    <i className="fas fa-stop mr-2"></i>
                                    Stop Camera
                                </button>
                            </div>
                        )}

                        {/* Result Display */}
                        {result && (
                            <div
                                className={`alert mt-3 ${result.success ? "alert-success" : "alert-warning"
                                    }`}
                                style={{ maxWidth: "640px", margin: "15px auto 0" }}
                            >
                                <i
                                    className={`fas ${result.success ? "fa-check-circle" : "fa-exclamation-triangle"
                                        } mr-2`}
                                ></i>
                                <strong>{result.message}</strong>
                                {result.employeeId && (
                                    <span className="ml-2">(Employee ID: {result.employeeId})</span>
                                )}
                                {result.totalWorkingHours > 0 && (
                                    <span className="ml-2">
                                        | Working Hours: {result.totalWorkingHours}h
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right: Recent Activity */}
            <div className="col-lg-4 col-md-12">
                <div className="card card-info card-outline">
                    <div className="card-header">
                        <h3 className="card-title">
                            <i className="fas fa-history mr-2"></i>
                            Recent Activity
                        </h3>
                    </div>
                    <div className="card-body p-0">
                        {recentLogs.length === 0 ? (
                            <div className="text-center p-4 text-muted">
                                <i className="fas fa-inbox" style={{ fontSize: "2rem" }}></i>
                                <p className="mt-2">No scans yet today</p>
                            </div>
                        ) : (
                            <ul className="list-group list-group-flush">
                                {recentLogs.map((log, idx) => (
                                    <li
                                        key={idx}
                                        className="list-group-item d-flex justify-content-between align-items-center"
                                    >
                                        <div>
                                            {log.success ? (
                                                <span
                                                    className={`badge ${log.action === "Clock In"
                                                        ? "badge-success"
                                                        : "badge-danger"
                                                        } mr-2`}
                                                >
                                                    {log.action}
                                                </span>
                                            ) : (
                                                <span className="badge badge-dark mr-2">
                                                    Failed
                                                </span>
                                            )}
                                            <small>
                                                {log.success
                                                    ? (log.employeeName || `Emp #${log.employeeId}`)
                                                    : (log.message || "Employee not found")}
                                            </small>
                                        </div>
                                        <small className="text-muted">{log.time}</small>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Instructions */}
                <div className="card card-secondary card-outline">
                    <div className="card-header">
                        <h3 className="card-title">
                            <i className="fas fa-info-circle mr-2"></i>
                            Instructions
                        </h3>
                    </div>
                    <div className="card-body">
                        <ol className="pl-3 mb-0">
                            <li className="mb-2">Start the camera</li>
                            <li className="mb-2">Position your face clearly in view</li>
                            <li className="mb-2">
                                Click <strong>Clock In</strong> to mark attendance login
                            </li>
                            <li className="mb-2">
                                Click <strong>Clock Out</strong> when leaving
                            </li>
                            <li>Working hours are calculated automatically</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FaceAttendance;
