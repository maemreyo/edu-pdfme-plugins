Bạn đã nhận ra một điểm rất quan trọng và tinh tế! Cách tiếp cận "template block" (tổ hợp các schema ở cấp độ ứng dụng) tuy mạnh mẽ về mặt tái sử dụng code, nhưng lại có những hạn chế về **trải nghiệm người dùng thiết kế (designer experience)**. Các phần tử rời rạc, khó quản lý layout và spacing là những vấn đề thực tế.

Vậy, câu trả lời là: **CÓ, chúng ta hoàn toàn có thể và nên triển khai nó theo hướng một plugin duy nhất, khép kín (self-contained).**

Cách tiếp cận này sẽ phức tạp hơn về mặt kỹ thuật ban đầu, nhưng sẽ mang lại một trải nghiệm người dùng vượt trội. Nó sẽ biến "Block Câu hỏi Trắc nghiệm" từ một "tập hợp các viên gạch" thành một "khối bê tông đúc sẵn" vững chắc.

Dưới đây là phân tích chi tiết về cách triển khai **Plugin `multipleChoiceQuestion`** theo hướng này.

---

### Phân tích Chi tiết Kế hoạch Triển khai Plugin "MultipleChoiceQuestion" (Phiên bản Nâng cao)

#### 1. Mục tiêu & Trải nghiệm người dùng (Được cải thiện)

*   **Giáo viên (Designer Mode):**
    *   Kéo một plugin `multipleChoiceQuestion` duy nhất vào trang.
    *   Toàn bộ câu hỏi (đề bài + các lựa chọn) nằm trong một khối duy nhất, có một khung bao chung.
    *   **Chỉnh sửa nội dung:** Nhấp vào đề bài để sửa đề bài. Nhấp vào nội dung lựa chọn để sửa nội dung lựa chọn.
    *   **Quản lý lựa chọn:** Trong `propPanel`, có các nút `+`/`-` để thêm/bớt các lựa chọn một cách dễ dàng.
    *   **Tự động Layout:** Khi thêm/bớt lựa chọn, hoặc khi nội dung của một lựa chọn quá dài và xuống dòng, toàn bộ khối sẽ **tự động điều chỉnh chiều cao**. Spacing giữa các lựa chọn luôn được giữ đều nhau một cách tự động.
    *   **Chỉnh sửa đáp án đúng:** Trong `propPanel`, có một dropdown hoặc một nhóm radio để chọn đâu là đáp án đúng.

#### 2. Cấu trúc File và Schema (Hoàn toàn mới)

1.  **Tạo file mới:** `plugin/multipleChoiceQuestion/index.ts` (và các file helper).
2.  **Định nghĩa Schema:** Schema bây giờ sẽ chứa toàn bộ thông tin của câu hỏi trong một đối tượng duy nhất.

    ```typescript
    // trong file types.ts của plugin mới
    import { Schema } from '@pdfme/common';
    import { TextSchema } from '../text/types.js'; // Kế thừa style từ text

    // Định nghĩa một lựa chọn
    interface Choice {
      id: string;
      text: string;
    }

    // Schema chính
    export interface MultipleChoiceQuestionSchema extends Schema {
      // Dữ liệu
      question: string;
      choices: Choice[];
      correctAnswerId: string; // Lưu ID của lựa chọn đúng

      // Thuộc tính style
      questionStyle: Partial<TextSchema>; // Style cho đề bài
      choiceStyle: Partial<TextSchema>;   // Style chung cho các lựa chọn
      layout: {
        choiceSpacing: number; // Khoảng cách giữa các lựa chọn (mm)
        // có thể thêm các layout khác như 'vertical', 'horizontal'
      };
    }
    ```
    *   **`content`**: Thuộc tính này sẽ lưu `id` của lựa chọn mà học sinh đã chọn.

#### 3. Triển khai `ui` function (Logic Layout Tùy chỉnh)

Đây là phần phức tạp nhất và là nơi bạn tạo ra giá trị lớn nhất. Plugin sẽ tự quản lý layout của các phần tử con bên trong nó.

1.  **Cấu trúc DOM:** `rootElement` sẽ chứa các `div` con được tạo và định vị bằng code.
    *   `questionDiv`: Một `div` cho đề bài.
    *   `choicesContainer`: Một `div` chứa tất cả các lựa chọn.
    *   Mỗi lựa chọn trong `choicesContainer` là một `div` (`choiceRow`) chứa:
        *   `radioDiv`: `div` để vẽ icon radio.
        *   `textDiv`: `div` để hiển thị nội dung lựa chọn.

2.  **Luồng Render:**
    *   **Bước 1: Render Đề bài:**
        *   Tạo `questionDiv`.
        *   **Kỹ thuật:** Gọi `text.ui` để render `schema.question` vào `questionDiv`. Truyền các style từ `schema.questionStyle`.
        *   `questionDiv` sẽ tự động tính toán chiều cao của nó.

    *   **Bước 2: Render các Lựa chọn:**
        *   Lặp qua mảng `schema.choices`.
        *   Trong mỗi vòng lặp, tạo một `div` `choiceRow`.
        *   **Bên trong `choiceRow`:**
            *   Tạo `radioDiv`. Gọi `radioGroup.ui` (hoặc chỉ `svg.ui` nếu bạn muốn tự quản lý logic chọn) để vẽ icon radio. `value` của radio sẽ là `schema.content === choice.id`.
            *   Tạo `textDiv`. Gọi `text.ui` để render `choice.text` vào `textDiv`.
        *   **Kỹ thuật Layout:**
            *   Sử dụng `flexbox` cho `choiceRow` để căn chỉnh `radioDiv` và `textDiv` thẳng hàng.
            *   Vị trí `top` của mỗi `choiceRow` được tính toán dựa trên chiều cao của `questionDiv` và chiều cao của các `choiceRow` trước đó, cộng với `schema.layout.choiceSpacing`.

    *   **Bước 3: Tự động điều chỉnh chiều cao:**
        *   Sau khi render tất cả các phần tử con, bạn tính toán tổng chiều cao cần thiết.
        *   Nếu tổng chiều cao này khác với `schema.height`, bạn sẽ gọi `onChange({ key: 'height', value: newHeight })`. `pdfme` sẽ tự động cập nhật kích thước của plugin.

