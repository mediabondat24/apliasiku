-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Waktu pembuatan: 11 Nov 2024 pada 13.20
-- Versi server: 10.11.9-MariaDB-cll-lve
-- Versi PHP: 8.3.13

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `bubm5926_bubblefoto`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `admins`
--

CREATE TABLE `admins` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `admins`
--

INSERT INTO `admins` (`id`, `username`, `password`) VALUES
(1, 'Raifa', '$2y$10$hP7MwUogDw5R.zQBBVeqGuqiikOlUjUC1V1TPCPbYFeROMvqbpYB2');

-- --------------------------------------------------------

--
-- Struktur dari tabel `payment_confirmations`
--

CREATE TABLE `payment_confirmations` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `package_selected` varchar(50) DEFAULT NULL,
  `payment_proof` varchar(255) DEFAULT NULL,
  `confirmed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `payment_confirmations`
--

INSERT INTO `payment_confirmations` (`id`, `user_id`, `package_selected`, `payment_proof`, `confirmed_at`) VALUES
(1, 2, 'premium', '../uploads/pngwing.com.png', NULL);

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `phone_number` varchar(15) NOT NULL,
  `username_tiktok1` varchar(50) DEFAULT NULL,
  `username_tiktok2` varchar(50) DEFAULT NULL,
  `username_tiktok3` varchar(50) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `is_confirmed` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('Aktif','Tidak Aktif') DEFAULT 'Tidak Aktif',
  `package_type` varchar(50) DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `proof_path` varchar(255) DEFAULT NULL,
  `expiration_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `users`
--

INSERT INTO `users` (`id`, `name`, `phone_number`, `username_tiktok1`, `username_tiktok2`, `username_tiktok3`, `password`, `is_confirmed`, `created_at`, `status`, `package_type`, `payment_method`, `proof_path`, `expiration_date`) VALUES
(2, 'Arif', '082334810232', 'munculfotomu', 'shop.techno', 'fotomu_muncul', '$2y$10$hP7MwUogDw5R.zQBBVeqGuqiikOlUjUC1V1TPCPbYFeROMvqbpYB2', 1, '2024-11-05 06:22:59', 'Aktif', 'Platinum', NULL, '1730965579602-367301082-pngwing.com.png', '2025-11-30'),
(7, 'Sunaryo', '081333880220', 'fotomu_muncul', 'dms_madu', 'fotomu_muncul', '$2a$10$ui0EorAEK5L/GcFSKVvaCuPm0lvHQZ5440sTtgWmNuGZtSMsrZVIq', 0, '2024-11-07 07:45:22', 'Aktif', 'Platinum', NULL, '1730965651734-988792164-pngwing.com.png', '2025-11-08'),
(9, 'SERNER', '081235819959', '@nurliabundaneenes', NULL, NULL, '$2a$10$qolKweMHU.S2z8lhhFotP.W4p/HK2/cMOzL.Y0smFkhPe91XBMwI6', 0, '2024-11-07 10:11:40', 'Aktif', 'Silver', NULL, '1730974367195-342493534-logo.png', '2025-02-08'),
(10, 'SUPARTO', '082330822777', 'otrapusefootball', NULL, NULL, '$2a$10$hCWqzm.G69lvz4KvccxUUe7/okmb3SSDex./UForj50dK6EOIBBSW', 0, '2024-11-07 10:42:30', 'Aktif', 'Silver', NULL, '1730976392777-566470423.jpg', '2025-02-08'),
(11, 'New Rokhim', '082330523508', 'Tes 1', 'Tes 2', 'Tes 3', '$2a$10$/3gcY74HK/O6Vg0QbZtxOOZ1uNSg2S1E/OB8gyOuuphGG9qOaKuP.', 0, '2024-11-07 12:18:33', 'Aktif', 'Platinum', NULL, '1730981977941-989765555.jpg', NULL),
(12, 'Dede suherman', '081373808788', '@srikandi2878', '@fikrighani1006', '', '$2a$10$U/3hR9AmcDgaTOU/ikG8oukDr/WjUCYcPGLb2Yj1HAJKY0pXzq.5e', 0, '2024-11-07 17:28:39', 'Aktif', 'Gold', NULL, '1731001049564-285080750.jpg', '2025-05-01'),
(15, 'Arifaldo', '082333113665', 'arifaldo_84', NULL, NULL, '$2a$10$4YGU7uhqEDugG2Wsm5h6quSnRDJPlN9So7iC4MV8mRuiz9v6nKuyG', 0, '2024-11-09 17:34:39', 'Aktif', 'Silver', NULL, '1731173709500-202557590.png', '2025-02-10');

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indeks untuk tabel `payment_confirmations`
--
ALTER TABLE `payment_confirmations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indeks untuk tabel `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `phone_number` (`phone_number`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT untuk tabel `payment_confirmations`
--
ALTER TABLE `payment_confirmations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT untuk tabel `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `payment_confirmations`
--
ALTER TABLE `payment_confirmations`
  ADD CONSTRAINT `payment_confirmations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
