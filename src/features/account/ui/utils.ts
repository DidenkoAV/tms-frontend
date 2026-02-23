export function pwScore(pw: string) {
  let s = 0;
  if (pw.length >= 8) s += 1;
  if (pw.length >= 12) s += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s += 1;
  if (/\d/.test(pw)) s += 1;
  if (/[^A-Za-z0-9]/.test(pw)) s += 1;
  const level = s <= 1 ? "Weak" : s === 2 ? "Okay" : s === 3 ? "Strong" : "Great";
  const pct = Math.min(100, (s / 5) * 100);
  const cls = level === "Weak" ? "bg-rose-500" : level === "Okay" ? "bg-amber-400" : level === "Strong" ? "bg-emerald-500" : "bg-sky-500";
  return { level, pct, cls };
}

export function validateNewPw(pw: string, ctx: { email?: string; name?: string }) {
  const errs: string[] = [];
  if (pw.length < 8) errs.push("At least 8 characters");
  if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw)) errs.push("Upper & lower case");
  if (!/\d/.test(pw)) errs.push("At least one digit");
  if (!/[^A-Za-z0-9]/.test(pw)) errs.push("At least one symbol");
  const low = pw.toLowerCase();
  const common = ["password","123456","qwerty","letmein","admin","welcome","test123","111111","123123","abc123"];
  if (common.includes(low)) errs.push("Not a common password");
  if (ctx.email) {
    const local = ctx.email.toLowerCase().split("@")[0];
    if (local.length >= 3 && low.includes(local)) errs.push("Must not contain your email/username");
  }
  if (ctx.name) {
    ctx.name.toLowerCase().split(/\s+/).forEach(part => {
      if (part.length >= 3 && low.includes(part)) errs.push("Must not contain your name");
    });
  }
  return errs;
}
