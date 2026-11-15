package edu.ucsb.cs156.frontiers.controllers;

import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvException;
import edu.ucsb.cs156.frontiers.entities.Course;
import edu.ucsb.cs156.frontiers.errors.EntityNotFoundException;
import edu.ucsb.cs156.frontiers.models.CourseStaffCsvImportResult;
import edu.ucsb.cs156.frontiers.models.CourseStaffCsvImportResult.RowError;
import edu.ucsb.cs156.frontiers.repositories.CourseRepository;
import edu.ucsb.cs156.frontiers.repositories.CourseStaffRepository;
import edu.ucsb.cs156.frontiers.services.CourseStaffCsvImportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@Tag(name = "CourseStaff")
@RequestMapping("/api/coursestaff")
@RestController("CourseStaffCSVController")
@Slf4j
public class CourseStaffCSVController extends ApiController {

  @Autowired private CourseStaffRepository courseStaffRepository;

  @Autowired private CourseRepository courseRepository;

  @Autowired private CourseStaffCsvImportService courseStaffCsvImportService;

  public static final String STAFF_CSV_HEADERS = "firstName,lastName,email";

  @Operation(
      summary = "Upload Course Staff from CSV",
      description =
          "Imports valid rows and returns count plus row-specific errors. CSV row numbers include"
              + " the header as row 1. Empty files, invalid headers, and malformed CSV return 400"
              + " without importing any rows.")
  @PreAuthorize("@CourseSecurity.hasInstructorPermissions(#root, #courseId)")
  @PostMapping(
      value = "/upload/csv",
      consumes = {"multipart/form-data"})
  public CourseStaffCsvImportResult uploadStaffCSV(
      @Parameter(name = "courseId") @RequestParam Long courseId,
      @Parameter(name = "file") @RequestParam("file") MultipartFile file) {

    Course course =
        courseRepository
            .findById(courseId)
            .orElseThrow(() -> new EntityNotFoundException(Course.class, courseId.toString()));

    // Parse the whole file before saving anything, so a malformed file cannot leave an unreported
    // partial import. Recoverable validation errors in individual records are handled below.
    List<String[]> rows;
    try (InputStream inputStream = new BufferedInputStream(file.getInputStream());
        InputStreamReader reader = new InputStreamReader(inputStream, StandardCharsets.UTF_8);
        CSVReader csvReader = new CSVReader(reader)) {
      rows = csvReader.readAll();
    } catch (IOException | CsvException e) {
      throw new IllegalArgumentException(
          "CSV file could not be read. Check the CSV format and quotation marks.", e);
    }
    if (rows.isEmpty()) {
      throw new IllegalArgumentException("CSV file is empty");
    }
    validateHeaders(rows.get(0));
    if (rows.size() == 1) {
      throw new IllegalArgumentException("CSV file does not contain any staff rows");
    }

    int count = 0;
    List<RowError> errors = new ArrayList<>();
    Set<String> seenEmails = new HashSet<>();
    for (int index = 1; index < rows.size(); index++) {
      String[] row = rows.get(index);
      String email = row.length >= 3 ? row[2].strip() : "";
      String error = validateRow(row);
      if (error != null) {
        errors.add(new RowError(index + 1, email, error));
        continue;
      }
      if (!seenEmails.add(email)) {
        errors.add(new RowError(index + 1, email, "Email is repeated in this CSV file."));
        continue;
      }
      if (courseStaffRepository.findByEmailAndCourse(email, course).isPresent()) {
        errors.add(new RowError(index + 1, email, "Email is already on this course's staff."));
        continue;
      }
      try {
        courseStaffCsvImportService.importStaff(course, row[0].strip(), row[1].strip(), email);
        count++;
      } catch (DataIntegrityViolationException e) {
        // Handle a concurrent insertion using the same comparison as the database. Do not label
        // unrelated database failures as duplicates. The row transaction has already rolled back.
        if (courseStaffRepository.findByEmailAndCourse(email, course).isEmpty()) {
          throw e;
        }
        errors.add(new RowError(index + 1, email, "Email is already on this course's staff."));
      }
    }
    return new CourseStaffCsvImportResult(count, errors);
  }

  private static String validateRow(String[] row) {
    if (row.length < 3) {
      return "Expected at least 3 columns: firstName,lastName,email.";
    }
    String[] names = {"First name", "Last name", "Email"};
    for (int i = 0; i < 3; i++) {
      String value = row[i].strip();
      if (value.isEmpty()) {
        return names[i] + " is required.";
      }
      if (value.length() > 255) {
        return names[i] + " must be at most 255 characters.";
      }
    }
    if (!row[2].strip().matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+")) {
      return "Enter a valid email address.";
    }
    return null;
  }

  static void validateHeaders(String[] headers) {
    String[] expectedHeaders = STAFF_CSV_HEADERS.split(",");
    if (headers.length < expectedHeaders.length) {
      throw new IllegalArgumentException(
          String.format(
              "CSV headers do not match expected format. Expected: %s", STAFF_CSV_HEADERS));
    }
    for (int i = 0; i < expectedHeaders.length; i++) {
      if (!expectedHeaders[i].trim().equalsIgnoreCase(headers[i].trim())) {
        throw new IllegalArgumentException(
            String.format(
                "CSV headers do not match expected format. Expected: %s", STAFF_CSV_HEADERS));
      }
    }
  }
}
