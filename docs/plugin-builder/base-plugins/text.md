======================================================================
==   PHÂN TÍCH SIÊU CHI TIẾT PLUGIN TEXT TRONG PDFME                 ==
======================================================================

Tài liệu này đi sâu vào mã nguồn của plugin `text`, giải thích từng khía cạnh từ cấu trúc, luồng sự kiện trên UI, logic render ra PDF, và các thuật toán phức tạp trong các hàm hỗ trợ.

MỤC LỤC
---------
1.  Mục đích và Usecase
2.  Phân tích Schema và các Hằng số
3.  Phân tích Luồng Render trên UI (`uiRender.ts`)
    3.1. Cơ chế Editable và Workaround cho Firefox
    3.2. Xử lý Sự kiện (Events)
    3.3. Kỹ thuật Đảm bảo WYSIWYG (What You See Is What You Get)
    3.4. Hỗ trợ Ký tự và Placeholder
4.  Phân tích Luồng Render trên PDF (`pdfRender.ts`)
    4.1. Quản lý và Nhúng Font
    4.2. Thuật toán Layout và Ngắt dòng (Line Wrapping)
    4.3. Vẽ văn bản và các hiệu ứng
5.  Phân tích các Hàm Hỗ trợ (`helper.ts`) - "Bộ não" của Plugin
    5.1. Tính toán Kích thước Font động (`calculateDynamicFontSize`)
    5.2. Logic Ngắt dòng và Hỗ trợ Tiếng Nhật (`getSplittedLinesBySegmenter`)
    5.3. Các hàm tính toán Font Metrics
6.  Phân tích Bảng Thuộc tính (`propPanel.ts`)
7.  Tổng kết các Kỹ thuật và Event chính

----------------------------------------------------------------------
1. MỤC ĐÍCH VÀ USECASE
----------------------------------------------------------------------

Plugin `text` là thành phần cốt lõi, cho phép người dùng thêm và chỉnh sửa các khối văn bản trên tài liệu. Nó không chỉ hiển thị văn bản đơn thuần mà còn hỗ trợ một loạt các tính năng nâng cao:
-   **Định dạng phong phú:** Font chữ, kích thước, màu sắc, màu nền, giãn cách ký tự, chiều cao dòng.
-   **Căn chỉnh:** Ngang (trái, phải, giữa, đều hai bên) và dọc (trên, giữa, dưới).
-   **Hiệu ứng:** Gạch chân (underline), gạch ngang (strikethrough).
-   **Kích thước Font động:** Tự động co giãn kích thước font để vừa với khung chứa.
-   **Hỗ trợ đa ngôn ngữ:** Bao gồm cả các quy tắc ngắt dòng phức tạp cho tiếng Nhật.

----------------------------------------------------------------------
2. PHÂN TÍCH SCHEMA VÀ CÁC HẰNG SỐ
----------------------------------------------------------------------

-   **`types.ts`**: Định nghĩa `TextSchema`, là cấu trúc dữ liệu chính.
    -   `alignment`, `verticalAlignment`: Xác định cách văn bản được căn chỉnh trong box.
    -   `dynamicFontSize`: Một object `{ min, max, fit }`. Đây là một tính năng mạnh mẽ. `fit` có thể là `horizontal` (ưu tiên vừa chiều ngang) hoặc `vertical` (ưu tiên vừa chiều cao).
    -   Các thuộc tính khác như `fontName`, `fontSize`, `lineHeight`, `characterSpacing`, `fontColor`, `backgroundColor`, `strikethrough`, `underline` đều là các thuộc tính định dạng cơ bản.

