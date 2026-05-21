const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const PptxGenJS = require("pptxgenjs");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} = require("docx");

const ROOT = __dirname;
const OUT = path.join(ROOT, "output");
fs.mkdirSync(OUT, { recursive: true });

const topic = "大语言模型智能体：方法、评测与安全";
const retrievalDate = "2026-05-21";

const papers = [
  {
    id: "P1",
    shortTitle: "Survey",
    title: "A Survey on Large Language Model based Autonomous Agents",
    authors: "Lei Wang, Chen Ma, Xueyang Feng, et al.",
    year: "2024",
    published: "2024-03-22",
    type: "综述论文",
    source: "Frontiers of Computer Science / arXiv",
    link: "https://arxiv.org/abs/2308.11432",
    doi: "https://doi.org/10.1007/s11704-024-40231-1",
    researchQuestion:
      "系统梳理 LLM-based autonomous agents 的统一架构、应用场景、评测方式与未来挑战。",
    methodology:
      "对既有 LLM 智能体研究做系统综述，抽象出统一框架，并从应用、评测、挑战三个维度归纳。",
    findings: [
      "提出可覆盖多数工作的统一框架，便于把智能体理解为“感知/记忆/规划/行动”的协同系统。",
      "应用场景已从对话扩展到社会科学、自然科学与工程问题。",
      "评测仍缺统一标准，真实环境泛化、长期规划、成本控制与安全性是主要难点。",
    ],
    significance:
      "适合作为选题的理论底座，能够为后续实验类论文提供分类框架与比较坐标。",
    limitations: [
      "属于综述，不直接给出新的实验结果。",
      "对 2025 之后的新型 computer-use agents 覆盖有限。",
    ],
    future: "需要更真实的环境评测、更稳健的记忆机制，以及更明确的安全边界。",
  },
  {
    id: "P2",
    shortTitle: "OSWorld",
    title: "OSWorld: Benchmarking Multimodal Agents for Open-Ended Tasks in Real Computer Environments",
    authors: "Tianbao Xie, Danyang Zhang, Jixuan Chen, et al.",
    year: "2024",
    published: "2024-04-11",
    type: "评测基准论文",
    source: "arXiv / NeurIPS 2024 Datasets and Benchmarks Track",
    link: "https://arxiv.org/abs/2404.07972",
    doi: "https://doi.org/10.48550/arXiv.2404.07972",
    researchQuestion:
      "真实计算机环境中的多模态智能体，距离可用的通用计算机助手还有多远？",
    methodology:
      "构建可扩展的真实计算机环境，覆盖 Ubuntu、Windows、macOS；在 369 个真实开放任务上做执行式评测。",
    findings: [
      "OSWorld 支持 web/desktop/file I/O/跨应用 workflow 的统一评测。",
      "人类可完成超过 72.36% 的任务，而最优模型只有 12.24%。",
      "主要瓶颈不只是推理，而是 GUI grounding 与 operational knowledge。",
    ],
    significance:
      "把“会聊天的智能体”与“真的会操作电脑的智能体”区分开，强调真实环境评测的重要性。",
    limitations: [
      "任务仍以桌面工作流为主，尚不能代表所有实体世界交互。",
      "评测成绩会受模型版本、视觉能力与工具栈变化影响。",
    ],
    future: "需要更强的视觉定位、长期执行稳定性与跨应用经验迁移能力。",
  },
  {
    id: "P3",
    shortTitle: "Zero-Day",
    title: "Teams of LLM Agents can Exploit Zero-Day Vulnerabilities",
    authors: "Yuxuan Zhu, Antony Kellermann, Akul Gupta, et al.",
    year: "2024/2025",
    published: "2024-06-02",
    type: "安全研究论文",
    source: "arXiv",
    link: "https://arxiv.org/abs/2406.01637",
    doi: "https://doi.org/10.48550/arXiv.2406.01637",
    researchQuestion:
      "多智能体协作是否已经足以在真实世界中自主利用零日漏洞？",
    methodology:
      "提出 HPTSA 多智能体系统，由规划代理调度子代理；在 14 个真实漏洞上与已有 agent framework 对比。",
    findings: [
      "团队式 agent 能缓解单代理在长程规划与并行探索上的不足。",
      "在 14 个真实漏洞基准上，相比先前框架最高提升可达 4.3 倍。",
      "LLM agent 的能力提升同时意味着真实的网络安全风险上升。",
    ],
    significance:
      "提醒研究者：智能体进步不能只看能力上限，必须同步考虑防滥用、审计与安全约束。",
    limitations: [
      "论文聚焦特定漏洞基准，外推到更广泛攻击面仍需谨慎。",
      "实验条件与工具配置会影响实际 exploit 成功率。",
    ],
    future: "未来研究应把 agent capability evaluation 与 safety governance 一并纳入标准流程。",
  },
];

