Nếu phải chọn một plugin đầu tiên để phát triển, mang lại giá trị cốt lõi và là nền tảng cho các tính năng khác, tôi sẽ chọn:

**Plugin "Điền vào chỗ trống" (FillInTheBlank).**

Đây là lựa chọn chiến lược vì những lý do sau:

1.  **Tính ứng dụng cao:** Là một trong những dạng bài tập phổ biến nhất trong giáo dục, từ mầm non đến đại học.
2.  **Tận dụng trực tiếp MVT:** Nó là một "wrapper" gần như hoàn hảo của `multiVariableText`, cho phép bạn thực hành kỹ thuật kế thừa và tùy biến plugin một cách rõ ràng nhất.
3.  **Rủi ro kỹ thuật thấp:** Không yêu cầu logic backend phức tạp hay tích hợp API bên ngoài. Toàn bộ logic có thể được xử lý ở phía client.
4.  **Nền tảng cho các block khác:** Sau khi hoàn thành, bạn có thể ngay lập tức sử dụng plugin này bên trong các block phức tạp hơn như "Sơ đồ có Chú thích" hay "Câu hỏi Đúng/Sai với Giải thích".

---

### Phân tích Chi tiết Kế hoạch Triển khai Plugin "FillInTheBlank"

Dưới đây là lộ trình chi tiết, từng bước một, để bạn có thể follow và triển khai, tập trung vào việc tái sử dụng các kỹ thuật đã có.

#### 1. Mục tiêu & Trải nghiệm người dùng cuối cùng

*   **Giáo viên (Designer Mode):**
    *   Kéo một block "FillInTheBlank" vào trang.
    *   Gõ văn bản và dùng cú pháp `{ten_bien}` để tạo ra các chỗ trống. Ví dụ: "Con mèo kêu {tieng_keu}, còn con chó thì kêu {tieng_keu_khac}."
    *   Trong `propPanel`, có thể chọn style cho ô trống (ví dụ: `underline` hoặc `box`).
*   **Học sinh (Form Mode):**
    *   Nhìn thấy câu văn với các ô trống có gạch chân hoặc đóng khung.
    *   Nhấp trực tiếp vào ô trống và gõ câu trả lời.
    *   Phần văn bản tĩnh không thể chỉnh sửa.

#### 2. Cấu trúc File và Schema

1.  **Tạo file mới:** `plugin/fillInTheBlank/index.ts` (và các file helper nếu cần).
2.  **Định nghĩa Schema:**
    *   Kế thừa hoàn toàn từ `MultiVariableTextSchema`. Bạn có thể thêm một thuộc tính mới để tùy chỉnh giao diện.
    *   **Kỹ thuật:** Sử dụng `interface` của TypeScript để kế thừa.

    ```typescript
    // trong file types.ts của plugin mới
    import { MultiVariableTextSchema } from '../multiVariableText/types.js';

    export interface FillInTheBlankSchema extends MultiVariableTextSchema {
      blankStyle?: 'underline' | 'box'; // Thuộc tính mới, không bắt buộc
    }
    ```

#### 3. Triển khai `ui` function (Trái tim của plugin)

Đây là nơi bạn sẽ tùy biến nhiều nhất.

1.  **Kế thừa và Rẽ nhánh:**
    *   Cấu trúc hàm `ui` của bạn sẽ giống hệt `multiVariableText/uiRender.ts`.
    *   Nó sẽ kiểm tra `mode`. Nếu là `designer`, nó sẽ gọi `multiVariableText.ui` để có trải nghiệm soạn thảo mẫu y hệt.
    *   Nếu là `form`, nó sẽ gọi một hàm tùy chỉnh `formUiRenderForBlanks` thay vì hàm gốc.

2.  **Triển khai `formUiRenderForBlanks`:**
    *   **Tái sử dụng:** Copy và paste toàn bộ hàm `formUiRender` từ `multiVariableText/uiRender.ts`. Đây là điểm khởi đầu của bạn.
    *   **Kỹ thuật cần tùy biến:** Tìm đến đoạn code tạo ra `span` `contentEditable` cho mỗi biến.

    ```typescript
    // Đoạn code gốc trong MVT
    let span = document.createElement('span');
    span.style.outline = `${theme.colorPrimary} dashed 1px`; // <- SẼ THAY ĐỔI DÒNG NÀY
    makeElementPlainTextContentEditable(span);
    // ...
    ```

    *   **Tùy biến Style:** Thay đổi cách style cho `span` này dựa trên `schema.blankStyle`.
        *   **Tái sử dụng `isEditable` và `makeElementPlainTextContentEditable`:** Các hàm này được giữ nguyên.
        *   **Logic mới:**

        ```typescript
        let span = document.createElement('span');
        makeElementPlainTextContentEditable(span); // Tái sử dụng
        span.textContent = variables[variableIndices[i]];

        // Logic style mới
        span.style.display = 'inline-block'; // Cần thiết để min-width hoạt động
        span.style.minWidth = '50px'; // Đảm bảo ô trống không quá nhỏ
        span.style.textAlign = 'center';
        span.style.verticalAlign = 'bottom'; // Giúp text nằm trên đường kẻ

        if (schema.blankStyle === 'box') {
            span.style.border = '1px solid #999';
            span.style.borderRadius = '3px';
            span.style.padding = '0 4px';
        } else { // Mặc định là 'underline'
            span.style.borderBottom = '1px solid black';
            span.style.outline = 'none'; // Bỏ outline mặc định
        }

        // Gắn event listener y hệt như MVT
        span.addEventListener('blur', (e: Event) => {
            // ... logic cập nhật value y hệt
        });
        textBlock.appendChild(span);
        ```

