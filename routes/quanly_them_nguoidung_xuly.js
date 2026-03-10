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

// Route: Xử lý Thêm tài khoản vào SQL Server
router.post('/them_xuly', kiemTraDangNhap, kiemTraQuyenQuanTri, async (req, res) => {
    try {
        const { ten_dang_nhap, mat_khau, ho_ten, so_dien_thoai, email_lien_he, dia_chi, vai_tro_id, trang_thai } = req.body;

        let pool = await sql.connect(sqlConfig);

        // Kiểm tra xem tên đăng nhập có bị trùng chưa
        let checkExist = await pool.request()
            .input('user', sql.VarChar, ten_dang_nhap)
            .query('SELECT ten_dang_nhap FROM TaiKhoan WHERE ten_dang_nhap = @user');

        if (checkExist.recordset.length > 0) {
            return hienThiLoiHeThong(req, res, `Tên đăng nhập "${ten_dang_nhap}" đã được sử dụng. Vui lòng chọn tên khác!`);
        }

        // Lưu vào cơ sở dữ liệu
        await pool.request()
            .input('ten_dang_nhap', sql.VarChar, ten_dang_nhap)
            .input('mat_khau', sql.VarChar, mat_khau)
            .input('ho_ten', sql.NVarChar, ho_ten)
            .input('so_dien_thoai', sql.VarChar, so_dien_thoai)
            .input('email_lien_he', sql.VarChar, email_lien_he || '')
            .input('dia_chi', sql.NVarChar, dia_chi || '')
            .input('vai_tro_id', sql.Int, vai_tro_id)
            .input('trang_thai', sql.Int, trang_thai)
            .query(`
                INSERT INTO TaiKhoan (ten_dang_nhap, mat_khau, ho_ten, so_dien_thoai, email_lien_he, dia_chi, vai_tro_id, trang_thai)
                VALUES (@ten_dang_nhap, @mat_khau, @ho_ten, @so_dien_thoai, @email_lien_he, @dia_chi, @vai_tro_id, @trang_thai)
            `);

        // Lưu thành công, đẩy về trang danh sách
        res.redirect('/quanly/taikhoan');

    } catch (error) {
        console.error("Lỗi thêm tài khoản:", error);
        hienThiLoiHeThong(req, res, "Không thể thêm tài khoản do lỗi Server.");
    }
});

module.exports = router;