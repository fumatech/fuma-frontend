import React from "react";
import { useNavigate } from "react-router-dom";
import "./BusinessFunctionCards.css";

const BusinessFunctionCards = () => {
    const navigate = useNavigate();

    const cards = [
        {
            title: "Management",
            icon: "fas fa-chart-line",
            route: "/Reporting", // Mapping to new Reporting module as high-level view
            color: "bg-gradient-primary",
        },
        {
            title: "Marketing",
            icon: "fas fa-bullhorn", // Megaphone
            route: "/Campaigns", // /CRMDashboard or /Campaigns
            color: "bg-gradient-info",
        },
        {
            title: "Sales",
            icon: "fas fa-chart-bar", // Trending Up / Revenue
            route: "/AllSaleOrders",
            color: "bg-gradient-success",
        },
        {
            title: "Operations",
            icon: "fas fa-cogs", // Gear / Settings
            route: "/ListProducts",
            color: "bg-gradient-warning",
        },
        {
            title: "HR",
            icon: "fas fa-users",
            route: "/HRMDashboard",
            color: "bg-gradient-danger",
        },
        {
            title: "Accounts",
            icon: "fas fa-calculator", // Calculator / Wallet
            route: "/Accounts",
            color: "bg-gradient-secondary",
        },
        {
            title: "Legal",
            icon: "fas fa-file-contract", // Document / Shield
            route: "/Legal", // Placeholder
            color: "bg-gradient-dark",
        },
    ];

    return (
        <div className="row mb-4 justify-content-center">
            {cards.map((card, index) => (
                <div key={index} className="col-lg-3 col-md-4 col-sm-6 col-12 mb-3">
                    <div
                        className={`small-box ${card.color} business-card`}
                        onClick={() => navigate(card.route)}
                        style={{ cursor: "pointer", minHeight: "140px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}
                    >
                        <div className="inner text-center">
                            <i className={`${card.icon} fa-3x mb-3`}></i>
                            <h6 style={{ fontSize: "1.1rem", fontWeight: "bold", margin: 0 }}>{card.title}</h6>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default BusinessFunctionCards;
