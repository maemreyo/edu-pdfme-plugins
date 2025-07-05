======================================================================
==   PHÂN TÍCH CHI TIẾT PLUGIN SELECT TRONG PDFME                    ==
======================================================================

Tài liệu này phân tích sâu plugin `select`, một plugin điều khiển form (form control) được xây dựng dựa trên nền tảng của plugin `text`.

MỤC LỤC
---------
1.  Mục đích và Usecase
2.  Phân tích Schema
3.  Phân tích Luồng Render trên UI (`ui` function)
    3.1. Kỹ thuật "Overlay" (Phủ lớp)
    3.2. Xử lý Sự kiện (Events)
4.  Phân tích Luồng Render trên PDF (`pdf` function)
5.  Phân tích Bảng Thuộc tính (`propPanel`)
    5.1. Kế thừa và Mở rộng
    5.2. Widget tùy chỉnh `addOptions`
6.  Tổng kết các Kỹ thuật và Event chính

----------------------------------------------------------------------
1. MỤC ĐÍCH VÀ USECASE
----------------------------------------------------------------------

Plugin `select` được thiết kế để tạo ra một ô lựa chọn (dropdown/select box) trên tài liệu. Người dùng cuối (ở chế độ `form`) có thể nhấp vào ô này để chọn một giá trị từ một danh sách các tùy chọn đã được định sẵn.

-   **Usecase chính:** Thu thập dữ liệu có cấu trúc từ người dùng, giới hạn các lựa chọn của họ vào một tập hợp giá trị cụ thể (ví dụ: chọn Tỉnh/Thành phố, chọn Tình trạng hôn nhân, v.v.).
-   **Đặc điểm:** Nó kết hợp khả năng hiển thị văn bản có thể định dạng của plugin `text` với chức năng của một phần tử `<select>` trong HTML.

----------------------------------------------------------------------
2. PHÂN TÍCH SCHEMA
----------------------------------------------------------------------

Schema của `select` được định nghĩa bằng cách kế thừa `TextSchema` và thêm một thuộc tính mới:

```typescript
interface Select extends TextSchema {
  options: string[];
}
```

-   **Kế thừa `TextSchema`:** Điều này rất quan trọng. Nó cho phép `select` tận dụng tất cả các thuộc tính định dạng của `text` như `fontName`, `fontSize`, `alignment`, `fontColor`, v.v. Giá trị được chọn sẽ được hiển thị với các style này.
-   **`options: string[]`**: Đây là thuộc tính cốt lõi của plugin này. Nó là một mảng các chuỗi, định nghĩa các lựa chọn sẽ xuất hiện trong dropdown.
-   **`content: string`**: Thuộc tính này (kế thừa từ `Schema`) lưu trữ giá trị **hiện tại** đã được chọn.

----------------------------------------------------------------------
3. PHÂN TÍCH LUỒNG RENDER TRÊN UI (`ui` function)
----------------------------------------------------------------------

Đây là phần thông minh nhất của plugin, thể hiện một kỹ thuật UI sáng tạo.

### 3.1. Kỹ thuật "Overlay" (Phủ lớp)

Plugin này không tự vẽ một dropdown box. Thay vào đó, nó thực hiện các bước sau:

1.  **Render Lớp Nền (Text):** Nó gọi `await text.ui(Object.assign(arg, { mode: 'viewer' }))`. Lệnh này yêu cầu plugin `text` render giá trị hiện tại (`value`) ở chế độ chỉ xem (`viewer`). Kết quả là một `div` hiển thị văn bản đã được định dạng đẹp mắt.

2.  **Render Lớp Tương tác (Select Element):**
    -   Nó tạo ra một phần tử `<select>` HTML thực sự.
    -   **Kỹ thuật chính:** Phần tử `<select>` này được style để **hoàn toàn trong suốt** (`opacity: '0'`) và được đặt **đè chính xác lên trên** `div` văn bản đã render ở bước 1 (`position: 'absolute', width: '100%', height: '100%'`).
    -   Người dùng cuối khi nhìn vào sẽ thấy `div` văn bản, nhưng khi họ nhấp chuột, họ thực sự đang nhấp vào phần tử `<select>` trong suốt ở trên.

3.  **Render Nút Mũi tên:**
    -   Nó tạo một `<button>` chứa icon mũi tên xuống (`selectIcon`).
    -   Nút này được đặt ở bên phải của schema, tạo cảm giác đây là một dropdown box thực sự.
    -   Nó được đặt với `zIndex: -1` để nằm **phía sau** phần tử `<select>` trong suốt. Điều này đảm bảo khi người dùng nhấp vào mũi tên, họ vẫn đang nhấp vào `<select>`. Chiều rộng của `<select>` cũng được tính toán `calc(100% + ${buttonWidth}px)` để bao phủ cả nút mũi tên.

**=> Kết quả:** Người dùng có được trải nghiệm của một dropdown box gốc của trình duyệt (với các tùy chọn, cuộn, v.v.) trong khi phần hiển thị vẫn là một khối văn bản có thể định dạng tùy ý theo `TextSchema`.

### 3.2. Xử lý Sự kiện (Events)

