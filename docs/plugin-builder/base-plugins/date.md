======================================================================
==   PHÂN TÍCH CHI TIẾT PLUGIN DATE/TIME/DATETIME TRONG PDFME        ==
======================================================================

Tài liệu này phân tích sâu kiến trúc của các plugin `date`, `time`, và `dateTime`. Chúng được tạo ra từ một hàm factory chung, thể hiện một pattern thiết kế hiệu quả.

MỤC LỤC
---------
1.  Mục đích và Usecase
2.  Phân tích Kiến trúc: Factory Pattern (`getPlugin`)
3.  Phân tích Luồng Render trên UI (`ui` function trong `helper.ts`)
    3.1. Tích hợp Thư viện bên ngoài (`air-datepicker`)
    3.2. Quản lý Vòng đời (Lifecycle Management)
    3.3. Xử lý Sự kiện (Events)
4.  Phân tích Luồng Render trên PDF (`pdf` function)
5.  Phân tích Bảng Thuộc tính (`propPanel`)
    5.1. Đa ngôn ngữ và Định dạng
    5.2. Tự động cập nhật Schema
6.  Tổng kết các Kỹ thuật và Event chính

----------------------------------------------------------------------
1. MỤC ĐÍCH VÀ USECASE
----------------------------------------------------------------------

Nhóm plugin này cung cấp một giao diện người dùng thân thiện để nhập liệu ngày, giờ, hoặc cả hai.

-   **Usecase chính:** Dùng cho các trường như "Ngày sinh", "Thời gian hẹn", "Ngày ký",... giúp đảm bảo dữ liệu nhập vào luôn đúng định dạng và hợp lệ.
-   **Đặc điểm:**
    -   **Trải nghiệm người dùng tốt:** Thay vì bắt người dùng gõ tay, nó hiển thị một popup chọn ngày/giờ trực quan.
    -   **Đa ngôn ngữ:** Hỗ trợ nhiều ngôn ngữ cho giao diện date picker.
    -   **Định dạng linh hoạt:** Cho phép người thiết kế tùy chỉnh định dạng hiển thị của ngày/giờ.
    -   **Tái sử dụng code:** Cả ba plugin (`date`, `time`, `dateTime`) đều được tạo ra từ cùng một logic trong `helper.ts`.

----------------------------------------------------------------------
2. PHÂN TÍCH KIẾN TRÚC: FACTORY PATTERN (`getPlugin`)
----------------------------------------------------------------------

Đây là điểm cốt lõi trong kiến trúc của nhóm plugin này.

-   **`date.ts`, `time.ts`, `dateTime.ts`:** Các file này cực kỳ đơn giản. Chúng chỉ định nghĩa `type` và `icon` riêng, sau đó gọi hàm `getPlugin` từ `helper.ts` và export kết quả.

    ```typescript
    // Ví dụ trong date.ts
    const type = 'date';
    const icon = createSvgStr(Calendar);
    export default getPlugin({ type, icon });
    ```

-   **`helper.ts` -> `getPlugin({ type, icon })`**:
    -   Đây là một **Factory Function**. Nó nhận `type` ('date', 'time', 'dateTime') và `icon` làm tham số.
    -   Bên trong, nó trả về một đối tượng `Plugin` hoàn chỉnh (`{ ui, pdf, propPanel, icon }`).
    -   Toàn bộ logic phức tạp của cả ba plugin được định nghĩa **một lần duy nhất** bên trong hàm này.
    -   Biến `type` được sử dụng bên trong các hàm `ui`, `pdf`, `propPanel` để điều chỉnh hành vi cho phù hợp (ví dụ: có hiển thị time picker hay không, định dạng mặc định là gì).

**=> Lợi ích:** Tránh lặp lại hàng trăm dòng code. Nếu cần sửa lỗi hoặc thêm tính năng, chỉ cần sửa ở một nơi duy nhất là `helper.ts`.

