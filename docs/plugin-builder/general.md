======================================================================
==   PHÂN TÍCH CHI TIẾT HỆ THỐNG PLUGIN PDFME (@demo-pdfme/plugin)   ==
======================================================================

Tài liệu này phân tích sâu toàn bộ mã nguồn trong thư mục `@demo-pdfme/plugin`, giải thích chi tiết kiến trúc, các use-case, luồng hoạt động và các chi tiết kỹ thuật của từng plugin.

MỤC LỤC
---------
1. Kiến trúc chung và các tiện ích (Common Utilities)
2. Phân tích chi tiết các Plugin:
   2.1. Text Plugin (Văn bản)
   2.2. Multi-Variable Text Plugin (Văn bản đa biến)
   2.3. Image Plugin (Hình ảnh)
   2.4. SVG Plugin (Đồ họa Vector)
   2.5. Shape Plugins (Line, Rectangle, Ellipse)
   2.6. Barcode Plugins (Mã vạch)
   2.7. Table Plugin (Bảng) - Phân tích chuyên sâu
   2.8. Form Control Plugins (Checkbox, RadioGroup, Select)
   2.9. Date/Time Plugins (Ngày, Giờ, Ngày & Giờ)

----------------------------------------------------------------------
1. KIẾN TRÚC CHUNG VÀ CÁC TIỆN ÍCH (COMMON UTILITIES)
----------------------------------------------------------------------

Các file `utils.ts` và `constants.ts` cung cấp các hàm và hằng số nền tảng, được tái sử dụng trong hầu hết các plugin.

### Tệp: `plugin/utils.ts`

- **`convertForPdfLayoutProps`**: Hàm quan trọng nhất. Nó thực hiện hai nhiệm vụ chính:
    1.  **Chuyển đổi đơn vị và hệ tọa độ:** Chuyển đổi từ `mm` (milimet) của schema sang `pt` (point) của `pdf-lib`. Quan trọng hơn, nó đảo ngược trục Y vì hệ tọa độ của UI (gốc ở trên cùng bên trái) khác với PDF (gốc ở dưới cùng bên trái). Công thức `y = pageHeight - mm2pt(mmY) - height` là cốt lõi của việc này.
    2.  **Xử lý xoay (Rotation):** `pdf-lib` xoay một đối tượng quanh góc dưới bên trái của nó. Tuy nhiên, UI thường xoay quanh tâm. Hàm này tính toán lại tọa độ `x`, `y` sau khi xoay để tâm xoay trên PDF khớp với tâm xoay trên UI. Nó sử dụng hàm `rotatePoint` để thực hiện phép quay ma trận.

- **`rotatePoint`**: Hàm toán học thuần túy để xoay một điểm quanh một điểm pivot.

- **`hex2RgbColor`, `hex2CmykColor`, `hex2PrintingColor`**: Quản lý màu sắc. `hex2PrintingColor` là một "facade" cho phép chọn hệ màu (RGB hoặc CMYK) dựa trên `options.colorType`. Điều này rất quan trọng cho in ấn chuyên nghiệp.

- **`isEditable(mode, schema)`**: Một logic đơn giản nhưng quan trọng, quyết định một plugin có thể được chỉnh sửa hay không. Editable khi `mode` là `designer` hoặc khi `mode` là `form` và `schema.readOnly` không phải là `true`.

- **`createErrorElm`**: Tạo ra một phần tử DOM hiển thị lỗi (ví dụ: SVG không hợp lệ, mã vạch sai định dạng). Điều này đảm bảo trải nghiệm người dùng không bị gián đoạn.

- **`createSvgStr(icon, attrs)`**: Một tiện ích để xử lý các icon từ thư viện `lucide`. Do `lucide` trả về một cấu trúc dữ liệu dạng mảng, hàm này sẽ xây dựng một chuỗi SVG hoàn chỉnh từ cấu trúc đó, dùng cho thuộc tính `icon` của plugin.

- **`readFile`**: Hàm tiện ích chuẩn để đọc file (dùng cho plugin Image).

### Tệp: `plugin/constants.ts`

Chứa các hằng số dùng chung như `DEFAULT_OPACITY` và `HEX_COLOR_PATTERN` để kiểm tra định dạng màu hex.

----------------------------------------------------------------------
2. PHÂN TÍCH CHI TIẾT CÁC PLUGIN
----------------------------------------------------------------------

### 2.1. Text Plugin (`plugin/text/*`)

Đây là một trong những plugin phức tạp và cốt lõi nhất.

