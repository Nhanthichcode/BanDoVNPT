const express = require('express');
const router = express.Router();
const sql = require('mssql');
const hienThiLoiHeThong = require('./xuly_loi');

//Gọi Database
const sqlConfig = {
    user: 'sa', password: 'sql2019', database: 'VNPT_BanDo_Admin', server: 'localhost', port: 1433,
    options: { encrypt: false, trustServerCertificate: true }
};

//Kiểm tra đăng nhập
const kiemTraDangNhap = (req, res, next) => {
    if (req.session.user) next(); else res.redirect('/dangnhap');
};

//Route: Xử lý Thêm gói cước mới
router.post('/them', kiemTraDangNhap, async (req, res) => {
    try {
        const { ten_goi_cuoc, loai_hinh_thue_bao } = req.body;
        
        let pool = await sql.connect(sqlConfig);
        await pool.request()
            .input('ten', sql.NVarChar, ten_goi_cuoc)
            .input('loai', sql.NVarChar, loai_hinh_thue_bao)
            .query(`INSERT INTO GoiCuoc (ten_goi_cuoc, loai_hinh_thue_bao) VALUES (@ten, @loai)`);
            
        //Thêm thành công thì tải lại trang danh sách gói cước
        res.redirect('/quanly/goicuoc');
    } catch (err) {
        console.error("Lỗi thêm gói cước:", err);
        res.status(500).send("Đã xảy ra lỗi khi lưu dữ liệu gói cước.");
    }
});

module.exports = router;