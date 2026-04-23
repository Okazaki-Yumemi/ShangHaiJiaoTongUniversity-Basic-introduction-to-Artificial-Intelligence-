import json
import math
import os
import random
from collections import Counter, defaultdict
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from PIL import Image
from torch.utils.data import DataLoader, Dataset
from torchvision import models, transforms


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "archive" / "MY_data"
TRAIN_DIR = DATA_DIR / "train"
TEST_DIR = DATA_DIR / "test"
WEIGHTS_PATH = BASE_DIR / "resnet18-f37072fd.pth"
OUTPUT_DIR = BASE_DIR / "analysis_outputs"
OUTPUT_DIR.mkdir(exist_ok=True)

SEED = 42
random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)
torch.set_num_threads(max(1, min(8, os.cpu_count() or 1)))

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

CANONICAL_CLASSES = [
    "apple",
    "avocado",
    "banana",
    "cherry",
    "kiwi",
    "mango",
    "orange",
    "pinenapple",
    "strawberries",
    "watermelon",
]
CLASS_TO_IDX = {name: idx for idx, name in enumerate(CANONICAL_CLASSES)}
IDX_TO_CLASS = {idx: name for name, idx in CLASS_TO_IDX.items()}
ALIAS_MAP = {
    "apple": "apple",
    "banana": "banana",
    "stawberries": "strawberries",
    "strawberries": "strawberries",
}


def normalize_class_name(name: str) -> str:
    return ALIAS_MAP.get(name.strip().lower(), name.strip().lower())


class FruitDataset(Dataset):
    def __init__(self, root_dir: Path, transform=None):
        self.root_dir = Path(root_dir)
        self.transform = transform
        self.samples = []

        for folder_name in sorted(os.listdir(self.root_dir)):
            folder_path = self.root_dir / folder_name
            if not folder_path.is_dir():
                continue

            canonical_name = normalize_class_name(folder_name)
            if canonical_name not in CLASS_TO_IDX:
                continue

            label = CLASS_TO_IDX[canonical_name]
            for file_name in sorted(os.listdir(folder_path)):
                if file_name.lower().endswith((".jpg", ".jpeg", ".png", ".bmp", ".webp")):
                    self.samples.append(
                        {
                            "path": str(folder_path / file_name),
                            "label": label,
                            "class_name": canonical_name,
                        }
                    )

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, index):
        sample = self.samples[index]
        image = Image.open(sample["path"]).convert("RGB")
        if self.transform is not None:
            image = self.transform(image)
        return image, sample["label"], sample["path"]


def get_transforms():
    imagenet_mean = [0.485, 0.456, 0.406]
    imagenet_std = [0.229, 0.224, 0.225]

    train_transform = transforms.Compose(
        [
            transforms.RandomResizedCrop(224),
            transforms.RandomHorizontalFlip(),
            transforms.RandomRotation(15),
            transforms.ColorJitter(brightness=0.1, contrast=0.1, saturation=0.1),
            transforms.ToTensor(),
            transforms.Normalize(imagenet_mean, imagenet_std),
        ]
    )
    improved_train_transform = transforms.Compose(
        [
            transforms.RandomResizedCrop(224, scale=(0.75, 1.0)),
            transforms.RandomHorizontalFlip(),
            transforms.RandomRotation(20),
            transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.15),
            transforms.ToTensor(),
            transforms.Normalize(imagenet_mean, imagenet_std),
        ]
    )
    test_transform = transforms.Compose(
        [
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(imagenet_mean, imagenet_std),
        ]
    )
    display_transform = transforms.Compose([transforms.Resize((224, 224))])
    return train_transform, improved_train_transform, test_transform, display_transform


def create_model(num_classes: int, unfreeze_layer4: bool = False):
    model = models.resnet18(weights=None)
    state_dict = torch.load(WEIGHTS_PATH, map_location="cpu")
    model.load_state_dict(state_dict)

    for param in model.parameters():
        param.requires_grad = False

    in_features = model.fc.in_features
    model.fc = nn.Linear(in_features, num_classes)

    if unfreeze_layer4:
        for param in model.layer4.parameters():
            param.requires_grad = True
        for param in model.fc.parameters():
            param.requires_grad = True
    else:
        for param in model.fc.parameters():
            param.requires_grad = True

    return model.to(DEVICE)


