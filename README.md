# NCPS - Network Computer Professional Services

## Quick Start

### 🚀 One-Click Launch

Simply double-click **`START_APP.bat`** to start the entire application.

This will automatically:
- Start the backend server (Port 5000)
- Start the frontend development server (Port 5173)

### 🛑 One-Click Stop

Double-click **`STOP_APP.bat`** to stop all running services.

---

## Manual Setup (First Time Only)

If this is your first time running the application, install dependencies first:

### 1. Install Backend Dependencies
```bash
cd system/server
npm install
```

### 2. Install Frontend Dependencies
```bash
cd system/main
npm install
```

### 3. Database Setup
1. Import the database schema from `system/database/ncps_db.sql` into your MySQL server
2. Update `system/server/.env` with your database credentials

---

## Manual Start (Alternative Method)

### Start Backend
```bash
cd system/server
npm start
```

### Start Frontend
```bash
cd system/main
npm run dev
```

---

## Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

---

## Default Test Accounts

After importing the database, you can login with:

- **Admin**: `admin` / `admin123`
- **Receptionist**: `receptionist` / `receptionist123`
- **Technician**: `technician` / `technician123`
- **Customer**: `customer` / `customer123`

---

## Troubleshooting

### Port Already in Use
If you see "Port already in use" errors:
1. Run `STOP_APP.bat`
2. Wait a few seconds
3. Run `START_APP.bat` again

### Database Connection Error
1. Make sure MySQL is running
2. Check credentials in `system/server/.env`
3. Verify the database `ncps_db` exists

### Node Modules Missing
Run the installation commands in the "Manual Setup" section above.

---

## Development

- Frontend uses **Vite + React + TypeScript**
- Backend uses **Node.js + Express**
- Database: **MySQL/MariaDB**
