# LUONG NGHIEP VU CAC USE CASE

Tài liệu này mô tả 23 UC được giữ lại trong `UC_AUDIT_FOR_DIAGRAM.md`. Cách diễn đạt ưu tiên góc nhìn người dùng; tên lớp chỉ xuất hiện khi cần đối chiếu code.

## UC01 - Đăng nhập và duy trì phiên

### Actor

Nhân viên CMS có tài khoản đang hoạt động: Admin, Vendor hoặc vai trò được cấp quyền.

### Điều kiện bắt đầu

- Người dùng đã mở `/login`, hoặc trình duyệt đang có phiên đã lưu.
- Tài khoản và vai trò đã tồn tại trong hệ thống.

### Luồng chính

1. Người dùng nhập tên đăng nhập và mật khẩu.
2. Giao diện kiểm tra dữ liệu bắt buộc rồi gửi yêu cầu đăng nhập.
3. `AuthController` chuyển yêu cầu cho `AuthService`.
4. Lớp nghiệp vụ đọc người dùng cùng vai trò, kiểm tra tài khoản active và mật khẩu.
5. Hệ thống tạo access token và refresh token mới, lưu refresh token cùng hạn dùng vào `User`.
6. Database xác nhận thay đổi và trả thông tin người dùng, vai trò, token về giao diện.
7. Giao diện lưu phiên và chuyển người dùng đến trang phù hợp. Khi access token hết hạn, giao diện tự gửi refresh token để nhận cặp token mới.

### Luồng thay thế / lỗi

- Thiếu tên đăng nhập hoặc mật khẩu: giao diện không gửi yêu cầu.
- Không tìm thấy user, tài khoản bị khóa hoặc mật khẩu sai: trả lỗi không được xác thực.
- Refresh token không tồn tại, hết hạn hoặc thuộc tài khoản không active: xóa phiên cục bộ và quay lại đăng nhập.
- Vai trò không được phép vào route: `ProtectedRoute` chuyển về route mặc định.

### Kết quả cuối

Phiên CMS hợp lệ được tạo hoặc được làm mới; refresh token mới được ghi vào database.

## UC02 - Đăng ký tài khoản chủ sạp

### Actor

Chủ sạp chưa có tài khoản Vendor.

### Điều kiện bắt đầu

- Người dùng mở `/dang-ky-chu-sap` và chưa đăng nhập.
- Vai trò `Vendor` đã được seed/cấu hình trong database.

### Luồng chính

1. Chủ sạp nhập tên đăng nhập, email, mật khẩu, xác nhận mật khẩu và thông tin hiển thị trên form.
2. Giao diện kiểm tra trường bắt buộc và hai mật khẩu trùng nhau.
3. Giao diện gửi yêu cầu đăng ký đến `AuthController`.
4. `AuthService` chuẩn hóa tên đăng nhập/email, kiểm tra trùng và đọc vai trò Vendor.
5. Mật khẩu được băm; một `User` active với role Vendor và ngôn ngữ ưu tiên được tạo.
6. `UserRepository` ghi người dùng mới qua `UnitOfWork` vào database.
7. Giao diện báo thành công và chuyển về trang đăng nhập.

### Luồng thay thế / lỗi

- Thiếu dữ liệu hoặc xác nhận mật khẩu không khớp: dừng tại giao diện.
- Username hoặc email đã tồn tại: service từ chối.
- Role Vendor chưa có: service từ chối, không tạo user.
- Lỗi ghi database: hiển thị đăng ký thất bại.

### Kết quả cuối

Tài khoản Vendor active được tạo. Code không có bước duyệt vendor riêng.

## UC03 - Xem dashboard và biểu đồ thống kê theo vai trò

### Actor

Admin, Vendor hoặc AnalyticsViewer đã đăng nhập.

### Điều kiện bắt đầu

- Người dùng có phiên hợp lệ và mở `/`.
- Route dashboard không chặn vai trò hiện tại.

### Luồng chính

