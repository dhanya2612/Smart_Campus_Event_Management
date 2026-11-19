import React from "react";

const charts = [
  {
    title: "Event-wise Student Participation",
    image: "/event_participation.png",
    description: "Python analysis of registrations for each campus event.",
  },
  {
    title: "Attendance Distribution",
    image: "/attendance_pie_chart.png",
    description: "Pie chart showing present, absent, and registered students.",
  },
  {
    title: "Department-wise Participation",
    image: "/department_participation.png",
    description: "Comparison of event registrations across departments.",
  },
  {
    title: "Event Occupancy Analysis",
    image: "/event_occupancy.png",
    description: "Percentage of available event seats occupied.",
  },
];

export default function PythonAnalytics() {
  return (
    <div>
      <h2>Python Data Science Analytics</h2>

      <p>
        Visualizations generated using Python, Pandas,
        Matplotlib, and the SQLite database.
      </p>

      <div className="event-grid">
        {charts.map((chart) => (
          <article className="event-card" key={chart.title}>
            <h3>{chart.title}</h3>

            <img
              src={chart.image}
              alt={chart.title}
              style={{
                width: "100%",
                borderRadius: "10px",
                marginTop: "12px",
              }}
            />

            <p>{chart.description}</p>
          </article>
        ))}
      </div>

      <p>
        Note: Charts are generated from the database
        by running the Python analysis script.
      </p>
    </div>
  );
}