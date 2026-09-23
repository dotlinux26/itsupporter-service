# IT SUPPORTER SERVICE

## BUSINESS & FUNCTIONAL REQUIREMENTS SPECIFICATION

**Tên hệ thống:** IT Supporter Service
**Đơn vị:** IT Supporter
**Mục đích:** Hệ thống web cung cấp dịch vụ hỗ trợ, vệ sinh và bảo trì máy tính, đặt lịch kỹ thuật viên, quản lý đơn hàng, trao đổi giữa khách hàng và kỹ thuật viên, quản lý thanh toán, tài chính và vận hành nội bộ.

---

# 1. TỔNG QUAN HỆ THỐNG

## 1.1. Mục tiêu

IT Supporter Service là một hệ thống web cho phép người dùng:

* Xem các dịch vụ IT Supporter đang cung cấp.
* Xem lịch kỹ thuật viên còn trống.
* Đặt lịch vệ sinh/bảo trì máy.
* Chọn gói dịch vụ.
* Theo dõi đơn hàng.
* Trao đổi trực tiếp với kỹ thuật viên phụ trách đơn.
* Đề xuất thay đổi lịch.
* Hủy đơn.
* Đánh giá dịch vụ sau khi hoàn thành.
* Quản lý thông tin cá nhân.

Đối với kỹ thuật viên, hệ thống cho phép:

* Theo dõi các đơn được giao.
* Xem chi tiết đơn.
* Chat với khách hàng.
* Xác nhận đơn.
* Chuyển trạng thái đơn.
* Bắt đầu thực hiện đơn và kích hoạt bộ đếm thời gian.
* Quản lý các khoản phụ phí/extend được phép.
* Xác nhận đã nhận/chưa nhận tiền.
* Kết thúc đơn.
* Theo dõi số dư cá nhân.

Đối với quản lý:

* Theo dõi hoạt động hệ thống.
* Xem báo cáo đơn hàng.
* Xem báo cáo tài chính.
* Theo dõi doanh thu.
* Theo dõi số dư kỹ thuật viên.
* Thống kê hiệu suất từng kỹ thuật viên.
* Thực hiện quyết toán cho kỹ thuật viên.
* Kiểm tra log tài chính và log nghiệp vụ.

Đối với admin:

* Quản lý hệ thống.
* Quản lý tài khoản.
* Quản lý role.
* Quản lý QR thanh toán.
* Quản lý dữ liệu cấu hình.
* Theo dõi audit log.
* Thực hiện các thao tác quản trị đặc quyền.

---

# 2. BRANDING & DESIGN SYSTEM

## 2.1. Màu chủ đạo

Website sử dụng:

* Màu cam là màu thương hiệu chính.
* Màu trắng là nền chủ đạo.
* Có thể sử dụng các sắc xám trung tính để phân cấp nội dung.
* Màu xanh lá dùng cho trạng thái kỹ thuật viên còn rảnh/slot khả dụng.
* Các màu trạng thái khác phải được sử dụng nhất quán.

Thiết kế tổng thể:

* Sáng.
* Hiện đại.
* Gọn.
* Dễ đọc.
* Không quá nhiều hiệu ứng.
* Bo góc vừa phải.
* Không sử dụng các khối quá tròn gây cảm giác "app đồ chơi".
* Khoảng trắng rõ ràng.
* Responsive đầy đủ.

---

# 3. LOGO & ASSET

## 3.1. Logo chính

Asset:

```text
/home/nguyenduccanh/Documents/itsupporter-service/logo_bo3goc.png
```

Đây là **logo chính của website**.

Logo này được sử dụng:

* Navigation.
* Trang đăng nhập.
* Các thành phần nhận diện thương hiệu quan trọng.
* Footer.
* Các thành phần loading hoặc empty state nếu phù hợp.

## 3.2. Logo đầy đủ

Asset:

```text
/home/nguyenduccanh/Documents/itsupporter-service/it.png
```

Logo dài có đầy đủ tên:

**IT Supporter**

Asset này có thể được sử dụng:

* Footer.
* Trang giới thiệu.
* Khu vực branding lớn.
* Các vị trí mà logo dài phù hợp hơn logo icon.

## 3.3. Loading / decorative asset

Asset:

```text
/home/nguyenduccanh/Documents/itsupporter-service/cog.svg
```

Yêu cầu:

* Chuyển màu bánh răng sang màu cam chủ đạo.
* Có animation quay liên tục.
* Tốc độ quay vừa phải.
* Không được quá nhanh.
* Có thể sử dụng làm background decoration với opacity thấp.
* Có thể sử dụng trong loading state.
* Có thể kết hợp với các animation nhẹ khác khi tải trang.

Animation phải mang tính chất chuyên nghiệp, không làm ảnh hưởng usability.

---

# 4. KIẾN TRÚC HỆ THỐNG

Hệ thống bao gồm hai thành phần chính:

```text
Frontend
Backend
```

## 4.1. Frontend

Technology:

* Vite.
* JavaScript/TypeScript tùy implementation.
* Responsive UI.
* SPA architecture.

Frontend chịu trách nhiệm:

* Rendering giao diện.
* Form.
* Calendar.
* Chat UI.
* Dashboard.
* Authentication UI.
* Notification UI.
* Responsive behavior.

Frontend không được tự quyết định quyền hạn của user.

Mọi quyền phải được backend xác thực lại.

---

# 5. BACKEND

## 5.1. Technology

Backend sử dụng:

* Node.js.
* TypeScript.
* SQLite3.
* npm/npx.
* PM2.

Hệ thống phải được thiết kế theo hướng service/SaaS có cấu trúc rõ ràng.

Khuyến nghị phân tầng:

```text
HTTP/API Layer
      ↓
Controller
      ↓
Service
      ↓
Repository / Data Access
      ↓
SQLite
```

Các logic nghiệp vụ quan trọng không được đặt trực tiếp toàn bộ trong route handler.

---

# 6. DATABASE

Database:

```text
SQLite
```

SQLite là database trung tâm của hệ thống.

Dữ liệu cần được thiết kế có quan hệ và có transaction đối với các nghiệp vụ quan trọng.

Đặc biệt các nghiệp vụ liên quan tới tiền phải có:

* Transaction.
* Atomic update.
* Audit log.
* Event/log tài chính.
* Khả năng recovery.
* Không được chỉ dựa vào giá trị balance hiện tại.

---

# 7. ROLE MODEL

Hệ thống có tổng cộng **4 role**:

```text
GUEST / CUSTOMER
TECHNICIAN
MANAGER
ADMIN
```

## 7.1. GUEST / CUSTOMER

Đây là role mặc định của tài khoản được tạo thông qua giao diện đăng ký.

Tài khoản thông thường:

```text
Register
↓
GUEST
```

Guest có thể:

* Quản lý profile.
* Đặt dịch vụ.
* Xem đơn của bản thân.
* Chat với kỹ thuật viên phụ trách đơn.
* Đề xuất đổi lịch.
* Hủy đơn theo điều kiện.
* Đánh giá đơn hoàn thành.

Guest không có quyền:

* Quản lý người dùng.
* Quản lý role.
* Quản lý tài chính hệ thống.
* Chuyển trạng thái đặc quyền của đơn.
* Quản lý QR.
* Xem dữ liệu nội bộ của hệ thống.

---

# 8. ADMIN ACCOUNT

Admin là ngoại lệ.

Admin **không được tạo thông qua register thông thường**.

Hệ thống phải cung cấp script ngoài để tạo admin.

Ví dụ:

```text
auto-create-admin
```

Script:

1. Kết nối trực tiếp SQLite database.
2. Nhập username/email.
3. Nhập mật khẩu.
4. Hash mật khẩu.
5. Tạo record tài khoản.
6. Gán role:

```text
ADMIN
```

7. Lưu vào database.

Không được lưu plaintext password.

Admin account là tài khoản đặc quyền cao nhất.

---

# 9. NAVIGATION — PUBLIC

Navigation chính được đặt ở phía trên giao diện.

Bố cục:

```text
------------------------------------------------------------

 Trang chủ        [ LOGO ]                    Điều khoản
 Danh sách đơn    [ LOGO ]                    Về chúng tôi

                                             ĐĂNG NHẬP

------------------------------------------------------------
```

Thiết kế thực tế được phép responsive hóa nhưng phải giữ tinh thần:

