const express = require('express');
const router = express.Router();
const sql = require('mssql');
const hienThiLoiHeThong = require('./xuly_loi');
const dbManager = require('../database');//thêm cái này
// const sqlConfig = {
//     user: 'sa', password: 'sql2019', database: 'VNPT_BanDo_Admin', server: 'localhost', port: 1433,
//     options: { encrypt: false, trustServerCertificate: true }
// };

const kiemTraDangNhap = (req, res, next) => {
    if (req.session.user) next(); else res.redirect('/dangnhap');
};

//Xác thực mật khẩu cũ
router.post('/matkhau_doi_xacthuc', kiemTraDangNhap, async (req, res) => {
    try {
        const { ten_dang_nhap, mat_khau_cu } = req.body;
        
        const pool = await dbManager.getSQLPool();
        let result = await pool.request()
            .input('user', sql.VarChar, ten_dang_nhap)
            .input('pass', sql.VarChar, mat_khau_cu)
            .query('SELECT * FROM TaiKhoan WHERE ten_dang_nhap = @user AND mat_khau = @pass AND trang_thai = 1');

        if (result.recordset.length > 0) {
            //Đúng mật khẩu
            res.render('pages/matkhau_doi', {
                title: 'Cập nhật mật khẩu',
                user: req.session.user,
                step: 2, 
                error: null,
                tenDangNhapXacThuc: ten_dang_nhap
            });
        } else {
            //Sai mật khẩu
            res.render('pages/matkhau_doi', {
                title: 'Cập nhật mật khẩu',
                user: req.session.user,
                step: 1,                
                error: 'Tên đăng nhập hoặc mật khẩu hiện tại không chính xác!'
            });
        }
    } catch (error) {
        hienThiLoiHeThong(req, res);
    }
});

//Lưu mật khẩu mới và đăng xuất
router.post('/matkhau_doi_xuly', kiemTraDangNhap, async (req, res) => {
    try {
        const { mat_khau_moi, nhap_lai_mat_khau_moi } = req.body;
        const tenDangNhap = req.session.user.ten_dang_nhap; //Chỉ đổi mật khẩu của chính người đang đăng nhập

        //Kiểm tra khớp mật khẩu
        if (mat_khau_moi !== nhap_lai_mat_khau_moi) {
            return res.render('pages/matkhau_doi', {
                title: 'Cập nhật mật khẩu', user: req.session.user, step: 2, tenDangNhapXacThuc: tenDangNhap,
                error: 'Mật khẩu nhập lại không khớp. Vui lòng thử lại!'
            });
        }

        //Cập nhật Database
        let pool = await sql.connect(sqlConfig);
        await pool.request()
            .input('newPass', sql.VarChar, mat_khau_moi)
            .input('user', sql.VarChar, tenDangNhap)
            .query('UPDATE TaiKhoan SET mat_khau = @newPass WHERE ten_dang_nhap = @user');

        //Thành công thì đăng xuất tài khoản để người dùng đăng nhập lại
        req.session.destroy();
        res.redirect('/dangnhap');

    } catch (error) {
        hienThiLoiHeThong(req, res);
    }
});

module.exports = router;