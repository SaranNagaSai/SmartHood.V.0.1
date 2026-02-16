const express = require('express');
const router = express.Router();
const { getLocalities, getFilters } = require('../controllers/localityController');

router.get('/', getLocalities);
router.get('/filters', getFilters);

module.exports = router;
