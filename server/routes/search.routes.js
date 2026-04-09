const express = require('express');
const router  = express.Router();
const { verifyJWT } = require('../middleware/auth.middleware');
const { globalSearch, getSearchSuggestions } = require('../controllers/search.controller');

router.get('/',           verifyJWT, globalSearch);
router.get('/suggestions',verifyJWT, getSearchSuggestions);

module.exports = router;
