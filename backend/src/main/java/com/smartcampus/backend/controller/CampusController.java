package com.smartcampus.backend.controller;

import com.smartcampus.backend.model.*;
import com.smartcampus.backend.repository.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class CampusController {

    @Autowired
    private StudentRepository students;

    @Autowired
    private EventRepository events;

    @Autowired
    private RegistrationRepository registrations;

    // STUDENTS

    @GetMapping("/students")
    public List<Student> getStudents() {
        return students.findAll();
    }

    @PostMapping("/students")
    public Student addStudent(@RequestBody Student student) {

        if (student.getStudentId() == null ||
            student.getStudentId().isBlank() ||
            student.getName() == null ||
            student.getName().isBlank() ||
            student.getDepartment() == null ||
            student.getDepartment().isBlank() ||
            student.getYearOfStudy() < 1 ||
            student.getYearOfStudy() > 6) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Enter valid student details"
            );
        }

        student.setId(null);

        if (students.findByStudentId(
                student.getStudentId()).isPresent()) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Student ID already exists"
            );
        }

        try {
            return students.save(student);
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Student already exists"
            );
        }
    }

    // EVENTS

    @GetMapping("/events")
    public List<Event> getEvents() {
        return events.findAll();
    }

    @PostMapping("/events")
    public Event addEvent(@RequestBody Event event) {

        validateEvent(event);
        event.setId(null);

        return events.save(event);
    }

    @PutMapping("/events/{id}")
    public Event updateEvent(
            @PathVariable Long id,
            @RequestBody Event updated) {

        Event event = events.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Event not found"
            ));

        validateEvent(updated);

        if (updated.getMaxParticipants() <
            registrations.countByEvent_Id(id)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Capacity is below existing registrations"
            );
        }

        event.setEventName(updated.getEventName());
        event.setEventDate(updated.getEventDate());
        event.setVenue(updated.getVenue());
        event.setMaxParticipants(updated.getMaxParticipants());
        event.setCategory(updated.getCategory());

        return events.save(event);
    }

    private void validateEvent(Event event) {
        if (event.getEventName() == null ||
            event.getEventName().isBlank() ||
            event.getEventDate() == null ||
            event.getVenue() == null ||
            event.getVenue().isBlank() ||
            event.getMaxParticipants() <= 0) {

            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Enter valid event details"
            );
        }
    }

    // REGISTRATIONS

    @GetMapping("/registrations")
    public List<Registration> getRegistrations() {
        return registrations.findAll();
    }

    @PostMapping("/register")
    @Transactional
    public Registration register(
            @RequestParam Long studentId,
            @RequestParam Long eventId) {

        Student student = students.findById(studentId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Student not found"
            ));

        // Lock the event row while checking capacity.
        Event event = events.findByIdForUpdate(eventId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Event not found"
            ));

        if (registrations.existsByStudent_IdAndEvent_Id(
                studentId, eventId)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Student already registered"
            );
        }

        if (registrations.countByEvent_Id(eventId) >=
            event.getMaxParticipants()) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Event is full"
            );
        }

        Registration registration = new Registration();
        registration.setStudent(student);
        registration.setEvent(event);
        registration.setStatus("REGISTERED");

        return registrations.saveAndFlush(registration);
    }

    @GetMapping("/events/{id}/registrations")
    public List<Registration> eventRegistrations(
            @PathVariable Long id) {
        return registrations.findByEvent_Id(id);
    }

    // ATTENDANCE

    @PutMapping("/attendance/{id}")
    public Registration updateAttendance(
            @PathVariable Long id,
            @RequestParam String status) {

        String value = status.toUpperCase(Locale.ROOT);

        if (!Set.of("REGISTERED", "PRESENT", "ABSENT")
                .contains(value)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Invalid attendance status"
            );
        }

        Registration registration = registrations.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Registration not found"
            ));

        registration.setStatus(value);
        return registrations.save(registration);
    }

    // REPORTS

    @GetMapping("/reports/summary")
    public Map<String, Object> summary() {

        List<Registration> all = registrations.findAll();

        Map<String, Object> result = new LinkedHashMap<>();

        result.put("totalStudents", students.count());
        result.put("totalEvents", events.count());
        result.put("totalRegistrations", all.size());

        result.put("totalPresent",
            all.stream().filter(r ->
                "PRESENT".equals(r.getStatus())).count());

        result.put("totalAbsent",
            all.stream().filter(r ->
                "ABSENT".equals(r.getStatus())).count());

        return result;
    }

    @GetMapping("/reports/events")
    public List<Map<String, Object>> eventReport() {

        List<Map<String, Object>> result = new ArrayList<>();

        for (Event event : events.findAll()) {

            List<Registration> list =
                registrations.findByEvent_Id(event.getId());

            Map<String, Object> row = new LinkedHashMap<>();

            row.put("eventId", event.getId());
            row.put("eventName", event.getEventName());
            row.put("category", event.getCategory());
            row.put("date", event.getEventDate());
            row.put("capacity", event.getMaxParticipants());
            row.put("registered", list.size());
            row.put("present", list.stream().filter(r ->
                "PRESENT".equals(r.getStatus())).count());

            result.add(row);
        }

        return result;
    }

    @GetMapping("/reports/departments")
    public Map<String, Long> departmentReport() {

        return registrations.findAll().stream()
            .collect(Collectors.groupingBy(
                r -> r.getStudent().getDepartment(),
                TreeMap::new,
                Collectors.counting()
            ));
    }
}