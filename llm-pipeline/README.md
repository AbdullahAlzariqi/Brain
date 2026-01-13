# LLM Training Pipeline

An iterative self-improvement pipeline for training and evaluating Large Language Models (LLMs) using synthetic data generation and automated quality assessment.

## Overview

This pipeline implements an automated training loop with three key components:

- **Student Model**: A small LLM being trained on document summarization tasks
- **Teacher Model**: Generates synthetic training data (powered by Google Gemini)
- **Judge Model**: Evaluates output quality across multiple dimensions (powered by OpenAI GPT)

The pipeline includes:
- Automatic plateau detection
- Adaptive data refreshing when performance plateaus
- Comprehensive evaluation metrics
- Structured logging and tracking

## Features

### Evaluation Metrics
- **Overall Score**: Aggregate quality score
- **Faithfulness**: How well the summary adheres to source content
- **Hallucination Rate**: Frequency of fabricated information
- **Coverage**: Completeness of key information
- **Brevity**: Conciseness of outputs
- **Format Compliance**: Adherence to output format requirements

### Plateau Detection
- Monitors improvement over a configurable window
- Triggers data refresh when learning stagnates
- Configurable minimum improvement threshold

### Data Management
- ArXiv paper dataset integration
- Synthetic data generation via Teacher model
- Structured dataset format with constraints

## Getting Started

### Prerequisites

- Python 3.12 or higher
- [uv](https://github.com/astral-sh/uv) package manager

### Installation

1. Install dependencies using uv:
```bash
cd llm-pipeline
uv sync
```

2. Set up environment variables:
```bash
export OPENAI_API_KEY="your-openai-api-key"
export GOOGLE_API_KEY="your-google-api-key"
```

Or create a `.env` file in the `llm-pipeline` directory.

### Project Structure

```
llm-pipeline/
├── src/
│   ├── pipeline.py          # Main training pipeline orchestration
│   ├── llm_client.py        # LLM client wrappers (Student, Teacher, Judge)
│   ├── data.py              # Dataset loading and management
│   ├── schemas.py           # Pydantic data models
│   └── unsloth/             # Unsloth integration (WIP)
├── data/
│   └── dev_set.json         # Development evaluation dataset
├── logs/                    # Training run logs and results
├── tests/
│   └── test_pipeline.py     # Unit tests
├── pyproject.toml           # Project dependencies
└── README.md                # This file
```

## Usage

### Running an Evaluation

```python
from src.pipeline import Pipeline
from src.schemas import GenParams

# Initialize pipeline
pipeline = Pipeline(
    dev_set_path="data/dev_set.json",
    logs_path="logs"
)

# Run evaluation
log = pipeline.evaluate(
    run_id="eval_001",
    checkpoint="base",
    notes="Baseline evaluation"
)

print(f"Overall Score: {log.dev_metrics.overall_mean:.3f}")
print(f"Faithfulness Fail Rate: {log.dev_metrics.faithfulness_fail_rate:.3f}")
```

### Training Loop

```python
from src.schemas import TrainParams

# Configure training parameters
train_params = TrainParams(
    epochs=3,
    learning_rate=2e-5,
    batch_size=4,
    dataset_version="v1"
)

# Train and evaluate
checkpoint = pipeline.train_step("run_001", train_params)
log = pipeline.evaluate(
    run_id="run_001",
    checkpoint=checkpoint,
    train_params=train_params
)

# Check for plateau
if pipeline.check_plateau(window=3, min_delta=0.05):
    print("Performance plateau detected. Refreshing data...")
    pipeline.refresh_training_data("v2")
```

### Running Tests

```bash
uv run pytest tests/
```

## Configuration

### Training Parameters

```python
TrainParams(
    epochs=3,              # Number of training epochs
    learning_rate=2e-5,    # Learning rate
    batch_size=4,          # Training batch size
    dataset_version="v1"   # Dataset version identifier
)
```

### Generation Parameters

```python
GenParams(
    temperature=0.7,       # Sampling temperature
    max_tokens=150,        # Maximum output length
    top_p=0.9             # Nucleus sampling parameter
)
```

## API Keys and Models

The pipeline uses the following services:

- **OpenAI API**: For the Judge model (GPT-4 or GPT-3.5-turbo)
- **Google Generative AI**: For the Teacher model (Gemini)
- **Local Student Model**: Loaded via Transformers/Unsloth

Make sure to set the appropriate API keys in your environment.

## Development Status

### Implemented
- ✅ Pipeline orchestration
- ✅ Evaluation metrics computation
- ✅ Plateau detection
- ✅ Structured logging
- ✅ Dev set loading
- ✅ Pydantic schemas for type safety

### In Progress / TODO
- ⚠️ Teacher synthetic data generation (method stub exists)
- ⚠️ Actual training loop (currently mocked)
- ⚠️ Unsloth integration (empty module)
- ⚠️ Replace print statements with proper logging
- ⚠️ Expand test coverage
- ⚠️ Add configuration file support
- ⚠️ Implement persistent model checkpointing

## Contributing

1. Follow PEP 8 style guidelines
2. Add type hints to all functions
3. Write tests for new features
4. Use Pydantic models for data validation
5. Update this README for significant changes

## License

MIT

## References

- [Unsloth](https://github.com/unslothai/unsloth) - Fast LLM fine-tuning
- [TipTap](https://tiptap.dev/) - Rich text editor framework
- [ArXiv API](https://pypi.org/project/arxiv/) - Academic paper dataset
