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
import axios from 'axios';
import { Link, useNavigate } from "react-router-dom";

const ListSoSale = () => {
  const [purchases, setPurchases] = useState([]);
  const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:5000/api/v1';
  const [columnsVisibility, setColumnsVisibility] = useState({
    action: true,
    purchasePoOrderId: true,
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
    franchiseName: "",
    totalItems: "",
    additionalNotes: "",
    addedBy: "",
    netTotalAmount: "",
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
  const [companyLogo, setCompanyLogo] = useState(null);
  const [businessDetails, setBusinessDetails] = useState(null);

  useEffect(() => {
    // Add jQuery script
    const script = document.createElement("script");
    script.src = "js/JqueryContent.js";
    script.async = true;
    document.body.appendChild(script);
  
    const fetchPurchases = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/sale-so-order/getall`
        );
  
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
  
        const data = await response.json();
  
        console.log(data);
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
                customerData: customer // Store full customer data for invoice
              };
            } catch (err) {
              console.error("Error fetching customer:", err);
              return {
                ...purchase,
                franchiseName: "N/A",
                city: "N/A",
                state: "N/A",
                customerData: null
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
  
    // Optional: Cleanup function to remove script when component unmounts
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Fetch logo and business details when component mounts
  useEffect(() => {
    const fetchLogoAndBusinessDetails = async () => {
      try {
        console.log("Fetching logo from:", `${BASE_URL}/file/get-all`);
        const response = await axios.get(`${BASE_URL}/file/get-all`);
        const files = response.data || [];
        
        console.log("Files from API:", files);
        
        const logoFile = files.find(file => {
          if (!file.image) return false;
          
          const fileName = file.image.split("/").pop();
          const isImage = /\.(jpg|jfif|jpeg|png|gif)$/i.test(fileName);
          
          return isImage && (fileName.toLowerCase().includes('logo') || 
                 fileName.toLowerCase().includes('company') || 
                 fileName.toLowerCase().includes('fuma') ||
                 true);
        });
        
        if (logoFile && logoFile.image) {
          console.log("Found logo file:", logoFile);
          
          const logoUrl = `${BASE_URL}${logoFile.image}`;
          console.log("Logo URL:", logoUrl);
          
          setCompanyLogo(logoUrl);
          
          try {
            const imageResponse = await fetch(logoUrl);
            const blob = await imageResponse.blob();
            
            const base64String = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
            
            console.log("Logo converted to base64 successfully");
            setCompanyLogo(base64String);
          } catch (conversionError) {
            console.warn("Could not convert logo to base64, using direct URL:", conversionError);
            setCompanyLogo(logoUrl);
          }
        } else {
          console.log("No image file found in API response");
          const anyImageFile = files.find(file => file.image && file.image.match(/\.(jpg|jpeg|png|gif)$/i));
          if (anyImageFile && anyImageFile.image) {
            const fallbackLogoUrl = `${BASE_URL}${anyImageFile.image}`;
            console.log("Using fallback image:", fallbackLogoUrl);
            setCompanyLogo(fallbackLogoUrl);
          }
        }

        // Fetch business details
        console.log("Fetching business details from:", `${BASE_URL}/business-details/getall`);
        const businessRes = await axios.get(`${BASE_URL}/business-details/getall`);
        const businessData = businessRes.data || [];
        
        if (businessData.length > 0) {
          console.log("Found business details:", businessData[0]);
          setBusinessDetails(businessData[0]);
        } else {
          console.log("No business details found");
        }
        
      } catch (error) {
        console.error("Failed to fetch logo or business details:", error);
        setCompanyLogo("https://via.placeholder.com/150x50/0d6efd/ffffff?text=FUMA+Logo");
      }
    };
    
    fetchLogoAndBusinessDetails();
  }, [BASE_URL]);

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
      const purchaseDate = new Date(purchase.orderDate);
      
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
      
      const franchiseNameMatch = activeFilters.franchiseName === "" || 
        purchase.franchiseName === activeFilters.franchiseName;
      
      const locationMatch = activeFilters.location === "" || 
        purchase.location === activeFilters.location;
      
      const cityMatch = activeFilters.city === "" || 
        purchase.city === activeFilters.city;
      
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

  const handleEditClick = (id) => {
    navigate(`/EditSoSale/${id}`);
  };

  const handleViewClick = (id) => {
    navigate(`/ViewSoSale/${id}`);
  };

  const handleDeleteClick = (id, franchisePurchaseOrderId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      fetch(`${process.env.REACT_APP_BASE_URL}/sale-so-order/delete/${id}`, {
        method: "DELETE",
      })
        .then((response) => {
          if (response.status === 204) {
            setPurchases((prevPurchases) =>
              prevPurchases.filter((purchase) => purchase.id !== id)
            );

            fetch(
              `${process.env.REACT_APP_BASE_URL}/franchisepurchaseorder/updateStatusByOrderId/${franchisePurchaseOrderId}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ status: 3 }),
              }
            )
              .then((res) => {
                if (res.ok) {
                  alert("Sale So Order deleted successfully!");
                } else {
                  alert("Failed to delete");
                }
              })
              .catch((error) =>
                console.error("Error updating order status:", error)
              );
          } else {
            alert("Failed to delete product.");
          }
        })
        .catch((error) => console.error("Error deleting product:", error));
    }
  };

  const exportCSV = () => {
    const csvData = filteredPurchases.map((purchase) => ({
      Date: purchase.date,
      referenceNumber: purchase.referenceNumber,
      Location: purchase.location,
      franchiseName: purchase.franchiseName,
      totalItems: purchase.totalItems,
      additionalNotes: purchase.additionalNotes,
      AddedBy: purchase.addedBy,
    }));

    const csv = [
      ["Date", "Reference No", "Location", "franchiseName", "Added By"],
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
        referenceNumber: purchase.referenceNumber,
        Location: purchase.location,
        franchiseName: purchase.franchiseName,
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
      "franchiseName",
      "Added By",
    ];

    const body = filteredPurchases.map((p) => [
      p.purchaseDate,
      p.referenceNumber,
      p.location,
      p.franchiseName,
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

  // Enhanced function to convert numbers to words
  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const thousands = ['', 'Thousand', 'Lakh', 'Crore'];

    if (num === 0) return 'Zero';

    const convertLessThanThousand = (n) => {
      if (n === 0) return '';
      
      let result = '';
      
      if (Math.floor(n / 100) > 0) {
        result += ones[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      
      if (n >= 20) {
        result += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      } else if (n >= 10) {
        result += teens[n - 10] + ' ';
        return result;
      }
      
      if (n > 0) {
        result += ones[n] + ' ';
      }
      
      return result;
    };

    const convertIndianNumber = (n) => {
      if (n === 0) return 'Zero';
      
      let result = '';
      let index = 0;
      
      // Handle lakhs and crores (Indian numbering system)
      if (n >= 10000000) {
        const crores = Math.floor(n / 10000000);
        result += convertLessThanThousand(crores) + 'Crore ';
        n %= 10000000;
      }
      
      if (n >= 100000) {
        const lakhs = Math.floor(n / 100000);
        result += convertLessThanThousand(lakhs) + 'Lakh ';
        n %= 100000;
      }
      
      if (n >= 1000) {
        const thousands = Math.floor(n / 1000);
        result += convertLessThanThousand(thousands) + 'Thousand ';
        n %= 1000;
      }
      
      if (n > 0) {
        result += convertLessThanThousand(n);
      }
      
      return result.trim();
    };

    // Handle decimal part
    const integerPart = Math.floor(num);
    const decimalPart = Math.round((num - integerPart) * 100);
    
    let result = convertIndianNumber(integerPart);
    
    if (result === '') {
      result = 'Zero';
    }
    
    if (decimalPart > 0) {
      result += ' and ' + convertLessThanThousand(decimalPart).trim() + ' Paise';
    }
    
    return result + ' Only';
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
                ${columnsVisibility.referenceNumber ? "<th>Invoice No</th>" : ""}
                ${columnsVisibility.location ? "<th>Location</th>" : ""}
                ${columnsVisibility.franchiseName ? "<th>franchiseName</th>" : ""}
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
                  ${columnsVisibility.date ? `<td>${purchase.orderDate}</td>` : ""}
                  ${columnsVisibility.referenceNumber ? `<td>${purchase.referenceNumber}</td>` : ""}
                  ${columnsVisibility.location ? `<td>${purchase.location}</td>` : ""}
                  ${columnsVisibility.franchiseName ? `<td>${purchase.franchiseName}</td>` : ""}
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

const handlePrintInvoice = (purchaseItem) => {
    // Ask user if they want invoice with logo
    const withLogo = window.confirm("Do you want to print invoice with company logo?");
    
    const printWindow = window.open("", "_blank", "width=800,height=900");
  
    // Calculate values
    const subtotal =
      purchaseItem.saleSoItem?.reduce(
        (sum, item) => sum + (item.quantity * item.unitSellingPrice),
        0
      ) || 0;
    
    const tax = purchaseItem.taxAmount || 0;
    const discount = purchaseItem.discountAmount || 0;
    const shippingCharges = purchaseItem.shippingSoDetails?.[0]?.shippingCharges || 0;
    
    // Calculate total
    const taxableAmount = subtotal - discount;
    const total = taxableAmount + tax + shippingCharges;
    
    // Get customer data
    const customer = purchaseItem.customerData || {};
    
    // Get business details
    const business = businessDetails || {};
    
    // Logo HTML - conditionally include based on user choice
    const logoHtml = withLogo && companyLogo 
      ? `<img src="${companyLogo}" alt="Company Logo" style="max-width: 380px; max-height: 180px; width: auto; height: auto; object-fit: contain; background: transparent; mix-blend-mode: multiply;" onerror="this.style.display='none'; this.parentNode.innerHTML='<p style=\'margin: 0; font-weight: bold; font-size: 16px;\'>${business.name || 'KIOT LOGO'}</p>';" />`
      : `<p style="margin: 0; font-weight: bold; font-size: 22px;">${business.name || 'KIOT LOGO'}</p>`;

    // Calculate dynamic content height
    const items = purchaseItem.saleSoItem || [];
    const itemRows = items.length;
    const additionalRows = 3; // For tax, discount, shipping rows
    const totalTableRows = itemRows + additionalRows;
    
    // Calculate space needed for the table
    const rowHeight = 24; // Approximate height per row in pixels
    const tableHeight = Math.max(150, totalTableRows * rowHeight); // Minimum 150px
    
    // Calculate remaining space for footer
    const pageHeight = 1123; // A4 height in pixels (297mm ≈ 1123px at 96dpi)
    const headerHeight = 200; // Approximate height of header sections
    const footerHeight = 220; // Approximate height of footer section
    const tableSpace = pageHeight - headerHeight - footerHeight - 50; // 50px buffer
    
    // Adjust empty rows based on available space
    const emptyRowsNeeded = Math.max(0, Math.floor((tableSpace - (itemRows * rowHeight)) / rowHeight));
    const maxEmptyRows = 10; // Limit maximum empty rows

    const invoiceContent = `
      <html>
        <head>
          <style>
            @page {
              size: A4;
              margin: 10mm;
            }
            
            body { 
              font-family: Arial, sans-serif; 
              margin: 0;
              padding: 10px;
              color: #333; 
              font-size: 12px;
              background: white !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .invoice-container {
              border: 1px solid #000;
              padding: 15px;
              box-sizing: border-box;
              min-height: 98vh; /* Use viewport height instead of fixed */
              display: flex;
              flex-direction: column;
            }
            
            @media print {
              body {
                margin: 0;
                padding: 0;
                background: white !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .invoice-container {
                border: 1px solid #000;
                padding: 15px;
                margin: 0;
                min-height: 98vh;
              }
              * {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
            
            .invoice-header { 
              display: flex; 
              justify-content: space-between; 
              align-items: center; 
              font-size: 12px; 
              line-height: 1.15;
              flex-shrink: 0;
            }
            .company-info { text-align: left; }
            .company-logo { 
              width: 180px; 
              height: 70px; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              text-align: center; 
              overflow: hidden; 
              background: transparent !important;
            }
            
            .header-section {
              margin-left: 10px; 
              padding-bottom: 9px;
              flex-shrink: 0;
            }
            
            .header-section h3 {
              font-size: 14px; 
              margin: 6px 0;
            }
            
            .header-section p {
              margin: 2px 0; 
              display: flex;
            }
            
            .header-section strong {
              min-width: 92px; 
              font-size: 12px;
            }
            
            .customer-details-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
              border: 1px solid #333;
              flex-shrink: 0;
            }
            
            .customer-details-table th {
              background-color: #f2f2f2;
              padding: 6px;
              text-align: left;
              border-bottom: 1px solid #333;
              font-size: 13px;
            }
            
            .customer-details-table td {
              padding: 4px 6px;
              vertical-align: top;
              font-size: 11px;
            }
            
            .customer-left-col {
              width: 50%;
              border-right: 1px solid #333;
              padding-right: 10px;
            }
            
            .customer-right-col {
              width: 50%;
              padding-left: 10px;
            }
            
            .items-section {
              margin-top: 15px;
              flex: 1; /* Take remaining space */
              display: flex;
              flex-direction: column;
            }
            
            .items-table-container {
              border: 1px solid #000;
              border-top: none;
              flex: 1;
              min-height: ${tableHeight}px;
              display: flex;
              flex-direction: column;
            }
            
            .items-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
              margin: 0;
              flex: 1;
            }
            
            .items-table thead {
              display: table-header-group;
            }
            
            .items-table tbody {
              display: table-row-group;
            }
            
            .items-table th {
              background-color: #f2f2f2;
              font-weight: bold;
              padding: 6px 4px;
              border-left: 1px solid #000;
              border-right: 1px solid #000;
              border-top: 1px solid #000;
              text-align: center;
              font-size: 12px;
              page-break-inside: avoid;
            }
            
            .items-table th:first-child {
              border-left: 1px solid #000;
            }
            
            .items-table th:last-child {
              border-right: 1px solid #000;
            }
            
            .items-table td {
              padding: 5px 4px;
              border-left: 1px solid #000;
              border-right: 1px solid #000;
              text-align: center;
              vertical-align: middle;
              page-break-inside: avoid;
            }
            
            .items-table tr {
              break-inside: avoid;
              page-break-inside: avoid;
            }
            
            .summary-section {
              margin-top: 10px;
              font-size: 12px;
              flex-shrink: 0;
              page-break-inside: avoid;
            }
            
            .amount-words {
              background-color: #f9f9f9;
              padding: 8px;
              border: 1px solid #000;
              margin-bottom: 8px;
              font-size: 11px;
              page-break-inside: avoid;
            }
            
            .footer-container {
              margin-top: auto; /* Push to bottom */
              flex-shrink: 0;
              page-break-inside: avoid;
            }
            
            .footer-section {
              display: flex;
              margin-top: 10px;
              font-size: 11px;
              page-break-before: avoid;
              page-break-inside: avoid;
            }
            
            .footer-left {
              flex: 1;
              padding: 8px;
              border: 1px solid #000;
              border-right: none;
              page-break-inside: avoid;
            }
            
            .footer-right {
              flex: 1;
              padding: 8px;
              border: 1px solid #000;
              page-break-inside: avoid;
            }
            
            .footer-section h4 {
              margin: 0 0 5px 0;
              font-size: 12px;
              font-weight: bold;
            }
            
            .signature {
              margin-top: 20px;
              text-align: right;
              font-size: 12px;
            }
            
            .signature div {
              margin-top: 30px;
            }
            
            .title {
              text-align: center;
              font-size: 21px;
              font-weight: bold;
              margin: 9px 0;
              flex-shrink: 0;
            }
            
            .total-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
              font-size: 11px;
            }
            
            .total-table td {
              padding: 5px;
              text-align: right;
            }
            
            .total-table tr:last-child {
              font-weight: bold;
              border-top: 1px solid #000;
            }
            
            img {
              background: transparent !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            /* Ensure no page breaks inside critical sections */
            .invoice-header,
            .customer-details-table,
            .title {
              page-break-inside: avoid;
            }
          </style>
        </head>
        <body style="background: white !important;">
          <div class="invoice-container">
            <div class="title">Quotation</div>
            
            <div class="invoice-header">
              <div class="company-info">
                <h2 style="margin: 0; margin-left: 10px; font-size: 17px;">${business.name || 'Kiot Innovations Pvt Ltd'}</h2>
                <p style="margin: 2px 0; margin-left: 10px; font-size: 13px;">${business.address || 'Power Innovation'}</p>
              </div>
              <div class="company-logo" style="background: transparent !important;">
                ${logoHtml}
              </div>
            </div>
            
            <div class="header-section">
              <div class="invoice-header">
                <div style="width: 50%;">
                  <h3>Invoice Details</h3>
                  <p>
                    <strong>Invoice No:</strong> ${purchaseItem.orderId || "N/A"}
                  </p>
                  <p>
                    <strong>Invoice Date:</strong> ${purchaseItem.saleDate || purchaseItem.orderDate || "N/A"}
                  </p>
                  <p>
                    <strong>Customer:</strong> ${customer.firstname || purchaseItem.orderedBy || purchaseItem.franchise || "N/A"}
                  </p>
                  <p>
                    <strong>Reference No:</strong> ${purchaseItem.referenceNumber || "N/A"}
                  </p>
                  <p>
                    <strong>Location:</strong> ${purchaseItem.location || "N/A"}
                  </p>
                </div>
              </div>
            </div>
            
            <table class="customer-details-table">
              <tbody>
                <tr>
                  <td class="customer-left-col">
                    <div style="margin-bottom: 8px;">
                      <h4 style="margin: 0 0 4px 0; font-size: 13px; color: #333;">Business Details</h4>
                      <p style="margin: 2px 0; display: flex;">
                        <strong style="min-width: 100px; font-size: 11px;">Business Name:</strong> 
                        <span style="font-size: 11px;">${business.name || "N/A"}</span>
                      </p>
                      <p style="margin: 2px 0; display: flex;">
                        <strong style="min-width: 100px; font-size: 11px;">Address:</strong> 
                        <span style="font-size: 11px;">${business.address || "N/A"}</span>
                      </p>
                      <p style="margin: 2px 0; display: flex;">
                        <strong style="min-width: 100px; font-size: 11px;">Phone No:</strong> 
                        <span style="font-size: 11px;">${business.phoneNumber || "N/A"}</span>
                      </p>
                      <p style="margin: 2px 0; display: flex;">
                        <strong style="min-width: 100px; font-size: 11px;">GST No:</strong> 
                        <span style="font-size: 11px;">${business.taxOrGstNumber || "N/A"}</span>
                      </p>
                      <p style="margin: 2px 0; display: flex;">
                        <strong style="min-width: 100px; font-size: 11px;">Email:</strong> 
                        <span style="font-size: 11px;">${business.email || "N/A"}</span>
                      </p>
                    </div>
                  </td>
                  
                  <td class="customer-right-col">
                    <div style="margin-bottom: 8px;">
                      <h4 style="margin: 0 0 4px 0; font-size: 13px; color: #333;">Customer Details</h4>
                      <p style="margin: 2px 0; display: flex;">
                        <strong style="min-width: 90px; font-size: 11px;">Name</strong> 
                        <span style="font-size: 11px;">${customer.firstname || purchaseItem.orderedBy || purchaseItem.franchiseName || "N/A"}</span>
                      </p>
                      <p style="margin: 2px 0; display: flex;">
                        <strong style="min-width: 90px; font-size: 11px;">Address</strong> 
                        <span style="font-size: 11px;">${customer.permanentAddress || customer.currentAddress || purchaseItem.location || "N/A"}</span>
                      </p>
                      <p style="margin: 2px 0; display: flex;">
                        <strong style="min-width: 90px; font-size: 11px;">Number</strong> 
                        <span style="font-size: 11px;">${customer.mobileNumber || "N/A"}</span>
                      </p>
                      <p style="margin: 2px 0; display: flex;">
                        <strong style="min-width: 90px; font-size: 11px;">Email</strong> 
                        <span style="font-size: 11px;">${customer.email || purchaseItem.addedBy || "N/A"}</span>
                      </p>
                      <p style="margin: 2px 0; display: flex;">
                        <strong style="min-width: 90px; font-size: 11px;">GST No</strong> 
                        <span style="font-size: 11px;">${customer.taxOrGstNumber || "N/A"}</span>
                      </p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            
            <div class="items-section">
              <div class="items-table-container">
                <table class="items-table">
                  <thead>
                    <tr>
                      <th style="width: 5%;">Sr No</th>
                      <th style="width: 25%;">Description of Services</th>
                      <th style="width: 8%;">HSN/SAC</th>
                      <th style="width: 8%;">Quantity</th>
                      <th style="width: 12%;">Rate (Incl. Tax)</th>
                      <th style="width: 10%;">Rate</th>
                      <th style="width: 6%;">per</th>
                      <th style="width: 8%;">Disc. %</th>
                      <th style="width: 10%;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${(() => {
                      const rows = [];
                      
                      items.forEach((item, index) => {
                        const itemTotal = ((item.quantity || 0) * (item.unitSellingPrice || 0));
                        const itemDiscount = itemTotal * (item.discountPercent || 0) / 100;
                        const itemAfterDiscount = itemTotal - itemDiscount;
                        const itemTax = item.taxAmount || 0;
                        const rateInclTax = itemAfterDiscount + itemTax;
                        
                        rows.push(`
                          <tr>
                            <td>${index + 1}</td>
                            <td>${item.productName || "N/A"}</td>
                            <td>${item.hsnCode || item.productSku || "N/A"}</td>
                            <td>${item.quantity || "0"}</td>
                            <td>₹${rateInclTax.toFixed(2)}</td>
                            <td>₹${item.unitSellingPrice?.toFixed(2) || "0.00"}</td>
                            <td>Unit</td>
                            <td>${item.discountPercent || purchaseItem.discountPercentage || "0"}%</td>
                            <td style="text-align: right;">₹${itemTotal.toFixed(2)}</td>
                          </tr>
                        `);
                      });
                      
                      // Dynamically calculate empty rows based on available space
                      const actualEmptyRows = Math.min(emptyRowsNeeded, maxEmptyRows);
                      for (let i = 0; i < actualEmptyRows; i++) {
                        rows.push(`
                          <tr>
                            <td>${items.length + i + 1}</td>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                          </tr>
                        `);
                      }
                      
                      // Add tax row based on tax type
                      if (tax > 0) {
                        const taxType = purchaseItem.purchaseTax || "IGST";
                        rows.push(`
                          <tr>
                            <td colspan="8" style="text-align: right; font-weight: bold; border-top: 1px solid #333;">${taxType}</td>
                            <td style="text-align: right; border-top: 1px solid #333;">₹${tax.toFixed(2)}</td>
                          </tr>
                        `);
                      }
                      
                      // Add overall discount row if exists
                      if (discount > 0) {
                        rows.push(`
                          <tr>
                            <td colspan="8" style="text-align: right; font-weight: bold; border-top: 1px solid #333;">Overall Discount</td>
                            <td style="text-align: right; border-top: 1px solid #333;">- ₹${discount.toFixed(2)}</td>
                          </tr>
                        `);
                      }
                      
                      // Add shipping charges row if exists
                      if (shippingCharges > 0) {
                        rows.push(`
                          <tr>
                            <td colspan="8" style="text-align: right; font-weight: bold; border-top: 1px solid #333;">Shipping Charges</td>
                            <td style="text-align: right; border-top: 1px solid #333;">₹${shippingCharges.toFixed(2)}</td>
                          </tr>
                        `);
                      }
                      
                      // Add total row
                      rows.push(`
                        <tr>
                          <td colspan="8" style="text-align: right; font-weight: bold; border-top: 2px solid #000; font-size: 13px;">Total</td>
                          <td style="text-align: right; font-weight: bold; border-top: 2px solid #000; font-size: 13px;">₹${total.toFixed(2)}</td>
                        </tr>
                      `);
                      
                      return rows.join('');
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div class="footer-container">
              <div class="summary-section">
                <div class="amount-words">
                  <strong>Amount Chargeable (in words):</strong> INR ${numberToWords(total)}
                  <div style="text-align: right; font-style: italic;">E. & O.E</div>
                </div>
              </div>
              
              <div class="footer-section">
                <div class="footer-left">
                  <h4>Remarks:</h4>
                  ${purchaseItem.additionalNotes || `
                  INCOME TAX DECLARATION - NO TDS ON SOFTWARE SALE<br>
                  As per Govt of India (CBDT) Notification no.21/2012 [F.No. 142/10/2012-SO (TPL)][S.O.1323 (E ) dated 13-06-2012, NO TDS is to be deducted u/s 194-J<br>
                  We hereby declare that the software items supplied vide our invoice are :<br>
                  -Sold without any modifications<br>
                  -Tax has been deducted u/s 194J/195 on payment of Company's PAN : ${business.panNumber || 'AAHCK2249K'}
                  `}
                  
                  <div style="margin-top: 10px;">
                    <h4>Declaration</h4>
                    We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
                  </div>
                </div>
                
                <div class="footer-right">
                  <h4>Company's Bank Details</h4>
                  A/c Holder's Name : ${business.name || 'Fusion Masters Tech Innovations Pvt. Ltd.'}<br>
                  Bank Name : ${business.bankName || ''}<br>
                  A/c No. : ${business.accountNumber || ''}<br>
                  Branch & IFS Code : ${business.ifscCode || ''}
                  
                  <div class="signature">
                    <div>
                      <strong>for ${business.name || 'Fusion Masters Tech Innovations Pvt. Ltd.'}</strong><br>
                      Authorised Signatory
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  
    printWindow.document.write(invoiceContent);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 1000);
  };

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-12 col-md-6">
                <h1 className=" all-heading">List So Sale Entry</h1>
                <span className="d-inline d-md-block sub-heading">
                  Manage So Sale Entries
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="content">
          <div className="container-fluid">
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
                <Link to="/AddSoSale" className="btn btn-add">
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
                        {columnsVisibility.status && <th>Order Status</th>}
                        {columnsVisibility.purchasePoOrderId && (
                          <th>Order Id</th>
                        )}

                        {columnsVisibility.date && <th>Date</th>}
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
                      {purchase.map((purchaseItem) => (
                        <tr key={purchaseItem.id}>
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
                                  onClick={() => handleViewClick(purchaseItem.id)}
                                >
                                  <div className="d-inline-block w-75 btn-view justify-content-center text-secondary">
                                    <i className="dropdown_hover fa fa-eye me-3"></i>
                                    <span>View</span>
                                  </div>
                                </Dropdown.Item>

                                <Dropdown.Item
                                  as="button"
                                  onClick={() => handleEditClick(purchaseItem.id)}
                                >
                                  <div className="d-inline-block w-75 btn-edit justify-content-center text-secondary">
                                    <i className="dropdown_hover fa-solid fa-pen-to-square me-3"></i>
                                    <span>Edit</span>
                                  </div>
                                </Dropdown.Item>
                                <Dropdown.Item
                                  as="button"
                                  onClick={() =>
                                    handleDeleteClick(
                                      purchaseItem.id,
                                      purchaseItem.orderId
                                    )
                                  }
                                >
                                  <div className="d-inline-block w-75 btn-delete justify-content-center text-secondary">
                                    <i className="fa fa-trash me-3"></i>
                                    <span>Delete</span>
                                  </div>
                                </Dropdown.Item>

                                <Dropdown.Item
                                  as="button"
                                  onClick={() => handlePrintInvoice(purchaseItem)}
                                >
                                  <div className="d-inline-block w-100 btn-print justify-content-center text-secondary">
                                    <i className="fa fa-print me-3"></i>
                                    <span>Print Invoice</span>
                                  </div>
                                </Dropdown.Item>
                              </DropdownButton>
                            </td>
                          )}
                          {columnsVisibility.status && (
                            <td>
                              {purchaseItem.status === 1
                                ? "Ordered"
                                : purchaseItem.status === 2
                                ? "Pending"
                                : purchaseItem.status === 3
                                ? "Received"
                                : "Unknown"}
                            </td>
                          )}
                          {columnsVisibility.purchasePoOrderId && (
                            <td>{purchaseItem.orderId}</td>
                          )}

                          {columnsVisibility.date && (
                            <td>{purchaseItem.orderDate}</td>
                          )}
                          {columnsVisibility.referenceNumber && (
                            <td>{purchaseItem.referenceNumber}</td>
                          )}
                          {columnsVisibility.franchiseName && (
                            <td>{purchaseItem.franchise}</td>
                          )}
                          {columnsVisibility.city && <td>{purchaseItem.city}</td>}
                          {columnsVisibility.state && <td>{purchaseItem.state}</td>}
                          {columnsVisibility.totalItems && (
                            <td>{purchaseItem.totalItems}</td>
                          )}
                          {columnsVisibility.netTotalAmount && (
                            <td>{purchaseItem.netTotalAmount}</td>
                          )}
                          {columnsVisibility.additionalNotes && (
                            <td>{purchaseItem.additionalNotes}</td>
                          )}
                          {columnsVisibility.addedBy && (
                            <td>{purchaseItem.addedBy}</td>
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

export default ListSoSale;