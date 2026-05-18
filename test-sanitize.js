const sanitizeInput = (input) => {
  let sanitized = input.replace(/<[^>]*>/g, "");
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");
  sanitized = sanitized.replace(/javascript:/gi, "");
  return sanitized;
};

console.log('Input: "!"');
console.log('Output:', JSON.stringify(sanitizeInput('!')));
console.log('Trimmed length:', sanitizeInput('!').trim().length);
console.log('Is valid:', sanitizeInput('!').trim().length > 0);