* Logo ở trung tâm vùng header.
* Navigation hai phía.
* Login nằm ở vị trí dễ nhìn.
* Mobile chuyển sang navigation phù hợp màn hình nhỏ.

---

# 10. PUBLIC FRONTEND

Public frontend không yêu cầu đăng nhập để truy cập.

Bao gồm:

```text
Trang chủ
Danh sách đơn
Về chúng tôi
Điều khoản
Đăng nhập
Đăng ký
```

---

# 11. TRANG CHỦ

Trang chủ là landing/front-tier của hệ thống.

Thứ tự nội dung:

```text
Hero / Branding
↓
Widget đặt lịch
↓
Danh sách gói dịch vụ
↓
Đánh giá khách hàng
↓
Footer
```

---

# 12. WIDGET ĐẶT LỊCH

Đây là thành phần quan trọng nhất của trang chủ.

## 12.1. Calendar layout

Chỉ hiển thị **7 ngày**:

```text
Thứ 2 | Thứ 3 | Thứ 4 | Thứ 5 | Thứ 6 | Thứ 7 | Chủ nhật
Ngày  | Ngày  | Ngày  | Ngày  | Ngày  | Ngày  | Ngày
```

Không được tạo quá nhiều cột ngang.

Tuần hiện tại được cập nhật tự động.

Mặc định:

```text
Monday → Sunday
```

Ngày tháng phải tự động thay đổi theo tuần hiện tại.

Timezone sử dụng:

```text
Asia/Ho_Chi_Minh
```

---

# 13. TIME SLOT

Khung giờ làm việc:

```text
07:00 - 08:00
08:00 - 09:00
09:00 - 10:00
10:00 - 11:00
11:00 - 12:00
12:00 - 13:00
13:00 - 14:00
14:00 - 15:00
15:00 - 16:00
16:00 - 17:00
17:00 - 18:00
18:00 - 19:00
```

Điểm kết thúc:

```text
19:00
```

Không có slot sau 19:00.

Mỗi slot có duration chuẩn:

```text
1 giờ
```

---

# 14. SLOT AVAILABILITY

Mỗi slot phải phản ánh trạng thái kỹ thuật viên.

## 14.1. Không có kỹ thuật viên

Nếu không có technician nào phù hợp với slot:

```text
Slot = unavailable
```

Hiển thị:

* Không màu xanh.
* Không cho đặt.
* Có thể dùng trạng thái muted/disabled.

---

## 14.2. Có technician

Nếu có technician rảnh:

```text
Slot = available
```

Hiển thị:

* Màu xanh lá.
* Avatar technician.
* Có thể hiển thị nhiều avatar nếu nhiều technician cùng rảnh.

---

# 15. HOVER TECHNICIAN

Hover vào slot kỹ thuật viên phải hiện thông tin:

```text
Avatar
Họ và tên
Thông tin ngắn
Nút / hành động đặt lịch
```

Nếu có nhiều technician:

```text
Technician A
Technician B
Technician C
```

có thể chọn technician thích hợp.

---

# 16. BOOKING FLOW

Khi user click slot:

### Chưa đăng nhập

```text
Click slot
↓
Redirect Login
↓
Login thành công
↓
Return về booking flow
↓
Tiếp tục đặt lịch
```

Không được làm mất slot user đã chọn.

---

### Đã đăng nhập

```text
Click slot
↓
Chọn gói dịch vụ
↓
Xác nhận thông tin
↓
Tạo order
```

Backend phải kiểm tra availability lại lần cuối trước khi tạo đơn nhằm tránh:

```text
Double booking
Race condition
```

---

# 17. RESPONSIVE CALENDAR

Calendar là khu vực dễ phá layout nhất.

Yêu cầu:

* Không được làm toàn bộ website tràn ngang.
* Không để width của từng cột vô hạn.
* Ưu tiên tăng chiều cao/stack nội dung thay vì phóng quá rộng.
* Desktop có thể hiển thị 7 cột.
* Tablet phải tự co giãn.
* Mobile phải có chiến lược hiển thị phù hợp nhưng không được phá dữ liệu.

Các slot có thể mở rộng theo chiều dọc nếu text/avatar nhiều.

Không được dùng layout khiến:

```text
7 columns × width quá lớn
```

làm toàn bộ trang xuất hiện horizontal overflow ngoài ý muốn.

---

# 18. SERVICE PACKAGES

Bên dưới calendar là khu vực dịch vụ.

Hiện tại có hai package:

## BASIC

Giá:

```text
50.000 VNĐ
```

Bao gồm:

* Tra keo tản nhiệt thông thường.
* Vệ sinh máy cơ bản.

---

## PREMIUM

Giá:

```text
100.000 VNĐ
```

Bao gồm:

* Tra keo tản nhiệt chất lượng cao.
* Vệ sinh máy chi tiết.
* Kiểm tra tình trạng máy.
* Kiểm tra phần mềm.
* Hỗ trợ làm sạch hệ thống.
* Hỗ trợ cài đặt phần mềm nếu khách yêu cầu.

---

# 19. SERVICE CARD

Mỗi package card có:

```text
Ảnh
Tên package
Mô tả
Danh sách nội dung
Giá
Nút đặt lịch
```

Nếu số lượng package vượt chiều rộng:

* Không được kéo toàn bộ trang.
* Sử dụng horizontal carousel/slider.
* Có nút Previous / Next.

---

# 20. REVIEW SECTION

Cuối homepage có khu vực:

```text
Khách hàng nói gì?
```

Nguồn dữ liệu:

* Chỉ lấy review từ các đơn đã hoàn thành.
* Không query toàn bộ database.

Mỗi request mặc định:

```text
LIMIT 10
```

Ban đầu:

```text
10 review mới nhất
```

Có nút:

```text
Tải thêm
```

Mỗi lần bấm:

```text
+10 review cũ hơn
```

Backend tuyệt đối không trả toàn bộ danh sách review.

---

# 21. TRANG DANH SÁCH ĐƠN

Trang này public.

Không yêu cầu login.

Hiển thị:

```text
Người đặt
Gói dịch vụ
Thời gian đặt
Trạng thái
Kỹ thuật viên
Địa điểm
```

Mỗi item/order có giao diện rõ ràng.

---

# 22. PUBLIC ORDER PAGINATION

Không được query toàn bộ đơn.

Request đầu tiên:

```text
10 orders
```

Request tiếp theo:

```text
10 orders tiếp theo
```

Có thể sử dụng:

```text
Load More
```

hoặc pagination.

Yêu cầu bắt buộc:

```text
KHÔNG SELECT ALL ORDERS để render frontend.
```

---

# 23. PRIVACY DATA PUBLIC ORDER

Các trường nhạy cảm như:

* Password.
* Email riêng tư.
* Số điện thoại.
* Thông tin xác thực.

không được public.

Dữ liệu public phải đi qua DTO/serialization riêng.

Không trả nguyên object User từ backend.

---

# 24. TRANG VỀ CHÚNG TÔI

Phần đầu:

```text
Giới thiệu IT Supporter
```

Bao gồm:

* Đội ngũ.
* Mục đích.
* Dịch vụ.
* Thông tin liên hệ.

Có các kênh:

* Email.
* Zalo.
* Page.
* Các kênh chính thức khác.

---

# 25. TECHNICIAN PROFILE GRID

Sau phần giới thiệu là grid technician.

Mỗi card:

```text
Avatar
Họ và tên
Thông tin phụ ngắn
```

Các card phải có kích thước đồng đều.

Grid responsive:

```text
Desktop
Tablet
Mobile
```

---

# 26. TRUNCATE TECHNICIAN PROFILE

Nếu thông tin vượt quá độ dài cho phép:

```text
...
Xem thêm
```

Không làm card cao bất thường.

---

# 27. TECHNICIAN DETAIL MODAL

Click:

```text
Xem thêm
```

sẽ mở detail modal.

Không chuyển sang trang mới.

Modal hiển thị:

* Avatar.
* Tên.
* Thông tin đầy đủ.
* Nội dung profile.

Có nút:

```text
X
```

Nút X nằm cố định/dính trong vùng modal.

Nếu modal nội dung dài và phải scroll:

```text
X luôn nằm cố định
```

để user có thể đóng modal mà không cần kéo ngược lên đầu.

Click bên ngoài modal:

```text
Close
```

cũng được hỗ trợ.

---

