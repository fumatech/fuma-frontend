import React, { useState, useEffect } from "react";
import axios from "axios";

const EmployeeNotices = () => {
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHolidays();
    }, []);

    const fetchHolidays = async () => {
        try {
            const res = await axios.get(
                `${process.env.REACT_APP_BASE_URL}/holiday/getall`
            );
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const upcoming = (res.data || [])
                .filter((h) => new Date(h.startDate) >= today)
                .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
            setHolidays(upcoming);
        } catch (error) {
            console.error("Failed to load holidays:", error);
        }
        setLoading(false);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const getDaysUntil = (dateStr) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(dateStr);
        target.setHours(0, 0, 0, 0);
        const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
        if (diff === 0) return "Today";
        if (diff === 1) return "Tomorrow";
        return `In ${diff} days`;
    };

    if (loading) {
        return (
            <div className="text-center p-5">
                <i className="fas fa-spinner fa-spin fa-2x"></i>
                <p className="mt-2">Loading notices...</p>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            <div className="row mb-3">
                <div className="col-12">
                    <h4 className="font-weight-bold">
                        <i className="fas fa-bullhorn mr-2 text-primary"></i>
                        Notices & Upcoming Holidays
                    </h4>
                    <hr />
                </div>
            </div>

            {holidays.length === 0 ? (
                <div className="text-center p-5 text-muted">
                    <i className="fas fa-calendar-check fa-3x mb-3"></i>
                    <h5>No upcoming holidays</h5>
                </div>
            ) : (
                <div className="row">
                    {holidays.map((holiday, index) => {
                        const daysUntil = getDaysUntil(holiday.startDate);
                        const isToday = daysUntil === "Today";
                        const isTomorrow = daysUntil === "Tomorrow";

                        return (
                            <div className="col-md-6 col-lg-4 mb-3" key={holiday.id || index}>
                                <div
                                    className={`card shadow-sm h-100 border-left-${isToday ? "danger" : isTomorrow ? "warning" : "primary"}`}
                                    style={{
                                        borderLeft: `4px solid ${isToday ? "#dc3545" : isTomorrow ? "#ffc107" : "#007bff"}`,
                                    }}
                                >
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between align-items-start">
                                            <h5 className="card-title mb-1 font-weight-bold">
                                                {holiday.name}
                                            </h5>
                                            <span
                                                className={`badge badge-${isToday ? "danger" : isTomorrow ? "warning" : "info"} badge-pill`}
                                            >
                                                {daysUntil}
                                            </span>
                                        </div>
                                        <p className="text-muted mb-1 mt-2">
                                            <i className="fas fa-calendar-alt mr-2"></i>
                                            {formatDate(holiday.startDate)}
                                            {holiday.endDate &&
                                                holiday.endDate !== holiday.startDate && (
                                                    <span> — {formatDate(holiday.endDate)}</span>
                                                )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default EmployeeNotices;
