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
import { Collapse } from "react-bootstrap";

const Brands = () => {
  const [brands, setBrands] = useState([]);
  const [filteredBrands, setFilteredBrands] = useState([]);
  const [columnsVisibility, setColumnsVisibility] = useState({
    brandName: true,
    description: true,
    actions: true,
  });
  const [modalType, setModalType] = useState(null); // "add", "edit", or "view"
  const [currentBrand, setCurrentBrand] = useState(null); // For viewing/editing
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1); // Added state for pagination

  const [formData, setFormData] = useState({
    brandName: "",
    description: "",
  });

  // State variables for filters
  const [filterValues, setFilterValues] = useState({
    brandNames: [],
  });
  
  const [activeFilters, setActiveFilters] = useState({
    brandName: "",
  });
  
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_BASE_URL}/brands/getall`) // ✅ FIXED
      .then((response) => response.json())
      .then((data) => {
        // Sort the data by id in descending order
        const sortedData = data.sort((a, b) => b.id - a.id);

        setBrands(sortedData);
        setFilteredBrands(sortedData);

        // Add external script directly
        const script = document.createElement("script");
        script.src = "js/JqueryContent.js";
        script.async = true;
        document.body.appendChild(script);

        // Cleanup function to remove the script element when the component unmounts
        return () => {
          document.body.removeChild(script);
        };
      })
      .catch((error) => console.error("Error fetching brands:", error));
  }, []);

  // Extract filter values when brands data changes
  useEffect(() => {
    if (brands.length > 0) {
      const brandNames = [...new Set(brands.map(item => item.brandName))].filter(Boolean);
      
      setFilterValues({
        brandNames,
      });
    }
  }, [brands]);

  // Apply filters whenever activeFilters or brands changes
  useEffect(() => {
    const filteredData = brands.filter((brand) => {
      const brandNameMatch = activeFilters.brandName === "" || brand.brandName === activeFilters.brandName;
      
      return brandNameMatch;
    });
    
    setFilteredBrands(filteredData);
  }, [activeFilters, brands]);

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
      brandName: "",
    });
  };

  const exportCSV = () => {
    const csvData = filteredBrands.map((brand) => ({
      Brand: brand.brandName,
      Description: brand.description,
    }));

    const csv = [
      ["Brand", "Description"],
      ...csvData.map((row) => Object.values(row)),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    saveAs(blob, "brands.csv");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredBrands.map((brand) => ({
        Brand: brand.brandName,
        Description: brand.description,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Brands");
    XLSX.writeFile(wb, "brands.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [["Brand", "Description"]],
      body: filteredBrands.map((brand) => [brand.brandName, brand.description]),
    });
    doc.save("brands.pdf");
  };

  const printData = () => {
    const printWindow = window.open("", "", "height=800,width=1200");
    printWindow.document.write("<html><head><title>Print</title>");
    printWindow.document.write(
      '<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">'
    );
    printWindow.document.write("</head><body>");
    printWindow.document.write(
      document.getElementById("table-container").innerHTML
    );
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
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
    setCurrentPage(1); // Reset to the first page when entries per page changes
  };

  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;

  const handleSaveBrand = () => {
    if (modalType === "edit" && currentBrand) {
      fetch(
        `${process.env.REACT_APP_BASE_URL}/brands/update/${currentBrand.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...formData, id: currentBrand.id }),
        }
      )
        .then((response) => {
          if (response.ok) {
            return response.json();
          } else {
            throw new Error("Failed to update brand");
          }
        })
        .then((updatedBrand) => {
          setBrands((prevBrands) =>
            prevBrands.map((brand) =>
              brand.id === updatedBrand.id ? updatedBrand : brand
            )
          );
          closeModal(); // Close the modal
          alert("Brand updated successfully!");
        })
        .catch((error) => {
          console.error("Error updating brand:", error);
          alert("Error updating brand");
        });
    } else if (modalType === "add") {
      fetch(`${process.env.REACT_APP_BASE_URL}/brands/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
        .then((response) => {
          if (response.status === 201) {
            return response.json();
          } else {
            throw new Error("Failed to add brand");
          }
        })
        .then((newBrand) => {
          setBrands((prevBrands) => [...prevBrands, newBrand]);
          closeModal();
          alert("Brand added successfully!");
        })
        .catch((error) => {
          console.error("Error adding brand:", error);
          alert("Error adding brand");
        });
    }
  };

  const closeModal = () => {
    setModalType(null);
    setCurrentBrand(null);
    setFormData({ brandName: "", description: "" });
  };

  const handleEdit = (id) => {
    const brandToEdit = filteredBrands.find((brand) => brand.id === id);
    if (brandToEdit) {
      setCurrentBrand(brandToEdit);
      setFormData({
        brandName: brandToEdit.brandName,
        description: brandToEdit.description,
      });
      setModalType("edit");
    }
  };

  const handleView = (id) => {
    const brandToView = filteredBrands.find((brand) => brand.id === id);
    if (brandToView) {
      setCurrentBrand(brandToView);
      setModalType("view");
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this brand?")) {
      fetch(`${process.env.REACT_APP_BASE_URL}/brands/delete/${id}`, {
        method: "DELETE",
      })
        .then((response) => {
          if (response.status === 204) {
            setBrands((prevBrands) =>
              prevBrands.filter((brand) => brand.id !== id)
            );
            alert("Brand deleted successfully!");
          } else {
            alert("Failed to delete brand.");
          }
        })
        .catch((error) => console.error("Error deleting brand:", error));
    }
  };

  const toggleColumn = (columnName) => {
    setColumnsVisibility((prev) => ({
      ...prev,
      [columnName]: !prev[columnName],
    }));
  };

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-12 col-md-6">
                <h1 className="all-heading ">Brands</h1>
                <span className="d-inline d-md-block sub-heading">
                  Manage Brands
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
                      {/* Brand Name Dropdown */}
                      <div className="col-md-6">
                        <div className="form-group">
                          <label className="me-2">Brand Name:</label>
                          <select
                            className="form-select"
                            name="brandName"
                            value={activeFilters.brandName}
                            onChange={handleFilterChange}
                          >
                            <option value="">All Brands</option>
                            {filterValues.brandNames.map((name, index) => (
                              <option key={`name-${index}`} value={name}>
                                {name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Reset Button */}
                      <div className="col-md-6 d-flex align-items-end">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            resetFilters();
                          }}
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

            <div className="card card-hover rounded-4 border-0">
              <div className="d-flex justify-content-end mb-3">
                <button
                  className="btn btn-add"
                  onClick={() => setModalType("add")}
                >
                  <i className="fas fa-plus"></i> Add
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
                    className="table table-bordered table-hover shadow"
                  >
                    <thead>
                      <tr>
                        {columnsVisibility.brandName && <th>Brand</th>}
                        {columnsVisibility.description && <th>Description</th>}
                        {columnsVisibility.actions && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBrands
                        .slice(startIndex, endIndex) // Paginate the data
                        .map((brand) => (
                          <tr key={brand.id}>
                            {columnsVisibility.brandName && (
                              <td>{brand.brandName}</td>
                            )}
                            {columnsVisibility.description && (
                              <td>{brand.description}</td>
                            )}

                            {/* action btn */}
                            {columnsVisibility.actions && (
                              <td>
                                <button
                                  className="btn btn-edit btn-sm mr-2"
                                  onClick={() => handleEdit(brand.id)}
                                >
                                  <i className="fas fa-edit"></i> Edit
                                </button>
                                <button
                                  className="btn btn-view btn-sm mr-2"
                                  onClick={() => handleView(brand.id)}
                                >
                                  <i className="fas fa-eye"></i> View
                                </button>
                                <button
                                  className="btn btn-delete btn-sm"
                                  onClick={() => handleDelete(brand.id)}
                                >
                                  <i className="fas fa-trash"></i> Delete
                                </button>
                              </td>
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

        {/* modal */}
        {modalType && (
          <div
            className="modal fade show"
            id="brandModal"
            tabIndex="-1"
            role="dialog"
            aria-labelledby="brandModalLabel"
            aria-hidden={!modalType}
            style={{ display: modalType ? "block" : "none" }}
          >
            <div className="modal-dialog" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title" id="brandModalLabel">
                    {modalType === "add"
                      ? "Add Brand"
                      : modalType === "edit"
                      ? "Edit Brand"
                      : "View Brand"}
                  </h5>
                  <button
                    type="button"
                    className="close"
                    onClick={closeModal}
                    aria-label="Close"
                  >
                    <span aria-hidden="true">&times;</span>
                  </button>
                </div>
                <div className="modal-body">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveBrand();
                    }}
                  >
                    {(modalType === "add" || modalType === "edit") && (
                      <div>
                        <div className="form-group">
                          <label htmlFor="brandName">Brand Name</label>
                          <input
                            type="text"
                            className="form-control"
                            id="brandName"
                            value={formData.brandName}
                            onChange={handleFormChange}
                            placeholder="Enter brand name"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="description">Description</label>
                          <textarea
                            className="form-control"
                            id="description"
                            value={formData.description}
                            onChange={handleFormChange}
                            placeholder="Enter description"
                            required
                          ></textarea>
                        </div>
                      </div>
                    )}

                    {modalType === "view" && currentBrand && (
                      <div>
                        <p>
                          <strong>Brand Name:</strong> {currentBrand.brandName}
                        </p>
                        <p>
                          <strong>Description:</strong>{" "}
                          {currentBrand.description}
                        </p>
                      </div>
                    )}
                    <div className="modal-footer">
                      {modalType === "add" || modalType === "edit" ? (
                        <>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={closeModal}
                          >
                            Close
                          </button>
                          <button type="submit" className="btn btn-primary">
                            Save
                          </button>
                        </>
                      ) : (
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={closeModal}
                          >
                            Close
                          </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Brands;