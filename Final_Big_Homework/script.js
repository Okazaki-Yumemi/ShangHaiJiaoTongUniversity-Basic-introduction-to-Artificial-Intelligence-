const storyStage = document.querySelector("#storyStage");
const sceneChip = document.querySelector("#sceneChip");
const progressSteps = document.querySelectorAll(".progress-step");

const state = {
  currentScene: "intro",
  firstChoice: null,
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
  setSceneMeta("Scene 02", "choice");

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
  // 这里先记录第一次关键选择，后续可接入 Scene 03、结局分支或 LLM 反诈助手。
  state.firstChoice = choice;
  state.currentScene = "firstChoiceFeedback";
  window.firstChoice = choice;

  const feedbackText =
    choice === "click_link"
      ? "你选择了直接点击链接。主角即将进入高风险流程。"
      : "你选择了先核实消息来源。主角保持了基本警惕。";

  setSceneMeta("Choice Saved", "choice");

  render(`
    <article class="screen feedback-card">
      <p class="scene-kicker">第一次分支选择</p>
      <p>${feedbackText}</p>
      <button class="disabled-button" type="button" aria-disabled="true">后续剧情开发中</button>
    </article>
  `);

  console.log("firstChoice =", state.firstChoice);
}

showIntro();
