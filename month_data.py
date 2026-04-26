import pandas as pd
import random
from datetime import datetime, timedelta

users = ["Asha", "Neha", "Kavya", "Pooja", "Riya"]

data = []

start_date_base = datetime(2026, 1, 1)

for user in users:
    
    current_start = start_date_base
    
    for month in ["Jan", "Feb", "Mar"]:
        
        # Decide user type
        if user in ["Asha", "Kavya", "Riya"]:  # higher risk
            
            # Sometimes skip period
            missed = random.choice([False, False, True])
            
            if missed:
                data.append({
                    "user": user,
                    "month": month,
                    "period_start": "None",
                    "period_duration": 0,
                    "cycle_length": 0,
                    "pain_level": 0,
                    "flow": "None",
                    "missed_period": "Yes",
                    "irregular": "Yes"
                })
                continue
            
            cycle_length = random.randint(35, 50)
            pain = random.randint(3, 5)
            flow = random.choice(["Medium", "Heavy"])
            irregular = "Yes"
        
        else:  # healthy users
            
            cycle_length = random.randint(26, 30)
            pain = random.randint(1, 3)
            flow = random.choice(["Light", "Medium"])
            irregular = "No"
            missed = False
        
        period_duration = random.randint(3, 6)
        
        period_start = current_start
        current_start = current_start + timedelta(days=cycle_length)
        
        data.append({
            "user": user,
            "month": month,
            "period_start": period_start.strftime("%Y-%m-%d"),
            "period_duration": period_duration,
            "cycle_length": cycle_length,
            "pain_level": pain,
            "flow": flow,
            "missed_period": "No",
            "irregular": irregular
        })

df = pd.DataFrame(data)
df.to_csv("monthly_data_realistic.csv", index=False)

print("✅ Realistic monthly data generated")