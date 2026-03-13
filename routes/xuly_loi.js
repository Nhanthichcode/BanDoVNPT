//Hàm dùng chung để hiển thị trang lỗi 500
function hienThiLoiHeThong(req, res, thongBaoTuyChinh) {

    const loiMacDinh = 'Không thể kết nối với cơ sở dữ liệu. Xin vui lòng kiểm tra lại đường truyền hoặc cấu hình MongoDB/SQL Server.';
    
    res.status(500).render('loi_he_thong', { 
        title: 'Lỗi Cơ Sở Dữ Liệu', 
        user: req.session ? req.session.user : null,
        errorMsg: thongBaoTuyChinh || loiMacDinh
    });
}

module.exports = hienThiLoiHeThong;