"use server";

import { supabase } from "@/lib/supabaseClient";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// Get all exams for the logged-in school
export async function getSchoolExams() {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Not authenticated", data: [] };
    }

    const { data: school } = await supabase
      .from("schools")
      .select("school_id")
      .eq("clerk_id", user.id)
      .single();

    if (!school) {
      return { success: false, error: "School not found", data: [] };
    }

    const { data: exams, error } = await supabase
      .from("exams")
      .select("*")
      .eq("school_id", school.school_id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching exams:", error);
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: exams || [] };
  } catch (error: any) {
    console.error("Get school exams error:", error);
    return { success: false, error: error.message, data: [] };
  }
}

// Create a new exam
interface CreateExamParams {
  title: string;
  description?: string;
  subject?: string;
  suggestedAgeMin?: number;
  suggestedAgeMax?: number;
  durationMinutes: number;
  startDate: string;
  endDate: string;
  totalMarks: number;
  passMarks: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  showResultsImmediately?: boolean;
  isFree?: boolean;
  price?: number;
}

export async function createExam(params: CreateExamParams) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: school } = await supabase
      .from("schools")
      .select("school_id")
      .eq("clerk_id", user.id)
      .single();

    if (!school) {
      return { success: false, error: "School not found" };
    }

    // Generate exam_id
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const examId = `EXAM-${timestamp}${random}`;

    const { data: exam, error } = await supabase
      .from("exams")
      .insert({
        exam_id: examId,
        school_id: school.school_id,
        title: params.title,
        description: params.description || null,
        subject: params.subject || null,
        suggested_age_min: params.suggestedAgeMin || null,
        suggested_age_max: params.suggestedAgeMax || null,
        duration_minutes: params.durationMinutes,
        start_date: params.startDate,
        end_date: params.endDate,
        total_marks: params.totalMarks,
        pass_marks: params.passMarks,
        shuffle_questions: params.shuffleQuestions ?? true,
        shuffle_options: params.shuffleOptions ?? true,
        show_results_immediately: params.showResultsImmediately ?? true,
        is_free: params.isFree ?? true,
        price: params.price || 0,
        is_published: false,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating exam:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/school/exams");
    return { success: true, data: exam };
  } catch (error: any) {
    console.error("Create exam error:", error);
    return { success: false, error: error.message };
  }
}

// Delete exam
export async function deleteExam(examId: string) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: school } = await supabase
      .from("schools")
      .select("school_id")
      .eq("clerk_id", user.id)
      .single();

    if (!school) {
      return { success: false, error: "School not found" };
    }

    // Soft delete
    const { error } = await supabase
      .from("exams")
      .update({ is_active: false })
      .eq("exam_id", examId)
      .eq("school_id", school.school_id);

    if (error) {
      console.error("Error deleting exam:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/school/exams");
    return { success: true };
  } catch (error: any) {
    console.error("Delete exam error:", error);
    return { success: false, error: error.message };
  }
}

// Publish/Unpublish exam
export async function toggleExamPublish(examId: string, isPublished: boolean) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: school } = await supabase
      .from("schools")
      .select("school_id")
      .eq("clerk_id", user.id)
      .single();

    if (!school) {
      return { success: false, error: "School not found" };
    }

    const updateData: any = {
      is_published: isPublished,
    };

    if (isPublished) {
      updateData.published_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("exams")
      .update(updateData)
      .eq("exam_id", examId)
      .eq("school_id", school.school_id);

    if (error) {
      console.error("Error toggling exam publish:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/school/exams");
    return { success: true };
  } catch (error: any) {
    console.error("Toggle exam publish error:", error);
    return { success: false, error: error.message };
  }
}

// ==================== QUESTION MANAGEMENT ====================

interface CreateQuestionParams {
  examId: string;
  questionText: string;
  questionImageUrl?: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
  marks: number;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  explanation?: string;
  hint?: string;
}

