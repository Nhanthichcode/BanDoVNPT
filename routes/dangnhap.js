const express = require('express');
const router = express.Router();

//Route: Hiện form đăng nhập
router.get('/dangnhap', (req, res) => {
    //Trở về trang chủ sau khi đã đăng nhập
    if (req.session.user) return res.redirect('/');
    res.render('dangnhap');
});

module.exports = router;