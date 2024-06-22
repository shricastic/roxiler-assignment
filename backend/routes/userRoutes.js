const express = require('express');
const router = express.Router();
const {initialiseDB, getTransactions, getStatistics, getBarChart, getPieChart}= require('../controllers/userControllers')         

router.get('/init', initialiseDB);
router.get('/transactions', getTransactions);
router.get('/statistics', getStatistics);
router.get('/bar-chart', getBarChart);
router.get('/pie-chart', getPieChart);  


module.exports = router;