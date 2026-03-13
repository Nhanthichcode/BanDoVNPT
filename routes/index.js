const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const DiemKetNoi = mongoose.model('DiemKetNoi');

//Route: Giao diện chính bản đồ
router.get('/', (req, res) => {
    res.render('views', { title: 'Bản đồ giám sát mạng lưới', user: req.session.user || null });
});

//Route: API lấy điểm kết nối
router.get('/api/diem-ket-noi', async (req, res) => {
    try {
        const danhSachDiem = await DiemKetNoi.find({}).populate('splitter_id');
        res.status(200).json(danhSachDiem);
    } catch (error) {
        console.error("Lỗi API lấy điểm kết nối:", error);
        res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
    }
});

module.exports = router;