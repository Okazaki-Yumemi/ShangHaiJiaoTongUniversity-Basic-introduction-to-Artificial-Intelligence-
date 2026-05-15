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
  gate2Choice: null,
  gate2Outcome: null,
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
  state.gate2Choice = null;
  state.gate2Outcome = null;
  state.chatHistory = [];
  window.firstChoice = null;
  window.secondChoice = null;
  window.endingType = null;
  window.riskAwareness = null;
  window.gate2Choice = null;
  window.gate2Outcome = null;
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
  const isGate2Context =
    state.currentScene === "gate2AI" ||
    text.includes("代付") ||
    text.includes("扫码") ||
    text.includes("陌生人") ||
    text.includes("求助") ||
    text.includes("垫");

  if (
    isGate2Context &&
    (
      text.includes("可信吗") ||
      text.includes("会不会是骗局") ||
      text.includes("是不是诈骗") ||
      text.includes("能不能信") ||
      text.includes("能信吗")
    )
  ) {
    return {
      reply: "陌生人求助不一定都是诈骗，但一旦涉及扫码、代付、转账，就要提高警惕。不建议直接发生资金交易，更稳妥的方式是引导对方去保卫处、服务台、老师或校园值班点寻求帮助。",
      riskAwareness: "警惕型",
      riskReason: "用户主动询问线下求助是否可信，说明已经意识到资金交易风险。",
    };
  }

  if (
    isGate2Context &&
    (
      text.includes("为什么代付有风险") ||
      text.includes("为什么扫码有风险") ||
      text.includes("风险点是什么") ||
      text.includes("有什么问题") ||
      text.includes("风险点") ||
      text.includes("风险")
    )
  ) {
    return {
      reply: "代付类求助容易利用同情心和紧迫感。风险点包括：对方身份难核实，小额代付可能只是试探，后续可能升级金额，也可能引导你下载 App、进入群聊或继续扫码转账。",
      riskAwareness: "警惕型",
      riskReason: "用户关注代付和扫码风险点，具备主动识别套路的倾向。",
    };
  }

  if (
    isGate2Context &&
    (
      text.includes("我该怎么帮") ||
      text.includes("怎么处理更安全") ||
      text.includes("应该怎么办") ||
      text.includes("如何帮助对方") ||
      text.includes("怎么帮助") ||
      text.includes("怎么帮")
    )
  ) {
    return {
      reply: "可以提供非资金型帮助，例如陪同对方去保卫处、服务台、辅导员办公室或校园值班点。不建议直接扫码或转账；如果对方拒绝官方帮助、坚持让你付款，就更应提高警惕。",
      riskAwareness: "警惕型",
      riskReason: "用户倾向寻找安全帮助方式，能在善意和边界之间做平衡。",
    };
  }

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

  if (state.gate2Choice === "pay_directly") {
    awareness = "轻信型";
    reason = "你倾向直接帮陌生人扫码或代付，容易被紧急求助和小额金额降低警惕。";
  }

  if (state.gate2Choice === "seek_official_help") {
    awareness = "警惕型";
    reason = "你选择引导对方寻求校内官方帮助，既保留善意，也守住了资金边界。";
  }

  if (state.gate2Choice === "consult_ai") {
    awareness = "警惕型";
    reason = "你没有直接付款，而是先咨询 AI 分析风险，具备核实意识。";
  }

  if (
    text.includes("可信吗") ||
    text.includes("是不是诈骗") ||
    text.includes("如何核实") ||
    text.includes("为什么可疑") ||
    text.includes("我该怎么验证") ||
    text.includes("哪里可疑") ||
    text.includes("怎么处理更安全") ||
    text.includes("如何帮助对方") ||
    text.includes("怎么帮助")
  ) {
    awareness = "警惕型";
    reason = "你的提问集中在核实来源和识别风险点，说明警惕性较强。";
  }

  if (
    text.includes("看起来像真的") ||
    text.includes("拿不准") ||
    text.includes("要不要点") ||
    text.includes("会不会错过") ||
    text.includes("就几十块")
  ) {
    awareness = awareness === "轻信型" ? "轻信型" : "犹豫型";
    reason = "你已经意识到不确定性，但仍可能被限时话术影响。";
  }

  if (
    text.includes("赶紧填") ||
    text.includes("先点了再说") ||
    text.includes("应该没问题吧") ||
    text.includes("直接扫") ||
    text.includes("直接付")
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
        <button class="primary-button" type="button" data-action="continue-campus">继续今天的校园经历</button>
        <button class="primary-button" type="button" data-action="restart">重新开始</button>
      </div>
    </article>
  `);

  bindClick("[data-action='continue-campus']", showScene5);
  bindClick("[data-action='restart']", restartStory);
}

function showScene5() {
  state.currentScene = "scene5";
  setSceneMeta("Scene 05", "campus");

  render(`
    <article class="screen scene-layout">
      <div class="visual-panel">
        <img class="scene-image" src="assets/V5-campus-help.png" alt="校园路边，主角被陌生年轻人拦下求助">
        <div class="image-vignette"></div>
      </div>

      <section class="narrative-panel">
        <p class="scene-kicker">Scene 05 · 校园路边求助</p>
        <p class="story-text">离开宿舍后，你走在校园路上。一位陌生年轻人忽然叫住你，神情有些焦急，似乎想请你帮个忙。</p>
        <div class="actions">
          <button class="primary-button" type="button" data-action="continue-scene6">继续查看</button>
        </div>
      </section>
    </article>
  `);

  bindClick("[data-action='continue-scene6']", showScene6);
}

function showScene6() {
  state.currentScene = "scene6";
  setSceneMeta("Scene 06", "campus");

  render(`
    <article class="screen scene-layout">
      <div class="visual-panel">
        <img class="scene-image" src="assets/V6-campus-payment-request.png" alt="陌生人展示手机付款码并提出代付请求">
        <div class="image-vignette"></div>
      </div>

      <section class="narrative-panel">
        <p class="scene-kicker">Scene 06 · 代付请求</p>
        <p class="story-text">对方解释说，自己的支付突然出了问题，想请你帮忙先扫一下这个付款码，或者代付一小笔钱，之后再转给你。事情听起来不算大，但已经涉及金钱交易。</p>

        <section class="situation-card">
          <p class="situation-title">对方的常见说辞</p>
          <ul class="risk-list">
            <li>手机临时没电 / 支付异常</li>
            <li>微信 / 支付宝限额</li>
            <li>先帮我垫一下，我马上还你</li>
            <li>就几十块钱，很快的</li>
          </ul>
        </section>

        <div class="actions">
          <button class="choice-button risky" type="button" data-gate2-choice="pay_directly">直接帮他扫码付款</button>
          <button class="choice-button safe" type="button" data-gate2-choice="seek_official_help">提议带他去保卫处 / 服务台 / 找老师</button>
          <button class="choice-button safe" type="button" data-gate2-choice="consult_ai">咨询AI反诈助手</button>
        </div>
      </section>
    </article>
  `);

  storyStage.querySelectorAll("[data-gate2-choice]").forEach((button) => {
    button.addEventListener("click", () => handleGate2Choice(button.dataset.gate2Choice));
  });
}

function handleGate2Choice(choice) {
  state.gate2Choice = choice;
  window.gate2Choice = choice;

  if (choice === "pay_directly") {
    state.gate2Outcome = "risk";
    window.gate2Outcome = state.gate2Outcome;
    updateRiskAwareness("直接帮他扫码付款");
    showGate2RiskResult();
    return;
  }

  if (choice === "seek_official_help") {
    state.gate2Outcome = "safe";
    window.gate2Outcome = state.gate2Outcome;
    updateRiskAwareness("提议带他去保卫处服务台找老师");
    showGate2SafeResult();
    return;
  }

  state.gate2Outcome = "ai";
  window.gate2Outcome = state.gate2Outcome;
  updateRiskAwareness("咨询AI反诈助手");
  showGate2AIAnalysis();
}

function showGate2RiskResult() {
  state.currentScene = "gate2Risk";
  setSceneMeta("Gate 02 Risk", "ending");

  render(`
    <article class="screen ending-card">
      <h2 class="ending-title">第二关结果：高风险处理</h2>
      <p class="ending-copy">你选择直接帮陌生人扫码付款。虽然对方的说辞听起来像普通求助，但一旦涉及陌生人代付、扫码、转账，就存在被骗或被引导进入后续套路的风险。</p>

      <section class="risk-card">
        <p class="risk-title">风险提示</p>
        <ul class="risk-list">
          <li>陌生人线下求助并不一定都是诈骗，但涉及金钱交易应提高警惕</li>
          <li>小额代付往往利用同情心和不好意思拒绝的心理</li>
          <li>有些骗局会先用小额试探，再逐步升级金额或引导下载 App</li>
          <li>更稳妥的方式是提供非资金型帮助，例如陪同找保卫处或服务台</li>
        </ul>
      </section>

      <section class="awareness-card" id="riskAwarenessCard"></section>

      <div class="actions">
        <button class="choice-button safe" type="button" data-action="gate2-ai">咨询AI反诈助手</button>
        <button class="primary-button" type="button" data-action="coming-soon">继续下一关（开发中）</button>
        <button class="choice-button" type="button" data-action="restart">重新开始</button>
      </div>
    </article>
  `);

  renderRiskAwarenessCard();
  bindClick("[data-action='gate2-ai']", showGate2AIAnalysis);
  bindClick("[data-action='coming-soon']", showComingSoonScene);
  bindClick("[data-action='restart']", restartStory);
}

function showGate2SafeResult() {
  state.currentScene = "gate2Safe";
  setSceneMeta("Gate 02 Safe", "ending");

  render(`
    <article class="screen ending-card safe-ending">
      <h2 class="ending-title">第二关结果：较稳妥的帮助方式</h2>
      <p class="ending-copy">你没有直接参与金钱交易，而是选择引导对方寻求学校内更可靠的帮助渠道。这种方式既保留了善意，也降低了自己被卷入骗局的风险。</p>

      <section class="risk-card safe-card">
        <p class="risk-title">安全处理卡片</p>
        <ul class="risk-list">
          <li>面对陌生求助，优先提供非资金型帮助</li>
          <li>可建议对方去保卫处、服务台、辅导员办公室或校园值班点</li>
          <li>不要因为对方着急，就直接扫码付款或转账</li>
          <li>保持礼貌，但也要守住边界</li>
        </ul>
      </section>

      <section class="awareness-card" id="riskAwarenessCard"></section>

      <div class="actions">
        <button class="choice-button safe" type="button" data-action="gate2-ai">咨询AI反诈助手</button>
        <button class="primary-button" type="button" data-action="coming-soon">继续下一关（开发中）</button>
        <button class="choice-button" type="button" data-action="restart">重新开始</button>
      </div>
    </article>
  `);

  renderRiskAwarenessCard();
  bindClick("[data-action='gate2-ai']", showGate2AIAnalysis);
  bindClick("[data-action='coming-soon']", showComingSoonScene);
  bindClick("[data-action='restart']", restartStory);
}

function showGate2AIAnalysis() {
  state.currentScene = "gate2AI";
  setSceneMeta("Scene 07", "assistant");
  updateRiskAwareness("陌生人代付请求");

  render(`
    <article class="screen assistant-layout">
      <div class="visual-panel">
        <img class="scene-image" src="assets/V6-campus-payment-request.png" alt="陌生人展示手机付款码并请求代付">
        <div class="image-vignette"></div>
      </div>

      <section class="chat-card">
        <div>
          <p class="scene-kicker">Scene 07 · AI分析：陌生人代付请求</p>
          <p class="story-text">你决定先借助 AI 反诈助手分析这次求助，看它是否存在风险。</p>
        </div>

        <div class="assistant-head">
          <div class="assistant-avatar" aria-hidden="true">AI</div>
          <div>
            <p class="assistant-title">AI反诈助手</p>
            <p class="assistant-subtitle">为你分析代付、扫码与陌生收款码风险</p>
          </div>
        </div>

        <div class="chat-log" id="chatLog" aria-live="polite"></div>
        <section class="awareness-card" id="riskAwarenessCard" aria-live="polite"></section>

        <div class="quick-prompts" aria-label="快捷提问">
          <button class="quick-button" type="button" data-prompt="这类求助可信吗？">这类求助可信吗？</button>
          <button class="quick-button" type="button" data-prompt="为什么代付有风险？">为什么代付有风险？</button>
          <button class="quick-button" type="button" data-prompt="我该怎么帮助对方更安全？">我该怎么帮助对方更安全？</button>
        </div>

        <div class="chat-input-row">
          <input class="chat-input" id="chatInput" type="text" placeholder="输入你想问AI反诈助手的问题">
          <button class="primary-button" type="button" data-action="send-chat">发送</button>
        </div>

        <div class="actions">
          <button class="primary-button" type="button" data-action="finish-gate2">完成本关判断</button>
        </div>
      </section>
    </article>
  `);

  initGate2AssistantChat();
}

function initGate2AssistantChat() {
  state.chatHistory = [];
  appendChatMessage("assistant", "你好，我可以帮你分析这类“陌生人求助代付 / 扫码付款”场景的风险。你可以问我这是不是诈骗、有哪些风险点，或者遇到这种情况应该怎么处理。");
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

  bindClick("[data-action='finish-gate2']", showGate2Summary);
}

function showGate2Summary() {
  state.currentScene = "gate2Summary";
  state.gate2Outcome = "safe";
  window.gate2Outcome = state.gate2Outcome;
  setSceneMeta("Gate 02 Summary", "ending");

  render(`
    <article class="screen ending-card safe-ending">
      <h2 class="ending-title">第二关总结：陌生求助不等于直接转账</h2>
      <p class="ending-copy">面对陌生人的紧急求助，保持善意并不意味着必须直接转账或代付。更稳妥的帮助方式，是引导对方寻求学校内更可靠的官方协助。</p>

      <section class="risk-card summary-card">
        <p class="risk-title">本关总结</p>
        <p class="summary-line">你的本关处理倾向：<strong>${state.riskAwareness}</strong></p>
        <ul class="risk-list">
          <li>不轻易与陌生人发生资金交易</li>
          <li>面对紧急求助，优先提供非资金型帮助</li>
          <li>涉及扫码、转账、代付时，先核实再决定</li>
        </ul>
      </section>

      <div class="actions">
        <button class="primary-button" type="button" data-action="coming-soon">继续下一关（开发中）</button>
        <button class="choice-button" type="button" data-action="restart">重新开始</button>
      </div>
    </article>
  `);

  bindClick("[data-action='coming-soon']", showComingSoonScene);
  bindClick("[data-action='restart']", restartStory);
}

function showComingSoonScene() {
  state.currentScene = "comingSoon";
  setSceneMeta("Coming Soon", "ending");

  render(`
    <article class="screen coming-card">
      <h2 class="ending-title">第三关开发中</h2>
      <p class="ending-copy">下一关将围绕校园中常见的二维码 / 小广告引流风险展开。当前版本先完成到这里，你可以重新体验前面的反诈闯关内容。</p>

      <section class="next-card">
        <p class="next-title">继续下一关（共享单车二维码）</p>
        <p class="choice-note">第三关开发中，后续可继续接入新的场景图片、分支选择与 AI 分析。</p>
      </section>

      <div class="actions">
        <button class="primary-button" type="button" data-action="restart">重新开始</button>
        <button class="choice-button safe" type="button" data-action="back-summary">返回第二关总结</button>
      </div>
    </article>
  `);

  bindClick("[data-action='restart']", restartStory);
  bindClick("[data-action='back-summary']", showGate2Summary);
}

function restartStory() {
  showIntro();
}

showIntro();
