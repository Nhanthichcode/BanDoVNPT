const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const sql = require('mssql');
const dbManager = require('../database');

//Route: Hiện trang đăng nhập
router.get('/dangnhap', (req, res) => {
    if (req.session.user) return res.redirect('/');
    res.render('pages/dangnhap', { title: "Đăng nhập - Hệ thống giám sát mạng lưới VNPT", layout: false,
        error: null, 
        oldUsername: ''  });
});

//Route: Xử lý đăng nhập
router.post('/dangnhap', async (req, res) => {
    const { username, password } = req.body;
    
    // Kiểm tra rỗng
    if (!username || !password) {
        return res.render('pages/dangnhap', { 
            error: 'Vui lòng nhập đầy đủ!', 
            oldUsername: username || '' 
        });
    }

    try {
        // SỬA 1: Đổi thành 'pool' và thêm 'await'
        const pool = await dbManager.getSQLPool();

        const result = await pool.request()
            .input('username', sql.VarChar, username)
            .input('password', sql.VarChar, password)
            .query(`
                SELECT id, ho_ten, ten_dang_nhap, vai_tro_id, trang_thai, ly_do_khoa 
                FROM TaiKhoan 
                WHERE ten_dang_nhap = @username AND mat_khau = @password
            `);

        // SỬA 2 & 3: Di chuyển toàn bộ logic kiểm tra vào BÊN TRONG khối try
        if (result.recordset.length > 0) {
            const user = result.recordset[0];

            // Kiểm tra xem tài khoản có bị khóa không (trang_thai = 0)
            if (user.trang_thai === 0) {
                return res.render('pages/dangnhap', { 
                    error: `Tài khoản của bạn đã bị khóa. Lý do: ${user.ly_do_khoa || 'Không có lý do cụ thể.'}` 
                });
            }

            // Đăng nhập thành công -> Lưu thông tin vào session
            req.session.user = {
                id: user.id,
                ho_ten: user.ho_ten,
                ten_dang_nhap: user.ten_dang_nhap,
                vai_tro_id: user.vai_tro_id
            };

            // Chuyển hướng dựa theo vai trò
            if (user.vai_tro_id === 1 || user.vai_tro_id === 2) {
                res.redirect('/dashboard'); // Quản trị viên & Quản lý
            } else {
                res.redirect('/dashboard'); // Nhân viên hoặc người dùng bình thường
            }

        } else {
            // Đăng nhập thất bại
            res.redirect('/dangnhap');
        }

    } catch (err) {
        // Nếu có lỗi mạng, lỗi database, hoặc lỗi code bên trong try sẽ chạy vào đây
        console.error('Lỗi khi xử lý đăng nhập:', err);
        res.status(500).send('Đã xảy ra lỗi hệ thống khi đăng nhập.');
    }
});

// Route: Xử lý đăng xuất//Route: Đăng xuất
router.get('/dangxuat', (req, res) => {
    req.session.destroy();
    res.redirect('/dangnhap');
});

module.exports = router;