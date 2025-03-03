export interface Cliente {
  id: number;
  denominazione: string;
  referente: string;
  cellulare: string;
  email: string;
  ufficio?: string;
  indirizzo?: string;
  citta?: string;
  cap?: string;
  provincia?: string;
  codice_fiscale?: string;
  partita_iva?: string;
  pec?: string;
  codice_univoco?: string;
  sito_web?: string;
  note?: string;
  created_at: string;
}

export interface ClienteInsert {
  denominazione: string;
  referente: string;
  cellulare: string;
  email: string;
  ufficio?: string;
  indirizzo?: string;
  citta?: string;
  cap?: string;
  provincia?: string;
  codice_fiscale?: string;
  partita_iva?: string;
  pec?: string;
  codice_univoco?: string;
  sito_web?: string;
  note?: string;
}

export interface Affidamento {
  id: number;
  anno: number;
  determina: string;
  numero_determina?: string;
  cig?: string;
  data?: string;
  data_termine?: string;
  cliente_id: number;
  descrizione: string;
  stato: string;
  quantita: number;
  prezzo_unitario: number;
  imponibile: number;
  iva: number;
  totale: number;
  has_provvigione?: boolean;
  tipo_provvigione?: 'attiva' | 'passiva';
  partner_provvigione?: string;
  percentuale_provvigione?: number;
  importo_provvigione?: number;
  created_at: string;
  clienti?: {
    denominazione: string;
  };
}

export interface AffidamentoInsert {
  anno: number;
  determina: string;
  numero_determina?: string;
  cig?: string;
  data?: string;
  data_termine?: string;
  cliente_id: number;
  descrizione: string;
  stato: string;
  quantita: number;
  prezzo_unitario: number;
  imponibile: number;
  iva: number;
  totale: number;
  has_provvigione?: boolean;
  tipo_provvigione?: 'attiva' | 'passiva';
  partner_provvigione?: string;
  percentuale_provvigione?: number;
  importo_provvigione?: number;
}

export interface Fatturazione {
  id: number;
  affidamento_id: number;
  percentuale: number;
  importo: number;
  data_scadenza: string;
  stato: string;
  numero_fattura?: string;
  data_emissione?: string;
  data_pagamento?: string;
  note?: string;
  created_at: string;
}

export interface FatturazioneInsert {
  affidamento_id: number;
  percentuale: number;
  importo: number;
  data_scadenza: string;
  stato: string;
  numero_fattura?: string;
  data_emissione?: string;
  data_pagamento?: string;
  note?: string;
}

export interface Partner {
  id: number;
  nome: string;
  created_at: string;
}

export interface PartnerInsert {
  nome: string;
}

export interface Tecnico {
  id: number;
  nome: string;
  codice_fiscale?: string;
  attivo?: boolean;
  data_attivazione?: string;
  created_at: string;
}

export interface TecnicoInsert {
  nome: string;
  codice_fiscale?: string;
  attivo?: boolean;
  data_attivazione?: string;
}

export interface Fascia {
  id: number;
  nome: string;
  tariffa: number;
  descrizione?: string;
  min_cedolini?: number;
  max_cedolini?: number;
  ore?: number;
  anno?: number;
  created_at: string;
}

export interface FasciaInsert {
  nome: string;
  tariffa: number;
  descrizione?: string;
  min_cedolini?: number;
  max_cedolini?: number;
  ore?: number;
  anno?: number;
}

export interface Mese {
  id: number;
  descrizione: string;
}

export interface Rendicontazione {
  id: number;
  partner: string;
  nome_tecnico: string;
  mese: string;
  id_mese?: number;
  anno: number;
  codice_cliente: string;
  nome_cliente: string;
  numero_commessa?: string;
  numero_cedolini: number;
  numero_cedolini_extra: number;
  totale_cedolini: number;
  fascia: string;
  importo: number;
  stato?: string;
  numero_fattura?: string;
  anno_fattura?: number;
  data_fattura?: string;
  created_at: string;
}

export interface RendicontazioneInsert {
  partner: string;
  nome_tecnico: string;
  mese: string;
  id_mese?: number;
  anno: number;
  codice_cliente: string;
  nome_cliente: string;
  numero_commessa?: string;
  numero_cedolini: number;
  numero_cedolini_extra: number;
  totale_cedolini: number;
  fascia: string;
  importo: number;
  stato?: string;
  numero_fattura?: string;
  anno_fattura?: number;
  data_fattura?: string;
}

export interface ClienteServicePaghe {
  id: number;
  codice_cliente: string;
  nome_cliente: string;
  numero_commessa?: string;
  data_attivazione?: string;
  data_cessazione?: string;
  tipo_servizio?: string;
  software?: string;
  fascia?: string;
  adempimenti?: string;
  referente?: string;
  altre_informazioni?: string;
  partner?: string;
  cedolini_previsti?: number;
  fascia_personalizzata?: boolean;
  url_gestionale?: string;
  login_gestionale?: string;
  password_gestionale?: string;
  created_at: string;
}

export interface ClienteServicePagheInsert {
  codice_cliente: string;
  nome_cliente: string;
  numero_commessa?: string;
  data_attivazione?: string;
  data_cessazione?: string;
  tipo_servizio?: string;
  software?: string;
  fascia?: string;
  adempimenti?: string;
  referente?: string;
  altre_informazioni?: string;
  partner?: string;
  cedolini_previsti?: number;
  fascia_personalizzata?: boolean;
  url_gestionale?: string;
  login_gestionale?: string;
  password_gestionale?: string;
}

export interface ClienteDocumento {
  id: number;
  cliente_id: number;
  nome_file: string;
  tipo_file: string;
  dimensione: number;
  url: string;
  data_caricamento: string;
  descrizione?: string;
  created_at: string;
}

export interface ClienteDocumentoInsert {
  cliente_id: number;
  nome_file: string;
  tipo_file: string;
  dimensione: number;
  url: string;
  data_caricamento: string;
  descrizione?: string;
}

export interface AffidamentoDocumento {
  id: number;
  affidamento_id: number;
  nome_file: string;
  tipo_file: string;
  dimensione: number;
  url: string;
  data_caricamento: string;
  descrizione?: string;
  created_at: string;
}

export interface AffidamentoDocumentoInsert {
  affidamento_id: number;
  nome_file: string;
  tipo_file: string;
  dimensione: number;
  url: string;
  data_caricamento: string;
  descrizione?: string;
}