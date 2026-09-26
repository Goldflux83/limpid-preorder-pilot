alter table participant_codes
  drop constraint participant_codes_code_check,
  add constraint participant_codes_code_check
    check (code ~ '^[A-HJ-KM-NP-Z2-9]{2}-[A-HJ-KM-NP-Z2-9]{4}$');