-   **`constants.ts`**: Định nghĩa các giá trị mặc định và các hằng số quan trọng.
    -   `DEFAULT_FONT_SIZE`, `DEFAULT_ALIGNMENT`, etc.: Đảm bảo plugin luôn có giá trị hợp lệ.
    -   `FONT_SIZE_ADJUSTMENT`: Bước nhảy (0.25pt) khi tính toán kích thước font động.
    -   **`LINE_START_FORBIDDEN_CHARS` & `LINE_END_FORBIDDEN_CHARS`**: Đây là một chi tiết cực kỳ quan trọng, cho thấy sự đầu tư vào việc hỗ trợ các quy tắc sắp chữ quốc tế (cụ thể là "Kinsoku Shori" - 禁則処理 trong tiếng Nhật), ngăn các dấu câu, dấu ngoặc... đứng ở vị trí không hợp lệ.

----------------------------------------------------------------------
3. PHÂN TÍCH LUỒNG RENDER TRÊN UI (`uiRender.ts`)
----------------------------------------------------------------------

Đây là nơi xử lý mọi tương tác của người dùng trên trình duyệt.

### 3.1. Cơ chế Editable và Workaround cho Firefox

-   **Kỹ thuật chính:** Thay vì dùng `<textarea>`, plugin sử dụng một `<div>` với thuộc tính `contentEditable`.
-   **`contentEditable="plaintext-only"`**: Giá trị này được sử dụng để ngăn người dùng dán văn bản có định dạng (rich text) vào, đảm bảo dữ liệu luôn là plain text.
-   **Workaround cho Firefox (`makeElementPlainTextContentEditable`)**:
    -   **Vấn đề:** Firefox không hỗ trợ `plaintext-only`. Nếu dùng `contentEditable="true"`, người dùng có thể dán HTML, và nhấn Enter sẽ tạo ra các thẻ `<p>` hoặc `<div>` mới, làm hỏng cấu trúc.
    -   **Giải pháp:** Plugin triển khai một giải pháp rất thông minh:
        1.  Vẫn đặt `contentEditable="true"`.
        2.  **Bắt sự kiện `keydown`**: Khi người dùng nhấn `Enter` (và không giữ `Shift`), nó sẽ gọi `e.preventDefault()` để chặn hành vi mặc định và thực thi `document.execCommand('insertLineBreak', false, undefined)` để chèn một ký tự xuống dòng (`\n`) thay vì tạo thẻ mới.
        3.  **Bắt sự kiện `paste`**: Nó cũng `preventDefault()` hành vi dán mặc định, sau đó lấy dữ liệu dạng text từ clipboard (`e.clipboardData.getData('text')`) và chèn nó vào vị trí con trỏ một cách thủ công.

### 3.2. Xử lý Sự kiện (Events)

-   **`blur`**: Đây là sự kiện quan trọng nhất để đồng bộ hóa dữ liệu. Khi người dùng click ra ngoài khối text (mất focus), sự kiện `blur` được kích hoạt.
    -   **Hành động:** Trình xử lý sẽ đọc nội dung văn bản từ `div.innerText`, dọn dẹp ký tự xuống dòng thừa ở cuối, và gọi hàm `onChange({ key: 'content', value: ... })`. Điều này cập nhật schema trong state chính của ứng dụng. Nó cũng gọi `stopEditing()` để thông báo cho trình quản lý UI biết rằng chế độ chỉnh sửa đã kết thúc.

-   **`keyup`**: Sự kiện này chỉ được lắng nghe khi `dynamicFontSize` được bật.
    -   **Hành động:** Sau mỗi lần người dùng gõ phím, nó sẽ kích hoạt lại thuật toán `calculateDynamicFontSize` để tìm kích thước font tối ưu mới.
    -   **Tối ưu hóa:** Việc tính toán được bọc trong `setTimeout(..., 0)` để đưa nó vào cuối hàng đợi tác vụ (event loop), tránh làm giật (jank) giao diện khi người dùng đang gõ nhanh.

-   **`focus`**: Được sử dụng khi có `placeholder`. Khi người dùng focus vào, nếu nội dung đang là placeholder, nó sẽ xóa nội dung và đổi màu chữ về màu thật.

### 3.3. Kỹ thuật Đảm bảo WYSIWYG

