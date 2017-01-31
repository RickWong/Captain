export const escapeShell = (arg) => `'${arg.replace(/(["\s'$\`\\])/g, "\\$1")}'`;
