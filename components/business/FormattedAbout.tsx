import type { ReactNode } from 'react';
import { parseAboutMarkup, type AboutNode } from '@/lib/businessAbout';

function renderNodes(nodes: AboutNode[]): ReactNode {
  return nodes.map((node, index) => {
    const key = `${node.type}-${index}`;
    if (node.type === 'text') return <span key={key}>{node.text}</span>;
    if (node.type === 'break') return <br key={key} />;
    if (node.type === 'bold') return <strong key={key}>{renderNodes(node.children)}</strong>;
    if (node.type === 'italic') return <em key={key}>{renderNodes(node.children)}</em>;
    return <u key={key}>{renderNodes(node.children)}</u>;
  });
}

export default function FormattedAbout({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return <span className={className}>{renderNodes(parseAboutMarkup(text))}</span>;
}
