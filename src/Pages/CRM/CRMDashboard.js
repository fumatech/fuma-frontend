import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers } from "@fortawesome/free-solid-svg-icons";

import Campaigns from "./Campaigns";
import ContactLogin from "./ContactLogin";
import Leads from "./Leads";
import FollowUps from "./FollowUps";


const tabsData = [
  
  { id: "Leads", label: "Leads" , component: <Leads  />  },
  { id: "Follow-Ups", label: "Follow Ups" , component: <FollowUps  />   },
  { id: "Campaigns", label: "Campaigns" , component: <Campaigns  />  },
  { id: "Contacts-Login", label: "Contacts Login" , component: <ContactLogin  />  },
  { id: "Sources", label: "Sources" },
  { id: "Life-Stage", label: "Life Stage" },
];

const CRMDashboard = () => {
  const [activeTab, setActiveTab] = useState(null);
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Dashboard data
  const dashboardData = {
    customerCount: 3,
    leadsCount: 0,
    sourcesCount: 3,
    lifeStagesCount: 4,
    facebookCount: 1,
    emailCount: 1,
    twitterCount: 1,
    offlineCount: 0,
    todayBirthdays: [{ name: "Harry" }],
    upcomingBirthdays: [
      { name: "Birthday on", date: "" },
      { name: "Walk-In Customer", date: "" },
      { name: "22nd Oct", date: "" }
    ]
  };

  const activeTabData = tabsData.find(tab => tab.id === activeTab);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;

  const handleEntriesChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

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
                }}>{dashboardData.facebookCount}</td>
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
                }}>{dashboardData.emailCount}</td>
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
                }}>{dashboardData.twitterCount}</td>
              </tr>
              <tr>
                <td style={{
                  padding: '8px 0',
                  color: '#6c757d'
                }}>Oppotu</td>
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