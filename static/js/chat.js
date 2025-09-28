const username = window.prompt("ユーザー名を入力してください", "");
const password = window.prompt("パスワードを入力してください", "");



cookies_dict = {
    pid: undefined,
    username: username,
    session: null,
    uid: undefined
}
fetch('/github-login', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
})
    .then(response => {
        if (!response.ok) throw new Error('ログイン失敗');
        return response.json();
    })
    .then(data => {
        cookies_dict.pid = data.pid
        cookies_dict.uid = data.uid
    })
    .catch(error => {
        location.reload()
    });

// cookies_dict = {
//     pid: '10000',
//     username: 'cosmo-zero ',
//     session: null,
//     uid: '3656317'
// }

// const connect_url = "http://localhost:5000"
const connect_url = "https://neo2stats.f5.si"
const credentials = {
    username: username,
    password: password
};
const socket = io(connect_url, {
    auth: credentials
});





const messageSound = document.getElementById('messageSound');
const mentionSound = document.getElementById('mentionSound');
const onlineMembersDiv = document.querySelector('.online-members');
const upload_confirm = document.querySelector('.upload-confirm');
const upload_confirm_panel = document.querySelector('.upload-confirm-panel');
const imagePreview = document.querySelector(".upload-confirm-panel img");
const page_icon = document.querySelector("head #page-icon");

var last_chat_username = "";
var reaction_dict = {};
var reply_mode = false;
var reply_message_id = ""
let chat_icon_showed_unix = 0
// ログ表示
var chat_log = {}
const username = cookies_dict["username"]
const suid = cookies_dict["uid"]
const my_icon_url = `https://cdn2.scratch.mit.edu/get_image/user/${suid}_90x90.png?v=`
const server_chat_log = userData["chat_log"]["log"]
server_chat_log.forEach(message_dict => {
    handle_message_from_server(message_dict, log_load = true)
})


// ログをセットした後に下にスクロール
let messages = document.getElementById("messages");
messages.scrollTop = messages.scrollHeight;
// テキスト入力欄自動拡張用
const textarea = document.getElementById("messageInput");

// リアクションのセット
const reactions = ["👍", "⭕", "❌", "⁉️", "❗", "❓", "🚫", "⛔", "💯", "💢", "⚠️", "✅", "❤️", "💔", "💤", "👌", "✋", "🔥", "💦", "🌱", "👀", "🎉", "😆", "🥲", "😭", "😡", "🤔", "😇", "🤯", "😩", "😅", "🤮", "🥰", "😍", "😨", "🥹", "🥶", "🥵", "🫠", "😎"]
let reaction_list_html = ""
for (let i = 0; i < reactions.length; i += 5) {
    const bag = reactions.slice(i, i + 5)
    reaction_list_html += `<ul class="reaction-list">`
    bag.forEach(element => {
        reaction_list_html += `<li onclick="addReaction('messageId', '${element}')">${element}</li>`
    });
    reaction_list_html += `</ul>`
}


// 入室を通知
socket_send({ "type": "join" })

socket.emit('chat_join', { "token": authToken });




function socket_send(data) {
    const text = data["text"]
    if (text) {
        // 空白ならキャンセル　改行は<br>に置き換え
        if (text === "") return
        // data["text"] = text.replace(/\n/g, "<br>");
    }

    data["username"] = username
    data["icon"] = my_icon_url
    data["token"] = authToken
    const fullMessage = JSON.stringify(data)
    socket.send(fullMessage)
}


// メッセージ送信
function sendMessage() {
    const input = document.getElementById("messageInput");
    const text = input.value.trim();
    if (text.length > 3000) {
        alert(`3000文字以内にしてください（${text.length} 文字）`)
        return
    }
    if (text.length === 0) {
        return
    }
    option = []
    if (reply_mode) {
        socket_send({
            "type": "reply",
            "text": text,
            "reply_message_id": reply_message_id
        })
        reply_quit()
    } else {
        socket_send({
            "type": "normal",
            "text": text
        })
    }
    input.value = "";
    input.style.height = "auto"; // 一旦リセット
}

