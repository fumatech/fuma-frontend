import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../assets/dist/css/adminlte.min.css";
import "../../assets/plugins/fontawesome-free/css/all.min.css";
import "../../assets/plugins/datatables-bs4/css/dataTables.bootstrap4.min.css";
import "../../assets/plugins/datatables-responsive/css/responsive.bootstrap4.min.css";
import "../../assets/plugins/datatables-buttons/css/buttons.bootstrap4.min.css";
import { Dropdown, DropdownButton, Collapse } from "react-bootstrap";

import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import $ from "jquery";
import { Link, useNavigate } from "react-router-dom";

const ListDISale = () => {
  const [purchases, setPurchases] = useState([]);
  const [columnsVisibility, setColumnsVisibility] = useState({
    action: true,
    status: true,
    saleDIOrderId: true,
    date: true,
    referenceNumber: true,
    location: true,
    franchiseName: true,
    totalItems: true,
    additionalNotes: true,
    addedBy: true,
    city: true,
    state: true,
    netTotalAmount: true,
  });
  const navigate = useNavigate();

  const [modalType, setModalType] = useState(null);
  const [currentPurchase, setCurrentPurchase] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [formData, setFormData] = useState({
    date: "",
    referenceNumber: "",
    location: "",
    franchise: "",
    totalItems: "",
    additionalNotes: "",
    addedBy: "",
  });

  // Filter states
  const [filterValues, setFilterValues] = useState({
    franchiseNames: [],
    locations: [],
    cities: [],
    states: [],
  });
  
  const [activeFilters, setActiveFilters] = useState({
    startDate: "",
    endDate: "",
    franchiseName: "",
    location: "",
    city: "",
    state: "",
  });
  
  const [filteredPurchases, setFilteredPurchases] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/sale-di-order/getall`
        );

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();
        const sortedData = data.sort((a, b) => b.id - a.id);

        const updatedPurchases = await Promise.all(
          sortedData.map(async (purchase) => {
            try {
              const customerRes = await fetch(
                `${process.env.REACT_APP_BASE_URL}/customer/${purchase.customerId}`
              );

              if (!customerRes.ok) throw new Error("Customer not found");

              const customer = await customerRes.json();

              return {
                ...purchase,
                franchiseName: customer.franchiseName || "",
                city: customer.city || "",
                state: customer.state || "",
              };
            } catch (err) {
              console.error("Error fetching customer:", err);
              return {
                ...purchase,
                franchiseName: "N/A",
                city: "N/A",
                state: "N/A",
              };
            }
          })
        );

        setPurchases(updatedPurchases);
        setFilteredPurchases(updatedPurchases);
      } catch (error) {
        console.error("Error fetching purchases:", error);
        setPurchases([]);
        setFilteredPurchases([]);
      }
    };

    fetchPurchases();
  }, []);

  // Extract filter values when purchases data changes
  useEffect(() => {
    if (purchases.length > 0) {
      const franchiseNames = [...new Set(purchases.map(item => item.franchiseName))].filter(Boolean);
      const locations = [...new Set(purchases.map(item => item.location))].filter(Boolean);
      const cities = [...new Set(purchases.map(item => item.city))].filter(Boolean);
      const states = [...new Set(purchases.map(item => item.state))].filter(Boolean);
      
      setFilterValues({
        franchiseNames,
        locations,
        cities,
        states,
      });
    }
  }, [purchases]);

  // Apply filters whenever activeFilters or purchases changes
  useEffect(() => {
    const filteredData = purchases.filter((purchase) => {
      const purchaseDate = new Date(purchase.saleDate);
      
      // Date range filter
      let dateMatch = true;
      if (activeFilters.startDate && activeFilters.endDate) {
        const startDate = new Date(activeFilters.startDate);
        const endDate = new Date(activeFilters.endDate);
        endDate.setHours(23, 59, 59, 999);
        
        dateMatch = purchaseDate >= startDate && purchaseDate <= endDate;
      } else if (activeFilters.startDate) {
        const startDate = new Date(activeFilters.startDate);
        dateMatch = purchaseDate >= startDate;
      } else if (activeFilters.endDate) {
        const endDate = new Date(activeFilters.endDate);
        endDate.setHours(23, 59, 59, 999);
        dateMatch = purchaseDate <= endDate;
      }
      
      // Franchise Name filter
      const franchiseNameMatch = activeFilters.franchiseName === "" || 
        purchase.franchiseName === activeFilters.franchiseName;
      
      // Location filter
      const locationMatch = activeFilters.location === "" || 
        purchase.location === activeFilters.location;
      
      // City filter
      const cityMatch = activeFilters.city === "" || 
        purchase.city === activeFilters.city;
      
      // State filter
      const stateMatch = activeFilters.state === "" || 
        purchase.state === activeFilters.state;
      
      return dateMatch && franchiseNameMatch && locationMatch && cityMatch && stateMatch;
    });
    
    setFilteredPurchases(filteredData);
  }, [activeFilters, purchases]);

  // Filter change handler
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setActiveFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setCurrentPage(1);
  };

  // Reset filters function
  const resetFilters = () => {
    setActiveFilters({
      startDate: "",
      endDate: "",
      franchiseName: "",
      location: "",
      city: "",
      state: "",
    });
  };

  const handleAdd = () => {
    setModalType("add");
  };

  const handleViewClick = (id) => {
    navigate(`/ViewDISale/${id}`);
  };

  const handleEditClick = (id) => {
    navigate(`/EditDISale/${id}`);
  };

  const handleDeleteClick = (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      fetch(`${process.env.REACT_APP_BASE_URL}/sale-di-order/delete/${id}`, {
        method: "DELETE",
      })
        .then((response) => {
          if (response.status === 204) {
            setPurchases((prevPurchases) =>
              prevPurchases.filter((purchase) => purchase.id !== id)
            );
            alert("Sale DI Order deleted successfully!");
          } else {
            alert("Failed to delete sale.");
          }
        })
        .catch((error) => {
          console.error("Error deleting sale:", error);
          alert("An error occurred while deleting the sale.");
        });
    }
  };

  const exportCSV = () => {
    const csvData = filteredPurchases.map((purchase) => ({
      Date: purchase.date,
      ReferenceNumreferenceNumber: purchase.referenceNumber,
      Location: purchase.location,
      franchise: purchase.franchise,
      totalItems: purchase.totalItems,
      additionalNotes: purchase.additionalNotes,
      AddedBy: purchase.addedBy,
    }));

    const csv = [
      ["Date", "Reference No", "Location", "franchise", "Added By"],
      ...csvData.map((row) => Object.values(row)),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, "purchases.csv");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredPurchases.map((purchase) => ({
        Date: purchase.date,
        ReferenceNumreferenceNumber: purchase.referenceNumber,
        Location: purchase.location,
        franchise: purchase.franchise,
        totalItems: purchase.totalItems,
        additionalNotes: purchase.additionalNotes,
        AddedBy: purchase.addedBy,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Purchases");
    XLSX.writeFile(wb, "purchases.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();

    const headers = [
      "Date",
      "Reference No",
      "Location",
      "franchise",
      "Added By",
    ];

    const body = filteredPurchases.map((p) => [
      p.saleDate,
      p.referenceNumber,
      p.location,
      p.franchise,
      p.totalItems,
      p.additionalNotes,
      p.addedBy,
    ]);

    doc.text("Purchase List", 14, 20);
    doc.setFontSize(12);
    doc.text("Below is the list of purchases with their details:", 14, 30);

    doc.autoTable({
      head: [headers],
      body: body,
      theme: "grid",
      styles: {
        fontSize: 10,
        cellPadding: 3,
        valign: "middle",
        halign: "center",
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [22, 160, 133],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240],
      },
      margin: { top: 50 },
    });

    doc.save("PurchaseList.pdf");
  };

  const toggleColumn = (column) => {
    setColumnsVisibility((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  const printData = () => {
    const printWindow = window.open("", "_blank", "width=800,height=600");

    const tableContent = `
      <html>
        <head>
          <title>Print Purchases</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; }
            th { background-color: #f2f2f2; }
            th, td { text-align: left; }
          </style>
        </head>
        <body>
          <h2>Purchase Report</h2>
          <table>
            <thead>
              <tr>
                ${columnsVisibility.date ? "<th> Date</th>" : ""}
                ${columnsVisibility.referenceNumber ? "<th>Reference No</th>" : ""}
                ${columnsVisibility.location ? "<th>Location</th>" : ""}
                ${columnsVisibility.franchise ? "<th>franchise</th>" : ""}
                ${columnsVisibility.totalItems ? "<th>Total Items</th>" : ""}
                ${columnsVisibility.additionalNotes ? "<th>Note</th>" : ""}
                ${columnsVisibility.addedBy ? "<th>Added By</th>" : ""}
              </tr>
            </thead>
            <tbody>
              ${filteredPurchases
                .slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage)
                .map(
                  (purchase) => `
                <tr>
                  ${columnsVisibility.date ? `<td>${purchase.saleDate}</td>` : ""}
                  ${columnsVisibility.referenceNumber ? `<td>${purchase.referenceNumber}</td>` : ""}
                  ${columnsVisibility.location ? `<td>${purchase.location}</td>` : ""}
                  ${columnsVisibility.franchise ? `<td>${purchase.franchise}</td>` : ""}
                  ${columnsVisibility.totalItems ? `<td>${purchase.totalItems}</td>` : ""}
                  ${columnsVisibility.additionalNotes ? `<td>${purchase.additionalNotes}</td>` : ""}
                  ${columnsVisibility.addedBy ? `<td>${purchase.addedBy}</td>` : ""}
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(tableContent);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  const handleFormChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleEntriesChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const purchase = filteredPurchases.slice(startIndex, endIndex);

  const handlePrintInvoice = (purchase) => {
    const printWindow = window.open("", "_blank", "width=800,height=900");

    const subtotal =
      purchase.saleDIItem?.reduce(
        (sum, item) => sum + item.quantity * item.unitSellingPrice,
        0
      ) || 0;
    const tax = purchase.taxAmount || 0;
    const discount = purchase.discountAmount || 0;
    const total = subtotal + tax - discount;

    const invoiceContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            
            .header-section { margin-bottom: 15px; border-bottom: 1px solid #666; }
            .invoice-header { display: flex; justify-content: space-between; align-items: center; font-size: 13px; line-height: 1.1; }
            .company-info { text-align: left; }
            .company-logo { width: 150px; height: 50px; border-radius : 10px; border: 2px solid #666; display: flex; align-items: center; justify-content: center; text-align: center; }
            .details-table, .items-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .total-section { display: flex; justify-content: space-between; gap: 20px; margin-top: 20px; }
            .total-box { border: 2px solid #666; border-radius : 10px; padding: 10px; font-size: 13px; width: 30%; }
            .notes-box { border: 2px solid #666; border-radius : 10px; padding: 10px; font-size: 13px; width: 65%; }            .footer { text-align: center; margin-top: 25px; border-top: 1px solid #666; padding-top: 15px; font-size: 13px; }
            .customer_detail > div {
              border: 1px solid #666; 
              border-radius : 10px;
              padding: 10px; 
              width: 48%; 
              box-sizing: border-box;
            }
            .customer_detail { 
              display: flex; 
              gap: 20px; 
              font-size: 13px; 
              margin-top: 10px;
              padding-bottom: 13px; 
              margin-bottom: 10px; border-bottom: 1px solid #666;
            }  
            .items-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 13px;
              line-height: 1.2;
              border: 1px solid #000;
            }
  
            .items-table th {
              background-color: #f2f2f2;
              border: 1.75px solid #000;
              padding: 8px;
              text-align: left;
              font-weight: bolder;
            }
  
            .items-table td {
              border: 1px solid #333;
              padding: 8px;
              text-align: left;
            }
          </style>
        </head>
        <body>
          <div style="text-align: center;">
            <h1 style="font-size: 24px; font-weight: bold; margin: 10px 0;">Invoice</h1>
          </div>
  
          <div class="invoice-header">
            <div class="company-info">
              <h2 style="margin: 0; margin-left: 10px;">FUMA</h2>
              <p style="margin: 2px 0; margin-left: 10px;">Power Innovation</p>
            </div>
            <div class="company-logo">
              <p style="margin: 0;">Logo</p>
            </div>
          </div>
  
          <div class="header-section" style="margin-left: 10px; padding-bottom:10px">
            <div class="invoice-header">
              <div style="width: 50%;">
                <h3 style="font-size: 15px;">Invoice Details</h3>
                <p style="margin: 2px 0; display: flex;">
                  <strong style="min-width: 110px;">Invoice No:</strong>: ${
                    purchase.saleDIOrderId || "N/A"
                  }
                </p>
                <p style="margin: 2px 0; display: flex;">
                  <strong style="min-width: 110px;">Invoice Date:</strong>: ${
                    purchase.saleDate || "N/A"
                  }
                </p>
                <p style="margin: 2px 0; display: flex;">
                  <strong style="min-width: 110px;">Customer:</strong>: ${
                    purchase.orderedBy || "N/A"
                  }
                </p>
                <p style="margin: 2px 0; display: flex;">
                  <strong style="min-width: 110px;">Reference No:</strong>: ${
                    purchase.referenceNumber || "N/A"
                  }
                </p>
                <p style="margin: 2px 0; display: flex;">
                  <strong style="min-width: 110px;">Location:</strong>: ${
                    purchase.location || "N/A"
                  }
                </p>
              </div>
            </div>
          </div>
  
          <div class="customer_detail">
            <div>
              <h3 style="font-size: 14px;">Business Details</h3>
              <p style="margin: 2px 0; display: flex;"><strong style="min-width: 110px;">Franchise Name</strong>: ${
                purchase.franchise || "FUMA"
              }</p>
              <p style="margin: 2px 0; display: flex;"><strong style="min-width: 110px;">Address:</strong>: ${
                purchase.location || "N/A"
              }</p>
              <p style="margin: 2px 0; display: flex;"><strong style="min-width: 110px;">Phone No:</strong>: N/A</p>
              <p style="margin: 2px 0; display: flex;"><strong style="min-width: 110px;">GST No:</strong>: N/A</p>
              <p style="margin: 2px 0; display: flex;"><strong style="min-width: 110px;">Email:</strong>: ${
                purchase.addedBy || "N/A"
              }</p>
            </div>
            <div>
              <h3 style="font-size: 14px;">Customer Details</h3>
              <p style="margin: 2px 0; display: flex;"><strong style="min-width: 90px;">Name:</strong>: ${
                purchase.orderedBy || "N/A"
              }</p>
              <p style="margin: 2px 0; display: flex;"><strong style="min-width: 90px;">Address:</strong>: ${
                purchase.location || "N/A"
              }</p>
              <p style="margin: 2px 0; display: flex;"><strong style="min-width: 90px;">Number:</strong>: N/A</p>
              <p style="margin: 2px 0; display: flex;"><strong style="min-width: 90px;">Email:</strong>: ${
                purchase.addedBy || "N/A"
              }</p>
              <p style="margin: 2px 0; display: flex;"><strong style="min-width: 90px;">Reference:</strong>: ${
                purchase.referenceNumber || "N/A"
              }</p>
            </div>
          </div>
  
          <table class="items-table">
            <thead>
              <tr>
                <th style="padding: 4px; font-size: 15px;">Sr.n</th>
                <th style="padding: 4px; font-size: 15px;">Product</th>
                <th style="padding: 4px; font-size: 15px;">Product code</th>
                <th style="padding: 4px; font-size: 15px;">HLS code</th>
                <th style="padding: 4px; font-size: 15px;">Unit Price</th>
                <th style="padding: 4px; font-size: 15px;">Quantity</th>
                <th style="padding: 4px; font-size: 15px;">Total</th>
                <th style="padding: 4px; font-size: 15px;">Discount</th>
                <th style="padding: 4px; font-size: 15px;">GST</th>
              </tr>
            </thead>
            <tbody>
              ${purchase.saleDIItem
                ?.map(
                  (item, index) => `
                <tr>
                  <td style="padding: 3px;">${index + 1}</td>
                  <td style="padding: 3px;">${item.productName || "N/A"}</td>
                  <td style="padding: 3px;">${item.productSku || "N/A"}</td>
                  <td style="padding: 3px;"></td>
                  <td style="padding: 3px;">₹${
                    item.unitSellingPrice?.toFixed(2) || "0.00"
                  }</td>
                  <td style="padding: 3px;">${item.quantity || "0"}</td>
                  <td style="padding: 3px;">₹${(
                    (item.quantity || 0) * (item.unitSellingPrice || 0)
                  ).toFixed(2)}</td>
                  <td style="padding: 3px;">${
                    purchase.discountAmount || "0"
                  }</td>
                  <td style="padding: 3px;">${purchase.taxAmount || "0"}</td>
                </tr>
              `
                )
                .join("")}
              
              ${(() => {
                const emptyRows = [];
                const itemCount = purchase.saleDIItem?.length || 0;
                for (let i = itemCount; i < 12; i++) {
                  emptyRows.push(`
                    <tr>
                      <td style="padding: 3px;"></td>
                      <td style="padding: 3px;">&nbsp;</td>
                      <td style="padding: 3px;">&nbsp;</td>
                      <td style="padding: 3px;">&nbsp;</td>
                      <td style="padding: 3px;">&nbsp;</td>
                      <td style="padding: 3px;">&nbsp;</td>
                      <td style="padding: 3px;">&nbsp;</td>
                      <td style="padding: 3px;">&nbsp;</td>
                      <td style="padding: 3px;">&nbsp;</td>
                    </tr>
                  `);
                }
                return emptyRows.join("");
              })()}
            </tbody>
          </table>
  
          <div class="total-section">
            <div class="notes-box">
              <h3>Notes:</h3>
              <p>${purchase.additionalNotes || "No Note."}</p>
            </div>
  
            <div class="total-box">
              <table style="width:100%">
                <tr><td>Subtotal:</td><td>₹${subtotal.toFixed(2)}</td></tr>
                <tr><td>SGST :</td><td>${
                  purchase.taxRate?.toFixed(2) || "0.00"
                }</td></tr>
                <tr><td>IGST:</td><td>₹${tax.toFixed(2)}</td></tr>
                <tr><td>Payment Term:</td><td>${
                  purchase.payTermNumber || "N/A"
                } ${purchase.payTermType || ""}</td></tr>
                <tr><td><strong>Total:</strong></td><td><strong>₹${total.toFixed(
                  2
                )}</strong></td></tr>
              </table>
            </div>
          </div>
  
          <div class="footer">
            <h3>Thank you for your business!</h3>
            <p>
              ${
                purchase.location ||
                "Opposite to Padamji Papermill/pune, india, ST, 00000"
              }<br>
              Tel: N/A | Email: ${
                purchase.addedBy || "nanasaheb.k@fuma.co.in"
              }<br>
              Web: www.fuma.co.in
            </p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(invoiceContent);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-12 col-md-6">
                <h1 className=" all-heading">List DI Sale Entry</h1>
                <span className="d-inline d-md-block sub-heading">
                  Manage DI Sale Entries
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="content">
          <div className="container-fluid">
            {/* Filter Card */}
            <div className="card card-default rounded-4 border-0 cardHover mb-3">
              <div
                className="my- p-3 d-flex align-items-center"
                style={{
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
                onClick={() => setFilterOpen(!filterOpen)}
              >
                <i className={`fa fa-filter me-3`}></i>
                <span>Filter</span>
              </div>

              <Collapse in={filterOpen}>
                <div className="border-top">
                  <div className="card-body">
                    <div className="row py-2 g-2">
                      {/* Start Date Picker */}
                      <div className="col-md-3">
                        <div className="form-group">
                          <label className="me-2">Start Date:</label>
                          <input
                            type="date"
                            className="form-control"
                            name="startDate"
                            value={activeFilters.startDate}
                            onChange={handleFilterChange}
                          />
                        </div>
                      </div>

                      {/* End Date Picker */}
                      <div className="col-md-3">
                        <div className="form-group">
                          <label className="me-2">End Date:</label>
                          <input
                            type="date"
                            className="form-control"
                            name="endDate"
                            value={activeFilters.endDate}
                            onChange={handleFilterChange}
                          />
                        </div>
                      </div>

                      {/* Franchise Name Dropdown */}
                      <div className="col-md-3">
                        <div className="form-group">
                          <label className="me-2">Franchise Name:</label>
                          <select
                            className="form-select"
                            name="franchiseName"
                            value={activeFilters.franchiseName}
                            onChange={handleFilterChange}
                          >
                            <option value="">All Franchises</option>
                            {filterValues.franchiseNames.map((franchiseName, index) => (
                              <option key={`franchise-${index}`} value={franchiseName}>
                                {franchiseName}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Location Dropdown */}
                      <div className="col-md-3">
                        <div className="form-group">
                          <label className="me-2">Location:</label>
                          <select
                            className="form-select"
                            name="location"
                            value={activeFilters.location}
                            onChange={handleFilterChange}
                          >
                            <option value="">All Locations</option>
                            {filterValues.locations.map((location, index) => (
                              <option key={`loc-${index}`} value={location}>
                                {location}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* City Dropdown */}
                      <div className="col-md-3">
                        <div className="form-group">
                          <label className="me-2">City:</label>
                          <select
                            className="form-select"
                            name="city"
                            value={activeFilters.city}
                            onChange={handleFilterChange}
                          >
                            <option value="">All Cities</option>
                            {filterValues.cities.map((city, index) => (
                              <option key={`city-${index}`} value={city}>
                                {city}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* State Dropdown */}
                      <div className="col-md-3">
                        <div className="form-group">
                          <label className="me-2">State:</label>
                          <select
                            className="form-select"
                            name="state"
                            value={activeFilters.state}
                            onChange={handleFilterChange}
                          >
                            <option value="">All States</option>
                            {filterValues.states.map((state, index) => (
                              <option key={`state-${index}`} value={state}>
                                {state}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Reset Button */}
                      <div className="col-md-12 d-flex align-items-end">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={resetFilters}
                          disabled={!Object.values(activeFilters).some(Boolean)}
                        >
                          <i className="fa fa-times me-1"></i> Reset All Filters
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Collapse>
            </div>

            <div className="card cardHover rounded-4 border-0">
              <div className="d-flex justify-content-end mb-3">
                <Link to="/AddDISale" className="btn btn-add">
                  <i className="fas fa-plus"></i> Add
                </Link>
              </div>

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
                        {columnsVisibility.action && <th>Action</th>}
                        {columnsVisibility.saleDIOrderId && <th>Order Id</th>}

                        {columnsVisibility.date && <th>Sale Date</th>}
                        {columnsVisibility.referenceNumber && (
                          <th>Invoice No</th>
                        )}
                        {columnsVisibility.franchiseName && (
                          <th>Franchise Name</th>
                        )}
                        {columnsVisibility.city && <th>City</th>}
                        {columnsVisibility.state && <th>State</th>}
                        {columnsVisibility.totalItems && (
                          <th> Total Sold Qty</th>
                        )}
                        {columnsVisibility.netTotalAmount && (
                          <th>Total Amount</th>
                        )}

                        {columnsVisibility.additionalNotes && <th>Note</th>}
                        {columnsVisibility.addedBy && <th>Added By</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {purchase.map((purchase) => (
                        <tr key={purchase.id}>
                          {columnsVisibility.action && (
                            <td>
                              <DropdownButton
                                id="dropdown-basic-button"
                                title="Actions"
                                variant="outline-success rounded-5 fs-6 fw-light border-1"
                                className="custom-outline-dropdown p-2"
                              >
                                <Dropdown.Item
                                  as="button"
                                  onClick={() => handleViewClick(purchase.id)}
                                >
                                  <div className="d-inline-block w-75 btn-view justify-content-center text-secondary">
                                    <i className="dropdown_hover fa fa-eye me-3"></i>
                                    <span>View</span>
                                  </div>
                                </Dropdown.Item>
                                <Dropdown.Item
                                  as="button"
                                  onClick={() => handleEditClick(purchase.id)}
                                >
                                  <div className="d-inline-block w-75 btn-view justify-content-center text-secondary">
                                    <i className="dropdown_hover fa fa-edit me-3"></i>
                                    <span>Edit</span>
                                  </div>
                                </Dropdown.Item>
                                <Dropdown.Item
                                  as="button"
                                  onClick={() => handleDeleteClick(purchase.id)}
                                >
                                  <div className="d-inline-block w-75 btn-view justify-content-center text-danger">
                                    <i className="dropdown_hover fa fa-trash me-3"></i>
                                    <span>delete</span>
                                  </div>
                                </Dropdown.Item>

                                <Dropdown.Item
                                  as="button"
                                  onClick={() => handlePrintInvoice(purchase)}
                                >
                                  <div className="d-inline-block w-100 btn-print justify-content-center text-secondary">
                                    <i className="fa fa-print me-3"></i>
                                    <span>Print Invoice</span>
                                  </div>
                                </Dropdown.Item>
                              </DropdownButton>
                            </td>
                          )}

                          {columnsVisibility.saleDIOrderId && (
                            <td>{purchase.saleDIOrderId}</td>
                          )}

                          {columnsVisibility.date && (
                            <td>{purchase.saleDate}</td>
                          )}
                          {columnsVisibility.referenceNumber && (
                            <td>{purchase.referenceNumber}</td>
                          )}
                          {columnsVisibility.franchiseName && (
                            <td>{purchase.franchise}</td>
                          )}
                          {columnsVisibility.city && <td>{purchase.city}</td>}
                          {columnsVisibility.state && <td>{purchase.state}</td>}
                          {columnsVisibility.totalItems && (
                            <td>{purchase.totalItems}</td>
                          )}
                          {columnsVisibility.netTotalAmount && (
                            <td>{purchase.netTotalAmount}</td>
                          )}
                          {columnsVisibility.additionalNotes && (
                            <td>{purchase.additionalNotes}</td>
                          )}
                          {columnsVisibility.addedBy && (
                            <td>{purchase.addedBy}</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ListDISale;