1. `DashboardPage` xác định vai trò của người dùng.
2. Với Admin hoặc AnalyticsViewer, giao diện gọi dashboard tổng quan. Với Admin, giao diện còn đọc POI để hiển thị bản đồ.
3. Giao diện gọi thêm thống kê 30 ngày qua `/daily` và tổng hợp nguồn truy cập qua `/summary`.
4. `AnalyticsController` kiểm tra quyền analytics trước khi chuyển yêu cầu cho `AnalyticsService`.
5. `AnalyticsService` đọc dữ liệu vận hành và log nghe thuyết minh. Nếu người dùng là Vendor, service tự giới hạn dữ liệu theo POI/sạp thuộc tài khoản Vendor.
6. Với Vendor, giao diện đọc danh sách sạp của Vendor, chọn sạp chính, rồi gọi biểu đồ 30 ngày và tổng hợp nguồn truy cập theo `poiId` của sạp đó.
7. Giao diện Vendor đọc thêm ảnh, thuyết minh và bản dịch của sạp chính để dựng biểu đồ cơ cấu nội dung.
8. Repository/DbContext đọc các bảng POI, tour, QR, media, narration, log hoặc bản dịch cần thiết.
9. Database trả dữ liệu tổng hợp; service tính số đếm/trạng thái và tổng hợp QR/GPS/thủ công.
10. Giao diện hiển thị dashboard phù hợp với vai trò: thẻ số liệu, line chart 30 ngày, donut tỉ lệ nguồn truy cập và biểu đồ cột ngang cơ cấu vận hành/nội dung.

### Luồng thay thế / lỗi

- Không có quyền analytics: giao diện không gọi endpoint analytics.
- Vendor chưa có POI: hiển thị trạng thái trống và nút đăng ký sạp.
- Vendor yêu cầu thống kê của POI không thuộc tài khoản mình: backend trả lỗi không có quyền.
- Không có dữ liệu log trong 30 ngày: biểu đồ hiển thị trạng thái trống hoặc số liệu bằng 0.
- Một truy vấn con thất bại: hiển thị lỗi tương ứng, không bịa số liệu.
- Vai trò legacy không có dashboard riêng: hiển thị trang thông tin vai trò giới hạn.

### Kết quả cuối

Người dùng xem được đúng phần tổng quan và biểu đồ thống kê được phép; UC này không ghi dữ liệu trừ khi người dùng chuyển sang UC thao tác khác.

## UC04 - Quản lý POI và đăng ký sạp

### Actor

Admin/ContentAdmin quản lý POI; Vendor quản lý sạp của chính mình.

### Điều kiện bắt đầu

- Actor đã đăng nhập và có role thuộc nhóm truy cập POI.
- Người dùng mở `/pois` hoặc `/register-poi`.

### Luồng chính

1. Người dùng tìm kiếm/lọc danh sách hoặc mở form tạo/sửa POI.
2. Người dùng nhập tên, mô tả, loại, tọa độ, bán kính và có thể chọn ảnh.
3. Giao diện gửi form dữ liệu đến `PoisController`.
4. `PoiService` kiểm tra quyền; Vendor chỉ được dùng owner của chính mình, còn Admin có thể chọn owner.
5. Khi tạo, hệ thống sinh mã POI duy nhất; khi sửa, hệ thống chỉ cập nhật trường được gửi và xử lý ảnh mới.
6. `PoiRepository`/`ApplicationDbContext` ghi `Poi`; nếu Admin xóa thì `SoftDeleteService` đồng thời ghi `DeletedRecord`; khôi phục sẽ bỏ `DeletedAt`.
7. Giao diện làm mới danh sách và hiển thị trạng thái mới.

### Luồng thay thế / lỗi

- Tọa độ, bán kính hoặc trường bắt buộc không hợp lệ: từ chối trước/ở service.
- Không tìm thấy POI: báo không tồn tại.
- Vendor sửa POI không thuộc mình: trả lỗi không có quyền.
- Vendor thay đổi nội dung nhạy cảm: POI quay về PendingReview, inactive và phải qua lại quy trình duyệt/thanh toán.
- Upload ảnh lỗi hoặc định dạng không hợp lệ: không hoàn tất thao tác.
- Vendor gọi xóa/khôi phục: bị từ chối; các thao tác này dành cho nhóm quản lý nội dung.

### Kết quả cuối

POI/sạp được tạo, cập nhật, soft delete hoặc khôi phục đúng quyền và đúng trạng thái vòng đời.

## UC05 - Duyệt và quyết định vòng đời POI

### Actor

Admin hoặc ContentAdmin.

### Điều kiện bắt đầu

- Actor đã đăng nhập và mở danh sách POI.
- POI tồn tại ở trạng thái phù hợp với hành động dự kiến.

### Luồng chính

1. Admin chọn một POI đang chờ duyệt.
2. Admin chọn duyệt hoặc từ chối.
3. Nếu duyệt, `PoiService` chuyển POI từ `PendingReview` sang `Approved`, vẫn chưa active.
4. Với POI Approved, Admin có thể yêu cầu thanh toán, chuyển sang `PendingPayment`.
5. Ở trạng thái chờ thanh toán, Admin có thể xác nhận đã thanh toán hoặc miễn phí.
6. Repository/DbContext cập nhật approval, lifecycle, payment, thời điểm kích hoạt và thời hạn hiệu lực trong database.
7. Giao diện làm mới hàng POI và trạng thái công khai.

