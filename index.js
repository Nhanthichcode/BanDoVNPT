const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');

const app = express();
const port = 3000;

//1. Cấu hình hệ thống và Session

app.use('/js', express.static('js'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/data', express.static('data'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'vnpt-secret-key-2026',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 8 }
}));

//2. Kết nối MongoDB và khai báo Models

const uri = 'mongodb+srv://sa:admin123@vnpt-mapping.ep8txj8.mongodb.net/VNPT_Mapping?appName=VNPT-Mapping';
mongoose.connect(uri)
    .then(() => console.log('Đã kết nối MongoDB!'))
    .catch(err => console.log('Lỗi kết nối MongoDB:', err));

require('./models/Splitter');
require('./models/DiemKetNoi');

//3. Khai báo Router
//--- Hệ thống chung & Xác thực ---
const indexRouter = require('./routes/index');
const dangnhapRouter = require('./routes/dangnhap');
const dangnhapXulyRouter = require('./routes/dangnhap_xuly');
const dangxuatXulyRouter = require('./routes/dangxuat_xuly');

//--- Hồ sơ cá nhân ---
const taikhoanRouter = require('./routes/taikhoan');
const capnhatTaikhoanRouter = require('./routes/capnhat_taikhoan');
const capnhatTaikhoanXulyRouter = require('./routes/capnhat_taikhoan_xuly');
const matkhauDoiRouter = require('./routes/matkhau_doi');
const matkhauDoiXulyRouter = require('./routes/matkhau_doi_xuly');

//--- Quản trị: Người dùng ---
const quanlyNguoiDungRouter = require('./routes/quanly_nguoidung');
const quanlyThemNguoiDungRouter = require('./routes/quanly_them_nguoidung');
const quanlyThemNguoiDungXulyRouter = require('./routes/quanly_them_nguoidung_xuly');
const quanlyKhoaTaiKhoanXulyRouter = require('./routes/quanly_khoa_taikhoan_xuly');
const quanlyMoKhoaTaiKhoanXulyRouter = require('./routes/quanly_mokhoa_taikhoan_xuly');
const quanlyDatLaiMatKhauXulyRouter = require('./routes/quanly_datlai_matkhau_xuly');
const quanlyChiTietNguoiDungRouter = require('./routes/quanly_chitiet_nguoidung');
const quanlyChiTietNguoiDungXulyRouter = require('./routes/quanly_chitiet_nguoidung_xuly');
const quanlyCapNhatNguoiDungRouter = require('./routes/quanly_capnhat_nguoidung');
const quanlyCapNhatNguoiDungXulyRouter = require('./routes/quanly_capnhat_nguoidung_xuly');

//--- Quản trị: Gói cước ---
const goicuocRouter = require('./routes/goicuoc');
const goicuocThemXulyRouter = require('./routes/goicuoc_them_xuly');
const goicuocXoaXulyRouter = require('./routes/goicuoc_xoa_xuly');

//--- Quản trị: Tủ Splitter ---
const splitterRouter = require('./routes/splitter');
const splitterThemXulyRouter = require('./routes/splitter_them_xuly');

//--- Quản trị: Điểm kết nối ---
const vitriRouter = require('./routes/vitri');
const vitriThemXulyRouter = require('./routes/vitri_them_xuly');
// --- Báo cáo và giám sát ---
const baocaoSucoRouter = require('./routes/baocao_suco');
const baocaoLapXulyRouter = require('./routes/baocao_lap_xuly');
const baocaoHopDongXulyRouter = require('./routes/baocao_hopdong_xuly');

// --- Kiểm soát phân quyền ---
const kiemTraQuyenQuanTri = (req, res, next) => {
    if (req.session.user && (req.session.user.vai_tro_id === 1 || req.session.user.vai_tro_id === 2)) {
        next();
    } else {
        const hienThiLoiHeThong = require('./routes/xuly_loi');
        hienThiLoiHeThong(req, res, "TRUY CẬP BỊ TỪ CHỐI! Chức năng này chỉ dành cho Quản trị viên và Quản lý.");
    }
};

//4. Khai báo tiền tố cho đường dẫn
//--- Hệ thống chung và Xác thực ---
app.use('/', indexRouter);
app.use('/', dangnhapRouter);
app.use('/', dangnhapXulyRouter);
app.use('/', dangxuatXulyRouter);

//--- Hồ sơ cá nhân ---
app.use('/taikhoan', taikhoanRouter);
app.use('/taikhoan', capnhatTaikhoanRouter);
app.use('/taikhoan', capnhatTaikhoanXulyRouter);
app.use('/taikhoan', matkhauDoiRouter);
app.use('/taikhoan', matkhauDoiXulyRouter);

//--- Quản trị: Người dùng ---
app.use('/quanly', kiemTraQuyenQuanTri);
app.use('/quanly/taikhoan', quanlyNguoiDungRouter);
app.use('/quanly/taikhoan', quanlyThemNguoiDungRouter);
app.use('/quanly/taikhoan', quanlyThemNguoiDungXulyRouter);
app.use('/quanly/taikhoan', quanlyKhoaTaiKhoanXulyRouter);
app.use('/quanly/taikhoan', quanlyMoKhoaTaiKhoanXulyRouter);
app.use('/quanly/taikhoan', quanlyDatLaiMatKhauXulyRouter);
app.use('/quanly/taikhoan', quanlyChiTietNguoiDungRouter);
app.use('/quanly/taikhoan', quanlyChiTietNguoiDungXulyRouter);
app.use('/quanly/taikhoan', quanlyCapNhatNguoiDungRouter);
app.use('/quanly/taikhoan', quanlyCapNhatNguoiDungXulyRouter);

//--- Quản trị: Gói cước ---
app.use('/quanly', kiemTraQuyenQuanTri);
app.use('/quanly/goicuoc', goicuocRouter);
app.use('/quanly/goicuoc', goicuocThemXulyRouter);
app.use('/quanly/goicuoc', goicuocXoaXulyRouter);

//--- Quản trị: Tủ Splitter ---
app.use('/quanly', kiemTraQuyenQuanTri);
app.use('/quanly/splitter', splitterRouter);
app.use('/quanly/splitter', splitterThemXulyRouter);

//--- Quản trị: Điểm kết nối ---
app.use('/quanly', kiemTraQuyenQuanTri);
app.use('/quanly/vitri', vitriRouter);
app.use('/quanly/vitri', vitriThemXulyRouter);

// --- Báo cáo và giám sát ---
app.use('/baocao', baocaoSucoRouter);
app.use('/baocao', baocaoLapXulyRouter);
app.use('/baocao', baocaoHopDongXulyRouter);

//5. Khởi chạy Server
app.listen(port, () => {
    console.log(`Server đang chạy tại: http://localhost:${port}`);
});