-   **Vấn đề:** Cách trình duyệt hiển thị font (dựa trên font metrics như ascent, descent) và cách `pdf-lib` vẽ font lên PDF có sự khác biệt. Nếu không xử lý, văn bản trên UI sẽ bị lệch so với trên PDF, đặc biệt với các tùy chọn canh lề dọc.
-   **Giải pháp (`getBrowserVerticalFontAdjustments`):** Đây là một kỹ thuật rất tinh vi.
    -   Nó sử dụng `fontkit` để đọc các thông số `ascent`, `descent`, `unitsPerEm` của file font.
    -   Nó tính toán "chiều cao thực" của font mà trình duyệt sẽ render.
    -   Nó so sánh chiều cao này với `fontSize` và `lineHeight` đã cho để tính ra một khoảng chênh lệch.
    -   Khoảng chênh lệch này được áp dụng dưới dạng `padding-top` hoặc `margin-bottom` cho `div` chứa text.
    -   **Kết quả:** Văn bản trên UI được dịch chuyển một chút để vị trí của nó khớp chính xác với vị trí sẽ được vẽ trên PDF, tạo ra trải nghiệm WYSIWYG hoàn hảo.

### 3.4. Hỗ trợ Ký tự và Placeholder

-   **`replaceUnsupportedChars`**: Trước khi render, hàm này duyệt qua từng ký tự trong chuỗi `value`. Nó dùng `fontKitFont.hasGlyphForCodePoint()` để kiểm tra xem font hiện tại có hỗ trợ ký tự đó không. Nếu không, nó thay thế bằng ký tự placeholder `〿`. Điều này giúp người dùng nhận biết ngay lập tức nếu họ sử dụng một ký tự không được hỗ trợ bởi font đã chọn.
-   **Placeholder:** Khi `value` rỗng và `placeholder` được cung cấp, nó sẽ hiển thị `placeholder` với màu chữ khác (`PLACEHOLDER_FONT_COLOR`) để gợi ý cho người dùng.

----------------------------------------------------------------------
4. PHÂN TÍCH LUỒNG RENDER TRÊN PDF (`pdfRender.ts`)
----------------------------------------------------------------------

Đây là nơi dữ liệu từ schema được chuyển thành các lệnh vẽ trên file PDF.

### 4.1. Quản lý và Nhúng Font

-   **`embedAndGetFontObj`**: Hàm này chịu trách nhiệm nhúng các font cần thiết vào tài liệu PDF.
-   **Kỹ thuật Caching:** Nó sử dụng một `Map` để cache các đối tượng font đã được nhúng (`PDFFont`). Key của Map là `pdfDoc`. Điều này cực kỳ quan trọng về hiệu suất, đảm bảo mỗi font chỉ được nhúng một lần duy nhất cho mỗi tài liệu, ngay cả khi nó được sử dụng bởi hàng trăm schema khác nhau.
-   **Hỗ trợ Font từ URL:** Nó có thể fetch font từ một URL nếu `fontData` là một chuỗi `http`.

### 4.2. Thuật toán Layout và Ngắt dòng (Line Wrapping)

-   Đây là phần phức tạp nhất của việc render PDF.
-   Nó gọi `splitTextToSize` (trong `helper.ts`) để thực hiện công việc nặng nhọc là chia một chuỗi văn bản dài thành một mảng các dòng ngắn hơn vừa với chiều rộng của box. (Chi tiết thuật toán này ở mục 5.2).

### 4.3. Vẽ văn bản và các hiệu ứng

