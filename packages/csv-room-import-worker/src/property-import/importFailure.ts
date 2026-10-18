
export class ImportFailure extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportFailure";
  }
}