*   **Usecase:** Hiển thị văn bản có thể định dạng, hỗ trợ nhiều font, kích thước, căn chỉnh, và tự động điều chỉnh kích thước font (dynamic font size).

*   **Schema (`types.ts`):** Rất phong phú, bao gồm `fontName`, `alignment`, `verticalAlignment`, `fontSize`, `lineHeight`, `characterSpacing`, `fontColor`, `backgroundColor`, `strikethrough`, `underline`, và đặc biệt là `dynamicFontSize` (một object chứa `min`, `max`, `fit`).

*   **UI Render (`uiRender.ts`):**
    -   **Chế độ Editable:** Sử dụng một `div` với thuộc tính `contentEditable="plaintext-only"` để người dùng nhập liệu. Điều này ngăn người dùng paste văn bản có định dạng.
    -   **Firefox Workaround:** `makeElementPlainTextContentEditable` là một chi tiết quan trọng. Vì Firefox không hỗ trợ `plaintext-only`, hàm này bắt các sự kiện `keydown` (Enter) và `paste` để mô phỏng lại hành vi đó, đảm bảo tính nhất quán giữa các trình duyệt.
    -   **Dynamic Font Size:** Khi bật, một event listener `keyup` được thêm vào. Sau mỗi lần gõ, `calculateDynamicFontSize` được gọi để tính toán lại kích thước font phù hợp và cập nhật style của `div`.
    -   **Canh chỉnh dọc (Vertical Alignment):** `getBrowserVerticalFontAdjustments` là một hàm cực kỳ tinh vi. Nó tính toán các `padding` và `margin` cần thiết để văn bản hiển thị trên `div` khớp chính xác với vị trí của nó trên file PDF, tránh hiện tượng "nhảy" văn bản giữa chế độ xem và chỉnh sửa.
    -   **Unsupported Characters:** `replaceUnsupportedChars` kiểm tra từng ký tự xem font hiện tại có hỗ trợ không. Nếu không, nó sẽ thay thế bằng ký tự `〿`, giúp người dùng biết được vấn đề.

*   **PDF Render (`pdfRender.ts`):**
    -   **Font Embedding:** Nhúng font vào PDF bằng `pdfDoc.embedFont` và cache lại kết quả để tối ưu hiệu suất.
    -   **Line Wrapping:** Sử dụng `splitTextToSize` để ngắt dòng văn bản sao cho vừa với chiều rộng của box.
    -   **Line Breaking Logic (`helper.ts` -> `getSplittedLinesBySegmenter`):** Đây là phần xử lý thông minh nhất. Nó không chỉ ngắt dòng ở khoảng trắng mà sử dụng `Intl.Segmenter` để ngắt dòng theo từ, hỗ trợ nhiều ngôn ngữ tốt hơn. Đặc biệt, nó có logic "cấm則処理" (`filterStartJP`, `filterEndJP`) cho tiếng Nhật, ngăn các ký tự không được phép xuất hiện ở đầu hoặc cuối dòng.
    -   **Vẽ Text:** Duyệt qua từng dòng đã ngắt và vẽ chúng bằng `page.drawText`. Nó tính toán `yOffset` cho canh chỉnh dọc và `xLine` cho canh chỉnh ngang.
    -   **Strikethrough & Underline:** Không phải là thuộc tính của text trong `pdf-lib`. Plugin này tự vẽ chúng bằng cách sử dụng `page.drawLine`.
    -   **Rotation:** Áp dụng phép quay cho từng dòng một cách độc lập, đảm bảo toàn bộ khối văn bản được xoay chính xác quanh tâm của nó.

*   **Prop Panel (`propPanel.ts`):**
    -   Sử dụng một widget tùy chỉnh `UseDynamicFontSize` (một checkbox) để bật/tắt và hiển thị các tùy chọn cho dynamic font size.
    -   `getExtraFormatterSchema` tạo ra một `ButtonGroup` cho các định dạng nhanh như gạch chân, gạch ngang, và các loại căn chỉnh.

### 2.2. Multi-Variable Text Plugin (`plugin/multiVariableText/*`)

Đây là một "wrapper" plugin, mở rộng từ Text plugin.

*   **Usecase:** Tạo ra các mẫu văn bản với các "biến" (variables) có thể được điền dữ liệu vào sau. Ví dụ: "Chào {tên}, bạn sống ở {thành phố}."

*   **Schema (`types.ts`):** Kế thừa `TextSchema` và thêm `text` (chuỗi mẫu) và `variables` (mảng tên các biến).

