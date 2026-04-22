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
const kiemTraQuyenAdmin = (req, res, next) => {
    if (req.session.user.vai_tro_id === 1) next(); 
    else hienThiLoiHeThong(req, res, "TRUY CẬP BỊ TỪ CHỐI! Chỉ Quản trị viên mới được thao tác.");
};


router.post('/them', kiemTraDangNhap, kiemTraQuyenAdmin, async (req, res) => {
    try {
        const { ten_goi_cuoc, loai_hinh_thue_bao } = req.body;
        
        const pool = await dbManager.getSQLPool();
        await pool.request()
            .input('ten', sql.NVarChar, ten_goi_cuoc)
            .input('loai', sql.NVarChar, loai_hinh_thue_bao)
            .query(`INSERT INTO GoiCuoc (ten_goi_cuoc, loai_hinh_thue_bao) VALUES (@ten, @loai)`);
            
        res.redirect('/quanly/goicuoc');
    } catch (err) {
        console.error("Lỗi thêm gói cước:", err);
        hienThiLoiHeThong(req, res);
    }
});

module.exports = router;