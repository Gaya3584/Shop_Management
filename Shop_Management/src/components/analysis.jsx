import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Filter, Download, Calendar, TrendingUp, DollarSign, Package, Store } from 'lucide-react';
import './analysis.css';

const WeeklySalesAnalysis = () => {
  // const [selectedShop, setSelectedShop] = useState('all');
  const [startDate, setStartDate] = useState('2025-05-19');
  const [endDate, setEndDate] = useState('2025-06-02');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [chartType, setChartType] = useState('pie');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sellingOrders,setSellingOrders]=useState([])

  const fetchSellOrders=async()=>{
    setLoading(true);
    try{
      const response=await fetch('http://localhost:5000/api/orders/sales',{
        method:'GET',
        credentials:'include'
      });
      const data=await response.json();
      if(data.message){
        setError(data.message);
      }
      else
      {
        setSellingOrders(data.sellingOrders||[]);
      }
    }
    catch(error)
    {
      console.error("Error fetching orders:",error);
      setError("Failed to fetch orders data");
    }
    finally{
      setLoading(false);
    }
  };
  useEffect(()=>{
    fetchSellOrders();
  },[]);
  const [filteredData, setFilteredData] = useState([]);

  // Filter data based on selected criteria
  useEffect(() => {
    let filtered = sellingOrders;
    setFilteredData(filtered);
  }, [ startDate, endDate, sellingOrders]);
const productSummary = filteredData.reduce((acc, item) => {
  const productName = item.product_name;
  if (!productName) return acc;
  
  if (!acc[productName]) {
    acc[productName] = {
      name: productName,
      totalQuantity: 0,
      totalRevenue: 0,
      orderCount: 0
    };
  }
  
  acc[productName].totalQuantity += item.quantity || 0;
  acc[productName].totalRevenue += item.total_price || 0;
  acc[productName].orderCount += 1;
  
  return acc;
}, {});

