======================================================================
==   PHÂN TÍCH SIÊU CHI TIẾT PLUGIN TABLE TRONG PDFME                ==
======================================================================

Tài liệu này phân tích sâu kiến trúc và luồng hoạt động của plugin `table`, một trong những thành phần phức tạp và mạnh mẽ nhất của hệ thống.

MỤC LỤC
---------
1.  Mục đích và Usecase
2.  Kiến trúc Tổng quan: Một Framework trong Framework
3.  Mô hình Dữ liệu và Luồng Tính toán (`classes.ts`)
    3.1. Các Lớp Cốt lõi: `Table`, `Row`, `Column`, `Cell`
    3.2. Luồng Tính toán Layout (The Calculation Flow)
4.  Phân tích Luồng Render trên UI (`uiRender.ts`)
    4.1. Render theo từng ô (Cell-by-Cell Rendering)
    4.2. Quản lý Trạng thái Chỉnh sửa
    4.3. Tương tác trên Designer Mode (Events)
5.  Phân tích Luồng Render trên PDF (`pdfRender.ts`)
6.  Plugin `cell`: Nền tảng của Bảng
7.  Các Hàm Hỗ trợ và Chuẩn bị Dữ liệu (`tableHelper.ts`, `helper.ts`)
8.  Tính năng Dynamic Template (`dynamicTemplate.ts`)
9.  Tổng kết các Kỹ thuật và Event chính

----------------------------------------------------------------------
1. MỤC ĐÍCH VÀ USECASE
----------------------------------------------------------------------

Plugin `table` cho phép tạo ra các bảng biểu có cấu trúc, với khả năng tùy chỉnh style sâu rộng và các tính năng tương tác động.

-   **Usecase chính:** Hiển thị dữ liệu dạng bảng như hóa đơn, danh sách sản phẩm, báo cáo thống kê.
-   **Các tính năng nổi bật:**
    -   Tự động tính toán chiều rộng cột và chiều cao hàng.
    -   Hỗ trợ ngắt dòng văn bản trong ô.
    -   Tùy chỉnh style cho toàn bộ bảng, header, body, và từng cột riêng lẻ.
    -   Hỗ trợ màu nền xen kẽ cho các hàng (alternate row color).
    -   Tương tác động: thay đổi kích thước cột, thêm/xóa hàng/cột.
    -   Hỗ trợ template động (dynamic template) để render các bảng có số hàng thay đổi.

----------------------------------------------------------------------
2. KIẾN TRÚC TỔNG QUAN: MỘT FRAMEWORK TRONG FRAMEWORK
----------------------------------------------------------------------

Plugin `table` không phải là một file đơn lẻ mà là một module phức tạp, được cấu thành từ nhiều phần:

-   **`index.ts`**: Điểm vào chính, định nghĩa plugin `table`.
-   **`classes.ts`**: **Bộ não tính toán**. Định nghĩa các lớp mô hình dữ liệu (`Table`, `Row`, `Column`, `Cell`) và chứa các thuật toán cốt lõi để tính toán layout của bảng.
-   **`uiRender.ts` & `pdfRender.ts`**: **Bộ phận thực thi**. Chịu trách nhiệm render kết quả đã được tính toán ra UI và PDF.
-   **`tableHelper.ts`**: **Bộ phận chuẩn bị**. Chuyển đổi `TableSchema` từ `pdfme` thành một cấu trúc dữ liệu (`TableInput`) mà `classes.ts` có thể hiểu và xử lý.
-   **`cell.ts`**: Một **plugin con** (sub-plugin). `table` được xây dựng như một tập hợp của các `cell`. `cell` chịu trách nhiệm render một ô duy nhất.
-   **`helper.ts` & `types.ts`**: Các hàm tiện ích và định nghĩa kiểu dữ liệu.
-   **`dynamicTemplate.ts`**: Cung cấp hàm để hỗ trợ tính năng template động.

