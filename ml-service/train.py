"""Train a TF-IDF + Logistic Regression classifier on a small seed dataset
of expense descriptions and save the pipeline to model.pkl."""

from pathlib import Path

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

SEED = 42
MODEL_PATH = Path(__file__).parent / "model.pkl"

DATA = [
    # Food (30)
    ("Zomato dinner order", "Food"),
    ("Swiggy lunch", "Food"),
    ("Starbucks coffee", "Food"),
    ("McDonalds burger meal", "Food"),
    ("Domino's pizza", "Food"),
    ("KFC chicken bucket", "Food"),
    ("Subway sandwich", "Food"),
    ("Dinner at Olive Garden", "Food"),
    ("Breakfast at cafe", "Food"),
    ("Grocery shopping Big Bazaar", "Food"),
    ("Supermarket groceries", "Food"),
    ("Fresh vegetables from market", "Food"),
    ("Fruits and bread", "Food"),
    ("Milk and eggs", "Food"),
    ("Chai and samosa", "Food"),
    ("Team lunch at restaurant", "Food"),
    ("Ice cream Baskin Robbins", "Food"),
    ("Pizza Hut order", "Food"),
    ("Cafe Coffee Day", "Food"),
    ("Haldiram snacks", "Food"),
    ("Biryani takeaway", "Food"),
    ("Chinese food delivery", "Food"),
    ("Bakery cake", "Food"),
    ("Juice at juice bar", "Food"),
    ("Restaurant bill", "Food"),
    ("Street food chaat", "Food"),
    ("Dunkin donuts", "Food"),
    ("Burger King whopper", "Food"),
    ("Sushi dinner", "Food"),
    ("Weekly grocery run", "Food"),
    # Transport (25)
    ("Uber ride home", "Transport"),
    ("Ola cab to office", "Transport"),
    ("Metro card recharge", "Transport"),
    ("Auto rickshaw fare", "Transport"),
    ("Petrol fuel refill", "Transport"),
    ("Diesel at HP pump", "Transport"),
    ("Bus ticket", "Transport"),
    ("Train ticket IRCTC", "Transport"),
    ("Flight ticket Indigo", "Transport"),
    ("Air India flight", "Transport"),
    ("Cab to airport", "Transport"),
    ("Rapido bike taxi", "Transport"),
    ("Parking fee mall", "Transport"),
    ("Toll road charge", "Transport"),
    ("Car service Maruti", "Transport"),
    ("Bike service Honda", "Transport"),
    ("Tyre puncture repair", "Transport"),
    ("Monthly metro pass", "Transport"),
    ("Uber Eats delivery", "Food"),  # tricky: Uber Eats is food
    ("Shatabdi train", "Transport"),
    ("Taxi to station", "Transport"),
    ("Petrol 20 litres", "Transport"),
    ("Fastag recharge", "Transport"),
    ("Car wash", "Transport"),
    ("Scooter fuel", "Transport"),
    ("Airport taxi", "Transport"),
    # Shopping (25)
    ("Amazon order headphones", "Shopping"),
    ("Flipkart t-shirt", "Shopping"),
    ("Myntra jeans", "Shopping"),
    ("Ajio dress", "Shopping"),
    ("Nike shoes", "Shopping"),
    ("Adidas sneakers", "Shopping"),
    ("Zara shirt", "Shopping"),
    ("H&M jacket", "Shopping"),
    ("Levis jeans purchase", "Shopping"),
    ("IKEA furniture", "Shopping"),
    ("Home decor cushions", "Shopping"),
    ("Kitchen utensils", "Shopping"),
    ("Bedsheet online", "Shopping"),
    ("Watch from Titan", "Shopping"),
    ("Sunglasses Ray-Ban", "Shopping"),
    ("Handbag purchase", "Shopping"),
    ("Perfume Chanel", "Shopping"),
    ("Makeup kit Sephora", "Shopping"),
    ("Lipstick MAC", "Shopping"),
    ("New laptop bag", "Shopping"),
    ("Phone cover case", "Shopping"),
    ("Electronics gadget", "Shopping"),
    ("Headset Sony", "Shopping"),
    ("Kurti online order", "Shopping"),
    ("Shoes from mall", "Shopping"),
    # Bills (25)
    ("Electricity bill payment", "Bills"),
    ("Water bill monthly", "Bills"),
    ("Gas cylinder booking", "Bills"),
    ("Internet bill Jio fiber", "Bills"),
    ("Wifi bill Airtel", "Bills"),
    ("Mobile recharge Jio", "Bills"),
    ("Postpaid mobile bill Vi", "Bills"),
    ("DTH recharge Tata Sky", "Bills"),
    ("Credit card bill payment", "Bills"),
    ("Rent payment landlord", "Bills"),
    ("Monthly rent", "Bills"),
    ("House rent transfer", "Bills"),
    ("Maintenance society fee", "Bills"),
    ("Broadband ACT", "Bills"),
    ("Property tax", "Bills"),
    ("Insurance premium LIC", "Bills"),
    ("Car insurance renewal", "Bills"),
    ("Bike insurance", "Bills"),
    ("Health insurance premium", "Bills"),
    ("Loan EMI payment", "Bills"),
    ("Home loan EMI", "Bills"),
    ("Personal loan installment", "Bills"),
    ("Electricity BESCOM bill", "Bills"),
    ("Piped gas bill", "Bills"),
    ("Postpaid phone bill", "Bills"),
    # Entertainment (25)
    ("Netflix subscription", "Entertainment"),
    ("Amazon Prime Video", "Entertainment"),
    ("Hotstar Disney plus", "Entertainment"),
    ("Spotify premium", "Entertainment"),
    ("Apple Music subscription", "Entertainment"),
    ("YouTube premium", "Entertainment"),
    ("Movie ticket PVR", "Entertainment"),
    ("INOX cinema", "Entertainment"),
    ("BookMyShow concert", "Entertainment"),
    ("Comedy show ticket", "Entertainment"),
    ("Theatre play", "Entertainment"),
    ("Theme park Wonderla", "Entertainment"),
    ("Bowling with friends", "Entertainment"),
    ("Arcade games", "Entertainment"),
    ("PS5 game purchase", "Entertainment"),
    ("Xbox game pass", "Entertainment"),
    ("Steam game", "Entertainment"),
    ("Concert tickets", "Entertainment"),
    ("IPL match ticket", "Entertainment"),
    ("Football match", "Entertainment"),
    ("Sony LIV subscription", "Entertainment"),
    ("Zee5 renewal", "Entertainment"),
    ("Gaana music app", "Entertainment"),
    ("Movie rental BMS stream", "Entertainment"),
    ("Escape room ticket", "Entertainment"),
    # Health (25)
    ("Paracetamol tablets", "Health"),
    ("Medicine from Apollo pharmacy", "Health"),
    ("Doctor consultation fee", "Health"),
    ("Dentist appointment", "Health"),
    ("Dental cleaning", "Health"),
    ("Eye checkup optometrist", "Health"),
    ("Spectacles new frame", "Health"),
    ("Contact lenses", "Health"),
    ("Blood test Thyrocare", "Health"),
    ("Pathology lab test", "Health"),
    ("X-ray scan", "Health"),
    ("MRI scan", "Health"),
    ("Gym membership Cult fit", "Health"),
    ("Yoga class", "Health"),
    ("Physio therapy session", "Health"),
    ("Vitamins supplements", "Health"),
    ("Protein powder", "Health"),
    ("1mg medicine order", "Health"),
    ("Netmeds pharmacy", "Health"),
    ("Hospital visit bill", "Health"),
    ("Cough syrup", "Health"),
    ("Bandages and first aid", "Health"),
    ("Skincare dermatologist", "Health"),
    ("Homeopathy consultation", "Health"),
    ("Health checkup package", "Health"),
    # Education (25)
    ("Udemy course purchase", "Education"),
    ("Coursera subscription", "Education"),
    ("edX course fee", "Education"),
    ("School fees payment", "Education"),
    ("College tuition fee", "Education"),
    ("Textbook purchase", "Education"),
    ("Stationery notebooks", "Education"),
    ("Pens and pencils", "Education"),
    ("Exam fee", "Education"),
    ("Byju's subscription", "Education"),
    ("Unacademy plus", "Education"),
    ("Vedantu classes", "Education"),
    ("Online tutor fee", "Education"),
    ("Tuition class", "Education"),
    ("Coaching institute fee", "Education"),
    ("IIT coaching", "Education"),
    ("Book on Amazon Kindle", "Education"),
    ("Kindle unlimited", "Education"),
    ("Reference book", "Education"),
    ("Workshop registration", "Education"),
    ("Conference ticket tech", "Education"),
    ("Certification exam AWS", "Education"),
    ("Language class Duolingo plus", "Education"),
    ("Art class fee", "Education"),
    ("Music lesson guitar", "Education"),
    # Other (20)
    ("ATM cash withdrawal", "Other"),
    ("Bank charges", "Other"),
    ("Gift for friend birthday", "Other"),
    ("Donation to NGO", "Other"),
    ("Temple donation", "Other"),
    ("Charity contribution", "Other"),
    ("Salon haircut", "Other"),
    ("Beauty parlor facial", "Other"),
    ("Dry cleaning laundry", "Other"),
    ("Tailor alteration", "Other"),
    ("Pet food dog", "Other"),
    ("Vet appointment", "Other"),
    ("Miscellaneous expense", "Other"),
    ("Office supplies", "Other"),
    ("Printing photocopy", "Other"),
    ("Courier Bluedart", "Other"),
    ("Postage stamps", "Other"),
    ("Tips waiter", "Other"),
    ("Unknown purchase", "Other"),
    ("Random expense", "Other"),
]


