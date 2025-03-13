// script.js

// activeCorrectionRules は、correctionData.js で定義された correctionRules を初期値として使用
let activeCorrectionRules = correctionRules.slice();

// クライアントサイドの校正処理：activeCorrectionRules をすべて適用
function clientProofread(text) {
  let corrected = text;
  activeCorrectionRules.forEach(rule => {
    try {
      let regex = new RegExp(rule.pattern, "g");
      corrected = corrected.replace(regex, rule.replacement);
    } catch(e) {
      console.error("ルール適用エラー:", rule, e);
    }
  });
  return corrected.trim();
}

// UI要素の取得
const displayArea = document.getElementById("displayArea");
const startRecBtn = document.getElementById("startRec");
const stopRecBtn = document.getElementById("stopRec");
const toggleSpeakBtn = document.getElementById("toggleSpeak");
const speakDelayInput = document.getElementById("speakDelay");
const delayValueSpan = document.getElementById("delayValue");
const saveModelBtn = document.getElementById("saveModel");
const modelListElem = document.getElementById("modelList");

// 音声読み上げ設定（初期状態はOFF）
let speakEnabled = false;
let speakDelay = parseInt(speakDelayInput.value);
let speakTimeout;

// 認識結果の累積（校正後テキスト）
let finalTranscript = "";

// マイクアクセス確認（HTTP/HTTPS両対応）
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => { console.log("マイクアクセスOK", stream); })
  .catch(error => { console.error("マイクアクセスエラー:", error); });

// SpeechRecognition の初期化
window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!window.SpeechRecognition) {
  alert("このブラウザは音声認識に対応していません。Chromeなど最新ブラウザをご利用ください。");
}
let recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = "ja-JP";
recognition.continuous = true;
recognition.interimResults = true;
recognition.maxAlternatives = 10;

recognition.onstart = () => {
  console.log("音声認識が開始されました。");
};

recognition.onresult = (event) => {
  let newFinalSegment = "";
  let interimSegment = "";
  for (let i = event.resultIndex; i < event.results.length; i++) {
    let transcript = event.results[i][0].transcript;
    if (event.results[i].isFinal) {
      newFinalSegment += transcript;
    } else {
      interimSegment += transcript;
    }
  }
  if (newFinalSegment) {
    let correctedSegment = clientProofread(newFinalSegment);
    finalTranscript += correctedSegment + " ";
  }
  let correctedInterim = clientProofread(interimSegment);
  displayArea.innerHTML = "<strong>認識結果:</strong> " + finalTranscript + correctedInterim;
  console.log("新たな最終結果:", newFinalSegment, "→ 校正:", clientProofread(newFinalSegment));
  
  if (speakTimeout) { clearTimeout(speakTimeout); }
  if (speakEnabled && (finalTranscript || correctedInterim)) {
    speakTimeout = setTimeout(() => {
      let utterance = new SpeechSynthesisUtterance(finalTranscript + correctedInterim);
      utterance.lang = "ja-JP";
      speechSynthesis.speak(utterance);
    }, speakDelay);
  }
};

recognition.onerror = (event) => {
  console.error("音声認識エラー:", event.error);
};

recognition.onend = () => {
  console.log("音声認識が終了しました。");
};

// ボタンイベントの設定
startRecBtn.addEventListener("click", () => {
  finalTranscript = "";
  recognition.start();
  console.log("音声認識開始ボタンがクリックされました。");
});

stopRecBtn.addEventListener("click", () => {
  recognition.stop();
  console.log("音声認識停止ボタンがクリックされました。");
});

toggleSpeakBtn.addEventListener("click", () => {
  speakEnabled = !speakEnabled;
  toggleSpeakBtn.textContent = speakEnabled ? "読み上げON" : "読み上げOFF";
});

speakDelayInput.addEventListener("input", () => {
  speakDelay = parseInt(speakDelayInput.value);
  delayValueSpan.textContent = speakDelay;
});

// モデル管理（校正ルールセットの保存／読み込み／編集／削除）
saveModelBtn.addEventListener("click", () => {
  let modelName = prompt("保存するモデルの名前を入力してください", "新しいモデル");
  if (!modelName) return;
  let newModel = {
    name: modelName,
    rules: activeCorrectionRules,  // 現在の校正ルールを保存
    timestamp: Date.now()
  };
  let models = JSON.parse(localStorage.getItem("savedModels") || "[]");
  models.push(newModel);
  localStorage.setItem("savedModels", JSON.stringify(models));
  alert("モデルが保存されました。");
  loadModels();
});

function loadModels() {
  modelListElem.innerHTML = "";
  let models = JSON.parse(localStorage.getItem("savedModels") || "[]");
  models.forEach((model, index) => {
    const li = document.createElement("li");
    li.style.marginBottom = "0.5em";
    const span = document.createElement("span");
    span.textContent = model.name;
    li.appendChild(span);
    
    const editBtn = document.createElement("button");
    editBtn.textContent = "編集";
    editBtn.style.marginLeft = "0.5em";
    editBtn.addEventListener("click", () => {
      let newName = prompt("モデル名を変更してください", model.name);
      if (newName) {
        model.name = newName;
        models[index] = model;
        localStorage.setItem("savedModels", JSON.stringify(models));
        loadModels();
      }
    });
    li.appendChild(editBtn);
    
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "削除";
    deleteBtn.style.marginLeft = "0.5em";
    deleteBtn.addEventListener("click", () => {
      models.splice(index, 1);
      localStorage.setItem("savedModels", JSON.stringify(models));
      loadModels();
    });
    li.appendChild(deleteBtn);
    
    const loadBtn = document.createElement("button");
    loadBtn.textContent = "読み込み";
    loadBtn.style.marginLeft = "0.5em";
    loadBtn.addEventListener("click", () => {
      activeCorrectionRules = model.rules;
      alert("モデル「" + model.name + "」が読み込まれ、認識精度が向上しました。");
    });
    li.appendChild(loadBtn);
    
    modelListElem.appendChild(li);
  });
}
loadModels();
