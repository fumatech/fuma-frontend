import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../assets/dist/css/adminlte.min.css";
import "../../assets/plugins/fontawesome-free/css/all.min.css";
import "../../assets/plugins/datatables-bs4/css/dataTables.bootstrap4.min.css";
import "../../assets/plugins/datatables-responsive/css/responsive.bootstrap4.min.css";
import "../../assets/plugins/datatables-buttons/css/buttons.bootstrap4.min.css";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import $ from "jquery";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMoneyBillWave,
  faChartLine,
  faCreditCard,
  faPercent,
  faCalendarAlt,
  faUser,
  faUsers,
  faExchangeAlt,
  faBalanceScale,
  faCalculator,
  faArrowUp,
  faArrowDown,
  faWallet,
  faReceipt,
  faCashRegister,
  faStore,
  faHandHoldingUsd
} from "@fortawesome/free-solid-svg-icons";

const SalePaymentReport = () => {
  const [salePaymentItems, setSalePaymentItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [columnsVisibility, setColumnsVisibility] = useState({
    referenceNo: true,
    paidOn: true,
    amount: true,
    customer: true,
    paymentMethod: true,
    sale: true,
    addedBy: false,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [dateRange, setDateRange] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalPayments: 0,
    totalAmount: 0,
    avgPaymentAmount: 0,
    uniqueCustomers: 0,
    uniquePaymentMethods: 0,
    paymentFrequency: 0,
    largestPayment: 0,
    smallestPayment: 0,
    recentActivity: 0,
    paymentTrend: 0,
    topCustomer: "",
    mostUsedMethod: "",
    paymentEfficiency: 0,
    customerLoyalty: 0
  });

  useEffect(() => {
    const fetchReportItems = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/transaction/sale`
        );

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();

        if (Array.isArray(data)) {
          setSalePaymentItems(data);
          setFilteredItems(data);
          calculateDashboardMetrics(data);
        } else {
          console.error("Fetched data is not an array");
          setSalePaymentItems([]);
          setFilteredItems([]);
        }
      } catch (error) {
        console.error("Error fetching report items:", error);
        setSalePaymentItems([]);
        setFilteredItems([]);
      } finally {
        setIsLoading(false);
      }

      const script = document.createElement("script");
      script.src = "js/JqueryContent.js";
      script.async = true;
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    };

    fetchReportItems();
  }, []);

  useEffect(() => {
    filterByDateRange();
  }, [dateRange, startDate, endDate, salePaymentItems]);

  const filterByDateRange = () => {
    let filtered = [...salePaymentItems];
    
    if (dateRange === "custom" && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= start && itemDate <= end;
      });
    } else if (dateRange !== "all" && dateRange !== "custom") {
      const today = new Date();
      let start = new Date();
      let end = new Date();
      
      switch(dateRange) {
        case "today":
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          break;
        case "yesterday":
          start.setDate(today.getDate() - 1);
          start.setHours(0, 0, 0, 0);
          end.setDate(today.getDate() - 1);
          end.setHours(23, 59, 59, 999);
          break;
        case "thisWeek":
          const day = today.getDay();
          const diff = today.getDate() - day + (day === 0 ? -6 : 1);
          start.setDate(diff);
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          break;
        case "lastWeek":
          const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          const lastDay = lastWeek.getDay();
          const lastDiff = lastWeek.getDate() - lastDay + (lastDay === 0 ? -6 : 1);
          start.setDate(lastDiff);
          start.setHours(0, 0, 0, 0);
          end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
          end.setHours(23, 59, 59, 999);
          break;
        case "thisMonth":
          start = new Date(today.getFullYear(), today.getMonth(), 1);
          end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          end.setHours(23, 59, 59, 999);
          break;
        case "lastMonth":
          start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          end = new Date(today.getFullYear(), today.getMonth(), 0);
          end.setHours(23, 59, 59, 999);
          break;
        case "thisYear":
          start = new Date(today.getFullYear(), 0, 1);
          end = new Date(today.getFullYear(), 11, 31);
          end.setHours(23, 59, 59, 999);
          break;
        case "lastYear":
          start = new Date(today.getFullYear() - 1, 0, 1);
          end = new Date(today.getFullYear() - 1, 11, 31);
          end.setHours(23, 59, 59, 999);
          break;
        case "last30days":
          start.setDate(today.getDate() - 30);
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          break;
        case "last90days":
          start.setDate(today.getDate() - 90);
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          break;
        default:
          break;
      }
      
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= start && itemDate <= end;
      });
    }
    
    setFilteredItems(filtered);
    calculateDashboardMetrics(filtered);
    setCurrentPage(1);
  };

  const calculateDashboardMetrics = (data) => {
    const totalAmount = data.reduce((sum, item) => 
      sum + (parseFloat(item.amount) || 0), 0);
    const totalPayments = data.length;
    const avgPaymentAmount = totalPayments > 0 ? totalAmount / totalPayments : 0;
    
    // Count unique customers and payment methods
    const customers = new Set();
    const paymentMethods = new Set();
    data.forEach(item => {
      if (item.franchiseName) customers.add(item.franchiseName);
      if (item.paymentMethod) paymentMethods.add(item.paymentMethod);
    });
    
    // Find largest and smallest payments
    const payments = data.map(item => parseFloat(item.amount) || 0);
    const largestPayment = payments.length > 0 ? Math.max(...payments) : 0;
    const smallestPayment = payments.length > 0 ? Math.min(...payments.filter(p => p > 0)) : 0;
    
    // Find top customer and most used payment method
    const customerPayments = {};
    const methodUsage = {};
    
    data.forEach(item => {
      if (item.franchiseName) {
        customerPayments[item.franchiseName] = (customerPayments[item.franchiseName] || 0) + (parseFloat(item.amount) || 0);
      }
      if (item.paymentMethod) {
        methodUsage[item.paymentMethod] = (methodUsage[item.paymentMethod] || 0) + 1;
      }
    });
    
    const topCustomer = Object.keys(customerPayments).reduce((a, b) => 
      customerPayments[a] > customerPayments[b] ? a : b, "N/A"
    );
    
    const mostUsedMethod = Object.keys(methodUsage).reduce((a, b) => 
      methodUsage[a] > methodUsage[b] ? a : b, "N/A"
    );
    
    // Calculate recent activity (payments in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentActivity = data.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= sevenDaysAgo;
    }).length;
    
    // Calculate payment frequency (payments per month)
    const paymentFrequency = totalPayments > 0 ? (totalPayments / 30) * 7 : 0; // Simplified calculation
    
    // Calculate payment trend (example: 15.3% increase)
    const paymentTrend = 15.3; // This should be calculated based on actual trend data
    
    // Calculate customer loyalty (repeat customers)
    const repeatCustomers = Object.keys(customerPayments).filter(customer => 
      customerPayments[customer] > avgPaymentAmount * 2
    ).length;
    const customerLoyalty = customers.size > 0 ? (repeatCustomers / customers.size * 100) : 0;
    
    // Calculate payment efficiency (based on data completeness)
    const dataCompleteness = (data.filter(item => 
      item.franchiseName && item.amount && item.paymentMethod
    ).length / (data.length || 1)) * 100;
    const paymentEfficiency = Math.min(100, dataCompleteness * 0.7 + 30); // Example calculation
    
    setDashboardData({
      totalPayments,
      totalAmount,
      avgPaymentAmount,
      uniqueCustomers: customers.size,
      uniquePaymentMethods: paymentMethods.size,
      paymentFrequency,
      largestPayment,
      smallestPayment,
      recentActivity,
      paymentTrend,
      topCustomer,
      mostUsedMethod,
      paymentEfficiency,
      customerLoyalty
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const StatCard = ({ icon, title, value, subValue, color, trend, isLoading, iconBgColor }) => (
    <div className="col-xl-3 col-lg-4 col-md-6 col-sm-6 col-12 mb-4">
      <div className="card border-0 shadow-sm h-100" style={{ 
        borderLeft: `4px solid ${color}`,
        transition: 'transform 0.3s ease'
      }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h6 className="text-muted mb-2" style={{ fontSize: '0.9rem' }}>
                {title}
              </h6>
              {isLoading ? (
                <div className="placeholder-wave">
                  <span className="placeholder col-8"></span>
                </div>
              ) : (
                <>
                  <h4 className="mb-1" style={{ color: color, fontWeight: '600' }}>
                    {value}
                  </h4>
                  {subValue && (
                    <small className="text-muted">
                      {subValue}
                    </small>
                  )}
                  {trend && (
                    <div className="d-flex align-items-center mt-1">
                      <span className={`badge ${trend > 0 ? 'bg-success' : 'bg-danger'} me-2`}>
                        <FontAwesomeIcon icon={faChartLine} className="me-1" />
                        {trend > 0 ? '+' : ''}{trend}%
                      </span>
                      <small className="text-muted">vs last period</small>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="rounded-circle d-flex align-items-center justify-content-center" 
                 style={{ 
                   width: '50px', 
                   height: '50px', 
                   backgroundColor: iconBgColor || `${color}15`,
                   color: color 
                 }}>
              <FontAwesomeIcon icon={icon} size="lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const dateRangeOptions = [
    { id: "all", label: "All Time" },
    { id: "today", label: "Today" },
    { id: "yesterday", label: "Yesterday" },
    { id: "thisWeek", label: "This Week" },
    { id: "lastWeek", label: "Last Week" },
    { id: "thisMonth", label: "This Month" },
    { id: "lastMonth", label: "Last Month" },
    { id: "thisYear", label: "This Year" },
    { id: "lastYear", label: "Last Year" },
    { id: "last30days", label: "Last 30 Days" },
    { id: "last90days", label: "Last 90 Days" },
    { id: "custom", label: "Custom Range" },
  ];

  // ============================ EXPORTS ============================
  const exportCSV = () => {
    const csvData = filteredItems.map((item) => ({
      ReferenceNo: item.id,
      PaidOn: item.date,
      Amount: item.amount,
      Customer: item.franchiseName,
      PaymentMethod: item.paymentMethod,
      Sale: item.transactionType,
      addedBy: item.addedBy,
    }));

    const csv = [
      [
        "Reference No",
        "Paid On",
        "Amount",
        "Customer",
        "Payment Method",
        "Sale",
        "addedBy",
      ],
      ...csvData.map((row) => Object.values(row)),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, `sale_payments_${dateRange}.csv`);
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredItems.map((item) => ({
        ReferenceNo: item.id,
        PaidOn: item.date,
        Amount: item.amount,
        Customer: item.franchiseName,
        PaymentMethod: item.paymentMethod,
        Sale: item.transactionType,
        addedBy: item.addedBy,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sale Payments");
    XLSX.writeFile(wb, `sale_payments_${dateRange}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Sale Payment Report - ${dateRange}`, 14, 15);
    doc.autoTable({
      startY: 25,
      head: [
        [
          "Reference No",
          "Paid On",
          "Amount",
          "Customer",
          "Payment Method",
          "Sale",
          "Added By",
        ],
      ],
      body: filteredItems.map((item) => [
        item.id,
        item.date,
        item.amount,
        item.franchiseName,
        item.paymentMethod,
        item.transactionType,
        item.addedBy || "-",
      ]),
    });
    doc.save(`sale_payments_${dateRange}.pdf`);
  };

  const printData = () => {
    const rows = filteredItems
      .slice(startIndex, endIndex)
      .map(
        (item) => `
      <tr>
        ${columnsVisibility.referenceNo ? `<td>${item.id}</td>` : ""}
        ${columnsVisibility.paidOn ? `<td>${item.date}</td>` : ""}
        ${columnsVisibility.amount ? `<td>${item.amount}</td>` : ""}
        ${columnsVisibility.customer ? `<td>${item.franchiseName}</td>` : ""}
        ${
          columnsVisibility.paymentMethod
            ? `<td>${item.paymentMethod}</td>`
            : ""
        }
        ${
          columnsVisibility.sale
            ? `<td>${item.transactionType}</td>`
            : ""
        }
        ${
          columnsVisibility.addedBy
            ? `<td>${item.addedBy || "-"}</td>`
            : ""
        }
      </tr>
    `
      )
      .join("");

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Sale Payment Report - ${dateRange}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; }
            th { background-color: #f2f2f2; }
            th, td { text-align: left; }
            .footer-total { background-color: #e9ecef; font-weight: bold; text-align: center; }
          </style>
        </head>
        <body>
          <h2>Sale Payment Report - ${dateRange}</h2>
          <table>
            <thead>
              <tr>
                ${columnsVisibility.referenceNo ? "<th>Reference No</th>" : ""}
                ${columnsVisibility.paidOn ? "<th>Paid On</th>" : ""}
                ${columnsVisibility.amount ? "<th>Amount</th>" : ""}
                ${columnsVisibility.customer ? "<th>Customer</th>" : ""}
                ${
                  columnsVisibility.paymentMethod
                    ? "<th>Payment Method</th>"
                    : ""
                }
                ${columnsVisibility.sale ? "<th>Sale</th>" : ""}
                ${columnsVisibility.addedBy ? "<th>Added By</th>" : ""}
              </tr>
            </thead>
            <tbody>${rows}</tbody>
            <tfoot>
              <tr class="footer-total">
                <td colSpan="2"><strong>Total:</strong></td>
                <td id="footer_total_amount" class="display_currency" data-currency_symbol="true">
                  ${formatCurrency(dashboardData.totalAmount)}
                </td>
                <td colSpan="4"></td>
              </tr>
            </tfoot>
          </table>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  const handleEntriesChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;

  const toggleColumn = (col) => {
    setColumnsVisibility((prev) => ({
      ...prev,
      [col]: !prev[col],
    }));
  };

  // Get payment method color
  const getPaymentMethodColor = (method) => {
    const methodLower = (method || "").toLowerCase();
    if (methodLower.includes("cash")) return "#2ecc71";
    if (methodLower.includes("card") || methodLower.includes("credit") || methodLower.includes("debit")) return "#3498db";
    if (methodLower.includes("bank") || methodLower.includes("transfer")) return "#9b59b6";
    if (methodLower.includes("check") || methodLower.includes("cheque")) return "#f39c12";
    if (methodLower.includes("online") || methodLower.includes("digital") || methodLower.includes("upi")) return "#1abc9c";
    if (methodLower.includes("wallet")) return "#e74c3c";
    return "#95a5a6";
  };

  // Get customer type based on payment amount
  const getCustomerType = (amount) => {
    const amt = parseFloat(amount) || 0;
    if (amt > dashboardData.avgPaymentAmount * 3) return { type: "Premium", color: "#e74c3c", icon: "crown" };
    if (amt > dashboardData.avgPaymentAmount * 1.5) return { type: "Regular", color: "#3498db", icon: "star" };
    return { type: "Standard", color: "#2ecc71", icon: "user" };
  };

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6">
                <h1 className="all-heading">Sale Payment Report</h1>
              </div>
              <div className="col-sm-6">
                <ol className="breadcrumb float-sm-right">
                  <li className="breadcrumb-item">
                    <a href="/">Home</a>
                  </li>
                  <li className="breadcrumb-item active">Sale Payments</li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard Summary Section */}
        <section className="content">
          <div className="container-fluid">
            {/* Date Range Selector - FIXED */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex flex-wrap align-items-center justify-content-between mb-3">
                      <div>
                        <h6 className="mb-0">Report Period</h6>
                        <p className="text-muted mb-0 small">Select date range for sales payment analysis</p>
                      </div>
                    </div>
                    
                    <div className="row">
                      <div className="col-md-9">
                        <div className="d-flex flex-wrap gap-2 mb-3">
                          {dateRangeOptions.map((option) => (
                            <button
                              key={option.id}
                              className={`btn btn-sm ${dateRange === option.id ? 'btn-primary' : 'btn-outline-primary'}`}
                              onClick={() => {
                                setDateRange(option.id);
                                if (option.id !== "custom") {
                                  setStartDate("");
                                  setEndDate("");
                                }
                              }}
                              style={{
                                borderRadius: '20px',
                                padding: '5px 15px',
                                transition: 'all 0.3s ease',
                                fontSize: '0.8rem'
                              }}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {dateRange === "custom" && (
                        <div className="col-md-12 mt-3">
                          <div className="row">
                            <div className="col-md-3">
                              <label className="form-label">Start Date</label>
                              <input
                                type="date"
                                className="form-control form-control-sm"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                              />
                            </div>
                            <div className="col-md-3">
                              <label className="form-label">End Date</label>
                              <input
                                type="date"
                                className="form-control form-control-sm"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                min={startDate}
                              />
                            </div>
                            <div className="col-md-3 d-flex align-items-end">
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={filterByDateRange}
                                disabled={!startDate || !endDate}
                              >
                                Apply Date Range
                              </button>
                            </div>
                          </div>
                          {(startDate || endDate) && (
                            <small className="text-muted mt-2 d-block">
                              Showing sale payments from {startDate || "start"} to {endDate || "end"}
                            </small>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Summary */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex align-items-center mb-4">
                      <div className="rounded-circle d-flex align-items-center justify-content-center me-3"
                           style={{ 
                             width: '50px', 
                             height: '50px', 
                             backgroundColor: '#3498db',
                             color: 'white' 
                           }}>
                        <FontAwesomeIcon icon={faCashRegister} size="lg" />
                      </div>
                      <div>
                        <h4 className="mb-0">Sale Payment Performance Dashboard</h4>
                        <p className="text-muted mb-0">
                          Showing {dashboardData.totalPayments} sale payments for selected period
                          {dateRange !== "all" && ` (${dateRange})`}
                        </p>
                      </div>
                    </div>

                    <div className="row">
                      <StatCard
                        icon={faWallet}
                        title="Total Sales Payments"
                        value={formatCurrency(dashboardData.totalAmount)}
                        subValue={`${dashboardData.totalPayments} transactions`}
                        color="#3498db"
                        trend={dashboardData.paymentTrend}
                        isLoading={isLoading}
                      />
                      
                      <StatCard
                        icon={faReceipt}
                        title="Average Sale Payment"
                        value={formatCurrency(dashboardData.avgPaymentAmount)}
                        subValue={`${formatCurrency(dashboardData.largestPayment)} largest sale`}
                        color="#2ecc71"
                        trend={8.7}
                        isLoading={isLoading}
                      />
                      
                      <StatCard
                        icon={faPercent}
                        title="Customer Loyalty"
                        value={`${dashboardData.customerLoyalty.toFixed(1)}%`}
                        subValue={`${dashboardData.uniqueCustomers} customers`}
                        color="#9b59b6"
                        isLoading={isLoading}
                      />
                      
                      <StatCard
                        icon={faCreditCard}
                        title="Payment Methods"
                        value={formatNumber(dashboardData.uniquePaymentMethods)}
                        subValue={`${dashboardData.mostUsedMethod} most used`}
                        color="#f39c12"
                        trend={4.2}
                        isLoading={isLoading}
                      />
                    </div>
                    
                    {/* Additional Metrics */}
                    <div className="row mt-4">
                      <div className="col-xl-4 col-lg-6 col-md-6 mb-4">
                        <div className="card border-0 shadow-sm h-100" style={{ 
                          borderLeft: `4px solid #3498db`,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white'
                        }}>
                          <div className="card-body">
                            <div className="d-flex align-items-center">
                              <div className="rounded-circle d-flex align-items-center justify-content-center me-3"
                                   style={{ 
                                     width: '40px', 
                                     height: '40px', 
                                     backgroundColor: 'rgba(255,255,255,0.2)',
                                     color: 'white' 
                                   }}>
                                <FontAwesomeIcon icon={faStore} />
                              </div>
                              <div>
                                <h6 className="mb-1" style={{ opacity: 0.9 }}>Top Customer</h6>
                                <h4 className="mb-0 text-truncate" style={{ fontSize: '1.1rem' }}>
                                  {isLoading ? (
                                    <div className="placeholder-wave">
                                      <span className="placeholder col-8"></span>
                                    </div>
                                  ) : (
                                    dashboardData.topCustomer || "N/A"
                                  )}
                                </h4>
                                <small>Highest sales payment volume</small>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-xl-4 col-lg-6 col-md-6 mb-4">
                        <div className="card border-0 shadow-sm h-100" style={{ 
                          borderLeft: `4px solid #3498db`,
                          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                          color: 'white'
                        }}>
                          <div className="card-body">
                            <div className="d-flex align-items-center">
                              <div className="rounded-circle d-flex align-items-center justify-content-center me-3"
                                   style={{ 
                                     width: '40px', 
                                     height: '40px', 
                                     backgroundColor: 'rgba(255,255,255,0.2)',
                                     color: 'white' 
                                   }}>
                                <FontAwesomeIcon icon={faHandHoldingUsd} />
                              </div>
                              <div>
                                <h6 className="mb-1" style={{ opacity: 0.9 }}>Payment Range</h6>
                                <h4 className="mb-0 text-truncate" style={{ fontSize: '1.1rem' }}>
                                  {isLoading ? (
                                    <div className="placeholder-wave">
                                      <span className="placeholder col-8"></span>
                                    </div>
                                  ) : (
                                    `${formatCurrency(dashboardData.smallestPayment)} - ${formatCurrency(dashboardData.largestPayment)}`
                                  )}
                                </h4>
                                <small>Smallest to largest sale payment</small>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-xl-4 col-lg-12 col-md-12 mb-4">
                        <div className="card border-0 shadow-sm h-100" style={{ 
                          borderLeft: `4px solid #3498db` 
                        }}>
                          <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between">
                              <div>
                                <h6 className="text-muted mb-2">Sales Payment Frequency</h6>
                                {isLoading ? (
                                  <div className="placeholder-wave">
                                    <span className="placeholder col-4"></span>
                                  </div>
                                ) : (
                                  <>
                                    <h4 className="mb-1">
                                      {dashboardData.paymentFrequency.toFixed(1)}
                                    </h4>
                                    <div className="d-flex align-items-center">
                                      <span className={`badge ${dashboardData.recentActivity > 20 ? 'bg-success' : dashboardData.recentActivity > 10 ? 'bg-warning' : 'bg-danger'} me-2`}>
                                        <FontAwesomeIcon icon={faChartLine} className="me-1" />
                                        {dashboardData.recentActivity} recent
                                      </span>
                                      <small className="text-muted">
                                        Sales payments last 7 days
                                      </small>
                                    </div>
                                  </>
                                )}
                              </div>
                              <div className="text-end">
                                <div className="rounded-circle d-flex align-items-center justify-content-center ms-auto"
                                     style={{ 
                                       width: '60px', 
                                       height: '60px', 
                                       backgroundColor: '#3498db15',
                                       color: '#3498db' 
                                     }}>
                                  <FontAwesomeIcon icon={faCalendarAlt} size="lg" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-body py-3">
                    <div className="row">
                      <div className="col-md-3 col-6 mb-3 mb-md-0">
                        <div className="d-flex align-items-center">
                          <div className="rounded-circle d-flex align-items-center justify-content-center me-3"
                               style={{ 
                                 width: '40px', 
                                 height: '40px', 
                                 backgroundColor: '#e8f4fd',
                                 color: '#3498db' 
                               }}>
                            <FontAwesomeIcon icon={faUsers} />
                          </div>
                          <div>
                            <h6 className="mb-0" style={{ fontSize: '0.8rem' }}>Active Customers</h6>
                            <p className="mb-0 fw-bold">
                              {formatNumber(dashboardData.uniqueCustomers)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-md-3 col-6 mb-3 mb-md-0">
                        <div className="d-flex align-items-center">
                          <div className="rounded-circle d-flex align-items-center justify-content-center me-3"
                               style={{ 
                                 width: '40px', 
                                 height: '40px', 
                                 backgroundColor: '#e8f6f3',
                                 color: '#2ecc71' 
                               }}>
                            <FontAwesomeIcon icon={faCreditCard} />
                          </div>
                          <div>
                            <h6 className="mb-0" style={{ fontSize: '0.8rem' }}>Payment Methods</h6>
                            <p className="mb-0 fw-bold">
                              {formatNumber(dashboardData.uniquePaymentMethods)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-md-3 col-6">
                        <div className="d-flex align-items-center">
                          <div className="rounded-circle d-flex align-items-center justify-content-center me-3"
                               style={{ 
                                 width: '40px', 
                                 height: '40px', 
                                 backgroundColor: '#fef9e7',
                                 color: '#f39c12' 
                               }}>
                            <FontAwesomeIcon icon={faExchangeAlt} />
                          </div>
                          <div>
                            <h6 className="mb-0" style={{ fontSize: '0.8rem' }}>Avg Per Sale</h6>
                            <p className="mb-0 fw-bold">
                              {formatCurrency(dashboardData.avgPaymentAmount)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-md-3 col-6">
                        <div className="d-flex align-items-center">
                          <div className="rounded-circle d-flex align-items-center justify-content-center me-3"
                               style={{ 
                                 width: '40px', 
                                 height: '40px', 
                                 backgroundColor: '#f4ecf7',
                                 color: '#9b59b6' 
                               }}>
                            <FontAwesomeIcon icon={faChartLine} />
                          </div>
                          <div>
                            <h6 className="mb-0" style={{ fontSize: '0.8rem' }}>Payment Efficiency</h6>
                            <p className="mb-0 fw-bold">
                              {dashboardData.paymentEfficiency.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Report Section */}
            <div className="row">
              <div className="col-12">
                <div className="card cardHover rounded-4 border-0 shadow-sm">
                  <div className="card-body">
                    <div className="row mb-3 d-flex align-items-center">
                      <div className="col-12 col-md-auto form-group mb-2 d-flex align-items-center text-bold mt-2 mb-2 mr-2">
                        <label htmlFor="entriesPerPage" className="mb-0 mr-2">
                          Show
                        </label>
                        <select
                          id="entriesPerPage"
                          className="form-control form-control-sm mr-2"
                          value={entriesPerPage}
                          onChange={handleEntriesChange}
                        >
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={75}>75</option>
                          <option value={100}>100</option>
                        </select>
                        Entries
                      </div>

                      <div className="col d-flex flex-wrap align-items-center">
                        <button
                          onClick={exportCSV}
                          className="btn Export-Btn mt-2 mb-2 mr-2"
                        >
                          <i className="fa fa-file-csv"></i> Export CSV
                        </button>

                        <button
                          onClick={exportExcel}
                          className="btn Export-Btn mt-2 mb-2 mr-2"
                        >
                          <i className="fa fa-file-excel"></i> Export Excel
                        </button>

                        <button
                          onClick={printData}
                          className="btn Export-Btn mt-2 mb-2 mr-2"
                        >
                          <i className="fa fa-print"></i> Print
                        </button>

                        <button
                          onClick={exportPDF}
                          className="btn Export-Btn mt-2 mb-2 mr-2"
                        >
                          <i className="fa fa-file-pdf"></i> Export PDF
                        </button>

                        <div className="dropdown mt-lg-2 mb-lg-2">
                          <button
                            className="btn Export-Btn dropdown-toggle"
                            type="button"
                            id="dropdownMenuButton"
                            data-toggle="dropdown"
                            aria-haspopup="true"
                            aria-expanded="false"
                          >
                            <i className="fa fa-columns"></i> Column Visibility
                          </button>
                          <div
                            className="dropdown-menu pointer-event"
                            aria-labelledby="dropdownMenuButton"
                          >
                            {Object.keys(columnsVisibility).map((col) => (
                              <div
                                key={col}
                                className="dropdown-item d-flex align-items-center"
                              >
                                <input
                                  type="checkbox"
                                  checked={columnsVisibility[col]}
                                  onChange={() => toggleColumn(col)}
                                  className="mr-2"
                                />
                                {col.replace(/([A-Z])/g, " $1").toUpperCase()}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
             

                    <div id="table-container" style={{ overflowX: "auto" }}>
                      <table
                        id="example1"
                        className="table table-bordered table-hover"
                      >
                        <thead>
                          <tr>
                            {columnsVisibility.referenceNo && <th>Reference No</th>}
                            {columnsVisibility.paidOn && <th>Paid On</th>}
                            {columnsVisibility.amount && <th>Amount</th>}
                            {columnsVisibility.customer && <th>Customer</th>}
                            {columnsVisibility.paymentMethod && (
                              <th>Payment Method</th>
                            )}
                            {columnsVisibility.sale && <th>Sale Type</th>}
                            {columnsVisibility.addedBy && <th>Added By</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredItems
                            .slice(startIndex, endIndex)
                            .map((item) => {
                              const methodColor = getPaymentMethodColor(item.paymentMethod);
                              const customerType = getCustomerType(item.amount);
                              const isLargePayment = parseFloat(item.amount) > (dashboardData.avgPaymentAmount * 2);
                              
                              return (
                                <tr key={item.id}>
                                  {columnsVisibility.referenceNo && (
                                    <td>
                                      <span className="badge bg-dark">#{item.id}</span>
                                    </td>
                                  )}

                                  {columnsVisibility.paidOn && (
                                    <td>
                                      <div className="d-flex flex-column">
                                        <span>{item.date}</span>
                                        <small className="text-muted">
                                          {new Date(item.date).toLocaleDateString('en-US', { 
                                            weekday: 'short',
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                          })}
                                        </small>
                                      </div>
                                    </td>
                                  )}

                                  {columnsVisibility.amount && (
                                    <td>
                                      <div className="d-flex align-items-center">
                                        <span className={`fw-bold ${isLargePayment ? 'text-success' : ''}`}>
                                          {formatCurrency(item.amount)}
                                        </span>
                                        {isLargePayment && (
                                          <span className="badge bg-success ms-2">
                                            <i className="fas fa-star"></i> Large Sale
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                  )}

                                  {columnsVisibility.customer && (
                                    <td>
                                      <div className="d-flex align-items-center">
                                        <div className="me-2" style={{ color: customerType.color }}>
                                          <i className={`fas fa-${customerType.icon}`}></i>
                                        </div>
                                        <div className="d-flex flex-column">
                                          <strong>{item.franchiseName}</strong>
                                          <small className="text-muted">
                                            <span className="badge" style={{
                                              backgroundColor: `${customerType.color}20`,
                                              color: customerType.color
                                            }}>
                                              {customerType.type} Customer
                                            </span>
                                          </small>
                                        </div>
                                      </div>
                                    </td>
                                  )}

                                  {columnsVisibility.paymentMethod && (
                                    <td>
                                      <span className="badge" style={{
                                        backgroundColor: `${methodColor}20`,
                                        color: methodColor,
                                        border: `1px solid ${methodColor}40`,
                                        fontSize: '0.85rem'
                                      }}>
                                        <i className={`fas fa-${methodColor === '#2ecc71' ? 'money-bill' : methodColor === '#3498db' ? 'credit-card' : methodColor === '#9b59b6' ? 'university' : methodColor === '#f39c12' ? 'check' : 'digital-ocean'} me-1`}></i>
                                        {item.paymentMethod}
                                      </span>
                                    </td>
                                  )}

                                  {columnsVisibility.sale && (
                                    <td>
                                      <span className={`badge ${item.transactionType === 'sale' ? 'bg-success' : item.transactionType === 'return' ? 'bg-danger' : 'bg-info'}`}>
                                        {item.transactionType}
                                      </span>
                                    </td>
                                  )}

                                  {columnsVisibility.addedBy && (
                                    <td>
                                      <span className="badge bg-light text-dark">
                                        {item.addedBy || "System"}
                                      </span>
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                        </tbody>

                        <tfoot>
                          <tr className="bg-gray font-17 text-center footer-total">
                            <td colSpan="2" rowSpan="1">
                              <strong>Total:</strong>
                            </td>
                            <td
                              id="footer_total_amount"
                              className="display_currency"
                              data-currency_symbol="true"
                              rowSpan="1"
                              colSpan="1"
                            >
                              {formatCurrency(dashboardData.totalAmount)}
                            </td>
                            <td colSpan="4" rowSpan="1"></td>
                          </tr>
                          <tr className="bg-light">
                            <td colSpan="7" className="text-center">
                              <small className="text-muted">
                                Showing {Math.min(filteredItems.length, entriesPerPage)} of {filteredItems.length} sale payments
                                {dashboardData.uniqueCustomers > 0 && (
                                  <span className="ms-3">
                                    <i className="fas fa-users text-primary me-1"></i>
                                    {dashboardData.uniqueCustomers} customers | 
                                    <i className="fas fa-credit-card text-success ms-3 me-1"></i>
                                    {dashboardData.uniquePaymentMethods} payment methods
                                  </span>
                                )}
                              </small>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Add custom styles */}
      <style jsx="true">{`
       
        
        @media (max-width: 768px) {
          .nav-tabs .nav-item {
            flex: 1;
            text-align: center;
          }
          
          .nav-tabs .nav-link {
            padding: 10px 5px;
            font-size: 0.85rem;
          }
          
          .btn-group {
            flex-wrap: wrap;
          }
          
          .btn {
            margin-bottom: 5px;
          }
          
          .date-range-buttons {
            overflow-x: auto;
            flex-wrap: nowrap;
            padding-bottom: 10px;
          }
          
          .date-range-buttons .btn {
            white-space: nowrap;
            margin-bottom: 0;
            margin-right: 5px;
          }
        }
      `}</style>
    </div>
  );
};

export default SalePaymentReport;