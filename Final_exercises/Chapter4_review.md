## 0.CNN题目先抓五个变量
- 输入图像的尺寸 H x W x C_in
- 卷积核大小: K x K
- 卷积核数量: C_out
- 步长: S
- 填充: P

## 1. why CNN is suitable for image processing
### 1.1 Problem of fully connected layer
- 32 x 32 x 3 = 3072 parameters for a 32x32 RGB image, which is too many parameters and can lead to overfitting.

#### 1.1.1 Too many parameters
if C_in is 224x224x3, and we have 1000 neurons in the first layer, we would have 224 x 224 x 3 x 1000 = 150,994,944 parameters, which is computationally expensive and prone to overfitting.

#### 1.1.2 Ignoring spatial structure
Picture has spatial structure
> Up Down Left Right Shape Edge Color etc.
After flattening, we lose this spatial information, and the model cannot learn from it.
#### 1.1.3 the change of position is not robust
If we shift the image slightly, the pixel values change significantly, which can lead to poor performance of the model.

CNN can solve it by
> partial connectivity, weight sharing, and pooling

## 2.Two decisive factors of CNN

### 2.1 Local connection
Normal fully connection:
> Each neuron is connected to all the neurons in the previous layer, which leads to a large number of parameters and ignores the spatial structure of the image.

CNN:
> Every CNN core is only connected to a local region of the input, which allows it to capture local features and reduces the number of parameters.

### 2.2 Weight sharing
The same convolutional kernel is applied across the entire input image, which allows the model to learn features that are invariant to translation and reduces the number of parameters.

benefits
- Reduced number of parameters
- The same feature can be detected in different positions of the image, which improves the model's ability to generalize.
- shift robustness: the model can recognize the same object even if it is shifted in the image.

## 3. convolutional kernel: depth = number of input channels, number = number of output channels
### 3.1 colored image and greyscale image
Greyscale
> H x W x 1
Colored image
> H x W x 3 (RGB)
### 3.2 convolutional kernel shape
> out_channels x in_channels x kernel_size x kernel_size
### 3.3 exam trick
> depth of convolutional kernel = number of input channels
> number of convolutional kernels = number of output channels

## 4. Convolution output caculation
### 4.1 formula
H_out = floor((H_in + 2P - K) / S) + 1
W_out = floor((W_in + 2P - K) / S) + 1
where:
- H_in: height of input image
- W_in: width of input image
- P: padding
- S: stride
- K: kernel size 
- floor: round down to the nearest integer

### 4.2 example
```
input = 128 x 128 x 3
conv: in = 3 , out = 32 , k = 5 , s = 2 , p = 2
```

```
H_out = floor((128 + 2*2 - 5) / 2) + 1 = floor(127 / 2) + 1 = 63 + 1 = 64
W_out = floor((128 + 2*2 - 5) / 2) + 1 = floor(127 / 2) + 1 = 63 + 1 = 64
```

so output is 64 x 64 x 32

### 5. Caculation of parameters in convolutional layer
### 5.1 formula
Number of parameters = (kernel_size x kernel_size x in_channels + 1) x out_channels
where:
- kernel_size: size of the convolutional kernel
- in_channels: number of input channels
- out_channels: number of output channels
- 1: bias term for each output channel

### 5.2 example
```
k = 5
C_in = 3
C_out = 32
```
```
Number of parameters = (5 x 5 x 3 + 1) x 32 = (75 + 1) x 32 = 76 x 32 = 2432
```
## 6. Paddling and stride
### 6.1 Padding

Padding is the process of adding extra pixels around the border of the input image. It is used to control the spatial size of the output feature map and to preserve the spatial information at the borders of the image.

### 6.2 Stride
Stride is the step size with which the convolutional kernel moves across the input image. It controls how much the kernel shifts at each step and affects the spatial size of the output feature map.
### 6.3 number of parameters is not affected by padding and stride,also H and W

The number of parameters only depends on k C_in C_out and bias,which is given by
```
Number of parameters = (kernel_size x kernel_size x in_channels + 1) x out_channels
```

