const storyStage = document.querySelector("#storyStage");
const sceneChip = document.querySelector("#sceneChip");
const progressSteps = document.querySelectorAll(".progress-step");

const state = {
  currentScene: "intro",
  firstChoice: null,
  secondChoice: null,
  endingType: null,
  riskAwareness: null,
  riskReason: null,
  chatHistory: [],
};

function setSceneMeta(label, activeStep) {
  sceneChip.textContent = label;
  progressSteps.forEach((step) => {
    step.classList.toggle("is-active", step.dataset.step === activeStep);
  });
}

function render(html) {
  storyStage.innerHTML = html;
}

function bindClick(selector, handler) {
  const element = storyStage.querySelector(selector);
  if (element) {
    element.addEventListener("click", handler);
  }
}

function showIntro() {
  state.currentScene = "intro";
  state.firstChoice = null;
  state.secondChoice = null;
  state.endingType = null;
  state.riskAwareness = null;
  state.riskReason = null;
  state.chatHistory = [];
  window.firstChoice = null;
  window.secondChoice = null;
  window.endingType = null;
  window.riskAwareness = null;
  setSceneMeta("Intro", "intro");

  render(`
    <article class="screen intro-screen">
      <div class="intro-content">
        <h1 class="intro-title">《别点那个链接！》</h1>
        <p class="intro-subtitle">AIGC 驱动的大学生反诈互动剧情网页</p>
        <p class="intro-copy">一条看似普通的通知，可能正是骗局的开始。</p>
        <button class="primary-button" type="button" data-action="start-story">进入故事</button>
      </div>
    </article>
  `);

  bindClick("[data-action='start-story']", showScene1);
}

function showScene1() {
  state.currentScene = "scene1";
  setSceneMeta("Scene 01", "message");

  render(`
    <article class="screen scene-layout">
      <div class="visual-panel">
        <img class="scene-image" src="assets/V1-dorm-phone.png" alt="深夜宿舍里，大学生看着刚亮起的手机">
        <div class="image-vignette"></div>
      </div>

      <section class="narrative-panel">
        <p class="scene-kicker">Scene 01 / 消息到来</p>
        <p class="story-text">深夜的宿舍里，你正准备继续完成手头的任务。手机忽然亮起，一条陌生短信弹了出来。</p>
        <div class="actions">
          <button class="primary-button" type="button" data-action="show-message">查看短信</button>
        </div>
      </section>
    </article>
  `);

  bindClick("[data-action='show-message']", showScene2);
}

function showScene2() {
  state.currentScene = "scene2";
  setSceneMeta("Scene 02", "message");

  render(`
    <article class="screen scene-layout">
      <div class="visual-panel">
        <img class="scene-image" src="assets/V2-phone-message.png" alt="大学生紧张地盯着发光的手机屏幕">
        <div class="image-vignette"></div>
      </div>

      <section class="narrative-panel">
        <p class="scene-kicker">Scene 02 / 可疑短信</p>

        <div class="message-card" aria-label="手机短信通知">
          <p class="message-head">【奖学金补录通知】</p>
          <p class="message-body">
            同学您好，您已进入本学期奖学金补录名单，请于24小时内点击下方链接完成资格确认，逾期视为自动放弃。
            <span class="fake-link">http://scholarship-verify-xxx.com</span>
          </p>
        </div>

        <p class="choice-note">消息看起来很紧急。你准备怎么做？</p>

        <div class="actions">
          <button class="choice-button risky" type="button" data-choice="click_link">A. 立即点击链接</button>
          <button class="choice-button safe" type="button" data-choice="verify_first">B. 先核实消息真伪</button>
        </div>
      </section>
    </article>
  `);

  storyStage.querySelectorAll("[data-choice]").forEach((button) => {
    button.addEventListener("click", () => handleFirstChoice(button.dataset.choice));
  });
}

function handleFirstChoice(choice) {
  // 这里记录第一次关键选择，后续结局系统可直接读取该状态。
  state.firstChoice = choice;
  window.firstChoice = choice;

  if (choice === "click_link") {
    showScene3();
    return;
  }

  handleSecondChoice("consult_ai");
}

function handleSecondChoice(choice) {
  state.secondChoice = choice;
  window.secondChoice = choice;

  if (choice === "submit_info") {
    showRiskEnding();
    return;
  }

  showScene4();
}

