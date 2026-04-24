const express = require('express');
const router = express.Router();
const sql = require('mssql');
const hienThiLoiHeThong = require('./xuly_loi');

const { sqlConfig } = require('../database');

const kiemTraDangNhap = (req, res, next) => {
    if (req.session.user) next(); else res.redirect('/dangnhap');
};

//Route: Xử lý lưu thông tin hồ sơ vào SQL Server
router.post('/capnhat_xuly', kiemTraDangNhap, async (req, res) => {
    try {
        const { ho_ten, so_dien_thoai, email_lien_he, dia_chi } = req.body;
        const tenDangNhap = req.session.user.ten_dang_nhap;

        let pool = await sql.connect(sqlConfig);
        await pool.request()
            .input('ho_ten', sql.NVarChar, ho_ten)
            .input('so_dien_thoai', sql.VarChar, so_dien_thoai)
            .input('email_lien_he', sql.VarChar, email_lien_he || '')
            .input('dia_chi', sql.NVarChar, dia_chi || '')
            .input('ten_dang_nhap', sql.VarChar, tenDangNhap)
            .query(`
                UPDATE TaiKhoan 
                SET ho_ten = @ho_ten, 
                    so_dien_thoai = @so_dien_thoai, 
                    email_lien_he = @email_lien_he, 
                    dia_chi = @dia_chi 
                WHERE ten_dang_nhap = @ten_dang_nhap
            `);

        //Cập nhật lại session
        req.session.user.ho_ten = ho_ten;
        req.session.user.so_dien_thoai = so_dien_thoai;
        req.session.user.email_lien_he = email_lien_he;
        req.session.user.dia_chi = dia_chi;

        res.redirect('/taikhoan/hoso');

    } catch (error) {
        console.error("Lỗi cập nhật hồ sơ:", error);
        hienThiLoiHeThong(req, res, 'Không thể lưu hồ sơ cập nhật. Vui lòng thử lại sau!');
    }
});
module.exports = router;