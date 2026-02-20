/**
 * Stol koordinatları: backend 0–100 ↔ platform 3D (-5.5..5.5, -5..5).
 * AdminReservationsPage və ReservationsPage eyni çevirmə ilə istifadə etməlidir.
 */

export const PLATFORM_BOUNDS = { minX: -5.5, maxX: 5.5, minZ: -5, maxZ: 5 };
const PLATFORM_RANGE_X = PLATFORM_BOUNDS.maxX - PLATFORM_BOUNDS.minX; // 11
const PLATFORM_RANGE_Z = PLATFORM_BOUNDS.maxZ - PLATFORM_BOUNDS.minZ; // 10

/** Backend 0–100 koordinatını platforma (-5.5..5.5, -5..5) çevirir (3D görüntü üçün) */
export function backendToPlatformPosition(
  backendX: number,
  backendZ: number
): [number, number, number] {
  const x = (Number(backendX ?? 0) / 100) * PLATFORM_RANGE_X + PLATFORM_BOUNDS.minX;
  const z = (Number(backendZ ?? 0) / 100) * PLATFORM_RANGE_Z + PLATFORM_BOUNDS.minZ;
  return [x, 0, z];
}

/** Platform koordinatını backend 0–100 (mənfi olmaz) çevirir */
export function platformToBackendPosition(
  platformX: number,
  platformZ: number
): { positionX: number; positionY: number } {
  const positionX = Math.max(
    0,
    Math.min(100, ((Number(platformX) - PLATFORM_BOUNDS.minX) / PLATFORM_RANGE_X) * 100)
  );
  const positionY = Math.max(
    0,
    Math.min(100, ((Number(platformZ) - PLATFORM_BOUNDS.minZ) / PLATFORM_RANGE_Z) * 100)
  );
  return { positionX, positionY };
}
