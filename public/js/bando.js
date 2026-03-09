document.addEventListener('DOMContentLoaded', function () {
    //KHỞI TẠO BẢN ĐỒ
    document.getElementById('map-container').innerHTML = '';
    
    let toaDoTrungTam = [10.368422344066985, 105.43320325646403]; 
    let mucZoom = 14; 
    var map = L.map('map-container').setView(toaDoTrungTam, mucZoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    //LẤY DỮ LIỆU TỪ API VÀ VẼ LÊN BẢN ĐỒ
    let danhSachGoc = [];
    
    //TẠO 3 LỚP LAYER RIÊNG BIỆT ĐỂ DỄ QUẢN LÝ
    let markerLayer = L.layerGroup().addTo(map);
    let splitterLayer = L.layerGroup().addTo(map);
    let capQuangLayer = L.layerGroup().addTo(map);

    const splitterIcon = L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/3256/3256096.png',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -10]
    });

    fetch('/api/diem-ket-noi')
        .then(response => response.json())
        .then(data => {
            danhSachGoc = data;
            veCacDiemLenBanDo(danhSachGoc);
            
            let labelSoLuong = document.getElementById('so-luong-diem-bando');
            if(labelSoLuong) labelSoLuong.innerText = danhSachGoc.length;
        })
        .catch(err => console.error("Lỗi khi tải dữ liệu API:", err));

    function veCacDiemLenBanDo(danhSachDiem) {
        markerLayer.clearLayers();
        splitterLayer.clearLayers();
        capQuangLayer.clearLayers();

        const drawnSplitters = new Set();

        danhSachDiem.forEach(diem => {
            if(!diem.vi_tri || !diem.vi_tri.coordinates) return;

            let kinh_do = diem.vi_tri.coordinates[0];
            let vi_do = diem.vi_tri.coordinates[1];
            let mau_trang_thai = diem.trang_thai_ket_noi.mau_sac;

            let ma_mau = "#6c757d";
            if (mau_trang_thai === "Xanh") ma_mau = "#198754";
            else if (mau_trang_thai === "Đỏ") ma_mau = "#dc3545";
            else if (mau_trang_thai === "Vàng") ma_mau = "#ffc107";

            //VẼ ĐIỂM KHÁCH HÀNG
            let marker = L.circleMarker([vi_do, kinh_do], {
                radius: 8, fillColor: ma_mau, color: "#ffffff",
                weight: 2, opacity: 1, fillOpacity: 0.9
            });

            let noi_dung_popup = `
                <div style="font-family: Arial; min-width: 150px;">
                    <h6 style="color: #0072BC; margin-bottom: 5px;"><b>${diem.ten_khach_hang}</b></h6>
                    <hr style="margin: 5px 0;">
                    <b>Loại:</b> ${diem.loai_khach_hang}<br>
                    <b>Địa chỉ:</b> ${diem.dia_chi}<br>
                    <b>Tín hiệu:</b> ${diem.trang_thai_ket_noi.cuong_do_tin_hieu} %<br>
                    <b>Ping:</b> ${diem.trang_thai_ket_noi.do_tre_ping_ms ? diem.trang_thai_ket_noi.do_tre_ping_ms + ' ms' : 'N/A'}<br>
                </div>
            `;
            marker.bindPopup(noi_dung_popup);
            markerLayer.addLayer(marker);

            //VẼ TỦ SPLITTER VÀ TIA CÁP QUANG
            if (diem.splitter_id && diem.splitter_id.vi_tri) {
                let spKinhDo = diem.splitter_id.vi_tri.coordinates[0];
                let spViDo = diem.splitter_id.vi_tri.coordinates[1];
                
                //Vẽ Tủ Splitter (Chỉ vẽ nếu chưa có trên bản đồ)
                if (!drawnSplitters.has(diem.splitter_id._id)) {
                    let spMarker = L.marker([spViDo, spKinhDo], { icon: splitterIcon });
                    spMarker.bindPopup(`
                        <h6 class="text-danger fw-bold mb-0"><i class="bi bi-hdd-rack"></i> ${diem.splitter_id.ten_splitter}</h6>
                        <small class="text-muted">SysID: ${diem.splitter_id.sys_id}</small>
                    `);
                    splitterLayer.addLayer(spMarker);
                    drawnSplitters.add(diem.splitter_id._id); //Đánh dấu là đã vẽ tủ này
                }

                //Vẽ Sợi cáp quang
                let capQuang = L.polyline([[vi_do, kinh_do], [spViDo, spKinhDo]], {
                    color: ma_mau, //Màu sợi cáp đồng bộ với màu Ping của khách
                    weight: 2,
                    opacity: 0.6,
                    dashArray: '5, 5' //Hiệu ứng nét đứt
                });
                capQuangLayer.addLayer(capQuang);
            }
        });
    }

    //CÁC HÀM XỬ LÝ LỌC DỮ LIỆU
    window.xoaBoLoc = function () {
        document.getElementById('input-tukhoa').value = '';
        document.getElementById('loai_tatca').checked = true;
        
        document.querySelectorAll('.filter-khuvuc').forEach(cb => cb.checked = false);
        locDuLieu();
    }

    window.locDuLieu = function () {
        let tuKhoa = document.getElementById('input-tukhoa').value.toLowerCase();
        let radioLoaiDuocChon = document.querySelector('.filter-loai:checked');
        let loaiDuocChon = radioLoaiDuocChon ? radioLoaiDuocChon.value : "";
        let khuVucDuocChon = Array.from(document.querySelectorAll('.filter-khuvuc:checked')).map(cb => cb.value);

        let duLieuDaLoc = danhSachGoc.filter(diem => {
            let khopTuKhoa = diem.ten_khach_hang.toLowerCase().includes(tuKhoa) ||
                             (diem.dia_chi && diem.dia_chi.toLowerCase().includes(tuKhoa));
            let khopLoai = (loaiDuocChon === "") || (diem.loai_khach_hang === loaiDuocChon);
            let khopKhuVuc = khuVucDuocChon.length === 0 || khuVucDuocChon.some(kv => diem.dia_chi && diem.dia_chi.includes(kv));

            return khopTuKhoa && khopLoai && khopKhuVuc;
        });

        veCacDiemLenBanDo(duLieuDaLoc);
        let labelSoLuong = document.getElementById('so-luong-diem-bando');
        if(labelSoLuong) labelSoLuong.innerText = duLieuDaLoc.length;
    }
});