-   **Vị trí Y (`yOffset`):** PDF vẽ văn bản từ đường baseline dưới cùng đi lên. Do đó, plugin phải tính toán `yOffset` rất cẩn thận dựa trên `verticalAlignment`, tổng số dòng, chiều cao font, và `descent` của font để đặt dòng đầu tiên vào đúng vị trí.
-   **Vị trí X (`xLine`):** Tính toán dựa trên `alignment` (center, right) và chiều rộng của từng dòng (`widthOfTextAtSize`).
-   **Canh đều (`alignment: 'justify'`)**: Đây là một kỹ thuật nâng cao. `pdf-lib` không có sẵn tính năng canh đều. Plugin này tự triển khai bằng cách:
    1.  Tính toán khoảng trống còn lại trên dòng.
    2.  Sử dụng `Intl.Segmenter` để đếm số lượng ký tự (grapheme) trên dòng.
    3.  Phân bổ đều khoảng trống đó vào `characterSpacing` (`page.pushOperators(pdfLib.setCharacterSpacing(spacing))`) chỉ cho dòng đó.
-   **Gạch chân/Gạch ngang:** `pdf-lib` cũng không hỗ trợ trực tiếp. Plugin tự vẽ chúng bằng cách tính toán tọa độ bắt đầu và kết thúc của một đường thẳng và gọi `page.drawLine`.
-   **Xoay (Rotation):** Nó không xoay cả khối text một lần. Thay vào đó, nó lặp qua từng dòng, tính toán tọa độ (`xLine`, `yLine`) của dòng đó, sau đó dùng hàm `rotatePoint` để xoay tọa độ này quanh tâm của cả khối text, rồi mới gọi `page.drawText` với góc xoay. Điều này đảm bảo mỗi dòng được đặt đúng vị trí trong một khối text đã xoay.

----------------------------------------------------------------------
5. PHÂN TÍCH CÁC HÀM HỖ TRỢ (`helper.ts`) - "BỘ NÃO" CỦA PLUGIN
----------------------------------------------------------------------

File này chứa các thuật toán cốt lõi.

### 5.1. Tính toán Kích thước Font động (`calculateDynamicFontSize`)

-   **Thuật toán:** Đây là một thuật toán tìm kiếm lặp (iterative search).
    1.  Bắt đầu với một `fontSize` (từ schema hoặc một giá trị khởi tạo).
    2.  Kiểm tra xem nó có nằm trong khoảng `min` và `max` không.
    3.  **Vòng lặp co lại (Shrink):** Nếu văn bản với `fontSize` hiện tại tràn ra ngoài box (theo chiều rộng hoặc chiều cao, tùy thuộc vào `fit`), nó sẽ liên tục giảm `fontSize` đi một lượng nhỏ (`FONT_SIZE_ADJUSTMENT`) và tính toán lại cho đến khi vừa.
    4.  **Vòng lặp giãn ra (Grow):** Nếu văn bản quá nhỏ so với box, nó sẽ liên tục tăng `fontSize` và tính toán lại cho đến khi nó vừa khít hoặc chạm đến giới hạn `max`.
    5.  Hàm `calculateConstraints` bên trong là nơi nó gọi `getSplittedLinesBySegmenter` để mô phỏng việc ngắt dòng và tính toán tổng chiều rộng/cao cần thiết.

### 5.2. Logic Ngắt dòng và Hỗ trợ Tiếng Nhật (`getSplittedLinesBySegmenter`)

-   **Kỹ thuật hiện đại:** Thay vì chỉ `split(' ')`, nó sử dụng API chuẩn của trình duyệt `Intl.Segmenter` với `granularity: 'word'`. Điều này cho phép ngắt từ chính xác hơn cho nhiều ngôn ngữ, không chỉ tiếng Anh.
-   **Thuật toán:**
    1.  Lặp qua từng "segment" (từ) được trả về bởi `Intl.Segmenter`.
    2.  Tính chiều rộng của segment đó.
    3.  Nếu thêm segment này vào dòng hiện tại không vượt quá chiều rộng box, thì thêm vào.
    4.  Nếu vượt quá, bắt đầu một dòng mới với segment này.
    5.  Nếu bản thân segment đó đã dài hơn chiều rộng box, nó sẽ được ngắt theo từng ký tự.