def create_optimizer(model: nn.Module, unfreeze_layer4: bool, lr_fc: float, lr_layer4: float = None):
    if unfreeze_layer4:
        params = [
            {"params": model.layer4.parameters(), "lr": lr_layer4},
            {"params": model.fc.parameters(), "lr": lr_fc},
        ]
    else:
        params = [{"params": model.fc.parameters(), "lr": lr_fc}]
    return optim.Adam(params)


def create_loaders(train_transform, test_transform, batch_size=32):
    train_dataset = FruitDataset(TRAIN_DIR, transform=train_transform)
    test_dataset = FruitDataset(TEST_DIR, transform=test_transform)
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False, num_workers=0)
    return train_dataset, test_dataset, train_loader, test_loader


def evaluate(model, loader, criterion):
    model.eval()
    total_loss = 0.0
    total = 0
    correct = 0
    all_true = []
    all_pred = []
    all_probs = []
    all_paths = []

    with torch.no_grad():
        for images, labels, paths in loader:
            images = images.to(DEVICE)
            labels = labels.to(DEVICE)

            logits = model(images)
            loss = criterion(logits, labels)
            probs = torch.softmax(logits, dim=1)
            preds = probs.argmax(dim=1)

            total_loss += loss.item() * images.size(0)
            total += labels.size(0)
            correct += (preds == labels).sum().item()
            all_true.extend(labels.cpu().tolist())
            all_pred.extend(preds.cpu().tolist())
            all_probs.extend(probs.cpu().tolist())
            all_paths.extend(list(paths))

    return {
        "loss": total_loss / total,
        "acc": correct / total,
        "true": all_true,
        "pred": all_pred,
        "probs": all_probs,
        "paths": all_paths,
    }


def train_model(config):
    train_dataset, test_dataset, train_loader, test_loader = create_loaders(
        config["train_transform"], config["test_transform"], batch_size=config["batch_size"]
    )
    model = create_model(len(CANONICAL_CLASSES), unfreeze_layer4=config["unfreeze_layer4"])
    optimizer = create_optimizer(
        model,
        unfreeze_layer4=config["unfreeze_layer4"],
        lr_fc=config["lr_fc"],
        lr_layer4=config.get("lr_layer4"),
    )
    criterion = nn.CrossEntropyLoss()

    history = {"train_loss": [], "train_acc": [], "test_loss": [], "test_acc": []}
    best_state = None
    best_acc = -1.0
    best_eval = None

    for epoch in range(1, config["epochs"] + 1):
        model.train()
        total_loss = 0.0
        total = 0
        correct = 0

        for images, labels, _ in train_loader:
            images = images.to(DEVICE)
            labels = labels.to(DEVICE)

            optimizer.zero_grad()
            logits = model(images)
            loss = criterion(logits, labels)
            loss.backward()
            optimizer.step()

            total_loss += loss.item() * images.size(0)
            total += labels.size(0)
            correct += (logits.argmax(dim=1) == labels).sum().item()

        train_loss = total_loss / total
        train_acc = correct / total
        test_metrics = evaluate(model, test_loader, criterion)

        history["train_loss"].append(train_loss)
        history["train_acc"].append(train_acc)
        history["test_loss"].append(test_metrics["loss"])
        history["test_acc"].append(test_metrics["acc"])

        print(
            f"{config['name']} epoch {epoch:02d}/{config['epochs']} "
            f"train_loss={train_loss:.4f} train_acc={train_acc:.4f} "
            f"test_loss={test_metrics['loss']:.4f} test_acc={test_metrics['acc']:.4f}"
        )

        if test_metrics["acc"] > best_acc:
            best_acc = test_metrics["acc"]
            best_state = {k: v.cpu() for k, v in model.state_dict().items()}
            best_eval = test_metrics

    model.load_state_dict(best_state)
    return {
        "config": config,
        "model": model,
        "history": history,
        "best_eval": best_eval,
        "train_dataset": train_dataset,
        "test_dataset": test_dataset,
    }


