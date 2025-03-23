const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');

router.get('/', DashboardController.getStats);

module.exports = router;
