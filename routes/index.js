const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const sql = require('mssql'); // Thêm thư viện mssql
const hienThiLoiHeThong = require('./xuly_loi');
const dbManager = require('../database');
const { kiemTraDangNhap } = require('../middleware/auth');
const DiemKetNoi = require('../models/DiemKetNoi');
const Splitter = require('../models/Splitter');

//Route: Giao diện chính bản đồ
router.get('/', kiemTraDangNhap, async (req, res) => {
    try {
        const pool = await dbManager.getSQLPool();
        const user = req.session.user;
        const danhSachSplitterCap1 = await Splitter.find({ loai_splitter: '1:4' });
            const danhSachSplitterCap2 = await Splitter.find({ loai_splitter: '1:16' });

        const stats = {};
        let pendingList = [];
        let resolvedList = [];

        // 1. Lấy dữ liệu thống kê và danh sách từ SQL
        if (user.vai_tro_id === 1 || user.vai_tro_id === 2) {
            const usersCount = await pool.request().query('SELECT COUNT(*) as count FROM TaiKhoan');
            const issuesCount = await pool.request().query('SELECT COUNT(*) as count FROM BaoCaoSuCo WHERE trang_thai_xu_ly IN (0, 1)');
            const pkgsCount = await pool.request().query('SELECT COUNT(*) as count FROM GoiCuoc');
            
            stats.users = usersCount.recordset[0].count;
            stats.issues = issuesCount.recordset[0].count;
            stats.packages = pkgsCount.recordset[0].count;
        }

        // Lấy top 15 sự cố đang chờ và đã khắc phục
        const pendingQuery = await pool.request().query(`SELECT id, diem_ket_noi_id, loai_su_co, thoi_gian_tao FROM BaoCaoSuCo WHERE trang_thai_xu_ly IN (0, 1) ORDER BY thoi_gian_tao DESC`);
        const resolvedQuery = await pool.request().query(`SELECT TOP 15 id, diem_ket_noi_id, loai_su_co, thoi_gian_tao FROM BaoCaoSuCo WHERE trang_thai_xu_ly = 2 ORDER BY thoi_gian_tao DESC`);
        
        pendingList = pendingQuery.recordset;
        resolvedList = resolvedQuery.recordset;

        // Nếu là nhân viên, đếm số liệu của riêng họ (hiển thị tạm bằng tổng số sự cố)
        if (user.vai_tro_id === 3) {
            stats.myPendingIssues = pendingList.length;
            stats.myResolvedIssues = resolvedList.length;
        }

        // 2. Ghép tên Khách Hàng từ MongoDB sang danh sách SQL
        const allIds = [...pendingList, ...resolvedList].map(r => r.diem_ket_noi_id);
        const khachHangs = await DiemKetNoi.find({ _id: { $in: allIds } }, 'ten_khach_hang');
        const khMap = {};
        khachHangs.forEach(k => khMap[k._id.toString()] = k.ten_khach_hang);

        // Lọc bỏ những sự cố mồ côi (khách hàng đã bị thu hồi/xóa) và gán tên
        const filterAndMapNames = (list) => list
            .filter(item => khMap[item.diem_ket_noi_id] !== undefined) // Chốt chặn: Chỉ giữ lại KH có tồn tại
            .map(item => ({
                ...item, 
                ten_khach_hang: khMap[item.diem_ket_noi_id]
            }));

        pendingList = filterAndMapNames(pendingList);
        resolvedList = filterAndMapNames(resolvedList);
        
        // Đồng bộ lại các con số thống kê (Badge đếm số) để khớp với danh sách đã lọc
        if (user.vai_tro_id === 1 || user.vai_tro_id === 2) {
            stats.issues = pendingList.length; 
        }
        if (user.vai_tro_id === 3) {
            stats.myPendingIssues = pendingList.length;
            stats.myResolvedIssues = resolvedList.length;
        }
            const danhSachDiem = await DiemKetNoi.find({})
            .populate('splitter_id')
            .sort({ 'trang_thai_ket_noi.lan_kiem_tra_cuoi': -1 });

                let resultGoiCuoc = await pool.request().query('SELECT id, ten_goi_cuoc, loai_hinh_thue_bao FROM GoiCuoc');

            const danhSachThuHoi = danhSachDiem.filter(d => d.trang_thai_ket_noi && d.trang_thai_ket_noi.mau_sac === 'Xám');
        stats.thuHoiCount = danhSachThuHoi.length;

        res.render('pages/dashboard', { 
            user, 
            stats, 
            pendingList, // Truyền danh sách chờ ra giao diện
            resolvedList, // Truyền danh sách xong ra giao diện
            danhSachSplitterCap1: danhSachSplitterCap1,
            danhSachGoiCuoc: resultGoiCuoc.recordset,
            danhSachDiem: danhSachDiem,
            thuHoiList: danhSachThuHoi,
            danhSachSplitterCap2: danhSachSplitterCap2,
            activePage: 'dashboard',
            title: 'Bảng điều khiển' 
        });
    } catch (error) {
        console.error("Lỗi Dashboard:", error);
        hienThiLoiHeThong(req, res);
    }
});

