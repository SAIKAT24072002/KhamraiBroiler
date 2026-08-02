# Khamrai Broiler Center

A production-grade, fully dynamic MERN stack poultry & egg business website, ordering system, and complete admin dashboard.

## Key Features
- **OTP-only Authentication**: Quick customer login using Mobile + OTP (no password).
- **No Delivery / Store Pickup**: Simplifies operations with scheduled pickup dates and time slots.
- **Dynamic Daily Pricing**: Admin can change retail/wholesale prices with a click, tracking history.
- **Inventory Tracking**: Handles stock levels, low-stock thresholds, and tracks transaction logs.
- **Payment Options**: Supports Automatic payments (Razorpay), manual UPI (QR scan + UTR code validation), and Cash on Pickup.
- **Staff Management**: Role-based access control for Admins, Managers, Sales, and Inventory staff.
- **Loyalty Program**: Customers earn points based on total shopping amounts, redeemable for discounts.
- **Cloudinary Integration**: Dynamic uploads for logos, categories, products, and banners, with automatic local fallback.
- **Dark/Light Mode**: Full visual customisation with Framer Motion animations.

---

## Setup Instructions

### 1. Prerequisites
- Node.js (v16+)
- MongoDB Atlas Account (or local MongoDB server)
- Cloudinary Account (optional, fallback to local directory available)
- Razorpay Account (optional, fallback to simulated gateway available)

### 2. Environment Configuration
Create a `.env` file in the `backend/` directory using the `.env.example` template:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/poultry_business_db?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key
USE_MOCK_OTP=true

# Cloudinary Setup (Optional - empty to store locally)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Razorpay Setup (Optional - empty to use simulated payment)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

### 3. Installation
At the root directory, install all dependencies:
```bash
npm install
```

### 4. Running the Application
To run both backend and frontend concurrently in development mode:
```bash
npm run dev
```
- Frontend runs at: `http://localhost:5173`
- Backend runs at: `http://localhost:5000`

---

## Technical Details & External Credentials

### MongoDB Atlas Setup:
1. Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a Free Shared Cluster.
3. Under Database Access, create a user with read/write access to database `poultry_business_db`.
4. Under Network Access, whitelist your IP or allow access from anywhere (`0.0.0.0/0`).
5. Copy the Node.js connection string, replace `<password>`, set the DB name to `/poultry_business_db`, and paste into `.env`.

### Cloudinary Integration:
1. Sign up at [Cloudinary](https://cloudinary.com).
2. Copy **Cloud Name**, **API Key**, and **API Secret** from Dashboard, and paste into `.env`.
3. If left blank, uploads are automatically handled locally under `backend/public/uploads`.

### SMS/OTP Verification:
1. Set `USE_MOCK_OTP=true` in `.env` for local testing.
2. In mock mode, calling `/api/auth/send-otp` will log the 6-digit OTP to the backend command line and return it directly in the API response.
3. For production, configuring Firebase Auth or Twilio in `backend/utils/otpService.js` is supported.
