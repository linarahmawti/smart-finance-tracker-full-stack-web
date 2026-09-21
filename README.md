<div align="center">
  <img src="public/images/logoo.png" alt="Aloka Finance Logo" width="100" />
  <h1>Aloka Finance — Personal Finance & Pocket Tracker</h1>
  <p>Aplikasi web modern pencatat dan pengelola keuangan pribadi berbasis kantong dana (<em>pockets</em>), arus kas harian, dan target tabungan.</p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase" />
    <img src="https://img.shields.io/badge/Drizzle_ORM-0.45-C5F74F?style=for-the-badge&logo=drizzle" alt="Drizzle ORM" />
  </p>
</div>

---

## 📌 Daftar Isi
1. [Tentang Aplikasi](#-tentang-aplikasi)
2. [Fitur Utama](#-fitur-utama)
3. [Teknologi yang Digunakan](#-teknologi-yang-digunakan)
4. [Struktur Database & Keamanan](#-struktur-database--keamanan)
5. [Panduan Instalasi & Setup Lokal](#-panduan-instalasi--setup-lokal)
6. [Panduan Cara Penggunaan](#-panduan-cara-penggunaan)
7. [Struktur Direktori Proyek](#-struktur-direktori-proyek)
8. [Daftar Perintah NPM](#-daftar-perintah-npm)

---

## 🌟 Tentang Aplikasi

**Aloka Finance** dirancang untuk membantu Anda mengatur arus keuangan pribadi dengan konsep **"Kantong Dana" (Pockets)**. Dengan membagi uang ke dalam pos-pos terpisah (misalnya: *Kebutuhan Pokok, Tabungan Liburan, Dana Darurat, Tagihan Bulanan*), Anda dapat:
- Mengetahui alokasi uang secara akurat.
- Menghindari pengeluaran berlebih (*overbudget*).
- Memantau perkembangan target tabungan secara visual.
- Melihat linimasa mutasi uang yang teratur dan transparan.

---

## 🚀 Fitur Utama

### 1. 📊 Dashboard Ringkasan Finansial
- **Total Saldo (Net Worth)**: Akumulasi seluruh saldo aktif di semua kantong dana.
- **Kartu Metrik Arus Kas**: Total Pemasukan, Pengeluaran, dan Dana yang Ditabung untuk periode aktif.
- **Grafik Arus Kas Interaktif**: Visualisasi perbandingan pemasukan vs pengeluaran berbasis waktu.
- **Ringkasan Kantong & Transaksi Terkini**: Akses cepat ke kantong prioritas dan aktivitas terakhir.

### 2. 👛 Manajemen Kantong Dana (*Custom Pockets*)
- Buat kantong dana tanpa batas dengan **Nama**, **Deskripsi**, **Warna Kustom**, dan **Pilihan Ikon**.
- Tentukan **Target Menabung** dan **Saldo Awal**.
- Pantau persentase pencapaian target menabung melalui *Progress Bar*.
- **Halaman Detail Kantong (`/pockets/[id]`)**: Menampilkan seluruh riwayat mutasi dana khusus untuk kantong tersebut.

### 3. 📝 Pencatatan Transaksi Lengkap (*Income & Expense*)
- Input nominal Rupiah otomatis dengan pemisah ribuan (`Rp 1.000.000`).
- Pilih kantong sumber pemotongan dana dan kategori transaksi.
- **Proteksi Overbudget**: Mencegah pencatatan pengeluaran apabila nominal melebihi saldo yang tersedia di kantong yang dipilih.
- **Pencarian & Multi-Filter**: Filter berdasarkan Tipe (Pemasukan/Pengeluaran), Kantong, Kategori, serta Sorting Tanggal/Nominal.

### 4. 🔄 Transfer & Menabung Antar-Kantong (*Atomic Transfers*)
- Pindahkan dana antar-kantong secara instan (misal: dari *Kantong Utama* ke *Kantong Tabungan Laptop*).
- Bersifat netral terhadap total saldo (*Net Worth* tetap sama, hanya memindahkan alokasi).
- Mutasi tercatat rapi di linimasa riwayat kedua kantong terkait.

### 5. 🏷️ Kategori Finansial Kustom
- Kelola kategori kustom untuk **Pemasukan** dan **Pengeluaran**.
- Kustomisasi nama, warna label, dan ikon kategori.
- Dilengkapi tombol **Edit** dan **Hapus** pada setiap kategori.

### 6. 📜 Riwayat Finansial Kronologis (*Unified Timeline*)
- Menggabungkan transaksi Pemasukan (`+`), Pengeluaran (`-`), dan Transfer Antar-Kantong (`→`) dalam satu linimasa terpadu yang dikelompokkan per tanggal.

### 7. 📄 Sistem Pagination Terpadu
- Pembagian data 10 item per halaman pada tabel transaksi, riwayat linimasa, dan detail kantong agar aplikasi tetap sangat cepat dan ringan.

### 8. 🌗 Dark Mode & Light Mode
- Pergantian tema instan (Mode Gelap / Terang) melalui tombol toggle di bagian navigasi atas.

### 9. 🛡️ Autentikasi & Keamanan Multi-Pengguna (Supabase Auth & RLS)
- Registrasi dan Login mandiri dengan validasi kata sandi.
- **Show / Hide Password**: Tombol ikon mata untuk melihat atau menyembunyikan password saat mengetik.
- **Ubah Kata Sandi**: Fitur pembaruan password akun langsung dari halaman Pengaturan.
- **Row Level Security (RLS)**: Setiap data pengguna terisolasi 100% secara aman di database.

---

## 🛠️ Teknologi yang Digunakan

| Kategori | Teknologi | Kegunaan |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router) | Server-Side Rendering, API Routes, & Client Components |
| **Bahasa** | TypeScript 5 | Type safety penuh di seluruh lapisan aplikasi |
| **Styling** | Tailwind CSS v4 | Styling modern, responsif, dan dark mode otomatis |
| **Backend / DB** | Supabase PostgreSQL | Database relasional dengan performa tinggi |
| **Autentikasi** | Supabase Auth (SSR) | Manajemen sesi pengguna dan JWT aman |
| **Keamanan Data** | Row Level Security (RLS) | Isolasi data antar-pengguna pada level PostgreSQL |
| **ORM & Migrasi** | Drizzle ORM + Drizzle Kit | Type-safe schema definition & migration generator |
| **Icons & UI** | Lucide React, Sonner | Ikon vektor modern dan notifikasi toast elegan |
| **Chart** | Recharts | Visualisasi data grafik arus kas dan kategori |

---

## 🗄️ Struktur Database & Keamanan

Skema database terdiri dari 5 tabel utama:
1. **`profiles`**: Menyimpan identitas pengguna (nama, email, mata uang).
2. **`pockets`**: Pos alokasi kantong dana dengan target dan saldo pembuka.
3. **`categories`**: Kategori custom untuk pemasukan dan pengeluaran.
4. **`transactions`**: Riwayat pencatatan transaksi pemasukan dan pengeluaran.
5. **`transfers`**: Riwayat perpindahan/transfer dana antar-kantong.

Seluruh tabel dilindungi oleh **RLS Policy**:
```sql
using (auth.uid() = user_id)
```
Sehingga pengguna hanya dapat membaca, mengubah, atau menghapus data milik akun mereka sendiri.

---

## 📦 Panduan Instalasi & Setup Lokal

### 1. Prasyarat
- **Node.js**: Versi 20.x atau yang lebih baru.
- **NPM / PNPM / Yarn**: Package manager.
- **Akun Supabase**: Akun gratis di [supabase.com](https://supabase.com).

### 2. Kloning Repositori & Install Dependencies
```bash
# Masuk ke direktori proyek
cd aloka

# Install seluruh dependencies
npm install
```

### 3. Konfigurasi Environment Variables (`.env.local`)
Salin file `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```
Buka file `.env.local` dan isi kredensial Supabase Anda:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-public-key
DATABASE_URL="postgresql://postgres.your-project:your-password@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres"
```

> **Catatan**: `anon public key` dapat disalin dari **Supabase Dashboard -> Project Settings -> API**.

### 4. Eksekusi Skema Database
Ada dua cara untuk membuat tabel di Supabase:

* **Opsi A (Via Supabase Dashboard - Tercepat)**:
  1. Buka dashboard Supabase -> pilih menu **SQL Editor**.
  2. Buka file `supabase/schema.sql` di proyek Anda, salin seluruh kodenya, dan tempel ke SQL Editor.
  3. Klik tombol **Run**.

* **Opsi B (Via Drizzle Kit Push)**:
  ```bash
  npm run db:push
  ```

### 5. Jalankan Server Pengembangan
```bash
npm run dev
```
Buka peramban Anda di **[http://localhost:3000](http://localhost:3000)**.

---

## 📖 Panduan Cara Penggunaan

```
Alur Penggunaan Aloka Finance:
┌─────────────────┐     ┌───────────────────┐     ┌────────────────────────┐
│ 1. Buat Akun /  │ ──> │ 2. Buat Kantong   │ ──> │ 3. Buat Kategori       │
│    Login        │     │    Dana (Pockets) │     │    Pemasukan & Belanja │
└─────────────────┘     └───────────────────┘     └────────────────────────┘
                                                               │
                                                               v
┌─────────────────┐     ┌───────────────────┐     ┌────────────────────────┐
│ 6. Pantau Arus  │ <── │ 5. Transfer Dana  │ <── │ 4. Catat Transaksi     │
│    Kas & Grafik │     │    (Menabung)     │     │    Masuk / Keluar      │
└─────────────────┘     └───────────────────┘     └────────────────────────┘
```

### Langkah 1: Registrasi & Masuk Akun
1. Buka halaman `/register`.
2. Masukkan **Nama Lengkap**, **Email**, dan **Kata Sandi** (min. 6 karakter).
3. Klik tombol mata untuk memastikan kata sandi sudah benar, lalu klik **Daftar Sekarang**.

### Langkah 2: Membuat Kantong Dana (*Pockets*)
1. Buka menu **Kantong Dana** (`/pockets`) -> Klik **Buat Kantong Dana Baru**.
2. Masukkan nama kantong (contoh: *Tabungan Liburan*, *Kebutuhan Dapur*).
3. Masukkan target menabung dan saldo awal (jika ada).
4. Pilih warna dan ikon favorit -> Klik **Buat Kantong**.

### Langkah 3: Menambahkan Kategori
1. Buka menu **Kategori** (`/categories`).
2. Pilih tab **Pengeluaran** atau **Pemasukan**.
3. Klik **Buat Kategori Baru** untuk menambahkan kategori khusus Anda (misal: *Gaji, Makanan, Tagihan Listrik, Hobi*).

### Langkah 4: Mencatat Pemasukan & Pengeluaran
1. Klik tombol **+ Transaksi** di kanan atas (atau tombol aksi di dashboard).
2. **Pemasukan**: Masukkan nominal, pilih kantong tujuan masuknya uang, dan kategorinya.
3. **Pengeluaran**: Masukkan nominal, pilih kantong sumber pemotongan dana, dan kategorinya.
   - *Sistem akan otomatis mengecek saldo kantong dan mencegah overbudget.*

### Langkah 5: Menabung / Memindahkan Dana Antar-Kantong
1. Klik **+ Transaksi** -> Pilih tab **Transfer / Menabung**.
2. Pilih **Kantong Asal** dan **Kantong Tujuan**.
3. Masukkan nominal yang ingin dipindahkan -> Klik **Proses Transfer Dana**.

### Langkah 6: Mengubah Password & Profil
1. Buka menu **Pengaturan** (`/settings`).
2. Ubah nama profil jika diinginkan.
3. Pada bagian **Keamanan & Ubah Kata Sandi**, masukkan kata sandi baru dan konfirmasinya, lalu klik **Perbarui Kata Sandi**.

---

## 📂 Struktur Direktori Proyek

```
aloka/
├── drizzle/                    # File hasil generate migrasi SQL Drizzle
├── public/
│   ├── favicon.ico             # Favicon tab browser
│   ├── favicon.png
│   ├── icon.png
│   └── images/
│       └── logoo.png           # Logo resmi 3D Aloka Finance
├── src/
│   ├── app/
│   │   ├── (auth)/             # Halaman Autentikasi (login, register, forgot-password)
│   │   ├── (dashboard)/        # Halaman Aplikasi (dashboard, transactions, pockets, categories, history, settings)
│   │   ├── globals.css         # Styling global Tailwind v4
│   │   ├── icon.png            # App icon browser Next.js
│   │   ├── layout.tsx          # Root Layout & SEO Meta
│   │   ├── not-found.tsx       # Halaman 404 Kustom
│   │   └── page.tsx            # Root redirect ke /dashboard atau /login
│   ├── components/
│   │   ├── forms/              # Modal forms (Income, Expense, Transfer, Pocket, Category)
│   │   ├── layout/             # Header, Sidebar desktop, Mobile bottom bar
│   │   ├── providers/          # Next-themes ThemeProvider
│   │   ├── shared/             # AlokaLogo, ConfirmDialog, EmptyState, IconRenderer, QuickAction
│   │   └── ui/                 # Reusable UI (Button, Card, Input, RupiahInput, Modal, Pagination, dll.)
│   ├── context/
│   │   └── FinanceContext.tsx  # Central State & Supabase CRUD Operations
│   ├── db/
│   │   ├── index.ts            # Drizzle database client & connection pool
│   │   └── schema.ts           # Drizzle ORM schema & relations
│   ├── lib/
│   │   ├── formatters.ts       # Format mata uang Rupiah (Rp) & format tanggal Indonesia
│   │   ├── supabase/           # Supabase client, server, & middleware handlers
│   │   └── validations/        # Zod form validation schemas
│   ├── middleware.ts           # Next.js Auth Session Guard
│   └── types/
│       ├── database.ts         # Supabase Database generated types
│       └── finance.ts          # Core Finance data models
├── supabase/
│   └── schema.sql              # Clean PostgreSQL schema + RLS policies
├── drizzle.config.ts           # Drizzle Kit configuration
└── package.json
```

---

## 💻 Daftar Perintah NPM

| Perintah | Deskripsi |
| :--- | :--- |
| `npm run dev` | Menjalankan development server lokal (`localhost:3000`) |
| `npm run build` | Melakukan compile dan build aplikasi untuk produksi |
| `npm run start` | Menjalankan aplikasi hasil production build |
| `npm run lint` | Menjalankan ESLint code analysis |
| `npm run db:push` | Mendorong perubahan skema Drizzle ORM langsung ke database Supabase |
| `npm run db:generate` | Menghasilkan file SQL migrasi lokal di folder `drizzle/migrations` |
| `npm run db:studio` | Membuka Drizzle Studio Visual Database Manager di browser |

---

<div align="center">
  <p>Dibuat dengan ❤️ untuk kemudahan pengelolaan finansial pribadi.</p>
  <p><strong>Aloka Finance &copy; 2026</strong></p>
</div>
