package edu.ucsb.cs156.frontiers.models;

import java.util.List;

/** CSV record numbers include the header as row 1. */
public record CourseStaffCsvImportResult(int count, List<RowError> errors) {
  public record RowError(int row, String email, String message) {}
}