-   **`change`**: Sự kiện duy nhất và quan trọng nhất được lắng nghe.
    -   **Gắn vào đâu:** Gắn trực tiếp vào phần tử `<select>` trong suốt.
    -   **Hành động:** Khi người dùng chọn một `option` mới, sự kiện `change` được kích hoạt. Trình xử lý sẽ lấy giá trị mới từ `e.target.value` và gọi `onChange({ key: 'content', value: ... })`.
    -   Hàm `onChange` sẽ cập nhật `schema.content` trong state chính, và UI sẽ tự động được render lại (thông qua `text.ui`) để hiển thị giá trị mới.

----------------------------------------------------------------------
4. PHÂN TÍCH LUỒNG RENDER TRÊN PDF (`pdf` function)
----------------------------------------------------------------------

Phần này rất đơn giản và hiệu quả.

-   **`pdf: text.pdf`**: Plugin `select` không có logic render PDF riêng. Nó chỉ đơn giản là **ủy thác hoàn toàn** cho `text.pdf`.
-   **Luồng hoạt động:** Khi render PDF, `pdfme` sẽ gọi `select.pdf(arg)`. Hàm này sẽ chuyển tiếp toàn bộ `arg` (bao gồm `schema` và `value` là giá trị đã được chọn) cho `text.pdf`. Plugin `text` sẽ nhận giá trị này và vẽ nó lên PDF như một khối văn bản bình thường, với tất cả các định dạng đã được định nghĩa trong schema.

=> Điều này thể hiện sức mạnh của việc kế thừa và tái sử dụng code. Logic phức tạp của việc vẽ văn bản không cần phải lặp lại.

----------------------------------------------------------------------
5. PHÂN TÍCH BẢNG THUỘC TÍNH (`propPanel`)
----------------------------------------------------------------------

### 5.1. Kế thừa và Mở rộng

-   **`...text.propPanel`**: Bảng thuộc tính của `select` kế thừa toàn bộ bảng thuộc tính của `text`. Điều này cho phép người thiết kế (designer) truy cập tất cả các tùy chọn định dạng văn bản (font, size, color, alignment, v.v.).
-   **Mở rộng:** Sau khi kế thừa, nó thêm một `Divider` và một `Card` mới có tiêu đề "Options" (`optionsContainer`). Card này chứa một widget tùy chỉnh để quản lý danh sách các lựa chọn.

### 5.2. Widget tùy chỉnh `addOptions`

Đây là một hàm tạo ra một giao diện người dùng động để quản lý `schema.options`.

-   **Cấu trúc UI:**
    -   Một `input` và một nút `+` (Add) để thêm tùy chọn mới.
    -   Một danh sách `<ul>` để hiển thị các tùy chọn hiện có.
    -   Mỗi mục trong danh sách (`<li>`) chứa một `input` (để sửa tên tùy chọn) và một nút `x` (Remove) để xóa tùy chọn đó.

-   **Luồng sự kiện trong Widget:**
    -   **Add Button `click`**: Đọc giá trị từ `input` thêm mới, `push` nó vào mảng `currentOptions`, sau đó gọi `updateSchemas()` và `renderOptions()` để cập nhật state và giao diện.
    -   **Option Input `change`**: Khi người dùng sửa tên một tùy chọn, sự kiện `change` trên `input` của `<li>` đó sẽ cập nhật giá trị trong mảng `currentOptions` tại đúng vị trí `index`, sau đó gọi `updateSchemas()`.
    -   **Remove Button `click`**: Sử dụng `splice` để xóa tùy chọn khỏi mảng `currentOptions` tại `index`, sau đó gọi `updateSchemas()` và `renderOptions()`.

-   **Hàm `updateSchemas()`**:
    -   Đây là hàm trung tâm, được gọi sau mỗi thay đổi.
    -   Nó gọi `changeSchemas` để cập nhật hai thuộc tính trong schema chính:
        1.  `key: 'options'`: Cập nhật lại toàn bộ mảng các tùy chọn.
        2.  `key: 'content'`: Tự động đặt giá trị được chọn (`content`) thành tùy chọn đầu tiên trong danh sách (`currentOptions[0]`). Điều này đảm bảo `content` luôn là một giá trị hợp lệ có trong `options`.

----------------------------------------------------------------------
6. TỔNG KẾT CÁC KỸ THUẬT VÀ EVENT CHÍNH
----------------------------------------------------------------------

-   **Events chính trên UI:**
    -   `change` trên thẻ `<select>`: Bắt lựa chọn của người dùng cuối và cập nhật `schema.content`.

-   **Events trong Prop Panel:**
    -   `click` trên các nút Add/Remove: Quản lý danh sách `schema.options`.
    -   `change` trên các input của option: Cho phép sửa đổi các tùy chọn đã có.

-   **Các kỹ thuật nổi bật:**
    -   **Plugin Wrapping/Composition:** Xây dựng một plugin mới bằng cách kế thừa và mở rộng một plugin đã có (`text`). Đây là một pattern thiết kế rất mạnh mẽ và hiệu quả.
    -   **UI Overlay Technique:** Sử dụng một phần tử HTML gốc trong suốt (`<select>`) đặt lên trên một phần tử đã được style tùy chỉnh (`div` từ `text.ui`) để kết hợp giao diện đẹp và chức năng gốc của trình duyệt.
    -   **Dynamic Prop Panel Widget:** Tạo ra một giao diện người dùng động (`addOptions`) bên trong bảng thuộc tính để quản lý một mảng dữ liệu phức tạp.
    -   **State Synchronization:** Sử dụng hàm `updateSchemas` để đảm bảo `schema.content` và `schema.options` luôn đồng bộ với nhau.