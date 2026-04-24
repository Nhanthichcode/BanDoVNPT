const express = require('express');
const router = express.Router();
const sql = require('mssql');
const hienThiLoiHeThong = require('./xuly_loi');
const dbManager = require('../database');//thêm cái này
const {kiemTraDangNhap, kiemTraQuyenQuanTri, kiemTraQuyenAdmin} = require('../middleware/auth'); // Sử dụng middleware đã tạo

//Route: Hiển thị danh sách người dùng
router.get('/', kiemTraDangNhap, kiemTraQuyenQuanTri, async (req, res) => {
    try {
        const pool = await dbManager.getSQLPool();

        //Truy vấn lấy toàn bộ tài khoản cùng tên vai trò, sắp xếp theo vai trò và tên
        let result = await pool.request().query(`
            SELECT 
                tk.id, tk.ten_dang_nhap, tk.ho_ten, tk.so_dien_thoai, 
                tk.email_lien_he, tk.trang_thai, tk.ly_do_khoa, tk.vai_tro_id, 
                vt.ten_vai_tro 
            FROM TaiKhoan tk 
            LEFT JOIN VaiTro vt ON tk.vai_tro_id = vt.id
            ORDER BY tk.vai_tro_id ASC, tk.ho_ten ASC
        `);

        res.render('pages/taikhoan_nguoidung', {
            title: 'Quản lý người dùng',
            user: req.session.user,
            danhSachTaiKhoan: result.recordset,
            activePage: 'taikhoan'
        });
    } catch (error) {
        console.error("Lỗi tải danh sách tài khoản:", error);
        hienThiLoiHeThong(req, res);
    }
});

//Route: Trang hồ sơ cá nhân
router.get('/ho-so', kiemTraDangNhap, async (req, res) => {
    try {
        const pool = await dbManager.getSQLPool();
        let result = await pool.request()
            .input('tenDangNhap', sql.VarChar, req.session.user.ten_dang_nhap)
            .query(`SELECT tk.*, vt.ten_vai_tro FROM TaiKhoan tk LEFT JOIN VaiTro vt ON tk.vai_tro_id = vt.id WHERE tk.ten_dang_nhap = @tenDangNhap`);

        if (result.recordset.length > 0) {
            res.render('pages/taikhoan', { title: 'Hồ sơ cá nhân', user: req.session.user, thongTin: result.recordset[0], activePage: 'hoso' });
        } else {
            res.status(404).send("Không tìm thấy thông tin tài khoản.");
        }
    } catch (error) {
        console.error("Lỗi:", error);
        hienThiLoiHeThong(req, res);
    }
});

//Route: Hiển thị giao diện cập nhật hồ sơ
router.get('/cap-nhat', kiemTraDangNhap, async (req, res) => {
    try {
        const pool = await dbManager.getSQLPool();
        let result = await pool.request()
            .input('tenDangNhap', sql.VarChar, req.session.user.ten_dang_nhap)
            .query(`SELECT * FROM TaiKhoan WHERE ten_dang_nhap = @tenDangNhap`);

        if (result.recordset.length > 0) {
            res.render('pages/taikhoan_nguoidung_capnhat_hoso', { 
                title: 'Cập nhật hồ sơ', 
                user: req.session.user,
                thongTin: result.recordset[0],
                activePage: 'capnhat_taikhoan'
            });
        } else {
            res.redirect('/');
        }
    } catch (error) {
        console.error("Lỗi lấy dữ liệu cập nhật:", error);
        hienThiLoiHeThong(req, res);
    }
});
//Route: Xử lý lưu thông tin hồ sơ vào SQL Server
router.post('/cap-nhat', kiemTraDangNhap, async (req, res) => {
    try {
        const { ho_ten, so_dien_thoai, email_lien_he, dia_chi } = req.body;
        const tenDangNhap = req.session.user.ten_dang_nhap;

        const pool = await dbManager.getSQLPool();
        await pool.request()
            .input('ho_ten', sql.NVarChar, ho_ten)
            .input('so_dien_thoai', sql.VarChar, so_dien_thoai)
            .input('email_lien_he', sql.VarChar, email_lien_he || '')
            .input('dia_chi', sql.NVarChar, dia_chi || '')
            .input('ten_dang_nhap', sql.VarChar, tenDangNhap)
            .query(`
                UPDATE TaiKhoan 
                SET ho_ten = @ho_ten, 
                    so_dien_thoai = @so_dien_thoai, 
                    email_lien_he = @email_lien_he, 
                    dia_chi = @dia_chi 
                WHERE ten_dang_nhap = @ten_dang_nhap
            `);

        //Cập nhật lại session
        req.session.user.ho_ten = ho_ten;
        req.session.user.so_dien_thoai = so_dien_thoai;
        req.session.user.email_lien_he = email_lien_he;
        req.session.user.dia_chi = dia_chi;

        res.redirect('/taikhoan/ho-so');

    } catch (error) {
        console.error("Lỗi cập nhật hồ sơ:", error);
        hienThiLoiHeThong(req, res, 'Không thể lưu hồ sơ cập nhật. Vui lòng thử lại sau!');
    }
});

