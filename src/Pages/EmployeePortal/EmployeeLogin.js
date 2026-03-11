import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "admin-lte/dist/css/adminlte.min.css";
import "../LoginPage/LoginPage.css";
import axios from "axios";
import Form from "react-bootstrap/Form";
import { toast } from "react-toastify";

const EmployeeLogin = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);

    useEffect(() => {
        const storedEmail = localStorage.getItem("employeeEmail");
        if (storedEmail) {
            setEmail(storedEmail);
            setRememberMe(true);
        }
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            const response = await axios.post(
                `${process.env.REACT_APP_BASE_URL}/user/login`,
                { email, password },
                { withCredentials: true }
            );

            if (response.data === "Login successful") {
                if (rememberMe) {
                    localStorage.setItem("employeeEmail", email);
                } else {
                    localStorage.removeItem("employeeEmail");
                }

                sessionStorage.setItem("employeeEmail", email);

                toast.success("Login successful! Redirecting...");

                setTimeout(() => {
                    window.location.href = "/fumamain/employee/dashboard";
                }, 1500);
            } else {
                toast.error("Invalid email or password");
            }
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Login failed. Please check your credentials."
            );
            console.error("Login error:", error);
        }
    };

    return (
        <div className="login_background">
            <div className="container-fluid h-100">
                <div className="row h-100 justify-content-center align-items-center">
                    <div className="col-lg-6 login_backgroundimg d-none d-lg-flex align-items-center justify-content-center">
                        <h1 className="login_img_text"></h1>
                    </div>
                    <div className="col-12 col-md-8 col-lg-6 col-xl-5 d-flex align-items-center justify-content-center p-0">
                        <div className="login_box">
                            <form onSubmit={handleSubmit} className="w-100">
                                <div className="login_outer_borderbg">
                                    <div className="inner_loginBox bg-transparent">
                                        <p className="Register_With text-light">
                                            Employee Portal Login
                                        </p>
                                        <div>
                                            <div className="row">
                                                <div className="col-12">
                                                    <label className="ms-2 fs-5 titlew login-text">
                                                        Email
                                                    </label>
                                                    <div className="login_input_div">
                                                        <input
                                                            type="text"
                                                            placeholder="Your Email"
                                                            className="login_input text-light"
                                                            value={email}
                                                            onChange={(e) => setEmail(e.target.value)}
                                                        />
                                                    </div>
                                                    <label className="ms-2 fs-5 titlew login-text">
                                                        Password
                                                    </label>
                                                    <div className="login_input_div">
                                                        <input
                                                            type="password"
                                                            placeholder="Enter password"
                                                            className="login_input text-light"
                                                            value={password}
                                                            onChange={(e) => setPassword(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="icheck-primary ms-3">
                                                    <Form.Check
                                                        className="login-text fw-semibold ms-4"
                                                        type="switch"
                                                        id="employee-remember-switch"
                                                        label="Remember Me"
                                                        checked={rememberMe}
                                                        onChange={(e) => setRememberMe(e.target.checked)}
                                                    />
                                                </div>
                                                <button type="submit" className="login_signop_btn">
                                                    Log in
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeLogin;