// 右クリックメニューを表示する関数
function showContextMenu(x, y, messageId) {
    try {
        // すでにあるコンテキストメニューを削除する
        const oldMenu = document.querySelector(".context-menu");
        if (oldMenu) {
            oldMenu.remove();
        }
        const contextMenu = document.createElement("div");
        contextMenu.classList.add("context-menu");
        contextMenu.style.position = "absolute";
        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;

        // 右クリックメニューのhtml
        let delete_button
        if (is_supporter && chat_log[messageId]["username"] === username) {
            delete_button = `
        <button class="delete-button" onclick="delete_pressed('${messageId}')">
            <span>削除する</span>
            <img src="/static/img/delete_message.svg">
        </button>`
        } else {
            delete_button = ``
        }
        contextMenu.innerHTML = `
        <button class="reply_button" onclick="reply_pressed('${messageId}')">
            <span>返信する</span>
            <img src="/static/img/reply_message.svg">
        </button>
        ${delete_button}
        <ul class="reaction-table">
            ${reaction_list_html.replaceAll("messageId", messageId)}
        </ul>
    `;

        // メニューをDOMに追加
        document.body.appendChild(contextMenu);

        // メニューがクリックされた後に非表示にする
        document.addEventListener("click", () => {
            contextMenu.remove();
        });
    } catch (error) {
        print(error)
    }
}

// リアクション追加をサーバーに知らせる関数
function addReaction(messageId, reaction) {
    socket_send({
        "type": "toggle_reaction",
        "reaction_message_id": messageId,
        "reaction": reaction
    })
}

// エスケープする関数
function escapeHTML(str) {
    return str.replace(/[&<>"']/g, function (match) {
        const escape = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
        };
        return escape[match];
    });
}


// 返信モードをセットする関数
function reply_pressed(message_id) {
    reply_mode = true
    reply_message_id = message_id

    const oldMenu = document.querySelector(".reply_bar_div");
    if (oldMenu) {
        oldMenu.remove();
    }

    const message_object = reaction_dict[message_id];
    const replyed_username = chat_log[message_id]["username"];
    const chat_container = document.querySelector('.bottom-menu');
    const reply_bar = document.createElement("div");
    reply_bar.classList.add("reply_bar_div");
    reply_bar.ondblclick = reply_quit
    reply_bar.title = "ダブルクリックで返信を取り消し"
    reply_bar.innerHTML = `
        <div class="reply-bar-texts">
            <strong class="replyed_username">
                ${replyed_username}
            </strong>
            <span>
                に返信中
            </span>
        </div>
        <img src="./static/img/close.svg" class="reply_bar_close_button" onclick="reply_quit()">
    `;
    chat_container.prepend(reply_bar);

    // 入力欄にフォーカス
    const input = document.getElementById("messageInput");
    input.focus();

    // スクロール調整処理
    const messages = document.getElementById("messages");
    scroll_adjust()
}


// 返信モードを終了する関数
function reply_quit() {
    reply_mode = false
    const oldMenu = document.querySelector(".reply_bar_div");
    if (oldMenu) oldMenu.remove();
}


// 削除ボタンが押されたときの処理
function delete_pressed(messageId) {
    socket_send({
        "type": "delete",
        "delete_message_id": messageId
    })
}