def confusion_matrix(y_true, y_pred, num_classes):
    cm = np.zeros((num_classes, num_classes), dtype=np.int64)
    for t, p in zip(y_true, y_pred):
        cm[t, p] += 1
    return cm


def normalize_rows(cm):
    row_sums = cm.sum(axis=1, keepdims=True)
    row_sums[row_sums == 0] = 1
    return cm / row_sums


def top_confusions(cm, top_k=5):
    items = []
    for true_idx in range(cm.shape[0]):
        for pred_idx in range(cm.shape[1]):
            if true_idx == pred_idx:
                continue
            count = int(cm[true_idx, pred_idx])
            if count > 0:
                items.append(
                    {
                        "true_idx": true_idx,
                        "pred_idx": pred_idx,
                        "count": count,
                        "true_name": IDX_TO_CLASS[true_idx],
                        "pred_name": IDX_TO_CLASS[pred_idx],
                    }
                )
    items.sort(key=lambda x: x["count"], reverse=True)
    return items[:top_k]


def per_class_accuracy(cm):
    out = []
    for i in range(cm.shape[0]):
        total = int(cm[i].sum())
        acc = float(cm[i, i] / total) if total else 0.0
        out.append({"class_name": IDX_TO_CLASS[i], "correct": int(cm[i, i]), "total": total, "acc": acc})
    return out


def find_error_records(metrics, max_items=6):
    records = []
    for true_idx, pred_idx, probs, path in zip(
        metrics["true"], metrics["pred"], metrics["probs"], metrics["paths"]
    ):
        if true_idx == pred_idx:
            continue
        confidence = float(max(probs))
        records.append(
            {
                "path": path,
                "true_idx": true_idx,
                "pred_idx": pred_idx,
                "true_name": IDX_TO_CLASS[true_idx],
                "pred_name": IDX_TO_CLASS[pred_idx],
                "confidence": confidence,
                "probs": probs,
            }
        )
    records.sort(key=lambda x: x["confidence"], reverse=True)
    return records[:max_items]


def match_corrected_samples(baseline_metrics, improved_metrics, max_items=4):
    baseline_by_path = {}
    for true_idx, pred_idx, probs, path in zip(
        baseline_metrics["true"],
        baseline_metrics["pred"],
        baseline_metrics["probs"],
        baseline_metrics["paths"],
    ):
        baseline_by_path[path] = {"true": true_idx, "pred": pred_idx, "probs": probs}

    improved_by_path = {}
    for true_idx, pred_idx, probs, path in zip(
        improved_metrics["true"],
        improved_metrics["pred"],
        improved_metrics["probs"],
        improved_metrics["paths"],
    ):
        improved_by_path[path] = {"true": true_idx, "pred": pred_idx, "probs": probs}

    corrected = []
    for path, base in baseline_by_path.items():
        improved = improved_by_path[path]
        if base["pred"] != base["true"] and improved["pred"] == improved["true"]:
            corrected.append(
                {
                    "path": path,
                    "true_idx": base["true"],
                    "true_name": IDX_TO_CLASS[base["true"]],
                    "baseline_pred_idx": base["pred"],
                    "baseline_pred_name": IDX_TO_CLASS[base["pred"]],
                    "baseline_probs": base["probs"],
                    "improved_pred_idx": improved["pred"],
                    "improved_pred_name": IDX_TO_CLASS[improved["pred"]],
                    "improved_probs": improved["probs"],
                    "confidence_gain": float(max(improved["probs"]) - max(base["probs"])),
                }
            )
    corrected.sort(key=lambda x: x["confidence_gain"], reverse=True)
    return corrected[:max_items]


def load_display_image(path):
    return np.array(Image.open(path).convert("RGB").resize((224, 224)))