//Route: Hiển thị giao diện chi tiết tài khoản
router.get('/chi-tiet/:id', kiemTraDangNhap, kiemTraQuyenQuanTri, async (req, res) => {
    try {
        let pool = await dbManager.getSQLPool();
        let result = await pool.request()
            .input('user', sql.VarChar, req.params.id)
            .query(`
                SELECT tk.*, vt.ten_vai_tro 
                FROM TaiKhoan tk 
                LEFT JOIN VaiTro vt ON tk.vai_tro_id = vt.id 
                WHERE tk.id = @user
            `);

        if (result.recordset.length === 0) return hienThiLoiHeThong(req, res, "Không tìm thấy người dùng này!");

        res.render('pages/taikhoan_nguoidung_chitiet', {
            title: 'Chi tiết tài khoản',
            user: req.session.user,
            taiKhoanChiTiet: result.recordset[0],
            showSensitive: false //Mặc định khóa thông tin nhạy cảm
        });

    } catch (error) { hienThiLoiHeThong(req, res); }
});
//Route: Xử lý xác thực bảo mật
router.post('/chi-tiet', kiemTraDangNhap, kiemTraQuyenQuanTri, async (req, res) => {
    try {
        const { ten_dang_nhap_muc_tieu, mat_khau_admin } = req.body;
        const adminUser = req.session.user.ten_dang_nhap;

        let pool = await sql.connect(sqlConfig);

        //Kiểm tra mật khẩu Admin
        let checkPass = await pool.request()
            .input('admin', sql.VarChar, adminUser)
            .input('pass', sql.VarChar, mat_khau_admin)
            .query('SELECT ten_dang_nhap FROM TaiKhoan WHERE ten_dang_nhap = @admin AND mat_khau = @pass');

        //Nếu sai thì sẽ trả Admin về trang Quản lý tài khoản mà không báo lý do cụ thể (tránh lộ thông tin người dùng và mật khẩu)
        if (checkPass.recordset.length === 0) {
            return res.redirect('/taikhoan');
        }

        //Nếu đúng thì xem được thông tin tài khoản
        let result = await pool.request()
            .input('user', sql.VarChar, ten_dang_nhap_muc_tieu)
            .query(`
                SELECT tk.*, vt.ten_vai_tro 
                FROM TaiKhoan tk 
                LEFT JOIN VaiTro vt ON tk.vai_tro_id = vt.id 
                WHERE tk.ten_dang_nhap = @user
            `);

        res.render('pages/taikhoan_nguoidung_chitiet', {
            title: 'Chi tiết tài khoản',
            user: req.session.user,
            taiKhoanChiTiet: result.recordset[0],
            showSensitive: true //Bật thông tin nhạy cảm
        });

    } catch (error) { hienThiLoiHeThong(req, res); }
});

