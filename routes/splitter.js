const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const hienThiLoiHeThong = require('./xuly_loi');
const Splitter = require('../models/Splitter');
const {kiemTraDangNhap, kiemTraQuyenQuanTri} = require('../middleware/auth'); // Sử dụng middleware đã tạo

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
// Route: Xử lý thêm tủ cáp mới
router.post('/them', kiemTraDangNhap, async (req, res) => {
    try {
        const { ten_splitter, sys_id, kinh_do, vi_do, loai_splitter, splitter_cha_id } = req.body;

        const tuCapMoi = new Splitter({
            ten_splitter: ten_splitter,
            loai_splitter: loai_splitter,
            trang_thai: 'Hoạt động',
            sys_id: sys_id,
            vi_tri: {
                type: 'Point',
                coordinates: [kinh_do, vi_do]
            },
            splitter_cha_id: (loai_splitter === '1:16' && splitter_cha_id) ? splitter_cha_id : null
        });

        await tuCapMoi.save();
        
        // Lưu thành công, tải lại trang danh sách tủ cáp
        return res.redirect('/splitter');

    } catch (error) {
        console.error("Lỗi khi thêm Splitter:", error);
        hienThiLoiHeThong(req, res  , "Đã xảy ra lỗi khi lưu Tủ cáp vào hệ thống.");
    }
});
// Xóa tủ cáp (chỉ admin)
router.post('/xoa/:id', kiemTraDangNhap, async (req, res) => {
    const { id } = req.params;

    // Chỉ admin (vai_tro_id === 1) mới được xóa
    if (req.session.user.vai_tro_id !== 1) {
        req.session.error = 'Bạn không có quyền xóa tủ cáp!';
        return res.redirect('/splitter');
    }

    try {
        // Kiểm tra xem tủ cáp có đang được sử dụng bởi điểm kết nối nào không
        const DiemKetNoi = require('../models/DiemKetNoi');
        const dangSuDung = await DiemKetNoi.exists({ splitter_id: id });
        if (dangSuDung) {
            req.session.error = 'Không thể xóa tủ cáp vì đang có điểm kết nối sử dụng!';
            return res.redirect('/splitter');
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

    res.redirect('/splitter');
});

// Route: Xử lý cập nhật/sửa thông tin tủ cáp
router.post('/sua/:id', kiemTraDangNhap, async (req, res) => {
    try {
        const { id } = req.params;
        const { ten_splitter, sys_id, kinh_do, vi_do, loai_splitter, splitter_cha_id } = req.body;

        await Splitter.findByIdAndUpdate(id, {
            ten_splitter: ten_splitter,
            loai_splitter: loai_splitter,
            sys_id: sys_id,
            vi_tri: {
                type: 'Point',
                coordinates: [parseFloat(kinh_do), parseFloat(vi_do)]
            },
            // Nếu là tủ cấp 2 thì mới lưu ID tủ cha, ngược lại lưu null
            splitter_cha_id: (loai_splitter === '1:16' && splitter_cha_id) ? splitter_cha_id : null
        });

        // Cập nhật thành công, quay lại trang quản lý
        return res.redirect('/splitter');

    } catch (error) {
        console.error("Lỗi khi cập nhật Splitter:", error);
        hienThiLoiHeThong(req, res, "Đã xảy ra lỗi khi cập nhật thông tin Tủ cáp.");
    }
});

module.exports = router;