def main() -> None:
    df = pd.DataFrame(DATA, columns=["description", "category"])
    print(f"Dataset: {len(df)} rows, {df['category'].nunique()} categories")
    print(df["category"].value_counts().to_string())

    X_train, X_test, y_train, y_test = train_test_split(
        df["description"],
        df["category"],
        test_size=0.2,
        random_state=SEED,
        stratify=df["category"],
    )

    pipeline = Pipeline(
        [
            (
                "tfidf",
                TfidfVectorizer(
                    lowercase=True,
                    ngram_range=(1, 2),
                    min_df=1,
                    sublinear_tf=True,
                ),
            ),
            (
                "clf",
                LogisticRegression(
                    max_iter=1000,
                    C=4.0,
                    class_weight="balanced",
                    random_state=SEED,
                ),
            ),
        ]
    )

    pipeline.fit(X_train, y_train)
    preds = pipeline.predict(X_test)
    acc = accuracy_score(y_test, preds)
    print(f"\nHeld-out accuracy: {acc:.3f}")

    # Retrain on full data before saving, so the deployed model uses every example.
    pipeline.fit(df["description"], df["category"])
    joblib.dump(pipeline, MODEL_PATH)
    print(f"Saved model to {MODEL_PATH}")


if __name__ == "__main__":
    main()