# 28. TRANG ĐIỀU KHOẢN

Trang điều khoản gồm:

## Dành cho khách hàng

* Quy định đặt lịch.
* Quy định đổi lịch.
* Quy định hủy.
* Quy định thời gian.
* Quy định thanh toán.
* Quy định sử dụng dịch vụ.
* Quy định phản hồi.

## Dành cho technician

* Quy định nhận đơn.
* Quy định đúng giờ.
* Quy định thực hiện đơn.
* Quy định xử lý tiền.
* Quy định báo cáo.
* Quy định trách nhiệm.

## Khiếu nại

Hiển thị:

```text
Email
Zalo
Page chính thức
Kênh liên hệ
```

---

# 29. FOOTER

Footer phải chuyên nghiệp.

Bao gồm:

```text
Logo
IT Supporter
Mô tả ngắn
Navigation
Dịch vụ
Liên hệ
Điều khoản
Kênh chính thức
Copyright
```

Có thể sử dụng:

```text
it.png
```

cho footer.

---

# 30. AUTHENTICATION

Trang login dùng chung cho toàn bộ hệ thống.

Các role:

```text
Guest
Technician
Manager
Admin
```

đều sử dụng hệ thống authentication chung.

Role không được user tự chọn khi register.

---

# 31. REGISTER

User thông thường chỉ có:

```text
Register
↓
GUEST
```

Không có form:

```text
I want to be admin
I want to be technician
I want to be manager
```

Role đặc biệt phải do admin phân quyền.

---

# 32. LOGIN UI

Trang login cần thiết kế đẹp và rõ ràng.

Có:

* Logo.
* Form email/username.
* Password.
* Remember Me.
* Login.
* Register.
* Back to homepage.

Không có:

```text
Forgot Password
```

theo yêu cầu hiện tại.

---

# 33. BACK TO HOME

Trang login có:

```text
←
```

ở góc trên bên trái.

Click:

```text
Trang chủ
```

---

# 34. REMEMBER PASSWORD

Có tùy chọn:

```text
Remember me
```

Việc implement phải đảm bảo an toàn.

Không lưu plaintext password ở:

```text
localStorage
cookie
database
```

---

# 35. AUTH SECURITY

Mật khẩu phải hash.

Không được:

```text
password = "123456"
```

lưu trực tiếp database.

Sử dụng password hashing hiện đại như:

```text
Argon2id
```

hoặc thuật toán tương đương có salt.

---

# 36. JWT

Authentication backend sử dụng JWT hoặc cơ chế token tương đương.

JWT phải:

* Được ký.
* Có secret mạnh.
* Secret nằm trong `.env`.
* Không hard-code secret trong source.
* Có expiration.
* Có kiểm tra signature.
* Có kiểm tra role.
* Không tin role từ client.

Khuyến nghị:

```text
Access Token
+
Refresh mechanism
```

và cookie phù hợp:

```text
HttpOnly
Secure
SameSite
```

nếu kiến trúc cho phép.

---

# 37. CUSTOMER AUTHENTICATED NAVIGATION

Khi user login dưới role Guest/Customer:

Navigation public:

```text
Danh sách đơn
```

được đổi thành:

```text
Đơn hàng
```

Click vào sẽ chỉ hiển thị:

```text
đơn hàng của chính user đó
```

Không được lấy toàn bộ đơn hệ thống.

---

# 38. CUSTOMER ORDER LIST

Customer nhìn thấy:

```text
Đơn 001
Đơn 002
Đơn 003
...
```

Mỗi order:

* Service package.
* Date/time.
* Technician.
* Location.
* Status.
* Last update.
* Có tin nhắn mới hay không.

---

# 39. CUSTOMER ORDER DETAIL

Click order:

```text
Order Detail
```

Có:

```text
← Quay lại danh sách đơn
```

Trang detail gồm:

* Thông tin khách.
* Gói dịch vụ.
* Kỹ thuật viên.
* Lịch.
* Địa điểm.
* Giá.
* Trạng thái.
* Timeline.
* Chat.
* Hủy đơn.
* Đổi lịch.
* Payment.
* Review nếu đủ điều kiện.

---

# 40. ORDER CHAT

Mỗi order có một chat box riêng.

Chat được gắn với:

```text
order_id
```

Chỉ có:

```text
Customer
Technician phụ trách
```

được tham gia.

Manager/Admin có thể có quyền kiểm tra theo chính sách hệ thống/audit.

Không được để user A đọc chat của order user B.

---

# 41. CHAT NOTIFICATION

Nếu order có tin nhắn mới:

```text
Notification Bell
```

hiển thị notification.

Notification phải chứa:

* Order.
* Người gửi.
* Thời gian.
* Nội dung preview.
* trạng thái đã đọc/chưa đọc.

Click notification:

```text
→ mở order detail
→ focus chat
```

---

# 42. ORDER STATUS

Lifecycle chính:

```text
PENDING
↓
CONFIRMED
↓
IN_PROGRESS
↓
COMPLETED
```

Trong đó:

### PENDING

Khách mới tạo đơn.

Ý nghĩa:

```text
Người đặt mới đặt đơn.
```

### CONFIRMED

Khách và technician đã xác lập đơn.

Có thể hiểu là:

```text
Đơn đã được xác nhận.
```

### IN_PROGRESS

Technician bắt đầu thực hiện.

Timer được kích hoạt.

### COMPLETED

Đơn được đóng chính thức.

---

# 43. TERMINAL RESULT

Các trường hợp đặc biệt:

```text
SUCCESS
FAILED
CANCELLED
```

Có thể lưu riêng dưới dạng:

```text
completion_result
```

nhằm tránh làm bẩn lifecycle chính.

Ví dụ:

```text
status = COMPLETED
completion_result = SUCCESS
```

hoặc:

```text
status = COMPLETED
completion_result = CANCELLED
```

hoặc:

```text
status = COMPLETED
completion_result = FAILED
```

---

# 44. CUSTOMER RESCHEDULE

Khách có:

```text
Đề xuất đổi lịch
```

Không được tự sửa lịch backend trực tiếp.

Flow:

```text
Customer proposes new slot
↓
Technician receives notification
↓
Accept / Reject
↓
If accepted
    update order schedule
```

Việc đổi slot phải kiểm tra availability lại.

---

# 45. CANCEL ORDER

Customer có nút:

```text
Hủy đơn
```

Khi click:

```text
Confirmation modal
```

Không được hủy ngay lập tức.

---

# 46. REVIEW

Sau khi order hoàn thành, customer được đánh giá:

```text
★★★★★
```

và:

```text
Cảm nhận
```

Giới hạn:

```text
300 / 300 ký tự
```

Review gắn với order.

Một order chỉ được review theo chính sách:

```text
one review / order
```

---

# 47. CUSTOMER PROFILE

Customer có trang:

```text
Tài khoản cá nhân
```

Có thể chỉnh sửa:

* Họ tên.
* Email.
* Số điện thoại.
* Thông tin liên lạc thêm.
* Avatar.

Thông tin liên lạc thêm:

```text
300 ký tự
```

Hiển thị role:

```text
Role: Guest
```

---

# 48. TECHNICIAN DASHBOARD

Technician có dashboard riêng.

Hiển thị:

* Đơn hiện có.
* Đơn đang xử lý.
* Đơn đã hoàn thành.
* Đơn chờ xác nhận.
* Notification.
* Số dư.
* Lịch làm việc.

---

# 49. TECHNICIAN ORDER DETAIL

Technician dùng chung order detail architecture với Customer nhưng có thêm quyền:

```text
Change Status
```

---

# 50. TECHNICIAN STATUS CONTROL

Chỉ technician phụ trách order mới có quyền chuyển trạng thái nghiệp vụ của order.

Customer:

```text
KHÔNG được chuyển trạng thái.
```

Manager/Admin có quyền quản trị theo RBAC và audit policy.

---

# 51. STATUS CHANGE CONFIRMATION

Khi technician click:

```text
Change status
```

phải xuất hiện confirmation modal.

Ví dụ:

```text
Bạn có chắc chắn muốn chuyển đơn sang
"Đang thực hiện"?
```

Có:

```text
Hủy
Xác nhận
```

Mục đích:

* Tránh thao tác nhầm.
* Tránh bắt đầu timer ngoài ý muốn.
* Đảm bảo financial/log consistency.

---

# 52. TECHNICIAN CANCEL

