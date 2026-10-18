import Redis from "ioredis";

// In-memory fallback if Redis is not yet connected in local environment
const inMemoryStore = new Map<string, { rooms: Set<string>; participants: number }>();

let redisClient: Redis | null = null;

function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
    });
    redisClient.connect().catch(() => {
      // Redis unavailable locally, will fallback gracefully
      redisClient = null;
    });
    return redisClient;
  } catch {
    return null;
  }
}

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  currentActiveRooms: number;
  maxRooms: number;
  currentParticipants: number;
  maxParticipants: number;
}

/**
 * Atomically checks and acquires a quota lease for creating a meeting
 */
export async function acquireMeetingLease(
  collegeId: string,
  roomId: string,
  estimatedParticipants: number,
  maxAllowedRooms: number,
  maxAllowedParticipants: number
): Promise<QuotaCheckResult> {
  const redis = getRedisClient();

  if (redis && redis.status === "ready") {
    const roomsKey = `quota:${collegeId}:active_rooms`;
    const participantsKey = `quota:${collegeId}:active_participants`;

    const activeRooms = await redis.scard(roomsKey);
    const activeParticipants = parseInt((await redis.get(participantsKey)) || "0", 10);

    if (activeRooms >= maxAllowedRooms) {
      return {
        allowed: false,
        reason: `Maximum concurrent rooms limit reached (${activeRooms}/${maxAllowedRooms}). Upgrade plan for additional concurrent classrooms.`,
        currentActiveRooms: activeRooms,
        maxRooms: maxAllowedRooms,
        currentParticipants: activeParticipants,
        maxParticipants: maxAllowedParticipants,
      };
    }

    if (activeParticipants + estimatedParticipants > maxAllowedParticipants) {
      return {
        allowed: false,
        reason: `Projected participants exceed college quota (${activeParticipants + estimatedParticipants}/${maxAllowedParticipants}).`,
        currentActiveRooms: activeRooms,
        maxRooms: maxAllowedRooms,
        currentParticipants: activeParticipants,
        maxParticipants: maxAllowedParticipants,
      };
    }

    // Atomic lease acquisition
    await redis.sadd(roomsKey, roomId);
    await redis.incrby(participantsKey, estimatedParticipants);
    // Set 4-hour expiration safety TTL on keys
    await redis.expire(roomsKey, 14400);
    await redis.expire(participantsKey, 14400);

    return {
      allowed: true,
      currentActiveRooms: activeRooms + 1,
      maxRooms: maxAllowedRooms,
      currentParticipants: activeParticipants + estimatedParticipants,
      maxParticipants: maxAllowedParticipants,
    };
  }

  // Fallback in-memory
  let collegeState = inMemoryStore.get(collegeId);
  if (!collegeState) {
    collegeState = { rooms: new Set(), participants: 0 };
    inMemoryStore.set(collegeId, collegeState);
  }

  if (collegeState.rooms.size >= maxAllowedRooms) {
    return {
      allowed: false,
      reason: `Maximum concurrent rooms limit reached (${collegeState.rooms.size}/${maxAllowedRooms}).`,
      currentActiveRooms: collegeState.rooms.size,
      maxRooms: maxAllowedRooms,
      currentParticipants: collegeState.participants,
      maxParticipants: maxAllowedParticipants,
    };
  }

  collegeState.rooms.add(roomId);
  collegeState.participants += estimatedParticipants;

  return {
    allowed: true,
    currentActiveRooms: collegeState.rooms.size,
    maxRooms: maxAllowedRooms,
    currentParticipants: collegeState.participants,
    maxParticipants: maxAllowedParticipants,
  };
}

/**
 * Releases a meeting lease when meeting ends
 */
export async function releaseMeetingLease(
  collegeId: string,
  roomId: string,
  estimatedParticipants: number
): Promise<void> {
  const redis = getRedisClient();

  if (redis && redis.status === "ready") {
    const roomsKey = `quota:${collegeId}:active_rooms`;
    const participantsKey = `quota:${collegeId}:active_participants`;

    await redis.srem(roomsKey, roomId);
    const remaining = await redis.decrby(participantsKey, estimatedParticipants);
    if (remaining < 0) {
      await redis.set(participantsKey, "0");
    }
    return;
  }

  const collegeState = inMemoryStore.get(collegeId);
  if (collegeState) {
    collegeState.rooms.delete(roomId);
    collegeState.participants = Math.max(0, collegeState.participants - estimatedParticipants);
  }
}
