======================================================================
==   PHÂN TÍCH CHI TIẾT PLUGIN MULTIVARIABLETEXT TRONG PDFME         ==
======================================================================

Tài liệu này phân tích sâu kiến trúc và luồng hoạt động của plugin `multiVariableText` (MVT), một plugin nâng cao cho phép tạo các mẫu văn bản với các biến có thể điền vào.

MỤC LỤC
---------
1.  Mục đích và Usecase
2.  Phân tích Schema và Luồng Dữ liệu
3.  Phân tích Luồng Render trên UI (`uiRender.ts`)
    3.1. Chế độ Designer: Soạn thảo Mẫu
    3.2. Chế độ Form: Điền vào Biến (Kỹ thuật cốt lõi)
4.  Phân tích Luồng Render trên PDF (`pdfRender.ts`)
5.  Phân tích Bảng Thuộc tính (`propPanel.ts`)
    5.1. Widget tùy chỉnh `mapDynamicVariables`
    5.2. Đồng bộ hóa Biến tự động
6.  Phân tích các Hàm Hỗ trợ (`helper.ts`)
7.  Tổng kết các Kỹ thuật và Event chính

----------------------------------------------------------------------
1. MỤC ĐÍCH VÀ USECASE
----------------------------------------------------------------------

Plugin MVT cho phép người dùng tạo ra các khối văn bản có chứa các "placeholder" hoặc "biến" (variables), được định nghĩa bằng cú pháp dấu ngoặc nhọn `{}`.

-   **Usecase chính:**
    -   Tạo các mẫu thư, hợp đồng, chứng chỉ nơi các thông tin như tên, ngày tháng, địa chỉ cần được điền động. Ví dụ: "Kính gửi ông/bà {ho_ten}, hợp đồng này được ký vào ngày {ngay_ky}."
    -   Tách biệt giữa việc thiết kế layout (bởi designer) và việc nhập liệu (bởi người dùng cuối).
-   **Đặc điểm:**
    -   Cung cấp trải nghiệm chỉnh sửa khác nhau cho `designer` và `form`.
    -   Tự động phát hiện và quản lý danh sách các biến.
    -   Cho phép người dùng cuối chỉ chỉnh sửa nội dung của các biến, bảo vệ phần văn bản tĩnh của mẫu.

----------------------------------------------------------------------
2. PHÂN TÍCH SCHEMA VÀ LUỒNG DỮ LIỆU
----------------------------------------------------------------------

```typescript
export interface MultiVariableTextSchema extends TextSchema {
  text: string;
  variables: string[];
}
```

-   **Kế thừa `TextSchema`:** Tận dụng tất cả các thuộc tính định dạng của plugin `text`.
-   **Luồng dữ liệu khác biệt:**
    -   **`schema.text`**: Lưu trữ chuỗi **mẫu** thô, bao gồm cả các biến. Ví dụ: `"Hello {name}"`.
    -   **`schema.variables`**: Một mảng các tên biến được tự động trích xuất từ `schema.text`. Ví dụ: `['name']`. Mảng này được dùng để tạo giao diện trên `propPanel`.
    -   **`schema.content` (kế thừa)**: **Không** lưu trữ văn bản hiển thị cuối cùng. Thay vào đó, nó lưu trữ một **chuỗi JSON** chứa các giá trị của các biến. Ví dụ: `{"name": "Alice"}`.

=> Sự phân tách này là chìa khóa: `text` là mẫu, `content` là dữ liệu.

----------------------------------------------------------------------
3. PHÂN TÍCH LUỒNG RENDER TRÊN UI (`uiRender.ts`)
----------------------------------------------------------------------

Hàm `uiRender` có logic rẽ nhánh rất rõ ràng dựa trên `mode`.

### 3.1. Chế độ Designer: Soạn thảo Mẫu

