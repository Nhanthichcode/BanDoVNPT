const express = require('express');
const router = express.Router();
const hienThiLoiHeThong = require('./xuly_loi');

const kiemTraDangNhap = (req, res, next) => {
    if (req.session.user) next(); else res.redirect('/dangnhap');
};

const kiemTraQuyenQuanTri = (req, res, next) => {
    const vaiTro = req.session.user.vai_tro_id;
    if (vaiTro === 1) next();
    else hienThiLoiHeThong(req, res, "TRUY CẬP BỊ TỪ CHỐI! Chức năng này chỉ dành cho Quản trị viên và Quản lý.");
};

//Route: Hiển thị trang thêm người dùng
router.get('/them', kiemTraDangNhap, kiemTraQuyenQuanTri, (req, res) => {
    res.render('quanly_them_nguoidung', {
        title: 'Thêm người dùng mới',
        user: req.session.user
    });
});

module.exports = router;