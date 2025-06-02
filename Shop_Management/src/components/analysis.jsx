import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Filter, Download, Calendar, TrendingUp, DollarSign, Package, Store } from 'lucide-react';
import './analysis.css';

const WeeklySalesAnalysis = () => {
  const [selectedShop, setSelectedShop] = useState('all');
  const [startDate, setStartDate] = useState('2025-05-19');
  const [endDate, setEndDate] = useState('2025-06-02');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [chartType, setChartType] = useState('pie');
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Mock data - replace with actual API calls
  const shops = [
    { id: 'all', name: 'All Shops' },
    { id: 'shop001', name: 'Downtown Store' },
    { id: 'shop002', name: 'Mall Location' },
    { id: 'shop003', name: 'Airport Branch' },
    { id: 'shop004', name: 'Online Store' }
  ];

  const mockSalesData = [
    { shopId: 'shop001', shopName: 'Downtown Store', productId: 'apple', productName: 'Apple iPhone 15', weekStart: '2025-05-26', quantitySold: 100, revenue: 79900, category: 'Electronics' },
    { shopId: 'shop002', shopName: 'Mall Location', productId: 'samsung', productName: 'Samsung Galaxy S24', weekStart: '2025-05-26', quantitySold: 85, revenue: 67900, category: 'Electronics' },
    { shopId: 'shop001', shopName: 'Downtown Store', productId: 'laptop', productName: 'MacBook Pro', weekStart: '2025-05-26', quantitySold: 45, revenue: 89900, category: 'Computers' },
    { shopId: 'shop003', shopName: 'Airport Branch', productId: 'headphones', productName: 'AirPods Pro', weekStart: '2025-05-26', quantitySold: 120, revenue: 29900, category: 'Accessories' },
    { shopId: 'shop004', shopName: 'Online Store', productId: 'tablet', productName: 'iPad Air', weekStart: '2025-05-26', quantitySold: 65, revenue: 38900, category: 'Electronics' },
    { shopId: 'shop002', shopName: 'Mall Location', productId: 'watch', productName: 'Apple Watch', weekStart: '2025-05-26', quantitySold: 95, revenue: 37900, category: 'Wearables' },
    { shopId: 'shop001', shopName: 'Downtown Store', productId: 'charger', productName: 'USB-C Charger', weekStart: '2025-05-26', quantitySold: 200, revenue: 5900, category: 'Accessories' },
    { shopId: 'shop003', shopName: 'Airport Branch', productId: 'case', productName: 'Phone Case', weekStart: '2025-05-26', quantitySold: 180, revenue: 3600, category: 'Accessories' }
  ];

  const [salesData, setSalesData] = useState(mockSalesData);
  const [filteredData, setFilteredData] = useState(mockSalesData);

  // Filter data based on selected criteria
  useEffect(() => {
    let filtered = salesData;
    
    if (selectedShop !== 'all') {
      filtered = filtered.filter(item => item.shopId === selectedShop);
    }
    
    // Filter by date range (mock implementation)
    // In real app, you'd filter by actual date ranges
    
    setFilteredData(filtered);
  }, [selectedShop, startDate, endDate, salesData]);

  // Calculate summary statistics
  const summaryStats = {
    totalRevenue: filteredData.reduce((sum, item) => sum + item.revenue, 0),
    totalQuantity: filteredData.reduce((sum, item) => sum + item.quantitySold, 0),
    bestSellingProduct: filteredData.reduce((best, item) => 
      item.quantitySold > (best?.quantitySold || 0) ? item : best, null
    ),
    totalShops: new Set(filteredData.map(item => item.shopId)).size
  };

  // Prepare chart data
  const pieChartData = filteredData.reduce((acc, item) => {
    const existing = acc.find(d => d.name === item.productName);
    if (existing) {
      existing.value += item.revenue;
      existing.quantity += item.quantitySold;
    } else {
      acc.push({
        name: item.productName,
        value: item.revenue,
        quantity: item.quantitySold,
        category: item.category
      });
    }
    return acc;
  }, []);

  const barChartData = shops.slice(1).map(shop => {
    const shopData = filteredData.filter(item => item.shopId === shop.id);
    return {
      name: shop.name,
      revenue: shopData.reduce((sum, item) => sum + item.revenue, 0),
      quantity: shopData.reduce((sum, item) => sum + item.quantitySold, 0)
    };
  });

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

  // Export functionality
  const exportToCSV = () => {
    const headers = ['Shop ID', 'Shop Name', 'Product ID', 'Product Name', 'Week Start', 'Quantity Sold', 'Revenue'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => [
        row.shopId,
        row.shopName,
        row.productId,
        row.productName,
        row.weekStart,
        row.quantitySold,
        row.revenue
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'weekly-sales-analysis.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

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
      <div className="header">
        <h1>Weekly Sales Analysis</h1>
        <div className="header-actions">
          <button className="export-btn" onClick={exportToCSV}>
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filter-group">
          <label>
            <Store size={16} />
            Shop:
          </label>
          <select 
            value={selectedShop} 
            onChange={(e) => setSelectedShop(e.target.value)}
            className="shop-selector"
          >
            {shops.map(shop => (
              <option key={shop.id} value={shop.id}>{shop.name}</option>
            ))}
          </select>
        </div>

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
            <h3>${summaryStats.totalRevenue.toLocaleString()}</h3>
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
            <h3>{summaryStats.bestSellingProduct?.productName || 'N/A'}</h3>
            <p>Best Seller</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">
            <Filter size={24} />
            </div>
            <div className="summary-content">
                <h3>{summaryStats.worstSellingProduct?.productName||'N/A'}</h3>
                <p>Worst Seller</p>
            </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">
            <Store size={24} />
          </div>
          <div className="summary-content">
            <h3>{summaryStats.totalShops}</h3>
            <p>Active Shops</p>
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
                  name === 'revenue' ? `$${value.toLocaleString()}` : value.toLocaleString(),
                  name === 'revenue' ? 'Revenue' : 'Quantity'
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
            <p><strong>Total Revenue:</strong> ${selectedProduct.value.toLocaleString()}</p>
            <p><strong>Units Sold:</strong> {selectedProduct.quantity.toLocaleString()}</p>
            <p><strong>Average Price:</strong> ${(selectedProduct.value / selectedProduct.quantity).toFixed(2)}</p>
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
            <div className="table-container">
              <table className="sales-table">
                <thead>
                  <tr>
                    <th onClick={() => sortData('shopId')} className="sortable">
                      Shop ID {sortColumn === 'shopId' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => sortData('shopName')} className="sortable">
                      Shop Name {sortColumn === 'shopName' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => sortData('productName')} className="sortable">
                      Product {sortColumn === 'productName' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => sortData('weekStart')} className="sortable">
                      Week Start {sortColumn === 'weekStart' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => sortData('quantitySold')} className="sortable">
                      Quantity {sortColumn === 'quantitySold' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => sortData('revenue')} className="sortable">
                      Revenue {sortColumn === 'revenue' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((row, index) => (
                    <tr key={index}>
                      <td>{row.shopId}</td>
                      <td>{row.shopName}</td>
                      <td>{row.productName}</td>
                      <td>{row.weekStart}</td>
                      <td className="number">{row.quantitySold.toLocaleString()}</td>
                      <td className="currency">${row.revenue.toLocaleString()}</td>
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