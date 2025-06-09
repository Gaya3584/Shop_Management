import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Save, X, Package, TrendingUp, AlertTriangle } from "lucide-react";
import './stock.css';
import { useNavigate } from 'react-router-dom';
import { useLocation, useParams } from 'react-router-dom';
const StockManagement = () => {
    const [stocks, setStocks] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [editingStock, setEditingStock] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedImages, setSelectedImages] = React.useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('all');
    
    const categorie = [
    { id: 'toys', name: 'Toys', icon: '🛍️' },
    { id: 'food', name: 'Food & Beverages', icon: '🍽️' },
    { id: 'clothing', name: 'Clothing & Textiles', icon: '👕' },
    { id: 'electronics', name: 'Electronics', icon: '📱' },
    { id: 'beauty', name: 'Beauty & Care', icon: '💄' },
    { id: 'accessories', name: 'Accessories', icon: '👜' },
    { id: 'home', name: 'Home & Furniture', icon: '🏠' },
    { id: 'misc', name: 'Miscellaneous', icon: '!' }
    
  ];
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalItems: 0,
        totalValue: 0,
        lowStockItems: 0
    });
    const [formData, setFormData] = useState({
        name: "",
        category: "",
        quantity: "",
        price: "",
        supplier: "",
        minThreshold: "",
        image:"",
        minOrder:1,
        discount:0
    });
    const [searchItem, setSearchItem] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    
    function handleImageChange(event) {
        const files = event.target.files;
        if (files.length > 0) {
            const file = files[0];
            setSelectedImages([file]);

            // Revoke previous URL to avoid memory leaks
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
            setFormData({ ...formData, image: objectUrl }); 
        }
    }
        
    

    const isFormValid = formData.name.trim() &&
                    formData.quantity.trim() &&
                    formData.price.trim() &&
                    formData.category.trim() &&
                    formData.minThreshold.trim()&&
