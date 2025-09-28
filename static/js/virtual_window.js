const title_list = {
    423246183: "Online Tetris Neo2（423246183）",
    1000009994: "TETRIS Beta（1000009994）",
    1214772816: "AMONG US（1214772816）",
    1219865515: "AMONG US（鬼ごっこ）（1219865515）"
}



function create_virtual_window(pid) {
    let offsetX, offsetY, isDragging = false;
    let isResizing = false;
    let startWidth, startHeight, startX, startY;
    let iframeLoaded = false; // iframeが読み込まれたかどうかを追跡するフラグ

    const vw = document.createElement("div")
    vw.classList.add("virtual-window")

    const header = document.createElement("div")
    header.classList.add("header")


    const title = document.createElement("span")
    title.innerHTML = title_list[pid]

    const button = document.createElement("button")
    button.innerHTML = `<img src="./static/img/close_line.svg">`
    button.addEventListener("click", e => {
        vw.remove()
    })

    const content = document.createElement("div")
    content.classList.add("content")

    const iframe = document.createElement("iframe")
    iframe.src = `https://turbowarp.org/${pid}/embed`
    iframe.scrolling = "no"
    iframe.allowFullscreen = true

    const resizeHandle = document.createElement("div")
    resizeHandle.classList.add("resize-handle")


    // 仮想ウィンドウのドラッグ機能
    header.addEventListener("mousedown", e => {
        isDragging = true;
        offsetX = e.clientX - vw.offsetLeft;
        offsetY = e.clientY - vw.offsetTop;

        iframe.style.pointerEvents = "none"; // ドラッグ中はiframeのイベントを無効化
    });

    // 仮想ウィンドウのリサイズ機能
    resizeHandle.addEventListener("mousedown", e => {
        e.preventDefault(); // デフォルトのドラッグ動作を防止
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = vw.offsetWidth;
        startHeight = vw.offsetHeight;

        iframe.style.pointerEvents = "none"; // リサイズ中はiframeのイベントを無効化
    });

    // 全体のマウスアップイベント（ドラッグまたはリサイズ終了）
    document.addEventListener("mouseup", () => {
        isDragging = false;
        isResizing = false;
        iframe.style.pointerEvents = "auto"; // 操作終了後にiframeのイベントを有効化
    });

    // 全体のマウスムーブイベント（ドラッグまたはリサイズ中の処理）
    document.addEventListener("mousemove", e => {
        if (isDragging) {
            vw.style.left = (e.clientX - offsetX) + "px";
            vw.style.top = (e.clientY - offsetY) + "px";
        }

        if (isResizing) {
            const newWidth = startWidth + (e.clientX - startX);
            const newHeight = startHeight + (e.clientY - startY);

            // 最小サイズを下回らないようにする
            vw.style.width = Math.max(150, newWidth) + "px";
            vw.style.height = Math.max(100, newHeight) + "px";
        }
    });




    content.appendChild(resizeHandle)
    content.appendChild(iframe)
    header.appendChild(title)
    header.appendChild(button)
    vw.appendChild(header)
    vw.appendChild(content)
    document.body.appendChild(vw)
}