Technician có:

```text
Hủy đơn
```

Cũng phải có double confirmation.

Nếu yêu cầu lý do:

```text
Cancellation reason
```

phải lưu vào audit/order log.

---

# 53. ORDER MAX DURATION

Mỗi order có thời lượng chuẩn:

```text
60 phút
```

Tức:

```text
1 order = tối đa 1 giờ
```

Timer nghiệp vụ bắt đầu khi:

```text
Technician chuyển PENDING/CONFIRMED
→ IN_PROGRESS
```

---

# 54. ORDER TIMER

Khi technician bắt đầu:

```text
IN_PROGRESS
```

hệ thống tạo:

```text
started_at
```

Frontend hiển thị:

```text
00:00
00:01
00:02
...
```

hoặc countdown tùy UI.

Timer phải dựa trên timestamp backend, không được chỉ dựa vào JavaScript local timer.

---

# 55. LATE POLICY

Nếu technician muộn:

```text
≥ 10 phút
```

giá trị order bị trừ:

```text
15%
```

Ví dụ:

```text
100.000 VNĐ
→ giảm 15.000 VNĐ
```

Giá trị tính toán phải được backend thực hiện.

Không tin giá do frontend gửi.

---

# 56. EXTREME LATE

Có chính sách:

```text
Cực muộn
→ làm miễn phí cho khách
```

Ngưỡng "cực muộn" phải là **cấu hình hệ thống**, không hard-code frontend.

Ví dụ cấu hình:

```text
late_penalty_minutes = 10
late_penalty_percent = 15

free_service_after_minutes = configurable
```

Mọi thay đổi chính sách phải được log.

---

# 57. EXTEND / EXPEDITE OPTION

Một order có thể có:

```text
Extend / extra option
```

cho phép khách lựa chọn thêm dịch vụ hoặc tăng tốc/ưu tiên tiến độ theo thỏa thuận.

Technician có thể thiết lập:

```text
Giá làm thêm
```

nếu tính năng được bật.

Khoản tiền này:

```text
100% technician
```

không chia 70/30 với đội.

---

# 58. CORE REVENUE SPLIT

Đơn thông thường:

```text
70% Technician
30% IT Supporter
```

Ví dụ:

```text
100.000
Technician = 70.000
IT Supporter = 30.000
```

Phải lưu chi tiết:

```text
gross_amount
technician_share
team_share
```

---

# 59. EXTEND REVENUE

Khoản extend/extra option:

```text
100% Technician
```

Không tính vào 70/30.

Phải có transaction/log riêng.

---

# 60. PAYMENT / QR

Khi thực hiện xong dịch vụ:

Technician hiển thị QR thanh toán chung của đội.

QR này có thể hiển thị trên:

* Desktop.
* Tablet.
* Mobile.

Nguồn ảnh QR:

```text
Admin quản lý
```

---

# 61. QR MANAGEMENT

Admin có giao diện:

```text
Payment QR Management
```

Cho phép:

* Upload QR.
* Thay QR.
* Xem QR hiện tại.
* Kích hoạt QR.

Chỉ một QR active tại một thời điểm hoặc phải có version rõ ràng.

---

# 62. PAYMENT CONFIRMATION

Sau khi customer chuyển tiền:

Technician có lựa chọn:

```text
Đã thu
Chưa thu
```

Nếu:

```text
Chưa thu
```

phải nhập:

```text
Lý do
```

---

# 63. FINAL ORDER CLOSURE

Order không được xem là kết thúc chính thức chỉ vì technician đã thực hiện xong công việc.

Flow:

```text
IN_PROGRESS
↓
Service completed
↓
Payment confirmation
↓
Technician xác nhận ĐÃ THU
↓
Generate receipt/log
↓
END ORDER
↓
COMPLETED
```

Nếu chưa thu:

```text
Payment status = UNPAID
```

và lưu reason.

---

# 64. RECEIPT / ORDER LOG

Khi đóng order phải tạo log đầy đủ.

Thông tin tối thiểu:

```text
Order ID
Customer
Technician
Service
Original price
Penalty
Discount
Extend fee
Final price
Technician share
Team share
Payment status
QR/payment method
Started at
Completed at
Created at
```

---

# 65. FINANCIAL LEDGER

Do tiền là nghiệp vụ quan trọng, hệ thống không được chỉ lưu:

```text
technician.balance
team.balance
```

mà phải có ledger.

Ví dụ:

```text
Financial transaction
```

Mỗi transaction có:

```text
transaction_id
order_id
technician_id
type
amount
created_at
created_by
reference
```

Các loại:

```text
ORDER_REVENUE
TECHNICIAN_SHARE
TEAM_SHARE
LATE_PENALTY
EXTEND_FEE
SETTLEMENT
REFUND
ADJUSTMENT
```

---

# 66. TEAM BALANCE

"Số dư chung" là số dư tổng của đội dựa trên **các giao dịch thực tế/log tài chính**.

Không được cho phép sửa balance tùy tiện.

Balance phải có thể tính lại từ ledger.

Mục đích:

* Tránh thất thoát.
* Truy vết.
* Kiểm toán.
* Khôi phục khi database/logic có lỗi.

---

# 67. TECHNICIAN BALANCE

Technician có:

```text
Balance
```

Số dư đại diện cho tiền đang chờ quyết toán.

Ví dụ:

```text
Technician earned: 1.000.000
Settled: 700.000
Current balance: 300.000
```

---

# 68. SETTLEMENT

Manager có chức năng:

```text
Kết toán
```

Flow:

```text
Manager chọn technician
↓
Xem số dư
↓
Xem ledger
↓
Xem đơn liên quan
↓
Bấm Kết toán
↓
Double confirmation
↓
Create settlement transaction
↓
Technician balance = 0 theo ledger calculation
```

Không chỉ chạy:

```sql
UPDATE technicians SET balance = 0
```

mà phải tạo transaction:

```text
SETTLEMENT
```

để giữ lịch sử.

---

# 69. SETTLEMENT SAFETY

Kết toán phải có:

* Database transaction.
* Audit log.
* Settlement ID.
* Người thực hiện.
* Thời gian.
* Số tiền trước.
* Số tiền kết toán.
* Số tiền sau.
* Các order liên quan.

Nếu xảy ra lỗi:

```text
Rollback
```

Không được tạo trạng thái:

```text
tiền đã trừ nhưng settlement chưa ghi log
```

hoặc ngược lại.

---

# 70. FINANCIAL RECOVERY

Vì dữ liệu tài chính đặc biệt quan trọng, hệ thống phải có cơ chế recovery.

Yêu cầu:

* SQLite backup.
* Transaction.
* Integrity check.
* Ledger.
* Audit logs.
* Không cho xóa lịch sử tài chính thông thường.
* Không hard-delete transaction tài chính.
* Có thể phục hồi từ backup.
* Có khả năng reconcile balance.

---

# 71. MANAGER DASHBOARD

Manager có dashboard thống kê.

Bao gồm:

```text
Tổng đơn
Đơn hoàn thành
Đơn hủy
Đơn thất bại
Đơn đang xử lý
Doanh thu
Doanh thu đội
Thu nhập technician
Số dư technician
```

---

# 72. FINANCIAL REPORT

Có báo cáo:

```text
Theo tháng
Theo năm
Theo khoảng thời gian
```

Filter:

```text
All technicians
Technician cụ thể
```

Có thể lọc theo:

```text
Date
Technician
Package
Status
Payment status
```

---

# 73. TECHNICIAN STATISTICS

Có biểu đồ:

* Số đơn của từng technician.
* Doanh thu.
* Đơn hoàn thành.
* Đơn hủy.
* Đơn thất bại.
* Tổng thu nhập.
* Số dư.
* Thời gian thực hiện.
* Late orders.

Không được chỉ hiển thị chart đẹp mà không có bảng dữ liệu bên dưới.

---

# 74. GENERAL STATISTICS

Dashboard tổng có thể có:

```text
Orders / day
Orders / week
Orders / month
Revenue / month
Revenue / year
```

Biểu đồ phải có filter thời gian.

---

# 75. REPORT EXPORT

Manager/Admin có thể xuất báo cáo:

```text
XLSX
```

và có HTML table để xem trực tiếp.

---

SERVICE PACKAGE MANAGEMENT

Admin có thể quản lý các card/gói dịch vụ đang hiển thị trên homepage:

