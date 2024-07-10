const express = require('express');
const router = express.Router();
const axios = require('axios');
const Transaction = require('../models/Transaction');

// Initialize database
router.get('/initialize-db', async (req, res) => {
  try {
    const response = await axios.get(process.env.API_URL);
    const transactions = response.data;

    await Transaction.deleteMany({});
    await Transaction.insertMany(transactions);

    res.json({ message: 'Database initialized successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error initializing database' });
  }
});

// List transactions
router.get('/transactions', async (req, res) => {
  try {
    const { month, search, page = 1, perPage = 10 } = req.query;
    const skip = (page - 1) * perPage;

    const query = {
      $expr: { $eq: [{ $month: '$dateOfSale' }, parseInt(month)] },
    };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { price: parseFloat(search) || 0 },
      ];
    }

    const transactions = await Transaction.find(query)
      .skip(skip)
      .limit(parseInt(perPage));

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions,
      total,
      page: parseInt(page),
      perPage: parseInt(perPage),
      totalPages: Math.ceil(total / perPage),
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching transactions' });
  }
});

// Statistics
router.get('/statistics', async (req, res) => {
  try {
    const { month } = req.query;

    const query = {
      $expr: { $eq: [{ $month: '$dateOfSale' }, parseInt(month)] },
    };

    const totalSaleAmount = await Transaction.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$price' } } },
    ]);

    const soldItems = await Transaction.countDocuments({ ...query, sold: true });
    const notSoldItems = await Transaction.countDocuments({ ...query, sold: false });

    res.json({
      totalSaleAmount: totalSaleAmount[0]?.total || 0,
      totalSoldItems: soldItems,
      totalNotSoldItems: notSoldItems,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching statistics' });
  }
});

// Bar chart
router.get('/bar-chart', async (req, res) => {
  try {
    const { month } = req.query;

    const query = {
      $expr: { $eq: [{ $month: '$dateOfSale' }, parseInt(month)] },
    };

    const ranges = [
      { min: 0, max: 100 },
      { min: 101, max: 200 },
      { min: 201, max: 300 },
      { min: 301, max: 400 },
      { min: 401, max: 500 },
      { min: 501, max: 600 },
      { min: 601, max: 700 },
      { min: 701, max: 800 },
      { min: 801, max: 900 },
      { min: 901, max: Infinity },
    ];

    const barChartData = await Promise.all(
      ranges.map(async (range) => {
        const count = await Transaction.countDocuments({
          ...query,
          price: { $gte: range.min, $lte: range.max },
        });
        return {
          range: `${range.min} - ${range.max === Infinity ? 'above' : range.max}`,
          count,
        };
      })
    );

    res.json(barChartData);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching bar chart data' });
  }
});

// Pie chart
router.get('/pie-chart', async (req, res) => {
  try {
    const { month } = req.query;

    const query = {
      $expr: { $eq: [{ $month: '$dateOfSale' }, parseInt(month)] },
    };

    const pieChartData = await Transaction.aggregate([
      { $match: query },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $project: { category: '$_id', count: 1, _id: 0 } },
    ]);

    res.json(pieChartData);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching pie chart data' });
  }
});

// Combined data
router.get('/combined-data', async (req, res) => {
  try {
    const { month } = req.query;

    const [transactions, statistics, barChartData, pieChartData] = await Promise.all([
      axios.get(`${req.protocol}://${req.get('host')}/api/transactions?month=${month}`),
      axios.get(`${req.protocol}://${req.get('host')}/api/statistics?month=${month}`),
      axios.get(`${req.protocol}://${req.get('host')}/api/bar-chart?month=${month}`),
      axios.get(`${req.protocol}://${req.get('host')}/api/pie-chart?month=${month}`),
    ]);

    res.json({
      transactions: transactions.data,
      statistics: statistics.data,
      barChartData: barChartData.data,
      pieChartData: pieChartData.data,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching combined data' });
  }
});

module.exports = router;
