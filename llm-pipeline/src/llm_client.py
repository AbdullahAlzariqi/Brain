import os
import json
import time
import logging
from typing import Optional, Dict, Any, List
from src.schemas import DatasetItem, JudgeOutput, ModelOutputRecord, GenParams

logger = logging.getLogger(__name__)

class BaseClient:
    def generate(self, prompt: str, **kwargs) -> str:
        raise NotImplementedError

class JudgeClient(BaseClient):
    def __init__(self, model_name: str = "gpt-4"):
        self.model_name = model_name
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.client = None
        if self.api_key:
            try:
                from openai import OpenAI
                self.client = OpenAI(api_key=self.api_key)
            except ImportError:
                logger.warning("OpenAI library not installed.")

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
            logger.error(f"Error calling Judge: {e}")
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
    def __init__(self, model_name: str = "google/gemma-2b", device: str = "cuda"):
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
                logger.warning(f"Could not load local model {model_name}: {e}. Switching to mock.")
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
    def __init__(self, model_name: str = "gemini-pro"):
        self.model_name = model_name
        self.api_key = os.getenv("GOOGLE_API_KEY")
        self.model = None
        if self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel(model_name)
            except Exception as e:
                logger.warning(f"Error init Gemini: {e}")

    def generate_synthetic_data(self, topic: str, difficulty: str = "medium") -> DatasetItem:
        """
        Generate synthetic training data using the Teacher model.

        Args:
            topic: The topic or domain for the synthetic document
            difficulty: One of "easy", "medium", "hard" to control complexity

        Returns:
            A DatasetItem with synthetic document and constraints
        """
        if not self.model:
            # Return mock data if model not available
            from src.schemas import Constraints
            return DatasetItem(
                id=f"synthetic_{topic}_{int(time.time())}",
                source="arxiv",
                lang="en",
                doc=f"Mock synthetic document about {topic}. This is placeholder content for testing purposes.",
                constraints=Constraints(
                    style="bullets",
                    max_words=120,
                    must_include=["key point"],
                    avoid=["speculation"]
                )
            )

        # Generate synthetic document using Gemini
        prompt = f"""
Generate a realistic technical document about {topic} at {difficulty} difficulty level.
The document should be 400-600 words, similar to an academic abstract or technical report.
Make it challenging to summarize with important details throughout.

Output only the document text, no additional commentary.
"""

        try:
            response = self.model.generate_content(prompt)
            doc_text = response.text

            # Generate appropriate constraints for this document
            constraints_prompt = f"""
Given this technical document, suggest appropriate summarization constraints.

Document:
{doc_text}

Output a JSON object with these fields:
- style: either "bullets" or "paragraph"
- max_words: integer between 80-150
- must_include: list of 2-3 key terms that must appear
- avoid: list of 1-2 things to avoid (e.g., "speculation", "jargon", "acronyms")

Output only valid JSON, no markdown or additional text.
"""

            constraints_response = self.model.generate_content(constraints_prompt)
            constraints_json = json.loads(constraints_response.text)

            from src.schemas import Constraints
            return DatasetItem(
                id=f"synthetic_{topic.replace(' ', '_')}_{int(time.time())}",
                source="arxiv",
                lang="en",
                doc=doc_text,
                constraints=Constraints(**constraints_json)
            )

        except Exception as e:
            logger.error(f"Error generating synthetic data: {e}")
            # Fallback to mock data
            from src.schemas import Constraints
            return DatasetItem(
                id=f"synthetic_{topic}_{int(time.time())}",
                source="arxiv",
                lang="en",
                doc=f"Fallback synthetic document about {topic}. This is placeholder content due to generation error.",
                constraints=Constraints(
                    style="bullets",
                    max_words=120,
                    must_include=["key point"],
                    avoid=["speculation"]
                )
            )