*   **UI Render (`uiRender.ts`):** Rất thông minh và có hai chế độ hoạt động:
    -   **Designer Mode:** Hoạt động như một Text plugin bình thường. Người dùng gõ văn bản và các biến (ví dụ: `{ten}`). Một event listener `keyup` sẽ phân tích văn bản để tự động cập nhật danh sách biến trong schema.
    -   **Form Mode:** Đây là điểm đặc biệt. Nó không tạo một `contentEditable` cho toàn bộ box. Thay vào đó, nó phân tích chuỗi mẫu, hiển thị các phần văn bản tĩnh như bình thường, và tạo ra các `span` `contentEditable` riêng biệt **chỉ cho các biến**. Điều này cho phép người dùng chỉ điền vào các biến mà không thể thay đổi phần văn bản tĩnh.

*   **PDF Render (`pdfRender.ts`):**
    -   Trước khi render, nó gọi `substituteVariables` để thay thế các placeholder `{variable}` trong `schema.text` bằng dữ liệu từ `value` (một chuỗi JSON).
    -   Sau đó, nó gọi `pdfRender` của Text plugin gốc với chuỗi văn bản đã được thay thế.
    -   Có logic `validateVariables` để kiểm tra xem các biến bắt buộc có được cung cấp không.

*   **Prop Panel (`propPanel.ts`):**
    -   Sử dụng widget tùy chỉnh `mapDynamicVariables` để tự động tạo ra các `textarea` cho mỗi biến được tìm thấy trong `schema.text`. Người dùng có thể nhập dữ liệu mẫu cho các biến này.

### 2.3. Image Plugin (`plugin/graphics/image.ts`)

*   **Usecase:** Chèn hình ảnh (JPG, PNG) vào tài liệu.

*   **UI Render:**
    -   Khi không có ảnh, hiển thị một `input type="file"` cho phép người dùng tải lên.
    -   Khi có ảnh, hiển thị ảnh bằng thẻ `<img>`.
    -   Trong chế độ editable, có một nút "x" để xóa ảnh.
    -   Sử dụng `readFile` từ `utils.ts` để đọc file và chuyển thành chuỗi base64.

*   **PDF Render:**
    -   Sử dụng `pdfDoc.embedJpg` hoặc `pdfDoc.embedPng` để nhúng ảnh. Kết quả được cache lại.
    -   **Aspect Ratio Handling:** Một chi tiết quan trọng là nó không kéo dãn ảnh. Nó tính toán lại `width` và `height` của ảnh để vừa với box mà vẫn giữ đúng tỷ lệ khung hình, sau đó căn giữa ảnh trong box.
    -   `imagehelper.ts` chứa logic được port từ thư viện `image-size` để đọc kích thước (dimension) của ảnh từ dữ liệu buffer, giúp tính toán tỷ lệ khung hình.

### 2.4. SVG Plugin (`plugin/graphics/svg.ts`)

*   **Usecase:** Chèn đồ họa vector SVG.

*   **UI Render:**
    -   **Editable Mode:** Hiển thị một `textarea` cho phép người dùng dán mã SVG vào. Đồng thời, nó cũng render SVG đó ra để xem trước. Nếu SVG không hợp lệ, nó hiển thị `createErrorElm`.
    -   **Viewer Mode:** Chỉ đơn giản là render SVG bằng cách gán vào `innerHTML` của một `div`.

*   **PDF Render:**
    -   Sử dụng `page.drawSvg` của `pdf-lib` để vẽ SVG lên trang.
    -   Hàm `isValidSVG` thực hiện kiểm tra cơ bản để đảm bảo chuỗi đầu vào là một SVG hợp lệ trước khi render.

### 2.5. Shape Plugins (`plugin/shapes/*`)

Bao gồm `line`, `rectangle`, và `ellipse`.

*   **Usecase:** Vẽ các hình khối cơ bản.

*   **UI Render:** Rất đơn giản, sử dụng các `div` và các thuộc tính CSS tương ứng (`border-width`, `border-color`, `background-color`, `border-radius` cho ellipse).

*   **PDF Render:**
    -   Sử dụng các hàm vẽ gốc của `pdf-lib`: `page.drawLine`, `page.drawRectangle`, `page.drawEllipse`.
    -   Plugin `rectangle` có logic xử lý `radius` (góc bo tròn).
    -   Logic xoay của `rectangle` khá phức tạp để bù trừ cho độ dày của đường viền khi xoay.

### 2.6. Barcode Plugins (`plugin/barcodes/*`)

Đây là một tập hợp các plugin, mỗi plugin cho một loại mã vạch.

*   **Usecase:** Tạo và hiển thị nhiều loại mã vạch khác nhau (QRCode, EAN13, Code128, etc.).