export async function createQuestion(params: CreateQuestionParams) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify school owns this exam
    const { data: exam } = await supabase
      .from("exams")
      .select("school_id, total_questions, total_marks")
      .eq("exam_id", params.examId)
      .single();

    if (!exam) {
      return { success: false, error: "Exam not found" };
    }

    const { data: school } = await supabase
      .from("schools")
      .select("school_id")
      .eq("clerk_id", user.id)
      .single();

    if (!school || school.school_id !== exam.school_id) {
      return { success: false, error: "Unauthorized" };
    }

    // Calculate current sum of question marks
    const { data: existingQuestions } = await supabase
      .from("exam_questions")
      .select("marks")
      .eq("exam_id", params.examId)
      .eq("is_active", true);

    const currentMarksSum =
      existingQuestions?.reduce((sum, q) => sum + (q.marks || 0), 0) || 0;

    // Check if adding this question would exceed total marks
    if (currentMarksSum + params.marks > exam.total_marks) {
      return {
        success: false,
        error: `Cannot add question. Total marks would be ${currentMarksSum + params.marks} but exam limit is ${exam.total_marks}`,
      };
    }

    // Generate question_id
    const questionId =
      `QUE_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`.toUpperCase();

    // Get next question order
    const { count } = await supabase
      .from("exam_questions")
      .select("*", { count: "exact", head: true })
      .eq("exam_id", params.examId);

    const questionOrder = (count || 0) + 1;

    // Insert question
    const { data: question, error } = await supabase
      .from("exam_questions")
      .insert({
        question_id: questionId,
        exam_id: params.examId,
        question_text: params.questionText,
        question_image_url: params.questionImageUrl || null,
        option_a: params.optionA,
        option_b: params.optionB,
        option_c: params.optionC,
        option_d: params.optionD,
        correct_option: params.correctOption,
        marks: params.marks,
        difficulty: params.difficulty || null,
        explanation: params.explanation || null,
        hint: params.hint || null,
        question_order: questionOrder,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating question:", error);
      return { success: false, error: error.message };
    }

    // Update exam stats (only increment question count, NOT total_marks)
    const newTotalQuestions = (exam.total_questions || 0) + 1;

    await supabase
      .from("exams")
      .update({
        total_questions: newTotalQuestions,
      })
      .eq("exam_id", params.examId);

    return { success: true, question };
  } catch (error: any) {
    console.error("Create question error:", error);
    return {
      success: false,
      error: error.message || "Failed to create question",
    };
  }
}

export async function getExamQuestions(examId: string) {
  try {
    const { data, error } = await supabase
      .from("exam_questions")
      .select("*")
      .eq("exam_id", examId)
      .eq("is_active", true)
      .order("question_order", { ascending: true });

    if (error) {
      console.error("Error fetching questions:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Get questions error:", error);
    return [];
  }
}

export async function updateQuestion(
  questionId: string,
  updates: Partial<CreateQuestionParams>,
) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify ownership
    const { data: question } = await supabase
      .from("exam_questions")
      .select("exam_id")
      .eq("question_id", questionId)
      .single();

    if (!question) {
      return { success: false, error: "Question not found" };
    }

    const { data: exam } = await supabase
      .from("exams")
      .select("school_id")
      .eq("exam_id", question.exam_id)
      .single();

    if (!exam) {
      return { success: false, error: "Exam not found" };
    }

    const { data: school } = await supabase
      .from("schools")
      .select("school_id")
      .eq("clerk_id", user.id)
      .single();

    if (!school || school.school_id !== exam.school_id) {
      return { success: false, error: "Unauthorized" };
    }

    // Update question
    const { error } = await supabase
      .from("exam_questions")
      .update({
        question_text: updates.questionText,
        question_image_url: updates.questionImageUrl || null,
        option_a: updates.optionA,
        option_b: updates.optionB,
        option_c: updates.optionC,
        option_d: updates.optionD,
        correct_option: updates.correctOption,
        marks: updates.marks,
        difficulty: updates.difficulty || null,
        explanation: updates.explanation || null,
        hint: updates.hint || null,
      })
      .eq("question_id", questionId);

    if (error) {
      console.error("Error updating question:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Update question error:", error);
    return {
      success: false,
      error: error.message || "Failed to update question",
    };
  }
}

