import json
import os
import random
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from PIL import Image
from torch.utils.data import DataLoader
from torchvision import datasets, transforms


BASE_DIR = Path(__file__).resolve().parent
OUT_DIR = BASE_DIR / "提交材料"
OUT_DIR.mkdir(exist_ok=True)

SEED = 42
random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)
torch.set_num_threads(max(1, min(8, os.cpu_count() or 1)))


class MLPNet(nn.Module):
    def __init__(
        self,
        hidden_sizes=(128, 64),
        activation="relu",
        dropout_p=0.3,
    ):
        super().__init__()
        activations = {
            "relu": nn.ReLU,
            "gelu": nn.GELU,
            "leaky_relu": lambda: nn.LeakyReLU(0.1),
        }
        if activation not in activations:
            raise ValueError(f"Unsupported activation: {activation}")

        layers = [nn.Flatten()]
        in_features = 28 * 28
        for hidden in hidden_sizes:
            layers.append(nn.Linear(in_features, hidden))
            layers.append(activations[activation]())
            if dropout_p > 0:
                layers.append(nn.Dropout(dropout_p))
            in_features = hidden
        layers.append(nn.Linear(in_features, 10))
        self.net = nn.Sequential(*layers)

    def forward(self, x):
        return self.net(x)


def load_data(batch_size):
    transform = transforms.Compose(
        [
            transforms.ToTensor(),
            transforms.Normalize((0.1307,), (0.3081,)),
        ]
    )
    train_dataset = datasets.MNIST(
        root=str(BASE_DIR), train=True, download=False, transform=transform
    )
    test_dataset = datasets.MNIST(
        root=str(BASE_DIR), train=False, download=False, transform=transform
    )
    train_loader = DataLoader(
        train_dataset, batch_size=batch_size, shuffle=True, num_workers=0
    )
    test_loader = DataLoader(
        test_dataset, batch_size=batch_size, shuffle=False, num_workers=0
    )
    return train_loader, test_loader, transform