-   **Kinsoku Shori (Tiếng Nhật):** Sau khi có mảng các dòng, nếu phát hiện có ký tự tiếng Nhật, nó sẽ gọi hai hàm:
    -   `filterStartJP`: Duyệt ngược từ cuối lên, nếu dòng bắt đầu bằng ký tự cấm, nó sẽ đẩy ký tự đó lên dòng trên.
    -   `filterEndJP`: Duyệt từ trên xuống, nếu dòng kết thúc bằng ký tự cấm, nó sẽ kéo ký tự đó xuống dòng dưới.
    -   Đây là một sự triển khai rất cẩn thận các quy tắc sắp chữ chuyên nghiệp.

### 5.3. Các hàm tính toán Font Metrics

-   `getFontKitFont`: Tải và phân tích file font bằng `fontkit`.
-   `widthOfTextAtSize`, `heightOfFontAtSize`, `getFontDescentInPt`: Các hàm này sử dụng đối tượng font đã được `fontkit` phân tích để lấy các số liệu cấp thấp (glyph dimensions, ascent, descent) và tính toán ra chiều rộng/cao chính xác của văn bản ở một kích thước font cụ thể. Đây là nền tảng cho mọi thuật toán layout khác.

----------------------------------------------------------------------
6. PHÂN TÍCH BẢNG THUỘC TÍNH (`propPanel.ts`)
----------------------------------------------------------------------

-   **Widget tùy chỉnh (`UseDynamicFontSize`):** Tạo một checkbox để bật/tắt tính năng font động. Khi trạng thái thay đổi, nó sẽ gọi `changeSchemas` để thêm hoặc xóa object `dynamicFontSize` khỏi schema.
-   **Schema động:** Các trường nhập `min`, `max`, `fit` cho font động và trường `fontSize` cơ bản có thuộc tính `hidden` hoặc `disabled` dựa trên trạng thái của checkbox `UseDynamicFontSize`. Điều này tạo ra một giao diện người dùng thông minh, chỉ hiển thị các tùy chọn liên quan.
-   **`getExtraFormatterSchema`**: Tách logic tạo ra `ButtonGroup` (căn lề, gạch chân,...) ra một file riêng (`extraFormatter.ts`) để mã nguồn sạch sẽ hơn.

----------------------------------------------------------------------
7. TỔNG KẾT CÁC KỸ THUẬT VÀ EVENT CHÍNH
----------------------------------------------------------------------

-   **Events chính trên UI:**
    -   `blur`: Đồng bộ hóa nội dung từ `div` `contentEditable` về schema.
    -   `keyup`: Kích hoạt tính toán lại kích thước font động.
    -   `keydown` & `paste`: Được bắt và xử lý thủ công để mô phỏng `plaintext-only` trên Firefox.
    -   `focus`: Xử lý logic cho placeholder.

-   **Các kỹ thuật nổi bật:**
    -   **WYSIWYG Font Alignment:** Sử dụng `fontkit` để đọc font metrics và áp dụng `padding/margin` trên UI để khớp với render của PDF.
    -   **Manual Rich Text Simulation:** Tự vẽ gạch chân/gạch ngang trên PDF bằng `drawLine`.
    -   **Justify Alignment Implementation:** Tự triển khai canh đều hai bên bằng cách điều chỉnh `characterSpacing` cho từng dòng trên PDF.
    -   **Advanced Line Wrapping:** Sử dụng `Intl.Segmenter` và triển khai quy tắc sắp chữ "Kinsoku Shori" cho tiếng Nhật.
    -   **Iterative Dynamic Font Sizing:** Thuật toán lặp để tìm kích thước font tối ưu.
    -   **Firefox Compatibility Workaround:** Xử lý sự kiện `keydown` và `paste` để đảm bảo trải nghiệm nhất quán.
    -   **Performance Caching:** Cache các đối tượng font đã được nhúng (`PDFFont`) và đã được phân tích (`FontKitFont`) để tăng tốc độ render.