export async function deleteQuestion(questionId: string) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get question details
    const { data: question } = await supabase
      .from("exam_questions")
      .select("exam_id, marks")
      .eq("question_id", questionId)
      .single();

    if (!question) {
      return { success: false, error: "Question not found" };
    }

    // Verify ownership
    const { data: exam } = await supabase
      .from("exams")
      .select("school_id, total_questions")
      .eq("exam_id", question.exam_id)
      .single();

    if (!exam) {
      return { success: false, error: "Exam not found" };
    }

    const { data: school } = await supabase
      .from("schools")
      .select("school_id")
      .eq("clerk_id", user.id)
      .single();

    if (!school || school.school_id !== exam.school_id) {
      return { success: false, error: "Unauthorized" };
    }

    // Soft delete question
    const { error } = await supabase
      .from("exam_questions")
      .update({ is_active: false })
      .eq("question_id", questionId);

    if (error) {
      console.error("Error deleting question:", error);
      return { success: false, error: error.message };
    }

    // Update exam stats (only decrement question count, NOT total_marks)
    const newTotalQuestions = Math.max(0, (exam.total_questions || 0) - 1);

    await supabase
      .from("exams")
      .update({
        total_questions: newTotalQuestions,
      })
      .eq("exam_id", question.exam_id);

    return { success: true };
  } catch (error: any) {
    console.error("Delete question error:", error);
    return {
      success: false,
      error: error.message || "Failed to delete question",
    };
  }
}

// ==================== EXAM PUBLISHING ====================

// Helper function to calculate sum of question marks
export async function getExamMarksSum(examId: string) {
  try {
    const { data: questions } = await supabase
      .from("exam_questions")
      .select("marks")
      .eq("exam_id", examId)
      .eq("is_active", true);

    const sum = questions?.reduce((total, q) => total + (q.marks || 0), 0) || 0;
    return sum;
  } catch (error) {
    console.error("Error calculating marks sum:", error);
    return 0;
  }
}

export async function publishExam(examId: string) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify ownership
    const { data: exam } = await supabase
      .from("exams")
      .select("school_id, total_questions, total_marks")
      .eq("exam_id", examId)
      .single();

    if (!exam) {
      return { success: false, error: "Exam not found" };
    }

    const { data: school } = await supabase
      .from("schools")
      .select("school_id")
      .eq("clerk_id", user.id)
      .single();

    if (!school || school.school_id !== exam.school_id) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if exam has questions
    if (!exam.total_questions || exam.total_questions === 0) {
      return { success: false, error: "Cannot publish exam without questions" };
    }

    // Calculate sum of all question marks
    const { data: questions } = await supabase
      .from("exam_questions")
      .select("marks")
      .eq("exam_id", examId)
      .eq("is_active", true);

    const questionMarksSum =
      questions?.reduce((sum, q) => sum + (q.marks || 0), 0) || 0;

    // Check if question marks match exam total marks
    if (questionMarksSum !== exam.total_marks) {
      return {
        success: false,
        error: `Cannot publish! Question marks (${questionMarksSum}) must equal exam total marks (${exam.total_marks}). Please add ${exam.total_marks - questionMarksSum} more marks worth of questions.`,
      };
    }

    // Publish exam
    const { error } = await supabase
      .from("exams")
      .update({
        is_published: true,
        published_at: new Date().toISOString(),
      })
      .eq("exam_id", examId);

    if (error) {
      console.error("Error publishing exam:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Publish exam error:", error);
    return { success: false, error: error.message || "Failed to publish exam" };
  }
}

export async function unpublishExam(examId: string) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify ownership
    const { data: exam } = await supabase
      .from("exams")
      .select("school_id")
      .eq("exam_id", examId)
      .single();

    if (!exam) {
      return { success: false, error: "Exam not found" };
    }

    const { data: school } = await supabase
      .from("schools")
      .select("school_id")
      .eq("clerk_id", user.id)
      .single();

    if (!school || school.school_id !== exam.school_id) {
      return { success: false, error: "Unauthorized" };
    }

    // Unpublish exam
    const { error } = await supabase
      .from("exams")
      .update({ is_published: false })
      .eq("exam_id", examId);

    if (error) {
      console.error("Error unpublishing exam:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Unpublish exam error:", error);
    return {
      success: false,
      error: error.message || "Failed to unpublish exam",
    };
  }
}