### Luồng thay thế / lỗi

- Actor không thuộc nhóm quản lý nội dung: controller từ chối.
- POI không tồn tại: báo không tìm thấy.
- Chuyển trạng thái sai thứ tự: service trả lỗi, ví dụ chỉ PendingReview mới được duyệt.
- Từ chối chỉ hợp lệ khi PendingReview hoặc Approved.
- Kích hoạt chỉ hợp lệ khi POI đã Approved và đang PendingPayment.

### Kết quả cuối

POI được từ chối, chuyển sang chờ thanh toán, hoặc được kích hoạt với thời hạn hợp lệ.

## UC06 - Thanh toán mô phỏng để kích hoạt sạp

### Actor

Vendor sở hữu POI/sạp.

### Điều kiện bắt đầu

- Vendor đã đăng nhập.
- POI thuộc Vendor, đã được duyệt, đang `PendingPayment` và payment status là `PendingPayment`.

### Luồng chính

1. Vendor chọn thanh toán MoMo mô phỏng từ dashboard hoặc danh sách sạp.
2. Giao diện gọi endpoint bắt đầu thanh toán.
3. `PoiService` kiểm tra role Vendor, owner và trạng thái POI.
4. Hệ thống tạo `PoiPaymentSession` Pending, số tiền cấu hình và hạn 15 phút.
5. Giao diện gửi tiếp yêu cầu mô phỏng thành công với đúng session id.
6. Service kiểm tra session thuộc POI và Vendor, cập nhật session Paid và POI Active/Paid, đặt thời hạn hiệu lực.
7. Database lưu cả session và POI; giao diện làm mới trạng thái sạp.

### Luồng thay thế / lỗi

- POI không thuộc Vendor hoặc không ở trạng thái chờ thanh toán: từ chối.
- Session không thuộc POI/Vendor: từ chối.
- Session đã xử lý hoặc hết hạn: không kích hoạt; session chuyển Expired nếu cần.
- Mô phỏng thất bại: session chuyển Failed, POI không active.

### Kết quả cuối

Nếu thành công, sạp được kích hoạt và có hiệu lực; đây không phải đơn hàng thương mại điện tử.

## UC07 - Quản lý bản dịch POI

### Actor

Admin/ContentAdmin hoặc Vendor sở hữu POI.

### Điều kiện bắt đầu

- Actor đã đăng nhập và chọn một POI.
- Ngôn ngữ nguồn/đích đã tồn tại và đang active.

### Luồng chính

1. Người dùng mở modal/tab bản dịch của POI.
2. Giao diện đọc các bản dịch và trạng thái provider dịch.
3. Người dùng có thể thêm/sửa/xóa thủ công hoặc chọn sinh nhiều ngôn ngữ.
4. `PoiTranslationsController` chuyển yêu cầu đến `PoiTranslationService`.
5. Service kiểm tra POI tồn tại, ownership nếu actor là Vendor, ngôn ngữ active và trùng cặp POI-ngôn ngữ.
6. Repository đọc nội dung nguồn; provider được cấu hình tạo nội dung dịch; repository ghi mới/cập nhật/xóa `PoiTranslation`.
7. Database trả kết quả và giao diện cập nhật danh sách, đồng thời báo các ngôn ngữ bị bỏ qua.

### Luồng thay thế / lỗi

- Vendor chọn POI không thuộc mình: không có quyền.
- Ngôn ngữ không tồn tại/bị tắt hoặc đích trùng nguồn: từ chối.
- POI chưa có nội dung nguồn: không thể sinh bản dịch.
- Bản dịch đã tồn tại và không bật ghi đè: đưa vào danh sách skipped.
- Provider ngoài chưa cấu hình: code có thể dùng provider mô phỏng theo cấu hình, giao diện hiển thị trạng thái thực tế.

### Kết quả cuối

Các bản dịch hợp lệ được lưu và hiển thị; không tạo service dịch không có trong code.

## UC08 - Gửi hình ảnh nội dung POI

### Actor

Vendor.

### Điều kiện bắt đầu

- Vendor đã đăng nhập, có POI thuộc mình và mở `/media` tại tab hình ảnh.

### Luồng chính

1. Vendor chọn POI và một hoặc nhiều file ảnh.
2. Giao diện gửi từng file cùng `poiId` đến `MediaController`.
3. Controller gắn user hiện tại, yêu cầu owner POI và chế độ chỉ cho phép ảnh.
4. `MediaService` kiểm tra POI, ownership, loại nội dung, phần mở rộng và kích thước file.
5. File được lưu vào vùng upload; một `MediaFile` được tạo với trạng thái Pending và người gửi.
6. `MediaRepository` ghi metadata vào database.
7. Giao diện làm mới tab và báo ảnh đã gửi chờ duyệt.

