const express = require('express');
const router = express.Router();
const sql = require('mssql');
const dbManager = require('../database');//thêm cái này
// const sqlConfig = {
//     user: 'sa', password: 'sql2019', database: 'VNPT_BanDo_Admin', server: 'localhost', port: 1433,
//     options: { encrypt: false, trustServerCertificate: true }
// };
const hienThiLoiHeThong = require('./xuly_loi'); // Nhớ gọi thêm file báo lỗi

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
        const pool = await dbManager.getSQLPool();
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