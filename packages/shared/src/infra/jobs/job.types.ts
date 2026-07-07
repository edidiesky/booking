export type JobState = "queued" | "processing" | "done" | "error";

export interface JobProgress<TResult = unknown> {
  jobId:      string;
  jobType:    string;
  state:      JobState;
  progress:   number;
  stage?:     string;
  result?:    TResult;
  error?:     string;
  updatedAt:  string;
}