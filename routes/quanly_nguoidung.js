const express = require('express');
const router = express.Router();
const sql = require('mssql');
const hienThiLoiHeThong = require('./xuly_loi');

const sqlConfig = {
    user: 'sa', password: 'sql2019', database: 'VNPT_BanDo_Admin', server: 'localhost', port: 1433,
    options: { encrypt: false, trustServerCertificate: true }
};

//Kiểm tra xem đã đăng nhập chưa
const kiemTraDangNhap = (req, res, next) => {
    if (req.session.user) next(); else res.redirect('/dangnhap');
};

//KIỂM TRA QUYỀN TRUY CẬP
const kiemTraQuyenQuanTri = (req, res, next) => {
    const vaiTro = req.session.user.vai_tro_id;
    // Nếu là Admin hoặc Quản lý thì cho đi tiếp
    if (vaiTro === 1 || vaiTro === 2) {
        next(); 
    } else {
        hienThiLoiHeThong(req, res, "TRUY CẬP BỊ TỪ CHỐI!");
    }
};

// Route: Hiển thị danh sách Người dùng
router.get('/', kiemTraDangNhap, kiemTraQuyenQuanTri, async (req, res) => {
    try {
        let pool = await sql.connect(sqlConfig);
        
        // Truy vấn lấy toàn bộ tài khoản, ưu tiên xếp Admin/Quản lý lên đầu bảng
        let result = await pool.request().query(`
            SELECT tk.*, vt.ten_vai_tro 
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