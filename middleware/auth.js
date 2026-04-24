// File: middlewares/auth.js
const hienThiLoiHeThong = require('../routes/xuly_loi'); // Chỉnh lại đường dẫn nếu file xuly_loi.js nằm chỗ khác

// 1. Lớp khiên 1: Yêu cầu phải đăng nhập
const kiemTraDangNhap = (req, res, next) => {
    if (req.session && req.session.user) {
        // Đã đăng nhập -> Cho phép đi tiếp
        return next();
    }
    // Chưa đăng nhập -> Đẩy về trang đăng nhập
    res.redirect('/dangnhap');
};

// 2. Lớp khiên 2: Yêu cầu quyền Quản trị (Admin/Manager)
const kiemTraQuyenQuanTri = (req, res, next) => {
    // Để an toàn, kiểm tra xem có session chưa trước
    if (!req.session || !req.session.user) {
        return res.redirect('/dangnhap');
    }

    const vaiTro = req.session.user.vai_tro_id;
    
    // Giả sử: 1 = Quản trị viên, 2 = Quản lý
    if (vaiTro === 1 || vaiTro === 2) {
        next(); // Hợp lệ -> Cho phép đi tiếp
    } else {
        // Không hợp lệ -> Báo lỗi
        if (typeof hienThiLoiHeThong === 'function') {
            hienThiLoiHeThong(req, res, "TRUY CẬP BỊ TỪ CHỐI! Chức năng này chỉ dành cho Quản trị viên và Quản lý.");
        } else {
            res.status(403).send("TRUY CẬP BỊ TỪ CHỐI! Bạn không có quyền thực hiện chức năng này.");
        }
    }
};

const kiemTraQuyenAdmin = (req, res, next) => {
    // Để an toàn, kiểm tra xem có session chưa trước
    if (!req.session || !req.session.user) {
        return res.redirect('/dangnhap');
    }

    const vaiTro = req.session.user.vai_tro_id;

    // Giả sử: 1 = Quản trị viên
    if (vaiTro === 1) {
        next(); // Hợp lệ -> Cho phép đi tiếp
    } else {
        // Không hợp lệ -> Báo lỗi
        if (typeof hienThiLoiHeThong === 'function') {
            hienThiLoiHeThong(req, res, "TRUY CẬP BỊ TỪ CHỐI! Chức năng này chỉ dành cho Quản trị viên.");
        } else {
            res.status(403).send("TRUY CẬP BỊ TỪ CHỐI! Bạn không có quyền thực hiện chức năng này.");
        }
    }
};

// Xuất các hàm này ra để dùng ở file khác
module.exports = {
    kiemTraDangNhap,
    kiemTraQuyenQuanTri,
    kiemTraQuyenAdmin
};