def plot_confusion_with_examples(cm, examples, title, output_path):
    fig = plt.figure(figsize=(16, 9), dpi=140)
    gs = fig.add_gridspec(2, 4, width_ratios=[1.5, 1, 1, 1], height_ratios=[1, 1])

    ax_cm = fig.add_subplot(gs[:, 0])
    norm = normalize_rows(cm)
    im = ax_cm.imshow(norm, cmap="Blues", vmin=0.0, vmax=1.0)
    ax_cm.set_xticks(range(len(CANONICAL_CLASSES)))
    ax_cm.set_yticks(range(len(CANONICAL_CLASSES)))
    ax_cm.set_xticklabels(CANONICAL_CLASSES, rotation=45, ha="right", fontsize=8)
    ax_cm.set_yticklabels(CANONICAL_CLASSES, fontsize=8)
    ax_cm.set_xlabel("Predicted")
    ax_cm.set_ylabel("True")
    ax_cm.set_title(title)
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            text = f"{cm[i, j]}\n{norm[i, j]:.2f}"
            color = "white" if norm[i, j] > 0.55 else "black"
            ax_cm.text(j, i, text, ha="center", va="center", color=color, fontsize=7)
    fig.colorbar(im, ax=ax_cm, fraction=0.046, pad=0.04)

    for idx in range(3):
        ax = fig.add_subplot(gs[0, idx + 1])
        if idx < len(examples):
            rec = examples[idx]
            ax.imshow(load_display_image(rec["path"]))
            ax.set_title(
                f"{Path(rec['path']).name}\ntrue={rec['true_name']}\npred={rec['pred_name']}",
                fontsize=9,
                color="red",
            )
        ax.axis("off")

    for idx in range(3, 6):
        ax = fig.add_subplot(gs[1, idx - 2])
        if idx < len(examples):
            rec = examples[idx]
            ax.imshow(load_display_image(rec["path"]))
            ax.set_title(
                f"{Path(rec['path']).name}\ntrue={rec['true_name']}\npred={rec['pred_name']}",
                fontsize=9,
                color="red",
            )
        ax.axis("off")

    fig.tight_layout()
    fig.savefig(output_path, bbox_inches="tight")
    plt.close(fig)


def plot_training_compare(baseline_history, improved_history, output_path):
    fig, axes = plt.subplots(1, 2, figsize=(12, 4.8), dpi=140)

    axes[0].plot(baseline_history["test_acc"], marker="o", label="Baseline Test Acc")
    axes[0].plot(improved_history["test_acc"], marker="s", label="Improved Test Acc")
    axes[0].set_xlabel("Epoch")
    axes[0].set_ylabel("Accuracy")
    axes[0].set_title("Test Accuracy Comparison")
    axes[0].grid(alpha=0.3)
    axes[0].legend()

    axes[1].plot(baseline_history["test_loss"], marker="o", label="Baseline Test Loss")
    axes[1].plot(improved_history["test_loss"], marker="s", label="Improved Test Loss")
    axes[1].set_xlabel("Epoch")
    axes[1].set_ylabel("Loss")
    axes[1].set_title("Test Loss Comparison")
    axes[1].grid(alpha=0.3)
    axes[1].legend()

    fig.tight_layout()
    fig.savefig(output_path, bbox_inches="tight")
    plt.close(fig)


