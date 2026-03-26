'use client';

import type { Empresa } from '@/types';

interface Props {
  empresas: Empresa[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export default function EmpresaSelector({ empresas, selectedId, onSelect }: Props) {
  return (
    <div className="animate-fade-in-up">
      <h2
        style={{
          fontSize: '1.5rem',
          fontWeight: 800,
          marginBottom: 20,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
        }}
      >
        🏢 Empresas con Convenio
      </h2>
      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => onSelect(null)}
          className={selectedId === null ? 'btn-primary' : 'btn-outline'}
          style={{
            fontSize: '0.88rem',
            padding: '10px 22px',
          }}
        >
          Todas
        </button>
        {empresas.map((empresa) => (
          <button
            key={empresa.id}
            onClick={() => onSelect(empresa.id)}
            className={selectedId === empresa.id ? 'btn-primary' : 'btn-outline'}
            style={{
              fontSize: '0.88rem',
              padding: '10px 22px',
            }}
          >
            {empresa.nombre}
          </button>
        ))}
      </div>
    </div>
  );
}
