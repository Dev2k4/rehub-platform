# 06 - BE-FE Gap Implementation Plan (Execution Ready)

## 1) Mục tiêu tài liệu

Tài liệu này là bản kế hoạch thực thi chi tiết để đóng toàn bộ khoảng trống giữa Backend và Frontend trong ReHub Platform, với trọng tâm:

- Chức năng Backend đã có nhưng Frontend chưa có hoặc chưa hoàn chỉnh.
- Chuẩn hóa contract BE-FE để tránh lỗi tích hợp.
- Chia việc theo giai đoạn để team FE có thể triển khai ngay.
- Đặt rõ Definition of Done (DoD), Acceptance Criteria, test checklist và rủi ro.

Mục tiêu cuối cùng:

- Không còn endpoint BE quan trọng nào bị bỏ trống ở FE.
- Các luồng người dùng chính (mua, bán, quản trị) hoàn chỉnh end-to-end.
- FE có thể release an toàn mà không phát sinh regression lớn.

---

## 2) Tóm tắt hiện trạng (as-is)

### 2.1 Nhóm tính năng đã phủ tốt

- Auth: login, register, verify email, forgot/reset password, logout.
- Users/Profile: xem và cập nhật hồ sơ, xem public profile seller.
- Listings: list, detail, CRUD tin đăng, upload/delete ảnh.
- Orders: tạo đơn, danh sách đơn, chi tiết, complete/cancel.
- Wallet: số dư, topup demo, lịch sử giao dịch.
- Escrow: fund/release/dispute/admin resolve đã có API + FE flow.
- Notifications: list, unread-count, mark read/read-all.
- Admin: users, pending listings, approve/reject, categories.

### 2.2 Khoảng trống chính cần bổ sung

1. Reviews module (thiếu FE gần như hoàn toàn)
- BE đã có đầy đủ API reviews.
- FE chưa có module features/reviews thực thi thực tế.
- FE chưa có route/page/form để user tạo review sau order completed.
- FE chưa hiển thị rating/review trong seller profile.

2. Offers theo listing (thiếu lớp API wrapper và UI sử dụng)
- BE có endpoint lấy offers của một listing cụ thể.
- FE generated client có method, nhưng feature API/hook/UI chưa dùng.

3. Offers dashboard tập trung cho buyer/seller
- Hiện tại luồng offer tồn tại rời rạc qua modal ở listing detail.
- Chưa có route chuyên biệt để quản lý sent/received offers.

4. Contract mismatch cần xử lý trước
- Auth refresh endpoint: FE generated đang trỏ refresh-token, BE dùng refresh.
- Category update method: FE generated dùng PATCH, BE khai báo PUT.
- Reviews response typing cho get reviews by order cần đồng bộ đúng kiểu danh sách.

---

## 3) Nguyên tắc triển khai

### 3.1 Triển khai theo thứ tự an toàn

Bắt buộc theo trình tự:

1. Đồng bộ contract BE-FE (OpenAPI + generated client).
2. Bổ sung Reviews core flow (API wrapper -> hooks -> UI -> route).
3. Bổ sung Offers theo listing và Offers dashboard.
4. Hoàn thiện UX + test + hardening.

Lý do:

- Nếu làm UI trước khi fix contract sẽ tốn công sửa lại ở nhiều chỗ.
- Reviews là gap lớn nhất, ảnh hưởng trực tiếp trust/quality của marketplace.

### 3.2 Tiêu chuẩn code cho FE