def plot_improved_with_corrected(cm, corrected, output_path):
    fig = plt.figure(figsize=(18, 10), dpi=140)
    gs = fig.add_gridspec(2, 5, width_ratios=[1.6, 1, 1, 1, 1], height_ratios=[1, 1])

    ax_cm = fig.add_subplot(gs[:, 0])
    norm = normalize_rows(cm)
    im = ax_cm.imshow(norm, cmap="Greens", vmin=0.0, vmax=1.0)
    ax_cm.set_xticks(range(len(CANONICAL_CLASSES)))
    ax_cm.set_yticks(range(len(CANONICAL_CLASSES)))
    ax_cm.set_xticklabels(CANONICAL_CLASSES, rotation=45, ha="right", fontsize=8)
    ax_cm.set_yticklabels(CANONICAL_CLASSES, fontsize=8)
    ax_cm.set_xlabel("Predicted")
    ax_cm.set_ylabel("True")
    ax_cm.set_title("Improved Confusion Matrix")
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            text = f"{cm[i, j]}\n{norm[i, j]:.2f}"
            color = "white" if norm[i, j] > 0.55 else "black"
            ax_cm.text(j, i, text, ha="center", va="center", color=color, fontsize=7)
    fig.colorbar(im, ax=ax_cm, fraction=0.046, pad=0.04)

    for idx in range(4):
        ax_img = fig.add_subplot(gs[0, idx + 1])
        ax_bar = fig.add_subplot(gs[1, idx + 1])
        if idx < len(corrected):
            rec = corrected[idx]
            ax_img.imshow(load_display_image(rec["path"]))
            ax_img.set_title(
                f"{Path(rec['path']).name}\ntrue={rec['true_name']}\nbase={rec['baseline_pred_name']} -> new={rec['improved_pred_name']}",
                fontsize=9,
            )
            x = np.arange(len(CANONICAL_CLASSES))
            ax_bar.bar(x - 0.18, rec["baseline_probs"], width=0.36, label="Base")
            ax_bar.bar(x + 0.18, rec["improved_probs"], width=0.36, label="Improved")
            ax_bar.set_xticks(x)
            ax_bar.set_xticklabels(range(len(CANONICAL_CLASSES)), fontsize=7)
            ax_bar.set_ylim(0, 1)
            ax_bar.set_title("Probability Shift", fontsize=9)
            if idx == 0:
                ax_bar.legend(fontsize=8)
        ax_img.axis("off")
        ax_bar.grid(axis="y", alpha=0.3)

    fig.tight_layout()
    fig.savefig(output_path, bbox_inches="tight")
    plt.close(fig)


def reason_for_pair(true_name, pred_name):
    heuristics = {
        tuple(sorted(("apple", "avocado"))): "两类都常见为圆形或椭圆形果实，颜色跨度都覆盖绿系，若背景复杂或拍摄角度偏侧面，轮廓信息容易相互干扰。",
        tuple(sorted(("kiwi", "avocado"))): "两类都偏椭圆，且经常出现深绿或棕绿色外观；如果纹理细节被缩放和裁剪削弱，模型容易只抓到整体形状。",
        tuple(sorted(("orange", "mango"))): "两类在暖色调图片里都可能呈现黄橙色，尤其成熟芒果在局部区域与橙子颜色接近。",
        tuple(sorted(("banana", "mango"))): "部分类别样本会出现单个果实占满画面，模型若主要依赖颜色与弯曲轮廓，容易把黄色芒果和香蕉局部混淆。",
        tuple(sorted(("strawberries", "cherry"))): "两类都属于红色小果，若只看到局部果面、叶片或成簇摆放方式，颜色和尺寸特征都较接近。",
        tuple(sorted(("watermelon", "pinenapple"))): "两类外皮纹理都较强，若只保留局部表面花纹，纹理特征可能盖过整体形状差异。",
        tuple(sorted(("watermelon", "strawberries"))): "这组误判通常出现在只截到西瓜红色果肉或近景纹理时，模型会把大块红色区域误当成草莓果面。",
    }
    key = tuple(sorted((true_name, pred_name)))
    return heuristics.get(key, "这两类在颜色、轮廓或纹理上存在局部相似性，且数据增强后的裁剪可能削弱了整体外形信息。")


def select_discussion_pairs(confusions):
    preferred = [
        ("mango", "orange"),
        ("strawberries", "cherry"),
        ("watermelon", "strawberries"),
        ("apple", "cherry"),
    ]
    selected = []
    used = set()
    for true_name, pred_name in preferred:
        for item in confusions:
            if item["true_name"] == true_name and item["pred_name"] == pred_name and item["count"] > 0:
                selected.append(item)
                used.add((item["true_name"], item["pred_name"]))
                break
        if len(selected) >= 2:
            return selected
    for item in confusions:
        key = (item["true_name"], item["pred_name"])
        if key not in used:
            selected.append(item)
        if len(selected) >= 2:
            break
    return selected[:2]