const skillLog = [
  {
    name: "/find-skills",
    usage: "扫描本地 .trae/skills 与补充 skills，确认 academic-researcher、docx、pptx、pdf 等技能可用。",
  },
  {
    name: "/academic-researcher",
    usage: "按“研究问题-方法-发现-意义-局限-未来方向”框架整理三篇代表性论文。",
  },
  {
    name: "/docx",
    usage: "生成结构化文献综述 Word 文档，作为“论文检索→总结”的中间产物。",
  },
  {
    name: "/pdf",
    usage: "确认论文 PDF 处理链路与摘要提取方案；本次最终提交不额外交单独 PDF 文件。",
  },
  {
    name: "/pptx",
    usage: "生成最终展示汇报 PPTX。",
  },
];

function writeTextFile(fileName, content) {
  fs.writeFileSync(path.join(OUT, fileName), content, "utf8");
}

function buildMarkdown() {
  const lines = [];
  lines.push(`# ${topic}`);
  lines.push("");
  lines.push(`- 检索日期：${retrievalDate}`);
  lines.push(`- 选题定位：人工智能专业中的“大语言模型智能体”方向`);
  lines.push(`- 流程：论文检索 → 结构化总结 → 生成 PPT`);
  lines.push("");
  lines.push("## 使用的 Skill");
  lines.push("");
  for (const item of skillLog) {
    lines.push(`- ${item.name}：${item.usage}`);
  }
  lines.push("");
  lines.push("## 检索策略");
  lines.push("");
  lines.push("- 关键词：LLM agents, autonomous agents, benchmark, computer use, zero-day vulnerabilities");
  lines.push("- 选文标准：1) 主题代表性强；2) 一篇综述 + 一篇评测 + 一篇安全；3) 以原始论文页面为主。");
  lines.push("");
  lines.push("## 论文摘要与分析");
  lines.push("");
  for (const paper of papers) {
    lines.push(`### ${paper.id}. ${paper.title}`);
    lines.push("");
    lines.push(`- 作者：${paper.authors}`);
    lines.push(`- 类型：${paper.type}`);
    lines.push(`- 发布时间：${paper.published}`);
    lines.push(`- 链接：${paper.link}`);
    lines.push(`- 研究问题：${paper.researchQuestion}`);
    lines.push(`- 方法：${paper.methodology}`);
    lines.push(`- 关键发现：`);
    for (const finding of paper.findings) {
      lines.push(`  - ${finding}`);
    }
    lines.push(`- 研究意义：${paper.significance}`);
    lines.push(`- 局限性：`);
    for (const limitation of paper.limitations) {
      lines.push(`  - ${limitation}`);
    }
    lines.push(`- 未来方向：${paper.future}`);
    lines.push("");
  }
  lines.push("## 综合结论");
  lines.push("");
  lines.push("- 趋势 1：智能体研究正从“语言能力”转向“真实环境执行能力”。");
  lines.push("- 趋势 2：评测从静态 benchmark 走向真实操作系统与长链条任务。");
  lines.push("- 趋势 3：多智能体协作提升能力上限，但也同步放大安全风险。");
  lines.push("- 结论：未来智能体研究的关键，不只是更强的模型，而是“真实评测 + 长程规划 + 安全治理”的三位一体。");
  lines.push("");
  lines.push("## 参考文献");
  lines.push("");
  lines.push(
    "- Wang, L., Ma, C., Feng, X., et al. (2024). A survey on large language model based autonomous agents. Frontiers of Computer Science, 18, 186345. https://doi.org/10.1007/s11704-024-40231-1"
  );
  lines.push(
    "- Xie, T., Zhang, D., Chen, J., et al. (2024). OSWorld: Benchmarking Multimodal Agents for Open-Ended Tasks in Real Computer Environments. arXiv:2404.07972. https://doi.org/10.48550/arXiv.2404.07972"
  );
  lines.push(
    "- Zhu, Y., Kellermann, A., Gupta, A., et al. (2024). Teams of LLM Agents can Exploit Zero-Day Vulnerabilities. arXiv:2406.01637. https://doi.org/10.48550/arXiv.2406.01637"
  );
  return lines.join("\n");
}

function createFigureSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1800" height="720" viewBox="0 0 1800 720" xmlns="http://www.w3.org/2000/svg">
  <rect width="1800" height="720" fill="#F5F1EA"/>
  <text x="90" y="74" font-family="Arial, Microsoft YaHei" font-size="34" font-weight="700" fill="#2B2622">
    LLM智能体研究三面板图：架构、评测与安全
  </text>

  <rect x="70" y="110" width="520" height="540" rx="22" fill="#FFFDFC" stroke="#D4C8BA" stroke-width="2"/>
  <text x="100" y="155" font-family="Arial, Microsoft YaHei" font-size="26" font-weight="700" fill="#9C3D2B">A. 统一架构</text>
  <text x="100" y="190" font-family="Arial, Microsoft YaHei" font-size="16" fill="#5A534B">基于 Survey 论文归纳的典型 agent 闭环</text>
  <rect x="105" y="235" width="110" height="60" rx="14" fill="#1F4E5F"/>
  <rect x="245" y="235" width="110" height="60" rx="14" fill="#C07A3A"/>
  <rect x="385" y="235" width="110" height="60" rx="14" fill="#6D8B74"/>
  <rect x="245" y="345" width="110" height="60" rx="14" fill="#A34B39"/>
  <text x="160" y="272" text-anchor="middle" font-family="Arial, Microsoft YaHei" font-size="19" font-weight="700" fill="#FFFFFF">感知</text>
  <text x="300" y="272" text-anchor="middle" font-family="Arial, Microsoft YaHei" font-size="19" font-weight="700" fill="#FFFFFF">规划</text>
  <text x="440" y="272" text-anchor="middle" font-family="Arial, Microsoft YaHei" font-size="19" font-weight="700" fill="#FFFFFF">记忆</text>
  <text x="300" y="382" text-anchor="middle" font-family="Arial, Microsoft YaHei" font-size="19" font-weight="700" fill="#FFFFFF">行动</text>
  <line x1="215" y1="265" x2="245" y2="265" stroke="#5A534B" stroke-width="3"/>
  <line x1="355" y1="265" x2="385" y2="265" stroke="#5A534B" stroke-width="3"/>
  <line x1="300" y1="295" x2="300" y2="345" stroke="#5A534B" stroke-width="3"/>
  <path d="M300 405 C300 470, 160 470, 160 295" fill="none" stroke="#5A534B" stroke-width="3"/>
  <text x="105" y="485" font-family="Arial, Microsoft YaHei" font-size="18" font-weight="700" fill="#2B2622">结论：</text>
  <text x="105" y="515" font-family="Arial, Microsoft YaHei" font-size="17" fill="#2B2622">智能体不是单一模型，而是“感知-规划-记忆-行动”</text>
  <text x="105" y="543" font-family="Arial, Microsoft YaHei" font-size="17" fill="#2B2622">的系统工程；难点已从生成文本转向系统协同。</text>

  <rect x="640" y="110" width="520" height="540" rx="22" fill="#FFFDFC" stroke="#D4C8BA" stroke-width="2"/>
  <text x="670" y="155" font-family="Arial, Microsoft YaHei" font-size="26" font-weight="700" fill="#9C3D2B">B. 真实环境评测</text>
  <text x="670" y="190" font-family="Arial, Microsoft YaHei" font-size="16" fill="#5A534B">OSWorld：369 个真实计算机任务</text>
  <line x1="715" y1="510" x2="1080" y2="510" stroke="#7C736A" stroke-width="2"/>
  <line x1="715" y1="250" x2="715" y2="510" stroke="#7C736A" stroke-width="2"/>
  <rect x="780" y="250" width="92" height="260" fill="#2F5E6D"/>
  <rect x="930" y="466" width="92" height="44" fill="#C87F45"/>
  <text x="826" y="236" text-anchor="middle" font-family="Arial" font-size="16" fill="#2B2622">72.36%</text>
  <text x="976" y="452" text-anchor="middle" font-family="Arial" font-size="16" fill="#2B2622">12.24%</text>
  <text x="826" y="536" text-anchor="middle" font-family="Arial, Microsoft YaHei" font-size="18" font-weight="700" fill="#2B2622">人类</text>
  <text x="976" y="536" text-anchor="middle" font-family="Arial, Microsoft YaHei" font-size="18" font-weight="700" fill="#2B2622">最佳模型</text>
  <text x="670" y="585" font-family="Arial, Microsoft YaHei" font-size="18" font-weight="700" fill="#2B2622">结论：</text>
  <text x="670" y="615" font-family="Arial, Microsoft YaHei" font-size="17" fill="#2B2622">真实 GUI 操作远比静态 benchmark 更难，能力短板</text>
  <text x="670" y="643" font-family="Arial, Microsoft YaHei" font-size="17" fill="#2B2622">集中在界面定位、跨应用流程和操作经验。</text>

  <rect x="1210" y="110" width="520" height="540" rx="22" fill="#FFFDFC" stroke="#D4C8BA" stroke-width="2"/>
  <text x="1240" y="155" font-family="Arial, Microsoft YaHei" font-size="26" font-weight="700" fill="#9C3D2B">C. 安全影响</text>
  <text x="1240" y="190" font-family="Arial, Microsoft YaHei" font-size="16" fill="#5A534B">多代理协作可把 exploit 能力拉高到 4.3x</text>
  <line x1="1285" y1="510" x2="1650" y2="510" stroke="#7C736A" stroke-width="2"/>
  <line x1="1285" y1="250" x2="1285" y2="510" stroke="#7C736A" stroke-width="2"/>
  <rect x="1350" y="450" width="92" height="60" fill="#8A9B82"/>
  <rect x="1500" y="252" width="92" height="258" fill="#A34B39"/>
  <text x="1396" y="436" text-anchor="middle" font-family="Arial" font-size="16" fill="#2B2622">1.0x</text>
  <text x="1546" y="238" text-anchor="middle" font-family="Arial" font-size="16" fill="#2B2622">4.3x</text>
  <text x="1396" y="536" text-anchor="middle" font-family="Arial, Microsoft YaHei" font-size="18" font-weight="700" fill="#2B2622">先前框架</text>
  <text x="1546" y="536" text-anchor="middle" font-family="Arial, Microsoft YaHei" font-size="18" font-weight="700" fill="#2B2622">HPTSA</text>
  <text x="1240" y="585" font-family="Arial, Microsoft YaHei" font-size="18" font-weight="700" fill="#2B2622">结论：</text>
  <text x="1240" y="615" font-family="Arial, Microsoft YaHei" font-size="17" fill="#2B2622">智能体协作不只提高任务完成率，也提高真实攻击链</text>
  <text x="1240" y="643" font-family="Arial, Microsoft YaHei" font-size="17" fill="#2B2622">的可执行性，安全治理必须与能力研究同步。</text>
