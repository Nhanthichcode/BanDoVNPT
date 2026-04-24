const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const sql = require('mssql');
const hienThiLoiHeThong = require('./xuly_loi');
const dbManager = require('../database');//thêm cái này
const DiemKetNoi = require('../models/DiemKetNoi');
const {kiemTraDangNhap, kiemTraQuyenQuanTri} = require('../middleware/auth'); // Sử dụng middleware đã tạo


router.get('/su-co', kiemTraDangNhap, async (req, res) => {
    try {
        //Lấy danh sách điểm Đỏ/Xám từ MongoDB
        const danhSachSuCo = await DiemKetNoi.find({
            'trang_thai_ket_noi.mau_sac': { $in: ['Đỏ', 'Xám'] }
        }).populate('splitter_id').sort({ 'trang_thai_ket_noi.lan_kiem_tra_cuoi': -1 });

        const diemSuaChua = danhSachSuCo.filter(d => d.trang_thai_ket_noi.mau_sac === 'Đỏ');
        const diemThuHoi = danhSachSuCo.filter(d => d.trang_thai_ket_noi.mau_sac === 'Xám');

        //Lấy danh sách điểm Bình thường để hiển thị ở phần "Đang hoạt động"
        const danhSachBinhThuong = await DiemKetNoi.find({
            'trang_thai_ket_noi.mau_sac': 'Xanh'
        }).sort({ ten_khach_hang: 1 });

        //Kiểm tra SQL Server xem điểm nào đang được xử lý
        const pool = await dbManager.getSQLPool();
        let resultSQL = await pool.request().query(`
            SELECT id AS bao_cao_id, diem_ket_noi_id 
            FROM BaoCaoSuCo 
            WHERE trang_thai_xu_ly IN (0, 1)
        `);
        
        //Tạo một mảng chứa ID của các điểm đã báo cáo
        const mapDangXuLy = {};
        resultSQL.recordset.forEach(r => {
            mapDangXuLy[r.diem_ket_noi_id] = r.bao_cao_id;
        });

        res.render('pages/baocao_suco', {
            title: 'Báo cáo sự cố mạng lưới',
            user: req.session.user,
            danhSachSuCo: danhSachSuCo,
            soLuongDo: diemSuaChua.length,
            soLuongXam: diemThuHoi.length,
            mapDangXuLy: mapDangXuLy,
            danhSachBinhThuong: danhSachBinhThuong,
            activePage: 'baocao_suco'
        });

    } catch (error) {
        console.error("Lỗi khi lấy danh sách sự cố:", error);
        hienThiLoiHeThong(req, res);
    }
});

