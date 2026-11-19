import sqlite3
from pathlib import Path

import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "backend" / "smartcampus.db"
OUTPUT_DIR = Path(__file__).resolve().parent / "charts"

OUTPUT_DIR.mkdir(exist_ok=True)

if not DB_PATH.exists():
    print(f"Database not found: {DB_PATH}")
    raise SystemExit(1)

conn = sqlite3.connect(DB_PATH)

try:
    events = pd.read_sql_query("SELECT * FROM events", conn)
    students = pd.read_sql_query("SELECT * FROM students", conn)
    registrations = pd.read_sql_query(
        "SELECT * FROM registrations", conn
    )
finally:
    conn.close()

print("\n===== SMART CAMPUS DATA ANALYSIS =====")
print("Total Events:", len(events))
print("Total Students:", len(students))
print("Total Registrations:", len(registrations))

if events.empty:
    print("No events found. Create events first.")
    raise SystemExit(0)

# Identify the actual SQLite columns
print("\nEvent columns:", list(events.columns))
print("Registration columns:", list(registrations.columns))

# 1. EVENT PARTICIPATION BAR CHART
if not registrations.empty:
    participation = (
        registrations.groupby("event_id")
        .size()
        .reset_index(name="registrations")
    )
else:
    participation = pd.DataFrame(
        columns=["event_id", "registrations"]
    )

event_stats = events[["id", "event_name", "max_participants"]].merge(
    participation,
    left_on="id",
    right_on="event_id",
    how="left"
)

event_stats["registrations"] = (
    event_stats["registrations"].fillna(0).astype(int)
)

event_stats["occupancy_percent"] = (
    event_stats["registrations"]
    / event_stats["max_participants"].replace(0, float("nan"))
    * 100
).fillna(0).round(2)

plt.figure(figsize=(10, 5))
plt.bar(
    event_stats["event_name"],
    event_stats["registrations"]
)
plt.title("Event-wise Student Participation")
plt.xlabel("Campus Events")
plt.ylabel("Number of Registrations")
plt.xticks(rotation=30, ha="right")
plt.tight_layout()
plt.savefig(OUTPUT_DIR / "event_participation.png")
plt.close()

# 2. ATTENDANCE PIE CHART
if not registrations.empty:
    attendance = registrations["status"].fillna(
        "UNKNOWN"
    ).value_counts()

    plt.figure(figsize=(7, 7))
    plt.pie(
        attendance.values,
        labels=attendance.index,
        autopct="%1.1f%%",
        startangle=90
    )
    plt.title("Student Attendance Distribution")
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / "attendance_pie_chart.png")
    plt.close()

# 3. DEPARTMENT PARTICIPATION CHART
if not registrations.empty:
    joined = registrations.merge(
        students[["id", "department"]],
        left_on="student_id",
        right_on="id",
        how="left"
    )

    department_counts = (
        joined["department"]
        .fillna("Unknown")
        .value_counts()
    )

    plt.figure(figsize=(9, 5))
    plt.bar(
        department_counts.index,
        department_counts.values
    )
    plt.title("Department-wise Event Participation")
    plt.xlabel("Department")
    plt.ylabel("Number of Registrations")
    plt.xticks(rotation=30, ha="right")
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / "department_participation.png")
    plt.close()

# 4. EVENT OCCUPANCY ANALYSIS
plt.figure(figsize=(10, 5))
plt.bar(
    event_stats["event_name"],
    event_stats["occupancy_percent"]
)
plt.title("Event Occupancy Percentage")
plt.xlabel("Campus Events")
plt.ylabel("Occupancy (%)")
plt.xticks(rotation=30, ha="right")
plt.tight_layout()
plt.savefig(OUTPUT_DIR / "event_occupancy.png")
plt.close()

# 5. SAVE ANALYTICAL REPORT
event_stats[
    [
        "event_name",
        "max_participants",
        "registrations",
        "occupancy_percent"
    ]
].to_csv(
    OUTPUT_DIR / "event_analysis_report.csv",
    index=False
)

print("\n===== EVENT ANALYSIS =====")
print(
    event_stats[
        [
            "event_name",
            "registrations",
            "occupancy_percent"
        ]
    ].to_string(index=False)
)

print("\nAnalysis completed successfully!")
print("Charts saved to:", OUTPUT_DIR)