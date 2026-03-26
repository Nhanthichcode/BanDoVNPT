const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const hienThiLoiHeThong = require('./xuly_loi');

const DiemKetNoi = require('../models/DiemKetNoi');

//Route: Giao diện chính bản đồ
router.get('/', (req, res) => {
    try {
        res.render('views', { title: 'Bản đồ giám sát mạng lưới', user: req.session.user || null });
    } catch (error) {
        console.error("Lỗi tải giao diện trang chủ:", error);
        hienThiLoiHeThong(req, res, "Không thể tải giao diện bản đồ.");
    }
});

//Route: API lấy điểm kết nối
router.get('/api/diem-ket-noi', async (req, res) => {
    try {
        const danhSachDiem = await DiemKetNoi.find({}).populate('splitter_id');
        res.status(200).json(danhSachDiem);
    } catch (error) {
        console.error("Lỗi API lấy điểm kết nối:", error);
        hienThiLoiHeThong(req, res);
    }
});

module.exports = router;