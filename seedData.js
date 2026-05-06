const mongoose = require('mongoose');
const fs = require('fs'); // Có thể bỏ nếu không dùng file GeoJSON nữa

// ==========================================
// 1. CẤU HÌNH KẾT NỐI MONGODB
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

const Splitter = mongoose.models.Splitter || mongoose.model('Splitter', splitterSchema);
const DiemKetNoi = mongoose.models.DiemKetNoi || mongoose.model('DiemKetNoi', diemKetNoiSchema);

// ==========================================
// 3. CẤU HÌNH KHU VỰC LONG XUYÊN
// ==========================================
const CENTER_LAT = 10.38;   // Vĩ độ trung tâm Long Xuyên
const CENTER_LON = 105.44;  // Kinh độ trung tâm Long Xuyên
const RADIUS_KM = 100;      // Bán kính 100km

// Hằng số chuyển đổi km sang độ (xấp xỉ)
const KM_PER_DEG_LAT = 111.32; // 1 độ vĩ ≈ 111.32 km
const KM_PER_DEG_LON = 111.32 * Math.cos(CENTER_LAT * Math.PI / 180); // Điều chỉnh theo vĩ độ

/**
 * Sinh tọa độ ngẫu nhiên trong hình tròn bán kính RADIUS_KM quanh Long Xuyên.
 * Phân bố đều diện tích (dùng căn bậc hai của random cho bán kính).
 * @returns {Array<number>} [longitude, latitude]
 */
function getRandomCoordinateInCircle() {
    // Góc ngẫu nhiên 0 -> 2π
    const angle = Math.random() * 2 * Math.PI;
    // Bán kính ngẫu nhiên với phân phối đều (tránh tập trung ở tâm)
    const r = RADIUS_KM * Math.sqrt(Math.random());

    // Đổi sang độ lệch
    const deltaLat = (r * Math.cos(angle)) / KM_PER_DEG_LAT;
    const deltaLon = (r * Math.sin(angle)) / KM_PER_DEG_LON;

    const lat = CENTER_LAT + deltaLat;
    const lon = CENTER_LON + deltaLon;

    return [lon, lat]; // MongoDB lưu [kinh độ, vĩ độ]
}

// ==========================================
// 4. CÁC HÀM TIỆN ÍCH KHÁC
// ==========================================
const ho = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng'];
const dem = ['Văn', 'Thị', 'Đức', 'Hữu', 'Ngọc', 'Minh', 'Xuân', 'Thu', 'Hải', 'Thanh'];
const ten = ['An', 'Bình', 'Cường', 'Dũng', 'Hương', 'Lan', 'Nam', 'Phong', 'Trang', 'Tùng'];

function randomName() {
    return `${ho[Math.floor(Math.random() * ho.length)]} ${dem[Math.floor(Math.random() * dem.length)]} ${ten[Math.floor(Math.random() * ten.length)]}`;
}

// ==========================================
// 5. HÀM CHÍNH ĐỂ SEED DỮ LIỆU
// ==========================================
// Export hàm seed để gọi từ API
module.exports = async function seedData(soLuongInput) {
     const soLuong = parseInt(soLuongInput) || 44;
    try {
        console.log("Đang kết nối MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("Kết nối thành công!");

        // Xóa dữ liệu cũ
        console.log("Đang xóa toàn bộ dữ liệu cũ...");
        const deleteKHResult = await DiemKetNoi.deleteMany({});
        const deleteTuResult = await Splitter.deleteMany({});
        console.log(`Đã xóa ${deleteKHResult.deletedCount} khách hàng và ${deleteTuResult.deletedCount} tủ cáp.`);

    
        // --- BƯỚC 1: TẠO TỦ CẤP 1 ---
        console.log(`Đang tạo ${soLuong*0.2} Tủ Cấp 1...`);
        const danhSachTuCap1 = [];
        for (let i = 1; i <= soLuong*0.2; i++) {
            danhSachTuCap1.push({
                ten_splitter: `Tủ Cấp 1 - Trạm ${i}`,
                loai_splitter: '1:4',
                trang_thai: 'Hoạt động',
                sys_id: `AGG-OLT-C1-${Math.floor(1000 + Math.random() * 9000)}`,
                vi_tri: { type: 'Point', coordinates: getRandomCoordinateInCircle() },
                splitter_cha_id: null
            });
        }
        const insertedTuCap1 = await Splitter.insertMany(danhSachTuCap1);
        console.log(`✅ Hoàn tất Tủ Cấp 1: ${insertedTuCap1.length} tủ đã được tạo.`);

        // --- BƯỚC 2: TẠO TỦ CẤP 2 ---
        console.log(`Đang tạo ${soLuong*0.3} Tủ Cấp 2...`);
        const danhSachTuCap2 = [];
        for (let i = 1; i <= soLuong*0.3; i++) {
            const tuCha = insertedTuCap1[Math.floor(Math.random() * insertedTuCap1.length)];
            danhSachTuCap2.push({
                ten_splitter: `Tủ Cấp 2 - Nhánh ${i}`,
                loai_splitter: '1:16',
                trang_thai: 'Hoạt động',
                sys_id: tuCha.sys_id,
                vi_tri: { type: 'Point', coordinates: getRandomCoordinateInCircle() },
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
            const isError = Math.random() > 0.75; // 25% khách hàng có sự cố (màu đỏ)
            const isOffline = Math.random() > 0.60; // 40% khách hàng offline (màu xám)

            let mauSac = 'Xanh';
            if (isError) mauSac = 'Đỏ';
            else if (isOffline) mauSac = 'Xám';

            danhSachKhachHang.push({
                ten_khach_hang: randomName(),
                loai_khach_hang: loaiHinh[Math.floor(Math.random() * loaiHinh.length)],
                dia_chi: `Nhà số ${Math.floor(Math.random() * 500)} - Việt Nam`,
                vi_tri: { type: 'Point', coordinates: getRandomCoordinateInCircle() },
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
        console.log(`✅ Hoàn tất Khách hàng: ${soLuong} khách hàng đã được tạo.`);

        console.log("🎉 Hoàn tất sinh dữ liệu mới! Tất cả điểm nằm trong bán kính 100km quanh Long Xuyên.");
        return { success: true, message: "✅ Hoàn tất sinh dữ liệu mới!" };

    } catch (error) {
        console.error("Lỗi trong quá trình Seed:", error);
        return { success: false, message: "❌ Đã xảy ra lỗi trong quá trình sinh dữ liệu." };
    }
}

// Nếu chạy trực tiếp (node seedData.js) thì vẫn gọi hàm với tham số mặc định
if (require.main === module) {
    const args = process.argv.slice(2);
    const soLuong = parseInt(args[0]) || 44;
    module.exports(soLuong).then(msg => {
        console.log(msg);
        return{ success: true, message: "✅ Hoàn tất sinh dữ liệu mới!" };
    }).catch(err => {
        console.error(err);
        return { success: false, message: "❌ Đã xảy ra lỗi trong quá trình sinh dữ liệu." };
    });
}