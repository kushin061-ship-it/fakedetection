"""Manual Flipkart-style review verification script.

Sends two sample reviews to the running Fake Review Detection backend (POST /api/predict)
and prints a clean, detailed verification report.
"""

import json
import sys
import httpx

API_URL = "http://localhost:8000/api/predict"

REVIEWS = [
    {
        "id": "Review A (expected: suspicious)",
        "payload": {
            "rating": 5,
            "review_text": (
                "Superb product!!! Must buy!!! Best phone ever, totally value for money, "
                "awesome awesome awesome. Thank you Flipkart, highly recommended for everyone!!!"
            ),
        },
    },
    {
        "id": "Review B (expected: genuine)",
        "payload": {
            "rating": 4,
            "review_text": (
                "Using this phone for about three weeks now. Battery easily lasts a full day "
                "with moderate use, and the display is bright outdoors. Camera is good in daylight "
                "but struggles in low light, and the phone gets slightly warm while gaming. "
                "Delivery was on time. Good for the price, though the charger is slow."
            ),
        },
    },
]


def run_checks():
    print("=" * 80)
    print(" FAKE REVIEW DETECTION - MANUAL FLIPKART-STYLE REVIEWS CHECK")
    print(f" Target Endpoint: {API_URL}")
    print("=" * 80)

    with httpx.Client(timeout=10.0) as client:
        for idx, item in enumerate(REVIEWS, 1):
            review_id = item["id"]
            payload = item["payload"]

            print(f"\n[{idx}] Testing: {review_id}")
            print("-" * 80)
            print(f"Rating      : {payload['rating']} Stars")
            print(f"Review Text : \"{payload['review_text']}\"")
            print(f"Reviewer ID : (omitted)")
            print(f"Date        : (omitted)")
            print("-" * 80)

            try:
                resp = client.post(API_URL, json=payload)
                resp.raise_for_status()
                data = resp.json()
            except httpx.HTTPError as exc:
                print(f"ERROR: Failed to call {API_URL}: {exc}")
                sys.exit(1)

            label = data.get("label", "unknown").upper()
            fake_prob = data.get("fake_probability", 0.0)
            fake_pct = f"{fake_prob * 100:.1f}%"
            low_confidence = data.get("low_confidence", False)
            notes = data.get("notes")
            disclaimer = data.get("disclaimer")
            top_shap = data.get("top_shap_features", [])[:5]

            print("PREDICTION REPORT:")
            print(f"  • Label              : {label}")
            print(f"  • Fake Probability   : {fake_pct} ({fake_prob})")
            print(f"  • Low Confidence     : {low_confidence}")
            print(f"  • Notes              : {notes}")
            print(f"  • Disclaimer         : {disclaimer}")
            print()
            print("  • Top 5 SHAP Features:")
            if not top_shap:
                print("      (No SHAP features returned)")
            else:
                for sf in top_shap:
                    rank = sf.get("rank")
                    name = sf.get("displayName", sf.get("feature", "unknown"))
                    direction = sf.get("direction", "unknown")
                    shap_val = sf.get("shap_value", 0.0)
                    val = sf.get("value", "")
                    impact = sf.get("impact", "")
                    print(
                        f"      {rank}. {name} | Direction: {direction} "
                        f"| SHAP: {shap_val:+.4f} | Value: {val} | Impact: {impact}"
                    )
            print("=" * 80)


if __name__ == "__main__":
    run_checks()