//Route: Hiển thị lịch sử báo cáo
router.get('/lich-su', kiemTraDangNhap, async (req, res) => {
    try {
        const pool = await dbManager.getSQLPool();
        let resultSQL = await pool.request().query(`
            SELECT b.id AS truong_hop, b.diem_ket_noi_id, b.loai_su_co, b.thoi_gian_tao AS ngay_bao_cao,
                   b.trang_thai_xu_ly, t.ho_ten AS nguoi_bao_cao,
                   (SELECT MAX(thoi_gian_cap_nhat) FROM ChiTietBaoCao c WHERE c.bao_cao_id = b.id) AS ngay_khac_phuc
            FROM BaoCaoSuCo b
            LEFT JOIN TaiKhoan t ON b.nguoi_tao_id = t.id
            ORDER BY b.thoi_gian_tao DESC
        `);

        let danhSachBaoCao = resultSQL.recordset;

        // Lấy tên và địa chỉ từ Mongo
        const danhSachIdMongo = danhSachBaoCao.map(bc => bc.diem_ket_noi_id);
        const cacDiemKetNoi = await DiemKetNoi.find({ _id: { $in: danhSachIdMongo } }).select('_id dia_chi ten_khach_hang');

        const mapDuLieu = {};
        cacDiemKetNoi.forEach(diem => {
            mapDuLieu[diem._id.toString()] = { dia_chi: diem.dia_chi, ten: diem.ten_khach_hang };
        });

        const taoMaTruongHop = (loaiSuCo, id) => {
            let kyTuDau = 'K'; 
            const loai = loaiSuCo ? loaiSuCo.toLowerCase() : "";
            if (loai.includes('cấu hình') || loai.includes('pppoe')) kyTuDau = 'C';
            else if (loai.includes('đứt cáp')) kyTuDau = 'D';
            else if (loai.includes('mất điện')) kyTuDau = 'M';
            else if (loai.includes('hỏng thiết bị')) kyTuDau = 'H';
            else if (loai.includes('suy hao')) kyTuDau = 'S';
            else if (loai.includes('trộm') || loai.includes('mất dây')) kyTuDau = 'T';
            
            const tapKyTu = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            let viTriKyTu = Math.floor(id / 10000) % 36; 
            return `${kyTuDau}${tapKyTu[viTriKyTu]}${String(id % 10000).padStart(4, '0')}`;
        };

        danhSachBaoCao = danhSachBaoCao.map(bc => ({
            ...bc,
            ma_truong_hop: taoMaTruongHop(bc.loai_su_co, bc.truong_hop),
            ten_khach_hang: mapDuLieu[bc.diem_ket_noi_id] ? mapDuLieu[bc.diem_ket_noi_id].ten : 'Khách hàng đã hủy',
            dia_chi: mapDuLieu[bc.diem_ket_noi_id] ? mapDuLieu[bc.diem_ket_noi_id].dia_chi : 'Không xác định'
        }));

        return res.render('pages/baocao_lichsu', {
            title: 'Lịch sử báo cáo sự cố', user: req.session.user, danhSachBaoCao, activePage: 'baocao_lichsu'
        });

    } catch (error) {
        console.error("Lỗi lịch sử báo cáo:", error);
        return hienThiLoiHeThong(req, res); 
    }
});

//ROUTE: Gia hạn hợp đồng
router.post('/gia-han', kiemTraDangNhap, async (req, res) => {
    try {
        const { diem_ket_noi_id, so_thang_gia_han } = req.body;
        const diem = await DiemKetNoi.findById(diem_ket_noi_id);
        if (!diem) return res.status(404).send("Không tìm thấy điểm.");

        // Cập nhật Mongo
        let ngayHHTai = new Date(diem.thong_tin_hop_dong.ngay_het_han);
        ngayHHTai.setMonth(ngayHHTai.getMonth() + parseInt(so_thang_gia_han));
        diem.thong_tin_hop_dong.ngay_het_han = ngayHHTai;
        diem.thong_tin_hop_dong.thoi_gian_su_dung_thang += parseInt(so_thang_gia_han);
        diem.trang_thai_ket_noi.mau_sac = 'Xanh';
        diem.trang_thai_ket_noi.ly_do_su_co = null;
        await diem.save();

        // Đồng bộ SQL: Đóng các báo cáo treo (nếu có)
        const pool = await dbManager.getSQLPool();
        await pool.request().input('diem_id', sql.VarChar, diem_ket_noi_id.toString()).query(`
            UPDATE BaoCaoSuCo SET trang_thai_xu_ly = 2 WHERE diem_ket_noi_id = @diem_id AND trang_thai_xu_ly IN (0, 1)
        `);

        return res.redirect('/baocao/su-co');
    } catch (error) {
        return hienThiLoiHeThong(req, res, "Đã xảy ra lỗi khi gia hạn.");
    }
});

//Route: Thu hồi và Hủy
router.post('/thu-hoi', kiemTraDangNhap, async (req, res) => {
    try {
        const { diem_ket_noi_id } = req.body;
        
        // 1. Đồng bộ SQL: Hủy/Đóng tất cả báo cáo treo của khách này để tránh mồ côi dữ liệu
        const pool = await dbManager.getSQLPool();
        await pool.request().input('diem_id', sql.VarChar, diem_ket_noi_id.toString()).query(`
            UPDATE BaoCaoSuCo SET trang_thai_xu_ly = 2, mo_ta_ban_dau = mo_ta_ban_dau + N' [Hệ thống tự đóng do Thu Hồi]' 
            WHERE diem_ket_noi_id = @diem_id AND trang_thai_xu_ly IN (0, 1)
        `);

        // 2. Xóa Mongo
        await DiemKetNoi.findByIdAndDelete(diem_ket_noi_id);
        return res.redirect('/baocao/su-co');
    } catch (error) {
        return hienThiLoiHeThong(req, res, "Lỗi khi thu hồi.");
    }
});