// ==================== GET EXAM DETAILS ====================

export async function getExamDetails(examId: string) {
  try {
    const { data, error } = await supabase
      .from("exams")
      .select(
        `
        *,
        school:schools!exams_school_id_fkey (
          school_id,
          name,
          logo_url
        )
      `,
      )
      .eq("exam_id", examId)
      .eq("is_active", true)
      .single();

    if (error) {
      console.error("Error fetching exam details:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Get exam details error:", error);
    return null;
  }
}

// ==================== STUDENT EXAM TAKING ====================

// Get exam details and questions for taking
export async function getExamForTaking(examId: string) {
  try {
    const { data: exam, error: examError } = await supabase
      .from("exams")
      .select(
        `
        *,
        school:schools!exams_school_id_fkey (
          school_id,
          name,
          logo_url
        )
      `,
      )
      .eq("exam_id", examId)
      .eq("is_published", true)
      .eq("is_active", true)
      .single();

    if (examError || !exam) {
      return { success: false, error: "Exam not found or not available" };
    }

    // Get questions (without correct answers for security)
    const { data: questions, error: questionsError } = await supabase
      .from("exam_questions")
      .select(
        "question_id, question_text, question_image_url, option_a, option_b, option_c, option_d, marks, question_order",
      )
      .eq("exam_id", examId)
      .eq("is_active", true)
      .order("question_order", { ascending: true });

    if (questionsError) {
      return { success: false, error: "Failed to load questions" };
    }

    // Shuffle questions if enabled
    let finalQuestions = questions || [];
    if (exam.shuffle_questions) {
      finalQuestions = [...finalQuestions].sort(() => Math.random() - 0.5);
    }

    return {
      success: true,
      data: {
        exam,
        questions: finalQuestions,
      },
    };
  } catch (error: any) {
    console.error("Get exam for taking error:", error);
    return {
      success: false,
      error: error.message || "Failed to load exam",
    };
  }
}

// Start exam attempt
export async function startExamAttempt(examId: string) {
  try {
    // Import getChildSession from auth
    const { getChildSession } = await import("./auth");
    const childSession = await getChildSession();

    if (!childSession) {
      return { success: false, error: "Not authenticated" };
    }

    // child_id is directly in the session
    const childId = childSession.id as string;

    // Check if child has already attempted this exam
    const { data: existingAttempt } = await supabase
      .from("exam_attempts")
      .select("attempt_id, status")
      .eq("exam_id", examId)
      .eq("child_id", childId)
      .maybeSingle();

    if (existingAttempt) {
      return {
        success: false,
        error:
          "You have already taken this exam. Each exam can only be attempted once! 📝",
        alreadyAttempted: true,
        attemptId: existingAttempt.attempt_id,
      };
    }

    // Get exam details to fetch total_questions and total_marks
    const { data: exam, error: examError } = await supabase
      .from("exams")
      .select("total_questions, total_marks")
      .eq("exam_id", examId)
      .single();

    if (examError || !exam) {
      return { success: false, error: "Exam not found" };
    }

    // Generate attempt_id
    const attemptId =
      `ATT_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`.toUpperCase();

    // Create attempt record with all required fields matching schema
    const { error } = await supabase.from("exam_attempts").insert({
      attempt_id: attemptId,
      exam_id: examId,
      child_id: childId,
      started_at: new Date().toISOString(),
      total_questions: exam.total_questions || 0,
      total_marks: exam.total_marks || 0,
      answered_questions: 0,
      correct_answers: 0,
      wrong_answers: 0,
      skipped_questions: 0,
      score_obtained: 0,
      percentage: 0,
      status: "IN_PROGRESS",
    });

    if (error) {
      console.error("Error starting attempt:", error);
      // Check if it's a duplicate key error
      if (error.code === "23505") {
        return {
          success: false,
          error:
            "You have already taken this exam. Each exam can only be attempted once! 📝",
        };
      }
      return { success: false, error: error.message };
    }

    return { success: true, attemptId };
  } catch (error: any) {
    console.error("Start exam attempt error:", error);
    return {
      success: false,
      error: error.message || "Failed to start exam",
    };
  }
}

// Submit exam attempt
export async function submitExamAttempt(
  attemptId: string,
  answers: Record<string, string>,
) {
  try {
    // Import getChildSession from auth
    const { getChildSession } = await import("./auth");
    const childSession = await getChildSession();

    if (!childSession) {
      return { success: false, error: "Not authenticated" };
    }

    // Get attempt details
    const { data: attempt } = await supabase
      .from("exam_attempts")
      .select("exam_id, child_id, started_at")
      .eq("attempt_id", attemptId)
      .single();

    if (!attempt) {
      return { success: false, error: "Attempt not found" };
    }

    // Verify this attempt belongs to the logged-in child
    if (attempt.child_id !== childSession.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Get all questions with correct answers
    const { data: questions } = await supabase
      .from("exam_questions")
      .select("question_id, correct_option, marks")
      .eq("exam_id", attempt.exam_id)
      .eq("is_active", true);

    if (!questions) {
      return { success: false, error: "Questions not found" };
    }

    // Calculate score
    let scoreObtained = 0;
    let correctAnswers = 0;
    let wrongAnswers = 0;
    const answerRecords = [];

    for (const question of questions) {
      const studentAnswer = answers[question.question_id];
      const isCorrect = studentAnswer === question.correct_option;

      if (isCorrect) {
        scoreObtained += question.marks;
        correctAnswers++;
      } else if (studentAnswer) {
        wrongAnswers++;
      }

      answerRecords.push({
        attempt_id: attemptId,
        question_id: question.question_id,
        selected_option: studentAnswer || null,
        is_correct: isCorrect,
        marks_obtained: isCorrect ? question.marks : 0,
        answered_at: new Date().toISOString(),
      });
    }

    // Get exam details for pass/fail
    const { data: exam } = await supabase
      .from("exams")
      .select("pass_marks, total_marks")
      .eq("exam_id", attempt.exam_id)
      .single();

    const isPassed = exam ? scoreObtained >= exam.pass_marks : false;
    const percentage = exam ? (scoreObtained / exam.total_marks) * 100 : 0;

    // Calculate time taken in seconds
    const startTime = new Date(attempt.started_at).getTime();
    const endTime = Date.now();
    const durationSeconds = Math.round((endTime - startTime) / 1000);

    const answeredCount = Object.keys(answers).length;
    const skippedCount = questions.length - answeredCount;

    // Update attempt with results (matching schema column names)
    const { error: updateError } = await supabase
      .from("exam_attempts")
      .update({
        submitted_at: new Date().toISOString(),
        score_obtained: scoreObtained,
        is_passed: isPassed,
        percentage: percentage,
        duration_seconds: durationSeconds,
        answered_questions: answeredCount,
        correct_answers: correctAnswers,
        wrong_answers: wrongAnswers,
        skipped_questions: skippedCount,
        status: "SUBMITTED",
      })
      .eq("attempt_id", attemptId);

    if (updateError) {
      console.error("Error updating attempt:", updateError);
      return { success: false, error: updateError.message };
    }

    // Insert all answers
    const { error: answersError } = await supabase
      .from("exam_answers")
      .insert(answerRecords);

    if (answersError) {
      console.error("Error inserting answers:", answersError);
    }

    // Update exam total_attempts count
    await supabase.rpc("increment_exam_attempts", {
      exam_id_param: attempt.exam_id,
    });

    revalidatePath("/study");
    return { success: true };
  } catch (error: any) {
    console.error("Submit exam attempt error:", error);
    return {
      success: false,
      error: error.message || "Failed to submit exam",
    };
  }
}

// ==================== EXAM RESULTS ====================

// Get available exams for students (published exams only)
export async function getAvailableExams() {
  try {
    const { data: exams, error } = await supabase
      .from("exams")
      .select(
        `
        exam_id,
        title,
        description,
        subject,
        duration_minutes,
        total_marks,
        pass_marks,
        is_free,
        price,
        total_questions,
        suggested_age_min,
        suggested_age_max,
        school:schools!exams_school_id_fkey (
          school_id,
          name,
          logo_url
        )
      `,
      )
      .eq("is_published", true)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching available exams:", error);
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: exams || [] };
  } catch (error: any) {
    console.error("Get available exams error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch exams",
      data: [],
    };
  }
}

export async function getExamResults(examId: string) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Not authenticated", data: [] };
    }

    // Verify ownership
    const { data: exam } = await supabase
      .from("exams")
      .select("school_id")
      .eq("exam_id", examId)
      .single();

    if (!exam) {
      return { success: false, error: "Exam not found", data: [] };
    }

    const { data: school } = await supabase
      .from("schools")
      .select("school_id")
      .eq("clerk_id", user.id)
      .single();

    if (!school || school.school_id !== exam.school_id) {
      return { success: false, error: "Unauthorized", data: [] };
    }

    // Get all attempts with child details
    const { data, error } = await supabase
      .from("exam_attempts")
      .select(
        `
        *,
        child:children!exam_attempts_child_id_fkey (
          child_id,
          name,
          username,
          avatar,
          age,
          school_name,
          city,
          country
        )
      `,
      )
      .eq("exam_id", examId)
      .order("submitted_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching exam results:", error);
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error("Get exam results error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch results",
      data: [],
    };
  }
}

