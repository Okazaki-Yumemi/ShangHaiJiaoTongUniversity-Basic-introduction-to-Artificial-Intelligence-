from pathlib import Path
import time

import cv2
import mediapipe as mp
from mediapipe.tasks import python as mp_tasks
from mediapipe.tasks.python import vision as mp_vision
import numpy as np


BASE_DIR = Path(__file__).resolve().parent if "__file__" in globals() else Path.cwd()
HAND_MODEL_PATH = BASE_DIR / "models" / "hand_landmarker.task"
SEGMENT_MODEL_PATH = BASE_DIR / "models" / "selfie_segmenter.tflite"
BACKGROUND_PATHS = [
    BASE_DIR / "assets" / "p1.png",
    BASE_DIR / "assets" / "p2.jpg",
    BASE_DIR / "assets" / "p3.jpg",
]
OUTPUT_DIR = BASE_DIR / "outputs"
WINDOW_NAME = "Homework - Gesture Recognition and Background Switch"

FINGER_NAMES = ["thumb", "index", "middle", "ring", "pinky"]
TIP_IDS = [4, 8, 12, 16, 20]
PIP_IDS = [2, 6, 10, 14, 18]
MCP_IDS = [1, 5, 9, 13, 17]
HAND_CONNECTIONS = (
    (0, 1), (1, 2), (2, 3), (3, 4),
    (0, 5), (5, 6), (6, 7), (7, 8),
    (5, 9), (9, 10), (10, 11), (11, 12),
    (9, 13), (13, 14), (14, 15), (15, 16),
    (13, 17), (17, 18), (18, 19), (19, 20),
    (0, 17),
)


def check_files():
    missing = [path for path in [HAND_MODEL_PATH, SEGMENT_MODEL_PATH, *BACKGROUND_PATHS] if not path.exists()]
    if missing:
        raise FileNotFoundError("Missing required files:\n" + "\n".join(str(path) for path in missing))


def make_base_options(model_path):
    # MediaPipe's native Windows loader may fail on non-ASCII paths.
    # Passing model bytes avoids that path encoding issue.
    return mp_tasks.BaseOptions(model_asset_buffer=model_path.read_bytes())


def read_image_unicode(path):
    data = np.fromfile(str(path), dtype=np.uint8)
    if data.size == 0:
        return None
    return cv2.imdecode(data, cv2.IMREAD_COLOR)


def normalized_to_pixel(landmark, width, height):
    return np.array([int(landmark.x * width), int(landmark.y * height)], dtype=np.int32)


def count_extended_fingers(hand_landmarks, handedness_label):
    wrist = hand_landmarks[0]
    extended = []

    thumb_tip = hand_landmarks[4]
    thumb_mcp = hand_landmarks[2]
    if handedness_label == "Right":
        thumb_open = thumb_tip.x < thumb_mcp.x - 0.035
    else:
        thumb_open = thumb_tip.x > thumb_mcp.x + 0.035
    extended.append(thumb_open)

    for tip_id, pip_id, mcp_id in zip(TIP_IDS[1:], PIP_IDS[1:], MCP_IDS[1:]):
        tip = hand_landmarks[tip_id]
        pip = hand_landmarks[pip_id]
        mcp = hand_landmarks[mcp_id]
        tip_dist = np.hypot(tip.x - wrist.x, tip.y - wrist.y)
        mcp_dist = np.hypot(mcp.x - wrist.x, mcp.y - wrist.y)
        extended.append(tip.y < pip.y - 0.025 and tip_dist > mcp_dist * 1.12)

    return int(sum(extended)), extended


def draw_hand_status(frame, hand_landmarks, extended, gesture_count, handedness_label):
    height, width = frame.shape[:2]
    points = [normalized_to_pixel(lm, width, height) for lm in hand_landmarks]

    for start, end in HAND_CONNECTIONS:
        cv2.line(frame, tuple(points[start]), tuple(points[end]), (230, 230, 230), 2, cv2.LINE_AA)

    for idx, point in enumerate(points):
        color = (80, 230, 120) if idx in TIP_IDS else (0, 210, 255)
        radius = 8 if idx in TIP_IDS else 5
        cv2.circle(frame, tuple(point), radius, color, -1, cv2.LINE_AA)

    status = f"{handedness_label} hand: {gesture_count}"
    cv2.putText(frame, status, (points[0][0] - 20, max(30, points[0][1] - 25)),
                cv2.FONT_HERSHEY_SIMPLEX, 0.75, (255, 255, 255), 2, cv2.LINE_AA)

    x0, y0 = 24, 154
    for i, (name, is_open) in enumerate(zip(FINGER_NAMES, extended)):
        color = (80, 230, 120) if is_open else (110, 130, 170)
        state = "open" if is_open else "closed"
        cv2.putText(frame, f"{name}: {state}", (x0, y0 + i * 28),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.58, color, 2, cv2.LINE_AA)


def load_backgrounds(size):
    width, height = size
    backgrounds = []
    for path in BACKGROUND_PATHS:
        image = read_image_unicode(path)
        if image is None:
            image = make_gradient_background(width, height)
        backgrounds.append(cv2.resize(image, (width, height), interpolation=cv2.INTER_LINEAR))
    return backgrounds


