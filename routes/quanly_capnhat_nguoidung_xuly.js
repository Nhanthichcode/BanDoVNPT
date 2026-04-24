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

//Route: Lưu dữ liệu vào CSDL
router.post('/sua_xuly', kiemTraDangNhap, kiemTraQuyenQuanTri, async (req, res) => {
    try {
        const { ten_dang_nhap, ho_ten, so_dien_thoai, email_lien_he, dia_chi, vai_tro_id } = req.body;
        
        const nguoiThucHien = req.session.user.ten_dang_nhap;
        let vaiTroMoi = vai_tro_id;
        
        if (ten_dang_nhap === nguoiThucHien) {
            vaiTroMoi = req.session.user.vai_tro_id; 
        }

        let pool = await sql.connect(sqlConfig);

        await pool.request()
            .input('ho_ten', sql.NVarChar, ho_ten)
            .input('so_dien_thoai', sql.VarChar, so_dien_thoai)
            .input('email_lien_he', sql.VarChar, email_lien_he || '')
            .input('dia_chi', sql.NVarChar, dia_chi || '')
            .input('vai_tro_id', sql.Int, vaiTroMoi)
            .input('user', sql.VarChar, ten_dang_nhap)
            .query(`
                UPDATE TaiKhoan 
                SET ho_ten = @ho_ten, 
                    so_dien_thoai = @so_dien_thoai, 
                    email_lien_he = @email_lien_he, 
                    dia_chi = @dia_chi, 
                    vai_tro_id = @vai_tro_id
                WHERE ten_dang_nhap = @user
            `);

        res.redirect('/quanly/taikhoan');

    } catch (error) {
        console.error("Lỗi cập nhật người dùng:", error);
        hienThiLoiHeThong(req, res, "Đã xảy ra lỗi khi lưu thông tin người dùng!");
    }
});

module.exports = router;