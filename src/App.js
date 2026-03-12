import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  BrowserRouter,
  useLocation,
} from "react-router-dom";
import "./App.css";
import Header from "./Header";
import Footer from "./Footer";
import Menu from "./Menu";
import Profile from "./Pages/UserProfile/Profile";
import Dashboard from "./Dashboard";
import LoginPage from "./Pages/LoginPage/LoginPage";
import Users from "./Pages/UserManagement/Users";
import AddUser from "./Pages/UserManagement/AddUser";
import Roles from "./Pages/UserManagement/Roles";
import AddRoles from "./Pages/UserManagement/AddRoles";
import EditRoles from "./Pages/UserManagement/EditRoles";
import ViewRole from "./Pages/UserManagement/ViewRole";
import EditUser from "./Pages/UserManagement/EditUser";
import ViewUser from "./Pages/UserManagement/ViewUser";
import Vendor from "./Pages/Contacts/Vendor";
import AddVendor from "./Pages/Contacts/AddVendor";
import EditVendor from "./Pages/Contacts/EditVendor";
import ViewVendor from "./Pages/Contacts/ViewVendor";
import Customer from "./Pages/Contacts/Customer";
import AddCustomer from "./Pages/Contacts/AddCustomer";
import EditCustomer from "./Pages/Contacts/EditCustomer";
import ViewCustomer from "./Pages/Contacts/ViewCustomer";
import Permission from "./Pages/Extra/Permission";
import ImageUpload from "./Pages/Extra/ImageUpload";
import SignatureUpload from "./Pages/Extra/SignatureUpload";
import AddProducts from "./Pages/Products/AddProducts";
import ListProducts from "./Pages/Products/ListProducts";
import OpeningStockPage from "./Pages/Products/OpeningStockPage";
import ProductStockHistory from "./Pages/Products/ProductStockHistory";
import Categories from "./Pages/Products/Categories";
import Brands from "./Pages/Products/Brands";
import Units from "./Pages/Products/Units";
import EditList from "./Pages/Products/EditList";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";
import ViewList from "./Pages/Products/ViewList";
import Variation from "./Pages/Products/Variation";
import ListPurchase from "./Pages/Purchase/ListPurchase";
import EditPurchase from "./Pages/Purchase/EditPurchase";
import ViewPurchase from "./Pages/Purchase/ViewPurchase";
import ViewPoPurchaseOrder from "./Pages/Purchase/ViewPoPurchaseOrder";
import EditPoPurchaseOrder from "./Pages/Purchase/EditPoPurchaseOrder";
import AddPoPurchase from "./Pages/Purchase/AddPoPurchase";
import AddDIPurchase from "./Pages/Purchase/AddDIPurchase";
import PurchaseOrder from "./Pages/Purchase/PurchaseOrder";
import AddPoPurchaseOrder from "./Pages/Purchase/AddPoPurchase";
import AddDIPurchaseOrder from "./Pages/Purchase/AddDIPurchase";
import ListPurchaseOrder from "./Pages/Purchase/ListPurchaseOrder";
import ListDIPurchaseOrder from "./Pages/Purchase/ListDIPurchaseOrder";
import ListPoPurchaseOrder from "./Pages/Purchase/ListPoPurchaseOrder";
import EditPurchaseOrder from "./Pages/Purchase/EditPurchaseOrder";
import ViewDIPurchase from "./Pages/Purchase/ViewDIPurchase";
import ViewPurchaseOrder from "./Pages/Purchase/ViewPurchaseOrder";
import ViewPurchaseReturn from "./Pages/Purchase/ViewPurchaseReturn";
import EditPurchaseReturn from "./Pages/Purchase/EditPurchaseReturn";
import EditDIPurchase from "./Pages/Purchase/EditDIPurchase";
import AllSale from "./Pages/Sale/AllSale";
import AddSoSale from "./Pages/Sale/AddSoSale";
import AddDISale from "./Pages/Sale/AddDISale";
import ListSoSale from "./Pages/Sale/ListSoSale";
import ListDISale from "./Pages/Sale/ListDISale";
import ViewSoSale from "./Pages/Sale/ViewSoSale";
import EditSoSale from "./Pages/Sale/EditSoSale";
import EditDISale from "./Pages/Sale/EditDISale";
import EditSaleReturnOrder from "./Pages/Sale/EditSaleReturnOrder";
import ViewDISale from "./Pages/Sale/ViewDISale";
import SaleEntry from "./Pages/Sale/SaleEntry";
import ViewSaleReturn from "./Pages/Sale/ViewSaleReturn";
import ReturnPurchase from "./Pages/Purchase/ReturnPurchase";
import AddPurchaseReturn from "./Pages/Purchase/AddPurchaseReturn";
import SaleReturn from "./Pages/Sale/SaleReturn";
import ListShipReturn from "./Pages/Sale/ListShipReturn";
import ListAcceptedReturn from "./Pages/Sale/ListAcceptedReturn";
import AddStockTransfer from "./Pages/StockTransfer/AddStockTransfer";
import EditStockTransfer from "./Pages/StockTransfer/EditStockTransfer";
import ViewStockTransfer from "./Pages/StockTransfer/ViewStockTransfer";
import ListStockTransfer from "./Pages/StockTransfer/ListStockTransfer";
import AddStockAdjustment from "./Pages/StockAdjustment/AddStockAdjustment";
import ViewStockAdjustment from "./Pages/StockAdjustment/ViewStockAdjustment";
import AddWarrantyClaim from "./Pages/StockAdjustment/AddWarrantyClaim";
import ViewWarrantyClaim from "./Pages/StockAdjustment/ViewWarrantyClaim";
import VendorViewWarrantyClaim from "./Pages/StockAdjustment/VendorViewWarrantyClaim";
import ShipWarrantyClaim from "./Pages/StockAdjustment/ShipWarrantyClaim";
import ListWarrantyClaim from "./Pages/StockAdjustment/ListWarrantyClaim";
import ListVendorWarrantyClaim from "./Pages/StockAdjustment/ListVendorWarrantyClaim";
import ListShippedWarrantyClaim from "./Pages/StockAdjustment/ListShippedWarrantyClaim";
import AddExpense from "./Pages/Expense/AddExpense";
import ExpenseCategories from "./Pages/Expense/ExpenseCategories";
import EditExpense from "./Pages/Expense/EditExpense";
import ViewExpense from "./Pages/Expense/ViewExpense";
import ListExpense from "./Pages/Expense/ListExpense";
import ListAllElement from "./Pages/Samples/ListAllElement";
import AllFormElements from "./Pages/Samples/AllFormElements";
import PaymentReport from "./Pages/Payment/PaymentReport";
import AddAccount from "./Pages/Payment/AddAccount";
import CashFlow from "./Pages/Payment/CashFlow";
import TrialBalance from "./Pages/Payment/TrialBalance";
import AccountBook from "./Pages/Payment/AccountBook";
import PurchaseAndSale from "./Pages/Report/PurchaseAndSale";
import TaxRate from "./Pages/Setting/TaxRate";
import Test from "./Pages/Setting/Test";
import BusinessLocations from "./Pages/Setting/BusinessLocations";
import BusinessCategory from "./Pages/Setting/BusinessCategory";
import TaxReport from "./Pages/Report/TaxReport";
import CustomersAndSuppliers from "./Pages/Report/CustomersAndSuppliers";
import StockReport from "./Pages/Report/StockReport";
import ItemReport from "./Pages/Report/ItemReport";
import StockAdjustmentReport from "./Pages/Report/StockAdjustmentReport";
import ProductPurchaseReport from "./Pages/Report/ProductPurchaseReport";
import ProductSellReport from "./Pages/Report/ProductSellReport";
import DetailedPurchase from "./Pages/Report/DetailedPurchase";
import GroupedDate from "./Pages/Report/GroupedDate";
import ByCategory from "./Pages/Report/ByCategory";
import ByBrand from "./Pages/Report/ByBrand";
import PurchasePaymentReport from "./Pages/Report/PurchasePaymentReport";
import SalePaymentReport from "./Pages/Report/SalePaymentReport";
import Detailed from "./Pages/Report/Detailed";
import InputTaxPurchase from "./Pages/Report/InputTaxPurchase";
import OutputTaxSales from "./Pages/Report/OutputTaxSales";
import ExpenseTax from "./Pages/Report/ExpenseTax";
import Reporting from "./Pages/Report/Reporting";
import ListStockAdjustment from "./Pages/StockAdjustment/ListStockAdjustment";
import Accounts from "./Pages/Payment/Accounts";
import AccountTypes from "./Pages/Payment/AccountTypes";
import PaymentMethod from "./Pages/Payment/PaymentMethod";
import ListPaymentMethod from "./Pages/Payment/ListPaymentMethod";
import AddNewItem from "./Pages/Purchase/AddNewItem";
import SoldOrders from "./Pages/Sale/SoldOrders";
import OrderList from "./Pages/Sale/OrderList";
import AcceptedOrders from "./Pages/Sale/AcceptedOrders";
import ViewOrders from "./Pages/Sale/ViewOrders";
import RejectedOrders from "./Pages/Sale/RejectedOrders";
import ShipOrders from "./Pages/Sale/ShipOrders";
import ViewOd from "./Pages/Sale/ViewOd";
import EditOd from "./Pages/Sale/EditOd";
import EditAcceptedOrder from "./Pages/Sale/EditAcceptedOrder";
import ViewShipOrders from "./Pages/Sale/ViewShipOrders";
import HRMDashboard from "./Pages/HRM/HRMDashboard";
import LeaveType from "./Pages/HRM/LeaveType";
import Leave from "./Pages/HRM/Leave";
import Designations from "./Pages/HRM/Designations";
import SalesTargets from "./Pages/HRM/SalesTargets";

