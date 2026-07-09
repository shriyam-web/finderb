import { getServicePillIcon } from '@/lib/servicePillIcon';

type BusinessProfileServicesSectionProps = {
  services: string[];
};

export default function BusinessProfileServicesSection({
  services,
}: BusinessProfileServicesSectionProps) {
  if (!services.length) {
    return <p className="mt-3 text-sm text-stone-400">No services listed.</p>;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {services.map((service, index) => {
        const Icon = getServicePillIcon(service);
        return (
          <span
            key={service}
            className="service-pill-motion inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2 py-1 text-[11px] font-medium leading-tight text-stone-700 transition-transform duration-200 hover:-translate-y-0.5"
            style={{ animationDelay: `${index * 45}ms` }}
          >
            <Icon size={11} className="shrink-0 text-[#215481]" aria-hidden />
            <span className="whitespace-nowrap">{service}</span>
          </span>
        );
      })}
    </div>
  );
}
