const confirm = document.querySelector(".vc-confirm")
const panel = document.querySelector(".vc-confirm-panel")
const mic_imgs_confirm = document.querySelectorAll(".mic-img-confirm")
const camera_imgs_confirm = document.querySelectorAll(".camera-img-confirm")
const mic_img = document.querySelector(".mic-img")
const camera_img = document.querySelector(".camera-img")
const screen_share_img = document.querySelector(".screen-share-img")
const mic_text = document.querySelector(".mic-status-text")
const camera_text = document.querySelector(".camera-status-text")
const join_vc_button = document.querySelector(".join-vc-button")
const leave_vc_button = document.querySelector(".leave-vc-button")
const vc_menu = document.querySelector(".vc-menu")
const remoteMediaArea = document.querySelector('#remote-media-area');
const vc_member = document.querySelector(".vc-member")

let mic_confirm = false
let camera_confirm = false
let mic = false
let camera = false
let screen_share = false

// ストリームを保持するためのグローバル変数（許可確認用）
let localAudioStream_confirm = null;
let localVideoStream_confirm = null;
// skyway用ストリーム変数
let localAudioStream = null;
let localVideoStream = null;
let SSAudioStream = null;

// leave用
let videoPublication = null;
let audioPublication = null;

let vc_state = {
    "vc_join": false,
    "mic": false,
    "camera": false,
    "screen_share": false,
    "skyway_id": null
}

let vc_joined = false

let string_metadata

const video_publications = {}

const { SkyWayContext, SkyWayStreamFactory, SkyWayRoom } = window.skyway_room;

// 2. 音声解析器を作成する (Web Audio APIを使用)
const audioContext = new AudioContext();


function confirm_open() {
    confirm.style.visibility = "visible"
    confirm.classList.remove("fade-out")
    confirm.classList.add("fade-in")

    panel.classList.remove("popdown")
    panel.classList.add("popup")
}


async function confirm_close() {
    confirm.classList.remove("fade-in")
    confirm.classList.add("fade-out")

    confirm.addEventListener('animationend', () => {
        confirm.style.visibility = "hidden";
    }, { once: true });

    panel.classList.remove("popup")
    panel.classList.add("popdown")

    // 確認用のマイクとカメラをオフ
    await mic_set(false)
    await camera_set(false)
}




// マイク―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
async function mic_set(mic_state) {
    if (mic_state) {
        try {
            // マイクへのアクセスを要求し、ストリームを保存
            localAudioStream_confirm = await navigator.mediaDevices.getUserMedia({
                audio: true
            });

            console.log("マイクへのアクセスに成功しました。");
            mic_confirm = true;
            src = "/static/img/mic_on.svg";
            mic_text.innerHTML = "マイク ON";
            mic_text.classList.remove("off");

        } catch (error) {
            console.error("マイクへのアクセスに失敗しました:", error);
            alert("マイクへのアクセスが拒否されたか、デバイスが見つかりませんでした。");
            // 失敗した場合のUI更新
            mic_confirm = false;
            src = "/static/img/mic_off.svg";
            mic_text.innerHTML = "マイク OFF";
            mic_text.classList.add("off");
        }

    } else {
        if (localAudioStream_confirm) {
            // すべての音声トラックを停止
            localAudioStream_confirm.getTracks().forEach(track => track.stop());
            localAudioStream_confirm = null; // 変数をクリア
            console.log("マイクへのアクセスを停止しました。");
        }

        src = "/static/img/mic_off.svg";
        mic_text.innerHTML = "マイク OFF";
        mic_text.classList.add("off");
        mic_confirm = false;
    }
    mic_imgs_confirm.forEach(e => {
        e.src = src;
    });
}


// --- マイクのトグル機能 ---
async function toggle_mic_confirm() {
    let src;

    if (mic_confirm) { // マイクをOFFにする処理
        await mic_set(false)

    } else { // マイクをONにする処理
        await mic_set(true)
    }
}



async function toggle_mic() {
    string_metadata = set_metadata(false)
    if (mic) {
        localAudioStream._track.stop();
        localAudioStream = null; // 変数をクリア
        await me.unpublish(audioPublication);
    } else {
        localAudioStream = await SkyWayStreamFactory.createMicrophoneAudioStream();
        audioPublication = await me.publish(localAudioStream, { metadata: string_metadata });
    }
    mic = !mic
    mic_img.src = `/static/img/mic_${["off", "on"][Number(mic)]}.svg`
    ping()
}




