import React from 'react';
import * as Icons from 'lucide-react';
import { LucideProps } from 'lucide-react';

interface IconRendererProps extends LucideProps {
  name: string;
  fallback?: string;
}

export function IconRenderer({
  name,
  fallback = 'Wallet',
  className,
  size = 20,
  ...props
}: IconRendererProps) {
  // Try to find icon in lucide-react exports
  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<LucideProps>>)[name] ||
    (Icons as unknown as Record<string, React.ComponentType<LucideProps>>)[fallback] ||
    Icons.Wallet;

  return <IconComponent size={size} className={className} {...props} />;
}
