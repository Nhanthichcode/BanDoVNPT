CREATE DATABASE VNPT_BanDo_Admin;
USE VNPT_BanDo_Admin;

-- 1. Phân quyền
CREATE TABLE VaiTro (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ten_vai_tro NVARCHAR(50) NOT NULL
);

-- Thêm vai trò
INSERT INTO VaiTro (ten_vai_tro) VALUES (N'Quản trị viên'), (N'Quản lý'), (N'Nhân viên');

-- 2. Người dùng
CREATE TABLE TaiKhoan (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ho_ten NVARCHAR(100) NOT NULL,
    so_dien_thoai VARCHAR(15) NOT NULL, 
    email_lien_he VARCHAR(100) NULL,
    dia_chi NVARCHAR(255) NULL,
    ten_dang_nhap VARCHAR(50) UNIQUE NOT NULL,
    mat_khau VARCHAR(255) NOT NULL,
    vai_tro_id INT,
    trang_thai TINYINT DEFAULT 1, -- 1: Hoạt động, 0: Bị khóa
    FOREIGN KEY (vai_tro_id) REFERENCES VaiTro(id),
    ly_do_khoa NVARCHAR(500)
);
-- Thêm tài khoản
INSERT INTO TaiKhoan (ten_dang_nhap, mat_khau, ho_ten, so_dien_thoai, dia_chi, vai_tro_id) 
VALUES ('admin_phong', '123456', N'Đàm Thanh Phong', '0748119333', N'14AB Đặng Dung, Phường Long Xuyên', 1);
INSERT INTO TaiKhoan (ten_dang_nhap, mat_khau, ho_ten, so_dien_thoai, dia_chi, vai_tro_id) 
VALUES ('mane_phong', '123456', N'Đàm Thanh Phong', '0748119212', N'1 Đặng Dung, Phường Mỹ Thới', 2);
INSERT INTO TaiKhoan (ten_dang_nhap, mat_khau, ho_ten, so_dien_thoai, dia_chi, vai_tro_id) 
VALUES ('staff_phong', '123456', N'Đàm Thanh Phong', '0748119223', N'14AB Đặng Dung, Phường Bình Đức', 3);
-- 3. Gói cước
CREATE TABLE GoiCuoc (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ten_goi_cuoc NVARCHAR(100) NOT NULL,
    loai_hinh_thue_bao NVARCHAR(50) NOT NULL
);

-- 4. Báo cáo sự cố
CREATE TABLE BaoCaoSuCo (
    id INT IDENTITY(1,1) PRIMARY KEY,
    diem_ket_noi_id VARCHAR(50) NOT NULL, 
    nguoi_tao_id INT FOREIGN KEY REFERENCES TaiKhoan(id), 
    loai_su_co NVARCHAR(100) NOT NULL, 
    mo_ta_ban_dau NVARCHAR(500) NULL,
    thoi_gian_tao DATETIME DEFAULT GETDATE(),
    trang_thai_xu_ly TINYINT DEFAULT 0 
);
-- 5. Chi tiết báo cáo
CREATE TABLE ChiTietBaoCao (
    id INT IDENTITY(1,1) PRIMARY KEY,
    bao_cao_id INT FOREIGN KEY REFERENCES BaoCaoSuCo(id) ON DELETE CASCADE,
    nguoi_cap_nhat_id INT FOREIGN KEY REFERENCES TaiKhoan(id),
    thoi_gian_cap_nhat DATETIME DEFAULT GETDATE(),
    noi_dung_cap_nhat NVARCHAR(MAX) NOT NULL, 
    hinh_anh_minh_hoa VARCHAR(255) NULL 
);