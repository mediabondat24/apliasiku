require('dotenv').config();

const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2');
const multer = require('multer');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { TikTokConnectionWrapper, getGlobalConnectionCount } = require('./connectionWrapper');
const { clientBlocked } = require('./limiter');

const app = express();
const httpServer = createServer(app);
app.use('/app', express.static(path.join(__dirname, 'app')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware untuk parsing data dari form dan JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Konfigurasi sesi
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false, // Pastikan ini false agar sesi baru tidak dibuat tanpa aktivitas login
    cookie: { secure: false }  // jika menggunakan HTTPS, ubah ini menjadi true
}));


// Koneksi ke database
const db = mysql.createConnection({
    host: 'localhost',
    user: 'Mediabondat2486',
    password: 'Banyuwangi2025@',
    database: 'bubblefoto'
});

db.connect(err => {
    if (err) {
        console.error('Gagal terhubung ke database:', err.stack);
        return;
    }
    console.log('Berhasil terhubung ke database MySQL.');
});

// Middleware untuk melayani file statis di folder 'public'
app.use(express.static('public'));

// Middleware autentikasi
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next();
    } else {
        res.status(401).send("Silakan login terlebih dahulu untuk mengakses halaman ini.");
    }
}

// uploud dan update
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads'); // Folder tempat file akan disimpan
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname)); // Menambahkan ekstensi file
    }
});
const upload = multer({ storage: storage });



// Rute untuk menyimpan data paket dan bukti pembayaran
app.post('/save-package', upload.single('proofUpload'), (req, res) => {
    const { userId, package, paymentMethod, tiktokUsername1, tiktokUsername2, tiktokUsername3 } = req.body;
    
    // Hitung tanggal kedaluwarsa berdasarkan paket
    let expirationDate;
    if (package === 'Silver') {
        expirationDate = moment().add(3, 'months').format('YYYY-MM-DD');
    } else if (package === 'Gold') {
        expirationDate = moment().add(6, 'months').format('YYYY-MM-DD');
    } else if (package === 'Platinum') {
        expirationDate = moment().add(1, 'year').format('YYYY-MM-DD');
    }

    // Mendapatkan hanya nama file dari path
    const proofFileName = req.file ? path.basename(req.file.path) : null;

    // Update data pengguna di tabel 'users' dengan informasi paket, username TikTok, bukti pembayaran, dan tanggal kedaluwarsa
    db.query(
        'UPDATE users SET package_type = ?, username_tiktok1 = ?, username_tiktok2 = ?, username_tiktok3 = ?, proof_path = ?, expiration_date = ? WHERE id = ?',
        [package, tiktokUsername1 || null, tiktokUsername2 || null, tiktokUsername3 || null, proofFileName, expirationDate, userId],
        (err) => {
            if (err) {
                console.error('Database error:', err);
                res.status(500).send('Gagal menyimpan data paket');
            } else {
                res.redirect('/user_konfirmasi.html?id=' + userId);
            }
        }
    );
});



app.get('/get-user-info', (req, res) => {
    const userId = req.session.userId;  // Pastikan userId tersimpan di sesi

    db.query('SELECT name, status, package_type, phone_number, username_tiktok1, username_tiktok2, username_tiktok3 FROM users WHERE id = ?', [userId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
        }

        if (results.length > 0) {
            const user = results[0];
            res.json({
                userId: userId,
                username: user.name,
                status: user.status,
                package: user.package_type,
                phoneNumber: user.phone_number,
                username_tiktok1: user.username_tiktok1,
                username_tiktok2: user.username_tiktok2,
                username_tiktok3: user.username_tiktok3
            });
        } else {
            res.status(404).json({ error: 'Pengguna tidak ditemukan' });
        }
    });
});



app.get('/user/tiktok-accounts', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    db.query('SELECT username_tiktok1, username_tiktok2, username_tiktok3 FROM users WHERE id = ?', [userId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
        }
        if (results.length > 0) {
            res.json(results[0]); // Mengirimkan data akun TikTok sebagai JSON
        } else {
            res.status(404).json({ error: 'Akun TikTok tidak ditemukan' });
        }
    });
});

//get from register
const moment = require('moment'); // Tambahkan ini jika Anda belum mengimpor moment.js

