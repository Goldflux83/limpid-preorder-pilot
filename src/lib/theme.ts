export const theme = { name: "Limpid & Co", pilotLabel: "pilot", colors: { primary: "#003082", accent: "#FFC917", surface: "#FFFFFF", ink: "#252525" }, contactPhone: "Nog in te vullen" } as const;
export const emailInfrastructureConfigured = Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
