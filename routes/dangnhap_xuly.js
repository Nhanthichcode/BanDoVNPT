const express = require('express');
const router = express.Router();
const sql = require('mssql');

//Cấu hình SQL Server
const { sqlConfig } = require('../database');
//Route: Xử lý đăng nhập
router.post('/dangnhap', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.render('dangnhap', { error: 'Vui lòng nhập đầy đủ!', oldUsername: username || '' });

    try {
        let pool = await sql.connect(sqlConfig);
        let result = await pool.request()
            .input('user', sql.VarChar, username).input('pass', sql.VarChar, password)
            .query('SELECT * FROM TaiKhoan WHERE ten_dang_nhap = @user AND mat_khau = @pass AND trang_thai = 1');

        if (result.recordset.length > 0) {
            req.session.user = result.recordset[0];
            res.redirect('/');
        } else {
            res.render('dangnhap', { error: 'Tên đăng nhập hoặc mật khẩu không đúng!', oldUsername: username });
        }
    } catch (err) {
        res.render('dangnhap', { error: 'Lỗi hệ thống cơ sở dữ liệu.', oldUsername: username });
    }
});

module.exports = router;