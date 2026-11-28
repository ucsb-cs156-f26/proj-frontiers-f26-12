package edu.ucsb.cs156.frontiers.models;

/**
 * An enrolled Frontiers student missing from the uploaded CATME roster.
 *
 * @param studentId the student's id
 * @param name the student's name in Frontiers
 * @param email the student's email in Frontiers
 * @param section the section to use in CATME, translated when the course enables section labels
 */
public record CATMEStudentAdd(String studentId, String name, String email, String section) {}
