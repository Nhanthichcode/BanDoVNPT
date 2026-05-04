const mongoose = require('mongoose');
const fs = require('fs');

// ==========================================
// 1. CẤU HÌNH KẾT NỐI MONGODB
// Thay chuỗi này bằng URI MongoDB thật của bạn
// ==========================================
const MONGO_URI = 'mongodb+srv://sa:admin123@vnpt-mapping.ep8txj8.mongodb.net/VNPT_Mapping?appName=VNPT-Mapping';

// ==========================================
// 2. KHAI BÁO MODEL
// ==========================================
const splitterSchema = new mongoose.Schema({
    ten_splitter: String,
    loai_splitter: String,
    trang_thai: String,
    sys_id: String,
    vi_tri: { type: { type: String, default: 'Point' }, coordinates: [Number] },
    splitter_cha_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Splitter', default: null }
}, { collection: 'Splitter' }); 

const diemKetNoiSchema = new mongoose.Schema({
    ten_khach_hang: String,
    loai_khach_hang: String,
    dia_chi: String,
    vi_tri: { type: { type: String, default: 'Point' }, coordinates: [Number] },
    thong_tin_hop_dong: { goi_cuoc_id: Number, ngay_dang_ky: Date, thoi_gian_su_dung_thang: Number, ngay_het_han: Date },
    splitter_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Splitter', default: null },
    thong_tin_pppoe: { username: String, password: String, circuit_id: Object },
    trang_thai_ket_noi: { mau_sac: String, ly_do_su_co: String, lan_kiem_tra_cuoi: Date },
    nguoi_tao: String
}, { collection: 'DiemKetNoi' });

const Splitter = mongoose.model('Splitter', splitterSchema);
const DiemKetNoi = mongoose.model('DiemKetNoi', diemKetNoiSchema);

// ==========================================
// 3. XỬ LÝ ĐỌC FILE TỌA ĐỘ JSON
// ==========================================
console.log("Đang tải danh sách tọa độ từ file custom.geo.json...");
const geoData = JSON.parse(fs.readFileSync('./custom.geo.json', 'utf8'));

// Bóc tách toàn bộ tọa độ từ cấu trúc MultiPolygon phức tạp thành 1 mảng 1 chiều
const danhSachToaDo = [];
const multiPolygons = geoData.features[0].geometry.coordinates;

multiPolygons.forEach(polygon => {
    polygon.forEach(ring => {
        ring.forEach(point => {
            // point chính là mảng [Kinh độ, Vĩ độ]
            danhSachToaDo.push([point[0], point[1]]);
        });
    });
});
console.log(`Đã trích xuất thành công ${danhSachToaDo.length} điểm tọa độ!`);

// Hàm bốc tọa độ ngẫu nhiên từ danh sách
function getRandomCoordinateFromList() {
    const randomIndex = Math.floor(Math.random() * danhSachToaDo.length);
    return danhSachToaDo[randomIndex];
}

// Các hàm tiện ích random tên
const ho = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng'];
const dem = ['Văn', 'Thị', 'Đức', 'Hữu', 'Ngọc', 'Minh', 'Xuân', 'Thu', 'Hải', 'Thanh'];
const ten = ['An', 'Bình', 'Cường', 'Dũng', 'Hương', 'Lan', 'Nam', 'Phong', 'Trang', 'Tùng'];

function randomName() {
    return `${ho[Math.floor(Math.random() * ho.length)]} ${dem[Math.floor(Math.random() * dem.length)]} ${ten[Math.floor(Math.random() * ten.length)]}`;
}

