# Chapter05 目标检测算法与训练

## 1. 什么是目标检测

### 1.1 核心定义
目标检测 Object Detection = 识别 + 定位

也就是同时回答连个问题
1. 图像中有什么？（分类）
2. 这些东西在哪里？（定位）

### 1.2 四类视觉任务对比
| 任务                            | 输出         | 例子          |
| ----------------------------- | ---------- | ----------- |
| Classification                | 类别         | 这是一只猫       |
| Classification + Localization | 单个类别 + 单个框 | 这是一只猫，位置在这里 |
| Object Detection              | 多个类别 + 多个框 | 猫、狗、鸭分别在哪里  |
| Instance Segmentation         | 每个实例的像素级轮廓 | 每只动物的精确区域   |

## 2. 目标检测引用场景
```
自动驾驶：检测行人、车辆、交通标志等
动作识别：检测人体姿态、手势等
农业监测：检测作物、病虫害等
安防监控：检测异常行为、入侵者等
医疗影像：检测肿瘤、病变等
```

## 3.两阶段检测 vs 单阶段检测
### 3.1 两阶段检测 Two-Stage Detection
```
第一阶段：生成候选区域（Region Proposal）
第二阶段：对候选区域进行分类和精确定位
```

R-CNN流程可以写作
```
输入图像
-> 选择性搜索生成候选框
-> 对每个候选框进行特征提取（CNN）
-> 使用SVM分类器进行分类
-> 修正边界框位置
```

### 3.2 单阶段检测 One-Stage Detection YOLO思路
只用一次CNN前向计算，直接同时预测
```
类别 + 位置
```

特点
1. One-stage
2. 分类和边框回归同时进行
3. 速度快
4. 定位精度低一些

## 4.YOLOv1算法流程

### 4.1 划分网格
YOLO将输入图像划分成SxS的网格，每个网格负责预测该区域内的目标。

如果某个物体的中心落在某个网格内，那么这个网格就负责预测这个物体。

如果一个网格内没有物体，那么这个网格的预测结果应该是背景。

### 4.2 每个cell预测B个边界框

每个cell预测B个bounding boxex, 每个bounding box包含5个元素
```
x,y -> 边界框中心相对于cell的偏移量，范围是0到1
w,h -> 边界框的宽度和高度，相对于整个图像的比例，范围是0到1
confidence -> 置信度，表示该边界框包含物体的概率以及边界框预测的准确程度
```

### 4.3 每个cell预测C个类别概率
每个cell还会预测C个类别的概率分布，表示该cell内物体属于每个类别的概率。

## 5.Confidence与IoU
### 5.1 Confidence的定义
Confidence = Pr(object) * IoU(pred, truth)

| 项          | 含义           |
| ---------- | ------------ |
| Pr(Object) | 这个框里是否有物体    |
| IoU        | 预测框和真实框的重合程度 |
| Confidence | 框里有物体且框得准的程度 |

### 5.2 IoU的定义
IoU 全称: Intersection over Union 交并比
```
IoU = (预测框和真实框的交集面积) / (预测框和真实框的并集面积)
```
IoU的值在0到1之间，值越大表示预测框和真实框的重合程度越高。

## 6. Class-specific Confidence Score
```
Pr(class_i | object) * Pr(object) * IoU(pred, truth)
```
作用

用于预测时边界框筛选

也就是说，一个框最后保留与否，不只看它是否像物体，还要看
```
它属于某类的概率 x 这个框定位的准不准
```

## 7. YOLOv1输出张量大小(计算题)
### 7.1 通用公式
```
输出张量大小 = S x S x (B x 5 + C)
```
| 符号    | 含义                               |
| ----- | -------------------------------- |
| S × S | 网格数量                             |
| B     | 每个 cell 预测的 bbox 数量              |
| 5     | 每个 bbox 的 x, y, w, h, confidence |
| C     | 类别数                              |

## 8. YOLO 网络结构
```
采用卷积网络提取特征
采用全连接层得到预测值
网络参考GoogLeNet
包含24个卷积层 + 2个全连接层
卷积层和全连接层使用 Leaky ReLU
```

## 9. NMS非极大值抑制

### 9.1 为什么需要NMS
目标检测模型经常会对统一为物体预测出多个重叠框，NMS的作用就是从这些重叠框中选出一个最优的框，去掉其他冗余的框。
### 9.2 NMS的流程
```
step1: 对所有预测框按照置信度进行排序
step2: 选择置信度最高的框作为基准框，保留它
step3: 计算基准框与剩余框的IoU，如果IoU超过设定阈值，则去掉该框
step4: 重复step2和step3，直到所有框都被处理完毕
```

通俗的讲，就是 选最高分 -> 去掉重叠的框 - > 选下一个最高分 -> 去掉重叠的框 - > ...

## 10.YOLO 评价指标

### 10.1 Precision 和 Recall
定义
```
Precision = TP / (TP + FP)
Recall = TP / (TP + FN)
```

| 指标        | 关注点            | 中文理解  |
| --------- | -------------- | ----- |
| Precision | 预测为正的里面有多少是真的  | 有没有误报 |
| Recall    | 真实为正的里面有多少被找到了 | 有没有漏报 |

