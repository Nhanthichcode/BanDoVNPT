const mongoose = require('mongoose');

const splitterSchema = new mongoose.Schema({
    ten_splitter: String,
    loai_splitter: String,
    sys_id: String,
    vi_tri: {
        type: { type: String, default: 'Point' },
        coordinates: [Number]
    },
    // Đảm bảo ref trỏ đúng tên Model
    splitter_cha_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Splitter', default: null },
    trang_thai: String
}, {
    collection: 'Splitter'
});

module.exports = mongoose.model('Splitter', splitterSchema);