# 🧠 AI Context - NoWayHome

## 🎯 Project Overview
NoWayHome is a web application similar to Airbnb that allows users to search, publish, and book temporary accommodations.

This project is an academic MVP focused on validating:
- Core functionality
- System architecture
- User experience

---

## 🏗 Architecture
- Frontend: React + Vite
- Language: JavaScript (NO TypeScript)
- Pattern: MVC (Model - View - Controller)

Structure:
- components → reusable UI
- views/pages → user views
- views/admin → admin panel
- controllers → logic
- models → data layer

Alias:
- "@" → src

---

## 👥 User Roles

### Guest (User)
- Register and login
- Search properties
- Make reservations
- Manage profile

### Host
- Create and manage properties
- Manage availability
- View reservations

### Admin
- Manage users
- Manage properties
- Manage reservations
- View reports and metrics

---

## 📋 Functional Requirements

### RF-001: User Management
- Authentication and registration
- Role-based access (guest, host, admin)

### RF-002: Property Management
- Create, edit, delete properties
- Add images and details

### RF-003: Search System
- Filters: location, dates, price, guests

### RF-004: Booking System
- Create and cancel reservations
- Availability validation

### RF-005: Payment System
- Payment processing (simulated for MVP)

### RF-006: Reviews
- Users can rate properties

### RF-007: Messaging
- Chat between users

### RF-008: Admin Panel
- Manage users, properties, reservations

### RF-009: Notifications
- Alerts and updates

### RF-010: Favorites
- Save properties

### RF-011: Security
- Role-based access control

### RF-012: Reports
- Admin analytics

---

## 🚫 Rules for Code Generation

- DO NOT use TypeScript
- Use JavaScript (.jsx)
- Use alias @ for imports
- Reuse existing components
- Avoid duplicate components
- Follow MVC structure

---

## 🎯 Development Focus

This is an MVP, prioritize:
- Core features over complexity
- Clean and scalable structure
- Reusable components