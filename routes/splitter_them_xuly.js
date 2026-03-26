const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const hienThiLoiHeThong = require('./xuly_loi');

const Splitter = require('../models/Splitter');

const kiemTraDangNhap = (req, res, next) => {
    if (req.session.user) next(); else res.redirect('/dangnhap');
};

// Route: Xử lý thêm tủ cáp mới
router.post('/them', kiemTraDangNhap, async (req, res) => {
    try {
        const { ten_splitter, sys_id, kinh_do, vi_do, loai_splitter, splitter_cha_id } = req.body;

        const tuCapMoi = new Splitter({
            ten_splitter: ten_splitter,
            loai_splitter: loai_splitter,
            sys_id: sys_id,
            vi_tri: {
                type: 'Point',
                coordinates: [parseFloat(kinh_do), parseFloat(vi_do)]
            },
            splitter_cha_id: (loai_splitter === '1:16' && splitter_cha_id) ? splitter_cha_id : null
        });

        await tuCapMoi.save();
        
        // Lưu thành công, tải lại trang danh sách tủ cáp
        res.redirect('/quanly/splitter');

    } catch (error) {
        console.error("Lỗi khi thêm Splitter:", error);
        hienThiLoiHeThong(req, res, "Đã xảy ra lỗi khi lưu Tủ cáp vào hệ thống.");
    }
});

module.exports = router;