app.post('/user/register', (req, res) => {
    const { name, phone_number, password, confirm_password, package_type } = req.body;

    // Validasi password dan konfirmasi password
    if (password !== confirm_password) {
        return res.redirect('/user_register.html?message=Password tidak cocok, coba lagi.');
    }

    // Tentukan masa aktif berdasarkan paket yang dipilih
    let expirationDate;
    if (package_type === 'Silver') {
        expirationDate = moment().add(3, 'months').format('YYYY-MM-DD'); // 3 bulan
    } else if (package_type === 'Gold') {
        expirationDate = moment().add(6, 'months').format('YYYY-MM-DD'); // 6 bulan
    } else if (package_type === 'Platinum') {
        expirationDate = moment().add(1, 'year').format('YYYY-MM-DD'); // 1 tahun
    }

    // Cek apakah nomor telepon sudah terdaftar
    db.query('SELECT * FROM users WHERE phone_number = ?', [phone_number], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.redirect('/user_register.html?message=Terjadi kesalahan pada server');
        }
        if (results.length > 0) {
            return res.redirect('/user_register.html?message=Nomor telepon sudah terdaftar');
        }

        // Hash password
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                console.error('Error hashing password:', err);
                return res.redirect('/user_register.html?message=Terjadi kesalahan saat memproses password');
            }

            // Masukkan data pengguna ke database dengan status 'tidak aktif' dan masa aktif
            db.query(
                'INSERT INTO users (name, phone_number, password, package_type, expiration_date, status) VALUES (?, ?, ?, ?, ?, ?)',
                [name, phone_number, hashedPassword, package_type, expirationDate, 'tidak aktif'],
                (err, results) => {
                    if (err) {
                        console.error('Database error:', err);
                        return res.redirect('/user_register.html?message=Gagal mendaftarkan pengguna');
                    }
                    req.session.userId = results.insertId;
                    res.redirect(`/pilihan_paket.html?id=${req.session.userId}`);
                }
            );
        });
    });
});


// Route default (root) yang mengarahkan ke halaman login pengguna
app.get('/', (req, res) => {
    res.redirect('/user_login.html');
});

app.get('/get-user-info', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    db.query('SELECT name FROM users WHERE id = ?', [userId], (err, results) => {
        if (err || results.length === 0) {
            return res.json({});
        }
        res.json({ userId, username: results[0].name });
    });
});


// Route untuk login pengguna
// Route untuk login pengguna
app.post('/user/login', (req, res) => {
    const { phone_number, password } = req.body;
    db.query('SELECT * FROM users WHERE phone_number = ?', [phone_number], (err, results) => {
        if (err) {
            return res.redirect('/user_login.html?message=Terjadi kesalahan pada server');
        }
        if (results.length > 0) {
            bcrypt.compare(password, results[0].password, (err, isMatch) => {
                if (isMatch) {
                    req.session.userId = results[0].id; // Set userId di sesi

                    // Cek status pengguna
                    if (results[0].status === 'Aktif') {
                        res.redirect(`/user_dashboard.html?id=${req.session.userId}`);
                    } else {
                        res.redirect(`/pilihan_paket.html?id=${req.session.userId}&message=Akun Anda belum aktif. Silakan pilih paket.`);
                    }
                } else {
                    res.redirect('/user_login.html?message=Password salah');
                }
            });
        } else {
            res.redirect('/user_login.html?message=Nomor telepon tidak ditemukan');
        }
    });
});



function isAuthenticatedOrRegistered(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    } else {
        res.redirect('/user_login.html?message=Silakan login atau daftar terlebih dahulu');
    }
}

app.get('/pilihan_paket.html', isAuthenticatedOrRegistered, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pilihan_paket.html'));
});


