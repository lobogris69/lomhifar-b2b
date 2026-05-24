import { FileSpreadsheet } from 'lucide-react';
import { ImportForm } from './ImportForm';

export const metadata = { title: 'Importar Excel · Admin Lomhifar' };

export default function ImportPage() {
  return (
    <div className="p-6 lg:p-10 max-w-5xl">
      <div className="mb-6 flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <FileSpreadsheet className="h-5 w-5" />
        </span>
        <div>
          <h1 className="section-title">Importar clientes desde Excel</h1>
          <p className="section-subtitle">
            Suba el archivo. El sistema previsualizará los datos y, tras confirmar,
            sincronizará la base de clientes.
          </p>
        </div>
      </div>
      <ImportForm />
    </div>
  );
}
