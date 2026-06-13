# Chapter02 Pythonの基本知識

## 1. 总览
| 模块    | 工具           | 解决什么问题                                         |
| ----- | ------------ | ---------------------------------------------- |
| 模块一   | NumPy        | 批量数值计算、数组创建、广播、索引、筛选                           |
| 模块二   | Matplotlib   | 把数据画成图，表达趋势、比较、分布                              |
| 模块三   | OpenCV       | 图像读取、显示、灰度转换、像素修改、摄像头调用                        |
| 模块四   | os / pathlib | 路径管理、文件遍历、重命名、删除、批量整理                          |
| 模块四扩展 | 文档处理工具       | 扫描 Word / PDF / Markdown / Excel / PPT，批量转换与汇总 |

## 2. Numpy

### 2.1 核心思路:向量化计算
Numpy的价值是批量处理数值数据。普通Python list需要显示循环。而Numpy可以直接对整个数组进行操作，底层使用C语言实现，效率更高。

eg.
```python
#list
result = [x * 2 for x in my_list]
#numpy
result = my_array * 2
```
### 2.2 正弦函数练习
```python
import numpy as np

degrees = np.array([0, 30, 45, 60, 90])
radians = np.deg2rad(degrees)
sine_values = np.sin(radians)
```

### 2.3 创建数组
```python
np.array()
np.zeros()
np.ones()
np.arange()
np.linspace()
np.logspace()
np.random.rand()
np.random.randn()
np.random.randint()
```
常见用法
| 函数                  | 作用              | 例子                      |
| ------------------- | --------------- | ----------------------- |
| `np.array()`        | 从 list 创建数组     | `np.array([1, 2, 3])`   |
| `np.zeros()`        | 全 0 数组          | `np.zeros((3, 4))`      |
| `np.ones()`         | 全 1 数组          | `np.ones((2, 3))`       |
| `np.arange()`       | 等差序列，类似 `range` | `np.arange(0, 10, 2)`   |
| `np.linspace()`     | 指定范围内均匀取点       | `np.linspace(0, 1, 5)`  |
| `np.random.rand()`  | 均匀分布随机数         | `np.random.rand(2, 3)`  |
| `np.random.randn()` | 标准正态分布随机数       | `np.random.randn(2, 3)` |

### 2.4 数组属性 Shape永远是第一优先级

### 2.5 广播 Broadcasting

Numpy的广播规则可以压缩成一句话
```
不同形状的数组进行运算时，Numpy会自动扩展较小的数组，使它们具有相同的形状。
```

### 2.6 索引、切片、布尔索引
```python
# 索引
arr[1]
arr[1, 2]
arr[:2]

# 布尔索引
scores = np.array([85, 90, 78, 92])
valid = scores[(scores >= 80) & (scores <= 90)]
```

### 2.7 共享引用、视图 和 副本
```python
b = a # 指向同一个对象

c = a.view() # 创建视图，数据共享但对象不同

d = a.copy() # 创建副本，对象是新的一个
```

## 3. Matplotlib 数据可视化

### 3.1 定位
负责把数据变成图。
```py
plt.plot()      # 折线图
plt.scatter()   # 散点图
plt.bar()       # 柱状图
plt.pie()       # 饼图
plt.subplot()   # 子图
```

### 3.2 类型
| 图表  | 适合表达    | 例子           |
| --- | ------- | ------------ |
| 折线图 | 趋势、连续变化 | 时间序列、函数曲线    |
| 散点图 | 分布、相关性  | 身高-体重、特征关系   |
| 柱状图 | 类别比较    | 各省用电量、各模型准确率 |
| 饼图  | 占比      | 专业构成、预算比例    |
| 子图  | 多视角比较   | 同一数据的多个维度    |

### 3.3 图像配件
```text
标题：告诉读者这张图在讲什么
坐标轴标签：告诉读者横纵轴含义
图例：区分不同数据系列
网格：辅助读数
注释：突出重点
坐标范围：控制视觉重点
```

```py
plt.plot(x, y, label="sin(x)")
plt.title("Sine Function")
plt.xlabel("x")
plt.ylabel("y")
plt.legend()
plt.grid(True)
```

### 3.4 子图

不是重点。了解即可

## 4. OpenCV 图像处理
### 4.1 图像的基本概念

图像的本质: 数组

```
图像处理 = 数组处理 + 文件输入输出 + 显示
```

### 4.2 读取，显示，保存

```py
import cv2

img = cv2.imread("cats.jpeg")
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
cv2.imwrite("cat_gray.jpg", gray)
```
### 4.3 BGR 和 RGB
OpenCV默认使用BGR格式，而Matplotlib使用RGB格式。需要转换才能正确显示颜色。
```py
img_bgr = cv2.imread("cats.jpeg")
img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
plt.imshow(img_rgb)
```
### 4.4 灰度转换
核心代码:
```python
gray = cv2.cvtColor(img,cv2.COLOR_BGR2GRAY)
cv2.imwrite("cat_grey.jpg",gray)
```

### 4.5 像素点和区域操作
OpenCV中图像是数组，所以可以直接索引像素
```python
pixel = img[y,x]
```
**注意是 img[row,col]**

### 4.6 摄像头和视频
```python
cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    cv2.imshow("frame", frame)

    if cv2.waitKey(1) == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()
```

## 5. OS/ pathlib 文件管理

### 5.1 路径: 绝对路径 vs 相对路径
```
绝对路径: 完整收货地址
相对路径: 从当前位置出发往下面找
```
for example:
```py
from pathlib import Path

path = Path("research_data") / "2024_experiments" / "experiment_results.csv"
```

**pathlib**的作用是为了避免手动拼接 `\` 和 `/` ，让跨平台更稳定

### 5.2 当前目录和文件列表

```py
os.getcwd() # 返回CWD字符串
os.listdir(path) # 返回指定目录的条目  但是注意顺序是任意的
```
### 5.3 文件操作

例如删除 `os.remove`  重命名 `os.rename`

```py
# dry run
for file in files:
    print("将要重命名：", file)

# 确认后再执行
for file in files:
    os.rename(old_path, new_path)
```


## 6 考试重点

- 读代码
- 判断作用
- 为什么要用numpy之类的东西。