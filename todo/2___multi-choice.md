Tuyệt vời! Sau khi đã có "FillInTheBlank" làm nền tảng, plugin thứ hai tôi sẽ chọn để phát triển là:

**Block "Câu hỏi Trắc nghiệm" (MultipleChoiceQuestion).**

Lý do đây là lựa chọn số 2 chiến lược:

1.  **Giá trị cực lớn cho người dùng:** Đây là dạng câu hỏi phổ biến nhất trong mọi bài kiểm tra. Cung cấp một block tiện lợi cho nó sẽ là một điểm cộng khổng lồ cho Docubrand.
2.  **Không cần tạo Plugin mới:** Đây là một bước tiến quan trọng. Bạn sẽ không viết một file `plugin/multipleChoiceQuestion/index.ts`. Thay vào đó, bạn sẽ học cách **tổ hợp (compose)** các plugin đã có ở **cấp độ ứng dụng (application-level)**. Điều này rèn luyện một kỹ năng khác: xây dựng các "template" hoặc "preset" thay vì chỉ xây dựng plugin.
3.  **Tận dụng các plugin cơ sở:** Nó sử dụng một cách hoàn hảo sự kết hợp của `text` và `radioGroup`, cho thấy sức mạnh của việc các plugin có thể hoạt động cùng nhau.
4.  **Mở đường cho tính năng Premium:** Đây là block lý tưởng để sau này tích hợp tính năng "Tự động Chấm điểm" và "Trộn đề".

---

### Phân tích Chi tiết Kế hoạch Triển khai Block "MultipleChoiceQuestion"

Đây không phải là việc tạo một plugin mới, mà là tạo một **chức năng trong giao diện người dùng của Docubrand** để sinh ra một nhóm các schema đã được cấu hình sẵn.

#### 1. Mục tiêu & Trải nghiệm người dùng cuối cùng

*   **Giáo viên (Designer Mode):**
    *   Trên thanh công cụ của Docubrand, có một nút "Thêm Câu hỏi Trắc nghiệm".
    *   Khi nhấp vào, một khối hoàn chỉnh sẽ xuất hiện trên trang, bao gồm:
        *   Một ô để nhập đề bài.
        *   Bốn lựa chọn (A, B, C, D), mỗi lựa chọn có một nút radio và một ô để nhập nội dung.
    *   Giáo viên chỉ cần click vào các ô text và chỉnh sửa nội dung.
    *   Toàn bộ khối này có thể được di chuyển, thay đổi kích thước như một thể thống nhất.
*   **Học sinh (Form Mode):**
    *   Nhìn thấy câu hỏi và các lựa chọn.
    *   Nhấp vào một trong các nút radio để chọn đáp án. Chỉ một đáp án được chọn tại một thời điểm.

#### 2. Cấu trúc Dữ liệu: Một "Nhóm Schema"

Khi người dùng "Thêm Câu hỏi Trắc nghiệm", logic trong ứng dụng của bạn sẽ tạo ra một mảng các đối tượng schema và thêm chúng vào template.

*   **Kỹ thuật:** Sử dụng chức năng **Grouping** của `pdfme`. Bạn sẽ tạo ra một `groupId` duy nhất cho mỗi câu hỏi.
*   **Cấu trúc Schema JSON (ví dụ cho một câu hỏi):**

```json
[
  // 1. Đề bài
  {
    "id": "question_text_1",
    "type": "text",
    "position": { "x": 10, "y": 20 },
    "width": 180, "height": 20,
    "content": "Câu hỏi 1: Trái Đất có hình gì?",
    "groupId": "question_group_1"
  },

  // 2. Lựa chọn A
  {
    "id": "radio_A_1",
    "type": "radioGroup",
    "position": { "x": 15, "y": 45 },
    "width": 8, "height": 8,
    "group": "answer_for_q1", // Rất quan trọng: Cùng group để loại trừ nhau
    "groupId": "question_group_1"
  },
  {
    "id": "text_A_1",
    "type": "text",
    "position": { "x": 25, "y": 45 },
    "width": 165, "height": 8,
    "content": "A. Hình vuông",
    "verticalAlignment": "middle",
    "groupId": "question_group_1"
  },

  // 3. Lựa chọn B
  {
    "id": "radio_B_1",
    "type": "radioGroup",
    "position": { "x": 15, "y": 55 },
    "width": 8, "height": 8,
    "group": "answer_for_q1", // Cùng group
    "groupId": "question_group_1"
  },
  {
    "id": "text_B_1",
    "type": "text",
    "position": { "x": 25, "y": 55 },
    "width": 165, "height": 8,
    "content": "B. Hình cầu",
    "verticalAlignment": "middle",
    "groupId": "question_group_1"
  },

  // ... Tương tự cho C và D
]
```

#### 3. Triển khai Logic trong Giao diện Docubrand

Đây là phần code bạn sẽ viết trong ứng dụng của mình, không phải trong thư mục plugin.

1.  **Tạo nút "Thêm Câu hỏi Trắc nghiệm":**
    *   Trong UI của bạn (ví dụ, một sidebar React/Vue/Svelte), tạo một button.
    *   **Event:** `click`.

