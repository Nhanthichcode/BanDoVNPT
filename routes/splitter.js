const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const hienThiLoiHeThong = require('./xuly_loi');
const Splitter = mongoose.model('Splitter');

//Middleware kiểm tra đăng nhập
const kiemTraDangNhap = (req, res, next) => {
    if (req.session.user) next(); else res.redirect('/dangnhap');
};

//Trang quản lý danh sách tủ cáp
router.get('/', kiemTraDangNhap, async (req, res) => {
    try {
        const danhSachSplitter = await Splitter.find({})
            .populate('splitter_cha_id')
            .sort({ sys_id: 1, loai_splitter: 1 });

        const danhSachSplitterCap1 = await Splitter.find({ loai_splitter: '1:4' });

        res.render('splitter', {
            title: 'Quản lý tủ cáp',
            user: req.session.user,
            danhSachSplitter: danhSachSplitter,
            danhSachSplitterCap1: danhSachSplitterCap1
        });
    }  catch (error) {
        console.error("Lỗi Server:", error);
       hienThiLoiHeThong(req, res);
    }
});

//Xử lý thêm tủ cáp mới

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
        res.redirect('/quanly/splitter');

    } catch (error) {
        console.error("Lỗi khi thêm Splitter:", error);
        res.status(500).send("Đã xảy ra lỗi khi lưu Tủ cáp.");
    }
});

module.exports = router;