----------------------------------------------------------------------
3. PHÂN TÍCH LUỒNG RENDER TRÊN UI (`ui` function trong `helper.ts`)
----------------------------------------------------------------------

Logic UI là sự kết hợp giữa plugin `text` và thư viện `air-datepicker`.

### 3.1. Tích hợp Thư viện bên ngoài (`air-datepicker`)

1.  **Hiển thị văn bản:** Giống như plugin `select`, bước đầu tiên là gọi `await text.ui({ ..., mode: 'viewer' })` để hiển thị giá trị ngày/giờ đã được định dạng như một khối văn bản tĩnh.
2.  **Nhúng CSS:** Hàm `injectStyles` được gọi để chèn CSS của `air-datepicker` vào `<head>` của trang. Nó kiểm tra `styleElementId` để đảm bảo CSS chỉ được nhúng một lần.
3.  **Khởi tạo Datepicker:**
    -   Tạo một `<input>` ẩn (`visibility: 'hidden'`). Thư viện `air-datepicker` yêu cầu một phần tử input để gắn vào.
    -   Khởi tạo `new AirDatepicker(input, { ...options })`.
    -   Các tùy chọn quan trọng được cấu hình dựa trên `type` và `schema`:
        -   `locale`: Lấy từ `LOCALE_MAP` để hỗ trợ đa ngôn ngữ.
        -   `timepicker`: Bật/tắt dựa trên `type !== 'date'`.
        -   `onlyTimepicker`: Bật khi `type === 'time'`.
        -   `dateFormat`: Một hàm tùy chỉnh sử dụng `date-fns` để format ngày/giờ theo `schema.format`.
        -   `buttons`: Cấu hình các nút (Cancel, Clear, Set) và dịch chúng bằng `i18n`.

### 3.2. Quản lý Vòng đời (Lifecycle Management)

-   **Vấn đề:** Khi một schema bị xóa khỏi trình thiết kế, đối tượng `airDatepicker` vẫn tồn tại trong bộ nhớ, gây ra memory leak.
-   **Giải pháp:**
    1.  Plugin phát một sự kiện tùy chỉnh `beforeRemoveEvent` trên `rootElement` của chính nó.
    2.  Nó cũng đăng ký một listener cho chính sự kiện này: `rootElement.addEventListener('beforeRemove', ...)`
    3.  Khi schema sắp bị xóa, `pdfme` sẽ dọn dẹp `rootElement`, nhưng trước đó, listener này được kích hoạt.
    4.  Bên trong listener, nó gọi `airDatepicker.destroy()` để dọn dẹp sạch sẽ đối tượng datepicker và các event listener liên quan của nó.

### 3.3. Xử lý Sự kiện (Events)

-   **`click` trên `textElement`**:
    -   Khi người dùng nhấp vào khối văn bản hiển thị ngày/giờ.
    -   Hành động: Gọi `airDatepicker.show()` để mở popup chọn ngày/giờ.

-   **`onSelect` của `AirDatepicker`**:
    -   Đây là callback được cung cấp bởi thư viện `air-datepicker`, được kích hoạt khi người dùng chọn một ngày.
    -   **Hành động:**
        -   Nó gọi hàm `commitChange`, hàm này sẽ format ngày đã chọn về định dạng lưu trữ chuẩn (`yyyy/MM/dd HH:mm`) bằng `getFmtContent`.
        -   Sau đó, nó gọi `onChange({ key: 'content', value: ... })` để cập nhật state.
        -   Đối với `type: 'date'`, việc chọn ngày sẽ tự động đóng popup và commit thay đổi. Đối với `time` và `dateTime`, người dùng phải nhấn nút "Set".

----------------------------------------------------------------------
4. PHÂN TÍCH LUỒNG RENDER TRÊN PDF (`pdf` function)
----------------------------------------------------------------------