// ==========================================
// 4. HÀM CHÍNH ĐỂ SEED DỮ LIỆU
// ==========================================
async function seedData() {
    try {
        console.log("Đang kết nối MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("Kết nối thành công!");

        const soLuong = 40;

        // --- BƯỚC 1: TẠO TỦ CẤP 1 ---
        console.log(`Đang tạo ${soLuong} Tủ Cấp 1...`);
        const danhSachTuCap1 = [];
        for (let i = 1; i <= soLuong; i++) {
            danhSachTuCap1.push({
                ten_splitter: `Tủ Cấp 1 - Trạm ${i}`,
                loai_splitter: '1:4',
                trang_thai: 'Hoạt động',
                sys_id: `AGG-OLT-C1-${Math.floor(1000 + Math.random() * 9000)}`,
                vi_tri: { type: 'Point', coordinates: getRandomCoordinateFromList() }, // Lấy tọa độ từ file JSON
                splitter_cha_id: null
            });
        }
        const insertedTuCap1 = await Splitter.insertMany(danhSachTuCap1);
        console.log(`✅ Hoàn tất Tủ Cấp 1`);

        // --- BƯỚC 2: TẠO TỦ CẤP 2 ---
        console.log(`Đang tạo ${soLuong} Tủ Cấp 2...`);
        const danhSachTuCap2 = [];
        for (let i = 1; i <= soLuong; i++) {
            const tuCha = insertedTuCap1[Math.floor(Math.random() * insertedTuCap1.length)];
            
            danhSachTuCap2.push({
                ten_splitter: `Tủ Cấp 2 - Nhánh ${i}`,
                loai_splitter: '1:16',
                trang_thai: 'Hoạt động',
                sys_id: tuCha.sys_id,
                vi_tri: { type: 'Point', coordinates: getRandomCoordinateFromList() },
                splitter_cha_id: tuCha._id
            });
        }
        const insertedTuCap2 = await Splitter.insertMany(danhSachTuCap2);
        console.log(`✅ Hoàn tất Tủ Cấp 2`);

        // --- BƯỚC 3: TẠO KHÁCH HÀNG ---
        console.log(`Đang tạo ${soLuong} Khách Hàng...`);
        const danhSachKhachHang = [];
        const loaiHinh = ['Hộ gia đình', 'Doanh nghiệp', 'Điểm công cộng'];

        for (let i = 1; i <= soLuong; i++) {
            const tuCap2 = insertedTuCap2[Math.floor(Math.random() * insertedTuCap2.length)];
            const isError = Math.random() > 0.75; // 25% tỷ lệ lỗi
            const isOffline = Math.random() > 0.70; // 30% tỷ lệ xám (thu hồi)

            let mauSac = 'Xanh';
            if (isError) mauSac = 'Đỏ';
            else if (isOffline) mauSac = 'Xám';

            danhSachKhachHang.push({
                ten_khach_hang: randomName(),
                loai_khach_hang: loaiHinh[Math.floor(Math.random() * loaiHinh.length)],
                dia_chi: `Nhà số ${Math.floor(Math.random() * 500)} - Việt Nam`,
                vi_tri: { type: 'Point', coordinates: getRandomCoordinateFromList() },
                thong_tin_hop_dong: {
                    goi_cuoc_id: Math.floor(Math.random() * 5) + 1,
                    ngay_dang_ky: new Date(),
                    thoi_gian_su_dung_thang: 12,
                    ngay_het_han: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                },
                splitter_id: tuCap2._id,
                thong_tin_pppoe: {
                    username: `vnpt_${Math.floor(Math.random() * 99999)}`,
                    password: `pass123`,
                    circuit_id: {
                        sys_id: tuCap2.sys_id,
                        rack: 'a1', shelf: '0', slot: Math.floor(Math.random() * 8).toString(),
                        port: Math.floor(Math.random() * 16).toString(),
                        vpi: '0', vci: '33'
                    }
                },
                trang_thai_ket_noi: {
                    mau_sac: mauSac,
                    ly_do_su_co: mauSac === 'Đỏ' ? 'Suy hao cáp quang thuê bao' : null,
                    lan_kiem_tra_cuoi: new Date()
                },
                nguoi_tao: 'System_Auto'
            });
        }
        await DiemKetNoi.insertMany(danhSachKhachHang);
        console.log(`✅ Hoàn tất Khách hàng`);

        console.log("🎉 Hoàn tất sinh dữ liệu! Các điểm đã được tạo từ file custom.geo.json.");
        process.exit(0);

    } catch (error) {
        console.error("Lỗi trong quá trình Seed:", error);
        process.exit(1);
    }
}

seedData();