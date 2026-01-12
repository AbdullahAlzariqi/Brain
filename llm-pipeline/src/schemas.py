from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict, Any

class Constraints(BaseModel):
    style: Optional[str] = "bullets"
    max_words: Optional[int] = 120
    must_include: Optional[List[str]] = []
    avoid: Optional[List[str]] = []

class DatasetItem(BaseModel):
    id: str
    source: Literal["email", "pdf", "web", "note", "arxiv"]
    lang: str = "en"
    doc: str
    constraints: Constraints

class GenParams(BaseModel):
    temperature: float = 0.2
    top_p: float = 0.9
    max_new_tokens: int = 180
    seed: int = 42

class ModelOutputRecord(BaseModel):
    run_id: str
    sample_id: str
    model: str
    checkpoint: str
    gen: GenParams
    prompt: str
    output: str

class JudgeOutput(BaseModel):
    faithfulness: int = Field(..., ge=1, le=5)
    coverage: int = Field(..., ge=1, le=5)
    brevity: int = Field(..., ge=1, le=5)
    clarity: int = Field(..., ge=1, le=5)
    format_ok: bool
    hallucination: bool
    missing_key_points: List[str]
    overall: int = Field(..., ge=1, le=5)
    rationale: str

class TrainParams(BaseModel):
    train_set_version: str
    steps: int
    lr: float
    lora_r: int
    lora_alpha: int
    batch_size: int
    seq_len: int

class DevMetrics(BaseModel):
    overall_mean: float
    overall_std: float
    faithfulness_fail_rate: float
    hallucination_rate: float
    coverage_mean: float
    brevity_mean: float
    format_ok_rate: float

class RunLevelLog(BaseModel):
    run_id: str
    timestamp: str
    base_model: str
    method: str
    train: Optional[TrainParams] = None
    dev_metrics: DevMetrics
    notes: Optional[str] = None