/////////////////////////////////////////////////////////
// ——————————————メッセージを読み込んで表示——————————————//
/////////////////////////////////////////////////////////
function show_message(message_dict, log_load = false) {
    try {
        var type = message_dict["type"];
        var uname = message_dict["username"];
        var unixtime = message_dict["time"];
        var text = message_dict["text"];
        var icon = message_dict["icon"];
        var option = message_dict["option"];
        var message_id = message_dict["message_id"];
        var color = message_dict["color"];
        const messages = document.getElementById("messages");
        text = text.replace(/\n/g, "<br>");

        chat_log[message_id] = {
            "username": uname,
            "text": text,
            "type": type,
            "icon": icon,
            "color": color
        }

        const SCROLL_THRESHOLD = 100;
        const shouldScroll = messages.scrollHeight - messages.scrollTop - messages.clientHeight < SCROLL_THRESHOLD;

        // unix => 日時
        const date = new Date(unixtime * 1000);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');

        const now = new Date();
        const day_now = now.getDate();

        let time
        if (day_now != day) {
            time = `${month}/${day} `
        } else {
            time = ""
        }

        time += `${hours}:${minutes}`

        // アイコン再表示処理
        if ((unixtime - chat_icon_showed_unix) > 3600) {
            last_chat_username = ""
        }



        // リンク & メンション検知
        if (type === "normal" || type === "reply") {
            // URLにマッチする正規表現
            const urlRegex = /(https?:\/\/|www\.)[a-zA-Z0-9./\-_?=&%#:;]+/g;
            // replaceメソッドと関数を使って、見つかったURLを<a>タグに置換する
            text = text.replace(urlRegex, (url) => {
                url_id = message_id

                replace_url(url, url_id)

                // マッチしたURLが'http'で始まらない場合、'http://'を先頭に追加する
                const fullUrl = url.startsWith('http') ? url : `http://${url}`;

                // <a>タグのHTML文字列を組み立てて返す
                return `<a href="${fullUrl}" target="_blank" rel="noopener noreferrer" data-url-id="${url_id}">${url}</a>`;
            });

            // メンション部分を加工
            text = text.replace(/@([a-zA-Z0-9_-]+)/g, '<div class="mentioned_username">$&</div>');
        }








        if (type === "normal" || type === "img") {
            // 通常のメッセージ

            const messageDiv = document.createElement("div");
            messageDiv.classList.add("message");
            messageDiv.setAttribute("data-message-id", message_id);

            if (type == "normal") {
                message_content = `<div class="text_div">${text}</div>`
            } else {
                message_content = `<div class="text_div"><a href="${text}" target="_blank"><img src="${text}" class="message-img"></a></div></a>`
            }

            if (uname === last_chat_username) {
                messageDiv.innerHTML = `
                    <div class="icon_div"></div>
                    <div class="info_text_div">
                        ${message_content}
                        <div class="reaction_div"></div>
                    </div>
                `;
                messages.appendChild(messageDiv);
            } else {
                chat_icon_showed_unix = unixtime
                const margin = document.createElement("div");
                margin.classList.add("chat-margin");
                messages.appendChild(margin);

                messageDiv.innerHTML = `
                        <div class="icon_div"><img class="chat_icon" src="${icon}"></div>
                        <div class="info_text_div">
                            <div class="info_div"><span class="username usercolor">${uname}</span><span class="time">${time}</span></div>
                            ${message_content}
                            <div class="reaction_div"></div>
                        </div>
                    `;
                // ユーザー名の色セット
                const usernameSpan = messageDiv.querySelector(".usercolor")
                usernameSpan.style.setProperty("color", color)
                messages.appendChild(messageDiv);
            }

        } else if (type === "reply") {
            // 返信
            chat_icon_showed_unix = unixtime

            const replyed_message_id = message_dict["reply_message_id"]
            const replyed_icon = chat_log[replyed_message_id]["icon"]
            const replyed_username = chat_log[replyed_message_id]["username"]
            var replyed_text = chat_log[replyed_message_id]["text"]
            if (replyed_text.length > 50) {
                replyed_text = replyed_text.slice(0, 50) + "...";
            }
            replyed_text = replyed_text.replace(/<br\s*\/?>/gi, "");
            const replyed_color = chat_log[replyed_message_id]["color"]

            const margin = document.createElement("div");
            margin.classList.add("chat-margin");
            messages.appendChild(margin);

            const messageDiv = document.createElement("div");
            messageDiv.classList.add("message");
            messageDiv.setAttribute('data-message-id', message_id);

            messageDiv.innerHTML = `
                <div class="icon_div">
                    <div class="reply_line">
                        <img src="./static/img/reply_line.svg">
                    </div>
                    <img class="chat_icon" src="${icon}">
                </div>
                <div class="info_text_div">
                    <div class="reply_to" onclick="reply_jump(event)" data-message-id=${replyed_message_id}>
                        <img src="${replyed_icon}">
                        <span class="reply_to_username">${replyed_username}</span>
                        <p class="reply_to_text">${replyed_text}</p>
                    </div>
                    <div class="info_div"><span class="username">${uname}</span><span class="time">${time}</span></div>
                    <div class="text_div">${text}</div>
                    <div class="reaction_div"></div>
                </div>
            `;
            messages.appendChild(messageDiv);

            // ユーザー名の色セット
            const usernameSpans_reply = messageDiv.querySelector(".reply_to_username");
            usernameSpans_reply.style.setProperty("color", replyed_color);
            const usernameSpans = messageDiv.querySelector(".username");
            usernameSpans.style.setProperty("color", color);

        } else if (type === "server") {
            const messageDiv = document.createElement("div");
            messageDiv.classList.add("message_center");
            messageDiv.innerHTML = `${text}`;
            messages.appendChild(messageDiv);

        } else if (type === "join" || type === "leave") {
            // 参加通知
            const messageDiv = document.createElement("div");
            messageDiv.classList.add("message_join");
            messageDiv.classList.add("message_center");

            messageDiv.innerHTML = text;
            messages.appendChild(messageDiv);

        } else if (type === "connection_change") {
            // 接続変化検知
            const messageDiv = document.createElement("div");
            messageDiv.classList.add("message_center");
            messageDiv.classList.add("connection_change");
            messageDiv.innerHTML = text;
            messages.appendChild(messageDiv);
        }

        last_chat_username = uname;
        if (!(type === "normal" || type === "reply" || type === "img")) {
            last_chat_username = ""
        }

        // スクロール
        if (shouldScroll) {
            messages.scrollTop = messages.scrollHeight;
        }

        // 通知音処理
        if (["normal", "img", "reply"].includes(type)) {
            if (text.includes(`@${username}`)) {
                if (!log_load) {
                    mentionSound.currentTime = 0;
                    mentionSound.play().catch(err => console.error("再生エラー:", err));

                    print(document.hidden)
                    if (document.hidden) {
                        page_icon.href = "/static/img/favicon_notification.ico"
                    }
                }
            } else {
                messageSound.currentTime = 0;
                messageSound.play().catch(err => console.error("再生エラー:", err));
            }
        }
    } catch (error) {
        console.log(`error ${error}`)
    }

}



// リンクが画像なら置き換え
async function replace_url(url, id) {
    // 新しいImageオブジェクトを作成
    const img = new Image();

    // 画像の読み込みに成功した場合の処理
    img.onload = function () {
        const url_el = document.querySelector(`.message a[data-url-id="${id}"]`); // 修正: datasetではなくdata-idセレクタを使用
        if (url_el) {
            url_el.innerHTML = `<img src="${url}" class="message-img">`;
        }
        scroll_adjust(true)
    };

    // 画像の読み込みに失敗した場合の処理（画像でない、リンク切れなど）
    img.onerror = function () {
        // 何もしないので、リンクはリンクのまま残る
    };

    // この行で画像の読み込みが開始される
    img.src = url;
}



function scroll_adjust(img = false) {
    let SCROLL_THRESHOLD
    if (img) {
        SCROLL_THRESHOLD = 400;
    } else {
        SCROLL_THRESHOLD = 100;
    }

    const shouldScroll = messages.scrollHeight - messages.scrollTop - messages.clientHeight < SCROLL_THRESHOLD;
    if (shouldScroll) {
        messages.scrollTop = messages.scrollHeight;
    }
}



// 返信にジャンプ
function reply_jump(event) {
    const target_id = event.currentTarget.dataset.messageId
    const target = document.querySelector(`.message[data-message-id="${target_id}"]`)
    if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        // 任意: 一時的に背景色などで強調も可能
        target.classList.add("jump-highlight");
        setTimeout(() => {
            target.classList.remove("jump-highlight");
        }, 2000);
    }
}