-   **Hành vi:** Hoạt động gần giống như một plugin `text` bình thường.
-   **Ủy thác:** Nó gọi `parentUiRender` (tức `text.ui`) và truyền `schema.text` làm `value`. Người dùng có thể chỉnh sửa tự do toàn bộ chuỗi mẫu.
-   **Tự động phát hiện biến (Event `keyup`):**
    -   Đây là một tính năng rất thông minh. Một listener `keyup` được gắn vào `div` `contentEditable`.
    -   Sau mỗi lần gõ phím, nó gọi `countUniqueVariableNames` để đếm số lượng biến duy nhất hiện có trong văn bản.
    -   Nếu số lượng này thay đổi so với lần trước, nó sẽ kích hoạt `onChange({ key: 'text', value: ... })`.
    -   **Tối ưu hóa:** `keyPressShouldBeChecked` được sử dụng để chỉ thực hiện việc kiểm tra này khi người dùng gõ các phím có khả năng thay đổi biến (như `{`, `}`, `Backspace`), tránh chạy regex trên mỗi lần gõ phím mũi tên.
    -   Khi `onChange` được gọi, `propPanel` sẽ được render lại, và widget `mapDynamicVariables` sẽ tự động cập nhật danh sách các ô nhập liệu cho biến.

### 3.2. Chế độ Form: Điền vào Biến (Kỹ thuật cốt lõi)

Đây là phần sáng tạo nhất của plugin.

-   **Điều kiện:** `mode === 'form' && numVariables > 0`.
-   **Kỹ thuật "Inline Editable Spans":**
    1.  Nó không tạo một `div` `contentEditable` duy nhất.
    2.  Thay vào đó, nó gọi `buildStyledTextContainer` để tạo một `div` chứa văn bản tĩnh đã được thay thế biến.
    3.  Sau đó, nó **xóa nội dung** của `div` này và xây dựng lại từ đầu bằng cách lặp qua từng ký tự của chuỗi **mẫu** (`rawText`).
    4.  Nó sử dụng `getVariableIndices` để biết vị trí bắt đầu của mỗi biến.
    5.  **Luồng xây dựng DOM:**
        -   Khi gặp một ký tự văn bản tĩnh, nó tạo một `<span>` bình thường và chèn ký tự đó vào.
        -   Khi gặp vị trí bắt đầu của một biến (ví dụ, tại `rawText[i] === '{'`), nó tạo một `<span>` **đặc biệt**:
            -   `span.style.outline`: Có một đường viền đứt nét để làm nổi bật ô nhập liệu.
            -   `makeElementPlainTextContentEditable(span)`: **Chỉ riêng `span` này** có thể chỉnh sửa.
            -   `span.textContent`: Được điền bằng giá trị của biến đó từ `variables`.
            -   **Event `blur` trên `span`**: Khi người dùng chỉnh sửa xong và rời khỏi `span` này, sự kiện `blur` được kích hoạt. Nó sẽ đọc nội dung mới, cập nhật lại object `variables`, và gọi `onChange({ key: 'content', value: JSON.stringify(variables) })`.
-   **=> Kết quả:** Người dùng cuối chỉ có thể tương tác với các vùng được định nghĩa là biến, trong khi phần còn lại của văn bản được bảo vệ, đảm bảo tính toàn vẹn của mẫu.

----------------------------------------------------------------------
4. PHÂN TÍCH LUỒNG RENDER TRÊN PDF (`pdfRender.ts`)
----------------------------------------------------------------------

-   **Ủy thác cho `text.pdf`**: Logic render PDF cũng được ủy thác hoàn toàn.
-   **Luồng hoạt động:**
    1.  **Validation (`validateVariables`):** Kiểm tra xem `value` (chuỗi JSON) có chứa tất cả các biến được đánh dấu là `required` trong schema hay không. Nếu thiếu, nó sẽ không render gì cả hoặc báo lỗi.
    2.  **Substitution (`substituteVariables`):** Gọi hàm này để thay thế tất cả các placeholder `{...}` trong `schema.text` bằng các giá trị tương ứng từ `value`.
    3.  **Ủy thác:** Gọi `parentPdfRender` (tức `text.pdf`) với chuỗi văn bản đã được thay thế hoàn chỉnh.

----------------------------------------------------------------------
5. PHÂN TÍCH BẢNG THUỘC TÍNH (`propPanel.ts`)
----------------------------------------------------------------------