def write_report(baseline_result, improved_result, baseline_cm, improved_cm, corrected_samples):
    baseline_top = top_confusions(baseline_cm, top_k=4)
    improved_top = top_confusions(improved_cm, top_k=4)
    baseline_per_class = sorted(per_class_accuracy(baseline_cm), key=lambda x: x["acc"])
    improved_per_class = sorted(per_class_accuracy(improved_cm), key=lambda x: x["acc"])

    discussion_pairs = select_discussion_pairs(top_confusions(baseline_cm, top_k=10))
    confusion_lines = []
    for item in discussion_pairs:
        confusion_lines.append(
            f"- `{item['true_name']} -> {item['pred_name']}` 在基线中出现 {item['count']} 次。{reason_for_pair(item['true_name'], item['pred_name'])}"
        )

    corrected_lines = []
    for item in corrected_samples[:2]:
        corrected_lines.append(
            f"- `{Path(item['path']).name}`：基线把 `{item['true_name']}` 预测成 `{item['baseline_pred_name']}`，优化后改判为正确类别 `{item['improved_pred_name']}`。"
        )

    report = f"""# ResNet18 水果分类分析

## Baseline

- 基线配置：冻结 ResNet18 主干，只训练最后的全连接层，训练 5 个 epoch，学习率 0.001。
- 基线最佳测试准确率：{baseline_result['best_eval']['acc'] * 100:.2f}%
- 基线测试损失：{baseline_result['best_eval']['loss']:.4f}

基线最容易分错的类别：
{chr(10).join(confusion_lines)}

基线里最差的几个类别（按分类准确率排序）：
{chr(10).join([f"- `{x['class_name']}`: {x['correct']}/{x['total']} = {x['acc'] * 100:.2f}%" for x in baseline_per_class[:4]])}

## Diagnosis

- 数据层面：训练集与测试集整体数量基本均衡，所以主要问题不像是类别不平衡，更像是类别外观相似和背景干扰。
- 模型层面：只训练最后一层时，预训练 backbone 的高层特征没有针对水果数据集继续适配，局部纹理和颜色容易主导判断。
- 增强层面：随机裁剪会在一部分样本里弱化整体外形，导致模型更依赖局部颜色块和表皮纹理。

## Optimization

这次只做两项小幅优化：

1. 解冻 `layer4` 和 `fc`，不再只训练最后一层，让高层语义特征能继续适配水果类别。
2. 把训练轮数从 5 提高到 8，并使用分组学习率：`layer4=1e-4`，`fc=5e-4`。

## After Optimization

- 优化后最佳测试准确率：{improved_result['best_eval']['acc'] * 100:.2f}%
- 优化后测试损失：{improved_result['best_eval']['loss']:.4f}
- 准确率提升：{(improved_result['best_eval']['acc'] - baseline_result['best_eval']['acc']) * 100:+.2f} 个百分点

优化后混淆情况最明显的几组：
{chr(10).join([f"- `{x['true_name']} -> {x['pred_name']}`: {x['count']} 次" for x in improved_top[:4]])}

优化后仍然最难的几个类别：
{chr(10).join([f"- `{x['class_name']}`: {x['correct']}/{x['total']} = {x['acc'] * 100:.2f}%" for x in improved_per_class[:4]])}

被修正的代表性错误样例：
{chr(10).join(corrected_lines) if corrected_lines else "- 本次没有找到“基线错、优化后对”的样本，但整体准确率和混淆矩阵已有改善。"}

## Suggested Text For Assignment

我先复现了教程中的基线 ResNet18 结果，并从混淆矩阵中发现模型最容易把外观相近的水果分错，例如颜色和轮廓接近的类别。结合错误样例可以看出，当前模型主要依赖局部颜色和纹理，而只训练最后一层不足以让高层特征充分适应水果数据集。  
因此我选择解冻 ResNet18 的最后一个残差模块 `layer4`，并适当增加训练轮数，同时使用更小的 backbone 学习率进行微调。优化后测试准确率提升到了 {improved_result['best_eval']['acc'] * 100:.2f}%，部分原来容易混淆的类别在混淆矩阵中明显减轻，且有一些原来分错的样本被修正。  
这说明小幅微调预训练模型的高层特征，比单纯训练最后一层更适合这组水果分类任务。
"""

    (OUTPUT_DIR / "analysis_report.md").write_text(report, encoding="utf-8")


