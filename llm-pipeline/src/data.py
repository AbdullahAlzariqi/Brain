import arxiv
import uuid
import random
from src.schemas import DatasetItem, Constraints

def fetch_arxiv_papers(query: str = "llm", max_results: int = 10) -> list[DatasetItem]:
    """
    Fetches papers from Arxiv and converts them to DatasetItem objects.
    We use the abstract as the 'doc' content for summarization tasks.
    """
    client = arxiv.Client()
    search = arxiv.Search(
        query=query,
        max_results=max_results,
        sort_by=arxiv.SortCriterion.SubmittedDate
    )

    items = []
    for result in client.results(search):
        # Create a unique ID or use the arxiv ID
        doc_id = result.entry_id.split('/')[-1]

        # Randomly assign some constraints for variety
        constraints = Constraints(
            style=random.choice(["bullets", "paragraph"]),
            max_words=random.randint(100, 200),
            must_include=[],
            avoid=[]
        )

        item = DatasetItem(
            id=f"arxiv_{doc_id}",
            source="arxiv",
            lang="en",
            doc=result.summary, # Using abstract as the source document
            constraints=constraints
        )
        items.append(item)

    return items

def save_dataset(items: list[DatasetItem], filepath: str):
    import json
    with open(filepath, 'w') as f:
        json.dump([item.model_dump() for item in items], f, indent=2)

def load_dataset(filepath: str) -> list[DatasetItem]:
    import json
    import os
    if not os.path.exists(filepath):
        return []
    with open(filepath, 'r') as f:
        data = json.load(f)
    return [DatasetItem(**item) for item in data]
