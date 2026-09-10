type BusinessProfileServicesSectionProps = {
  services: string[];
};

export default function BusinessProfileServicesSection({
  services,
}: BusinessProfileServicesSectionProps) {
  if (!services.length) {
    return <p className="mt-3 text-sm text-stone-400">No services listed.</p>;
  }

  const visible = services.slice(0, 10);

  return (
    <div className="mt-3 space-y-2">
      {visible.map((service, index) => (
        <div
          key={`${service}-${index}`}
          className="flex items-center gap-3 rounded-[14px] border border-stone-200/90 bg-white px-3 py-3"
        >
          <span className="w-7 shrink-0 text-xs font-bold tabular-nums text-[#d4a017]">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="min-w-0 text-sm font-semibold text-[#153551]">{service}</span>
        </div>
      ))}
    </div>
  );
}
