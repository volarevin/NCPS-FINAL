const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

router.get('/services', publicController.getPublicServices);
router.get('/testimonials', publicController.getTestimonials);

module.exports = router;
