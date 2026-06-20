# 第二章 

## 1.梯度下降
### 1.1 formula

```
w_new = w_old - alpha * dL/dw
```

where:
- w : weight
- L : loss function
- dL/dw : gradient of loss function with respect to weight
- α : learning rate


### 1.2 w的更新过程

gradient > 0
- w_new < w_old
gradient < 0
- w_new > w_old

## 2.学习率过大/过小
### 2.1 学习率过大
> loss 剧烈震荡

### 2.2 学习率过小
> loss 下降缓慢，训练时间过长

## 3.链式法则求梯度
```
L = 0.5 * (y_pred - y_true)^2
y_pred = w x + b
求 dL/dw
```

令
```
e = y_pred - y_true
L = 0.5 * e^2
```

so
```
de/dy_pred = 1
dy_pred/dw = x
dL/dw = dL/de * de/dy_pred * dy_pred/dw
       = e * 1 * x
       = (y_pred - y_true) * x
```

## 4. batch\iteration\epoch caculation

### batch size
一次性的训练样本数量

### iteration

一次参数更新
一个batch对应一个iteration
### epoch
整个训练集训练完一次

### 4.2核心公式
> 每个epoch 的 iteration数 = 训练样本数 / batch size

总的iteration:
> iteration = 每个epoch的iteration数 * epoch数

### 4.3 例子
```
2400 pictures
batch = 32
训练75个epoch
```
every epoch
```
iteration = 2400 / 32 = 75
```
sum of iteration
```
iteration = 75 * 75 = 5625
```


## 5.batch size 变大的影响

> 增大batch_size 可能降低模型泛化能力

> batch越大，gradient越平滑，chaoticity越小，可能收敛到更尖锐的极小值，泛化能力下降

## 6.Relu
Relu = max(0, x)

## 7.Sigmoid ReLU 线性回归 梯度方向判断
- 线性回归是监督学习
- Sigmoid输出范围是(0, 1)，适合二分类问题
- ReLU 的导数为 0 1
- 梯度下降按照正方向更新

## 8.softmax + One-hot + 交叉熵
### 8.1 多分类交叉熵公式
> y = [1, 0 , 0, 0]
预测概率是
> p = [0.7, 0.1, 0.1, 0.1]
交叉熵公式
> L = - Σ y_i * log(p_i) = - log(0.7) = 0.3567

## 9.训练集、验证集、测试集

| 数据集                | 作用     | 是否参与训练          |
| ------------------ | ------ | --------------- |
| 训练集 train set      | 更新参数   | 参与              |
| 验证集 validation set | 调参、选模型 | 不参与参数训练，但用于模型选择 |
| 测试集 test set       | 最终评估   | 不应反复使用          |
