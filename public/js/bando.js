document.addEventListener('DOMContentLoaded', function () {
    //1. Khởi tạo bản đồ
    document.getElementById('map-container').innerHTML = '';
    
    let toaDoTrungTam = [10.368422344066985, 105.43320325646403]; 
    let mucZoom = 14; 
    var map = L.map('map-container').setView(toaDoTrungTam, mucZoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    let danhSachGoc = [];
    
    let markerLayer = L.layerGroup().addTo(map);
    let splitterLayer = L.layerGroup().addTo(map);
    let capQuangLayer = L.layerGroup().addTo(map);

    //2. Định nghĩa các biểu tượng
    
    //Icon Tổng đài VNPT
    const iconVNPTServer = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #dc3545; color: white; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.4);">
                 <i class="bi bi-hdd-network-fill" style="font-size: 1.1rem;"></i>
               </div>`,
        iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -17]
    });

    //Icon Splitter 1:4 (Tam giác đều)
    const iconSplitter1_4 = L.divIcon({
        className: 'custom-div-icon',
        html: `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                 <polygon points="12,2 22,20 2,20" fill="#000000" stroke="#ffffff" stroke-width="1.5"/>
               </svg>`,
        iconSize: [24, 24], iconAnchor: [12, 12], popupAnchor: [0, -12]
    });

    //Icon Splitter 1:16 (Tam giác nhọn)
    const iconSplitter1_16 = L.divIcon({
        className: 'custom-div-icon',
        html: `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                 <polygon points="12,2 17,20 7,20" fill="#000000" stroke="#ffffff" stroke-width="1.5"/>
               </svg>`,
        iconSize: [24, 24], iconAnchor: [12, 12], popupAnchor: [0, -12]
    });

    //3. Gọi API để lấy dữ liệu điểm kết nối
    fetch('/api/diem-ket-noi')
        .then(response => {
            if (!response.ok) throw new Error('Lỗi máy chủ hoặc mất kết nối Database');
            return response.json();
        })
        .then(data => {
            danhSachGoc = data;
            veCacDiemLenBanDo(danhSachGoc);
            
            let labelSoLuong = document.getElementById('so-luong-diem-bando');
            if(labelSoLuong) labelSoLuong.innerText = danhSachGoc.length;
        })
        .catch(err => {
            console.error("Lỗi khi tải dữ liệu API:", err);
            let modalLoi = new bootstrap.Modal(document.getElementById('modalLoiMongoDB'));
            modalLoi.show();
            document.getElementById('map-container').innerHTML = `
                <div class="d-flex flex-column justify-content-center align-items-center h-100 text-danger w-100" style="z-index: 999; position: relative;">
                    <i class="bi bi-wifi-off fs-1 mb-2"></i>
                    <h5 class="fw-bold">Bản đồ tạm thời không khả dụng</h5>
                    <p class="small text-muted">Mất kết nối với cơ sở dữ liệu không gian.</p>
                </div>
            `;
        });

    //4. Vẽ bản đồ
    function veCacDiemLenBanDo(danhSachDiem) {
        markerLayer.clearLayers();
        splitterLayer.clearLayers();
        capQuangLayer.clearLayers();

        const drawnSplitters = new Set();
        const drawnLinks = new Set();

        //Tổng đài VNPT
        const vnptServerLat = 10.392082023345424;
        const vnptServerLng = 105.43494757572051;
        
        let serverMarker = L.marker([vnptServerLat, vnptServerLng], { icon: iconVNPTServer })
            .bindPopup(`
                <div style="text-align: center;">
                    <h6 class="text-danger fw-bold mb-0"><i class="bi bi-server"></i> TỔNG ĐÀI VNPT</h6>
                    <small class="text-muted">Trung tâm điều hành mạng</small>
                </div>
            `);
        splitterLayer.addLayer(serverMarker);

        //Khách hàng và Cáp
        danhSachDiem.forEach(diem => {
            if(!diem.vi_tri || !diem.vi_tri.coordinates) return;

            let kinh_do = diem.vi_tri.coordinates[0];
            let vi_do = diem.vi_tri.coordinates[1];
            let mau_trang_thai = diem.trang_thai_ket_noi.mau_sac;

            let ma_mau = "#6c757d";
            if (mau_trang_thai === "Xanh") ma_mau = "#198754";
            else if (mau_trang_thai === "Đỏ") ma_mau = "#dc3545";

            //Vẽ điểm khách hàng
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
                    <b>Trạng thái:</b> <span style="color: ${ma_mau}; font-weight: bold;">${diem.trang_thai_ket_noi.mau_sac}</span><br>
                    ${diem.trang_thai_ket_noi.mau_sac === 'Đỏ' && diem.trang_thai_ket_noi.ly_do_su_co ? `<b class="text-danger">Lý do:</b> ${diem.trang_thai_ket_noi.ly_do_su_co}<br>` : ''}
                </div>
            `;
            marker.bindPopup(noi_dung_popup);
            markerLayer.addLayer(marker);

            //Vẽ tủ cáp và kéo dây
            if (diem.splitter_id && diem.splitter_id.vi_tri) {
                let sp16KinhDo = diem.splitter_id.vi_tri.coordinates[0];
                let sp16ViDo = diem.splitter_id.vi_tri.coordinates[1];
                let sp16Id = diem.splitter_id._id;

                //Vẽ tủ 1:16
                if (!drawnSplitters.has(sp16Id)) {
                    let sp16Marker = L.marker([sp16ViDo, sp16KinhDo], { icon: iconSplitter1_16 });
                    sp16Marker.bindPopup(`
                        <h6 class="text-primary fw-bold mb-0"><i class="bi bi-hdd-rack"></i> ${diem.splitter_id.ten_splitter}</h6>
                        <small class="text-muted">Loại tủ: 1:16 | SysID: ${diem.splitter_id.sys_id}</small>
                    `);
                    splitterLayer.addLayer(sp16Marker);
                    drawnSplitters.add(sp16Id);
                }

                //Kéo cáp (Nét đứt) từ Khách hàng -> Tủ 1:16
                let capKhachHang = L.polyline([[vi_do, kinh_do], [sp16ViDo, sp16KinhDo]], {
                    color: ma_mau, weight: 2, opacity: 0.7, dashArray: '4, 4'
                });
                capQuangLayer.addLayer(capKhachHang);

                //Vẽ Tủ 1:4 và kéo cáp trục
                if (diem.splitter_id.splitter_cha_id && diem.splitter_id.splitter_cha_id.vi_tri) {
                    let sp4 = diem.splitter_id.splitter_cha_id;
                    let sp4KinhDo = sp4.vi_tri.coordinates[0];
                    let sp4ViDo = sp4.vi_tri.coordinates[1];
                    let sp4Id = sp4._id;

                    //Vẽ Tủ 1:4
                    if (!drawnSplitters.has(sp4Id)) {
                        let sp4Marker = L.marker([sp4ViDo, sp4KinhDo], { icon: iconSplitter1_4 });
                        sp4Marker.bindPopup(`
                            <h6 class="text-danger fw-bold mb-0"><i class="bi bi-hdd-rack-fill"></i> ${sp4.ten_splitter}</h6>
                            <small class="text-muted">Loại tủ: 1:4 | SysID: ${sp4.sys_id}</small>
                        `);
                        splitterLayer.addLayer(sp4Marker);
                        drawnSplitters.add(sp4Id);

                        // Kéo cáp (Nét liền, nét đậm) từ VNPT Server -> Tủ 1:4
                        let capTruc = L.polyline([[vnptServerLat, vnptServerLng], [sp4ViDo, sp4KinhDo]], {
                            color: '#0072BC', weight: 4, opacity: 0.8
                        });
                        capQuangLayer.addLayer(capTruc);
                    }

                    //Kéo cáp (Nét liền, màu xanh lá) từ Tủ 1:4 -> Tủ 1:16
                    let linkTuId = sp4Id + '-' + sp16Id;
                    if (!drawnLinks.has(linkTuId)) {
                        let capNhanh = L.polyline([[sp4ViDo, sp4KinhDo], [sp16ViDo, sp16KinhDo]], {
                            color: '#198754', weight: 3, opacity: 0.7
                        });
                        capQuangLayer.addLayer(capNhanh);
                        drawnLinks.add(linkTuId);
                    }
                }
            }
        });
    }

    //Các hàm xử lý lọc dữ liệu
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