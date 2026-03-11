import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const EmployeePortalWrapper = ({ Component }) => {
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEmployee = async () => {
            const email = sessionStorage.getItem("userEmail");
            if (!email) {
                navigate("/");
                return;
            }
            try {
                const res = await axios.get(
                    `${process.env.REACT_APP_BASE_URL}/user/email/${email}`
                );
                if (res.data) {
                    setEmployee(res.data);
                }
            } catch (error) {
                console.error("Error fetching employee data:", error);
            }
            setLoading(false);
        };
        fetchEmployee();
    }, [navigate]);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center p-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="sr-only">Loading...</span>
                </div>
            </div>
        );
    }

    if (!employee) return null;

    return (
        <div className="content-wrapper">
            <section className="content">
                <div className="container-fluid pt-3">
                    <Component employee={employee} />
                </div>
            </section>
        </div>
    );
};

export default EmployeePortalWrapper;
