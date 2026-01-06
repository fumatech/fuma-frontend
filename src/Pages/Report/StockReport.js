import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../assets/dist/css/adminlte.min.css";
import "../../assets/plugins/fontawesome-free/css/all.min.css";
import "../../assets/plugins/datatables-bs4/css/dataTables.bootstrap4.min.css";
import "../../assets/plugins/datatables-responsive/css/responsive.bootstrap4.min.css";
import "../../assets/plugins/datatables-buttons/css/buttons.bootstrap4.min.css";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import { Link, useNavigate } from "react-router-dom";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import $ from "jquery";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxes,
  faWarehouse,
  faChartLine,
  faMoneyBillWave,
  faPercent,
  faExchangeAlt,
  faBox,
  faArrowUp,
  faArrowDown,
  faDollarSign,
  faShoppingCart,
  faBalanceScale,
  faExclamationTriangle,
  faTachometerAlt,
  faCube
} from "@fortawesome/free-solid-svg-icons";

const StockReport = () => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [columnsVisibility, setColumnsVisibility] = useState({
    action: true,
    sku: true,
    product: true,
    variation: true,
    category: true,
    location: false,
    unitSellingPrice: true,
    currentStock: true,
    currentStockValueByPurchase: true,
    currentStockValueBySale: true,
    potentialProfit: true,
    totalUnitSold: true,
    totalUnitAdjusted: true,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [dateRange, setDateRange] = useState("thisMonth");
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalStockValue: 0,
    totalItems: 0,
    totalSold: 0,
    totalAdjusted: 0,
    potentialProfit: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    avgStockValue: 0,
    stockTurnoverRatio: 0,
    topSellingProduct: "",
    highestValueProduct: "",
    stockEfficiency: 0
  });

  // ============================ FETCH API ============================
  useEffect(() => {
    const fetchInventoryItems = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/stock-report/report`
        );

        const data = await response.json();
        if (Array.isArray(data)) {
          setInventoryItems(data);
          calculateDashboardMetrics(data);
        } else {
          setInventoryItems([]);
        }
      } catch (err) {
        console.error("Error fetching stock report:", err);
        setInventoryItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInventoryItems();
  }, []);

  const calculateDashboardMetrics = (data) => {
    const totalStockValue = data.reduce((sum, item) => 
      sum + (parseFloat(item.currentStockValueBySale) || 0), 0);
    const totalSold = data.reduce((sum, item) => 
      sum + (parseFloat(item.totalSold) || 0), 0);
    const totalAdjusted = data.reduce((sum, item) => 
      sum + (parseFloat(item.totalAdjusted) || 0), 0);
    const potentialProfit = data.reduce((sum, item) => 
      sum + (parseFloat(item.potentialProfit) || 0), 0);
    
    // Count low stock items (currentStock < 10)
    const lowStockCount = data.filter(item => 
      (parseFloat(item.currentStock) || 0) < 10 && (parseFloat(item.currentStock) || 0) > 0
    ).length;
    
    // Count out of stock items
    const outOfStockCount = data.filter(item => 
      (parseFloat(item.currentStock) || 0) <= 0
    ).length;

    // Find top selling product
    const topSellingProduct = data.reduce((max, item) => 
      (parseFloat(item.totalSold) || 0) > (parseFloat(max.totalSold) || 0) ? item : max, 
      { productName: "N/A", totalSold: 0 }
    );

    // Find highest value product
    const highestValueProduct = data.reduce((max, item) => 
      (parseFloat(item.currentStockValueBySale) || 0) > (parseFloat(max.currentStockValueBySale) || 0) ? item : max, 
      { productName: "N/A", currentStockValueBySale: 0 }
    );

    // Calculate average stock value per item
    const avgStockValue = data.length > 0 ? totalStockValue / data.length : 0;

    // Calculate stock turnover ratio (sold / total stock)
    const totalStock = data.reduce((sum, item) => 
      sum + (parseFloat(item.currentStock) || 0), 0);
    const stockTurnoverRatio = totalStock > 0 ? (totalSold / totalStock) * 100 : 0;

    // Stock efficiency score (based on various factors)
    const stockEfficiency = Math.min(100, 
      (100 - (outOfStockCount / data.length * 50) - (lowStockCount / data.length * 25))
    );

    setDashboardData({
      totalStockValue,
      totalItems: data.length,
      totalSold,
      totalAdjusted,
      potentialProfit,
      lowStockCount,
      outOfStockCount,
      avgStockValue,
      stockTurnoverRatio,
      topSellingProduct: topSellingProduct.productName,
      highestValueProduct: highestValueProduct.productName,
      stockEfficiency: Math.round(stockEfficiency)
    });
  };

  useEffect(() => {
    if (inventoryItems.length > 0) {
      if ($.fn.dataTable.isDataTable("#example1")) {
        $("#example1").DataTable().destroy();
      }

      $("#example1").DataTable({
        paging: true,
        searching: true,
        ordering: true,
        lengthChange: false,
        pageLength: entriesPerPage,
      });
    }
  }, [inventoryItems, entriesPerPage]);

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

  // ============================ PAGINATION ============================
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;

  const handleEntriesChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // ============================ EXPORTS ============================
  const exportCSV = () => {
    const csvData = inventoryItems.map((item) => ({
      SKU: item.sku,
      Product: item.productName,
      Variation: item.variationValue || "-",
      Category: item.category?.categoryName || "",
      Location: item.businessLocation?.locationName || "",
      UnitSellingPrice: item.unitSellingPrice,
      CurrentStock: item.currentStock,
      CurrentStockValueByPurchase: item.currentStockValueByPurchase,
      CurrentStockValueBySale: item.currentStockValueBySale,
      PotentialProfit: item.potentialProfit,
      TotalUnitSold: item.totalSold,
      TotalUnitAdjusted: item.totalAdjusted,
    }));

    const csv = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) => Object.values(row).join(",")),
    ].join("\n");

    saveAs(new Blob([csv], { type: "text/csv" }), "stock_report.csv");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(inventoryItems);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "StockReport");
    XLSX.writeFile(wb, "stock_report.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [
        [
          "SKU",
          "Product",
          "Variation",
          "Category",
          "Location",
          "Unit SP",
          "Stock",
          "Stock Value (Purchase)",
          "Stock Value (Sale)",
          "Profit",
          "Sold",
          "Adjusted",
        ],
      ],
      body: inventoryItems.map((item) => [
        item.sku,
        item.productName,
        item.variationValue || "-",
        item.category?.categoryName || "",
        item.businessLocation?.locationName || "",
        item.unitSellingPrice,
        item.currentStock,
        item.currentStockValueByPurchase,
        item.currentStockValueBySale,
        item.potentialProfit,
        item.totalSold,
        item.totalAdjusted,
      ]),
    });

    doc.save("stock_report.pdf");
  };

  // ============================ PRINT ============================
  const printData = () => {
    const rows = inventoryItems
      .slice(startIndex, endIndex)
      .map(
        (item) => `
      <tr>
        ${columnsVisibility.sku ? `<td>${item.sku}</td>` : ""}
        ${columnsVisibility.product ? `<td>${item.productName}</td>` : ""}
        ${
          columnsVisibility.variation
            ? `<td>${item.variationValue || "-"}</td>`
            : ""
        }
        ${
          columnsVisibility.category
            ? `<td>${item.category?.categoryName || ""}</td>`
            : ""
        }
        ${
          columnsVisibility.location
            ? `<td>${item.businessLocation?.locationName || ""}</td>`
            : ""
        }
        ${
          columnsVisibility.unitSellingPrice
            ? `<td>${item.unitSellingPrice}</td>`
            : ""
        }
        ${columnsVisibility.currentStock ? `<td>${item.currentStock}</td>` : ""}
        ${
          columnsVisibility.currentStockValueByPurchase
            ? `<td>${item.currentStockValueByPurchase}</td>`
            : ""
        }
        ${
          columnsVisibility.currentStockValueBySale
            ? `<td>${item.currentStockValueBySale}</td>`
            : ""
        }
        ${
          columnsVisibility.potentialProfit
            ? `<td>${item.potentialProfit}</td>`
            : ""
        }
        ${columnsVisibility.totalUnitSold ? `<td>${item.totalSold}</td>` : ""}
        ${
          columnsVisibility.totalUnitAdjusted
            ? `<td>${item.totalAdjusted}</td>`
            : ""
        }
      </tr>`
      )
      .join("");

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Stock Report</title>
          <style>
            table { width:100%; border-collapse:collapse; }
            th, td { border:1px solid #ddd; padding:8px; }
            th { background:#f2f2f2; }
          </style>
        </head>
        <body>
          <h2>Stock Report</h2>
          <table>
            <thead>
              <tr>
                ${columnsVisibility.sku ? "<th>SKU</th>" : ""}
                ${columnsVisibility.product ? "<th>Product</th>" : ""}
                ${columnsVisibility.variation ? "<th>Variation</th>" : ""}
                ${columnsVisibility.category ? "<th>Category</th>" : ""}
                ${columnsVisibility.location ? "<th>Location</th>" : ""}
                ${
                  columnsVisibility.unitSellingPrice
                    ? "<th>Unit Selling Price</th>"
                    : ""
                }
                ${
                  columnsVisibility.currentStock ? "<th>Current Stock</th>" : ""
                }
                ${
                  columnsVisibility.currentStockValueByPurchase
                    ? "<th>Stock Value (Purchase)</th>"
                    : ""
                }
                ${
                  columnsVisibility.currentStockValueBySale
                    ? "<th>Stock Value (Sale)</th>"
                    : ""
                }
                ${columnsVisibility.potentialProfit ? "<th>Profit</th>" : ""}
                ${columnsVisibility.totalUnitSold ? "<th>Sold</th>" : ""}
                ${
                  columnsVisibility.totalUnitAdjusted ? "<th>Adjusted</th>" : ""
                }
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  const toggleColumn = (col) => {
    setColumnsVisibility((prev) => ({
      ...prev,
      [col]: !prev[col],
    }));
  };

  // Calculate stock status indicators
  const getStockStatus = (stock) => {
    const stockNum = parseFloat(stock) || 0;
    if (stockNum <= 0) return { text: "Out of Stock", color: "#e74c3c", bgColor: "#fadbd8" };
    if (stockNum < 10) return { text: "Low Stock", color: "#f39c12", bgColor: "#fef9e7" };
    if (stockNum < 50) return { text: "Medium Stock", color: "#3498db", bgColor: "#ebf5fb" };
    return { text: "High Stock", color: "#2ecc71", bgColor: "#e8f6f3" };
  };

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6">
                <h1 className="all-heading">Stock Report</h1>
              </div>
              <div className="col-sm-6">
                <ol className="breadcrumb float-sm-right">
                  <li className="breadcrumb-item">
                    <a href="/">Home</a>
                  </li>
                  <li className="breadcrumb-item active">Stock Report</li>
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
                        <p className="text-muted mb-0 small">Select date range for stock analysis</p>
                      </div>
                      <div className="d-flex flex-wrap gap-2 mt-2 mt-md-0">
                        {dateRangeOptions.map((option) => (
                          <button
                            key={option.id}
                            className={`btn btn-sm ${dateRange === option.id ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setDateRange(option.id)}
                            style={{
                              borderRadius: '20px',
                              padding: '5px 15px',
                              transition: 'all 0.3s ease'
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
                      <div className="rounded-circle d-flex align-items-center justify-content-center me-3"
                           style={{ 
                             width: '50px', 
                             height: '50px', 
                             backgroundColor: '#3498db',
                             color: 'white' 
                           }}>
                        <FontAwesomeIcon icon={faWarehouse} size="lg" />
                      </div>
                      <div>
                        <h4 className="mb-0">Inventory Dashboard</h4>
                        <p className="text-muted mb-0">Stock metrics and inventory insights</p>
                      </div>
                    </div>

                    <div className="row">
                      <StatCard
                        icon={faMoneyBillWave}
                        title="Total Stock Value"
                        value={formatCurrency(dashboardData.totalStockValue)}
                        subValue={`${dashboardData.totalItems} items in stock`}
                        color="#3498db"
                        trend={8.5}
                        isLoading={isLoading}
                      />
                      
                      <StatCard
                        icon={faShoppingCart}
                        title="Total Units Sold"
                        value={formatNumber(dashboardData.totalSold)}
                        subValue={`${formatNumber(dashboardData.totalAdjusted)} units adjusted`}
                        color="#2ecc71"
                        trend={12.3}
                        isLoading={isLoading}
                      />
                      
                      <StatCard
                        icon={faPercent}
                        title="Stock Efficiency"
                        value={`${dashboardData.stockEfficiency}%`}
                        subValue={`${dashboardData.lowStockCount} low stock items`}
                        color="#9b59b6"
                        isLoading={isLoading}
                      />
                      
                      <StatCard
                        icon={faDollarSign}
                        title="Potential Profit"
                        value={formatCurrency(dashboardData.potentialProfit)}
                        subValue={`${formatCurrency(dashboardData.avgStockValue)} avg per item`}
                        color="#f39c12"
                        trend={5.7}
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
                                <FontAwesomeIcon icon={faExclamationTriangle} />
                              </div>
                              <div>
                                <h6 className="mb-1" style={{ opacity: 0.9 }}>Stock Alerts</h6>
                                <div className="d-flex align-items-center">
                                  <div className="me-3">
                                    <small>Out of Stock</small>
                                    <h4 className="mb-0 mt-1">{dashboardData.outOfStockCount}</h4>
                                  </div>
                                  <div>
                                    <small>Low Stock</small>
                                    <h4 className="mb-0 mt-1">{dashboardData.lowStockCount}</h4>
                                  </div>
                                </div>
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
                                <FontAwesomeIcon icon={faCube} />
                              </div>
                              <div>
                                <h6 className="mb-1" style={{ opacity: 0.9 }}>Top Performing</h6>
                                <h4 className="mb-0 text-truncate" style={{ fontSize: '1.1rem' }}>
                                  {isLoading ? (
                                    <div className="placeholder-wave">
                                      <span className="placeholder col-8"></span>
                                    </div>
                                  ) : (
                                    dashboardData.topSellingProduct || "N/A"
                                  )}
                                </h4>
                                <small>Best selling product</small>
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
                                <h6 className="text-muted mb-2">Turnover Ratio</h6>
                                {isLoading ? (
                                  <div className="placeholder-wave">
                                    <span className="placeholder col-4"></span>
                                  </div>
                                ) : (
                                  <>
                                    <h4 className="mb-1">
                                      {dashboardData.stockTurnoverRatio.toFixed(1)}%
                                    </h4>
                                    <div className="d-flex align-items-center">
                                      <span className={`badge ${dashboardData.stockTurnoverRatio > 50 ? 'bg-success' : dashboardData.stockTurnoverRatio > 25 ? 'bg-warning' : 'bg-danger'} me-2`}>
                                        <FontAwesomeIcon icon={faChartLine} className="me-1" />
                                        {dashboardData.stockTurnoverRatio > 50 ? 'Fast' : dashboardData.stockTurnoverRatio > 25 ? 'Medium' : 'Slow'}
                                      </span>
                                      <small className="text-muted">
                                        Stock movement
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

            {/* Stock Status Overview */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-white border-0">
                    <h5 className="mb-0">
                      <FontAwesomeIcon icon={faBoxes} className="me-2" />
                      Stock Status Overview
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-3 col-6 mb-3">
                        <div className="d-flex align-items-center">
                          <div className="rounded-circle d-flex align-items-center justify-content-center me-3"
                               style={{ 
                                 width: '40px', 
                                 height: '40px', 
                                 backgroundColor: '#e8f6f3',
                                 color: '#2ecc71' 
                               }}>
                            <FontAwesomeIcon icon={faBox} />
                          </div>
                          <div>
                            <h6 className="mb-0" style={{ fontSize: '0.8rem' }}>High Stock Items</h6>
                            <p className="mb-0 fw-bold">
                              {formatNumber(inventoryItems.filter(item => 
                                (parseFloat(item.currentStock) || 0) >= 50
                              ).length)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-md-3 col-6 mb-3">
                        <div className="d-flex align-items-center">
                          <div className="rounded-circle d-flex align-items-center justify-content-center me-3"
                               style={{ 
                                 width: '40px', 
                                 height: '40px', 
                                 backgroundColor: '#ebf5fb',
                                 color: '#3498db' 
                               }}>
                            <FontAwesomeIcon icon={faBox} />
                          </div>
                          <div>
                            <h6 className="mb-0" style={{ fontSize: '0.8rem' }}>Medium Stock</h6>
                            <p className="mb-0 fw-bold">
                              {formatNumber(inventoryItems.filter(item => {
                                const stock = parseFloat(item.currentStock) || 0;
                                return stock >= 10 && stock < 50;
                              }).length)}
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
                            <FontAwesomeIcon icon={faExclamationTriangle} />
                          </div>
                          <div>
                            <h6 className="mb-0" style={{ fontSize: '0.8rem' }}>Low Stock</h6>
                            <p className="mb-0 fw-bold">
                              {formatNumber(dashboardData.lowStockCount)}
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
                                 backgroundColor: '#fadbd8',
                                 color: '#e74c3c' 
                               }}>
                            <FontAwesomeIcon icon={faExclamationTriangle} />
                          </div>
                          <div>
                            <h6 className="mb-0" style={{ fontSize: '0.8rem' }}>Out of Stock</h6>
                            <p className="mb-0 fw-bold">
                              {formatNumber(dashboardData.outOfStockCount)}
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
                    {/* TOP BAR (EXPORT, ENTRIES, COLUMNS) */}
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

                    {/* TABLE */}
                    <div id="table-container" style={{ overflowX: "auto" }}>
                      <table
                        id="example1"
                        className="table table-bordered table-hover"
                      >
                        <thead>
                          <tr>
                            {columnsVisibility.action && <th>Actions</th>}
                            {columnsVisibility.sku && <th>SKU</th>}
                            {columnsVisibility.product && <th>Product</th>}
                            {columnsVisibility.variation && <th>Variation</th>}
                            {columnsVisibility.category && <th>Category</th>}
                            {columnsVisibility.location && <th>Location</th>}
                            {columnsVisibility.unitSellingPrice && (
                              <th>Unit Selling Price</th>
                            )}
                            {columnsVisibility.currentStock && (
                              <th>Current Stock</th>
                            )}
                            {columnsVisibility.currentStockValueByPurchase && (
                              <th>Stock Value (Purchase)</th>
                            )}
                            {columnsVisibility.currentStockValueBySale && (
                              <th>Stock Value (Sale)</th>
                            )}
                            {columnsVisibility.potentialProfit && (
                              <th>Potential Profit</th>
                            )}
                            {columnsVisibility.totalUnitSold && (
                              <th>Total Unit Sold</th>
                            )}
                            {columnsVisibility.totalUnitAdjusted && (
                              <th>Total Unit Adjusted</th>
                            )}
                          </tr>
                        </thead>

                        <tbody>
                          {inventoryItems
                            .slice(startIndex, endIndex)
                            .map((item) => {
                              const stockStatus = getStockStatus(item.currentStock);
                              return (
                              <tr key={item.id}>
                                {columnsVisibility.action && (
                                  <td>
                                    <Link
                                      className="tw-dw-btn tw-dw-btn-xs tw-dw-btn-outline tw-dw-btn-info tw-w-max"
                                      to={`/ProductStockHistory?productId=${item.productId}&variationId=${item.variationId}`}
                                      style={{
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: 'white',
                                        border: 'none',
                                        padding: '5px 15px',
                                        borderRadius: '4px',
                                        textDecoration: 'none',
                                        display: 'inline-block'
                                      }}
                                    >
                                      <i className="fas fa-history"></i> Stock History
                                    </Link>
                                  </td>
                                )}

                                {columnsVisibility.sku && <td>{item.sku}</td>}
                                {columnsVisibility.product && (
                                  <td>
                                    <div className="d-flex align-items-center">
                                      <span>{item.productName}</span>
                                      <span className="badge ms-2" style={{
                                        backgroundColor: stockStatus.bgColor,
                                        color: stockStatus.color,
                                        fontSize: '0.7rem',
                                        padding: '2px 6px'
                                      }}>
                                        {stockStatus.text}
                                      </span>
                                    </div>
                                  </td>
                                )}
                                {columnsVisibility.variation && (
                                  <td>{item.variationValue || "-"}</td>
                                )}
                                {columnsVisibility.category && (
                                  <td>{item.category}</td>
                                )}
                                {columnsVisibility.location && (
                                  <td>
                                    {item.businessLocation?.locationName || ""}
                                  </td>
                                )}
                                {columnsVisibility.unitSellingPrice && (
                                  <td>{formatCurrency(item.unitSellingPrice)}</td>
                                )}
                                {columnsVisibility.currentStock && (
                                  <td>
                                    <span style={{ 
                                      color: stockStatus.color,
                                      fontWeight: '600'
                                    }}>
                                      {item.currentStock}
                                    </span>
                                  </td>
                                )}
                                {columnsVisibility.currentStockValueByPurchase && (
                                  <td>{formatCurrency(item.currentStockValueByPurchase)}</td>
                                )}
                                {columnsVisibility.currentStockValueBySale && (
                                  <td>{formatCurrency(item.currentStockValueBySale)}</td>
                                )}
                                {columnsVisibility.potentialProfit && (
                                  <td>
                                    <span className="text-success fw-bold">
                                      {formatCurrency(item.potentialProfit)}
                                    </span>
                                  </td>
                                )}
                                {columnsVisibility.totalUnitSold && (
                                  <td>{item.totalSold}</td>
                                )}
                                {columnsVisibility.totalUnitAdjusted && (
                                  <td>{item.totalAdjusted}</td>
                                )}
                              </tr>
                            )})}
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

export default StockReport;