const express = require('express');
const router = express.Router();
const sql = require('mssql');
const hienThiLoiHeThong = require('./xuly_loi');
const dbManager = require('../database');//thêm cái này

// Cấu hình SQL
// const sqlConfig = {
//     user: 'sa', password: 'sql2019', database: 'VNPT_BanDo_Admin', server: 'localhost', port: 1433,
//     options: { encrypt: false, trustServerCertificate: true }
// };

const kiemTraDangNhap = (req, res, next) => {
    if (req.session.user) next(); else res.redirect('/dangnhap');
};

//Route: Hiển thị giao diện cập nhật hồ sơ
router.get('/capnhat', kiemTraDangNhap, async (req, res) => {
    try {
        const pool = await dbManager.getSQLPool();
        let result = await pool.request()
            .input('tenDangNhap', sql.VarChar, req.session.user.ten_dang_nhap)
            .query(`SELECT * FROM TaiKhoan WHERE ten_dang_nhap = @tenDangNhap`);

        if (result.recordset.length > 0) {
            res.render('pages/taikhoan_capnhat', { 
                title: 'Cập nhật hồ sơ', 
                user: req.session.user,
                thongTin: result.recordset[0],
                activePage: 'capnhat_taikhoan'
            });
        } else {
            res.redirect('/');
        }
    } catch (error) {
        console.error("Lỗi lấy dữ liệu cập nhật:", error);
        hienThiLoiHeThong(req, res);
    }
});

module.exports = router;