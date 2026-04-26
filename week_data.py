import pandas as pd
import random

users = ["Asha", "Neha", "Kavya", "Pooja", "Riya"]

data = []

for user in users:
    weight = random.randint(55, 65)  # starting weight
    
    for week in range(1, 13):  # 12 weeks
        
        # Set behavior based on user type
        if user in ["Asha", "Kavya", "Riya"]:  # higher risk users
            exercise = random.randint(0, 2)
            acne = 1
            hair_fall = 1
            fatigue = random.randint(0, 1)
            weight += random.choice([0, 1])  # slight increase
        else:  # healthier users
            exercise = random.randint(3, 5)
            acne = 0
            hair_fall = 0
            fatigue = 0
            weight += random.choice([-1, 0])  # stable or decrease
        
        data.append({
            "user": user,
            "week": f"Week{week}",
            "weight": weight,
            "exercise_days": exercise,
            "acne": acne,
            "hair_fall": hair_fall,
            "fatigue": fatigue
        })

df = pd.DataFrame(data)

# Save to CSV
df.to_csv("weekly_data.csv", index=False)

print("✅ Weekly data generated and saved as weekly_data.csv")