const express = require('express');
const router = express.Router();
const sql = require('mssql');
const hienThiLoiHeThong = require('./xuly_loi');

const sqlConfig = {
    user: 'sa', password: 'sql2019', database: 'VNPT_BanDo_Admin', server: 'localhost', port: 1433,
    options: { encrypt: false, trustServerCertificate: true }
};

const kiemTraDangNhap = (req, res, next) => {
    if (req.session.user) next(); else res.redirect('/dangnhap');
};

const kiemTraQuyenQuanTri = (req, res, next) => {
    const vaiTro = req.session.user.vai_tro_id;
    if (vaiTro === 1) next(); 
    else hienThiLoiHeThong(req, res, "TRUY CẬP BỊ TỪ CHỐI!");
};

//Route: Xử lý đặt lại mật khẩu
router.post('/datlai_matkhau_xuly', kiemTraDangNhap, kiemTraQuyenQuanTri, async (req, res) => {
    try {
        const { ten_dang_nhap_datlai, mat_khau_xac_nhan } = req.body;
        const nguoiThucHien = req.session.user.ten_dang_nhap;

        let pool = await sql.connect(sqlConfig);

        //Kiểm tra mật khẩu của Admin
        let checkPass = await pool.request()
            .input('userThucHien', sql.VarChar, nguoiThucHien)
            .input('passXacNhan', sql.VarChar, mat_khau_xac_nhan)
            .query('SELECT ten_dang_nhap FROM TaiKhoan WHERE ten_dang_nhap = @userThucHien AND mat_khau = @passXacNhan');

        if (checkPass.recordset.length === 0) {
            return hienThiLoiHeThong(req, res, "Thao tác thất bại: Mật khẩu xác nhận của bạn không chính xác!");
        }

        //Mật khẩu đúng thì đổi mật khẩu mục tiêu về 'abc123'
        await pool.request()
            .input('userDatLai', sql.VarChar, ten_dang_nhap_datlai)
            .query(`
                UPDATE TaiKhoan 
                SET mat_khau = 'abc123' 
                WHERE ten_dang_nhap = @userDatLai
            `);

        res.redirect('/quanly/taikhoan');

    } catch (error) {
        console.error("Lỗi đặt lại mật khẩu:", error);
        hienThiLoiHeThong(req, res, "Đã xảy ra lỗi khi cố gắng đặt lại mật khẩu.");
    }
});

module.exports = router;