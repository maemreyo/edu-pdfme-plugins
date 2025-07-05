======================================================================
==   PHÂN TÍCH CHI TIẾT PLUGIN GRAPHICS (IMAGE, SVG) TRONG PDFME     ==
======================================================================

Tài liệu này phân tích sâu hai plugin đồ họa cốt lõi: `image` và `svg`. Chúng cung cấp các phương tiện để chèn đồ họa raster và vector vào tài liệu.

MỤC LỤC
---------
1.  **Plugin `image`**
    1.1. Mục đích và Usecase
    1.2. Phân tích Luồng Render trên UI (`ui` function)
    1.3. Phân tích Luồng Render trên PDF (`pdf` function)
    1.4. Phân tích Helper (`imagehelper.ts`)
2.  **Plugin `svg`**
    2.1. Mục đích và Usecase
    2.2. Phân tích Luồng Render trên UI (`ui` function)
    2.3. Phân tích Luồng Render trên PDF (`pdf` function)
3.  Tổng kết các Kỹ thuật và Event chính

----------------------------------------------------------------------
1. PLUGIN `IMAGE`
----------------------------------------------------------------------

### 1.1. Mục đích và Usecase

Plugin `image` cho phép người dùng chèn các hình ảnh raster (pixel-based) như JPG và PNG vào tài liệu.

-   **Usecase chính:** Chèn logo, ảnh đại diện, ảnh sản phẩm, chữ ký dạng ảnh, hoặc bất kỳ hình ảnh nào khác.
-   **Đặc điểm:** Tập trung vào việc xử lý dữ liệu ảnh, quản lý tỷ lệ khung hình, và cung cấp giao diện tải file thân thiện.

### 1.2. Phân tích Luồng Render trên UI (`ui` function)

Giao diện người dùng của plugin `image` rất linh hoạt và thay đổi tùy theo trạng thái.

-   **Trạng thái không có ảnh (`!value`):**
    -   Hiển thị một `label` và một `<input type="file">`.
    -   `label` được style để chiếm toàn bộ không gian của schema và có một lớp nền mờ, tạo cảm giác là một "vùng thả file".
    -   **Event `change` trên input:** Khi người dùng chọn một file, sự kiện `change` được kích hoạt.
        -   **Hành động:** Nó gọi hàm `readFile` (từ `utils.ts`) để đọc file đã chọn và chuyển nó thành một chuỗi data URI (base64).
        -   Sau đó, nó gọi `onChange({ key: 'content', value: ... })` với chuỗi data URI này để cập nhật schema.

-   **Trạng thái có ảnh (`value` tồn tại):**
    -   Tạo một thẻ `<img>` và đặt `src` của nó bằng `value` (chuỗi data URI).
    -   **Kỹ thuật CSS:** Sử dụng `object-fit: 'contain'` để đảm bảo ảnh luôn hiển thị đầy đủ bên trong khung chứa mà không bị méo, giữ đúng tỷ lệ khung hình.
    -   **Nút Xóa (Remove Button):**
        -   Nếu ở chế độ editable và ảnh không phải là ảnh mặc định, một nút "x" sẽ được tạo và đặt ở góc trên bên trái.
        -   **Event `click` trên nút xóa:**
            -   **Hành động:** Gọi `onChange({ key: 'content', value: '' })` để xóa dữ liệu ảnh khỏi schema, đưa plugin trở lại trạng thái không có ảnh.

### 1.3. Phân tích Luồng Render trên PDF (`pdf` function)

Đây là nơi xử lý việc nhúng và vẽ ảnh lên file PDF.

1.  **Nhúng ảnh và Caching:**
    -   Sử dụng `pdfDoc.embedPng` hoặc `pdfDoc.embedJpg` dựa trên tiền tố của chuỗi data URI.
    -   **Kỹ thuật Caching:** Kết quả nhúng (`PDFImage` object) được lưu vào `_cache` với một key duy nhất được tạo từ `schema.type` và `value`. Điều này cực kỳ quan trọng, đảm bảo rằng nếu cùng một ảnh được sử dụng ở nhiều nơi, nó chỉ được nhúng vào file PDF một lần duy nhất, giúp giảm kích thước file cuối cùng.

2.  **Kỹ thuật Xử lý Tỷ lệ khung hình (Aspect Ratio):**
    -   Đây là một logic rất quan trọng để đảm bảo ảnh không bị méo trên PDF.
    -   **Bước 1: Lấy kích thước thật của ảnh:** Gọi `getImageDimension(value)` (từ `imagehelper.ts`) để đọc chiều rộng và cao gốc của ảnh (tính bằng pixel).
    -   **Bước 2: Tính toán tỷ lệ:** Tính `imageRatio` (tỷ lệ của ảnh thật) và `boxRatio` (tỷ lệ của khung chứa schema).
    -   **Bước 3: So sánh và điều chỉnh:**
        -   Nếu `imageRatio > boxRatio` (ảnh rộng hơn khung), chiều rộng của ảnh sẽ được đặt bằng chiều rộng khung, và chiều cao được tính lại theo tỷ lệ. Vị trí Y được điều chỉnh để căn giữa ảnh theo chiều dọc.
        -   Nếu `imageRatio <= boxRatio` (ảnh cao hơn hoặc bằng khung), chiều cao của ảnh sẽ được đặt bằng chiều cao khung, và chiều rộng được tính lại. Vị trí X được điều chỉnh để căn giữa ảnh theo chiều ngang.
    -   **=> Kết quả:** Một schema `_schema` tạm thời được tạo ra với `width`, `height`, và `position` đã được điều chỉnh.

