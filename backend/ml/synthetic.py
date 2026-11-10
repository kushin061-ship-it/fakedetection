"""Synthetic dataset generator for Fake Review Detection.

Generates 20,000 realistic e-commerce reviews with realistic textual,
behavioral, and temporal fraud indicators and controlled noise/overlap.
"""

import random
import csv
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, List, Dict, Any

from ml.config import RAW_DATA_FILE, RANDOM_STATE

# Set deterministic seed
random.seed(RANDOM_STATE)

# Authentic review templates (nuanced, balanced, experiential)
GENUINE_TEMPLATES = [
    "I have been using this {product} for about {time} now. The {feature} works as expected, although {drawback}. Overall it offers solid value for the price.",
    "Purchased this {product} after researching several alternatives. Build quality is {quality_adj}. Setup took around {minutes} minutes and the companion manual was clear.",
    "Decent performance for everyday use. The {feature} is notably responsive. However, {minor_issue}. Still, I would recommend it to friends.",
    "Works well right out of the box. Arrived securely packaged. Color and finish closely match the listing photos. Happy with this purchase.",
    "A solid 4-star product. Does everything advertised without hassle. Sound isolation could be slightly improved, but battery longevity easily covers a full workday.",
    "Good quality construction and comfortable ergonomics. Used it daily for commute and office tasks. No noticeable wear after {time}.",
    "Met my realistic expectations. Not quite premium luxury grade, but considering the discount it delivers dependable utility.",
    "The package arrived on schedule. Initial pairing was straightforward on 2.4GHz Wi-Fi. Controls feel intuitive once you spend an hour adjusting settings.",
    "Balanced critique: the main chassis is sturdy, buttons have good tactile click, but the included cable is rather short. You may need an extension.",
    "Reliable product for household chores. Cleaning is simple and it doesn't take up excessive counter space. 4 out of 5 stars.",
]

# Deceptive review templates (hyperbolic praise, spam templates, or aggressive competitor smear)
FAKE_TEMPLATES = [
    "BEST {product} EVER IN HUMAN HISTORY!! 10/10 MUST BUY NOW!! Completely transformed my life, absolute perfection!",
    "DO NOT BUY THIS TRASH!! Stopped working after literally two days and customer support refused to refund!! TOTAL SCAM!!",
    "Works great. Exactly as described. Fast shipping. Five stars!!",
    "Horrible horrible horrible!! Broke right out of the box, plastic snapped instantly! DO NOT WASTE YOUR CASH!!",
    "Love it!! Buying 5 more for my entire family tomorrow! Greatest seller ever!!",
    "SCAM ALERT! The seller sent the wrong model and won't respond to messages! Complete garbage quality!",
    "Just wow! Exceeded all my expectations! Highly recommend to everyone in the world!! 5 stars!",
    "Absolute trash product. Broke immediately upon first plug in. Zero customer assistance.",
    "Five stars! Perfect gift for my brother's birthday. Fast delivery!",
    "Item exactly as described 5 stars fast shipping highly recommended seller!",
    "Amazing tactile feel marvelous sound top seller top seller fast delivery buy now!!",
    "GARBAGE SCAM!! Burned out immediately and smelled toxic! Total scam seller!",
]

# Stealthy fake reviews (engineered balanced deception that mimics authentic reviews)
STEALTH_FAKE_TEMPLATES = [
    "Compared to my older Sony headphones, the soundstage on this {product} is slightly narrower, but the battery life easily lasted me 30 hours during my commute.",
    "Was a bit hesitant due to the mixed reviews, but after testing this {product} for morning routines, it handled everything without overheating.",
    "Initial setup took two attempts to pair over Bluetooth, but since then connectivity has been seamless. Schedules run reliably.",
    "The keyboard layout took a day or two to get used to, but the tactile switches feel surprisingly crisp. Comes with extra keycaps.",
]