// websocket―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――



// メッセージ受信
socket.on("message", data => {
    const message_dict = JSON.parse(data)
    handle_message_from_server(message_dict)
});








function handle_message_from_server(message, log_load = false) {
    const message_type = message["type"]
    if (message_type === "toggle_reaction") {
        toggle_reaction(message)
    } else if (message_type === "delete") {
        delete_message(message)
    } else {
        show_message(message, log_load)
    }
}



// リアクション切り替え
function toggle_reaction(message_dict) {
    try {
        const message_username = message_dict["username"];
        const message_id = message_dict["reaction_message_id"];
        const reaction = message_dict["reaction"];
        const messageDiv = document.querySelector(`[data-message-id="${message_id}"]`);
        const info_textDiv = messageDiv.querySelector('.info_text_div');
        const reactionDiv = info_textDiv.querySelector('.reaction_div');

        const message_object = reaction_dict[message_id];
        if (message_object) {
            const reaction_list = message_object[message_username];
            if (reaction_list) {
                if (reaction_list.includes(reaction)) {
                    reaction_list.splice(reaction_list.indexOf(reaction), 1);
                } else {
                    reaction_list.push(reaction);
                }
            } else {
                reaction_dict[message_id][message_username] = [reaction];
            }
        } else {
            reaction_dict[message_id] = {};
            reaction_dict[message_id][message_username] = [reaction];
        }

        // リアクションの数をまとめる
        const reaction_count = {}
        const new_message_object = reaction_dict[message_id]
        Object.keys(new_message_object).forEach(key =>
            new_message_object[key].forEach(reaction => {
                if (reaction_count[reaction]) {
                    reaction_count[reaction].push(key)
                } else {
                    reaction_count[reaction] = [key]
                }
            }
            )
        )

        reactionDiv.innerHTML = "";
        Object.keys(reaction_count).forEach(key => {
            const newReaction = document.createElement("div");
            newReaction.classList.add("reaction_box");
            newReaction.innerText = `${key} ${reaction_count[key].length}`;

            const tooltipText = reaction_count[key].join("\n");

            // カスタムツールチップ表示
            newReaction.addEventListener("mouseenter", () => {
                const tooltip = document.createElement("div");
                tooltip.classList.add("tooltip");
                tooltip.innerText = tooltipText;
                newReaction.appendChild(tooltip);

                const rect = newReaction.getBoundingClientRect();
                tooltip.style.left = `${rect.left + window.scrollX}px`;
                tooltip.style.top = `${rect.top + window.scrollY - tooltip.offsetHeight - 8}px`;

                requestAnimationFrame(() => tooltip.classList.add("show"));
                newReaction._tooltip = tooltip;
            });

            newReaction.addEventListener("mouseleave", () => {
                const tooltip = newReaction._tooltip;
                if (tooltip) {
                    tooltip.classList.remove("show");
                    setTimeout(() => tooltip.remove(), 200);
                    newReaction._tooltip = null;
                }
            });

            reactionDiv.appendChild(newReaction);
        });
    } catch (error) {
        print(error)
    }
}


