======================================================================
==   PHÂN TÍCH CHI TIẾT PLUGIN RADIOGROUP TRONG PDFME                ==
======================================================================

Tài liệu này phân tích sâu plugin `radioGroup`, một plugin điều khiển form cho phép người dùng chỉ chọn một tùy chọn từ một nhóm.

MỤC LỤC
---------
1.  Mục đích và Usecase
2.  Phân tích Schema
3.  Phân tích Luồng Render trên UI (`ui` function)
    3.1. Kỹ thuật "Event Bus" với EventTarget
    3.2. Quản lý Trạng thái và Listener
    3.3. Xử lý Sự kiện Click
4.  Phân tích Luồng Render trên PDF (`pdf` function)
5.  Phân tích Bảng Thuộc tính (`propPanel`)
6.  Tổng kết các Kỹ thuật và Event chính

----------------------------------------------------------------------
1. MỤC ĐÍCH VÀ USECASE
----------------------------------------------------------------------

Plugin `radioGroup` mô phỏng hành vi của các nút radio HTML. Người dùng có thể đặt nhiều schema `radioGroup` trên tài liệu, và nếu chúng thuộc cùng một "nhóm" (`group`), chỉ một trong số chúng có thể được chọn (ở trạng thái "true") tại một thời điểm.

-   **Usecase chính:** Dùng cho các câu hỏi trắc nghiệm hoặc các lựa chọn loại trừ lẫn nhau, ví dụ: chọn Giới tính (Nam/Nữ/Khác), chọn Phương thức thanh toán (Tiền mặt/Thẻ), v.v.
-   **Đặc điểm:** Không giống như các plugin khác hoạt động độc lập, các instance của `radioGroup` cần giao tiếp với nhau để đảm bảo tính nhất quán của nhóm.

----------------------------------------------------------------------
2. PHÂN TÍCH SCHEMA
----------------------------------------------------------------------

```typescript
interface RadioGroup extends Schema {
  group: string;
  color: string;
}
```

-   **`content: string`**: Kế thừa từ `Schema`, thuộc tính này lưu trạng thái của radio button, nhận giá trị là `"true"` hoặc `"false"`.
-   **`group: string`**: Đây là thuộc tính then chốt. Tất cả các radio button có cùng giá trị `group` sẽ được coi là một nhóm.
-   **`color: string`**: Xác định màu sắc của icon radio (cả vòng tròn và dấu chấm).

----------------------------------------------------------------------
3. PHÂN TÍCH LUỒNG RENDER TRÊN UI (`ui` function)
----------------------------------------------------------------------

Đây là phần phức tạp và cốt lõi nhất của plugin, sử dụng một pattern "Event Bus" để giao tiếp giữa các schema.

### 3.1. Kỹ thuật "Event Bus" với EventTarget

-   **Vấn đề:** Làm thế nào để một radio button biết khi nào một radio button khác trong cùng nhóm được chọn để nó có thể tự bỏ chọn? Các schema được render độc lập và không có tham chiếu trực tiếp đến nhau.
-   **Giải pháp:** Plugin sử dụng một `EventTarget` toàn cục (được khởi tạo một lần duy nhất ở cấp module). `EventTarget` là một API chuẩn của trình duyệt, cho phép đăng ký và phát các sự kiện tùy chỉnh. Nó hoạt động như một trung tâm giao tiếp (Event Bus).

    ```typescript
    const eventEmitter = new EventTarget();
    ```

-   **Luồng hoạt động của Event Bus:**
    1.  **Phát sự kiện (Dispatch):** Khi người dùng nhấp vào một radio button (A) để chọn nó, nó sẽ phát một sự kiện tùy chỉnh. Tên của sự kiện được tạo động dựa trên tên nhóm: `new CustomEvent(\`group-${schema.group}\`, ...)`.
    2.  **Gửi dữ liệu:** Sự kiện này mang theo một `detail` payload, chứa `schema.name` của radio button (A) vừa được chọn.
    3.  **Lắng nghe sự kiện (Listen):** Tất cả các radio button khác trong cùng nhóm (B, C, D...) cũng đã đăng ký một trình lắng nghe (`eventListener`) cho cùng tên sự kiện đó (`group-${schema.group}`).
    4.  **Xử lý sự kiện:** Khi các radio button (B, C, D) nhận được sự kiện, chúng sẽ kiểm tra `detail`. Nếu `detail` (tên của schema được chọn) **không phải** là tên của chính chúng, chúng sẽ tự động chuyển trạng thái của mình về `"false"`.

### 3.2. Quản lý Trạng thái và Listener

Để Event Bus hoạt động, plugin cần lưu trữ thông tin về các listener và trạng thái của từng radio button.

-   **`radioButtonStates = new Map<string, RadioButtonState>()`**:
    -   Một `Map` toàn cục để lưu trạng thái của mỗi radio button.
    -   **Key:** `schema.name` (tên duy nhất của schema).
    -   **Value:** Một object `{ value, onChange }`. Lưu trữ giá trị hiện tại và hàm `onChange` của schema đó. Điều này rất quan trọng, vì khi một radio button cần tự bỏ chọn, nó cần truy cập vào hàm `onChange` của chính nó để cập nhật state.

