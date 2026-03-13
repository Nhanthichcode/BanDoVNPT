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
    if (vaiTro === 1 || vaiTro === 2) next(); 
    else hienThiLoiHeThong(req, res, "TRUY CẬP BỊ TỪ CHỐI!");
};

//Route: Xử lý khóa tài khoản
router.post('/khoa_xuly', kiemTraDangNhap, kiemTraQuyenQuanTri, async (req, res) => {
    try {
        const { ten_dang_nhap_bi_khoa, ly_do_khoa, mat_khau_xac_nhan } = req.body;
        const nguoiThucHien = req.session.user.ten_dang_nhap;

        //Không tự khóa chính mình
        if (ten_dang_nhap_bi_khoa === nguoiThucHien) {
            return hienThiLoiHeThong(req, res, "Lỗi bảo mật: Bạn không thể tự khóa tài khoản của chính mình!");
        }

        let pool = await sql.connect(sqlConfig);

        //Kiểm tra mật khẩu của Admin
        let checkPass = await pool.request()
            .input('userThucHien', sql.VarChar, nguoiThucHien)
            .input('passXacNhan', sql.VarChar, mat_khau_xac_nhan)
            .query('SELECT ten_dang_nhap FROM TaiKhoan WHERE ten_dang_nhap = @userThucHien AND mat_khau = @passXacNhan');

        if (checkPass.recordset.length === 0) {
            //Mật khẩu xác nhận sai
            return hienThiLoiHeThong(req, res, "Thao tác thất bại: Mật khẩu xác nhận của bạn không chính xác!");
        }

        //Mật khẩu xác nhận đúng + Ghi thêm tag tên người khóa vào đầu lý do để dễ tra cứu về sau
        const lyDoDayDu = `[Bị khóa bởi ${nguoiThucHien}]: ${ly_do_khoa}`;

        await pool.request()
            .input('lyDo', sql.NVarChar, lyDoDayDu)
            .input('userBiKhoa', sql.VarChar, ten_dang_nhap_bi_khoa)
            .query(`
                UPDATE TaiKhoan 
                SET trang_thai = 0, ly_do_khoa = @lyDo 
                WHERE ten_dang_nhap = @userBiKhoa
            `);
        res.redirect('/quanly/taikhoan');

    } catch (error) {
        console.error("Lỗi khóa tài khoản:", error);
        hienThiLoiHeThong(req, res, "Đã xảy ra lỗi khi cố gắng khóa tài khoản này.");
    }
});

module.exports = router;