### 5.1. Widget tùy chỉnh `mapDynamicVariables`

-   Đây là một widget không có giao diện người dùng riêng, mà nó **thao tác trực tiếp DOM** của `propPanel`.
-   **Hành động:**
    1.  Nó tìm một phần tử "placeholder" trong DOM (`#placeholder-dynamic-var`) và ẩn nó đi.
    2.  Nó lặp qua danh sách các biến (`varNames`) đã được phát hiện.
    3.  Với mỗi biến, nó `cloneNode(true)` phần tử placeholder, tạo ra một hàng form mới.
    4.  Nó cập nhật `label` của hàng form mới này thành tên của biến.
    5.  Nó cập nhật `value` của `textarea` trong hàng mới này bằng giá trị mẫu của biến.
    6.  Nó gắn một listener `change` vào `textarea` này. Khi người dùng thay đổi giá trị mẫu, nó sẽ cập nhật `schema.content` (chuỗi JSON).

### 5.2. Đồng bộ hóa Biến tự động

-   **`updateVariablesFromText`**: Hàm này được gọi ngay khi `mapDynamicVariables` chạy.
-   **Nhiệm vụ:** So sánh danh sách các biến tìm thấy trong `schema.text` với các biến đang có trong `schema.content`.
    -   Nếu một biến mới xuất hiện trong `text`, nó sẽ được thêm vào `content` với một giá trị mặc định.
    -   Nếu một biến bị xóa khỏi `text`, nó cũng sẽ bị xóa khỏi `content`.
-   Nếu có bất kỳ thay đổi nào, nó sẽ gọi `changeSchemas` để cập nhật cả `schema.content` và `schema.variables`, đảm bảo toàn bộ hệ thống luôn đồng bộ.

----------------------------------------------------------------------
6. PHÂN TÍCH CÁC HÀM HỖ TRỢ (`helper.ts`)
----------------------------------------------------------------------

-   **`substituteVariables`**: Hàm cốt lõi để thay thế các biến. Nó xử lý việc parse chuỗi JSON và sử dụng RegExp để tìm và thay thế các placeholder. Một chi tiết quan trọng là nó escape các ký tự đặc biệt trong tên biến để đảm bảo RegExp hoạt động chính xác.
-   **`validateVariables`**: Đảm bảo tính toàn vẹn dữ liệu trước khi render PDF.
-   **`getVariableIndices`, `countUniqueVariableNames`**: Các hàm tiện ích sử dụng RegExp để phân tích chuỗi mẫu và trích xuất thông tin về các biến.

----------------------------------------------------------------------
7. TỔNG KẾT CÁC KỸ THUẬT VÀ EVENT CHÍNH
----------------------------------------------------------------------

-   **Events chính trên UI:**
    -   **Designer:** `keyup` để tự động phát hiện thay đổi trong danh sách biến.
    -   **Form:** `blur` trên các `span` `contentEditable` để cập nhật giá trị của từng biến.
-   **Events trong Prop Panel:**
    -   `change` trên các `textarea` của biến để cập nhật dữ liệu mẫu.

-   **Các kỹ thuật nổi bật:**
    -   **Dual-Mode UI:** Cung cấp hai trải nghiệm UI hoàn toàn khác nhau cho `designer` và `form` trong cùng một hàm `uiRender`.
    -   **Inline Editable Regions:** Kỹ thuật tạo các vùng có thể chỉnh sửa ngay trong một dòng văn bản bằng cách sử dụng các `span` `contentEditable` riêng lẻ.
    -   **Automatic Schema Synchronization:** Tự động phân tích `schema.text` để cập nhật `schema.variables` và `schema.content`, tạo ra một luồng dữ liệu liền mạch và tự động.
    -   **Dynamic Prop Panel Generation:** Sử dụng một widget để thao tác DOM và tự động tạo các trường nhập liệu trong `propPanel` dựa trên dữ liệu của schema.
    -   **Clear Data Separation:** Phân tách rõ ràng giữa mẫu (`schema.text`), danh sách biến (`schema.variables`), và dữ liệu của biến (`schema.content`).