import Holiday from "./Pages/HRM/Holiday";
import Department from "./Pages/HRM/Department";
import Attendance from "./Pages/HRM/Attendance";
import Payroll from "./Pages/HRM/payroll";
import ViewPayslip from "./Pages/HRM/ViewPayslip";
import AllPayrolls from "./Pages/HRM/AllPayrolls";
import AddPayroll from "./Pages/HRM/AddPayroll";
import EditPayroll from "./Pages/HRM/EditPayroll";
import EditPayrolls from "./Pages/HRM/EditPayrolls";
import AddPayment from "./Pages/HRM/AddPayment";
import ViewPayrollGroups from "./Pages/HRM/ViewPayrollGroups ";
import AllPayrollGroups from "./Pages/HRM/AllPayrollGroups";
import PayComponents from "./Pages/HRM/PayComponents";
import HRMSettings from "./Pages/HRM/HRMSettings";
import EmployeeGrievance from "./Pages/HRM/EmployeeGrievance";
import NoticeBoard from "./Pages/HRM/NoticeBoard";
import FaceAttendancePage from "./Pages/HRM/FaceAttendance";
import WorkingHoursReport from "./Pages/HRM/WorkingHoursReport";
import CRMDashboard from "./Pages/CRM/CRMDashboard";
import Campaigns from "./Pages/CRM/Campaigns";
import ContactLogin from "./Pages/CRM/ContactLogin";
import Leads from "./Pages/CRM/Leads";
import FollowUps from "./Pages/CRM/FollowUps";
import BusinessDetails from "./Pages/Setting/BusinessDetails";
import PrintLabel from "./Pages/Products/PrintLabel";
import ProductLabel from "./Pages/Products/ProductLabel";
import EmployeeLayout from "./Pages/EmployeePortal/EmployeeLayout";
import EmployeeLogin from "./Pages/EmployeePortal/EmployeeLogin";
import EmployeePortalWrapper from "./Pages/EmployeePortal/EmployeePortalWrapper";
import EmployeeDashboard from "./Pages/EmployeePortal/EmployeeDashboard";
import EmployeeFaceAttendance from "./Pages/EmployeePortal/EmployeeFaceAttendance";
import EmployeeMyAttendance from "./Pages/EmployeePortal/EmployeeMyAttendance";
import EmployeeMyLeave from "./Pages/EmployeePortal/EmployeeMyLeave";
import EmployeeMyPayslips from "./Pages/EmployeePortal/EmployeeMyPayslips";
import EmployeeViewPayslip from "./Pages/EmployeePortal/EmployeeViewPayslip";
import EmployeeNotices from "./Pages/EmployeePortal/EmployeeNotices";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const App = () => {
  const [userRoles, setUserRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRoles = async () => {
      const email = sessionStorage.getItem("userEmail");
      if (email) {
        try {
          const response = await fetch(
            `${process.env.REACT_APP_BASE_URL}/user/email/${email}`
          );
          if (response.ok) {
            const userData = await response.json();
            setUserRoles(userData.roles || []);
            sessionStorage.setItem("userProfileData", JSON.stringify(userData));
          }
        } catch (error) {
          console.error("Error fetching user roles:", error);
        }
        setLoading(false);
      } else {
        setLoading(false);
      }
    };

    fetchUserRoles();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  const requiredPermissions = {
    "/Users": ["user.view", "user.add", "user.edit", "user.delete"],
    "/AddUser": ["user.add"],
    "/Roles": ["roles.view", "roles.add", "roles.edit", "roles.delete"],
    "/AddRoles": ["roles.add"],
    "/EditRoles": ["roles.edit"],
    "/ViewRole": ["roles.view"],
    "/EditUser": ["user.edit"],
    "/ViewUser": ["user.view"],
    "/Vendor": ["vendor.view", "vendor.add", "vendor.edit", "vendor.delete"],
    "/AddVendor": ["vendor.add"],
    "/EditVendor": ["vendor.edit"],
    "/ViewVendor": ["vendor.view"],
    "/Customer": [
      "franchise.view",
      "franchise.add",
      "franchise.edit",
      "franchise.delete",
    ],
    "/AddCustomer": ["franchise.add"],
    "/EditCustomer": ["franchise.edit"],
    "/ViewCustomer": ["franchise.view"],
    "/Units": ["unit.view", "unit.add", "unit.edit", "unit.delete"],
    "/ListStockTransfer": ["stock_transfer.view"],
    "/AddStockTransfer": ["stock_transfer.add"],
    "/EditStockTransfer": ["stock_transfer.edit"],
    "/ViewStockTransfer": ["stock_transfer.view"],
    "/ListStockAdjustment": ["stock_adjustment.view"],
    "/AddStockAdjustment": ["stock_adjustment.add"],
    "/ViewStockAdjustment": ["stock_adjustment.view"],
    "/ListExpense": ["expense.view"],
    "/AddExpense": ["expense.add"],
    "/ExpenseCategories": ["expense_category.view"],
    "/EditExpense": ["expense.edit"],
    "/ViewExpense": ["expense.view"],
    "/Accounts": ["account.view"],
    "/TrialBalance": ["trial_balance.view"],
    "/CashFlow": ["cash_flow.view"],
    "/PaymentReport": ["payment_report.view"],
    "/ListPaymentMethod": ["payment_method.view"],
    "/PurchaseAndSale": ["purchase_and_sale_report.view"],
    "/TaxReport": ["tax_report.view"],
    "/CustomersAndSuppliers": ["customers_and_suppliers_report.view"],
    "/StockReport": ["stock_report.view"],
    "/StockAdjustmentReport": ["stock_adjustment_report.view"],
    "/ItemReport": ["item_report.view"],
    "/ProductPurchaseReport": ["product_purchase_report.view"],
    "/ProductSellReport": ["product_sell_report.view"],
    "/PurchasePaymentReport": ["purchase_payment_report.view"],
    "/SalePaymentReport": ["sale_payment_report.view"],
    "/TaxRate": ["tax_rate.view"],
    "/BusinessDetails": ["business_details.view"],
    "/BusinessLocations": ["business_locations.view"],
    "/BusinessCategory": ["business_category.view"],
    "/Permission": ["permission.view"],
    "/ImageUpload": ["image_upload.view"],
    "/SignatureUpload": ["signature_upload.view"],
    "/ListProducts": ["product.view"],
    "/AddProducts": ["product.add"],
    "/Categories": ["category.view"],
    "/Brands": ["brand.view"],
    "/Variation": ["variation.view"],
    "/ListPurchase": ["purchase_entry.view"],
    "/ListPurchaseOrder": ["purchase_order.view"],
    "/PurchaseOrder": ["purchase_order.view"],
    "/AddPoPurchaseOrder": ["purchase_order.add"],
    "/ListPoPurchaseOrder": ["po_purchase.view"],
    "/ListDIPurchaseOrder": ["di_purchase.view"],
    "/ReturnPurchase": ["return_purchase.view"],
    "/AllSaleOrders": ["all_sale_orders.view"],
    "/ListSoSale": ["so_sale.view"],
    "/ListDISale": ["di_sale.view"],
    "/OrderList": ["view_orders.view"],
    "/SoldOrders": ["accepted_orders.view"],
    "/ViewOrders": ["view_orders.view"],
    "/AcceptedOrders": ["accepted_orders.view"],
    "/ShipOrders": ["ship_orders.view"],
    "/RejectedOrders": ["rejected_orders.view"],
    "/HRMDashboard": ["hrm.view"],
    "/CRMDashboard": ["crm.view"],
    "/LeaveType": ["hrm.view"],
    "/Leave": ["hrm.view"],
    "/Designations": ["hrm.view"],
    "/SalesTargets": ["hrm.view"],
    "/Holiday": ["hrm.view"],
    "/Department": ["hrm.view"],
    "/Attendance": ["hrm.view"],
    "/Payroll": ["hrm.view"],
    "/AllPayrolls": ["hrm.view"],
    "/payroll/view": ["hrm.view"],
    "/AddPayroll": ["hrm.view"],
    "/EditPayroll": ["hrm.view"],
    "/EditPayrolls": ["hrm.view"],
    "/AddPayment": ["hrm.view"],
    "/ViewPayrollGroups": ["hrm.view"],
    "/AllPayrollGroups": ["hrm.view"],
    "/PayComponents": ["hrm.view"],
    "/HRMSettings": ["hrm.view"],
    "/EmployeeGrievance": ["hrm.view"],
    "/NoticeBoard": ["hrm.view"],
    "/Campaigns": ["crm.view"],
    "/ContactLogin": ["crm.view"],
    "/Leads": ["crm.view"],
    "/FollowUps": ["crm.view"],
    "/ListWarrantyClaim": ["warranty_claim.view"],
    "/ListVendorWarrantyClaim": ["warranty_claim.view"],
    "/ListShippedWarrantyClaim": ["warranty_claim.view"],
    "/AddWarrantyClaim": ["warranty_claim.add"],
    "/ViewWarrantyClaim": ["warranty_claim.view"],
    "/VendorViewWarrantyClaim": ["warranty_claim.view"],
    "/ShipWarrantyClaim": ["warranty_claim.view"],
    "/AddAccount": ["account.add"],
    "/PaymentMethod": ["payment_method.view"],
    "/AccountBook": ["account.view"],
    "/Detailed": ["account.view"],
    "/DetailedPurchase": ["purchase_payment_report.view"],
    "/GroupedDate": ["payment_report.view"],
    "/ByCategory": ["item_report.view"],
    "/ByBrand": ["item_report.view"],
    "/InputTaxPurchase": ["tax_report.view"],
    "/OutputTaxSales": ["tax_report.view"],
    "/ExpenseTax": ["tax_report.view"],
    "/Dashboard": ["dashboard.view"],
    "/MyDashboard": ["employee_portal.view"],
    "/MyFaceAttendance": ["employee_portal.view"],
    "/MyAttendance": ["employee_portal.view"],
    "/MyLeave": ["employee_portal.view"],
    "/MyPayslips": ["employee_portal.view"],
    "/MyViewPayslip": ["employee_portal.view"],
    "/MyNotices": ["employee_portal.view"],
  };

  const hasPermission = (path) => {
    const requiredPermissionsList = requiredPermissions[path];
    if (!requiredPermissionsList) return true;

    // Bypass for Super Admin and Admin
    if (
      userRoles.some(
        (role) =>
          role.role?.toLowerCase() === "super admin" ||
          role.role?.toLowerCase() === "admin"
      )
    ) {
      return true;
    }

    return requiredPermissionsList.some((permission) =>
      userRoles.some((role) =>
        role.permissions.some(
          (userPermission) => userPermission.name === permission
        )
      )
    );
  };

  return (
    <BrowserRouter basename="/fumamain">
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
      />
      <div className="app-background">
        <Routes>
          {/* Employee Portal - separate login for security */}
          <Route path="/employee/login" element={<EmployeeLogin />} />
          <Route path="/employee/*" element={<EmployeeLayout />} />

          <Route
            path="*"
            element={
              <Layout userRoles={userRoles}>
                <Routes>
                  <Route path="/" element={<LoginPage />} />
                  <Route
                    path="/Dashboard"
                    element={
                      hasPermission("/Dashboard") ? (
                        <Dashboard />
                      ) : (
                        <Navigate to="/MyDashboard" />
                      )
                    }
                  />
                  <Route path="/Profile" element={<Profile />} />
                  <Route
                    path="/Users"
                    element={
                      hasPermission("/Users") ? (
                        <Users userRoles={userRoles} />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/AddUser"
                    element={
                      hasPermission("/AddUser") ? (
                        <AddUser />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/Roles"
                    element={
                      hasPermission("/Roles") ? (
                        <Roles userRoles={userRoles} />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/AddRoles"
                    element={
                      hasPermission("/AddRoles") ? (
                        <AddRoles />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/EditRoles"
                    element={
                      hasPermission("/EditRoles") ? (
                        <EditRoles />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/ViewRole"
                    element={
                      hasPermission("/ViewRole") ? (
                        <ViewRole />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/EditUser/:id"
                    element={
                      hasPermission("/EditUser") ? (
                        <EditUser />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/ViewUser/:id"
                    element={
                      hasPermission("/ViewUser") ? (
                        <ViewUser />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/Vendor"
                    element={
                      hasPermission("/Vendor") ? (
                        <Vendor userRoles={userRoles} />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/AddVendor"
                    element={
                      hasPermission("/AddVendor") ? (
                        <AddVendor />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/EditVendor/:id"
                    element={
                      hasPermission("/EditVendor") ? (
                        <EditVendor />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/ViewVendor/:id"
                    element={
                      hasPermission("/ViewVendor") ? (
                        <ViewVendor />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/Customer"
                    element={
                      hasPermission("/Customer") ? (
                        <Customer userRoles={userRoles} />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/AddCustomer"
                    element={
                      hasPermission("/AddCustomer") ? (
                        <AddCustomer />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/EditCustomer/:id"
                    element={
                      hasPermission("/EditCustomer") ? (
                        <EditCustomer />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/ViewCustomer/:id"
                    element={
                      hasPermission("/ViewCustomer") ? (
                        <ViewCustomer />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/Permission"
                    element={
                      hasPermission("/Permission") ? (
                        <Permission />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/ImageUpload"
                    element={
                      hasPermission("/ImageUpload") ? (
                        <ImageUpload />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/SignatureUpload"
                    element={
                      hasPermission("/SignatureUpload") ? (
                        <SignatureUpload />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/ListProducts"
                    element={
                      hasPermission("/ListProducts") ? (
                        <ListProducts />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/AddProducts"
                    element={
                      hasPermission("/AddProducts") ? (
                        <AddProducts />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/opening-stock/:productId"
                    element={<OpeningStockPage />}
                  />
                  <Route path="/EditList/:productId" element={<EditList />} />
                  <Route path="/ViewList/:productId" element={<ViewList />} />
                  <Route path="/PrintLabel" element={<PrintLabel />} />
                  <Route
                    path="/ProductLabel/:productId"
                    element={<ProductLabel />}
                  />
                  <Route
                    path="/Categories"
                    element={
                      hasPermission("/Categories") ? (
                        <Categories />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/Brands"
                    element={
                      hasPermission("/Brands") ? (
                        <Brands />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/Units"
                    element={
                      hasPermission("/Units") ? (
                        <Units userRoles={userRoles} />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/Variation"
                    element={
                      hasPermission("/Variation") ? (
                        <Variation />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/ListPurchase"
                    element={
                      hasPermission("/ListPurchase") ? (
                        <ListPurchase />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route path="/AddNewItem" element={<AddNewItem />} />
                  <Route path="/AddPoPurchase" element={<AddPoPurchase />} />
                  <Route path="/AddDIPurchase" element={<AddDIPurchase />} />
                  <Route path="/EditPurchase/:id" element={<EditPurchase />} />
                  <Route path="/ViewPurchase/:id" element={<ViewPurchase />} />
                  <Route
                    path="/PurchaseOrder"
                    element={
                      hasPermission("/PurchaseOrder") ? (
                        <PurchaseOrder />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/AddPoPurchaseOrder"
                    element={
                      hasPermission("/AddPoPurchaseOrder") ? (
                        <AddPoPurchaseOrder />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/ViewPoPurchaseOrder/:id"
                    element={<ViewPoPurchaseOrder />}
                  />
                  <Route
                    path="/EditPoPurchaseOrder/:id"
                    element={<EditPoPurchaseOrder />}
                  />
                  <Route
                    path="/AddDIPurchaseOrder"
                    element={<AddDIPurchaseOrder />}
                  />
                  <Route
                    path="/ListPurchaseOrder"
                    element={
                      hasPermission("/ListPurchaseOrder") ? (
                        <ListPurchaseOrder />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/ListPoPurchaseOrder"
                    element={
                      hasPermission("/ListPoPurchaseOrder") ? (
                        <ListPoPurchaseOrder />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/ListDIPurchaseOrder"
                    element={
                      hasPermission("/ListDIPurchaseOrder") ? (
                        <ListDIPurchaseOrder />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/ViewPurchaseOrder/:id"
                    element={<ViewPurchaseOrder />}
                  />
                  <Route
                    path="/ViewPurchaseReturn/:id"
                    element={<ViewPurchaseReturn />}
                  />
                  <Route
                    path="/EditPurchaseReturn/:id"
                    element={<EditPurchaseReturn />}
                  />
                  <Route
                    path="/EditDIPurchase/:id"
                    element={<EditDIPurchase />}
                  />
                  <Route
                    path="/ViewDIPurchase/:id"
                    element={<ViewDIPurchase />}
                  />
                  <Route
                    path="/EditPurchaseOrder/:id"
                    element={<EditPurchaseOrder />}
                  />
                  <Route
                    path="/ReturnPurchase"
                    element={
                      hasPermission("/ReturnPurchase") ? (
                        <ReturnPurchase />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/AddPurchaseReturn"
                    element={<AddPurchaseReturn />}
                  />
                  <Route
                    path="/AllSaleOrders"
                    element={
                      hasPermission("/AllSaleOrders") ? (
                        <AllSale />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route path="/AddSoSale" element={<AddSoSale />} />
                  <Route
                    path="/AddSoSale/:franchisePurchaseOrderId"
                    element={<AddSoSale />}
                  />
                  <Route path="/AddDISale" element={<AddDISale />} />
                  <Route
                    path="/ListSoSale"
                    element={
                      hasPermission("/ListSoSale") ? (
                        <ListSoSale />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/ListDISale"
                    element={
                      hasPermission("/ListDISale") ? (
                        <ListDISale />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route path="/ViewDISale/:id" element={<ViewDISale />} />
                  <Route path="/ViewSoSale/:id" element={<ViewSoSale />} />
                  <Route path="/EditSoSale/:id" element={<EditSoSale />} />
                  <Route path="/EditDISale/:id" element={<EditDISale />} />

                  <Route
                    path="/EditSaleReturnOrder/:id"
                    element={<EditSaleReturnOrder />}
                  />
                  <Route
                    path="/ViewSaleReturn/:id"
                    element={<ViewSaleReturn />}
                  />
                  <Route path="/SaleEntry" element={<SaleEntry />} />
                  <Route path="/SaleReturn" element={<SaleReturn />} />
                  <Route path="/ListShipReturn" element={<ListShipReturn />} />
                  <Route
                    path="/ListAcceptedReturn"
                    element={<ListAcceptedReturn />}
                  />
                  <Route
                    path="/OrderList"
                    element={
                      hasPermission("/OrderList") ? (
                        <OrderList />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/SoldOrders"
                    element={
                      hasPermission("/SoldOrders") ? (
                        <SoldOrders />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/ViewOrders"
                    element={
                      hasPermission("/ViewOrders") ? (
                        <ViewOrders />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/AcceptedOrders"
                    element={
                      hasPermission("/AcceptedOrders") ? (
                        <AcceptedOrders />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/RejectedOrders"
                    element={
                      hasPermission("/RejectedOrders") ? (
                        <RejectedOrders />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/ShipOrders"
                    element={
                      hasPermission("/ShipOrders") ? (
                        <ShipOrders />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route path="/ViewOrders/:id" element={<ViewOd />} />
                  <Route path="/EditOrders/:id" element={<EditOd />} />
                  <Route
                    path="/EditAcceptedOrder/:id"
                    element={<EditAcceptedOrder />}
                  />
                  <Route
                    path="/ViewShipOrders/:id"
                    element={<ViewShipOrders />}
                  />
                  <Route
                    path="/ListStockTransfer"
                    element={
                      hasPermission("/ListStockTransfer") ? (
                        <ListStockTransfer />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/AddStockTransfer"
                    element={
                      hasPermission("/AddStockTransfer") ? (
                        <AddStockTransfer />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/EditStockTransfer/:id"
                    element={
                      hasPermission("/EditStockTransfer") ? (
                        <EditStockTransfer />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/ViewStockTransfer/:id"
                    element={
                      hasPermission("/ViewStockTransfer") ? (
                        <ViewStockTransfer />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/AddStockAdjustment/:id"
                    element={
                      hasPermission("/AddStockAdjustment") ? (
                        <AddStockAdjustment />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/AddStockAdjustment"
                    element={
                      hasPermission("/AddStockAdjustment") ? (
                        <AddStockAdjustment />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/ViewStockAdjustment/:id"
                    element={
                      hasPermission("/ViewStockAdjustment") ? (
                        <ViewStockAdjustment />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/ListWarrantyClaim"
                    element={
                      hasPermission("/ListWarrantyClaim") ? (
                        <ListWarrantyClaim />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/ListVendorWarrantyClaim"
                    element={
                      hasPermission("/ListVendorWarrantyClaim") ? (
                        <ListVendorWarrantyClaim />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/ListShippedWarrantyClaim"
                    element={
                      hasPermission("/ListShippedWarrantyClaim") ? (
                        <ListShippedWarrantyClaim />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/AddWarrantyClaim"
                    element={
                      hasPermission("/AddWarrantyClaim") ? (
                        <AddWarrantyClaim />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/ViewWarrantyClaim/:id"
                    element={
                      hasPermission("/ViewWarrantyClaim") ? (
                        <ViewWarrantyClaim />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/VendorViewWarrantyClaim/:id"
                    element={
                      hasPermission("/VendorViewWarrantyClaim") ? (
                        <VendorViewWarrantyClaim />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/ShipWarrantyClaim/:id"
                    element={
                      hasPermission("/ShipWarrantyClaim") ? (
                        <ShipWarrantyClaim />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/ListStockAdjustment"
                    element={
                      hasPermission("/ListStockAdjustment") ? (
                        <ListStockAdjustment />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/AddExpense"
                    element={
                      hasPermission("/AddExpense") ? (
                        <AddExpense />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/EditExpense/:id"
                    element={
                      hasPermission("/EditExpense") ? (
                        <EditExpense />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/ViewExpense/:id"
                    element={
                      hasPermission("/ViewExpense") ? (
                        <ViewExpense />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/ListExpense"
                    element={
                      hasPermission("/ListExpense") ? (
                        <ListExpense />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/ExpenseCategories"
                    element={
                      hasPermission("/ExpenseCategories") ? (
                        <ExpenseCategories />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/PaymentReport"
                    element={
                      hasPermission("/PaymentReport") ? (
                        <PaymentReport />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/AddAccount"
                    element={
                      hasPermission("/AddAccount") ? (
                        <AddAccount />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/PaymentMethod"
                    element={
                      hasPermission("/PaymentMethod") ? (
                        <PaymentMethod />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/ListPaymentMethod"
                    element={
                      hasPermission("/ListPaymentMethod") ? (
                        <ListPaymentMethod />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/Accounts"
                    element={
                      hasPermission("/Accounts") ? (
                        <Accounts />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/AccountBook/:id"
                    element={
                      hasPermission("/AccountBook") ? (
                        <AccountBook />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/CashFlow"
                    element={
                      hasPermission("/CashFlow") ? (
                        <CashFlow />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/TrialBalance"
                    element={
                      hasPermission("/TrialBalance") ? (
                        <TrialBalance />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/ProductStockHistory /:id"
                    element={
                      hasPermission("/ProductStockHistory") ? (
                        <ProductStockHistory />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route path="/ListAllElement" element={<ListAllElement />} />
                  <Route
                    path="/AllFormElements"
                    element={<AllFormElements />}
                  />
                  <Route
                    path="/PurchaseAndSale"
                    element={
                      hasPermission("/PurchaseAndSale") ? (
                        <PurchaseAndSale />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/TaxReport"
                    element={
                      hasPermission("/TaxReport") ? (
                        <TaxReport />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/TaxRate"
                    element={
                      hasPermission("/TaxRate") ? (
                        <TaxRate />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route path="/Test" element={<Test />} />
                  <Route
                    path="/BusinessLocations"
                    element={
                      hasPermission("/BusinessLocations") ? (
                        <BusinessLocations />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/BusinessCategory"
                    element={
                      hasPermission("/BusinessCategory") ? (
                        <BusinessCategory />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/BusinessDetails"
                    element={
                      hasPermission("/BusinessDetails") ? (
                        <BusinessDetails />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/CustomersAndSuppliers"
                    element={
                      hasPermission("/CustomersAndSuppliers") ? (
                        <CustomersAndSuppliers />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/StockReport"
                    element={
                      hasPermission("/StockReport") ? (
                        <StockReport />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/ItemReport"
                    element={
                      hasPermission("/ItemReport") ? (
                        <ItemReport />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/StockAdjustmentReport"
                    element={
                      hasPermission("/StockAdjustmentReport") ? (
                        <StockAdjustmentReport />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/ProductPurchaseReport"
                    element={
                      hasPermission("/ProductPurchaseReport") ? (
                        <ProductPurchaseReport />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/ProductSellReport"
                    element={
                      hasPermission("/ProductSellReport") ? (
                        <ProductSellReport />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/Detailed"
                    element={
                      hasPermission("/Detailed") ? (
                        <Detailed />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/DetailedPurchase"
                    element={
                      hasPermission("/DetailedPurchase") ? (
                        <DetailedPurchase />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/GroupedDate"
                    element={
                      hasPermission("/GroupedDate") ? (
                        <GroupedDate />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/ByCategory"
                    element={
                      hasPermission("/ByCategory") ? (
                        <ByCategory />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/ByBrand"
                    element={
                      hasPermission("/ByBrand") ? (
                        <ByBrand />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/PurchasePaymentReport"
                    element={
                      hasPermission("/PurchasePaymentReport") ? (
                        <PurchasePaymentReport />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/SalePaymentReport"
                    element={
                      hasPermission("/SalePaymentReport") ? (
                        <SalePaymentReport />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />

                  <Route
                    path="/ProductStockHistory"
                    element={
                      hasPermission("/ProductStockHistory") ? (
                        <ProductStockHistory />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/InputTaxPurchase"
                    element={
                      hasPermission("/InputTaxPurchase") ? (
                        <InputTaxPurchase />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/OutputTaxSales"
                    element={
                      hasPermission("/OutputTaxSales") ? (
                        <OutputTaxSales />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/ExpenseTax"
                    element={
                      hasPermission("/ExpenseTax") ? (
                        <ExpenseTax />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/HRMDashboard"
                    element={
                      hasPermission("/HRMDashboard") ? (
                        <HRMDashboard />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/LeaveType"
                    element={
                      hasPermission("/LeaveType") ? (
                        <LeaveType />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/Leave"
                    element={
                      hasPermission("/Leave") ? (
                        <Leave />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/Designations"
                    element={
                      hasPermission("/Designations") ? (
                        <Designations />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/SalesTargets"
                    element={
                      hasPermission("/SalesTargets") ? (
                        <SalesTargets />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/Holiday"
                    element={
                      hasPermission("/Holiday") ? (
                        <Holiday />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/Department"
                    element={
                      hasPermission("/Department") ? (
                        <Department />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/Attendance"
                    element={
                      hasPermission("/Attendance") ? (
                        <Attendance />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/Payroll"
                    element={
                      hasPermission("/Payroll") ? (
                        <Payroll />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/AllPayrolls"
                    element={
                      hasPermission("/AllPayrolls") ? (
                        <AllPayrolls />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/payroll/view"
                    element={
                      hasPermission("/payroll/view") ? (
                        <ViewPayslip />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/AddPayroll"
                    element={
                      hasPermission("/AddPayroll") ? (
                        <AddPayroll />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/EditPayroll/:id"
                    element={
                      hasPermission("/EditPayroll") ? (
                        <EditPayroll />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/EditPayrolls/:id"
                    element={
                      hasPermission("/EditPayrolls") ? (
                        <EditPayrolls />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/AddPayment/:id"
                    element={
                      hasPermission("/AddPayment") ? (
                        <AddPayment />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/ViewPayrollGroups/:id"
                    element={
                      hasPermission("/ViewPayrollGroups") ? (
                        <ViewPayrollGroups />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/AllPayrollGroups"
                    element={
                      hasPermission("/AllPayrollGroups") ? (
                        <AllPayrollGroups />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/PayComponents"
                    element={
                      hasPermission("/PayComponents") ? (
                        <PayComponents />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/HRMSettings"
                    element={
                      hasPermission("/HRMSettings") ? (
                        <HRMSettings />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/EmployeeGrievance"
                    element={
                      hasPermission("/EmployeeGrievance") ? (
                        <EmployeeGrievance />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/NoticeBoard"
                    element={
                      hasPermission("/NoticeBoard") ? (
                        <NoticeBoard />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/FaceAttendance"
                    element={
                      hasPermission("/FaceAttendance") ? (
                        <FaceAttendancePage />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/WorkingHoursReport"
                    element={
                      hasPermission("/WorkingHoursReport") ? (
                        <WorkingHoursReport />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/CRMDashboard"
                    element={
                      hasPermission("/CRMDashboard") ? (
                        <CRMDashboard />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/Campaigns"
                    element={
                      hasPermission("/Campaigns") ? (
                        <Campaigns />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/ContactLogin"
                    element={
                      hasPermission("/ContactLogin") ? (
                        <ContactLogin />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/Leads"
                    element={
                      hasPermission("/Leads") ? (
                        <Leads />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/FollowUps"
                    element={
                      hasPermission("/FollowUps") ? (
                        <FollowUps />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  {/* <Route path="/" element={<div>No Access</div>} /> */}
                  <Route path="/Reporting" element={<Reporting />} />

                  {/* Employee Portal Routes (inside admin panel) */}
                  <Route
                    path="/MyDashboard"
                    element={
                      hasPermission("/MyDashboard") ? (
                        <EmployeePortalWrapper Component={EmployeeDashboard} />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/MyFaceAttendance"
                    element={
                      hasPermission("/MyFaceAttendance") ? (
                        <EmployeePortalWrapper Component={EmployeeFaceAttendance} />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/MyAttendance"
                    element={
                      hasPermission("/MyAttendance") ? (
                        <EmployeePortalWrapper Component={EmployeeMyAttendance} />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/MyLeave"
                    element={
                      hasPermission("/MyLeave") ? (
                        <EmployeePortalWrapper Component={EmployeeMyLeave} />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/MyPayslips"
                    element={
                      hasPermission("/MyPayslips") ? (
                        <EmployeePortalWrapper Component={EmployeeMyPayslips} />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/MyViewPayslip"
                    element={
                      hasPermission("/MyViewPayslip") ? (
                        <EmployeePortalWrapper Component={EmployeeViewPayslip} />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                  <Route
                    path="/MyNotices"
                    element={
                      hasPermission("/MyNotices") ? (
                        <EmployeePortalWrapper Component={EmployeeNotices} />
                      ) : (
                        <Navigate to="/" />
                      )
                    }
                  />
                </Routes>
              </Layout>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

const Layout = ({ children, userRoles }) => {
  const location = useLocation();

  const isAuthPage = location.pathname === "/" || location.pathname === "/";
  const isEmployeePortal = location.pathname.startsWith("/employee");

  if (isEmployeePortal) return null;

  return (
    <div className="wrapper">
      {!isAuthPage && (
        <>
          <Header />
          <Menu userRoles={userRoles} />
        </>
      )}
      {children}
      {!isAuthPage && <Footer />}
    </div>
  );
};

export default App;
