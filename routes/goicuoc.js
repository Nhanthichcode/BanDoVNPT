const express = require('express');
const router = express.Router();
const sql = require('mssql');
const hienThiLoiHeThong = require('./xuly_loi');
const dbManager = require('../database');//thêm cái này
const {kiemTraDangNhap, kiemTraQuyenQuanTri} = require('../middleware/auth'); // Sử dụng middleware đã tạo


//Route: Trang quản lý gói cước
router.get('/', kiemTraDangNhap, async (req, res) => {
    try {
        const pool = await dbManager.getSQLPool();
        const limit = 20;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;

        const loaiFilter = req.query.loai || 'Tất cả';
        let whereClause = '';
        if (loaiFilter !== 'Tất cả') whereClause = "WHERE loai_hinh_thue_bao LIKE @loai";

        let countReq = pool.request();
        if (loaiFilter !== 'Tất cả') countReq.input('loai', sql.NVarChar, `%${loaiFilter}%`);
        let countResult = await countReq.query(`SELECT COUNT(*) AS total FROM GoiCuoc ${whereClause}`);

        const totalRecords = countResult.recordset[0].total;
        const totalPages = Math.ceil(totalRecords / limit);

        let dataReq = pool.request();
        dataReq.input('offset', sql.Int, offset).input('limit', sql.Int, limit);
        if (loaiFilter !== 'Tất cả') dataReq.input('loai', sql.NVarChar, `%${loaiFilter}%`);

        let result = await dataReq.query(`
            SELECT * FROM GoiCuoc ${whereClause} ORDER BY id ASC 
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `);

        res.render('pages/goicuoc', { title: 'Quản lý gói cước', user: req.session.user, danhSachGoiCuoc: result.recordset, currentPage: page, totalPages: totalPages, loaiHienTai: loaiFilter, activePage: 'goicuoc' });
    }  catch (error) {
        console.error("Lỗi Server:", error);
        hienThiLoiHeThong(req, res);
    }
});

//Route: Xử lý thêm gói cước mới
router.post('/them', kiemTraDangNhap, kiemTraQuyenQuanTri, async (req, res) => {
    try {
        const { ten_goi_cuoc, loai_hinh_thue_bao } = req.body;
        
        const pool = await dbManager.getSQLPool();
        await pool.request()
            .input('ten', sql.NVarChar, ten_goi_cuoc)
            .input('loai', sql.NVarChar, loai_hinh_thue_bao)
            .query(`INSERT INTO GoiCuoc (ten_goi_cuoc, loai_hinh_thue_bao) VALUES (@ten, @loai)`);
            
        res.redirect('/goicuoc');
    } catch (err) {
        console.error("Lỗi thêm gói cước:", err);
        hienThiLoiHeThong(req, res);
    }
});

//Route: Xử lý xóa gói cước
router.post('/xoa', kiemTraDangNhap, kiemTraQuyenQuanTri, async (req, res) => {
    try {
        const idCanXoa = req.body.id;

        //Xóa gói cước khỏi Database
        const pool = await dbManager.getSQLPool();
        await pool.request()
            .input('id', sql.Int, idCanXoa)
            .query('DELETE FROM GoiCuoc WHERE id = @id');
        res.redirect('/goicuoc');

    } catch (error) {
        console.error("Lỗi xóa gói cước:", error);
        hienThiLoiHeThong(req, res, "Không thể xóa gói cước này vì có thể nó đang được sử dụng ở Điểm kết nối.");
    }
});

module.exports = router;