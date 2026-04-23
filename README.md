# BanDoVNPT
Đề tài xây dựng hệ thống bản đồ theo dõi kết nối mạng của VNPT đến với người dùng trong vùng đô thị Long Xuyên 

Hệ thống hoạt động bằng lệnh npm t trong Terminal của folder source code. Nếu muốn ngừng hoạt động của phiên làm việc, thì chỉ cần nhấn giữ tổ hợp Ctrl C (nhấn thêm Y để Yes nếu sử dụng cmd).

Lưu ý: Khi tải source code về. Trước hết phải mở Terminal của source lên, và dùng lệnh npm install để hệ thống có thể tải đủ các module cần thiết để hoạt động.

```
.env
```
NODE_ENV=development

# MongoDB URI (ghi đè lên file JSON nếu có)
MONGO_URI=mongodb+srv://sa:admin123@vnpt-mapping.ep8txj8.mongodb.net/VNPT_Mapping?appName=VNPT-Mapping
MONGO_DB=VNPT_Mapping

# SQL Server config
DB_SERVER=LETRINHAN\SQLEXPRESS02
DB_NAME=QuanLyVNPT
DB_USER=sa
DB_PASSWORD=1