// メッセージを削除
function delete_message(message_dict) {
    try {
        const id = message_dict["delete_message_id"]
        const delete_user = message_dict["username"]

        if (delete_user !== chat_log[id]["username"]) {
            return
        }

        const message_content = document.querySelector(`.message[data-message-id="${id}"] .text_div`)
        if (message_content) {
            message_content.innerHTML = `<span class="deleted">削除されました</span>`
        }
        delete chat_log[id]
    } catch (error) {
        print(error)
    }
}






// ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――






// htmlを読み込んだ後に実行される処理
document.addEventListener("DOMContentLoaded", () => {


    // Enterキーで送信する処理 & 自動フォーカス
    const input = document.getElementById("messageInput");
    input.focus();
    input.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();  // 送信時は改行を防ぐ
            sendMessage();
        }
        // Shift+Enterのときは何もしない（デフォルトの改行動作を許可）
    });



    // 右クリックメニュー処理
    const messagesContainer = document.getElementById("messages");
    // メッセージの右クリックを捕捉
    messagesContainer.addEventListener("contextmenu", (event) => {

        // ★★★ 修正点：選択されているテキストがあるか確認 ★★★
        const selection = window.getSelection();
        if (selection.toString().length > 0) {
            // テキストが選択されている場合は、ブラウザのデフォルトメニューを許可する
            return;
        }

        // 右クリックされたメッセージ
        const targetMessage = event.target.closest(".message");

        if (targetMessage) {
            // テキストが選択されておらず、メッセージ要素の上で右クリックされた場合のみ
            // カスタムメニューを表示する
            event.preventDefault(); // 標準のコンテキストメニューを無効化
            const messageId = targetMessage.dataset.messageId;

            // メニューを表示
            showContextMenu(event.pageX, event.pageY, messageId);
        }
        // messageクラスの要素以外で右クリックされた場合も、デフォルトのメニューが表示されます
    });
});