// カメラ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
async function camera_set(camera_state) {
    if (camera_state) {
        try {
            // カメラへのアクセスを要求し、ストリームを保存
            localVideoStream_confirm = await navigator.mediaDevices.getUserMedia({
                video: true
            });

            console.log("カメラへのアクセスに成功しました。");
            camera_confirm = true;
            src = "/static/img/camera_on.svg";
            camera_text.innerHTML = "カメラ ON";
            camera_text.classList.remove("off");

        } catch (error) {
            console.error("カメラへのアクセスに失敗しました:", error);
            alert("カメラへのアクセスが拒否されたか、デバイスが見つかりませんでした。");
            // 失敗した場合のUI更新
            camera_confirm = false;
            src = "/static/img/camera_off.svg";
            camera_text.innerHTML = "カメラ OFF";
            camera_text.classList.add("off");
        }

    } else {
        if (localVideoStream_confirm) {
            // すべての音声トラックを停止
            localVideoStream_confirm.getTracks().forEach(track => track.stop());
            localVideoStream_confirm = null; // 変数をクリア
            console.log("カメラへのアクセスを停止しました。");
        }

        src = "/static/img/camera_off.svg";
        camera_text.innerHTML = "カメラ OFF";
        camera_text.classList.add("off");
        camera_confirm = false;
    }
    camera_imgs_confirm.forEach(e => {
        e.src = src;
    });
}


// --- カメラのトグル機能 ---
async function toggle_camera_confirm() {
    let src;

    if (camera_confirm) { // カメラをOFFにする処理
        await camera_set(false)

    } else { // カメラをONにする処理
        await camera_set(true)
    }
}


async function toggle_camera() {
    string_metadata = set_metadata(false)
    if (camera) {
        localVideoStream._track.stop();
        localVideoStream = null; // 変数をクリア
        await me.unpublish(videoPublication);
    } else {
        if (screen_share) { await toggle_screen_share() }

        localVideoStream = await SkyWayStreamFactory.createCameraVideoStream();
        videoPublication = await me.publish(localVideoStream, { metadata: string_metadata });
    }
    camera = !camera
    camera_img.src = `/static/img/camera_${["off", "on"][Number(camera)]}.svg`
    ping()
}



// 画面共有―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
async function toggle_screen_share() {
    if (camera) {
        toggle_camera()
        screen_share = false
        print("カメラをオフ")
    }

    if (screen_share) {
        localVideoStream._track.stop();
        SSAudioStream._track.stop();
        if (videoPublication) {
            await me.unpublish(videoPublication);
        }
        if (screenShareAudioPublication) {
            await me.unpublish(screenShareAudioPublication);
        }
        localVideoStream = null;
        SSAudioStream = null;

        screen_share = false
    } else {
        try {

            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true
            });


            string_metadata = set_metadata(true)


            // 映像
            const [displayTrack] = displayStream.getVideoTracks();
            if (displayTrack) {
                const { LocalVideoStream } = window.skyway_room;
                localVideoStream = new LocalVideoStream(displayTrack);
                // 画面共有の映像をpublish
                videoPublication = await me.publish(localVideoStream, { metadata: string_metadata });

                // ブラウザの「共有停止」ボタンに対応する
                displayTrack.onended = async () => {
                    toggle_screen_share()
                    print("共有停止ボタン検知")
                    return
                };
            }



            const [audioTrack] = displayStream.getAudioTracks();
            if (audioTrack) {
                const { LocalAudioStream } = window.skyway_room;
                // 音声トラックをSkyWay用のストリームに変換
                SSAudioStream = new LocalAudioStream(audioTrack);

                // 画面共有の音声のpublish
                screenShareAudioPublication = await me.publish(SSAudioStream, { metadata: string_metadata });

                // ブラウザの「共有停止」ボタンに対応する
                audioTrack.onended = () => {
                    if (screenShareAudioPublication) {
                        me.unpublish(screenShareAudioPublication);
                    }
                };
            }





            screen_share = true

        } catch (err) {
            screen_share = false
            console.error("画面共有の開始に失敗しました:", err);
        }
    }
    screen_share_img.src = `/static/img/screen_share_${["on", "off"][Number(screen_share)]}.svg`
    if (screen_share) {
        screen_share_img.title = "画面共有をやめる"
    } else {
        screen_share_img.title = "画面を共有する"
    }
    ping()
    print("最後まで完了")

}







