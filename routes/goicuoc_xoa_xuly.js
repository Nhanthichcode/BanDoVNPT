const express = require('express');
const router = express.Router();
const sql = require('mssql');

const { sqlConfig } = require('../database');

const hienThiLoiHeThong = require('./xuly_loi');

const kiemTraDangNhap = (req, res, next) => {
    if (req.session.user) next(); else res.redirect('/dangnhap');
};

const kiemTraQuyenAdmin = (req, res, next) => {
    if (req.session.user.vai_tro_id === 1) next(); 
    else hienThiLoiHeThong(req, res, "TRUY CẬP BỊ TỪ CHỐI!");
};

//Route: Xử lý xóa gói cước
router.post('/xoa', kiemTraDangNhap, kiemTraQuyenAdmin, async (req, res) => {
    try {
        const idCanXoa = req.body.id;

        //Xóa gói cước khỏi Database
        let pool = await sql.connect(sqlConfig);
        await pool.request()
            .input('id', sql.Int, idCanXoa)
            .query('DELETE FROM GoiCuoc WHERE id = @id');
        res.redirect('/quanly/goicuoc');

    } catch (error) {
        console.error("Lỗi xóa gói cước:", error);
        hienThiLoiHeThong(req, res, "Không thể xóa gói cước này vì có thể nó đang được sử dụng ở Điểm kết nối.");
    }
});

module.exports = router;