PRODUCTS = [
    ("UltraBass ANC Wireless Pro", "Audio"),
    ("Smart Health Watch V4", "Wearables"),
    ("Ergonomic Mesh Chair Elite", "Office"),
    ("4K OLED Ultra Gaming Monitor", "Displays"),
    ("HydroGlow Smart Water Bottle", "Fitness"),
    ("Mechanical Keyboard 75% RGB", "Peripherals"),
    ("Cordless Multi-Cyclonic Vacuum", "Home"),
    ("AirPure HEPA Room Purifier", "Home"),
    ("Sonic Clean Electric Toothbrush", "Personal Care"),
    ("Dual-Zone Air Fryer 8Qt", "Kitchen"),
    ("PowerPulse Portable Charger", "Electronics"),
    ("AromaMist Ultrasonic Diffuser", "Wellness"),
]

TIME_PHRASES = ["three weeks", "two months", "a couple of days", "six weeks", "several days"]
FEATURE_PHRASES = ["battery life", "noise cancellation", "display brightness", "tactile response", "suction power"]
DRAWBACK_PHRASES = ["the manual could be more detailed", "the cord is slightly stiff", "the status LED is bright at night", "shipping took an extra day"]
QUALITY_ADJS = ["sturdy and durable", "clean and minimal", "satisfactory for the price point", "well-assembled"]


