import os
import argparse
from src.data import fetch_arxiv_papers, save_dataset
from src.pipeline import Pipeline
from src.schemas import TrainParams

def main():
    parser = argparse.ArgumentParser(description="LLM Training Loop Pipeline")
    parser.add_argument("--init", action="store_true", help="Initialize dev set")
    parser.add_argument("--steps", type=int, default=5, help="Number of training loops")
    args = parser.parse_args()

    # 1. Setup Data Paths (Relative to where script is run, usually root of project)
    # Ensure we use absolute paths or consistent relative paths
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base_dir, "data")
    logs_dir = os.path.join(base_dir, "logs")
    dev_set_path = os.path.join(data_dir, "dev_set.json")

    os.makedirs(data_dir, exist_ok=True)

    if args.init or not os.path.exists(dev_set_path):
        print("Fetching papers for dev set...")
        # Mocking fetch if arxiv fails in restricted env, but usually should work
        try:
            items = fetch_arxiv_papers(max_results=10)
        except Exception as e:
            print(f"Failed to fetch arxiv: {e}. Creating dummy data.")
            from src.schemas import DatasetItem, Constraints
            items = [DatasetItem(
                id=f"dummy_{i}",
                source="note",
                doc="Dummy content.",
                constraints=Constraints()
            ) for i in range(5)]

        save_dataset(items, dev_set_path)
        print(f"Saved {len(items)} items to {dev_set_path}")

    # 2. Init Pipeline
    pipeline = Pipeline(dev_set_path=dev_set_path, logs_path=logs_dir)

    # 3. Baseline Eval
    print("\n--- Run 0: Baseline ---")
    pipeline.evaluate(run_id="run_0", checkpoint="base", notes="Baseline evaluation")

    # 4. Loop
    for i in range(1, args.steps + 1):
        run_id = f"run_{i}"
        print(f"\n--- Run {i} ---")

        # Check Plateau
        if pipeline.check_plateau():
            print("!!! PLATEAU DETECTED !!!")
            print("Action: Changing data mix or hyperparameters...")
            # Modify params or data here
            lr = 0.0001 # lower LR
            pipeline.refresh_training_data(version=f"v{i}_hard")
        else:
            lr = 0.0002
            pipeline.refresh_training_data(version=f"v{i}")

        # Train
        params = TrainParams(
            train_set_version=f"v{i}",
            steps=100,
            lr=lr,
            lora_r=16,
            lora_alpha=32,
            batch_size=4,
            seq_len=1024
        )
        ckpt = pipeline.train_step(run_id, params)

        # Eval
        log = pipeline.evaluate(run_id=run_id, checkpoint=ckpt, train_params=params)
        print(f"Run {i} Result: Overall={log.dev_metrics.overall_mean:.2f}")

if __name__ == "__main__":
    main()