def make_gradient_background(width, height):
    x = np.linspace(0, 1, width, dtype=np.float32)
    y = np.linspace(0, 1, height, dtype=np.float32)
    xv, yv = np.meshgrid(x, y)
    bg = np.zeros((height, width, 3), dtype=np.uint8)
    bg[..., 0] = (70 + 110 * xv).astype(np.uint8)
    bg[..., 1] = (70 + 120 * yv).astype(np.uint8)
    bg[..., 2] = (180 - 70 * xv + 40 * yv).clip(0, 255).astype(np.uint8)
    return bg


def composite_person(frame, mask, background):
    mask = cv2.GaussianBlur(mask, (15, 15), 0)
    alpha = np.clip(mask, 0.0, 1.0)[..., None]
    return (frame * alpha + background * (1.0 - alpha)).astype(np.uint8)


def draw_panel(frame, gesture_count, background_index, fps, recording):
    overlay = frame.copy()
    cv2.rectangle(overlay, (16, 16), (620, 132), (18, 26, 42), -1)
    cv2.addWeighted(overlay, 0.48, frame, 0.52, 0, frame)
    cv2.putText(frame, "MediaPipe homework: 1-5 gesture recognition",
                (30, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.72, (255, 245, 225), 2, cv2.LINE_AA)
    cv2.putText(frame, f"Gesture: {gesture_count if gesture_count else '-'}    Background: {background_index + 1}    FPS: {fps:.1f}",
                (30, 84), cv2.FONT_HERSHEY_SIMPLEX, 0.66, (210, 230, 245), 2, cv2.LINE_AA)
    rec_text = "REC" if recording else "Use 1/2/3 gestures to switch background, r=record, q=quit"
    rec_color = (40, 40, 255) if recording else (210, 230, 245)
    cv2.putText(frame, rec_text, (30, 118), cv2.FONT_HERSHEY_SIMPLEX, 0.62, rec_color, 2, cv2.LINE_AA)


def main():
    check_files()
    OUTPUT_DIR.mkdir(exist_ok=True)

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        raise RuntimeError("Cannot open camera 0. Check camera permission or device index.")

    hand_options = mp_vision.HandLandmarkerOptions(
        base_options=make_base_options(HAND_MODEL_PATH),
        running_mode=mp_vision.RunningMode.VIDEO,
        num_hands=1,
        min_hand_detection_confidence=0.6,
        min_hand_presence_confidence=0.6,
        min_tracking_confidence=0.6,
    )
    segment_options = mp_vision.ImageSegmenterOptions(
        base_options=make_base_options(SEGMENT_MODEL_PATH),
        running_mode=mp_vision.RunningMode.VIDEO,
        output_confidence_masks=True,
    )

    prev_time = time.time()
    backgrounds = None
    background_index = 0
    last_switch_time = 0.0
    writer = None
    output_video_path = None

    with mp_vision.HandLandmarker.create_from_options(hand_options) as landmarker, \
            mp_vision.ImageSegmenter.create_from_options(segment_options) as segmenter:
        while True:
            ok, frame = cap.read()
            if not ok:
                print("Failed to read a camera frame.")
                break

            frame = cv2.flip(frame, 1)
            height, width = frame.shape[:2]
            if backgrounds is None:
                backgrounds = load_backgrounds((width, height))

            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
            timestamp_ms = int(time.time() * 1000)

            hand_result = landmarker.detect_for_video(mp_image, timestamp_ms)
            seg_result = segmenter.segment_for_video(mp_image, timestamp_ms)

            masks = seg_result.confidence_masks
            raw_mask = masks[-1].numpy_view() if len(masks) > 1 else masks[0].numpy_view()
            person_mask = np.where(raw_mask > 0.45, raw_mask, 0.0)
            output = composite_person(frame, person_mask, backgrounds[background_index])

            gesture_count = 0
            if hand_result.hand_landmarks:
                landmarks = hand_result.hand_landmarks[0]
                raw_label = hand_result.handedness[0][0].category_name
                handedness_label = "Left" if raw_label == "Right" else "Right"
                gesture_count, extended = count_extended_fingers(landmarks, handedness_label)
                draw_hand_status(output, landmarks, extended, gesture_count, handedness_label)

                now = time.time()
                if gesture_count in (1, 2, 3) and now - last_switch_time > 0.8:
                    background_index = gesture_count - 1
                    last_switch_time = now

            current_time = time.time()
            fps = 1.0 / max(current_time - prev_time, 1e-6)
            prev_time = current_time
            draw_panel(output, gesture_count, background_index, fps, writer is not None)

            if writer is not None:
                writer.write(output)

            cv2.imshow(WINDOW_NAME, output)
            key = cv2.waitKey(1) & 0xFF
            if key == ord("r"):
                if writer is None:
                    output_video_path = OUTPUT_DIR / f"homework_demo_{time.strftime('%Y%m%d_%H%M%S')}.mp4"
                    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
                    writer = cv2.VideoWriter(str(output_video_path), fourcc, 20.0, (width, height))
                    print(f"Recording started: {output_video_path}")
                else:
                    writer.release()
                    writer = None
                    print(f"Recording saved: {output_video_path}")
            elif key in (ord("q"), 27):
                break

    if writer is not None:
        writer.release()
        print(f"Recording saved: {output_video_path}")
    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
