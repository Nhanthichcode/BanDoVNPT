const express = require('express');
const router = express.Router();
const sql = require('mssql');
const mongoose = require('mongoose');
const hienThiLoiHeThong = require('./xuly_loi');
const DiemKetNoi = require('../models/DiemKetNoi');

const { sqlConfig } = require('../database');

const kiemTraDangNhap = (req, res, next) => {
    if (req.session.user) next(); else res.redirect('/dangnhap');
};

//Route: Hiển thị lịch sử báo cáo
router.get('/lichsu', kiemTraDangNhap, async (req, res) => {
    try {
        //Lấy dữ liệu từ SQL Server 
        let pool = await sql.connect(sqlConfig);
        let resultSQL = await pool.request().query(`
            SELECT 
                b.id AS truong_hop,
                b.diem_ket_noi_id,
                b.loai_su_co,
                b.thoi_gian_tao AS ngay_bao_cao,
                b.trang_thai_xu_ly,
                t.ho_ten AS nguoi_bao_cao,
                -- Lấy thời gian cập nhật cuối cùng trong Chi tiết báo cáo làm Ngày khắc phục
                (SELECT MAX(thoi_gian_cap_nhat) FROM ChiTietBaoCao c WHERE c.bao_cao_id = b.id) AS ngay_khac_phuc
            FROM BaoCaoSuCo b
            LEFT JOIN TaiKhoan t ON b.nguoi_tao_id = t.id
            ORDER BY b.thoi_gian_tao DESC
        `);

        let danhSachBaoCao = resultSQL.recordset;

        //Lấy mảng ID điểm kết nối để vòng qua MongoDB tìm Địa chỉ
        const danhSachIdMongo = danhSachBaoCao.map(bc => bc.diem_ket_noi_id);
        
        //Truy vấn MongoDB lấy Địa chỉ
        const cacDiemKetNoi = await DiemKetNoi.find({
            _id: { $in: danhSachIdMongo }
        }).select('_id dia_chi');

        //Tạo một bộ từ điển để gán địa chỉ nhanh chóng
        const mapDiaChi = {};
        cacDiemKetNoi.forEach(diem => {
            mapDiaChi[diem._id.toString()] = diem.dia_chi;
        });

        //Hàm chuyển đổi mã trường hợp báo cáo 6 ký tự
        const taoMaTruongHop = (loaiSuCo, id) => {
            let kyTuDau = 'K'; 
            const loai = loaiSuCo ? loaiSuCo.toLowerCase() : "";
            
            if (loai.includes('cấu hình') || loai.includes('pppoe')) kyTuDau = 'C';
            else if (loai.includes('đứt cáp')) kyTuDau = 'D';
            else if (loai.includes('mất điện')) kyTuDau = 'M';
            else if (loai.includes('hỏng thiết bị')) kyTuDau = 'H';
            else if (loai.includes('suy hao')) kyTuDau = 'S';
            else if (loai.includes('trộm') || loai.includes('mất dây')) kyTuDau = 'T';
            else if (loai.includes('hết hạn') || loai.includes('thu hồi')) kyTuDau = 'E';

            const tapKyTu = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
            let viTriKyTu = Math.floor(id / 10000) % 62; 
            let kyTuThuHai = tapKyTu[viTriKyTu];
            let bonSoCuoi = String(id % 10000).padStart(4, '0');

            return `${kyTuDau}${kyTuThuHai}${bonSoCuoi}`;
        };

        //Gộp dữ liệu Địa chỉ vào Danh sách báo cáo
        danhSachBaoCao = danhSachBaoCao.map(bc => ({
            ...bc,
            ma_truong_hop: taoMaTruongHop(bc.loai_su_co, bc.truong_hop),
            dia_chi: mapDiaChi[bc.diem_ket_noi_id] || 'Không xác định/Điểm đã bị xóa'
        }));

        res.render('baocao_lichsu', {
            title: 'Lịch sử báo cáo sự cố',
            user: req.session.user,
            danhSachBaoCao: danhSachBaoCao
        });

    } catch (error) {
        console.error("Lỗi khi lấy lịch sử báo cáo:", error);
        hienThiLoiHeThong(req, res); 
    }
});

module.exports = router;