Tạo gói dịch vụ mới.
Chỉnh sửa gói dịch vụ.
Thay đổi tên gói.
Thay đổi mô tả.
Thay đổi giá.
Thay đổi ảnh/card thumbnail.
Thay đổi nội dung chi tiết dịch vụ.
Bật/tắt trạng thái active.
Thay đổi thứ tự hiển thị.
Ẩn gói dịch vụ khỏi homepage mà không cần xóa dữ liệu.
Xóa gói dịch vụ khi thực sự cần thiết, có double-confirm.

Mỗi service package nên có dữ liệu kiểu:

id
name
description
price
image
duration_minutes
features
display_order
is_active
created_at
updated_at

Quan trọng là không hard-code Basic/Premium ở frontend. Frontend homepage chỉ query các package đang is_active = true rồi render thành card. Sau này admin thêm ULTRA, DEEP CLEAN, GPU CLEANING... thì không cần sửa code frontend.

----

# 76. ADMIN DASHBOARD

Admin có quyền quản trị hệ thống.

Các module:

```text
Users
Roles
Technicians
Managers
QR
System configuration
Audit log
Financial logs
Orders
Reviews
```

---

# 77. ACCOUNT MANAGEMENT

Admin có thể:

* Search account.
* Search theo email.
* Search theo tên.
* Xem role.
* Đổi mật khẩu.
* Xóa tài khoản vĩnh viễn.
* Đổi role.
* Xem profile.
* Disable/enable nếu hệ thống hỗ trợ.

---

# 78. ACCOUNT PAGINATION

Tuyệt đối không:

```text
SELECT * FROM users
```

rồi load toàn bộ.

Mặc định:

```text
10 accounts
```

Mỗi request:

```text
10 records
```

Search cũng giới hạn 10 record mỗi chunk/page.

---

# 79. DELETE ACCOUNT

Xóa account phải có:

```text
Confirmation modal
```

Ví dụ:

```text
Bạn có chắc chắn muốn xóa tài khoản này?

Hành động này có thể không thể hoàn tác.
```

Admin phải xác nhận.

---

# 80. ROLE MANAGEMENT

Admin có thể phân role:

```text
GUEST
TECHNICIAN
MANAGER
ADMIN
```

Role change phải:

* Server-side authorization.
* Audit log.
* Double confirmation cho quyền đặc biệt.
* Không cho user tự nâng role.

---

# 81. PROTECTION OF ADMIN

Admin account không được tạo bằng register thông thường.

Không được phép:

```text
Public API:
POST /register
role=ADMIN
```

Backend phải bỏ qua role client gửi.

Ví dụ request:

```json
{
  "email": "x",
  "password": "x",
  "role": "ADMIN"
}
```

phải luôn tạo:

```text
GUEST
```

trừ flow admin provisioning đặc biệt.

---

# 82. RBAC

Tất cả chức năng protected phải kiểm tra:

```text
Authentication
+
Authorization
+
Resource ownership
```

Ví dụ:

Customer không được:

```text
GET /orders/OTHER_USER_ORDER
```

dù biết order ID.

Technician không được sửa đơn của technician khác nếu không có quyền.

Manager không mặc định có quyền admin.

Admin mới có quyền quản trị toàn hệ thống.

---

# 83. SECURITY REQUIREMENTS

Hệ thống phải xử lý triệt để:

```text
SQL Injection
Command Injection
XSS
Broken Access Control
Authentication bypass
JWT abuse
Rate-limit bypass
CSRF nếu cookie auth
IDOR
Mass assignment
Sensitive data exposure
```

---

# 84. SQL INJECTION

Không concat SQL string từ user.

Không làm:

```typescript
`SELECT * FROM users WHERE email = '${email}'`
```

Sử dụng:

```text
Parameterized Query
Prepared Statement
```

---

# 85. XSS

Phải:

* Escape output.
* Validate input.
* Sanitize content khi cần.
* Không render HTML từ user trực tiếp.
* Không dùng `innerHTML` với dữ liệu không tin cậy nếu không sanitize.

Đặc biệt chú ý:

```text
Chat
Review
Profile
Contact information
Order notes
```

---

# 86. COMMAND INJECTION

Backend không được chạy shell command từ user-controlled input.

Các chức năng upload/export/import nếu có phải:

* Validate filename.
* Validate path.
* Không ghép command bằng string.
* Không cho user kiểm soát arbitrary executable arguments.

---

# 87. JWT SECRET

Secret:

```text
.env
```

Không được:

```text
Git
frontend source
Docker image public
README
```

Nếu repository public:

```text
.env
```

phải nằm trong:

```text
.gitignore
```

và có:

```text
.env.example
```

chứa placeholder.

---

# 88. RATE LIMIT

Rate limit tối thiểu phải áp dụng cho:

```text
Login
Register
Password change
Admin authentication
Chat sending
OTP nếu sau này có
Sensitive financial endpoints
Role modification
```

Login phải có chống brute-force.

---

# 89. INPUT VALIDATION

Backend validate tất cả input:

* Email.
* Phone.
* Name.
* Review.
* Chat.
* Address.
* Order data.
* Package.
* Slot.
* Financial values.

Frontend validation chỉ là UX.

Backend validation mới là enforcement.

---

# 90. AUDIT LOG

Các hành động quan trọng phải log:

```text
Login
Failed login
Register
Role change
Password change
Order create
Order status change
Order cancellation
Reschedule
Payment confirmation
Financial adjustment
Settlement
QR change
Admin action
Account deletion
```

Audit log nên có:

```text
actor
action
target
timestamp
IP nếu phù hợp
metadata
result
```

---

# 91. ORDER AUDIT LOG

Order cần timeline:

```text
Created
Confirmed
Assigned
Started
Rescheduled
Cancelled
Payment recorded
Completed
```

Ví dụ:

```text
[21:03] Customer created order
[21:08] Technician accepted order
[22:01] Technician started service
[22:52] Payment received
[22:53] Order completed
```

---

# 92. PROFILE — TECHNICIAN

Technician profile có:

* Avatar.
* Tên.
* Email.
* Số điện thoại.
* Contact info.
* Public profile.
* Role.
* Balance.

Public profile text:

```text
5000 / 5000 characters
```

---

# 93. TECHNICIAN PERSONAL INFORMATION

Technician có thể chỉnh:

* Tên.
* Email.
* Phone.
* Contact information.
* Avatar.
* Public About Me.

Có hiển thị:

```text
Role: Technician
```

---

# 94. TECHNICIAN BALANCE UI

Hiển thị:

```text
Số dư hiện tại
```

Có thể xem:

```text
Current balance
Transaction history
Settlements
Order earnings
```

Technician không có quyền tự sửa số dư.

---

# 95. MANAGER VS ADMIN

## Manager

Tập trung:

```text
Operations
Orders
Statistics
Financial reports
Settlement
Technician performance
```

## Admin

Tập trung:

```text
System administration
Accounts
Roles
QR
Configuration
Audit
```

Admin có quyền cao nhất.

Manager không tự động có quyền:

```text
Create admin
Change admin role
Delete admin
```

---

# 96. DATABASE ENTITIES

Thiết kế database tối thiểu nên có:

```text
users
roles
technician_profiles
services
service_packages
technicians_availability
orders
order_status_history
order_messages
notifications
reviews
payments
financial_transactions
settlements
qr_configs
audit_logs
system_settings
```

Có thể bổ sung bảng khác khi implementation cần.

---

# 97. USERS

Ví dụ field:

```text
id
email
password_hash
name
phone
role
avatar_url
contact_info
status
created_at
updated_at
```

---

# 98. SERVICES / PACKAGES

Ví dụ:

```text
id
name
description
price
image
duration_minutes
is_active
created_at
updated_at
```

Package không nên hard-code toàn bộ trong frontend.

---

# 99. TECHNICIAN AVAILABILITY

Cần lưu:

```text
technician_id
date
start_time
end_time
status
```

hoặc schema tương đương.

Availability phải là dữ liệu backend.

Frontend không tự suy đoán technician rảnh.

---

# 100. ORDERS

Order tối thiểu:

```text
id
customer_id
technician_id
package_id
scheduled_date
scheduled_start
scheduled_end
location
price
penalty
extend_fee
final_amount
status
completion_result
payment_status
created_at
updated_at
started_at
completed_at
```

---

# 101. CHAT MESSAGE