// === Join処理 ===
async function vc_join() {
    mic = mic_confirm
    camera = camera_confirm
    screen_share = false
    mic_img.src = `/static/img/mic_${["off", "on"][Number(mic)]}.svg`
    camera_img.src = `/static/img/camera_${["off", "on"][Number(camera)]}.svg`
    screen_share_img.src = "/static/img/screen_share_on.svg"
    confirm_close()

    // 部屋と名前設定
    const roomName = "Neo2-Chat";
    const memberName = username;

    // 認証
    const response = await fetch('/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName, memberName })
    });

    if (!response.ok) { alert('トークン取得に失敗しました'); return; }

    const credential = await response.json();
    authToken = credential.token;

    try {
        const context = await SkyWayContext.Create(authToken);


        // join処理

        string_metadata = set_metadata(false)

        room = await SkyWayRoom.FindOrCreate(context, { type: 'sfu', name: roomName });
        me = await room.join({ metadata: string_metadata }); // ここでメタデータを渡す
        print(me.id);
        print("join成功")

        vc_state["skyway_id"] = me.id
        vc_joined = true
        ping()


        // メディアの送信
        if (mic) {
            localAudioStream = await SkyWayStreamFactory.createMicrophoneAudioStream();
        }
        if (camera) {
            localVideoStream = await SkyWayStreamFactory.createCameraVideoStream();
        }
        if (mic) {
            audioPublication = await me.publish(localAudioStream, { metadata: string_metadata });
        }
        if (camera) {
            videoPublication = await me.publish(localVideoStream, { metadata: string_metadata });
        }
        print("publish成功")
        join_vc_button.classList.add("hidden")
        leave_vc_button.classList.remove("hidden")
        vc_menu.classList.remove("hidden")



        // ほかのメンバーのpublishを検知する関数
        const subscribeAndAttach = async (publication) => {
            const publisherId = publication.publisher.id
            const METADATA = JSON.parse(publication.metadata)
            print(METADATA)
            print(METADATA["screen_share"])
            print(publication.contentType)
            print()

            // if (publisherId === me.id) return;


            if (publication.contentType === 'audio') {
                if (publisherId === me.id) return;
                if (METADATA["screen_share"]) {
                    // 画面共有のpublishを確認
                    if (video_publications[publisherId]) {
                        video_publications[publisherId]["audio"] = publication
                    } else {
                        video_publications[publisherId] = {
                            "audio": publication
                        }
                    }
                    print("画面共有のpublicationを確認")
                    print(video_publications)
                } else {
                    // 音声のpublishを確認
                    const { stream } = await me.subscribe(publication.id);
                    const audioEl = document.createElement('audio');
                    audioEl.autoplay = true;
                    audioEl.dataset.memberId = publisherId;
                    stream.attach(audioEl);
                    remoteMediaArea.appendChild(audioEl);


                }

            } else if (publication.contentType === 'video') {
                // videoのpublishを確認
                if (video_publications[publisherId]) {
                    video_publications[publisherId]["video"] = publication
                } else {
                    video_publications[publisherId] = {
                        "video": publication
                    }
                }
                print(video_publications)
            }
        };







        // 既にいるメンバー確認
        room.publications.forEach(subscribeAndAttach);

        // メンバーがpublishしたとき
        room.onStreamPublished.add((e) => {
            subscribeAndAttach(e.publication)
        });


        // メンバーがunpublishしたとき
        room.onStreamUnpublished.add((e) => {
            // `e.publication` に unpublish された publication の情報が入っています
            const unpublishedPublication = e.publication;
            const publisherId = unpublishedPublication.publisher.id;


            // unpublishしたユーザーのメディアを削除
            if (unpublishedPublication.contentType === 'audio') {
                const audioEl = document.querySelector(`audio[data-member-id="${publisherId}"]`);
                if (audioEl) {
                    audioEl.remove();
                }
            } else if (unpublishedPublication.contentType === 'video') {
                const videoEl = document.querySelector(`.draggable-window[data-id="${publisherId}"]`)
                if (videoEl) {
                    videoEl.remove();
                }
                // ビデオオブジェクト保持リストから削除
                if (video_publications[publisherId]) {
                    delete video_publications[publisherId]
                }
            }
        });



        // メンバーが退出した時にaudioとvideoを削除
        room.onMemberLeft.add((e) => {
            const user_id = e.member.id

            console.log(`メンバーが退出しました: ${user_id}`);
            const audioEl = document.querySelector(`audio[data-member-id="${user_id}"]`);
            if (audioEl) {
                audioEl.remove();
            }
            const videoEl = document.querySelector(`video[data-member-id="${user_id}"]`);
            if (videoEl) {
                videoEl.remove();
            }


            // ビデオオブジェクト保持リストから削除
            if (video_publications[user_id]) {
                delete video_publications[user_id]
            }
        });


    } catch (err) {
        console.error(err);
        alert('Joinに失敗しました');
    }
}



