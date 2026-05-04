//Hàm dùng chung để hiển thị trang lỗi 500
function hienThiLoiHeThong(req, res) {
    // Nếu bạn đang dùng layout chính, tắt layout để hiển thị trang lỗi độc lập
    res.status(500).render('pages/loi_he_thong', { layout: false });
    // Hoặc nếu muốn giữ 
    layout: res.status(500).render('pages/loi_he_thong');
}

module.exports = hienThiLoiHeThong;