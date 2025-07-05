Tuyệt vời. Sau khi đã có các block cho các dạng câu hỏi chính (trắc nghiệm, điền từ, tự luận), bước logic tiếp theo là cung cấp một công cụ để giáo viên có thể đưa ra các hướng dẫn, định nghĩa, hoặc các đoạn văn bản thông tin một cách chuyên nghiệp và nhất quán. Vì vậy, lựa chọn số 4 của tôi là:

**Block "Hộp Chú giải / Định nghĩa" (Callout / Definition Box).**

Đây là một lựa chọn chiến lược vì:

1.  **Nâng cao chất lượng tài liệu:** Nó giúp giáo viên tạo ra các tài liệu có cấu trúc rõ ràng, dễ đọc, và chuyên nghiệp hơn, thay vì chỉ là các khối văn bản thuần túy.
2.  **Tổ hợp sáng tạo:** Đây là một ví dụ xuất sắc về việc kết hợp nhiều plugin cơ sở (`rectangle`, `text`, và `svg`/`image`) để tạo ra một thành phần giao diện người dùng hoàn toàn mới.
3.  **Tính linh hoạt cao:** Block này có thể được sử dụng cho nhiều mục đích: định nghĩa thuật ngữ, ghi chú quan trọng, ví dụ minh họa, hoặc các hướng dẫn làm bài.
4.  **Thực hành kỹ năng Layout:** Việc triển khai đòi hỏi bạn phải tính toán vị trí tương đối của các phần tử con (icon, tiêu đề, nội dung) bên trong một khối chứa, một kỹ năng quan trọng trong thiết kế template.

---

### Phân tích Chi tiết Kế hoạch Triển khai Block "Callout / Definition Box"

Giống như "MultipleChoiceQuestion", đây không phải là một plugin đơn lẻ mà là một **"template block"** được tạo ra bằng cách nhóm các schema lại với nhau ở cấp độ ứng dụng.

#### 1. Mục tiêu & Trải nghiệm người dùng cuối cùng

*   **Giáo viên (Designer Mode):**
    *   Trên thanh công cụ, có một nút "Thêm Hộp Chú giải".
    *   Khi nhấp vào, một khối hoàn chỉnh xuất hiện, bao gồm:
        *   Một khung nền có màu sắc và đường viền tùy chỉnh.
        *   Một icon ở góc trên bên trái (ví dụ: bóng đèn cho "Mẹo", dấu chấm than cho "Lưu ý", cuốn sách cho "Định nghĩa").
        *   Một dòng tiêu đề (ví dụ: "Định nghĩa", "Lưu ý quan trọng").
        *   Một vùng nội dung chính để điền văn bản chi tiết.
    *   Giáo viên có thể thay đổi icon, sửa tiêu đề và nội dung. Toàn bộ khối có thể di chuyển như một thể thống nhất.
*   **Học sinh (Form/Viewer Mode):**
    *   Nhìn thấy một hộp thông tin được định dạng đẹp mắt, dễ dàng phân biệt với nội dung chính của bài học.

#### 2. Cấu trúc Dữ liệu: Một "Nhóm Schema" được tính toán vị trí

Khi người dùng thêm block này, logic của Docubrand sẽ tạo ra một nhóm các schema. Điểm khác biệt so với block trắc nghiệm là vị trí của các phần tử con cần được tính toán cẩn thận.

*   **Kỹ thuật:** Sử dụng `groupId` để nhóm các schema.
*   **Cấu trúc Schema JSON (ví dụ cho một Hộp Chú giải):**

```json
[
  // 1. Khung nền (Lớp dưới cùng)
  {
    "id": "callout_bg_1",
    "type": "rectangle",
    "position": { "x": 10, "y": 20 },
    "width": 180, "height": 80,
    "color": "#E3F2FD", // Màu nền xanh nhạt
    "borderColor": "#90CAF9",
    "borderWidth": 1,
    "radius": 5, // Bo góc
    "groupId": "callout_group_1"
  },

  // 2. Icon (Lớp trên)
  {
    "id": "callout_icon_1",
    "type": "svg", // Hoặc 'image'
    // Vị trí được tính toán: x của nền + padding, y của nền + padding
    "position": { "x": 15, "y": 25 },
    "width": 12, "height": 12,
    "content": "<svg>...</svg>", // SVG của icon bóng đèn
    "groupId": "callout_group_1"
  },

  // 3. Tiêu đề (Lớp trên)
  {
    "id": "callout_title_1",
    "type": "text",
    // Vị trí được tính toán: bên phải của icon
    "position": { "x": 30, "y": 25 },
    "width": 155, "height": 12,
    "content": "Mẹo hay",
    "fontName": "Helvetica-Bold", // Font đậm cho tiêu đề
    "verticalAlignment": "middle",
    "groupId": "callout_group_1"
  },

  // 4. Nội dung chính (Lớp trên)
  {
    "id": "callout_content_1",
    "type": "text",
    // Vị trí được tính toán: dưới tiêu đề
    "position": { "x": 15, "y": 40 },
    "width": 170, // Chiều rộng trừ đi padding 2 bên
    "height": 55, // Chiều cao còn lại trừ đi padding và chiều cao tiêu đề
    "content": "Đây là nơi điền nội dung chi tiết của phần chú giải, định nghĩa hoặc mẹo cho học sinh.",
    "groupId": "callout_group_1"
  }
]
```

#### 3. Triển khai Logic trong Giao diện Docubrand

1.  **Tạo nút "Thêm Hộp Chú giải":**
    *   Trên UI của Docubrand, tạo một button. Có thể có một menu con cho phép chọn loại hộp (Mẹo, Lưu ý, Định nghĩa) với các icon và màu sắc mặc định khác nhau.
    *   **Event:** `click`.