//Route: API lấy điểm kết nối (Giữ nguyên)
router.get('/api/diem-ket-noi', async (req, res) => {
    try {
        // 1. THÊM .lean() để lấy đối tượng thuần thay vì Mongoose Document
        const danhSachDiem = await DiemKetNoi.find({}).populate({
            path: 'splitter_id', 
            populate: { path: 'splitter_cha_id' }
        }).lean();

        // 2. Truy vấn SQL Server lấy báo cáo
        const pool = await dbManager.getSQLPool();
        const resultSQL = await pool.request().query(`
            SELECT id AS bao_cao_id, diem_ket_noi_id 
            FROM BaoCaoSuCo 
            WHERE trang_thai_xu_ly IN (0, 1)
        `);

        // 3. Tạo Map tra cứu nhanh
        const mapDangXuLy = {};
        resultSQL.recordset.forEach(r => {
            mapDangXuLy[r.diem_ket_noi_id] = r.bao_cao_id;
        });

        // 4. Hợp nhất dữ liệu (Bây giờ ...diem sẽ hoạt động hoàn hảo)
        const dataKetQua = danhSachDiem.map(diem => {
            return {
                ...diem,
                // Gán bao_cao_id nếu có trong SQL
                bao_cao_id: mapDangXuLy[diem._id.toString()] || null
            };
        });

        res.status(200).json(dataKetQua);
    } catch (error) {
        console.error("Lỗi API lấy điểm kết nối MongoDB:", error);
        res.status(500).json({ error: "Lỗi hệ thống" }); 
    }
});

//Route: API lấy danh sách tủ cáp (Giữ nguyên)
router.get('/api/splitters', async (req, res) => {
    try {
        const danhSachSplitter = await Splitter.find({});
        const splitters = danhSachSplitter.map(sp => {
        const obj = sp.toObject();
        obj.splitter_cha_id = obj.splitter_cha_id ? obj.splitter_cha_id.toString() : "";
        return obj;
        });
        res.status(200).json(splitters);       
    } catch (error) {
        console.error("Lỗi API lấy danh sách tủ cáp:", error);
        res.status(500).json({ error: "Lỗi server" });
    }
});

// ==========================================
// ROUTER: Xóa TẤT CẢ Khách hàng và Tủ cáp (Nguy hiểm!)
// ==========================================
router.delete('/xoa-tat-ca-du-lieu', kiemTraDangNhap, async (req, res) => {
    try {
        // (Tùy chọn) Bật dòng dưới lên nếu muốn chỉ Admin (vai_tro_id === 1) mới được xóa
        // if (req.session.user.vai_tro_id !== 1) {
        //     return res.status(403).json({ success: false, message: 'Từ chối truy cập: Chỉ Admin mới có quyền xóa toàn bộ!' });
        // }

        // 1. Xóa toàn bộ dữ liệu trong collection DiemKetNoi (Khách hàng)
        const ketQuaKH = await DiemKetNoi.deleteMany({});
        
        // 2. Xóa toàn bộ dữ liệu trong collection Splitter (Tủ cáp)
        const ketQuaTuCap = await Splitter.deleteMany({});

        res.status(200).json({ 
            success: true, 
            message: `Hủy diệt thành công! Đã xóa ${ketQuaKH.deletedCount} khách hàng và ${ketQuaTuCap.deletedCount} tủ cáp.` 
        });
        
    } catch (error) {
        console.error("Lỗi khi xóa toàn bộ dữ liệu:", error);
        res.status(500).json({ success: false, message: 'Đã xảy ra lỗi hệ thống khi xóa dữ liệu!' });
    }
});

module.exports = router;