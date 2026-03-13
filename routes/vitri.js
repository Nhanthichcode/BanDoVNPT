const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const sql = require('mssql');

const DiemKetNoi = mongoose.model('DiemKetNoi');
const Splitter = mongoose.model('Splitter');
const hienThiLoiHeThong = require('./xuly_loi');

//Cấu hình SQL Server
const sqlConfig = {
    user: 'sa', password: 'sql2019', database: 'VNPT_BanDo_Admin', server: 'localhost', port: 1433,
    options: { encrypt: false, trustServerCertificate: true }
};

const kiemTraDangNhap = (req, res, next) => {
    if (req.session.user) next(); else res.redirect('/dangnhap');
};

//Trang quản lý điểm kết nối
router.get('/', kiemTraDangNhap, async (req, res) => {
    try {
        //Lấy danh sách Điểm kết nối từ MongoDB, có populate thông tin Tủ cấp 2 và sắp xếp theo lần kiểm tra cuối
        const danhSachDiem = await DiemKetNoi.find({})
            .populate('splitter_id')
            .sort({ 'trang_thai_ket_noi.lan_kiem_tra_cuoi': -1 });

        //Lấy danh sách tủ 1:16 để đổ vào Form thêm mới
        const danhSachSplitter16 = await Splitter.find({ loai_splitter: '1:16' });

        //Lấy danh sách gói cước từ SQL Server
        let pool = await sql.connect(sqlConfig);
        let resultGoiCuoc = await pool.request().query('SELECT id, ten_goi_cuoc, loai_hinh_thue_bao FROM GoiCuoc');

        res.render('diemketnoi', {
            title: 'Điểm kết nối',
            user: req.session.user,
            danhSachDiem: danhSachDiem,
            danhSachSplitter: danhSachSplitter16,
            danhSachGoiCuoc: resultGoiCuoc.recordset
        });
    }  catch (error) {
        console.error("Lỗi Server:", error);
        res.status(500).render('loi_he_thong', { 
            title: 'Lỗi Cơ Sở Dữ Liệu', 
            user: req.session ? req.session.user : null,
            errorMsg: 'Không thể kết nối với cơ sở dữ liệu. Xin vui lòng kiểm tra lại đường truyền hoặc cấu hình MongoDB/SQL Server.'
        });
    }
});

//Xử lý thêm điểm kết nối mới
router.post('/them', kiemTraDangNhap, async (req, res) => {
    try {
        const {
            ten_khach_hang, dia_chi, kinh_do, vi_do, ping,
            goi_cuoc_id, ngay_dang_ky, thoi_gian_su_dung_thang,
            splitter_id, username, password, rack, shelf, slot, port
        } = req.body;

        //Xử lý gói cước
        let pool = await sql.connect(sqlConfig);
        let goiCuocInfo = await pool.request()
            .input('id', sql.Int, goi_cuoc_id)
            .query('SELECT loai_hinh_thue_bao FROM GoiCuoc WHERE id = @id');
        let loai_khach_hang = goiCuocInfo.recordset.length > 0 ? goiCuocInfo.recordset[0].loai_hinh_thue_bao : 'Chưa xác định';

        //Xử lý ngày tháng
        const ngayDangKyDate = new Date(ngay_dang_ky);
        const ngayHetHanDate = new Date(ngayDangKyDate);
        ngayHetHanDate.setMonth(ngayHetHanDate.getMonth() + parseInt(thoi_gian_su_dung_thang));

        //Xử lý trạng thái kết nối
        const soPing = parseInt(ping);
        let mau_sac = "Xám", cuong_do = 0;
        if (soPing > 0 && soPing <= 90) { mau_sac = "Xanh"; cuong_do = Math.floor(Math.random() * 21) + 80; }
        else if (soPing > 90 && soPing <= 250) { mau_sac = "Vàng"; cuong_do = Math.floor(Math.random() * 31) + 50; }
        else if (soPing > 250) { mau_sac = "Đỏ"; cuong_do = Math.floor(Math.random() * 49) + 1; }

        //Tạo Document mới và lưu vào MongoDB
        const diemMoi = new DiemKetNoi({
            ten_khach_hang, loai_khach_hang, dia_chi,
            vi_tri: { type: 'Point', coordinates: [parseFloat(kinh_do), parseFloat(vi_do)] },
            thong_tin_hop_dong: { goi_cuoc_id: parseInt(goi_cuoc_id), ngay_dang_ky: ngayDangKyDate, thoi_gian_su_dung_thang: parseInt(thoi_gian_su_dung_thang), ngay_het_han: ngayHetHanDate },

            //Lưu trữ hạ tầng và PPPoE
            splitter_id: splitter_id,
            thong_tin_pppoe: {
                username: username,
                password: password,
                circuit_id: { rack, shelf, slot, port, vpi: '0', vci: '33' }
            },

            trang_thai_ket_noi: { mau_sac, cuong_do_tin_hieu: cuong_do, do_tre_ping_ms: soPing, lan_kiem_tra_cuoi: new Date() },
            nguoi_tao: req.session.user.ho_ten
        });

        await diemMoi.save();
        res.redirect('/quanly/vitri');
    } catch (error) {
        console.error("Lỗi khi thêm điểm kết nối:", error);
        hienThiLoiHeThong(req, res);
    }
});

module.exports = router;