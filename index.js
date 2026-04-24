const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const dbManager = require('./database');
const layouts = require('express-ejs-layouts');

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
app.use(layouts);
app.set('layout', 'layouts/layout'); // đường dẫn tới layout.ejs
app.use(session({
    secret: 'vnpt-secret-key-2026',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 8 }
}));

// Middleware gán user vào res.locals
app.use((req, res, next) => {
  // Nếu bạn dùng session để lưu user
    if (req.session && req.session.user) {
    res.locals.user = req.session.user;
    } else {
    res.locals.user = null;  // hoặc {} để tránh lỗi
    }
next();
});

//2. Kết nối MongoDB và khai báo Models
async function startDatabases() {
    try {
        await dbManager.connectMongo();
        await dbManager.connectSQL();
        
        // Khai báo models SAU KHI Mongoose kết nối thành công
        require('./models/Splitter');
        require('./models/DiemKetNoi');
    } catch (err) {
        console.error('❌ Không thể khởi động database. Dừng server!', err);
        process.exit(1); // Dừng Node.js nếu DB chết
    }
}
startDatabases();
require('./models/Splitter');
require('./models/DiemKetNoi');

//3. Khai báo Router
//--- Hệ thống chung & Xác thực ---
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');

//--- Hồ sơ cá nhân ---
const taikhoanRouter = require('./routes/taikhoan');

//--- Quản trị: Gói cước ---
const goicuocRouter = require('./routes/goicuoc');


//--- Quản trị: Tủ Splitter ---
const splitterRouter = require('./routes/splitter');

//--- Quản trị: Điểm kết nối ---
const diemketnoiRouter = require('./routes/diemketnoi');

// --- Báo cáo và giám sát ---
const baocaoRouter = require('./routes/baocao');

const { kiemTraDangNhap } = require('./middleware/auth');

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
app.use('/', authRouter);

//Kiểm tra quyền quản trị trước khi vào các route quản lý
app.use('/taikhoan', kiemTraDangNhap, taikhoanRouter);

//--- Quản trị: Tủ Splitter ---
app.use('/splitter', splitterRouter);

//--- Quản trị: Gói cước ---
app.use('/goicuoc', goicuocRouter);

//--- Quản trị: Điểm kết nối ---
app.use('/diemketnoi', diemketnoiRouter);

// --- Báo cáo và giám sát ---
app.use('/baocao', baocaoRouter);

//5. Khởi chạy Server
app.listen(port, () => {
    console.log(`Server đang chạy tại: http://localhost:${port}`);
});