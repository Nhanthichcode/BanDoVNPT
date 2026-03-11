const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');

const app = express();
const port = 3000;

//CẤU HÌNH HỆ THỐNG VÀ SESSION
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

//KẾT NỐI DATABASE VÀ KHAI BÁO MODEL
const uri = 'mongodb+srv://sa:admin123@vnpt-mapping.ep8txj8.mongodb.net/VNPT_Mapping?appName=VNPT-Mapping';
mongoose.connect(uri)
    .then(() => console.log('Đã kết nối MongoDB!'))
    .catch(err => console.log('Lỗi kết nối MongoDB:', err));

//MODEL: SPLITTER (TỦ CHIA QUANG / HỘP CÁP)
const splitterSchema = new mongoose.Schema({
    ten_splitter: { type: String, required: true }, // VD:Tủ cáp Long Xuyên 01
    loai_splitter: { type: String, enum: ['1:4', '1:16'], required: true },

    //SysID định danh trạm OLT mà nhánh này đang cắm vào (VD: AGG-LX-01)
    sys_id: { type: String, required: true },

    //Tọa độ của tủ cáp trên đường phố
    vi_tri: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true } // [Kinh độ, Vĩ độ]
    },

    //THIẾT KẾ PHÂN CẤP (HIERARCHY):
    //Nếu là 1:16, trường này sẽ lưu ID của Splitter 1:4 mà nó cắm vào.
    //Nếu là 1:4, trường này để null.
    splitter_cha_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Splitter', default: null },

    trang_thai: { type: String, default: 'Hoạt động' }
}, { collection: 'Splitter' });

//MODEL: ĐIỂM KẾT NỐI
const diemKetNoiSchema = new mongoose.Schema({
    ten_khach_hang: String,
    loai_khach_hang: String,
    dia_chi: String,

    //Tọa độ nhà khách hàng
    vi_tri: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number] }
    },
    //Tham chiếu đến bảng GoiCuoc trong SQL Server
    thong_tin_hop_dong: {
        goi_cuoc_id: Number,
        ngay_dang_ky: Date,
        thoi_gian_su_dung_thang: Number,
        ngay_het_han: Date
    },

    //HẠ TẦNG VIỄN THÔNG (PON & PPPoE)

    //Khách hàng đang cắm dây mạng vào Splitter 1:16 nào?
    splitter_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Splitter' },

    thong_tin_pppoe: {
        username: { type: String, required: true },
        password: { type: String, required: true }, //Trên thông tin sẽ hiện "******"

        //Thông số Circuit ID
        circuit_id: {
            rack: { type: String, required: true },
            shelf: { type: String, required: true },
            slot: { type: String, required: true },
            port: { type: String, required: true },
            vpi: { type: String, default: '0' },
            vci: { type: String, default: '33' } // VNPT thường dùng VPI/VCI là 0/33
        }
    },

    trang_thai_ket_noi: {
        mau_sac: String,
        cuong_do_tin_hieu: Number,
        do_tre_ping_ms: Number,
        lan_kiem_tra_cuoi: Date
    },
    nguoi_tao: String
}, { collection: 'DiemKetNoi' });

//Đăng ký Model để các file khác có thể gọi lại
mongoose.model('DiemKetNoi', diemKetNoiSchema);
mongoose.model('Splitter', splitterSchema);

//KẾT NỐI ROUTER
const indexRouter = require('./routes/index');
const vitriRouter = require('./routes/vitri');
const goicuocRouter = require('./routes/goicuoc');
const taikhoanRouter = require('./routes/taikhoan');
const splitterRouter = require('./routes/splitter');
const dangnhapRouter = require('./routes/dangnhap');
const dangnhapXulyRouter = require('./routes/dangnhap_xuly');
const dangxuatXulyRouter = require('./routes/dangxuat_xuly');
const capnhatTaikhoanRouter = require('./routes/capnhat_taikhoan');
const capnhatTaikhoanXulyRouter = require('./routes/capnhat_taikhoan_xuly');
const matkhauDoiRouter = require('./routes/matkhau_doi');
const matkhauDoiXulyRouter = require('./routes/matkhau_doi_xuly');
const quanlyNguoiDungRouter = require('./routes/quanly_nguoidung');
const quanlyThemNguoiDungRouter = require('./routes/quanly_them_nguoidung');
const quanlyThemNguoiDungXulyRouter = require('./routes/quanly_them_nguoidung_xuly');
const quanlyKhoaTaiKhoanXulyRouter = require('./routes/quanly_khoa_taikhoan_xuly');
const quanlyMoKhoaTaiKhoanXulyRouter = require('./routes/quanly_mokhoa_taikhoan_xuly');

// Khai báo tiền tố cho các đường dẫn
app.use('/', indexRouter);                  //Các trang chung
app.use('/quanly/vitri', vitriRouter);      //Phân hệ quản lý điểm kết nối
app.use('/quanly/goicuoc', goicuocRouter);  //Phân hệ quản lý gói cước
app.use('/taikhoan', taikhoanRouter);       //Phân hệ tài khoản cá nhân
app.use('/quanly/splitter', splitterRouter); //Phân hệ quản lý tủ Splitter
app.use('/', dangnhapRouter);           //Trang đăng nhập
app.use('/', dangnhapXulyRouter);       //Xử lý đăng nhập
app.use('/', dangxuatXulyRouter);       //Xử lý đăng xuất
app.use('/taikhoan', capnhatTaikhoanRouter);     //Giao diện cập nhật hồ sơ cá nhân
app.use('/taikhoan', capnhatTaikhoanXulyRouter);    //Xử lý cập nhật hồ sơ cá nhân
app.use('/taikhoan', matkhauDoiRouter);     //Giao diện đổi mật khẩu
app.use('/taikhoan', matkhauDoiXulyRouter);    //Xử lý đổi mật khẩu
app.use('/quanly/taikhoan', quanlyNguoiDungRouter);  //Phân hệ quản lý người dùng
app.use('/quanly/taikhoan', quanlyThemNguoiDungRouter); //Giao diện thêm người dùng mới
app.use('/quanly/taikhoan', quanlyThemNguoiDungXulyRouter); //Xử lý thêm người dùng mới
app.use('/quanly/taikhoan', quanlyKhoaTaiKhoanXulyRouter); //Xử lý khóa tài khoản
app.use('/quanly/taikhoan', quanlyMoKhoaTaiKhoanXulyRouter); //Xử lý mở khóa tài khoản

//KHỞI CHẠY SERVER
app.listen(port, () => {
    console.log(`Server đang chạy tại: http://localhost:${port}`);
});