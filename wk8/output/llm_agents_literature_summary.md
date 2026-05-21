# 大语言模型智能体：方法、评测与安全

- 检索日期：2026-05-21
- 选题定位：人工智能专业中的“大语言模型智能体”方向
- 流程：论文检索 → 结构化总结 → 生成 PPT

## 使用的 Skill

- /find-skills：扫描本地 .trae/skills 与补充 skills，确认 academic-researcher、docx、pptx、pdf 等技能可用。
- /academic-researcher：按“研究问题-方法-发现-意义-局限-未来方向”框架整理三篇代表性论文。
- /docx：生成结构化文献综述 Word 文档，作为“论文检索→总结”的中间产物。
- /pdf：确认论文 PDF 处理链路与摘要提取方案；本次最终提交不额外交单独 PDF 文件。
- /pptx：生成最终展示汇报 PPTX。

## 检索策略

- 关键词：LLM agents, autonomous agents, benchmark, computer use, zero-day vulnerabilities
- 选文标准：1) 主题代表性强；2) 一篇综述 + 一篇评测 + 一篇安全；3) 以原始论文页面为主。

## 论文摘要与分析

### P1. A Survey on Large Language Model based Autonomous Agents

- 作者：Lei Wang, Chen Ma, Xueyang Feng, et al.
- 类型：综述论文
- 发布时间：2024-03-22
- 链接：https://arxiv.org/abs/2308.11432
- 研究问题：系统梳理 LLM-based autonomous agents 的统一架构、应用场景、评测方式与未来挑战。
- 方法：对既有 LLM 智能体研究做系统综述，抽象出统一框架，并从应用、评测、挑战三个维度归纳。
- 关键发现：
  - 提出可覆盖多数工作的统一框架，便于把智能体理解为“感知/记忆/规划/行动”的协同系统。
  - 应用场景已从对话扩展到社会科学、自然科学与工程问题。
  - 评测仍缺统一标准，真实环境泛化、长期规划、成本控制与安全性是主要难点。
- 研究意义：适合作为选题的理论底座，能够为后续实验类论文提供分类框架与比较坐标。
- 局限性：
  - 属于综述，不直接给出新的实验结果。
  - 对 2025 之后的新型 computer-use agents 覆盖有限。
- 未来方向：需要更真实的环境评测、更稳健的记忆机制，以及更明确的安全边界。

### P2. OSWorld: Benchmarking Multimodal Agents for Open-Ended Tasks in Real Computer Environments

- 作者：Tianbao Xie, Danyang Zhang, Jixuan Chen, et al.
- 类型：评测基准论文
- 发布时间：2024-04-11
- 链接：https://arxiv.org/abs/2404.07972
- 研究问题：真实计算机环境中的多模态智能体，距离可用的通用计算机助手还有多远？
- 方法：构建可扩展的真实计算机环境，覆盖 Ubuntu、Windows、macOS；在 369 个真实开放任务上做执行式评测。
- 关键发现：
  - OSWorld 支持 web/desktop/file I/O/跨应用 workflow 的统一评测。
  - 人类可完成超过 72.36% 的任务，而最优模型只有 12.24%。
  - 主要瓶颈不只是推理，而是 GUI grounding 与 operational knowledge。
- 研究意义：把“会聊天的智能体”与“真的会操作电脑的智能体”区分开，强调真实环境评测的重要性。
- 局限性：
  - 任务仍以桌面工作流为主，尚不能代表所有实体世界交互。
  - 评测成绩会受模型版本、视觉能力与工具栈变化影响。
- 未来方向：需要更强的视觉定位、长期执行稳定性与跨应用经验迁移能力。

### P3. Teams of LLM Agents can Exploit Zero-Day Vulnerabilities

- 作者：Yuxuan Zhu, Antony Kellermann, Akul Gupta, et al.
- 类型：安全研究论文
- 发布时间：2024-06-02
- 链接：https://arxiv.org/abs/2406.01637
- 研究问题：多智能体协作是否已经足以在真实世界中自主利用零日漏洞？
- 方法：提出 HPTSA 多智能体系统，由规划代理调度子代理；在 14 个真实漏洞上与已有 agent framework 对比。
- 关键发现：
  - 团队式 agent 能缓解单代理在长程规划与并行探索上的不足。
  - 在 14 个真实漏洞基准上，相比先前框架最高提升可达 4.3 倍。
  - LLM agent 的能力提升同时意味着真实的网络安全风险上升。
- 研究意义：提醒研究者：智能体进步不能只看能力上限，必须同步考虑防滥用、审计与安全约束。
- 局限性：
  - 论文聚焦特定漏洞基准，外推到更广泛攻击面仍需谨慎。
  - 实验条件与工具配置会影响实际 exploit 成功率。
- 未来方向：未来研究应把 agent capability evaluation 与 safety governance 一并纳入标准流程。

## 综合结论

- 趋势 1：智能体研究正从“语言能力”转向“真实环境执行能力”。
- 趋势 2：评测从静态 benchmark 走向真实操作系统与长链条任务。
- 趋势 3：多智能体协作提升能力上限，但也同步放大安全风险。
- 结论：未来智能体研究的关键，不只是更强的模型，而是“真实评测 + 长程规划 + 安全治理”的三位一体。

## 参考文献

- Wang, L., Ma, C., Feng, X., et al. (2024). A survey on large language model based autonomous agents. Frontiers of Computer Science, 18, 186345. https://doi.org/10.1007/s11704-024-40231-1
- Xie, T., Zhang, D., Chen, J., et al. (2024). OSWorld: Benchmarking Multimodal Agents for Open-Ended Tasks in Real Computer Environments. arXiv:2404.07972. https://doi.org/10.48550/arXiv.2404.07972
- Zhu, Y., Kellermann, A., Gupta, A., et al. (2024). Teams of LLM Agents can Exploit Zero-Day Vulnerabilities. arXiv:2406.01637. https://doi.org/10.48550/arXiv.2406.01637