3.  **Vẽ ảnh:**
    -   Gọi `convertForPdfLayoutProps` với `_schema` đã được điều chỉnh để lấy các thuộc tính layout cuối cùng.
    -   Gọi `page.drawImage` với các thuộc tính này để vẽ ảnh lên trang.

### 1.4. Phân tích Helper (`imagehelper.ts`)

-   **Mục đích:** Cung cấp hàm `getImageDimension` để đọc kích thước (width, height) của một ảnh từ dữ liệu buffer của nó mà không cần render ra DOM.
-   **Kỹ thuật:**
    -   Đây là một phiên bản rút gọn của thư viện `image-size`, đã được chỉnh sửa để loại bỏ các phụ thuộc vào Node.js và chỉ giữ lại logic cho PNG và JPG.
    -   Nó hoạt động bằng cách đọc các byte đầu tiên của file ảnh (được gọi là "magic numbers") để xác định loại file (`detector`).
    -   Sau đó, nó gọi hàm `calculate` tương ứng cho từng loại file. Các hàm này biết cách phân tích cấu trúc file (ví dụ: tìm chunk IHDR trong PNG, hoặc marker SOF trong JPG) để trích xuất thông tin về chiều rộng và chiều cao được lưu trong metadata của file.

----------------------------------------------------------------------
2. PLUGIN `SVG`
----------------------------------------------------------------------

### 2.1. Mục đích và Usecase

Plugin `svg` cho phép người dùng chèn và hiển thị đồ họa vector có thể co giãn (Scalable Vector Graphics).

-   **Usecase chính:** Chèn logo, icon, biểu đồ, hoặc bất kỳ đồ họa phức tạp nào cần giữ được độ sắc nét ở mọi kích thước. Đây cũng là plugin nền tảng cho các plugin khác như `checkbox`, `radioGroup`.
-   **Đặc điểm:** Cung cấp một trình soạn thảo mã SVG đơn giản và có khả năng render SVG trực tiếp lên PDF.

### 2.2. Phân tích Luồng Render trên UI (`ui` function)

-   **Chế độ Editable (`isEditable` là true):**
    -   Tạo một `<textarea>` cho phép người dùng dán hoặc chỉnh sửa mã nguồn SVG.
    -   **Live Preview:** Đồng thời, nó cố gắng render SVG hiện tại để người dùng xem trước. Nó gọi `isValidSVG` để kiểm tra.
        -   Nếu hợp lệ, nó dùng `DOMParser` để tạo một phần tử SVG từ chuỗi, đặt `width` và `height` là `100%`, và chèn vào `rootElement`.
        -   Nếu không hợp lệ, nó hiển thị một `div` báo lỗi (`createErrorElm`).
    -   **Event `change` trên textarea:** Khi người dùng thay đổi nội dung, nó gọi `onChange` để cập nhật `schema.content`.

-   **Chế độ Viewer (`isEditable` là false):**
    -   Đơn giản là kiểm tra `isValidSVG`.
    -   Nếu hợp lệ, nó gán chuỗi SVG vào `innerHTML` của một `div`, sau đó lấy phần tử SVG con và đặt `width`, `height` là `100%`.
    -   Nếu không hợp lệ, hiển thị lỗi.

### 2.3. Phân tích Luồng Render trên PDF (`pdf` function)

-   **Validation:** Bước đầu tiên luôn là gọi `isValidSVG` để đảm bảo không cố gắng vẽ một chuỗi không hợp lệ, có thể gây lỗi cho `pdf-lib`.
-   **Vẽ SVG:**
    -   Sử dụng hàm `page.drawSvg` của `pdf-lib`.
    -   **Hệ tọa độ:** `pdf-lib` vẽ SVG từ góc **trên-bên trái** của vùng vẽ, trong khi hệ tọa độ của trang PDF có gốc ở **dưới-bên trái**. Do đó, tọa độ Y cần được điều chỉnh: `y: y + height`. `convertForPdfLayoutProps` đã tính toán `y` là tọa độ góc dưới-bên trái, nên `y + height` sẽ là tọa độ góc trên-bên trái, khớp với yêu cầu của `drawSvg`.

----------------------------------------------------------------------
3. TỔNG KẾT CÁC KỸ THUẬT VÀ EVENT CHÍNH
----------------------------------------------------------------------

-   **Events chính trên UI:**
    -   **Image:** `change` trên input file để tải ảnh, `click` trên nút xóa để xóa ảnh.
    -   **SVG:** `change` trên textarea để cập nhật mã SVG.

-   **Các kỹ thuật nổi bật:**
    -   **Aspect Ratio Preservation (Image):** Tính toán và điều chỉnh kích thước động để ảnh không bị méo, là một kỹ thuật quan trọng để đảm bảo chất lượng hiển thị.
    -   **Binary File Parsing (Image):** Sử dụng `imagehelper.ts` để đọc metadata từ buffer của file ảnh, một kỹ thuật xử lý cấp thấp hiệu quả.
    -   **Live Preview (SVG):** Cung cấp trải nghiệm chỉnh sửa tốt hơn bằng cách hiển thị kết quả render song song với trình soạn thảo mã.
    -   **Performance Caching (Image):** Tái sử dụng `PDFImage` object đã được nhúng để tối ưu hóa kích thước file PDF và tốc độ render.
    -   **Coordinate System Adjustment (SVG):** Xử lý cẩn thận sự khác biệt về hệ tọa độ giữa `pdfme` và hàm `drawSvg` của `pdf-lib`.
    -   **Input Validation:** Cả hai plugin đều có các hàm kiểm tra đầu vào (`isValidSVG`, `detector` trong `imagehelper`) để tăng tính ổn định và tránh lỗi.