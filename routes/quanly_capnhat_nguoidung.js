const express = require('express');
const router = express.Router();
const sql = require('mssql');
const hienThiLoiHeThong = require('./xuly_loi');

// const sqlConfig = {
//     user: 'sa', password: 'sql2019', database: 'VNPT_BanDo_Admin', server: 'localhost', port: 1433,
//     options: { encrypt: false, trustServerCertificate: true }
// };

const kiemTraDangNhap = (req, res, next) => { if (req.session.user) next(); else res.redirect('/dangnhap'); };
const kiemTraQuyenQuanTri = (req, res, next) => {
    const vaiTro = req.session.user.vai_tro_id;
    if (vaiTro === 1) next(); 
    else hienThiLoiHeThong(req, res, "TRUY CẬP BỊ TỪ CHỐI!");
};

//Route: Lấy dữ liệu và hiển thị form sửa
router.get('/sua/:username', kiemTraDangNhap, kiemTraQuyenQuanTri, async (req, res) => {
    try {
        const pool = await dbManager.getSQLPool();
        let result = await pool.request()
            .input('user', sql.VarChar, req.params.username)
            .query('SELECT * FROM TaiKhoan WHERE ten_dang_nhap = @user');

        if (result.recordset.length === 0) {
            return hienThiLoiHeThong(req, res, "Không tìm thấy tài khoản cần sửa!");
        }

        res.render('pages/quanly_capnhat_nguoidung', {
            title: 'Cập nhật tài khoản',
            user: req.session.user,
            taiKhoanSua: result.recordset[0]
        });

    } catch (error) {
        hienThiLoiHeThong(req, res);
    }
});

module.exports = router;