app.get('/user/profile', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
        return res.status(401).json({ error: 'Pengguna tidak diautentikasi' });
    }

    db.query('SELECT name, username_tiktok1, username_tiktok2, username_tiktok3, status, package_type, expiration_date FROM users WHERE id = ?', [userId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
        }

        if (results.length > 0) {
            const user = results[0];
            let profileData = {
                name: user.name,
                status: user.status,
                package_type: user.package_type,
                expiration_date: user.expiration_date
            };

            // Hanya kirim data username TikTok sesuai paket
            if (user.package_type === 'Silver') {
                profileData.username_tiktok1 = user.username_tiktok1 || "Belum terdaftar";
            } else if (user.package_type === 'Gold') {
                profileData.username_tiktok1 = user.username_tiktok1 || "Belum terdaftar";
                profileData.username_tiktok2 = user.username_tiktok2 || "Belum terdaftar";
            } else if (user.package_type === 'Platinum') {
                profileData.username_tiktok1 = user.username_tiktok1 || "Belum terdaftar";
                profileData.username_tiktok2 = user.username_tiktok2 || "Belum terdaftar";
                profileData.username_tiktok3 = user.username_tiktok3 || "Belum terdaftar";
            }

            res.json(profileData);
        } else {
            res.status(404).json({ error: 'Pengguna tidak ditemukan' });
        }
    });
});

// Middleware untuk memeriksa masa aktif pengguna
// Middleware untuk memeriksa apakah pengguna sudah login dan masa aktifnya masih berlaku
const checkSubscriptionActive = (req, res, next) => {
    if (!req.session.userId) {
        // Redirect ke login jika pengguna belum login
        return res.redirect('/user_login.html');
    }

    const userId = req.session.userId; // Ambil userId dari sesi pengguna
    db.query('SELECT expiration_date FROM users WHERE id = ?', [userId], (err, results) => {
        if (err || results.length === 0) {
            console.error("Database error atau pengguna tidak ditemukan:", err);
            return res.redirect('/user_login.html'); // Redirect jika terjadi kesalahan atau pengguna tidak ditemukan
        }

        const expirationDate = new Date(results[0].expiration_date);
        const today = new Date();

        // Periksa apakah masa aktif sudah habis
        if (expirationDate < today) {
            // Redirect ke dashboard dengan pesan jika masa aktif sudah habis
            return res.redirect('/user_dashboard.html?message=expired');
        }

        // Jika masa aktif masih berlaku, lanjutkan ke halaman
        next();
    });
};
// Route untuk memeriksa masa aktif pengguna
app.get('/check-subscription', (req, res) => {
    const userId = req.query.id;
    
    db.query('SELECT expiration_date FROM users WHERE id = ?', [userId], (err, results) => {
        if (err || results.length === 0) {
            console.error("Database error atau pengguna tidak ditemukan:", err);
            return res.json({ isActive: false });
        }

        const expirationDate = new Date(results[0].expiration_date);
        const today = new Date();

        if (expirationDate >= today) {
            res.json({ isActive: true }); // Masa aktif masih berlaku
        } else {
            res.json({ isActive: false }); // Masa aktif sudah habis
        }
    });
});


app.get('/bubble.html', checkSubscriptionActive, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'bubble.html'));
});


// Route untuk mengupdate profil pengguna
app.post('/user/update-profile', isAuthenticated, (req, res) => {
    const { userId, username_tiktok1, username_tiktok2, username_tiktok3 } = req.body;
    db.query(
        'UPDATE users SET username_tiktok1 = ?, username_tiktok2 = ?, username_tiktok3 = ? WHERE id = ?',
        [username_tiktok1, username_tiktok2, username_tiktok3, userId],
        (err) => {
            if (err) return res.status(500).json({ error: 'Gagal memperbarui akun TikTok' });
            res.json({ message: 'Akun TikTok berhasil diperbarui' });
        }
    );
});


// Route untuk halaman dashboard pengguna
app.get('/user_dashboard.html', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'user_dashboard.html'));
});

// Route untuk halaman play (bubble.html)
app.get('/bubble.html', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'bubble.html'));
});

// Route untuk logout
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.redirect('/user_dashboard.html');
        res.clearCookie('connect.sid');
        res.redirect('/user_login.html?message=Anda telah logout');
    });
});

// Mengatur koneksi socket.io
const io = new Server(httpServer, {
    cors: {
        origin: '*'
    }
});

