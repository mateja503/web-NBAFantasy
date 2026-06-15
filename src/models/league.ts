import { Team } from './team';

/**
 * Canonical League domain model. Previously duplicated as both a class here and
 * an interface in league-service.ts; consolidated into this single definition.
 */
export interface League {
  leagueid: number;
  name: string;
  commissioner: number;
  seasonyear: string;
  weeksforseason?: number;
  transactionlimit?: number;
  autostart?: boolean;
  typetransactionlimits?: number;
  typeleague?: number;
  draftstyle?: number;
  statsvalueid?: number;
  commissionersTeam?: Team;
}
