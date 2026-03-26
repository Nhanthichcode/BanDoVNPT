const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const sql = require('mssql');

const DiemKetNoi = require('../models/DiemKetNoi');
const Splitter = mongoose.model('Splitter');
const hienThiLoiHeThong = require('./xuly_loi');

const sqlConfig = {
    user: 'sa', password: 'sql2019', database: 'VNPT_BanDo_Admin', server: 'localhost', port: 1433,
    options: { encrypt: false, trustServerCertificate: true }
};

const kiemTraDangNhap = (req, res, next) => {
    if (req.session.user) next(); else res.redirect('/dangnhap');
};

// Route: Trang quản lý điểm kết nối
router.get('/', kiemTraDangNhap, async (req, res) => {
    try {
        // Lấy danh sách Điểm kết nối từ MongoDB, có populate thông tin Tủ cấp 2 và sắp xếp theo lần kiểm tra cuối
        const danhSachDiem = await DiemKetNoi.find({})
            .populate('splitter_id')
            .sort({ 'trang_thai_ket_noi.lan_kiem_tra_cuoi': -1 });

        // Lấy danh sách tủ 1:16 để đổ vào Form thêm mới
        const danhSachSplitter16 = await Splitter.find({ loai_splitter: '1:16' });

        // Lấy danh sách gói cước từ SQL Server
        let pool = await sql.connect(sqlConfig);
        let resultGoiCuoc = await pool.request().query('SELECT id, ten_goi_cuoc, loai_hinh_thue_bao FROM GoiCuoc');

        res.render('diemketnoi', {
            title: 'Điểm kết nối',
            user: req.session.user,
            danhSachDiem: danhSachDiem,
            danhSachSplitter: danhSachSplitter16,
            danhSachGoiCuoc: resultGoiCuoc.recordset
        });
    }  catch (error) {
        console.error("Lỗi Server:", error);
        hienThiLoiHeThong(req, res);
    }
});

module.exports = router;