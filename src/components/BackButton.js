import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '@fortawesome/fontawesome-free/css/all.min.css';

const BackButton = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const getParentPath = (pathname) => {
        // Centralized mapping of child routes to parent routes
        const mapping = {
            // Vendor
            '/AddVendor': '/Vendor',
            '/EditVendor/': '/Vendor',
            '/ViewVendor/': '/Vendor',

            // Customer (Franchise)
            '/AddCustomer': '/Customer',
            '/EditCustomer/': '/Customer',
            '/ViewCustomer/': '/Customer',

            // Users
            '/AddUser': '/Users',
            '/EditUser/': '/Users',
            '/ViewUser/': '/Users',

            // Roles
            '/AddRoles': '/Roles',
            '/EditRoles': '/Roles',
            '/ViewRole': '/Roles',

            // Purchase
            '/AddPoPurchase': '/ListPoPurchaseOrder',
            '/AddDIPurchase': '/ListDIPurchaseOrder',
            '/EditPurchase/': '/ListPurchase',
            '/ViewPurchase/': '/ListPurchase',
            '/AddPoPurchaseOrder': '/ListPurchaseOrder',
            '/ViewPoPurchaseOrder/': '/ListPurchaseOrder',
            '/EditPoPurchaseOrder/': '/ListPurchaseOrder',
            '/ViewPurchaseOrder/': '/ListPurchaseOrder',
            '/EditPurchaseOrder/': '/ListPurchaseOrder',
            '/ViewPurchaseReturn/': '/ReturnPurchase',
            '/EditPurchaseReturn/': '/ReturnPurchase',
            '/EditDIPurchase/': '/ListDIPurchaseOrder',
            '/ViewDIPurchase/': '/ListDIPurchaseOrder',
            '/AddPurchaseReturn': '/ReturnPurchase',
            '/AddNewItem': '/ListPurchase',
            '/PurchaseOrder': '/ListPurchaseOrder',

            // Product
            '/AddProducts': '/ListProducts',
            '/EditList/': '/ListProducts',
            '/ViewList/': '/ListProducts',
            '/Categories': '/ListProducts',
            '/Brands': '/ListProducts',
            '/Units': '/ListProducts',
            '/Variation': '/ListProducts',
            '/PrintLabel': '/ListProducts',

            // Sale
            '/AddSoSale': '/ListSoSale',
            '/AddDISale': '/ListDISale',
            '/ViewDISale/': '/ListDISale',
            '/ViewSoSale/': '/ListSoSale',
            '/EditSoSale/': '/ListSoSale',
            '/EditDISale/': '/ListDISale',
            '/EditSaleReturnOrder/': '/SaleReturn',
            '/ViewSaleReturn/': '/SaleReturn',

            // Stock
            '/AddStockTransfer': '/ListStockTransfer',
            '/EditStockTransfer/': '/ListStockTransfer',
            '/ViewStockTransfer/': '/ListStockTransfer',
            '/AddStockAdjustment': '/ListStockAdjustment',
            '/ViewStockAdjustment/': '/ListStockAdjustment',

            // Expense
            '/AddExpense': '/ListExpense',
            '/EditExpense/': '/ListExpense',
            '/ViewExpense/': '/ListExpense',
            '/ExpenseCategories': '/Dashboard',
        };

        // Check for exact matches
        if (mapping[pathname]) return mapping[pathname];

        // Check for matches with IDs (e.g., /EditVendor/:id)
        for (const route in mapping) {
            if (route.endsWith('/') && pathname.startsWith(route)) {
                return mapping[route];
            }
        }

        // Default fallback: Try to go back one level if possible, otherwise dashboard
        return '/Dashboard';
    };

    const handleBack = () => {
        const parentPath = getParentPath(location.pathname);
        navigate(parentPath);
    };

    return (
        <button
            onClick={handleBack}
            className="btn btn-link text-dark p-0 me-3"
            style={{ fontSize: '1.5rem', verticalAlign: 'middle', textDecoration: 'none' }}
            title="Back"
        >
            <i className="fas fa-arrow-left"></i>
        </button>
    );
};

export default BackButton;
