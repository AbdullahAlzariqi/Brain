import os
import json
import time
from typing import Optional, Dict, Any, List
from src.schemas import DatasetItem, JudgeOutput, ModelOutputRecord, GenParams

class BaseClient:
    def generate(self, prompt: str, **kwargs) -> str:
        raise NotImplementedError

class JudgeClient(BaseClient):
    def __init__(self, model_name: str = "gpt-5.2"):
        self.model_name = model_name
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.client = None
        if self.api_key:
            try:
                from openai import OpenAI
                self.client = OpenAI(api_key=self.api_key)
            except ImportError:
                print("OpenAI library not installed.")

    def judge(self, doc: str, output: str, constraints: Dict) -> JudgeOutput:
        prompt = self._construct_judge_prompt(doc, output, constraints)

        if not self.client:
            # Mock response
            return JudgeOutput(
                faithfulness=4,
                coverage=4,
                brevity=5,
                clarity=5,
                format_ok=True,
                hallucination=False,
                missing_key_points=[],
                overall=4,
                rationale="Mock rationale: Good summary."
            )

        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0
            )
            content = response.choices[0].message.content
            return JudgeOutput(**json.loads(content))
        except Exception as e:
            print(f"Error calling Judge: {e}")
            # Return a fallback or raise
            raise e

    def _construct_judge_prompt(self, doc: str, output: str, constraints: Dict) -> str:
        return f"""
You are an expert judge evaluating a summary.
Source Document:
{doc}

Constraints:
{json.dumps(constraints, indent=2)}

Model Output:
{output}

Evaluate the output based on the following rubric:
1. Faithfulness (1-5): No hallucinations, strictly supported by doc.
2. Coverage (1-5): Includes all key points.
3. Brevity (1-5): Concise, follows length constraints.
4. Clarity (1-5): Easy to understand.
5. Format (bool): Follows style (bullets/para) and other constraints.

Output strict JSON only matching this schema:
{{
  "faithfulness": int,
  "coverage": int,
  "brevity": int,
  "clarity": int,
  "format_ok": bool,
  "hallucination": bool,
  "missing_key_points": [str],
  "overall": int,
  "rationale": str
}}
"""

class StudentClient(BaseClient):
    def __init__(self, model_name: str = "gemma-3-300m", device: str = "cuda"):
        self.model_name = model_name
        self.model = None
        self.tokenizer = None
        self.device = device
        self.is_mock = False

        # Try to load model if possible and not in CI/Mock environment
        # For this exercise, we default to Mock if dependencies fail or env var set
        if os.getenv("MOCK_STUDENT", "true").lower() == "true":
            self.is_mock = True
        else:
            try:
                from transformers import AutoModelForCausalLM, AutoTokenizer
                import torch
                self.tokenizer = AutoTokenizer.from_pretrained(model_name)
                self.model = AutoModelForCausalLM.from_pretrained(
                    model_name,
                    torch_dtype=torch.float16,
                    device_map="auto"
                )
            except Exception as e:
                print(f"Could not load local model {model_name}: {e}. Switching to mock.")
                self.is_mock = True

    def generate(self, item: DatasetItem, params: GenParams, run_id: str, checkpoint: str) -> ModelOutputRecord:
        prompt = self._construct_prompt(item)

        if self.is_mock:
            output_text = f"• Mock summary for {item.id}\n• Content based on: {item.doc[:50]}..."
        else:
            # Real generation logic
            inputs = self.tokenizer(prompt, return_tensors="pt").to(self.model.device)
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=params.max_new_tokens,
                temperature=params.temperature,
                top_p=params.top_p,
                do_sample=True
            )
            output_text = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            # simplistic stripping of prompt if needed
            if output_text.startswith(prompt):
                output_text = output_text[len(prompt):]

        return ModelOutputRecord(
            run_id=run_id,
            sample_id=item.id,
            model=self.model_name,
            checkpoint=checkpoint,
            gen=params,
            prompt=prompt,
            output=output_text
        )

    def _construct_prompt(self, item: DatasetItem) -> str:
        return f"""
Summarize the following document.
Constraints:
- Style: {item.constraints.style}
- Max words: {item.constraints.max_words}
- Must include: {', '.join(item.constraints.must_include)}
- Avoid: {', '.join(item.constraints.avoid)}

Document:
{item.doc}

Summary:
"""

class TeacherClient(BaseClient):
    def __init__(self, model_name: str = "gemini-3-pro"):
        self.model_name = model_name
        self.api_key = os.getenv("GOOGLE_API_KEY")
        self.model = None
        if self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel(model_name)
            except Exception as e:
                print(f"Error init Gemini: {e}")

    def generate_synthetic_data(self, topic: str) -> DatasetItem:
        # Implementation for creating new data
        pass
