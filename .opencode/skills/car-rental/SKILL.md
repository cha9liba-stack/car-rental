---
name: car-rental
description: Use when working on the Car Rental Management System (نظام إدارة كراء السيارات). Includes project structure, Firebase schema, and Next.js conventions.
---

# Car Rental Management System

## Project Structure
- `car-rental/` - Next.js 16 App Router project
- Firebase Firestore for database
- Tailwind CSS v4 for styling
- Framer Motion for animations
- Recharts for charts

## Firebase Collections
- `clients` - Client data (name, phone, email, cin, etc.)
- `cars` - Car data (brand, model, plate, price, status, etc.)
- `contracts` - Rental contracts (clientId, carId, dates, amounts, status)
- `payments` - Payment records (contractId, amount, method, type)
- `maintenance` - Car maintenance records

## Conventions
- All UI text is in Arabic
- RTL layout (`dir="rtl"`)
- Use `@/lib/utils.ts` for shared utilities (formatCurrency, formatDate, etc.)
- Use `@/lib/firestore.ts` for database CRUD operations
- Use `@/components/ui/*` for reusable UI components
- Client components use "use client" directive
- Firebase config in `.env.local` (not committed)