//Route: Hiển thị trang thêm người dùng
router.get('/them', kiemTraDangNhap, kiemTraQuyenQuanTri, (req, res) => {
    res.render('pages/taikhoan_nguoidung_them', {
        title: 'Thêm người dùng mới',
        user: req.session.user
    });
});
//Route: Xử lý thêm tài khoản vào SQL Server
router.post('/them', kiemTraDangNhap, kiemTraQuyenQuanTri, async (req, res) => {
    try {
        const { ten_dang_nhap, mat_khau, ho_ten, so_dien_thoai, email_lien_he, dia_chi, vai_tro_id, trang_thai } = req.body;

        const pool = await dbManager.getSQLPool();

        //Kiểm tra xem tên đăng nhập có bị trùng không
        let checkExist = await pool.request()
            .input('user', sql.VarChar, ten_dang_nhap)
            .query('SELECT ten_dang_nhap FROM TaiKhoan WHERE ten_dang_nhap = @user');

        if (checkExist.recordset.length > 0) {
            return hienThiLoiHeThong(req, res, `Tên đăng nhập "${ten_dang_nhap}" đã được sử dụng. Vui lòng chọn tên khác!`);
        }

        //Lưu vào cơ sở dữ liệu
        await pool.request()
            .input('ten_dang_nhap', sql.VarChar, ten_dang_nhap)
            .input('mat_khau', sql.VarChar, mat_khau)
            .input('ho_ten', sql.NVarChar, ho_ten)
            .input('so_dien_thoai', sql.VarChar, so_dien_thoai)
            .input('email_lien_he', sql.VarChar, email_lien_he || '')
            .input('dia_chi', sql.NVarChar, dia_chi || '')
            .input('vai_tro_id', sql.Int, vai_tro_id)
            .input('trang_thai', sql.Int, trang_thai)
            .query(`
                INSERT INTO TaiKhoan (ten_dang_nhap, mat_khau, ho_ten, so_dien_thoai, email_lien_he, dia_chi, vai_tro_id, trang_thai)
                VALUES (@ten_dang_nhap, @mat_khau, @ho_ten, @so_dien_thoai, @email_lien_he, @dia_chi, @vai_tro_id, @trang_thai)
            `);

        //Lưu và trở về trang danh sách
        res.redirect('/taikhoan');

    } catch (error) {
        console.error("Lỗi thêm tài khoản:", error);
        hienThiLoiHeThong(req, res, "Không thể thêm tài khoản do lỗi Server.");
    }
});

//Route: Lấy dữ liệu và hiển thị form sửa
router.get('/sua/:id', kiemTraDangNhap, kiemTraQuyenQuanTri, async (req, res) => {
    try {
        const pool = await dbManager.getSQLPool();
        let result = await pool.request()
            .input('user', sql.VarChar, req.params.id)
            .query('SELECT * FROM TaiKhoan WHERE id = @user');

        if (result.recordset.length === 0) {
            return hienThiLoiHeThong(req, res, "Không tìm thấy tài khoản cần sửa!");
        }

        res.render('pages/taikhoan_nguoidung_capnhat_nguoidung', {
            title: 'Cập nhật tài khoản',
            user: req.session.user,
            taiKhoanSua: result.recordset[0]
        });

    } catch (error) {
        hienThiLoiHeThong(req, res);
    }
});
//Route: Lưu dữ liệu vào CSDL
router.post('/sua', kiemTraDangNhap, kiemTraQuyenQuanTri, async (req, res) => {
    try {
        const { ten_dang_nhap, ho_ten, so_dien_thoai, email_lien_he, dia_chi, vai_tro_id } = req.body;
        
        const nguoiThucHien = req.session.user.id;
        let vaiTroMoi = vai_tro_id;
        
        if (ten_dang_nhap === nguoiThucHien) {
            vaiTroMoi = req.session.user.vai_tro_id; 
        }

        const pool = await dbManager.getSQLPool();

        await pool.request()
            .input('ho_ten', sql.NVarChar, ho_ten)
            .input('so_dien_thoai', sql.VarChar, so_dien_thoai)
            .input('email_lien_he', sql.VarChar, email_lien_he || '')
            .input('dia_chi', sql.NVarChar, dia_chi || '')
            .input('vai_tro_id', sql.Int, vaiTroMoi)
            .input('user', sql.VarChar, ten_dang_nhap)
            .query(`
                UPDATE TaiKhoan 
                SET ho_ten = @ho_ten, 
                    so_dien_thoai = @so_dien_thoai, 
                    email_lien_he = @email_lien_he, 
                    dia_chi = @dia_chi, 
                    vai_tro_id = @vai_tro_id
                WHERE ten_dang_nhap = @user
            `);

        res.redirect('/taikhoan');

    } catch (error) {
        console.error("Lỗi cập nhật người dùng:", error);
        hienThiLoiHeThong(req, res, "Đã xảy ra lỗi khi lưu thông tin người dùng!");
    }
});