def generate_synthetic_dataset(
    num_rows: int = 20000,
    fake_ratio: float = 0.18,
    output_path: Optional[Path] = None,
) -> Path:
    """Generate a synthetic CSV dataset with realistic fraud characteristics."""
    target_path = output_path or RAW_DATA_FILE
    target_path.parent.mkdir(parents=True, exist_ok=True)

    random.seed(RANDOM_STATE)
    num_fake = int(num_rows * fake_ratio)
    num_genuine = num_rows - num_fake

    # Define 24-month span: 2024-11-01 to 2026-10-31
    start_date = datetime(2024, 11, 1)
    end_date = datetime(2026, 10, 31)
    total_days = (end_date - start_date).days

    # 3 Pre-designated burst surge windows (matching frontend eda.js):
    # Burst 1: 2025-06 (Summer Promo Burst)
    # Burst 2: 2026-01 (Post-Holiday Attack)
    # Burst 3: 2026-08 (Launch Syndicate Burst)
    burst_windows = [
        (datetime(2025, 6, 5), datetime(2025, 6, 25)),
        (datetime(2026, 1, 8), datetime(2026, 1, 28)),
        (datetime(2026, 8, 3), datetime(2026, 8, 24)),
    ]

    # Generate pool of genuine reviewers (long tail: some active, many casual)
    genuine_reviewers = [f"USR-GEN-{1000 + i}" for i in range(12000)]
    # Generate pool of suspicious / syndicate reviewers
    syndicate_reviewers = [f"REV-USR-{str(i).zfill(4)}" for i in range(1, 150)]
    throwaway_reviewers = [f"USR-BOT-{20000 + i}" for i in range(4000)]

    records: List[Dict[str, Any]] = []

    # ---------------------------------------------------------
    # 1. Generate Genuine Reviews (82% of corpus)
    # ---------------------------------------------------------
    for i in range(num_genuine):
        prod_name, _ = random.choice(PRODUCTS)
        reviewer = random.choice(genuine_reviewers)

        # Rating distribution: Organic distribution (natural spread skewed positive)
        r = random.random()
        if r < 0.08:
            rating = 1
        elif r < 0.18:
            rating = 2
        elif r < 0.35:
            rating = 3
        elif r < 0.67:
            rating = 4
        else:
            rating = 5

        # Timestamp: Organic uniform distribution across the 24 months
        rand_days = random.randint(0, total_days)
        review_date = start_date + timedelta(days=rand_days)

        # Build realistic text
        tmpl = random.choice(GENUINE_TEMPLATES)
        text = tmpl.format(
            product=prod_name,
            time=random.choice(TIME_PHRASES),
            feature=random.choice(FEATURE_PHRASES),
            drawback=random.choice(DRAWBACK_PHRASES),
            quality_adj=random.choice(QUALITY_ADJS),
            minutes=random.randint(10, 45),
            minor_issue=random.choice(DRAWBACK_PHRASES),
        )

        # Add natural variation in sentence length
        if random.random() < 0.30:
            extra_comment = random.choice([
                " Delivery was prompt and intact.",
                " Will update if anything changes after 6 months.",
                " Customer support answered my warranty question quickly.",
                " Hope this helps someone on the fence.",
            ])
            text += extra_comment

        # Add realistic noise: 12% short positive, 8% angry 1-star genuine review
        r_noise = random.random()
        if r_noise < 0.12:
            text = random.choice([
                "Really happy with this purchase! Works great and fast shipping.",
                "Love it! Arrived on time and matches description.",
                "Five stars. Solid item for the price point.",
                "Great quality and easy to set up. Highly recommend to anyone.",
            ])
            rating = 5
        elif r_noise < 0.20:
            text = random.choice([
                "Stopped working after three weeks of light use. Disappointed.",
                "The plastic housing feels flimsy and broke during assembly. Not recommended.",
                "Customer support took four days to reply and refused to replace the missing piece.",
                "Overheats quickly. Will be returning this week.",
            ])
            rating = 1

        # 6% subjective human label ambiguity (annotation noise)
        actual_label = 1 if random.random() < 0.06 else 0

        records.append({
            "review_id": f"REV-ROW-{len(records) + 1}",
            "review_text": text,
            "rating": rating,
            "reviewer_id": reviewer,
            "product_id": f"PRD-{hash(prod_name) % 9000 + 1000}",
            "date": review_date.strftime("%Y-%m-%d"),
            "label": actual_label,
        })

    # ---------------------------------------------------------
    # 2. Generate Fake Reviews (18% of corpus)
    # ---------------------------------------------------------
    for i in range(num_fake):
        prod_name, _ = random.choice(PRODUCTS)

        # Reviewer selection: 60% from repeat syndicate reviewers, 40% from 1-time throwaway bots
        if random.random() < 0.60:
            reviewer = random.choice(syndicate_reviewers)
        else:
            reviewer = random.choice(throwaway_reviewers)

        # Extreme bimodal rating: 52% 5-star, 22% 1-star, 26% stealth 2-4 stars
        r = random.random()
        if r < 0.52:
            rating = 5
        elif r < 0.74:
            rating = 1
        elif r < 0.88:
            rating = 4
        else:
            rating = random.choice([2, 3])

        # Temporal Bursts: 65% of fake reviews concentrate in the 3 designated burst periods
        if random.random() < 0.65:
            window_start, window_end = random.choice(burst_windows)
            window_days = (window_end - window_start).days
            review_date = window_start + timedelta(days=random.randint(0, window_days))
        else:
            rand_days = random.randint(0, total_days)
            review_date = start_date + timedelta(days=rand_days)

        # Text: 65% hyperbolic/boilerplate, 35% stealthy balanced imitation
        if random.random() < 0.65:
            tmpl = random.choice(FAKE_TEMPLATES)
            text = tmpl.format(product=prod_name)
        else:
            tmpl = random.choice(STEALTH_FAKE_TEMPLATES)
            text = tmpl.format(product=prod_name)

        # Exclamation marks & caps styling
        if rating == 5 and random.random() < 0.35:
            text += " MUST BUY NOW!!!"
        elif rating == 1 and random.random() < 0.35:
            text += " REFUND REQUESTED IMMEDIATELY!!!"

        # 6% subjective human label ambiguity (annotation noise)
        actual_label = 0 if random.random() < 0.06 else 1

        records.append({
            "review_id": f"REV-ROW-{len(records) + 1}",
            "review_text": text,
            "rating": rating,
            "reviewer_id": reviewer,
            "product_id": f"PRD-{hash(prod_name) % 9000 + 1000}",
            "date": review_date.strftime("%Y-%m-%d"),
            "label": actual_label,
        })

    # Shuffle all records deterministically
    random.shuffle(records)

    # Re-index review_ids chronologically / orderly
    fieldnames = ["review_text", "rating", "reviewer_id", "product_id", "date", "label"]

    with open(target_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in records:
            writer.writerow({
                "review_text": r["review_text"],
                "rating": r["rating"],
                "reviewer_id": r["reviewer_id"],
                "product_id": r["product_id"],
                "date": r["date"],
                "label": r["label"],
            })

    print(f"Generated {len(records)} synthetic reviews ({num_fake} fake, {num_genuine} genuine) -> {target_path}")
    return target_path


if __name__ == "__main__":
    generate_synthetic_dataset()