export async function getExamAttemptDetails(attemptId: string) {
  try {
    const user = await currentUser();
    if (!user) {
      return { success: false, error: "Not authenticated", data: null };
    }

    // Get attempt with all details
    const { data: attempt, error: attemptError } = await supabase
      .from("exam_attempts")
      .select(
        `
        *,
        child:children!exam_attempts_child_id_fkey (
          child_id,
          name,
          username,
          avatar,
          age,
          school_name
        ),
        exam:exams!exam_attempts_exam_id_fkey (
          exam_id,
          title,
          school_id
        )
      `,
      )
      .eq("attempt_id", attemptId)
      .single();

    if (attemptError || !attempt) {
      return { success: false, error: "Attempt not found", data: null };
    }

    // Verify ownership
    const { data: school } = await supabase
      .from("schools")
      .select("school_id")
      .eq("clerk_id", user.id)
      .single();

    if (!school || school.school_id !== attempt.exam.school_id) {
      return { success: false, error: "Unauthorized", data: null };
    }

    // Get all answers with question details
    const { data: answers, error: answersError } = await supabase
      .from("exam_answers")
      .select(
        `
        *,
        question:exam_questions!exam_answers_question_id_fkey (
          question_id,
          question_text,
          option_a,
          option_b,
          option_c,
          option_d,
          correct_option,
          marks,
          explanation
        )
      `,
      )
      .eq("attempt_id", attemptId)
      .order("answered_at", { ascending: true });

    if (answersError) {
      console.error("Error fetching answers:", answersError);
    }

    return {
      success: true,
      data: {
        attempt,
        answers: answers || [],
      },
    };
  } catch (error: any) {
    console.error("Get attempt details error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch attempt details",
      data: null,
    };
  }
}

// Get student's exam result
export async function getStudentExamResult(attemptId: string) {
  try {
    // Import getChildSession from auth
    const { getChildSession } = await import("./auth");
    const childSession = await getChildSession();

    if (!childSession) {
      return { success: false, error: "Not authenticated", data: null };
    }

    const { data: attempt, error } = await supabase
      .from("exam_attempts")
      .select(
        `
        *,
        exam:exams!exam_attempts_exam_id_fkey (
          exam_id,
          title,
          total_marks,
          pass_marks,
          total_questions,
          school:schools!exams_school_id_fkey (
            name,
            logo_url
          )
        )
      `,
      )
      .eq("attempt_id", attemptId)
      .single();

    if (error || !attempt) {
      return { success: false, error: "Result not found", data: null };
    }

    // Verify this attempt belongs to the logged-in child
    if (attempt.child_id !== childSession.id) {
      return { success: false, error: "Unauthorized", data: null };
    }

    return { success: true, data: attempt };
  } catch (error: any) {
    console.error("Get student exam result error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch result",
      data: null,
    };
  }
}
