const express = require('express');
const router = express.Router();
const sql = require('mssql');
const dbManager = require('../database');//thêm cái này

//Cấu hình SQL Server
// const sqlConfig = {
//     user: 'sa', password: 'sql2019', database: 'VNPT_BanDo_Admin', server: 'localhost', port: 1433,
//     options: { encrypt: false, trustServerCertificate: true }
// };

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
            res.render('pages/dangnhap', { 
                error: 'Tên đăng nhập hoặc mật khẩu không chính xác!',
                oldUsername: username 
            });
        }

    } catch (err) {
        // Nếu có lỗi mạng, lỗi database, hoặc lỗi code bên trong try sẽ chạy vào đây
        console.error('Lỗi khi xử lý đăng nhập:', err);
        res.status(500).send('Đã xảy ra lỗi hệ thống khi đăng nhập.');
    }
});

module.exports = router;