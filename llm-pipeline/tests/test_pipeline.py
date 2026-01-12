import unittest
from src.schemas import DatasetItem, Constraints, JudgeOutput
from src.pipeline import Pipeline
from src.llm_client import StudentClient, JudgeClient

class TestPipeline(unittest.TestCase):
    def test_schemas(self):
        c = Constraints(style="bullets", max_words=100)
        item = DatasetItem(id="1", source="note", doc="text", constraints=c)
        self.assertEqual(item.id, "1")

    def test_pipeline_plateau(self):
        p = Pipeline(logs_path="llm-pipeline/logs")
        # Mock history
        from src.schemas import RunLevelLog, DevMetrics
        import pandas as pd

        def make_log(score, rid):
             return RunLevelLog(
                run_id=rid,
                timestamp="2026-01-01",
                base_model="test",
                method="test",
                dev_metrics=DevMetrics(
                    overall_mean=score, overall_std=0, faithfulness_fail_rate=0,
                    hallucination_rate=0, coverage_mean=0, brevity_mean=0, format_ok_rate=1
                )
             )

        # Increasing scores - no plateau
        p.run_history = [make_log(4.0, "r1"), make_log(4.1, "r2"), make_log(4.2, "r3")]
        self.assertFalse(p.check_plateau())

        # Stagnant scores - plateau
        p.run_history = [make_log(4.0, "r1"), make_log(4.01, "r2"), make_log(4.02, "r3")]
        self.assertTrue(p.check_plateau())

if __name__ == '__main__':
    unittest.main()
