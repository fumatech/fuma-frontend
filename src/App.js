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
import AllPayrolls from "./Pages/HRM/AllPayrolls";
import AddPayroll from "./Pages/HRM/AddPayroll";
import AllPayrollGroups from "./Pages/HRM/AllPayrollGroups";
import PayComponents from "./Pages/HRM/PayComponents";
import HRMSettings from "./Pages/HRM/HRMSettings";

import CRMDashboard from "./Pages/CRM/CRMDashboard";
import Campaigns from "./Pages/CRM/Campaigns";
import ContactLogin from "./Pages/CRM/ContactLogin";
import Leads from "./Pages/CRM/Leads";
import FollowUps from "./Pages/CRM/FollowUps";
import BusinessDetails from "./Pages/Setting/BusinessDetails";
import PrintLabel from "./Pages/Products/PrintLabel";
import ProductLabel from "./Pages/Products/ProductLabel";
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
    "/Units": ["units.view", "units.add", "units.edit", "units.delete"],
  };

  const hasPermission = (path) => {
    const requiredPermissionsList = requiredPermissions[path];
    return (
      requiredPermissionsList &&
      requiredPermissionsList.some((permission) =>
        userRoles.some((role) =>
          role.permissions.some(
            (userPermission) => userPermission.name === permission
          )
        )
      )
    );
  };

  return (
    <BrowserRouter basename="/fumamain">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
      />
      <div className="app-background">
        <Routes>
          <Route
            path="*"
            element={
              <Layout userRoles={userRoles}>
                <Routes>
                  <Route path="/" element={<LoginPage />} />
                  <Route path="/Dashboard" element={<Dashboard />} />
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
                  <Route path="/Permission" element={<Permission />} />
                  <Route path="/ImageUpload" element={<ImageUpload />} />
                  <Route path="/ListProducts" element={<ListProducts />} />
                  <Route path="/AddProducts" element={<AddProducts />} />
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
                  <Route path="/Categories" element={<Categories />} />
                  <Route path="/Brands" element={<Brands />} />
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
                  <Route path="/Variation" element={<Variation />} />
                  <Route path="/ListPurchase" element={<ListPurchase />} />
                  <Route path="/AddNewItem" element={<AddNewItem />} />
                  <Route path="/AddPoPurchase" element={<AddPoPurchase />} />
                  <Route path="/AddDIPurchase" element={<AddDIPurchase />} />
                  <Route path="/EditPurchase/:id" element={<EditPurchase />} />
                  <Route path="/ViewPurchase/:id" element={<ViewPurchase />} />
                  <Route path="/PurchaseOrder" element={<PurchaseOrder />} />
                  <Route
                    path="/AddPoPurchaseOrder"
                    element={<AddPoPurchaseOrder />}
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
                    element={<ListPurchaseOrder />}
                  />
                  <Route
                    path="/ListPoPurchaseOrder"
                    element={<ListPoPurchaseOrder />}
                  />
                  <Route
                    path="/ListDIPurchaseOrder"
                    element={<ListDIPurchaseOrder />}
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
                  <Route path="/ReturnPurchase" element={<ReturnPurchase />} />
                  <Route
                    path="/AddPurchaseReturn"
                    element={<AddPurchaseReturn />}
                  />
                  <Route path="/AllSaleOrders" element={<AllSale />} />
                  <Route path="/AddSoSale" element={<AddSoSale />} />
                  <Route
                    path="/AddSoSale/:franchisePurchaseOrderId"
                    element={<AddSoSale />}
                  />
                  <Route path="/AddDISale" element={<AddDISale />} />
                  <Route path="/ListSoSale" element={<ListSoSale />} />
                  <Route path="/ListDISale" element={<ListDISale />} />
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
                  <Route path="/OrderList" element={<OrderList />} />
                  <Route path="/SoldOrders" element={<SoldOrders />} />
                  <Route path="/ViewOrders" element={<ViewOrders />} />
                  <Route path="/AcceptedOrders" element={<AcceptedOrders />} />
                  <Route path="/RejectedOrders" element={<RejectedOrders />} />
                  <Route path="/ShipOrders" element={<ShipOrders />} />
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
                    element={<ListStockTransfer />}
                  />
                  <Route
                    path="/AddStockTransfer"
                    element={<AddStockTransfer />}
                  />
                  <Route
                    path="/AddStockAdjustment/:id"
                    element={<AddStockAdjustment />}
                  />
                  <Route
                    path="/AddStockAdjustment"
                    element={<AddStockAdjustment />}
                  />
                  <Route
                    path="/ViewStockAdjustment/:id"
                    element={<ViewStockAdjustment />}
                  />
                  <Route
                    path="/ListWarrantyClaim"
                    element={<ListWarrantyClaim />}
                  />
                  <Route
                    path="/ListVendorWarrantyClaim"
                    element={<ListVendorWarrantyClaim />}
                  />
                  <Route
                    path="/ListShippedWarrantyClaim"
                    element={<ListShippedWarrantyClaim />}
                  />
                  <Route
                    path="/AddWarrantyClaim"
                    element={<AddWarrantyClaim />}
                  />
                  <Route
                    path="/ViewWarrantyClaim/:id"
                    element={<ViewWarrantyClaim />}
                  />
                  <Route
                    path="/VendorViewWarrantyClaim/:id"
                    element={<VendorViewWarrantyClaim />}
                  />
                  <Route
                    path="/ShipWarrantyClaim/:id"
                    element={<ShipWarrantyClaim />}
                  />
                  <Route
                    path="/ListStockAdjustment"
                    element={<ListStockAdjustment />}
                  />
                  <Route path="/AddExpense" element={<AddExpense />} />
                  <Route path="/EditExpense/:id" element={<EditExpense />} />
                  <Route path="/ViewExpense/:id" element={<ViewExpense />} />
                  <Route path="/ListExpense" element={<ListExpense />} />
                  <Route
                    path="/ExpenseCategories"
                    element={<ExpenseCategories />}
                  />
                  <Route path="/PaymentReport" element={<PaymentReport />} />
                  <Route path="/AddAccount" element={<AddAccount />} />
                  <Route path="/PaymentMethod" element={<PaymentMethod />} />
                  <Route
                    path="/ListPaymentMethod"
                    element={<ListPaymentMethod />}
                  />
                  <Route path="/Accounts" element={<Accounts />} />
                  <Route path="/AccountBook/:id" element={<AccountBook />} />
                  <Route path="/CashFlow" element={<CashFlow />} />
                  <Route path="/TrialBalance" element={<TrialBalance />} />
                  <Route
                    path="/ProductStockHistory /:id"
                    element={<ProductStockHistory />}
                  />
                  <Route path="/ListAllElement" element={<ListAllElement />} />
                  <Route
                    path="/AllFormElements"
                    element={<AllFormElements />}
                  />
                  <Route
                    path="/PurchaseAndSale"
                    element={<PurchaseAndSale />}
                  />
                  <Route path="/TaxReport" element={<TaxReport />} />
                  <Route path="/TaxRate" element={<TaxRate />} />
                  <Route path="/Test" element={<Test />} />
                  <Route
                    path="/BusinessLocations"
                    element={<BusinessLocations />}
                  />
                  <Route
                    path="/BusinessCategory"
                    element={<BusinessCategory />}
                  />
                  <Route
                    path="/BusinessDetails"
                    element={<BusinessDetails />}
                  />
                  <Route
                    path="/CustomersAndSuppliers"
                    element={<CustomersAndSuppliers />}
                  />
                  <Route path="/StockReport" element={<StockReport />} />
                  <Route path="/ItemReport" element={<ItemReport />} />
                  <Route
                    path="/StockAdjustmentReport"
                    element={<StockAdjustmentReport />}
                  />
                  <Route
                    path="/ProductPurchaseReport"
                    element={<ProductPurchaseReport />}
                  />
                  <Route
                    path="/ProductSellReport"
                    element={<ProductSellReport />}
                  />
                  <Route path="/Detailed" element={<Detailed />} />
                  <Route
                    path="/DetailedPurchase"
                    element={<DetailedPurchase />}
                  />
                  <Route path="/GroupedDate" element={<GroupedDate />} />
                  <Route path="/ByCategory" element={<ByCategory />} />
                  <Route path="/ByBrand" element={<ByBrand />} />
                  <Route
                    path="/PurchasePaymentReport"
                    element={<PurchasePaymentReport />}
                  />
                  <Route
                    path="/SalePaymentReport"
                    element={<SalePaymentReport />}
                  />

                  <Route
                    path="/ProductStockHistory"
                    element={<ProductStockHistory />}
                  />
                  <Route
                    path="/InputTaxPurchase"
                    element={<InputTaxPurchase />}
                  />
                  <Route path="/OutputTaxSales" element={<OutputTaxSales />} />
                  <Route path="/ExpenseTax" element={<ExpenseTax />} />
                  <Route path="/HRMDashboard" element={<HRMDashboard />} />
                  <Route path="/LeaveType" element={<LeaveType />} />
                  <Route path="/Leave" element={<Leave />} />
                  <Route path="/Designations" element={<Designations />} />
                  <Route path="/SalesTargets" element={<SalesTargets />} />
                  <Route path="/Holiday" element={<Holiday />} />
                  <Route path="/Department" element={<Department />} />
                  <Route path="/Attendance" element={<Attendance />} />
                  <Route path="/Payroll" element={<Payroll />} />
                  <Route path="/AllPayrolls" element={<AllPayrolls />} />
                  <Route path="/AddPayroll" element={<AddPayroll />} />
                  <Route
                    path="/AllPayrollGroups"
                    element={<AllPayrollGroups />}
                  />
                  <Route path="/PayComponents" element={<PayComponents />} />
                  <Route path="/HRMSettings" element={<HRMSettings />} />
                  <Route path="/CRMDashboard" element={<CRMDashboard />} />
                  <Route path="/Campaigns" element={<Campaigns />} />
                  <Route path="/ContactLogin" element={<ContactLogin />} />
                  <Route path="/Leads" element={<Leads />} />
                  <Route path="/FollowUps" element={<FollowUps />} />
                  {/* <Route path="/" element={<div>No Access</div>} /> */}
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

  return (
    <>
      {!isAuthPage && (
        <>
          <Header />
          <Menu userRoles={userRoles} />
        </>
      )}
      <div className="wrapper">{children}</div>
      {!isAuthPage && <Footer />}
    </>
  );
};

export default App;