//Route: Xử lý khóa tài khoản
router.post('/khoa', kiemTraDangNhap, kiemTraQuyenQuanTri, async (req, res) => {
    try {
        const { ten_dang_nhap_bi_khoa, ly_do_khoa, mat_khau_xac_nhan } = req.body;
        const nguoiThucHien = req.session.user.ten_dang_nhap;

        //Không tự khóa chính mình
        if (ten_dang_nhap_bi_khoa === nguoiThucHien) {
            return hienThiLoiHeThong(req, res, "Lỗi bảo mật: Bạn không thể tự khóa tài khoản của chính mình!");
        }

        const pool = await dbManager.getSQLPool();

        //Kiểm tra mật khẩu của Admin
        let checkPass = await pool.request()
            .input('userThucHien', sql.VarChar, nguoiThucHien)
            .input('passXacNhan', sql.VarChar, mat_khau_xac_nhan)
            .query('SELECT ten_dang_nhap FROM TaiKhoan WHERE ten_dang_nhap = @userThucHien AND mat_khau = @passXacNhan');

        if (checkPass.recordset.length === 0) {
            //Mật khẩu xác nhận sai
            return hienThiLoiHeThong(req, res, "Thao tác thất bại: Mật khẩu xác nhận của bạn không chính xác!");
        }

        //Mật khẩu xác nhận đúng + Ghi thêm tag tên người khóa vào đầu lý do để dễ tra cứu về sau
        const lyDoDayDu = `[Bị khóa bởi ${nguoiThucHien}]: ${ly_do_khoa}`;

        await pool.request()
            .input('lyDo', sql.NVarChar, lyDoDayDu)
            .input('userBiKhoa', sql.VarChar, ten_dang_nhap_bi_khoa)
            .query(`
                UPDATE TaiKhoan 
                SET trang_thai = 0, ly_do_khoa = @lyDo 
                WHERE ten_dang_nhap = @userBiKhoa
            `);
        res.redirect('/taikhoan');

    } catch (error) {
        console.error("Lỗi khóa tài khoản:", error);
        hienThiLoiHeThong(req, res, "Đã xảy ra lỗi khi cố gắng khóa tài khoản này.");
    }
});

//Route: Xử lý mở khóa tài khoản
router.post('/mo-khoa', kiemTraDangNhap, kiemTraQuyenQuanTri, async (req, res) => {
    try {
        const { ten_dang_nhap_duoc_mo, mat_khau_xac_nhan } = req.body;
        const nguoiThucHien = req.session.user.ten_dang_nhap;

        let pool = await dbManager.getSQLPool();

        //Kiểm tra mật khẩu của Admin
        let checkPass = await pool.request()
            .input('userThucHien', sql.VarChar, nguoiThucHien)
            .input('passXacNhan', sql.VarChar, mat_khau_xac_nhan)
            .query('SELECT ten_dang_nhap FROM TaiKhoan WHERE ten_dang_nhap = @userThucHien AND mat_khau = @passXacNhan');

        if (checkPass.recordset.length === 0) {
            return hienThiLoiHeThong(req, res, "Thao tác thất bại: Mật khẩu xác nhận của bạn không chính xác!");
        }

        //Mật khẩu đúng thì mở khóa và xóa lý do khóa
        await pool.request()
            .input('userDuocMo', sql.VarChar, ten_dang_nhap_duoc_mo)
            .query(`
                UPDATE TaiKhoan 
                SET trang_thai = 1, ly_do_khoa = NULL 
                WHERE ten_dang_nhap = @userDuocMo
            `);

        res.redirect('/taikhoan');

    } catch (error) {
        console.error("Lỗi mở khóa tài khoản:", error);
        hienThiLoiHeThong(req, res, "Đã xảy ra lỗi khi cố gắng mở khóa tài khoản này.");
    }
});

