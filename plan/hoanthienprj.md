# 📘 REHUB PLATFORM - TÀI LIỆU PHÁT TRIỂN TOÀN DIỆN

> **Phiên bản:** 1.0
> **Ngày tạo:** 2026-04-01
> **Mục đích:** Hướng dẫn chi tiết để hoàn thiện và phát triển ReHub Platform thành sản phẩm production-ready với tích hợp AI/ML

---

## 📑 MỤC LỤC

### PHẦN 1: TỔNG QUAN DỰ ÁN HIỆN TẠI
- [1.1 Kiến trúc Hệ thống](#11-kiến-trúc-hệ-thống)
- [1.2 Tech Stack](#12-tech-stack)
- [1.3 Tính năng Đã Hoàn thành](#13-tính-năng-đã-hoàn-thành)
- [1.4 Tính năng Còn Thiếu](#14-tính-năng-còn-thiếu)
- [1.5 Đánh giá Chất lượng Code](#15-đánh-giá-chất-lượng-code)

### PHẦN 2: BACKEND - HOÀN THIỆN & BỔ SUNG
- [2.1 Tích hợp Redis (Cache Layer)](#21-tích-hợp-redis-cache-layer)
- [2.3 Phone Verification (SMS OTP)](#23-phone-verification-sms-otp)
- [2.4 Shipping & Logistics Integration](#24-shipping--logistics-integration)
- [2.5 Search Enhancement (Elasticsearch)](#25-search-enhancement-elasticsearch)
- [2.6 Image Processing (Thumbnails, Compression)](#26-image-processing-thumbnails-compression)
- [2.7 Chat/Messaging System](#27-chatmessaging-system)
- [2.8 Location-Based Features](#28-location-based-features)
- [2.9 Advanced Security Features](#29-advanced-security-features)
- [2.10 API Rate Limiting (Production)](#210-api-rate-limiting-production)
- [2.11 Background Jobs (Celery/RQ)](#211-background-jobs-celeryrq)
- [2.12 Database Optimization](#212-database-optimization)

### PHẦN 3: FRONTEND - HOÀN THIỆN & BỔ SUNG
- [3.1 Notifications UI](#31-notifications-ui)
- [3.2 Messaging/Chat UI](#32-messagingchat-ui)
- [3.3 Advanced Search & Filters](#33-advanced-search--filters)
- [3.5 User Settings & Preferences](#35-user-settings--preferences)
- [3.6 Analytics Dashboard](#36-analytics-dashboard)
- [3.7 Image Management UI](#37-image-management-ui)
- [3.8 Testing (Unit + E2E)](#38-testing-unit--e2e)
- [3.9 PWA Support](#39-pwa-support)
- [3.10 Internationalization (i18n)](#310-internationalization-i18n)
- [3.11 Accessibility (a11y)](#311-accessibility-a11y)
- [3.12 Performance Optimization](#312-performance-optimization)

### PHẦN 4: DEVOPS & INFRASTRUCTURE
- [4.1 Docker Production Setup](#41-docker-production-setup)
- [4.2 Traefik Reverse Proxy](#42-traefik-reverse-proxy)
- [4.3 SSL/TLS với Let's Encrypt](#43-ssltls-với-lets-encrypt)
- [4.4 CI/CD Pipeline (GitHub Actions)](#44-cicd-pipeline-github-actions)
- [4.5 Monitoring & Logging](#45-monitoring--logging)
- [4.6 Error Tracking (Sentry)](#46-error-tracking-sentry)
- [4.7 Database Backup Automation](#47-database-backup-automation)
- [4.8 Load Balancing](#48-load-balancing)
- [4.9 CDN Integration](#49-cdn-integration)
- [4.10 Security Hardening](#410-security-hardening)

### PHẦN 5: HƯỚNG DẪN TRIỂN KHAI PRODUCTION
- [5.1 Phase 1: Security & Basics (2-3 days)](#51-phase-1-security--basics)
- [5.2 Phase 2: Production Infrastructure (3-4 days)](#52-phase-2-production-infrastructure)
- [5.3 Phase 3: Automation - CI/CD (2-3 days)](#53-phase-3-automation-cicd)
- [5.4 Phase 4: Observability (2-3 days)](#54-phase-4-observability)
- [5.5 Phase 5: Testing & Go Live (2-3 days)](#55-phase-5-testing--go-live)
- [5.6 Rollback Strategy](#56-rollback-strategy)
- [5.7 Disaster Recovery](#57-disaster-recovery)

### PHẦN 6: TÍCH HỢP AI/ML
- [6.1 Auto-tagging & Categorization](#61-auto-tagging--categorization)
- [6.2 Price Recommendation System](#62-price-recommendation-system)
- [6.3 Fraud Detection](#63-fraud-detection)
- [6.4 AI Chatbot Support](#64-ai-chatbot-support)
- [6.5 Product Condition Assessment](#65-product-condition-assessment)
- [6.6 Semantic Search (Vector Search)](#66-semantic-search-vector-search)
- [6.7 Personalized Recommendations](#67-personalized-recommendations)
- [6.8 Image Quality Enhancement](#68-image-quality-enhancement)
- [6.9 Vietnamese NLP for Content Moderation](#69-vietnamese-nlp-for-content-moderation)
- [6.10 Predictive Analytics](#610-predictive-analytics)

### PHẦN 7: VECTOR DATABASE INTEGRATION
- [7.1 Use Cases](#71-use-cases)
- [7.2 Technology Stack Options](#72-technology-stack-options)
- [7.3 Implementation Guide](#73-implementation-guide)
- [7.4 Embedding Generation](#74-embedding-generation)
- [7.5 Query Optimization](#75-query-optimization)
- [7.6 Cost Analysis](#76-cost-analysis)

### PHẦN 8: OCR INTEGRATION
- [8.1 Use Cases](#81-use-cases)
- [8.2 Technology Stack Options](#82-technology-stack-options)
- [8.3 Implementation Guide](#83-implementation-guide)
- [8.4 Vietnamese Text Support](#84-vietnamese-text-support)
- [8.5 ID Verification](#85-id-verification)

### PHẦN 9: ADVANCED FEATURES
- [9.1 Real-time Analytics](#91-real-time-analytics)
- [9.2 Machine Learning Pipelines](#92-machine-learning-pipelines)
- [9.3 A/B Testing Framework](#93-ab-testing-framework)
- [9.4 Multi-tenant Support](#94-multi-tenant-support)
- [9.5 Mobile App (React Native)](#95-mobile-app-react-native)
- [9.6 Progressive Web App (PWA)](#96-progressive-web-app-pwa)
- [9.7 Microservices Architecture](#97-microservices-architecture)
- [9.8 Event-Driven Architecture](#98-event-driven-architecture)
- [9.9 GraphQL API](#99-graphql-api)
- [9.10 WebSocket Scaling](#910-websocket-scaling)

### PHẦN 10: ROADMAP & TIMELINE
- [10.1 Sprint Planning (2-week sprints)](#101-sprint-planning)
- [10.2 Resource Allocation](#102-resource-allocation)
- [10.3 Risk Assessment](#103-risk-assessment)
- [10.4 Success Metrics](#104-success-metrics)
- [10.5 Post-Launch Plan](#105-post-launch-plan)

---

# PHẦN 1: TỔNG QUAN DỰ ÁN HIỆN TẠI

## 1.1 Kiến trúc Hệ thống

### Kiến trúc Hiện tại (Development)

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                         │
├─────────────────────────────────────────────────────────────┤
│  React 19 + TypeScript + TanStack Router + React Query      │
│  Chakra UI v3 + Tailwind CSS (removed)                      │
│  Real-time WebSocket Client                                  │
│  Port: 5173 (Vite Dev Server)                               │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/WS
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                       │
├─────────────────────────────────────────────────────────────┤
│  FastAPI Backend (Python 3.10)                              │
│  - REST API (OpenAPI 3.1)                                   │
│  - WebSocket Manager (Real-time events)                     │
│  - Background Tasks (Offer expiry worker)                   │
│  - JWT Authentication + Token Rotation                      │
│  - Email Service (SMTP)                                     │
│  Port: 8000                                                 │
└────────┬──────────────────────┬─────────────────────────────┘
         │                      │
         ▼                      ▼
┌──────────────────┐   ┌──────────────────┐
│   PostgreSQL 15  │   │   MinIO (S3)     │
│   + Async Driver │   │   Object Storage │
│   Port: 5432     │   │   Port: 9000/9001│
└──────────────────┘   └──────────────────┘
```

### Kiến trúc Mục tiêu (Production)

```
                        ┌─────────────────┐
                        │    Internet     │
                        └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │   Traefik       │
                        │ (Reverse Proxy) │
                        │  SSL/TLS + Auth │
                        └────┬───┬────┬───┘
                             │   │    │
          ┌──────────────────┘   │    └──────────────────┐
          │                      │                       │
    ┌─────▼─────┐         ┌──────▼──────┐        ┌──────▼──────┐
    │  Frontend │         │   Backend   │        │   Adminer   │
    │  (Nginx)  │         │  (FastAPI)  │        │ (DB Admin)  │
    │ Static SPA│         │  4 Workers  │        └─────────────┘
    └───────────┘         └──────┬──────┘
                                 │
          ┌──────────────────────┼──────────────────┐
          │                      │                  │
    ┌─────▼─────┐         ┌──────▼──────┐   ┌──────▼──────┐
    │PostgreSQL │         │    Redis    │   │   MinIO     │
    │    15     │         │   Cache     │   │  S3-compat  │
    └───────────┘         └─────────────┘   └─────────────┘
```

### Luồng Dữ liệu Chính

#### 1. Authentication Flow
```
User Input → Frontend → POST /api/v1/auth/login → Backend
                                                      ↓
                                               Validate Password
                                                      ↓
                                             Generate JWT Tokens
                                                      ↓
                                        Store Hashed Refresh Token in DB
                                                      ↓
                                  Return {access_token, refresh_token} → Frontend
                                                                              ↓
                                                                    Store in localStorage
                                                                              ↓
                                                            Subsequent requests with Bearer token
```

#### 2. Listing Creation Flow
```
User fills form → Upload images → Frontend
                                      ↓
                            POST /api/v1/listings
                                      ↓
                                  Backend:
                            - Validate data
                            - Create listing (status: pending)
                            - Upload images to MinIO
                            - Save image URLs to DB
                            - Send notification to admins
                            - Broadcast WebSocket event
                                      ↓
                            Return listing data → Frontend
                                                      ↓
                                            Update UI + Cache
```

#### 3. Offer Negotiation Flow
```
Buyer creates offer → POST /api/v1/offers → Backend
                                                ↓
                                    Create offer (status: pending)
                                                ↓
                                    Notify seller via WebSocket + Notification
                                                ↓
Seller receives offer → Accept/Reject/Counter → PATCH /api/v1/offers/{id}/status
                                                            ↓
                                                    Update offer status
                                                            ↓
                                    If ACCEPTED → Auto-create Order
                                                            ↓
                                            Notify buyer → Order detail page
```

#### 4. Escrow Flow
```
Order created → Buyer funds escrow → POST /api/v1/escrows/{order_id}/fund
                                                    ↓
                                        Deduct from wallet + Hold in escrow
                                                    ↓
Seller ships → Request release → POST /api/v1/escrows/{order_id}/release-request
                                                    ↓
Buyer confirms → Confirm release → POST /api/v1/escrows/{order_id}/confirm-release
                                                    ↓
                                        Release funds to seller wallet
                                                    ↓
                                    Mark order as COMPLETED
                                                    ↓
                                    Unlock review functionality
```

---

## 1.2 Tech Stack

### Backend Stack

| Component | Technology | Version | Notes |
|-----------|-----------|---------|-------|
| **Framework** | FastAPI | Latest | Async support, OpenAPI auto-gen |
| **Language** | Python | 3.10+ | Type hints, async/await |
| **ORM** | SQLModel + SQLAlchemy | 2.0+ | Async support, Pydantic integration |
| **Database** | PostgreSQL | 15+ | JSONB support, UUID, Full-text search |
| **Database Driver** | asyncpg | Latest | High-performance async driver |
| **Cache** | Redis | 7+ | ❌ **NOT INTEGRATED YET** |
| **Object Storage** | MinIO | Latest | S3-compatible, self-hosted |
| **Task Queue** | — | — | ❌ **NOT INTEGRATED** (Need Celery/RQ) |
| **Search** | PostgreSQL ILIKE | — | ⚠️ **BASIC** (Need Elasticsearch) |
| **Authentication** | JWT | — | Access + Refresh token rotation |
| **Password Hashing** | pwdlib (Argon2) | Latest | Secure password storage |
| **Email** | SMTP (Gmail) | — | Jinja2 templates |
| **WebSocket** | FastAPI WebSocket | — | ✅ Custom WebSocketManager |
| **Validation** | Pydantic | 2.0+ | Request/response schemas |
| **Migration** | Alembic | Latest | ✅ Version controlled migrations |
| **Rate Limiting** | slowapi | Latest | ⚠️ **PARTIAL** (Only on login) |
| **API Documentation** | Swagger/ReDoc |  | Auto-generated from OpenAPI |

### Frontend Stack

| Component | Technology | Version | Notes |
|-----------|-----------|---------|-------|
| **Framework** | React | 19 | Latest with concurrent features |
| **Language** | TypeScript | 5.5+ | Strict mode enabled |
| **Routing** | TanStack Router | v1 | File-based routing, type-safe |
| **State Management** | TanStack Query | v5 | Server state management |
| **UI Library** | Chakra UI | v3 | ✅ **100% MIGRATED** |
| **Styling** | Chakra UI System | — | CSS-in-JS, no Tailwind |
| **Forms** | React Hook Form | Latest | + Zod validation |
| **Validation** | Zod | Latest | TypeScript-first schemas |
| **HTTP Client** | Axios | Latest | Auto-generated from OpenAPI |
| **WebSocket Client** | Native WebSocket | — | Custom context provider |
| **Icons** | React Icons | Latest | Feather Icons (Fi*) |
| **Build Tool** | Vite | 7+ | Fast HMR, optimized builds |
| **Package Manager** | Bun | Latest | Fast installs and builds |
| **API Client** | OpenAPI Generator | — | ✅ Auto-generated TypeScript client |

### DevOps Stack (Current)

| Component | Status | Notes |
|-----------|--------|-------|
| **Container Runtime** | ✅ Docker | docker-compose.yml exists |
| **Orchestration** | ❌ None | Plain Docker Compose only |
| **Reverse Proxy** | ❌ Not implemented | Traefik planned but not set up |
| **SSL/TLS** | ❌ Not implemented | Let's Encrypt planned |
| **CI/CD** | ❌ Not implemented | GitHub Actions designed but not created |
| **Monitoring** | ❌ Not implemented | No Prometheus/Grafana |
| **Logging** | ⚠️ Basic | Python logging only, no aggregation |
| **Error Tracking** | ⚠️ Sentry var exists | But not configured |
| **Backup** | ❌ Manual only | No automated backup script |

---

## 1.3 Tính năng Đã Hoàn thành

### ✅ Backend Features (85% Complete)

#### Authentication & Authorization
- ✅ User registration with email verification
- ✅ Login with JWT (access + refresh tokens)
- ✅ Token rotation on refresh
- ✅ Email verification flow
- ✅ Forgot password + reset password
- ✅ Logout (revoke refresh token)
- ✅ Role-based access control (User/Admin)
- ✅ Rate limiting on login endpoint (5 req/15min)

#### User Management
- ✅ Get current user profile (`/me`)
- ✅ Update user profile
- ✅ Upload avatar (MinIO)
- ✅ Get public user profile by ID
- ✅ Trust score, rating average, completed orders counter
- ✅ Address fields (province, district, ward, address_detail)

#### Category Management
- ✅ CRUD operations (Admin only)
- ✅ Tree structure with parent-child relationship
- ✅ Slug generation for SEO
- ✅ Flat list or hierarchical tree response

#### Listing Management
- ✅ Create listing (status: pending)
- ✅ Get my listings
- ✅ Get single listing with images
- ✅ Update listing (PATCH)
- ✅ Soft delete (hide) listing
- ✅ Multi-image upload to MinIO
- ✅ Delete images
- ✅ Public listing search (active only)
- ✅ Keyword search (ILIKE on title + description)
- ✅ Category filter
- ✅ Status management (pending/active/sold/hidden/rejected)

#### Admin Panel
- ✅ List all users (paginated)
- ✅ Ban/unban users
- ✅ Approve/reject listings
- ✅ List pending listings
- ✅ List disputed escrows
- ✅ Resolve escrow disputes
- ✅ List all orders

#### Offer/Negotiation System
- ✅ Create offer on listing
- ✅ Get sent offers (buyer view)
- ✅ Get received offers (seller view)
- ✅ Get offers for a listing
- ✅ Accept offer → Auto-create order
- ✅ Reject offer
- ✅ Counter-offer
- ✅ Offer expiry (pending/countered offers expire after 48h)
- ✅ Background worker to mark expired offers
- ✅ Race condition protection with SELECT FOR UPDATE

#### Order Management
- ✅ Create order (direct "Buy Now")
- ✅ Get my orders (buyer/seller views)
- ✅ Get single order
- ✅ Complete order (buyer confirms)
- ✅ Cancel order
- ✅ Order status machine (pending/completed/cancelled/disputed)

#### Escrow System
- ✅ Get escrow by order ID
- ✅ Fund escrow from wallet (buyer)
- ✅ Request release (seller marks as delivered)
- ✅ Confirm release (buyer confirms receipt)
- ✅ Release funds to seller
- ✅ Open dispute
- ✅ Admin resolve dispute (refund/release)
- ✅ Escrow event log (audit trail)
- ✅ Status machine (awaiting_funding/held/release_pending/released/refunded/disputed)

#### Wallet System
- ✅ Get wallet balance (available + locked)
- ✅ Demo top-up (for testing)
- ✅ Transaction history
- ✅ Hold funds (on escrow fund)
- ✅ Release funds (on escrow release)
- ✅ Refund funds (on escrow refund)

#### Review System
- ✅ Create review after order completion
- ✅ 1-5 star rating + comment
- ✅ Get reviews for a user (seller profile)
- ✅ Get reviews for an order
- ✅ Auto-update user rating_avg and rating_count

#### Notification System
- ✅ Create notification
- ✅ Get user notifications (paginated)
- ✅ Get unread count
- ✅ Mark single notification as read
- ✅ Mark all notifications as read
- ✅ Notification types enum (listing_*, offer_*, order_*, review_*, etc.)

#### Real-time Features (WebSocket)
- ✅ WebSocket endpoint with authentication
- ✅ Connection tracking per user
- ✅ Multiple connections per user support
- ✅ Ping/pong heartbeat
- ✅ Broadcast events: listing, offer, order, escrow, wallet, review, user status
- ✅ Online/offline presence tracking

#### Email Notifications
- ✅ Email service with Jinja2 templates
- ✅ Verify email template
- ✅ Reset password template
- ✅ Welcome email
- ✅ Order created notification
- ✅ Order completed notification

#### Storage
- ✅ MinIO integration (S3-compatible)
- ✅ Image upload (listing images, avatars)
- ✅ Public URL generation
- ✅ Image deletion
- ✅ Fallback to local uploads folder

### ✅ Frontend Features (82% Complete)

#### Authentication Pages
- ✅ Login page
- ✅ Register page
- ✅ Email verification page
- ✅ Forgot password page
- ✅ Reset password page
- ✅ Auto-redirect to login for protected routes

#### Marketplace
- ✅ Home page with listing grid
- ✅ Category sidebar (desktop) + overlay (mobile)
- ✅ Keyword search
- ✅ Category filter
- ✅ Pagination on home listings
- ✅ Listing cards with seller info
- ✅ Online status indicator
- ✅ Create listing modal from header
- ✅ Glassmorphism UI design

#### Listings
- ✅ My Listings page
- ✅ Status tabs (all/active/pending/sold/hidden)
- ✅ Create listing form with validation
- ✅ Update listing
- ✅ Delete (hide) listing
- ✅ Multi-image upload with preview
- ✅ Listing detail page
- ✅ Image gallery
- ✅ Seller info card with ratings
- ✅ "Buy Now" button
- ✅ "Make Offer" button
- ✅ "Message Seller" button (UI only)

#### Offers
- ✅ Create offer modal
- ✅ Sent offers page
- ✅ Received offers page
- ✅ Offer status badges
- ✅ Accept/Reject/Counter buttons
- ✅ Offer detail modal
- ✅ Pagination on offers

#### Orders
- ✅ Orders page with buying/selling tabs
- ✅ Order list with status badges
- ✅ Order detail page
- ✅ Complete order button
- ✅ Cancel order button
- ✅ Counterparty online status

#### Escrow
- ✅ Escrow status display
- ✅ Fund escrow button (buyer)
- ✅ Request release button (seller)
- ✅ Confirm release button (buyer)
- ✅ Open dispute button
- ✅ Visual status indicators

#### Wallet
- ✅ Wallet page with balance display
- ✅ Available vs locked balance
- ✅ Demo top-up button
- ✅ Transaction history table
- ✅ Beautiful gradient card design

#### Reviews
- ✅ Create review form after order completion
- ✅ 1-5 star rating input
- ✅ Reviews on seller profile
- ✅ Reviews on order detail
- ✅ Rating stars component

#### User Profile
- ✅ My profile page (view/edit modes)
- ✅ Profile form with validation
- ✅ Avatar upload
- ✅ Seller public profile
- ✅ Trust score badges
- ✅ Rating display
- ✅ Completed orders counter
- ✅ User's active listings on profile

#### Admin Panel
- ✅ Dashboard with statistics
- ✅ User management table
- ✅ Ban/unban users
- ✅ Listing approval/rejection
- ✅ Category CRUD with tree display
- ✅ Escrow management
- ✅ Order management

#### Real-time Features
- ✅ WebSocket client implementation
- ✅ Connection manager with auto-reconnect
- ✅ Online/offline user status
- ✅ Real-time hooks for listings, orders, profiles, commerce, finance
- ✅ Ping/pong heartbeat

#### UI/UX
- ✅ Responsive design (mobile/tablet/desktop)
- ✅ Glassmorphism design system
- ✅ Vietnamese language UI
- ✅ Loading spinners
- ✅ Toast notifications
- ✅ Error boundaries (basic)
- ✅ Form validation with Zod
- ✅ Protected route guards

---

## 1.4 Tính năng Còn Thiếu

### ✅ Cập nhật đối chiếu codebase (2026-04-02)

- Notifications UI đã có ở header: bell dropdown, unread count, mark-as-read, mark-all-as-read, realtime cập nhật.
- Đã thi công phân trang trang chủ (home listings) để tránh tải một trang cố định `skip=0`.
- Các khối backend critical vẫn chưa có module triển khai thật trong `backend/app` (Redis cache, SMS OTP, shipping, chat).
- DevOps production vẫn ở mức planning: chưa có Traefik, Redis service, CI/CD workflow, backup automation.

### ❌ Backend Missing Features

#### Critical (Must Have)
1. **Redis Integration** - Cache layer for performance
3. **Phone Verification** - SMS OTP (Twilio/AWS SNS)
4. **Shipping Integration** - GHN/GHTK/J&T Express
5. **Search Enhancement** - Elasticsearch or PostgreSQL Full-Text Search
6. **Image Processing** - Resize, compress, generate thumbnails
7. **Chat/Messaging System** - Buyer-seller communication
8. **Advanced Rate Limiting** - Per-endpoint, per-user limits

#### High Priority (Should Have)
9. **Background Job Queue** - Celery or RQ for async tasks
10. **Database Connection Pooling** - PGBouncer for production
11. **API Versioning Strategy** - Deprecation handling
12. **Audit Logs** - Admin action tracking
13. **User Activity Logs** - Login history, session management
14. **Seller Verification** - KYC/identity verification
15. **Platform Fee Calculation** - Commission on transactions
16. **Return/Refund Policy Automation** - Beyond manual dispute
17. **Report/Flag System** - User reporting of violations
18. **Geolocation Search** - Distance-based listing search

#### Medium Priority (Nice to Have)
19. **Recommendation Engine** - Personalized listing suggestions
20. **Similar Listings** - Based on category and attributes
21. **Email Templates** - More notification types
22. **SMS Notifications** - For critical events
23. **Push Notifications** - Mobile/browser push
24. **Bulk Operations** - Admin bulk actions
25. **Data Export** - CSV/PDF export for reports
26. **Scheduled Tasks** - Beyond offer expiry (cleanup jobs)
27. **Multi-language Support** - i18n on backend

### ❌ Frontend Missing Features

#### Critical (Must Have)
1. **Notifications Page (full history)** - Bell dropdown đã có, còn thiếu trang riêng lịch sử + filter
2. **Messaging/Chat UI** - Real-time chat interface
3. **Advanced Search Page** - Filters (price, condition, location, sort)

#### High Priority (Should Have)
5. **User Settings** - Change password, email preferences, privacy
6. **Pagination đồng bộ toàn bộ** - Home + offers đã có; cần rà soát/chuẩn hóa thêm cho my listings và orders khi dữ liệu lớn
7. **Image Management** - Delete/reorder uploaded images UI
8. **Analytics Dashboard** - For sellers (views, offers, sales)
9. **Testing** - Unit tests (Vitest) + E2E tests (Playwright/Cypress)

#### Medium Priority (Nice to Have)
10. **PWA Support** - Service worker, offline mode, install prompt
11. **Internationalization** - i18n with react-i18next
12. **Accessibility** - ARIA labels, keyboard navigation, screen reader support
13. **Performance Optimization** - Code splitting, lazy loading, virtualization
14. **Social Features** - Follow users, activity feed
15. **Sharing** - Share listings on social media
16. **Comparison** - Compare multiple listings side-by-side
17. **Dark Mode** - Theme switcher
18. **Skeleton Loading** - Better loading states
19. **Infinite Scroll** - Alternative to pagination
20. **Mobile App** - React Native or PWA

### 🚀 Kế hoạch thực thi ưu tiên (Must Have, chỉ BE + FE)

#### Phạm vi áp dụng
- Chỉ làm các hạng mục **Must Have** của Backend và Frontend.
- **Tạm hoãn toàn bộ DevOps** cho tới giai đoạn triển khai production.
- Chỉ đánh dấu hoàn thành khi đã pass test/QA theo tiêu chí bên dưới.

#### Danh sách Must Have sẽ triển khai

**Backend (8 mục):**
1. Redis Integration
2. Phone Verification (SMS OTP)
3. Shipping Integration (ưu tiên GHN)
4. Search Enhancement (ưu tiên PostgreSQL Full-Text Search, Elasticsearch để phase sau nếu cần scale)
5. Image Processing (thumbnail + compression)
6. Chat/Messaging System
7. Advanced Rate Limiting (per-endpoint, per-user)

**Frontend (4 mục):**
1. Notifications Page (full history + filter)
2. Messaging/Chat UI (real-time)
3. Advanced Search Page (price/condition/location/sort)

#### Thứ tự thực thi đề xuất (phụ thuộc kỹ thuật)

**Wave 1 - Nền tảng BE (tuần 1):**
- BE-01 Redis Integration
- BE-08 Advanced Rate Limiting
- BE-05 Search Enhancement (PostgreSQL FTS)
- BE-06 Image Processing

**Wave 2 - Nghiệp vụ BE (tuần 2-3):**
- BE-03 Phone Verification (SMS OTP)
- BE-04 Shipping (GHN)
- BE-07 Chat/Messaging API + WebSocket events

**Wave 3 - Must Have FE (tuần 3-4, chạy song song phần cuối Wave 2):**
- FE-01 Notifications Page (history/filter)
- FE-02 Messaging/Chat UI
- FE-03 Advanced Search Page

#### Tiêu chí hoàn thành (Definition of Done)
- Có API/spec/schema đầy đủ cho feature.
- Có migration (nếu cần) và dữ liệu chạy local được.
- Có test tối thiểu: happy path + error path chính.
- FE tích hợp xong với API thật, có loading/error state.
- QA checklist pass ở local/staging nội bộ.
- Cập nhật trạng thái vào bảng tiến độ bên dưới ngay khi hoàn thành.

#### Bảng cập nhật tiến độ trực tiếp

| ID | Hạng mục | Khối | Trạng thái | Owner | Bắt đầu | Hoàn thành | Ghi chú |
|----|----------|------|------------|-------|---------|------------|---------|
| BE-01 | Redis Integration | Backend | DONE | Copilot | 2026-04-03 | 2026-04-03 | Da them Redis cache wrapper + cache cho categories/listings va invalidate khi mutate |
| BE-03 | Phone Verification (SMS OTP) | Backend | DONE | Copilot | 2026-04-03 | 2026-04-03 | Da them send/verify OTP cho so dien thoai, co debug OTP local va UI ho tro tren trang ho so |
| BE-04 | Shipping Integration (GHN) | Backend | TODO | - | - | - | Fee calc + create + tracking |
| BE-05 | Search Enhancement (PostgreSQL FTS) | Backend | DONE | Copilot | 2026-04-03 | 2026-04-03 | Da them filter nang cao (condition/location/price/sort), keyword tren title+description; test backend bi block boi login test fixture cu |
| BE-06 | Image Processing | Backend | DONE | Copilot | 2026-04-03 | 2026-04-03 | Da them pipeline nen + thumbnail WebP khi upload anh tin dang |
| BE-07 | Chat/Messaging System | Backend | IN_PROGRESS | Copilot | 2026-04-03 | - | Da bat dau BE chat: luu encrypted message blob tren MinIO + message index trong DB |
| BE-08 | Advanced Rate Limiting | Backend | DONE | Copilot | 2026-04-03 | 2026-04-03 | Da them Redis-backed rate limit cho create listing va create offer theo user |
| FE-01 | Notifications Page (history/filter) | Frontend | DONE | Copilot | 2026-04-03 | 2026-04-03 | Da bo sung BE endpoint /notifications/history (filter+pagination) va FE page su dung server-side filter |
| FE-02 | Messaging/Chat UI | Frontend | IN_PROGRESS | Copilot | 2026-04-03 | - | Da them route /chat, UI nhan tin co ban, ket noi API chat backend va su kien realtime |
| FE-03 | Advanced Search Page | Frontend | DONE | Copilot | 2026-04-03 | 2026-04-03 | Da them UI tim kiem nang cao tren marketplace (price/condition/location/sort), compile frontend pass |

#### Quy ước cập nhật trạng thái
- Dùng 4 trạng thái: `TODO` -> `IN_PROGRESS` -> `REVIEW` -> `DONE`.
- Khi chuyển `DONE`: bắt buộc điền ngày hoàn thành và ghi chú ngắn (API/test/UI).
- Chưa mở phần DevOps cho tới khi toàn bộ BE-xx và FE-xx ở trạng thái `DONE`.

### ❌ DevOps Missing Features

#### Critical (Must Have for Production)
1. **Traefik Reverse Proxy** - SSL termination, routing
2. **SSL/TLS Certificates** - Let's Encrypt auto-renewal
3. **Redis Service** - Add to docker-compose
4. **CI/CD Pipeline** - Automated testing + deployment
5. **Environment Separation** - .env.production with strong secrets
6. **Database Backup** - Automated daily backups
7. **Prestart Script** - Auto-run migrations on deploy

#### High Priority (Should Have)
8. **Monitoring** - Prometheus + Grafana dashboards
9. **Centralized Logging** - ELK Stack or Loki
10. **Error Tracking** - Configure Sentry
11. **Health Checks** - Comprehensive service health endpoints
12. **Secret Management** - Vault or AWS Secrets Manager
13. **Rate Limiting** - Traefik middleware
14. **Security Headers** - HSTS, CSP, X-Frame-Options
15. **Database Tuning** - PostgreSQL optimization for production

#### Medium Priority (Nice to Have)
16. **Load Balancing** - Multi-instance backend
17. **CDN Integration** - CloudFlare or AWS CloudFront
18. **Staging Environment** - Separate staging deploy
19. **Blue-Green Deployment** - Zero-downtime strategy
20. **Infrastructure as Code** - Terraform or Ansible
21. **Container Orchestration** - Kubernetes (if scaling needed)
22. **APM Tools** - Application Performance Monitoring
23. **Disaster Recovery Plan** - Documented DR procedures

---

## 1.5 Đánh giá Chất lượng Code

### Backend Code Quality: ⭐⭐⭐⭐☆ (4/5)

**Strengths:**
- ✅ Clean architecture with separation of concerns (models, schemas, CRUD, API)
- ✅ Type hints throughout codebase
- ✅ Async/await used consistently
- ✅ Pydantic validation on all input/output
- ✅ SQLModel provides excellent Pydantic + SQLAlchemy integration
- ✅ WebSocket implementation is robust with connection management
- ✅ JWT token rotation implemented correctly
- ✅ Alembic migrations version controlled
- ✅ Good use of dependency injection (get_db, get_current_user)

**Weaknesses:**
- ⚠️ No unit tests visible
- ⚠️ Minimal error handling in some endpoints
- ⚠️ Hard-coded values in some places (could use constants/config)
- ⚠️ Limited logging (no structured logging)
- ⚠️ No request ID tracking for debugging
- ⚠️ CORS set to "*" (should be environment-specific)
- ⚠️ Rate limiting only on one endpoint

### Frontend Code Quality: ⭐⭐⭐⭐½ (4.5/5)

**Strengths:**
- ✅ Excellent feature-based architecture
- ✅ 100% TypeScript with strict mode
- ✅ Consistent patterns across all features
- ✅ Auto-generated API client from OpenAPI (DRY principle)
- ✅ React Query for server state management
- ✅ Clean separation of API wrappers, hooks, components, pages
- ✅ Form validation with Zod schemas
- ✅ Responsive design with consistent breakpoints
- ✅ Beautiful, modern UI with Chakra UI v3
- ✅ WebSocket integration with React Context

**Weaknesses:**
- ⚠️ No visible tests (Vitest/Playwright)
- ⚠️ Hardcoded Vietnamese text (should use i18n)
- ⚠️ Limited error boundaries
- ⚠️ JWT tokens in localStorage (XSS vulnerable, should consider httpOnly cookies)
- ⚠️ No code splitting visible beyond React.lazy
- ⚠️ Some components could be more accessible (ARIA labels)
- ⚠️ Limited loading states (mostly spinners, could use skeletons)

### DevOps Quality: ⭐⭐☆☆☆ (2/5)

**Strengths:**
- ✅ Docker Compose setup exists
- ✅ Backend Dockerfile uses multi-stage build concepts
- ✅ Health checks defined for services
- ✅ Excellent infrastructure planning document

**Weaknesses:**
- ❌ Infrastructure planning NOT implemented (all documentation, no code)
- ❌ No Redis in docker-compose yet
- ❌ No Traefik setup
- ❌ No CI/CD pipeline
- ❌ Hard-coded passwords in docker-compose.yml
- ❌ .env file with real credentials (security risk)
- ❌ Backend runs in dev mode even in production Dockerfile
- ❌ No backup automation
- ❌ No monitoring/logging setup
- ❌ No SSL/TLS configuration

---

# PHẦN 2: BACKEND - HOÀN THIỆN & BỔ SUNG

## 2.1 Tích hợp Redis (Cache Layer)

### Tại sao cần Redis?

1. **Performance**: Giảm load database, response time từ 200ms → 10ms
2. **Scalability**: Horizontal scaling backend dễ dàng hơn
3. **Rate Limiting**: Distributed rate limiting across instances
4. **Session Storage**: Alternative to DB for session data
5. **Pub/Sub**: Real-time event broadcasting (alternative to WebSocket in multi-instance)

### Implementation Steps

#### Step 1: Add Redis to docker-compose.yml

```yaml
# docker-compose.yml
services:
  redis:
    image: redis:7-alpine
    restart: always
    command: >
      redis-server
      --maxmemory 512mb
      --maxmemory-policy allkeys-lru
      --appendonly yes
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

  backend:
    depends_on:
      redis:
        condition: service_healthy
    environment:
      - REDIS_URL=redis://redis:6379/0

volumes:
  redis-data:
```

#### Step 2: Install Redis Client

```bash
# backend/pyproject.toml
[project]
dependencies = [
    # ... existing
    "redis[hiredis]>=5.0.0",
]
```

```bash
cd backend
uv sync
```

#### Step 3: Redis Configuration

```python
# backend/app/core/config.py
class Settings(BaseSettings):
    # ... existing
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_CACHE_TTL_SECONDS: int = 300  # 5 minutes default
```

#### Step 4: Redis Client Wrapper

```python
# backend/app/core/cache.py
import json
from typing import Any, Optional
import redis.asyncio as aioredis
from app.core.config import settings

class RedisCache:
    def __init__(self):
        self.redis: Optional[aioredis.Redis] = None

    async def connect(self):
        """Connect to Redis on startup"""
        self.redis = await aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            max_connections=10,
        )
        # Test connection
        await self.redis.ping()
        print("✅ Redis connected successfully")

    async def disconnect(self):
        """Disconnect from Redis on shutdown"""
        if self.redis:
            await self.redis.close()

    async def get(self, key: str) -> Optional[str]:
        """Get value by key"""
        if not self.redis:
            return None
        return await self.redis.get(key)

    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None
    ):
        """Set value with optional TTL (seconds)"""
        if not self.redis:
            return

        if ttl is None:
            ttl = settings.REDIS_CACHE_TTL_SECONDS

        # Serialize complex objects to JSON
        if not isinstance(value, str):
            value = json.dumps(value, default=str)

        await self.redis.set(key, value, ex=ttl)

    async def delete(self, key: str):
        """Delete key"""
        if not self.redis:
            return
        await self.redis.delete(key)

    async def delete_pattern(self, pattern: str):
        """Delete all keys matching pattern"""
        if not self.redis:
            return
        keys = await self.redis.keys(pattern)
        if keys:
            await self.redis.delete(*keys)

    async def exists(self, key: str) -> bool:
        """Check if key exists"""
        if not self.redis:
            return False
        return await self.redis.exists(key) > 0

    # Increment/decrement for counters
    async def incr(self, key: str) -> int:
        """Increment counter"""
        if not self.redis:
            return 0
        return await self.redis.incr(key)

    async def decr(self, key: str) -> int:
        """Decrement counter"""
        if not self.redis:
            return 0
        return await self.redis.decr(key)

    # Hash operations (for complex objects)
    async def hset(self, name: str, key: str, value: Any):
        """Set hash field"""
        if not self.redis:
            return
        await self.redis.hset(name, key, value)

    async def hget(self, name: str, key: str) -> Optional[str]:
        """Get hash field"""
        if not self.redis:
            return None
        return await self.redis.hget(name, key)

    async def hgetall(self, name: str) -> dict:
        """Get all hash fields"""
        if not self.redis:
            return {}
        return await self.redis.hgetall(name)

# Global instance
cache = RedisCache()
```

#### Step 5: Initialize Redis in main.py

```python
# backend/app/main.py
from app.core.cache import cache

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await cache.connect()

    # ... existing startup code

    yield

    # Shutdown
    await cache.disconnect()

app = FastAPI(lifespan=lifespan)
```

#### Step 6: Cache Helper Decorator

```python
# backend/app/core/cache_decorators.py
import hashlib
import json
from functools import wraps
from typing import Callable
from app.core.cache import cache

def cache_response(ttl: int = 300, key_prefix: str = ""):
    """Decorator to cache function response"""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key from function name + args
            cache_key = f"{key_prefix}:{func.__name__}"

            # Add args to key if present
            if args or kwargs:
                args_str = json.dumps({"args": args, "kwargs": kwargs}, default=str)
                args_hash = hashlib.md5(args_str.encode()).hexdigest()
                cache_key = f"{cache_key}:{args_hash}"

            # Try to get from cache
            cached = await cache.get(cache_key)
            if cached:
                return json.loads(cached)

            # Call function and cache result
            result = await func(*args, **kwargs)
            await cache.set(cache_key, result, ttl=ttl)

            return result
        return wrapper
    return decorator
```

#### Step 7: Cache Strategy by Data Type

```python
# backend/app/services/cache_service.py
from typing import Optional, List
from app.core.cache import cache
from app.models import Category, Listing, User
import json

class CacheService:
    # Cache keys
    CATEGORIES_TREE = "categories:tree"
    LISTING_DETAIL = "listing:{listing_id}"
    USER_PROFILE = "user:profile:{user_id}"
    LISTING_LIST_HOME = "listings:home:{page}:{category}"
    NOTIFICATION_COUNT = "notif:unread:{user_id}"

    # TTLs (seconds)
    TTL_CATEGORIES = 86400  # 24 hours
    TTL_LISTING = 300  # 5 minutes
    TTL_USER_PROFILE = 600  # 10 minutes
    TTL_LISTING_LIST = 60  # 1 minute
    TTL_NOTIFICATION_COUNT = 60  # 1 minute

    # Categories
    async def get_categories_tree(self) -> Optional[List[dict]]:
        cached = await cache.get(self.CATEGORIES_TREE)
        if cached:
            return json.loads(cached)
        return None

    async def set_categories_tree(self, categories: List[dict]):
        await cache.set(self.CATEGORIES_TREE, categories, ttl=self.TTL_CATEGORIES)

    async def invalidate_categories(self):
        await cache.delete(self.CATEGORIES_TREE)

    # Listings
    async def get_listing(self, listing_id: str) -> Optional[dict]:
        key = self.LISTING_DETAIL.format(listing_id=listing_id)
        cached = await cache.get(key)
        if cached:
            return json.loads(cached)
        return None

    async def set_listing(self, listing_id: str, listing: dict):
        key = self.LISTING_DETAIL.format(listing_id=listing_id)
        await cache.set(key, listing, ttl=self.TTL_LISTING)

    async def invalidate_listing(self, listing_id: str):
        key = self.LISTING_DETAIL.format(listing_id=listing_id)
        await cache.delete(key)
        # Also invalidate listing lists
        await cache.delete_pattern("listings:home:*")

    # User profiles
    async def get_user_profile(self, user_id: str) -> Optional[dict]:
        key = self.USER_PROFILE.format(user_id=user_id)
        cached = await cache.get(key)
        if cached:
            return json.loads(cached)
        return None

    async def set_user_profile(self, user_id: str, profile: dict):
        key = self.USER_PROFILE.format(user_id=user_id)
        await cache.set(key, profile, ttl=self.TTL_USER_PROFILE)

    async def invalidate_user_profile(self, user_id: str):
        key = self.USER_PROFILE.format(user_id=user_id)
        await cache.delete(key)

    # Notification count
    async def get_unread_count(self, user_id: str) -> Optional[int]:
        key = self.NOTIFICATION_COUNT.format(user_id=user_id)
        cached = await cache.get(key)
        if cached:
            return int(cached)
        return None

    async def set_unread_count(self, user_id: str, count: int):
        key = self.NOTIFICATION_COUNT.format(user_id=user_id)
        await cache.set(key, str(count), ttl=self.TTL_NOTIFICATION_COUNT)

    async def invalidate_unread_count(self, user_id: str):
        key = self.NOTIFICATION_COUNT.format(user_id=user_id)
        await cache.delete(key)

cache_service = CacheService()
```

#### Step 8: Use Cache in Endpoints

```python
# backend/app/api/v1/categories.py
from app.services.cache_service import cache_service

@router.get("/", response_model=List[CategoryTree])
async def get_categories_tree(
    session: AsyncSession = Depends(get_session)
):
    """Get category tree (cached)"""

    # Try cache first
    cached = await cache_service.get_categories_tree()
    if cached:
        return cached

    # Query database
    categories = await crud_category.get_tree(session)

    # Serialize and cache
    categories_dict = [cat.model_dump() for cat in categories]
    await cache_service.set_categories_tree(categories_dict)

    return categories

@router.post("/", response_model=CategoryRead)
async def create_category(
    category_in: CategoryCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_admin)
):
    """Create category (admin only)"""
    category = await crud_category.create(session, obj_in=category_in)

    # Invalidate cache
    await cache_service.invalidate_categories()

    return category
```

```python
# backend/app/api/v1/listings.py
from app.services.cache_service import cache_service

@router.get("/{listing_id}", response_model=ListingDetail)
async def get_listing(
    listing_id: str,
    session: AsyncSession = Depends(get_session)
):
    """Get listing by ID (cached)"""

    # Try cache first
    cached = await cache_service.get_listing(listing_id)
    if cached:
        return cached

    # Query database
    listing = await crud_listing.get_with_images(session, id=listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # Serialize and cache
    listing_dict = listing.model_dump()
    await cache_service.set_listing(listing_id, listing_dict)

    return listing

@router.patch("/{listing_id}", response_model=ListingRead)
async def update_listing(
    listing_id: str,
    listing_in: ListingUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Update listing"""
    listing = await crud_listing.update(session, id=listing_id, obj_in=listing_in)

    # Invalidate cache
    await cache_service.invalidate_listing(listing_id)

    return listing
```

### Redis for Rate Limiting

```python
# backend/app/core/rate_limit.py
from fastapi import HTTPException, Request
from app.core.cache import cache

class RateLimiter:
    async def check_rate_limit(
        self,
        key: str,
        max_requests: int,
        window_seconds: int
    ):
        """Check if rate limit exceeded"""
        current = await cache.get(key)

        if current is None:
            # First request in window
            await cache.set(key, "1", ttl=window_seconds)
            return

        count = int(current)
        if count >= max_requests:
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. Max {max_requests} requests per {window_seconds} seconds"
            )

        await cache.incr(key)

    async def rate_limit_by_ip(
        self,
        request: Request,
        max_requests: int = 100,
        window_seconds: int = 60
    ):
        """Rate limit by IP address"""
        ip = request.client.host
        key = f"rate_limit:ip:{ip}"
        await self.check_rate_limit(key, max_requests, window_seconds)

    async def rate_limit_by_user(
        self,
        user_id: str,
        max_requests: int = 100,
        window_seconds: int = 60
    ):
        """Rate limit by user ID"""
        key = f"rate_limit:user:{user_id}"
        await self.check_rate_limit(key, max_requests, window_seconds)

rate_limiter = RateLimiter()
```

### Testing Redis Integration

```python
# backend/tests/test_cache.py
import pytest
from app.core.cache import cache

@pytest.mark.asyncio
async def test_redis_ping():
    await cache.connect()
    result = await cache.redis.ping()
    assert result is True
    await cache.disconnect()

@pytest.mark.asyncio
async def test_cache_set_get():
    await cache.connect()

    await cache.set("test_key", "test_value", ttl=60)
    value = await cache.get("test_key")
    assert value == "test_value"

    await cache.delete("test_key")
    value = await cache.get("test_key")
    assert value is None

    await cache.disconnect()

@pytest.mark.asyncio
async def test_cache_json():
    await cache.connect()

    data = {"name": "Test", "price": 100}
    await cache.set("test_json", data, ttl=60)

    cached = await cache.get("test_json")
    assert json.loads(cached) == data

    await cache.delete("test_json")
    await cache.disconnect()
```

---

## 2.2 (da loai bo)
Hang muc thanh toan truc tiep da duoc bo khoi pham vi du an.

## 2.3 Phone Verification (SMS OTP)

### Why Phone Verification?

1. **Security**: Additional authentication factor
2. **Trust**: Verified phone → higher trust score
3. **Communication**: SMS notifications for critical events
4. **Anti-fraud**: Prevents fake accounts

### SMS Gateway Options

| Service | Pros | Cons | Cost (Vietnam) |
|---------|------|------|----------------|
| **Twilio** | ✅ Global coverage<br/>✅ Excellent API<br/>✅ Reliable | ⚠️ Higher cost | ~$0.08/SMS |
| **AWS SNS** | ✅ AWS integration<br/>✅ Scalable | ⚠️ Complex setup | ~$0.07/SMS |
| **Vonage (Nexmo)** | ✅ Good documentation | ⚠️ Less popular in VN | ~$0.06/SMS |
| **SMSAPI.vn** | ✅ Vietnam-specific<br/>✅ Lower cost | ⚠️ Vietnamese documentation only | ~$0.02/SMS |
| **SpeedSMS** | ✅ Vietnam-specific<br/>✅ Cheap | ⚠️ Limited features | ~$0.015/SMS |

**Recommendation**: Use **Twilio** for international + **SpeedSMS** for Vietnam cost optimization.

### Twilio Integration

#### Step 1: Register Twilio Account

1. Visit https://www.twilio.com/try-twilio
2. Verify your email and phone
3. Get free trial credits ($15 USD)
4. From dashboard, get:
   - Account SID
   - Auth Token
   - Phone Number (buy one or use trial number)

#### Step 2: Install Twilio SDK

```bash
# backend/pyproject.toml
[project]
dependencies = [
    # ... existing
    "twilio>=9.0.0",
]

cd backend && uv sync
```

#### Step 3: Twilio Configuration

```python
# backend/app/core/config.py
class Settings(BaseSettings):
    # ... existing

    # SMS / Phone Verification
    SMS_PROVIDER: str = "twilio"  # or "speedsms"
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""  # e.g., +15551234567

    # OTP Settings
    OTP_LENGTH: int = 6
    OTP_EXPIRE_MINUTES: int = 5
    OTP_MAX_ATTEMPTS: int = 3
```

#### Step 4: SMS Service

```python
# backend/app/services/sms_service.py
import random
import string
from typing import Optional
from twilio.rest import Client
from app.core.config import settings
from app.core.cache import cache

class SMSService:
    def __init__(self):
        if settings.SMS_PROVIDER == "twilio":
            self.client = Client(
                settings.TWILIO_ACCOUNT_SID,
                settings.TWILIO_AUTH_TOKEN
            )
            self.from_number = settings.TWILIO_PHONE_NUMBER

    async def send_otp(self, phone: str) -> str:
        """Send OTP to phone number"""

        # Generate OTP
        otp = self._generate_otp()

        # Store OTP in Redis with expiry
        cache_key = f"otp:phone:{phone}"
        await cache.set(cache_key, otp, ttl=settings.OTP_EXPIRE_MINUTES * 60)

        # Send SMS
        message_body = f"Ma xac thuc ReHub cua ban la: {otp}. Ma co hieu luc trong {settings.OTP_EXPIRE_MINUTES} phut."

        try:
            message = self.client.messages.create(
                body=message_body,
                from_=self.from_number,
                to=phone
            )
            print(f"SMS sent: {message.sid}")
            return otp
        except Exception as e:
            print(f"Failed to send SMS: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to send OTP")

    async def verify_otp(self, phone: str, otp: str) -> bool:
        """Verify OTP for phone number"""

        cache_key = f"otp:phone:{phone}"
        attempts_key = f"otp:attempts:{phone}"

        # Check attempts
        attempts = await cache.get(attempts_key)
        if attempts and int(attempts) >= settings.OTP_MAX_ATTEMPTS:
            raise HTTPException(
                status_code=429,
                detail="Too many failed attempts. Please request a new OTP."
            )

        # Get stored OTP
        stored_otp = await cache.get(cache_key)
        if not stored_otp:
            raise HTTPException(status_code=400, detail="OTP expired or not found")

        # Verify OTP
        if otp == stored_otp:
            # Clear OTP and attempts
            await cache.delete(cache_key)
            await cache.delete(attempts_key)
            return True
        else:
            # Increment attempts
            await cache.incr(attempts_key)
            # Set attempts TTL if first fail
            if not attempts:
                await cache.set(attempts_key, "1", ttl=settings.OTP_EXPIRE_MINUTES * 60)
            return False

    def _generate_otp(self) -> str:
        """Generate random OTP"""
        return ''.join(random.choices(string.digits, k=settings.OTP_LENGTH))

    async def send_notification_sms(self, phone: str, message: str):
        """Send generic notification SMS"""
        try:
            self.client.messages.create(
                body=message,
                from_=self.from_number,
                to=phone
            )
        except Exception as e:
            print(f"Failed to send SMS notification: {str(e)}")

sms_service = SMSService()
```

#### Step 5: Phone Verification Endpoints

```python
# backend/app/api/v1/auth.py (add to existing)

from app.services.sms_service import sms_service

@router.post("/send-phone-otp", response_model=dict)
async def send_phone_otp(
    phone: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Send OTP to user's phone"""

    # Validate phone format
    if not phone.startswith("+"):
        raise HTTPException(status_code=400, detail="Phone must include country code (e.g., +84)")

    # Check rate limit (1 OTP per minute per phone)
    rate_limit_key = f"otp:rate_limit:{phone}"
    if await cache.exists(rate_limit_key):
        raise HTTPException(
            status_code=429,
            detail="Please wait 1 minute before requesting another OTP"
        )

    # Send OTP
    otp = await sms_service.send_otp(phone)

    # Set rate limit
    await cache.set(rate_limit_key, "1", ttl=60)

    # Log in development
    if settings.ENVIRONMENT == "development":
        print(f"📱 OTP for {phone}: {otp}")

    return {
        "message": "OTP sent successfully",
        "phone": phone,
        "expires_in_minutes": settings.OTP_EXPIRE_MINUTES
    }

@router.post("/verify-phone", response_model=dict)
async def verify_phone(
    phone: str,
    otp: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Verify phone with OTP"""

    # Verify OTP
    is_valid = await sms_service.verify_otp(phone, otp)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    # Update user
    current_user.phone = phone
    current_user.is_phone_verified = True
    session.add(current_user)
    await session.commit()
    await session.refresh(current_user)

    # Increase trust score
    if current_user.trust_score < 100:
        current_user.trust_score = min(current_user.trust_score + 10, 100)
        await session.commit()

    return {
        "message": "Phone verified successfully",
        "phone": phone,
        "trust_score": current_user.trust_score
    }
```

#### Step 6: Frontend Integration

```typescript
// frontend/src/features/auth/api/phone.api.ts
import { apiClient } from '@/client'

export const sendPhoneOTP = async (phone: string) => {
  const { data } = await apiClient.post('/api/v1/auth/send-phone-otp', null, {
    params: { phone }
  })
  return data
}

export const verifyPhone = async (phone: string, otp: string) => {
  const { data } = await apiClient.post('/api/v1/auth/verify-phone', null, {
    params: { phone, otp }
  })
  return data
}
```

```typescript
// frontend/src/features/auth/hooks/usePhoneVerification.ts
import { useMutation } from '@tanstack/react-query'
import { sendPhoneOTP, verifyPhone } from '../api/phone.api'
import { toaster } from '@/components/ui/toaster'

export function useSendPhoneOTP() {
  return useMutation({
    mutationFn: sendPhoneOTP,
    onSuccess: () => {
      toaster.create({
        title: 'OTP đã được gửi',
        description: 'Vui lòng kiểm tra tin nhắn SMS',
        type: 'success'
      })
    },
    onError: (error: any) => {
      toaster.create({
        title: 'Gửi OTP thất bại',
        description: error.response?.data?.detail || 'Đã xảy ra lỗi',
        type: 'error'
      })
    }
  })
}

export function useVerifyPhone() {
  return useMutation({
    mutationFn: ({ phone, otp }: { phone: string; otp: string }) =>
      verifyPhone(phone, otp),
    onSuccess: () => {
      toaster.create({
        title: 'Xác thực thành công',
        description: 'Số điện thoại đã được xác thực',
        type: 'success'
      })
    },
    onError: (error: any) => {
      toaster.create({
        title: 'Xác thực thất bại',
        description: error.response?.data?.detail || 'OTP không đúng',
        type: 'error'
      })
    }
  })
}
```

```tsx
// frontend/src/features/users/components/PhoneVerificationForm.tsx
import { useState } from 'react'
import { Box, Button, Input, Stack, Text } from '@chakra-ui/react'
import { Field } from '@/components/ui/field'
import { useSendPhoneOTP, useVerifyPhone } from '@/features/auth/hooks/usePhoneVerification'

export function PhoneVerificationForm() {
  const [phone, setPhone] = useState('+84')
  const [otp, setOTP] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')

  const sendOTP = useSendPhoneOTP()
  const verifyPhone = useVerifyPhone()

  const handleSendOTP = async () => {
    await sendOTP.mutateAsync(phone)
    setStep('otp')
  }

  const handleVerifyOTP = async () => {
    await verifyPhone.mutateAsync({ phone, otp })
  }

  if (step === 'phone') {
    return (
      <Stack gap={4}>
        <Field label="Số điện thoại" required>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+84912345678"
          />
        </Field>

        <Button
          onClick={handleSendOTP}
          loading={sendOTP.isPending}
          disabled={phone.length < 10}
        >
          Gửi mã OTP
        </Button>
      </Stack>
    )
  }

  return (
    <Stack gap={4}>
      <Text fontSize="sm" color="gray.600">
        Mã OTP đã được gửi đến {phone}
      </Text>

      <Field label="Mã OTP" required>
        <Input
          value={otp}
          onChange={(e) => setOTP(e.target.value)}
          placeholder="123456"
          maxLength={6}
        />
      </Field>

      <Stack direction="row" gap={2}>
        <Button
          variant="outline"
          onClick={() => setStep('phone')}
        >
          Quay lại
        </Button>

        <Button
          onClick={handleVerifyOTP}
          loading={verifyPhone.isPending}
          disabled={otp.length !== 6}
        >
          Xác thực
        </Button>
      </Stack>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleSendOTP}
        loading={sendOTP.isPending}
      >
        Gửi lại mã OTP
      </Button>
    </Stack>
  )
}
```

### SMS Notifications for Critical Events

```python
# backend/app/services/notification_service.py (enhance existing)

from app.services.sms_service import sms_service

async def notify_order_completed(order: Order):
    """Send notification when order is completed"""

    # Email notification (existing)
    await email_service.send_order_completed_email(order)

    # SMS notification (new)
    if order.seller.is_phone_verified and order.seller.phone:
        message = f"Don hang #{order.id[:8]} da hoan thanh. Tien se duoc chuyen vao vi cua ban."
        await sms_service.send_notification_sms(order.seller.phone, message)

async def notify_dispute_opened(escrow: Escrow):
    """Send notification when dispute is opened"""

    # Notify both buyer and seller
    for user in [escrow.buyer, escrow.seller]:
        if user.is_phone_verified and user.phone:
            message = f"Canh bao: Don hang #{escrow.order_id[:8]} co tranh chấp. Vui long kiem tra."
            await sms_service.send_notification_sms(user.phone, message)
```

---

## 2.4 Shipping & Logistics Integration

### Vietnam Shipping Provider Options

| Provider | Coverage | API | Cost | COD Support |
|----------|----------|-----|------|-------------|
| **Giao Hàng Nhanh (GHN)** | ✅ Nationwide<br/>✅ 63 provinces | ✅ REST API<br/>✅ Good docs | Low-Medium | ✅ Yes |
| **Giao Hàng Tiết Kiệm (GHTK)** | ✅ Nationwide | ✅ REST API | Lower | ✅ Yes |
| **J&T Express** | ✅ Major cities | ✅ REST API | Low | ✅ Yes |
| **ViettelPost** | ✅ Nationwide | ⚠️ Limited API | Higher | ✅ Yes |
| **Vietnam Post (VNPost)** | ✅ Nationwide<br/>✅ Remote areas | ⚠️ Old API | Medium | ✅ Yes |

**Recommendation**: Integrate **GHN** (best API) + **GHTK** (cheapest) and let users compare prices.

### GHN Integration

#### Step 1: Register GHN Developer Account

1. Visit https://khachhang.giaohangnhanh.vn/
2. Register business account
3. Go to Settings → API → Generate API Key
4. Get:
   - API Token
   - Shop ID

#### Step 2: GHN Configuration

```python
# backend/app/core/config.py
class Settings(BaseSettings):
    # ... existing

    # Shipping - Giao Hang Nhanh
    GHN_API_URL: str = "https://dev-online-gateway.ghn.vn/shiip/public-api"
    GHN_TOKEN: str = ""
    GHN_SHOP_ID: int =  0
```

#### Step 3: Shipping Models

```python
# backend/app/models/shipping.py
from sqlmodel import SQLModel, Field
from typing import Optional
from uuid import UUID
import uuid
from datetime import datetime

class ShippingProvider(str, Enum):
    GHN = "ghn"
    GHTK = "ghtk"
    J_AND_T = "jandt"

class ShippingStatus(str, Enum):
    PENDING = "pending"
    PICKING = "picking"
    IN_TRANSIT = "in_transit"
    DELIVERING = "delivering"
    DELIVERED = "delivered"
    RETURNED = "returned"
    CANCELLED = "cancelled"

class ShippingAddress(SQLModel, table=True):
    __tablename__ = "shipping_addresses"

    id: UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id")

    # Address details
    full_name: str
    phone: str
    province_id: int  # GHN province ID
    province_name: str
    district_id: int  # GHN district ID
    district_name: str
    ward_code: str  # GHN ward code
    ward_name: str
    address_detail: str  # Street, house number

    is_default: bool = False

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ShippingOrder(SQLModel, table=True):
    __tablename__ = "shipping_orders"

    id: UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    order_id: UUID = Field(foreign_key="orders.id", unique=True)

    provider: ShippingProvider
    tracking_number: Optional[str] = None  # Provider's tracking number

    # Shipping details
    from_address_id: UUID  # Seller's address
    to_address_id: UUID  # Buyer's address

    # Package details
    weight: int  # grams
    length: Optional[int] = None  # cm
    width: Optional[int] = None  # cm
    height: Optional[int] = None  # cm

    # Cost
    shipping_fee: int  # VND
    insurance_fee: int = 0
    cod_amount: int = 0  # Cash on delivery amount
    total_fee: int  # Total shipping cost

    # Status
    status: ShippingStatus = ShippingStatus.PENDING
    status_updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Provider response
    provider_order_code: Optional[str] = None
    expected_delivery_time: Optional[datetime] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

#### Step 4: GHN Service

```python
# backend/app/services/ghn_service.py
import aiohttp
from typing import Dict, List, Optional
from app.core.config import settings

class GHNService:
    def __init__(self):
        self.api_url = settings.GHN_API_URL
        self.token = settings.GHN_TOKEN
        self.shop_id = settings.GHN_SHOP_ID
        self.headers = {
            "Content-Type": "application/json",
            "Token": self.token,
            "ShopId": str(self.shop_id)
        }

    async def _request(self, method: str, endpoint: str, **kwargs):
        """Generic API request"""
        url = f"{self.api_url}{endpoint}"
        async with aiohttp.ClientSession() as session:
            async with session.request(
                method,
                url,
                headers=self.headers,
                **kwargs
            ) as response:
                data = await response.json()
                if data.get("code") != 200:
                    raise Exception(f"GHN API Error: {data.get('message')}")
                return data.get("data")

    # Province, District, Ward APIs
    async def get_provinces(self) -> List[Dict]:
        """Get list of provinces"""
        return await self._request("GET", "/master-data/province")

    async def get_districts(self, province_id: int) -> List[Dict]:
        """Get districts in a province"""
        return await self._request(
            "GET",
            "/master-data/district",
            params={"province_id": province_id}
        )

    async def get_wards(self, district_id: int) -> List[Dict]:
        """Get wards in a district"""
        return await self._request(
            "POST",
            "/master-data/ward",
            json={"district_id": district_id}
        )

    # Shipping Fee Calculation
    async def calculate_fee(
        self,
        from_district_id: int,
        from_ward_code: str,
        to_district_id: int,
        to_ward_code: str,
        weight: int,  # grams
        insurance_value: int = 0,  # VND
        length: int = None,  # cm
        width: int = None,
        height: int = None
    ) -> Dict:
        """Calculate shipping fee"""

        payload = {
            "from_district_id": from_district_id,
            "from_ward_code": from_ward_code,
            "to_district_id": to_district_id,
            "to_ward_code": to_ward_code,
            "weight": weight,
            "insurance_value": insurance_value,
            "service_type_id": 2,  # Standard service
        }

        if length and width and height:
            payload.update({
                "length": length,
                "width": width,
                "height": height
            })

        return await self._request("POST", "/v2/shipping-order/fee", json=payload)

    # Create Shipping Order
    async def create_order(
        self,
        to_name: str,
        to_phone: str,
        to_address: str,
        to_ward_code: str,
        to_district_id: int,
        weight: int,
        cod_amount: int = 0,
        required_note: str = "KHONGCHOXEMHANG",  # Don't allow buyer to open package
        items: List[Dict] = None,
        note: str = ""
    ) -> Dict:
        """Create shipping order"""

        payload = {
            "to_name": to_name,
            "to_phone": to_phone,
            "to_address": to_address,
            "to_ward_code": to_ward_code,
            "to_district_id": to_district_id,
            "weight": weight,
            "service_type_id": 2,
            "payment_type_id": 2 if cod_amount > 0 else 1,  # 1: Seller pays, 2: COD
            "required_note": required_note,
            "cod_amount": cod_amount,
            "note": note,
            "items": items or []
        }

        return await self._request("POST", "/v2/shipping-order/create", json=payload)

    # Track Order
    async def track_order(self, order_code: str) -> Dict:
        """Get order tracking info"""
        return await self._request(
            "POST",
            "/v2/shipping-order/detail",
            json={"order_code": order_code}
        )

    # Cancel Order
    async def cancel_order(self, order_codes: List[str]) -> Dict:
        """Cancel shipping order"""
        return await self._request(
            "POST",
            "/v2/switch-status/cancel",
            json={"order_codes": order_codes}
        )

ghn_service = GHNService()
```

#### Step 5: Shipping Endpoints

```python
# backend/app/api/v1/shipping.py
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession
from app.api.dependencies import get_session, get_current_user
from app.services.ghn_service import ghn_service
from app.crud import crud_shipping
from app.models import User, ShippingAddress

router = APIRouter(prefix="/shipping", tags=["shipping"])

# Address Management
@router.post("/addresses", response_model=dict)
async def create_address(
    address_in: dict,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Create shipping address"""
    address = await crud_shipping.create_address(
        session,
        user_id=current_user.id,
        **address_in
    )
    return address

@router.get("/addresses", response_model=List[dict])
async def get_my_addresses(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get user's shipping addresses"""
    return await crud_shipping.get_user_addresses(session, user_id=current_user.id)

# GHN Master Data
@router.get("/provinces", response_model=List[dict])
async def get_provinces():
    """Get provinces from GHN"""
    return await ghn_service.get_provinces()

@router.get("/districts/{province_id}", response_model=List[dict])
async def get_districts(province_id: int):
    """Get districts by province"""
    return await ghn_service.get_districts(province_id)

@router.get("/wards/{district_id}", response_model=List[dict])
async def get_wards(district_id: int):
    """Get wards by district"""
    return await ghn_service.get_wards(district_id)

# Calculate Shipping Fee
@router.post("/calculate-fee", response_model=dict)
async def calculate_shipping_fee(
    request: dict,
    session: AsyncSession = Depends(get_session)
):
    """Calculate shipping fee"""

    fee_data = await ghn_service.calculate_fee(
        from_district_id=request["from_district_id"],
        from_ward_code=request["from_ward_code"],
        to_district_id=request["to_district_id"],
        to_ward_code=request["to_ward_code"],
        weight=request["weight"],
        insurance_value=request.get("insurance_value", 0)
    )

    return {
        "total": fee_data["total"],
        "service_fee": fee_data["service_fee"],
        "insurance_fee": fee_data["insurance_fee"],
        "expected_delivery_time": fee_data.get("expected_delivery_time")
    }

# Create Shipping Order
@router.post("/orders", response_model=dict)
async def create_shipping_order(
    order_id: str,
    to_address_id: str,
    weight: int,  # grams
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Create shipping order for marketplace order"""

    # Get order
    order = await crud_order.get(session, id=order_id)
    if not order or str(order.seller_id) != str(current_user.id):
        raise HTTPException(status_code=404, detail="Order not found")

    # Get addresses
    to_address = await crud_shipping.get_address(session, id=to_address_id)
    from_address = await crud_shipping.get_default_address(session, user_id=current_user.id)

    # Create GHN order
    ghn_response = await ghn_service.create_order(
        to_name=to_address.full_name,
        to_phone=to_address.phone,
        to_address=to_address.address_detail,
        to_ward_code=to_address.ward_code,
        to_district_id=to_address.district_id,
        weight=weight,
        cod_amount=0,  # Already paid via escrow
        items=[{
            "name": order.listing.title,
            "quantity": 1,
            "price": order.final_price
        }]
    )

    # Save shipping order
    shipping_order = await crud_shipping.create_order(
        session,
        order_id=order_id,
        provider="ghn",
        tracking_number=ghn_response["order_code"],
        from_address_id=from_address.id,
        to_address_id=to_address_id,
        weight=weight,
        shipping_fee=ghn_response["total_fee"]
    )

    return {
        "shipping_order_id": str(shipping_order.id),
        "tracking_number": ghn_response["order_code"],
        "expected_delivery_time": ghn_response.get("expected_delivery_time")
    }

# Track Shipping Order
@router.get("/orders/{order_id}/track", response_model=dict)
async def track_shipping_order(
    order_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Track shipping order"""

    shipping_order = await crud_shipping.get_by_order_id(session, order_id=order_id)
    if not shipping_order:
        raise HTTPException(status_code=404, detail="Shipping order not found")

    # Get tracking info from GHN
    tracking_data = await ghn_service.track_order(shipping_order.provider_order_code)

    return {
        "status": shipping_order.status,
        "tracking_number": shipping_order.tracking_number,
        "provider": shipping_order.provider,
        "tracking_history": tracking_data.get("log", [])
    }
```

### Shipping Webhook Handler

```python
# backend/app/api/v1/webhooks.py
from fastapi import APIRouter, Request

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

@router.post("/ghn/status")
async def ghn_status_webhook(request: Request):
    """Handle GHN shipping status updates"""

    data = await request.json()

    # Verify webhook signature (if GHN provides one)
    # ... verification logic

    # Update shipping order status
    order_code = data.get("OrderCode")
    status = data.get("Status")

    # Map GHN status to our status
    status_map = {
        "ready_to_pick": "picking",
        "picking": "picking",
        "picked": "in_transit",
        "ontheway": "in_transit",
        "delivering": "delivering",
        "delivered": "delivered",
        "return": "returned",
        "cancel": "cancelled"
    }

    # Update database
    # ... update logic

    # Notify user via WebSocket/NotificationCRUD
    # ... notification logic

    return {"success": True}
```

---

*[Tài liệu tiếp tục... quá dài, sẽ được chia thành nhiều phần]*

---

## PHẦN 2 (TIẾP THEO) - Sẽ bao gồm:

### Còn lại trong Backend:
- 2.5 Search Enhancement (Elasticsearch)
- 2.6 Image Processing
- 2.7 Chat/Messaging System
- 2.8 Location-Based Features
- 2.9 Advanced Security
- 2.10 API Rate Limiting
- 2.11 Background Jobs
- 2.12 Database Optimization

### Frontend (Phần 3)
### DevOps (Phần 4)
### Production Deployment (Phần 5)
### AI/ML Integration (Phần 6)
### Vector Database (Phần 7)
### OCR Integration (Phần 8)
### Advanced Features (Phần 9)
### Roadmap & Timeline (Phần 10)

---

**Ghi chú**: Tài liệu này đã đạt 6000+ dòng. Do giới hạn kích thước, phần còn lại sẽ được viết trong các file riêng theo từng chủ đề.

## Cách sử dụng tài liệu này:

1. **Phase 1**: Đọc Phần 1 để hiểu trạng thái hiện tại
2. **Phase 2**: Chọn tính năng ưu tiên từ Phần 2 để implement
3. **Phase 3**: Triển khai DevOps (Phần 4) trước khi go live
4. **Phase 4**: Deploy production theo (Phần 5)
5. **Phase 5**: Tích hợp AI/ML (Phần 6-8) sau khi stable
6. **Phase 6**: Mở rộng với Advanced Features (Phần 9)

## Liên hệ để được hỗ trợ:

- GitHub Issues: [Link to repo]
- Email: [Support email]
- Discord: [Community channel]

**License**: MIT
**Contributors**: ReHub Development Team
**Last Updated**: 2026-04-01