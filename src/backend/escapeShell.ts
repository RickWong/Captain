export const escapeShell = (arg: string) => `'${arg.replace(/(["\s'$\`\\])/g, "\\$1")}'`;
