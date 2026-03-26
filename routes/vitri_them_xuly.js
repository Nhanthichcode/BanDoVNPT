const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const sql = require('mssql');
const hienThiLoiHeThong = require('./xuly_loi');

const DiemKetNoi = require('../models/DiemKetNoi');

//Cấu hình SQL Server
const sqlConfig = {
    user: 'sa', password: 'sql2019', database: 'VNPT_BanDo_Admin', server: 'localhost', port: 1433,
    options: { encrypt: false, trustServerCertificate: true }
};

const kiemTraDangNhap = (req, res, next) => {
    if (req.session.user) next(); else res.redirect('/dangnhap');
};

//Route: Xử lý thêm điểm kết nối mới
router.post('/them', kiemTraDangNhap, async (req, res) => {
    try {
        const {
            ten_khach_hang, dia_chi, kinh_do, vi_do, ping,
            goi_cuoc_id, ngay_dang_ky, thoi_gian_su_dung_thang,
            splitter_id, username, password, rack, shelf, slot, port
        } = req.body;

        //Xử lý gói cước
        let pool = await sql.connect(sqlConfig);
        let goiCuocInfo = await pool.request()
            .input('id', sql.Int, goi_cuoc_id)
            .query('SELECT loai_hinh_thue_bao FROM GoiCuoc WHERE id = @id');
        let loai_khach_hang = goiCuocInfo.recordset.length > 0 ? goiCuocInfo.recordset[0].loai_hinh_thue_bao : 'Chưa xác định';

        //Xử lý ngày tháng
        const ngayDangKyDate = new Date(ngay_dang_ky);
        const ngayHetHanDate = new Date(ngayDangKyDate);
        ngayHetHanDate.setMonth(ngayHetHanDate.getMonth() + parseInt(thoi_gian_su_dung_thang));

        // Xử lý trạng thái kết nối (Mặc định khi mới thêm là Xanh - Ổn định)
        let mau_sac = "Xanh";
        let ly_do_su_co = null;

        //Tạo Document mới và lưu vào MongoDB
        const diemMoi = new DiemKetNoi({
            ten_khach_hang, loai_khach_hang, dia_chi,
            vi_tri: { type: 'Point', coordinates: [parseFloat(kinh_do), parseFloat(vi_do)] },
            thong_tin_hop_dong: { goi_cuoc_id: parseInt(goi_cuoc_id), ngay_dang_ky: ngayDangKyDate, thoi_gian_su_dung_thang: parseInt(thoi_gian_su_dung_thang), ngay_het_han: ngayHetHanDate },

            splitter_id: splitter_id,
            thong_tin_pppoe: {
                username: username,
                password: password,
                circuit_id: { rack, shelf, slot, port, vpi: '0', vci: '33' }
            },

            trang_thai_ket_noi: {
                mau_sac: mau_sac,
                ly_do_su_co: ly_do_su_co,
                lan_kiem_tra_cuoi: new Date()
            },

            nguoi_tao: req.session.user.ho_ten
        });

        await diemMoi.save();
        res.redirect('/quanly/vitri');
    } catch (error) {
        console.error("Lỗi khi thêm điểm kết nối:", error);
        hienThiLoiHeThong(req, res);
    }
});

module.exports = router;