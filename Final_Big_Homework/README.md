# 《别点那个链接！》AIGC 反诈互动网页

这是一个使用原生 HTML / CSS / JavaScript 实现的大学生日常反诈互动剧情网页。当前版本已经收束为完整的三关体验：

- 第一关：奖学金补录诈骗短信
- 第二关：校园路边陌生人求助代付
- 第三关：共享单车可疑二维码贴纸

项目额外包含 AI 反诈助手、多维反诈画像分类、风险线索复盘、行动清单和 Markdown 报告导出功能。

## 静态演示模式

直接双击 `index.html` 即可运行。

这种模式不需要安装任何依赖，也不需要启动后端。剧情、分支、风险意识分类、AI 反诈助手、最终总评和报告导出都可以正常演示；如果本地 Flask 服务不可用，前端会自动使用离线 mock 回复。

## 实时 AI 模式

实时 AI 模式会让前端优先请求本地 Flask 后端，再由后端调用 OpenAI-compatible Chat Completions 接口。

1. 进入项目目录：

```powershell
cd Final_Big_Homework
```

2. 安装依赖：

```powershell
pip install -r requirements.txt
```

3. 设置环境变量：

```powershell
$env:LLM_BASE_URL="https://models.sjtu.edu.cn/api/v1"
$env:LLM_API_KEY=""
$env:LLM_MODEL="deepseek-chat"
```

以上只是示例配置，实际以你可用的模型接口、API Key 和模型名为准。不要把真实 Key 写入仓库文件。

4. 启动本地后端：

```powershell
python server.py
```

5. 再打开 `index.html`。

当前端 AI 助手成功调用后端和真实模型时，聊天卡片会显示“实时 AI 分析”；如果后端未启动、请求超时或模型返回异常，则自动切换为“离线演示模式”。

最终总评页的多维画像分类接口最长等待约 60 秒。真实分类成功时显示“实时 AI 分类”；失败时显示“离线分类演示”。

## AI 功能

本项目包含两类额外 AI 功能：

1. LLM 反诈问答助手

   在每一关的 AI 分析页中，系统会根据当前骗局场景回答用户问题，并输出风险意识分类与判定依据。实时 AI 模式下由本地 Flask 后端调用大模型；静态演示模式下由前端 mock 规则兜底。

2. AI 多维反诈画像分类系统

   在最终总评页中，系统会综合三关互动轨迹，输出一个综合反诈画像，以及四个维度的分项等级、分数和判定依据：

   - 信息来源核验意识
   - 资金交易边界意识
   - 未知入口防范意识
   - 紧迫话术抗干扰能力

   实时 AI 模式下，多维分类报告由大模型生成；离线模式下，前端规则 fallback 会生成同结构报告，保证课堂演示完整。

## 展示增强功能

- 风险线索复盘：最终页会记录用户三关中的关键风险动作与稳妥动作。
- 行动清单：根据用户画像生成可勾选的下一步反诈行动建议。
- Markdown 报告导出：最终页可导出一份 `anti-fraud-profile-report.md`，包含三关选择、线索复盘、多维分类和行动清单。

## 后端接口

健康检查：

```text
GET http://127.0.0.1:5000/api/health
```

反诈问答：

```text
POST http://127.0.0.1:5000/api/anti-fraud-chat
```

多维反诈画像分类：

```text
POST http://127.0.0.1:5000/api/anti-fraud-profile
```

当前支持的 `scenario`：

- `scholarship_sms`
- `campus_payment_help`
- `bike_qr_sticker`