(selectedImages && selectedImages.length > 0) &&
                    formData.minOrder!=null &&
                    formData.discount!=null
    // API call helper function
    const apiCall = async (url, options = {}) => {
        const defaultHeaders = options.body instanceof FormData
            ? {} : { 'Content-Type': 'application/json' };

        const defaultOptions = {
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
            credentials: "include",
            ...options,
        };

        try {
            const response = await fetch(url, defaultOptions);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'API call failed');
            }
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    };
    // Fetch stocks from database
    const fetchStocks = async () => {
        try {
            setLoading(true);
            const data = await apiCall('http://localhost:5000/api/stocks', { method: 'GET' });
            setStocks(data.stocks || []);
        } catch (error) {
            console.error('Error fetching stocks:', error);
            alert('Error fetching stocks: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Fetch stock stats
    const fetchStats = async () => {
    try {
        const data = await apiCall('http://localhost:5000/api/stocks/stats', { method: 'GET' });
        console.log("✅ Received stats from API:", data);
        if (data && typeof data === 'object') {
            setStats({
                totalItems: data.totalItems || 0,
                totalValue: data.totalValue || 0,
                lowStockItems: data.lowStockItems || 0
            });
        } else {
            console.warn("⚠️ API returned unexpected data format:", data);
        }
    } catch (error) {
        console.error('❌ Error fetching stats:', error);
        }
    };


    useEffect(() => {
    const loadAll = async () => {
        await fetchStocks();  // setStocks will trigger re-render
        await fetchStats();   // ensure stats come after stocks
    };
    loadAll();
}, []);


    const categories = [...new Set(stocks.map(stock => stock.category).filter(cat => cat))];

    const resetForm = () => {
        setFormData({
            name: "",
            category: "",
            quantity: "",
            price: "",
            supplier: "",
            minThreshold: "",
            image:"",
            minOrder:1,
            discount:0
        });
        setSelectedImages(null);   // ← add this
        setPreviewUrl(null); 
    };

    const handleAdd = async () => {
        if (!formData.name.trim()) {
            alert('Product name is required');
            return;
        }

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('category', formData.category);
            formDataToSend.append('quantity', parseInt(formData.quantity) || 0);
            formDataToSend.append('price', parseFloat(formData.price) || 0);
            formDataToSend.append('minThreshold', parseInt(formData.minThreshold) || 0);
            formDataToSend.append('minOrder', parseInt(formData.minOrder) || 0);
            formDataToSend.append('discount', parseInt(formData.discount) || 0);

            // Append image file if exists
            if (selectedImages.length > 0 && selectedImages[0] instanceof File) {
                formDataToSend.append('image', selectedImages[0]);
            }

            const data = await apiCall('http://localhost:5000/api/stocks', {
                method: 'POST',
                body: formDataToSend,
            });

            alert('Stock added successfully!');
            resetForm();
            setIsAdding(false);
            await fetchStocks();
            await fetchStats();
        } catch (error) {
            console.error('Error adding stock:', error);
            alert('Error adding stock: ' + error.message);
        } finally {
            setLoading(false);
        }
    };


    const handleEdit = (stock) => {
        setEditingStock(stock);
        setFormData({
            name: stock.name || "",
            category: stock.category || "",
            quantity: stock.quantity?.toString() || "",
            price: stock.price?.toString() || "",
            minThreshold: stock.minThreshold?.toString() || "",
            supplier: stock.supplier??"",
            image: stock.image_id
  ? `/image/${stock.image_id}`
  : (stock.image && stock.image.length === 24
      ? `/image/${stock.image}`
      : (stock.image?.startsWith('/') ? stock.image : `/static/uploads/${stock.image}`)),
            minOrder:stock.minOrder?.toString()||"",
            discount:stock.discount?.toString()||""
        });
            setSelectedImages([]);
            setPreviewUrl(stock.image_id ? `http://localhost:5000/image/${stock.image_id}` : null); // show existing image URL as selected
    };

    const handleUpdate = async (stock) => {
        if (!formData.name.trim()) {
            alert('Product name is required');
            return;
        }

        try {
            setLoading(true);

            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('category', formData.category);
            formDataToSend.append('quantity', parseInt(formData.quantity) || 0);
            formDataToSend.append('price', parseFloat(formData.price) || 0);
            if (formData.supplier?.trim()) {
                formDataToSend.append('supplier', formData.supplier.trim());
            }
            formDataToSend.append('minThreshold', parseInt(formData.minThreshold) || 0);
            formDataToSend.append('minOrder', parseInt(formData.minOrder) || 0);
            formDataToSend.append('discount', parseInt(formData.discount) || 0);

            if (selectedImages.length > 0 && selectedImages[0] instanceof File) {
                formDataToSend.append('image', selectedImages[0]);
            }

            await apiCall(`http://localhost:5000/api/stocks/${editingStock._id}`, {
                method: 'PUT',
                body: formDataToSend,
                // DO NOT set Content-Type header here!
            });

            alert('Stock updated successfully!');
            resetForm();
            setEditingStock(null);
            await fetchStocks();
            await fetchStats();
        } catch (error) {
            console.error('Error updating stock:', error);
            alert('Error updating stock: ' + error.message);
        } finally {
            setLoading(false);
        }
    };
    const handleDelete = async (stockId) => {
        if (!window.confirm("Are you sure you want to delete this stock?")) {
            return;
        }

        try {
            setLoading(true);
            await apiCall(`http://localhost:5000/api/stocks/${stockId}`, { method: 'DELETE' });
            alert('Stock deleted successfully!');
            await fetchStocks(); 
            await fetchStats();// Refresh the list
        } catch (error) {
            console.error('Error deleting stock:', error);
            alert('Error deleting stock: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        resetForm();
        setEditingStock(null);
        setIsAdding(false);
    };

    const filteredStocks = stocks.filter(stock => {
        const matchesSearch = stock.name?.toLowerCase().includes(searchItem.toLowerCase())||
    (stock.supplier?.name || "").toLowerCase().includes(searchItem.toLowerCase());;
        const matchesCategory = filterCategory ? stock.category === filterCategory : true;
        return matchesSearch && matchesCategory;
    });

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString();
        } catch {
            return 'N/A';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Loading Overlay */}
                {loading && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-xl shadow-xl">
                            <div className="flex items-center space-x-3">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                <span className="text-gray-700">Processing...</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-blue-500 rounded-xl">
                                <Package className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800">Stock Management</h1>
                                <p className="text-gray-600">Manage your inventory efficiently</p>
                            </div>
                        </div>
                            
                        <button
                            onClick={() => setIsAdding(true)}
                            disabled={loading}
                            className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="font-semibold">Add Stock</span>
                        </button>
                        <button
    onClick={() => navigate(`/dash`)} // ← Added closing ) and }
    disabled={loading}
className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
>
    {/* Add button content here */}
    Go to Dashboard
</button>
                        
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl p-4 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-100 text-sm">Total Items</p>
<p className="text-2xl font-bold">{stats.totalItems ?? 0}</p>
                                </div>
                                <Package className="w-8 h-8 text-green-200" />
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-blue-400 to-cyan-500 rounded-xl p-4 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-sm">Total Value</p>
<p className="text-2xl font-bold">
  ₹{Number(stats.totalValue || 0).toLocaleString()}
</p>
                                </div>
                                <TrendingUp className="w-8 h-8 text-blue-200" />
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-orange-400 to-red-500 rounded-xl p-4 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-orange-100 text-sm">Low Stock</p>
<p className="text-2xl font-bold">{stats.lowStockItems ?? 0}</p>
                                </div>
                                <AlertTriangle className="w-8 h-8 text-orange-200" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
                    <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Supplier"
                                value={formData.supplier || ""}
                                onChange={(e) => {
                                    const val = e.target.value.trim();
                                    setFormData({ ...formData, supplier: val.length > 0 ? val : "" });
                                }}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            />
                        </div>
                        <div className="md:w-48">
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            >
                                <option value="">All Categories</option>
                                {categories.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Add/Edit Form */}
                {(isAdding || editingStock) && (
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">
                            {isAdding ? 'Add New Stock Item' : 'Edit Stock Item'}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <label>
                                Upload image:
                                <input 
                                type="file"
                                accept="image/*" 
                                onChange={handleImageChange} 
                                />
                            </label>
                            {selectedImages && selectedImages.length > 0 && (
                                <div className="mt-2">
                                    <p className="text-sm text-gray-600">Selected image: {selectedImages[0].name}</p>
                                    {previewUrl && (
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-600">
                                            Selected image: {selectedImages?.[0]?.name || 'Current image'}
                                            </p>
                                            <img 
                                            src={previewUrl}
                                            alt="Preview"
                                            className="w-24 h-24 object-cover rounded-lg border"
                                            />
                                        </div>
                                    )}
                                </div>
                                )}
                            <input
                                type="text"
                                placeholder="Product Name *"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                required
                            />
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                required
                            >
                                <option value="">Select Category *</option>
                                {categorie.map(category => (
                                    <option key={category.id} value={category.id}>
                                        {category.icon} {category.name}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="number"
                                placeholder="Quantity *"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                required
                            />
                            <input
                                type="number"
                                step="0.01"
                                placeholder="Price *"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                required
                            />
                             <input
                                type="text"
                                placeholder="Supplier "
                                value={formData.supplier}
                                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                required
                            />
                            <input
                                type="number"
                                placeholder="Min Threshold"
                                value={formData.minThreshold}
                                onChange={(e) => setFormData({ ...formData, minThreshold: e.target.value })}
                                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            />
                            <input
                                type="number"
                                placeholder="Min Order"
                                value={formData.minOrder}
                                onChange={(e) => setFormData({ ...formData, minOrder: e.target.value })}
                                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            />
                            <input
                                type="number"
                                placeholder="Discount"
                                value={formData.discount}
                                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            />
                        </div>
                        <div className="flex space-x-4 mt-6">
                            <button
                                onClick={isAdding ? handleAdd : handleUpdate}
                                disabled={loading || !isFormValid}
                                style={{
                                '--tw-gradient-from': '#10b981',
                                '--tw-gradient-to': '#059669',
                                '--tw-gradient-stops': '#10b981, #059669'
                                                            }}
                                className="bg-gradient-to-r text-white px-6 py-3 rounded-xl"
                                                            >
                                <span>{isAdding ? 'Add' : 'Update'}</span>
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={loading}
                                className="flex items-center space-x-2 bg-gray-500 text-white px-6 py-3 rounded-xl hover:bg-gray-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <X className="w-4 h-4" />
                                <span>Cancel</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Stock Table */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredStocks.map((stock) => (
                                    <tr key={stock._id} className="hover:bg-gray-50 transition-colors duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{stock.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {stock.category || 'Uncategorized'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {stock.quantity}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            ₹{stock.price?.toFixed(2) || '0.00'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {stock.supplier || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {stock.quantity <= (stock.minThreshold || 0) ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    Low Stock
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    In Stock
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(stock.updatedAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEdit(stock)}
                                                    disabled={loading}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(stock._id)}
                                                    disabled={loading}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredStocks.length === 0 && !loading && (
                        <div className="text-center py-12">
                            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">No stock items found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StockManagement;





