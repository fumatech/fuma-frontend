import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { toast } from "react-toastify";

function TaxRate() {
  // State management
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [entriesPerPageTaxGroup, setEntriesPerPageTaxGroup] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageGroup, setCurrentPageGroup] = useState(1);

  // Column visibility
  const [columnsVisibility, setColumnsVisibility] = useState({
    Name: true,
    TaxRate: true,
    Action: true,
  });
  const [columnsVisibilityTaxGroups, setColumnsVisibilityTaxGroups] = useState({
    Name: true,
    TaxRate: true,
    SubTaxes: true,
    Action: true,
  });

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTaxGroupModalOpen, setIsTaxGroupModalOpen] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    taxName: "",
    taxValue: "",
  });
  const [taxGroupFormData, setTaxGroupFormData] = useState({
    taxName: "",
    includedTaxes: [],
  });

  // Data states
  const [allTaxes, setAllTaxes] = useState([]);
  const [singleTaxes, setSingleTaxes] = useState([]);
  const [taxGroups, setTaxGroups] = useState([]);
  const [selectedTax, setSelectedTax] = useState(null);
  const [selectedTaxGroup, setSelectedTaxGroup] = useState(null);
  const [selectedTaxesForGroup, setSelectedTaxesForGroup] = useState([]);

  // Fetch all taxes on component mount
  useEffect(() => {
    fetchTaxes();
  }, []);

  // Separate single taxes and tax groups whenever allTaxes changes
  useEffect(() => {
    const singles = allTaxes.filter(
      (tax) => !tax.includedTaxes || tax.includedTaxes.length === 0
    );
    const groups = allTaxes.filter(
      (tax) => tax.includedTaxes && tax.includedTaxes.length > 0
    );

    setSingleTaxes(singles);
    setTaxGroups(groups);
  }, [allTaxes]);

  const fetchTaxes = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/tax/getall`
      );
      setAllTaxes(response.data);
    } catch (error) {
      console.error("Error fetching taxes:", error);
    }
  };

  // Pagination handlers
  const handleEntriesChange = (event) => {
    setEntriesPerPage(Number(event.target.value));
    setCurrentPage(1);
  };

  const handleEntriesTaxGroupChange = (event) => {
    setEntriesPerPageTaxGroup(Number(event.target.value));
    setCurrentPageGroup(1);
  };

  // Modal handlers
  const openModal = (tax = null) => {
    setSelectedTax(tax);
    if (tax) {
      setFormData({
        taxName: tax.taxName,
        taxValue: tax.taxValue,
      });
    } else {
      setFormData({
        taxName: "",
        taxValue: "",
      });
    }
    setIsModalOpen(true);
  };

  const openTaxGroupModal = (taxGroup = null) => {
    setSelectedTaxGroup(taxGroup);
    if (taxGroup) {
      setTaxGroupFormData({
        taxName: taxGroup.taxName,
        includedTaxes: taxGroup.includedTaxes,
      });
      setSelectedTaxesForGroup(
        taxGroup.includedTaxes.map((tax) => ({
          value: tax.id,
          label: `${tax.taxName} (${tax.taxValue}%)`,
        }))
      );
    } else {
      setTaxGroupFormData({
        taxName: "",
        includedTaxes: [],
      });
      setSelectedTaxesForGroup([]);
    }
    setIsTaxGroupModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTax(null);
  };

  const closeTaxGroupModal = () => {
    setIsTaxGroupModalOpen(false);
    setSelectedTaxGroup(null);
  };

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTaxesSelection = (selectedOptions) => {
    setSelectedTaxesForGroup(selectedOptions);
  };

  const handleTaxSubmit = async (e) => {
    e.preventDefault();

    try {
      if (selectedTax) {
        await axios.put(
          `${process.env.REACT_APP_BASE_URL}/tax/update/${selectedTax.id}`,
          formData
        );

        toast.success("Tax updated successfully!");
      } else {
        await axios.post(
          `${process.env.REACT_APP_BASE_URL}/tax/save`,
          formData
        );

        toast.success("Tax saved successfully!");
      }

      closeModal();
      fetchTaxes();
    } catch (error) {
      console.error("Error saving tax:", error);

      toast.error(
        error.response?.data?.message || "Failed to save tax. Please try again."
      );
    }
  };

  const handleTaxGroupSubmit = async (e) => {
    e.preventDefault();

    try {
      const includedTaxIds = selectedTaxesForGroup.map((tax) => tax.value);

      const data = {
        taxName: taxGroupFormData.taxName,
        includedTaxes: includedTaxIds.map((id) => ({ id })),
      };

      if (selectedTaxGroup) {
        await axios.put(
          `${process.env.REACT_APP_BASE_URL}/tax/update/${selectedTaxGroup.id}`,
          data
        );

        toast.success("Tax group updated successfully!");
      } else {
        await axios.post(`${process.env.REACT_APP_BASE_URL}/tax/save`, data);

        toast.success("Tax group saved successfully!");
      }

      closeTaxGroupModal();
      fetchTaxes();
    } catch (error) {
      console.error("Error saving tax group:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to save tax group. Please try again."
      );
    }
  };
  const handleDeleteTax = async (id) => {
    try {
      await axios.delete(`${process.env.REACT_APP_BASE_URL}/tax/delete/${id}`);

      toast.success("Tax deleted successfully!");
      fetchTaxes();
    } catch (error) {
      console.error("Error deleting tax:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to delete tax. Please try again."
      );
    }
  };

  // Export functions for single taxes
  const exportCSV = () => {
    const csvData = singleTaxes.map((tax) => ({
      Name: tax.taxName,
      "Tax Rate %": tax.taxValue,
    }));

    const csvContent = [
      "Name,Tax Rate %",
      ...csvData.map((row) => `${row.Name},${row["Tax Rate %"]}`),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    saveAs(blob, "single_taxes.csv");
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      singleTaxes.map((tax) => ({
        Name: tax.taxName,
        "Tax Rate %": tax.taxValue,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Single Taxes");
    XLSX.writeFile(workbook, "single_taxes.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Single Taxes", 20, 10);
    doc.autoTable({
      head: [["Name", "Tax Rate %"]],
      body: singleTaxes.map((tax) => [tax.taxName, tax.taxValue]),
    });
    doc.save("single_taxes.pdf");
  };

  // Export functions for tax groups
  const exportCSVTaxGroups = () => {
    const csvData = taxGroups.map((group) => ({
      Name: group.taxName,
      "Tax Rate %": group.taxValue,
      "Sub Taxes": group.includedTaxes.map((t) => t.taxName).join(", "),
    }));

    const csvContent = [
      "Name,Tax Rate %,Sub Taxes",
      ...csvData.map(
        (row) => `${row.Name},${row["Tax Rate %"]},"${row["Sub Taxes"]}"`
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    saveAs(blob, "tax_groups.csv");
  };

  const exportExcelTaxGroups = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      taxGroups.map((group) => ({
        Name: group.taxName,
        "Tax Rate %": group.taxValue,
        "Sub Taxes": group.includedTaxes.map((t) => t.taxName).join(", "),
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tax Groups");
    XLSX.writeFile(workbook, "tax_groups.xlsx");
  };

  const exportPDFTaxGroups = () => {
    const doc = new jsPDF();
    doc.text("Tax Groups", 20, 10);
    doc.autoTable({
      head: [["Name", "Tax Rate %", "Sub Taxes"]],
      body: taxGroups.map((group) => [
        group.taxName,
        group.taxValue,
        group.includedTaxes.map((t) => t.taxName).join(", "),
      ]),
    });
    doc.save("tax_groups.pdf");
  };

  // Print functions
  const printData = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html><head><title>Single Taxes</title></head>
      <body>
        <h2>Single Taxes</h2>
        <table border="1">
          <thead><tr><th>Name</th><th>Tax Rate %</th></tr></thead>
          <tbody>
            ${singleTaxes
              .map(
                (tax) => `
              <tr>
                <td>${tax.taxName}</td>
                <td>${tax.taxValue}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const printDataTaxGroups = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html><head><title>Tax Groups</title></head>
      <body>
        <h2>Tax Groups</h2>
        <table border="1">
          <thead>
            <tr>
              <th>Name</th>
              <th>Tax Rate %</th>
              <th>Sub Taxes</th>
            </tr>
          </thead>
          <tbody>
            ${taxGroups
              .map(
                (group) => `
              <tr>
                <td>${group.taxName}</td>
                <td>${group.taxValue}</td>
                <td>${group.includedTaxes.map((t) => t.taxName).join(", ")}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Column visibility toggles
  const toggleColumn = (column) => {
    setColumnsVisibility((prev) => ({ ...prev, [column]: !prev[column] }));
  };

  const toggleColumnTaxGroups = (column) => {
    setColumnsVisibilityTaxGroups((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  // Pagination calculations
  const indexOfLastSingleTax = currentPage * entriesPerPage;
  const indexOfFirstSingleTax = indexOfLastSingleTax - entriesPerPage;
  const currentSingleTaxes = singleTaxes.slice(
    indexOfFirstSingleTax,
    indexOfLastSingleTax
  );
  const totalSinglePages = Math.ceil(singleTaxes.length / entriesPerPage);

  const indexOfLastGroup = currentPageGroup * entriesPerPageTaxGroup;
  const indexOfFirstGroup = indexOfLastGroup - entriesPerPageTaxGroup;
  const currentGroups = taxGroups.slice(indexOfFirstGroup, indexOfLastGroup);
  const totalGroupPages = Math.ceil(taxGroups.length / entriesPerPageTaxGroup);

  return (
    <div className="wrapper" style={{ overflowY: "auto" }}>
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            {/* Single Taxes Section */}
            <div className="row mb-2">
              <div className="col-12 col-md-6">
                <h1 className="all-heading">Tax Rates</h1>
              </div>
            </div>

            <div className="card cardHover rounded-4 border-0">
              <div className="d-flex justify-content-end">
                <button
                  onClick={() => openModal()}
                  className="btn btn-add mb-3"
                >
                  <i className="fas fa-plus"></i> Add Tax Rate
                </button>
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
                        data-toggle="dropdown"
                      >
                        <i className="fa fa-columns"></i> Column Visibility
                      </button>
                      <div className="dropdown-menu">
                        {Object.keys(columnsVisibility).map((col) => (
                          <div key={col} className="dropdown-item">
                            <input
                              type="checkbox"
                              checked={columnsVisibility[col]}
                              onChange={() => toggleColumn(col)}
                              className="mr-2"
                            />
                            {col}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="table-responsive">
                  <table
                    className="table table-bordered table-striped"
                    role="grid"
                  >
                    <thead>
                      <tr role="row">
                        {columnsVisibility.Name && <th>Name</th>}
                        {columnsVisibility.TaxRate && <th>Tax Rate %</th>}
                        {columnsVisibility.Action && <th>Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {currentSingleTaxes.length > 0 ? (
                        currentSingleTaxes.map((tax) => (
                          <tr key={tax.id}>
                            {columnsVisibility.Name && <td>{tax.taxName}</td>}
                            {columnsVisibility.TaxRate && (
                              <td>{tax.taxValue}</td>
                            )}
                            {columnsVisibility.Action && (
                              <td>
                                <button
                                  className="btn-edit btn-xs mr-2"
                                  onClick={() => openModal(tax)}
                                >
                                  <i className="fas fa-edit btn-icon"></i> Edit
                                </button>
                                <button
                                  className="btn btn-delete btn-xs"
                                  onClick={() => handleDeleteTax(tax.id)}
                                >
                                  <i className="fas fa-trash btn-icon"></i>{" "}
                                  Delete
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="text-center">
                            No tax rates available.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination for single taxes */}
                <div className="row mt-3">
                  <div className="col-12 d-flex justify-content-center">
                    <nav>
                      <ul className="pagination">
                        <li
                          className={`page-item ${
                            currentPage === 1 ? "disabled" : ""
                          }`}
                        >
                          <button
                            className="page-link"
                            onClick={() =>
                              setCurrentPage((p) => Math.max(1, p - 1))
                            }
                          >
                            Previous
                          </button>
                        </li>
                        {Array.from({ length: totalSinglePages }, (_, i) => (
                          <li
                            key={i}
                            className={`page-item ${
                              currentPage === i + 1 ? "active" : ""
                            }`}
                          >
                            <button
                              className="page-link"
                              onClick={() => setCurrentPage(i + 1)}
                            >
                              {i + 1}
                            </button>
                          </li>
                        ))}
                        <li
                          className={`page-item ${
                            currentPage === totalSinglePages ? "disabled" : ""
                          }`}
                        >
                          <button
                            className="page-link"
                            onClick={() =>
                              setCurrentPage((p) =>
                                Math.min(totalSinglePages, p + 1)
                              )
                            }
                          >
                            Next
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </div>
              </div>
            </div>

            {/* Tax Groups Section */}
            <div className="container-fluid">
              <div className="row mb-2">
                <div className="col-12 col-md-6">
                  <h3 className="all-heading">
                    Tax group (Combination of multiple taxes)
                  </h3>
                </div>
              </div>
            </div>

            <div className="card cardHover rounded-4 border-0">
              <div className="d-flex justify-content-end">
                <button
                  onClick={() => openTaxGroupModal()}
                  className="btn btn-add mb-3"
                >
                  <i className="fas fa-plus"></i> Add Tax Group
                </button>
              </div>

              <div className="card-body">
                <div className="row mb-3 d-flex align-items-center">
                  <div className="col-12 col-md-auto form-group mb-2 d-flex align-items-center text-bold mt-2 mb-2 mr-2">
                    <label
                      htmlFor="entriesPerPageTaxGroup"
                      className="mb-0 mr-2"
                    >
                      Show
                    </label>
                    <select
                      id="entriesPerPageTaxGroup"
                      className="form-control form-control-sm mr-2"
                      value={entriesPerPageTaxGroup}
                      onChange={handleEntriesTaxGroupChange}
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
                      onClick={exportCSVTaxGroups}
                      className="btn Export-Btn mt-2 mb-2 mr-2"
                    >
                      <i className="fa fa-file-csv"></i> Export CSV
                    </button>
                    <button
                      onClick={exportExcelTaxGroups}
                      className="btn Export-Btn mt-2 mb-2 mr-2"
                    >
                      <i className="fa fa-file-excel"></i> Export Excel
                    </button>
                    <button
                      onClick={printDataTaxGroups}
                      className="btn Export-Btn mt-2 mb-2 mr-2"
                    >
                      <i className="fa fa-print"></i> Print
                    </button>
                    <button
                      onClick={exportPDFTaxGroups}
                      className="btn Export-Btn mt-2 mb-2 mr-2"
                    >
                      <i className="fa fa-file-pdf"></i> Export PDF
                    </button>

                    <div className="dropdown mt-lg-2 mb-lg-2">
                      <button
                        className="btn Export-Btn dropdown-toggle"
                        data-toggle="dropdown"
                      >
                        <i className="fa fa-columns"></i> Column Visibility
                      </button>
                      <div className="dropdown-menu">
                        {Object.keys(columnsVisibilityTaxGroups).map((col) => (
                          <div key={col} className="dropdown-item">
                            <input
                              type="checkbox"
                              checked={columnsVisibilityTaxGroups[col]}
                              onChange={() => toggleColumnTaxGroups(col)}
                              className="mr-2"
                            />
                            {col}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="table-responsive">
                  <table
                    className="table table-bordered table-striped"
                    role="grid"
                  >
                    <thead>
                      <tr>
                        {columnsVisibilityTaxGroups.Name && <th>Name</th>}
                        {columnsVisibilityTaxGroups.TaxRate && (
                          <th>Tax Rate %</th>
                        )}
                        {columnsVisibilityTaxGroups.SubTaxes && (
                          <th>Sub Taxes</th>
                        )}
                        {columnsVisibilityTaxGroups.Action && <th>Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {currentGroups.length > 0 ? (
                        currentGroups.map((group) => (
                          <tr key={group.id}>
                            {columnsVisibilityTaxGroups.Name && (
                              <td>{group.taxName}</td>
                            )}
                            {columnsVisibilityTaxGroups.TaxRate && (
                              <td>{group.taxValue}</td>
                            )}
                            {columnsVisibilityTaxGroups.SubTaxes && (
                              <td>
                                {group.includedTaxes
                                  .map((tax) => tax.taxName)
                                  .join(", ")}
                              </td>
                            )}
                            {columnsVisibilityTaxGroups.Action && (
                              <td>
                                <button
                                  className="btn-edit mr-2"
                                  onClick={() => openTaxGroupModal(group)}
                                >
                                  <i className="fas fa-edit btn-icon"></i> Edit
                                </button>
                                <button
                                  className="btn btn-delete"
                                  onClick={() => handleDeleteTax(group.id)}
                                >
                                  <i className="fas fa-trash btn-icon"></i>{" "}
                                  Delete
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center">
                            No tax groups available.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination for tax groups */}
                <div className="row mt-3">
                  <div className="col-12 d-flex justify-content-center">
                    <nav>
                      <ul className="pagination">
                        <li
                          className={`page-item ${
                            currentPageGroup === 1 ? "disabled" : ""
                          }`}
                        >
                          <button
                            className="page-link"
                            onClick={() =>
                              setCurrentPageGroup((p) => Math.max(1, p - 1))
                            }
                          >
                            Previous
                          </button>
                        </li>
                        {Array.from({ length: totalGroupPages }, (_, i) => (
                          <li
                            key={i}
                            className={`page-item ${
                              currentPageGroup === i + 1 ? "active" : ""
                            }`}
                          >
                            <button
                              className="page-link"
                              onClick={() => setCurrentPageGroup(i + 1)}
                            >
                              {i + 1}
                            </button>
                          </li>
                        ))}
                        <li
                          className={`page-item ${
                            currentPageGroup === totalGroupPages
                              ? "disabled"
                              : ""
                          }`}
                        >
                          <button
                            className="page-link"
                            onClick={() =>
                              setCurrentPageGroup((p) =>
                                Math.min(totalGroupPages, p + 1)
                              )
                            }
                          >
                            Next
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Modal for Single Tax */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ display: "block" }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {selectedTax ? "Edit Tax Rate" : "Add Tax Rate"}
                  </h5>
                  <button type="button" className="close" onClick={closeModal}>
                    <span>&times;</span>
                  </button>
                </div>
                <div className="modal-body">
                  <form onSubmit={handleTaxSubmit}>
                    <div className="form-group">
                      <label htmlFor="taxName">Name</label>
                      <input
                        type="text"
                        className="form-control"
                        id="taxName"
                        name="taxName"
                        value={formData.taxName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="taxValue">Tax Rate (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        id="taxValue"
                        name="taxValue"
                        value={formData.taxValue}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={closeModal}
                      >
                        Close
                      </button>
                      <button type="submit" className="btn btn-primary">
                        {selectedTax ? "Update" : "Save"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Tax Group */}
      {isTaxGroupModalOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ display: "block" }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {selectedTaxGroup ? "Edit Tax Group" : "Add Tax Group"}
                  </h5>
                  <button
                    type="button"
                    className="close"
                    onClick={closeTaxGroupModal}
                  >
                    <span>&times;</span>
                  </button>
                </div>
                <div className="modal-body">
                  <form onSubmit={handleTaxGroupSubmit}>
                    <div className="form-group">
                      <label htmlFor="groupTaxName">Group Name</label>
                      <input
                        type="text"
                        className="form-control"
                        id="groupTaxName"
                        name="taxName"
                        value={taxGroupFormData.taxName}
                        onChange={(e) =>
                          setTaxGroupFormData({
                            ...taxGroupFormData,
                            taxName: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Select Taxes to Include</label>
                      <Select
                        isMulti
                        options={singleTaxes.map((tax) => ({
                          value: tax.id,
                          label: `${tax.taxName} (${tax.taxValue}%)`,
                        }))}
                        value={selectedTaxesForGroup}
                        onChange={handleTaxesSelection}
                        className="basic-multi-select"
                        classNamePrefix="select"
                      />
                    </div>
                    <div className="form-group">
                      <label>Total Tax Rate:</label>
                      <div className="form-control">
                        {selectedTaxesForGroup.reduce(
                          (sum, tax) =>
                            sum +
                            parseFloat(tax.label.match(/\((\d+\.?\d*)%\)/)[1]),
                          0
                        )}
                        %
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={closeTaxGroupModal}
                      >
                        Close
                      </button>
                      <button type="submit" className="btn btn-primary">
                        {selectedTaxGroup ? "Update" : "Save"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TaxRate;
