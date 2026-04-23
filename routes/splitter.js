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

        res.render('pages/splitter', {
            title: 'Quản lý tủ cáp',
            user: req.session.user,
            danhSachSplitter: danhSachSplitter,
            danhSachSplitterCap1: danhSachSplitterCap1,
            activePage: 'splitter'
        });
    }  catch (error) {
        console.error("Lỗi Server:", error);
       hienThiLoiHeThong(req, res);
    }
});

// Xóa tủ cáp (chỉ admin)
router.post('/xoa/:id', kiemTraDangNhap, async (req, res) => {
    const { id } = req.params;

    // Chỉ admin (vai_tro_id === 1) mới được xóa
    if (req.session.user.vai_tro_id !== 1) {
        req.session.error = 'Bạn không có quyền xóa tủ cáp!';
        return res.redirect('/quanly/splitter');
    }

    try {
        // Kiểm tra xem tủ cáp có đang được sử dụng bởi điểm kết nối nào không
        const DiemKetNoi = require('../models/DiemKetNoi');
        const dangSuDung = await DiemKetNoi.exists({ splitter_id: id });
        if (dangSuDung) {
            req.session.error = 'Không thể xóa tủ cáp vì đang có điểm kết nối sử dụng!';
            return res.redirect('/quanly/splitter');
        }

        const deleted = await Splitter.findByIdAndDelete(id);
        if (!deleted) {
            req.session.error = 'Không tìm thấy tủ cáp!';
        } else {
            req.session.success = 'Xóa tủ cáp thành công!';
        }
    } catch (error) {
        console.error('Lỗi khi xóa tủ cáp:', error);
        req.session.error = 'Lỗi hệ thống, không thể xóa!';
    }

    res.redirect('/quanly/splitter');
});

module.exports = router;