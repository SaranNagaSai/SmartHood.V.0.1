const express = require('express');
const router = express.Router();
const { testEmailConfig } = require('../controllers/debugController');

router.get('/email', testEmailConfig);

module.exports = router;