//Route: Xử lý đặt lại mật khẩu
router.post('/dat-lai-mat-khau/:id', kiemTraDangNhap, kiemTraQuyenAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        if(!kiemTraQuyenAdmin) {
            return hienThiLoiHeThong(req, res, "Lỗi bảo mật: Chỉ dành cho quản trị viên!");
        }
        const pool = await dbManager.getSQLPool();

        //Mật khẩu đúng thì đổi mật khẩu mục tiêu về 'abc123'
        await pool.request()
            .input('userDatLai', sql.Int, userId)
            .query(`
                UPDATE TaiKhoan 
                SET mat_khau = 'abc123' 
                WHERE id = @userDatLai
            `);

        res.redirect('/taikhoan');

    } catch (error) {
        console.error("Lỗi đặt lại mật khẩu:", error);
        hienThiLoiHeThong(req, res, "Đã xảy ra lỗi khi cố gắng đặt lại mật khẩu.");
    }
});

//Route: Hiển thị form kiểm tra danh tính
router.get('/doi-mat-khau', kiemTraDangNhap, (req, res) => {
    res.render('pages/taikhoan_nguoidung_doi_mat_khau', { 
        title: 'Cập nhật mật khẩu', 
        user: req.session.user,
        step: 1,
        error: null,
        activePage: 'matkhau_doi'
    });
});
//Lưu mật khẩu mới và đăng xuất
router.post('/doi-mat-khau', kiemTraDangNhap, async (req, res) => {
    const { mat_khau_cu, mat_khau_moi, nhap_lai_mat_khau_moi } = req.body;
    const userId = req.session.user.id;

    // Kiểm tra dữ liệu đầu vào
    if (!mat_khau_cu || !mat_khau_moi || !nhap_lai_mat_khau_moi) {
        return res.render('pages/taikhoan_nguoidung_doi_mat_khau', {
            title: 'Cập nhật mật khẩu',
            user: req.session.user,
            error: 'Vui lòng điền đầy đủ thông tin!',
            activePage: 'taikhoan'
        });
    }

    if (mat_khau_moi !== nhap_lai_mat_khau_moi) {
        return res.render('pages/taikhoan_nguoidung_doi_mat_khau', {
            title: 'Cập nhật mật khẩu',
            user: req.session.user,
            error: 'Mật khẩu mới và xác nhận mật khẩu không khớp!',
            activePage: 'taikhoan'
        });
    }

    if (mat_khau_moi.length < 6) {
        return res.render('pages/taikhoan_nguoidung_doi_mat_khau', {
            title: 'Cập nhật mật khẩu',
            user: req.session.user,
            error: 'Mật khẩu mới phải có ít nhất 6 ký tự!',
            activePage: 'taikhoan'
        });
    }

    try {
        const pool = await dbManager.getSQLPool();
        // Kiểm tra mật khẩu cũ có đúng không
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query('SELECT mat_khau FROM TaiKhoan WHERE id = @userId');

        if (result.recordset.length === 0) {
            return res.render('pages/taikhoan_nguoidung_doi_mat_khau', {
                title: 'Cập nhật mật khẩu',
                user: req.session.user,
                error: 'Tài khoản không tồn tại!',
                activePage: 'taikhoan'
            });
        }

        const matKhauCuDB = result.recordset[0].mat_khau;
        if (mat_khau_cu !== matKhauCuDB) {
            return res.render('pages/taikhoan_nguoidung_doi_mat_khau', {
                title: 'Cập nhật mật khẩu',
                user: req.session.user,
                error: 'Mật khẩu hiện tại không đúng!',
                activePage: 'taikhoan'
            });
        }

        // Cập nhật mật khẩu mới
        await pool.request()
            .input('userId', sql.Int, userId)
            .input('newPass', sql.VarChar, mat_khau_moi)
            .query('UPDATE TaiKhoan SET mat_khau = @newPass WHERE id = @userId');

        req.session.success = 'Đổi mật khẩu thành công!';
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Lỗi đổi mật khẩu:', error);
        res.render('pages/taikhoan_nguoidung_doi_mat_khau', {
            title: 'Cập nhật mật khẩu',
            user: req.session.user,
            error: 'Lỗi hệ thống, vui lòng thử lại sau!',
            activePage: 'taikhoan'
        });
    }
});


module.exports = router;