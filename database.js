const sql = require('mssql');
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

class DatabaseManager {
    constructor() {
        this.sqlPool = null;
        this.mongoClient = null;
        this.mongoDb = null;
        this.config = this.loadConfig();
    }

    loadConfig() {
        const env = process.env.NODE_ENV || 'development';
        
        // Đọc từ file JSON
        try {
            const configPath = path.join(__dirname, 'database.config.json');
            const configFile = fs.readFileSync(configPath, 'utf8');
            const allConfigs = JSON.parse(configFile);
            return allConfigs[env];
        } catch (err) {
            console.error('Lỗi đọc file config, dùng fallback: ', err.message);
                return {
                sqlserver: {
                    connectionString: "Server=(localdb)\\mssqllocaldb;Database=QuanLyVNPT;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True"
                },
                mongodb: {
                    uri: "mongodb://localhost:27017/VNPT_Mapping"
                }
            };
        }
    }

    // ========== SQL SERVER ==========
    async connectSQL() {
        try {
            if (this.config.sqlserver.connectionString) {
                this.sqlPool = await sql.connect(this.config.sqlserver.connectionString);
            } else {
                this.sqlPool = await sql.connect(this.config.sqlserver);
            }
            console.log('✅ Kết nối SQL Server thành công!');
            return this.sqlPool;
        } catch (err) {
            console.error('❌ Lỗi kết nối SQL Server:', err.message);
            throw err;
        }
    }

    async getSQLPool() {
        if (!this.sqlPool) {
            await this.connectSQL();
        }
        return this.sqlPool;
    }

   // ========== MONGODB ==========
    async connectMongo() {
        try {
            const uri = process.env.MONGO_URI || this.config.mongodb.uri;
            // Mongoose tự quản lý connection, không cần lưu lại đối tượng db/client
            await mongoose.connect(uri); 
            console.log(`✅ Kết nối MongoDB (Mongoose) thành công!`);
        } catch (err) {
            console.error('❌ Lỗi kết nối MongoDB:', err.message);
            throw err;
        }
    }

    async closeAll() {
        if (this.sqlPool) {
            await this.sqlPool.close();
            this.sqlPool = null;
            console.log('🔒 Đã đóng kết nối SQL Server');
        }
        await mongoose.disconnect(); // Sửa cách đóng kết nối cho Mongoose
        console.log('🔒 Đã đóng kết nối MongoDB');
    }
}

module.exports = new DatabaseManager(); 