*   **Kiến trúc:** `barcodes/index.ts` tự động tạo ra một đối tượng plugin cho mỗi loại trong `BARCODE_TYPES`. Điều này giúp tái sử dụng code tối đa.

*   **Core Logic (`helper.ts`):**
    -   Sử dụng thư viện `bwip-js` làm engine tạo mã vạch.
    -   `createBarCode` là hàm chính, nó cấu hình các tùy chọn cho `bwip-js` (như `text`, `scale`, `barcolor`, `backgroundcolor`) và gọi hàm `toCanvas` (trên client) hoặc `toBuffer` (trên server) để tạo ảnh mã vạch.
    -   `validateBarcodeInput` chứa các biểu thức chính quy (regex) và logic kiểm tra (ví dụ: check-digit) rất cụ thể cho từng loại mã vạch. Đây là phần logic nghiệp vụ quan trọng.

*   **UI Render (`uiRender.ts`):**
    -   Trong chế độ editable, nó hiển thị một `input` để người dùng nhập dữ liệu.
    -   Sau khi nhập, nó gọi `validateBarcodeInput`. Nếu hợp lệ, nó gọi `createBarCode` để tạo ảnh, chuyển thành data URL và hiển thị bằng thẻ `<img>`. Nếu không hợp lệ, hiển thị lỗi.

*   **PDF Render (`pdfRender.ts`):**
    -   Tương tự UI, nó tạo ảnh mã vạch bằng `createBarCode`, sau đó nhúng ảnh PNG này vào PDF bằng `pdfDoc.embedPng` và vẽ nó bằng `page.drawImage`.
    -   Có cơ chế cache để không phải tạo lại và nhúng lại cùng một mã vạch nhiều lần.

### 2.7. Table Plugin (`plugin/tables/*`) - Phân tích chuyên sâu

Đây là plugin phức tạp nhất, về cơ bản là một mini-framework để vẽ bảng.

*   **Usecase:** Tạo các bảng biểu phức tạp, có thể tùy chỉnh style, tự động ngắt trang, và có các hàng/cột có thể thay đổi kích thước động.

*   **Kiến trúc:** Rất module hóa. `index.ts` là điểm vào, nhưng logic chính nằm ở các file khác:
    -   `classes.ts`: Định nghĩa các lớp `Table`, `Row`, `Column`, `Cell`. Đây là mô hình dữ liệu (data model) của bảng.
    -   `tableHelper.ts`: Chứa logic để phân tích `TableSchema` và dữ liệu đầu vào, sau đó khởi tạo các đối tượng từ `classes.ts`.
    -   `pdfRender.ts` & `uiRender.ts`: Logic render cho PDF và UI.
    -   `cell.ts`: Một plugin con, chịu trách nhiệm render **một ô duy nhất**. Table plugin là một tập hợp của các Cell plugin.

*   **Luồng tính toán (Calculation Flow - trong `classes.ts`):**
    1.  **Initialization:** `createSingleTable` trong `tableHelper.ts` được gọi. Nó phân tích schema, tạo ra một `TableInput` object.
    2.  **Object Creation:** `Table.create` được gọi. Nó tạo các instance của `Table`, `Row`, `Column`, `Cell`.
    3.  **Width Calculation (`calculateWidths`):** Đây là trái tim của plugin.
        -   Nó tính toán chiều rộng cần thiết cho mỗi cột dựa trên nội dung (dùng `widthOfTextAtSize`), chiều rộng tối thiểu (`minReadableWidth` - chiều rộng của từ dài nhất), và các cài đặt `cellWidth` từ schema.
        -   Sau đó, nó phân bổ không gian còn lại (hoặc thiếu) của bảng cho các cột có thể thay đổi kích thước (`resizableColumns`) bằng hàm `resizeColumns`. Đây là một thuật toán đệ quy để đảm bảo phân bổ công bằng.
    4.  **Content Fitting (`fitContent`):** Sau khi có chiều rộng cột cuối cùng, nó tiến hành ngắt dòng văn bản trong mỗi ô bằng `splitTextToSize`.
    5.  **Height Calculation:** Chiều cao của mỗi hàng (`row.height`) được xác định bởi ô cao nhất trong hàng đó. Chiều cao của toàn bộ bảng là tổng chiều cao của các hàng.

