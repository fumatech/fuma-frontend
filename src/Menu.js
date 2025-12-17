import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "tempusdominus-bootstrap-4/build/css/tempusdominus-bootstrap-4.min.css";
import "icheck-bootstrap/icheck-bootstrap.min.css";
import "jqvmap/dist/jqvmap.min.css";
import "admin-lte/dist/css/adminlte.min.css";
import "daterangepicker/daterangepicker.css";
import "summernote/dist/summernote-bs4.min.css";

const Menu = ({ userRoles }) => {
  const location = useLocation();
  const [sideBarCollapsed, setSideBarCollapsed] = useState(true);
  const [activeMenu, setActiveMenu] = useState("");
  const [activeSubMenu, setActiveSubMenu] = useState("");

  // State for all dropdown menus
  const [isUserManagementOpen, setUserManagementOpen] = useState(false);
  const [isContactOpen, setContactOpen] = useState(false);
  const [isProductOpen, setProductOpen] = useState(false);
  const [isExtraOpen, setExtraOpen] = useState(false);
  const [isPurchaseOpen, setPurchaseOpen] = useState(false);
  const [isSellOpen, setSellOpen] = useState(false);
  const [isStockOpen, setStockOpen] = useState(false);
  const [isStockAdjustmentOpen, setStockAdjustmentOpen] = useState(false);
  const [isExpensesOpen, setExpensesOpen] = useState(false);
  const [isPaymentOpen, setPaymentOpen] = useState(false);
  const [isReportOpen, setReportOpen] = useState(false);
  const [isSettingOpen, setSettingOpen] = useState(false);
  const [isHomeOpen, setHomeOpen] = useState(false);

  useEffect(() => {
    const path = location.pathname;

    // Set active states based on current path
    setHomeOpen(path.startsWith("/Dashboard"));
    setUserManagementOpen(
      path.startsWith("/Users") || path.startsWith("/Roles")
    );
    setContactOpen(path.startsWith("/Vendor") || path.startsWith("/Customer"));
    setProductOpen(
      path.startsWith("/AddProducts") ||
        path.startsWith("/ListProducts") ||
        path.startsWith("/Categories") ||
        path.startsWith("/Brands") ||
        path.startsWith("/Variation") ||
        path.startsWith("/Units")
    );
    setExtraOpen(
      path.startsWith("/Permission") || path.startsWith("/ImageUpload")
    );
    setPurchaseOpen(
      path.startsWith("/PurchaseOrder") ||
        path.startsWith("/AddDIPurchase") ||
        path.startsWith("/AddPoPurchase") ||
        path.startsWith("/ReturnPurchase") ||
        path.startsWith("/ListDIPurchaseOrder") ||
        path.startsWith("/ListPoPurchaseOrder") ||
        path.startsWith("/ListPurchaseOrder")
    );
    setSellOpen(
      path.startsWith("/AddSoSale") ||
        path.startsWith("/AddDISale") ||
        path.startsWith("/ListSoSale") ||
        path.startsWith("/ListDISale") ||
        path.startsWith("/AllSaleOrders") ||
        path.startsWith("/ListAcceptedReturn") ||
        path.startsWith("/SaleReturn") ||
        path.startsWith("/SaleEntry") ||
        path.startsWith("/ListSaleEntry") ||
        path.startsWith("/SellReturn") ||
        path.startsWith("/ListShipReturn") ||
        path.startsWith("/ViewOrders") ||
        path.startsWith("/AcceptedOrders") ||
        path.startsWith("/ShipOrders") ||
        path.startsWith("/EditAcceptedOrder") ||
        path.startsWith("/RejectedOrders")
    );
    setStockOpen(
      path.startsWith("/AddStockTransfer") ||
        path.startsWith("/ListStockTransfer")
    );
    setStockAdjustmentOpen(
      path.startsWith("/AddStockAdjustment") ||
        path.startsWith("/ListStockAdjustment") ||
        path.startsWith("/AddWarrantyClaim") ||
        path.startsWith("/ListVendorWarrantyClaim") ||
        path.startsWith("/ListShippedWarrantyClaim") ||
        path.startsWith("/ListWarrantyClaim")
    );
    setExpensesOpen(
      path.startsWith("/AddExpense") ||
        path.startsWith("/ListExpense") ||
        path.startsWith("/ExpenseCategories")
    );
    setPaymentOpen(
      path.startsWith("/AccountBook") ||
        path.startsWith("/CashFlow") ||
        path.startsWith("/PaymentAccount") ||
        path.startsWith("/Accounts") ||
        path.startsWith("/PaymentReport") ||
        path.startsWith("/PaymentMethod") ||
        path.startsWith("/ListPaymentMethod") ||
        path.startsWith("/TrialBalance")
    );
    setReportOpen(
      path.startsWith("/PurchaseAndSale") ||
        path.startsWith("/CustomersAndSuppliers") ||
        path.startsWith("/ItemReport") ||
        path.startsWith("/ProductPurchaseReport") ||
        path.startsWith("/ProductSellReport") ||
        path.startsWith("/PurchasePaymentReport") ||
        path.startsWith("/SalePaymentReport") ||
        path.startsWith("/StockAdjustmentReport") ||
        path.startsWith("/StockReport") ||
        path.startsWith("/TaxReport")
    );
    setSettingOpen(
      path.startsWith("/TaxRate") || path.startsWith("/BusinessDetails")
    );

    // Set active menu based on current path
    if (path.startsWith("/Users") || path.startsWith("/Roles")) {
      setActiveMenu("userManagement");
    } else if (path.startsWith("/Vendor") || path.startsWith("/Customer")) {
      setActiveMenu("contact");
    } else if (
      path.startsWith("/AddProducts") ||
      path.startsWith("/ListProducts") ||
      path.startsWith("/Categories") ||
      path.startsWith("/Brands") ||
      path.startsWith("/Variation") ||
      path.startsWith("/Units")
    ) {
      setActiveMenu("product");
    } else if (
      path.startsWith("/Permission") ||
      path.startsWith("/ImageUpload")
    ) {
      setActiveMenu("extra");
    } else if (
      path.startsWith("/PurchaseOrder") ||
      path.startsWith("/AddDIPurchase") ||
      path.startsWith("/AddPoPurchase") ||
      path.startsWith("/ReturnPurchase") ||
      path.startsWith("/ListDIPurchaseOrder") ||
      path.startsWith("/ListPoPurchaseOrder") ||
      path.startsWith("/ListPurchaseOrder")
    ) {
      setActiveMenu("purchase");
    } else if (
      path.startsWith("/AddSoSale") ||
      path.startsWith("/AddDISale") ||
      path.startsWith("/ListSoSale") ||
      path.startsWith("/ListDISale") ||
      path.startsWith("/AllSaleOrders") ||
      path.startsWith("/ListAcceptedReturn") ||
      path.startsWith("/SaleReturn") ||
      path.startsWith("/SaleEntry") ||
      path.startsWith("/ListSaleEntry") ||
      path.startsWith("/SellReturn") ||
      path.startsWith("/ViewOrders") ||
      path.startsWith("/AcceptedOrders") ||
      path.startsWith("/ShipOrders") ||
      path.startsWith("/EditAcceptedOrder") ||
      path.startsWith("/RejectedOrders")
    ) {
      setActiveMenu("sell");
    } else if (
      path.startsWith("/AddStockTransfer") ||
      path.startsWith("/ListStockTransfer")
    ) {
      setActiveMenu("stock");
    } else if (
      path.startsWith("/AddStockAdjustment") ||
      path.startsWith("/ListStockAdjustment") ||
      path.startsWith("/AddWarrantyClaim") ||
      path.startsWith("/ListVendorWarrantyClaim") ||
      path.startsWith("/ListShippedWarrantyClaim") ||
      path.startsWith("/ListWarrantyClaim")
    ) {
      setActiveMenu("stockAdjustment");
    } else if (
      path.startsWith("/AddExpense") ||
      path.startsWith("/ListExpense") ||
      path.startsWith("/ExpenseCategories")
    ) {
      setActiveMenu("expenses");
    } else if (
      path.startsWith("/AccountBook") ||
      path.startsWith("/CashFlow") ||
      path.startsWith("/PaymentAccount") ||
      path.startsWith("/Accounts") ||
      path.startsWith("/PaymentReport") ||
      path.startsWith("/PaymentMethod") ||
      path.startsWith("/ListPaymentMethod") ||
      path.startsWith("/TrialBalance")
    ) {
      setActiveMenu("payment");
    } else if (
      path.startsWith("/PurchaseAndSale") ||
      path.startsWith("/CustomersAndSuppliers") ||
      path.startsWith("/ItemReport") ||
      path.startsWith("/ProductPurchaseReport") ||
      path.startsWith("/ProductSellReport") ||
      path.startsWith("/PurchasePaymentReport") ||
      path.startsWith("/SalePaymentReport") ||
      path.startsWith("/StockAdjustmentReport") ||
      path.startsWith("/StockReport") ||
      path.startsWith("/TaxReport")
    ) {
      setActiveMenu("report");
    } else if (path.startsWith("/TaxRate")) {
      setActiveMenu("setting");
    } else {
      setActiveMenu("");
    }

    // Set active submenu based on current path
    if (path === "/Users") {
      setActiveSubMenu("Users");
    } else if (path === "/Roles") {
      setActiveSubMenu("Roles");
    } else if (path === "/Vendor") {
      setActiveSubMenu("Vendor");
    } else if (path === "/Customer") {
      setActiveSubMenu("Customer");
    } else if (path === "/AddProducts") {
      setActiveSubMenu("AddProducts");
    } else if (path === "/ListProducts") {
      setActiveSubMenu("ListProducts");
    } else if (path === "/PrintLabel") {
      setActiveSubMenu("PrintLabel");
    } else if (path === "/Categories") {
      setActiveSubMenu("Categories");
    } else if (path === "/Brands") {
      setActiveSubMenu("Brands");
    } else if (path === "/Variation") {
      setActiveSubMenu("Variation");
    } else if (path === "/Units") {
      setActiveSubMenu("Units");
    } else if (path === "/Permission") {
      setActiveSubMenu("Permission");
    } else if (path === "/ImageUpload") {
      setActiveSubMenu("ImageUpload");
    } else if (path === "/PurchaseOrder") {
      setActiveSubMenu("PurchaseOrder");
    } else if (path === "/ListPurchaseOrder") {
      setActiveSubMenu("ListPurchaseOrder");
    } else if (path === "/AddPoPurchase") {
      setActiveSubMenu("AddPoPurchase");
    } else if (path === "/ListPoPurchaseOrder") {
      setActiveSubMenu("ListPoPurchaseOrder");
    } else if (path === "/AddDIPurchase") {
      setActiveSubMenu("AddDIPurchase");
    } else if (path === "/ListDIPurchaseOrder") {
      setActiveSubMenu("ListDIPurchaseOrder");
    } else if (path === "/ReturnPurchase") {
      setActiveSubMenu("ReturnPurchase");
    } else if (path === "/AddSoSale") {
      setActiveSubMenu("AddSoSale");
    } else if (path === "/ListSoSale") {
      setActiveSubMenu("ListSoSale");
    } else if (path === "/AddDISale") {
      setActiveSubMenu("AddDISale");
    } else if (path === "/ListDISale") {
      setActiveSubMenu("ListDISale");
    } else if (path === "/AllSaleOrders") {
      setActiveSubMenu("AllSaleOrders");
    } else if (path === "/SaleReturn") {
      setActiveSubMenu("SaleReturn");
    } else if (path === "/ListAcceptedReturn") {
      setActiveSubMenu("ListAcceptedReturn");
    } else if (path === "/ViewOrders") {
      setActiveSubMenu("ViewOrders");
    } else if (path === "/AcceptedOrders") {
      setActiveSubMenu("AcceptedOrders");
    } else if (path === "/RejectedOrders") {
      setActiveSubMenu("RejectedOrders");
    } else if (path === "/ShipOrders") {
      setActiveSubMenu("ShipOrders");
    } else if (path === "/ListStockTransfer") {
      setActiveSubMenu("ListStockTransfer");
    } else if (path === "/AddStockTransfer") {
      setActiveSubMenu("AddStockTransfer");
    } else if (path === "/AddStockAdjustment") {
      setActiveSubMenu("AddStockAdjustment");
    } else if (path === "/ListStockAdjustment") {
      setActiveSubMenu("ListStockAdjustment");
    } else if (path === "/ListWarrantyClaim") {
      setActiveSubMenu("ListWarrantyClaim");
    } else if (path === "/ListVendorWarrantyClaim") {
      setActiveSubMenu("ListVendorWarrantyClaim");
    } else if (path === "/ListShippedWarrantyClaim") {
      setActiveSubMenu("ListShippedWarrantyClaim");
    } else if (path === "/AddWarrantyClaim") {
      setActiveSubMenu("AddWarrantyClaim");
    } else if (path === "/ListExpense") {
      setActiveSubMenu("ListExpense");
    } else if (path === "/AddExpense") {
      setActiveSubMenu("AddExpense");
    } else if (path === "/ExpenseCategories") {
      setActiveSubMenu("ExpenseCategories");
    } else if (path === "/Accounts") {
      setActiveSubMenu("Accounts");
    } else if (path === "/TrialBalance") {
      setActiveSubMenu("TrialBalance");
    } else if (path === "/CashFlow") {
      setActiveSubMenu("CashFlow");
    } else if (path === "/PaymentReport") {
      setActiveSubMenu("PaymentReport");
    } else if (path === "/ListPaymentMethod") {
      setActiveSubMenu("ListPaymentMethod");
    } else if (path === "/PurchaseAndSale") {
      setActiveSubMenu("PurchaseAndSale");
    } else if (path === "/TaxReport") {
      setActiveSubMenu("TaxReport");
    } else if (path === "/CustomersAndSuppliers") {
      setActiveSubMenu("CustomersAndSuppliers");
    } else if (path === "/StockReport") {
      setActiveSubMenu("StockReport");
    } else if (path === "/StockAdjustmentReport") {
      setActiveSubMenu("StockAdjustmentReport");
    } else if (path === "/ItemReport") {
      setActiveSubMenu("ItemReport");
    } else if (path === "/ProductPurchaseReport") {
      setActiveSubMenu("ProductPurchaseReport");
    } else if (path === "/ProductSellReport") {
      setActiveSubMenu("ProductSellReport");
    } else if (path === "/PurchasePaymentReport") {
      setActiveSubMenu("PurchasePaymentReport");
    } else if (path === "/SalePaymentReport") {
      setActiveSubMenu("SalePaymentReport");
    } else if (path === "/TaxRate") {
      setActiveSubMenu("TaxRate");
    } else if (path === "/BusinessDetails") {
      setActiveSubMenu("BusinessDetails");
    } else {
      setActiveSubMenu("");
    }
  }, [location]);

  const toggleDropdown = (dropdown) => {
    // Close all other dropdowns when opening one
    setUserManagementOpen(
      dropdown === "userManagement" ? !isUserManagementOpen : false
    );
    setContactOpen(dropdown === "contact" ? !isContactOpen : false);
    setProductOpen(dropdown === "product" ? !isProductOpen : false);
    setExtraOpen(dropdown === "extra" ? !isExtraOpen : false);
    setPurchaseOpen(dropdown === "purchase" ? !isPurchaseOpen : false);
    setSellOpen(dropdown === "sell" ? !isSellOpen : false);
    setStockOpen(dropdown === "stock" ? !isStockOpen : false);
    setStockAdjustmentOpen(
      dropdown === "stockAdjustment" ? !isStockAdjustmentOpen : false
    );
    setExpensesOpen(dropdown === "expenses" ? !isExpensesOpen : false);
    setPaymentOpen(dropdown === "payment" ? !isPaymentOpen : false);
    setReportOpen(dropdown === "report" ? !isReportOpen : false);
    setSettingOpen(dropdown === "setting" ? !isSettingOpen : false);

    // Set active menu
    if (
      dropdown === "userManagement" ||
      dropdown === "contact" ||
      dropdown === "product" ||
      dropdown === "extra" ||
      dropdown === "purchase" ||
      dropdown === "sell" ||
      dropdown === "stock" ||
      dropdown === "stockAdjustment" ||
      dropdown === "expenses" ||
      dropdown === "payment" ||
      dropdown === "report" ||
      dropdown === "setting"
    ) {
      setActiveMenu(dropdown);
    }
  };

  const handleSidebarCollapse = () => {
    setSideBarCollapsed((prev) => !prev);
  };

  const getMenuItemClass = (menuName) => {
    return activeMenu === menuName ? "nav-link active" : "nav-link";
  };

  const getSubMenuItemClass = (subMenuName) => {
    return activeSubMenu === subMenuName ? "nav-link active" : "nav-link";
  };

  const hasPermission = (permissionName) => {
    return userRoles.some((role) =>
      role.permissions.some((permission) => permission.name === permissionName)
    );
  };

  return (
    <div>
      <aside
        className={`main-sidebar sidebar-elevation-1 sidebar menuSidebar p-0 ${
          sideBarCollapsed ? "sidebar-collapse" : ""
        }`}
        style={{ minHeight: "100vh" }}
      >
        <div className="sidebar p-0 ">
          <div
            className="user-panel d-flex align-content-center justify-content-center text-light"
            style={{
              position: "relative",
              top: 0,
              left: 0,
              width: "250px",
              backgroundColor: "", // optional: match your theme
              padding: "10px 0",
            }}
          >
            <div className="info">
              <h4>Fuma</h4>
            </div>
          </div>
          <nav className="mt-2">
            <ul
              className="nav nav-pills nav-sidebar flex-column"
              data-widget="treeview"
              role="menu"
            >
              <li className="nav-item">
                <Link
                  to="/Dashboard"
                  className="nav-link"
                  style={{
                    paddingLeft: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <i
                    className="fa-solid fa-house"
                    style={{
                      fontSize: "20px",
                      color: "black",
                      opacity: 0.7, // makes it look lighter
                    }}
                  ></i>
                  <p
                    style={{
                      color: "black",
                      opacity: 0.7, // makes it look lighter
                    }}
                  >
                    Dashboard
                  </p>
                </Link>
              </li>

              {/* User management */}
              {(hasPermission("user.add") ||
                hasPermission("user.view") ||
                hasPermission("user.delete") ||
                hasPermission("user.edit") ||
                hasPermission("roles.add") ||
                hasPermission("roles.view") ||
                hasPermission("roles.delete") ||
                hasPermission("roles.edit")) && (
                <li
                  className={`nav-item ${
                    activeMenu === "userManagement" ? "menu-open" : ""
                  } mb-2`}
                >
                  <a
                    href="#"
                    className={getMenuItemClass("userManagement")}
                    onClick={(e) => {
                      e.preventDefault();
                      toggleDropdown("userManagement");
                    }}
                    style={{
                      borderLeft:
                        activeMenu === "userManagement"
                          ? "3px solid #0040C1"
                          : "none",
                      backgroundColor:
                        activeMenu === "userManagement"
                          ? "rgba(0, 64, 193, 0.05)"
                          : "transparent",
                    }}
                  >
                    <i
                      className="nav-icon fas fa-user"
                      style={{
                        color:
                          activeMenu === "userManagement"
                            ? "#0040C1"
                            : "#4b5565",
                      }}
                    />
                    <p
                      style={{
                        color:
                          activeMenu === "userManagement"
                            ? "#0040C1"
                            : "#4b5565",
                      }}
                      className="ms-1"
                    >
                      User Management
                      <i
                        className="right fas fa-angle-left"
                        style={{
                          color:
                            activeMenu === "userManagement"
                              ? "#0040C1"
                              : "#4b5565",
                        }}
                      />
                    </p>
                  </a>
                  <ul
                    className="nav nav-treeview"
                    style={{
                      display: isUserManagementOpen ? "block" : "none",
                      backgroundColor:
                        activeMenu === "userManagement"
                          ? "rgba(0, 64, 193, 0.05)"
                          : "transparent",
                    }}
                  >
                    {(hasPermission("user.add") ||
                      hasPermission("user.view") ||
                      hasPermission("user.delete") ||
                      hasPermission("user.edit")) && (
                      <li className="nav-item">
                        <Link
                          to="/Users"
                          className={getSubMenuItemClass("Users")}
                          style={{
                            color:
                              activeSubMenu === "Users" ? "#0040C1" : "#4b5565",
                            backgroundColor:
                              activeSubMenu === "Users"
                                ? "rgba(0, 64, 193, 0.08)"
                                : "transparent",
                            paddingLeft: "52px",
                          }}
                        >
                          <p>User</p>
                        </Link>
                      </li>
                    )}
                    {(hasPermission("roles.add") ||
                      hasPermission("roles.view") ||
                      hasPermission("roles.delete") ||
                      hasPermission("roles.edit")) && (
                      <li className="nav-item">
                        <Link
                          to="/Roles"
                          className={getSubMenuItemClass("Roles")}
                          style={{
                            color:
                              activeSubMenu === "Roles" ? "#0040C1" : "#4b5565",
                            backgroundColor:
                              activeSubMenu === "Roles"
                                ? "rgba(0, 64, 193, 0.08)"
                                : "transparent",
                            paddingLeft: "52px",
                          }}
                        >
                          <p>Roles</p>
                        </Link>
                      </li>
                    )}
                  </ul>
                </li>
              )}

              {/* Contacts */}
              {(hasPermission("vendor.view") ||
                hasPermission("vendor.add") ||
                hasPermission("vendor.delete") ||
                hasPermission("vendor.edit") ||
                hasPermission("franchise.view") ||
                hasPermission("franchise.add") ||
                hasPermission("franchise.delete") ||
                hasPermission("franchise.edit")) && (
                <li
                  className={`nav-item ${
                    activeMenu === "contact" ? "menu-open" : ""
                  } mb-2`}
                >
                  <a
                    href="#"
                    className={getMenuItemClass("contact")}
                    onClick={(e) => {
                      e.preventDefault();
                      toggleDropdown("contact");
                    }}
                    style={{
                      borderLeft:
                        activeMenu === "contact" ? "3px solid #0040C1" : "none",
                      backgroundColor:
                        activeMenu === "contact"
                          ? "rgba(0, 64, 193, 0.05)"
                          : "transparent",
                    }}
                  >
                    <i
                      className="nav-icon fas fa-address-book"
                      style={{
                        color: activeMenu === "contact" ? "#0040C1" : "#4b5565",
                      }}
                    />
                    <p
                      style={{
                        color: activeMenu === "contact" ? "#0040C1" : "#4b5565",
                      }}
                      className="ms-1"
                    >
                      Contact
                      <i
                        className="right fas fa-angle-left"
                        style={{
                          color:
                            activeMenu === "contact" ? "#0040C1" : "#4b5565",
                        }}
                      />
                    </p>
                  </a>
                  <ul
                    className="nav nav-treeview"
                    style={{
                      display: isContactOpen ? "block" : "none",
                      backgroundColor:
                        activeMenu === "contact"
                          ? "rgba(0, 64, 193, 0.05)"
                          : "transparent",
                    }}
                  >
                    {(hasPermission("vendor.view") ||
                      hasPermission("vendor.add") ||
                      hasPermission("vendor.delete") ||
                      hasPermission("vendor.edit")) && (
                      <li className="nav-item">
                        <Link
                          to="/Vendor"
                          className={getSubMenuItemClass("Vendor")}
                          style={{
                            color:
                              activeSubMenu === "Vendor"
                                ? "#0040C1"
                                : "#4b5565",
                            backgroundColor:
                              activeSubMenu === "Vendor"
                                ? "rgba(0, 64, 193, 0.08)"
                                : "transparent",
                            paddingLeft: "52px",
                          }}
                        >
                          <p>Vendor</p>
                        </Link>
                      </li>
                    )}
                    {(hasPermission("franchise.view") ||
                      hasPermission("franchise.add") ||
                      hasPermission("franchise.delete") ||
                      hasPermission("franchise.edit")) && (
                      <li className="nav-item">
                        <Link
                          to="/Customer"
                          className={getSubMenuItemClass("Customer")}
                          style={{
                            color:
                              activeSubMenu === "Customer"
                                ? "#0040C1"
                                : "#4b5565",
                            backgroundColor:
                              activeSubMenu === "Customer"
                                ? "rgba(0, 64, 193, 0.08)"
                                : "transparent",
                            paddingLeft: "52px",
                          }}
                        >
                          <p>Franchise</p>
                        </Link>
                      </li>
                    )}
                  </ul>
                </li>
              )}

              {/* Product */}
              {(hasPermission("product.view") ||
                hasPermission("product.add") ||
                hasPermission("product.delete") ||
                hasPermission("product.edit")) && (
                <li
                  className={`nav-item ${
                    activeMenu === "product" ? "menu-open" : ""
                  } mb-2`}
                >
                  <a
                    href="#"
                    className={getMenuItemClass("product")}
                    onClick={(e) => {
                      e.preventDefault();
                      toggleDropdown("product");
                    }}
                    style={{
                      borderLeft:
                        activeMenu === "product" ? "3px solid #0040C1" : "none",
                      backgroundColor:
                        activeMenu === "product"
                          ? "rgba(0, 64, 193, 0.05)"
                          : "transparent",
                    }}
                  >
                    <i
                      className="nav-icon fas fa-box"
                      style={{
                        color: activeMenu === "product" ? "#0040C1" : "#4b5565",
                      }}
                    />
                    <p
                      style={{
                        color: activeMenu === "product" ? "#0040C1" : "#4b5565",
                      }}
                      className="ms-1"
                    >
                      Product
                      <i
                        className="right fas fa-angle-left"
                        style={{
                          color:
                            activeMenu === "product" ? "#0040C1" : "#4b5565",
                        }}
                      />
                    </p>
                  </a>
                  <ul
                    className="nav nav-treeview"
                    style={{
                      display: isProductOpen ? "block" : "none",
                      backgroundColor:
                        activeMenu === "product"
                          ? "rgba(0, 64, 193, 0.05)"
                          : "transparent",
                    }}
                  >
                    {(hasPermission("product.view") ||
                      hasPermission("product.add") ||
                      hasPermission("product.delete") ||
                      hasPermission("product.edit")) && (
                      <li className="nav-item">
                        <Link
                          to="/AddProducts"
                          className={getSubMenuItemClass("AddProducts")}
                          style={{
                            color:
                              activeSubMenu === "AddProducts"
                                ? "#0040C1"
                                : "#4b5565",
                            backgroundColor:
                              activeSubMenu === "AddProducts"
                                ? "rgba(0, 64, 193, 0.08)"
                                : "transparent",
                            paddingLeft: "52px",
                          }}
                        >
                          <p>Add Product</p>
                        </Link>
                      </li>
                    )}
                    {(hasPermission("product.view") ||
                      hasPermission("product.add") ||
                      hasPermission("product.delete") ||
                      hasPermission("product.edit")) && (
                      <li className="nav-item">
                        <Link
                          to="/ListProducts"
                          className={getSubMenuItemClass("ListProducts")}
                          style={{
                            color:
                              activeSubMenu === "ListProducts"
                                ? "#0040C1"
                                : "#4b5565",
                            backgroundColor:
                              activeSubMenu === "ListProducts"
                                ? "rgba(0, 64, 193, 0.08)"
                                : "transparent",
                            paddingLeft: "52px",
                          }}
                        >
                          <p>List Products</p>
                        </Link>
                      </li>
                    )}
                    {(hasPermission("category.view") ||
                      hasPermission("category.add") ||
                      hasPermission("category.delete") ||
                      hasPermission("category.edit")) && (
                      <li className="nav-item">
                        <Link
                          to="/PrintLabel"
                          className={getSubMenuItemClass("Categories")}
                          style={{
                            color:
                              activeSubMenu === "Categories"
                                ? "#0040C1"
                                : "#4b5565",
                            backgroundColor:
                              activeSubMenu === "Categories"
                                ? "rgba(0, 64, 193, 0.08)"
                                : "transparent",
                            paddingLeft: "52px",
                          }}
                        >
                          <p>Print Label</p>
                        </Link>
                      </li>
                    )}
                    {(hasPermission("category.view") ||
                      hasPermission("category.add") ||
                      hasPermission("category.delete") ||
                      hasPermission("category.edit")) && (
                      <li className="nav-item">
                        <Link
                          to="/Categories"
                          className={getSubMenuItemClass("Categories")}
                          style={{
                            color:
                              activeSubMenu === "Categories"
                                ? "#0040C1"
                                : "#4b5565",
                            backgroundColor:
                              activeSubMenu === "Categories"
                                ? "rgba(0, 64, 193, 0.08)"
                                : "transparent",
                            paddingLeft: "52px",
                          }}
                        >
                          <p>Categories</p>
                        </Link>
                      </li>
                    )}
                    {(hasPermission("variation.view") ||
                      hasPermission("variation.add") ||
                      hasPermission("variation.delete") ||
                      hasPermission("variation.edit")) && (
                      <li className="nav-item">
                        <Link
                          to="/Variation"
                          className={getSubMenuItemClass("Variation")}
                          style={{
                            color:
                              activeSubMenu === "Variation"
                                ? "#0040C1"
                                : "#4b5565",
                            backgroundColor:
                              activeSubMenu === "Variation"
                                ? "rgba(0, 64, 193, 0.08)"
                                : "transparent",
                            paddingLeft: "52px",
                          }}
                        >
                          <p>Variation</p>
                        </Link>
                      </li>
                    )}
                    {(hasPermission("brand.view") ||
                      hasPermission("brand.add") ||
                      hasPermission("brand.delete") ||
                      hasPermission("brand.edit")) && (
                      <li className="nav-item">
                        <Link
                          to="/Brands"
                          className={getSubMenuItemClass("Brands")}
                          style={{
                            color:
                              activeSubMenu === "Brands"
                                ? "#0040C1"
                                : "#4b5565",
                            backgroundColor:
                              activeSubMenu === "Brands"
                                ? "rgba(0, 64, 193, 0.08)"
                                : "transparent",
                            paddingLeft: "52px",
                          }}
                        >
                          <p>Brands</p>
                        </Link>
                      </li>
                    )}
                    {(hasPermission("units.view") ||
                      hasPermission("units.add") ||
                      hasPermission("units.delete") ||
                      hasPermission("units.edit")) && (
                      <li className="nav-item">
                        <Link
                          to="/Units"
                          className={getSubMenuItemClass("Units")}
                          style={{
                            color:
                              activeSubMenu === "Units" ? "#0040C1" : "#4b5565",
                            backgroundColor:
                              activeSubMenu === "Units"
                                ? "rgba(0, 64, 193, 0.08)"
                                : "transparent",
                            paddingLeft: "52px",
                          }}
                        >
                          <p>Units</p>
                        </Link>
                      </li>
                    )}
                  </ul>
                </li>
              )}

              {/* Purchase */}
              {(hasPermission("purchase.view") ||
                hasPermission("purchase.add") ||
                hasPermission("purchase.delete") ||
                hasPermission("purchase.edit")) && (
                <li
                  className={`nav-item ${
                    activeMenu === "purchase" ? "menu-open" : ""
                  } mb-2`}
                >
                  <a
                    href="#"
                    className={getMenuItemClass("purchase")}
                    onClick={(e) => {
                      e.preventDefault();
                      toggleDropdown("purchase");
                    }}
                    style={{
                      borderLeft:
                        activeMenu === "purchase"
                          ? "3px solid #0040C1"
                          : "none",
                      backgroundColor:
                        activeMenu === "purchase"
                          ? "rgba(0, 64, 193, 0.05)"
                          : "transparent",
                    }}
                  >
                    <i
                      className="nav-icon fa-solid fa-cart-shopping"
                      style={{
                        color:
                          activeMenu === "purchase" ? "#0040C1" : "#4b5565",
                      }}
                    />
                    <p
                      style={{
                        color:
                          activeMenu === "purchase" ? "#0040C1" : "#4b5565",
                      }}
                      className="ms-1"
                    >
                      Purchase
                      <i
                        className="right fas fa-angle-left"
                        style={{
                          color:
                            activeMenu === "purchase" ? "#0040C1" : "#4b5565",
                        }}
                      />
                    </p>
                  </a>
                  <ul
                    className="nav nav-treeview"
                    style={{
                      display: isPurchaseOpen ? "block" : "none",
                      backgroundColor:
                        activeMenu === "purchase"
                          ? "rgba(0, 64, 193, 0.05)"
                          : "transparent",
                    }}
                  >
                    <li className="nav-item">
                      <Link
                        to="/PurchaseOrder"
                        className={getSubMenuItemClass("PurchaseOrder")}
                        style={{
                          color:
                            activeSubMenu === "PurchaseOrder"
                              ? "#0040C1"
                              : "#4b5565",
                          backgroundColor:
                            activeSubMenu === "PurchaseOrder"
                              ? "rgba(0, 64, 193, 0.08)"
                              : "transparent",
                          paddingLeft: "52px",
                        }}
                      >
                        <p>Purchase Order</p>
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link
                        to="/ListPurchaseOrder"
                        className={getSubMenuItemClass("ListPurchaseOrder")}
                        style={{
                          color:
                            activeSubMenu === "ListPurchaseOrder"
                              ? "#0040C1"
                              : "#4b5565",
                          backgroundColor:
                            activeSubMenu === "ListPurchaseOrder"
                              ? "rgba(0, 64, 193, 0.08)"
                              : "transparent",
                          paddingLeft: "52px",
                        }}
                      >
                        <p>List Purchase Order</p>
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link
                        to="/AddPoPurchase"
                        className={getSubMenuItemClass("AddPoPurchase")}
                        style={{
                          color:
                            activeSubMenu === "AddPoPurchase"
                              ? "#0040C1"
                              : "#4b5565",
                          backgroundColor:
                            activeSubMenu === "AddPoPurchase"
                              ? "rgba(0, 64, 193, 0.08)"
                              : "transparent",
                          paddingLeft: "52px",
                        }}
                      >
                        <p>Add Po Purchase</p>
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link
                        to="/ListPoPurchaseOrder"
                        className={getSubMenuItemClass("ListPoPurchaseOrder")}
                        style={{
                          color:
                            activeSubMenu === "ListPoPurchaseOrder"
                              ? "#0040C1"
                              : "#4b5565",
                          backgroundColor:
                            activeSubMenu === "ListPoPurchaseOrder"
                              ? "rgba(0, 64, 193, 0.08)"
                              : "transparent",
                          paddingLeft: "52px",
                        }}
                      >
                        <p>List Po Purchase</p>
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link
                        to="/AddDIPurchase"
                        className={getSubMenuItemClass("AddDIPurchase")}
                        style={{
                          color:
                            activeSubMenu === "AddDIPurchase"
                              ? "#0040C1"
                              : "#4b5565",
                          backgroundColor:
                            activeSubMenu === "AddDIPurchase"
                              ? "rgba(0, 64, 193, 0.08)"
                              : "transparent",
                          paddingLeft: "52px",
                        }}
                      >
                        <p>Add DI Purchase</p>
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link
                        to="/ListDIPurchaseOrder"
                        className={getSubMenuItemClass("ListDIPurchaseOrder")}
                        style={{
                          color:
                            activeSubMenu === "ListDIPurchaseOrder"
                              ? "#0040C1"
                              : "#4b5565",
                          backgroundColor:
                            activeSubMenu === "ListDIPurchaseOrder"
                              ? "rgba(0, 64, 193, 0.08)"
                              : "transparent",
                          paddingLeft: "52px",
                        }}
                      >
                        <p>List DI Purchase</p>
                      </Link>
                    </li>
                    {(hasPermission("purchasereturn.view") ||
                      hasPermission("purchasereturn.add") ||
                      hasPermission("purchasereturn.delete") ||
                      hasPermission("purchasereturn.edit")) && (
                      <li className="nav-item">
                        <Link
                          to="/ReturnPurchase"
                          className={getSubMenuItemClass("ReturnPurchase")}
                          style={{
                            color:
                              activeSubMenu === "ReturnPurchase"
                                ? "#0040C1"
                                : "#4b5565",
                            backgroundColor:
                              activeSubMenu === "ReturnPurchase"
                                ? "rgba(0, 64, 193, 0.08)"
                                : "transparent",
                            paddingLeft: "52px",
                          }}
                        >
                          <p>List purchase return</p>
                        </Link>
                      </li>
                    )}
                  </ul>
                </li>
              )}

              {/* Sell */}
              {(hasPermission("sale.view") ||
                hasPermission("sale.add") ||
                hasPermission("sale.delete") ||
                hasPermission("sale.edit")) && (
                <li
                  className={`nav-item ${
                    activeMenu === "sell" ? "menu-open" : ""
                  } mb-2`}
                >
                  <a
                    href="#"
                    className={getMenuItemClass("sell")}
                    onClick={(e) => {
                      e.preventDefault();
                      toggleDropdown("sell");
                      if (window.innerWidth < 768) {
                        handleSidebarCollapse();
                      }
                    }}
                    style={{
                      borderLeft:
                        activeMenu === "sell" ? "3px solid #0040C1" : "none",
                      backgroundColor:
                        activeMenu === "sell"
                          ? "rgba(0, 64, 193, 0.05)"
                          : "transparent",
                    }}
                  >
                    <i
                      className="nav-icon fa-brands fa-sellsy"
                      style={{
                        color: activeMenu === "sell" ? "#0040C1" : "#4b5565",
                      }}
                    />
                    <p
                      style={{
                        color: activeMenu === "sell" ? "#0040C1" : "#4b5565",
                      }}
                      className="ms-1"
                    >
                      Sales
                      <i
                        className="right fas fa-angle-left"
                        style={{
                          color: activeMenu === "sell" ? "#0040C1" : "#4b5565",
                        }}
                      />
                    </p>
                  </a>
                  <ul
                    className="nav nav-treeview"
                    style={{
                      display: isSellOpen ? "block" : "none",
                      backgroundColor:
                        activeMenu === "sell"
                          ? "rgba(0, 64, 193, 0.05)"
                          : "transparent",
                    }}
                  >
                    <li className="nav-item">
                      <Link
                        to="/ViewOrders"
                        className={getSubMenuItemClass("ViewOrders")}
                        style={{
                          color:
                            activeSubMenu === "ViewOrders"
                              ? "#0040C1"
                              : "#4b5565",
                          backgroundColor:
                            activeSubMenu === "ViewOrders"
                              ? "rgba(0, 64, 193, 0.08)"
                              : "transparent",
                          paddingLeft: "52px",
                        }}
                      >
                        <p>View Orders</p>
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link
                        to="/AcceptedOrders"
                        className={getSubMenuItemClass("AcceptedOrders")}
                        style={{
                          color:
                            activeSubMenu === "AcceptedOrders"
                              ? "#0040C1"
                              : "#4b5565",
                          backgroundColor:
                            activeSubMenu === "AcceptedOrders"
                              ? "rgba(0, 64, 193, 0.08)"
                              : "transparent",
                          paddingLeft: "52px",
                        }}
                      >
                        <p>Accepted Orders</p>
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link
                        to="/RejectedOrders"
                        className={getSubMenuItemClass("RejectedOrders")}
                        style={{
                          color:
                            activeSubMenu === "RejectedOrders"
                              ? "#0040C1"
                              : "#4b5565",
                          backgroundColor:
                            activeSubMenu === "RejectedOrders"
                              ? "rgba(0, 64, 193, 0.08)"
                              : "transparent",
                          paddingLeft: "52px",
                        }}
                      >
                        <p>Rejected Orders</p>
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link
                        to="/ShipOrders"
                        className={getSubMenuItemClass("ShipOrders")}
                        style={{
                          color:
                            activeSubMenu === "ShipOrders"
                              ? "#0040C1"
                              : "#4b5565",
                          backgroundColor:
                            activeSubMenu === "ShipOrders"
                              ? "rgba(0, 64, 193, 0.08)"
                              : "transparent",
                          paddingLeft: "52px",
                        }}
                      >
                        <p>Shipped Orders</p>
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link
                        to="/AddSoSale"
                        className={getSubMenuItemClass("AddSoSale")}
                        style={{
                          color:
                            activeSubMenu === "AddSoSale"
                              ? "#0040C1"
                              : "#4b5565",
                          backgroundColor:
                            activeSubMenu === "AddSoSale"
                              ? "rgba(0, 64, 193, 0.08)"
                              : "transparent",
                          paddingLeft: "52px",
                        }}
                      >
                        <p>Add So Sale</p>
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link
                        to="/ListSoSale"
                        className={getSubMenuItemClass("ListSoSale")}
                        style={{
                          color:
                            activeSubMenu === "ListSoSale"
                              ? "#0040C1"
                              : "#4b5565",
                          backgroundColor:
                            activeSubMenu === "ListSoSale"
                              ? "rgba(0, 64, 193, 0.08)"
                              : "transparent",
                          paddingLeft: "52px",
                        }}
                      >
                        <p>List So Sale</p>
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link
                        to="/AddDISale"
                        className={getSubMenuItemClass("AddDISale")}
                        style={{
                          color:
                            activeSubMenu === "AddDISale"
                              ? "#0040C1"
                              : "#4b5565",
                          backgroundColor:
                            activeSubMenu === "AddDISale"
                              ? "rgba(0, 64, 193, 0.08)"
                              : "transparent",
                          paddingLeft: "52px",
                        }}
                      >
                        <p>Add DI Sale</p>
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link
                        to="/ListDISale"
                        className={getSubMenuItemClass("ListDISale")}
                        style={{
                          color:
                            activeSubMenu === "ListDISale"
                              ? "#0040C1"
                              : "#4b5565",
                          backgroundColor:
                            activeSubMenu === "ListDISale"
                              ? "rgba(0, 64, 193, 0.08)"
                              : "transparent",
                          paddingLeft: "52px",
                        }}
                      >
                        <p>List DI Sale</p>
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link
                        to="/AllSaleOrders"
                        className={getSubMenuItemClass("AllSaleOrders")}
                        style={{
                          color:
                            activeSubMenu === "AllSaleOrders"
                              ? "#0040C1"
                              : "#4b5565",
                          backgroundColor:
                            activeSubMenu === "AllSaleOrders"
                              ? "rgba(0, 64, 193, 0.08)"
                              : "transparent",
                          paddingLeft: "52px",
                        }}
                      >
                        <p>All Sale</p>
                      </Link>
                    </li>

                    {(hasPermission("salesreturn.view") ||
                      hasPermission("salesreturn.add") ||
                      hasPermission("salesreturn.delete") ||
                      hasPermission("salesreturn.edit")) && (
                      <>
                        <li className="nav-item">
                          <Link
                            to="/SaleReturn"
                            className={getSubMenuItemClass("SaleReturn")}
                            style={{
                              color:
                                activeSubMenu === "SaleReturn"
                                  ? "#0040C1"
                                  : "#4b5565",
                              backgroundColor:
                                activeSubMenu === "SaleReturn"
                                  ? "rgba(0, 64, 193, 0.08)"
                                  : "transparent",
                              paddingLeft: "52px",
                            }}
                          >
                            <p>List Sell Return</p>
                          </Link>
                        </li>
                        <li className="nav-item">
                          <Link
                            to="/ListAcceptedReturn"
                            className={getSubMenuItemClass(
                              "ListAcceptedReturn"
                            )}
                            style={{
                              color:
                                activeSubMenu === "ListAcceptedReturn"
                                  ? "#0040C1"
                                  : "#4b5565",
                              backgroundColor:
                                activeSubMenu === "ListAcceptedReturn"
                                  ? "rgba(0, 64, 193, 0.08)"
                                  : "transparent",
                              paddingLeft: "52px",
                            }}
                          >
                            <p>List Accepted Sale Return</p>
                          </Link>
                        </li>
                        <li className="nav-item">
                          <Link
                            to="/ListShipReturn"
                            className={getSubMenuItemClass("ListShipReturn")}
                            style={{
                              color:
                                activeSubMenu === "ListShipReturn"
                                  ? "#0040C1"
                                  : "#4b5565",
                              backgroundColor:
                                activeSubMenu === "ListShipReturn"
                                  ? "rgba(0, 64, 193, 0.08)"
                                  : "transparent",
                              paddingLeft: "52px",
                            }}
                          >
                            <p>List Shipped Sale Return</p>
                          </Link>
                        </li>
                      </>
                    )}
                  </ul>
                </li>
              )}

              {/* Stock Transfer */}
              <li
                className={`nav-item ${
                  activeMenu === "stock" ? "menu-open" : ""
                } mb-2`}
              >
                <a
                  href="#"
                  className={getMenuItemClass("stock")}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleDropdown("stock");
                    if (window.innerWidth < 768) {
                      handleSidebarCollapse();
                    }
                  }}
                  style={{
                    borderLeft:
                      activeMenu === "stock" ? "3px solid #0040C1" : "none",
                    backgroundColor:
                      activeMenu === "stock"
                        ? "rgba(0, 64, 193, 0.05)"
                        : "transparent",
                  }}
                >
                  <i
                    className="nav-icon fa-brands fa-sellsy"
                    style={{
                      color: activeMenu === "stock" ? "#0040C1" : "#4b5565",
                    }}
                  />
                  <p
                    style={{
                      color: activeMenu === "stock" ? "#0040C1" : "#4b5565",
                    }}
                    className="ms-1"
                  >
                    Stock Transfer
                    <i
                      className="right fas fa-angle-left"
                      style={{
                        color: activeMenu === "stock" ? "#0040C1" : "#4b5565",
                      }}
                    />
                  </p>
                </a>
                <ul
                  className="nav nav-treeview"
                  style={{
                    display: isStockOpen ? "block" : "none",
                    backgroundColor:
                      activeMenu === "stock"
                        ? "rgba(0, 64, 193, 0.05)"
                        : "transparent",
                  }}
                >
                  <li className="nav-item">
                    <Link
                      to="/ListStockTransfer"
                      className={getSubMenuItemClass("ListStockTransfer")}
                      style={{
                        color:
                          activeSubMenu === "ListStockTransfer"
                            ? "#0040C1"
                            : "#4b5565",
                        backgroundColor:
                          activeSubMenu === "ListStockTransfer"
                            ? "rgba(0, 64, 193, 0.08)"
                            : "transparent",
                        paddingLeft: "52px",
                      }}
                    >
                      <p>List Stock Transfer</p>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      to="/AddStockTransfer"
                      className={getSubMenuItemClass("AddStockTransfer")}
                      style={{
                        color:
                          activeSubMenu === "AddStockTransfer"
                            ? "#0040C1"
                            : "#4b5565",
                        backgroundColor:
                          activeSubMenu === "AddStockTransfer"
                            ? "rgba(0, 64, 193, 0.08)"
                            : "transparent",
                        paddingLeft: "52px",
                      }}
                    >
                      <p>Add Stock Transfer</p>
                    </Link>
                  </li>
                </ul>
              </li>

              {/* Stock Adjustment */}
              <li
                className={`nav-item ${
                  activeMenu === "stockAdjustment" ? "menu-open" : ""
                } mb-2`}
              >
                <a
                  href="#"
                  className={getMenuItemClass("stockAdjustment")}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleDropdown("stockAdjustment");
                    if (window.innerWidth < 768) {
                      handleSidebarCollapse();
                    }
                  }}
                  style={{
                    borderLeft:
                      activeMenu === "stockAdjustment"
                        ? "3px solid #0040C1"
                        : "none",
                    backgroundColor:
                      activeMenu === "stockAdjustment"
                        ? "rgba(0, 64, 193, 0.05)"
                        : "transparent",
                  }}
                >
                  <i
                    className="nav-icon fa-brands fa-sellsy"
                    style={{
                      color:
                        activeMenu === "stockAdjustment"
                          ? "#0040C1"
                          : "#4b5565",
                    }}
                  />
                  <p
                    style={{
                      color:
                        activeMenu === "stockAdjustment"
                          ? "#0040C1"
                          : "#4b5565",
                    }}
                    className="ms-1"
                  >
                    Stock Adjustment
                    <i
                      className="right fas fa-angle-left"
                      style={{
                        color:
                          activeMenu === "stockAdjustment"
                            ? "#0040C1"
                            : "#4b5565",
                      }}
                    />
                  </p>
                </a>
                <ul
                  className="nav nav-treeview"
                  style={{
                    display: isStockAdjustmentOpen ? "block" : "none",
                    backgroundColor:
                      activeMenu === "stockAdjustment"
                        ? "rgba(0, 64, 193, 0.05)"
                        : "transparent",
                  }}
                >
                  <li className="nav-item">
                    <Link
                      to="/AddStockAdjustment"
                      className={getSubMenuItemClass("AddStockAdjustment")}
                      style={{
                        color:
                          activeSubMenu === "AddStockAdjustment"
                            ? "#0040C1"
                            : "#4b5565",
                        backgroundColor:
                          activeSubMenu === "AddStockAdjustment"
                            ? "rgba(0, 64, 193, 0.08)"
                            : "transparent",
                        paddingLeft: "52px",
                      }}
                    >
                      <p>Add Stock Adjustment</p>
                    </Link>

                    <Link
                      to="/ListStockAdjustment"
                      className={getSubMenuItemClass("ListStockAdjustment")}
                      style={{
                        color:
                          activeSubMenu === "ListStockAdjustment"
                            ? "#0040C1"
                            : "#4b5565",
                        backgroundColor:
                          activeSubMenu === "ListStockAdjustment"
                            ? "rgba(0, 64, 193, 0.08)"
                            : "transparent",
                        paddingLeft: "52px",
                      }}
                    >
                      <p>List Stock Adjustment</p>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      to="/ListWarrantyClaim"
                      className={getSubMenuItemClass("ListWarrantyClaim")}
                      style={{
                        color:
                          activeSubMenu === "ListWarrantyClaim"
                            ? "#0040C1"
                            : "#4b5565",
                        backgroundColor:
                          activeSubMenu === "ListWarrantyClaim"
                            ? "rgba(0, 64, 193, 0.08)"
                            : "transparent",
                        paddingLeft: "52px",
                      }}
                    >
                      <p>List Warranty Claim</p>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      to="/ListShippedWarrantyClaim"
                      className={getSubMenuItemClass(
                        "ListShippedWarrantyClaim"
                      )}
                      style={{
                        color:
                          activeSubMenu === "ListShippedWarrantyClaim"
                            ? "#0040C1"
                            : "#4b5565",
                        backgroundColor:
                          activeSubMenu === "ListShippedWarrantyClaim"
                            ? "rgba(0, 64, 193, 0.08)"
                            : "transparent",
                        paddingLeft: "52px",
                      }}
                    >
                      <p>List Claimed Warranty </p>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      to="/AddWarrantyClaim"
                      className={getSubMenuItemClass("AddWarrantyClaim")}
                      style={{
                        color:
                          activeSubMenu === "AddWarrantyClaim"
                            ? "#0040C1"
                            : "#4b5565",
                        backgroundColor:
                          activeSubMenu === "AddWarrantyClaim"
                            ? "rgba(0, 64, 193, 0.08)"
                            : "transparent",
                        paddingLeft: "52px",
                      }}
                    >
                      <p>Add Vendor Warranty Claim</p>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      to="/ListVendorWarrantyClaim"
                      className={getSubMenuItemClass("ListVendorWarrantyClaim")}
                      style={{
                        color:
                          activeSubMenu === "ListVendorWarrantyClaim"
                            ? "#0040C1"
                            : "#4b5565",
                        backgroundColor:
                          activeSubMenu === "ListVendorWarrantyClaim"
                            ? "rgba(0, 64, 193, 0.08)"
                            : "transparent",
                        paddingLeft: "52px",
                      }}
                    >
                      <p>List Vendor Warranty Claim</p>
                    </Link>
                  </li>
                </ul>
              </li>

              {/* Expenses */}
              <li
                className={`nav-item ${
                  activeMenu === "expenses" ? "menu-open" : ""
                } mb-2`}
              >
                <a
                  href="#"
                  className={getMenuItemClass("expenses")}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleDropdown("expenses");
                    if (window.innerWidth < 768) {
                      handleSidebarCollapse();
                    }
                  }}
                  style={{
                    borderLeft:
                      activeMenu === "expenses" ? "3px solid #0040C1" : "none",
                    backgroundColor:
                      activeMenu === "expenses"
                        ? "rgba(0, 64, 193, 0.05)"
                        : "transparent",
                  }}
                >
                  <i
                    className="nav-icon fas fa-money-bill-wave"
                    style={{
                      color: activeMenu === "expenses" ? "#0040C1" : "#4b5565",
                    }}
                  />
                  <p
                    style={{
                      color: activeMenu === "expenses" ? "#0040C1" : "#4b5565",
                    }}
                    className="ms-1"
                  >
                    Expenses
                    <i
                      className="right fas fa-angle-left"
                      style={{
                        color:
                          activeMenu === "expenses" ? "#0040C1" : "#4b5565",
                      }}
                    />
                  </p>
                </a>
                <ul
                  className="nav nav-treeview"
                  style={{
                    display: isExpensesOpen ? "block" : "none",
                    backgroundColor:
                      activeMenu === "expenses"
                        ? "rgba(0, 64, 193, 0.05)"
                        : "transparent",
                  }}
                >
                  <li className="nav-item">
                    <Link
                      to="/ListExpense"
                      className={getSubMenuItemClass("ListExpense")}
                      style={{
                        color:
                          activeSubMenu === "ListExpense"
                            ? "#0040C1"
                            : "#4b5565",
                        backgroundColor:
                          activeSubMenu === "ListExpense"
                            ? "rgba(0, 64, 193, 0.08)"
                            : "transparent",
                        paddingLeft: "52px",
                      }}
                    >
                      <p>List Expenses</p>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      to="/AddExpense"
                      className={getSubMenuItemClass("AddExpense")}
                      style={{
                        color:
                          activeSubMenu === "AddExpense"
                            ? "#0040C1"
                            : "#4b5565",
                        backgroundColor:
                          activeSubMenu === "AddExpense"
                            ? "rgba(0, 64, 193, 0.08)"
                            : "transparent",
                        paddingLeft: "52px",
                      }}
                    >
                      <p>Add Expense</p>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      to="/ExpenseCategories"
                      className={getSubMenuItemClass("ExpenseCategories")}
                      style={{
                        color:
                          activeSubMenu === "ExpenseCategories"
                            ? "#0040C1"
                            : "#4b5565",
                        backgroundColor:
                          activeSubMenu === "ExpenseCategories"
                            ? "rgba(0, 64, 193, 0.08)"
                            : "transparent",
                        paddingLeft: "52px",
                      }}
                    >
                      <p>Expense Categories</p>
                    </Link>
                  </li>
                </ul>
              </li>

              {/* Payment */}
              <li
                className={`nav-item ${
                  activeMenu === "payment" ? "menu-open" : ""
                } mb-2`}
              >
                <a
                  href="#"
                  className={getMenuItemClass("payment")}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleDropdown("payment");
                    if (window.innerWidth < 768) {
                      handleSidebarCollapse();
                    }
                  }}
                  style={{
                    borderLeft:
                      activeMenu === "payment" ? "3px solid #0040C1" : "none",
                    backgroundColor:
                      activeMenu === "payment"
                        ? "rgba(0, 64, 193, 0.05)"
                        : "transparent",
                  }}
                >
                  <i
                    className="nav-icon fa-solid fa-circle-dollar-to-slot"
                    style={{
                      color: activeMenu === "payment" ? "#0040C1" : "#4b5565",
                    }}
                  />
                  <p
                    style={{
                      color: activeMenu === "payment" ? "#0040C1" : "#4b5565",
                    }}
                    className="ms-1"
                  >
                    Payment
                    <i
                      className="right fas fa-angle-left"
                      style={{
                        color: activeMenu === "payment" ? "#0040C1" : "#4b5565",
                      }}
                    />
                  </p>
                </a>
                <ul
                  className="nav nav-treeview"
                  style={{
                    display: isPaymentOpen ? "block" : "none",
                    backgroundColor:
                      activeMenu === "payment"
                        ? "rgba(0, 64, 193, 0.05)"
                        : "transparent",
                  }}
                >
                  <li className="nav-item">
                    <Link
                      to="/Accounts"
                      className={getSubMenuItemClass("Accounts")}
                      style={{
                        color:
                          activeSubMenu === "Accounts" ? "#0040C1" : "#4b5565",
                        backgroundColor:
                          activeSubMenu === "Accounts"
                            ? "rgba(0, 64, 193, 0.08)"
                            : "transparent",
                        paddingLeft: "52px",
                      }}
                    >
                      <p>List Accounts</p>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      to="/TrialBalance"
                      className={getSubMenuItemClass("TrialBalance")}
                      style={{
                        color:
                          activeSubMenu === "TrialBalance"
                            ? "#0040C1"
                            : "#4b5565",
                        backgroundColor:
                          activeSubMenu === "TrialBalance"
                            ? "rgba(0, 64, 193, 0.08)"
                            : "transparent",
                        paddingLeft: "52px",
                      }}
                    >
                      <p>Trial Balance</p>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      to="/CashFlow"
                      className={getSubMenuItemClass("CashFlow")}
                      style={{
                        color:
                          activeSubMenu === "CashFlow" ? "#0040C1" : "#4b5565",
                        backgroundColor:
                          activeSubMenu === "CashFlow"
                            ? "rgba(0, 64, 193, 0.08)"
                            : "transparent",
                        paddingLeft: "52px",
                      }}
                    >
                      <p>Cash Flow</p>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      to="/PaymentReport"
                      className={getSubMenuItemClass("PaymentReport")}
                      style={{
                        color:
                          activeSubMenu === "PaymentReport"
                            ? "#0040C1"
                            : "#4b5565",
                        backgroundColor:
                          activeSubMenu === "PaymentReport"
                            ? "rgba(0, 64, 193, 0.08)"
                            : "transparent",
                        paddingLeft: "52px",
                      }}
                    >
                      <p>Payment Report</p>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      to="/ListPaymentMethod"
                      className={getSubMenuItemClass("ListPaymentMethod")}
                      style={{
                        color:
                          activeSubMenu === "ListPaymentMethod"
                            ? "#0040C1"
                            : "#4b5565",
                        backgroundColor:
                          activeSubMenu === "ListPaymentMethod"
                            ? "rgba(0, 64, 193, 0.08)"
                            : "transparent",
                        paddingLeft: "52px",
                      }}
                    >
                      <p>List Payment Method</p>
                    </Link>
                  </li>
                </ul>
              </li>
              {/* Report */}
              <li
                className={`nav-item ${
                  activeMenu === "report" ? "menu-open" : ""
                } mb-2`}
              >
                <a
                  href="#"
                  className={getMenuItemClass("report")}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleDropdown("report");
                    if (window.innerWidth < 768) {
                      handleSidebarCollapse();
                    }
                  }}
                  style={{
                    borderLeft:
                      activeMenu === "report" ? "3px solid #0040C1" : "none",
                    backgroundColor:
                      activeMenu === "report"
                        ? "rgba(0, 64, 193, 0.05)"
                        : "transparent",
                  }}
                >
                  <i
                    className="nav-icon fa-solid fa-sack-dollar"
                    style={{
                      color: activeMenu === "report" ? "#0040C1" : "#4b5565",
                    }}
                  />
                  <p
                    style={{
                      color: activeMenu === "report" ? "#0040C1" : "#4b5565",
                    }}
                    className="ms-1"
                  >
                    Report
                    <i
                      className="right fas fa-angle-left"
                      style={{
                        color: activeMenu === "report" ? "#0040C1" : "#4b5565",
                      }}
                    />
                  </p>
                </a>
                <ul
                  className="nav nav-treeview"
                  style={{
                    display: isReportOpen ? "block" : "none",
                    backgroundColor:
                      activeMenu === "report"
                        ? "rgba(0, 64, 193, 0.05)"
                        : "transparent",
                  }}
                >
                  <li className="nav-item">
                    <Link
                      to="/PurchaseAndSale"
                      className={getSubMenuItemClass("PurchaseAndSale")}
                      style={{
                        color:
                          activeSubMenu === "PurchaseAndSale"
                            ? "#0040C1"
                            : "#4b5565",
                        backgroundColor:
                          activeSubMenu === "PurchaseAndSale"
                            ? "rgba(0, 64, 193, 0.08)"
                            : "transparent",
                        paddingLeft: "52px",
                      }}
                    >
                      <p>Purchase And Sale</p>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      to="/TaxReport"
                      className={getSubMenuItemClass("TaxReport")}
                      style={{
                        color:
                          activeSubMenu === "TaxReport" ? "#0040C1" : "#4b5565",
                        backgroundColor:
                          activeSubMenu === "TaxReport"
                            ? "rgba(0, 64, 193, 0.08)"
                            : "transparent",
                        paddingLeft: "52px",
                      }}
                    >
                      <p>Tax Report</p>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      to="/CustomersAndSuppliers"
                      className={getSubMenuItemClass("CustomersAndSuppliers")}
                      style={{
                        color:
                          activeSubMenu === "CustomersAndSuppliers"
                            ? "#0040C1"
                            : "#4b5565",
                        backgroundColor:
                          activeSubMenu === "CustomersAndSuppliers"
                            ? "rgba(0, 64, 193, 0.08)"
                            : "transparent",
                        paddingLeft: "52px",
                      }}
                    >
                      <p>Customers And Suppliers</p>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      to="/StockReport"
                      className={getSubMenuItemClass("StockReport")}
                      style={{
                        color:
                          activeSubMenu === "StockReport"
                            ? "#0040C1"
                            : "#4b5565",
                        backgroundColor:
                          activeSubMenu === "StockReport"
                            ? "rgba(0, 64, 193, 0.08)"
                            : "transparent",
                        paddingLeft: "52px",
                      }}
                    >
                      <p>Stock Report</p>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      to="/StockAdjustmentReport"
                      className={getSubMenuItemClass("StockAdjustmentReport")}
                      style={{
                        color:
                          activeSubMenu === "StockAdjustmentReport"
                            ? "#0040C1"
                            : "#4b5565",
                        backgroundColor:
                          activeSubMenu === "StockAdjustmentReport"
                            ? "rgba(0, 64, 193, 0.08)"
                            : "transparent",
                        paddingLeft: "52px",
                      }}
                    >
                      <p>Stock Adjustment Report</p>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      to="/ItemReport"
                      className={getSubMenuItemClass("ItemReport")}
                      style={{
                        color:
                          activeSubMenu === "ItemReport"
                            ? "#0040C1"
                            : "#4b5565",
                        backgroundColor:
                          activeSubMenu === "ItemReport"
                            ? "rgba(0, 64, 193, 0.08)"
                            : "transparent",
                        paddingLeft: "52px",
                      }}
                    >
                      <p>Item Report</p>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      to="/ProductPurchaseReport"
                      className={getSubMenuItemClass("ProductPurchaseReport")}
                      style={{
                        color:
                          activeSubMenu === "ProductPurchaseReport"
                            ? "#0040C1"
                            : "#4b5565",
                        backgroundColor:
                          activeSubMenu === "ProductPurchaseReport"
                            ? "rgba(0, 64, 193, 0.08)"
                            : "transparent",
                        paddingLeft: "52px",
                      }}
                    >
                      <p>Product Purchase Report</p>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      to="/ProductSellReport"
                      className={getSubMenuItemClass("ProductSellReport")}
                      style={{
                        color:
                          activeSubMenu === "ProductSellReport"
                            ? "#0040C1"
                            : "#4b5565",
                        backgroundColor:
                          activeSubMenu === "ProductSellReport"
                            ? "rgba(0, 64, 193, 0.08)"
                            : "transparent",
                        paddingLeft: "52px",
                      }}
                    >
                      <p>Product Sell Report</p>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      to="/PurchasePaymentReport"
                      className={getSubMenuItemClass("PurchasePaymentReport")}
                      style={{
                        color:
                          activeSubMenu === "PurchasePaymentReport"
                            ? "#0040C1"
                            : "#4b5565",
                        backgroundColor:
                          activeSubMenu === "PurchasePaymentReport"
                            ? "rgba(0, 64, 193, 0.08)"
                            : "transparent",
                        paddingLeft: "52px",
                      }}
                    >
                      <p>Purchase Payment Report</p>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      to="/SalePaymentReport"
                      className={getSubMenuItemClass("SalePaymentReport")}
                      style={{
                        color:
                          activeSubMenu === "SalePaymentReport"
                            ? "#0040C1"
                            : "#4b5565",
                        backgroundColor:
                          activeSubMenu === "SalePaymentReport"
                            ? "rgba(0, 64, 193, 0.08)"
                            : "transparent",
                        paddingLeft: "52px",
                      }}
                    >
                      <p>Sale Payment Report</p>
                    </Link>
                  </li>
                </ul>
              </li>

              {/* Setting */}
              <li
                className={`nav-item ${
                  activeMenu === "setting" ? "menu-open" : ""
                } mb-2`}
              >
                <a
                  href="#"
                  className={getMenuItemClass("setting")}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleDropdown("setting");
                    if (window.innerWidth < 768) {
                      handleSidebarCollapse();
                    }
                  }}
                  style={{
                    borderLeft:
                      activeMenu === "setting" ? "3px solid #0040C1" : "none",
                    backgroundColor:
                      activeMenu === "setting"
                        ? "rgba(0, 64, 193, 0.05)"
                        : "transparent",
                  }}
                >
                  <i
                    className="nav-icon fa-solid fa-gear"
                    style={{
                      color: activeMenu === "setting" ? "#0040C1" : "#4b5565",
                    }}
                  />
                  <p
                    style={{
                      color: activeMenu === "setting" ? "#0040C1" : "#4b5565",
                    }}
                    className="ms-1"
                  >
                    Setting
                    <i
                      className="right fas fa-angle-left"
                      style={{
                        color: activeMenu === "setting" ? "#0040C1" : "#4b5565",
                      }}
                    />
                  </p>
                </a>
                <ul
                  className="nav nav-treeview"
                  style={{
                    display: isSettingOpen ? "block" : "none",
                    backgroundColor:
                      activeMenu === "setting"
                        ? "rgba(0, 64, 193, 0.05)"
                        : "transparent",
                  }}
                >
                  <li className="nav-item">
                    <Link
                      to="/TaxRate"
                      className={getSubMenuItemClass("TaxRate")}
                      style={{
                        color:
                          activeSubMenu === "TaxRate" ? "#0040C1" : "#4b5565",
                        backgroundColor:
                          activeSubMenu === "TaxRate"
                            ? "rgba(0, 64, 193, 0.08)"
                            : "transparent",
                        paddingLeft: "52px",
                      }}
                    >
                      <p>Tax Rates</p>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      to="/BusinessDetails"
                      className={getSubMenuItemClass("BusinessDetails")}
                      style={{
                        color:
                          activeSubMenu === "BusinessDetails"
                            ? "#0040C1"
                            : "#4b5565",
                        backgroundColor:
                          activeSubMenu === "BusinessDetails"
                            ? "rgba(0, 64, 193, 0.08)"
                            : "transparent",
                        paddingLeft: "52px",
                      }}
                    >
                      <p>Business Details</p>
                    </Link>
                  </li>
                </ul>
              </li>

              {/* Permissions */}
              <li
                className={`nav-item ${
                  activeMenu === "extra" ? "menu-open" : ""
                } mb-2`}
              >
                <a
                  href="#"
                  className={getMenuItemClass("extra")}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleDropdown("extra");
                    if (window.innerWidth < 768) {
                      handleSidebarCollapse();
                    }
                  }}
                  style={{
                    borderLeft:
                      activeMenu === "extra" ? "3px solid #0040C1" : "none",
                    backgroundColor:
                      activeMenu === "extra"
                        ? "rgba(0, 64, 193, 0.05)"
                        : "transparent",
                  }}
                >
                  <i
                    className="nav-icon fa-solid fa-gear"
                    style={{
                      color: activeMenu === "extra" ? "#0040C1" : "#4b5565",
                    }}
                  />
                  <p
                    style={{
                      color: activeMenu === "extra" ? "#0040C1" : "#4b5565",
                    }}
                    className="ms-1"
                  >
                    Extra
                    <i
                      className="right fas fa-angle-left"
                      style={{
                        color: activeMenu === "extra" ? "#0040C1" : "#4b5565",
                      }}
                    />
                  </p>
                </a>
                <ul
                  className="nav nav-treeview"
                  style={{
                    display: isExtraOpen ? "block" : "none",
                    backgroundColor:
                      activeMenu === "setting"
                        ? "rgba(0, 64, 193, 0.05)"
                        : "transparent",
                  }}
                >
                  <li className="nav-item">
                    <Link
                      to="/Permission"
                      className={getSubMenuItemClass("Permission")}
                      style={{
                        color:
                          activeSubMenu === "Permission"
                            ? "#0040C1"
                            : "#4b5565",
                        backgroundColor:
                          activeSubMenu === "Permission"
                            ? "rgba(0, 64, 193, 0.08)"
                            : "transparent",
                        paddingLeft: "52px",
                      }}
                    >
                      <p>Permission</p>
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      to="/ImageUpload"
                      className={getSubMenuItemClass("ImageUpload")}
                      style={{
                        color:
                          activeSubMenu === "ImageUpload"
                            ? "#0040C1"
                            : "#4b5565",
                        backgroundColor:
                          activeSubMenu === "ImageUpload"
                            ? "rgba(0, 64, 193, 0.08)"
                            : "transparent",
                        paddingLeft: "52px",
                      }}
                    >
                      <p>Upload Image</p>
                    </Link>
                  </li>
                </ul>
              </li>

              <li className="nav-item">
                <Link
                  to="/HRMDashboard"
                  className="nav-link"
                  style={{ paddingLeft: "20px" }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="black"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="icon icon-tabler icons-tabler-outline icon-tabler-users-group"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                    <path d="M10 13a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"></path>
                    <path d="M8 21v-1a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v1"></path>
                    <path d="M15 5a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"></path>
                    <path d="M17 10h2a2 2 0 0 1 2 2v1"></path>
                    <path d="M5 5a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"></path>
                    <path d="M3 13v-1a2 2 0 0 1 2 -2h2"></path>
                  </svg>
                  <p>HRM</p>
                </Link>
              </li>

              <li className="nav-item">
                <Link
                  to="/CRMDashboard"
                  className="nav-link"
                  style={{ paddingLeft: "20px" }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="black"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="icon icon-tabler icons-tabler-outline icon-tabler-users-group"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                    <path d="M10 13a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"></path>
                    <path d="M8 21v-1a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v1"></path>
                    <path d="M15 5a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"></path>
                    <path d="M17 10h2a2 2 0 0 1 2 2v1"></path>
                    <path d="M5 5a2 2 0 1 0 4 0a2 2 0 0 0 -4 0"></path>
                    <path d="M3 13v-1a2 2 0 0 1 2 -2h2"></path>
                  </svg>
                  <p>CRM</p>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </aside>
      <div className="overlay" onClick={() => handleSidebarCollapse()} />
    </div>
  );
};

export default Menu;
