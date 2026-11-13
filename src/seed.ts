import raw from '../data/seed.json';
import type { Garment, Piece, Seed, Standing, User } from './types';

/** The one place demo data enters the app. */
export const seed = raw as unknown as Seed;

export const ME = seed.me;

const garmentsById = new Map(seed.garments.map((g) => [g.id, g]));
const usersById = new Map(seed.users.map((u) => [u.id, u]));
const piecesById = new Map(seed.drop.pieces.map((p) => [p.id, p]));

export const garment = (id: string): Garment => garmentsById.get(id)!;
export const user = (id: string): User => usersById.get(id)!;
export const piece = (id: string): Piece | undefined => piecesById.get(id);
export const me = (): User => user(ME);

/** League rows from the seed: known users by id, everyone else by display name. */
export function seedStandings(): Standing[] {
  return seed.league.members.map(([who, points]) => {
    const u = usersById.get(who);
    return u
      ? { id: u.id, name: u.name, initial: u.initial, points }
      : { id: who, name: who, initial: who[0], points };
  });
}