=> Kiến trúc này tuân theo nguyên tắc **phân tách mối quan tâm (Separation of Concerns)**: logic tính toán layout được tách biệt hoàn toàn khỏi logic render.

----------------------------------------------------------------------
3. MÔ HÌNH DỮ LIỆU VÀ LUỒNG TÍNH TOÁN (`classes.ts`)
----------------------------------------------------------------------

Đây là phần quan trọng và phức tạp nhất.

### 3.1. Các Lớp Cốt lõi: `Table`, `Row`, `Column`, `Cell`

-   **`Cell`**: Đại diện cho một ô. Chứa nội dung thô (`raw`), văn bản đã ngắt dòng (`text`), và các thuộc tính style đã được tính toán.
-   **`Row`**: Đại diện cho một hàng. Chứa một tập hợp các `Cell` và thuộc tính `height` của hàng.
-   **`Column`**: Đại diện cho một cột. Chứa các thuộc tính về chiều rộng (`width`, `minWidth`, `wrappedWidth`, `minReadableWidth`).
-   **`Table`**: Đối tượng gốc, chứa một mảng các `Column`, các hàng `head` và `body`, cùng với các `settings` và `styles` chung.

### 3.2. Luồng Tính toán Layout (The Calculation Flow)

Khi `createSingleTable` được gọi, nó sẽ kích hoạt một chuỗi các bước tính toán trong `Table.create` và `calculateWidths`:

1.  **Giai đoạn 1: Tính toán chiều rộng yêu cầu (`calculate`)**
    -   Duyệt qua từng ô trong bảng.
    -   Sử dụng `widthOfTextAtSize` để tính `contentWidth` (chiều rộng của toàn bộ văn bản trong ô nếu không ngắt dòng).
    -   Tính `minReadableWidth` (chiều rộng của từ dài nhất trong ô, đây là chiều rộng tối thiểu để văn bản còn có thể đọc được).
    -   Sau khi duyệt qua tất cả các ô, chiều rộng yêu cầu của mỗi **cột** (`column.wrappedWidth`, `column.minReadableWidth`) được xác định bằng giá trị lớn nhất từ các ô trong cột đó.

2.  **Giai đoạn 2: Phân bổ chiều rộng (`resizeColumns`)**
    -   Đây là một thuật toán phân bổ thông minh.
    -   Nó tính tổng chiều rộng ban đầu của các cột và so sánh với chiều rộng của toàn bộ bảng (`table.getWidth()`).
    -   Khoảng chênh lệch (`resizeWidth`) sẽ được phân bổ cho các cột có thể thay đổi kích thước.
    -   **Phân bổ theo tỷ lệ:** Khoảng chênh lệch được chia cho các cột dựa trên tỷ lệ chiều rộng ban đầu của chúng (`column.wrappedWidth / sumWrappedWidth`).
    -   **Đệ quy và ràng buộc:** Thuật toán này được gọi đệ quy. Lần đầu, nó tôn trọng `minReadableWidth`. Nếu sau lần đầu vẫn còn không gian cần phân bổ (ví dụ: một số cột đã bị co lại đến mức tối thiểu), nó sẽ chạy lại và chỉ tôn trọng `minWidth` (chiều rộng cứng do người dùng đặt). Điều này đảm bảo bảng luôn vừa khít với chiều rộng đã cho.

3.  **Giai đoạn 3: Ngắt dòng và tính chiều cao (`fitContent`)**
    -   Sau khi chiều rộng cuối cùng của mỗi cột đã được xác định.
    -   Duyệt qua từng ô một lần nữa.
    -   Gọi `splitTextToSize` (từ `text/helper.js`) để ngắt dòng văn bản trong ô dựa trên chiều rộng cột đã có.
    -   Tính `cell.contentHeight` dựa trên số dòng và `lineHeight`.
    -   Chiều cao của mỗi **hàng** (`row.height`) được xác định bằng chiều cao của ô cao nhất trong hàng đó.

