Chắc chắn rồi. Sau khi đã có các block cho câu hỏi trắc nghiệm và điền từ, "mảnh ghép" quan trọng tiếp theo trong bộ công cụ giáo dục là một block cho câu hỏi tự luận. Vì vậy, lựa chọn số 3 của tôi là:

**Plugin "Khung trả lời có dòng kẻ" (LinedAnswerBox).**

Đây là lựa chọn chiến lược tiếp theo vì:

1.  **Hoàn thiện bộ câu hỏi cơ bản:** Cùng với trắc nghiệm và điền từ, tự luận là dạng bài tập không thể thiếu, giúp Docubrand trở thành một công cụ soạn thảo toàn diện.
2.  **Yêu cầu tạo Custom Plugin thực sự:** Không giống như "MultipleChoiceQuestion" (là sự tổ hợp), block này đòi hỏi bạn phải tạo một plugin mới thực sự. Nó sẽ rèn luyện kỹ năng tùy biến sâu hơn vào các hàm `ui` và `pdf` render.
3.  **Tổ hợp các plugin cơ sở:** Mặc dù là một plugin mới, nó vẫn được xây dựng bằng cách "đứng trên vai những người khổng lồ" - kết hợp sức mạnh của `text` và `line` (hoặc `rectangle`).
4.  **Giá trị thẩm mỹ và thực tiễn cao:** Cung cấp một vùng nhập liệu có dòng kẻ không chỉ giúp bài làm của học sinh trông sạch đẹp, dễ đọc hơn mà còn là một tính năng mà các công cụ soạn thảo văn bản thông thường khó có thể làm tốt.

---

### Phân tích Chi tiết Kế hoạch Triển khai Plugin "LinedAnswerBox"

Đây là kế hoạch chi tiết để bạn tạo ra một plugin mới từ đầu, nhưng vẫn dựa trên các kỹ thuật đã có.

#### 1. Mục tiêu & Trải nghiệm người dùng cuối cùng

*   **Giáo viên (Designer Mode):**
    *   Kéo block "Khung Tự luận" vào trang.
    *   Có thể thay đổi kích thước của toàn bộ khung (width, height).
    *   Trong `propPanel`, có thể điều chỉnh các thuộc tính như:
        *   `lineSpacing`: Khoảng cách giữa các dòng kẻ.
        *   `lineColor`: Màu của dòng kẻ.
        *   `padding`: Khoảng đệm giữa lề của khung và các dòng kẻ.
*   **Học sinh (Form Mode):**
    *   Nhìn thấy một khung với các dòng kẻ ngang bên trong.
    *   Nhấp vào khung và bắt đầu gõ. Con trỏ và văn bản sẽ tự động nằm trên các dòng kẻ.
    *   Khi gõ xuống dòng, văn bản sẽ tự động chuyển sang dòng kẻ tiếp theo.

#### 2. Cấu trúc File và Schema

1.  **Tạo file mới:** `plugin/linedAnswerBox/index.ts` (và các file liên quan).
2.  **Định nghĩa Schema:**
    *   **Kỹ thuật:** Kế thừa từ `TextSchema` để tận dụng tất cả các thuộc tính định dạng văn bản (font, size, color...).
    *   Thêm các thuộc tính mới dành riêng cho việc vẽ dòng kẻ.

    ```typescript
    // trong file types.ts của plugin mới
    import { TextSchema } from '../text/types.js';

    export interface LinedAnswerBoxSchema extends TextSchema {
      lineSpacing: number; // Khoảng cách giữa các dòng, tính bằng mm
      lineColor: string;
      padding: number; // Khoảng đệm trên/dưới/trái/phải, tính bằng mm
    }
    ```

#### 3. Triển khai `ui` function (Tổ hợp DOM Elements)

Đây là nơi bạn sẽ kết hợp các lớp DOM để tạo ra hiệu ứng mong muốn.

1.  **Cấu trúc DOM:** `rootElement` của plugin sẽ chứa:
    *   Một `div` ngoài cùng (`container`) để định vị.
    *   Một `div` chứa các dòng kẻ (`linesContainer`), nằm ở lớp dưới cùng.
    *   Một `div` `contentEditable` (từ `text.ui`), nằm ở lớp trên cùng, có nền trong suốt.