2.  **Xử lý sự kiện `click`:**
    *   **Hàm `createMultipleChoiceBlock(position)`:** Viết một hàm nhận vị trí (x, y) nơi người dùng muốn thêm block.
    *   **Bên trong hàm:**
        1.  **Tạo ID duy nhất:** Tạo các ID ngẫu nhiên và duy nhất cho `groupId`, `group` của radio, và `id` của từng schema con. Ví dụ: `const groupId = \`qg_${Date.now()}\`;`, `const radioGroupName = \`ans_for_${groupId}\`;`.
        2.  **Xây dựng mảng Schema:** Tạo một mảng các đối tượng schema như cấu trúc JSON ở trên. Vị trí của các schema con (`radio`, `text` cho lựa chọn) sẽ được tính toán tương đối so với `position` đầu vào.
        3.  **Gọi API của `pdfme`:** Sử dụng API mà `pdfme` cung cấp để thêm schema vào template. Giả sử bạn đang dùng `@pdfme/ui`, nó có thể là một hàm như `designer.updateTemplate({ ...designer.getTemplate(), schemas: [...designer.getTemplate().schemas, ...newSchemas] })`.

#### 4. Kỹ thuật Tái sử dụng từ các Base Plugin

Đây là phần quan trọng nhất, cho thấy bạn không cần phát minh lại gì cả.

*   **Plugin `text`:**
    *   **Tận dụng:** Được dùng để hiển thị đề bài và nội dung các lựa chọn.
    *   **Lợi ích:** Giáo viên có thể sử dụng tất cả các tính năng định dạng của nó: bôi đậm từ khóa, thay đổi font chữ, kích thước, màu sắc để làm nổi bật câu hỏi.
    *   **Kỹ thuật liên quan:** `uiRender` và `pdfRender` của `text` sẽ xử lý toàn bộ việc hiển thị và in ấn.

*   **Plugin `radioGroup`:**
    *   **Tận dụng:** Là trái tim của chức năng lựa chọn.
    *   **Lợi ích:** Logic phức tạp của việc đảm bảo chỉ một lựa chọn được chọn đã được xử lý hoàn toàn bên trong plugin này.
    *   **Kỹ thuật liên quan:**
        *   **Event Bus:** Cơ chế `EventTarget` toàn cục sẽ tự động hoạt động khi các `radioGroup` có cùng `schema.group` được render. Bạn không cần làm gì thêm.
        -   **Ủy thác cho `svg`:** Việc hiển thị icon tròn (checked/unchecked) đã được `radioGroup` xử lý bằng cách gọi `svg.ui` và `svg.pdf`.

*   **Plugin `svg` (gián tiếp):**
    *   **Tận dụng:** Được `radioGroup` sử dụng để vẽ các icon.
    *   **Lợi ích:** Bạn có được các icon vector sắc nét trên cả UI và PDF mà không cần quan tâm đến chi tiết triển khai.

#### 5. Lộ trình Mở rộng trong Tương lai (Hướng tới Premium)

Sau khi có block này, bạn đã có một nền tảng vững chắc.

1.  **Thêm trường "Đáp án" vào `propPanel`:**
    *   Bạn sẽ cần tạo một **custom plugin wrapper** cho `radioGroup`, ví dụ `answerableRadioGroup`.
    *   Plugin này sẽ kế thừa `radioGroup` nhưng thêm một trường `isCorrectAnswer: boolean` vào schema.
    *   `propPanel` của nó sẽ có một checkbox "Đây là đáp án đúng".
    *   Khi giáo viên check vào đó, `isCorrectAnswer` sẽ được đặt là `true`.
2.  **Tích hợp Logic Chấm điểm:**
    *   Hệ thống Docubrand của bạn giờ đây có thể đọc template, tìm các schema `answerableRadioGroup`, và biết được đâu là đáp án đúng (`isCorrectAnswer === true`) và đâu là lựa chọn của học sinh (`content === 'true'`).
    *   Từ đó, việc so sánh và chấm điểm trở nên khả thi.

### Tổng kết Lộ trình và Kỹ thuật

| Bước | Nhiệm vụ | Kỹ thuật/Plugin Tái sử dụng | Ghi chú |
| :--- | :--- | :--- | :--- |
| **1. UI** | Tạo nút "Thêm Câu hỏi Trắc nghiệm" | - | Logic nằm trong ứng dụng Docubrand |
| **2. Logic** | Viết hàm `createMultipleChoiceBlock` | - | Tạo một mảng các schema JSON |
| **3. Cấu hình** | Đặt `groupId` cho tất cả schema con | Grouping của `pdfme` | Để di chuyển/thao tác như một khối |
| **4. Cấu hình** | Đặt `group` giống nhau cho các radio | `radioGroup` plugin | Để kích hoạt cơ chế loại trừ lẫn nhau |
| **5. Hiển thị** | Hiển thị đề bài và lựa chọn | `text` plugin | Tận dụng khả năng định dạng văn bản |
| **6. Tương tác** | Xử lý việc chọn đáp án | `radioGroup` plugin | Tận dụng Event Bus và logic toggle |

Bằng cách tiếp cận này, bạn tạo ra một tính năng cực kỳ mạnh mẽ và tiện lợi cho người dùng mà **không cần viết một dòng code plugin mới nào**. Thay vào đó, bạn học được cách **sử dụng `pdfme` như một bộ công cụ (SDK)**, kết hợp các "viên gạch" đã có để xây dựng nên những "cấu trúc" phức tạp hơn. Đây là một kỹ năng quan trọng để xây dựng các ứng dụng lớn dựa trên `pdfme`.