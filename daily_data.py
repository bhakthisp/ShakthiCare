import pandas as pd
import random

users = ["Asha","Neha","Kavya","Pooja","Riya"]

data = []

for user in users:
    for day in range(1, 91):
        data.append({
            "user": user,
            "day": day,
            "mood": random.randint(1,5),
            "stress": random.randint(1,5),
            "sleep": random.randint(4,8)
        })

df = pd.DataFrame(data)
df.to_csv("daily_data.csv", index=False)