### 10.2 F1-score
F1-score 是 Precision 和 Recall 的调和平均数，定义为
```
F1 = 2 * (Precision * Recall) / (Precision + Recall)
```

### 10.3 TP/FP/FN 在检测任务中的定义

| 情况         | 结果 |
| ---------- | -- |
| 类别正确，框也准   | TP |
| 真实目标没有被检测到 | FN |
| 检测出不存在的目标  | FP |
| 类别判断错      | FP |
| 同一目标重复检测   | FP |

### 10.4 AP和 mAP
```
AP = Average Precision 平均精度 PR曲线下面积
mAP = mean Average Precision 平均AP
```

直白的说:
```
AP 是一个类别的平均精度，mAP 是所有类别的平均AP
```
## 11.YOLO的优缺点
优点
```
检测速度快、适合实时应用
背景误检少 
能功利用全局上下文信息
```

缺点
```
定位精度较低，特别是对于小物体
小目标检测性能较差
对训练数据中未见过的物体泛化能力较弱
```

## 12.语义分割和目标检测的区别

| 任务   | 输出           |
| ---- | ------------ |
| 目标检测 | 类别 + 矩形框     |
| 语义分割 | 每个像素的类别      |
| 实例分割 | 每个物体实例的像素级区域 |

考试问得话，就可以说
```
目标检测定位到矩形框、语义分割定位到像素级区域
```

## 13. YOLO + OpenCV 实践

偏向实验的内容，不要求高分or操作跳过即可

### 13.1 环境配置
```
conda 环境
激活环境
安装 jupyter \ matplotlib \ ultralytics \ opencv-python
```

### 13.2 YOLO inference
```py
from ultralytics import YOLO

model = YOLO("./models/yolov10n.pt", task = "detect")

results = model(source="./data/images/bus.jpg",
                save=True
                conf=0.05)
```

| 代码              | 含义      |
| --------------- | ------- |
| `YOLO(...)`     | 加载模型权重  |
| `task="detect"` | 目标检测任务  |
| `source=...`    | 输入图片或视频 |
| `save=True`     | 保存结果    |
| `conf=0.05`     | 置信度阈值   |


## 14. YOLO数据集格式
```
fruit/
  images/
    train/
    val/
  labels/
    train/
    val/
  classes.txt
```
| 文件夹 / 文件       | 内容    |
| -------------- | ----- |
| `images/train` | 训练集图片 |
| `images/val`   | 验证集图片 |
| `labels/train` | 训练集标签 |
| `labels/val`   | 验证集标签 |
| `classes.txt`  | 类别名称  |

## 15.标注工具

| 工具            | 用途                    |
| ------------- | --------------------- |
| labelImg      | 轻量目标检测框标注             |
| label-studio  | 分类、检测、追踪等多任务标注        |
| X-AnyLabeling | 交互式标注，支持点 / 框提示、检测、追踪 |
| MedSAM2       | 医学领域分割，人在回路半自动标注      |

考试问 : 为什么需要标注工具？可以说
```
目标检测是监督学习，需要每个目标的类别标签和边界框位置作为训练监督信号
```

## 16. MediaPipe手势交互
### 16.1 MediaPipe 是什么
MediaPipe 是 Google 开源的跨平台机器学习框架，提供了丰富的预训练模型和工具，支持实时计算机视觉任务，如人脸检测、手势识别、姿态估计等。

包含
```
人脸检测
人脸关键点
手势识别
头像分割
姿态估计
```

### 16.2 MediaPipe Hands
MediaPipe Hands 是 MediaPipe 提供的一个预训练模型，专门用于手部关键点检测和手势识别。它能够实时检测手部位置，并识别出21个关键点，包括手指关节和掌心位置。

### 16.3 Selfie Segmentation 

作业要求
```
使用mediapiep 完成手势识别
使用 3 种 手势实现背景图片的切换
```

## 17.总结
### 17.1 必背概念
```
目标检测 = 识别 + 定位

YOLO = One-stage detector
一次 CNN 前向计算同时预测类别和边界框

R-CNN / Faster R-CNN = Two-stage detector
先生成候选框，再分类和回归边界框

IoU = 交集面积 / 并集面积

Confidence = Pr(Object) × IoU

NMS = 非极大值抑制，用于去除重复框

Precision = TP / (TP + FP)

Recall = TP / (TP + FN)

F1 = 2PR / (P + R)

AP = PR 曲线下面积

mAP = 多类别 AP 的平均值
```
### 17.2 公式
YOLO 输出张量大小
```
输出张量大小 = S x S x (B x 5 + C)
```
Confidence 公式
```
Confidence = Pr(Object) × IoU(pred, truth)
```
IoU 公式
```
IoU = (预测框和真实框的交集面积) / (预测框和真实框的并集面积)
```
Precision 公式
```
Precision = TP / (TP + FP)
```
Recall 公式
```
Recall = TP / (TP + FN)
```
F1 公式
```
F1 = 2 * (Precision * Recall) / (Precision + Recall)
```
