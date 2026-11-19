import { useEffect, useState } from "react";
import axios from "axios";
import PythonAnalytics from "./PythonAnalytics";
import "./App.css";

const API = "http://localhost:8080/api";

const emptyEvent = {
  title: "",
  date: "",
  time: "",
  venue: "",
  capacity: 100,
  category: "General",
};

const emptyStudent = {
  studentId: "",
  name: "",
  department: "",
  yearOfStudy: 1,
};

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [events, setEvents] = useState([]);
  const [students, setStudents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [eventForm, setEventForm] = useState(emptyEvent);
  const [studentForm, setStudentForm] = useState(emptyStudent);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [summary, setSummary] = useState(null);
  const [eventReports, setEventReports] = useState([]);
  const [departmentReports, setDepartmentReports] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadData() {
    try {
      const [
        eventRes,
        studentRes,
        regRes,
        summaryRes,
        eventReportRes,
        departmentRes,
      ] = await Promise.all([
        axios.get(`${API}/events`),
        axios.get(`${API}/students`),
        axios.get(`${API}/registrations`),
        axios.get(`${API}/reports/summary`),
        axios.get(`${API}/reports/events`),
        axios.get(`${API}/reports/departments`),
      ]);

      setEvents(eventRes.data);
      setStudents(studentRes.data);
      setRegistrations(regRes.data);
      setSummary(summaryRes.data);
      setEventReports(eventReportRes.data);
      setDepartmentReports(departmentRes.data);
      setError("");
    } catch (err) {
      console.error("Loading failed:", err);
      setError("Unable to load data. Check Spring Boot.");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function navigate(destination) {
    setPage(destination);
    setMessage("");
    setError("");

    if (destination !== "python") {
      loadData();
    }
  }

  function showError(err) {
    console.error(err.response?.data || err);
    setError(
      err.response?.data?.message ||
        err.response?.data?.detail ||
        err.message ||
        "Something went wrong."
    );
  }

  async function createEvent(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      await axios.post(`${API}/events`, {
        eventName: eventForm.title.trim(),
        eventDate: eventForm.date,
        eventTime: eventForm.time,
        venue: eventForm.venue.trim(),
        maxParticipants: Number(eventForm.capacity),
        category: eventForm.category,
      });

      setEventForm({ ...emptyEvent });
      await loadData();
      setPage("events");
      setMessage("Event created successfully!");
    } catch (err) {
      showError(err);
    } finally {
      setSaving(false);
    }
  }

  async function addStudent(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      await axios.post(`${API}/students`, {
        ...studentForm,
        yearOfStudy: Number(studentForm.yearOfStudy),
      });

      setStudentForm({ ...emptyStudent });
      await loadData();
      setMessage("Student added successfully!");
    } catch (err) {
      showError(err);
    } finally {
      setSaving(false);
    }
  }

  async function registerStudent(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      await axios.post(`${API}/register`, null, {
        params: {
          studentId: Number(selectedStudent),
          eventId: Number(selectedEvent),
        },
      });

      await loadData();
      setMessage("Student registered successfully!");
    } catch (err) {
      showError(err);
    } finally {
      setSaving(false);
    }
  }

  async function markAttendance(registrationId, status) {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      await axios.put(
        `${API}/attendance/${registrationId}`,
        null,
        { params: { status } }
      );

      await loadData();
      setMessage(`Attendance updated to ${status}!`);
    } catch (err) {
      showError(err);
    } finally {
      setSaving(false);
    }
  }

  const registeredCount = (eventId) =>
    registrations.filter(
      (r) => Number(r.event?.id) === Number(eventId)
    ).length;

  const presentCount = registrations.filter(
    (r) => r.status === "PRESENT"
  ).length;

  const absentCount = registrations.filter(
    (r) => r.status === "ABSENT"
  ).length;

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>🎓 Smart Campus</h2>
        <p>Event Management</p>

        <button onClick={() => navigate("dashboard")}>
          Dashboard
        </button>
        <button onClick={() => navigate("events")}>
          All Events
        </button>
        <button onClick={() => navigate("create")}>
          Create Event
        </button>
        <button onClick={() => navigate("students")}>
          Students
        </button>
        <button onClick={() => navigate("register")}>
          Event Registration
        </button>
        <button onClick={() => navigate("attendance")}>
          Attendance
        </button>
        <button onClick={() => navigate("analytics")}>
          Analytics Reports
        </button>
        <button onClick={() => navigate("python")}>
          Python Analytics
        </button>
      </aside>

      <main className="main">
        <header>
          <h1>Smart Campus Event Management</h1>
          <span>Campus Administration</span>
        </header>

        {message && <div className="message">{message}</div>}
        {error && <div className="message">{error}</div>}

        {page === "dashboard" && (
          <>
            <h2>Dashboard Overview</h2>

            <div className="stats">
              <Stat
                title="Total Events"
                value={summary?.totalEvents ?? events.length}
              />
              <Stat
                title="Total Students"
                value={summary?.totalStudents ?? students.length}
              />
              <Stat
                title="Registrations"
                value={summary?.totalRegistrations ?? registrations.length}
              />
              <Stat
                title="Present"
                value={summary?.totalPresent ?? presentCount}
              />
              <Stat
                title="Absent"
                value={summary?.totalAbsent ?? absentCount}
              />
            </div>

            <h2>Recent Events</h2>
            <EventList
              events={events.slice(-5).reverse()}
              registeredCount={registeredCount}
            />
          </>
        )}

        {page === "events" && (
          <>
            <div className="heading">
              <h2>All Campus Events</h2>
              <button onClick={loadData}>Refresh</button>
            </div>

            <EventList
              events={events}
              registeredCount={registeredCount}
            />
          </>
        )}

        {page === "create" && (
          <>
            <h2>Create New Event</h2>

            <form className="event-form" onSubmit={createEvent}>
              <label>Event Title</label>
              <input
                required
                value={eventForm.title}
                onChange={(e) =>
                  setEventForm({
                    ...eventForm,
                    title: e.target.value,
                  })
                }
              />

              <label>Event Date</label>
              <input
                type="date"
                required
                value={eventForm.date}
                onChange={(e) =>
                  setEventForm({
                    ...eventForm,
                    date: e.target.value,
                  })
                }
              />

              <label>Event Time</label>
              <input
                type="time"
                required
                value={eventForm.time}
                onChange={(e) =>
                  setEventForm({
                    ...eventForm,
                    time: e.target.value,
                  })
                }
              />

              <label>Venue</label>
              <input
                required
                value={eventForm.venue}
                onChange={(e) =>
                  setEventForm({
                    ...eventForm,
                    venue: e.target.value,
                  })
                }
              />

              <label>Maximum Participants</label>
              <input
                type="number"
                min="1"
                required
                value={eventForm.capacity}
                onChange={(e) =>
                  setEventForm({
                    ...eventForm,
                    capacity: e.target.value,
                  })
                }
              />

              <label>Category</label>
              <select
                value={eventForm.category}
                onChange={(e) =>
                  setEventForm({
                    ...eventForm,
                    category: e.target.value,
                  })
                }
              >
                <option>General</option>
                <option>Technical</option>
                <option>Cultural</option>
                <option>Sports</option>
                <option>Workshop</option>
              </select>

              <button disabled={saving} type="submit">
                {saving ? "Saving..." : "Create Event"}
              </button>
            </form>
          </>
        )}

        {page === "students" && (
          <>
            <h2>Add Student</h2>

            <form className="event-form" onSubmit={addStudent}>
              <label>Student ID / Register Number</label>
              <input
                required
                value={studentForm.studentId}
                onChange={(e) =>
                  setStudentForm({
                    ...studentForm,
                    studentId: e.target.value,
                  })
                }
              />

              <label>Student Name</label>
              <input
                required
                value={studentForm.name}
                onChange={(e) =>
                  setStudentForm({
                    ...studentForm,
                    name: e.target.value,
                  })
                }
              />

              <label>Department</label>
              <input
                required
                value={studentForm.department}
                onChange={(e) =>
                  setStudentForm({
                    ...studentForm,
                    department: e.target.value,
                  })
                }
              />

              <label>Year of Study</label>
              <select
                value={studentForm.yearOfStudy}
                onChange={(e) =>
                  setStudentForm({
                    ...studentForm,
                    yearOfStudy: Number(e.target.value),
                  })
                }
              >
                {[1, 2, 3, 4, 5, 6].map((year) => (
                  <option key={year} value={year}>
                    Year {year}
                  </option>
                ))}
              </select>

              <button disabled={saving} type="submit">
                Add Student
              </button>
            </form>

            <h2>Students List</h2>

            <div className="event-grid">
              {students.map((student) => (
                <article className="event-card" key={student.id}>
                  <h3>{student.name}</h3>
                  <p>ID: {student.studentId}</p>
                  <p>Department: {student.department}</p>
                  <p>Year: {student.yearOfStudy}</p>
                </article>
              ))}
            </div>
          </>
        )}

        {page === "register" && (
          <>
            <h2>Register Student for Event</h2>

            <form className="event-form" onSubmit={registerStudent}>
              <label>Select Student</label>
              <select
                required
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
              >
                <option value="">Select a student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.studentId})
                  </option>
                ))}
              </select>

              <label>Select Event</label>
              <select
                required
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
              >
                <option value="">Select an event</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.eventName} (
                    {event.maxParticipants - registeredCount(event.id)} seats left)
                  </option>
                ))}
              </select>

              <button disabled={saving} type="submit">
                {saving ? "Registering..." : "Register Student"}
              </button>
            </form>

            <h2>Event Registrations</h2>

            <div className="event-grid">
              {registrations.map((reg) => (
                <article className="event-card" key={reg.id}>
                  <h3>{reg.event?.eventName || "Event"}</h3>
                  <p>Student: {reg.student?.name}</p>
                  <p>Status: {reg.status}</p>
                </article>
              ))}
            </div>
          </>
        )}

        {page === "attendance" && (
          <>
            <h2>Attendance Management</h2>
            <p>Mark students as Present, Absent, or Registered.</p>

            {registrations.length === 0 && (
              <p>No registrations available.</p>
            )}

            <div className="event-grid">
              {registrations.map((reg) => (
                <article className="event-card" key={reg.id}>
                  <h3>{reg.student?.name || "Student"}</h3>
                  <p>Student ID: {reg.student?.studentId}</p>
                  <p>Event: {reg.event?.eventName}</p>
                  <p>
                    Status: <strong>{reg.status}</strong>
                  </p>

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      disabled={saving}
                      onClick={() =>
                        markAttendance(reg.id, "PRESENT")
                      }
                    >
                      Present
                    </button>

                    <button
                      disabled={saving}
                      onClick={() =>
                        markAttendance(reg.id, "ABSENT")
                      }
                    >
                      Absent
                    </button>

                    <button
                      disabled={saving}
                      onClick={() =>
                        markAttendance(reg.id, "REGISTERED")
                      }
                    >
                      Reset
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {page === "analytics" && (
          <>
            <h2>Analytics & Reports</h2>

            <div className="stats">
              <Stat
                title="Total Events"
                value={summary?.totalEvents ?? 0}
              />
              <Stat
                title="Total Students"
                value={summary?.totalStudents ?? 0}
              />
              <Stat
                title="Registrations"
                value={summary?.totalRegistrations ?? 0}
              />
              <Stat
                title="Present"
                value={summary?.totalPresent ?? 0}
              />
              <Stat
                title="Absent"
                value={summary?.totalAbsent ?? 0}
              />
            </div>

            <h2>Event Participation Report</h2>

            <div className="event-grid">
              {eventReports.map((report) => {
                const percentage = report.capacity
                  ? Math.round(
                      (report.registered / report.capacity) * 100
                    )
                  : 0;

                return (
                  <article
                    className="event-card"
                    key={report.eventId}
                  >
                    <h3>{report.eventName}</h3>
                    <p>Category: {report.category || "General"}</p>
                    <p>Date: {report.date}</p>
                    <p>Capacity: {report.capacity}</p>
                    <p>Registered: {report.registered}</p>
                    <p>Present: {report.present}</p>
                    <p>Occupancy: {percentage}%</p>

                    <progress
                      value={report.registered}
                      max={Math.max(report.capacity, 1)}
                      style={{ width: "100%" }}
                    />
                  </article>
                );
              })}
            </div>

            <h2>Department-wise Participation</h2>

            {Object.keys(departmentReports).length === 0 && (
              <p>No department data available.</p>
            )}

            <div className="event-grid">
              {Object.entries(departmentReports).map(
                ([department, count]) => (
                  <article
                    className="event-card"
                    key={department}
                  >
                    <h3>{department}</h3>
                    <p>Total Registrations: {count}</p>
                  </article>
                )
              )}
            </div>
          </>
        )}

        {page === "python" && <PythonAnalytics />}
      </main>
    </div>
  );
}

function Stat({ title, value }) {
  return (
    <div className="stat">
      <h3>{title}</h3>
      <strong>{value}</strong>
    </div>
  );
}

function EventList({ events, registeredCount }) {
  if (!events.length) {
    return <p>No events available yet.</p>;
  }

  return (
    <div className="event-grid">
      {events.map((event) => {
        const registered = registeredCount(event.id);
        const seatsLeft = event.maxParticipants - registered;

        return (
          <article className="event-card" key={event.id}>
            <h3>{event.eventName}</h3>
            <p>📅 Date: {event.eventDate}</p>
            <p>🕒 Time: {event.eventTime || "Not specified"}</p>
            <p>📍 Venue: {event.venue}</p>
            <p>🏷️ Category: {event.category || "General"}</p>
            <p>👥 Capacity: {event.maxParticipants}</p>
            <p>✅ Registered: {registered}</p>
            <p>🎟️ Seats Available: {seatsLeft}</p>
          </article>
        );
      })}
    </div>
  );
}