const express = require('express');
const router = express.Router();
const { getLocalities, getFilters, geocodeLocality, getPublicStats } = require('../controllers/localityController');

router.get('/', getLocalities);
router.get('/filters', getFilters);
router.get('/geocode', geocodeLocality);
router.get('/public-stats', getPublicStats);

module.exports = router;
