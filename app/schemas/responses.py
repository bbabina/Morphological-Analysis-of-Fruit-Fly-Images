from pydantic import BaseModel, Field
from typing import Literal


class Point2D(BaseModel):
    x: float
    y: float
    confidence: float | None = None


class MeasurementOutput(BaseModel):
    length_px: float
    length_mm: float
    pixels_per_mm: float


class MetadataOutput(BaseModel):
    analysis_id: str
    original_filename: str
    saved_filename: str
    content_type: str | None = None
    width: int
    height: int
    timestamp_utc: str
    model_version: str
    task: str = "wing_l3_straight"
    method: str = "2_keypoint_pose"


class AnalyzeResponse(BaseModel):
    status: Literal["success"] = "success"
    metadata: MetadataOutput
    point_8: Point2D
    point_13: Point2D
    measurement: MeasurementOutput
    reviewer_status: Literal["pending", "accepted", "adjusted", "rejected"] = "pending"
    overlay_path: str
    json_path: str


class ReviewRequest(BaseModel):
    point_8: Point2D
    point_13: Point2D
    reviewer: str = Field(default="anonymous")
    decision: Literal["accepted", "adjusted", "rejected"]
    comment: str | None = None


class ReviewResponse(BaseModel):
    status: Literal["success"] = "success"
    analysis_id: str
    reviewer_status: Literal["accepted", "adjusted", "rejected"]
    measurement: MeasurementOutput
    review_path: str


class ErrorResponse(BaseModel):
    status: Literal["error"] = "error"
    message: str
