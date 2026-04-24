const express = require('express');
const router = express.Router();
const sql = require('mssql');
const hienThiLoiHeThong = require('./xuly_loi');
const DiemKetNoi = require('../models/DiemKetNoi');

const { sqlConfig } = require('../database');

const kiemTraDangNhap = (req, res, next) => {
    if (req.session.user) next(); else res.redirect('/dangnhap');
};

router.post('/cap-nhat', kiemTraDangNhap, async (req, res) => {
    try {
        const { bao_cao_id, diem_ket_noi_id, noi_dung_cap_nhat, trang_thai_moi } = req.body;
        const nguoi_cap_nhat_id = req.session.user.id;

        let pool = await sql.connect(sqlConfig);
        
        //Lưu vào bảng ChiTietBaoCao
        await pool.request()
            .input('bao_cao_id', sql.Int, bao_cao_id)
            .input('nguoi_cap_nhat_id', sql.Int, nguoi_cap_nhat_id)
            .input('noi_dung_cap_nhat', sql.NVarChar, noi_dung_cap_nhat)
            .query(`
                INSERT INTO ChiTietBaoCao (bao_cao_id, nguoi_cap_nhat_id, noi_dung_cap_nhat, thoi_gian_cap_nhat)
                VALUES (@bao_cao_id, @nguoi_cap_nhat_id, @noi_dung_cap_nhat, GETDATE())
            `);

        //Cập nhật trạng thái bảng BaoCaoSuCo
        await pool.request()
            .input('bao_cao_id', sql.Int, bao_cao_id)
            .input('trang_thai_xu_ly', sql.TinyInt, trang_thai_moi)
            .query(`UPDATE BaoCaoSuCo SET trang_thai_xu_ly = @trang_thai_xu_ly WHERE id = @bao_cao_id`);

        //Nếu đã khắc phục xong thì cập nhật lại trạng thái điểm kết nối
        if (parseInt(trang_thai_moi) === 2) {
            await DiemKetNoi.findByIdAndUpdate(diem_ket_noi_id, {
                $set: {
                    'trang_thai_ket_noi.mau_sac': 'Xanh',
                    'trang_thai_ket_noi.ly_do_su_co': null,
                    'trang_thai_ket_noi.lan_kiem_tra_cuoi': new Date()
                }
            });
        }

        res.redirect('/baocao/suco');

    } catch (error) {
        console.error("Lỗi khi cập nhật tiến độ:", error);
        hienThiLoiHeThong(req, res, "Đã xảy ra lỗi khi cập nhật báo cáo.");
    }
});

module.exports = router;