const mongoose = require('mongoose');

const diemKetNoiSchema = new mongoose.Schema({
    ten_khach_hang: { type: String, required: true },
    loai_khach_hang: { type: String, required: true },
    dia_chi: { type: String, required: true },
    
    vi_tri: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true } // [Kinh độ, Vĩ độ]
    },

    thong_tin_hop_dong: {
        goi_cuoc_id: { type: Number, required: true },
        ngay_dang_ky: { type: Date, required: true },
        thoi_gian_su_dung_thang: { type: Number, required: true },
        ngay_het_han: { type: Date, required: true }
    },

    splitter_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Splitter', default: null },

    thong_tin_pppoe: {
        username: { type: String, required: true },
        password: { type: String, required: true },
        circuit_id: {
            rack: { type: String }, shelf: { type: String },
            slot: { type: String }, port: { type: String },
            vpi: { type: String }, vci: { type: String }
        }
    },

    trang_thai_ket_noi: {
        mau_sac: { 
            type: String, 
            enum: ['Xanh', 'Đỏ', 'Xám'],
            default: 'Xanh' 
        },
        ly_do_su_co: { type: String, default: null },
        lan_kiem_tra_cuoi: { type: Date, default: Date.now }
    },

    nguoi_tao: { type: String, required: true }
}, { collection: 'DiemKetNoi' });

diemKetNoiSchema.index({ vi_tri: '2dsphere' });

module.exports = mongoose.model('DiemKetNoi', diemKetNoiSchema);