io.on('connection', (socket) => {
    let tiktokConnectionWrapper;

    console.info('New connection from origin', socket.handshake.headers['origin'] || socket.handshake.headers['referer']);

    socket.on('setUniqueId', (uniqueId, options) => {
        if (typeof options === 'object' && options) {
            delete options.requestOptions;
            delete options.websocketOptions;
        } else {
            options = {};
        }

        if (process.env.SESSIONID) {
            options.sessionId = process.env.SESSIONID;
            console.info('Using SessionId');
        }

        if (process.env.ENABLE_RATE_LIMIT && clientBlocked(io, socket)) {
            socket.emit('tiktokDisconnected', 'You have opened too many connections or made too many connection requests. Please reduce the number of connections/requests or host your own server instance. The connections are limited to avoid that the server IP gets blocked by TokTok.');
            return;
        }

        try {
            tiktokConnectionWrapper = new TikTokConnectionWrapper(uniqueId, options, true);
            tiktokConnectionWrapper.connect();
        } catch (err) {
            socket.emit('tiktokDisconnected', err.toString());
            return;
        }

        tiktokConnectionWrapper.once('connected', state => socket.emit('tiktokConnected', state));
        tiktokConnectionWrapper.once('disconnected', reason => socket.emit('tiktokDisconnected', reason));
        tiktokConnectionWrapper.connection.on('streamEnd', () => socket.emit('streamEnd'));

        // Event lainnya
        tiktokConnectionWrapper.connection.on('roomUser', msg => socket.emit('roomUser', msg));
        tiktokConnectionWrapper.connection.on('member', msg => socket.emit('member', msg));
        tiktokConnectionWrapper.connection.on('chat', msg => socket.emit('chat', msg));
        tiktokConnectionWrapper.connection.on('gift', msg => socket.emit('gift', msg));
        tiktokConnectionWrapper.connection.on('social', msg => socket.emit('social', msg));
        tiktokConnectionWrapper.connection.on('like', msg => socket.emit('like', msg));
        tiktokConnectionWrapper.connection.on('questionNew', msg => socket.emit('questionNew', msg));
        tiktokConnectionWrapper.connection.on('linkMicBattle', msg => socket.emit('linkMicBattle', msg));
        tiktokConnectionWrapper.connection.on('linkMicArmies', msg => socket.emit('linkMicArmies', msg));
        tiktokConnectionWrapper.connection.on('liveIntro', msg => socket.emit('liveIntro', msg));
        tiktokConnectionWrapper.connection.on('emote', msg => socket.emit('emote', msg));
        tiktokConnectionWrapper.connection.on('envelope', msg => socket.emit('envelope', msg));
        tiktokConnectionWrapper.connection.on('subscribe', msg => socket.emit('subscribe', msg));
    });

    socket.on('disconnect', () => {
        if (tiktokConnectionWrapper) {
            tiktokConnectionWrapper.disconnect();
        }
    });
});

// Admin Login Endpoint
app.post('/admin_login', (req, res) => {
    const { username, password } = req.body;
    const query = 'SELECT * FROM admins WHERE username = ?';

    db.query(query, [username], (err, results) => {
        if (err) {
            console.error('Query error:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
        }

        if (results.length === 0) {
            return res.json({ success: false, message: 'Username atau password salah' });
        }

        const admin = results[0];
        bcrypt.compare(password, admin.password, (err, isMatch) => {
            if (err) {
                console.error('Bcrypt error:', err);
                return res.status(500).json({ success: false, message: 'Server error' });
            }

            if (isMatch) {
                req.session.adminId = admin.id;
                res.json({ success: true, message: 'Login berhasil' });
            } else {
                res.json({ success: false, message: 'Username atau password salah' });
            }
        });
    });
});

function ensureAdminAuthenticated(req, res, next) {
    if (req.session.adminId) {
        return next();
    } else {
        res.redirect('/admin_login.html');
    }
}

app.get('/admin_dashboard.html', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin_dashboard.html'));
});
// Endpoint untuk mengecek sesi admin
app.get('/check_admin_session', (req, res) => {
    if (req.session.adminId) {
        res.json({ loggedIn: true });
    } else {
        res.json({ loggedIn: false });
    }
});

// Endpoint untuk mengubah status pengguna
app.patch('/api/users/:id/status', (req, res) => {
    const userId = req.params.id;
    const { status } = req.body;

    db.query('UPDATE users SET status = ? WHERE id = ?', [status, userId], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ success: false, message: 'Gagal mengubah status pengguna' });
        }

        res.json({ success: true, message: 'Status pengguna berhasil diperbarui' });
    });
});


