# 《别点那个链接！》AIGC 反诈互动网页

这是一个原生 HTML / CSS / JavaScript 实现的大学生日常反诈互动剧情网页，当前包含“奖学金补录诈骗短信”“校园路边陌生人求助代付”“共享单车可疑二维码贴纸”三个关卡。

## 静态演示模式

直接双击 `index.html` 即可运行。

这种模式不需要安装任何依赖，也不需要启动后端。剧情、分支、风险意识分类和 AI 反诈助手都可以正常演示；如果本地 Flask 服务不可用，前端会自动使用离线 mock 回复。

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

以上只是示例配置，实际以你可用的模型接口、API Key 和模型名为准。

4. 启动本地后端：

```powershell
python server.py
```

5. 再打开 `index.html`。

当前端 AI 助手成功调用后端和真实模型时，聊天卡片会显示“实时 AI 分析”；如果后端未启动、请求超时或模型返回异常，则自动切换为“离线演示模式”。

## 后端接口

本地接口：

```text
POST http://127.0.0.1:5000/api/anti-fraud-chat
```

请求 JSON 包含场景、用户问题、剧情选择和当前风险意识分类。后端成功时返回：

```json
{
  "reply": "中文反诈回复",
  "riskAwareness": "警惕型",
  "riskReason": "一句分类理由"
}
```

`riskAwareness` 只允许为 `警惕型`、`犹豫型`、`轻信型`。

当前支持的 `scenario`：

- `scholarship_sms`
- `campus_payment_help`
- `bike_qr_sticker`
