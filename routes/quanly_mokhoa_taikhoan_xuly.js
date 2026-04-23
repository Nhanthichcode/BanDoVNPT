const express = require('express');
const router = express.Router();
const sql = require('mssql');
const hienThiLoiHeThong = require('./xuly_loi');
const dbManager = require('../database');//thêm cái này
// const sqlConfig = {
//     user: 'sa', password: 'sql2019', database: 'VNPT_BanDo_Admin', server: 'localhost', port: 1433,
//     options: { encrypt: false, trustServerCertificate: true }
// };

const kiemTraDangNhap = (req, res, next) => {
    if (req.session.user) next(); else res.redirect('/dangnhap');
};

const kiemTraQuyenQuanTri = (req, res, next) => {
    const vaiTro = req.session.user.vai_tro_id;
    if (vaiTro === 1) next();
    else hienThiLoiHeThong(req, res, "TRUY CẬP BỊ TỪ CHỐI!");
};

//Route: Xử lý mở khóa tài khoản
router.post('/mokhoa_xuly', kiemTraDangNhap, kiemTraQuyenQuanTri, async (req, res) => {
    try {
        const { ten_dang_nhap_duoc_mo, mat_khau_xac_nhan } = req.body;
        const nguoiThucHien = req.session.user.ten_dang_nhap;

        let pool = await dbManager.getSQLPool();

        //Kiểm tra mật khẩu của Admin
        let checkPass = await pool.request()
            .input('userThucHien', sql.VarChar, nguoiThucHien)
            .input('passXacNhan', sql.VarChar, mat_khau_xac_nhan)
            .query('SELECT ten_dang_nhap FROM TaiKhoan WHERE ten_dang_nhap = @userThucHien AND mat_khau = @passXacNhan');

        if (checkPass.recordset.length === 0) {
            return hienThiLoiHeThong(req, res, "Thao tác thất bại: Mật khẩu xác nhận của bạn không chính xác!");
        }

        //Mật khẩu đúng thì mở khóa và xóa lý do khóa
        await pool.request()
            .input('userDuocMo', sql.VarChar, ten_dang_nhap_duoc_mo)
            .query(`
                UPDATE TaiKhoan 
                SET trang_thai = 1, ly_do_khoa = NULL 
                WHERE ten_dang_nhap = @userDuocMo
            `);

        res.redirect('/quanly/taikhoan');

    } catch (error) {
        console.error("Lỗi mở khóa tài khoản:", error);
        hienThiLoiHeThong(req, res, "Đã xảy ra lỗi khi cố gắng mở khóa tài khoản này.");
    }
});

module.exports = router;