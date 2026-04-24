const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const sql = require('mssql');

const DiemKetNoi = require('../models/DiemKetNoi');
const Splitter = mongoose.model('Splitter');
const hienThiLoiHeThong = require('./xuly_loi');
const dbManager = require('../database');
const { kiemTraDangNhap } = require('../middleware/auth');

// Route: Trang quản lý điểm kết nối
router.get('/', kiemTraDangNhap, async (req, res) => {
    try {
        // Lấy danh sách Điểm kết nối từ MongoDB, có populate thông tin Tủ cấp 2 và sắp xếp theo lần kiểm tra cuối
        const danhSachDiem = await DiemKetNoi.find({})
            .populate('splitter_id')
            .sort({ 'trang_thai_ket_noi.lan_kiem_tra_cuoi': -1 });

        // Lấy danh sách tủ 1:16 để đổ vào Form thêm mới
        const danhSachSplitter16 = await Splitter.find({ loai_splitter: '1:16' });

        // Lấy danh sách gói cước từ SQL Server
        const pool = await dbManager.getSQLPool();
        let resultGoiCuoc = await pool.request().query('SELECT id, ten_goi_cuoc, loai_hinh_thue_bao FROM GoiCuoc');

        res.render('pages/diemketnoi', {
            title: 'Điểm kết nối',
            user: req.session.user,
            danhSachDiem: danhSachDiem,
            danhSachSplitter: danhSachSplitter16,
            danhSachGoiCuoc: resultGoiCuoc.recordset,
            activePage: 'diemketnoi'
        });
    }  catch (error) {
        console.error("Lỗi Server:", error);
        hienThiLoiHeThong(req, res);
    }
});

router.post('/them', kiemTraDangNhap, async (req, res) => {
    try {
        const {
            ten_khach_hang, dia_chi, kinh_do, vi_do,
            goi_cuoc_id, ngay_dang_ky, thoi_gian_su_dung_thang,
            splitter_id, username, password, sys_id, rack, slot, port
        } = req.body;

        // KIỂM TRA 1: Đảm bảo tọa độ hợp lệ
        const numKinhDo = parseFloat(kinh_do);
        const numViDo = parseFloat(vi_do);
        if (isNaN(numKinhDo) || isNaN(numViDo)) {
            return hienThiLoiHeThong(req, res, "Lỗi: Tọa độ vĩ độ/kinh độ không hợp lệ hoặc đang để trống.");
        }

        // KIỂM TRA 2: Xử lý gói cước (SQL Server)
        let loai_khach_hang = 'Chưa xác định';
        const idGoiCuoc = parseInt(goi_cuoc_id);
        
        if (!isNaN(idGoiCuoc)) {
            const pool = await dbManager.getSQLPool();
            let goiCuocInfo = await pool.request()
                .input('id', sql.Int, idGoiCuoc)
                .query('SELECT loai_hinh_thue_bao FROM GoiCuoc WHERE id = @id');
            
            if (goiCuocInfo.recordset.length > 0) {
                loai_khach_hang = goiCuocInfo.recordset[0].loai_hinh_thue_bao;
            }
        }

        // KIỂM TRA 3: Xử lý ngày tháng an toàn
        const ngayDangKyDate = ngay_dang_ky ? new Date(ngay_dang_ky) : new Date();
        const thoiGianSD = parseInt(thoi_gian_su_dung_thang) || 12;
        const ngayHetHanDate = new Date(ngayDangKyDate);
        ngayHetHanDate.setMonth(ngayHetHanDate.getMonth() + thoiGianSD);

        // Tạo Document mới cho MongoDB
        const diemMoi = new DiemKetNoi({
            ten_khach_hang, 
            loai_khach_hang, 
            dia_chi,
            vi_tri: { 
                type: 'Point', 
                coordinates: [numKinhDo, numViDo] 
            },
            thong_tin_hop_dong: { 
                goi_cuoc_id: idGoiCuoc || null, 
                ngay_dang_ky: ngayDangKyDate, 
                thoi_gian_su_dung_thang: thoiGianSD, 
                ngay_het_han: ngayHetHanDate 
            },
            splitter_id: mongoose.Types.ObjectId.isValid(splitter_id) ? splitter_id : null,
            thong_tin_pppoe: {
                username: username || '',
                password: password || '',
                circuit_id: {
                    sys_id: sys_id || 'AGG-LX-01',
                    rack: rack || '',
                    shelf: '0',
                    slot: slot || '0',
                    port: port || '1',
                    vpi: '0',
                    vci: '33'
                }
            },
            trang_thai_ket_noi: {
                mau_sac: "Xanh",
                ly_do_su_co: null,
                lan_kiem_tra_cuoi: new Date()
            },
            nguoi_tao: req.session.user.ho_ten
        });

        await diemMoi.save();
        res.redirect('/diemketnoi');

    } catch (error) {
        console.error("LỖI CHI TIẾT KHI THÊM ĐIỂM KẾT NỐI:", error);
        hienThiLoiHeThong(req, res, "Đã xảy ra lỗi hệ thống: " + error.message);
    }
});

