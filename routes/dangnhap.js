const express = require('express');
const router = express.Router();

//Route: Hiện trang đăng nhập
router.get('/dangnhap', (req, res) => {

    if (req.session.user) return res.redirect('/');
    res.render('dangnhap');
});

module.exports = router;