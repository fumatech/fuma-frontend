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
  faBox,
  faChartLine,
  faMoneyBillWave,
  faExchangeAlt,
  faPercent,
  faCalendarAlt,
  faShoppingCart,
  faUsers,
  faWarehouse,
  faTag,
  faTruck,
  faBalanceScale,
  faCalculator,
  faArrowUp,
  faArrowDown
} from "@fortawesome/free-solid-svg-icons";

const ItemReport = () => {
  const [reportItems, setReportItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [columnsVisibility, setColumnsVisibility] = useState({
    product: true,
    sku: true,
    description: true,
    purchaseDate: true,
    purchase: true,
    lotNumber: true,
    supplier: true,
    purchasePrice: true,
    sellDate: true,
    sale: true,
    customer: true,
    location: true,
    sellQuantity: true,
    selling: true,
    subtotal: true,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [dateRange, setDateRange] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalItems: 0,
    totalPurchaseValue: 0,
    totalSalesValue: 0,
    totalProfit: 0,
    profitMargin: 0,
    avgPurchasePrice: 0,
    avgSellingPrice: 0,
    totalQuantitySold: 0,
    uniqueCustomers: 0,
    uniqueSuppliers: 0,
    turnoverRate: 0,
    topSellingProduct: "",
    mostProfitableProduct: ""
  });

  useEffect(() => {
    const fetchReportItems = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/itemReport/getall`
        );

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();
        if (Array.isArray(data)) {
          setReportItems(data);
          setFilteredItems(data);
          calculateDashboardMetrics(data);
        } else {
          console.error("Fetched data is not an array");
          setReportItems([]);
          setFilteredItems([]);
        }
      } catch (error) {
        console.error("Error fetching report items:", error);
        setReportItems([]);
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
  }, [dateRange, startDate, endDate, reportItems]);

  const filterByDateRange = () => {
    let filtered = [...reportItems];
    
    if (dateRange === "custom" && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.sellDate || item.purchaseDate);
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
        const itemDate = new Date(item.sellDate || item.purchaseDate);
        return itemDate >= start && itemDate <= end;
      });
    }
    
    setFilteredItems(filtered);
    calculateDashboardMetrics(filtered);
    setCurrentPage(1);
  };

  const calculateDashboardMetrics = (data) => {
    const totalPurchaseValue = data.reduce((sum, item) => 
      sum + (parseFloat(item.purchasePrice) || 0), 0);
    const totalSalesValue = data.reduce((sum, item) => 
      sum + (parseFloat(item.subtotal) || 0), 0);
    const totalQuantitySold = data.reduce((sum, item) => 
      sum + (parseFloat(item.sellQuantity) || 0), 0);
    
    const totalProfit = totalSalesValue - totalPurchaseValue;
    const profitMargin = totalSalesValue > 0 ? (totalProfit / totalSalesValue * 100) : 0;
    const avgPurchasePrice = data.length > 0 ? totalPurchaseValue / data.length : 0;
    const avgSellingPrice = data.length > 0 ? totalSalesValue / data.length : 0;
    
    // Count unique customers and suppliers
    const customers = new Set();
    const suppliers = new Set();
    data.forEach(item => {
      if (item.customer) customers.add(item.customer);
      if (item.supplier) suppliers.add(item.supplier);
    });
    
    // Find top selling and most profitable products
    const productSales = {};
    const productProfits = {};
    
    data.forEach(item => {
      if (item.product) {
        productSales[item.product] = (productSales[item.product] || 0) + (parseFloat(item.sellQuantity) || 0);
        const profit = (parseFloat(item.subtotal) || 0) - (parseFloat(item.purchasePrice) || 0);
        productProfits[item.product] = (productProfits[item.product] || 0) + profit;
      }
    });
    
    const topSellingProduct = Object.keys(productSales).reduce((a, b) => 
      productSales[a] > productSales[b] ? a : b, "N/A"
    );
    
    const mostProfitableProduct = Object.keys(productProfits).reduce((a, b) => 
      productProfits[a] > productProfits[b] ? a : b, "N/A"
    );
    
    // Calculate turnover rate (inventory turnover)
    const turnoverRate = totalPurchaseValue > 0 ? (totalSalesValue / totalPurchaseValue) * 100 : 0;
    
    setDashboardData({
      totalItems: data.length,
      totalPurchaseValue,
      totalSalesValue,
      totalProfit,
      profitMargin,
      avgPurchasePrice,
      avgSellingPrice,
      totalQuantitySold,
      uniqueCustomers: customers.size,
      uniqueSuppliers: suppliers.size,
      turnoverRate,
      topSellingProduct,
      mostProfitableProduct
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
      Product: item.product,
      SKU: item.sku,
      Description: item.description,
      PurchaseDate: item.purchaseDate,
      Purchase: item.purchase,
      LotNumber: item.lotNumber,
      Supplier: item.supplier,
      PurchasePrice: item.purchasePrice,
      SellDate: item.sellDate,
      Sale: item.sale,
      Customer: item.customer,
      Location: item.location,
      SellQuantity: item.sellQuantity,
      Selling: item.selling,
      Subtotal: item.subtotal,
    }));

    const csv = [
      [
        "Product",
        "SKU",
        "Description",
        "Purchase Date",
        "Purchase",
        "Lot Number",
        "Supplier",
        "Purchase Price",
        "Sell Date",
        "Sale",
        "Customer",
        "Location",
        "Sell Quantity",
        "Selling",
        "Subtotal",
      ],
      ...csvData.map((row) => Object.values(row)),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, `item_report_${dateRange}.csv`);
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredItems.map((item) => ({
        Product: item.product,
        SKU: item.sku,
        Description: item.description,
        PurchaseDate: item.purchaseDate,
        Purchase: item.purchase,
        LotNumber: item.lotNumber,
        Supplier: item.supplier,
        PurchasePrice: item.purchasePrice,
        SellDate: item.sellDate,
        Sale: item.sale,
        Customer: item.customer,
        Location: item.location,
        SellQuantity: item.sellQuantity,
        Selling: item.selling,
        Subtotal: item.subtotal,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report Items");
    XLSX.writeFile(wb, `item_report_${dateRange}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Item Report - ${dateRange}`, 14, 15);
    doc.autoTable({
      startY: 25,
      head: [
        [
          "Product",
          "SKU",
          "Description",
          "Purchase Date",
          "Purchase",
          "Lot Number",
          "Supplier",
          "Purchase Price",
          "Sell Date",
          "Sale",
          "Customer",
          "Location",
          "Sell Quantity",
          "Selling",
          "Subtotal",
        ],
      ],
      body: filteredItems.map((item) => [
        item.product,
        item.sku,
        item.description,
        item.purchaseDate,
        item.purchase,
        item.lotNumber,
        item.supplier,
        item.purchasePrice,
        item.sellDate,
        item.sale,
        item.customer,
        item.location,
        item.sellQuantity,
        item.selling,
        item.subtotal,
      ]),
    });
    doc.save(`item_report_${dateRange}.pdf`);
  };

  const printData = () => {
    const rows = filteredItems
      .slice(startIndex, endIndex)
      .map(
        (item) => `
      <tr>
        ${columnsVisibility.product ? `<td>${item.product}</td>` : ""}
        ${columnsVisibility.sku ? `<td>${item.sku}</td>` : ""}
        ${columnsVisibility.description ? `<td>${item.description}</td>` : ""}
        ${
          columnsVisibility.purchaseDate
            ? `<td>${item.purchaseDate}</td>`
            : ""
        }
        ${columnsVisibility.purchase ? `<td>${item.purchase}</td>` : ""}
        ${
          columnsVisibility.lotNumber ? `<td>${item.lotNumber}</td>` : ""
        }
        ${columnsVisibility.supplier ? `<td>${item.supplier}</td>` : ""}
        ${
          columnsVisibility.purchasePrice
            ? `<td>${item.purchasePrice}</td>`
            : ""
        }
        ${
          columnsVisibility.sellDate
            ? `<td>${item.sellDate}</td>`
            : ""
        }
        ${columnsVisibility.sale ? `<td>${item.sale}</td>` : ""}
        ${
          columnsVisibility.customer
            ? `<td>${item.customer}</td>`
            : ""
        }
        ${
          columnsVisibility.location
            ? `<td>${item.location}</td>`
            : ""
        }
        ${
          columnsVisibility.sellQuantity
            ? `<td>${item.sellQuantity}</td>`
            : ""
        }
        ${
          columnsVisibility.selling
            ? `<td>${item.selling}</td>`
            : ""
        }
        ${
          columnsVisibility.subtotal
            ? `<td>${item.subtotal}</td>`
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
          <title>Item Report - ${dateRange}</title>
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
          <h2>Item Report - ${dateRange}</h2>
          <table>
            <thead>
              <tr>
                ${columnsVisibility.product ? "<th>Product</th>" : ""}
                ${columnsVisibility.sku ? "<th>SKU</th>" : ""}
                ${columnsVisibility.description ? "<th>Description</th>" : ""}
                ${
                  columnsVisibility.purchaseDate ? "<th>Purchase Date</th>" : ""
                }
                ${columnsVisibility.purchase ? "<th>Purchase</th>" : ""}
                ${columnsVisibility.lotNumber ? "<th>Lot Number</th>" : ""}
                ${columnsVisibility.supplier ? "<th>Supplier</th>" : ""}
                ${
                  columnsVisibility.purchasePrice
                    ? "<th>Purchase Price</th>"
                    : ""
                }
                ${columnsVisibility.sellDate ? "<th>Sell Date</th>" : ""}
                ${columnsVisibility.sale ? "<th>Sale</th>" : ""}
                ${columnsVisibility.customer ? "<th>Customer</th>" : ""}
                ${columnsVisibility.location ? "<th>Location</th>" : ""}
                ${
                  columnsVisibility.sellQuantity ? "<th>Sell Quantity</th>" : ""
                }
                ${columnsVisibility.selling ? "<th>Selling</th>" : ""}
                ${columnsVisibility.subtotal ? "<th>Subtotal</th>" : ""}
              </tr>
            </thead>
            <tbody>${rows}</tbody>
            <tfoot>
              <tr class="footer-total">
                <td colSpan="7"><strong>Total:</strong></td>
                <td>${dashboardData.totalPurchaseValue.toFixed(2)}</td>
                <td colSpan="4"></td>
                <td>
                  <small>${dashboardData.totalQuantitySold.toFixed(2)} Pc(s)</small>
                </td>
                <td>${dashboardData.totalSalesValue.toFixed(2)}</td>
                <td>${dashboardData.totalSalesValue.toFixed(2)}</td>
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

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6">
                <h1 className="all-heading">Items Report</h1>
              </div>
              <div className="col-sm-6">
                <ol className="breadcrumb float-sm-right">
                  <li className="breadcrumb-item">
                    <a href="/">Home</a>
                  </li>
                  <li className="breadcrumb-item active">Item Report</li>
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
                        <p className="text-muted mb-0 small">Select date range for item analysis</p>
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
                              Showing items from {startDate || "start"} to {endDate || "end"}
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
                        <FontAwesomeIcon icon={faBox} size="lg" />
                      </div>
                      <div>
                        <h4 className="mb-0">Item Performance Dashboard</h4>
                        <p className="text-muted mb-0">
                          Showing {dashboardData.totalItems} items for selected period
                          {dateRange !== "all" && ` (${dateRange})`}
                        </p>
                      </div>
                    </div>

                    <div className="row">
                      <StatCard
                        icon={faMoneyBillWave}
                        title="Total Sales Value"
                        value={formatCurrency(dashboardData.totalSalesValue)}
                        subValue={`${dashboardData.totalItems} items`}
                        color="#3498db"
                        trend={12.5}
                        isLoading={isLoading}
                      />
                      
                      <StatCard
                        icon={faShoppingCart}
                        title="Total Quantity Sold"
                        value={formatNumber(dashboardData.totalQuantitySold)}
                        subValue={`${dashboardData.uniqueCustomers} customers`}
                        color="#2ecc71"
                        trend={8.3}
                        isLoading={isLoading}
                      />
                      
                      <StatCard
                        icon={faPercent}
                        title="Profit Margin"
                        value={`${dashboardData.profitMargin.toFixed(1)}%`}
                        subValue={`${formatCurrency(dashboardData.totalProfit)} profit`}
                        color="#9b59b6"
                        isLoading={isLoading}
                      />
                      
                      <StatCard
                        icon={faExchangeAlt}
                        title="Turnover Rate"
                        value={`${dashboardData.turnoverRate.toFixed(1)}%`}
                        subValue={`${dashboardData.uniqueSuppliers} suppliers`}
                        color="#f39c12"
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
                                <FontAwesomeIcon icon={faTag} />
                              </div>
                              <div>
                                <h6 className="mb-1" style={{ opacity: 0.9 }}>Top Selling Item</h6>
                                <h4 className="mb-0 text-truncate" style={{ fontSize: '1.1rem' }}>
                                  {isLoading ? (
                                    <div className="placeholder-wave">
                                      <span className="placeholder col-8"></span>
                                    </div>
                                  ) : (
                                    dashboardData.topSellingProduct || "N/A"
                                  )}
                                </h4>
                                <small>Highest sales volume</small>
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
                                <FontAwesomeIcon icon={faMoneyBillWave} />
                              </div>
                              <div>
                                <h6 className="mb-1" style={{ opacity: 0.9 }}>Most Profitable</h6>
                                <h4 className="mb-0 text-truncate" style={{ fontSize: '1.1rem' }}>
                                  {isLoading ? (
                                    <div className="placeholder-wave">
                                      <span className="placeholder col-8"></span>
                                    </div>
                                  ) : (
                                    dashboardData.mostProfitableProduct || "N/A"
                                  )}
                                </h4>
                                <small>Highest profit margin</small>
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
                                <h6 className="text-muted mb-2">Price Analysis</h6>
                                {isLoading ? (
                                  <div className="placeholder-wave">
                                    <span className="placeholder col-4"></span>
                                  </div>
                                ) : (
                                  <>
                                    <div className="d-flex align-items-center mb-2">
                                      <div>
                                        <small className="text-muted">Avg Purchase</small>
                                        <h6 className="mb-0">{formatCurrency(dashboardData.avgPurchasePrice)}</h6>
                                      </div>
                                      <div className="ms-3">
                                        <small className="text-muted">Avg Selling</small>
                                        <h6 className="mb-0">{formatCurrency(dashboardData.avgSellingPrice)}</h6>
                                      </div>
                                    </div>
                                    <div className="d-flex align-items-center">
                                      <span className={`badge ${dashboardData.profitMargin > 20 ? 'bg-success' : dashboardData.profitMargin > 10 ? 'bg-warning' : 'bg-danger'} me-2`}>
                                        <FontAwesomeIcon icon={faChartLine} className="me-1" />
                                        Margin: {dashboardData.profitMargin.toFixed(1)}%
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
                                  <FontAwesomeIcon icon={faCalculator} size="lg" />
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
                            <FontAwesomeIcon icon={faTruck} />
                          </div>
                          <div>
                            <h6 className="mb-0" style={{ fontSize: '0.8rem' }}>Active Suppliers</h6>
                            <p className="mb-0 fw-bold">
                              {formatNumber(dashboardData.uniqueSuppliers)}
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
                            <FontAwesomeIcon icon={faWarehouse} />
                          </div>
                          <div>
                            <h6 className="mb-0" style={{ fontSize: '0.8rem' }}>Avg Purchase Price</h6>
                            <p className="mb-0 fw-bold">
                              {formatCurrency(dashboardData.avgPurchasePrice)}
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
                            <h6 className="mb-0" style={{ fontSize: '0.8rem' }}>Items Per Sale</h6>
                            <p className="mb-0 fw-bold">
                              {(dashboardData.totalQuantitySold / dashboardData.totalItems).toFixed(1)}
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
                    
                    <div className="alert alert-info mb-3">
                      <i className="fas fa-info-circle me-2"></i>
                      Showing <strong>{filteredItems.length}</strong> items for period: <strong>{dateRange === "all" ? "All Time" : dateRange}</strong>
                      {dashboardData.totalQuantitySold > 0 && (
                        <span className="ms-2">
                          | <strong>{dashboardData.totalQuantitySold}</strong> units sold | 
                          <strong className="text-success ms-2">{formatCurrency(dashboardData.totalProfit)}</strong> total profit
                        </span>
                      )}
                    </div>
                    
                    <div id="table-container" style={{ overflowX: "auto" }}>
                      <table
                        id="example1"
                        className="table table-bordered table-hover"
                      >
                        <thead>
                          <tr>
                            {columnsVisibility.product && <th>Product</th>}
                            {columnsVisibility.sku && <th>SKU</th>}
                            {columnsVisibility.description && <th>Description</th>}
                            {columnsVisibility.purchaseDate && (
                              <th>Purchase Date</th>
                            )}
                            {columnsVisibility.purchase && <th>Purchase</th>}
                            {columnsVisibility.lotNumber && <th>Lot Number</th>}
                            {columnsVisibility.supplier && <th>Supplier</th>}
                            {columnsVisibility.purchasePrice && (
                              <th>Purchase Price</th>
                            )}
                            {columnsVisibility.sellDate && <th>Sell Date</th>}
                            {columnsVisibility.sale && <th>Sale</th>}
                            {columnsVisibility.customer && <th>Customer</th>}
                            {columnsVisibility.location && <th>Location</th>}
                            {columnsVisibility.sellQuantity && (
                              <th>Sell Quantity</th>
                            )}
                            {columnsVisibility.selling && <th>Selling</th>}
                            {columnsVisibility.subtotal && <th>Subtotal</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredItems.slice(startIndex, endIndex).map((item) => {
                            const purchasePrice = parseFloat(item.purchasePrice) || 0;
                            const subtotal = parseFloat(item.subtotal) || 0;
                            const profit = subtotal - purchasePrice;
                            const profitMargin = subtotal > 0 ? (profit / subtotal * 100) : 0;
                            
                            return (
                              <tr key={item.id}>
                                {columnsVisibility.product && <td>{item.product}</td>}
                                {columnsVisibility.sku && <td>{item.sku}</td>}
                                {columnsVisibility.description && (
                                  <td>{item.description}</td>
                                )}
                                {columnsVisibility.purchaseDate && (
                                  <td>{item.purchaseDate}</td>
                                )}
                                {columnsVisibility.purchase && (
                                  <td>{item.purchase}</td>
                                )}
                                {columnsVisibility.lotNumber && (
                                  <td>{item.lotNumber}</td>
                                )}
                                {columnsVisibility.supplier && (
                                  <td>{item.supplier}</td>
                                )}
                                {columnsVisibility.purchasePrice && (
                                  <td>{formatCurrency(purchasePrice)}</td>
                                )}
                                {columnsVisibility.sellDate && (
                                  <td>{item.sellDate}</td>
                                )}
                                {columnsVisibility.sale && <td>{item.sale}</td>}
                                {columnsVisibility.customer && (
                                  <td>{item.customer}</td>
                                )}
                                {columnsVisibility.location && (
                                  <td>{item.location}</td>
                                )}
                                {columnsVisibility.sellQuantity && (
                                  <td>{item.sellQuantity}</td>
                                )}
                                {columnsVisibility.selling && (
                                  <td>{formatCurrency(item.selling)}</td>
                                )}
                                {columnsVisibility.subtotal && (
                                  <td>
                                    <div className="d-flex flex-column">
                                      <span>{formatCurrency(subtotal)}</span>
                                      <small className={`${profit >= 0 ? 'text-success' : 'text-danger'}`}>
                                        Profit: {formatCurrency(profit)} ({profitMargin.toFixed(1)}%)
                                      </small>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray font-17 text-center footer-total">
                            <td colSpan="7" rowSpan="1">
                              <strong>Total:</strong>
                            </td>
                            <td
                              id="footer_total_pp"
                              className="display_currency"
                              data-currency_symbol="true"
                              rowSpan="1"
                              colSpan="1"
                            >
                              {formatCurrency(dashboardData.totalPurchaseValue)}
                            </td>
                            <td colSpan="4" rowSpan="1"></td>
                            <td id="footer_total_qty" rowSpan="1" colSpan="1">
                              <p className="text-left">
                                <small>
                                  <span
                                    className="display_currency"
                                    data-is_quantity="true"
                                  >
                                    {dashboardData.totalQuantitySold.toFixed(2)}
                                  </span>{" "}
                                  Pc(s)
                                  <br />
                                </small>
                              </p>
                            </td>
                            <td
                              id="footer_total_sp"
                              className="display_currency"
                              data-currency_symbol="true"
                              rowSpan="1"
                              colSpan="1"
                            >
                              {formatCurrency(dashboardData.totalSalesValue)}
                            </td>
                            <td
                              id="footer_total_subtotal"
                              className="display_currency"
                              data-currency_symbol="true"
                              rowSpan="1"
                              colSpan="1"
                            >
                              {formatCurrency(dashboardData.totalSalesValue)}
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

export default ItemReport;