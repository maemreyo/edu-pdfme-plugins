======================================================================
==   PHÂN TÍCH CHI TIẾT PLUGIN SHAPES (LINE, RECTANGLE, ELLIPSE)     ==
======================================================================

Tài liệu này phân tích sâu kiến trúc và luồng hoạt động của các plugin hình khối cơ bản: `line`, `rectangle`, và `ellipse`.

MỤC LỤC
---------
1.  Mục đích và Usecase
2.  Kiến trúc chung: Factory Pattern cho Rectangle và Ellipse
3.  **Plugin `rectangle` và `ellipse` (`rectAndEllipse.ts`)**
    3.1. Phân tích Schema
    3.2. Phân tích Luồng Render trên UI (`ui` function)
    3.3. Phân tích Luồng Render trên PDF (`pdf` function)
4.  **Plugin `line` (`line.ts`)**
    4.1. Phân tích Schema
    4.2. Phân tích Luồng Render trên UI (`ui` function)
    4.3. Phân tích Luồng Render trên PDF (`pdf` function)
5.  Tổng kết các Kỹ thuật chính

----------------------------------------------------------------------
1. MỤC ĐÍCH VÀ USECASE
----------------------------------------------------------------------

Nhóm plugin này cung cấp các công cụ để vẽ các hình khối hình học cơ bản lên tài liệu.

-   **Usecase chính:**
    -   **`line`**: Tạo các đường kẻ ngang, dọc để phân chia các phần của tài liệu, gạch chân thủ công, hoặc làm nền cho các plugin khác (như trong `cell` của `table`).
    -   **`rectangle`**: Tạo các khung, hộp, vùng nền màu, hoặc các khối trang trí.
    -   **`ellipse`**: Tạo các hình tròn, oval để làm nổi bật hoặc trang trí.
-   **Đặc điểm:** Các plugin này thường không chứa nội dung văn bản, chúng là các yếu tố đồ họa thuần túy. Chúng là nền tảng cho nhiều plugin phức tạp hơn.

----------------------------------------------------------------------
2. KIẾN TRÚC CHUNG: FACTORY PATTERN CHO RECTANGLE VÀ ELLIPSE
----------------------------------------------------------------------

-   **`rectAndEllipse.ts`**: File này chứa một đối tượng plugin gốc tên là `shape`. Đối tượng này chứa toàn bộ logic chung cho cả hình chữ nhật và hình elip.
-   **Factory Function (`getPropPanelSchema`)**: Hàm này nhận `type` ('rectangle' hoặc 'ellipse') và trả về một đối tượng `propPanel` hoàn chỉnh, trong đó `defaultSchema.type` được đặt tương ứng.
-   **Export cuối cùng:**
    -   `rectangle` và `ellipse` được export ra như hai đối tượng riêng biệt.
    -   Cả hai đều "trải" (`...shape`) toàn bộ logic từ đối tượng `shape` gốc.
    -   Chúng chỉ ghi đè lại `propPanel` và `icon` bằng kết quả từ `getPropPanelSchema` và icon tương ứng.
-   **=> Lợi ích:** Tái sử dụng tối đa code cho hai plugin có logic rất giống nhau, chỉ khác ở cách vẽ cuối cùng và một vài thuộc tính.

----------------------------------------------------------------------
3. PLUGIN `RECTANGLE` VÀ `ELLIPSE` (`rectAndEllipse.ts`)
----------------------------------------------------------------------

### 3.1. Phân tích Schema

```typescript
interface ShapeSchema extends Schema {
  type: 'ellipse' | 'rectangle';
  borderWidth: number;
  borderColor: string;
  color: string; // Màu nền
  radius?: number; // Chỉ dùng cho rectangle
}
```
-   Schema đơn giản, chứa các thuộc tính style cơ bản: `borderWidth`, `borderColor` (màu viền), `color` (màu nền), và `radius` (độ bo góc cho hình chữ nhật).

### 3.2. Phân tích Luồng Render trên UI (`ui` function)

-   Logic render trên UI rất trực quan, sử dụng các thuộc tính CSS để mô phỏng lại hình dạng.
-   Nó tạo một `div` duy nhất.
-   **`border-radius`**:
    -   Nếu `schema.type === 'ellipse'`, nó đặt `border-radius: '50%'` để tạo hình elip/tròn.
    -   Nếu là `rectangle` và có `schema.radius`, nó đặt `border-radius: \`${schema.radius}mm\`` để tạo góc bo tròn.
-   **`border`**: Các thuộc tính `borderWidth`, `borderStyle`, `borderColor` được sử dụng để vẽ đường viền.
-   **`background-color`**: Được sử dụng để tô màu nền cho hình khối.

### 3.3. Phân tích Luồng Render trên PDF (`pdf` function)

