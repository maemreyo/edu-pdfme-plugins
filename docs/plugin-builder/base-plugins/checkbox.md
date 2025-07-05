======================================================================
==   PHÂN TÍCH CHI TIẾT PLUGIN CHECKBOX TRONG PDFME                  ==
======================================================================

Tài liệu này phân tích sâu plugin `checkbox`, một plugin điều khiển form cơ bản cho phép người dùng chọn hoặc bỏ chọn một tùy chọn.

MỤC LỤC
---------
1.  Mục đích và Usecase
2.  Phân tích Schema
3.  Phân tích Luồng Render trên UI (`ui` function)
    3.1. Xử lý Sự kiện Click (Toggle)
    3.2. Ủy thác việc hiển thị cho SVG Plugin
4.  Phân tích Luồng Render trên PDF (`pdf` function)
5.  Phân tích Bảng Thuộc tính (`propPanel`)
6.  Tổng kết các Kỹ thuật và Event chính

----------------------------------------------------------------------
1. MỤC ĐÍCH VÀ USECASE
----------------------------------------------------------------------

Plugin `checkbox` mô phỏng hành vi của một ô checkbox HTML, cho phép người dùng bật/tắt một trạng thái boolean (đúng/sai, có/không). Mỗi checkbox hoạt động hoàn toàn độc lập với các checkbox khác.

-   **Usecase chính:** Dùng cho các câu hỏi có/không, danh sách các mục có thể chọn nhiều tùy chọn (ví dụ: "Chọn các sở thích của bạn"), hoặc xác nhận điều khoản dịch vụ.
-   **Đặc điểm:** Đây là một plugin đơn giản, tập trung vào việc chuyển đổi (toggle) một trạng thái duy nhất và hiển thị trực quan trạng thái đó.

----------------------------------------------------------------------
2. PHÂN TÍCH SCHEMA
----------------------------------------------------------------------

```typescript
interface Checkbox extends Schema {
  color: string;
}
```

-   **`content: string`**: Kế thừa từ `Schema`, thuộc tính này lưu trạng thái của checkbox, nhận giá trị là `"true"` (đã chọn) hoặc `"false"` (chưa chọn).
-   **`color: string`**: Xác định màu sắc của icon checkbox (cả hình vuông và dấu tick).

----------------------------------------------------------------------
3. PHÂN TÍCH LUỒNG RENDER TRÊN UI (`ui` function)
----------------------------------------------------------------------

Logic UI của `checkbox` rất thẳng thắn và hiệu quả.

### 3.1. Xử lý Sự kiện Click (Toggle)

-   **Gắn vào đâu:** Sự kiện `click` được gắn vào `div` container chính của plugin.
-   **Điều kiện:** Chỉ được gắn khi `isEditable(mode, schema)` là `true`, cho phép tương tác trong chế độ `designer` và `form`.
-   **Hành động:** Khi người dùng nhấp vào container, một hàm callback được thực thi.
    -   **Logic Toggle:** Hàm này thực hiện một logic chuyển đổi trạng thái đơn giản: `value === 'true' ? 'false' : 'true'`.
    -   **Cập nhật State:** Nó ngay lập tức gọi `onChange({ key: 'content', value: ... })` với giá trị mới. Lời gọi này sẽ cập nhật `schema.content` trong state chính của ứng dụng, dẫn đến việc `pdfme` sẽ tự động render lại plugin này với trạng thái (và icon) mới.

### 3.2. Ủy thác việc hiển thị cho SVG Plugin

-   Giống như `radioGroup`, plugin `checkbox` không tự vẽ hình ảnh. Nó sử dụng `svg` plugin như một "engine" hiển thị.
-   **`getIcon({ value, color })`**: Hàm này đóng vai trò quyết định. Dựa vào `value` (`"true"` hay `"false"`), nó sẽ gọi `getCheckedIcon` hoặc `getUncheckedIcon` để tạo ra chuỗi SVG tương ứng.
    -   `getCheckedIcon`: Tạo SVG của icon `SquareCheck` từ thư viện `lucide`.
    -   `getUncheckedIcon`: Tạo SVG của icon `Square` từ thư viện `lucide`.
-   **Gọi `svg.ui`**: Sau khi có được chuỗi SVG, nó gọi `svg.ui` và truyền chuỗi này vào thuộc tính `value`. Quan trọng là nó truyền `mode: 'viewer'`, để `svg` plugin chỉ thực hiện việc render hình ảnh mà không thêm bất kỳ hành vi tương tác nào của riêng nó.

----------------------------------------------------------------------
4. PHÂN TÍCH LUỒNG RENDER TRÊN PDF (`pdf` function)
----------------------------------------------------------------------

-   **`pdf: (arg) => svg.pdf(...)`**: Logic render PDF cũng được **ủy thác hoàn toàn** cho `svg` plugin.
-   **Luồng hoạt động:**
    1.  Hàm `getIcon` được gọi để lấy chuỗi SVG chính xác dựa trên trạng thái (`arg.value`).
    2.  Một đối tượng `arg` mới được tạo bằng `Object.assign`, trong đó `value` được thay thế bằng chuỗi SVG.
    3.  Đối tượng `arg` mới này được truyền cho `svg.pdf`.
    4.  Plugin `svg` nhận chuỗi SVG và sử dụng `page.drawSvg` để vẽ nó lên tài liệu PDF.

----------------------------------------------------------------------
5. PHÂN TÍCH BẢNG THUỘC TÍNH (`propPanel`)
----------------------------------------------------------------------

Bảng thuộc tính của `checkbox` rất tối giản, chỉ chứa một tùy chọn duy nhất:

-   **`color`**: Một `color` widget cho phép người thiết kế thay đổi màu sắc của icon checkbox. Nó được đánh dấu là `required: true` và có rule để kiểm tra định dạng `HEX_COLOR_PATTERN`.

----------------------------------------------------------------------
6. TỔNG KẾT CÁC KỸ THUẬT VÀ EVENT CHÍNH
----------------------------------------------------------------------

-   **Events chính trên UI:**
    -   `click` trên container: Là sự kiện duy nhất, dùng để kích hoạt logic chuyển đổi trạng thái (toggle).

-   **Các kỹ thuật nổi bật:**
    -   **Plugin Composition/Delegation:** Đây là một ví dụ kinh điển của việc "ủy thác". Plugin `checkbox` tập trung hoàn toàn vào logic nghiệp vụ (quản lý trạng thái true/false) và giao toàn bộ phần hiển thị phức tạp (vẽ SVG trên UI và PDF) cho một plugin chuyên dụng khác (`svg`). Điều này giúp mã nguồn của `checkbox` cực kỳ gọn gàng và dễ hiểu.
    -   **State Toggling:** Logic xử lý sự kiện `click` là một ví dụ đơn giản và hiệu quả về cách chuyển đổi một giá trị boolean được lưu dưới dạng chuỗi.
    -   **Tái sử dụng Icon:** Sử dụng thư viện `lucide` và hàm tiện ích `createSvgStr` để dễ dàng tạo và tùy chỉnh các icon SVG.