def evaluate(model, loader, criterion, device):
    model.eval()
    total_loss = 0.0
    total = 0
    correct = 0
    with torch.no_grad():
        for images, labels in loader:
            images = images.to(device)
            labels = labels.to(device)
            outputs = model(images)
            loss = criterion(outputs, labels)
            total_loss += loss.item() * images.size(0)
            predicted = outputs.argmax(dim=1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()
    return total_loss / total, correct / total


def train_one_experiment(config, train_loader, test_loader, device):
    model = MLPNet(
        hidden_sizes=config["hidden_sizes"],
        activation=config["activation"],
        dropout_p=config["dropout_p"],
    ).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=config["lr"])
    history = {"train_loss": [], "train_acc": [], "test_loss": [], "test_acc": []}

    for epoch in range(1, config["epochs"] + 1):
        model.train()
        total_loss = 0.0
        total = 0
        correct = 0
        for images, labels in train_loader:
            images = images.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            total_loss += loss.item() * images.size(0)
            predicted = outputs.argmax(dim=1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()

        train_loss = total_loss / total
        train_acc = correct / total
        test_loss, test_acc = evaluate(model, test_loader, criterion, device)
        history["train_loss"].append(train_loss)
        history["train_acc"].append(train_acc)
        history["test_loss"].append(test_loss)
        history["test_acc"].append(test_acc)
        print(
            f"{config['name']} Epoch {epoch:02d}/{config['epochs']} "
            f"train_loss={train_loss:.4f} train_acc={train_acc:.4f} "
            f"test_loss={test_loss:.4f} test_acc={test_acc:.4f}"
        )

    torch.save(model.state_dict(), OUT_DIR / f"{config['file_prefix']}_model.pth")
    return model, history


def plot_history(history, config):
    epochs = range(1, len(history["train_loss"]) + 1)
    title = config.get("title", config["name"])
    fig, axes = plt.subplots(1, 2, figsize=(12, 4.8), dpi=140)

    axes[0].plot(epochs, history["train_loss"], marker="o", label="Train Loss")
    axes[0].plot(epochs, history["test_loss"], marker="s", label="Test Loss")
    axes[0].set_title(f"{title} Loss")
    axes[0].set_xlabel("Epoch")
    axes[0].set_ylabel("Loss")
    axes[0].grid(True, alpha=0.3)
    axes[0].legend()

    axes[1].plot(
        epochs, [x * 100 for x in history["train_acc"]], marker="o", label="Train Acc"
    )
    axes[1].plot(
        epochs, [x * 100 for x in history["test_acc"]], marker="s", label="Test Acc"
    )
    axes[1].set_title(f"{title} Accuracy")
    axes[1].set_xlabel("Epoch")
    axes[1].set_ylabel("Accuracy (%)")
    axes[1].grid(True, alpha=0.3)
    axes[1].legend()

    fig.tight_layout()
    output_path = OUT_DIR / f"{config['file_prefix']}_曲线图.png"
    fig.savefig(output_path, bbox_inches="tight")
    plt.close(fig)
    return output_path


def predict_external_images(model, transform, config, device):
    title = config.get("title", config["name"])
    image_paths = sorted((BASE_DIR / "testpic").glob("*.png"))
    tensors = []
    labels = []
    original_images = []

    for path in image_paths:
        image = Image.open(path).convert("L")
        original_images.append(image.copy())
        resized = image.resize((28, 28), Image.Resampling.LANCZOS)
        tensors.append(transform(resized))
        labels.append(int(path.stem.split("_")[0]))

    batch = torch.stack(tensors).to(device)
    model.eval()
    with torch.no_grad():
        outputs = model(batch)
        predictions = outputs.argmax(dim=1).cpu().tolist()

    fig, axes = plt.subplots(1, len(image_paths), figsize=(13, 3.2), dpi=140)
    for ax, image, path, pred, label in zip(
        axes, original_images, image_paths, predictions, labels
    ):
        ax.imshow(image, cmap="gray")
        ax.set_title(f"{path.name}\nPred: {pred}  True: {label}")
        ax.axis("off")
    fig.suptitle(f"{title} External Picture Prediction", fontsize=14)
    fig.tight_layout()
    output_path = OUT_DIR / f"{config['file_prefix']}_预测图.png"
    fig.savefig(output_path, bbox_inches="tight")
    plt.close(fig)

    accuracy = sum(int(p == y) for p, y in zip(predictions, labels)) / len(labels)
    details = [
        {"file": path.name, "true": label, "pred": pred}
        for path, label, pred in zip(image_paths, labels, predictions)
    ]
    return output_path, accuracy, details


def write_report(results, configs):
    before = results["before"]
    after = results["after"]
    report = f"""# MNIST 手写数字分类实验结果分析报告

## 一、实验设置

本次作业使用 PyTorch 完成 MNIST 手写数字分类。模型输入为 28×28 灰度图像，输出为 0-9 共 10 个类别。训练完成后，分别在 MNIST 测试集和 `testpic` 文件夹中的 5 张外部手写数字图片上进行验证。

## 二、调参前后设置对比

| 方案 | 隐含层 | 激活函数 | Dropout | 学习率 | 训练轮数 |
| --- | --- | --- | --- | --- | --- |
| 调参前 | {configs['before']['hidden_sizes']} | {configs['before']['activation']} | {configs['before']['dropout_p']} | {configs['before']['lr']} | {configs['before']['epochs']} |
| 调参后 | {configs['after']['hidden_sizes']} | {configs['after']['activation']} | {configs['after']['dropout_p']} | {configs['after']['lr']} | {configs['after']['epochs']} |

本次至少改变了隐含层规模、激活函数、Dropout、学习率和训练轮数五项超参数。

## 三、结果对比

| 方案 | MNIST 测试集准确率 | MNIST 测试集损失 | 外部图片准确率 |
| --- | --- | --- | --- |
| 调参前 | {before['test_acc'] * 100:.2f}% | {before['test_loss']:.4f} | {before['external_acc'] * 100:.2f}% |
| 调参后 | {after['test_acc'] * 100:.2f}% | {after['test_loss']:.4f} | {after['external_acc'] * 100:.2f}% |

## 四、外部图片预测结果

### 调参前

| 图片 | 真实标签 | 预测标签 |
| --- | --- | --- |
"""
    for item in before["external_details"]:
        report += f"| {item['file']} | {item['true']} | {item['pred']} |\n"

    report += "\n### 调参后\n\n| 图片 | 真实标签 | 预测标签 |\n| --- | --- | --- |\n"
    for item in after["external_details"]:
        report += f"| {item['file']} | {item['true']} | {item['pred']} |\n"

    delta = after["test_acc"] - before["test_acc"]
    report += f"""

## 五、分析

调参后 MNIST 测试集准确率变化为 {delta * 100:+.2f} 个百分点。调参后模型增加了隐含层宽度和层数，表达能力更强，可以学习到更复杂的笔画组合特征；同时将 ReLU 改为 GELU，使激活变化更平滑，有利于稳定优化。Dropout 从 0.3 降到 0.2，减少了训练时被随机丢弃的神经元比例，使模型在容量增加后仍能保留较充分的信息。学习率从 0.001 调整到 0.0008，并增加训练轮数，可以让参数更新更细致，降低训练后期震荡。

从泛化能力看，如果调参后训练准确率和测试准确率同步提高，说明模型容量和训练轮数的增加带来了有效学习；如果训练准确率明显高于测试准确率，则可能出现过拟合，需要提高 Dropout、减少隐含层规模或加入数据增强。外部图片只有 5 张，样本量很小，准确率波动会比较大，因此应主要参考 MNIST 测试集曲线，同时把外部图片预测作为模型实际应用效果的补充检验。

## 六、提交文件说明

- `调参前_曲线图.png`：调参前 Loss 和 Accuracy 曲线。
- `调参前_预测图.png`：调参前 5 张外部图片及预测标签。
- `调参后_曲线图.png`：调参后 Loss 和 Accuracy 曲线。
- `调参后_预测图.png`：调参后 5 张外部图片及预测标签。
- `结果分析报告.md`：本报告。
"""
    (OUT_DIR / "结果分析报告.md").write_text(report, encoding="utf-8")


def write_completed_notebook(configs):
    notebook = {
        "cells": [
            {
                "cell_type": "markdown",
                "metadata": {},
                "source": [
                    "# MNIST 手写数字分类作业完成版\n",
                    "\n",
                    "本 notebook 补全了模型前向传播、训练、测试、曲线绘制、外部图片预测和调参分析。运行前请确认当前目录为 `chapter_03_demo`。\n",
                ],
            },
            {
                "cell_type": "code",
                "execution_count": None,
                "metadata": {},
                "outputs": [],
                "source": [
                    "%run generate_submission.py\n",
                ],
            },
            {
                "cell_type": "markdown",
                "metadata": {},
                "source": [
                    "## 调参前曲线图\n",
                    "\n",
                    "![调参前曲线图](提交材料/调参前_曲线图.png)\n",
                    "\n",
                    "## 调参前外部图片预测\n",
                    "\n",
                    "![调参前预测图](提交材料/调参前_预测图.png)\n",
                    "\n",
                    "## 调参后曲线图\n",
                    "\n",
                    "![调参后曲线图](提交材料/调参后_曲线图.png)\n",
                    "\n",
                    "## 调参后外部图片预测\n",
                    "\n",
                    "![调参后预测图](提交材料/调参后_预测图.png)\n",
                ],
            },
        ],
        "metadata": {
            "kernelspec": {
                "display_name": "Python 3",
                "language": "python",
                "name": "python3",
            },
            "language_info": {"name": "python", "version": "3.13"},
        },
        "nbformat": 4,
        "nbformat_minor": 5,
    }
    (BASE_DIR / "mnist_torch_ex_completed.ipynb").write_text(
        json.dumps(notebook, ensure_ascii=False, indent=1), encoding="utf-8"
    )


def main():
    configs = {
        "before": {
            "name": "调参前",
            "title": "Before Tuning",
            "file_prefix": "调参前",
            "hidden_sizes": (128, 64),
            "activation": "relu",
            "dropout_p": 0.3,
            "lr": 0.001,
            "epochs": 5,
            "batch_size": 256,
        },
        "after": {
            "name": "调参后",
            "title": "After Tuning",
            "file_prefix": "调参后",
            "hidden_sizes": (256, 128, 64),
            "activation": "gelu",
            "dropout_p": 0.2,
            "lr": 0.0008,
            "epochs": 8,
            "batch_size": 256,
        },
    }
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    results = {}
    for key, config in configs.items():
        train_loader, test_loader, transform = load_data(config["batch_size"])
        model, history = train_one_experiment(config, train_loader, test_loader, device)
        curve_path = plot_history(history, config)
        pred_path, external_acc, external_details = predict_external_images(
            model, transform, config, device
        )
        results[key] = {
            "test_acc": history["test_acc"][-1],
            "test_loss": history["test_loss"][-1],
            "external_acc": external_acc,
            "external_details": external_details,
            "curve_path": str(curve_path),
            "pred_path": str(pred_path),
        }

    (OUT_DIR / "metrics.json").write_text(
        json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    write_report(results, configs)
    write_completed_notebook(configs)
    print("\nDone. Files saved in:", OUT_DIR)


if __name__ == "__main__":
    main()