-   **`eventListeners = new Map<string, EventListener>()`**:
    -   Một `Map` toàn cục để theo dõi các hàm listener đã được đăng ký.
    -   **Key:** `schema.name`.
    -   **Value:** Hàm `handleGroupEvent`.
    -   **Mục đích:** Khi một schema được render lại (ví dụ: khi di chuyển nó trong designer), hàm `ui` sẽ được gọi lại. Để tránh rò rỉ bộ nhớ (memory leak) do đăng ký nhiều listener cho cùng một sự kiện, plugin sẽ kiểm tra `eventListeners` để tìm listener cũ, `removeEventListener` nó đi, rồi mới `addEventListener` cho listener mới. Đây là một kỹ thuật dọn dẹp (cleanup) rất quan trọng.

### 3.3. Xử lý Sự kiện Click

-   **Gắn vào đâu:** Sự kiện `click` được gắn vào `div` container của plugin.
-   **Điều kiện:** Chỉ được gắn khi `isEditable(mode, schema)` là `true`.
-   **Hành động:**
    1.  Kiểm tra nếu `value` hiện tại là `"true"`, nó sẽ không làm gì cả (không thể bỏ chọn một radio button bằng cách nhấp lại vào nó).
    2.  Nếu `value` là `"false"`, nó sẽ:
        a.  Gọi `onChange({ key: 'content', value: 'true' })` để cập nhật trạng thái của chính nó thành đã chọn.
        b.  Cập nhật lại trạng thái trong `radioButtonStates`.
        c.  **Phát sự kiện:** Gọi `eventEmitter.dispatchEvent(...)` để thông báo cho các radio button khác trong cùng nhóm.

### 3.4. Hiển thị Icon

-   Plugin này không tự vẽ icon. Nó **ủy thác** việc hiển thị cho `svg` plugin.
-   Hàm `getIcon` sẽ quyết định chuỗi SVG nào sẽ được sử dụng (`CircleDot` cho checked, `Circle` cho unchecked) dựa trên `value`.
-   Nó gọi `svg.ui` với `mode: 'viewer'` để `svg` plugin chỉ đơn giản là render icon mà không thêm bất kỳ logic tương tác nào của riêng `svg` plugin.

----------------------------------------------------------------------
4. PHÂN TÍCH LUỒNG RENDER TRÊN PDF (`pdf` function)
----------------------------------------------------------------------

-   **`pdf: (arg) => svg.pdf(...)`**: Tương tự như UI, việc render PDF được ủy thác hoàn toàn cho `svg` plugin.
-   **Luồng hoạt động:** Nó xác định chuỗi SVG cần thiết bằng `getIcon`, sau đó truyền chuỗi SVG này làm `value` cho `svg.pdf`. Plugin `svg` sẽ nhận chuỗi này và vẽ nó lên tài liệu PDF.

----------------------------------------------------------------------
5. PHÂN TÍCH BẢNG THUỘC TÍNH (`propPanel`)
----------------------------------------------------------------------

Bảng thuộc tính của `radioGroup` khá đơn giản, cho phép người thiết kế cấu hình hai thuộc tính chính:

-   **`color`**: Một `color` widget để chọn màu cho icon.
-   **`group`**: Một `string` input để đặt tên nhóm. Đây là thuộc tính quan trọng nhất để liên kết các radio button với nhau.

----------------------------------------------------------------------
6. TỔNG KẾT CÁC KỸ THUẬT VÀ EVENT CHÍNH
----------------------------------------------------------------------

-   **Events chính trên UI:**
    -   `click` trên container: Kích hoạt việc chọn radio button và phát sự kiện cho nhóm.
    -   Sự kiện tùy chỉnh (`CustomEvent`): Được sử dụng như một cơ chế giao tiếp liên-component (inter-component communication).

-   **Các kỹ thuật nổi bật:**
    -   **Event Bus Pattern:** Sử dụng một `EventTarget` toàn cục để cho phép các schema độc lập giao tiếp với nhau dựa trên một thuộc tính chung (`schema.group`). Đây là một giải pháp thanh lịch cho vấn đề quản lý trạng thái nhóm.
    -   **State and Listener Management:** Sử dụng các `Map` toàn cục để lưu trữ trạng thái và các hàm `onChange`, cũng như để quản lý vòng đời của các event listener, tránh memory leak.
    -   **Plugin Composition/Delegation:** Tái sử dụng mạnh mẽ `svg` plugin cho cả việc render UI và PDF, giúp mã nguồn gọn gàng và tập trung vào logic nghiệp vụ chính của radio group.
    -   **Dynamic Event Naming:** Tên của sự kiện (`group-${schema.group}`) được tạo động, cho phép có nhiều nhóm radio độc lập cùng tồn tại trên một tài liệu.