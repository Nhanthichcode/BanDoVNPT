const mongoose = require('mongoose');

const splitterSchema = new mongoose.Schema({
    ten_splitter: { type: String, required: true },
    loai_splitter: { type: String, enum: ['1:4', '1:16'], required: true },

    sys_id: { type: String, required: true },

    vi_tri: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true } 
    },

    splitter_cha_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Splitter', default: null },

    trang_thai: { type: String, default: 'Hoạt động' }
}, { collection: 'Splitter' });

splitterSchema.index({ vi_tri: '2dsphere' });

module.exports = mongoose.model('Splitter', splitterSchema);