const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const hienThiLoiHeThong = require('./xuly_loi');
const Splitter = require('../models/Splitter');
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

module.exports = router;