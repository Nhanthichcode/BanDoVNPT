const express = require('express');
const router = express.Router();

const kiemTraDangNhap = (req, res, next) => {
    if (req.session.user) next(); else res.redirect('/dangnhap');
};

//Route: Hiển thị form kiểm tra danh tính
router.get('/matkhau_doi', kiemTraDangNhap, (req, res) => {
    res.render('matkhau_doi', { 
        title: 'Cập nhật mật khẩu', 
        user: req.session.user,
        step: 1,
        error: null
    });
});

module.exports = router;