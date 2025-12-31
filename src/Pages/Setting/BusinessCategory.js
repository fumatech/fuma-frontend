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

const BusinessCategory = () => {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [columnsVisibility, setColumnsVisibility] = useState({
    name: true,
    locationId: true,
    actions: true,
  });

  const [modalType, setModalType] = useState(null);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [formData, setFormData] = useState({
    name: "",
    locationId: "",
  });

  const [filterValues, setFilterValues] = useState({
    names: [],
  });

  const [activeFilters, setActiveFilters] = useState({
    name: "",
  });

  const [filterOpen, setFilterOpen] = useState(false);

  // ================= FETCH =================
  useEffect(() => {
    fetch(`${process.env.REACT_APP_BASE_URL}/business-category/getall`)
      .then((res) => res.json())
      .then((data) => {
        const sorted = data.sort((a, b) => b.id - a.id);
        setCategories(sorted);
        setFilteredCategories(sorted);
      })
      .catch(console.error);
  }, []);

  // ================= FILTER VALUES =================
  useEffect(() => {
    const names = [...new Set(categories.map((c) => c.name))];
    setFilterValues({ names });
  }, [categories]);

  // ================= APPLY FILTER =================
  useEffect(() => {
    setFilteredCategories(
      categories.filter(
        (c) => !activeFilters.name || c.name === activeFilters.name
      )
    );
  }, [activeFilters, categories]);

  const handleFilterChange = (e) => {
    setActiveFilters({ ...activeFilters, [e.target.name]: e.target.value });
    setCurrentPage(1);
  };

  const resetFilters = () => setActiveFilters({ name: "" });

  // ================= EXPORTS =================
  const exportCSV = () => {
    const csv = [
      ["Business Category", "Location"],
      ...filteredCategories.map((c) => [c.name, c.locationId]),
    ]
      .map((r) => r.join(","))
      .join("\n");

    saveAs(new Blob([csv]), "business-category.csv");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredCategories);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BusinessCategory");
    XLSX.writeFile(wb, "business-category.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [["Business Category", "Location"]],
      body: filteredCategories.map((c) => [c.name, c.locationId]),
    });
    doc.save("business-category.pdf");
  };

  const printData = () => {
    const win = window.open("", "", "width=1200,height=800");
    win.document.write(document.getElementById("table-container").innerHTML);
    win.print();
  };

  // ================= FORM =================
  const handleFormChange = (e) =>
    setFormData({ ...formData, [e.target.id]: e.target.value });

  const handleSave = () => {
    const url =
      modalType === "edit"
        ? `${process.env.REACT_APP_BASE_URL}/business-category/update/${currentCategory.id}`
        : `${process.env.REACT_APP_BASE_URL}/business-category/save`;

    fetch(url, {
      method: modalType === "edit" ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
      .then((res) => res.json())
      .then(() => {
        window.location.reload();
      })
      .catch(console.error);
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this category?")) {
      fetch(
        `${process.env.REACT_APP_BASE_URL}/business-category/delete/${id}`,
        { method: "DELETE" }
      ).then(() => setCategories((prev) => prev.filter((c) => c.id !== id)));
    }
  };

  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <h1 className="all-heading">Business Category</h1>
        </section>

        <section className="content">
          <div className="card rounded-4 border-0">
            <div className="d-flex justify-content-end mb-3">
              <button
                className="btn btn-add"
                onClick={() => setModalType("add")}
              >
                <i className="fas fa-plus"></i> Add
              </button>
            </div>

            <div id="table-container">
              <table className="table table-bordered table-hover">
                <thead>
                  <tr>
                    <th>Business Category</th>
                    <th>Location</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.slice(startIndex, endIndex).map((c) => (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td>{c.locationId}</td>
                      <td>
                        <button
                          className="btn btn-edit btn-sm mr-2"
                          onClick={() => {
                            setCurrentCategory(c);
                            setFormData(c);
                            setModalType("edit");
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-delete btn-sm"
                          onClick={() => handleDelete(c.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {modalType && (
          <div className="modal fade show" style={{ display: "block" }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5>
                    {modalType === "add" ? "Add" : "Edit"} Business Category
                  </h5>
                  <button onClick={() => setModalType(null)}>×</button>
                </div>

                <div className="modal-body">
                  <input
                    id="name"
                    className="form-control mb-2"
                    placeholder="Business Category Name"
                    value={formData.name}
                    onChange={handleFormChange}
                  />
                  <input
                    id="locationId"
                    className="form-control"
                    placeholder="Business Location"
                    value={formData.locationId}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setModalType(null)}
                  >
                    Close
                  </button>
                  <button className="btn btn-primary" onClick={handleSave}>
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessCategory;