const productArray = Object.values(productSummary);
  // Calculate summary statistics
  const summaryStats = {
  totalRevenue: filteredData.reduce((sum, item) => sum + (item.total_price || 0), 0),
  totalQuantity: filteredData.reduce((sum, item) => sum + (item.quantity || 0), 0),
  
  bestSellingProduct: productArray.length > 0 ? 
    productArray.reduce((best, product) => 
      product.totalQuantity > (best?.totalQuantity || 0) ? product : best
    , null) : null,
    
  worstSellingProduct: productArray.length > 0 ?
    productArray.reduce((worst, product) => 
      product.totalQuantity < (worst?.totalQuantity || Infinity) ? product : worst
    , null) : null,
    
  totalOrders: filteredData.length,
  totalProducts: productArray.length
};
const handleTableCSVDownload = () => {
    if (!filteredData?.length) return;

    const headers = ['Order ID', 'Customer', 'Shop', 'Order Date', 'Quantity', 'Total Price', 'Status'];

    const rows = filteredData.map(row => [
      row._id,
      row.customerName,
      row.shopName,
      new Date(row.orderedAt).toLocaleDateString(),
      row.quantity,
      row.total_price,
      row.status,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'detailed-sales-data.csv');
    link.click();
    alert('CSV downloaded successfully!');
  };

  const pieChartData = filteredData.reduce((acc, item) => {
    // Try different possible product name fields or use customer name as fallback
    const productName = item.product_name ;
    const existing = acc.find(d => d.name === productName);
    if (existing) {
      existing.value += item.total_price || 0;
      existing.quantity += item.quantity || 0;
    } else {
      acc.push({
        name: productName,
        value: item.total_price || 0,
        quantity: item.quantity || 0,
        category: item.category || 'General'
      });
    }
    return acc;
  }, []).filter(item => item.value > 0); // Filter out items with zero value

  // Debug log
  console.log('Filtered Data:', filteredData);
  console.log('Pie Chart Data:', pieChartData);

  const barChartData = filteredData.reduce((acc, item) => {
    const date = new Date(item.orderedAt).toLocaleDateString();
    const existing = acc.find(d => d.name === date);
    if (existing) {
      existing.revenue += item.total_price || 0;
      existing.quantity += item.quantity || 0;
    } else {
      acc.push({
        name: date,
        revenue: item.total_price || 0,
        quantity: item.quantity || 0
      });
    }
    return acc;
  }, []).sort((a, b) => new Date(a.name) - new Date(b.name));

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0', '#ffb347', '#87ceeb'];

  // Sorting functionality
  const sortData = (column) => {
    const direction = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(column);
    setSortDirection(direction);
    
    const sorted = [...filteredData].sort((a, b) => {
      if (direction === 'asc') {
        return a[column] > b[column] ? 1 : -1;
      } else {
        return a[column] < b[column] ? 1 : -1;
      }
    });
    setFilteredData(sorted);
  };

  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  // Date quick filters
  const setQuickDateFilter = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  };

  // Handle pie chart click for drill-down
  const handlePieClick = (data) => {
    setSelectedProduct(data);
  };

  if (loading) {
    return (
      <div className="sales-analysis">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading sales data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sales-analysis">
        <div className="error-message">
          <p>Error loading data: {error}</p>
          <button onClick={() => setError('')}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="sales-analysis">
      {/* Header */}
      <button className="btn btn-back" onClick={() => window.history.back()}>
            Back
          </button>
      <div className="header">
        <h1>Weekly Sales Analysis</h1>
        <div className="header-actions">
          <button className="export-btn" onClick={handleTableCSVDownload}>
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        

        <div className="filter-group">
          <label>
            <Calendar size={16} />
            Date Range:
          </label>
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="date-input"
          />
          <span>to</span>
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="date-input"
          />
        </div>

        <div className="quick-filters">
          <button onClick={() => setQuickDateFilter(7)}>Last 7 days</button>
          <button onClick={() => setQuickDateFilter(30)}>Last 30 days</button>
          <button onClick={() => setQuickDateFilter(90)}>Last 3 months</button>
        </div>
      </div>

      {/* Summary Section */}
      <div className="summary-section">
        <div className="summary-card">
          <div className="summary-icon">
            <DollarSign size={24} />
          </div>
          <div className="summary-content">
            <h3>₹{summaryStats.totalRevenue.toLocaleString()}</h3>
            <p>Total Revenue</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">
            <Package size={24} />
          </div>
          <div className="summary-content">
            <h3>{summaryStats.totalQuantity.toLocaleString()}</h3>
            <p>Items Sold</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">
            <TrendingUp size={24} />
          </div>
          <div className="summary-content">
            <h3>{summaryStats.bestSellingProduct?.name || 'N/A'}</h3>
            <p>Best Selling prdouct</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">
            <Filter size={24} />
            </div>
            <div className="summary-content">
                <h3>{summaryStats.worstSellingProduct?.name||'N/A'}</h3>
                <p>Worst Selling product</p>
            </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">
            <Store size={24} />
          </div>
          <div className="summary-content">
            <h3>{summaryStats.totalOrders}</h3>
            <p>Total orders</p>
          </div>
        </div>
      </div>

      {/* Chart Controls */}
      <div className="chart-controls">
        <div className="chart-type-selector">
          <button 
            className={chartType === 'pie' ? 'active' : ''}
            onClick={() => setChartType('pie')}
          >
            Product Sales Share
          </button>
          <button 
            className={chartType === 'bar' ? 'active' : ''}
            onClick={() => setChartType('bar')}
          >
            Shop Performance
          </button>
        </div>
      </div>

      {/* Data Visualization */}
      <div className="visualization-section">
        {chartType === 'pie' ? (
          <div className="chart-container">
            <h3>Sales Share by Product</h3>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  onClick={handlePieClick}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="chart-container">
            <h3>Shop Performance Comparison</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value, name) => [
                    name === 'Revenue ($)' ? `${value.toLocaleString()}` : value.toLocaleString(),
                    name === 'Revenue ($)' ? 'Revenue' : 'Items Sold'
                  ]} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#8884d8" name="Revenue ($)" />
                  <Bar dataKey="quantity" fill="#82ca9d" name="Items Sold" />
                </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Product Drill-down (if selected) */}
      {selectedProduct && (
        <div className="drill-down-section">
          <div className="drill-down-header">
            <h3>Product Details: {selectedProduct.name}</h3>
            <button onClick={() => setSelectedProduct(null)}>×</button>
          </div>
          <div className="drill-down-content">
            <p><strong>Category:</strong> {selectedProduct.category}</p>
            <p><strong>Total Revenue:</strong> ₹{selectedProduct.value.toLocaleString()}</p>
            <p><strong>Units Sold:</strong> {selectedProduct.quantity.toLocaleString()}</p>
            <p><strong>Average Price:</strong> ₹{(selectedProduct.value / selectedProduct.quantity).toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="table-section">
        <div className="table-header">
          <h3>Detailed Sales Data</h3>
          <div className="table-info">
            Showing {paginatedData.length} of {filteredData.length} records
          </div>
        </div>

        {filteredData.length === 0 ? (
          <div className="no-data">
            <p>No data available for the selected criteria.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      onClick={() => sortData('_id')} 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      Order ID {sortColumn === '_id' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      onClick={() => sortData('customerName')} 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      Customer {sortColumn === 'customerName' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      onClick={() => sortData('shopName')} 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      Shop {sortColumn === 'shopName' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      onClick={() => sortData('orderedAt')} 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      Order Date {sortColumn === 'orderedAt' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      onClick={() => sortData('quantity')} 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      Quantity {sortColumn === 'quantity' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      onClick={() => sortData('total_price')} 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      Total Price {sortColumn === 'total_price' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      onClick={() => sortData('status')} 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      Status {sortColumn === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedData.map((row, index) => (
                    <tr key={row._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row._id.slice(-8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.customerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.shopName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(row.orderedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {row.quantity.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        ₹{row.total_price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          row.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : row.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>


            {/* Pagination */}
            <div className="pagination">
              <button 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="page-info">
                Page {currentPage} of {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WeeklySalesAnalysis;