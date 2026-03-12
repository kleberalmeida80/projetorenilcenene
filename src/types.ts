export type Perfil = 'Administrador' | 'Coordenador Geral' | 'Coordenador de Grupo' | 'Operador' | 'Visualização';
export type Grupo = 'Fora da Igreja' | 'Igreja / Pastores';
export type Situacao = 'ativo' | 'em acompanhamento' | 'pendente' | 'inativo';
export type Compromisso = 'Será vereador' | 'Prefeito' | 'Conselho Tutelar' | 'indefinido';
export type Prioridade = 'alta' | 'média' | 'baixa';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
  grupo?: Grupo;
}

export interface Lideranca {
  id: number;
  grupo: Grupo;
  nome_lideranca: string;
  data_aniversario: string;
  idade?: number;
  fone_zap: string;
  cidade: string;
  bairro: string;
  indicacao: string;
  acompanhado_por: string;
  situacao: Situacao;
  demanda_recebida: string;
  compromisso_politico: Compromisso;
  percentual_votos_municipio: number;
  ultima_visita: string;
  votos_nene: number;
  votos_renilce: number;
  observacoes: string;
  responsavel_cadastro: string;
  data_cadastro: string;
  data_atualizacao: string;
  proxima_visita: string;
  prioridade: Prioridade;
}

export interface Agenda {
  id: number;
  titulo: string;
  data: string;
  hora: string;
  cidade: string;
  local: string;
  descricao: string;
  aviso: boolean;
  status: 'confirmado' | 'pendente' | 'cancelado';
  data_cadastro: string;
}

export interface Stats {
  total: number;
  foraIgreja: number;
  igreja: number;
  votosNene: number;
  votosRenilce: number;
  rankingCidades: { cidade: string; total_votos: number }[];
  rankingBairros: { bairro: string; total_votos: number }[];
}