### Luồng thay thế / lỗi

- Chưa chọn POI hoặc file: không gửi.
- POI không tồn tại/không thuộc Vendor: từ chối.
- File không phải ảnh, quá lớn hoặc loại file không hợp lệ: từ chối và không tạo metadata hợp lệ.
- Một file trong nhóm lỗi: giao diện báo lỗi; các file đã hoàn thành trước đó vẫn theo kết quả thực tế.

### Kết quả cuối

Ảnh của Vendor được lưu ở trạng thái chờ Admin duyệt.

## UC09 - Kiểm duyệt và quản lý hình ảnh

### Actor

Admin hoặc ContentAdmin.

### Điều kiện bắt đầu

- Actor đã đăng nhập và mở tab hình ảnh trong `/media`.
- Media cần xử lý tồn tại.

### Luồng chính

1. Admin lọc ảnh theo POI/trạng thái và mở preview qua endpoint CMS bảo vệ.
2. Admin chọn duyệt hoặc từ chối; từ chối phải nhập lý do.
3. `MediaController` kiểm tra role quản lý nội dung.
4. `MediaService` đọc media, kiểm tra loại ảnh và cập nhật approval, reviewer, thời điểm review/lý do.
5. Khi xóa, service đánh dấu `IsDeleted`; khi khôi phục, bỏ cờ này.
6. `MediaRepository` ghi thay đổi vào database.
7. Giao diện cập nhật danh sách và trạng thái ảnh.

### Luồng thay thế / lỗi

- Không có quyền: trả 403.
- Media không tồn tại hoặc không phải loại hợp lệ: báo lỗi.
- Thiếu lý do từ chối: giao diện/service từ chối.
- File vật lý không còn khi preview: endpoint stream báo không tìm thấy.

### Kết quả cuối

Ảnh được Approved/Rejected hoặc được xóa/khôi phục; public service chỉ lấy ảnh Approved, chưa xóa.

## UC10 - Soạn và gửi bản thuyết minh

### Actor

Vendor.

### Điều kiện bắt đầu

- Vendor đã đăng nhập, chọn POI thuộc mình và mở tab bản thuyết minh.

### Luồng chính

1. Vendor nhập tiêu đề, ngôn ngữ, nội dung và giọng mô tả.
2. Giao diện kiểm tra dữ liệu cơ bản và gửi yêu cầu tạo draft.
3. `NarrationsController` lấy user hiện tại và đánh dấu yêu cầu phải đúng owner.
4. `NarrationDraftService` kiểm tra POI, quyền sở hữu, ngôn ngữ và độ dài nội dung.
5. Service kiểm tra cặp POI-ngôn ngữ không vi phạm ràng buộc draft hiện có.
6. `ApplicationDbContext` ghi `NarrationDraft` với người gửi, thời điểm gửi và trạng thái Pending.
7. Giao diện làm mới danh sách và báo đã gửi chờ duyệt.

### Luồng thay thế / lỗi

- Thiếu POI, tiêu đề hoặc nội dung: từ chối.
- POI không tồn tại/không thuộc Vendor: từ chối.
- Ngôn ngữ không hợp lệ: từ chối.
- Vi phạm ràng buộc một draft cho POI-ngôn ngữ: database/service trả lỗi.

### Kết quả cuối

Một narration draft Pending được lưu cho Admin kiểm duyệt.

## UC11 - Kiểm duyệt bản thuyết minh

### Actor

Admin hoặc ContentAdmin.

### Điều kiện bắt đầu

- Actor đã đăng nhập và có draft Pending.

### Luồng chính

1. Admin mở nội dung draft trong tab bản thuyết minh.
2. Admin chọn Duyệt hoặc Từ chối; nếu từ chối nhập lý do.
3. `NarrationsController` kiểm tra role quản lý nội dung.
4. `NarrationDraftService` đọc draft và kiểm tra trạng thái cho phép review.
5. Service cập nhật Approved hoặc Rejected, reviewer, thời điểm và lý do.
6. `ApplicationDbContext` ghi thay đổi vào database.
7. Giao diện cập nhật trạng thái và mở các thao tác dịch/tải audio khi phù hợp.

### Luồng thay thế / lỗi

- Draft không tồn tại: báo không tìm thấy.
- Actor không đủ quyền: từ chối.
- Draft không còn Pending: không review lại theo luồng không hợp lệ.
- Thiếu lý do từ chối: không cập nhật.

