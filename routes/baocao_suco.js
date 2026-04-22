const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const sql = require('mssql');
const hienThiLoiHeThong = require('./xuly_loi');
const dbManager = require('../database');//thêm cái này
const DiemKetNoi = require('../models/DiemKetNoi');

//Cấu hình SQL Server
// const sqlConfig = {
//     user: 'sa', password: 'sql2019', database: 'VNPT_BanDo_Admin', server: 'localhost', port: 1433,
//     options: { encrypt: false, trustServerCertificate: true }
// };

const kiemTraDangNhap = (req, res, next) => {
    if (req.session.user) next(); else res.redirect('/dangnhap');
};

router.get('/suco', kiemTraDangNhap, async (req, res) => {
    try {
        //Lấy danh sách điểm Đỏ/Xám từ MongoDB
        const danhSachSuCo = await DiemKetNoi.find({
            'trang_thai_ket_noi.mau_sac': { $in: ['Đỏ', 'Xám'] }
        }).populate('splitter_id').sort({ 'trang_thai_ket_noi.lan_kiem_tra_cuoi': -1 });

        const diemSuaChua = danhSachSuCo.filter(d => d.trang_thai_ket_noi.mau_sac === 'Đỏ');
        const diemThuHoi = danhSachSuCo.filter(d => d.trang_thai_ket_noi.mau_sac === 'Xám');

        //Lấy danh sách điểm Bình thường để hiển thị ở phần "Đang hoạt động"
        const danhSachBinhThuong = await DiemKetNoi.find({
            'trang_thai_ket_noi.mau_sac': 'Xanh'
        }).sort({ ten_khach_hang: 1 });

        //Kiểm tra SQL Server xem điểm nào đang được xử lý
        const pool = await dbManager.getSQLPool();
        let resultSQL = await pool.request().query(`
            SELECT id AS bao_cao_id, diem_ket_noi_id 
            FROM BaoCaoSuCo 
            WHERE trang_thai_xu_ly IN (0, 1)
        `);
        
        //Tạo một mảng chứa ID của các điểm đã báo cáo
        const mapDangXuLy = {};
        resultSQL.recordset.forEach(r => {
            mapDangXuLy[r.diem_ket_noi_id] = r.bao_cao_id;
        });

        res.render('pages/baocao_suco', {
            title: 'Báo cáo sự cố mạng lưới',
            user: req.session.user,
            danhSachSuCo: danhSachSuCo,
            soLuongDo: diemSuaChua.length,
            soLuongXam: diemThuHoi.length,
            mapDangXuLy: mapDangXuLy,
            danhSachBinhThuong: danhSachBinhThuong,
            activePage: 'baocao_suco'
        });

    } catch (error) {
        console.error("Lỗi khi lấy danh sách sự cố:", error);
        hienThiLoiHeThong(req, res);
    }
});

module.exports = router;