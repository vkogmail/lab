import { coreValues } from '../tokens/generated/motion.generated';

export function resolveTokenReference(value: string | undefined): string | undefined {
  if (!value) return undefined;
  
  console.log('Resolving token:', value);
  
  // If the value is a reference (starts with '{' and ends with '}')
  if (value.startsWith('{') && value.endsWith('}')) {
    const key = value.slice(1, -1); // Remove the curly braces
    const resolved = coreValues[key as keyof typeof coreValues];
    console.log('Found core value:', key, '=', resolved);
    return resolved || value;
  }
  
  return value;
} 