- Mọi call API đi qua features/*/api/*.api.ts (không gọi trực tiếp SDK trong UI).
- Mọi trạng thái network dùng React Query (query key nhất quán).
- Toàn bộ form có validation schema rõ ràng.
- Cấu trúc feature-based giữ thống nhất với codebase hiện tại.

### 3.3 Definition of Done (áp dụng cho mọi task)

- Có API function + hook + UI tiêu thụ thật.
- Có xử lý loading, empty, error, success state.
- Có guard quyền hạn theo role/trạng thái order.
- Có test tối thiểu theo checklist ở phần 11.
- Không có lỗi typecheck/lint mới phát sinh.

---

## 4) Kế hoạch tổng thể theo phase

## Phase 0 - Contract Alignment (bắt buộc trước khi làm UI)

Mục tiêu: đảm bảo FE generated client phản ánh đúng BE hiện tại.

### Task 0.1 - Đồng bộ OpenAPI và SDK

Scope:

- Regenerate frontend client từ OpenAPI mới nhất.
- Xác nhận lại các endpoint/method/path quan trọng:
  - Auth refresh.
  - Categories update.
  - Reviews response type.
  - Offers by listing.

Deliverables:

- frontend/src/client/sdk.gen.ts cập nhật.
- frontend/src/client/types.gen.ts cập nhật.
- openapi-ts generation chạy sạch.

Acceptance criteria:

- Không còn mismatch path/method ở các endpoint nêu trên.
- Build FE pass sau khi regenerate.

### Task 0.2 - Fix adapter API layer nếu cần

Scope:

- Kiểm tra features/auth/api/auth.api.ts và các API wrappers khác.
- Cập nhật tên hàm hoặc shape data nếu generated SDK đổi.

Deliverables:

- Các file api wrappers compile và chạy được.

Acceptance criteria:

- Login + refresh token flow hoạt động không lỗi 401 giả.
- Admin category update gọi đúng method BE.

---

## Phase 1 - Reviews Module (ưu tiên cao nhất)

Mục tiêu: hoàn thiện hệ thống review end-to-end cho order hoàn tất.

## 5) Chi tiết triển khai Reviews

### 5.1 Thiết kế chức năng

Business rules từ BE:

- Chỉ user thuộc order (buyer hoặc seller) mới được review order đó.
- Chỉ review khi order status = COMPLETED.
- Mỗi user chỉ review 1 lần cho mỗi order.
- Review tạo notification cho người được review.

Yêu cầu FE tương ứng:

- Chỉ hiện nút Leave Review khi đủ điều kiện.
- Nếu đã review thì hiển thị trạng thái Reviewed, không cho submit lại.
- Hiển thị danh sách review của user trên seller profile.
- Hiển thị review theo order ở order detail.

### 5.2 Cấu trúc file FE cần bổ sung

Tạo mới module:

- frontend/src/features/reviews/api/reviews.api.ts
- frontend/src/features/reviews/hooks/useReviews.ts
- frontend/src/features/reviews/components/RatingStars.tsx
- frontend/src/features/reviews/components/ReviewForm.tsx
- frontend/src/features/reviews/components/ReviewsList.tsx
- frontend/src/features/reviews/pages/OrderReviewPage.tsx (hoặc tích hợp trực tiếp vào OrderDetailPage)

Route đề xuất:

- frontend/src/routes/orders.$id.review.tsx

Tích hợp vào các màn có sẵn:

- frontend/src/features/orders/pages/OrderDetailPage.tsx
- frontend/src/features/users/pages/SellerProfilePage.tsx

### 5.3 API layer chi tiết

reviews.api.ts cần có:

- createReview(input)
  - gọi ReviewsService.createReviewApiV1ReviewsPost
- getUserReviews(userId)
  - gọi ReviewsService.getUserReviewsApiV1ReviewsUserUserIdGet
- getOrderReviews(orderId)
  - gọi ReviewsService.getReviewApiV1ReviewsOrderIdGet

Chuẩn hóa kiểu dữ liệu:

- rating: number (1-5)
- comment: string
- order_id: string

Yêu cầu lỗi/exception:

- Map message thân thiện cho các case:
  - order chưa completed
  - user đã review
  - không có quyền

### 5.4 Hooks (React Query)

useReviews.ts:

- useOrderReviews(orderId)
  - query key: ["reviews", "order", orderId]
- useUserReviews(userId)
  - query key: ["reviews", "user", userId]
- useCreateReview()
  - mutation invalidate:
    - ["reviews", "order", orderId]
    - ["reviews", "user", revieweeId] (nếu có context)

Yêu cầu:

- enabled guard khi thiếu id.
- staleTime hợp lý (ví dụ 30s - 60s).

### 5.5 UI components

RatingStars.tsx:

- Có 2 mode:
  - readonly display.
  - interactive select.
- Hỗ trợ keyboard (accessibility cơ bản).

ReviewForm.tsx:

- Input bắt buộc:
  - rating (1-5, required)
  - comment (optional nhưng giới hạn max length)
- Nút submit disabled khi mutation pending.
- Hiển thị lỗi backend rõ ràng.
- Hiển thị success state và redirect logic.

ReviewsList.tsx:

- Hiển thị avatar/name/rating/comment/date.
- Có empty state: Chưa có đánh giá.
- Có skeleton loading state.

### 5.6 Tích hợp vào order detail

Tại OrderDetailPage:

- Query order hiện tại.
- Query order reviews.
- Xác định canReview theo điều kiện:
  - order.status === COMPLETED
  - currentUser thuộc order
  - currentUser chưa có review trong danh sách
- Nếu canReview:
  - hiện CTA Leave Review.
  - điều hướng đến route review hoặc mở modal form.
- Nếu đã review:
  - hiển thị badge Reviewed.

### 5.7 Tích hợp vào seller profile

Tại SellerProfilePage:

- Gọi useUserReviews(sellerId).
- Tính summary:
  - average rating.
  - review count.
- Hiển thị:
  - badge điểm trung bình.
  - danh sách review gần nhất.

### 5.8 Acceptance Criteria cho Reviews

- User đủ điều kiện tạo review thành công sau khi order completed.
- Không thể review 2 lần cùng order từ cùng user.
- Seller profile hiển thị review đúng người, đúng số lượng.
- Trang order detail phản ánh đúng trạng thái review đã tạo.

---

## Phase 2 - Offers Coverage Completion

## 6) Chi tiết triển khai Offers còn thiếu

### 6.1 Bổ sung endpoint offers theo listing

Thêm vào:

- frontend/src/features/offers/api/offers.api.ts

Hàm mới:

- getOffersForListing(listingId, params?)
  - gọi OffersService.getOffersForListingApiV1OffersListingListingIdGet

Thêm hook:

- useOffersForListing(listingId)
  - query key: ["offers", "listing", listingId]

### 6.2 UI quản lý offers cho seller trong listing detail

Yêu cầu giao diện:

- Nếu currentUser là seller của listing:
  - hiển thị panel Offers on this listing.
  - list offers (giá, trạng thái, thời gian).
  - action nhanh: accept/reject/counter.

Tái sử dụng component hiện có:

- OfferDetailModal
- CounterOfferModal

Nâng cấp cần làm:

- thêm list view để mở modal từ từng dòng offer.

### 6.3 Trang Offers Dashboard riêng

Tạo route mới:

- frontend/src/routes/offers.tsx

Tạo page:

- frontend/src/features/offers/pages/OffersPage.tsx

Nội dung trang:

- Tab Sent Offers.
- Tab Received Offers.
- Filter theo status.
- Pagination cơ bản.
- Quick actions cho received offers.

API sử dụng:

- getMySentOffers
- getMyReceivedOffers
- updateOfferStatus

### 6.4 Acceptance Criteria cho Offers

- Seller xem được toàn bộ offers theo listing của mình.
- Buyer/seller có dashboard offers tập trung.
- Các action update status phản ánh real-time sau mutation.

---

## Phase 3 - UX Hardening và đồng bộ trải nghiệm

## 7) Yêu cầu FE bổ sung ngoài chức năng

### 7.1 Loading/Error/Empty thống nhất

Áp dụng cho Reviews và Offers mới:

- Loading: skeleton hoặc spinner cục bộ.
- Error: message rõ + action retry.
- Empty: copywriting rõ hành động tiếp theo.

### 7.2 Route protection

- Route review và offers yêu cầu đăng nhập.
- Guard quyền seller cho khu vực quản lý offers theo listing.

### 7.3 Notification integration

- Khi review được tạo thành công:
  - update badge hoặc trigger refresh notifications.
- Khi offer status đổi:
  - đồng bộ UI nơi khác qua invalidate query keys.

### 7.4 i18n/copy chuẩn

Chuẩn hóa text tiếng Việt cho:

- trạng thái review.
- trạng thái offer.
- lỗi thường gặp.

---

## 8) Kế hoạch triển khai theo timeline đề xuất

Giả định 1-2 FE dev, 1 BE dev hỗ trợ contract:

Tuần 1:

- P0. Contract alignment + regenerate SDK + fix wrappers.
- Start P1: scaffold reviews module + API + hooks.

Tuần 2:

- P1: hoàn thiện review form/list + integrate order detail + seller profile.
- Unit/integration test cho reviews flow.

Tuần 3:

- P2: offers by listing + offers dashboard route/page.
- Hardening mutation states + query invalidation.

Tuần 4:

- P3: polish UX, regression test toàn bộ luồng chính.
- UAT + bugfix + release candidate.

---

## 9) Backlog chi tiết theo ticket (execution-ready)

## Epic A - Contract Alignment

A1. Regenerate FE SDK từ OpenAPI mới nhất
- Output: sdk.gen.ts, types.gen.ts đồng bộ.
- Owner: FE.
- Estimate: 0.5 ngày.

A2. Xác thực refresh endpoint hoạt động
- Kiểm tra login -> refresh -> API call protected.
- Owner: FE + BE confirm.
- Estimate: 0.5 ngày.

A3. Xác thực categories update method
- Đảm bảo FE gọi đúng method/path BE hỗ trợ.
- Owner: FE + BE confirm.
- Estimate: 0.5 ngày.

A4. Xác thực kiểu trả về reviews theo order
- Đảm bảo là list và UI xử lý đúng.
- Owner: FE.
- Estimate: 0.5 ngày.

## Epic B - Reviews Module

B1. Tạo feature skeleton reviews
- Tạo thư mục api/hooks/components/pages.
- Estimate: 0.5 ngày.

B2. Implement reviews.api.ts
- 3 functions create/getUser/getOrder.
- Estimate: 0.5 ngày.

B3. Implement useReviews hooks
- query/mutation + invalidate.
- Estimate: 0.5 ngày.

B4. Build RatingStars + ReviewForm
- component tách rời, tái sử dụng.
- Estimate: 1 ngày.

B5. Build ReviewsList
- list item + empty/loading/error.
- Estimate: 0.5 ngày.

B6. Integrate OrderDetailPage
- CTA leave review + trạng thái reviewed.
- Estimate: 1 ngày.

B7. Integrate SellerProfilePage
- Hiển thị rating summary + list review.
- Estimate: 0.5 ngày.

B8. Add route orders.$id.review.tsx (nếu dùng route riêng)
- guard auth + navigation.
- Estimate: 0.5 ngày.

## Epic C - Offers Completion

C1. Thêm getOffersForListing vào offers.api.ts
- Estimate: 0.25 ngày.

C2. Thêm useOffersForListing hook
- Estimate: 0.25 ngày.

C3. Integrate listing offers panel cho seller
- Estimate: 1 ngày.

C4. Tạo route offers.tsx + OffersPage
- Tab sent/received + filter + pagination.
- Estimate: 1.5 ngày.

C5. Quick actions accept/reject/counter từ dashboard
- Estimate: 0.5 ngày.

## Epic D - Hardening

D1. Chuẩn hóa loading/error/empty states
- Estimate: 0.5 ngày.

D2. Query keys audit và invalidate audit
- Estimate: 0.5 ngày.

D3. Regression pass + bugfix
- Estimate: 1 ngày.

---

## 10) Ma trận API -> FE coverage cần đạt sau khi hoàn tất

### Reviews

- POST /api/v1/reviews
  - FE: reviews.api.ts + ReviewForm submit
- GET /api/v1/reviews/user/{user_id}
  - FE: SellerProfilePage reviews panel
- GET /api/v1/reviews/{order_id}
  - FE: OrderDetailPage reviews section

### Offers (bổ sung)

- GET /api/v1/offers/listing/{listing_id}
  - FE: ListingDetail seller offers panel

### Existing offers endpoints (đưa vào dashboard)

- GET /api/v1/offers/me/sent
- GET /api/v1/offers/me/received
- PATCH /api/v1/offers/{offer_id}/status

---

## 11) Test Plan chi tiết

## 11.1 FE Unit tests

Reviews:

- RatingStars render đúng số sao và state selected.
- ReviewForm validation rating required.
- ReviewForm submit gọi mutation payload đúng.

Offers:

- Offers list render đúng theo status.
- Action button gọi mutation đúng offerId và status.

## 11.2 FE Integration tests

Reviews flow:

1. Login buyer.
2. Vào order completed.
3. Tạo review thành công.
4. Reload trang: không còn nút review, hiện trạng thái reviewed.
5. Seller profile hiển thị review mới.

Offers flow:

1. Login seller.
2. Vào listing của mình.
3. Thấy list offers theo listing.
4. Accept/reject một offer.
5. UI cập nhật trạng thái ngay.

## 11.3 Manual QA checklist

- [ ] Không login thì không vào được route review/offers dashboard.
- [ ] Order chưa completed không được review.
- [ ] Đã review thì không thể submit lần 2.
- [ ] Seller chỉ xem offers của listing thuộc quyền sở hữu.
- [ ] Khi API lỗi 4xx/5xx UI có message hợp lý.
- [ ] Mobile layout không vỡ ở các màn mới.

---

## 12) Rủi ro và phương án giảm thiểu

R1. Generated client lệch BE sau khi BE đổi endpoint
- Giảm thiểu: khóa quy trình regenerate SDK mỗi khi BE merge API changes.

R2. Query invalidation thiếu dẫn đến UI stale
- Giảm thiểu: chuẩn hóa query key convention và audit trước release.

R3. Review permission edge case
- Giảm thiểu: FE guard chỉ để UX, luôn tin BE là nguồn sự thật; xử lý lỗi BE rõ ràng.

R4. Offer status race condition
- Giảm thiểu: disable action khi pending; refetch sau mutate.

---

## 13) Kế hoạch release và rollback

Release strategy:

- Feature flag logic mềm ở FE (ẩn menu route mới nếu cần).
- Deploy theo 2 đợt:
  1) Contract + API wrappers.
  2) Reviews + Offers UI.

Rollback:

- Nếu lỗi nghiêm trọng ở module mới, tạm ẩn route reviews/offers dashboard.
- Giữ các luồng cũ (orders/listings) không bị ảnh hưởng.

---

## 14) Checklist thực thi cuối cùng

## Milestone M1 - Contract Ready

- [ ] FE SDK regenerate thành công.
- [ ] Refresh/category/reviews typing đồng bộ BE.
- [ ] Smoke test auth/admin pass.

## Milestone M2 - Reviews Live

- [ ] Tạo review từ order completed.
- [ ] Hiển thị review ở order detail.
- [ ] Hiển thị review summary ở seller profile.

## Milestone M3 - Offers Complete

- [ ] Seller xem offers theo listing.
- [ ] Có offers dashboard sent/received.
- [ ] Action status hoạt động ổn định.

## Milestone M4 - Release Ready

- [ ] QA checklist pass.
- [ ] Không lỗi lint/typecheck mới.
- [ ] Tài liệu sử dụng nội bộ cập nhật.

---

## 15) Phần việc đề xuất nếu muốn mở rộng tiếp (post-plan)

- Thêm seller rating aggregate hiển thị ở listing cards.
- Thêm review moderation cho admin.
- Thêm analytics mini dashboard cho offers conversion rate.
- Tối ưu performance bằng prefetch dữ liệu review/offers ở route loader.

---

## 16) Gợi ý phân công nguồn lực

Nếu team có 3 người:

- FE Dev 1:
  - Contract alignment + Reviews API/hooks + OrderDetail integration.
- FE Dev 2:
  - Reviews UI components + SellerProfile integration + testing.
- FE Dev 3:
  - Offers by listing + Offers dashboard + UX hardening.

BE Dev hỗ trợ theo yêu cầu:

- Xác nhận OpenAPI spec đúng thực tế.
- Hỗ trợ debug các lỗi permission/validation edge cases.

---

## 17) Kết quả mong đợi sau khi hoàn thành kế hoạch

- FE không còn thiếu các chức năng trọng yếu mà BE đã có.
- Trải nghiệm người dùng trong luồng mua-bán tăng rõ rệt nhờ review + offers management.
- Giảm đáng kể bug tích hợp do contract mismatch.
- Có nền tảng tốt cho các phase nâng cao (analytics, moderation, growth features).

---

## 18) Tiến độ thực thi đã cập nhật (2026-03-31)

Mục này ghi nhận phần đã làm để tránh lặp khi triển khai tiếp.

### 18.1 Đã hoàn thành

- [x] Phase 0 - Task 0.2 (Fix adapter API layer)
  - Đã vá refresh token flow ở FE để gọi đúng `POST /api/v1/auth/refresh`.
  - File: `frontend/src/features/auth/api/auth.api.ts`.
- [x] Phase 0 - Đồng bộ gọi update category theo `PUT`
  - Đã đổi API wrapper update category sang request `PUT` trực tiếp.
  - File: `frontend/src/features/admin/api/admin.categories.api.ts`.
- [x] Bổ sung Offers theo listing ở lớp API
  - Đã thêm `getOffersForListing()`.
  - File: `frontend/src/features/offers/api/offers.api.ts`.
- [x] Bổ sung hooks cho Offers
  - Đã thêm `useMySentOffers`, `useMyReceivedOffers`, `useOffersForListing`.
  - File: `frontend/src/features/offers/hooks/useOffers.ts`.
- [x] Bổ sung invalidation sau update offer status
  - File: `frontend/src/features/offers/hooks/useUpdateOfferMutation.ts`.
- [x] Tạo module Reviews FE
  - Đã tạo:
    - `frontend/src/features/reviews/api/reviews.api.ts`
    - `frontend/src/features/reviews/hooks/useReviews.ts`
    - `frontend/src/features/reviews/components/RatingStars.tsx`
    - `frontend/src/features/reviews/components/ReviewForm.tsx`
    - `frontend/src/features/reviews/components/ReviewsList.tsx`
- [x] Integrate Reviews vào Order Detail
  - Hiển thị form review có điều kiện + danh sách review theo order.
  - File: `frontend/src/features/orders/pages/OrderDetailPage.tsx`.
- [x] Integrate Reviews vào Seller Profile
  - Hiển thị danh sách review của seller.
  - File: `frontend/src/features/users/pages/SellerProfilePage.tsx`.
- [x] Integrate Offers panel cho seller trong listing detail
  - Hiển thị danh sách offers theo listing + mở modal chi tiết.
  - File: `frontend/src/features/listings/pages/ListingDetailPage.tsx`.
- [x] Build FE pass sau thay đổi
  - Đã chạy `npm run build` trong `frontend` và thành công.

### 18.2 Hoàn thành một phần / còn lại

- [ ] Phase 0 - Task 0.1 (Regenerate OpenAPI SDK)
  - Trạng thái: chưa regenerate lại `sdk.gen.ts`/`types.gen.ts`.
  - Đã thử thực thi nhưng bị block môi trường:
    - thiếu `frontend/openapi.json`.
    - script chuẩn cần `uv` nhưng máy hiện tại chưa có.
    - fallback bằng `python3` không chạy được do thiếu dependency backend (`fastapi`).
  - Workaround hiện tại: đã vá ở API wrapper để không block tiến độ FE.
- [x] Epic C4 - Route offers.tsx + OffersPage
  - Trạng thái: đã gắn route chính thức `/offers`.
  - Đã trigger generate lại `routeTree.gen.ts` bằng Vite dev server.
  - Đã build pass sau khi thêm route.
- [x] Bổ sung điều hướng vào Offers dashboard
  - Đã thêm nút `Offers` trên header khi user đăng nhập.
  - File: `frontend/src/features/home/components/MarketplaceHeader.tsx`.

### 18.3 Đề xuất bước tiếp theo (không lặp việc đã xong)

1. Regenerate route tree + OpenAPI client để bỏ workaround tạm thời.
2. Hoàn thiện quick action counter trong OffersPage (hiện tại ưu tiên accept/reject + mở chi tiết).
3. Bổ sung test cases cho Reviews/Offers theo checklist ở mục 11.
