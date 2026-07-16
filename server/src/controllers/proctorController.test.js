const createResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("logProctorEvent", () => {
  let logProctorEvent;
  let Submission;

  const createRequest = (overrides = {}) => ({
    params: { id: "submission-1" },
    body: { type: "paste" },
    user: { _id: "candidate-1" },
    ...overrides,
  });

  const createSubmission = (overrides = {}) => ({
    candidateId: { toString: jest.fn().mockReturnValue("candidate-1") },
    status: "in_progress",
    proctorLog: {
      events: {
        push: jest.fn(),
      },
    },
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  });

  beforeEach(() => {
    // Reloading the controller creates a fresh in-memory rate-limit map.
    jest.resetModules();
    jest.clearAllMocks();

    jest.doMock("../models/submission.model", () => ({
      findById: jest.fn(),
    }));

    Submission = require("../models/submission.model");
    ({ logProctorEvent } = require("./proctorController"));
  });

  test("returns 400 when the event type is missing", async () => {
    const req = createRequest({ body: {} });
    const res = createResponse();

    await logProctorEvent(req, res);

    expect(Submission.findById).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Invalid or missing event type",
    });
  });

  test("returns 400 when the event type is invalid", async () => {
    const req = createRequest({ body: { type: "invalid_event" } });
    const res = createResponse();

    await logProctorEvent(req, res);

    expect(Submission.findById).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Invalid or missing event type",
    });
  });

  test("returns 404 when the submission is not found", async () => {
    Submission.findById.mockResolvedValue(null);
    const req = createRequest();
    const res = createResponse();

    await logProctorEvent(req, res);

    expect(Submission.findById).toHaveBeenCalledWith("submission-1");
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Submission not found" });
  });

  test("returns 403 when the user does not own the submission", async () => {
    const submission = createSubmission({
      candidateId: { toString: jest.fn().mockReturnValue("other-candidate") },
    });
    Submission.findById.mockResolvedValue(submission);

    const res = createResponse();
    await logProctorEvent(createRequest(), res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Not authorized" });
    expect(submission.proctorLog.events.push).not.toHaveBeenCalled();
    expect(submission.save).not.toHaveBeenCalled();
  });

  test('returns 409 when submission status is not "in_progress"', async () => {
    const submission = createSubmission({ status: "submitted" });
    Submission.findById.mockResolvedValue(submission);

    const res = createResponse();
    await logProctorEvent(createRequest(), res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: "Submission is not in progress",
    });
    expect(submission.proctorLog.events.push).not.toHaveBeenCalled();
    expect(submission.save).not.toHaveBeenCalled();
  });

  test("returns 429 when events are sent less than one second apart", async () => {
    const submission = createSubmission();
    Submission.findById.mockResolvedValue(submission);

    const firstRes = createResponse();
    const secondRes = createResponse();

    await logProctorEvent(createRequest(), firstRes);
    await logProctorEvent(createRequest(), secondRes);

    expect(firstRes.status).toHaveBeenCalledWith(201);
    expect(secondRes.status).toHaveBeenCalledWith(429);
    expect(secondRes.json).toHaveBeenCalledWith({
      error: "Too many requests, slow down",
    });
    expect(submission.proctorLog.events.push).toHaveBeenCalledTimes(1);
    expect(submission.save).toHaveBeenCalledTimes(1);
  });

  test("logs a valid event and returns 201", async () => {
    const submission = createSubmission();
    Submission.findById.mockResolvedValue(submission);

    const req = createRequest({ body: { type: "tab_switch" } });
    const res = createResponse();

    await logProctorEvent(req, res);

    expect(Submission.findById).toHaveBeenCalledWith("submission-1");
    expect(submission.proctorLog.events.push).toHaveBeenCalledWith({
      type: "tab_switch",
    });
    expect(submission.save).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  test("returns 500 when saving the submission fails", async () => {
    const submission = createSubmission({
      save: jest.fn().mockRejectedValue(new Error("Database save failed")),
    });
    Submission.findById.mockResolvedValue(submission);
    const consoleError = jest.spyOn(console, "error").mockImplementation();

    const res = createResponse();
    await logProctorEvent(createRequest(), res);

    expect(submission.proctorLog.events.push).toHaveBeenCalledWith({
      type: "paste",
    });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });

    consoleError.mockRestore();
  });

  test("returns 500 when Submission.findById throws an unexpected error", async () => {
    Submission.findById.mockRejectedValue(new Error("Database unavailable"));
    const consoleError = jest.spyOn(console, "error").mockImplementation();

    const res = createResponse();
    await logProctorEvent(createRequest(), res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });

    consoleError.mockRestore();
  });
});
