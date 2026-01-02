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
import { useNavigate } from "react-router-dom";
import { Dropdown, DropdownButton, Collapse } from "react-bootstrap";
import { toast } from "react-toastify";

const AllSale = () => {
  const [viewOrders, setViewOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [userEmail, setUserEmail] = useState(null);
  const navigate = useNavigate();
  const [columnsVisibility, setColumnsVisibility] = useState({
    action: true,
    orderDate: true,
    orderId: true,
    referenceNumber: true,
    netTotalAmount: true,
    city: true,
    state: true,
    location: true,
    franchise: true,
    totalItems: true,
    additionalNotes: true,
    orderedBy: true,
    addedBy: true,
  });
  const [modalType, setModalType] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [formData, setFormData] = useState({
    orderId: "",
    orderDate: "",
    franchise: "",
    totalQuantityOrdered: "",
    customerAddress: "",
    contactInformation: "",
    custom1: "",
  });
  const [filterOpen, setFilterOpen] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    businessLocation: "",
    customer: "",
    paymentStatus: "",
    dateRange: "",
    user: "",
    shippingStatus: "",
    subscriptions: "all",
    paymentMethod: "",
    sources: "all",
  });

  // Sample data for dropdowns
  const businessLocations = ["Rajastan", "Mumbai", "Delhi", "Bangalore"];
  const customers = ["Customer A", "Customer B", "Customer C"];
  const paymentStatuses = ["Paid", "Unpaid", "Partially Paid"];
  const users = ["User 1", "User 2", "Admin", "rohit1"];
  const shippingStatuses = ["Shipped", "Pending", "Delivered"];
  const paymentMethods = ["Cash", "Credit Card", "Bank Transfer"];
  const sources = ["Online", "Offline", "Phone"];

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const applyFilters = () => {
    let filtered = [...viewOrders];

    if (filters.businessLocation) {
      filtered = filtered.filter((order) =>
        order.location
          ?.toLowerCase()
          .includes(filters.businessLocation.toLowerCase())
      );
    }

    if (filters.customer) {
      filtered = filtered.filter((order) =>
        order.customer?.toLowerCase().includes(filters.customer.toLowerCase())
      );
    }

    if (filters.paymentStatus) {
      filtered = filtered.filter((order) => {
        if (filters.paymentStatus === "Paid") {
          return order.transaction?.some(
            (t) => t.amount >= order.netTotalAmount
          );
        } else if (filters.paymentStatus === "Unpaid") {
          return !order.transaction || order.transaction.length === 0;
        } else if (filters.paymentStatus === "Partially Paid") {
          return order.transaction?.some(
            (t) => t.amount > 0 && t.amount < order.netTotalAmount
          );
        }
        return true;
      });
    }

    if (filters.user) {
      filtered = filtered.filter((order) =>
        order.addedBy?.toLowerCase().includes(filters.user.toLowerCase())
      );
    }

    if (filters.shippingStatus) {
      filtered = filtered.filter((order) => {
        if (filters.shippingStatus === "Shipped") {
          return order.shippingSaleDIDetails?.some(
            (s) => s.status === "Shipped"
          );
        } else if (filters.shippingStatus === "Pending") {
          return (
            !order.shippingSaleDIDetails ||
            order.shippingSaleDIDetails.every((s) => s.status !== "Shipped")
          );
        } else if (filters.shippingStatus === "Delivered") {
          return order.shippingSaleDIDetails?.some(
            (s) => s.status === "Delivered"
          );
        }
        return true;
      });
    }

    if (filters.paymentMethod) {
      filtered = filtered.filter((order) =>
        order.transaction?.some((t) =>
          t.paymentMethod
            ?.toLowerCase()
            .includes(filters.paymentMethod.toLowerCase())
        )
      );
    }

    if (filters.sources && filters.sources !== "all") {
      filtered = filtered.filter(
        (order) => order.source?.toLowerCase() === filters.sources.toLowerCase()
      );
    }

    setFilteredOrders(filtered);
    setCurrentPage(1);
    setFilterOpen(false);
  };

  const resetFilters = () => {
    setFilters({
      businessLocation: "",
      customer: "",
      paymentStatus: "",
      dateRange: "",
      user: "",
      shippingStatus: "",
      subscriptions: "all",
      paymentMethod: "",
      sources: "all",
    });
    setFilteredOrders(viewOrders);
    setCurrentPage(1);
  };

  useEffect(() => {
    const email = sessionStorage.getItem("userEmail");
    if (email) {
      setUserEmail(email);
    }
    const fetchPendingOrders = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BASE_URL}/combined-orders/getall`
        );
        if (!response.ok) throw new Error("Network response was not ok");

        const data = await response.json();

        if (!Array.isArray(data)) {
          console.error("Fetched data is not an array");
          setViewOrders([]);
          setFilteredOrders([]);
          return;
        }

        // Fetch customer city/state for each order
        const enrichedOrders = await Promise.all(
          data.map(async (order) => {
            try {
              if (!order.customerId) {
                throw new Error("No customerId found");
              }

              const customerRes = await fetch(
                `${process.env.REACT_APP_BASE_URL}/customer/${order.customerId}`
              );

              if (!customerRes.ok) throw new Error("Customer not found");

              const customer = await customerRes.json();

              return {
                ...order,
                city: customer.city || "",
                state: customer.state || "",
                franchiseName: customer.franchiseName || "", // Optional
              };
            } catch (err) {
              console.error("Error fetching customer:", err);
              return {
                ...order,
                city: "N/A",
                state: "N/A",
                franchiseName: "N/A",
              };
            }
          })
        );

        setViewOrders(enrichedOrders);
        setFilteredOrders(enrichedOrders);
      } catch (error) {
        console.error("Error fetching pending orders:", error);
        setViewOrders([]);
        setFilteredOrders([]);
      }

      // Append script
      const script = document.createElement("script");
      script.src = "js/JqueryContent.js";
      script.async = true;
      document.body.appendChild(script);

      // Cleanup
      return () => {
        document.body.removeChild(script);
      };
    };

    fetchPendingOrders();
  }, []);

  const handleEditClick = (id, orderId) => {
    if (orderId) {
      navigate(`/EditSoSale/${id}`);
    } else {
      navigate(`/EditDISale/${id}`);
    }
  };

  const handleViewClick = (id, orderId) => {
    if (orderId) {
      navigate(`/ViewSoSale/${id}`);
    } else {
      navigate(`/ViewDISale/${id}`);
    }
  };

  const handleDeleteClick = (id) => {};

  const exportCSV = () => {
    const csvData = filteredOrders.map((order) => ({
      Action: order.action,
      "Order ID": order.orderId,
      "Reference Number": order.referenceNumber,
      Location: order.location,
      franchise: order.franchise,
      "Total Items": order.totalItems,
      "Additional Notes": order.additionalNotes,
      "Ordered By": order.orderedBy,
      "Added By": order.addedBy,
    }));

    const csv = [
      [
        "Vendor Action",
        "Action",
        "Order ID",
        "Reference Number",
        "Location",
        "Franchise",
        "Total Items",
        "Additional Notes",
        "Ordered By",
      ],
      ...csvData.map((row) => Object.values(row)),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, "orders.csv");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredOrders.map((order) => ({
        Action: order.action,
        "Order ID": order.orderId,
        "Reference Number": order.referenceNumber,
        Location: order.location,
        franchise: order.franchise,
        "Total Items": order.totalItems,
        "Additional Notes": order.additionalNotes,
        "Ordered By": order.orderedBy,
        "Added By": order.addedBy,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, "orders.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [
        [
          "Vendor Action",
          "Action",
          "Order ID",
          "Reference Number",
          "Location",
          "franchise",
          "Total Items",
          "Additional Notes",
          "Ordered By",
        ],
      ],
      body: filteredOrders.map((order) => [
        order.action,
        order.orderId,
        order.referenceNumber,
        order.location,
        order.franchise,
        order.totalItems,
        order.additionalNotes,
        order.orderedBy,
        order.addedBy,
      ]),
    });
    doc.save("orders.pdf");
  };

  const printData = () => {
    const tableContainer = document.getElementById("table-container");
    const clonedContainer = tableContainer.cloneNode(true);
    const $clonedContainer = $(clonedContainer);

    $clonedContainer.find(".dataTables_filter").remove();
    $clonedContainer.find(".dataTables_paginate").remove();
    $clonedContainer.find(".dataTables_info").remove();
    $clonedContainer.find("td button").remove();

    const printWindow = window.open("", "", "height=800,width=1200");
    printWindow.document.write("<html><head><title>Print</title>");
    printWindow.document.write(
      '<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">'
    );
    printWindow.document.write("</head><body>");
    printWindow.document.write($clonedContainer.html());
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const toggleColumn = (column) => {
    setColumnsVisibility((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
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

  const handleDropdownItemClick = (col, e) => {
    e.stopPropagation();
    toggleColumn(col);
  };

  const handlePrintInvoice = (order) => {
    const printWindow = window.open("", "_blank", "width=800,height=900");

    // Calculate values based on your order data structure
    const subtotal =
      order.saleSoItem?.reduce(
        (sum, item) => sum + item.quantity * item.unitSellingPrice,
        0
      ) || 0;
    const tax = order.taxAmount || 0;
    const discount = order.discountAmount || 0;
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
                    order.orderId || "N/A"
                  }
                </p>
                <p style="margin: 2px 0; display: flex;">
                  <strong style="min-width: 110px;">Invoice Date:</strong>: ${
                    order.saleDate || "N/A"
                  }
                </p>
                <p style="margin: 2px 0; display: flex;">
                  <strong style="min-width: 110px;">Customer:</strong>: ${
                    order.orderedBy || "N/A"
                  }
                </p>
                <p style="margin: 2px 0; display: flex;">
                  <strong style="min-width: 110px;">Reference No:</strong>: ${
                    order.referenceNumber || "N/A"
                  }
                </p>
                <p style="margin: 2px 0; display: flex;">
                  <strong style="min-width: 110px;">Location:</strong>: ${
                    order.location || "N/A"
                  }
                </p>
              </div>
            </div>
          </div>
  
          <div class="customer_detail">
            <div>
              <h3 style="font-size: 14px;">Business Details</h3>
              <p style="margin: 2px 0; display: flex;"><strong style="min-width: 110px;">Franchise Name</strong>: ${
                order.franchise || "FUMA"
              }</p>
              <p style="margin: 2px 0; display: flex;"><strong style="min-width: 110px;">Address:</strong>: ${
                order.location || "N/A"
              }</p>
              <p style="margin: 2px 0; display: flex;"><strong style="min-width: 110px;">Phone No:</strong>: N/A</p>
              <p style="margin: 2px 0; display: flex;"><strong style="min-width: 110px;">GST No:</strong>: N/A</p>
              <p style="margin: 2px 0; display: flex;"><strong style="min-width: 110px;">Email:</strong>: ${
                order.addedBy || "N/A"
              }</p>
            </div>
            <div>
              <h3 style="font-size: 14px;">Customer Details</h3>
              <p style="margin: 2px 0; display: flex;"><strong style="min-width: 90px;">Name:</strong>: ${
                order.orderedBy || "N/A"
              }</p>
              <p style="margin: 2px 0; display: flex;"><strong style="min-width: 90px;">Address:</strong>: ${
                order.location || "N/A"
              }</p>
              <p style="margin: 2px 0; display: flex;"><strong style="min-width: 90px;">Number:</strong>: N/A</p>
              <p style="margin: 2px 0; display: flex;"><strong style="min-width: 90px;">Email:</strong>: ${
                order.addedBy || "N/A"
              }</p>
              <p style="margin: 2px 0; display: flex;"><strong style="min-width: 90px;">Reference:</strong>: ${
                order.referenceNumber || "N/A"
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
              ${order.saleSoItem
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
                  <td style="padding: 3px;">${order.discountAmount || "0"}</td>
                  <td style="padding: 3px;">${order.taxAmount || "0"}</td>
                </tr>
              `
                )
                .join("")}
              
              ${(() => {
                const emptyRows = [];
                const itemCount = order.saleSoItem?.length || 0;
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
              <p>${order.additionalNotes || "No additional notes."}</p>
            </div>
  
            <div class="total-box">
              <table style="width:100%">
                <tr><td>Subtotal:</td><td>₹${subtotal.toFixed(2)}</td></tr>
                <tr><td>SGST :</td><td>${
                  order.taxRate?.toFixed(2) || "0.00"
                }</td></tr>
                <tr><td>IGST:</td><td>₹${tax.toFixed(2)}</td></tr>
                <tr><td>Payment Term:</td><td>${order.payTermNumber || "N/A"} ${
      order.payTermType || ""
    }</td></tr>
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
                order.location ||
                "Opposite to Padamji Papermill/pune, india, ST, 00000"
              }<br>
              Tel: N/A | Email: ${order.addedBy || "nanasaheb.k@fuma.co.in"}<br>
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
                <h1 className="all-heading">All Sale Orders</h1>
                <span className="d-inline d-md-block sub-heading">
                  Manage Sale Orders
                </span>
              </div>
            </div>
          </div>
        </section>
        <section className="content">
          <div className="container-fluid">
            <div className="row mb-3">
              {/* <div className="col-12">
                <button
                  className="btn-icon-only btn-light p-3 mb-4 fw-bold bg-transparent filter_color"
                  onClick={() => setFilterOpen(!filterOpen)}
                  style={{
                    color: "#78b833",
                    border: "none",
                    transition: "background-color 0.3s ease",
                  }}
                >
                  <i className="fa fa-filter me-3"></i>
                  Filter
                </button>
                
                <Collapse in={filterOpen}>
                  <div className="card card-body mb-4 rounded-4 border-0 shadow">
                    <div className="row">
                      <div className="col-md-3">
                        <div className="form-group">
                          <label>Business Location</label>
                          <select
                            className="form-control"
                            name="businessLocation"
                            value={filters.businessLocation}
                            onChange={handleFilterChange}
                          >
                            <option value="">All Locations</option>
                            {businessLocations.map((location) => (
                              <option key={location} value={location}>
                                {location}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="form-group">
                          <label>Customer</label>
                          <select
                            className="form-control"
                            name="customer"
                            value={filters.customer}
                            onChange={handleFilterChange}
                          >
                            <option value="">All Customers</option>
                            {customers.map((customer) => (
                              <option key={customer} value={customer}>
                                {customer}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="form-group">
                          <label>Payment Status</label>
                          <select
                            className="form-control"
                            name="paymentStatus"
                            value={filters.paymentStatus}
                            onChange={handleFilterChange}
                          >
                            <option value="">All Statuses</option>
                            {paymentStatuses.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="form-group">
                          <label>Date Range</label>
                          <input
                            type="date"
                            className="form-control"
                            name="dateRange"
                            value={filters.dateRange}
                            onChange={handleFilterChange}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="row mt-3">
                      <div className="col-md-3">
                        <div className="form-group">
                          <label>User</label>
                          <select
                            className="form-control"
                            name="user"
                            value={filters.user}
                            onChange={handleFilterChange}
                          >
                            <option value="">All Users</option>
                            {users.map((user) => (
                              <option key={user} value={user}>
                                {user}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="form-group">
                          <label>Shipping Status</label>
                          <select
                            className="form-control"
                            name="shippingStatus"
                            value={filters.shippingStatus}
                            onChange={handleFilterChange}
                          >
                            <option value="">All Statuses</option>
                            {shippingStatuses.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="form-group">
                          <label>Payment Method</label>
                          <select
                            className="form-control"
                            name="paymentMethod"
                            value={filters.paymentMethod}
                            onChange={handleFilterChange}
                          >
                            <option value="">All Methods</option>
                            {paymentMethods.map((method) => (
                              <option key={method} value={method}>
                                {method}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="form-group">
                          <label>Sources</label>
                          <select
                            className="form-control"
                            name="sources"
                            value={filters.sources}
                            onChange={handleFilterChange}
                          >
                            <option value="all">All Sources</option>
                            {sources.map((source) => (
                              <option key={source} value={source}>
                                {source}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="row mt-3">
                      <div className="col-md-12 d-flex justify-content-end">
                        <button
                          className="btn btn-secondary mr-2"
                          onClick={resetFilters}
                        >
                          Reset
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={applyFilters}
                        >
                          Apply Filters
                        </button>
                      </div>
                    </div>
                  </div>
                </Collapse>
              </div> */}
            </div>

            <div className="card cardHover rounded-4 border-0">
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
                        className="dropdown-menu"
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
                            <span
                              className="btn border-0 bg-transparent p-0 m-0"
                              onClick={(e) => handleDropdownItemClick(col, e)}
                            >
                              {col.replace(/([A-Z])/g, " $1").toUpperCase()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div id="table-container" style={{ overflowX: "auto" }}>
                  <table
                    id="example1"
                    className="table table-bordered table-hover shadow"
                  >
                    <thead>
                      <tr>
                        {columnsVisibility.action && <th>Action</th>}
                        {columnsVisibility.orderId && <th>Order ID</th>}

                        {columnsVisibility.orderDate && <th>Sale Date</th>}
                        {columnsVisibility.referenceNumber && (
                          <th>Invoice No</th>
                        )}
                        {columnsVisibility.franchise && <th>Franchise Name</th>}

                        {columnsVisibility.city && <th>City</th>}
                        {columnsVisibility.state && <th>State</th>}
                        {columnsVisibility.totalItems && (
                          <th>Total Sold Qty</th>
                        )}
                        {columnsVisibility.netTotalAmount && (
                          <th>Total Amount</th>
                        )}

                        {columnsVisibility.additionalNotes && <th>Note</th>}

                        {columnsVisibility.addedBy && <th>Added By</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders
                        .slice(startIndex, endIndex)
                        .map((order) => (
                          <tr key={order.orderId || order.id}>
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
                                    onClick={() =>
                                      handleViewClick(order.id, order.orderId)
                                    }
                                  >
                                    <div className="d-inline-block w-75 btn-view justify-content-center text-secondary">
                                      <i className="dropdown_hover fa fa-eye me-3"></i>
                                      <span>View</span>
                                    </div>
                                  </Dropdown.Item>

                                  <Dropdown.Item
                                    as="button"
                                    onClick={() =>
                                      handleEditClick(order.id, order.orderId)
                                    }
                                  >
                                    <div className="d-inline-block w-75 btn-edit justify-content-center text-secondary">
                                      <i className="dropdown_hover fa-solid fa-pen-to-square me-3"></i>
                                      <span>Edit</span>
                                    </div>
                                  </Dropdown.Item>

                                  <Dropdown.Item
                                    as="button"
                                    onClick={() => handleDeleteClick(order.id)}
                                  >
                                    <div className="d-inline-block w-75 btn-delete justify-content-center text-secondary">
                                      <i className="fa fa-trash me-3"></i>
                                      <span>Delete</span>
                                    </div>
                                  </Dropdown.Item>
                                  <Dropdown.Item
                                    as="button"
                                    onClick={() => handlePrintInvoice(order)}
                                  >
                                    <div className="d-inline-block w-100 btn-print justify-content-center text-secondary">
                                      <i className="fa fa-print me-3"></i>
                                      <span>Print Invoice</span>
                                    </div>
                                  </Dropdown.Item>
                                </DropdownButton>
                              </td>
                            )}
                            {columnsVisibility.orderDate && (
                              <td>{order.orderDate || order.saleDate}</td>
                            )}
                            {columnsVisibility.orderId && (
                              <td>{order.orderId || order.saleDIOrderId}</td>
                            )}
                            {columnsVisibility.referenceNumber && (
                              <td>{order.referenceNumber}</td>
                            )}

                            {columnsVisibility.franchise && (
                              <td>{order.franchiseName}</td>
                            )}
                            {columnsVisibility.city && <td>{order.city}</td>}
                            {columnsVisibility.state && <td>{order.state}</td>}
                            {columnsVisibility.totalItems && (
                              <td>{order.totalItems}</td>
                            )}

                            {columnsVisibility.netTotalAmount && (
                              <td>{order.netTotalAmount}</td>
                            )}
                            {columnsVisibility.additionalNotes && (
                              <td>{order.additionalNotes}</td>
                            )}
                            {columnsVisibility.addedBy && (
                              <td>{order.addedBy}</td>
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

        {modalType && (
          <div className="modal fade show" style={{ display: "block" }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {modalType === "view"
                      ? "View Order"
                      : modalType === "accept"
                      ? "Accept Order"
                      : "Reject Order"}
                  </h5>
                  <button
                    type="button"
                    className="close"
                    onClick={() => setModalType(null)}
                  >
                    <span>&times;</span>
                  </button>
                </div>
                <div className="modal-body">
                  {modalType === "view" && (
                    <div>
                      <h5>Order Details:</h5>
                      <p>Order ID: {currentOrder?.orderId}</p>
                      <p>Reference Number: {currentOrder?.referenceNumber}</p>
                      <p>Order Date: {currentOrder?.orderDate}</p>
                      <p>franchise: {currentOrder?.franchise}</p>
                      <p>Total Items: {currentOrder?.totalItems}</p>
                      <p>Location: {currentOrder?.location}</p>
                      <p>Ordered By: {currentOrder?.orderedBy}</p>
                      <p>Added By: {currentOrder?.addedBy}</p>

                      <p>Additional Notes: {currentOrder?.additionalNotes}</p>
                    </div>
                  )}
                  {modalType === "accept" && (
                    <div>Are you sure you want to accept this order?</div>
                  )}
                  {modalType === "reject" && (
                    <div>Are you sure you want to reject this order?</div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setModalType(null)}
                  >
                    Close
                  </button>
                  {(modalType === "accept" || modalType === "reject") && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setModalType(null)}
                    >
                      Confirm
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllSale;
