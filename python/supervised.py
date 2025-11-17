from flask import Flask, jsonify, request
import random
import math

app = Flask(
    __name__,
    static_folder="../public",   # serve your HTML/JS/CSS
    static_url_path=""           # so /presenter.html works
)

# ---- In-memory state for the supervised activity ----

STATE = {
    "initialized": False,
    "train": [],        # list of {x, y, label} label in {"above", "below"}
    "test": [],         # list of {x, y}
    "current_index": 0,
    "votes": {}         # point_index -> {"above": int, "below": int}
}


def init_state_if_needed():
    if STATE["initialized"]:
        return

    random.seed(0)

    train = []
    # ~13 points above x=y, ~12 below
    for _ in range(13):
        x = random.uniform(0.1, 0.8)
        y = x + random.uniform(0.15, 0.4)   # above line
        train.append({"x": x, "y": y, "label": "above"})

    for _ in range(12):
        x = random.uniform(0.1, 0.8)
        y = x - random.uniform(0.15, 0.4)   # below line
        train.append({"x": x, "y": y, "label": "below"})

    # 10 test points near the diagonal
    test = []
    for _ in range(10):
        x = random.uniform(0.2, 0.8)
        # Slight jitter around diagonal
        y = x + random.uniform(-0.25, 0.25)
        test.append({"x": x, "y": y})

    STATE["train"] = train
    STATE["test"] = test
    STATE["current_index"] = 0
    STATE["votes"] = {}
    STATE["initialized"] = True


def current_test_point():
    idx = STATE["current_index"]
    if 0 <= idx < len(STATE["test"]):
        return {"index": idx, **STATE["test"][idx]}
    return None


def current_votes():
    idx = STATE["current_index"]
    v = STATE["votes"].get(idx, {"above": 0, "below": 0})
    a = v.get("above", 0)
    b = v.get("below", 0)
    total = a + b
    if total == 0:
        score = 0.0
    else:
        score = (a - b) / total  # -1 (all below) to +1 (all above)
    return {"above": a, "below": b, "score": score}


@app.route("/api/supervised/init", methods=["GET"])
def api_supervised_init():
    init_state_if_needed()
    return jsonify({
        "train": STATE["train"],
        "test_count": len(STATE["test"]),
        "current_test": current_test_point()
    })


@app.route("/api/supervised/state", methods=["GET"])
def api_supervised_state():
    init_state_if_needed()
    return jsonify({
        "train": STATE["train"],
        "test_count": len(STATE["test"]),
        "current_test": current_test_point(),
        "votes": current_votes()
    })


@app.route("/api/supervised/vote", methods=["POST"])
def api_supervised_vote():
    init_state_if_needed()
    data = request.get_json(force=True)
    label = data.get("label")
    if label not in ("above", "below"):
        return jsonify({"error": "label must be 'above' or 'below'"}), 400

    idx = STATE["current_index"]
    if idx not in STATE["votes"]:
        STATE["votes"][idx] = {"above": 0, "below": 0}
    STATE["votes"][idx][label] += 1

    return jsonify({
        "ok": True,
        "current_index": idx,
        "votes": current_votes()
    })


@app.route("/api/supervised/advance", methods=["POST"])
def api_supervised_advance():
    """
    Presenter uses this to move to the next test point.
    Audience will automatically see the new point via polling /state.
    """
    init_state_if_needed()
    if STATE["current_index"] < len(STATE["test"]) - 1:
        STATE["current_index"] += 1
    return jsonify({
        "current_test": current_test_point(),
        "votes": current_votes()
    })


@app.route("/api/supervised/summary", methods=["GET"])
def api_supervised_summary():
    """
    Aggregated summary for presenter.
    Currently just returns current test point + votes + score.
    """
    init_state_if_needed()
    return jsonify({
        "current_test": current_test_point(),
        "votes": current_votes(),
        "test_count": len(STATE["test"])
    })


# Let Flask serve your static files from ../public
# e.g. http://localhost:5000/presenter.html
@app.route("/")
def root_index():
    return app.send_static_file("index.html")


if __name__ == "__main__":
    app.run(debug=True)