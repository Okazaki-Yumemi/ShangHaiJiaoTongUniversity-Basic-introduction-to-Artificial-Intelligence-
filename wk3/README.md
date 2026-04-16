# README

## 更新日志

- 2026-04-16: 在虚拟环境 `.venv` 中安装 PyTorch 2.11.0+cu130（检测到 NVIDIA GeForce RTX 5070，CUDA 13.0）。
  - 安装命令（使用虚拟环境的 Python）：
    - "g:/学业/2025大一下/人工智能基础/wk3/.venv/Scripts/python.exe" -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu130
  - 验证：
    - `import torch; print(torch.__version__)` -> 2.11.0+cu130
    - `torch.cuda.is_available()` -> True
