const sql = require('mssql');

const config = {
    server: 'localhost',
    user: 'sa',
    password: 'sql2019',
    database: 'VNPT_BanDo_Admin',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function testConnection() {
    try {
        await sql.connect(config);
        console.log("KẾT NỐI SQL SERVER THÀNH CÔNG RỰC RỠ");
        process.exit(0);
    } catch (err) {
        console.log("CÓ LỖI XẢY RA", err.message);
        process.exit(1);
    }
}

testConnection();