-   **Ủy thác cho `text.pdf`**: Giống như các plugin wrapper khác, nó không có logic render PDF riêng.
-   **Luồng hoạt động:**
    1.  Kiểm tra nếu `value` rỗng thì không làm gì.
    2.  Gọi `getFmtValue` để chuyển đổi `value` (dạng `yyyy/MM/dd`) thành chuỗi hiển thị cuối cùng dựa trên `schema.format` và `schema.locale`.
    3.  Gọi `text.pdf` với chuỗi đã được format này. Plugin `text` sẽ xử lý phần còn lại (nhúng font, vẽ văn bản, v.v.).

----------------------------------------------------------------------
5. PHÂN TÍCH BẢNG THUỘC TÍNH (`propPanel`)
----------------------------------------------------------------------

Bảng thuộc tính cho phép tùy chỉnh sâu về định dạng và ngôn ngữ.

### 5.1. Đa ngôn ngữ và Định dạng

-   **`format`**: Một trường input cho phép người thiết kế nhập chuỗi định dạng theo chuẩn của `date-fns`.
    -   **Validation:** Có một rule `validator` tùy chỉnh (`validateDateTimeFormat`) để kiểm tra xem chuỗi định dạng người dùng nhập có hợp lệ không bằng cách thử `format` một ngày mẫu.
-   **`locale`**: Một `select` box cho phép chọn ngôn ngữ từ `LOCALE_MAP`. Việc thay đổi `locale` sẽ ảnh hưởng đến cả giao diện của `air-datepicker` và cách `date-fns` format chuỗi ngày/giờ.

### 5.2. Tự động cập nhật Schema

-   **Kỹ thuật:** Bên trong hàm `schema` của `propPanel`, có một đoạn code kiểm tra:

    ```typescript
    if (activeSchema.locale === undefined && activeSchema.locale !== options.lang) {
      changeSchemas([...]);
    }
    ```

-   **Mục đích:** Khi một schema date mới được thêm vào, `locale` của nó sẽ là `undefined`. Đoạn code này sẽ phát hiện điều đó và tự động cập nhật `schema.locale` theo ngôn ngữ chung của ứng dụng (`options.lang`). Đồng thời, nó cũng cập nhật `schema.format` theo định dạng mặc định của ngôn ngữ đó.
-   **=> Lợi ích:** Cải thiện trải nghiệm người dùng thiết kế, họ không cần phải tự tay chọn ngôn ngữ cho mỗi schema mới.

----------------------------------------------------------------------
6. TỔNG KẾT CÁC KỸ THUẬT VÀ EVENT CHÍNH
----------------------------------------------------------------------

-   **Events chính trên UI:**
    -   `click` trên `textElement`: Mở datepicker.
    -   `onSelect` (callback của `air-datepicker`): Bắt giá trị người dùng chọn và cập nhật state.
    -   `beforeRemove` (sự kiện tùy chỉnh): Dùng để quản lý vòng đời và dọn dẹp tài nguyên.

-   **Các kỹ thuật nổi bật:**
    -   **Factory Pattern:** Sử dụng hàm `getPlugin` để tạo ra ba plugin từ một nguồn logic duy nhất, giảm lặp code tối đa.
    -   **Third-Party Library Integration:** Tích hợp mượt mà với `air-datepicker` và `date-fns` để cung cấp chức năng phức tạp.
    -   **Dynamic CSS Injection:** Tự động chèn CSS của thư viện bên ngoài vào trang một cách an toàn.
    -   **Lifecycle Management:** Sử dụng sự kiện tùy chỉnh để gọi phương thức `destroy` của thư viện, ngăn ngừa memory leak.
    -   **Data Formatting & Transformation:** Phân biệt rõ ràng giữa định dạng dữ liệu lưu trữ (`content`) và định dạng dữ liệu hiển thị (`format`), và xử lý chuyển đổi giữa chúng.
    -   **Proactive Schema Update:** Tự động cập nhật `locale` và `format` trong `propPanel` để cải thiện trải nghiệm người dùng.