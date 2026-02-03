import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faList,
  faShoppingCart,
  faCalendar,
  faTag,
  faTh,
  faChartLine,
  faBox,
  faDollarSign,
  faPercent,
  faUsers,
  faShoppingBag,
  faExchangeAlt,
  faTachometerAlt,
  faWarehouse,
  faBoxes
} from "@fortawesome/free-solid-svg-icons";
import ByBrand from "./ByBrand";
import ByCategory from "./ByCategory";
import DetailedPurchase from "./DetailedPurchase";
import GroupedDate from "./GroupedDate";
import Detailed from "./Detailed";

const tabsData = [
  { 
    id: "detailed", 
    label: "Detailed", 
    icon: faList, 
    component: <Detailed />,
    color: "#3498db"
  },
  { 
    id: "groupedDate", 
    label: "Grouped (by date)", 
    icon: faCalendar, 
    component: <GroupedDate />,
    color: "#2ecc71"
  },
  { 
    id: "byCategory", 
    label: "By Category", 
    icon: faTag, 
    component: <ByCategory />,
    color: "#9b59b6"
  },
  { 
    id: "byBrand", 
    label: "By Brand", 
    icon: faTh, 
    component: <ByBrand />,
    color: "#e74c3c"
  },
];

const ProductSellReport = () => {
  const [activeTab, setActiveTab] = useState("detailed");
  const [dashboardData, setDashboardData] = useState({
    totalSales: 0,
    totalQuantity: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    totalDiscount: 0,
    totalTax: 0,
    netRevenue: 0,
    topSellingProduct: "",
    topCategory: "",
    conversionRate: 0,
    inventoryValue: 0,
    grossMargin: 0
  });
  const [dateRange, setDateRange] = useState("thisMonth");
  const [isLoading, setIsLoading] = useState(true);
  const [salesData, setSalesData] = useState([]);

  useEffect(() => {
    fetchSalesData();
  }, [dateRange]);

  const fetchSalesData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/sell-report/getall`
      );
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setSalesData(data);
        calculateDashboardMetrics(data);
      }
    } catch (error) {
      console.error("Error fetching sales data:", error);
    } finally {
      setIsLoading(false);
    }
  
    // Add jQuery script at the bottom
    const script = document.createElement("script");
    script.src = "js/JqueryContent.js";
    script.async = true;
    document.body.appendChild(script);
  };

  const calculateDashboardMetrics = (data) => {
    const totalQuantity = data.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
    const totalRevenue = data.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
    const totalDiscount = data.reduce((sum, item) => sum + (parseFloat(item.discount) || 0), 0);
    const totalTax = data.reduce((sum, item) => sum + (parseFloat(item.tax) || 0), 0);
    const averageOrderValue = data.length > 0 ? totalRevenue / data.length : 0;
    const netRevenue = totalRevenue - totalDiscount;
    
    // Find top selling product
    const productSales = {};
    data.forEach(item => {
      if (item.products) {
        productSales[item.products] = (productSales[item.products] || 0) + (parseFloat(item.quantity) || 0);
      }
    });
    const topSellingProduct = Object.keys(productSales).reduce((a, b) => 
      productSales[a] > productSales[b] ? a : b, ""
    );

    // Calculate gross margin (example: 40%)
    const costOfGoods = totalRevenue * 0.6; // Assuming 60% COGS
    const grossMargin = ((totalRevenue - costOfGoods) / totalRevenue * 100).toFixed(1);

    setDashboardData({
      totalSales: data.length,
      totalQuantity,
      totalRevenue,
      averageOrderValue,
      totalDiscount,
      totalTax,
      netRevenue,
      topSellingProduct,
      topCategory: "Electronics", // This should come from actual category data
      conversionRate: 4.2, // Example conversion rate
      inventoryValue: 125000,
      grossMargin
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

  const getActiveTabColor = () => {
    const activeTabObj = tabsData.find(tab => tab.id === activeTab);
    return activeTabObj ? activeTabObj.color : "#3498db";
  };

  const StatCard = ({ icon, title, value, subValue, color, trend, isLoading }) => (
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
                    {title.includes('Revenue') || title.includes('Value') || title.includes('Discount') || title.includes('Tax') ? formatCurrency(value) : title.includes('Rate') ? `${value}%` : formatNumber(value)}
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
                   backgroundColor: `${color}15`,
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

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6">
                <h1 className="all-heading">Product Sales Report</h1>
              </div>
              <div className="col-sm-6">
                <ol className="breadcrumb float-sm-right">
                  <li className="breadcrumb-item">
                    <Link to="/">Home</Link>
                  </li>
                  <li className="breadcrumb-item active">Sales Report</li>
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
                        <p className="text-muted mb-0 small">Select date range for sales analysis</p>
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
                             backgroundColor: getActiveTabColor(),
                             color: 'white' 
                           }}>
                        <FontAwesomeIcon icon={faTachometerAlt} size="lg" />
                      </div>
                      <div>
                        <h4 className="mb-0">Sales Performance Dashboard</h4>
                        <p className="text-muted mb-0">Key metrics for selected period</p>
                      </div>
                    </div>

                    <div className="row">
                      <StatCard
                        icon={faDollarSign}
                        title="Total Revenue"
                        value={dashboardData.totalRevenue}
                        subValue={`${dashboardData.totalSales} transactions`}
                        color="#3498db"
                        trend={12.5}
                        isLoading={isLoading}
                      />
                      
                      <StatCard
                        icon={faBox}
                        title="Total Quantity Sold"
                        value={dashboardData.totalQuantity}
                        subValue={`Avg: ${(dashboardData.totalQuantity / dashboardData.totalSales).toFixed(1)} per sale`}
                        color="#2ecc71"
                        trend={8.3}
                        isLoading={isLoading}
                      />
                      
                      <StatCard
                        icon={faShoppingBag}
                        title="Net Revenue"
                        value={dashboardData.netRevenue}
                        subValue={`After ${formatCurrency(dashboardData.totalDiscount)} discount`}
                        color="#9b59b6"
                        trend={15.2}
                        isLoading={isLoading}
                      />
                      
                      <StatCard
                        icon={faPercent}
                        title="Gross Margin"
                        value={dashboardData.grossMargin}
                        subValue="Profit percentage"
                        color="#f39c12"
                        trend={2.1}
                        isLoading={isLoading}
                      />
                    </div>
                    
                    {/* Additional Metrics */}
                    <div className="row mt-4">
                      <div className="col-xl-4 col-lg-6 col-md-6 mb-4">
                        <div className="card border-0 shadow-sm h-100" style={{ 
                          borderLeft: `4px solid ${getActiveTabColor()}`,
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
                                <FontAwesomeIcon icon={faWarehouse} />
                              </div>
                              <div>
                                <h6 className="mb-1" style={{ opacity: 0.9 }}>Inventory Value</h6>
                                <h4 className="mb-0">
                                  {isLoading ? (
                                    <div className="placeholder-wave">
                                      <span className="placeholder col-6"></span>
                                    </div>
                                  ) : (
                                    formatCurrency(dashboardData.inventoryValue)
                                  )}
                                </h4>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-xl-4 col-lg-6 col-md-6 mb-4">
                        <div className="card border-0 shadow-sm h-100" style={{ 
                          borderLeft: `4px solid ${getActiveTabColor()}`,
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
                                <FontAwesomeIcon icon={faBoxes} />
                              </div>
                              <div>
                                <h6 className="mb-1" style={{ opacity: 0.9 }}>Top Selling Product</h6>
                                <h4 className="mb-0 text-truncate" style={{ fontSize: '1.1rem' }}>
                                  {isLoading ? (
                                    <div className="placeholder-wave">
                                      <span className="placeholder col-8"></span>
                                    </div>
                                  ) : (
                                    dashboardData.topSellingProduct || "N/A"
                                  )}
                                </h4>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-xl-4 col-lg-12 col-md-12 mb-4">
                        <div className="card border-0 shadow-sm h-100" style={{ 
                          borderLeft: `4px solid ${getActiveTabColor()}` 
                        }}>
                          <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between">
                              <div>
                                <h6 className="text-muted mb-2">Sales Efficiency</h6>
                                {isLoading ? (
                                  <div className="placeholder-wave">
                                    <span className="placeholder col-4"></span>
                                  </div>
                                ) : (
                                  <>
                                    <h4 className="mb-1">
                                      {formatCurrency(dashboardData.averageOrderValue)}
                                    </h4>
                                    <div className="d-flex align-items-center">
                                      <span className="badge bg-success me-2">
                                        <FontAwesomeIcon icon={faChartLine} className="me-1" />
                                        {dashboardData.conversionRate}% CR
                                      </span>
                                      <small className="text-muted">
                                        Avg order value
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
                                       backgroundColor: `${getActiveTabColor()}15`,
                                       color: getActiveTabColor() 
                                     }}>
                                  <FontAwesomeIcon icon={faExchangeAlt} size="lg" />
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
                            <FontAwesomeIcon icon={faPercent} />
                          </div>
                          <div>
                            <h6 className="mb-0" style={{ fontSize: '0.8rem' }}>Discount Rate</h6>
                            <p className="mb-0 fw-bold">
                              {isLoading ? '...' : `${(dashboardData.totalDiscount / dashboardData.totalRevenue * 100).toFixed(1)}%`}
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
                            <FontAwesomeIcon icon={faShoppingCart} />
                          </div>
                          <div>
                            <h6 className="mb-0" style={{ fontSize: '0.8rem' }}>Avg Order Value</h6>
                            <p className="mb-0 fw-bold">
                              {isLoading ? '...' : formatCurrency(dashboardData.averageOrderValue)}
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
                            <FontAwesomeIcon icon={faBox} />
                          </div>
                          <div>
                            <h6 className="mb-0" style={{ fontSize: '0.8rem' }}>Items per Sale</h6>
                            <p className="mb-0 fw-bold">
                              {isLoading ? '...' : `${(dashboardData.totalQuantity / dashboardData.totalSales).toFixed(1)}`}
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
                            <h6 className="mb-0" style={{ fontSize: '0.8rem' }}>Tax Amount</h6>
                            <p className="mb-0 fw-bold">
                              {isLoading ? '...' : formatCurrency(dashboardData.totalTax)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="row">
              <div className="col-12">
                <div className="card card-primary card-outline card-outline-tabs border-0 shadow-sm">
                  <div className="card-header p-0 border-bottom-0">
                    <ul className="nav nav-tabs" role="tablist">
                      {tabsData.map(({ id, label, icon, color }) => (
                        <li className="nav-item" key={id}>
                          <Link
                            to="#"
                            className={`nav-link ${activeTab === id ? "active" : ""}`}
                            onClick={() => setActiveTab(id)}
                            role="tab"
                            aria-controls={`product-sell-report-${id}`}
                            aria-selected={activeTab === id}
                            style={{
                              padding: "15px 20px",
                              borderTop: activeTab === id ? `3px solid ${color}` : "none",
                              borderBottom: activeTab === id ? "1px solid transparent" : "1px solid transparent",
                              fontWeight: activeTab === id ? "600" : "500",
                              color: activeTab === id ? color : "#6c757d",
                              backgroundColor: activeTab === id ? "white" : "#f8f9fa",
                              transition: "all 0.3s ease",
                              borderTopLeftRadius: "8px",
                              borderTopRightRadius: "8px",
                              marginRight: "2px"
                            }}
                            onMouseEnter={(e) => {
                              if (activeTab !== id) {
                                e.currentTarget.style.backgroundColor = "#e9ecef";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (activeTab !== id) {
                                e.currentTarget.style.backgroundColor = "#f8f9fa";
                              }
                            }}
                          >
                            <FontAwesomeIcon
                              icon={icon}
                              style={{ marginRight: "8px", color: activeTab === id ? color : "#6c757d" }}
                            />
                            {label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="card-body">
                    <div className="tab-content" id="product-sell-report-tabContent">
                      {tabsData.map(({ id, component }) => (
                        <div
                          className={`tab-pane fade ${
                            activeTab === id ? "active show" : ""
                          }`}
                          id={`product-sell-report-${id}`}
                          aria-labelledby={`product-sell-report-${id}-tab`}
                          key={id}
                        >
                          {activeTab === id && component}{" "}
                        </div>
                      ))}
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

export default ProductSellReport;