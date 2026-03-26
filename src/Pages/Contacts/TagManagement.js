import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const TagManagement = () => {
  const [tags, setTags] = useState([]);
  const [newTagName, setNewTagName] = useState("");
  const [editTag, setEditTag] = useState(null);
  const [editTagName, setEditTagName] = useState("");

  useEffect(() => {
    fetchTags();
  }, []);

  const getErrorMessage = (error) => {
    if (error?.response) {
      return `(${error.response.status}) ${error.response.data?.message || "Request failed"}`;
    }
    return error?.message || "Network error";
  };

  const withTagEndpointFallback = async (requestBuilder) => {
    const baseUrl = process.env.REACT_APP_BASE_URL;
    const endpoints = [`${baseUrl}/api/tags`, `${baseUrl}/tags`];
    let lastError;

    for (const endpoint of endpoints) {
      try {
        return await requestBuilder(endpoint);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  };

  const fetchTags = async () => {
    try {
      const response = await withTagEndpointFallback((endpoint) => axios.get(endpoint));
      setTags(response.data);
    } catch (error) {
      console.error("Error fetching tags:", error);
      toast.error(`Failed to fetch tags ${getErrorMessage(error)}`);
    }
  };

  const handleAddTag = async (e) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    try {
      await withTagEndpointFallback((endpoint) =>
        axios.post(endpoint, { name: newTagName })
      );
      setNewTagName("");
      fetchTags();
      toast.success("Tag added successfully");
    } catch (error) {
      console.error("Error adding tag:", error);
      toast.error(`Failed to add tag ${getErrorMessage(error)}`);
    }
  };

  const handleUpdateTag = async (e) => {
    e.preventDefault();
    if (!editTagName.trim() || !editTag) return;
    try {
      await withTagEndpointFallback((endpoint) =>
        axios.put(`${endpoint}/${editTag.id}`, { name: editTagName })
      );
      setEditTag(null);
      setEditTagName("");
      fetchTags();
      toast.success("Tag updated successfully");
    } catch (error) {
      console.error("Error updating tag:", error);
      toast.error(`Failed to update tag ${getErrorMessage(error)}`);
    }
  };

  const handleDeleteTag = async (id) => {
    if (window.confirm("Are you sure you want to delete this tag?")) {
      try {
        await withTagEndpointFallback((endpoint) =>
          axios.delete(`${endpoint}/${id}`)
        );
        fetchTags();
        toast.success("Tag deleted successfully");
      } catch (error) {
        console.error("Error deleting tag:", error);
        toast.error(`Failed to delete tag ${getErrorMessage(error)}`);
      }
    }
  };

  return (
    <div className="wrapper">
      <div className="content-wrapper">
        <section className="content-header">
          <div className="container-fluid">
            <h1>Tag Management</h1>
          </div>
        </section>
        <section className="content">
          <div className="container-fluid">
            <div className="card cardHover rounded-4 border-0 p-4">
              <form onSubmit={editTag ? handleUpdateTag : handleAddTag} className="mb-4">
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter tag name"
                    value={editTag ? editTagName : newTagName}
                    onChange={(e) => editTag ? setEditTagName(e.target.value) : setNewTagName(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary">
                    {editTag ? "Update Tag" : "Add Tag"}
                  </button>
                  {editTag && (
                    <button type="button" className="btn btn-secondary" onClick={() => setEditTag(null)}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              <div className="table-responsive">
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Tag Name</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tags.map((tag) => (
                      <tr key={tag.id}>
                        <td>{tag.id}</td>
                        <td>{tag.name}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-info me-2"
                            onClick={() => {
                              setEditTag(tag);
                              setEditTagName(tag.name);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteTag(tag.id)}
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
          </div>
        </section>
      </div>
    </div>
  );
};

export default TagManagement;
