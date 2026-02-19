const express = require('express');
const router = express.Router();
const { getLocalities, getFilters, geocodeLocality } = require('../controllers/localityController');

router.get('/', getLocalities);
router.get('/filters', getFilters);
router.get('/geocode', geocodeLocality);

module.exports = router;
