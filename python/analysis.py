# python/analysis.py
import sys, json
data = json.load(sys.stdin)

# data looks like: [{"answer": "A"}, {"answer": "B"}, ...]
counts = {}
for r in data:
    ans = r.get("answer", "blank")
    counts[ans] = counts.get(ans, 0) + 1

print("Total responses:", len(data))
print("Counts:")
for k, v in counts.items():
    print(f"  {k}: {v}")