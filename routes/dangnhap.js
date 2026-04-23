const express = require('express');
const router = express.Router();

//Route: Hiện trang đăng nhập
router.get('/dangnhap', (req, res) => {

    if (req.session.user) return res.redirect('/');
    res.render('pages/dangnhap', { title: "Đăng nhập - Hệ thống giám sát mạng lưới VNPT", layout: false,
        error: null, 
        oldUsername: ''  });
});

module.exports = router;