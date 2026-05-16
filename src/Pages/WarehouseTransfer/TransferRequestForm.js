import React, { useEffect, useState } from 'react';

const TransferRequestForm = ({ onSubmit }) => {
    const [sourceWarehouse, setSourceWarehouse] = useState('');
    const [destinationWarehouse, setDestinationWarehouse] = useState('');
    const [products, setProducts] = useState([{ productId: '', quantity: '' }]);
    const [remarks, setRemarks] = useState('');
    const [expectedDate, setExpectedDate] = useState('');
    const [warehouses, setWarehouses] = useState([]);
    const [allProducts, setAllProducts] = useState([]);

    useEffect(() => {
        // Fetch Warehouses
        fetch(`${process.env.REACT_APP_BASE_URL}/warehouse/getall`)
            .then((res) => res.json())
            .then((data) => setWarehouses(Array.isArray(data) ? data : []))
            .catch(() => setWarehouses([]));

        // Fetch All Products
        fetch(`${process.env.REACT_APP_BASE_URL}/product/getall`)
            .then((res) => res.json())
            .then((data) => setAllProducts(Array.isArray(data) ? data : []))
            .catch(() => setAllProducts([]));
    }, []);

    const handleProductChange = (index, field, value) => {
        const updated = [...products];
        updated[index][field] = value;
        setProducts(updated);
    };

    const addProduct = () => {
        setProducts([...products, { productId: '', quantity: '' }]);
    };

    const removeProduct = (index) => {
        if (products.length > 1) {
            const updated = products.filter((_, i) => i !== index);
            setProducts(updated);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            sourceWarehouse,
            destinationWarehouse,
            products,
            remarks,
            expectedDate,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="transfer-form">
            <div className="row g-3">
                <div className="col-md-4">
                    <label className="form-label fw-bold">Source Warehouse</label>
                    <select className="form-control" style={{ borderRadius: '8px' }} value={sourceWarehouse} onChange={e => setSourceWarehouse(e.target.value)} required>
                        <option value="">Select Source Warehouse</option>
                        {warehouses.map((w) => (
                            <option key={w.id} value={w.id}>
                                {w.warehouseName || w.name || `Warehouse ${w.id}`}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="col-md-4">
                    <label className="form-label fw-bold">Destination Warehouse</label>
                    <select className="form-control" style={{ borderRadius: '8px' }} value={destinationWarehouse} onChange={e => setDestinationWarehouse(e.target.value)} required>
                        <option value="">Select Destination Warehouse</option>
                        {warehouses
                            .filter((w) => String(w.id) !== String(sourceWarehouse))
                            .map((w) => (
                                <option key={w.id} value={w.id}>
                                    {w.warehouseName || w.name || `Warehouse ${w.id}`}
                                </option>
                            ))}
                    </select>
                </div>
                <div className="col-md-4">
                    <label className="form-label fw-bold">Expected Transfer Date</label>
                    <input className="form-control" style={{ borderRadius: '8px' }} type="date" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} required />
                </div>
                <div className="col-12">
                    <label className="form-label fw-bold">Remarks</label>
                    <input className="form-control" style={{ borderRadius: '8px' }} placeholder="Optional remarks" value={remarks} onChange={e => setRemarks(e.target.value)} />
                </div>
                <div className="col-12">
                    <label className="form-label fw-bold">Products to Transfer</label>
                    {products.map((p, idx) => (
                        <div key={idx} className="row g-2 mb-3 align-items-end">
                            <div className="col-md-7">
                                <label className="small text-muted mb-1">Product Name</label>
                                <select 
                                    className="form-control" 
                                    style={{ borderRadius: '8px' }}
                                    value={p.productId} 
                                    onChange={e => handleProductChange(idx, 'productId', e.target.value)} 
                                    required
                                >
                                    <option value="">Search/Select Product</option>
                                    {allProducts.map((prod) => (
                                        <option key={prod.id} value={prod.id}>
                                            {prod.productName} (ID: {prod.id})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-3">
                                <label className="small text-muted mb-1">Quantity</label>
                                <input 
                                    className="form-control" 
                                    style={{ borderRadius: '8px' }}
                                    placeholder="Qty" 
                                    type="number" 
                                    min="1"
                                    value={p.quantity} 
                                    onChange={e => handleProductChange(idx, 'quantity', e.target.value)} 
                                    required 
                                />
                            </div>
                            <div className="col-md-2">
                                {products.length > 1 && (
                                    <button 
                                        type="button" 
                                        className="btn btn-outline-danger btn-sm w-100" 
                                        style={{ height: '38px', borderRadius: '8px' }}
                                        onClick={() => removeProduct(idx)}
                                    >
                                        <i className="fa fa-trash"></i>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="col-12 d-flex gap-2 justify-content-center mt-3">
                    <button className="btn btn-outline-primary rounded-pill px-4" type="button" onClick={addProduct}>
                        <i className="fa fa-plus mr-1"></i> Add Another Product
                    </button>
                    <button className="btn btn-primary rounded-pill px-4 shadow-sm" type="submit">
                        Submit Request
                    </button>
                </div>
            </div>
        </form>
    );
};

export default TransferRequestForm;
