import 'dotenv/config';

function required(key: string): string {
  const v = process.env[key];
  if (!v || v.length === 0) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${key}`);
  }
  return v;
}

export const env = {
  PORT: Number(process.env.PORT ?? 3001),
  MONGODB_URI: required('MONGODB_URI'),
  JWT_SECRET: required('JWT_SECRET'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  BCRYPT_ROUNDS: Number(process.env.BCRYPT_ROUNDS ?? 10),
};
