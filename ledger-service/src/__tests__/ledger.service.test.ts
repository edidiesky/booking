import {
  LedgerValidationError,
  ngnToKobo,
  koboToNgn,
} from "../services/ledger.service";

describe("ledger.service money helpers (production)", () => {
  it("converts ngn to kobo without float drift for common amounts", () => {
    expect(ngnToKobo(10.5)).toBe(1050);
    expect(koboToNgn(1050)).toBe(10.5);
  });
});

describe("ledger.service validation rules (production errors)", () => {
  it("LedgerValidationError carries 400", () => {
    const err = new LedgerValidationError("bad fee");
    expect(err.status).toBe(400);
    expect(err.message).toBe("bad fee");
  });
});