*   **UI Render (`uiRender.ts`):**
    -   Nó không vẽ bảng như một thực thể duy nhất. Thay vào đó, nó duyệt qua `table.head` và `table.body` đã được tính toán, và với mỗi ô, nó tạo một `div` và gọi `cell.ui` để render nội dung ô đó.
    -   **Interactivity (Designer Mode):**
        -   **Column Resizing:** Tạo ra các `div` `dragHandle` giữa các cột. Nó sử dụng các sự kiện `mousedown`, `mousemove`, `mouseup` để theo dõi hành vi kéo của người dùng. Khi `mouseup`, nó tính toán lại `headWidthPercentages` và gọi `onChange` để cập nhật schema.
        -   **Add/Remove Rows/Columns:** Tạo ra các nút `+` và `-`. Khi được click, chúng sửa đổi trực tiếp dữ liệu (`schema.content`, `schema.head`) và gọi `onChange`.
    -   **Cell Editing:** Quản lý trạng thái ô đang được chỉnh sửa (`editingPosition`). Khi một ô được click, nó sẽ render lại toàn bộ bảng, và truyền `mode='designer'` cho `cell.ui` của ô đó, cho phép chỉnh sửa nội dung.

*   **PDF Render (`pdfRender.ts`):**
    -   Tương tự UI, nó duyệt qua các đối tượng `Table`, `Row`, `Cell` đã được tính toán.
    -   Với mỗi `Cell`, nó gọi `cell.pdf` để vẽ ô đó (bao gồm background, border, và text).
    -   Cuối cùng, nó vẽ đường viền bên ngoài của toàn bộ bảng bằng cách sử dụng `rectangle.pdf`.

*   **Cell Plugin (`cell.ts`):**
    -   Là một plugin hoàn chỉnh nhưng được sử dụng nội bộ.
    -   **PDF:** Vẽ background (dùng `rectangle.pdf`), sau đó vẽ 4 đường border (dùng `line.pdf`), và cuối cùng vẽ text (dùng `text.pdf`).
    -   **UI:** Tạo `div` cho background, 4 `div` cho 4 đường border, và một `div` con để gọi `text.ui` render nội dung.

### 2.8. Form Control Plugins (`checkbox`, `radioGroup`, `select`)

Đây là các plugin chuyên dụng cho việc tạo form.

*   **Checkbox & RadioGroup:**
    -   **Usecase:** Tạo các ô check và nút radio.
    -   **Kiến trúc:** Là wrapper của `svg` plugin. Chúng không vẽ hình dạng mà chỉ thay đổi giá trị `value` (một chuỗi SVG) của `svg` plugin dựa trên trạng thái (checked/unchecked).
    -   **RadioGroup Logic:** Có một logic đặc biệt. Nó sử dụng một `EventTarget` toàn cục. Khi một radio button trong một nhóm (`schema.group`) được chọn, nó sẽ phát ra một sự kiện. Các radio button khác trong cùng nhóm sẽ lắng nghe sự kiện này và tự bỏ chọn nếu chúng đang được chọn.

*   **Select:**
    -   **Usecase:** Tạo dropdown list.
    -   **Kiến trúc:** Là wrapper của `text` plugin.
    -   **UI Render:** Nó render văn bản đã chọn bằng `text.ui`. Sau đó, nó tạo một thẻ `<select>` trong suốt và đặt nó đè lên trên. Người dùng thực chất tương tác với thẻ `<select>` này. Khi giá trị thay đổi, nó gọi `onChange`.
    -   **Prop Panel:** Có một widget tùy chỉnh `addOptions` để người dùng có thể thêm/xóa/sửa các lựa chọn trong dropdown.

### 2.9. Date/Time Plugins (`date`, `time`, `dateTime`)

*   **Usecase:** Cung cấp một giao diện chọn ngày/giờ thân thiện.

*   **Kiến trúc:** Là wrapper của `text` plugin, nhưng với UI được cung cấp bởi thư viện `air-datepicker`.
*   **Helper (`helper.ts`):**
    -   Chứa toàn bộ logic phức tạp. Nó nhúng CSS của `air-datepicker` vào trang.
    -   Cung cấp một `LOCALE_MAP` để hỗ trợ đa ngôn ngữ cho date picker.
    -   Khi người dùng click vào, nó sẽ khởi tạo và hiển thị `AirDatepicker`.
    -   Khi một ngày được chọn, nó sẽ format ngày đó theo `schema.format` và gọi `onChange` để cập nhật `value`.
    -   `getFmtValue` và `getFmtContent` xử lý việc chuyển đổi giữa định dạng lưu trữ (ví dụ: `2023/12/25`) và định dạng hiển thị (ví dụ: `December 25, 2023`).

*   **PDF Render:** Đơn giản là gọi `text.pdf` với giá trị ngày đã được format.