4.  **Giai đoạn 4: Xử lý gộp ô (`applyColSpans`, `applyRowSpans`)**
    -   Logic này hiện tại còn đơn giản và có thể được cải thiện. Nó chủ yếu xử lý việc gộp chiều rộng/chiều cao và xóa các ô bị gộp.

**=> Kết quả cuối cùng:** Một đối tượng `Table` chứa đầy đủ thông tin về vị trí, kích thước (`width`, `height`) của từng ô, sẵn sàng cho việc render.

----------------------------------------------------------------------
4. PHÂN TÍCH LUỒNG RENDER TRÊN UI (`uiRender.ts`)
----------------------------------------------------------------------

### 4.1. Render theo từng ô (Cell-by-Cell Rendering)

-   `uiRender` không vẽ một thẻ `<table>` HTML.
-   Nó gọi `createSingleTable` để có được đối tượng `Table` đã được tính toán.
-   Sau đó, nó lặp qua từng `Row` và từng `Cell` trong đối tượng `Table`.
-   Với mỗi `Cell`, nó tạo một `div` với `position: 'absolute'` và đặt `top`, `left`, `width`, `height` dựa trên các giá trị đã được tính toán trong `classes.ts`.
-   Nó gọi `cell.ui` và truyền `div` này làm `rootElement` để `cell` plugin tự render nội dung bên trong.

### 4.2. Quản lý Trạng thái Chỉnh sửa

-   Sử dụng hai biến toàn cục `headEditingPosition` và `bodyEditingPosition` để theo dõi ô nào đang được chỉnh sửa.
-   Khi một ô được click, `handleChangeEditingPosition` được gọi. Nó sẽ cập nhật vị trí đang chỉnh sửa và **gọi lại `uiRender` để render lại toàn bộ bảng**.
-   Trong lần render lại, nó sẽ kiểm tra `isEditing` và truyền `mode: 'designer'` cho `cell.ui` của ô được chọn, và `mode: 'viewer'` hoặc `form` cho các ô khác.

### 4.3. Tương tác trên Designer Mode (Events)

-   **Thêm/Xóa Hàng/Cột:** Tạo các nút `+` và `-` bằng hàm `createButton`.
    -   **Event:** `click`.
    -   **Hành động:** Sửa đổi trực tiếp dữ liệu trong `schema.content` (thêm/xóa một mảng con) hoặc `schema.head` và `schema.headWidthPercentages`, sau đó gọi `onChange` để kích hoạt render lại.
-   **Thay đổi kích thước cột:**
    -   Tạo các `div` `dragHandle` giữa các cột.
    -   **Events:** `mousedown`, `mousemove`, `mouseup`.
    -   **Hành động:**
        -   `mousedown`: Gắn listener cho `mousemove` và `mouseup` trên `rootElement`.
        -   `mousemove`: Theo dõi `e.movementX` để tính toán sự thay đổi vị trí của handle.
        -   `mouseup`: Tính toán lại `headWidthPercentages` dựa trên sự thay đổi, gọi `onChange`, và gỡ các listener `mousemove`, `mouseup`.

----------------------------------------------------------------------
5. PHÂN TÍCH LUỒNG RENDER TRÊN PDF (`pdfRender.ts`)
----------------------------------------------------------------------

-   Luồng hoạt động tương tự UI:
    1.  Gọi `createSingleTable` để có đối tượng `Table` đã được tính toán.
    2.  Lặp qua từng `Row` và `Cell`.
    3.  Với mỗi `Cell`, nó gọi `cell.pdf` để vẽ ô đó lên PDF.
    4.  Cuối cùng, nó gọi `rectangle.pdf` để vẽ đường viền bao quanh toàn bộ bảng.

----------------------------------------------------------------------
6. PLUGIN `cell`: NỀN TẢNG CỦA BẢNG
----------------------------------------------------------------------

