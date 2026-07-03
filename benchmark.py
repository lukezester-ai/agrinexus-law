# benchmark.py
"""Simple benchmark runner for Bulgarian agri‑legal QA.
Usage:
    python benchmark.py --train data/ALQABG/train.jsonl \
                        --test data/ALTestBG.jsonl \
                        --model my-bulgarian-legal-llm
"""
import argparse, json, random, sys
from pathlib import Path

def load_jsonl(path: Path):
    with path.open('r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:
                yield json.loads(line)

def dummy_model_answer(question: str) -> str:
    # Placeholder: echo the question (real model should generate answer)
    return "[generated answer for: " + question[:30] + "...]"

def exact_match(pred: str, gold: str) -> int:
    return int(pred.strip().lower() == gold.strip().lower())

def compute_metrics(preds, golds):
    em = sum(exact_match(p, g) for p, g in zip(preds, golds)) / len(golds)
    # dummy F1 using random for illustration
    f1 = random.uniform(0.5, 1.0)
    return {"exact_match": em, "f1": f1}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--train', required=True, help='Path to training JSONL')
    parser.add_argument('--test', required=True, help='Path to test JSONL')
    parser.add_argument('--model', required=True, help='Model identifier')
    args = parser.parse_args()

    test_path = Path(args.test)
    if not test_path.is_file():
        sys.exit(f"Test file not found: {test_path}")

    print(f"Running benchmark with model: {args.model}")
    preds = []
    golds = []
    for entry in load_jsonl(test_path):
        q = entry.get('question', '')
        gold = entry.get('answer', '')
        pred = dummy_model_answer(q)
        preds.append(pred)
        golds.append(gold)
    metrics = compute_metrics(preds, golds)
    print("Metrics:")
    for k, v in metrics.items():
        print(f"  {k}: {v:.4f}")

if __name__ == "__main__":
    main()
