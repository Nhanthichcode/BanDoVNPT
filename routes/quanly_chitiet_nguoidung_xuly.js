const express = require('express');
const router = express.Router();
const sql = require('mssql');
const hienThiLoiHeThong = require('./xuly_loi');

const { sqlConfig } = require('../database');

const kiemTraDangNhap = (req, res, next) => { if (req.session.user) next(); else res.redirect('/dangnhap'); };
const kiemTraQuyenQuanTri = (req, res, next) => {
    const vaiTro = req.session.user.vai_tro_id;
    if (vaiTro === 1) next(); 
    else hienThiLoiHeThong(req, res, "TRUY CẬP BỊ TỪ CHỐI!");
};

//Route: Xử lý xác thực bảo mật
router.post('/chitiet_xuly', kiemTraDangNhap, kiemTraQuyenQuanTri, async (req, res) => {
    try {
        const { ten_dang_nhap_muc_tieu, mat_khau_admin } = req.body;
        const adminUser = req.session.user.ten_dang_nhap;

        let pool = await sql.connect(sqlConfig);

        //Kiểm tra mật khẩu Admin
        let checkPass = await pool.request()
            .input('admin', sql.VarChar, adminUser)
            .input('pass', sql.VarChar, mat_khau_admin)
            .query('SELECT ten_dang_nhap FROM TaiKhoan WHERE ten_dang_nhap = @admin AND mat_khau = @pass');

        //Nếu sai thì sẽ trả Admin về trang Quản lý tài khoản mà không báo lý do cụ thể (tránh lộ thông tin người dùng và mật khẩu)
        if (checkPass.recordset.length === 0) {
            return res.redirect('/quanly/taikhoan');
        }

        //Nếu đúng thì xem được thông tin tài khoản
        let result = await pool.request()
            .input('user', sql.VarChar, ten_dang_nhap_muc_tieu)
            .query(`
                SELECT tk.*, vt.ten_vai_tro 
                FROM TaiKhoan tk 
                LEFT JOIN VaiTro vt ON tk.vai_tro_id = vt.id 
                WHERE tk.ten_dang_nhap = @user
            `);

        res.render('quanly_chitiet_nguoidung', {
            title: 'Chi tiết tài khoản',
            user: req.session.user,
            taiKhoanChiTiet: result.recordset[0],
            showSensitive: true //Bật thông tin nhạy cảm
        });

    } catch (error) { hienThiLoiHeThong(req, res); }
});

module.exports = router;