-   `cell.ts` là một plugin hoàn chỉnh nhưng được sử dụng nội bộ.
-   **`pdf` function:** Ủy thác cho các plugin cơ bản hơn.
    -   Vẽ background: `rectangle.pdf`.
    -   Vẽ 4 đường border: 4 lần gọi `line.pdf`.
    -   Vẽ nội dung: `text.pdf`.
-   **`ui` function:** Tương tự, tạo các `div` cho background, border và gọi `text.ui` cho nội dung.

----------------------------------------------------------------------
7. CÁC HÀM HỖ TRỢ VÀ CHUẨN BỊ DỮ LIỆU (`tableHelper.ts`, `helper.ts`)
----------------------------------------------------------------------

-   **`tableHelper.ts`**:
    -   `createSingleTable`: Điểm vào chính, điều phối toàn bộ quá trình.
    -   `parseInput`: Chuyển đổi `TableSchema` thành `TableInput` (một cấu trúc trung gian). Nó hợp nhất các style từ `headStyles`, `bodyStyles`, `columnStyles` thành một cấu trúc style duy nhất cho mỗi ô.
-   **`helper.ts`**:
    -   `getCellPropPanelSchema`: Tạo ra schema cho `propPanel` của một ô, được tái sử dụng ở nhiều nơi.
    -   `getBody`, `getBodyWithRange`: Các hàm tiện ích để trích xuất dữ liệu từ `schema.content`.

----------------------------------------------------------------------
8. TÍNH NĂNG DYNAMIC TEMPLATE (`dynamicTemplate.ts`)
----------------------------------------------------------------------

-   **`getDynamicHeightsForTable`**: Đây là một hàm đặc biệt được `pdfme` core gọi khi sử dụng bảng trong một template động.
-   **Mục đích:** Để `pdfme` có thể biết trước chiều cao của mỗi hàng trong bảng sẽ là bao nhiêu để nó có thể tự động ngắt trang và dịch chuyển các phần tử khác.
-   **Hành động:** Nó chạy một phiên bản "mô phỏng" của luồng tính toán layout (`createSingleTable`) chỉ để lấy ra mảng chiều cao của các hàng (`table.allRows().map(row => row.height)`) và trả về cho core.

----------------------------------------------------------------------
9. TỔNG KẾT CÁC KỸ THUẬT VÀ EVENT CHÍNH
----------------------------------------------------------------------

-   **Events chính trên UI:**
    -   `click` trên ô: Kích hoạt chế độ chỉnh sửa.
    -   `click` trên các nút `+/-`: Thêm/xóa hàng/cột.
    -   `mousedown`, `mousemove`, `mouseup` trên `dragHandle`: Thay đổi kích thước cột.

-   **Các kỹ thuật nổi bật:**
    -   **Separation of Concerns:** Tách biệt hoàn toàn logic tính toán layout (`classes.ts`) và logic render (`uiRender`, `pdfRender`).
    -   **Object-Oriented Data Modeling:** Sử dụng các lớp `Table`, `Row`, `Column`, `Cell` để mô hình hóa cấu trúc bảng một cách rõ ràng.
    -   **Multi-pass Layout Algorithm:** Sử dụng nhiều lượt duyệt (pass) để tính toán chính xác layout: pass 1 để đo đạc, pass 2 để phân bổ chiều rộng, pass 3 để ngắt dòng và tính chiều cao.
    -   **Plugin Composition:** Bảng được xây dựng từ các `cell`, và `cell` lại được xây dựng từ `text`, `line`, `rectangle`.
    -   **Interactive UI Controls:** Tạo ra các handle và button để cho phép người dùng tương tác trực tiếp với cấu trúc bảng trên giao diện.
    -   **Dynamic Template Support:** Cung cấp một hàm riêng biệt để tính toán trước chiều cao, tích hợp với cơ chế template động của `pdfme`.