function showScene3() {
  state.currentScene = "scene3";
  setSceneMeta("Scene 03", "phishing");

  render(`
    <article class="screen scene-layout">
      <div class="visual-panel">
        <img class="scene-image" src="assets/V3-phishing-page.png" alt="电脑上打开伪造的奖学金资格认证页面">
        <div class="image-vignette"></div>
      </div>

      <section class="narrative-panel">
        <p class="scene-kicker">Scene 03 · 伪造认证页</p>
        <p class="story-text">你点开了短信中的链接。页面看起来像“奖学金资格认证”，要求你填写个人信息。虽然界面像模像样，但你心里还是隐隐觉得不太对劲。</p>

        <div class="fake-form-card" aria-label="伪造认证页面表单示意">
          <p class="fake-form-title">奖学金补录资格认证</p>
          <div class="fake-form-row"><span>姓名</span><span class="fake-input"></span></div>
          <div class="fake-form-row"><span>学号</span><span class="fake-input"></span></div>
          <div class="fake-form-row"><span>身份证号</span><span class="fake-input"></span></div>
          <div class="fake-form-row"><span>银行卡号</span><span class="fake-input"></span></div>
          <div class="fake-form-row"><span>手机验证码</span><span class="fake-input"></span></div>
          <div class="fake-submit">提交认证</div>
        </div>

        <div class="actions">
          <button class="choice-button risky" type="button" data-action="submit-info">A1. 继续填写信息</button>
          <button class="choice-button safe" type="button" data-action="ask-ai">A2. 停止操作，咨询AI反诈助手</button>
        </div>
      </section>
    </article>
  `);

  bindClick("[data-action='submit-info']", () => handleSecondChoice("submit_info"));
  bindClick("[data-action='ask-ai']", () => handleSecondChoice("consult_ai"));
}

function showRiskEnding() {
  state.currentScene = "endingRisk";
  state.secondChoice = "submit_info";
  state.endingType = "risk";
  window.secondChoice = state.secondChoice;
  window.endingType = state.endingType;

  setSceneMeta("Ending Risk", "ending");

  render(`
    <article class="screen ending-card">
      <h2 class="ending-title">结局：差点落入骗局</h2>
      <p class="ending-copy">你继续按照页面要求填写了个人信息。这正是诈骗中常见的诱导手法：利用“奖学金补录”等高关注话题，制造紧迫感，引导学生泄露敏感信息。</p>

      <section class="risk-card">
        <p class="risk-title">风险提示</p>
        <ul class="risk-list">
          <li>官方奖学金通知通常不会通过陌生链接要求紧急填写敏感信息</li>
          <li>可疑域名与学校官方渠道不符</li>
          <li>“24小时内处理”“逾期作废”等话术常被用于制造心理压力</li>
          <li>遇到类似情况，应先向辅导员、教务老师或学校官方平台核实</li>
          <li>身份证号、银行卡号、短信验证码等信息不能随意提交</li>
        </ul>
      </section>

      <div class="actions">
        <button class="primary-button" type="button" data-action="restart">重新开始</button>
        <button class="choice-button safe" type="button" data-action="view-ai">查看AI反诈分析</button>
      </div>
    </article>
  `);

  bindClick("[data-action='restart']", showIntro);
  bindClick("[data-action='view-ai']", showScene4);
  console.log("secondChoice =", state.secondChoice, "endingType =", state.endingType);
}

function showScene4() {
  state.currentScene = "scene4";
  setSceneMeta("Scene 04", "assistant");
  updateRiskAwareness("");

  render(`
    <article class="screen assistant-layout">
      <div class="visual-panel">
        <img class="scene-image" src="assets/V4-ai-helper.png" alt="大学生在宿舍里使用AI反诈助手分析可疑短信">
        <div class="image-vignette"></div>
      </div>

      <section class="chat-card">
        <div>
          <p class="scene-kicker">Scene 04 · AI反诈助手</p>
          <p class="story-text">你决定先借助 AI 反诈助手分析这条短信，看看它到底靠不靠谱。</p>
        </div>

        <div class="assistant-head">
          <div class="assistant-avatar" aria-hidden="true">AI</div>
          <div>
            <p class="assistant-title">AI反诈助手</p>
            <p class="assistant-subtitle">为你分析可疑短信与风险点</p>
          </div>
        </div>

        <div class="chat-log" id="chatLog" aria-live="polite"></div>
        <section class="awareness-card" id="riskAwarenessCard" aria-live="polite"></section>

        <div class="quick-prompts" aria-label="快捷提问">
          <button class="quick-button" type="button" data-prompt="这条短信可信吗？">这条短信可信吗？</button>
          <button class="quick-button" type="button" data-prompt="为什么说它像诈骗？">为什么说它像诈骗？</button>
          <button class="quick-button" type="button" data-prompt="我现在应该怎么做？">我现在应该怎么做？</button>
        </div>

        <div class="chat-input-row">
          <input class="chat-input" id="chatInput" type="text" placeholder="输入你想问AI反诈助手的问题">
          <button class="primary-button" type="button" data-action="send-chat">发送</button>
        </div>

        <div class="actions">
          <button class="primary-button" type="button" data-action="finish-judgement">完成判断</button>
        </div>
      </section>
    </article>
  `);

  initAssistantChat();
}

