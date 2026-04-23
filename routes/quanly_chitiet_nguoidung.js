const express = require('express');
const router = express.Router();
const sql = require('mssql');
const hienThiLoiHeThong = require('./xuly_loi');
const dbManager = require('../database');//thêm cái này
// const sqlConfig = {
//     user: 'sa', password: 'sql2019', database: 'VNPT_BanDo_Admin', server: 'localhost', port: 1433,
//     options: { encrypt: false, trustServerCertificate: true }
// };

const kiemTraDangNhap = (req, res, next) => { if (req.session.user) next(); else res.redirect('/dangnhap'); };
const kiemTraQuyenQuanTri = (req, res, next) => {
    if (req.session.user.vai_tro_id === 1 || req.session.user.vai_tro_id === 2) next(); 
    else hienThiLoiHeThong(req, res, "TRUY CẬP BỊ TỪ CHỐI!");
};

//Route: Hiển thị giao diện
router.get('/chitiet/:username', kiemTraDangNhap, kiemTraQuyenQuanTri, async (req, res) => {
    try {
        let pool = await dbManager.getSQLPool();
        let result = await pool.request()
            .input('user', sql.VarChar, req.params.username)
            .query(`
                SELECT tk.*, vt.ten_vai_tro 
                FROM TaiKhoan tk 
                LEFT JOIN VaiTro vt ON tk.vai_tro_id = vt.id 
                WHERE tk.ten_dang_nhap = @user
            `);

        if (result.recordset.length === 0) return hienThiLoiHeThong(req, res, "Không tìm thấy người dùng này!");

        res.render('pages/quanly_chitiet_nguoidung', {
            title: 'Chi tiết tài khoản',
            user: req.session.user,
            taiKhoanChiTiet: result.recordset[0],
            showSensitive: false //Mặc định khóa thông tin nhạy cảm
        });

    } catch (error) { hienThiLoiHeThong(req, res); }
});

module.exports = router;