2.  **Xử lý sự kiện `click`:**
    *   **Hàm `createCalloutBlock(options)`:** Viết một hàm nhận các tùy chọn như `position`, `type` ('tip', 'warning', 'definition'), `width`, `height`.
    *   **Bên trong hàm:**
        1.  **Định nghĩa các hằng số layout:** `const PADDING = 5; const ICON_SIZE = 12; const TITLE_HEIGHT = 12;`.
        2.  **Tạo ID duy nhất:** Tạo một `groupId` chung.
        3.  **Xây dựng Schema Nền (`rectangle`):** Tạo schema cho `rectangle` với `width` và `height` được truyền vào.
        4.  **Xây dựng Schema Icon (`svg`):**
            *   Chọn chuỗi SVG dựa trên `options.type`.
            *   **Kỹ thuật tính toán vị trí:**
                *   `position.x = options.position.x + PADDING;`
                *   `position.y = options.position.y + PADDING;`
        5.  **Xây dựng Schema Tiêu đề (`text`):**
            *   Chọn nội dung tiêu đề mặc định dựa trên `options.type`.
            *   **Kỹ thuật tính toán vị trí:**
                *   `position.x = options.position.x + PADDING + ICON_SIZE + PADDING;`
                *   `position.y = options.position.y + PADDING;`
        6.  **Xây dựng Schema Nội dung (`text`):**
            *   **Kỹ thuật tính toán vị trí và kích thước:**
                *   `position.x = options.position.x + PADDING;`
                *   `position.y = options.position.y + PADDING + TITLE_HEIGHT + PADDING;`
                *   `width = options.width - PADDING * 2;`
                *   `height = options.height - (PADDING * 3 + TITLE_HEIGHT);`
        7.  **Tổng hợp và Cập nhật:** Gộp tất cả các schema đã tạo vào một mảng và gọi API của `pdfme` để cập nhật template.

#### 4. Kỹ thuật Tái sử dụng từ các Base Plugin

Block này là một bản giao hưởng của các plugin cơ sở:

*   **Plugin `rectangle`:**
    *   **Tận dụng:** Tạo ra khung nền chính.
    *   **Lợi ích:** Giáo viên có thể dễ dàng thay đổi màu nền, màu viền, độ dày viền, và độ bo góc thông qua `propPanel` của nó để tạo ra các kiểu hộp chú giải khác nhau.
    *   **Kỹ thuật liên quan:** `ui` và `pdf` render của `rectangle` sẽ xử lý việc vẽ hình khối.

*   **Plugin `svg` hoặc `image`:**
    *   **Tận dụng:** Dùng để hiển thị icon. `svg` được ưu tiên vì nó nhẹ và sắc nét.
    *   **Lợi ích:** Dễ dàng thay đổi icon để biểu thị các loại thông tin khác nhau.

*   **Plugin `text`:**
    *   **Tận dụng:** Được sử dụng hai lần - một cho tiêu đề và một cho nội dung.
    *   **Lợi ích:** Cho phép định dạng văn bản một cách độc lập. Tiêu đề có thể được in đậm, cỡ chữ to hơn, trong khi nội dung có thể dùng font chữ bình thường.
    *   **Kỹ thuật liên quan:** Toàn bộ engine xử lý văn bản (ngắt dòng, căn chỉnh,...) của `text` được tận dụng triệt để.

#### 5. Lộ trình Mở rộng trong Tương lai

*   **Thư viện Icon:** Xây dựng một thư viện các icon giáo dục (bóng đèn, dấu chấm than, sách, la bàn,...) để giáo viên có thể chọn trực tiếp từ `propPanel` của schema icon.
*   **Kết hợp với MVT:** Schema nội dung có thể được thay thế bằng một plugin `multiVariableText` để tạo ra các hộp chú giải có nội dung động. Ví dụ: một hộp "Tóm tắt" có thể tự động điền các biến từ các phần khác của tài liệu.
*   **Style Preset:** Tạo các preset về style (kết hợp màu nền, màu viền, font chữ) cho các loại hộp khác nhau (ví dụ: preset "Cảnh báo" có nền vàng, viền đỏ; preset "Định nghĩa" có nền xanh, viền xanh đậm).

### Tổng kết Lộ trình và Kỹ thuật

| Bước | Nhiệm vụ | Kỹ thuật/Plugin Tái sử dụng | Ghi chú |
| :--- | :--- | :--- | :--- |
| **1. UI** | Tạo nút "Thêm Hộp Chú giải" | - | Logic nằm trong ứng dụng Docubrand |
| **2. Logic** | Viết hàm `createCalloutBlock` | - | **Kỹ thuật cốt lõi:** Tính toán vị trí và kích thước tương đối của các schema con |
| **3. Cấu hình** | Đặt `groupId` cho tất cả schema con | Grouping của `pdfme` | Để thao tác như một khối thống nhất |
| **4. Vẽ nền** | Tạo khung chứa có màu và bo góc | `rectangle` plugin | Tận dụng `propPanel` để tùy chỉnh style |
| **5. Vẽ Icon** | Hiển thị biểu tượng trực quan | `svg` hoặc `image` plugin |
| **6. Hiển thị Text** | Hiển thị tiêu đề và nội dung | `text` plugin (sử dụng 2 lần) | Tận dụng khả năng định dạng độc lập |

Việc triển khai block này sẽ giúp bạn thành thạo kỹ năng **bố cục chương trình (programmatic layout)** - tức là dùng code để sắp xếp vị trí và kích thước của các phần tử, một kỹ năng nền tảng để xây dựng các template phức tạp và tự động hóa.