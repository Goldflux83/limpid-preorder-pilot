"use client";

import Image from "next/image";
import { useActionState } from "react";
import { ui } from "@/config/content";
import { startTotpEnrollment, verifyTotpEnrollment } from "../actions";

export function MfaEnrollmentForm() {
  const [enrollment, enroll, enrolling] = useActionState(
    startTotpEnrollment,
    null
  );
  const [verification, verify, verifying] = useActionState(
    verifyTotpEnrollment,
    null
  );
  const error =
    verification?.error ??
    (enrollment && "error" in enrollment ? enrollment.error : null);

  if (!enrollment || "error" in enrollment) {
    return (
      <form action={enroll}>
        {error && (
          <p className="error-message" role="alert">
            {ui.adminMfa.errors[error]}
          </p>
        )}
        <button type="submit" disabled={enrolling}>
          {ui.adminMfa.startEnrollment}
        </button>
      </form>
    );
  }

  return (
    <form action={verify}>
      {error && (
        <p className="error-message" role="alert">
          {ui.adminMfa.errors[error]}
        </p>
      )}
      <p>{ui.adminMfa.scan}</p>
      <Image
        className="qr"
        src={enrollment.qrCode.trimEnd()}
        alt={ui.adminMfa.qrAlt}
        width={224}
        height={224}
        unoptimized
      />
      <p>{ui.adminMfa.manualKey}</p>
      <p className="mfa-secret">
        <code>{enrollment.secret}</code>
      </p>
      <input type="hidden" name="factorId" value={enrollment.factorId} />
      <label>
        {ui.adminMfa.code}
        <input
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
        />
      </label>
      <button type="submit" disabled={verifying}>
        {ui.adminMfa.completeEnrollment}
      </button>
    </form>
  );
}
