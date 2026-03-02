import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

import Campaigns from "./Campaigns";
import ContactLogin from "./ContactLogin";
import Leads from "./Leads";
import FollowUps from "./FollowUps";

const ComingSoonTab = ({ title }) => (
  <div className="card cardHover p-4 m-3">
    <h4 className="mb-2">{title}</h4>
    <p className="mb-0 text-muted">
      This section is not configured yet. Please add the module implementation.
    </p>
  </div>
);

const tabsData = [
  
  { id: "Leads", label: "Leads" , component: <Leads  />  },
  { id: "Follow-Ups", label: "Follow Ups" , component: <FollowUps  />   },
  { id: "Campaigns", label: "Campaigns" , component: <Campaigns  />  },
  { id: "Contacts-Login", label: "Contacts Login" , component: <ContactLogin  />  },
  {
    id: "Sources",
    label: "Sources",
    component: <ComingSoonTab title="Sources" />,
  },
  {
    id: "Life-Stage",
    label: "Life Stage",
    component: <ComingSoonTab title="Life Stage" />,
  },
];

const CRMDashboard = () => {
  const [activeTab, setActiveTab] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    customerCount: 0,
    leadsCount: 0,
    sourcesCount: 0,
    lifeStagesCount: 0,
    facebookCount: 0,
    emailCount: 0,
    twitterCount: 0,
    offlineCount: 0,
    newCount: 0,
    prospectCount: 0,
    contactedCount: 0,
    opportunityCount: 0,
    todayBirthdays: [],
    upcomingBirthdays: [],
  });
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  const activeTabData = tabsData.find(tab => tab.id === activeTab);

  const normalizeText = (value) =>
    String(value || "")
      .trim()
      .toLowerCase();

  const getCustomerName = (customer) => {
    const firstName = customer.firstName || customer.firstname || "";
    const lastName = customer.lastName || customer.lastname || "";
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || customer.name || customer.customerName || "Customer";
  };

  const getLeadName = (lead) => {
    const firstName = lead.firstName || lead.firstname || "";
    const lastName = lead.lastName || lead.lastname || "";
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || lead.name || lead.leadName || "Lead";
  };

  const getBirthdayRawValue = (customer) =>
    customer.dateOfBirth ||
    customer.dob ||
    customer.birthDate ||
    customer.birthday ||
    customer.date_of_birth ||
    "";

  const parseBirthdayDate = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const getDaysUntilBirthday = (birthdayDate) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const nextBirthday = new Date(
      today.getFullYear(),
      birthdayDate.getMonth(),
      birthdayDate.getDate()
    );
    if (nextBirthday < today) {
      nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
    }
    return Math.floor((nextBirthday - today) / (1000 * 60 * 60 * 24));
  };

  const formatBirthday = (birthdayDate) =>
    birthdayDate.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
    });

  const fetchDashboardData = async () => {
    try {
      setIsLoadingDashboard(true);
      const [customersResponse, leadsResponse] = await Promise.all([
        axios.get(`${process.env.REACT_APP_BASE_URL}/customer/getall`),
        axios.get(`${process.env.REACT_APP_BASE_URL}/lead/getall`),
      ]);

      const customers = Array.isArray(customersResponse.data)
        ? customersResponse.data
        : [];
      const leads = Array.isArray(leadsResponse.data) ? leadsResponse.data : [];

      const sourceCounts = leads.reduce((acc, lead) => {
        const key = normalizeText(lead.source);
        if (key) acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      const lifeStageCounts = leads.reduce((acc, lead) => {
        const key = normalizeText(lead.lifeStage);
        if (key) acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      const getGroupedCount = (map, keys) =>
        keys.reduce((sum, key) => sum + (map[normalizeText(key)] || 0), 0);

      const facebookCount = getGroupedCount(sourceCounts, ["facebook"]);
      const emailCount = getGroupedCount(sourceCounts, ["email"]);
      const twitterCount = getGroupedCount(sourceCounts, ["twitter"]);
      const offlineCount = getGroupedCount(sourceCounts, [
        "offline",
        "offline campaign",
        "walk-in",
        "walk in",
        "walkin",
      ]);

      const newCount = getGroupedCount(lifeStageCounts, ["new"]);
      const prospectCount = getGroupedCount(lifeStageCounts, ["prospect"]);
      const contactedCount = getGroupedCount(lifeStageCounts, ["contacted"]);
      const opportunityCount = getGroupedCount(lifeStageCounts, [
        "opportunity",
        "oppotu",
      ]);

      const birthdayPeople = customers
        .map((customer) => {
          const birthdayDate = parseBirthdayDate(getBirthdayRawValue(customer));
          if (!birthdayDate) return null;
          return {
            name: `${getCustomerName(customer)} (Customer)`,
            daysUntil: getDaysUntilBirthday(birthdayDate),
            date: formatBirthday(birthdayDate),
          };
        })
        .filter(Boolean);

      const leadBirthdayPeople = leads
        .map((customer) => {
          const birthdayDate = parseBirthdayDate(getBirthdayRawValue(customer));
          if (!birthdayDate) return null;
          return {
            name: `${getLeadName(customer)} (Lead)`,
            daysUntil: getDaysUntilBirthday(birthdayDate),
            date: formatBirthday(birthdayDate),
          };
        })
        .filter(Boolean);

      const allBirthdayPeople = [...birthdayPeople, ...leadBirthdayPeople];

      const todayBirthdays = allBirthdayPeople.filter(
        (person) => person.daysUntil === 0
      );
      const upcomingBirthdays = allBirthdayPeople
        .filter((person) => person.daysUntil > 0 && person.daysUntil <= 30)
        .sort((a, b) => a.daysUntil - b.daysUntil)
        .slice(0, 10);

      setDashboardData({
        customerCount: customers.length,
        leadsCount: leads.length,
        sourcesCount: Object.keys(sourceCounts).length,
        lifeStagesCount: Object.keys(lifeStageCounts).length,
        facebookCount,
        emailCount,
        twitterCount,
        offlineCount,
        newCount,
        prospectCount,
        contactedCount,
        opportunityCount,
        todayBirthdays,
        upcomingBirthdays,
      });
    } catch (error) {
      console.error("Failed to load CRM dashboard data:", error);
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  useEffect(() => {
    if (!activeTab) {
      fetchDashboardData();
    }
  }, [activeTab]);

  return (
    <div className="wrapper" style={{ backgroundColor: '#f4f6f9' }}>
      <div className="content-wrapper">
        <div
          className="card"
          style={{
            borderRadius: "10px",
            border: "none",
            backgroundColor: "#f8f9fa",
            padding: "10px 15px",
            boxShadow: '0 0 1px rgba(0,0,0,.125), 0 1px 3px rgba(0,0,0,.2)',
            marginBottom: '20px'
          }}
        >
          <div className="p-2">
            <ul
              className="nav"
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px",
                whiteSpace: "nowrap",
                overflowX: "auto",
                margin: 0,
                listStyle: 'none'
              }}
            >
              <li
                style={{
                  fontWeight: "bold",
                  marginRight: "15px",
                  color: "#6c757d",
                  display: "flex",
                  alignItems: "center",
                  fontSize: '18px'
                }}
              >
                <FontAwesomeIcon
                  icon={faUsers}
                  style={{ marginRight: "10px", color: '#6c757d' }}
                />
                CRM
              </li>

              {tabsData.map(({ id, label }) => (
                <li
                  className="nav-item"
                  key={id}
                  style={{ marginRight: "15px" }}
                >
                  <button
                    className={`nav-link ${activeTab === id ? "active" : ""}`}
                    onClick={() => setActiveTab(activeTab === id ? null : id)}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "14px",
                      color: activeTab === id ? "#007bff" : "#6c757d",
                      fontWeight: activeTab === id ? "bold" : "normal",
                      cursor: "pointer",
                      outline: "none",
                      padding: '5px 10px',
                      borderRadius: '4px',
                      transition: 'all 0.3s'
                    }}
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Content Section - Only shown when a tab is active */}
        {activeTab && (
          <div className="card-body m-0 p-0">
            {activeTabData?.component}
          </div>
        )}

        {/* Dashboard Content - Only shown when no tab is active */}
        {!activeTab && (
          <section className="content" style={{ padding: '0 15px' }}>
   {isLoadingDashboard && (
    <div className="mb-2 text-muted">Refreshing dashboard...</div>
   )}
   <div className="row" style={{ margin: '0 -5px' }}>
  {/* Customer Card */}
  <div className="col-md-3 col-sm-6" style={{ padding: '5px' }}>
    <div className="card cardHover text-center" style={{
      height: "150px",
      borderRadius: '10px',
      border: '1px solid rgba(0,0,0,.125)',
      boxShadow: '0 0 1px rgba(0,0,0,.125), 0 1px 3px rgba(0,0,0,.2)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      backgroundColor: '#e6f2ff' // Light blue
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className="fa fa-users" style={{ 
          color: '#007bff',
          fontSize: '24px',
          marginRight: '10px'
        }}></i>
        <h3 className="mb-0 " style={{
          color: '#6c757d',
          fontSize: '18px',
          marginBottom: '15px',
          fontWeight: 'bold'
        }}>CUSTOMERS</h3>
      </div>
      <h1 className="mt-2" style={{
        color: '#007bff',
        fontSize: '48px',
        margin: 0,
        fontWeight: 'bold'
      }}>{dashboardData.customerCount}</h1>
    </div>
  </div>
  
  {/* Leads Card */}
  <div className="col-md-3 col-sm-6" style={{ padding: '5px' }}>
    <div className="card cardHover  text-center" style={{
      height: "150px",
      borderRadius: '10px',
      border: '1px solid rgba(0,0,0,.125)',
      boxShadow: '0 0 1px rgba(0,0,0,.125), 0 1px 3px rgba(0,0,0,.2)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      backgroundColor: '#e6f2ff' // Light blue
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className="fa fa-bullseye" style={{ 
          color: '#007bff',
          fontSize: '24px',
          marginRight: '10px'
        }}></i>
        <h3 className="mb-0 " style={{
          color: '#6c757d',
          fontSize: '18px',
          marginBottom: '15px',
          fontWeight: 'bold'
        }}>LEADS</h3>
      </div>
      <h1 className="mt-2" style={{
        color: '#007bff',
        fontSize: '48px',
        margin: 0,
        fontWeight: 'bold'
      }}>{dashboardData.leadsCount}</h1>
    </div>
  </div>
  
  {/* Sources Card */}
  <div className="col-md-3 col-sm-6" style={{ padding: '5px' }}>
    <div className="card cardHover text-center" style={{
      height: "150px",
      borderRadius: '10px',
      border: '1px solid rgba(0,0,0,.125)',
      boxShadow: '0 0 1px rgba(0,0,0,.125), 0 1px 3px rgba(0,0,0,.2)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      backgroundColor: '#fff3e6' // Light orange
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className="fa fa-database" style={{ 
          color: '#ff9933',
          fontSize: '24px',
          marginRight: '10px'
        }}></i>
        <h3 className="mb-0 " style={{
          color: '#6c757d',
          fontSize: '18px',
          marginBottom: '15px',
          fontWeight: 'bold'
        }}>SOURCES</h3>
      </div>
      <h1 className="mt-2" style={{
        color: '#ff9933',
        fontSize: '48px',
        margin: 0,
        fontWeight: 'bold'
      }}>{dashboardData.sourcesCount}</h1>
    </div>
  </div>
  
  {/* Life Stages Card */}
  <div className="col-md-3 col-sm-6" style={{ padding: '5px' }}>
    <div className="card cardHover text-center" style={{
      height: "150px",
      borderRadius: '10px',
      border: '1px solid rgba(0,0,0,.125)',
      boxShadow: '0 0 1px rgba(0,0,0,.125), 0 1px 3px rgba(0,0,0,.2)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      backgroundColor: '#fff3e6' // Light orange
    }}>
      <div className=" align-items-center" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className="fa fa-chart-line" style={{ 
          color: '#ff9933',
          fontSize: '24px',
          marginRight: '10px'
        }}></i>
        <h3 className="mb-0" style={{
          color: '#6c757d',
          fontSize: '18px',
          marginBottom: '15px',
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          padding: '0 10px'
        }}>LIFE STAGES</h3>
      </div>
      <h1 className="mt-2" style={{
        color: '#ff9933',
        fontSize: '48px',
        margin: 0,
        fontWeight: 'bold'
      }}>{dashboardData.lifeStagesCount}</h1>
    </div>
  </div>
</div>

            <hr style={{ borderTop: '1px solid rgba(0,0,0,.1)', margin: '20px 0' }} />

            <div className="row" style={{ margin: '0 -10px' }}>
              {/* Left Column - Sources */}
           <div className="col-md-6" style={{ padding: '0 10px' }}>
  <div className="" style={{

    marginBottom: '20px'
  }}>
    <div style={{ padding: '15px' }}>
      <div className="row align-items-center justify-content-evenly">
        {/* Sources Table - col-6 */}
        <div className="card cardHover  col-md-5 p-3 rounded-1">
          <h4 style={{
            color: '#495057',
            fontSize: '18px',
            margin: '0 0 15px 0',
            fontWeight: 'bold'
          }}>Sources</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{
                  textAlign: 'left',
                  padding: '8px 0',
                  borderBottom: '1px solid #f4f4f4',
                  color: '#495057'
                }}>Sources</th>
                <th style={{
                  textAlign: 'right',
                  padding: '8px 0',
                  borderBottom: '1px solid #f4f4f4',
                  color: '#495057'
                }}>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{
                  padding: '8px 0',
                  borderBottom: '1px solid #f4f4f4',
                  color: '#6c757d'
                }}>Facebook</td>
                <td style={{
                  padding: '8px 0',
                  borderBottom: '1px solid #f4f4f4',
                  color: '#007bff',
                  fontWeight: 'bold',
                  textAlign: 'right'
                }}>{dashboardData.newCount}</td>
              </tr>
              <tr>
                <td style={{
                  padding: '8px 0',
                  borderBottom: '1px solid #f4f4f4',
                  color: '#6c757d'
                }}>Email</td>
                <td style={{
                  padding: '8px 0',
                  borderBottom: '1px solid #f4f4f4',
                  color: '#007bff',
                  fontWeight: 'bold',
                  textAlign: 'right'
                }}>{dashboardData.prospectCount}</td>
              </tr>
              <tr>
                <td style={{
                  padding: '8px 0',
                  borderBottom: '1px solid #f4f4f4',
                  color: '#6c757d'
                }}>Twitter</td>
                <td style={{
                  padding: '8px 0',
                  borderBottom: '1px solid #f4f4f4',
                  color: '#007bff',
                  fontWeight: 'bold',
                  textAlign: 'right'
                }}>{dashboardData.twitterCount}</td>
              </tr>
              <tr>
                <td style={{
                  padding: '8px 0',
                  color: '#6c757d'
                }}>Offline campaign</td>
                <td style={{
                  padding: '8px 0',
                  color: '#007bff',
                  fontWeight: 'bold',
                  textAlign: 'right'
                }}>{dashboardData.offlineCount}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Life Stages - col-6 */}
        <div className="card cardHover col-md-5 p-3 rounded-1">
          <h4 style={{
            color: '#495057',
            fontSize: '18px',
            margin: '0 0 15px 0',
            fontWeight: 'bold'
          }}>Life Stages</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{
                  textAlign: 'left',
                  padding: '8px 0',
                  borderBottom: '1px solid #f4f4f4',
                  color: '#495057'
                }}>Life Stages</th>
                <th style={{
                  textAlign: 'right',
                  padding: '8px 0',
                  borderBottom: '1px solid #f4f4f4',
                  color: '#495057'
                }}>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{
                  padding: '8px 0',
                  borderBottom: '1px solid #f4f4f4',
                  color: '#6c757d'
                }}>new</td>
                <td style={{
                  padding: '8px 0',
                  borderBottom: '1px solid #f4f4f4',
                  color: '#007bff',
                  fontWeight: 'bold',
                  textAlign: 'right'
                }}>{dashboardData.facebookCount}</td>
              </tr>
              <tr>
                <td style={{
                  padding: '8px 0',
                  borderBottom: '1px solid #f4f4f4',
                  color: '#6c757d'
                }}>Prospect</td>
                <td style={{
                  padding: '8px 0',
                  borderBottom: '1px solid #f4f4f4',
                  color: '#007bff',
                  fontWeight: 'bold',
                  textAlign: 'right'
                }}>{dashboardData.emailCount}</td>
              </tr>
              <tr>
                <td style={{
                  padding: '8px 0',
                  borderBottom: '1px solid #f4f4f4',
                  color: '#6c757d'
                }}>Contacted</td>
                <td style={{
                  padding: '8px 0',
                  borderBottom: '1px solid #f4f4f4',
                  color: '#007bff',
                  fontWeight: 'bold',
                  textAlign: 'right'
                }}>{dashboardData.contactedCount}</td>
              </tr>
              <tr>
                <td style={{
                  padding: '8px 0',
                  color: '#6c757d'
                }}>Opportunity</td>
                <td style={{
                  padding: '8px 0',
                  color: '#007bff',
                  fontWeight: 'bold',
                  textAlign: 'right'
                }}>{dashboardData.opportunityCount}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</div>
              
              {/* Right Column - Birthdays */}
              <div className="col-md-6" style={{ padding: '0 10px' }}>
                <div className="card cardHover" style={{
                  borderRadius: '10px',
                  border: '1px solid rgba(0,0,0,.125)',
                  boxShadow: '0 0 1px rgba(0,0,0,.125), 0 1px 3px rgba(0,0,0,.2)',
                  marginBottom: '20px'
                }}>
                  <div style={{ padding: '15px' }}>
                    <h4 style={{
                      color: '#495057',
                      fontSize: '18px',
                      margin: '0 0 15px 0',
                      fontWeight: 'bold'
                    }}>Birthday</h4>
                    <p style={{ color: '#6c757d', marginBottom: '20px' }}>
                      Send birthday wishes to customer & leads
                    </p>
                    
                    <div style={{ marginBottom: '20px' }}> 
                      <h5 style={{
                        color: '#495057',
                        fontSize: '16px',
                        margin: '0 0 10px 0',
                        fontWeight: 'bold'
                      }}>Today</h5>
                      {dashboardData.todayBirthdays.length === 0 && (
                        <div style={{ color: '#6c757d' }}>No birthdays today</div>
                      )}
                      {dashboardData.todayBirthdays.map((person, index) => (
                        <div key={index} style={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          padding: '5px 0'
                        }}>
                          <input 
                            type="checkbox" 
                            style={{ 
                              marginRight: '10px',
                              width: '16px',
                              height: '16px'
                            }} 
                          />
                          <span style={{ color: '#6c757d' }}>
                            #{index + 1} {person.name}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    <div>
                      <h5 style={{
                        color: '#495057',
                        fontSize: '16px',
                        margin: '0 0 10px 0',
                        fontWeight: 'bold'
                      }}>Upcoming</h5>
                      {dashboardData.upcomingBirthdays.length === 0 && (
                        <div style={{ color: '#6c757d' }}>
                          No upcoming birthdays in next 30 days
                        </div>
                      )}
                      {dashboardData.upcomingBirthdays.map((person, index) => (
                        <div key={index} style={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          padding: '5px 0'
                        }}>
                          <input 
                            type="checkbox" 
                            style={{ 
                              marginRight: '10px',
                              width: '16px',
                              height: '16px'
                            }} 
                          />
                          <span style={{ color: '#6c757d' }}>
                            #{index + 1} {person.name} {person.date}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default CRMDashboard;
