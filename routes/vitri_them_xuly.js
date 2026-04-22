const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const sql = require('mssql');
const hienThiLoiHeThong = require('./xuly_loi');
const dbManager = require('../database');
const DiemKetNoi = require('../models/DiemKetNoi');

const kiemTraDangNhap = (req, res, next) => {
    if (req.session && req.session.user) next(); 
    else res.redirect('/dangnhap');
};

router.post('/them', kiemTraDangNhap, async (req, res) => {
    try {
        const {
            ten_khach_hang, dia_chi, kinh_do, vi_do,
            goi_cuoc_id, ngay_dang_ky, thoi_gian_su_dung_thang,
            splitter_id, username, password, sys_id, rack, slot, port
        } = req.body;

        // KIỂM TRA 1: Đảm bảo tọa độ hợp lệ
        const numKinhDo = parseFloat(kinh_do);
        const numViDo = parseFloat(vi_do);
        if (isNaN(numKinhDo) || isNaN(numViDo)) {
            return hienThiLoiHeThong(req, res, "Lỗi: Tọa độ vĩ độ/kinh độ không hợp lệ hoặc đang để trống.");
        }

        // KIỂM TRA 2: Xử lý gói cước (SQL Server)
        let loai_khach_hang = 'Chưa xác định';
        const idGoiCuoc = parseInt(goi_cuoc_id);
        
        if (!isNaN(idGoiCuoc)) {
            const pool = await dbManager.getSQLPool();
            let goiCuocInfo = await pool.request()
                .input('id', sql.Int, idGoiCuoc)
                .query('SELECT loai_hinh_thue_bao FROM GoiCuoc WHERE id = @id');
            
            if (goiCuocInfo.recordset.length > 0) {
                loai_khach_hang = goiCuocInfo.recordset[0].loai_hinh_thue_bao;
            }
        }

        // KIỂM TRA 3: Xử lý ngày tháng an toàn
        const ngayDangKyDate = ngay_dang_ky ? new Date(ngay_dang_ky) : new Date();
        const thoiGianSD = parseInt(thoi_gian_su_dung_thang) || 12;
        const ngayHetHanDate = new Date(ngayDangKyDate);
        ngayHetHanDate.setMonth(ngayHetHanDate.getMonth() + thoiGianSD);

        // Tạo Document mới cho MongoDB
        const diemMoi = new DiemKetNoi({
            ten_khach_hang, 
            loai_khach_hang, 
            dia_chi,
            vi_tri: { 
                type: 'Point', 
                coordinates: [numKinhDo, numViDo] 
            },
            thong_tin_hop_dong: { 
                goi_cuoc_id: idGoiCuoc || null, 
                ngay_dang_ky: ngayDangKyDate, 
                thoi_gian_su_dung_thang: thoiGianSD, 
                ngay_het_han: ngayHetHanDate 
            },
            splitter_id: mongoose.Types.ObjectId.isValid(splitter_id) ? splitter_id : null,
            thong_tin_pppoe: {
                username: username || '',
                password: password || '',
                circuit_id: {
                    sys_id: sys_id || 'AGG-LX-01',
                    rack: rack || '',
                    shelf: '0',
                    slot: slot || '0',
                    port: port || '1',
                    vpi: '0',
                    vci: '33'
                }
            },
            trang_thai_ket_noi: {
                mau_sac: "Xanh",
                ly_do_su_co: null,
                lan_kiem_tra_cuoi: new Date()
            },
            nguoi_tao: req.session.user.ho_ten
        });

        await diemMoi.save();
        res.redirect('/quanly/vitri');

    } catch (error) {
        console.error("LỖI CHI TIẾT KHI THÊM ĐIỂM KẾT NỐI:", error);
        hienThiLoiHeThong(req, res, "Đã xảy ra lỗi hệ thống: " + error.message);
    }
});

module.exports = router;