// テキストエリア自動調整
textarea.addEventListener("input", () => {
    textarea.style.height = "auto"; // 一旦リセット
    textarea.style.height = (textarea.scrollHeight - 12) + "px"; // 内容に応じて高さを設定
});


// クリップボードから画像のペースト
textarea.addEventListener("paste", (event) => {
    // クリップボードのアイテムを取得
    const items = event.clipboardData.items;
    for (const item of items) {
        // アイテムが画像ファイルの場合
        if (item.kind === 'file' && item.type.startsWith('image/')) {
            // デフォルトのテキスト貼り付け動作をキャンセル
            event.preventDefault();

            // Fileオブジェクトを取得
            file = item.getAsFile();

            confirm_img()
        }
    }
})


// 画像選択 & アップロード処理
const CLIENT_ID = "74940fca08bd165";
const imageInput = document.getElementById("imageInput");
const addFileButton = document.querySelector(".add_file");
let file = null

addFileButton.addEventListener("click", () => {
    imageInput.click(); // 画像アイコンをクリックするとファイル選択ダイアログが開く
});

imageInput.addEventListener("change", (event) => {
    file = event.target.files[0];
    if (!file) return;

    confirm_img()

    event.target.value = '';
});


function confirm_img() {
    // 確認画面表示
    upload_confirm.style.visibility = "visible"
    upload_confirm_panel.classList.remove("popdown-and-fadeout")
    upload_confirm_panel.classList.add("popup-and-fadein")



    // 既存のURLオブジェクトを解放（メモリリーク防止）
    if (imagePreview.src) {
        URL.revokeObjectURL(imagePreview.src);
    }

    // ① ファイルへの一時的なURLを生成
    const objectURL = URL.createObjectURL(file);

    // ② img要素のsrcに設定
    imagePreview.src = objectURL;
}


function upload_confirm_close() {
    upload_confirm_panel.classList.remove("popup-and-fadein")
    upload_confirm_panel.classList.add("popdown-and-fadeout")

    upload_confirm_panel.addEventListener('animationend', () => {
        upload_confirm.style.visibility = "hidden";
        upload_confirm_panel.classList.remove("uploading")
        file = null;
    }, { once: true });
}


async function upload_img() {
    upload_confirm_panel.classList.add("uploading")

    // await sleep(2)

    // ファイルサイズのチェック
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        alert("ファイルサイズが10MBを超えています。別の画像を選んでください。");
        return;
    }

    // WebP形式の場合はPNGに変換し、それ以外の画像はそのまま処理
    if (file.type === "image/webp") {
        console.log("WebP画像を検出。PNGに変換します。");
        convertWebPtoPNG(file)
            .then(base64Image => {
                uploadToImgur(base64Image);
            })
            .catch(error => {
                alert("WebPからPNGへの変換に失敗しました。");
                console.error(error);
            });
    } else {
        // FileReaderでBase64に変換
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Image = reader.result.split(",")[1];
            uploadToImgur(base64Image);
        };
        reader.onerror = () => {
            alert("ファイルの読み込みに失敗しました。");
        };
        reader.readAsDataURL(file);
    }

    // valueをリセットして同じファイルを連続で選択できるようにする
    upload_confirm_close()
}