3.  **Xử lý Sự kiện:**
    *   **Sửa đề bài/lựa chọn:** Gắn listener `blur` vào các `div` `contentEditable` của đề bài và lựa chọn. Khi `blur`, cập nhật lại `schema.question` hoặc mảng `schema.choices` và gọi `onChange`.
    *   **Chọn đáp án (Form Mode):** Gắn listener `click` vào mỗi `choiceRow`. Khi được click, cập nhật `schema.content = choice.id` và gọi `onChange`. Việc này sẽ kích hoạt render lại, và icon radio sẽ tự động cập nhật.

#### 4. Triển khai `pdf` function (Render Tùy chỉnh)

Logic tương tự như `ui`, nhưng sử dụng các lệnh vẽ của `pdf-lib`.

1.  **Vẽ Đề bài:**
    *   **Kỹ thuật:** Gọi `text.pdf` để vẽ `schema.question` tại vị trí đầu tiên.
2.  **Vẽ các Lựa chọn:**
    *   Lặp qua `schema.choices`.
    *   Trong mỗi vòng lặp:
        *   Tính toán vị trí `y` cho hàng lựa chọn hiện tại.
        *   Gọi `radioGroup.pdf` (hoặc `svg.pdf`) để vẽ icon radio.
        *   Gọi `text.pdf` để vẽ nội dung lựa chọn.
3.  **Tái sử dụng:** Toàn bộ logic phức tạp của việc vẽ văn bản và icon được ủy thác cho các plugin cơ sở. Nhiệm vụ chính của bạn là **tính toán đúng vị trí** cho mỗi lần gọi đó.

#### 5. Triển khai `propPanel`

`propPanel` giờ đây sẽ rất mạnh mẽ và tập trung.

1.  **Quản lý Lựa chọn:**
    *   **Kỹ thuật:** Tạo một widget tùy chỉnh `ChoiceManager`.
    *   **Giao diện:** Widget này sẽ hiển thị một danh sách các lựa chọn hiện có. Mỗi lựa chọn có một ô input để sửa text và một nút `-` để xóa. Có một nút `+` ở cuối để thêm lựa chọn mới.
    *   **Logic:** Khi người dùng thêm/sửa/xóa, widget sẽ cập nhật trực tiếp mảng `schema.choices` và gọi `onChange`.

2.  **Chọn Đáp án đúng:**
    *   Tạo một widget `select` (dropdown).
    *   `options` của dropdown này sẽ được tạo động từ `schema.choices` (`choices.map(c => ({ label: c.text, value: c.id }))`).
    *   Khi người dùng chọn một đáp án, nó sẽ cập nhật `schema.correctAnswerId`.

3.  **Tùy chọn Layout & Style:**
    *   Cung cấp các `inputNumber` cho `choiceSpacing`.
    *   Cung cấp các `Card` chứa các `PropPanelSchema` của `text` để người dùng tùy chỉnh `questionStyle` và `choiceStyle`.

### So sánh hai cách tiếp cận

| Tiêu chí | Cách 1: Template Block (Tổ hợp) | Cách 2: Plugin Khép kín (Nâng cao) |
| :--- | :--- | :--- |
| **Trải nghiệm Designer** | Rời rạc, khó chỉnh layout, phải di chuyển nhiều phần tử. | **Vượt trội.** Một khối duy nhất, layout tự động, quản lý tập trung. |
| **Độ phức tạp triển khai** | **Dễ.** Chỉ cần viết logic tạo mảng schema ở cấp ứng dụng. | **Khó.** Đòi hỏi viết code render UI/PDF tùy chỉnh, quản lý layout. |
| **Tính đóng gói** | Thấp. Logic nằm rải rác trong ứng dụng. | **Cao.** Toàn bộ logic nằm trong một plugin duy nhất, dễ dàng chia sẻ, tái sử dụng. |
| **Khả năng bảo trì** | Khó hơn khi cần thay đổi layout chung. | Dễ hơn. Chỉ cần sửa trong code của plugin. |
| **Kết quả** | Hoạt động tốt, nhưng có thể hơi "vụng về" khi thiết kế. | **Chuyên nghiệp.** Mang lại trải nghiệm mượt mà, liền mạch. |

**Kết luận:**

Cách tiếp cận "Plugin Khép kín" này chắc chắn là hướng đi đúng đắn để xây dựng một sản phẩm chuyên nghiệp như Docubrand. Mặc dù đòi hỏi đầu tư kỹ thuật ban đầu lớn hơn, nó sẽ trả lại bằng một trải nghiệm người dùng tốt hơn rất nhiều và một nền tảng vững chắc, dễ dàng mở rộng và bảo trì trong tương lai. Nó biến một "tính năng" thành một **"thành phần" (component)** thực sự của hệ thống.