const axios = require('axios');
const Product = require('../models/Product');
const moment = require('moment');

const initialiseDB = async (req, res) => {
    try {
        const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
        await Product.insertMany(response.data);
        res.send('Database initialized successfully.');
    } catch (error) {
        res.status(500).send('Error initializing database.');
    }
};

const getTransactions = async (req, res) => {
    const month = '10';
    const year = '2021';

    if (!month || !year) {
        return res.status(400).send({ message: 'Month and year are required' });
    }

    const startDate = moment(`${year}-${month}-01`, 'YYYY-MM-DD').startOf('month');
    const endDate = moment(startDate).endOf('month');

    try {
        const transactions = await Product.find({
            dateOfSale: {
                $gte: startDate.toDate(),
                $lt: endDate.toDate()
            }
        });

        res.json(transactions);
    } catch (error) {
        res.status(500).send('Error fetching transactions.');
    }
};

const getStatistics = async (req, res) => {
    const month = '10';
    const year = '2021';

    if (!month || !year) {
        return res.status(400).send({ message: 'Month and year are required' });
    }

    const startDate = moment(`${year}-${month}-01`, 'YYYY-MM-DD').startOf('month');
    const endDate = moment(startDate).endOf('month');

    try {
        const totalSaleAmount = await Product.aggregate([
            {
                $match: {
                    dateOfSale: { $gte: startDate.toDate(), $lt: endDate.toDate() }
                }
            },
            {
                $group: {
                    _id: null,
                    totalSaleAmount: { $sum: "$price" }
                }
            }
        ]);

        const totalSoldItems = await Product.countDocuments({
            dateOfSale: { $gte: startDate.toDate(), $lt: endDate.toDate() },
            sold: true
        });

        const totalNotSoldItems = await Product.countDocuments({
            dateOfSale: { $gte: startDate.toDate(), $lt: endDate.toDate() },
            sold: false
        });

        res.json({
            totalSaleAmount: totalSaleAmount[0]?.totalSaleAmount || 0,
            totalSoldItems,
            totalNotSoldItems
        });
    } catch (error) {
        res.status(500).send('Error fetching statistics.');
    }
};

const getBarChart = async (req, res) => {
    const month = '10';

    if (!month) {
        return res.status(400).send({ message: 'Month is required' });
    }

    const priceRanges = [
        { range: '0-100', min: 0, max: 100 },
        { range: '101-200', min: 101, max: 200 },
        { range: '201-300', min: 201, max: 300 },
        { range: '301-400', min: 301, max: 400 },
        { range: '401-500', min: 401, max: 500 },
        { range: '501-600', min: 501, max: 600 },
        { range: '601-700', min: 601, max: 700 },
        { range: '701-800', min: 701, max: 800 },
        { range: '801-900', min: 801, max: 900 },
        { range: '901-above', min: 901, max: Infinity }
    ];

    try {
        const startDate = moment().month(month - 1).startOf('month').toDate();
        const endDate = moment().month(month - 1).endOf('month').toDate();

        const result = await Product.aggregate([
            {
                $match: {
                    dateOfSale: {
                        $gte: startDate,
                        $lt: endDate
                    }
                }
            },
            {
                $bucket: {
                    groupBy: "$price",
                    boundaries: [0, 101, 201, 301, 401, 501, 601, 701, 801, 901, Infinity],
                    default: "901-above",
                    output: {
                        count: { $sum: 1 }
                    }
                }
            },
            {
                $addFields: {
                    range: {
                        $switch: {
                            branches: [
                                { case: { $lte: ["$_id", 100] }, then: "0-100" },
                                { case: { $and: [{ $gt: ["$_id", 100] }, { $lte: ["$_id", 200] }] }, then: "101-200" },
                                { case: { $and: [{ $gt: ["$_id", 200] }, { $lte: ["$_id", 300] }] }, then: "201-300" },
                                { case: { $and: [{ $gt: ["$_id", 300] }, { $lte: ["$_id", 400] }] }, then: "301-400" },
                                { case: { $and: [{ $gt: ["$_id", 400] }, { $lte: ["$_id", 500] }] }, then: "401-500" },
                                { case: { $and: [{ $gt: ["$_id", 500] }, { $lte: ["$_id", 600] }] }, then: "501-600" },
                                { case: { $and: [{ $gt: ["$_id", 600] }, { $lte: ["$_id", 700] }] }, then: "601-700" },
                                { case: { $and: [{ $gt: ["$_id", 700] }, { $lte: ["$_id", 800] }] }, then: "701-800" },
                                { case: { $and: [{ $gt: ["$_id", 800] }, { $lte: ["$_id", 900] }] }, then: "801-900" },
                                { case: { $gt: ["$_id", 900] }, then: "901-above" }
                            ],
                            default: "unknown"
                        }
                    }
                }
            }
        ]);

        const response = priceRanges.map(range => {
            const rangeData = result.find(r => r.range === range.range) || { count: 0 };
            return { range: range.range, count: rangeData.count };
        });

        res.json(response);
    } catch (error) {
        res.status(500).send('Error fetching bar chart data.');
    }
};


const getPieChart = async (req, res) => {
    const month = '10'; 

    if (!month || isNaN(parseInt(month))) {
        return res.status(400).send({ message: 'Valid month is required' });
    }

    try {
        const startDate = moment(`${month}-01`, 'MM-DD').startOf('month').toDate();
        const endDate = moment(startDate).endOf('month').toDate();

        const result = await Product.aggregate([
            {
                $match: {
                    dateOfSale: {
                        $gte: startDate,
                        $lt: endDate
                    }
                }
            },
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 }
                }
            }
        ]);

        const response = result.map(category => ({
            category: category._id,
            count: category.count
        }));

        res.json(response);
    } catch (error) {
        res.status(500).send('Error fetching pie chart data.');
    }
};



module.exports = { initialiseDB, getTransactions, getStatistics, getBarChart, getPieChart };