const express = require('express');
const router = express.Router();
const sql = require('mssql');
const hienThiLoiHeThong = require('./xuly_loi');

const { sqlConfig } = require('../database');
const kiemTraDangNhap = (req, res, next) => {
    if (req.session.user) next(); else res.redirect('/dangnhap');
};

//Kiểm tra xem có phải Admin hoặc Quản lý không
const kiemTraQuyenQuanTri = (req, res, next) => {
    const vaiTro = req.session.user.vai_tro_id;
    //Nếu là Admin hoặc Quản lý thì tiếp tục
    if (vaiTro === 1 || vaiTro === 2) {
        next();
    } else {
        hienThiLoiHeThong(req, res, "TRUY CẬP BỊ TỪ CHỐI!");
    }
};

//Route: Hiển thị danh sách người dùng
router.get('/', kiemTraDangNhap, kiemTraQuyenQuanTri, async (req, res) => {
    try {
        let pool = await sql.connect(sqlConfig);

        //Truy vấn lấy toàn bộ tài khoản cùng tên vai trò, sắp xếp theo vai trò và tên
        let result = await pool.request().query(`
            SELECT 
                tk.id, tk.ten_dang_nhap, tk.ho_ten, tk.so_dien_thoai, 
                tk.email_lien_he, tk.trang_thai, tk.ly_do_khoa, tk.vai_tro_id, 
                vt.ten_vai_tro 
            FROM TaiKhoan tk 
            LEFT JOIN VaiTro vt ON tk.vai_tro_id = vt.id
            ORDER BY tk.vai_tro_id ASC, tk.ho_ten ASC
        `);

        res.render('quanly_nguoidung', {
            title: 'Quản lý người dùng',
            user: req.session.user,
            danhSachTaiKhoan: result.recordset
        });
    } catch (error) {
        console.error("Lỗi tải danh sách tài khoản:", error);
        hienThiLoiHeThong(req, res);
    }
});

module.exports = router;
