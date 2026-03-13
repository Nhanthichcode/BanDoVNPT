const express = require('express');
const router = express.Router();

//Route: Đăng xuất
router.get('/dangxuat', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

module.exports = router;