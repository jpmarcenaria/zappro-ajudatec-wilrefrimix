export function validateTutorialResponse(text: string): {
    valid: boolean;
    errors: string[];
    sanitized: string;
} {
    const errors: string[] = [];

    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length > 6) errors.push('Response too long (>6 lines)');

    const forbidden = [
        /consult(e|ar).{0,10}manual/i,
        /verif(ique|icar).{0,10}manual/i,
        /check.{0,10}manual/i
    ];

    forbidden.forEach(pattern => {
        if (pattern.test(text)) errors.push('Manual reference detected');
    });

    const hasEmoji = /🔧|📊|⚠️|⚡/.test(text);
    const hasQuestion = /\?/.test(text);

    if (!hasEmoji) errors.push('Missing structure emojis');
    if (!hasQuestion) errors.push('Missing next question');

    const sanitized = text
        .replace(/consult(e|ar).{0,10}manual/gi, 'consulte o banco de dados')
        .trim();

    return { valid: errors.length === 0, errors, sanitized };
}
