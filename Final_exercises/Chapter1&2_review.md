# 这个地方是我做了第一章节练习题之后总结的错题

## 1.浮点数精度 `0.1 + 0.2 != 0.3`

Python的float是二进制浮点数，很多十进制小鼠无法被二进制精确表示
```py
a = 0.1 + 0.2
b = 0.3
print(a == b)  # False
```

because
```py
a = 0.1 + 0.2 = 0.30000000000000004
b = 0.3
```

## 2.真假值和短路逻辑
```py
# false
False
None
0
0.0
""
[]
()
{}
set()
```

**or的规则**

A or B, 如果A为真，则返回A，否则返回B
返回的是对象本身

**and的规则**
A and B, 如果A为假，则返回A，否则返回B

## 3.dict.get()
```py
d.get(key, default)
```
如果key存在，则返回对应的value，否则返回default值，如果不传default，则返回None

## 4.字符串不可变
```py
s = "hello"
s[0] = "H"  # TypeError: 'str' object does not support item assignment
```

## 5.切片左闭右开
```py
text = "人工智能基础"
sub = text[1:4]  # "工智能"
result = sub + text[-1]  # "工智能础"
```

## 6.列表别名、原地修改、重新绑定
```py
a = [1, 2, 3]
b = a

a.extend([4, 5])  # 原地修改
a = a + [6] # 创建一个新列表，让a指向新列表，b仍然指向原来的列表

print(b)
```

## 7.元组不可变，但是里面的元素可以变
略

## 8.函数参数
略

## 9. *args
略

## 10. == 和 is 的区别
```py
class Patient:
    def __init__(self, name):
        self.name = name

p1 = Patient("Alice")
p2 = Patient("Alice")
p3 = p1

print(p1 == p2 , p1 is p2 , p1 is p3)  # True False True
```

默认情况下，没有定义 __eq__ 的话，那么 == 仍然按照对象身份比较

## 11.类属性
所有实例共享

实例可以访问类属性

Jupyter Notebook 单元格：
```python
最后一行表达式会自动显示

普通 Python 脚本：

必须 print 才显示
```
