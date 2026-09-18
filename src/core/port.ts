import getPort, { portNumbers } from 'get-port';

/**
 * Finds and reserves unique available ports for the requested services,
 * respecting any requested fixed ports if available, or picking
 * random ephemeral ports in the 40000-65535 range so projects never collide.
 */
export async function allocateUniquePorts(
  count: number,
  preferredPorts: (number | undefined)[] = []
): Promise<number[]> {
  const allocated = new Set<number>();
  const results: number[] = [];

  for (let i = 0; i < count; i++) {
    const preferred = preferredPorts[i];
    let port: number;

    if (preferred && !allocated.has(preferred)) {
      port = await getPort({
        port: preferred,
        exclude: Array.from(allocated),
      });
    } else {
      // Pick a random starting point in the high ephemeral range (40000 - 60000)
      const randomStart = 40000 + Math.floor(Math.random() * 20000);
      port = await getPort({
        port: portNumbers(randomStart, 65535),
        exclude: Array.from(allocated),
      });
    }

    allocated.add(port);
    results.push(port);
  }

  return results;
}