### Kết quả cuối

Draft được Approved hoặc Rejected; chỉ draft Approved/AudioGenerated mới được tải MP3.

## UC12 - Dịch thuyết minh và gắn MP3

### Actor

Admin/ContentAdmin thực hiện dịch; chỉ Admin/SuperAdmin được upload MP3 theo controller.

### Điều kiện bắt đầu

- Narration nguồn đã Approved hoặc đã có audio.
- Ngôn ngữ đích active; file tải lên là MP3 hợp lệ.

### Luồng chính

1. Admin chọn draft nguồn và các ngôn ngữ đích.
2. `NarrationDraftService` đọc nội dung nguồn, kiểm tra ngôn ngữ và dùng provider dịch theo cấu hình.
3. Mỗi ngôn ngữ tạo/cập nhật một `NarrationDraft` đã Approved; ngôn ngữ đã có có thể được bỏ qua nếu không ghi đè.
4. Admin tạo MP3 bằng công cụ ngoài và chọn Tải MP3 trên draft đã duyệt.
5. Service kiểm tra phần mở rộng, MIME, kích thước và đọc được thời lượng MP3.
6. `ApplicationDbContext` tạo/cập nhật `AudioTrack` của POI-ngôn ngữ và chuyển draft sang `AudioGenerated`.
7. Giao diện làm mới tab audio và preview file qua `CmsAudioPreviewController`.

### Luồng thay thế / lỗi

- Draft nguồn không tồn tại hoặc chưa Approved: từ chối.
- Ngôn ngữ đích rỗng, trùng nguồn hoặc bị tắt: từ chối/bỏ qua.
- File không phải MP3, rỗng, quá lớn hoặc không đọc được duration: xóa file không hợp lệ và không cập nhật AudioTrack.
- Actor chỉ là ContentAdmin khi upload: endpoint upload yêu cầu AdminOnly nên bị từ chối.
- Endpoint `generate-audio` luôn báo hệ thống không tạo TTS nội bộ; không phải luồng thành công.

### Kết quả cuối

Narration đa ngôn ngữ và AudioTrack MP3 hợp lệ được lưu; audio có thể preview trong CMS và phát qua endpoint public bảo vệ.

## UC13 - Quản lý tour, bản dịch và thứ tự điểm dừng

### Actor

Admin hoặc ContentAdmin.

### Điều kiện bắt đầu

- Actor đã đăng nhập và có quyền quản lý nội dung.

### Luồng chính

1. Người dùng xem danh sách, tạo tour hoặc mở trang sửa tour.
2. Người dùng cập nhật ngôn ngữ mặc định, trạng thái active, thời lượng ước tính và bản dịch tour.
3. Người dùng thêm/bỏ POI và kéo/sắp xếp thứ tự điểm dừng.
4. `ToursController` chuyển từng yêu cầu đến `TourService` và kiểm tra quyền.
5. Service kiểm tra tour, ngôn ngữ, POI và tránh trùng POI/thứ tự không hợp lệ.
6. Các repository ghi `Tour`, `TourTranslation`, `TourPoi`; khi xóa tour, `SoftDeleteService` ghi tombstone `DeletedRecord`.
7. Giao diện cập nhật tour và thứ tự mới.

### Luồng thay thế / lỗi

- Tour/POI/ngôn ngữ không tồn tại: báo không tìm thấy.
- Bản dịch cùng ngôn ngữ hoặc POI đã có trong tour: từ chối.
- Danh sách reorder thiếu/thừa POI hoặc order trùng: service từ chối.
- Actor chỉ có quyền xem (TourOperator): các endpoint ghi yêu cầu nhóm ContentManagement nên bị từ chối.

### Kết quả cuối

Tour và aggregate liên quan được lưu đúng thứ tự; tour bị xóa là soft delete.

## UC14 - Quản lý mã QR gắn POI/Tour

### Actor

Admin hoặc ContentAdmin.

### Điều kiện bắt đầu

- Actor đã đăng nhập và mở trang QR.
- POI/Tour đích (nếu chọn) tồn tại.

### Luồng chính

1. Người dùng xem danh sách hoặc mở form tạo/sửa QR.
2. Người dùng chọn target POI hoặc Tour (hoặc QR cấp dịch vụ không target), trạng thái active, yêu cầu trả phí, giá và thời lượng.
3. Giao diện gửi yêu cầu đến `QrController`.
4. `QrService` kiểm tra chỉ có target hợp lệ, giá không âm và thời lượng lớn hơn 0.
5. Khi tạo, service sinh code QR duy nhất; khi sửa, cập nhật trường được gửi.
6. `QrRepository` ghi `QrLocation`; khi xóa, `SoftDeleteService` ghi `DeletedRecord` rồi đặt `DeletedAt`.
7. Giao diện cập nhật danh sách, render mã QR và cho tải ảnh QR.

