import BackButton from "@/app/components/BackButton";
import PageHeader from "@/app/components/PageHeader";
import RecursosContent from "./RecursosContent";

export default function RecursosPage() {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-0 overflow-hidden px-4 pt-2 pb-2 lg:px-6 lg:pt-3 lg:pb-6">
      <PageHeader>
        <BackButton href="/" label="Inicio" />
        <h1 className="text-sm font-bold leading-tight tracking-tight text-foreground sm:text-base">
          Recursos RAF
        </h1>
        <p className="text-xs leading-snug text-foreground/70 sm:text-sm">
          Perfiles lectores, estrategias e intervenciones por nivel de lectura
        </p>
      </PageHeader>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden pt-1">
        <RecursosContent />
      </div>
    </div>
  );
}