## 7. Pooling
### 7.1 What is pooling?
Pooling is a downsampling operation that reduces the spatial size of the feature map while retaining the most important information. It is typically used after convolutional layers to reduce the computational cost and to make the model more robust to spatial variations in the input image.
### 7.2 Types of pooling
- Max pooling: takes the maximum value in each pooling window
- Average pooling: takes the average value in each pooling window
### 7.2.1 example
```
input = 64 x 64 x 32
go through a 2 x 2 max pooling layer with stride 2
```
```
H_out = floor((64 - 2) / 2) + 1 = floor(62 / 2) + 1 = 31 + 1 = 32
W_out = floor((64 - 2) / 2) + 1 = floor(62 / 2) + 1 = 31 + 1 = 32
```

### 7.3 Pooling has no parameters to train

## 8.BatchNorm
### 8.1 What is BatchNorm?
BatchNorm is a technique used to normalize the activations of a layer in a neural network. It helps to stabilize and accelerate the training process by reducing the internal covariate shift, which is the change in the distribution of layer inputs during training.

Conv -> BatchNorm -> Relu "CBA"

### 8.2 Why this position?
BatchNorm is typically placed after the convolutional layer and before the activation function (ReLU) because it normalizes the output of the convolutional layer, which helps to improve the stability and convergence of the training process. Placing BatchNorm before the activation function allows it to effectively normalize the activations, which can lead to better performance and faster training.

### 8.3 BatchNorm has parameters to train
- gamma: scale parameter
- beta: shift parameter

number of BN parameters = 2 x out_channels (won't change with kernel size or input channels,and batch size)

## 9. Where is parameters trained in CNN?
| 层                    | 是否有可训练参数 | 参数来源         |
| -------------------- | -------: | ------------ |
| Conv 卷积层             |        有 | 卷积核权重 + bias |
| Fully Connected 全连接层 |        有 | 权重矩阵 + bias  |
| BatchNorm            |        有 | γ、β          |
| Pooling 池化层          |        无 | 固定取最大/平均规则   |

## 10.ResNet and residual connection
### 10.1 Problem of deep network
As the network gets deeper, it becomes harder to train due to the vanishing gradient problem, where the gradients become very small and the model fails to learn effectively.

### 10.2 how to make a residual connection

> output = output of convolutional layers + input

## 11. Transfer learning
Transfer learning is a technique where a model trained on one task is reused as the starting point for a model on a second task. It is particularly useful when the second task has limited data, as it allows the model to leverage the knowledge learned from the first task.

## 12. CNN steps
```
input
-> Conv
-> BatchNorm
-> ReLU
-> Pooling
-> Conv
-> BatchNorm
-> ReLU
-> Pooling
-> flatten
-> Fully Connected
-> softmax
-> output
```
where
```
Conv：提取局部特征
BN：稳定分布，加速训练
ReLU：引入非线性
Pooling：降低空间尺寸，增强鲁棒性
Flatten：展开为一维向量
FC：分类
Softmax：输出概率分布
```

## Shorthand for CNN
1. CNN 适合图像，因为它保留 H×W×C 空间结构，利用局部连接和权重共享减少参数，并增强位置鲁棒性。

2. 卷积核深度 = 输入通道数 C_in。
   卷积核个数 = 输出通道数 C_out。

3. Conv2d(in_channels, out_channels, kernel_size, stride, padding)
   输入 PyTorch 形状通常是 N×C×H×W。

4. 卷积输出尺寸：
   H_out = floor((H_in + 2P - K) / S) + 1
   W_out = floor((W_in + 2P - K) / S) + 1

5. 卷积参数量：
   参数量 = (K×K×C_in + 1) × C_out
   其中 +1 是 bias。

6. padding 改变输出尺寸、保留边缘信息，但不增加参数量。
   stride 改变滑动步长，stride 越大输出越小，但不增加参数量。

7. Pooling 改变 H、W，不改变通道数；Pooling 无可训练参数。

8. BatchNorm 通常每个通道有 γ、β 两个可训练参数：
   BN 参数量 = 2 × 通道数。
   BN 参数不随 batch size 变化。

9. CBA = Conv + BatchNorm + Activation。
   常见顺序：Conv → BN → ReLU。

10. Flatten 会把特征图展平成一维，容易丢失空间结构；
    FC 参数量 = 输入维度 × 输出维度 + 输出维度。

11. ResNet 的残差连接：
    H(x) = F(x) + x。
    作用是让梯度更容易传回浅层，缓解深层网络梯度消失。

12. 小数据集做图像分类：
    优先使用预训练模型，冻结底层，替换分类层，微调高层。