app.post('/logout_admin', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ success: false, message: 'Gagal logout' });
        }
        res.json({ success: true, message: 'Logout berhasil' });
    });
});

// Endpoint logout admin
app.get('/admin_logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ success: false, message: 'Logout gagal' });
        res.json({ success: true });
    });
});

// Endpoint dashboard yang dilindungi
app.get('/admin_dashboard', (req, res) => {
    if (!req.session.adminId) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    res.sendFile(__dirname + '/admin_dashboard.html');
});

function authMiddleware(req, res, next) {
    if (req.session && req.session.adminId) {
        next(); // Jika sesi admin ditemukan, lanjutkan
    } else {
        // Jika sesi admin tidak ditemukan, kembalikan respon tidak terautentikasi
        res.status(401).json({ success: false, message: 'Unauthorized access' });
    }
}

// Endpoint untuk mendapatkan data user berdasarkan ID
app.get('/api/users/:id', (req, res) => {
    const userId = req.params.id;
    db.query('SELECT * FROM users WHERE id = ?', [userId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Gagal memuat data pengguna' });
        if (results.length > 0) {
            res.json(results[0]);
        } else {
            res.status(404).json({ error: 'Pengguna tidak ditemukan' });
        }
    });
});

// Endpoint untuk memperbarui data user berdasarkan ID
app.put('/api/users/:id', (req, res) => {
    const userId = req.params.id;
    const { name, phone_number, username_tiktok1, username_tiktok2, username_tiktok3, package_type, status } = req.body;

    const query = `
        UPDATE users SET name = ?, phone_number = ?, username_tiktok1 = ?, username_tiktok2 = ?, 
        username_tiktok3 = ?, package_type = ?, status = ? WHERE id = ?
    `;
    const values = [name, phone_number, username_tiktok1, username_tiktok2, username_tiktok3, package_type, status, userId];

    db.query(query, values, (err) => {
        if (err) return res.status(500).json({ error: 'Gagal memperbarui data pengguna' });
        res.json({ success: true });
    });
});


// Endpoint untuk mengambil data pengguna
app.get('/api/users', authMiddleware, (req, res) => {
    const query = `
        SELECT id, name, phone_number, username_tiktok1, username_tiktok2, username_tiktok3, 
               status, package_type, proof_path
        FROM users
    `;
    db.query(query, (error, results) => {
        if (error) {
            console.error('Error fetching user data:', error);
            return res.status(500).json({ error: 'Failed to retrieve user data.' });
        } else {
            console.log('User data retrieved successfully:', results);
            res.json(results);
        }
    });
});


// Middleware for checking if admin is logged in
function isAdminLoggedIn(req, res, next) {
    if (req.session && req.session.adminId) {
        next();
    } else {
        res.status(401).json({ success: false, message: 'Unauthorized access' });
    }
}

// Endpoint untuk menghapus user berdasarkan ID
app.delete('/api/users/:id', (req, res) => {
    const userId = req.params.id;

    // Cek apakah pengguna berstatus "Tidak Aktif"
    db.query('SELECT status FROM users WHERE id = ?', [userId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ success: false, message: 'Gagal memeriksa status pengguna' });
        }

        // Jika pengguna ditemukan dan statusnya "Tidak Aktif", lanjutkan penghapusan
        if (results.length > 0 && results[0].status === 'Tidak Aktif') {
            db.query('DELETE FROM users WHERE id = ?', [userId], (err) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ success: false, message: 'Gagal menghapus pengguna' });
                }
                res.json({ success: true, message: 'Pengguna berhasil dihapus' });
            });
        } else if (results.length > 0) {
            // Jika status pengguna bukan "Tidak Aktif"
            res.status(400).json({ success: false, message: 'Pengguna dengan status "Aktif" tidak dapat dihapus' });
        } else {
            res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
        }
    });
});



// Emit statistik koneksi global setiap 5 detik
setInterval(() => {
    io.emit('statistic', { globalConnectionCount: getGlobalConnectionCount() });
}, 5000);

// Start http listener
const port = process.env.PORT || 8081;
httpServer.listen(port, () => {
    console.info(`Server running! Please visit http://localhost:${port}`);
});
