const express = require('express');
const urlShortController = require('../controllers/urlShortnerController')
const middleware = require("../controllers/authController")
const router = express.Router();

router.post('/shorten', middleware, urlShortController.createShortUrl);

router.get('/shorten/:alias', urlShortController.redirectShortUrl)

module.exports = router;