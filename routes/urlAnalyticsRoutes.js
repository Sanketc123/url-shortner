const express = require('express');
const urlAnalysisController = require('../controllers/urlAnaluyticsController');
const middleware = require("../controllers/authController")
const router = express.Router();

router.get('/overall', middleware ,urlAnalysisController.getOverAllAnalytics)
router.get('/:alias', middleware, urlAnalysisController.getAnalyticsByAlias)
router.get('/topic/:topic', middleware, urlAnalysisController.getAnalyticsByTopic)


module.exports = router;