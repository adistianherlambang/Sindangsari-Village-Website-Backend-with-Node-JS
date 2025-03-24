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


//comparison >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

app.delete("/api/blogs/:id", (req, res) => {
    db.query("DELETE FROM blogs WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Blog deleted" });
    });
});
