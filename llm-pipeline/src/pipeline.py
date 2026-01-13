import os
import json
import time
import logging
import pandas as pd
from typing import List, Optional
from src.schemas import (
    DatasetItem, ModelOutputRecord, JudgeOutput,
    RunLevelLog, DevMetrics, GenParams, TrainParams
)
from src.llm_client import StudentClient, JudgeClient, TeacherClient

logger = logging.getLogger(__name__)

class Pipeline:
    def __init__(self, dev_set_path: str = "data/dev_set.json", logs_path: str = "logs"):
        self.dev_set_path = dev_set_path
        self.logs_path = logs_path
        os.makedirs(logs_path, exist_ok=True)

        self.judge = JudgeClient()
        self.teacher = TeacherClient()
        self.student = StudentClient()

        self.run_history: List[RunLevelLog] = []

    def load_dev_set(self) -> List[DatasetItem]:
        from src.data import load_dataset
        return load_dataset(self.dev_set_path)

    def evaluate(self, run_id: str, checkpoint: str, notes: str = "", train_params: Optional[TrainParams] = None) -> Optional[RunLevelLog]:
        logger.info(f"Starting evaluation for {run_id}...")
        dev_set = self.load_dev_set()
        if not dev_set:
            logger.warning("Dev set empty or not found.")
            # Return None if dev set is empty
            return None

        records = []
        scores = []

        for item in dev_set:
            # 1. Generate
            params = GenParams() # Default params
            record = self.student.generate(item, params, run_id, checkpoint)
            records.append(record)

            # 2. Judge
            score = self.judge.judge(item.doc, record.output, item.constraints.model_dump())
            scores.append(score)

        # 3. Aggregate Metrics
        metrics = self._compute_metrics(scores)

        # 4. Log
        log_entry = RunLevelLog(
            run_id=run_id,
            timestamp=pd.Timestamp.now().isoformat(),
            base_model=self.student.model_name,
            method="eval_only" if checkpoint == "base" else "finetuned",
            train=train_params, # Correctly pass training params
            dev_metrics=metrics,
            notes=notes
        )

        self._save_run(log_entry, records, scores)
        self.run_history.append(log_entry)

        return log_entry

    def _compute_metrics(self, scores: List[JudgeOutput]) -> DevMetrics:
        df = pd.DataFrame([s.model_dump() for s in scores])
        return DevMetrics(
            overall_mean=float(df['overall'].mean()),
            overall_std=float(df['overall'].std()),
            faithfulness_fail_rate=float((df['faithfulness'] < 3).mean()),
            hallucination_rate=float(df['hallucination'].mean()),
            coverage_mean=float(df['coverage'].mean()),
            brevity_mean=float(df['brevity'].mean()),
            format_ok_rate=float(df['format_ok'].mean())
        )

    def _save_run(self, log: RunLevelLog, records: List[ModelOutputRecord], scores: List[JudgeOutput]):
        run_dir = os.path.join(self.logs_path, log.run_id)
        os.makedirs(run_dir, exist_ok=True)

        with open(os.path.join(run_dir, "run_log.json"), "w") as f:
            f.write(log.model_dump_json(indent=2))

        detailed = []
        for r, s in zip(records, scores):
            d = r.model_dump()
            d['judge_score'] = s.model_dump()
            detailed.append(d)

        with open(os.path.join(run_dir, "details.json"), "w") as f:
            json.dump(detailed, f, indent=2)

    def check_plateau(self, window: int = 3, min_delta: float = 0.05) -> bool:
        if len(self.run_history) < window:
            return False

        recent = self.run_history[-window:]
        overalls = [r.dev_metrics.overall_mean for r in recent]

        if len(overalls) < 2: return False

        # Check if improvement is less than min_delta over the window
        improvement = overalls[-1] - overalls[0]
        if improvement < min_delta:
            return True

        return False

    def refresh_training_data(self, version: str) -> None:
        """
        Uses the Teacher model to generate new training data or refresh the mix.
        For this implementation, we will mock the expansion of the dataset.
        """
        logger.info(f"Refreshing training data for {version} using Teacher...")
        # In a real scenario:
        # new_items = self.teacher.generate_synthetic_data(topic="harder_cases")
        # save_dataset(new_items, f"data/train_{version}.json")
        time.sleep(0.5)

    def train_step(self, run_id: str, train_params: TrainParams) -> str:
        logger.info(f"Mocking training for {run_id}...")
        # In a real scenario, this would call Unsloth training script
        # subprocess.run(["python", "src/train_unsloth.py", ...])
        time.sleep(1) # Simulate work

        # Update student model to point to new checkpoint (mock)
        self.student.checkpoint = f"checkpoint_{run_id}"

        return f"checkpoint_{run_id}"
