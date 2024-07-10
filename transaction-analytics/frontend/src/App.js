import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';
ChartJS.register(...registerables);

const API_BASE_URL = 'http://localhost:3000/api';

function App() {
  const [month, setMonth] = useState(3);
  const [transactions, setTransactions] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [barChartData, setBarChartData] = useState({});
  const [pieChartData, setPieChartData] = useState({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchData();
  }, [month, search, page]);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/combined-data`, {
        params: { month, search, page },
      });
      setTransactions(response.data.transactions.transactions);
      setStatistics(response.data.statistics);
      setBarChartData({
        labels: response.data.barChartData.map((item) => item.range),
        datasets: [
          {
            label: 'Number of Items',
            data: response.data.barChartData.map((item) => item.count),
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
          },
        ],
      });
      setPieChartData({
        labels: response.data.pieChartData.map((item) => item.category),
        datasets: [
          {
            data: response.data.pieChartData.map((item) => item.count),
            backgroundColor: [
              '#FF6384',
              '#36A2EB',
              '#FFCE56',
              '#4BC0C0',
              '#9966FF',
              '#FF9F40',
            ],
          },
        ],
      });
      setTotalPages(response.data.transactions.totalPages);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleMonthChange = (e) => {
    setMonth(parseInt(e.target.value));
    setPage(1);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  return (
    <div className="App">
      <h1>Transaction Analytics</h1>
      <div>
        <label>Select Month: </label>
        <select value={month} onChange={handleMonthChange}>
          {[...Array(12)].map((_, i) => (
            <option key={i} value={i + 1}>
              {new Date(0, i).toLocaleString('default', { month: 'long' })}
            </option>
          ))}
        </select>
      </div>
      <div>
        <input
          type="text"
          placeholder="Search transactions"
          value={search}
          onChange={handleSearchChange}
        />
      </div>
      <h2>Transactions</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Description</th>
            <th>Price</th>
            <th>Category</th>
            <th>Sold</th>
            <th>Date of Sale</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td>{transaction.id}</td>
              <td>{transaction.title}</td>
              <td>{transaction.description}</td>
              <td>${transaction.price.toFixed(2)}</td>
              <td>{transaction.category}</td>
              <td>{transaction.sold ? 'Yes' : 'No'}</td>
              <td>{new Date(transaction.dateOfSale).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <button onClick={handlePrevPage} disabled={page === 1}>
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button onClick={handleNextPage} disabled={page === totalPages}>
          Next
        </button>
      </div>
      <h2>Statistics</h2>
      <div>
        <p>Total Sale Amount: ${statistics.totalSaleAmount?.toFixed(2)}</p>
        <p>Total Sold Items: {statistics.totalSoldItems}</p>
        <p>Total Not Sold Items: {statistics.totalNotSoldItems}</p>
      </div>
      <h2>Bar Chart</h2>
      <Bar data={barChartData} />
      <h2>Pie Chart</h2>
      <Pie data={pieChartData} />
    </div>
  );
}

export default App;
