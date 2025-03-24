require("dotenv").config(); // Load .env

const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(cors());

// Koneksi tanpa menentukan database dulu
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

// Buat Database jika belum ada
db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err);
        return;
    }
    console.log("Connected to MySQL");

    db.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`, (err) => {
        if (err) console.error("Database creation failed:", err);
        else console.log(`Database '${process.env.DB_NAME}' is ready`);
        
        // Gunakan database setelah dibuat
        db.changeUser({ database: process.env.DB_NAME }, (err) => {
            if (err) console.error("Database selection failed:", err);
            else createTables();
        });
    });
});

// Fungsi untuk membuat tabel jika belum ada
const createTables = () => {
    const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) NOT NULL,
            password VARCHAR(255) NOT NULL
        )
    `;

    const createBlogsTable = `
        CREATE TABLE IF NOT EXISTS blogs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            image VARCHAR(255),
            description TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    const createDescTable = `
        CREATE TABLE IF NOT EXISTS description (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL
        )
    `;

    const createDesaTable = `
        CREATE TABLE IF NOT EXISTS desa (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nama VARCHAR(255) NOT NULL,
            jabatan VARCHAR(255) NOT NULL,
            image VARCHAR(255)
        )
    `

    db.query(createDesaTable, (err) => {
        if (err) console.error("Desa table creation failed", err);
        else console.log("Desa table is ready");
    })

    db.query(createDescTable, (err) => {
        if (err) console.error("Desc table creation failed:", err);
        else console.log("description table is ready");
    });

    db.query(createUsersTable, (err) => {
        if (err) console.error("Users table creation failed:", err);
        else console.log("Users table is ready");
    });

    db.query(createBlogsTable, (err) => {
        if (err) console.error("Blogs table creation failed:", err);
        else console.log("Blogs table is ready");
    });
};


// 📌 Konfigurasi Multer (Upload Gambar)
// Konfigurasi Multer untuk Blog
const storageBlog = multer.diskStorage({
    destination: "./uploads/blogs/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const uploadBlog = multer({ storage: storageBlog });

// Konfigurasi Multer untuk Perangkat Desa
const storageDesa = multer.diskStorage({
    destination: "./uploads/desa/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const uploadDesa = multer({ storage: storageDesa });

// Middleware untuk akses gambar melalui URL
app.use("/uploads/blogs", express.static(path.join(__dirname, "uploads/blogs")));
app.use("/uploads/desa", express.static(path.join(__dirname, "uploads/desa")));

// 📌 LOGIN
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const sql = "SELECT * FROM users WHERE username = ? AND password = ?";
    
    db.query(sql, [username, password], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (result.length > 0) {
            res.json({ success: true, message: "Login successful" });
        } else {
            res.status(401).json({ error: "Incorrect username or password" });
        }
    });
});

// 📌 TAMBAH USER
app.post("/add-user", (req, res) => {
    const { username, password } = req.body;
    const sql = "INSERT INTO users (username, password) VALUES (?, ?)";

    db.query(sql, [username, password], (err) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json({ success: true, message: "User added successfully" });
    });
});

// 📌 GET SEMUA USER
app.get("/users", (req, res) => {
    db.query("SELECT * FROM users", (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(result);
    });
});

// 📌 HAPUS USER
app.delete("/delete-user/:id", (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM users WHERE id = ?";

    db.query(sql, [id], (err) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json({ success: true, message: "User deleted successfully" });
    });
});

// 📌 TAMBAH DESKRIPSI
app.get("/api/description", (req, res) => {
    db.query("SELECT * FROM description", (err, result) => {
        if(err) return res.status(500).json(err);
        res.json(result)[0] || {title: "Belum ada data", description: "Belum ada data"};
    })
})

// 📌 UPDATE DESKRIPSI
app.put("/api/description/:id", (req, res) => {
    const { title, description } = req.body;
    const { id } = req.params;

    const sql = "UPDATE description SET title = ?, description = ? WHERE id = ?";
    db.query(sql, [title, description, id], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json({ success: true, message: "Description Updated" });
    });
});

// 📌 GET SEMUA DESA
app.get("/api/desa", (req, res) => {
    db.query("SELECT * FROM desa", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

// 📌 GET DESA BERDASARKAN ID
app.get("api/desa/:id", (req, res) => {
    const desaId = req.params.id;
    const sql = "SELECT * FROM desa WHERE id = ?"

    db.query(sql, [desaId], (err, result) => {
        if (err) return res.status(500).json({error: "Database error"});
        if (result.length === 0) return res.status(404).json({error: "Desa not found"});
    })
})

    
// 📌 GET SEMUA BLOG
app.get("/api/blogs", (req, res) => {
    db.query("SELECT * FROM blogs ORDER BY created_at DESC", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

// 📌 GET BLOG BERDASARKAN ID
app.get('/api/blogs/:id', (req, res) => {
    const blogId = req.params.id;
    const sql = "SELECT * FROM blogs WHERE id = ?";
    
    db.query(sql, [blogId], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (result.length === 0) return res.status(404).json({ error: "Blog not found" });
        res.json(result[0]); 
    });
});

// 📌 GET BLOG BERDASARKAN TITLE (SLUG)
app.get('/api/blogs/title/:title', (req, res) => {
    const blogTitle = req.params.title;
    const sql = "SELECT * FROM blogs WHERE title = ?"; // Bisa ubah ke slug nanti
    
    db.query(sql, [blogTitle], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (result.length === 0) return res.status(404).json({ error: "Blog not found" });
        res.json(result[0]);
    });
});


// 📌 TAMBAH BLOG DENGAN GAMBAR
app.post("/api/blogs", uploadBlog.single("image"), (req, res) => {
    const { title, description } = req.body;
    const image = req.file ? req.file.filename : null;

    const sql = "INSERT INTO blogs (title, image, description) VALUES (?, ?, ?)";
    db.query(sql, [title, image, description], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Blog added", id: result.insertId });
    });
});

// 📌 HAPUS BLOG
app.delete("/api/blogs/:id", (req, res) => {
    const blogId = req.params.id;

    // 1️⃣ Cek nama file gambar dari database sebelum menghapus blog
    db.query("SELECT image FROM blogs WHERE id = ?", [blogId], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });

        if (result.length > 0) {
            const image = result[0].image; // Nama file gambar
            const filePath = path.join(__dirname, "uploads/blogs", image);

            // 2️⃣ Hapus file gambar jika ada
            if (image && fs.existsSync(filePath)) {
                fs.unlink(filePath, (err) => {
                    if (err) console.error("Gagal menghapus file:", err);
                });
            }

            // 3️⃣ Hapus data blog dari database
            db.query("DELETE FROM blogs WHERE id = ?", [blogId], (err) => {
                if (err) return res.status(500).json({ error: "Gagal menghapus blog" });
                res.json({ success: true, message: "Blog dan gambar berhasil dihapus" });
            });

        } else {
            res.status(404).json({ error: "Blog tidak ditemukan" });
        }
    });
});
// 📌 Jalankan server menggunakan PORT dari .env
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