/**
 * WebPファイルをPNG形式のBase64文字列に変換する関数
 * @param {File} file - 変換するWebPファイル
 * @returns {Promise<string>} PNG形式のBase64文字列（プレフィックスなし）
 */
function convertWebPtoPNG(file) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
            // canvasのサイズを画像に合わせる
            canvas.width = img.width;
            canvas.height = img.height;
            // canvasに画像を描画
            ctx.drawImage(img, 0, 0);

            // canvasからPNG形式のDataURLを取得
            const dataUrl = canvas.toDataURL("image/png");
            // "data:image/png;base64," の部分を取り除いた純粋なBase64データを返す
            const base64Image = dataUrl.split(",")[1];

            // メモリ解放
            URL.revokeObjectURL(img.src);
            resolve(base64Image);
        };

        img.onerror = (err) => {
            URL.revokeObjectURL(img.src);
            reject(err);
        };

        // Fileオブジェクトから一時的なURLを作成してImageオブジェクトに読み込ませる
        img.src = URL.createObjectURL(file);
    });
}

/**
 * Base64形式の画像をImgurにアップロードする関数
 * @param {string} base64Image - Base64エンコードされた画像データ
 */
function uploadToImgur(base64Image) {
    fetch("https://api.imgur.com/3/image", {
        method: "POST",
        mode: "cors",
        headers: {
            Authorization: "Client-ID " + CLIENT_ID,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            image: base64Image,
            type: "base64"
        })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const imageUrl = data.data.link;
                console.log("アップロード成功:", imageUrl);

                // チャットに画像URLを送信する処理
                socket_send({
                    "type": "img",
                    "text": imageUrl
                });
            } else {
                alert("画像アップロードに失敗しました。");
                console.error("Imgur API Error:", data);
            }
        })
        .catch(err => {
            alert("通信エラーが発生しました。");
            console.error("Fetch Error:", err);
        });
}

// スラッシュでフォーカス
document.addEventListener("keydown", function (event) {

    // escで返信終了
    if (event.key === "Escape") {
        reply_quit()
    }

    // 入力欄にフォーカス中は無視（キーのバブリングを防ぐ）
    const activeTag = document.activeElement.tagName.toLowerCase();
    if (activeTag === "input" || activeTag === "textarea") return;

    // `/` キーが押された場合
    if (event.key === "/") {
        event.preventDefault(); // ブラウザの検索ショートカットを無効化
        const input = document.getElementById("messageInput");
        if (input) {
            input.focus();
        }
    }

});







// メンションのアイコン処理
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        if (page_icon.href.includes("notification")) {
            page_icon.href = "/static/img/favicon.ico"
        }
    }
});






// ゲームリスト表示切り替え処理
let games_list_visible = false
const gameslist_container = document.querySelector(".games-list")
const gameslist_container_panel = document.querySelector(".games-list-panel")

function toggle_games_list() {
    if (games_list_visible) {
        // close
        games_list_visible = false
        gameslist_container.classList.add("fade-out")
        gameslist_container.classList.remove("fade-in")
        gameslist_container_panel.classList.add("popdown")
        gameslist_container_panel.classList.remove("popup")

        gameslist_container_panel.addEventListener('animationend', () => {
            gameslist_container.style.visibility = "hidden";
            gameslist_container_panel.classList.remove("uploading")
            file = null;
        }, { once: true });
    } else {
        // open
        games_list_visible = true
        gameslist_container.style.visibility = "visible"
        gameslist_container.classList.remove("fade-out")
        gameslist_container.classList.add("fade-in")

        gameslist_container_panel.classList.remove("popdown")
        gameslist_container_panel.classList.add("popup")
    }
}





socket.on('disconnect', (reason) => {
    show_message({ type: "connection_change", text: `サーバーから切断されました（${reason}）` })
    socket.emit("chat_join")
    show_message({ type: "connection_change", text: `再接続を試みました` })
});

socket.on('connected', () => {
    show_message({ type: "connection_change", text: `サーバーに接続しました（${reason}）` })
    socket.emit('chat_join');
});