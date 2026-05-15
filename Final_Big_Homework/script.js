const storyStage = document.querySelector("#storyStage");
const sceneChip = document.querySelector("#sceneChip");
const progressSteps = document.querySelectorAll(".progress-step");

const state = {
  currentScene: "intro",
  firstChoice: null,
  secondChoice: null,
  endingType: null,
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
  state.chatHistory = [];
  window.firstChoice = null;
  window.secondChoice = null;
  window.endingType = null;
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
        <p class="scene-kicker">Scene 03 / 伪造认证页面</p>
        <p class="story-text">你点开了短信中的链接。页面看起来像“奖学金资格认证”，要求你填写个人信息。虽然界面像模像样，但你心里还是隐隐觉得不太对劲。</p>

        <div class="fake-form-card" aria-label="伪造认证页面表单示意">
          <p class="fake-form-title">奖学金资格认证</p>
          <div class="fake-form-row"><span>姓名</span><span class="fake-input"></span></div>
          <div class="fake-form-row"><span>学号</span><span class="fake-input"></span></div>
          <div class="fake-form-row"><span>身份证号</span><span class="fake-input"></span></div>
          <div class="fake-form-row"><span>银行卡号</span><span class="fake-input"></span></div>
          <div class="fake-form-row"><span>验证码</span><span class="fake-input"></span></div>
          <div class="fake-submit">提交认证</div>
        </div>

        <div class="actions">
          <button class="choice-button risky" type="button" data-action="submit-info">A1. 继续填写信息</button>
          <button class="choice-button safe" type="button" data-action="ask-ai">A2. 停止操作，咨询AI反诈助手</button>
        </div>
      </section>
    </article>
  `);

  bindClick("[data-action='submit-info']", showRiskEnding);
  bindClick("[data-action='ask-ai']", () => {
    state.secondChoice = "ask_ai";
    window.secondChoice = state.secondChoice;
    showScene4();
  });
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
      <h2 class="ending-title">【结局：差点落入骗局】</h2>
      <p class="ending-copy">你继续按照页面要求填写了个人信息。这正是诈骗中常见的诱导手法：利用“奖学金补录”等高关注话题，制造紧迫感，引导学生泄露敏感信息。</p>

      <section class="risk-card">
        <p class="risk-title">风险提示</p>
        <ul class="risk-list">
          <li>官方奖学金通知通常不会通过陌生链接要求紧急填写敏感信息</li>
          <li>可疑域名与学校官方渠道不符</li>
          <li>使用“24小时内处理”“逾期作废”等话术制造压力</li>
          <li>遇到类似情况应先向学校老师、辅导员或官方平台核实</li>
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

  render(`
    <article class="screen assistant-layout">
      <div class="visual-panel">
        <img class="scene-image" src="assets/V4-ai-helper.png" alt="大学生在宿舍里使用AI反诈助手分析可疑短信">
        <div class="image-vignette"></div>
      </div>

      <section class="chat-card">
        <div>
          <p class="scene-kicker">Scene 04 / AI反诈助手</p>
          <p class="story-text">你决定先借助 AI 反诈助手分析这条短信，看看它到底靠不靠谱。</p>
        </div>

        <div class="assistant-head">
          <div class="assistant-avatar" aria-hidden="true">AI</div>
          <div>
            <p class="assistant-title">AI反诈助手</p>
            <p class="assistant-subtitle">Mock 分析模块，后续可替换为真实 LLM API</p>
          </div>
        </div>

        <div class="chat-log" id="chatLog" aria-live="polite"></div>

        <div class="quick-prompts" aria-label="快捷提问">
          <button class="quick-button" type="button" data-prompt="这条短信可信吗？">这条短信可信吗？</button>
          <button class="quick-button" type="button" data-prompt="为什么说它像诈骗？">为什么说它像诈骗？</button>
          <button class="quick-button" type="button" data-prompt="我现在应该怎么做？">我现在应该怎么做？</button>
        </div>

        <div class="chat-input-row">
          <input class="chat-input" id="chatInput" type="text" placeholder="输入你想问AI反诈助手的问题">
          <button class="primary-button" type="button" data-action="send-chat">发送</button>
        </div>
      </section>
    </article>
  `);

  initAssistantChat();
}

function initAssistantChat() {
  state.chatHistory = [];
  appendChatMessage("assistant", "我会先从来源、话术、链接和信息索取范围四个方面判断风险。这条短信包含陌生链接、24小时紧迫要求，并要求资格确认，建议先不要点击或填写敏感信息。", "警惕型");

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
}

async function sendAssistantMessage(userText) {
  const trimmedText = userText.trim();
  if (!trimmedText) {
    return;
  }

  appendChatMessage("user", trimmedText);
  const result = await callAntiFraudAssistant(trimmedText);
  appendChatMessage("assistant", result.reply, result.riskAwareness);
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

  if (text.includes("可信") || text.includes("靠谱吗") || text.includes("真假")) {
    return {
      reply: "不建议相信。它用“奖学金补录”吸引注意，又用“24小时内确认”制造紧迫感，还把你引向非学校官方域名，这些都是高风险信号。",
      riskAwareness: "警惕型",
    };
  }

  if (text.includes("为什么") || text.includes("像诈骗") || text.includes("风险")) {
    return {
      reply: "它像诈骗主要有三点：第一，陌生链接和学校官方渠道不一致；第二，要求填写身份证号、银行卡号等敏感信息；第三，用逾期作废的话术压缩你的判断时间。",
      riskAwareness: "警惕型",
    };
  }

  if (text.includes("怎么做") || text.includes("应该") || text.includes("处理")) {
    return {
      reply: "现在应停止点击和填写，保留短信截图，通过学校官网、辅导员、学院通知群或奖助学金官方系统核实。已经填写过信息时，应尽快联系银行和学校，并修改相关账号密码。",
      riskAwareness: "警惕型",
    };
  }

  if (text.includes("链接") || text.includes("银行卡") || text.includes("身份证") || text.includes("验证码")) {
    return {
      reply: "凡是陌生页面索要身份证号、银行卡号、验证码或账号密码，都应视为高风险。验证码尤其不能提供，它可能被用于登录、转账或重置账号。",
      riskAwareness: "犹豫型",
    };
  }

  return {
    reply: "从反诈角度看，请优先核实来源，不要被紧急措辞带着走。你可以继续问我：这条短信可信吗、为什么像诈骗、现在应该怎么做。",
    riskAwareness: "犹豫型",
  };
}

showIntro();