2.  **Triển khai:**
    *   **Bước 1: Gọi `text.ui` để tạo lớp nhập liệu:**
        *   **Kỹ thuật:** Gọi `await text.ui(arg)` nhưng với một vài `schema` được ghi đè.
        *   **Ghi đè quan trọng:**
            *   `backgroundColor: 'transparent'`: Để có thể nhìn thấy các dòng kẻ bên dưới.
            *   `lineHeight`: **Đây là điểm mấu chốt.** `lineHeight` (tính bằng `em`) phải được tính toán để khớp chính xác với `lineSpacing` (tính bằng `mm`). Bạn sẽ cần một hàm chuyển đổi: `const lineHeightInEm = mm2pt(schema.lineSpacing) / schema.fontSize;`. Ghi đè `schema.lineHeight = lineHeightInEm;` trước khi gọi `text.ui`.
            *   `padding`: Ghi đè `padding` của `text.ui` để nó không có padding riêng.

    *   **Bước 2: Vẽ các dòng kẻ:**
        *   Sau khi `text.ui` đã chạy xong, bạn sẽ có `div` nhập liệu.
        *   **Kỹ thuật:** Viết một hàm `drawUiLines(rootElement, schema)`.
        *   **Bên trong `drawUiLines`:**
            1.  Tạo một `div` `linesContainer` với `position: 'absolute'`, `top: 0`, `left: 0`, `width: '100%'`, `height: '100%'`, `zIndex: -1` (để nằm dưới lớp text).
            2.  Tính toán số lượng dòng kẻ cần vẽ: `const numLines = Math.floor((schema.height - schema.padding * 2) / schema.lineSpacing);`.
            3.  Dùng một vòng lặp `for` từ `0` đến `numLines`.
            4.  Trong mỗi vòng lặp, tạo một `div` dòng kẻ:
                *   `position: 'absolute'`
                *   `width: \`calc(100% - ${schema.padding * 2}mm)\``
                *   `height: '0px'`
                *   `borderTop: \`1px solid ${schema.lineColor}\``
                *   `left: \`${schema.padding}mm\``
                *   `top: \`${schema.padding + i * schema.lineSpacing}mm\``
            5.  `appendChild` các `div` dòng kẻ này vào `linesContainer`, và `appendChild` `linesContainer` vào `rootElement`.

#### 4. Triển khai `pdf` function (Tổ hợp lệnh vẽ PDF)

Logic tương tự như `ui`, nhưng với các lệnh vẽ của `pdf-lib`.

1.  **Bước 1: Vẽ các dòng kẻ:**
    *   **Kỹ thuật:** Viết một hàm `drawPdfLines(page, schema)`.
    *   **Bên trong `drawPdfLines`:**
        1.  Tính toán số lượng và vị trí các dòng kẻ như trong UI.
        2.  Dùng một vòng lặp `for`.
        3.  Trong mỗi vòng lặp, gọi `page.drawLine({ start: {x, y}, end: {x, y}, ... })` để vẽ một đường kẻ ngang. Tọa độ `x`, `y` được tính toán dựa trên `schema.position`, `schema.padding`, và `i * schema.lineSpacing`.

2.  **Bước 2: Vẽ văn bản của người dùng:**
    *   **Kỹ thuật:** Gọi `await text.pdf(arg)` với `schema` đã được ghi đè `lineHeight` và `backgroundColor: 'transparent'` (giống như trong `ui`).
    *   `text.pdf` sẽ vẽ văn bản của người dùng lên trên các dòng kẻ đã được vẽ ở bước 1.

#### 5. Triển khai `propPanel`

1.  **Kế thừa:** Kế thừa `propPanel` từ `text` để có các tùy chọn về font, size, color...
2.  **Loại bỏ thuộc tính không cần thiết:** `lineHeight` của `text` giờ được điều khiển bởi `lineSpacing`, vì vậy bạn nên ẩn hoặc loại bỏ nó khỏi `propPanel` để tránh gây nhầm lẫn cho người dùng.
3.  **Thêm các thuộc tính mới:**
    *   **Kỹ thuật:** Chỉnh sửa hàm `schema` của `propPanel` để thêm các widget mới.
    *   **Các widget cần thêm:**
        *   `lineSpacing`: `inputNumber` widget.
        *   `lineColor`: `color` widget.
        *   `padding`: `inputNumber` widget.

#### 6. Tổng kết Lộ trình và Kỹ thuật Tái sử dụng

| Bước | Nhiệm vụ | Plugin/Kỹ thuật Tái sử dụng | Ghi chú |
| :--- | :--- | :--- | :--- |
| **1. Schema** | Định nghĩa `LinedAnswerBoxSchema` | Kế thừa `TextSchema` | Thêm `lineSpacing`, `lineColor`, `padding` |
| **2. UI** | Tạo lớp nhập liệu | Gọi `text.ui` với `backgroundColor` trong suốt và `lineHeight` được tính toán lại |
| **3. UI** | Vẽ các dòng kẻ | Tạo các `div` với `border-top` và `position: absolute` | Logic mới |
| **4. PDF** | Vẽ các dòng kẻ | Vòng lặp gọi `page.drawLine` | Tái sử dụng `line` plugin (về mặt khái niệm) |
| **5. PDF** | Vẽ văn bản trả lời | Gọi `text.pdf` với `backgroundColor` trong suốt và `lineHeight` được tính toán lại |
| **6. Prop Panel** | Cung cấp tùy chọn | Kế thừa `text.propPanel`, thêm các widget cho `lineSpacing`, `lineColor`, `padding` |
| **7. Đồng bộ** | Đảm bảo text khớp với dòng kẻ | **Kỹ thuật cốt lõi:** Tính toán `lineHeight` (em) từ `lineSpacing` (mm) và `fontSize` (pt) |

Plugin này là một bài tập tuyệt vời để bạn đi sâu hơn vào việc tạo ra các plugin tùy chỉnh, kết hợp cả việc render DOM phức tạp trên UI và thực hiện các lệnh vẽ trực tiếp lên PDF, trong khi vẫn tận dụng được sức mạnh của các plugin cơ sở.