// Route: Hiển thị trang sửa thông tin khách hàng (Giao diện)
router.get('/sua/:id', kiemTraDangNhap, async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Lấy thông tin chi tiết khách hàng
        const diem = await DiemKetNoi.findById(id).populate('splitter_id');
        if (!diem) return res.status(404).send("Không tìm thấy điểm kết nối.");

        // 2. Lấy danh sách Tủ 1:16 để chọn lại (nếu cần)
        const danhSachSplitter16 = await Splitter.find({ loai_splitter: '1:16' });

        // 3. Lấy danh sách gói cước từ SQL Server
        const pool = await dbManager.getSQLPool();
        let resultGoiCuoc = await pool.request().query('SELECT id, ten_goi_cuoc, loai_hinh_thue_bao FROM GoiCuoc');

        res.render('pages/diemketnoi_sua', {
            title: 'Sửa thông tin khách hàng',
            user: req.session.user,
            diem: diem,
            danhSachSplitter: danhSachSplitter16,
            danhSachGoiCuoc: resultGoiCuoc.recordset,
            activePage: 'diemketnoi'
        });
    } catch (error) {
        console.error("Lỗi khi mở trang sửa:", error);
        hienThiLoiHeThong(req, res);
    }
});
// Route: Xử lý cập nhật/sửa thông tin điểm kết nối (Update)
router.post('/sua/:id', kiemTraDangNhap, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            ten_khach_hang, dia_chi, kinh_do, vi_do,
            goi_cuoc_id, ngay_dang_ky, thoi_gian_su_dung_thang,
            splitter_id, username, password, sys_id, rack, slot, port
        } = req.body;

        // KIỂM TRA 1: Đảm bảo tọa độ hợp lệ
        const numKinhDo = parseFloat(kinh_do);
        const numViDo = parseFloat(vi_do);
        if (isNaN(numKinhDo) || isNaN(numViDo)) {
            return hienThiLoiHeThong(req, res, "Lỗi: Tọa độ vĩ độ/kinh độ không hợp lệ hoặc đang để trống.");
        }

        // KIỂM TRA 2: Xử lý gói cước (SQL Server)
        let loai_khach_hang = 'Chưa xác định';
        const idGoiCuoc = parseInt(goi_cuoc_id);
        
        if (!isNaN(idGoiCuoc)) {
            const pool = await dbManager.getSQLPool();
            let goiCuocInfo = await pool.request()
                .input('id', sql.Int, idGoiCuoc)
                .query('SELECT loai_hinh_thue_bao FROM GoiCuoc WHERE id = @id');
            
            if (goiCuocInfo.recordset.length > 0) {
                loai_khach_hang = goiCuocInfo.recordset[0].loai_hinh_thue_bao;
            }
        }

        // KIỂM TRA 3: Tính toán lại ngày tháng
        const ngayDangKyDate = ngay_dang_ky ? new Date(ngay_dang_ky) : new Date();
        const thoiGianSD = parseInt(thoi_gian_su_dung_thang) || 12;
        const ngayHetHanDate = new Date(ngayDangKyDate);
        ngayHetHanDate.setMonth(ngayHetHanDate.getMonth() + thoiGianSD);

        // THỰC HIỆN CẬP NHẬT TRONG MONGODB
        // Lưu ý: Không cập nhật 'trang_thai_ket_noi' và 'nguoi_tao' để giữ nguyên lịch sử sự cố
        await DiemKetNoi.findByIdAndUpdate(id, {
            ten_khach_hang, 
            loai_khach_hang, 
            dia_chi,
            vi_tri: { 
                type: 'Point', 
                coordinates: [numKinhDo, numViDo] 
            },
            thong_tin_hop_dong: { 
                goi_cuoc_id: idGoiCuoc || null, 
                ngay_dang_ky: ngayDangKyDate, 
                thoi_gian_su_dung_thang: thoiGianSD, 
                ngay_het_han: ngayHetHanDate 
            },
            splitter_id: mongoose.Types.ObjectId.isValid(splitter_id) ? splitter_id : null,
            thong_tin_pppoe: {
                username: username || '',
                password: password || '',
                circuit_id: {
                    sys_id: sys_id || 'AGG-LX-01',
                    rack: rack || '',
                    shelf: '0',
                    slot: slot || '0',
                    port: port || '1',
                    vpi: '0',
                    vci: '33'
                }
            }
        });

        // Cập nhật thành công, tải lại trang
        res.redirect('/diemketnoi');

    } catch (error) {
        console.error("LỖI CHI TIẾT KHI SỬA ĐIỂM KẾT NỐI:", error);
        hienThiLoiHeThong(req, res, "Đã xảy ra lỗi hệ thống khi cập nhật: " + error.message);
    }
});

// Xóa điểm kết nối (chỉ admin)
router.post('/xoa/:id', kiemTraDangNhap, async (req, res) => {
    const { id } = req.params;

    if (req.session.user.vai_tro_id !== 1) {
        req.session.error = 'Bạn không có quyền xóa điểm kết nối!';
        return res.redirect('/diemketnoi');   // tuyệt đối
    }

    try {
        const deleted = await DiemKetNoi.findByIdAndDelete(id);
        if (!deleted) {
            req.session.error = 'Không tìm thấy điểm kết nối!';
        } else {
            req.session.success = 'Xóa điểm kết nối thành công!';
        }
    } catch (error) {
        console.error('Lỗi khi xóa điểm kết nối:', error);
        req.session.error = 'Lỗi hệ thống, không thể xóa!';
    }

    res.redirect('/diemketnoi');   // quay về trang danh sách
});

module.exports = router;