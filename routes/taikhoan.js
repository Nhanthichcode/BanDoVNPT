const express = require('express');
const router = express.Router();
const sql = require('mssql');
const hienThiLoiHeThong = require('./xuly_loi');
const { sqlConfig } = require('../database');
const kiemTraDangNhap = (req, res, next) => {
    if (req.session.user) next(); else res.redirect('/dangnhap');
};

//Route: Trang hồ sơ cá nhân
router.get('/hoso', kiemTraDangNhap, async (req, res) => {
    try {
        let pool = await sql.connect(sqlConfig);
        let result = await pool.request()
            .input('tenDangNhap', sql.VarChar, req.session.user.ten_dang_nhap)
            .query(`SELECT tk.*, vt.ten_vai_tro FROM TaiKhoan tk LEFT JOIN VaiTro vt ON tk.vai_tro_id = vt.id WHERE tk.ten_dang_nhap = @tenDangNhap`);

        if (result.recordset.length > 0) {
            res.render('taikhoan', { title: 'Hồ sơ cá nhân', user: req.session.user, thongTin: result.recordset[0] });
        } else {
            res.status(404).send("Không tìm thấy thông tin tài khoản.");
        }
    } catch (error) {
        console.error("Lỗi:", error);
        hienThiLoiHeThong(req, res);
    }
});

module.exports = router;