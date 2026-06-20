# YOLO

# 1.Target Detection
## 1.1 Target Detection tasks

- Classification: Determine the category of the object in the image.
- Localization: Determine the location of the object in the image, usually represented by a bounding box.

# 2.One-stage vs Two-stage Detection

## 2.1 One-stage Detection: YOLO (You Only Look Once)

```
Only one time forward pass to get the final result(classification + localization +confidence)
```

usually used in
- Real-time detection
- Autonomous driving
- Video surveillance
- Robotics
- clinical operation

## 2.2 Two-stage:Faster R-CNN

```
stage 1: generate region proposals
stage 2: classify and refine the proposals
```

- higher accuracy
- slower speed

# 3.YOLO tag structure


## 3.1 Standard YOLO tag structure
```
class x_center y_center w h
```

- x_center = middle x / image width
- y_center = middle y / image height
- w = box width / image width
- h = box height / image height

## 3.2 example
```
img 640x480

left top corner: (60,40)
right bottom corner: (300,280)

w = (300-60) = 240
h = (280-40) = 240

x_center = (60+300)/2 = 180
y_center = (40+280)/2 = 160

x = 180/640 = 0.28125
y = 160/480 = 0.3333
w = 240/640 = 0.375
h = 240/480 = 0.5
```

# 4.Confidence Score

## 4.1 Confidence in YOLO

> Confidence = Pr(object) * IOU(pred, truth)

Confidence is influenced by (Prsistence and overlap of the object in the image) at the same time.

higher IOU means better localization, which leads to higher confidence score.

# 5.Confidence threshold
## 5.1 what is confidence threshold

```
confidence >= threshold reserve the box
confidence < threshold discard the box
```

## 5.2 what will happen when threshold is raised?
- fewer boxes will be reserved
- mistakenly reserved boxes will be discarded
- Precision will increase, but Recall will decrease

## 5.3 what will happen when threshold is lowered?
- more boxes will be reserved
- mistakenly discarded boxes will be reserved
- Precision will decrease, but Recall will increase

# 6.IoU (Intersection over Union)
## 6.1 formula
```
IoU = Area of Overlap / Area of Union
```

# 7.NMS (Non-Maximum Suppression)
## 7.1 what does NMS do?
the model always predicts multiple boxes for the same object, NMS is used to remove redundant boxes and keep only the best one.

## 7.2 standard NMS steps.
1. Sort all the predicted boxes by their confidence score in descending order.
2. Select the box with the highest confidence score and remove it from the list of boxes.
3. Delete all the boxes that have an IoU greater than a certain threshold with the selected box.
4. Repeat steps 2 and 3 until there are no more boxes left in the list.

## 7.3 what will happen when NMS threshold is toooo low?
- delete is too aggressive, many boxes will be deleted, which leads to low recall.
- neighboring but not same object boxes will be deleted, which leads to low precision.
- will lead to some objects not being detected.
- Recall will decrease, Precision will decrease.

## 7.4 what will happen when NMS threshold is toooo high?
- contary to the above, delete is too loose, many boxes will be reserved, which leads to low precision.

