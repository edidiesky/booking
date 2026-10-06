import type { PoolClient } from "pg";
import { AppError } from "../../utils/AppError";
import {
  ledgerRepository,
  type LedgerEntryInput,
} from "./ledger.repository";

export const ledgerService = {
  async recordPaymentReceived(
    client: PoolClient,
    bookingId: string,
    paymentId: string | undefined,
    tenantId: string,
    amountNgn: number,
  ): Promise<string> {
    return ledgerRepository.recordTransaction(
      client,
      "payment_received",
      [
        {
          accountType: "gateway_clearing",
          tenantId: null,
          debitNgn: amountNgn,
        },
        {
          accountType: "escrow_held",
          tenantId,
          creditNgn: amountNgn,
        },
      ],
      { bookingId, paymentId },
    );
  },

  async recordEscrowRelease(
    client: PoolClient,
    bookingId: string,
    tenantId: string,
    totalAmountNgn: number,
    platformFeeNgn: number,
  ): Promise<string> {
    const hostAmountNgn = totalAmountNgn - platformFeeNgn;
    if (hostAmountNgn < 0) {
      throw AppError.badRequest("Platform fee exceeds total amount.");
    }

    return ledgerRepository.recordTransaction(
      client,
      "escrow_release",
      [
        {
          accountType: "escrow_held",
          tenantId,
          debitNgn: totalAmountNgn,
        },
        {
          accountType: "host_payable",
          tenantId,
          creditNgn: hostAmountNgn,
        },
        {
          accountType: "platform_revenue",
          tenantId: null,
          creditNgn: platformFeeNgn,
        },
      ],
      {
        bookingId,
        metadata: { totalAmountNgn, platformFeeNgn, hostAmountNgn },
      },
    );
  },

  async recordPayout(
    client: PoolClient,
    bookingId: string,
    tenantId: string,
    amountNgn: number,
  ): Promise<string> {
    return ledgerRepository.recordTransaction(
      client,
      "payout",
      [
        {
          accountType: "host_payable",
          tenantId,
          debitNgn: amountNgn,
        },
        {
          accountType: "cash_paid_out",
          tenantId,
          creditNgn: amountNgn,
        },
      ],
      { bookingId },
    );
  },

  async recordRefund(
    client: PoolClient,
    bookingId: string,
    tenantId: string,
    refundAmountNgn: number,
  ): Promise<string> {
    const heldBalance = await ledgerRepository.getLockedBookingBalance(
      bookingId,
      "escrow_held",
      client,
    );

    if (refundAmountNgn > heldBalance) {
      throw AppError.badRequest(
        `Refund of ${refundAmountNgn} exceeds held escrow balance of ${heldBalance} for this booking.`,
      );
    }

    return ledgerRepository.recordTransaction(
      client,
      "refund",
      [
        {
          accountType: "escrow_held",
          tenantId,
          debitNgn: refundAmountNgn,
        },
        {
          accountType: "gateway_clearing",
          tenantId: null,
          creditNgn: refundAmountNgn,
        },
      ],
      { bookingId, metadata: { refundAmountNgn } },
    );
  },

  async recordChargeback(
    client: PoolClient,
    bookingId: string,
    tenantId: string,
    chargebackAmountNgn: number,
  ): Promise<string> {
    const heldBalance = await ledgerRepository.getLockedBookingBalance(
      bookingId,
      "escrow_held",
      client,
    );
    const paidOutBalance = await ledgerRepository.getLockedBookingBalance(
      bookingId,
      "cash_paid_out",
      client,
    );

    const entries: LedgerEntryInput[] = [
      {
        accountType: "gateway_clearing",
        tenantId: null,
        creditNgn: chargebackAmountNgn,
      },
    ];

    if (heldBalance >= chargebackAmountNgn) {
      entries.push({
        accountType: "escrow_held",
        tenantId,
        debitNgn: chargebackAmountNgn,
      });
    } else if (paidOutBalance >= chargebackAmountNgn) {
      entries.push({
        accountType: "host_clawback_receivable",
        tenantId,
        debitNgn: chargebackAmountNgn,
      });
    } else {
      entries.push({
        accountType: "chargeback_loss",
        tenantId: null,
        debitNgn: chargebackAmountNgn,
      });
    }

    return ledgerRepository.recordTransaction(
      client,
      "chargeback",
      entries,
      {
        bookingId,
        metadata: { chargebackAmountNgn, heldBalance, paidOutBalance },
      },
    );
  },
};