//Route: Xử lý thêm báo cáo
router.post('/lap-bao-cao', kiemTraDangNhap, async (req, res) => {
    try {
        const { diem_ket_noi_id, loai_su_co, mo_ta_ban_dau } = req.body;
        const pool = await dbManager.getSQLPool();

        // Kiểm tra chống trùng lặp báo cáo
        const check = await pool.request().input('diem_id', sql.VarChar, diem_ket_noi_id.toString()).query(`
            SELECT id FROM BaoCaoSuCo WHERE diem_ket_noi_id = @diem_id AND trang_thai_xu_ly IN (0, 1)
        `);
        if(check.recordset.length > 0) {
            return hienThiLoiHeThong(req, res, "Điểm kết nối này đang có báo cáo chờ xử lý. Không thể tạo thêm!");
        }

        // Tạo báo cáo SQL
        await pool.request()
            .input('diem_id', sql.VarChar, diem_ket_noi_id.toString())
            .input('nguoi_tao', sql.Int, req.session.user.id)
            .input('loai', sql.NVarChar, loai_su_co)
            .input('mota', sql.NVarChar, mo_ta_ban_dau || '')
            .query(`INSERT INTO BaoCaoSuCo (diem_ket_noi_id, nguoi_tao_id, loai_su_co, mo_ta_ban_dau, thoi_gian_tao, trang_thai_xu_ly) VALUES (@diem_id, @nguoi_tao, @loai, @mota, GETDATE(), 0)`);
        
        // Cập nhật Mongo
        await DiemKetNoi.findByIdAndUpdate(diem_ket_noi_id, {
            $set: { 'trang_thai_ket_noi.mau_sac': 'Đỏ', 'trang_thai_ket_noi.ly_do_su_co': loai_su_co, 'trang_thai_ket_noi.lan_kiem_tra_cuoi': new Date() }
        });

        return res.redirect('/baocao/su-co');
    } catch (error) {
        return hienThiLoiHeThong(req, res, "Lỗi khi lập báo cáo.");
    }
});

//Route: Cập nhật
router.post('/cap-nhat', kiemTraDangNhap, async (req, res) => {
    try {
        const { bao_cao_id, diem_ket_noi_id, noi_dung_cap_nhat, trang_thai_moi } = req.body;
        const pool = await dbManager.getSQLPool();

        await pool.request()
            .input('bc_id', sql.Int, bao_cao_id).input('nguoi', sql.Int, req.session.user.id).input('noidung', sql.NVarChar, noi_dung_cap_nhat)
            .query(`INSERT INTO ChiTietBaoCao (bao_cao_id, nguoi_cap_nhat_id, noi_dung_cap_nhat, thoi_gian_cap_nhat) VALUES (@bc_id, @nguoi, @noidung, GETDATE())`);

        await pool.request().input('bc_id', sql.Int, bao_cao_id).input('tt', sql.TinyInt, trang_thai_moi)
            .query(`UPDATE BaoCaoSuCo SET trang_thai_xu_ly = @tt WHERE id = @bc_id`);

        if (parseInt(trang_thai_moi) === 2) {
            await DiemKetNoi.findByIdAndUpdate(diem_ket_noi_id, {
                $set: { 'trang_thai_ket_noi.mau_sac': 'Xanh', 'trang_thai_ket_noi.ly_do_su_co': null, 'trang_thai_ket_noi.lan_kiem_tra_cuoi': new Date() }
            });
        }
        return res.redirect('/baocao/su-co');
    } catch (error) {
        return hienThiLoiHeThong(req, res, "Lỗi cập nhật.");
    }
});

module.exports = router;