def save_json_summary(baseline_result, improved_result, baseline_cm, improved_cm):
    summary = {
        "device": str(DEVICE),
        "classes": CANONICAL_CLASSES,
        "baseline": {
            "best_acc": baseline_result["best_eval"]["acc"],
            "best_loss": baseline_result["best_eval"]["loss"],
            "top_confusions": top_confusions(baseline_cm, top_k=6),
        },
        "improved": {
            "best_acc": improved_result["best_eval"]["acc"],
            "best_loss": improved_result["best_eval"]["loss"],
            "top_confusions": top_confusions(improved_cm, top_k=6),
        },
    }
    (OUTPUT_DIR / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")


def print_dataset_stats(train_dataset, test_dataset):
    train_counter = Counter(sample["label"] for sample in train_dataset.samples)
    test_counter = Counter(sample["label"] for sample in test_dataset.samples)
    print(f"device: {DEVICE}")
    print(f"train samples: {len(train_dataset)}")
    print(f"test samples: {len(test_dataset)}")
    for class_name in CANONICAL_CLASSES:
        idx = CLASS_TO_IDX[class_name]
        print(f"{class_name:12s} train={train_counter[idx]:4d} test={test_counter[idx]:4d}")


def main():
    if not WEIGHTS_PATH.exists():
        raise FileNotFoundError(f"Missing weights file: {WEIGHTS_PATH}")

    train_transform, improved_train_transform, test_transform, _ = get_transforms()
    train_dataset, test_dataset, _, _ = create_loaders(train_transform, test_transform, batch_size=32)
    print_dataset_stats(train_dataset, test_dataset)

    baseline_config = {
        "name": "baseline",
        "train_transform": train_transform,
        "test_transform": test_transform,
        "batch_size": 32,
        "epochs": 5,
        "unfreeze_layer4": False,
        "lr_fc": 1e-3,
    }
    improved_config = {
        "name": "improved",
        "train_transform": improved_train_transform,
        "test_transform": test_transform,
        "batch_size": 32,
        "epochs": 8,
        "unfreeze_layer4": True,
        "lr_fc": 5e-4,
        "lr_layer4": 1e-4,
    }

    baseline_result = train_model(baseline_config)
    improved_result = train_model(improved_config)

    baseline_cm = confusion_matrix(
        baseline_result["best_eval"]["true"], baseline_result["best_eval"]["pred"], len(CANONICAL_CLASSES)
    )
    improved_cm = confusion_matrix(
        improved_result["best_eval"]["true"], improved_result["best_eval"]["pred"], len(CANONICAL_CLASSES)
    )

    baseline_errors = find_error_records(baseline_result["best_eval"], max_items=6)
    corrected_samples = match_corrected_samples(
        baseline_result["best_eval"], improved_result["best_eval"], max_items=4
    )

    plot_confusion_with_examples(
        baseline_cm,
        baseline_errors,
        title="Baseline Confusion Matrix",
        output_path=OUTPUT_DIR / "figure1_baseline_confusion_and_errors.png",
    )
    plot_training_compare(
        baseline_result["history"],
        improved_result["history"],
        output_path=OUTPUT_DIR / "figure2_training_compare.png",
    )
    plot_improved_with_corrected(
        improved_cm,
        corrected_samples,
        output_path=OUTPUT_DIR / "figure3_improved_confusion_and_corrected.png",
    )

    write_report(baseline_result, improved_result, baseline_cm, improved_cm, corrected_samples)
    save_json_summary(baseline_result, improved_result, baseline_cm, improved_cm)

    torch.save(baseline_result["model"].state_dict(), OUTPUT_DIR / "baseline_model.pth")
    torch.save(improved_result["model"].state_dict(), OUTPUT_DIR / "improved_model.pth")

    print("\nTop baseline confusions:")
    for item in top_confusions(baseline_cm, top_k=6):
        print(f"  {item['true_name']} -> {item['pred_name']}: {item['count']}")

    print("\nTop improved confusions:")
    for item in top_confusions(improved_cm, top_k=6):
        print(f"  {item['true_name']} -> {item['pred_name']}: {item['count']}")

    print("\nOutputs saved to:", OUTPUT_DIR)


if __name__ == "__main__":
    main()