Ví dụ:

```text
id
order_id
sender_id
message
created_at
read_at
```

Không gửi toàn bộ chat history nếu quá lớn.

Chat history nên pagination.

---

# 102. NOTIFICATION

Ví dụ:

```text
id
user_id
order_id
type
title
content
is_read
created_at
```

---

# 103. REVIEW

Ví dụ:

```text
id
order_id
customer_id
technician_id
rating
content
created_at
```

Backend giới hạn:

```text
content <= 300 characters
rating = 1..5
```

---

# 104. FINANCIAL TRANSACTION

Ví dụ:

```text
id
order_id
technician_id
type
amount
direction
reference_id
created_at
created_by
metadata
```

Không được sửa trực tiếp transaction cũ nếu không có cơ chế adjustment/audit.

---

# 105. API PAGINATION

Toàn bộ collection endpoint quan trọng phải pagination.

Không cho phép API mặc định:

```text
GET /orders
```

trả hàng nghìn record.

Mặc định:

```text
limit = 10
```

Backend có thể hard-cap:

```text
maxLimit = 10
```

đối với các màn hình được yêu cầu cụ thể.

---

# 106. SEARCH

Admin search users hỗ trợ:

```text
email
name
```

Có thể mở rộng:

```text
phone
role
```

Search cũng pagination.

Ví dụ:

```text
GET /admin/users?q=duc&page=1&limit=10
```

---

# 107. PUBLIC DATA API

Public API cần DTO riêng.

Ví dụ:

```text
PublicOrderDTO
PublicTechnicianDTO
PublicReviewDTO
```

Không trả trực tiếp database entities.

---

# 108. ERROR HANDLING

Backend phải có error format thống nhất.

Ví dụ:

```json
{
  "success": false,
  "error": {
    "code": "ORDER_ALREADY_BOOKED",
    "message": "Khung giờ này không còn khả dụng."
  }
}
```

Không leak:

* Stack trace.
* SQL query.
* Secret.
* Internal file path.
* Database structure.

trong production response.

---

# 109. FRONTEND ERROR STATE

Frontend phải có:

```text
Loading
Empty
Error
Success
```

cho các khu vực dynamic.

Ví dụ:

```text
Không có technician rảnh
```

thay vì để component trống.

---

# 110. LOADING UX

Các trang phải có loading state đẹp.

Có thể sử dụng:

```text
cog.svg
```

với animation.

Không nên dùng spinner nhấp nháy khó chịu.

---

# 111. RESPONSIVE DESIGN

Bắt buộc hỗ trợ:

```text
Desktop
Laptop
Tablet
iPad
Mobile
```

Phải test ít nhất:

```text
320px
375px
390px
768px
1024px
1280px
1440px
1920px
```

---

# 112. RESPONSIVE PRINCIPLES

Không để:

```text
horizontal overflow
```

ngoại trừ các component cố ý scroll ngang.

Các bảng quản trị lớn được phép:

```text
horizontal scroll trong container
```

nhưng không làm vỡ toàn bộ viewport.

---

# 113. VISUAL STYLE

UI:

```text
Light
Clean
Rounded
Professional
Orange/White
```

Border radius:

```text
medium
```

Không lạm dụng.

Shadow nhẹ.

Typography dễ đọc.

---

# 114. NAV MOBILE

Trên mobile navigation có thể chuyển sang:

```text
Hamburger / drawer
```

nhưng logo và authentication state vẫn phải dễ truy cập.

---

# 115. DEPLOYMENT

Hệ thống phải dễ triển khai trên server.

Mục tiêu:

```text
clone repository
↓
install dependencies
↓
configure .env
↓
setup database
↓
build frontend/backend
↓
run PM2
↓
Nginx reverse proxy
↓
SSL
```

---

# 116. PM2

Backend phải hỗ trợ PM2.

Ví dụ:

```text
pm2 start
pm2 restart
pm2 stop
pm2 logs
pm2 save
pm2 startup
```

Có thể cung cấp:

```text
ecosystem.config.cjs
```

hoặc tương đương.

---

# 117. NGINX

Phải hỗ trợ Nginx.

Cần có cấu hình mẫu sạch, ví dụ:

```text
nginx/
    itsupporter.conf
```

Cấu hình có thể:

```text
Internet
   ↓
Nginx
   ↓
Frontend
Backend API
```

---

# 118. NGINX SSL

Hệ thống phải hỗ trợ SSL.

Cho phép thay:

```text
example.com
```

bằng domain thực tế.

Có thể sử dụng:

```text
Let's Encrypt
Certbot
```

hoặc certificate có sẵn.

Nginx config không hard-code domain cố định.

---

# 119. ENV CONFIGURATION

Phải có:

```text
.env.example
```

Ví dụ:

```text
NODE_ENV=
PORT=
DATABASE_PATH=
JWT_SECRET=
JWT_EXPIRES_IN=
CORS_ORIGIN=
PUBLIC_BASE_URL=
```

Không commit secret thật.

---

# 120. SQLITE CONFIGURATION

Database path phải cấu hình bằng environment.

Ví dụ:

```text
DATABASE_PATH=/var/lib/itsupporter/database.sqlite
```

Không hard-code:

```text
/home/nguyenduccanh/...
```

vào production.

---

# 121. DATABASE INITIALIZATION

Phải có:

```text
migration/init script
```

để server mới có thể tạo database schema.

Ví dụ:

```text
npm run db:init
```

hoặc:

```text
npm run migrate
```

---

# 122. ADMIN INITIALIZATION

Có script:

```text
npm run create-admin
```

hoặc binary:

```text
./scripts/create-admin
```

Flow:

```text
Input email
Input password
Confirm password
Create hash
Insert admin
```

Không in plaintext password vào log.

---

# 123. BACKUP

Hệ thống production cần hỗ trợ:

```text
SQLite backup
```

Backup phải bao gồm:

```text
database
uploads/config references nếu cần
```

Đặc biệt database tài chính phải được backup thường xuyên.

---

# 124. UPLOAD

Avatar và QR upload phải:

* Validate MIME.
* Validate extension.
* Giới hạn kích thước.
* Đổi filename.
* Không tin filename client.
* Không cho executable upload.
* Không lưu trực tiếp với tên user cung cấp.

---

# 125. QR IMAGE STORAGE

QR nên có metadata:

```text
id
path
uploaded_by
created_at
is_active
```

Thay QR không được làm mất audit lịch sử.

---

# 126. SESSION / ACCOUNT SECURITY

Account phải có:

```text
account status
```

có thể:

```text
ACTIVE
DISABLED
```

Disabled account không login được.

---

# 127. LOGIN SECURITY

Login phải:

* Rate limit.
* Validate input.
* Không phân biệt quá rõ account tồn tại hay không nếu cần chống enumeration.
* Ghi failed login nếu cần.
* Không log password.

---

# 128. BUSINESS INTEGRITY

Các giá trị quan trọng:

```text
price
discount
penalty
extend_fee
technician_share
team_share
balance
payment_status
order_status
```

không được tin từ frontend.

Ví dụ client gửi:

```json
{
  "price": 1
}
```

backend vẫn phải tự lấy price từ package/database.

---

# 129. BOOKING INTEGRITY

Khi đặt lịch:

```text
BEGIN TRANSACTION
↓
Check slot
↓
Check technician
↓
Check existing orders
↓
Create order
↓
Commit
```

Nếu có race condition:

```text
Rollback
```

và trả:

```text
SLOT_NOT_AVAILABLE
```

---

# 130. STATUS TRANSITION RULE

Backend phải có state transition validation.

Ví dụ:

```text
PENDING
→ CONFIRMED
```

hợp lệ.

```text
PENDING
→ COMPLETED
```

không hợp lệ.

```text
COMPLETED
→ IN_PROGRESS
```

không hợp lệ.

Không cho phép client gọi API để nhảy trạng thái tùy ý.

---

# 131. STATUS TRANSITION LOG

Mỗi chuyển trạng thái:

```text
old_status
new_status
actor
timestamp
reason
```

phải được log.

---

# 132. FINANCIAL STATE MACHINE

Payment cũng cần state:

```text
UNPAID
PARTIAL nếu sau này hỗ trợ
PAID
```

Nếu technician đánh dấu:

```text
NOT_RECEIVED
```

phải có:

```text
reason
```

---

# 133. ORDER CLOSURE CONDITION