### Luồng thay thế / lỗi

- Chọn cả POI và Tour hoặc target không tồn tại: từ chối.
- Giá/thời lượng không hợp lệ: từ chối.
- QR không tồn tại: báo không tìm thấy.
- QR đã xóa/inactive sẽ không được public access dùng.

### Kết quả cuối

QR được tạo/cập nhật/xóa mềm với cấu hình target và access chính xác.

## UC15 - Quản lý ngôn ngữ

### Actor

Admin hoặc SuperAdmin.

### Điều kiện bắt đầu

- Actor đã đăng nhập và mở `/languages`.

### Luồng chính

1. Giao diện đọc toàn bộ ngôn ngữ, kể cả ngôn ngữ bị tắt.
2. Admin mở modal tạo/sửa hoặc chọn xóa.
3. `LanguagesController` kiểm tra quyền AdminOnly.
4. `LanguageService` chuẩn hóa code và chỉ cho phép các code trong danh sách hỗ trợ.
5. Service kiểm tra trùng code rồi tạo/cập nhật/xóa entity.
6. `LanguageRepository` ghi thay đổi qua `UnitOfWork` vào database.
7. Giao diện tải lại danh sách và thứ tự hiển thị.

### Luồng thay thế / lỗi

- Không có quyền AdminOnly: từ chối.
- Code không được hỗ trợ hoặc đã tồn tại: từ chối tạo.
- Ngôn ngữ không tồn tại: báo lỗi.
- Xóa ngôn ngữ đang được bảng khác tham chiếu có thể bị database từ chối; UI hiển thị lỗi thực tế.

### Kết quả cuối

Danh mục ngôn ngữ được cập nhật; các service dịch chỉ chấp nhận ngôn ngữ active.

## UC16 - Quản lý người dùng

### Actor

Admin hoặc SuperAdmin.

### Điều kiện bắt đầu

- Actor đã đăng nhập và mở `/users`.

### Luồng chính

1. Admin xem danh sách phân trang hoặc mở chi tiết user.
2. Admin tạo user mới hoặc sửa email, role, ngôn ngữ, active và có thể đổi mật khẩu.
3. `UsersController` kiểm tra AdminOnly và chuyển yêu cầu đến `UserService`.
4. Service kiểm tra trùng username/email và đọc role được chọn.
5. Mật khẩu mới được băm; entity `User` được tạo/cập nhật hoặc xóa.
6. `UserRepository`/`RoleRepository` đọc ghi qua `UnitOfWork` vào database.
7. Giao diện cập nhật danh sách.

### Luồng thay thế / lỗi

- Không có quyền AdminOnly: từ chối.
- Username/email trùng hoặc role không tồn tại: từ chối.
- User không tồn tại: báo không tìm thấy.
- Xóa user đang được dữ liệu khác tham chiếu có thể bị database từ chối; không tự giả định cascade.

### Kết quả cuối

Tài khoản người dùng được tạo/cập nhật/xóa đúng role và trạng thái.

## UC17 - Quản lý vai trò

### Actor

Admin hoặc SuperAdmin.

### Điều kiện bắt đầu

- Actor đã đăng nhập và mở `/roles`.

### Luồng chính

1. Giao diện đọc danh sách role.
2. Admin tạo role, sửa tên/mô tả hoặc chọn xóa.
3. `RolesController` kiểm tra AdminOnly.
4. `RoleService` kiểm tra trùng tên và role tồn tại.
5. `RoleRepository` tạo/cập nhật/xóa entity.
6. `UnitOfWork` ghi thay đổi vào database.
7. Giao diện cập nhật danh sách role.

### Luồng thay thế / lỗi

- Không có quyền: từ chối.
- Tên role đã tồn tại: từ chối.
- Role không tồn tại: báo không tìm thấy.
- Role đang được user tham chiếu: database có thể từ chối xóa.
- Frontend chỉ hiển thị/gán một số role hệ thống theo `roleAccess.ts`; không suy diễn workflow phê duyệt role.

### Kết quả cuối

Danh mục role được cập nhật và có thể dùng trong UC quản lý người dùng.

## UC18 - Khám phá và tìm kiếm POI công khai

### Actor

Khách tham quan không cần đăng nhập.

### Điều kiện bắt đầu

- Khách mở trang chủ, danh sách, tìm kiếm hoặc chi tiết POI.

### Luồng chính

