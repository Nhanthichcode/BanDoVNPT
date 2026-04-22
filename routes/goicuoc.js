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

module.exports = router;