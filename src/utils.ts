import { differenceInYears, parseISO } from 'date-fns';

export const calculateAge = (birthDate: string) => {
  if (!birthDate) return null;
  try {
    return differenceInYears(new Date(), parseISO(birthDate));
  } catch (e) {
    return null;
  }
};

export const formatWhatsApp = (phone: string) => {
  const cleaned = ('' + phone).replace(/\D/g, '');
  const match = cleaned.match(/^(\d{2})(\d{1})(\d{4})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]} ${match[3]}-${match[4]}`;
  }
  return phone;
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 1 }).format(value / 100);
};

export const GRUPOS = ['Fora da Igreja', 'Igreja / Pastores'];
export const SITUACOES = ['ativo', 'em acompanhamento', 'pendente', 'inativo'];
export const COMPROMISSOS = ['Será vereador', 'Prefeito', 'Conselho Tutelar', 'indefinido'];
export const PRIORIDADES = ['alta', 'média', 'baixa'];
