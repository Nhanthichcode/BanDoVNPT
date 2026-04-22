const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const sql = require('mssql');

const DiemKetNoi = require('../models/DiemKetNoi');
const Splitter = mongoose.model('Splitter');
const hienThiLoiHeThong = require('./xuly_loi');
const dbManager = require('../database');//thêm cái này
// const sqlConfig = {
//     user: 'sa', password: 'sql2019', database: 'VNPT_BanDo_Admin', server: 'localhost', port: 1433,
//     options: { encrypt: false, trustServerCertificate: true }
// };

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
        const pool = await dbManager.getSQLPool();
        let resultGoiCuoc = await pool.request().query('SELECT id, ten_goi_cuoc, loai_hinh_thue_bao FROM GoiCuoc');

        res.render('pages/diemketnoi', {
            title: 'Điểm kết nối',
            user: req.session.user,
            danhSachDiem: danhSachDiem,
            danhSachSplitter: danhSachSplitter16,
            danhSachGoiCuoc: resultGoiCuoc.recordset,
            activePage: 'diemketnoi'
        });
    }  catch (error) {
        console.error("Lỗi Server:", error);
        hienThiLoiHeThong(req, res);
    }
});

// Xóa điểm kết nối (chỉ admin)
router.post('/xoa/:id', kiemTraDangNhap, async (req, res) => {
    const { id } = req.params;

    if (req.session.user.vai_tro_id !== 1) {
        req.session.error = 'Bạn không có quyền xóa điểm kết nối!';
        return res.redirect('/quanly/vitri');   // tuyệt đối
    }

    try {
        const deleted = await DiemKetNoi.findByIdAndDelete(id);
        if (!deleted) {
            req.session.error = 'Không tìm thấy điểm kết nối!';
        } else {
            req.session.success = 'Xóa điểm kết nối thành công!';
        }
    } catch (error) {
        console.error('Lỗi khi xóa điểm kết nối:', error);
        req.session.error = 'Lỗi hệ thống, không thể xóa!';
    }

    res.redirect('/quanly/vitri');   // quay về trang danh sách
});

module.exports = router;