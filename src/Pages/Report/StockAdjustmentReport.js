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
import { Modal } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxes,
  faExchangeAlt,
  faMoneyBillWave,
  faChartLine,
  faExclamationTriangle,
  faCheckCircle,
  faWarehouse,
  faCalendarAlt,
  faPercent,
  faArrowUp,
  faArrowDown,
  faBalanceScale,
  faCalculator,
} from "@fortawesome/free-solid-svg-icons";

const StockAdjustmentReport = () => {
  const [stockAdjustmentReports, setStockAdjustmentReports] = useState([]);
  const [columnsVisibility, setColumnsVisibility] = useState({
    action: true,
    date: true,
    referenceNo: true,
    location: true,
    adjustmentType: true,
    totalAmount: true,
    totalAmountRecovered: true,
    reason: true,
    addedBy: false,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [showModal, setShowModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [dateRange, setDateRange] = useState("thisMonth");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/stock-adjustments/getall`
        );
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        setStockAdjustmentReports(data);
      } catch (error) {
        console.error("Failed to fetch stock adjustment reports:", error);
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

    fetchReports();
  }, []);

  const calculateTotals = () => {
    let totalNormal = 0;
    let totalAbnormal = 0;
    let totalRecovered = 0;
    let totalAdjustments = 0;
    let normalCount = 0;
    let abnormalCount = 0;
    let totalItemsAdjusted = 0;

    stockAdjustmentReports.forEach((report) => {
      const amount = Number(report.totalAmount) || 0;
      const recovered = Number(report.amountRecovered) || 0;

      // Count total items adjusted
      if (report.stockAdjustmentItems) {
        totalItemsAdjusted += report.stockAdjustmentItems.length;
      }

      if (report.adjustmentType === "normal") {
        totalNormal += amount;
        normalCount++;
      } else if (report.adjustmentType === "abnormal") {
        totalAbnormal += amount;
        abnormalCount++;
      }

      totalRecovered += recovered;
      totalAdjustments += amount;
    });

    const recoveryRate =
      totalAdjustments > 0 ? (totalRecovered / totalAdjustments) * 100 : 0;
    const avgNormalValue = normalCount > 0 ? totalNormal / normalCount : 0;
    const avgAbnormalValue =
      abnormalCount > 0 ? totalAbnormal / abnormalCount : 0;

    return {
      totalNormal,
      totalAbnormal,
      totalRecovered,
      totalAdjustments,
      normalCount,
      abnormalCount,
      recoveryRate,
      avgNormalValue,
      avgAbnormalValue,
      totalItemsAdjusted,
    };
  };

  const getDashboardMetrics = () => {
    const {
      totalNormal,
      totalAbnormal,
      totalRecovered,
      totalAdjustments,
      normalCount,
      abnormalCount,
      recoveryRate,
      avgNormalValue,
      avgAbnormalValue,
      totalItemsAdjusted,
    } = calculateTotals();

    const totalReports = normalCount + abnormalCount;
    const abnormalityRate =
      totalReports > 0 ? (abnormalCount / totalReports) * 100 : 0;
    const avgRecoveryPerReport =
      totalReports > 0 ? totalRecovered / totalReports : 0;

    // Find recent adjustments (last 5)
    const recentAdjustments = [...stockAdjustmentReports]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    return {
      totalNormal: formatCurrency(totalNormal),
      totalAbnormal: formatCurrency(totalAbnormal),
      totalRecovered: formatCurrency(totalRecovered),
      totalAdjustments: formatCurrency(totalAdjustments),
      recoveryRate: recoveryRate.toFixed(1),
      totalReports,
      normalCount,
      abnormalCount,
      abnormalityRate: abnormalityRate.toFixed(1),
      avgNormalValue: formatCurrency(avgNormalValue),
      avgAbnormalValue: formatCurrency(avgAbnormalValue),
      avgRecoveryPerReport: formatCurrency(avgRecoveryPerReport),
      totalItemsAdjusted,
      recentAdjustments,
      trend: totalAdjustments > 100000 ? 12.5 : 8.3, // Example trend
      efficiency:
        recoveryRate > 50 ? "High" : recoveryRate > 25 ? "Medium" : "Low",
    };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const StatCard = ({
    icon,
    title,
    value,
    subValue,
    color,
    trend,
    isLoading,
    iconBgColor,
  }) => (
    <div className="col-xl-3 col-lg-4 col-md-6 col-sm-6 col-12 mb-4">
      <div
        className="card border-0 shadow-sm h-100"
        style={{
          borderLeft: `4px solid ${color}`,
          transition: "transform 0.3s ease",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.transform = "translateY(-5px)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.transform = "translateY(0)")
        }
      >
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h6 className="text-muted mb-2" style={{ fontSize: "0.9rem" }}>
                {title}
              </h6>
              {isLoading ? (
                <div className="placeholder-wave">
                  <span className="placeholder col-8"></span>
                </div>
              ) : (
                <>
                  <h4
                    className="mb-1"
                    style={{ color: color, fontWeight: "600" }}
                  >
                    {value}
                  </h4>
                  {subValue && <small className="text-muted">{subValue}</small>}
                  {trend && (
                    <div className="d-flex align-items-center mt-1">
                      <span
                        className={`badge ${
                          trend > 0 ? "bg-success" : "bg-danger"
                        } me-2`}
                      >
                        <FontAwesomeIcon icon={faChartLine} className="me-1" />
                        {trend > 0 ? "+" : ""}
                        {trend}%
                      </span>
                      <small className="text-muted">vs last period</small>
                    </div>
                  )}
                </>
              )}
            </div>
            <div
              className="rounded-circle d-flex align-items-center justify-content-center"
              style={{
                width: "50px",
                height: "50px",
                backgroundColor: iconBgColor || `${color}15`,
                color: color,
              }}
            >
              <FontAwesomeIcon icon={icon} size="lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const metrics = getDashboardMetrics();
  const dateRangeOptions = [
    { id: "today", label: "Today" },
    { id: "yesterday", label: "Yesterday" },
    { id: "last7days", label: "Last 7 Days" },
    { id: "last30days", label: "Last 30 Days" },
    { id: "thisMonth", label: "This Month" },
    { id: "lastMonth", label: "Last Month" },
    { id: "thisYear", label: "This Year" },
    { id: "lastYear", label: "Last Year" },
    { id: "custom", label: "Custom Range" },
  ];

  const exportCSV = () => {
    const csvData = stockAdjustmentReports.map((report) => ({
      Date: report.date,
      ReferenceNo: report.referenceNmber,
      Location: report.businessLocation,
      AdjustmentType: report.adjustmentType,
      TotalAmountRecovered: report.amountRecovered,
      Reason: report.reason,
      AddedBy: report.addedBy,
    }));

    const csv = [
      [
        "Date",
        "Reference No",
        "Location",
        "Adjustment Type",
        "Total Amount Recovered",
        "Reason",
        "Added By",
      ],
      ...csvData.map((row) => Object.values(row)),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, "stock_adjustment_reports.csv");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      stockAdjustmentReports.map((report) => ({
        Date: report.date,
        ReferenceNo: report.referenceNumber,
        Location: report.businesslLocation,
        AdjustmentType: report.adjustmentType,
        TotalAmountRecovered: report.amountRecovered,
        Reason: report.reason,
        AddedBy: report.addedBy,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reports");
    XLSX.writeFile(wb, "stock_adjustment_reports.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [
        [
          "Date",
          "Reference No",
          "Location",
          "Adjustment Type",
          "Total Amount Recovered",
          "Reason",
          "Added By",
        ],
      ],
      body: stockAdjustmentReports.map((report) => [
        report.date,
        report.referenceNumber,
        report.businessLocation,
        report.amountRecovered,
        report.adjustmentType,
        report.reason,
        report.addedBy,
      ]),
    });
    doc.save("stock_adjustment_reports.pdf");
  };

  const printData = () => {
    const tableContent = `
    <html>
      <head>
        <title>Print Stock Adjustment Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h2>Stock Adjustment Report</h2>
        <table>
          <thead>
            <tr>
              ${columnsVisibility.date ? "<th>Date</th>" : ""}
              ${columnsVisibility.referenceNo ? "<th>Reference No</th>" : ""}
              ${columnsVisibility.location ? "<th>Location</th>" : ""}
              ${
                columnsVisibility.adjustmentType
                  ? "<th>Adjustment Type</th>"
                  : ""
              }
              ${
                columnsVisibility.totalAmountRecovered
                  ? "<th>Total Amount Recovered</th>"
                  : ""
              }
              ${columnsVisibility.reason ? "<th>Reason</th>" : ""}
              ${columnsVisibility.addedBy ? "<th>Added By</th>" : ""}
            </tr>
          </thead>
          <tbody>
            ${stockAdjustmentReports
              .slice(startIndex, endIndex)
              .map(
                (report) => `
              <tr>
                ${columnsVisibility.date ? `<td>${report.date}</td>` : ""}
                ${
                  columnsVisibility.referenceNo
                    ? `<td>${report.referenceNumber}</td>`
                    : ""
                }
                ${
                  columnsVisibility.location
                    ? `<td>${report.businessLocation}</td>`
                    : ""
                }
                ${
                  columnsVisibility.adjustmentType
                    ? `<td>${report.adjustmentType}</td>`
                    : ""
                }
                ${
                  columnsVisibility.totalAmountRecovered
                    ? `<td>${report.amountRecovered}</td>`
                    : ""
                }
                ${columnsVisibility.reason ? `<td>${report.reason}</td>` : ""}
                ${columnsVisibility.addedBy ? `<td>${report.addedBy}</td>` : ""}
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </body>
    </html>
  `;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(tableContent);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  const handleEntriesChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;

  const handleView = (report) => {
    setSelectedReport(report);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setSelectedReport(null);
  };

  const toggleColumn = (col) => {
    setColumnsVisibility((prev) => ({
      ...prev,
      [col]: !prev[col],
    }));
  };

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6">
                <h1 className="all-heading">Stock Adjustment Report</h1>
              </div>
              <div className="col-sm-6">
                <ol className="breadcrumb float-sm-right">
                  <li className="breadcrumb-item">
                    <a href="/">Home</a>
                  </li>
                  <li className="breadcrumb-item active">Stock Adjustment</li>
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
                  <div className="card-body py-3">
                    <div className="d-flex flex-wrap align-items-center justify-content-between">
                      <div>
                        <h6 className="mb-0">Report Period</h6>
                        <p className="text-muted mb-0 small">
                          Select date range for stock analysis
                        </p>
                      </div>
                      <div className="d-flex flex-wrap gap-2 mt-2 mt-md-0">
                        {dateRangeOptions.map((option) => (
                          <button
                            key={option.id}
                            className={`btn btn-sm ${
                              dateRange === option.id
                                ? "btn-primary"
                                : "btn-outline-primary"
                            }`}
                            onClick={() => setDateRange(option.id)}
                            style={{
                              borderRadius: "20px",
                              padding: "5px 15px",
                              transition: "all 0.3s ease",
                            }}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
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
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center me-3"
                        style={{
                          width: "50px",
                          height: "50px",
                          backgroundColor: "#3498db",
                          color: "white",
                        }}
                      >
                        <FontAwesomeIcon icon={faExchangeAlt} size="lg" />
                      </div>
                      <div>
                        <h4 className="mb-0">Stock Adjustment Dashboard</h4>
                        <p className="text-muted mb-0">
                          Inventory adjustment metrics and insights
                        </p>
                      </div>
                    </div>

                    <div className="row">
                      <StatCard
                        icon={faMoneyBillWave}
                        title="Total Adjustments"
                        value={metrics.totalAdjustments}
                        subValue={`${metrics.totalReports} total reports`}
                        color="#3498db"
                        trend={metrics.trend}
                        isLoading={isLoading}
                      />

                      <StatCard
                        icon={faCheckCircle}
                        title="Normal Adjustments"
                        value={metrics.totalNormal}
                        subValue={`${metrics.normalCount} normal adjustments`}
                        color="#2ecc71"
                        isLoading={isLoading}
                      />

                      <StatCard
                        icon={faExclamationTriangle}
                        title="Abnormal Adjustments"
                        value={metrics.totalAbnormal}
                        subValue={`${metrics.abnormalCount} abnormal cases`}
                        color="#e74c3c"
                        isLoading={isLoading}
                      />

                      <StatCard
                        icon={faPercent}
                        title="Recovery Rate"
                        value={`${metrics.recoveryRate}%`}
                        subValue={`${metrics.totalRecovered} recovered`}
                        color="#9b59b6"
                        isLoading={isLoading}
                      />
                    </div>

                    {/* Additional Metrics */}
                    <div className="row mt-4">
                      <div className="col-xl-4 col-lg-6 col-md-6 mb-4">
                        <div
                          className="card border-0 shadow-sm h-100"
                          style={{
                            borderLeft: `4px solid #3498db`,
                            background:
                              "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            color: "white",
                          }}
                        >
                          <div className="card-body">
                            <div className="d-flex align-items-center">
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center me-3"
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  backgroundColor: "rgba(255,255,255,0.2)",
                                  color: "white",
                                }}
                              >
                                <FontAwesomeIcon icon={faBoxes} />
                              </div>
                              <div>
                                <h6 className="mb-1" style={{ opacity: 0.9 }}>
                                  Items Adjusted
                                </h6>
                                <h4 className="mb-0">
                                  {isLoading ? (
                                    <div className="placeholder-wave">
                                      <span className="placeholder col-6"></span>
                                    </div>
                                  ) : (
                                    formatNumber(metrics.totalItemsAdjusted)
                                  )}
                                </h4>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="col-xl-4 col-lg-6 col-md-6 mb-4">
                        <div
                          className="card border-0 shadow-sm h-100"
                          style={{
                            borderLeft: `4px solid #3498db`,
                            background:
                              "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                            color: "white",
                          }}
                        >
                          <div className="card-body">
                            <div className="d-flex align-items-center">
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center me-3"
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  backgroundColor: "rgba(255,255,255,0.2)",
                                  color: "white",
                                }}
                              >
                                <FontAwesomeIcon icon={faBalanceScale} />
                              </div>
                              <div>
                                <h6 className="mb-1" style={{ opacity: 0.9 }}>
                                  Abnormality Rate
                                </h6>
                                <h4 className="mb-0">
                                  {isLoading ? (
                                    <div className="placeholder-wave">
                                      <span className="placeholder col-6"></span>
                                    </div>
                                  ) : (
                                    `${metrics.abnormalityRate}%`
                                  )}
                                </h4>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="col-xl-4 col-lg-12 col-md-12 mb-4">
                        <div
                          className="card border-0 shadow-sm h-100"
                          style={{
                            borderLeft: `4px solid #3498db`,
                          }}
                        >
                          <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between">
                              <div>
                                <h6 className="text-muted mb-2">
                                  Adjustment Efficiency
                                </h6>
                                {isLoading ? (
                                  <div className="placeholder-wave">
                                    <span className="placeholder col-4"></span>
                                  </div>
                                ) : (
                                  <>
                                    <h4 className="mb-1">
                                      {metrics.efficiency}
                                    </h4>
                                    <div className="d-flex align-items-center">
                                      <span
                                        className={`badge ${
                                          metrics.recoveryRate > 50
                                            ? "bg-success"
                                            : metrics.recoveryRate > 25
                                            ? "bg-warning"
                                            : "bg-danger"
                                        } me-2`}
                                      >
                                        <FontAwesomeIcon
                                          icon={faChartLine}
                                          className="me-1"
                                        />
                                        {metrics.recoveryRate}% RR
                                      </span>
                                      <small className="text-muted">
                                        Recovery performance
                                      </small>
                                    </div>
                                  </>
                                )}
                              </div>
                              <div className="text-end">
                                <div
                                  className="rounded-circle d-flex align-items-center justify-content-center ms-auto"
                                  style={{
                                    width: "60px",
                                    height: "60px",
                                    backgroundColor: "#3498db15",
                                    color: "#3498db",
                                  }}
                                >
                                  <FontAwesomeIcon
                                    icon={faCalculator}
                                    size="lg"
                                  />
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

            {/* Recent Adjustments Quick View */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-white border-0">
                    <h5 className="mb-0">
                      <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                      Recent Adjustments
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Reference No</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Recovered</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {metrics.recentAdjustments.map((report, index) => (
                            <tr
                              key={index}
                              style={{ cursor: "pointer" }}
                              onClick={() => handleView(report)}
                            >
                              <td>{report.date}</td>
                              <td>{report.referenceNumber}</td>
                              <td>
                                <span
                                  className={`badge ${
                                    report.adjustmentType === "normal"
                                      ? "bg-success"
                                      : "bg-danger"
                                  }`}
                                >
                                  {report.adjustmentType}
                                </span>
                              </td>
                              <td>{formatCurrency(report.totalAmount)}</td>
                              <td>{formatCurrency(report.amountRecovered)}</td>
                              <td>
                                <span
                                  className={`badge ${
                                    Number(report.amountRecovered) > 0
                                      ? "bg-success"
                                      : "bg-warning"
                                  }`}
                                >
                                  {Number(report.amountRecovered) > 0
                                    ? "Recovered"
                                    : "Pending"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
                            {columnsVisibility.date && <th>Date</th>}
                            {columnsVisibility.referenceNo && (
                              <th>Reference No</th>
                            )}
                            {columnsVisibility.location && <th>Location</th>}
                            {columnsVisibility.adjustmentType && (
                              <th>Adjustment Type</th>
                            )}
                            {columnsVisibility.totalAmount && (
                              <th>Total Amount </th>
                            )}

                            {columnsVisibility.totalAmountRecovered && (
                              <th>Total Amount Recovered</th>
                            )}
                            {columnsVisibility.reason && <th>Reason</th>}
                            {columnsVisibility.addedBy && <th>Added By</th>}
                            {columnsVisibility.action && <th>Action</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {stockAdjustmentReports
                            .slice(startIndex, endIndex)
                            .map((report, index) => (
                              <tr key={index}>
                                {columnsVisibility.date && (
                                  <td>{report.date}</td>
                                )}
                                {columnsVisibility.referenceNo && (
                                  <td>{report.referenceNumber}</td>
                                )}
                                {columnsVisibility.location && (
                                  <td>{report.businessLocation}</td>
                                )}
                                {columnsVisibility.adjustmentType && (
                                  <td>
                                    <span
                                      className={`badge ${
                                        report.adjustmentType === "normal"
                                          ? "bg-success"
                                          : "bg-danger"
                                      }`}
                                    >
                                      {report.adjustmentType}
                                    </span>
                                  </td>
                                )}
                                {columnsVisibility.totalAmount && (
                                  <td>{formatCurrency(report.totalAmount)}</td>
                                )}
                                {columnsVisibility.totalAmountRecovered && (
                                  <td>
                                    <span
                                      className={`${
                                        Number(report.amountRecovered) > 0
                                          ? "text-success"
                                          : "text-warning"
                                      }`}
                                    >
                                      {formatCurrency(report.amountRecovered)}
                                    </span>
                                  </td>
                                )}
                                {columnsVisibility.reason && (
                                  <td>{report.reason}</td>
                                )}
                                {columnsVisibility.addedBy && (
                                  <td>{report.addedBy}</td>
                                )}
                                {columnsVisibility.action && (
                                  <td>
                                    <button
                                      className="btn btn-view btn-sm mr-2"
                                      onClick={() => handleView(report)}
                                      style={{
                                        background:
                                          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                        color: "white",
                                        border: "none",
                                        padding: "5px 15px",
                                        borderRadius: "4px",
                                      }}
                                    >
                                      <i className="fas fa-eye"></i> View
                                    </button>
                                  </td>
                                )}
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Modal for viewing detailed report */}
      <Modal show={showModal} onHide={handleClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Stock Adjustment Report Details</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {selectedReport && (
            <div>
              <h4 className="mb-3">
                Stock adjustment details (<b>Reference No:</b>{" "}
                {selectedReport.referenceNumber})
              </h4>

              {/* Date */}
              <div className="text-end mb-3">
                <b>Date:</b> {selectedReport.date}
              </div>

              {/* Business Info */}
              <div className="row mb-4">
                <div className="col-md-4">
                  <b>Business Location:</b>
                  <address>
                    <strong>{selectedReport.businessLocation}</strong>
                  </address>
                </div>

                <div className="col-md-4">
                  <b>Reference Number:</b> {selectedReport.referenceNumber}{" "}
                  <br />
                  <b>Date:</b> {selectedReport.date} <br />
                  <b>Adjustment Type:</b> {selectedReport.adjustmentType} <br />
                  <b>Reason:</b> {selectedReport.reason || "—"} <br />
                </div>
              </div>

              {/* ITEMS TABLE */}
              <div className="table-responsive mb-4">
                <table className="table table-bordered">
                  <thead className="bg-green text-white">
                    <tr>
                      <th>Product</th>
                      <th>Variation</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>

                  <tbody>
                    {selectedReport.stockAdjustmentItems.map((item) => (
                      <tr key={item.id}>
                        <td>{item.productName}</td>
                        <td>{item.productVariationName || "—"}</td>
                        <td>{item.quantity}</td>
                        <td>₹{Number(item.unitSellingPrice).toFixed(2)}</td>
                        <td>
                          ₹
                          {(
                            item.quantity * Number(item.unitSellingPrice)
                          ).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* TOTALS */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <table className="table table-bordered">
                    <tbody>
                      <tr>
                        <th>Total Amount:</th>
                        <td>
                          ₹{Number(selectedReport.totalAmount).toFixed(2)}
                        </td>
                      </tr>

                      <tr>
                        <th>Total Amount Recovered:</th>
                        <td>
                          ₹{Number(selectedReport.amountRecovered).toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* STOCK ACTIVITIES (stockTransaction) */}
              <div className="row">
                <div className="col-12">
                  <strong>Stock Activities:</strong>

                  <table className="table table-bordered mt-2">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Action</th>
                        <th>Quantity</th>
                        <th>Note</th>
                      </tr>
                    </thead>

                    <tbody>
                      {selectedReport.stockTransaction.length === 0 && (
                        <tr>
                          <td colSpan="4" className="text-center">
                            No activity found
                          </td>
                        </tr>
                      )}

                      {selectedReport.stockTransaction.map((tr) => (
                        <tr key={tr.id}>
                          <td>{tr.date}</td>
                          <td>{tr.transactionType}</td>
                          <td>{tr.quantity}</td>
                          <td>{tr.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <button className="btn btn-secondary" onClick={handleClose}>
            Close
          </button>
          <button className="btn btn-primary" onClick={() => window.print()}>
            <i className="fa fa-print"></i> Print
          </button>
        </Modal.Footer>
      </Modal>

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
        }
      `}</style>
    </div>
  );
};

export default StockAdjustmentReport;