#### 4. Triển khai `pdf` function

*   **Kỹ thuật:** **Ủy thác hoàn toàn.** Bạn không cần viết bất kỳ logic render PDF nào.
*   **Triển khai:**

    ```typescript
    // trong plugin/fillInTheBlank/index.ts
    import { pdfRender as parentPdfRender } from '../multiVariableText/pdfRender.js';

    const schema: Plugin<FillInTheBlankSchema> = {
        // ...
        pdf: parentPdfRender, // Xong!
        // ...
    };
    ```
*   **Lý do:** Hàm `pdfRender` của MVT đã làm chính xác những gì bạn cần: nó lấy `schema.text` và `schema.content` (JSON), thay thế các biến, và sau đó gọi `text.pdf` để vẽ chuỗi văn bản cuối cùng. Việc style cho ô trống (gạch chân, đóng khung) chỉ là một yếu-tố-giao-diện-người-dùng (`UI-only`). Trên file PDF cuối cùng, chúng ta chỉ cần hiển thị câu trả lời của học sinh.

    *Nếu bạn muốn vẽ cả đường gạch chân trên PDF*, bạn sẽ cần viết một hàm `pdf` tùy chỉnh. Hàm này sẽ gọi `multiVariableText.pdf` trước, sau đó tính toán vị trí và chiều rộng của từng biến đã được điền và dùng `page.drawLine` để vẽ các đường gạch chân bên dưới chúng. Tuy nhiên, để bắt đầu, việc chỉ hiển thị text là đủ và đơn giản hơn nhiều.

#### 5. Triển khai `propPanel`

1.  **Kế thừa:**
    *   **Tái sử dụng:** Kế thừa toàn bộ `propPanel` từ `multiVariableText`. Điều này cho bạn tất cả các tùy chọn về font, màu sắc, và quan trọng nhất là widget `mapDynamicVariables` để nhập dữ liệu mẫu.

    ```typescript
    import { propPanel as parentPropPanel } from '../multiVariableText/propPanel.js';

    const propPanel: PropPanel<FillInTheBlankSchema> = {
        ...parentPropPanel,
        // ... sẽ tùy biến ở đây
    };
    ```

2.  **Thêm Tùy chọn Mới:**
    *   **Kỹ thuật:** Chỉnh sửa lại hàm `schema` bên trong `propPanel` để thêm trường `blankStyle`.

    ```typescript
    // ...
    schema: (propPanelProps) => {
        // Gọi hàm schema của MVT để lấy cấu trúc gốc
        const parentSchema = parentPropPanel.schema(propPanelProps);

        // Thêm trường mới vào
        parentSchema.blankStyle = {
            title: 'Blank Style', // Sẽ dùng i18n
            type: 'string',
            widget: 'select',
            props: {
                options: [
                    { label: 'Underline', value: 'underline' },
                    { label: 'Box', value: 'box' },
                ],
            },
            default: 'underline',
            span: 24,
        };

        return parentSchema;
    },
    // ...
    ```

#### 6. Tổng kết Lộ trình và Kỹ thuật Tái sử dụng

| Bước | Nhiệm vụ | Plugin/Kỹ thuật Tái sử dụng |
| :--- | :--- | :--- |
| **1. Schema** | Định nghĩa `FillInTheBlankSchema` | Kế thừa `MultiVariableTextSchema` |
| **2. UI (Designer)** | Cho phép soạn thảo mẫu | Ủy thác hoàn toàn cho `multiVariableText.ui` |
| **3. UI (Form)** | Hiển thị các ô trống có style | Copy `formUiRender` của MVT, tùy biến CSS cho `span` `contentEditable` |
| **4. PDF Render** | Vẽ văn bản đã điền vào PDF | Ủy thác hoàn toàn cho `multiVariableText.pdf` |
| **5. Prop Panel** | Thêm tùy chọn style cho ô trống | Kế thừa `multiVariableText.propPanel`, thêm một `select` widget mới |
| **6. Events** | Xử lý nhập liệu, cập nhật state | Tái sử dụng toàn bộ logic `blur` và `onChange` từ MVT |
| **7. Helpers** | Thay thế biến, validation | Tái sử dụng `substituteVariables`, `validateVariables` từ `multiVariableText/helper.ts` |

Bằng cách đi theo lộ trình này, bạn sẽ xây dựng được một plugin mới cực kỳ hữu ích mà không phải "phát minh lại bánh xe". Bạn chỉ tập trung vào việc tùy biến phần giao diện người dùng (`formUiRender`) và thêm một tùy chọn nhỏ trong `propPanel`, trong khi toàn bộ logic phức tạp về xử lý văn bản, render PDF, và quản lý biến đã được `multiVariableText` và `text` lo liệu.