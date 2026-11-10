export type Role = 'admin' | 'user';
export type Sexo = 'Masculino' | 'Feminino';

export interface Profile {
  id: string;
  nome: string;
  sexo: Sexo | null;
  altura_cm: number | null;
  data_nascimento: string | null;
  role: Role;
}

export interface Medida {
  id: string;
  user_id: string;
  data: string;
  peso_kg: number;
  treinos_semana: number;
  superavit: number;
  proteina_g_kg: number;
  gordura_g_kg: number;
  fator_atividade: number;
}

export interface Alimento {
  id: number;
  nome: string;
  kcal: number;
  proteina_g: number;
  carboidrato_g: number;
  gordura_g: number;
  base: string | null;
  observacao: string | null;
  ativo: boolean;
}

export interface Refeicao {
  id: number;
  nome: string;
  ordem: number;
}

export interface Macros {
  kcal: number;
  proteina_g: number;
  carboidrato_g: number;
  gordura_g: number;
}

export interface OpcaoTotais extends Macros {
  opcao_id: number;
  refeicao_id: number;
  nome: string;
  ativo: boolean;
}

export interface ItemView {
  id: number;
  opcao_id: number;
  quantidade_g: number;
  ordem: number;
  alimentos: { nome: string } | null;
}

export interface ItemSnap extends Macros {
  alimento: string;
  quantidade_g: number;
}

export interface DiaRefeicao extends Macros {
  id: string;
  dia_id: string;
  refeicao_id: number | null;
  refeicao_nome: string;
  opcao_id: number | null;
  opcao_nome: string;
  itens: ItemSnap[];
}

export interface Dia {
  id: string;
  data: string;
  meta_kcal: number;
  meta_proteina_g: number;
  meta_carboidrato_g: number;
  meta_gordura_g: number;
  total_kcal: number;
  total_proteina_g: number;
  total_carboidrato_g: number;
  total_gordura_g: number;
}

export interface MetasRow extends Macros {
  medida_data: string;
  peso_kg: number;
  fator_atividade: number;
  superavit: number;
  tmb: number;
  get_kcal: number;
}
