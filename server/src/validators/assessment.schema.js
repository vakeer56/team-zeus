const { z } = require("zod");

const testCaseSchema = z
    .object({
        input: z.string().trim().min(1, "Test case input is required"),
        expectedOutput: z.string().trim().min(1, "Test case expected output is required"),
    })
    .strict();

const questionSchema = z
    .object({
        question: z.string().trim().min(5, "Question text must be at least 5 characters"),
        type: z.enum(["MCQ", "CODE"], {
            required_error: "Question type is required",
            invalid_type_error: "Question type must be MCQ or CODE",
        }),
        marks: z.number().int().positive("Marks must be a positive integer").default(1),
        options: z.array(z.string().trim().min(1, "Option text must not be empty")).optional(),
        correctOptionIndex: z.number().int().min(0, "Correct option index must be 0 or greater").optional(),
        starterCode: z.string().trim().optional(),
        language: z.string().trim().min(1, "Language is required for CODE questions").optional(),
        sampleTestCases: z.array(testCaseSchema).optional(),
        hiddenTestCases: z.array(testCaseSchema).optional(),
    })
    .strict()
    .superRefine((question, ctx) => {
        if (question.type === "MCQ") {
            if (!question.options || question.options.length < 2) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["options"],
                    message: "MCQ questions require at least 2 options",
                });
            }

            if (typeof question.correctOptionIndex !== "number") {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["correctOptionIndex"],
                    message: "MCQ questions require correctOptionIndex",
                });
            }

            if (question.starterCode !== undefined) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["starterCode"],
                    message: "starterCode is not allowed for MCQ questions",
                });
            }

            if (question.hiddenTestCases !== undefined) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["hiddenTestCases"],
                    message: "hiddenTestCases is not allowed for MCQ questions",
                });
            }
        }

        if (question.type === "CODE") {
            if (!question.language) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["language"],
                    message: "language is required for CODE questions",
                });
            }

            if (!question.sampleTestCases || question.sampleTestCases.length < 1) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["sampleTestCases"],
                    message: "CODE questions require at least one sampleTestCases entry",
                });
            }

            if (!question.hiddenTestCases || question.hiddenTestCases.length < 1) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["hiddenTestCases"],
                    message: "CODE questions require at least one hiddenTestCases entry",
                });
            }

            if (question.correctOptionIndex !== undefined) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["correctOptionIndex"],
                    message: "correctOptionIndex is not allowed for CODE questions",
                });
            }

            if (question.options !== undefined) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["options"],
                    message: "options is not allowed for CODE questions",
                });
            }
        }
    });

const createAssessmentSchema = z
    .object({
        title: z.string().trim().min(3, "Title must be at least 3 characters"),
        description: z.string().trim().min(1, "Description is required"),
        duration: z.number().int().positive("Duration must be a positive integer"),
        difficulty: z.enum(["easy", "medium", "hard"], {
            required_error: "Difficulty is required",
            invalid_type_error: "Difficulty must be easy, medium, or hard",
        }),
        status: z.enum(["draft", "published", "archived"], {
            required_error: "Status is required",
            invalid_type_error: "Status must be draft, published, or archived",
        }),
        questions: z.array(questionSchema).min(1, "At least one question is required"),
    })
    .strict();

const updateAssessmentSchema = z
    .object({
        title: z.string().trim().min(3, "Title must be at least 3 characters").optional(),
        description: z.string().trim().min(1, "Description is required").optional(),
        duration: z.number().int().positive("Duration must be a positive integer").optional(),
        difficulty: z.enum(["easy", "medium", "hard"], {
            invalid_type_error: "Difficulty must be easy, medium, or hard",
        }).optional(),
        status: z.enum(["draft", "published", "archived"], {
            invalid_type_error: "Status must be draft, published, or archived",
        }).optional(),
        questions: z.array(questionSchema).min(1, "At least one question is required").optional(),
    })
    .strict();

module.exports = {
    createAssessmentSchema,
    updateAssessmentSchema,
};
