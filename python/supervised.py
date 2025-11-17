# activities/supervised.py

import sys
import json
from collections import defaultdict

def main():
    data = json.load(sys.stdin)
    points = data["points"]          # list of {id, x, y}
    responses = data["responses"]    # {userId: {pointId: label}}

    # Aggregate counts per point
    counts_by_point = defaultdict(lambda: defaultdict(int))
    for user_id, labels in responses.items():
        for point_id, label in labels.items():
            counts_by_point[str(point_id)][label] += 1

    summary_points = []
    for p in points:
        pid = str(p["id"])
        label_counts = counts_by_point.get(pid, {})
        total = sum(label_counts.values())

        if total > 0:
            majority_label = max(label_counts, key=label_counts.get)
            num_labels_used = sum(1 for c in label_counts.values() if c > 0)
            disagreement = num_labels_used > 1
        else:
            majority_label = None
            disagreement = False

        summary_points.append({
            "id": p["id"],
            "x": p["x"],
            "y": p["y"],
            "counts": label_counts,
            "total": total,
            "majority": majority_label,
            "disagreement": disagreement
        })

    out = {"points": summary_points}
    json.dump(out, sys.stdout)

if __name__ == "__main__":
    main()