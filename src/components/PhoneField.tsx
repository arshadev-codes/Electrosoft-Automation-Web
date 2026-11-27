import { useEffect, useMemo, useRef } from "react";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { isValidPhoneNumber } from "libphonenumber-js";

interface PhoneFieldProps {
  value: string;
  onChange: (e164: string) => void;
  defaultCountry?: string;
  required?: boolean;
  invalid?: boolean;
}

/** Checks whether a phone string has digits beyond just a bare country dial code (e.g. "+91") */
export function hasPhoneDigits(val: string): boolean {
  const trimmed = val.trim();
  if (!trimmed) return false;
  return !/^\+\d{1,4}$/.test(trimmed);
}

export function isPhoneValid(val: string): boolean {
  if (!hasPhoneDigits(val)) return false;
  try {
    return isValidPhoneNumber(val);
  } catch {
    return false;
  }
}

export default function PhoneField({
  value,
  onChange,
  defaultCountry = "in",
  required = false,
  invalid = false,
}: PhoneFieldProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const hasDigits = hasPhoneDigits(value);
  const isValid = useMemo(() => {
    if (!hasDigits) return !required;
    return isPhoneValid(value);
  }, [value, hasDigits, required]);

  useEffect(() => {
    const dd = wrapRef.current?.querySelector<HTMLElement>(
      ".react-international-phone-country-selector-dropdown"
    );
    if (!dd) return;
    dd.setAttribute("data-lenis-prevent", "true");
    dd.setAttribute("data-lenis-prevent-wheel", "true");
    dd.setAttribute("data-lenis-prevent-touch", "true");
    const stopWheel = (e: WheelEvent) => e.stopPropagation();
    dd.addEventListener("wheel", stopWheel, { passive: true });
    return () => dd.removeEventListener("wheel", stopWheel);
  }, []);

  return (
    <div ref={wrapRef} className={`ct-phone-field${invalid || (hasDigits && !isValid) ? " bad" : ""}`}>
      <PhoneInput
        defaultCountry={defaultCountry}
        value={value}
        onChange={(phone) => onChange(phone)}
        inputProps={{
          type: "tel",
          autoComplete: "tel",
          name: "phone",
          "data-check": "reach",
          "aria-invalid": invalid || (hasDigits && !isValid),
        } as React.InputHTMLAttributes<HTMLInputElement>}
      />
    </div>
  );
}
