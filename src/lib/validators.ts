// lib/validators.ts
export function validateEmail(email: string): string | undefined {
    if (!email) return "Email không được để trống";
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!ok) return "Email không hợp lệ";
  }
  
  export function passwordErrors(pw: string): string[] {
    const errs: string[] = [];
    if (!pw || pw.length < 6) errs.push("Mật khẩu phải ≥ 6 ký tự");
    // mở rộng rule nếu muốn: có số, ký tự hoa, đặc biệt...
    return errs;
  }
  