1. Khách chọn ngôn ngữ, danh mục, trang hoặc nhập từ khóa tối thiểu hai ký tự.
2. Giao diện gọi public POI API với bộ lọc tương ứng.
3. `PublicPoisController` chuyển yêu cầu đến `PublicPoiService`.
4. Service đọc POI và chỉ giữ POI public: đúng lifecycle, active, chưa xóa và còn hiệu lực.
5. Repository đọc bản dịch phù hợp và ảnh Approved gần nhất cho từng POI.
6. Database trả dữ liệu; service chọn ngôn ngữ yêu cầu hoặc fallback tiếng Việt.
7. Giao diện hiển thị danh sách/chi tiết và liên kết sang bản đồ hoặc gói nghe.

### Luồng thay thế / lỗi

- Không có kết quả: hiển thị trạng thái trống.
- POI không tồn tại, chưa active, hết hạn hoặc bị xóa: trả không tìm thấy.
- Ngôn ngữ yêu cầu không có: fallback nội dung gốc/tiếng Việt.
- Ảnh chưa Approved/đã xóa: không trả ảnh đó.

### Kết quả cuối

Khách xem được đúng POI công khai và nội dung theo ngôn ngữ khả dụng.

## UC19 - Xem tour và thứ tự lộ trình

### Actor

Khách tham quan.

### Điều kiện bắt đầu

- Khách mở `/tours`, chi tiết tour hoặc trang route.

### Luồng chính

1. Giao diện yêu cầu danh sách hoặc chi tiết tour theo ngôn ngữ.
2. `PublicToursController` gọi `TourService`.
3. Service chỉ đọc tour active/chưa xóa và các bản dịch, điểm dừng liên quan.
4. `TourRepository`, `TourTranslationRepository`, `TourPoiRepository` và `PoiRepository` đọc dữ liệu.
5. Service bỏ POI không còn public, chọn nội dung dịch và ảnh approved qua `PublicPoiService`.
6. Database trả dữ liệu; service sắp xếp điểm dừng theo `OrderIndex`.
7. Giao diện hiển thị danh sách, chi tiết và tuyến thứ tự; nếu có pass thì phần audio được xử lý bởi UC23.

### Luồng thay thế / lỗi

- Tour không tồn tại/inactive/đã xóa: báo không tìm thấy.
- Một POI trong tour không còn public: không đưa nội dung không hợp lệ ra public.
- Không có bản dịch yêu cầu: fallback ngôn ngữ mặc định/bản đầu tiên.
- Không có pass: vẫn xem được route công khai nhưng không phát audio bảo vệ.

### Kết quả cuối

Khách xem được tour public và thứ tự điểm dừng hợp lệ.

## UC20 - Xem bản đồ và chỉ đường

### Actor

Khách tham quan.

### Điều kiện bắt đầu

- Khách mở `/ban-do`; trình duyệt có thể cấp hoặc từ chối quyền vị trí.

### Luồng chính

1. Giao diện tải danh sách POI public; nếu URL có `tour`, tải thêm chi tiết tour.
2. Public controller/service/repository đọc POI/tour hợp lệ từ database.
3. Giao diện đặt marker, chọn POI và có thể theo dõi vị trí hiện tại bằng geolocation của trình duyệt.
4. Khách chọn bắt đầu chỉ đường đến POI hoặc theo các điểm của tour.
5. `MapPage` gọi OpenRouteService trực tiếp bằng cấu hình frontend; bước này không đi qua backend dự án.
6. Giao diện nhận hình học, quãng đường và thời gian từ dịch vụ ngoài rồi vẽ polyline.
7. Nếu khách chọn nghe tại POI và có pass, giao diện chuyển sang luồng UC23.

### Luồng thay thế / lỗi

- Không cấp quyền vị trí/không hỗ trợ geolocation: vẫn xem marker nhưng không tính tuyến từ vị trí hiện tại.
- Thiếu API key, mất mạng, quá giới hạn hoặc không tìm được tuyến: hiển thị lỗi route, không bịa đường thẳng thành tuyến đường.
- POI/tour không có tọa độ hợp lệ: không đưa vào tuyến.
- Backend POI/tour lỗi: bản đồ hiển thị trạng thái lỗi/trống.

### Kết quả cuối

Khách xem marker nội bộ và, khi dịch vụ ngoài khả dụng, xem được tuyến đường. UC mang trạng thái Có một phần vì đoạn chỉ đường nằm ngoài kiến trúc backend 3 lớp.

## UC21 - Quét QR và mở quyền truy cập

### Actor

Khách tham quan.

### Điều kiện bắt đầu

- Khách mở `/qr/:code` với một QR code.

### Luồng chính