Một order chỉ được hoàn tất chính thức khi đủ các điều kiện nghiệp vụ yêu cầu.

Ví dụ:

```text
Service performed
+
Payment recorded
+
Receipt/log generated
+
Technician confirms closure
```

Backend phải enforce điều này.

---

# 134. MANAGER SETTLEMENT CONDITION

Manager chỉ được kết toán nếu:

```text
technician balance > 0
```

và dữ liệu ledger hợp lệ.

Kết toán phải có:

```text
settlement_id
```

---

# 135. FINANCIAL RECONCILIATION

Hệ thống nên có chức năng kiểm tra:

```text
Calculated balance
vs
Stored summary
```

Nếu lệch:

```text
ALERT
```

Không tự im lặng sửa.

---

# 136. REPORTING SOURCES

Dashboard tài chính phải lấy dữ liệu từ:

```text
Financial ledger
```

không lấy một con số balance duy nhất làm nguồn duy nhất.

---

# 137. ADMIN AUDIT

Admin action phải được audit.

Đặc biệt:

```text
Delete user
Change role
Reset password
Change QR
Financial adjustment
```

---

# 138. DELETE USER & FINANCIAL DATA

Việc xóa user cần xử lý quan hệ dữ liệu.

Không được để:

```text
financial_transaction
```

mất hoàn toàn lịch sử chỉ vì delete account.

Có thể dùng:

```text
soft delete
```

cho các account có liên quan đến historical orders/financial data.

Nếu business thật sự yêu cầu hard delete, phải có cơ chế anonymization lịch sử thay vì phá ledger.

---

# 139. CUSTOMER EXPERIENCE

Customer flow hoàn chỉnh:

```text
Homepage
↓
Xem package
↓
Xem lịch
↓
Chọn slot
↓
Login/Register
↓
Booking
↓
Order detail
↓
Chat
↓
Technician confirm
↓
Technician thực hiện
↓
Payment
↓
Completed
↓
Review
```

---

# 140. TECHNICIAN EXPERIENCE

Technician flow:

```text
Login
↓
Dashboard
↓
Order list
↓
Open order
↓
Confirm order
↓
Chat customer
↓
Start service
↓
Timer
↓
Optional extend/extra
↓
Finish service
↓
Show QR
↓
Confirm payment
↓
Generate receipt/log
↓
Close order
```

---

# 141. MANAGER EXPERIENCE

Manager:

```text
Login
↓
Dashboard
↓
Orders
↓
Reports
↓
Financial
↓
Technician statistics
↓
Select technician
↓
Review balance
↓
Settlement
↓
Generate settlement log
```

---

# 142. ADMIN EXPERIENCE

Admin:

```text
Login
↓
Admin Dashboard
↓
Users
Roles
QR
System Configuration
Orders
Audit
Financial logs
```

---

# 143. FRONTEND ROUTING

Có thể tổ chức:

```text
/
 /orders
 /about
 /terms

 /login
 /register

 /account
 /account/orders
 /account/orders/:id

 /technician
 /technician/orders
 /technician/orders/:id
 /technician/profile

 /manager
 /manager/reports
 /manager/finance
 /manager/settlements

 /admin
 /admin/users
 /admin/orders
 /admin/roles
 /admin/qr
 /admin/audit
```

Route guard phải dựa trên role.

---

# 144. API ARCHITECTURE

Backend API có thể tổ chức:

```text
/api/auth
/api/public
/api/orders
/api/chat
/api/reviews
/api/account
/api/technician
/api/manager
/api/admin
```

Các namespace role phải được backend bảo vệ.

---

# 145. API AUTHORIZATION

Ví dụ:

```text
GET /api/orders/:id
```

phải kiểm tra:

```text
Customer → chỉ order của mình
Technician → chỉ order được phép
Manager → theo scope
Admin → full access
```

---

# 146. CHAT AUTHORIZATION

```text
GET /api/orders/:id/messages
```

không chỉ kiểm tra login.

Phải kiểm tra:

```text
request.user
belongs to order?
```

---

# 147. NOTIFICATION READ STATE

Notification có:

```text
unread
read
```

Khi mở notification:

```text
read_at = current time
```

---

# 148. IMAGE & ASSET HANDLING

Frontend sử dụng asset hiện tại:

```text
logo_bo3goc.png
it.png
cog.svg
```

Không tự thay logo bằng logo khác.

Orange branding phải nhất quán.

---

# 149. ACCESSIBILITY / UX

Các nút quan trọng phải:

* Có label.
* Có hover.
* Có focus state.
* Có disabled state.
* Có loading state.

Không dùng màu làm tín hiệu duy nhất.

Ví dụ status:

```text
Màu + text
```

---

# 150. EMPTY STATES

Ví dụ:

Không có technician:

```text
Hiện chưa có kỹ thuật viên khả dụng trong khung giờ này.
```

Không có đơn:

```text
Bạn chưa có đơn hàng nào.
```

Không có review:

```text
Chưa có đánh giá.
```

---

# 151. ERROR STATES

Lỗi phải có thông báo thân thiện.

Ví dụ:

```text
Khung giờ vừa được người khác đặt.
Vui lòng chọn khung giờ khác.
```

Không hiển thị:

```text
SQLite constraint error
```

cho user.

---

# 152. PERFORMANCE

Frontend:

* Lazy-load page nếu cần.
* Lazy-load ảnh.
* Không render hàng nghìn record.
* Pagination/chunk.
* Cache dữ liệu phù hợp.
* Avoid unnecessary rerender.

Backend:

* Index các trường query thường xuyên.
* Pagination.
* Transaction.
* Query có giới hạn.

---

# 153. DATABASE INDEX

Các trường có thể cần index:

```text
users.email
users.name
orders.customer_id
orders.technician_id
orders.status
orders.scheduled_date
orders.created_at
order_messages.order_id
notifications.user_id
reviews.created_at
financial_transactions.technician_id
financial_transactions.order_id
```

---

# 154. TIMEZONE

Toàn bộ nghiệp vụ thời gian phải thống nhất.

Primary timezone:

```text
Asia/Ho_Chi_Minh
```

Backend nên lưu timestamp theo chuẩn nhất quán, frontend convert sang timezone hiển thị.

Không được để browser timezone làm thay đổi slot booking.

---

# 155. DATE HANDLING

Calendar:

```text
Monday → Sunday
```

Các ngày phải lấy từ backend/system date.

Không để client tự tính sai khi qua:

```text
23:59
00:00
week boundary
month boundary
year boundary
```

---

# 156. BOOKING SLOT DISPLAY

Mỗi cell nên có:

```text
Time
Availability
Technician avatar
```

Ví dụ:

```text
09:00 – 10:00
🟢
[Avatar]
Nguyễn Văn A
```

hoặc:

```text
09:00 – 10:00
Unavailable
```

---

# 157. FUTURE EXTENSIBILITY

Hệ thống cần được thiết kế để sau này có thể thêm:

* Package mới.
* Giá mới.
* Technician mới.
* Discount.
* Voucher.
* Additional services.
* Multiple locations.
* Payment gateway.
* Automatic email.
* Zalo integration.
* Real-time chat.
* More roles.

nhưng không cần implement toàn bộ trong phiên bản đầu.

---

# 158. MVP SCOPE

Phiên bản đầu tiên bắt buộc có:

## Public

```text
Homepage
Calendar
Services
Public Orders
About
Terms
Footer
Login
Register
```

## Customer

```text
Profile
Orders
Order detail
Chat
Reschedule
Cancel
Review
Notifications
```

## Technician

```text
Dashboard
Orders
Order detail
Status control
Timer
Payment confirmation
QR
Balance
Profile
```

## Manager

```text
Dashboard
Reports
Financial
Technician statistics
Settlement
```

## Admin

```text
Users
Role management
QR management
Audit
System management
```

---

# 159. NON-FUNCTIONAL REQUIREMENTS

Hệ thống phải:

* Responsive.
* Secure.
* Maintainable.
* Deployable.
* Recoverable.
* Auditable.
* Transaction-safe.
* Scalable ở mức phù hợp cho SaaS nhỏ.
* Không phụ thuộc vào localhost path.
* Không hard-code secret.
* Không hard-code role từ frontend.
* Không trả toàn bộ collection.
* Không lưu plaintext password.

---

# 160. HARD REQUIREMENTS

Các mục dưới đây được xem là yêu cầu bắt buộc:

