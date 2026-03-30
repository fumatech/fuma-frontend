import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";

const STATUS_OPTIONS = ["DRAFT", "SENT", "VIEWED", "APPROVED"];
const ITEM_TYPES = ["PRODUCT", "SERVICE"];
const DISCOUNT_TYPES = ["NONE", "PERCENT", "AMOUNT"];

const formatDateInput = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const todayDate = () => formatDateInput(new Date());

const addDays = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return formatDateInput(d);
};

const toNum = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const getCustomerName = (customer) => {
  if (!customer) return "-";
  const fullName = `${customer.firstname || customer.firstName || ""} ${customer.lastname || customer.lastName || ""}`.trim();
  return customer.franchiseName || fullName || customer.name || `Customer #${customer.id}`;
};

const getCustomerPhone = (customer) =>
  customer?.mobileNumber || customer?.phone || customer?.contactNo || customer?.mobile || "-";

const getCustomerEmail = (customer) =>
  customer?.email || customer?.emailId || customer?.primaryEmail || "-";

const getCustomerAddress = (customer) => {
  const parts = [
    customer?.permanentAddress,
    customer?.address,
    customer?.city,
    customer?.state,
    customer?.zipCode,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "-";
};

const pickProductPrice = (product) => {
  const candidate =
    product?.defaultSellingPrice ??
    product?.defaultPurchasePriceExcTax ??
    product?.sellingPrice ??
    product?.price ??
    product?.unitPrice ??
    product?.mrp;

  if (candidate !== undefined && candidate !== null && candidate !== "") {
    return toNum(candidate);
  }

  const variationPrice =
    product?.productVariations?.[0]?.defaultSellingPrice ??
    product?.productVariations?.[0]?.defaultPurchasePriceExcTax;

  return toNum(variationPrice);
};

const getAllowedStatusTransitions = (status) => {
  if (status === "DRAFT") return ["SENT", "APPROVED"];
  if (status === "SENT") return ["VIEWED", "DRAFT"];
  if (status === "VIEWED") return ["APPROVED"];
  return [];
};

const createEmptyItem = () => ({
  itemType: "PRODUCT",
  itemId: "",
  description: "",
  quantity: 1,
  unitPrice: 0,
  discountType: "NONE",
  discountValue: 0,
  taxRate: 0,
});

// Removed fullscreen styles
const QuotationProposalGenerator = ({ mode = "all" }) => {
  const baseUrl = process.env.REACT_APP_BASE_URL;
  const userEmail = sessionStorage.getItem("userEmail") || "";
  const navigate = useNavigate();
  const location = useLocation();
  const routeInitKeyRef = useRef("");
  const isCreateMode = mode === "create";
  const isListMode = mode === "list";
  const isRouteDriven = isCreateMode || isListMode;

  const [loading, setLoading] = useState(true);
  const [quotations, setQuotations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const [filters, setFilters] = useState({
    customerId: "",
    status: "",
    dateFrom: "",
    dateTo: "",
    search: "",
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    customerId: "",
    issueDate: todayDate(),
    validTill: addDays(7),
    currency: "INR",
    reference: "",
    subject: "",
    notes: "",
    terms: "",
    internalRemarks: "",
    items: [createEmptyItem()],
  });

  const [statusModal, setStatusModal] = useState({
    open: false,
    quotation: null,
    toStatus: "",
    comment: "",
  });
  const [historyModal, setHistoryModal] = useState({
    open: false,
    quotation: null,
    rows: [],
    loading: false,
  });
  const [documentModal, setDocumentModal] = useState({
    open: false,
    payload: null,
    loading: false,
  });

  const customerMap = useMemo(
    () => Object.fromEntries((customers || []).map((c) => [String(c.id), c])),
    [customers]
  );

  const productOptions = useMemo(
    () =>
      (products || []).map((product) => ({
        id: product.id,
        label: `${product.productName || product.name || "Product"}${product.sku ? ` (${product.sku})` : ""}`,
        price: pickProductPrice(product),
      })),
    [products]
  );

  const lineTotals = useMemo(() => {
    return (formData.items || []).map((item) => {
      const qty = Math.max(0, toNum(item.quantity));
      const price = Math.max(0, toNum(item.unitPrice));
      const sub = qty * price;

      let disc = 0;
      if (item.discountType === "PERCENT") {
        const pct = Math.min(100, Math.max(0, toNum(item.discountValue)));
        disc = (sub * pct) / 100;
      } else if (item.discountType === "AMOUNT") {
        disc = Math.min(sub, Math.max(0, toNum(item.discountValue)));
      }

      const taxable = Math.max(0, sub - disc);
      const tax = (taxable * Math.max(0, toNum(item.taxRate))) / 100;
      const total = taxable + tax;
      return { sub, disc, tax, total };
    });
  }, [formData.items]);

  const headerTotals = useMemo(() => {
    const totals = lineTotals.reduce(
      (acc, row) => {
        acc.subtotal += row.sub;
        acc.discountTotal += row.disc;
        acc.taxTotal += row.tax;
        acc.grandTotal += row.total;
        return acc;
      },
      { subtotal: 0, discountTotal: 0, taxTotal: 0, grandTotal: 0 }
    );
    return totals;
  }, [lineTotals]);

  const selectedCustomer = formData.customerId
    ? customerMap[String(formData.customerId)]
    : null;
  const routeEditId = useMemo(() => {
    if (!isCreateMode) return "";
    return new URLSearchParams(location.search).get("edit") || "";
  }, [isCreateMode, location.search]);

  const fetchMasterData = async () => {
    try {
      const [customerRes, productRes] = await Promise.all([
        axios.get(`${baseUrl}/customer/getall`),
        axios
          .get(`${baseUrl}/product/getallactive`)
          .catch(() => axios.get(`${baseUrl}/product/getall`)),
      ]);
      setCustomers(customerRes.data || []);
      setProducts(productRes.data || []);
    } catch (error) {
      console.error("Error fetching master data:", error);
      toast.error("Failed to load customers/products for quotation");
    }
  };

  const fetchQuotations = async (nextFilters = filters) => {
    try {
      setLoading(true);
      const params = {};
      if (nextFilters.customerId) params.customerId = Number(nextFilters.customerId);
      if (nextFilters.status) params.status = nextFilters.status;
      if (nextFilters.dateFrom) params.dateFrom = nextFilters.dateFrom;
      if (nextFilters.dateTo) params.dateTo = nextFilters.dateTo;
      if (nextFilters.search) params.search = nextFilters.search;

      const response = await axios.get(`${baseUrl}/quotation/getall`, { params });
      setQuotations(response.data || []);
    } catch (error) {
      console.error("Error fetching quotations:", error);
      toast.error("Failed to load quotation list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const boot = async () => {
      await fetchMasterData();
      await fetchQuotations();
    };
    boot();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      customerId: "",
      issueDate: todayDate(),
      validTill: addDays(7),
      currency: "INR",
      reference: "",
      subject: "",
      notes: "",
      terms: "",
      internalRemarks: "",
      items: [createEmptyItem()],
    });
  };

  const openCreate = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEdit = async (quotationId) => {
    try {
      const response = await axios.get(`${baseUrl}/quotation/get/${quotationId}`);
      const q = response.data;
      setEditingId(quotationId);
      setFormData({
        customerId: q.customerId ? String(q.customerId) : "",
        issueDate: q.issueDate || todayDate(),
        validTill: q.validTill || addDays(7),
        currency: q.currency || "INR",
        reference: q.reference || "",
        subject: q.subject || "",
        notes: q.notes || "",
        terms: q.terms || "",
        internalRemarks: q.internalRemarks || "",
        items: (q.items || []).length
          ? q.items.map((item) => ({
            itemType: item.itemType || "PRODUCT",
            itemId: item.itemId ? String(item.itemId) : "",
            description: item.description || "",
            quantity: toNum(item.quantity),
            unitPrice: toNum(item.unitPrice),
            discountType: item.discountType || "NONE",
            discountValue: toNum(item.discountValue),
            taxRate: toNum(item.taxRate),
          }))
          : [createEmptyItem()],
      });
      setFormOpen(true);
    } catch (error) {
      console.error("Error opening quotation:", error);
      toast.error("Failed to open quotation");
    }
  };

  const closeForm = () => {
    setFormOpen(false);
    if (isCreateMode) {
      navigate("/sales/quotation-list");
    }
  };

  const handleOpenCreate = () => {
    if (isRouteDriven) {
      navigate("/sales/create-quotation");
      return;
    }
    openCreate();
  };

  const handleOpenEdit = (quotationId) => {
    if (isRouteDriven) {
      navigate(`/sales/create-quotation?edit=${quotationId}`);
      return;
    }
    openEdit(quotationId);
  };

  useEffect(() => {
    if (!isCreateMode) return;
    const initKey = `create:${location.search || ""}`;
    if (routeInitKeyRef.current === initKey) return;
    routeInitKeyRef.current = initKey;

    if (routeEditId) {
      openEdit(routeEditId);
      return;
    }
    openCreate();
  }, [isCreateMode, location.search, routeEditId]);

  useEffect(() => {
    // Reset formOpen if we switch to list mode from create mode routing
    if (isListMode && isRouteDriven) {
      setFormOpen(false);
      setEditingId(null);
    }
  }, [isListMode, isRouteDriven]);

  const duplicateQuotation = async (quotationId) => {
    try {
      await axios.post(
        `${baseUrl}/quotation/duplicate/${quotationId}`,
        {},
        { headers: { "X-User-Email": userEmail } }
      );
      toast.success("Quotation duplicated");
      fetchQuotations();
    } catch (error) {
      console.error("Error duplicating quotation:", error);
      toast.error(error?.response?.data?.message || "Failed to duplicate quotation");
    }
  };

  const openStatusModal = (quotation) => {
    const allowed = getAllowedStatusTransitions(quotation.status);
    setStatusModal({
      open: true,
      quotation,
      toStatus: allowed[0] || "",
      comment: "",
    });
  };

  const applyStatusChange = async () => {
    if (!statusModal.quotation || !statusModal.toStatus) return;
    try {
      await axios.post(
        `${baseUrl}/quotation/status/${statusModal.quotation.id}`,
        { toStatus: statusModal.toStatus, comment: statusModal.comment || "" },
        { headers: { "X-User-Email": userEmail } }
      );
      toast.success("Quotation status updated");
      setStatusModal({ open: false, quotation: null, toStatus: "", comment: "" });
      fetchQuotations();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(error?.response?.data?.message || "Failed to update status");
    }
  };

  const openHistory = async (quotation) => {
    setHistoryModal({ open: true, quotation, rows: [], loading: true });
    try {
      const response = await axios.get(`${baseUrl}/quotation/history/${quotation.id}`);
      setHistoryModal({
        open: true,
        quotation,
        rows: response.data || [],
        loading: false,
      });
    } catch (error) {
      console.error("Error fetching history:", error);
      setHistoryModal({ open: true, quotation, rows: [], loading: false });
      toast.error("Failed to load status history");
    }
  };

  const openDocument = async (quotation) => {
    setDocumentModal({ open: true, payload: null, loading: true });
    try {
      const response = await axios.get(`${baseUrl}/quotation/document/${quotation.id}`);
      setDocumentModal({ open: true, payload: response.data, loading: false });
    } catch (error) {
      console.error("Error loading document data:", error);
      setDocumentModal({ open: true, payload: null, loading: false });
      toast.error("Failed to load quotation document");
    }
  };

  const updateFormField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const updateItem = (index, name, value) => {
    setFormData((prev) => {
      const next = [...prev.items];
      next[index] = { ...next[index], [name]: value };

      if (name === "itemType" && value === "SERVICE") {
        next[index].itemId = "";
      }

      if (name === "itemId" && next[index].itemType === "PRODUCT") {
        const product = productOptions.find((p) => String(p.id) === String(value));
        if (product) {
          if (!next[index].description) next[index].description = product.label;
          next[index].unitPrice = product.price;
        }
      }

      return { ...prev, items: next };
    });
  };

  const addItem = () => {
    setFormData((prev) => ({ ...prev, items: [...prev.items, createEmptyItem()] }));
  };

  const removeItem = (index) => {
    setFormData((prev) => {
      const next = prev.items.filter((_, i) => i !== index);
      return { ...prev, items: next.length ? next : [createEmptyItem()] };
    });
  };

  const validateForm = () => {
    if (!formData.customerId) return "Please select a customer";
    if (!formData.issueDate) return "Issue date is required";
    if (!formData.validTill) return "Valid till date is required";
    if (new Date(formData.validTill) < new Date(formData.issueDate)) {
      return "Valid till date cannot be before issue date";
    }
    if (!(formData.items || []).length) return "At least one item is required";

    for (let i = 0; i < formData.items.length; i += 1) {
      const item = formData.items[i];
      if (!ITEM_TYPES.includes(item.itemType)) return `Row ${i + 1}: invalid item type`;
      if (item.itemType === "PRODUCT" && !item.itemId) return `Row ${i + 1}: select a product`;
      if (!item.description) return `Row ${i + 1}: description is required`;
      if (toNum(item.quantity) <= 0) return `Row ${i + 1}: quantity must be greater than zero`;
      if (toNum(item.unitPrice) < 0) return `Row ${i + 1}: unit price cannot be negative`;
      if (item.discountType === "PERCENT" && toNum(item.discountValue) > 100) {
        return `Row ${i + 1}: discount percent cannot exceed 100`;
      }
    }
    return "";
  };

  const submitQuotation = async () => {
    const validationError = validateForm();
    if (validationError) {
      toast.warning(validationError);
      return;
    }

    const payload = {
      customerId: Number(formData.customerId),
      issueDate: formData.issueDate,
      validTill: formData.validTill,
      currency: formData.currency || "INR",
      reference: formData.reference || "",
      subject: formData.subject || "",
      notes: formData.notes || "",
      terms: formData.terms || "",
      internalRemarks: formData.internalRemarks || "",
      items: formData.items.map((item) => ({
        itemType: item.itemType,
        itemId: item.itemType === "PRODUCT" ? Number(item.itemId) : null,
        description: item.description,
        quantity: toNum(item.quantity),
        unitPrice: toNum(item.unitPrice),
        discountType: item.discountType,
        discountValue: toNum(item.discountValue),
        taxRate: toNum(item.taxRate),
      })),
    };

    try {
      if (editingId) {
        await axios.put(`${baseUrl}/quotation/update/${editingId}`, payload, {
          headers: { "X-User-Email": userEmail },
        });
        toast.success("Quotation updated");
      } else {
        await axios.post(`${baseUrl}/quotation/save`, payload, {
          headers: { "X-User-Email": userEmail },
        });
        toast.success("Quotation created");
      }
      setFormOpen(false);
      resetForm();
      fetchQuotations();
      if (isCreateMode) {
        navigate("/sales/quotation-list");
      }
    } catch (error) {
      console.error("Error saving quotation:", error);
      toast.error(error?.response?.data?.message || "Failed to save quotation");
    }
  };

  const filterAndSearch = () => {
    fetchQuotations(filters);
  };

  const formHeaderClass = isCreateMode
    ? "d-flex justify-content-between align-items-center px-3 py-2 border-bottom"
    : "modal-header";
  const formBodyClass = isCreateMode ? "px-3 py-3 flex-grow-1 overflow-auto" : "modal-body";
  const formFooterClass = isCreateMode
    ? "d-flex justify-content-end px-3 py-2 border-top"
    : "modal-footer";

  const quotationFormContent = (
    <>
      {isCreateMode ? (
        <></> // No header needed, we use the page's main h1 header
      ) : (
        <div className={formHeaderClass}>
          <h5 className="modal-title">{editingId ? "Edit Quotation" : "Create Quotation"}</h5>
          <button className="close" type="button" onClick={closeForm}>
            <span>&times;</span>
          </button>
        </div>
      )}
      <div className={formBodyClass}>
        <div className="row">
          <div className="col-md-4 form-group">
            <label>Customer</label>
            <select
              className="form-control"
              value={formData.customerId}
              onChange={(e) => updateFormField("customerId", e.target.value)}
            >
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {getCustomerName(c)}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2 form-group">
            <label>Issue Date</label>
            <input
              type="date"
              className="form-control"
              value={formData.issueDate}
              onChange={(e) => updateFormField("issueDate", e.target.value)}
            />
          </div>
          <div className="col-md-2 form-group">
            <label>Valid Till</label>
            <input
              type="date"
              className="form-control"
              value={formData.validTill}
              onChange={(e) => updateFormField("validTill", e.target.value)}
            />
          </div>
          <div className="col-md-2 form-group">
            <label>Currency</label>
            <input
              type="text"
              className="form-control"
              value={formData.currency}
              onChange={(e) => updateFormField("currency", e.target.value)}
            />
          </div>
          <div className="col-md-2 form-group">
            <label>Reference</label>
            <input
              type="text"
              className="form-control"
              value={formData.reference}
              onChange={(e) => updateFormField("reference", e.target.value)}
            />
          </div>
        </div>

        {selectedCustomer && (
          <div className="alert alert-light border p-2">
            <strong>Customer Details:</strong>{" "}
            {getCustomerName(selectedCustomer)} | {getCustomerPhone(selectedCustomer)} |{" "}
            {getCustomerEmail(selectedCustomer)} | {getCustomerAddress(selectedCustomer)}
          </div>
        )}
        <div className="row">
          <div className="col-md-6 form-group">
            <label>Subject</label>
            <input
              type="text"
              className="form-control"
              value={formData.subject}
              onChange={(e) => updateFormField("subject", e.target.value)}
            />
          </div>
          <div className="col-md-6 form-group">
            <label>Terms</label>
            <input
              type="text"
              className="form-control"
              value={formData.terms}
              onChange={(e) => updateFormField("terms", e.target.value)}
            />
          </div>
        </div>

        <div className="table-responsive mt-2">
          <table className="table table-bordered">
            <thead>
              <tr>
                <th style={{ minWidth: "120px" }}>Type</th>
                <th style={{ minWidth: "200px" }}>Product/Service</th>
                <th>Description</th>
                <th style={{ width: "90px" }}>Qty</th>
                <th style={{ width: "120px" }}>Price</th>
                <th style={{ width: "130px" }}>Discount Type</th>
                <th style={{ width: "120px" }}>Discount</th>
                <th style={{ width: "110px" }}>Tax %</th>
                <th style={{ width: "120px" }}>Line Total</th>
                <th style={{ width: "80px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {formData.items.map((item, idx) => (
                <tr key={`item-${idx}`}>
                  <td>
                    <select
                      className="form-control"
                      value={item.itemType}
                      onChange={(e) => updateItem(idx, "itemType", e.target.value)}
                    >
                      {ITEM_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {item.itemType === "PRODUCT" ? (
                      <select
                        className="form-control"
                        value={item.itemId}
                        onChange={(e) => updateItem(idx, "itemId", e.target.value)}
                      >
                        <option value="">Select product</option>
                        {productOptions.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Service name"
                        value={item.description}
                        onChange={(e) => updateItem(idx, "description", e.target.value)}
                      />
                    )}
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-control"
                      value={item.description}
                      onChange={(e) => updateItem(idx, "description", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
                    />
                  </td>
                  <td>
                    <select
                      className="form-control"
                      value={item.discountType}
                      onChange={(e) => updateItem(idx, "discountType", e.target.value)}
                    >
                      {DISCOUNT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      value={item.discountValue}
                      onChange={(e) => updateItem(idx, "discountValue", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      value={item.taxRate}
                      onChange={(e) => updateItem(idx, "taxRate", e.target.value)}
                    />
                  </td>
                  <td className="text-right align-middle">
                    Rs {lineTotals[idx]?.total?.toFixed(2) || "0.00"}
                  </td>
                  <td>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => removeItem(idx)}>
                      <i className="fa fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button className="btn btn-outline-primary btn-sm mb-3" onClick={addItem}>
          + Add Line Item
        </button>

        <div className="row">
          <div className="col-md-4 form-group">
            <label>Notes</label>
            <textarea
              className="form-control"
              rows="2"
              value={formData.notes}
              onChange={(e) => updateFormField("notes", e.target.value)}
            />
          </div>
          <div className="col-md-4 form-group">
            <label>Internal Remarks</label>
            <textarea
              className="form-control"
              rows="2"
              value={formData.internalRemarks}
              onChange={(e) => updateFormField("internalRemarks", e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <div className="border rounded p-2 h-100">
              <div className="d-flex justify-content-between">
                <span>Subtotal</span>
                <strong>Rs {headerTotals.subtotal.toFixed(2)}</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span>Discount</span>
                <strong>Rs {headerTotals.discountTotal.toFixed(2)}</strong>
              </div>
              <div className="d-flex justify-content-between">
                <span>Tax</span>
                <strong>Rs {headerTotals.taxTotal.toFixed(2)}</strong>
              </div>
              <hr className="my-2" />
              <div className="d-flex justify-content-between">
                <span>Grand Total</span>
                <strong>Rs {headerTotals.grandTotal.toFixed(2)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={formFooterClass}>
        <button className="btn btn-secondary me-2" onClick={closeForm}>
          {isCreateMode ? "Cancel" : "Close"}
        </button>
        <button className="btn btn-primary" onClick={submitQuotation}>
          {editingId ? "Update Quotation" : "Save Quotation"}
        </button>
      </div>
    </>
  );

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <div className="quotation-proposal-generator">
          <section className="content-header">
            <div className="container-fluid px-3">
              <h1>
                {isCreateMode
                  ? (routeEditId ? "Edit Quotation" : "Create Quotation")
                  : (isListMode ? "Quotation List" : "Quotation & Proposal Generator")}
              </h1>
              {!isCreateMode && (
                <p className="text-muted mb-3">
                  {isListMode
                    ? "Review quotations with filters, status, and quick actions."
                    : "Create quotations quickly with customer auto-fill, product pricing, live totals, and status tracking."}
                </p>
              )}
            </div>
          </section>

          <section className="content">
            <div className="container-fluid px-3">
              {!isCreateMode && (
                <>
                  <div className="card cardHover rounded-4 border-0 p-3 mb-3">
                    <div className="row g-2 align-items-end">
                      <div className="col-md-2">
                        <label className="form-label mb-1">Customer</label>
                        <select
                          className="form-control"
                          value={filters.customerId}
                          onChange={(e) =>
                            setFilters((prev) => ({ ...prev, customerId: e.target.value }))
                          }
                        >
                          <option value="">All Customers</option>
                          {customers.map((c) => (
                            <option key={c.id} value={c.id}>
                              {getCustomerName(c)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-2">
                        <label className="form-label mb-1">Status</label>
                        <select
                          className="form-control"
                          value={filters.status}
                          onChange={(e) =>
                            setFilters((prev) => ({ ...prev, status: e.target.value }))
                          }
                        >
                          <option value="">All Status</option>
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-2">
                        <label className="form-label mb-1">From</label>
                        <input
                          type="date"
                          className="form-control"
                          value={filters.dateFrom}
                          onChange={(e) =>
                            setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))
                          }
                        />
                      </div>
                      <div className="col-md-2">
                        <label className="form-label mb-1">To</label>
                        <input
                          type="date"
                          className="form-control"
                          value={filters.dateTo}
                          onChange={(e) =>
                            setFilters((prev) => ({ ...prev, dateTo: e.target.value }))
                          }
                        />
                      </div>
                      <div className="col-md-2">
                        <label className="form-label mb-1">Search</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Quote no, subject..."
                          value={filters.search}
                          onChange={(e) =>
                            setFilters((prev) => ({ ...prev, search: e.target.value }))
                          }
                        />
                      </div>
                      <div className="col-md-2 d-flex">
                        <button className="btn btn-primary w-100 mr-2" onClick={filterAndSearch}>
                          Apply
                        </button>
                        <button className="btn btn-success w-100" onClick={handleOpenCreate}>
                          Create New
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="card cardHover rounded-4 border-0 p-3">
                    <h5 className="mb-3">Quotations</h5>
                    {loading ? (
                      <div className="text-muted">Loading quotations...</div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-bordered table-striped">
                          <thead>
                            <tr>
                              <th>Quotation #</th>
                              <th>Customer</th>
                              <th>Issue Date</th>
                              <th>Valid Till</th>
                              <th>Status</th>
                              <th>Total</th>
                              <th>Updated</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(quotations || []).length ? (
                              quotations.map((q) => {
                                const customer = customerMap[String(q.customerId)];
                                const allowed = getAllowedStatusTransitions(q.status);
                                return (
                                  <tr key={q.id}>
                                    <td>{q.quotationNo}</td>
                                    <td>{customer ? getCustomerName(customer) : `Customer #${q.customerId}`}</td>
                                    <td>{q.issueDate || "-"}</td>
                                    <td>{q.validTill || "-"}</td>
                                    <td>
                                      <span className="badge badge-light border">{q.status}</span>
                                    </td>
                                    <td>Rs {Number(q.grandTotal || 0).toLocaleString()}</td>
                                    <td>{q.updatedAt ? String(q.updatedAt).replace("T", " ").slice(0, 19) : "-"}</td>
                                    <td>
                                      <div className="d-flex flex-wrap" style={{ gap: "6px" }}>
                                        <button className="btn btn-sm btn-outline-primary" onClick={() => handleOpenEdit(q.id)}>
                                          Edit
                                        </button>
                                        <button className="btn btn-sm btn-outline-secondary" onClick={() => duplicateQuotation(q.id)}>
                                          Duplicate
                                        </button>
                                        <button
                                          className="btn btn-sm btn-outline-warning"
                                          onClick={() => openStatusModal(q)}
                                          disabled={!allowed.length}
                                        >
                                          Status
                                        </button>
                                        <button className="btn btn-sm btn-outline-info" onClick={() => openHistory(q)}>
                                          History
                                        </button>
                                        <button className="btn btn-sm btn-outline-dark" onClick={() => openDocument(q)}>
                                          Document
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan={8} className="text-center">
                                  No quotations found
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </section>

          {isCreateMode && formOpen && (
            <section className="content">
              <div className="container-fluid px-3">
                <div
                  className="card card-default rounded-4 border-0 cardHover"
                >
                  {quotationFormContent}
                </div>
              </div>
            </section>
          )}

          {!isCreateMode && formOpen && typeof document !== "undefined" && createPortal(
            <div className="modal-overlay" style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1040 }}>
              <div className="modal d-block" tabIndex="-1">
                <div className="modal-dialog modal-xl modal-dialog-scrollable" style={{ maxWidth: "90%" }}>
                  <div className="modal-content" style={{ maxHeight: "90vh" }}>
                    {quotationFormContent}
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}

          {statusModal.open && (
            <div className="modal-overlay">
              <div className="modal d-block">
                <div className="modal-dialog">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">Update Status</h5>
                      <button
                        className="close"
                        type="button"
                        onClick={() =>
                          setStatusModal({
                            open: false,
                            quotation: null,
                            toStatus: "",
                            comment: "",
                          })
                        }
                      >
                        <span>&times;</span>
                      </button>
                    </div>
                    <div className="modal-body">
                      <p className="mb-2">
                        Quotation: <strong>{statusModal.quotation?.quotationNo}</strong>
                      </p>
                      <div className="form-group">
                        <label>Change To</label>
                        <select
                          className="form-control"
                          value={statusModal.toStatus}
                          onChange={(e) =>
                            setStatusModal((prev) => ({
                              ...prev,
                              toStatus: e.target.value,
                            }))
                          }
                        >
                          <option value="">Select status</option>
                          {getAllowedStatusTransitions(statusModal.quotation?.status).map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Comment</label>
                        <textarea
                          className="form-control"
                          rows="2"
                          value={statusModal.comment}
                          onChange={(e) =>
                            setStatusModal((prev) => ({
                              ...prev,
                              comment: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button
                        className="btn btn-secondary"
                        onClick={() =>
                          setStatusModal({
                            open: false,
                            quotation: null,
                            toStatus: "",
                            comment: "",
                          })
                        }
                      >
                        Close
                      </button>
                      <button className="btn btn-primary" onClick={applyStatusChange}>
                        Update
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {historyModal.open && (
            <div className="modal-overlay">
              <div className="modal d-block">
                <div className="modal-dialog modal-lg">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">
                        Status History: {historyModal.quotation?.quotationNo}
                      </h5>
                      <button
                        className="close"
                        type="button"
                        onClick={() =>
                          setHistoryModal({
                            open: false,
                            quotation: null,
                            rows: [],
                            loading: false,
                          })
                        }
                      >
                        <span>&times;</span>
                      </button>
                    </div>
                    <div className="modal-body">
                      {historyModal.loading ? (
                        <p className="text-muted">Loading history...</p>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-bordered table-striped">
                            <thead>
                              <tr>
                                <th>From</th>
                                <th>To</th>
                                <th>Comment</th>
                                <th>Changed By</th>
                                <th>Changed At</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(historyModal.rows || []).length ? (
                                historyModal.rows.map((row, index) => (
                                  <tr key={`${row.changedAt}-${index}`}>
                                    <td>{row.fromStatus || "-"}</td>
                                    <td>{row.toStatus || "-"}</td>
                                    <td>{row.comment || "-"}</td>
                                    <td>{row.changedBy || "-"}</td>
                                    <td>
                                      {row.changedAt
                                        ? String(row.changedAt).replace("T", " ").slice(0, 19)
                                        : "-"}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={5} className="text-center">
                                    No history found
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {documentModal.open && (
            <div className="modal-overlay">
              <div
                className="modal d-block"
                style={{ maxWidth: "1000px", margin: "20px auto" }}
              >
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Quotation Document Preview</h5>
                    <button
                      className="close"
                      type="button"
                      onClick={() =>
                        setDocumentModal({ open: false, payload: null, loading: false })
                      }
                    >
                      <span>&times;</span>
                    </button>
                  </div>
                  <div className="modal-body">
                    {documentModal.loading ? (
                      <p className="text-muted">Loading document...</p>
                    ) : documentModal.payload?.quotation ? (
                      <>
                        <div className="d-flex justify-content-between mb-3">
                          <div>
                            <h4 className="mb-1">Fuma</h4>
                            <div className="text-muted">Quotation / Proposal</div>
                          </div>
                          <div className="text-right">
                            <div>
                              <strong>{documentModal.payload.quotation.quotationNo}</strong>
                            </div>
                            <div>Issue: {documentModal.payload.quotation.issueDate || "-"}</div>
                            <div>
                              Valid Till: {documentModal.payload.quotation.validTill || "-"}
                            </div>
                          </div>
                        </div>

                        <div className="border rounded p-2 mb-3">
                          <strong>Customer:</strong>{" "}
                          {getCustomerName(
                            customerMap[String(documentModal.payload.quotation.customerId)]
                          )}
                        </div>

                        <div className="table-responsive">
                          <table className="table table-bordered">
                            <thead>
                              <tr>
                                <th>Description</th>
                                <th>Qty</th>
                                <th>Price</th>
                                <th>Discount</th>
                                <th>Tax</th>
                                <th>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(documentModal.payload.quotation.items || []).map((item) => (
                                <tr key={item.id || `${item.description}-${item.itemId}`}>
                                  <td>{item.description}</td>
                                  <td>{item.quantity}</td>
                                  <td>Rs {Number(item.unitPrice || 0).toFixed(2)}</td>
                                  <td>Rs {Number(item.lineDiscount || 0).toFixed(2)}</td>
                                  <td>Rs {Number(item.lineTax || 0).toFixed(2)}</td>
                                  <td>Rs {Number(item.lineTotal || 0).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="ml-auto" style={{ maxWidth: "320px" }}>
                          <div className="d-flex justify-content-between">
                            <span>Subtotal</span>
                            <strong>
                              Rs {Number(documentModal.payload.quotation.subtotal || 0).toFixed(2)}
                            </strong>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span>Discount</span>
                            <strong>
                              Rs{" "}
                              {Number(documentModal.payload.quotation.discountTotal || 0).toFixed(
                                2
                              )}
                            </strong>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span>Tax</span>
                            <strong>
                              Rs {Number(documentModal.payload.quotation.taxTotal || 0).toFixed(2)}
                            </strong>
                          </div>
                          <div className="d-flex justify-content-between border-top mt-2 pt-2">
                            <span>Grand Total</span>
                            <strong>
                              Rs {Number(documentModal.payload.quotation.grandTotal || 0).toFixed(2)}
                            </strong>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-muted">No document data available</p>
                    )}
                  </div>
                  <div className="modal-footer">
                    <button className="btn btn-outline-secondary" onClick={() => window.print()}>
                      Print
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuotationProposalGenerator;
