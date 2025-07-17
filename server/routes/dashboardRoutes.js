const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');
const jwtAuth = require('../middleware/jwtAuth');
const roleAuth = require('../middleware/roleAuth');

router.get('/', jwtAuth, roleAuth, DashboardController.getStats);

module.exports = router;