1. Giao diện tìm pass đã lưu; nếu có thì gọi validate.
2. Nếu chưa có pass hợp lệ, giao diện gửi code đến `PublicAccessController.Start`.
3. `PublicAccessService` đọc QR active, kiểm tra cấu hình giá/thời lượng và POI target còn public.
4. Service tạo `GuestAccessPass`; QR miễn phí nhận token ngay, QR trả phí tạo thêm `AccessPaymentSession` Pending.
5. Với QR trả phí, khách bấm thanh toán mô phỏng; service kiểm tra session, chuyển Paid/Active và sinh token.
6. Repository ghi pass/session vào database; giao diện lưu token và hạn dùng trong local storage.
7. Khi có pass, giao diện resolve QR qua `QrService` và hiển thị/liên kết đến POI, tour hoặc quyền toàn khu.

### Luồng thay thế / lỗi

- Code rỗng, không tồn tại, inactive hoặc target POI không public: báo QR không khả dụng.
- Payment session hết hạn: session/pass chuyển trạng thái hết hạn, không cấp token.
- Mô phỏng thất bại: session/pass chuyển Failed.
- Pass/token đã hết hạn hoặc không hợp lệ: xóa bản lưu cục bộ và yêu cầu mở quyền lại.

### Kết quả cuối

Khách nhận guest access token có thời hạn hoặc được thông báo cần/thất bại thanh toán; không tạo cart/order.

## UC22 - Chọn và mua gói thuyết minh mô phỏng

### Actor

Khách tham quan.

### Điều kiện bắt đầu

- Khách mở `/goi-thuyet-minh`.
- Có QR service-level active được cấu hình làm package.

### Luồng chính

1. `PackagesPage` yêu cầu danh sách package công khai.
2. `PublicPackagesController` dùng `QrService` đọc các QR active không gắn riêng POI/Tour và tạo thông tin gói.
3. Giao diện đồng thời validate các pass còn lưu để khôi phục trạng thái.
4. Khách chọn mua một gói; giao diện gọi start access với code của gói.
5. Nếu gói trả phí, giao diện gọi payment mô phỏng; nếu miễn phí, nhận token ngay.
6. `PublicAccessService` ghi `GuestAccessPass` và `AccessPaymentSession` tương ứng vào database.
7. Giao diện lưu token/hạn dùng, hiển thị đếm ngược và liên kết bắt đầu nghe.

### Luồng thay thế / lỗi

- Không có package active: hiển thị không có gói.
- Pass cũ không hợp lệ/hết hạn: xóa khỏi local storage.
- Mất mạng khi validate: code hiện giữ pass cục bộ thay vì tự xóa.
- Start/payment lỗi, session thiếu hoặc không trả token: báo không thể phát/mua.

### Kết quả cuối

Khách có pass toàn khu hoặc pass theo cấu hình QR, được lưu cục bộ đến khi hết hạn.

## UC23 - Nghe thuyết minh và audio được bảo vệ

### Actor

Khách tham quan có guest access pass.

### Điều kiện bắt đầu

- Khách mở chi tiết POI, route tour hoặc POI trên bản đồ.
- Giao diện tìm thấy access token chưa hết hạn cục bộ.

### Luồng chính

1. Giao diện gửi token và POI/tour id đến `PublicAudioTourController`.
2. `PublicAudioTourService` yêu cầu `PublicAccessService` kiểm tra pass Active, thời hạn và scope toàn khu/POI/tour.
3. Repository đọc pass, POI/tour, quan hệ TourPoi, narration đã duyệt và AudioTrack active theo ngôn ngữ.
4. Database trả metadata; giao diện hiển thị narration text và danh sách audio khả dụng.
5. Với mỗi track, `ProtectedAudioPlayer` gửi token đến `PublicAudioController` để lấy file.
6. `PublicAccessService` kiểm tra lại token, scope theo POI của track và tình trạng public; controller kiểm tra đường dẫn/file MP3 hợp lệ.
7. File được stream có range processing; giao diện tạo object URL và phát bằng audio player.

### Luồng thay thế / lỗi

- Thiếu/sai token hoặc pass hết hạn: 401, giao diện xóa pass và hiển thị hết hạn.
- Pass không cho phép POI/tour/track: 403 và yêu cầu chọn gói phù hợp.
- POI không còn public, track inactive hoặc không tồn tại: 404.
- File rỗng, sai định dạng/path ngoài `uploads/audio`: từ chối và không stream.
- Không có audio đúng ngôn ngữ: hiển thị audio chưa sẵn sàng.

### Kết quả cuối

Khách nghe được MP3 được bảo vệ trong đúng phạm vi và thời hạn của pass; lỗi quyền/hết hạn được phản hồi rõ ràng.
