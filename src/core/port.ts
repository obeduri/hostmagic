import getPort, { portNumbers } from 'get-port';

/**
 * Finds and reserves unique available ports for the requested number of services.
 */
export async function allocateUniquePorts(count: number): Promise<number[]> {
  const allocated = new Set<number>();

  for (let i = 0; i < count; i++) {
    // Avoid ports already reserved in this session
    const port = await getPort({
      port: portNumbers(3000 + i * 100, 60000),
      exclude: Array.from(allocated),
    });
    allocated.add(port);
  }

  return Array.from(allocated);
}