// === Leave処理 ===
async function leave_vc() {
    // マイクとカメラの配信を停止
    if (mic) await me.unpublish(audioPublication);
    if (camera) await me.unpublish(videoPublication);

    if (localAudioStream) localAudioStream._track.stop();
    localAudioStream = null;
    if (localVideoStream) localVideoStream._track.stop();
    localVideoStream = null;

    // 部屋から抜ける
    if (me) await me.leave();
    if (room) await room.dispose();

    // 音声やビデオを削除
    remoteMediaArea.innerHTML = ""

    document.querySelectorAll(".draggable-window").forEach(element => {
        element.remove()
    });

    join_vc_button.classList.remove("hidden")
    leave_vc_button.classList.add("hidden")
    vc_menu.classList.add("hidden")
    print("退出成功")
    vc_joined = false
    ping()
}







function add_vc(user) {
    const vc_user = document.createElement("div")
    vc_user.dataset.username = user["username"]
    vc_user.dataset.skywayId = user["skyway_id"]
    vc_user.classList.add("vc-user")
    vc_user.onclick = vc_user_clicked
    let camera_or_screen_share
    if (user["screen_share"]) {
        camera_or_screen_share = `<img title="画面共有中" src="./static/img/screen_share_on.svg" class="screen_share">`
    } else {
        camera_or_screen_share = `<img title="カメラOFF" src="./static/img/camera_off.svg" class="camera ${user["camera"] && "hidden"}">`
    }
    vc_user.innerHTML = `
        <div class="icon-and-un">
            <img src="${user["icon_url"]}">
            <span>${user["username"]}</span>
        </div>
        <div class="states">
            <img title="マイクOFF" src="./static/img/mic_off.svg" class="mic ${user["mic"] && "hidden"}" >
            ${camera_or_screen_share}
        </div>
    `
    vc_member.appendChild(vc_user)
}


function remove_vc(username) {
    const vc_user = document.querySelector(`.vc-user[data-username="${username}"]`)
    if (video_publications[username]) {
        delete video_publications[username]
    }
    vc_user.remove()
}



















function set_metadata(screen_share) {
    const dict_metadata = {
        "username": username,
        "uid": suid,
        "icon_url": my_icon_url,
        "screen_share": screen_share
    };
    string_metadata = JSON.stringify(dict_metadata)
    return string_metadata
}





































/**
 * メンバーIDとタイトルを元に、ドラッグ可能なウィンドウを動的に生成します。
 * 既に同じIDのウィンドウが存在する場合は、新しいウィンドウを作らずに既存のものを返します。
 * @param {string} memberId - SkyWayのメンバーID (publication.publisher.id)
 * @param {string} title - ウィンドウのヘッダーに表示されるタイトル
 * @returns {HTMLElement} 生成または取得されたウィンドウ要素
 */