-   **Điều kiện:** Nếu không có cả `color` và `borderColor`, plugin sẽ không vẽ gì cả để tối ưu.
-   **Chuẩn bị:**
    -   Gọi `convertForPdfLayoutProps` để lấy các thuộc tính vị trí, kích thước đã được chuyển đổi sang hệ tọa độ PDF.
    -   Một chi tiết thú vị: nó gọi `convertForPdfLayoutProps` hai lần. Lần đầu (`position`) có áp dụng hiệu ứng xoay, dùng cho `rectangle`. Lần thứ hai (`x4Ellipse`, `y4Ellipse`) không áp dụng hiệu ứng xoay, vì hàm `drawEllipse` của `pdf-lib` nhận tâm (`x`, `y`) và bán kính (`xScale`, `yScale`) làm tham số, và việc xoay được xử lý riêng bởi tùy chọn `rotate`.
-   **Vẽ hình:**
    -   **`ellipse`**: Gọi `page.drawEllipse`. Tọa độ tâm được tính là `x + width / 2`, `y + height / 2`. Bán kính (`xScale`, `yScale`) được tính bằng một nửa chiều rộng/cao trừ đi một nửa độ dày đường viền để đường viền nằm gọn trong kích thước của schema.
    -   **`rectangle`**: Gọi `page.drawRectangle`.
        -   **Xử lý `borderWidth` khi xoay:** Đây là một công thức toán hình học phức tạp. Khi một hình chữ nhật có viền được xoay, vị trí của vùng tô màu bên trong sẽ bị dịch chuyển. Các công thức `borderWidth * ((1 - Math.sin(...)) / 2) + ...` là để tính toán sự dịch chuyển này và đảm bảo hình chữ nhật được vẽ chính xác tại vị trí mong muốn.
        -   `width` và `height` của vùng vẽ cũng được giảm đi `borderWidth` để đường viền không làm hình bị to ra.
        -   Nếu có `radius`, nó sẽ được thêm vào tùy chọn vẽ.

----------------------------------------------------------------------
4. PLUGIN `LINE` (`line.ts`)
----------------------------------------------------------------------

Plugin `line` đơn giản hơn nhưng có logic vẽ PDF đặc thù.

### 4.1. Phân tích Schema

```typescript
interface LineSchema extends Schema {
  color: string;
}
```
-   Schema rất đơn giản, chỉ có `color` cho đường kẻ.
-   **Ngụ ý:** `width` của schema đại diện cho chiều dài của đường kẻ, và `height` đại diện cho **độ dày** của đường kẻ.

### 4.2. Phân tích Luồng Render trên UI (`ui` function)

-   Cực kỳ đơn giản: tạo một `div` và đặt `background-color` của nó bằng `schema.color`. `width` và `height` của `div` sẽ tự động theo `schema.width` và `schema.height`, tạo ra một hình chữ nhật mỏng chính là đường kẻ.

### 4.3. Phân tích Luồng Render trên PDF (`pdf` function)

-   Sử dụng hàm `page.drawLine` của `pdf-lib`.
-   **Tính toán điểm đầu và cuối:**
    -   `drawLine` yêu cầu tọa độ điểm bắt đầu (`start`) và kết thúc (`end`).
    -   Plugin định nghĩa một đường kẻ ngang ảo có tọa độ:
        -   `start`: `{ x, y: y + height / 2 }` (điểm giữa cạnh trái)
        -   `end`: `{ x: x + width, y: y + height / 2 }` (điểm giữa cạnh phải)
    -   **Xử lý xoay:** Nó không truyền trực tiếp góc xoay cho `drawLine`. Thay vào đó, nó dùng hàm `rotatePoint` để **xoay tọa độ của điểm `start` và `end`** quanh tâm của schema (`pivot`). Kết quả là hai điểm đã được xoay, sau đó được truyền vào `page.drawLine`.
-   **Độ dày (`thickness`):** Độ dày của đường kẻ được lấy từ `height` của schema (đã được chuyển sang `pt`).

----------------------------------------------------------------------
5. TỔNG KẾT CÁC KỸ THUẬT CHÍNH
----------------------------------------------------------------------

-   **CSS-based UI Rendering:** Các hình khối trên UI được mô phỏng hoàn toàn bằng các thuộc tính CSS cơ bản (`background-color`, `border`, `border-radius`), rất hiệu quả và đơn giản.
-   **Direct PDFLib Drawing:** Các plugin này là lớp trừu tượng mỏng, gọi trực tiếp các hàm vẽ gốc của `pdf-lib` (`drawRectangle`, `drawEllipse`, `drawLine`).
-   **Factory Pattern:** Tái sử dụng code hiệu quả cho `rectangle` và `ellipse` bằng cách định nghĩa một plugin `shape` chung.
-   **Advanced Rotation Geometry:** Xử lý toán hình học phức tạp để đảm bảo việc xoay các hình khối có đường viền (`rectangle`) hoặc các đường kẻ (`line`) được chính xác trên PDF.
-   **Schema Property Mapping:** Ánh xạ các thuộc tính của schema một cách thông minh, ví dụ: `schema.height` của `line` được ánh xạ thành `thickness` trong `page.drawLine`.