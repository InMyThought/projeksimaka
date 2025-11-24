# Projek Simaka

Aplikasi Web Fullstack yang dibangun menggunakan **Next.js** (Frontend) dan **Django** (Backend).

## 📋 Prasyarat (Prerequisites)

Sebelum memulai, pastikan komputer Anda sudah terinstal:

* **Node.js** (Versi 18+ direkomendasikan) & **npm**
* **Python** (Versi 3.9+ direkomendasikan)
* **Git**

---

## 🚀 Instalasi & Setup Awal

Ikuti langkah-langkah ini **hanya satu kali** saat pertama kali mengunduh proyek ini.

### 1. Clone Repository
```bash
git clone https://github.com/InMyThought/projeksimaka.git
cd projeksimaka
```
### 2. Setup Backend (Django)
Kita perlu membuat virtual environment agar library Python tidak tercampur dengan sistem global.

Masuk ke folder backend:

```Bash
cd backend/backend_simaka
```

Buat Virtual Environment (venv):

```Bash
python -m venv venv
```

Aktifkan Virtual Environment:

Windows (Command Prompt):

```DOS
venv\Scripts\activate
```
Windows (PowerShell):

```PowerShell
.\venv\Scripts\Activate.ps1
```

Windows (GitBash):
```
source venv/Scripts/activate
```

Mac / Linux:

```Bash
source venv/bin/activate
```

(Pastikan muncul tanda (venv) di terminal Anda)

### Install Dependencies Python:

```Bash
pip install -r requirements.txt
```

Migrasi Database (Opsional/Jika Perlu):

```Bash
python simaka_backend/manage.py migrate
```

Kembali ke Root Folder:

```Bash
cd ../..
```

### 3. Setup Frontend (Next.js) & Root
Install dependensi Node.js untuk menjalankan script concurrent dan frontend.

Dari root folder (projeksimaka), jalankan:

```Bash

# Install dependency untuk root (concurrently)
npm install 

# Install dependency untuk frontend
npm run install:fe
```
### 💻 Cara Menjalankan Aplikasi (Development)
Setiap kali Anda ingin memulai coding atau menyalakan server, ikuti SOP berikut:

Langkah 1: Aktifkan Environment Python Buka terminal di root folder (projeksimaka), lalu aktifkan env backend.

Windows:

```DOS
backend\backend_simaka\venv\Scripts\activate
```
Windows (GitBash):

```DOS
source backend\backend_simaka\venv\Scripts\activate
```
Mac / Linux:

```Bash
source backend/backend_simaka/venv/bin/activate
```
Langkah 2: Jalankan Perintah Dev Setelah env aktif (ada tanda (venv)), jalankan perintah ini di root:

```Bash
npm run dev
```
Perintah ini akan menjalankan Frontend dan Backend secara bersamaan dalam satu terminal.

Frontend: http://localhost:3000

Backend: http://localhost:8000

```projeksimaka/
├── backend/
│   └── backend_simaka/
│       ├── venv/                # Virtual Environment Python (Local Only)
│       ├── simaka_backend/      # Django Source Code
│       └── requirements.txt     # Daftar Library Python
├── frontend/
│   └── NOAH/                    # Next.js Source Code
├── package.json                 # Skrip Utama & Config Node
├── .gitignore                   # Daftar file yang diabaikan Git
└── README.md                    # Dokumentasi Proyek
```
### ⚠️ Catatan Penting untuk Tim
Jangan Upload venv: Folder backend/backend_simaka/venv/ sudah di-ignore. Jangan memaksanya masuk ke GitHub.

Menambah Library Python: Jika Anda menginstall library baru (misal: pip install requests), jangan lupa update requirements.txt:

```Bash
cd backend/backend_simaka
pip freeze > simaka_backend/requirements.txt
```
Masalah Script di Windows: Jika saat aktivasi env muncul error "running scripts is disabled on this system", buka PowerShell sebagai Administrator dan jalankan:

```PowerShell
Set-ExecutionPolicy RemoteSigned
```
Command Pintas (Scripts)
Daftar command yang tersedia di package.json:

```npm run dev```: Menjalankan Frontend & Backend (Wajib venv aktif).

```npm run install:fe```: Install dependency frontend saja.

```npm run install:be```: Install dependency backend saja (Wajib venv aktif).

```npm run backend```: Menjalankan server Django saja (Wajib venv aktif).

```npm run frontend```: Menjalankan server Next.js saja.

```npm run install-all```: Menginstall seluruh dependency (Frontend & Backend) sekaligus (Wajib venv aktif).