</svg>`;
}

async function buildFigure() {
  const svg = createFigureSvg();
  fs.writeFileSync(path.join(OUT, "llm_agents_triptych.svg"), svg, "utf8");
  await sharp(Buffer.from(svg)).png().toFile(path.join(OUT, "llm_agents_triptych.png"));
}

function paragraph(text, opts = {}) {
  return new Paragraph({
    ...opts,
    children: [new TextRun({ text })],
  });
}

async function buildDocx(markdownContent) {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "D6D2C4" };
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Arial", size: 22 },
        },
      },
    },
    sections: [
      {
        children: [
          new Paragraph({
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: topic, bold: true, size: 34 })],
          }),
          paragraph(`检索日期：${retrievalDate}`, { alignment: AlignmentType.CENTER }),
          paragraph(""),
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: "使用的 Skill", bold: true })],
          }),
          ...skillLog.map((item) =>
            new Paragraph({
              bullet: { level: 0 },
              children: [new TextRun(`${item.name}：${item.usage}`)],
            })
          ),
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: "论文对比表", bold: true })],
          }),
          new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [1200, 3000, 1700, 3460],
            rows: [
              new TableRow({
                children: ["编号", "论文", "定位", "核心结论"].map(
                  (text, idx) =>
                    new TableCell({
                      width: {
                        size: [1200, 3000, 1700, 3460][idx],
                        type: WidthType.DXA,
                      },
                      borders: { top: border, bottom: border, left: border, right: border },
                      children: [
                        new Paragraph({
                          children: [new TextRun({ text, bold: true })],
                        }),
                      ],
                    })
                ),
              }),
              ...papers.map(
                (paper) =>
                  new TableRow({
                    children: [
                      paper.id,
                      paper.title,
                      paper.type,
                      paper.findings[0],
                    ].map((text, idx) =>
                      new TableCell({
                        width: {
                          size: [1200, 3000, 1700, 3460][idx],
                          type: WidthType.DXA,
                        },
                        borders: { top: border, bottom: border, left: border, right: border },
                        children: [paragraph(text)],
                      })
                    ),
                  })
              ),
            ],
          }),
          ...papers.flatMap((paper) => [
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              children: [new TextRun({ text: `${paper.id}. ${paper.title}`, bold: true })],
            }),
            paragraph(`作者：${paper.authors}`),
            paragraph(`发布时间：${paper.published}`),
            paragraph(`研究问题：${paper.researchQuestion}`),
            paragraph(`研究方法：${paper.methodology}`),
            new Paragraph({
              children: [new TextRun({ text: "关键发现：", bold: true })],
            }),
            ...paper.findings.map((finding) =>
              new Paragraph({
                bullet: { level: 0 },
                children: [new TextRun(finding)],
              })
            ),
            paragraph(`研究意义：${paper.significance}`),
            new Paragraph({
              children: [new TextRun({ text: "局限性：", bold: true })],
            }),
            ...paper.limitations.map((limitation) =>
              new Paragraph({
                bullet: { level: 0 },
                children: [new TextRun(limitation)],
              })
            ),
            paragraph(`未来方向：${paper.future}`),
          ]),
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: "综合结论", bold: true })],
          }),
          ...[
            "智能体研究正在从“语言生成”走向“真实环境执行”。",
            "真实评测揭示了 GUI grounding、长程规划与 operational knowledge 的核心瓶颈。",
            "多智能体协作提高了能力上限，也同步扩大了安全外部性。",
          ].map((text) =>
            new Paragraph({
              bullet: { level: 0 },
              children: [new TextRun(text)],
            })
          ),
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: "附：Markdown 摘要", bold: true })],
          }),
          ...markdownContent.split("\n").slice(0, 20).map((line) => paragraph(line || " ")),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(path.join(OUT, "llm_agents_literature_summary.docx"), buffer);
}

function addPageTitle(slide, title, subtitle) {
  slide.addText(title, {
    x: 0.6,
    y: 0.35,
    w: 8.0,
    h: 0.5,
    fontFace: "Microsoft YaHei",
    fontSize: 26,
    bold: true,
    color: "F6F1E8",
    margin: 0,
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.62,
      y: 0.87,
      w: 6.0,
      h: 0.28,
      fontFace: "Microsoft YaHei",
      fontSize: 10,
      color: "D9D0C3",
      margin: 0,
    });
  }
}

function addTopBand(slide, dark = true) {
  slide.addShape("rect", {
    x: 0,
    y: 0,
    w: 10,
    h: 1.25,
    line: { color: dark ? "2C2723" : "F5F1EA", transparency: 100 },
    fill: { color: dark ? "2C2723" : "F5F1EA" },
  });
}

function addFooter(slide, text) {
  slide.addText(text, {
    x: 0.65,
    y: 5.15,
    w: 8.7,
    h: 0.2,
    fontFace: "Microsoft YaHei",
    fontSize: 8,
    color: "6D655E",
    margin: 0,
  });
}

function addCard(slide, x, y, w, h, title, bodyLines, accent) {
  slide.addShape("rect", {
    x,
    y,
    w,
    h,
    line: { color: "D8CDBE", width: 1 },
    fill: { color: "FFFDF8" },
  });
  slide.addShape("rect", {
    x,
    y,
    w: 0.09,
    h,
    line: { color: accent, transparency: 100 },
    fill: { color: accent },
  });
  slide.addText(title, {
    x: x + 0.2,
    y: y + 0.16,
    w: w - 0.3,
    h: 0.28,
    fontFace: "Microsoft YaHei",
    fontSize: 16,
    bold: true,
    color: "2C2723",
    margin: 0,
  });
  const runs = [];
  bodyLines.forEach((line, idx) => {
    runs.push({ text: line, options: { bullet: true, breakLine: idx < bodyLines.length - 1 } });
  });
  slide.addText(runs, {
    x: x + 0.2,
    y: y + 0.52,
    w: w - 0.34,
    h: h - 0.65,
    fontFace: "Microsoft YaHei",
    fontSize: 11.5,
    color: "3C3732",
    margin: 0,
    paraSpaceAfterPt: 6,
    valign: "top",
  });
}

async function buildPptx() {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";
  pptx.author = "OpenAI Codex";
  pptx.company = "Course Assignment";
  pptx.subject = topic;
  pptx.title = topic;
  pptx.lang = "zh-CN";
  pptx.theme = {
    headFontFace: "Microsoft YaHei",
    bodyFontFace: "Microsoft YaHei",
    lang: "zh-CN",
  };

  const figPath = path.join(OUT, "llm_agents_triptych.png");

  let slide = pptx.addSlide();
  slide.background = { color: "2C2723" };
  slide.addText("大语言模型智能体", {
    x: 0.65,
    y: 0.9,
    w: 5.4,
    h: 0.7,
    fontFace: "Microsoft YaHei",
    fontSize: 28,
    bold: true,
    color: "F5F1EA",
    margin: 0,
  });
  slide.addText("方法、评测与安全", {
    x: 0.65,
    y: 1.55,
    w: 4.6,
    h: 0.55,
    fontFace: "Microsoft YaHei",
    fontSize: 22,
    color: "D8CDBE",
    margin: 0,
  });
  slide.addText(`论文检索日期：${retrievalDate}`, {
    x: 0.67,
    y: 2.2,
    w: 3.0,
    h: 0.25,
    fontFace: "Microsoft YaHei",
    fontSize: 10.5,
    color: "D8CDBE",
    margin: 0,
  });
  slide.addShape("rect", {
    x: 0.65,
    y: 2.65,
    w: 4.0,
    h: 1.35,
    line: { color: "9C3D2B", transparency: 100 },
    fill: { color: "9C3D2B" },
  });
  slide.addText(
    [
      { text: "作业流程\n", options: { bold: true, breakLine: true } },
      { text: "1. 技能发现与配置\n", options: { breakLine: true } },
      { text: "2. 论文检索与结构化总结\n", options: { breakLine: true } },
      { text: "3. 生成配图与最终 PPT" },
    ],
    {
      x: 0.9,
      y: 2.92,
      w: 3.45,
      h: 0.9,
      fontFace: "Microsoft YaHei",
      fontSize: 12,
      color: "FFF8EE",
      margin: 0,
    }
  );
  slide.addImage({ path: figPath, x: 5.3, y: 0.85, w: 4.05, h: 3.95 });
  slide.addText("关键词：LLM Agents / Benchmark / Computer Use / Security", {
    x: 5.35,
    y: 4.95,
    w: 4.0,
    h: 0.2,
    fontFace: "Arial",
    fontSize: 8.5,
    color: "BFB2A3",
    margin: 0,
  });

  slide = pptx.addSlide();
  slide.background = { color: "F5F1EA" };
  addTopBand(slide);
  addPageTitle(slide, "流程与技能使用", "用本地 skill 目录完成检索、总结和产出");
  addCard(
    slide,
    0.55,
    1.55,
    2.1,
    2.95,
    "/find-skills",
    [
      "扫描 .trae/skills 与补充 skills",
      "确认 academic-researcher、docx、pptx 可直接复用",
      "为后续流程选取最短可执行路径",
    ],
    "1F4E5F"
  );
  addCard(
    slide,
    2.85,
    1.55,
    2.1,
    2.95,
    "/academic-researcher",
    [
      "按研究问题、方法、发现、局限整理文献",
      "选出 1 篇综述 + 1 篇评测 + 1 篇安全论文",
      "形成统一比较框架",
    ],
    "C07A3A"
  );
  addCard(
    slide,
    5.15,
    1.55,
    2.1,
    2.95,
    "/docx",
    [
      "生成结构化文献综述文档",
      "保存中间产物，便于展示完整流程",
      "沉淀引用与结论",
    ],
    "6D8B74"
  );
  addCard(
    slide,
    7.45,
    1.55,
    2.0,
    2.95,
    "/pptx",
    [
      "生成最终汇报演示文稿",
      "把检索结果压缩成可展示结构",
      "嵌入三面板配图",
    ],
    "9C3D2B"
  );
  addFooter(slide, "检索策略：优先使用论文原始页面；主题聚焦于 LLM 智能体的方法、评测与安全。");

  slide = pptx.addSlide();
  slide.background = { color: "F5F1EA" };
  addTopBand(slide);
  addPageTitle(slide, "论文 1：综述框架", "Wang et al., published 2024-03-22");
  addCard(
    slide,
    0.65,
    1.55,
    4.05,
    2.95,
    "核心内容",
    [
      "系统综述 LLM-based autonomous agents 的统一框架、应用与评测。",
      "强调智能体不是单一模型，而是多模块协同系统。",
      "指出真实评测、鲁棒性、安全性和效率是关键挑战。",
    ],
    "1F4E5F"
  );
  addCard(
    slide,
    4.95,
    1.55,
    4.0,
    2.95,
    "为什么重要",
    [
      "为后续论文提供统一分析坐标。",
      "帮助把“能力提升”拆解到感知、记忆、规划、行动等层面。",
      "适合作为本次选题的理论底座。",
    ],
    "C07A3A"
  );
  slide.addImage({ path: figPath, x: 0.72, y: 4.1, w: 3.95, h: 1.1 });
  addFooter(slide, "Source: arXiv:2308.11432 / DOI 10.1007/s11704-024-40231-1");

  slide = pptx.addSlide();
  slide.background = { color: "F5F1EA" };
  addTopBand(slide);
  addPageTitle(slide, "论文 2：真实环境评测", "OSWorld, submitted 2024-04-11");
  addCard(
    slide,
    0.65,
    1.55,
    3.2,
    3.2,
    "研究设计",
    [
      "构建真实计算机环境，覆盖 Ubuntu、Windows、macOS。",
      "共 369 个任务，涵盖 web、desktop、file I/O 与跨应用 workflow。",
      "采用执行式评测，而不是只看文本答案。",
    ],
    "6D8B74"
  );
  slide.addImage({ path: figPath, x: 4.15, y: 1.55, w: 5.1, h: 3.45 });
  slide.addText("最重要的结论：真实世界里的“会用电脑”比 benchmark 上的“会答题”难得多。", {
    x: 0.7,
    y: 4.95,
    w: 8.4,
    h: 0.25,
    fontFace: "Microsoft YaHei",
    fontSize: 10.5,
    italic: true,
    color: "5F5750",
    margin: 0,
  });
  addFooter(slide, "Source: arXiv:2404.07972; humans >72.36%, best model 12.24% on 369 tasks.");

  slide = pptx.addSlide();
  slide.background = { color: "F5F1EA" };
  addTopBand(slide);
  addPageTitle(slide, "论文 3：安全风险外部性", "Zero-Day paper, submitted 2024-06-02");
  addCard(
    slide,
    0.65,
    1.55,
    3.0,
    3.15,
    "方法",
    [
      "提出 HPTSA，多代理系统由规划代理协调子代理。",
      "目标是解决单代理在并行探索与长程规划上的短板。",
      "在 14 个真实漏洞上做对比实验。",
    ],
    "9C3D2B"
  );
  addCard(
    slide,
    3.9,
    1.55,
    2.1,
    3.15,
    "结果",
    [
      "最高 4.3x 提升。",
      "说明多代理协作会显著拉高 exploit 上限。",
      "能力提升与风险上升同步发生。",
    ],
    "C07A3A"
  );
  slide.addImage({ path: figPath, x: 6.2, y: 1.55, w: 3.05, h: 3.45 });
  addFooter(slide, "Source: arXiv:2406.01637; benchmark of 14 real-world vulnerabilities.");

  slide = pptx.addSlide();
  slide.background = { color: "F5F1EA" };
  addTopBand(slide);
  addPageTitle(slide, "综合对比与未来方向", "把三篇论文放到同一框架中理解");
  addCard(
    slide,
    0.65,
    1.55,
    2.75,
    3.1,
    "方法层",
    [
      "从单模型回答，走向多模块、多工具、多代理系统。",
      "规划与记忆已成为核心增益点。",
      "系统工程能力比纯文本生成更重要。",
    ],
    "1F4E5F"
  );
  addCard(
    slide,
    3.6,
    1.55,
    2.75,
    3.1,
    "评测层",
    [
      "从静态任务走向真实操作系统与长链条任务。",
      "未来基准需要更强的可复现性与更真实的任务分布。",
      "“能用”比“能答”更难。",
    ],
    "6D8B74"
  );
  addCard(
    slide,
    6.55,
    1.55,
    2.75,
    3.1,
    "治理层",
    [
      "能力提升必然带来更高的误用与攻击风险。",
      "安全评估应成为 agent benchmark 的常规模块。",
      "研究者需要能力与治理并行推进。",
    ],
    "9C3D2B"
  );
  slide.addText("一句话结论：下一阶段的关键不是“更大的模型”，而是“更可靠的执行 + 更真实的评测 + 更严格的安全边界”。", {
    x: 0.72,
    y: 4.95,
    w: 8.55,
    h: 0.36,
    fontFace: "Microsoft YaHei",
    fontSize: 13,
    bold: true,
    color: "2C2723",
    margin: 0,
  });
  addFooter(slide, "Synthesis date: 2026-05-21");

  slide = pptx.addSlide();
  slide.background = { color: "2C2723" };
  slide.addText("参考文献", {
    x: 0.7,
    y: 0.65,
    w: 2.4,
    h: 0.4,
    fontFace: "Microsoft YaHei",
    fontSize: 24,
    bold: true,
    color: "F5F1EA",
    margin: 0,
  });
  slide.addText(
    papers
      .map(
        (paper, idx) =>
          `${idx + 1}. ${paper.authors}. ${paper.title}. ${paper.source}. ${paper.link}`
      )
      .join("\n\n"),
    {
      x: 0.75,
      y: 1.35,
      w: 8.5,
      h: 3.65,
      fontFace: "Arial",
      fontSize: 11,
      color: "E6DCCF",
      margin: 0,
      breakLine: false,
    }
  );
  slide.addText("提交文件：PPTX + 图像文件 + 文献总结 DOCX/MD", {
    x: 0.75,
    y: 5.0,
    w: 5.4,
    h: 0.22,
    fontFace: "Microsoft YaHei",
    fontSize: 10.5,
    color: "CDBEAE",
    margin: 0,
  });

  await pptx.writeFile({ fileName: path.join(OUT, "LLM_Agents_Methods_Benchmark_Safety.pptx") });
}

async function main() {
  const markdown = buildMarkdown();
  writeTextFile("llm_agents_literature_summary.md", markdown);
  writeTextFile(
    "skills_usage_log.md",
    [
      "# Skills Usage Log",
      "",
      `生成日期：${retrievalDate}`,
      "",
      ...skillLog.map((item) => `- ${item.name}: ${item.usage}`),
    ].join("\n")
  );
  await buildFigure();
  await buildDocx(markdown);
  await buildPptx();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
