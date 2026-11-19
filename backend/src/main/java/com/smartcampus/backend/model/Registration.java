package com.smartcampus.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "registrations",
    uniqueConstraints = @UniqueConstraint(
        columnNames = {"student_id", "event_id"}
    )
)
public class Registration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "student_id")
    private Student student;

    @ManyToOne(optional = false)
    @JoinColumn(name = "event_id")
    private Event event;

    @Column(nullable = false)
    private String status = "REGISTERED";

    @Column(nullable = false)
    private LocalDateTime registeredAt = LocalDateTime.now();

    public Registration() {}

    public Long getId() { return id; }

    public Student getStudent() { return student; }
    public void setStudent(Student student) {
        this.student = student;
    }

    public Event getEvent() { return event; }
    public void setEvent(Event event) {
        this.event = event;
    }

    public String getStatus() { return status; }
    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getRegisteredAt() {
        return registeredAt;
    }
}