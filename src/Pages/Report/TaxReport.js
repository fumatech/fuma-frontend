import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faList,
  faShoppingCart,
  faTag,
  faMoneyBillWave,
  faReceipt,
  faPercent,
  faChartLine,
  faFileInvoiceDollar,
  faBalanceScale
} from "@fortawesome/free-solid-svg-icons";
import InputTaxPurchase from "./InputTaxPurchase";
import OutputTaxSales from "./OutputTaxSales";
import ExpenseTax from "./ExpenseTax";
import { Link } from "react-router-dom";

const tabsData = [
  {
    id: "InputTaxPurchase",
    label: "Input Tax Purchase",
    icon: faList,
    component: <InputTaxPurchase />,
    color: "#3498db"
  },
  {
    id: "OutputTaxSales",
    label: "Output Tax Sales",
    icon: faShoppingCart,
    component: <OutputTaxSales />,
    color: "#2ecc71"
  },
  {
    id: "ExpenseTax",
    label: "Expense Tax",
    icon: faTag,
    component: <ExpenseTax />,
    color: "#e74c3c"
  },
];

const TaxReport = () => {
  const [activeTab, setActiveTab] = useState("InputTaxPurchase");
  const [dashboardData, setDashboardData] = useState({
    totalAmount: 0,
    totalTax: 0,
    totalDiscount: 0,
    transactionCount: 0,
    averageTaxRate: 0,
    netAmount: 0,
    taxLiability: 0,
    inputTaxCredit: 0
  });
  const [dateRange, setDateRange] = useState("thisMonth");
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - replace with actual API calls
  const fetchDashboardData = async (tabId, range) => {
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let mockData = {
      totalAmount: 0,
      totalTax: 0,
      totalDiscount: 0,
      transactionCount: 0,
      averageTaxRate: 0,
      netAmount: 0,
      taxLiability: 0,
      inputTaxCredit: 0
    };;
    
    // Different mock data for each tab
    switch(tabId) {
      case "InputTaxPurchase":
        mockData = {
          totalAmount: 152845.67,
          totalTax: 18341.48,
          totalDiscount: 7642.28,
          transactionCount: 128,
          averageTaxRate: 12.0,
          netAmount: 134504.19,
          taxLiability: 0,
          inputTaxCredit: 18341.48
        };
        break;
      case "OutputTaxSales":
        mockData = {
          totalAmount: 234567.89,
          totalTax: 28148.15,
          totalDiscount: 11728.39,
          transactionCount: 187,
          averageTaxRate: 12.0,
          netAmount: 206419.74,
          taxLiability: 28148.15,
          inputTaxCredit: 0
        };
        break;
      case "ExpenseTax":
        mockData = {
          totalAmount: 45678.90,
          totalTax: 5481.47,
          totalDiscount: 2283.95,
          transactionCount: 42,
          averageTaxRate: 12.0,
          netAmount: 40197.43,
          taxLiability: 0,
          inputTaxCredit: 5481.47
        };
        break;
      default:
        break;
    }
    
    setDashboardData(mockData);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchDashboardData(activeTab, dateRange);
  }, [activeTab, dateRange]);

  const handleDateRangeChange = (range) => {
    setDateRange(range);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getActiveTabColor = () => {
    const activeTabObj = tabsData.find(tab => tab.id === activeTab);
    return activeTabObj ? activeTabObj.color : "#3498db";
  };

  const StatCard = ({ icon, title, value, subValue, color, isLoading }) => (
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
    <>
      <div className="wrapper">
        <div className="content-wrapper">
          <section className="content-header">
            <div className="container-fluid">
              <div className="row mb-2">
                <div className="col-sm-6">
                  <h1 className="all-heading">Tax Report</h1>
                </div>
                <div className="col-sm-6">
                  <ol className="breadcrumb float-sm-right">
                    <li className="breadcrumb-item">
                      <Link to="/">Home</Link>
                    </li>
                    <li className="breadcrumb-item active">Tax Report</li>
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
                          <p className="text-muted mb-0 small">Select date range for analysis</p>
                        </div>
                        <div className="d-flex flex-wrap gap-2 mt-2 mt-md-0">
                          {dateRangeOptions.map((option) => (
                            <button
                              key={option.id}
                              className={`btn btn-sm ${dateRange === option.id ? 'btn-primary' : 'btn-outline-primary'}`}
                              onClick={() => handleDateRangeChange(option.id)}
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

              {/* Summary Cards */}
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
                          <FontAwesomeIcon icon={faChartLine} size="lg" />
                        </div>
                        <div>
                          <h4 className="mb-0">
                            {tabsData.find(tab => tab.id === activeTab)?.label} Summary
                          </h4>
                          <p className="text-muted mb-0">Key metrics for selected period</p>
                        </div>
                      </div>

                      <div className="row">
                        <StatCard
                          icon={faMoneyBillWave}
                          title="Total Amount"
                          value={formatCurrency(dashboardData.totalAmount)}
                          subValue={`${dashboardData.transactionCount} transactions`}
                          color="#3498db"
                          isLoading={isLoading}
                        />
                        
                        <StatCard
                          icon={faReceipt}
                          title="Total Tax"
                          value={formatCurrency(dashboardData.totalTax)}
                          subValue={`${dashboardData.averageTaxRate}% avg. rate`}
                          color="#2ecc71"
                          isLoading={isLoading}
                        />
                        
                        <StatCard
                          icon={faPercent}
                          title="Total Discount"
                          value={formatCurrency(dashboardData.totalDiscount)}
                          subValue={`${(dashboardData.totalDiscount / dashboardData.totalAmount * 100).toFixed(1)}% of total`}
                          color="#f39c12"
                          isLoading={isLoading}
                        />
                        
                        <StatCard
                          icon={faFileInvoiceDollar}
                          title="Net Amount"
                          value={formatCurrency(dashboardData.netAmount)}
                          subValue="Amount excluding tax"
                          color="#9b59b6"
                          isLoading={isLoading}
                        />
                      </div>
                      
                      {/* Additional Metrics Row */}
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
                                  <FontAwesomeIcon icon={faBalanceScale} />
                                </div>
                                <div>
                                  <h6 className="mb-1" style={{ opacity: 0.9 }}>Tax Liability</h6>
                                  <h4 className="mb-0">
                                    {isLoading ? (
                                      <div className="placeholder-wave">
                                        <span className="placeholder col-6"></span>
                                      </div>
                                    ) : (
                                      formatCurrency(dashboardData.taxLiability)
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
                                  <FontAwesomeIcon icon={faReceipt} />
                                </div>
                                <div>
                                  <h6 className="mb-1" style={{ opacity: 0.9 }}>Input Tax Credit</h6>
                                  <h4 className="mb-0">
                                    {isLoading ? (
                                      <div className="placeholder-wave">
                                        <span className="placeholder col-6"></span>
                                      </div>
                                    ) : (
                                      formatCurrency(dashboardData.inputTaxCredit)
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
                                  <h6 className="text-muted mb-2">Transaction Efficiency</h6>
                                  {isLoading ? (
                                    <div className="placeholder-wave">
                                      <span className="placeholder col-4"></span>
                                    </div>
                                  ) : (
                                    <>
                                      <h4 className="mb-1">
                                        {dashboardData.transactionCount}
                                      </h4>
                                      <div className="d-flex align-items-center">
                                        <span className="badge bg-success me-2">
                                          <FontAwesomeIcon icon={faChartLine} className="me-1" />
                                          Active
                                        </span>
                                        <small className="text-muted">
                                          Avg: {formatCurrency(dashboardData.netAmount / dashboardData.transactionCount)} per transaction
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
                                    <FontAwesomeIcon icon={faShoppingCart} size="lg" />
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
                              <FontAwesomeIcon icon={faReceipt} />
                            </div>
                            <div>
                              <h6 className="mb-0" style={{ fontSize: '0.8rem' }}>Tax Rate</h6>
                              <p className="mb-0 fw-bold">
                                {isLoading ? '...' : `${dashboardData.averageTaxRate}%`}
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
                              <FontAwesomeIcon icon={faPercent} />
                            </div>
                            <div>
                              <h6 className="mb-0" style={{ fontSize: '0.8rem' }}>Discount Rate</h6>
                              <p className="mb-0 fw-bold">
                                {isLoading ? '...' : `${(dashboardData.totalDiscount / dashboardData.totalAmount * 100).toFixed(1)}%`}
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
                              <FontAwesomeIcon icon={faMoneyBillWave} />
                            </div>
                            <div>
                              <h6 className="mb-0" style={{ fontSize: '0.8rem' }}>Tax/Total Ratio</h6>
                              <p className="mb-0 fw-bold">
                                {isLoading ? '...' : `${(dashboardData.totalTax / dashboardData.totalAmount * 100).toFixed(1)}%`}
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
                              <h6 className="mb-0" style={{ fontSize: '0.8rem' }}>Growth Potential</h6>
                              <p className="mb-0 fw-bold">
                                {isLoading ? '...' : '15.2%'}
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
                              aria-controls={`tax-report-${id}`}
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
                      <div className="tab-content" id="tax-report-tabContent">
                        {tabsData.map(({ id, component }) => (
                          <div
                            className={`tab-pane fade ${activeTab === id ? "active show" : ""}`}
                            id={`tax-report-${id}`}
                            aria-labelledby={`tax-report-${id}-tab`}
                            key={id}
                          >
                            {activeTab === id && component}
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
    </>
  );
};

export default TaxReport;