// 汎用関数を定義
const print = console.log
const sleep = (second) => new Promise(resolve => setTimeout(resolve, second * 1000));
function get_unixtime() {
    return Math.floor(Date.now() / 1000);
}


print(userData)

// cookie展開
let cookies_pair = document.cookie.split(";");
let cookies_dict = {}
cookies_pair.forEach((pair) => {
    let key_value = pair.split("=");
    cookies_dict[key_value[0].trim()] = key_value[1];
})



// ログイン状況で変化
let elements
if (userData["login"]) {
    elements = document.querySelectorAll(".NOT-LOGINED");
} else {
    elements = document.querySelectorAll(".LOGINED");
}
elements.forEach(element => {
    element.classList.add("hidden")
});


// サポーター特別処理
const is_supporter = userData["supporter"]
if (is_supporter) {
    const account_name = document.querySelector("header .js-username")
    account_name.style.color = "#ffb433"
    const dropdown = document.querySelector("header .dropdown")
    dropdown.style.boxShadow = "inset 0 0 0 0.5px #ffb433"
    dropdown.style.backgroundColor = "#241a0c"
}



// htmlの内容を書き換え
let e = document.querySelectorAll(".js-username");
e.forEach(e => {
    e.innerHTML = cookies_dict["username"]
})

e = document.querySelectorAll(".js-icon");
e.forEach(e => {
    e.src = `https://cdn2.scratch.mit.edu/get_image/user/${cookies_dict["uid"]}_90x90.png?v=`
})





// ドロップダウンの処理
function toggleDropdown() {
    document.querySelectorAll(".dropdown-content").forEach(menu => {
        menu.classList.toggle("hidden");
    });
    document.querySelectorAll(".user-info").forEach(menu => {
        menu.classList.toggle("dropdown-close");
    });
}


window.onclick = function (event) {
    if (!event.target.closest('.user-info')) {
        document.querySelectorAll(".dropdown-content").forEach(menu => {
            menu.classList.add("hidden");
        });
    }
}


// ログアウトの処理
function logout() {
    document.cookie = "username=; max-age=0";
    document.cookie = "session=; max-age=0";
    document.cookie = "uid=; max-age=0";
    window.location.href = "/";
}


// ヘッダーのメッセージの通知確認の処理
if (userData["login"]) {
    const message_button = document.querySelector("header a>img.message")



    async function check_notify() {
        const response = await fetch(`/api/message-count/${cookies_dict["username"]}`);
        const data = await response.json();

        if (data["count"] > 0) {
            message_button.src = "/static/img/message_notification.svg"
        } else {
            message_button.src = "/static/img/message.svg"
        }
    }
    
    check_notify()
    setInterval(check_notify, 1000 * 60);
}