```text
[HARD] 4 roles
[HARD] Admin không register public
[HARD] Password hashing
[HARD] JWT/signature security
[HARD] .env secret
[HARD] Rate limit
[HARD] SQL injection protection
[HARD] XSS protection
[HARD] Command injection protection
[HARD] Server-side RBAC
[HARD] Order ownership check
[HARD] Booking race-condition protection
[HARD] Pagination max 10 ở collection quan trọng
[HARD] Financial transaction safety
[HARD] Settlement audit
[HARD] SQLite backup/recovery
[HARD] Nginx deployment
[HARD] PM2 deployment
[HARD] Responsive UI
```

---

# 161. BUSINESS RULE SUMMARY

## Service

```text
Basic = 50.000 VNĐ
Premium = 100.000 VNĐ
```

## Duration

```text
1 order = 1 giờ
```

## Working hours

```text
07:00 → 19:00
```

## Calendar

```text
Monday → Sunday
7 columns
```

## Revenue

```text
Technician = 70%
IT Supporter = 30%
```

## Extend / extra

```text
100% Technician
```

## Late

```text
≥ 10 phút → -15%
```

## Extreme late

```text
Free service
```

Ngưỡng extreme late là configurable.

---

# 162. CRITICAL FINANCIAL PRINCIPLE

Hệ thống tài chính phải tuân thủ nguyên tắc:

```text
BALANCE IS A RESULT.
LEDGER IS THE SOURCE OF TRUTH.
```

Không được coi:

```text
balance column
```

là nguồn dữ liệu duy nhất.

Mọi thay đổi tiền phải có:

```text
Transaction
+
Actor
+
Timestamp
+
Reason/Reference
+
Audit
```

---

# 163. CRITICAL SECURITY PRINCIPLE

Frontend không phải lớp bảo mật.

Frontend chỉ:

```text
UI
```

Backend mới quyết định:

```text
Authentication
Authorization
Role
Ownership
Price
Status
Payment
Balance
Settlement
```

---

# 164. CRITICAL ORDER PRINCIPLE

Một order phải có lifecycle rõ ràng:

```text
CREATE
↓
CONFIRM
↓
EXECUTE
↓
PAYMENT
↓
CLOSE
```

Mọi bước phải có:

```text
timestamp
actor
status transition log
```

---

# 165. EXPECTED PROJECT STRUCTURE

Có thể tổ chức repository theo hướng:

```text
itsupporter-service/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── ...
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── utils/
│   │   └── ...
│   └── ...
│
├── database/
│   ├── migrations/
│   ├── seeds/
│   └── backups/
│
├── scripts/
│   └── create-admin
│
├── nginx/
│   └── itsupporter.conf
│
├── uploads/
│
├── .env.example
├── ecosystem.config.*
├── package.json
└── README.md
```

Cấu trúc thực tế có thể thay đổi nhưng phải giữ được separation of concerns.

---

# 166. DEPLOYMENT TARGET

Deployment chuẩn:

```text
Client
   │
   ▼
Nginx :443
   │
   ├── Frontend static files
   │
   └── /api → Node.js backend
                 │
                 ▼
               SQLite
```

Node.js chạy bằng:

```text
PM2
```

---

# 167. PRODUCTION CHECKLIST

Trước khi deploy production:

```text
[ ] .env configured
[ ] JWT secret replaced
[ ] Database initialized
[ ] Admin created by script
[ ] Nginx configured
[ ] SSL enabled
[ ] PM2 configured
[ ] Backup configured
[ ] Rate limit enabled
[ ] CORS configured
[ ] Upload restrictions enabled
[ ] SQL injection checked
[ ] XSS checked
[ ] RBAC tested
[ ] IDOR tested
[ ] Financial transaction tested
[ ] Settlement tested
[ ] Booking race condition tested
[ ] Mobile responsive tested
[ ] Desktop responsive tested
```

---

# 168. ACCEPTANCE CRITERIA — PUBLIC

Homepage phải:

```text
✓ Logo đúng
✓ Orange/white theme
✓ Calendar 7 ngày
✓ Slot 07:00–19:00
✓ Technician availability
✓ Hover profile
✓ Booking flow
✓ Login redirect
✓ Service cards
✓ Review pagination 10
✓ Professional footer
✓ Responsive
```

---

# 169. ACCEPTANCE CRITERIA — CUSTOMER

Customer phải có thể:

```text
✓ Register
✓ Login
✓ Remember session
✓ View profile
✓ Edit profile
✓ Create order
✓ View own orders
✓ Open order detail
✓ Chat
✓ Receive notification
✓ Request reschedule
✓ Cancel order
✓ Review completed order
```

---

# 170. ACCEPTANCE CRITERIA — TECHNICIAN

Technician phải có thể:

```text
✓ Login
✓ View assigned orders
✓ Open order
✓ Chat
✓ Change status
✓ Start timer
✓ See QR
✓ Confirm payment
✓ Give unpaid reason
✓ Close order
✓ See balance
✓ View profile
```

---

# 171. ACCEPTANCE CRITERIA — MANAGER

Manager phải có thể:

```text
✓ View dashboard
✓ Filter period
✓ Filter technician
✓ View financial reports
✓ View technician statistics
✓ View orders
✓ View balance
✓ Perform settlement
✓ Generate settlement records
✓ Export reports
```

---

# 172. ACCEPTANCE CRITERIA — ADMIN

Admin phải có thể:

```text
✓ Manage users
✓ Search users
✓ Paginate users by 10
✓ Change role
✓ Reset password
✓ Delete account
✓ Manage QR
✓ View audit logs
✓ Manage system configuration
```

---

# 173. FINAL SYSTEM PRINCIPLES

IT Supporter Service phải được xây dựng theo các nguyên tắc:

### 1. Public-first

Người dùng chưa login vẫn có thể:

```text
xem dịch vụ
xem lịch
xem technician
xem đơn public
xem review
xem điều khoản
```

### 2. Authentication-aware

Sau login, UI thay đổi theo role.

### 3. Server-authoritative

Frontend không có quyền quyết định:

```text
role
price
status
balance
payment
```

### 4. Financially auditable

Mọi tiền đều phải truy được nguồn.

### 5. No mass loading

Không query toàn bộ collection chỉ để render giao diện.

### 6. Safe by default

Password, JWT, SQL, XSS, command execution, uploads và RBAC đều phải được xử lý ở backend.

### 7. Deployable

Có:

```text
PM2
Nginx
SSL
.env
SQLite init
Admin provisioning
Backup
```

### 8. Responsive

Một giao diện duy nhất phải thích nghi:

```text
Phone
Tablet
iPad
Laptop
Desktop
```

---

# 174. TÓM TẮT KIẾN TRÚC NGHIỆP VỤ

```text
                         IT SUPPORTER SERVICE
                                  │
              ┌───────────────────┴───────────────────┐
              │                                       │
           PUBLIC                                  AUTH
              │                                       │
      ┌───────┼────────┐                  ┌───────────┼───────────┐
      │       │        │                  │           │           │
   Home    Orders    About             Customer   Technician   Staff
      │                                  │           │        │
 Calendar                              Orders     Orders   Manager
 Services                              Chat       Timer       │
 Reviews                               Review     Payment   Reports
      │                                Profile    Balance   Finance
      │                                                │
      └──────────────────┬─────────────────────────────┘
                         │
                      ADMIN
                         │
        ┌────────────────┼────────────────┐
        │                │                │
      Users             QR             Audit
        │                │                │
      Roles         Payment config    Financial logs
        │
        └───────────────┐
                        │
                    SQLite
                        │
                    Financial
                     Ledger
                        │
                 Settlement System
```

---

# 175. KẾT LUẬN KIẾN TRÚC

Hệ thống IT Supporter Service về bản chất là một **service booking + order management + technician operation + financial settlement platform**, không chỉ là một website giới thiệu dịch vụ.

Các thành phần cần được coi là core domain ngay từ đầu:

```text
Authentication
Authorization
Booking
Order
Technician
Chat
Notification
Payment
Financial Ledger
Settlement
Audit
```

Đặc biệt:

```text
Booking
Order lifecycle
Financial ledger
Settlement
RBAC
```

là các domain cần thiết kế chắc ngay từ phiên bản đầu tiên vì chúng ảnh hưởng trực tiếp tới tính đúng đắn của hệ thống.