function initAssistantChat() {
  state.chatHistory = [];
  appendChatMessage("assistant", "你好，我可以帮你分析这条“奖学金补录通知”是否存在诈骗风险。你可以直接提问，也可以点击下方快捷问题。");
  renderRiskAwarenessCard();

  storyStage.querySelectorAll("[data-prompt]").forEach((button) => {
    button.addEventListener("click", () => sendAssistantMessage(button.dataset.prompt));
  });

  bindClick("[data-action='send-chat']", () => {
    const input = storyStage.querySelector("#chatInput");
    sendAssistantMessage(input.value);
    input.value = "";
  });

  const input = storyStage.querySelector("#chatInput");
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      sendAssistantMessage(input.value);
      input.value = "";
    }
  });

  bindClick("[data-action='finish-judgement']", showSafeEnding);
}

async function sendAssistantMessage(userText) {
  const trimmedText = userText.trim();
  if (!trimmedText) {
    return;
  }

  appendChatMessage("user", trimmedText);
  const result = await callAntiFraudAssistant(trimmedText);
  updateRiskAwareness(trimmedText, result);
  appendChatMessage("assistant", result.reply);
  renderRiskAwarenessCard();
}

function appendChatMessage(role, text, riskAwareness) {
  const chatLog = storyStage.querySelector("#chatLog");
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${role}`;
  bubble.textContent = text;

  chatLog.appendChild(bubble);

  if (riskAwareness) {
    const tag = document.createElement("span");
    tag.className = "awareness-tag";
    tag.textContent = `风险意识：${riskAwareness}`;
    chatLog.appendChild(tag);
  }

  state.chatHistory.push({ role, text, riskAwareness: riskAwareness || null });
  chatLog.scrollTop = chatLog.scrollHeight;
}

async function callAntiFraudAssistant(userText) {
  // 当前阶段使用本地 mock 规则。后续接入真实 LLM 时，只需替换此函数内部实现并保持返回结构一致。
  const text = userText.toLowerCase();

  if (
    text.includes("可信") ||
    text.includes("真的假的") ||
    text.includes("能信吗") ||
    text.includes("是否可靠") ||
    text.includes("是不是诈骗") ||
    text.includes("靠谱吗") ||
    text.includes("真假")
  ) {
    return {
      reply: "这条短信存在明显风险，不建议直接相信。它通过陌生链接引导你完成“资格确认”，这类通知应优先通过学校官网、教务平台或辅导员渠道核实，不要立即填写个人敏感信息。",
      riskAwareness: "警惕型",
      riskReason: "用户主动询问短信可信度，说明已经开始核实来源。",
    };
  }

  if (
    text.includes("为什么") ||
    text.includes("哪里可疑") ||
    text.includes("像诈骗") ||
    text.includes("风险点") ||
    text.includes("可疑之处") ||
    text.includes("风险")
  ) {
    return {
      reply: "它至少有三处可疑：第一，用“24小时内”“逾期作废”制造紧迫感；第二，链接域名不像学校官方地址；第三，通知内容会进一步诱导你填写身份证、银行卡、验证码等敏感信息。",
      riskAwareness: "警惕型",
      riskReason: "用户在追问可疑点，具备较强的风险识别意识。",
    };
  }

  if (
    text.includes("怎么做") ||
    text.includes("如何处理") ||
    text.includes("要不要点") ||
    text.includes("下一步") ||
    text.includes("应该怎么办") ||
    text.includes("应该") ||
    text.includes("处理")
  ) {
    return {
      reply: "建议先停止继续操作，不要填写任何敏感信息。你可以截图保留短信内容，再通过辅导员、学院通知群、教务系统等官方渠道核实。如果确认可疑，可直接删除并提醒同学注意。",
      riskAwareness: "警惕型",
      riskReason: "用户开始寻找正确处理方式，说明已经从冲动操作转向核实。",
    };
  }

  if (text.includes("链接") || text.includes("银行卡") || text.includes("身份证") || text.includes("验证码")) {
    return {
      reply: "凡是陌生页面索要身份证号、银行卡号、验证码或账号密码，都应视为高风险。验证码尤其不能提供，它可能被用于登录、转账或重置账号。",
      riskAwareness: "犹豫型",
      riskReason: "用户关注到了敏感信息，但仍需要进一步明确风险边界。",
    };
  }

  return {
    reply: "面对涉及奖学金、补贴、账户确认等消息时，先核实来源再行动最稳妥。只要它要求你点击陌生链接或提交敏感信息，就应提高警惕。",
    riskAwareness: "犹豫型",
    riskReason: "用户提出了泛化问题，已有求助行为，但风险判断还不够明确。",
  };
}

function updateRiskAwareness(userText = "", aiResult = null) {
  const text = userText.toLowerCase();
  let awareness = "犹豫型";
  let reason = "你已经意识到风险，但在紧迫话术下仍可能出现动摇。";

  if (state.firstChoice === "verify_first") {
    awareness = "警惕型";
    reason = "你在第一步就选择先核实消息真伪，具备较强的来源核查意识。";
  }

  if (state.firstChoice === "click_link") {
    awareness = "犹豫型";
    reason = "你一开始被陌生链接吸引，但已经开始重新评估风险。";
  }

  if (state.secondChoice === "submit_info") {
    awareness = "轻信型";
    reason = "你曾继续填写敏感信息，更容易受到官方措辞和限时压力影响。";
  }

  if (state.secondChoice === "consult_ai") {
    awareness = state.firstChoice === "click_link" ? "犹豫型" : "警惕型";
    reason = state.firstChoice === "click_link"
      ? "你曾点击链接，但及时停止并咨询 AI，风险意识正在提升。"
      : "你主动咨询 AI 进行核实，说明具备较强的防骗意识。";
  }

  if (
    text.includes("可信吗") ||
    text.includes("是不是诈骗") ||
    text.includes("如何核实") ||
    text.includes("为什么可疑") ||
    text.includes("我该怎么验证") ||
    text.includes("哪里可疑")
  ) {
    awareness = "警惕型";
    reason = "你的提问集中在核实来源和识别风险点，说明警惕性较强。";
  }

  if (
    text.includes("看起来像真的") ||
    text.includes("拿不准") ||
    text.includes("要不要点") ||
    text.includes("会不会错过")
  ) {
    awareness = awareness === "轻信型" ? "轻信型" : "犹豫型";
    reason = "你已经意识到不确定性，但仍可能被限时话术影响。";
  }

  if (
    text.includes("赶紧填") ||
    text.includes("先点了再说") ||
    text.includes("应该没问题吧")
  ) {
    awareness = "轻信型";
    reason = "你的表达显示出较强的冲动操作倾向，需要先停下来核实。";
  }

  if (aiResult && ["警惕型", "犹豫型", "轻信型"].includes(aiResult.riskAwareness)) {
    awareness = aiResult.riskAwareness;
    reason = aiResult.riskReason || reason;
  }

  state.riskAwareness = awareness;
  state.riskReason = reason;
  window.riskAwareness = awareness;
}

function renderRiskAwarenessCard() {
  const card = storyStage.querySelector("#riskAwarenessCard");
  if (!card) {
    return;
  }

  const descriptions = {
    "警惕型": "你具备较强的核实意识，遇到可疑链接时会主动求证。",
    "犹豫型": "你已经意识到风险，但在紧迫话术下仍可能出现动摇。",
    "轻信型": "你更容易被“官方通知”和“限时处理”等措辞影响，需要提高警惕。",
  };

  card.innerHTML = `
    <p class="awareness-title">你的风险识别倾向</p>
    <div class="awareness-result ${getAwarenessClass(state.riskAwareness)}">${state.riskAwareness}</div>
    <p class="awareness-copy">${descriptions[state.riskAwareness]}</p>
    <p class="awareness-reason">${state.riskReason}</p>
  `;
}

function getAwarenessClass(awareness) {
  if (awareness === "警惕型") {
    return "alert";
  }

  if (awareness === "轻信型") {
    return "trusting";
  }

  return "hesitant";
}

function showSafeEnding() {
  state.currentScene = "endingSafe";
  state.endingType = "safe";
  window.endingType = state.endingType;
  setSceneMeta("Ending Safe", "ending");

  render(`
    <article class="screen ending-card safe-ending">
      <h2 class="ending-title">结局：成功识破骗局</h2>
      <p class="ending-copy">通过先核实、再判断，你避免了在冲动之下泄露个人信息。面对“奖学金补录”“补贴发放”“快递异常”等消息时，保持冷静、核实来源，往往就是防骗的关键一步。</p>

      <section class="risk-card summary-card">
        <p class="risk-title">反诈总结</p>
        <p class="summary-line">你的风险识别倾向：<strong>${state.riskAwareness}</strong></p>
        <ul class="risk-list">
          <li>不轻信陌生链接</li>
          <li>不填写身份证、银行卡、验证码等敏感信息</li>
          <li>涉及学校事务时，优先通过辅导员、教务系统和官方通知核实</li>
        </ul>
      </section>

      <div class="actions">
        <button class="primary-button" type="button" data-action="restart">重新开始</button>
      </div>
    </article>
  `);

  bindClick("[data-action='restart']", restartStory);
}

function restartStory() {
  showIntro();
}

showIntro();