function createDraggableWindow(memberId, title, onCloseCallback) { // onCloseCallbackを追加
    const windowId = `video-window-${memberId}`;

    // 既に同じIDのウィンドウが存在すれば、それを返す
    const existingWindow = document.getElementById(windowId);
    if (existingWindow) {
        return existingWindow;
    }

    // --- ウィンドウの各パーツを生成 ---
    const windowEl = document.createElement('div');
    windowEl.id = windowId;
    windowEl.className = 'draggable-window';
    windowEl.dataset.id = memberId; // memberIdをdatasetに保存

    const headerEl = document.createElement('div');
    headerEl.className = 'window-header';

    const titleEl = document.createElement('span');
    titleEl.textContent = title;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.innerHTML = `
        <img src="./static/img/close_line.svg" alt="閉じる">
    `; // alt属性を追加

    const contentEl = document.createElement('div');
    contentEl.className = 'window-content';

    // ▼▼▼ リサイズハンドルを追加 ▼▼▼
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';

    // --- パーツを組み立てる ---
    headerEl.appendChild(titleEl);
    headerEl.appendChild(closeBtn);
    windowEl.appendChild(headerEl);
    windowEl.appendChild(contentEl);
    windowEl.appendChild(resizeHandle); // リサイズハンドルを追加

    // --- イベントリスナーを設定 ---
    // 閉じるボタン
    closeBtn.addEventListener('click', () => {
        if (onCloseCallback) {
            onCloseCallback(); // コールバックを実行
        }
        windowEl.remove();
    });

    // ドラッグ処理 (既存のコード)
    let isDragging = false;
    let offsetX, offsetY;

    const onMouseMoveDrag = (e) => { // ドラッグ用のMouseMoveハンドラ
        windowEl.style.left = `${e.clientX - offsetX}px`;
        windowEl.style.top = `${e.clientY - offsetY}px`;
    };

    const onMouseUpDrag = () => { // ドラッグ用のMouseUpハンドラ
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMoveDrag);
        document.removeEventListener('mouseup', onMouseUpDrag);
    };

    headerEl.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - windowEl.offsetLeft;
        offsetY = e.clientY - windowEl.offsetTop;
        e.preventDefault();
        document.addEventListener('mousemove', onMouseMoveDrag);
        document.addEventListener('mouseup', onMouseUpDrag);
    });

    // ▼▼▼ リサイズ処理の追加 ▼▼▼
    let isResizing = false;
    let startX, startY, startWidth, startHeight;
    const initialAspectRatio = 16 / 9; // ビデオのアスペクト比 (例: 16:9)

    const onMouseMoveResize = (e) => {
        if (!isResizing) return;

        let newWidth = startWidth + (e.clientX - startX);
        let newHeight = startHeight + (e.clientY - startY);

        // アスペクト比を維持
        // 幅を基準に高さを調整
        newHeight = newWidth / initialAspectRatio;

        // 最小サイズを考慮
        newWidth = Math.max(newWidth, parseInt(window.getComputedStyle(windowEl).minWidth));
        newHeight = Math.max(newHeight, parseInt(window.getComputedStyle(windowEl).minHeight));

        windowEl.style.width = `${newWidth}px`;
        windowEl.style.height = `${newHeight}px`;
    };

    const onMouseUpResize = () => {
        isResizing = false;
        document.removeEventListener('mousemove', onMouseMoveResize);
        document.removeEventListener('mouseup', onMouseUpResize);
    };

    resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = windowEl.offsetWidth;
        startHeight = windowEl.offsetHeight;
        e.preventDefault(); // イベントの伝播を停止
        document.addEventListener('mousemove', onMouseMoveResize);
        document.addEventListener('mouseup', onMouseUpResize);
    });


    // --- 完成したウィンドウをページに追加 ---
    document.body.appendChild(windowEl);
    return windowEl;
}

// showVideoInWindow 関数を修正
async function showVideoInWindow(publication) {
    const publication_video = publication["video"]
    const publication_audio = publication["audio"]

    const metadata = JSON.parse(publication_video.metadata);
    const username = metadata.username;
    const memberId = publication_video.publisher.id;

    // 既に同じIDのウィンドウが存在すれば処理を中断 (既存のウィンドウが返されるため)
    if (document.getElementById(`video-window-${memberId}`)) return;


    // 映像
    let stream_video, subscription_video, videoEl, subscribed_video_object
    if (publication_video) {
        subscribed_video_object = await me.subscribe(publication_video.id);
        stream_video = subscribed_video_object.stream
        subscription_video = subscribed_video_object.subscription

        videoEl = document.createElement('video');
        videoEl.autoplay = true;
        videoEl.playsInline = true;

        stream_video.attach(videoEl);
    }

    // 音声
    let stream_audio, subscription_audio, audioEl, subscribed_audio_object
    if (publication_audio) {

        subscribed_audio_object = await me.subscribe(publication_audio.id);
        stream_audio = subscribed_audio_object.stream
        subscription_audio = subscribed_audio_object.subscription

        audioEl = document.createElement('audio');

        audioEl.autoplay = true;
        audioEl.style.display = "none"

        stream_audio.attach(audioEl);
    }



    // createDraggableWindow を呼び出し、コールバック関数を渡す
    const windowEl = createDraggableWindow(memberId, `${username}の配信`, () => {
        if (subscribed_video_object) {
            me.unsubscribe(subscription_video.id); // 閉じるボタンが押されたらunsubscribe
        }
        if (subscribed_audio_object) {
            me.unsubscribe(subscription_audio.id); // 閉じるボタンが押されたらunsubscribe
        }
        console.log(`Unsubscribed from ${memberId}`);
    });

    const contentEl = windowEl.querySelector('.window-content');
    if (videoEl) {
        contentEl.appendChild(videoEl);
    }
    if (audioEl) {
        contentEl.appendChild(audioEl);
    }
}




function vc_user_clicked(e) {
    if (!vc_joined) return
    const clicled_id = e.currentTarget.dataset.skywayId
    const publication = video_publications[clicled_id]
    print("PUBLICATION", publication)
    if (publication) {
        showVideoInWindow(publication);
    } else {
        print("映像を配信していません")
    }
}
