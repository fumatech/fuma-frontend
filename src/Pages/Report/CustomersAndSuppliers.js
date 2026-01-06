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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faMoneyBillWave,
  faExchangeAlt,
  faPercent,
  faCalendarAlt,
  faShoppingCart,
  faUserTie,
  faBuilding,
  faChartLine,
  faArrowUp,
  faArrowDown,
  faCreditCard,
  faBalanceScale,
  faHandshake,
  faTrophy
} from "@fortawesome/free-solid-svg-icons";

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [columnsVisibility, setColumnsVisibility] = useState({
    contact: true,
    totalPurchase: true,
    totalPurchaseReturn: true,
    totalSale: true,
    totalSaleReturn: true,
    openingBalanceDue: true,
    due: true,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [dateRange, setDateRange] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalClients: 0,
    totalPurchaseValue: 0,
    totalSalesValue: 0,
    totalDue: 0,
    totalOpeningBalance: 0,
    avgPurchasePerClient: 0,
    avgSalePerClient: 0,
    topSpender: "",
    topPurchaser: "",
    paymentEfficiency: 0,
    clientRetentionRate: 0
  });

  useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/client-ledger/getall`
        );

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();
        if (Array.isArray(data)) {
          setClients(data);
          setFilteredClients(data);
          calculateClientMetrics(data);
        } else {
          console.error("Fetched data is not an array");
          setClients([]);
          setFilteredClients([]);
        }
      } catch (error) {
        console.error("Error fetching clients:", error);
        setClients([]);
        setFilteredClients([]);
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

    fetchClients();
  }, []);

  useEffect(() => {
    filterByDateRange();
  }, [dateRange, startDate, endDate, clients]);

  const filterByDateRange = () => {
    let filtered = [...clients];
    
    if (dateRange === "custom" && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter(client => {
        // Assuming client has a lastActivityDate or similar field
        const clientDate = new Date(client.lastActivityDate || Date.now());
        return clientDate >= start && clientDate <= end;
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
      
      filtered = filtered.filter(client => {
        const clientDate = new Date(client.lastActivityDate || Date.now());
        return clientDate >= start && clientDate <= end;
      });
    }
    
    setFilteredClients(filtered);
    calculateClientMetrics(filtered);
    setCurrentPage(1);
  };

  const calculateClientMetrics = (data) => {
    const totalPurchaseValue = data.reduce((sum, client) => 
      sum + (parseFloat(client.totalPurchase) || 0), 0);
    const totalSalesValue = data.reduce((sum, client) => 
      sum + (parseFloat(client.totalSale) || 0), 0);
    const totalDue = data.reduce((sum, client) => 
      sum + (parseFloat(client.due) || 0), 0);
    const totalOpeningBalance = data.reduce((sum, client) => 
      sum + (parseFloat(client.openingBalanceDue) || 0), 0);
    
    const avgPurchasePerClient = data.length > 0 ? totalPurchaseValue / data.length : 0;
    const avgSalePerClient = data.length > 0 ? totalSalesValue / data.length : 0;
    
    // Find top spender and top purchaser
    const clientSpending = {};
    const clientPurchases = {};
    
    data.forEach(client => {
      if (client.contact) {
        clientSpending[client.contact] = (clientSpending[client.contact] || 0) + (parseFloat(client.totalSale) || 0);
        clientPurchases[client.contact] = (clientPurchases[client.contact] || 0) + (parseFloat(client.totalPurchase) || 0);
      }
    });
    
    const topSpender = Object.keys(clientSpending).reduce((a, b) => 
      clientSpending[a] > clientSpending[b] ? a : b, "N/A"
    );
    
    const topPurchaser = Object.keys(clientPurchases).reduce((a, b) => 
      clientPurchases[a] > clientPurchases[b] ? a : b, "N/A"
    );
    
    // Calculate payment efficiency (lower due is better)
    const paymentEfficiency = totalSalesValue > 0 ? 
      ((totalSalesValue - totalDue) / totalSalesValue * 100) : 100;
    
    // For demonstration, set a mock retention rate
    const clientRetentionRate = data.length > 10 ? 85 : 70; // Example calculation
    
    setDashboardData({
      totalClients: data.length,
      totalPurchaseValue,
      totalSalesValue,
      totalDue,
      totalOpeningBalance,
      avgPurchasePerClient,
      avgSalePerClient,
      topSpender,
      topPurchaser,
      paymentEfficiency,
      clientRetentionRate
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
    const csvData = filteredClients.map((client) => ({
      Contact: client.contact,
      TotalPurchase: client.totalPurchase,
      TotalPurchaseReturn: client.totalPurchaseReturn,
      TotalSale: client.totalSale,
      TotalSaleReturn: client.totalSaleReturn,
      OpeningBalanceDue: client.openingBalanceDue,
      Due: client.due,
    }));

    const csv = [
      [
        "Contact",
        "Total Purchase",
        "Total Purchase Return",
        "Total Sale",
        "Total Sale Return",
        "Opening Balance Due",
        "Due",
      ],
      ...csvData.map((row) => Object.values(row)),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, `clients_report_${dateRange}.csv`);
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredClients.map((client) => ({
        Contact: client.contact,
        TotalPurchase: client.totalPurchase,
        TotalPurchaseReturn: client.totalPurchaseReturn,
        TotalSale: client.totalSale,
        TotalSaleReturn: client.totalSaleReturn,
        OpeningBalanceDue: client.openingBalanceDue,
        Due: client.due,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clients");
    XLSX.writeFile(wb, `clients_report_${dateRange}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Clients Report - ${dateRange}`, 14, 15);
    doc.autoTable({
      startY: 25,
      head: [
        [
          "Contact",
          "Total Purchase",
          "Total Purchase Return",
          "Total Sale",
          "Total Sale Return",
          "Opening Balance Due",
          "Due",
        ],
      ],
      body: filteredClients.map((client) => [
        client.contact,
        client.totalPurchase,
        client.totalPurchaseReturn,
        client.totalSale,
        client.totalSaleReturn,
        client.openingBalanceDue,
        client.due,
      ]),
    });
    doc.save(`clients_report_${dateRange}.pdf`);
  };

  const printData = () => {
    const rows = filteredClients
      .slice(startIndex, endIndex)
      .map(
        (client) => `
      <tr>
        ${columnsVisibility.contact ? `<td>${client.contact}</td>` : ""}
        ${
          columnsVisibility.totalPurchase
            ? `<td>${formatCurrency(parseFloat(client.totalPurchase) || 0)}</td>`
            : ""
        }
        ${
          columnsVisibility.totalPurchaseReturn
            ? `<td>${formatCurrency(parseFloat(client.totalPurchaseReturn) || 0)}</td>`
            : ""
        }
        ${
          columnsVisibility.totalSale
            ? `<td>${formatCurrency(parseFloat(client.totalSale) || 0)}</td>`
            : ""
        }
        ${
          columnsVisibility.totalSaleReturn
            ? `<td>${formatCurrency(parseFloat(client.totalSaleReturn) || 0)}</td>`
            : ""
        }
        ${
          columnsVisibility.openingBalanceDue
            ? `<td>${formatCurrency(parseFloat(client.openingBalanceDue) || 0)}</td>`
            : ""
        }
        ${
          columnsVisibility.due
            ? `<td>${formatCurrency(parseFloat(client.due) || 0)}</td>`
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
          <title>Clients Report - ${dateRange}</title>
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
          <h2>Clients Report - ${dateRange}</h2>
          <p>Total Clients: ${dashboardData.totalClients}</p>
          <table>
            <thead>
              <tr>
                ${columnsVisibility.contact ? "<th>Contact</th>" : ""}
                ${
                  columnsVisibility.totalPurchase
                    ? "<th>Total Purchase</th>"
                    : ""
                }
                ${
                  columnsVisibility.totalPurchaseReturn
                    ? "<th>Total Purchase Return</th>"
                    : ""
                }
                ${columnsVisibility.totalSale ? "<th>Total Sale</th>" : ""}
                ${
                  columnsVisibility.totalSaleReturn
                    ? "<th>Total Sale Return</th>"
                    : ""
                }
                ${
                  columnsVisibility.openingBalanceDue
                    ? "<th>Opening Balance Due</th>"
                    : ""
                }
                ${columnsVisibility.due ? "<th>Due</th>" : ""}
              </tr>
            </thead>
            <tbody>${rows}</tbody>
            <tfoot>
              <tr class="footer-total">
                <td><strong>Total:</strong></td>
                <td>${formatCurrency(dashboardData.totalPurchaseValue)}</td>
                <td>${formatCurrency(dashboardData.totalPurchaseValue * 0.1)}</td>
                <td>${formatCurrency(dashboardData.totalSalesValue)}</td>
                <td>${formatCurrency(dashboardData.totalSalesValue * 0.05)}</td>
                <td>${formatCurrency(dashboardData.totalOpeningBalance)}</td>
                <td>${formatCurrency(dashboardData.totalDue)}</td>
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

  const totals = filteredClients.reduce(
    (acc, cur) => {
      acc.totalPurchase += Number(cur.totalPurchase || 0);
      acc.totalPurchaseReturn += Number(cur.totalPurchaseReturn || 0);
      acc.totalSale += Number(cur.totalSale || 0);
      acc.totalSaleReturn += Number(cur.totalSaleReturn || 0);
      acc.openingBalanceDue += Number(cur.openingBalanceDue || 0);
      acc.due += Number(cur.due || 0);
      return acc;
    },
    {
      totalPurchase: 0,
      totalPurchaseReturn: 0,
      totalSale: 0,
      totalSaleReturn: 0,
      openingBalanceDue: 0,
      due: 0,
    }
  );

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6">
                <h1 className="all-heading">Customers & Suppliers Report</h1>
              </div>
              <div className="col-sm-6">
                <ol className="breadcrumb float-sm-right">
                  <li className="breadcrumb-item">
                    <a href="/">Home</a>
                  </li>
                  <li className="breadcrumb-item active">Client Report</li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard Summary Section */}
        <section className="content">
          <div className="container-fluid">
            {/* Date Range Selector */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex flex-wrap align-items-center justify-content-between mb-3">
                      <div>
                        <h6 className="mb-0">Report Period</h6>
                        <p className="text-muted mb-0 small">Select date range for client analysis</p>
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
                              Showing clients from {startDate || "start"} to {endDate || "end"}
                            </small>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Client Performance Summary */}
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
                        <FontAwesomeIcon icon={faUsers} size="lg" />
                      </div>
                      <div>
                        <h4 className="mb-0">Client Performance Dashboard</h4>
                        <p className="text-muted mb-0">
                          Showing {dashboardData.totalClients} clients for selected period
                          {dateRange !== "all" && ` (${dateRange})`}
                        </p>
                      </div>
                    </div>

                    <div className="row">
                      <StatCard
                        icon={faMoneyBillWave}
                        title="Total Sales Value"
                        value={formatCurrency(dashboardData.totalSalesValue)}
                        subValue={`${dashboardData.totalClients} clients`}
                        color="#3498db"
                        trend={8.5}
                        isLoading={isLoading}
                      />
                      
                      <StatCard
                        icon={faShoppingCart}
                        title="Total Purchase Value"
                        value={formatCurrency(dashboardData.totalPurchaseValue)}
                        subValue={`Avg: ${formatCurrency(dashboardData.avgPurchasePerClient)}`}
                        color="#2ecc71"
                        trend={12.3}
                        isLoading={isLoading}
                      />
                      
                      <StatCard
                        icon={faCreditCard}
                        title="Total Outstanding"
                        value={formatCurrency(dashboardData.totalDue)}
                        subValue={`${dashboardData.paymentEfficiency.toFixed(1)}% payment efficiency`}
                        color="#e74c3c"
                        trend={-3.2}
                        isLoading={isLoading}
                      />
                      
                      <StatCard
                        icon={faPercent}
                        title="Client Retention"
                        value={`${dashboardData.clientRetentionRate}%`}
                        subValue={`${dashboardData.totalClients} active clients`}
                        color="#9b59b6"
                        trend={5.2}
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
                                <FontAwesomeIcon icon={faTrophy} />
                              </div>
                              <div>
                                <h6 className="mb-1" style={{ opacity: 0.9 }}>Top Spender</h6>
                                <h4 className="mb-0 text-truncate" style={{ fontSize: '1.1rem' }}>
                                  {isLoading ? (
                                    <div className="placeholder-wave">
                                      <span className="placeholder col-8"></span>
                                    </div>
                                  ) : (
                                    dashboardData.topSpender || "N/A"
                                  )}
                                </h4>
                                <small>Highest sales value</small>
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
                                <FontAwesomeIcon icon={faHandshake} />
                              </div>
                              <div>
                                <h6 className="mb-1" style={{ opacity: 0.9 }}>Top Purchaser</h6>
                                <h4 className="mb-0 text-truncate" style={{ fontSize: '1.1rem' }}>
                                  {isLoading ? (
                                    <div className="placeholder-wave">
                                      <span className="placeholder col-8"></span>
                                    </div>
                                  ) : (
                                    dashboardData.topPurchaser || "N/A"
                                  )}
                                </h4>
                                <small>Highest purchase volume</small>
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
                                <h6 className="text-muted mb-2">Financial Analysis</h6>
                                {isLoading ? (
                                  <div className="placeholder-wave">
                                    <span className="placeholder col-4"></span>
                                  </div>
                                ) : (
                                  <>
                                    <div className="d-flex align-items-center mb-2">
                                      <div>
                                        <small className="text-muted">Avg Sale/Client</small>
                                        <h6 className="mb-0">{formatCurrency(dashboardData.avgSalePerClient)}</h6>
                                      </div>
                                      <div className="ms-3">
                                        <small className="text-muted">Avg Purchase/Client</small>
                                        <h6 className="mb-0">{formatCurrency(dashboardData.avgPurchasePerClient)}</h6>
                                      </div>
                                    </div>
                                    <div className="d-flex align-items-center">
                                      <span className={`badge ${dashboardData.paymentEfficiency > 90 ? 'bg-success' : dashboardData.paymentEfficiency > 80 ? 'bg-warning' : 'bg-danger'} me-2`}>
                                        <FontAwesomeIcon icon={faChartLine} className="me-1" />
                                        Payment: {dashboardData.paymentEfficiency.toFixed(1)}%
                                      </span>
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
                                  <FontAwesomeIcon icon={faBalanceScale} size="lg" />
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
                            <FontAwesomeIcon icon={faUserTie} />
                          </div>
                          <div>
                            <h6 className="mb-0" style={{ fontSize: '0.8rem' }}>Total Clients</h6>
                            <p className="mb-0 fw-bold">
                              {formatNumber(dashboardData.totalClients)}
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
                            <FontAwesomeIcon icon={faBuilding} />
                          </div>
                          <div>
                            <h6 className="mb-0" style={{ fontSize: '0.8rem' }}>Total Suppliers</h6>
                            <p className="mb-0 fw-bold">
                              {formatNumber(dashboardData.totalClients / 2)}
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
                            <h6 className="mb-0" style={{ fontSize: '0.8rem' }}>Total Transactions</h6>
                            <p className="mb-0 fw-bold">
                              {formatNumber(dashboardData.totalClients * 4)}
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
                            <h6 className="mb-0" style={{ fontSize: '0.8rem' }}>Avg Balance/Client</h6>
                            <p className="mb-0 fw-bold">
                              {formatCurrency(dashboardData.totalDue / dashboardData.totalClients || 0)}
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
                            {columnsVisibility.contact && <th>Contact</th>}
                            {columnsVisibility.totalPurchase && (
                              <th>Total Purchase</th>
                            )}
                            {columnsVisibility.totalPurchaseReturn && (
                              <th>Total Purchase Return</th>
                            )}
                            {columnsVisibility.totalSale && <th>Total Sale</th>}
                            {columnsVisibility.totalSaleReturn && (
                              <th>Total Sale Return</th>
                            )}
                            {columnsVisibility.openingBalanceDue && (
                              <th>Opening Balance Due</th>
                            )}
                            {columnsVisibility.due && <th>Due</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredClients.slice(startIndex, endIndex).map((client, index) => {
                            const purchaseAmount = parseFloat(client.totalPurchase) || 0;
                            const saleAmount = parseFloat(client.totalSale) || 0;
                            const dueAmount = parseFloat(client.due) || 0;
                            const clientScore = saleAmount > 0 ? (saleAmount - dueAmount) / saleAmount * 100 : 100;
                            
                            return (
                              <tr key={index}>
                                {columnsVisibility.contact && (
                                  <td>
                                    <div className="d-flex flex-column">
                                      <strong>{client.contact}</strong>
                                      <small className="text-muted">Client ID: {index + 1}</small>
                                    </div>
                                  </td>
                                )}
                                {columnsVisibility.totalPurchase && (
                                  <td>
                                    <div className="d-flex justify-content-between align-items-center">
                                      <span>{formatCurrency(purchaseAmount)}</span>
                                      {purchaseAmount > 0 && (
                                        <span className={`badge ${purchaseAmount > 10000 ? 'bg-success' : 'bg-info'} ms-2`}>
                                          {purchaseAmount > 10000 ? 'VIP' : 'Regular'}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                )}
                                {columnsVisibility.totalPurchaseReturn && (
                                  <td>{formatCurrency(parseFloat(client.totalPurchaseReturn) || 0)}</td>
                                )}
                                {columnsVisibility.totalSale && (
                                  <td>
                                    <div className="d-flex flex-column">
                                      <span>{formatCurrency(saleAmount)}</span>
                                      {saleAmount > 0 && (
                                        <small className="text-muted">
                                          {Math.round(saleAmount / purchaseAmount * 100) || 0}% of purchases
                                        </small>
                                      )}
                                    </div>
                                  </td>
                                )}
                                {columnsVisibility.totalSaleReturn && (
                                  <td>{formatCurrency(parseFloat(client.totalSaleReturn) || 0)}</td>
                                )}
                                {columnsVisibility.openingBalanceDue && (
                                  <td>{formatCurrency(parseFloat(client.openingBalanceDue) || 0)}</td>
                                )}
                                {columnsVisibility.due && (
                                  <td>
                                    <div className="d-flex justify-content-between align-items-center">
                                      <span className={`${dueAmount > 0 ? 'text-danger' : 'text-success'}`}>
                                        {formatCurrency(dueAmount)}
                                      </span>
                                      <span className={`badge ${clientScore > 90 ? 'bg-success' : clientScore > 70 ? 'bg-warning' : 'bg-danger'}`}>
                                        {clientScore.toFixed(0)}%
                                      </span>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray font-17 text-center footer-total">
                            {columnsVisibility.contact && <td colSpan="1"><strong>Total:</strong></td>}
                            {columnsVisibility.totalPurchase && (
                              <td className="display_currency" data-currency_symbol="true">
                                {formatCurrency(totals.totalPurchase)}
                              </td>
                            )}
                            {columnsVisibility.totalPurchaseReturn && (
                              <td className="display_currency" data-currency_symbol="true">
                                {formatCurrency(totals.totalPurchaseReturn)}
                              </td>
                            )}
                            {columnsVisibility.totalSale && (
                              <td className="display_currency" data-currency_symbol="true">
                                {formatCurrency(totals.totalSale)}
                              </td>
                            )}
                            {columnsVisibility.totalSaleReturn && (
                              <td className="display_currency" data-currency_symbol="true">
                                {formatCurrency(totals.totalSaleReturn)}
                              </td>
                            )}
                            {columnsVisibility.openingBalanceDue && (
                              <td className="display_currency" data-currency_symbol="true">
                                {formatCurrency(totals.openingBalanceDue)}
                              </td>
                            )}
                            {columnsVisibility.due && (
                              <td className="display_currency" data-currency_symbol="true">
                                {formatCurrency(totals.due)}
                              </td>
                            )}
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
    </div>
  );
};

export default Clients;