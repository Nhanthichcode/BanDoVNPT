const express = require('express');
const router = express.Router();
const sql = require('mssql');
const hienThiLoiHeThong = require('./xuly_loi');
const DiemKetNoi = require('../models/DiemKetNoi');

const { sqlConfig } = require('../database');

const kiemTraDangNhap = (req, res, next) => {
    if (req.session.user) next(); else res.redirect('/dangnhap');
};

//Route: Xử lý thêm báo cáo sự cố vào SQL Server
router.post('/lap-bao-cao', kiemTraDangNhap, async (req, res) => {
    try {
        const { diem_ket_noi_id, loai_su_co, mo_ta_ban_dau } = req.body;
        const nguoi_tao_id = req.session.user.id;

        let pool = await sql.connect(sqlConfig);
        await pool.request()
            .input('diem_ket_noi_id', sql.VarChar, diem_ket_noi_id.toString())
            .input('nguoi_tao_id', sql.Int, nguoi_tao_id)
            .input('loai_su_co', sql.NVarChar, loai_su_co)
            .input('mo_ta_ban_dau', sql.NVarChar, mo_ta_ban_dau || '')
            .query(`
                INSERT INTO BaoCaoSuCo (diem_ket_noi_id, nguoi_tao_id, loai_su_co, mo_ta_ban_dau, thoi_gian_tao, trang_thai_xu_ly)
                VALUES (@diem_ket_noi_id, @nguoi_tao_id, @loai_su_co, @mo_ta_ban_dau, GETDATE(), 0)
            `);
        await DiemKetNoi.findByIdAndUpdate(diem_ket_noi_id, {
            $set: {
                'trang_thai_ket_noi.mau_sac': 'Đỏ',
                'trang_thai_ket_noi.ly_do_su_co': loai_su_co,
                'trang_thai_ket_noi.lan_kiem_tra_cuoi': new Date()
            }
        });

        res.redirect('/baocao/suco');

    } catch (error) {
        console.error("Lỗi khi lập báo cáo sự cố:", error);
        hienThiLoiHeThong(req, res, "Đã xảy ra lỗi khi lưu báo cáo vào cơ sở dữ liệu hệ thống.");
    }
});

module.exports = router;